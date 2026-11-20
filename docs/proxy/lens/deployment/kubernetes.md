---
title: "Kubernetes"
description: "使用一條 Helm 命令在 Kubernetes 上安裝 Lens，再透過您的 Ingress 控制器將它對外開放。"
slug: "/proxy/lens/deployment/kubernetes"
---

# Kubernetes {#kubernetes}

## 必要條件 {#prerequisites}

使用 Helm 3.8 或更新版本，以及具備預設 StorageClass 的叢集。否則，請設定 `clickhouse.storageClassName`

此 chart 會在持久磁碟區上以其專屬的 ClickHouse 安裝 Lens，並產生其憑證。您不需要建立任何 Secret，Lens 也不使用 PostgreSQL

## 安裝 chart {#new-deployment}

```sh
helm upgrade --install lens oci://ghcr.io/berriai/charts/lens \
  --namespace lens --create-namespace \
  --wait --timeout 10m
```

Argo CD 和其他 GitOps 工具會在沒有叢集存取權的情況下轉譯 chart，因此產生的憑證會在每次同步時變更。請在該處使用 [預先佈建的 Secret](./storage.md#gitops)

首次啟動時，Lens pod 可能會在 ClickHouse 就緒之前重新啟動幾次。持續失敗需要 [儲存與啟動診斷](./configuration.md#troubleshooting)

## 對外開放 Lens {#ingress}

將這些覆寫值儲存為 `values.yaml`。將主機名稱、您已安裝之控制器的 Ingress 類別，以及持有該主機名稱憑證的 TLS Secret 替換為您的值

```yaml title="values.yaml"
publicUrl: https://lens.example.com
ingress:
  enabled: true
  className: <your-ingress-class>
  host: lens.example.com
  tls:
    - secretName: lens-tls
      hosts: [lens.example.com]
```

再次使用 `--values values.yaml` 執行安裝命令。然後檢查 Lens 是否就緒：

```sh
curl --fail https://lens.example.com/health/ready
```

## 登入 {#sign-in}

開啟 `https://lens.example.com/ui/`，並將產生的管理員 token 貼入 **Setup token** 欄位。使用以下方式讀取 token：

```sh
kubectl --namespace lens get secret lens-admin \
  -o jsonpath='{.data.admin-token}' | base64 --decode
```

接下來，[傳送您的第一個 trace](../first-trace.md) 或 [將 Lens 新增至 LiteLLM](./litellm.md)

## values.yaml 參考 {#valuesyaml-reference}

請參閱 [完整的 values.yaml](https://github.com/BerriAI/lens/blob/main/helm/lens/values.yaml)，以了解所有設定

| 值 | 預設值 | 說明 |
| --- | --- | --- |
| `publicUrl` | `http://localhost:4318` | Lens 的瀏覽器對外來源，不含 `/ui/`。 |
| `ingestionUrl` | `""` | 代理程式傳送 trace 的位址。為空時使用 `publicUrl`。 |
| `ingress.enabled` | `false` | 建立 Ingress。請另外安裝其控制器。 |
| `ingress.className`、`ingress.host` | 兩者皆為 `""` | Ingress 類別和主機名稱。啟用 Ingress 時必須提供主機名稱。 |
| `ingress.annotations`、`ingress.tls` | `{}`、`[]` | 控制器設定和 Kubernetes Ingress TLS 項目。 |
| `adminTokenSecret.name`、`.key` | `""`、`admin-token` | 存放管理員 token 的現有 Secret。名稱為空時，chart 會產生 `lens-admin`。 |
| `gateway.enabled` | `false` | 接受來自 LiteLLM 閘道的登入。請參閱 [將 Lens 新增至 LiteLLM](./litellm.md)。 |
| `gateway.secretName`、`serviceTokenSecret.name` | 兩者皆為 `""` | 存放兩個閘道連線值的現有 Secret。 |
| `clickhouse.storage`、`clickhouse.storageClassName` | `20Gi`、`null` | ClickHouse 磁碟區的大小和 StorageClass。請依您的流量和保留期調整大小。 |
| `clickhouseSecret.name`、`.key` | `""`、`url` | 存放 [現有 ClickHouse](./storage.md) URL 的 Secret。取代隨附的 ClickHouse。 |
| `retentionDays` | `14` | Lens 保留 trace 資料的天數。 |
| `resources`、`clickhouse.resources` | 請求 `100m` CPU 與 `256Mi` 和 `512Mi`，記憶體限制 `2Gi` | Lens 和 ClickHouse 容器的資源。 |
| `extraEnv`、`extraEnvFrom` | 兩者皆為 `[]` | 額外的 [環境設定](./configuration.md)，例如分析模型憑證。 |

## 升級 {#upgrade}

請先 [備份 ClickHouse](./storage.md)。使用相同的 values 檔案再次執行安裝命令。Helm 會安裝最新發佈的 chart，並重複使用產生的憑證和 ClickHouse 磁碟區

若要停留在一個 chart 版本，請在安裝命令中加入 `--version`，並使用 [版本與映像](./releases.md) 中的版本
