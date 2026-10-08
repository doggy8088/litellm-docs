---
slug: nano_banana_2_1
title: "Day 0 支援：Nano Banana 2.1"
date: 2026-10-06T18:00:00
image: ./hero.png
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM 上 Google AI Studio 與 Gemini Enterprise Agent Platform 的 Gemini Nano Banana 2.1 Day 0 支援，提供的影像輸出價格僅為 Nano Banana 2 的一半。"
tags: [gemini, gemini enterprise agent platform, nano banana, image generation, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 與 Nano Banana 2.1](./hero.png)

LiteLLM 支援 `gemini-nano-banana-2.1` 的 Day 0 支援，適用於 Google AI Studio（`gemini/`）與 Gemini Enterprise Agent Platform，前身為 Vertex AI（`vertex_ai/`），透過 `/v1/images/generations`、`/v1/images/edits` 和 `/chat/completions`。它取代了 Nano Banana 2（`gemini-3.1-flash-image`），Gemini API 將於 2026 年 10 月 29 日停止支援該版本。

{/* truncate */}

[依據 Google](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1)，Nano Banana 2.1 在 1K、2K 與 4K 解析度下提升視覺品質與文字渲染，修正寬高比很寬時的平鋪問題，最多可使用 14 張參考圖片，並支援 Search grounding 與可設定的思考層級。

:::note
**無需升級 Docker 映像檔。** 在 Admin UI 中（或 `POST /reload/model_cost_map`）按下 **Reload Model Cost Map**，即可取得定價，適用於 `v1.76.0` 及以上版本。
:::

## 定價 {#pricing}

- 影像輸出：$30 / MTok（每 1K 影像 $0.0336）
- 文字輸入：$1.50 / MTok
- 文字輸出：$7.50 / MTok

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: nano-banana-2.1
    litellm_params:
      model: gemini/gemini-nano-banana-2.1
      api_key: os.environ/GEMINI_API_KEY
  - model_name: nano-banana-2.1-agent-platform
    litellm_params:
      model: vertex_ai/gemini-nano-banana-2.1
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: global
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試**

```bash
curl http://0.0.0.0:4000/v1/images/generations \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nano-banana-2.1",
    "prompt": "A product shot of a ceramic mug on a walnut desk, soft morning light"
  }'
```

</TabItem>

<TabItem value="sdk" label="SDK">

```python
import litellm

response = litellm.image_generation(
    model="gemini/gemini-nano-banana-2.1",
    prompt="A product shot of a ceramic mug on a walnut desk, soft morning light",
)

print(response.data[0].b64_json[:64])
```

</TabItem>
</Tabs>

## 回饋 {#feedback}

問題與回饋請至 [GitHub 討論 #44983](https://github.com/BerriAI/litellm/discussions/44983)。
