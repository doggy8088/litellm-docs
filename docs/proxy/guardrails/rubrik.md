import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Rubrik 防護欄 {#rubrik-guardrail}

使用 Rubrik 的審核與記錄整合，將提示與回應送交外部政策服務進行篩選，並批次記錄所有 LLM 請求/回應。

**主要功能：**

- **提示審核** (`pre_call`)：在呼叫 LLM 前篩選提示。適用於 OpenAI 與 Anthropic 的 wire format。
- **回應審核** (`post_call`)：在 LLM 回傳後篩選助理的回應文字與工具呼叫。兩者皆可被封鎖。
- **串流**：串流會先緩衝，直到組裝完成的回應通過審核，因此任何被標記的區塊都不會在封鎖前送達用戶端。
- **批次記錄**：以可設定的抽樣與批次處理方式，將所有 LLM 請求與回應記錄到 Rubrik。無論抽樣與否，遭封鎖的請求一律會被記錄。
- **開放式失敗**：如果 Rubrik 服務無法使用，請求會原樣允許通過。

---

## 快速開始 {#quick-start}

### 1. 設定 `config.yaml` {#1-configure-configyaml}

認證資訊可直接在 YAML 設定中指定，或透過環境變數設定。建議使用設定檔方式。

<Tabs>
<TabItem value="config" label="config.yaml (建議)" default>

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "rubrik"
    litellm_params:
      guardrail: rubrik
      mode: ["pre_call", "post_call"]
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
      mode: ["pre_call", "post_call"]
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
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "rubrik"
    litellm_params:
      guardrail: rubrik
      mode: ["pre_call", "post_call"]
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
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

這些會在您的 `guardrails.[].litellm_params` 中的 `config.yaml` 下設定：

| 參數 | 必填 | 說明 |
|-----------|----------|-------------|
| `guardrail: rubrik` | 是 | 選取 Rubrik guardrail 整合 |
| `mode` | 是 | 用於提示審核的 `"pre_call"`、用於回應審核的 `"post_call"`，或同時包含兩者的清單 |
| `api_base` | 是 | Rubrik webhook 基礎 URL。可使用 `os.environ/RUBRIK_WEBHOOK_URL`。若未提供，則回退至 `RUBRIK_WEBHOOK_URL` 環境變數。 |
| `api_key` | 否 | Rubrik API 金鑰。可使用 `os.environ/RUBRIK_API_KEY`。若未提供，則回退至 `RUBRIK_API_KEY` 環境變數。 |
| `default_on` | 否 | 當 `true` 時，guardrail 會在所有請求上執行。若未提供，則解析為 `false`，且呼叫端可透過 `"guardrails": ["rubrik"]` 於每個請求選擇啟用 |

### 環境變數 {#environment-variables}

當 YAML 設定中未設定 `api_base` / `api_key` 時，這些可作為選用的備援。`RUBRIK_SAMPLING_RATE` 與 `RUBRIK_BATCH_SIZE` 只能透過環境變數設定。

| 變數 | 必填 | 預設值 | 說明 |
|----------|----------|---------|-------------|
| `RUBRIK_WEBHOOK_URL` | 僅當設定中沒有 `api_base` 時需要 | — | Rubrik webhook 服務的基礎 URL |
| `RUBRIK_API_KEY` | 否 | — | 用於向 Rubrik 服務驗證的 Bearer token |
| `RUBRIK_SAMPLING_RATE` | 否 | `1.0` | 要 **記錄** 的請求比例（0.0 至 1.0）。不影響一律執行的審核，也不影響封鎖記錄。設定為 `0.5` 可記錄約 50% 的請求。 |
| `RUBRIK_BATCH_SIZE` | 否 | `512` | 在清空前要先緩衝的記錄項目數量。記錄也會在固定週期內清空。 |

---

## 審核運作方式 {#how-moderation-works}

在 `pre_call`，guardrail 會將標準化後的提示以一般 OpenAI chat completions 請求的形式傳送至 `{api_base}/v1/before_prompt/openai/v1`。服務會回傳 `{}` 以允許通過，或回傳其中 `choices[0].message.content` 承載拒絕原因的 chat completion。若遭拒絕，LLM 絕不會被呼叫。

在 `post_call`，guardrail 會將助理的文字與工具呼叫傳送至 `{api_base}/v1/after_completion/openai/v1`。服務會回傳經審核後的回應；被移除的工具呼叫或被替換的回應文字都會視為封鎖。

遭封鎖的請求會回傳政策說明並附上 `finish_reason: content_filter`，而不是原始回應。若任一服務無法連線或回傳錯誤，guardrail 會**開放式失敗**，請求會原樣繼續。

### 請求／回應格式 {#requestresponse-format}

在 `post_call`，guardrail 會傳送 JSON 信封：

```json
{
  "request": {
    "messages": [...],
    "model": "{{openai_large}}",
    "tools": [...]
  },
  "response": {
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "...",
        "tool_calls": [...]
      }
    }]
  }
}
```

`request.tools` 會帶有呼叫端宣告的工具清單，以便服務可將回傳的工具呼叫與之比對。服務應回傳僅包含**允許**工具呼叫的 OpenAI chat completion，並讓 `content` 帶有替換文字或封鎖說明。

---

## 批次記錄如何運作 {#how-batch-logging-works}

所有 LLM 請求（成功與失敗）都會排入佇列，並以批次傳送至 `{api_base}/v1/litellm/batch`。

- 當佇列達到 `RUBRIK_BATCH_SIZE`（預設 512）或到達週期性間隔（預設 5 秒）時，記錄會被清空。這些預設值來自 LiteLLM 的全域設定。
- 使用 `RUBRIK_SAMPLING_RATE` 可在高流量部署中降低記錄量。抽樣只會影響一般記錄；審核一律會執行，且封鎖一律會被記錄。
- 所有提供者的記錄 ID 都會正規化為 `litellm_call_id`，因此同一請求的審核記錄、封鎖記錄與批次記錄會共用相同的關聯鍵。
