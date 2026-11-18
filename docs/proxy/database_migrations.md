---
title: 資料庫遷移
description: 準備 LiteLLM 資料庫遷移、測試待處理的 SQL、調整遷移逾時，並從舊版結構描述變更中復原。
toc_max_heading_level: 2
---

# 資料庫遷移 {#database-migrations}

{/* keep-version-note */}

請使用本參考進行資料庫準備與復原。如需部署順序、流量檢查與請求排空，請參閱[升級指南](./upgrade_guide.md)。

## 執行遷移工作 {#run-the-migration-job}

請使用**目標 LiteLLM 映像檔**，為每個共用資料庫執行一次遷移。在所有提供服務的執行個體上保持 `DISABLE_SCHEMA_UPDATE=true`，並要求該工作成功後，新版本才能接收流量。在上線前，請測試新舊版本都能對升級後的結構描述讀寫。停用結構描述更新可防止提供服務的執行個體變更結構描述，但無法讓不相容的應用程式版本變得相容。

[Helm chart](./deploy/helm.md) 預設會以 `pre-install` 與 `pre-upgrade` hook 啟用遷移 Job。若使用 Argo CD，請改用其 PreSync hook：

```yaml title="values.yaml"
migrationJob:
  enabled: true
  hooks:
    helm:
      enabled: false
    argocd:
      enabled: true
```

官方的 [Terraform 模組](./deploy/terraform.md) 會在更新服務之前，於 AWS 上執行 ECS 遷移任務，或在 GCP 上執行 Cloud Run 遷移工作。

若是自訂部署，請使用目標 proxy 映像檔，在獨立的容器中執行此命令，並設定好 `DATABASE_URL` 與所需的資料庫憑證：

```bash
DISABLE_SCHEMA_UPDATE=false litellm --skip_server_startup
```

此命令會執行結構描述遷移**與請求記錄索引**，等待兩者完成後退出，且不會啟動閘道。請要求成功退出。無法套用到現有資料列的遷移會以 PostgreSQL 的錯誤與非零退出碼失敗；請使用[試跑](#dry-run-the-migrations-before-the-upgrade)提早發現這類失敗。

## 從 v1.104.0 之前的版本升級 {#upgrading-from-a-version-before-v11040}

:::danger 舊執行個體可能會捨棄升級後的結構描述

在遷移工作或第一個新執行個體執行之前，請在**每一個共用該資料庫的舊 LiteLLM 部署**上設定 `DISABLE_SCHEMA_UPDATE=true`。請在資料庫仍是舊結構描述時完成該設定的推出。請納入其他部署、重新啟動政策與自動化的映像檔回復。

舊版遷移解析器可以將即時資料庫與舊映像檔的 `schema.prisma` 比較，並執行差異部分。它會捨棄舊映像檔不知道的資料表與欄位，包含其中的資料，但會將其已完成的遷移留在 `_prisma_migrations` 中。舊執行個體重新啟動或映像檔回復都可能觸發此行為。

:::

在 v1.84.0 之前，即使沒有待處理的遷移，遷移後的健全性檢查仍會執行。在 v1.84.0 至 v1.103.x，它仍可能在遷移後或 `P3009`／`P3018` 復原期間執行。v1.104.0 將 v2 解析器設為預設值，它不會執行此結構描述差異比對。以 `USE_V2_MIGRATION_RESOLVER=false` 或 `--use_legacy_migration_resolver` 選用舊版解析器時，較新版本同樣會保留此風險。

請在整個推出期間，以及任何回復映像檔上，都保持停用結構描述更新。若尚未驗證與升級後結構描述的相容性，請不要只回復映像檔。請停止部署，並以相符的舊映像檔還原升級前的資料庫快照。請另外規劃如何復原自該快照以來所做的寫入，或接受其遺失。

### 當遷移記錄超前於結構描述時的復原 {#recovery-when-migration-history-is-ahead-of-the-schema}

若舊執行個體已經重設了結構描述，請停止該資料庫上的**所有 LiteLLM 執行個體與遷移工作**，並防止自動重新啟動。請備份受損的資料庫。最安全的復原方式是還原升級前的快照，並在舊部署上停用結構描述更新的情況下重新執行升級。

缺少資料表（例如 `LiteLLM_DailyEndUserSpend`）可能導致 `P3018` 與 PostgreSQL 錯誤 `42P01`，或在啟動回報 `No pending migrations to apply` 的情況下仍發生執行階段失敗。遷移帳本無法證明資料表存在。只刪除失敗的遷移項目，無法重新建立缺少的資料表，因為其建立遷移仍被記錄為已完成。

若無法還原快照，請讓您的資料庫管理員先在副本上測試修復。請確認即時結構描述與**該舊映像檔的** `schema.prisma` 完全相符，再將帳本與該映像檔內附的遷移目錄比較。只移除該映像檔中沒有的遷移所對應的帳本資料列，並讓目標映像檔重新套用它們。請勿清空整個帳本，也不要將缺少資料表的遷移標示為已套用。若結構描述只是部分重設或有其他變更，請勿使用此程序。

<details>
<summary>v1.80.0-stable.1 至 v1.105.0 的版本專屬修復</summary>

**僅**在 v1.80.0-stable.1 的舊版解析器於升級至 v1.105.0 的過程中，將資料庫重設為該映像檔的結構描述，且所有 LiteLLM 處理程序皆已停止並已備份時，才使用此 SQL。它會移除較新的遷移記錄，讓 v1.105.0 可以重新執行它們。三個明確列出的名稱是時間戳記截止點會遺漏的回溯遷移。其他來源或目標版本需要各自進行遷移比對。

```sql
DELETE FROM "_prisma_migrations"
WHERE migration_name > '20251115120539_baseline_diff'
   OR migration_name IN (
     '20251113000000_add_project_table',
     '20251113000001_add_project_fields',
     '20251114180624_Add_org_usage_table'
   );
```

請在啟用結構描述更新的情況下執行 v1.105.0 遷移工作，並讓每個舊部署保持停止。請要求成功退出，使用 `prisma migrate diff` 將修復後的結構描述與目標映像檔的 `schema.prisma` 比較，並在停用閘道結構描述更新的情況下恢復流量之前，驗證受影響的讀寫。

</details>

重新執行遷移會重建結構描述，**而非舊執行個體捨棄的資料**。請從備份復原該資料。切勿對修復後的資料庫以啟用結構描述更新的方式執行舊映像檔。

## 在升級前試跑遷移 {#dry-run-the-migrations-before-the-upgrade}

從 v1.109.0 起，請使用目標映像檔的試跑，在升級前測試待處理的遷移：

```bash
docker run \
  -e DATABASE_URL \
  "$TARGET_IMAGE" --check_migrations_against_existing_data
```

請將 `TARGET_IMAGE` 設為已釘選的目標 proxy 映像檔，並將 `DATABASE_URL` 設為**已還原的正式資料庫副本**。容器必須能連到該資料庫。

試跑會依序在交易中執行每個待處理遷移的真實 SQL，並在下一個遷移開始前回復。結構描述與 `_prisma_migrations` 保持不變。相依於較早遷移的遷移（例如新加入欄位上的索引）會連同該相依項目一起重新執行。退出碼 `0` 會列出成功的遷移及其執行時間。退出碼 `2` 會回報 PostgreSQL 對第一個失敗的錯誤、列出先前的時間，並停止。

:::warning 試跑會取得資料庫鎖定

陳述式真的會執行，因此會取得資料表鎖定。在大型 `LiteLLM_SpendLogs` 資料表上的一般 `CREATE INDEX` 可能會阻擋寫入數分鐘。遷移中的 `CREATE INDEX CONCURRENTLY` 在試跑中會以一般索引建立的方式執行，因為 PostgreSQL 不允許在交易內使用並行形式。請優先使用已還原的資料庫副本；若您要對正式環境執行，請為其鎖定與負載影響做好規劃。

:::

請使用這些時間來估計鎖定持續時間，再於正式規模的副本上為完整的遷移工作計時。實際的正式環境持續時間取決於資料庫負載與鎖定等待。在結構描述遷移後另外建立的請求記錄索引**不包含**在此試跑中。

若資料庫有資料表但沒有 `_prisma_migrations` 記錄，試跑會在建立基準之前執行與啟動時相同的檢查：遷移資料夾必須是建置時內附的那個，且即時結構描述必須與建置的 `schema.prisma` 相符。它會拒絕自訂的 `LITELLM_MIGRATION_DIR`。兩項檢查都通過時，它會回報 `nothing to dry-run`；否則會回報結構描述差異或自訂資料夾被拒。

**僅在 v1.108.0**，此旗標會執行唯讀的資料列計數，且 proxy 會在發現不相容資料時拒絕啟動。從 v1.109.0 起，啟動時會套用待處理的遷移，並回報 PostgreSQL 的第一個失敗。如需版本專屬的失敗與復原方式，請參閱[遷移資料錯誤](../troubleshoot/prisma_migrations.md#6-database-migration-cannot-proceed-on-rows-the-schema-change-cannot-take)。

## 遷移持續時間與逾時 {#migration-duration-and-timeouts}

遷移工作會先套用結構描述變更，再建立缺少的請求記錄索引。**兩個階段都計入其執行時間。**現有有效的索引會略過。

| 工作 | 決定持續時間的因素 | 資料庫影響 |
| --- | --- | --- |
| 新資料表或可為空的欄位 | 通常很快；鎖定等待可能延遲它們 | 短暫鎖定可能延遲其他查詢 |
| 請求記錄索引 | 支出記錄大小、磁碟速度、記憶體與負載 | 並行建立允許讀寫，但會消耗資源 |
| 遷移 SQL 中的一般索引建立、資料表重寫或回填 | 掃描或變更的資料列 | 可能阻擋寫入或其他查詢；請測試並視需要規劃維護時段 |

請在正式規模的副本上為**完整工作**計時。僅憑資料表大小無法預測升級時段。請使用[支出記錄保留](./spend_logs_deletion.md)來限制未來索引建立所掃描的資料。

| 逾時 | 範圍 |
| --- | --- |
| 遷移工作上的 `LITELLM_PRISMA_MIGRATE_DEPLOY_TIMEOUT`；預設為 `600` 秒 | 僅限結構描述遷移子處理程序；不包含請求記錄索引 |
| Helm 的 `migrationJob.activeDeadlineSeconds`；預設為 `1800` 秒 | 完整的遷移 Job，包含索引建立與重試 |
| `helm upgrade --timeout` 或部署控制器的逾時 | 部署等待，必須讓遷移 Job 與推出完成 |
| Terraform ECS 任務或 Cloud Run 工作的逾時與部署等待上限 | 對應模組的遷移與部署階段；Helm 設定不適用 |

### 檢查已套用的遷移 {#check-applied-migrations}

```sql
SELECT migration_name, finished_at
FROM "_prisma_migrations"
WHERE finished_at IS NOT NULL
  AND rolled_back_at IS NULL
ORDER BY finished_at;
```

請將完整結果與您**目標發行標籤**的[遷移檔案](https://github.com/BerriAI/litellm/tree/main/litellm/proxy-extras/litellm_proxy_extras/migrations)比較。請檢查待處理 SQL 中對大型資料表的操作。僅憑遷移記錄無法確認工作已完成，因為請求記錄索引是獨立的階段。

## 滾動升級與支出記錄清理 {#rolling-upgrades-and-spend-log-cleanup}

[支出記錄清理](./spend_logs_deletion.md#when-the-job-runs)使用 `LiteLLM_ScheduledJobRun`，由遷移 `20261105000000_scheduled_job_runs` 建立。較舊版本以處理程序內計時器與 Redis 鎖來排程清理，若無 Redis 則不使用鎖。兩個排程器不會協調，因此在最後一個舊執行個體消失之前，兩者都可能執行。

兩者使用相同的保留截止點，並在各自的陳述式逾時下以小批次刪除。重疊會增加重複工作與刪除負載。對於大型資料表或緩慢的推出，請在升級前取消設定保留設定，並在升級後恢復，或為額外負載預留容量。

新資料表不會阻止舊執行個體以 v2 解析器或 `DISABLE_SCHEMA_UPDATE=true` 啟動。啟用結構描述更新的舊版解析器可能會捨棄它。請在目標遷移工作執行之前套用[舊版保護措施](#upgrading-from-a-version-before-v11040)，包含明確選用舊版解析器的較新映像檔。

## 當遷移緩慢或卡住時 {#when-a-migration-is-slow-or-stuck}

請先從遷移工作的記錄與狀態著手。在變更逾時之前，請先檢查 `pg_stat_activity` 中的鎖定等待與 `pg_stat_progress_create_index` 中的索引建立進度。只有在該階段需要時，才設定較長的結構描述逾時；請給整個工作與部署足夠的時間完成兩個階段與重試。

如需失敗遷移與 PostgreSQL 版本專屬問題的說明，請參閱[遷移疑難排解](../troubleshoot/prisma_migrations.md)。
