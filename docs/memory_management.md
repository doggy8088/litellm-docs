import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /memory {#memory}

用於在 LiteLLM proxy 上儲存與擷取使用者／團隊範圍記憶項目的 CRUD 端點。請使用這些端點來儲存對話上下文、代理程式記憶、團隊作業手冊，或任何以使用者與團隊為範圍的鍵值資料。

## 概覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 建立記憶 | ✅ | `POST /v1/memory` |
| 列出記憶 | ✅ | `GET /v1/memory`，並可選擇性篩選 |
| 依鍵取得記憶 | ✅ | `GET /v1/memory/{key}` |
| 更新或插入記憶 | ✅ | `PUT /v1/memory/{key}` |
| 刪除記憶 | ✅ | `DELETE /v1/memory/{key}` |
| 使用者範圍存取 | ✅ | 項目範圍限定於 `user_id` |
| 團隊範圍存取 | ✅ | 項目範圍限定於 `team_id` |
| JSON 中繼資料 | ✅ | 每個項目可使用任意 JSON 中繼資料 |
| 分頁 | ✅ | 以頁面為單位，頁面大小可設定 |
| 鍵前綴篩選 | ✅ | 類似 Redis 的命名空間掃描 |
| 稽核軌跡 | ✅ | `created_by`、`updated_by`，含時間戳記 |
| 支援的 LiteLLM 版本 | `v1.83.10+` | |

## 前置需求 {#prerequisites}

- LiteLLM Proxy 已執行且已連接 **PostgreSQL** 資料庫
- 已套用資料庫遷移（會自動建立 `LiteLLM_MemoryTable`）
- 用於驗證的有效 API 金鑰

不需要額外的 `config.yaml` 項目。只要 proxy 在連接資料庫後啟動，端點就會自動可用。

## 快速開始 {#quick-start}

### 建立記憶項目 {#create-a-memory-entry}

<Tabs>
<TabItem value="curl" label="curl">

```shell title="Create memory"
curl -X POST "http://localhost:4000/v1/memory" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user:123:preferences",
    "value": "Prefers concise responses. Timezone: PST.",
    "metadata": {"tags": ["preferences", "user-settings"]}
  }'
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python showLineNumbers title="Create memory"
import httpx

client = httpx.Client(
    base_url="http://localhost:4000",
    headers={"Authorization": "Bearer sk-1234"},
)

response = client.post("/v1/memory", json={
    "key": "user:123:preferences",
    "value": "Prefers concise responses. Timezone: PST.",
    "metadata": {"tags": ["preferences", "user-settings"]},
})
print(response.json())
```

</TabItem>
</Tabs>

**回應：**

```json
{
  "memory_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "key": "user:123:preferences",
  "value": "Prefers concise responses. Timezone: PST.",
  "metadata": {"tags": ["preferences", "user-settings"]},
  "user_id": "user-123",
  "team_id": "team-abc",
  "created_at": "2025-04-21T12:00:00Z",
  "created_by": "user-123",
  "updated_at": "2025-04-21T12:00:00Z",
  "updated_by": "user-123"
}
```

### 列出記憶 {#list-memories}

<Tabs>
<TabItem value="curl" label="curl">

```shell title="List all memories"
curl "http://localhost:4000/v1/memory" \
  -H "Authorization: Bearer sk-1234"
```

```shell title="Filter by key prefix"
curl "http://localhost:4000/v1/memory?key_prefix=user:123:" \
  -H "Authorization: Bearer sk-1234"
```

```shell title="Paginate results"
curl "http://localhost:4000/v1/memory?page=2&page_size=10" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python showLineNumbers title="List memories"
# List all
response = client.get("/v1/memory")
print(response.json())

# Filter by key prefix
response = client.get("/v1/memory", params={"key_prefix": "user:123:"})
print(response.json())

# Paginate
response = client.get("/v1/memory", params={"page": 2, "page_size": 10})
print(response.json())
```

</TabItem>
</Tabs>

**回應：**

```json
{
  "memories": [
    {
      "memory_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "key": "user:123:preferences",
      "value": "Prefers concise responses. Timezone: PST.",
      "metadata": {"tags": ["preferences", "user-settings"]},
      "user_id": "user-123",
      "team_id": "team-abc",
      "created_at": "2025-04-21T12:00:00Z",
      "created_by": "user-123",
      "updated_at": "2025-04-21T12:00:00Z",
      "updated_by": "user-123"
    }
  ],
  "total": 1
}
```

### 依鍵取得記憶 {#get-a-memory-by-key}

<Tabs>
<TabItem value="curl" label="curl">

```shell title="Get memory by key"
curl "http://localhost:4000/v1/memory/user:123:preferences" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python showLineNumbers title="Get memory by key"
response = client.get("/v1/memory/user:123:preferences")
print(response.json())
```

</TabItem>
</Tabs>

### 更新（Upsert）記憶 {#update-upsert-a-memory}

如果鍵已存在，則更新它；如果不存在，則建立新項目。

<Tabs>
<TabItem value="curl" label="curl">

```shell title="Upsert memory"
curl -X PUT "http://localhost:4000/v1/memory/user:123:preferences" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "Prefers concise responses. Timezone: EST. Language: English.",
    "metadata": {"tags": ["preferences", "user-settings"], "version": 2}
  }'
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python showLineNumbers title="Upsert memory"
response = client.put("/v1/memory/user:123:preferences", json={
    "value": "Prefers concise responses. Timezone: EST. Language: English.",
    "metadata": {"tags": ["preferences", "user-settings"], "version": 2},
})
print(response.json())
```

</TabItem>
</Tabs>

### 刪除記憶 {#delete-a-memory}

<Tabs>
<TabItem value="curl" label="curl">

```shell title="Delete memory"
curl -X DELETE "http://localhost:4000/v1/memory/user:123:preferences" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python showLineNumbers title="Delete memory"
response = client.delete("/v1/memory/user:123:preferences")
print(response.json())
```

</TabItem>
</Tabs>

**回應：**

```json
{
  "key": "user:123:preferences",
  "deleted": true
}
```

## API 參考 {#api-reference}

### POST `/v1/memory` {#post-v1memory}

建立新的記憶項目。

**請求主體：**

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `key` | string | ✅ | 全域唯一鍵。請使用具命名空間的鍵（例如，`user:123:notes`）。 |
| `value` | string | ✅ | 記憶內容。通常為 markdown 或純文字。 |
| `metadata` | any (JSON) | ❌ | 選用的 JSON 中繼資料（dict、list、純量）。 |
| `user_id` | string | ❌ | 範圍限定到單一使用者。預設為呼叫者的 `user_id`。僅管理員可覆寫。 |
| `team_id` | string | ❌ | 範圍限定到單一團隊。預設為呼叫者的 `team_id`。僅管理員可覆寫。 |

**回應：** `201` — 傳回建立的 `LiteLLM_MemoryRow`。

---

### GET `/v1/memory` {#get-v1memory}

列出呼叫者可見的記憶項目。

**查詢參數：**

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `key` | string | — | 依完全相符的鍵篩選。 |
| `key_prefix` | string | — | 依鍵前綴篩選（例如，`user:123:`）。優先於 `key`。 |
| `page` | int | 1 | 頁碼（從 1 開始）。 |
| `page_size` | int | 50 | 每頁項目數（最大 500）。 |

**回應：** `200` — 傳回包含 `MemoryListResponse` 陣列與 `memories` 計數的 `total`。

---

### GET `/v1/memory/{key}` {#get-v1memorykey}

依鍵取得單一記憶項目。

**路徑參數：**

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `key` | string | 要擷取的記憶鍵。 |

**回應：** `200` — 傳回該 `LiteLLM_MemoryRow`。

---

### PUT `/v1/memory/{key}` {#put-v1memorykey}

更新或插入記憶項目。若鍵不存在則建立；若已存在則更新。

**路徑參數：**

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `key` | string | 要建立或更新的記憶鍵。 |

**請求主體：**

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `value` | string | ✅（建立時） | 記憶內容。建立時必填，更新時選填。 |
| `metadata` | any (JSON) | ❌ | 更新後的中繼資料。略過可保留現有值。設為 `null` 可清除。 |
| `user_id` | string | ❌ | 僅於建立時使用。僅管理員可覆寫。 |
| `team_id` | string | ❌ | 僅於建立時使用。僅管理員可覆寫。 |

**回應：** `200` — 傳回建立／更新後的 `LiteLLM_MemoryRow`。

---

### DELETE `/v1/memory/{key}` {#delete-v1memorykey}

依鍵刪除記憶項目。

**路徑參數：**

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `key` | string | 要刪除的記憶鍵。 |

**回應：** `200` — 傳回 `{"key": "...", "deleted": true}`。

## 回應物件 {#response-object}

所有會回傳記憶項目的端點都使用此結構：

```json
{
  "memory_id": "string (UUID)",
  "key": "string",
  "value": "string",
  "metadata": "any (JSON) or null",
  "user_id": "string or null",
  "team_id": "string or null",
  "created_at": "datetime",
  "created_by": "string",
  "updated_at": "datetime",
  "updated_by": "string"
}
```

## 存取控制 {#access-control}

記憶項目會依 `user_id` 與 `team_id` 劃分範圍，並具有以角色為基礎的可見性與寫入權限。

### 可見性（讀取） {#visibility-read}

| 角色 | 可查看內容 |
|------|---------|
| **Proxy 管理員** | 所有記憶項目 |
| **一般使用者** | `user_id` 與其自身相符，或 `team_id` 與其自身相符的項目 |

### 寫入權限（更新／刪除） {#write-access-update--delete}

| 情境 | 可寫入者 |
|----------|---------------|
| 項目具有與呼叫者相符的 `user_id` | 擁有者可更新／刪除 |
| 項目僅為團隊範圍（沒有 `user_id`） | 僅團隊管理員與組織管理員 |
| 任何項目 | Proxy 管理員 |

:::info

團隊成員可以**讀取**團隊範圍項目，但只有**團隊管理員**可以修改或刪除它們。這可避免隊友覆寫彼此的項目。

:::

### 建立時的範圍設定 {#scoping-on-create}

- `user_id` 與 `team_id` 預設使用來自其 API 金鑰的呼叫者身分
- **Proxy 管理員**可以覆寫 `user_id` / `team_id`，以替其他使用者或團隊建立項目
- 非管理員呼叫者若沒有至少一個 `user_id` 或 `team_id`，則不能建立項目

## 鍵命名慣例 {#key-naming-conventions}

鍵在全域必須唯一。請使用具命名空間的鍵來組織項目：

```
user:{user_id}:preferences      # User preferences
user:{user_id}:context          # Conversation context
team:{team_id}:playbook         # Team playbook
agent:{agent_id}:memory         # Agent memory
project:{project_id}:config     # Project configuration
```

請在列表端點中使用 `key_prefix` 來掃描命名空間中的所有項目：

```shell
# Get all entries for a user
curl "http://localhost:4000/v1/memory?key_prefix=user:123:" \
  -H "Authorization: Bearer sk-1234"
```

## 錯誤代碼 {#error-codes}

| 狀態碼 | 含義 |
|-------------|---------|
| `200` | 成功（GET、PUT、DELETE） |
| `201` | 已建立（POST） |
| `400` | 無效輸入（缺少必要欄位、空的 PUT 主體、孤立列） |
| `403` | 權限被拒（寫入權限違規、非管理員覆寫範圍） |
| `404` | 找不到鍵或對呼叫者不可見 |
| `409` | 建立時鍵重複 |
| `500` | 伺服器內部錯誤（資料庫問題） |
