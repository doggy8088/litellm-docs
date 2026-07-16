import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenTelemetry v2 {#opentelemetry-v2}

OpenTelemetry v2（OTel v2）是 LiteLLM Proxy 的下一代追蹤。它為您提供**每個請求一條乾淨的 trace**，完整呈現請求的整個過程——進入的 HTTP 呼叫、驗證、防護欄、LLM 呼叫本身，以及內部資料庫/快取作業——全部巢狀在同一棵樹中。

它遵循標準的 [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)，因此它產生的 trace 可在任何 OTel 後端（Grafana Tempo、Jaeger、Honeycomb、Datadog，⋯）中讀取，並附帶可直接使用的預設設定，適用於常見的 LLM 可觀測性工具（Arize、Phoenix、Langfuse、Weave、Langtrace、Levo、AgentOps）。

:::info 選用功能

OTel v2 預設為**關閉**。在您設定 `LITELLM_OTEL_V2=true` 之前，這裡的任何功能都不會執行。它與現有的 [OpenTelemetry integration](./opentelemetry_integration) 是分開的——請擇一使用。如果您是從 v1 移轉，請參閱 [Migrating to OpenTelemetry v2](./opentelemetry_v2_migration)。

:::

## 您會得到什麼 {#what-you-get}

對您的 proxy 發出單一請求會產生**一條 trace**，如下所示：

```
POST /v1/chat/completions                  ← HTTP request (server span)
├── auth /v1/chat/completions              ← authentication
│   ├── postgres get_key_object            ← DB lookups during auth
│   └── postgres get_team_membership
├── execute_guardrail presidio-pii         ← each guardrail that runs
├── chat gpt-4o                            ← the LLM call (model, tokens, cost)
└── batch_write_to_db                      ← spend/usage written to DB
```

重點：

- **一條 trace，端到端**——HTTP 請求、驗證、防護欄、LLM 呼叫與 DB 寫入都在同一條 trace 中，且正確巢狀。
- **豐富的 GenAI 屬性**——每個 LLM 呼叫 span 都帶有 `gen_ai.*` 屬性：model、provider、token 使用量、成本、完成原因、請求參數等。
- **以標準為基礎**——建立於官方 OpenTelemetry GenAI semantic conventions 之上，因此可與任何相容 OTel 的後端搭配使用。
- **提供者預設設定**——一行設定即可將 trace 傳送到 Arize、Phoenix、Langfuse、Weave、Langtrace、Levo 或 AgentOps，並使用各工具預期的格式。
- **預設安全**——除非您明確選擇啟用，否則不會擷取 prompts 與回應。雜訊路由（健康檢查、metrics 掃描、UI 資產）會自動排除。
- **分散式追蹤**——如果您的用戶端送出 `traceparent` header，LiteLLM 的 spans 會巢狀在您既有的 trace 之內。

## 快速開始 {#getting-started}

在 proxy 環境中設定 `LITELLM_OTEL_V2=true`，然後選擇下方的目的地。

### 1. 將 trace 傳送到任何 OTLP 收集器 {#1-send-traces-to-any-otlp-collector}

此路徑會透過 OTLP（OpenTelemetry Protocol）將 spans 傳送到您已在下方端點執行的收集器或後端；如果您還沒有，請先沿用 [Quickstart](#quickstart) 中的主控台 exporter。請在 proxy 的環境中設定功能旗標以及標準的 `OTEL_*` 環境變數。不需要變更設定。

<Tabs>

<TabItem value="otlp-http" label="OTLP HTTP 收集器">

```shell
LITELLM_OTEL_V2=true
OTEL_EXPORTER="otlp_http"
OTEL_ENDPOINT="http://localhost:4318"
```

</TabItem>

<TabItem value="otlp-grpc" label="OTLP gRPC 收集器">

```shell
LITELLM_OTEL_V2=true
OTEL_EXPORTER="otlp_grpc"
OTEL_ENDPOINT="http://localhost:4317"
```

> gRPC 匯出需要 `grpcio`。請使用 `pip install grpcio` 安裝。

</TabItem>

</Tabs>

透過 `OTEL_HEADERS` 傳入您的後端所需的驗證 headers：

```shell
OTEL_HEADERS="api-key=your-key,x-tenant=acme"
```

然後照常啟動 proxy：

```shell
litellm --config config.yaml
```

發出請求後，您會在後端看到每個請求一條 trace。

### 2. 將 trace 傳送到特定工具（預設設定） {#2-send-traces-to-a-specific-tool-presets}

對於 LLM 可觀測性工具，請使用**預設設定**。預設設定會知道該工具的端點，並以該工具預期的 schema 發出屬性。若要啟用，請將其名稱加入設定中的 `callbacks`，並將該工具的憑證設定為環境變數。

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
ARIZE_PROJECT_NAME="your-project-name"   # required: Arize rejects spans with no project
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

Langtrace 不會直接接受 litellm 的 OTLP spans。它會在自訂路徑（`/api/trace`）上，以 `x-api-key` header 擷取 JSON 編碼的 OTLP，而 litellm v2 則會將 protobuf 傳送到 `/v1/traces`。請在兩者之間執行 OpenTelemetry Collector：litellm 匯出到 collector，collector 再將 spans 重新編碼為 JSON 並轉送到 Langtrace。`langtrace` 回呼仍會套用 Langtrace 的屬性 schema；collector 只負責傳遞。

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

</Tabs>

:::tip 一次傳送到多個後端

若要將相同的 trace 傳送到多個提供者，請在 `callbacks` 中列出每個預設設定，並設定各自的環境變數。例如，Langfuse 與 Arize 一起使用：

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["langfuse_otel", "arize"]
```

每個預設設定都會新增自己的目的地，因此您的 spans 會並行送達所有目的地，且各自使用該工具的原生格式。

:::

### 預設設定參考 {#preset-reference}

每個預設設定都會轉換為單一共用 tracer 上的一個 exporter。表格列出每一項的 callback 名稱（填入 `callbacks`）、其讀取的憑證、傳送目的地、在標準 `gen_ai.*` keys 之外新增的屬性詞彙，以及是否支援每個請求（每個 team/key）憑證。

| 預設設定 | Callback | 必要環境變數 | 選用環境變數 | 目的地 | 詞彙 | 每個請求憑證 |
|---|---|---|---|---|---|---|
| Arize AX | `arize` | `ARIZE_SPACE_ID`（`ARIZE_SPACE_KEY` 已淘汰）、`ARIZE_API_KEY`、`ARIZE_PROJECT_NAME` | `ARIZE_ENDPOINT`（gRPC，預設 `https://otlp.arize.com/v1`）、`ARIZE_HTTP_ENDPOINT`（HTTP） | Arize AX 平台 | OpenInference | 是 |
| Arize Phoenix | `arize_phoenix` | `PHOENIX_API_KEY` | `PHOENIX_COLLECTOR_HTTP_ENDPOINT` 或 `PHOENIX_COLLECTOR_ENDPOINT`（gRPC）、`PHOENIX_PROJECT_NAME` | Phoenix（自架或 Phoenix Cloud） | OpenInference | 否 |
| Langfuse | `langfuse_otel` | `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY` | `LANGFUSE_HOST`（或 `LANGFUSE_OTEL_HOST`；預設 `https://us.cloud.langfuse.com`，EU 為 `https://cloud.langfuse.com`）、`OTEL_IGNORE_CONTEXT_PROPAGATION`（設定 `true` 以捨棄傳入的 `traceparent`） | Langfuse Cloud 或自架 | Langfuse | 是 |
| Weave (W&B) | `weave_otel` | `WANDB_API_KEY`、`WANDB_PROJECT_ID`（`<entity>/<project>`） | `WANDB_HOST`（預設 `https://trace.wandb.ai`） | Weights & Biases Weave | OpenInference + Weave | 是 |
| Langtrace | `langtrace` | 無其專屬項目 | — | Langtrace，透過 OpenTelemetry Collector（Langtrace 僅擷取 JSON OTLP） | Langtrace | 否 |
| Levo | `levo` | `LEVOAI_API_KEY`、`LEVOAI_ORG_ID`、`LEVOAI_WORKSPACE_ID`、`LEVOAI_COLLECTOR_URL` | `LEVOAI_ENV_NAME` | Levo collector | 僅 canonical `gen_ai.*` | 否 |
| AgentOps | `agentops` | `AGENTOPS_API_KEY` | `AGENTOPS_SERVICE_NAME`（預設 `agentops`）、`AGENTOPS_ENVIRONMENT`（預設 `production`） | AgentOps（`https://otlp.agentops.cloud`） | 僅 canonical `gen_ai.*` | 否 |

附註：

- **Arize AX 與 Arize Phoenix** 是同一家公司提供的不同後端。AX（`arize`）是代管平台；Phoenix（`arize_phoenix`）是您自行架設或在 Phoenix Cloud 執行的開源 tracer。它們使用不同的憑證與端點，因此請選擇您實際執行的後端對應的 callback。您也可以同時啟用兩者，將資料傳送到各自的後端。
- **Langtrace** 會在自訂路徑以 JSON-only OTLP 擷取資料，因此 litellm v2（其會將 protobuf 傳送到 `/v1/traces`）無法直接匯出到它。請透過會重新編碼為 JSON 的 OpenTelemetry Collector 進行路由；`langtrace` 預設設定只會將 Langtrace 的屬性 schema 加到您的 spans 上。請參閱上方 Langtrace 分頁中的 collector 設定。
- 詞彙是附加的：每個預設設定的 spans 都會始終帶有標準的 OpenTelemetry `gen_ai.*` 屬性；所列詞彙是疊加在上面，讓目的地工具讀取其原生 schema。

## 查看您的追蹤 {#seeing-your-traces}

一旦後端以其預設設定完成設定，每個請求都會以 `chat <model>` span 的形式顯示在該工具的 UI 中，位於請求根節點之下。下方每個分頁會涵蓋各提供者特有的注意事項（專案對應、端點變體、中繼資料鍵），這些常常是使用者卡關的地方。

<Tabs>

<TabItem value="arize-shot" label="Arize">

#### Arize 呈現的內容 {#what-arize-renders}

開啟您的 Arize 專案；追蹤會顯示在由 `ARIZE_PROJECT_NAME` 命名的專案之下。`openinference` 對應器會把 OpenInference 詞彙標記到 LLM 呼叫 span 上，並同時附上標準的 `gen_ai.*` 鍵，因此 Arize 會讀取其原生 schema，而不會遺漏標準鍵。

#### `openinference` 對應器新增的屬性 {#attributes-added-by-the-openinference-mapper}

| 屬性 | 重述 |
|---|---|
| `openinference.span.kind` | 固定的 `LLM` |
| `llm.model_name`, `llm.provider` | model, provider |
| `llm.token_count.prompt`, `completion`, `total` | usage split |
| `llm.invocation_parameters` | request 參數的 JSON blob |
| `llm.input_messages.{idx}.message.role`, `content` | prompt（內容擷取開啟） |
| `llm.output_messages.{idx}.message.role`, `content` | response（內容擷取開啟） |
| `input.value`, `output.value` | 相同內容的 JSON 陣列（內容擷取開啟） |
| `llm.tools.{idx}.tool.name`, `description`, `json_schema` | tool 定義 |

請參閱完整的 [OpenInference spec](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md) 以取得最終的詞彙定義。

#### 設定注意事項 {#setup-notes}

- `ARIZE_SPACE_KEY` 是 `ARIZE_SPACE_ID` 的已棄用名稱；該預設值仍會為了向後相容而讀取它，但在新設定中請優先使用 `ARIZE_SPACE_ID`。

![LiteLLM 在 Arize 中的追蹤](/img/observability/otel_v2_arize.png)

</TabItem>

<TabItem value="phoenix-shot" label="Arize Phoenix">

#### Phoenix 呈現的內容 {#what-phoenix-renders}

開啟 Phoenix；專案來自 `PHOENIX_PROJECT_NAME`（預設 `default`），並標記為 `openinference.project.name` 資源屬性。Phoenix 使用與 Arize AX 相同的 OpenInference 詞彙。

#### `openinference` 對應器新增的屬性 {#attributes-added-by-the-openinference-mapper-1}

與上方 Arize 分頁相同。

#### 設定注意事項 {#setup-notes-1}

Phoenix 有不只一種 collector endpoint 形式，而選錯是最常見的 Phoenix 設定錯誤。將 `PHOENIX_COLLECTOR_HTTP_ENDPOINT`（或用於 gRPC 的 `PHOENIX_COLLECTOR_ENDPOINT`）指向與您的部署相符的形式：

| 部署 | 端點 |
|---|---|
| Phoenix Cloud（Spaces） | `https://app.phoenix.arize.com/s/<space-name>/v1/traces` |
| Phoenix Cloud（舊版） | `https://app.phoenix.arize.com/legacy/v1/traces` |
| Phoenix Cloud（更舊版） | `https://app.phoenix.arize.com/v1/traces` |
| 自架 | `http://localhost:6006/v1/traces` |

![LiteLLM 在 Phoenix 中的追蹤](/img/observability/otel_v2_phoenix.png)

</TabItem>

<TabItem value="langfuse-shot" label="Langfuse">

#### Langfuse 呈現的內容 {#what-langfuse-renders}

開啟 Langfuse traces 檢視；LLM 呼叫 span 會顯示為 Langfuse **generation**，可依 team 篩選。端點解析順序為 `LANGFUSE_OTEL_HOST`、接著 `LANGFUSE_HOST`、接著美國雲端預設值；若是自架主機，則會附加 `/api/public/otel`。

#### `langfuse` 對應器新增的屬性 {#attributes-added-by-the-langfuse-mapper}

| 屬性 | 用途 |
|---|---|
| `langfuse.observation.type` | 固定的 `generation`，因此此 span 會顯示為 model call |
| `langfuse.observation.model.name` | generation 上顯示的 model |
| `langfuse.observation.model.parameters` | request 參數的 JSON（temperature、top_p、max_tokens、penalties、seed） |
| `langfuse.observation.id` | 與 `litellm.call_id` 相同 |
| `langfuse.observation.input` / `output` | prompt 與 response 主體（內容擷取開啟） |
| `langfuse.observation.usage_details` | 輸入／輸出／總 token 數 |
| `langfuse.observation.cost_details` | 總成本 |
| `langfuse.trace.metadata.team_id`, `team_alias` | 可篩選的 team 身分 |

這些由預設值根據 request 與 response 設定，而不是來自用戶端提供的 metadata dict，因此您不需要額外設定就能取得它們。

#### 設定注意事項 {#setup-notes-2}

- 驗證方式為 HTTP Basic，`Authorization: Basic <base64(public_key:secret_key)>`；預設值會根據 `LANGFUSE_PUBLIC_KEY` 與 `LANGFUSE_SECRET_KEY` 建立，因此您不需要直接設定標頭。
- 如果您的用戶端已經送出 W3C `traceparent`，而 Langfuse 擷取到錯誤的 parent，請在 proxy 環境中設定 `OTEL_IGNORE_CONTEXT_PROPAGATION=true` 以捨棄傳入的 context。
- 這是 Langfuse 風格的路徑；若是通用的 OTel 後端，請改用 [generic OTLP setup](#1-send-traces-to-any-otlp-collector)。

![LiteLLM 在 Langfuse 中的追蹤](/img/observability/otel_v2_langfuse.png)

</TabItem>

<TabItem value="weave-shot" label="Weave (W&B)">

#### Weave 呈現的內容 {#what-weave-renders}

開啟位於 `wandb.ai/<entity>/weave` 的 Weave 專案。Weave 會接收 OpenInference 以及一個小型 Weave overlay，因此 `weave_otel` 預設值會在同一個 span 上組合兩種對應器。

#### `weave` 對應器新增的屬性 {#attributes-added-by-the-weave-mapper}

`openinference` 對應器（見 Arize 分頁）會先執行，接著 `weave` 對應器會新增：

| 屬性 | 用途 |
|---|---|
| `weave.display_name` | `"{operation} {model}"`（例如 `chat gpt-4o`） |
| `weave.call_id` | 與 `litellm.call_id` 相同 |
| `weave.output` | choices 的 JSON 陣列（內容擷取開啟） |

#### 設定注意事項 {#setup-notes-3}

- `WANDB_PROJECT_ID` 必須是 `entity/project` 形式，這是最常見的設定錯誤。
- `weave_otel` 預設值是基於 OTel 的 Weave 整合，與較舊的 `wandb` success-callback 記錄器無關（後者使用 `wandb` Python 套件並直接寫入 W&B，而不是透過 OTel）；如果您在找的是那個，請參閱 [W&B legacy page](./wandb_integration)。

![LiteLLM 在 Weave 中的追蹤](/img/observability/otel_v2_weave.png)

</TabItem>

<TabItem value="agentops-shot" label="AgentOps">

#### AgentOps 呈現的內容 {#what-agentops-renders}

開啟 AgentOps 儀表板。AgentOps 不會新增提供者對應器，因此 spans 會以標準的 `gen_ai.*` schema 抵達（若已啟用，另加 `legacy`）。

#### AgentOps 預設值新增的屬性 {#attributes-added-by-the-agentops-preset}

不會新增提供者對應器，因此 LLM 呼叫 span 只會帶有 [Span attributes](#span-attributes) 中列出的標準鍵。預設值會控制追蹤上的兩個資源層級標籤：

| 屬性 | 用途 |
|---|---|
| `service.name` | 來自 `AGENTOPS_SERVICE_NAME`（預設 `agentops`） |
| `deployment.environment` | 來自 `AGENTOPS_ENVIRONMENT`（預設 `production`） |

#### 設定注意事項 {#setup-notes-4}

- AgentOps 會在第一次 span 匯出時才建立驗證 token，而不是在啟動時，因此第一次匯出看起來可能會短暫延遲；這種情況每個 process 只會發生一次，屬於預期行為。
- 如果您想在 AgentOps UI 中區分環境，請設定 `AGENTOPS_SERVICE_NAME` / `AGENTOPS_ENVIRONMENT`。

![LiteLLM 在 AgentOps 中的追蹤](/img/observability/otel_v2_agentops.png)

</TabItem>

<TabItem value="langtrace-shot" label="Langtrace">

#### Langtrace 呈現的內容 {#what-langtrace-renders}

開啟 Langtrace UI；spans 會透過您的 OpenTelemetry Collector 流動，並帶有 `langtrace.*` 與 `llm.*` 鍵。

#### `langtrace` 對應器新增的屬性 {#attributes-added-by-the-langtrace-mapper}

| 屬性 | 重述 |
|---|---|
| `langtrace.service.name` | provider |
| `llm.model`, `gen_ai.response.model`, `gen_ai.response_id`, `gen_ai.system_fingerprint` | request／response 識別碼 |
| `llm.temperature`, `top_p`, `top_k`, `max_tokens`, `frequency_penalty`, `presence_penalty` | request 參數 |
| `llm.stream` | streaming 標記 |
| `llm.token.counts.prompt`, `completion`, `total` | usage split |
| `llm.prompts`, `llm.completions` | JSON 陣列（內容擷取開啟） |

#### 設定注意事項 {#setup-notes-5}

Langtrace 會在自訂路徑攝取僅 JSON 的 OTLP，因此 litellm 會透過 OpenTelemetry Collector 匯出，並重新編碼為 JSON。請參閱 [Getting started 下的 Langtrace 分頁](#2-send-traces-to-a-specific-tool-presets) 以了解 collector 設定。

![LiteLLM 在 Langtrace 中的追蹤](/img/observability/otel_v2_langtrace.png)

</TabItem>

<TabItem value="levo-shot" label="Levo">

#### Levo 顯示的內容 {#what-levo-renders}

開啟 Levo 儀表板。Levo 不會新增提供者對應器，因此 spans 會以標準的 `gen_ai.*` 結構描述到達（若已啟用，則另含 `legacy`）。

#### Levo 預設值新增的屬性 {#attributes-added-by-the-levo-preset}

不會新增提供者對應器。追蹤僅帶有 [Span attributes](#span-attributes) 中的標準鍵。此預設會將 spans 路由至 `LEVOAI_COLLECTOR_URL`，並使用 `Authorization: Bearer $LEVOAI_API_KEY`，另外還有由 `LEVOAI_ORG_ID` 和 `LEVOAI_WORKSPACE_ID` 建立的 `x-levo-organization-id` 與 `x-levo-workspace-id` 標頭。

#### 設定注意事項 {#setup-notes-6}

- collector URL 會原樣使用，不會處理路徑，因此請提供 Levo 給您的精確 URL。
- `LEVOAI_ENV_NAME` 為選用項目，會在 Levo UI 中以環境標籤為 spans 加上標記。

</TabItem>

<TabItem value="generic-shot" label="Generic OTLP">

#### 通用 OTLP 後端會顯示什麼內容 {#what-a-generic-otlp-backend-renders}

您的後端 UI 對標準 OTel GenAI spans 顯示的任何內容。`generic` 預設（以及 [Getting started 第 1 節](#1-send-traces-to-any-otlp-collector) 中純環境變數的 OTLP 路徑）不會新增提供者對應器。

#### 新增的屬性 {#attributes-added}

除了 [Span attributes](#span-attributes) 中列出的標準 `gen_ai.*` 和 `litellm.*` 鍵之外沒有其他內容，另外如果 `LITELLM_OTEL_LEGACY_COMPAT=true`，則會再加上 `legacy` Traceloop 鍵。

#### 設定注意事項 {#setup-notes-7}

此路徑適用於 Jaeger、Grafana Tempo、Honeycomb、Datadog、SigNoz、Splunk Observability Cloud，以及任何其他使用標準 OTLP 的後端。如果上述未列出某個後端，且沒有專用分頁，請使用這個。

</TabItem>

</Tabs>

## 擷取 prompts 與 responses {#capturing-prompts--responses}

預設情況下，OTel v2 只會記錄 **中繼資料**（模型、tokens、成本、時間），且**絕不**會將 prompt 或 response 文字寫入您的追蹤。這是刻意設計的——可避免敏感內容進入您的可觀測性後端。

若要擷取訊息內容，請明確啟用：

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

此開關由中央強制執行，因此會同時套用至**所有**後端——在停用擷取時，使用者請求絕不可能強迫將其 prompt 送入您的後端。

## Span 屬性 {#span-attributes}

屬性來自依序套用到每個 span 上的一串對應器。標準的 `genai` 對應器一定會先套用，`legacy` 相容性對應器預設為開啟，且每個預設都會在上層再加上一個提供者對應器。後面的對應器可以覆寫前面的值；因此同一個 span 會同時帶有多組描述相同呼叫的詞彙。

前兩個表格涵蓋 LLM 呼叫 span 的標準詞彙。下方章節列出其他 span 類型，接著說明各提供者對應器新增的內容。

### LLM 呼叫 span，標準 `gen_ai.*` + `litellm.*` {#llm-call-span-canonical-gen_ai--litellm}

請求端鍵值：

| 屬性 | 設定時機 |
|---|---|
| `gen_ai.operation.name` | 永遠（`chat`、`text_completion`、`embeddings`） |
| `gen_ai.provider.name` | 永遠 |
| `gen_ai.request.model` | 永遠（面向使用者的模型群組名稱） |
| `gen_ai.request.temperature`, `top_p`, `top_k`, `max_tokens` | 在請求上設定時 |
| `gen_ai.request.frequency_penalty`, `presence_penalty`, `seed` | 設定時 |
| `gen_ai.request.stop_sequences` | 設定時（字串陣列） |
| `gen_ai.tool.{idx}.name`, `description`, `parameters` | 每個工具定義一組 |
| `server.address`, `server.port` | 當提供者端點已知時 |

回應、用量、成本、識別資訊：

| 屬性 | 設定時機 |
|---|---|
| `gen_ai.response.id`, `gen_ai.response.model` | 成功時 |
| `gen_ai.response.finish_reasons` | 成功時（字串陣列） |
| `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | 成功時 |
| `gen_ai.input.messages`, `gen_ai.output.messages` | 開啟內容擷取時 |
| `gen_ai.system_instructions` | 開啟內容擷取時，且存在系統提示時 |
| `litellm.call_id` | 永遠 |
| `litellm.provider.model` | 永遠（實際送往提供者的模型字串） |
| `litellm.request.streaming` | 當為 true 時 |
| `litellm.cost.total` | 成功時 |
| `litellm.cost.input`, `output`, `cache_read`, `cache_creation`, `tool_usage` | 來源回報細目時 |
| `litellm.cost.original`, `discount_amount`, `discount_percent`, `margin_fixed_amount`, `margin_percent`, `margin_total_amount` | 回報時 |

狀態與錯誤：

- **失敗時：** span 會記錄標準的 `exception` 事件（`exception.type`、`exception.message`），根據例外類別設定 `error.type`，並將其狀態設為 `ERROR`。
- **成功時：** 狀態保持為 `UNSET`（semconv 預設值，與 FastAPI server span 相符）。只有真正的錯誤才會設為 `ERROR`，因此不要以 `OK` 的狀態作為警示依據。

### 其他 span 類型 {#other-span-kinds}

**Guardrail span** — 使用 `litellm.guardrail.*` 命名空間：`name`、`mode`、`status`、`provider`、`action`、`response`、`violation_categories`、`confidence_score`、`risk_score`、`masked_entity_count`、`duration`、`id`、`policy_template`、`detection_method`。`status` 是 `success`、`guardrail_intervened`、`guardrail_failed_to_respond` 或 `not_run` 之一；阻擋性的 `guardrail_intervened` 或 `guardrail_failed_to_respond` 也會將 span 狀態設為 `ERROR`。

**Datastore span**（redis、postgres）— `db.system.name`、`db.operation.name`、`litellm.service.name`、`litellm.service.call_type`。

**內部服務 span** — 僅使用 `litellm.service.*` 鍵（不含 `db.*`）。

**MCP tool-call span** — `gen_ai.operation.name=execute_tool`、`mcp.method.name`、`mcp.session.id`、`gen_ai.tool.name`、`litellm.mcp.server.name`、`litellm.call_id`、`litellm.cost.total`。`gen_ai.tool.call.arguments` 和 `gen_ai.tool.call.result` 受與 prompt 內容相同的內容擷取設定所控管。

**Root HTTP server span** — HTTP semconv 鍵 `http.request.method`、`http.route`、`http.response.status_code`、`url.path`，由 FastAPI instrumentation 加上（而非 LiteLLM 的任何對應器）。

每個提供者預設值也會在這些標準鍵之上組合一個提供者專屬對應器，因此目的地會以其原生結構描述讀取追蹤。這些各提供者表格位於對應的 [Seeing your traces](#seeing-your-traces) 分頁下。

## 屬性慣例 {#attribute-conventions}

LiteLLM 會輸出一組標準的 GenAI 屬性，並透過新增對應器在其上疊加其他詞彙；啟用中的集合由 `mapper_names` 控制，而 `genai` 一律最先套用。`legacy` 對應器預設為開啟（`LITELLM_OTEL_LEGACY_COMPAT=true`），並會以較舊的 semconv-ai / Traceloop 名稱重新輸出相同資料，因此以這些名稱建立的儀表板在遷移期間仍可正常運作。當您的查詢已使用標準鍵後，可透過 `LITELLM_OTEL_LEGACY_COMPAT=false` 將其關閉。提供者對應器（`openinference`、`langfuse`、`weave`、`langtrace`）由各自的預設值加入，且永遠不會取代標準鍵。

最常見的鍵值在不同詞彙中的對應如下：

| Canonical (`genai`) | 舊版（Traceloop） | OpenInference |
|---|---|---|
| `gen_ai.usage.input_tokens` | `gen_ai.usage.prompt_tokens` | `llm.token_count.prompt` |
| `gen_ai.usage.output_tokens` | `gen_ai.usage.completion_tokens` | `llm.token_count.completion` |
| `gen_ai.provider.name` | `gen_ai.system` | `llm.provider` |
| `litellm.request.streaming` | `llm.is_streaming` | 不適用 |
| `gen_ai.request.model` | 不適用 | `llm.model_name` |

## 每個 span 上的請求身分 {#request-identity-on-every-span}

LiteLLM 會在驗證邊界將一小組請求身分值寫入標準 OpenTelemetry [Baggage](https://opentelemetry.io/docs/specs/otel/baggage/)。接著，自訂 span processor 會把這些值複製到 trace 中的每個 span，因此 guardrail、datastore 或 service span 可以依團隊或金鑰進行篩選，而不必由 LiteLLM 逐一手動重新標記。

預設情況下，以下鍵會寫入每個 span：

| 鍵 | 值 |
|---|---|
| `litellm.team.id` | Team UUID |
| `litellm.team.alias` | Team 顯示名稱 |
| `litellm.team.metadata` | Team 的自由格式 metadata，會篩選為您 allowlist 中允許的子鍵 |
| `litellm.api_key.hash` | 呼叫者虛擬金鑰的雜湊值 |
| `gen_ai.request.model` | 面向使用者的 model group 名稱 |
| `litellm.provider.model` | 在提供者上派送的 model |

另一組 request-metadata 欄位會寫入 `litellm.metadata.*` 命名空間下。預設值：

`litellm.metadata.user_api_key_org_id`、`litellm.metadata.user_api_key_user_id`、`litellm.metadata.user_api_key_alias`、`litellm.metadata.user_api_key_end_user_id`、`litellm.metadata.requester_ip_address`。

有兩個預設值在隱私上保持保守。end-user id 可提升，但在頂層預設為關閉（它可識別個人）；它會出現在 `litellm.metadata.user_api_key_end_user_id` 下，按使用者篩選的呼叫者應啟用此項。Team 的自由格式 metadata 絕不會整體輸出；只有您 allowlist 的子鍵會離開程序，而且 allowlist 預設為空。

可透過 `LITELLM_OTEL_BAGGAGE_PROMOTED_KEYS`、`LITELLM_OTEL_BAGGAGE_METADATA_KEYS`、`LITELLM_OTEL_BAGGAGE_TEAM_METADATA_KEYS` 環境變數（以逗號分隔），或 `callback_settings.otel` 底下對應的 YAML 清單來覆寫這些設定。

## 指標 {#metrics}

除了 traces 之外，OTel v2 還可發出 GenAI **client metrics**：呼叫延遲、token 使用量與成本的 histogram，您的後端會在多次請求之間彙總這些資料。和 OTel v2 的其他功能一樣，在您開啟之前它們都不會啟用。

在 `LITELLM_OTEL_V2` 旁邊的 proxy 環境中設定此旗標：

```shell
LITELLM_OTEL_V2=true
LITELLM_OTEL_INTEGRATION_ENABLE_METRICS=true
```

指標會透過您已為 traces 設定的 exporter 傳送。`OTEL_EXPORTER`（`console`、`otlp_http`、`otlp_grpc`）、`OTEL_ENDPOINT`，以及 `OTEL_HEADERS` 會像處理 span 一樣，決定 metric stream 的確切去向，因此接收您 traces 的 collector 也會接收指標。

### 記錄了什麼 {#whats-recorded}

每次成功的 LLM 請求都會記錄標準 OpenTelemetry GenAI client metrics：

| 指標 | 單位 | 衡量內容 |
|---|---|---|
| `gen_ai.client.operation.duration` | `s` | 整個 LLM 請求的實際經過時間 |
| `gen_ai.client.token.usage` | `{token}` | 消耗的 token，依 `gen_ai.token.type` 屬性拆分為輸入與輸出 |
| `gen_ai.client.token.cost` | `USD` | LiteLLM 為此請求計算出的成本 |
| `gen_ai.client.response.time_to_first_token` | `s` | 到第一個串流 token 的時間（串流請求） |
| `gen_ai.client.response.time_per_output_token` | `s` | 每個輸出 token 的平均時間 |
| `gen_ai.client.response.duration` | `s` | 提供者端生成時間 |

每個樣本都帶有與對應 span 相同的身分屬性（operation、provider/system、request model、framework，以及選定的 `metadata.*` 欄位），因此您可以依 model、提供者、金鑰或團隊來分組 histogram。這六個指標與 [v1 OpenTelemetry integration](./opentelemetry_integration) 發出的指標相同，名稱與單位也一致，因此為其中一個建立的 dashboard 也適用於另一個。

### 控制指標屬性的基數 {#control-metric-attribute-cardinality}

預設情況下，每個 metric sample 都會標記完整的身分屬性集合，其中包含如 `hidden_params` 與多個 `metadata.*` 值等每次請求不同的欄位。這些欄位幾乎每個請求都唯一，因此每一項都會把後端追蹤的 time series 數量乘開（每種不同屬性組合一條 series）。在高流量下，這會讓 metric cardinality 爆增，而某些後端，例如 Splunk Observability Cloud，會開始節流或丟棄這些指標。

v2 讀取與 v1 相同的 filter，來源是您設定中的 `callback_settings.otel.attributes`。在那裡巢狀放入一個 `attributes` 區塊，並使用 `include_list`（allowlist；只輸出列出的屬性）或 `exclude_list`（denylist；輸出除列出屬性以外的全部內容）其一。兩者互斥。此 filter 只套用於 metrics；spans 會保留完整屬性集合，因此 traces 仍然豐富，而 metric cardinality 也維持在可控範圍內。

此區塊位於 `callback_settings.otel` 之下。設定 `LITELLM_OTEL_V2` 時，在 `otel` 中列出 `callbacks` 會建置 v2 logger 並讀取此區塊（只有在該旗標關閉時才會建置舊版 v1 logger）；當未列出任何 `otel` callback 時，預設路徑也會讀取此區塊。

與 v1 不同，v2 沒有每個實例的 `attributes` 欄位，因此此全域區塊是唯一來源。v2 也會延遲解析 filter，直到某次請求記錄的第一個 metric 才處理，而不是在啟動時處理，因此不良設定（兩個清單都設了，或名稱被禁止）會在第一次記錄的請求時才顯現，且修改清單要在重新啟動後才會生效。此 filter 只會在預設 OTLP 路徑上讀取（callback 名稱為 `otel` 或未設定）；預設目的地，例如 `arize`、`arize_phoenix` 和 `langfuse_otel`，會以完整屬性集合輸出其 metrics，與 v1 相同。

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

當您想要最小且最可預測的屬性集合時，請使用 `include_list` 明確列出要保留的屬性。未列出的內容都會從 metrics 中移除：

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

`gen_ai.token.type` 絕不會被過濾掉。它會在 filter 執行後標記到 `gen_ai.client.token.usage` 上，因此輸入/輸出拆分會保留下來，不論您設定哪個清單都一樣，而把它寫進 `include_list` 或 `exclude_list` 都會被拒絕。

## 哪些路由會被追蹤 {#which-routes-are-traced}

高頻率、非 LLM 的路由預設會**排除**，以免您的 traces 被淹沒：health checks（`/health*`）、Prometheus scrape（`/metrics`），以及靜態 UI/docs 資產（`/ui`、`/docs`、`/redoc`、`/_next`、`/openapi.json`、favicons，…）。

若要變更此集合，請使用標準 OpenTelemetry 環境變數（以逗號分隔的路徑，使用子字串比對）：

```shell
# Trace everything, including health checks
OTEL_PYTHON_FASTAPI_EXCLUDED_URLS=""

# Exclude only your own custom paths
OTEL_PYTHON_FASTAPI_EXCLUDED_URLS="/health,/internal"
```

## 每個金鑰 / 每個團隊的目的地（多租戶） {#per-key--per-team-destinations-multi-tenant}

單一 proxy 可服務多個租戶，並將每個租戶的 traces 僅傳送至該租戶自己的後端，因此一個團隊不會看到另一個團隊的 traces。proxy 管理員負責路由；團隊或金鑰只需依名稱指向某個目的地，且不會碰觸其他租戶的機密。

```
Proxy admin                          Team admin
  creates a destination  ───────►      picks it from a list
  (backend + secrets + scope)          (only ones in their scope show up)
        │                                      │
        └──────────► at request time ◄─────────┘
              the proxy matches caller to destination
              and sends that request's trace there
```

### 一分鐘看懂概念 {#the-idea-in-one-minute}

這裡有兩個部分。

**目的地** 是由 proxy 管理員建立的、用來傳送 traces 的具名位置。它重用與上方 [預設值](#2-send-traces-to-a-specific-tool-presets) 相同的後端與憑證：包含它是哪一種後端（`langfuse_otel`、`arize`、`weave_otel`，或 `generic` OTLP 端點，意即任何支援 OpenTelemetry Protocol 的後端）、該後端的連線詳細資訊與機密，以及一個 **存取範圍**，說明哪些團隊或組織可以使用它。這裡的 **組織** 是由多個團隊組成的群組；團隊隸屬於某一個組織。

**團隊、金鑰或組織** 會在名為 `logging_exporters` 的設定中列出目的地名稱，以啟用該目的地。這是團隊管理員唯一會碰觸的部分；機密則由 proxy 管理員保管。

在請求時間，proxy 會查看發出呼叫的 key、該 key 所屬的 team，以及該 team 的 organization，收集這三個清單所列出的所有目的地名稱，只保留存取範圍實際包含此呼叫者的目的地，並將該請求的 trace 傳送到每一個目的地。如果都不符合，trace 就只會送到上方各節中的一般全域 exporter。

### 誰可以變更什麼 {#who-can-change-what}

以下會出現三種角色。**proxy admin** 負責整個 proxy 並持有所有密鑰。**org admin** 管理一個 organization（一組 teams）。**team admin** 管理單一 team。這種拆分的存在，是為了讓 team admin 可以只為自己的 team 啟用，而不必看到或編輯其他租戶的密鑰。

| 動作 | Proxy admin | Org admin（該 team 所屬 org） | Team admin（該 team） |
|---|:-:|:-:|:-:|
| 建立或刪除 destination | 是 | 否 | 否 |
| 編輯 destination 的 backend、host 或 secrets | 是 | 否 | 否 |
| 將 destination 設為全域，或授權給整個 org | 是 | 否 | 否 |
| 將 destination 授權給 team | 是，任何 team | 是，該 org 內的 teams | 是，自己的 team |
| 為 team 或 key（`logging_exporters`）開啟 destination | 是 | 是 | 是（自己的 team） |

### 在 UI 中設定 {#set-it-up-in-the-ui}

這是常見路徑，而在 team 的 traces 開始流動之前，必須先滿足兩件事：destination 的存取範圍必須包含該 team，且該 team 必須在其 **Logging Exporters** 中列出該 destination。admin 負責第一件；team admin 負責第二件。請注意，這是兩個不同的畫面：admin 在 **Settings, Logging Callbacks** 中操作（建立 destinations 的地方），而 team admin 則在 team 的 **Logging Exporters** 選擇器中操作（啟用 destination 的地方）。

Proxy admin，建立 destination：

1. 開啟 proxy UI，前往 **Settings**，再到 **Logging Callbacks**。
2. 點擊以新增 logging destination。選擇 **backend**（`langfuse_otel`、`arize`、`weave_otel`，或 `generic`），填入該 backend 的 **host** 和 **secrets**，並設定 **Access** 範圍：設為 Global（每個 team），或選擇特定的 Teams 或 Orgs。密鑰值與您會為該預設設定的 env vars 相同，且複製自 backend 自己的儀表板（例如您的 Langfuse 專案 API 金鑰）；請參閱 [Preset reference](#preset-reference) 了解每個 backend 需要哪些欄位。
3. 儲存。從此之後，secrets 與 Global/Org 範圍都只限 admin 使用；team admins 只能將 destination 連結到其範圍內既有的 teams。

![新增 logging destination：選擇 backend、設定 host 與 secrets，然後使用 Global、Teams、Organizations 與 Auto-enable 控制項設定存取範圍](/img/observability/otel_v2_destination_admin.png)

您建立的 destinations 會出現在 Logging Callbacks 清單中，每一列都會標示其存取範圍：

![啟用中的 logging callbacks，每一列顯示其範圍：一個為 Global，一個僅限單一 team](/img/observability/otel_v2_destinations_list.png)

Team admin，為 team 開啟它：

1. 前往 **Teams**，選取您的 team，開啟 **Settings**（或前往 **Virtual Keys**，選擇一個 key，然後編輯它）。
2. 在 **Logging Exporters** 多選欄位中，選擇該 destination。這裡只會顯示您範圍內的 destinations；其他租戶的 destinations 絕不會列出。
3. 儲存。該 team 或 key 的每個請求現在也會將其 trace 傳送到您選取的 destination。

### 透過 API 設定 {#set-it-up-over-the-api}

UI 會呼叫這些端點；您也可以直接使用它們。預留位置如下：`$ADMIN_KEY` 是 proxy-admin virtual key，而 `$TEAM_ADMIN_KEY` 是 team admin 的 virtual key（可在 UI 的 **Virtual Keys** 頁面上鑄造任一個，或使用 `/key/generate`），`<team-id>` 來自 Teams 頁面，而 `pk-...` / `sk-...` 則是 backend 儀表板中的自有金鑰。如同在 UI 中，必須先完成授權（步驟 1 或 2）以及啟用（步驟 3），traces 才會開始流動。

步驟 1，proxy admin 建立 destination（此處為授權給一個 team 的 Langfuse destination）：

```shell
curl -X POST http://localhost:4000/credentials \
  -H "Authorization: Bearer $ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{
    "credential_name": "tenant-a-langfuse",
    "credential_values": {
      "langfuse_public_key": "pk-...",
      "langfuse_secret_key": "sk-...",
      "langfuse_host": "https://cloud.langfuse.com"
    },
    "credential_info": {
      "credential_type": "logging",
      "description": "langfuse_otel",
      "host": "https://cloud.langfuse.com",
      "access": { "teams": ["<team-id>"] }
    }
  }'
```

`credential_type` 必須是 `logging`，而 `description` 指定 backend。步驟 2（步驟 1 中授權的替代作法）：team admin 以狹窄的 patch 授權自己的 team，且無法碰觸 secrets、host 或全域/org 範圍：

```shell
curl -X PATCH http://localhost:4000/credentials/tenant-a-langfuse \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"credential_info": {"access": {"teams": ["<their-team-id>"]}}}'
```

步驟 3，將 destination 加入 team 的 `logging_exporters`，以為該 team 開啟 destination：

```shell
curl -X POST http://localhost:4000/team/update \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"team_id": "<team-id>", "metadata": {"logging_exporters": ["tenant-a-langfuse"]}}'
```

同一個 `metadata.logging_exporters` 也可用於 key（`/key/update`）以及 organization，而 proxy 會在請求時間將三者合併。

### Backends 與各自需要的欄位 {#backends-and-the-fields-each-one-needs}

admin 會將這些填入 destination 的 secret 欄位；其值來自 backend 自己的儀表板，與 [Preset reference](#preset-reference) 中的 preset env vars 相同。任何相容 OTLP、但不屬於前三者的項目都使用 `generic`。

| Backend (`description`) | Secret 欄位 |
|---|---|
| `langfuse_otel` | `langfuse_public_key`、`langfuse_secret_key`、`langfuse_host`（選用；預設為 Langfuse US cloud） |
| `arize` | `arize_space_id`（或 `arize_space_key`）、`arize_api_key`、`arize_project_name`；`arize_endpoint` 為選用 |
| `weave_otel` | `wandb_api_key`、`weave_project_id`（選用）；`weave_endpoint` 為選用 |
| `generic` | `otel_endpoint`（必要）、`otel_headers`（選用，`key=value,key2=value2`） |

### 需要知道的事 {#good-to-know}

解析是 **預設拒絕**：team 只有在同時於 `logging_exporters` 中列出某 destination，且該 destination 也在其範圍內時，才能存取。設定錯誤或拼字錯誤的名稱只會讓資料不送出，而不會把 trace 洩漏到錯誤的租戶。

有兩個捷徑可以略過 per-team 的明確啟用，而且兩者都只限 admin 在 destination 本身上設定。標記為 **global** 的 destination，不需要 admin 逐一替 team 授權，就可供每個 team 使用；team admin 仍需將其列出以啟用它。標記為 **auto-enable** 的 destination 更進一步，會自動套用到每個請求，完全不需要任何 team 將其列出；當您想要讓單一 backend 捕捉整個 proxy 中每個請求的 trace 時，就使用它。在 UI 中，這兩者都是 destination modal 中、Access 範圍旁的切換；透過 API 則分別是 `credential_info.access.global` 和 `credential_info.auto_enable`，例如：

```shell
curl -X PATCH http://localhost:4000/credentials/tenant-a-langfuse \
  -H "Authorization: Bearer $ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"credential_info": {"auto_enable": true}}'
```

這種路由只適用於 **traces**。GenAI client metrics（請參閱 [Metrics](#metrics)）仍然會送到您單一全域設定的 exporter，而不是 per-tenant destinations。

## 分散式追蹤 {#distributed-tracing}

如果傳入的請求帶有 W3C `traceparent` 標頭，LiteLLM 會延續該 trace，而不是建立新的 trace。如此一來，您的 LiteLLM spans 會直接出現在應用程式原本已有的任何分散式 trace 之中——因此您可以在同一個畫面中，追蹤請求從應用程式經由 proxy 到 LLM 提供者的完整路徑。

## 設定參考 {#configuration-reference}

所有值都是環境變數。布林旗標接受 `true`/`false`。

| 變數 | 預設值 | 用途 |
|---|---|---|
| `LITELLM_OTEL_V2` | `false` | **總開關。** 在這個值為 `true` 之前，OTel v2 不會執行任何動作。 |
| `OTEL_EXPORTER`（別名 `OTEL_EXPORTER_OTLP_PROTOCOL`） | `console` | 匯出器種類：`console`、`otlp_http`、`otlp_grpc`。 |
| `OTEL_ENDPOINT`（別名 `OTEL_EXPORTER_OTLP_ENDPOINT`） | 無 | OTLP collector URL。設定 endpoint 表示會使用 `otlp_http`，除非您覆寫 `OTEL_EXPORTER`。 |
| `OTEL_HEADERS`（別名 `OTEL_EXPORTER_OTLP_HEADERS`） | 無 | 以逗號分隔的 `key=value` 驗證標頭，供您的後端使用。 |
| `OTEL_SERVICE_NAME` | `litellm` | 顯示在您的後端中的 `service.name` 資源屬性。 |
| `OTEL_ENVIRONMENT_NAME` | 無 | `deployment.environment` 資源屬性（例如 `production`）。 |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `no_content` | Prompt/response 擷取：`no_content`、`span_only`、`event_only`、`span_and_event`。 |
| `OTEL_PYTHON_FASTAPI_EXCLUDED_URLS` | health/metrics/UI 路由 | 要從追蹤中排除的以逗號分隔路徑（子字串比對）。設為 `""` 以追蹤所有內容。 |
| `LITELLM_OTEL_INTEGRATION_ENABLE_METRICS` | `false` | 也輸出 GenAI 用戶端指標（持續時間、token 使用量、成本、串流計時）。請參閱 [指標](#metrics)。 |
| `LITELLM_OTEL_LEGACY_COMPAT` | `true` | 也輸出舊版 Traceloop 鍵名稱下的屬性。請參閱 [屬性慣例](#attribute-conventions)。 |

每種 span 類型上的完整鍵集合，請參閱 [span 屬性](#span-attributes)。

## 疑難排解 {#troubleshooting}

**沒有看到 traces？**

1. 確認 `LITELLM_OTEL_V2=true` 已設定在 proxy 的環境中。
2. 先試試 `OTEL_EXPORTER="console"`——如果 spans 輸出到 stdout，問題就在您的 exporter endpoint/headers，而不是 LiteLLM。
3. 確認您有打到 LLM 路由（例如 `/v1/chat/completions`）。健康檢查和 UI 路由預設會被排除。
4. 確認已安裝 `opentelemetry-instrumentation-fastapi`（請參閱 [需求](#requirements)）。

**只看到 LLM 呼叫，但沒有 `auth`/`postgres`/server span？** 這些 server 和 DB spans 需要 FastAPI instrumentation 套件——請安裝 `opentelemetry-instrumentation-fastapi`。

**我看到中繼資料，但沒有 prompts/responses。** 這是預設行為。請設定 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=span_only` 以擷取內容。

## 支援 {#support}

如有疑問，請在 [BerriAI/litellm](https://github.com/BerriAI/litellm/issues) 開啟 issue。
