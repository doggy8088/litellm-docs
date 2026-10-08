import { TenancyDiagram } from '@site/src/components/CloudArchitecture';

# 使用 LiteLLM 的多租戶架構 {#multi-tenant-architecture-with-litellm}

## 概覽 {#overview}

LiteLLM 中的多租戶是指執行單一 proxy，為您公司內許多不同的租戶（組織、團隊、部門）提供服務，同時彼此之間保持存取、支出與使用量隔離。一個閘道作為所有 LLM 提供者的共用入口點，而每個請求都會攜帶租戶上下文，決定它可以存取哪些模型、從哪個預算扣款，以及成本會記到哪裡。

此設計解決了當多個群組共用一個 LLM 閘道時會出現的幾個問題。成本必須歸屬到正確的業務單位，而不是集中合併。存取權限必須依租戶而異，因為團隊需要不同的模型、預算與速率限制。管理權限必須可委派，讓團隊主管能在沒有整個平台管理員權限的情況下管理自己的團隊。而且同一套架構必須能從少數使用者擴展到數萬人，無需重新設計。

:::info[開源版 vs. 企業版]
團隊與虛擬金鑰可在開源版中使用，而僅以團隊即可作為您的最高層級租戶邊界。組織與 Org 管理員在其上再增加一層階層，且屬於企業功能（[取得 30 天試用](https://www.litellm.ai/#trial)）。
:::

## 租戶階層 {#the-tenancy-hierarchy}

<TenancyDiagram />

LiteLLM 將租戶建模為四個巢狀層級：組織包含團隊，團隊包含使用者，而使用者與團隊擁有金鑰。每一層都是隔離與支出歸屬的邊界。

- 組織是最高層級的租戶，可容納多個團隊。[API 參考](https://docs.litellm.ai/api-reference/#/organization%20management)
- 團隊是使用者的集合，可容納多位使用者。[API 參考](https://docs.litellm.ai/api-reference/#/team%20management)
- 使用者隸屬於團隊（可同時隸屬多個），並可擁有多把金鑰。[API 參考](https://docs.litellm.ai/api-reference/#/Internal%20User%20management)
- 金鑰用於驗證請求，並隸屬於使用者、團隊，或兩者皆是。[API 參考](https://docs.litellm.ai/api-reference/#/key%20management)

### 組織 {#organizations}

組織是最高層級的隔離單位，通常對應到某個業務單位或地區。組織彼此看不到對方的資料或金鑰，每個組織都有自己的預算與允許模型清單，並由各自的 org 管理員管理，而這些管理員只管理其中的團隊。組織是企業功能。

### 團隊 {#teams}

團隊是共同工作的使用者所形成的邏輯分組，也是開源版中的主要租戶邊界。團隊有自己的預算與速率限制、自己的管理員、自己的模型存取控制，以及用於共用工作負載的服務帳戶金鑰。當團隊位於某個組織內時，會繼承該組織的限制，且不能超過該組織預算，也不能存取該組織不允許的模型。

### 使用者 {#users}

使用者是屬於一個或多個團隊，並建立或使用金鑰的個人。支出會按使用者追蹤，而使用者可執行的操作則由其角色所規範，角色範圍從一般內部使用者，到團隊與 org 管理員，再到整個平台的 proxy 管理員。移除使用者會刪除其親自擁有的金鑰。

### 金鑰（虛擬金鑰） {#keys-virtual-keys}

虛擬金鑰用於驗證請求並將其綁定到某個租戶，以便追蹤支出。金鑰可限定於使用者、團隊（能在成員異動後仍持續存在的服務帳戶金鑰），或兩者皆是。若要完整了解各種金鑰類型及其使用時機，請參閱[服務帳戶](./service_accounts.md)。

## 角色與委派 {#roles-and-delegation}

只有在管理權限能沿著同一階層被委派時，隔離才真正有效。LiteLLM 在兩個層級提供角色：適用於所有地方的平台級角色（`proxy_admin`、`proxy_admin_viewer`、`internal_user`），以及授予對單一組織或團隊控制權的範圍角色（`org_admin`、`team_admin`）。proxy 管理員建立組織並指派 org 管理員，org 管理員在其組織內建立團隊並指派團隊管理員，而團隊管理員則可管理自己團隊的成員、速率限制與金鑰，而不會碰觸其他任何內容（他們可以維持或降低團隊預算，但提高預算則需要 proxy 管理員）。正是這條鏈，讓平台能在不把每次變更都經由中央管理員處理的情況下，導入數千名使用者。若要查看完整的角色矩陣、各角色能力，以及可設定的團隊成員權限，請參閱[存取控制](./access_control.md)；若要了解內部使用者如何自行導入並管理自己的金鑰，請參閱[內部使用者自助服務](./self_serve.md)。

## 支出與預算 {#spend-and-budgets}

支出會沿著階層向上流動，因此每次請求的成本會同時歸屬到其金鑰、使用者、團隊與組織。預算可在每一層設定，並向內強制執行：團隊預算不能超過其組織預算，使用者預算不能超過團隊預算，而當請求路徑上的任何一層超出預算時，請求就會被封鎖。這就是為何共用執行個體也能進行按租戶收費與成本回饋（showback）。請參閱[團隊預算](./team_budgets.md) 以在整個階層中設定預算，以及[成本追蹤](./cost_tracking.md) 了解支出如何歸屬與報告。

## 常見租戶模式 {#common-tenancy-patterns}

同樣的四個層級可以表達幾種實際場景。以下是階層如何對應到組織的示意，而非設定指南。

### 企業部門 {#enterprise-departments}

大型企業會為每個部門提供自己的租戶。使用組織時，Engineering、Marketing 與 Sales 會是彼此獨立的組織，每個組織底下有數個團隊（Backend、Frontend、ML 等），並在部門總上限之下管理自己的預算。於開源版中，相同的隔離是僅以團隊來表達（例如 Engineering Backend 團隊、Marketing Content 團隊等），以較扁平的結構取代部門層級的彙總。不論哪種方式，每個群組都擁有自己的預算，部門或團隊主管擔任管理員，而財務部門則保有跨部門的成本可視性。

### 環境隔離 {#environment-separation}

單一公司會將 Production、Staging 與 Development 分成不同團隊，以免實驗性工作消耗或破壞正式環境。Production 與 staging 依賴具有嚴格速率限制與核准模型清單的服務帳戶金鑰，而 development 則使用限制較寬鬆、用於測試的使用者金鑰。由於每個環境都是自己的預算與模型邊界，development 流量絕不可能耗盡 production 預算。

## 相關文件 {#related-documentation}

- [使用者管理階層](./user_management_heirarchy.md) - 使用者、團隊、組織與預算的視覺總覽
- [存取控制（RBAC）](./access_control.md) - 角色、權限與組織導入
- [服務帳戶](./service_accounts.md) - 虛擬金鑰類型與共用正式環境金鑰
- [團隊預算](./team_budgets.md) - 階層中的預算
- [成本追蹤](./cost_tracking.md) - 支出歸屬與報表
- [內部使用者自助服務](./self_serve.md) - 使用者如何自行導入並管理自己的金鑰
- [記錄](./logging.md) - 使用租戶上下文監控支出與使用量
- [Admin UI](./ui.md) - 用於管理租戶的視覺化儀表板
