---
slug: componentized-deployment
title: "公告：Componentized Deployments"
date: 2026-05-18T09:00:00
authors:
  - yassin
description: "LiteLLM 的 componentized deployment 如何將管理／UI 控制平面與 LLM 資料平面隔離，提升大規模下的可靠性。"
tags: [performance, reliability, kubernetes, scaling, ai-gateway]
hide_table_of_contents: true
---

*最後更新：2026 年 5 月*

LiteLLM proxy 容器做了 2 件非常不同的事。它同時是 **LLM 資料平面**，`/chat/completions`，`/v1/messages`、embeddings、passthroughs，其延遲的額外負擔以個位數毫秒計算，且流量高量且突發。它也同時是 **管理控制平面** — 金鑰、團隊、SSO、稽核記錄，以及驅動 dashboard 的支出／使用量分析，其中單一請求就可能掃描數百萬筆資料列。

把兩者跑在同一個 event loop 上，控制平面做得最慢的事情，就會決定資料平面最快的事情能達到的可靠性下限。這篇文章說明我們如何透過提供 componentized deployment 模型，提升 LiteLLM 在大規模下的可靠性。

{/* truncate */}

![Monolithic proxy 與 componentized deployment：單一共享 event loop 與三個可獨立擴充的服務](/img/blog/componentized_deployment/architecture_before_after.png)

## 範例事故 {#example-incident}

以下是一個我們在 production deployments 中見過的範例事故。

某企業團隊在 Kubernetes 上以兩個 replicas 執行 gateway。他們的 dashboard 發出一個跨 **兩年日期範圍** 的使用量分析請求。伺服器端會將其展開為大約 730 個不同日期的聚合，並跨使用者、金鑰與 model 進行乘算，且有大量工作在程序內完成。

該聚合與處理其他所有請求的同一個 asyncio event loop 上執行，包括 gateway 和 health endpoints。當 event loop 忙於將結果拼接起來時，它無法及時回應 `/v1/messages` 或 `/health/liveliness`。Kubernetes 將 probe 標記為失敗，並 **終止該 pod**。

![事故連鎖：2 年的分析查詢封鎖 event loop，liveness probe 失敗，而 Kubernetes 回收正在服務 LLM 流量的 pod](/img/blog/componentized_deployment/incident_timeline.png)

## 為什麼單一容器是問題 {#why-one-container-is-the-problem}

為了解決前述範例事故，程式碼層級的最佳化是必要的。但只要單一容器同時提供控制平面與資料平面，*任何* 夠昂貴的控制平面操作，對資料平面而言都會成為潛在的 liveness failure：

- **共享 event loop。** 一次 CPU-bound 的彙總處理會阻塞每個 coroutine，包括資料平面。
- **共享 health check。** Kubernetes 只能看到一個程序。它無法分辨「analytics endpoint 很慢」與「這個 pod 已經死掉」，因此會殺掉該 pod——以及 inference 流量。
- **共享擴充單位。** 您只能擴充整體。為突發的 analytics dashboard 預置 replicas，意味著對資料平面過度配置，反之亦然。
- **共享資料庫連線壓力。** 大量分析讀取會與同一批連線上的支出追蹤寫入互相競爭。

## 元件化部署 {#the-componentized-deployment}

LiteLLM 現在提供一個實驗性的 Helm chart，將 LiteLLM 以三個獨立的 microservices 加上一個一次性的 migrations Job 來執行。

| Component | Port | Surface |
|---|---|---|
| **gateway** | 4000 | LLM 資料平面 — `/chat/completions`、`/v1/messages`、embeddings、audio、batches、passthroughs、`/health`、`/metrics` |
| **backend** | 4001 | 管理／UI API — 金鑰、使用者、團隊、組織、SSO、稽核記錄、**支出與使用量分析** |
| **ui** | 3000 | Next.js dashboard，由 nginx 提供的靜態輸出 |
| **migrations** | Job | `prisma migrate deploy`，作為 pre-install/pre-upgrade Helm hook 只執行一次 |

每個服務都可獨立擴充，且各自擁有 health checks。Ingress 置於三者之前：資料平面路徑前綴路由到 gateway，UI assets 路由到 nginx pods，而其他所有內容（管理 API）則路由到 backend。

![Ingress 路由：資料平面前綴到 gateway，UI assets 到 nginx，管理 API 到 backend](/img/blog/componentized_deployment/routing.png)

在這個拓樸上重播該事故：analytics 請求屬於管理路徑，因此 Ingress 會將其路由到 **backend** pods。大量聚合現在只會阻塞 backend 的 event loop。gateway pods 永遠不會看到該請求，會繼續回應自己的 `/health/liveliness`，並持續提供 `/v1/messages`。如果 backend 真的當掉了，Kubernetes 只會回收 **backend**，而資料平面會持續運作。爆炸半徑被限制住了。

## 獨立擴充，獨立健康狀態 {#independent-scaling-independent-health}

因為每個元件都是各自帶有 HPA 的獨立 Deployment，您可以依照它們實際的負載型態來配置，而不是依照兩者聯集的最壞情況：

```yaml
gateway:
  hpa: { enabled: true, minReplicas: 1, maxReplicas: 10,
         targetCPUUtilizationPercentage: 70 }
backend:
  hpa: { enabled: true, minReplicas: 1, maxReplicas: 4,
         targetCPUUtilizationPercentage: 70 }
```

由 dashboard 驅動的 backend 會自行擴充，高吞吐量的 gateway 也會自行擴充。彼此不會搶占對方的容量，而某一方的 probe 失敗也絕不會回收另一方。

## 將大量讀取卸載到 replica {#offloading-heavy-reads-to-a-replica}

Componentized deployment 也支援一個 **可選的讀取 replica**。當設定了 reader endpoint 時，讀取密集型操作（`find_*`、`count`、`group_by`、raw read queries）會路由到讀取 replica，而寫入則路由到 primary。

這將昂貴的讀取查詢與支出追蹤寫入所依賴的 connection pool 分離開來。`update_spend` background job 不再因 analytics 負載而塞車。

![讀／寫分流：由 Postgres replica 提供 analytics 讀取，而支出寫入維持在 primary 上](/img/blog/componentized_deployment/read_replica.png)

## 使用實驗性的 Helm chart {#using-the-experimental-helm-chart}

Componentized deployment 以 OCI Helm chart 的形式發佈到 GitHub Container Registry：[`ghcr.io/berriai/litellm/chart/litellm`](https://github.com/BerriAI/litellm/pkgs/container/litellm%2Fchart%2Flitellm)。

:::warning 實驗性

這個 chart 仍屬實驗性，且 values schema 可能在不同版本之間變更。升級前請固定 `--version` 並檢視 diff。單一映像檔部署仍是受支援的預設選項。

:::

敏感值只會透過 Secret 參照傳入——請先建立它們：

```bash
kubectl create namespace litellm

kubectl -n litellm create secret generic litellm-master-key-secret \
  --from-literal=master-key="sk-..."

kubectl -n litellm create secret generic litellm-writer-secret \
  --from-literal=username=litellm --from-literal=password="..."

kubectl -n litellm create secret generic litellm-reader-secret \
  --from-literal=username=litellm --from-literal=password="..."
```

接著直接從 OCI registry 安裝（或 `helm upgrade --install`）：

```bash
helm upgrade --install litellm \
  oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.86.0-dev \
  -n litellm \
  -f values.yaml
```

該 chart 會將 `prisma migrate deploy` 作為 pre-install/pre-upgrade hook Job 執行，接著啟動 gateway、backend 和 ui Deployments。設定 `ingress.enabled=true` 以單一 host 前置這三者（資料平面前綴 → gateway，UI assets → ui，catch-all → backend）。

![參考架構：Amazon EKS 上的 LiteLLM——gateway、backend 與 ui 置於單一 ALB Ingress 之後，搭配 Aurora Postgres、ElastiCache Redis、S3/CloudWatch，以及 Secrets Manager](/img/blog/componentized_deployment/eks_topline.png)

### 分離讀取與寫入資料庫 {#separate-read-and-write-databases}

將大量 analytics 讀取從 writer 上分流，只需要啟用 `database.reader` 區塊。設定 `reader.host` 以啟用；保持空白則所有查詢都會送到 writer。

```yaml
# values.yaml
masterKey:
  secretName: litellm-master-key-secret   # Secret holding the proxy master key
  secretKey: master-key

database:
  # Writer — all writes (spend logs, tokens, config) land here
  writer:
    host: litellm-pg-rw.litellm.svc
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-writer-secret
      usernameKey: username
      passwordKey: password

  # Reader — set reader.host to route read-heavy ops
  # (find_*, count, group_by, raw reads) to the replica.
  # Unset reader fields fall back to the writer's values.
  reader:
    host: litellm-pg-ro.litellm.svc
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-reader-secret
      usernameKey: username
      passwordKey: password
```

## 重點整理 {#key-takeaways}

- 單體式 proxy 讓控制平面與資料平面具有 **共同命運**：一個緩慢的管理查詢就可能讓 liveness probe 失敗，並回收正在提供 inference 的 pods。
- Componentized Helm chart 將 LiteLLM 以三個 microservices 執行：**gateway**、**backend**、**ui** + 一個一次性的 migrations Job。
- 每個元件都有自己的 **probe 與 HPA**，因此失敗或負載尖峰只會侷限在造成它的那個表面。
- 可選的 read replica 會將大量 backend analytics 讀取與 primary 上的支出追蹤寫入隔離開來。

## 結論 {#conclusion}

大規模可靠性的一部分，在於控制爆炸半徑。大量的 dashboard 查詢對控制平面而言是正常的事情；它絕不應該讓提供 model 流量的 pods 當機。將 LiteLLM 拆分為 microservices，可確保停機只侷限於造成它的那個表面。
