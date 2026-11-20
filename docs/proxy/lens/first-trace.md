---
title: "傳送您的第一個 trace"
description: "將 Lens Home 的設定指示貼到您的程式碼代理程式中，並開啟您的第一個 trace；或以 Python 範例手動設定。"
slug: "/proxy/lens/first-trace"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 傳送您的第一個 trace {#send-your-first-trace}

使用您的程式碼代理程式將專案連接至 Lens，並開啟真實任務的 trace。這些步驟適用於獨立 Lens，以及 LiteLLM 儀表板內的 Lens。

您需要一個執行中的 Lens 服務。如果 Lens 尚未就緒，請先依照 [設定 Lens](./deployment.md)。如果您的專案沒有程式碼代理程式，請改以 Python 範例[手動設定](#set-up-manually)。

## 1. 開啟 Lens Home {#open-lens-home}

透過您打算使用 Lens 的位置開啟 Lens：

| 您的設定 | 在這裡開啟 Lens |
| --- | --- |
| 連接到 LiteLLM | 登入 LiteLLM 並在側邊欄中選取 **Lens**。 |
| 獨立 | 在 `/ui/` 開啟您的 Lens URL，並使用 `LENS_ADMIN_TOKEN` 登入。 |

**Home** 會顯示 **Connect a new agent**，以及 **Set up with your coding agent** 面板。相同的指示適用於 Claude Code、Codex 與 Cursor。

![Lens Home 顯示適用於 Claude Code、Codex 與 Cursor 的「Set up with your coding agent」面板，以及「Copy instructions with new key」按鈕。](/img/lens/home-connect-agent.png)

## 2. 將指示複製到您的程式碼代理程式中 {#copy-the-instructions}

選取 **Copy instructions with new key**。Lens 會建立一把專用的追蹤金鑰，並複製已包含該金鑰與您的 trace 端點的指示。請在您的程式碼代理程式中開啟專案並貼上它們。

代理程式會檢查您的專案、為其框架新增追蹤、保留您既有的模型提供者與憑證、執行一個真實任務，並向 Lens 確認 trace 已送達。若要先閱讀指示，請展開 **View full instructions**。

貼上的指示包含追蹤金鑰，因此金鑰會留在您的程式碼代理程式的聊天記錄中。請只將它們貼到您信任的代理程式中。若要重複使用金鑰而非建立新金鑰，請選取 **Use an existing key**。如果按鈕顯示 **Copy setup instructions**，指示中不含金鑰，代理程式會使用您專案環境中的追蹤金鑰。如果您無法自行建立金鑰，請向您的 Lens 或閘道管理員索取專用的追蹤金鑰，並將它儲存為 `LITELLM_TRACING_KEY`。

指示中會指名此 Lens 的 trace 端點，例如本機快速入門的 `http://localhost:4318/v1/traces`。位於另一個容器或另一台機器上的代理程式，需要一個它能連線到的位址，而不是它自己的 `localhost`。

## 3. 開啟 trace {#view-your-first-trace}

複製指示後，Lens Home 上的 **See your trace** 會顯示 **Waiting for your agent's trace**。任務完成後，您的程式碼代理程式會回報代理程式名稱與 trace ID，並提供 Lens 中該 trace 的連結。請開啟該連結，或在 Lens Home 顯示 **Trace received** 時選取 **Open trace**。

您應該會在您的代理程式名稱下看到該次執行。只有在 instrumentation 記錄時，才會出現模型呼叫、工具步驟，以及提示與回應文字。程式碼代理程式最後會詢問接下來要檢測什麼，因此請在該處提出需求。**Demo data** 會顯示範例；檢查您自己的 trace 時請將它關閉。如果沒有任何內容送達，請參閱[如果 trace 沒有出現](#troubleshooting)。

## 手動設定 {#set-up-manually}

如果您有自己的應用程式且沒有程式碼代理程式，請使用此路徑。Python 範例需要 Python {{python_version}} 與一個模型金鑰。它會進行一次模型呼叫，可能產生提供者費用。對於建立在框架上的代理程式，請使用[框架指南](#connect-your-existing-agent)。若要記錄 Claude Code 或 Codex 工作階段本身，請參閱[程式碼代理程式工作階段](./coding-agents.md)。

### 取得追蹤金鑰和端點 {#connect-your-agent}

在 Lens Home 上，選取 **Set up manually**，再選取 **Create tracing key**。如果該按鈕無法使用，請向您的 Lens 或閘道管理員索取專用的追蹤金鑰。

![Lens Home 上的「Set up manually」顯示「Create tracing key」與您專案的環境變數，包括 trace 端點。](/img/lens/home-set-up-manually.png)

將金鑰複製到您的本機環境。從 **Configure your project** 下的 `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` 複製完整的 trace 端點。它以 `/v1/traces` 結尾。對於本機快速入門，它是 `http://localhost:4318/v1/traces`。位於另一個容器或另一台機器上的代理程式，需要一個它能連線到的位址，而不是它自己的 `localhost`。

追蹤金鑰會上傳遙測資料。它不會呼叫模型或讀取追蹤。讓它與您的模型金鑰和管理員 token 保持分開。

### 準備範例 {#send-your-first-trace}

在空的工作目錄中，建立 Python 環境並安裝追蹤相依性：

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install openai openinference-instrumentation-openai \
  opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

在此終端機中設定上一個步驟的端點和追蹤金鑰：

```sh
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="YOUR_FULL_TRACE_ENDPOINT"
export LENS_TRACING_KEY="YOUR_LENS_TRACING_KEY"
```

替換預留位置。保留現有的路徑前綴（例如 `/lens-ingest`），並且只包含一次 `/v1/traces`。Python 處理程序必須能夠連線到此位址。

然後選取您的模型連線：

<Tabs groupId="lens-model-connection" defaultValue="direct">
<TabItem value="direct" label="直接提供者">

此範例直接呼叫 OpenAI。使用您的 OpenAI API 金鑰，以及該金鑰可用的模型：

```sh
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export LENS_EXAMPLE_MODEL="YOUR_OPENAI_MODEL"
```

對於其他與 OpenAI 相容的提供者，請使用其 API 金鑰、基礎 URL 和模型名稱。對於其他提供者 API，請使用對應的 [框架指南](#connect-your-existing-agent)。

</TabItem>
<TabItem value="gateway" label="透過 LiteLLM">

使用具有模型存取權的 LiteLLM 金鑰、閘道的 OpenAI 相容基礎 URL，以及來自 **Models** 的模型別名：

```sh
export OPENAI_API_KEY="YOUR_LITELLM_MODEL_KEY"
export OPENAI_BASE_URL="https://gateway.example.com/v1"
export LENS_EXAMPLE_MODEL="YOUR_LITELLM_MODEL_ALIAS"
```

將範例主機替換為您的閘道。這些值用於模型呼叫。獨立的追蹤設定仍會將遙測資料傳送至 Lens。

</TabItem>
</Tabs>

此範例會記錄提示和回應文字。使用您可以在 Lens 中儲存的測試提示。

### 執行一次有追蹤的呼叫 {#run-one-traced-call}

將此檔案儲存為 `first_trace.py`：

```python title="first_trace.py"
import os

from openai import OpenAI
from openinference.instrumentation.openai import OpenAIInstrumentor
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider = TracerProvider(resource=Resource.create({"service.name": "lens-example"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(
    endpoint=os.environ["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"],
    headers={"Authorization": f"Bearer {os.environ['LENS_TRACING_KEY']}"},
)))
trace.set_tracer_provider(provider)
OpenAIInstrumentor().instrument(tracer_provider=provider)

try:
    with trace.get_tracer("lens-example").start_as_current_span(
        "first_agent",
        attributes={"openinference.span.kind": "AGENT", "gen_ai.agent.name": "first_agent"},
    ) as span:
        prompt = "Explain an agent trace in one sentence."
        span.set_attribute("input.value", prompt)
        response = OpenAI().chat.completions.create(
            model=os.environ["LENS_EXAMPLE_MODEL"],
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=128,
        )
        answer = response.choices[0].message.content or ""
        span.set_attribute("output.value", answer)
        print(answer)
        print(f"Trace ID: {span.get_span_context().trace_id:032x}")
finally:
    provider.shutdown()
```

在同一個終端機中執行它：

```sh
python first_trace.py
```

預期會得到回應和 trace ID。等待處理程序結束，讓匯出器完成傳送追蹤。

### 開啟範例 trace {#open-the-example-trace}

回到 Lens，選取 **first_agent** 代理程式，然後選取 **Traces**。如果設定顯示 **Check for traces**，請選取它。開啟範例印出的 trace ID 所對應的執行。

您應該會看到提示、回應，以及一個子模型 span。**Demo data** 會顯示範例；檢查您自己的追蹤時請將它關閉。

此範例沒有工具，因此不會包含工具呼叫 span。只有當 Lens 可以將呼叫與閘道支出記錄相符時，才會顯示成本。直接提供者的追蹤不會從此範例取得價格。

## 連接您現有的代理程式 {#connect-your-existing-agent}

保留您代理程式的模型連線，並為其框架新增 instrumentation。如果它已有 OpenTelemetry tracer provider，請在該 provider 上新增或更新匯出器。

| 代理程式或框架 | 指南 |
| --- | --- |
| OpenAI Agents SDK | [連接 OpenAI Agents](./imported/integrations/openai-agents.md) |
| LangChain、LangGraph 或 DeepAgents | [LangChain](./imported/integrations/langchain.md)、[LangGraph](./imported/integrations/langgraph.md) 或 [DeepAgents](./imported/integrations/deepagents.md) |
| 具有 OpenTelemetry 的應用程式 | [OpenTelemetry 範例](./imported/integrations/opentelemetry.md) |
| Claude Code 或 Codex 工作階段 | [程式碼代理程式工作階段](./coding-agents.md) |
| 透過 LiteLLM 的其他框架 | [完整的框架範例](./framework-examples.md) |

執行一個真實的任務，然後開啟該追蹤並檢查其輸入、輸出和預期步驟。追蹤送達後，您可以 [建立調查](./investigations.md)。

## 如果 trace 沒有出現 {#troubleshooting}

| 發生的情況 | 下一個動作 |
| --- | --- |
| 模型呼叫失敗 | 檢查模型金鑰、基礎 URL 和模型名稱。這些與 Lens 是分開的。 |
| 匯出器回傳 `401` 或 `403` | 使用專用的 Lens 追蹤金鑰。檢查它是否啟用中，且屬於此 Lens 部署。 |
| 匯出器無法連線 | 從執行代理程式的機器檢查完整的端點。不要使用 `localhost` 指稱另一台機器上的 Lens。 |
| 呼叫成功，但 Lens 是空的 | 檢查匯出器錯誤、關閉示範資料，並驗證選取的代理程式和時間範圍。 |
| 另一位使用者看不到追蹤 | 檢查追蹤金鑰的使用者和團隊範圍。請管理員驗證存取權。 |
| 框架追蹤缺少文字 | 如果您打算儲存提示和回應文字，請啟用框架的內容擷取設定。 |

## 將執行連結到其對話 {#link-a-run-to-its-source}

當一次執行是從對話開始時，例如 Slack 討論串、Teams 聊天，或您自己的 bot，請在該執行的根代理程式 span 上設定這些屬性。Lens 會在追蹤頂部新增一個 **Source** 欄位，顯示應用程式的標誌，將滑鼠懸停在上面會顯示標題。

| 屬性 | 值 |
| --- | --- |
| `agent.source.type` | 對話所在的位置：`slack`、`teams`、`discord`、`linear`、`github`、`jira` 或 `custom`。缺失或未知的值會被視為 `custom` |
| `agent.source.url` | 指向對話的 `https://` 連結，例如 Slack 討論串永久連結。其他 scheme 會被忽略 |
| `agent.source.title` | 懸停在連結上時顯示的簡短文字，例如討論串的第一則訊息。選擇性 |

![Lens 在追蹤上顯示 Source: Slack，點按它會開啟代理程式被提問和回覆的 Slack 討論串。](/img/lens/trace-source-slack.png)

類型決定標誌和名稱，因此 `slack` 會顯示 Slack 標誌和 **Slack**。對於您自己的 bot 或任何未列出的項目，請使用 `custom`。如果根 span 沒有這些屬性，Lens 會使用最早帶有這些屬性的 span。

```python
with tracer.start_as_current_span("research_agent") as span:
    span.set_attribute("agent.source.type", "slack")
    span.set_attribute("agent.source.url", "https://acme.slack.com/archives/C0123ABCD/p1759869540000100")
    span.set_attribute("agent.source.title", "Can you add me to the guestlist for the retro?")
    run_agent(task)
```

來源會從 [trace API](./api.md#list-runs) 以 `summary.source` 回傳，包含 `type`、`url` 和 `title`。
