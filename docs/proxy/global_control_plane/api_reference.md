---
title: API 參考
sidebar_label: API 參考
toc_max_heading_level: 2
description: 控制平面端點、驗證、範圍、查詢參數、回應與錯誤。
---

# API 參考 {#api-reference}

{/* keep-version-note */}

## 概覽 {#overview}

這些路徑使用預設的 `/api/v1` 前綴。設定 [`CONTROL_PLANE_API_PREFIX`](./configuration.md#server) 可變更它。驗證與服務設定請參閱[組態](./configuration.md)。

## 驗證 {#authentication}

經驗證的請求使用 HTTP Bearer 驗證：`Authorization: Bearer <credential>`。標頭語法請參閱 [RFC 6750 第 2.1 節](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1)。控制平面會檢查範圍與資料平面存取權限。每個資料平面也會對轉送的請求套用自身的權限。

| 驗證方法 | Bearer 憑證 |
| --- | --- |
| IdP JWT 驗證 | 來自已設定的 [OpenID Connect (OIDC) 提供者](https://openid.net/specs/openid-connect-core-1_0.html) 的 JWT 存取 token。 |
| 使用者名稱與密碼登入 | 由 `POST /api/v1/auth/login` 簽發的工作階段 JWT。 |
| 主金鑰驗證 | 在 `LITELLM_MASTER_KEY` 中設定的靜態 LiteLLM API 金鑰。 |

JWT 憑證使用 [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html) 定義的 JSON Web Token 格式。

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | 無。不需要 bearer token。 | `access_token`、`token_type` 與以秒計的 `expires_in`。 |
| `GET` | `/api/v1/auth/me` | 無。需要 bearer token。 | `subject`、`email`、`roles`、`scopes`、`dataplanes` 與 `token_kind`。 |

`POST /api/v1/auth/login` 接受：

```json
{
  "username": "operator",
  "password": "REPLACE_WITH_PASSWORD"
}
```

兩個欄位都是必填。使用者名稱接受 1 至 256 個字元。密碼接受 1 至 1024 個字元。登入會檢查設定的 `UI_USERNAME` 與 `UI_PASSWORD` 值。它會在 `access_token` 中回傳工作階段 JWT，設定 `token_type: "bearer"`，並停用快取。

`GET /api/v1/auth/me` 回傳的 `token_kind` 為 `oidc`、`session` 或 `master_key`。`dataplanes` 為 `null` 表示全機隊存取權限。否則，它會列出呼叫者允許的資料平面 ID。

### 範圍與角色 {#scopes-and-roles}

#### 範圍 {#scopes}

| 範圍 | 授予權限 | 預設角色 |
| --- | --- | --- |
| `dataplanes:read` | 讀取登錄項目、檢查資料平面健康狀態，並檢視有效身分。 | `admin`, `editor`, `viewer` |
| `fleet:read` | 列出跨資料平面的模型與團隊。 | `admin`, `editor`, `viewer` |
| `usage:read` | 讀取用量摘要、每日用量與最高花費者。 | `admin`, `editor`, `viewer`, `usage_viewer` |
| `proxy:read` | 將 `GET` 與 `HEAD` 請求轉送至支援的資料平面管理路由。 | `admin`, `editor`, `viewer` |
| `proxy:write` | 將 `POST`、`PUT`、`PATCH` 與 `DELETE` 請求轉送至支援的資料平面管理路由。 | `admin`, `editor` |
| `audit:read` | 以原生或 OCSF 格式讀取近期的控制平面稽核事件。 | `admin` |
| `dataplanes:write` | 建立、取代與刪除執行期資料平面登錄項目。需要全機隊資料平面存取權限。 | `admin` |
| `roles:write` | 列出角色，並建立、取代或刪除執行期角色。新角色的授予不得超過呼叫者的有效範圍。 | `admin` |

控制平面會合併呼叫者已識別角色所授予的範圍。自訂角色定義可以變更上述預設授予。控制平面主金鑰擁有所有範圍。

選用的 OIDC `scope` 聲明會將角色授予縮小至它列出的範圍。它無法新增權限。缺少或為 `null` 的聲明會保留完整的角色授予。空的聲明，或只包含 `openid profile` 等值的聲明，不授予任何控制平面範圍。

資料平面存取與範圍是分開的。呼叫者的 `litellm_dataplanes` 聲明限制這些範圍適用於哪些資料平面。缺少或空的聲明，或包含 `"*"` 的聲明，授予全機隊存取權限。每個資料平面仍會檢查自身的權限。角色與聲明設定請參閱[驗證](./configuration.md#authentication)。

#### 角色 {#roles}

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/roles` | `roles:write` | `200`，`items` 包含所有有效角色。無需執行期儲存即可運作。 |
| `PUT` | `/api/v1/roles/{name}` | `roles:write` | 建立或取代執行期角色。回傳 `200` 並附上一個角色。 |
| `DELETE` | `/api/v1/roles/{name}` | `roles:write` | 刪除執行期角色。回傳 `204`，無內文。 |

每個角色回應包含 `name`、解析後的 `scopes`、直接的 `inherits` 與 `source`。組態定義與內建角色的來源為 `config`，其餘為 `runtime`。清單依名稱排序。沒有單一角色的 GET 端點。

PUT 接受 `scopes` 與 `inherits`，兩者都是字串陣列，預設為空陣列。它會取代完整定義。範圍名稱與繼承的角色必須是已知的。例如，此角色從內建的 `usage_viewer` 角色繼承 `usage:read`：

```http
PUT /api/v1/roles/finops
Authorization: Bearer REPLACE_WITH_ADMIN_CREDENTIAL
Content-Type: application/json

{"scopes": [], "inherits": ["usage_viewer"]}
```

`200` 回應包含解析後的範圍：

```json
{
  "name": "finops",
  "scopes": ["usage:read"],
  "inherits": ["usage_viewer"],
  "source": "runtime"
}
```

在啟用預設角色且沒有其他自訂角色時，`GET /api/v1/roles` 回傳：

```json
{
  "items": [
    {"name": "admin", "scopes": ["audit:read", "dataplanes:read", "dataplanes:write", "fleet:read", "proxy:read", "proxy:write", "roles:write", "usage:read"], "inherits": [], "source": "config"},
    {"name": "editor", "scopes": ["dataplanes:read", "fleet:read", "proxy:read", "proxy:write", "usage:read"], "inherits": [], "source": "config"},
    {"name": "finops", "scopes": ["usage:read"], "inherits": ["usage_viewer"], "source": "runtime"},
    {"name": "usage_viewer", "scopes": ["usage:read"], "inherits": [], "source": "config"},
    {"name": "viewer", "scopes": ["dataplanes:read", "fleet:read", "proxy:read", "usage:read"], "inherits": [], "source": "config"}
  ]
}
```

角色解析後的範圍（包括繼承的範圍）必須是呼叫者有效範圍的子集。否則 PUT 會回傳 `403`。刪除被另一個角色繼承的角色會回傳 `409`。組態定義的角色與內建角色透過此 API 為唯讀，在啟用執行期寫入時也會回傳 `409`。刪除未知的執行期角色會回傳 `404`。

```http
DELETE /api/v1/roles/finops
Authorization: Bearer REPLACE_WITH_ADMIN_CREDENTIAL
```

成功刪除會回傳 `204`，無內文。每個複本會在後續請求中，依其即時政策解析 JWT 角色聲明。被刪除的角色不再授予範圍。沒有任何剩餘已識別角色的 JWT 會以 `401` 遭到拒絕。

## 資料平面 {#data-planes}

資料平面是獨立的 LiteLLM 部署，負責提供推論請求服務。它管理自己的金鑰、團隊、預算與資料儲存。

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dataplanes` | `dataplanes:read` | `items` 包含呼叫者可見的已註冊資料平面。 |
| `GET` | `/api/v1/dataplanes/{id}` | `dataplanes:read` | 單一資料平面的 `id`、`name`、`url`、`credentials` 與 `source`。 |
| `GET` | `/api/v1/dataplanes/{id}/health` | `dataplanes:read` | `id`、`status`、`http_status` 與 `detail`。 |
| `GET` | `/api/v1/dataplanes/{id}/whoami` | `dataplanes:read` | `id`、所選的 `credential` 方法、`user_id`、`user_email` 與 `user_role`。 |
| `PUT` | `/api/v1/dataplanes/{id}` | `dataplanes:write` 與全機隊綁定 | 建立或取代執行期項目。回傳 `200` 並附上資料平面回應。 |
| `DELETE` | `/api/v1/dataplanes/{id}` | `dataplanes:write` 與全機隊綁定 | 刪除執行期項目。回傳 `204`，無內文。 |

清單使用與單一資料平面回應相同的欄位。`credentials` 列出 `oidc_exchange`、`service_token` 或兩者。它不包含祕密。啟動時設定的項目其 `source` 為 `config`，透過此 API 建立的項目則為 `runtime`。

健康端點會呼叫資料平面的 `/health/liveliness` 路由。它回傳 HTTP `200`，`status` 為 `"ok"`、`"degraded"` 或 `"unreachable"`。請檢視 `status` 以判斷健康狀態。`http_status` 是可用時的上游狀態。

身分端點會以為呼叫者選定的憑證呼叫 `/user/info`。若該路由回傳 `404`，身分欄位為 `null`。憑證失敗、無效回應與連線失敗會回傳 `502`。

### 執行期資料平面寫入 {#runtime-data-plane-writes}

使用 PUT 或 DELETE 前，請先啟用[執行期組態儲存](./configuration.md#runtime-configuration)。呼叫者同時需要 `dataplanes:write` 與全機隊綁定。受限於具名資料平面的 token 會收到 `403`，即使它命名的正是要變更的項目。

PUT 接受完整的登錄規格，而不是修補。其欄位為 `url`、選用的 `name`、`service_token`、`oidc_exchange` 與 `allow_insecure_http`。至少需要一種憑證方法。[登錄欄位參考](./configuration.md#registry-entries)列出憑證欄位與預設值。URL 不能包含 userinfo。純 HTTP 需要 `allow_insecure_http: true`。請勿在內文中送出 `id`、`source` 或 `credentials`。

```http
PUT /api/v1/dataplanes/eu-runtime
Authorization: Bearer REPLACE_WITH_ADMIN_CREDENTIAL
Content-Type: application/json

{
  "url": "https://litellm-eu.internal.example.com",
  "name": "EU production",
  "service_token": {"token": "REPLACE_WITH_SERVICE_TOKEN"}
}
```

建立與取代都回傳 `200`：

```json
{
  "id": "eu-runtime",
  "name": "EU production",
  "url": "https://litellm-eu.internal.example.com",
  "credentials": ["service_token"],
  "source": "runtime"
}
```

以下列方式刪除執行期項目：

```http
DELETE /api/v1/dataplanes/eu-runtime
Authorization: Bearer REPLACE_WITH_ADMIN_CREDENTIAL
```

成功刪除會回傳 `204`，無內文。刪除未知的執行期項目會回傳 `404`。組態定義的項目無法取代或刪除，在啟用執行期寫入時會回傳 `409`。這些呼叫只變更控制平面的登錄。它們不會佈建或刪除資料平面部署。

### 執行期寫入可用性 {#runtime-write-availability}

當儲存未設定或未遷移、發佈或持久化失敗，或嚴格稽核傳遞無法保留容量時，所有執行期 PUT 與 DELETE 路由都會回傳 `503`。經驗證的寫入嘗試都會被稽核，包括範圍與綁定拒絕。未知的範圍或繼承角色會回傳 `400`。無效的請求模型，例如缺少資料平面 URL 或角色規格中有多餘欄位，會回傳 `422`。

成功的 PUT 或 DELETE 確認了持久化，但即時讀取與權限檢查依循串流消費者，在任何複本（包括寫入者）上都可能短暫延遲。在依賴新狀態前，請先輪詢讀取 API。部署與復原請參閱[執行期組態](./configuration.md#runtime-configuration)。

## 機隊 {#fleet}

機隊是向控制平面註冊的資料平面集合。這些端點顯示整個機隊的模型、團隊與用量。

加入 `?dataplane=us-prod` 可選取單一資料平面。沒有此參數時，API 會查詢呼叫者可見的所有已註冊資料平面。

### 模型與團隊 {#models-and-teams}

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/fleet/models` | `fleet:read` | `items` 包含每個模型部署。`groups` 是物件陣列，每個物件有 `model_name` 與 `dataplanes` 陣列。 |
| `GET` | `/api/v1/fleet/teams` | `fleet:read` | `items` 包含呼叫者在每個資料平面上可檢視的團隊。 |

每個模型項目包含 `dataplane_id`、`model_name`、`litellm_model`、`provider`、`model_id` 與 `mode`。

每個團隊項目包含 `dataplane_id`、`team_id`、`team_alias`、`organization_id`、`spend`、`max_budget`、`members`、`models` 與 `blocked`。`members` 是計數。

兩個回應都包含 `partial` 與 `unreachable`。請參閱[部分結果](#partial-results)。

### 用量 {#usage}

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/usage/summary` | `usage:read` | `window`、合併的 `totals`，以及帶有 `id` 與 `metrics` 的 `by_dataplane` 項目。 |
| `GET` | `/api/v1/usage/daily` | `usage:read` | `window`、`group_by`，以及帶有 `date`、`group` 與 `metrics` 的 `rows`。 |
| `GET` | `/api/v1/usage/top` | `usage:read` | `window`、`group_by`、`limit`，以及帶有 `group` 與 `metrics` 的 `items`，依花費排名。 |

#### 查詢參數 {#query-parameters}

| 參數 | 端點 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `dataplane` | 全部 | 呼叫者可見的資料平面 | 選取一個已註冊的資料平面 ID。 |
| `start_date` | 全部 | `end_date` 前 29 天 | 第一天（含），格式為 `YYYY-MM-DD`。 |
| `end_date` | 全部 | UTC 的今天 | 最後一天（含），格式為 `YYYY-MM-DD`。 |
| `group_by` | `/daily`、`/top` | `/daily` 為 `dataplane`，`/top` 為 `model` | `dataplane`、`model`、`model_group`、`provider`、`endpoint`、`api_key` 或 `team` 之一。 |
| `limit` | `/top` | `10` | 要回傳的群組數，介於 `1` 至 `100`。 |

預設區間涵蓋 30 天，包含結束日期。最大區間預設為 366 天。[`CONTROL_PLANE_USAGE_MAX_WINDOW_DAYS`](./configuration.md#fleet) 可變更此限制，且當設定值低於 30 時會限制預設區間。若開始日期在結束日期之後，或區間超過限制，API 會回傳 `400`。

範例請求：

```http
GET /api/v1/usage/top?start_date=2026-11-01&end_date=2026-11-07&group_by=team&limit=10
Authorization: Bearer <token>
```

`metrics` 包含 `spend`、`api_requests`、`successful_requests`、`failed_requests`、`prompt_tokens`、`completion_tokens` 與 `total_tokens`。OpenAPI 列出完整的指標結構描述。

對於 `dataplane` 以外的維度，API 會合併所選資料平面之間相符的群組標籤。API 金鑰群組在可用時使用金鑰別名。

### 部分結果 {#partial-results}

機隊回應以這些欄位描述缺失的結果：

| 欄位 | 意義 |
| --- | --- |
| `partial` | 當至少一個資料平面失敗時為 `true`。當資料平面截斷其 API 金鑰明細時，用量也會設定它。 |
| `unreachable` | 失敗的資料平面，每個都帶有 `id` 與 `reason`。失敗可能包括憑證遭拒或無效的上游回應。 |
| `truncated_dataplanes` | 僅用量。API 金鑰明細超過其限制的資料平面 ID。 |

當部分資料平面成功時，API 會以 `200` 回傳可用結果。當所選的每個資料平面都失敗時，它回傳 `503`。若沒有可見的資料平面，它會在用量摘要中回傳空清單與零總計。

## 管理請求 {#management-requests}

透過以下路徑轉送支援的資料平面 API 請求：

```text
/api/v1/dataplanes/{id}/proxy/{path}
```

| 方法 | 所需範圍 |
| --- | --- |
| `GET`, `HEAD` | `proxy:read` |
| `POST`, `PUT`, `PATCH`, `DELETE` | `proxy:write` |

使用資料平面路由作為 `{path}`。例如，`/api/v1/dataplanes/us-prod/proxy/model/info` 會轉送至 `us-prod` 上的 `/model/info`。查詢參數會傳遞至資料平面。請求內文必須是 JSON 物件。

支援的路由家族包括金鑰、使用者、團隊、組織、終端使用者、預算、標籤、模型、憑證、防護欄、MCP 伺服器、向量儲存、花費、稽核記錄與管理設定。API 也允許 `/health/readiness`、`/health/liveliness`、`/health/liveness` 與 `/health/latest`。

控制平面會以 `403` 拒絕推論、登入、SSO、OAuth、新手引導、工作階段、服務帳號金鑰產生、防護欄執行、組態檔、偵錯與排空路由。拒絕檢查也適用於數字版本前綴之後，因此 `/v2/key/service-account/generate` 與 `/v2/guardrails/apply_guardrail` 仍會被封鎖。MCP 伺服器路由會拒絕任何不分大小寫、以 OAuth 為前綴的路徑段，包括 `oauth2` 與 `oauth-user-credential`。

回應使用資料平面的狀態與內文，並加入 `X-LiteLLM-Dataplane: <id>`。資料平面錯誤保留其上游回應格式。重新導向會回傳 `502`。

讀取在連線失敗或上游回傳 `502`、`503`、`504` 後可以重試。預設為[三次嘗試](./configuration.md#management-requests)。控制平面對每個寫入只送出一次。請求內文限制為 1 MB。資料平面回應限制為 64 MiB。

在[嚴格稽核傳遞](./configuration.md#audit-logs)下，控制平面可以在轉送寫入前以 `503` 拒絕它。

## 稽核記錄 {#audit-events}

兩個端點都回傳回應的控制平面處理程序的近期事件，最新在前。

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/audit` | `audit:read` | 原生稽核格式的 `items`。 |
| `GET` | `/api/v1/audit/ocsf` | `audit:read` | OCSF 1.5 格式的 `items`，以及 `chain_valid` 與 `sequence_gaps`。 |

| 查詢參數 | 預設值 | 說明 |
| --- | --- | --- |
| `limit` | `100` | 要回傳的事件上限，介於 `1` 至 `1000`。 |
| `dataplane` | 全部可見事件 | 依資料平面 ID 篩選。登入、控制平面驗證與執行期組態寫入事件請使用 `control-plane`。 |
| `actor` | 全部執行者 | 依控制平面主體篩選。 |

原生事件包含 `at`、`actor`、`actor_email`、`dataplane_id`、`method`、`path`、`decision`、`status`、`credential` 與 `detail`。`decision` 為 `allowed`、`denied` 或 `unreachable`。

受資料平面限制的呼叫者只能讀取這些資料平面的事件。讀取 `control-plane` 事件需要全機隊存取權限與 `audit:read`。

OCSF 端點會檢查回傳記錄的完整性。`sequence_gaps` 計算回傳記錄之間不連續的序號數量。間隙可能由篩選或本機保留所造成。事件涵蓋範圍、匯出與保留請參閱[稽核設定](./configuration.md#audit-logs)。

## 健康狀態與 API 結構描述 {#health-and-api-schema}

| 方法 | 路徑 | 所需範圍 | 回應 |
| --- | --- | --- | --- |
| `GET` | `/healthz` | 無。不需要 bearer token。 | 當控制平面處理程序回應時為 `{"status":"ok"}`。 |
| `GET` | `/readyz` | 無。不需要 bearer token。 | 當控制平面處理程序回應時為 `{"status":"ok"}`。 |
| `GET` | `/api/v1/docs` | 無。不需要 bearer token。 | 互動式 Swagger UI。 |
| `GET` | `/api/v1/openapi.json` | 無。不需要 bearer token。 | 執行中服務的 OpenAPI 結構描述。 |

健康路徑不使用 `CONTROL_PLANE_API_PREFIX`。它們不測試資料平面、稽核傳遞，或執行期儲存的可用性與遷移狀態。若要檢查資料平面，請使用 `/api/v1/dataplanes/{id}/health`。

## 錯誤 {#errors}

控制平面錯誤使用 `application/problem+json`，帶有 `type`、`title`、`status` 與 `detail`：

```json
{
  "type": "urn:litellm:error:forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing scope: usage:read."
}
```

| 狀態 | 意義 |
| --- | --- |
| `400` | 無效的查詢參數、用量區間、管理請求內文，或執行期定義（例如未知的角色範圍或父項）。 |
| `401` | 缺少或無效的 bearer token，或無效的登入憑證。 |
| `403` | 缺少範圍、資料平面存取遭拒、資料平面寫入的非全機隊綁定、角色權限提升，或被封鎖的管理路由。 |
| `404` | 資料平面、機隊或用量請求中未知的資料平面 ID，或 DELETE 時未知的執行期項目。 |
| `409` | 執行期寫入目標是組態定義的項目或預設角色，或刪除角色會使另一個角色失去繼承來源。 |
| `413` | 請求超過 1 MB 限制。 |
| `422` | 請求模型驗證失敗，包括登入與執行期寫入內文。 |
| `429` | 密碼登入遭到節流。`Retry-After` 以秒為單位給出等待時間。 |
| `502` | 轉送的請求或身分查詢因憑證、連線、回應大小或上游回應遭拒而失敗。 |
| `503` | 所選的每個資料平面都使機隊或用量查詢失敗、嚴格稽核傳遞封鎖寫入，或執行期儲存不可用、未設定、未遷移，或發佈或持久化失敗。 |
