import Image from '@theme/IdealImage';

# UI 支出記錄設定 {#ui-spend-log-settings}

可直接從 Admin UI 設定支出記錄行為——不需要編輯設定檔或重新啟動 proxy。這在雲端部署中特別有用，因為更新設定檔很困難，或需要很長的發佈流程。

## 概覽 {#overview}

先前，支出記錄選項（例如儲存請求／回應內容和保留期間）必須在 `proxy_config.yaml` 的 `general_settings` 下設定。變更這些設定需要編輯設定檔並重新啟動 proxy，這對使用者而言是個痛點——特別是在雲端環境中——因為他們不容易存取設定檔，或者其部署流程使設定更新速度很慢。

<Image img={require('../../img/ui_spend_logs_settings.png')} />

**UI 支出記錄設定** 可讓您：

- **在支出記錄中儲存提示詞** – 啟用或停用在支出記錄表格中儲存請求和回應內容（只會影響您變更設定之後建立的記錄）
- **設定保留期間** – 設定支出記錄在自動清除前保留多久（例如 `7d`、`30d`）
- **立即套用變更** – 不需要重新啟動 proxy；儲存後設定會立即對新請求生效

:::warning UI 會覆寫 config
在 UI 中變更的設定會**覆寫**您設定檔中的值。例如，如果 `store_prompts_in_spend_logs` 在 `general_settings` 中明確設為 `false`，在 UI 中將其開啟仍會啟用提示詞儲存。當您想要在不重新部署的情況下進行執行階段控制時，請使用 UI。
:::

## 您可以設定的項目 {#settings-you-can-configure}

| 設定                             | 說明                                                                                                                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **在支出記錄中儲存提示詞**       | 啟用時，請求訊息和回應內容會儲存在**新的**支出記錄中，因此您可以在 Logs UI 中檢視它們。在您啟用之前建立的記錄不會有請求／回應內容。停用時，新的記錄只會儲存中繼資料（例如 token、成本、模型）。 |
| **保留期間**                     | 在支出記錄自動刪除前，允許保留的最長時間（例如 `7d`、`30d`）。為選填；若未設定，記錄會依照您的設定或預設行為保留。                                                                                                         |

相同選項也可以透過 [general_settings](./config_settings.md#general_settings---reference) 在設定檔中設定（`store_prompts_in_spend_logs`、`maximum_spend_logs_retention_period`）。在 UI 中設定的值具有優先順序。

## 如何在 UI 中設定支出記錄設定 {#how-to-configure-spend-log-settings-in-the-ui}

### 1. 開啟 Logs 頁面 {#1-open-the-logs-page}

前往 Admin UI（例如 `http://localhost:4000/ui` 或您的 `PROXY_BASE_URL/ui`），然後點擊 **Logs**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/815f4ab2-4b8c-4dfe-be39-689fd6e12167/ascreenshot_eaaeba1507b441408e0df8bf94bc70cc_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/815f4ab2-4b8c-4dfe-be39-689fd6e12167/ascreenshot_666628f5e62443688a58b7cee7d7559b_text_export.jpeg)

### 2. 開啟 Logs 設定 {#2-open-logs-settings}

點擊 Logs 頁面上的 **Settings**（齒輪）圖示，開啟支出記錄設定面板。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/303077bd-80a0-4f3b-9dc1-4abb90af117f/ascreenshot_63f5dc21a545489ea9266f3bd3dc8455_text_export.jpeg)

### 3. 啟用在支出記錄中儲存提示詞（選用） {#3-enable-store-prompts-in-spend-logs-optional}

如果您希望將請求和回應內容儲存在新的請求中，並在開啟那些記錄項目時可見，請開啟 **Store Prompts in Spend Logs**。這只會影響您啟用之後建立的記錄；既有記錄不會新增請求／回應內容。若您只需要中繼資料（token、成本、模型等），請保持關閉。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/a25d0051-4b34-4270-99d6-6e8ae0d2936a/ascreenshot_374605862aad42c89a98da7bad910f58_text_export.jpeg)

### 4. 設定保留期間（選用） {#4-set-the-retention-period-optional}

可選擇設定 **Retention Period**（例如 `7d`、`30d`），以控制支出記錄在自動清除前保留多久。格式與設定選項 `maximum_spend_logs_retention_period` 相同。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/87086197-b082-4339-b798-37410f47d9ac/ascreenshot_564da14f492540ae8b0b782cfedceff9_text_export.jpeg)

### 5. 儲存設定 {#5-save-settings}

點擊 **Save Settings**。變更會立即對新請求生效；不需要重新啟動 proxy。既有記錄不會更新。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/8cfd82c1-0ff4-4561-a806-33a7998cf0fd/ascreenshot_673f6155b17f45ee9b80fabdfc42a4ee_text_export.jpeg)

### 6. 驗證：在記錄中檢視請求和回應 {#6-verify-view-request-and-response-in-a-log}

啟用 **Store Prompts in Spend Logs** 後，透過 proxy 發出新的請求，然後開啟該記錄項目（或任何其他在您啟用設定後建立的記錄）。記錄詳細資料檢視將包含請求和回應內容。在您開啟設定之前已存在的記錄不會有這些內容。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/0fbec553-9a11-4f4f-8a1d-f969bb316c70/ascreenshot_62ecbcea97ea4a4abaa460d76e2cf924_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-31/30e7ea4d-2c03-4b96-88a9-eeee565eaf16/ascreenshot_c00ad6aa75b54b4988a1450647a76f6b_text_export.jpeg)

## 使用案例 {#use-cases}

### 雲端與代管部署 {#cloud-and-managed-deployments}

當 proxy 執行於代管或雲端環境時，設定可能位於不同的 repo、需要很長的發佈流程，或由另一個團隊管理。使用 UI 可讓您變更支出記錄行為（例如啟用提示詞儲存以進行除錯，或設定保留期間），而無需經過該流程。

### 供除錯時快速切換 {#quick-toggles-for-debugging}

暫時啟用 **Store Prompts in Spend Logs**，即可在除錯時檢查新請求的請求／回應內容，之後再從 UI 將其關閉，無需編輯設定檔或重新啟動。只有在設定開啟期間建立的記錄才會包含這些內容。

### 不重新部署即可調整保留期間 {#retention-without-redeploying}

調整支出記錄的保留時間（例如縮短以減少儲存空間，或延長以符合合規需求），新的保留期間與清除工作就會立即生效。

## 相關文件 {#related-documentation}

- [開始使用 UI Logs](./ui_logs.md) – 記錄哪些內容與基於設定檔的選項概覽
- [設定檔設定](./config_settings.md) – `store_prompts_in_spend_logs`、`disable_spend_logs`、`maximum_spend_logs_retention_period` 於 `general_settings`
- [Spend Logs 刪除](./spend_logs_deletion.md) – 保留期間與清除如何運作
