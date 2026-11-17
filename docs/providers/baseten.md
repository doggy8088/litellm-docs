---
title: "Baseten API 與 LiteLLM：Python SDK 與 Gateway"
sidebar_label: "Baseten"
description: "透過 Python SDK 或 AI Gateway 呼叫 Baseten Model API 與專屬部署，包含 gpt-oss-120b 範例、串流、-latest 別名與 /v1/responses。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Baseten {#baseten}

LiteLLM 同時支援 Baseten Model API 與具備自動路由的專屬部署。

## API 類型 {#api-types}

### Model API（預設） {#model-api-default}
- **URL**: `https://inference.baseten.co/v1`
- **格式**: `baseten/<model-name>`（例如，`baseten/openai/gpt-oss-120b`）
- **最適合**: 快速存取熱門模型

### 專屬部署 {#dedicated-deployments}
- **URL**: `https://model-{id}.api.baseten.co/environments/production/sync/v1`
- **格式**: `baseten/{8-digit-alphanumeric-code}`（例如，`baseten/abcd1234`）
- **最適合**: 自訂模型、延遲 SLA

:::tip
**自動路由**：LiteLLM 會根據模型格式偵測類型：
- 8 位英數代碼 → 專屬部署
- 其他所有格式 → Model API
:::

## 快速開始 {#quick-start}

```python
import os
from litellm import completion

os.environ['BASETEN_API_KEY'] = "your-api-key"

# Model API (default)
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Dedicated deployment (8-digit ID)
response = completion(
    model="baseten/abcd1234",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## 範例 {#examples}

### 基本用法 {#basic-usage}
```python
# Model API
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    max_tokens=500,
    temperature=0.7
)

# Dedicated deployment
response = completion(
    model="baseten/abcd1234",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    max_tokens=500,
    temperature=0.7
)
```

### 串流（僅限 Model API） {#streaming-model-api-only}
```python
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True,
    stream_options={"include_usage": True}
)

for chunk in response:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

## 與 LiteLLM Proxy 一起使用 {#usage-with-litellm-proxy}

1. **設定**：
```yaml
model_list:
  - model_name: baseten-model
    litellm_params:
      model: baseten/openai/gpt-oss-120b
      api_key: your-baseten-api-key
```

2. **請求**：
```python
import openai
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="baseten-model",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

`baseten/<family>-latest` 名稱會跟隨某個模型家族，當 LiteLLM 將它們移至較新的模型時，您的應用程式可以維持使用同一個模型字串。您可以像使用其他任何 Baseten 模型名稱一樣使用它們。LiteLLM 會將目前的目標模型傳送給 Baseten，並依該模型的價格計費。別名的運作方式以及各提供者的完整清單，請參閱[最新模型別名](../model_latest_aliases.md)。

| 別名 | 模型家族 |
| --- | --- |
| `baseten/kimi-latest` | Kimi |
| `baseten/glm-latest` | GLM |
| `baseten/glm-flash-latest` | GLM Flash |
| `baseten/deepseek-pro-latest` | DeepSeek Pro |
| `baseten/deepseek-flash-latest` | DeepSeek Flash |

## Responses API 支援（`/v1/responses`） {#responses-api-v1responses}

Baseten 的 Model API 本身即提供 `/v1/responses` 服務。若要將 `/v1/responses` 請求不經轉換直接轉送給它，而不是透過 `/v1/chat/completions` 橋接，請在該部署的 `model_info` 下加入 `supported_endpoints: ["/v1/responses"]`，請參閱[原生 /v1/responses 直通](../response_api_native_passthrough.md)。
