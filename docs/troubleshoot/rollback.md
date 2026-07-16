# 安全回滾指南 {#safe-rollback-guide}

本指南說明如何安全地將 LiteLLM Proxy 部署回滾到先前版本。

我們建議回滾到前一個[穩定版本](https://github.com/BerriAI/litellm/releases)。穩定版本每週發布一次，並遵循 `vX.Y.Z` 標籤慣例（例如，`v1.89.4`）。

## 1. 判定回滾範圍 {#1-determine-rollback-scope}

在繼續之前，請先確認回滾原因：
- **應用程式邏輯錯誤**：還原程式碼變更，但保留資料庫結構。
- **資料庫遷移失敗**：還原包含資料庫結構更新的變更。
- **效能退化**：回復到已知穩定版本。

## 2. 備份資料庫 {#2-back-up-the-database}

> **回滾前務必先備份。** 在進行任何變更之前，請建立資料庫快照或傾印。這是回滾過程中發生問題時的安全網。

```bash
# PostgreSQL example
pg_dump -h <host> -U <user> -d <database> -F c -f litellm_backup_$(date +%Y%m%d_%H%M%S).dump
```

如果您使用的是受管理的資料庫（例如 AWS RDS、GCP Cloud SQL），請改為透過雲端主控台建立快照。

## 3. 回滾前檢查 {#3-pre-rollback-checks}

在還原之前，請檢查以下項目：

- **`LITELLM_SALT_KEY`**：回滾期間**不要**變更此值。它用於加密/解密儲存在資料庫中的 LLM API 金鑰憑證。變更後，現有憑證將無法讀取。請參閱[正式環境最佳實務](../proxy/prod#8-set-litellm-salt-key)。
- **`config.yaml`**：如果您新增了特定於較新版的設定，舊版可能無法辨識。請檢查設定，並移除或註解掉任何是在您要回滾離開的版本中才引入的設定。
- **`DISABLE_SCHEMA_UPDATE`**：如果您在 pod 上使用 [Helm PreSync migrations hook](../proxy/prod#7-use-helm-presync-hook-for-database-migrations-beta) 搭配 `DISABLE_SCHEMA_UPDATE=true`，重啟時 migrations **不會**自動執行。您需要手動處理 migration 清理（請參閱步驟 5），或針對舊版 chart 重新執行 PreSync hook。

## 4. 還原應用程式版本 {#4-revert-application-version}

將您的部署還原到前一個穩定的 Docker 映像或 Helm chart 版本。

### Docker {#docker}
更新您的部署宣告檔（例如 K8s Deployment、Docker Compose）以使用前一個版本：
```yaml
# Example: Reverting to the previous stable release
image: docker.litellm.ai/berriai/litellm:v<VERSION>
```

請參閱[所有可用映像](https://github.com/orgs/BerriAI/packages)。

### Helm {#helm}
如果您是透過 Helm 部署，請使用 `helm rollback`：
```bash
helm rollback <release-name> [revision-number]
```

## 5. 處理資料庫 migrations {#5-handle-database-migrations}

如果您要回滾到沒有特定 migration 的版本，可能需要解決資料庫中的 migration 狀態。

> LiteLLM 在正式環境中使用 `prisma migrate deploy`（透過 `USE_PRISMA_MIGRATE=True` 啟用）。如果某個 migration 部分失敗，或您正在還原預期較舊結構的程式碼，您需要清理 `_prisma_migrations` 資料表中的 migration 歷史。請參閱[正式環境最佳實務](../proxy/prod#9-use-prisma-migrate-deploy)。

### 選項 A — 刪除過時的 migration 項目（建議） {#option-a--delete-stale-migration-entries-recommended}

連線到您的 PostgreSQL 資料庫，並移除屬於您要回滾離開之版本的 migration 項目。如此一來，若您之後再次升級，LiteLLM 可以乾淨地重新套用它們。

```sql
-- View recent migrations
SELECT migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;

-- Delete migration entries from the version you are rolling back from
DELETE FROM "_prisma_migrations"
WHERE migration_name = '<migration_name_from_newer_version>';
```

刪除項目後，請重新啟動 LiteLLM — 它會在啟動時重新套用對應版本的正確 migrations。

> **注意：** 如果您在 pod 上設定了 `DISABLE_SCHEMA_UPDATE=true`，migrations 不會自動執行。您需要暫時將其設為 `false`，或重新執行指向舊版的 Helm PreSync migration job。

### 選項 B — 使用 `prisma migrate resolve`（如果您有 CLI 存取權） {#option-b--use-prisma-migrate-resolve-if-you-have-cli-access}

如果您可以存取 Prisma CLI（例如在本機開發環境中，或在安裝了 `litellm-proxy-extras` 套件的偵錯容器中）：

```bash
DATABASE_URL="<your_database_url>" prisma migrate resolve --rolled-back "<migration_name>"
```

> **注意：** 這需要您的環境中可用 Prisma CLI（透過 `prisma-client-py` 安裝）。如果您沒有 CLI 存取權（例如無法進入正在執行的容器 shell），請改用**選項 A**（直接 SQL）。

### 自動復原邏輯 {#auto-recovery-logic}
LiteLLM 內部的 `ProxyExtrasDBManager` 會自動嘗試處理冪等 migrations。在許多情況下，只要回滾版本並重新啟動 proxy 即可，前提是資料庫變更是追加式的（例如新增欄位或資料表）。

## 6. 驗證清單 {#6-verification-checklist}

回滾後，請驗證系統健康狀態：

- [ ] **健康端點**：確認 `/health` 端點回傳 `200 OK`。
- [ ] **檢查記錄**：確保記錄中沒有出現 Prisma 錯誤 — 請留意 `relation "..." does not exist`、`column "..." does not exist` 或 `prisma migrate` 失敗。
- [ ] **花費追蹤**：執行一次測試 completion，並確認花費已記錄在 `LiteLLM_SpendLogs` 資料表中。
- [ ] **計費（Lago）**：如果使用 Lago 進行計費（例如 Lago → Stripe），請檢查 proxy 記錄中的 `Logged Lago Object`，以確認 usage events 正在傳送。
- [ ] **狀態一致性**：如果使用 Redis 做快取或速率限制，請考慮在較新版變更了快取金鑰結構時清除快取。
- [ ] **管理介面**：確認 Admin UI 已載入，且 key 與 team 顯示正確資料。

## 7. 疑難排解 {#7-troubleshooting}

### 「無法套用新 migrations」 {#new-migrations-cannot-be-applied}
如果回滾後看到此錯誤，表示資料庫中有一個 migration 處於「failed」狀態。
1. 找出失敗的 migration 名稱（請參閱步驟 5 中的 SQL 查詢）。
2. 從 `_prisma_migrations` 刪除失敗項目。
3. 重新啟動 proxy。

### 「relation X 不存在」 {#relation-x-does-not-exist}
這通常表示 `_prisma_migrations` 中存在 migration 項目，但實際的資料表/欄位從未建立，或已被刪除。
1. 刪除過時的 migration 項目。
2. 重新啟動 LiteLLM 以重新執行 migration。

如需 Prisma 錯誤的更多詳細資訊，請參閱[Prisma Migrations 疑難排解](prisma_migrations)。
