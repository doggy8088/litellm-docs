import Image from '@theme/IdealImage';

# 以角色為基礎的存取控制（RBAC） {#role-based-access-controls-rbac}

以角色為基礎的存取控制（RBAC）是建立在 Organizations、Teams 和 Internal User Roles 之上

### 影片導覽 {#video-walkthrough}

<iframe width="100%" height="415" src="https://www.loom.com/embed/a980e25027ad4ecc9e8db1af2777b2a2" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

<Image img={require('../../img/litellm_user_heirarchy.png')} style={{ width: '100%', maxWidth: '4000px' }} />

- `Organizations` 是包含 Teams 的最上層實體。
- `Team` - Team 是多個 `Internal Users` 的集合
- `Internal Users` - 可建立金鑰、進行 LLM API 請求、在 LiteLLM 上檢視用量的使用者。使用者可以同時屬於多個 Team。
- `Virtual Keys` - 金鑰用於對 LiteLLM API 進行驗證。每個金鑰可選擇性地關聯至 `user_id`、`team_id`，或兩者皆是：
  - **僅使用者金鑰**：具有 `user_id`，但沒有 `team_id`。會個別追蹤，且在使用者刪除時一併刪除。
  - **Team 金鑰（服務帳號）**：具有 `team_id`，但沒有 `user_id`。由 Team 共用，當使用者被移除時不會刪除。[深入了解服務帳號金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys#service-account-keys)。
  - **使用者 + Team 金鑰**：同時具有 `user_id` 和 `team_id`。屬於 Team 情境中的特定使用者。

### 何時使用每種金鑰類型 {#when-to-use-each-key-type}

| 金鑰類型 | 使用情境 | 支出追蹤 | 生命週期 |
|----------|----------|----------------|-----------|
| **僅使用者** | 個別開發者的個人 API 金鑰 | 追蹤到使用者 | 使用者刪除時刪除 |
| **Team（服務帳號）** | 生產環境應用程式、CI/CD 管線、共用服務 | 僅追蹤到 Team | 即使 Team 成員離開仍會保留 |
| **使用者 + Team** | 在 Team 情境中工作的使用者 | 同時追蹤到使用者與 Team | 使用者刪除時刪除 |

**範例情境：**
- 為在本機測試的開發者使用 **僅使用者金鑰**
- 為不應因員工離職而中斷的生產應用程式使用 **Team 服務帳號金鑰**
- 當您希望在 Team 預算內保有個人責任歸屬時，使用 **使用者 + Team 金鑰**

---

## 使用者角色 {#user-roles}

LiteLLM 有兩種類型的角色：

1. **全域 Proxy 角色** - 套用於所有 Organizations 和 Teams 的平台層級角色
2. **Organization/Team 特定角色** - 範圍限定於特定 Organizations 或 Teams 的角色（**進階功能**）

### 全域 Proxy 角色 {#global-proxy-roles}

| 角色名稱 | 權限 |
|-----------|-------------|
| `proxy_admin` | 整個平台的管理員。對所有 Organizations、Teams 和使用者擁有完整控制權 |
| `proxy_admin_viewer` | 可以登入、檢視所有金鑰、檢視整個平台的所有支出。**無法**建立金鑰／刪除金鑰／新增使用者 |
| `internal_user` | 可以登入、檢視／建立（當 team-specific 權限允許時）／刪除自己的金鑰，檢視自己的支出。**無法**新增使用者 |
| `internal_user_viewer` | ⚠️ **已淘汰** - 請改用 team/org specific 角色。可以登入、檢視自己的金鑰、檢視自己的支出。**無法**建立／刪除金鑰、 新增使用者 |

### Organization/Team 特定角色 {#organizationteam-specific-roles}

| 角色名稱 | 權限 |
|-----------|-------------|
| `org_admin` | 特定 Organization 的管理員。可在其 Organization 內建立 Teams 和使用者 ✨ **進階功能** |
| `team_admin` | 特定 Team 的管理員。可管理 Team 成員、更新 Team 成員權限，並為其 Team 建立金鑰。✨ **進階功能** |

## 每個角色可以做什麼？ {#what-can-each-role-do}

以下說明每個角色實際可執行的操作。可以把它想成不同的存取層級。

---

## 全域 Proxy 角色 {#global-proxy-roles-1}

這些角色適用於整個 LiteLLM 平台，不受 Organization 或 Team 邊界限制。

### Proxy Admin - 完整存取權 {#proxy-admin---full-access}

Proxy admin 可控制一切。他們就像整個平台的擁有者。

**他們可以做什麼：**
- 建立與管理所有 Organizations
- 建立與管理所有 Teams（跨所有 Organizations）
- 建立與管理所有使用者
- 檢視整個平台的所有支出與用量
- 為任何人建立與刪除金鑰
- 更新 Team 預算、速率限制與模型
- 管理 Team 成員並指派角色

**誰應該擔任 proxy admin：** 只有負責營運 LiteLLM instance 的人員。

---

### Proxy Admin Viewer - 平台層級唯讀存取 {#proxy-admin-viewer---platform-wide-read-access}

Proxy admin viewer 可以看到平台上的所有內容，但不能進行變更。

**他們可以做什麼：**
- 檢視所有 Organizations、Teams 和使用者
- 檢視整個平台的所有支出與用量
- 檢視所有 API 金鑰
- 登入管理儀表板

**他們不能做什麼：**
- 建立或刪除金鑰
- 新增或移除使用者
- 修改預算、速率限制或設定
- 對平台進行任何變更

**誰應該擔任 proxy admin viewer：** 需要平台層級可視性但沒有修改權限的財務團隊、稽核人員或利害關係人。

---

### 內部使用者 {#internal-user}

Internal user 可以建立 API 金鑰（當 team-specific 權限允許時）並進行請求。他們只會看到自己的內容。如果被指派相應角色，也可以成為 team admin 或 org admin。

**他們可以做什麼：**
- 為自己建立 API 金鑰
- 刪除自己的 API 金鑰
- 檢視自己的支出與用量
- 使用自己的金鑰進行 API 請求

**誰應該是 internal user：** 任何需要 UI 存取以執行 team/org 特定操作的人員 **或** 您打算提供多把金鑰的開發者。

---

### Internal User Viewer - 唯讀存取 {#internal-user-viewer---read-only-access}

:::warning 已淘汰
此角色已淘汰，建議改用 team/org specific 角色。請使用 `org_admin` 或 `team_admin` 角色，以便更精細地控制組織與 Team 內的使用者權限。
:::

Internal user viewer 可以檢視自己的資訊，但不能建立或刪除金鑰。

**他們可以做什麼：**
- 檢視自己的 API 金鑰
- 檢視自己的支出與用量
- 登入以查看自己的儀表板

**他們不能做什麼：**
- 建立或刪除 API 金鑰
- 對任何設定進行變更
- 建立 Teams 或新增使用者
- 檢視其他人的資訊

**誰應該是 internal user viewer（已淘汰）：** 建議改用 team/org specific 角色，以獲得更好的存取控制。

---

## Organization/Team 特定角色 {#organizationteam-specific-roles-1}

:::info 
Organization/Team specific 角色是進階功能。您需要是 LiteLLM Enterprise 使用者才能使用它們。[在此取得 7 天試用](https://www.litellm.ai/#trial)。
:::

這些角色的範圍限定於特定 Organizations 或 Teams。具有這些角色的使用者只能管理其所指派的 Organization 或 Team 內的資源。

### Org Admin - Organization 層級存取 {#org-admin---organization-level-access}

Org admin 管理一個或多個 Organizations。他們可以在自己的 Organization 內建立 Teams，但不能碰觸其他 Organizations。

**他們可以做什麼：**
- 在自己的 Organization 內建立 Teams
- 將使用者新增到其 Organization 中的 Teams
- 檢視其 Organization 的支出
- 為其 Organization 中的使用者建立金鑰

**他們不能做什麼：**
- 建立或管理其他 Organizations
- 修改 org 預算／速率限制
- 修改 org 允許的模型（例如，將 proxy-level 模型新增到 org）

**誰應該是 org admin：** 需要管理多個 Teams 的部門主管或經理。

---

### Team Admin - Team 層級存取 {#team-admin---team-level-access}

✨ **這是進階功能**

Team admin 管理特定的 Team。他們就像 Team lead，可以新增人員、更新設定，但僅限於自己的 Team。

**他們可以做什麼：**
- 從自己的 Team 新增或移除 Team 成員
- 更新 Team 成員在該 Team 內的預算與速率限制
- 變更 Team 速率限制（TPM/RPM）與允許的模型
- 保留或降低 Team 的 `max_budget`
- 為 Team 成員建立與刪除金鑰
- 將 [team-BYOK](./team_model_add) 模型導入 LiteLLM（例如導入某個 Team 的微調模型）
- 設定 [team member permissions](#team-member-permissions) 以控制一般 Team 成員可執行的操作

**他們不能做什麼：**
- 建立新 Teams
- 將 Team 的 `max_budget` 提高到目前值以上，或移除預算上限（`max_budget: null`）— 只有 proxy admin 可以做到這一點
- 將全域 proxy 模型新增／移除到其 Team

:::info 團隊預算提高
在 `/team/update` 上，團隊管理員可以維持或降低 `max_budget`。提高它（或清除上限）僅保留給 proxy 管理員，因此團隊管理員無法自行增加支出權限。組織範圍內的團隊也必須維持在組織預算之內。
:::

**誰應該擔任團隊管理員：** 需要管理其團隊 API 存取權、但不想麻煩 IT 的團隊負責人。

:::info 如何建立團隊管理員

您必須是 LiteLLM Enterprise 使用者才能指派團隊管理員。[在此取得 7 天試用](https://www.litellm.ai/#trial)。

```shell
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{"team_id": "team-123", "member": {"role": "admin", "user_id": "user@company.com"}}'
```

:::

---

## 團隊成員權限 {#team-member-permissions}

✨ **這是一項進階功能**

團隊成員權限可讓您控制一般團隊成員（role=`user`）能對其團隊中的 API 金鑰執行哪些操作。預設情況下，團隊成員只能檢視金鑰資訊，但您可以授予他們額外權限，以建立、更新或刪除金鑰。

### 運作方式 {#how-it-works}

- **適用對象**：role=`user` 的團隊成員（非團隊管理員或組織管理員）
- **範圍**：權限僅適用於屬於其團隊的金鑰
- **設定**：在團隊層級使用 `team_member_permissions` 設定
- **覆寫**：無論這些設定為何，團隊管理員與組織管理員一律擁有完整權限

### 可用權限 {#available-permissions}

| 權限 | 方法 | 說明 |
|-----------|--------|-------------|
| `/key/info` | GET | 檢視團隊中虛擬金鑰的資訊 |
| `/key/health` | GET | 檢查團隊中虛擬金鑰的健康狀態 |
| `/key/list` | GET | 列出屬於該團隊的所有虛擬金鑰 |
| `/key/generate` | POST | 為團隊建立新的虛擬金鑰 |
| `/key/service-account/generate` | POST | 為團隊建立服務帳戶金鑰（不綁定特定使用者） |
| `/key/update` | POST | 修改團隊中現有的虛擬金鑰 |
| `/key/delete` | POST | 刪除屬於該團隊的虛擬金鑰 |
| `/key/regenerate` | POST | 重新產生團隊中的虛擬金鑰 |
| `/key/block` | POST | 封鎖團隊中的虛擬金鑰 |
| `/key/unblock` | POST | 解除團隊中的虛擬金鑰封鎖 |

### 預設權限 {#default-permissions}

預設情況下，團隊成員只能：
- `/key/info` - 檢視金鑰資訊
- `/key/health` - 檢查金鑰健康狀態

### 常見權限情境 {#common-permission-scenarios}

**唯讀存取**（預設）：
```json
["/key/info", "/key/health"]
```

**允許建立金鑰但不允許刪除**：
```json
["/key/info", "/key/health", "/key/generate", "/key/update"]
```

**完整金鑰管理**：
```json
["/key/info", "/key/health", "/key/generate", "/key/update", "/key/delete", "/key/regenerate", "/key/block", "/key/unblock", "/key/list"]
```

### 如何設定團隊成員權限 {#how-to-configure-team-member-permissions}

#### 檢視目前權限 {#view-current-permissions}

```shell
curl --location 'http://0.0.0.0:4000/team/permissions_list?team_id=team-123' \
    --header 'Authorization: Bearer sk-1234'
```

預期回應：
```json
{
  "team_id": "team-123",
  "team_member_permissions": ["/key/info", "/key/health"],
  "all_available_permissions": ["/key/generate", "/key/update", "/key/delete", ...]
}
```

#### 更新團隊成員權限 {#update-team-member-permissions}

```shell
curl --location 'http://0.0.0.0:4000/team/update' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "team_id": "team-123",
        "team_member_permissions": ["/key/info", "/key/health", "/key/generate", "/key/update"]
    }'
```

這可讓團隊成員：
- 檢視金鑰資訊
- 建立新的金鑰
- 更新現有金鑰
- 但**不能**刪除金鑰

### 誰可以設定這些權限？ {#who-can-configure-these-permissions}

- **Proxy 管理員**：可以設定任何團隊的權限
- **組織管理員**：可以設定其組織內團隊的權限
- **團隊管理員**：可以設定自己團隊的權限

---

## 快速比較 {#quick-comparison}

以下是快速版：

### 全域 Proxy 角色 {#global-proxy-roles-2}

| 動作 | Proxy 管理員 | Proxy 管理員檢視者 | 內部使用者 | 內部使用者檢視者 ⚠️（已棄用） |
|--------|-------------|-------------------|---------------|-------------------------------------|
| 建立組織 | ✅ | ❌ | ❌ | ❌ |
| 建立團隊 | ✅ | ❌ | ❌ | ❌ |
| 管理所有團隊 | ✅ | ❌ | ❌ | ❌ |
| 建立/刪除任何金鑰 | ✅ | ❌ | ❌ | ❌ |
| 建立/刪除自己的金鑰 | ✅ | ❌ | ✅ | ❌ |
| 檢視所有平台支出 | ✅ | ✅ | ❌ | ❌ |
| 檢視自己的支出 | ✅ | ✅ | ✅ | ✅ |
| 檢視所有金鑰 | ✅ | ✅ | ❌ | ❌ |
| 檢視自己的金鑰 | ✅ | ✅ | ✅ | ✅ |
| 新增/移除使用者 | ✅ | ❌ | ❌ | ❌ |

> **附註：** `internal_user_viewer` 角色已棄用。請使用團隊/組織特定角色，以獲得更細緻的存取控制。

### 組織/團隊特定角色 {#organizationteam-specific-roles-2}

| 動作 | 組織管理員 | 團隊管理員 |
|--------|-----------|------------|
| 建立團隊（在其組織內） | ✅ | ❌ |
| 管理其組織內的團隊 | ✅ | ❌ |
| 管理其特定團隊 | ✅ | ✅ |
| 新增/移除團隊成員 | ✅（在其組織內） | ✅（僅其團隊） |
| 維持 / 降低團隊 `max_budget` | ✅（在其組織內） | ✅（僅其團隊） |
| 提高團隊 `max_budget` | ✅ 在組織限制內（組織範圍）；獨立部署則由 proxy 管理員處理 | ❌（僅限 proxy 管理員） |
| 更新團隊速率限制 | ✅（在其組織內） | ✅（僅其團隊） |
| 為團隊成員建立金鑰 | ✅（在其組織內） | ✅（僅其團隊） |
| 檢視組織支出 | ✅（其組織） | ❌ |
| 檢視團隊支出 | ✅（在其組織內） | ✅（其團隊） |
| 建立組織 | ❌ | ❌ |
| 檢視所有平台支出 | ❌ | ❌ |

## 組織導入  {#onboarding-organizations}

✨ **這是一項進階功能**

### 1. 建立新組織 {#1-creating-a-new-organization}

任何 role=`proxy_admin` 的使用者都可以建立新組織

**用法**

[**/organization/new 的 API 參考**](https://litellm-api.up.railway.app/#/organization%20management/new_organization_organization_new_post)

```shell
curl --location 'http://0.0.0.0:4000/organization/new' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "organization_alias": "marketing_department",
        "models": ["gpt-4"],
        "max_budget": 20
    }'
```

預期回應 

```json
{
  "organization_id": "ad15e8ca-12ae-46f4-8659-d02debef1b23",
  "organization_alias": "marketing_department",
  "budget_id": "98754244-3a9c-4b31-b2e9-c63edc8fd7eb",
  "metadata": {},
  "models": [
    "gpt-4"
  ],
  "created_by": "109010464461339474872",
  "updated_by": "109010464461339474872",
  "created_at": "2024-10-08T18:30:24.637000Z",
  "updated_at": "2024-10-08T18:30:24.637000Z"
}
```


### 2. 將 `org_admin` 新增至組織 {#2-adding-an-org_admin-to-an-organization}

將使用者（ishaan@berri.ai）建立為 `org_admin`，加入 `marketing_department` Organization（從[步驟 1](#1-creating-a-new-organization)）

以下角色的使用者可以呼叫 `/organization/member_add`
- `proxy_admin`
- 僅限其所屬組織內的 `org_admin`

```shell
curl -X POST 'http://0.0.0.0:4000/organization/member_add' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{"organization_id": "ad15e8ca-12ae-46f4-8659-d02debef1b23", "member": {"role": "org_admin", "user_id": "ishaan@berri.ai"}}'
```

現在 user_id = `ishaan@berri.ai` 且 role = `org_admin` 的使用者已在 `marketing_department` Organization 中建立

為 user_id = `ishaan@berri.ai` 建立一個 Virtual Key。之後，該使用者即可使用該 Virtual key 執行其組織管理員操作

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
        --header 'Authorization: Bearer sk-1234' \
        --header 'Content-Type: application/json' \
        --data '{
            "user_id": "ishaan@berri.ai"
    }'
```

預期回應 

```json
{
  "models": [],
  "user_id": "ishaan@berri.ai",
  "key": "sk-7shH8TGMAofR4zQpAAo6kQ",
  "key_name": "sk-...o6kQ",
}
```

### 3. `Organization Admin` - 建立團隊 {#3-organization-admin---create-a-team}

組織管理員將使用在[步驟 2](#2-adding-an-org_admin-to-an-organization)中建立的虛擬金鑰，在 `marketing_department` Organization 內建立 `Team`

```shell
curl --location 'http://0.0.0.0:4000/team/new' \
    --header 'Authorization: Bearer sk-7shH8TGMAofR4zQpAAo6kQ' \
    --header 'Content-Type: application/json' \
    --data '{
        "team_alias": "engineering_team",
        "organization_id": "ad15e8ca-12ae-46f4-8659-d02debef1b23"
    }'
```

這將在 `marketing_department` Organization 內建立團隊 `engineering_team`

預期回應 

```json
{
  "team_alias": "engineering_team",
  "team_id": "01044ee8-441b-45f4-be7d-c70e002722d8",
  "organization_id": "ad15e8ca-12ae-46f4-8659-d02debef1b23",
}
```


### 4. `Organization Admin` - 新增團隊管理員 {#4-organization-admin---add-a-team-admin}

✨ **這是一項進階功能**

組織管理員現在可以新增一位團隊管理員，負責管理 `engineering_team`。 

- 我們會指派 role=`admin`，讓其成為此特定團隊的團隊管理員
- `team_id` 來自[步驟 3](#3-organization-admin---create-a-team)

```shell
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
    -H 'Authorization: Bearer sk-7shH8TGMAofR4zQpAAo6kQ' \
    -H 'Content-Type: application/json' \
    -d '{"team_id": "01044ee8-441b-45f4-be7d-c70e002722d8", "member": {"role": "admin", "user_id": "john@company.com"}}'
```

現在 `john@company.com` 是團隊管理員。他們可以管理 `engineering_team` — 新增成員、更新速率限制、維持或降低團隊預算、建立金鑰 — 但無法處理其他團隊，也無法將團隊預算提高到目前上限以上。

為團隊管理員建立一個 Virtual Key：

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
    --header 'Authorization: Bearer sk-7shH8TGMAofR4zQpAAo6kQ' \
    --header 'Content-Type: application/json' \
    --data '{"user_id": "john@company.com"}'
```

預期回應：

```json
{
  "models": [],
  "user_id": "john@company.com",
  "key": "sk-TeamAdminKey123",
  "key_name": "sk-...Key123"
}
```

### 5. `Team Admin` - 新增團隊成員 {#5-team-admin---add-team-members}

現在團隊管理員可以使用自己的金鑰新增團隊成員，而無需詢問組織管理員。

```shell
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
    -H 'Authorization: Bearer sk-TeamAdminKey123' \
    -H 'Content-Type: application/json' \
    -d '{"team_id": "01044ee8-441b-45f4-be7d-c70e002722d8", "member": {"role": "user", "user_id": "krrish@berri.ai"}}'
```

團隊管理員也可以為其團隊成員建立金鑰：

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
    --header 'Authorization: Bearer sk-TeamAdminKey123' \
    --header 'Content-Type: application/json' \
    --data '{
        "user_id": "krrish@berri.ai",
        "team_id": "01044ee8-441b-45f4-be7d-c70e002722d8"
    }'
```

### 6. `Team Admin` - 更新團隊設定 {#6-team-admin---update-team-settings}

團隊管理員可以更新速率限制，並維持或降低團隊預算。將 `max_budget` 提高到團隊目前值以上需要 proxy 管理員。

```shell
curl --location 'http://0.0.0.0:4000/team/update' \
    --header 'Authorization: Bearer sk-TeamAdminKey123' \
    --header 'Content-Type: application/json' \
    --data '{
        "team_id": "01044ee8-441b-45f4-be7d-c70e002722d8",
        "max_budget": 100,
        "rpm_limit": 1000
    }'
```

在此範例中，僅當團隊目前預算已是 `100` 或更高（維持 / 降低）時，`max_budget: 100` 才會成功。若要提高團隊預算，請使用 proxy 管理員金鑰。
