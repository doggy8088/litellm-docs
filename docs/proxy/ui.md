import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快速入門 {#quick-start}

建立金鑰、追蹤花費、新增模型，而無需擔心 config / CRUD 端點。

<Image img={require('../../img/litellm_ui_create_key.png')} dark={require('../../img/litellm_ui_create_key_dark.png')} alt="The Virtual Keys page with the Create New Key button" />

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

### 3. 從 API 參考開啟 Admin UI {#3-open-the-admin-ui-from-the-api-reference}

請在 `http://localhost:4000/` 開啟 proxy 的 API 參考，並在簡介中選擇 Admin Panel 連結。

### 4. 首次登入 {#4-sign-in-for-the-first-time}

開箱即用時，UI 接受由環境變數組成的登入資訊：使用者名稱是 `UI_USERNAME`（預設為 `admin`），密碼是 `UI_PASSWORD`。如果 `UI_PASSWORD` 未設定，則會直接接受 master key 本身作為密碼。以這種方式登入的任何人都會是 proxy 管理員。

```shell
LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)" # master key for the proxy; must start with sk-
UI_USERNAME=ishaan-litellm   # username to sign in on UI
UI_PASSWORD=langchain        # password to sign in on UI
```

存取 LiteLLM UI 時，系統會提示您輸入使用者名稱與密碼

:::warning[環境憑證僅供啟動使用]
這條登入路徑會在您的環境中儲存一組永久、共用、明文的管理員憑證，無法針對個別人員輪替，而且無法得知是哪位管理員執行了哪些操作。登入後，請依照下列步驟改用每位使用者各自的帳號並將其停用。在您完成之前，儀表板會對每位管理員顯示警告橫幅。
:::

### 5. 建立您自己的管理員帳號並停用環境憑證登入 {#5-create-your-own-admin-account-and-disable-environment-credential-login}

首先，使用環境憑證登入後，為自己建立一個 `proxy_admin` 使用者：前往 `Internal Users` -> `+ Invite User`，將角色設為 `proxy_admin`，然後開啟系統產生的邀請連結以設定您的密碼。您也可以透過 API 使用 `POST /user/new` 和 `user_role` 的 `proxy_admin` 來建立該使用者；請參閱 [邀請使用者](./self_serve.md)。請登出並確認您可以使用您的電子郵件與新密碼登入後，再繼續下一步。

接著，在您的 `config.yaml` 中關閉環境憑證登入路徑，並重新啟動 proxy：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  disable_env_credential_login: true
```

重新啟動後，`UI_USERNAME`/`UI_PASSWORD` 和 master key 會在登入頁面被拒絕並顯示 `401 Invalid credentials used to access UI`，警告橫幅會消失，而且只有資料庫中的使用者（以及已設定時的 [SSO](./admin_ui_sso.md)）可以登入。現在您可以從環境中移除 `UI_USERNAME` 和 `UI_PASSWORD`。

:::note
在建立帶有密碼的 `proxy_admin` 使用者之前啟用 `disable_env_credential_login`，會使您無法登入。如果您遇到這種情況，請使用 master key 停用 `disable_env_credential_login`，然後重新啟動 proxy 以恢復存取。
:::

如果您使用 SSO，`disable_password_login_when_sso_enabled` 也會封鎖這條登入路徑，因為在 SSO 提供者完全設定完成後，它會拒絕所有使用者名稱/密碼登入。請參閱 [Admin UI 的 SSO](./admin_ui_sso.md)。

### 6. 設定 Root Redirect URL {#6-configure-root-redirect-url}

當 `DOCS_URL` 設定為非 `"/"` 以外的值時，您可以使用 `/` 設定根路徑（`ROOT_REDIRECT_URL`）重新導向到哪裡：

```shell
DOCS_URL="/docs"              # Set docs to a different path
ROOT_REDIRECT_URL="/ui"       # Redirect root path (/) to /ui
```

預設情況下，`DOCS_URL` 是 `"/"`，因此只有在您已將 `DOCS_URL` 變更為不同路徑時才需要此設定。

## 為 SSO 中斷保留一個緊急管理員帳號 {#keep-a-break-glass-admin-account-for-sso-outages}

如果您的管理員平常以 SSO 登入，且 `disable_env_credential_login` 已開啟，請保留一個共用的 `proxy_admin` 資料庫使用者並為其設定密碼，以備您的 SSO 提供者中斷時使用，並將其電子郵件與密碼存放在您的密碼保管庫中。該帳號在 `/fallback/login` 以其電子郵件作為使用者名稱登入。`disable_env_credential_login` 不會阻擋它，因為該設定只關閉 `UI_USERNAME`/`UI_PASSWORD` 與 master key 登入，而設有密碼的資料庫使用者仍可登入。請為它指定一個您的 SSO 提供者中任何帳號都未使用的電子郵件，因為以相同電子郵件進行的 SSO 登入會被比對到此使用者，並可能改變其角色。

建立它最簡單的方法，是以管理員身分登入後從儀表板操作。前往 `Internal Users` -> `+ Invite User`，輸入例如 `breakglass-admin@example.com` 的電子郵件，並將 `Global Proxy Role` 設為 `Admin (All Permissions)`。未使用 SSO 時，開啟它顯示的邀請連結來設定密碼。已設定 SSO 時，該連結只會透過 SSO 將使用者登入，因此請開啟 `Internal Users` 中新使用者列上的動作選單，選擇 `Reset password`，再開啟該連結來設定密碼。請在私密視窗中開啟連結，因為設定密碼會讓該瀏覽器以新帳號登入。透過任一連結設定的密碼都可立即使用，首次登入時不需強制變更。

您也可以使用 master key 透過 API 建立它。`/user/new` 不接受密碼，因此請以 `/user/update` 設定密碼，並傳入 `"auto_create_key": false`，讓 `/user/new` 不會同時為此使用者建立管理員 API 金鑰：

```bash
curl -X POST "$PROXY_BASE_URL/user/new" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "breakglass-admin", "user_email": "breakglass-admin@example.com", "user_role": "proxy_admin", "auto_create_key": false}'

curl -X POST "$PROXY_BASE_URL/user/update" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "breakglass-admin", "password": "<password>"}'
```

密碼必須通過 proxy 的密碼原則，預設為至少 12 個字元，且包含一個大寫字母、一個小寫字母、一個數字和一個特殊字元，否則 `/user/update` 會回應 400。自 v1.104.0 起，管理員以 `/user/update` 設定的密碼必須在首次登入時變更。儀表板會開啟 Change Password 頁面，在密碼變更之前，該工作階段只能變更密碼或登出。因此，請在建立帳號後立即在 `/fallback/login` 登入一次，在該處選定最終密碼，並將該密碼存入保管庫。

請在需要用到它之前先測試該帳號。登出後開啟 `/fallback/login`，以保管庫中的憑證登入。您應該會以管理員身分進入儀表板。若日後要更換密碼，請以該帳號登入並使用帳號選單中的 `Change Password`（自 v1.104.0 起），或請另一位管理員在其 `Internal Users` 列上開啟 `Reset password`，然後更新保管庫。

當 `disable_password_login_when_sso_enabled` 開啟時，此帳號無法登入，因為該設定在 SSO 完整設定後會拒絕所有使用者名稱/密碼登入；因此若您仰賴緊急帳號，請將其保持關閉。此帳號的登入失敗會計入下方的[登入限制](#limit-failed-sign-in-attempts)。

## 限制登入失敗嘗試次數 {#limit-failed-sign-in-attempts}

Admin UI 中使用者名稱與密碼登入失敗的次數會依來源位址計算。任何位址在 60 秒內對所有使用者名稱累計超過 10 次錯誤密碼，會使該位址被封鎖 5 分鐘。帳號永遠不會被鎖定：相同的使用者名稱仍可從任何其他位址登入。位址限制的一半（預設為 5）是該位址對單一使用者名稱的可用次數。超過後只會封鎖該位址與使用者名稱組合，而其後續失敗將不再計入該位址，因此卡在單一帳號上的腳本不會讓共享辦公室位址後方的所有人都無法登入。

封鎖生效期間，該位址或組合的每次登入嘗試都會在驗證密碼前被拒絕，並回傳 `429 Too many failed sign-in attempts` 與 `Retry-After` 標頭。這也包括正確密碼、`UI_USERNAME`/`UI_PASSWORD`，以及在表單中輸入的 master key。被拒絕的嘗試不會延長封鎖時間。如果您被封鎖且無法等待，master key 仍可作為 API 的 bearer token 使用，而登入限制不會涵蓋這一點。

當 proxy 有 Redis 時，計數器會儲存在 Redis 中，因此封鎖會套用到所有 worker 和 pod。沒有 Redis 時，每個 worker 都會自行計數，因此有效上限是設定值乘以 worker 數量；proxy 會在啟動時警告這一點。若 Redis 無法連線，proxy 會退回到每個 worker 各自的計數器，並繼續接受登入。

若要依位址計數，proxy 必須知道哪個位址是 client。將 `general_settings.trusted_proxy_ranges` 設為 LiteLLM 前方的 load balancer 或 ingress 之 CIDR 範圍；此時 client 會是落在這些範圍之外的第一個 `X-Forwarded-For` 跳點。如果 client 直接連到 LiteLLM，請將其設為 `[]`，如此就會使用對等端位址，並忽略 `X-Forwarded-For`。如果未設定，proxy 無法區分 client 與共用 ingress，因此會在啟動時警告，且只強制套用每個使用者名稱的限制。IPv6 位址會依 /64 分組。

```yaml
general_settings:
  trusted_proxy_ranges: ["10.0.0.0/8"]        # or [] when clients connect directly
  max_failed_login_attempts_per_source: 10    # default; the per-username allowance is half of this
  failed_login_window_seconds: 60             # default
  failed_login_block_seconds: 300             # default
  max_failed_login_attempts_per_source_overrides:
    "203.0.113.7": 50                         # a NAT gateway many admins share; 25 per username there
    "192.0.2.0/24": 100                       # the most specific match wins
    "198.51.100.4": 0                         # 0 exempts this address from both limits
```

覆寫會提高該位址的兩個限制，因為每個使用者名稱的可用次數會跟隨位址限制，而 `0` 會完全豁免該位址。`LITELLM_DISABLE_LOGIN_RATE_LIMIT=true` 會在所有地方關閉此限制；它只會在啟動時讀取一次。請參閱 [安全最佳實務](./security_best_practices#limit-failed-admin-ui-sign-in-attempts) 以了解這些預設值背後的理由。

## 邀請其他使用者 {#invite-other-users}

允許其他人建立/刪除自己的金鑰。

[**前往這裡**](./self_serve.md)

## 模型管理 {#model-management}

Admin UI 提供以下模型管理功能：

- **新增模型**：無需重新啟動 proxy，即可透過 UI 新增模型
- **AI Hub**：將模型和代理程式公開，讓開發者探索可用項目
- **價格資料同步**：透過從 GitHub 同步，讓模型定價資料保持最新

如需模型管理的詳細資訊，請參閱 [模型管理](./model_management.md)。

如需關於共享模型和代理程式的資訊，請參閱 [AI Hub](./ai_hub.md)。

:::tip[同步模型定價資料]
[從 GitHub 同步模型定價資料](./sync_models_github.md)，讓您的模型成本資訊保持最新。
:::

## 停用 Admin UI {#disable-admin-ui}

在您的環境中設定 `DISABLE_ADMIN_UI="True"` 以停用 Admin UI。

如果您的資安團隊對 UI 使用有額外限制，這會很有用。

**預期回應**

<Image img={require('../../img/admin_ui_disabled.png')} dark={require('../../img/admin_ui_disabled_dark.png')} alt="Admin UI Disabled message" />
