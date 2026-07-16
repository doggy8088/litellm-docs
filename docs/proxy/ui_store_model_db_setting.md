import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 將模型儲存在 DB 設定 {#store-model-in-db-settings}

直接從管理員 UI 啟用或停用將模型定義儲存在資料庫中——無需編輯設定檔或重新啟動 proxy。這對於雲端部署特別有用，因為更新設定很困難，或需要很長的發行流程。

## 總覽 {#overview}

先前，`store_model_in_db` 設定必須在 `proxy_config.yaml` 下的 `general_settings` 中進行設定。變更它需要編輯設定並重新啟動 proxy，這對於無法直接存取設定檔，或想避免重啟造成停機的雲端使用者來說很有問題。

<Image img={require('../../img/ui_store_model_in_db.png')} />

**將模型儲存在 DB 設定** 可讓您：

- **啟用或停用將模型儲存在資料庫中** – 控制模型定義是否快取在您的資料庫中（有助於減少設定檔大小並提升可擴充性）
- **立即套用變更** – 無需重新啟動 proxy；儲存後，設定會立即對新的模型操作生效

:::warning UI 會覆寫設定
在 UI 中變更的設定會**覆寫**設定檔中的值。範例來說，如果 `store_model_in_db` 在 `false` 中設為 `general_settings`，在 UI 中啟用後仍會將模型定義持續寫入資料庫。當您想要在不重新部署的情況下進行執行階段控制時，請使用 UI。
:::

## 將模型儲存在 DB 的運作方式 {#how-store-model-in-db-works}

當 `store_model_in_db` 啟用時，LiteLLM proxy 會將模型定義儲存在資料庫中，而不是完全依賴您的 `proxy_config.yaml`。這帶來多項好處：

- **減少設定大小** – 將模型定義移出 YAML，便於維護
- **可擴充性** – 資料庫儲存比大型 YAML 檔案更能擴充
- **動態更新** – 無需編輯設定檔即可新增或更新模型
- **持久性** – 模型定義會在各個 proxy 實例與重啟之間持續保留

此設定會從您儲存的那一刻起套用到所有新的模型操作。

## 如何在 UI 中設定將模型儲存在 DB 中 {#how-to-configure-store-model-in-db-in-the-ui}

### 1. 存取 Models + Endpoints 設定 {#1-access-models--endpoints-settings}

前往管理員 UI（例如 `http://localhost:4000/ui` 或您的 `PROXY_BASE_URL/ui`），然後進入 **Models + Endpoints** 頁面。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-22/55bc71f5-730f-4b2c-8539-8a4f46b8bd10/ascreenshot_0f7ba8f1c2694e94938996fd1b4adfcc_text_export.jpeg)

### 2. 開啟設定 {#2-open-settings}

從導覽選單點選 **Models + Endpoints**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-22/55bc71f5-730f-4b2c-8539-8a4f46b8bd10/ascreenshot_fc2b9e4812a9480087f4eb350fa0a792_text_export.jpeg)

### 3. 點選設定圖示 {#3-click-the-settings-icon}

在 Models + Endpoints 頁面上尋找設定（齒輪）圖示以開啟設定面板。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-22/7b394364-c281-4db8-8cad-ee322c76c935/ascreenshot_d7c8a6b234bc4e4d92aa7f09aefb13d3_text_export.jpeg)

### 4. 啟用或停用將模型儲存在 DB 中 {#4-enable-or-disable-store-model-in-db}

依照您的偏好切換 **Store Model in DB** 設定：

- **Enabled**：模型定義會儲存在資料庫中
- **Disabled**：模型僅從設定檔讀取

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-22/54a263ec-ad67-4b16-ba9f-2be57c3e4cb8/ascreenshot_501abda2a6c847f79d085efce814265d_text_export.jpeg)

### 5. 儲存設定 {#5-save-settings}

點選 **Save Settings** 以套用變更。無需重新啟動 proxy；新設定會立即對後續的模型操作生效。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-22/7d13559a-d4e4-41f7-993b-cb20fbfa1f6e/ascreenshot_3245f3c5bd0d43cb96c5f5ff0ccb461d_text_export.jpeg)

## 使用情境 {#use-cases}

### 雲端與代管部署 {#cloud-and-managed-deployments}

當 proxy 在代管或雲端環境中執行時，設定可能位於不同的 repo、需要很長的發行週期，或由其他團隊控管。使用 UI 可讓您變更 `store_model_in_db` 設定，而不必經過部署流程。

### 降低設定複雜度 {#reducing-configuration-complexity}

對於有數百個模型的大型部署，將模型定義儲存在資料庫中可減少 `proxy_config.yaml` 的大小與複雜度，讓維護與版本控制更容易。

### 動態模型管理 {#dynamic-model-management}

啟用 `store_model_in_db` 以支援動態新增與更新模型，無需編輯您的設定檔。團隊可透過 UI 或 API 管理模型，而不需要重新部署 proxy。

### 零停機更新 {#zero-downtime-updates}

從 UI 變更設定並立即生效——非常適合必須將停機時間降到最低的正式環境。

## 相關文件 {#related-documentation}

- [Admin UI Overview](./ui.md) – LiteLLM 管理員 UI 的一般指南
- [Models and Endpoints](./model_management.md) – 管理模型與 API 端點
- [Config Settings](./config_settings.md) – `store_model_in_db` 於 `general_settings`
