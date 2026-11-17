---
title: 搭配 Codex 與您的 ChatGPT 訂閱使用 Auto Router
sidebar_label: Auto Router
description: 透過 LiteLLM auto router 路由 Codex，同時讓每位開發者保留自己的 ChatGPT 登入，並以虛擬金鑰或 SSO 登入作為閘道憑證。
---

# 搭配 Codex 與您的 ChatGPT 訂閱使用 Auto Router {#auto-router-with-codex-and-your-chatgpt-subscription}

LiteLLM [auto router](../proxy/auto_routing.md) 可以在每個 Codex 回合中挑選 ChatGPT 模型，同時讓每位開發者繼續使用自己的 ChatGPT 訂閱。每個請求接著會帶有兩種憑證。ChatGPT 登入放在 `Authorization` 中；它由 Codex 持有並刷新，LiteLLM 會將它轉送給該請求的 ChatGPT，不會儲存它。閘道憑證放在 `x-litellm-api-key` 中，決定誰可以使用 proxy 以及記錄誰的使用量。它是虛擬金鑰，或是來自 SSO 登入的短期權杖。

這兩種憑證是分開檢查的，因此可以來自不同的身分提供者，例如 ChatGPT 透過 Google、LiteLLM 透過 Okta。

## 前置條件 {#prerequisites}

請先完成[搭配 Codex 使用您的 ChatGPT 訂閱](./openai_codex_byok.md)，讓單一 `chatgpt/` 模型已經能從 Codex 運作。本頁假設您有 LiteLLM proxy <SinceVersion v="1.109.0" />。

## 步驟 1：加入 router {#step-1-add-the-router}

為每個 ChatGPT 模型建立各自的 `model_list` 項目，並將 complexity router 放在它們前面。將以下內容合併到您 proxy 的 `config.yaml` 並重新啟動 proxy：

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: gpt-6-astra-autorouter
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        classifier_type: heuristic
        classification_mode: user_turn
        context_compaction: false
        tiers:
          SIMPLE: gpt-6-luna
          MEDIUM: gpt-6-luna
          COMPLEX: gpt-6-astra
          REASONING: gpt-6-astra

  - model_name: gpt-6-luna
    litellm_params:
      model: chatgpt/gpt-6-luna
    model_info:
      mode: responses

  - model_name: gpt-6-astra
    litellm_params:
      model: chatgpt/gpt-6-astra
    model_info:
      mode: responses
```

`heuristic` 分類器在本機為每個請求評分，因此分類不會呼叫任何模型，ChatGPT 登入只會送到 `chatgpt.com/backend-api/codex`。請在使用它的每把虛擬金鑰上允許 router 名稱。

:::warning 保持 context compaction 關閉

在 router 上設定 `context_compaction: false`。開啟 compaction 時，每個被路由的請求都會失敗並出現 `ChatGPT device-code login needs a human and cannot run inside a running event loop`，因為 compaction 步驟查詢模型詳細資訊的方式會忽略轉送的登入。等修復推出後再將 compaction 開回來。

:::

## 步驟 2：將 router 加入 Codex 的模型型錄 {#step-2-add-the-router-to-codexs-model-catalog}

Codex 會在其型錄中查詢每個模型名稱。對於它認識的名稱，它會傳送簡短的請求。對於未知名稱，例如 router 別名，它會在每個請求中傳送所有工具定義；在測試中，這讓提示從每個請求約 13.5k 增加到約 155k 個 token，第一個 token 的時間從約 0.8 秒增加到約 5 秒，訂閱會快得多地用完。

建立一個型錄檔案，為 proxy 提供的每個模型建立一個項目。router 項目是 Codex 自己的 `gpt-6-astra` 項目的副本，帶有新的 `slug`、`display_name` 與 `description`；Astra 與 Luna 項目請原封不動地複製。每個項目約有 40 個欄位，大多是 Codex 的內建提示文字，`codex debug models --bundled` 會印出完整的項目供您複製。下方範例只顯示重要的欄位：

```json title="~/.codex/litellm_model_catalog.json" keep-model-ids
{
  "models": [
    {
      "slug": "gpt-6-astra-autorouter",
      "display_name": "GPT-6-Astra Auto Router",
      "description": "LiteLLM picks Luna or Astra for each turn.",
      "visibility": "list",
      "context_window": 272000,
      "use_responses_lite": true,
      "...": "every other field copied unchanged from the gpt-6-astra entry"
    },
    {
      "slug": "gpt-6-astra",
      "display_name": "GPT-6-Astra",
      "...": "copied unchanged"
    },
    {
      "slug": "gpt-6-luna",
      "display_name": "GPT-6-Luna",
      "...": "copied unchanged"
    }
  ]
}
```

`slug` 必須與 proxy 上 router 的 `model_name` 相符。`/model` 選取器只會列出此檔案中的項目，因此請排除 proxy 沒有提供的模型。由於這些項目是 Codex 自己的副本，請在更新 Codex 時一併更新它們。

接著將 Codex 指向該檔案並選取 router。兩者都是最上層的鍵，因此請將它們放在 `~/.codex/config.toml` 中第一個 `[table]` 標題的上方，並編輯既有的 `model` 行，而不是新增第二行：

```toml title="~/.codex/config.toml"
model = "gpt-6-astra-autorouter"
model_catalog_json = "/Users/<you>/.codex/litellm_model_catalog.json"
```

請使用完整路徑；當 Codex 以不同的 `HOME` 啟動時，`~` 路徑會無法解析。

若您不想維護型錄，可以用 Codex 已經認識的模型為 router 命名，例如 `gpt-6-astra`，並將真正的模型移到內部名稱，例如 `astra-upstream` 與 `luna-upstream`。如此一來，對 `gpt-6-astra` 的請求可以在 Luna 上執行，因此 **Logs** 中的 model 欄位（而不是模型群組）會顯示實際執行的是什麼。

## 步驟 3：選擇閘道憑證 {#step-3-choose-a-gateway-credential}

虛擬金鑰的運作方式如 [ChatGPT 訂閱教學](./openai_codex_byok.md#step-2-create-and-save-a-virtual-key)所述；將它儲存在 `~/.codex/.env` 並啟動 `codex`。

若要使用 SSO 登入，請在 proxy 上設定 [SSO for the Admin UI](../proxy/admin_ui_sso.md)，然後讓每位開發者以 [`lite` CLI](../proxy/cli_sso.md) 登入。兩種登入模式核發的權杖類型相同，預設存續 24 小時：

```bash
export LITELLM_PROXY_URL=https://litellm.example.com
lite login --pkce      # approve in the browser; print-token renews the token
lite login --no-pkce   # enter a code in the browser; sign in again each day
```

使用 `--pkce` 時，請在核准前確認 **Authorize CLI access** 頁面上指名的是您。`lite whoami` 會顯示您以誰的身分登入。以 `lite codex --subscription` 啟動 Codex，它會保留您的 ChatGPT 登入，並在 `x-litellm-api-key` 中傳送 SSO 權杖。

若您的 `lite` 版本沒有 `--subscription`，請自行匯出權杖，並在不啟動其背景伺服器的情況下啟動 Codex：

```bash
export LITELLM_API_KEY="$(lite auth print-token)" && [ -n "$LITELLM_API_KEY" ] && codex --no-daemon
```

`[ -n ... ]` 檢查可防止 Codex 以空金鑰啟動。此設定不要使用單純的 `lite codex` 或 `lite configure codex`；兩者都會在 `Authorization` 中傳送閘道憑證，那會取代 ChatGPT 登入。

## 步驟 4：驗證路由 {#step-4-verify-routing}

傳送一個簡短的提示，以及一個要求逐步推理的提示。在 LiteLLM 儀表板中開啟 **Logs**。每個請求會顯示 router 名稱作為模型群組、實際執行的 ChatGPT 模型作為模型，以及其中繼資料中的路由決策（tier 與 cause）。使用 SSO 時，使用者是您的 SSO 身分，金鑰是 `cli-session` 金鑰。

## Codex 的背景伺服器 {#codexs-background-server}

互動式 Codex 在共用的背景伺服器上執行其工作階段，`/status` 在這種情況下會顯示 `Local background server`。該伺服器傳送模型請求，並保持它啟動時的環境與設定，因此您之後匯出的金鑰不會傳到它那裡，之後對 `config.toml` 或型錄的變更也不會。

以 `codex --no-daemon` 啟動 Codex 以略過伺服器，或從已經有金鑰的 shell 重新啟動它，且在金鑰或設定變更時再次重新啟動：

```bash
export LITELLM_API_KEY="$(lite auth print-token)" && [ -n "$LITELLM_API_KEY" ] && codex app-server daemon restart
```

重新啟動會中斷在伺服器上執行的工作階段。對於每天變更的 SSO 權杖，`--no-daemon` 比較簡單。`codex exec` 不使用該伺服器，桌面應用程式則執行它自己的。

## 限制 {#limits}

閘道憑證控制存取與歸因，ChatGPT 登入決定使用誰的訂閱。LiteLLM 不會檢查這兩者是否屬於同一個人。

設定 `store_prompts_in_spend_logs: true` 時，每個儲存的請求都會包含其傳入標頭。ChatGPT 的 `authorization` 標頭會以 `REDACTED` 儲存，但 `chatgpt-account-id` 會原樣儲存。它可識別 ChatGPT 工作區，且無法用來呼叫 ChatGPT，但它會與提示一起保存。

## 疑難排解 {#troubleshooting}

| 問題 | 修正方式 |
|---|---|
| `LiteLLM Virtual Key expected ... This key has the structure of a JWT` | Codex 沒有傳送閘道金鑰，因此 proxy 讀取了 `Authorization` 中的 ChatGPT 登入。請檢查傳送請求的處理程序中是否已設定 `LITELLM_API_KEY`，並參閱 [Codex 的背景伺服器](#codexs-background-server)。 |
| 被路由的請求出現 `ChatGPT device-code login needs a human` | 在 router 上設定 `context_compaction: false` 並重新啟動 proxy。 |
| 提示超過 100k token | Codex 不認識該模型名稱。請檢查型錄項目與 `model_catalog_json`，然後重新啟動背景伺服器或使用 `--no-daemon`。 |
| `lite auth print-token` 顯示 `Not authenticated for this server` | 您的登入是針對與 `lite` 預設不同的 proxy。請傳入 `--base-url`，或執行 `lite config set base_url <proxy-url>`。 |
| **Authorize CLI access** 頁面指名 `default_user_id` | 瀏覽器以 proxy 管理員身分登入了儀表板。請拒絕、登出儀表板並重新登入，或使用 `lite login --no-pkce`。 |
| 每次 `lite login` 時 macOS 都要求輸入密碼 | 以 `security delete-generic-password -s litellm-cli -a credential` 刪除舊的鑰匙圈項目，或設定 `LITELLM_CLI_DISABLE_KEYRING=1`。 |

## 相關文件 {#related}

- [搭配 Codex 使用您的 ChatGPT 訂閱](./openai_codex_byok.md)
- [自動路由](../proxy/auto_routing.md)
- [CLI 驗證](../proxy/cli_sso.md)
- [搭配 Claude Code 與 Claude Desktop 使用 Auto Router](./claude_code_autorouter.md)
