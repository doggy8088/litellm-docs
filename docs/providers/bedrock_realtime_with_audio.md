# Bedrock 即時 API {#bedrock-realtime-api}

## 總覽 {#overview}

Amazon Bedrock 的 Nova Sonic 模型支援即時雙向音訊串流，用於語音對話。本教學說明如何透過 LiteLLM Proxy 使用它。

## 設定 {#setup}

### 1. 設定 LiteLLM Proxy {#1-configure-litellm-proxy}

建立一個 `config.yaml` 檔案：

```yaml
model_list:
  - model_name: "bedrock-sonic"
    litellm_params:
      model: bedrock/amazon.nova-sonic-v1:0
      aws_region_name: us-east-1  # or your preferred region
    model_info:
      mode: realtime
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```bash
litellm --config config.yaml
```

## 基本文字互動 {#basic-text-interaction}

```python
import asyncio
import websockets
import json

LITELLM_API_KEY = "sk-1234"  # Your LiteLLM API key
LITELLM_URL = 'ws://localhost:4000/v1/realtime?model=bedrock-sonic'

async def test_text_conversation():
    async with websockets.connect(
        LITELLM_URL,
        additional_headers={
            "Authorization": f"Bearer {LITELLM_API_KEY}"
        }
    ) as ws:
        # Wait for session.created
        response = await ws.recv()
        print(f"Connected: {json.loads(response)['type']}")
        
        # Configure session
        session_update = {
            "type": "session.update",
            "session": {
                "instructions": "You are a helpful assistant.",
                "modalities": ["text"],
                "temperature": 0.8
            }
        }
        await ws.send(json.dumps(session_update))
        
        # Send a message
        message = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "Hello!"}]
            }
        }
        await ws.send(json.dumps(message))
        
        # Trigger response
        await ws.send(json.dumps({"type": "response.create"}))
        
        # Listen for response
        while True:
            response = await ws.recv()
            event = json.loads(response)
            
            if event['type'] == 'response.text.delta':
                print(event['delta'], end='', flush=True)
            elif event['type'] == 'response.done':
                print("\n✓ Complete")
                break

if __name__ == "__main__":
    asyncio.run(test_text_conversation())
```

## 搭配語音對話的音訊串流 {#audio-streaming-with-voice-conversation}

```python
import asyncio
import websockets
import json
import base64
import pyaudio

LITELLM_API_KEY = "sk-1234"
LITELLM_URL = 'ws://localhost:4000/v1/realtime?model=bedrock-sonic'

# Audio configuration
INPUT_RATE = 16000   # Nova Sonic expects 16kHz input
OUTPUT_RATE = 24000  # Nova Sonic outputs 24kHz
CHUNK = 1024

async def audio_conversation():
    # Initialize PyAudio
    p = pyaudio.PyAudio()
    
    # Input stream (microphone)
    input_stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=INPUT_RATE,
        input=True,
        frames_per_buffer=CHUNK
    )
    
    # Output stream (speakers)
    output_stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=OUTPUT_RATE,
        output=True,
        frames_per_buffer=CHUNK
    )
    
    async with websockets.connect(
        LITELLM_URL,
        additional_headers={"Authorization": f"Bearer {LITELLM_API_KEY}"}
    ) as ws:
        # Wait for session.created
        await ws.recv()
        print("✓ Connected")
        
        # Configure session with audio
        session_update = {
            "type": "session.update",
            "session": {
                "instructions": "You are a friendly voice assistant.",
                "modalities": ["text", "audio"],
                "voice": "matthew",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16"
            }
        }
        await ws.send(json.dumps(session_update))
        print("🎤 Speak into your microphone...")
        
        async def send_audio():
            """Capture and send audio from microphone"""
            while True:
                audio_data = input_stream.read(CHUNK, exception_on_overflow=False)
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                await ws.send(json.dumps({
                    "type": "input_audio_buffer.append",
                    "audio": audio_b64
                }))
                await asyncio.sleep(0.01)
        
        async def receive_audio():
            """Receive and play audio responses"""
            while True:
                response = await ws.recv()
                event = json.loads(response)
                
                if event['type'] == 'response.audio.delta':
                    audio_b64 = event.get('delta', '')
                    if audio_b64:
                        audio_bytes = base64.b64decode(audio_b64)
                        output_stream.write(audio_bytes)
                
                elif event['type'] == 'response.text.delta':
                    print(event['delta'], end='', flush=True)
                
                elif event['type'] == 'response.done':
                    print("\n✓ Response complete")
        
        # Run both tasks concurrently
        await asyncio.gather(send_audio(), receive_audio())

if __name__ == "__main__":
    try:
        asyncio.run(audio_conversation())
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
```

## 使用工具／函式呼叫 {#using-toolsfunction-calling}

```python
import asyncio
import websockets
import json
from datetime import datetime

LITELLM_API_KEY = "sk-1234"
LITELLM_URL = 'ws://localhost:4000/v1/realtime?model=bedrock-sonic'

# Define tools
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

def get_weather(location: str) -> dict:
    """Simulated weather function"""
    return {
        "location": location,
        "temperature": 72,
        "conditions": "sunny"
    }

async def conversation_with_tools():
    async with websockets.connect(
        LITELLM_URL,
        additional_headers={"Authorization": f"Bearer {LITELLM_API_KEY}"}
    ) as ws:
        # Wait for session.created
        await ws.recv()
        
        # Configure session with tools
        session_update = {
            "type": "session.update",
            "session": {
                "instructions": "You are a helpful assistant with access to tools.",
                "modalities": ["text"],
                "tools": TOOLS
            }
        }
        await ws.send(json.dumps(session_update))
        
        # Send a message that requires a tool
        message = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "What's the weather in San Francisco?"}]
            }
        }
        await ws.send(json.dumps(message))
        await ws.send(json.dumps({"type": "response.create"}))
        
        # Handle responses and tool calls
        while True:
            response = await ws.recv()
            event = json.loads(response)
            
            if event['type'] == 'response.text.delta':
                print(event['delta'], end='', flush=True)
            
            elif event['type'] == 'response.function_call_arguments.done':
                # Execute the tool
                function_name = event['name']
                arguments = json.loads(event['arguments'])
                
                print(f"\n🔧 Calling {function_name}({arguments})")
                result = get_weather(**arguments)
                
                # Send tool result back
                tool_result = {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "function_call_output",
                        "call_id": event['call_id'],
                        "output": json.dumps(result)
                    }
                }
                await ws.send(json.dumps(tool_result))
                await ws.send(json.dumps({"type": "response.create"}))
            
            elif event['type'] == 'response.done':
                print("\n✓ Complete")
                break

if __name__ == "__main__":
    asyncio.run(conversation_with_tools())
```

## 設定選項 {#configuration-options}

### 聲音選項 {#voice-options}
可用聲音：`matthew`、`joanna`、`ruth`、`stephen`、`gregory`、`amy`

### 音訊格式 {#audio-formats}
- **輸入**：16kHz PCM16（單聲道）
- **輸出**：24kHz PCM16（單聲道）

### 模態 {#modalities}
- `["text"]` - 僅文字
- `["audio"]` - 僅音訊  
- `["text", "audio"]` - 文字與音訊皆有

## 範例測試腳本 {#example-test-scripts}

LiteLLM repository 中提供完整可運作的範例：

- **基本音訊串流**：`test_bedrock_realtime_client.py`
- **簡單文字測試**：`test_bedrock_realtime_simple.py`
- **工具呼叫**：`test_bedrock_realtime_tools.py`

## 需求 {#requirements}

```bash
uv add litellm websockets pyaudio
```

## AWS 設定 {#aws-configuration}

請確認您的 AWS 憑證已完成設定：

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION_NAME=us-east-1
```

或使用 AWS CLI 設定：

```bash
aws configure
```

## 疑難排解 {#troubleshooting}

### 連線問題 {#connection-issues}
- 請確認 LiteLLM proxy 正在正確的連接埠上執行
- 驗證 AWS 憑證已正確設定
- 檢查 Bedrock 模型是否可在您的區域中使用

### 音訊問題 {#audio-issues}
- 驗證 PyAudio 已正確安裝
- 檢查麥克風／喇叭權限
- 確保取樣率正確（輸入 16kHz、輸出 24kHz）

### 工具呼叫問題 {#tool-calling-issues}
- 請確認工具已在 session.update 中正確定義
- 驗證工具結果已連同正確的 call_id 傳回
- 檢查 response.create 是否在工具結果之後送出

## 相關資源 {#related-resources}

- [OpenAI Realtime API 文件](https://platform.openai.com/docs/guides/realtime)
- [Amazon Bedrock Nova Sonic 文件](https://docs.aws.amazon.com/bedrock/latest/userguide/nova-sonic.html)
- [LiteLLM Realtime API 文件](/docs/realtime)
