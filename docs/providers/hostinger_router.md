---
title: "Hostinger AI Router 搭配 LiteLLM：設定"
sidebar_label: "Hostinger AI Router"
description: "透過 LiteLLM 以 hostinger_router/ 前綴從 Python SDK 或 AI 閘道呼叫 Hostinger AI Router 模型：聊天、串流、Responses 與嵌入。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Hostinger AI Router {#hostinger-ai-router}

<SinceVersion v="1.109.0" />

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Hostinger AI Router 是一個託管的、與 OpenAI 相容的閘道，可存取 OpenAI、Anthropic、Google 與其他模型家族，以 Hostinger 點數計費。 |
| LiteLLM 上的提供者路由 | `hostinger_router/` |
| 提供者文件連結 | [Hostinger AI Router ↗](https://www.hostinger.com/ai-router) |
| Base URL | `https://router.hostinger.com/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#responses-api), [`/messages`](#anthropic-messages-api), [`/embeddings`](#embeddings) |

<br />
<br />

**我們支援所有 Hostinger AI Router 模型，只要在傳送請求時將 `hostinger_router/` 設為前綴。** 路由器自己的模型 ID，例如 `claude-sonnet-5` 或 `gpt-5.2`，放在前綴之後。

## 可用模型 {#available-models}

| 模型 | 模式 |
|-------|------|
| `hostinger_router/claude-sonnet-5` | chat |
| `hostinger_router/gpt-5.2` | chat |
| `hostinger_router/text-embedding-3-small` | embedding |
| `hostinger_router/text-embedding-3-large` | embedding |

LiteLLM 會追蹤上述模型的花費，將一個 Hostinger 點數計為 $0.01。路由器型錄中的任何其他模型也可使用 `hostinger_router/` 前綴，但 LiteLLM 會將其花費記錄為 $0，直到加入價格為止；您可以透過 proxy 上的 `model_info` 自行設定。

每個聊天模型都可在 `/chat/completions`、`/responses` 與 `/messages` 上運作。當 LiteLLM 知道某個模型在路由器上提供 `/v1/responses` 或 `/v1/messages` 時，例如 `gpt-5.2` 在 `/responses` 上或 `claude-sonnet-5` 在 `/messages` 上，它會直接呼叫該路由。對於所有其他模型，LiteLLM 會轉換呼叫，並透過路由器的 `/v1/chat/completions` 傳送。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key
```

在 hPanel 的 AI Router 區段建立 API 金鑰。

您可以用以下方式覆寫 base url：

```
os.environ["HOSTINGER_ROUTER_API_BASE"] = "https://router.hostinger.com/v1"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers keep-model-ids title="Hostinger AI Router Non-streaming Completion"
import os
from litellm import completion

os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key

response = completion(
    model="hostinger_router/claude-sonnet-5",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Hostinger AI Router Streaming Completion"
import os
from litellm import completion

os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key

response = completion(
    model="hostinger_router/gpt-5.2",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### Responses API {#responses-api}

LiteLLM 會將 `gpt-5.2` 的 `/responses` 呼叫傳送至路由器自己的 `/v1/responses` 端點，並透過 `/v1/chat/completions` 轉換其他模型的呼叫。

```python showLineNumbers title="Hostinger AI Router Responses API"
import os
import litellm

os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key

response = litellm.responses(
    model="hostinger_router/gpt-5.2",
    input="Name three primary colors",
)

print(response.output[0].content[0].text)
```

### Anthropic Messages API {#anthropic-messages-api}

LiteLLM 會將 `claude-sonnet-5` 的 `/messages` 呼叫傳送至路由器自己的 `/v1/messages` 端點，並透過 `/v1/chat/completions` 轉換其他模型的呼叫。

```python showLineNumbers keep-model-ids title="Hostinger AI Router Messages API"
import asyncio
import os
import litellm

os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key

async def main():
    response = await litellm.anthropic.messages.acreate(
        model="hostinger_router/claude-sonnet-5",
        messages=[{"role": "user", "content": "Name three primary colors"}],
        max_tokens=200,
    )
    print(response["content"])

asyncio.run(main())
```

### 嵌入 {#embeddings}

```python showLineNumbers title="Hostinger AI Router Embeddings"
import os
import litellm

os.environ["HOSTINGER_ROUTER_API_KEY"] = ""  # your Hostinger AI Router API key

response = litellm.embedding(
    model="hostinger_router/text-embedding-3-small",
    input=["hello from litellm"],
)

print(len(response.data[0]["embedding"]))
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers keep-model-ids title="config.yaml"
model_list:
  - model_name: hostinger-claude
    litellm_params:
      model: hostinger_router/claude-sonnet-5
      api_key: os.environ/HOSTINGER_ROUTER_API_KEY

  - model_name: hostinger-gpt
    litellm_params:
      model: hostinger_router/gpt-5.2
      api_key: os.environ/HOSTINGER_ROUTER_API_KEY

  - model_name: hostinger-embedding
    litellm_params:
      model: hostinger_router/text-embedding-3-small
      api_key: os.environ/HOSTINGER_ROUTER_API_KEY
```

您也可以從 Admin UI 新增這些模型。開啟 Models，點擊 Add Model，將提供者選為 Hostinger Router，並貼上您的 API 金鑰。

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

在另一個終端機中，將 `LITELLM_API_KEY` 設為上方印出的金鑰，然後呼叫 proxy：

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Hostinger AI Router via Proxy - Chat Completions"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "hostinger-claude",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="Hostinger AI Router via Proxy - Responses API"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "hostinger-gpt",
    "input": "hello from litellm"
  }'
```

```bash showLineNumbers title="Hostinger AI Router via Proxy - Messages API"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "hostinger-claude",
    "max_tokens": 200,
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="Hostinger AI Router via Proxy - Embeddings"
curl http://localhost:4000/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "hostinger-embedding",
    "input": ["hello from litellm"]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Hostinger AI Router via Proxy - OpenAI SDK"
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key=os.environ["LITELLM_API_KEY"],
)

response = client.chat.completions.create(
    model="hostinger-claude",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

如需使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。
