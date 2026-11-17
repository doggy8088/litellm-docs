---
title: "搭配 LiteLLM 使用 ZeroGPU API：Python SDK 與閘道"
sidebar_label: "ZeroGPU"
description: "使用 gpt-oss-120b、GLM-5.3 Flash、Llama 3.1 與其他 ZeroGPU 模型，支援串流、工具呼叫、推理強度、Messages 支援與成本追蹤。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ZeroGPU {#zerogpu}

<SinceVersion v="1.109.0" />

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | ZeroGPU 是 AI 推論的運算效率層。它透過一個與 OpenAI 相容的 API，在邊緣驅動的網路上以專門的小型與奈米語言模型執行大量任務，例如文字生成、分類、擷取、審核、嵌入與音訊 |
| LiteLLM 上的提供者路由 | `zerogpu/` |
| 提供者文件連結 | [ZeroGPU 文件](https://docs.zerogpu.ai) |
| 預設 Base URL | `https://api.zerogpu.ai/v1` |
| 支援的操作 | `/chat/completions` 與 `/responses`，外加透過 LiteLLM 轉接器的 `/messages` |

LiteLLM 的 `zerogpu/` 路由涵蓋下列 ZeroGPU 文字生成模型。ZeroGPU 在 LiteLLM 上是它自己的提供者，而不是通用的 OpenAI 相容路由，因此其支出以 `zerogpu/` 成本對照表條目計價，並在提供者 `zerogpu` 底下回報。

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["ZEROGPU_API_KEY"] = "your-api-key"
os.environ["ZEROGPU_API_BASE"] = "https://api.zerogpu.ai/v1"  # optional override
```

## 模型 {#models}

| 模型 | 上下文視窗 | 輸入 / 100 萬個 token | 輸出 / 100 萬個 token | 快取讀取 / 100 萬個 token |
|-------|----------------|-------------------|--------------------|------------------------|
| `zerogpu/deepseek-v4.1-flash` | 1,048,576 | $0.30 | $1.20 | $0.003 |
| `zerogpu/glm-5.3-flash` | 1,048,576 | $0.10 | $0.35 | $0.015 |
| `zerogpu/gpt-4.1-mini` | 1,047,576 | $0.40 | $1.60 | $0.10 |
| `zerogpu/gpt-5.4-nano` | 272,000 | $0.20 | $1.25 | $0.02 |
| `zerogpu/gpt-5.6-luna` | 272,000 | $0.20 | $1.20 | $0.20 |
| `zerogpu/gpt-6-luna` | 272,000 | $0.10 | $0.50 | $0.01 |
| `zerogpu/gpt-oss-120b` | 128,000 | $0.15 | $0.60 | $0.03 |
| `zerogpu/LFM2.5-1.2B-Instruct` | 32,768 | $0.02 | $0.05 | n/a |
| `zerogpu/LFM2.5-1.2B-Thinking` | 32,768 | $0.02 | $0.05 | n/a |
| `zerogpu/llama-3.1-8b-instruct-fast` | 131,072 | $0.15 | $0.28 | $0.025 |
| `zerogpu/llama-3.2-3b-instruct-fast` | 131,072 | $0.05 | $0.30 | $0.025 |
| `zerogpu/qwen3-30b-a3b-fp8` | 32,768 | $0.10 | $0.45 | $0.05 |
| `zerogpu/qwen3.6-35b-a3b` | 262,144 | $0.20 | $1.50 | $0.20 |

定價依 [ZeroGPU 模型型錄](https://docs.zerogpu.ai/docs/model-catalog)。`deepseek-v4.1-flash`、`glm-5.3-flash`、`gpt-4.1-mini`、`gpt-5.4-nano`、`gpt-5.6-luna`、`gpt-6-luna`、`gpt-oss-120b`、`llama-3.1-8b-instruct-fast`、`qwen3-30b-a3b-fp8` 與 `qwen3.6-35b-a3b` 支援 `tools`、`tool_choice` 與 `json_schema` 的 `response_format`。推理模型為 `deepseek-v4.1-flash`、`glm-5.3-flash`、`gpt-5.4-nano`、`gpt-5.6-luna`、`gpt-6-luna`、`gpt-oss-120b`、`qwen3-30b-a3b-fp8` 與 `qwen3.6-35b-a3b`。

## 使用方式：LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completions}

```python showLineNumbers title="ZeroGPU Chat Completion"
import os
from litellm import completion

os.environ["ZEROGPU_API_KEY"] = "your-api-key"

response = completion(
    model="zerogpu/gpt-oss-120b",
    messages=[{"role": "user", "content": "Write a python function that reverses a string"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="ZeroGPU Streaming Chat Completion"
import os
from litellm import completion

os.environ["ZEROGPU_API_KEY"] = "your-api-key"

response = completion(
    model="zerogpu/gpt-oss-120b",
    messages=[{"role": "user", "content": "Explain a binary search in two sentences"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 工具呼叫 {#tool-calling}

```python showLineNumbers title="ZeroGPU Tool Calling"
import os
from litellm import completion

os.environ["ZEROGPU_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string", "description": "City name"}},
                "required": ["city"],
            },
        },
    }
]

response = completion(
    model="zerogpu/gpt-oss-120b",
    messages=[{"role": "user", "content": "What is the weather in Paris?"}],
    tools=tools,
    tool_choice="auto",
)

print(response.choices[0].message.tool_calls)
```

### 推理強度 {#reasoning-effort}

LiteLLM 只會將 `reasoning_effort` 轉送給在成本對照表中標示為 `supports_reasoning` 的 ZeroGPU 模型，也就是上面列出的推理模型。其餘模型 `gpt-4.1-mini`、`llama-3.1-8b-instruct-fast`、`llama-3.2-3b-instruct-fast`、`LFM2.5-1.2B-Instruct` 與 `LFM2.5-1.2B-Thinking` 會拒絕它，因此當同一個呼叫可能抵達這些模型時，請傳入 `drop_params=True`，LiteLLM 會為它們捨棄該參數，而不是拒絕請求。

```python showLineNumbers title="ZeroGPU Reasoning Effort" keep-model-ids
import os
from litellm import completion

os.environ["ZEROGPU_API_KEY"] = "your-api-key"

response = completion(
    model="zerogpu/gpt-5.6-luna",
    messages=[{"role": "user", "content": "How many prime numbers are there below 100?"}],
    reasoning_effort="high",
    drop_params=True,
)

print(response.choices[0].message.content)
```

## 使用方式：LiteLLM Proxy {#usage---litellm-proxy}

將 ZeroGPU 加入您的 LiteLLM Proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-oss-120b
    litellm_params:
      model: zerogpu/gpt-oss-120b
      api_key: os.environ/ZEROGPU_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export ZEROGPU_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-zerogpu"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="ZeroGPU via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-zerogpu",
)

response = client.chat.completions.create(
    model="gpt-oss-120b",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="ZeroGPU via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "gpt-oss-120b",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

您也可以從 Admin UI 新增 ZeroGPU。前往 Models，再按 Add Model，將提供者選為 ZeroGPU，選擇其中一個 `zerogpu/` 模型，並貼上您的金鑰。API Base 欄位是選填的，預設為 `https://api.zerogpu.ai/v1`。

## Anthropic Messages 與 Responses 相容性 {#anthropic-messages-and-responses-compatibility}

LiteLLM 會將 Anthropic Messages 形式的請求轉換為 ZeroGPU 聊天補全，無論是透過 SDK facade 或 proxy 的 `/v1/messages` 端點皆然：

```bash showLineNumbers title="Anthropic Messages through LiteLLM Proxy"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "gpt-oss-120b",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

`litellm.responses()` 與 proxy 的 `/v1/responses` 端點會原生呼叫 ZeroGPU 自己的 `/responses` 端點，而不是透過聊天補全橋接，因此不需要額外設定。

## 成本追蹤 {#cost-tracking}

`zerogpu/` 模型已註冊在 LiteLLM 的模型成本對照表中，因此每個請求的支出會自動計算，在 `x-litellm-response-cost` 回應標頭中傳回，並記錄在提供者 `zerogpu` 底下的支出記錄中。當 ZeroGPU 在 `prompt_tokens_details.cached_tokens` 中回報快取的提示 token 時，LiteLLM 會以表中的快取讀取費率計費，其餘提示則以輸入費率計費。

```python showLineNumbers title="Read the response cost"
print(f"Request cost: ${response._hidden_params['response_cost']}")
```

## 自訂端點 {#custom-endpoints}

設定 `ZEROGPU_API_BASE` 或傳入 `api_base`，即可將 `zerogpu/` 路由指向不同的 ZeroGPU 端點。無論哪種方式，該路由都會保留提供者身分與定價。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-oss-120b
    litellm_params:
      model: zerogpu/gpt-oss-120b
      api_base: https://your-zerogpu-endpoint/v1
      api_key: os.environ/ZEROGPU_API_KEY
```
