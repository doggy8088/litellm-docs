---
title: "將 Langfuse 回呼移轉到 OpenTelemetry v2"
sidebar_label: "將 Langfuse SDK 回呼移轉到 OpenTelemetry v2"
description: "從 langfuse SDK 回呼移轉到 OpenTelemetry v2 上的 langfuse_otel。列出重大變更、移轉步驟、驗證方式與如何回復。"
---
# 將 Langfuse SDK 回呼移轉到 OpenTelemetry v2 {#migrate-the-langfuse-sdk-callback-to-opentelemetry-v2}

{/* keep-version-note */}

本指南將 proxy 從以 SDK 為基礎的 `langfuse` 回呼移轉到 OpenTelemetry v2 上的 `langfuse_otel` 回呼。開始前請先閱讀重大變更。在預設設定下，V2 傳送到 Langfuse 的資料遠多於 SDK 回呼，且不包含提示詞，因此單純更換回呼會同時改變您的 Langfuse 帳單與追蹤顯示的內容。

如果您已在未設定 `LITELLM_OTEL_V2` 的情況下執行 `langfuse_otel`，請改遵循[一般 V2 移轉指南](./opentelemetry_v2_migration)。

## 重大變更 {#breaking-changes}

以下每一項在您切換後立即生效，且每一項都有可恢復 SDK 行為的設定。

| 變更內容 | 切換後您會看到 | 處理方式 |
|---|---|---|
| **追蹤量。** V2 預設傳送整個請求樹 | 每個請求都會新增 HTTP、驗證、Postgres、Redis、防護欄、MCP 與支出寫入 span，而 `/model/info` 等管理呼叫會成為各自的追蹤。以相同請求率計算，Langfuse 擷取量可能增加一個數量級以上 | 為您自己的專案設定 `LITELLM_OTEL_LANGFUSE_SPAN_SCOPE=llm_only`，並為金鑰與團隊專案設定 `LITELLM_OTEL_LANGFUSE_DESTINATION_SPAN_SCOPE=llm_only` <SinceVersion v="1.111.0" />。在較舊版本上，請在每個金鑰與團隊回呼上設定 `langfuse_span_scope: llm_only` |
| **提示詞擷取。** V2 預設不擷取任何訊息內容 | Langfuse 中的輸入與輸出為空 | 設定 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=span_only`。這適用於 proxy 上的每個 V2 OTel 回呼。金鑰或團隊可以用 `capture_message_content` 覆寫 <SinceVersion v="1.108.0" /> |
| **預設主機。** 未設定 `LANGFUSE_HOST` 時，V2 傳送到美國雲端 (`https://us.cloud.langfuse.com`)，而 SDK 回呼使用歐盟雲端 (`https://cloud.langfuse.com`)。不會讀取 `LANGFUSE_BASE_URL` | 匯出送往錯誤的區域並以 401 失敗 | 明確設定 `LANGFUSE_HOST` |
| **儲存的金鑰與團隊回呼。** 已儲存的 `langfuse` 項目不會被轉換 | 這些金鑰與團隊會繼續透過 SDK 回呼記錄，或在您新增 `langfuse_otel` 後重複記錄 | 將每一項重新註冊為 `langfuse_otel` 並刪除舊項目 ([步驟 3](#3-move-key-and-team-callbacks)) |
| **密鑰欄位名稱。** V2 只讀取 `langfuse_secret_key` | 以較舊的 `langfuse_secret` 欄位儲存的項目會記錄到您的專案而非租戶的專案，且不會出現錯誤 | 重新註冊時使用 `langfuse_secret_key` |
| **自訂租戶主機。** 金鑰或團隊上的 `langfuse_host` 需要允許清單項目 | 該租戶的追蹤不會傳送到其主機，且 proxy 會記錄警告 | 將主機新增到 `provider_url_destination_allowed_hosts` |
| **其他 OTel 回呼。** `LITELLM_OTEL_V2=true` 會將 proxy 上的每個 OTel 回呼移到 V2，`logfire` 除外 | 您的 `otel`、Arize、Phoenix 與類似匯出也會改變 | 在設定該旗標前，請對照[一般 V2 移轉指南](./opentelemetry_v2_migration) 檢查它們 |
| **自架伺服器。** V2 匯出到 `/api/public/otel/v1/traces` | Langfuse v2 伺服器回傳 HTTP 404 | 請先升級伺服器。SDK 回呼自 v1.104.0 起使用相同端點，因此能配合您目前設定運作的該版本或更新版本伺服器即可 |

中繼資料欄位的形狀也會改變。在依賴儀表板、篩選或遮蔽之前，請先參閱[欄位變更](#field-changes)。

## 移轉 {#migrate}

### 1. 準備 {#1-prepare}

升級 proxy。<SinceVersion v="1.109.0" /> 是本指南假設的最低版本，因為這是第一個不需要 proxy 全域 Langfuse 金鑰即可讓金鑰與團隊專案運作的版本。

在 SDK 回呼上記錄固定樣本請求的 Langfuse 擷取量，作為比較基準。然後儲存您目前的 `callbacks`、`success_callback` 與 `failure_callback` 設定，以及每個已儲存的金鑰與團隊 `langfuse` 項目 (`GET /team/<team-id>/callback`、`GET /key/info`)。回復時您會需要這些。

### 2. 切換 proxy 回呼 {#2-switch-the-proxy-callback}

將 `langfuse` 取代為 `langfuse_otel`。從 `callbacks`、`success_callback` 與 `failure_callback` 中移除 `langfuse`，因為同時執行兩個回呼會讓每個請求記錄兩次。

```yaml
litellm_settings:
  callbacks: ["langfuse_otel"]
```

```shell
export LITELLM_OTEL_V2=true
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"   # your region or self-hosted URL
export LITELLM_OTEL_LANGFUSE_SPAN_SCOPE=llm_only
export LITELLM_OTEL_LANGFUSE_DESTINATION_SPAN_SCOPE=llm_only   # key and team projects
export OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=span_only
```

重新啟動 proxy。範圍值請確切拼寫為 `llm_only` 或 `full`。無效的 `LITELLM_OTEL_LANGFUSE_SPAN_SCOPE` 會讓每個 V2 回呼停止載入，且預設設定會悄悄退回較舊的 OTel 整合。

如果您只想在金鑰與團隊專案中有追蹤、不要 proxy 全域的 Langfuse 專案，請省略 `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY` 與 `callbacks` 行，並保留 `LITELLM_OTEL_V2=true`。

### 3. 移轉金鑰與團隊回呼 {#3-move-key-and-team-callbacks}

在每個先前有 `langfuse` 項目的團隊上以相同憑證註冊 `langfuse_otel`，然後刪除舊項目。

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "langfuse_otel",
    "callback_type": "success",
    "callback_vars": {
      "langfuse_public_key": "pk-lf-...",
      "langfuse_secret_key": "sk-lf-...",
      "langfuse_span_scope": "llm_only",
      "capture_message_content": "span_only"
    }
  }'

curl -X DELETE 'http://localhost:4000/team/<team-id>/callback/langfuse' \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

對於金鑰，請透過 `/key/update` 或管理 UI 中該金鑰的記錄設定，將其 `metadata.logging` 中的 `langfuse` 項目取代為相同物件。設定了 `LITELLM_OTEL_LANGFUSE_DESTINATION_SPAN_SCOPE` 時，您可以從每個項目省略 `langfuse_span_scope`。請使用 `callback_type: success`。V2 在請求有結果之前就選定目的地，因此 success 項目也會收到該租戶失敗的請求。

如果金鑰或團隊設定了 `langfuse_host`，請連同其金鑰對一起傳入，並將主機加入允許清單。您自己的 `LANGFUSE_HOST` 不需要項目。

```yaml
litellm_settings:
  provider_url_destination_allowed_hosts: ["langfuse.example.com"]
```

金鑰或團隊專案會取代您自己的專案來處理該請求。若也要在您的專案保留一份，請在 `litellm_settings` 下設定 `otel_tenant_destination_mode: additive`。完整路由規則請參閱[依金鑰與依團隊的憑證](./opentelemetry_v2#per-key--per-team-credentials-multi-tenant)。

### 4. 在預備環境驗證 {#4-verify-on-staging}

將預備環境指向獨立的 Langfuse 專案，並傳送一個一般請求、一個串流請求、一個在提供者處失敗的請求，以及 (如果您使用防護欄) 一個被防護欄阻擋的請求。請傳送與您的應用程式在正式環境相同的中繼資料與遮蔽設定。

在 Langfuse 中開啟每個追蹤的觀察樹，計算樹中的觀察數量，而非追蹤清單中的列數。在 `llm_only` 下，您應該看到每次提供者呼叫一個 generation，除此之外沒有其他內容，且輸入、輸出、token 使用量、成本、追蹤名稱、使用者、工作階段與標籤都已填入。在模型呼叫之前被防護欄阻擋時，`llm_only` 下不會留下任何內容。來自具有自己回呼的金鑰或團隊的請求，應落在該專案中。將您樣本的擷取量與步驟 1 的基準比較。

### 5. 推出 {#5-roll-out}

分階段推出。監看 proxy 記錄中的匯出器錯誤，其中 404 表示伺服器沒有 OTLP 端點，401 表示金鑰對或區域錯誤；並監看 Langfuse 擷取量。使用[欄位變更](#field-changes) 更新儀表板與已儲存的篩選。

## 回復 {#roll-back}

還原已儲存的回呼設定與已儲存的金鑰與團隊 `langfuse` 項目，移除 `langfuse_otel`，如果您只是為了此次移轉才開啟 `LITELLM_OTEL_V2` 請取消設定它，然後重新啟動。在 `langfuse_otel` 仍設定時關閉該旗標，並不會帶回 SDK 回呼。它會將 `langfuse_otel` 改為較舊的 OTel 整合。將所有流量送回之前，請先確認有一個 generation 透過 SDK 回呼送達。

## 欄位變更 {#field-changes}

| SDK 回呼欄位 | 在 V2 上 |
|---|---|
| `trace_name`、`langfuse_trace_name` 標頭 | 不變。未設定名稱時，`full` 追蹤命名為 `litellm-{call_type}`，而 `llm_only` 追蹤採用 generation 的名稱 |
| `generation_name` | 忽略。Generation 命名為 `{operation} {model}`，例如 `chat gpt-4o`，而 SDK 回呼使用的是 `litellm:{key_alias}` 或 `litellm-{call_type}`。請更新名稱篩選 |
| `trace_user_id`、`langfuse_trace_user_id` 標頭 | 不變，但不再退回使用終端使用者 ID |
| `session_id`、`langfuse_session_id` 標頭 | 不變 |
| `tags` | 不變。包含金鑰標籤、團隊標籤與 `x-litellm-tags` 標頭 |
| `trace_release`、`trace_version`、`LANGFUSE_TRACING_ENVIRONMENT` | 已對應 <SinceVersion v="1.111.0" />。不會讀取 `LANGFUSE_RELEASE` |
| `trace_id`、`existing_trace_id`、`update_trace_keys` | 忽略。使用 W3C `traceparent` 標頭連結追蹤。V2 無法更新現有追蹤 |
| `generation_id`、`parent_observation_id` | 忽略。觀察 ID 是 LiteLLM 呼叫 ID，呼叫者可以用 `x-litellm-call-id` 標頭設定 |
| `trace_metadata`、自訂 generation 中繼資料 | 不會傳遞。使用 `LITELLM_OTEL_BAGGAGE_METADATA_KEYS` 將您需要的金鑰加入允許清單，請參閱[請求身分](./opentelemetry_v2#request-identity-on-every-span) |
| Usage `cache_read_input_tokens`、`cache_creation_input_tokens` | 重新命名為 `input_cached_tokens` 與 `input_cache_creation`。推理 token 從 `output` 移出到 `output_reasoning_tokens` |
| `mask_input`、`mask_output`、`langfuse_masking_function` | 忽略。開啟擷取時，依賴它們的呼叫者會傳送其提示詞。請使用搭配 `llm_only` 的 `turn_off_message_logging`，或在該目的地使用 `capture_message_content: no_content` |
| `redact_user_api_key_info` | 仍會從 Langfuse 中繼資料中去除金鑰欄位，但不會去除 V2 新增到每個 span 的 `litellm.metadata.user_api_key_alias`、`user_api_key_user_id`、`user_api_key_end_user_id` 與 `user_api_key_org_id` 屬性 |
| Langfuse prompt 連結 | 不支援。Generation 不再連結到 Langfuse 提示詞 |
| `debug_langfuse` | 忽略 |

## 改為保留完整追蹤 {#keep-the-full-trace-instead}

如果您想在 Langfuse 中有驗證、資料庫、快取與防護欄 span，請將兩個範圍都設為 `full`。未設定也表示 `full`，但明確設定可以記錄有人已接受額外的擷取量。

```shell
export LITELLM_OTEL_LANGFUSE_SPAN_SCOPE=full
export LITELLM_OTEL_LANGFUSE_DESTINATION_SPAN_SCOPE=full
```

計算觀察數量的儀表板不再計算 LLM 呼叫。請以模型呼叫觀察 (例如 `chat gpt-4o`) 篩選使用量與成本，並使用完整樹查看延遲與失敗。支出寫入與背景資料庫輪詢會以獨立追蹤送達，而在模型呼叫之前被阻擋的請求沒有 generation。

:::warning `full` 下的遮蔽

開啟擷取時，`turn_off_message_logging` 只遮蔽 generation。請求根 span (`POST /v1/chat/completions`) 仍帶有原始提示詞與回應，包括 `no-log` 請求，且 MCP 工具引數、工具結果與防護欄回應會未經遮蔽傳送。如果提示詞不得送達 Langfuse，請使用 `llm_only`。`full` 下的 `no_content` 仍會傳送防護欄回應，因此也請與 `llm_only` 搭配。

:::

所有 V2 設定請參閱 [OpenTelemetry v2](./opentelemetry_v2)。
