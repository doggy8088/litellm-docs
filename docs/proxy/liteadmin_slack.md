---
title: Set up the LiteAdmin Slack app
sidebar_label: 設定 Slack app
description: 在 Slack 中安裝 LiteAdmin，部署 Enterprise worker 或獨立 agent，並連接您自己的 LiteLLM 管理員帳戶。
toc_max_heading_level: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 設定 LiteAdmin Slack app {#set-up-the-liteadmin-slack-app}

使用 **LiteAdmin**，可透過 Slack DM 詢問團隊、預算、模型與支出。每位管理員都會連接自己的 LiteLLM 帳戶

先安裝 Slack app，然後從下方選擇一種部署方式。**Enterprise** 使用隨您的 gateway 一起封裝的 worker 及其既有的 SSO。**Standalone** 會執行一個獨立的 agent 服務，並使用自己的 HTTPS 位址與登入設定

若要將 Claude Code 或 Codex 連接到 Enterprise 部署上的 MCP endpoint，請參閱 [在 Enterprise 上部署 LiteAdmin MCP](./liteadmin_mcp_enterprise.md)。該指南涵蓋 `/admin/mcp` 在整合式與組件化映像中的設定；本頁面則設定 Slack agent worker

## 開始之前 {#before-you-start}

您需要一個可正常運作的 LiteLLM gateway，具備 HTTPS、資料庫，以及每位可連接的管理員都能使用的工具呼叫模型。每位使用者都需要一個啟用中的 [`proxy_admin` 帳戶](./access_control.md#global-proxy-roles)，其電子郵件需與 Slack 個人資料相符。您也需要有權限在您的工作區中建立並安裝 Slack app

請為每個 Slack app、工作區與 gateway 執行一個 worker，並具備持久儲存與對外 Slack WebSocket 存取。請使用不含 URL 子路徑的 HTTPS origin。Enterprise 部署另外需要有效授權，以及 [在 gateway 上已設定 SSO](./admin_ui_sso.md)

## 1. 建立並安裝 Slack app {#2-create-and-install-the-slack-app}

每個環境請使用獨立的 Slack app，例如用於測試的 **LiteAdmin Dev**

1. 開啟 [Slack 的 app dashboard](https://api.slack.com/apps)，選擇 **Create New App**，接著選擇 **From a manifest**，然後選取您的工作區
2. 貼上以下 JSON manifest。視需要變更 app 名稱，檢閱權限，然後建立 app
3. 在 **Basic Information** 下方，開啟 **App-Level Tokens**。產生名為 `liteadmin-socket`、具備 `connections:write` scope 的 token。將 `xapp-…` 值儲存為 `SLACK_APP_TOKEN`
4. 在 **OAuth & Permissions** 下方，選擇 **Install to Workspace** 並核准安裝。將以 `xoxb-` 開頭的 **Bot User OAuth Token** 儲存為 `SLACK_BOT_TOKEN`
5. 在 Slack 的網頁應用程式中開啟您的工作區。從 `https://app.slack.com/client/T…/…` 複製以 `T` 開頭的工作區 ID，並將其儲存為 `SLACK_WORKSPACE_ID`

<details>
<summary>用於直接訊息的 Slack app manifest</summary>

```json
{
  "display_information": {
    "name": "LiteAdmin",
    "description": "Ask about your LiteLLM gateway. Send connect in a DM to sign in.",
    "background_color": "#111827"
  },
  "features": {
    "bot_user": {
      "display_name": "LiteAdmin",
      "always_online": false
    },
    "app_home": {
      "home_tab_enabled": false,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "im:history",
        "reactions:write",
        "users:read",
        "users:read.email"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": ["message.im"]
    },
    "socket_mode_enabled": true,
    "org_deploy_enabled": false,
    "token_rotation_enabled": false
  }
}
```

</details>

此 manifest 啟用 Socket Mode、直接訊息事件，以及可寫入的 **Messages** 分頁。此 app 可讀取傳送給它的訊息，並查找與 gateway 帳戶配對所需的 Slack 個人資料電子郵件。Slack 不需要內送事件 webhook；它會透過 worker 的對外連線傳遞訊息

## 2. 部署並連接 {#2-deploy-and-connect}

請選擇一條設定路徑。Enterprise 會以唯讀模式啟動，方便您在允許變更之前先測試查詢

<Tabs groupId="liteadmin-setup" queryString="deployment">
<TabItem value="enterprise" label="Enterprise（建議）" default>

Docker 映像包含 agent 程式碼及其相依項目。您必須先啟用 worker 並安裝 Slack app，任何人才能使用它。Helm 設定 `liteadmin.enabled` 預設為 `false`；一般 gateway 容器不會啟動 worker。請透過您的部署設定啟用它，並具備有效的 Enterprise 授權。儀表板沒有切換開關

gateway 與 worker 會以相同映像中的不同容器執行。Slack 會透過 worker 的對外 Socket Mode 連線傳遞訊息。worker 會使用請求管理員的個人 session 呼叫您的 gateway。您應將 worker 保持私有，並使用 gateway 的 HTTPS 位址進行登入

:::note 可用性

請使用包含 [LiteLLM PR #44444](https://github.com/BerriAI/litellm/pull/44444) 的映像與 chart，以及來自 [Admin Agent PR #18](https://github.com/BerriAI/litellm-admin-agent/pull/18) 的固定版本 worker。較舊的映像與 chart 不包含此整合。下方映像名稱僅為範例，並非已發布的 release tag

:::

### 準備您的 gateway {#1-prepare-your-gateway}

請先準備一個可正常運作的 Enterprise gateway，具備資料庫、HTTPS 位址，以及 [已設定的 SSO](./admin_ui_sso.md)。確認您可以登入其 Admin UI。請使用例如 `https://gateway.example.com` 這類不含 URL 子路徑的 origin

請選擇 gateway 有提供且每位連接的管理員都能存取的工具呼叫模型。請在下方設定中使用其 gateway 模型名稱

每位使用者都需要一個啟用中的 [`proxy_admin` 帳戶](./access_control.md#global-proxy-roles)，其電子郵件需與 Slack 個人資料相符。gateway 會在連接帳戶前檢查 Enterprise 資格與目前管理員權限；worker 也會在允許使用 agent 前檢查資格與身分

請為每個 Slack app、工作區與 gateway 執行一個 worker。允許 worker 對 Slack 的 WebSocket 對外連線，以及從 worker 到 gateway 的 HTTPS 請求。允許 gateway 透過其私有埠 `10000` 存取 worker

### 儲存 worker 的憑證 {#3-store-the-workers-credentials}

請將以下五個值儲存在您的 secret manager 中。請將它們與 gateway 的 master key 與資料庫憑證分開保存

| 設定 | 值 |
| --- | --- |
| `SLACK_BOT_TOKEN` | 已安裝 app 的 `xoxb-…` token |
| `SLACK_APP_TOKEN` | 具備 `connections:write` 的 `xapp-…` token |
| `SLACK_WORKSPACE_ID` | 以 `T` 開頭的工作區 ID |
| `ADMIN_AGENT_SERVICE_TOKEN` | 至少 32 個字元的隨機共享 secret，供 gateway 與 worker 使用 |
| `CREDENTIAL_ENCRYPTION_KEY` | 用於加密已儲存個人 session 的持久 Fernet key |

使用 `openssl rand -hex 32` 產生服務 token。若要在已安裝 Python `cryptography` 套件的機器上產生加密金鑰，請執行：

```bash
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
```

請將產生的值儲存在您的 secret manager 中。升級時請保留加密金鑰與 worker state volume，以便 worker 讀取已儲存的連線。請勿將憑證放在原始碼管理系統或 Slack 訊息中

### 啟用 worker {#4-enable-the-worker}

請選擇您已用於 gateway 的部署方式。兩個範例都會以 **唯讀模式** 啟動，因此 agent 可以在不變更 gateway 資源的情況下回答查詢

<Tabs groupId="liteadmin-native-deployment">
<TabItem value="helm" label="Kubernetes / Helm" default>

請使用包含此整合的 LiteLLM checkout 中的 `helm/litellm-helm` chart。請保留您現有的 gateway values，包括 Enterprise 授權、資料庫與 SSO 設定

透過您平常的 secret 管理流程，在 gateway 的 namespace 中建立名為 `liteadmin-slack` 的 Secret。它必須包含上方 **儲存 worker 的憑證** 中的五個設定。若為手動安裝，請只將這些設定儲存在私有的 `liteadmin-secrets.env` 檔案中，然後執行：

```bash
chmod 600 liteadmin-secrets.env
export LITELLM_NAMESPACE=litellm
kubectl --namespace "$LITELLM_NAMESPACE" create secret generic liteadmin-slack \
  --from-env-file=liteadmin-secrets.env
```

請使用您實際的 namespace。若 Secret 已存在，請透過管理它的系統更新，並保留其加密金鑰

新增一個 `liteadmin-values.yaml` 檔案：

```yaml title="liteadmin-values.yaml"
image:
  repository: registry.example.com/your-team/litellm
  tag: native-slack

liteadmin:
  enabled: true
  gatewayUrl: https://gateway.example.com
  model: your-tool-capable-model
  existingSecret: liteadmin-slack
  storageSize: 1Gi
  readOnly: true
```

請將映像替換為包含此整合的 build。將 `gatewayUrl` 與 `model` 設為您的 gateway URL 與模型名稱。若您的叢集需要特定的儲存類別，請在 `liteadmin` 下使用 `storageClassName`

將設定套用到您現有的 release。請將 `litellm` 替換為您的 release 名稱，並將 `gateway-values.yaml` 替換為您已使用的 values 檔案：

```bash
export LITELLM_RELEASE=litellm
helm dependency build ./helm/litellm-helm
helm upgrade "$LITELLM_RELEASE" ./helm/litellm-helm \
  --namespace "$LITELLM_NAMESPACE" \
  -f gateway-values.yaml \
  -f liteadmin-values.yaml
```

此 chart 會啟動一個 worker，搭配私有的 ClusterIP Service 與 persistent volume claim。它會設定 gateway 的 worker 位址，並只與 gateway replicas 共用 `ADMIN_AGENT_SERVICE_TOKEN`。worker 會接收自己的 Secret，不含 gateway master key 或資料庫憑證

Gateway autoscaling 不會擴縮 worker。請將 worker 維持為 1 個副本，並讓其 Service 保持私有。變更 worker Secret 值後，請重新啟動 worker 以載入設定；變更共享服務 token 也需要重新啟動 gateway

</TabItem>
<TabItem value="compose" label="Docker Compose">

從包含此整合的 LiteLLM checkout 中，建置映像或使用包含它的已發布 build：

```bash
docker build -t litellm-native-admin:local .
```

保留您現有的閘道 `.env` 和 Compose 設定，包括其授權、資料庫、模型與 SSO 設定。將 worker 設定儲存在另一個私密檔案中：

```dotenv title="liteadmin.env"
LITELLM_IMAGE=litellm-native-admin:local
LITELLM_PUBLIC_URL=https://gateway.example.com
LITELLM_ADMIN_MODEL=your-tool-capable-model
SLACK_BOT_TOKEN=your-installed-bot-token
SLACK_APP_TOKEN=your-socket-mode-app-token
SLACK_WORKSPACE_ID=your-workspace-id
ADMIN_AGENT_SERVICE_TOKEN=your-generated-service-token
CREDENTIAL_ENCRYPTION_KEY=your-generated-fernet-key
ADMIN_READ_ONLY=true
```

將預留位置替換為您的閘道設定以及您先前儲存的密鑰。閘道與 worker 使用相同的服務權杖；overlay 會從此檔案讀取兩者

使用額外的 Compose 檔案啟動閘道與 worker：

```bash
chmod 600 liteadmin.env
docker compose --env-file .env --env-file liteadmin.env \
  -f docker-compose.yml -f docker-compose.liteadmin.yml up -d
```

使用 Docker Compose v2。將 worker 憑證保留在 `liteadmin.env`；基礎閘道設定會載入其自己的 `.env`。overlay 會以 `--admin-agent` 啟動相同映像、在閘道上設定私有 worker 位址，並建立 `liteadmin_state` 磁碟區。它不會公開任何 worker 連接埠

在閘道前方保留您現有的 HTTPS 反向代理。變更 worker 設定後，請重新執行 Compose 指令，讓容器接收新值

</TabItem>
</Tabs>

### 驗證 worker {#5-verify-the-worker}

對於 **Helm**，請在您的命名空間中找到 worker Deployment。其名稱以 `-liteadmin` 結尾：

```bash
kubectl --namespace "$LITELLM_NAMESPACE" get deployments
export LITEADMIN_DEPLOYMENT=litellm-liteadmin
kubectl --namespace "$LITELLM_NAMESPACE" rollout status \
  "deployment/$LITEADMIN_DEPLOYMENT" --timeout=180s
kubectl --namespace "$LITELLM_NAMESPACE" exec \
  "deployment/$LITEADMIN_DEPLOYMENT" -- \
  /opt/liteadmin/bin/python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:10000/readyz').read().decode())"
```

將 `LITEADMIN_DEPLOYMENT` 替換為 `get deployments` 顯示的名稱；chart 名稱覆寫可能會變更它。預期會有一個就緒的 worker 和 `{"status": "ready"}`

對於 **Docker Compose**，在 worker 內執行相同的就緒檢查：

```bash
docker compose --env-file .env --env-file liteadmin.env \
  -f docker-compose.yml -f docker-compose.liteadmin.yml \
  exec liteadmin /opt/liteadmin/bin/python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:10000/readyz').read().decode())"
```

預期為 `{"status": "ready"}`。啟用 Slack 後，就緒檢查會檢查狀態資料庫與 Slack socket。請完成下一步以驗證登入、模型存取以及管理工具請求

### 連結您的帳戶並測試請求 {#6-connect-your-account-and-test-a-request}

1. 在 Slack 的 **Apps** 中開啟 **LiteAdmin**，或開啟您在 manifest 中選擇的名稱，並在 DM 中傳送 `connect`
2. 在十分鐘內開啟私人連結。它應使用您閘道的 HTTPS 位址
3. 透過您平常的 LiteLLM 登入方式登入。如果您已經有有效的瀏覽器工作階段，請前往連結頁面
4. 檢查頁面上的電子郵件，並選取 **Connect account**。預期會顯示 **Account connected**
5. 返回 Slack 並詢問：**What is my current LiteLLM role? Use the gateway to verify it**

預期會收到回覆，確認 `proxy_admin`。接著您可以詢問 **List my teams and their current budgets**。worker 會使用您的個人工作階段進行模型請求與管理操作，並驗證您的 Slack 身分與目前的閘道權限

連結會在十分鐘後過期，且只能使用一次。個人工作階段最長可維持 24 小時。當您的工作階段到期時，請再次傳送 `connect`，或傳送 `disconnect` 以刪除 worker 已儲存的連結並使待處理連結失效。斷開連結不會撤銷閘道上的已匯出憑證；該憑證會維持其自身的到期時間

### 在測試後允許變更 {#allow-changes-after-testing}

上述範例設定為唯讀模式。若要允許已連結的管理員變更金鑰、團隊、模型或預算，請在 Helm 中設定 `liteadmin.readOnly: false`，或在 Compose 中設定 `ADMIN_READ_ONLY=false`，然後再次套用部署

選擇您打算進行的一項變更，並在閘道中驗證結果。若省略唯讀設定，組態預設會允許寫入；如果此部署只應回應查詢，請保留明確的 `true` 值

### 將現有應用程式移轉到 Enterprise worker {#existing-liteadmin-installations}

此部署使用 [LiteLLM Admin Agent](https://github.com/BerriAI/litellm-admin-agent) 程式碼，並採用 `native` 驗證模式。獨立的 Slack 應用程式有自己的 worker 與已儲存連結。您現有的獨立應用程式會繼續使用其設定的後端

若要重用現有的 Slack 應用程式，請先停止其舊 worker，再使用該應用程式的憑證啟動捆綁的 worker。針對那些憑證只執行一個 worker。請使用者再次傳送 `connect` 以建立原生閘道工作階段。在完成移轉前，請保留舊部署的狀態與加密金鑰

原生模式使用閘道的連結頁面與既有的 SSO 組態。您不需要設定代管的 `/register`、`/authorize` 或 `/token` 回呼，也不需要新增第二個身分提供者用戶端

</TabItem>
<TabItem value="standalone" label="獨立">

將 [LiteLLM Admin Agent](https://github.com/BerriAI/litellm-admin-agent) 部署為具有自己 HTTPS 位址與登入設定的獨立服務。於本機設定指令使用 Python 3.12，並搭配 Docker Compose 或具有持久化儲存空間的付費 Render 服務。{/* keep-python-version */}

此應用程式會捆綁固定版本的 [Admin MCP connector](./liteadmin_mcp.md)，並以請求使用者的憑證啟動它。您不需要在閘道中註冊 MCP 伺服器或部署另一個 connector

### 建立您的設定 {#1-create-your-configuration}

```bash keep-python-version
git clone https://github.com/BerriAI/litellm-admin-agent.git
cd litellm-admin-agent
python3.12 -m venv .venv
source .venv/bin/activate
pip install --require-hashes -r requirements.txt
python setup_env.py
```

這些指令使用 macOS/Linux shell。開啟產生的 `.env` 檔案以輸入您的設定。如果您已經有一個，請編輯它，不要重新執行設定腳本。

將產生的 `CREDENTIAL_ENCRYPTION_KEY` 儲存在您的密鑰管理器中，並在升級期間保留它。應用程式需要相同的金鑰來讀取已儲存的連結。請讓 `.env` 保持私密，並同時保留產生的 `ADMIN_AGENT_SERVICE_TOKEN`。

將上方安裝中的三個 Slack 值加入 `.env`：`SLACK_APP_TOKEN`、`SLACK_BOT_TOKEN` 和 `SLACK_WORKSPACE_ID`

### 選擇您的閘道與登入方式 {#3-choose-your-gateway-and-login-method}

在 `.env` 中編輯這些項目，並保留產生的密鑰不變：

```dotenv title=".env"
LITELLM_BASE_URL=https://gateway.example.com/v1
LITELLM_MODEL=your-gateway-model-name
CONNECTION_AUTH_MODE=api_key
AGENT_PUBLIC_URL=https://admin.example.com
```

將 `LITELLM_MODEL` 設為您的閘道公開的模型名稱，且每位已連結的管理員都可使用。將 `AGENT_PUBLIC_URL` 設為應用程式的 HTTPS 來源，不含路徑。若使用 Render，請在收到部署 URL 後將其填入您的本機副本。

將 `api_key` 用於個人金鑰登入。使用者在 Slack 中傳送 `connect` 後，會在私密瀏覽器頁面輸入其金鑰。**請勿將閘道金鑰留在 Slack 訊息中。** 若使用瀏覽器 SSO，請在將 `CONNECTION_AUTH_MODE` 變更為 `sso` 之前，先參閱 [選用：SSO 登入](#optional-sso-login)。

您可為此部署選擇一種登入方式。每位 Slack 使用者都使用自己的帳戶登入；agent 會使用該使用者的憑證進行模型請求與管理操作。

### 部署應用程式 {#4-deploy-the-app}

<Tabs groupId="liteadmin-hosting">
<TabItem value="docker" label="Docker Compose" default>

將 `AGENT_PUBLIC_URL` 設為您計畫使用的 HTTPS 位址，然後執行：

```bash
python doctor.py --offline
docker compose up -d --build
```

離線檢查會在部署前驗證組態。Compose 會將應用程式繫結到 `127.0.0.1:10000`，並將狀態儲存在 `admin-state` 磁碟區中。

將您的網域指向該主機並設定 HTTPS 反向代理。若在同一主機上使用 Caddy：

```caddyfile
admin.example.com {
    reverse_proxy 127.0.0.1:10000
}
```

如果反向代理執行於另一個容器或另一台主機上，請設定共用的私人網路，並轉送到應用程式可達的私人位址。

在重新啟動與升級期間，請保留 `admin-state` 磁碟區與加密金鑰。針對此 Slack 應用程式只執行一個容器。

</TabItem>
<TabItem value="render" label="Render">

從 [agent repository](https://github.com/BerriAI/litellm-admin-agent) 或您的 fork 建立 Render **Blueprint**。使用其 [`render.yaml`](https://github.com/BerriAI/litellm-admin-agent/blob/main/render.yaml)、具有持久化磁碟的付費方案，以及一個執行個體。

當 Render 提示時，請輸入以下設定：

| 設定 | 值 |
| --- | --- |
| `LITELLM_BASE_URL` | 您的閘道 URL，例如 `https://gateway.example.com/v1`。 |
| `LITELLM_MODEL` | 您閘道的工具呼叫模型名稱。 |
| `SLACK_APP_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_WORKSPACE_ID` | 來自您 Slack 安裝的值。 |
| `CONNECTION_AUTH_MODE` | `api_key`，或在完成下方 SSO 要求後設定為 `sso`。 |
| `CREDENTIAL_ENCRYPTION_KEY` | 由 `setup_env.py` 產生的金鑰。請在後續部署中保留它。 |
| `ADMIN_TOOL_NAMES` | 對所有可用且已審核的工具保持空白，或設定允許清單。 |

Blueprint 會建立狀態磁碟與服務權杖。它會使用 Render 的外部 URL 作為應用程式來源。部署後，請將該 HTTPS URL 複製到您的本機 `.env` 中，並設為 `AGENT_PUBLIC_URL`，讓預檢檢查相同位址。若您使用自訂網域，也請在 Render 的環境中設定 `AGENT_PUBLIC_URL`。

保留產生的服務權杖以供選用的閘道代理程式註冊。Slack 使用不需要該註冊。若要稍後變更登入方式，請更新 **Environment** 下的 `CONNECTION_AUTH_MODE` 並重新部署。

</TabItem>
</Tabs>

### 檢查部署 {#5-check-the-deployment}

在您的本機設定環境中，將 `LITELLM_SETUP_KEY` 設為您的個人 proxy-admin 金鑰，然後執行：

```bash
export LITELLM_SETUP_KEY='<your-personal-proxy-admin-key>'
python doctor.py
unset LITELLM_SETUP_KEY
```

preflight 會檢查您的閘道身分、模型可見性、MCP 工具探索，以及 Slack 設定。它不會呼叫模型、變更閘道狀態，或傳送 Slack 訊息。請將設定憑證保留在已部署的服務之外，並在檢查後移除任何已儲存的副本。

您也可以在已部署的 URL 上檢查 readiness：

```bash
curl --fail https://admin.example.com/readyz
```

請使用您自己的應用程式 URL。成功的 readiness 檢查會確認資料庫與 Slack socket 已就緒；下方的 Slack read 請求會驗證代理程式對話。

### 在 Slack 中連接您的帳戶 {#6-connect-your-account-in-slack}

1. 在 Slack 的 **Apps** 下開啟 **LiteAdmin**，或您選擇的名稱，並在 DM 中傳送 `connect`。
2. 在十分鐘內開啟私人連線連結。
3. 在瀏覽器頁面上輸入您的個人 proxy-admin 金鑰，或在您的部署使用 SSO 時完成 SSO。
4. 返回 Slack 並詢問：**「列出我的團隊及其目前預算。」**

在讀取成功後，請嘗試您打算進行的變更，例如「為 Engineering 建立一個金鑰，月預算為 100 美元。」預設設定允許已連接的管理員進行寫入。使用 [唯讀模式](#optional-restrict-tools) 可將應用程式限制為查詢。

個人金鑰連線會在 24 小時後過期；SSO 連線則遵循閘道權杖的到期時間。閘道到期或撤銷可能會更早終止存取。再次傳送 `connect` 以登入。傳送 `disconnect` 可移除您已儲存的連線；若您也想使其失效，請在 LiteLLM 中撤銷該憑證。

### 選用：限制工具 {#optional-restrict-tools}

在 `.env` 或 Render 的環境中設定這些變數，然後重新部署：

| 變數 | 效果 |
| --- | --- |
| `ADMIN_READ_ONLY=true` | 將代理程式限制為查詢。使用者仍需要 `proxy_admin`。 |
| `ADMIN_TOOL_NAMES=list_keys,list_teams` | 僅公開這些標準連接器工具。 |

空白的 `ADMIN_TOOL_NAMES` 允許閘道上所有已審核且可用的工具，但仍受唯讀模式限制。若明確指定的工具不可用，應用程式會停止該請求。若要建立模型，也請遵循 [閘道先決條件](./liteadmin_mcp.md#add-a-model-deployment)。

### 選用：SSO 登入 {#optional-sso-login}

您的閘道必須已設定 SSO 提供者，並支援託管的 **proxy API** 授權碼流程：`/register`、採用 S256 PKCE 的 `/authorize`，以及 `/token`。支援情況取決於已安裝的閘道版本。啟用此模式前，請先檢查 [代理程式的相容性需求](https://github.com/BerriAI/litellm-admin-agent/blob/main/docs/compatibility.md#optional-browser-sso)。

在 **gateway** 上，目前沒有任何設定可讓應用程式的託管回呼通過。LiteLLM 目前僅接受 proxy API 授權的迴圈回送 `redirect_uri` 值，因此 `/authorize` 會以 `400 invalid_request` 與 `a proxy-API grant may only redirect to a loopback address` 拒絕 `https://admin.example.com/oauth/callback`。`MCP_TRUSTED_REDIRECT_ORIGINS` 僅涵蓋 MCP OAuth，且不會改變這點。在您的閘道版本接受託管的 proxy API 回呼之前，請使用 `api_key` 模式。應用程式會使用您的閘道 SSO 提供者，不需要額外的 Google 或 Okta client secret。

在 **agent** 上，設定 `CONNECTION_AUTH_MODE=sso` 並重新部署。驗證完整流程：傳送 `connect`、登入、返回瀏覽器頁面，然後在 Slack 中發出讀取請求。如果您的閘道不具備此流程，請改為設定 `api_key` 模式；應用程式不會自行切換模式。

### 選用：使用託管 Admin MCP {#optional-use-a-hosted-admin-mcp}

將 `ADMIN_MCP_URL` 保持空白即可使用內建連接器。若要使用 [託管連接器](./liteadmin_mcp.md#host-a-shared-mcp-endpoint)，請設定：

```dotenv
ADMIN_MCP_URL=https://admin-mcp.example.com/mcp
```

請使用您操作且信任的連接器，並將其配置為相同的閘道。代理程式會將每位請求使用者的閘道 bearer 憑證傳送給它。託管連接器本身的工具限制也同樣適用。

</TabItem>
</Tabs>

## 疑難排解 {#troubleshooting}

| 症狀 | 要檢查的內容 |
| --- | --- |
| Slack 中沒有回應 | 確認已安裝到預期的工作區、Socket Mode、可寫入的 Messages 分頁，以及 `message.im` 事件。檢查 worker 就緒狀態與對外 Slack 連線 |
| worker 在啟動時失敗 | 檢查 Slack 憑證、服務權杖、加密金鑰、模型、閘道 URL，以及可寫入的持久性儲存體 |
| readiness 回傳 503 | 檢查應用程式權杖的 `connections:write` 範圍、對外 WebSocket 存取，以及狀態資料庫 |
| Enterprise 連線頁面回傳 404 | 確認閘道映像檔包含此整合，且已設定 `LITELLM_ADMIN_AGENT_URL` |
| Enterprise 連線頁面回傳 403 | 檢查 Enterprise 權益、目前的 `proxy_admin` 角色、閘道與 Slack 電子郵件是否一致，以及 HTTPS origin |
| Enterprise 連線頁面回傳 410 | 連結已過期、已被使用，或已失效。傳送 `connect` 以取得新連結 |
| Enterprise 連線頁面回傳 503 | 檢查私人 worker 位址、閘道到 worker 的存取、相符的服務權杖，以及閘道資料庫 |
| 獨立連線遭拒 | 檢查目前的 `proxy_admin` 角色、個人金鑰所有權、模型存取權，以及與 Slack 的電子郵件是否匹配 |
| 獨立連線頁面拒絕該 session | 在單一瀏覽器中使用新的連結。檢查 HTTPS 與 `AGENT_PUBLIC_URL`，其不得有子路徑 |
| 獨立 SSO 回呼失敗 | 顯示代理 API 授權只能重新導向到迴圈回送位址的 `400`，表示閘道版本不接受託管回呼；請使用 `api_key` 模式 |
| 連線成功但請求失敗 | 確認管理員可使用已設定的模型，且 worker 可透過 HTTPS 連到閘道。對於獨立部署，執行 `doctor.py` 並檢查 `ADMIN_TOOL_NAMES` |
| 變更被拒絕 | 檢查 `liteadmin.readOnly` 或 `ADMIN_READ_ONLY` 以及任何託管連接器限制。Enterprise 範例以唯讀模式開始 |
| 變更逾時 | 在重試前檢查閘道資源。逾時不會撤銷已完成的操作 |

請參閱 [代理程式作業指南](https://github.com/BerriAI/litellm-admin-agent/blob/main/docs/operations.md) 以了解備份與升級。[Gateway Agents / A2A 註冊](https://github.com/BerriAI/litellm-admin-agent/blob/main/docs/compatibility.md#optional-gateway-agents--a2a) 對於獨立 Slack 使用是選用的
