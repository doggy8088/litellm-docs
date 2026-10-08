import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SigNoz {#signoz}

將 LiteLLM trace 傳送到 [SigNoz](https://signoz.io)，無論是 Cloud 或自架，都可透過 `signoz` 回呼完成。單一 endpoint 欄位即可涵蓋兩種部署，而在 OpenTelemetry v2 下，每個 team 或 virtual key 都能將自己的 trace 傳送到各自的 SigNoz 帳戶，並使用自己的 ingestion key。SigNoz 端的設定（包含 dashboard 與 alert），請參閱 [SigNoz LiteLLM 可觀測性文件](https://signoz.io/docs/litellm-observability/)。

## 前置需求 {#prerequisites}

SigNoz Cloud 需要您所在 [區域](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 的 ingestion endpoint 與 [ingestion key](https://signoz.io/docs/ingestion/signoz-cloud/keys/)。自架 SigNoz 則需要 SigNoz OTel Collector 的 OTLP HTTP 埠 URL，預設為 `4318`，且 proxy 必須可存取。無需額外的 Python 套件；此回呼使用隨 `litellm[proxy]` 附帶的 OTLP HTTP exporter。

## 快速開始 {#quick-start}

將 `signoz` 加入 `callbacks`，並將其指向您的 SigNoz 實例。建議使用 `LITELLM_OTEL_V2=true`：它會為每個請求提供一個 trace，涵蓋 HTTP 呼叫、驗證、guardrails、模型呼叫以及 spend 寫入，且這是依 team 路由所必需的。請參閱 [OpenTelemetry v2](./opentelemetry_v2) 了解 v2 trace 包含哪些內容。

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["signoz"]
```

<Tabs>
<TabItem value="cloud" label="SigNoz Cloud" default>

```shell title=".env"
LITELLM_OTEL_V2=true
SIGNOZ_INGESTION_ENDPOINT="https://ingest.<region>.signoz.cloud:443"
SIGNOZ_INGESTION_KEY="<your-ingestion-key>"
```

將 `<region>` 替換為 `us`、`eu` 或 `in`，以符合您的 SigNoz Cloud 帳戶。

</TabItem>
<TabItem value="self-hosted" label="Self-hosted SigNoz">

```shell title=".env"
LITELLM_OTEL_V2=true
SIGNOZ_INGESTION_ENDPOINT="http://<signoz-otel-collector>:4318"
```

請將 `SIGNOZ_INGESTION_KEY` 保持未設定。未設定 key 時，此回呼不會傳送任何 auth header，這正是自架 collector 所預期的行為。僅在您的 collector 設定為必須使用 key 時，才設定該 key。

</TabItem>
</Tabs>

啟動 proxy 並傳送一個請求：

```shell
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{"model": "{{openai_small}}", "messages": [{"role": "user", "content": "What is SigNoz?"}]}'
```

trace 會在 SigNoz 的 **Traces** 下顯示，服務名稱為 `OTEL_SERVICE_NAME`（預設為 `litellm`），並包含一個 `chat <model>` span，帶有模型、提供者、token 使用量、成本與延遲的標準 `gen_ai.*` 屬性。

`SIGNOZ_INGESTION_ENDPOINT` 是 OTLP base URL。此回呼會自行附加 `/v1/traces`，而已經以 `/v1/traces` 結尾的值則會原樣使用。如果變數未設定或為空，proxy 會在啟動時記錄一則指出 `SIGNOZ_INGESTION_ENDPOINT` 的錯誤，且不會輸出任何內容；沒有預設 endpoint。此回呼一律透過 HTTP 使用 OTLP；如需 OTLP gRPC，請使用 [Metrics and logs](#metrics-and-logs) 中說明的通用 `otel` 回呼。

您也可以在 Admin UI 的 **Settings > Logging & Alerts** 中啟用此回呼，其中 SigNoz 會以一個磁貼呈現，並使用相同的兩個值。

## 指標與記錄 {#metrics-and-logs}

`signoz` 回呼只會匯出 trace。LiteLLM 的 GenAI 指標與記錄事件不會依提供者路由；它們會遵循 proxy 層級的 OTLP 設定，因此若要在 SigNoz 中看到它們，請將標準 OpenTelemetry 變數設定為相同目的地：

```shell title=".env"
LITELLM_OTEL_INTEGRATION_ENABLE_METRICS=true
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
OTEL_EXPORTER_OTLP_ENDPOINT="https://ingest.<region>.signoz.cloud:443"
OTEL_EXPORTER_OTLP_HEADERS="signoz-ingestion-key=<your-ingestion-key>"
```

自架 SigNoz 請移除 `OTEL_EXPORTER_OTLP_HEADERS`。設定 `OTEL_EXPORTER_OTLP_ENDPOINT` 也會額外加入一個 proxy 層級的 trace exporter，因此在兩個區塊都設定時，每個 span 會被送到 SigNoz 兩次，一次來自 `signoz` exporter，一次來自通用 exporter。您可以接受這種情況，或是在不需要依 team 路由時只使用通用變數。指標名稱與 cardinality 控制請參閱 [Metrics](./opentelemetry_v2#metrics)。

## 依 team 與依 key 路由 {#per-team-and-per-key-routing}

在 OTel v2 下，team 或 virtual key 可以帶有自己的 SigNoz 目的地，因此該 team 的 trace 會送到其專屬 SigNoz 帳戶，而其他人的則維持在 proxy 層級的 endpoint。這與 [Team/Key based logging](../proxy/team_logging) 的 key/team 回呼機制相同，而一般行為（覆寫模式與附加模式、tenant 會收到什麼、key 優先於 team）則說明於 [Per-key / per-team credentials](./opentelemetry_v2#per-key--per-team-credentials-multi-tenant)。

需要 `LITELLM_OTEL_V2=true`。請先將每個 tenant endpoint host 加入允許清單，否則 proxy 會忽略該 endpoint 並發出警告：

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["signoz"]
  provider_url_destination_allowed_hosts: ["ingest.eu.signoz.cloud"]
```

在 team 上註冊此回呼：

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "signoz",
    "callback_type": "success",
    "callback_vars": {
      "signoz_ingestion_endpoint": "https://ingest.eu.signoz.cloud:443",
      "signoz_ingestion_key": "<team-ingestion-key>"
    }
  }'
```

或在 key 上，包括沒有 team 的 key：

```shell
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "logging": [{
        "callback_name": "signoz",
        "callback_type": "success",
        "callback_vars": {
          "signoz_ingestion_endpoint": "https://ingest.eu.signoz.cloud:443",
          "signoz_ingestion_key": "<key-ingestion-key>"
        }
      }]
    }
  }'
```

Admin UI 會在 SigNoz 磁貼下的 team 或 key 記錄設定中，公開相同的兩個欄位。ingestion key 會以加密方式儲存，讀取時會被遮罩。

:::warning[Team 與 key 回呼需要 ingestion key]

team 或 key 的 SigNoz 回呼必須帶有 `signoz_ingestion_key`。刻意移除不帶 key 的 team 轉送到 SigNoz endpoint 的支援，原因是 proxy 否則必須將自己的 ingestion key 傳送到 tenant 所選擇的 URL。若 team 或 key 自行設定 `signoz_ingestion_endpoint`，則仍會持續輸出到 proxy 層級的目的地，而 proxy 會記錄一則警告說明這點。沒有 key 的自架 collector 只會由全域回呼服務。

:::

這兩個欄位的運作方式如下。單獨設定 `signoz_ingestion_key` 時，會將該 tenant 的 trace 送到 proxy 層級的 endpoint，並使用 tenant 的 key；這是營運者與 team 都在相同區域使用 SigNoz Cloud 時的常見情況。只有在同時設定 key 且其 host 位於 `provider_url_destination_allowed_hosts` 上時，`signoz_ingestion_endpoint` 才會被接受；沒有 key、或 host 不在允許清單中的 endpoint，會在 proxy log 中以警告方式忽略，而請求會維持在 proxy 層級的目的地並使用 proxy 自己的 key。proxy 絕不會將自己的 ingestion key 傳送到 tenant URL，而 tenant 的 key 也絕不會附加到其他後端的 exporter。若某個 team 執行的是沒有 key 的自架 collector，因此就無法依 team 路由；請改為將全域回呼指向它。這兩個欄位都必須分別以 `http://` 或 `https://` 開頭才會被採用，而格式錯誤的值會以相同方式忽略。

這些欄位是從 proxy 在驗證時解析出的 key 與 team 讀取，而不是從請求本文讀取。若請求本文或 metadata 帶有 `signoz_ingestion_endpoint` 或 `signoz_ingestion_key`，除非 `general_settings.allow_client_side_credentials` 為 `true`，否則會在任何提供者呼叫之前以 HTTP 401 拒絕，這與其他所有回呼憑證遵循相同規則。

## 驗證 {#verify}

`GET /health/services?service=signoz` 會在回呼已設定且已排入一個測試 span 時回傳 200。由於 span 會批次處理並非同步傳送，這只能確認設定正確，不能確認已送達；即使 SigNoz endpoint 當機或拒絕該 key，此處仍會回傳 200。若要確認送達，請傳送一個 chat completion，並在 SigNoz 中查看 trace。

如果 span 沒有抵達，請暫時設定 `OTEL_EXPORTER="console"`；若 span 有列印到 stdout，問題出在 endpoint 或 key，而不是 LiteLLM。SigNoz Cloud 回傳 403 表示 ingestion key 錯誤或屬於其他區域，而 404 通常表示 endpoint 帶有意外的 path。以上情況下，呼叫端仍會收到回應；只有那一批 span 會被丟棄，之後的批次會在目的地接受後送達。

proxy 收到 SIGTERM 時，仍停留在 batch processor 中的 span 可能會遺失。這影響 LiteLLM 中所有以 OpenTelemetry 為基礎的回呼，不只 SigNoz，且已在上游追蹤。

## 未使用 OTel v2 {#without-otel-v2}

`signoz` 回呼在 `LITELLM_OTEL_V2` 未設定時也可運作。此時它會使用舊版 [OpenTelemetry integration](./opentelemetry_integration)：同樣的兩個環境變數、指向 `<endpoint>/v1/traces` 的 OTLP HTTP，以及在設定 key 時使用 `signoz-ingestion-key` header。此路徑不支援依 team 與依 key 路由；team 或 key 的 `callback_vars` 會被忽略，而每個 trace 都會送到 proxy 層級的目的地。

## 儀表板 {#dashboards}

SigNoz 提供一個 [LiteLLM Proxy 儀表板](https://signoz.io/docs/dashboards/dashboard-templates/litellm-proxy-dashboard/) 與一個 [LiteLLM SDK 儀表板](https://signoz.io/docs/dashboards/dashboard-templates/litellm-sdk-dashboard/)，並附有匯入說明。

![LiteLLM Proxy 儀表板範本](/img/observability/signoz_proxy_dashboard.webp)

## LiteLLM SDK {#litellm-sdk}

`signoz` 回呼在 SDK 中也可使用。請設定相同的環境變數，並在任何 LiteLLM 呼叫之前啟用它：

```python
import litellm
from litellm import completion

litellm.callbacks = ["signoz"]

response = completion(
  model="openai/{{openai_large}}",
  messages=[{"content": "What is SigNoz", "role": "user"}]
)
print(response)
```

這涵蓋了 trace。若也要從 SDK 應用程式傳送記錄與指標，請使用 OpenTelemetry SDK 為程序加上 instrumentation，並如下面所示將所有資料指向 SigNoz。

<Tabs>
<TabItem value="No Code" label="No Code (Recommended)" default>

當您使用標準的 instrumentor 函式庫且不想變更應用程式碼時，無程式碼自動插樁是最快的做法。

**步驟 1：** 安裝套件。

```bash
uv add \
  opentelemetry-api \
  opentelemetry-distro \
  opentelemetry-exporter-otlp \
  httpx \
  opentelemetry-instrumentation-httpx \
  litellm
```

**步驟 2：** 為您環境中已存在的項目安裝 instrumentations。

```bash
opentelemetry-bootstrap --action=install
```

**步驟 3：** 在程式碼中於任何 LiteLLM 呼叫之前啟用 LiteLLM callback。

```python
import litellm

litellm.callbacks = ["otel"]
```

**步驟 4：** 在自動插樁 agent 下執行應用程式。

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

OTLP gRPC 需要 `grpcio`；請使用 `uv add "litellm[grpc]"` 安裝它。`OTEL_PYTHON_DISABLED_INSTRUMENTATIONS=openai` 會關閉 OpenAI instrumentor，使 LLM 呼叫只會由 LiteLLM 追蹤一次，而不是兩次。請將 `<service_name>`、`<region>`、`<your_ingestion_key>` 和 `<your_run_command>`（例如 `python main.py`）替換為您的值。對於自架 SigNoz，請依照 [Cloud to Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 的說明變更 endpoint 並移除 headers 變數。

</TabItem>

<TabItem value="Code" label="Code">

以程式碼為基礎的插樁可讓您控制資源屬性、取樣，以及 exporter 的建構方式。

**步驟 1：** 安裝套件。

```bash
uv add \
  opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp \
  opentelemetry-instrumentation-httpx \
  opentelemetry-instrumentation-system-metrics \
  litellm
```

**步驟 2：** 設定 tracer provider。

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
    endpoint=os.getenv("OTEL_EXPORTER_TRACES_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
provider.add_span_processor(BatchSpanProcessor(span_exporter))
trace.set_tracer_provider(provider)
```

`OTEL_EXPORTER_TRACES_ENDPOINT` 是您 [region](https://signoz.io/docs/ingestion/signoz-cloud/overview/#endpoint) 的 `https://ingest.<region>.signoz.cloud:443/v1/traces`，而 `SIGNOZ_INGESTION_KEY` 是您的 [ingestion key](https://signoz.io/docs/ingestion/signoz-cloud/keys/)。

**步驟 3：** 設定 logs。

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
    endpoint=os.getenv("OTEL_EXPORTER_LOGS_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
logger_provider.add_log_record_processor(BatchLogRecordProcessor(otlp_log_exporter))
handler = LoggingHandler(level=logging.INFO, logger_provider=logger_provider)
logging.basicConfig(level=logging.INFO, handlers=[handler])

logger = logging.getLogger(__name__)
```

`OTEL_EXPORTER_LOGS_ENDPOINT` 是 `https://ingest.<region>.signoz.cloud:443/v1/logs`。

**步驟 4：** 設定 metrics。

```python
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry import metrics
from opentelemetry.instrumentation.system_metrics import SystemMetricsInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
import os

resource = Resource.create({"service.name": "<service_name>"})
metric_exporter = OTLPMetricExporter(
    endpoint=os.getenv("OTEL_EXPORTER_METRICS_ENDPOINT"),
    headers={"signoz-ingestion-key": os.getenv("SIGNOZ_INGESTION_KEY")},
)
reader = PeriodicExportingMetricReader(metric_exporter)
metrics.set_meter_provider(MeterProvider(metric_readers=[reader], resource=resource))

SystemMetricsInstrumentor().instrument()
HTTPXClientInstrumentor().instrument()
```

`OTEL_EXPORTER_METRICS_ENDPOINT` 是 `https://ingest.<region>.signoz.cloud:443/v1/metrics`。`SystemMetricsInstrumentor` 提供 CPU 與記憶體 metrics，而 `HTTPXClientInstrumentor` 提供外送 HTTP 請求 metrics，例如持續時間。自訂 metrics 請參閱 [Python Custom Metrics](https://signoz.io/opentelemetry/python-custom-metrics/)。

**步驟 5：** 啟用 LiteLLM callback 並執行。

```python
import litellm
from litellm import completion

litellm.callbacks = ["otel"]

response = completion(
  model="openai/{{openai_large}}",
  messages=[{"content": "What is SigNoz", "role": "user"}]
)
print(response)
```

對於自架 SigNoz，請依照 [Cloud to Self-Hosted](https://signoz.io/docs/ingestion/cloud-vs-self-hosted/#cloud-to-self-hosted) 的說明變更 endpoints 並移除 header。

</TabItem>
</Tabs>

來自 SDK 的 traces、logs 和 metrics 會顯示在 SigNoz 中對應的分頁下，而 trace 上的 **Related Logs** 按鈕會開啟與其相關聯的 logs。

![LiteLLM SDK 詳細追蹤檢視](/img/observability/signoz_sdk_detailed_traces.webp)

## 支援 {#support}

如需 SigNoz 端的協助，請使用 [SigNoz community Slack](https://signoz.io/slack) 或 [SigNoz support](https://signoz.io/support/)。如需 LiteLLM callback，請在 [BerriAI/litellm](https://github.com/BerriAI/litellm/issues) 開啟 issue。
