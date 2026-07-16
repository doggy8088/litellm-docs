import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Google Cloud Model Armor {#google-cloud-model-armor}

LiteLLM 透過 [Model Armor API](https://cloud.google.com/security-command-center/docs/model-armor-overview) 支援 Google Cloud Model Armor 防護欄。 

## 支援的防護欄 {#supported-guardrails}

- [Model Armor Templates](https://cloud.google.com/security-command-center/docs/manage-model-armor-templates) - 根據已設定的範本進行內容清理與封鎖

## 快速開始 {#quick-start}
### 1. 在您的 LiteLLM config.yaml 中定義防護欄  {#1-define-guardrails-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的防護欄

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: model-armor-shield
    litellm_params:
      guardrail: model_armor
      mode: [pre_call, during_call, post_call]  # Run on input, parallel, and output
      template_id: "your-template-id"  # Required: Your Model Armor template ID
      project_id: "your-project-id"    # Your GCP project ID
      location: "us-central1"          # GCP location (default: us-central1)
      credentials: "path/to/credentials.json"  # Path to service account key
      mask_request_content: true       # Enable request content masking
      mask_response_content: true      # Enable response content masking
      fail_on_error: true             # Fail request if Model Armor errors (default: true)
      default_on: true                # Run by default for all requests
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 **LLM 呼叫之前** 執行，於 **輸入** 上
- `during_call` 與 LLM 呼叫 **平行** 執行，於 **輸入** 上
- `post_call` 在 LLM 呼叫 **之後** 執行，於 **輸出** 上

### 2. 啟動 LiteLLM 閘道  {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求  {#3-test-request}

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hi, my email is test@example.com"}
    ],
    "guardrails": ["model-armor-shield"]
  }'
```

## 文件與檔案掃描 {#document-and-file-scanning}

自 v1.92.0 起，Model Armor 除了訊息文字之外，也會掃描內嵌文件附件。在 `pre_call` 和 `during_call` 上，LiteLLM 會將請求訊息中的每個附件解析為位元組，並在請求到達 LLM 之前將其提交給 Model Armor 的 [byte API](https://cloud.google.com/security-command-center/docs/sanitize-prompts-responses)。

LiteLLM 會辨識含有內嵌 `type: file` 的 OpenAI `file_data` 內容區塊（base64 data URI 或原始 base64），以及含有內嵌 base64 `type: document` 的 Anthropic `source` 區塊。附件的 MIME 類型、宣告的 `format`，或檔名副檔名會對應到 Model Armor `byteDataType`；PDF、Word、Excel、PowerPoint、CSV 及純文字文件都會被掃描。byte API 不支援的類型之內嵌內容，例如圖片，不會被掃描，會直接通過。

```json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "Summarize this document"},
    {"type": "file", "file": {"file_data": "data:application/pdf;base64,JVBERi0x...", "filename": "report.pdf"}}
  ]
}
```

文件上的 Model Armor 發現一律會以 HTTP 400 封鎖請求：

```json
{"error": "Content blocked by Model Armor", "model_armor_response": {"sanitizationResult": {"filterMatchState": "MATCH_FOUND"}}}
```

遮罩永遠不會套用到文件。Model Armor 會針對文件回傳發現結果，而不是清理後的副本，因此即使啟用了 `mask_request_content`，只要有符合項目就會封鎖。

### 無法掃描的附件 {#attachments-that-cannot-be-scanned}

LiteLLM 辨識為文件但無法提交掃描的附件會採取封閉失敗：除非您設定 `fail_on_error: false`，否則請求會以 HTTP 400 被封鎖。

| 情況 | 預設（`fail_on_error: true`） | 啟用 `fail_on_error: false` 時 |
|------|--------------------------------|------------------------------|
| `file_id` 或沒有內嵌位元組的遠端 URL 參照（`http://`、`https://`、`gs://`） | 封鎖 | 直接通過且不掃描 |
| 大於 Model Armor 4 MB 上限的文件 | 封鎖 | 直接通過且不掃描 |
| 一個請求中超過 10 個附件 | 封鎖 | 前 10 個會掃描，其餘直接通過且不掃描 |
| 無法解碼的內嵌 base64 | 封鎖 | 直接通過且不掃描 |
| 掃描附件時 Model Armor API 發生錯誤 | 封鎖 | 跳過該附件，剩餘附件仍會掃描 |

被封鎖的請求會回傳原因：

```json
{"error": "Model Armor could not scan an attachment and blocked the request: attachment of 5242880 bytes exceeds Model Armor's 4194304 byte scan limit"}
```

## 支援的參數  {#supported-params}

### 常見參數 {#common-params}

- `api_key` - str - Google Cloud 服務帳戶憑證（若使用 ADC 則為選用）
- `api_base` - str - 自訂 Model Armor API 端點（選用）
- `default_on` - bool - 是否預設執行此防護欄。預設值為 `false`。
- `mode` - Union[str, list[str]] - 執行此防護欄的模式。支援的值：`pre_call`、`during_call`、`post_call`。預設值為 `pre_call`。

### Model Armor 特定 {#model-armor-specific}

- `template_id` - str - 您的 Model Armor 範本 ID（必填）
- `project_id` - str - Google Cloud 專案 ID（預設為憑證專案）
- `location` - str - Google Cloud 位置／區域。預設值為 `us-central1`
- `credentials` - Union[str, dict] - 服務帳戶 JSON 檔案路徑或憑證字典
- `api_endpoint` - str - Model Armor 的自訂 API 端點（選用）
- `fail_on_error` - bool - 當 Model Armor 遇到錯誤時是否使請求失敗，包括其無法掃描的附件（請參閱 [文件與檔案掃描](#document-and-file-scanning)）。預設值為 `true`
- `mask_request_content` - bool - 啟用請求中敏感內容的遮罩。預設值為 `false`
- `mask_response_content` - bool - 啟用回應中敏感內容的遮罩。預設值為 `false`

## 延伸閱讀 {#further-reading}

- [依 API 金鑰控制防護欄](./quick_start#-control-guardrails-per-api-key)
