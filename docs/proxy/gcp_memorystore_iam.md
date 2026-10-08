---
title: GCP Memorystore IAM Authentication
description: 使用服務帳戶而非密碼，將 LiteLLM proxy 驗證到 GCP Memorystore。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GCP Memorystore IAM Authentication {#gcp-memorystore-iam-authentication}

使用 IAM 驗證將 LiteLLM 的 Redis 快取連線到 GCP Memorystore，讓 proxy 以服務帳戶進行驗證，
且您的設定中不會有 Redis 密碼。

:::info

目前僅支援 Redis 叢集的 Redis IAM 驗證。關於 AWS ElastiCache 和
Valkey，請參閱 [AWS ElastiCache IAM Authentication](./elasticache_iam.md)。關於 Azure Cache for Redis 和
Azure Managed Redis，請參閱 [Azure Redis Entra ID Authentication](./azure_redis_ad.md)。

:::

```shell
uv add google-cloud-iam
```

<Tabs>

<TabItem value="gcp-iam-config" label="在 config.yaml 中設定">

適用於具備 GCP IAM 的 Redis 叢集：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    redis_startup_nodes:
      [{ "host": "10.128.0.2", "port": 6379 }, { "host": "10.128.0.2", "port": 11008 }]
    gcp_service_account: "projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com"
    ssl: true
    ssl_cert_reqs: null
    ssl_check_hostname: false
```

</TabItem>

<TabItem value="gcp-iam-env" label="在 .env 中設定">

您可以在 .env 中設定 GCP IAM Redis 驗證：

適用於 Redis 叢集：

```env
REDIS_CLUSTER_NODES='[{"host": "10.128.0.2", "port": 6379}, {"host": "10.128.0.2", "port": 11008}]'
REDIS_GCP_SERVICE_ACCOUNT="projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com"
REDIS_GCP_SSL_CA_CERTS="./server-ca.pem"
REDIS_SSL="True"
REDIS_SSL_CERT_REQS="None"
REDIS_SSL_CHECK_HOSTNAME="False"
```

**GCP 驗證設定**

請確認您的 GCP 憑證已設定：

```shell
# Option 1: Service account key file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Option 2: If running on GCP compute instance with service account attached
# No additional setup needed
```

</TabItem>

</Tabs>

在 proxy 執行後，請使用
[`/cache/ping`](./caching.md#debugging-caching---cacheping) 確認連線。關於 Redis
快取的其他所有內容，包括叢集拓撲與 TLS，請參閱 [Redis and Valkey](./caching_redis.md)。
