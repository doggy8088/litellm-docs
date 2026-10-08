# Topaz {#topaz}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 由 AI 驅動的專業級相片與影片編輯。 |
| LiteLLM 提供者路由 | `topaz/` |
| 提供者文件 | [Topaz ↗](https://www.topazlabs.com/enhance-api) |
| 提供者 API 端點 | https://api.topazlabs.com |
| 支援的 OpenAI 端點 | `/image/variations` |

## 快速開始 {#quick-start}

```python
from litellm import image_variation
import os 

os.environ["TOPAZ_API_KEY"] = ""
response = image_variation(
    model="topaz/Standard V2", image=image_url
)
```

## 支援的 OpenAI 參數 {#supported-openai-params}

- `response_format`
- `size` (寬x高)
