import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS Bedrock {#aws-bedrock}
所有 Bedrock 模型（Anthropic、Meta、Deepseek、Mistral、Amazon 等）皆支援

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Amazon Bedrock 是一項全代管服務，提供多種高效能基礎模型（FM）。 |
| LiteLLM 上的提供者路由 | `bedrock/`, [`bedrock/converse/`](#set-converse--invoke-route), [`bedrock/invoke/`](#set-invoke-route), [`bedrock/converse_like/`](#calling-via-internal-proxy), [`bedrock/llama/`](#deepseek-not-r1), [`bedrock/deepseek_r1/`](#deepseek-r1), [`bedrock/qwen3/`](#qwen3-imported-models), [`bedrock/qwen2/`](./bedrock_imported.md#qwen2-imported-models), [`bedrock/openai/`](./bedrock_imported.md#openai-compatible-imported-models-qwen-25-vl-etc), [`bedrock/moonshot`](./bedrock_imported.md#moonshot-kimi-k2-thinking) |
| 提供者文件 | [Amazon Bedrock ↗](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) |
| 支援的 OpenAI 端點 | `/chat/completions`, `/completions`, `/embeddings`, `/images/generations`, `/v1/realtime`|
| Rerank 端點 | `/rerank` |
| 轉發端點 | [支援](../pass_through/bedrock.md) |

LiteLLM 需要在您的系統上安裝 `boto3`，才能處理 Bedrock 請求
```shell
uv add boto3>=1.28.57
```

:::info

針對 **Amazon Nova Models**：請升級至 v1.53.5+

:::

## 驗證 {#authentication}

:::info

LiteLLM 使用 boto3 來處理驗證。所有這些選項皆受支援 - https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html#credentials.

:::
 
LiteLLM 除了傳統的 boto3 驗證方法外，也支援 API 金鑰驗證。如需進一步了解 API 金鑰，請參閱 [文件](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html)。

選項 1：使用 AWS_BEARER_TOKEN_BEDROCK 環境變數 

```bash
export AWS_BEARER_TOKEN_BEDROCK="your-api-key"
```

選項 2：使用 api_key 參數傳入 API 金鑰，以供 completion、embedding、image_generation API 呼叫使用。

<Tabs>
<TabItem value="sdk" label="SDK">
```python
response = completion(
  model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  api_key="your-api-key"
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">
```yaml
model_list:
  - model_name: bedrock-claude-3-sonnet
    litellm_params:
      model: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
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
  model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

## LiteLLM Proxy 用法 {#litellm-proxy-usage}

以下說明如何透過 LiteLLM Proxy Server 呼叫 Bedrock

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: bedrock-claude-3-5-sonnet
    litellm_params:
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
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
### 3. 測試 {#3-test-it}

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
  model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  temperature=0.7,
  top_p=1
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/anthropic.claude-instant-v1
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

## 傳入特定提供者參數 {#pass-provider-specific-params}

如果您傳遞給 litellm 的參數不是 openai 參數，我們會假設它是提供者專屬參數，並將其作為 kwarg 放入請求主體中。[查看更多](../completion/input.md#provider-specific-params)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  top_k=1 # 👈 PROVIDER-SPECIFIC PARAM
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/anthropic.claude-instant-v1
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
    top_k=1 # 👈 PROVIDER-SPECIFIC PARAM
}
)

print(response)

```

</TabItem>
</Tabs>

## 用法 - 請求中繼資料 {#usage---request-metadata}

將中繼資料附加到 Bedrock 請求，以便進行記錄與成本歸因。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
    model="bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    requestMetadata={
        "cost_center": "engineering",
        "user_id": "user123"
    }
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
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
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
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
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0 # for bedrock invoke, specify `bedrock/invoke/<model>`
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
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
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
- `reasoning_content` - 字串 - 回應的推理內容
- `thinking_blocks` - 物件列表（僅 Anthropic）- 回應的思考區塊

每個物件都有以下欄位：
- `type` - Literal["thinking"] - 思考區塊的類型
- `thinking` - 字串 - 回應的思考內容。也會在 `reasoning_content` 中回傳
- `signature` - 字串 - 由 Anthropic 回傳的 base64 編碼字串。

如果傳入 'thinking' 內容，Anthropic 在後續請求中需要 `signature`（僅在搭配工具呼叫使用 `thinking` 時需要）。[深入了解](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#understanding-thinking-blocks)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


resp = completion(
    model="bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0",
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
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0
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
    "model": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
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

### 將 `thinking` 傳給 Anthropic 模型 {#pass-thinking-to-anthropic-models}

與 [Anthropic API 回應](../providers/anthropic#usage---thinking--reasoning_content) 相同。

## 用法 - Bedrock 搜尋引文於 `/chat/completions` {#usage---bedrock-search-citations-in-chatcompletions}

如果您的工具會回傳搜尋來源，且您希望在最終的 assistant 回應中包含引用中繼資料，請在 `role: "tool"` 訊息上傳遞 `search_results`。

### 請求形狀 {#request-shape}

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

### 您會收到什麼回應 {#what-you-get-back}

LiteLLM 會在 `message.content` 中回傳一般 assistant 文字，並在 `message.annotations` 中回傳引用中繼資料：

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
如果您只傳送純 `tool.content` 文字（沒有 `search_results`），仍然會得到正常回應，但不會有結構化的引用註解。
:::

## 用法 - Anthropic Beta 功能 {#usage---anthropic-beta-features}

LiteLLM 透過 `anthropic-beta` 標頭支援 AWS Bedrock 上 Anthropic 的 beta 功能。這可讓您使用下列實驗性功能：

- **1M Context Window** - 最多 100 萬個 token 的內容視窗（Claude Opus 4.6、Sonnet 4.5、Sonnet 4）
- **Computer Use Tools** - 可與電腦介面互動的 AI
- **Token-Efficient Tools** - 更有效率的工具使用模式  
- **Extended Output** - 最多 128K 輸出 token
- **Enhanced Thinking** - 進階推理能力

### 支援的 Beta 功能 {#supported-beta-features}

| Beta 功能 | 標頭值 | 相容模型 | 說明 |
|--------------|-------------|------------------|-------------|
| 1M Context Window | `context-1m-2025-08-07` | Claude Opus 4.6, Sonnet 4.5, Sonnet 4 | 啟用 100 萬 token 內容視窗 |
| Computer Use (Latest) | `computer-use-2025-01-24` | Claude 3.7 Sonnet | 最新的 computer use 工具 |
| Computer Use (Legacy) | `computer-use-2024-10-22` | Claude 3.5 Sonnet v2 | 適用於 Claude 3.5 的 computer use 工具 |
| Token-Efficient Tools | `token-efficient-tools-2025-02-19` | Claude 3.7 Sonnet | 更有效率的工具使用 |
| Interleaved Thinking | `interleaved-thinking-2025-05-14` | Claude 4 models | 增強的思考能力 |
| Extended Output | `output-128k-2025-02-19` | Claude 3.7 Sonnet | 最多 128K 輸出 token |
| Developer Thinking | `dev-full-thinking-2025-05-14` | Claude 4 models | 供開發者使用的原始思考模式 |

<Tabs>
<TabItem value="sdk" label="SDK">

**單一 Beta 功能**

```python
from litellm import completion
import os

# set env
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

# Use 1M context window with Claude Sonnet 4
response = completion(
    model="bedrock/anthropic.claude-sonnet-4-20250115-v1:0",
    messages=[{"role": "user", "content": "Hello! Testing 1M context window."}],
    max_tokens=100,
    extra_headers={
        "anthropic-beta": "context-1m-2025-08-07"  # 👈 Enable 1M context
    }
)
```

**多個 Beta 功能**

```python
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

**搭配 Beta 功能的 Computer Use Tools**

```python
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

```yaml
model_list:
  - model_name: claude-sonnet-4-1m
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-4-20250115-v1:0
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
**適用於用戶端標頭轉送**：使用 proxy 並從用戶端（例如 OpenAI SDK）傳送 `anthropic-beta` 標頭時，您需要在 proxy 的 `general_settings` 中啟用 `forward_client_headers_to_llm_api: true`。這會告訴 proxy 從 HTTP 請求中擷取標頭，並將其轉送至底層的 LLM 提供者。
:::

</TabItem>
</Tabs>

:::info

Beta 功能可能需要您 AWS 帳戶中的特殊存取權或權限。某些功能僅在特定的 AWS 區域可用。請查看 [AWS Bedrock 文件](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html) 以了解可用性與存取需求。

:::

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
  model="bedrock/anthropic.claude-3-7-sonnet-20250219-v1:0", # specify invoke via `bedrock/invoke/anthropic.claude-3-7-sonnet-20250219-v1:0`
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
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0 # specify invoke via `bedrock/invoke/<model_name>` 
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

## 用法 - 低延遲推理 {#usage---latency-optimized-inference}

自 v1.65.1+ 起有效

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/anthropic.claude-3-7-sonnet-20250219-v1:0",
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
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0
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

LiteLLM 也支援 OpenAI 風格的 `service_tier` 參數，會自動轉換為 Bedrock 原生的 `serviceTier` 格式：

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
    model="bedrock/converse/anthropic.claude-3-sonnet-20240229-v1:0",
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

使用 [LiteLLM 的 Bedrock Guardrails 範例](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-converse-api.html)

### 透過 `guarded_text` 進行選擇性內容審核 {#selective-content-moderation-with-guarded_text}

LiteLLM 支援使用 `guarded_text` 內容類型進行選擇性內容審核。這讓您可以只包裝應由 Bedrock Guardrails 審核的特定內容，而不是評估整段對話。

**運作方式：**
- 含有 `type: "guarded_text"` 的內容會自動包裝在 `guardrailConverseContent` 區塊中
- 只有被包裝的內容會由 Bedrock Guardrails 評估
- 含有 `type: "text"` 的一般內容會略過防護欄評估

:::note
如果未使用 `guarded_text`，整個對話歷史都會傳送到 guardrail 進行評估，這可能會增加延遲與成本。
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
    model="anthropic.claude-v2",
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
    model="anthropic.claude-v2",
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
<TabItem value="proxy" label="請求時的 Proxy">

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="anthropic.claude-v2", messages = [
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
<TabItem value="proxy-config" label="config.yaml 上的 Proxy">

1. 更新 config.yaml 

```yaml
model_list:
  - model_name: bedrock-claude-v1
    litellm_params:
      model: bedrock/anthropic.claude-instant-v1
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

## 用法 - "Assistant Pre-fill" {#usage---assistant-pre-fill}

如果您在 Bedrock 中使用 Anthropic 的 Claude，您可以透過在 `messages` 陣列中將 `assistant` 角色訊息作為最後一項來「替 Claude 代言」。

> [!IMPORTANT]
> 傳回的 completion 將 _**不會**_ 包含您的「pre-fill」文字，因為它本身就是 prompt 的一部分。請務必在 Claude 的 completion 前加上您的 pre-fill。

```python
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

### 傳送給 Claude 的提示詞範例 {#example-prompt-sent-to-claude}

```

Human: How do you say 'Hello' in German? Return your answer as a JSON object, like this:

{ "Hello": "Hallo" }

Assistant: {
```

## 用法 - "System" 訊息 {#usage---system-messages}
如果您在 Bedrock 中使用 Anthropic 的 Claude 2.1，`system` 角色訊息會為您正確格式化。

```python
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

### 傳送給 Claude 的提示詞範例 {#example-prompt-sent-to-claude-1}

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
  model="bedrock/anthropic.claude-instant-v1",
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
  "model": "anthropic.claude-instant-v1",
  "usage": {
    "prompt_tokens": null,
    "completion_tokens": null,
    "total_tokens": null
  }
}
```

## 跨區域推理 {#cross-region-inferencing}

LiteLLM 支援跨所有 [支援的 bedrock 模型](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference-support.html) 的 Bedrock [跨區域 inferencing](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)。

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
    model="bedrock/us.anthropic.claude-3-haiku-20240307-v1:0",
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
  - model_name: bedrock-claude-haiku
    litellm_params:
      model: bedrock/us.anthropic.claude-3-haiku-20240307-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```


#### 2. 啟動 proxy {#2-start-the-proxy-1}

```bash
litellm --config /path/to/config.yaml
```

#### 3. 測試它 {#3-test-it-1}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "bedrock-claude-haiku",
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
response = client.chat.completions.create(model="bedrock-claude-haiku", messages = [
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
    model = "bedrock-claude-haiku",
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

LiteLLM 預設使用 `invoke` 路由。LiteLLM 會對支援的 Bedrock 模型使用 `converse` 路由。

若要明確設定路由，請執行 `bedrock/converse/<model>` 或 `bedrock/invoke/<model>`。

例如：

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

## 交替的 user/assistant 訊息 {#alternate-userassistant-messages}

對於 client 可能不會遵循以 user 訊息開始並以 user 訊息結束的交替 user/assistant 訊息的情況（例如 Autogen），請使用 `user_continue_message` 來新增預設 user 訊息。 

```yaml
model_list:
  - model_name: "bedrock-claude"
    litellm_params:
      model: "bedrock/anthropic.claude-instant-v1"
      user_continue_message: {"role": "user", "content": "Please continue"}
```

或

只要設定 `litellm.modify_params=True`，LiteLLM 就會使用預設的 user_continue_message 自動處理。

```yaml
model_list:
  - model_name: "bedrock-claude"
    litellm_params:
      model: "bedrock/anthropic.claude-instant-v1"

litellm_settings:
   modify_params: true
```

測試看看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
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

您也可以將這些作為 `image_url` 或 `base64` 傳入

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
model = "bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0"

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
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
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
model = "bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0"

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
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
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

| 屬性 | 詳細資料 |
|----------|---------|
| 提供者路由 | `bedrock/converse/openai.gpt-oss-20b-1:0`、`bedrock/converse/openai.gpt-oss-120b-1:0` |
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

**1. 新增到 config**

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

**3. 測試看看！**

```bash title="Test GPT OSS via Proxy" showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Authorization: Bearer sk-1234' \
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

## TwelveLabs Pegasus - 影片理解 {#twelvelabs-pegasus---video-understanding}

TwelveLabs Pegasus 1.2 是一個影片理解模型，可以分析並描述影片內容。LiteLLM 透過 Bedrock 的 `/invoke` 端點支援此模型。

| 屬性 | 詳細資料 |
|----------|---------|
| 提供者路由 | `bedrock/us.twelvelabs.pegasus-1-2-v1:0`、`bedrock/eu.twelvelabs.pegasus-1-2-v1:0` |
| 提供者文件 | [TwelveLabs Pegasus 文件 ↗](https://docs.twelvelabs.io/docs/models/pegasus) |
| 支援的參數 | `max_tokens`、`temperature`、`response_format` |
| 媒體輸入 | S3 URI 或 base64 編碼的影片 |

### 支援的功能 {#supported-features}

- **影片分析**：從 S3 或 base64 輸入分析影片內容
- **結構化輸出**：支援 JSON schema 回應格式
- **S3 整合**：支援具有 bucket owner 指定的 S3 影片 URL

### 搭配 S3 影片的用法 {#usage-with-s3-video}

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

**1. 新增到 config**

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

**3. 測試看看！**

```bash title="Test Pegasus via Proxy" showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Authorization: Bearer sk-1234' \
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

### 搭配 Base64 影片的用法 {#usage-with-base64-video}

您也可以直接將影片內容以 base64 傳入：

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

- **回應格式**：模型透過 `response_format` 支援具結構化輸出，並使用 JSON schema

## 已佈建輸送量模型 {#provisioned-throughput-models}
若要使用 provisioned throughput Bedrock models，請傳入
- `model=bedrock/<base-model>`，範例 `model=bedrock/anthropic.claude-v2`。將 `model` 設為 [支援的 AWS models](#supported-aws-bedrock-models) 中的任一項
- `model_id=provisioned-model-arn`

Completion
```python
import litellm
response = litellm.completion(
    model="bedrock/anthropic.claude-instant-v1",
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

LiteLLM 支援所有 Bedrock models。

以下是使用 LiteLLM 搭配 bedrock model 的範例。完整清單請參閱 [model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)

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
| Moonshot Kimi K2 Thinking | `completion(model='bedrock/moonshot.kimi-k2-thinking', messages=messages)` 或 `completion(model='bedrock/invoke/moonshot.kimi-k2-thinking', messages=messages)` | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']` |

## Bedrock Embedding {#bedrock-embedding}

### API 金鑰 {#api-keys}
這可以設定為環境變數，或作為 **傳遞給 litellm.embedding() 的參數**
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

| 模型名稱           | 用途                               | 支援的額外 OpenAI 參數 |
|----------------------|---------------------------------------------|-----|
| Titan Embeddings V2 | `embedding(model="bedrock/amazon.titan-embed-text-v2:0", input=input)` | `dimensions`, `encoding_format` |
| Titan Embeddings - V1 | `embedding(model="bedrock/amazon.titan-embed-text-v1", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_g1_transformation.py#L53)
| Titan Multimodal Embeddings | `embedding(model="bedrock/amazon.titan-embed-image-v1", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_multimodal_transformation.py#L28) |
| Cohere Embeddings - English | `embedding(model="bedrock/cohere.embed-english-v3", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)
| Cohere Embeddings - Multilingual | `embedding(model="bedrock/cohere.embed-multilingual-v3", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)

### 進階 - [捨棄不支援的參數](https://docs.litellm.ai/docs/completion/drop_params#openai-proxy-usage) {#advanced---drop-unsupported-paramshttpsdocslitellmaidocscompletiondrop_paramsopenai-proxy-usage}

### 進階 - [傳遞模型／提供者特定參數](https://docs.litellm.ai/docs/completion/provider_specific_params#proxy-usage) {#advanced---pass-modelprovider-specific-paramshttpsdocslitellmaidocscompletionprovider_specific_paramsproxy-usage}

## 影像生成 {#image-generation}

請參閱 [Bedrock Image Generation](./bedrock_image_gen)，以在 Bedrock 上使用 Stable Diffusion 和 Amazon Nova Canvas 模型。

## Rerank API {#rerank-api}

請參閱 [Bedrock Rerank](./bedrock_rerank)，以在 Cohere `/rerank` 格式中使用 Bedrock 的 Rerank API。

## Bedrock 應用程式推論設定檔 {#bedrock-application-inference-profile}

使用 Bedrock Application Inference Profile 來追蹤 AWS 上專案的成本。

您可以將其作為模型名稱的一部分傳入 - `model="bedrock/arn:...`，或作為單獨的 `model_id="arn:..` 參數。

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
    model="bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0",
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
  - model_name: anthropic-claude-3-5-sonnet
    litellm_params:
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
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
-H 'Authorization: Bearer $LITELLM_API_KEY' \
-d '{
  "model": "anthropic-claude-3-5-sonnet",
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
將 AWS 憑證作為參數傳遞給 litellm.completion
```python
import os
from litellm import completion

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_region_name="",
)
```

### 傳遞額外標頭 + 自訂 Bedrock API 端點 {#passing-extra-headers--custom-api-endpoints}

這可用來在呼叫自訂 API 端點時覆寫既有標頭（例如 `Authorization`）

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
import litellm
from litellm import completion

litellm.set_verbose = True # 👈 SEE RAW REQUEST

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
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
        model: bedrock/anthropic.claude-instant-v1
        aws_access_key_id: "",
        aws_secret_access_key: "",
        aws_region_name: "",
        aws_bedrock_runtime_endpoint: "https://my-fake-endpoint.com",
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
-H 'Authorization: Bearer sk-1234' \
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
- 發出 bedrock completion 請求

```python
import os
from litellm import completion

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
            messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

或傳入 `aws_profile_name`：

```python
import os
from litellm import completion

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_profile_name="dev-profile",
)
```

### STS（基於角色的驗證） {#sts-role-based-auth}

- 設定 `aws_role_name` 和 `aws_session_name`

| LiteLLM 參數 | Boto3 參數 | 說明 | Boto3 文件 |
|------------------|-----------------|-------------|-------------------|
| `aws_access_key_id` | `aws_access_key_id` | 與 IAM 使用者或角色相關聯的 AWS 存取金鑰 | [Credentials](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) |
| `aws_secret_access_key` | `aws_secret_access_key` | 與該存取金鑰相關聯的 AWS 密鑰 | [Credentials](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) |
| `aws_role_name` | `RoleArn` | 要假設的角色之 Amazon Resource Name（ARN） | [AssumeRole API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts.html#STS.Client.assume_role) |
| `aws_session_name` | `RoleSessionName` | 受假設角色工作階段的識別碼 | [AssumeRole API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts.html#STS.Client.assume_role) |

### IAM Roles Anywhere（內部部署／外部工作負載） {#iam-roles-anywhere-on-premise--external-workloads}

[IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) 將 IAM 角色延伸至 **AWS 之外** 的工作負載（內部部署伺服器、邊緣裝置、其他雲端）。它使用與一般 IAM 角色相同的 STS 機制，但改以 X.509 憑證進行驗證，而非 AWS 憑證。

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

**用法**：在 LiteLLM 中參照該設定檔：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
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
      model: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
      aws_profile_name: "litellm-roles-anywhere"
```

</TabItem>
</Tabs>

請參閱 [IAM Roles Anywhere Getting Started Guide](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/getting-started.html) 了解 trust anchor 與設定檔設定。

發出 bedrock completion 請求

---

### AssumeRole 所需的 AWS IAM Policy {#required-aws-iam-policy-for-assumerole}

若要在 LiteLLM 中使用 `aws_role_name`（STS AssumeRole），您的 IAM 使用者或角色**必須**具備在目標角色上呼叫 `sts:AssumeRole` 的權限。如果您看到類似以下的錯誤：

```
An error occurred (AccessDenied) when calling the AssumeRole operation: User: arn:aws:sts::...:assumed-role/litellm-ecs-task-role/... is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::...:role/Enterprise/BedrockCrossAccountConsumer
```

這表示執行 LiteLLM 的 IAM 身分**沒有**假設目標角色的權限。您必須更新 IAM policy 以允許此動作。

#### 範例 IAM Policy {#example-iam-policy}

將 `<TARGET_ROLE_ARN>` 替換為您要假設的角色 ARN（例如，`arn:aws:iam::123456789012:role/Enterprise/BedrockCrossAccountConsumer`）。

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

**注意：** 目標角色本身也必須透過其信任 policy 信任呼叫的 IAM 身分，AssumeRole 才能成功。更多細節請參閱 [AWS AssumeRole 文件](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-api.html)。

---

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
            messages=messages,
            max_tokens=10,
            temperature=0.1,
            aws_role_name=aws_role_name,
            aws_session_name="my-test-session",
        )
```

如果您也需要動態設定存取該角色的 aws 使用者，請在 completion()/embedding() 函式中加入額外的 args

```python
from litellm import completion

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
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
  
這是已淘汰的流程。Boto3 不是非同步的，而且 boto3.client 不允許我們透過 httpx 發出 HTTP 呼叫。請透過上方的方法傳入您的 aws 參數 👆。[查看 Auth Code](https://github.com/BerriAI/litellm/blob/55a20c7cce99a93d36a82bf3ae90ba3baf9a7f89/litellm/llms/bedrock_httpx.py#L284) [新增新的 auth flow](https://github.com/BerriAI/litellm/issues)

:::warning

Experimental - 2024-Jun-23:
    `aws_access_key_id`、`aws_secret_access_key` 和 `aws_session_token` 將會從 boto3.client 中擷取，並傳遞給 httpx client 

:::

將外部 BedrockRuntime.Client 物件作為參數傳遞給 litellm.completion。當使用 AWS credentials profile、SSO session、assumed role session，或環境變數無法用於驗證時，這會很有用。

從 session credentials 建立 client：
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
            model="bedrock/anthropic.claude-instant-v1",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_bedrock_client=bedrock,
)
```

從 `~/.aws/config` 中的 AWS profile 建立 client：
```python
import boto3
from litellm import completion

dev_session = boto3.Session(profile_name="dev-profile")
bedrock = dev_session.client(
            service_name="bedrock-runtime",
            region_name="us-east-1",
)

response = completion(
            model="bedrock/anthropic.claude-instant-v1",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_bedrock_client=bedrock,
)
```
## 透過內部 Proxy 呼叫（與 bedrock URL 不相容） {#calling-via-internal-proxy-not-bedrock-url-compatible}

使用 `bedrock/converse_like/model` endpoint 透過您的內部 proxy 呼叫 bedrock converse model。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/converse_like/some-model",
    messages=[{"role": "user", "content": "What's AWS?"}],
    api_key="sk-1234",
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
-H 'Authorization: Bearer sk-1234' \
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
