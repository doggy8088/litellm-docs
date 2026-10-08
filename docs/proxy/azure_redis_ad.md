---
title: Azure Redis Entra ID Authentication
description: 透過 Microsoft Entra ID，而非存取金鑰，將 LiteLLM proxy 驗證至 Azure Cache for Redis 或 Azure Managed Redis。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure Redis Entra ID Authentication {#azure-redis-entra-id-authentication}

將 LiteLLM 的 Redis 快取連接到 Azure Cache for Redis 或 Azure Managed Redis，使用 Microsoft
Entra ID（前稱 Azure AD），讓 proxy 以受管理識別身分或服務主體進行驗證，
且設定中不包含存取金鑰

## 為什麼要使用它 {#why-use-it}

使用 Entra ID 驗證時，用戶端會以短效的 Entra 存取權杖取代密碼，Azure 會在每次連線時依據快取的存取原則指派來驗證它。
透過移除原則指派即可撤銷存取，而不必輪替金鑰並重新部署每個
複本；且每次連線都能對應到您租戶中的某個身分

LiteLLM 會建立一次 Entra 憑證，並在 proxy 的生命週期內保持其存活，因此會套用 Azure
SDK 的內部權杖快取與靜默重新整理。每個新的 Redis 連線都會使用
新的權杖進行驗證，避免共用連線在初始權杖於約一小時後過期時開始失敗的情況

## 需求 {#requirements}

您需要已安裝 `azure-identity`，其隨附於 `litellm[proxy]` 和 Docker 映像。必須在快取上啟用 Entra
ID 驗證，而 proxy 執行所使用的身分需要具備資料
存取原則；對於回應快取，Data Contributor 已足夠。Azure 僅透過 TLS 提供這些快取，因此請設定 `ssl: true` 並對 Azure Cache for Redis 使用 6380 埠，或對
Azure Managed Redis 使用 10000 埠

## 設定 {#configuration}

設定 `azure_redis_ad_token: "true"` 並移除密碼

<Tabs>

<TabItem value="config" label="在 config.yaml 中設定">

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: my-cache.redis.cache.windows.net
    port: 6380
    ssl: true
    azure_redis_ad_token: "true"
```

</TabItem>

<TabItem value="env" label="在 .env 中設定">

```env
REDIS_HOST="my-cache.redis.cache.windows.net"
REDIS_PORT="6380"
REDIS_SSL="True"
REDIS_AZURE_AD_TOKEN="True"
REDIS_USERNAME="<object id of the proxy's identity>"
```

</TabItem>

</Tabs>

Azure Redis 執行個體通常會在 `AUTH` 期間，預期使用身分的物件（主體）ID 作為 Redis 使用者名稱。
將 `REDIS_USERNAME` 環境變數設定為該物件 ID；當其未設定時，
LiteLLM 只會送出權杖，而這可能會被已設定 ACL 的執行個體拒絕

## 憑證如何解析 {#how-credentials-resolve}

如果 `azure_client_id`、`azure_tenant_id` 和 `azure_client_secret` 都已設定，且在 `cache_params`
中或透過標準的 `AZURE_CLIENT_ID`、`AZURE_TENANT_ID` 和 `AZURE_CLIENT_SECRET` 環境
變數，LiteLLM 會以該服務主體進行驗證。如果只設定了 `azure_client_id`，則會
以該使用者指派的受管理識別進行驗證。否則會退回到
`DefaultAzureCredential`，這涵蓋系統指派的受管理識別、Azure CLI，以及
其他標準的 azure-identity 機制

## 設定 {#settings}

| 設定 | 必要 | 說明 |
| --- | --- | --- |
| `azure_redis_ad_token` | 是 | 字串 `"true"` 會開啟 Entra ID 驗證。環境變數對應值：`REDIS_AZURE_AD_TOKEN` |
| `azure_client_id` | 否 | 使用者指派的受管理識別或服務主體的用戶端 ID。會退回到 `AZURE_CLIENT_ID` |
| `azure_tenant_id` | 否 | 租戶 ID，需與用戶端密碼一起使用。會退回到 `AZURE_TENANT_ID` |
| `azure_client_secret` | 否 | 服務主體密碼。會退回到 `AZURE_CLIENT_SECRET` |

`REDIS_USERNAME` 僅限環境變數，當您的快取
在 `AUTH` 上需要使用者名稱時，應填入該身分的物件 ID

## 驗證 {#verify}

透過 proxy 對快取進行 ping。健康的回應表示已發出權杖、Azure 已接受它，
而且寫入已完成往返

```shell
curl -s -X GET 'http://localhost:4000/cache/ping' \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json
{
  "status": "healthy",
  "cache_type": "redis",
  "ping_response": true,
  "set_cache_response": "success"
}
```

## 注意事項 {#notes}

同步 Redis 用戶端會在自訂連線函式中進行驗證；非同步用戶端則會將同一個即時
憑證包裝成 redis-py 憑證提供者，並在每次新連線時查詢。兩條路徑
共用同一個憑證物件，因此權杖更新會在 Azure SDK 內部完成，無需重新啟動

如果您在 Entra ID 旁邊也設定了 GCP IAM（`gcp_service_account`），GCP 路徑會勝出，而 LiteLLM
會記錄警告。如果您在 Entra ID 旁邊也設定了 AWS ElastiCache IAM（`aws_iam_auth`），Entra
路徑會勝出，同樣會有警告。請只設定其中一個。提供您自己的 `credential_provider`
會覆寫以上所有設定

## 疑難排解 {#troubleshooting}

`azure-identity is required for Azure AD Redis authentication` 表示該套件在
自訂安裝中遺失；它已是 `litellm[proxy]` 的一部分

`Azure AD authentication failed for Redis` 或 `WRONGPASS invalid username-password pair` 表示
權杖已發出，但快取拒絕了它。常見原因是快取上未啟用 Entra ID 驗證、
身分缺少資料存取原則指派，或 `REDIS_USERNAME` 未
與該身分的物件 ID 相符

來自 azure-identity 本身的錯誤，例如 `DefaultAzureCredential failed to retrieve a token`，
表示找不到任何憑證來源。請檢查 proxy 是否 वास्तव際以您指派的受管理識別執行，
或是否已設定 `AZURE_*` 變數

## 另請參閱 {#see-also}

關於 Redis 快取的其他所有內容，包括叢集拓樸、命名空間和 TLS，都在
[Redis 和 Valkey](./caching_redis.md) 中。關於 AWS，請參閱
[AWS ElastiCache IAM Authentication](./elasticache_iam.md)；關於 GCP，請參閱
[GCP Memorystore IAM Authentication](./gcp_memorystore_iam.md)
