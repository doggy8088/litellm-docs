---
title: "搭配 LiteLLM 使用 Crusoe API：Python SDK 與閘道"
sidebar_label: "Crusoe"
description: "透過 Python SDK 或 AI 閘道使用 Crusoe Cloud 上的 DeepSeek V4、Gemma 4 與 NVIDIA Nemotron 模型，並支援串流、工具呼叫與每 token 成本設定。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Crusoe {#crusoe}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Crusoe Cloud 為開源大型語言模型提供 GPU 加速推論，並針對效能與成本效率進行最佳化。 |
| LiteLLM 提供者路由 | `crusoe/` |
| 提供者文件連結 | [Crusoe Serverless Inference 文件 ↗](https://docs.crusoecloud.com/serverless-inference/available-models) |
| Base URL | `https://api.inference.crusoecloud.com/v1`（較舊的 LiteLLM 版本預設呼叫不同的主機，請參閱 [自訂 API Base](#custom-api-base)） |
| 支援的操作 | [`/chat/completions`](/docs/providers/crusoe#usage---litellm-python-sdk) |

<br />
<br />

**我們支援所有 Crusoe 模型，只要在送出 completion 請求時將 `crusoe/` 設為前綴**

## 可用模型 {#available-models}

| 模型 | 提供者 | 上下文視窗 |
|-------|----------|----------------|
| `crusoe/deepseek-ai/Deepseek-V4-Flash` | DeepSeek | 1,048,576 tokens |
| `crusoe/deepseek-ai/DeepSeek-V4.1-Flash` | DeepSeek | 1,048,576 tokens |
| `crusoe/deepseek-ai/DeepSeek-V4-Pro` | DeepSeek | 1,048,576 tokens |
| `crusoe/google/gemma-4-31b-it` | Google | 262,144 tokens |
| `crusoe/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B` | NVIDIA | 262,144 tokens |
| `crusoe/nvidia/NVIDIA-Nemotron-3.5-Super-VL` | NVIDIA | 262,144 tokens |
| `crusoe/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | NVIDIA | 262,144 tokens |
| `crusoe/nvidia/Nemotron-3-Nano-Omni-Reasoning-30B-A3B` | NVIDIA | 262,144 tokens |
| `crusoe/nvidia/Nemotron-3.5-Lightning-30B-A3B` | NVIDIA | 262,144 tokens |
| `crusoe/openai/gpt-oss-120b` | OpenAI | 131,072 tokens |
| `crusoe/Qwen/Qwen3.8-27B` | Qwen | 262,144 tokens |
| `crusoe/yutori/n2` | Yutori | 262,144 tokens |
| `crusoe/zai-org/GLM-5.3` | Z.ai | 1,048,576 tokens |
| `crusoe/zai-org/GLM-5.3-Flash` | Z.ai | 1,048,576 tokens |

Crusoe 經常淘汰模型。若要列出您的金鑰可呼叫的模型 ID，請使用您的 Crusoe API 金鑰傳送 `GET https://api.inference.crusoecloud.com/v1/models`，並在每個 `id` 前加上 `crusoe/`。請從該端點複製 ID，不要從 Crusoe 的文件頁面複製，因為其中某些 ID 的拼法不同。

LiteLLM 的成本對應表沒有這些模型的現行價格，因此其花費會記錄為 $0 或過時的價格。若要追蹤花費，請依 [Crusoe 定價](https://www.crusoe.ai/cloud/pricing#Serverless-Inference) 為您使用的每個模型設定 `input_cost_per_token` 與 `output_cost_per_token`，可在 proxy 上模型的 `litellm_params` 中設定，或在 SDK 中作為 `completion()` 參數傳入。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key
```

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Crusoe Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Crusoe call
response = completion(
    model="crusoe/deepseek-ai/Deepseek-V4-Flash",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Crusoe Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# Crusoe call with streaming
response = completion(
    model="crusoe/deepseek-ai/Deepseek-V4-Flash",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Crusoe Function Calling"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                }
            },
            "required": ["location"]
        }
    }
}]

messages = [{"role": "user", "content": "What's the weather in Boston?"}]

response = completion(
    model="crusoe/deepseek-ai/Deepseek-V4-Flash",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: deepseek-v4-flash
    litellm_params:
      model: crusoe/deepseek-ai/Deepseek-V4-Flash
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: deepseek-v4-pro
    litellm_params:
      model: crusoe/deepseek-ai/DeepSeek-V4-Pro
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: gpt-oss-120b
    litellm_params:
      model: crusoe/openai/gpt-oss-120b
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: qwen3.8-27b
    litellm_params:
      model: crusoe/Qwen/Qwen3.8-27B
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: glm-5.3
    litellm_params:
      model: crusoe/zai-org/GLM-5.3
      api_key: os.environ/CRUSOE_API_KEY
```

## 自訂 API Base {#custom-api-base}

較舊的 LiteLLM 版本（包括 v1.106 及更早版本）預設會將 Crusoe 呼叫傳送至 `https://managed-inference-api-proxy.crusoecloud.com/v1`。該主機的防火牆會以 HTTP 403「Sorry, you have been blocked」頁面回應某些提示，例如包含 `../../etc/passwd` 等檔案路徑的提示，或 `' OR 1=1 --` 等 SQL 注入字串。若要查看您的版本呼叫哪個主機，請傳送一個成功的請求，並在 proxy 上讀取 `x-litellm-model-api-base` 回應標頭，或在 SDK 中讀取 `response._hidden_params["api_base"]`。被封鎖的請求不會顯示主機。如果是舊主機，請依下方說明將 `CRUSOE_API_BASE` 設定為 `https://api.inference.crusoecloud.com/v1`。如果您的部署限制對外流量，請允許您的版本所呼叫的主機。

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["CRUSOE_API_BASE"] = "https://api.inference.crusoecloud.com/v1"
os.environ["CRUSOE_API_KEY"] = ""  # your API key

response = completion(
    model="crusoe/deepseek-ai/Deepseek-V4-Flash",
    messages=[{"content": "Hello!", "role": "user"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="crusoe/deepseek-ai/Deepseek-V4-Flash",
    messages=[{"content": "Hello!", "role": "user"}],
    api_base="https://api.inference.crusoecloud.com/v1",
    api_key="your-api-key",
)
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

- `temperature`
- `max_tokens`
- `max_completion_tokens`
- `top_p`
- `frequency_penalty`
- `presence_penalty`
- `stop`
- `n`
- `stream`
- `tools`
- `tool_choice`
- `response_format`
- `seed`
- `user`
- `logit_bias`
- `logprobs`
- `top_logprobs`
