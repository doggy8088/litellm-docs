---
title: "透過 LiteLLM AI Gateway 使用 Inference APIs"
sidebar_label: "Inference APIs"
description: "從 Python SDK 或 AI Gateway 在 Inference APIs 上呼叫 DeepSeek V4、GLM-5.3、Qwen3.8 與 gpt-oss，涵蓋 chat、Responses 與 Messages，並支援成本追蹤。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Inference APIs {#inference-apis}

<SinceVersion v="1.107.0" />

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Inference APIs 透過單一與 OpenAI 相容的 API 提供開放權重模型（DeepSeek、Qwen、GLM、Llama、gpt-oss、MiniMax、Kimi）。 |
| LiteLLM 上的提供者路由 | `inferenceapis/` |
| 提供者文件連結 | [Inference APIs 文件 ↗](https://inferenceapis.com/docs) |
| 基礎 URL | `https://api.inferenceapis.com/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#responses-api), [`/messages`](#usage---litellm-proxy-server) |

<br />
<br />

**我們支援所有 Inference APIs 聊天模型，傳送請求時只需將 `inferenceapis/` 設為前綴**

## 可用模型 {#available-models}

模型 ID 保留其組織前綴，因此完整的 LiteLLM 模型名稱會有兩個斜線，例如 `inferenceapis/openai/gpt-oss-120b`。

| 模型 | 上下文 | 輸入 $/1M | 輸出 $/1M |
|-------|---------|------------|-------------|
| `inferenceapis/deepseek-ai/DeepSeek-V4-Flash` | 1M | 0.19 | 0.38 |
| `inferenceapis/deepseek-ai/DeepSeek-V4.1-Flash` | 1M | 0.40 | 1.60 |
| `inferenceapis/deepseek-ai/DeepSeek-V4-Pro` | 1M | 1.72 | 5.15 |
| `inferenceapis/zai-org/GLM-5.3` | 1M | 1.82 | 5.72 |
| `inferenceapis/zai-org/GLM-5.3-Flash` | 1M | 0.20 | 0.66 |
| `inferenceapis/Qwen/Qwen3.8-Flash` | 1M | 0.15 | 0.50 |
| `inferenceapis/Qwen/Qwen3-VL-235B-A22B-Instruct` | 262k | 0.26 | 1.15 |
| `inferenceapis/MiniMaxAI/MiniMax-M3` | 524k | 0.39 | 1.56 |
| `inferenceapis/moonshotai/Kimi-K2.7-Code` | 262k | 0.89 | 4.42 |
| `inferenceapis/meta-llama/Llama-3.3-70B-Instruct-Turbo` | 131k | 0.20 | 0.50 |
| `inferenceapis/openai/gpt-oss-120b` | 131k | 0.20 | 0.80 |
| `inferenceapis/openai/gpt-oss-20b` | 131k | 0.04 | 0.19 |

Inference APIs 也接受這些模型的簡短別名，例如 `inferenceapis/deepseek-chat` 或 `inferenceapis/glm-5.3`，LiteLLM 會比照其標準模型為每個別名定價。`GET https://api.inferenceapis.com/v1/models` 會列出每個別名及其對應的標準 ID。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["INFERENCEAPIS_API_KEY"] = ""  # your Inference APIs key
os.environ["INFERENCEAPIS_API_BASE"] = ""  # optional, defaults to https://api.inferenceapis.com/v1
```

## 使用方式：LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Inference APIs Non-streaming Completion"
import os
from litellm import completion

os.environ["INFERENCEAPIS_API_KEY"] = ""  # your Inference APIs key

response = completion(
    model="inferenceapis/deepseek-ai/DeepSeek-V4-Flash",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="Inference APIs Streaming Completion"
import os
from litellm import completion

os.environ["INFERENCEAPIS_API_KEY"] = ""  # your Inference APIs key

response = completion(
    model="inferenceapis/deepseek-ai/DeepSeek-V4-Flash",
    messages=[{"role": "user", "content": "Write a short story about AI"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### Responses API {#responses-api}

Inference APIs 原生提供 `/v1/responses`，因此 LiteLLM 會將 `litellm.responses` 呼叫直接傳送給它。

```python showLineNumbers title="Inference APIs Responses API"
import os
import litellm

os.environ["INFERENCEAPIS_API_KEY"] = ""  # your Inference APIs key

response = litellm.responses(
    model="inferenceapis/deepseek-ai/DeepSeek-V4-Flash",
    input="Say hello",
)

print(response.output_text)
```

Inference APIs 不會儲存回應，因此 `previous_response_id` 會回傳 400。請改將先前的對話輪次放在 `input` 中傳送。

## 使用方式：LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: deepseek-v4-flash
    litellm_params:
      model: inferenceapis/deepseek-ai/DeepSeek-V4-Flash
      api_key: os.environ/INFERENCEAPIS_API_KEY
  - model_name: gpt-oss-120b
    litellm_params:
      model: inferenceapis/openai/gpt-oss-120b
      api_key: os.environ/INFERENCEAPIS_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export INFERENCEAPIS_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-inferenceapis"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

以此方式設定的部署會在 proxy 上提供 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages`。每個請求都會原封不動地傳送到對應的 Inference APIs 端點，不會在 API 格式之間轉換。

<Tabs>
<TabItem value="chat" label="Chat Completions">

```bash showLineNumbers title="curl"
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Inference APIs via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-inferenceapis",
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
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
    "model": "deepseek-v4-flash",
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
    "model": "deepseek-v4-flash",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
</Tabs>

您也可以從 Admin UI 新增 Inference APIs。前往 Models，接著 Add Model，選擇 Inference APIs 作為提供者，輸入 `inferenceapis/` 模型 ID，並貼上您的金鑰。

## 成本追蹤 {#cost-tracking}

LiteLLM 的模型成本表包含上述 12 個聊天模型及其別名的價格，因此無需額外設定即可追蹤支出。快取的提示詞 token 會依各模型的快取輸入費率計費（若該模型有此費率）。成本會在 `x-litellm-response-cost` 回應標頭中回傳，並記錄在支出記錄中。

## 自訂 API Base {#custom-api-base}

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["INFERENCEAPIS_API_BASE"] = "https://custom.inferenceapis.example/v1"
os.environ["INFERENCEAPIS_API_KEY"] = ""  # your API key

response = completion(
    model="inferenceapis/deepseek-ai/DeepSeek-V4-Flash",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="inferenceapis/deepseek-ai/DeepSeek-V4-Flash",
    messages=[{"role": "user", "content": "Hello!"}],
    api_base="https://custom.inferenceapis.example/v1",
    api_key="your-api-key",
)
```
