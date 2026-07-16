import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Audio 模型 {#using-audio-models}

如何向 `/chat/completions` 端點傳送 / 接收 audio

## 模型的 Audio 輸出 {#audio-output-from-a-model}

將提示詞轉換為類人音訊回應的範例

<Tabs>

<TabItem label="LiteLLM Python SDK" value="Python">

```python
import os 
import base64
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
completion = await litellm.acompletion(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[{"role": "user", "content": "Is a golden retriever a good family dog?"}],
)

wav_bytes = base64.b64decode(completion.choices[0].message.audio.data)
with open("dog.wav", "wb") as f:
    f.write(wav_bytes)
```

</TabItem>
<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 上定義 audio 模型

```yaml
model_list:
  - model_name: gpt-4o-audio-preview # OpenAI gpt-4o-audio-preview
    litellm_params:
      model: openai/gpt-4o-audio-preview
      api_key: os.environ/OPENAI_API_KEY 

```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 進行測試

```python
import base64
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-1234
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)

completion = client.chat.completions.create(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": "Is a golden retriever a good family dog?"
        }
    ]
)

print(completion.choices[0])

wav_bytes = base64.b64decode(completion.choices[0].message.audio.data)
with open("dog.wav", "wb") as f:
    f.write(wav_bytes)

```


</TabItem>
</Tabs>

## 模型的 Audio 輸入 {#audio-input-to-a-model}

<Tabs>

<TabItem label="LiteLLM Python SDK" value="Python">

```python
import base64
import requests

url = "https://openaiassets.blob.core.windows.net/$web/API/docs/audio/alloy.wav"
response = requests.get(url)
response.raise_for_status()
wav_data = response.content
encoded_string = base64.b64encode(wav_data).decode("utf-8")

completion = litellm.completion(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this recording?"},
                {
                    "type": "input_audio",
                    "input_audio": {"data": encoded_string, "format": "wav"},
                },
            ],
        },
    ],
)

print(completion.choices[0].message)
```

</TabItem>

<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 上定義 audio 模型

```yaml
model_list:
  - model_name: gpt-4o-audio-preview # OpenAI gpt-4o-audio-preview
    litellm_params:
      model: openai/gpt-4o-audio-preview
      api_key: os.environ/OPENAI_API_KEY 

```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 進行測試

```python
import base64
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-1234
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)


# Fetch the audio file and convert it to a base64 encoded string
url = "https://openaiassets.blob.core.windows.net/$web/API/docs/audio/alloy.wav"
response = requests.get(url)
response.raise_for_status()
wav_data = response.content
encoded_string = base64.b64encode(wav_data).decode('utf-8')

completion = client.chat.completions.create(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": [
                { 
                    "type": "text",
                    "text": "What is in this recording?"
                },
                {
                    "type": "input_audio",
                    "input_audio": {
                        "data": encoded_string,
                        "format": "wav"
                    }
                }
            ]
        },
    ]
)

print(completion.choices[0].message)
```


</TabItem>
</Tabs>

## 檢查模型是否支援 `audio_input` 與 `audio_output` {#checking-if-a-model-supports-audio_input-and-audio_output}

<Tabs>
<TabItem label="LiteLLM Python SDK" value="Python">

使用 `litellm.supports_audio_output(model="")` -> 若模型可產生 audio 輸出，則回傳 `True`

使用 `litellm.supports_audio_input(model="")` -> 若模型可接受 audio 輸入，則回傳 `True`

```python
assert litellm.supports_audio_output(model="gpt-4o-audio-preview") == True
assert litellm.supports_audio_input(model="gpt-4o-audio-preview") == True

assert litellm.supports_audio_output(model="gpt-3.5-turbo") == False
assert litellm.supports_audio_input(model="gpt-3.5-turbo") == False
```
</TabItem>

<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 上定義 vision 模型

```yaml
model_list:
  - model_name: gpt-4o-audio-preview # OpenAI gpt-4o-audio-preview
    litellm_params:
      model: openai/gpt-4o-audio-preview
      api_key: os.environ/OPENAI_API_KEY
  - model_name: llava-hf          # Custom OpenAI compatible model
    litellm_params:
      model: openai/llava-hf/llava-v1.6-vicuna-7b-hf
      api_base: http://localhost:8000
      api_key: fake-key
    model_info:
      supports_audio_output: True        # set supports_audio_output to True so /model/info returns this attribute as True
      supports_audio_input: True         # set supports_audio_input to True so /model/info returns this attribute as True
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
      "model_group": "gpt-4o-audio-preview",
      "providers": ["openai"],
      "max_input_tokens": 128000,
      "max_output_tokens": 16384,
      "mode": "chat",
      "supports_audio_output": true, # 👈 supports_audio_output is true
      "supports_audio_input": true, # 👈 supports_audio_input is true
    },
    {
      "model_group": "llava-hf",
      "providers": ["openai"],
      "max_input_tokens": null,
      "max_output_tokens": null,
      "mode": null,
      "supports_audio_output": true, # 👈 supports_audio_output is true
      "supports_audio_input": true, # 👈 supports_audio_input is true
    }
  ]
}
```

</TabItem>
</Tabs>

## 含 Audio 的回應格式 {#response-format-with-audio}

以下是當您向模型傳送 audio 輸入時，可能會從 `/chat/completions` 端點收到的 `message` JSON 資料結構範例。

```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": null,
    "refusal": null,
    "audio": {
      "id": "audio_abc123",
      "expires_at": 1729018505,
      "data": "<bytes omitted>",
      "transcript": "Yes, golden retrievers are known to be ..."
    }
  },
  "finish_reason": "stop"
}
```
- `audio` 如果請求了 audio 輸出模式，則此物件包含來自模型的 audio 回應資料
    - `audio.id` audio 回應的唯一識別碼
    - `audio.expires_at` 此 audio 回應在伺服器上對於多輪對話不再可用的 Unix 時間戳記（以秒為單位）。
    - `audio.data` 由模型產生的 Base64 編碼 audio 位元組，格式如請求中所指定。
    - `audio.transcript` 由模型產生的 audio 逐字稿。
