# Gemini 即時 API - Google AI Studio {#gemini-realtime-api---google-ai-studio}

| 功能 | 說明 | 備註 |
| --- | --- | --- |
| Proxy | ✅ |  |
| SDK | ⌛️ | 可透過 `litellm._arealtime` 進行實驗性存取。 |

## Proxy 使用方式 {#proxy-usage}

### 將模型加入設定檔 {#add-model-to-config}

```yaml
model_list:
  - model_name: "gemini-2.0-flash"
    litellm_params:
      model: gemini/gemini-2.0-flash-live-001
    model_info:
      mode: realtime
```

### 啟動 Proxy {#start-proxy}

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:8000
```

### 測試 {#test}

使用 node 執行此腳本 - `node test.js`

```js
// test.js
const WebSocket = require("ws");

const url = "ws://0.0.0.0:4000/v1/realtime?model=openai-gemini-2.0-flash";

const ws = new WebSocket(url, {
    headers: {
        "api-key": `${LITELLM_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
    },
});

ws.on("open", function open() {
    console.log("Connected to server.");
    ws.send(JSON.stringify({
        type: "response.create",
        response: {
            modalities: ["text"],
            instructions: "Please assist the user.",
        }
    }));
});

ws.on("message", function incoming(message) {
    console.log(JSON.parse(message.toString()));
});

ws.on("error", function handleError(error) {
    console.error("Error: ", error);
});
```


## 工具呼叫 {#tool-calling}

```python
import asyncio
import json
import websockets

PROXY_URL = "ws://localhost:4000/v1/realtime?model=gemini-live"

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "unit": {"type": "string", "enum": ["fahrenheit", "celsius"]},
                },
                "required": ["location"],
            },
        },
    }
]


def get_weather(location: str, unit: str = "fahrenheit") -> dict:
    return {
        "location": location,
        "temperature": 72 if unit == "fahrenheit" else 22,
        "unit": unit,
        "conditions": "sunny",
    }


TOOL_FUNCTIONS = {"get_weather": get_weather}


async def main():
    async with websockets.connect(
        PROXY_URL,
        additional_headers={
            "Authorization": "Bearer sk-1234",
            "X-Serverless-Authorization": "Bearer sk-1234",
        },
    ) as ws:
        _ = json.loads(await ws.recv())  # session.created

        # Required for tool calling: send tools in session.update
        await ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "instructions": "Use get_weather for weather questions.",
                        "modalities": ["audio"],
                        "tools": TOOLS,
                    },
                }
            )
        )

        await ws.send(
            json.dumps(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": "What's the weather in San Francisco?"}
                        ],
                    },
                }
            )
        )
        await ws.send(json.dumps({"type": "response.create"}))

        async for raw in ws:
            ev = json.loads(raw)
            t = ev.get("type", "")

            if t == "response.text.delta":
                print(ev.get("delta", ""), end="", flush=True)
            elif t == "response.function_call_arguments.done":
                fn_name = ev.get("name", "")
                call_id = ev.get("call_id", "")
                args = json.loads(ev.get("arguments", "{}"))
                result = TOOL_FUNCTIONS[fn_name](**args)

                await ws.send(
                    json.dumps(
                        {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps(result),
                            },
                        }
                    )
                )
                await ws.send(json.dumps({"type": "response.create"}))
            elif t == "response.done":
                print("\n[done]")
                break
            elif t == "error":
                print(ev)
                break


if __name__ == "__main__":
    asyncio.run(main())
```

### 設定 + 執行 {#config--run}

```yaml
model_list:
  - model_name: gemini-live
    litellm_params:
      model: gemini/gemini-2.5-flash-native-audio-latest
      api_key: os.environ/GEMINI_API_KEY

litellm_settings:
  # Required for tool calling with Gemini Live:
  # defer setup until client sends session.update (with tools)
  gemini_live_defer_setup: true
```

```bash
litellm --config config.yaml --port 4000
python test_realtime_tool_calling.py
```

## 限制 {#limitations}

- 不支援音訊轉錄。
- 在第一次 `session.update` 之後的工作階段設定更新會被忽略（Gemini 設定在每個連線中僅能設定一次）。

## 注意事項 {#precaution}

- 若未先送出 `session.update` 與您的 `tools`，工具呼叫將無法運作。
- 請將其作為該 websocket 工作階段的第一則設定訊息送出。
- 為了向後相容，`gemini_live_defer_setup` 預設為 `false`。

## 支援的 OpenAI Realtime 事件 {#supported-openai-realtime-events}

- `session.created`
- `response.created`
- `response.output_item.added`
- `conversation.item.created`
- `response.content_part.added`
- `response.text.delta`
- `response.audio.delta`
- `response.text.done`
- `response.audio.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.done`

## [支援的工作階段參數](https://github.com/BerriAI/litellm/blob/e87b536d038f77c2a2206fd7433e275c487179ee/litellm/llms/gemini/realtime/transformation.py#L155) {#supported-session-paramshttpsgithubcomberriailitellmblobe87b536d038f77c2a2206fd7433e275c487179eelitellmllmsgeminirealtimetransformationpyl155}

## 更多範例 {#more-examples}
### [具備音訊輸入/輸出的 Gemini Realtime API](../../../docs/tutorials/gemini_realtime_with_audio) {#gemini-realtime-api-with-audio-inputoutputdocstutorialsgemini_realtime_with_audio}
