import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Anthropic {#anthropic}
LiteLLM 支援所有 anthropic 模型。

- `claude-opus-4-6` (`claude-opus-4-6-20260205`)
- `claude-sonnet-4-6`
- `claude-sonnet-4-5-20250929`
- `claude-opus-4-5-20251101`
- `claude-opus-4-1-20250805`
- `claude-4` (`claude-opus-4-20250514`, `claude-sonnet-4-20250514`)
- `claude-3.7` (`claude-3-7-sonnet-20250219`)
- `claude-3.5` (`claude-3-5-sonnet-20240620`)
- `claude-3` (`claude-3-haiku-20240307`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`)
- `claude-2`
- `claude-2.1`
- `claude-instant-1.2`

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Claude 是由 Anthropic 建立的高效能、值得信賴且智慧的 AI 平台。Claude 在涉及語言、推理、分析、程式撰寫等任務上表現出色。亦可透過 Azure Foundry 使用。 |
| LiteLLM 提供者路由 | `anthropic/`（將此前綴加到模型名稱前，即可將任何請求路由到 Anthropic - 例如 `anthropic/claude-3-5-sonnet-20240620`）。對於 Azure Foundry 部署，請使用 `azure/claude-*`（請參閱 [Azure Anthropic 文件](../providers/azure/azure_anthropic)） |
| 提供者文件 | [Anthropic ↗](https://docs.anthropic.com/en/docs/build-with-claude/overview), [Azure Foundry Claude ↗](https://learn.microsoft.com/en-us/azure/ai-services/foundry-models/claude) |
| 提供者 API 端點 | https://api.anthropic.com（或 Azure Foundry endpoint：`https://<resource-name>.services.ai.azure.com/anthropic`） |
| 支援的端點 | `/chat/completions`, `/v1/messages`（passthrough） |

## 支援的 OpenAI 參數 {#supported-openai-parameters}

請在程式碼中於 [此處](../completion/input.md#translated-openai-params) 查看

```
"stream",
"stop",
"temperature",
"top_p",
"max_tokens",
"max_completion_tokens",
"tools",
"tool_choice",
"extra_headers",
"parallel_tool_calls",
"response_format",
"user",
"reasoning_effort",
```

:::info

**注意：**
- 當未傳入 `max_tokens` 時，Anthropic API 會使請求失敗。因此，當未傳入 `max_tokens` 時，litellm 會傳入 `max_tokens=4096`。
- `response_format` 已完整支援 Claude Sonnet 4.5 與 Opus 4.1 模型（請參閱 [結構化輸出](#structured-outputs) 章節）
- `reasoning_effort` 會自動對應為 Claude 4.6 與 Opus 4.5 模型的 `output_config={"effort": ...}`（請參閱 [Effort 參數](./anthropic_effort.md)）

:::

## **結構化輸出** {#structured-outputs}

LiteLLM 支援 Anthropic 的 [結構化輸出功能](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)，適用於 Claude Sonnet 4.5 與 Opus 4.1 模型。當您對這些模型使用 `response_format` 時，LiteLLM 會自動：
- 加入必要的 `structured-outputs-2025-11-13` beta 標頭
- 將 OpenAI 的 `response_format` 轉換為 Anthropic 的 `output_format` 格式

### 支援的模型 {#supported-models}
- `sonnet-4-5` 或 `sonnet-4.5`（所有 Sonnet 4.5 變體）
- `opus-4-1` 或 `opus-4.1`（所有 Opus 4.1 變體）
  - `opus-4-5` 或 `opus-4.5`（所有 Opus 4.5 變體）
  
### 使用範例 {#example-usage}

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "capital_response",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "country": {"type": "string"},
                    "capital": {"type": "string"}
                },
                "required": ["country", "capital"],
                "additionalProperties": False
            }
        }
    }
)

print(response.choices[0].message.content)
# Output: {"country": "France", "capital": "Paris"}
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-sonnet-4-5
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20250929
      api_key: os.environ/ANTHROPIC_API_KEY
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
    "model": "claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "response_format": {
        "type": "json_schema",
        "json_schema": {
            "name": "capital_response",
            "strict": true,
            "schema": {
                "type": "object",
                "properties": {
                    "country": {"type": "string"},
                    "capital": {"type": "string"}
                },
                "required": ["country", "capital"],
                "additionalProperties": false
            }
        }
    }
  }'
```

</TabItem>
</Tabs>

:::info
使用支援的模型進行結構化輸出時，LiteLLM 會自動：
- 將 OpenAI 的 `response_format` 轉換為 Anthropic 的 `output_schema`
- 新增 `anthropic-beta: structured-outputs-2025-11-13` 標頭
- 使用該結構建立工具並強制模型使用它
:::

## API 金鑰 {#api-keys}

```python
import os

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"
# os.environ["ANTHROPIC_API_BASE"] = "" # [OPTIONAL] or 'ANTHROPIC_BASE_URL'
# os.environ["LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX"] = "true" # [OPTIONAL] Disable automatic URL suffix appending
```

:::tip Azure Foundry 支援

Claude 模型也可透過 Microsoft Azure Foundry 使用。請使用 `azure/` 前綴，而不是 `anthropic/`，並設定 Azure 驗證。詳情請參閱 [Azure Anthropic 文件](../providers/azure/azure_anthropic)。

範例：
```python
response = completion(
    model="azure/claude-sonnet-4-5",
    api_base="https://<resource-name>.services.ai.azure.com/anthropic",
    api_key="your-azure-api-key",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

:::

### 自訂 API Base {#custom-api-base}

當使用 Anthropic 的自訂 API base（例如 proxy 或自訂端點）時，LiteLLM 會自動將適當的後綴（`/v1/messages` 或 `/v1/complete`）附加到您的 base URL。

如果您的自訂端點已包含完整路徑，或不遵循 Anthropic 的標準 URL 結構，您可以停用此自動附加後綴功能：

```python
import os

os.environ["ANTHROPIC_API_BASE"] = "https://my-custom-endpoint.com/custom/path"
os.environ["LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX"] = "true"  # Prevents automatic suffix
```

不使用 `LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX`：
- Base URL `https://my-proxy.com` → `https://my-proxy.com/v1/messages`
- Base URL `https://my-proxy.com/api` → `https://my-proxy.com/api/v1/messages`

使用 `LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX=true`：
- Base URL `https://my-proxy.com/custom/path` → `https://my-proxy.com/custom/path`（不變）

### Azure AI Foundry（替代方法） {#azure-ai-foundry-alternative-method}

:::tip 建議方法
若要完整支援 Azure（包含 Azure AD 驗證），請使用專用的 [Azure Anthropic 提供者](./azure/azure_anthropic) 並搭配 `azure_ai/` 前綴。
:::

或者，您也可以直接使用 `anthropic/` 提供者搭配您的 Azure 端點，因為 Azure 是以 Anthropic 的原生 API 來公開 Claude。

```python
from litellm import completion

response = completion(
    model="anthropic/claude-sonnet-4-5",
    api_base="https://<your-resource>.services.ai.azure.com/anthropic",
    api_key="<your-azure-api-key>",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response)
```

:::info
**尋找您的 Azure 端點：**前往 Azure AI Foundry → 您的部署 → Overview。您的 base URL 會是 `https://<resource-name>.services.ai.azure.com/anthropic`
:::

## 使用方式 {#usage}

```python
import os
from litellm import completion

# set env - [OPTIONAL] replace with your anthropic key
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="claude-opus-4-20250514", messages=messages)
print(response)
```


## 使用方式 - 串流 {#usage---streaming}
在呼叫 completion 時，只要設定 `stream=True` 即可。

```python
import os
from litellm import completion

# set env
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="claude-opus-4-20250514", messages=messages, stream=True)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```

## 使用 LiteLLM Proxy 的使用方式 {#usage-with-litellm-proxy}

以下是如何使用 LiteLLM Proxy Server 呼叫 Anthropic

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

### 2. 啟動 proxy {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: claude-4 ### RECEIVED MODEL NAME ###
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: claude-opus-4-20250514 ### MODEL NAME sent to `litellm.completion()` ###
      api_key: "os.environ/ANTHROPIC_API_KEY" # does os.getenv("ANTHROPIC_API_KEY")
```

```bash
litellm --config /path/to/config.yaml
```
</TabItem>
<TabItem value="config-all" label="config - 預設所有 Anthropic 模型">

如果您想對 `claude-3-haiku-20240307`、`claude-3-opus-20240229`、`claude-2.1` 發出請求，而不必在 config.yaml 中定義它們，請使用此項

#### 必要的環境變數 {#required-env-variables}
```
ANTHROPIC_API_KEY=sk-ant****
```

```yaml
model_list:
  - model_name: "*" 
    litellm_params:
      model: "*"
```

```bash
litellm --config /path/to/config.yaml
```

此 config.yaml 的請求範例

**請確保使用 `anthropic/` 前綴，將請求路由至 Anthropic API**

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "anthropic/claude-3-haiku-20240307",
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
<TabItem value="cli" label="cli">

```bash
$ litellm --model claude-opus-4-20250514

# Server running on http://0.0.0.0:4000
```
</TabItem>
</Tabs>

### 3. 進行測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "claude-3",
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
response = client.chat.completions.create(model="claude-3", messages = [
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
    model = "claude-3",
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

## 支援的模型 {#supported-models-1}

`Model Name` 👉 人類可讀名稱。  
`Function Call` 👉 在 LiteLLM 中如何呼叫該模型。

| 模型名稱       | 函式呼叫                              |
|------------------|--------------------------------------------|
| claude-opus-4-6  | `completion('claude-opus-4-6-20260205', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-sonnet-4-5  | `completion('claude-sonnet-4-5-20250929', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-opus-4-5  | `completion('claude-opus-4-5-20251101', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-opus-4-1  | `completion('claude-opus-4-1-20250805', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-opus-4  | `completion('claude-opus-4-20250514', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-sonnet-4  | `completion('claude-sonnet-4-20250514', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3.7  | `completion('claude-3-7-sonnet-20250219', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3-5-sonnet  | `completion('claude-3-5-sonnet-20240620', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3-haiku  | `completion('claude-3-haiku-20240307', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3-opus  | `completion('claude-3-opus-20240229', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3-5-sonnet-20240620  | `completion('claude-3-5-sonnet-20240620', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-3-sonnet  | `completion('claude-3-sonnet-20240229', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-2.1  | `completion('claude-2.1', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-2  | `completion('claude-2', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-instant-1.2  | `completion('claude-instant-1.2', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-instant-1  | `completion('claude-instant-1', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |

## **快取提示詞** {#prompt-caching}

使用 Anthropic Prompt Caching

[相關的 Anthropic API 文件](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

:::note

以下是 LiteLLM 針對 Anthropic Context Caching 的一個範例原始請求樣貌：

```bash
POST Request Sent from LiteLLM:
curl -X POST \
https://api.anthropic.com/v1/messages \
-H 'accept: application/json' -H 'anthropic-version: 2023-06-01' -H 'content-type: application/json' -H 'x-api-key: sk-...' \
-d '{'model': 'claude-3-5-sonnet-20240620', [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What are the key terms and conditions in this agreement?",
          "cache_control": {
            "type": "ephemeral"
          }
        }
      ]
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Certainly! The key terms and conditions are the following: the contract is 1 year long for $10/mo"
        }
      ]
    }
  ],
  "temperature": 0.2,
  "max_tokens": 10
}'
```

**注意：** Anthropic 不再需要 `anthropic-beta: prompt-caching-2024-07-31` 標頭。當您在訊息中使用 `cache_control` 時，提示快取現在會自動運作。
::: 

### 快取 - 大型上下文快取 {#caching---large-context-caching}

此範例示範基本的 Prompt Caching 用法，將法律協議的完整文字快取為前綴，同時讓使用者指示保持不快取。

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

```python 
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement",
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ]
)

```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

:::info

LiteLLM Proxy 與 OpenAI 相容

這是一個使用 OpenAI Python SDK 向 LiteLLM Proxy 發送請求的範例

假設您在 [litellm proxy config.yaml](#usage-with-litellm-proxy) 上有一個 model=`anthropic/claude-3-5-sonnet-20240620`

:::

```python 
import openai
client = openai.AsyncOpenAI(
    api_key="anything",            # litellm proxy api key
    base_url="http://0.0.0.0:4000" # litellm proxy base url
)


response = await client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement",
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ]
)

```

</TabItem>
</Tabs>

### 快取 - 工具定義 {#caching---tools-definitions}

在此範例中，我們示範快取工具定義。

cache_control 參數放在最後一個 tool 上

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

```python 
import litellm

response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]
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
                "cache_control": {"type": "ephemeral"}
            },
        }
    ]
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

:::info

LiteLLM Proxy 與 OpenAI 相容

這是一個使用 OpenAI Python SDK 向 LiteLLM Proxy 發送請求的範例

假設您在 [litellm proxy config.yaml](#usage-with-litellm-proxy) 上有一個 model=`anthropic/claude-3-5-sonnet-20240620`

:::

```python 
import openai
client = openai.AsyncOpenAI(
    api_key="anything",            # litellm proxy api key
    base_url="http://0.0.0.0:4000" # litellm proxy base url
)

response = await client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]
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
                "cache_control": {"type": "ephemeral"}
            },
        }
    ]
)
```

</TabItem>
</Tabs>

### 快取 - 延續多輪對話 {#caching---continuing-multi-turn-convo}

在此範例中，我們示範如何在多輪對話中使用 Prompt Caching。

cache_control 參數放在 system 訊息上，以將其指定為靜態前綴的一部分。

對話歷史（先前的訊息）會包含在 messages 陣列中。最後一輪會標記 cache-control，以便在後續追問時繼續使用。倒數第二個使用者訊息會使用 cache_control 參數標記為可快取，讓此 checkpoint 可以讀取先前的快取。

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

```python 
import litellm

response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        # System Message
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement"
                    * 400,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        # marked for caching with the cache_control parameter, so that this checkpoint can read from the previous cache.
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What are the key terms and conditions in this agreement?",
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        {
            "role": "assistant",
            "content": "Certainly! the key terms and conditions are the following: the contract is 1 year long for $10/mo",
        },
        # The final turn is marked with cache-control, for continuing in followups.
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What are the key terms and conditions in this agreement?",
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
    ]
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

:::info

LiteLLM Proxy 與 OpenAI 相容

這是一個使用 OpenAI Python SDK 向 LiteLLM Proxy 發送請求的範例

假設您在 [litellm proxy config.yaml](#usage-with-litellm-proxy) 上有一個 model=`anthropic/claude-3-5-sonnet-20240620`

:::

```python 
import openai
client = openai.AsyncOpenAI(
    api_key="anything",            # litellm proxy api key
    base_url="http://0.0.0.0:4000" # litellm proxy base url
)

response = await client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        # System Message
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement"
                    * 400,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        # marked for caching with the cache_control parameter, so that this checkpoint can read from the previous cache.
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What are the key terms and conditions in this agreement?",
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        {
            "role": "assistant",
            "content": "Certainly! the key terms and conditions are the following: the contract is 1 year long for $10/mo",
        },
        # The final turn is marked with cache-control, for continuing in followups.
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What are the key terms and conditions in this agreement?",
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
    ]
)
```

</TabItem>
</Tabs>

## **函式／工具呼叫** {#functiontool-calling}

```python
from litellm import completion

# set env
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

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
    model="anthropic/claude-3-opus-20240229",
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


### 強制 Anthropic 工具使用 {#forcing-anthropic-tool-use}

如果您希望 Claude 使用特定 tool 來回答使用者的問題

您可以像這樣在 `tool_choice` 欄位中指定該 tool：
```python
response = completion(
    model="anthropic/claude-3-opus-20240229",
    messages=messages,
    tools=tools,
    tool_choice={"type": "tool", "name": "get_weather"},
)
```

### 停用工具呼叫 {#disable-tool-calling}

您可以將 `tool_choice` 設為 `"none"` 來停用 tool calling。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="anthropic/claude-3-opus-20240229",
    messages=messages,
    tools=tools,
    tool_choice="none",
)

```
</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: anthropic-claude-model
    litellm_params:
        model: anthropic/claude-3-opus-20240229
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

如果有 [設定](../proxy/virtual_keys)，請將 `anything` 替換為您的 LiteLLM Proxy 虛擬金鑰。

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer anything" \
  -d '{
    "model": "anthropic-claude-model",
    "messages": [{"role": "user", "content": "Who won the World Cup in 2022?"}],
    "tools": [{"type": "mcp", "server_label": "deepwiki", "server_url": "https://mcp.deepwiki.com/mcp", "require_approval": "never"}],
    "tool_choice": "none"
  }'
```
</TabItem>
</Tabs>

### MCP 工具呼叫 {#mcp-tool-calling}

以下是如何在 Anthropic 中使用 MCP 工具呼叫：

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK">

LiteLLM 支援以 OpenAI Responses API 格式，與 Anthropic 進行 MCP 工具呼叫。

<Tabs>
<TabItem value="openai_format" label="OpenAI 格式">

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "sk-ant-..."

tools=[
    {
        "type": "mcp",
        "server_label": "deepwiki",
        "server_url": "https://mcp.deepwiki.com/mcp",
        "require_approval": "never",
    },
]

response = completion(
    model="anthropic/claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Who won the World Cup in 2022?"}],
    tools=tools
)
```

</TabItem>
<TabItem value="anthropic_format" label="Anthropic 格式">

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "sk-ant-..."

tools = [
    {
        "type": "url",
        "url": "https://mcp.deepwiki.com/mcp",
        "name": "deepwiki-mcp",
    }
]
response = completion(
    model="anthropic/claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Who won the World Cup in 2022?"}],
    tools=tools
)

print(response)
```
</TabItem>

</Tabs>

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-4-sonnet
    litellm_params:
        model: anthropic/claude-sonnet-4-20250514
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

<Tabs>
<TabItem value="openai" label="OpenAI 格式">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-4-sonnet",
    "messages": [{"role": "user", "content": "Who won the World Cup in 2022?"}],
    "tools": [{"type": "mcp", "server_label": "deepwiki", "server_url": "https://mcp.deepwiki.com/mcp", "require_approval": "never"}]
  }'
```

</TabItem>
<TabItem value="anthropic" label="Anthropic 格式">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-4-sonnet",
    "messages": [{"role": "user", "content": "Who won the World Cup in 2022?"}],
    "tools": [
        {
            "type": "url",
            "url": "https://mcp.deepwiki.com/mcp",
            "name": "deepwiki-mcp",
        }
    ]
  }'
```

</TabItem>
</Tabs>
</TabItem>
</Tabs>

### 平行函式呼叫 {#parallel-function-calling}

以下是如何將函式呼叫的結果傳回給 anthropic 模型： 

```python
from litellm import completion
import os 

os.environ["ANTHROPIC_API_KEY"] = "sk-ant.."


litellm.set_verbose = True

### 1ST FUNCTION CALL ###
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
messages = [
    {
        "role": "user",
        "content": "What's the weather like in Boston today in Fahrenheit?",
    }
]
try:
    # test without max tokens
    response = completion(
        model="anthropic/claude-3-opus-20240229",
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

    messages.append(
        response.choices[0].message.model_dump()
    )  # Add assistant tool invokes
    tool_result = (
        '{"location": "Boston", "temperature": "72", "unit": "fahrenheit"}'
    )
    # Add user submitted tool results in the OpenAI format
    messages.append(
        {
            "tool_call_id": response.choices[0].message.tool_calls[0].id,
            "role": "tool",
            "name": response.choices[0].message.tool_calls[0].function.name,
            "content": tool_result,
        }
    )
    ### 2ND FUNCTION CALL ###
    # In the second response, Claude should deduce answer from tool results
    second_response = completion(
        model="anthropic/claude-3-opus-20240229",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )
    print(second_response)
except Exception as e:
    print(f"An error occurred - {str(e)}")
```

感謝 @[Shekhar Patnaik](https://www.linkedin.com/in/patnaikshekhar) 提出這個需求！

### 上下文管理（Beta） {#context-management-beta}

Anthropic 的 [內容編輯](https://docs.claude.com/en/docs/build-with-claude/context-editing) API 可讓您自動清除較舊的工具結果或思考區塊。LiteLLM 現在在您呼叫 Anthropic 模型時會轉送原生 `context_management` 負載，並自動附加所需的 `context-management-2025-06-27` beta 標頭。

```python
from litellm import completion

response = completion(
    model="anthropic/claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Summarize the latest tool results"}],
    context_management={
        "edits": [
            {
                "type": "clear_tool_uses_20250919",
                "trigger": {"type": "input_tokens", "value": 30000},
                "keep": {"type": "tool_uses", "value": 3},
                "clear_at_least": {"type": "input_tokens", "value": 5000},
                "exclude_tools": ["web_search"],
            }
        ]
    },
)
```

### Anthropic 託管工具（電腦、文字編輯器、網頁搜尋、記憶） {#anthropic-hosted-tools-computer-text-editor-web-search-memory}

<Tabs>
<TabItem value="computer" label="電腦">

```python
from litellm import completion

tools = [
    {
        "type": "computer_20241022",
        "function": {
            "name": "computer",
            "parameters": {
                "display_height_px": 100,
                "display_width_px": 100,
                "display_number": 1,
            },
        },
    }
]
model = "claude-3-5-sonnet-20241022"
messages = [{"role": "user", "content": "Save a picture of a cat to my desktop."}]

resp = completion(
    model=model,
    messages=messages,
    tools=tools,
    # headers={"anthropic-beta": "computer-use-2024-10-22"},
)

print(resp)
```

</TabItem>
<TabItem value="text_editor" label="文字編輯器">

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

tools = [{
    "type": "text_editor_20250124",
    "name": "str_replace_editor"
}]
model = "claude-3-5-sonnet-20241022"
messages = [{"role": "user", "content": "There's a syntax error in my primes.py file. Can you help me fix it?"}]

resp = completion(
    model=model,
    messages=messages,
    tools=tools,
)

print(resp)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
- model_name: claude-3-5-sonnet-latest
  litellm_params:
    model: anthropic/claude-3-5-sonnet-latest
    api_key: os.environ/ANTHROPIC_API_KEY
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
    "model": "claude-3-5-sonnet-latest",
    "messages": [{"role": "user", "content": "There's a syntax error in my primes.py file. Can you help me fix it?"}],
    "tools": [{"type": "text_editor_20250124", "name": "str_replace_editor"}]
  }'
```
</TabItem>
</Tabs>

</TabItem>
<TabItem value="web_search" label="網頁搜尋">

:::info
自 v1.70.1+ 起提供
:::

LiteLLM 會將 OpenAI 的 `search_context_size` 參數對應到 Anthropic 的 `max_uses` 參數。

| OpenAI | Anthropic |
| --- | --- |
| 低 | 1 | 
| 中 | 5 | 
| 高 | 10 | 

<Tabs>
<TabItem value="sdk" label="SDK">

<Tabs>
<TabItem value="openai" label="OpenAI 格式">

```python
from litellm import completion

model = "claude-3-5-sonnet-20241022"
messages = [{"role": "user", "content": "What's the weather like today?"}]

resp = completion(
    model=model,
    messages=messages,
    web_search_options={
        "search_context_size": "medium",
        "user_location": {
            "type": "approximate",
            "approximate": {
                "city": "San Francisco",
            },
        }
    }
)

print(resp)
```
</TabItem>
<TabItem value="anthropic" label="Anthropic 格式">

```python
from litellm import completion

tools = [{
    "type": "web_search_20250305",
    "name": "web_search",
    "max_uses": 5
}]
model = "claude-3-5-sonnet-20241022"
messages = [{"role": "user", "content": "There's a syntax error in my primes.py file. Can you help me fix it?"}]

resp = completion(
    model=model,
    messages=messages,
    tools=tools,
)

print(resp)
```
</TabItem>

</Tabs>
</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
- model_name: claude-3-5-sonnet-latest
  litellm_params:
    model: anthropic/claude-3-5-sonnet-latest
    api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

<Tabs>
<TabItem value="openai" label="OpenAI 格式">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-3-5-sonnet-latest",
    "messages": [{"role": "user", "content": "What's the weather like today?"}],
    "web_search_options": {
        "search_context_size": "medium",
        "user_location": {
            "type": "approximate",
            "approximate": {
                "city": "San Francisco",
            },
        }
    }
  }'
```
</TabItem>
<TabItem value="anthropic" label="Anthropic 格式">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-3-5-sonnet-latest",
    "messages": [{"role": "user", "content": "What's the weather like today?"}],
    "tools": [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 5
    }]
  }'
```

</TabItem>
</Tabs>
</TabItem>
</Tabs>

</TabItem>

<TabItem value="memory" label="Memory">

:::info
Anthropic Memory 工具目前處於 beta 版。
:::

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

tools = [{
    "type": "memory_20250818",
    "name": "memory"
}]

model = "claude-sonnet-4-5-20250929" 
messages = [{"role": "user", "content": "Please remember that my favorite color is blue."}]

response = completion(
    model=model,
    messages=messages,
    tools=tools,
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: claude-memory-model
    litellm_params:
        model: anthropic/claude-sonnet-4-5-20250929
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LITELLM_KEY" \
    -d '{
    "model": "claude-memory-model",
    "messages": [{"role": "user", "content": "Please remember that my favorite color is blue."}],
    "tools": [{"type": "memory_20250818", "name": "memory"}]
    }'
```
</TabItem>
</Tabs>

</TabItem>

</Tabs>

## 使用方式 - 視覺 {#usage---vision}

```python
from litellm import completion

# set env
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

def encode_image(image_path):
    import base64

    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


image_path = "../proxy/cached_logo.jpg"
# Getting the base64 string
base64_image = encode_image(image_path)
resp = litellm.completion(
    model="anthropic/claude-3-opus-20240229",
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

## 使用方式 - 思考 / `reasoning_content` {#usage---thinking--reasoning_content}

LiteLLM 會將 OpenAI 的 `reasoning_effort` 轉譯為 Anthropic 的 `thinking` 參數。[程式碼](https://github.com/BerriAI/litellm/blob/23051d89dd3611a81617d84277059cd88b2df511/litellm/llms/anthropic/chat/transformation.py#L298)

| reasoning_effort | thinking |
| ---------------- | -------- |
| "low"            | "budget_tokens": 1024 |
| "medium"         | "budget_tokens": 2048 |
| "high"           | "budget_tokens": 4096 |

:::note
`reasoning_effort` 會對應到 Anthropic 的 [adaptive thinking](https: //docs.claude.com/en/docs/build-with-claude/extended-thinking/adaptive-thinking)，以及 Claude 4.6 和 4.7 模型上的 `output_config.effort` 參數（包含 `claude-opus-4-6`、`claude-opus-4-7`、`claude-sonnet-4-6` 等），**不是** `budget_tokens`。特別是，LiteLLM 會在 OpenAI 相容的 `/chat/completions` 路由上，將下列內容注入底層 Anthropic 請求：

```json
{
  "thinking": {"type": "adaptive"},
  "output_config": {"effort": "<low|medium|high|xhigh|max>"}
}
```

這表示，對於這些模型，`reasoning_effort` 的 `"none"` 以外的**任何值，都會自動啟用 thinking**，即使 OpenAI 相容的請求本文沒有獨立的 `thinking` 欄位。這是為了符合 Anthropic 自己建議的用法：在 4.6 模型上，budget_tokens 已被棄用；在 Opus 4.7 上則完全被拒絕，因為只有 adaptive 是受支援的 thinking 模式。

您可以透過完全省略 `reasoning_effort`，或將其設定為 `"none"` 來停用 thinking。在這種情況下，LiteLLM 不會送出 `thinking` 欄位。如果您希望在先前的模型上以固定預算明確控制 thinking，仍可直接傳遞原生的 `thinking` 參數：

```python
from litellm import completion

# Disable thinking on Claude 4.6/4.7
resp = completion(
    model="anthropic/claude-opus-4-7",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="none",  # no thinking field sent
)

# Explicit budget (pre-4.6 models; deprecated on 4.6, rejected on Opus 4.7)
resp = completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    thinking={"type": "enabled", "budget_tokens": 1024},
)
```

Anthropic `/v1/messages` 直通路由不受此 reasoning_effort 對應影響。`thinking` 會原樣傳遞。
:::

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

resp = completion(
    model="anthropic/claude-3-7-sonnet-20250219",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",
)

```

</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
- model_name: claude-3-7-sonnet-20250219
  litellm_params:
    model: anthropic/claude-3-7-sonnet-20250219
    api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

**預期回應**

```python
ModelResponse(
    id='chatcmpl-c542d76d-f675-4e87-8e5f-05855f5d0f5e',
    created=1740470510,
    model='claude-3-7-sonnet-20250219',
    object='chat.completion',
    system_fingerprint=None,
    choices=[
        Choices(
            finish_reason='stop',
            index=0,
            message=Message(
                content="The capital of France is Paris.",
                role='assistant',
                tool_calls=None,
                function_call=None,
                provider_specific_fields={
                    'citations': None,
                    'thinking_blocks': [
                        {
                            'type': 'thinking',
                            'thinking': 'The capital of France is Paris. This is a very straightforward factual question.',
                            'signature': 'EuYBCkQYAiJAy6...'
                        }
                    ]
                }
            ),
            thinking_blocks=[
                {
                    'type': 'thinking',
                    'thinking': 'The capital of France is Paris. This is a very straightforward factual question.',
                    'signature': 'EuYBCkQYAiJAy6AGB...'
                }
            ],
            reasoning_content='The capital of France is Paris. This is a very straightforward factual question.'
        )
    ],
    usage=Usage(
        completion_tokens=68,
        prompt_tokens=42,
        total_tokens=110,
        completion_tokens_details=None,
        prompt_tokens_details=PromptTokensDetailsWrapper(
            audio_tokens=None,
            cached_tokens=0,
            text_tokens=None,
            image_tokens=None
        ),
        cache_creation_input_tokens=0,
        cache_read_input_tokens=0
    )
)
```

### 將 `thinking` 傳遞給 Anthropic 模型 {#pass-thinking-to-anthropic-models}

您也可以將 `thinking` 參數傳給 Anthropic 模型。

您也可以將 `thinking` 參數傳給 Anthropic 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.completion(
  model="anthropic/claude-3-7-sonnet-20250219",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  thinking={"type": "enabled", "budget_tokens": 1024},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "thinking": {"type": "enabled", "budget_tokens": 1024}
  }'
```

</TabItem>
</Tabs>

#### 自適應思考（Claude Opus 4.6） {#adaptive-thinking-claude-opus-46}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.completion(
  model="anthropic/claude-opus-4-6",
  messages=[{"role": "user", "content": "What is the optimal strategy for solving this problem?"}],
  thinking={"type": "adaptive"},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "anthropic/claude-opus-4-6",
    "messages": [{"role": "user", "content": "What is the optimal strategy for solving this problem?"}],
    "thinking": {"type": "adaptive"}
  }'
```

</TabItem>
</Tabs>

#### 啟用具有預算的思考 {#enabled-thinking-with-budget}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.completion(
  model="anthropic/claude-opus-4-6",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  thinking={"type": "enabled", "budget_tokens": 5000},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "anthropic/claude-opus-4-6",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "thinking": {"type": "enabled", "budget_tokens": 5000}
  }'
```

</TabItem>
</Tabs>

## **將額外標頭傳遞給 Anthropic API** {#passing-extra-headers-to-anthropic-api}

將 `extra_headers: dict` 傳遞給 `litellm.completion`

```python
from litellm import completion
messages = [{"role": "user", "content": "What is Anthropic?"}]
response = completion(
    model="claude-3-5-sonnet-20240620", 
    messages=messages, 
    extra_headers={"anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"}
)
```

## 使用方式 - 「Assistant 預填」 {#usage---assistant-pre-fill}

您可以透過在 `messages` 陣列中最後一個項目加入 `assistant` 角色訊息，來「替 Claude 輸入台詞」。

> [!IMPORTANT]
> 傳回的完成內容將 _不會_ 包含您的「預填」文字，因為它本身就是提示的一部分。請務必在 Claude 的完成內容前加上您的預填文字。

```python
import os
from litellm import completion

# set env - [OPTIONAL] replace with your anthropic key
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages = [
    {"role": "user", "content": "How do you say 'Hello' in German? Return your answer as a JSON object, like this:\n\n{ \"Hello\": \"Hallo\" }"},
    {"role": "assistant", "content": "{"},
]
response = completion(model="claude-2.1", messages=messages)
print(response)
```

#### 傳送給 Claude 的範例提示詞 {#example-prompt-sent-to-claude}

```

Human: How do you say 'Hello' in German? Return your answer as a JSON object, like this:

{ "Hello": "Hallo" }

Assistant: {
```

## 使用方式 - 「System」訊息 {#usage---system-messages}
如果您使用的是 Anthropic 的 Claude 2.1，`system` 角色訊息會自動為您正確格式化。

```python
import os
from litellm import completion

# set env - [OPTIONAL] replace with your anthropic key
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages = [
    {"role": "system", "content": "You are a snarky assistant."},
    {"role": "user", "content": "How do I boil water?"},
]
response = completion(model="claude-2.1", messages=messages)
```

#### 傳送給 Claude 的範例提示詞 {#example-prompt-sent-to-claude-1}

```
You are a snarky assistant.

Human: How do I boil water?

Assistant:
```


## 使用方式 - PDF {#usage---pdf}

使用 `file` 內容類型與 `file_data` 欄位，將 base64 編碼的 PDF 檔案傳遞給 Anthropic 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

### **使用 base64** {#using-base64}
```python
from litellm import completion, supports_pdf_input
import base64
import requests

# URL of the file
url = "https://storage.googleapis.com/cloud-samples-data/generative-ai/pdf/2403.05530.pdf"

# Download the file
response = requests.get(url)
file_data = response.content

encoded_file = base64.b64encode(file_data).decode("utf-8")

## check if model supports pdf input - (2024/11/11) only claude-3-5-haiku-20241022 supports it
supports_pdf_input("anthropic/claude-3-5-haiku-20241022") # True

response = completion(
    model="anthropic/claude-3-5-haiku-20241022",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "You are a very professional document summarization specialist. Please summarize the given document."},
                {
                    "type": "file",
                    "file": {
                       "file_data": f"data:application/pdf;base64,{encoded_file}", # 👈 PDF
                    }
                },
            ],
        }
    ],
    max_tokens=300,
)

print(response.choices[0])
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型加入設定檔

```yaml
- model_name: claude-3-5-haiku-20241022
  litellm_params:
    model: anthropic/claude-3-5-haiku-20241022
    api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "You are a very professional document summarization specialist. Please summarize the given document"
          },
          {
                "type": "file",
                "file": {
                    "file_data": f"data:application/pdf;base64,{encoded_file}", # 👈 PDF
                }
            }
          }
        ]
      }
    ],
    "max_tokens": 300
  }'

```
</TabItem>
</Tabs>

## [BETA] 引用 API {#beta-citations-api}

將 `citations: {"enabled": true}` 傳遞給 Anthropic，以取得您文件回應中的引文。

注意：此介面目前為 BETA。如果您對引文應如何回傳有任何回饋，請 [在此告訴我們](https://github.com/BerriAI/litellm/issues/7970#issuecomment-2644437943)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

resp = completion(
    model="claude-3-5-sonnet-20241022",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "text",
                        "media_type": "text/plain",
                        "data": "The grass is green. The sky is blue.",
                    },
                    "title": "My Document",
                    "context": "This is a trustworthy document.",
                    "citations": {"enabled": True},
                },
                {
                    "type": "text",
                    "text": "What color is the grass and sky?",
                },
            ],
        }
    ],
)

citations = resp.choices[0].message.provider_specific_fields["citations"]

assert citations is not None
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: anthropic-claude
      litellm_params:
        model: anthropic/claude-3-5-sonnet-20241022
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "anthropic-claude",
  "messages": [
    {
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "text",
                    "media_type": "text/plain",
                    "data": "The grass is green. The sky is blue.",
                },
                "title": "My Document",
                "context": "This is a trustworthy document.",
                "citations": {"enabled": True},
            },
            {
                "type": "text",
                "text": "What color is the grass and sky?",
            },
        ],
    }
  ]
}'
```

</TabItem>
</Tabs>

## 檔案 API {#files-api}

上傳檔案一次，並在多個請求中以 `file_id` 參照它們——無須每次重新上傳內容。

:::info
從 Anthropic 取得的 `file_id` 僅適用於 Anthropic Claude 模型。您無法將其用於其他提供者（OpenAI、Bedrock 等）。
:::

- **檔案大小上限：** 500 MB | **總儲存空間：** 每個 org 100 GB
- **價格：** File API 操作免費。Messages 請求中使用的檔案內容會依 input tokens 計價。

**依檔案類型支援的模型：**
- **圖片：** 所有 Claude 3+ 模型
- **PDF：** 所有 Claude 3.5+ 模型
- **其他檔案類型**（用於程式碼執行）：Claude 3.5 Haiku + 所有 Claude 3.7+ 模型

### 快速開始 {#quick-start}

```python
import litellm
import os

os.environ["ANTHROPIC_API_KEY"] = "sk-ant-..."

# 1. Upload a file once
file = litellm.create_file(
    file=open("document.pdf", "rb"),
    purpose="messages",
    custom_llm_provider="anthropic",
)

# 2. Use file_id in messages (no re-upload needed)
response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Summarize this document"},
            {"type": "file", "file": {"file_id": file.id, "format": "application/pdf"}}
        ]
    }]
)
```

### 檔案操作 {#file-operations}

| 操作 | 函式 |
|-----------|----------|
| 上傳 | `litellm.create_file(file, purpose="messages", custom_llm_provider="anthropic")` |
| 列出 | `litellm.file_list(custom_llm_provider="anthropic")` |
| 取回 | `litellm.file_retrieve(file_id, custom_llm_provider="anthropic")` |
| 刪除 | `litellm.file_delete(file_id, custom_llm_provider="anthropic")` |
| 下載 | `litellm.file_content(file_id, custom_llm_provider="anthropic")` |

:::note
下載僅適用於由 [程式碼執行工具](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/code-execution-tool) 建立的檔案，不適用於已上傳的檔案。
:::

### 支援的格式 {#supported-formats}

| 檔案類型 | 格式值 |
|-----------|-------------|
| PDF | `application/pdf` |
| 純文字 | `text/plain` |
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| WebP | `image/webp` |

### 使用圖片 {#using-images}

```python
# Upload image
image = litellm.create_file(
    file=open("photo.jpg", "rb"),
    purpose="messages",
    custom_llm_provider="anthropic",
)

# Use in message
response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "file", "file": {"file_id": image.id, "format": "image/jpeg"}}
        ]
    }]
)
```

## 使用方式 - 將 'user_id' 傳遞給 Anthropic {#usage---passing-user_id-to-anthropic}

LiteLLM 會將 OpenAI 的 `user` 參數轉換為 Anthropic 的 `metadata[user_id]` 參數。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = completion(
    model="claude-3-5-sonnet-20240620",
    messages=messages,
    user="user_123",
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: claude-3-5-sonnet-20240620
      litellm_params:
        model: anthropic/claude-3-5-sonnet-20240620
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

3. 測試看看！ 

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "claude-3-5-sonnet-20240620",
    "messages": [{"role": "user", "content": "What is Anthropic?"}],
    "user": "user_123"
  }'
```

</TabItem>
</Tabs>

## 使用方式 - Agent Skills {#usage---agent-skills}

LiteLLM 支援透過 API 使用 Agent Skills

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = completion(
    model="claude-sonnet-4-5-20250929",
    messages=messages,
    tools= [
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        }
    ],
    container= {
        "skills": [
            {
                "type": "anthropic",
                "skill_id": "pptx",
                "version": "latest"
            }
        ]
    }
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: claude-sonnet-4-5-20250929
        litellm_params:
        model: anthropic/claude-sonnet-4-5-20250929
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

3. 測試看看！ 

```bash
curl --location 'http://localhost:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <YOUR-LITELLM-KEY>' \
--data '{
    "model": "claude-sonnet-4-5-20250929",
    "messages": [
        {
            "role": "user",
            "content": "Hi"
        }
    ],
    "tools": [
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        }
    ],
    "container": {
        "skills": [
            {
                "type": "anthropic",
                "skill_id": "pptx",
                "version": "latest"
            }
        ]
    }
}'
```

</TabItem>
</Tabs>

容器及其「id」將會出現在串流／非串流回應中的「provider_specific_fields」內
