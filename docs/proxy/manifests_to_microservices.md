---
title: 從 Kubernetes Manifests 遷移到 Microservices Chart
description: 將以原始 Kubernetes manifests 部署的 LiteLLM proxy 移至元件化的 litellm Helm chart，使 gateway、backend 與 UI 可獨立擴展。
---

# 從 Kubernetes Manifests 遷移到 Microservices Chart {#migrate-from-kubernetes-manifests-to-the-microservices-chart}

本指南會將一個以手寫 Kubernetes manifests 執行的 LiteLLM proxy（[不使用 Helm 的 Kubernetes](./deploy.md#kubernetes-without-helm) 版面：一個 `Deployment`、一個 `Service`、一個 `ConfigMap`，以及一個 `Secret`）移至元件化的 `litellm` Helm chart，其中 LLM 流量（`gateway`）、管理 API（`backend`）與 Admin UI（`ui`）會以各自的自動擴縮獨立作為不同的 Deployment 執行。既有的 Postgres 資料庫與 Redis 會保留；不會搬移任何資料。舊的 Deployment 會持續運作，直到新的發行版開始提供流量，因此每一步都可逆向切換。

您需要 `helm` 3.8 或更新版本、對目標命名空間的 `kubectl` 存取權限、目前的 manifests，以及從叢集到 Postgres 與 Redis 的網路可達性。關於每個值的用途，請參閱該 chart 的 [`values.yaml`](https://github.com/BerriAI/litellm/blob/main/helm/litellm/values.yaml)；關於這兩種模式背後的架構，請參閱 [Production Deployment](./deploy.md#architecture)。

## 1. 擷取目前的部署 {#1-capture-the-current-deployment}

記錄 image 標籤、複本數、設定，以及 proxy 目前讀取的每一個環境變數，確保不會在轉換過程中遺失。

```bash
kubectl get deploy litellm-deployment -o yaml > old-deployment.yaml
kubectl get cm litellm-config-file -o yaml > old-config.yaml
kubectl get svc litellm-service -o yaml > old-service.yaml
kubectl get ingress -o yaml > old-ingress.yaml
kubectl get secret litellm-secrets -o jsonpath='{.data}' | jq 'keys'
```

請調整名稱以符合您的 manifests。從 `old-deployment.yaml` 記下 `spec.replicas`、`spec.template.spec.containers[0].image`、`env`、`envFrom`、`resources`，以及任何探測覆寫。從 `old-config.yaml` 保留 `config.yaml` 本體；它會在步驟 4 中原封不動地重用。

## 2. 將 `DATABASE_URL` 拆分為使用者名稱與密碼 Secret {#2-split-database_url-into-a-username-and-password-secret}

該 chart 不會讀取 `DATABASE_URL`。它會從離散值與一個 Secret 設定 `DATABASE_HOST`、`DATABASE_PORT`、`DATABASE_NAME`、`DATABASE_USER` 和 `DATABASE_PASSWORD`，而 proxy 會自行建構 URL。將既有 URL（`postgresql://USER:PASSWORD@HOST:PORT/DBNAME`）中的各部分取出並建立 Secret：

```bash
kubectl create secret generic litellm-db \
  --from-literal=username='USER' \
  --from-literal=password='PASSWORD'
```

含有 `@`、`/` 或 `%` 的密碼在此不需要跳脫；proxy 會將它們進行百分比編碼。

保留既有的 `litellm-secrets` Secret。該 chart 會直接從其中參照 master key，而其中的 provider 金鑰會在步驟 4 中整體掛載。如果舊的 Deployment 中設定了 `LITELLM_SALT_KEY`，請將其保留在同一個 Secret 中；變更它會使已儲存的 provider 憑證無法讀取。

## 3. 選擇 chart 版本 {#3-choose-the-chart-version}

將 chart 固定到與目前 proxy image 相符，或比它更新的版本；元件 image 標籤預設為 chart 版本，因此位於 `v1.90.2` 的 proxy 會移至 chart `1.90.2`。chart `1.89.0` 是最舊支援版本。

```bash
helm show chart oci://ghcr.io/berriai/litellm/chart/litellm --version 1.90.2
```

## 4. 撰寫 `values.yaml` {#4-write-valuesyaml}

依照此對應將 manifests 轉換。

| Manifest | Chart 值 |
| --- | --- |
| `ConfigMap` `config.yaml` 本體 | `gateway.config.proxy_config`（gateway 與 backend 共用） |
| Secret 中的 `LITELLM_MASTER_KEY` 鍵 | `masterKey.secretName`、`masterKey.secretKey` |
| `DATABASE_URL` | `database.writer.host`、`.port`、`.dbname`、`.passwordSecret`（步驟 2） |
| `REDIS_HOST`、`REDIS_PORT`、`REDIS_PASSWORD` | `redis.host`、`redis.port`、`redis.passwordSecret` |
| `envFrom.secretRef` 中的 provider 金鑰 | `gateway.envSecrets` 與 `backend.envSecrets` |
| 其他 `env` 項目 | `gateway.extraEnv`、`backend.extraEnv` |
| `spec.replicas` | `gateway.hpa.minReplicas`（或 `gateway.replicaCount` 搭配 `gateway.hpa.enabled: false`） |
| `resources` | `gateway.resources` |
| `args: ["--config", ...]` | 移除；該 chart 會設定 `CONFIG_FILE_PATH` |
| `Ingress` 主機 | `ingress.host` |

一個具有兩個複本、provider 金鑰位於 `litellm-secrets`，且 Redis 位於 `redis.internal` 的 manifest 部署會變成：

```yaml title="values.yaml"
masterKey:
  secretName: litellm-secrets
  secretKey: LITELLM_MASTER_KEY

database:
  writer:
    host: postgres.internal
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-db
      usernameKey: username
      passwordKey: password

redis:
  host: redis.internal
  port: 6379
  passwordSecret:
    name: litellm-secrets
    passwordKey: REDIS_PASSWORD

gateway:
  envSecrets:
    - litellm-secrets
  resources:
    requests: { cpu: "1", memory: 4Gi }
    limits: { cpu: "2", memory: 4Gi }
  hpa:
    minReplicas: 2
    maxReplicas: 10
  config:
    proxy_config:
      model_list:
        - model_name: gpt-4o
          litellm_params:
            model: openai/gpt-4o
            api_key: os.environ/OPENAI_API_KEY
      router_settings:
        redis_host: os.environ/REDIS_HOST
        redis_port: os.environ/REDIS_PORT
        redis_password: os.environ/REDIS_PASSWORD
      litellm_settings:
        cache: true
        cache_params:
          type: redis
          host: os.environ/REDIS_HOST
          port: os.environ/REDIS_PORT
          password: os.environ/REDIS_PASSWORD

backend:
  envSecrets:
    - litellm-secrets

ingress:
  enabled: false
```

如果您的 Redis 沒有密碼，請移除 `redis.passwordSecret` 區塊。如果舊的部署沒有 Redis，請在擴展到一個以上的 pod 前先新增一個；請參閱 [What Needs Redis](./redis_requirements.md)。目前先保留 `ingress.enabled: false`；流量會在步驟 7 移動。

在安裝前先渲染並檢查結果：

```bash
helm template litellm oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.90.2 -f values.yaml | kubectl apply --dry-run=server -f -
```

## 5. 與舊部署並行安裝 {#5-install-alongside-the-old-deployment}

該 chart 的資源名稱（`litellm-gateway`、`litellm-backend`、`litellm-ui`、`litellm-gateway-config`）不會與 manifest 名稱衝突，因此兩者可以在同一個命名空間中同時執行。

```bash
helm upgrade --install litellm oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.90.2 -f values.yaml --wait --timeout 10m
```

Helm 會在建立 Deployments 之前，以 pre-install hook 執行 migrations Job。它會套用與舊 image 在啟動時相同的 Prisma migrations，因此在資料庫已是最新狀態時不會有動作。舊的 pods 會在整個過程中持續以同一個 schema 執行。

```bash
kubectl get pods -l app.kubernetes.io/instance=litellm
kubectl logs job/litellm-migrations
```

如果 Job 失敗，請修正資料庫值並重新執行相同的 `helm upgrade` 指令；此時尚未建立任何其他內容。

## 6. 驗證新的發行版 {#6-verify-the-new-release}

在對外開放之前，先透過各自的 Service 測試每個元件。

```bash
kubectl port-forward svc/litellm-gateway 4000:4000 &
kubectl port-forward svc/litellm-backend 4001:4001 &
kubectl port-forward svc/litellm-ui 3000:3000 &

curl -s localhost:4000/health/readiness
curl -s localhost:4000/v1/models -H "Authorization: Bearer $LITELLM_MASTER_KEY"
curl -s localhost:4000/v1/chat/completions -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
curl -s localhost:4001/key/info -H "Authorization: Bearer $LITELLM_MASTER_KEY"
curl -sI localhost:3000/ui/
```

readiness 回應應該回報 `"cache": "redis"`，而 `/v1/models` 應傳回與舊部署相同的 models。既有的 virtual key 必須能對新的 gateway 正常運作，這可確認使用的是舊部署所使用的資料庫與 master key。

## 7. 移轉流量 {#7-move-traffic}

將 ingress 指向該 chart。啟用與舊版相同主機上的 chart ingress，並在同一步驟刪除舊的 Ingress；或者，如果您在 chart 外部管理 ingress，則依路徑重新指向規則：`/v1/*`、`/chat/*`、`/health`、`/metrics` 以及其他 LLM 路由指向 `litellm-gateway:4000`、`/ui`、`/_next`、`/litellm-asset-prefix` 和 `/` 指向 `litellm-ui:3000`，而其他所有內容（`/key/*`、`/team/*`、`/user/*`、...）則指向 `litellm-backend:4001`。完整的路徑切分請參閱 [`templates/ingress.yaml`](https://github.com/BerriAI/litellm/blob/main/helm/litellm/templates/ingress.yaml)。

```yaml title="values.yaml"
ingress:
  enabled: true
  className: alb            # or nginx
  controller: alb           # or nginx
  host: llm.example.com
  annotations: {}           # copy TLS and load balancer annotations from old-ingress.yaml
```

```bash
kubectl delete -f old-ingress.yaml
helm upgrade litellm oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.90.2 -f values.yaml --wait
```

原本使用叢集內 Service 名稱（`litellm-service:4000`）的用戶端必須改為使用 `litellm-gateway:4000` 進行 LLM 請求，以及使用 `litellm-backend:4001` 進行管理請求。

觀察 gateway 的 HPA 與錯誤率幾分鐘：

```bash
kubectl get hpa litellm-gateway -w
kubectl logs deploy/litellm-gateway -f | grep -i error
```

## 8. 擴展 gateway {#8-scale-the-gateway}

gateway 的 HPA 預設為啟用，並具有 CPU 與記憶體目標，且只會擴展 gateway 本身；backend 有自己的 HPA，而 UI 除非設定 `ui.hpa.enabled`，否則會固定為一個複本。依據負載需求提高 `gateway.hpa.maxReplicas` 或下限，然後 `helm upgrade`。對於 LLM 流量而言，pod 會先在開啟連線數達到飽和而非 CPU 達到飽和，因此請依照 [依請求與每個 pod 的 token 數進行擴展](./deploy.md#scale-on-requests-and-tokens-per-pod) 的說明新增 requests 或 tokens per second 目標。

如果舊部署曾發生 crash-loop，請先確認原因，再依賴更多複本：舊 pod 上的 `kubectl describe pod` 會顯示 `OOMKilled`（提高 `gateway.resources.limits.memory`）、啟動期間的 liveness 失敗（設定 `gateway.startupProbe`），或是 `kubectl logs --previous` 中的資料庫或 Redis 連線錯誤。複本只會放大錯誤設定，而不會修正它。

## 9. 移除舊部署 {#9-remove-the-old-deployment}

一旦新的發行版已在正式環境承接流量且未出現問題，請刪除 manifest 物件。保留 Secret；該 chart 會參照它。

```bash
kubectl delete -f old-deployment.yaml -f old-service.yaml
kubectl delete -f old-config.yaml
```

## 回滾 {#roll-back}

在舊的 Deployment 仍然存在期間，還原第 7 步的 ingress 變更（`kubectl apply -f old-ingress.yaml` 和 `helm upgrade ... --set ingress.enabled=false`），流量就會回到舊的 pod。只要 chart 版本沒有比舊映像檔更新，資料庫不會受到此遷移影響；如果您已升級到較新的 chart，它所套用的結構描述變更是單向的，而回復目標必須是至少該版本的映像檔。若要完全移除 chart，`helm uninstall litellm`，這會保留外部資料庫、Redis 和您的 Secrets。
