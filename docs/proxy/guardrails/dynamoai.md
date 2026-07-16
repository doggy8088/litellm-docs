import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoAI 防護欄 {#dynamoai-guardrails}

LiteLLM 支援 DynamoAI 防護欄，用於對 LLM 輸入與輸出進行內容審核與政策強制執行。

## 快速開始 {#quick-start}

### 1. 在您的 LiteLLM config.yaml 中定義防護欄 {#1-define-guardrails-on-your-litellm-configyaml}

請在 `guardrails` 區段下定義您的防護欄：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "dynamoai-guard"
    litellm_params:
      guardrail: dynamoai
      mode: "pre_call"
      api_key: os.environ/DYNAMOAI_API_KEY
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` - 在 LLM 請求**之前**執行，針對**輸入**
- `post_call` - 在 LLM 請求**之後**執行，針對**輸出**
- `during_call` - 在 LLM 請求**期間**執行，針對**輸入**。與 `pre_call` 相同，但會與 LLM 請求並行執行

### 2. 設定環境變數 {#2-set-environment-variables}

```bash
export DYNAMOAI_API_KEY="your-api-key"
# Optional: Set policy IDs via environment variable (comma-separated)
export DYNAMOAI_POLICY_IDS="policy-id-1,policy-id-2,policy-id-3"
```

### 3. 啟動 LiteLLM 閘道 {#3-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 4. 測試請求 {#4-test-request}

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫" value="allowed">

```shell showLineNumbers title="Successful Request"
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "guardrails": ["dynamoai-guard"]
  }'
```

**回應：HTTP 200 成功**

內容通過所有政策檢查並允許通過。

</TabItem>

<TabItem label="被封鎖的呼叫" value="not-allowed">

```shell showLineNumbers title="Blocked Request"
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Content that violates policy"}
    ],
    "guardrails": ["dynamoai-guard"]
  }'
```

**封鎖時預期的回應：HTTP 400 錯誤**

```json showLineNumbers
{
  "error": {
    "message": "Guardrail failed: 1 violation(s) detected\n\n- POLICY NAME:\n  Action: BLOCK\n  Method: TOXICITY\n  Description: Policy description\n  Policy ID: policy-id-123",
    "type": "None",
    "param": "None",
    "code": "400"
  }
}
```

</TabItem>
</Tabs>

## 進階設定 {#advanced-configuration}

### 指定政策 ID {#specify-policy-ids}

設定要套用的特定 DynamoAI 政策：

```yaml showLineNumbers title="config.yaml"
guardrails:
  - guardrail_name: "dynamoai-policies"
    litellm_params:
      guardrail: dynamoai
      mode: "pre_call"
      api_key: os.environ/DYNAMOAI_API_KEY
      policy_ids:
        - "policy-id-1"
        - "policy-id-2"
        - "policy-id-3"
```

### 自訂 API Base {#custom-api-base}

指定自訂的 DynamoAI API 端點：

```yaml showLineNumbers title="config.yaml"
guardrails:
  - guardrail_name: "dynamoai-custom"
    litellm_params:
      guardrail: dynamoai
      mode: "pre_call"
      api_key: os.environ/DYNAMOAI_API_KEY
      api_base: "https://custom.dynamo.ai"
```

### 用於追蹤的模型 ID {#model-id-for-tracking}

新增模型 ID 以供追蹤與記錄用途：

```yaml showLineNumbers title="config.yaml"
guardrails:
  - guardrail_name: "dynamoai-tracked"
    litellm_params:
      guardrail: dynamoai
      mode: "pre_call"
      api_key: os.environ/DYNAMOAI_API_KEY
      model_id: "gpt-4-production"
```

### 輸入與輸出防護欄 {#input-and-output-guardrails}

為輸入與輸出分別設定防護欄：

```yaml showLineNumbers title="config.yaml"
guardrails:
  # Input guardrail
  - guardrail_name: "dynamoai-input"
    litellm_params:
      guardrail: dynamoai
      mode: "pre_call"
      api_key: os.environ/DYNAMOAI_API_KEY

  # Output guardrail
  - guardrail_name: "dynamoai-output"
    litellm_params:
      guardrail: dynamoai
      mode: "post_call"
      api_key: os.environ/DYNAMOAI_API_KEY
```

## 設定選項 {#configuration-options}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `api_key` | string | DynamoAI API 金鑰（必填） | `DYNAMOAI_API_KEY` 環境變數 |
| `api_base` | string | DynamoAI API base URL | `https://api.dynamo.ai` |
| `policy_ids` | array | 要套用的 DynamoAI 政策 ID 清單（選填） | `DYNAMOAI_POLICY_IDS` 環境變數（以逗號分隔） |
| `model_id` | string | 用於追蹤/記錄的模型 ID | `DYNAMOAI_MODEL_ID` 環境變數 |
| `mode` | string | 執行時機：`pre_call`、`post_call`，或 `during_call` | 必填 |

## 可觀測性 {#observability}

DynamoAI 防護欄記錄包含：

- **guardrail_status**：`success`、`guardrail_intervened`，或 `guardrail_failed_to_respond`
- **guardrail_provider**：`dynamoai`
- **guardrail_json_response**：包含政策詳細資訊的完整 API 回應
- **duration**：防護欄檢查所花費的時間
- **start_time** 與 **end_time**：時間戳記

這些記錄可透過您已設定的 LiteLLM 記錄回呼使用。

## 錯誤處理 {#error-handling}

防護欄會優雅地處理錯誤：

- **API 失敗**：記錄錯誤並擲出狀態為 `guardrail_failed_to_respond` 的例外
- **政策違規**：擲出 `ValueError`，並附上詳細的違規資訊
- **設定無效**：若缺少 API 金鑰，則在初始化時擲出 `ValueError`

## 目前限制 {#current-limitations}

- 目前僅支援 `BLOCK` 動作
- `WARN`、`REDACT` 與 `SANITIZE` 動作會被視為成功（直接通過）

## 支援 {#support}

如需更多關於 DynamoAI 的資訊：
- 網站：[https://dynamo.ai](https://dynamo.ai)
- 文件：請聯絡 DynamoAI 以取得 API 文件
