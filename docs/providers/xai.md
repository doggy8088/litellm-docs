import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# xAI {#xai}

https://docs.x.ai/docs

:::tip

**我們支援所有 xAI 模型，只要在送出 litellm 請求時將 `model=xai/<any-model-on-xai>` 設為前綴即可**

:::

## 支援的模型 {#supported-models}

**最新版本** - Grok 4.1 Fast：針對高效能 agentic 工具呼叫最佳化，具備 2M context 與 prompt caching。

| 模型 | 上下文 | 功能 |
|-------|---------|----------|
| `xai/grok-4-1-fast-reasoning` | 2M tokens | **推理**, Function calling, Vision, Audio, Web search, Caching |
| `xai/grok-4-1-fast-non-reasoning` | 2M tokens | Function calling, Vision, Audio, Web search, Caching |

**何時使用：**
- ✅ **推理模型**：複雜分析、規劃、多步驟推理問題
- ✅ **非推理模型**：簡單查詢、更快的回應、更低的 token 用量

**範例：**
```python
from litellm import completion

# With reasoning
response = completion(
    model="xai/grok-4-1-fast-reasoning",
    messages=[{"role": "user", "content": "Analyze this problem step by step..."}]
)

# Without reasoning
response = completion(
    model="xai/grok-4-1-fast-non-reasoning",
    messages=[{"role": "user", "content": "What's 2+2?"}]
)
```

---

### 所有可用模型 {#all-available-models}

| 模型系列 | 模型 | 上下文 | 功能 |
|--------------|-------|---------|----------|
| **Grok 4.1** | `xai/grok-4-1-fast-reasoning` | 2M | **推理**, Tools, Vision, Audio, Web search, Caching |
| | `xai/grok-4-1-fast-non-reasoning` | 2M | Tools, Vision, Audio, Web search, Caching |
| **Grok 4** | `xai/grok-4` | 256K | 工具、網路搜尋 |
| | `xai/grok-4-0709` | 256K | 工具、網路搜尋 |
| | `xai/grok-4-fast-reasoning` | 2M | **推理**, Tools, Web search |
| | `xai/grok-4-fast-non-reasoning` | 2M | 工具、網路搜尋 |
| **Grok 3** | `xai/grok-3` | 131K | 工具、網路搜尋 |
| | `xai/grok-3-mini` | 131K | 工具、網路搜尋 |
| | `xai/grok-3-fast-beta` | 131K | 工具、網路搜尋 |
| **Grok Code** | `xai/grok-code-fast` | 256K | **推理**, Tools, Code generation, Caching |
| **Grok 2** | `xai/grok-2` | 131K | Tools, **Vision** |
| | `xai/grok-2-vision-latest` | 32K | Tools, **Vision** |

**功能：**
- **推理** = 具備 reasoning tokens 的 chain-of-thought 推理
- **Tools** = Function calling / Tool use
- **Web search** = 即時網路搜尋
- **Vision** = 圖像理解
- **Audio** = 支援音訊輸入
- **Caching** = 用於節省成本的 prompt caching
- **Code generation** = 針對程式碼任務最佳化

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
    model="xai/grok-3-mini-beta",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    stop=["\n\n"],
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
    model="xai/grok-3-mini-beta",
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
    stop=["\n\n"],
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
    model="xai/grok-2-vision-latest",
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
      api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
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
      --header 'Authorization: Bearer sk-1234' \
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

```python showLineNumbers title="reasoning with xai/grok-3-mini-beta"
import litellm
response = litellm.completion(
    model="xai/grok-3-mini-beta",
    messages=[{"role": "user", "content": "What is 101*3?"}],
    reasoning_effort="low",
)

print("Reasoning Content:")
print(response.choices[0].message.reasoning_content)

print("\nFinal Response:")
print(completion.choices[0].message.content)

print("\nNumber of completion tokens (input):")
print(completion.usage.completion_tokens)

print("\nNumber of reasoning tokens (input):")
print(completion.usage.completion_tokens_details.reasoning_tokens)
```
</TabItem>

<TabItem value="curl" label="LiteLLM Proxy - OpenAI SDK 用法">

```python showLineNumbers title="reasoning with xai/grok-3-mini-beta"
import openai
client = openai.OpenAI(
    api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
    base_url="http://0.0.0.0:4000" # litellm-proxy-base url
)

response = client.chat.completions.create(
    model="xai/grok-3-mini-beta",
    messages=[{"role": "user", "content": "What is 101*3?"}],
    reasoning_effort="low",
)

print("Reasoning Content:")
print(response.choices[0].message.reasoning_content)

print("\nFinal Response:")
print(completion.choices[0].message.content)

print("\nNumber of completion tokens (input):")
print(completion.usage.completion_tokens)

print("\nNumber of reasoning tokens (input):")
print(completion.usage.completion_tokens_details.reasoning_tokens)
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

Number of completion tokens (input):
14

Number of reasoning tokens (input):
310
```
