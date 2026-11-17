---
title: Open WebUI 組織版 (SSO, Teams, Skills, Artifacts)
sidebar_label: Open WebUI 組織版
description: 在 LiteLLM 之上為組織部署 Open WebUI，作為 Claude 與 ChatGPT 桌面應用程式的內部替代方案，具備單一登入、由 LiteLLM JWT 驗證已登入使用者的 IdP token、將 IdP 群組對應到 LiteLLM 團隊與組織、依群組的模型存取、預算、skills 與 artifacts。
---

import Image from '@theme/IdealImage';

# Open WebUI 組織版 {#open-webui-for-organizations}

本教學將 Open WebUI 設定為位於 LiteLLM 前方的全公司聊天工作區，適合想要一個受治理的場所讓員工使用 Claude、GPT 與其他模型，而非各自訂閱 Claude 與 ChatGPT 桌面版的組織。員工以您的身分識別提供者（IdP）登入 Open WebUI。Open WebUI 將每位使用者的 IdP 存取 token 轉送給 LiteLLM，LiteLLM 將其作為 JWT 驗證，因此每個請求都會歸屬到真實的人員、其團隊與其組織，模型存取與預算也會依 IdP 群組成員資格而定。不會發放虛擬金鑰，也不會將虛擬金鑰儲存在 Open WebUI 中。

基本的單一金鑰連線請改參閱 [Open WebUI](./openweb_ui.md)。

:::info
LiteLLM JWT 驗證是[企業版功能](https://www.litellm.ai/enterprise)，需要設定 `LITELLM_LICENSE`。本頁的每個步驟都已使用 Open WebUI v0.12.0、Keycloak 26.4 以及 LiteLLM main 與 v1.105.0 進行端到端測試。
:::

## 運作方式 {#how-it-fits-together}

```
Browser ──SSO (OIDC)──> Open WebUI ──Authorization: Bearer <user's IdP access token>──> LiteLLM ──> Anthropic, OpenAI, Bedrock, ...
                                                                                          │
                                         IdP JWKS <── signature, audience, issuer checks ─┘
```

每個物件只存放在一個地方，而 IdP 是誰屬於哪裡的唯一真實來源。

| 概念 | 存放位置 | 控制內容 |
|---|---|---|
| 使用者 | IdP，首次登入時在 Open WebUI 自動建立，首次請求時在 LiteLLM 自動建立 | 支出歸屬、每位使用者的記錄 |
| 群組 | IdP `groups` claim | Open WebUI 群組（模型可見性、skill 分享）與 LiteLLM 團隊（模型存取、預算） |
| 團隊 | LiteLLM，`team_id` 等於 IdP 群組名稱 | 允許的模型、預算、速率限制、記錄 |
| 組織 | LiteLLM，擁有團隊，可選的 `org_id` claim | 跨團隊允許的模型、支出彙總 |
| Skills、artifacts | Open WebUI 工作區 | 依群組分享的可重用指令、渲染的 HTML/SVG/程式碼預覽 |

範例使用 Keycloak，realm 名為 `acme`，有兩個 IdP 群組 `engineering` 與 `data-science`、兩個 LiteLLM 組織 `acme-us` 與 `acme-eu`，以及兩個模型。任何 OIDC 提供者的運作方式都相同（Okta、Microsoft Entra ID、Google Workspace、Auth0）；只有 claim 名稱與主控台步驟不同。

## 步驟 1. 在您的 IdP 中註冊 Open WebUI {#step-1-register-open-webui-in-your-idp}

為 Open WebUI 建立一個機密 OIDC 用戶端（在 Entra ID 中稱為「app registration」，在 Okta 中稱為「Web app」），採用授權碼流程，redirect URI 為 `https://<open-webui-host>/oauth/oidc/callback`。請保留用戶端 ID 與 secret，供步驟 4 使用。

讓存取 token 帶有 Open WebUI 與 LiteLLM 都會讀取的 claims：

| Claim | 值 | 讀取方 |
|---|---|---|
| `email` | 使用者的 email | Open WebUI 帳戶、LiteLLM `user_id` |
| `groups` | 純群組名稱清單，例如 `["engineering"]` | Open WebUI 群組、LiteLLM 團隊 |
| `aud` | 包含專屬 audience，例如 `litellm` | LiteLLM audience 檢查 |
| `org_id`（可選） | 組織 ID，例如 `acme-us` | LiteLLM 組織歸屬 |

在 Keycloak 中，這表示要在用戶端的專屬 scope 上設定三個 mapper：一個 Group Membership mapper，claim 名稱為 `groups`，並關閉「Full group path」；一個 Audience mapper，包含的自訂 audience 為 `litellm`；以及（若您使用 `org_id` claim）一個 User Attribute mapper，將使用者屬性（例如 `org`）對應到 claim `org_id`。三者都要啟用「Add to access token」。Keycloak 24 及之後版本只會輸出在 realm 使用者設定檔中宣告的屬性，因此 `org_id` claim 會無聲無息地缺失，直到您在 **Realm settings > User profile** 中宣告 `org`，或將 **Realm settings > General > Unmanaged Attributes** 設為 Enabled。在 Entra ID 中，將 `groups` 加入為可選 claim（或使用 app roles），並公開一個 API 作為 audience；群組值是物件 ID，除非您輸出名稱，因此請將這些 ID 用作 LiteLLM 團隊 ID，或以 `team_alias_jwt_field` 對應它們。

將存取 token 的有效期設為 15 分鐘以上。Open WebUI 會在 token 距離到期不到 5 分鐘時更新使用者的 token，因此若 token 有效期為 5 分鐘（Keycloak 預設值），它會在每個請求時都更新。

將 `CLIENT_SECRET`、`ALICE_PASSWORD` 與 `BOB_PASSWORD` 設為用戶端 secret 與每位使用者的 Keycloak 密碼。下面的 password-grant 命令需要在 Keycloak 用戶端的 **Capability config** 中啟用 **Direct access grants**。

在繼續之前，先解碼一個 token 以確認 claims：

```bash
ALICE_TOKEN=$(curl -s -X POST https://<idp>/realms/acme/protocol/openid-connect/token \
  -d grant_type=password -d client_id=open-webui -d client_secret=$CLIENT_SECRET \
  -d username=alice@acme.com -d password="$ALICE_PASSWORD" -d scope=openid \
  | jq -r .access_token)

printf '%s' "$ALICE_TOKEN" | cut -d. -f2 | tr '_-' '/+' \
  | awk '{ padding = (4 - length($0) % 4) % 4; printf "%s", $0; for (i = 0; i < padding; i++) printf "="; print "" }' \
  | base64 -d | jq '{iss,aud,email,groups,org_id,exp,iat}'
```

以相同方式設定 `BOB_TOKEN`，使用 `username=bob@acme.com` 與 `$BOB_PASSWORD`。

```json
{
  "iss": "http://keycloak.localhost:8080/realms/acme",
  "aud": ["litellm", "account"],
  "email": "alice@acme.com",
  "groups": ["engineering"],
  "org_id": "acme-us",
  "exp": 1791680573,
  "iat": 1791679673
}
```

password grant 僅供此檢查使用。之後請在該用戶端上停用 direct access grants。

若要在本機以 Docker 測試，請在所有地方都使用 `http://keycloak.localhost:8080` 作為 IdP URL，讓 token issuer 在容器內外保持一致。執行這些命令前，先將 `KC_BOOTSTRAP_ADMIN_PASSWORD` 設為僅供測試的值：

```bash
docker network create owui

docker run -d --name keycloak --network owui --network-alias keycloak.localhost \
  -p 8080:8080 \
  -e KC_HOSTNAME=http://keycloak.localhost:8080 \
  -e KC_HTTP_ENABLED=true \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD \
  quay.io/keycloak/keycloak:26.4 start-dev
```

LiteLLM 與 Open WebUI 必須加入同一個 `owui` 網路，且 Keycloak 的連接埠在容器內外都必須是 8080。這條路徑在 macOS Docker Desktop 上也適用，該環境無法使用 host 網路。

## 步驟 2. 設定 LiteLLM JWT 驗證 {#step-2-configure-litellm-jwt-auth}

啟動 LiteLLM 時請設定 `LITELLM_LICENSE`。若未設定，JWT 驗證會被拒絕，並出現 `JWT Auth is an enterprise only feature`。

```yaml title="config.yaml"
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-5-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-haiku
    litellm_params:
      model: anthropic/claude-haiku-5-5
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "email"
    user_email_jwt_field: "email"
    user_id_upsert: true
    team_ids_jwt_field: "groups"
    org_id_jwt_field: "org_id"
    enforce_team_based_model_access: true
```

```bash
export JWT_PUBLIC_KEY_URL="https://<idp>/realms/acme/protocol/openid-connect/certs"
export JWT_AUDIENCE="litellm"
export JWT_ISSUER="https://<idp>/realms/acme"
litellm --config config.yaml
```

```bash
docker run --rm --network owui -p 4000:4000 \
  -v "$PWD/config.yaml:/app/config.yaml:ro" \
  -e LITELLM_LICENSE -e LITELLM_MASTER_KEY -e DATABASE_URL \
  -e ANTHROPIC_API_KEY -e JWT_PUBLIC_KEY_URL -e JWT_AUDIENCE -e JWT_ISSUER \
  ghcr.io/berriai/litellm:v1.105.0 \
  --config /app/config.yaml
```

`user_id_jwt_field: "email"` 讓 LiteLLM 使用者 ID 成為可讀的 email，而不是 IdP 不透明的 `sub`；`user_id_upsert` 會在首次請求時建立使用者。`team_ids_jwt_field: "groups"` 將 token 中的每個群組都視為候選的 LiteLLM 團隊，而 `enforce_team_based_model_access` 只在其中一個團隊允許所請求的模型時才放行請求。若未設定 `JWT_AUDIENCE` 與 `JWT_ISSUER`，LiteLLM 會接受任何由 IdP 簽署的 token，包括為不相關應用程式簽發的 token，因此兩者都要設定。master key 仍可用於管理 API 呼叫與 Admin UI。LiteLLM 只有在 master key 未設定、為空，或是範例設定中眾所周知的預設值時才拒絕啟動；它不會檢查金鑰長度。請以 `openssl rand -hex 32` 產生隨機值。僅供本機開發時，`LITELLM_DANGEROUSLY_PERMIT_WEAK_OR_UNSET_MASTER_KEY=true` 可覆寫這項檢查。

由其他用戶端簽發、沒有 `litellm` audience 的同一使用者 token 會被拒絕：

```json
{"error": {"message": "Authentication Error, Validation fails: Audience doesn't match", "type": "auth_error", "param": "None", "code": "401"}}
```

身分 claim 對應（包括 `team_alias_jwt_field`）請參閱 [JWT 設定參考](../proxy/jwt_auth_reference.md)。[JWT 權限](../proxy/access_management/jwt_permissions.md) 則涵蓋 `jwt_litellm_role_map` 與 `sync_user_role_and_teams`。

## 步驟 3. 在 LiteLLM 中建立組織與團隊 {#step-3-create-organizations-and-teams-in-litellm}

團隊必須先存在，群組 claim 才能與其相符。請使用 master key 建立它們，並以 IdP 群組名稱作為 `team_id`。相同的物件也可以在 Admin UI 的 **Organizations** 與 **Teams** 下建立。

```bash
export LITELLM=https://litellm.acme.com
export LITELLM_MASTER_KEY="<master-key>"

curl -X POST "$LITELLM/organization/new" -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \
  -d '{"organization_id": "acme-us", "organization_alias": "Acme US", "models": ["claude-sonnet", "claude-haiku"]}'

curl -X POST "$LITELLM/organization/new" -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \
  -d '{"organization_id": "acme-eu", "organization_alias": "Acme EU", "models": ["claude-haiku"]}'

curl -X POST "$LITELLM/team/new" -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \
  -d '{"team_id": "engineering", "team_alias": "Engineering", "organization_id": "acme-us", "models": ["claude-sonnet", "claude-haiku"], "max_budget": 100}'

curl -X POST "$LITELLM/team/new" -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \
  -d '{"team_id": "data-science", "team_alias": "Data Science", "organization_id": "acme-eu", "models": ["claude-haiku"], "max_budget": 50}'
```

依步驟 1 所示設定 `ALICE_TOKEN` 與 `BOB_TOKEN`，然後在引入 Open WebUI 之前，先以真實使用者 token 檢查結果：

```bash
curl -s "$LITELLM/v1/models" -H "Authorization: Bearer $ALICE_TOKEN" | jq -c '[.data[].id]'
# ["claude-sonnet","claude-haiku"]

curl -s "$LITELLM/v1/chat/completions" -H "Authorization: Bearer $BOB_TOKEN" -H "Content-Type: application/json" \
  -d '{"model": "claude-sonnet", "messages": [{"role": "user", "content": "hi"}]}' | jq -r .error.message
# No team has access to the requested model: claude-sonnet. Checked teams={'data-science'}. ...
```

若使用者的 token 中沒有任何群組與 LiteLLM 團隊相符，他們在每次呼叫（包括 `/v1/models`）都會收到 `403 No teams found in token`，因此在 Open WebUI 中看不到任何模型。Open WebUI 管理員也一樣，所以請把管理員也放進一個群組。

`org_id` claim 會依傳送的內容原樣記錄。LiteLLM 不會將它與擁有該團隊的組織核對：位於 `engineering`（由 `acme-us` 擁有）但 token 標示 `org_id: acme-eu` 的使用者仍會被放行，且支出會記到 `acme-eu`。請讓 IdP 屬性與團隊擁有權保持一致；若您不需要從 token 取得組織歸屬，則不要設定 `org_id_jwt_field`。

## 步驟 4. 設定 Open WebUI SSO 與 LiteLLM 連線 {#step-4-configure-open-webui-sso-and-the-litellm-connection}

```bash title="openwebui.env"
WEBUI_URL=https://chat.acme.com
WEBUI_SECRET_KEY=<random string>
ENABLE_OLLAMA_API=false

# LiteLLM connection, authenticated with the signed-in user's IdP token
OPENAI_API_BASE_URL=https://litellm.acme.com/v1
OPENAI_API_KEY=
OPENAI_API_CONFIGS={"0":{"enable":true,"auth_type":"system_oauth"}}

# SSO
ENABLE_OAUTH_SIGNUP=true
OAUTH_MERGE_ACCOUNTS_BY_EMAIL=true
OAUTH_CLIENT_ID=open-webui
OAUTH_CLIENT_SECRET=<client secret>
OPENID_PROVIDER_URL=https://<idp>/realms/acme/.well-known/openid-configuration
OAUTH_PROVIDER_NAME=Acme SSO
OAUTH_SCOPES=openid email profile
DEFAULT_USER_ROLE=user

# Mirror IdP groups into Open WebUI groups on every login
ENABLE_OAUTH_GROUP_MANAGEMENT=true
ENABLE_OAUTH_GROUP_CREATION=true
OAUTH_GROUP_CLAIM=groups
```

```bash
docker run -d --name open-webui -p 3000:8080 --env-file openwebui.env \
  -v open-webui:/app/backend/data ghcr.io/open-webui/open-webui:v0.12.0
```

`auth_type: system_oauth` 是讓這一切運作的關鍵設定。對於每個模型呼叫，Open WebUI 會查找使用者已儲存的 OAuth 工作階段，必要時更新存取 token，並以 `Authorization: Bearer <token>` 傳送給 LiteLLM。您也可以在 UI 的 **Admin Panel > Settings > Connections** 中做相同設定，編輯 LiteLLM 連線並將驗證類型選為 **OAuth**。模型清單是以每位使用者自己的 token 逐一取得的，因此由 LiteLLM 的團隊檢查決定每位使用者的 Open WebUI 能列出哪些模型。

`WEBUI_URL` 必須與使用者在瀏覽器中開啟的 origin 相符，否則 SSO 重新導向會失敗。`DEFAULT_USER_ROLE=user` 讓 SSO 使用者可以立即開始聊天。若未設定，新帳戶會落在 `pending` 狀態，等待管理員核准。在 v0.12.0 上，全新安裝會先顯示 **Get started** 啟動畫面。請點選它，然後使用 SSO 按鈕，而不是 **Create Admin Account**。第一個登入的帳戶會成為 Open WebUI 管理員，因此請先以您的管理員 IdP 帳戶登入。這些變數大多會在首次啟動時保存到 Open WebUI 的資料庫中，因此之後的變更請透過 Admin Panel 進行，除非您重置 volume。

Open WebUI API 金鑰預設為關閉（`ENABLE_API_KEYS`）。這是會保存的設定，因此首次啟動後再變更環境變數不會有任何效果；請在 Admin Panel 設定中啟用 API 金鑰。以 Open WebUI API 金鑰發出的請求沒有 OAuth 工作階段：呼叫者會看到 `400 Model not found`，而 LiteLLM 記錄 `401 No api key passed in`。若使用者的 IdP 工作階段無法再更新，模型呼叫會持續失敗，直到他們重新登入。

## 步驟 5. 在 Open WebUI 中將群組對應到模型與權限 {#step-5-map-groups-to-models-and-permissions-in-open-webui}

IdP 群組只有在至少一位成員登入後，才會出現在 **Admin Panel > Users > Groups** 中。該次登入之後，群組會依 `groups` claim 保持同步，因此請在群組出現後再授與模型存取權。

在管理員授與存取權之前，Open WebUI 會對非管理員使用者隱藏來自連線的模型，即使 LiteLLM 允許也一樣。開啟 **Admin Panel > Settings > Models**，為每個 LiteLLM 模型選取鉛筆圖示，選擇 **Access**，點選 **Add Access**，勾選群組，點選 **Add**，關閉對話框，然後點選 **Save & Update**。授與群組存取後，標籤仍會顯示 **Private**。存取權是逐模型設定的，因此請對每個模型重複此操作，並與 LiteLLM 團隊模型保持一致：`claude-sonnet` 給 `engineering`，`claude-haiku` 給 `engineering` 與 `data-science`。設定完成後，Alice 會看到兩個模型，Bob 只會看到 `claude-haiku`。LiteLLM 仍會強制執行存取控制，因此在 Open WebUI 中分享過廣的模型會收到 LiteLLM 的 403，而不是外洩。

使用同一頁面上的群組權限，決定誰可以建立工作區模型、prompts、knowledge、tools 與 skills。常見的部署方式是讓每位員工使用共享的 skills，並讓一個平台群組負責撰寫它們。

## 步驟 6. 與團隊分享 skills {#step-6-share-skills-with-a-team}

Skills 是可重用的指令集，相當於 Open WebUI 版的 Claude skills 或自訂 GPT 指令。在 **Workspace > Skills** 下，建立一個名為 **Release notes** 的 skill，描述為 `Use when the user asks for release notes or a changelog.`，並附上如下的 Markdown 指令。版本歷史與多檔案 skills 會依 skill 分別保存，skills 也可以從 URL、GitHub 或 ZIP 匯入。

```markdown
# Release notes house style

Always start with the heading `## Acme Release Notes` followed by the version.
Group changes under **New**, **Improved**, and **Fixed**.
End with the line `Questions? Ask in #release-eng`.
```

將其存取權設為 `engineering` 群組。當該群組的使用者要求 release notes 時，模型會看到 skill 的名稱與描述，呼叫內建的 `view_skill` 工具載入它，並依照它執行。使用者也可以在聊天輸入框中明確選取 skill。群組外的使用者永遠看不到這個 skill，只會得到一般性的回答。

<Image img={require('../../img/openwebui_org/skill.png')} />

Skill 探索使用工具呼叫，因此需要具備原生函式呼叫能力的模型（目前所有透過 LiteLLM 的 Claude、GPT 與 Gemini 模型都符合），且模型設定中的 **Skills** 內建工具必須保持啟用。Skill 本體會作為對話的一部分傳送給 LiteLLM，因此會像任何其他 prompt 一樣計費與記錄。探索發生在 Open WebUI 聊天介面的對話中。測試時，直接呼叫 Open WebUI 的 `/api/chat/completions` 並沒有呼叫 `view_skill`，因此不要仰賴 skills 來透過 API 進行腳本化存取。

## 步驟 7. 使用 artifacts {#step-7-use-artifacts}

當回應包含 HTML、SVG 或可渲染的程式碼區塊時，Open WebUI 會在聊天旁邊的 artifact 面板中開啟它，具備跨編輯的版本歷史、複製、下載與全螢幕功能。不需要任何設定。只要提出像「Create a single-file HTML page with a pricing table for three plans」這樣的要求，渲染後的頁面就會出現在右側，後續訊息會產生它的新版本。

<Image img={require('../../img/openwebui_org/artifact.png')} />

Artifacts 會在使用者的瀏覽器中以沙箱化的 iframe 渲染。Admin Panel 中的兩個介面設定決定像 artifacts 這樣的嵌入頁面是否可以執行腳本與開始下載，而 `IFRAME_CSP` 環境變數為它們設定內容安全政策，因此您的資安團隊可以收緊預覽，而不必關閉 artifacts。

## 步驟 8. 驗證歸屬與預算 {#step-8-verify-attribution-and-budgets}

現在每個 Open WebUI 聊天都會以真實的使用者、團隊與組織出現在 LiteLLM 中。在 Admin UI 中，**Logs** 與 **Usage** 可依使用者、團隊與組織篩選，團隊預算會在支出累積時立即生效。

```bash
psql "$DATABASE_URL" -c 'SELECT "user", team_id, organization_id, model_group FROM "LiteLLM_SpendLogs" ORDER BY "startTime" DESC LIMIT 2;'
```

每個聊天會寫入多列支出記錄，因為 Open WebUI 也會以相同的使用者 token 為聊天標題、標籤與後續建議呼叫模型。預設情況下，這些背景呼叫使用該聊天的模型。若要將它們送往較便宜的模型，請在 **Admin Panel > Settings > Interface** 下設定 **Task Model**。

```
bob@acme.com   | data-science | acme-eu | claude-haiku
alice@acme.com | engineering  | acme-us | claude-sonnet
```

在 LiteLLM 中對團隊或組織設定的預算、速率限制、防護欄與記錄回呼，會套用到相符 IdP 群組中的每個人，無需在 Open WebUI 中做任何設定。若要給某個群組一個新模型，將它加入 LiteLLM 團隊，並在 Open WebUI 中授與該群組存取權。若要讓某人離開，請在 IdP 中停用他們。Open WebUI 將無法再更新他們的存取 token，因此目前的 token 到期後，他們的模型呼叫就會停止運作。

## 疑難排解 {#troubleshooting}

| 症狀 | 原因 |
|---|---|
| 一般使用者在 Open WebUI 中看不到模型 | 未在 **Admin Panel > Settings > Models** 中將模型存取權授與他們的群組，或他們的 token 中沒有與 LiteLLM 團隊相符的群組 |
| 所有人都看不到模型，LiteLLM 記錄 `403 No teams found in token` | 存取 token 缺少 `groups` claim，或與任何 LiteLLM `team_id` 都不相符 |
| LiteLLM 記錄 `401 No api key passed in` | 連線的驗證類型不是 **OAuth** |
| Open WebUI API 金鑰請求回傳 `400 Model not found` | Open WebUI API 金鑰沒有 OAuth 工作階段；LiteLLM 記錄 `401 No api key passed in` |
| 新使用者卡在「account activation pending」 | `DEFAULT_USER_ROLE` 未設為 `user` |
| LiteLLM 以 audience 或 issuer 錯誤拒絕 token | `JWT_AUDIENCE` 或 `JWT_ISSUER` 與步驟 1 解碼的 token 不相符 |
| Proxy 在啟動時結束，並顯示 `LiteLLM proxy refused to start: the master key is a publicly known default.` | 設定一個隨機的 `LITELLM_MASTER_KEY` |
| 模型顯示在 Open WebUI 中，但聊天以 403 失敗 | 群組可以在 Open WebUI 中看到該模型，但其 LiteLLM 團隊不允許使用 |
