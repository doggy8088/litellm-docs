import Image from '@theme/IdealImage';

# 外掛程式 {#plugins}

外掛程式可讓外部服務以 LiteLLM UI 側邊欄中的可選模式出現，並與 AI Gateway 並列。每個外掛程式都以自己的後端執行；LiteLLM 會將請求代理到該後端、注入具範圍的憑證，並交給 iframe 一個短期有效的身分聲明，讓使用者不必再次重新驗證。

當您想在 LiteLLM 儀表板下提供內部工具（例如報表 UI、代理程式控制平面、資料標註應用程式），又不想把呼叫者的主金鑰洩漏給該工具時，這就很有用。

<Image img={require('../../img/plugins_dropdown.png')} />

選取外掛程式後，AI Gateway 導覽會改為外掛程式自己的導覽；下方頁面是在 LiteLLM 儀表板框架內載入的 Agent Control Plane 外掛程式。

<Image img={require('../../img/plugins_loaded.png')} />

:::info

自 v1.89.3+ 起可用。

:::

## 快速開始 {#quick-start}

### 1. 在 `config.yaml` 註冊外掛程式 {#1-register-the-plugin-in-configyaml}

```yaml
general_settings:
  master_key: sk-1234
  plugins:
    - name: my-plugin              # unique identifier, no spaces
      display_name: My Plugin      # label shown in the UI dropdown
      url: "https://my-plugin.example.com"
      plugin_key: "sk-plugin-..."  # plugin's own auth credential
```

`plugin_key` 會以 `Authorization: Bearer <plugin_key>` 的形式注入到代理程式轉送至外掛程式的每個請求中。呼叫者的 LiteLLM 憑證會先被移除，因此外掛程式永遠不會收到有效的 LiteLLM API 金鑰。

您也可以透過儀表板在 **Admin Settings > Plugins** 新增外掛程式。適用相同欄位；`plugin_key` 為唯寫，儲存後 API 永遠不會回傳。

<Image img={require('../../img/plugins_add_modal.png')} />

### 2. 實作兩個外掛程式端點 {#2-implement-the-two-plugin-endpoints}

外掛程式服務必須公開兩個公開端點。`GET /api/plugin-manifest` 會回傳 LiteLLM UI 用來繪製側邊欄的外掛程式中繼資料，而 `POST /api/plugin-auth` 會解密 LiteLLM 交給 iframe 的身分聲明，以達成無縫登入。

最小化清單：

```json
{
  "name": "my-plugin",
  "display_name": "My Plugin",
  "version": "1.0.0",
  "nav_items": [
    { "key": "home",    "label": "Home",    "icon": "HomeOutlined",    "path": "/" },
    { "key": "reports", "label": "Reports", "icon": "BarChartOutlined", "path": "/reports" }
  ],
  "capabilities": ["reports", "data"]
}
```

對於 `POST /api/plugin-auth`，iframe 會轉送一個 `session_claim` 密文。代理程式永遠不會與外掛程式分享 `LITELLM_SALT_KEY`；相反地，每個外掛程式都會配置自己的專用金鑰，其衍生方式為 `HMAC-SHA256(LITELLM_SALT_KEY, plugin_name)`。請在代理程式主機上計算一次，然後將結果作為機密交給您的外掛程式（例如，作為 `PLUGIN_AUTH_KEY`）：

```bash
python -c 'import base64,hmac,hashlib,os; \
print(base64.urlsafe_b64encode(hmac.new(os.environ["LITELLM_SALT_KEY"].encode(), b"my-plugin", hashlib.sha256).digest()).decode())'
```

遭入侵的外掛程式若只持有這個具範圍的金鑰，便無法還原 `LITELLM_SALT_KEY`，也無法解密任何其他 LiteLLM 機密。

在外掛程式中解密並驗證聲明：

```python
import json, os, time
from cryptography.fernet import Fernet

_CLAIM_TTL_SECONDS = 30

def plugin_auth(session_claim: str) -> dict:
    cipher = Fernet(os.environ["PLUGIN_AUTH_KEY"].encode())
    claim = json.loads(cipher.decrypt(session_claim.encode(), ttl=_CLAIM_TTL_SECONDS))
    if claim.get("plugin") != "my-plugin":
        raise ValueError("claim audience mismatch")
    if int(claim.get("exp", 0)) < int(time.time()):
        raise ValueError("claim expired")
    return claim
```

聲明負載為 `{ "plugin", "user_id", "user_role", "exp" }`。其中不含任何 LiteLLM bearer token。請從 `user_id` 與 `user_role` 建立外掛程式自己的工作階段，並透過 `/plugin-proxy/<name>/*` 反向代理將 API 呼叫驗證回 LiteLLM，該反向代理會為您注入 `plugin_key`。

## 外掛程式會收到哪些關於使用者的資訊 {#what-the-plugin-receives-about-the-user}

LiteLLM 會轉送刻意極簡的使用者內容。外掛程式永遠看不到呼叫者的電子郵件、金鑰別名、團隊、預算或 bearer token；只會看到一個識別碼和一個角色。

解密後的 `session_claim` 負載精確包含四個欄位：

```json
{
  "plugin": "my-plugin",
  "user_id": "user_abc123",
  "user_role": "proxy_admin",
  "exp": 1750460400
}
```

`plugin` 是簽發該聲明所對應的外掛程式名稱。請務必先確認它與您自己的外掛程式相符，再信任其餘內容，這樣針對某個外掛程式的聲明就不能重放到另一個外掛程式。`user_id` 是呼叫者的 LiteLLM 內部使用者識別碼；如果您需要查詢設定檔資料，請將它作為與 LiteLLM 的 `/user/info` 進行穩定聯結的鍵。`user_role` 是呼叫者的 LiteLLM 角色字串（例如 `proxy_admin`、`internal_user` 或 `internal_user_viewer`）；請將它作為粗略的授權提示，然後執行您自己的檢查。`exp` 是設定為 30 秒後的 Unix 時間戳；Fernet `ttl` 引數本身已會拒絕過期密文，但獨立驗證 `exp` 可捕捉代理程式與外掛程式之間的時鐘偏移。

當代理程式無法解析這些值時（例如未驗證的呼叫者），`user_id` 和 `user_role` 都會預設為 `""`。請將空字串視為未驗證；不要因為缺少角色就授與較高權限。

在每次 `/plugin-proxy/<name>/<path>` 呼叫中，代理程式對外掛程式後端所做的請求，會以兩個標頭轉送相同身分：

```
x-litellm-user-id: user_abc123
x-litellm-user-role: proxy_admin
```

這些標頭僅供資訊用途。外掛程式仍應以自己的工作階段（由已驗證的 `session_claim` 簽發）來驗證請求，而不是依賴無法獨立驗證的標頭。

## iframe 驗證如何運作 {#how-iframe-auth-works}

```
LiteLLM UI
  GET /api/plugins/auth-token        -> { session_claim }
  postMessage({ type:"litellm-auth", session_claim }, pluginOrigin)
       |
       v
Plugin iframe (browser)
  POST /api/plugin-auth { session_claim }
       |
       v
Plugin server
  decrypt(session_claim, PLUGIN_AUTH_KEY) -> { user_id, user_role, exp }
  establish plugin session -> stored in sessionStorage
```

沒有任何 LiteLLM bearer token 會離開代理程式。聲明只傳達呼叫者的身分，且會在 30 秒後過期，因此若發生 `postMessage` 攔截，取得的密文在沒有外掛程式具範圍金鑰的情況下毫無用處。

## 代理路由 {#proxy-routes}

`GET /api/plugins` 會列出已註冊的外掛程式，並針對每個外掛程式回傳 `name`、`display_name` 和 `url`。`plugin_key` 永遠不會回傳；它會保留在伺服器端。呼叫者必須已通過驗證。

`GET /api/plugins/auth-token?plugin_name=<name>` 會為指定外掛程式回傳一個短期有效的加密身分聲明。這需要在代理程式上設定 `LITELLM_SALT_KEY`（否則回應 503），且外掛程式必須已註冊（否則回應 404）。

`ANY /plugin-proxy/{name}/{path}` 是通往外掛程式後端的已驗證反向代理。存取僅限於 `proxy_admin`。

## 反向代理行為 {#reverse-proxy-behaviour}

當管理員（或伺服器對伺服器呼叫者）存取 `/plugin-proxy/<name>/<path>` 時，代理程式會在將請求轉送至外掛程式的 `url` 之前，先在本地驗證呼叫者，然後改寫該請求。

轉送前會移除所有 LiteLLM 憑證標頭。這包括 `Authorization`、`x-api-key`、`API-Key`、`x-goog-api-key`、`Ocp-Apim-Subscription-Key`、`x-litellm-api-key`、任何已設定的 `litellm_key_header_name`，以及 `Cookie`。外掛程式永遠不會收到呼叫者有效的 LiteLLM 金鑰。

接著 `plugin_key` 會以 `Authorization: Bearer <plugin_key>` 的形式注入。這是外掛程式接收到的唯一憑證。

呼叫者身分會以 `x-litellm-user-id` 和 `x-litellm-user-role` 轉送，以便外掛程式執行自己的授權。這些是資訊性提示，而非憑證。

回應會以 `Content-Security-Policy: sandbox` 和 `X-Content-Type-Options: nosniff` 沙箱化，因此由 LiteLLM 來源提供、受外掛程式控制的位元組不會在儀表板上執行。

## 安全檢查清單 {#security-checklist}

在將外掛程式對使用者公開之前，請確認 `LITELLM_SALT_KEY` 已在代理程式上設定且永遠不會與外掛程式分享，確認外掛程式只持有其衍生的 `HMAC(LITELLM_SALT_KEY, plugin_name)` 金鑰（以專用機密方式提供），並確認 `plugin_key` 是專屬於外掛程式、而非您的 LiteLLM 主金鑰之專用憑證。外掛程式的 `POST /api/plugin-auth` 必須同時強制執行聲明的 `plugin` 受眾與 `exp`（30 秒 TTL）。外掛程式應將 `x-litellm-user-id` 和 `x-litellm-user-role` 視為身分提示，而非驗證證明，且外掛程式服務 URL 在正式環境中應使用 HTTPS。
