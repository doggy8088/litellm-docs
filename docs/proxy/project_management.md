# ✨ [Beta] 專案管理 {#-beta-project-management}

:::info

這是企業版功能。
[企業定價](https://www.litellm.ai/#pricing)

[請點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

LiteLLM 中的專案位於組織階層中的團隊與金鑰之間，能夠針對特定使用情境或應用程式進行精細的存取控制與預算管理。

```mermaid
graph TD
    A[組織] --> B[團隊 1]
    A --> C[團隊 2]
    B --> D[專案 A]
    B --> E[專案 B]
    C --> F[專案 C]
    D --> G[API 金鑰 1]
    D --> H[API 金鑰 2]
    E --> I[API 金鑰 3]
    F --> J[API 金鑰 4]
    
    style A fill:#e1f5ff
    style B fill:#fff4e6
    style C fill:#fff4e6
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#f3e5f5
    style G fill:#e8f5e9
    style H fill:#e8f5e9
    style I fill:#e8f5e9
    style J fill:#e8f5e9
```

**階層**: `Organizations > Teams > Projects > Keys`

## 快速開始 {#quick-start}

本導覽將示範如何建立專案、產生 API 金鑰、發出請求，以及在 UI 中查看專案層級的支出追蹤。

### 步驟 1：建立專案 {#step-1-create-a-project}

```bash showLineNumbers
curl --location 'http://0.0.0.0:4000/project/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "flight-search-assistant",
    "team_id": "ad898803-c8a3-4f4a-976a-a3c372cffa45",
    "models": ["gpt-4", "gpt-3.5-turbo"],
    "max_budget": 100,
    "metadata": {
        "use_case_id": "SNOW-12345",
        "responsible_ai_id": "RAI-67890"
    }
}' | jq
```

**回應：**
```json
{
  "project_id": "e402a141-725a-4437-bff5-d47459189716",
  "project_alias": "flight-search-assistant",
  "team_id": "ad898803-c8a3-4f4a-976a-a3c372cffa45",
  "models": ["gpt-4", "gpt-3.5-turbo"],
  "max_budget": 100,
  ...
}
```

### 步驟 2：為專案產生 API 金鑰 {#step-2-generate-api-key-for-project}

```bash showLineNumbers
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data-raw '{
    "models": ["gpt-3.5-turbo", "gpt-4"],
    "metadata": {"user": "ishaan@berri.ai"},
    "project_id": "e402a141-725a-4437-bff5-d47459189716"
}' | jq
```

**回應：**
```json
{
  "key": "sk-W8VbscpfuyvHm5TkxRYiXA",
  "key_name": "sk-...YiXA",
  "project_id": "e402a141-725a-4437-bff5-d47459189716",
  ...
}
```

### 步驟 3：在 Chat Completions 中使用 API 金鑰 {#step-3-use-api-key-in-chat-completions}

```bash showLineNumbers
curl http://localhost:4000/v1/chat/completions \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-W8VbscpfuyvHm5TkxRYiXA' \
--data '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "What is litellm?"}]
}' | jq
```

### 步驟 4：在 UI 中查看專案支出 {#step-4-view-project-spend-in-ui}

前往 LiteLLM Admin UI 的 **Logs** 頁面。您會在請求中繼資料中看到 `user_api_key_project_id` 已被追蹤：

![專案支出追蹤](/img/project_spend.png)

如上所示，支出記錄中繼資料包含：
- `"user_api_key_project_id": "e402a141-725a-4437-bff5-d47459189716"` - 將請求連結到您的專案
- 所有成本與 token 使用量都會自動歸屬到該專案
- 您可以依專案 ID 查詢與篩選記錄，以取得詳細報表

## API 端點 {#api-endpoints}

### POST /project/new {#post-projectnew}

建立新的專案。

**可呼叫者**：管理員或團隊管理員

**參數**：
- `project_alias` (string, optional): 專案的人類可讀名稱
- `team_id` (string, required): 此專案所屬的團隊
- `models` (array, optional): 專案可存取的模型清單
- `max_budget` (float, optional): 專案的最大支出預算
- `tpm_limit` (int, optional): 每分鐘 token 限制
- `rpm_limit` (int, optional): 每分鐘請求限制
- `budget_duration` (string, optional): 預算重設週期（例如 "30d"、"1mo"）
- `metadata` (object, optional): 專案的自訂中繼資料
- `blocked` (boolean, optional): 封鎖此專案的所有 API 呼叫

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "hotel-recommendations",
    "team_id": "team-123",
    "models": ["claude-3-sonnet"],
    "max_budget": 200,
    "tpm_limit": 100000,
    "metadata": {
        "use_case_id": "SNOW-12346",
        "cost_center": "travel-products"
    }
}'
```

**回應**：

```json
{
    "project_id": "project-def",
    "project_alias": "hotel-recommendations",
    "team_id": "team-123",
    "models": ["claude-3-sonnet"],
    "spend": 0.0,
    "budget_id": "budget-xyz",
    "metadata": {
        "use_case_id": "SNOW-12346",
        "cost_center": "travel-products"
    },
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
}
```

### POST /project/update {#post-projectupdate}

更新現有專案。

**可呼叫者**：管理員或團隊管理員

**參數**：
- `project_id` (string, required): 要更新的專案
- `project_alias` (string, optional): 更新後的專案名稱
- `team_id` (string, optional): 將專案移至不同的團隊
- `models` (array, optional): 更新後的允許模型清單
- `max_budget` (float, optional): 更新後的預算
- `tpm_limit` (int, optional): 更新後的 TPM 限制
- `rpm_limit` (int, optional): 更新後的 RPM 限制
- `metadata` (object, optional): 更新後的中繼資料
- `blocked` (boolean, optional): 更新後的封鎖狀態

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/update' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "project_id": "project-abc",
    "max_budget": 200,
    "tpm_limit": 200000,
    "metadata": {
        "status": "production"
    }
}'
```

### GET /project/info {#get-projectinfo}

取得特定專案的資訊。

**參數**：
- `project_id` (string, required): 查詢參數

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/info?project_id=project-abc' \
--header 'Authorization: Bearer sk-1234'
```

**回應**：

```json
{
    "project_id": "project-abc",
    "project_alias": "flight-search-assistant",
    "team_id": "team-123",
    "models": ["gpt-4", "gpt-3.5-turbo"],
    "spend": 45.67,
    "model_spend": {
        "gpt-4": 42.30,
        "gpt-3.5-turbo": 3.37
    },
    "litellm_budget_table": {
        "budget_id": "budget-xyz",
        "max_budget": 100.0,
        "tpm_limit": 100000,
        "rpm_limit": 100
    },
    "metadata": {
        "use_case_id": "SNOW-12345"
    }
}
```

### GET /project/list {#get-projectlist}

列出使用者有權存取的所有專案。

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/list' \
--header 'Authorization: Bearer sk-1234'
```

**回應**：

```json
[
    {
        "project_id": "project-abc",
        "project_alias": "flight-search-assistant",
        "team_id": "team-123",
        "spend": 45.67
    },
    {
        "project_id": "project-def",
        "project_alias": "hotel-recommendations",
        "team_id": "team-123",
        "spend": 23.45
    }
]
```

### DELETE /project/delete {#delete-projectdelete}

刪除一或多個專案。

**可呼叫者**：僅限管理員

**參數**：
- `project_ids` (array, required): 要刪除的專案 ID 清單

**範例**：

```bash
curl --location --request DELETE 'http://0.0.0.0:4000/project/delete' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "project_ids": ["project-abc", "project-def"]
}'
```

**注意**：具有相關聯 API 金鑰的專案無法刪除。請先刪除或重新指派這些金鑰。

## 模型特定配額 {#model-specific-quotas}

您可以在專案內為不同模型設定不同的配額：

```bash
curl --location 'http://0.0.0.0:4000/project/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "multi-model-project",
    "team_id": "team-123",
    "models": ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"],
    "max_budget": 500,
    "metadata": {
        "model_tpm_limit": {
            "gpt-4": 50000,
            "gpt-3.5-turbo": 200000,
            "claude-3-sonnet": 100000
        },
        "model_rpm_limit": {
            "gpt-4": 50,
            "gpt-3.5-turbo": 500,
            "claude-3-sonnet": 100
        }
    }
}'
```
