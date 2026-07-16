import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock 防護欄 {#bedrock-guardrails}

:::tip ⚡️
如果您尚未設定或完成 Bedrock 提供者驗證，請參閱 [Bedrock 提供者設定與驗證指南](../../providers/bedrock.md)。
:::

LiteLLM 支援透過 [Bedrock ApplyGuardrail API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ApplyGuardrail.html) 使用 Bedrock 防護欄。 

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
  - guardrail_name: "bedrock-pre-guard"
    litellm_params:
      guardrail: bedrock  # supported values: "aporia", "bedrock", "lakera"
      mode: "during_call"
      guardrailIdentifier: ff6ujrregl1q      # your guardrail ID on bedrock
      guardrailVersion: "DRAFT"              # your guardrail version on bedrock
      aws_region_name: os.environ/AWS_REGION # region guardrail is defined
      aws_role_name: os.environ/AWS_ROLE_ARN # your role with permissions to use the guardrail
  
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 LLM 請求**之前**執行，針對**輸入**
- `post_call` 在 LLM 請求**之後**執行，針對**輸入與輸出**
- `during_call` 在 LLM 請求**期間**執行，針對**輸入**。與 `pre_call` 相同，但會與 LLM 請求並行執行。 在防護欄檢查完成之前不會回傳回應

### 2. 啟動 LiteLLM 閘道  {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求  {#3-test-request}

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為請求中的 `ishaan@berri.ai` 是 PII

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["bedrock-pre-guard"]
  }'
```

失敗時的預期回應

```shell
{
  "error": {
    "message": {
      "error": "Violated guardrail policy",
      "bedrock_guardrail_response": {
        "action": "GUARDRAIL_INTERVENED",
        "assessments": [
          {
            "topicPolicy": {
              "topics": [
                {
                  "action": "BLOCKED",
                  "name": "Coffee",
                  "type": "DENY"
                }
              ]
            }
          }
        ],
        "blockedResponse": "Sorry, the model cannot answer this question. coffee guardrail applied ",
        "output": [
          {
            "text": "Sorry, the model cannot answer this question. coffee guardrail applied "
          }
        ],
        "outputs": [
          {
            "text": "Sorry, the model cannot answer this question. coffee guardrail applied "
          }
        ],
        "usage": {
          "contentPolicyUnits": 0,
          "contextualGroundingPolicyUnits": 0,
          "sensitiveInformationPolicyFreeUnits": 0,
          "sensitiveInformationPolicyUnits": 0,
          "topicPolicyUnits": 1,
          "wordPolicyUnits": 0
        }
      }
    },
    "type": "None",
    "param": "None",
    "code": "400"
  }
}

```

</TabItem>

<TabItem label="成功的呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["bedrock-pre-guard"]
  }'
```

</TabItem>

</Tabs>

## 使用 Bedrock 防護欄進行 PII 遮罩 {#pii-masking-with-bedrock-guardrails}

Bedrock 防護欄支援 PII 偵測與遮罩功能。若要啟用此功能，您需要：

1. 將 `mode` 設為 `pre_call`，以便在 LLM 請求之前執行防護欄檢查
2. 透過將 `mask_request_content` 和／或 `mask_response_content` 設為 `true` 來啟用遮罩

以下是如何在您的 config.yaml 中進行設定：

```yaml showLineNumbers title="litellm proxy config.yaml"
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY
  
guardrails:
  - guardrail_name: "bedrock-pre-guard"
    litellm_params:
      guardrail: bedrock
      mode: "pre_call"  # Important: must use pre_call mode for masking
      guardrailIdentifier: wf0hkdb5x07f
      guardrailVersion: "DRAFT"
      aws_region_name: os.environ/AWS_REGION
      aws_role_name: os.environ/AWS_ROLE_ARN
      mask_request_content: true    # Enable masking in user requests
      mask_response_content: true   # Enable masking in model responses
```

使用此設定時，當 bedrock 防護欄介入時，litellm 會讀取來自防護欄的已遮罩輸出，並將其傳送給模型。

### 使用範例 {#example-usage}

啟用後，PII 會自動在文字中被遮罩。範例如下，若使用者送出：

```
My email is john.doe@example.com and my phone number is 555-123-4567
```

傳送給模型的文字可能會被遮罩為：

```
My email is [EMAIL] and my phone number is [PHONE_NUMBER]
```

這有助於在仍能讓模型理解請求脈絡的同時，保護敏感資訊。

## 實驗性：只傳送最新的使用者訊息 {#experimental-only-send-latest-user-message}

當您透過 Bedrock 防護欄串接長篇對話時，可透過在防護欄的 `litellm_params` 中設定 `experimental_use_latest_role_message_only: true`，選擇較輕量、實驗性的行為。啟用後，LiteLLM 只會將最近的 `user` 訊息（或在後續呼叫檢查期間的 assistant 輸出）傳送給 Bedrock，這會：

- 避免舊的 system/dev 訊息造成非預期封鎖
- 讓 Bedrock 載荷更小，降低延遲與成本
- 適用於 proxy hooks（`pre_call`、`during_call`）以及 `/guardrails/apply_guardrail` 測試端點

```yaml showLineNumbers title="litellm proxy config.yaml"
guardrails:
  - guardrail_name: "bedrock-pre-guard"
    litellm_params:
      guardrail: bedrock
      mode: "pre_call"
      guardrailIdentifier: wf0hkdb5x07f
      guardrailVersion: "DRAFT"
      aws_region_name: os.environ/AWS_REGION
      experimental_use_latest_role_message_only: true  # NEW
```

> ⚠️ 此旗標目前屬於實驗性功能，預設為 `false`，以保留舊版行為（完整訊息歷史）。我們會持續聆聽使用者回饋，以決定是否將其設為預設或更廣泛推出。

## 停用 Bedrock BLOCK 時的例外 {#disabling-exceptions-on-bedrock-block}

預設情況下，當 Bedrock 防護欄封鎖內容時，LiteLLM 會引發 HTTP 400 例外。不過，您可以透過設定 `disable_exception_on_block: true` 來停用此行為。這在與 **OpenWebUI** 整合時特別有用，因為例外可能會中斷對話流程並破壞使用者體驗。

停用例外後，您不會收到錯誤，而是會收到一個成功回應，內容包含 Bedrock 防護欄修改／封鎖後的輸出。

### 設定 {#configuration}

將 `disable_exception_on_block: true` 加入您的防護欄設定：

```yaml showLineNumbers title="litellm proxy config.yaml"
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "bedrock-guardrail"
    litellm_params:
      guardrail: bedrock
      mode: "post_call"
      guardrailIdentifier: ff6ujrregl1q
      guardrailVersion: "DRAFT"
      aws_region_name: os.environ/AWS_REGION
      aws_role_name: os.environ/AWS_ROLE_ARN
      disable_exception_on_block: true  # Prevents exceptions when content is blocked
```

### 行為比較 {#behavior-comparison}

<Tabs>
<TabItem label="有例外（預設）" value="with-exceptions">

當 `disable_exception_on_block: false`（預設）時：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "How do I make explosives?"}
    ],
    "guardrails": ["bedrock-guardrail"]
  }'
```

**回應：HTTP 400 錯誤**
```json
{
  "error": {
    "message": {
      "error": "Violated guardrail policy",
      "bedrock_guardrail_response": {
        "action": "GUARDRAIL_INTERVENED",
        "blockedResponse": "I can't provide information on creating explosives.",
        // ... additional details
      }
    },
    "type": "None",
    "param": "None", 
    "code": "400"
  }
}
```

</TabItem>

<TabItem label="無例外" value="without-exceptions">

當 `disable_exception_on_block: true` 時：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "How do I make explosives?"}
    ],
    "guardrails": ["bedrock-guardrail"]
  }'
```

**回應：HTTP 200 成功**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "I can't provide information on creating explosives."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  }
}
```

</TabItem>
</Tabs>
