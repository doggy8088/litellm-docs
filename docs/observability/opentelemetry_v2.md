import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenTelemetry v2 {#opentelemetry-v2}

OpenTelemetry v2（OTel v2）是 LiteLLM Proxy 的下一代追蹤。它為您提供**每個請求一條乾淨的 trace**，涵蓋傳入的 HTTP 呼叫、驗證、防護欄、LLM 呼叫本身，以及內部資料庫／快取工作，全部都嵌套在同一棵樹中。

它遵循標準的 [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)，因此它產生的 traces 可在任何 OTel 後端（Grafana Tempo、Jaeger、Honeycomb、Datadog，…）中讀取，並附帶針對熱門 LLM 可觀測性工具（Arize、Phoenix、Langfuse、Weave、Langtrace、Levo、AgentOps、SigNoz）的現成預設。

:::info[選用功能]

OTel v2 預設為**關閉**。在您設定 `LITELLM_OTEL_V2=true` 之前，它不會執行任何內容。它與現有的 [OpenTelemetry integration](./opentelemetry_integration) 分開，因此請擇一使用。如果您是從 v1 遷移，請參閱 [Migrating to OpenTelemetry v2](./opentelemetry_v2_migration)。

:::

## 您將獲得什麼 {#what-you-get}

對您的 proxy 的單一請求會產生**一條 trace**，如下所示：

```
POST /v1/chat/completions                  ← HTTP request (server span)
├── auth /v1/chat/completions              ← authentication
│   ├── postgres get_key_object            ← DB lookups during auth
│   └── postgres get_team_membership
├── execute_guardrail presidio-pii         ← each guardrail that runs
├── chat {{openai_large}}                     ← the LLM call (model, tokens, cost)
└── batch_write_to_db                      ← spend/usage written to DB
```

重點：

- **一條 trace，端到端** — HTTP 請求、驗證、防護欄、LLM 呼叫與 DB 寫入都位於同一條 trace 中，且正確嵌套。
- **豐富的 GenAI 屬性** — 每個 LLM 呼叫 span 都帶有 `gen_ai.*` 屬性：模型、提供者、token 使用量、成本、結束原因、請求參數等。
- **基於標準** — 建置於官方 OpenTelemetry GenAI semantic conventions 之上，因此可與任何相容 OTel 的後端搭配使用。
- **供應商預設** — 只要一行設定，就能以各工具所預期的格式將 traces 傳送到 Arize、Phoenix、Langfuse、Weave、Langtrace、Levo、AgentOps 或 SigNoz。
- **預設安全** — 除非您明確選擇啟用，否則不會擷取 prompts 與 responses。雜訊路由（健康檢查、metrics 抓取、UI 資產）會自動排除。
- **分散式追蹤** — 如果您的用戶端傳送 `traceparent` 標頭，LiteLLM 的 spans 會巢狀地嵌入您現有的 trace 中。

## 開始使用 {#getting-started}

如需 Auto Router 組態識別、所選模型與已復原的分類器失敗，請參閱 [Auto Router OTEL Telemetry](/docs/auto_router/telemetry)。

在 proxy 環境中設定 `LITELLM_OTEL_V2=true`，然後從下方選擇一個目的地。

### 1. 將追蹤傳送到任何 OTLP 收集器 {#1-send-traces-to-any-otlp-collector}

此路徑會透過 OTLP（OpenTelemetry Protocol）將 spans 傳送到您已在下方端點執行的 collector 或後端；如果您尚未有，請先使用 Quickstart 中的 console exporter，直到準備好為止。在 proxy 的環境中設定此功能旗標以及標準的 `OTEL_*` 環境變數。不需要變更設定。

<Tabs>

<TabItem value="otlp-http" label="OTLP HTTP collector">

```shell
LITELLM_OTEL_V2=true
OTEL_EXPORTER="otlp_http"
OTEL_ENDPOINT="http://localhost:4318"
```

</TabItem>

<TabItem value="otlp-grpc" label="OTLP gRPC collector">

```shell
LITELLM_OTEL_V2=true
OTEL_EXPORTER="otlp_grpc"
OTEL_ENDPOINT="http://localhost:4317"
```

> gRPC 匯出需要 `grpcio`。請使用 `pip install grpcio` 安裝。

</TabItem>

</Tabs>

透過 `OTEL_HEADERS` 傳遞後端所需的驗證標頭：

```shell
OTEL_HEADERS="api-key=your-key,x-tenant=acme"
```

然後照常啟動 proxy：

```shell
litellm --config config.yaml
```

提出請求後，您會在後端看到每個請求一條 trace。

### 2. 將追蹤傳送到特定工具（預設） {#2-send-traces-to-a-specific-tool-presets}

對於 LLM 可觀測性工具，請使用**預設**。預設知道工具的端點，並以該工具所預期的 schema 發出屬性。若要啟用其中之一，請在設定檔中的 `callbacks` 新增其名稱，並將該工具的憑證設為環境變數。

<Tabs>

<TabItem value="arize" label="Arize">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["arize"]
```

```shell
LITELLM_OTEL_V2=true
ARIZE_SPACE_ID="your-space-id"
ARIZE_API_KEY="your-api-key"
ARIZE_PROJECT_NAME="your-project-name"   # recommended: names the project traces land in
```

</TabItem>

<TabItem value="phoenix" label="Arize Phoenix">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["arize_phoenix"]
```

```shell
LITELLM_OTEL_V2=true
PHOENIX_API_KEY="your-api-key"
PHOENIX_COLLECTOR_ENDPOINT="https://app.phoenix.arize.com/v1/traces"
PHOENIX_PROJECT_NAME="my-project"   # optional
```

</TabItem>

<TabItem value="langfuse" label="Langfuse">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["langfuse_otel"]
```

```shell
LITELLM_OTEL_V2=true
LANGFUSE_PUBLIC_KEY="pk-..."
LANGFUSE_SECRET_KEY="sk-..."
LANGFUSE_HOST="https://cloud.langfuse.com"   # or your self-hosted URL
```

</TabItem>

<TabItem value="weave" label="Weave (W&B)">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["weave_otel"]
```

```shell
LITELLM_OTEL_V2=true
WANDB_API_KEY="your-api-key"
WANDB_PROJECT_ID="your-entity/your-project"
```

</TabItem>

<TabItem value="langtrace" label="Langtrace">

Langtrace 不會直接接受 litellm 的 OTLP spans。它會在自訂路徑（`/api/trace`）上，以 `x-api-key` 標頭攝取 JSON 編碼的 OTLP，而 litellm v2 會將 protobuf 傳送至 `/v1/traces`。請在兩者之間執行 OpenTelemetry Collector：litellm 將資料匯出到 collector，而 collector 會將 spans 重新編碼為 JSON 並轉送至 Langtrace。`langtrace` 回呼仍會套用 Langtrace 的屬性 schema；collector 只負責傳遞。

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["langtrace"]
```

```shell
LITELLM_OTEL_V2=true
OTEL_ENDPOINT="http://otel-collector:4318"
```

Collector 設定（`otel-collector-config.yaml`），並在 collector 的環境中設定 `LANGTRACE_API_KEY`：

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
exporters:
  otlphttp/langtrace:
    encoding: json
    compression: none
    traces_endpoint: https://app.langtrace.ai/api/trace
    headers:
      x-api-key: ${env:LANGTRACE_API_KEY}
      Content-Type: application/json
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlphttp/langtrace]
```

</TabItem>

<TabItem value="levo" label="Levo">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["levo"]
```

```shell
LITELLM_OTEL_V2=true
LEVOAI_API_KEY="your-api-key"
LEVOAI_ORG_ID="your-org-id"
LEVOAI_WORKSPACE_ID="your-workspace-id"
LEVOAI_COLLECTOR_URL="your-levo-collector-url"   # contact Levo support for this
```

</TabItem>

<TabItem value="agentops" label="AgentOps">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["agentops"]
```

```shell
LITELLM_OTEL_V2=true
AGENTOPS_API_KEY="your-api-key"
```

</TabItem>

<TabItem value="signoz" label="SigNoz">

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["signoz"]
```

```shell
LITELLM_OTEL_V2=true
SIGNOZ_INGESTION_ENDPOINT="https://ingest.<region>.signoz.cloud:443"   # or your self-hosted collector, e.g. http://signoz-otel-collector:4318
SIGNOZ_INGESTION_KEY="your-ingestion-key"                              # omit for self-hosted SigNoz
```

</TabItem>

</Tabs>

:::tip[同時傳送到多個後端]

若要將相同的 traces 傳送到多個供應商，請在 `callbacks` 中列出每個預設，並設定各自的環境變數。例如，同時使用 Langfuse 與 Arize：

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["langfuse_otel", "arize"]
```

每個預設都會新增自己的目的地，因此您的 spans 會平行送達所有目的地，且各自採用該工具的原生格式。

:::

### 預設參考 {#preset-reference}

每個預設都會轉換為單一共享 tracer 上的一個 exporter。下表列出每個預設在 `callbacks` 中填入的回呼名稱、它讀取的憑證、傳送目的地、在標準化 `gen_ai.*` 鍵值之上新增的屬性詞彙，以及是否支援每個請求（每個團隊／金鑰）憑證。

| 預設 | 回呼 | 必要環境變數 | 選用環境變數 | 目的地 | 詞彙 | 每請求憑證 |
|---|---|---|---|---|---|---|
| Arize AX | `arize` | `ARIZE_SPACE_ID`（`ARIZE_SPACE_KEY` 已棄用）、`ARIZE_API_KEY` | `ARIZE_PROJECT_NAME`（命名 traces 所屬的專案）、`ARIZE_ENDPOINT`（gRPC，預設 `https://otlp.arize.com/v1`）、`ARIZE_HTTP_ENDPOINT`（HTTP） | Arize AX 平台 | OpenInference | 是 |
| Arize Phoenix | `arize_phoenix` | `PHOENIX_API_KEY`（僅限 Phoenix Cloud；自架不需要） | `PHOENIX_COLLECTOR_HTTP_ENDPOINT` 或 `PHOENIX_COLLECTOR_ENDPOINT`（協定由值推斷）、`PHOENIX_PROJECT_NAME` | Phoenix（自架或 Phoenix Cloud） | OpenInference | 否 |
| Langfuse | `langfuse_otel` | `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY` | `LANGFUSE_HOST`（或 `LANGFUSE_OTEL_HOST`；預設 `https://us.cloud.langfuse.com`，EU 為 `https://cloud.langfuse.com`）、`OTEL_IGNORE_CONTEXT_PROPAGATION`（設定 `true` 以捨棄傳入的 `traceparent`） | Langfuse Cloud 或自架 | Langfuse | 是 |
| Weave (W&B) | `weave_otel` | `WANDB_API_KEY`、`WANDB_PROJECT_ID`（`<entity>/<project>`） | `WANDB_HOST`（預設 `https://trace.wandb.ai`） | Weights & Biases Weave | OpenInference + Weave | 是 |
| Langtrace | `langtrace` | 無其自身項目 | — | Langtrace，透過 OpenTelemetry Collector（Langtrace 僅攝取 JSON 格式 OTLP） | Langtrace | 否 |
| Levo | `levo` | `LEVOAI_API_KEY`、`LEVOAI_ORG_ID`、`LEVOAI_WORKSPACE_ID`、`LEVOAI_COLLECTOR_URL` | — | Levo collector | 僅標準化 `gen_ai.*` | 否 |
| AgentOps | `agentops` | `AGENTOPS_API_KEY` | `AGENTOPS_SERVICE_NAME`（預設 `agentops`）、`AGENTOPS_ENVIRONMENT`（無預設） | AgentOps（`https://otlp.agentops.ai/v1/traces`） | 僅標準化 `gen_ai.*` | 否 |
| SigNoz | `signoz` | `SIGNOZ_INGESTION_ENDPOINT`（OTLP 基底 URL；會附加 `/v1/traces`） | `SIGNOZ_INGESTION_KEY`（以 `signoz-ingestion-key` 傳送；自架可省略） | SigNoz Cloud 或自架 SigNoz，OTLP HTTP | 僅標準化 `gen_ai.*` | 是 |

附註：

- **Arize AX 與 Arize Phoenix**：完整功能的 AX 平台請使用 `arize`，Phoenix 本機或自架工作流程請使用 `arize_phoenix`。它們使用不同的憑證與端點，因此請針對您實際執行的後端選擇對應的回呼。產品特定設定請參閱專用的 [Arize AX](./arize_integration) 與 [Arize Phoenix](./phoenix_integration) 指南。
- **Langtrace** 會在自訂路徑上只接收 JSON 格式的 OTLP，因此 litellm v2（會將 protobuf 傳送至 `/v1/traces`）無法直接匯出到它。請透過 OpenTelemetry Collector 重新編碼為 JSON；`langtrace` 預設只會為您的 spans 加上 Langtrace 屬性結構。Collector 設定請參閱上方的 Langtrace 分頁。
- 詞彙是累加式的：每個預設的 spans 都會始終帶有標準 OpenTelemetry `gen_ai.*` 屬性；列出的詞彙會疊加其上，因此目的地工具會讀取其原生結構。

## 查看您的追蹤 {#seeing-your-traces}

一旦後端以其預設完成設定，每個請求都會在該工具的 UI 中顯示為位於請求根節點下的 `chat <model>` span。以下每個分頁都涵蓋各供應商特有的注意事項（專案對應、端點變體、中繼資料鍵），這些最容易讓人出錯。

<Tabs>

<TabItem value="arize-shot" label="Arize">

#### Arize 會呈現什麼 {#what-arize-renders}

開啟您的 Arize 專案；trace 會顯示在由 `ARIZE_PROJECT_NAME` 命名的專案下。`openinference` 對應器會將 OpenInference 詞彙寫入 LLM 呼叫 span，並同時附上標準 `gen_ai.*` 鍵，因此 Arize 會讀取其原生結構而不會丟失標準鍵。

#### 由 `openinference` 對應器新增的屬性 {#attributes-added-by-the-openinference-mapper}

| 屬性 | 轉述 |
|---|---|
| `openinference.span.kind` | 固定的 `LLM` |
| `llm.model_name`, `llm.provider` | model, provider |
| `llm.token_count.prompt`, `completion`, `total` | usage split |
| `llm.invocation_parameters` | request 參數的 JSON blob |
| `llm.input_messages.{idx}.message.role`, `content` | prompt（已開啟內容擷取），[有上限](#chat-messages-are-capped) |
| `llm.output_messages.{idx}.message.role`, `content` | response（已開啟內容擷取），[有上限](#chat-messages-are-capped) |
| `input.value`, `output.value` | 每則訊息的 role 與文字之 JSON 陣列（已開啟內容擷取） |
| `llm.tools.{idx}.tool.name`, `description`, `json_schema` | tool 定義，[有上限](#tool-definitions-are-capped) |

完整且權威的詞彙請參閱完整的 [OpenInference 規格](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md)。

#### 設定注意事項 {#setup-notes}

- `ARIZE_SPACE_KEY` 是 `ARIZE_SPACE_ID` 的已棄用名稱；該預設仍為了向後相容而讀取它，但在新設定中請優先使用 `ARIZE_SPACE_ID`。

![LiteLLM 在 Arize 中的 trace](/img/observability/otel_v2_arize.png)

</TabItem>

<TabItem value="phoenix-shot" label="Arize Phoenix">

#### Phoenix 會呈現什麼 {#what-phoenix-renders}

開啟 Phoenix；專案來自 `PHOENIX_PROJECT_NAME`（預設 `default`），並標記為 `openinference.project.name` 資源屬性。Phoenix 使用與 Arize AX 相同的 OpenInference 詞彙。

在 proxy 上，您可以將某個團隊或金鑰的 LLM spans 傳送到同一個 collector 上的另一個 Phoenix 專案。請在團隊或金鑰上設定 `phoenix_project_name`；請參閱 [依團隊或金鑰將 traces 路由到 Phoenix 專案](./phoenix_integration#route-traces-to-a-phoenix-project-per-team-or-key)。

#### 由 `openinference` 對應器新增的屬性 {#attributes-added-by-the-openinference-mapper-1}

與上方 Arize 分頁相同。

#### 設定注意事項 {#setup-notes-1}

Phoenix 有不只一種 collector 端點形式，選錯是最常見的 Phoenix 設定錯誤。請將 `PHOENIX_COLLECTOR_HTTP_ENDPOINT`（或在前者未設定時接管的 `PHOENIX_COLLECTOR_ENDPOINT`）指向符合您部署的形式。這兩個變數都不綁定特定協定：litellm 會根據值來推斷，僅在 `grpc://` 端點或沒有 `/v1/traces` 路徑的 `:4317` 端點時透過 gRPC 匯出，其他情況則透過 HTTP。

| 部署 | 端點 |
|---|---|
| Phoenix Cloud（Spaces） | `https://app.phoenix.arize.com/s/<space-name>/v1/traces` |
| Phoenix Cloud（舊版） | `https://app.phoenix.arize.com/legacy/v1/traces` |
| Phoenix Cloud（更早期） | `https://app.phoenix.arize.com/v1/traces` |
| 自架 | `http://localhost:6006/v1/traces` |

![LiteLLM 在 Phoenix 中的 trace](/img/observability/otel_v2_phoenix.png)

</TabItem>

<TabItem value="langfuse-shot" label="Langfuse">

#### Langfuse 會呈現什麼 {#what-langfuse-renders}

開啟 Langfuse 的 traces 檢視；LLM 呼叫 span 會以 Langfuse **generation** 的形式出現，可依團隊篩選。端點解析順序為 `LANGFUSE_OTEL_HOST`，接著是 `LANGFUSE_HOST`，再來是美國雲端預設值，自架主機則會附加 `/api/public/otel`。

#### 由 `langfuse` 對應器新增的屬性 {#attributes-added-by-the-langfuse-mapper}

| 屬性 | 目的 |
|---|---|
| `langfuse.observation.type` | 固定 `generation`，因此此 span 會顯示為 model call |
| `langfuse.observation.model.name` | generation 上顯示的模型 |
| `langfuse.observation.model.parameters` | request 參數的 JSON（temperature、top_p、max_tokens、penalties、seed） |
| `langfuse.observation.id` | 與 `litellm.call_id` 相同 |
| `langfuse.observation.input` / `output` | prompt 與 response 內容（已開啟內容擷取） |
| `langfuse.observation.usage_details` | 輸入／輸出／總 token 數 |
| `langfuse.observation.cost_details` | 總成本 |
| `langfuse.trace.metadata.team_id`, `team_alias` | 可篩選的團隊身分 |

這些是由預設從 request 與 response 設定，而不是來自用戶端提供的 metadata dict，因此無需額外設定就會取得。

#### 設定注意事項 {#setup-notes-2}

- 驗證採用 HTTP Basic，`Authorization: Basic <base64(public_key:secret_key)>`；該預設會從 `LANGFUSE_PUBLIC_KEY` 與 `LANGFUSE_SECRET_KEY` 建立此設定，因此您不需要直接設定標頭。
- 如果您的用戶端已經送出 W3C `traceparent`，而 Langfuse 卻抓到錯誤的父項，請在 proxy 環境中設定 `OTEL_IGNORE_CONTEXT_PROPAGATION=true` 以捨棄進站 context。
- 預設情況下，您的 Langfuse 專案會接收整個 request tree。請設定 `LITELLM_OTEL_LANGFUSE_SPAN_SCOPE=llm_only` 以只保留 generations；請參閱 [只將 model call 傳送到 Langfuse](#send-only-the-model-calls-to-langfuse)。
- 這是 Langfuse 風格的路徑；若要使用通用 OTel 後端，請改用 [通用 OTLP 設定](#1-send-traces-to-any-otlp-collector)。

![LiteLLM 在 Langfuse 中的 trace](/img/observability/otel_v2_langfuse.png)

</TabItem>

<TabItem value="weave-shot" label="Weave (W&B)">

#### Weave 會呈現什麼 {#what-weave-renders}

開啟 `wandb.ai/<entity>/weave` 的 Weave 專案。Weave 同時採用 OpenInference 與一個小型 Weave 覆疊，因此 `weave_otel` 預設會在同一個 span 上組合兩個對應器。

#### 由 `weave` 對應器新增的屬性 {#attributes-added-by-the-weave-mapper}

`openinference` 對應器（請參閱 Arize 分頁）會先執行，接著 `weave` 對應器會新增：

| 屬性 | 目的 |
|---|---|
| `weave.display_name` | `"{operation} {model}"`（例如 `chat gpt-4o`） |
| `weave.call_id` | 與 `litellm.call_id` 相同 |
| `weave.output` | choices 的 JSON 陣列（已開啟內容擷取） |

#### 設定注意事項 {#setup-notes-3}

- `WANDB_PROJECT_ID` 必須是 `entity/project` 格式，這是最常見的設定錯誤。
- `weave_otel` 預設是以 OTel 為基礎的 Weave 整合，與較舊的 `wandb` success-callback 記錄器無關（後者使用 `wandb` Python 套件並直接寫入 W&B，不透過 OTel）；如果您要找的是那個，請參閱 [W&B 舊版頁面](./wandb_integration)。

![LiteLLM 在 Weave 中的 trace](/img/observability/otel_v2_weave.png)

</TabItem>

<TabItem value="agentops-shot" label="AgentOps">

#### AgentOps 會呈現什麼 {#what-agentops-renders}

開啟 AgentOps 儀表板。AgentOps 不會新增供應商對應器，因此 spans 會以標準 `gen_ai.*` 結構（若已啟用則另加 `legacy`）進入。

#### 由 AgentOps 預設新增的屬性 {#attributes-added-by-the-agentops-preset}

不會新增任何供應商對應器，因此 LLM 呼叫 span 只會帶有 [Span 屬性](#span-attributes) 中列出的標準鍵。該預設會在 traces 上控制兩個資源層級標籤：

| 屬性 | 目的 |
|---|---|
| `service.name` | 來自 `AGENTOPS_SERVICE_NAME`（預設 `agentops`） |
| `deployment.environment` | 來自 `AGENTOPS_ENVIRONMENT`；僅在設定時才會標記 |

#### 設定注意事項 {#setup-notes-4}

- AgentOps 會在首次 span 匯出時才建立其驗證 token，而不是在啟動時，因此第一次匯出看起來可能會短暫延遲；這每個程序只會發生一次，屬於預期行為。
- 如果您想在 AgentOps UI 中區分環境，請設定 `AGENTOPS_SERVICE_NAME` / `AGENTOPS_ENVIRONMENT`。

![AgentOps 中的 LiteLLM 追蹤](/img/observability/otel_v2_agentops.png)

</TabItem>

<TabItem value="langtrace-shot" label="Langtrace">

#### Langtrace 會呈現什麼 {#what-langtrace-renders}

開啟 Langtrace UI；spans 會透過您的 OpenTelemetry Collector 流動，並攜帶 `langtrace.*` 和 `llm.*` 金鑰。

#### 由 `langtrace` 對應器新增的屬性 {#attributes-added-by-the-langtrace-mapper}

| 屬性 | 重述 |
|---|---|
| `langtrace.service.name` | 提供者 |
| `llm.model`, `gen_ai.response.model`, `gen_ai.response_id`, `gen_ai.system_fingerprint` | 請求/回應識別碼 |
| `llm.temperature`, `top_p`, `top_k`, `max_tokens`, `frequency_penalty`, `presence_penalty` | 請求參數 |
| `llm.stream` | 串流旗標 |
| `llm.token.counts.prompt`, `completion`, `total` | 用量拆分 |
| `llm.prompts`, `llm.completions` | JSON 陣列（已開啟內容擷取） |

#### 設定注意事項 {#setup-notes-5}

Langtrace 只在一個自訂路徑攝取 JSON 格式的 OTLP，因此 litellm 會透過 OpenTelemetry Collector 匯出，並重新編碼為 JSON。請參閱 [Getting started 下的 Langtrace 分頁](#2-send-traces-to-a-specific-tool-presets) 以了解 collector 設定。

![Langtrace 中的 LiteLLM 追蹤](/img/observability/otel_v2_langtrace.png)

</TabItem>

<TabItem value="levo-shot" label="Levo">

#### Levo 會呈現什麼 {#what-levo-renders}

開啟 Levo 儀表板。Levo 不會新增供應商對應器，因此 spans 會以標準化的 `gen_ai.*` 結構描述到達（若已啟用，則另含 `legacy`）。

#### 由 Levo 預設新增的屬性 {#attributes-added-by-the-levo-preset}

不會新增供應商對應器。追蹤只攜帶 [Span 屬性](#span-attributes) 中的標準化金鑰。預設會將 spans 路由到 `LEVOAI_COLLECTOR_URL`，並帶有 `Authorization: Bearer $LEVOAI_API_KEY`，以及由 `LEVOAI_ORG_ID` 和 `LEVOAI_WORKSPACE_ID` 建構而成的 `x-levo-organization-id` 和 `x-levo-workspace-id` 標頭。

#### 設定注意事項 {#setup-notes-6}

- collector URL 會原樣使用，不會進行路徑操作，因此請提供 Levo 給您的完整 URL。
- 若要以環境標記 spans，請設定 `OTEL_ENVIRONMENT_NAME`；Levo 預設除了四個必要項目外，不會讀取任何屬於它自己的環境變數。

</TabItem>

<TabItem value="signoz-shot" label="SigNoz">

#### SigNoz 會呈現什麼 {#what-signoz-renders}

開啟 **Traces**，並依據 `OTEL_SERVICE_NAME` 中命名的服務進行篩選（預設為 `litellm`）。每個請求都會是一條 trace，伺服器 span 位於根節點，底下是 `chat <model>` span；span 詳細資料檢視會列出 `gen_ai.*` 和 `litellm.*` 屬性，而 **Related Logs** 按鈕會開啟依 trace id 關聯的記錄行。

#### 由 SigNoz 預設新增的屬性 {#attributes-added-by-the-signoz-preset}

不會新增供應商對應器。spans 只攜帶 [Span 屬性](#span-attributes) 中的標準化金鑰，這也是 SigNoz 的 LLM 檢視與其 [LiteLLM 儀表板範本](https://signoz.io/docs/dashboards/dashboard-templates/litellm-proxy-dashboard/) 所讀取的內容。

#### 設定注意事項 {#setup-notes-7}

- `SIGNOZ_INGESTION_ENDPOINT` 是 SigNoz Cloud（`https://ingest.<region>.signoz.cloud:443`）與自架 collector（`http://<host>:4318`）共用的 OTLP 基底 URL。預設會附加 `/v1/traces`；已經以 `/v1/traces` 結尾的值會直接原樣使用。未設定或空白的值會在啟動時失敗，並回報包含該變數名稱的錯誤，且不會匯出任何內容。
- `SIGNOZ_INGESTION_KEY` 為選用。設定後會作為 `signoz-ingestion-key` 標頭送出；未設定時不會送出驗證標頭，這就是自架情況。
- 支援依團隊與依金鑰的路由，包括每個租戶一個端點。請參閱 [SigNoz](./signoz#per-team-and-per-key-routing)。

</TabItem>

<TabItem value="generic-shot" label="Generic OTLP">

#### 通用 OTLP 後端會呈現什麼 {#what-a-generic-otlp-backend-renders}

任何您的後端 UI 顯示的標準 OTel GenAI spans 內容。`generic` 預設（以及 [Getting started 第 1 節](#1-send-traces-to-any-otlp-collector) 中單純的環境變數 OTLP 路徑）不會新增供應商對應器。

#### 新增的屬性 {#attributes-added}

除了 [Span 屬性](#span-attributes) 中列出的標準化 `gen_ai.*` 和 `litellm.*` 金鑰，以及在 `LITELLM_OTEL_LEGACY_COMPAT=true` 時的 `legacy` Traceloop 金鑰之外，沒有其他內容。

#### 設定注意事項 {#setup-notes-8}

此路徑適用於 Jaeger、Grafana Tempo、Honeycomb、Datadog、Splunk Observability Cloud，以及任何其他使用標準 OTLP 的後端。SigNoz 有自己的 `signoz` 預設，並提供每個團隊的攝取金鑰；請參閱 [SigNoz](./signoz)。如果後端未列於上方且沒有專用分頁，就請使用這個。若是 Grafana Cloud，請參閱 [Grafana Cloud](./grafana_cloud)，其中涵蓋 OTLP gateway 的驗證格式與預建的 GenAI 儀表板。

</TabItem>

</Tabs>

## 擷取提示與回應 {#capturing-prompts--responses}

預設情況下，OTel v2 只記錄**中繼資料**（模型、token、成本、時間），**絕不**會將提示或回應文字寫入您的 traces。這是刻意設計，且可將敏感內容排除在您的可觀測性後端之外。

若要擷取訊息內容，請明確選擇啟用：

```shell
# no_content (default) — never capture prompts/responses
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT="no_content"

# span_only — write prompts/responses as attributes on spans
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT="span_only"

# event_only — write prompts/responses on log events instead of span attributes
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT="event_only"

# span_and_event — write content to both spans and events
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT="span_and_event"
```

此閘門會在中央強制執行，因此會同時套用到**每一個**後端。當擷取功能停用時，使用者請求絕不可能強制將其提示送入您的後端。

## Span 屬性 {#span-attributes}

屬性來自依序加到每個 span 上的一串對應器。標準化的 `genai` 對應器一律先套用，`legacy` 相容性對應器預設為啟用，而每個預設都會再加上一個供應商對應器。後面的對應器可以覆寫前面的對應器；因此同一個 span 會帶有數種描述同一請求的詞彙系統。

前兩個表格涵蓋 LLM 請求 span 的標準化詞彙。下方各節列出其他 span 類型，接著說明每個供應商對應器新增的內容。

### LLM 呼叫 span，標準 `gen_ai.*` + `litellm.*` {#llm-call-span-canonical-gen_ai--litellm}

請求端金鑰：

| 屬性 | 設定時機 |
|---|---|
| `gen_ai.operation.name` | 一律（`chat`、`text_completion`、`embeddings`） |
| `gen_ai.provider.name` | 一律 |
| `gen_ai.request.model` | 一律（使用者可見的模型群組名稱） |
| `gen_ai.request.temperature`, `top_p`, `top_k`, `max_tokens` | 在請求上設定時 |
| `gen_ai.request.frequency_penalty`, `presence_penalty`, `seed` | 在設定時 |
| `gen_ai.request.stop_sequences` | 在設定時（字串陣列） |
| `gen_ai.tool.{idx}.name`, `description`, `parameters` | 每個工具定義各一組，僅供前面的工具使用（[原因](#tool-definitions-are-capped)） |
| `litellm.request.tools.declared` | 當請求宣告 tools 時；完整數量，不論是否有上限 |
| `server.address`, `server.port` | 當已知提供者端點時 |

#### 工具定義有上限 {#tool-definitions-are-capped}

只有前面宣告的工具會取得 `gen_ai.tool.{idx}.*` 屬性。工具定義是一個無上限的屬性家族；每個活躍詞彙系統中，每個工具每個欄位都會有一筆，而 OpenTelemetry 預設將每個 span 上限設為 128 個屬性。若某個代理程式宣告了一百個或更多工具，就會超過該上限，而因為限制會先捨棄最舊的屬性，上方的 `gen_ai.*` 屬性會成為被丟棄的項目，最後 span 只剩下工具結構描述。無論請求宣告了多少工具，這個上限都能確保模型、token 用量與成本留在 span 上。

這個上限是以整個 span 為單位，而不是按詞彙系統分別計算。工具定義總共最多可占 span 屬性預算的四分之一，而這個配額會在產生它們的各個詞彙系統之間分攤，因此可詳細列出的工具數量取決於有多少個啟用中：在預設的 `genai` 加 `legacy` 配對下，每個可有 5 個工具；一旦加入像 `openinference` 這類供應商詞彙系統後，每個則為 3 個工具。之所以這樣切分，就是為了避免三個詞彙系統把同一組工具各自展開後又總和超過限制。

`litellm.request.tools.declared` 一律會保留真實總數，因此您可以判斷每個工具的細節是否已被截斷。宣告工具數少於配額的請求會保留完整細節。

#### 聊天訊息有上限 {#chat-messages-are-capped}

`openinference` 對應器的 `llm.input_messages.{idx}.*` 與 `llm.output_messages.{idx}.*` 鍵是另一個無界家族：每則訊息兩個屬性，無論是提示詞還是回應皆然。超過幾十輪之後，光是它們就會超出 128 個屬性的預設值，並淘汰先前寫入的 `gen_ai.*` 模型、用量、成本與結束原因屬性。因此它們會依照 span 剩餘的預算來配置：其 tracer provider 的屬性數量上限（`OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT`，或注入式或每請求路由 provider 的 `SpanLimits`）再減去 span 上其他所有屬性，`error.*` 也包含在內。能放得下的對話會完整建立索引。放不下的則會整則訊息遺失，角色與內容一併移除，先捨棄價值最低者：中間的提示輪次，接著是額外的回應選項，再來是訊息 0 與最新一輪，最後才是第一個選項。保留下來的訊息會維持原始索引，因此即使 `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT` 在對話結束前就截斷 `input.value` blob，訊息 0 與最新幾輪仍可存取。搭配 `genai` 加上 `openinference` 與 `LITELLM_OTEL_LEGACY_COMPAT=false`，一段 60 輪、每輪一個回覆且使用預設上限的對話會索引 `llm.input_messages.0`、`.18` 到 `.59`，以及 `llm.output_messages.0`；預設的 `legacy` 對應器也會自行新增鍵，因此啟用時能存活的中間輪次會更少。

這個上限只會影響按索引取用的便利鍵。`input.value` 與 `output.value` 仍會列出每則訊息的角色與文字，而標準的 `gen_ai.input.messages` 與 `gen_ai.output.messages` blobs 會保留完整的訊息物件（包含 tool calls 與非文字部分），因此整段對話仍會留在 span 上，而 Arize 也會繼續將其渲染。這些 blobs 是單一字串，所以 `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`（預設不受限制）在長對話中可能會將其截斷；此時保留下來的按索引鍵仍會顯示開頭與最新幾輪。Phoenix 在渲染 span 時會將按索引鍵壓縮成密集清單，因此索引中的缺口會在那裡顯示為較短的訊息清單，但順序相同。

回應、用量、成本、身分：

| 屬性 | 設定時機 |
|---|---|
| `gen_ai.response.id`, `gen_ai.response.model` | 成功時 |
| `gen_ai.response.finish_reasons` | 成功時（字串陣列） |
| `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | 成功時 |
| `gen_ai.input.messages`, `gen_ai.output.messages` | 啟用內容擷取時 |
| `gen_ai.system_instructions` | 啟用內容擷取時，且存在 system prompt 時 |
| `litellm.call_id` | 一律 |
| `litellm.provider.model` | 一律（實際傳送給提供者的模型字串） |
| `litellm.request.streaming` | 為 true 時 |
| `litellm.request.route` | 在 proxy 上（root span 回報為 `http.route` 的同一路由：FastAPI 路由樣板，例如 `/v1/responses/{response_id}`，或像 `/openai/...` 這類 passthrough prefix 上的字面路徑；當沒有 server span 時，例如路由在 `OTEL_PYTHON_FASTAPI_EXCLUDED_URLS` 中，或尚未安裝 FastAPI instrumentation 時，會退回到 proxy 在 auth 時記錄的路由） |
| `litellm.cost.total` | 成功時 |
| `litellm.cost.input`, `output`, `cache_read`, `cache_creation`, `tool_usage` | 來源回報 breakdown 時 |
| `litellm.cost.original`, `discount_amount`, `discount_percent`, `margin_fixed_amount`, `margin_percent`, `margin_total_amount` | 有回報時 |

狀態與錯誤：

- **失敗時：** span 會記錄標準的 `exception` 事件（`exception.type`、`exception.message`），將 `error.type` 設為例外類別，並將其狀態設為 `ERROR`。
- **成功時：** 狀態會維持 `UNSET`（semconv 預設值，與 FastAPI server span 相符）。只有真正的錯誤才會將其設為 `ERROR`，因此不要以 `OK` 的狀態作為警示條件。

### 其他 span 類型 {#other-span-kinds}

**防護欄 span**，使用 `litellm.guardrail.*` 命名空間：`name`、`mode`、`status`、`provider`、`action`、`response`、`violation_categories`、`confidence_score`、`risk_score`、`masked_entity_count`、`duration`、`id`、`policy_template`、`detection_method`。`status` 是 `success`、`guardrail_intervened`、`guardrail_failed_to_respond` 或 `not_run` 之一；封鎖性的 `guardrail_intervened` 或 `guardrail_failed_to_respond` 也會將 span 狀態設為 `ERROR`。

**資料儲存 span**（redis、postgres）：`db.system.name`、`db.operation.name`、`litellm.service.name`、`litellm.service.call_type`。

**內部服務 span**：只有 `litellm.service.*` 鍵（沒有 `db.*`）。

**MCP tool-call span**：`gen_ai.operation.name=execute_tool`、`mcp.method.name`、`mcp.session.id`、`gen_ai.tool.name`、`litellm.mcp.server.name`、`litellm.call_id`、`litellm.cost.total`。`gen_ai.tool.call.arguments` 與 `gen_ai.tool.call.result` 與提示內容共用相同的內容擷取設定閘控。

**Root HTTP server span**：HTTP semconv 鍵 `http.request.method`、`http.route`、`http.response.status_code`、`url.path`，由 FastAPI instrumentation 加上標記（不是 LiteLLM 的任何 mapper）。

每個供應商預設設定也會在這些標準鍵之上再組合一個供應商專屬 mapper，因此目的端會以其原生 schema 讀取 trace。那些各供應商表格位於對應的 [查看您的 traces](#seeing-your-traces) 分頁下。

## 屬性慣例 {#attribute-conventions}

LiteLLM 會輸出一組標準的 GenAI 屬性，並透過新增 mapper 在其上疊加其他詞彙；啟用中的集合由 `mapper_names` 控制，而 `genai` 永遠優先。`legacy` mapper 預設為開啟（`LITELLM_OTEL_LEGACY_COMPAT=true`），並會以舊版 semconv-ai / Traceloop 名稱重新輸出相同資料，因此以那些名稱建立的儀表板在遷移期間仍可正常運作。當您的查詢已改用標準鍵後，可用 `LITELLM_OTEL_LEGACY_COMPAT=false` 將其關閉。供應商 mapper（`openinference`、`langfuse`、`weave`、`langtrace`）由其預設設定加入，且永遠不會取代標準鍵。

最常見的鍵在各詞彙中的對應如下：

| 標準（`genai`） | 舊版（Traceloop） | OpenInference |
|---|---|---|
| `gen_ai.usage.input_tokens` | `gen_ai.usage.prompt_tokens` | `llm.token_count.prompt` |
| `gen_ai.usage.output_tokens` | `gen_ai.usage.completion_tokens` | `llm.token_count.completion` |
| `gen_ai.provider.name` | `gen_ai.system` | `llm.provider` |
| `litellm.request.streaming` | `llm.is_streaming` | n/a |
| `gen_ai.request.model` | n/a | `llm.model_name` |

## 每個 span 上的請求識別 {#request-identity-on-every-span}

LiteLLM 會在授權邊界將一小組請求身分值寫入標準 OpenTelemetry [Baggage](https://opentelemetry.io/docs/specs/otel/baggage/)。接著自訂的 span processor 會將這些值複製到 trace 中的每個 span，因此可依團隊或金鑰篩選防護欄、資料儲存或服務 span，而不必由 LiteLLM 逐一手動重設。

預設會將以下鍵寫入每個 span：

| 鍵 | 值 |
|---|---|
| `litellm.team.id` | Team UUID |
| `litellm.team.alias` | Team 顯示名稱 |
| `litellm.team.metadata` | Team 的自由格式中繼資料，已過濾至您加入 allowlist 的子鍵 |
| `litellm.api_key.hash` | 呼叫者虛擬金鑰的雜湊值 |
| `gen_ai.request.model` | 使用者可見的 model group 名稱 |
| `litellm.provider.model` | 在提供者上派送的 model |

另一組請求中繼資料欄位會寫入 `litellm.metadata.*` 命名空間下。預設值：

`litellm.metadata.user_api_key_org_id`、`litellm.metadata.user_api_key_user_id`、`litellm.metadata.user_api_key_alias`、`litellm.metadata.user_api_key_end_user_id`、`litellm.metadata.requester_ip_address`。

兩個預設值為了隱私而保持保守。終端使用者 id 可提升，但在頂層預設為關閉（它會識別個人）；它會出現在 `litellm.metadata.user_api_key_end_user_id` 底下，而依使用者過濾的呼叫端應該啟用它。團隊的自由格式 metadata 絕不會整包送出；只有您列入 allowlist 的子鍵會離開程序，而 allowlist 預設是空的。

可透過 `LITELLM_OTEL_BAGGAGE_PROMOTED_KEYS`、`LITELLM_OTEL_BAGGAGE_METADATA_KEYS` 和 `LITELLM_OTEL_BAGGAGE_TEAM_METADATA_KEYS` 環境變數（以逗號分隔），或 `callback_settings.otel` 下對應的 YAML 清單來覆寫這些設定。

## 指標 {#metrics}

除了 traces 之外，OTel v2 還可以發出 GenAI **client metrics**：用於呼叫延遲、token 使用量與成本的直方圖，由您的後端在多個請求之間彙總。和 OTel v2 的其他功能一樣，它們在您啟用之前都會保持關閉。

在 proxy 環境中、`LITELLM_OTEL_V2` 旁邊設定旗標：

```shell
LITELLM_OTEL_V2=true
LITELLM_OTEL_INTEGRATION_ENABLE_METRICS=true
```

指標會透過您已為 traces 設定的 exporter 傳送。`OTEL_EXPORTER`（`console`、`otlp_http`、`otlp_grpc`）、`OTEL_ENDPOINT` 和 `OTEL_HEADERS` 會像處理 spans 一樣決定 metric 串流的去向，因此接收您 traces 的 collector 也會接收這些 metrics。

### 記錄了什麼 {#whats-recorded}

每次成功的 LLM 呼叫都會記錄標準的 OpenTelemetry GenAI client metrics：

| 指標 | 單位 | 衡量內容 |
|---|---|---|
| `gen_ai.client.operation.duration` | `s` | 整個 LLM 呼叫的牆上時鐘時間 |
| `gen_ai.client.token.usage` | `{token}` | 消耗的 tokens，依 `gen_ai.token.type` 屬性分成輸入與輸出 |
| `gen_ai.usage.cost` | `USD` | LiteLLM 為該呼叫計算出的成本 |
| `gen_ai.server.time_to_first_token` | `s` | 到第一個串流 token 的時間（串流呼叫） |
| `gen_ai.server.time_per_output_token` | `s` | 每個輸出 token 的平均時間 |
| `gen_ai.client.response.duration` | `s` | 提供者端生成時間 |

:::note[本次版本已重新命名]

`gen_ai.usage.cost`、`gen_ai.server.time_to_first_token` 和 `gen_ai.server.time_per_output_token` 先前是以 `gen_ai.client.token.cost`、`gen_ai.client.response.time_to_first_token` 和 `gen_ai.client.response.time_per_output_token` 發出。舊名稱不屬於 GenAI 語意慣例，且沒有任何廠商儀表板會查詢它們，因此沒有任何預先建置的內容能繪製 LiteLLM 的成本或延遲。如果您曾針對舊名稱手動建立面板或警示，請將它們改指向上方的名稱

:::

每個樣本都帶有與對應 span 相同的身分屬性（operation、provider/system、request model、framework，以及選定的 `metadata.*` 欄位），因此您可以依 model、provider、key 或 team 分組這些直方圖。這些是 [v1 OpenTelemetry 整合](./opentelemetry_integration) 發出的同一組六個 metrics，名稱與單位完全相同，因此為其中一個建立的儀表板也能讀取另一個。

### 控制 metric 屬性基數 {#control-metric-attribute-cardinality}

預設情況下，每個 metric 樣本都會標記完整的身分屬性集合，其中包含每個請求的欄位，例如 `hidden_params` 和數個 `metadata.*` 值。這些欄位對每個請求來說幾乎都是唯一的，因此每一個都會倍增您的後端追蹤的 time series 數量（每種不同屬性組合對應一條 series）。在高流量下，這會使 metric cardinality 爆增，而某些後端（例如 Splunk Observability Cloud）會開始節流或丟棄這些 metrics。

v2 讀取的 filter 與 v1 相同，來自您設定中的 `callback_settings.otel.attributes`。請在其中嵌入一個 `attributes` 區塊，並使用 `include_list`（allowlist；只輸出列出的屬性）或 `exclude_list`（denylist；輸出除列出屬性以外的全部內容）。兩者互斥。此 filter 只套用於 metrics；spans 會保留完整的屬性集合，因此 traces 依然豐富，同時 metric cardinality 仍保持在界限內。

此區塊位於 `callback_settings.otel` 底下。當設定了 `LITELLM_OTEL_V2` 時，在 `otel` 中列出 `callbacks` 會建立 v2 logger 並讀取此區塊（只有在該旗標關閉時才會建立舊版 v1 logger）；當沒有列出 `otel` callback 時，預設路徑也會讀取此區塊。

不同於 v1，v2 沒有每個執行個體各自的 `attributes` 欄位，因此這個全域區塊是唯一的來源。v2 也不是在開機時，而是在請求記錄第一個 metric 時才延遲解析 filter，因此不良設定（兩個清單都設了，或使用了被禁止的名稱）會在第一次記錄的請求時才顯現，而編輯清單只有在重新啟動後才會生效。此 filter 只會在預設 OTLP 路徑上讀取（callback 名稱為 `otel` 或未設定）；預設目的地例如 `arize`、`arize_phoenix` 和 `langfuse_otel` 會以完整屬性集合發出其 metrics，與 v1 相同。

```yaml title="config.yaml"
callback_settings:
  otel:
    attributes:
      exclude_list:
        - hidden_params
        - metadata.requester_metadata
        - metadata.requester_ip_address
        - metadata.spend_logs_metadata
        - metadata.mcp_tool_call_metadata
        - metadata.vector_store_request_metadata
        - metadata.prompt_management_metadata
```

當您想要最精簡、最可預測的屬性集合時，請使用 `include_list` 精確列出要保留的屬性。未列出的內容都會從 metrics 中移除：

```yaml title="config.yaml"
callback_settings:
  otel:
    attributes:
      include_list:
        - gen_ai.operation.name
        - gen_ai.system
        - gen_ai.request.model
        - gen_ai.framework
        - metadata.user_api_key_team_id
        - metadata.user_api_key_org_id
```

`gen_ai.token.type` 絕不會被過濾掉。它是在 filter 執行後標記到 `gen_ai.client.token.usage` 上，因此輸入/輸出拆分會保留，不受您設定的清單影響，而在 `include_list` 或 `exclude_list` 中提及它都會被拒絕。

## 追蹤哪些路由 {#which-routes-are-traced}

高頻率、非 LLM 路由**預設會排除**，以免它們淹沒您的 traces：健康檢查（`/health*`）、Prometheus scrape（`/metrics`），以及靜態 UI/文件資產（`/ui`、`/docs`、`/redoc`、`/_next`、`/openapi.json`、favicon，…）。

若要變更此集合，請使用標準的 OpenTelemetry 環境變數（以逗號分隔的 paths、以子字串比對）：

```shell
# Trace everything, including health checks
OTEL_PYTHON_FASTAPI_EXCLUDED_URLS=""

# Exclude only your own custom paths
OTEL_PYTHON_FASTAPI_EXCLUDED_URLS="/health,/internal"
```

## 每個金鑰 / 每個團隊的憑證（多租戶） {#per-key--per-team-credentials-multi-tenant}

一個 proxy 可以服務多個租戶：團隊或虛擬 key 會帶有自己的後端憑證，因此它的 traces 會送到該租戶自己的 Langfuse 專案、Arize 空間、Weave 專案、New Relic 帳戶或 SigNoz 帳戶，而不是 proxy 全域的那一個。憑證來自 proxy 在認證時解析出的 key 與 team，絕不來自 request body，因此呼叫端無法選擇其他租戶的後端。

這與 [依 Team/Key 的 logging](../proxy/team_logging) 中說明的相同 key/team callback 機制；v2 只是將其套用到 OTel 預設設定。沒有另外的管理員擁有的「destination」物件，而 `/credentials` 儲存的是 LLM provider 憑證，不是 logging 憑證。

### 哪些預設支援每次請求的憑證 {#which-presets-support-per-request-credentials}

| 預設設定 | Callback | key 或 team 上的欄位 | 每個租戶會變動的內容 |
|---|---|---|---|
| Langfuse | `langfuse_otel` | `langfuse_public_key`、`langfuse_secret_key`、`langfuse_host` | Langfuse 專案 traces 送達的位置，以及它們傳送到的伺服器 |
| Arize AX | `arize` | `arize_space_id`（或已棄用的 `arize_space_key`）、`arize_api_key` | Arize 空間 |
| Weave (W&B) | `weave_otel` | `wandb_api_key`、`weave_project_id` | W&B 帳戶與 Weave 專案 |
| New Relic | `newrelic` | `newrelic_api_key`、`newrelic_region`（`us` 或 `eu`，預設 `us`） | New Relic 帳戶及其資料中心 |
| SigNoz | `signoz` | `signoz_ingestion_key`、`signoz_ingestion_endpoint` | SigNoz 帳戶，以及選用的 SigNoz Cloud 區域或其傳送到的自架 collector |

其他所有預設設定（`arize_phoenix`、`langtrace`、`levo`、`agentops`）以及純粹的 `otel` OTLP exporter 都沒有每個請求的憑證，因此它們一律會以 proxy 全域設定輸出。對於 Phoenix，請改以專案而不是後端來區分租戶，並在團隊或 key 上設定 [`phoenix_project_name`](./phoenix_integration#route-traces-to-a-phoenix-project-per-team-or-key)。若要維持單一後端，但用租戶自己的 `service.name` 標記其 spans，請改在 key 或 team 的 `metadata` 中設定 `otel_service_name`。

### 在團隊上設定 {#set-it-on-a-team}

請在 team 上註冊 callback；該 team 上的每個 key 之後都會以這些憑證輸出：

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "langfuse_otel",
    "callback_type": "success",
    "callback_vars": {
      "langfuse_public_key": "pk-lf-...",
      "langfuse_secret_key": "sk-lf-..."
    }
  }'
```

`GET /team/<team-id>/callback` 會讀回 team 已註冊的內容，`DELETE /team/<team-id>/callback/<callback_name>` 會移除一個整合，而 `POST /team/<team-id>/disable_logging` 會移除全部整合。

### 在金鑰上設定 {#set-it-on-a-key}

一個金鑰可以在 `metadata.logging` 中攜帶自己的憑證，包括沒有團隊的金鑰：

```shell
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "logging": [{
        "callback_name": "arize",
        "callback_type": "success",
        "callback_vars": {"arize_space_id": "...", "arize_api_key": "..."}
      }]
    }
  }'
```

既有金鑰在 `/key/update` 上使用相同的欄位。您也可以在 Admin UI 中，於團隊或金鑰的記錄設定裡填入這兩者。

### 租戶會收到什麼 {#what-the-tenant-receives}

為自己的後端命名的金鑰或團隊，會在單一根節點下收到**整個追蹤**：HTTP 請求、驗證步驟、帶有 token 與成本的模型呼叫，以及支出寫入。以前，它只會收到一個零散的 span，周圍沒有請求。

您針對同一後端的自有 exporter 將不再收到那些請求。如果某個團隊將 `langfuse_otel` 指向自己的專案，您的 Langfuse 專案就不會留下該團隊的任何內容；其他後端上的 exporter，例如一般的 `otel` collector，仍然會收到全部內容。

該租戶的副本會移除您這一側的請求內容：proxy 的資料庫端點、例外文字與堆疊追蹤、無法連線的 guardrail 錯誤，以及任何 URL 上的查詢字串。

如果該租戶的後端無法連線，其 spans 不會重新路由到您的 exporters。此覆寫的目的，是讓您停止保留該團隊的流量。

### 也保留您自己的副本 {#keep-your-own-copy-as-well}

將模式切換為 `additive`，您的 exporter 也會保留每個請求，因此整體組織視圖仍然完整：

```yaml
litellm_settings:
  otel_tenant_destination_mode: additive   # default: "override"
```

`LITELLM_OTEL_TENANT_DESTINATION_MODE=additive` 也一樣。當某個團隊碰巧指定了您已經有輸出的專案時，該請求只會寫入一次，而不是兩次。

### 將租戶傳送到其自己的 Langfuse 主機 {#send-a-tenant-to-its-own-langfuse-host}

金鑰或團隊上的 `langfuse_host` 會將該租戶的 traces 移到他們自己的 Langfuse 伺服器。請與其所屬的金鑰組一起傳入，因為單獨的主機會被忽略。也要將該主機加入 allowlist，否則 proxy 會記錄警告，並將請求保留在您的 exporters 上：

```yaml
litellm_settings:
  provider_url_destination_allowed_hosts: ["langfuse.acme.com"]
```

您自己的 `LANGFUSE_HOST` 不需要 allowlist 項目。SigNoz 的運作方式相同：金鑰或團隊上的 `signoz_ingestion_endpoint`，連同 `signoz_ingestion_key` 一起傳入，會將該租戶的 traces 移到其自己的 SigNoz Cloud 區域或 collector，而其主機必須加入 allowlist；沒有金鑰或不在 allowlist 上的端點會被忽略並附帶警告。請參閱 [SigNoz per-team routing](./signoz#per-team-and-per-key-routing)。其他預設會從 proxy 的環境取得其端點；每個租戶只會變動憑證，另外還有 New Relic 的區域，則從固定的 us/eu 對照表中選取。

### 只將模型呼叫傳送到 Langfuse {#send-only-the-model-calls-to-langfuse}

預設情況下，Langfuse 專案，不論是您的還是租戶的，都會接收整個請求樹：HTTP 請求根節點、驗證步驟、資料庫與快取查詢、每一次 guardrail 執行、MCP 工具呼叫、模型呼叫，以及支出寫入。如果您只想讓 generations 出現在 Langfuse 中，請將 scope 設為 `llm_only`。proxy 會保留模型呼叫 spans，並停止將該請求的其他所有 span 傳送到該 Langfuse 專案。模型呼叫 span 是 proxy 代表呼叫端為每個提供者呼叫所發出的 span，無論路由為何：chat 與 text completions、Responses API 呼叫、embeddings、image、audio 與 OCR 生成、moderation、vector store 呼叫以及 agent 訊息都算在內。它們是攜帶 `gen_ai.operation.name` 的 spans，但不包含 MCP 工具呼叫。generation 會保留其 trace id，因此 Langfuse 仍會將一個請求的 generations 歸在同一個 trace 下，並保留呼叫端的 `langfuse.trace.name`、`user.id`、`session.id` 與 `langfuse.trace.tags`。由於請求根節點不再被傳送，該 Langfuse 專案會將 generation 作為 trace 的根節點，而當呼叫端未設定 `langfuse_trace_name` 或 `metadata.trace_name` 時，該 trace 會採用 generation 自己的名稱，例如 `chat claude-3-5-haiku`，而不是顯示為未命名。只有該專案中的 span 副本會被變更；`full` 專案或接收相同請求的一般 collector 仍會在請求 span 下看到 generation。當租戶的 `full` 專案與您自己的 `llm_only` exporter 屬於同一個 Langfuse 帳戶時，該帳戶會只接收整棵樹一次，而 generation 仍會保留在請求 span 下原本的位置

團隊或金鑰會在其 `langfuse_otel` 回呼中，將其設為與憑證並列：

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "langfuse_otel",
    "callback_type": "success",
    "callback_vars": {
      "langfuse_public_key": "pk-lf-...",
      "langfuse_secret_key": "sk-lf-...",
      "langfuse_span_scope": "llm_only"
    }
  }'
```

Admin UI 會將相同欄位顯示為在團隊或金鑰的 Langfuse OTEL 憑證旁，於 `langfuse span scope` 與 `full` 之間的 `llm_only` 選擇

您自己的 Langfuse exporter 在 proxy 環境中有一個獨立開關：

```shell
LITELLM_OTEL_LANGFUSE_SPAN_SCOPE=llm_only   # default: full
```

這兩者彼此獨立。租戶的 `llm_only` 只會縮小該租戶的專案，而操作員設定只會縮小由 `LANGFUSE_PUBLIC_KEY` 與 `LANGFUSE_SECRET_KEY` 建立的 exporter，無論 `otel_tenant_destination_mode` 處於哪種模式。兩者都不會影響一般的 `otel` collector 或任何其他預設，因此同一請求在 Datadog 或 Grafana 中的視圖仍然完整。可接受的值是 `full` 與 `llm_only`，而金鑰或團隊回呼中的任何其他值在儲存時都會被拒絕。此設定僅適用於 `langfuse_otel` 預設：在舊版 `langfuse_span_scope` 回呼或其他後端的回呼上儲存 `langfuse` 也會被拒絕，因為那裡沒有任何東西會讀取它

guardrail 與 MCP spans 會在 `llm_only` 下被捨棄，因此在任何模型被呼叫之前就失敗的 guardrail block，不會在該 Langfuse 專案中留下任何內容。當您依賴 Langfuse 觀察那些內容時，請保留 `full`

### 將 Redis 和 Postgres span 排除在租戶追蹤之外 {#keep-redis-and-postgres-spans-out-of-tenant-traces}

一次請求也會產生 proxy 自身資料存放區工作的 spans：用於 auth 與 response 快取的 Redis 查詢，以及 Postgres 的支出寫入。將 traces 傳送到自己帳戶的金鑰或團隊也會收到這些內容。設定 `excluded_services` 可停止將它們轉送到金鑰與團隊目的地，同時請求根節點、驗證、guardrail 與模型呼叫 spans 仍會通過：

```yaml
callback_settings:
  otel:
    excluded_services: ["redis", "postgres"]
```

或者在 proxy 環境中：

```shell
LITELLM_OTEL_EXCLUDED_SERVICES=redis,postgres
```

當兩者都設定時，以設定值為準。可接受的名稱是 `redis` 與 `postgres`（`postgresql` 也適用），不論如何皆然。當某個 span 的 `db.system.name`，或舊版的 `db.system`，屬於列出的系統之一時，就會被捨棄。像 `auth` 這類未知名稱會被記錄為錯誤並忽略；其旁邊有效的名稱仍然適用，而 proxy 會正常啟動。若兩者都未設定，則不會捨棄任何內容

此設定只會縮小金鑰與團隊目的地，意即在團隊或金鑰上設定的 `langfuse_otel`、`arize`、`weave_otel` 或 `newrelic` 回呼，如同 [在團隊上設定](#set-it-on-a-team) 中所示，無論是透過 API 或 Admin UI 中團隊的記錄設定。租戶不需要任何新設定。您的自有 exporters、`otel` collector，以及 `litellm_settings.callbacks` 中列出的任何預設（包括 proxy 全域的 `langfuse_otel`），都會繼續接收每個 span。沒有 `excluded_services` 的 Admin UI 欄位，因為它是 proxy 全域設定

`langfuse_span_scope: llm_only` 已經會捨棄這些 Langfuse 專案的 spans，連同請求根節點、驗證與 guardrail spans 一起捨棄。當租戶應保留請求樹的其餘部分時，請使用 `excluded_services`

### 須知 {#good-to-know}

金鑰會完全優先於團隊。如果金鑰有任何 `metadata.logging` 項目，團隊的回呼根本不會被考慮，而不是與金鑰的設定合併，因此覆寫某個後端的金鑰，必須重新列出它仍然想要的其他後端。

憑證只會套用到其所屬預設所貢獻的 exporter。攜帶某個租戶 Arize 金鑰的請求，絕不會改寫同時配置的 Langfuse 或自架 collector exporter 的標頭，因此租戶的金鑰不會洩漏到不應使用的後端。租戶未指定的後端上的 exporters 仍然會收到該請求的 spans，並使用它們自己的 proxy 全域憑證。

proxy 會針對每組不同的憑證快取一個 tracer provider，最多同時 256 個，並在汰除時 flush 最近最少使用的那一個。租戶變動的成本是 exporter 重新建立，而不是遺失 span。

`os.environ/...` 參照在金鑰與團隊 `callback_vars` 中會被拒絕；請傳入已解析的值。欄位名稱必須是已知的 callback 參數，而未知名稱會使整個項目失敗。

此 routing 僅適用於 traces。GenAI 用戶端指標（請參閱 [指標](#metrics)）一律會送往 proxy 全域 exporter。

## 分散式追蹤 {#distributed-tracing}

如果傳入的請求帶有 W3C `traceparent` 標頭，LiteLLM 會延續該追蹤，而不是建立新的追蹤。接著，您的 LiteLLM span 就會以內嵌方式顯示在應用程式既有的分散式追蹤中，因此您可以在同一個檢視中追蹤請求從應用程式、經過 proxy，到 LLM 提供者的完整流程。

## 組態參考 {#configuration-reference}

所有值皆為環境變數。布林旗標接受 `true`/`false`。

| 變數 | 預設值 | 用途 |
|---|---|---|
| `LITELLM_OTEL_V2` | `false` | **總開關。** 在此項目設為 `true` 之前，OTel v2 不會執行任何動作。 |
| `LITELLM_OTEL_TENANT_DESTINATION_MODE` | `override` | `additive` 會保留您自己的 exporter 對於某個 key 或 team 路由到其自身帳戶之請求的副本。 |
| `LITELLM_OTEL_LANGFUSE_SPAN_SCOPE` | `full` | `llm_only` 只會將模型呼叫 span 傳送到您自己的 Langfuse exporter。租戶會透過在 key 或 team 上設定 `langfuse_span_scope` 來設定自己的值。請參閱[只將模型呼叫傳送到 Langfuse](#send-only-the-model-calls-to-langfuse)。 |
| `LITELLM_OTEL_EXCLUDED_SERVICES` | none | 以逗號分隔的 datastores、`redis` 與 `postgres`，其 span 不會轉送到 key 和 team 目的地。`callback_settings.otel.excluded_services` 會覆寫此設定。請參閱[將 Redis 和 Postgres spans 排除在租戶追蹤之外](#keep-redis-and-postgres-spans-out-of-tenant-traces)。 |
| `OTEL_EXPORTER` (alias `OTEL_EXPORTER_OTLP_PROTOCOL`) | `console` | exporter 類型：`console`、`otlp_http`、`otlp_grpc`。 |
| `OTEL_ENDPOINT` (alias `OTEL_EXPORTER_OTLP_ENDPOINT`) | none | OTLP collector URL。設定 endpoint 即表示 `otlp_http`，除非您覆寫 `OTEL_EXPORTER`。 |
| `OTEL_HEADERS` (alias `OTEL_EXPORTER_OTLP_HEADERS`) | none | 提供給後端的以逗號分隔 `key=value` 驗證標頭。 |
| `OTEL_SERVICE_NAME` | `litellm` | 顯示在後端中的 `service.name` 資源屬性。 |
| `OTEL_ENVIRONMENT_NAME` | none | `deployment.environment` 資源屬性（例如 `production`）。 |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `no_content` | 提示詞/回應擷取：`no_content`、`span_only`、`event_only`、`span_and_event`。 |
| `OTEL_PYTHON_FASTAPI_EXCLUDED_URLS` | health/metrics/UI routes | 要從追蹤中排除的以逗號分隔路徑（子字串比對）。設為 `""` 可追蹤所有內容。 |
| `LITELLM_OTEL_INTEGRATION_ENABLE_METRICS` | `false` | 也發出 GenAI client 指標（持續時間、token 用量、成本、串流計時）。請參閱[指標](#metrics)。 |
| `LITELLM_OTEL_LEGACY_COMPAT` | `true` | 也發出舊版 Traceloop 金鑰名稱下的屬性。請參閱[屬性慣例](#attribute-conventions)。 |

每一種 span 類型上的完整金鑰集合請參閱[Span 屬性](#span-attributes)。

## 疑難排解 {#troubleshooting}

**沒有看到任何 traces 嗎？**

1. 確認 `LITELLM_OTEL_V2=true` 已在 proxy 的環境中設定。
2. 先嘗試 `OTEL_EXPORTER="console"`。如果 span 印出到 stdout，問題就在您的 exporter endpoint/標頭，而不是 LiteLLM。
3. 請確認您有觸發 LLM 路由（例如 `/v1/chat/completions`）。健康檢查與 UI 路由預設會被排除。
4. 確認已安裝 `opentelemetry-instrumentation-fastapi`（請參閱需求）。

**只看到 LLM 呼叫，但沒有 `auth`/`postgres`/server span？** 這些 server 與 DB span 需要 FastAPI instrumentation 套件，因此請安裝 `opentelemetry-instrumentation-fastapi`。

**我看到 metadata，但沒有 prompts/responses。** 這是預設行為。設定 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=span_only` 即可擷取內容。

## 支援 {#support}

如有問題，請在 [BerriAI/litellm](https://github.com/BerriAI/litellm/issues) 開啟 issue。
