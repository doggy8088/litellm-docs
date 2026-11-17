---
title: 使用 Terraform 部署
sidebar_label: Terraform
toc_max_heading_level: 3
description: 在 AWS ECS Fargate 或 Google Cloud Run 上部署 LiteLLM。查詢 Terraform 模組的輸入與預設值。
---

import styles from '@site/src/css/moduleReference.module.css';

# 使用 Terraform 部署 {#deploy-with-terraform}

{/* keep-version-note */}

## 前置條件 {#prerequisites}

使用 Terraform 1.9 或更新版本以及 Bash。為 Terraform 設定雲端憑證，並完成 AWS 或 Google Cloud CLI 的驗證。

兩個模組預設都會建立公開的負載平衡器。部署前，請先套用 [AWS 私有入口變更](./cloud/aws.md#ecs-module-changes) 或 [GCP 私有入口變更](./cloud/gcp.md#cloud-run-module-changes)。

這些模組會建立 PostgreSQL 與 Redis。請使用[規模指南](./sizing.md)來選擇它們的容量。

## 部署模組 {#deploy-the-module}

將您雲端平台的範例儲存為 `main.tf`。將 `source` 設定為包含您私有入口變更的模組位置與版本。

### AWS {#aws}

為您的公司主機名稱提供 ACM 憑證。選擇您的 AWS 區域支援的 Aurora PostgreSQL 16 版本。請參閱 [AWS 參考架構](./cloud/aws.md)。

```hcl title="main.tf"
provider "aws" {
  region = "us-east-1"
}

variable "acm_certificate_arn" {
  type = string
}

variable "db_engine_version" {
  type = string
}

module "litellm" {
  source = "git::https://git.example.com/platform/litellm.git//terraform/litellm/aws?ref=DEPLOYMENT_VERSION"

  region = "us-east-1"
  azs    = ["us-east-1a", "us-east-1b"]
  tenant = "acme"
  env    = "prod"

  image               = "ghcr.io/berriai/litellm:lts"
  acm_certificate_arn = var.acm_certificate_arn
  db_engine_version   = var.db_engine_version

  gateway_extra_env = { STORE_MODEL_IN_DB = "True" }
}

output "alb_dns_name" {
  value = module.litellm.alb_dns_name
}
```

套用後，將您的私有 DNS 記錄指向 `alb_dns_name`。

### GCP {#gcp}

啟用[必要的 API](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/examples/default/TUTORIAL.md#enable-required-apis)。將 LiteLLM `lts` 映像提供給 Artifact Registry 使用，並授予 Cloud Run 服務代理程式拉取該映像的權限。請參閱 [GCP 參考架構](./cloud/gcp.md)。

```hcl title="main.tf"
provider "google" {
  project = "my-project"
  region  = "us-central1"
}

provider "google-beta" {
  project = "my-project"
  region  = "us-central1"
}

variable "litellm_image" {
  type        = string
  description = "LiteLLM image URI in Artifact Registry."
}

module "litellm" {
  source = "git::https://git.example.com/platform/litellm.git//terraform/litellm/gcp?ref=DEPLOYMENT_VERSION"

  project_id = "my-project"
  region     = "us-central1"
  tenant     = "acme"
  env        = "prod"

  image      = var.litellm_image
  lb_domains = ["llm.corp.example.com"]

  gateway_extra_env = { STORE_MODEL_IN_DB = "True" }
}

output "lb_ip" {
  value = module.litellm.lb_ip
}
```

套用後，將 `lb_domains` 的私有 DNS 記錄指向 `lb_ip`。

### 套用 {#apply}

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

使用[健康檢查](../health.md)驗證部署。


## 輸入參考 {#inputs-reference}

查看所有 [AWS 輸入](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/aws/variables.tf) 與 [GCP 輸入](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/variables.tf)。

<div className={styles.reference}>

<details>
<summary>AWS 網路與資料</summary>

| 輸入 | 預設值 | 說明 |
| --- | --- | --- |
| `region`, `tenant`, `env` | 必填 | 部署使用的 AWS 區域與名稱。 |
| `tags` | `{}` | 模組資源的標籤。 |
| `vpc_id` | `""` | 現有的 VPC ID。留空會建立 VPC、子網路與 NAT 閘道。使用現有 VPC 時需提供路由。 |
| `vpc_cidr`, `azs` | `"10.40.0.0/16"`, `[]` | 新 VPC 的位址範圍與可用區域。由模組建立 VPC 時，至少設定兩個可用區域。 |
| `public_subnet_ids`, `private_subnet_ids` | `[]`, `[]` | 使用現有 VPC 時必填。至少使用兩個可用區域。上游模組將公開 ALB 放在公開子網路，任務與資料儲存放在私有子網路。 |
| `additional_task_security_group_ids` | `[]` | ECS 任務的額外安全群組。 |
| `acm_certificate_arn`, `allow_plaintext_alb` | `""`, `false` | 提供 ACM 憑證以啟用 HTTPS。預設會拒絕僅使用 HTTP 的負載平衡器。 |
| `create_database`, `database_url` | `true`, `""` | 建立 Aurora。將第一個值設為 `false` 並提供連線 URL，即可使用現有資料庫。 |
| `db_instance_class`, `db_engine_version` | `"db.r6g.large"`, `"16.4"` | Aurora 執行個體類別與 PostgreSQL 版本。請選擇您區域可用的版本。 |
| `db_name`, `db_username` | `"litellm"`, `"litellm_app"` | 資料庫名稱與 IAM 應用程式使用者。 |
| `create_redis`, `redis_url` | `true`, `""` | 建立 ElastiCache。將第一個值設為 `false` 並提供連線 URL，即可使用現有的 Redis。 |
| `redis_node_type`, `redis_num_replicas` | `"cache.t4g.small"`, `1` | Redis 節點類型與複本數量（主要節點之外）。 |
| `skip_final_snapshot`, `s3_force_destroy` | `false`, `false` | 控制最終資料庫快照，以及非空 S3 儲存貯體的刪除。 |

</details>

<details>
<summary>AWS 執行階段與設定</summary>

| 輸入 | 預設值 | 說明 |
| --- | --- | --- |
| `image` | `""` | 所有元件的完整映像 URI。會覆寫 registry 與 tag 輸入。 |
| `image_registry`, `image_tag` | `"ghcr.io/berriai"`, `""` | 映像 URI 的組成形式為 `registry/litellm:tag`。提供 tag 或完整的 `image` URI。 |
| `gateway_cpu`, `gateway_memory`, `gateway_desired_count` | `1024`, `4096`, `2` | 閘道的 CPU 單位、記憶體（MiB）與初始任務數量。 |
| `backend_cpu`, `backend_memory`, `backend_desired_count` | `1024`, `4096`, `1` | 後端的 CPU 單位、記憶體（MiB）與初始任務數量。 |
| `ui_cpu`, `ui_memory`, `ui_desired_count` | `256`, `512`, `1` | UI 的 CPU 單位、記憶體（MiB）與初始任務數量。 |
| `gateway_num_workers` | `1` | 每個任務的閘道 worker 數量。 |
| `gateway_connection_pool_enabled`, `gateway_pool_max_db_connections`, `gateway_pool_max_client_conn` | `false`, `20`, `1000` | 啟用 PgBouncer 並設定其資料庫與用戶端連線上限。 |
| `gateway_autoscaling_enabled`, `gateway_min_capacity`, `gateway_max_capacity` | `true`, `1`, `10` | 啟用閘道自動擴展並設定其任務範圍。自動擴展在部署後控制數量。 |
| `gateway_cpu_target`, `gateway_memory_target` | `70`, `80` | 目標 CPU 與記憶體使用率（百分比）。記憶體目標為 `0` 時停用該政策。 |
| `gateway_target_requests_per_second`, `gateway_target_tokens_per_second`, `gateway_tokens_metric` | `0`, `0`, `null` | 選用的每任務流量目標。Token 目標需要 CloudWatch 指標定義。 |
| `backend_autoscaling_enabled`, `backend_min_capacity`, `backend_max_capacity`, `backend_cpu_target` | `true`, `1`, `4`, `70` | 後端自動擴展、任務範圍與目標 CPU 百分比。 |
| `ui_autoscaling_enabled`, `ui_max_instances`, `ui_max_capacity`, `ui_cpu_target` | `false`, `1`, `3`, `80` | UI 自動擴展、任務範圍與目標 CPU 百分比。 |
| `litellm_master_key`, `litellm_license`, `ui_password` | `""` each | 主金鑰留空時會自動產生一組金鑰。授權與 UI 密碼為選用。模組將這些值儲存在 Secrets Manager。 |
| `proxy_config` | `{}` | 閘道與後端共用的 [LiteLLM 設定](../configuration/overview.md)。模組將其儲存在 S3。設定變更會建立新的任務定義。 |
| `gateway_extra_env`, `backend_extra_env` | `{}` each | 各元件的額外非機密環境變數。 |
| `gateway_extra_secrets`, `backend_extra_secrets` | `{}` each | 將環境變數名稱對應到 Secrets Manager ARN。將共用的模型憑證加入兩個對應表。 |
| `gateway_metrics_port`, `gateway_metrics_scrape_cidrs` | `null`, `[]` | 選用的指標 sidecar 連接埠與允許的擷取器 CIDR。Sidecar 沒有金鑰驗證。 |
| `otel_endpoint`, `otel_exporter`, `otel_headers_secret_arn` | `""`, `"otlp_http"`, `""` | 以端點啟用 OpenTelemetry。可選用提供匯出器標頭的 Secrets Manager ARN。 |
| `collector_enabled` | `false` | 啟用花費記錄收集器 sidecar。 |
| `log_retention_days` | `30` | CloudWatch 記錄保留天數。 |

</details>

<details>
<summary>GCP 網路與資料</summary>

| 輸入 | 預設值 | 說明 |
| --- | --- | --- |
| `project_id`, `tenant`, `env` | 必填 | 部署使用的 Google Cloud 專案 ID 與名稱。 |
| `region`, `labels` | `"us-central1"`, `{}` | 區域與資源標籤。 |
| `network_id` | `""` | 現有的 VPC 資源 ID。留空會建立 VPC 與子網路。Cloud Run 的連接器需要部署專案中的網路。 |
| `create_psa_connection` | `true` | 為 Cloud SQL 與 Memorystore 建立 Private Services Access。現有網路已有此連線時設為 `false`。 |
| `subnet_cidr`, `vpc_connector_cidr` | `"10.40.0.0/16"`, `"10.41.0.0/28"` | 新子網路與 Serverless VPC Access 連接器的範圍。連接器需要 `/28`。 |
| `lb_domains`, `allow_plaintext_lb` | `[]`, `false` | 上游公開負載平衡器受管理憑證使用的網域。預設會拒絕僅使用 HTTP 的負載平衡器。 |
| `db_tier`, `db_edition`, `db_version` | `"db-custom-2-7680"`, `"ENTERPRISE"`, `"POSTGRES_16"` | Cloud SQL 的 tier、edition 與 PostgreSQL 版本。請選擇支援所選 edition 的 tier。 |
| `db_name`, `db_username` | `"litellm"`, `"litellm_app"` | 資料庫名稱與應用程式使用者。 |
| `redis_tier`, `redis_memory_size_gb` | `"STANDARD_HA"`, `1` | Memorystore 可用性層級與記憶體（GiB）。 |
| `redis_transit_encryption` | `true` | 啟用 Redis TLS 並將其設定注入 Cloud Run。 |
| `cloudsql_deletion_protection`, `gcs_force_destroy` | `true`, `false` | 保護 Cloud SQL 免於刪除，並控制非空 GCS 儲存貯體的刪除。 |

</details>

<details>
<summary>GCP 執行階段與設定</summary>

| 輸入 | 預設值 | 說明 |
| --- | --- | --- |
| `create_runtime` | `true` | 建立 Cloud Run、負載平衡器、連接器與遷移工作。設為 `false` 時，使用 [Helm](./helm.md) 另外部署執行階段。 |
| `image` | `""` | 所有元件的完整映像 URI。使用 Cloud Run 可拉取的映像，例如 Artifact Registry URI。 |
| `image_registry`, `image_tag` | `"ghcr.io/berriai"`, `""` | 映像 URI 的組成形式為 `registry/litellm:tag`。Cloud Run 無法直接拉取預設的 GHCR registry。 |
| `gateway_cpu`, `gateway_memory` | `"1000m"`, `"4Gi"` | 每個閘道執行個體的 CPU 與記憶體。 |
| `backend_cpu`, `backend_memory` | `"1000m"`, `"4Gi"` | 每個後端執行個體的 CPU 與記憶體。 |
| `ui_cpu`, `ui_memory` | `"1000m"`, `"512Mi"` | 每個 UI 執行個體的 CPU 與記憶體。 |
| `gateway_min_instances`, `gateway_max_instances`, `gateway_max_instance_request_concurrency` | `1`, `10`, `80` | 閘道執行個體範圍與每個執行個體的最大並行請求數。 |
| `backend_min_instances`, `backend_max_instances`, `backend_max_instance_request_concurrency` | `1`, `4`, `80` | 後端執行個體範圍與每個執行個體的最大並行請求數。 |
| `ui_min_instances`, `ui_max_instances`, `ui_max_instance_request_concurrency` | `1`, `3`, `200` | UI 執行個體範圍與每個執行個體的最大並行請求數。 |
| `gateway_num_workers` | `1` | 每個執行個體的閘道 worker 數量。 |
| `gateway_connection_pool_enabled`, `gateway_pool_max_db_connections`, `gateway_pool_max_client_conn` | `false`, `20`, `1000` | 啟用 PgBouncer 並設定其資料庫與用戶端連線上限。 |
| `litellm_master_key`, `litellm_license`, `ui_password` | `""` each | 主金鑰留空時會自動產生一組金鑰。授權與 UI 密碼為選用。模組將這些值儲存在 Secret Manager。 |
| `proxy_config` | `{}` | 閘道與後端透過 GCS 磁碟區共用的 [LiteLLM 設定](../configuration/overview.md)。設定變更會建立新的 Cloud Run 修訂版本。 |
| `gateway_extra_env`, `backend_extra_env` | `{}` each | 各元件的額外非機密環境變數。 |
| `gateway_extra_secrets`, `backend_extra_secrets` | `{}` each | 將環境變數名稱對應到不含版本後綴的 Secret Manager secret ID。模組讀取 `latest`。將共用的模型憑證加入兩個對應表。 |
| `gateway_metrics_port` | `null` | 選用的指標 sidecar 連接埠。收集器 sidecar 將其指標匯出至 Cloud Monitoring。 |
| `otel_endpoint`, `otel_exporter`, `otel_headers_secret` | `""`, `"otlp_http"`, `""` | 以端點啟用 OpenTelemetry。可選用提供匯出器標頭的 Secret Manager secret ID。 |
| `collector_enabled` | `false` | 啟用花費記錄收集器 sidecar。 |

</details>

</div>
