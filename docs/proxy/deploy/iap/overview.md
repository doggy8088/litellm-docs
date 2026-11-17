---
title: Identity-Aware Proxy
sidebar_label: Identity-Aware Proxy
toc_max_heading_level: 2
description: 使用 Cloudflare Access、AWS ALB、Microsoft Entra Application Proxy 或 Google Cloud IAP，將已驗證的企業身分轉送給 LiteLLM。
---

import { IngressArchitecture } from '@site/src/components/IngressArchitecture';

# Identity-Aware Proxy {#identity-aware-proxy}

{/* keep-version-note */}

身分感知 proxy 在將請求轉送給 LiteLLM 之前先驗證呼叫者。它以簽署的 token 或受信任的標頭送出已驗證的身分。LiteLLM 讀取該身分並套用使用者與團隊權限。

這些範例使用 LiteLLM Enterprise 與既有的資料庫。透過[存取管理](../../access_management/overview.md) 設定您的使用者、團隊與模型存取。

一般設定請參閱[驗證](../../authentication.md)。

## Cloudflare Access {#cloudflare}

使用 Access 驗證員工，並使用 Tunnel 連線到私有來源。要求 Gateway，讓只有註冊在您的 Zero Trust 帳戶中的裝置可以連線。

<IngressArchitecture kind="iap-cloudflare" />

### 設定 {#configuration}

將員工裝置以 **Traffic and DNS** 或 **Traffic only** 模式註冊到 Cloudflare One Client。在 **Zero Trust → Reusable components → Posture checks** 中，加入 **Gateway** 檢查。透過用戶端路由應用程式、IdP 與團隊網域。請參閱 [Require Gateway](https://developers.cloudflare.com/cloudflare-one/reusable-components/posture-checks/client-checks/require-gateway/) 與[姿態路由](https://developers.cloudflare.com/cloudflare-one/reusable-components/posture-checks/)。

為 `llm.corp.example.com` 建立一個自託管的 Access 應用程式，不限制路徑。允許對應到 LiteLLM 團隊的 IdP 群組。例如，這個 **Allow** 政策授予兩個 Okta 群組存取權：

| 規則 | 選取器 | 值 |
| --- | --- | --- |
| Include | Okta Groups | `litellm-engineering`, `litellm-data-science` |
| Require | 登入方法 | 您的 Okta 整合 |
| Require | Gateway | 選取已啟用的 Gateway 檢查 |

設定 Okta 在其 `groups` claim 中回傳這些群組。透過 SCIM 推送群組，以填入 **Okta Groups** 選取器。請參閱 [Cloudflare 的 Okta 設定](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/okta/)。

所有 Require 規則都必須通過。對此主機名稱的每個 Allow 政策套用相同要求。移除 Bypass 政策。Gateway 檢查需要您組織的用戶端連線。單獨的 WARP 檢查也會接受消費者版 WARP。請參閱 [Access 政策](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) 與 [Require Gateway](https://developers.cloudflare.com/cloudflare-one/reusable-components/posture-checks/client-checks/require-gateway/)。

在您的叢集中執行兩個 `cloudflared` 副本。對於以 token 管理的通道，從 Kubernetes Secret 讀取 `TUNNEL_TOKEN`，並執行 `cloudflared tunnel --no-autoupdate run`。請參閱[在 Kubernetes 上部署 cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/deployment-guides/kubernetes/)。

將通道指向 NGINX 的私有 HTTPS 端點：

```yaml title="Locally managed cloudflared route"
ingress:
  - hostname: llm.corp.example.com
    service: https://ingress.internal.example.com:443
    originRequest:
      originServerName: ingress.internal.example.com
      caPool: /etc/cloudflared/origin-ca.pem
      noTLSVerify: false
      access:
        required: true
        teamName: YOUR_CLOUDFLARE_TEAM
        audTag: [ACCESS_APPLICATION_AUD]
  - service: http_status:404
```

對於遠端管理的通道，在其已發佈的應用程式路由中設定相同的來源選項。請參閱 [Tunnel 來源設定](https://developers.cloudflare.com/tunnel/reference/origin-parameters/)。

### 身分轉送 {#identity-forwarding}

Access 在 `Cf-Access-Jwt-Assertion` 中送出簽署的 JWT。`cloudflared` 原封不動地轉送它。

使用具有 `groups` scope 的 Okta 自訂授權伺服器，並在 Cloudflare 的 [Okta 整合](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/okta/) 中設定其 **Authorization Server ID**。在 **OIDC Claims** 下加入 `groups`，讓 Access 將它以 `custom.groups` 包含在 JWT 中。將 Okta claim 限制在您的 LiteLLM 群組。請參閱[自訂 OIDC claims](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/generic-oidc/#custom-oidc-claims)。

建立 ID 為 `litellm-engineering` 與 `litellm-data-science` 的 LiteLLM 團隊，然後指派它們的[模型權限與預算](../../access_management/jwt_permissions.md#control-model-access-with-teams)。群組值必須與團隊 ID 相符。

NGINX 加入 LiteLLM 預期的 `Bearer` 前綴。將這些指令加入其供 LiteLLM 使用的 HTTPS proxy location：

```nginx
if ($http_cf_access_jwt_assertion = "") { return 401; }
proxy_set_header X-LiteLLM-IAP-Token "Bearer $http_cf_access_jwt_assertion";
proxy_set_header Authorization "";
proxy_set_header litellm_user_api_key "";
```

保持[後端憑證驗證](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ssl_verify) 啟用，並停用[回應緩衝](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)。

設定 LiteLLM 驗證 JWT 並對應其 claims：

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_key_header_name: X-LiteLLM-IAP-Token
  litellm_jwtauth:
    user_id_jwt_field: sub
    user_email_jwt_field: email
    team_ids_jwt_field: custom.groups
    user_id_upsert: true
    enforce_team_based_model_access: true
    fallback_to_db_teams: false
```

```bash
export JWT_PUBLIC_KEY_URL=https://YOUR_TEAM.cloudflareaccess.com/cdn-cgi/access/certs
export JWT_ISSUER=https://YOUR_TEAM.cloudflareaccess.com
export JWT_AUDIENCE=ACCESS_APPLICATION_AUD
```

LiteLLM 驗證 JWT 並套用對應團隊的權限。保持資料庫團隊備援停用，且不要設定 `team_id_default`，讓沒有團隊 claims 的請求被拒絕。Access 可能省略超過其 token 大小上限的自訂 claims。將群組清單限制在 LiteLLM 團隊。請參閱 [Access token claims](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/) 與 [LiteLLM 使用者與團隊對應](../../jwt_user_team_auth.md)。

## AWS Application Load Balancer {#aws}

使用內部 ALB 以 JWT 驗證來驗證應用程式請求。企業用戶端透過 VPN、Direct Connect 或核准的私有存取連線到它。僅允許 ALB 安全群組連線到 LiteLLM。

<IngressArchitecture kind="iap-aws" />

### 設定 {#configuration-1}

使用 HTTPS 監聽器。設定您的 IdP 發出以 2048 位元 RSA 金鑰簽署的 RS256 token。用戶端在 `Authorization: Bearer` 中送出 token。將這些動作存為 `actions-jwt.json`：

```json title="actions-jwt.json"
[
  {
    "Type": "jwt-validation",
    "Order": 1,
    "JwtValidationConfig": {
      "JwksEndpoint": "https://idp.example.com/.well-known/jwks.json",
      "Issuer": "https://idp.example.com",
      "AdditionalClaims": [
        {"Name": "aud", "Format": "single-string", "Values": ["litellm-proxy"]},
        {"Name": "scope", "Format": "space-separated-values", "Values": ["llm:invoke"]}
      ]
    }
  },
  {
    "Type": "forward",
    "Order": 2,
    "TargetGroupArn": "EXISTING_TARGET_GROUP_ARN"
  }
]
```

替換 issuer、JWKS URL、claim 值與目標群組。若您的 IdP 將 audience 放在陣列中，`aud` 請使用 `string-array`。將這些動作套用到 API 規則：

```bash
aws elbv2 modify-rule \
  --rule-arn "$API_RULE_ARN" \
  --actions file://actions-jwt.json
```

這會取代該規則的動作清單。保留您需要的任何加權目標或 stickiness 設定。保護每個 API 路由，並移除未受保護的預設轉送。ALB 需要一個公開的 HTTPS JWKS 端點，金鑰最多 10 個，回應最多 150 KB。請參閱 [ALB JWT 驗證](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)、[claim 格式](https://docs.aws.amazon.com/elasticloadbalancing/latest/APIReference/API_JwtValidationActionAdditionalClaim.html) 與 [modify-rule](https://docs.aws.amazon.com/cli/latest/reference/elbv2/modify-rule.html)。

### 身分轉送 {#identity-forwarding-1}

ALB 驗證 token 並原封不動地轉送原始的 `Authorization` 標頭。在 LiteLLM 現有的 [JWT 設定](../../token_auth.md) 中使用相同的 issuer、audience 與 JWKS 端點：

```bash
export JWT_PUBLIC_KEY_URL=https://idp.example.com/.well-known/jwks.json
export JWT_ISSUER=https://idp.example.com
export JWT_AUDIENCE=litellm-proxy
```

將已驗證的 claims 對應到 [LiteLLM 使用者與團隊](../../jwt_user_team_auth.md)。ALB scope 檢查控制對該路由的存取。LiteLLM 套用模型權限與預算。

ALB 不驗證 HTTPS 目標憑證。將目標存取限制在 ALB。若您的政策需要該檢查，請使用會驗證後端憑證的入口。請參閱 [ALB 目標群組通訊協定](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)。

## Microsoft Entra Application Proxy {#azure}

使用 Microsoft Entra Application Proxy 驗證員工，並透過私有網路連接器連線到 LiteLLM。保持來源私有。透過 Conditional Access 要求您的企業裝置與存取政策。

<IngressArchitecture kind="iap-azure" />

### 設定 {#configuration-2}

此設定需要 Microsoft Entra ID P1 或 P2。在兩台可以連線到 LiteLLM 的主機上安裝私有網路連接器。在 **Entra ID → Enterprise apps → New application** 中，選擇 **Add an on-premises application** 並輸入：

| 設定 | 值 |
| --- | --- |
| Name | `LiteLLM` |
| Internal URL | `https://identity.internal.example.com/`，您的私有 NGINX 入口 |
| External URL | `https://llm.corp.example.com/`，搭配您的自訂網域憑證與 DNS |
| Pre Authentication | Microsoft Entra ID |
| Connector Group | 包含您兩個連接器的群組 |
| Validate Backend TLS Certificate | 已啟用 |
| User assignment | 核准的員工或群組 |

對於新應用程式，開啟 **Permissions** 並為委派的 `User.Read` 權限授予管理員同意。遵循 [Application Proxy 設定](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-add-on-premises-application) 與[自訂網域設定](https://learn.microsoft.com/en-us/entra/identity/app-proxy/how-to-configure-custom-domain)。

以 Conditional Access 政策鎖定這個 Enterprise 應用程式。在 **Grant** 下，選取 **Require device to be marked as compliant**。使用您現有的 Intune 合規政策。先以僅報告模式測試，然後啟用該政策。請參閱[裝置合規設定](https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-all-users-device-compliance)。

### 身分轉送 {#identity-forwarding-2}

在 **Single sign-on → Header-based → Headers → Add new header** 下，選取 **Attribute** 並加入這些對應：

| 請求標頭 | Entra 使用者屬性 |
| --- | --- |
| `X-LiteLLM-User-ID` | `user.objectid` |
| `X-LiteLLM-User-Email` | `user.mail` |

為每個被指派的使用者填入 email 屬性。僅允許連接器主機連線到來源。這些是受信任的 proxy 標頭，不是簽署的 JWT。請參閱 [Entra 以標頭為基礎的 SSO](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-configure-single-sign-on-with-headers)。

在私有 NGINX 入口，拒絕缺少身分標頭的請求，並提供核准的 LiteLLM 團隊。將這些指令加入其現有的 HTTPS location 內：

```nginx
if ($http_x_litellm_user_id = "") { return 401; }
if ($http_x_litellm_user_email = "") { return 401; }
proxy_set_header X-LiteLLM-User-ID $http_x_litellm_user_id;
proxy_set_header X-LiteLLM-User-Email $http_x_litellm_user_email;
proxy_set_header X-LiteLLM-Team-ID corporate-api;
proxy_set_header Authorization "";
proxy_set_header litellm_user_api_key "";
```

在 LiteLLM 中建立 `corporate-api` 團隊，並設定其模型存取與預算。僅允許連接器主機連線到 NGINX，且僅允許 NGINX 連線到 LiteLLM。保持後端 TLS 驗證啟用。設定 LiteLLM 原生的受信任標頭驗證：

```yaml title="config.yaml"
general_settings:
  enable_oauth2_proxy_auth: true
  trusted_proxy_ranges: ["10.20.1.10/32"]
  oauth2_config_mappings:
    user_id: X-LiteLLM-User-ID
    user_email: X-LiteLLM-User-Email
    team_id: X-LiteLLM-Team-ID
```

將 CIDR 替換為 LiteLLM 看到的直接 NGINX 對等端。LiteLLM 接受轉送的使用者與團隊，不需要用戶端 LiteLLM 金鑰。此模式請與 `custom_auth` 和 `enable_jwt_auth` 分開使用。

Entra 應用程式指派控制誰可以連線。在此模式下，缺少 LiteLLM 使用者記錄本身並不會拒絕存取。固定的團隊選取儲存的模型與預算政策。不要接受用戶端提供的團隊或角色。請參閱 [LiteLLM 設定](../../config_settings.md) 與[受信任標頭實作](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/auth/oauth2_proxy_hook.py)。

Application Proxy 支援使用者登入與委派的使用者存取。它不為無人值守的服務主體提供此流程。請參閱 [Microsoft 的 API 存取指南](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-secure-api-access)。

## Google Cloud IAP {#gcp}

在 [GCP 架構](../cloud/gcp.md) 的內部 Application Load Balancer 上使用 IAP。企業用戶端透過 Cloud VPN 或 Cloud Interconnect 連線到其私有位址。

<IngressArchitecture kind="iap-gcp" />

### 設定 {#configuration-3}

將這些值設為您的專案、區域與部署名稱前綴。此範例在私有入口變更後，保留模組的 `-gateway-bs`、`-backend-bs` 與 `-ui-bs` 名稱：

```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
export LITELLM_NAME=litellm-prod

gcloud services enable iap.googleapis.com --project "$PROJECT_ID"

for COMPONENT in gateway backend ui
do
  BACKEND_SERVICE="${LITELLM_NAME}-${COMPONENT}-bs"
  gcloud compute backend-services update "$BACKEND_SERVICE" \
    --project "$PROJECT_ID" --region "$REGION" --iap=enabled

  gcloud iap web add-iam-policy-binding \
    --project "$PROJECT_ID" --region "$REGION" \
    --resource-type=backend-services --service="$BACKEND_SERVICE" \
    --member="group:litellm-users@example.com" \
    --role=roles/iap.httpsResourceAccessor
done
```

這授予該群組對每個受保護後端的存取權。請參閱[區域 IAP 設定](https://docs.cloud.google.com/iap/docs/enabling-compute-howto) 與 [IAP IAM 繫結](https://docs.cloud.google.com/sdk/gcloud/reference/iap/web/add-iam-policy-binding)。

對於三個 Cloud Run 服務，[建立 IAP 服務代理程式](https://docs.cloud.google.com/sdk/gcloud/reference/beta/services/identity/create) 並授予它存取權：

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud beta services identity create --service=iap.googleapis.com --project "$PROJECT_ID"

for COMPONENT in gateway backend ui
do
  SERVICE="${LITELLM_NAME}-${COMPONENT}"
  gcloud run services add-iam-policy-binding "$SERVICE" \
    --project "$PROJECT_ID" --region "$REGION" \
    --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com" \
    --role=roles/run.invoker

  gcloud run services remove-iam-policy-binding "$SERVICE" \
    --project "$PROJECT_ID" --region "$REGION" \
    --member=allUsers --role=roles/run.invoker

  gcloud run services update "$SERVICE" \
    --project "$PROJECT_ID" --region "$REGION" \
    --ingress=internal --invoker-iam-check --no-default-url
done
```

移除命令適用於模組現有的 `allUsers` 授權。若您已移除它們，請跳過。也移除任何 `allAuthenticatedUsers` invoker 授權。將這些設定保留在您的 Terraform fork 中，讓之後的套用能保留它們。請參閱 [IAP 與 Cloud Run](https://docs.cloud.google.com/iap/docs/enabling-cloud-run) 與 [Cloud Run 入口與 IAM 旗標](https://docs.cloud.google.com/sdk/gcloud/reference/run/services/update)。對於 GKE 或 VM 後端，將存取限制在內部負載平衡器與必要的健康檢查。

### 身分轉送 {#identity-forwarding-3}

IAP 在 `x-goog-iap-jwt-assertion` 中送出呼叫者簽署的身分。在 LiteLLM 之前放一個私有 NGINX 適配器。對於 Cloud Run，僅在連接埠 `8080` 公開 NGINX。在 `0.0.0.0:8080` 上以 HTTP 監聽，並 proxy 到 LiteLLM 在 `localhost` 上的現有連接埠。從 LiteLLM 容器移除公開的連接埠。請參閱 [Cloud Run 連接埠需求](https://docs.cloud.google.com/run/docs/container-contract#port)。

將這些指令加入 NGINX 的 proxy location 內：

```nginx
if ($http_x_goog_iap_jwt_assertion = "") { return 401; }
proxy_set_header X-LiteLLM-IAP-Token "Bearer $http_x_goog_iap_jwt_assertion";
proxy_set_header Authorization "";
proxy_set_header litellm_user_api_key "";
```

LiteLLM 驗證簽署的斷言。將存取限制在 IAP 路徑，停用回應緩衝，並為分離的 NGINX 主機保持後端 TLS 驗證啟用。

將這些欄位加入您現有的 LiteLLM JWT 設定：

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_key_header_name: X-LiteLLM-IAP-Token
  litellm_jwtauth:
    user_id_jwt_field: sub
    user_email_jwt_field: email
```

```bash
export JWT_PUBLIC_KEY_URL=https://www.gstatic.com/iap/verify/public_key-jwk
export JWT_ISSUER=https://cloud.google.com/iap
export JWT_AUDIENCE=SIGNED_HEADER_JWT_AUDIENCE
```

在 IAP 中，開啟受保護 API 後端的 **More → Signed Header JWT Audience** 並複製該值。它識別後端資源。不要使用 OAuth 用戶端 ID 作為此 audience。為每個分別受保護的 LiteLLM 後端設定各自的 audience。

透過您的[使用者與團隊對應](../../jwt_user_team_auth.md) 對應 `sub` 與 `email`。以 [claim 驗證器](../../jwt_auth_reference.md#custom-jwt-validate) 要求非空的 `sub`。請參閱 [IAP 簽署標頭](https://docs.cloud.google.com/iap/docs/signed-headers-howto) 與 [Cloud Run 入口容器](https://docs.cloud.google.com/run/docs/configuring/services/containers)。

您也可以直接在 Cloud Run 服務上啟用 IAP。保持其入口私有，並使用該服務的簽署標頭 audience。在 Cloud Run 或負載平衡器其中之一啟用 IAP，不要兩者同時啟用。
