import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 客戶／終端使用者 {#customers--end-users}

追蹤花費、為您的客戶設定預算與權限。

## 追蹤客戶花費 + 權限 {#tracking-customer-spend--permissions}

### 1. 使用客戶 ID 發出 LLM API 請求 {#1-make-llm-api-call-w-customer-id}

LiteLLM 依照以下順序檢查客戶／終端使用者 ID（以第一個符合者為準）：

| 優先順序 | 方法 | 位置 | 備註 |
|----------|--------|-------|-------|
| 1 | `x-litellm-customer-id` 標頭 | 請求標頭 | 標準標頭，一律檢查 |
| 2 | `x-litellm-end-user-id` 標頭 | 請求標頭 | 標準標頭，一律檢查 |
| 3 | 透過 `user_header_mappings` 的自訂標頭 | 請求標頭 | 在 `general_settings` 中設定 |
| 4 | 透過 `user_header_name` 的自訂標頭 | 請求標頭 | 已棄用 — 請改用 `user_header_mappings` |
| 5 | `user` 欄位 | 請求主體 | 標準 OpenAI 欄位 |
| 6 | `litellm_metadata.user` 欄位 | 請求主體 | Anthropic 風格的中繼資料 |
| 7 | `metadata.user_id` 欄位 | 請求主體 | 通用中繼資料模式 |
| 8 | `safety_identifier` 欄位 | 請求主體 | Responses API |

:::info[JWT 驗證優先]

如果在 `end_user_id_jwt_field` 啟用 [JWT auth](token_auth)，則已驗證 JWT 聲明中的 customer ID 會優先於上方列出的所有標頭與主體欄位。只有在 JWT 無法產生 end-user ID 時，才會使用請求提供的欄位。由於該聲明來自 LiteLLM 已經驗證過的 token，呼叫端無法使用 `x-litellm-end-user-id`、`metadata.user_id` 等覆寫它。

:::

**選項 1：標準標頭**（建議，無需修改 request body）

```bash showLineNumbers title="Make request with customer ID in header"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer $LITELLM_API_KEY" \
        --header 'x-litellm-end-user-id: ishaan3' \
        --data '{
        "model": "azure-gpt-3.5",
        "messages": [{"role": "user", "content": "what time is it"}]
        }'
```

`x-litellm-customer-id` 和 `x-litellm-end-user-id` 都受支援，且一律會在不需任何設定的情況下檢查。

**選項 2：請求主體中的 `user` 欄位**（相容 OpenAI）

```bash showLineNumbers title="Make request with customer ID in body"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer $LITELLM_API_KEY" \
        --data '{
        "model": "azure-gpt-3.5",
        "user": "ishaan3",
        "messages": [{"role": "user", "content": "what time is it"}]
        }'
```

**選項 3：透過 `user_header_mappings` 的自訂標頭**（可設定）

```yaml showLineNumbers title="config.yaml"
general_settings:
  user_header_mappings:
    - header_name: "x-my-app-user-id"
      litellm_user_role: "customer"
```

```bash showLineNumbers title="Make request with custom header"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer $LITELLM_API_KEY" \
        --header 'x-my-app-user-id: ishaan3' \
        --data '{
        "model": "azure-gpt-3.5",
        "messages": [{"role": "user", "content": "what time is it"}]
        }'
```

**選項 4：`litellm_metadata.user`**（Anthropic 風格）

```bash showLineNumbers title="Make request with litellm_metadata.user"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer $LITELLM_API_KEY" \
        --data '{
        "model": "{{anthropic}}",
        "messages": [{"role": "user", "content": "what time is it"}],
        "litellm_metadata": {"user": "ishaan3"}
        }'
```

**選項 5：`metadata.user_id`**

```bash showLineNumbers title="Make request with metadata.user_id"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer $LITELLM_API_KEY" \
        --data '{
        "model": "azure-gpt-3.5",
        "messages": [{"role": "user", "content": "what time is it"}],
        "metadata": {"user_id": "ishaan3"}
        }'
```

customer_id 會隨著新的花費 upsert 到資料庫中。

如果 customer_id 已存在，花費將會累加。

### 2. 取得客戶花費  {#2-get-customer-spend}

<Tabs>
<TabItem value="all-up" label="總花費">

呼叫 `/customer/info` 以取得客戶的總花費

```bash showLineNumbers title="Get customer spend"
# end_user_id: 👈 CUSTOMER ID
# Authorization: 👈 YOUR PROXY KEY
curl -X GET 'http://0.0.0.0:4000/customer/info?end_user_id=ishaan3' \
        -H "Authorization: Bearer $LITELLM_API_KEY"
```

預期回應：

```json showLineNumbers title="Response"
{
    "user_id": "ishaan3",
    "blocked": false,
    "alias": null,
    "spend": 0.001413,
    "allowed_model_region": null,
    "default_model": null,
    "litellm_budget_table": null
}
```

</TabItem>
<TabItem value="event-webhook" label="事件 Webhook">

若要在用戶端資料庫中更新花費，請將 proxy 指向您的 webhook。 

例如，如果您的伺服器是 `https://webhook.site`，且您正在 `6ab090e8-c55f-4a23-b075-3209f5c57906` 監聽

1. 將 webhook URL 新增至您的 proxy 環境： 

```bash showLineNumbers title="Set webhook URL"
export WEBHOOK_URL="https://webhook.site/6ab090e8-c55f-4a23-b075-3209f5c57906"
```

2. 在 config.yaml 中加入 'webhook'

```yaml showLineNumbers title="config.yaml"
general_settings: 
  alerting: ["webhook"] # 👈 KEY CHANGE
```

3. 測試它！ 

```bash showLineNumbers title="Test webhook"
curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "model": "mistral",
    "messages": [
        {
        "role": "user",
        "content": "What's the weather like in Boston today?"
        }
    ],
    "user": "krrish12"
}
'
```

預期回應 

```json showLineNumbers title="Webhook event payload"
{
  "spend": 0.0011120000000000001, # 👈 SPEND
  "max_budget": null,
  "token": "example-api-key-123",
  "customer_id": "krrish12",  # 👈 CUSTOMER ID
  "user_id": null,
  "team_id": null,
  "user_email": null,
  "key_alias": null,
  "projected_exceeded_date": null,
  "projected_spend": null,
  "event": "spend_tracked",
  "event_group": "customer",
  "event_message": "Customer spend tracked. Customer=krrish12, spend=0.0011120000000000001"
}
```

[查看 Webhook 規格](./alerting.md#api-spec-for-webhook-event)

</TabItem>
</Tabs>

## 限制哪些 ID 會成為客戶 {#restricting-which-ids-become-customers}

LiteLLM 看到的每個不同 customer ID 都會 upsert 到 customer table；當 client 傳送每次 session 一個識別碼時，這會成為問題。例如，Claude Code 會在 `metadata.user_id` 放入一個 JSON blob：

```json title="What Claude Code sends"
{"device_id": "4ec41ed1...", "account_uuid": "...", "session_id": "..."}
```

接著每個 session 都會在 Usage -> Customer Usage 中以自己的 customer 顯示；如果您已設定 [default customer budget](#default-budget-for-all-customers)，每個 session 都會擁有該 budget 的自己的副本，因此原本要給真實客戶的每月上限，會變成該流量的每 session 上限。

設定 `validate_end_user_id_in_db` 即可將這些 ID 排除在外。適用於 v1.87.0 及以上版本。

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  validate_end_user_id_in_db: true
```

之後只有在 ID 符合現有 customer 的 `user_id`、internal user 的 `user_id`，或 internal user 的 email 時才會被接受。外型像 JSON object 或 array 的 ID 會在任何資料庫查詢前被捨棄，因為那些從來都不是真正的 customer 識別碼。捨棄不是錯誤：請求仍會成功，只是不會帶有 customer，而其花費會照常歸屬到 virtual key、team 和 internal user。查詢結果會快取 5 分鐘（ID 有對應時）以及 1 分鐘（ID 無對應時），因此新建立的 customer 最多可能需要一分鐘才會被辨識。

### 保留未註冊客戶的預設 budget {#keeping-a-default-budget-for-unregistered-customers}

單獨使用時，`validate_end_user_id_in_db` 會捨棄所有沒有對應資料列的 ID；如果您依賴這點來限制從未明確建立過的客戶，這會與 `max_end_user_budget_id` 相衝突。兩者同時設定時會互相配合：JSON 形狀的 ID 仍會被捨棄，而沒有資料列的純字串 ID 會被保留，因此 default budget 仍會套用到它。

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  validate_end_user_id_in_db: true
  max_end_user_budget_id: "your_default_budget_id"
```

### 將內部流量分桶到單一客戶 {#bucketing-internal-traffic-under-one-customer}

如果您希望替該流量標記，而不是捨棄它，請讓 client 傳送 `x-litellm-customer-id`。標頭會在任何 request body 欄位之前檢查，因此標頭會勝過 client 放在 `metadata.user_id` 中的內容，而 Claude Code 可透過 `ANTHROPIC_CUSTOM_HEADERS` 設定它而無需其他變更，Codex CLI 則可透過其 `config.toml` 中的 `http_headers` 完成相同設定。請參閱 [Claude Code granular cost tracking](../tutorials/claude_code_customer_tracking.md) 與 [Codex CLI granular cost tracking](../tutorials/codex_customer_tracking.md)。

請透過 `/customer/new` 建立該客戶並設定其自己的 budget。這樣即可滿足 `validate_end_user_id_in_db`，而明確的 customer budget 會優先於預設 budget，因此內部流量可以擁有與真實客戶不同的限制。

## 限制客戶可使用的模型 {#restricting-which-models-a-customer-can-use}

在 customer 上設定 `models`，以限制以其名義送出的請求可呼叫哪些模型。攜帶此 customer ID 的請求，無論是透過 `user` 欄位或 `x-litellm-customer-id` 標頭，只要請求的模型不在清單中，就會回傳 403 拒絕，即使 virtual key 與 team 允許也一樣。空白或缺少的清單表示該 customer 不加任何模型限制。customer 清單只會縮小存取範圍：key 與 team 本身的模型限制仍會疊加生效，因此在 customer 上列出某個模型，絕不會賦予 key 對它的存取權。

項目遵循與 key 和 team `models` 相同的規則，因此像 `anthropic/*` 這類萬用字元或 model access group 名稱在此也同樣有效。

client 提供的 `fallbacks` 也會對照 customer 的清單檢查，在啟用 `enforce_fallback_model_access` 時，router fallback 亦同。

```bash showLineNumbers title="Create a customer limited to one model"
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "user_1",
    "models": ["{{openai_small}}"]
  }'
```

代表 `user_1` 的任何其他模型請求，之後都會以與 key 和 team 模型檢查相同的錯誤格式失敗，且 `type` 會設為 `customer_model_access_denied`。

```bash showLineNumbers title="Request a model outside the customer's list"
curl -L -X POST 'http://localhost:4000/v1/chat/completions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-H 'x-litellm-customer-id: user_1' \
-d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "hi"}]
  }'
```

```json title="Response (403)"
{
  "error": {
    "message": "The requested model '{{openai_large}}' is not in the allowed models for this customer. Check the models this customer can use and try again.",
    "type": "customer_model_access_denied",
    "param": "model",
    "code": "403"
  }
}
```

使用 `/customer/update` 變更清單。省略 `models` 會保留目前清單不變，而傳送 `"models": []` 會移除限制。`/customer/info` 會在其 `models` 欄位回傳目前清單。

```bash showLineNumbers title="Remove the customer's model restriction"
curl -L -X POST 'http://localhost:4000/customer/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "user_1",
    "models": []
  }'
```

## 設定客戶物件權限 {#setting-customer-object-permissions}

控制客戶可存取哪些資源（MCP 伺服器、向量儲存、代理程式）。

### 什麼是物件權限？ {#what-are-object-permissions}

物件權限可讓您限制客戶對特定項目的存取：
- **MCP 伺服器**：限制客戶可呼叫哪些 MCP 伺服器
- **MCP 存取群組**：將客戶指派至預先定義的 MCP 伺服器群組
- **MCP 工具權限**：細緻控制客戶可在 MCP 伺服器中使用哪些工具
- **向量儲存**：控制客戶可查詢哪些向量儲存
- **代理程式**：限制客戶可互動的代理程式
- **代理程式存取群組**：將客戶指派至預先定義的代理程式群組

### 建立具有物件權限的客戶 {#creating-a-customer-with-object-permissions}

```bash showLineNumbers title="Create customer with object permissions"
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "user_1",
    "object_permission": {
      "mcp_servers": ["server_1", "server_2"],
      "mcp_access_groups": ["public_group"],
      "mcp_tool_permissions": {
        "server_1": ["tool_a", "tool_b"]
      },
      "vector_stores": ["vector_store_1"],
      "agents": ["agent_1"],
      "agent_access_groups": ["basic_agents"]
    }
  }'
```

**參數：**
- `mcp_servers` (Optional[List[str]]): 允許的 MCP 伺服器 ID 清單
- `mcp_access_groups` (Optional[List[str]]): MCP 存取群組名稱清單
- `mcp_tool_permissions` (Optional[Dict[str, List[str]]]): 伺服器 ID 對允許工具名稱的對應
- `vector_stores` (Optional[List[str]]): 允許的向量儲存 ID 清單
- `agents` (Optional[List[str]]): 允許的代理程式 ID 清單
- `agent_access_groups` (Optional[List[str]]): 代理程式存取群組名稱清單

**注意：**如果 `object_permission` 是 `null` 或 `{}`，則該客戶沒有物件層級限制。

### 更新客戶物件權限 {#updating-customer-object-permissions}

您可以更新既有客戶的物件權限：

```bash showLineNumbers title="Update customer object permissions"
curl -L -X POST 'http://localhost:4000/customer/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "user_1",
    "object_permission": {
      "mcp_servers": ["server_3"],
      "vector_stores": ["vector_store_2", "vector_store_3"]
    }
  }'
```

### 檢視客戶物件權限 {#viewing-customer-object-permissions}

當您查詢客戶資訊時，回應中會包含物件權限：

```bash showLineNumbers title="Get customer info with object permissions"
curl -X GET 'http://0.0.0.0:4000/customer/info?end_user_id=user_1' \
    -H "Authorization: Bearer $LITELLM_API_KEY"
```

**回應：**
```json showLineNumbers title="Response with object permissions"
{
  "user_id": "user_1",
  "blocked": false,
  "alias": "John Doe",
  "spend": 0.0,
  "object_permission": {
    "object_permission_id": "perm_abc123",
    "mcp_servers": ["server_1", "server_2"],
    "mcp_access_groups": ["public_group"],
    "mcp_tool_permissions": {
      "server_1": ["tool_a", "tool_b"]
    },
    "vector_stores": ["vector_store_1"],
    "agents": ["agent_1"],
    "agent_access_groups": ["basic_agents"]
  },
  "litellm_budget_table": null
}
```

### 使用案例 {#use-cases}

**1. 分級存取控制**
為您的客戶建立不同的權限等級：

```bash showLineNumbers title="Free tier customer"
# Free tier - limited access
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "free_user",
    "budget_id": "free_tier",
    "object_permission": {
      "mcp_access_groups": ["public_group"],
      "agent_access_groups": ["basic_agents"]
    }
  }'
```

```bash showLineNumbers title="Premium tier customer"
# Premium tier - full access
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "premium_user",
    "budget_id": "premium_tier",
    "object_permission": {
      "mcp_servers": ["server_1", "server_2", "server_3"],
      "vector_stores": ["vector_store_1", "vector_store_2"],
      "agents": ["agent_1", "agent_2", "agent_3"]
    }
  }'
```

**2. 部門專屬存取**
將客戶限制在與其部門相關的資源：

```bash showLineNumbers title="Sales team customer"
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "sales_user",
    "object_permission": {
      "mcp_servers": ["crm_server", "email_server"],
      "agents": ["sales_assistant"],
      "vector_stores": ["sales_knowledge_base"]
    }
  }'
```

**3. 工具層級限制**
授予對 MCP 伺服器內特定工具的存取：

```bash showLineNumbers title="Limited tool access"
curl -L -X POST 'http://localhost:4000/customer/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "restricted_user",
    "object_permission": {
      "mcp_servers": ["database_server"],
      "mcp_tool_permissions": {
        "database_server": ["read_only_query", "get_table_schema"]
      }
    }
  }'
```

## 設定客戶預算 {#setting-customer-budgets}

在 LiteLLM Proxy 上設定客戶預算（例如每月預算、tpm/rpm 限制）

### 所有客戶的預設預算 {#default-budget-for-all-customers}

將預算限制套用至所有沒有明確預算的客戶。這對於在所有終端使用者之間進行速率限制與花費控制很有用。

**步驟 1：建立預設預算**

```bash showLineNumbers title="Create default budget"
curl -X POST 'http://localhost:4000/budget/new' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "max_budget": 10,
    "rpm_limit": 2,
    "tpm_limit": 1000
}'
```

**步驟 2：設定預設預算 ID**

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  max_end_user_budget_id: "budget_id_from_step_1"
```

**步驟 3：測試它**

```bash showLineNumbers title="Make request with customer ID"
curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "Hello"}],
    "user": "my-customer-id"
}'
```

該 customer 會受預設 budget 限制（RPM、TPM 與 $ budget）約束。具有明確 budget 的 customer 不受影響，而預設值也適用於資料庫中尚不存在的 customer。LiteLLM 會快取 budget 物件 60 秒，因此對其所做的編輯最多需要一分鐘才會生效。

浮點設定 `max_end_user_budget` 不再強制；如果您的設定中有它，請依上方所示將其改為 `max_end_user_budget_id`。

此預設會套用到所有進入 customer tracking 的 ID，包括 agent client 傳送的每次 session ID。若您想讓這些 ID 不進入 customer table，同時讓真實客戶保留預設 budget，請參閱 [限制哪些 ID 會成為客戶](#restricting-which-ids-become-customers)。

### 快速入門  {#quick-start}

建立／更新具有預算的客戶

**建立新客戶並附帶 budget**
```bash showLineNumbers title="Create customer with budget"
curl -X POST 'http://0.0.0.0:4000/customer/new'         
    -H "Authorization: Bearer $LITELLM_API_KEY"         
    -H 'Content-Type: application/json'         
    -d '{
        "user_id" : "my-customer-id",
        "max_budget": 10
    }'
```

`/customer/new` 可內嵌接受 budget 欄位：`max_budget`、`soft_budget`、`budget_duration`、`tpm_limit`、`rpm_limit`、`max_parallel_requests` 以及 `model_max_budget`。請設定 `max_budget` 或 `budget_id` 其一，不可同時設定兩者；同時傳入會被拒絕。Customer `tpm_limit` 與 `rpm_limit` 會儲存在 budget 物件上，因此只有在 customer 連結到該物件時才會套用，無論是如上內嵌設定，或透過 `budget_id`。

`/customer/update` 可接受較少的一組欄位：`user_id`、`alias`、`blocked`、`max_budget`、`budget_id`、`allowed_model_region`、`default_model` 以及 `object_permission`。其他任何欄位，包括 `tpm_limit`、`rpm_limit` 和 `budget_duration`，都會被靜默捨棄；若要變更那些設定，請改用 `/budget/update` 更新 budget 物件。

Customer budgets 是每個 deployment 全域共用的。花費只會依 customer id 追蹤，因此同一個 customer 會在每個 virtual key 與 team 之間共用一個 budget，而且 customer budget 無法限定於單一 key 或 team。

**試試看！**

```bash showLineNumbers title="Test customer budget"
curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "model": "mistral",
    "messages": [
        {
        "role": "user",
        "content": "What'\''s the weather like in Boston today?"
        }
    ],
    "user": "ishaan-jaff-48"
}
```

### 指派定價層級 {#assign-pricing-tiers}

建立並將客戶指派至定價層級。

#### 1. 建立預算 {#1-create-a-budget}

<Tabs>
<TabItem value="ui" label="UI">

- 前往 UI 上的 'Budgets' 分頁。 
- 點選 '+ Create Budget'。
- 建立您的定價層級（例如，'my-free-tier'，預算為 $4）。這表示此定價層級上的每位使用者最高預算為 $4。

<Image img={require('../../img/create_budget_modal.png')} />

</TabItem>
<TabItem value="api" label="API">

使用 `/budget/new` 端點來建立新的預算。[API 參考](https://docs.litellm.ai/api-reference/#/budget%20management/new_budget_budget_new_post)

```bash showLineNumbers title="Create budget via API"
curl -X POST 'http://localhost:4000/budget/new' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "budget_id": "my-free-tier", 
    "max_budget": 4 
}
```

</TabItem>
</Tabs>

:::info

`tpm_limit` 與 `rpm_limit` 在 budget 上是選用的。若保留未設定，會儲存 `null`，且 LiteLLM 不會對該 budget 上的 customer 強制執行每個 customer 的 TPM 或 RPM 限制；只會套用您的 provider 本身的 rate limits。僅在您要讓 LiteLLM 對該 customer 設上限時才設定它們。

```bash
curl -X POST 'http://localhost:4000/budget/info' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"budgets": ["my-free-tier"]}'
```

當未設定 LiteLLM 限制時，`tpm_limit` 與 `rpm_limit` 會回傳為 `null`。

:::

#### 2. 將預算指派給客戶  {#2-assign-budget-to-customer}

在您的應用程式程式碼中，於建立新客戶時指派預算。 

只要使用建立預算時所用的 `budget_id`。在我們的範例中，這是 `my-free-tier`。

```bash showLineNumbers title="Assign budget to customer"
curl -X POST 'http://localhost:4000/customer/new' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "user_id": "my-customer-id",
    "budget_id": "my-free-tier" # 👈 KEY CHANGE
}
```

#### 3. 測試它！  {#3-test-it}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Test with curl"
curl -X POST 'http://localhost:4000/customer/new' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "user_id": "my-customer-id",
    "budget_id": "my-free-tier" # 👈 KEY CHANGE
}
```

</TabItem>
<TabItem value="openai" label="OpenAI">

```python showLineNumbers title="Test with OpenAI SDK"
from openai import OpenAI
client = OpenAI(
  base_url="<your_proxy_base_url>",
  api_key="<your_proxy_key>"
)

completion = client.chat.completions.create(
  model="{{openai_small}}",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  user="my-customer-id"
)

print(completion.choices[0].message)
```

</TabItem>
</Tabs>
