import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Fireworks AI {#fireworks-ai}

:::info
**我們支援所有 Fireworks AI 模型，只要在傳送 completion 請求時將 `fireworks_ai/` 設為前綴即可**
:::

:::tip
剛開始使用 LiteLLM 在 Fireworks AI 背後執行？[在 LiteLLM 上開始使用 Fireworks AI](/blog/fireworks-getting-started) 會從空目錄開始，到可運作的請求，然後再新增第二個模型與一個備援。
:::

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | 用於建置可直接投入正式環境的複合式 AI 系統的最快且最有效率的推論引擎。 |
| LiteLLM 上的提供者路由 | `fireworks_ai/` |
| 提供者文件 | [Fireworks AI ↗](https://docs.fireworks.ai/getting-started/introduction) |
| 支援的 OpenAI 端點 | `/chat/completions`, `/responses`, `/embeddings`, `/completions`, `/audio/transcriptions`, `/rerank` |

## 概覽 {#overview}

本指南說明如何將 LiteLLM 與 Fireworks AI 整合。您可以透過三種主要方式連接到 Fireworks AI：

1. <b> 使用 Fireworks AI 無伺服器模型 </b> – 可輕鬆連接到由 Fireworks 管理的模型。
2. <b> 連接到您自己的 Fireworks 帳戶中的模型 </b> – 存取託管於您 Fireworks 帳戶內的模型。
3. <b> 透過直接路由部署連接 </b> – 以更彈性、可自訂的方式連接到特定 Fireworks 執行個體。

## API 金鑰 {#api-key}
```python
# env variable
os.environ['FIREWORKS_AI_API_KEY']
```

## 範例用法 - 無伺服器模型 {#sample-usage---serverless-models}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/glm-5p3-flash", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

像 `glm-5p3-flash` 這樣的原始無伺服器 slug，會自動為您展開為 `accounts/fireworks/models/glm-5p3-flash`，因此您可以傳入短 slug 或完整資源 ID。

## 範例用法 - 無伺服器模型 - 串流 {#sample-usage---serverless-models---streaming}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/glm-5p3-flash", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 範例用法 - 您自己的 Fireworks 帳戶中的模型  {#sample-usage----models-in-your-own-fireworks-account}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/accounts/fireworks/models/YOUR_MODEL_ID", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 直接路由部署 {#sample-usage---direct-route-deployment}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = "YOUR_DIRECT_API_KEY"
response = completion(
    model="fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash#accounts/gitlab/deployments/2fb7764c", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
   api_base="https://gitlab-2fb7764c.direct.fireworks.ai/v1"
)
print(response)
```

> **注意：** 上述內容是針對聊天介面；如果您想使用文字完成介面，則是 model="text-completion-openai/accounts/fireworks/models/deepseek-v4p1-flash#accounts/gitlab/deployments/2fb7764c"

## 範例用法 - 路由器 {#sample-usage---routers}

Fireworks 路由器的提供位置是 `accounts/fireworks/routers/<router-id>`，而不是 `accounts/fireworks/models/<model-id>`，因此單靠原始 slug 無法讓 LiteLLM 知道您的意思。請在 slug 前加上 `routers/` 以前往路由器；LiteLLM 會將 `routers/<id>` 展開為 `accounts/fireworks/routers/<id>`。請參閱 [Fireworks 路由器文件](https://docs.fireworks.ai/deployments/routers)，以查看您帳戶可用的路由器。

```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/routers/glm-latest",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

如果您偏好明確指定，也仍可接受完整資源路徑（`fireworks_ai/accounts/fireworks/routers/glm-latest`）。結尾為 `-fast` 的 slug（例如 `fireworks_ai/glm-5p3-fast`）會被視為路由器，即使沒有 `routers/` 前綴也是如此。

## FireRouter 與 open-model 路由器 {#firerouter-and-open-model-routers}

[FireRouter](https://docs.fireworks.ai/nexus/firerouter) 是 Fireworks 的代管路由器。路由器 ID 不會指向單一模型，而是會為每次使用者回合挑選一個模型。Fireworks 會在 `accounts/fireworks/routers/<id>` 下提供路由器，而 LiteLLM 接受短 ID 或完整資源路徑：

| 路由器 ID | 路由範圍 | LiteLLM 模型 |
| - | - | - |
| `auto` | 由 Fireworks 挑選的 Fireworks open models | `fireworks_ai/auto` |
| `auto-instant` | 為最低延遲而調校的 Fireworks open models | `fireworks_ai/auto-instant` |
| `firerouter` | Claude Opus 或 GPT，加上 Fireworks open-model 混合 | `fireworks_ai/firerouter` |
| `firerouter/<models>` | 僅限您列出的模型，例如 `firerouter/opus` 或 `firerouter/kimi-k3/glm-5p3` | `fireworks_ai/firerouter/kimi-k3/glm-5p3` |
| 上述任一項 | 相同路由器，完整寫出 | `fireworks_ai/accounts/fireworks/routers/<id>` |

`auto` 和 `auto-instant` 只使用 Fireworks open models，因此您的 Fireworks API 金鑰是它們唯一需要的憑證。`firerouter/auto` 和 `firerouter/auto-instant` 的運作方式也相同。請參閱 [範例路由器 ID](https://docs.fireworks.ai/nexus/firerouter#example-router-ids) 以取得更多路由

完整資源路徑可在每個 LiteLLM 版本上使用。短版 `firerouter` ID 需要 v1.104.0-rc.1 或更新版本，而短版 `auto` 和 `auto-instant` ID 需要 v1.105.0 或更新版本。在較舊版本中，短 ID 會以模型路徑傳送，而 Fireworks 會回傳 404，因此請在那裡使用完整路徑

```yaml
model_list:
  - model_name: auto
    litellm_params:
      model: fireworks_ai/accounts/fireworks/routers/auto
      api_key: os.environ/FIREWORKS_AI_API_KEY
  - model_name: firerouter
    litellm_params:
      model: fireworks_ai/accounts/fireworks/routers/firerouter
      api_key: os.environ/FIREWORKS_AI_API_KEY
```

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "hello"}]}'
```

### 哪個模型處理了這個請求 {#which-model-served-the-request}

proxy 會在回應 `model` 欄位中回傳您設定的 `model_name`，例如 `auto`。在 SDK 上，非串流的 `completion()` 會在 `response.model` 中回報已提供服務的模型，例如 `fireworks_ai/glm-5p3-flash`。串流回應會在 `model` 中保留請求的路由器 ID，並將已提供服務的模型放在 `response._hidden_params["provider_response_model"]` 中

### 關閉模型憑證 {#closed-model-credentials}

Fireworks 不會轉售關閉模型。當 `firerouter` 路由包含 Claude 或 GPT 時，Fireworks 會使用您自己的帳戶代表您呼叫該提供者，並使用儲存在您 Fireworks 帳戶上的 [Provider Keys](https://docs.fireworks.ai/nexus/provider-keys) 或請求上的 `x-anthropic-api-key` 或 `x-openai-api-key` 標頭。標頭的優先順序高於已儲存的 Provider Key

如果沒有可用於關閉模型的憑證，FireRouter 會將它排除，並以路由中的其他模型提供該回合服務。舉例來說，沒有 Anthropic 憑證的 `firerouter/opus` 會由 Fireworks open models 提供服務。當您傳送 `x-routing-preference: 1` 時，您會改收到 `400 no_credential`，這會強制使用該路由的關閉主模型；或者當您直接呼叫關閉模型 ID 時，也會是如此

若要從 LiteLLM 傳送標頭，請使用 `litellm_params.extra_headers` 將其設定在部署上，或透過全域啟用 `forward_client_headers_to_llm_api`，或在每個模型群組上啟用，讓每個用戶端自行傳送

```yaml
model_list:
  - model_name: firerouter
    litellm_params:
      model: fireworks_ai/accounts/fireworks/routers/firerouter
      api_key: os.environ/FIREWORKS_AI_API_KEY
      extra_headers:
        x-anthropic-api-key: os.environ/ANTHROPIC_API_KEY
```

```yaml
general_settings:
  forward_client_headers_to_llm_api: true
# or per model group:
# model_group_settings:
#   forward_client_headers_to_llm_api: [firerouter]
```

相同的標頭會透過 `completion()` 上的 SDK 傳遞：

```python
from litellm import completion

response = completion(
    model="fireworks_ai/firerouter",
    messages=[{"role": "user", "content": "hello"}],
    extra_headers={"x-anthropic-api-key": "sk-ant-..."},
)
```

### 路由偏好設定 {#routing-preference}

`x-routing-preference` 設定 `firerouter` 請求有多強烈地偏好其主模型或較便宜的模型，從 `1`（最高智能）到 `5`（最高節省）。預設值是 `3`。請參閱 [Routing Preferences](https://docs.fireworks.ai/nexus/routing-preferences)。其傳遞方式與憑證標頭相同：在部署上使用 `litellm_params.extra_headers`、在 `forward_client_headers_to_llm_api` 開啟時由用戶端提供，或在 `completion()` 上使用 `extra_headers`

### 成本追蹤 {#cost-tracking}

LiteLLM 會根據 Fireworks 回報其路由到的模型來為每個請求定價，因此路由器本身沒有自己的價格。Fireworks 代管的模型會以 Fireworks 的費率計費，而關閉模型（例如 Claude 回合）則會以該提供者自己的標價計費。費用會分別列在兩份供應商帳單上，open models 計入 Fireworks，關閉模型則計入 Anthropic 或 OpenAI，但 LiteLLM 的支出記錄與預算會將它們全部加總到同一個模型群組下

## 搭配 LiteLLM Proxy 使用  {#usage-with-litellm-proxy}

### 1. 在 config.yaml 中設定 Fireworks AI 模型 {#1-set-fireworks-ai-models-on-configyaml}

```yaml
model_list:
  - model_name: fireworks-glm-5p3
    litellm_params:
      model: fireworks_ai/glm-5p3-flash
      api_key: "os.environ/FIREWORKS_AI_API_KEY"
```

### 2. 啟動 Proxy  {#2-start-proxy}

```
litellm --config config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "fireworks-glm-5p3",
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
response = client.chat.completions.create(model="fireworks-glm-5p3", messages = [
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
    model = "fireworks-glm-5p3",
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

## Responses API {#responses-api}

`fireworks_ai/` 在 `/v1/responses` 上的模型會直接送往 Fireworks 的原生 `https://api.fireworks.ai/inference/v1/responses` 端點，因此 MCP 工具（`"type": "mcp"`）、`previous_response_id`，以及 reasoning output items 等伺服器端功能，運作方式都與直接對 Fireworks 使用時相同

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import responses

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"

response = responses(
    model="fireworks_ai/accounts/fireworks/models/kimi-k3",
    input="Use the deepwiki MCP server to tell me in one sentence what the BerriAI/litellm repository is.",
    tools=[
        {
            "type": "mcp",
            "server_label": "deepwiki",
            "server_url": "https://mcp.deepwiki.com/mcp",
            "require_approval": "never",
        }
    ],
)
print(response.output)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: fireworks-kimi-k3
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/kimi-k3
      api_key: "os.environ/FIREWORKS_AI_API_KEY"
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "fireworks-kimi-k3",
    "input": "Use the deepwiki MCP server to tell me in one sentence what the BerriAI/litellm repository is.",
    "tools": [
      {
        "type": "mcp",
        "server_label": "deepwiki",
        "server_url": "https://mcp.deepwiki.com/mcp",
        "require_approval": "never"
      }
    ]
  }'
```

</TabItem>
</Tabs>

多回合工具呼叫的運作方式與直接對 Fireworks 使用時相同：將 `function_call_output` items 與 Fireworks 回傳的 `previous_response_id` 一併送回，Fireworks 就會在伺服器端繼續對話

`developer` input items 會以 `system` messages 的形式送往 Fireworks，因為 Fireworks 的 Responses API 在 kimi-k3 和 qwen3.8 等模型上沒有 developer role。其 chat template 需要 system message 先出現的模型（qwen3.8）仍會拒絕放在第一個 input item 之後的 developer item，和直接呼叫時的行為相同

## 文件內嵌  {#document-inlining}

LiteLLM 支援 Fireworks AI 模型的文件內嵌。這對於不是視覺模型、但仍需要解析文件/圖片等內容的模型很有用。

如果模型不是視覺模型，LiteLLM 會將 `#transform=inline` 加到 image_url 的網址中。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/1ae9d45798bdaf8450f2dfdec703369f3d2212b7/litellm/llms/fireworks_ai/chat/transformation.py#L114)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"
os.environ["FIREWORKS_AI_API_BASE"] = "https://audio-prod.api.fireworks.ai/v1"

completion = litellm.completion(
    model="fireworks_ai/accounts/fireworks/models/llama-v3p3-70b-instruct",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://storage.googleapis.com/fireworks-public/test/sample_resume.pdf"
                    },
                },
                {
                    "type": "text",
                    "text": "What are the candidate's BA and MBA GPAs?",
                },
            ],
        }
    ],
)
print(completion)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: llama-v3p3-70b-instruct
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/llama-v3p3-70b-instruct
      api_key: os.environ/FIREWORKS_AI_API_KEY
    #   api_base: os.environ/FIREWORKS_AI_API_BASE [OPTIONAL], defaults to "https://api.fireworks.ai/inference/v1"
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_API_KEY' \
-d '{"model": "llama-v3p3-70b-instruct", 
    "messages": [        
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://storage.googleapis.com/fireworks-public/test/sample_resume.pdf"
                    },
                },
                {
                    "type": "text",
                    "text": "What are the candidate's BA and MBA GPAs?",
                },
            ],
        }
    ]}'
```

</TabItem>
</Tabs>

### 停用自動新增 {#disable-auto-add}

如果您想停用將 `#transform=inline` 自動新增到 image_url 的網址，請將 `disable_add_transform_inline_image_block` 設為 `True`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
litellm.disable_add_transform_inline_image_block = True
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
    disable_add_transform_inline_image_block: true
```

</TabItem>
</Tabs>

## 推理努力 {#reasoning-effort}

`reasoning_effort` 參數支援於部分 Fireworks AI 模型。支援的模型包括：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"

response = completion(
    model="fireworks_ai/accounts/fireworks/models/qwen3-8b",
    messages=[
        {"role": "user", "content": "What is the capital of France?"}
    ],
    reasoning_effort="low",
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "fireworks_ai/accounts/fireworks/models/qwen3-8b",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

## 支援的模型 - 支援所有 Fireworks AI 模型！ {#supported-models---all-fireworks-ai-models-supported}

:::info
我們支援所有 Fireworks AI 模型，只要在傳送 completion 請求時將 `fireworks_ai/` 設為前綴即可
:::

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| glm-5p3-flash | `completion(model="fireworks_ai/glm-5p3-flash", messages)` |
| deepseek-v4-pro | `completion(model="fireworks_ai/deepseek-v4-pro", messages)` |
| kimi-k3 | `completion(model="fireworks_ai/kimi-k3", messages)` |
| qwen3p8-max | `completion(model="fireworks_ai/qwen3p8-max", messages)` |
| minimax-m3 | `completion(model="fireworks_ai/minimax-m3", messages)` |
| gpt-oss-120b | `completion(model="fireworks_ai/gpt-oss-120b", messages)` |

上表僅列出少數常見模型。完整且最新的模型與路由器清單，請參閱 [Fireworks 模型程式庫](https://fireworks.ai/models)。

## 支援的嵌入模型 {#supported-embedding-models}

:::info
我們支援所有 Fireworks AI 模型，只要在傳送 embedding 請求時將 `fireworks_ai/` 設為前綴即可
:::

| 模型名稱            | 函式呼叫                                                   |
|-----------------------|-----------------------------------------------------------------|
| fireworks_ai/nomic-ai/nomic-embed-text-v1.5 | `response = litellm.embedding(model="fireworks_ai/nomic-ai/nomic-embed-text-v1.5", input=input_text)` |
| fireworks_ai/nomic-ai/nomic-embed-text-v1 | `response = litellm.embedding(model="fireworks_ai/nomic-ai/nomic-embed-text-v1", input=input_text)` |
| fireworks_ai/WhereIsAI/UAE-Large-V1 | `response = litellm.embedding(model="fireworks_ai/WhereIsAI/UAE-Large-V1", input=input_text)` |
| fireworks_ai/thenlper/gte-large | `response = litellm.embedding(model="fireworks_ai/thenlper/gte-large", input=input_text)` |
| fireworks_ai/thenlper/gte-base | `response = litellm.embedding(model="fireworks_ai/thenlper/gte-base", input=input_text)` |

## 音訊轉錄 {#audio-transcription}

### 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import transcription
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"
os.environ["FIREWORKS_API_BASE"] = "https://audio-prod.api.fireworks.ai/v1"

audio_file = open("/path/to/audio.wav", "rb")

response = transcription(
    model="fireworks_ai/whisper-v3",
    file=audio_file,
)
```

[在 `.transcription` 中傳入 API 金鑰/API Base](../set_keys.md#passing-args-to-completion-or-any-litellm-endpoint---transcription-embedding-text_completion-etc)

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: whisper-v3
    litellm_params:
      model: fireworks_ai/whisper-v3
      api_base: https://audio-prod.api.fireworks.ai/v1
      api_key: os.environ/FIREWORKS_API_KEY
    model_info:
      mode: audio_transcription
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/audio/transcriptions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-F 'file=@"/Users/krrishdholakia/Downloads/gettysburg.wav"' \
-F 'model="whisper-v3"' \
-F 'response_format="verbose_json"' \
```

</TabItem>
</Tabs>

## 重新排序 {#rerank}

### 快速開始 {#quick-start-1}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"

query = "What is the capital of France?"
documents = [
    "Paris is the capital and largest city of France, home to the Eiffel Tower and the Louvre Museum.",
    "France is a country in Western Europe known for its wine, cuisine, and rich history.",
    "The weather in Europe varies significantly between northern and southern regions.",
    "Python is a popular programming language used for web development and data science.",
]

response = rerank(
    model="fireworks_ai/fireworks/qwen3-reranker-8b",
    query=query,
    documents=documents,
    top_n=3,
    return_documents=True,
)
print(response)
```

[在 `.rerank` 中傳入 API 金鑰/API Base](../set_keys.md#passing-args-to-completion-or-any-litellm-endpoint---transcription-embedding-text_completion-etc)

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: qwen3-reranker-8b
    litellm_params:
      model: fireworks_ai/fireworks/qwen3-reranker-8b
      api_key: os.environ/FIREWORKS_API_KEY
    model_info:
      mode: rerank
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-reranker-8b",
    "query": "What is the capital of France?",
    "documents": [
        "Paris is the capital and largest city of France, home to the Eiffel Tower and the Louvre Museum.",
        "France is a country in Western Europe known for its wine, cuisine, and rich history.",
        "The weather in Europe varies significantly between northern and southern regions.",
        "Python is a popular programming language used for web development and data science."
    ],
    "top_n": 3,
    "return_documents": true
  }'
```

</TabItem>
</Tabs>

### 支援的模型 {#supported-models}

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| fireworks/qwen3-reranker-8b | `rerank(model="fireworks_ai/fireworks/qwen3-reranker-8b", query=query, documents=documents)` |
