---
title: 使用 Helm 部署
description: 以 Argo CD 或 Helm 將 LiteLLM 安裝到 Kubernetes。在 values.yaml 參考中查詢 chart 設定與預設值。
toc_max_heading_level: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Helm 部署 {#deploy-with-helm}

{/* keep-version-note */}

## 前置條件 {#prerequisites}

使用 Kubernetes 1.25 或更新版本，以及 Helm 3.8 或更新版本。

佈建 PostgreSQL 與 Redis，讓您的叢集可私有存取。使用[大小規劃指南](./sizing.md) 選擇它們的容量。

安裝前先建立 `litellm` 命名空間與這些 Secret：

| Secret | 欄位 |
| --- | --- |
| `litellm-master-key-secret` | `master-key` |
| `litellm-writer-secret` | `username`, `password` |
| `litellm-redis` | `password` |
| `litellm-env` | `LITELLM_SALT_KEY` 與任何提供者憑證 |

## 安裝 chart {#install-the-chart}

<Tabs queryString="install">
<TabItem value="argocd" label="Argo CD" default>

設定資料庫與 Redis 主機。為您的控制器加入[入口值](#ingress)。

```yaml title="application.yaml"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: litellm
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ghcr.io/berriai/litellm/chart
    chart: litellm
    targetRevision: "1.0.0"
    helm:
      valuesObject:
        image:
          tag: lts
        database:
          writer:
            host: postgres.internal.example.com
            dbname: litellm
        redis:
          host: redis.internal.example.com
          ssl: true
          sslCertReqs: required
          passwordSecret:
            name: litellm-redis
        gateway:
          envSecrets: [litellm-env]
          extraEnv:
            - name: STORE_MODEL_IN_DB
              value: "True"
        backend:
          envSecrets: [litellm-env]
          extraEnv:
            - name: STORE_MODEL_IN_DB
              value: "True"
        migrationJob:
          hooks:
            helm:
              enabled: false
            argocd:
              enabled: true
  destination:
    server: https://kubernetes.default.svc
    namespace: litellm
```

同步完整的 Application。遷移 Job 會在服務之前執行。請參閱 [Argo CD 的 Helm 設定](https://argo-cd.readthedocs.io/en/stable/user-guide/helm/) 與[同步 hooks](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)。

</TabItem>
<TabItem value="cli" label="Helm CLI">

將這些覆寫存為 `values.yaml`。替換資料庫與 Redis 主機。為您的控制器加入[入口值](#ingress)。

```yaml title="values.yaml"
image:
  tag: lts
database:
  writer:
    host: postgres.internal.example.com
    dbname: litellm
redis:
  host: redis.internal.example.com
  ssl: true
  sslCertReqs: required
  passwordSecret:
    name: litellm-redis
gateway:
  envSecrets: [litellm-env]
  extraEnv:
    - name: STORE_MODEL_IN_DB
      value: "True"
backend:
  envSecrets: [litellm-env]
  extraEnv:
    - name: STORE_MODEL_IN_DB
      value: "True"
```

```bash
helm upgrade --install litellm oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.0.0 \
  --namespace litellm --values values.yaml \
  --wait --timeout 30m
```

</TabItem>
</Tabs>

## values.yaml 參考 {#valuesyaml-reference}

所有設定請參閱[完整的 values.yaml](https://github.com/BerriAI/litellm/blob/main/litellm/deploy/helm/litellm/values.yaml)。

`<component>` 指 `gateway`、`backend` 或 `ui`。同一列的短名稱共用第一個值的前綴。

<details>
<summary>映像與部署模式</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `image.repository` | `ghcr.io/berriai/litellm` | 容器映像儲存庫。 |
| `image.tag` | `""` | 為空時使用 chart 的 `appVersion`。 |
| `image.digest` | `""` | 容器映像摘要。 |
| `image.pullPolicy` | `IfNotPresent` | Kubernetes 映像拉取政策。 |
| `imagePullSecrets` | `[]` | 發佈命名空間中可用的現有登錄庫 Secret。 |
| `monolith.enabled` | `false` | 為 true 時執行單一 proxy。它使用 `gateway.*`，並忽略 `backend.*` 與 `ui.*`。 |
| `monolith.extraArgs` | `[]` | 單一服務 proxy 的額外 CLI 引數。 |
| `gateway.enabled`, `backend.enabled`, `ui.enabled` | 全部為 `true` | 在分離服務模式下啟用每個服務。在單一服務模式下忽略。 |
| `nameOverride`, `fullnameOverride` | 兩者皆為 `""` | 覆寫產生的資源名稱。 |

</details>

<details>
<summary>Secret 與連線</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `masterKey.secretName`, `masterKey.secretKey` | `litellm-master-key-secret`, `master-key` | 包含主金鑰的 Secret 與欄位。 |
| `masterKey.generate` | `false` | 僅在為 true 且 `masterKey.secretName` 為空時產生主金鑰。 |
| `database.writer.host` | `""` | 必填，除非您設定 `database.writer.passwordSecret.hostKey` 或 `urlKey`。 |
| `database.writer.port` | `5432` | 使用主機而非完整 URL 時的寫入者連接埠。 |
| `database.writer.dbname`, `database.writer.schema` | 兩者皆為 `""` | 主機模式下資料庫名稱必填。Schema 為選用。 |
| `database.writer.passwordSecret` | 名稱 `litellm-writer-secret`，金鑰 `username` 與 `password` | 現有的憑證 Secret。`hostKey` 與 `urlKey` 預設為空。完整 URL 會取代分開的連線設定。 |
| `database.writer.useIAMAuth`, `useAzureEntraAuth` | 兩者皆為 `false` | 使用資料庫 token 而非密碼。最多啟用一個，並保留使用者名稱 Secret。 |
| `database.writer.sslMode`, `sslRootCert` | 兩者皆為 `""` | 資料庫 TLS 設定。僅有根憑證即表示 `verify-full`。 |
| `database.reader.host` | `""` | 選用的唯讀副本。設定主機、`passwordSecret.hostKey` 或 `passwordSecret.urlKey` 以啟用它。 |
| `database.reader.port`, `dbname`, `schema` | `5432`, `""`, `""` | 主機模式下讀取者資料庫名稱必填。完整 URL 會提供自己的連線欄位。 |
| `database.reader.passwordSecret` | 名稱 `litellm-reader-secret`，金鑰 `username` 與 `password` | 讀取者憑證。`hostKey` 與 `urlKey` 預設為空。 |
| `database.reader.useIAMAuth`, `useAzureEntraAuth` | 兩者皆為 `false` | 讀取者 token 驗證需要對應的寫入者選項。 |
| `database.connectionPool` | `enabled: false`, `maxDbConnections: 20`, `maxClientConn: 1000` | 啟用容器內的閘道連線池。後端與遷移 Job 直接連線。 |
| `redis.host`, `redis.passwordSecret.hostKey`, `redis.passwordSecret.urlKey` | 全部為 `""` | Redis 端點選項。完整 URL 會取代分開的連線設定。 |
| `redis.port`, `redis.cluster` | `6379`, `false` | Redis 連接埠與叢集探索模式。 |
| `redis.passwordSecret.name`, `passwordKey` | `""`, `password` | 現有的 Redis Secret。`hostKey` 或 `urlKey` 需要 Secret。名稱為空時允許無密碼的主機。 |
| `redis.ssl`, `sslCertReqs`, `sslCaCerts` | `false`, `""`, `""` | TLS、憑證驗證模式與掛載的 CA 路徑。對於完整 URL，請改用 `rediss://` 與 URL TLS 參數。 |

</details>

<details id="ingress">
<summary>入口</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `ingress.enabled` | `false` | 建立 Ingress。其控制器請另外安裝。 |
| `ingress.className` | `""` | Kubernetes 入口類別。請依您安裝的控制器設定。 |
| `ingress.controller` | `alb` | 選取 `alb` 或 `nginx` 路徑語法。 |
| `ingress.host` | `""` | 路徑路由的共用主機名稱。為空時建立不含主機的規則。 |
| `ingress.annotations` | `{}` | 控制器設定，例如內部前端、憑證與監聽連接埠。 |
| `ingress.tls` | `[]` | 供使用它們的控制器使用的 Kubernetes 入口 TLS 項目。 |
| `ingress.componentHosts.ui`, `.backend`, `.gateway` | 全部為 `""` | 分離的元件主機名稱。三個一起設定，並讓 `ingress.host` 與 `ingress.extraPaths` 保持空白。 |
| `ui.publicUrl`, `ui.backendUrl`, `backend.gatewayUrl` | 全部為 `""` | 設定元件主機名稱時，分離服務模式下必填。使用不含路徑的來源。共用主機路徑路由不需要這些值。 |
| `ingress.extraPaths` | `[]` | 在後端 catch-all 之前加入路徑。項目需要 `path`。元件目標預設為 `service: gateway` 與 `pathType: Prefix`。重複的內建路由會被拒絕。 |
| `ingress.extraPaths[].serviceName`, `.servicePort` | 未設定 | 將額外路徑路由到另一個 Kubernetes Service。兩者都設定，並省略 `service`。 |

在單一服務模式下，內建與元件目標路徑使用單體 Service。讓健康與指標端點保持私有。

在元件模式下，chart 將閘道服務的每個路徑都路由到閘道 Service。使用 `alb` 控制器時，它在每個 ALB 規則中放入兩個閘道前綴，讓預設安裝保持在 ALB 監聽器預設允許的 100 條規則以下。舊版 chart 將 `/decisions`、`/v1/decisions`、`/deepgram`、`/extraction`、`/v1/extraction`、`/fal_ai`、`/gigachat`、`/live/sessions`、`/v1/live/sessions`、`/nvidia_nim`、`/openrouter`、`/systemone`、`/v1/systemone`、`/tinyfish`、`/typesafe`、`/watsonx` 以及確切路徑 `/eu_jev/v1/systemone` 送到後端 catch-all。若您曾將其中任何一個加入 `ingress.extraPaths` 作為因應措施，升級時請移除這些項目。與內建路由具有相同路徑與路徑類型的項目會使 chart 無法算繪。網路放置請使用[雲端參考架構](./cloud/overview.md)。

</details>

<details>
<summary>資源與擴展</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `gateway.resources` | Requests `1` CPU / `4Gi`, limits `2` CPU / `4Gi` | 每個閘道容器的資源。也適用於單體。 |
| `backend.resources` | Requests `1` CPU / `4Gi`, limits `2` CPU / `4Gi` | 每個管理後端容器的資源。 |
| `ui.resources` | Requests `500m` CPU / `500Mi`, limits `1` CPU / `1Gi` | 每個靜態 UI 容器的資源。 |
| `gateway.numWorkers` | `1` | 每個閘道或單體 pod 的工作程序數。 |
| `<component>.replicaCount` | `null` | HPA 停用時的固定數量。閘道還需要停用 KEDA。為空時省略此欄位。 |
| `gateway.hpa` | 啟用，`1–10` 個副本，CPU `70%`，記憶體 `80%` | 閘道自動擴展目標。 |
| `backend.hpa` | 啟用，`1–4` 個副本，CPU `70%` | 後端自動擴展目標。 |
| `ui.hpa` | 停用，`1–3` 個副本，CPU `80%` | 啟用時的 UI 自動擴展目標。 |
| `<component>.hpa.behavior` | `{}` | Kubernetes 擴大與縮小政策。 |
| `gateway.hpa.targetRequestsPerSecond`, `targetTokensPerSecond` | 兩者皆為 `""` | 選用的每個 pod 目標。需要指標收集與 Prometheus Adapter。 |
| `gateway.keda` | 停用，`minReplicaCount: 1`, `maxReplicaCount: 10` | 替代的閘道自動擴展器。需要 KEDA 與 `gateway.hpa.enabled: false`。 |
| `gateway.keda.pollingInterval`, `cooldownPeriod` | `30`, `300` 秒 | KEDA 輪詢與縮減至零的冷卻設定。 |
| `gateway.keda.triggers`, `advanced`, `fallback` | `[]`, `{}`, `{}` | 自訂 KEDA 觸發器與行為。 |
| `gateway.keda.prometheus` | 伺服器位址與工作負載目標為空 | 設定 `serverAddress` 並搭配 `targetRequestsPerSecond` 或 `targetTokensPerSecond` 其中之一，以加入工作負載觸發器。 |
| `<component>.pdb` | 停用，`minAvailable` 與 `maxUnavailable` 為空 | Pod 中斷預算。設定一個上限。啟用但兩者皆未設定時使用 `maxUnavailable: 1`。 |

為閘道自動擴展加入 [RPS 與 TPS 目標](./autoscaling.md#scale-on-requests-and-tokens-per-pod)，搭配 CPU 與記憶體。容量規劃請參閱[大小規劃與擴展](./sizing.md)。

</details>

<details>
<summary>設定與 pod 設定</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `gateway.config.create` | `true` | 建立並掛載共用的 proxy 設定。 |
| `gateway.config.proxy_config` | `{}` | 由閘道與後端載入的 LiteLLM YAML 設定。請參閱[設定](../configuration/overview.md)。 |
| `<component>.logLevel` | `INFO` | 元件記錄等級。 |
| `<component>.extraEnv`, `envSecrets`, `envConfigMaps` | 全部為 `[]` | 環境變數與現有的 Secret 或 ConfigMap 名稱。 |
| `<component>.volumes`, `volumeMounts` | 兩者皆為 `[]` | 額外的 Kubernetes 磁碟區與容器掛載。 |
| `<component>.service.type` | `ClusterIP` | Kubernetes Service 類型。 |
| `gateway.service.port`, `backend.service.port`, `ui.service.port` | `4000`, `4001`, `3000` | Service 連接埠。單體使用 `gateway.service.port`。 |
| `<component>.service.annotations`, `loadBalancerClass` | `{}`, `""` | Service 註解與選用的負載平衡器類別。 |
| `<component>.livenessProbe`, `readinessProbe` | Gateway/backend: `/health/liveliness`, `/health/readiness`. UI: `/` | HTTP 健康探針。時間與閾值的完整預設值請參閱完整設定。 |
| `<component>.startupProbe`, `strategy` | 兩者皆為 `{}` | 選用的啟動探針與部署策略。策略為空時繼承 Kubernetes 滾動更新預設值。 |
| `<component>.minReadySeconds`, `terminationGracePeriodSeconds` | 兩者皆為 `""` | 預設省略。Kubernetes 預設值為 `0` 與 `30` 秒。 |
| `<component>.podSecurityContext`, `securityContext` | 兩者皆為 `{}` | Pod 與容器安全設定。 |
| `<component>.deploymentLabels`, `deploymentAnnotations`, `podLabels`, `podAnnotations` | 全部為 `{}` | 額外的標籤與註解。 |
| `<component>.nodeSelector`, `affinity`, `tolerations`, `topologySpreadConstraints` | `{}`, `{}`, `[]`, `[]` | Pod 放置與可用性區域分布。 |
| `<component>.lifecycle`, `extraContainers`, `extraInitContainers` | `{}`, `[]`, `[]` | 生命週期 hooks、sidecar 與 init 容器。 |
| `serviceAccounts.<component>` | `create: false`, `name: ""`, `annotations: {}` | 使用現有的具名帳戶或命名空間的預設帳戶。啟用 `create` 以建立一個。 |
| `serviceAccounts.<component>.automount` | 閘道/後端 `true`，UI `false` | 掛載 Kubernetes 服務帳戶 token。 |
| `extraResources` | `[]` | 隨發佈一起算繪的額外 Kubernetes 資源。 |

</details>

<details>
<summary>指標與選用工作負載</summary>

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `gateway.metricsServer.enabled`, `.port` | `false`, `4001` | 獨立的 metrics sidecar 與私有 metrics Service。 |
| `gateway.metricsServer.resources` | Requests `50m` CPU / `128Mi`, memory limit `512Mi` | Metrics sidecar 資源。 |
| `gateway.serviceMonitor.enabled`, `.interval`, `.scrapeTimeout` | `false`, `15s`, `10s` | Prometheus Operator 監控。需要 `gateway.metricsServer.enabled: true`。 |
| `gateway.serviceMonitor.scheme`, `.tlsConfig` | `http`, `{}` | Prometheus 抓取傳輸設定。 |
| `gateway.serviceMonitor.labels`, `.annotations`, `.relabelings`, `.namespaceSelector.matchNames` | `{}`, `{}`, `[]`, `[]` | 探索標籤與抓取選項。命名空間選取為空時使用發佈命名空間。 |
| `gateway.collector.enabled`, `.address` | `false`, `unix:///var/run/litellm/collector.sock` | 將回應後的支出處理移到 sidecar。 |
| `gateway.collector.bufferSize`, `.onUnavailable`, `.drainTimeoutSeconds` | `1000`, `fallback`, `10` | 每個工作程序的緩衝區、收集器不可用時的行為，以及關閉排空時間。 |
| `gateway.collector.resources` | Requests `500m` CPU / `1Gi`, limits `1` CPU / `2Gi` | 收集器 sidecar 資源。 |
| `gateway.collector.scaleOnGatewayContainerCpu` | `true` | 在收集器與 CPU HPA 啟用時，僅依主容器的 CPU 擴展。需要 Kubernetes 1.30 或更新版本。 |
| `migrationJob.enabled`, `.hooks.helm.enabled`, `.hooks.argocd.enabled` | `true`, `true`, `false` | 遷移 Job 與控制器 hooks。 |
| `migrationJob.mode` | `data-plane` | 選取資料平面或 `control-plane` 遷移。 |
| `migrationJob.controlPlane.databaseSecret.name`, `.key` | `""`, `database-url` | 包含控制平面資料庫 URL 的 Secret。控制平面遷移必填。 |
| `migrationJob.backoffLimit`, `.activeDeadlineSeconds`, `.ttlSecondsAfterFinished` | `4`, `1800`, `120` | Job 重試、總期限與清理延遲。Argo CD 使用 hook 清理而非 TTL。 |
| `migrationJob.serviceAccountName`, `.automountServiceAccountToken` | `""`, `false` | Job 身分。當雲端資料庫驗證需要時，指定一個現有帳戶。 |
| `billingMetrics.enabled` | `false` | Enterprise 請求計量。 |
| `liteadmin.enabled` | `false` | 選用的管理 worker。需要 `liteadmin.existingSecret`、`liteadmin.gatewayUrl` 與 `liteadmin.model`。 |
| `lens.enabled` | `false` | 連線到另外部署的 Lens 服務。需要其內部與公開 URL，以及閘道與服務 token Secret。 |

</details>
