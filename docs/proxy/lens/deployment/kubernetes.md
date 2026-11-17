---
title: "Kubernetes"
description: "使用其專屬的 Helm chart 部署獨立 Lens，並可選擇連接 LiteLLM。"
slug: "/proxy/lens/deployment/kubernetes"
---

# Kubernetes {#kubernetes}

[Lens Helm chart](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md) 會部署完整的 Lens UI、Rust API 和背景處理，並搭配 ClickHouse 和 Keeper。此原始碼安裝使用公開的 Lens 儲存庫，需要 Kubernetes 叢集、Helm、kubectl，以及供持久磁碟區使用的儲存類別。獨立 Lens 不需要閘道或 PostgreSQL

如需從您的程式碼代理程式取得協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md)，並指定 Helm

## 新部署 {#new-deployment}

在獨立版本發佈之前，請建置原始碼映像，並將它推送到您的叢集可以讀取的登錄。使用與叢集節點 Linux 架構相符的原生建置器。從 [BerriAI/lens](https://github.com/BerriAI/lens) 的全新複製開始，將範例登錄和團隊替換為您的值：

```sh
LENS_IMAGE_REPOSITORY=registry.example.com/your-team/lens
LENS_IMAGE_TAG=$(git rev-parse HEAD)
docker build --build-arg LENS_VERSION="$LENS_IMAGE_TAG" -f deploy/runtime/Dockerfile \
  -t "$LENS_IMAGE_REPOSITORY:$LENS_IMAGE_TAG" .
docker push "$LENS_IMAGE_REPOSITORY:$LENS_IMAGE_TAG"
helm upgrade --install lens ./helm/lens --namespace lens --create-namespace \
  --set image.repository="$LENS_IMAGE_REPOSITORY" --set image.tag="$LENS_IMAGE_TAG"
kubectl --namespace lens port-forward service/lens 4318:4318
```

如果您的登錄是私密的，請設定映像拉取憑證。開啟 `http://localhost:4318/ui/`。在本機取得產生的登入憑證：

```sh
kubectl --namespace lens get secret lens-admin \
  -o jsonpath='{.data.admin-token}' | base64 --decode
```

讓該憑證保持私密。Helm 在升級時會重複使用產生的憑證，解除安裝時會保留憑證和 ClickHouse 磁碟區。在將 Lens 開放給代理程式之前，請使用 [Helm 指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md) 設定 `publicUrl`、HTTPS 入口和可連線的接收位址

對於 [外部 ClickHouse](./storage.md#external-clickhouse)，請提供可連線到一台具備 KeeperMap 之伺服器的穩定端點。多個 Lens 複本可以共用該伺服器。多伺服器負載平衡和自動容錯移轉到另一台 ClickHouse 伺服器不在支援的拓撲範圍內

## 連接現有的 LiteLLM 部署 {#existing-deployment}

將 LiteLLM chart 連接到在它自己的版本中執行，或在 Render 等平台上執行的 Lens。這會將閘道連接到 Lens，而不部署另一個 Lens 或 ClickHouse 執行個體。

先完成 [將 Lens 新增至 LiteLLM 的步驟 1–3](./litellm.md#1-get-the-lens-address)。閘道必須具備該指南中所述的配接器和 UI。保留您的版本名稱、命名空間和模型設定。這些值以目前的 [LiteLLM chart](../../deploy/helm.md) 為目標。升級前，請先遷移較舊的 chart 值。

### 1. 儲存連線密鑰 {#1-store-the-connection-secrets}

使用您的 Kubernetes 密鑰管理工具，在 **閘道命名空間** 中建立 `lens-connection`，包含這些金鑰：

| Secret 金鑰 | 來自 Lens 的值 |
| --- | --- |
| `service-token` | `LITELLM_LENS_SERVICE_TOKEN` |
| `gateway-secret` | `LENS_GATEWAY_SECRET` |

對於手動設定，將每個值分別儲存在名為 `service-token` 和 `gateway-secret` 的私密檔案中。不要包含結尾換行。設定您的命名空間並建立 Secret：

```sh
export GATEWAY_NAMESPACE="YOUR_GATEWAY_NAMESPACE"
kubectl --namespace "$GATEWAY_NAMESPACE" create secret generic lens-connection \
  --from-file=service-token=./service-token \
  --from-file=gateway-secret=./gateway-secret
```

如果此 Secret 已存在，請在確認其值與 Lens 相符後重複使用它。讓這些檔案不進入 Git。對於 GitOps，請透過您現有的密鑰管理控制器宣告該 Secret。

### 2. 新增 Lens 值 {#2-add-the-lens-values}

將此內容儲存為 `lens-connection.yaml`，使用您現有 Lens 服務的位址：

```yaml
lens:
  enabled: true
  url: https://lens.example.com
  publicUrl: https://lens.example.com
  serviceTokenSecret:
    name: lens-connection
    key: service-token
  gatewaySecret:
    name: lens-connection
    key: gateway-secret
```

閘道必須能夠連線到 `url`。代理程式匯出器必須能夠連線到 `publicUrl`。兩個位址都不包含 `/ui/` 或 `/v1/traces`。

在同一個檔案中新增追蹤儲存設定：

```yaml
gateway:
  config:
    proxy_config:
      general_settings:
        tracing:
          store:
            type: lens
```

如果您的部署改為從外部 ConfigMap 提供 `config.yaml`，請透過其現有擁有者，將 `general_settings.tracing.store.type: lens` 新增至該檔案。

### 3. 套用並檢查 {#3-apply-and-check}

將 `GATEWAY_RELEASE` 設為您現有的 Helm 版本名稱。將 `GATEWAY_CHART` 設為您的 [OCI chart](../../deploy/helm.md#install-the-chart)。將 `YOUR_ORG` 替換為您的登錄命名空間。將 `GATEWAY_CHART_VERSION` 設為您使用的 chart 版本。您可以檢查已安裝的版本：

```sh
helm list --namespace "$GATEWAY_NAMESPACE"
```

將這些設定與您的完整值檔案合併。然後同時套用兩者：

```sh
export GATEWAY_RELEASE="YOUR_GATEWAY_RELEASE"
export GATEWAY_CHART="oci://ghcr.io/YOUR_ORG/charts/litellm"
export GATEWAY_CHART_VERSION="1.0.0"
helm upgrade "$GATEWAY_RELEASE" "$GATEWAY_CHART" \
  --version "$GATEWAY_CHART_VERSION" \
  --namespace "$GATEWAY_NAMESPACE" \
  -f gateway-values.yaml -f lens-connection.yaml --wait
```

這會滾動閘道 pod 以載入連線設定。對於 GitOps，請改透過您一般的審查和同步程序提交這些值和 Secret 參考。

登入 LiteLLM，選取 **Lens**，並完成 [連線檢查](./litellm.md#5-open-lens-in-the-gateway)。然後 [傳送您的第一個 trace](../first-trace.md)。

如果較舊的閘道 Helm 版本擁有 Lens，請在升級前轉移擁有權。目前的 chart 不會部署 Lens 或 ClickHouse。請先使用 [擁有權轉移指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#select-versions-independently) 保留其資源和儲存空間。

## 檢查安裝 {#check-the-installation}

對於獨立範例：

```sh
kubectl get pods,services,pvc --namespace lens
kubectl logs --namespace lens deployment/lens --tail=100
```

在獨立 Lens 或內嵌的閘道頁面中完成 [第一次追蹤流程](../deployment.md#check-the-installation)，使用代理程式可以連線的端點。在重新啟動 Lens 後開啟已儲存的追蹤，並在已設定分析時驗證一個有界限的調查

讓 ClickHouse 資料和 Keeper 狀態保持在同一個復原計畫中。[備份指南](https://github.com/BerriAI/lens/blob/main/docs/backup.md) 說明了所需的復原界限；其 Compose 輔助工具不管理 Kubernetes 備份。請使用您叢集的快照和還原程序，並在還原後驗證記錄
