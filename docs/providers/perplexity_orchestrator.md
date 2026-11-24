---
title: "透過 LiteLLM 使用 Perplexity Orchestrator API"
sidebar_label: "Perplexity Orchestrator"
description: "使用一把金鑰，透過 Perplexity 的 Orchestrator API，在聊天、Responses 與 Messages 路由上呼叫 Claude、GPT、Gemini、Grok 與開放權重模型，並追蹤成本。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Perplexity Orchestrator {#perplexity-orchestrator}

<SinceVersion v="1.112.0" />

Perplexity 的 Orchestrator API 以一把 Perplexity API 金鑰，提供 Anthropic、OpenAI、Google、xAI 與開放權重廠商的模型，支援 OpenAI Chat Completions、OpenAI Responses 與 Anthropic Messages 格式。LiteLLM 以 `perplexity_orchestrator/` 前綴呼叫它。該功能首見於 `v1.112.0-rc.1`，在 1.108.x LTS 線上則為 `v1.108.16`。

Perplexity 的 Sonar 模型與 Agent API，請改用 [`perplexity/` 提供者](./perplexity.md)。

## 總覽 {#overview}

| 屬性 | 詳細內容 |
|-------|-------|
| 說明 | 一把 Perplexity 金鑰即可使用 Anthropic、OpenAI、Google、xAI 與開放權重模型 |
| LiteLLM 上的提供者路由 | `perplexity_orchestrator/<vendor>/<model>` |
| 提供者文件連結 | [Perplexity Orchestrator](https://docs.perplexity.ai/docs/orchestrator/quickstart) |
| 預設 Base URL | `https://api.perplexity.ai/orchestrator/v1` |
| 支援的操作 | `/chat/completions`, `/responses`, `/messages` |

## API 金鑰 {#api-key}

LiteLLM 會從 `PERPLEXITY_API_KEY` 或 `PERPLEXITYAI_API_KEY` 讀取金鑰。兩者皆設定時，會使用 `PERPLEXITYAI_API_KEY`，也就是 `perplexity/` 提供者讀取的變數，因此兩個提供者會傳送同一把金鑰。

```python showLineNumbers title="Environment Variables"
import os

os.environ["PERPLEXITY_API_KEY"] = "pplx-..."
```

## 模型名稱 {#model-names}

模型寫法為 `perplexity_orchestrator/` 加上 Orchestrator 的模型 ID，該 ID 以廠商開頭，例如 `perplexity_orchestrator/anthropic/claude-haiku-5-5`、`perplexity_orchestrator/openai/gpt-6-luna` 或 `perplexity_orchestrator/xai/grok-4.7`。LiteLLM 會把 `perplexity_orchestrator/` 之後的部分當作請求的 `model` 傳送。`perplexity_orchestrator/perplexity/auto` 會讓 Orchestrator 為每次請求挑選模型。Perplexity 的[模型頁面](https://docs.perplexity.ai/docs/orchestrator/models)列出所有 ID。

## 使用 LiteLLM Python SDK {#usage---litellm-python-sdk}

```python showLineNumbers title="Chat Completions" keep-model-ids
import os
from litellm import completion

os.environ["PERPLEXITY_API_KEY"] = "pplx-..."

response = completion(
    model="perplexity_orchestrator/anthropic/claude-haiku-5-5",
    messages=[{"role": "user", "content": "Say hello in one word"}],
)
print(response.choices[0].message.content)
```

```python showLineNumbers title="Responses API" keep-model-ids
import litellm

response = litellm.responses(
    model="perplexity_orchestrator/openai/gpt-6-luna",
    input="Say hello in one word",
    max_output_tokens=64,
)
print(response.output_text)
```

```python showLineNumbers title="Anthropic Messages" keep-model-ids
import asyncio
import litellm

response = asyncio.run(
    litellm.anthropic.messages.acreate(
        model="perplexity_orchestrator/anthropic/claude-haiku-5-5",
        max_tokens=64,
        messages=[{"role": "user", "content": "Say hello in one word"}],
    )
)
print(response["content"][0]["text"])
```

## 使用 LiteLLM Proxy {#usage---litellm-proxy}

```yaml showLineNumbers title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-haiku
    litellm_params:
      model: perplexity_orchestrator/anthropic/claude-haiku-5-5
      api_key: os.environ/PERPLEXITY_API_KEY
  - model_name: gpt-6-luna
    litellm_params:
      model: perplexity_orchestrator/openai/gpt-6-luna
      api_key: os.environ/PERPLEXITY_API_KEY
  - model_name: auto
    litellm_params:
      model: perplexity_orchestrator/perplexity/auto
      api_key: os.environ/PERPLEXITY_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

```bash showLineNumbers title="Start LiteLLM Proxy"
export PERPLEXITY_API_KEY="pplx-..."
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 16)"
litellm --config config.yaml --port 4000
```

LiteLLM 會把每個路由傳送到 base URL 下對應的 Orchestrator 路由（`/chat/completions`、`/responses` 或 `/messages`），並保持請求原本的格式。它不會把請求經由 chat completions 轉譯。

<Tabs>
<TabItem value="chat" label="/v1/chat/completions">

```bash showLineNumbers title="Chat Completions through LiteLLM Proxy"
curl -sS -D - http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "claude-haiku",
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

proxy 會以 Chat Completions 格式回應，並在標頭中附上本次呼叫的成本：

```text showLineNumbers title="Response (trimmed)" keep-model-ids
HTTP/1.1 200 OK
x-litellm-model-name: perplexity_orchestrator/anthropic/claude-haiku-5-5
x-litellm-response-cost: 4.5e-06

{"model":"claude-haiku","object":"chat.completion","choices":[{"finish_reason":"stop","index":0,"message":{"content":"Hello!","role":"assistant"}}],"usage":{"completion_tokens":6,"prompt_tokens":15,"total_tokens":21}}
```

</TabItem>
<TabItem value="responses" label="/v1/responses">

```bash showLineNumbers title="Responses API through LiteLLM Proxy" keep-model-ids
curl -sS -D - http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "gpt-6-luna",
    "input": "Say hello in one word",
    "max_output_tokens": 64
  }'
```

proxy 會以 Responses API 格式回應：

```text showLineNumbers title="Response (trimmed)" keep-model-ids
HTTP/1.1 200 OK
x-litellm-model-name: perplexity_orchestrator/openai/gpt-6-luna
x-litellm-response-cost: 3.6e-06

{"model":"gpt-6-luna","object":"response","output":[{"content":[{"text":"Hello","type":"output_text"}],"role":"assistant","status":"completed","type":"message"}],"status":"completed","usage":{"input_tokens":11,"output_tokens":5,"total_tokens":16}}
```

</TabItem>
<TabItem value="messages" label="/v1/messages">

```bash showLineNumbers title="Anthropic Messages through LiteLLM Proxy"
curl -sS -D - http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-haiku",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

proxy 會以 Anthropic Messages 格式回應：

```text showLineNumbers title="Response (trimmed)" keep-model-ids
HTTP/1.1 200 OK
x-litellm-model-name: perplexity_orchestrator/anthropic/claude-haiku-5-5
x-litellm-response-cost: 4e-06

{"content":[{"text":"Hello","type":"text"}],"model":"claude-haiku","role":"assistant","stop_reason":"end_turn","type":"message","usage":{"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"input_tokens":15,"output_tokens":5}}
```

</TabItem>
</Tabs>

您也可以在 Admin UI 中加入這些模型。前往 Models，再點 Add Model，並選擇 Perplexity Orchestrator 作為提供者。它與 Perplexity 分開列出，Perplexity 提供者不會列出 Orchestrator 的模型。API 金鑰為必填，API base 則可省略。

## 成本追蹤 {#cost-tracking}

LiteLLM 會根據成本對照表中 `perplexity_orchestrator/` 的列為每次呼叫計價，這些列遵循 Perplexity 的 [Orchestrator 價格表](https://docs.perplexity.ai/docs/orchestrator/models)。成本會出現在 `x-litellm-response-cost` 回應標頭與支出記錄中。這些列涵蓋以下費率。

| 費率 | 模型 |
|-------|-------|
| 長上下文輸入與輸出 | Claude 超過 100k 輸入 token、GPT 超過 272k、Grok 超過 200k |
| 快取讀取 | 所有模型 |
| 5 分鐘快取寫入 | Claude 與大多數 GPT 模型 |
| 1 小時快取寫入 | Claude |
| `flex` 與 `priority` 服務層級 | GPT |

帶有 `"service_tier": "flex"` 的 GPT 請求會按 flex 費率計費。與上述相同的 `gpt-6-luna` 呼叫，在 flex 上花費 `1.8e-06`，在預設層級上則為 `3.6e-06`。

LiteLLM 會按實際回應的模型費率，為 `perplexity/auto` 請求計費，Orchestrator 會在回應中指明該模型。SDK 會以 `response.model` 回傳該模型：

```python showLineNumbers title="Auto routing with the SDK" keep-model-ids
import litellm

response = litellm.completion(
    model="perplexity_orchestrator/perplexity/auto",
    messages=[{"role": "user", "content": "Say hello in one word"}],
)
print(response.model, litellm.completion_cost(completion_response=response))
```

```text showLineNumbers title="Output" keep-model-ids
perplexity_orchestrator/openai/gpt-6-luna 3.6e-06
```

proxy 會以您的模型群組名稱作為 `model` 回傳，並把成本放在標頭中：

```bash showLineNumbers title="Auto routing through LiteLLM Proxy"
curl -sS -D - http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

```text showLineNumbers title="Response (trimmed)" keep-model-ids
HTTP/1.1 200 OK
x-litellm-model-name: perplexity_orchestrator/perplexity/auto
x-litellm-response-cost: 3.6e-06

{"model":"auto","object":"chat.completion","choices":[{"finish_reason":"stop","index":0,"message":{"content":"Hello","role":"assistant"}}],"usage":{"completion_tokens":5,"prompt_tokens":11,"total_tokens":16}}
```

## 不支援的參數 {#unsupported-params}

LiteLLM 將 `seed`、`logit_bias`、`top_logprobs`、`functions`、`function_call`、`modalities`、`audio`、`prediction`、`web_search_options`、`verbosity` 與 `prompt_cache_retention`，以及 Responses API 的 `previous_response_id` 視為 Orchestrator 不支援的參數。對於 `n`（1）、`frequency_penalty` 與 `presence_penalty`（0）、`logprobs`、`store` 與 `background`（false），以及 `service_tier`（`auto` 或 `default`，GPT 模型另可使用 `flex` 與 `priority`），LiteLLM 也只接受預設值。LiteLLM 會以 400 回應這類請求，且不會呼叫 Orchestrator：

```bash showLineNumbers title="A request with seed" keep-model-ids
curl -sS http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "gpt-6-luna",
    "seed": 7,
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

```text showLineNumbers title="Response" keep-model-ids
HTTP/1.1 400 Bad Request

{"error":{"message":"litellm.UnsupportedParamsError: perplexity_orchestrator does not support parameters: ['seed'], for model=openai/gpt-6-luna. To drop these, set `litellm.drop_params=True` or for proxy: ...","type":"invalid_request_error","code":"400"}}
```

開啟 `drop_params` 後，LiteLLM 會移除該參數並傳送請求的其餘部分，因此同樣的 curl 會得到 200 回應：

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  drop_params: true
```

列在 `allowed_openai_params` 中的參數（無論是在請求或部署層級）會跳過此檢查，並按原樣傳送給 Orchestrator。Orchestrator 隨後會對任何不接受的值自行回應 400，例如 `seed` 或大於 1 的 `n`。

## 提示快取 {#prompt-caching}

在 `/v1/messages` 上，LiteLLM 會按原樣轉送 `cache_control`，包含 `"1h"` 的 `ttl`。模型只有在提示長於模型可快取的最小長度時才會將其快取。

```bash showLineNumbers title="A 1 hour cache breakpoint through LiteLLM Proxy"
curl -sS -D - http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-haiku",
    "max_tokens": 64,
    "system": [
      {
        "type": "text",
        "text": "<a system prompt of at least 4,096 tokens>",
        "cache_control": {"type": "ephemeral", "ttl": "1h"}
      }
    ],
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

第一次呼叫會寫入快取，LiteLLM 會按 1 小時費率收取寫入費用。該小時內的後續呼叫會按快取讀取費率讀取：

```text showLineNumbers title="First call (trimmed)"
x-litellm-response-cost: 0.0029379
x-litellm-response-cost-cache-creation: 0.0029336

"usage":{"cache_creation":{"ephemeral_1h_input_tokens":14668,"ephemeral_5m_input_tokens":0},"cache_creation_input_tokens":14668,"cache_read_input_tokens":0,"input_tokens":13,"output_tokens":6}
```

```text showLineNumbers title="Later call (trimmed)"
x-litellm-response-cost: 0.00015098
x-litellm-response-cost-cache-read: 0.00014668

"usage":{"cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":0},"cache_creation_input_tokens":0,"cache_read_input_tokens":14668,"input_tokens":13,"output_tokens":6}
```

在 `/v1/chat/completions` 與 `/v1/responses` 上，Claude 模型或 `perplexity/auto` 上的 `cache_control` 標記會以 `prompt_cache_breakpoint` 欄位傳送給 Orchestrator。
