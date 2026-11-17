# 使用量遙測 {#usage-telemetry}

LiteLLM proxy 可以統計發送給它的請求結果、它呼叫了哪些提供者，以及使用者開啟了哪些 Admin UI 頁面，然後將這些計數交給您設定的 HTTP 端點，或保留在它自己的資料庫中。每個群組都是**除非您開啟，否則為關閉**；在您選定目的地之前，不會記錄任何內容；除非該目的地是 `http`，否則沒有任何內容會離開您的部署。沒有預設端點，因此報告只會送到您在 `LITELLM_TELEMETRY_ENDPOINT` 中設定的 URL。

<SinceVersion v="1.107.0" />

遙測永遠不包含提示、completions、API 金鑰、使用者 id、團隊 id、模型名稱、IP 位址、標頭值或請求主體。它能產生的每個欄位都列在本頁；未在記錄綱要中宣告的欄位無法匯出。Token 計數只會逐列加總，永遠不會逐請求保留。

## 開啟它 {#turn-it-on}

使用環境變數開啟群組並選定目的地。`LITELLM_TELEMETRY_GROUPS` 會讓整個 Telemetry 頁面變成唯讀，包括目的地，因此請同時設定 `LITELLM_TELEMETRY_DESTINATION`。單獨的 `LITELLM_TELEMETRY_DESTINATION` 只會鎖定目的地：

```bash
export LITELLM_TELEMETRY_GROUPS=heartbeat,request_success,token_info
export LITELLM_TELEMETRY_DESTINATION=http   # or local_table
export LITELLM_TELEMETRY_ENDPOINT=https://telemetry.example.com/v1/reports   # needed for http
```

proxy 管理員也可以透過 API 儲存群組與目的地。這需要資料庫，且在 `LITELLM_TELEMETRY_GROUPS` 或 `LITELLM_TELEMETRY_DISABLED` 已設定時會被拒絕：

```bash
curl -s -X PUT http://localhost:4000/telemetry/settings \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H 'content-type: application/json' \
  -d '{"groups": ["heartbeat", "request_success"], "destination": "local_table"}'
```

儲存的選擇會保存在 `LiteLLM_Config` 表格中，因此在重新啟動後仍然有效，並在下一個報告時段送達每個 worker。每次呼叫都會同時取代群組與目的地，因此除非已設定 `LITELLM_TELEMETRY_DESTINATION`，每次都要傳送 `destination`。未傳送它的呼叫不會儲存目的地，proxy 隨後將不記錄任何內容並記錄一則警告。環境變數與 API 都不會檢查企業授權。

proxy 管理員可以在 Admin UI 的 **Settings > Telemetry**（`/ui/telemetry`）查看已開啟的項目。該頁面有 Proxy requests 與 Admin UI 兩個分頁，說明每個群組傳送的內容、報告送往何處與頻率，並顯示此 worker 上次傳送的報告，或在第一份報告之前，顯示一份以虛構流量建立的範例報告。此頁面無法開啟遙測。每個會開啟群組或設定第一個目的地的控制項都不會儲存任何內容，而是開啟一個對話框，或在遙測關閉時停用。在企業授權下，它會請您聯絡您的 LiteLLM 企業代表；沒有企業授權時，它會說明遙測是企業功能。因此，此頁面只能關閉透過 API 儲存的群組，或切換已經設定的目的地。

若要保證無論透過 UI 或 API 儲存了什麼，遙測都保持關閉，請設定 `LITELLM_TELEMETRY_DISABLED=true`。它優先於 `LITELLM_TELEMETRY_GROUPS` 與已儲存的設定。每當有效的 `LITELLM_TELEMETRY_*` 變數已設定時，Admin UI 會顯示一個橫幅，列出它們的名稱（永遠不會顯示其值）。

無效的值，例如未知的群組、缺少其所需群組的群組、不是 HTTP 或 HTTPS URL 的端點，或沒有端點的 `LITELLM_TELEMETRY_DESTINATION=http`，會讓遙測保持關閉，Telemetry 頁面保持唯讀，且不顯示橫幅。proxy 仍會啟動，並記錄一則指出該變數名稱的警告。

目的地有兩種，proxy 永遠不會替您選定：

| 目的地 | 報告送往何處 | 需要 |
| --- | --- | --- |
| `http` | 每個 worker 在每個時段向 `LITELLM_TELEMETRY_ENDPOINT` POST 一份 JSON 報告，並在關閉時再 POST 一次。在網路錯誤、5xx、408、409 或 429 之後，下一份報告會從失敗的時段開始並加上其計數，除非群組或目的地先變更。報告不帶 id，因此儲存了失敗 POST 的接收端會將該時段計算兩次。任何其他回應都會捨棄該報告，且關閉報告永遠不會重試 | `LITELLM_TELEMETRY_ENDPOINT`。沒有它，`LITELLM_TELEMETRY_DESTINATION=http` 會讓遙測保持關閉，且 UI 無法儲存 `http` |
| `local_table` | 每個 worker 在每個時段將一份報告儲存在 `LiteLLM_TelemetryReport` 表格中，保留 `LITELLM_TELEMETRY_RETENTION_DAYS`。沒有任何內容會離開 proxy，隔離網路的安裝可以手動匯出報告（請參閱[匯出報告](#export-reports)） | 資料庫 |

如果群組已開啟但未選擇目的地，或所選目的地無法使用，則不會記錄任何內容，proxy 會記錄一則警告。Telemetry 頁面只會標示缺少目的地，因此已儲存的 `http` 目的地即使其 `LITELLM_TELEMETRY_ENDPOINT` 之後被移除，仍會在該處顯示為目的地。既沒有資料庫也沒有 `LITELLM_TELEMETRY_ENDPOINT` 的 proxy 不會記錄任何內容，也不會記錄警告。從 UI 切換的目的地會在每個 worker 的下一個報告時段生效，與群組相同。`LITELLM_TELEMETRY_DESTINATION` 優先於已儲存的目的地。

## 群組 {#groups}

每個群組都需要它所依賴的那個群組。`token_info` 與 `request_taxonomy` 都建立在 `request_success` 之上，因此任一個都可以在沒有另一個的情況下開啟。關閉群組會在任何計數之前移除其欄位，因此只在那些欄位上不同的列會合併為一列。

| 群組 | 需要 | 新增 |
| --- | --- | --- |
| `heartbeat` | | 報告標頭：執行個體 id、版本、時段與已開啟的群組。只有這個群組時，報告沒有任何列 |
| `request_success` | `heartbeat` | 請求列，包含端點、狀態類別、串流、LiteLLM 快取命中、請求是否由 Rust 閘道處理、請求計數、提供者嘗試次數與兩個延遲直方圖 |
| `token_info` | `request_success` | 每個請求列上的 token 總和與提供者提示快取命中 |
| `request_taxonomy` | `request_success` | 每個請求列上的提供者與部署雜湊，加上提供者嘗試列 |
| `event_details` | `request_taxonomy` | 每個請求列上的區塊計數、區塊類型與允許清單中的標頭名稱 |
| `instance_configuration` | `heartbeat` | 已設定的允許清單設定鍵名稱。目前尚無任何內容填入，因此它新增的是一個空清單 |
| `page_navigation` | `heartbeat` | Admin UI 頁面檢視與分頁切換 |

## 報告包含什麼 {#what-a-report-contains}

每個 worker 會將它看到的內容彙整到記憶體內的計數器，並在每 5 分鐘的時段發出一份報告。報告是計數、總和與固定區間直方圖，而不是個別請求。

**報告標頭**

| 欄位 | 意義 |
| --- | --- |
| `schema_version` | 報告格式的版本 |
| `window_start`、`window_end` | 時段的 Unix 時間戳記 |
| `instance.instance_id` | 儲存在 proxy 資料庫中的隨機 id，對每個 worker 都相同，且在重新啟動後保持不變。沒有資料庫時，每個 worker 會在每次啟動時產生新的 id |
| `instance.litellm_version` | 正在執行的 LiteLLM 版本 |
| `instance.groups` | 已開啟的群組 |
| `instance.config_keys` | 僅 `instance_configuration`。已設定的允許清單設定鍵名稱，永遠不包含其值。目前為空 |
| `dropped_records` | 放不下的記錄，因為一個時段最多容納 2000 個不同的列 |

只有對 LLM 與提供者 pass-through 路由的 POST 請求、MCP 請求，以及路徑以 `/message/send` 結尾的 A2A 請求會被計數。對 `POST /a2a/{agent_id}`（代理程式卡所公布的 URL）的 JSON-RPC 呼叫永遠不會被計數，因此使用該 URL 的 A2A 用戶端不會留下任何列。管理與管理用路由以及如 `/v1/realtime` 的 websocket 路由永遠不會被計數；您在設定中定義的 pass-through 端點，只有在其路徑以 LLM 路由的形式結尾時才會被計數，例如 `/chat/completions`。

提供者 pass-through 請求會被計數，但其列目前沒有提供者、提供者嘗試次數或 token 計數，但您模型清單上模型的 Bedrock 與 GigaChat 請求除外。大多數會記錄在其前綴之下，因此 `/anthropic/v1/messages` 會顯示為 `/anthropic`。以 LLM 路由形式結尾的 pass-through 路徑會改記錄在該路由之下，因此 `/openai/v1/chat/completions` 會顯示為 `/chat/completions`，看起來像是一個未呼叫任何提供者的原生請求。

**請求列**針對每個不同的組合保存一列：

| 欄位 | 意義 |
| --- | --- |
| `endpoint` | 比對到的路由，例如 `/chat/completions`、`/v1/messages`、`:generateContent`，或如 `/anthropic`、`/mcp` 或 `/a2a` 的 pass-through 前綴。永遠不會是原始路徑 |
| `handled_by_rust` | 回應是否來自 Rust 閘道，從其 `x-litellm-rust: true` 回應標頭讀取 |
| `provider` | 僅 `request_taxonomy`。提供該請求的部署的提供者，例如 `anthropic`，或在未呼叫任何提供者時為 `null` |
| `deployment_hash` | 部署 id 的 HMAC-SHA256 的前 16 個十六進位字元，其金鑰是 proxy 建立一次並保存在 `LiteLLM_Config` 中的隨機機密，因此它在不同 worker 與重新啟動之間保持相同，且無法跨安裝比對。沒有資料庫的 proxy 會改以 `LITELLM_SALT_KEY` 或 master key 作為金鑰，因此共用該金鑰的 proxy 會產生相同的雜湊，而兩者都沒有時，每個 worker 會在每次啟動時選取隨機金鑰。在啟動時無法讀取已儲存機密的 worker，會使用 salt key 直到它重新啟動 |
| `litellm_status` | 用戶端得到的狀態類別：`2xx`、`3xx`、`4xx`、`5xx` |
| `provider_status` | 最後一次提供者呼叫的狀態類別：`2xx` 到 `5xx`，在沒有提供者回應到達時為 `timeout` 與 `connection_error`，或在未呼叫任何提供者時為 `none` |
| `litellm_cache_hit` | 是否由 LiteLLM 回應快取回答 |
| `provider_cache_hit` | 僅 `token_info`。最後一次提供者呼叫是否回報了提示快取讀取 |
| `stream` | 回應是否為 `text/event-stream` 串流。其他串流回應，例如 Bedrock 事件串流或串流的 `/audio/speech`，會顯示為 `false` |

LiteLLM 快取命中是上述 `provider` 與 `provider_status` 規則的例外。其列帶有該部署的 `provider` 與 `2xx` 的 `provider_status`，並在有 `token_info` 時帶有快取回應的 token 計數，但 `provider_attempts` 為 0。

每個請求列帶有 `request_count`，以及用戶端所見的 `latency_to_headers_ms` 與 `latency_to_first_byte_ms` 直方圖，從 proxy 收到請求起測量到其回應標頭與第一個非空的回應主體區塊。沒有總延遲，因為對串流而言，它大多反映回應的長度。每列也帶有 `provider_attempts`（重試與備援所進行的提供者呼叫次數）。有 `token_info` 時，它還帶有 `input_tokens`、`output_tokens` 與 `cache_read_tokens` 的總和。有 `event_details` 時，它還帶有 `block_count` 直方圖、`block_types` 計數（`text`、`image`、`audio`、`file`、`tool_use`、`tool_result`、`thinking`、`other`）與 `header_keys` 計數。

區塊只從請求的 `messages` 清單計數，因此沒有該清單的請求（例如 embeddings）的列，其區塊計數為空。

`header_keys` 只列出固定允許清單中的標頭名稱：`anthropic-beta`、`anthropic-version`、`openai-beta`、`openai-organization`、`x-litellm-api-key`、`x-litellm-disable-callbacks`、`x-litellm-enable-message-redaction`、`x-litellm-num-retries`、`x-litellm-tags`、`x-litellm-timeout`、`x-stainless-lang` 與 `x-stainless-package-version`。任何其他標頭都計為 `other`。標頭值永遠不會被讀取。

**提供者嘗試列**（`request_taxonomy`）會計數每一次個別的提供者呼叫，以 `provider`（呼叫沒有提供者時為 `unknown`）、`deployment_hash`、`provider_status` 與 `stream` 為鍵，帶有 `attempt_count` 與只有串流嘗試才會填入的 `latency_to_first_token_ms` 直方圖。沒有總嘗試延遲，因為對串流而言，它大多反映回應的長度。在路由之前被 proxy 拒絕的請求，例如無效的金鑰或超出預算，不會新增嘗試列。

**Admin UI 事件**（`page_navigation`）會將頁面檢視與分頁點擊計為 `page`、`action` 與 `target`，例如 `{"page": "playground", "action": "click", "target": "tab=compare", "count": 1}`。儀表板會傳送其路由的第一段作為頁面，其中永遠不包含 id。proxy 只檢查 `page` 是否至多為 48 個小寫字母與連字號，因此任何直接呼叫 `POST /telemetry/ui_events` 的已登入使用者都可以在該處放入任何這類字詞，包括如 `claude-haiku` 的模型名稱。瀏覽器會先向 proxy 詢問 `page_navigation` 是否開啟，只有在開啟時才將這些事件傳送到 proxy 自己的 `POST /telemetry/ui_events` 路由，永遠不會傳送給第三方。

延遲直方圖使用 50、100、250、500、1000、2500、5000、10000、30000、60000 與 120000 ms 的區間邊界。每個區間計數至多到其邊界（含）的值，最後一個區間計數任何更慢的值。報告中的每個直方圖都是一個物件，帶有 `counts`（每個區間一個）與 `invalid`（被排除在區間之外的負數、NaN 或無限值的數量）。邊界不會被傳送。它們對給定的 `schema_version` 是固定的，變更它們會使版本遞增。對 `schema_version` 1 而言，`block_count` 使用 1、5、20 與 100 的邊界，`provider_attempts` 使用 0、1、2 與 3，每個都有一個最後區間計數任何更高的值。

## 匯出報告 {#export-reports}

當報告保存在本機時，proxy 管理員或管理員檢視者可以逐頁瀏覽它們：

```bash
curl -s "http://localhost:4000/telemetry/reports?limit=500" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

回應包含 `reports` 以及 `next_after` 與 `next_after_id`。將它們以 `after` 與 `after_id` 傳回即可取得下一頁，直到 `next_after` 為 `null`。`limit` 預設為 500，最高可達 5000。另一個 worker 可能在較新的報告匯出後才提交一份報告，因此當您恢復後續匯出時，請從上次游標的幾個時段之前開始，並跳過您已有的報告 id。沒有列的時段不會被儲存，因此只有 `heartbeat` 開啟時，表格會保持空白。每當 worker 儲存一份報告時，它會刪除早於 `LITELLM_TELEMETRY_RETENTION_DAYS`（預設為 30）的報告，因此在流量停止後，舊報告會保留到下一份報告被儲存為止。

## 設定 {#settings}

| 環境變數 | 說明 |
| --- | --- |
| `LITELLM_TELEMETRY_DISABLED` | `true` 會強制關閉每個群組，無論其他地方設定了什麼 |
| `LITELLM_TELEMETRY_GROUPS` | 以逗號分隔的要開啟的群組。設定時，它會覆寫 Admin UI 設定，空值表示關閉 |
| `LITELLM_TELEMETRY_DESTINATION` | `local_table` 或 `http`。設定時，它會覆寫儲存在 Admin UI 中的目的地。兩者都未設定時，不會記錄任何內容 |
| `LITELLM_TELEMETRY_ENDPOINT` | 當目的地為 `http` 時，接收每個時段一份 JSON 報告的 HTTP 或 HTTPS URL。proxy 只傳送 `content-type` 與 `user-agent` 標頭，不傳送驗證標頭，因此需要 token 的接收端必須從 URL 讀取它 |
| `LITELLM_TELEMETRY_SETTLE_TIMEOUT_SECONDS` | 已完成的請求在其列被寫入之前，等待其提供者嘗試被記錄的時間。預設為 `2` |
| `LITELLM_TELEMETRY_RETENTION_DAYS` | 保存在本機的報告的保留時間。預設為 `30` |

舊的 `--telemetry` CLI 旗標仍可解析，但不做任何事。
