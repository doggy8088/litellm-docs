---
title: "GitHub Copilot 搭配 LiteLLM：閘道設定"
sidebar_label: "GitHub Copilot"
description: "透過 LiteLLM AI 閘道或 Python SDK 使用 GitHub Copilot 模型，每位使用者使用自己的 Copilot 方案，支援 Chat Completions、Responses 與嵌入。"
---

import Image from '@theme/IdealImage';
import ThemedVideo from '@site/src/components/ThemedVideo';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GitHub Copilot {#github-copilot}

透過 LiteLLM 閘道或 Python SDK 使用 [GitHub Copilot](https://docs.github.com/en/copilot) 模型。LiteLLM 支援 Chat Completions、Responses、Embeddings 與 Anthropic Messages。

個人 Copilot 方案可選擇逐使用者 GitHub OAuth，或為向組織收費的後端服務選擇 [GitHub App 驗證](#github-app-authentication)。您的 GitHub Copilot 方案決定了您可以使用的模型，且每個模型支援特定的端點。請參閱[支援的端點與模型](#supported-endpoints-and-models)

:::tip

LiteLLM 也可使用 Claude 與 ChatGPT (Codex) 訂閱。如需比較這三種訂閱，請參閱 [Claude、Codex 與 Copilot 訂閱](/docs/subscriptions)。

:::

## 設定閘道 {#set-up-the-gateway}

管理員只需新增一次模型與 **Per-user GitHub OAuth** 憑證。之後每位使用者在傳送請求前，先從儀表板連接自己的 GitHub 帳號。

### 1. 管理員：建立憑證 {#1-admin-create-the-credential}

在 LiteLLM 儀表板中開啟 **Models + Endpoints** > **LLM Credentials**，然後點擊 **Add Credential**。將提供者選為 **GitHub Copilot**，並輸入 `github-copilot` 作為 **Credential Name**。在此儀表板流程中，於 **Auth Type** 下選擇 **Per-user GitHub OAuth**。若是服務應用程式，請改選 [GitHub App](#github-app-authentication)。點擊 **Add Credential**

如果您的使用者是在 github.com 登入，請將 **GitHub host** 留空。如果您的企業使用具資料落地（data residency）的 GitHub Enterprise Cloud，請輸入您的 `SUBDOMAIN.ghe.com` 主機，例如 `octocorp.ghe.com`。LiteLLM 隨後會將登入送往 `https://SUBDOMAIN.ghe.com`、將使用者查詢送往 `https://api.SUBDOMAIN.ghe.com`，並僅將模型請求送往 `https://copilot-api.SUBDOMAIN.ghe.com`。每個憑證保留自己的主機，因此單一閘道可同時服務 github.com 憑證與 GHE.com 憑證。GitHub Enterprise Server 主機會被拒絕，因為 GitHub 未在 GitHub Enterprise Server 上提供 Copilot。變更憑證的主機會移除其上的所有使用者連接，因此使用者需在新主機上重新連接。

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_credential.png')} dark={require('../../img/github_copilot_credential_dark.png')} alt="在 LiteLLM 中建立逐使用者 GitHub OAuth 憑證" width={656} height={585} />
</div>

### 2. 管理員：新增模型 {#2-admin-add-the-model}

開啟 **Add Model**，將提供者選為 **GitHub Copilot**，並在 **LiteLLM Model Name(s)** 下挑選模型，例如 `github_copilot/claude-sonnet-5.5`。在 **Model Mappings** 下，將 **Public Model Name** 設為使用者將請求的名稱，例如 `claude-copilot`。在 **Existing Credentials** 下選擇 `github-copilot`，然後點擊 **Add Model**

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_add_model.png')} dark={require('../../img/github_copilot_add_model_dark.png')} alt="在 LiteLLM 中以已儲存的憑證新增 GitHub Copilot 模型" width={1096} height={935} />
</div>

:::note

Claude Code 與 Claude Desktop 僅接受以 `claude-` 或 `anth-` 開頭的模型名稱，因此若您從這些應用程式使用模型，請為其取一個以 `claude-copilot` 開頭的公開名稱。其他應用程式可使用任何喜歡的名稱。

:::

<details>
<summary>使用 config.yaml 新增模型</summary>

如果您在 `config.yaml` 中管理模型，請在儀表板中建立憑證，並從模型參照它：

```yaml showLineNumbers keep-model-ids title="config.yaml"
model_list:
  - model_name: claude-copilot
    litellm_params:
      model: github_copilot/claude-sonnet-5.5
      litellm_credential_name: github-copilot
```

</details>

### 3. 使用者：連接您的 GitHub 帳號 {#3-user-connect-your-github-account}

登入 LiteLLM 儀表板並開啟 **Models + Endpoints** > **LLM Credentials**。在 **Your connections** 下找到 `github-copilot`，然後點擊 **Connect**

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_llm_credentials.png')} dark={require('../../img/github_copilot_llm_credentials_dark.png')} alt="在 LiteLLM 的 Your connections 中連接 GitHub 帳號" width={1096} height={418} />
</div>

LiteLLM 會顯示一組 GitHub 驗證碼。開啟 LiteLLM 顯示的連結（github.com 為 https://github.com/login/device，GHE.com 憑證則為 https://SUBDOMAIN.ghe.com/login/device），輸入驗證碼，並以擁有您 Copilot 方案的 GitHub 帳號核准該請求

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_connect.png')} dark={require('../../img/github_copilot_connect_dark.png')} alt="LiteLLM 中的 GitHub 驗證碼與登入連結" width={504} height={338} />
</div>

當 GitHub 核准請求後，狀態會變更為 **Connected** 並顯示您的 GitHub 使用者名稱。您傳送至此憑證上模型的每個請求，現在都會使用您自己的 Copilot 存取權。如果您尚未連接，或 GitHub 之後拒絕了您已儲存的連接，請求會回傳 401，要求您從此頁面重新連接

這段錄影在儀表板中演示步驟 1 至 3，從建立憑證到 GitHub 驗證碼。

<ThemedVideo
  src={require('../../img/github_copilot_setup_flow.mp4')}
  dark={require('../../img/github_copilot_setup_flow_dark.mp4')}
  poster={require('../../img/github_copilot_setup_flow_poster.png')}
  darkPoster={require('../../img/github_copilot_setup_flow_poster_dark.png')}
  title="操作演示：建立 GitHub Copilot 憑證、新增模型、連接 GitHub 帳號"
/>

### 4. 使用者：傳送請求 {#4-user-send-requests}

將您的應用程式指向閘道，並依您組織設定的方式登入。請求必須來自連接 GitHub 的同一位 LiteLLM 使用者。對於 Claude Code，請將 `ANTHROPIC_BASE_URL` 設為閘道 URL，並將 `ANTHROPIC_MODEL` 設為 `claude-copilot`。對於使用 OpenAI API 的應用程式，請將 base URL 設為 `https://litellm.example.com/v1`（使用您閘道的位址），並將模型設為 `claude-copilot`

```python showLineNumbers title="Send a chat request"
from openai import OpenAI

client = OpenAI(
    base_url="https://litellm.example.com/v1",
    api_key="<your LiteLLM sign-in token>",
)

response = client.chat.completions.create(
    model="claude-copilot",
    messages=[{"role": "user", "content": "Write a Python hello world"}],
)
print(response.choices[0].message.content)
```

## GitHub App 驗證 {#github-app-authentication}

<SinceVersion v="1.111.0" />

設定 `github_copilot_auth_type: github_app`，即可使用 GitHub App 安裝來驗證後端服務。LiteLLM 無需使用者登入即可建立並重新整理安裝權杖。此方式適用於 Chat Completions、Responses、Embeddings 與非同步 Anthropic Messages API，惟仍受各模型的端點支援限制。

建立一個 App，將 **Copilot Requests** 組織權限設為 **Read-only**，並將其安裝在將支付使用費用的組織中。該組織必須允許來自 App 安裝的 Copilot 請求。資格與政策要求請參閱 [GitHub 的 server-to-server 設定](https://docs.github.com/en/copilot/how-tos/copilot-sdk/auth/server-to-server-tokens#other-services-and-ci-systems)。

### 儀表板設定 {#dashboard-setup}

開啟 **Models + Endpoints** > **LLM Credentials** > **Add Credential**。選擇 **Github Copilot**，在 **Auth Type** 下選擇 **GitHub App**，並輸入憑證名稱、App client ID 與 installation ID。github.com 請將 **GitHub host** 留空。

在 **Private key (PEM)** 下，點擊 **Click to Upload**，並選擇從您 GitHub App 的 **Credentials** > **Key pairs** 設定下載的 PEM。點擊 **Add Credential**。每個欄位旁的資訊圖示會說明其值的來源。

<div className="docs-screenshot">
  <Image img={require('../../img/github-copilot-app-after.jpg')} alt="在現有的 LiteLLM 憑證表單中上傳 GitHub App PEM" width={1280} height={842} />
</div>

此流程使用與 Vertex AI 服務帳號憑證相同的檔案上傳與加密憑證儲存流程。它需要已設定的 LiteLLM 資料庫，無需 PEM 掛載或 Enterprise 密鑰管理器整合。儀表板與憑證 API 請使用 HTTPS。瀏覽器會讀取所選檔案以供提交，LiteLLM 會在儲存前加密 PEM。憑證讀回時會被遮罩。表單會顯示已提供金鑰的狀態，但不會顯示已儲存的 PEM。

現有的 proxy 加密金鑰保護已儲存的憑證。請保持 `LITELLM_SALT_KEY` 穩定、高熵、在各 worker 間共用，並與資料庫及備份分開。當未設定 salt key 時，LiteLLM 會改用其 master key。請遵循您部署的憑證加密與備份程序。靜態加密無法防範已遭入侵的執行中 proxy，因為 proxy 必須使用私鑰來簽署 JWT。

開啟 **Add Model**，選擇 **Github Copilot**，並挑選可用的模型。設定其公開模型名稱，並在 **Existing Credentials** 下選擇已儲存的 App 憑證。點擊 **Add Model**。應用程式以其 LiteLLM 虛擬金鑰呼叫此別名。無需個人 GitHub 連接。

以此方式新增的模型僅儲存憑證名稱。刪除其 App 憑證前，請先刪除或重新指派該模型，因為缺少憑證的 GitHub Copilot 模型會使用 proxy 共用的 GitHub Copilot 裝置登入。

為每個 App 建立各自的具名憑證，然後將每個應用程式的模型部署附加到適當的憑證。如需輪換金鑰，請編輯憑證並上傳替代金鑰，然後再於 GitHub 中撤銷舊金鑰。保持上傳金鑰欄位不變即可保留已儲存的金鑰。

對於透過 API 建立的資料庫憑證，表單會顯示 GitHub Copilot 名稱與標誌。您可以編輯其設定，無需再上傳另一個 PEM。已儲存的金鑰或密鑰參照會保持不變。上傳 PEM 會取代任何現有的私鑰密鑰參照。儀表板僅提供檔案上傳，不提供密鑰參照欄位。

<div className="docs-screenshot">
  <Image img={require('../../img/github-copilot-app-edit.jpg')} alt="編輯 GitHub App 憑證，保留其已儲存的金鑰，並提供 PEM 上傳以供替換" />
</div>

### 憑證 API {#credential-api}

管理員可使用 `POST /credentials`，並在 `github_copilot_app_private_key` 中放入 PEM。該端點會先驗證未加密的 RSA 私鑰（至少 2048 位元、最多 16 KiB），再透過 LiteLLM 的憑證加密儲存。私鑰僅可在具名憑證中提供，不可在推論請求本文中提供。

```python title="Create an encrypted App credential"
import os
from pathlib import Path
import httpx

response = httpx.post(
    os.environ["LITELLM_URL"] + "/credentials",
    headers={"Authorization": "Bearer " + os.environ["LITELLM_MASTER_KEY"]},
    json={
        "credential_name": "copilot-service-a",
        "credential_values": {
            "github_copilot_auth_type": "github_app",
            "github_copilot_app_id": os.environ["COPILOT_SERVICE_A_CLIENT_ID"],
            "github_copilot_app_installation_id": os.environ["COPILOT_SERVICE_A_INSTALLATION_ID"],
            "github_copilot_app_private_key": Path(os.environ["COPILOT_PEM_FILE"]).read_text(),
        },
        "credential_info": {"custom_llm_provider": "github_copilot"},
    },
    timeout=30,
)
response.raise_for_status()
```

`COPILOT_PEM_FILE` 是由這位管理員的腳本讀取，而非由 proxy 讀取。透過 `POST /model/new` 或 YAML，將 `litellm_credential_name: copilot-service-a` 附加到部署。如需輪換，請使用 `PATCH /credentials/copilot-service-a`，在 `credential_values` 中放入替代的 `github_copilot_app_private_key`，並帶 `credential_info: {}`。請勿記錄請求本文。

如果憑證使用私鑰密鑰參照，請同時在 PATCH 本文傳送 `credential_values_to_delete: ["github_copilot_app_private_key_ref"]`。儀表板會自動處理此替換。

### 伺服器管理的設定與 SDK 密鑰 {#server-managed-configuration-and-sdk-secrets}

對於完全透過 YAML 或 SDK 管理的部署，密鑰參照仍可使用。儀表板僅使用 PEM 上傳。請將 App 的 RSA PEM 私鑰儲存在密鑰管理器中，或以唯讀方式掛載到 proxy 容器。範例使用位於 `/run/secrets/copilot-service-a.pem` 的掛載密鑰。只有 proxy 服務帳號應能讀取它。請勿將 PEM 內容放入 YAML 與推論請求中。請透過憑證 API 儲存上傳的金鑰，使其經過加密。

```yaml showLineNumbers keep-model-ids title="config.yaml"
credential_list:
  - credential_name: copilot-service-a
    credential_values:
      github_copilot_auth_type: github_app
      github_copilot_app_id: os.environ/COPILOT_SERVICE_A_CLIENT_ID
      github_copilot_app_installation_id: os.environ/COPILOT_SERVICE_A_INSTALLATION_ID
      github_copilot_app_private_key_ref: oidc/file//run/secrets/copilot-service-a.pem
    credential_info:
      custom_llm_provider: github_copilot
  - credential_name: copilot-service-b
    credential_values:
      github_copilot_auth_type: github_app
      github_copilot_app_id: os.environ/COPILOT_SERVICE_B_CLIENT_ID
      github_copilot_app_installation_id: os.environ/COPILOT_SERVICE_B_INSTALLATION_ID
      github_copilot_app_private_key_ref: oidc/file//run/secrets/copilot-service-b.pem
    credential_info:
      custom_llm_provider: github_copilot

model_list:
  - model_name: service-a-copilot
    litellm_params:
      model: github_copilot/claude-sonnet-5.5
      litellm_credential_name: copilot-service-a
      github_copilot_auth_type: github_app
      rpm: 30
      tpm: 30000
  - model_name: service-b-copilot
    litellm_params:
      model: github_copilot/claude-sonnet-5.5
      litellm_credential_name: copilot-service-b
      github_copilot_auth_type: github_app
      rpm: 10
      tpm: 10000

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

`github_copilot_app_id` 接受 App 的 client ID（GitHub 建議用於 JWT），或數字或字串形式的數字 App ID。請使用目標組織的 installation ID，而非 organization ID。請在啟動 proxy 前於環境中設定這些值。

在每個部署及其憑證上都設定 `github_copilot_auth_type: github_app`，可使部署在其具名憑證被刪除或載入失敗時拒絕呼叫。若未設定，缺少憑證的 GitHub Copilot 部署會使用 proxy 共用的 GitHub Copilot 裝置登入，與其他 GitHub Copilot 部署相同。

`github_copilot_app_private_key_ref` 是一個密鑰參照。它接受 `LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS` 內的 `oidc/file/` 路徑（標準容器密鑰目錄，包括 `/run/secrets`，預設允許）、`os.environ/VARIABLE_NAME`，或您已設定的 LiteLLM 密鑰管理器中的密鑰名稱。該參照在驗證執行前一直保持為參照。此參照欄位永不接受內嵌 PEM。對於這種以參照為基礎的設定，請在每個 worker 上佈建密鑰，並讓私鑰遠離用戶端應用程式。內建的外部密鑰管理器整合遵循其現有的 Enterprise 授權。

以 LiteLLM 虛擬金鑰呼叫公開別名。請將每個應用程式的金鑰限制在其自己的模型別名，並指派各自的團隊或金鑰預算以追蹤使用量。App ID 與私鑰參照屬於管理員擁有的設定。請求本文無法選取或取代這些值，且 App 部署會拒絕用戶端 API 金鑰與端點覆寫。

每個部署保留 LiteLLM 的速率限制冷卻與監控行為。執行多個 proxy worker 時，請設定共用的 Redis，使路由計數器得以共用。上述 `rpm` 與 `tpm` 是閘道限制範例，並非 GitHub 配額。分開的 App 可隔離憑證，但不保證組織層級的 Copilot 配額各自獨立。GitHub 將帳務歸屬於安裝所在的組織。請以 GitHub 帳務報告作為帳務依據，並以 LiteLLM 使用記錄將請求歸屬至您的應用程式。

### Python SDK {#python-sdk}

在未使用 proxy extras 的情況下使用 SDK 時，請將 JWT 簽署相依套件與 LiteLLM 一併安裝。

```bash
pip install litellm PyJWT cryptography
```

```python showLineNumbers keep-model-ids
import os
from litellm import completion

response = completion(
    model="github_copilot/claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Reply with OK"}],
    github_copilot_auth_type="github_app",
    github_copilot_app_id=os.environ["COPILOT_SERVICE_A_CLIENT_ID"],
    github_copilot_app_installation_id=os.environ["COPILOT_SERVICE_A_INSTALLATION_ID"],
    github_copilot_app_private_key_ref="oidc/file//run/secrets/copilot-service-a.pem",
)
print(response.choices[0].message.content)
```

將相同的驗證欄位傳給 `acompletion`、`responses`、`aresponses`、`embedding`、`aembedding` 或 `anthropic.messages.acreate`。沒有程序全域的 App 憑證預設值，因此服務可同時傳入不同的 App 設定。

### 權杖生命週期與輪換 {#token-lifecycle-and-rotation}

LiteLLM 簽署短效的 RS256 JWT，並在建立安裝權杖時僅請求 `organization_copilot_requests: read`。GitHub 的權杖端點與 Copilot 端點來自經驗證的 GitHub 主機。驗證請求使用 LiteLLM 的 `ssl_verify` 與 CA bundle 設定，例如 `SSL_VERIFY` 與 `SSL_CERT_FILE`，且不跟隨重新導向。提供者會在外送的模型請求上固定安裝 bearer 權杖與 Copilot SDK 整合 ID。

每個 worker 維護一個有上限的記憶體內權杖快取，並在該 worker 內協調並行重新整理。當剩餘時間少於兩分鐘時，權杖會在下一個請求時重新整理。系統會同時檢查實際到期時間與經過時間。重新整理失敗會回傳經清理的錯誤，且永不改用已儲存的使用者憑證或過期權杖。短暫的失敗冷卻可限制重複的鑄造嘗試，而 GitHub 速率限制回應會產生可重試的速率限制錯誤。當 GitHub 以 HTTP 401、403 或 404 拒絕安裝權杖請求時，呼叫會回傳 401，路由器會冷卻該部署，Prometheus 則將其計為一次部署失敗。

快取會區分主機、App、安裝、密鑰參照與上傳的金鑰內容。上傳替代金鑰後，一旦 worker 載入更新後的憑證，快取身分即隨之改變。已快取的權杖在提供時不會再次讀取密鑰參照，因此輪換後的掛載金鑰或密鑰管理器值會從下一次權杖重新整理起使用（約一小時內），或在 worker 重新啟動後使用。密鑰管理器的快取可能增加該延遲，因此請遵循您後端的快取設定。請先推出替代金鑰，再撤銷舊金鑰。如需立即終止現有的安裝權杖，請使用 GitHub 的撤銷控制並重新啟動 worker，而非僅依賴刪除私鑰。

上傳的私鑰在憑證資料庫中加密，並在載入時保存在程序記憶體中。密鑰參照使用其現有的後端。此驗證流程不會將安裝權杖寫入 LiteLLM 的磁碟權杖儲存、資料庫或 Redis。請保持正式環境的除錯記錄停用，並限制對程序記憶體、掛載密鑰，以及您設定的任何第三方記錄回呼的存取。

預設主機為 `github.com`。`github_copilot_host` 也接受提供者現有的 `SUBDOMAIN.ghe.com` 主機格式。GitHub Enterprise Server 與任意權杖或模型 URL 會被拒絕。此功能的實際驗證使用 github.com。推出前，請確認您的資料落地部署中可使用 App 驗證的 Copilot。

## 自訂 GitHub App 裝置登入 {#custom-github-app-for-device-login}

當您的組織不允許預設的 Copilot 登入 App 時，請將 `GITHUB_COPILOT_CLIENT_ID` 設為您自己的 GitHub App 的用戶端 ID。Copilot 僅在該 App 具備 **Copilot Requests** 組織權限且設為**唯讀**時，才會為自訂 App 的登入提供服務。缺少該權限時，每次模型呼叫都會失敗，即使是能在您的編輯器中運作的模型也一樣。

**1. 開啟您組織的 GitHub Apps 頁面**，網址為 `https://github.com/organizations/<your-org>/settings/apps`，然後在 App 上按一下**編輯**。

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_custom_app_step1.png')} alt="在 GitHub App 上按一下「編輯」" />
</div>

**2. 按一下「權限與事件」。**

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_custom_app_step2.png')} alt="開啟「權限與事件」" />
</div>

**3. 展開「組織權限」，並將 Copilot Requests 設為「存取：唯讀」。**

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_custom_app_step3.png')} alt="將 Copilot Requests 設為唯讀" />
</div>

**4. 按一下「儲存變更」。**

<div className="docs-screenshot">
  <Image img={require('../../img/github_copilot_custom_app_step4.png')} alt="按一下「儲存變更」" />
</div>

**5. 在安裝上接受新權限。**GitHub 會請組織擁有者在 App 的安裝上核准它。在他們核准之前，請求會持續失敗。

Copilot 也會檢查是哪個用戶端傳送了請求。對於自訂 App，請傳送 `copilot-integration-id: copilot-developer-cli`。在仍會傳送 `vscode-chat` 的版本上，請將其加入每個 GitHub Copilot 模型：

```yaml keep-model-ids
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: github_copilot/claude-sonnet-5
      extra_headers:
        copilot-integration-id: copilot-developer-cli
```

LiteLLM 會將 Copilot 工作階段保留最多 24 小時，適用於將其儲存在 `api-key.json` 中的版本。若要立即使用新權限，請刪除 `access-token` 檔案旁邊的那個檔案。某些模型，例如 `claude-opus-4.8`，完全不提供給自訂 App。

## 支援的端點與模型 {#supported-endpoints-and-models}

設定模型時請使用 `github_copilot/` 前綴。對閘道的請求使用公開模型名稱

| 端點 | 範例模型 |
|-------|-------|
| `/v1/chat/completions` | `github_copilot/claude-sonnet-5.5` |
| `/v1/messages` | `github_copilot/claude-sonnet-5.5` |
| `/v1/responses` | `github_copilot/gpt-5.3-codex` 或 `github_copilot/gpt-5.5` |
| `/v1/embeddings` | `github_copilot/text-embedding-3-small` |

這些範例與 LiteLLM 的模型型錄相符。GitHub 控制每個帳號可使用的模型，因此即使閘道已設定某個模型，若該模型不在您的方案內，GitHub 仍會回傳錯誤

如需提供 Responses 或 Embeddings，請以相同的 `github-copilot` 憑證為該端點新增模型，例如 `github_copilot/gpt-5.3-codex` 或 `github_copilot/text-embedding-3-small`

## API 版本 {#api-version}

在閘道或 SDK 程序中設定 `GITHUB_COPILOT_API_VERSION`，即可在每個 Copilot 請求上設定 `x-github-api-version` 標頭。LiteLLM 會在請求時讀取此環境變數。

當該變數未設定、為空或僅包含空白時，LiteLLM 對 Chat Completions、Responses 與 Embeddings 使用 `2025-04-01`，對 `/v1/messages` 使用 `2026-06-01`。

例如，在啟動閘道或您的 SDK 應用程式前設定版本。

```bash
export GITHUB_COPILOT_API_VERSION=2026-08-01
```

## 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

`github_copilot/<family>-latest` 名稱會隨著 LiteLLM 將模型家族移至較新的模型而跟隨，因此您的應用程式可保持單一模型字串。請像使用其他 GitHub Copilot 模型名稱一樣使用它們。LiteLLM 會將目前的目標模型傳送給 GitHub Copilot，並依該模型的價格計費。別名的運作方式與各提供者的完整清單，請參閱[最新模型別名](../model_latest_aliases.md)。

| 別名 | 模型家族 |
| --- | --- |
| `github_copilot/gpt-luna-latest` | GPT Luna |
| `github_copilot/gpt-sol-latest` | GPT Sol |
| `github_copilot/gpt-terra-latest` | GPT Terra |
| `github_copilot/gpt-astra-latest` | GPT Astra |
| `github_copilot/claude-opus-latest` | Claude Opus |
| `github_copilot/claude-sonnet-latest` | Claude Sonnet |
| `github_copilot/claude-haiku-latest` | Claude Haiku |
| `github_copilot/claude-fable-latest` | Claude Fable |
| `github_copilot/grok-latest` | Grok |
| `github_copilot/kimi-latest` | Kimi |

## 搭配 LiteLLM Python SDK 使用 {#usage-with-the-litellm-python-sdk}

依預設，直接 SDK 呼叫在您自己的程序中執行，並以一個 GitHub 帳號登入。對於後端服務，請使用下方的 GitHub App 設定。第一次呼叫會在您的終端機中啟動 GitHub 的裝置流程。LiteLLM 將 GitHub 存取權杖儲存至 `~/.config/litellm/github_copilot/access-token`，並在後續呼叫中重複使用。在閘道上，沒有 **Per-user GitHub OAuth** 或 GitHub App 憑證的模型會使用此共用登入，從閘道主機讀取。直接 SDK 呼叫使用完整模型名稱，包括 `github_copilot/` 前綴

<Tabs>
<TabItem value="chat" label="Chat Completions">

```python showLineNumbers keep-model-ids title="Chat Completions"
from litellm import completion

response = completion(
    model="github_copilot/claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Write a Python hello world"}],
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="streaming" label="Streaming">

```python showLineNumbers keep-model-ids title="Stream a chat response"
from litellm import completion

stream = completion(
    model="github_copilot/claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Write a Python hello world"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
<TabItem value="responses" label="Responses">

```python showLineNumbers keep-model-ids title="Responses"
import asyncio

import litellm


async def main():
    response = await litellm.aresponses(
        model="github_copilot/gpt-5.3-codex",
        input="Write a Python hello world",
        max_output_tokens=500,
    )
    print(response)


asyncio.run(main())
```

</TabItem>
<TabItem value="messages" label="Anthropic Messages">

```python showLineNumbers keep-model-ids title="Anthropic Messages"
import asyncio

import litellm


async def main():
    response = await litellm.anthropic.messages.acreate(
        model="github_copilot/claude-sonnet-5.5",
        messages=[{"role": "user", "content": "Write a Python hello world"}],
        max_tokens=500,
    )
    print(response)


asyncio.run(main())
```

</TabItem>
<TabItem value="embeddings" label="Embeddings">

```python showLineNumbers title="Embeddings"
import litellm

response = litellm.embedding(
    model="github_copilot/text-embedding-3-small",
    input=["good morning from LiteLLM"],
)
print(response)
```

</TabItem>
</Tabs>

### 共享登入於 GitHub Enterprise Cloud (GHE.com) {#shared-sign-in-on-github-enterprise-cloud-ghecom}

如果您的 Copilot 方案來自具資料落地的 GitHub Enterprise Cloud 租戶，請將共用登入指向該租戶。請在第一次呼叫前設定以下兩個變數，並在之後保持設定，因為 LiteLLM 會在每次呼叫時從 `GITHUB_COPILOT_ACCESS_TOKEN_URL` 讀取租戶。如果該變數未設定，或未命名 github.com 或 GHE.com 主機，LiteLLM 會改從 `GITHUB_COPILOT_API_KEY_URL` 讀取租戶；若兩者皆無，則使用 github.com。

<SinceVersion v="1.113.0" />

```bash
export GITHUB_COPILOT_DEVICE_CODE_URL="https://SUBDOMAIN.ghe.com/login/device/code"
export GITHUB_COPILOT_ACCESS_TOKEN_URL="https://SUBDOMAIN.ghe.com/login/oauth/access_token"
```

LiteLLM 隨後會在 `https://SUBDOMAIN.ghe.com` 登入、在 `https://api.SUBDOMAIN.ghe.com/copilot_internal/user` 查詢您的 Copilot API，並將模型請求傳送至 `https://copilot-api.SUBDOMAIN.ghe.com`。如果查詢失敗，或命名了租戶以外的主機，模型請求會在已設定 `GITHUB_COPILOT_API_BASE` 時前往該處，否則前往 `https://copilot-api.SUBDOMAIN.ghe.com`，因此除非您設定了該變數，請求絕不會離開您的租戶。舊的設定方式會將 `GITHUB_COPILOT_API_KEY_URL` 設為 `https://api.SUBDOMAIN.ghe.com/copilot_internal/v2/token`，同樣會選取該租戶，不過 LiteLLM 已不再呼叫該 URL。

若要在閘道上使用此登入，您需要在閘道之外先登入一次，並使用上述變數，因為閘道本身無法執行裝置流程。

```bash
python -c "from litellm.llms.github_copilot.authenticator import Authenticator; Authenticator().get_access_token()"
```

現在請使用相同的兩個變數啟動閘道：`GITHUB_COPILOT_TOKEN_DIR` 指向包含已儲存 `access-token` 檔案的目錄，並搭配一個沒有憑證的模型。

```yaml showLineNumbers keep-model-ids title="config.yaml"
model_list:
  - model_name: claude-copilot
    litellm_params:
      model: github_copilot/claude-sonnet-5.5
```

對 `claude-copilot` 的請求隨後會從 `https://copilot-api.SUBDOMAIN.ghe.com` 回傳模型的回應。

## 環境變數 {#environment-variables}

權杖檔案設定與 `GITHUB_COPILOT_API_BASE` 僅適用於共用登入（直接 Python SDK 呼叫，以及沒有 **Per-user GitHub OAuth** 憑證的閘道模型會使用它）。逐使用者憑證會忽略它們。`GITHUB_COPILOT_TOKEN_DIR` 請使用絕對路徑。在閘道上，`GITHUB_COPILOT_DEVICE_CODE_URL` 與 `GITHUB_COPILOT_ACCESS_TOKEN_URL` 僅適用於沒有 **GitHub host** 或使用 `github.com` 的憑證。具有 GHE.com 主機的憑證一律使用從該主機衍生的 URL

LiteLLM 只是將 GitHub OAuth 權杖以 Bearer 權杖的形式傳送至 Copilot API。請視需要將 `GITHUB_COPILOT_CLIENT_ID` 設為您自己的 GitHub App 的用戶端 ID。您需要為該 App 啟用裝置流程。

| 變數 | 預設值 | 用途 |
|-------|-------|-------|
| `GITHUB_COPILOT_TOKEN_DIR` | `~/.config/litellm/github_copilot` | 僅限共用登入。GitHub 存取權杖的目錄 |
| `GITHUB_COPILOT_ACCESS_TOKEN_FILE` | `access-token` | 僅限共用登入。權杖目錄中的存取權杖檔案名稱 |
| `GITHUB_COPILOT_CLIENT_ID` | `Iv1.b507a08c87ecfe98` | 用於閘道與 SDK 登入的 OAuth client ID。您自己的 GitHub App 必須已啟用裝置流程。 |
| `GITHUB_COPILOT_DEVICE_CODE_URL` | `https://github.com/login/device/code` | 用於閘道與 SDK 登入的裝置碼端點 |
| `GITHUB_COPILOT_ACCESS_TOKEN_URL` | `https://github.com/login/oauth/access_token` | 用於閘道與 SDK 登入的存取權杖端點 |
| `GITHUB_COPILOT_API_BASE` | `https://api.githubcopilot.com`，或在 GHE.com 登入時為 `https://copilot-api.SUBDOMAIN.ghe.com` | 僅限共用登入。Chat Completions、Responses 與 Embeddings 的備援 API base |

## 驗證細節 {#authentication-details}

<details>
<summary>權杖儲存與快取</summary>

在閘道上，LiteLLM 會加密每位使用者的 GitHub 存取權杖並儲存在資料庫中。它不儲存 refresh token。中斷連接會移除已儲存的連接。

使用 Redis 時，LiteLLM 會將加密的憑證或無連接的記錄快取 60 秒。沒有 Redis 時，請求會讀取資料庫。

每個 worker 會將使用者的 GitHub 權杖與經驗證的 Copilot API base 快取 30 分鐘。連接時，LiteLLM 會檢查對 Copilot `/models` 端點的存取權。如果 GitHub 回傳 401、403 或 404，LiteLLM 會清除已快取的工作階段，並要求使用者重新連接。

直接 SDK 呼叫會從磁碟讀取 GitHub 存取權杖，並以 bearer 權杖的形式將其傳遞給 Copilot API。LiteLLM 不會以任何方式將其換成另一個獨立的 Copilot API 權杖。

</details>

<details>
<summary>API base URL</summary>

對於 **Per-user GitHub OAuth** 憑證，如果 GitHub Copilot 使用者查詢中的 `endpoints.api` 使用 HTTPS，且主機為 `githubcopilot.com` 或其子網域，LiteLLM 會使用它；若是 GHE.com 憑證，則使用 `copilot-api.SUBDOMAIN.ghe.com`。否則，它會使用 `https://api.githubcopilot.com`；若是 GHE.com 憑證，則使用 `https://copilot-api.SUBDOMAIN.ghe.com`。逐使用者憑證不使用 `GITHUB_COPILOT_API_BASE`。

對於共用登入的 Chat Completions、Responses 與 Embeddings，LiteLLM 依序檢查這些值：憑證或部署的 `api_base`、登入的 GitHub 主機上 Copilot 使用者查詢中的 `endpoints.api`（若其命名 `githubcopilot.com` 主機，或 GHE.com 登入時為 `copilot-api.SUBDOMAIN.ghe.com`）、`GITHUB_COPILOT_API_BASE`，然後是 `https://api.githubcopilot.com`（GHE.com 登入時為 `https://copilot-api.SUBDOMAIN.ghe.com`）。

Anthropic Messages 使用經驗證的 Copilot 端點。它會忽略呼叫者提供的任何 `api_base` 與 `GITHUB_COPILOT_API_BASE`，但查詢失敗的 GHE.com 登入除外，該情況會像其他端點一樣退回 `GITHUB_COPILOT_API_BASE`。

GitHub App 部署一律呼叫其 GitHub 主機的 Copilot 端點，並忽略已設定的 `api_base`。花費記錄、回應標頭與 Prometheus `api_base` 標籤都會報告該端點。

</details>

<details>
<summary>請求標頭</summary>

LiteLLM 會為 Chat Completions、Responses 與 Embeddings 加上這些標頭：

| Header | Default |
|-------|-------|
| `Authorization` | 來自經驗證 Copilot 工作階段的 Bearer 權杖 |
| `content-type` | `application/json` |
| `copilot-integration-id` | `vscode-chat` |
| `editor-version` | `vscode/1.95.0` |
| `editor-plugin-version` | `copilot-chat/0.26.7` |
| `user-agent` | `GitHubCopilotChat/0.26.7` |
| `openai-intent` | `conversation-panel` |
| `x-github-api-version` | `2025-04-01` |
| `x-request-id` | 每個請求一個新的 UUID |
| `x-vscode-user-agent-library-version` | `electron-fetch` |

您可以傳入 `extra_headers`，將標頭與這些預設值合併。在閘道上，`Authorization` 一律使用已連接使用者的 Copilot 權杖

GitHub App 部署一律傳送安裝權杖作為 `Authorization`，並傳送 `copilot-developer-cli` 作為 `copilot-integration-id`，因為 GitHub 會拒絕使用任何其他整合 ID 的 App 權杖。請求標頭無法覆寫這兩個值。

Chat Completions 與 Responses 會依訊息角色將 `X-Initiator` 設為 `user` 或 `agent`。當請求包含圖片時，它們也會加上值為 `true` 的視覺請求標頭。

Anthropic Messages 會設定 `openai-intent: messages-proxy`、`x-interaction-type: messages-proxy` 與 `x-github-api-version: 2026-06-01`。如果請求未提供，它會設定 `anthropic-version: 2023-06-01`。

</details>
