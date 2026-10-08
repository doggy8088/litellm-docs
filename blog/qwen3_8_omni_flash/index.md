---
slug: qwen3_8_omni_flash
title: "支援首日：Qwen3.8-Omni-Flash"
date: 2026-09-18T10:00:00
image: ./hero.png
authors:
  - misbah
  - mateo
description: "LiteLLM 對 Qwen3.8-Omni-Flash 的支援首日，支援文字、圖片、音訊和影片輸入。"
tags: [qwen, dashscope, qwen3.8-omni-flash, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Qwen3.8-Omni-Flash](./hero.png)

LiteLLM 透過 DashScope 提供者於支援首日支援 `qwen3.8-omni-flash`，支援文字、圖片、音訊和影片輸入，以及文字輸出。音訊和影片內容部分會直接通過，因此 OpenAI 形式的請求可直接使用。

{/* truncate */}

Qwen 稱其為首個以代理式工作為核心打造的 omni model。它會同時對音訊和影片進行推理，並在長時間作業中呼叫工具，例如編輯 vlog 或為影片做摘要。它具有 1M-token 的 context window 和 131K 的最大輸出，而 Qwen 將影片輸入的價格訂為比 Qwen3.5-Omni-Plus 便宜約 89%。

## 定價 {#pricing}

每 1M token，International：輸入 $0.15、快取輸入 $0.016、輸出 $0.47。定價已納入 [PR #41754](https://github.com/BerriAI/litellm/pull/41754)；未納入前，請求路由可正常運作，但會記錄 $0 的支出。請在 Admin UI 中按 **Reload Model Cost Map**，或執行 `POST /reload/model_cost_map`，即可在 `v1.76.0` 及以上版本不需重新部署就取得更新。

## 使用方式 {#usage}

LiteLLM 的 DashScope 提供者預設使用中國大陸端點。若為 International 帳號，請將 `api_base` 設為 `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`，如下所示。音訊需以 `data:;base64,` URL 傳入，而不是 OpenAI 可接受的原始 base64。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import base64
from litellm import completion

audio = base64.b64encode(open("clip.wav", "rb").read()).decode()

response = completion(
    model="dashscope/qwen3.8-omni-flash",
    api_base="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    messages=[{"role": "user", "content": [
        {"type": "input_audio", "input_audio": {"data": "data:;base64," + audio, "format": "wav"}},
        {"type": "text", "text": "Summarize this clip in one sentence."},
    ]}],
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml
model_list:
  - model_name: qwen3.8-omni-flash
    litellm_params:
      model: dashscope/qwen3.8-omni-flash
      api_base: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
      api_key: os.environ/DASHSCOPE_API_KEY
```

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "qwen3.8-omni-flash",
    "messages": [{"role": "user", "content": "what llm are you"}]
  }'
```

</TabItem>
</Tabs>

## 回饋 {#feedback}

透過 LiteLLM 執行 Qwen3.8-Omni-Flash 時遇到意料之外的情況嗎？請在 [GitHub discussion #41845](https://github.com/BerriAI/litellm/discussions/41845) 分享。
