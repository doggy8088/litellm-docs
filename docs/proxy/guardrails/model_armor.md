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
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
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
      sanitize_error_detail: true     # Keep raw Model Armor responses out of errors and logs (default: true)
      default_on: true                # Run by default for all requests
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 **LLM 呼叫之前** 執行，作用於 **輸入**
- `during_call` 與 LLM 呼叫 **並行** 執行，作用於 **輸入**
- `post_call` 在 LLM 呼叫 **之後** 執行，作用於 **輸出**
- `pre_mcp_call` 在 MCP 工具呼叫 **之前** 執行，作用於 **輸入**
- `during_mcp_call` 與 MCP 工具呼叫 **並行** 執行，作用於 **輸入**
- `logging_only` 掃描已記錄的請求與完成的回應，不會阻擋或修改用戶端回應

#### 在不阻擋的情況下觀察 {#observe-without-blocking}

使用 `logging_only` 在強制套用 Model Armor 範本之前先評估它：

```yaml
guardrails:
  - guardrail_name: model-armor-observe
    litellm_params:
      guardrail: model_armor
      mode: logging_only
      template_id: "your-template-id"
      project_id: "your-project-id"
      location: "us-central1"
      credentials: "path/to/credentials.json"
      default_on: true
```

對於透過閘道成功的 Chat Completions、Responses 和 Messages 請求，此模式會掃描已記錄的請求與回應文字。它會在 `guardrail_information` 中記錄 `success`、`guardrail_flagged` 或 `guardrail_failed_to_respond`。請在 Request Logs 或 Guardrails Monitor Logs 分頁中檢查裁決。發現與 Model Armor 錯誤不會阻擋請求或變更用戶端回應。對於串流請求，LiteLLM 會先轉送各個區塊，不會等待完整回應掃描完成。

此模式沒有僅輸入或僅輸出的選擇。工具呼叫引數與內嵌文件不會被掃描。請使用 `pre_call` 或 `during_call` 進行 [文件與檔案掃描](#document-and-file-scanning)。

### 2. 啟動 LiteLLM 閘道  {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求  {#3-test-request}

**[Langchain, OpenAI SDK 使用範例](/docs/proxy/user_keys#request-format)**

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
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

| 案例 | 預設 (`fail_on_error: true`) | 使用 `fail_on_error: false` |
|------|--------------------------------|------------------------------|
| `file_id` 或遠端 URL 參照（`http://`、`https://`、`gs://`）且沒有內嵌位元組 | 已封鎖 | 不經掃描直接通過 |
| 大於 Model Armor 4 MB 限制的文件 | 已封鎖 | 不經掃描直接通過 |
| 無法解碼的內嵌 base64 | 已封鎖 | 不經掃描直接通過 |
| 掃描附件時 Model Armor API 發生錯誤 | 已封鎖 | 附件略過，其餘附件仍會掃描 |

被封鎖的請求會回傳原因：

```json
{"error": "Model Armor could not scan an attachment and blocked the request: attachment of 5242880 bytes exceeds Model Armor's 4194304 byte scan limit"}
```

如果您使用 `file_id`、`gs://` 或 `http(s)://` 附件參照（Vertex AI 建議的模式），位元組永遠不會到達 LiteLLM，因此 Model Armor 無法掃描它們，且預設會封鎖該請求。請設定 `skip_unscannable_attachments: true`，讓不帶內嵌位元組的附件在不經掃描的情況下直接通過，同時仍會掃描帶有內嵌位元組的附件。與 `fail_on_error: false` 不同，這會保留針對真實 Model Armor API 錯誤（網路、配額、範本錯誤）的 fail-closed 行為；它只會影響那些沒有任何可傳送內容的附件。

大於 Model Armor 4 MB 位元組限制的文件確實包含位元組，但超出位元組 API 可接受的範圍，因此在 `fail_on_error` 下仍會維持 fail-closed；`skip_unscannable_attachments` 不涵蓋此情況，因為那是您很可能希望封鎖而不是不經掃描直接轉送的真實文件。

## 支援的參數  {#supported-params}

### 常見參數 {#common-params}

- `api_key` - str - Google Cloud 服務帳戶憑證（若使用 ADC 則為選用）
- `api_base` - str - 自訂 Model Armor API 端點（選用）
- `default_on` - bool - 是否預設執行此 guardrail。預設為 `false`。
- `mode` - Union[str, list[str]] - 執行此 guardrail 所需模式。支援值：`pre_call`、`during_call`、`post_call`、`pre_mcp_call`、`during_mcp_call` 以及 `logging_only`。

### Model Armor 特定 {#model-armor-specific}

- `template_id` - str - 您的 Model Armor 範本 ID（必填）
- `project_id` - str - Google Cloud 專案 ID（預設為憑證專案）
- `location` - str - Google Cloud 位置/區域。預設為 `us-central1`
- `credentials` - Union[str, dict] - 服務帳戶 JSON 檔案或憑證字典的路徑
- `api_endpoint` - str - Model Armor 的自訂 API 端點（選用）
- `fail_on_error` - bool - 當 Model Armor 遇到錯誤時是否使請求失敗，包括它無法掃描的附件（請參閱 [文件與檔案掃描](#document-and-file-scanning)）。預設為 `true`
- `skip_unscannable_attachments` - bool - 讓沒有內嵌位元組的附件參照（`file_id`、`gs://`、`http(s)://`）在不經掃描的情況下直接通過，而不是封鎖，同時對真實的 Model Armor API 錯誤仍維持 fail-closed（請參閱 [無法被掃描的附件](#attachments-that-cannot-be-scanned)）。預設為 `false`
- `sanitize_error_detail` - bool - 將原始 Model Armor API 回應排除在呼叫者可見的錯誤詳細資訊、debug 記錄與 guardrail trace 負載之外。預設為 `true`；設定 `false` 可還原用於除錯的詳細輸出
- `mask_request_content` - bool - 啟用請求中敏感內容的遮罩。預設為 `false`
- `mask_response_content` - bool - 啟用回應中敏感內容的遮罩。預設為 `false`

## 延伸閱讀 {#further-reading}

- [依 API 金鑰控制防護欄](./quick_start#-control-guardrails-per-api-key)
