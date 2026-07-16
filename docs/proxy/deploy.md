import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Docker、Helm、Terraform {#docker-helm-terraform}

:::info LiteLLM OSS 沒有限制
在 LiteLLM OSS 上，您可以建立的使用者、金鑰或團隊數量**沒有限制**。
:::

您可以在 [這裡](https://github.com/BerriAI/litellm/blob/main/Dockerfile) 找到用來建置 litellm proxy 的 Dockerfile

官方映像檔已發佈於 `ghcr.io/berriai`（`litellm`、`litellm-database`，其捆綁了可搭配 Postgres 使用的 prisma，以及 `litellm-non_root`），並鏡像於 `docker.litellm.ai/berriai`。以下片段使用 `docker.litellm.ai` 鏡像。

> 注意：如需生產環境的規模估算，請參閱 [機器規格](./prod.md#2-recommended-machine-specifications)。

## 快速入門 {#quick-start}

:::info
如果拉取 docker 映像檔時遇到問題？請寄信給 support@berri.ai。
:::

<Tabs>

<TabItem value="docker" label="Docker">

```
docker pull docker.litellm.ai/berriai/litellm:latest
```

[**查看所有 docker 映像檔**](https://github.com/orgs/BerriAI/packages)

</TabItem>

<TabItem value="cli" label="LiteLLM CLI">

```shell
$ uv tool install 'litellm[proxy]'
```

</TabItem>

<TabItem value="docker-compose" label="Docker Compose（Proxy + DB）">

使用此 docker compose 在本機啟動搭配 postgres 資料庫的 proxy。 

```bash
# Get the docker compose file
curl -O https://raw.githubusercontent.com/BerriAI/litellm/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/BerriAI/litellm/main/prometheus.yml

# Add the master key - you can change this after setup
echo 'LITELLM_MASTER_KEY="sk-1234"' > .env

# Add the litellm salt key - you cannot change this after adding a model
# It is used to encrypt / decrypt your LLM API Key credentials
# We recommend - https://1password.com/password-generator/ 
# password generator to get a random hash for litellm salt key
echo 'LITELLM_SALT_KEY="sk-1234"' >> .env

# Start
docker compose up
```

</TabItem>
</Tabs>

### 驗證 Docker image 簽章 {#verify-docker-image-signatures}

所有 LiteLLM Docker 映像檔都使用 [cosign](https://docs.sigstore.dev/cosign/overview/) 簽署。每個版本都使用在 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 中引入的相同金鑰簽署。

**使用固定的 commit hash 進行驗證（建議）：**

commit hash 在密碼學上不可變，因此這是確保您使用原始簽署金鑰的最可靠方式：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

**使用版本標籤進行驗證（方便）：**

此儲存庫中的標籤受到保護，並會解析為相同的金鑰。此選項較容易閱讀，但依賴標籤保護規則：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

請將 `<release-tag>` 替換為您正在部署的版本（例如 `v1.89.4`）。

預期輸出：

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

如需進一步了解 LiteLLM 的版本簽署，請參閱 [CI/CD v2 公告](https://docs.litellm.ai/blog/ci-cd-v2-improvements#verify-docker-image-signatures)。若要取得涵蓋所有映像檔變體、CI/CD 強制執行，以及部署最佳實務的完整指南，請參閱 [Docker 映像檔安全指南](./docker_image_security.md)。

### Docker Run {#docker-run}

#### 步驟 1. 建立 config.yaml {#step-1-create-configyaml}

範例 `litellm_config.yaml` 

```yaml
model_list:
  - model_name: azure-gpt-4o
    litellm_params:
      model: azure/<your-azure-model-deployment>
      api_base: os.environ/AZURE_API_BASE # runs os.getenv("AZURE_API_BASE")
      api_key: os.environ/AZURE_API_KEY # runs os.getenv("AZURE_API_KEY")
      api_version: "2025-01-01-preview"
```


#### 步驟 2. 執行 Docker Image {#step-2-run-docker-image}

```shell
docker run \
    -v $(pwd)/litellm_config.yaml:/app/config.yaml \
    -e AZURE_API_KEY=d6*********** \
    -e AZURE_API_BASE=https://openai-***********/ \
    -p 4000:4000 \
    docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml --detailed_debug
```

在 [這裡](https://github.com/berriai/litellm/pkgs/container/litellm) 取得最新映像檔

#### 步驟 3. 測試 {#step-3-test-it}

開啟位於 `http://0.0.0.0:4000/ui` 的 Admin UI，前往 **Test Key** playground，選取 `azure-gpt-4o`（步驟 1 中設定的模型），然後送出訊息。

### Docker Run - CLI 參數 {#docker-run---cli-args}

請參閱 [這裡](https://docs.litellm.ai/docs/proxy/cli) 以取得所有支援的 CLI 參數：

以下是您可以執行 docker 映像並將您的設定傳遞給 `litellm` 的方式
```shell
docker run docker.litellm.ai/berriai/litellm:latest --config your_config.yaml
```

以下是您可以執行 docker 映像並在 `num_workers=8` 上啟動 litellm 的方式，埠號為 8002
```shell
docker run docker.litellm.ai/berriai/litellm:latest --port 8002 --num_workers 8
```


### 將 litellm 作為基礎 image {#use-litellm-as-a-base-image}

```shell
# Use the provided base image
FROM docker.litellm.ai/berriai/litellm:latest

# Set the working directory to /app
WORKDIR /app

# Copy the configuration file into the container at /app
COPY config.yaml .

# Make sure your docker/entrypoint.sh is executable
RUN chmod +x ./docker/entrypoint.sh

# Expose the necessary port
EXPOSE 4000/tcp

# Override the CMD instruction with your desired command and arguments
# WARNING: FOR PROD DO NOT USE `--detailed_debug` it slows down response times, instead use the following CMD
# CMD ["--port", "4000", "--config", "config.yaml"]

CMD ["--port", "4000", "--config", "config.yaml", "--detailed_debug"]
```

### Terraform {#terraform}

若要使用 Terraform 在 AWS 或 GCP 上佈建完整的基礎架構堆疊，請使用 [Deploy to Cloud](./deploy_cloud.md#deploy-with-terraform-aws-and-gcp) 中說明的官方模組。若要使用 Terraform 管理 LiteLLM 資源（keys、teams、models），請使用 [terraform-provider-litellm](https://github.com/BerriAI/terraform-provider-litellm)（感謝 [Nicholas Cecere](https://www.linkedin.com/in/nicholas-cecere-24243549/)）。

### Kubernetes {#kubernetes}

一個以設定檔為基礎的 litellm 實例會以 Deployment 的形式執行，從 ConfigMap 載入 `config.yaml`，並將宣告為環境變數的 API keys 從 opaque Secret 掛載進來。下方的 manifest 定義了 ConfigMap、Secret、Deployment 和 Service；請使用 `kubectl apply -f deployment.yaml` 套用它。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config-file
data:
  config.yaml: |
      model_list: 
        - model_name: gpt-4o
          litellm_params:
            model: azure/gpt-4o-ca
            api_base: https://my-endpoint-canada-berri992.openai.azure.com/
            api_key: os.environ/CA_AZURE_OPENAI_API_KEY
---
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: litellm-secrets
data:
  CA_AZURE_OPENAI_API_KEY: bWVvd19pbV9hX2NhdA== # your api key in base64
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-deployment
  labels:
    app: litellm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: litellm
  template:
    metadata:
      labels:
        app: litellm
    spec:
      containers:
      - name: litellm
        image: docker.litellm.ai/berriai/litellm:main-v1.90.2 # pin a version, do not use :latest
        args:
          - "--config"
          - "/app/proxy_server_config.yaml"
        ports:
        - containerPort: 4000
        volumeMounts:
        - name: config-volume
          mountPath: /app/proxy_server_config.yaml
          subPath: config.yaml
        envFrom:
        - secretRef:
            name: litellm-secrets
        livenessProbe:
          httpGet:
            path: /health/liveliness
            port: 4000
          initialDelaySeconds: 120
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 4000
          initialDelaySeconds: 120
          periodSeconds: 15
      volumes:
        - name: config-volume
          configMap:
            name: litellm-config-file
---
apiVersion: v1
kind: Service
metadata:
  name: litellm-service
spec:
  selector:
    app: litellm
  ports:
    - protocol: TCP
      port: 4000
      targetPort: 4000
  type: NodePort
```

進行 port-forward 以在本機連線到 proxy：

```bash
kubectl port-forward service/litellm-service 4000:4000
```

若要連接資料庫（Virtual Keys、spend tracking），請使用 `docker.litellm.ai/berriai/litellm-database` 映像，並將 `DATABASE_URL` 與 `LITELLM_MASTER_KEY` 加入 Secret；manifest 其餘部分無需變更。請參閱 [Deploy with Database](#deploy-with-database)。若要在 load balancer 後方執行多於一個實例，請參閱 [Multi-region and scaling](./multi_region.md)。

:::info
為避免可預測性問題、回復困難，以及環境不一致，請固定版本或 SHA digest（例如 `litellm:main-v1.90.2` 或 `litellm@sha256:12345abcdef...`），而不要使用 `litellm:latest`。
:::

### Helm Chart {#helm-chart}

:::info

[BETA] Helm Chart 為 BETA。若您遇到任何問題／有任何回饋，請告訴我們 [https://github.com/BerriAI/litellm/issues](https://github.com/BerriAI/litellm/issues)

:::

標準 chart 位於 litellm repo 中的 [`deploy/charts/litellm-helm`](https://github.com/BerriAI/litellm/tree/main/deploy/charts/litellm-helm)，並以 OCI artifact 的形式發佈於 `oci://ghcr.io/berriai/litellm-helm`；已發佈的 chart 版本會帶有 litellm release 編號（例如 `1.90.2`）。本節涵蓋本機快速開始；若要在 EKS、GKE 或 AKS 上搭配受管理的 Postgres 與 Redis 進行正式環境安裝，請參閱 [Deploy to Cloud](./deploy_cloud.md#deploy-with-helm)。

<Tabs>

<TabItem value="helm-oci" label="OCI registry（建議）">

先查看預設值，然後使用您自己的 `values.yaml` 進行安裝：

```bash
# View the chart's configurable values
helm show values oci://ghcr.io/berriai/litellm-helm > values.yaml

# Install (or upgrade) the release
helm install litellm oci://ghcr.io/berriai/litellm-helm -f values.yaml
```

在 `values.yaml` 中設定您的 proxy 設定與 master key；請參閱 [chart values 參考文件](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/values.yaml)。使用 `--version <version>` 鎖定 chart 版本，以確保可重現的安裝。

</TabItem>

<TabItem value="helm-source" label="從原始碼">

直接從 litellm repo 的 checkout 安裝：

```bash
git clone https://github.com/BerriAI/litellm.git
helm install litellm deploy/charts/litellm-helm --set masterkey=sk-1234
```

</TabItem>
</Tabs>

公開服務到 localhost：

```bash
kubectl --namespace default port-forward service/litellm 4000:4000
```

您的 LiteLLM Proxy Server 現在正在 `http://127.0.0.1:4000` 上執行。若要在負載平衡器後方執行多個副本，請參閱 [多區域與擴充](./multi_region.md)。

#### 發出 LLM API 請求 {#make-llm-api-requests}

在 `http://127.0.0.1:4000/ui` 開啟 Admin UI，使用您的主金鑰登入，並從 **Test Key** 試玩區送出請求。若要從程式碼呼叫 proxy，請參閱 [進行您的第一個 LLM API 請求](user_keys)；LiteLLM 與 OpenAI SDK、Anthropic SDK、Mistral SDK、LlamaIndex，以及 Langchain（JS、Python）相容。

## 部署選項 {#deployment-options}

| 文件                                                                                              | 使用時機                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [快速開始](#quick-start)                                                                       | 呼叫 100+ 個 LLM + 負載平衡                                                                                                                       |
| [搭配資料庫部署](#deploy-with-database)                                                     | + 使用虛擬金鑰 + 追蹤支出（注意：使用資料庫部署時，您的環境中需要 `DATABASE_URL` 和 `LITELLM_MASTER_KEY`） |
| [搭配 Redis 部署](#deploy-with-redis)                                                           | + 在多個 litellm 容器之間進行負載平衡（可選搭配資料庫）                                                                        |

### 使用 Database 部署 {#deploy-with-database}
##### Docker、Kubernetes、Helm Chart {#docker-kubernetes-helm-chart}

:::warning 高流量部署（1000+ RPS）

如果您預期高流量（每秒 1000+ 請求），**必須使用 Redis** 以避免資料庫連線耗盡與死鎖。

將以下內容加入您的設定：
```yaml
general_settings:
  use_redis_transaction_buffer: true

litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: your-redis-host
```

詳情請參閱 [解決資料庫死鎖](/docs/proxy/db_deadlocks)。

:::

需求：
- 需要一個 postgres 資料庫（例如 [Supabase](https://supabase.com/)、[Neon](https://neon.tech/) 等）在您的環境中設定 `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>` 
- 設定一個 `LITELLM_MASTER_KEY`，這是您的 Proxy Admin key - 您可以用它來建立其他金鑰（必須以 `sk-` 開頭）

<Tabs>

<TabItem value="docker-deploy" label="Dockerfile">

我們維護了一個[獨立的 Dockerfile](https://github.com/BerriAI/litellm/pkgs/container/litellm-database)，用於在搭配已連線的 Postgres Database 執行 LiteLLM proxy 時縮短建置時間

```shell
docker pull docker.litellm.ai/berriai/litellm-database:latest
```

```shell
docker run \
    -v $(pwd)/litellm_config.yaml:/app/config.yaml \
    -e LITELLM_MASTER_KEY=sk-1234 \
    -e DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname> \
    -e AZURE_API_KEY=d6*********** \
    -e AZURE_API_BASE=https://openai-***********/ \
    -p 4000:4000 \
    docker.litellm.ai/berriai/litellm-database:latest \
    --config /app/config.yaml --detailed_debug
```

您的 LiteLLM Proxy Server 現在正在 `http://0.0.0.0:4000` 上執行。

</TabItem>
<TabItem value="kubernetes-deploy" label="Kubernetes">

使用上方 [Kubernetes](#kubernetes) 區段中的標準 manifest。連接資料庫的變體是相同的 manifest，只是加入 `DATABASE_URL` 和 `LITELLM_MASTER_KEY` 到 Secret，並將 image 設為 `docker.litellm.ai/berriai/litellm-database:main-v1.90.2`（內含 prisma）。其他都不變。

</TabItem>

<TabItem value="helm-deploy" label="Helm">

使用上方描述的 [Helm chart](#helm-chart)。在您的 `values.yaml` 中設定 `DATABASE_URL` 和 `LITELLM_MASTER_KEY`（請參閱 [chart values reference](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/values.yaml)），然後執行 `helm install litellm oci://ghcr.io/berriai/litellm-helm -f values.yaml`。

</TabItem>
</Tabs>

### 使用 Redis 部署 {#deploy-with-redis}
當您需要 litellm 在多個 litellm 容器之間進行負載平衡時，請使用 Redis

唯一需要的變更是在您的 `config.yaml` 上設定 Redis
LiteLLM Proxy 支援跨多個 litellm 執行個體共用 rpm/tpm，傳入 `redis_host`、`redis_password` 和 `redis_port` 以啟用此功能。（LiteLLM 會使用 Redis 追蹤 rpm/tpm 使用量）

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6
router_settings:
  redis_host: <your redis host>
  redis_password: <your redis password>
  redis_port: 1992
```

以設定啟動 docker 容器

```shell
docker run docker.litellm.ai/berriai/litellm:latest --config your_config.yaml
```

若要將 Redis 與資料庫（Virtual Keys 和 spend tracking）結合使用，請保留上方相同的 `router_settings`，切換為 `litellm-database` 映像，並傳入 `DATABASE_URL`：

```shell
docker run --name litellm-proxy \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname> \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm-database:latest --config your_config.yaml
```

若要跨區域或大量執行個體擴充，請參閱 [Multi-region and scaling](./multi_region.md)。

###  （非 Root）- 無需網際網路連線 {#non-root---without-internet-connection}

預設情況下，`prisma generate` 會下載 [prisma 的 engine binaries](https://www.prisma.io/docs/orm/reference/environment-variables-reference#custom-engine-file-locations)。這在沒有網際網路連線時執行可能會造成錯誤。 

請使用此 docker image 來部署預先產生 prisma binaries 的 litellm。

```bash
docker pull docker.litellm.ai/berriai/litellm-non_root:latest
```

[Published Docker Image link](https://github.com/BerriAI/litellm/pkgs/container/litellm-non_root)

## 進階部署設定 {#advanced-deployment-settings}

### 1. 自訂 server root path（Proxy base url） {#1-custom-server-root-path-proxy-base-url}

更多詳細資訊請參閱 [Custom Root Path](./custom_root_ui)。

### 2. SSL 憑證 {#2-ssl-certification}

如果您需要為內部部署的 litellm proxy 設定 ssl 憑證，請使用此項目

在啟動 litellm proxy 時，傳入 `ssl_keyfile_path`（SSL keyfile 的路徑）和 `ssl_certfile_path`（SSL certfile 的路徑）

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --ssl_keyfile_path ssl_test/keyfile.key \
    --ssl_certfile_path ssl_test/certfile.crt
```

在啟動 litellm proxy server 時提供 ssl 憑證

### 3. 使用 Hypercorn 的 Http/2 {#3-http2-with-hypercorn}

如果您想使用 hypercorn 執行 proxy 以支援 http/2，請使用此項目

步驟 1. 使用 hypercorn 建置您的自訂 docker image

```shell
# Use the provided base image
FROM docker.litellm.ai/berriai/litellm:latest

# Set the working directory to /app
WORKDIR /app

# Copy the configuration file into the container at /app
COPY config.yaml .

# Make sure your docker/entrypoint.sh is executable
RUN chmod +x ./docker/entrypoint.sh

# Expose the necessary port
EXPOSE 4000/tcp

# Key change: install hypercorn
RUN uv add hypercorn

# Override the CMD instruction with your desired command and arguments
# WARNING: FOR PROD DO NOT USE `--detailed_debug` it slows down response times, instead use the following CMD
# CMD ["--port", "4000", "--config", "config.yaml"]

CMD ["--port", "4000", "--config", "config.yaml", "--detailed_debug"]
```

步驟 2. 在啟動 proxy 時傳入 `--run_hypercorn` 旗標

```shell
docker run \
    -v $(pwd)/proxy_config.yaml:/app/config.yaml \
    -p 4000:4000 \
    -e LITELLM_LOG="DEBUG"\
    -e SERVER_ROOT_PATH="/api/v1"\
    -e DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname> \
    -e LITELLM_MASTER_KEY="sk-1234"\
    your_custom_docker_image \
    --config /app/config.yaml
    --run_hypercorn
```

### 4. Granian ASGI server（更高輸送量）[Beta] {#4-granian-asgi-server-higher-throughput-beta}

:::info Beta 功能
`--run_granian` 處於**beta**。Uvicorn 仍然是預設伺服器。當您需要更高的閘道吞吐量，或在 uvicorn 的負載下看到不穩定情況時，請試試 Granian；並在 [GitHub](https://github.com/BerriAI/litellm/issues) 回報問題。
:::

可用這個來搭配 [Granian](https://github.com/emmett-framework/granian) 執行 proxy，這是一個以 Rust 為後端的 ASGI 伺服器。HTTP 堆疊是在 Rust 中執行，而不是純 Python，這有助於 proxy 在許多用戶端同時進行健康檢查、認證、路由與快取時保持回應迅速。

**為什麼它有幫助：**
- **更高吞吐量**：在 LiteLLM 的基準測試中，Granian 在相同 worker 數量下，相較於 uvicorn 展現了 **10–20 RPS 的提升**（見 [PR #26027](https://github.com/BerriAI/litellm/pull/26027)）。
- **更好的穩定性**：持續負載測試顯示其延遲更穩定，且比 uvicorn 更少出現尖峰。
- **更少失敗**：負載下的錯誤率更低（在比較的執行中幾乎為零失敗，而 uvicorn 則有失敗）。

Granian 已包含在 `litellm[proxy]` 中，且需要 Python 3.9+。可透過 `--num_workers` 擴展吞吐量。

**範例**（來自 [PR #26027](https://github.com/BerriAI/litellm/pull/26027) 的基準測試設定）：

```shell
litellm --config config.yaml --port 4000 --run_granian --num_workers 4
```

或搭配 Docker：

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml \
    --port 4000 \
    --run_granian \
    --num_workers 4
```

**SSL：** 使用 Granian 啟用 TLS 時，需要 `--ssl_certfile_path` 和 `--ssl_keyfile_path`。

**Granian 不支援：**
- `--max_requests_before_restart`（如果您需要每個請求的 worker 回收，請使用 Gunicorn）
- `--ciphers`（僅限 Hypercorn）

完整旗標詳細資訊請參閱 [CLI 參數、伺服器後端選項](/docs/proxy/cli#server-backend-options)。

### 5. Keepalive 超時 {#5-keepalive-timeout}

預設為 5 秒。兩次請求之間，連線必須在此期間內接收到新資料，否則將被中斷連線。

使用範例：
在此範例中，我們將 keepalive timeout 設為 75 秒。

```shell showLineNumbers title="docker run"
docker run docker.litellm.ai/berriai/litellm:latest \
    --keepalive_timeout 75
```

或透過環境變數設定：
在此範例中，我們將 keepalive timeout 設為 75 秒。

```shell showLineNumbers title="Environment Variable"
export KEEPALIVE_TIMEOUT=75
docker run docker.litellm.ai/berriai/litellm:latest
```


### 在 N 次請求後重新啟動 Workers {#restart-workers-after-n-requests}

使用此功能可透過在固定次數的請求後回收 worker 來緩解記憶體增長。設定後，每個 worker 會在完成指定次數的請求後重新啟動。若未設定，預設為停用。

使用範例：

```shell showLineNumbers title="docker run (CLI flag)"
docker run docker.litellm.ai/berriai/litellm:latest \
    --max_requests_before_restart 10000
```

或透過環境變數設定：

```shell showLineNumbers title="Environment Variable"
export MAX_REQUESTS_BEFORE_RESTART=10000
docker run docker.litellm.ai/berriai/litellm:latest
```


### 6. 位於 s3、GCS Bucket Object/url 的 config.yaml 檔案 {#6-configyaml-file-on-s3-gcs-bucket-objecturl}

如果您無法在部署服務上掛載設定檔，請使用此功能（例如 - AWS Fargate、Railway 等）

LiteLLM Proxy 會從 s3 Bucket 或 GCS Bucket 讀取您的 config.yaml

<Tabs>
<TabItem value="gcs" label="GCS Bucket">

設定以下 .env 變數 
```shell
LITELLM_CONFIG_BUCKET_TYPE = "gcs"                              # set this to "gcs"         
LITELLM_CONFIG_BUCKET_NAME = "litellm-proxy"                    # your bucket name on GCS
LITELLM_CONFIG_BUCKET_OBJECT_KEY = "proxy_config.yaml"         # object key on GCS
```

使用這些 env vars 啟動 litellm proxy - litellm 會從 GCS 讀取您的設定 

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME=<bucket_name> \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="<object_key>> \
   -e LITELLM_CONFIG_BUCKET_TYPE="gcs" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest --detailed_debug
```

</TabItem>

<TabItem value="s3" label="s3">

設定以下 .env 變數 
```shell
LITELLM_CONFIG_BUCKET_NAME = "litellm-proxy"                    # your bucket name on s3 
LITELLM_CONFIG_BUCKET_OBJECT_KEY = "litellm_proxy_config.yaml"  # object key on s3
```

使用這些 env vars 啟動 litellm proxy - litellm 會從 s3 讀取您的設定 

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME=<bucket_name> \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="<object_key>> \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest
```
</TabItem>
</Tabs>

### 7. 停用即時模型價格下載 {#7-disable-pulling-live-model-prices}

如果您看到較長的冷啟動時間或網路安全性問題，可停用從 LiteLLM 的[託管模型價格檔案](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)提取模型價格。

```env
export LITELLM_LOCAL_MODEL_COST_MAP="True"
```

這樣會改用本地模型價格檔案。

## 平台特定指南 {#platform-specific-guide}

如需 AWS（ECS、EKS、CloudFormation）、GCP（GKE、Cloud Run）和 Azure（AKS）的代管雲端部署（包括 Terraform modules），請參閱[部署到雲端（AWS、GCP、Azure）](./deploy_cloud.md)。

Render 和 Railway 是該指南未涵蓋的快速選項：

<Tabs>
<TabItem value="render" label="Render deploy">

### Render {#render}

https://render.com/

<iframe width="840" height="500" src="https://www.loom.com/embed/805964b3c8384b41be180a61442389a3" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

</TabItem>
<TabItem value="railway" label="Railway">

### Railway {#railway}

https://railway.app

**步驟 1：點擊按鈕** 以部署到 Railway

[![在 Railway 上部署](https://railway.app/button.svg)](https://railway.app/template/S7P9sn?referralCode=t3ukrU)

**步驟 2：** 在 Railway 環境變數中將 `PORT` 設為 4000

</TabItem>
</Tabs>

## 額外內容 {#extras}

### 基於 IAM 的 RDS DB 驗證 {#iam-based-auth-for-rds-db}

1. 設定 AWS 環境變數 

```bash
export AWS_WEB_IDENTITY_TOKEN='/path/to/token'
export AWS_ROLE_NAME='arn:aws:iam::123456789012:role/MyRole'
export AWS_SESSION_NAME='MySession'
```

[**查看所有驗證選項**](https://github.com/BerriAI/litellm/blob/089a4f279ad61b7b3e213d8039fb9b75204a7abc/litellm/proxy/auth/rds_iam_token.py#L165)

2. 將 RDS 憑證加入環境變數

```bash
export DATABASE_USER="db-user"
export DATABASE_PORT="5432"
export DATABASE_HOST="database-1-instance-1.cs1ksmwz2xt3.us-west-2.rds.amazonaws.com"
export DATABASE_NAME="database-1-instance-1"
export DATABASE_SCHEMA="schema-name" # skip to use the default "public" schema
```

3. 使用 iam+rds 執行 proxy

```bash
litellm --config /path/to/config.yaml --iam_token_db_auth
```

### 封鎖網路爬蟲 {#blocking-web-crawlers}

注意：這是[僅限企業版功能](https://docs.litellm.ai/docs/enterprise)。

若要阻止網路爬蟲索引 proxy server 端點，請在您的 `litellm_config.yaml` 檔案中將 `block_robots` 設定設為 `true`。

```yaml showLineNumbers title="litellm_config.yaml"
general_settings:
  block_robots: true
```

#### 運作方式 {#how-it-works}

啟用後，`/robots.txt` 端點將回傳 200 狀態碼，內容如下：

```shell showLineNumbers title="robots.txt"
User-agent: *
Disallow: /
```

## 部署常見問題 {#deployment-faq}

**問：Postgres 是唯一支援的資料庫嗎？還是也支援其他資料庫（例如 Mongo）？**

答：我們曾評估過 MySQL，但維護成本高且容易為客戶帶來 bug。目前，PostgreSQL 是我們在正式環境部署中主要支援的資料庫。

由於 LiteLLM 透過 Prisma，使用 PostgreSQL wire protocol 與資料庫通訊，因此任何相容 Postgres wire 的分散式 SQL 資料庫都可直接替代。[YugabyteDB](https://www.yugabyte.com/) 已在正式環境中以此方式使用；將 `DATABASE_URL` 指向其 YSQL 端點（`postgresql://<user>:<password>@<host>:<port>/<dbname>`），LiteLLM 就會以不變更的方式執行 migrations 與查詢。若您需要超出單一 Postgres 執行個體所能提供的水平擴充或跨區域高可用性，這會是很合適的選擇。

**問：如果 Postgres 停機，LiteLLM 會如何反應？是 fail-open 還是會有 API 停機？**

A：如果 DB 位於您的 VPC 中，您可以優雅地處理 DB 無法使用的情況。更多詳情請參閱我們的正式環境指南：[優雅地處理 DB 無法使用](https://docs.litellm.ai/docs/proxy/prod#6-if-running-litellm-on-vpc-gracefully-handle-db-unavailability)
