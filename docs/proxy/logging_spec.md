# StandardLoggingPayload 規格 {#standardloggingpayload-specification}

終端成功與失敗回呼事件在 LiteLLM 完成建構標準負載時包含 `kwargs["standard_logging_object"]`。自訂記錄回呼應從 `kwargs["standard_logging_object"]["metadata"]` 讀取請求身分，而不是原始 `litellm_params` 中繼資料。當無法取得時，選用身分欄位為 `null`。中間串流事件以及負載建構失敗的回呼可省略 `standard_logging_object`。

## 標準記錄負載 {#standardloggingpayload}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `id` | `str` | 唯一識別碼 |
| `trace_id` | `str` | 追蹤屬於同一整體請求的多個 LLM 請求 |
| `session_id` | `str` | 來自 `litellm_session_id` 的終端使用者／對話工作階段 ID。獨立於 `trace_id`；僅在啟用 `litellm_settings.request_correlation_in_logs` 時填入。[進一步文件](./debugging#request-correlation-ids) |
| `call_type` | `str` | 呼叫類型 |
| `response_cost` | `float` | 回應的 USD（$）成本 |
| `cost_breakdown` | `Optional[CostBreakdown]` | 詳細成本明細物件 |
| `response_cost_failure_debug_info` | `StandardLoggingModelCostFailureDebugInformation` | 成本追蹤失敗時的偵錯資訊 |
| `zero_cost_diagnostic` | `Optional[StandardLoggingZeroCostDiagnostic]` | 為何可計費請求定價為 $0。當成本非零、模型為免費或未對應，或請求未帶有任何用量時，`None`。[進一步文件](./cost_tracking#requests-that-price-to-0) |
| `status` | `StandardLoggingPayloadStatus` | 負載狀態 |
| `status_fields` | `StandardLoggingPayloadStatusFields` | 供輕鬆篩選與分析的型別化狀態欄位 |
| `total_tokens` | `int` | Token 總數 |
| `prompt_tokens` | `int` | Prompt token 數量 |
| `completion_tokens` | `int` | Completion token 數量 |
| `startTime` | `float` | 呼叫開始時間 |
| `endTime` | `float` | 呼叫結束時間 |
| `completionStartTime` | `float` | 串流請求的首個 token 所需時間 |
| `response_time` | `float` | 總回應時間。若為串流，則為首個 token 所需時間 |
| `model_map_information` | `StandardLoggingModelInformation` | 模型對應資訊 |
| `model` | `str` | 在請求中送出的模型名稱 |
| `model_id` | `Optional[str]` | 所使用部署的模型 ID |
| `model_group` | `Optional[str]` | 用於請求的 `model_group` |
| `api_base` | `str` | LLM API 基底 URL |
| `metadata` | `StandardLoggingMetadata` | 中繼資料資訊 |
| `cache_hit` | `Optional[bool]` | 是否命中快取 |
| `cache_key` | `Optional[str]` | 選用快取金鑰 |
| `saved_cache_cost` | `float` | 由快取節省的成本 |
| `request_tags` | `list` | 請求標籤清單 |
| `end_user` | `Optional[str]` | 選用終端使用者識別碼 |
| `requester_ip_address` | `Optional[str]` | 選用請求者 IP 位址 |
| `messages` | `Optional[Union[str, list, dict]]` | 在請求中送出的訊息 |
| `response` | `Optional[Union[str, list, dict]]` | LLM 回應 |
| `error_str` | `Optional[str]` | 選用錯誤字串 |
| `error_information` | `Optional[StandardLoggingPayloadErrorInformation]` | 選用錯誤資訊 |
| `model_parameters` | `dict` | 模型參數 |
| `hidden_params` | `StandardLoggingHiddenParams` | 隱藏參數 |
| `guardrail_information` | `Optional[list[StandardLoggingGuardrailInformation]]` | 針對該請求執行的每個 guardrail 各一筆 |

## 成本分解 {#cost-breakdown}

`cost_breakdown` 欄位會提供 completion 請求的詳細成本分解，作為一個 `CostBreakdown` 物件，包含：

- **`input_cost`**：輸入/prompt token 的成本，包含快取建立 token
- **`output_cost`**：輸出/completion token 的成本（如適用，包含 reasoning token）
- **`tool_usage_cost`**：內建工具使用的成本（例如：web search、code interpreter）
- **`total_cost`**：輸入 + 輸出 + 工具使用的總成本
- **`reasoning_cost`**：reasoning token 的成本，回報為 `output_cost` 的子集（當模型回傳 reasoning token 時填入，例如 `{{gemini_flash}}`、`o3`）
- **`cache_read_cost`**：cache-read token 的成本，回報為 `input_cost` 的子集（當回應中存在已快取 token 時填入）
- **`cache_creation_cost`**：cache-creation token 的成本，回報為 `input_cost` 的子集（當使用 prompt caching 時填入，例如 Anthropic models）

**注意**：此欄位會為所有呼叫類型填入。對於非 completion 呼叫，`input_cost` 與 `output_cost` 可能為 0。

總成本關係為：`response_cost = cost_breakdown.total_cost`

### CostBreakdown 型別 {#costbreakdown-type}

```python
class CostBreakdown(TypedDict, total=False):
    input_cost: float           # Cost of input/prompt tokens in USD
    output_cost: float          # Cost of output/completion tokens in USD (includes reasoning)
    tool_usage_cost: float      # Cost of built-in tools usage in USD
    total_cost: float           # Total cost in USD
    reasoning_cost: float       # Cost of reasoning tokens in USD; subset of output_cost
    cache_read_cost: float      # Cost of cache-read tokens in USD; subset of input_cost
    cache_creation_cost: float  # Cost of cache-creation tokens in USD; subset of input_cost
```

## 標準記錄使用者 API 金鑰中繼資料 {#standardlogginguserapikeymetadata}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `user_api_key_hash` | `Optional[str]` | litellm virtual key 的雜湊值 |
| `user_api_key_alias` | `Optional[str]` | API 金鑰的別名 |
| `user_api_key_org_id` | `Optional[str]` | 與金鑰相關聯的組織 ID |
| `user_api_key_team_id` | `Optional[str]` | 與金鑰相關聯的團隊 ID |
| `user_api_key_user_id` | `Optional[str]` | 與金鑰相關聯的使用者 ID |
| `user_api_key_end_user_id` | `Optional[str]` | 與金鑰相關聯的終端使用者 ID |
| `user_api_key_team_alias` | `Optional[str]` | 與金鑰相關聯的團隊別名 |

## 標準記錄中繼資料 {#standardloggingmetadata}

繼承自 `StandardLoggingUserAPIKeyMetadata` 並新增：

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `spend_logs_metadata` | `Optional[dict]` | 用於支出記錄的鍵值對 |
| `requester_ip_address` | `Optional[str]` | 請求者的 IP 位址 |
| `requester_metadata` | `Optional[dict]` | 額外的請求者中繼資料 |
| `vector_store_request_metadata` | `Optional[List[StandardLoggingVectorStoreRequest]]` | 向量儲存區請求中繼資料 |
| `requester_custom_headers` | Dict[str, str] | 用戶端送至 proxy 的任何自訂（`x-`）標頭。 |
| `prompt_management_metadata` | `Optional[StandardLoggingPromptManagementMetadata]` | Prompt 管理與版本控管中繼資料 |
| `mcp_tool_call_metadata` | `Optional[StandardLoggingMCPToolCall]` | MCP（Model Context Protocol）工具呼叫資訊與成本追蹤 |
| `applied_guardrails` | `Optional[List[str]]` | 已套用的 guardrail 名稱清單 |
| `usage_object` | `Optional[dict]` | 來自 LLM 提供者的原始用量物件 |
| `cold_storage_object_key` | `Optional[str]` | 供冷儲存擷取用的 S3/GCS 物件金鑰 |

## 標準記錄向量儲存請求 {#standardloggingvectorstorerequest}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| vector_store_id | Optional[str] | 向量儲存的 ID |
| custom_llm_provider | Optional[str] | 與向量儲存相關聯的自訂 LLM 提供者（例如：bedrock、openai、anthropic） |
| query | Optional[str] | 對向量儲存的查詢 |
| vector_store_search_response | Optional[VectorStoreSearchResponse] | OpenAI 格式的向量儲存搜尋回應 |
| start_time | Optional[float] | 向量儲存請求的開始時間 |
| end_time | Optional[float] | 向量儲存請求的結束時間 |

## 標準記錄額外標頭 {#standardloggingadditionalheaders}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `x_ratelimit_limit_requests` | `int` | 請求的速率限制 |
| `x_ratelimit_limit_tokens` | `int` | token 的速率限制 |
| `x_ratelimit_remaining_requests` | `int` | 速率限制中剩餘的請求數 |
| `x_ratelimit_remaining_tokens` | `int` | 速率限制中剩餘的 token 數 |

## 標準記錄隱藏參數 {#standardlogginghiddenparams}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `model_id` | `Optional[str]` | 可選的模型 ID |
| `cache_key` | `Optional[str]` | 可選的快取金鑰 |
| `api_base` | `Optional[str]` | 可選的 API base URL |
| `response_cost` | `Optional[str]` | 可選的回應成本 |
| `additional_headers` | `Optional[StandardLoggingAdditionalHeaders]` | 額外標頭 |
| `batch_models` | `Optional[List[str]]` | 僅供 Batches API 設定。列出用於成本計算的模型 |
| `litellm_model_name` | `Optional[str]` | 在請求中送出的模型名稱 |

## 標準記錄模型資訊 {#standardloggingmodelinformation}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `model_map_key` | `str` | 模型對應鍵 |
| `model_map_value` | `Optional[ModelInfo]` | 可選的模型資訊 |

## 標準記錄模型成本失敗除錯資訊 {#standardloggingmodelcostfailuredebuginformation}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `error_str` | `str` | 錯誤字串 |
| `traceback_str` | `str` | 回溯字串 |
| `model` | `str` | 模型名稱 |
| `cache_hit` | `Optional[bool]` | 是否命中快取 |
| `custom_llm_provider` | `Optional[str]` | 可選的自訂 LLM 提供者 |
| `base_model` | `Optional[str]` | 可選的基礎模型 |
| `call_type` | `str` | 呼叫類型 |
| `custom_pricing` | `Optional[bool]` | 是否使用自訂定價 |

## StandardLoggingZeroCostDiagnostic {#standardloggingzerocostdiagnostic}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `reason` | `Literal["missing_pricing_key", "pricing_not_applied", "cost_calculation_error"]` | 請求為何定價為 $0，與 `litellm_zero_cost_requests_total` 上的 `reason` 標籤值相同 |
| `pricing_model` | `str` | 該請求被判定所依據的定價項目，即部署 id 或模型成本對應表鍵值 |
| `missing_pricing_keys` | `Tuple[str, ...]` | 該項目未宣告、但用量需要的費率鍵；除非 `reason` 為 `missing_pricing_key`，否則為空 |

## 標準記錄負載錯誤資訊 {#standardloggingpayloaderrorinformation}

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `error_code` | `Optional[str]` | 可選的錯誤代碼（例如 "429"） |
| `error_class` | `Optional[str]` | 可選的錯誤類別（例如 "RateLimitError"） |
| `llm_provider` | `Optional[str]` | 傳回錯誤的 LLM 提供者（例如 "openai"）` |

## 標準記錄負載狀態 {#standardloggingpayloadstatus}

具有兩個可能值的文字型別：
- `"success"`
- `"failure"`

## 標準記錄防護欄資訊 {#standardloggingguardrailinformation}

| 欄位                 | 類型 | 說明                                                                                                                                                               |
|-----------------------|------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `guardrail_name`      | `Optional[str]` | 防護欄名稱                                                                                                                                                            |
| `guardrail_provider`  | `Optional[str]` | 防護欄提供者                                                                                                                                                        |
| `guardrail_mode`      | `Optional[Union[GuardrailEventHooks, List[GuardrailEventHooks]]]` | 防護欄模式                                                                                                                                                            |
| `guardrail_request`   | `Optional[dict]` | 防護欄請求                                                                                                                                                         |
| `guardrail_response`  | `Optional[Union[dict, str, List[dict]]]` | 防護欄回應                                                                                                                                                        |
| `guardrail_status`    | `GuardrailStatus` | 防護欄執行狀態，為 [GuardrailStatus](#guardrailstatus) 值之一 |
| `start_time`          | `Optional[float]` | 防護欄的開始時間                                                                                                                                               |
| `end_time`            | `Optional[float]` | 防護欄的結束時間                                                                                                                                                 |
| `duration`            | `Optional[float]` | 防護欄的持續時間（秒）                                                                                                                                      |
| `masked_entity_count` | `Optional[Dict[str, int]]` | 被遮罩實體的數量                                                                                                                                                  |

## 標準記錄負載狀態欄位 {#standardloggingpayloadstatusfields}

用於輕鬆篩選與分析的型別化狀態欄位。

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `llm_api_status` | `StandardLoggingPayloadStatus` | LLM API 呼叫的狀態：成功完成時為 `"success"`，發生錯誤時為 `"failure"` |
| `guardrail_status` | `GuardrailStatus` | 防護欄執行狀態（見下方） |

### 標準記錄負載狀態 {#standardloggingpayloadstatus-1}

具有兩個可能值的文字型別：
- `"success"` - LLM API 請求成功完成
- `"failure"` - LLM API 請求失敗

### 防護欄狀態 {#guardrailstatus}

一個具有五種可能值的字面型別：
- `"success"` - 防護欄執行並允許內容通過（未偵測到違規）
- `"guardrail_flagged"` - 防護欄允許內容通過，但記錄了非阻擋性的違規
- `"guardrail_intervened"` - 因政策違規而阻擋或修改內容
- `"guardrail_failed_to_respond"` - 防護欄發生技術性失敗或 API 錯誤
- `"not_run"` - 此請求未執行任何防護欄

### 使用範例 {#usage-examples}

篩選防護欄介入的請求記錄：
```json
{
  "status_fields": {
    "guardrail_status": "guardrail_intervened"
  }
}
```

尋找防護欄技術性失敗：
```json
{
  "status_fields": {
    "guardrail_status": "guardrail_failed_to_respond"
  }
}
```

取得成功的 LLM 請求：
```json
{
  "status_fields": {
    "llm_api_status": "success"
  }
}
```

尋找防護欄成功執行且未介入的請求：
```json
{
  "status_fields": {
    "guardrail_status": "success",
    "llm_api_status": "success"
  }
}
```

尋找未執行任何防護欄的請求：
```json
{
  "status_fields": {
    "guardrail_status": "not_run"
  }
}
```

## 標準記錄提示管理中繼資料 {#standardloggingpromptmanagementmetadata}

用於追蹤 prompt 版本資訊與管理資訊。

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `prompt_id` | `str` | **必要**。prompt 範本或版本的唯一識別碼 |
| `prompt_variables` | `Optional[dict]` | prompt 範本中使用的變數/參數（例如 `{"user_name": "John", "context": "support"}`） |
| `prompt_integration` | `str` | **必要**。管理 prompt 的整合或系統（例如 `"langfuse"`、`"promptlayer"`、`"custom"`） |

## 標準記錄 MCP 工具呼叫 {#standardloggingmcptoolcall}

用於追蹤 LiteLLM 請求中的 Model Context Protocol (MCP) 工具呼叫。這可為外部工具整合提供詳細記錄。

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `name` | `str` | **必要**。被呼叫的工具名稱（例如 `"get_weather"`、`"search_database"`） |
| `arguments` | `dict` | 傳遞給工具的參數，以鍵值對形式表示 |
| `result` | `Optional[dict]` | 工具執行傳回的回應/結果（由自訂記錄回呼填入） |
| `mcp_server_name` | `Optional[str]` | 處理該工具呼叫的 MCP 伺服器名稱（例如 `"weather-service"`、`"database-connector"`） |
| `mcp_server_logo_url` | `Optional[str]` | MCP 伺服器標誌的 URL（用於 LiteLLM 儀表板中的 UI 顯示） |
| `namespaced_tool_name` | `Optional[str]` | 包含伺服器前綴的完整工具名稱（例如 `"deepwiki-mcp/get_page_content"`、`"github-mcp/create_issue"`） |
| `mcp_server_cost_info` | `Optional[MCPServerCostInfo]` | 該工具呼叫的成本追蹤資訊 |

### MCPServer 成本資訊 {#mcpservercostinfo}

MCP 伺服器工具呼叫的成本追蹤結構：

| 欄位 | 型別 | 說明 |
|-------|------|-------------|
| `default_cost_per_query` | `Optional[float]` | 此 MCP 伺服器任何工具呼叫的預設 USD 成本 |
| `tool_name_to_cost_per_query` | `Optional[Dict[str, float]]` | 用於細緻定價的每個工具成本對應（例如 `{"search": 0.01, "create": 0.05}`） |

### 用法 {#usage}

```python
# Basic MCP tool call metadata
mcp_tool_call = {
    "name": "search_documents",
    "arguments": {
        "query": "machine learning tutorials",
        "limit": 10,
        "filter": "type:pdf"
    },
    "mcp_server_name": "document-search-service",
    "namespaced_tool_name": "docs-mcp/search_documents",
    "mcp_server_cost_info": {
        "default_cost_per_query": 0.02,
        "tool_name_to_cost_per_query": {
            "search_documents": 0.02,
            "get_document": 0.01
        }
    }
}

# optional result field (via custom logging hooks)
mcp_tool_call_with_result = {
    "name": "search_documents",
    "arguments": {
        "query": "machine learning tutorials",
        "limit": 10,
        "filter": "type:pdf"
    },
    "result": {
        "documents": [...],
        "total_found": 42,
        "search_time_ms": 150
    },
    "mcp_server_name": "document-search-service",
    "namespaced_tool_name": "docs-mcp/search_documents",
    "mcp_server_cost_info": {
        "default_cost_per_query": 0.02,
        "tool_name_to_cost_per_query": {
            "search_documents": 0.02,
            "get_document": 0.01
        }
    }
}
```
