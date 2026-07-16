import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI Agent Engine {#vertex-ai-agent-engine}

以 OpenAI 的請求/回應格式呼叫 Vertex AI Agent Engine（Reasoning Engines）。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Vertex AI Agent Engine 提供代管的代理程式執行環境，可使用基礎模型、工具與自訂邏輯來執行 agentic 工作流程。 |
| LiteLLM 上的提供者路由 | `vertex_ai/agent_engine/{RESOURCE_NAME}` |
| 支援的端點 | `/chat/completions`, `/v1/messages`, `/v1/responses`, `/v1/a2a/message/send` |
| 提供者文件 | [Vertex AI Agent Engine ↗](https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/overview) |

## 快速開始 {#quick-start}

### 模型格式 {#model-format}

```shell showLineNumbers title="Model Format"
vertex_ai/agent_engine/{RESOURCE_NAME}
```

**範例：**
- `vertex_ai/agent_engine/projects/1060139831167/locations/us-central1/reasoningEngines/8263861224643493888`

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic Agent Completion"
import litellm

response = litellm.completion(
    model="vertex_ai/agent_engine/projects/1060139831167/locations/us-central1/reasoningEngines/8263861224643493888",
    messages=[
        {"role": "user", "content": "Explain machine learning in simple terms"}
    ],
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Streaming Agent Responses"
import litellm

response = await litellm.acompletion(
    model="vertex_ai/agent_engine/projects/1060139831167/locations/us-central1/reasoningEngines/8263861224643493888",
    messages=[
        {"role": "user", "content": "What are the key principles of software architecture?"}
    ],
    stream=True,
)

async for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 在 config.yaml 中設定您的模型 {#1-configure-your-model-in-configyaml}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml showLineNumbers title="LiteLLM Proxy Configuration"
model_list:
  - model_name: vertex-agent-1
    litellm_params:
      model: vertex_ai/agent_engine/projects/1060139831167/locations/us-central1/reasoningEngines/8263861224643493888
      vertex_project: your-project-id
      vertex_location: us-central1
```

</TabItem>
</Tabs>

#### 2. 啟動 LiteLLM Proxy {#2-start-the-litellm-proxy}

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

#### 3. 對您的 Vertex AI Agent Engine 發出請求 {#3-make-requests-to-your-vertex-ai-agent-engine}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Basic Agent Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "vertex-agent-1",
    "messages": [
      {"role": "user", "content": "Summarize the main benefits of cloud computing"}
    ]
  }'
```

</TabItem>

<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Using OpenAI SDK with LiteLLM Proxy"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

response = client.chat.completions.create(
    model="vertex-agent-1",
    messages=[
      {"role": "user", "content": "What are best practices for API design?"}
    ]
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## LiteLLM A2A Gateway {#litellm-a2a-gateway}

您也可以透過 LiteLLM 的 A2A（Agent-to-Agent）Gateway UI 連接到 Vertex AI Agent Engine。這提供了一種無需撰寫程式碼即可註冊與測試代理程式的可視化方式。

### 1. 前往 Agents {#1-navigate-to-agents}

從側邊欄點選「Agents」開啟代理程式管理頁面，然後點選「+ Add New Agent」。

![點選 Agents](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/9a979927-ce6b-4168-9fba-e53e28f1c2c4/ascreenshot.jpeg?tl_px=0,14&br_px=1376,783&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=17,277)

![新增 Agent](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/a311750c-2e85-4589-99cb-2ce7e4021e77/ascreenshot.jpeg?tl_px=0,0&br_px=1376,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=195,257)

### 2. 選擇 Vertex AI Agent Engine 類型 {#2-select-vertex-ai-agent-engine-type}

點選「A2A Standard」查看可用的代理程式類型，然後選擇「Vertex AI Agent Engine」。

![選擇 A2A Standard](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/5b1acc4c-dc3f-4639-b4a0-e64b35c228fd/ascreenshot.jpeg?tl_px=52,0&br_px=1428,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,271)

![選擇 Vertex AI Agent Engine](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/2f3bab61-3e02-4db7-84f0-82200a0f4136/ascreenshot.jpeg?tl_px=0,244&br_px=1376,1013&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=477,277)

### 3. 設定代理程式 {#3-configure-the-agent}

填入以下欄位：

- **Agent Name** - 您的代理程式友善名稱（例如，`my-vertex-agent`）
- **Reasoning Engine Resource ID** - 來自 Google Cloud Console 的完整資源路徑（例如，`projects/1060139831167/locations/us-central1/reasoningEngines/8263861224643493888`）
- **Vertex Project** - 您的 Google Cloud 專案 ID
- **Vertex Location** - 您的代理程式部署所在的區域（例如，`us-central1`）

![輸入 Agent Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/695b84c7-9511-4337-bf19-f4505ab2b72b/ascreenshot.jpeg?tl_px=0,90&br_px=1376,859&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=480,276)

![輸入 Resource ID](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/ddce64df-b3a3-4519-ab62-f137887bcea2/ascreenshot.jpeg?tl_px=0,294&br_px=1376,1063&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=440,277)

您可以在 Google Cloud Console 的 Vertex AI > Agent Engine 下找到 Resource ID：

![從 Google Cloud Console 複製 Resource ID](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/185d7f17-cbaa-45de-948d-49d2091805ea/ascreenshot.jpeg?tl_px=0,165&br_px=1376,934&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=493,276)

![輸入 Vertex Project](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/a64da441-3e61-4811-a1e3-9f0b12c949ff/ascreenshot.jpeg?tl_px=0,233&br_px=1376,1002&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=501,277)

您可以在 Google Cloud Console 中找到 Project ID：

![從 Google Cloud Console 複製 Project ID](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/9ecad3bb-a534-42d6-9604-33906014fad6/user_cropped_screenshot.webp?tl_px=0,0&br_px=1728,1028&force_format=jpeg&q=100&width=1120.0)

![輸入 Vertex Location](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/316d1f38-4fb7-4377-86b6-c0fe7ac24383/ascreenshot.jpeg?tl_px=0,330&br_px=1376,1099&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=423,277)

### 4. 建立代理程式 {#4-create-agent}

點選「Create Agent」以儲存您的設定。

![建立 Agent](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/fb04b95d-793f-4eed-acf4-d1b3b5fa65e9/ascreenshot.jpeg?tl_px=352,347&br_px=1728,1117&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=623,498)

### 5. 在 Playground 中測試 {#5-test-in-playground}

前往側邊欄中的「Playground」測試您的代理程式。

![前往 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/9e01369b-6102-4fe3-96a7-90082cadfd6e/ascreenshot.jpeg?tl_px=0,0&br_px=1376,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=55,226)

### 6. 選擇 A2A 端點 {#6-select-a2a-endpoint}

點選端點下拉選單並選擇 `/v1/a2a/message/send`。

![選擇端點](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/d5aeac35-531b-4cf0-af2d-88f0a71fd736/ascreenshot.jpeg?tl_px=0,146&br_px=1376,915&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=299,277)

### 7. 選擇您的代理程式並傳送訊息 {#7-select-your-agent-and-send-a-message}

從下拉選單中選取您的 Vertex AI Agent Engine，然後傳送測試訊息。

![選擇 Agent](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/353431f3-a0ba-4436-865d-ae11595e9cc4/ascreenshot.jpeg?tl_px=0,263&br_px=1376,1032&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=270,277)

![傳送訊息](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/fbfce72e-f50b-43e1-b6e5-0d41192d8e2d/ascreenshot.jpeg?tl_px=95,347&br_px=1471,1117&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,474)

![代理程式回應](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/892dd826-fbf9-4530-8d82-95270889274a/ascreenshot.jpeg?tl_px=0,82&br_px=1376,851&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=485,277)

## 環境變數 {#environment-variables}

| 變數 | 說明 |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | 服務帳戶 JSON 金鑰檔案的路徑 |
| `VERTEXAI_PROJECT` | Google Cloud 專案 ID |
| `VERTEXAI_LOCATION` | Google Cloud 區域（預設：`us-central1`） |

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export VERTEXAI_PROJECT="your-project-id"
export VERTEXAI_LOCATION="us-central1"
```

## 延伸閱讀 {#further-reading}

- [Vertex AI Agent Engine 文件](https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/overview)
- [建立 Reasoning Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/create)
- [A2A Agent Gateway](../a2a.md)
- [Vertex AI 提供者](./vertex.md)
