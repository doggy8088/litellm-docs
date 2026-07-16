# Splunk 可觀測性雲端 {#splunk-observability-cloud}

使用內建的 **`otel`** 回呼與標準 OpenTelemetry OTLP 環境變數，將 LiteLLM trace 傳送至 [Splunk Observability Cloud](https://www.splunk.com/en_us/products/observability-cloud.html)。

LiteLLM 使用與 [OpenTelemetry integration](./opentelemetry_integration.md) 相同的 OpenTelemetry 路徑。Splunk 的 OTLP/HTTP trace ingest URL 使用 **`/v2/trace/otlp`**（而非 **`/v1/traces`**）；LiteLLM 會將一般 collector URL 正規化，但會**保留** Splunk 風格的 `/v2/trace/otlp` 端點，讓 span 正確送達 Splunk。

## 影片導覽 {#video-walkthrough}

<iframe width="840" height="500" src="https://www.loom.com/embed/9dc21b753bbe4f6fb3c1b44c06e39c20" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen title="LiteLLM Splunk Observability Cloud OTEL demo"></iframe>

或者 [在 Loom 上觀看](https://www.loom.com/share/9dc21b753bbe4f6fb3c1b44c06e39c20)。

## 先決條件 {#prerequisites}

1. Splunk Observability Cloud 帳戶與 **ingest access token**（用作 `X-SF-Token`）。
2. 您的 **realm**（例如 `eu1`、`us0`），可從 Splunk Observability Cloud UI 或文件取得。

## LiteLLM Proxy {#litellm-proxy}

流程與 [Datadog Logs](./datadog#datadog-logs) 等整合相同：先設定 **`config.yaml`**，再設定環境變數，然後啟動 proxy。

**步驟 1：** 在 `config.yaml` 中啟用 OpenTelemetry 回呼：

```yaml
litellm_settings:
  callbacks: ["otel"]
```

**步驟 2：** 設定下方的 OTLP 環境變數。

您可以從程序環境、`.env` 檔案，或 `config.yaml` 中 proxy 的 **`environment_variables`** 區塊載入這些設定（參見 [config fields](/docs/proxy/configs)）。

| 用途 | 變數 |
|--------|----------|
| Trace ingest URL（Splunk OTLP/HTTP） | `OTEL_EXPORTER_OTLP_ENDPOINT` — 例如 `https://ingest.<realm>.observability.splunkcloud.com/v2/trace/otlp` |
| 驗證 | `OTEL_EXPORTER_OTLP_HEADERS` 或 `OTEL_HEADERS` — 例如 `X-SF-Token=<your-access-token>`（多個標頭時使用以逗號分隔的 `key=value` 配對） |
| 協定 | OTLP/HTTP 使用 `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`（只有在目標為 gRPC OTLP 端點時才使用 `grpc`） |
| 選用的資源命名 | `OTEL_SERVICE_NAME`、`OTEL_ENVIRONMENT_NAME` 等 |

**優先順序：** 會先讀取 `OTEL_EXPORTER_OTLP_PROTOCOL`，再讀取舊版 `OTEL_EXPORTER`。若兩者皆有設定，以 OTLP 協定變數為準。兩者皆有設定時，`OTEL_EXPORTER_OTLP_ENDPOINT` 優先於 `OTEL_ENDPOINT`。

```shell
OTEL_EXPORTER_OTLP_ENDPOINT="https://ingest.eu1.observability.splunkcloud.com/v2/trace/otlp"
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
OTEL_EXPORTER_OTLP_HEADERS="X-SF-Token=<your-ingest-access-token>"
OTEL_SERVICE_NAME="litellm-proxy"
```

**步驟 3：** 啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

## 驗證 traces {#verify-traces}

1. 在 Splunk Observability Cloud 中，開啟 **APM** / **Traces**（產品名稱可能會因版本而異）。
2. 依服務名稱篩選（`OTEL_SERVICE_NAME`，若未設定則預設為 `litellm`）。
3. 視需要在 LiteLLM 的環境中設定 `OTEL_DEBUG=True`，以便在記錄中顯示 exporter 問題（請參見 [OpenTelemetry troubleshooting](/docs/observability/opentelemetry_integration#not-seeing-traces-land-on-integration)）。

## 另請參閱 {#see-also}

- [OpenTelemetry — Tracing LLMs](./opentelemetry_integration.md)
- [Splunk Observability Cloud — OTLP exporter](https://docs.splunk.com/observability/en/gdi/opentelemetry/opentelemetry.html)（提供者文件）
