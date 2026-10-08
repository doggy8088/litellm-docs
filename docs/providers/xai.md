import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# xAI {#xai}

https://docs.x.ai/docs

:::tip

**我們支援所有 xAI 模型，只要在送出 litellm 請求時將 `model=xai/<any-model-on-xai>` 設為前綴即可**

:::

## 支援的模型 {#supported-models}

**Grok 4.5** - 具有 500K context、reasoning（low/medium/high）、vision、tools、web search 與 prompt caching 的前沿模型，適用於 coding、agentic tasks 和 knowledge work。

| Model | Context | Features |
|-------|---------|----------|
| `xai/grok-4.5` | 500K tokens | **Reasoning**, Function calling, Vision, Web search, Caching |

**範例：**
```python
from litellm import completion

response = completion(
    model="xai/grok-4.5",
    messages=[{"role": "user", "content": "Find and fix the bug, then explain it."}],
    reasoning_effort="high",  # low | medium | high (default high)
)
```

**功能：**
- **Reasoning** = 使用 reasoning tokens 的 chain-of-thought reasoning
- **Tools** = Function calling / 工具使用
- **Web search** = 即時網際網路搜尋
- **Vision** = 圖像理解
- **Caching** = 供降低成本的 prompt caching
- **Structured outputs** = JSON / schema 限制的回應

**價格：** 請參閱 [xAI 的價格頁面](https://docs.x.ai/docs/models) 以取得目前費率。

## API 金鑰 {#api-key}
```python
# env variable
os.environ['XAI_API_KEY']
```

## 範例用法 {#sample-usage}

```python showLineNumbers title="LiteLLM python sdk usage - Non-streaming"
from litellm import completion
import os

os.environ['XAI_API_KEY'] = ""
response = completion(
    model="xai/grok-4.5",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    temperature=0.2,
    top_p=0.9,
    tool_choice="auto",
    tools=[],
    user="user",
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}

```python showLineNumbers title="LiteLLM python sdk usage - Streaming"
from litellm import completion
import os

os.environ['XAI_API_KEY'] = ""
response = completion(
    model="xai/grok-4.5",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    stream=True,
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    temperature=0.2,
    top_p=0.9,
    tool_choice="auto",
    tools=[],
    user="user",
)

for chunk in response:
    print(chunk)
```

## 範例用法 - Vision {#sample-usage---vision}

```python showLineNumbers title="LiteLLM python sdk usage - Vision"
import os 
from litellm import completion

os.environ["XAI_API_KEY"] = "your-api-key"

response = completion(
    model="xai/grok-4.5",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://science.nasa.gov/wp-content/uploads/2023/09/web-first-images-release.png",
                        "detail": "high",
                    },
                },
                {
                    "type": "text",
                    "text": "What's in this image?",
                },
            ],
        },
    ],
)
```

## 與 LiteLLM Proxy Server 搭配使用 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 XAI 模型

1. 修改 config.yaml 

  ```yaml showLineNumbers
  model_list:
    - model_name: my-model
      litellm_params:
        model: xai/<your-model-name>  # add xai/ prefix to route as XAI provider
        api_key: api-key                 # api key to send your model
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python showLineNumbers
  import openai
  client = openai.OpenAI(
      api_key="sk-<your-litellm-api-key>",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "what llm are you"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header "Authorization: Bearer $LITELLM_API_KEY" \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "what llm are you"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>

## 推理用法 {#reasoning-usage}

LiteLLM 支援 xAI 模型的推理用法。

<Tabs>

<TabItem value="python" label="LiteLLM Python SDK">

```python showLineNumbers title="reasoning with xai/grok-4.5"
import litellm
response = litellm.completion(
    model="xai/grok-4.5",
    messages=[{"role": "user", "content": "What is 101*3?"}],
    reasoning_effort="low",  # low | medium | high
)

print("Reasoning Content:")
print(response.choices[0].message.reasoning_content)

print("\nFinal Response:")
print(response.choices[0].message.content)

print("\nNumber of completion tokens:")
print(response.usage.completion_tokens)

print("\nNumber of reasoning tokens:")
print(response.usage.completion_tokens_details.reasoning_tokens)
```
</TabItem>

<TabItem value="curl" label="LiteLLM Proxy - OpenAI SDK 用法">

```python showLineNumbers title="reasoning with xai/grok-4.5"
import openai
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",             # pass litellm proxy key, if you're using virtual keys
    base_url="http://0.0.0.0:4000" # litellm-proxy-base url
)

response = client.chat.completions.create(
    model="xai/grok-4.5",
    messages=[{"role": "user", "content": "What is 101*3?"}],
    reasoning_effort="low",  # low | medium | high
)

print("Reasoning Content:")
print(response.choices[0].message.reasoning_content)

print("\nFinal Response:")
print(response.choices[0].message.content)

print("\nNumber of completion tokens:")
print(response.usage.completion_tokens)

print("\nNumber of reasoning tokens:")
print(response.usage.completion_tokens_details.reasoning_tokens)
```

</TabItem>
</Tabs>

**回應範例：**

```shell
Reasoning Content:
Let me calculate 101 multiplied by 3:
101 * 3 = 303.
I can double-check that: 100 * 3 is 300, and 1 * 3 is 3, so 300 + 3 = 303. Yes, that's correct.

Final Response:
The result of 101 multiplied by 3 is 303.

Number of completion tokens:
14

Number of reasoning tokens:
310
```
