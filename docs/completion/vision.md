import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Vision 模型 {#using-vision-models}

## 快速入門 {#quick-start}
將圖片傳遞給模型的範例

<Tabs>

<TabItem label="LiteLLMPython SDK" value="Python">

```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "gpt-4-vision-preview", 
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png"
                                }
                            }
                        ]
        }
    ],
)

```

</TabItem>
<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 上定義 vision 模型

```yaml
model_list:
  - model_name: gpt-4-vision-preview # OpenAI gpt-4-vision-preview
    litellm_params:
      model: openai/gpt-4-vision-preview
      api_key: os.environ/OPENAI_API_KEY
  - model_name: llava-hf          # Custom OpenAI compatible model
    litellm_params:
      model: openai/llava-hf/llava-v1.6-vicuna-7b-hf
      api_base: http://localhost:8000
      api_key: fake-key
    model_info:
      supports_vision: True        # set supports_vision to True so /model/info returns this attribute as True

```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 測試它

```python
import os 
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234", # your litellm proxy api key
)

response = client.chat.completions.create(
    model = "gpt-4-vision-preview",  # use model="llava-hf" to test your custom OpenAI endpoint
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png"
                                }
                            }
                        ]
        }
    ],
)

```


</TabItem>
</Tabs>

## 檢查模型是否支援 `vision` {#checking-if-a-model-supports-vision}

<Tabs>
<TabItem label="LiteLLM Python SDK" value="Python">

使用 `litellm.supports_vision(model="")` -> 若模型支援 `vision` 則回傳 `True`，若不支援則回傳 `False`

```python
assert litellm.supports_vision(model="openai/gpt-4-vision-preview") == True
assert litellm.supports_vision(model="vertex_ai/gemini-1.0-pro-vision") == True
assert litellm.supports_vision(model="openai/gpt-3.5-turbo") == False
assert litellm.supports_vision(model="xai/grok-2-vision-latest") == True
assert litellm.supports_vision(model="xai/grok-2-latest") == False
```
</TabItem>

<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 上定義 vision 模型

```yaml
model_list:
  - model_name: gpt-4-vision-preview # OpenAI gpt-4-vision-preview
    litellm_params:
      model: openai/gpt-4-vision-preview
      api_key: os.environ/OPENAI_API_KEY
  - model_name: llava-hf          # Custom OpenAI compatible model
    litellm_params:
      model: openai/llava-hf/llava-v1.6-vicuna-7b-hf
      api_base: http://localhost:8000
      api_key: fake-key
    model_info:
      supports_vision: True        # set supports_vision to True so /model/info returns this attribute as True
```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 呼叫 `/model_group/info` 以檢查您的模型是否支援 `vision`

```shell
curl -X 'GET' \
  'http://localhost:4000/model_group/info' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-1234'
```

預期回應

```json
{
  "data": [
    {
      "model_group": "gpt-4-vision-preview",
      "providers": ["openai"],
      "max_input_tokens": 128000,
      "max_output_tokens": 4096,
      "mode": "chat",
      "supports_vision": true, # 👈 supports_vision is true
      "supports_function_calling": false
    },
    {
      "model_group": "llava-hf",
      "providers": ["openai"],
      "max_input_tokens": null,
      "max_output_tokens": null,
      "mode": null,
      "supports_vision": true, # 👈 supports_vision is true
      "supports_function_calling": false
    }
  ]
}
```

</TabItem>
</Tabs>

## 明確指定影像類型  {#explicitly-specify-image-type}

如果您有沒有 mime-type 的圖片，或是 litellm 錯誤地推斷了您圖片的 mime type（例如在 vertex ai 中呼叫 `gs://` 的網址），您可以透過 `format` 參數明確設定。 

```python
"image_url": {
  "url": "gs://my-gs-image",
  "format": "image/jpeg"
}
```

LiteLLM 會將其用於任何支援指定 mime-type 的 API 端點（例如 anthropic/bedrock/vertex ai）。 

對於其他端點（例如 openai），則會忽略。 

<Tabs>
<TabItem label="SDK" value="sdk">

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "claude-3-7-sonnet-latest", 
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                  "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png",
                                  "format": "image/jpeg"
                                }
                            }
                        ]
        }
    ],
)

```

</TabItem>
<TabItem label="PROXY" value="proxy">

1. 在 config.yaml 上定義 vision 模型

```yaml
model_list:
  - model_name: gpt-4-vision-preview # OpenAI gpt-4-vision-preview
    litellm_params:
      model: openai/gpt-4-vision-preview
      api_key: os.environ/OPENAI_API_KEY
  - model_name: llava-hf          # Custom OpenAI compatible model
    litellm_params:
      model: openai/llava-hf/llava-v1.6-vicuna-7b-hf
      api_base: http://localhost:8000
      api_key: fake-key
    model_info:
      supports_vision: True        # set supports_vision to True so /model/info returns this attribute as True

```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 測試它

```python
import os 
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234", # your litellm proxy api key
)

response = client.chat.completions.create(
    model = "gpt-4-vision-preview",  # use model="llava-hf" to test your custom OpenAI endpoint
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png",
                                "format": "image/jpeg"
                                }
                            }
                        ]
        }
    ],
)

```


</TabItem>
</Tabs>

## 規格  {#spec}

```
"image_url": str

OR 

"image_url": {
  "url": "url OR base64 encoded str",
  "detail": "openai-only param", 
  "format": "specify mime-type of image"
}
```
