---
title: "透過 LiteLLM 的框架範例"
description: "透過 LiteLLM 進行模型連線的完整框架範例。"
slug: "/proxy/lens/framework-examples"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 透過 LiteLLM 的框架範例 {#framework-examples-through-litellm}

如果您的代理程式透過 LiteLLM 閘道呼叫模型，請使用這些範例。先 [建立追蹤金鑰](./first-trace.md#connect-your-agent)，並複製完整的 Lens 追蹤端點。閘道傳送模型請求；Lens 接收追蹤。

對於使用直接提供者的獨立 Lens 安裝，請使用 [第一個 trace 範例](./first-trace.md)，或您的 [框架整合指南](./first-trace.md#connect-your-existing-agent) 中的直接提供者範本。

## 設定匯出器 {#send-your-first-trace}

在您啟動代理程式的終端機中執行這些 export。貼上來自 Lens 追蹤設定的端點和金鑰：

```bash
export LENS_TRACING_KEY="<paste your Lens tracing key>"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="<paste the full Traces endpoint>"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer $LENS_TRACING_KEY"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_METRICS_EXPORTER="none"
export OTEL_LOGS_EXPORTER="none"
export OTEL_SERVICE_NAME="research_agent"
```

如果您要為應用程式新增追蹤，請保留您現有的模型設定。在建立代理程式之前先初始化 instrumentation。如果您的應用程式已有 OpenTelemetry tracer provider，請保留它並更新其匯出器，而不是建立第二個。

以下的框架範例使用 LiteLLM 進行模型呼叫。對於直接提供者連線，請使用 [OpenAI Agents SDK](/docs/proxy/lens/integrations/openai-agents) 或 [OpenTelemetry](/docs/proxy/lens/integrations/opentelemetry) 直接提供者範本。兩者都會將遙測資料直接傳送至 Lens。

對於以下的閘道範例，也請設定模型連線：

```bash
export LITELLM_GATEWAY_URL="<your gateway base URL without a trailing slash or /v1>"
export LITELLM_API_KEY="<your key with model access>"
export LITELLM_MODEL="<your configured model alias>"
```

從您的管理員或儀表板中的 **Virtual Keys** 取得模型金鑰，並從 **Models** 複製模型別名。本機 Docker 閘道使用 `http://localhost:4000`。模型金鑰和追蹤金鑰的用途不同。

## 執行您的代理程式 {#run-your-agent}

選擇您的框架。每個分頁都包含相依性、完整的範例，以及執行命令。代理程式使用框架的 `name`、`role` 或追蹤設定命名為 **research_agent**。將它變更為您自己代理程式的名稱。

對於代理程式框架，請使用支援工具呼叫的模型。對於 Python 範例，請使用 Python {{python_version}} 和獨立的虛擬環境：

```bash
python3 -m venv .venv
source .venv/bin/activate
```

<Tabs groupId="lens-framework" queryString="framework" defaultValue="langgraph" className="lens-framework-tabs">

<TabItem value="deepagents" label="DeepAgents">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  deepagents openinference-instrumentation-langchain langchain-openai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from deepagents import create_deep_agent

from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["LITELLM_MODEL"],
    base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)

agent = create_deep_agent(name=AGENT_NAME, model=model, tools=[])
result = agent.invoke({"messages": [{"role": "user", "content": "What is an agent trace?"}]})
print(result["messages"][-1].content)
```

```bash
python agent.py
```

[完整的 DeepAgents 指南和範例](/docs/proxy/lens/integrations/deepagents)

</TabItem>

<TabItem value="langgraph" label="LangGraph">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  langgraph openinference-instrumentation-langchain langchain-openai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from langgraph.graph import END, START, MessagesState, StateGraph
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["LITELLM_MODEL"],
    base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)
graph = StateGraph(MessagesState)
graph.add_node("answer", lambda state: {"messages": [model.invoke(state["messages"])]})
graph.add_edge(START, "answer")
graph.add_edge("answer", END)
agent = graph.compile(name=AGENT_NAME)
result = agent.invoke({"messages": [{"role": "user", "content": "What is an agent trace?"}]})
print(result["messages"][-1].content)
```

```bash
python agent.py
```

[完整的 LangGraph 指南和範例](/docs/proxy/lens/integrations/langgraph)

</TabItem>

<TabItem value="langchain" label="LangChain">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  langchain openinference-instrumentation-langchain langchain-openai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from langchain.agents import create_agent

from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["LITELLM_MODEL"],
    base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)

agent = create_agent(name=AGENT_NAME, model=model, tools=[])
result = agent.invoke({"messages": [{"role": "user", "content": "What is an agent trace?"}]})
print(result["messages"][-1].content)
```

```bash
python agent.py
```

[完整的 LangChain 指南和範例](/docs/proxy/lens/integrations/langchain)

</TabItem>

<TabItem value="openai-agents" label="OpenAI Agents">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  openai-agents openinference-instrumentation-openai-agents
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from agents import Agent, RunConfig, Runner

from agents import OpenAIChatCompletionsModel
from openai import AsyncOpenAI

client = AsyncOpenAI(base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1", api_key=os.environ["LITELLM_API_KEY"])
model = OpenAIChatCompletionsModel(model=os.environ["LITELLM_MODEL"], openai_client=client)

agent = Agent(name=AGENT_NAME, model=model)
result = Runner.run_sync(
    agent, "What is an agent trace?",
    run_config=RunConfig(workflow_name=AGENT_NAME),
)
print(result.final_output)
```

```bash
python agent.py
```

[完整的 OpenAI Agents 指南和範例](/docs/proxy/lens/integrations/openai-agents)

</TabItem>

<TabItem value="claude" label="Claude Agent SDK">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  claude-agent-sdk openinference-instrumentation-claude-agent-sdk
```

將此儲存為 `agent.py`：

為 `LITELLM_MODEL` 使用與 Anthropic 相容的模型別名。SDK 必須能夠透過其 Anthropic API 連線到閘道。

```python title="agent.py"
import asyncio
import os

AGENT_NAME = "research_agent"

os.environ["OTEL_RESOURCE_ATTRIBUTES"] = f"gen_ai.agent.name={AGENT_NAME}"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

options = ClaudeAgentOptions(
    model=os.environ["LITELLM_MODEL"],
    env={"ANTHROPIC_BASE_URL": os.environ["LITELLM_GATEWAY_URL"], "ANTHROPIC_AUTH_TOKEN": os.environ["LITELLM_API_KEY"]},
    tools=[],
    setting_sources=[],
    max_turns=1,
)

async def main():
    async for message in query(prompt="What is an agent trace?", options=options):
        if isinstance(message, ResultMessage):
            print(message.result)

asyncio.run(main())
```

```bash
python agent.py
```

這會擷取 SDK 輸入和輸出；內部模型呼叫不會由此 instrumentor 暴露。

[完整的 Claude Agent SDK 指南和範例](/docs/proxy/lens/integrations/claude-agent-sdk)

</TabItem>

<TabItem value="crewai" label="CrewAI">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  crewai openinference-instrumentation-crewai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from crewai import Agent, Crew, Task

from crewai import LLM

model = LLM(
    model=f"openai/{os.environ['LITELLM_MODEL']}",
    base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)

agent = Agent(
    role=AGENT_NAME,
    goal="Answer questions clearly",
    backstory="You explain technical concepts.",
    llm=model,
)
task = Task(description="What is an agent trace?", expected_output="A short answer", agent=agent)
print(Crew(agents=[agent], tasks=[task]).kickoff())
```

```bash
python agent.py
```

[完整的 CrewAI 指南和範例](/docs/proxy/lens/integrations/crewai)

</TabItem>

<TabItem value="pydantic-ai" label="Pydantic AI">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  "pydantic-ai-slim[openai]>=1"
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from pydantic_ai import Agent

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

model = OpenAIChatModel(
    os.environ["LITELLM_MODEL"],
    provider=OpenAIProvider(base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1", api_key=os.environ["LITELLM_API_KEY"]),
)

Agent.instrument_all()
agent = Agent(model, name=AGENT_NAME)
print(agent.run_sync("What is an agent trace?").output)
```

```bash
python agent.py
```

[完整的 Pydantic AI 指南和範例](/docs/proxy/lens/integrations/pydantic-ai)

</TabItem>

<TabItem value="llamaindex" label="LlamaIndex">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  "llama-index-core>=0.14.19" openinference-instrumentation-llama-index \
  llama-index-llms-openai-like
```

將此儲存為 `agent.py`：

```python title="agent.py"
import asyncio
import os

AGENT_NAME = "research_agent"

os.environ["OTEL_RESOURCE_ATTRIBUTES"] = f"gen_ai.agent.name={AGENT_NAME}"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from openinference.instrumentation.llama_index import LlamaIndexInstrumentor

LlamaIndexInstrumentor().instrument()
from llama_index.core.agent.workflow import FunctionAgent

from llama_index.llms.openai_like import OpenAILike

model = OpenAILike(
    model=os.environ["LITELLM_MODEL"],
    api_base=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
    is_chat_model=True,
    is_function_calling_model=True,
    temperature=1,
)

agent = FunctionAgent(name=AGENT_NAME, llm=model, tools=[], streaming=False)
async def main():
    result = await agent.run(user_msg="What is an agent trace?")
    print(result)

asyncio.run(main())
```

```bash
python agent.py
```

resource 屬性會提供代理程式名稱，因為此 instrumentor 不會匯出 FunctionAgent.name。

[完整的 LlamaIndex 指南和範例](/docs/proxy/lens/integrations/llamaindex)

</TabItem>

<TabItem value="adk" label="Google ADK">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  "google-adk>=1.18" litellm openinference-instrumentation-google-adk
```

將此儲存為 `agent.py`：

```python title="agent.py"
import asyncio
import os

AGENT_NAME = "research_agent"

os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "SPAN_ONLY"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner

from google.adk.models.lite_llm import LiteLlm

model = LiteLlm(
    model=f"openai/{os.environ['LITELLM_MODEL']}",
    api_base=f"{os.environ['LITELLM_GATEWAY_URL']}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)

agent = Agent(name=AGENT_NAME, model=model)
asyncio.run(InMemoryRunner(agent=agent).run_debug("What is an agent trace?"))
```

```bash
python agent.py
```

`SPAN_ONLY` 會記錄檢查和調查該執行所需的訊息。

[完整的 Google ADK 指南和範例](/docs/proxy/lens/integrations/google-adk)

</TabItem>

<TabItem value="strands" label="Strands">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http \
  "strands-agents[otel]" openai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

os.environ["OTEL_SEMCONV_STABILITY_OPT_IN"] = "gen_ai_latest_experimental,gen_ai_span_attributes_only"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from strands import Agent

from strands.models.openai import OpenAIModel

model = OpenAIModel(
    client_args={"base_url": f"{os.environ['LITELLM_GATEWAY_URL']}/v1", "api_key": os.environ["LITELLM_API_KEY"]},
    model_id=os.environ["LITELLM_MODEL"],
)

agent = Agent(name=AGENT_NAME, model=model)
print(agent("What is an agent trace?"))
```

```bash
python agent.py
```

語意慣例設定會在 span 中啟用訊息內容。

[完整的 Strands 指南和範例](/docs/proxy/lens/integrations/strands)

</TabItem>

<TabItem value="vercel" label="Vercel AI SDK">

```bash
npm install ai @ai-sdk/otel @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-http @ai-sdk/openai-compatible
npm install --save-dev tsx
```

將此儲存為 `agent.mts`：

```typescript title="agent.mts"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OpenTelemetry } from "@ai-sdk/otel";
import { generateText, registerTelemetry } from "ai";

const sdk = new NodeSDK({ traceExporter: new OTLPTraceExporter() });
sdk.start();
registerTelemetry(new OpenTelemetry());

const AGENT_NAME = "research_agent";
const litellm = createOpenAICompatible({
  name: "litellm",
  baseURL: `${process.env.LITELLM_GATEWAY_URL}/v1`,
  apiKey: process.env.LITELLM_API_KEY,
});
const model = litellm(process.env.LITELLM_MODEL!);

try {
  const { text } = await generateText({
    model,
    prompt: "What is an agent trace?",
    telemetry: { isEnabled: true, functionId: AGENT_NAME },
  });
  console.log(text);
} finally {
  await sdk.shutdown();
}
```

```bash
npx tsx agent.mts
```

[完整的 Vercel AI SDK 指南和範例](/docs/proxy/lens/integrations/vercel-ai-sdk-js)

</TabItem>

<TabItem value="openclaw" label="OpenClaw">

啟用 [diagnostics-otel 外掛程式](https://docs.openclaw.ai/plugins/reference/diagnostics-otel)，並保留您現有的模型設定。將以下的追蹤設定新增至 `~/.openclaw/openclaw.json`：

```json title="openclaw.json"
{
  "agents": {
    "list": [{ "id": "research_agent" }]
  },
  "plugins": {
    "entries": { "diagnostics-otel": { "enabled": true } }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "tracesEndpoint": "${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT}",
      "headers": { "Authorization": "Bearer ${LENS_TRACING_KEY}" },
      "captureContent": true,
      "traces": true,
      "metrics": false,
      "logs": false,
      "sampleRate": 1
    }
  }
}
```

在您設定連線詳細資料的終端機中執行代理程式：

```bash
openclaw agent --local --agent research_agent --session-id first-trace --message "What is an agent trace?"
```

在 Lens 中選取 **research_agent**。變更設定後，重新啟動現有的 OpenClaw 閘道。新增設定時，請保留您現有的代理程式。

[完整的 OpenClaw 指南和範例](/docs/proxy/lens/integrations/openclaw)

</TabItem>

<TabItem value="hermes" label="Hermes">

啟用 [社群 hermes-otel 外掛程式](https://github.com/briancaffey/hermes-otel#install)，並保留您現有的模型設定。將以下的追蹤設定新增至 `~/.hermes/hermes_otel.yaml`：

```yaml title="hermes_otel.yaml"
resource_attributes:
  gen_ai.agent.name: research_agent
content_capture: full
backends:
  - type: otlp
    endpoint: ${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT}
    headers:
      Authorization: "Bearer ${LENS_TRACING_KEY}"
    metrics: false
    logs: false
```

開始新的 Hermes 工作階段並提出問題。設定的名稱 **research_agent** 會出現在 Lens 中。Hermes 內建的診斷遙測本身不包含調查所需的對話內容。

[完整的 Hermes 指南和範例](/docs/proxy/lens/integrations/hermes)

</TabItem>

<TabItem value="otel" label="OpenTelemetry">

```bash
python -m pip install opentelemetry-distro \
  opentelemetry-exporter-otlp-proto-http openai
```

將此儲存為 `agent.py`：

```python title="agent.py"
import os

AGENT_NAME = "research_agent"

from opentelemetry.instrumentation.auto_instrumentation import initialize

initialize()

from opentelemetry import trace
from openai import OpenAI

client = OpenAI(base_url=f"{os.environ['LITELLM_GATEWAY_URL']}/v1", api_key=os.environ["LITELLM_API_KEY"])

with trace.get_tracer(__name__).start_as_current_span(AGENT_NAME) as span:
    span.set_attribute("gen_ai.agent.name", AGENT_NAME)
    span.set_attribute("openinference.span.kind", "AGENT")
    span.set_attribute("input.value", "What is an agent trace?")
    result = client.chat.completions.create(
        model=os.environ["LITELLM_MODEL"],
        messages=[{"role": "user", "content": "What is an agent trace?"}],
    )
    answer = result.choices[0].message.content
    span.set_attribute("output.value", str(answer))
    print(answer)
```

```bash
python agent.py
```

[完整的 OpenTelemetry 指南和範例](/docs/proxy/lens/integrations/opentelemetry)

</TabItem>

</Tabs>

對於完整的專案和多代理程式範例，請使用側邊欄中的 **Integrations** 指南，或 [範例儲存庫](https://github.com/BerriAI/litellm-lens-example)。這些專案使用 `LENS_URL` 作為接收基礎 URL，不含 `/v1/traces`；它們的匯出器會附加該路徑。儀表板會在追蹤設定區段中直接顯示框架程式碼片段。

如需可運作的範例，請使用 [DeepLite](https://github.com/BerriAI/deeplite)。在其 `.env` 檔案中設定 `LITELLM_DEV_BASE=https://<your-lens-ingestion-host>/v1/traces` 和 `LITELLM_DEV_KEY=<your-lens-tracing-key>`，然後執行該代理程式。

若要記錄個人編碼工作階段，請依照 [Claude Code 和 Codex 設定](./coding-agents.md)。

## 4. 檢視您的第一個 trace {#view-your-first-trace}

開啟 **Lens > Traces**。選取包含您執行的時間範圍，然後開啟它。對於上述範例，請尋找 **research_agent**。在建立調查時，**Agent** 下也可使用相同名稱。選取某個步驟以讀取其輸入、輸出與屬性。

![research_agent trace，包含其問題、模型呼叫與最終答案。](/img/lens/first-agent-trace.png)

確認您可以看到任務、工具結果與最終答案。若這些內容缺失，請在執行調查之前更新您代理程式的 instrumentation。

## 疑難排解 {#troubleshooting}

| 您看到的情況 | 要檢查的項目 |
| --- | --- |
| 模型答案已出現，但沒有 trace | 在與您的代理程式相同的終端機中設定匯出器變數。在建立代理程式之前先初始化 instrumentation。檢查終端機中的匯出器錯誤。 |
| trace 端點回傳 `401` | 使用專用的 Lens 追蹤金鑰。模型金鑰無法上傳追蹤。 |
| trace 端點回傳 `404` 或 `410` | 從儀表板複製完整的端點。若有 `/lens-ingest` 請保留，並且只包含一次 `/v1/traces`。 |
| 建立金鑰後立即出現 `429` | 等待最多 30 秒讓憑證同步，然後重試。 |
| 設定要求 `LITELLM_LENS_PUBLIC_URL`，或上傳回傳 `503` | 請管理員 [檢查服務連線](./deployment.md#check-the-installation)。 |
| 模型請求失敗 | 請將閘道 URL、模型金鑰和模型別名與追蹤設定分開檢查。 |
| 追蹤沒有輸入或輸出 | 檢查其整合指南中框架的內容擷取設定。 |

