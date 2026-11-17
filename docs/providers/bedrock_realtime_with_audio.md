---
title: "透過 LiteLLM 使用 Bedrock 即時音訊（Nova Sonic）"
sidebar_label: "Bedrock 即時 API"
description: "透過 LiteLLM AI 閘道即時 API 以 Amazon Nova Sonic 串流雙向語音對話：config.yaml 設定、聲音、音訊格式與工具。"
---

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
      model: bedrock/amazon.nova-2-sonic-v1:0
      aws_region_name: us-east-1  # or your preferred region
    model_info:
      mode: realtime

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

`amazon.nova-sonic-v1:0` 已在 Bedrock 上終止服務，對它的請求會失敗並顯示 `The provided model identifier is invalid`。請改用 `amazon.nova-2-sonic-v1:0`。

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

Nova Sonic 需要 AWS 的雙向串流 SDK，該 SDK 隨附於 `bedrock-realtime` extra 中。LiteLLM Docker 映像已包含它。

```bash
pip install 'litellm[proxy,bedrock-realtime]'
export LITELLM_MASTER_KEY=sk-<your-litellm-api-key>
litellm --config config.yaml
```

proxy 在沒有主金鑰的情況下無法啟動。請在下方腳本中使用與 `LITELLM_API_KEY` 相同的金鑰。

## 基本文字互動 {#basic-text-interaction}

```python
import asyncio
import websockets
import json

LITELLM_API_KEY = "sk-<your-litellm-api-key>"  # Your LiteLLM API key
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
                print("\nComplete")
                break

if __name__ == "__main__":
    asyncio.run(test_text_conversation())
```

## 搭配語音對話的音訊串流 {#audio-streaming-with-voice-conversation}

Nova Sonic 傳送回答音訊的速度遠快於播放速度，通常會超前數十秒。播放音訊時請持續讀取 websocket：將接收到的音訊放入佇列，並從另一個執行緒播放。在接收迴圈內播放每個區塊的用戶端會停止讀取 socket、錯過 proxy 的 keepalive ping，並在回答較長時被中斷連線，錯誤為 `1011 (internal error) keepalive ping timeout`，或者若用戶端在 proxy 中斷連線時正阻塞於寫入音訊，則為 `ConnectionClosedError: no close frame received or sent`。

```python
import asyncio
import base64
import json
import queue
import threading

import pyaudio
import websockets

LITELLM_API_KEY = "sk-<your-litellm-api-key>"
LITELLM_URL = 'ws://localhost:4000/v1/realtime?model=bedrock-sonic'

# Audio configuration
INPUT_RATE = 16000   # Nova Sonic expects 16kHz input
OUTPUT_RATE = 24000  # Nova Sonic outputs 24kHz
CHUNK = 1024

def play_audio(output_stream, playback_queue):
    """Play received audio on its own thread so the websocket keeps being read"""
    while True:
        audio_bytes = playback_queue.get()
        if audio_bytes is None:
            return
        output_stream.write(audio_bytes)

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

    playback_queue = queue.Queue()
    threading.Thread(target=play_audio, args=(output_stream, playback_queue), daemon=True).start()
    
    async with websockets.connect(
        LITELLM_URL,
        additional_headers={"Authorization": f"Bearer {LITELLM_API_KEY}"}
    ) as ws:
        # Wait for session.created
        await ws.recv()
        print("Connected")
        
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
        print("Speak into your microphone...")
        
        async def send_audio():
            """Capture and send audio from microphone"""
            while True:
                audio_data = await asyncio.to_thread(input_stream.read, CHUNK, exception_on_overflow=False)
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                await ws.send(json.dumps({
                    "type": "input_audio_buffer.append",
                    "audio": audio_b64
                }))
        
        async def receive_events():
            """Queue audio for playback and print text as it arrives"""
            async for message in ws:
                event = json.loads(message)
                
                if event['type'] == 'response.audio.delta':
                    audio_b64 = event.get('delta', '')
                    if audio_b64:
                        playback_queue.put(base64.b64decode(audio_b64))
                
                elif event['type'] == 'response.text.delta':
                    print(event['delta'], end='', flush=True)
                
                elif event['type'] == 'response.done':
                    print("\nResponse complete")
                
                elif event['type'] == 'error':
                    print(f"\nError: {event['error'].get('message')}")
        
        try:
            # Run both tasks concurrently
            await asyncio.gather(send_audio(), receive_events())
        except websockets.ConnectionClosedError as e:
            print(f"\nSession closed (code {e.rcvd.code if e.rcvd else 'none'})")
        finally:
            playback_queue.put(None)

if __name__ == "__main__":
    try:
        asyncio.run(audio_conversation())
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
```

## 使用工具／函式呼叫 {#using-toolsfunction-calling}

<SinceVersion v="1.108.0" />

舊版永遠不會傳送 `response.function_call_arguments.done` 事件，因此模型會在不呼叫工具的情況下回答。

用戶端傳送工具結果後，Nova Sonic 會在新的回應中回答，因此請在結束工具呼叫回合的 `response.done` 之後繼續聆聽。

```python
import asyncio
import websockets
import json

LITELLM_API_KEY = "sk-<your-litellm-api-key>"
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
        awaiting_tool_answer = False
        while True:
            response = await ws.recv()
            event = json.loads(response)
            
            if event['type'] == 'response.text.delta':
                print(event['delta'], end='', flush=True)
            
            elif event['type'] == 'response.function_call_arguments.done':
                # Execute the tool
                function_name = event['name']
                arguments = json.loads(event['arguments'])
                
                print(f"\nCalling {function_name}({arguments})")
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
                awaiting_tool_answer = True
            
            elif event['type'] == 'response.done':
                if awaiting_tool_answer:
                    awaiting_tool_answer = False
                    continue
                print("\nComplete")
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
Nova Sonic 永遠會同時產生文字與音訊，因此無論 `modalities` 設定為何，LiteLLM 都會同時傳送 `response.text.delta` 與 `response.audio.delta` 事件。請忽略您的用戶端不需要的事件。

## 工作階段限制 {#session-limits}

Bedrock 會在三種情況下自行結束 Nova Sonic 工作階段：55 秒內沒有音訊或其他輸入抵達、最後一個回應結束後約 5 分鐘（295 秒）內沒有新的語音抵達（傳送靜音無法保持工作階段開啟），或工作階段達到 8 分鐘。用戶端會收到一個 `error` 事件，然後 websocket 以代碼 1011 關閉。對於兩種輸入逾時，錯誤會帶有 Bedrock 的 `ValidationException: ... Timed out waiting for audio bytes or interactive content`。對於 8 分鐘上限，錯誤則帶有 Bedrock 的 `ModelTimeoutException`。需要更長對話的用戶端應在此時開啟新的工作階段。

v1.103.0 之前的 LiteLLM 版本在這些情況下會以代碼 1000 關閉 websocket，且不傳送錯誤事件，因此用戶端只會看到 `ConnectionClosedOK: received 1000 (OK)` 而沒有任何說明。升級後即可看到 Bedrock 的原因。

## 需求 {#requirements}

```bash
pip install websockets pyaudio
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
- `ConnectionClosedError: received 1011 (internal error) keepalive ping timeout`，或在 `BrokenPipeError` 之後出現 `ConnectionClosedError: no close frame received or sent`，表示用戶端已停止讀取 websocket 約 20 秒或更久，通常是因為它在接收迴圈內播放音訊。請如上所示，從另一個執行緒的佇列播放音訊。在用戶端設定 `ping_interval=None` 沒有幫助，因為 ping 是由 proxy 傳送的
- 若關閉時伴隨關於逾時或模型逾時的 `error` 事件，那是 Bedrock 的[工作階段限制](#session-limits)之一

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
