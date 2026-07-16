import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ✨ [Beta] 專案管理 UI {#-beta-project-management-ui}

:::info

這是 Enterprise 功能。
[Enterprise 定價](https://www.litellm.ai/#pricing)

[請在此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

直接從 LiteLLM 管理員 UI 管理專案。專案位於組織階層中的團隊與金鑰之間，可針對特定使用案例或應用程式提供細緻的存取控制與預算管理。

:::info
專案管理是 beta 功能。API 與 UI 可能變更。如需完整 API 文件，請參閱 [專案管理](./project_management.md)。
:::

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

- 管理員或團隊管理員存取權限
- 至少已建立一個團隊（專案從屬於團隊）
- 本機或遠端執行中的 LiteLLM 管理員 UI

## 在 UI 設定中啟用專案 {#enable-projects-in-ui-settings}

在您能建立專案之前，需要先在管理員 UI 設定中啟用 Projects 功能。

### 步驟 1：存取管理員設定 {#step-1-access-admin-settings}

前往管理員 UI（例如，`http://localhost:4000/ui/?login=success`）。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/b8de4dbf-a23b-4979-84a3-95fe17427b5a/ascreenshot_84dcb13b57a84fd589dff2d5af58adde_text_export.jpeg)

### 步驟 2：開啟設定選單 {#step-2-open-settings-menu}

點選頂端導覽列中的 **"New"** 按鈕。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/b8de4dbf-a23b-4979-84a3-95fe17427b5a/ascreenshot_447c8ea124f64d0eb18d3c9621f7cbbc_text_export.jpeg)

### 步驟 3：前往管理員設定 {#step-3-navigate-to-admin-settings}

點選 **"Admin Settings"**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/cc2ce9d9-d2d2-49f3-9fb8-c546fb8dfdcf/ascreenshot_fd792e9dbda24e7eb5cdb508c4f181f8_text_export.jpeg)

### 步驟 4：開啟 UI 設定 {#step-4-open-ui-settings}

點選 **"UI Settings New"**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/d667f4b4-300b-47c6-9d76-12e439519da6/ascreenshot_3f3db4df432843a48b53ae16b311e7df_text_export.jpeg)

### 步驟 5：啟用 Projects 功能 {#step-5-enable-projects-feature}

點選切換開關以啟用 Projects 功能。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/4819f76b-4855-4f5c-8c4b-b4c272399724/ascreenshot_9df0555ae6db425ab839d73485ee9b99_text_export.jpeg)

啟用後，Projects 區段會出現在管理員 UI 導覽中，您就能建立與管理專案。

## 建立與管理專案 {#create-and-manage-projects}

啟用 Projects 功能後，您可以從 Projects 頁面建立專案。

### 步驟 1：前往 Projects {#step-1-navigate-to-projects}

在側邊欄中點選 **"Projects New"**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/889e2e55-af7a-42f1-90d5-8bba8efaa986/ascreenshot_c42e33e2226c4e8b8e8ea83a7c8955e4_text_export.jpeg)

### 步驟 2：建立新專案 {#step-2-create-a-new-project}

點選 **"Create Project"**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/8ecb531c-8e96-443d-ba1d-1a9e04ba2da3/ascreenshot_74f1b3c1c1b84517ae51881a050df73a_text_export.jpeg)

### 步驟 3：輸入專案名稱 {#step-3-enter-project-name}

點選 **"Project Name"** 欄位並輸入您的專案名稱。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/83bf0612-2b19-4b28-ae02-bdb122dca4fa/ascreenshot_16ca328a71f04a79bb9641ab9c1ed6fe_text_export.jpeg)

### 步驟 4：選擇團隊 {#step-4-select-a-team}

選擇此專案所屬的團隊。專案的範圍限定於團隊，因此您只能存取該團隊可用的模型與功能。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/653c2f1e-5140-49b8-962f-a2b112f4834c/ascreenshot_7861310ad77d4859adcae789a9d51bd0_text_export.jpeg)

### 步驟 5：設定模型存取權限 {#step-5-configure-model-access}

選擇此專案可存取哪些模型。可用模型的範圍限定於團隊允許的模型。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/401a5716-ea16-4744-866a-d0ed6007065d/ascreenshot_a936c3ca417a49b2b603c890dee9d0ea_text_export.jpeg)

### 步驟 6：建立專案 {#step-6-create-project}

點選 **"Create Project"** 以儲存您的專案。

![](https://colony-recorder.s3.amazonaws.com/files/2026-03-01/2f9f9ba1-df0b-4bef-b17c-77dfc38372f7/ascreenshot_933e4c1b119d43beb84161b94b17b764_text_export.jpeg)

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
