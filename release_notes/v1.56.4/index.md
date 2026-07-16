---
title: v1.56.4
slug: v1.56.4
date: 2024-12-29T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [deepgram, fireworks ai, vision, admin ui, dependency upgrades]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';


`deepgram`, `fireworks ai`, `vision`, `admin ui`, `dependency upgrades`

## 新模型 {#new-models}

### **Deepgram 語音轉文字** {#deepgram-speech-to-text}

新增對 Deepgram 模型的 Speech to Text 支援。[**從這裡開始**](https://docs.litellm.ai/docs/providers/deepgram)

```python
from litellm import transcription
import os 

# set api keys 
os.environ["DEEPGRAM_API_KEY"] = ""
audio_file = open("/path/to/audio.mp3", "rb")

response = transcription(model="deepgram/nova-2", file=audio_file)

print(f"response: {response}")
```

### **Fireworks AI - Vision** 支援所有模型 {#fireworks-ai---vision-support-for-all-models}
LiteLLM 支援 Fireworks AI 模型的文件內嵌。這對於不是 vision 模型、但仍需要解析文件/圖片/等內容的模型很有用。
如果模型不是 vision 模型，LiteLLM 會在 image_url 的網址後面加上 `#transform=inline` [查看程式碼](https://github.com/BerriAI/litellm/blob/1ae9d45798bdaf8450f2dfdec703369f3d2212b7/litellm/llms/fireworks_ai/chat/transformation.py#L114)

## Proxy 管理 UI {#proxy-admin-ui}

- `Test Key` 分頁會顯示回應中使用的 `model`

<Image img={require('../../img/release_notes/ui_model.png')} />

- `Test Key` 分頁會以 `.md`、`.py`（任何程式碼／markdown 格式）呈現內容

<Image img={require('../../img/release_notes/ui_format.png')} />

## 相依性升級 {#dependency-upgrades}

- （安全性修正）升級至 `fastapi==0.115.5` https://github.com/BerriAI/litellm/pull/7447

## 錯誤修正 {#bug-fixes}

- 新增對即時模型的健康檢查支援 [這裡](https://docs.litellm.ai/docs/proxy/health#realtime-models)
- audio_transcription 模型的健康檢查錯誤 https://github.com/BerriAI/litellm/issues/5999
