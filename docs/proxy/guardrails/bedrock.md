import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock 防護欄 {#bedrock-guardrails}

:::tip[⚡️]
如果您尚未設定或完成 Bedrock 提供者驗證，請參閱 [Bedrock 提供者設定與驗證指南](../../providers/bedrock.md)。
:::

LiteLLM 支援透過 [Bedrock ApplyGuardrail API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ApplyGuardrail.html) 使用 Bedrock 防護欄。

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
  - guardrail_name: "bedrock-pre-guard"
    litellm_params:
      guardrail: bedrock  # supported values: "aporia", "bedrock", "lakera"
      mode: "during_call"
      guardrailIdentifier: ff6ujrregl1q      # your guardrail ID on bedrock
      guardrailVersion: "DRAFT"              # your guardrail version on bedrock
      aws_region_name: os.environ/AWS_REGION # region guardrail is defined
      aws_role_name: os.environ/AWS_ROLE_ARN # your role with permissions to use the guardrail
      aws_external_id: os.environ/AWS_EXTERNAL_ID # only if that role's trust policy requires sts:ExternalId
  
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

**[Langchain、OpenAI SDK 使用範例](/docs/proxy/user_keys#request-format)**

<Tabs>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為請求中的 `ishaan@berri.ai` 是 PII

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
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
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["bedrock-pre-guard"]
  }'
```

</TabItem>

</Tabs>

## 串流 {#streaming}

串流回應會在 `post_call` 上進行掃描。預設情況下，串流會先緩衝：每個區塊都會被保留，直到組裝完成的回應通過一次 ApplyGuardrail OUTPUT 掃描，因此在封鎖之前，不會有任何標記內容送達用戶端。用戶端在掃描完成前看不到任何內容，之後整個回應會一次送出。

對於對延遲敏感的用戶端（互動式聊天、程式設計代理程式），您可以改為讓串流持續進行，並以稽核模式執行掃描：

```yaml
guardrails:
  - guardrail_name: "bedrock-post-guard"
    litellm_params:
      guardrail: bedrock
      mode: "post_call"
      guardrailIdentifier: ff6ujrregl1q
      guardrailVersion: "DRAFT"
      streaming_buffer_until_moderated: false
      streaming_end_of_stream_only: true
```

區塊現在會在抵達時串流到用戶端，並在串流結束時對組裝完成的回應執行一次 OUTPUT 掃描。若有違規，仍會以防護欄的封鎖訊息終止串流，但已經串流出去的內容已被看見：這是偵測並記錄，而非防止。無論哪種方式，掃描結果都會記錄在請求的支出記錄中的 `guardrail_information`。

| 參數 | 預設值 | 說明 |
|-----------|---------|-------------|
| `streaming_buffer_until_moderated` | `true` | 將每個已串流的區塊保留到串流結束時才進行審核，避免任何標記區塊在封鎖前送達用戶端 |
| `streaming_end_of_stream_only` | `false` | 只對組裝完成的回應掃描一次串流輸出，而不是對每個取樣區塊掃描 |
| `streaming_sampling_rate` | `5` | 在不緩衝且非僅串流結束時，將累積文字每第 N 個區塊掃描一次。至少必須為 1 |

僅使用 `streaming_buffer_until_moderated: false` 時，防護欄會在串流期間每 `streaming_sampling_rate` 個區塊掃描一次累積的回應。每次取樣掃描都是針對目前所有文字的獨立 ApplyGuardrail 呼叫，因此會增加串流中途延遲與重複的 Bedrock 文字單位費用。除非您需要串流中途封鎖，否則請搭配 `streaming_end_of_stream_only: true` 使用。

這些設定同時適用於 `/v1/chat/completions` 與原生 `/v1/messages` 串流。

## 脈絡基礎 {#contextual-grounding}

Bedrock 只有在被告知參考文字與問題內容時，才會評分脈絡基礎。預設情況下，LiteLLM 只會傳送模型回應，因此脈絡基礎政策不會封鎖任何內容。

設定 `contextual_grounding_from_messages: true` 後，呼叫後檢查會將系統提示詞作為脈絡基礎來源，並將最新的使用者訊息作為查詢。與系統提示詞相矛盾的答案會被封鎖。

```yaml showLineNumbers title="litellm proxy config.yaml"
guardrails:
  - guardrail_name: "bedrock-grounding"
    litellm_params:
      guardrail: bedrock
      mode: "post_call"
      guardrailIdentifier: ff6ujrregl1q
      guardrailVersion: "DRAFT"
      aws_region_name: os.environ/AWS_REGION
      contextual_grounding_from_messages: true
```

此旗標的預設值為 `false`。每次啟用後掃描都會計費一個 Bedrock 脈絡基礎單位，且 Bedrock 會拒絕約 1,000 字元以上的查詢，因此只應在具有脈絡基礎政策的防護欄上啟用。

## 無資源檢查：InvokeGuardrailChecks {#resource-less-checks-invokeguardrailchecks}

使用 [InvokeGuardrailChecks API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeGuardrailChecks.html) 時，您不需要在 AWS 中建立防護欄。相反地，請在設定中內嵌定義這些檢查；Bedrock 會針對每項檢查回傳分數，而 LiteLLM 會在分數達到您的閾值時封鎖請求。

請設定 `checks` 取代 `guardrailIdentifier`（兩者不能合併使用）。您的 AWS 憑證需要 `bedrock:InvokeGuardrailChecks` 權限。

```yaml showLineNumbers title="litellm proxy config.yaml"
guardrails:
  - guardrail_name: "bedrock-checks"
    litellm_params:
      guardrail: bedrock
      mode: "pre_call"
      aws_region_name: os.environ/AWS_REGION
      checks:
        contentFilter:
          categories:
            - category: VIOLENCE
        promptAttack:
          categories:
            - category: JAILBREAK
        sensitiveInformation:
          entities:
            - type: EMAIL
      content_filter_threshold: 0.5
      prompt_attack_threshold: 0.5
      pii_confidence_threshold: 0.5
```

### 支援的檢查 {#supported-checks}

| 檢查 | 偵測內容 | 閾值鍵值 |
|-------|-----------------|---------------|
| `contentFilter` | 有害內容：`VIOLENCE`、`HATE`、`SEXUAL`、`MISCONDUCT`、`INSULTS` | `content_filter_threshold` |
| `promptAttack` | `JAILBREAK`、`PROMPT_INJECTION`、`PROMPT_LEAKAGE` | `prompt_attack_threshold` |
| `sensitiveInformation` | 個資：`EMAIL`、`PHONE`、`NAME`，以及 [更多](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeGuardrailChecks.html) | `pii_confidence_threshold` |

只包含您想要的檢查；至少需要一項。像 `promptAttack: {}` 這樣的空設定會以 AWS 預設值啟用該檢查。

### 封鎖的運作方式 {#how-blocking-works}

分數範圍從 0 到 1，且每個閾值預設為 `0.5`。分數達到或超過閾值時，會以 HTTP 400 封鎖請求；將閾值設為 `null` 可只記錄該檢查的分數，絕不封鎖。如果 Bedrock 回傳截斷的 PII 結果，請求會被封鎖（預設失敗）。

```json
{
  "error": {
    "message": {
      "error": "Violated guardrail policy",
      "bedrock_guardrail_checks": [
        {"check": "promptAttack", "category": "JAILBREAK", "severityScore": 0.91}
      ]
    },
    "code": "400"
  }
}
```

`disable_exception_on_block: true`（見[下方](#disabling-exceptions-on-bedrock-block)）在這裡同樣適用；此時封鎖會回傳 HTTP 200 與 `finish_reason: "content_filter"`。

呼叫端無法弱化已設定的檢查：在此模式下，逐請求的防護欄參數會被忽略，而且所有輸入都會視為 `user` 內容進行檢查，因此被標記為 `system` 的注入無法躲過提示攻擊檢查。

## 使用 Bedrock 防護欄進行 PII 遮罩 {#pii-masking-with-bedrock-guardrails}

Bedrock 防護欄支援 PII 偵測與遮罩功能。若要啟用此功能，您需要：

1. 將 `mode` 設為 `pre_call`，以便在 LLM 請求之前執行防護欄檢查
2. 透過將 `mask_request_content` 和／或 `mask_response_content` 設為 `true` 來啟用遮罩

以下是如何在您的 config.yaml 中進行設定：

```yaml showLineNumbers title="litellm proxy config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
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

當您透過 Bedrock 防護欄串接長篇對話時，可透過在防護欄的 `experimental_use_latest_role_message_only: true` 中設定 `litellm_params`，選擇較輕量、實驗性的行為。啟用後，LiteLLM 只會將最近的 `user` 訊息（或在後續呼叫檢查期間的 assistant 輸出）傳送給 Bedrock，這會：

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
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
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
    "model": "{{openai_small}}",
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
        "blockedResponse": "I can't provide information on creating explosives."
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
    "model": "{{openai_small}}",
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
  "model": "{{openai_small}}",
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
