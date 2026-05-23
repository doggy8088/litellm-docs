import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploy LiteLLM on AWS (ECS Fargate) via Terraform

Deploy the **componentized** LiteLLM proxy — gateway, backend, and UI as three independently scalable services — on **AWS ECS Fargate** using the official LiteLLM Terraform stack.

| Resource | Details |
|---|---|
| Compute | ECS Fargate (serverless containers) |
| Database | Aurora PostgreSQL with IAM auth (writer + reader) |
| Cache | ElastiCache Redis (multi-AZ, in-transit + at-rest encryption) |
| Object store | S3 (versioned, SSE-S3) |
| Load balancer | Application Load Balancer (path-based routing) |
| Secrets | AWS Secrets Manager |

:::info Source

The Terraform module lives at [`terraform/litellm/aws/`](https://github.com/BerriAI/litellm/tree/main/terraform/litellm/aws) in the LiteLLM repository.

:::

## Architecture

```
                    ┌───────────────────────────────────────┐
                    │            Public Internet            │
                    └─────────────────┬─────────────────────┘
                                      │ HTTP/80 (or HTTPS/443)
                      ┌───────────────▼───────────────┐
                      │   Application Load Balancer   │
                      │   (path-routing listener)     │
                      └─┬─────────────┬─────────────┬─┘
                        │             │             │
        UI assets, /    │  /v1/chat,  │   /key/*    │
        /_next/*, …     │  /v1/embed, │   /user/*   │
                        │  …          │   …         │
          ┌─────────────▼───┐  ┌──────▼──────┐  ┌───▼──────────────┐
          │    ECS Service  │  │ ECS Service │  │   ECS Service    │
          │       (ui)      │  │  (gateway)  │  │    (backend)     │
          │   Fargate :3000 │  │ Fargate:4000│  │  Fargate :4001   │
          └─────────────────┘  └──────┬──────┘  └────────┬─────────┘
                                      │                  │
          ┌─── private subnets ────────────────────────────────────┐
          │   ┌────────────────────────┐    ┌────────────────┐    │
          │   │  Aurora PostgreSQL     │    │  ElastiCache   │    │
          │   │  (IAM auth)            │    │  Redis (HA)    │    │
          │   │  writer + reader       │    └────────────────┘    │
          │   └────────────────────────┘    ┌────────────────┐    │
          │   ┌────────────────────────┐    │  S3 bucket     │    │
          │   │  Secrets Manager       │    │  (versioned)   │    │
          │   │  • LITELLM_MASTER_KEY  │    └────────────────┘    │
          │   │  • DB master password  │    ┌────────────────┐    │
          │   │  • user API keys       │    │ ECS Task:      │    │
          │   └────────────────────────┘    │ prisma migrate │    │
          └─── VPC ──────────────────────────────────────────┘
                    │ NAT gateway
                    ▼ egress to LLM providers
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and authenticated (`aws configure`)
- At least 2 AWS availability zones available in your target region

## Quick start

### Step 1 — Clone and enter the module

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm/terraform/litellm/aws
```

### Step 2 — Create your `terraform.tfvars`

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your settings:

```hcl
region = "us-west-2"
azs    = ["us-west-2a", "us-west-2b"]

tenant = "acme"   # used as prefix for all AWS resources
env    = "prod"   # e.g. dev, stage, prod
```

### Step 3 — Supply sensitive values via env vars

```bash
export TF_VAR_litellm_master_key="sk-..."   # optional; auto-generated if omitted
export TF_VAR_litellm_license="lic-..."     # optional; omit for OSS-only
```

### Step 4 — Configure TLS (recommended for production)

**Production** — provide an ACM certificate:

```hcl
# terraform.tfvars
acm_certificate_arn = "arn:aws:acm:us-west-2:111122223333:certificate/..."
```

**Trial/dev** — explicitly opt into HTTP-only:

```hcl
# terraform.tfvars
allow_plaintext_alb = true
```

### Step 5 — Apply

```bash
terraform init
terraform apply
```

A single `terraform apply` provisions everything, runs the Aurora DB user bootstrap, runs the Prisma schema migration, and only then starts the gateway/backend services. When it returns, the stack is serving traffic.

### Step 6 — Verify

```bash
# Get the ALB URL
terraform output alb_url

# Get the auto-generated master key
aws secretsmanager get-secret-value \
  --secret-id "$(terraform output -raw master_key_secret_arn)" \
  --query SecretString --output text

# Test the API
curl http://$(terraform output -raw alb_url)/health
```

UI login: **admin** / `<master key>`

## Configure LiteLLM

### `proxy_config` (mirrors the Helm chart)

Use `proxy_config` to pass a `config.yaml`-equivalent as a Terraform variable:

```hcl
proxy_config = {
  model_list = [
    {
      model_name = "gpt-4o"
      litellm_params = {
        model   = "openai/gpt-4o"
        api_key = "os.environ/OPENAI_API_KEY"
      }
    },
    {
      model_name = "claude-sonnet-4-6"
      litellm_params = {
        model   = "anthropic/claude-sonnet-4-6"
        api_key = "os.environ/ANTHROPIC_API_KEY"
      }
    },
  ]
  general_settings = {
    master_key   = "os.environ/LITELLM_MASTER_KEY"
    database_url = "os.environ/DATABASE_URL"
  }
}
```

LiteLLM resolves `os.environ/<NAME>` against the container environment at runtime.

### Extra env vars (non-sensitive)

```hcl
gateway_extra_env = {
  LANGFUSE_HOST = "https://us.cloud.langfuse.com"
}

backend_extra_env = {
  STORE_MODEL_IN_DB            = "True"
  AUTO_REDIRECT_UI_LOGIN_TO_SSO = "true"
}
```

### Provider API keys (from Secrets Manager)

Store API keys in Secrets Manager first, then reference them by ARN:

```bash
aws secretsmanager create-secret \
  --name openai-api-key \
  --secret-string "sk-proj-..."
```

```hcl
gateway_extra_secrets = {
  OPENAI_API_KEY    = "arn:aws:secretsmanager:us-west-2:111122223333:secret:openai-api-key-AbCdEf"
  ANTHROPIC_API_KEY = "arn:aws:secretsmanager:us-west-2:111122223333:secret:anthropic-api-key-GhIjKl"
}
```

The task execution role automatically gains `secretsmanager:GetSecretValue` on every ARN listed.

To extract a single field from a JSON secret:

```hcl
gateway_extra_secrets = {
  OPENAI_API_KEY = "arn:…:secret:provider-keys-AbCdEf:openai_api_key::"
}
```

## Container images

The module defaults to `ghcr.io/berriai/litellm-<component>:v1.86.0-dev` for each of the four images (`gateway`, `backend`, `ui`, `migrations`). **Pin to a specific tag for production.**

```hcl
gateway_image    = "ghcr.io/berriai/litellm-gateway:v1.86.0"
backend_image    = "ghcr.io/berriai/litellm-backend:v1.86.0"
ui_image         = "ghcr.io/berriai/litellm-ui:v1.86.0"
migrations_image = "ghcr.io/berriai/litellm-migrations:v1.86.0"
```

**Private registries:**

- **ECR (same account):** the task execution role already has `AmazonECSTaskExecutionRolePolicy`, which grants ECR pull. No extra config needed.
- **ECR (cross-account):** attach a policy allowing `ecr:GetAuthorizationToken` + `ecr:BatchGetImage` on the foreign repo ARNs.

## Scaling

### Per-service sizing

```hcl
# Gateway (LLM data plane — scale this most)
gateway_cpu           = 2048   # 2 vCPU
gateway_memory        = 8192   # 8 GiB
gateway_num_workers   = 5      # uvicorn workers (≈ 2×vCPU + 1)
gateway_desired_count = 3

# Backend (management API)
backend_cpu    = 1024
backend_memory = 4096

# UI (static nginx — typically 1 task is enough)
ui_cpu    = 256
ui_memory = 512
```

### Autoscaling

```hcl
gateway_autoscaling_enabled = true
gateway_min_capacity        = 1
gateway_max_capacity        = 10
gateway_cpu_target          = 70   # scale out at 70% CPU
gateway_memory_target       = 80   # scale out at 80% memory

backend_autoscaling_enabled = true
backend_min_capacity        = 1
backend_max_capacity        = 4
```

## Multi-tenant deployments

All resources are named `${tenant}-litellm-${env}-<suffix>`, so multiple tenants and environments coexist in the same AWS account:

| `tenant` | `env` | Example resource |
|---|---|---|
| `acme` | `stage` | `acme-litellm-stage-gateway` (ECS service) |
| `acme` | `prod` | `acme-litellm-prod-master-key` (Secrets Manager) |
| `globex` | `dev` | `globex-litellm-dev` (Aurora cluster) |

Per-tenant apply:

```bash
export TF_VAR_litellm_master_key="sk-..."
export TF_VAR_litellm_license="lic-..."

terraform apply \
  -var "region=us-west-2" \
  -var 'azs=["us-west-2a","us-west-2b"]' \
  -var "tenant=acme" \
  -var "env=stage"
```

## Database: Aurora + IAM auth

The Aurora cluster has `iam_database_authentication_enabled = true`. The bootstrap task (run automatically on first `terraform apply`) creates the `litellm_app` Postgres user with `rds_iam` privileges. The gateway and backend then connect using short-lived IAM tokens rather than a static password — no password to rotate.

**Break-glass** access (if you need to re-run manually):

```bash
# Bootstrap SQL — creates the IAM user
terraform output db_bootstrap_sql

# Re-run migration manually
eval "$(terraform output -raw migration_run_command)"
```

## Data retention tripwires

Two opt-in flags guard against accidental data loss on `terraform destroy`:

| Variable | Default | Effect when `false` |
|---|---|---|
| `skip_final_snapshot` | `false` | Aurora takes a final snapshot before destroy |
| `s3_force_destroy` | `false` | Destroy fails if the S3 bucket is non-empty |

Set these to `true` only for ephemeral/CI environments.

## Outputs

| Output | Description |
|---|---|
| `alb_url` | ALB DNS name (access LiteLLM here) |
| `alb_arn` | ALB ARN |
| `master_key_secret_arn` | Secrets Manager ARN for `LITELLM_MASTER_KEY` |
| `db_bootstrap_sql` | Break-glass SQL to re-create the IAM DB user |
| `migration_run_command` | `aws ecs run-task` command to re-run migrations |

## Variable reference

| Variable | Default | Description |
|---|---|---|
| `region` | *(required)* | AWS region |
| `azs` | *(required)* | List of ≥2 AZs |
| `tenant` | *(required)* | Resource name prefix |
| `env` | *(required)* | Environment suffix |
| `litellm_master_key` | `""` (auto-generated) | Pre-set master key (set via `TF_VAR_`) |
| `litellm_license` | `""` | Enterprise license (set via `TF_VAR_`) |
| `ui_password` | `""` | UI admin password (set via `TF_VAR_`) |
| `acm_certificate_arn` | `""` | ACM cert ARN for HTTPS |
| `allow_plaintext_alb` | `false` | Opt into HTTP-only (dev/trial only) |
| `gateway_image` | `ghcr.io/berriai/litellm-gateway:v1.86.0-dev` | Gateway image |
| `backend_image` | `ghcr.io/berriai/litellm-backend:v1.86.0-dev` | Backend image |
| `ui_image` | `ghcr.io/berriai/litellm-ui:v1.86.0-dev` | UI image |
| `migrations_image` | `ghcr.io/berriai/litellm-migrations:v1.86.0-dev` | Migration image |
| `gateway_cpu` | `1024` | Gateway Fargate CPU units (1024 = 1 vCPU) |
| `gateway_memory` | `4096` | Gateway Fargate memory (MiB) |
| `gateway_num_workers` | `1` | uvicorn workers per gateway task |
| `gateway_autoscaling_enabled` | `true` | Enable Application Auto Scaling for gateway |
| `gateway_min_capacity` | `1` | Gateway min task count |
| `gateway_max_capacity` | `10` | Gateway max task count |
| `db_instance_class` | `db.r6g.large` | Aurora instance class |
| `db_engine_version` | `16.4` | Aurora PostgreSQL version |
| `redis_node_type` | `cache.t4g.small` | ElastiCache node type |
| `redis_num_replicas` | `1` | Redis replica count (0 = single-node) |
| `skip_final_snapshot` | `false` | Skip Aurora final snapshot on destroy |
| `s3_force_destroy` | `false` | Allow deleting non-empty S3 bucket on destroy |
| `log_retention_days` | `30` | CloudWatch log retention |
| `proxy_config` | `{}` | LiteLLM proxy config (mirrors `config.yaml`) |
| `gateway_extra_env` | `{}` | Extra env vars for gateway |
| `backend_extra_env` | `{}` | Extra env vars for backend |
| `gateway_extra_secrets` | `{}` | Secrets Manager ARN map for gateway |
| `backend_extra_secrets` | `{}` | Secrets Manager ARN map for backend |

## What's not included

- **Remote state backend:** defaults to local state. Add an `s3` backend block to `versions.tf` for team environments.
- **Custom domains / ACM certificates:** bring your own ACM cert and set `acm_certificate_arn`.
- **Observability beyond CloudWatch:** wire your own Prometheus/Datadog/Langfuse via `*_extra_env`.
