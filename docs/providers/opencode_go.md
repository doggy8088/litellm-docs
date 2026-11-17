---
title: "搭配 LiteLLM AI Gateway 的 OpenCode Go API"
sidebar_label: "OpenCode Go"
description: "透過 LiteLLM 使用 OpenCode Go，只需一組 API 金鑰，支援自動 API 格式選取、工作階段親和性，以及預估的 token 使用成本。"
---

# OpenCode Go {#opencode-go}

透過 LiteLLM 使用您的 OpenCode Go 或 Go Plus 訂閱，並使用 `opencode_go/` 模型前綴。LiteLLM 會為每個受支援的模型選取上游 API 格式，並將使用量記錄在 OpenCode Go 提供者之下。

OpenCode Go 是託管的推論服務。OpenCode 程式設計應用程式也可以透過 LiteLLM 使用其他提供者。此設定方式請參閱 [OpenCode 快速入門](../tutorials/opencode_integration.md)。

## 連接您的 Go 帳戶 {#connect-your-go-account}

您需要有效的 Go 或 Go Plus 訂閱，以及從 [OpenCode Console](https://opencode.ai/console) 取得的 API 金鑰。請依 [Console API 文件](https://opencode.ai/v2/docs/console/models/) 的說明使用個人或服務 API 金鑰。在 OpenCode 應用程式中以訂閱登入，並不會自動為 LiteLLM 完成驗證。

請在執行 LiteLLM 的 shell 中設定金鑰。將預留位置換成您的金鑰，並避免將它納入原始碼管理。

```bash
export OPENCODE_API_KEY="your-opencode-api-key"
```

### Python SDK {#python-sdk}

```python
from litellm import completion, completion_cost

response = completion(
    model="opencode_go/glm-5.3-flash",
    messages=[{"role": "user", "content": "Say hello."}],
    litellm_session_id="my-conversation-1",
)

print(response.choices[0].message.content)
print(response.usage)
print(completion_cost(completion_response=response))
```

呼叫成功後會回傳助理的問候內容與 token 使用量。在同一對話的後續輪次中重複使用該工作階段 ID。

### LiteLLM 閘道 {#litellm-gateway}

將以下內容儲存為 `config.yaml`：

```yaml keep-model-ids
model_list:
  - model_name: go-chat
    litellm_params:
      model: opencode_go/glm-5.3-flash
      api_key: os.environ/OPENCODE_API_KEY
  - model_name: go-responses
    litellm_params:
      model: opencode_go/gpt-6-luna
      api_key: os.environ/OPENCODE_API_KEY
  - model_name: go-messages
    litellm_params:
      model: opencode_go/claude-haiku-5-5
      api_key: os.environ/OPENCODE_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

設定您的閘道金鑰並啟動伺服器：

```bash
export LITELLM_MASTER_KEY="your-litellm-gateway-key"
litellm --config config.yaml --host 127.0.0.1 --port 4000
```

檢查連線：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -H 'x-litellm-session-id: my-conversation-1' \
  -d '{"model":"go-chat","messages":[{"role":"user","content":"Say hello."}]}'
```

回應會在 `choices[0].message.content` 中包含問候內容。請將上游 OpenCode 金鑰保留在閘道上；用戶端使用 LiteLLM 金鑰。

## 搭配此閘道使用 OpenCode {#use-opencode-with-this-gateway}

將此提供者加入您專案的 `opencode.json`，或將它合併到您現有的 `provider` 物件中：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm-go": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM Go",
      "options": {
        "baseURL": "http://localhost:4000/v1",
        "apiKey": "{env:LITELLM_MASTER_KEY}"
      },
      "models": {
        "go-chat": {"name": "Go Chat"},
        "go-responses": {"name": "Go Responses"},
        "go-messages": {"name": "Go Messages"}
      }
    }
  }
}
```

在已設定 `LITELLM_MASTER_KEY` 的 shell 中，從該專案啟動 `opencode`。執行 `/models`，在 **LiteLLM Go** 之下選擇一個模型，然後傳送訊息。此設定在 OpenCode 與 LiteLLM 之間使用 Chat Completions；LiteLLM 會將請求轉換為所選 Go 模型的上游格式。

## API 格式與工作階段 {#api-formats-and-sessions}

LiteLLM 接受 Chat Completions、Responses 與 Anthropic Messages 請求。上游格式由模型型錄決定，可能與用戶端的格式不同。原生 Responses 模型使用 `/responses`，原生 Messages 模型使用 `/messages`，其他請求則使用 LiteLLM 既有的轉換路徑。Gemini 模型使用 Go 的 Google 相容端點。不支援 Responses WebSocket 傳輸。

如需直接發送 Responses 請求，請搭配 `go-responses` 使用 `/v1/responses`。如需直接發送 Anthropic Messages 請求，請搭配 `go-messages` 使用 `/v1/messages`，並依該 API 的要求提供 `max_tokens`。

LiteLLM 會將提供的穩定工作階段 ID 以 `x-opencode-session` 轉送。SDK 呼叫請傳入 `litellm_session_id`；閘道呼叫請傳送 `x-litellm-session-id`。明確指定的 `x-opencode-session` 標頭優先。若未提供任何工作階段 ID，LiteLLM 不會自行產生。請參閱 [Go 的用戶端與工作階段要求](https://opencode.ai/v2/docs/console/go/)。

## 模型與定價 {#models-and-pricing}

請使用 [Go 模型清單](https://opencode.ai/v2/docs/console/go/) 中的模型 ID，並加上 `opencode_go/` 前綴。帳戶權限、區域設定、訓練偏好設定與可用額度都可能限制您可以呼叫的模型。如有需要，您可以在 OpenCode Console 中變更這些偏好設定。

LiteLLM 的型錄包含 Go 公布的輸入、輸出、快取讀取、快取寫入與內容層級費率（若有提供）。這些費率用來計算**預估的額度使用量**，而不是對每個請求額外收費。訂閱費用、滾動限制、重設、剩餘額度與額外使用量餘額仍由 OpenCode 管理。LiteLLM 的預算限制適用於它計算出的美元金額，並不反映您 Go 方案的限制。

對於有尖峰與離峰費率的 DeepSeek 模型，型錄使用公布的尖峰費率。因此，離峰請求顯示的預估值可能高於 OpenCode 實際扣除的額度。帳戶使用量的權威資料與[目前的費率表](https://opencode.ai/v2/docs/console/go/)請查閱 Console。模型費率與可用性可能獨立於 LiteLLM 的版本發布而變更。

現有搭配 OpenCode `api_base` 的 `openai/` 與 `anthropic/` 部署仍可繼續運作。將它們的模型前綴改為 `opencode_go/` 並移除明確的基礎 URL，即可使用自動通訊協定選取與 Go 專屬的型錄價格。

## 設定參考 {#configuration-reference}

| 設定 | 用途 |
| --- | --- |
| `api_key` | 供單一請求或部署使用的明確 OpenCode API 金鑰。 |
| `OPENCODE_GO_API_KEY` | 選用的 Go 專屬金鑰，優先於 `OPENCODE_API_KEY` 使用。 |
| `OPENCODE_API_KEY` | 預設的 OpenCode API 金鑰。 |
| `api_base` | 明確的上游基礎 URL 覆寫值。通常請省略此項。 |
| `OPENCODE_GO_API_BASE` | 在未設定 `api_base` 時使用的基礎 URL 覆寫值。單一覆寫值必須支援您所使用模型的格式。 |

LiteLLM 不會為此提供者備援使用 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`。若驗證失敗，請在 Console 中檢查 Go 金鑰與訂閱。若新加入的模型需要不同的上游通訊協定，請更新 LiteLLM 的模型型錄，或透過[自訂模型註冊](../completion/token_usage.md)註冊它的 `supported_endpoints` 與定價。
