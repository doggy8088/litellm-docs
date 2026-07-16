import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Rubrik 防護欄 {#rubrik-guardrail}

使用 Rubrik 的工具封鎖與記錄整合，將 LLM 工具呼叫與外部政策服務驗證，並將所有 LLM 請求／回應以批次記錄。

**主要功能：**

- **工具封鎖**：在 LLM 完成後，針對外部 Rubrik 服務驗證工具呼叫。遭封鎖的工具呼叫會觸發政策違規回應。
- **批次記錄**：以可設定的取樣與批次處理，將所有 LLM 請求與回應記錄到 Rubrik。
- **寬鬆失敗**：如果工具封鎖服務無法使用，請求會在不變更的情況下直接通過。

---

## 快速開始 {#quick-start}

### 1. 設定 `config.yaml` {#1-configure-configyaml}

認證資訊可直接在 YAML 設定中指定，或透過環境變數設定。建議使用設定檔方式。

<Tabs>
<TabItem value="config" label="config.yaml (建議)" default>

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "rubrik"
    litellm_params:
      guardrail: rubrik
      mode: "post_call"
      api_key: "your-rubrik-api-key"
      api_base: "https://your-rubrik-service.example.com"
      default_on: true
```

您也可以在設定中參照環境變數：

```yaml
guardrails:
  - guardrail_name: "rubrik"
    litellm_params:
      guardrail: rubrik
      mode: "post_call"
      api_key: os.environ/RUBRIK_API_KEY
      api_base: os.environ/RUBRIK_WEBHOOK_URL
      default_on: true
```

</TabItem>
<TabItem value="env" label="環境變數">

或者，您也可以完全透過環境變數設定 Rubrik 服務 URL 與 API 金鑰。設定後，若 `api_base` / `api_key` 未在設定中提供，便會作為備援使用。

```bash
export RUBRIK_WEBHOOK_URL="https://your-rubrik-service.example.com"
export RUBRIK_API_KEY="your-rubrik-api-key"
```

使用最小設定：

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "rubrik"
    litellm_params:
      guardrail: rubrik
      mode: "post_call"
      default_on: true
```

</TabItem>
</Tabs>

### 2. 啟動 Proxy {#2-launch-the-proxy}

```bash
litellm --config config.yaml --port 4000
```

### 3. 測試 {#3-test-it}

```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "What is the weather in SF?"}],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {"type": "string"}
            },
            "required": ["location"]
          }
        }
      }
    ]
  }'
```

---

## 設定參考 {#configuration-reference}

### YAML 設定參數 {#yaml-config-parameters}

這些會在您的 `config.yaml` 中的 `guardrails.[].litellm_params` 下設定：

| 參數 | 必填 | 說明 |
|-----------|----------|-------------|
| `guardrail: rubrik` | 是 | 選取 Rubrik 防護欄整合 |
| `mode: "post_call"` | 是 | 在收到 LLM 回應後執行 |
| `api_base` | 是 | Rubrik webhook 基礎 URL。可使用 `os.environ/RUBRIK_WEBHOOK_URL`。若省略，則回退至 `RUBRIK_WEBHOOK_URL` 環境變數。 |
| `api_key` | 否 | Rubrik API 金鑰。可使用 `os.environ/RUBRIK_API_KEY`。若省略，則回退至 `RUBRIK_API_KEY` 環境變數。 |
| `default_on` | 否 | 當 `true` 時，防護欄會在所有請求上執行，無需每次請求個別啟用 |

### 環境變數 {#environment-variables}

當 YAML 設定中未設定 `api_base` / `api_key` 時，這些可作為選用的備援。`RUBRIK_SAMPLING_RATE` 與 `RUBRIK_BATCH_SIZE` 只能透過環境變數設定。

| 變數 | 必填 | 預設值 | 說明 |
|----------|----------|---------|-------------|
| `RUBRIK_WEBHOOK_URL` | 只有在設定中未包含 `api_base` 時需要 | — | Rubrik webhook 服務的基礎 URL |
| `RUBRIK_API_KEY` | 否 | — | 用於向 Rubrik 服務驗證的 Bearer 權杖 |
| `RUBRIK_SAMPLING_RATE` | 否 | `1.0` | 要**記錄**的請求比例（0.0 到 1.0）。不影響工具封鎖，工具封鎖一律執行。設為 `0.5` 可記錄約 50% 的請求。 |
| `RUBRIK_BATCH_SIZE` | 否 | `512` | 在清空前暫存的記錄項目數。記錄也會依週期性間隔清空。 |

---

## 工具封鎖如何運作 {#how-tool-blocking-works}

1. 當 LLM 傳回包含工具呼叫的回應後，Rubrik 防護欄會將其送至位於 `{api_base}/v1/after_completion/openai/v1` 的封鎖服務。
2. 該服務會根據已設定的政策評估每個工具呼叫，並回傳 **允許** 的工具呼叫集合。
3. 如果有任何工具呼叫遭封鎖，Proxy 會傳回政策違規說明作為回應，而不是原始 LLM 回應。
4. 如果封鎖服務無法連線或回傳錯誤，防護欄會**寬鬆失敗**——原始回應會在不變更的情況下傳回。

### 請求／回應格式 {#requestresponse-format}

防護欄會將 JSON 信封傳送至封鎖服務：

```json
{
  "request": {
    "messages": [...],
    "model": "gpt-4",
    "proxy_server_request": {...}
  },
  "response": {
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "choices": [{
      "message": {
        "role": "assistant",
        "tool_calls": [...]
      }
    }]
  }
}
```

服務應回傳 OpenAI chat completion 格式的回應，其中只包含 **允許** 的工具呼叫，以及可選的 `content` 欄位，用於提供封鎖說明。

---

## 批次記錄如何運作 {#how-batch-logging-works}

所有 LLM 請求（成功與失敗）都會排入佇列，並以批次傳送至 `{api_base}/v1/litellm/batch`。

- 當佇列達到 `RUBRIK_BATCH_SIZE`（預設 512）或依週期性間隔（預設 5 秒）時，會清空記錄。這些預設值承襲自 LiteLLM 的全域設定。
- 在高流量部署中，使用 `RUBRIK_SAMPLING_RATE` 來降低記錄量。取樣只會影響記錄——不論取樣率為何，工具封鎖一律執行。
- 對於 Anthropic `/v1/messages` 請求，為了在工具封鎖與記錄之間保持一致，記錄 ID 會標準化為 `litellm_call_id`。
