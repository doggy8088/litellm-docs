import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SigNoz {#signoz}

如需更多關於為 LiteLLM 設定可觀測性的資訊，請參閱 [SigNoz LiteLLM 可觀測性文件](https://signoz.io/docs/litellm-observability/)。

## 概觀 {#overview}

本指南將帶您使用 [OpenTelemetry](https://opentelemetry.io/) 為 LiteLLM SDK 與 Proxy Server 設定可觀測性與監控，並將記錄、追蹤與指標匯出至 SigNoz。透過此整合，您可以在 SigNoz 中觀察各種模型的效能、擷取請求/回應細節，並追蹤系統層級指標，讓您即時掌握 LiteLLM 應用程式的延遲、錯誤率與使用趨勢。

在 AI 應用程式中為 LiteLLM 加上遙測，可確保整個 AI 工作流程具備完整可觀測性，讓您更容易除錯問題、最佳化效能，並了解使用者互動。透過善用 SigNoz，您可以在整合式儀表板中分析彼此關聯的追蹤、記錄與指標，設定警示，並取得可採取行動的洞察，以持續提升可靠性、回應速度與使用者體驗。

## 前置需求 {#prerequisites}

- 一個具有有效擷取金鑰的 [SigNoz Cloud 帳戶](https://signoz.io/teams/)
- 可將遙測資料傳送至 SigNoz Cloud 的網際網路連線
- [LiteLLM](https://www.litellm.ai/) SDK 或 Proxy 整合
- Python：安裝 `uv` 以管理 Python 套件，並 _(建議但非必要)_ 建立 Python 虛擬環境來隔離相依性

## 監控 LiteLLM {#monitoring-litellm}

LiteLLM 可透過兩種方式進行監控：使用 **LiteLLM SDK**（直接嵌入您的 Python 應用程式程式碼，用於程式化 LLM 請求）或 **LiteLLM Proxy Server**（一個獨立伺服器，作為集中式閘道，用於在您的基礎架構中管理與路由 LLM 請求）。

<Tabs>
<TabItem value="LiteLLM SDK" label="LiteLLM SDK" default>

如需更詳細的 LiteLLM SDK 應用程式加上檢測的資訊，請點擊[這裡](https://docs.litellm.ai/docs/observability/opentelemetry_integration)。

<Tabs>
<TabItem value="No Code" label="No Code(Recommended)" default>

建議使用無程式碼自動檢測，以便快速設定且只需極少的程式碼變更。當您想在不修改應用程式程式碼的情況下快速啟用可觀測性，並且正在使用標準 instrumentor 程式庫時，這是理想選擇。

**步驟 1：** 在您的 Python 環境中安裝必要套件。

```bash
uv add \
  opentelemetry-api \
  opentelemetry-distro \
  opentelemetry-exporter-otlp \
  httpx \
  opentelemetry-instrumentation-httpx \
  litellm
```

**步驟 2：** 新增自動檢測

```bash
opentelemetry-bootstrap --action=install
```

**步驟 3：** 為您的 LiteLLM SDK 應用程式加上檢測

透過呼叫 `litellm.callbacks = ["otel"]` 初始化 LiteLLM SDK 檢測：

```python
from litellm import litellm

litellm.callbacks = ["otel"]
```

此呼叫會啟用您應用程式中所有 LiteLLM SDK 呼叫的自動追蹤、記錄與指標收集。

> 📌 注意：請確保在任何與 LiteLLM 相關的呼叫之前執行此步驟，以便正確設定您應用程式的檢測

**步驟 4：** 執行範例

```python
from litellm import completion, litellm

litellm.callbacks = ["otel"]

response = completion(
  model="openai/gpt-4o",
  messages=[{ "content": "What is SigNoz","role": "user"}]
)

print(response)
```

> 📌 注意：LiteLLM 支援多種 LLM [模型提供者](https://docs.litellm.ai/docs/providers)。在此範例中，我們使用 OpenAI。執行此程式碼前，請確保您已使用所產生的 API 金鑰設定環境變數 `OPENAI_API_KEY`。

**步驟 5：** 使用自動檢測執行您的應用程式

```bash
OTEL_RESOURCE_ATTRIBUTES="service.name=<service_name>" \
OTEL_EXPORTER_OTLP_ENDPOINT="https://ingest.<region>.signoz.cloud:443" \
OTEL_EXPORTER_OTLP_HEADERS="signoz-ingestion-key=<your_ingestion_key>" \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_TRACES_EXPORTER=otlp \
OTEL_METRICS_EXPORTER=otlp \
OTEL_LOGS_EXPORTER=otlp \
OTEL_PYTHON_LOG_CORRELATION=true \
OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true \
OTEL_PYTHON_DISABLED_INSTRUMENTATIONS=openai \
opentelemetry-instrument <your_run_command>
```

> 注意：OTLP gRPC 需要 `grpcio`。請透過 `uv add "litellm[grpc]"`（或 `grpcio`）安裝。

> 📌 注意：我們在執行指令中使用 `OTEL_PYTHON_DISABLED_INSTRUMENTATIONS=openai`，以停用 OpenAI instrumentor 的追蹤功能。這可避免與 LiteLLM 原生遙測/檢測發生衝突，確保遙測資料僅透過 LiteLLM 內建檢測進行擷取。

- **`<service_name>`** 是您的服務名稱
- 將 `<region>` 設定為與您的 SigNoz Cloud [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 相符
- 以您的 SigNoz [擷取金鑰](https://signoz.io/docs/ingestion/signoz-cloud/keys/) 取代 `<your_ingestion_key>`
- 以您實際執行應用程式時會使用的命令取代 `<your_run_command>`。例如：`python main.py`

> 📌 注意：使用自架 SigNoz？大多數步驟都相同。若要調整本指南，請如 [Cloud → Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 所示更新端點並移除擷取金鑰標頭。

</TabItem>

<TabItem value="Code" label="Code" default>

以程式碼為基礎的檢測可讓您對遙測設定進行細緻控制。當您需要自訂資源屬性、取樣策略，或整合既有可觀測性基礎架構時，請使用這種方式。

**步驟 1：** 在您的 Python 環境中安裝必要套件。

```bash
uv add \
  opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp \
  opentelemetry-instrumentation-httpx \
  opentelemetry-instrumentation-system-metrics \
  litellm
```

**步驟 2：** 在您的 Python 應用程式中匯入必要模組

**追蹤：**

```python
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
```

**記錄：**

```python
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry._logs import set_logger_provider
import logging
```

**指標：**

```python
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry import metrics
from opentelemetry.instrumentation.system_metrics import SystemMetricsInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
```

**步驟 3：** 設定 OpenTelemetry Tracer Provider，將追蹤直接傳送至 SigNoz Cloud

```python
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry import trace
import os

resource = Resource.create({"service.name": "<service_name>"})
provider = TracerProvider(resource=resource)
span_exporter = OTLPSpanExporter(
    endpoint= os.getenv("OTEL_EXPORTER_TRACES_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
processor = BatchSpanProcessor(span_exporter)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
```

- **`<service_name>`** 是您的服務名稱
- **`OTEL_EXPORTER_TRACES_ENDPOINT`** → 具有適當 [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 的 SigNoz Cloud 追蹤端點：`https://ingest.<region>.signoz.cloud:443/v1/traces`
- **`SIGNOZ_INGESTION_KEY`** → 您的 SigNoz [擷取金鑰](https://signoz.io/docs/ingestion/signoz-cloud/keys/)

> 📌 注意：使用自架 SigNoz？大多數步驟都相同。若要調整本指南，請如 [Cloud → Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 所示更新端點並移除擷取金鑰標頭。

**步驟 4：** 設定記錄

```python
import logging
from opentelemetry.sdk.resources import Resource
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
import os

resource = Resource.create({"service.name": "<service_name>"})
logger_provider = LoggerProvider(resource=resource)
set_logger_provider(logger_provider)

otlp_log_exporter = OTLPLogExporter(
    endpoint= os.getenv("OTEL_EXPORTER_LOGS_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
logger_provider.add_log_record_processor(
    BatchLogRecordProcessor(otlp_log_exporter)
)
# Attach OTel logging handler to root logger
handler = LoggingHandler(level=logging.INFO, logger_provider=logger_provider)
logging.basicConfig(level=logging.INFO, handlers=[handler])

logger = logging.getLogger(__name__)
```

- **`<service_name>`** 是您的服務名稱
- **`OTEL_EXPORTER_LOGS_ENDPOINT`** → 具有適當 [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 的 SigNoz Cloud 端點：`https://ingest.<region>.signoz.cloud:443/v1/logs`
- **`SIGNOZ_INGESTION_KEY`** → 您的 SigNoz [擷取金鑰](https://signoz.io/docs/ingestion/signoz-cloud/keys/)

> 📌 注意：使用自架 SigNoz？大多數步驟都相同。若要調整本指南，請如 [Cloud → Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 所示更新端點並移除擷取金鑰標頭。

**步驟 5：** 設定指標

```python
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry import metrics
from opentelemetry.instrumentation.system_metrics import SystemMetricsInstrumentor
import os

resource = Resource.create({"service.name": "<service-name>"})
metric_exporter = OTLPMetricExporter(
    endpoint= os.getenv("OTEL_EXPORTER_METRICS_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
reader = PeriodicExportingMetricReader(metric_exporter)
metric_provider = MeterProvider(metric_readers=[reader], resource=resource)
metrics.set_meter_provider(metric_provider)

meter = metrics.get_meter(__name__)

# turn on out-of-the-box metrics
SystemMetricsInstrumentor().instrument()
HTTPXClientInstrumentor().instrument()
```

- **`<service_name>`** 是您的服務名稱
- **`OTEL_EXPORTER_METRICS_ENDPOINT`** → 具有適當 [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 的 SigNoz Cloud 端點：`https://ingest.<region>.signoz.cloud:443/v1/metrics`
- **`SIGNOZ_INGESTION_KEY`** → 您的 SigNoz [擷取金鑰](https://signoz.io/docs/ingestion/signoz-cloud/keys/)

> 📌 注意：使用自架 SigNoz？大多數步驟都相同。若要調整本指南，請如 [Cloud → Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 所示更新端點並移除擷取金鑰標頭。

> 📌 注意：SystemMetricsInstrumentor 提供系統指標（CPU、記憶體等），而 HTTPXClientInstrumentor 提供外發 HTTP 請求指標，例如請求持續時間。如果您想為 LiteLLM 應用程式新增自訂指標，請參閱 [Python 自訂指標](https://signoz.io/opentelemetry/python-custom-metrics/)。

**步驟 6：** 為您的 LiteLLM 應用程式加上檢測

透過呼叫 `litellm.callbacks = ["otel"]` 初始化 LiteLLM SDK 檢測：

```python
from litellm import litellm

litellm.callbacks = ["otel"]
```

此呼叫會啟用您應用程式中所有 LiteLLM SDK 呼叫的自動追蹤、記錄與指標收集。

> 📌 注意：請確保在任何與 LiteLLM 相關的呼叫之前執行此步驟，以便正確設定您應用程式的檢測

**步驟 7：** 執行範例

```python
from litellm import completion, litellm

litellm.callbacks = ["otel"]

response = completion(
  model="openai/gpt-4o",
  messages=[{ "content": "What is SigNoz","role": "user"}]
)

print(response)
```

> 📌 注意：LiteLLM 支援多種 LLM [模型提供者](https://docs.litellm.ai/docs/providers)。在此範例中，我們使用 OpenAI。執行此程式碼前，請確保您已使用所產生的 API 金鑰設定環境變數 `OPENAI_API_KEY`。

</TabItem>
</Tabs>

## 在 SigNoz 中查看追蹤、記錄與指標 {#view-traces-logs-and-metrics-in-signoz}

您的 LiteLLM 命令現在應該會自動產生追蹤、記錄與指標。

您應該可以在 Signoz Cloud 的 traces 分頁中查看追蹤：

![LiteLLM SDK 追蹤檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-traces.webp)

當您在 SigNoz 中點擊某個追蹤時，您會看到該追蹤的詳細檢視，包括所有相關 span，以及它們的事件與屬性。

![LiteLLM SDK 詳細追蹤檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-detailed-traces.webp)

您應該可以在 Signoz Cloud 的 logs 分頁中查看記錄。您也可以在追蹤檢視中點擊「Related Logs」按鈕來查看相關記錄：

![LiteLLM SDK 記錄檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-logs.webp)

當您在 SigNoz 中點擊這些記錄時，您會看到記錄的詳細檢視，包括屬性：

![LiteLLM SDK 詳細記錄檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-detailed-logs.webp)

您應該可以在 Signoz Cloud 的 metrics 分頁中看到與 LiteLLM 相關的指標：

![LiteLLM SDK 指標檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-metrics.webp)

當您在 SigNoz 中點擊這些指標中的任一項時，您會看到該指標的詳細檢視，包括屬性：

![LiteLLM 詳細指標檢視](https://signoz.io/img/docs/llm/litellm/litellmsdk-detailed-metrics.webp)

## 儀表板 {#dashboard}

您也可以查看我們自訂的 LiteLLM SDK 儀表板 [此處](https://signoz.io/docs/dashboards/dashboard-templates/litellm-sdk-dashboard/)，其中提供專為在應用程式中監控您的 LiteLLM 使用情況而設計的視覺化呈現。此儀表板包含預先建置的圖表，特別針對 LLM 使用情況量身打造，並附有匯入說明，讓您能快速開始使用。

![LiteLLM SDK 儀表板範本](https://signoz.io/img/docs/llm/litellm/litellm-sdk-dashboard.webp)

</TabItem>

<TabItem value="LiteLLM Proxy Server" label="LiteLLM Proxy Server" default>

**步驟 1：** 在您的 Python 環境中安裝必要的套件。

```bash
uv add opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp \
  'litellm[proxy]'
```

**步驟 2：** 為 LiteLLM Proxy Server 設定 otel

將以下內容加入 `config.yaml`：

```yaml
litellm_settings:
  callbacks: ['otel']
```

**步驟 3：** 設定以下環境變數：

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://ingest.<region>.signoz.cloud:443"
export OTEL_EXPORTER_OTLP_HEADERS="signoz-ingestion-key=<your_ingestion_key>"
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
export OTEL_TRACES_EXPORTER="otlp"
export OTEL_METRICS_EXPORTER="otlp"
export OTEL_LOGS_EXPORTER="otlp"
```

> 注意：OTLP gRPC 需要 `grpcio`。請透過 `uv add "litellm[grpc]"`（或 `grpcio`）安裝。

- 將 `<region>` 設定為符合您的 SigNoz Cloud [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint)
- 以您的 SigNoz [擷取金鑰](https://signoz.io/docs/ingestion/signoz-cloud/keys/) 取代 `<your_ingestion_key>`

> 📌 注意：使用自架 SigNoz？大多數步驟都相同。若要調整本指南，請更新端點並移除擷取金鑰標頭，如 [Cloud → Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 所示。

**步驟 4：** 使用設定檔執行 proxy server：

```bash
litellm --config config.yaml
```

現在，透過您的 LiteLLM proxy server 發出的任何請求都會被追蹤並傳送至 SigNoz。

您應該可以在 Signoz Cloud 的 traces 分頁下檢視追蹤：

![LiteLLM Proxy 追蹤檢視](https://signoz.io/img/docs/llm/litellm/litellmproxy-traces.webp)

當您在 SigNoz 中點擊一筆追蹤時，您會看到該追蹤的詳細檢視，包括所有相關的 spans，以及它們的 events 和屬性。

![LiteLLM Proxy 詳細追蹤檢視](https://signoz.io/img/docs/llm/litellm/litellmproxy-detailed-traces.webp)

## 儀表板 {#dashboard-1}

您也可以查看我們自訂的 LiteLLM Proxy 儀表板 [此處](https://signoz.io/docs/dashboards/dashboard-templates/litellm-proxy-dashboard/)，其中提供專為在應用程式中監控您的 LiteLLM Proxy 使用情況而設計的視覺化呈現。此儀表板包含預先建置的圖表，特別針對 LLM 使用情況量身打造，並附有匯入說明，讓您能快速開始使用。

![LiteLLM Proxy 儀表板範本](https://signoz.io/img/docs/llm/litellm/litellm-proxy-dashboard.webp)

</TabItem>
</Tabs>
