---
title: "透過 LiteLLM 使用 Azure AI Foundry (AI Studio) API"
sidebar_label: "Azure AI"
description: "從 Python SDK 或 AI 閘道呼叫 Azure AI Foundry（原 AI Studio）上的 Command R、Mistral Large、Jamba 與 Claude，支援工具呼叫與 rerank。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure AI Studio {#azure-ai-studio}

LiteLLM 支援 Azure AI Studio 上的所有模型

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### 環境變數 {#env-var}
```python
import os 
os.environ["AZURE_AI_API_KEY"] = ""
os.environ["AZURE_AI_API_BASE"] = ""
```

### 範例呼叫 {#example-call}

```python
from litellm import completion
import os
## set ENV variables
os.environ["AZURE_AI_API_KEY"] = "azure ai key"
os.environ["AZURE_AI_API_BASE"] = "azure ai base url" # e.g.: https://Mistral-large-dfgfj-serverless.eastus2.inference.ai.azure.com/

# predibase llama-3 call
response = completion(
    model="azure_ai/command-r-plus", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型加入您的 config.yaml

  ```yaml
  model_list:
    - model_name: command-r-plus
      litellm_params:
        model: azure_ai/command-r-plus
        api_key: os.environ/AZURE_AI_API_KEY
        api_base: os.environ/AZURE_AI_API_BASE
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --debug
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-<your-litellm-api-key>",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="command-r-plus",
      messages = [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
    ]
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
      "model": "command-r-plus",
      "messages": [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
        ],
  }'
  ```
  </TabItem>

  </Tabs>

</TabItem>

</Tabs>

## Foundry 專案與 `/openai/v1` 端點 {#foundry-project-and-openaiv1-endpoints}

<SinceVersion v="1.112.0" />

`api_base` 可以指向 Foundry 資源、其 `/openai/v1` 端點，或 Foundry 專案。LiteLLM 會依 `api_base` 的形式選擇聊天路由。

| `api_base` | 聊天路由 |
|---|---|
| `https://<resource>.services.ai.azure.com` | `/models/chat/completions` |
| `https://<resource>.services.ai.azure.com/openai/v1` | `/openai/v1/chat/completions` |
| `https://<resource>.services.ai.azure.com/api/projects/<project>` | `/api/projects/<project>/openai/v1/chat/completions` |

在專案端點上，LiteLLM 不會傳送 `api-version`，因為該路由會拒絕所有值。它會以 `Authorization: Bearer` 傳送金鑰，因此 `api_key` 可以存放 API 金鑰或 Microsoft Entra 權杖。服務主體會取得適用範圍為 `https://ai.azure.com/.default` 的權杖，除非 `azure_scope` 或 `AZURE_SCOPE` 設定了其他範圍。位於專案前方的閘道也可以運作，只要其路徑終止於 `/api/projects/<project>`，或繼續接上 `/openai`、`/models` 或 `/v1`。LiteLLM 會保留閘道的查詢參數，例如 `subscription-key`，僅移除 `api-version`。

在資源的 `/openai/v1` 端點上，LiteLLM 會以 `api-key` 標頭傳送金鑰，並透傳您設定的任何 `api_version`，例如 `preview`。

像 `azure_ai/gpt-4.1` 這類 OpenAI 模型，若使用 `<resource>.openai.azure.com/openai/v1` 或 `<resource>.cognitiveservices.azure.com/openai/v1` 基底，會經由 [Azure OpenAI](./azure/azure.md) 提供者處理，其花費會記錄在 `azure` 項目下。

在任何 Azure OpenAI `/openai/v1` 基底上，未設定 `api_version` 的項目會使用 Azure OpenAI v1 API 進行聊天、嵌入與圖片產生，即使 `AZURE_API_VERSION` 存放了帶日期的版本也一樣。

```yaml
model_list:
  - model_name: gpt-4.1
    litellm_params:
      model: azure_ai/gpt-4.1
      api_base: https://my-resource.services.ai.azure.com/api/projects/my-project
      api_key: os.environ/AZURE_AI_API_KEY
```

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model": "gpt-4.1", "messages": [{"role": "user", "content": "What is 2+2? Answer in one word."}]}'
```

LiteLLM 會將請求傳送至 `https://my-resource.services.ai.azure.com/api/projects/my-project/openai/v1/chat/completions`，且回應的訊息內容為 `Four`。同一個項目也提供 `/v1/responses` 與 `/v1/messages`。

## 傳遞額外參數 - max_tokens, temperature  {#passing-additional-params---max_tokens-temperature}
請參閱所有 litellm.completion 支援的參數 [這裡](../completion/input.md#translated-openai-params)

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["AZURE_AI_API_KEY"] = "azure ai api key"
os.environ["AZURE_AI_API_BASE"] = "azure ai api base"

# command r plus call
response = completion(
    model="azure_ai/command-r-plus", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    max_tokens=20,
    temperature=0.5
)
```

**代理**

```yaml
  model_list:
    - model_name: command-r-plus
      litellm_params:
        model: azure_ai/command-r-plus
        api_key: os.environ/AZURE_AI_API_KEY
        api_base: os.environ/AZURE_AI_API_BASE
        max_tokens: 20
        temperature: 0.5
```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-<your-litellm-api-key>",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="mistral",
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
      "model": "mistral",
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

## 函式呼叫 {#function-calling}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

# set env
os.environ["AZURE_AI_API_KEY"] = "your-api-key"
os.environ["AZURE_AI_API_BASE"] = "your-api-base"

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
    model="azure_ai/mistral-large-latest",
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

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $YOUR_API_KEY" \
-d '{
  "model": "mistral",
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

## 支援的模型 {#supported-models}

LiteLLM 支援 **所有** azure ai 模型。以下是幾個範例：

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Cohere command-r-plus | `completion(model="azure_ai/command-r-plus", messages)` | 
| Cohere command-r | `completion(model="azure_ai/command-r", messages)` | 
| mistral-large-latest | `completion(model="azure_ai/mistral-large-latest", messages)` | 
| AI21-Jamba-Instruct | `completion(model="azure_ai/ai21-jamba-instruct", messages)` | 

## 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

`azure_ai/<family>-latest` 這類名稱會隨著 LiteLLM 將某個模型系列移往較新的模型而跟著調整，因此您的應用程式只需保留同一個模型字串。您可以像使用任何其他 Azure AI Foundry 模型名稱一樣使用它們。LiteLLM 會將目前的目標模型傳送給 Azure AI Foundry，並以該模型的價格計費。別名的運作方式與各提供者的完整清單，請參閱[最新模型別名](../model_latest_aliases.md)。

| 別名 | 模型系列 |
| --- | --- |
| `azure_ai/gpt-luna-latest` | GPT Luna |
| `azure_ai/gpt-sol-latest` | GPT Sol |
| `azure_ai/gpt-terra-latest` | GPT Terra |
| `azure_ai/gpt-astra-latest` | GPT Astra |
| `azure_ai/gpt-mini-latest` | GPT Mini |
| `azure_ai/claude-opus-latest` | Claude Opus |
| `azure_ai/claude-sonnet-latest` | Claude Sonnet |
| `azure_ai/claude-haiku-latest` | Claude Haiku |
| `azure_ai/claude-fable-latest` | Claude Fable |
| `azure_ai/grok-latest` | Grok |
| `azure_ai/kimi-latest` | Kimi |
| `azure_ai/glm-latest` | GLM |
| `azure_ai/glm-flash-latest` | GLM Flash |
| `azure_ai/deepseek-pro-latest` | DeepSeek Pro |
| `azure_ai/deepseek-flash-latest` | DeepSeek Flash |
| `azure_ai/minimax-latest` | MiniMax |

## 使用方式 - Azure Anthropic (Azure Foundry Claude) {#usage---azure-anthropic-azure-foundry-claude}

LiteLLM 透過 `azure_ai/` 提供者轉送 Azure Claude 部署，因此 Azure Foundry 上的 Claude Opus 模型可繼續支援 Tool Search、Effort、串流，以及其餘進階功能集。將 `AZURE_AI_API_BASE` 指向 `https://<resource>.services.ai.azure.com/anthropic`（LiteLLM 會自動附加 `/v1/messages`），並使用 `AZURE_AI_API_KEY` 或 Azure AD 權杖進行驗證。

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import os
from litellm import completion

# Configure Azure credentials
os.environ["AZURE_AI_API_KEY"] = "your-azure-ai-api-key"
os.environ["AZURE_AI_API_BASE"] = "https://my-resource.services.ai.azure.com/anthropic"

response = completion(
    model="azure_ai/{{anthropic_large}}",
    messages=[{"role": "user", "content": "Explain how Azure Anthropic hosts Claude Opus differently from the public Anthropic API."}],
    max_tokens=1200,
    temperature=0.7,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定環境變數**

```bash
export AZURE_AI_API_KEY="your-azure-ai-api-key"
export AZURE_AI_API_BASE="https://my-resource.services.ai.azure.com/anthropic"
```

**2. 設定 proxy**

```yaml
model_list:
  - model_name: claude-4-azure
    litellm_params:
      model: azure_ai/{{anthropic_large}}
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
```

**3. 啟動 LiteLLM**

```bash
litellm --config /path/to/config.yaml
```

**4. 測試 Azure Claude 路由**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer $LITELLM_KEY' \
  --data '{
    "model": "claude-4-azure",
    "messages": [
      {
        "role": "user",
        "content": "How do I use Claude Opus 4 via Azure Anthropic in LiteLLM?"
      }
    ],
    "max_tokens": 1024
  }'
```

</TabItem>
</Tabs>

## Rerank 端點 {#rerank-endpoint}

### 使用方式 {#usage-1}

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK Usage">

```python
from litellm import rerank
import os

os.environ["AZURE_AI_API_KEY"] = "sk-.."
os.environ["AZURE_AI_API_BASE"] = "https://.."

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="azure_ai/cohere-rerank-v3.5",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```
</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy Usage">

LiteLLM 提供與 cohere api 相容的 `/rerank` 端點，供 Rerank 呼叫使用。

**設定**

將以下內容加入您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: Salesforce/Llama-Rank-V1
    litellm_params:
      model: together_ai/Salesforce/Llama-Rank-V1
      api_key: os.environ/TOGETHERAI_API_KEY
  - model_name: cohere-rerank-v3.5
    litellm_params:
      model: azure_ai/cohere-rerank-v3.5
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

測試請求

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cohere-rerank-v3.5",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3
  }'
```

</TabItem>
</Tabs>
