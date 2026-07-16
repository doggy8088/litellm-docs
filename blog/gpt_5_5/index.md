---
slug: gpt_5_5
title: "Day 0 支援：GPT-5.5 與 GPT-5.5 Pro"
date: 2026-04-24T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM 上 GPT-5.5 與 GPT-5.5 Pro 的 Day 0 支援。"
tags: [openai, gpt-5.5, gpt-5.5-pro, completion, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在在 Day 0 即支援 [GPT-5.5 與 GPT-5.5 Pro](https://openai.com/index/introducing-gpt-5-5/)。透過 LiteLLM AI 閘道將流量路由到 OpenAI 最新的前沿模型，無須變更程式碼。

{/* truncate */}

GPT-5.5 是 OpenAI 迄今為止「最聰明且最直覺易用的模型」，在代理式程式設計、電腦使用與深度研究工作流程上都有顯著提升。根據 OpenAI，相較於 GPT-5.4，它能以更少的 token 更快、更精準地思考。GPT-5.5 Pro 則針對最嚴苛的推理任務。

:::note
**無需升級 Docker 映像檔。** GPT-5.5 透過 LiteLLM 中既有的 `OpenAIGPT5Config` 路由，因此任何近期版本都能直接使用。

若要追蹤成本，請在管理介面中按下 **Reload Model Cost Map** 按鈕（或 `POST /reload/model_cost_map`），即可從 GitHub 取得最新定價。此功能適用於 `v1.76.0` 以上版本。
:::

## 用法 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-5.5
    litellm_params:
      model: openai/gpt-5.5
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.5-pro
    litellm_params:
      model: openai/gpt-5.5-pro
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.83.7-stable \
  --config /app/config.yaml
```

**3. 測試**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.5",
    "messages": [
      {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ]
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-5.5",
    messages=[
        {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ],
)

print(response.choices[0].message.content)
```

```python
# GPT-5.5 Pro
response = completion(
    model="openai/gpt-5.5-pro",
    messages=[
        {"role": "user", "content": "Prove that the sum of two odd integers is even."}
    ],
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 回應 API {#responses-api}

針對代理式與多輪工作流程，請使用 `/v1/responses`，以在各輪之間保留推理狀態與輸出項目中繼資料。

```bash
curl -X POST "http://0.0.0.0:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.5",
    "input": "Plan and write a Python script that scrapes a webpage and summarizes it."
  }'
```

## 推理努力程度 {#reasoning-effort}

`reasoning_effort` 控制模型套用多少思考。各模型支援的值（已於 2026-04-24 依 OpenAI 線上 API 驗證）：

| 模型 | Default | Allowed values |
|-------|---------|----------------|
| `gpt-5.5` | `medium` | `none`, `low`, `medium`, `high`, `xhigh` |
| `gpt-5.5-pro` | `high` | `medium`, `high`, `xhigh` |

```python
from litellm import completion

response = completion(
    model="openai/gpt-5.5",
    messages=[{"role": "user", "content": "Solve: what is the optimal strategy for..."}],
    reasoning_effort="high",
)
```

LiteLLM 會在本地強制執行這些上限——傳入不支援的值（例如 `minimal`）時，會直接擲出 `UnsupportedParamsError`，而不是轉送到 OpenAI 再回傳 400。

## 附註 {#notes}

- 針對 `gpt-5.5` 與 `gpt-5.5-pro` 的成本追蹤，請在管理介面中按下 **Reload Model Cost Map** 按鈕（或 `POST /reload/model_cost_map`）。在任何 `v1.76.0` 或更新版本的 LiteLLM 上都可運作——無需重新啟動容器或升級映像檔。
- `gpt-5.5-pro` 是僅支援 Responses API 的模型（`mode: "responses"`）。LiteLLM 的 Responses API 橋接會透明地將 `completion()` 呼叫轉換為 `/v1/responses`，因此上方的 SDK 範例無需變更程式碼即可運作。
- GPT-5.5 支援推理、函式呼叫、平行工具呼叫、視覺（影像輸入）、PDF 輸入、prompt 快取、網頁搜尋與結構化輸出——請參閱 [OpenAI 提供者文件](../../docs/providers/openai) 以了解進階用法。
- Context window：1.05M 輸入 token / 128K 輸出 token。超過 272K token 後會套用長上下文級距定價。
- Azure 可用性：尚未提供——本篇文章僅涵蓋直接使用 OpenAI。
