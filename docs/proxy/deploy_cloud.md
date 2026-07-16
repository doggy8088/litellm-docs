import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';
import { CloudArchitectureSelector } from '@site/src/components/CloudArchitecture';

# 部署到雲端（AWS、GCP、Azure） {#deploy-to-cloud-aws-gcp-azure}

在 AWS、Google Cloud 或 Azure 上於正式環境執行 LiteLLM proxy 的逐步指南。共有兩條支援路徑。如果您使用 Kubernetes，請在 EKS、GKE 或 AKS 上[透過 Helm 部署](#deploy-with-helm)；各雲端上的安裝方式相同，只有資料儲存與 ingress 不同。如果您不使用 Kubernetes，AWS 與 GCP 提供可建立完整堆疊的[官方 Terraform 模組](#deploy-with-terraform-aws-and-gcp)；Azure 沒有 Terraform 模組，因此在那裡支援的路徑是搭配 Helm 的 AKS。

## 架構 {#architecture}

<CloudArchitectureSelector />

LiteLLM 提供兩種部署模式：

- **單體式**：單一 `litellm` 映像提供 LLM 流量、管理 API 與 UI。這是 `litellm-helm` chart 的執行方式，也是最容易操作的方式。
- **微服務式**：`gateway`（LLM 流量，port 4000）、`backend`（管理 API 與 UI 後端，port 4001）以及 `ui`（port 3000），各自獨立部署與擴展。這是元件化 `litellm` chart 與兩個 Terraform 模組的執行方式；請參閱[Microservices Helm](./microservices_helm.md) 取得完整參考。

支援基礎設施在任一模式下都相同：

| 元件 | 用途 | 備註 |
|---|---|---|
| LiteLLM 服務 | 單一 proxy deployment（單體式）或 gateway + backend + ui（微服務式） | 無狀態；在負載平衡器後方執行 2 個以上副本 |
| PostgreSQL | 金鑰、團隊、使用者、支出記錄、設定 | proxy 的驗證與追蹤功能所必需 |
| Redis | 速率限制、路由器狀態、跨執行個體快取 | 當您執行超過一個執行個體時就需要 |
| Migration job | 對 Postgres 套用 schema migration | 每次升級執行一次；proxy 執行個體設定 `DISABLE_SCHEMA_UPDATE=true` |

## 核心設定 {#core-configuration}

```bash
DATABASE_URL="postgresql://user:password@host:5432/litellm"
LITELLM_MASTER_KEY="sk-..."   # admin key for the proxy
LITELLM_SALT_KEY="sk-..."     # encrypts provider credentials stored in the DB. Set once, never change it
DISABLE_SCHEMA_UPDATE="true"  # proxy instances never run migrations; the migrations job does
STORE_MODEL_IN_DB="True"      # manage models from the Admin UI instead of config files
```

`LITELLM_SALT_KEY` 在您新增模型之後無法輪替：它會加密儲存在資料庫中的提供者憑證，而變更它會使這些憑證無法讀取。請產生強度足夠的隨機值，並將兩個金鑰都儲存在雲端的秘密管理服務中。

官方映像發布於 `ghcr.io/berriai`，並鏡像到 `docker.litellm.ai/berriai`。對於使用 Postgres 的單體式部署，請使用 `ghcr.io/berriai/litellm-database`（它內含 Prisma 工具鏈），並固定版本標籤，而不是 `latest` 或會變動的標籤，如此回復才具確定性。

## 佈建資料儲存 {#provision-the-data-stores}

Helm 路徑需要一個 PostgreSQL 資料庫與一個可從您的叢集連線的 Redis。請使用受管理服務：

<Tabs>
<TabItem value="aws" label="AWS">

在與您的 EKS 叢集相同的 VPC 中佈建 [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html) 與 [ElastiCache Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)，並設定安全群組允許叢集節點透過 5432 與 6379 連線。

</TabItem>
<TabItem value="gcp" label="Google Cloud">

在您的 GKE 叢集所使用的 VPC 上，使用私有 IP 佈建 [Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres) 與 [Memorystore Redis](https://cloud.google.com/memorystore/docs/redis)（Cloud SQL 需要 [Private Services Access](https://cloud.google.com/vpc/docs/private-services-access)）。將這些執行個體的私有 IP 作為下方的端點。

</TabItem>
<TabItem value="azure" label="Azure">

```bash
az group create --name litellm-prod --location eastus

az aks create --resource-group litellm-prod --name litellm-aks \
  --node-count 3 --enable-managed-identity

az postgres flexible-server create --resource-group litellm-prod \
  --name litellm-db --database-name litellm \
  --tier GeneralPurpose --sku-name Standard_D2ds_v5

az redis create --resource-group litellm-prod --name litellm-redis \
  --location eastus --sku Standard --vm-size c1
```

文件：[AKS](https://learn.microsoft.com/en-us/azure/aks/what-is-aks)、[Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview)、[Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview)。Azure Cache for Redis 在 6380 埠提供 TLS，且 TLS 透過 URL scheme 啟用：不要使用 `redis_host` 與 `redis_port`，而是在 `router_settings` 下設定 `redis_url: "rediss://:<access-key>@litellm-redis.redis.cache.windows.net:6380"`（`rediss://` scheme 會開啟 TLS）。

</TabItem>
</Tabs>

## 使用 Helm 部署 {#deploy-with-helm}

先建立兩個 chart 都會消耗的秘密：

```bash
kubectl create secret generic litellm-masterkey \
  --from-literal=masterkey="sk-$(openssl rand -hex 24)"

kubectl create secret generic litellm-db \
  --from-literal=username=litellm \
  --from-literal=password="<database-password>"

kubectl create secret generic litellm-env \
  --from-literal=LITELLM_SALT_KEY="sk-$(openssl rand -hex 24)" \
  --from-literal=REDIS_PASSWORD="<redis-password>" \
  --from-literal=OPENAI_API_KEY="<provider-key>"
```

接著選擇部署模式：

<Tabs>
<TabItem value="monolith" label="單體式（litellm-helm）">

```yaml title="values.yaml"
replicaCount: 3

image:
  repository: ghcr.io/berriai/litellm-database
  tag: "v1.90.2"          # pin your version

masterkeySecretName: litellm-masterkey
masterkeySecretKey: masterkey

db:
  useExisting: true
  deployStandalone: false
  endpoint: "<postgres-endpoint>"
  database: litellm
  secret:
    name: litellm-db
    usernameKey: username
    passwordKey: password

environmentSecrets:
  - litellm-env

proxy_config:
  model_list:
    - model_name: gpt-4o
      litellm_params:
        model: openai/gpt-4o
        api_key: os.environ/OPENAI_API_KEY
  router_settings:
    redis_host: "<redis-endpoint>"
    redis_port: 6379
    redis_password: os.environ/REDIS_PASSWORD
```

```bash
helm install litellm oci://ghcr.io/berriai/litellm-helm -f values.yaml
```

此 chart 位於 [`deploy/charts/litellm-helm`](https://github.com/BerriAI/litellm/tree/main/deploy/charts/litellm-helm)；已發布的 chart 版本會帶有 LiteLLM 版本號（例如 `1.90.2`），而 `helm show values oci://ghcr.io/berriai/litellm-helm` 列出所有設定項。除了上述值之外，它也支援自動擴縮（`autoscaling.*` 或 `keda.*`）、PodDisruptionBudgets（`pdb.*`）、Prometheus ServiceMonitor（`serviceMonitor.*`）、讀取副本路由（`db.readReplicaUrl`，請參閱 [Database Read Replica](./db_read_replica.md)）、關閉時優雅排空（`lifecycle`），以及用於 migration job 的 ArgoCD 或 Helm hooks（`migrationJob.hooks.*`，請參閱 [Helm PreSync hooks](./prod.md#7-use-helm-presync-hook-for-database-migrations-beta)）。

</TabItem>
<TabItem value="micro" label="微服務式（litellm）">

```yaml title="values.yaml"
masterKey:
  secretName: litellm-masterkey
  secretKey: masterkey

database:
  writer:
    host: "<postgres-endpoint>"
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-db
      usernameKey: username
      passwordKey: password
  # optional: add database.reader to route reads to a replica

redis:
  host: "<redis-endpoint>"
  port: 6379
  passwordSecret:
    name: litellm-env
    passwordKey: REDIS_PASSWORD

# one host fronting gateway, backend, and ui
ingress:
  enabled: true
  className: "<alb | gce | azure-application-gateway>"
  host: llm.example.com
```

```bash
helm upgrade --install litellm \
  oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.89.2 \
  -f values.yaml
```

這會將 `gateway`、`backend` 與 `ui` 以分離服務方式部署，並可針對各元件自動擴縮，因此您可以讓許多 gateway 副本對接一個小型固定 backend。這需要外部 Postgres 與 Redis（不含內建子 chart），並支援讀取/寫入資料庫分割、IAM 資料庫驗證，以及 Redis Cluster 模式。完整 values 參考請見 [Microservices Helm](./microservices_helm.md)。

</TabItem>
</Tabs>

兩個 chart 都會自動執行 migrations job，並讓 `DISABLE_SCHEMA_UPDATE=true` 保持在 proxy pod 上。透過您雲端的 ingress 來公開服務：EKS 上使用 [AWS Load Balancer Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)、GKE 上使用 [GKE Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)，或 AKS 上使用 [Application Gateway Ingress (AGIC)](https://learn.microsoft.com/en-us/azure/application-gateway/ingress-controller-overview)，並將健康檢查設在 `/health/readiness`，然後把您的 DNS 記錄指向產生的負載平衡器。關於秘密，請優先使用雲端的秘密管理服務，而不是純 Kubernetes secrets（例如 AKS 上的 [Key Vault CSI driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)）；chart 會消耗您掛載的任何 secret。

## 使用 Terraform 部署（AWS 與 GCP） {#deploy-with-terraform-aws-and-gcp}

官方模組會部署完整的微服務堆疊（網路、資料庫、Redis、物件儲存、秘密、運算、負載平衡器，以及在服務啟動前執行的 migrations job），並發布到 Terraform Registry：

- [`BerriAI/litellm/aws`](https://registry.terraform.io/modules/BerriAI/litellm/aws/latest)
- [`BerriAI/litellm/google`](https://registry.terraform.io/modules/BerriAI/litellm/google/latest)

<Tabs>
<TabItem value="aws" label="AWS (ECS Fargate)">

佈建一個包含公用與私有子網路的 VPC、一個 Aurora PostgreSQL 叢集（writer 加 reader，IAM 資料庫驗證）、ElastiCache Redis（multi-AZ、加密）、一個 S3 bucket、Secrets Manager 項目、Application Load Balancer，以及 ECS Fargate 服務。

```hcl title="main.tf"
module "litellm" {
  source  = "BerriAI/litellm/aws"
  version = "~> 1.90"

  region = "us-east-1"
  azs    = ["us-east-1a", "us-east-1b"]
  tenant = "acme"
  env    = "prod"

  ui_password         = var.ui_password
  litellm_license     = var.litellm_license      # optional, omit for open source
  acm_certificate_arn = var.acm_certificate_arn  # TLS is required by default

  proxy_config = {
    model_list = [{
      model_name = "gpt-4o"
      litellm_params = {
        model   = "openai/gpt-4o"
        api_key = "os.environ/OPENAI_API_KEY"
      }
    }]
  }
  gateway_extra_secrets = {
    OPENAI_API_KEY = var.openai_key_secret_arn
  }
}
```

在您套用之前：請先在 [AWS Certificate Manager](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html) 佈建 TLS 憑證（若您未明確設定 `allow_plaintext_alb = true`，此模組會拒絕純文字 ALB），並先在 [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) 建立任何提供者金鑰秘密，因為 `gateway_extra_secrets` 會取得它們的 ARN。套用後，請將您的 DNS 記錄指向 ALB 主機名稱。

若您未提供 master key，模組會自動將其產生到 Secrets Manager。應用程式透過短效 IAM token 連線到 Aurora，因此其 `DATABASE_URL` 不含密碼（資料庫 master password 本身會產生到 Secrets Manager，且絕不會傳入應用程式）。每個資源都以 `<tenant>-litellm-<env>` 命名，而模組未宣告任何 provider，因此您可以將其 `for_each` 來為每個租戶執行一個堆疊。

</TabItem>
<TabItem value="gcp" label="Google Cloud (Cloud Run)">

佈建一個包含 Private Services Access 的 VPC、Cloud SQL PostgreSQL（主節點加讀取副本）、支援 TLS 的 Memorystore Redis、一個 GCS bucket、Secret Manager 項目、Cloud Run 服務，以及具備 serverless NEG 的全球 HTTPS 負載平衡器。

```hcl title="main.tf"
module "litellm" {
  source  = "BerriAI/litellm/google"
  version = "~> 1.90"

  project_id = "my-project"
  region     = "us-central1"
  tenant     = "acme"
  env        = "prod"

  ui_password     = var.ui_password
  litellm_license = var.litellm_license  # optional

  # Cloud Run cannot pull from ghcr.io. Point this at an Artifact Registry
  # remote repository backed by ghcr.io, or mirror the images.
  image_registry = "us-central1-docker.pkg.dev/my-project/ghcr-remote/berriai"

  lb_domains = ["llm.example.com"]

  proxy_config = {
    model_list = [{
      model_name = "gemini-2.5-pro"
      litellm_params = { model = "vertex_ai/gemini-2.5-pro" }
    }]
  }
}
```

關於 GCP 有三點注意事項。第一，務必覆寫 `image_registry`：其預設為 `ghcr.io/berriai`，而 Cloud Run 無法從該位置拉取，因此 apply 會成功，但服務會在映像拉取時失敗。請將其指向一個可代理 `ghcr.io` 的 [Artifact Registry 遠端儲存庫](https://cloud.google.com/artifact-registry/docs/repositories/remote-overview)。第二，資料庫使用透過 Secret Manager 的密碼驗證，而非 IAM 驗證；LiteLLM 的 IAM token 支援是 AWS RDS 專用。第三，apply 完成後，請為 `lb_domains` 建立 DNS 記錄並指向負載平衡器 IP；在網域解析到該 IP 之前，[Google 管理的憑證](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs) 不會完成佈建。

</TabItem>
</Tabs>

## 驗證部署 {#verify-the-deployment}

確認 proxy 已啟動且可連線到其資料庫：

```bash
curl -s https://llm.example.com/health/readiness
```

接著前往 `https://llm.example.com/ui` 的 Admin UI，並使用您的 master key 登入。

1. **新增模型。** 前往 **Models + Endpoints** 並點擊 **Add Model**：選擇提供者、模型，並輸入提供者憑證。使用 `STORE_MODEL_IN_DB=True` 時，模型會儲存到您的資料庫，因此您會在這裡而非在設定檔中管理模型。

<Image img={require('../../img/ui_add_model_form.png')} alt="在 LiteLLM Admin UI 中新增模型" />

2. **建立金鑰。** 前往 **Virtual Keys** 並點擊 **Create New Key**，將範圍限定為您剛新增的模型。

<Image img={require('../../img/ui_create_key_modal.png')} alt="在 LiteLLM Admin UI 中建立虛擬金鑰" />

3. **送出請求。** 前往 **Test Key** playground，選擇您的金鑰與模型，並傳送訊息。此處的回應證明完整路徑：負載平衡器、proxy、資料庫，以及提供者憑證。

<Image img={require('../../img/ui_playground_navigation.png')} alt="LiteLLM Admin UI 中的 Test Key playground" />

## 下一步 {#next-steps}

使用 [production checklist](./prod.md)（worker 數量、機器大小、Redis 設定、優雅降級）來強化部署。使用 [Multi-Region Deployment](./multi_region.md) 新增區域。若吞吐量非常高（1000+ RPS），請參閱 [resolving DB deadlocks](./db_deadlocks.md)。
