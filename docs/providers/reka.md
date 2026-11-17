---
title: "透過 LiteLLM 使用 Reka API：Python SDK 與 Gateway"
sidebar_label: "Reka"
description: "透過 LiteLLM 呼叫 Reka Flash 3、Reka Edge，以及託管的 GLM、DeepSeek 與 Qwen 模型，支援串流、圖片與影片輸入，以及 Responses 或 Messages API 呼叫。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Reka {#reka}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Reka 透過單一 OpenAI 相容 API 提供自家模型與精選的開放模型，具備自動提示快取，且不收平台費或加價。 |
| LiteLLM 上的提供者路由 | `reka/` |
| 提供者文件連結 | [Reka Developer Reference ↗](https://developer.reka.ai/reference) |
| Base URL | `https://api.reka.ai/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk)、[`/responses`](#responses-api)、[`/messages`](#usage---litellm-proxy-server) |

<br />
<br />

**我們支援所有 Reka 模型，傳送請求時只需將 `reka/` 設為前綴**

## 可用模型 {#available-models}

| 模型 | Context | 最大輸出 |
|-------|---------|------------|
| `reka/reka-flash-3` | 64k | 58,982 |
| `reka/reka-edge-2603` | 16k | 14,745 |
| `reka/deepseek4-flash` | 1M | 384,000 |
| `reka/deepseek-v4-pro` | 1M | 393,216 |
| `reka/glm5.3` | 262k | 131,072 |
| `reka/glm5.3-flash` | 262k | 131,072 |
| `reka/qwen3.8-27b` | 262k | 131,072 |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["REKA_API_KEY"] = ""  # your Reka API key
os.environ["REKA_API_BASE"] = ""  # optional, defaults to https://api.reka.ai/v1
```

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Reka Non-streaming Completion"
import os
from litellm import completion

os.environ["REKA_API_KEY"] = ""  # your Reka API key

response = completion(
    model="reka/reka-flash-3",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="Reka Streaming Completion"
import os
from litellm import completion

os.environ["REKA_API_KEY"] = ""  # your Reka API key

response = completion(
    model="reka/reka-flash-3",
    messages=[{"role": "user", "content": "Write a short story about AI"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 視覺 {#vision}

`reka-edge-2603` 接受圖片與影片。圖片輸入使用 OpenAI content-part 格式；影片同樣使用 `video_url` part。將媒體傳送給其他任何模型之前，請先查看 `GET /v1/models` 上的 `input_modalities`。

```python showLineNumbers title="Reka Image Input"
import os
from litellm import completion

os.environ["REKA_API_KEY"] = ""  # your Reka API key

response = completion(
    model="reka/reka-edge-2603",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What animal is this? Answer briefly."},
            {"type": "image_url", "image_url": {"url": "https://v0.docs.reka.ai/_images/000000245576.jpg"}},
        ],
    }],
)

print(response.choices[0].message.content)
```

### Responses API {#responses-api}

Reka 並未原生提供 `/v1/responses`，因此 LiteLLM 會將 `litellm.responses` 呼叫轉換為 Reka chat completions，再將結果轉換回 Responses API 物件。

```python showLineNumbers title="Reka Responses API"
import os
import litellm

os.environ["REKA_API_KEY"] = ""  # your Reka API key

response = litellm.responses(
    model="reka/reka-flash-3",
    input="Say hello",
)

print(response.output_text)
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: reka-flash-3
    litellm_params:
      model: reka/reka-flash-3
      api_key: os.environ/REKA_API_KEY
  - model_name: reka-edge
    litellm_params:
      model: reka/reka-edge-2603
      api_key: os.environ/REKA_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export REKA_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-reka"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

以此方式設定的部署，會在 proxy 上提供 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages`。

<Tabs>
<TabItem value="chat" label="Chat Completions">

```bash showLineNumbers title="curl"
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "reka-flash-3",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Reka via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-reka",
)

response = client.chat.completions.create(
    model="reka-flash-3",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="responses" label="Responses">

```bash showLineNumbers title="curl"
curl http://localhost:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "reka-flash-3",
    "input": "Hello, how are you?"
  }'
```

</TabItem>
<TabItem value="messages" label="Messages">

```bash showLineNumbers title="curl"
curl http://localhost:4000/v1/messages \
  -H "x-api-key: $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "reka-edge",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
</Tabs>

您也可以從 Admin UI 新增 Reka。前往 Models，再點 Add Model，選擇 Reka 作為提供者，輸入 `reka/` 模型 id，並貼上您的金鑰。

## 成本追蹤 {#cost-tracking}

Reka 模型尚未收錄於 LiteLLM 的模型成本對照表中，因此花費不會自動計算。Reka 依每個模型的費率按 token 計費，不收平台費，並將費率公布於 [developer.reka.ai/models](https://developer.reka.ai/models) 以及 `GET /v1/models` 的 `pricing` 物件中（每 token 的美元價格，以字串表示：`prompt`、`completion` 與 `input_cache_read`）。將這些值以 `input_cost_per_token` 與 `output_cost_per_token` 傳入部署，LiteLLM 便會為其追蹤花費，將金額放在 `x-litellm-response-cost` 回應標頭中回傳，並記錄於花費記錄。Reka 列出的費率以每百萬 token 為單位；除以 1,000,000 即為每 token 的價格。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: reka-edge
    litellm_params:
      model: reka/reka-edge-2603
      api_key: os.environ/REKA_API_KEY
      input_cost_per_token: 0.0000001   # $0.10 / 1M
      output_cost_per_token: 0.0000001  # $0.10 / 1M
  - model_name: glm5.3-flash
    litellm_params:
      model: reka/glm5.3-flash
      api_key: os.environ/REKA_API_KEY
      input_cost_per_token: 0.00000015  # $0.15 / 1M
      output_cost_per_token: 0.0000005  # $0.50 / 1M
```

在模型支援提示快取的情況下，Reka 會自動快取重複的 prompt 前綴，並以快取輸入費率對這些 token 計費；`usage.reasoning_tokens` 已包含在 `completion_tokens` 中，不會重複計費。

## 自訂 API Base {#custom-api-base}

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["REKA_API_BASE"] = "https://custom.reka.example/v1"
os.environ["REKA_API_KEY"] = ""  # your API key

response = completion(
    model="reka/reka-flash-3",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="reka/reka-flash-3",
    messages=[{"role": "user", "content": "Hello!"}],
    api_base="https://custom.reka.example/v1",
    api_key="your-api-key",
)
```

傳入 `api_base="https://api.reka.ai/v1"` 而不加 `reka/` 前綴，也會解析為 Reka 提供者，因此搭配該 base URL 的 `model="reka-flash-3"` 會以 `reka` 路由，並取得 `REKA_API_KEY`。
