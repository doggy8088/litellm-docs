---
title: 使用 mTLS 的用戶端驗證
sidebar_label: 使用 mTLS 的用戶端驗證
toc_max_heading_level: 2
description: 在您的入口驗證用戶端憑證，將工作負載身分轉送給 LiteLLM，並對 API 請求套用虛擬金鑰權限。
---

import { IngressArchitecture } from '@site/src/components/IngressArchitecture';

# 使用 mTLS 的用戶端驗證 {#client-authentication-with-mtls}

{/* keep-version-note */}

對於擁有您 PKI 憑證的服務、代理程式與用戶端應用程式，使用雙向 TLS (mTLS)。入口驗證每個憑證，並將其身分轉送給 LiteLLM，用於用量追蹤與存取政策。

這些範例使用用戶端憑證與 [LiteLLM 虛擬金鑰](../virtual_keys.md)。憑證識別工作負載。金鑰控制其使用者、團隊、模型與預算。對於僅送出憑證的用戶端，[在入口將每個工作負載對應到它自己的金鑰](#certificate-only-clients)。

在私有 DNS 中使用專用的 API 主機名稱，例如 `llm-api.example.com`。用戶端透過您的企業網路、VPN 或私有互連連線。僅允許入口連線到 LiteLLM。讓 Admin UI 存取保持分離。

## LiteLLM 設定 {#configure-litellm-identity}

將此對應加入 `config.yaml`：

```yaml
general_settings:
  user_header_mappings:
    - header_name: x-mtls-client-id
      litellm_user_role: customer
```

此對應將工作負載身分儲存在 LiteLLM 的[客戶 ID 欄位](../customers.md) 中，用於用量追蹤與存取政策。該欄位可以識別服務、代理程式或應用程式。虛擬金鑰選取 LiteLLM 使用者與團隊。

每個入口都會覆寫 `X-MTLS-Client-ID`，並移除 `X-LiteLLM-Customer-ID` 與 `X-LiteLLM-End-User-ID`。這些標準標頭的優先順序高於此對應。AWS、NGINX、HAProxy 與 Kong 將核准的憑證對應到工作負載別名。Azure 與 GCP 轉送通過 CA 驗證的憑證中的 ID。

關閉繞過入口的替代監聽器、節點連接埠與預設服務 URL。將政策套用到 API 主機名稱上的每個路由。這些範例公開 `/v1/` 並保留 `Authorization`。

後端 HTTPS 與前端 mTLS 分開設定。LiteLLM 的 [`--ssl_certfile_path` 與 `--ssl_keyfile_path` 選項](../cli.md#ssltls-configuration) 提供其伺服器憑證與金鑰。這些旗標不設定用戶端憑證驗證。

## AWS Application Load Balancer {#aws-application-load-balancer}

使用具有 HTTPS 監聽器與私有 NGINX 目標群組的**內部 ALB**。ALB 驗證用戶端憑證。NGINX 在轉送給 LiteLLM 之前，將已驗證的憑證欄位對應到工作負載別名。

<IngressArchitecture kind="mtls-aws" />

### 設定 {#configuration}

將您的 PEM 用戶端 CA 套件上傳到 S3，然後建立信任存放區：

```bash
TRUST_STORE_ARN=$(aws elbv2 create-trust-store \
  --name litellm-clients \
  --ca-certificates-bundle-s3-bucket "$CA_BUCKET" \
  --ca-certificates-bundle-s3-key certificates/client-ca-bundle.pem \
  --query 'TrustStores[0].TrustStoreArn' --output text)
```

信任存放區啟用後，將它附加到您的 HTTPS 監聽器：

```bash
aws elbv2 modify-listener \
  --listener-arn "$LISTENER_ARN" \
  --mutual-authentication "Mode=verify,TrustStoreArn=$TRUST_STORE_ARN,IgnoreClientCertificateExpiry=false"
```

`verify` 讓 ALB 驗證用戶端憑證。Passthrough 模式在不驗證的情況下轉送憑證資訊。請參閱 [AWS 的 mTLS 設定](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/configuring-mtls-with-elb.html)。

### 身分轉送 {#identity-forwarding}

將此設定放在 NGINX 的 `http` 區塊內。以核准憑證的 [ALB 標頭值](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/mutual-authentication.html#mutual-authentication-http-headers) 替換 issuer 與 serial。以 ALB 子網路替換範例子網路。安全群組也必須僅允許 ALB 安全群組。

```nginx
map "$http_x_amzn_mtls_clientcert_issuer|$http_x_amzn_mtls_clientcert_serial_number" $mtls_client_id {
    default "";
    "CN=WorkloadCA,O=Example|01" billing-worker;
}

server {
    listen 443 ssl;
    server_name mtls-mapper.internal;
    ssl_certificate /etc/nginx/tls/server-chain.pem;
    ssl_certificate_key /etc/nginx/tls/server-key.pem;
    allow 10.20.0.0/24;
    deny all;

    location /v1/ {
        if ($mtls_client_id = "") { return 403; }
        proxy_pass https://litellm.internal:4000;
        proxy_ssl_server_name on;
        proxy_ssl_name litellm.internal;
        proxy_ssl_trusted_certificate /etc/nginx/tls/origin-ca.pem;
        proxy_ssl_verify on;
        proxy_ssl_verify_depth 3;
        proxy_set_header Host litellm.internal;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-MTLS-Client-ID $mtls_client_id;
        proxy_set_header X-LiteLLM-Customer-ID "";
        proxy_set_header X-LiteLLM-End-User-ID "";
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_next_upstream off;
    }

    location = /ingress-health { return 200; }
    location / { return 404; }
}
```

在直接連線上保持 NGINX 的來源 IP 檢查。不要在此對應器上設定 `real_ip_header`。空白、重複或未列出的 issuer/serial 配對會使對應失敗。LiteLLM 將 `billing-worker` 記錄為工作負載 ID。

將目標群組的健康檢查路徑設為 `/ingress-health`。讓 ALB 監聽器規則限制在 `/v1/*`。此探針檢查 NGINX。另外監控 LiteLLM readiness。

**ALB 會加密 HTTPS 後端流量，但不驗證後端憑證。**若您的政策需要來源身分檢查，請選擇會驗證來源憑證的入口。請參閱 [ALB 目標群組通訊協定](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)。

## Azure Application Gateway {#azure-application-gateway}

使用 Application Gateway **Standard_v2 或 WAF_v2**，搭配私有前端 IP、HTTPS 監聽器與私有 LiteLLM 後端。

<IngressArchitecture kind="mtls-azure" />

### 設定 {#configuration-1}

設定[嚴格 mTLS](https://learn.microsoft.com/en-us/azure/application-gateway/mutual-authentication-overview)：

1. 開啟 **SSL settings**，加入 SSL 設定檔，並選取 **Client Authentication**。
2. 將每個受信任的用戶端 CA 鏈上傳到一個 PEM 或 CER 檔案中。包括其根憑證與中繼憑證。
3. 開啟 API 的 HTTPS 監聽器，啟用 **SSL Profile**，並選取此設定檔。
4. 將 `/v1/*` 路由到您的私有後端。在 **Backend settings** 中選取 HTTPS。使用與其憑證相符的主機名稱。需要時上傳私有根 CA。保持憑證鏈、到期與 SNI 驗證啟用。

請參閱[入口網站設定](https://learn.microsoft.com/en-us/azure/application-gateway/mutual-authentication-portal) 與[後端 TLS 設定](https://learn.microsoft.com/en-us/azure/application-gateway/configuration-http-settings)。將來源存取限制在 Application Gateway 子網路。為私有後端另外設定其健康探針。

### 身分轉送 {#identity-forwarding-1}

建立一個重寫集，將已驗證的 issuer 與 serial 作為一個工作負載 ID 轉送。空白值會移除競爭的標頭：

```bash
az network application-gateway rewrite-rule set create \
  --resource-group "$RESOURCE_GROUP" --gateway-name "$APP_GATEWAY" \
  --name litellm-mtls

az network application-gateway rewrite-rule create \
  --resource-group "$RESOURCE_GROUP" --gateway-name "$APP_GATEWAY" \
  --rule-set-name litellm-mtls --name verified-client --sequence 100 \
  --request-headers \
    'X-MTLS-Client-ID={var_client_certificate_issuer}|{var_client_certificate_serial}' \
    'X-LiteLLM-Customer-ID=' \
    'X-LiteLLM-End-User-ID='

az network application-gateway rule update \
  --resource-group "$RESOURCE_GROUP" --gateway-name "$APP_GATEWAY" \
  --name "$API_ROUTING_RULE" --rewrite-rule-set litellm-mtls
```

此附加命令鎖定基本路由規則。對於以路徑為基礎的規則，將重寫集附加到 API 的 URL 路徑對應規則。將這些動作合併到任何現有的重寫集。使用常見的 LiteLLM 設定時，`issuer|serial` 會成為工作負載 ID。憑證更新會變更該 ID。若您需要穩定的別名，請使用私有對應器，如 AWS 範例所示。請參閱[重寫命令](https://learn.microsoft.com/en-us/cli/azure/network/application-gateway/rewrite-rule?view=azure-cli-latest) 與[憑證變數](https://learn.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-url)。

## Google Cloud Application Load Balancer {#google-cloud-application-load-balancer}

使用既有的**區域內部 Application Load Balancer**，搭配私有 HTTPS 前端。啟用 Compute Engine、Certificate Manager、Network Security 與 Network Services API。取得[必要的 IAM 權限](https://docs.cloud.google.com/load-balancing/docs/https/setting-up-mtls-ccm#permissions)。

<IngressArchitecture kind="mtls-gcp" />

### 設定 {#configuration-2}

在 **Certificate Manager → Trust Configs** 中，於負載平衡器的區域建立 `litellm-clients`。上傳根 CA 作為信任錨點，以及任何中繼 CA。使用 CA 信任存放區，不加憑證允許清單例外。

將此存為 `server-tls-policy.yaml`。替換 `PROJECT_ID` 與 `REGION`：

```yaml
name: litellm-mtls
mtlsPolicy:
  clientValidationMode: REJECT_INVALID
  clientValidationTrustConfig: projects/PROJECT_ID/locations/REGION/trustConfigs/litellm-clients
```

```bash
gcloud network-security server-tls-policies import litellm-mtls \
  --source=server-tls-policy.yaml --location="$REGION"

gcloud compute target-https-proxies export "$HTTPS_PROXY" \
  --destination=target-proxy.yaml --region="$REGION"
```

保留匯出 proxy 的憑證與 URL 對應設定。將此根欄位加入 `target-proxy.yaml`：

```yaml
serverTlsPolicy: //networksecurity.googleapis.com/projects/PROJECT_ID/locations/REGION/serverTlsPolicies/litellm-mtls
```

匯入 proxy，然後匯出其現有的 URL 對應：

```bash
gcloud compute target-https-proxies import "$HTTPS_PROXY" \
  --source=target-proxy.yaml --region="$REGION"

gcloud compute url-maps export "$URL_MAP" \
  --destination=url-map.yaml --region="$REGION"
```

### 身分轉送 {#identity-forwarding-2}

將此根 `headerAction` 加入 `url-map.yaml`。將它與現有的標頭動作合併，並保留匯出的路由規則：

```yaml
headerAction:
  requestHeadersToAdd:
    - headerName: X-MTLS-Client-ID
      headerValue: "{client_cert_sha256_fingerprint}"
      replace: true
  requestHeadersToRemove:
    - X-LiteLLM-Customer-ID
    - X-LiteLLM-End-User-ID
```

```bash
gcloud compute url-maps import "$URL_MAP" \
  --source=url-map.yaml --region="$REGION"
```

`REJECT_INVALID` 拒絕缺少或無效的用戶端憑證。URL 對應將傳入的身分標頭替換為已驗證憑證的 Base64 編碼 SHA-256 指紋。常見的 LiteLLM 設定使用該指紋作為工作負載 ID。更新會變更該 ID。內部負載平衡器使用 URL 對應標頭動作，而非後端服務自訂標頭。請參閱[前端 mTLS 設定](https://docs.cloud.google.com/load-balancing/docs/https/setting-up-mtls-ccm) 與[內部負載平衡器標頭動作](https://docs.cloud.google.com/load-balancing/docs/l7-internal/custom-headers)。

前端 mTLS 不設定後端驗證。對於受支援的後端，設定[後端驗證 TLS](https://docs.cloud.google.com/load-balancing/docs/backend-authenticated-tls-backend-mtls)。使用獨立的後端信任設定與驗證設定。僅選取 HTTPS 並不會驗證來源憑證。以防火牆規則限制後端存取。對於 Cloud Run，[將入口設為 internal](https://docs.cloud.google.com/run/docs/securing/ingress)，停用預設服務 URL，並移除直接網域對應。

## NGINX {#nginx}

<IngressArchitecture kind="mtls-nginx" />

### 設定 {#configuration-3}

將兩個區塊都放在您的 NGINX `http` 設定內。以核准用戶端憑證的值替換範例 issuer 與 serial。來源必須以 `litellm.internal` 的憑證提供 HTTPS 服務。

```nginx
map "$ssl_client_i_dn|$ssl_client_serial" $mtls_client_id {
    default "";
    "CN=WorkloadCA,O=Example|01" billing-worker;
}

server {
    listen 443 ssl;
    server_name llm-api.example.com;
    ssl_certificate /etc/nginx/tls/server-chain.pem;
    ssl_certificate_key /etc/nginx/tls/server-key.pem;
    ssl_client_certificate /etc/nginx/tls/client-ca.pem;
    ssl_verify_client on;
    ssl_verify_depth 3;

    location /v1/ {
        if ($mtls_client_id = "") { return 403; }
        proxy_pass https://litellm.internal:4000;
        proxy_ssl_server_name on;
        proxy_ssl_name litellm.internal;
        proxy_ssl_trusted_certificate /etc/nginx/tls/origin-ca.pem;
        proxy_ssl_verify on;
        proxy_ssl_verify_depth 3;
        proxy_set_header Host litellm.internal;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-MTLS-Client-ID $mtls_client_id;
        proxy_set_header X-LiteLLM-Customer-ID "";
        proxy_set_header X-LiteLLM-End-User-ID "";
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_next_upstream off;
    }

    location / { return 404; }
}
```

### 身分轉送 {#identity-forwarding-3}

依您的 CA 鏈調整驗證深度。以 `nginx -t` 驗證，然後重新載入。空白的 `proxy_set_header` 值會移除傳入的標頭。請參閱[憑證變數](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#variables)、[map 指令](https://nginx.org/en/docs/http/ngx_http_map_module.html#map) 與[標頭規則](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)。僅允許來自 NGINX 的來源存取。

<details id="certificate-only-clients">
<summary>使用憑證，不需用戶端提供金鑰</summary>

若要僅以憑證驗證用戶端，在入口為每個工作負載保留一個虛擬金鑰。將已驗證的工作負載 ID 對應到該金鑰。不要對所有用戶端使用主金鑰或共用金鑰。

對於 NGINX，在 `http` 區塊中將此 map 加在憑證 map 旁邊：

```nginx
map $mtls_client_id $mtls_litellm_key {
    default "";
    include /run/secrets/litellm-workload-keys.map;
}
```

以受限制的存取掛載密鑰檔案。其格式為 `billing-worker sk-WORKLOAD_VIRTUAL_KEY;`。

在現有的 `/v1/` location 中，以這些指令替換 `Authorization` 指令。保留憑證檢查、身分標頭規則與後端 TLS 設定：

```nginx
if ($mtls_litellm_key = "") { return 403; }
proxy_set_header Authorization "";
proxy_set_header litellm_user_api_key "";
proxy_set_header X-MTLS-LiteLLM-Key "Bearer $mtls_litellm_key";
```

將[自訂金鑰標頭](../virtual_keys.md#pass-litellm-key-in-custom-header) 加入同一個 LiteLLM 設定：

```yaml
general_settings:
  litellm_key_header_name: x-mtls-litellm-key
  user_header_mappings:
    - header_name: x-mtls-client-id
      litellm_user_role: customer
```

金鑰對應變更後重新載入 NGINX，並確認已撤銷的金鑰會失敗。

</details>

## HAProxy {#haproxy}

使用支援 OpenSSL 的 HAProxy 建置。`server.pem` 包含伺服器憑證鏈與私鑰。私有來源提供 HTTPS 服務。

<IngressArchitecture kind="mtls-haproxy" />

### 設定 {#configuration-4}

建立 `/etc/haproxy/mtls-clients.map`。每一行將核准憑證的 SHA-256 指紋對應到工作負載 ID。使用不含冒號的小寫十六進位：

```text
CLIENT_CERT_SHA256_HEX billing-worker
```

```text
defaults
    mode http
    timeout connect 10s
    timeout client 300s
    timeout server 300s
    retries 0

frontend litellm_api
    bind :443 ssl crt /etc/haproxy/server.pem ca-file /etc/haproxy/client-ca.pem verify required
    http-request deny deny_status 404 unless { path_beg /v1/ }
    http-request set-var(txn.mtls_client_id) ssl_c_der,sha2(256),hex,lower,map(/etc/haproxy/mtls-clients.map)
    http-request deny deny_status 403 unless { var(txn.mtls_client_id) -m found }
    http-request set-header X-MTLS-Client-ID %[var(txn.mtls_client_id)]
    http-request del-header X-LiteLLM-Customer-ID
    http-request del-header X-LiteLLM-End-User-ID
    http-request set-header X-Forwarded-Proto https
    default_backend litellm_origin

backend litellm_origin
    http-request set-header Host litellm.internal
    server litellm litellm.internal:4000 ssl verify required ca-file /etc/haproxy/origin-ca.pem sni str(litellm.internal) verifyhost litellm.internal
```

### 身分轉送 {#identity-forwarding-4}

以 `haproxy -c -f /etc/haproxy/haproxy.cfg` 驗證，然後重新載入。`set-header` 會替換任何用戶端提供的工作負載 ID。後端驗證來源憑證並轉送 `Authorization`。僅允許來自 HAProxy 的來源存取。請參閱[用戶端憑證驗證](https://www.haproxy.com/documentation/haproxy-configuration-tutorials/security/authentication/client-certificate-authentication/) 與[設定參考](https://docs.haproxy.org/3.2/configuration.html)。

## Kong Gateway {#kong-gateway}

[`mtls-auth` 外掛需要 Kong Gateway Enterprise](https://developer.konghq.com/plugins/mtls-auth/)。為 `llm-api.example.com` 設定私有 HTTPS 監聽器，並在您的 Kong 部署中啟用 [Post-Function 外掛](https://developer.konghq.com/plugins/post-function/)。為用戶端 CA 與來源 CA 建立分離的 CA Certificate 實體。

<IngressArchitecture kind="mtls-kong" />

### 設定 {#configuration-5}

將此範例加入您的宣告式設定。替換兩個 CA ID、憑證 UUID、憑證 SAN 與 CA PEM。在完整設定中包括 CA 實體與監聽器憑證：

```yaml
_format_version: "3.0"
consumers:
  - username: billing-worker
    custom_id: billing-worker
    mtls_auth_credentials:
      - id: 37f2b624-5772-4b9a-9499-96a67b804d25
        subject_name: billing-worker.example.internal
        ca_certificate: |
          -----BEGIN CERTIFICATE-----
          REPLACE_WITH_ISSUING_CA_PEM
          -----END CERTIFICATE-----
services:
  - name: litellm
    url: https://litellm.internal:4000
    tls_verify: true
    ca_certificates:
      - ORIGIN_CA_CERTIFICATE_ID
    read_timeout: 300000
    retries: 0
    routes:
      - name: litellm-api
        hosts: [llm-api.example.com]
        snis: [llm-api.example.com]
        protocols: [https]
        paths: [/v1/]
        strip_path: false
        response_buffering: false
    plugins:
      - name: mtls-auth
        config:
          ca_certificates:
            - CLIENT_CA_CERTIFICATE_ID
          skip_consumer_lookup: false
          consumer_by: []
      - name: post-function
        config:
          access:
            - |
              local consumer = kong.client.get_consumer()
              if not consumer or not consumer.custom_id or consumer.custom_id == "" then
                return kong.response.exit(403, { message = "Missing workload identity" })
              end
              kong.service.request.set_header("X-MTLS-Client-ID", consumer.custom_id)
              kong.service.request.clear_header("X-LiteLLM-Customer-ID")
              kong.service.request.clear_header("X-LiteLLM-End-User-ID")
```

### 身分轉送 {#identity-forwarding-5}

`consumer_by: []` 停用自動 Consumer 對應。明確的憑證將憑證 SAN 繫結到 `billing-worker` 及其發行 CA。Kong 僅在憑證沒有 SAN 時使用 CN。讓 `anonymous` 與 `default_consumer` 保持未設定。請參閱[手動憑證對應](https://developer.konghq.com/plugins/mtls-auth/#manual-mappings-between-certificate-and-consumer-objects)。

Post-Function 在 mTLS 驗證之後執行。它讀取已驗證的 [Consumer 物件](https://developer.konghq.com/gateway/pdk/reference/kong.client/#kongclientget_consumer) 並[覆寫上游身分標頭](https://developer.konghq.com/gateway/pdk/reference/kong.service.request/#kongservicerequestset_headerheader-of)。它不信任傳入的 `X-Consumer-*` 標頭。LiteLLM 將 `billing-worker` 記錄為工作負載 ID。

Service 使用 HTTPS 並驗證來源憑證。請參閱 [Kong TLS 設定](https://developer.konghq.com/gateway/ssl-certificates/)。僅允許來自 Kong 的來源存取。保留 `Authorization`，並將外掛套用到通往此 Service 的每個路由。使用串流之前，檢視會啟用回應緩衝的外掛。
