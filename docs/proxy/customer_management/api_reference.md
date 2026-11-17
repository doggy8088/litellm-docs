---
title: API 參考
sidebar_label: API 參考
description: 透過 Customer Management API 管理客戶組織、團隊、成員、budget 範本與使用量。
---

# API 參考 {#api-reference}

從您的後端使用這些 API 匯入客戶、設定 budget，並將使用量回傳給您的產品。若要完成完整整合，請依照[追蹤客戶支出](./track-customer-spend.md)操作。

管理基礎路徑為 `/management/v1`。客戶組織、團隊與成員，與 LiteLLM 內部的組織、團隊、使用者，以及 `/customer` 終端使用者記錄是分開的。

{/* keep-version-note: The reference describes verified main-branch contracts. A published release containing this complete surface has not been verified. */}

## 可用性 {#availability}

以下管理與使用量路由位於 `main` 上。請檢查您的 gateway 的 `/openapi.json` 並套用其客戶遷移。包含完整整合的已發行版本尚未經過驗證。

| 功能 | 所需變更 |
| --- | --- |
| 組織、團隊、成員、範本與使用量 API | 位於 `main`；成員使用 `budget_id`。 |
| 身分標頭、首次請求成員註冊與階層 budget 檢查 | 位於 `main`，包含 [#51546](https://github.com/BerriAI/litellm/pull/51546)。 |
| 即時共用客戶支出計數器 | 位於 `main`，包含 [#51568](https://github.com/BerriAI/litellm/pull/51568)。 |
| 成員電子郵件欄位與電子郵件身分標頭 | 預覽：[#51617](https://github.com/BerriAI/litellm/pull/51617)。 |
| 請求記錄中的客戶身分欄位 | 位於 `main`，包含 [#51596](https://github.com/BerriAI/litellm/pull/51596)。 |
| 客戶 budget 事件與 webhook 回呼 | 位於 `main`，包含 [#51579](https://github.com/BerriAI/litellm/pull/51579)，以及 [#51645](https://github.com/BerriAI/litellm/pull/51645) 中的週期性期間、成員事件與團隊覆寫修正。 |
| 原生 upsert 與首次請求建立組織 | 在 [#51607](https://github.com/BerriAI/litellm/pull/51607) 審查中；未記錄為受支援的契約。 |
| Fail-open 客戶身分處理 | 在 [#51604](https://github.com/BerriAI/litellm/pull/51604) 審查中；設定與斷言身分的記錄仍未驗證。 |

預覽功能在所連結的變更尚未合併期間，需要包含該變更的 build。

免費層級支援將 Customer Management 限制為：無 Enterprise 時最多 5 個組織、每個組織 5 個團隊、每個團隊 5 名成員。請查看 `/openapi.json` 中的 `/management/v1/customer_portal/limits`，確認您的 build 包含此功能。

## 驗證與慣例 {#authentication-and-conventions}

在管理請求上傳送 `Authorization: Bearer $LITELLM_ADMIN_KEY`。這些路由需要 `proxy_admin`，包括清單、取得與使用量請求。請將此金鑰保留在您的伺服器上，並在將資料回傳給您的應用程式之前先驗證客戶。

範例使用 `LITELLM_BASE_URL` 作為您 gateway 的基礎 URL，不含 `/v1` 或 `/ui`。範例在您的終端機中使用 `curl`。

```bash
export LITELLM_BASE_URL="http://localhost:4000"
export END_DATE="$(date -u +%Y-%m-%d)"
export START_DATE="$END_DATE"
```

使用量範例查詢 UTC 的今天。若要查詢較長範圍，請將 `START_DATE` 設為較早的 `YYYY-MM-DD` 值。

請透過您的 secret store 或現有的終端機環境設定 `LITELLM_ADMIN_KEY`。傳送 JSON 內文時使用 `Content-Type: application/json`。

先建立父層再建立子層。ID 可在整個 gateway 中識別記錄，因此請使用像 `acme-support` 這樣的客戶前綴。省略資源 ID 可讓 LiteLLM 自動產生。在路徑中使用 ID 時請進行 URL 編碼。透過逗號分隔的篩選條件查詢使用量時，請使用不含逗號的 ID。

建立回傳 `201`。取得與更新回傳 `200`，且資源物件位於最上層。刪除回傳 `204` 且無內文。資源清單回傳 `data`、`meta` 與 `links`；使用量讀取回傳 `results` 與 `metadata`。

### 重試客戶匯入 {#retry-a-customer-import}

以既有 ID 重複 `POST` 會回傳 `409`；它不會更新記錄。在逾時或收到 `409` 後，請取得該 ID，將其父層與設定與您的應用程式比對，然後使用 `PATCH` 進行所需變更。Patch 時請省略未變更的欄位。在資源允許的情況下，明確的 `null` 會清除可為 null 的欄位。

## Budget 物件 {#budget-object}

組織與團隊接受 `budget`。成員透過 `budget_id` 繼承範本，並接受 `budget_override` 作為自己的設定。

| 欄位 | 類型與預設值 | 意義 |
| --- | --- | --- |
| `max_budget` | 數字或 `null`；預設 `null` | 以 USD 計的支出上限。必須為有限值且至少為 `0`。 |
| `soft_budget` | 數字或 `null`；預設 `null` | 以 USD 計的軟性門檻，有限值且至少為 `0`。此值不會封鎖請求。通知需要[客戶 budget 回呼](#customer-budget-events)。 |
| `rpm_limit` | 整數或 `null`；預設 `null` | 每分鐘請求數。必須至少為 `0`。 |
| `tpm_limit` | 整數或 `null`；預設 `null` | 每分鐘 token 數。必須至少為 `0`。 |
| `allowed_models` | 字串陣列或 `null`；預設 `null` | 允許的 gateway 模型名稱。非空的成員覆寫會取代繼承的清單。空的覆寫清單會繼承範本的清單。 |
| `budget_duration` | 字串或 `null`；預設 `null` | 重置間隔，例如 `"1h"`、`"24h"`、`"7d"` 或 `"30d"`。必須解析為正的期間。 |
| `model_rpm_limit` | 物件或 `null`；預設 `null` | 模型名稱對應到非負的每分鐘請求數限制。 |
| `model_tpm_limit` | 物件或 `null`；預設 `null` | 模型名稱對應到非負的每分鐘 token 數限制。 |
| `budget_limits` | 陣列或 `null`；預設 `null` | 額外的支出上限，每個項目將 `budget_duration` 設為 `"1mo"`（每月）或 `"12mo"`（每年）並加上 `max_budget`，每個期間最多一個項目。其他值（包括 `"1y"`）會回傳 `422`。每個視窗獨立重置，並在達到上限時封鎖請求。Patch 會取代整個陣列。 |
| `cap_policy` | `"pause_until_reset"`、`"pause_allow_increase"` 或 `null`；預設 `null` | 成員在達到上限時可以做什麼。`null` 與 `"pause_until_reset"` 會等待重置。`"pause_allow_increase"` 讓成員可以[請求暫時提高](#budget-increase-requests)。 |

使用客戶身分標頭時，LiteLLM 會在推論前檢查組織、團隊與成員的 budget。請求必須通過每個適用的限制，且每個限制都有自己的支出計數器：團隊 budget 計算整個團隊的支出，而指派到同一個範本的成員各自計算自己的支出。某個範圍達到或超過 `max_budget` 或 `budget_limits` 視窗時，會造成 [budget 錯誤](./track-customer-spend.md#handle-a-budget-refusal-in-your-client)；組織優先於團隊與成員。實際範例請參閱[共用團隊 budget 或每位成員額度](./track-customer-spend.md#shared-team-budget-or-per-member-allowance)。LiteLLM 也會檢查每個範圍的模型存取與速率限制。沒有這些標頭的請求不會進入此階層強制路徑。

在[共用客戶支出計數器修正](https://github.com/BerriAI/litellm/pull/51568)之前的 build，在重新整理前可能使用快取的階層支出。請使用包含該變更的 build。在顯示餘額時，請將已在進行中的請求與背景帳務納入考量。

重置工作會針對設定的期間更新 `budget_reset_at` 與資源目前的 `spend` 計數器。請讀取回傳的時間戳記；歷史日期請使用使用量 API。Budget 重置不會清除歷史每日使用量。

### 共用回應欄位 {#common-response-fields}

每個組織、團隊與成員除了其資源專屬欄位外，還包含這些欄位。

| 欄位 | 類型 | 意義 |
| --- | --- | --- |
| `alias` | 字串或 `null` | 顯示名稱。 |
| `spend` | 數字；初始值 `0` | 以 USD 記錄的 budget 支出。帳務會在背景更新此值。 |
| `budget_reset_at` | 日期時間或 `null` | 下一次記錄的重置時間。 |
| `created_at`、`updated_at` | 日期時間 | 建立與最後更新的時間戳記。 |
| `created_by`、`updated_by` | 字串 | 每次寫入所記錄的執行者。 |

## Customer Management 限制 {#customer-management-limits}

`GET /management/v1/customer_portal/limits` 需要 proxy 管理員金鑰，回傳 `200` 與目前的 Customer Management 容量。它不接受查詢參數或請求內文。

```bash
curl "$LITELLM_BASE_URL/management/v1/customer_portal/limits" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY"
```

| 回應欄位 | 類型 | 意義 |
| --- | --- | --- |
| `limits_apply` | 布林值 | 沒有 LiteLLM Enterprise 授權時為 `true`。 |
| `organization_limit` | 整數 | 免費層級組織上限，`5`。 |
| `teams_per_organization_limit` | 整數 | 免費層級每個組織的團隊上限，`5`。包含自動建立的 `default` 團隊。 |
| `members_per_team_limit` | 整數 | 免費層級每個團隊的成員上限，`5`。成員會在其 `parent_team_ids` 中的每個團隊各計一次。 |
| `organization_count` | 整數 | 已註冊的客戶組織總數。 |
| `any_limit_reached` | 布林值 | 當限制適用且組織數量至少為 5、任一組織至少有 5 個團隊，或任一團隊至少有 5 名成員時為 `true`。有 Enterprise 時永遠為 `false`。 |

```json title="Free-tier deployment at the organization limit"
{
  "limits_apply": true,
  "organization_limit": 5,
  "teams_per_organization_limit": 5,
  "members_per_team_limit": 5,
  "organization_count": 5,
  "any_limit_reached": true
}
```

Enterprise 會移除這些限制。當 `limits_apply` 為 `false` 時，數字欄位仍會回報免費層級的門檻。達到容量時與授權失效後的請求追蹤，請參閱[免費層級行為](./track-customer-spend.md#free-tier-limits)。

## 客戶組織 {#customer-organizations}

| 方法 | 路徑 | 結果 |
| --- | --- | --- |
| `POST` | `/management/v1/customer_organizations` | `201`，組織。 |
| `GET` | `/management/v1/customer_organizations` | `200`，組織清單。支援 `q`。 |
| `GET` | `/management/v1/customer_organizations/{customer_org_id}` | `200`，組織。 |
| `PATCH` | `/management/v1/customer_organizations/{customer_org_id}` | `200`，更新後的組織。 |
| `DELETE` | `/management/v1/customer_organizations/{customer_org_id}` | `204`。請先刪除其團隊。 |

### 請求欄位 {#request-fields}

| 欄位 | 建立 | 更新 | 意義 |
| --- | --- | --- | --- |
| `customer_org_id` | 可選，省略時自動產生 | 不接受 | 穩定的組織 ID。 |
| `alias` | 可選，預設 `null` | 可選；`null` 會清除 | 顯示名稱，以及 `x-litellm-customer-org-alias` 使用的值。標頭查詢請使用唯一的 alias。 |
| `budget` | 可選，預設 `null` | 可選；`null` 會移除整體 budget | 組織的 [budget 物件](#budget-object)。 |
| `default_budgets` | 可選，預設 `[]` | 不接受 | 具名的成員範本。單一範本會成為預設；有多個時，透過 `default_budget_template` 以名稱選取一個。 |
| `default_budget_template` | 可選，預設 `null` | 不接受 | `default_budgets` 中用於新成員的名稱。建立多個範本時必填。 |
| `default_budget_template_id` | 不接受 | 可選；`null` 會清除預設 | 此組織 `default_budgets` 中的範本 ID。變更用於新成員的預設範本。 |

| 其他回應欄位 | 類型 | 意義 |
| --- | --- | --- |
| `customer_org_id` | 字串 | 組織 ID。 |
| `budget_id` | 字串或 `null` | 組織自身的 budget 記錄。 |
| `budget` | Budget 物件或 `null` | 組織的整體限制。 |
| `member_count` | 整數 | 組織各團隊中已註冊的成員數。 |
| `default_budget_template_id` | 字串或 `null` | 預設成員範本 ID。 |
| `default_budgets` | 陣列 | 成員範本，每個包含 budget 欄位以及 `budget_id` 與 `name`。將 `budget_id` 與 `default_budget_template_id` 比對即可識別預設範本。 |

```bash title="Create an organization with a default member template"
curl --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_organizations" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "customer_org_id": "org-acme",
    "alias": "Acme",
    "budget": {
      "max_budget": 1000,
      "budget_duration": "30d"
    },
    "default_budgets": [
      {
        "name": "standard",
        "max_budget": 50,
        "budget_duration": "30d"
      }
    ],
    "default_budget_template": "standard"
  }'
```

## 客戶團隊 {#customer-teams}

| 方法 | 路徑 | 結果 |
| --- | --- | --- |
| `POST` | `/management/v1/customer_teams` | `201`，團隊。 |
| `GET` | `/management/v1/customer_teams` | `200`，團隊清單。支援 `parent_org_id`。 |
| `GET` | `/management/v1/customer_teams/{customer_team_id}` | `200`，團隊。 |
| `PATCH` | `/management/v1/customer_teams/{customer_team_id}` | `200`，更新後的團隊。 |
| `DELETE` | `/management/v1/customer_teams/{customer_team_id}` | `204`。請先刪除其成員。 |

| 請求欄位 | 建立 | 更新 | 意義 |
| --- | --- | --- | --- |
| `customer_team_id` | 可選，省略時自動產生 | 不接受 | 穩定的團隊 ID。 |
| `parent_org_id` | 必填 | 不接受 | 既有的客戶組織 ID。 |
| `alias` | 可選，預設 `null` | 可選；`null` 會清除 | 顯示名稱。 |
| `budget` | 可選，預設 `null` | 可選；`null` 會移除 | 團隊的 [budget 物件](#budget-object)。 |
| `budget_override` | 可選，預設 `null` | 可選；`null` 會移除 | 覆寫 `budget` 的團隊 [budget 欄位](#budget-object)。 |
| `budget_override_expires_at` | 可選，預設 `null` | 可選；`null` 會移除到期時間 | 帶有時區的時間戳記。到期後，團隊使用 `budget`。 |

| 其他回應欄位 | 類型 | 意義 |
| --- | --- | --- |
| `customer_team_id`、`parent_org_id` | 字串 | 團隊 ID 與其客戶組織 ID。 |
| `budget_id` | 字串或 `null` | 團隊自身的 budget 記錄。 |
| `budget` | Budget 物件或 `null` | 團隊限制。團隊 budget 缺失不會移除組織或成員的限制。 |
| `budget_override_id`、`budget_override`、`budget_override_expires_at` | 字串、budget 物件與日期時間，各自可為 null | 已儲存的團隊覆寫與其到期時間。 |
| `effective_budget` | Budget 物件 | 團隊 budget 加上其生效中的覆寫。 |

```bash title="Create a customer team"
curl --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_teams" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "customer_team_id": "acme-support",
    "parent_org_id": "org-acme",
    "alias": "Support",
    "budget": {
      "max_budget": 250,
      "budget_duration": "30d"
    }
  }'
```

## 客戶成員 {#customer-members}

| 方法 | 路徑 | 結果 |
| --- | --- | --- |
| `POST` | `/management/v1/customer_members` | `201`，成員。每次請求一名成員。 |
| `GET` | `/management/v1/customer_members` | `200`，成員清單。支援 `parent_team_id`。 |
| `GET` | `/management/v1/customer_members/{customer_member_id}` | `200`，成員及其 effective budget。 |
| `PATCH` | `/management/v1/customer_members/{customer_member_id}` | `200`，更新後的成員。 |
| `DELETE` | `/management/v1/customer_members/{customer_member_id}` | `204`。會移除其擁有的覆寫 budget。 |

| 請求欄位 | 建立 | 更新 | 意義 |
| --- | --- | --- | --- |
| `customer_member_id` | 可選，省略時自動產生 | 不接受 | 穩定的成員 ID。 |
| `parent_team_ids` | 必填，非空陣列 | 可選；取代所有團隊；預覽 #51913 | 來自同一個客戶組織的既有客戶團隊 ID。第一個團隊是成員的預設團隊。 |
| `parent_org_id` | 可選 | 不接受 | 客戶組織 ID。設定時，必須與團隊的組織相符。 |
| `email` | 可選，預設 `null`；預覽 #51617 | 可選；`null` 會清除；預覽 #51617 | 修剪並轉為小寫後 1–254 個字元的字串。在客戶組織內唯一。 |
| `alias` | 可選，預設 `null` | 可選；`null` 會清除 | 顯示名稱。 |
| `budget_id` | 可選；省略或 `null` 時使用組織的預設範本 | 可選；`null` 會解除範本連結 | 來自同一個客戶組織的成員範本 ID。 |
| `budget_override` | 可選，預設 `null` | 可選；`null` 會移除 | 覆寫範本的成員 [budget 欄位](#budget-object)。 |
| `budget_override_expires_at` | 可選，預設 `null` | 可選；`null` 會移除到期時間 | 帶有時區的時間戳記。到期後，成員使用其範本的設定。 |

### 將成員移至其他團隊（預覽） {#move-a-member-to-other-teams-preview}

移動成員需要 [#51913](https://github.com/BerriAI/litellm/pull/51913)。在 `parent_team_ids` 中傳送成員完整的新團隊清單。清單會取代目前的團隊，因此請包含成員保留的每個團隊，預設團隊放第一個。省略此欄位可讓團隊保持不變。

```bash title="Move Alice to the Billing team"
curl --request PATCH \
  "$LITELLM_BASE_URL/management/v1/customer_members/acme-alice" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{"parent_team_ids": ["acme-billing"]}'
```

每個團隊都必須已存在於成員目前的組織中。空清單、`null`、空白或重複的 ID 會回傳 `422`，未知團隊回傳 `404`，來自其他組織的團隊回傳 `409`。只有成員原本不在的團隊，才會計入每團隊成員上限。

成員會保留其 ID、範本、覆寫、`spend`、budget 視窗與 `budget_reset_at`。移動前記錄的使用量會留在舊團隊。之後沒有團隊標頭的請求，在背景帳務完成後會向新的預設團隊收費，而 `x-litellm-customer-team-id` 指名已移除團隊的請求會回傳 `403`。

在儀表板中，開啟 **Members** 分頁上該成員的操作選單，選擇 **Move teams**，挑選團隊與預設團隊，然後儲存。

選取的成員範本請使用 `budget_id`。目前的 API 會拒絕舊的 `budget_template_id` 欄位。回應的 `budget_override_id` 識別獨立的覆寫記錄；它是唯讀的。

成員需要一個選取的範本或 `budget_override`。LiteLLM 會將非 null 的覆寫欄位與範本合併。非空的 `allowed_models` 覆寫會取代繼承的模型。覆寫的 `budget_limits` 項目會取代具有相同 `budget_duration` 的範本視窗，並保留範本的其他視窗，除非覆寫設定了自己的 `max_budget`，此時會捨棄範本的視窗。在 `budget_override_expires_at` 之後，成員會再次使用範本。請讀取 `effective_budget` 以顯示目前適用的設定，包括覆寫到期時間。

```bash title="Create a member using the organization's default template"
curl --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_members" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "customer_member_id": "acme-alice",
    "parent_team_ids": ["acme-support"],
    "alias": "Alice"
  }'
```

| 其他回應欄位 | 類型 | 意義 |
| --- | --- | --- |
| `customer_member_id`、`parent_org_id` | 字串 | 成員 ID 與其客戶組織 ID。 |
| `parent_team_ids` | 字串陣列 | 成員的客戶團隊，預設團隊在第一個。 |
| `email` | 字串或 `null`；預覽 #51617 | 正規化後的電子郵件（當 build 包含成員電子郵件支援時）。 |
| `budget_id` | 字串或 `null` | 選取的組織範本。 |
| `budget_override_id` | 字串或 `null` | 擁有的覆寫記錄。 |
| `budget_override` | Budget 物件或 `null` | 已儲存的覆寫，包括已到期的覆寫。 |
| `budget_override_expires_at` | 日期時間或 `null` | 已儲存的覆寫到期時間。 |
| `effective_budget` | Budget 物件 | 範本加上生效中的覆寫。 |

:::info 成員電子郵件需要 #51617

Main 使用 `customer_member_id` 作為成員身分。將電子郵件字串作為該 ID 傳送，不會以電子郵件查詢既有成員。`email` 資源欄位與 `x-litellm-customer-member-email` 標頭需要包含 [#51617](https://github.com/BerriAI/litellm/pull/51617) 的 build。該標頭需要 `x-litellm-customer-org-alias`；成員 ID 與電子郵件身分衝突時回傳 `403`。

:::

## 成員 budget 範本 {#member-budget-templates}

範本屬於客戶組織。更新範本會變更其成員繼承的設定；每位成員保留自己的支出計數器，因此範本不會像[團隊 budget](./track-customer-spend.md#shared-team-budget-or-per-member-allowance) 那樣匯集支出。變更預設範本會影響新成員；它不會重新指派既有成員。

| 方法 | 路徑 | 結果 |
| --- | --- | --- |
| `POST` | `/management/v1/customer_organizations/{customer_org_id}/default_budgets` | `201`，包含更新後 `default_budgets` 的組織。 |
| `PATCH` | `/management/v1/customer_organizations/{customer_org_id}/default_budgets/{budget_id}` | `200`，更新後的組織。 |
| `DELETE` | `/management/v1/customer_organizations/{customer_org_id}/default_budgets/{budget_id}` | `204`。範本必須未被使用，且不得是預設範本。 |

建立接受 [budget 物件](#budget-object) 以及必填的非空 `name`。名稱在組織內必須唯一。第一個範本會成為預設。更新接受 budget 欄位與可選的 `name`。範本請求不接受 `is_default`；請透過組織的 `default_budget_template_id` 欄位選取預設範本。

```bash title="Add a named member template"
curl --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_organizations/org-acme/default_budgets" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "extended",
    "max_budget": 100,
    "budget_duration": "30d"
  }'
```

若要將此範本設為新成員的預設，請從回應的 `default_budgets` 陣列複製其 `budget_id`。將下方的 `<budget_id>` 替換為該值：

```bash title="Choose the default member template"
curl --request PATCH \
  "$LITELLM_BASE_URL/management/v1/customer_organizations/org-acme" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{"default_budget_template_id":"<budget_id>"}'
```

變更預設範本不會重新指派既有成員。刪除目前的範本前，請先選取另一個預設範本或清除它；被引用的範本仍無法刪除。

## Budget 提高請求 {#budget-increase-requests}

有效 budget 具有 `cap_policy: "pause_allow_increase"` 的成員，可以請求暫時提高上限。達到上限時的 budget 錯誤會指名此路由。具有其他政策的成員會收到 `422`。

| 方法 | 路徑 | 結果 |
| --- | --- | --- |
| `POST` | `/management/v1/customer_budget_increase_requests` | `201`，`status: "pending_review"` 的請求。 |
| `GET` | `/management/v1/customer_budget_increase_requests` | `200`，審查佇列。 |
| `GET` | `/management/v1/customer_budget_increase_requests/{request_id}` | `200`，單一請求。 |
| `PUT` | `/management/v1/customer_budget_increase_requests/{request_id}/approve` | `200`。成員的覆寫會採用 `requested_max_budget` 直到 `expires_at`。 |
| `PUT` | `/management/v1/customer_budget_increase_requests/{request_id}/reject` | `200`。成員保持暫停。接受可選的 `review_notes`。 |

建立需要 `customer_member_id`、`requested_max_budget` 與帶有時區的 `expires_at`，並接受可選的 `reason`。

```bash title="Request a temporary increase"
curl --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_budget_increase_requests" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "customer_member_id": "acme-alice",
    "requested_max_budget": 75,
    "expires_at": "2026-12-01T00:00:00Z",
    "reason": "Quarter-end workload"
  }'
```

## 清單分頁 {#list-pagination}

組織、團隊與成員清單共用這些查詢參數。未知參數與重複的查詢參數會回傳 `400`。

| 參數 | 預設值 | 意義 |
| --- | --- | --- |
| `page` | `1` | 頁碼，至少 `1`。 |
| `page_size` | `50` | 請求的列數，至少 `1`。伺服器上限為 `100`。 |
| `q` | `""` | 僅組織清單。組織 ID 或 alias 的不分大小寫子字串。 |
| `parent_org_id` | 未設定 | 僅團隊清單。限制為單一組織。 |
| `parent_team_id` | 未設定 | 僅成員清單。限制為單一團隊的成員。 |

```bash title="List a customer's teams"
curl --get \
  "$LITELLM_BASE_URL/management/v1/customer_teams" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --data-urlencode "parent_org_id=org-acme" \
  --data-urlencode "page=1" \
  --data-urlencode "page_size=100"
```

回應包含 `data`（資源物件）、`meta.total_count`、`meta.page`、`meta.page_size`、`meta.total_pages`，以及 `links.self`、`first`、`prev`、`next` 與 `last`。當該頁不存在時，`prev` 與 `next` 為 `null`。請跟隨 `links.next`，或在 `meta.total_pages` 停止。

## 推論請求歸屬 {#attribute-inference-requests}

將這些標頭與您應用程式使用的推論金鑰一起傳送。它們適用於 Chat Completions、Responses 與 Anthropic Messages。

| 標頭 | 意義 |
| --- | --- |
| `x-litellm-customer-org-alias` | 依其 `alias` 解析客戶組織。單獨使用時，向組織範圍收費並檢查組織範圍。 |
| `x-litellm-customer-member-id` | 解析成員，再解析其父團隊與組織。單獨使用時，需要既有成員。 |

同時使用兩個標頭時，LiteLLM 會檢查該成員屬於該組織。當組織有預設成員 budget 時，未知成員會加入組織的 `default` 團隊。LiteLLM 將該團隊的 ID 產生為 `{customer_org_id}:default`。未知的組織 alias 回傳 `401`；共用的 alias 回傳 `400`；成員與組織不符回傳 `403`。

在各客戶之間使用您現有的應用程式金鑰。您的後端從已驗證的客戶工作階段選擇組織 alias 與成員 ID，並在 SDK 請求中傳遞它們。請參閱 [OpenAI Responses 與 Deep Agents 範例](./track-customer-spend.md)。

| 支援的推論 API | 路由 |
| --- | --- |
| OpenAI Responses | `POST /v1/responses` |
| Chat Completions | `POST /v1/chat/completions` |
| Anthropic Messages | `POST /v1/messages` |


## 客戶使用量 {#customer-usage}

四種讀取都需要 proxy 管理員金鑰。日期使用含起訖的 UTC 日曆日。支出使用 USD；token 與請求使用整數計數。請分別查詢每個階層以取得其明細；將組織、團隊與成員的總計相加，會重複計算相同的請求。

| 方法 | 路徑 | 客戶篩選 | 分頁 |
| --- | --- | --- | --- |
| `GET` | `/management/v1/customer_organizations/daily/activity` | `customer_org_ids` | `page`、`page_size`。 |
| `GET` | `/management/v1/customer_teams/daily/activity` | `customer_team_ids` | `page`、`page_size`。 |
| `GET` | `/management/v1/customer_members/daily/activity` | `customer_member_ids` | `page`、`page_size`。 |
| `GET` | `/management/v1/customer_organizations/daily/activity/aggregated` | 必填 `customer_org_ids`，1–100 個 ID | 在單一回應中提供完整範圍總計。 |

### 每日活動參數 {#daily-activity-parameters}

| 參數 | 預設值 | 意義 |
| --- | --- | --- |
| `start_date`、`end_date` | 必填 | `YYYY-MM-DD` 格式的日期。 |
| 上表的客戶篩選 | 在分頁路由上未設定 | 以逗號分隔的 ID。省略時會查詢 proxy 管理員可見的所有客戶實體。 |
| `exclude_customer_org_ids`、`exclude_customer_team_ids`、`exclude_customer_member_ids` | 未設定 | 僅分頁路由。請使用該路由實體類型的排除欄位。 |
| `model` | 未設定 | 依記錄的模型篩選。 |
| `api_key` | 未設定 | 依使用量回應中的回報 API 金鑰 ID 篩選。不要將原始推論金鑰放在 URL 中。 |
| `page` | `1` | 僅分頁路由。必須至少為 `1`。 |
| `page_size` | `10` | 僅分頁路由。必須至少為 `1`。 |

未知的查詢參數與重複參數會回傳 `400`。彙總路由接受起訖日期之間最多 400 天的差距。它回傳完整的支出、請求與 token 總計；其 API 金鑰明細只包含最高的金鑰。

```bash title="Complete organization totals for your product"
curl --get \
  "$LITELLM_BASE_URL/management/v1/customer_organizations/daily/activity/aggregated" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --data-urlencode "customer_org_ids=org-acme" \
  --data-urlencode "start_date=$START_DATE" \
  --data-urlencode "end_date=$END_DATE"
```

### 使用量分頁 {#usage-pagination}

組織彙總使用量在單一回應中回傳完整範圍。團隊與成員的每日活動使用 `page` 與 `page_size`。

若要取得另一頁，請以次一頁碼重複請求：

```bash title="Second page of member usage"
curl --get "$LITELLM_BASE_URL/management/v1/customer_members/daily/activity" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --data-urlencode "customer_member_ids=acme-alice" \
  --data-urlencode "start_date=$START_DATE" \
  --data-urlencode "end_date=$END_DATE" \
  --data-urlencode "page=2" \
  --data-urlencode "page_size=100"
```

將每頁的總計加總一次。當 `metadata.has_more` 為 `false` 時停止；建立圖表時請合併相同的日期。

### 使用量回應 {#usage-response}

| 欄位 | 意義 |
| --- | --- |
| `results[].date` | `YYYY-MM-DD` 格式的 UTC 日期。 |
| `results[].metrics` | `spend`、`prompt_tokens`、`completion_tokens`、`total_tokens`、`api_requests`、`successful_requests`、`failed_requests`，以及其他記錄的指標。 |
| `results[].breakdown` | 依 `models`、`model_groups`、`providers`、`endpoints`、`api_keys` 與 `entities`（如有）分類的指標。實體中繼資料包含其 `alias`。 |
| `metadata.total_spend`、`total_tokens`、`total_api_requests` | 此回應的總計。 |
| `metadata.page`、`total_pages`、`has_more` | 分頁資訊。彙總回應使用 `1`、`1` 與 `false`。 |

分頁活動會先限制儲存的列數，再依日期分組。同一日期可能出現在多頁上。將每頁總計加總一次，並合併相同日期，直到 `metadata.has_more` 為 `false`。持續遞增 `page` 直到 `metadata.has_more` 為 `false`。

```json title="Usage response excerpt"
{
  "results": [{
    "date": "2026-11-13",
    "metrics": {"spend": 0.14, "total_tokens": 120, "api_requests": 1}
  }],
  "metadata": {
    "total_spend": 0.14,
    "total_tokens": 120,
    "total_api_requests": 1,
    "page": 1,
    "total_pages": 1,
    "has_more": false
  }
}
```

帳務在背景寫入使用量。如果成功的推論請求尚無使用量，請檢查日期範圍與客戶標頭。零成本模型可以回報 token 與請求，但沒有支出。

## 客戶 budget 事件 {#customer-budget-events}

客戶 budget 事件透過 [#51579](https://github.com/BerriAI/litellm/pull/51579)，以及[客戶 budget 警示修正 #51645](https://github.com/BerriAI/litellm/pull/51645)（涵蓋週期性期間、成員事件與團隊覆寫）位於 `main`。請使用包含這兩個變更的 build。在 `litellm_settings.callbacks` 中註冊 `customer_budget_webhook`。透過最上層的 `callback_settings.customer_budget_webhook` 設定它：

| 設定 | 類型 | 意義 |
| --- | --- | --- |
| `endpoint` | HTTP 或 HTTPS URL | 接收端 URL。省略時以 `CUSTOMER_BUDGET_WEBHOOK_URL` 作為備援。必須透過其中一個來源提供。 |
| `headers` | 字串值的物件 | 額外的請求標頭。覆寫來自 `CUSTOMER_BUDGET_WEBHOOK_HEADERS` 的相符值（透過環境提供的 JSON 物件）。預設為 `Content-Type: application/json`。 |

回呼會直接以 JSON 傳送事件。[指南提供完整的設定與範例 payload](./track-customer-spend.md#1-set-up-budget-webhooks)。它使用與 `CustomLogger.async_on_customer_budget_event(event: CustomerBudgetEvent)` 相同的事件物件。

| 事件欄位 | 類型 | 意義 |
| --- | --- | --- |
| `event` | `"soft_budget_crossed"` 或 `"budget_crossed"` | 在正支出更新提交後，記錄的支出達到或超過對應的設定門檻。 |
| `scope` | `"customer_org"`、`"customer_team"` 或 `"customer_member"` | 達到門檻的範圍。 |
| `entity_id` | 字串 | 事件範圍的 ID。 |
| `customer_org_id`、`customer_org_alias` | 字串或 `null` | 解析出的客戶組織。 |
| `customer_team_id`、`customer_team_alias` | 字串或 `null` | 團隊事件解析出的團隊；組織與成員事件為 `null`。 |
| `customer_member_id`、`customer_member_alias` | 字串或 `null` | 成員事件解析出的成員；其他範圍為 `null`。 |
| `spend` | 數字 | 帳務後以 USD 記錄的支出。 |
| `budget` | 數字 | 以 USD 計的門檻：依 `event` 為 `soft_budget` 或 `max_budget`。 |
| `period` | 字串 | 記錄的下一次重置時間戳記，未記錄重置時為 `"lifetime"`。 |
| `timestamp` | 日期時間 | 偵測到事件的時間。 |

團隊與成員使用其有效的範本與生效中的覆寫。成員 budget 涵蓋成員在各團隊間的使用，因此成員事件沒有團隊 ID 或 alias。一次更新可以在多個範圍發出兩種事件類型。在推論前被拒絕的請求、零成本更新與退款不會觸發此偵測器。

Webhook 接受成功的 `2xx` 回應，逾時為 10 秒。傳遞採盡力而為。事件 claim 以 `(event, scope, entity_id, period)` 為鍵，直到該 budget 期間重置為止，即使傳遞失敗也會保留。Lifetime budget 使用 TTL 為 100 年的快取 claim。共用的 Redis 會在各 worker 間協調 claim；記憶體備援可能產生重複。HTTP 用戶端會在連線錯誤時重試一次。對於 HTTP 錯誤或逾時，沒有持久的重試佇列、退避或重播 API。請使用使用量讀取來核對漏掉的事件；不要將回呼作為您唯一的計費記錄。

## 錯誤 {#errors}

管理錯誤使用 problem details，包含 `type`、`title`、`status` 與 `detail`。未知查詢參數的回應可以包含 `allowed`，即接受的參數名稱。

| 狀態 | 原因與下一步 |
| --- | --- |
| `400` | 未知或重複的查詢參數、無效的日期範圍或無效的分頁。請檢查該路由的參數表。 |
| `401` | 缺少或無效的驗證。在推論時，也請檢查未知的成員或組織 alias。 |
| `403` | 呼叫者缺少 `proxy_admin`，或成員不屬於提供的客戶組織。 |
| `403` | 免費層級建立上限。Type `urn:litellm:error:customer-hierarchy-free-tier-limit`，title `Customer Management free tier limit reached`，detail `Customer Management free tier limit reached: up to 5 customer organizations, 5 teams per organization and 5 members per team without a LiteLLM Enterprise license. Upgrade to Enterprise to remove the limits: https://www.litellm.ai/enterprise`。重試前請升級至 Enterprise 或釋放容量。 |
| `404` | 資源或父層不存在。請先取得或建立父層。 |
| `409` | ID 重複、父層仍有子層，或範本仍是預設或被引用。 |
| `422` | 無效的內文、budget 值、範本選取，或缺少成員 budget。推論 budget 拒絕預設也使用 `422`，其推論錯誤內文的 type 為 `budget_exceeded`。請參閱[在您的用戶端處理 budget 拒絕](./track-customer-spend.md#handle-a-budget-refusal-in-your-client)。 |
| `429` | 推論請求超過設定的速率限制。當部署設定 `budget_exceeded_status_code: 429` 時，budget 拒絕也使用 `429`；錯誤內文可區分兩者。 |
| `503` | 管理資料庫無法使用。 |

```json title="Duplicate customer ID"
{
  "type": "urn:litellm:error:customer-hierarchy-already-exists",
  "title": "Already exists",
  "status": 409,
  "detail": "Customer entity ID already exists."
}
```
