import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Humanloop {#humanloop}

[Humanloop](https://humanloop.com/docs/v5/getting-started/overview) 讓產品團隊能使用 LLM 建立穩健的 AI 功能，並採用頂尖工具來進行評估、Prompt 管理與可觀測性。

## 快速開始 {#getting-started}

使用 Humanloop 來管理所有 LiteLLM 提供者的 prompts。

<Tabs>

<TabItem value="sdk" label="SDK">

```python
import os 
import litellm

os.environ["HUMANLOOP_API_KEY"] = "" # [OPTIONAL] set here or in `.completion`

litellm.set_verbose = True # see raw request to provider

resp = litellm.completion(
    model="humanloop/gpt-3.5-turbo",
    prompt_id="test-chat-prompt",
    prompt_variables={"user_message": "this is used"}, # [OPTIONAL]
    messages=[{"role": "user", "content": "<IGNORED>"}],
    # humanloop_api_key="..." ## alternative to setting env var
)
```


</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: humanloop/gpt-3.5-turbo
      prompt_id: "<humanloop_prompt_id>"
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config config.yaml --detailed_debug
```

3. 測試它！ 

<Tabs>
<TabItem value="curl" label="CURL">

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "user",
            "content": "THIS WILL BE IGNORED"
        }
    ],
    "prompt_variables": {
        "key": "this is used"
    }
}'
```
</TabItem>
<TabItem value="OpenAI Python SDK" label="OpenAI Python SDK">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={
        "prompt_variables": { # [OPTIONAL]
            "key": "this is used"
        }
    }
)

print(response)
```

</TabItem>
</Tabs>

</TabItem>
</Tabs>

**預期記錄：**

```
POST Request Sent from LiteLLM:
curl -X POST \
https://api.openai.com/v1/ \
-d '{'model': 'gpt-3.5-turbo', 'messages': <YOUR HUMANLOOP PROMPT TEMPLATE>}'
```

## 如何設定 model  {#how-to-set-model}

## 如何設定 model  {#how-to-set-model-1}

### 在 LiteLLM 上設定 model  {#set-the-model-on-litellm}

您可以這樣做 `humanloop/<litellm_model_name>`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
litellm.completion(
    model="humanloop/gpt-3.5-turbo", # or `humanloop/anthropic/claude-3-5-sonnet`
    ...
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: humanloop/gpt-3.5-turbo # OR humanloop/anthropic/claude-3-5-sonnet
      prompt_id: <humanloop_prompt_id>
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
</Tabs>

### 在 Humanloop 上設定 model  {#set-the-model-on-humanloop}

LiteLLM 會呼叫 humanloop 的 `https://api.humanloop.com/v5/prompts/<your-prompt-id>` endpoint，以取得 prompt template。

這也會回傳在 Humanloop 上設定的 template model。

```bash
{
  "template": [
    {
      ... # your prompt template
    }
  ],
  "model": "gpt-3.5-turbo" # your template model
}
```
