---
title: "API 參考"
description: "透過 LiteLLM 列出並讀取代理程式執行、讀取調查發現，並以 SQL 查詢 traces。"
slug: "/proxy/lens/api"
---

# API 參考 {#api-reference}

大多數整合需要在您的 LiteLLM proxy 上進行三個呼叫：列出最近的執行、逐步讀取一個執行，以及讀取調查儲存的發現。對於這些呼叫無法回答的問題，代理程式可以[以 SQL 查詢 traces](#query-traces)。

| 工作 | 端點 |
| --- | --- |
| 列出最近的執行 | [`GET /v1/traces`](#list-runs) |
| 讀取一個執行及其步驟 | [`GET /v1/traces/{trace_id}`](#read-a-run) |
| 讀取調查的發現 | [`GET /lens/{id}`](#read-findings) |
| 以 SQL 提出您自己的問題 | [`POST /v1/traces/query`](#query-traces) |

每個呼叫都使用您的 LiteLLM 基礎 URL，以及在 `Authorization: Bearer <key>` 中的 proxy 金鑰。這些端點沒有 Lens 命令列工具。請使用 curl、任何 HTTP 用戶端，或直接呼叫它們的程式碼代理程式。

這些範例來自一個以 `lookup_order` 工具回答訂單問題的支援代理程式。回應已縮短為大多數呼叫者使用的欄位。

## 列出執行 {#list-runs}

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/v1/traces"
```

```json
{
  "data": [
    {
      "trace_id": "4a4c840fdaa6bcb41576696dcdd08cea",
      "trace_ref": "78D3FB0BFD713A60F9AB160F59D2CE0A590884B7875C4B9F5998E3BAB5F455C5",
      "name": "support_agent",
      "service": "support-agent",
      "agent_names": ["support_agent"],
      "input_preview": "Can you check order 1003 for me?",
      "start_time": "2026-10-21T00:22:46.051000+00:00",
      "duration_ms": 1533.24,
      "status": "unset",
      "span_count": 4,
      "llm_calls": 2,
      "tool_calls": 1,
      "error_count": 0,
      "input_tokens": 349,
      "output_tokens": 71,
      "models": ["gpt-5.4-mini-2026-03-17"],
      "spend": null
    }
  ],
  "next_cursor": null
}
```

選用的 `start_ms` 與 `end_ms` 為 Unix 毫秒。預設視窗是過去 24 小時。每頁最多包含 50 個摘要。將 `next_cursor` 作為 `cursor` 傳回，以讀取下一頁。當沒有 LiteLLM 支出記錄與該執行的模型呼叫相符時，`spend` 為 `null`。

當執行設定了 [`agent.source.url`](./first-trace.md#link-a-run-to-its-source) 時，摘要的 `source` 會包含 `type`、`url` 與 `title`，否則不存在。

## 讀取一個執行 {#read-a-run}

將摘要的 `trace_ref` 與 trace ID 一起傳入。

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/v1/traces/<trace_id>?trace_ref=<trace_ref>"
```

回應包含與清單相同的 `summary`、`agents` 中每個代理程式各一個項目，以及 `spans` 中的每個步驟：

```json
{
  "summary": {"trace_id": "4a4c840fdaa6bcb41576696dcdd08cea", "name": "support_agent", "span_count": 4},
  "agents": [
    {"name": "support_agent", "parent_agent": null, "invocations": 1, "llm_calls": 2, "tool_calls": 1, "duration_ms": 1533.24}
  ],
  "spans": [
    {"span_id": "c0d29d46119bf872", "parent_span_id": null, "name": "support_agent", "type": "agent", "duration_ms": 1533.24, "input_preview": "Can you check order 1003 for me?"},
    {"span_id": "33dc407df5b1d464", "parent_span_id": "c0d29d46119bf872", "name": "ChatCompletion", "type": "llm", "model": "gpt-5.4-mini-2026-03-17", "duration_ms": 706.65, "input_tokens": 154, "output_tokens": 19},
    {"span_id": "49d1a643afcb252b", "parent_span_id": "c0d29d46119bf872", "name": "lookup_order", "type": "tool", "duration_ms": 0.04, "input_preview": "1003"},
    {"span_id": "d429b78e2b94987a", "parent_span_id": "c0d29d46119bf872", "name": "ChatCompletion", "type": "llm", "model": "gpt-5.4-mini-2026-03-17", "duration_ms": 822.27, "input_tokens": 195, "output_tokens": 52}
  ],
  "next_cursor": null
}
```

Span 帶有 `agent`、`llm` 或 `tool` 的 `type`，而 `parent_span_id` 構成樹狀結構。較長的 traces 會分頁回傳其 spans。將 `next_cursor` 作為 `cursor` 傳回，並設定 `page_size` 以更改頁面長度。

若要讀取某個步驟的完整輸入與輸出，請加上其 span ID：

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/v1/traces/<trace_id>/spans/<span_id>?trace_ref=<trace_ref>"
```

```json
{
  "span_id": "49d1a643afcb252b",
  "input": "1003",
  "output": "{\"error\": \"order 1003 not found\"}",
  "attributes": {"openinference.span.kind": "TOOL"}
}
```

回應還包含 `input_ui` 與 `output_ui`，即為顯示而塑形的相同內容。當 span 的 `error_truncated` 為 `true` 時，請從 `GET /v1/traces/{trace_id}/spans/{span_id}/error` 讀取完整的錯誤文字。

## 讀取發現 {#read-findings}

發現來自[調查](./investigations.md)。以 `GET /lens` 列出現有的調查，或建立一個。這些呼叫需要 proxy 管理員金鑰。

```bash
curl -X POST "https://<your-litellm-proxy>/lens" \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support agent order lookups",
    "model": "<analysis-model>",
    "agent_name": "support_agent",
    "context": "The support agent answers order status questions with the lookup_order tool. A good answer reports the status the tool returned and never invents a status, carrier, or date.",
    "lookback_hours": 24
  }'
```

`model` 指定在 Lens 伺服器上設定的[分析模型](https://github.com/BerriAI/lens/blob/main/docs/analysis.md)。回應會回傳調查的 `id`，以及其在 `jobs` 中的第一個已排入佇列的執行。預設情況下，調查會在每月 100 美元的上限（`monthly_budget`）下，每 15 分鐘（`interval_minutes`）持續監看新的 traces。若只需執行一次，請傳送 `"enabled": false`。

輪詢該調查，直到其最新的 job 回報 `completed`：

```bash
curl -H "Authorization: Bearer <admin-key>" \
  "https://<your-litellm-proxy>/lens/<id>"
```

```json
{
  "id": "314722c5-0a03-430d-9acd-178516decff0",
  "jobs": [
    {
      "status": "completed",
      "stage": "Complete",
      "coverage": {"eligible": 6, "screened": 6, "selected": 6, "investigated": 1, "reused": 4},
      "cost": 0.0747
    }
  ],
  "findings": [
    {
      "id": "9928ebd6-db31-4f38-80e9-36e5a908916c",
      "title": "The agent reported lookup results without inventing shipping details",
      "kind": "pattern",
      "priority": "low",
      "status": "open",
      "description": "The users wanted an arrival date for order 1001 and the status of order 9999. The agent used lookup_order for both. For order 1001, its answer matched the returned status, carrier, and date...",
      "suggestion": "Keep reporting only the details returned by the lookup, preserve estimated dates as estimates, and state clearly when an order cannot be found.",
      "evidence": [
        {
          "span_id": "0ad4fe40bdb3b9f7",
          "quote": "Input: 1001\nOutput: {\"status\": \"shipped\", \"carrier\": \"UPS\", \"eta\": \"2026-10-23\"}"
        }
      ]
    }
  ]
}
```

每個證據項目都引用一個步驟，並指出其 `span_id`。回應還包含已儲存的 `settings`，且每個 job 的 `cost` 以美元計。

## 以 SQL 查詢 traces {#query-traces}

`POST /v1/traces/query` 會在您的 traces 與 LiteLLM 支出記錄上執行唯讀的 ClickHouse SQL 查詢。在代理程式撰寫查詢之前，請讓它先呼叫 `GET /v1/traces/query/help`。該回應列出資料表、其欄位、範例查詢與查詢規則，因此您可以給程式碼代理程式一把 LiteLLM 金鑰，讓它自行回答問題。

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/v1/traces/query/help"
```

```bash
curl -X POST "https://<your-litellm-proxy>/v1/traces/query" \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"SELECT SpanName, count() AS spans, round(avg(Duration) / 1e6, 1) AS avg_ms FROM otel_traces WHERE Timestamp >= now() - INTERVAL 1 DAY AND ServiceName = 'support-agent' GROUP BY SpanName ORDER BY spans DESC LIMIT 10\"}"
```

```json
{
  "data": [
    {"SpanName": "ChatCompletion", "spans": 12, "avg_ms": 753.5},
    {"SpanName": "lookup_order", "spans": 6, "avg_ms": 0},
    {"SpanName": "support_agent", "spans": 6, "avg_ms": 1521.1}
  ]
}
```

| 資料表 | 每列代表 |
| --- | --- |
| `otel_traces` | Span |
| `agent_traces_by_key` | 執行摘要 |
| `spend_logs` | LiteLLM 請求 |

查詢看到的列與呼叫者讀取 trace 時相同。請務必限制 `Timestamp` 並加上 `LIMIT`。每個查詢有 256 MiB 記憶體與 10 秒。不要加上 `FORMAT` 子句。`Duration` 以奈秒為單位。加總成本時請讀取 `spend_logs FINAL`。無法解析的 SQL 會回傳 400。被 ClickHouse 拒絕的查詢（例如寫入或超出限制的查詢）會回傳 503。Proxy 必須設定主金鑰。沒有主金鑰時，兩個查詢端點都會回傳 503。

`GET /v1/traces/agents` 列出每個記錄的代理程式名稱，以及其執行次數、失敗的執行、最後活動與框架：

```json
{
  "agents": [
    {"name": "support_agent", "runs": 6, "failed_runs": 0, "last_seen": "2026-10-21T00:22:50.437000Z", "frameworks": []}
  ]
}
```

它預設涵蓋 trace 保留視窗，並接受與 `GET /v1/traces` 相同的 `start_ms` 與 `end_ms`。

## 上傳 traces {#upload}

代理程式使用專用的追蹤金鑰（在 `Authorization: Bearer <tracing-key>` 中）將 traces 直接上傳至 Lens。以 proxy 管理員身分在 LiteLLM 上以 `POST /lens/tracing/keys` 產生金鑰，或開啟 **Lens > Traces**，點選 **Connect project**，再點選 **Generate tracing key**。LiteLLM 上的 `GET /lens/service` 會回傳公開的擷取基礎 URL 與連線狀態。

使用 Lens 基礎 URL（有 `/lens-ingest` 時請保留），後面接下方的路徑。儀表板的 **Traces endpoint** 已包含 `/v1/traces`。

| 端點 | 用途 |
| --- | --- |
| `POST /v1/traces` | 以 protobuf（`application/x-protobuf`）或 JSON（`application/json`）擷取 OTLP/HTTP traces。支援以 `Content-Encoding: gzip` 使用 gzip。 |
| `POST /v1/logs` | 擷取 OTLP/HTTP 記錄，包括程式碼代理程式工作階段事件 |
| `POST /v1/traces/receipt` | 檢查以相同追蹤金鑰上傳的某個 `trace_id` 與最多 1,000 個 `span_ids` 的傳送狀況。回傳 `received`；絕不回傳 trace 內容 |

追蹤金鑰僅允許擷取及其自身的傳送回執。它無法讀取 traces 或呼叫模型，一般的模型金鑰也無法上傳。閘道的上傳路由會回傳 410，因此匯出器 URL 必須直接指向 Lens。

上傳成功表示 ClickHouse 已接受它。429 或 503 可以重試，因此請使用有上限的匯出器重試。在長時間中斷期間，匯出器可能會捨棄 traces。金鑰在每個 Lens 複本上每 30 秒重新整理一次，憑證快照的最長年限為 90 秒。

## 誰可以讀取 traces {#access}

Proxy 管理員與 proxy 管理員檢視者可以讀取每個 trace。其他所有使用者（包括 SCIM 佈建的使用者）讀取其使用者擁有的 traces，加上每個與他們共用 traces 的團隊的 traces，如[共用團隊的 traces](#trace-access) 所述。SQL 查詢遵循相同規則。不屬於任何使用者的金鑰（例如團隊服務帳戶金鑰）無法讀取 traces，會得到 403。

### 共用團隊的 traces {#trace-access}

團隊透過 `/spend/logs` 成員權限與其成員共用 traces。團隊管理員永遠能看到團隊的 traces，一般成員則在團隊的 `team_member_permissions` 包含 `/spend/logs` 後即可看到。您可以從 Admin UI（Teams，開啟團隊，Member Permissions 分頁）或以 API 授予：

```bash
curl -X POST "https://<your-litellm-proxy>/team/permissions_update" \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "<team-id>", "team_member_permissions": ["/spend/logs"]}'
```

若要一次授予所有現有團隊：

```bash
curl -X POST "https://<your-litellm-proxy>/team/permissions_bulk_update" \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["/spend/logs"], "apply_to_all_teams": true}'
```

若要讓每個新團隊都共用其 traces，包括 [SCIM](../identity_provisioning.md) 從身分提供者群組建立的團隊，請在 [`default_team_params`](../self_serve.md#set-default-params-for-new-teams) 中設定它。之後，身分提供者中的群組成員資格會決定誰能看到哪些 traces，無需逐團隊設定：

```yaml
litellm_settings:
  default_team_params:
    team_member_permissions: ["/spend/logs"]
```

之後對群組的 SCIM 更新會保留團隊的權限。相同的權限也讓成員可以檢視團隊的支出記錄。`/lens` 下的調查與發現仍僅限 proxy 管理員。

## 調查 API {#use-the-api}

這些位於您的 LiteLLM proxy 上的端點管理調查。請在 `Authorization: Bearer <key>` 標頭中傳送 proxy 管理員金鑰。

| 端點 | 用途 |
| --- | --- |
| `GET /lens` | 在 `lenses` 下列出調查，加上 `workers` 與 `tracing_enabled`。 |
| `POST /lens` | 建立調查並將其第一個執行排入佇列。傳送 `name`、`model` 以及 `context` 或 `checks`；回傳調查的 `id` 與 `jobs`。 |
| `GET /lens/{id}` | 讀取已儲存的 `settings`、最近的 `jobs` 與 `findings`。每個 job 包含 `status`、`stage`、`coverage` 與 `cost`。 |
| `POST /lens/{id}/runs` | 將另一個執行排入佇列。傳送 `{}` 以重複使用已儲存的設定，或傳送 `settings` 物件進行一次性覆寫。 |
| `POST /lens/{id}/cancel` | 取消目前的執行。監看中的調查會在下一個間隔再次執行。 |

唯讀的 proxy 管理員可以預覽活動，並讀取調查、發現與歷史。團隊金鑰與一般虛擬金鑰無法使用此 API。
