import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MiniMax {#minimax}

# MiniMax - v1/messages {#minimax---v1messages}

## 總覽 {#overview}

Litellm 提供與 anthropic 規格相容的 minmax 支援

## 支援的模型 {#supported-models}

MiniMax 透過其與 Anthropic 相容的 API 提供三種模型：

| 模型 | 說明 | 輸入成本 | 輸出成本 | 提示快取讀取 | 提示快取寫入 |
|-------|-------------|------------|-------------|---------------------|----------------------|
| **MiniMax-M2.1** | 具強化程式設計體驗的強大多語言程式設計（~60 tps） | $0.3/M tokens | $1.2/M tokens | $0.03/M tokens | $0.375/M tokens |
| **MiniMax-M2.1-lightning** | 更快且更靈活（~100 tps） | $0.3/M tokens | $2.4/M tokens | $0.03/M tokens | $0.375/M tokens |
| **MiniMax-M2** | 代理程式能力、進階推理 | $0.3/M tokens | $1.2/M tokens | $0.03/M tokens | $0.375/M tokens |

## 使用範例 {#usage-examples}

### 基本聊天完成 {#basic-chat-completion}

```python
import litellm

response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/anthropic/v1/messages",
    max_tokens=1000
)

print(response.choices[0].message.content)
```

### 使用環境變數 {#using-environment-variables}

```bash
export MINIMAX_API_KEY="your-minimax-api-key"
export MINIMAX_API_BASE="https://api.minimax.io/anthropic/v1/messages"
```

```python
import litellm

response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=1000
)
```

### 使用思考（M2.1 功能） {#with-thinking-m21-feature}

```python
response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Solve: 2+2=?"}],
    thinking={"type": "enabled", "budget_tokens": 1000},
    api_key="your-minimax-api-key"
)

# Access thinking content
for block in response.choices[0].message.content:
    if hasattr(block, 'type') and block.type == 'thinking':
        print(f"Thinking: {block.thinking}")
```

### 使用工具呼叫 {#with-tool-calling}

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }
]

response = litellm.anthropic.messages.acreate(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
    tools=tools,
    api_key="your-minimax-api-key",
    max_tokens=1000
)
```


## 與 LiteLLM Proxy 搭配使用  {#usage-with-litellm-proxy}

您可以透過 LiteLLM Proxy 路由，使用 Anthropic SDK 搭配 MiniMax 模型：

| 步驟 | 說明 |
|------|-------------|
| **1. 啟動 LiteLLM Proxy** | 在 `config.yaml` 中以 MiniMax 模型設定 proxy |
| **2. 設定環境變數** | 將 Anthropic SDK 指向 proxy 端點 |
| **3. 使用 Anthropic SDK** | 使用原生 Anthropic SDK 呼叫 MiniMax 模型 |

### 步驟 1：設定 LiteLLM Proxy {#step-1-configure-litellm-proxy}

建立一個 `config.yaml`：

```yaml
model_list:
  - model_name: minimax/MiniMax-M2.1
    litellm_params:
      model: minimax/MiniMax-M2.1
      api_key: os.environ/MINIMAX_API_KEY
      api_base: https://api.minimax.io/anthropic/v1/messages
```

啟動 proxy：

```bash
litellm --config config.yaml
```

### 步驟 2：搭配 Anthropic SDK 使用 {#step-2-use-with-anthropic-sdk}

```python
import os
os.environ["ANTHROPIC_BASE_URL"] = "http://localhost:4000"
os.environ["ANTHROPIC_API_KEY"] = "sk-1234"  # Your LiteLLM proxy key

import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="minimax/MiniMax-M2.1",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)

for block in message.content:
    if block.type == "thinking":
        print(f"Thinking:\n{block.thinking}\n")
    elif block.type == "text":
        print(f"Text:\n{block.text}\n")
```

# MiniMax - v1/chat/completions {#minimax---v1chatcompletions}

## 與 LiteLLM SDK 搭配使用 {#usage-with-litellm-sdk}

您可以直接使用 LiteLLM 搭配 MiniMax 的 OpenAI 相容 API：

### 基本聊天完成 {#basic-chat-completion-1}

```python
import litellm

response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you?"}
    ],
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

print(response.choices[0].message.content)
```

### 使用環境變數 {#using-environment-variables-1}

```bash
export MINIMAX_API_KEY="your-minimax-api-key"
export MINIMAX_API_BASE="https://api.minimax.io/v1"
```

```python
import litellm

response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 使用推理拆分 {#with-reasoning-split}

```python
response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Solve: 2+2=?"}
    ],
    extra_body={"reasoning_split": True},
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

# Access reasoning details if available
if hasattr(response.choices[0].message, 'reasoning_details'):
    print(f"Thinking: {response.choices[0].message.reasoning_details}")
print(f"Response: {response.choices[0].message.content}")
```

### 使用工具呼叫 {#with-tool-calling-1}

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }
]

response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
    tools=tools,
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)
```

### 串流 {#streaming}

```python
response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True,
    api_key="your-minimax-api-key",
    api_base="https://api.minimax.io/v1"
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```


## 透過 LiteLLM Proxy 與 OpenAI SDK 搭配使用 {#usage-with-openai-sdk-via-litellm-proxy}

您也可以透過 LiteLLM Proxy 路由，使用 OpenAI SDK 搭配 MiniMax 模型：

| 步驟 | 說明 |
|------|-------------|
| **1. 啟動 LiteLLM Proxy** | 在 `config.yaml` 中以 MiniMax 模型設定 proxy |
| **2. 設定環境變數** | 將 OpenAI SDK 指向 proxy 端點 |
| **3. 使用 OpenAI SDK** | 使用原生 OpenAI SDK 呼叫 MiniMax 模型 |

### 步驟 1：設定 LiteLLM Proxy {#step-1-configure-litellm-proxy-1}

建立一個 `config.yaml`：

```yaml
model_list:
  - model_name: minimax/MiniMax-M2.1
    litellm_params:
      model: minimax/MiniMax-M2.1
      api_key: os.environ/MINIMAX_API_KEY
      api_base: https://api.minimax.io/v1
```

啟動 proxy：

```bash
litellm --config config.yaml
```

### 步驟 2：搭配 OpenAI SDK 使用 {#step-2-use-with-openai-sdk}

```python
import os
os.environ["OPENAI_BASE_URL"] = "http://localhost:4000"
os.environ["OPENAI_API_KEY"] = "sk-1234"  # Your LiteLLM proxy key

from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="minimax/MiniMax-M2.1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hi, how are you?"},
    ],
    # Set reasoning_split=True to separate thinking content
    extra_body={"reasoning_split": True},
)

# Access thinking and response
if hasattr(response.choices[0].message, 'reasoning_details'):
    print(f"Thinking:\n{response.choices[0].message.reasoning_details[0]['text']}\n")
print(f"Text:\n{response.choices[0].message.content}\n")
```

### 使用 OpenAI SDK 串流 {#streaming-with-openai-sdk}

```python
from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="minimax/MiniMax-M2.1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me a story"},
    ],
    extra_body={"reasoning_split": True},
    stream=True,
)

reasoning_buffer = ""
text_buffer = ""

for chunk in stream:
    if hasattr(chunk.choices[0].delta, "reasoning_details") and chunk.choices[0].delta.reasoning_details:
        for detail in chunk.choices[0].delta.reasoning_details:
            if "text" in detail:
                reasoning_text = detail["text"]
                new_reasoning = reasoning_text[len(reasoning_buffer):]
                if new_reasoning:
                    print(new_reasoning, end="", flush=True)
                    reasoning_buffer = reasoning_text

    if chunk.choices[0].delta.content:
        content_text = chunk.choices[0].delta.content
        new_text = content_text[len(text_buffer):] if text_buffer else content_text
        if new_text:
            print(new_text, end="", flush=True)
            text_buffer = content_text
```

## 成本計算 {#cost-calculation}

成本計算會使用 `model_prices_and_context_window.json` 中的定價資訊自動運作。

範例：
```python
response = litellm.completion(
    model="minimax/MiniMax-M2.1",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="your-minimax-api-key"
)

# Access cost information
print(f"Cost: ${response._hidden_params.get('response_cost', 0)}")
```

# MiniMax - 文字轉語音 {#minimax---text-to-speech}

## 快速入門 {#quick-start}

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}

### 基本使用 {#basic-usage}

```python
from pathlib import Path
from litellm import speech
import os 

os.environ["MINIMAX_API_KEY"] = "your-api-key"

speech_file_path = Path(__file__).parent / "speech.mp3"
response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="The quick brown fox jumped over the lazy dogs",
)
response.stream_to_file(speech_file_path)
```

### 非同步使用 {#async-usage}

```python
from litellm import aspeech
from pathlib import Path
import os, asyncio

os.environ["MINIMAX_API_KEY"] = "your-api-key"

async def test_async_speech(): 
    speech_file_path = Path(__file__).parent / "speech.mp3"
    response = await aspeech(
        model="minimax/speech-2.6-hd",
        voice="alloy",
        input="The quick brown fox jumped over the lazy dogs",
    )
    response.stream_to_file(speech_file_path)

asyncio.run(test_async_speech())
```

### 聲音選擇 {#voice-selection}

MiniMax 支援許多聲音。LiteLLM 提供與 OpenAI 相容的聲音名稱，對應到 MiniMax 聲音：

```python
from litellm import speech

# OpenAI-compatible voice names
voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

for voice in voices:
    response = speech(
        model="minimax/speech-2.6-hd",
        voice=voice,
        input=f"This is the {voice} voice",
    )
    response.stream_to_file(f"speech_{voice}.mp3")
```

您也可以直接使用 MiniMax 原生聲音 ID：

```python
response = speech(
    model="minimax/speech-2.6-hd",
    voice="male-qn-qingse",  # MiniMax native voice ID
    input="Using native MiniMax voice ID",
)
```

### 自訂參數 {#custom-parameters}

MiniMax TTS 支援額外參數以微調音訊輸出：

```python
from litellm import speech

response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="Custom audio parameters",
    speed=1.5,  # Speed: 0.5 to 2.0
    response_format="mp3",  # Format: mp3, pcm, wav, flac
    extra_body={
        "vol": 1.2,  # Volume: 0.1 to 10
        "pitch": 2,  # Pitch adjustment: -12 to 12
        "sample_rate": 32000,  # 16000, 24000, or 32000
        "bitrate": 128000,  # For MP3: 64000, 128000, 192000, 256000
        "channel": 1,  # 1 for mono, 2 for stereo
    }
)
response.stream_to_file("custom_speech.mp3")
```

### 回應格式 {#response-formats}

```python
from litellm import speech

# MP3 format (default)
response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="MP3 format audio",
    response_format="mp3",
)

# PCM format
response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="PCM format audio",
    response_format="pcm",
)

# WAV format
response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="WAV format audio",
    response_format="wav",
)

# FLAC format
response = speech(
    model="minimax/speech-2.6-hd",
    voice="alloy",
    input="FLAC format audio",
    response_format="flac",
)
```

## **LiteLLM Proxy 使用方式** {#litellm-proxy-usage}

LiteLLM 為 MiniMax TTS 提供 OpenAI 相容的 `/audio/speech` 端點。

### 設定 {#setup}

將 MiniMax 新增至您的 proxy 設定：

```yaml
model_list:
  - model_name: tts
    litellm_params:
      model: minimax/speech-2.6-hd
      api_key: os.environ/MINIMAX_API_KEY
  
  - model_name: tts-turbo
    litellm_params:
      model: minimax/speech-2.6-turbo
      api_key: os.environ/MINIMAX_API_KEY
```

啟動 proxy：

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 發送請求 {#making-requests}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

使用自訂參數：

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts",
    "input": "Custom parameters example.",
    "voice": "nova",
    "speed": 1.5,
    "response_format": "mp3",
    "extra_body": {
      "vol": 1.2,
      "pitch": 1,
      "sample_rate": 32000
    }
  }' \
  --output custom_speech.mp3
```

## 聲音對應 {#voice-mappings}

LiteLLM 會將與 OpenAI 相容的聲音名稱對應到 MiniMax 聲音 ID：

| OpenAI 聲音 | MiniMax 聲音 ID | 說明 |
|--------------|------------------|-------------|
| alloy | male-qn-qingse | 男聲 |
| echo | male-qn-jingying | 男聲 |
| fable | female-shaonv | 女聲 |
| onyx | male-qn-badao | 男聲 |
| nova | female-yujie | 女聲 |
| shimmer | female-tianmei | 女聲 |

您也可以直接傳入任何 MiniMax 原生聲音 ID 作為 `voice` 參數。

### 串流（WebSocket） {#streaming-websocket}

:::note
目前的實作使用 MiniMax 的 HTTP 端點。若要支援 WebSocket 串流，請參閱 MiniMax 官方文件：[https://platform.minimax.io/docs](https://platform.minimax.io/docs)。
:::

## 錯誤處理 {#error-handling}

```python
from litellm import speech
import litellm

try:
    response = speech(
        model="minimax/speech-2.6-hd",
        voice="alloy",
        input="Test input",
    )
    response.stream_to_file("output.mp3")
except litellm.exceptions.BadRequestError as e:
    print(f"Bad request: {e}")
except litellm.exceptions.AuthenticationError as e:
    print(f"Authentication failed: {e}")
except Exception as e:
    print(f"Error: {e}")
```

### 額外的主體參數 {#extra-body-parameters}

透過 `extra_body` 傳入這些參數：

| 參數 | 型別 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| vol | float | 音量（0.1 到 10） | 1.0 |
| pitch | int | 音高調整（-12 到 12） | 0 |
| sample_rate | int | 取樣率：16000、24000、32000 | 32000 |
| bitrate | int | MP3 位元率：64000、128000、192000、256000 | 128000 |
| channel | int | 音訊聲道：1（單聲道）或 2（立體聲） | 1 |
| output_format | string | 輸出格式："hex" 或 "url"（url 會回傳 24 小時有效的 URL） | hex |
