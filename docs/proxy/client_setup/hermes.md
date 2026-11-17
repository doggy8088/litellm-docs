---
title: 搭配虛擬金鑰的 Hermes CLI
sidebar_label: 虛擬金鑰
---

# 使用虛擬金鑰將 Hermes 連接到 LiteLLM {#connect-hermes-to-litellm-with-a-virtual-key}

[Hermes Agent](https://github.com/NousResearch/hermes-agent) 可以將 LiteLLM 用作[具名自訂提供者](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/integrations/providers.md#named-custom-providers)。此設定會以您的 LiteLLM 虛擬金鑰，將模型請求送到閘道的 `/v1/chat/completions` 端點。

## 設定連線 {#configure-the-connection}

建立一把可存取支援工具呼叫之模型的[虛擬金鑰](../virtual_keys.md)。將下列內容加入 `~/.hermes/config.yaml`，並與您現有的設定合併：

```yaml title="~/.hermes/config.yaml"
providers:
  litellm:
    api: https://litellm.example.com/v1
    transport: chat_completions
    key_env: LITELLM_API_KEY

model:
  default: my-model
  provider: custom:litellm
```

將閘道 URL 與 `my-model` 替換為您的金鑰可使用的一個 `model_name`。URL 包含 `/v1`；Hermes 會附加 `/chat/completions`。

在您啟動 Hermes 的終端機中匯出金鑰：

```bash
export LITELLM_API_KEY="sk-<your-virtual-key>"
hermes
```

若要永久生效，請將 `LITELLM_API_KEY` 放在 `~/.hermes/.env` 中，Hermes 會從該處載入其憑證。請勿將金鑰放在 `config.yaml` 與原始碼版本控制中。

## 驗證 {#verify}

啟動一個新的 Hermes 工作階段並傳送提示。在 LiteLLM Admin UI 的 **Logs** 或 **Usage** 中確認該請求，其歸屬為您的虛擬金鑰與所選模型。在將所選模型用於代理程式任務之前，先以它測試一次工具呼叫。

若要透過您組織的身分提供者登入，請使用 [Hermes SSO](./hermes_sso.md)。若要新增對話追蹤，請參閱另一篇 [Hermes Lens 整合](../lens/integrations/hermes.md)。
