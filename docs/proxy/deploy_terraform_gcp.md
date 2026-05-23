import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploy LiteLLM on GCP (Cloud Run) via Terraform

Deploy the **componentized** LiteLLM proxy — gateway, backend, and UI as three independently scalable services — on **Google Cloud Run** using the official LiteLLM Terraform stack.

| Resource | Details |
|---|---|
| Compute | Cloud Run v2 (serverless, request-driven scaling) |
| Database | Cloud SQL for PostgreSQL (writer + read replica, password auth) |
| Cache | Memorystore Redis (private IP, TLS) |
| Object store | GCS bucket (versioned, uniform IAM) |
| Load balancer | External Global HTTPS Load Balancer |
| Secrets | Secret Manager |

:::info Source

The Terraform module lives at [`terraform/litellm/gcp/`](https://github.com/BerriAI/litellm/tree/main/terraform/litellm/gcp) in the LiteLLM repository.

:::

## Architecture

```
                    ┌───────────────────────────────────────┐
                    │            Public Internet            │
                    └─────────────────┬─────────────────────┘
                                      │ HTTP/80 → 301 HTTPS
                                      │ HTTPS/443
                      ┌───────────────▼───────────────┐
                      │ External HTTPS Load Balancer  │
                      │   (global, URL map routing)   │
                      └─┬─────────────┬─────────────┬─┘
                        │             │             │
                        │ Serverless NEGs (one per Cloud Run service)
                        │             │             │
          ┌─────────────▼───┐  ┌──────▼──────┐  ┌───▼──────────────┐
          │   Cloud Run     │  │  Cloud Run  │  │    Cloud Run     │
          │      (ui)       │  │  (gateway)  │  │    (backend)     │
          │      :3000      │  │   :4000     │  │      :4001       │
          └─────────────────┘  └──────┬──────┘  └────────┬─────────┘
                                      │                  │
                                      │ Serverless VPC Access connector
          ┌─── VPC (private services access range) ──────────────────┐
          │   ┌────────────────────────┐    ┌──────────────────┐    │
          │   │  Cloud SQL PostgreSQL  │    │  Memorystore     │    │
          │   │  writer + read replica │    │  Redis (TLS)     │    │
          │   └────────────────────────┘    └──────────────────┘    │
          │   ┌────────────────────────┐    ┌──────────────────┐    │
          │   │  Secret Manager        │    │  GCS bucket      │    │
          │   │  • LITELLM_MASTER_KEY  │    │  (versioned)     │    │
          │   │  • DB password         │    └──────────────────┘    │
          │   │  • user API keys       │    ┌──────────────────┐    │
          │   └────────────────────────┘    │ Cloud Run Job:   │    │
          │                                  │ prisma migrate   │    │
          └──────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth application-default login`)
- The following GCP APIs enabled in your project:

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com
```

## Container image setup (required for GCP)

Cloud Run only accepts images from Artifact Registry, `gcr.io`, or `docker.io` — it **rejects `ghcr.io` URIs at apply time**. Because LiteLLM's images are published to GHCR, you need to create an Artifact Registry remote repository that proxies GHCR:

```bash
gcloud artifacts repositories create litellm \
  --repository-format=docker \
  --location=us-central1 \
  --mode=remote-repository \
  --remote-repo-config-desc="GitHub Container Registry passthrough" \
  --remote-docker-repo=https://ghcr.io
```

Then reference it in your `terraform.tfvars`:

```hcl
image_registry = "us-central1-docker.pkg.dev/my-gcp-project/litellm/berriai"
image_tag      = "v1.86.0"
```

The four image URIs are composed as `<image_registry>/litellm-<component>:<image_tag>`.

:::tip Air-gapped option

If you can't use a remote repository, mirror the images manually:

```bash
for c in gateway backend ui migrations; do
  docker pull ghcr.io/berriai/litellm-$c:<tag>
  docker tag  ghcr.io/berriai/litellm-$c:<tag> \
              us-central1-docker.pkg.dev/$PROJECT/litellm/$c:<tag>
  docker push us-central1-docker.pkg.dev/$PROJECT/litellm/$c:<tag>
done
```

Then set `image_registry = "us-central1-docker.pkg.dev/$PROJECT/litellm"` (no `/berriai` suffix).

:::

## Quick start

### Step 1 — Clone and enter the module

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm/terraform/litellm/gcp
```

### Step 2 — Create your `terraform.tfvars`

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project = "my-gcp-project"
region  = "us-central1"

tenant = "acme"   # used as prefix for all GCP resources
env    = "prod"   # e.g. dev, stage, prod

# Artifact Registry remote repo for GHCR passthrough
image_registry = "us-central1-docker.pkg.dev/my-gcp-project/litellm/berriai"
image_tag      = "v1.86.0"
```

### Step 3 — Supply sensitive values via env vars

```bash
export TF_VAR_litellm_master_key="sk-..."   # optional; auto-generated if omitted
export TF_VAR_litellm_license="lic-..."     # optional; omit for OSS-only
```

### Step 4 — Configure TLS (recommended for production)

**Production** — provide your DNS domain(s):

1. Apply once with `allow_plaintext_lb = true` to get the anycast IP:

   ```bash
   terraform apply -var "allow_plaintext_lb=true"
   terraform output -raw lb_ip
   ```

2. Point your DNS name(s) at that IP.

3. Set `lb_domains` and remove `allow_plaintext_lb`, then re-apply:

   ```hcl
   lb_domains = ["proxy.example.com"]
   ```

**Trial/dev** — explicitly opt into HTTP-only:

```hcl
allow_plaintext_lb = true
```

### Step 5 — Apply

```bash
terraform init
terraform apply
```

A single apply provisions everything, runs the Prisma migration via a Cloud Run Job, and only then starts the gateway/backend services. When it returns, the stack is serving traffic.

### Step 6 — Verify

```bash
# Get the LB URL
terraform output lb_url

# Get the auto-generated master key
gcloud secrets versions access latest \
  --secret="$(terraform output -raw master_key_secret_id)"

# Test the API
curl http://$(terraform output -raw lb_ip)/health
```

UI login: **admin** / `<master key>`

## Configure LiteLLM

### `proxy_config` (mirrors the Helm chart)

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
  ]
  general_settings = {
    master_key   = "os.environ/LITELLM_MASTER_KEY"
    database_url = "os.environ/DATABASE_URL"
  }
}
```

LiteLLM resolves `os.environ/<NAME>` against the container environment at runtime. Provider API keys belong in `*_extra_secrets`.

### Extra env vars (non-sensitive)

```hcl
gateway_extra_env = {
  LANGFUSE_HOST = "https://us.cloud.langfuse.com"
}

backend_extra_env = {
  STORE_MODEL_IN_DB            = "True"
  AUTO_REDIRECT_UI_LOGIN_TO_SSO = "true"
  UI_USERNAME                   = "admin"
}
```

### Provider API keys (from Secret Manager)

Create the secret first:

```bash
echo -n "sk-proj-..." | gcloud secrets create openai-api-key --data-file=-
```

Then reference it by resource ID (not value):

```hcl
gateway_extra_secrets = {
  OPENAI_API_KEY    = "projects/my-gcp-project/secrets/openai-api-key"
  ANTHROPIC_API_KEY = "projects/my-gcp-project/secrets/anthropic-api-key"
}
```

:::warning Secret resource ID format

Pass the **bare secret resource ID** — `projects/.../secrets/<name>` — never the version-suffixed form (`projects/.../secrets/<name>/versions/3`). The Cloud Run `secret_key_ref` binding always resolves `latest`. To pin a version, edit `cloudrun.tf` directly.

:::

The Cloud Run runtime service account automatically gains `roles/secretmanager.secretAccessor` on every secret listed.

## Scaling

### Per-service sizing

```hcl
# Gateway (LLM data plane — scale this most)
gateway_cpu           = "2000m"   # 2 vCPU
gateway_memory        = "8Gi"
gateway_min_instances = 2
gateway_max_instances = 20
gateway_max_instance_request_concurrency = 40  # lower for long-running LLM streams

# Backend (management API)
backend_cpu           = "1000m"
backend_memory        = "4Gi"
backend_min_instances = 1
backend_max_instances = 4

# UI (static nginx — request-driven scaling handles spikes)
ui_cpu           = "1000m"
ui_memory        = "512Mi"
ui_min_instances = 1
ui_max_instances = 3
```

### Cloud Run concurrency

Cloud Run auto-scales based on request concurrency. Lower `gateway_max_instance_request_concurrency` (default 80) when serving long-running LLM streams that keep a worker busy for tens of seconds:

```hcl
gateway_max_instance_request_concurrency = 20
```

## Multi-tenant deployments

All resources are named `${tenant}-litellm-${env}-<suffix>`:

| `tenant` | `env` | Example resource |
|---|---|---|
| `acme` | `stage` | `acme-litellm-stage-gateway` (Cloud Run service) |
| `acme` | `prod` | `acme-litellm-prod-master-key` (Secret Manager) |
| `globex` | `dev` | `globex-litellm-dev` (Cloud SQL instance) |

Per-tenant apply:

```bash
export TF_VAR_litellm_master_key="sk-..."
export TF_VAR_litellm_license="lic-..."

terraform apply \
  -var "project=my-gcp-project" \
  -var "region=us-central1" \
  -var "tenant=acme" \
  -var "env=stage"
```

## Database

The module uses **password authentication** for Cloud SQL (not IAM auth). A random password is auto-generated and stored in Secret Manager as `<tenant>-litellm-<env>-db-password`. The containers receive the password via `DATABASE_PASSWORD` from Secret Manager at startup.

The entrypoint assembles `DATABASE_URL` from `DATABASE_HOST`, `DATABASE_PASSWORD`, and other env vars — the password never appears in the service spec or logs.

## Redis encryption

Memorystore runs with `SERVER_AUTHENTICATION` TLS. The instance's self-signed CA cert is shipped to the gateway and backend as `REDIS_CA_PEM_B64`. The entrypoint decodes it to `/tmp/redis-ca.pem` and sets `REDIS_SSL_CA_CERTS`. The proxy connects via `rediss://` automatically.

## Data retention tripwires

| Variable | Default | Effect |
|---|---|---|
| `cloudsql_deletion_protection` | `true` | `terraform destroy` fails with a clear error rather than dropping the DB |
| `gcs_force_destroy` | `false` | Destroy fails if the GCS bucket is non-empty |

Set these to `false` / `true` respectively only for ephemeral/CI environments.

## Managed TLS certificate

When `lb_domains` is set, the stack provisions a Google-managed SSL certificate. Managed certs sit in `PROVISIONING` for 15–60 minutes after first apply while DNS propagates:

```bash
gcloud compute ssl-certificates describe \
  $(terraform output -raw ssl_certificate_name) \
  --format="value(managed.status)"
```

## Outputs

| Output | Description |
|---|---|
| `lb_url` | LB URL (access LiteLLM here) |
| `lb_ip` | Anycast IP of the load balancer |
| `master_key_secret_id` | Secret Manager ID for `LITELLM_MASTER_KEY` |
| `gateway_url` | Direct Cloud Run URL for the gateway service |
| `backend_url` | Direct Cloud Run URL for the backend service |
| `ui_url` | Direct Cloud Run URL for the UI service |
| `migration_run_command` | `gcloud run jobs execute` command to re-run migrations |

## Variable reference

| Variable | Default | Description |
|---|---|---|
| `project` | *(required)* | GCP project ID |
| `region` | `us-central1` | GCP region |
| `tenant` | *(required)* | Resource name prefix |
| `env` | *(required)* | Environment suffix |
| `litellm_master_key` | `""` (auto-generated) | Pre-set master key (set via `TF_VAR_`) |
| `litellm_license` | `""` | Enterprise license (set via `TF_VAR_`) |
| `ui_password` | `""` | UI admin password (set via `TF_VAR_`) |
| `image_registry` | `ghcr.io/berriai` | Registry prefix for composing image URIs |
| `image_tag` | `v1.86.0-dev` | Tag applied to all four LiteLLM images |
| `gateway_image` | `""` | Full override URI for the gateway (bypasses `image_registry`/`image_tag`) |
| `backend_image` | `""` | Full override URI for the backend |
| `ui_image` | `""` | Full override URI for the UI |
| `migrations_image` | `""` | Full override URI for the migration job |
| `gateway_cpu` | `1000m` | Cloud Run CPU for gateway |
| `gateway_memory` | `4Gi` | Cloud Run memory for gateway |
| `gateway_min_instances` | `1` | Gateway min instances |
| `gateway_max_instances` | `10` | Gateway max instances |
| `gateway_max_instance_request_concurrency` | `80` | Concurrency per gateway instance |
| `lb_domains` | `[]` | DNS domains for Google-managed SSL cert |
| `allow_plaintext_lb` | `false` | Opt into HTTP-only (dev/trial only) |
| `cloudsql_deletion_protection` | `true` | Protect Cloud SQL from accidental delete |
| `gcs_force_destroy` | `false` | Allow deleting non-empty GCS bucket on destroy |
| `db_tier` | `db-custom-2-7680` | Cloud SQL machine type |
| `db_version` | `POSTGRES_16` | Cloud SQL PostgreSQL version |
| `redis_tier` | `STANDARD_HA` | Memorystore tier (`BASIC` for dev) |
| `redis_memory_size_gb` | `1` | Memorystore memory size |
| `proxy_config` | `{}` | LiteLLM proxy config (mirrors `config.yaml`) |
| `gateway_extra_env` | `{}` | Extra env vars for gateway |
| `backend_extra_env` | `{}` | Extra env vars for backend |
| `gateway_extra_secrets` | `{}` | Secret Manager resource ID map for gateway |
| `backend_extra_secrets` | `{}` | Secret Manager resource ID map for backend |

## What's not included

- **Remote state backend:** defaults to local state. Add a `gcs` backend block to `versions.tf` for team environments.
- **Observability beyond Cloud Logging:** wire your own Prometheus/Datadog/Langfuse via `*_extra_env`.
- **Cloud Armor / WAF:** attach a security policy to the backend service via `google_compute_backend_service`.
