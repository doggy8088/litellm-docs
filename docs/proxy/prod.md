---
title: Production Best Practices
description: Checklist for running LiteLLM in production; configuration, sizing and workers, Redis, database and migrations, and server tuning.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Production Best Practices

Work through this page before going live. It covers the production configuration, machine sizing and worker strategy, Redis, database and migrations, and server tuning; each section stands alone, so you can also use it as a review checklist for an existing deployment.

## Configuration

### Recommended config.yaml

Use this config.yaml in production (with your own LLMs):

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

general_settings:
  master_key: sk-1234      # enter your own master key, ensure it starts with 'sk-'
  alerting: ["slack"]      # Setup slack alerting - get alerts on LLM exceptions, Budget Alerts, Slow LLM Responses
  proxy_batch_write_at: 60 # Batch write spend updates every 60s
  database_connection_pool_limit: 10 # connection pool limit per worker process. Total connections = limit × workers × instances. Calculate: MAX_DB_CONNECTIONS / (instances × workers). Default: 10.

  # OPTIONAL Best Practices
  disable_error_logs: True # turn off writing LLM Exceptions to DB
  allow_requests_on_db_unavailable: True # Only USE when running LiteLLM on your VPC. Allow requests to still be processed even if the DB is unavailable. We recommend doing this if you're running LiteLLM on VPC that cannot be accessed from the public internet.

litellm_settings:
  request_timeout: 600    # raise Timeout error if call takes longer than 600 seconds. Default value is 6000seconds if not set
  set_verbose: False      # Switch off Debug Logging, ensure your logs do not have any debugging on
  json_logs: true         # Get debug logs in json format
```

:::warning Multiple instances

If running multiple LiteLLM instances (e.g., Kubernetes pods), remember each instance multiplies your total connections. Example: 3 instances × 4 workers × 10 connections = 120 total connections.

:::

Set slack webhook url in your env
```shell
export SLACK_WEBHOOK_URL="example-slack-webhook-url"
```

Turn off FASTAPI's default info logs
```bash
export LITELLM_LOG="ERROR"
```

### Disable load_dotenv

Set `export LITELLM_MODE="PRODUCTION"`. This disables `load_dotenv()`, which would otherwise automatically load credentials from a local `.env`.

### Set the salt key

If you use the database, set a salt key for encrypting and decrypting stored variables. Do not change it after adding a model; it encrypts your LLM API key credentials, and changing it makes them unreadable. Use a [password generator](https://1password.com/password-generator/) to get a random hash.

```bash
export LITELLM_SALT_KEY="sk-1234"
```

[**See Code**](https://github.com/BerriAI/litellm/blob/036a6821d588bd36d170713dcf5a72791a694178/litellm/proxy/common_utils/encrypt_decrypt_utils.py#L15)

## Sizing and workers

### Machine specifications

For optimal performance in production, we recommend the following resource configuration.

**1. Memory `requests` and `limits`**

```yaml
resources:
  requests:
    cpu: "1" # should be 1*num_workers
    memory: "4Gi" # should be 4*num_workers
  limits:
    cpu: "1"
    memory: "4Gi"
```

**2. HPA thresholds**

```yaml
targetCPUUtilizationPercentage: 60
targetMemoryUtilizationPercentage: 80
```

### Choose your server: Uvicorn vs. Gunicorn

LiteLLM Proxy runs on [Uvicorn](https://uvicorn.dev/) by default. Passing `--run_gunicorn` instead starts [Gunicorn](https://gunicorn.org/) as a process manager that supervises [Uvicorn worker processes](https://uvicorn.dev/deployment/#gunicorn) (`uvicorn.workers.UvicornWorker`). In both cases your application code still runs on Uvicorn; the difference is which process manages and recycles the workers.

| | Uvicorn (default) | Gunicorn (`--run_gunicorn`) |
|---|---|---|
| **When to use** | Recommended for almost all deployments, especially Kubernetes with one worker per pod. | Choose when you run **multiple workers in a single container** and want a mature process manager to supervise and recycle them. |
| **Worker recycling** | Uvicorn's [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits). | Gunicorn's [`max_requests`](https://gunicorn.org/reference/settings/#max_requests), the battle-tested mechanism Gunicorn has shipped for years. |
| **Process supervision** | Uvicorn's built-in multiprocess manager. | Gunicorn's [arbiter](https://gunicorn.org/design/#arbiter), which restarts workers one at a time as they exit. |

:::tip Recommendation

On Kubernetes, run **one Uvicorn worker per pod** and scale **horizontally** (more pods) rather than vertically (more workers per pod). One process per pod keeps latency predictable under load, lets the Horizontal Pod Autoscaler use the [thresholds above](#machine-specifications) accurately, and makes rolling restarts hitless because Kubernetes drains one pod at a time. Reach for Gunicorn only when you must pack multiple workers into one container.

:::

This is the default server, so you only need to set `--num_workers 1` (the default is already `1`):

```shell
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "1"]
```

### Recycle workers

If you observe gradual memory growth under sustained load, recycle each worker after a fixed number of requests to bound memory usage. `--max_requests_before_restart` maps to Uvicorn's [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits) (default server) and to Gunicorn's [`max_requests`](https://gunicorn.org/reference/settings/#max_requests) under `--run_gunicorn`. Configure it via CLI flag or environment variable:

```shell
# CLI
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "1", "--max_requests_before_restart", "10000"]

# or ENV (for deployment manifests / containers)
export MAX_REQUESTS_BEFORE_RESTART=10000
```

:::tip

When you run **multiple workers in one container** and rely on `--max_requests_before_restart`, prefer `--run_gunicorn`. Gunicorn's [`max_requests`](https://gunicorn.org/reference/settings/#max_requests) recycling is more mature than Uvicorn's, and its [arbiter](https://gunicorn.org/design/#arbiter) restarts workers one at a time so the pod keeps serving traffic while a worker is replaced.

:::

```shell
# Multiple workers in one container, with Gunicorn-managed recycling
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000"]
```

When several workers boot together and serve a similar amount of traffic, they reach the request threshold at almost the same time and recycle in lockstep, dropping a chunk of capacity at once. Add `--max_requests_before_restart_jitter` to offset each worker's threshold by a random amount in `[0, jitter]` so restarts stagger instead of synchronizing. It maps to Uvicorn's [`limit_max_requests_jitter`](https://uvicorn.dev/settings/#resource-limits) (requires `uvicorn>=0.41.0`) and Gunicorn's [`max_requests_jitter`](https://gunicorn.org/reference/settings/#max_requests_jitter), and has no effect without `--max_requests_before_restart`.

```shell
# Stagger recycling so workers don't all restart at once
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000", "--max_requests_before_restart_jitter", "1000"]
```

### Keep restarts hitless

A restart is "hitless" when in-flight requests finish before the process exits, so no client sees a dropped connection. Two cases matter in production:

**Worker recycling (from `--max_requests_before_restart`).** Both servers stop accepting new connections on the recycled worker and let outstanding requests drain before it exits, then a replacement worker starts. Gunicorn additionally guarantees in-flight requests up to its [`graceful_timeout`](https://gunicorn.org/reference/settings/#graceful_timeout) (30s by default) on [`SIGTERM`](https://gunicorn.org/signals/). With one worker per pod, recycling briefly reduces that pod's capacity, which is why we recommend scaling horizontally so the load balancer can route around it.

**Rolling deploys and pod restarts (Kubernetes).** Make restarts hitless at the orchestration layer rather than relying on the server alone:

- Use a [`RollingUpdate`](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment) strategy (the Deployment default) so new pods become Ready before old pods are terminated.
- Keep a [readiness probe](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) on `/health/readiness` so Kubernetes only sends traffic to pods that can serve it, and stops routing to a pod as soon as termination begins.
- Set [`terminationGracePeriodSeconds`](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) to comfortably exceed your longest expected request (LiteLLM's request timeout defaults to 600s; see the [recommended config](#recommended-configyaml)). On termination Kubernetes sends `SIGTERM`, and both Uvicorn and Gunicorn shut down [gracefully](https://uvicorn.dev/deployment/) by draining in-flight requests before exiting.
- Optionally add a small [`preStop` hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks) (for example `sleep 5`) to give the load balancer time to deregister the pod before the server begins shutting down, eliminating the brief window where traffic can still arrive at a terminating pod.

```yaml title="Kubernetes Deployment snippet for hitless rolling restarts"
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0   # never drop below desired replica count
      maxSurge: 1         # add one new pod at a time
  template:
    spec:
      terminationGracePeriodSeconds: 620   # > your longest request (request_timeout: 600)
      containers:
        - name: litellm
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 4000
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

## Redis

If you use Redis, do not use `redis_url`; it is about 80 RPS slower than passing host, port, and password separately (still under investigation, tracked [here](https://github.com/BerriAI/litellm/issues/3188)).

```yaml
router_settings:
  routing_strategy: simple-shuffle # (default) - recommended for best performance
  # redis_url: "os.environ/REDIS_URL"
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD

litellm_settings:
  cache: True
  cache_params:
    type: redis
    host: os.environ/REDIS_HOST
    port: os.environ/REDIS_PORT
    password: os.environ/REDIS_PASSWORD
```

:::warning

**Usage-based routing is not recommended for production due to performance impacts.** Use `simple-shuffle` (default) for optimal performance in high-traffic scenarios.

:::

### Redis version requirement

| Component | Minimum Version |
|-----------|-----------------|
| Redis     | 7.0+            |

## Database and migrations

### Gracefully handle DB unavailability

When running LiteLLM on a VPC (and inaccessible from the public internet), you can enable graceful degradation so that request processing continues even if the database is temporarily unavailable.

**WARNING: Only do this if you're running LiteLLM on VPC, that cannot be accessed from the public internet.**

```yaml showLineNumbers title="litellm config.yaml"
general_settings:
  allow_requests_on_db_unavailable: True
```

When `allow_requests_on_db_unavailable` is set to `true`, LiteLLM will handle errors as follows:

| Type of Error | Expected Behavior | Details |
|---------------|-------------------|----------------|
| Prisma Errors | Request will be allowed | Covers issues like DB connection resets or rejections from the DB via Prisma, the ORM used by LiteLLM. |
| Httpx Errors | Request will be allowed | Occurs when the database is unreachable, allowing the request to proceed despite the DB outage. |
| Pod Startup Behavior | Pods start regardless | LiteLLM Pods will start even if the database is down or unreachable, ensuring higher uptime guarantees for deployments. |
| Health/Readiness Check | Always returns 200 OK | The /health/readiness endpoint returns a 200 OK status to ensure that pods remain operational even when the database is unavailable. |
| LiteLLM Budget Errors or Model Errors | Request will be blocked | Triggered when the DB is reachable but the authentication token is invalid, lacks access, or exceeds budget limits. |

[More information about what the Database is used for here](db_info)

### Run migrations from the Helm PreSync hook

:::info
The Helm PreSync hook flow is in beta.
:::

To ensure only one service manages database migrations, use our [Helm PreSync hook for Database Migrations](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/templates/migrations-job.yaml). This ensures migrations are handled during `helm upgrade` or `helm install`, while LiteLLM pods explicitly disable migrations.

1. **Helm PreSync Hook**:
   - The Helm PreSync hook is configured in the chart to run database migrations during deployments.
   - The hook always sets `DISABLE_SCHEMA_UPDATE=false`, ensuring migrations are executed reliably.

  Reference Settings to set on ArgoCD for `values.yaml`

  ```yaml
  db:
    useExisting: true # use existing Postgres DB
    url: postgresql://ishaanjaffer0324:... # url of existing Postgres DB
  ```

2. **LiteLLM Pods**:
   - Set `DISABLE_SCHEMA_UPDATE=true` in LiteLLM pod configurations to prevent them from running migrations.

   Example configuration for LiteLLM pod:
   ```yaml
   env:
     - name: DISABLE_SCHEMA_UPDATE
       value: "true"
   ```

### Use prisma migrate deploy

Use this to handle db migrations across LiteLLM versions in production:

```bash
USE_PRISMA_MIGRATE="True"
```

The migrate deploy command:

- **Does not** issue a warning if an already applied migration is missing from migration history
- **Does not** detect drift (production database schema differs from migration history end state - for example, due to a hotfix)
- **Does not** reset the database or generate artifacts (such as Prisma Client)
- **Does not** rely on a shadow database

How LiteLLM ships migrations:

1. A new migration file is written to our `litellm-proxy-extras` package. [See all](https://github.com/BerriAI/litellm/tree/main/litellm-proxy-extras/litellm_proxy_extras/migrations)

2. The core litellm pip package is bumped to point to the new `litellm-proxy-extras` package. This ensures, older versions of LiteLLM will continue to use the old migrations. [See code](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/pyproject.toml#L58)

3. When you upgrade to a new version of LiteLLM, the migration file is applied to the database. [See code](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/litellm-proxy-extras/litellm_proxy_extras/utils.py#L42)

### Read-only file system

Running LiteLLM with `readOnlyRootFilesystem: true` is a Kubernetes security best practice that prevents container processes from writing to the root filesystem. LiteLLM fully supports this configuration.

If you see a `Permission denied` error, it means the LiteLLM pod is running with a read-only file system. LiteLLM needs writable directories for:
- **Database migrations**: Set `LITELLM_MIGRATION_DIR="/path/to/writable/directory"`
- **Admin UI**: Set `LITELLM_UI_PATH="/path/to/writable/directory"`
- **UI assets/logos**: Set `LITELLM_ASSETS_PATH="/path/to/writable/directory"`

**Option 1: Using EmptyDir Volumes with InitContainer (Recommended)**

This approach copies the pre-built UI from the Docker image to writable emptyDir volumes at pod startup.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-proxy
spec:
  template:
    spec:
      initContainers:
        - name: setup-ui
          image: ghcr.io/berriai/litellm:latest
          command:
            - sh
            - -c
            - |
              cp -r /var/lib/litellm/ui/* /app/var/litellm/ui/ && \
              cp -r /var/lib/litellm/assets/* /app/var/litellm/assets/
          volumeMounts:
            - name: ui-volume
              mountPath: /app/var/litellm/ui
            - name: assets-volume
              mountPath: /app/var/litellm/assets

      containers:
        - name: litellm
          image: ghcr.io/berriai/litellm:latest
          env:
            - name: LITELLM_NON_ROOT
              value: "true"
            - name: LITELLM_UI_PATH
              value: "/app/var/litellm/ui"
            - name: LITELLM_ASSETS_PATH
              value: "/app/var/litellm/assets"
            - name: LITELLM_MIGRATION_DIR
              value: "/app/migrations"
            - name: PRISMA_BINARY_CACHE_DIR
              value: "/app/cache/prisma-python/binaries"
            - name: XDG_CACHE_HOME
              value: "/app/cache"
          securityContext:
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 101
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: config
              mountPath: /app/config.yaml
              subPath: config.yaml
              readOnly: true
            - name: ui-volume
              mountPath: /app/var/litellm/ui
            - name: assets-volume
              mountPath: /app/var/litellm/assets
            - name: cache
              mountPath: /app/cache
            - name: migrations
              mountPath: /app/migrations

      volumes:
        - name: config
          configMap:
            name: litellm-config
        - name: ui-volume
          emptyDir:
            sizeLimit: 100Mi
        - name: assets-volume
          emptyDir:
            sizeLimit: 10Mi
        - name: cache
          emptyDir:
            sizeLimit: 500Mi
        - name: migrations
          emptyDir:
            sizeLimit: 64Mi
```

**Option 2: Without UI (API-only deployment)**

If you don't need the admin UI, you can run with minimal configuration:

```yaml
env:
  - name: LITELLM_NON_ROOT
    value: "true"
  - name: LITELLM_MIGRATION_DIR
    value: "/app/migrations"
securityContext:
  readOnlyRootFilesystem: true
```

The proxy will log a warning about the UI but API endpoints will work normally.

Environment variables for read-only filesystems:

| Variable | Purpose | Default |
|----------|---------|---------|
| `LITELLM_UI_PATH` | Admin UI directory | `/var/lib/litellm/ui` (Docker) |
| `LITELLM_ASSETS_PATH` | UI assets/logos | `/var/lib/litellm/assets` (Docker) |
| `LITELLM_MIGRATION_DIR` | Database migrations | Package directory |
| `PRISMA_BINARY_CACHE_DIR` | Prisma binary cache | System default |
| `XDG_CACHE_HOME` | General cache directory | System default |

Notes: always set `LITELLM_MIGRATION_DIR` to a writable emptyDir path, and set `PRISMA_BINARY_CACHE_DIR` and `XDG_CACHE_HOME` to writable paths. If using a custom `server_root_path`, you must pre-process UI files in your Dockerfile as the proxy cannot modify files at runtime with a read-only filesystem. The UI is automatically detected as pre-restructured if it contains a `.litellm_ui_ready` marker file (created by the official Docker images).

## Server tuning

Flags and env vars for tuning the container itself. See the [CLI reference](./cli.md) for every flag.

### SSL certificates

For TLS terminated by the proxy itself (rather than your load balancer), pass the key and cert paths:

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --ssl_keyfile_path ssl_test/keyfile.key \
    --ssl_certfile_path ssl_test/certfile.crt
```

### HTTP/2 with Hypercorn

To serve HTTP/2, build an image with hypercorn installed and pass `--run_hypercorn`:

```shell
FROM docker.litellm.ai/berriai/litellm:latest
WORKDIR /app
COPY config.yaml .
RUN chmod +x ./docker/entrypoint.sh
EXPOSE 4000/tcp
RUN uv add hypercorn
CMD ["--port", "4000", "--config", "config.yaml"]
```

```shell
docker run \
    -v $(pwd)/proxy_config.yaml:/app/config.yaml \
    -p 4000:4000 \
    -e DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname> \
    -e LITELLM_MASTER_KEY="sk-1234" \
    your_custom_docker_image \
    --config /app/config.yaml \
    --run_hypercorn
```

### Granian ASGI server [Beta]

:::info Beta feature
`--run_granian` is in **beta**. Uvicorn is still the default server. Try Granian when you need more gateway throughput or see instability under load with uvicorn; report issues on [GitHub](https://github.com/BerriAI/litellm/issues).
:::

[Granian](https://github.com/emmett-framework/granian) is a Rust-backed ASGI server. In LiteLLM benchmarks it showed a 10 to 20 RPS improvement over uvicorn with the same worker count, steadier latency under sustained load, and lower error rates (see [PR #26027](https://github.com/BerriAI/litellm/pull/26027)). Scale throughput with `--num_workers`.

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml \
    --port 4000 \
    --run_granian \
    --num_workers 4
```

Both `--ssl_certfile_path` and `--ssl_keyfile_path` are required when enabling TLS with Granian. Not supported with Granian: `--max_requests_before_restart` (use Gunicorn for per-request worker recycling) and `--ciphers` (Hypercorn only). See [CLI server backend options](/docs/proxy/cli#server-backend-options).

### Keepalive timeout

Defaults to 5 seconds; between requests, connections must receive new data within this period or be disconnected.

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --keepalive_timeout 75
```

Or set `KEEPALIVE_TIMEOUT=75` as an env var.

### Load config.yaml from S3 or GCS

Use this if you cannot mount a config file on your deployment service (AWS Fargate, Railway, etc.). LiteLLM reads `config.yaml` from the bucket at startup.

<Tabs>
<TabItem value="gcs" label="GCS Bucket">

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_TYPE="gcs" \
   -e LITELLM_CONFIG_BUCKET_NAME="litellm-proxy" \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="proxy_config.yaml" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest
```

</TabItem>
<TabItem value="s3" label="s3">

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME="litellm-proxy" \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="litellm_proxy_config.yaml" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest
```

</TabItem>
</Tabs>

### Disable pulling live model prices

Set `LITELLM_LOCAL_MODEL_COST_MAP="True"` to use the bundled [model prices file](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) instead of fetching it at startup, if you see long cold starts or have network egress restrictions.

## Verify production readiness

### Expected performance

See benchmarks [here](../benchmarks#performance-metrics).

### Confirm debug logging is off

You should only see the following level of details in logs on the proxy server:

```shell
# INFO:     192.168.2.205:11774 - "POST /chat/completions HTTP/1.1" 200 OK
# INFO:     192.168.2.205:34717 - "POST /chat/completions HTTP/1.1" 200 OK
# INFO:     192.168.2.205:29734 - "POST /chat/completions HTTP/1.1" 200 OK
```

## Deployment FAQ

**Q: Is Postgres the only supported database, or do you support other ones (like Mongo)?**

A: We explored MySQL but that was hard to maintain and led to bugs for customers. Currently, PostgreSQL is our primary supported database for production deployments.

Because LiteLLM talks to the database through Prisma over the PostgreSQL wire protocol, any Postgres-wire-compatible distributed SQL database works as a drop-in replacement. [YugabyteDB](https://www.yugabyte.com/) is used in production this way; point `DATABASE_URL` at its YSQL endpoint (`postgresql://<user>:<password>@<host>:<port>/<dbname>`) and LiteLLM runs its migrations and queries unchanged. This is a good fit if you need horizontal scale or multi-region high availability beyond what a single Postgres instance provides.

**Q: If there is Postgres downtime, how does LiteLLM react? Does it fail-open or is there API downtime?**

A: You can gracefully handle DB unavailability if it's on your VPC; see [Gracefully handle DB unavailability](#gracefully-handle-db-unavailability) above.

:::info

Need help or want dedicated support? Talk to a founder [here](https://enterprise.litellm.ai/demo).

:::
