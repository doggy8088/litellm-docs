---
slug: claude_opus_4_6
title: "第 0 天支援：Claude Opus 4.6"
date: 2026-02-05T10:00:00
authors:
  - sameer
  - ishaan-alt
  - krrish
description: "LiteLLM AI Gateway 對 Claude Opus 4.6 的第 0 天支援 - 可跨 Anthropic、Azure、Vertex AI 和 Bedrock 使用。"
tags: [anthropic, claude, opus 4.6]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在於第 0 天支援 Claude Opus 4.6。您可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用它。

{/* truncate */}

## Docker 映像 {#docker-image}

```bash
docker pull ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.80.0-stable.opus-4-6
```

## 用法 - Anthropic {#usage---anthropic}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: anthropic/claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.80.0-stable.opus-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 用法 - Azure {#usage---azure}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: azure_ai/claude-opus-4-6
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE  # https://<resource>.services.ai.azure.com
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AZURE_AI_API_KEY=$AZURE_AI_API_KEY \
  -e AZURE_AI_API_BASE=$AZURE_AI_API_BASE \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.80.0-stable.opus-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 用法 - Vertex AI {#usage---vertex-ai}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: vertex_ai/claude-opus-4-6
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: us-east5
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e VERTEX_PROJECT=$VERTEX_PROJECT \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/credentials.json:/app/credentials.json \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.80.0-stable.opus-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 用法 - Bedrock {#usage---bedrock}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: bedrock/anthropic.claude-opus-4-6-v1
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.80.0-stable.opus-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 進階功能 {#advanced-features}

### 壓縮 {#compaction}

<Tabs>
<TabItem value="completions" label="/chat/completions">

Litellm 支援為新的 claude-opus-4-6 啟用壓縮。

**啟用壓縮**

若要啟用壓縮，請使用 `context_management` 參數與 `compact_20260112` 編輯類型：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "What is the weather in San Francisco?"
    }
  ],
  "context_management": {
    "edits": [
      {
        "type": "compact_20260112"
      }
    ]
  },
  "max_tokens": 100
}'
```
Anthropic 支援的所有 context_management 參數都受到支援，且可直接加入。Litellm 會自動在請求中加入 `compact-2026-01-12` beta 標頭。

</TabItem>
<TabItem value="messages" label="/v1/messages">

啟用壓縮可在保留關鍵資訊的同時縮減 context 大小。啟用壓縮時，LiteLLM 會自動加入 `compact-2026-01-12` beta 標頭。

:::info
**提供者支援：** 壓縮支援 Anthropic、Azure AI 和 Vertex AI。不支援 Bedrock（Invoke 或 Converse APIs）。
:::

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 4096,
    "messages": [
        {
            "role": "user",
            "content": "Hi"
        }
    ],
    "context_management": {
        "edits": [
            {
                "type": "compact_20260112"
            }
        ]
    }
}'
```

</TabItem>
</Tabs>

**含壓縮區塊的回應**

回應將在 `provider_specific_fields.compaction_blocks` 中包含壓縮摘要：

```json
{
  "id": "chatcmpl-a6c105a3-4b25-419e-9551-c800633b6cb2",
  "created": 1770357619,
  "model": "claude-opus-4-6",
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "length",
      "index": 0,
      "message": {
        "content": "I don't have access to real-time data, so I can't provide the current weather in San Francisco. To get up-to-date weather information, I'd recommend checking:\n\n- **Weather websites** like weather.com, accuweather.com, or wunderground.com\n- **Search engines** – just Google \"San Francisco weather\"\n- **Weather apps** on your phone (e.g., Apple Weather, Google Weather)\n- **National",
        "role": "assistant",
        "provider_specific_fields": {
          "compaction_blocks": [
            {
              "type": "compaction",
              "content": "Summary of the conversation: The user requested help building a web scraper..."
            }
          ]
        }
      }
    }
  ],
  "usage": {
    "completion_tokens": 100,
    "prompt_tokens": 86,
    "total_tokens": 186
  }
}
```

**在後續請求中使用壓縮區塊**

若要使用壓縮繼續對話，請在 assistant 訊息的 `provider_specific_fields` 中包含壓縮區塊：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "How can I build a web scraper?"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Certainly! To build a basic web scraper, you'll typically use a programming language like Python along with libraries such as `requests` (for fetching web pages) and `BeautifulSoup` (for parsing HTML). Here's a basic example:\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://example.com'\nresponse = requests.get(url)\nsoup = BeautifulSoup(response.text, 'html.parser')\n\n# Extract and print all text\ntext = soup.get_text()\nprint(text)\n```\n\nLet me know what you're interested in scraping or if you need help with a specific website!"
        }
      ],
      "provider_specific_fields": {
        "compaction_blocks": [
          {
            "type": "compaction",
            "content": "Summary of the conversation: The user asked how to build a web scraper, and the assistant gave an overview using Python with requests and BeautifulSoup."
          }
        ]
      }
    },
    {
      "role": "user",
      "content": "How do I use it to scrape product prices?"
    }
  ],
  "context_management": {
    "edits": [
      {
        "type": "compact_20260112"
      }
    ]
  },
  "max_tokens": 100
}'
```

**串流支援**

串流模式也支援壓縮區塊。您將收到：
- 壓縮區塊開始時的 `compaction_start` 事件
- 含有壓縮內容的 `compaction_delta` 事件
- 累積的 `compaction_blocks`，位於 `provider_specific_fields` 中

### 自適應思考 {#adaptive-thinking}

:::note
使用 `reasoning_effort` 搭配 Claude Opus 4.6 時，所有值（`low`、`medium`、`high`、`max`）都會對應到 `thinking: {type: "adaptive"}`。透過 `thinking: {type: "enabled", budget_tokens: ...}` 設定的明確預算在 Opus 4.6 上仍可運作，但已棄用且不再建議；請改用帶有 `output_config.effort` 的自適應思考（請參閱下方的 [Effort Levels](#effort-levels)）來控制思考深度。
:::

<Tabs>
<TabItem value="completions" label="/chat/completions">

LiteLLM 透過 `reasoning_effort` 參數支援自適應思考：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Solve this complex problem: What is the optimal strategy for..."
    }
  ],
  "reasoning_effort": "high"
}'
```

</TabItem>
<TabItem value="messages" label="/v1/messages">

使用 `thinking` 參數搭配 `type: "adaptive"` 以啟用自適應思考模式：

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 16000,
    "thinking": {
        "type": "adaptive"
    },
    "messages": [
        {
            "role": "user",
            "content": "Explain why the sum of two even numbers is always even."
        }
    ]
}'
```

</TabItem>
<TabItem value="native" label="Native thinking param">

直接使用 `thinking` 參數，透過 SDK 啟用自適應思考：

```python
import litellm

response = litellm.completion(
  model="anthropic/claude-opus-4-6",
  messages=[{"role": "user", "content": "Solve this complex problem: What is the optimal strategy for..."}],
  thinking={"type": "adaptive"},
)
```

</TabItem>
</Tabs>

### 努力等級 {#effort-levels}

<Tabs>
<TabItem value="completions" label="/chat/completions">

可用的四個 effort levels：`low`、`medium`、`high`（預設）以及 `max`。請直接透過 `output_config` 參數傳入：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "output_config": {
        "effort": "medium"
    }
}'
```

您可以使用 reasoning effort 搭配 output_config，以便更精細地控制模型。

</TabItem>
<TabItem value="messages" label="/v1/messages">

可用的四個 effort levels：`low`、`medium`、`high`（預設）以及 `max`。請直接透過 `output_config` 參數傳入：

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 4096,
    "messages": [
        {
            "role": "user",
            "content": "Explain quantum computing"
        }
    ],
    "output_config": {
        "effort": "medium"
    }
}'
```

</TabItem>
</Tabs>

### 1M Token 上下文（Beta） {#1m-token-context-beta}

Opus 4.6 支援 1M token context。超過 200k tokens 的提示詞將適用進階定價（每百萬 input/output tokens 為 $10/$37.50）。LiteLLM 支援 1M token contexts 的成本計算。

<Tabs>
<TabItem value="completions" label="/chat/completions">

若要使用 1M token context 視窗，您需要將來自用戶端的 `anthropic-beta` 標頭轉送到 LLM 提供者。

**步驟 1：在您的設定中啟用標頭轉送**

```yaml
general_settings:
  forward_client_headers_to_llm_api: true
```

**步驟 2：使用 beta 標頭傳送請求**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--header 'anthropic-beta: context-1m-2025-08-07' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Analyze this large document..."
    }
  ]
}'
```

</TabItem>
<TabItem value="messages" label="/v1/messages">

若要使用 1M token context 視窗，您需要將來自用戶端的 `anthropic-beta` 標頭轉送到 LLM 提供者。

**步驟 1：在您的設定中啟用標頭轉送**

```yaml
general_settings:
  forward_client_headers_to_llm_api: true
```

**步驟 2：使用 beta 標頭傳送請求**

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'anthropic-beta: context-1m-2025-08-07' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 16000,
    "messages": [
        {
            "role": "user",
            "content": "Analyze this large document..."
        }
    ]
}'
```

:::tip
您可以透過逗號分隔來合併多個 beta 標頭：
```bash
--header 'anthropic-beta: context-1m-2025-08-07,compact-2026-01-12'
```
:::

</TabItem>
</Tabs>

### 僅限美國推論 {#us-only-inference}

可用價格為 token 價格的 1.1×。LiteLLM 會自動追蹤僅限美國推論的成本。

<Tabs>
<TabItem value="completions" label="/chat/completions">

使用 `inference_geo` 參數來指定僅限美國推論：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ],
  "inference_geo": "us"
}'
```

LiteLLM 會在成本追蹤中自動套用僅限美國推論的 1.1× 價格乘數。

</TabItem>
<TabItem value="messages" label="/v1/messages">

使用 `inference_geo` 參數來指定僅限美國推論：

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 4096,
    "messages": [
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    "inference_geo": "us"
}'
```

LiteLLM 會在成本追蹤中自動套用僅限美國推論的 1.1× 價格乘數。

</TabItem>
</Tabs>

### 快速模式 {#fast-mode}

:::info
快速模式**僅支援 Anthropic 提供者**（`anthropic/claude-opus-4-6`）。Azure AI、Vertex AI 或 Bedrock 上均不可用。
:::

**定價：**
- 標準：每 MTok $5 input / $25 output
- 快速：每 MTok $30 input / $150 output（6× premium）

<Tabs>
<TabItem value="completions" label="/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Refactor this module..."
    }
  ],
  "max_tokens": 4096,
  "speed": "fast"
}'
```

**使用 OpenAI SDK：**

```python
import openai

client = openai.OpenAI(
    api_key="your-litellm-key",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-opus-4-6",
    messages=[{"role": "user", "content": "Refactor this module..."}],
    max_tokens=4096,
    extra_body={"speed": "fast"}
)
```

**使用 LiteLLM SDK：**

```python
from litellm import completion

response = completion(
    model="anthropic/claude-opus-4-6",
    messages=[{"role": "user", "content": "Refactor this module..."}],
    max_tokens=4096,
    speed="fast"
)
```

LiteLLM 會在使用量與成本計算中自動追蹤快速模式較高的成本。

</TabItem>
<TabItem value="messages" label="/v1/messages">

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-6",
    "max_tokens": 4096,
    "speed": "fast",
    "messages": [
        {
            "role": "user",
            "content": "Refactor this module..."
        }
    ]
}'
```

LiteLLM 會自動：
- 加入 `fast-mode-2026-02-01` beta 標頭
- 在成本計算中追蹤 6× premium 定價

</TabItem>
</Tabs>
