import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 呼叫 A2A 代理程式 {#invoking-a2a-agents}

了解如何透過 LiteLLM 使用不同方法來呼叫 A2A 代理程式。

:::tip 部署您自己的 A2A 代理程式

想要用您自己的代理程式測試嗎？部署這個由 Google Gemini 驅動的範本 A2A 代理程式：

[**shin-bot-litellm/a2a-gemini-agent**](https://github.com/shin-bot-litellm/a2a-gemini-agent) - 可直接部署、支援串流的簡單 A2A 代理程式

:::

## A2A SDK {#a2a-sdk}

使用 [A2A Python SDK](https://pypi.org/project/a2a-sdk)（**>= 1.1.0**）透過 A2A 協定呼叫代理程式。

```bash
pip install "a2a-sdk>=1.1.0,<2.0" httpx
```

在代理程式上固定 `protocolVersion: "1.0"`（建議）以使回應符合 1.x SDK。若要使用舊版 `0.3` wire format，改為固定 `"0.3"`——請參閱[協定版本控管](./a2a#protocol-versioning)。

:::info 從 a2a-sdk 0.3.x 遷移

a2a-sdk 1.x 以 `A2AClient` + dict `MessageSendParams`、protobuf `Message` / `Part` 類型，以及 `send_message` 作為串流事件的 async generator 取代 `ClientFactory`。請參閱下方範例。

:::

### 非串流 {#non-streaming}

此範例說明如何：
1. **列出可用的代理程式** - 查詢 `/v1/agents` 以查看您的金鑰可存取哪些代理程式
2. **選取一個代理程式** - 從清單中挑選一個代理程式
3. **透過 A2A 呼叫** - 使用 A2A 協定將訊息傳送給代理程式

```python showLineNumbers title="invoke_a2a_agent.py"
import asyncio
from uuid import uuid4

import httpx
from a2a.client import A2ACardResolver, ClientConfig, ClientFactory
from a2a.types import Message, Part, Role, SendMessageRequest
from a2a.utils.constants import TransportProtocol

# === CONFIGURE THESE ===
LITELLM_BASE_URL = "http://localhost:4000"  # Your LiteLLM proxy URL
LITELLM_VIRTUAL_KEY = "sk-1234"             # Your LiteLLM Virtual Key
# =======================


def extract_text(parts) -> str:
    return "".join(getattr(p, "text", "") or "" for p in (parts or []))


def handle_event(event) -> None:
    populated = event.ListFields()
    if not populated:
        return
    field, value = populated[0]
    if field.name in ("message", "msg"):
        print(f"[message] {extract_text(value.parts)}")
    elif field.name == "task":
        print(f"[task {value.id}] {value.status.state}")


async def main():
    headers = {"Authorization": f"Bearer {LITELLM_VIRTUAL_KEY}"}

    async with httpx.AsyncClient(headers=headers, timeout=60.0) as http_client:
        # Step 1: List available agents
        response = await http_client.get(f"{LITELLM_BASE_URL}/v1/agents")
        agents = response.json()

        print("Available agents:")
        for agent in agents:
            print(f"  - {agent['agent_name']} (ID: {agent['agent_id']})")

        if not agents:
            print("No agents available for this key")
            return

        # Step 2: Select an agent and invoke it
        selected_agent = agents[0]
        agent_id = selected_agent["agent_id"]
        print(f"\nInvoking: {selected_agent['agent_name']}")

        # Step 3: Discover agent card and create a2a-sdk 1.x client
        base_url = f"{LITELLM_BASE_URL}/a2a/{agent_id}"
        resolver = A2ACardResolver(httpx_client=http_client, base_url=base_url)
        agent_card = await resolver.get_agent_card()

        config = ClientConfig(
            httpx_client=http_client,
            streaming=False,
            supported_protocol_bindings=[
                TransportProtocol.JSONRPC,
                TransportProtocol.HTTP_JSON,
            ],
        )
        client = ClientFactory(config).create(agent_card)

        msg = Message(
            message_id=uuid4().hex,
            role=Role.ROLE_USER,
            parts=[Part(text="Hello, what can you do?")],
        )
        request = SendMessageRequest(message=msg)

        async for event in client.send_message(request):
            handle_event(event)


if __name__ == "__main__":
    asyncio.run(main())
```

### 串流 {#streaming}

在 a2a-sdk 1.x 中，將 `streaming=True` 設定在 `ClientConfig` 上，並疊代 `send_message`——同一個 API 同時處理串流與非串流：

```python showLineNumbers title="invoke_a2a_agent_streaming.py"
import asyncio
from uuid import uuid4

import httpx
from a2a.client import A2ACardResolver, ClientConfig, ClientFactory
from a2a.types import Message, Part, Role, SendMessageRequest
from a2a.utils.constants import TransportProtocol

# === CONFIGURE THESE ===
LITELLM_BASE_URL = "http://localhost:4000"  # Your LiteLLM proxy URL
LITELLM_VIRTUAL_KEY = "sk-1234"             # Your LiteLLM Virtual Key
LITELLM_AGENT_NAME = "ij-local"             # Agent name registered in LiteLLM
# =======================


async def main():
    base_url = f"{LITELLM_BASE_URL}/a2a/{LITELLM_AGENT_NAME}"
    headers = {"Authorization": f"Bearer {LITELLM_VIRTUAL_KEY}"}

    async with httpx.AsyncClient(headers=headers, timeout=60.0) as http_client:
        resolver = A2ACardResolver(httpx_client=http_client, base_url=base_url)
        agent_card = await resolver.get_agent_card()

        config = ClientConfig(
            httpx_client=http_client,
            streaming=True,
            supported_protocol_bindings=[
                TransportProtocol.JSONRPC,
                TransportProtocol.HTTP_JSON,
            ],
        )
        client = ClientFactory(config).create(agent_card)

        msg = Message(
            message_id=uuid4().hex,
            role=Role.ROLE_USER,
            parts=[Part(text="Tell me a long story")],
        )
        request = SendMessageRequest(message=msg)

        async for event in client.send_message(request):
            populated = event.ListFields()
            if populated:
                field, value = populated[0]
                if field.name in ("message", "msg"):
                    text = "".join(getattr(p, "text", "") or "" for p in value.parts)
                    print(text, end="", flush=True)
        print()


if __name__ == "__main__":
    asyncio.run(main())
```

## /chat/completions API（OpenAI SDK） {#chatcompletions-api-openai-sdk}

您也可以使用熟悉的 OpenAI SDK，透過 `a2a/` 模型前綴來呼叫 A2A 代理程式。

### 非串流 {#non-streaming-1}

<Tabs>
<TabItem value="python" label="Python" default>

```python showLineNumbers title="openai_non_streaming.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",  # Your LiteLLM Virtual Key
    base_url="http://localhost:4000"  # Your LiteLLM proxy URL
)

response = client.chat.completions.create(
    model="a2a/my-agent",  # Use a2a/ prefix with your agent name
    messages=[
        {"role": "user", "content": "Hello, what can you do?"}
    ]
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript showLineNumbers title="openai_non_streaming.ts"
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-1234',  // Your LiteLLM Virtual Key
  baseURL: 'http://localhost:4000'  // Your LiteLLM proxy URL
});

const response = await client.chat.completions.create({
  model: 'a2a/my-agent',  // Use a2a/ prefix with your agent name
  messages: [
    { role: 'user', content: 'Hello, what can you do?' }
  ]
});

console.log(response.choices[0].message.content);
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="curl_non_streaming.sh"
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "a2a/my-agent",
    "messages": [
      {"role": "user", "content": "Hello, what can you do?"}
    ]
  }'
```

</TabItem>
</Tabs>

### 串流 {#streaming-1}

<Tabs>
<TabItem value="python" label="Python" default>

```python showLineNumbers title="openai_streaming.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",  # Your LiteLLM Virtual Key
    base_url="http://localhost:4000"  # Your LiteLLM proxy URL
)

stream = client.chat.completions.create(
    model="a2a/my-agent",  # Use a2a/ prefix with your agent name
    messages=[
        {"role": "user", "content": "Tell me a long story"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript showLineNumbers title="openai_streaming.ts"
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-1234',  // Your LiteLLM Virtual Key
  baseURL: 'http://localhost:4000'  // Your LiteLLM proxy URL
});

const stream = await client.chat.completions.create({
  model: 'a2a/my-agent',  // Use a2a/ prefix with your agent name
  messages: [
    { role: 'user', content: 'Tell me a long story' }
  ],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="curl_streaming.sh"
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "a2a/my-agent",
    "messages": [
      {"role": "user", "content": "Tell me a long story"}
    ],
    "stream": true
  }'
```

</TabItem>
</Tabs>

## 任務 API（`tasks/get`、`tasks/list`、…） {#task-apis-tasksget-taskslist-}

從 `message/send` 傳回 `submitted` 任務的代理程式，會預期用戶端以 `tasks/get` 輪詢。請以 JSON-RPC 呼叫相同的 LiteLLM 基礎 URL：

```bash showLineNumbers title="tasks_get.sh"
curl -X POST "http://localhost:4000/a2a/${AGENT_ID}" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-2",
    "method": "tasks/get",
    "params": {"id": "TASK_ID_FROM_SEND_RESPONSE"}
  }'
```

LiteLLM 會將 `tasks/get`、`tasks/list`、`tasks/cancel`、推播通知方法，以及 `agent/getAuthenticatedExtendedCard` 轉送至上游代理程式 URL。完整的方法清單請參閱[支援的 A2A 方法](./a2a_agent_card#supported-a2a-methods)。

## 主要差異 {#key-differences}

| 方法 | 使用情境 | 優點 |
|--------|----------|------------|
| **A2A SDK** | 原生 A2A 協定整合 | • 完整支援 A2A 協定<br/>• 可存取任務狀態與產物<br/>• 上下文管理 |
| **OpenAI SDK** | 熟悉的 OpenAI 風格介面 | • 可直接替換 OpenAI 呼叫<br/>• 從 LLM 更容易遷移到代理程式工作流程<br/>• 可搭配既有的 OpenAI 工具鏈使用 |

:::tip 模型前綴

使用 OpenAI SDK 時，請務必在代理程式名稱前加上 `a2a/`（例如 `a2a/my-agent`），以便將請求路由至 A2A 代理程式，而不是 LLM 提供者。

:::
