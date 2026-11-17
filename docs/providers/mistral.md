---
title: "透過 LiteLLM AI Gateway 使用 Mistral AI API"
sidebar_label: "Mistral AI"
description: "呼叫 Mistral Large、Codestral 與 Magistral，支援工具呼叫與 reasoning effort；使用 Voxtral 轉錄音訊、複製聲音進行語音合成，並嵌入文字。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Mistral AI API {#mistral-ai-api}

Mistral AI 透過 Mistral API 提供其聊天、推理、嵌入與音訊模型；LiteLLM 會從 Python SDK 或 AI Gateway 以 `mistral/` 前綴呼叫它們。
https://docs.mistral.ai/api/

## API 金鑰 {#api-key}
```python
# env variable
os.environ['MISTRAL_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = ""
response = completion(
    model="mistral/mistral-tiny", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = ""
response = completion(
    model="mistral/mistral-tiny", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 搭配 LiteLLM Proxy 使用  {#usage-with-litellm-proxy}

### 1. 在 config.yaml 中設定 Mistral 模型 {#1-set-mistral-models-on-configyaml}

```yaml
model_list:
  - model_name: mistral-small-latest
    litellm_params:
      model: mistral/mistral-small-latest
      api_key: "os.environ/MISTRAL_API_KEY" # ensure you have `MISTRAL_API_KEY` in your .env
```

### 2. 啟動 Proxy  {#2-start-proxy}

```
litellm --config config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "mistral-small-latest",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(model="mistral-small-latest", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000", # set openai_api_base to the LiteLLM Proxy
    model = "mistral-small-latest",
    temperature=0.1
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```
</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

:::info
此處列出的所有模型 https://docs.mistral.ai/platform/endpoints 都支援。我們持續維護模型清單、定價、token 視窗等資訊。[請見此處](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。

:::

| 模型名稱     | 函式呼叫                                                | 推理支援 |
|----------------|--------------------------------------------------------------|-------------------|
| Mistral Small  | `completion(model="mistral/mistral-small-latest", messages)` | 否 |
| Mistral Medium | `completion(model="mistral/mistral-medium-latest", messages)`| 否 |
| Mistral Large 2  | `completion(model="mistral/mistral-large-2407", messages)` | 否 |
| Mistral Large Latest  | `completion(model="mistral/mistral-large-latest", messages)` | 否 |
| **Magistral Small**  | `completion(model="mistral/magistral-small-2506", messages)` | 是 |
| **Magistral Medium** | `completion(model="mistral/magistral-medium-2506", messages)`| 是 |
| Mistral 7B     | `completion(model="mistral/open-mistral-7b", messages)`      | 否 |
| Mixtral 8x7B   | `completion(model="mistral/open-mixtral-8x7b", messages)`    | 否 |
| Mixtral 8x22B  | `completion(model="mistral/open-mixtral-8x22b", messages)`   | 否 |
| Codestral      | `completion(model="mistral/codestral-latest", messages)`     | 否 |
| Mistral NeMo      | `completion(model="mistral/open-mistral-nemo", messages)`     | 否 |
| Mistral NeMo 2407      | `completion(model="mistral/open-mistral-nemo-2407", messages)`     | 否 |
| Codestral Mamba      | `completion(model="mistral/open-codestral-mamba", messages)`     | 否 |
| Codestral Mamba    | `completion(model="mistral/codestral-mamba-latest"", messages)`     | 否 |

## 函式呼叫 {#function-calling}

```python
from litellm import completion

# set env
os.environ["MISTRAL_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]
messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]

response = completion(
    model="mistral/mistral-large-latest",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)
# Add any assertions, here to check response args
print(response)
assert isinstance(response.choices[0].message.tool_calls[0].function.name, str)
assert isinstance(
    response.choices[0].message.tool_calls[0].function.arguments, str
)
```

## 推理 {#reasoning}

Mistral 不直接支援推理，而是建議在其 magistral 模型中使用特定的 [system prompt](https://docs.mistral.ai/capabilities/reasoning/)。設定 `reasoning_effort` 參數後，LiteLLM 會將 system prompt 前置到請求中。 

如果已提供現有的 system message，LiteLLM 會將兩者以 system messages 清單形式傳送（您可以透過啟用 `litellm._turn_on_debug()` 來驗證）。

### 支援的模型 {#supported-models-1}

| 模型名稱     | 函式呼叫                                                |
|----------------|--------------------------------------------------------------|
| Magistral Small  | `completion(model="mistral/magistral-small-2506", messages)` |
| Magistral Medium | `completion(model="mistral/magistral-medium-2506", messages)`|

### 使用 Reasoning Effort {#using-reasoning-effort}

`reasoning_effort` 參數可控制模型在推理上投入的努力程度。搭配 magistral 模型使用時。

```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = "your-api-key"

response = completion(
    model="mistral/magistral-medium-2506",
    messages=[
        {"role": "user", "content": "What is 15 multiplied by 7?"}
    ],
    reasoning_effort="medium"  # Options: "low", "medium", "high"
)

print(response)
```

### System Message 範例 {#example-with-system-message}

如果您已經有 system message，LiteLLM 會將推理指示前置：

```python
response = completion(
    model="mistral/magistral-medium-2506",
    messages=[
        {"role": "system", "content": "You are a helpful math tutor."},
        {"role": "user", "content": "Explain how to solve quadratic equations."}
    ],
    reasoning_effort="high"
)

# The system message becomes:
# "When solving problems, think step-by-step in <think> tags before providing your final answer...
#  
#  You are a helpful math tutor."
```

### 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy-1}

您也可以透過 LiteLLM proxy 使用推理功能：

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
      "model": "magistral-medium-2506",
      "messages": [
        {
          "role": "user",
          "content": "What is the square root of 144? Show your reasoning."
        }
      ],
      "reasoning_effort": "medium"
    }'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="magistral-medium-2506", 
    messages=[
        {
            "role": "user",
            "content": "Calculate the area of a circle with radius 5. Show your work."
        }
    ],
    reasoning_effort="high"
)

print(response)
```
</TabItem>
</Tabs>

### 重要注意事項 {#important-notes}

- **模型相容性**：推理參數僅適用於 magistral 模型
- **回溯相容性**：非 magistral 模型會忽略推理參數並正常運作

## 音訊轉錄 {#audio-transcription}

透過 `litellm.transcription()` 使用 Mistral 的 Voxtral 模型進行音訊轉錄。

### SDK 用法 {#sdk-usage}

```python
from litellm import transcription
import os

os.environ["MISTRAL_API_KEY"] = ""

audio_file = open("path/to/audio.wav", "rb")

response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
)

print(response.text)
```

### 含可選參數 {#with-optional-parameters}

```python
response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
    language="en",
    temperature=0.0,
    response_format="json",
)
```

### Mistral 專屬參數 {#mistral-specific-parameters}

Mistral 除了相容 OpenAI 的參數之外，還支援其他額外參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `diarize` | `bool` | 啟用說話者分離 |

```python
response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
    diarize=True,
)
```

### 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy-2}

```yaml
model_list:
  - model_name: voxtral
    litellm_params:
      model: mistral/voxtral-mini-latest
      api_key: os.environ/MISTRAL_API_KEY
    model_info:
      mode: audio_transcription
```

```bash
litellm --config /path/to/config.yaml
```

```bash
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--form 'file=@"audio.wav"' \
--form 'model="voxtral"'
```

## 文字轉語音 {#text-to-speech}

Mistral 的 Voxtral TTS 模型透過 `litellm.speech()` 與 proxy 的 `/v1/audio/speech` 路由將文字轉為音訊。`mistral/voxtral-mini-tts-2603` 與 `mistral/voxtral-mini-tts-latest` 皆受支援 <SinceVersion v="1.102.0" />。

### SDK 使用方式 {#sdk-usage-1}

```python
from litellm import speech
import os

os.environ["MISTRAL_API_KEY"] = ""

response = speech(
    model="mistral/voxtral-mini-tts-2603",
    input="The quick brown fox jumped over the lazy dog.",
    voice="alloy",
)

response.write_to_file("speech.mp3")
```

### 聲音 {#voices}

`voice` 可傳入 OpenAI 聲音名稱或 Mistral 原生 voice id。LiteLLM 會將這六個 OpenAI 名稱對應到 Mistral 聲音，因此使用其中任一者的整合無需變更即可繼續運作：

| OpenAI voice | Mistral voice     |
|--------------|-------------------|
| `alloy`      | `en_paul_neutral` |
| `echo`       | `gb_oliver_neutral` |
| `fable`      | `en_paul_cheerful` |
| `onyx`       | `en_paul_confident` |
| `nova`       | `gb_jane_sarcasm` |
| `shimmer`    | `gb_jane_sarcasm` |

任何其他值都會原封不動地傳給 Mistral，因此像 `en_paul_excited` 這樣的原生 id 可以直接使用。較新的 OpenAI 聲音（例如 `coral` 或 `ash`）不在對應之列，Mistral 對這些聲音（以及任何它不認識的聲音）會回傳 404 `invalid_voice` 錯誤。`nova` 與 `shimmer` 都對應到諷刺語氣的聲音，因此當您想要中性的女性聲音時，請直接傳入 `gb_jane_neutral`。`GET https://api.mistral.ai/v1/audio/voices?limit=100` 會列出您帳號可使用的聲音。該端點有分頁，未傳 `limit` 時回傳 10 個聲音。

### 回應格式 {#response-formats}

`response_format` 接受 `mp3`、`wav`、`pcm`、`flac` 與 `opus`，未傳時預設為 `mp3`。LiteLLM 會將回應的 `content-type` 設為與您要求的格式相符，因此 `opus` 回傳 `audio/ogg`，其他四種分別回傳 `audio/mpeg`、`audio/wav`、`audio/pcm` 與 `audio/flac`。OpenAI 的 `aac` 格式不受支援，Mistral 會以 422 拒絕。Mistral 的 `pcm` 是 24 kHz 單聲道的原始 32 位元浮點小端序樣本，與 OpenAI `pcm` 回傳的 16 位元有符號樣本不同，因此請以 float32 讀取，或改要求 `wav`。

### 聲音複製 {#voice-cloning}

將 base64 編碼的音訊樣本以 `ref_audio` 傳入，Voxtral 就會以取樣的聲音說出輸入內容：

```python
import base64
from litellm import speech

with open("sample.wav", "rb") as sample:
    ref_audio = base64.b64encode(sample.read()).decode()

response = speech(
    model="mistral/voxtral-mini-tts-2603",
    input="This sentence comes back in the sampled voice.",
    ref_audio=ref_audio,
)

response.write_to_file("cloned.mp3")
```

在 proxy 上，將相同的 `ref_audio` 欄位放入 `/v1/audio/speech` 的 JSON body 中傳送。當請求同時帶有 `voice`（包括在部署上設定的預設 `voice`）時，Mistral 會使用 `ref_audio`，因此像 OpenAI SDK 這類要求 `voice` 的用戶端可以傳入任何聲音，並透過 `extra_body` 傳送 `ref_audio`。

### 不支援的參數 {#unsupported-parameters}

Mistral 的 speech API 會以 422 拒絕 `speed` 與 `instructions`，因此 LiteLLM 會在傳送請求前將兩者都移除，而不是讓請求失敗。傳入其中任一者的呼叫仍會回傳音訊，以 Mistral 接受的參數生成。

### 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy-3}

```yaml
model_list:
  - model_name: voxtral-tts
    litellm_params:
      model: mistral/voxtral-mini-tts-2603
      api_key: os.environ/MISTRAL_API_KEY
```

```bash
litellm --config /path/to/config.yaml
```

```bash
curl --location 'http://0.0.0.0:4000/v1/audio/speech' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
    "model": "voxtral-tts",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
}' \
--output speech.mp3
```

### 成本追蹤 {#cost-tracking}

Voxtral TTS 依輸入字元計價，費率為[模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)中的 `input_cost_per_character`。LiteLLM 計算 `input` 的非空白字元數，因此一句 19 個字元、含 2 個空格的句子會以 17 個字元追蹤。Mistral 自己的字元計量（在 `x-ratelimit-input-characters-query-cost` 回應標頭中回報）會把空格也算入，因此只要 `input` 含有空白，LiteLLM 追蹤的花費就會低於 Mistral 的計量。

## Token 計算 {#token-counting}

<SinceVersion v="1.111.0" />

LiteLLM 透過 Mistral 的 `/v1/responses/input_tokens` 端點支援 Mistral 模型的原生上游 token 計算。使用方式與詳細資訊請參閱 [Token 計算](../count_tokens.md)。

位於 Azure 上的 Mistral 部署（Azure `api_base`、`MISTRAL_AZURE_API_BASE`，或只設定 `MISTRAL_AZURE_API_KEY`）會改用 LiteLLM 的本機 tokenizer 計算，因此 prompt 與 Azure 金鑰永遠不會送到 `api.mistral.ai`。

```python
import asyncio
import litellm

async def main():
    result = await litellm.acount_tokens(
        model="mistral/mistral-large-4",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "mistral_api"

asyncio.run(main())
```

## Files and Batches API {#files-and-batches-api}

LiteLLM 會將相容於 OpenAI 的 `/v1/files` 與 `/v1/batches` 端點路由至 Mistral 的 Files 和 Batch APIs。請參閱 [Mistral AI Batch API](./mistral_batches) 以了解完整流程與成本追蹤。

## 範例用法 - 嵌入 {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['MISTRAL_API_KEY'] = ""
response = embedding(
    model="mistral/mistral-embed",
    input=["good morning from litellm"],
)
print(response)
```

## 支援的模型 {#supported-models-2}
此處列出的所有模型 https://docs.mistral.ai/platform/endpoints 都支援

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Mistral Embeddings | `embedding(model="mistral/mistral-embed", input)` |
