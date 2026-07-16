import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Pydantic AI 代理程式 {#pydantic-ai-agents}

透過 LiteLLM 的 A2A Gateway 呼叫 Pydantic AI 代理程式。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | 透過 `to_a2a()` 方法提供原生 A2A 支援的 Pydantic AI 代理程式。LiteLLM 會為未原生支援串流的代理程式提供假串流支援。 |
| LiteLLM 上的提供者路由 | A2A Gateway |
| 支援的端點 | `/v1/a2a/message/send` |
| 提供者文件 | [Pydantic AI 代理程式 ↗](https://ai.pydantic.dev/agents/) |

## LiteLLM A2A 閘道 {#litellm-a2a-gateway}

所有 Pydantic AI 代理程式都需要使用 `to_a2a()` 方法公開為 A2A 代理程式。當您的代理程式伺服器執行後，即可將其新增到 LiteLLM Gateway。

### 1. 設定 Pydantic AI 代理程式伺服器 {#1-setup-pydantic-ai-agent-server}

LiteLLM 要求 Pydantic AI 代理程式遵循 [A2A（Agent-to-Agent）協定](https://github.com/google/A2A)。Pydantic AI 透過 `to_a2a()` 方法原生支援 A2A，該方法會將您的代理程式公開為符合 A2A 規範的伺服器。

#### 安裝相依套件 {#install-dependencies}

```bash
uv add pydantic-ai fasta2a uvicorn
```

#### 建立代理程式 {#create-agent}

```python title="agent.py"
from pydantic_ai import Agent

agent = Agent('openai:gpt-4o-mini', instructions='Be helpful!')

@agent.tool_plain
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"Weather in {city}: Sunny, 72°F"

@agent.tool_plain  
def calculator(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))

# Native A2A server - Pydantic AI handles it automatically
app = agent.to_a2a()
```

#### 執行伺服器 {#run-server}

```bash
uvicorn agent:app --host 0.0.0.0 --port 9999
```

伺服器執行於 `http://localhost:9999`

### 2. 前往 Agents {#2-navigate-to-agents}

從側邊欄點擊「Agents」以開啟代理程式管理頁面，然後點擊「+ Add New Agent」。

### 3. 選擇 Pydantic AI 代理程式類型 {#3-select-pydantic-ai-agent-type}

點擊「A2A Standard」以查看可用的代理程式類型，然後選擇「Pydantic AI」。

![選擇 A2A Standard](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/1055acb1-064b-4465-8e6a-8278291bc661/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=395,147)

![選擇 Pydantic AI](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/0998e38c-8534-40f1-931a-be96c2cae0ad/ascreenshot.jpeg?tl_px=0,52&br_px=2201,1283&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=421,277)

### 4. 設定代理程式 {#4-configure-the-agent}

填入以下欄位：

- **Agent Name** - 您的代理程式的唯一識別碼（例如，`test-pydantic-agent`）
- **Agent URL** - 您的 Pydantic AI 代理程式執行所在的 URL。我們使用 `http://localhost:9999`，因為前一步驟中我們就是在該位置啟動 Pydantic AI 代理程式伺服器。

![輸入 Agent Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/8cf3fbde-05f3-48d1-81b6-6f857bd6d360/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=443,225)

![設定 Agent Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/fb555808-4761-4c49-a415-200ac1bdb525/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1463&force_format=jpeg&q=100&width=1120.0)

![輸入 Agent URL](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/303eae61-4352-4fb0-a537-806839c234ba/ascreenshot.jpeg?tl_px=0,212&br_px=2201,1443&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=456,277)

### 5. 建立代理程式 {#5-create-agent}

點擊「Create Agent」以儲存您的設定。

![建立代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/914f3367-df7d-4244-bd4d-e99ce0a6193a/ascreenshot.jpeg?tl_px=416,438&br_px=2618,1669&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=690,277)

### 6. 在 Playground 中測試 {#6-test-in-playground}

前往側邊欄中的「Playground」以測試您的代理程式。

![前往 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/c73c9f3b-22af-4105-aafa-2d34c4986ef3/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=44,97)

### 7. 選擇 A2A 端點 {#7-select-a2a-endpoint}

點擊端點下拉選單並搜尋「a2a」，然後選擇 `/v1/a2a/message/send`。

![點擊端點下拉選單](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/196d97ac-bcba-47f0-9880-97b80250e00c/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=261,230)

![搜尋 A2A](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/26b68f21-29f9-4c4c-b8b5-d2e11cbfd14a/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1463&force_format=jpeg&q=100&width=1120.0)

![選擇 A2A 端點](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/41576fb1-d385-4fb2-84e9-142dd7fe5181/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=307,270)

### 8. 選擇您的代理程式並傳送訊息 {#8-select-your-agent-and-send-a-message}

從下拉選單中選取您的 Pydantic AI 代理程式，並傳送測試訊息。

![點擊代理程式下拉選單](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/a96d7967-3d54-4cbf-bd3e-b38f1be9df76/ascreenshot.jpeg?tl_px=0,54&br_px=2201,1285&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=274,277)

![選擇代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/e05a5a6e-d044-4480-b94e-7c03cfb92ac5/ascreenshot.jpeg?tl_px=0,113&br_px=2201,1344&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=290,277)

![傳送訊息](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-16/29162702-968a-401a-aac1-c844bfc5f4a3/ascreenshot.jpeg?tl_px=91,653&br_px=2292,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,436)

## 進一步閱讀 {#further-reading}

- [Pydantic AI 文件](https://ai.pydantic.dev/)
- [Pydantic AI 代理程式](https://ai.pydantic.dev/agents/)
- [A2A 代理程式 Gateway](../a2a.md)
- [A2A 成本追蹤](../a2a_cost_tracking.md)
