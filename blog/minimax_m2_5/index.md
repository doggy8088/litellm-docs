---
slug: minimax_m2_5
title: "Day 0 支援：MiniMax-M2.5"
date: 2026-02-12T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "LiteLLM 對 MiniMax-M2.5 的 Day 0 支援"
tags: [minimax, M2.5, llm]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在在 Day 0 支援 MiniMax-M2.5。可透過 LiteLLM AI Gateway，在 OpenAI 相容與 Anthropic 相容的 API 中使用它。

{/* truncate */}

## 支援的模型 {#supported-models}

LiteLLM 支援以下 MiniMax 模型：

| 模型 | 說明 | 輸入成本 | 輸出成本 | 上下文視窗 |
|-------|-------------|------------|-------------|----------------|
| **MiniMax-M2.5** | 進階推理、代理式能力 | $0.3/M tokens | $1.2/M tokens | 1M tokens |
| **MiniMax-M2.5-lightning** | 更快且更敏捷（約 100 tps） | $0.3/M tokens | $2.4/M tokens | 1M tokens |

## 支援的功能 {#features-supported}

- **Prompt 快取**：使用快取的 prompts 降低成本（cache read 為 $0.03/M tokens，cache write 為 $0.375/M tokens）
- **Function Calling**：內建工具呼叫支援
- **推理**：支援 thinking 的進階推理能力
- **System Messages**：完整支援 system message
- **成本追蹤**：自動計算所有請求的成本

## Docker 映像檔 {#docker-image}

```bash
docker pull litellm/litellm:v1.81.3-stable
```

## 使用方式 - OpenAI 相容 API (/v1/chat/completions) {#usage---openai-compatible-api-v1chatcompletions}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: minimax-m2-5
    litellm_params:
      model: minimax/MiniMax-M2.5
      api_key: os.environ/MINIMAX_API_KEY
      api_base: https://api.minimax.io/v1
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e MINIMAX_API_KEY=$MINIMAX_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.81.3-stable \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "minimax-m2-5",
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

### 搭配 Reasoning Split {#with-reasoning-split}

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "minimax-m2-5",
  "messages": [
    {
      "role": "user",
      "content": "Solve: 2+2=?"
    }
  ],
  "extra_body": {
    "reasoning_split": true
  }
}'
```

## 使用方式 - Anthropic 相容 API (/v1/messages) {#usage---anthropic-compatible-api-v1messages}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: minimax-m2-5
    litellm_params:
      model: minimax/MiniMax-M2.5
      api_key: os.environ/MINIMAX_API_KEY
      api_base: https://api.minimax.io/anthropic/v1/messages
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e MINIMAX_API_KEY=$MINIMAX_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.81.3-stable \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "minimax-m2-5",
  "max_tokens": 1000,
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

### 搭配 Thinking {#with-thinking}

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "minimax-m2-5",
  "max_tokens": 1000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 1000
  },
  "messages": [
    {
      "role": "user",
      "content": "Solve: 2+2=?"
    }
  ]
}'
```

## 使用方式 - LiteLLM SDK {#usage---litellm-sdk}

### OpenAI 相容 API {#openai-compatible-api}

```python
import litellm

response = litellm.completion(
    model="minimax/MiniMax-M2.5",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ],
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

print(response.choices[0].message.content)
```

### Anthropic 相容 API {#anthropic-compatible-api}

```python
import litellm

response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.5",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/anthropic/v1/messages",
    max_tokens=1000
)

print(response.choices[0].message.content)
```

### 搭配 Thinking {#with-thinking-1}

```python
response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.5",
    messages=[{"role": "user", "content": "Solve: 2+2=?"}],
    thinking={"type": "enabled", "budget_tokens": 1000},
    api_key="your-minimax-api-key"
)

# Access thinking content
for block in response.choices[0].message.content:
    if hasattr(block, 'type') and block.type == 'thinking':
        print(f"Thinking: {block.thinking}")
```

### 搭配 Reasoning Split（OpenAI API） {#with-reasoning-split-openai-api}

```python
response = litellm.completion(
    model="minimax/MiniMax-M2.5",
    messages=[
        {"role": "user", "content": "Solve: 2+2=?"}
    ],
    extra_body={"reasoning_split": True},
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

# Access thinking and response
if hasattr(response.choices[0].message, 'reasoning_details'):
    print(f"Thinking: {response.choices[0].message.reasoning_details}")
print(f"Response: {response.choices[0].message.content}")
```

## 成本追蹤 {#cost-tracking}

LiteLLM 會自動追蹤 MiniMax-M2.5 請求的成本。定價如下：

- **輸入**：$0.3 / 1M tokens
- **輸出**：$1.2 / 1M tokens
- **Cache Read**：$0.03 / 1M tokens
- **Cache Write**：$0.375 / 1M tokens

### 存取成本資訊 {#accessing-cost-information}

```python
response = litellm.completion(
    model="minimax/MiniMax-M2.5",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="your-minimax-api-key"
)

# Access cost information
print(f"Cost: ${response._hidden_params.get('response_cost', 0)}")
```

## 串流支援 {#streaming-support}

### OpenAI API {#openai-api}

```python
response = litellm.completion(
    model="minimax/MiniMax-M2.5",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True,
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### 搭配 Reasoning Split 的串流 {#streaming-with-reasoning-split}

```python
stream = litellm.completion(
    model="minimax/MiniMax-M2.5",
    messages=[
        {"role": "user", "content": "Tell me a story"},
    ],
    extra_body={"reasoning_split": True},
    stream=True,
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

reasoning_buffer = ""
text_buffer = ""

for chunk in stream:
    if hasattr(chunk.choices[0].delta, "reasoning_details") and chunk.choices[0].delta.reasoning_details:
        for detail in chunk.choices[0].delta.reasoning_details:
            if "text" in detail:
                reasoning_text = detail["text"]
                new_reasoning = reasoning_text[len(reasoning_buffer):]
                if new_reasoning:
                    print(new_reasoning, end="", flush=True)
                    reasoning_buffer = reasoning_text

    if chunk.choices[0].delta.content:
        content_text = chunk.choices[0].delta.content
        new_text = content_text[len(text_buffer):] if text_buffer else content_text
        if new_text:
            print(new_text, end="", flush=True)
            text_buffer = content_text
```

## 搭配原生 SDK 使用 {#using-with-native-sdks}

### 透過 LiteLLM Proxy 使用 Anthropic SDK {#anthropic-sdk-via-litellm-proxy}

```python
import os
os.environ["ANTHROPIC_BASE_URL"] = "http://localhost:4000"
os.environ["ANTHROPIC_API_KEY"] = "sk-1234"  # Your LiteLLM proxy key

import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="minimax-m2-5",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)

for block in message.content:
    if block.type == "thinking":
        print(f"Thinking:\n{block.thinking}\n")
    elif block.type == "text":
        print(f"Text:\n{block.text}\n")
```

### 透過 LiteLLM Proxy 使用 OpenAI SDK {#openai-sdk-via-litellm-proxy}

```python
import os
os.environ["OPENAI_BASE_URL"] = "http://localhost:4000"
os.environ["OPENAI_API_KEY"] = "sk-1234"  # Your LiteLLM proxy key

from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="minimax-m2-5",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hi, how are you?"},
    ],
    extra_body={"reasoning_split": True},
)

# Access thinking and response
if hasattr(response.choices[0].message, 'reasoning_details'):
    print(f"Thinking:\n{response.choices[0].message.reasoning_details[0]['text']}\n")
print(f"Text:\n{response.choices[0].message.content}\n")
```
