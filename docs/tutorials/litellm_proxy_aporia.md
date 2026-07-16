import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 LiteLLM Gateway 的 Aporia 防護欄 {#aporia-guardrails-with-litellm-gateway}

在本教學中，我們將使用 LiteLLM AI Gateway 搭配 Aporia 來偵測請求中的 PII，以及回應中的不雅字眼

## 1. 在 Aporia 上設定防護欄 {#1-setup-guardrails-on-aporia}

### 建立 Aporia 專案 {#create-aporia-projects}

在 [Aporia](https://guardrails.aporia.com/) 上建立兩個專案

1. Pre LLM API Call - 設定您要在 pre LLM API call 之前執行的所有政策 
2. Post LLM API Call - 設定您要在 post LLM API call 之後執行的所有政策

<Image img={require('../../img/aporia_projs.png')} />

### 呼叫前：偵測 PII {#pre-call-detect-pii}

將 `PII - Prompt` 新增到您的 Pre LLM API Call 專案

<Image img={require('../../img/aporia_pre.png')} />

### 呼叫後：偵測回應中的不雅字眼 {#post-call-detect-profanity-in-responses}

將 `Toxicity - Response` 新增到您的 Post LLM API Call 專案

<Image img={require('../../img/aporia_post.png')} />

## 2. 在您的 LiteLLM config.yaml 中定義防護欄  {#2-define-guardrails-on-your-litellm-configyaml}

- 在 `guardrails` 區段下定義您的防護欄，並設定 `pre_call_guardrails` 和 `post_call_guardrails`
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "aporia-pre-guard"
    litellm_params:
      guardrail: aporia  # supported values: "aporia", "lakera"
      mode: "during_call"
      api_key: os.environ/APORIA_API_KEY_1
      api_base: os.environ/APORIA_API_BASE_1
  - guardrail_name: "aporia-post-guard"
    litellm_params:
      guardrail: aporia  # supported values: "aporia", "lakera"
      mode: "post_call"
      api_key: os.environ/APORIA_API_KEY_2
      api_base: os.environ/APORIA_API_BASE_2
```

### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 LLM 呼叫之前執行，針對**輸入**
- `post_call` 在 LLM 呼叫之後執行，針對**輸入與輸出**
- `during_call` 在 LLM 呼叫期間執行，針對**輸入**，與 `pre_call` 相同，但會與 LLM 呼叫平行執行。回應在防護欄檢查完成前不會傳回

## 3. 啟動 LiteLLM Gateway  {#3-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

## 4. 測試請求  {#4-test-request}

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="不成功的呼叫" value = "not-allowed">

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
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

失敗時的預期回應

```shell
{
  "error": {
    "message": {
      "error": "Violated guardrail policy",
      "aporia_ai_response": {
        "action": "block",
        "revised_prompt": null,
        "revised_response": "Aporia detected and blocked PII",
        "explain_log": null
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
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

</TabItem>

</Tabs>

## 5. 依專案（API 金鑰）控制防護欄 {#5-control-guardrails-per-project-api-key}

使用此功能可控制每個專案要執行哪些防護欄。在本教學中，我們只希望以下防護欄針對 1 個專案（API 金鑰）執行
- `guardrails`: ["aporia-pre-guard", "aporia-post-guard"]

**步驟 1** 建立具有防護欄設定的金鑰

<Tabs>
<TabItem value="/key/generate" label="/key/generate">

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{
            "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
        }
    }'
```

</TabItem>
<TabItem value="/key/update" label="/key/update">

```shell
curl --location 'http://0.0.0.0:4000/key/update' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "key": "sk-jNm1Zar7XfNdZXp49Z1kSQ",
        "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
        }
}'
```

</TabItem>
</Tabs>

**步驟 2** 使用新金鑰測試

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Authorization: Bearer sk-jNm1Zar7XfNdZXp49Z1kSQ' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "my email is ishaan@berri.ai"
        }
    ]
}'
```
