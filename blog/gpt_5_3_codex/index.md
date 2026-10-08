---
slug: gpt_5_3_codex
title: "Day 0 支援：GPT-5.3-Codex"
date: 2026-02-24T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "LiteLLM 對 GPT-5.3-Codex 的 Day 0 支援，包括 Responses API 的 phase 參數處理。"
tags: [openai, gpt-5.3-codex, codex, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在在 Day 0 即支援 GPT-5.3-Codex，並支援 Responses API 輸出項目中的新 assistant `phase` 中繼資料。

{/* truncate */}

## 為什麼 `phase` 對 GPT-5.3-Codex 很重要 {#why-phase-matters-for-gpt-53-codex}

`phase` 會出現在 assistant 輸出項目上，有助於區分前言／說明回合與最終收尾回應。

參考：[Phase 參數文件](https://developers.openai.com/api/reference/overview)

支援的值：
- `null`
- `"commentary"`
- `"final_answer"`

重要：
- 請將帶有 `phase` 的 assistant 輸出項目依原樣儲存。
- 在下一輪請將那些 assistant 項目傳回。
- **不要** 將 `phase` 加到 user 訊息中。

## Docker 映像 {#docker-image}

```bash
docker pull ghcr.io/berriai/litellm:v1.81.12-stable.gpt-5.3
```

## 使用方式  {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-5.3-codex
    litellm_params:
      model: openai/gpt-5.3-codex
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.81.12-stable.gpt-5.3 \
  --config /app/config.yaml
```


**3. 測試它**

```bash
curl -X POST "http://0.0.0.0:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.3-codex",
    "input": "Write a Python script that checks if a number is prime."
  }'
```

</TabItem>
</Tabs>

## Python 範例：使用 OpenAI Client + LiteLLM Base URL 保留 `phase` {#python-example-persist-phase-with-openai-client--litellm-base-url}

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000/v1",  # LiteLLM Proxy
    api_key="your-litellm-api-key",
)

items = []  # Persist this per conversation/thread


def _item_get(item, key, default=None):
    if isinstance(item, dict):
        return item.get(key, default)
    return getattr(item, key, default)


def run_turn(user_text: str):
    global items

    # User message: no phase field
    items.append(
        {
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": user_text}],
        }
    )

    resp = client.responses.create(
        model="gpt-5.3-codex",
        input=items,
    )

    # Persist assistant output items verbatim, including phase
    for out_item in (resp.output or []):
        items.append(out_item)

    # Optional: inspect latest phase for UI/telemetry routing
    latest_phase = None
    for out_item in reversed(resp.output or []):
        if _item_get(out_item, "type") == "output_item.done" and _item_get(out_item, "phase") is not None:
            latest_phase = _item_get(out_item, "phase")
            break

    return resp, latest_phase
```

## 注意事項 {#notes}

- GPT Codex models 請使用 `/v1/responses`。
- 為獲得最佳多輪行為，請保留完整的 assistant 輸出歷史。
- 如果在重建歷史時遺失 `phase` 中繼資料，長時間執行的任務中輸出品質可能會下降。
