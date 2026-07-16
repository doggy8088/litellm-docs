import Image from '@theme/IdealImage';

# 使用 LiteLLM 的多租戶架構 {#multi-tenant-architecture-with-litellm}

## 概覽 {#overview}

LiteLLM 提供一套可在多個租戶之間擴充的集中式解決方案，讓組織能夠：

- **集中管理** 多個租戶（組織、團隊、部門）的 LLM 存取
- **隔離支出與用量** 於不同組織單位之間
- **委派管理權限** 而不影響安全性
- **追蹤成本** 至細緻層級（組織 → 團隊 → 使用者 → 金鑰）
- **無縫擴充**，隨著新團隊與使用者加入而成長

:::info 開源 vs. 企業版
- **Teams + Virtual Keys**：✅ 開源版可用
- **Organizations + Org Admins**：✨ 企業版功能（[取得 7 天試用](https://www.litellm.ai/#trial))

您可以僅在開源版本中使用 **Teams** 來實作多租戶，也可以在企業版本中再加上 **Organizations** 以提供額外的階層結構。
:::

## 多租戶挑戰 {#the-multi-tenant-challenge}

採用多租戶架構的組織在部署 LLM 解決方案時會面臨幾項挑戰：

1. **集中式 vs. 分散式**：需要單一統一閘道，同時維持租戶隔離
2. **成本歸屬**：追蹤不同事業單位、部門或客戶的支出
3. **存取控制**：不同團隊需要不同的模型、預算與速率限制
4. **委派**：團隊主管應可管理其團隊，而不必擁有整個平台的管理員權限
5. **可擴充性**：解決方案必須能從 10 位擴充到 10,000+ 位使用者，而無需架構變更

## LiteLLM 如何解決多租戶 {#how-litellm-solves-multi-tenancy}

<Image img={require('../../img/litellm_user_heirarchy.png')} style={{ width: '100%', maxWidth: '4000px' }} />

LiteLLM 實作了一個具有四個層級的階層式多租戶架構：

### 1. Organizations（頂層租戶）✨ 企業版功能 {#1-organizations-top-level-tenants--enterprise-feature}

**Organizations** 代表最高層級的租戶隔離——通常是不同的事業單位、部門或客戶。

- 每個 organization 都有自己的：
  - 預算上限
  - 允許的模型
  - 管理員使用者（org admins）
  - Teams
  - 支出追蹤

**使用範例：**
- **企業部門**：為工程、行銷、業務建立不同的 organizations
- **多客戶 SaaS**：每個客戶都是一個具備完整隔離的 organization
- **地理區域**：將 EMEA、APAC、Americas 作為不同的 organizations

**主要功能：**
- 各 organization 彼此看不到對方的資料
- 每個 organization 可有多個 teams
- Organization admins 僅能管理其所屬 organization 內的 teams
- 在 organization 層級追蹤支出與用量

[Organizations 的 API 參考](https://litellm-api.up.railway.app/#/organization%20management)

---

### 2. Teams（中層分組）✅ 開源版 {#2-teams-mid-level-grouping--open-source}

**Teams** 可以獨立運作，也可以位於 organizations 之中，代表一起工作的使用者之邏輯分組。

:::tip
Teams 可在**開源版**中使用，並可作為您的主要多租戶邊界，而不需要 Organizations。Organizations 則為企業部署提供額外一層階層。
:::

- 每個 team 都有：
  - Team 專屬預算與速率限制
  - 管理成員的 team admins
  - 用於共享資源的 service account keys
  - 模型存取控制
  - 細緻的 team 成員權限

**使用範例：**
- **專案團隊**：ML Research team、Product team、Data Science team
- **客戶子群組**：客戶組織內的不同事業部
- **環境區隔**：Development、Staging、Production teams

**主要功能：**
- Teams 會繼承 organization 限制（不能超過 org 預算/模型）
- Team admins 可管理自己的 team，而不影響其他 team
- Service account keys 不受 team 成員變動影響
- 按 team 進行支出追蹤與計費

[Teams 的 API 參考](https://litellm-api.up.railway.app/#/team%20management)

---

### 3. Users（個別成員）✅ 開源版 {#3-users-individual-members--open-source}

**Users** 是所屬於 teams 並建立／使用 API keys 的個人。

- 每個 user 都可以：
  - 屬於多個 teams
  - 擁有自己的預算上限
  - 建立個人 API keys
  - 追蹤個人支出

**使用者類型：**
- **內部使用者**：員工、開發者、資料科學家
- **Team Admins**：帶領其 teams 並管理成員
- **Org Admins**：管理其 organization 內的多個 teams
- **Proxy Admins**：整個平台的管理員

**主要功能：**
- 個別追蹤 user 支出
- 使用者可同時屬於多個 teams
- 以角色為基礎的權限控制使用者可執行的操作
- 當 user 被移除時，其 keys 也會被刪除

[Users 的 API 參考](https://litellm-api.up.railway.app/#/user%20management)

---

### 4. Virtual Keys（驗證層）✅ 開源版 {#4-virtual-keys-authentication-layer--open-source}

**Virtual Keys** 是用來驗證請求與追蹤支出的 API keys。

每個 key 可屬於三種類型之一：

| 金鑰類型 | 設定 | 使用情境 | 支出追蹤 | 生命週期 |
|----------|---------------|----------|----------------|-----------|
| **僅 User** | 只有 `user_id` | 開發者個人 keys | User 層級 | 隨 user 刪除 |
| **Team Service Account** | 只有 `team_id` | 生產應用程式、CI/CD | Team 層級 | 不受成員變動影響 |
| **User + Team** | 同時 `user_id` 與 `team_id` | 團隊情境中的 user | User 與 Team | 隨 user 刪除 |

**範例情境：**
- 開發者本機測試時使用 **僅 user 的 keys**
- 對於不應在員工離職時中斷的生產應用程式，使用 **team service account keys**
- 當您希望在 team 預算內保有個人責任歸屬時，使用 **user + team keys**

[Keys 的 API 參考](https://litellm-api.up.railway.app/#/key%20management)

---

## 以角色為基礎的存取控制（RBAC） {#role-based-access-control-rbac}

LiteLLM 在整個階層中提供細緻的 RBAC：

### 全域 Proxy 角色（整個平台） {#global-proxy-roles-platform-wide}

| Role | Scope | Permissions |
|------|-------|-------------|
| **Proxy Admin** | 整個平台 | 建立 orgs、teams、users。檢視所有支出。完整控制。 |
| **Proxy Admin Viewer** | 整個平台 | 對所有資料僅可檢視。無法進行變更。 |
| **Internal User** | 自己的資源 | 建立/刪除自己的 keys。檢視自己的支出。 |

### Organization/Team 角色（具範圍） {#organizationteam-roles-scoped}

| Role | Scope | Permissions |
|------|-------|-------------|
| **Org Admin** ✨ | 特定 organization | 僅在其 organization 內建立 teams、新增 users、檢視 org 支出。 |
| **Team Admin** ✨ | 特定 team | 僅在其 team 內管理 team 成員、速率限制與 keys。可維持或降低 team `max_budget`；提高則需要 proxy admin。 |

✨ = 進階功能

### Team 成員權限 {#team-member-permissions}

Team admins 可以為一般 team 成員設定細緻權限：

**唯讀**（預設）：
```json
["/key/info", "/key/health"]
```

**允許建立 key**：
```json
["/key/info", "/key/health", "/key/generate", "/key/update"]
```

**完整 key 管理**：
```json
["/key/info", "/key/health", "/key/generate", "/key/update", "/key/delete", "/key/regenerate", "/key/block", "/key/unblock"]
```

[進一步了解 RBAC](./access_control)

---

## 支出追蹤與成本歸屬 {#spend-tracking--cost-attribution}

LiteLLM 提供多層級支出追蹤，並沿著階層流動：

### 階層式支出流向 {#hierarchical-spend-flow}

```
Organization Spend
    ├── Team 1 Spend
    │   ├── User A Spend
    │   │   ├── Key 1 Spend
    │   │   └── Key 2 Spend
    │   └── Service Account Spend
    │       └── Key 3 Spend
    └── Team 2 Spend
        └── User B Spend
            └── Key 4 Spend
```

### 預算執行 {#budget-enforcement}

可在每一層設定預算並沿用繼承：

1. **Organization 預算**：`$10,000/month`
   - Team 1：`$6,000/month`（在 org 限額內）
     - User A：`$3,000/month`（在 team 限額內）
     - User B：`$3,000/month`（在 team 限額內）
   - Team 2：`$4,000/month`（在 org 限額內）

**執行規則：**
- Team 預算不得超過 organization 預算
- User 預算不得超過 team 預算
- 當任一層級超出預算時，請求會被封鎖
- 即時追蹤可防止超支

[進一步了解預算](./team_budgets)

---

## 常見多租戶模式 {#common-multi-tenant-patterns}

### 模式 1：企業部門 {#pattern-1-enterprise-departments}

**情境**：大型企業具有多個部門，需要集中式 LLM 存取

**企業設定**（使用 Organizations）：
```
Platform (LiteLLM Instance)
├── Engineering Organization ✨
│   ├── Backend Team
│   ├── Frontend Team
│   └── ML Team
├── Marketing Organization ✨
│   ├── Content Team
│   └── Analytics Team
└── Sales Organization ✨
    ├── Sales Ops Team
    └── Customer Success Team
```

**開源替代方案**（僅 Teams）：
```
Platform (LiteLLM Instance)
├── Engineering Backend Team
├── Engineering Frontend Team
├── Engineering ML Team
├── Marketing Content Team
├── Marketing Analytics Team
├── Sales Ops Team
└── Customer Success Team
```

**優點：**
- 每個部門/team 管理自己的預算
- 部門主管（org/team admins）控制其 teams
- 集中式計費與模型存取
- 財務可跨部門檢視成本

---

### 模式 2：多客戶 SaaS {#pattern-2-multi-customer-saas}

**情境**：SaaS 提供者為多個客戶提供由 LLM 驅動的功能

**企業設定**（含 Organizations）：
```
Platform (LiteLLM Instance)
├── Customer A Organization ✨
│   ├── Production Team (Service Accounts)
│   ├── Development Team
│   └── QA Team
├── Customer B Organization ✨
│   ├── Production Team (Service Accounts)
│   └── Development Team
└── Customer C Organization ✨
    └── Production Team (Service Accounts)
```

**開源替代方案**（僅 Teams）：
```
Platform (LiteLLM Instance)
├── Customer A Production Team (Service Accounts)
├── Customer A Development Team
├── Customer A QA Team
├── Customer B Production Team (Service Accounts)
├── Customer B Development Team
└── Customer C Production Team (Service Accounts)
```

**優點：**
- 客戶／團隊之間完全隔離
- 依客戶／團隊進行計費與用量追蹤
- 客戶／團隊管理員可自行服務
- 生產環境的服務帳號金鑰在員工異動後仍可保留

---

### 模式 3：環境分離 {#pattern-3-environment-separation}

**情境**：單一組織內有多個環境

```
Platform (LiteLLM Instance)
└── Company Organization
    ├── Production Team
    │   └── Service Account Keys (strict rate limits)
    ├── Staging Team
    │   └── Service Account Keys (moderate limits)
    └── Development Team
        └── User Keys (generous limits for testing)
```

**優點：**
- 每個環境各自獨立預算
- 不同的模型存取權限（生產 vs. 開發）
- 防止開發用量影響生產預算
- 可依環境輕鬆歸屬成本

---

## 委派與自助服務 {#delegation--self-service}

LiteLLM 的一大關鍵優勢是委派式管理：

### 沒有 LiteLLM {#without-litellm}
```
Every team → Requests platform admin → Admin makes changes
```
❌ 平台團隊形成瓶頸  
❌ 導入速度慢  
❌ 擴充性差  

### 有 LiteLLM {#with-litellm}
```
Proxy Admin → Creates org + org admin
Org Admin → Creates teams + team admins  
Team Admin → Manages their team independently
```
✅ 分散式管理  
✅ 導入快速  
✅ 可擴充至數千名使用者  

### 自助服務功能 {#self-service-capabilities}

**團隊管理員可以：**
- 新增／移除團隊成員
- 為團隊成員建立 API 金鑰
- 更新團隊速率限制；維持或降低團隊 `max_budget`（提高 `max_budget` 需要 proxy 管理員；組織範圍的團隊也仍受組織限制）
- 設定團隊成員權限
- 檢視團隊用量與支出

**組織管理員可以：**
- 在其組織內建立新團隊
- 指派團隊管理員
- 檢視整個組織的支出
- 管理其團隊中的使用者

**平台管理員可以：**
- 建立組織
- 指派組織管理員
- 設定組織層級政策
- 檢視平台整體分析

---

## 可擴充性 {#scalability}

LiteLLM 的架構可從小型團隊擴展到企業部署：

### 小型團隊（10-100 名使用者） {#small-team-10-100-users}
- 單一組織
- 少數團隊（5-10 個）
- 由 proxy 管理員管理一切

### 中型規模（100-1,000 名使用者） {#mid-size-100-1000-users}
- 多個組織
- 許多團隊（50+）
- 組織管理員委派給團隊管理員

### 企業規模（1,000+ 名使用者） {#enterprise-1000-users}
- 許多組織（部門／區域）
- 數百個團隊
- 完全委派的管理架構
- 集中式可觀測性與計費

**關鍵可擴充功能：**
- 成長時無需架構變更
- 以資料庫為後盾（PostgreSQL），確保可靠性
- 支援水平擴充
- 高效率的支出追蹤與記錄

---

## 安全性與隔離 {#security--isolation}

### 租戶隔離 {#tenant-isolation}

每個租戶（組織）彼此隔離：
- ✅ 無法檢視其他組織的資料
- ✅ 無法存取其他組織的金鑰
- ✅ 無法超出其預算上限
- ✅ 無法存取不在其允許清單中的模型

### 驗證安全性 {#authentication-security}

- 供平台管理員使用的主金鑰
- 具範圍權限的虛擬金鑰
- 支援 SSO 整合
- JWT 驗證
- IP allowlisting

### 稽核與合規性 {#audit--compliance}

- 所有 API 呼叫都會記錄使用者／團隊／組織脈絡
- 供 chargeback/showback 使用的支出追蹤
- 管理動作會被稽核
- 與可觀測性工具整合

[進一步了解安全性](../data_security)

---

## 開始使用 {#getting-started}

:::info 企業版 vs. 開源版設定
以下步驟展示含 Organizations 的**完整企業層級結構**。 

對於**開源版**，請跳過步驟 1-2，直接從**步驟 3**（建立團隊）開始。團隊可作為您的最上層租戶邊界，而無需 Organizations。
:::

### 步驟 1：設定 Organizations ✨ 企業版 {#step-1-set-up-organizations--enterprise}

建立您的第一個 organization：

```bash
curl --location 'http://0.0.0.0:4000/organization/new' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "organization_alias": "engineering_department",
        "models": ["gpt-4", "gpt-4o", "claude-3-5-sonnet"],
        "max_budget": 10000
    }'
```

### 步驟 2：新增 Organization 管理員 ✨ 企業版 {#step-2-add-an-organization-admin--enterprise}

```bash
curl -X POST 'http://0.0.0.0:4000/organization/member_add' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{
        "organization_id": "org-123",
        "member": {
            "role": "org_admin",
            "user_id": "admin@company.com"
        }
    }'
```

### 步驟 3：建立團隊 ✅ 開源版 {#step-3-create-teams--open-source}

**企業版：** Organization 管理員在其 organization 內建立團隊  
**開源版：** Proxy 管理員直接建立團隊（不需要 `organization_id`）

```bash
# Enterprise: Org admin creates team in their organization
curl --location 'http://0.0.0.0:4000/team/new' \
    --header 'Authorization: Bearer sk-org-admin-key' \
    --header 'Content-Type: application/json' \
    --data '{
        "team_alias": "ml_team",
        "organization_id": "org-123",
        "max_budget": 5000
    }'

# Open Source: Proxy admin creates team directly
curl --location 'http://0.0.0.0:4000/team/new' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "team_alias": "ml_team",
        "max_budget": 5000
    }'
```

### 步驟 4：新增團隊管理員 {#step-4-add-team-admin}

```bash
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
    -H 'Authorization: Bearer sk-org-admin-key' \
    -H 'Content-Type: application/json' \
    -d '{
        "team_id": "team-456",
        "member": {
            "role": "admin",
            "user_id": "team-lead@company.com"
        }
    }'
```

### 步驟 5：團隊管理員管理其團隊 {#step-5-team-admin-manages-their-team}

```bash
# Team admin adds members
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
    -H 'Authorization: Bearer sk-team-admin-key' \
    -H 'Content-Type: application/json' \
    -d '{
        "team_id": "team-456",
        "member": {
            "role": "user",
            "user_id": "developer@company.com"
        }
    }'

# Team admin creates keys for members
curl --location 'http://0.0.0.0:4000/key/generate' \
    --header 'Authorization: Bearer sk-team-admin-key' \
    --header 'Content-Type: application/json' \
    --data '{
        "user_id": "developer@company.com",
        "team_id": "team-456"
    }'
```

---

## 使用案例範例 {#use-case-examples}

### 範例 1：Chargeback 模式 {#example-1-chargeback-model}

**目標**：每個業務單位為其自己的 LLM 用量付費

**設定：**
1. 為每個業務單位建立 organization
2. 根據分配的預算設定預算
3. 依 organization 追蹤支出
4. 為財務產生每月報告

**結果**：財務可將成本準確回 charge 到各部門。

---

### 範例 2：面向客戶的 AI 產品 {#example-2-customer-facing-ai-product}

**目標**：向客戶提供具隔離與成本追蹤的 LLM 能力

**設定：**
1. 為每位客戶建立 organization
2. 生產工作負載使用服務帳號金鑰
3. 依客戶 organization 追蹤支出
4. 依客戶方案設定速率限制

**結果**：準確向客戶計費，避免 noisy neighbors，維持隔離。

---

### 範例 3：開發 vs. 生產 {#example-3-development-vs-production}

**目標**：以不同政策區隔開發與生產環境

**設定：**
1. 建立「Development」與「Production」團隊
2. 開發：寬鬆預算、所有模型、使用者金鑰
3. 生產：嚴格預算、僅限核准模型、服務帳號金鑰
4. 依環境設定不同速率限制

**結果**：開發人員可自由實驗，而不影響生產預算或可靠性。

---

## 最佳實務 {#best-practices}

### 1. Organization 設計 {#1-organization-design}

- ✅ 將 organizations 對應到成本中心或客戶
- ✅ 設定合理的預算，並保留成長緩衝
- ✅ 為每個 organization 指派 1-2 位 org 管理員
- ❌ 不要建立太多 organizations（會增加管理負擔）

### 2. 團隊結構 {#2-team-structure}

- ✅ 讓團隊與實際工作群組保持一致
- ✅ 生產環境使用服務帳號金鑰
- ✅ 賦予團隊管理員足夠權限以自助服務
- ❌ 不要建立單一使用者團隊（請改用僅限使用者的金鑰）

### 3. 金鑰管理 {#3-key-management}

- ✅ 使用具描述性的金鑰名稱
- ✅ 定期輪替金鑰
- ✅ 刪除未使用的金鑰
- ✅ 依使用案例選擇適當的金鑰類型
- ❌ 不要在使用者／團隊之間共用金鑰

### 4. 預算管理 {#4-budget-management}

- ✅ 在多個層級設定預算（org → team → user）
- ✅ 定期監控支出
- ✅ 在預算耗盡前發出警示
- ❌ 不要把預算設得過緊（可能會阻擋合法使用）

### 5. 委派 {#5-delegation}

- ✅ 為大型 organization 指派 org 管理員
- ✅ 為活躍團隊指派團隊管理員
- ✅ 適當設定團隊成員權限
- ❌ 不要讓每個人都成為 proxy 管理員

---

## 監控與可觀測性 {#monitoring--observability}

LiteLLM 提供完整的監控：

- **支出追蹤**：依 org／team／user／key 即時追蹤支出
- **用量分析**：請求次數、token 用量、模型用量
- **管理 UI**：所有指標的視覺化儀表板
- **記錄**：含租戶脈絡的詳細記錄
- **警示**：預算警示、速率限制警示、錯誤警示

[進一步了解記錄](./logging)

---

## 與其他方法比較 {#comparison-with-other-approaches}

| 方法 | 優點 | 缺點 | LiteLLM 的優勢 |
|----------|------|------|-------------------|
| **每個租戶各自獨立執行個體** | 強隔離 | 高營運負擔、成本效率低 | 單一執行個體、相同隔離、成本降低 90% |
| **單一共享池** | 設定簡單 | 無成本歸屬、無存取控制 | 完整歸屬、細粒度存取控制 |
| **API 金鑰前綴** | 基本區隔 | 手動追蹤、無階層、無 RBAC | 自動追蹤、具階層、完整 RBAC |
| **外部驗證層** | 彈性高 | 整合複雜、無內建預算 | 原生整合、內建預算 |

---

## 常見問題 {#faq}

**問：使用者可以屬於多個團隊嗎？**  
答：可以，使用者可成為多個團隊的成員，並為每個團隊擁有不同的金鑰。

**問：當使用者離職時會發生什麼事？**  
答：會刪除使用者專屬金鑰，但團隊服務帳號金鑰仍保持啟用。

**問：團隊預算可以超過組織預算嗎？**  
答：不行，系統會強制團隊預算不得超過其組織的預算。

**問：成本追蹤的粒度有多細？**  
答：每次 API 呼叫都會追蹤組織、團隊、使用者與金鑰脈絡。

**問：我可以在沒有組織的情況下建立團隊嗎？**  
答：可以！在 **open source** 中，團隊可獨立運作，無需 Organizations。Organizations 是一項 **企業功能**，會在團隊之上再增加一層額外的階層。

**問：階層深度有上限嗎？**  
答：階層為：Organization → Team → User → Key（4 層）。這涵蓋了大多數使用情境。

**問：我該如何從扁平結構遷移到階層式結構？**  
答：您可以逐步建立 organizations 和 teams，然後將現有的 users/keys 移入其中。

---

## 相關文件 {#related-documentation}

- [使用者管理階層](./user_management_heirarchy) - 視覺化階層總覽
- [存取控制（RBAC）](./access_control) - 詳細的角色權限
- [團隊預算](./team_budgets) - 預算管理指南
- [虛擬金鑰](./virtual_keys) - API 金鑰管理
- [管理介面](./ui) - 用於管理的視覺化儀表板

---

## 摘要 {#summary}

LiteLLM 透過以下方式解決多租戶架構挑戰：

1. **階層式結構**：Organizations → Teams → Users → Keys
2. **細粒度 RBAC**：平台層級與租戶範圍角色
3. **成本歸因**：每個層級的支出追蹤
4. **委派**：組織管理員與團隊管理員自助管理
5. **隔離**：嚴格的租戶邊界
6. **可擴充性**：以相同架構處理 10 到 10,000+ 使用者

### 開源 vs. 企業 {#open-source-vs-enterprise}

**開源**（Teams + Users + Keys）：
- ✅ 以團隊作為主要租戶邊界
- ✅ 團隊管理員管理其團隊
- ✅ 具備團隊/使用者追蹤的虛擬金鑰
- ✅ 每個團隊的預算與速率限制
- ✅ 支出追蹤與記錄

**企業**（新增 Organizations 層）：
- ✨ 以 Organizations 實現頂層租戶隔離
- ✨ 組織管理員管理多個團隊
- ✨ 組織層級的預算與模型存取
- ✨ 階層式委派與報表

這使 LiteLLM 非常適合：
- ✅ 擁有多個部門的企業
- ✅ 擁有多個客戶的 SaaS 提供者
- ✅ 需要成本分攤／展示的組織
- ✅ 需要自助式 LLM 存取的團隊
- ✅ 任何多租戶 LLM 部署

[從 LiteLLM Proxy 開始 →](./quick_start)
