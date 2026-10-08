# 工具政策 {#tool-policies}

工具政策是一個登錄檔，記錄 proxy 在流量中看過的每一個工具（OpenAI 和 Anthropic 請求 `tools`、回應工具呼叫，以及 MCP 工具呼叫），並且每個工具都有輸入政策與輸出政策。當請求通過 proxy 時，工具會自動被發現，而新發現的工具一開始會具有 `input_policy: "untrusted"` 和 `output_policy: "untrusted"`。Tool Policy Guardrail 會讀取這個登錄檔，並對請求與回應強制執行這些政策

登錄檔會保留工具名稱、來源、政策值、呼叫次數、當時使用它的團隊與金鑰（若可用）、user agent，以及首次與最近一次看見的時間戳記。變更政策絕不會重設呼叫次數，而後續呼叫也不會重設您設定的政策

## 工具政策與工具權限 Guardrail {#tool-policies-and-the-tool-permission-guardrail}

工具政策管理工具之間的信任關係。其輸入政策可允許不受信任的輸入、要求受信任的輸入，或封鎖工具。其輸出政策會將輸出標記為受信任或不受信任。被封鎖的輸入政策，或團隊／金鑰覆寫，會拒絕工具呼叫。當對話中包含來自某個輸出政策為不受信任的工具之輸出時，受信任的輸入政策會拒絕該工具

`untrusted` 輸入政策接受任何輸入，包括來自不受信任工具輸出的資料。`trusted` 輸入政策要求受信任的輸入。`blocked` 輸入政策會禁止該工具。`untrusted` 輸出政策可能包含不安全內容，並可觸發下游信任鏈封鎖。`trusted` 輸出政策會被視為已驗證安全，且不會觸發這些封鎖

[Tool Permission Guardrail](./guardrails/tool_permission) 提供另一套以規則為基礎的控制。它會比對已設定的工具名稱，並可選擇比對工具類型與參數，然後套用其設定的允許或拒絕動作。當授權取決於比對已設定的模式時，請使用 Tool Permission Guardrail 規則。當控制是基於已發現工具的信任分類，以及工具輸出與輸入之間的信任鏈時，請使用工具政策。兩種 guardrail 都可以在同一個 proxy 上執行，而且請求必須通過每一個已設定的 guardrail

## 快速開始 {#quick-start}

目前的 Admin UI 路由是 `http://localhost:4000/ui/tool-policies`。舊版 URL `http://localhost:4000/ui/?page=tool-policies` 會重新導向到此路由

工具政策僅供 proxy 管理員使用。其他角色會看到此頁面僅限管理員的訊息

總覽會顯示今日已發現的工具數、已發現工具總數、被封鎖的工具數，以及啟用中的團隊數。它也可以顯示仍使用預設不受信任輸入政策的新發現工具。表格支援搜尋、政策與團隊或金鑰篩選、重新整理，以及用戶端分頁。其欄位包含發現時間、工具名稱、輸入政策、輸出政策、呼叫次數、團隊名稱、金鑰雜湊、金鑰名稱，以及 user agent

選取工具名稱即可開啟其詳細檢視。詳細檢視會顯示來源、呼叫次數、user agent、首次發現時間與最近使用時間。使用 Input Policy 與 Output Policy 選擇器來儲存全域政策值。輸入政策為 `untrusted`、`trusted`、以及 `blocked`。輸出政策為 `untrusted` 與 `trusted`

詳細檢視也會顯示會封鎖該工具的團隊與金鑰覆寫。要新增覆寫，請選擇團隊或金鑰，並儲存封鎖的輸入政策。要移除覆寫，請在該團隊或金鑰旁選取 Remove。詳細檢視包含所選工具的最近使用記錄

## 管理 API {#management-api}

所有 Tool Policy 管理路由都需要 proxy 驗證。請在 `Authorization` 標頭中傳送 proxy master key

### 列出工具 {#list-tools}

`GET /v1/tool/list` 會回傳一個包含 `tools` 與 `total` 的物件。每一列工具都包含其政策與登錄檔中繼資料。您可以使用 `input_policy` 查詢參數依輸入政策篩選

```bash
curl "http://localhost:4000/v1/tool/list" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

若只列出被封鎖的工具：

```bash
curl "http://localhost:4000/v1/tool/list?input_policy=blocked" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

### 取得單一工具 {#get-one-tool}

`GET /v1/tool/{tool_name}` 會回傳單一工具列。當工具名稱包含在 URL 中具有意義的字元時，請對工具名稱進行 URL 編碼

```bash
curl "http://localhost:4000/v1/tool/example_tool" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

`GET /v1/tool/{tool_name}/detail` 會回傳工具列以及其 `overrides` 清單。此詳細路由由 Admin UI 使用

```bash
curl "http://localhost:4000/v1/tool/example_tool/detail" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

詳細回應具有以下結構：

```json
{
  "tool": {
    "tool_id": "tool-id",
    "tool_name": "example_tool",
    "input_policy": "untrusted",
    "output_policy": "untrusted"
  },
  "overrides": []
}
```

完整的工具列也可能包含 `origin`、`call_count`、`assignments`、`key_hash`、`team_id`、`key_alias`、`user_agent`、`last_used_at`、`created_at`、`updated_at`、`created_by`、以及 `updated_by`

### 取得政策選項 {#get-policy-options}

`GET /v1/tool/policy/options` 會回傳支援的輸入與輸出政策值，以及它們的標籤與描述

```bash
curl "http://localhost:4000/v1/tool/policy/options" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

回應具有 `input_policies` 與 `output_policies` 陣列。每個選項包含 `value`、`label`、以及 `description`：

```json
{
  "input_policies": [
    {
      "value": "untrusted",
      "label": "Untrusted",
      "description": "Tool accepts any input, including data from untrusted tool outputs. Default for newly discovered tools."
    }
  ],
  "output_policies": [
    {
      "value": "trusted",
      "label": "Trusted",
      "description": "Tool output is verified safe. Will not trigger trust-chain blocks on downstream tools."
    }
  ]
}
```

### 更新全域政策 {#update-a-global-policy}

`POST /v1/tool/policy` 接受一個 JSON 主體，內容包含 `tool_name`，以及 `input_policy` 或 `output_policy` 至少其中之一。輸入政策接受 `trusted`、`untrusted`、或 `blocked`。輸出政策接受 `trusted` 或 `untrusted`

```bash
curl -X POST "http://localhost:4000/v1/tool/policy" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "example_tool",
    "input_policy": "blocked",
    "output_policy": "untrusted"
  }'
```

必要時，此端點會 upsert 登錄檔列，並回傳 `tool_name`、提交的政策欄位，以及 `updated: true`。若省略兩個政策欄位，則會回傳 HTTP 400 與 `At least one of input_policy or output_policy must be provided`

### 新增或移除團隊或金鑰覆寫 {#add-or-remove-a-team-or-key-override}

同一個更新路由可以新增或移除某個團隊或某把金鑰的封鎖。請精確包含 `team_id` 或 `key_hash` 其中之一。將 `input_policy` 設為 `blocked` 以新增覆寫

```bash
curl -X POST "http://localhost:4000/v1/tool/policy" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "example_tool",
    "input_policy": "blocked",
    "team_id": "team-id"
  }'
```

對於金鑰覆寫，請使用 `key_hash` 代替 `team_id`。請求模型也接受 `key_alias`，作為更新路由回傳的金鑰中繼資料

```bash
curl -X POST "http://localhost:4000/v1/tool/policy" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "example_tool",
    "input_policy": "blocked",
    "key_hash": "key-hash",
    "key_alias": "production-key"
  }'
```

若要移除覆寫，請使用 `DELETE /v1/tool/{tool_name}/overrides`，並且只帶一個查詢參數：

```bash
curl -X DELETE "http://localhost:4000/v1/tool/example_tool/overrides?team_id=team-id" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

當覆寫被移除時，刪除路由會回傳 `{"deleted": true, "tool_name": "example_tool"}`。同時提供 `team_id` 與 `key_hash` 會被拒絕，並回傳 `Provide either team_id or key_hash, not both`

### 取得使用記錄 {#get-usage-logs}

詳細檢視會從 `GET /v1/tool/{tool_name}/logs` 讀取已呼叫工具的記錄。它支援 `page`、`page_size`、`start_date`、以及 `end_date` 查詢參數。日期值使用 `YYYY-MM-DD`

```bash
curl "http://localhost:4000/v1/tool/example_tool/logs?page=1&page_size=50" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

回應包含 `logs`、`total`、`page`、以及 `page_size`。記錄項目可包含請求 ID、時間戳記、模型、花費、總 tokens，以及輸入片段

## 強制執行 {#enforcement}

將 Tool Policy Guardrail 新增至 proxy 設定，以啟用政策強制執行：

```yaml
guardrails:
  - guardrail_name: "tool_policy"
    litellm_params:
      guardrail: tool_policy
      mode: post_call
```

此 guardrail 支援 `pre_call`、`post_call`、以及 `during_call` 事件掛鉤。對於請求，它會從請求中的 tools 或在 tools 清單不存在時從請求路由讀取工具名稱。對於回應，它會從回應的工具呼叫讀取工具名稱

當工具具有 `input_policy: "blocked"`，或團隊／金鑰覆寫將其封鎖時，guardrail 會拋出 HTTP 400。其呼叫者可見的例外詳細資料如下：

```json
{
  "detail": {
    "error": "Violated tool policy",
    "blocked_tools": ["example_tool"],
    "message": "Tool(s) ['example_tool'] are blocked by policy."
  }
}
```

當工具具有 `input_policy: "trusted"`，且對話中包含來自輸出政策為 `output_policy: "untrusted"` 的工具之輸出時，guardrail 也會拋出 HTTP 400。詳細資料包含 `blocked_tools`、`untrusted_sources`，以及一則指出 trusted-input 工具需要受信任輸入的訊息

HTTP 400 回應具有以下結構：

```json
{
  "detail": {
    "error": "Violated tool policy",
    "blocked_tools": ["trusted_tool"],
    "untrusted_sources": ["untrusted_tool"],
    "message": "trusted_tool requires trusted input but conversation contains untrusted output from untrusted_tool."
  }
}
```

如果記憶體中的政策註冊表尚未初始化，防護欄會在不套用工具政策的情況下回傳輸入。當工具資料庫物件載入時，閘道會從資料庫初始化註冊表；而當政策已經初始化後，政策更新會重新同步註冊表。

## 設定 {#configuration}

`TOOL_POLICY_CACHE_TTL_SECONDS` 是一個環境變數，預設值為 `60`。設定參考文件將其描述為用於快取 Tool Policy Guardrail 結果的 TTL（以秒為單位）：

```bash
export TOOL_POLICY_CACHE_TTL_SECONDS=60
```

請參閱 [Proxy 組態設定](./config_settings) 以取得完整的環境變數參考。

## 探索行為 {#discovery-behavior}

工具會在請求完成後非同步註冊，作為記錄花費的相同背景 flush 的一部分，因此工具可能需要幾秒鐘才會出現在註冊表中。工具名稱取自 MCP tool call metadata、OpenAI 格式的 request `tools`、Anthropic Messages request `tools`，以及回應中的 tool calls。工具詳細頁面上的使用記錄只會包含模型實際呼叫該工具的請求。
