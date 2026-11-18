# 專案管理 UI {#project-management-ui}

<EnterpriseFeature />

直接從 LiteLLM 管理員 UI 管理專案。專案位於組織階層中的團隊與金鑰之間，可針對特定使用案例或應用程式提供細緻的存取控制與預算管理。

## 概觀 {#overview}

專案可讓您：

- 依使用案例或應用程式整理 API 金鑰
- 設定專案層級的預算與速率限制
- 在專案層級追蹤支出與用量
- 控制每個專案可存取的模型
- 維持不同應用程式或團隊之間清楚的區隔

**階層**：`Organizations > Teams > Projects > Keys`

如需專案 API 與設定的詳細資訊，請參閱 [專案管理](./project_management.md)。

## 前置條件 {#prerequisites}

- 有效的 LiteLLM Enterprise 授權
- 管理員或團隊管理員存取權限
- 至少已建立一個團隊（專案從屬於團隊）
- 本機或遠端執行中的 LiteLLM 管理員 UI

## 建立與管理專案 {#create-and-manage-projects}

Projects 會出現在管理員 UI 側邊欄的 Access Control 下，供 Proxy 管理員、Org 管理員與 Team 管理員使用。請從 Projects 頁面建立與管理專案。

若沒有有效的 Enterprise 授權，Projects 頁面會顯示 Enterprise 通知與試用連結，而非專案控制項。

![顯示 Enterprise 授權通知的 Projects 頁面](/img/projects-ga/projects-enterprise-notice.jpg)

### 步驟 1：前往 Projects {#step-1-navigate-to-projects}

在側邊欄中點選 **"Projects"**。

![管理員 UI 側邊欄中 Access Control 下的 Projects](/img/projects-ga/projects-01-navigation.jpg)

### 步驟 2：建立新專案 {#step-2-create-a-new-project}

點選 **"Create Project"**。

![Create New Project 表單](/img/projects-ga/projects-02-create-dialog.jpg)

### 步驟 3：輸入專案名稱 {#step-3-enter-project-name}

點選 **"Project Name"** 欄位並輸入您的專案名稱。

![已為 Documentation Assistant 輸入專案名稱與說明](/img/projects-ga/projects-03-project-name.jpg)

### 步驟 4：選擇團隊 {#step-4-select-a-team}

選擇此專案所屬的團隊。專案的範圍限定於團隊，因此您只能存取該團隊可用的模型與功能。

![Team 選擇器中的 Product Engineering](/img/projects-ga/projects-04-select-team.jpg)

### 步驟 5：設定模型存取權限 {#step-5-configure-model-access}

選擇此專案可存取哪些模型。可用模型的範圍限定於團隊允許的模型。

![含有 All Team Models 選項的 Allowed Models 選擇器](/img/projects-ga/projects-05-model-access.jpg)

### 步驟 6：建立專案 {#step-6-create-project}

點選 **"Create Project"** 以儲存您的專案。

![Documentation Assistant 已儲存為 Product Engineering 下的啟用專案](/img/projects-ga/projects-06-created.jpg)

## 使用案例 {#use-cases}

### 團隊內的金鑰整理 {#key-organization-within-teams}

依使用案例或應用程式在團隊內整理 API 金鑰。將相關金鑰分組到專案中，讓您可以把預算、模型存取權限與權限視為一個整體來管理，而不是逐一管理。

### 成本分攤 {#cost-allocation}

將專案指派給不同的成本中心或團隊。追蹤每個專案的支出，並將成本回分配給負責的團隊或業務單位。

### 功能逐步推出 {#feature-rollout}

為新功能或實驗性使用案例建立專用專案。在測試期間控制可用模型並設定保守的速率限制。

### 客戶分群 {#customer-segmentation}

如果您是平台方，請為不同的客戶分群或使用案例建立專案。針對每個分群獨立控制資源分配。

## 後續步驟 {#next-steps}

建立專案後：

1. **產生 API 金鑰** – 建立範圍限定於您的專案、供應用程式使用的 API 金鑰
2. **設定預算** – 透過 [Project Management API](./project_management.md) 設定專案層級的預算上限
3. **追蹤支出** – 在用量儀表板中檢視專案層級支出
4. **管理存取權限** – 使用 [Access Groups](./access_groups.md) 控制模型與 MCP server 存取

## 相關文件 {#related-documentation}

- [Project Management API](./project_management.md) – 專案的完整 API 參考文件
- [Access Groups](./access_groups.md) – 為模型、MCP server 與代理程式定義可重複使用的存取控制
- [Virtual Keys](./virtual_keys.md) – 建立與管理範圍限定於專案的 API 金鑰
- [Role-based Access Control](./access_control.md) – 組織、團隊與使用者角色
- [Spend Logs](./spend_logs_deletion.md) – 追蹤詳細的請求層級成本與用量
