import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快速入門 {#quick-start}

建立金鑰、追蹤花費、新增模型，而無需擔心 config / CRUD 端點。

<Image img={require('../../img/litellm_ui_create_key.png')} />

## 快速入門 {#quick-start-1}

- 需要先設定 proxy master key
- 需要已連接 db

請依照 [設定](./virtual_keys.md#setup)

### 1. 啟動 proxy {#1-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

#INFO: Proxy running on http://0.0.0.0:4000
```

### 2. 前往 UI {#2-go-to-ui}

```bash
http://0.0.0.0:4000/ui # <proxy_base_url>/ui
```

### 3. 在 Swagger 取得 Admin UI 連結 {#3-get-admin-ui-link-on-swagger}

您的 Proxy Swagger 可在 Proxy 的根目錄找到：例如：`http://localhost:4000/`

<Image img={require('../../img/ui_link.png')} />

### 4. 變更預設使用者名稱 + 密碼 {#4-change-default-username--password}

請在 Proxy 的 .env 中設定以下內容

```shell
LITELLM_MASTER_KEY="sk-1234" # this is your master key for using the proxy server
UI_USERNAME=ishaan-litellm   # username to sign in on UI
UI_PASSWORD=langchain        # password to sign in on UI
```

存取 LiteLLM UI 時，系統會提示您輸入使用者名稱與密碼

### 5. 設定根目錄重新導向 URL {#5-configure-root-redirect-url}

當 `DOCS_URL` 設定為非 `"/"` 以外的值時，您可以使用 `ROOT_REDIRECT_URL` 設定根路徑（`/`）重新導向到哪裡：

```shell
DOCS_URL="/docs"              # Set docs to a different path
ROOT_REDIRECT_URL="/ui"       # Redirect root path (/) to /ui
```

預設情況下，`DOCS_URL` 是 `"/"`，因此只有在您已將 `DOCS_URL` 變更為不同路徑時才需要此設定。

## 邀請其他使用者 {#invite-other-users}

允許其他人建立/刪除自己的金鑰。

[**前往這裡**](./self_serve.md)

## 模型管理 {#model-management}

Admin UI 提供完整的模型管理功能：

- **新增模型**：無需重新啟動 proxy，即可透過 UI 新增模型
- **AI Hub**：將模型和代理程式公開，讓開發者探索可用項目
- **價格資料同步**：透過從 GitHub 同步，讓模型定價資料保持最新

如需模型管理的詳細資訊，請參閱 [模型管理](./model_management.md)。

如需關於共享模型和代理程式的資訊，請參閱 [AI Hub](./ai_hub.md)。

:::tip 同步模型定價資料
[從 GitHub 同步模型定價資料](./sync_models_github.md)，讓您的模型成本資訊保持最新。
:::

## 停用 Admin UI {#disable-admin-ui}

在您的環境中設定 `DISABLE_ADMIN_UI="True"` 以停用 Admin UI。

如果您的資安團隊對 UI 使用有額外限制，這會很有用。

**預期回應**

<Image img={require('../../img/admin_ui_disabled.png')}/>
