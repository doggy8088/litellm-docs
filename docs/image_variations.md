# [BETA] 圖片變體 {#beta-image-variations}

現在已支援 OpenAI 的 `/image/variations` 端點。

## 快速開始 {#quick-start}

```python
from litellm import image_variation
import os 

# set env vars 
os.environ["OPENAI_API_KEY"] = ""
os.environ["TOPAZ_API_KEY"] = ""

# openai call
response = image_variation(
    model="dall-e-2", image=image_url
)

# topaz call
response = image_variation(
    model="topaz/Standard V2", image=image_url
)

print(response)
```

## 支援的提供者 {#supported-providers}

- OpenAI
- Topaz
