---
title: 搭配 Codex 使用您的 ChatGPT 訂閱
sidebar_label: ChatGPT 訂閱
description: 使用您的 ChatGPT 訂閱將 Codex 連接到 LiteLLM。設定模型、建立虛擬金鑰，並開始使用 CLI 或桌面應用程式。
---

# 搭配 Codex 使用您的 ChatGPT 訂閱 {#use-your-chatgpt-subscription-with-codex}

透過您自己的 ChatGPT 登入，將 Codex 請求經由 LiteLLM 傳送。LiteLLM 控制模型存取並記錄 token 用量；Codex 保留您的登入並負責更新。

## 前置條件 {#prerequisites}

- 已安裝 Codex CLI 或桌面應用程式，且 ChatGPT 帳戶可使用您選擇的模型。
- 一個運行中的 [LiteLLM proxy](../proxy/docker_quick_start.md) <SinceVersion v="1.109.0" />，並搭配 PostgreSQL 以支援虛擬金鑰與記錄。

## 步驟 1：設定 proxy {#step-1-configure-the-proxy}

將兩個項目都加入 proxy 的 `model_list`，然後重新啟動 proxy。如果您的管理員已設定好，可以跳過此步驟。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: "gpt-*"
    litellm_params:
      model: "chatgpt/gpt-*"
    model_info:
      mode: responses

  - model_name: "codex-*"
    litellm_params:
      model: "chatgpt/codex-*"
    model_info:
      mode: responses
```

`gpt-*` 會透過 ChatGPT 路由 GPT 模型，包括 Codex 圖片生成工具用的 `gpt-image-2`。`codex-*` 也會路由 Codex 請求，例如執行核准檢查的 `codex-auto-review`。您不需要為每個模型各設一個項目，也不需要在 proxy 上放 OpenAI API 金鑰或 ChatGPT 驗證檔案。您的訂閱決定了您可以使用的模型。

## 步驟 2：建立並儲存虛擬金鑰 {#step-2-create-and-save-a-virtual-key}

在 proxy 儀表板中，開啟 **Virtual Keys → + Create New Key**。輸入名稱，在 **Models** 下同時選取 `gpt-*` 與 `codex-*`，然後建立金鑰。如果您已有金鑰，請先允許這兩個模式再於下方使用。

將金鑰儲存在 `~/.codex/.env`。應用程式與 CLI 都會讀取這個檔案。如有需要請建立它；如果金鑰已存在，請將其取代。

```dotenv title="~/.codex/.env"
LITELLM_API_KEY=sk-<your-litellm-virtual-key>
```

將預留位置換成您的金鑰。執行 `chmod 600 ~/.codex/.env` 以保持檔案私密。

## 步驟 3：連接 Codex {#step-3-connect-codex}

開啟 `~/.codex/config.toml`，或在應用程式中使用 **Settings → Configuration → Open config.toml**。保留您的模型與推理設定。在任何 `[table]` 標題上方更新 `model_provider`，然後加入這個提供者：

```toml title="~/.codex/config.toml"
model_provider = "litellm_subscription"

[model_providers.litellm_subscription]
name = "LiteLLM subscription"
base_url = "http://localhost:4000/v1"
wire_api = "responses"
supports_websockets = false
requires_openai_auth = true
env_http_headers = { "x-litellm-api-key" = "LITELLM_API_KEY" }
```

將 `http://localhost:4000` 換成您的 proxy URL。讓 `env_key` 保持未設定，讓 Codex 使用您的 ChatGPT 登入。

儲存檔案並**重新啟動 Codex**。如有需要，請以 ChatGPT 登入，然後開始新的聊天並選擇您的模型。

### 或使用 `lite` 啟動 CLI {#lite-cli}

[`lite` CLI](../proxy/management_cli.md) 可以在每次啟動 Codex CLI 時設定這個提供者 <SinceVersion v="1.109.0" />，因此您可以跳過上方的 `~/.codex/.env` 與 `config.toml` 編輯。使用步驟 2 的虛擬金鑰：

```bash
export LITELLM_PROXY_URL=http://localhost:4000
export LITELLM_PROXY_API_KEY=sk-<your-litellm-virtual-key>
lite codex --subscription -m gpt-<model>
```

`lite` 會印出 `(keeping your ChatGPT login)` 並啟動 Codex；Codex 會保留您的 ChatGPT 登入，並在 `x-litellm-api-key` 標頭中傳送您的 LiteLLM 金鑰。

若要將此設為預設，請執行 `lite config set codex_subscription true`。若只要在單一工作階段將 LiteLLM 金鑰作為 Codex 的 API 金鑰傳送，請傳入 `--no-subscription`。

## 步驟 4：驗證請求 {#step-4-verify-a-request}

傳送：**Reply with exactly Hello. Do not use tools.**

您應該會收到 `Hello`。在 LiteLLM 儀表板中，開啟 **Logs**，找到帶有您的模型、虛擬金鑰以及輸入/輸出 token 數的成功請求。

若要讓 LiteLLM 為每個回合挑選 ChatGPT 模型，請參閱 [搭配 Codex 與您的 ChatGPT 訂閱使用 Auto Router](./codex_chatgpt_auto_router.md)。

## 步驟 5：新增付費備援（選用） {#step-5-add-a-paid-fallback-optional}

若要在訂閱達到上限時繼續工作，請加入以 API 為後盾的部署作為備援。**API 用量會另外計費。** 備援也可能在其他請求失敗時觸發，不僅限於配額錯誤。

兩個部署都使用相同的 `gpt-*` 萬用字元。`order: 1` 先嘗試 ChatGPT；`order: 2` 透過 OpenAI API 使用相同模型。將此合併到 proxy 的 `config.yaml` 中，並保留您的其他模型與設定：

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: "gpt-*"
    litellm_params:
      model: "chatgpt/gpt-*"
      order: 1
    model_info:
      mode: responses

  - model_name: "gpt-*"
    litellm_params:
      model: "openai/gpt-*"
      api_key: os.environ/OPENAI_API_KEY
      order: 2
    model_info:
      mode: responses

  - model_name: "codex-*"
    litellm_params:
      model: "chatgpt/codex-*"
    model_info:
      mode: responses
```

在 **proxy 的環境**中設定 `OPENAI_API_KEY`，然後重新啟動 proxy。您的 Codex 設定、`codex-*` 部署，以及虛擬金鑰對兩個模式的存取權保持不變。

Luna 會備援到 API Luna；Astra 會備援到 API Astra。模型必須同時可供您的訂閱與 API 帳戶使用。查看 **Logs** 以確認哪個部署處理了請求及其 API 成本。更多選項請參閱[部署排序](../proxy/load_balancing.md#deployment-ordering-priority)。

## 限制 {#limits}

您的 ChatGPT 方案決定模型存取與配額。若要在達到上限後繼續使用，請設定[選用的付費備援](#step-5-add-a-paid-fallback-optional)。ChatGPT 請求在 LiteLLM 中記錄的成本為 $0；請使用請求或 token 速率限制來控管用量。

<details>
<summary>憑證的處理方式</summary>

您的 LiteLLM 金鑰授權閘道存取。您的 ChatGPT 登入授權 OpenAI 用量，且優先於已儲存的閘道登入。Codex 負責登入與更新；LiteLLM 為該請求轉送登入，並在記錄回呼中遮蔽憑證標頭。閘道金鑰與 cookie 會在轉送前移除。

明確的 ChatGPT 工作區選擇會被保留，供 OpenAI 驗證。閘道與 ChatGPT 身分會各自獨立驗證。託管部署請參閱 [OpenAI 的閘道指南](https://learn.chatgpt.com/docs/enterprise/sign-in-with-chatgpt-through-a-gateway)。

</details>

<details>
<summary>Pi 與原生 Codex 相容性</summary>

### Pi {#pi}

在 Pi 中，執行 `/login` 並選擇內建的 OpenAI Codex 提供者。在啟動 Pi 的終端機中匯出您的金鑰：

```bash
export LITELLM_API_KEY="sk-<your-litellm-virtual-key>"
```

將此覆寫加入 `~/.pi/agent/models.json`：

```json title="~/.pi/agent/models.json"
{
  "providers": {
    "openai-codex": {
      "baseUrl": "http://localhost:4000/backend-api/codex",
      "headers": {
        "x-litellm-api-key": "LITELLM_API_KEY"
      }
    }
  }
}
```

換成您的 proxy URL，從該終端機重新啟動 Pi，然後選擇您的訂閱與 LiteLLM 金鑰允許的模型。標頭值是環境變數的名稱；請保留 Pi 的內建訂閱登入。

Codex 也可使用這條原生路由：將其提供者的 `base_url` 改為 `http://localhost:4000/backend-api/codex`。原生請求不需要 `model_list` 項目，並使用上游模型名稱，沒有路由器別名或備援。金鑰必須允許所請求的模型。支援 HTTP/SSE；不支援原生 WebSockets。

</details>

## 疑難排解 {#troubleshooting}

| 問題 | 修復方式 |
|---|---|
| 閘道拒絕金鑰 | 檢查 `~/.codex/.env` 中的 `LITELLM_API_KEY`，並重新啟動 Codex。 |
| 模型存取被拒 | 在金鑰上允許 `gpt-*` 與 `codex-*`，並選擇您的訂閱支援的模型。 |
| OpenAI 拒絕登入或模型 | 重新以 ChatGPT 登入，並選擇您的方案支援的模型。 |
| LiteLLM 中沒有出現請求 | 檢查 `model_provider` 與 `base_url`，然後開始新的 Codex 聊天。 |

對於閘道擁有的帳戶，請使用 [ChatGPT 提供者指南](../providers/chatgpt.md)。
