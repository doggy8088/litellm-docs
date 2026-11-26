import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Mixpanel {#mixpanel}

<SinceVersion v="1.113.0" />

使用 `mixpanel` 回呼，將 LiteLLM OpenTelemetry v2 trace 傳送到 [Mixpanel](https://mixpanel.com)。此預設組態會使用 HTTP Basic 驗證（`Authorization: Basic <base64(project_token:)>`），將標準 OpenTelemetry `gen_ai.*` span 屬性匯出到 Mixpanel 各區域的 `/v1/ai/otel/traces` 擷取端點，並在整個 trace 上標記 `user.id`，讓 Mixpanel 將每個 span 對應到 `distinct_id`。

## 前置需求 {#prerequisites}

您需要在 LiteLLM Proxy 或 SDK 環境中啟用 `LITELLM_OTEL_V2=true`，並準備 Mixpanel 專案 token（`MIXPANEL_PROJECT_TOKEN`），以及請求上的使用者識別碼（請參閱[設定 `user.id`](#setting-userid)）。Mixpanel 會捨棄沒有非空 `user.id` 的 spans。專案 token 也可以來自 team 或 key，而非環境變數，請參閱[依 team 與依 key 路由](#per-team-and-per-key-routing)。不需要額外的 Python 套件；此回呼使用 `litellm[proxy]` 內建的 OTLP HTTP exporter。

## 快速開始 {#quick-start}

將 `mixpanel` 加入 `callbacks` 並設定您的專案 token。V2 trace 包含的內容，請參閱 [OpenTelemetry v2](./opentelemetry_v2)。

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["mixpanel"]
```

<Tabs>
<TabItem value="us" label="US (default)" default>

```shell title=".env"
LITELLM_OTEL_V2=true
MIXPANEL_PROJECT_TOKEN="<your-project-token>"
```

匯出到 `https://ingestion-us.mixpanel.com/v1/ai/otel/traces`。

</TabItem>
<TabItem value="eu" label="EU">

```shell title=".env"
LITELLM_OTEL_V2=true
MIXPANEL_PROJECT_TOKEN="<your-project-token>"
MIXPANEL_REGION="eu"
```

匯出到 `https://ingestion-eu.mixpanel.com/v1/ai/otel/traces`。

</TabItem>
<TabItem value="in" label="India">

```shell title=".env"
LITELLM_OTEL_V2=true
MIXPANEL_PROJECT_TOKEN="<your-project-token>"
MIXPANEL_REGION="in"
```

匯出到 `https://ingestion-in.mixpanel.com/v1/ai/otel/traces`。

</TabItem>
</Tabs>

啟動 proxy，並傳送一個帶有使用者識別碼的請求：

```shell
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_small}}",
    "user": "user-123",
    "messages": [{"role": "user", "content": "Hello Mixpanel!"}]
  }'
```

您也可以在 Admin UI 的 **Settings > Logging & Alerts** 下啟用此回呼，Mixpanel 會以一個磁貼呈現，並接受 `mixpanel_project_token` 與 `mixpanel_region`。

## 設定 `user.id` {#setting-userid}

Mixpanel 要求每個 span 都有非空的 `user.id` 屬性，並將 `user.id` 對應到 `distinct_id`。LiteLLM 會使用下列來源中第一個具有可用值的來源：

| 順序 | 來源 | 是否同時設定 proxy 的終端使用者？ |
|---|---|---|
| 1 | `metadata["user.id"]`（也會從 `litellm_metadata` 讀取，以及巢狀的 `metadata["user"]["id"]`） | 否 |
| 2 | `metadata["user_id"]` | 是 |
| 3 | `metadata["trace_user_id"]` | 否 |
| 4 | W3C `baggage` 請求標頭或程序內 Baggage，金鑰為 `user.id` | 否 |
| 5 | Proxy 的終端使用者：`x-litellm-customer-id` 與其他客戶標頭、`user` 參數、`litellm_metadata.user`、`safety_identifier`，或虛擬金鑰的 `end_user_id` | 是 |

空白值、布林值、超過 1024 個字元的值，或含有控制字元的值都會被跳過，改用下一個來源。數字會以字串形式傳送。

`metadata["user.id"]` 只會為 spans 加上標籤。它絕不會建立客戶、不會套用客戶的預算或速率限制，也不會以終端使用者身分出現在支出記錄中。若要為 spans 加上標籤並同時強制執行客戶限制，請傳送 `user` 或 `x-litellm-customer-id`，如同未使用 Mixpanel 時的做法。由於兩者是分別讀取的，同時帶有 `metadata["user.id"]` 與 `user` 的請求，會在 Mixpanel 中顯示一個 id，在支出記錄中顯示另一個。

自行填寫 `metadata.user_id` 的用戶端，會以該值作為 `distinct_id`。Claude Code 會在 `/v1/messages` 上於該處傳送工作階段範圍的值，因此每個工作階段都會顯示為各自的使用者。若您可以設定，請從這些用戶端傳送 `metadata["user.id"]`。

此 id 會從驗證結束起，傳遞到請求的每一個 span：請求根節點、`auth` span、防護欄、LLM 呼叫，以及驗證後的資料庫與快取工作。在 Mixpanel 的副本中，它會取代 span 原本攜帶的任何 `user.id`，因此一個請求只命名一個使用者。有四種 span 不帶 id，因為 LiteLLM 當時還沒有可命名的呼叫者，或根本沒有呼叫者：在金鑰解析前於 `auth` 階段內執行的讀取、`POST /mcp` 傳輸 span 以及在 MCP 驗證前執行的查詢、在驗證期間被拒絕的請求，以及不屬於任何請求的背景工作。這些仍會匯出到以 `MIXPANEL_PROJECT_TOKEN` 設定的專案，Mixpanel 會捨棄它們。team 或 key 的專案不會收到它們。`baggage` 只有在請求通過驗證後才會被讀取，因此沒有有效金鑰的呼叫者無法命名使用者。

## 依 team 與依 key 路由 {#per-team-and-per-key-routing}

在 OpenTelemetry v2（`LITELLM_OTEL_V2=true`）下，team 或虛擬金鑰可以將其 trace 路由到自己的 Mixpanel 專案與資料落地區域（`us`、`eu` 或 `in`）。這使用與 [Team/Key based logging](../proxy/team_logging) 相同的 key 與 team 回呼機制，而一般行為（覆寫與附加模式、tenant 會收到什麼、key 優先於 team）則說明於 [Per-key / per-team credentials](./opentelemetry_v2#per-key--per-team-credentials-multi-tenant)。

此做法不需要 `MIXPANEL_PROJECT_TOKEN`。無論 `callbacks` 是否列出 `mixpanel`，且無論是否搭配其他回呼，都能運作。`user.id` 只會傳送到 Mixpanel，因此請求匯出的其他後端不會收到它。例外是在 key 或 team 上設定的 Langfuse 專案，它也會從 LLM 呼叫 span 讀取 `user.id` 作為其 Langfuse 使用者。

在 team 上註冊此回呼：

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "mixpanel",
    "callback_type": "success",
    "callback_vars": {
      "mixpanel_project_token": "<team-project-token>",
      "mixpanel_region": "eu"
    }
  }'
```

或在虛擬金鑰上註冊，包括沒有 team 的金鑰：

```shell
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "logging": [{
        "callback_name": "mixpanel",
        "callback_type": "success",
        "callback_vars": {
          "mixpanel_project_token": "<key-project-token>",
          "mixpanel_region": "us"
        }
      }]
    }
  }'
```

Admin UI 會在 Mixpanel 磁貼下的 team 或 key 記錄設定中，公開相同的兩個欄位。

只要設定了 `mixpanel_*` 變數，就必須提供 `mixpanel_project_token`。LiteLLM 會以 400 拒絕空 token 與遮罩後的 `***REDACTED***` 值，因此更新回呼時請重新傳送真實 token。

`mixpanel_region` 預設為 `us`，不會繼承 `MIXPANEL_REGION`，後者僅適用於 proxy 自己的專案。請在資料屬於其他區域的每個 team 或 key 上設定它。

請使用 `callback_type` `success` 或 `success_and_failure`。單獨的 `failure` 項目不會將 team 或 key 的 trace 路由到 Mixpanel。

token 會加密儲存。`GET /team/{team_id}/callback` 會以遮罩形式回傳它，而 `/team/info` 與 `/key/info` 回傳加密後的值，`/get/config/callbacks` 則會向 proxy 管理員顯示 proxy 的 `MIXPANEL_PROJECT_TOKEN`。

## 提示詞與完成內容 {#prompt-and-completion-content}

預設不會傳送提示詞與完成內容。Spans 仍會攜帶 OpenTelemetry v2 為每個後端記錄的內容：模型、token 用量、成本、延遲與 `user.id`，以及呼叫者的 IP 位址與 user agent、請求 URL、API 金鑰雜湊與金鑰擁有者 id，在資料庫 spans 上還有資料庫系統與資料表名稱。來自環境變數的專案 token 還會收到資料庫主機、連接埠與名稱，team 或 key 的專案則不會。若要包含這些內容，請設定 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=span_only`，這會將 `gen_ai.input.messages` 與 `gen_ai.output.messages` 加入 `chat` span。

若只有部分流量適合記錄，請保持擷取開啟，但預設遮罩每個請求，再讓受信任的呼叫者按請求選擇加入。在 proxy 設定中開啟遮罩，spans 就會以 `redacted-by-litellm` 取代訊息內容：

```yaml
litellm_settings:
  callbacks: ["mixpanel"]
  turn_off_message_logging: true
```

在每個可選擇退出的 key 或 team 的 metadata 中加入 `allow_client_message_redaction_opt_out: true`，並讓這些呼叫者在內容可記錄的請求上傳送 `LiteLLM-Disable-Message-Redaction: true`。Proxy 會捨棄任何其他 key 上的此標頭，因此只有在 key 與請求都選擇加入時才會匯出內容。key 的設定請參閱[停用訊息遮罩](../proxy/logging#disable-message-redaction)。

## 搭配其他回呼使用 Mixpanel {#using-mixpanel-with-other-callbacks}

`callbacks` 中的第一個 OpenTelemetry v2 回呼擁有請求的整個 trace，之後的每個回呼只匯出自己的 LLM 呼叫 span。若以 `MIXPANEL_PROJECT_TOKEN` 設定的專案應收到每個 span，請將 `mixpanel` 列在第一位，例如 `callbacks: ["mixpanel", "otel"]`。若使用 `callbacks: ["otel", "mixpanel"]`，該專案只會收到 LLM 呼叫 span。team 或 key 的專案不論順序為何都會收到整個 trace。

## 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 |
|---|---|---|
| `LITELLM_OTEL_V2` | 是 | 必須為 `true` 才能啟用 OpenTelemetry v2 |
| `MIXPANEL_PROJECT_TOKEN` | 是（除非僅使用依 team／key 路由） | Mixpanel 專案 token，以 HTTP Basic 驗證編碼（`<token>:`） |
| `MIXPANEL_REGION` | 否 | `us`（預設）、`eu` 或 `in`。僅適用於 proxy 自己的專案 |
| `MIXPANEL_ENDPOINT` | 否 | 選填的完整 OTLP 追蹤端點覆寫 |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | 否 | 設為 `span_only` 以包含 `gen_ai.input.messages` 與 `gen_ai.output.messages`（預設為 `no_content`） |
