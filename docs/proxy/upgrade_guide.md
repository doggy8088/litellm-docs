---
title: 升級指南
description: 零停機升級 LiteLLM。準備滾動部署、保護進行中的串流、驗證新版本，並保留回退路徑。
toc_max_heading_level: 2
---

# 零停機升級 LiteLLM {#upgrade-litellm-with-zero-downtime}

## 概覽 {#overview}

請讓目前版本繼續提供服務，直到替代版本就緒。將新請求路由到健康的執行個體，並讓進行中的請求完成後再淘汰舊執行個體。

**準備 → 視需要遷移 → 部署並排空 → 驗證**

例行升級請使用滾動部署；若要在切換前測試完整替代版本，請使用[藍綠部署](./deploy/ha/blue_green.md)；若要逐步轉移流量，請使用[金絲雀部署](./deploy/ha/canary.md)。

## 開始之前 {#before-you-upgrade}

| 檢查項目 | 此工作流程的需求 |
| --- | --- |
| 可用性 | 負載平衡器後方至少有兩個健康的執行個體、自動調整器的最小值為兩個，以及可供替代版本使用的備援運算／資料庫連線。 |
| 發行版本 | 固定映像與 chart／模組版本。請查閱您會跨越的每個版本的[發行說明](/release_notes)。儲存目前的映像與設定。 |
| 共用狀態 | 保持相同的資料庫、Redis、驗證設定與 `LITELLM_SALT_KEY`。請參閱[正式環境設定](./prod.md)。 |
| 演練 | 備份資料庫。請以已遷移的正式環境等比副本測試兩個版本，並在替換執行個體期間測試長時間串流。 |

## 1. 設定滾動部署 {#1-configure-a-rolling-deployment}

請將以下內容合併到您的 [Helm values](./deploy/helm.md)，並保留現有的 `extraEnv` 項目。此 HPA 範例假設**請求上限為 600 秒**；請依您最長的請求（包括串流）調整逾時。

```yaml title="values.yaml"
gateway:
  hpa:
    minReplicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  terminationGracePeriodSeconds: 650
  extraEnv:
    - name: GRACEFUL_SHUTDOWN_TIMEOUT
      value: "610"
  lifecycle:
    preStop:
      exec:
        command: ["sh", "-c", "sleep 10"]
```

**這些設定適用於新的 pod。**請在替換前檢查現有 pod 的關閉設定。如果它們無法排空您最長的請求，請先啟動替代容量，將舊 pod 從新流量中移除，並讓進行中的請求完成後再終止它們。

請保持 chart 的 [`/health/readiness` 探針](./health.md#probe-endpoints)啟用。使用 KEDA 時，請設定 `gateway.keda.minReplicaCount: 2`；未使用自動調整時，請設定 `gateway.replicaCount: 2`。請對獨立的後端／UI 元件套用對等的設定。

`preStop` 延遲可讓流量路由有時間更新；伺服器接著會在關閉時排空請求。請將終止寬限維持在 **preStop + 伺服器排空 + 清理時間**之上。請對齊 ingress 逾時並測試串流完成情況；請參閱[關閉設定](./server_tuning.md#keep-restarts-hitless)。

`maxUnavailable: 0` 會在更新期間維持期望的可用副本數量，但激增的 pod 仍需要可排程的 CPU、記憶體與資料庫連線。PodDisruptionBudget 管控自願驅逐，並不控制 Deployment 自身的滾動更新。請參閱 Kubernetes 的[滾動更新設定](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment)與 [pod 終止流程](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow)。

## 2. 準備資料庫 {#database-migrations}

若沒有資料庫，請跳過此步驟。Helm 會自動透過獨立的 migration job 執行綱要變更。若要從較舊版本升級或使用自訂部署，請在部署前查閱[遷移防護措施](./database_migrations.md#upgrading-from-a-version-before-v11040)。

請在應用程式部署前，使用**目標映像**執行一次 migration job。必須確認綱要遷移與請求記錄索引建立皆已成功。Helm 與官方 Terraform 模組會提供此 job；自訂部署請使用 [`litellm --skip_server_startup`](./database_migrations.md#run-the-migration-job)。請參閱 [dry run](./database_migrations.md#dry-run-the-migrations-before-the-upgrade)與 [job 逾時](./database_migrations.md#migration-duration-and-timeouts)。

## 3. 部署新版本 {#upgrade-with-helm-or-terraform}

| 部署方式 | 動作 |
| --- | --- |
| [Helm](./deploy/helm.md) | 固定 `image.tag` 或 `image.digest`。保持 `migrationJob.enabled: true` 與 Helm pre-upgrade hook 啟用。執行下方的命令。 |
| [Argo CD](./deploy/helm.md) | 固定 chart／映像。啟用 Argo CD migration hook 並停用 Helm hook。同步完整的 Application，讓 PreSync 先完成。 |
| [Terraform](./deploy/terraform.md) | 固定模組修訂版本與 `image`。執行 `terraform init -upgrade`，查閱 `terraform plan` 後再套用。請為您的雲端執行階段確認替代容量與排空。 |
| 自訂容器或 VM | 在負載平衡器後方啟動新執行個體，等待就緒後再停止將新請求傳送到舊執行個體。請讓舊執行個體繼續執行，直到進行中的請求完成。 |

若使用 Helm，請設定下方的 chart 版本與實測逾時。請使用您現有的 release 名稱與 namespace：

```bash
helm upgrade litellm oci://ghcr.io/berriai/litellm/chart/litellm \
  --version "$CHART_VERSION" \
  --namespace litellm --values values.yaml \
  --wait --timeout "$UPGRADE_TIMEOUT"
```

請在另一個終端機中檢查 migration job 與替代 pod。先找出閘道 Deployment 的名稱，再監看其部署進度，並將 `<gateway-deployment>` 替換為該名稱：

```bash
kubectl -n litellm get jobs,pods
kubectl -n litellm get deployments -l app.kubernetes.io/instance=litellm
kubectl -n litellm rollout status deployment/<gateway-deployment> --timeout=10m
kubectl -n litellm get events --sort-by=.lastTimestamp
```

上述觀察逾時不會取消或復原部署。請在重試前，先檢查失敗 job 的記錄或未就緒 pod 的事件。請勿假設失敗的 Helm 命令已還原先前的應用程式或資料庫狀態。

如果遷移失敗、替代版本持續未就緒，或錯誤增加，請停止部署。請在調查期間讓健康的執行個體繼續提供服務。

## 4. 驗證升級 {#4-verify-the-upgrade}

請確認每個新執行個體都通過 `/health/readiness`。透過正常的 ingress，使用現有的虛擬金鑰傳送一個已驗證的模型請求與一個串流請求。請檢查串流是否完成、模型權限是否正常、支出是否已記錄，以及必要的回呼是否已送達。

請將錯誤、延遲與中斷的串流，與您所選觀察期間的基準進行比較。請驗證每個提供服務的元件（包括獨立的後端／UI 部署）都使用目標映像。當所有執行個體都執行目標版本、舊執行個體已排空，且指標維持在約定的限制內，即可完成。Readiness 與成功的 Helm 命令並不會測試提供者呼叫；請參閱[健康檢查](./health.md)。

## 視需要回退 {#roll-back-if-needed}

請還原先前的映像與設定，或將流量切回 blue，**僅限於該版本已針對目前資料庫綱要測試過的情況**。此次應用程式回退請跳過 migration hook／job，並排空失敗的版本。

映像回退並不會復原遷移。如果舊版本無法使用新的綱要，請停下來並遵循已測試的資料庫復原計畫；還原快照需要停機，且可能遺失快照之後的寫入。請參閱[資料庫復原](./database_migrations.md#recovery-when-migration-history-is-ahead-of-the-schema)。
