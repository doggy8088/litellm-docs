import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 存取群組 {#access-groups}

存取群組可簡化您在組織中定義與管理資源存取的方式。您不必在每個金鑰或團隊上分別設定模型、MCP 伺服器和代理程式，而是建立一個群組來彙整您要授權的資源，然後將該群組附加到您的金鑰或團隊。

## 總覽 {#overview}

**存取群組**可讓您在單一位置定義一組可重複使用的允許資源——模型、MCP 伺服器和代理程式。單一群組即可授予這三種資源類型的存取權。只要將群組附加到金鑰或團隊，它們就能存取該群組中定義的所有內容。

- **統一的資源控管** – 一個群組可同時控管模型、MCP 伺服器和代理程式的存取
- **可重複使用** – 定義一次，可附加到多個金鑰或團隊
- **容易維護** – 更新群組（新增或移除資源）後，所有已附加的金鑰與團隊都會自動反映變更
- **清楚可見** – 精確查看每個群組授予哪些資源，以及哪些金鑰/團隊正在使用它

<Image img={require('../../img/ui_access_groups.png')} />

### 運作方式 {#how-it-works}

**核心概念：** 在群組中定義資源 → 將群組附加到金鑰或團隊 → 金鑰/團隊取得群組中所有資源的存取權

| 資源類型   | 群組控管的內容                                                   |
| --------------- | -------------------------------------------------------------------- |
| **模型**      | 金鑰/團隊可使用哪些 LLM 模型（例如：`gpt-4`、`claude-3-opus`） |
| **MCP 伺服器** | 哪些 MCP 伺服器可供工具呼叫                     |
| **代理程式**      | 可呼叫哪些代理程式                                          |

## 如何在 UI 中建立與使用存取群組 {#how-to-create-and-use-access-groups-in-the-ui}

### 1. 前往存取群組 {#1-navigate-to-access-groups}

前往 Admin UI（例如 `http://localhost:4000/ui` 或您的 `PROXY_BASE_URL/ui`），然後在側邊欄中點選 **Access Groups**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/d117fdb2-18c8-49e0-91e6-1f830d2d4b85/ascreenshot_f5822a0ddac64e3383124419d0c66298_text_export.jpeg)

### 2. 建立存取群組 {#2-create-an-access-group}

點選 **Create Access Group**，並為您的群組命名。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/aefb900d-d106-4436-806c-3608ad19659f/ascreenshot_3f6fed1256604fe3b7038a0778ce3342_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/0951bb93-61bd-477e-beaf-f58810f8980b/ascreenshot_f0fb5d552fd74ff8a1080e82758fcdc2_text_export.jpeg)

### 3. 在群組中定義資源 {#3-define-resources-in-the-group}

使用分頁選擇此群組要授予哪些模型、MCP 伺服器和代理程式的存取權：

- **Models 分頁** – 選取 LLM 模型
- **MCP Servers 分頁** – 選取 MCP 伺服器（用於工具呼叫）
- **Agents 分頁** – 選取代理程式

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/37398e8f-cd50-48c9-85e2-c77b2eeb994b/ascreenshot_440ec7906c8f4199b30ef91c903960b9_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/99d36543-8582-4bb7-a34d-3d5fe0fcf12f/ascreenshot_d9983240955c496892e1f7c38c074045_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/06fc5919-5c71-4fc3-999b-da7a4800af3f/ascreenshot_db93fdf742b249dc90a4b9d5991d6097_text_export.jpeg)

### 4. 將存取群組附加到金鑰 {#4-attach-the-access-group-to-a-key}

建立或編輯虛擬金鑰時，展開 **Optional Settings** 並選取您的存取群組。該金鑰將繼承對該群組中定義的所有模型、MCP 伺服器和代理程式的存取權。

1. 前往 **Virtual Keys** 並點選 **+ Create New Key**
2. 展開 **Optional Settings**
3. 在 Access Group 欄位中，選取您建立的群組
4. 儲存金鑰

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/cdfa76ab-bf38-4ca4-a97d-2cb50fafe50b/ascreenshot_046daecb57554c28ba553cf6c01f5450_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/84f08e9c-e9d0-42aa-8317-f385190b6d7d/ascreenshot_2d239716d30f431d9ad494baf7933d6a_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/41d7b7f9-ac58-4602-b887-c35c9b419dce/ascreenshot_8abd4fef48014dd1b88848411e6d7912_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/e37b01c0-f2d7-4133-8b2f-ccc51f6769e1/ascreenshot_f495df428ad54cac9ec43b46c3dfc1b1_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-15/3fe33cad-6b64-46c3-a66e-6e6e073c3d7a/ascreenshot_f2dcc79ae8af47dd86ade2f85165d3c1_text_export.jpeg)

### 5. 將存取群組附加到團隊 {#5-attach-the-access-group-to-a-team}

您也可以在建立或編輯團隊時，將存取群組附加到團隊。之後，所有與該團隊相關聯的金鑰都將可存取群組中定義的資源。

## 使用情境 {#use-cases}

### 以團隊為基礎的存取 {#team-based-access}

建立像「Engineering」、「Data Science」或「Product」這樣的群組，並加入每個團隊所需的模型、MCP 伺服器和代理程式。將群組附加到團隊即可——不需要在每個金鑰上逐一設定每項資源。

### 環境區隔 {#environment-separation}

- **Production 群組** – Production 模型、已核准的 MCP 伺服器，以及 production 代理程式
- **Development 群組** – 成本效益高的模型、實驗性的 MCP 工具，以及 dev 代理程式

根據環境將適當的群組附加到金鑰或團隊。

### 簡化導入 {#simplified-onboarding}

新進開發者會取得附有存取群組的金鑰，而不是手動設定模型、MCP 伺服器和代理程式。將他們加入正確的團隊，或提供附有正確群組的金鑰。

### 集中式更新 {#centralized-updates}

當您將新的模型或 MCP 伺服器新增到群組時，所有附加到該群組的金鑰與團隊都會自動取得存取權。從群組中移除資源後，該資源會立即在所有地方被撤銷。

## 存取群組 vs. 模型存取群組 {#access-group-vs-model-access-groups}

LiteLLM 有兩個相關概念：

| 功能    | **存取群組**（本頁）                                           | **模型存取群組**                                 |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| 定義 | 在 UI 中定義；一個群組可包含模型、MCP 伺服器和代理程式 | 在設定檔中或透過 API 定義；群組以模型為中心  |
| 範圍      | 模型 + MCP 伺服器 + 代理程式                                           | 僅模型                                             |
| 附加到  | 金鑰、團隊                                                             | 金鑰、團隊                                             |
| 適用時機   | 您想從 UI 統一控管模型、MCP 和代理程式       | 您需要以設定檔或 API 為基礎的模型存取控管 |

若要使用 `access_groups` 在 `model_info` 中進行以設定檔為基礎的模型存取，請參閱 [Model Access Groups](./model_access_groups.md)。

## 相關文件 {#related-documentation}

- [Virtual Keys](./virtual_keys.md) – 建立與管理 API 金鑰
- [Role-based Access Controls](./access_control.md) – 組織、團隊與使用者角色
- [Model Access Groups](./model_access_groups.md) – 以設定檔為基礎的模型存取群組
- [MCP Control](../mcp_control.md) – MCP 伺服器設定與存取控管
