---
slug: gemini_3_7_flash
title: "第 0 天支援：Gemini 3.7 Flash"
date: 2026-08-13T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM 對 Gemini 3.7 Flash 的第 0 天支援，並追蹤 Google AI Studio 與 Vertex AI 的上市定價。"
image: ./hero.png
tags: [gemini, gemini-3.7-flash, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Gemini 3.7 Flash](./hero.png)

# Gemini 3.7 Flash 第 0 天支援 {#gemini-37-flash-day-0-support}

LiteLLM 現在在第 0 天就支援 `gemini-3.7-flash`，可在 Google AI Studio（`gemini/`）與 Vertex AI（`vertex_ai/`）上使用。Google 最新的 Flash 模型可提供更快的回應，品質比 3.6 Flash 明顯更好，且在複雜的多步驟代理式、程式碼與推理基準測試中得分更高。

{/* truncate */}

:::note
**不需要升級 Docker 映像。** Gemini 3.7 Flash 會透過現有的 Gemini 設定進行路由，因此任何近期版本的 LiteLLM 都可直接用於推論。若要追蹤成本，請在管理介面中點擊 **Reload Model Cost Map** 按鈕（或 `POST /reload/model_cost_map`）以從 GitHub 取得最新定價。這項功能在 `v1.76.0` 及以上版本可用。從 `v1.98.0-dev.2` 開始，`gemini-3.7-flash` 的定價與中繼資料也會隨附提供，適用於任何使用 `LITELLM_LOCAL_MODEL_COST_MAP=true` 執行的人。
:::

## 上市定價 {#launch-pricing}

Gemini 3.7 Flash 上市期間提供 50% 折扣，至 2026 年 12 月 31 日止。LiteLLM 以促銷費率計算成本。

| | 促銷價 | 標準價 |
|---|---|---|
| 輸入 | $0.75 / 1M tokens | $1.50 / 1M tokens |
| 輸出 | $3.75 / 1M tokens | $7.50 / 1M tokens |

快取讀取、批次、彈性與優先層級皆按比例折扣。

## 快速入門 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.7-flash",
    messages=[{"role": "user", "content": "Summarize this article in 3 bullet points."}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.7-flash
    litellm_params:
      model: gemini/gemini-3.7-flash
      api_key: os.environ/GEMINI_API_KEY

  # Or use Vertex AI
  - model_name: vertex-gemini-3.7-flash
    litellm_params:
      model: vertex_ai/gemini-3.7-flash
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
    "model": "gemini-3.7-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

</TabItem>
</Tabs>

## 思考層級 {#thinking-levels}

Gemini 3.7 Flash 是一個推理模型。LiteLLM 會將 OpenAI `reasoning_effort` 對應到 Gemini 的 `thinkingLevel`，因此您在其他推理模型上使用的相同請求格式也可在這裡使用。

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.7-flash",
    messages=[{"role": "user", "content": "What's 2+2?"}],
    reasoning_effort="low",
)

print(response.choices[0].message.content)
```

:::warning[已知的上市限制]
尚未支援 `minimal` 思考層級於 `gemini-3.7-flash` 上使用。Gemini API 會回傳 400（`Thinking level MINIMAL is not supported for this model`）。Google 計畫以快速後續更新方式提供最小思考支援。其他所有思考層級都可如預期運作。
:::

## 支援的端點 {#supported-endpoints}

LiteLLM 為 Gemini 3.7 Flash 提供完整的端到端支援，適用於：

- `/v1/chat/completions` - 相容於 OpenAI 的 chat completions 端點
- `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- [`/v1/messages`](/docs/anthropic_unified) - 相容於 Anthropic 的 messages 端點
- `/v1/generateContent` - 相容於 [Google Gemini API](/docs/generateContent) 的端點

所有端點都支援串流與非串流回應、帶有 thought signatures 的 function calling、多輪對話，以及完整的多模態輸入（文字、圖片、音訊、影片）。

## 回饋 {#feedback}

透過 LiteLLM 執行 Gemini 3.7 Flash 時遇到意外情況嗎？請在 [GitHub discussion #36799](https://github.com/BerriAI/litellm/discussions/36799) 分享。
