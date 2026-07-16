import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LangGraph {#langgraph}

透過 LiteLLM 使用 OpenAI chat completions 格式呼叫 LangGraph 代理程式。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | LangGraph 是一個用於建構具狀態、多角色應用程式的框架，搭配 LLMs。LiteLLM 支援透過串流與非串流端點呼叫 LangGraph 代理程式。 |
| LiteLLM 上的提供者路由 | `langgraph/{agent_id}` |
| 提供者文件 | [LangGraph Platform ↗](https://langchain-ai.github.io/langgraph/cloud/quick_start/) |

**先決條件：** 您需要一個正在執行的 LangGraph 伺服器。請參閱下方的 [設定本機 LangGraph 伺服器](#setting-up-a-local-langgraph-server)。

## 快速開始 {#quick-start}

### 模型格式 {#model-format}

```shell showLineNumbers title="Model Format"
langgraph/{agent_id}
```

**範例：**
- `langgraph/agent` - 呼叫預設代理程式

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic LangGraph Completion"
import litellm

response = litellm.completion(
    model="langgraph/agent",
    messages=[
        {"role": "user", "content": "What is 25 * 4?"}
    ],
    api_base="http://localhost:2024",
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Streaming LangGraph Response"
import litellm

response = litellm.completion(
    model="langgraph/agent",
    messages=[
        {"role": "user", "content": "What is the weather in Tokyo?"}
    ],
    api_base="http://localhost:2024",
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 在 config.yaml 中設定您的模型 {#1-configure-your-model-in-configyaml}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml showLineNumbers title="LiteLLM Proxy Configuration"
model_list:
  - model_name: langgraph-agent
    litellm_params:
      model: langgraph/agent
      api_base: http://localhost:2024
```

</TabItem>
</Tabs>

#### 2. 啟動 LiteLLM Proxy {#2-start-the-litellm-proxy}

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

#### 3. 向您的 LangGraph 代理程式發出請求 {#3-make-requests-to-your-langgraph-agent}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Basic Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "langgraph-agent",
    "messages": [
      {"role": "user", "content": "What is 25 * 4?"}
    ]
  }'
```

```bash showLineNumbers title="Streaming Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "langgraph-agent",
    "messages": [
      {"role": "user", "content": "What is the weather in Tokyo?"}
    ],
    "stream": true
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
    model="langgraph-agent",
    messages=[
        {"role": "user", "content": "What is 25 * 4?"}
    ]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Streaming with OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

stream = client.chat.completions.create(
    model="langgraph-agent",
    messages=[
        {"role": "user", "content": "What is the weather in Tokyo?"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
</Tabs>

## 環境變數 {#environment-variables}

| 變數 | 說明 |
|----------|-------------|
| `LANGGRAPH_API_BASE` | 您的 LangGraph 伺服器基礎 URL（預設：`http://localhost:2024`） |
| `LANGGRAPH_API_KEY` | 用於驗證的可選 API 金鑰 |

## 支援的參數 {#supported-parameters}

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `model` | string | 格式為 `langgraph/{agent_id}` 的代理程式 ID |
| `messages` | array | OpenAI 格式的聊天訊息 |
| `stream` | boolean | 啟用串流回應 |
| `api_base` | string | LangGraph 伺服器 URL |
| `api_key` | string | 可選 API 金鑰 |

## 設定本機 LangGraph 伺服器 {#setting-up-a-local-langgraph-server}

在將 LiteLLM 與 LangGraph 搭配使用之前，您需要一個正在執行的 LangGraph 伺服器。

### 先決條件 {#prerequisites}

- Python 3.11+
- 一個 LLM API 金鑰（OpenAI 或 Google Gemini）

### 1. 安裝 LangGraph CLI {#1-install-the-langgraph-cli}

```bash
uv add "langgraph-cli[inmem]"
```

### 2. 建立新的 LangGraph 專案 {#2-create-a-new-langgraph-project}

```bash
langgraph new my-agent --template new-langgraph-project-python
cd my-agent
```

### 3. 安裝相依套件 {#3-install-dependencies}

```bash
uv add -e .
```

### 4. 設定您的 API 金鑰 {#4-set-your-api-key}

```bash
echo "OPENAI_API_KEY=your_key_here" > .env
```

### 5. 啟動伺服器 {#5-start-the-server}

```bash
langgraph dev
```

伺服器將會在 `http://localhost:2024` 啟動。

### 驗證伺服器正在執行 {#verify-the-server-is-running}

```bash
curl -s --request POST \
  --url "http://localhost:2024/runs/wait" \
  --header 'Content-Type: application/json' \
  --data '{
    "assistant_id": "agent",
    "input": {
      "messages": [{"role": "human", "content": "Hello!"}]
    }
  }'
```


## LiteLLM A2A Gateway {#litellm-a2a-gateway}

您可以在 LiteLLM 的 [A2A（Agent-to-Agent）Gateway](../a2a.md) 中註冊 LangGraph 代理程式，探索其上游 agent card，策展技能與能力，並透過 LiteLLM proxy 呼叫它們。

### 1. 前往 Agents {#1-navigate-to-agents}

從側邊欄點擊「Agents」以開啟代理程式管理頁面，然後點擊「+ Add New Agent」。

![前往 Agents](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/27429cae-f743-440a-a6aa-29fa7ee013db/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=211,114)

### 2. 選擇 LangGraph Agent 類型 {#2-select-langgraph-agent-type}

點擊「A2A Standard」以查看可用的代理程式類型，然後搜尋「langgraph」並選取「Connect to LangGraph agents via the LangGraph Platform API」。

![選擇 A2A Standard](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/4add4088-683d-49ca-9374-23fd65dddf8e/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=511,139)

![選擇 LangGraph](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/fd197907-47c7-4e05-959c-c0d42264263c/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=431,246)

### 3. 設定代理程式 {#3-configure-the-agent}

填入以下欄位：

- **Agent Name** - 唯一識別碼（例如，`lan-agent`）
- **LangGraph API Base** - 您的 LangGraph 伺服器 URL，通常為 `http://127.0.0.1:2024/`
- **API Key** - 可選。LangGraph 預設不需要 API 金鑰
- **Assistant ID** - LangGraph 不會使用，您可以在此輸入任何字串

![輸入 Agent Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/adce3df9-a67c-4d23-b2b5-05120738bc46/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1463&force_format=jpeg&q=100&width=1120.0)

![輸入 API Base](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6a6a03a7-f235-41db-b4ba-d32ced330f25/ascreenshot.jpeg?tl_px=0,251&br_px=2617,1714&force_format=jpeg&q=100&width=1120.0)

### 4：探索 agent card {#4-discover-the-agent-card}

一旦填入 base URL 和 assistant ID，探索就會自動執行。您也可以從探索面板手動觸發。

預覽是一個表單。您可以：

- **編輯** 名稱、說明、provider、icon URL，以及文件 URL。
- **新增、移除或重新排序技能**，並編輯每個技能的名稱、說明、標籤、範例，以及輸入/輸出模式。
- **切換 LiteLLM 支援的能力**。

在儲存前選取或取消選取技能與能力。LiteLLM 只會保留您在表單中保留的內容。

LiteLLM 不會代理的欄位不會顯示。如需完整支援矩陣，請參閱 [Agent card support](../a2a_agent_card.md#agent-card-support)。

![UI 上的 Agent Card 欄位](../../img/providers/langgraph/agent-card-fields-on-ui.png)

### 5：儲存代理程式 {#5-save-the-agent}

點擊 Next 以儲存，並完成其餘步驟

![點擊 Next](../../img/providers/langgraph/click-on-next.png)

### 6：驗證已提供的 card {#6-verify-the-served-card}

從您的終端機擷取 LiteLLM 正在提供的 agent card：

```bash
curl -H "Authorization: Bearer sk-1234" \
  http://localhost:4000/a2a/{agent_id}/.well-known/agent.json | jq
```

您應該會看到您儲存的 card，其中：

- 指向 LiteLLM 而非上游的 `supportedInterfaces[0].url`
- 顯示 `securitySchemes` 為 `LiteLLMKey`（HTTP bearer）
- 您在註冊期間保留的技能

### 7. 在 Playground 中測試 {#7-test-in-playground}
前往側邊欄的「Playground」來測試您的代理程式。將端點類型改為 `/v1/a2a/message/send`。

![前往 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/c4262189-95ac-4fbc-b5af-8aba8126e4f7/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=41,104)

![選擇 A2A 端點](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6cbc8e93-7d0c-47fc-9ad4-562663f759d5/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=324,265)

### 8. 選擇您的代理程式並傳送訊息 {#8-select-your-agent-and-send-a-message}
從下拉選單選取您的 LangGraph 代理程式並傳送測試訊息。

![選擇代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/d01da2f1-3b89-47d7-ba95-de2dd8efbc1e/ascreenshot.jpeg?tl_px=0,92&br_px=2201,1323&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=348,277)

![傳送訊息](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/79db724e-a99e-493a-9747-dc91cb398370/ascreenshot.jpeg?tl_px=51,653&br_px=2252,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,444)

![代理程式回應](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/82aa546a-0eb5-4836-b986-9aefcfe09e10/ascreenshot.jpeg?tl_px=295,28&br_px=2496,1259&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,277)

### 9：手動呼叫代理程式 {#9-invoke-the-agent-manually}

向 LiteLLM proxy URL 傳送一個 A2A `message/send` 請求：

```bash
curl -X POST http://localhost:4000/a2a/{agent_id} \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-1",
    "method": "message/send",
    "params": {
      "message": {
        "messageId": "msg-001",
        "role": "user",
        "parts": [{"kind": "text", "text": "My order is urgent and still not delivered"}],
        "metadata": {"skillId": "triage_ticket"}
      }
    }
  }'
```

若要串流，請使用 `message/stream` 並在 curl 中加入 `-N -H "Accept: text/event-stream"`。

另請參閱 [Invoking A2A Agents](../a2a_invoking_agents.md) 以取得 SDK 範例。

## 延伸閱讀 {#further-reading}

- [LangGraph Platform Documentation](https://langchain-ai.github.io/langgraph/cloud/quick_start/)
- [LangGraph A2A endpoint docs](https://docs.langchain.com/langsmith/server-a2a)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [A2A Agent Gateway](../a2a.md)
- [A2A Agent Card on LiteLLM](../a2a_agent_card.md)
- [A2A Cost Tracking](../a2a_cost_tracking.md)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)
