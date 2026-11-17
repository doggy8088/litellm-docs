---
title: 搭配 SSO 的 Hermes CLI
sidebar_label: SSO
---

# 使用 SSO 將 Hermes 連接到 LiteLLM {#connect-hermes-to-litellm-with-sso}

Hermes 可以透過其 [`key_cmd` 提供者設定](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/integrations/providers.md#command-minted-credentials-key_cmd)，呼叫 [`lite auth print-token`](../cli_sso.md#use-the-credential-from-other-tools)。每位開發者登入 LiteLLM，而 Hermes 會在需要憑證時取得所產生的 token。

## 登入 {#sign-in}

安裝 [`lite` CLI](../management_cli.md#quick-start)。您的管理員必須設定閘道的 SSO 提供者，並啟用 [CLI 驗證](../cli_sso.md#prerequisites---start-litellm-proxy-with-beta-flag)。閘道必須支援[使用 PKCE 的瀏覽器登入](../cli_sso.md#browser-sign-in-with-pkce)，而您的 Hermes 版本必須支援自訂提供者上的 `key_cmd`。

```bash
lite --base-url https://litellm.example.com login --pkce
which lite
```

在瀏覽器中完成登入，並為您的請求選擇團隊。複製 `which lite` 印出的絕對執行檔路徑，供下一個步驟使用。

## 設定 Hermes {#configure-hermes}

將此提供者合併到 `~/.hermes/config.yaml` 中。將閘道 URL、執行檔路徑與 `my-model` 替換為您的 LiteLLM 使用者與團隊可使用的模型：

```yaml title="~/.hermes/config.yaml"
providers:
  litellm:
    api: https://litellm.example.com/v1
    transport: chat_completions
    key_cmd: "/absolute/path/to/lite --base-url https://litellm.example.com auth print-token"

model:
  default: my-model
  provider: custom:litellm
```

登入與 `key_cmd` 請使用相同的閘道 URL，且不加 `/v1`。提供者的 `api` URL 包含 `/v1`。若要從[虛擬金鑰設定](./hermes.md)轉換，請將 `key_env` 替換為 `key_cmd`，並移除任何行內的 `api_key`。啟動 Hermes 時不要傳遞 `--api-key`；該明確旗標會優先於 `key_cmd`。

Hermes 會快取該命令的 token，並在需要時再次呼叫它。`lite auth print-token` 只會將 token 寫入 stdout，並使用 PKCE 登入所儲存的 refresh token 來更新它。請求會繼承您的 LiteLLM 使用者與團隊權限、預算與模型存取權。

## 驗證 {#verify}

以 `hermes` 啟動新的工作階段，傳送提示，並在 LiteLLM Admin UI 的 **Logs** 或 **Usage** 中檢查您的使用者、所選團隊與模型。以您打算使用的模型測試工具呼叫。

如果協助工具回報登入已過期或無法使用，請再次執行相同的 `lite --base-url https://litellm.example.com login --pkce` 命令。閘道先決條件、token 儲存、更新與登出行為請參閱 [CLI 驗證](../cli_sso.md)。
