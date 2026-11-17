---
title: "透過 LiteLLM AI Gateway 使用 Microsoft 365 Copilot"
sidebar_label: "Microsoft 365 Copilot"
description: "透過 Entra ID SSO 將 Microsoft 365 Copilot 連接到 LiteLLM AI Gateway：註冊應用程式、新增 Graph 權限、新增模型。需要 Enterprise JWT 驗證。"
---

import Image from '@theme/IdealImage';
import ThemedVideo from '@site/src/components/ThemedVideo';

# Microsoft 365 Copilot {#microsoft-365-copilot}

將具有 Microsoft Entra 單一登入 (SSO) 的應用程式連接到您遠端部署的 LiteLLM 閘道。使用者以 Microsoft 帳號登入後，即可向 Copilot 詢問其有權存取的 Microsoft 365 資料。

管理員只需設定一次 Entra ID、閘道與應用程式。應用程式將每位已登入使用者的存取權杖傳送至 LiteLLM，LiteLLM 再將其交換為 Microsoft Graph 存取權杖。Microsoft 將此稱為 [on-behalf-of (OBO) 流程](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)。

## 開始之前 {#before-you-start}

您需要：

- 每位使用者一份 Microsoft 365 Copilot 授權。
- 在 Microsoft Entra ID 中註冊應用程式並授予管理員同意的存取權。
- 一個遠端部署的 LiteLLM 閘道，具備 HTTPS URL、儀表板存取權，以及 [JWT 驗證](../proxy/token_auth.md)（企業版功能）。
- 一個支援 Entra SSO 且能將已登入使用者的存取權杖傳送至與 OpenAI 相容 API 的應用程式。

## 1. 在 Microsoft Entra ID 中註冊應用程式 {#1-register-an-app-in-microsoft-entra-id}

### 建立應用程式與用戶端密碼 {#create-the-app-and-client-secret}

在 [Microsoft Entra 系統管理中心](https://entra.microsoft.com) 中，開啟 **App registrations** > **New registration**。選取 **Accounts in this organizational directory only**，然後註冊應用程式。從其概觀頁面複製 **Application (client) ID** 與 **Directory (tenant) ID**。請參閱 Microsoft 的[應用程式註冊指南](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)。

此註冊同時用於您應用程式的 SSO 設定與 LiteLLM 憑證。

開啟 **Certificates & secrets** > **New client secret**。建立密碼並立即複製其 **Value**；Entra 只會顯示一次。請妥善保存，供 LiteLLM 憑證使用。請參閱 Microsoft 的[用戶端認證指南](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials)。

### 新增 Microsoft Graph 權限 {#add-microsoft-graph-permissions}

開啟 **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated permissions**。新增 [Copilot Chat API](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/api/ai-services/chat/copilotconversation-chat) 所需的全部七項權限：

```text
Sites.Read.All
Mail.Read
People.Read.All
OnlineMeetingTranscript.Read.All
Chat.Read
ChannelMessage.Read.All
ExternalItem.Read.All
```

另外再新增 `openid`、`profile` 與 `offline_access`。為您的租用戶選取 **Grant admin consent**。請參閱 Microsoft 的 [API 權限指南](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-access-web-apis)。

<div className="docs-screenshot">
  <Image img={require('../../img/m365_copilot_entra_api_permissions.png')} alt="Microsoft Entra 中的 Microsoft Graph 委派權限" width={2080} height={1145} />
</div>

### 建立供使用者登入的 scope {#create-a-scope-for-users-to-sign-in}

開啟 **Expose an API**。將 **Application ID URI** 設為 `api://<app-client-id>`。選取 **Add a scope**，將其命名為 `access_as_user`，並允許管理員與使用者同意。請參閱 Microsoft 的 [Expose an API 指南](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis)。

<div className="docs-screenshot">
  <Image img={require('../../img/m365_copilot_entra_expose_api.png')} alt="Microsoft Entra 的 Expose an API 設定中的 access_as_user scope" width={1740} height={640} />
</div>

開啟 **Manifest**，將 `api.requestedAccessTokenVersion` 設為 `2`，然後儲存。下方閘道設定預期使用 [v2 存取權杖](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens)。

### 設定用戶端登入 {#configure-client-sign-in}

開啟 **Authentication** > **Add a platform**。選擇您的應用程式使用的平台，並新增其登入設定中的確切重新導向 URI。請參閱 Microsoft 的[重新導向 URI 指南](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url)。

## 2. 在 LiteLLM 中新增模型 {#2-add-the-model-in-litellm}

在 LiteLLM 儀表板中，開啟 **Models + Endpoints** > **Add Model**。選取 **Microsoft 365 Copilot** 作為提供者，並選取 `chat` 作為模型。將 **Public Model Name** 設為 `m365-copilot`；用戶端請求中使用此名稱。

將 **Auth Type** 選取為 **OAuth token exchange (on-behalf-of)**，然後選取 **Create credential**。

<div className="docs-screenshot">
  <Image img={require('../../img/m365_copilot_litellm_add_model.png')} dark={require('../../img/m365_copilot_litellm_add_model_dark.png')} alt="在 LiteLLM 中新增 Microsoft 365 Copilot 模型" width={1096} height={1221} />
</div>

輸入以下值：

| 欄位 | 值 |
| --- | --- |
| **Credential Name** | `m365-copilot-obo` |
| **Token Endpoint URL** | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token` |
| **Exchange Grant** | `jwt_bearer_obo` |
| **Client ID** | 應用程式的 Application (client) ID |
| **Client Secret** | 您保存的用戶端密碼值 |
| **Scope** | `https://graph.microsoft.com/.default` |
| **Audience** | 留空 |

<div className="docs-screenshot">
  <Image img={require('../../img/m365_copilot_litellm_credential.png')} dark={require('../../img/m365_copilot_litellm_credential_dark.png')} alt="LiteLLM 中的 Microsoft 365 Copilot 權杖交換憑證" width={656} height={1125} />
</div>

選取 **Add Credential**，在模型表單上選取已保存的憑證，然後選取 **Add Model**。

以下錄影示範在儀表板中完成整個步驟：

<ThemedVideo
  src={require('../../img/m365_copilot_setup_flow.mp4')}
  dark={require('../../img/m365_copilot_setup_flow_dark.mp4')}
  poster={require('../../img/m365_copilot_setup_flow_poster.png')}
  darkPoster={require('../../img/m365_copilot_setup_flow_poster_dark.png')}
  title="操作示範：新增 Microsoft 365 Copilot 模型及其 on-behalf-of 憑證"
/>

## 3. 設定閘道以接受 Entra 存取權杖 {#3-configure-the-gateway-to-accept-entra-access-tokens}

在您的閘道部署中設定這些環境變數。將 `<tenant-id>` 與 `<app-client-id>` 替換為步驟 1 中的 ID：

| 環境變數 | 值 |
| --- | --- |
| `JWT_PUBLIC_KEY_URL` | `https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys` |
| `JWT_AUDIENCE` | `<app-client-id>` |
| `JWT_ISSUER` | `https://login.microsoftonline.com/<tenant-id>/v2.0` |

將以下內容新增至閘道的 `config.yaml`，然後重新啟動閘道：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: oid
    user_email_jwt_field: preferred_username
    user_id_upsert: true

litellm_settings:
  drop_params: true
```

`drop_params: true` 會從整個閘道的請求中移除不支援的參數，例如 tools 或 temperature。Copilot 不支援工具呼叫，且 LiteLLM 對此提供者會忽略 `max_tokens`。

## 4. 以 SSO 連接您的應用程式 {#4-connect-your-app-with-sso}

以應用程式管理員身分，使用 Microsoft Entra 設定 OpenID Connect (OIDC) 登入：

| 設定 | 值 |
| --- | --- |
| Issuer URL | `https://login.microsoftonline.com/<tenant-id>/v2.0` |
| Client ID | 步驟 1 中 Entra 應用程式的用戶端 ID |
| Redirect URI | 應用程式的 SSO 回呼 URL，已於步驟 1 註冊 |
| Scopes | `openid profile email offline_access api://<app-client-id>/access_as_user` |

接著設定應用程式的模型連線：

| 設定 | 值 |
| --- | --- |
| API base URL | `https://litellm.example.com/v1`，使用您閘道的位址 |
| Model | `m365-copilot`，或您在步驟 2 設定的公開模型名稱 |
| Authentication | 在 `Authorization: Bearer <access-token>` 標頭中傳送已登入使用者的 Entra 存取權杖 |

:::note

應用程式必須在每個模型請求中傳送為 `api://<app-client-id>/access_as_user` 簽發的**存取權杖**。僅有 SSO 登入並不足夠。ID 權杖無法完成 on-behalf-of 交換。

:::

## 5. 登入並使用 Copilot {#5-sign-in-and-use-copilot}

開啟應用程式並以您的 Microsoft 工作帳號登入。選取 `m365-copilot` 並傳送提示詞，例如「Summarize my latest meeting.」。應用程式會處理每個請求的驗證，Copilot 則使用您的 Microsoft 365 權限來回答。

## 選用設定 {#optional-configuration}

### 新增電子郵件或群組宣告 {#add-email-or-group-claims}

如果您的閘道使用電子郵件或群組宣告，請在 **Token configuration** 下新增。為選用的 `email` 宣告選取 **Access token** 類型，`groups` 僅在您的閘道使用時才新增。請參閱 Microsoft 的[選用宣告指南](https://learn.microsoft.com/en-us/entra/identity-platform/optional-claims)。

<div className="docs-screenshot">
  <Image img={require('../../img/m365_copilot_entra_token_configuration.png')} alt="Microsoft Entra 中的選用權杖宣告" width={1740} height={900} />
</div>

### 以設定檔新增模型 {#add-the-model-with-a-configuration-file}

如果您在 `config.yaml` 中管理模型，請參照步驟 2 中保存的憑證：

```yaml
model_list:
  - model_name: m365-copilot
    litellm_params:
      model: microsoft_365_copilot/chat
      litellm_credential_name: m365-copilot-obo
```

### 憑證欄位 {#credential-fields}

LiteLLM 從已保存的憑證讀取權杖交換設定。用戶端無法在請求中設定這些值。

| 欄位 | 用途 |
| --- | --- |
| `token_exchange_endpoint` | Entra 權杖端點 |
| `token_exchange_profile` | 交換類型；預設為 `jwt_bearer_obo`。也支援 `rfc8693`。 |
| `client_id` | Entra 應用程式的用戶端 ID |
| `client_secret` | Entra 應用程式的用戶端密碼 |
| `token_exchange_scope` | 預設為 `https://graph.microsoft.com/.default` |
| `token_exchange_audience` | 選用；僅適用於 `rfc8693` |

## 請求如何運作 {#how-requests-work}

LiteLLM 呼叫 Microsoft Graph beta Copilot Chat API。模型由 Microsoft 決定。LiteLLM 預設將 token 成本列為 `$0`，因為 Microsoft 依授權對 Copilot 計費。管理員可以設定[自訂定價](https://docs.litellm.ai/docs/proxy/custom_pricing#override-model-cost-map)，在 LiteLLM 中追蹤使用成本。

LiteLLM 將最後一則使用者訊息作為提示詞傳送，其餘訊息則依序作為上下文。如果 Graph 連續回傳相同的回覆，LiteLLM 僅在兩份回覆完全一致時才移除重複。

每個閘道 worker 會將交換得來的存取權杖快取於記憶體中，直到到期前 60 秒。LiteLLM 不會儲存重新整理權杖。

## 疑難排解 {#troubleshooting}

| 問題 | 處理方式 |
| --- | --- |
| Entra 回傳 `AADSTS240002` | 檢查應用程式是否請求 `api://<app-client-id>/access_as_user` 並轉送產生的存取權杖，而不是 ID 權杖。 |
| 連線測試顯示需要呼叫者的存取權杖 | 透過應用程式登入並傳送提示詞。僅有 LiteLLM 儀表板工作階段無法完成交換。 |
| 權杖 audience 或 issuer 不相符 | 檢查應用程式是否簽發 v2 存取權杖。權杖的 `aud` 必須與 `JWT_AUDIENCE` 相符，其 `iss` 必須與 `JWT_ISSUER` 相符。 |
