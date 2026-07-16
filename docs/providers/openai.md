import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI {#openai}
LiteLLM 支援 OpenAI Chat + Embedding 請求。

:::tip
**我們建議對最新的 OpenAI 模型（GPT-5、gpt-5-codex、o3-mini 等）使用 `litellm.responses()` / Responses API** 
:::

### 必要的 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 使用方式 {#usage}
```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "gpt-4o", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

:::info Metadata passthrough（預覽）
當 `litellm.enable_preview_features = True` 時，LiteLLM 只會將 `metadata` 內的值轉送給 OpenAI。

```python
completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
    metadata= {"custom_meta_key": "value"},
)
```
:::

### 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

以下是使用 LiteLLM Proxy Server 呼叫 OpenAI 模型的方法

### 1. 在您的環境中儲存金鑰 {#1-save-key-in-your-environment}

```bash
export OPENAI_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo                          # The `openai/` prefix will call openai.chat.completions.create
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-3.5-turbo-instruct
    litellm_params:
      model: text-completion-openai/gpt-3.5-turbo-instruct # The `text-completion-openai/` prefix will call openai.completions.create
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="config-*" label="config.yaml - 代理所有 OpenAI 模型">

使用這個可用一個 API 金鑰新增所有 openai 模型。**警告：這不會進行任何負載平衡**
這表示對 `gpt-4`、`gpt-3.5-turbo`、`gpt-4-turbo-preview` 的請求都會經由這條路由 

```yaml
model_list:
  - model_name: "*"             # all requests where model not in your config go to this deployment
    litellm_params:
      model: openai/*           # set `openai/` to use the openai route
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="cli" label="CLI">

```bash
$ litellm --model gpt-3.5-turbo

# Server running on http://0.0.0.0:4000
```
</TabItem>

</Tabs>

### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "gpt-3.5-turbo",
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
response = client.chat.completions.create(model="gpt-3.5-turbo", messages = [
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
    model = "gpt-3.5-turbo",
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

### 選用金鑰 - OpenAI Organization、OpenAI API Base {#optional-keys---openai-organization-openai-api-base}

```python
import os 
os.environ["OPENAI_ORGANIZATION"] = "your-org-id"       # OPTIONAL
os.environ["OPENAI_BASE_URL"] = "https://your_host/v1"     # OPTIONAL
```

### OpenAI Chat Completion 模型 {#openai-chat-completion-models}

| 模型名稱            | 函式呼叫                                                   |
|-----------------------|-----------------------------------------------------------------|
| gpt-5 | `response = completion(model="gpt-5", messages=messages)` |
| gpt-5-mini | `response = completion(model="gpt-5-mini", messages=messages)` |
| gpt-5-nano | `response = completion(model="gpt-5-nano", messages=messages)` |
| gpt-5-chat | `response = completion(model="gpt-5-chat", messages=messages)` |
| gpt-5-chat-latest | `response = completion(model="gpt-5-chat-latest", messages=messages)` |
| gpt-5-2025-08-07 | `response = completion(model="gpt-5-2025-08-07", messages=messages)` |
| gpt-5-mini-2025-08-07 | `response = completion(model="gpt-5-mini-2025-08-07", messages=messages)` |
| gpt-5-nano-2025-08-07 | `response = completion(model="gpt-5-nano-2025-08-07", messages=messages)` |
| gpt-5-pro | `response = completion(model="gpt-5-pro", messages=messages)` |
| gpt-5.2 | `response = completion(model="gpt-5.2", messages=messages)` |
| gpt-5.2-2025-12-11 | `response = completion(model="gpt-5.2-2025-12-11", messages=messages)` |
| gpt-5.2-chat-latest | `response = completion(model="gpt-5.2-chat-latest", messages=messages)` |
| gpt-5.3-chat-latest | `response = completion(model="gpt-5.3-chat-latest", messages=messages)` |
| gpt-5.4 | `response = completion(model="gpt-5.4", messages=messages)` |
| gpt-5.4-2026-03-05 | `response = completion(model="gpt-5.4-2026-03-05", messages=messages)` |
| gpt-5.5 | `response = completion(model="gpt-5.5", messages=messages)` |
| gpt-5.5-2026-04-23 | `response = completion(model="gpt-5.5-2026-04-23", messages=messages)` |
| gpt-5.2-pro | `response = completion(model="gpt-5.2-pro", messages=messages)` |
| gpt-5.2-pro-2025-12-11 | `response = completion(model="gpt-5.2-pro-2025-12-11", messages=messages)` |
| gpt-5.4-pro | `response = completion(model="gpt-5.4-pro", messages=messages)` |
| gpt-5.4-pro-2026-03-05 | `response = completion(model="gpt-5.4-pro-2026-03-05", messages=messages)` |
| gpt-5.5-pro | `response = completion(model="gpt-5.5-pro", messages=messages)` |
| gpt-5.5-pro-2026-04-23 | `response = completion(model="gpt-5.5-pro-2026-04-23", messages=messages)` |
| gpt-5.1 | `response = completion(model="gpt-5.1", messages=messages)` |
| gpt-5.1-codex | `response = completion(model="gpt-5.1-codex", messages=messages)` |
| gpt-5.1-codex-mini | `response = completion(model="gpt-5.1-codex-mini", messages=messages)` |
| gpt-5.1-codex-max | `response = completion(model="gpt-5.1-codex-max", messages=messages)` |
| gpt-4.1 | `response = completion(model="gpt-4.1", messages=messages)` |
| gpt-4.1-mini | `response = completion(model="gpt-4.1-mini", messages=messages)` |
| gpt-4.1-nano | `response = completion(model="gpt-4.1-nano", messages=messages)` |
| o4-mini | `response = completion(model="o4-mini", messages=messages)` |
| o3-mini | `response = completion(model="o3-mini", messages=messages)` |
| o3 | `response = completion(model="o3", messages=messages)` |
| o1-mini | `response = completion(model="o1-mini", messages=messages)` |
| o1-preview | `response = completion(model="o1-preview", messages=messages)` |
| gpt-4o-mini  | `response = completion(model="gpt-4o-mini", messages=messages)` |
| gpt-4o-mini-2024-07-18   | `response = completion(model="gpt-4o-mini-2024-07-18", messages=messages)` |
| gpt-4o   | `response = completion(model="gpt-4o", messages=messages)` |
| gpt-4o-2024-08-06   | `response = completion(model="gpt-4o-2024-08-06", messages=messages)` |
| gpt-4o-2024-05-13   | `response = completion(model="gpt-4o-2024-05-13", messages=messages)` |
| gpt-4-turbo   | `response = completion(model="gpt-4-turbo", messages=messages)` |
| gpt-4-turbo-preview   | `response = completion(model="gpt-4-0125-preview", messages=messages)` |
| gpt-4-0125-preview    | `response = completion(model="gpt-4-0125-preview", messages=messages)` |
| gpt-4-1106-preview    | `response = completion(model="gpt-4-1106-preview", messages=messages)` |
| gpt-3.5-turbo-1106    | `response = completion(model="gpt-3.5-turbo-1106", messages=messages)` |
| gpt-3.5-turbo         | `response = completion(model="gpt-3.5-turbo", messages=messages)` |
| gpt-3.5-turbo-0301    | `response = completion(model="gpt-3.5-turbo-0301", messages=messages)` |
| gpt-3.5-turbo-0613    | `response = completion(model="gpt-3.5-turbo-0613", messages=messages)` |
| gpt-3.5-turbo-16k     | `response = completion(model="gpt-3.5-turbo-16k", messages=messages)` |
| gpt-3.5-turbo-16k-0613| `response = completion(model="gpt-3.5-turbo-16k-0613", messages=messages)` |
| gpt-4                 | `response = completion(model="gpt-4", messages=messages)` |
| gpt-4-0314            | `response = completion(model="gpt-4-0314", messages=messages)` |
| gpt-4-0613            | `response = completion(model="gpt-4-0613", messages=messages)` |
| gpt-4-32k             | `response = completion(model="gpt-4-32k", messages=messages)` |

| gpt-4-32k-0314        | `response = completion(model="gpt-4-32k-0314", messages=messages)` |
| gpt-4-32k-0613        | `response = completion(model="gpt-4-32k-0613", messages=messages)` |

這些也支援 `OPENAI_BASE_URL` 環境變數，可用來指定自訂 API 端點。

### OpenAI Web Search 模型 {#openai-web-search-models}

OpenAI 有兩種使用網頁搜尋的方式，取決於端點：

| 方法 | 端點 | 模型 | 啟用方式 |
|----------|----------|--------|---------------|
| **搜尋模型** | `/chat/completions` | `gpt-5-search-api`、`gpt-4o-search-preview`、`gpt-4o-mini-search-preview` | 傳入 `web_search_options` 參數 |
| **網頁搜尋工具** | `/responses` | `gpt-5`、`gpt-4.1`、`gpt-4o`，以及其他一般模型 | 傳入 `web_search_preview` 工具 |

<Tabs>
<TabItem value="sdk-completion" label="SDK - /chat/completions">

```python showLineNumbers
from litellm import completion

response = completion(
    model="openai/gpt-5-search-api",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    web_search_options={
        "search_context_size": "medium"  # Options: "low", "medium", "high"
    }
)
```

</TabItem>
<TabItem value="sdk-responses" label="SDK - /responses">

```python showLineNumbers
from litellm import responses

response = responses(
    model="openai/gpt-5",
    input="What is the capital of France?",
    tools=[{
        "type": "web_search_preview",
        "search_context_size": "low"
    }]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  # Search model for /chat/completions
  - model_name: gpt-5-search-api
    litellm_params:
      model: openai/gpt-5-search-api
      api_key: os.environ/OPENAI_API_KEY

  # Regular model for /responses with web_search_preview tool
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
</Tabs>

完整細節請參閱[網頁搜尋指南](../completion/web_search.md)。

## OpenAI Vision 模型 {#openai-vision-models}
| 模型名稱            | 函式呼叫                                                   |
|-----------------------|-----------------------------------------------------------------|
| gpt-4o   | `response = completion(model="gpt-4o", messages=messages)` |
| gpt-4-turbo    | `response = completion(model="gpt-4-turbo", messages=messages)` |
| gpt-4-vision-preview    | `response = completion(model="gpt-4-vision-preview", messages=messages)` |

#### 使用方式 {#usage-1}
```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "gpt-4-vision-preview", 
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png"
                                }
                            }
                        ]
        }
    ],
)

```

## PDF 檔案解析 {#pdf-file-parsing}

OpenAI 有一種新的 `file` 訊息類型，可讓您傳入 PDF 檔案，並將其剖析為結構化輸出。[閱讀更多](https://platform.openai.com/docs/guides/pdf-files?api-mode=chat&lang=python)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import base64
from litellm import completion

with open("draconomicon.pdf", "rb") as f:
    data = f.read()

base64_string = base64.b64encode(data).decode("utf-8")

completion = completion(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "file",
                    "file": {
                        "filename": "draconomicon.pdf",
                        "file_data": f"data:application/pdf;base64,{base64_string}",
                    }
                },
                {
                    "type": "text",
                    "text": "What is the first dragon in the book?",
                }
            ],
        },
    ],
)

print(completion.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: openai-model
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{ 
    "model": "openai-model",
    "messages": [
        {"role": "user", "content": [
            {
                "type": "file",
                "file": {
                    "filename": "draconomicon.pdf",
                    "file_data": f"data:application/pdf;base64,{base64_string}",
                }
            }
        ]}
    ]
}'
```

</TabItem>
</Tabs>

## OpenAI Fine Tuned 模型 {#openai-fine-tuned-models}

| 模型名稱                | 函式呼叫                                                          |
|---------------------------|-----------------------------------------------------------------|
| fine tuned `gpt-4-0613`    | `response = completion(model="ft:gpt-4-0613", messages=messages)`     |
| fine tuned `gpt-4o-2024-05-13` | `response = completion(model="ft:gpt-4o-2024-05-13", messages=messages)` |
| fine tuned `gpt-3.5-turbo-0125` | `response = completion(model="ft:gpt-3.5-turbo-0125", messages=messages)` |
| fine tuned `gpt-3.5-turbo-1106` | `response = completion(model="ft:gpt-3.5-turbo-1106", messages=messages)` |
| fine tuned `gpt-3.5-turbo-0613` | `response = completion(model="ft:gpt-3.5-turbo-0613", messages=messages)` |

## [BETA] 將所有 .completions 請求路由至 Responses API（更佳品質） {#beta-route-all-completions-requests-to-responses-api-better-quality}
 啟用後，LiteLLM 會將來自 `litellm.completion()` 與 proxy `/chat/completions` 端點的 OpenAI 流量，透過 [Responses API](https://platform.openai.com/docs/api-reference/responses) 而非 Chat Completions 傳送。該路徑通常更符合 OpenAI 最新的模型行為與品質（例如，GPT‑5 類模型的 reasoning 輸出）。

您可以全域或按請求選擇啟用：

**選項 A — 依請求前綴：** 使用 `openai/responses/` model 前綴。

**選項 B — 全域旗標（建議）：** 設定 `route_all_chat_openai_to_responses = True`，即可自動將所有 OpenAI `/chat/completions` 請求路由至 Responses API，無需 model 前綴。

<Tabs>
<TabItem value="sdk-global" label="SDK - 全域旗標">

```python
import litellm

litellm.route_all_chat_openai_to_responses = True

response = litellm.completion(
    model="gpt-5.4",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",
)
```

</TabItem>
<TabItem value="proxy-global" label="PROXY - 全域旗標">

在您的 proxy 設定中設定：
```yaml
litellm_settings:
  route_all_chat_openai_to_responses: true
```

接著正常呼叫即可 — 無需 model 前綴：
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-5.4",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "low"
}'
```

</TabItem>
</Tabs>

:::note
`route_all_chat_openai_to_responses` 只適用於 `openai` 提供者。Azure OpenAI 不受影響。您也可以透過環境變數設定：`LITELLM_ROUTE_ALL_CHAT_OPENAI_TO_RESPONSES=true`。
:::

**選項 A — 依請求前綴：** 您也可以在個別 model 名稱前加上 `openai/responses/`，只將該次呼叫路由至 Responses API。

<Tabs>
<TabItem value="sdk" label="SDK">
```python
response = litellm.completion(
    model="openai/responses/gpt-5-mini", # tells litellm to call the model via the Responses API
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",
)
```
</TabItem>

<TabItem value="proxy" label="PROXY">
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{ 
    "model": "openai/responses/gpt-5-mini",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "low"
}'
```
</TabItem>
</Tabs>

預期回應：
```json
{
  "id": "chatcmpl-6382a222-43c9-40c4-856b-22e105d88075",
  "created": 1760146746,
  "model": "gpt-5-mini",
  "object": "chat.completion",
  "system_fingerprint": null,
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Paris",
        "role": "assistant",
        "tool_calls": null,
        "function_call": null,
        "reasoning_content": "**Identifying the capital**\n\nThe user wants me to think of the capital of France and write it down. That's pretty straightforward: it's Paris. There aren't any safety issues to consider here. I think it would be best to keep it concise, so maybe just \"Paris\" would suffice. I feel confident that I should just stick to that without adding anything else. So, let's write it down!",
        "provider_specific_fields": null
      }
    }
  ],
  "usage": {
    "completion_tokens": 7,
    "prompt_tokens": 18,
    "total_tokens": 25,
    "completion_tokens_details": null,
    "prompt_tokens_details": {
      "audio_tokens": null,
      "cached_tokens": 0,
      "text_tokens": null,
      "image_tokens": null
    }
  }
}

```

### 進階：搭配 `reasoning_effort` 與 `summary` 欄位使用 {#advanced-using-reasoning_effort-with-summary-field}

預設情況下，`reasoning_effort` 接受字串值（`"none"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`—`"xhigh"` 僅支援於 `gpt-5.1-codex-max` 和 `gpt-5.2` models），且只會設定 effort level，不會包含 reasoning summary。

若要啟用 `summary` 功能，您可以將 `reasoning_effort` 以字典形式傳入。**注意：** `summary` 欄位需要您的 OpenAI organization 具有驗證狀態。未通過驗證而使用 `summary` 將會收到 OpenAI 返回的 400 error。

<Tabs>
<TabItem value="sdk" label="SDK">
```python
# Option 1: String format (default - no summary)
response = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="high"  # Only sets effort level
)

# Option 2: Dict format (with optional summary - requires org verification)
response = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort={"effort": "high", "summary": "auto"}  # "auto", "detailed", or "concise" (not all supported by all models)
)
```
</TabItem>

<TabItem value="proxy" label="PROXY">
```bash
# Option 1: String format (default - no summary)
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "openai/responses/gpt-5-mini",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "high"
}'

# Option 2: Dict format (with optional summary - requires org verification)
# summary options: "auto", "detailed", or "concise" (not all supported by all models)
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "openai/responses/gpt-5-mini",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": {"effort": "high", "summary": "auto"}
}'
```
</TabItem>
</Tabs>

**Summary 欄位選項：**
- `"auto"`：系統會根據模型自動判定適當的 summary level
- `"concise"`：提供較短的 summary（GPT-5 系列 models 不支援）
- `"detailed"`：提供完整的 reasoning summary

**注意：** GPT-5 系列模型支援 `"auto"` 和 `"detailed"`，但不支援 `"concise"`。O 系列模型（o3-pro、o4-mini、o3）支援這三個選項。某些模型如 o3-mini 和 o1 完全不支援 reasoning summaries。

**依模型支援的 `reasoning_effort` 值：**

| 模型 | 預設值（未設定時） | 支援的值 |
|-------|----------------------|------------------|
| `gpt-5.1` | `none` | `none`、`low`、`medium`、`high` |
| `gpt-5` | `medium` | `minimal`、`low`、`medium`、`high` |
| `gpt-5-mini` | `medium` | `minimal`、`low`、`medium`、`high` |
| `gpt-5-nano` | `none` | `none`、`low`、`medium`、`high` |
| `gpt-5-codex` | `adaptive` | `low`、`medium`、`high`（無 `minimal`） |
| `gpt-5.1-codex` | `adaptive` | `low`、`medium`、`high`（無 `minimal`） |
| `gpt-5.1-codex-mini` | `adaptive` | `low`、`medium`、`high`（無 `minimal`） |
| `gpt-5.1-codex-max` | `adaptive` | `low`、`medium`、`high`、`xhigh`（無 `minimal`） |
| `gpt-5.2` | `medium` | `none`、`low`、`medium`、`high`、`xhigh` |
| `gpt-5.2-pro` | `high` | `low`、`medium`、`high`、`xhigh` |
| `gpt-5.5` | `medium` | `none`、`minimal`、`low`、`medium`、`high`、`xhigh` |
| `gpt-5.5-pro` | `high` | `minimal`、`low`、`medium`、`high`、`xhigh` |
| `gpt-5-pro` | `high` |  միայն `high` |

**注意：**
- GPT-5.1 推出了一個新的 `reasoning_effort="none"` 設定，可提供更快、延遲更低的回應。這取代了 GPT-5 中的 `"minimal"` 設定。
- `gpt-5.1-codex-max`、`gpt-5.2`、`gpt-5.2-pro`、`gpt-5.5` 和 `gpt-5.5-pro` 支援 `reasoning_effort="xhigh"`。此集合之外的模型會拒絕該值。
- `gpt-5-pro` 只接受 `reasoning_effort="high"`。其他值將會回傳錯誤。
- 當 `reasoning_effort` 未設定（None）時，OpenAI 會預設使用「Default」欄中顯示的值。

請參閱 [OpenAI Reasoning 文件](https://platform.openai.com/docs/guides/reasoning) 以了解組織驗證需求的更多詳細資訊。

### 使用 `reasoning_items` 的多輪對話 {#multi-turn-conversations-with-reasoning_items}

對於多輪對話，您需要 `reasoning_items`：也就是包含 `encrypted_content` token 的結構化區塊，OpenAI 會使用該 token 在下一次請求中還原 reasoning 狀態。請在每次希望回傳該 token 的呼叫中傳入 `include=["reasoning.encrypted_content"]`。

<Tabs>
<TabItem value="non-streaming" label="非串流">

```python showLineNumbers title="Non-streaming: round-trip reasoning_items"
import litellm

messages = [{"role": "user", "content": "Solve this step by step: 2 + 2"}]

# Turn 1 — get reasoning_items (encrypted_content);
response = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=messages,
    reasoning_effort="low",
    include=["reasoning.encrypted_content"],
)

assistant_msg = response.choices[0].message

# Turn 2 — pass reasoning_items back; LiteLLM converts to the correct Responses API format
messages.append({
    "role": "assistant",
    "content": assistant_msg.content,
    "reasoning_items": assistant_msg.reasoning_items,
})
messages.append({"role": "user", "content": "Now summarize your reasoning."})

response2 = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=messages,
    reasoning_effort="low",
    include=["reasoning.encrypted_content"],
)
```

</TabItem>
<TabItem value="streaming" label="串流">

當完整回應完成時，`reasoning_items`（搭配 `encrypted_content`）會在最後一個 chunk 到達：

```python showLineNumbers title="Streaming: collect and round-trip reasoning_items"
import litellm

messages = [{"role": "user", "content": "Solve this step by step: 2 + 2"}]

collected_content = []
collected_reasoning_items = []

stream = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=messages,
    stream=True,
    reasoning_effort="low",
    include=["reasoning.encrypted_content"],
)

for chunk in stream:
    delta = chunk.choices[0].delta
    if delta.content:
        collected_content.append(delta.content)
    if getattr(delta, "reasoning_items", None):
        collected_reasoning_items.extend(delta.reasoning_items)

messages.append({
    "role": "assistant",
    "content": "".join(collected_content),
    "reasoning_items": collected_reasoning_items or None,
})
messages.append({"role": "user", "content": "Continue the conversation."})

response2 = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=messages,
    reasoning_effort="low",
    include=["reasoning.encrypted_content"],
)
```

</TabItem>
</Tabs>

### GPT-5 模型的詳盡程度控制 {#verbosity-control-for-gpt-5-models}

`verbosity` 參數可控制 GPT-5 系列模型回應的長度與細節。它接受三個值：`"low"`、`"medium"`，或 `"high"`。

**支援的模型：** `gpt-5`、`gpt-5.1`、`gpt-5-mini`、`gpt-5-nano`、`gpt-5-pro`

**注意：** GPT-5-Codex 模型（`gpt-5-codex`、`gpt-5.1-codex`、`gpt-5.1-codex-mini`、`gpt-5.1-codex-max`）**不**支援 `verbosity` 參數。

**使用情境：**
- **`"low"`**：最適合簡潔的回答或簡單的程式碼產生（例如：SQL 查詢）
- **`"medium"`**：預設值－輸出長度與內容取得平衡
- **`"high"`**：當您需要詳盡說明或大幅程式碼重構時使用

<Tabs>
<TabItem value="sdk" label="SDK">
```python
import litellm

# Low verbosity - concise responses
response = litellm.completion(
    model="gpt-5.1",
    messages=[{"role": "user", "content": "Write a function to reverse a string"}],
    verbosity="low"
)

# High verbosity - detailed responses
response = litellm.completion(
    model="gpt-5.1",
    messages=[{"role": "user", "content": "Explain how neural networks work"}],
    verbosity="high"
)
```
</TabItem>

<TabItem value="proxy" label="PROXY">
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-5.1",
    "messages": [{"role": "user", "content": "Write a function to reverse a string"}],
    "verbosity": "low"
}'
```
</TabItem>
</Tabs>

## OpenAI Chat Completion 到 Responses API 橋接 {#openai-chat-completion-to-responses-api-bridge}

LiteLLM 提供 chat completion 到 Responses API 的橋接。這可讓您在底層呼叫 Responses API 的同時，使用 completion 介面。

當您想使用 [Responses API](https://platform.openai.com/docs/api-reference/responses) 的特定功能（例如內建工具、web search preview，或 code interpreter）時，這會很有用。

:::tip gpt-5.4+ + reasoning_effort + function tools

LiteLLM 會將 `reasoning_effort` 自 `gpt-5.4` 及更新版本（`gpt-5.4`、`gpt-5.5`、未來 5.x 版本）中包含 tools 的請求，降級為 `litellm.completion()`，因為這種組合僅支援於 Responses API。

如果您需要 reasoning **和** tools 同時使用，請改用 responses bridge（當 `tools` 和 `reasoning_effort` 都設定時，LiteLLM 也會自動將這些請求路由到 `/v1/responses`）：

```python
response = litellm.completion(
    model="openai/responses/gpt-5.5",  # routes to /v1/responses
    messages=[{"role": "user", "content": "What's the weather?"}],
    tools=[...],
    reasoning_effort="low",
)
```

:::

### 何時使用 `openai/responses/` 前綴 {#when-to-use-the-openairesponses-prefix}

每個模型都有在 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中定義的 `mode` 屬性，用來決定預設使用哪個 API 端點：

- **`mode: responses`** - 模型會自動使用 Responses API
- **`mode: chat`** - 模型預設使用 Chat Completions API

**具有 `mode: responses` 的模型**（自動使用 Responses API）：
- `o3-deep-research`、`o4-mini-deep-research`
- `o1-pro`、`o3-pro`
- `gpt-5.1-codex`、`gpt-5.1-codex-mini`、`gpt-5.1-codex-max`
- `codex-mini-latest`

**具有 `mode: chat` 的模型**（內建工具需要 `openai/responses/` 前綴）：
- `gpt-4o`、`gpt-4o-mini`、`gpt-4.1`、`gpt-4.1-mini`
- `gpt-5`、`gpt-5-mini`
- `o3`、`o4-mini`

若要在 `mode: chat` 模型中使用像 `web_search_preview` 這類內建工具，請加上 `openai/responses/` 前綴：

```python
# This will FAIL - gpt-4o has mode: chat, uses Chat Completions API
response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is the weather in Paris today?"}],
    tools=[{"type": "web_search_preview"}],  # Not supported in Chat Completions
    # ... other kwargs
)

# This will WORK - prefix forces Responses API
response = litellm.completion(
    model="openai/responses/gpt-4o",
    messages=[{"role": "user", "content": "What is the weather in Paris today?"}],
    tools=[{"type": "web_search_preview"}],  # Supported in Responses API
    # ... other kwargs
)
```

### 範例 {#examples}

<Tabs>
<TabItem value="sdk" label="SDK">

**使用具有 `mode: responses` 的模型（自動）：**

```python
import litellm
import os

os.environ["OPENAI_API_KEY"] = "sk-1234"

response = litellm.completion(
    model="o3-deep-research-2025-06-26",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    tools=[
        {"type": "web_search_preview"},
        {"type": "code_interpreter", "container": {"type": "auto"}},
    ],
)
print(response)
```

**使用具有 `mode: chat` 的模型（需要前綴）：**

```python
import litellm
import os

os.environ["OPENAI_API_KEY"] = "sk-1234"

# Use the openai/responses/ prefix to enable built-in tools
response = litellm.completion(
    model="openai/responses/gpt-4o",
    messages=[{"role": "user", "content": "What is the weather in Paris today?"}],
    tools=[
        {"type": "web_search_preview"},
    ],
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  # Model with mode: responses (automatic)
  - model_name: o3-deep-research
    litellm_params:
      model: o3-deep-research-2025-06-26
      api_key: os.environ/OPENAI_API_KEY

  # Model with mode: chat (use prefix for built-in tools)
  - model_name: gpt-4o-with-tools
    litellm_params:
      model: openai/responses/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-4o-with-tools",
    "messages": [
        {"role": "user", "content": "What is the weather in Paris today?"}
    ],
    "tools": [
        {"type": "web_search_preview"}
    ]
}'
```

</TabItem>
</Tabs>

## OpenAI 音訊轉錄 {#openai-audio-transcription}

LiteLLM 支援 OpenAI Audio Transcription 端點。

支援的模型：

| 模型名稱                | 函式呼叫                                                          |
|---------------------------|-----------------------------------------------------------------|
| `whisper-1`    | `response = completion(model="whisper-1", file=audio_file)`     |
| `gpt-4o-transcribe` | `response = completion(model="gpt-4o-transcribe", file=audio_file)` |
| `gpt-4o-mini-transcribe` | `response = completion(model="gpt-4o-mini-transcribe", file=audio_file)` |

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import transcription
import os 

# set api keys 
os.environ["OPENAI_API_KEY"] = ""
audio_file = open("/path/to/audio.mp3", "rb")

response = transcription(model="gpt-4o-transcribe", file=audio_file)

print(f"response: {response}")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
- model_name: gpt-4o-transcribe
  litellm_params:
    model: gpt-4o-transcribe
    api_key: os.environ/OPENAI_API_KEY
  model_info:
    mode: audio_transcription
    
general_settings:
  master_key: sk-1234
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試它！

```bash
curl --location 'http://0.0.0.0:8000/v1/audio/transcriptions' \
--header 'Authorization: Bearer sk-1234' \
--form 'file=@"/Users/krrishdholakia/Downloads/gettysburg.wav"' \
--form 'model="gpt-4o-transcribe"'
```


</TabItem>
</Tabs>

## 進階 {#advanced}

### 取得 OpenAI API 回應標頭 {#getting-openai-api-response-headers}

設定 `litellm.return_response_headers = True` 以從 OpenAI 取得原始回應標頭

您可以預期會一直從 `litellm.completion()`、`litellm.embedding()` 函式取得 `_response_headers` 欄位

<Tabs>
<TabItem value="litellm.completion" label="litellm.completion">

```python
litellm.return_response_headers = True

# /chat/completion
response = completion(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "user",
            "content": "hi",
        }
    ],
)
print(f"response: {response}")
print("_response_headers=", response._response_headers)
```
</TabItem>

<TabItem value="litellm.completion - streaming" label="litellm.completion + stream">

```python
litellm.return_response_headers = True

# /chat/completion
response = completion(
    model="gpt-4o-mini",
    stream=True,
    messages=[
        {
            "role": "user",
            "content": "hi",
        }
    ],
)
print(f"response: {response}")
print("response_headers=", response._response_headers)
for chunk in response:
    print(chunk)
```
</TabItem>

<TabItem value="litellm.embedding" label="litellm.embedding">

```python
litellm.return_response_headers = True

# embedding
embedding_response = litellm.embedding(
    model="text-embedding-ada-002",
    input="hello",
)

embedding_response_headers = embedding_response._response_headers
print("embedding_response_headers=", embedding_response_headers)
```

</TabItem>
</Tabs>
預期來自 OpenAI 的回應標頭

```json
{
  "date": "Sat, 20 Jul 2024 22:05:23 GMT",
  "content-type": "application/json",
  "transfer-encoding": "chunked",
  "connection": "keep-alive",
  "access-control-allow-origin": "*",
  "openai-model": "text-embedding-ada-002",
  "openai-organization": "*****",
  "openai-processing-ms": "20",
  "openai-version": "2020-10-01",
  "strict-transport-security": "max-age=15552000; includeSubDomains; preload",
  "x-ratelimit-limit-requests": "5000",
  "x-ratelimit-limit-tokens": "5000000",
  "x-ratelimit-remaining-requests": "4999",
  "x-ratelimit-remaining-tokens": "4999999",
  "x-ratelimit-reset-requests": "12ms",
  "x-ratelimit-reset-tokens": "0s",
  "x-request-id": "req_cc37487bfd336358231a17034bcfb4d9",
  "cf-cache-status": "DYNAMIC",
  "set-cookie": "__cf_bm=E_FJY8fdAIMBzBE2RZI2.OkMIO3lf8Hz.ydBQJ9m3q8-1721513123-1.0.1.1-6OK0zXvtd5s9Jgqfz66cU9gzQYpcuh_RLaUZ9dOgxR9Qeq4oJlu.04C09hOTCFn7Hg.k.2tiKLOX24szUE2shw; path=/; expires=Sat, 20-Jul-24 22:35:23 GMT; domain=.api.openai.com; HttpOnly; Secure; SameSite=None, *cfuvid=SDndIImxiO3U0aBcVtoy1TBQqYeQtVDo1L6*Nlpp7EU-1721513123215-0.0.1.1-604800000; path=/; domain=.api.openai.com; HttpOnly; Secure; SameSite=None",
  "x-content-type-options": "nosniff",
  "server": "cloudflare",
  "cf-ray": "8a66409b4f8acee9-SJC",
  "content-encoding": "br",
  "alt-svc": "h3=\":443\"; ma=86400"
}
```

### 平行函式呼叫 {#parallel-function-calling}
請參閱使用 litellm 進行平行函式呼叫的詳細說明 [這裡](https://docs.litellm.ai/docs/completion/function_call)
```python
import litellm
import json
# set openai api key
import os
os.environ['OPENAI_API_KEY'] = "" # litellm reads OPENAI_API_KEY from .env and sends the request
# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
def get_current_weather(location, unit="fahrenheit"):
    """Get the current weather in a given location"""
    if "tokyo" in location.lower():
        return json.dumps({"location": "Tokyo", "temperature": "10", "unit": "celsius"})
    elif "san francisco" in location.lower():
        return json.dumps({"location": "San Francisco", "temperature": "72", "unit": "fahrenheit"})
    elif "paris" in location.lower():
        return json.dumps({"location": "Paris", "temperature": "22", "unit": "celsius"})
    else:
        return json.dumps({"location": location, "temperature": "unknown"})

messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
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

response = litellm.completion(
    model="gpt-3.5-turbo-1106",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
)
print("\nLLM Response1:\n", response)
response_message = response.choices[0].message
tool_calls = response.choices[0].message.tool_calls
```

### 為 completion 呼叫設定 `extra_headers` {#setting-extra_headers-for-completion-calls}
```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
    model = "gpt-3.5-turbo", 
    messages=[{ "content": "Hello, how are you?","role": "user"}],
    extra_headers={"AI-Resource Group": "ishaan-resource"}
)
```

### 為 completion 呼叫設定 Organization-ID {#setting-organization-id-for-completion-calls}
可透過以下其中一種方式設定：
- 環境變數 `OPENAI_ORGANIZATION`
- 傳給 `litellm.completion(model=model, organization="your-organization-id")` 的參數
- 設為 `litellm.organization="your-organization-id"`
```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENAI_ORGANIZATION"] = "your-org-id" # OPTIONAL

response = completion(
    model = "gpt-3.5-turbo", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

### 設定 `ssl_verify=False` {#set-ssl_verifyfalse}

這是透過設定您自己的 `httpx.Client` 來完成

- 對於 `litellm.completion`，設定 `litellm.client_session=httpx.Client(verify=False)`
- 對於 `litellm.acompletion`，設定 `litellm.aclient_session=AsyncClient.Client(verify=False)`
```python
import litellm, httpx

# for completion
litellm.client_session = httpx.Client(verify=False)
response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=messages,
)

# for acompletion
litellm.aclient_session = httpx.AsyncClient(verify=False)
response = litellm.acompletion(
    model="gpt-3.5-turbo",
    messages=messages,
)
```


### 搭配 LiteLLM 使用 OpenAI Proxy {#using-openai-proxy-with-litellm}
```python
import os 
import litellm
from litellm import completion

os.environ["OPENAI_API_KEY"] = ""

# set custom api base to your proxy
# either set .env or litellm.api_base
# os.environ["OPENAI_BASE_URL"] = "https://your_host/v1"
litellm.api_base = "https://your_host/v1"


messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion("openai/your-model-name", messages)
```

如果您需要動態設定 api_base，只要改為在 completions 中傳入即可 - `completions(...,api_base="your-proxy-api-base")`

更多內容請參閱 [設定 API Base/Keys](../set_keys.md)

### 為 Proxy 請求轉送 Org ID {#forwarding-org-id-for-proxy-requests}

使用 `forward_openai_org_id` 參數將 openai Org ID 從用戶端轉送到 OpenAI。

1. 設定 config.yaml

```yaml
model_list:
  - model_name: "gpt-3.5-turbo"
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

general_settings:
    forward_openai_org_id: true # 👈 KEY CHANGE
```

2. 啟動 Proxy

```bash
litellm --config config.yaml --detailed_debug

# RUNNING on http://0.0.0.0:4000
```

3. 發出 OpenAI 呼叫

```python
from openai import OpenAI
client = OpenAI(
    api_key="sk-1234",
    organization="my-special-org",
    base_url="http://0.0.0.0:4000"
)

client.chat.completions.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hello world"}])
```

在記錄中您應該會看到已轉送的 org id

```bash
LiteLLM:DEBUG: utils.py:255 - Request to litellm:
LiteLLM:DEBUG: utils.py:255 - litellm.acompletion(... organization='my-special-org',)
```

## GPT-5 Pro 特殊注意事項 {#gpt-5-pro-special-notes}

GPT-5 Pro 是 OpenAI 最先進的推理模型，具有獨特特性：

- **僅限 Responses API**：GPT-5 Pro 僅可透過 `/v1/responses` 端點使用
- **不支援串流**：不支援串流回應
- **高推理能力**：專為複雜推理任務設計，具備最高 effort 推理
- **上下文視窗**：400,000 個 tokens 輸入，272,000 個 tokens 輸出
- **定價**：每 100 萬 tokens 輸入 $15.00 / 輸出 $120.00（標準），輸入 $7.50 / 輸出 $60.00（批次）
- **工具**：支援 Web Search、File Search、Image Generation、MCP（但不支援 Code Interpreter 或 Computer Use）
- **模態**：僅支援文字與圖片輸入、文字輸出

```python
# GPT-5 Pro usage example
response = completion(
    model="gpt-5-pro", 
    messages=[{"role": "user", "content": "Solve this complex reasoning problem..."}]
)
```

## 影片生成 {#video-generation}

LiteLLM 支援 OpenAI 的影片生成模型，包括 Sora。

如需影片生成的詳細文件，請參閱 [OpenAI Video Generation →](./openai/videos.md)
