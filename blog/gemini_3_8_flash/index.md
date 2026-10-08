---
slug: gemini_3_8_flash
title: "支援第 0 天：Gemini 3.8 Flash"
date: 2026-09-02T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM 對 Gemini 3.8 Flash 的第 0 天支援，並追蹤 Google AI Studio 與 Vertex AI 的上市定價。"
image: ./hero.png
tags: [gemini, gemini-3.8-flash, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 與 Gemini 3.8 Flash](./hero.png)

# Gemini 3.8 Flash 第 0 天支援 {#gemini-38-flash-day-0-support}

LiteLLM 現在在第 0 天就支援 `gemini-3.8-flash`，涵蓋 Google AI Studio（`gemini/`）與 Vertex AI（`vertex_ai/`）。Google 將其最新的 Flash 模型稱為主要通用模型，在長期軟體工程、代理式任務與多步驟推理方面，相較於 3.7 Flash 有所提升；而在 DeepSWE v1.1 上，它以僅一小部分成本超越了大多數更大型的前沿模型。

{/* truncate */}

:::note
**無需升級 Docker 映像。** Gemini 3.8 Flash 會透過既有的 Gemini 設定路由，因此任何近期版本的 LiteLLM 都能立即用於推理。若要進行成本追蹤，請在 Admin UI 中點擊 **重新載入模型成本對照表** 按鈕（或 `POST /reload/model_cost_map`），以從 GitHub 取得最新定價。此功能可在 `v1.76.0` 及以上版本使用。`gemini-3.8-flash` 的定價與中繼資料也已隨附給使用 `LITELLM_LOCAL_MODEL_COST_MAP=true` 運行的使用者，從下一個 dev 標記 `v1.101.0-dev.2` 開始，以及 `v1.101.0-rc.1` RC。
:::

## 上市定價 {#launch-pricing}

Gemini 3.8 Flash 以 50% 折扣上市，優惠期間至 2026 年 12 月 31 日。自 2027 年 1 月 1 日起適用標準定價。LiteLLM 依優惠費率追蹤成本。

| | 優惠價 | 標準價 |
|---|---|---|
| 輸入 | $0.75 / 100 萬 tokens | $1.50 / 100 萬 tokens |
| 輸出 | $3.75 / 100 萬 tokens | $7.50 / 100 萬 tokens |

快取讀取、批次、flex 與 priority 級別按比例折扣。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.8-flash",
    messages=[{"role": "user", "content": "Summarize this article in 3 bullet points."}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.8-flash
    litellm_params:
      model: gemini/gemini-3.8-flash
      api_key: os.environ/GEMINI_API_KEY

  # Or use Vertex AI
  - model_name: vertex-gemini-3.8-flash
    litellm_params:
      model: vertex_ai/gemini-3.8-flash
      vertex_project: your-project-id
      vertex_location: us-central1
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 發送請求**

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.8-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

</TabItem>
</Tabs>

## 思考層級 {#thinking-levels}

Gemini 3.8 Flash 是一個推理模型，且預設會思考。LiteLLM 會將 OpenAI `reasoning_effort` 對應到 Gemini 的 `thinkingLevel`，因此您對其他推理模型所使用的相同請求格式也可在此使用。

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.8-flash",
    messages=[{"role": "user", "content": "What's 2+2?"}],
    reasoning_effort="low",
)

print(response.choices[0].message.content)
```

:::warning[已知的上市限制]
`minimal` 思考層級不支援 `gemini-3.8-flash`，與 3.7 Flash 相同。Gemini API 會回傳 400（`Thinking level MINIMAL is not supported for this model`）。`low`、`medium` 與 `high` 層級可如預期運作。
:::

## 支援的端點 {#supported-endpoints}

LiteLLM 為 Gemini 3.8 Flash 提供完整的端到端支援，涵蓋：

- `/v1/chat/completions` - 相容 OpenAI 的 chat completions 端點
- `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- [`/v1/messages`](/docs/anthropic_unified) - 相容 Anthropic 的 messages 端點
- `/v1/generateContent` - 相容 [Google Gemini API](/docs/generateContent) 的端點

所有端點都支援串流與非串流回應、包含 thought signatures 的 function calling、多輪對話，以及完整的多模態輸入（文字、圖片、音訊、影片）。

## 回饋 {#feedback}

透過 LiteLLM 執行 Gemini 3.8 Flash 時遇到意料之外的情況嗎？請在 [GitHub discussion #39357](https://github.com/BerriAI/litellm/discussions/39357) 分享。
