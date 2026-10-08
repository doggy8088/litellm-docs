import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS Bedrock {#aws-bedrock}
所有 Bedrock 模型（Anthropic、Meta、Deepseek、Mistral、Amazon 等）皆受支援

| Property | Details |
|-------|-------|
| Description | Amazon Bedrock 是一項全代管服務，提供多種高效能基礎模型（FM）供您選擇。 |
| Provider Route on LiteLLM | `bedrock/`（適用於 GPT-5.6 及更新版本的 [原生 Chat Completions](#native-chat-completions-route)）、[`bedrock/chat_completions/`](#native-chat-completions-route)、[`bedrock/converse/`](#set-converse--invoke-route)、[`bedrock/invoke/`](/docs/providers/bedrock#set-converse--invoke-route)、[`bedrock/converse_like/`](/docs/providers/bedrock#calling-via-internal-proxy-not-bedrock-url-compatible)、`bedrock/llama/`、`bedrock/deepseek_r1/`、`bedrock/qwen3/`、[`bedrock/qwen2/`](./bedrock_imported.md#qwen2-imported-models)、[`bedrock/openai/`](./bedrock_imported.md#openai-compatible-imported-models-qwen-25-vl-etc)、[`bedrock/moonshot`](./bedrock_imported.md#moonshot-kimi-k2-thinking) |
| Provider Doc | [Amazon Bedrock ↗](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) |
| Supported OpenAI Endpoints | `/chat/completions`、`/completions`、`/embeddings`、`/images/generations`、`/v1/realtime`|
| Rerank Endpoint | `/rerank` |
| Pass-through Endpoint | [支援](../pass_through/bedrock.md) |

LiteLLM 需要在您的系統上安裝 `boto3`，才能處理 Bedrock 請求
```shell
uv add boto3>=1.28.57
```

:::info

針對 **Amazon Nova Models**：請升級至 v1.53.5+

:::

## 驗證 {#authentication}

:::info

LiteLLM 使用 boto3 處理驗證。以下所有選項皆受支援 - https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html#credentials.

:::
 
LiteLLM 除了傳統的 boto3 驗證方法外，也支援 API 金鑰驗證。若需更多 API 金鑰詳細資訊，請參閱 [文件](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html)。

選項 1：使用 AWS_BEARER_TOKEN_BEDROCK 環境變數 

```bash
export AWS_BEARER_TOKEN_BEDROCK="your-api-key"
```

選項 2：使用 api_key 參數在 completion、embedding、image_generation API 呼叫中傳入 API 金鑰。

<Tabs>
<TabItem value="sdk" label="SDK">
```python
response = completion(
  model="bedrock/us.anthropic.{{anthropic}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  api_key="your-api-key"
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">
```yaml
model_list:
  - model_name: bedrock-claude-sonnet-4-5
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      api_key: os.environ/AWS_BEARER_TOKEN_BEDROCK
```
</TabItem>
</Tabs>

## 用法 {#usage}

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_Bedrock.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="bedrock/us.anthropic.{{anthropic}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

以下示範如何透過 LiteLLM Proxy Server 呼叫 Bedrock

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: bedrock-claude-sonnet-4-5
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

所有可能的驗證參數： 

```
aws_access_key_id: Optional[str],
aws_secret_access_key: Optional[str],
aws_session_token: Optional[str],
aws_region_name: Optional[str],
aws_session_name: Optional[str],
aws_profile_name: Optional[str],
aws_role_name: Optional[str],
aws_web_identity_token: Optional[str],
aws_bedrock_runtime_endpoint: Optional[str],
api_key: Optional[str],
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml
```
### 3. 測試它

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "bedrock-claude-v1",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="bedrock-claude-v1", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000", # set openai_api_base to the LiteLLM Proxy
    model = "bedrock-claude-v1",
    temperature=0.1
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```
</TabItem>
</Tabs>

## 設定 temperature、top p 等 {#set-temperature-top-p-etc}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="bedrock/us.anthropic.{{anthropic}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  temperature=0.7,
  top_p=1
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      temperature: <your-temp>
      top_p: <your-top-p>
```

**在請求中設定**

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="bedrock-claude-v1", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7,
top_p=1
)

print(response)

```

</TabItem>
</Tabs>

## 傳遞提供者專屬參數 {#pass-provider-specific-params}

如果您傳遞給 litellm 的參數不是 openai 參數，我們會假設它是特定提供者的參數，並將其作為 kwarg 傳送到請求本文中。[查看更多](../completion/input.md#litellm-specific-params)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="bedrock/us.anthropic.{{anthropic}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  top_k=1 # 👈 PROVIDER-SPECIFIC PARAM
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      top_k: 1 # 👈 PROVIDER-SPECIFIC PARAM
```

**在請求中設定**

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="bedrock-claude-v1", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7,
extra_body={
    "top_k": 1 # 👈 PROVIDER-SPECIFIC PARAM
}
)

print(response)

```

</TabItem>
</Tabs>

## 用法 - 請求中繼資料 {#usage---request-metadata}

將中繼資料附加到 Bedrock 請求，以供記錄與成本歸因。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    requestMetadata={
        "cost_center": "engineering",
        "user_id": "user123"
    }
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      requestMetadata:
        cost_center: "engineering"
```

**在請求中設定**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="bedrock-claude-v1",
    messages=[{"role": "user", "content": "Hello"}],
    extra_body={
        "requestMetadata": {"cost_center": "engineering"}
    }
)
```

</TabItem>
</Tabs>

## 用法 - 函式呼叫 / 工具呼叫 {#usage---function-calling--tool-calling}

LiteLLM 支援透過 Bedrock 的 Converse 和 Invoke API 進行工具呼叫。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]
messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]

response = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)
# Add any assertions, here to check response args
print(response)
assert isinstance(response.choices[0].message.tool_calls[0].function.name, str)
assert isinstance(
    response.choices[0].message.tool_calls[0].function.arguments, str
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-3-7
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}} # for bedrock invoke, specify `bedrock/invoke/<model>`
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "bedrock-claude-3-7",
  "messages": [
    {
      "role": "user",
      "content": "What'\''s the weather like in Boston today?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"]
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}'

```


</TabItem>
</Tabs>

## 用法 - 視覺 {#usage---vision}

```python
from litellm import completion

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


def encode_image(image_path):
    import base64

    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


image_path = "../proxy/cached_logo.jpg"
# Getting the base64 string
base64_image = encode_image(image_path)
resp = litellm.completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Whats in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "data:image/jpeg;base64," + base64_image
                    },
                },
            ],
        }
    ],
)
print(f"\nResponse: {resp}")
```


## 用法 - 'thinking' / 'reasoning content' {#usage---thinking--reasoning-content}

目前僅支援 Anthropic 的 Claude 3.7 Sonnet + Deepseek R1 + GPT-OSS 模型。

適用於 v1.61.20+。

在 `message` 和 `delta` 物件中回傳 2 個新欄位：
- `reasoning_content` - string - 回應的推理內容
- `thinking_blocks` - list of objects（僅限 Anthropic）- 回應的 thinking 區塊

每個物件具有以下欄位：
- `type` - Literal["thinking"] - thinking 區塊的類型
- `thinking` - string - 回應的 thinking。也會在 `reasoning_content` 中回傳
- `signature` - string - 由 Anthropic 回傳的 base64 編碼字串。

若在傳入 'thinking' 內容時，Anthropic 在後續呼叫中需要 `signature`（僅在使用 `thinking` 搭配工具呼叫時需要）。[了解更多](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#understanding-thinking-blocks)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


resp = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",
)

print(resp)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-3-7
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      reasoning_effort: "low" # 👈 EITHER HERE OR ON REQUEST
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "bedrock-claude-3-7",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "low" # 👈 EITHER HERE OR ON CONFIG.YAML
  }'
```

</TabItem>
</Tabs>

**預期回應**

與 [Anthropic API 回應](../providers/anthropic#usage---thinking--reasoning_content) 相同。

```python
{
    "id": "chatcmpl-c661dfd7-7530-49c9-b0cc-d5018ba4727d",
    "created": 1740640366,
    "model": "us.anthropic.{{anthropic}}",
    "object": "chat.completion",
    "system_fingerprint": null,
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "The capital of France is Paris. It's not only the capital city but also the largest city in France, serving as the country's major cultural, economic, and political center.",
                "role": "assistant",
                "tool_calls": null,
                "function_call": null,
                "reasoning_content": "The capital of France is Paris. This is a straightforward factual question.",
                "thinking_blocks": [
                    {
                        "type": "thinking",
                        "thinking": "The capital of France is Paris. This is a straightforward factual question.",
                        "signature": "EqoBCkgIARABGAIiQL2UoU0b1OHYi+yCHpBY7U6FQW8/FcoLewocJQPa2HnmLM+NECy50y44F/kD4SULFXi57buI9fAvyBwtyjlOiO0SDE3+r3spdg6PLOo9PBoMma2ku5OTAoR46j9VIjDRlvNmBvff7YW4WI9oU8XagaOBSxLPxElrhyuxppEn7m6bfT40dqBSTDrfiw4FYB4qEPETTI6TA6wtjGAAqmFqKTo="
                    }
                ]
            }
        }
    ],
    "usage": {
        "completion_tokens": 64,
        "prompt_tokens": 42,
        "total_tokens": 106,
        "completion_tokens_details": null,
        "prompt_tokens_details": null
    }
}
```

### 傳遞 `thinking` 給 Anthropic 模型 {#pass-thinking-to-anthropic-models}

與 [Anthropic API 回應](../providers/anthropic#usage---thinking--reasoning_content) 相同。

## 用法 - `/chat/completions` 中的 Bedrock 搜尋引用 {#usage---bedrock-search-citations-in-chatcompletions}

如果您的工具回傳搜尋來源，而您希望在最終 assistant 回應中取得引文中繼資料，請在 `role: "tool"` 訊息上傳入 `search_results`。

### 請求結構 {#request-shape}

```json
{
  "model": "bedrock-claude-3-7",
  "messages": [
    {
      "role": "user",
      "content": "What is XX?"
    },
    {
      "role": "assistant",
      "tool_calls": [
        {
          "id": "tooluse_a4rBqeZNRTKj2lTskvaO4H",
          "type": "function",
          "function": {
            "name": "RAGRequest",
            "arguments": "{\"query\":\"What is Apptio?\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "tooluse_a4rBqeZNRTKj2lTskvaO4H",
      "content": "XX is a company that makes calls to Bedrock using passthrough APIs via LiteLLM",
      "search_results": [
        {
          "source": "https://www.xx.com/about",
          "title": "About XX",
          "content": [
            {
              "text": "XX is a company that makes calls to Bedrock using passthrough APIs via LiteLLM"
            }
          ],
          "citations": {
            "enabled": true
          }
        }
      ]
    }
  ]
}
```

### 您會收到的回應 {#what-you-get-back}

LiteLLM 會在 `message.content` 中回傳一般 assistant 文字，並在 `message.annotations` 中回傳引文中繼資料：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "XX is a technology business management company...",
        "annotations": [
          {
            "type": "url_citation",
            "url_citation": {
              "start_index": 0,
              "end_index": 42,
              "title": "About XX",
              "url": "https://www.xx.com/about"
            }
          }
        ]
      }
    }
  ]
}
```

:::note
如果您只傳送純 `tool.content` 文字（未包含 `search_results`），仍會得到正常答案，但不會有結構化的引文註解。
:::

## 用法 - Anthropic Beta 功能 {#usage---anthropic-beta-features}

LiteLLM 透過 `anthropic-beta` 標頭支援 Anthropic 在 AWS Bedrock 上的 beta 功能。這可讓您使用以下實驗性功能：

- **1M Context Window** - 最多 100 萬個 token 的上下文（Claude Opus 4.6、Sonnet 4.5、Sonnet 4）
- **Computer Use Tools** - 可與電腦介面互動的 AI
- **Token-Efficient Tools** - 更高效率的工具使用模式  
- **Extended Output** - 最多 128K 輸出 token
- **Enhanced Thinking** - 進階推理能力

### 支援的 Beta 功能 {#supported-beta-features}

| Beta Feature | Header Value | Compatible Models | Description |
|--------------|-------------|------------------|-------------|
| 1M Context Window | `context-1m-2025-08-07` | Claude Opus 4.6, Sonnet 4.5, Sonnet 4 | 啟用 100 萬 token 上下文視窗 |
| Computer Use (Latest) | `computer-use-2025-01-24` | Claude 3.7 Sonnet | 最新的 computer use 工具 |
| Computer Use (Legacy) | `computer-use-2024-10-22` | Claude 3.5 Sonnet v2 | Claude 3.5 的 computer use 工具 |
| Token-Efficient Tools | `token-efficient-tools-2025-02-19` | Claude 3.7 Sonnet | 更有效率的工具使用 |
| Interleaved Thinking | `interleaved-thinking-2025-05-14` | Claude 4 models | 增強的 thinking 能力 |
| Extended Output | `output-128k-2025-02-19` | Claude 3.7 Sonnet | 最多 128K 輸出 token |
| Developer Thinking | `dev-full-thinking-2025-05-14` | Claude 4 models | 供開發者使用的原始 thinking 模式 |

<Tabs>
<TabItem value="sdk" label="SDK">

**單一 Beta 功能**

```python keep-model-ids
from litellm import completion
import os

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

# Use 1M context window with Claude Sonnet 4
response = completion(
    model="bedrock/anthropic.claude-sonnet-4-20250514-v1:0",
    messages=[{"role": "user", "content": "Hello! Testing 1M context window."}],
    max_tokens=100,
    extra_headers={
        "anthropic-beta": "context-1m-2025-08-07"  # 👈 Enable 1M context
    }
)
```

**多個 Beta 功能**

```python keep-model-ids
from litellm import completion

# Combine multiple beta features (comma-separated)
response = completion(
    model="bedrock/converse/anthropic.claude-3-5-sonnet-20241022-v2:0",
    messages=[{"role": "user", "content": "Testing multiple beta features"}],
    max_tokens=100,
    extra_headers={
        "anthropic-beta": "computer-use-2024-10-22,context-1m-2025-08-07"
    }
)
```

**搭配 Beta 功能的 Computer Use 工具**

```python keep-model-ids
from litellm import completion

# Computer use tools automatically add computer-use-2024-10-22
# You can add additional beta features
response = completion(
    model="bedrock/converse/anthropic.claude-3-5-sonnet-20241022-v2:0",
    messages=[{"role": "user", "content": "Take a screenshot"}],
    tools=[{
        "type": "computer_20241022",
        "name": "computer",
        "display_width_px": 1920,
        "display_height_px": 1080
    }],
    extra_headers={
        "anthropic-beta": "context-1m-2025-08-07"  # Additional beta feature
    }
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**在 YAML 設定中設定**

```yaml keep-model-ids
model_list:
  - model_name: claude-sonnet-4-1m
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-4-20250514-v1:0
      extra_headers:
        anthropic-beta: "context-1m-2025-08-07"  # 👈 Enable 1M context

  - model_name: claude-computer-use
    litellm_params:
      model: bedrock/converse/anthropic.claude-3-5-sonnet-20241022-v2:0
      extra_headers:
        anthropic-beta: "computer-use-2024-10-22,context-1m-2025-08-07"

general_settings:
  forward_client_headers_to_llm_api: true  # 👈 Required for client-side header forwarding
```

**在請求中設定**

```python
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-1m",
    messages=[{
        "role": "user", 
        "content": "Testing 1M context window"
    }],
    extra_headers={
        "anthropic-beta": "context-1m-2025-08-07"
    }
)
```

:::info
**針對用戶端標頭轉送**：當使用 proxy 並從用戶端（例如 OpenAI SDK）傳送 `anthropic-beta` 標頭時，您需要在 proxy 的 `general_settings` 中啟用 `forward_client_headers_to_llm_api: true`。這會告訴 proxy 從 HTTP 請求中擷取標頭，並將其轉送至底層的 LLM 提供者。
:::

</TabItem>
</Tabs>

:::info

beta 功能可能需要您 AWS 帳戶中的特殊存取權或權限。某些功能僅在特定 AWS 區域可用。請查看 [AWS Bedrock 文件](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html) 以了解可用性與存取需求。

:::

### 工具呼叫的急切輸入串流 {#eager-input-streaming-for-tool-calls}

預設情況下，Claude 會先緩衝工具呼叫的整個輸入 JSON，之後才進行串流，因此大型工具呼叫（例如大檔案寫入）可能會讓串流保持靜默的時間夠長，進而觸發用戶端讀取逾時。請在工具上設定 `eager_input_streaming: true`，讓其輸入在生成時即進行串流。LiteLLM 會將此旗標轉換為每條 Bedrock 路由（Converse 和 Invoke，`/v1/chat/completions`、`/v1/messages`，以及 `/v1/responses`）上的 `fine-grained-tool-streaming-2025-05-14` beta，因此它適用於 Bedrock 上的所有 Claude 模型，包括那些會拒絕 per-tool 欄位的舊模型。此 beta 作用於整個請求：一旦某個工具設定了它，所有工具的輸入都會即時串流，而且串流出的增量在區塊結束前可能只是部分 JSON。

<Tabs>
<TabItem value="sdk" label="SDK">

```python keep-model-ids
from litellm import completion

response = completion(
    model="bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    messages=[{"role": "user", "content": "Write a 2000 word README to docs/README.md"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "write_file",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
                "required": ["path", "content"],
            },
        },
        "eager_input_streaming": True,
    }],
    stream=True,
)
for chunk in response:
    print(chunk.choices[0].delta.tool_calls)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**在 YAML 設定中設定**

```yaml keep-model-ids
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0  # bedrock/converse/ and bedrock/invoke/ work too
```

**OpenAI 格式，`/v1/chat/completions`**

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "bedrock-claude",
    "messages": [{"role": "user", "content": "Write a 2000 word README to docs/README.md"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "write_file",
        "parameters": {
          "type": "object",
          "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
          "required": ["path", "content"]
        }
      },
      "eager_input_streaming": true
    }],
    "stream": true
  }'
```

**Anthropic 格式，`/v1/messages`**

```bash
curl http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LITELLM_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "bedrock-claude",
    "max_tokens": 4096,
    "messages": [{"role": "user", "content": "Write a 2000 word README to docs/README.md"}],
    "tools": [{
      "name": "write_file",
      "input_schema": {
        "type": "object",
        "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
        "required": ["path", "content"]
      },
      "eager_input_streaming": true
    }],
    "stream": true
  }'
```

**OpenAI 回應格式，`/v1/responses`**

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "bedrock-claude",
    "input": "Write a 2000 word README to docs/README.md",
    "tools": [{
      "type": "function",
      "name": "write_file",
      "parameters": {
        "type": "object",
        "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
        "required": ["path", "content"]
      },
      "eager_input_streaming": true
    }],
    "stream": true
  }'
```

</TabItem>
</Tabs>

## 用法 - 結構化輸出 / JSON 模式 {#usage---structured-output--json-mode}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os 
from pydantic import BaseModel

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

class CalendarEvent(BaseModel):
  name: str
  date: str
  participants: list[str]

class EventsList(BaseModel):
    events: list[CalendarEvent]

response = completion(
  model="bedrock/anthropic.{{anthropic}}", # specify invoke via `bedrock/invoke/anthropic.{{anthropic}}`
  response_format=EventsList,
  messages=[
    {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
    {"role": "user", "content": "Who won the world series in 2020?"}
  ],
)
print(response.choices[0].message.content)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-3-7
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}} # specify invoke via `bedrock/invoke/<model_name>` 
      aws_access_key_id: os.environ/CUSTOM_AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/CUSTOM_AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/CUSTOM_AWS_REGION_NAME
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "bedrock-claude-3-7",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant designed to output JSON."
      },
      {
        "role": "user",
        "content": "Who won the worlde series in 2020?"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "math_reasoning",
        "description": "reason about maths",
        "schema": {
          "type": "object",
          "properties": {
            "steps": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "explanation": { "type": "string" },
                  "output": { "type": "string" }
                },
                "required": ["explanation", "output"],
                "additionalProperties": false
              }
            },
            "final_answer": { "type": "string" }
          },
          "required": ["steps", "final_answer"],
          "additionalProperties": false
        },
        "strict": true
      }
    }
  }'
```
</TabItem>
</Tabs>

## 用法 - 延遲最佳化推論 {#usage---latency-optimized-inference}

自 v1.65.1+ 起有效

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    performanceConfig={"latency": "optimized"},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-3-7
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      performanceConfig: {"latency": "optimized"} # 👈 EITHER HERE OR ON REQUEST
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "bedrock-claude-3-7",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "performanceConfig": {"latency": "optimized"} # 👈 EITHER HERE OR ON CONFIG.YAML
  }'
```

</TabItem>
</Tabs>

## 用法 - 服務層級 {#usage---service-tier}

使用 `serviceTier` 控制 Bedrock 請求的處理層級。有效值為 `priority`、`default` 或 `flex`。

- `priority`：具保證容量的較高優先順序處理
- `default`：標準處理層級
- `flex`：適用於批次工作負載的成本最佳化處理

[Bedrock ServiceTier API 參考](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ServiceTier.html)

### OpenAI 相容的 `service_tier` 參數 {#openai-compatible-service_tier-parameter}

LiteLLM 也支援 OpenAI 風格的 `service_tier` 參數，並會自動轉換為 Bedrock 原生的 `serviceTier` 格式：

| OpenAI `service_tier` | Bedrock `serviceTier` |
|-----------------------|----------------------|
| `"priority"` | `{"type": "priority"}` |
| `"default"` | `{"type": "default"}` |
| `"flex"` | `{"type": "flex"}` |
| `"auto"` | `{"type": "default"}` |

```python
from litellm import completion

# Using OpenAI-style service_tier parameter
response = completion(
    model="bedrock/converse/us.anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "Hello!"}],
    service_tier="priority"  # Automatically translated to serviceTier={"type": "priority"}
)
```

### 原生 Bedrock `serviceTier` 參數 {#native-bedrock-servicetier-parameter}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/converse/qwen.qwen3-235b-a22b-2507-v1:0",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    serviceTier={"type": "priority"},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: qwen3-235b-priority
    litellm_params:
      model: bedrock/converse/qwen.qwen3-235b-a22b-2507-v1:0
      aws_region_name: ap-northeast-1
      serviceTier:
        type: priority
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "qwen3-235b-priority",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "serviceTier": {"type": "priority"}
  }'
```

</TabItem>
</Tabs>
## 用法 - Bedrock 防護欄 {#usage---bedrock-guardrails}

使用 [LiteLLM 搭配 Bedrock Guardrails 的範例](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-converse-api.html)

### 使用 `guarded_text` 進行選擇性內容審查 {#selective-content-moderation-with-guarded_text}

LiteLLM 支援使用 `guarded_text` 內容類型進行選擇性內容審核。這可讓您只包裝應由 Bedrock Guardrails 審核的特定內容，而不是評估整段對話。

**運作方式：**
- 具有 `type: "guarded_text"` 的內容會自動包裝在 `guardrailConverseContent` 區塊中
- 只有被包裝的內容會由 Bedrock Guardrails 評估
- 具有 `type: "text"` 的一般內容會繞過 guardrail 評估

:::note
如果未使用 `guarded_text`，整段對話歷史都會送到 guardrail 進行評估，這可能會增加延遲與成本。
:::

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
    model="us.anthropic.{{anthropic}}",
    messages=[
        {
            "content": "where do i buy coffee from? ",
            "role": "user",
        }
    ],
    max_tokens=10,
    guardrailConfig={
        "guardrailIdentifier": "ff6ujrregl1q", # The identifier (ID) for the guardrail.
        "guardrailVersion": "DRAFT",           # The version of the guardrail.
        "trace": "disabled",                   # The trace behavior for the guardrail. Can either be "disabled" or "enabled"
    },
)

# Selective guardrail usage with guarded_text - only specific content is evaluated
response_guard = completion(
    model="us.anthropic.{{anthropic}}",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is the main topic of this legal document?"},
                {"type": "guarded_text", "text": "This      document contains sensitive legal information that should be moderated by guardrails."}
            ]
        }
    ],
    guardrailConfig={
        "guardrailIdentifier": "gr-abc123",
        "guardrailVersion": "DRAFT"
    }
)
```
</TabItem>
<TabItem value="proxy" label="依請求的 Proxy">

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="us.anthropic.{{anthropic}}", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7,
extra_body={
    "guardrailConfig": {
        "guardrailIdentifier": "ff6ujrregl1q", # The identifier (ID) for the guardrail.
        "guardrailVersion": "DRAFT",           # The version of the guardrail.
        "trace": "disabled",                   # The trace behavior for the guardrail. Can either be "disabled" or "enabled"
    },
}
)

print(response)
```
</TabItem>
<TabItem value="proxy-config" label="依 config.yaml 的 Proxy">

1. 更新 config.yaml 

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/CUSTOM_AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/CUSTOM_AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/CUSTOM_AWS_REGION_NAME
      guardrailConfig: {
        "guardrailIdentifier": "ff6ujrregl1q", # The identifier (ID) for the guardrail.
        "guardrailVersion": "DRAFT",           # The version of the guardrail.
        "trace": "disabled",                   # The trace behavior for the guardrail. Can either be "disabled" or "enabled"
    }

```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="bedrock-claude-v1", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7
)

# For adding selective guardrail usage with guarded_text
response_guard = client.chat.completions.create(model="bedrock-claude-v1", messages = [
   {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is the main topic of this legal document?"},
                {"type": "guarded_text", "text": "This document contains sensitive legal information that should be moderated by guardrails."}
            ]
  }
],
temperature=0.7
) 

print(response_guard)
```
</TabItem>
</Tabs>

## 用法 - "Assistant 預填" {#usage---assistant-pre-fill}

如果您使用 Bedrock 上的 Anthropic Claude，您可以透過在 `messages` 陣列中的最後一個項目加入 `assistant` 角色訊息，來「替 Claude 補上說詞」。

:::info

回傳的完成內容 _**不會**_ 包含您的「pre-fill」文字，因為它是提示本身的一部分。請務必在 Claude 的完成內容前加上您的 pre-fill。

:::

```python keep-model-ids
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

messages = [
    {"role": "user", "content": "How do you say 'Hello' in German? Return your answer as a JSON object, like this:\n\n{ \"Hello\": \"Hallo\" }"},
    {"role": "assistant", "content": "{"},
]
response = completion(model="bedrock/anthropic.claude-v2", messages=messages)
```

### 傳送給 Claude 的範例提示詞 {#example-prompt-sent-to-claude}

```

Human: How do you say 'Hello' in German? Return your answer as a JSON object, like this:

{ "Hello": "Hallo" }

Assistant: {
```

## 用法 - "System" 訊息 {#usage---system-messages}
如果您在 Bedrock 上使用 Anthropic 的 Claude 2.1，`system` 角色訊息會為您正確格式化。

```python keep-model-ids
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

messages = [
    {"role": "system", "content": "You are a snarky assistant."},
    {"role": "user", "content": "How do I boil water?"},
]
response = completion(model="bedrock/anthropic.claude-v2:1", messages=messages)
```

### 傳送給 Claude 的範例提示詞 {#example-prompt-sent-to-claude-1}

```
You are a snarky assistant.

Human: How do I boil water?

Assistant:
```


## 用法 - 串流 {#usage---streaming}
```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="bedrock/us.anthropic.{{anthropic}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True
)
for chunk in response:
  print(chunk)
```

#### 範例串流輸出區塊 {#example-streaming-output-chunk}
```json
{
  "choices": [
    {
      "finish_reason": null,
      "index": 0,
      "delta": {
        "content": "ase can appeal the case to a higher federal court. If a higher federal court rules in a way that conflicts with a ruling from a lower federal court or conflicts with a ruling from a higher state court, the parties involved in the case can appeal the case to the Supreme Court. In order to appeal a case to the Sup"
      }
    }
  ],
  "created": null,
  "model": "us.anthropic.{{anthropic}}",
  "usage": {
    "prompt_tokens": null,
    "completion_tokens": null,
    "total_tokens": null
  }
}
```

## 跨區域推論 {#cross-region-inferencing}

LiteLLM 支援跨所有[支援的 bedrock 模型](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference-support.html)的 Bedrock [跨區域推論](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion 
import os 


os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


litellm.set_verbose = True #  👈 SEE RAW REQUEST 

response = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=messages,
    max_tokens=10,
    temperature=0.1,
)

print("Final Response: {}".format(response))
```

</TabItem>
<TabItem value="proxy" label="PROXY">

#### 1. 設定 config.yaml {#1-setup-configyaml-1}

```yaml
model_list:
  - model_name: bedrock-claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```


#### 2. 啟動 proxy {#2-start-the-proxy-1}

```bash
litellm --config /path/to/config.yaml
```

#### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "bedrock-claude-sonnet",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="bedrock-claude-sonnet", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000", # set openai_api_base to the LiteLLM Proxy
    model = "bedrock-claude-sonnet",
    temperature=0.1
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```

</TabItem>
</Tabs>
</TabItem>
</Tabs>

## 設定 'converse' / 'invoke' 路由 {#set-converse--invoke-route}

:::info

自 LiteLLM 版本 `v1.53.5` 起支援

:::

LiteLLM 預設使用 `invoke` 路由。LiteLLM 會針對支援的 Bedrock 模型使用 `converse` 路由。

若要明確設定路由，請使用 `bedrock/converse/<model>` 或 `bedrock/invoke/<model>`。

GPT-5.6 及更新版本是例外：它們預設使用 AWS 的 OpenAI 相容端點，而 `bedrock/chat_completions/<model>` 會讓 AWS 在該端點提供的其他模型也一併採用。請參閱[原生 Chat Completions 路由](#native-chat-completions-route)。

例如 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

completion(model="bedrock/converse/us.amazon.nova-pro-v1:0")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: bedrock-model
    litellm_params:
      model: bedrock/converse/us.amazon.nova-pro-v1:0
```

</TabItem>
</Tabs>

## 原生聊天補全路由 {#native-chat-completions-route}

AWS 在 OpenAI 相容端點上提供部分 Bedrock 模型，`https://bedrock-runtime.{region}.amazonaws.com/openai/v1/chat/completions`。對於這些模型，LiteLLM 可以將您的 `/chat/completions` 請求，以它送達時的原始形狀傳送到該端點，而不是先轉換為 Converse 再轉回。轉換次數越少，延遲越低，參數遺失的機會也越少。

| 模型 | LiteLLM 模型名稱 | 預設路由 |
|-------|--------------------|---------------|
| GPT-5.6 Sol、Terra、Luna | `bedrock/us.openai.gpt-5.6-sol`、`bedrock/global.openai.gpt-5.6-sol`，以及 `terra` / `luna` 變體 | 原生 Chat Completions |
| GPT-6 Sol、Astra、Luna | `bedrock/us.openai.gpt-6-sol`、`bedrock/global.openai.gpt-6-sol`，以及 `astra` / `luna` 變體 | 原生 Chat Completions |
| GPT-6.1 Sol | `bedrock/us.openai.gpt-6.1-sol`、`bedrock/global.openai.gpt-6.1-sol` | 原生 Chat Completions |
| GPT-OSS 20B、120B | `bedrock/openai.gpt-oss-20b-1:0`、`bedrock/openai.gpt-oss-120b-1:0`，以及 `us-gov.` 設定檔 ID | Converse；原生 Chat Completions 使用 `bedrock/chat_completions/openai.gpt-oss-20b-1:0` |
| Grok 4.6 | `bedrock/us.xai.grok-4.6`、`bedrock/global.xai.grok-4.6`、`bedrock/us-gov.xai.grok-4.6` | Converse；原生 Chat Completions 使用 `bedrock/chat_completions/us.xai.grok-4.6` |
| 其他所有項目（Claude、Nova、Llama、Mistral、...） | `bedrock/<model-id>` | 依照先前方式使用 Converse 或 Invoke |

GPT-5.6 及更新版本（`openai.gpt-5.6-*`、`openai.gpt-6-*`、`openai.gpt-6.1-*`，以及後續版本）在其於 [model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中的項目將 `/v1/chat/completions` 列在 `supported_endpoints` 下時，預設會採用原生路由，這與將模型啟用原生 `/v1/responses` 路由所用的相同鍵。較舊的 GPT ids、GPT-OSS 與 Grok 會維持先前的 Converse 路由，除非您在模型前綴加上 `bedrock/chat_completions/`，而 `bedrock/converse/` 則會將任何模型固定到 Converse。驗證、區域、`aws_bedrock_runtime_endpoint` 與成本追蹤在兩種路由上的運作方式相同。模型名稱中的區域路徑（`bedrock/chat_completions/us-gov-west-1/openai.gpt-oss-20b-1:0`）也同樣有效：區域會決定端點，而其後的 id 才是 AWS 接收的內容，且明確的 `aws_region_name` 仍會優先於路徑。[`bedrock/openai/<imported-model-arn>`](./bedrock_imported.md#openai-compatible-imported-models-qwen-25-vl-etc) 是匯入模型的獨立路由，且維持不變。

取捨在於 OpenAI 相容端點對少數 Converse 功能沒有對應，因此當您使用其中之一時，LiteLLM 會在每次請求時回退到 Converse：

| 請求 | 使用的路由 | 原因 |
|---------|------------|-----|
| 在請求本文中使用 `guardrailConfig` | Converse | AWS 在 OpenAI 相容端點上將 guardrails 視為 `X-Amzn-Bedrock-Guardrail*` 標頭，並拒絕 `guardrailConfig` 本文欄位，因此 LiteLLM 會將這些請求保留在 Converse，上述 guardrail 行為不會改變 |
| 在請求本文中使用 `requestMetadata`、`performanceConfig`、`serviceTier` 或 `outputConfig` | Converse | 這些 Converse 本文欄位會在 OpenAI 相容端點上被以格式錯誤的輸入拒絕 |
| 在 `litellm_settings` 中設定 `bedrock_request_metadata_fields` | Converse，適用於每一個請求 | LiteLLM 只會將操作員的請求中繼資料寫入 Converse 本文 |
| 以 Application inference profile ARN 作為模型 | Converse | LiteLLM 無法從 ARN 判斷其對應的前端模型 |
| 在不含 `"supports_bedrock_runtime_chat_completions_tools_with_reasoning": true` 的成本 map（目前為 GPT-5.6、GPT-6 與 GPT-6.1 系列）中的模型上，搭配非 `"none"`（或未設定）的 `reasoning_effort` 函式 `tools` | Converse | AWS 僅在 `reasoning_effort` 為 `"none"` 時，才接受這些模型在 Chat Completions 上使用 function tools，而 GPT-6.1 根本不接受 `"none"`，因此其工具呼叫一律經由 Converse；GPT-OSS 與 Grok 帶有該旗標，且可在任何 effort 下使用工具 |
| 搭配 `"type": "json_object"` 的 `response_format`，無論是否有 LiteLLM 的 `response_schema` 鍵，適用於任何模型 | Converse | AWS 的 OpenAI 相容端點對 `json_object` 會回傳 400，除非某則訊息包含「json」一詞，因此 LiteLLM 保留 Converse 的處理方式：`response_schema` 會變成強制的 `json_tool_call` 工具，並回傳您要求的 JSON，而無 schema 的 `json_object` 則如同先前在 Converse 上的行為 |
| JSON schema `response_format`（`{"type": "json_schema", ...}` 或 Pydantic model），在不含 `"supports_bedrock_runtime_chat_completions_response_format": true` 的成本 map 中的模型上（目前為 GPT-OSS） | Converse | AWS 在 Chat Completions 上接受 GPT-OSS 的 `response_format`，但最後仍只回傳自由文字，因此 LiteLLM 保留 Converse 的模擬方式（強制 `json_tool_call` 工具），以回傳您要求的 JSON；GPT-5.6 及更新版本與 Grok 帶有該旗標，並會原生強制 schema |
| `stop` 序列 | Converse | Converse 會將 `stop` 轉送為 `stopSequences`，而 AWS 對這些模型會回傳 400，與此路由存在前相同；若原生送出，GPT-OSS 與 Grok 會將 `stop` 套用到其隱藏推理內容，並回傳空白內容，這比錯誤更糟 |
| `top_k` 或 `additionalModelRequestFields` | Converse | 只有 Converse 會轉送這些模型特定欄位 |
| `thinking` 區塊在 `/chat/completions` 上 | Converse | OpenAI 相容端點沒有 `thinking` 欄位；在 `/v1/messages` 上，LiteLLM 會將 `thinking` 對應到 `reasoning_effort`，而請求會維持原生 |
| `bedrock/converse/<model>` | Converse | 因為您明確要求了它 |

在原生路由上您會注意到：回應帶有 AWS 自己的 `id` 與 `service_tier` 欄位，工具呼叫 id 也改為 AWS 自己的（GPT-5.6 及更新系列與 Grok 使用 `call_0`，GPT-OSS 使用 `chatcmpl-tool-...`），而不是 `tooluse_...`，`max_tokens` 會以 `max_completion_tokens` 送出，JSON schema `response_format` 與 `service_tier` 會照您寫的方式傳送，`n` 大於 1 不受支援（如同在 Converse），GPT-OSS 的推理會以 `reasoning_content` 回傳（LiteLLM 會將 AWS 回傳的行內 `<reasoning>...</reasoning>` 前綴拆出）且不含 Converse 專用的 `thinking_blocks` 欄位，訊息中的 `http(s)://` 圖片 URL 會由 LiteLLM 下載，並以 `data:` URL 內嵌送出，因為端點本身不會抓取遠端圖片，而 Grok 會捨棄 `reasoning_effort: "none"`（它總是會推理），同時 `low`、`medium`、`high` 與 `xhigh` 會照常傳送。

在 GPT-5.6 及更新系列上，AWS 會將 `temperature`、`top_p`、`frequency_penalty`、`presence_penalty`、`logprobs` 與 `top_logprobs` 綁定到推理關閉：當 `reasoning_effort: "none"` 時，LiteLLM 會照您寫的方式傳送；而在任何其他 effort，或未設定時，AWS 會回傳 400，因此 LiteLLM 會預先回傳 400 並標明這些參數，或者在 `drop_params` 開啟時將它們移除。GPT-6.1 完全不接受 `"none"`，所以它在 Bedrock 上從不進行取樣。Converse 會在任何 effort 下拒絕這些模型的 `temperature` 與 `top_p`，因此在原生路由上使用 `reasoning_effort: "none"` 是取樣它們的唯一方式。GPT-OSS 一律拒絕 `logit_bias`，而 Grok 一律拒絕 penalties，無論任何 effort，且處理方式同樣是回傳 400 或移除。

若要將 GPT-OSS 或 Grok 送往原生端點，請在模型前綴加上 `bedrock/chat_completions/`：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

completion(model="bedrock/chat_completions/openai.gpt-oss-20b-1:0", messages=[{"role": "user", "content": "Hello"}])
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-oss-20b-native
    litellm_params:
      model: bedrock/chat_completions/openai.gpt-oss-20b-1:0
```

</TabItem>
</Tabs>

若要讓 GPT-5.6 或更新的模型在每次請求都使用 Converse，請明確設定路由：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

completion(model="bedrock/converse/us.openai.gpt-5.6-sol", messages=[{"role": "user", "content": "Hello"}])
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-5.6-sol-converse
    litellm_params:
      model: bedrock/converse/us.openai.gpt-5.6-sol
```

</TabItem>
</Tabs>

## 替代的 user/assistant 訊息 {#alternate-userassistant-messages}

使用 `user_continue_message` 來加入預設的使用者訊息，適用於（例如 Autogen）用戶端可能不會遵循交替的 user/assistant 訊息、且必須以使用者訊息開始與結束的情況。 

```yaml
model_list:
  - model_name: "bedrock-claude"
    litellm_params:
      model: "bedrock/us.anthropic.{{anthropic}}"
      user_continue_message: {"role": "user", "content": "Please continue"}
```

或

只要設定 `litellm.modify_params=True`，LiteLLM 就會以 default user_continue_message 自動處理此事。

```yaml
model_list:
  - model_name: "bedrock-claude"
    litellm_params:
      model: "bedrock/us.anthropic.{{anthropic}}"

litellm_settings:
   modify_params: true
```

試試看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "bedrock-claude",
    "messages": [{"role": "assistant", "content": "Hey, how's it going?"}]
}'
```

## 用法 - PDF / 文件理解 {#usage---pdf--document-understanding}

LiteLLM 支援 Bedrock 模型的文件理解 - [AWS Bedrock 文件](https://docs.aws.amazon.com/nova/latest/userguide/modalities-document.html)。

:::info

LiteLLM 支援所有 Bedrock 文件類型 -

例如："pdf"、"csv"、"doc"、"docx"、"xls"、"xlsx"、"html"、"txt"、"md"

您也可以將這些以 `image_url` 或 `base64` 的形式傳入

:::

### url {#url}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm.utils import supports_pdf_input, completion

# set aws credentials
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


# pdf url
image_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

# Download the file
response = requests.get(url)
file_data = response.content

encoded_file = base64.b64encode(file_data).decode("utf-8")

# model
model = "bedrock/us.anthropic.{{anthropic}}"

image_content = [
    {"type": "text", "text": "What's this file about?"},
    {
        "type": "file",
        "file": {
            "file_data": f"data:application/pdf;base64,{encoded_file}", # 👈 PDF
        }
    },
]


if not supports_pdf_input(model, None):
    print("Model does not support image input")

response = completion(
    model=model,
    messages=[{"role": "user", "content": image_content}],
)
assert response is not None
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 試試看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "bedrock-model",
    "messages": [
        {"role": "user", "content": {"type": "text", "text": "What's this file about?"}},
        {
            "type": "file",
            "file": {
                "file_data": f"data:application/pdf;base64,{encoded_file}", # 👈 PDF
            }
        }
    ]
}'
```
</TabItem>
</Tabs>

### base64 {#base64}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm.utils import supports_pdf_input, completion

# set aws credentials
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


# pdf url
image_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
response = requests.get(url)
file_data = response.content

encoded_file = base64.b64encode(file_data).decode("utf-8")
base64_url = f"data:application/pdf;base64,{encoded_file}"

# model
model = "bedrock/us.anthropic.{{anthropic}}"

image_content = [
    {"type": "text", "text": "What's this file about?"},
    {
        "type": "image_url",
        "image_url": base64_url, # OR {"url": base64_url}
    },
]


if not supports_pdf_input(model, None):
    print("Model does not support image input")

response = completion(
    model=model,
    messages=[{"role": "user", "content": image_content}],
)
assert response is not None
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 試試看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "bedrock-model",
    "messages": [
        {"role": "user", "content": {"type": "text", "text": "What's this file about?"}},
        {
            "type": "image_url",
            "image_url": "data:application/pdf;base64,{b64_encoded_file}",
        }
    ]
}'
```
</TabItem>
</Tabs>

### OpenAI GPT OSS {#openai-gpt-oss}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/converse/openai.gpt-oss-20b-1:0`、`bedrock/converse/openai.gpt-oss-120b-1:0`；[原生 Chat Completions 路由](#native-chat-completions-route) 則使用 `bedrock/chat_completions/openai.gpt-oss-20b-1:0` |
| 提供者文件 | [Amazon Bedrock ↗](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) |

<Tabs>
<TabItem value="sdk" label="SDK">

```python title="GPT OSS SDK Usage" showLineNumbers
from litellm import completion
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-east-1"

# GPT OSS 20B model
response = completion(
    model="bedrock/converse/openai.gpt-oss-20b-1:0",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)
print(response.choices[0].message.content)

# GPT OSS 120B model  
response = completion(
    model="bedrock/converse/openai.gpt-oss-120b-1:0",
    messages=[{"role": "user", "content": "Explain machine learning in simple terms"}],
)
print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-oss-20b
    litellm_params:
      model: bedrock/converse/openai.gpt-oss-20b-1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
      
  - model_name: gpt-oss-120b
    litellm_params:
      model: bedrock/converse/openai.gpt-oss-120b-1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy" showLineNumbers
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試！**

```bash title="Test GPT OSS via Proxy" showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header "Authorization: Bearer $LITELLM_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gpt-oss-20b",
    "messages": [
      {
        "role": "user", 
        "content": "What are the key benefits of open source AI?"
      }
    ]
  }'
```

</TabItem>
</Tabs>

## 原生 Responses API 上的 OpenAI 模型 {#openai-models-on-the-native-responses-api}

AWS 透過 bedrock-runtime 的專屬 Responses 端點提供其 OpenAI 模型，`https://bedrock-runtime.{region}.amazonaws.com/openai/v1/responses`。對於選擇加入的模型，LiteLLM 會依照請求原本的形狀，將您的 `/v1/responses` 請求送到那裡，而不是透過 Chat Completions 橋接轉換成 Converse。這正是讓僅限 Responses 的參數能正常運作的原因：`prompt_cache_key` 會送達 Bedrock，而重複呼叫會在 `usage.input_tokens_details` 回報快取的 token，這在橋接層會以 `bedrock does not support parameters: ['prompt_cache_key']` 回傳 400。

模型會透過其在 [model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中項目的 `"supported_endpoints": ["/v1/responses"]` 來選擇加入。現今這包括 GPT-5.4、GPT-5.5、GPT-5.6（Sol、Terra、Luna）以及 GPT-6（Astra、Sol、Luna）的 `us.` 與 `global.` inference profiles，因此 `bedrock/us.openai.gpt-6-astra` 和 `bedrock/global.openai.gpt-5.6-sol` 會走原生路徑，而 `bedrock/openai.gpt-oss-120b-1:0` 保留橋接。此旗標可透過 proxy 上的 `model_info` 或 SDK 中的 `litellm.register_model` 針對每個部署覆寫，因此導入模型只需要變更 JSON。

驗證、區域與成本追蹤的運作方式與 Converse 相同：使用 SigV4 憑證或 Bedrock API 金鑰作為 `api_key`，主機則依區域的 partition 選定。若 `aws_bedrock_runtime_endpoint` 已經以 `/openai/v1/responses`、`/v1/responses` 或 `/responses` 結尾，則會原樣使用。

原生路徑上的不同之處：`background` 會被移除並記錄 proxy 警告，因為 bedrock-runtime 會拒絕它，而橋接層本來也不會轉送。`web_search` 工具會被移除並記錄警告，因為 bedrock-runtime 回應不支援 web 搜尋。`file_search` 會保留 LiteLLM 的模擬。遠端 `http(s)` 圖片 URL、在 `input_image` 區塊中、在 `function_call_output` 清單中，以及在 `computer_call_output` 截圖中的內容，會被下載並內嵌為 data URI，因為 bedrock-runtime 只接受 `data:` 和 `s3://` 圖片。串流運作方式與 OpenAI 相同。

<Tabs>
<TabItem value="sdk" label="SDK">

```python title="Native Responses API SDK Usage" showLineNumbers
import os
from litellm import responses

os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-east-1"

response = responses(
    model="bedrock/us.openai.gpt-6-astra",
    input="Reply with the single word pong.",
    prompt_cache_key="my-session",
)
print(response.output_text)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: bedrock-gpt-6-astra
    litellm_params:
      model: bedrock/us.openai.gpt-6-astra
      aws_region_name: us-east-1
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 呼叫 `/v1/responses`**

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "bedrock-gpt-6-astra",
    "input": "Reply with the single word pong.",
    "prompt_cache_key": "my-session"
  }'
```

</TabItem>
</Tabs>

## TwelveLabs Pegasus - 影片理解 {#twelvelabs-pegasus---video-understanding}

TwelveLabs Pegasus 1.2 是一個影片理解模型，可分析並描述影片內容。LiteLLM 透過 Bedrock 的 `/invoke` 端點支援此模型。

| Property | 詳細資訊 |
|----------|---------|
| Provider Route | `bedrock/us.twelvelabs.pegasus-1-2-v1:0`, `bedrock/eu.twelvelabs.pegasus-1-2-v1:0` |
| Provider Documentation | [TwelveLabs Pegasus 文件 ↗](https://docs.twelvelabs.io/docs/models/pegasus) |
| Supported Parameters | `max_tokens`, `temperature`, `response_format` |
| Media Input | S3 URI 或 base64 編碼的影片 |

### 支援的功能 {#supported-features}

- **影片分析**：從 S3 或 base64 輸入分析影片內容
- **結構化輸出**：支援具有 JSON schema 的回應格式
- **S3 整合**：支援具有 bucket owner 指定的 S3 影片 URL

### 搭配 S3 影片使用 {#usage-with-s3-video}

<Tabs>
<TabItem value="sdk" label="SDK">

```python title="TwelveLabs Pegasus SDK Usage" showLineNumbers
from litellm import completion
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-east-1"

response = completion(
    model="bedrock/us.twelvelabs.pegasus-1-2-v1:0",
    messages=[{"role": "user", "content": "Describe what happens in this video."}],
    mediaSource={
        "s3Location": {
            "uri": "s3://your-bucket/video.mp4",
            "bucketOwner": "123456789012",  # 12-digit AWS account ID
        }
    },
    temperature=0.2
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: pegasus-video
    litellm_params:
      model: bedrock/us.twelvelabs.pegasus-1-2-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy" showLineNumbers
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試！**

```bash title="Test Pegasus via Proxy" showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header "Authorization: Bearer $LITELLM_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "pegasus-video",
    "messages": [
      {
        "role": "user",
        "content": "Describe what happens in this video."
      }
    ],
    "mediaSource": {
      "s3Location": {
        "uri": "s3://your-bucket/video.mp4",
        "bucketOwner": "123456789012"
      }
    },
    "temperature": 0.2
  }'
```

</TabItem>
</Tabs>

### 搭配 Base64 影片使用 {#usage-with-base64-video}

您也可以直接以 base64 傳遞影片內容：

```python title="Base64 Video Input" showLineNumbers
from litellm import completion
import base64

# Read video file and encode to base64
with open("video.mp4", "rb") as video_file:
    video_base64 = base64.b64encode(video_file.read()).decode("utf-8")

response = completion(
    model="bedrock/us.twelvelabs.pegasus-1-2-v1:0",
    messages=[{"role": "user", "content": "What is happening in this video?"}],
    mediaSource={
        "base64String": video_base64
    },
    temperature=0.2,
)

print(response.choices[0].message.content)
```

### 重要注意事項 {#important-notes}

- **回應格式**：此模型透過 `response_format` 與 JSON schema 支援結構化輸出

## 預先佈建輸送量模型 {#provisioned-throughput-models}
若要使用 provisioned throughput 的 Bedrock 模型，請傳入 
- `model=bedrock/<base-model>`，範例 `model=bedrock/anthropic.{{anthropic}}`。將 `model` 設為任一 [支援的 AWS 模型](#supported-aws-bedrock-models)
- `model_id=provisioned-model-arn` 

Completion
```python
import litellm
response = litellm.completion(
    model="bedrock/anthropic.{{anthropic}}",
    model_id="provisioned-model-arn",
    messages=[{"content": "Hello, how are you?", "role": "user"}]
)
```

Embedding
```python
import litellm
response = litellm.embedding(
    model="bedrock/amazon.titan-embed-text-v1",
    model_id="provisioned-model-arn",
    input=["hi"],
)
```


## 支援的 AWS Bedrock 模型 {#supported-aws-bedrock-models}

LiteLLM 支援所有 Bedrock 模型。 

以下是使用 LiteLLM 搭配 bedrock 模型的範例。完整清單請參考 [model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)

| 模型名稱                 | 指令                                                          |
|----------------------------|------------------------------------------------------------------|
| GPT-OSS 20B | `completion(model='bedrock/converse/openai.gpt-oss-20b-1:0', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| GPT-OSS 120B | `completion(model='bedrock/converse/openai.gpt-oss-120b-1:0', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Deepseek R1    | `completion(model='bedrock/us.deepseek.r1-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude Sonnet 4.5    | `completion(model='bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V3.5 Sonnet    | `completion(model='bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V3  sonnet    | `completion(model='bedrock/anthropic.claude-3-sonnet-20240229-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V3 Haiku     | `completion(model='bedrock/anthropic.claude-3-haiku-20240307-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V3 Opus     | `completion(model='bedrock/anthropic.claude-3-opus-20240229-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V2.1      | `completion(model='bedrock/anthropic.claude-v2:1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-V2        | `completion(model='bedrock/anthropic.claude-v2', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Anthropic Claude-Instant V1 | `completion(model='bedrock/anthropic.claude-instant-v1', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Meta llama3-1-405b        | `completion(model='bedrock/meta.llama3-1-405b-instruct-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Meta llama3-1-70b        | `completion(model='bedrock/meta.llama3-1-70b-instruct-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Meta llama3-1-8b        | `completion(model='bedrock/meta.llama3-1-8b-instruct-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Meta llama3-70b        | `completion(model='bedrock/meta.llama3-70b-instruct-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Meta llama3-8b | `completion(model='bedrock/meta.llama3-8b-instruct-v1:0', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`           |
| Amazon Titan Lite          | `completion(model='bedrock/amazon.titan-text-lite-v1', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Amazon Titan Express       | `completion(model='bedrock/amazon.titan-text-express-v1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Cohere Command             | `completion(model='bedrock/cohere.command-text-v14', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| AI21 J2-Mid                | `completion(model='bedrock/ai21.j2-mid-v1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| AI21 J2-Ultra              | `completion(model='bedrock/ai21.j2-ultra-v1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| AI21 Jamba-Instruct              | `completion(model='bedrock/ai21.jamba-instruct-v1:0', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Meta Llama 2 Chat 13b      | `completion(model='bedrock/meta.llama2-13b-chat-v1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Meta Llama 2 Chat 70b      | `completion(model='bedrock/meta.llama2-70b-chat-v1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Mistral 7B Instruct        | `completion(model='bedrock/mistral.mistral-7b-instruct-v0:2', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Mixtral 8x7B Instruct      | `completion(model='bedrock/mistral.mixtral-8x7b-instruct-v0:1', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| TwelveLabs Pegasus 1.2 (US) | `completion(model='bedrock/us.twelvelabs.pegasus-1-2-v1:0', messages=messages, mediaSource={...})`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| TwelveLabs Pegasus 1.2 (EU) | `completion(model='bedrock/eu.twelvelabs.pegasus-1-2-v1:0', messages=messages, mediaSource={...})`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Moonshot Kimi K2 Thinking | `completion(model='bedrock/moonshot.kimi-k2-thinking', messages=messages)` or `completion(model='bedrock/invoke/moonshot.kimi-k2-thinking', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |
| Moonshot Kimi K3 | `completion(model='bedrock/global.moonshotai.kimi-k3', messages=messages)` or `completion(model='bedrock/us.moonshotai.kimi-k3', messages=messages)`. 裸露的 `moonshotai.kimi-k3` ID 是僅供推論設定檔使用的項目，無法依需求呼叫 | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |

## Bedrock Embedding {#bedrock-embedding}

### API 金鑰 {#api-keys}
這可以設為環境變數，或作為 **傳給 litellm.embedding() 的參數**
```python
import os
os.environ["AWS_ACCESS_KEY_ID"] = ""        # Access key
os.environ["AWS_SECRET_ACCESS_KEY"] = ""    # Secret access key
os.environ["AWS_REGION_NAME"] = ""           # us-east-1, us-east-2, us-west-1, us-west-2
```

### 用法 {#usage-1}
```python
from litellm import embedding
response = embedding(
    model="bedrock/amazon.titan-embed-text-v1",
    input=["good morning from litellm"],
)
print(response)
```

#### Titan V2 - encoding_format 支援 {#titan-v2---encoding_format-support}
```python
from litellm import embedding
# Float format (default)
response = embedding(
    model="bedrock/amazon.titan-embed-text-v2:0",
    input=["good morning from litellm"],
    encoding_format="float"  # Returns float array
)

# Binary format
response = embedding(
    model="bedrock/amazon.titan-embed-text-v2:0",
    input=["good morning from litellm"],
    encoding_format="base64"  # Returns base64 encoded binary
)
```

## 支援的 AWS Bedrock Embedding 模型 {#supported-aws-bedrock-embedding-models}

| 模型名稱           | 用法                               | 支援的其他 OpenAI 參數 |
|----------------------|---------------------------------------------|-----|
| Titan Embeddings V2 | `embedding(model="bedrock/amazon.titan-embed-text-v2:0", input=input)` | `dimensions`, `encoding_format` |
| Titan Embeddings - V1 | `embedding(model="bedrock/amazon.titan-embed-text-v1", input=input)` | [此處](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_g1_transformation.py#L53)
| Titan Multimodal Embeddings | `embedding(model="bedrock/amazon.titan-embed-image-v1", input=input)` | [此處](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_multimodal_transformation.py#L28) |
| Cohere Embeddings - English | `embedding(model="bedrock/cohere.embed-english-v3", input=input)` | [此處](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)
| Cohere Embeddings - Multilingual | `embedding(model="bedrock/cohere.embed-multilingual-v3", input=input)` | [此處](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)

### 進階 - [捨棄不支援的參數](https://docs.litellm.ai/docs/completion/drop_params#openai-proxy-usage) {#advanced---drop-unsupported-params}

### 進階 - [傳遞模型/提供者專屬參數](https://docs.litellm.ai/docs/completion/provider_specific_params#proxy-usage) {#advanced---pass-modelprovider-specific-params}

## 圖片生成 {#image-generation}

請參閱 [Bedrock 圖像生成](./bedrock_image_gen)，以在 Bedrock 上使用 Stable Diffusion 與 Amazon Nova Canvas 模型。

## Rerank API {#rerank-api}

請參閱 [Bedrock 重新排序](./bedrock_rerank)，以在 Cohere `/rerank` 格式中使用 Bedrock 的 Rerank API。

## Bedrock Application Inference Profile {#bedrock-application-inference-profile}

使用 Bedrock Application Inference Profile 追蹤 AWS 上專案的成本。 

您可以將其傳入模型名稱 - `model="bedrock/arn:...`，或作為單獨的 `model_id="arn:..` 參數。

### 透過 `model_id` 設定 {#set-via-model_id}

<Tabs>
<TabItem label="SDK" value="sdk">

```python
from litellm import completion
import os 

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    model_id="arn:aws:bedrock:eu-central-1:000000000000:application-inference-profile/a0a0a0a0a0a0",
)

print(response)
```

</TabItem>
<TabItem label="PROXY" value="proxy">

1. 設定 config.yaml 

```yaml
model_list:
  - model_name: anthropic-claude-sonnet-4-5
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      # You have to set the ARN application inference profile in the model_id parameter
      model_id: arn:aws:bedrock:eu-central-1:000000000000:application-inference-profile/a0a0a0a0a0a0
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "anthropic-claude-sonnet-4-5",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "List 5 important events in the XIX century"
        }
      ]
    }
  ]
}'
```

</TabItem>
</Tabs>

## Boto3 - 驗證 {#boto3---authentication}

### 將憑證作為參數傳遞 - Completion() {#passing-credentials-as-parameters---completion}
將 AWS 憑證作為參數傳給 litellm.completion
```python
import os
from litellm import completion

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_region_name="",
)
```

### 傳遞額外標頭 + 自訂 API 端點 {#passing-extra-headers--custom-api-endpoints}

這可用於在呼叫自訂 api 端點時覆寫現有標頭（例如 `Authorization`）

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
import litellm
from litellm import completion

litellm.set_verbose = True # 👈 SEE RAW REQUEST

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_region_name="",
            aws_bedrock_runtime_endpoint="https://my-fake-endpoint.com",
            extra_headers={"key": "value"}
)
```
</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml 

```yaml
model_list:
    - model_name: bedrock-model
      litellm_params:
        model: bedrock/us.anthropic.{{anthropic}}
        aws_access_key_id: ""
        aws_secret_access_key: ""
        aws_region_name: ""
        aws_bedrock_runtime_endpoint: "https://my-fake-endpoint.com"
        extra_headers: {"key": "value"}
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml --detailed_debug
```

3. 測試它！ 

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "bedrock-model",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful math tutor. Guide the user through the solution step by step."
      },
      {
        "role": "user",
        "content": "how can I solve 8x + 7 = -23"
      }
    ]
}'
```

</TabItem>

</Tabs>

### SSO 登入（AWS Profile） {#sso-login-aws-profile}
- 設定 `AWS_PROFILE` 環境變數
- 進行 bedrock completion 呼叫

```python
import os
from litellm import completion

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

或傳入 `aws_profile_name`：

```python
import os
from litellm import completion

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_profile_name="dev-profile",
)
```

### STS（以角色為基礎的驗證） {#sts-role-based-auth}

- 設定 `aws_role_name` 與 `aws_session_name`

| LiteLLM 參數 | Boto3 參數 | 說明 | Boto3 文件 |
|------------------|-----------------|-------------|-------------------|
| `aws_access_key_id` | `aws_access_key_id` | 與 IAM 使用者或角色相關聯的 AWS 存取金鑰 | [憑證](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) |
| `aws_secret_access_key` | `aws_secret_access_key` | 與存取金鑰相關聯的 AWS 私密金鑰 | [憑證](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) |
| `aws_role_name` | `RoleArn` | 要假設的角色之 Amazon Resource Name (ARN) | [AssumeRole API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts.html#STS.Client.assume_role) |
| `aws_session_name` | `RoleSessionName` | 已假設角色工作階段的識別碼 | [AssumeRole API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts.html#STS.Client.assume_role) |
| `aws_session_tags` | `Tags` | 選用。作為工作階段標籤傳送於 AssumeRole 呼叫中的 `{"Key": <str>, "Value": <str>}` 對清單，例如 `[{"Key": "team", "Value": "genai"}]` | [AssumeRole API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts.html#STS.Client.assume_role) |

#### 工作階段標籤 {#session-tags}

`aws_session_tags` 會將 [STS 工作階段標籤](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html) 附加到 AssumeRole 呼叫。每個標籤都會以 `aws:PrincipalTag/<Key>` 的形式落在已假設的工作階段上，因此角色的信任政策與下游資源政策可以據此鍵入。CloudTrail 中的 AssumeRole 事件會在 `requestParameters.tags` 下列出這些標籤，因此可依標籤歸屬角色工作階段

標籤會依每個部署設定，因此路由到該模型項目的每個請求都會帶有相同的標籤。標籤順序無關緊要，而在相同角色上具有相同標籤的部署會共用一個快取的 STS 工作階段。這適用於 Bedrock chat 和 invoke、embeddings、batches 以及 SageMaker 部署，也適用於 LiteLLM 自行執行 AssumeRole 的任何地方。目標角色的信任政策必須允許 `sts:TagSession` 與 `sts:AssumeRole` 並列；請參閱 [工作階段標籤的信任政策](#trust-policy-for-session-tags)

如同 `aws_role_name`、`aws_session_name` 和 `aws_external_id`，這是操作端設定。除非管理員透過 `general_settings.allow_client_side_credentials: true` 明確啟用，或在部署中於 `configurable_clientside_auth_params` 下列出它，否則 Proxy 會以 HTTP 401 拒絕客戶端請求主體中的 `aws_session_tags`。請參閱 [客戶端 LLM 認證](../proxy/clientside_auth.md)。在 Proxy 的模型管理端點（`/model/new`、`/model/update` 和 `PATCH /model/{model_id}/update`）上，只有 Proxy 管理員可以設定或變更 `aws_session_tags`。團隊管理員編輯團隊模型時，除非標籤保持不變，否則會收到 HTTP 403

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/us.anthropic.{{anthropic_large}}",
    messages=[{"role": "user", "content": "Hello!"}],
    aws_region_name="us-east-1",
    aws_role_name="arn:aws:iam::123456789012:role/litellm-bedrock",
    aws_session_name="litellm-proxy",
    aws_session_tags=[{"Key": "team", "Value": "genai"}],
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic_large}}
      aws_region_name: us-east-1
      aws_role_name: arn:aws:iam::123456789012:role/litellm-bedrock
      aws_session_name: litellm-proxy
      aws_session_tags:
        - Key: team
          Value: genai
```

</TabItem>
</Tabs>

### IAM Roles Anywhere（內部部署 / 外部工作負載） {#iam-roles-anywhere-on-premise--external-workloads}

[IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) 將 IAM 角色擴展到 **AWS 外部** 的工作負載（內部部署伺服器、邊緣裝置、其他雲端）。它使用與一般 IAM 角色相同的 STS 機制，但改以 X.509 憑證而非 AWS 認證進行驗證。

**設定**：將 [AWS Signing Helper](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/credential-helper.html) 設定為 `~/.aws/config` 中的 credential process：

```ini
[profile litellm-roles-anywhere]
credential_process = aws_signing_helper credential-process \
    --certificate /path/to/certificate.pem \
    --private-key /path/to/private-key.pem \
    --trust-anchor-arn arn:aws:rolesanywhere:us-east-1:123456789012:trust-anchor/abc123 \
    --profile-arn arn:aws:rolesanywhere:us-east-1:123456789012:profile/def456 \
    --role-arn arn:aws:iam::123456789012:role/MyBedrockRole
```

**用法**：在 LiteLLM 中參考該設定檔：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[{"role": "user", "content": "Hello!"}],
    aws_profile_name="litellm-roles-anywhere",
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_profile_name: "litellm-roles-anywhere"
```

</TabItem>
</Tabs>

請參閱 [IAM Roles Anywhere 入門指南](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/getting-started.html) 以了解 trust anchor 和 profile 設定。

進行 bedrock completion 呼叫

---

### AssumeRole 所需的 AWS IAM 政策 {#required-aws-iam-policy-for-assumerole}

若要在 LiteLLM 中使用 `aws_role_name`（STS AssumeRole），您的 IAM 使用者或角色**必須**具有在目標角色上呼叫 `sts:AssumeRole` 的權限。如果您看到如下錯誤：

```
An error occurred (AccessDenied) when calling the AssumeRole operation: User: arn:aws:sts::...:assumed-role/litellm-ecs-task-role/... is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::...:role/Enterprise/BedrockCrossAccountConsumer
```

這表示執行 LiteLLM 的 IAM 身分**沒有**權限假設目標角色。您必須更新 IAM 政策以允許此動作。

#### 範例 IAM 政策 {#example-iam-policy}

請將 `<TARGET_ROLE_ARN>` 替換為您要假設之角色的 ARN（例如，`arn:aws:iam::123456789012:role/Enterprise/BedrockCrossAccountConsumer`）。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "<TARGET_ROLE_ARN>"
    }
  ]
}
```

**注意：** 目標角色本身也必須信任呼叫的 IAM 身分（透過其信任政策），AssumeRole 才能成功。更多詳細資訊請參閱 [AWS AssumeRole 文件](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-api.html)。

#### 工作階段標籤的信任政策 {#trust-policy-for-session-tags}

當部署設定 `aws_session_tags` 時，目標角色的信任政策也必須允許 `sts:TagSession`。否則，AssumeRole 會因 `AccessDenied ... is not authorized to perform: sts:TagSession` 而失敗。請將 `<LITELLM_IDENTITY_ARN>` 替換為執行 LiteLLM 的 IAM 身分。`Condition` 為選用項目，可讓該角色只接受帶有預期標籤的工作階段：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "<LITELLM_IDENTITY_ARN>"},
      "Action": ["sts:AssumeRole", "sts:TagSession"],
      "Condition": {"StringEquals": {"aws:RequestTag/team": "genai"}}
    }
  ]
}
```

---

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=messages,
            max_tokens=10,
            temperature=0.1,
            aws_role_name=aws_role_name,
            aws_session_name="my-test-session",
        )
```

如果您也需要動態設定存取該角色的 AWS 使用者，請在 completion()/embedding() 函式中加入額外參數

```python
from litellm import completion

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=messages,
            max_tokens=10,
            temperature=0.1,
            aws_region_name=aws_region_name,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            aws_role_name=aws_role_name,
            aws_session_name="my-test-session",
        )
```
</TabItem>

<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: bedrock/*
    litellm_params:
      model: bedrock/*
      aws_role_name: arn:aws:iam::888602223428:role/iam_local_role # AWS RoleArn
      aws_session_name: "bedrock-session" # AWS RoleSessionName
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID # [OPTIONAL - not required if using role]
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY # [OPTIONAL - not required if using role]
```


</TabItem>

</Tabs>

### 將外部 BedrockRuntime.Client 作為參數傳遞 - Completion() {#passing-an-external-bedrockruntimeclient-as-a-parameter---completion}
  
這是一個已棄用的流程。Boto3 不是非同步的，而且 boto3.client 不允許我們透過 httpx 發出 http 呼叫。請透過上方的方式傳入您的 aws 參數 👆。[查看驗證程式碼](https://github.com/BerriAI/litellm/blob/55a20c7cce99a93d36a82bf3ae90ba3baf9a7f89/litellm/llms/bedrock_httpx.py#L284) [新增新的驗證流程](https://github.com/BerriAI/litellm/issues)

:::warning

實驗性 - 2024-Jun-23:
    `aws_access_key_id`、`aws_secret_access_key` 和 `aws_session_token` 將會從 boto3.client 中擷取，並傳遞給 httpx 用戶端 

:::

將外部 BedrockRuntime.Client 物件作為參數傳遞給 litellm.completion。在使用 AWS 認證設定檔、SSO 工作階段、assumed role 工作階段，或環境變數無法用於驗證時，這很有用。

從工作階段認證建立用戶端：
```python
import boto3
from litellm import completion

bedrock = boto3.client(
            service_name="bedrock-runtime",
            region_name="us-east-1",
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_session_token="",
)

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_bedrock_client=bedrock,
)
```

從 `~/.aws/config` 中的 AWS 設定檔建立用戶端：
```python
import boto3
from litellm import completion

dev_session = boto3.Session(profile_name="dev-profile")
bedrock = dev_session.client(
            service_name="bedrock-runtime",
            region_name="us-east-1",
)

response = completion(
            model="bedrock/us.anthropic.{{anthropic}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_bedrock_client=bedrock,
)
```
## 透過內部 Proxy 呼叫（與 bedrock url 不相容） {#calling-via-internal-proxy-not-bedrock-url-compatible}

使用 `bedrock/converse_like/model` 端點透過您的內部 Proxy 呼叫 bedrock converse 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/converse_like/some-model",
    messages=[{"role": "user", "content": "What's AWS?"}],
    api_key="sk-<your-litellm-api-key>",
    api_base="https://some-api-url/models",
    extra_headers={"test": "hello world"},
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: anthropic-claude
      litellm_params:
        model: bedrock/converse_like/some-model
        api_base: https://some-api-url/models
```

2. 啟動 proxy server

```bash
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "anthropic-claude",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful math tutor. Guide the user through the solution step by step."
      },
      { "content": "Hello, how are you?", "role": "user" }
    ]
}'
```

</TabItem>
</Tabs>

**預期輸出 URL**

```bash
https://some-api-url/models
```
