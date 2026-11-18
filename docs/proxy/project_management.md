# 專案管理 {#project-management}

<EnterpriseFeature />

LiteLLM 中的專案位於組織階層中的團隊與金鑰之間，能夠針對特定使用情境或應用程式進行精細的存取控制與預算管理。

```mermaid
graph TD
    A[Organization] --> B[Team 1]
    A --> C[Team 2]
    B --> D[Project A]
    B --> E[Project B]
    C --> F[Project C]
    D --> G[API Key 1]
    D --> H[API Key 2]
    E --> I[API Key 3]
    F --> J[API Key 4]
    
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
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "flight-search-assistant",
    "team_id": "ad898803-c8a3-4f4a-976a-a3c372cffa45",
    "models": ["{{openai_large}}", "{{openai_small}}"],
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
  "models": ["{{openai_large}}", "{{openai_small}}"],
  "max_budget": 100,
  ...
}
```

### 步驟 2：為專案產生 API 金鑰 {#step-2-generate-api-key-for-project}

```bash showLineNumbers
curl 'http://0.0.0.0:4000/key/generate' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data-raw '{
    "models": ["{{openai_small}}", "{{openai_large}}"],
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
    "model": "{{openai_large}}",
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
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "hotel-recommendations",
    "team_id": "team-123",
    "models": ["{{anthropic}}"],
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
    "models": ["{{anthropic}}"],
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
- `metadata` (object, optional): 取代專案已儲存的中繼資料，詳見下文
- `blocked` (boolean, optional): 更新後的封鎖狀態

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/update' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
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

:::warning

`POST /project/update` 會取代專案整份已儲存的 `metadata`，而不是與其合併。專案也會將 `tags`、`guardrails`、`policies`、`model_rpm_limit` 與 `model_tpm_limit` 儲存在 `metadata` 中，因此只要更新傳送了其中任何一個或 `metadata`，就只會保留該請求所攜帶的內容。所以上方的範例同時也移除了專案的標籤與每個模型的限制。每當您更新這些欄位中的任何一個時，請一併傳送您想保留的每個鍵。

:::

### GET /project/info {#get-projectinfo}

取得特定專案的資訊。

**參數**：
- `project_id` (string, required): 查詢參數

**範例**：

```bash
curl --location 'http://0.0.0.0:4000/project/info?project_id=project-abc' \
--header "Authorization: Bearer $LITELLM_API_KEY"
```

**回應**：

```json
{
    "project_id": "project-abc",
    "project_alias": "flight-search-assistant",
    "team_id": "team-123",
    "models": ["{{openai_large}}", "{{openai_small}}"],
    "spend": 45.67,
    "model_spend": {
        "{{openai_large}}": 42.30,
        "{{openai_small}}": 3.37
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
--header "Authorization: Bearer $LITELLM_API_KEY"
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
--header "Authorization: Bearer $LITELLM_API_KEY" \
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
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
    "project_alias": "multi-model-project",
    "team_id": "team-123",
    "models": ["{{openai_large}}", "{{openai_small}}", "{{anthropic}}"],
    "max_budget": 500,
    "metadata": {
        "model_tpm_limit": {
            "{{openai_large}}": 50000,
            "{{openai_small}}": 200000,
            "{{anthropic}}": 100000
        },
        "model_rpm_limit": {
            "{{openai_large}}": 50,
            "{{openai_small}}": 500,
            "{{anthropic}}": 100
        }
    }
}'
```

### 要求專案模型設定配額 {#require-quotas-on-project-models}

配額預設是選用的，因此建立專案時，可以讓部分模型有限制、其他模型不設上限。在 `general_settings` 中設定 `enforce_project_model_quota` 即可要求配額 <SinceVersion v="1.100.0" />。

```yaml
general_settings:
  enforce_project_model_quota: true
```

設定為 `true` 時，除非專案上的每個模型都有正值的 `model_rpm_limit` 與 `model_tpm_limit`，否則 `POST /project/new` 與 `POST /project/update` 會回應 `400`，且錯誤會列出每個缺少限制的模型。列出 `all-proxy-models`、萬用字元（例如 `azure/*`）或模型存取群組的專案，在此設定開啟期間會被拒絕，因為這些會在請求時展開為多個模型，而速率限制器是以完全相同的模型名稱查詢配額。下方的對應形式也同樣適用，即使該對應豁免了該提供者也一樣。請改為列出具體的模型名稱。

這項檢查涵蓋專案列出的模型，因此 `models` 清單為空的專案會通過檢查。但該專案也不受任何模型限制，因此它的金鑰可以呼叫金鑰與其團隊允許的每個模型，且任何模型都沒有專案配額。當每個專案都必須設定上限時，請為每個專案提供 `models` 清單。

更新會以變更後的專案樣貌進行檢查。未傳送 `models` 的請求會保留已儲存的清單，但限制儲存在專案的 `metadata` 中，而傳送了任何儲存在該處之欄位的更新會取代這些限制，如 [`POST /project/update`](#post-projectupdate) 所述。因此該更新只會以它傳送的限制進行檢查，且除非它重複傳送專案模型需要的每個限制，否則會回應 `400`，即使它只變更標籤也一樣。未傳送任何儲存在 `metadata` 中之欄位的更新（例如只變更說明者），會以已儲存的限制進行檢查。因此一旦開啟此設定，對缺少限制的專案所做的每次更新都會回應 `400`，即使只設定 `blocked` 也一樣，直到某次更新設定了該限制，或將該模型從 `models` 移除為止。

### 每個提供者與每個模型的需求 {#per-provider-and-per-model-requirements}

<SinceVersion v="1.109.0" />

有些模型不需要 rpm 或 tpm 限制，例如影片生成模型或 pass-through 名稱。不要設定為 `true`，改為給此設定一個對應，說明每個提供者與模型需要哪些限制：

```yaml
general_settings:
  enforce_project_model_quota:
    default: [rpm, tpm]
    providers:
      vertex_ai: [rpm, tpm]
      runwayml: []
    models:
      "veo-*": [rpm]
      my-passthrough-model: []
```

每個項目列出它需要的限制：`[rpm, tpm]`、`[rpm]`、`[tpm]` 或 `[]`。項目會取代整份需求，因此 `[]` 豁免該提供者或模型，`[rpm]` 則免除 `tpm` 需求。`default` 適用於沒有其他項目決定的地方，省略時為 `[rpm, tpm]`，因此只列出豁免的對應，仍會要求其他每個模型同時具備兩種限制。使用上方的設定，專案可以列出不設任何限制的 Runway 模型與 `my-passthrough-model`、只設 `model_rpm_limit` 且名稱以 `veo-` 開頭的模型，以及在 Vertex AI 上同時具備兩種限制的 Gemini 模型。

早於 1.109.0 的 proxy 會將任何對應讀作 `true`，因此會要求每個模型同時具備兩種限制，並忽略豁免。在將 `true` 改為對應之前，請先升級 proxy。

對於專案上的每個模型，由下列第一個適用的項目決定：

1. `models` 下與模型完全相同名稱的項目。
2. `models` 下比對名稱開頭的最具體 `*` 模式，排序方式與路由器對其萬用字元路由的排序相同。模式不需要涵蓋到名稱結尾，因此 `"*-mini"` 也能比對 `gpt-5.4-mini-high`。
3. `providers` 下的項目，對應該名稱路由到的部署的提供者，包含別名、路由群組，以及請求會使用的萬用字元路由。由多個提供者服務的名稱，需要它們任何一個所要求的每個限制。
4. `default`，也涵蓋沒有任何部署服務的名稱。

提供者是指部署的 LiteLLM 提供者 id。也就是它設定的 `custom_llm_provider`，否則是其 `litellm_params.model` 的前綴（`vertex_ai/gemini-3.8-flash` 中的 `vertex_ai`），否則是已知 OpenAI 相容 `api_base` 背後的提供者（`deepseek-v4-flash` 搭配 `https://api.deepseek.com/v1` 時為 `deepseek`），否則是 LiteLLM 從模型名稱推斷的提供者（單獨的 `gemini-3.8-flash` 為 `vertex_ai`）。團隊模型服務的名稱，會以每個團隊部署呼叫的模型（其不含提供者前綴的 `litellm_params.model`）來與 `models` 項目比對，而不是以其團隊管理員選取的公開名稱比對，因此將團隊模型命名為某個豁免項目的名稱，並不會豁免它。團隊管理員也會選取被呼叫的模型，因此 `models` 下的豁免項目同樣會豁免呼叫該名稱模型的團隊模型，無論其提供者為何。已設定的限制仍然必須是正值，即使在被豁免的模型上也一樣，因此 `0` 或負值仍會如先前一樣回應 `400`。

當政策豁免任何提供者或模型時，團隊模型的新增、更新或刪除，會重新檢查該團隊中列出了該變更所服務之名稱的專案。當變更使該名稱需要一個它們未設定的限制時（例如將它從被豁免的提供者移到需要限制的提供者），會回應 `400` 並列出那些專案，因此請先在專案上設定限制，再變更模型。刪除後若沒有任何部署再服務該名稱，則不會重新檢查，因為已沒有任何東西可以呼叫該名稱。該名稱接著會落到它的 `models` 項目或 `default`，因此當這些需要限制時，列出該名稱的每個專案在下次更新時會回應 `400`，直到它移除該名稱或設定該限制為止。只有團隊模型的寫入會重新檢查專案。透過 API 或 `config.yaml` 新增或變更的共用模型，或對政策的編輯，可能會讓專案缺少限制而不產生錯誤，而該專案的下次更新接著會回應 `400`，直到它設定該限制為止。

布林設定接受的每個值都保留其意義。任何 falsy 值都是關閉，其他任何值都要求每個模型同時具備兩種限制。這包括字串 `"true"` 與 `"false"`，以及像 `{enabled: false}` 這樣的對應，因此請用 `false` 或移除該鍵來關閉檢查。只有指出 `default`、`providers` 或 `models` 的對應才會被讀作政策。若政策在這三者旁邊有未知的鍵、不是 `rpm` 或 `tpm` 的限制，或 LiteLLM 不認識的提供者 id，會使專案建立與更新，以及每個團隊模型的新增、更新與刪除回應 `500`，錯誤中會指出 `general_settings.enforce_project_model_quota`，而不是關閉檢查。`models` 下的模型名稱不會對照模型清單檢查，因為項目可能在任何人新增該模型之前就先指出它，因此拼錯的名稱會被忽略，該模型會退回到它的提供者。
