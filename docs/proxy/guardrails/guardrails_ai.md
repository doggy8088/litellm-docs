import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Guardrails AI {#guardrails-ai}

使用 Guardrails AI ([guardrailsai.com](https://www.guardrailsai.com/)) 為 LLM 輸出新增檢查。

## 前置需求 {#pre-requisites}

- 設定 Guardrails AI 伺服器。[快速開始](https://www.guardrailsai.com/docs/getting_started/guardrails_server)

## 用法 {#usage}

1. 設定 config.yaml 

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "guardrails_ai-guard"
    litellm_params:
      guardrail: guardrails_ai
      guard_name: "detect-secrets-guard"            # 👈 Guardrail AI guard name
      mode: "pre_call"
      guardrails_ai_api_input_format: "llmOutput"   # 👈 This is the only option that currently works (and it is a default), use it for both pre_call and post_call hooks
      api_base: os.environ/GUARDRAILS_AI_API_BASE   # 👈 Guardrails AI API Base. Defaults to "http://0.0.0.0:8000"
```

2. 啟動 LiteLLM 閘道 

```shell
litellm --config config.yaml --detailed_debug
```

3. 測試請求 

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["guardrails_ai-guard"]
  }'
```


## ✨ 依專案（API 金鑰）控制 Guardrails {#-control-guardrails-per-project-api-key}

:::info

✨ 這是 Enterprise 專屬功能 [聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

使用此功能可控制每個專案執行哪些 guardrails。在本教學中，我們只希望以下 guardrails 對 1 個專案（API 金鑰）執行
- `guardrails`: ["aporia-pre-guard", "aporia-post-guard"]

**步驟 1** 使用 guardrail 設定建立金鑰

<Tabs>
<TabItem value="/key/generate" label="/key/generate">

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{
            "guardrails": ["guardrails_ai-guard"]
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
        "guardrails": ["guardrails_ai-guard"]
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
