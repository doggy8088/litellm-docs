import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiveKit xAI 即時 Voice Agent {#livekit-xai-realtime-voice-agent}

使用 LiveKit 的 xAI Grok Voice Agent 外掛程式搭配 LiteLLM Proxy，建立低延遲的語音 AI 代理程式。

LiveKit Agents framework 提供用於建構即時語音與視訊 AI 應用程式的工具。透過路由經由 LiteLLM Proxy，您可以統一存取多個即時語音提供者、成本追蹤、速率限制等功能。

## 快速開始 {#quick-start}

### 1. 安裝相依套件 {#1-install-dependencies}

```bash
uv add livekit-agents[xai]
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

建立一個包含您的 xAI 即時模型的設定檔：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: grok-voice-agent
    litellm_params:
      model: xai/grok-voice-latest
      api_key: os.environ/XAI_API_KEY
    model_info:
      mode: realtime

litellm_settings:
  drop_params: True

general_settings:
  master_key: sk-1234  # Change this to a secure key
```

啟動 proxy：

```bash
litellm --config config.yaml --port 4000
```

### 3. 設定 LiveKit xAI 外掛程式 {#3-configure-livekit-xai-plugin}

將 LiveKit 的 xAI 外掛程式指向您的 LiteLLM proxy：

```python
from livekit.plugins import xai

# Configure xAI to use LiteLLM proxy
model = xai.realtime.RealtimeModel(
    voice="ara",                      # Voice option
    api_key="sk-1234",               # Your LiteLLM proxy master key
    base_url="http://localhost:4000", # LiteLLM proxy URL
)
```

## 完整範例 {#complete-example}

以下是一個完整可運作的範例：

<Tabs>
<TabItem value="python" label="Python 用戶端">

```python
#!/usr/bin/env python3
"""
Simple xAI realtime voice agent through LiteLLM proxy.
"""
import asyncio
import json
import websockets

PROXY_URL = "ws://localhost:4000/v1/realtime"
API_KEY = "sk-1234"
MODEL = "grok-voice-agent"

async def run_voice_agent():
    """Connect to xAI realtime API through LiteLLM proxy"""
    url = f"{PROXY_URL}?model={MODEL}"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    async with websockets.connect(url, extra_headers=headers) as ws:
        # Wait for initial connection event
        initial = json.loads(await ws.recv())
        print(f"✅ Connected: {initial['type']}")
        
        # Send user message
        await ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": "Hello! Tell me a joke."
                }]
            }
        }))
        
        # Request response
        await ws.send(json.dumps({
            "type": "response.create",
            "response": {"modalities": ["text", "audio"]}
        }))
        
        # Collect response
        transcript = []
        async for message in ws:
            event = json.loads(message)
            
            # Capture text response
            if event['type'] == 'response.output_audio_transcript.delta':
                transcript.append(event['delta'])
                print(event['delta'], end='', flush=True)
            
            # Done when response completes
            elif event['type'] == 'response.done':
                break
        
        print(f"\n\n✅ Full response: {''.join(transcript)}")

if __name__ == "__main__":
    asyncio.run(run_voice_agent())
```

</TabItem>

<TabItem value="livekit" label="LiveKit 代理程式">

```python
from livekit.agents import Agent, AgentSession, WorkerOptions, cli
from livekit.plugins import xai

class VoiceAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a helpful voice assistant.",
            llm=xai.realtime.RealtimeModel(
                voice="ara",
                api_key="sk-1234",
                base_url="http://localhost:4000",
            ),
        )

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            agent_factory=VoiceAgent,
        )
    )
```

</TabItem>
</Tabs>

## 執行範例 {#running-the-example}

1. **啟動 LiteLLM Proxy**（如果尚未執行）：
   ```bash
   litellm --config config.yaml --port 4000
   ```

2. **執行範例**：
   ```bash
   python your_script.py
   ```

## 預期輸出 {#expected-output}

```
✅ Connected: session.created
Hello! Here's a joke for you: Why don't scientists trust atoms? 
Because they make up everything!

✅ Full response: Hello! Here's a joke for you: Why don't scientists trust atoms? Because they make up everything!
```


## 完整可運作範例 {#complete-working-example}

**[LiveKit Agent SDK 食譜](https://github.com/BerriAI/litellm/tree/main/cookbook/livekit_agent_sdk)**

## 深入了解 {#learn-more}

- [xAI 即時 API](/docs/providers/xai_realtime)
- [LiveKit xAI 外掛程式](https://docs.livekit.io/agents/models/realtime/plugins/xai/)
- [LiteLLM 即時 API](/docs/realtime)
