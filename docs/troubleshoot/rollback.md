# 安全回復指南 {#safe-rollback-guide}

本指南說明如何安全地將 LiteLLM Proxy 部署回復到先前版本。

我們建議回復到前一個[穩定版本](https://github.com/BerriAI/litellm/releases)。穩定版本每週發布，並遵循 `vX.Y.Z` 標籤慣例（例如，`v1.89.4`）。

## 1. 判定回復範圍 {#1-determine-rollback-scope}

在繼續之前，請先確認您要回復的原因：
- **應用程式邏輯錯誤**：回復程式碼變更，但保留資料庫結構描述。
- **資料庫遷移失敗**：回復包含資料庫結構描述更新的變更。
- **效能退化**：回復到已知穩定的版本。

## 2. 備份資料庫 {#2-back-up-the-database}

> **在回復之前務必先備份。** 在進行任何變更之前，請先建立資料庫快照或傾印。如果回復期間發生問題，這將是您的安全網。

```bash
# PostgreSQL example
pg_dump -h <host> -U <user> -d <database> -F c -f litellm_backup_$(date +%Y%m%d_%H%M%S).dump
```

如果您使用的是代管資料庫（例如 AWS RDS、GCP Cloud SQL），請改為透過雲端主控台建立快照。

## 3. 回復前檢查 {#3-pre-rollback-checks}

在回復之前，請檢查以下項目：

- **`LITELLM_SALT_KEY`**：在回復期間，請**不要**變更此值。它用於加密/解密儲存在資料庫中的 LLM API 金鑰憑證。變更後，現有憑證將無法讀取。請參閱[正式環境最佳做法](../proxy/prod#set-the-salt-key)。
- **`config.yaml`**：如果您新增了僅適用於較新版本的設定，舊版本可能無法辨識。請檢查您的設定，並移除或註解掉所有是在您回復來源版本之後才引入的設定。
- **`DISABLE_SCHEMA_UPDATE`**：如果您在 pod 上搭配 `DISABLE_SCHEMA_UPDATE=true` 使用 [Helm PreSync 遷移掛鉤](../proxy/prod#run-migrations-from-the-helm-presync-hook)，遷移在重新啟動時**不會**自動執行。您需要手動處理遷移清理（請參閱步驟 5），或針對較舊的 chart 版本重新執行 PreSync 掛鉤。

## 4. 還原應用程式版本 {#4-revert-application-version}

將您的部署回復為前一個穩定的 Docker 映像或 Helm chart 版本。

### Docker {#docker}
更新您的部署清單（例如 K8s Deployment、Docker Compose），以使用前一個版本：
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

## 5. 處理資料庫遷移 {#5-handle-database-migrations}

如果您正在回復到一個沒有特定遷移的版本，您可能需要處理資料庫中的遷移狀態。

> 預設情況下，LiteLLM 在正式環境中使用 `prisma migrate deploy`。如果某個遷移部分失敗，或您回復的程式碼預期較舊的結構描述，您需要清理 `_prisma_migrations` 表中的遷移歷史。請參閱[正式環境最佳做法](../proxy/prod#use-prisma-migrate-deploy)。

### 選項 A：刪除過期的遷移項目（建議） {#option-a-delete-stale-migration-entries-recommended}

連線到您的 PostgreSQL 資料庫，並移除屬於您正在回復來源版本的遷移項目。如此一來，若您之後再次升級，LiteLLM 就能乾淨地重新套用這些遷移。

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

刪除項目後，請重新啟動 LiteLLM，它會在啟動時重新套用適用於其版本的正確遷移。

> **注意：** 如果您在 pod 上設定了 `DISABLE_SCHEMA_UPDATE=true`，遷移將不會自動執行。您需要暫時將其設為 `false`，或重新執行指向舊版的 Helm PreSync 遷移工作。

### 選項 B：使用 `prisma migrate resolve`（如果您有 CLI 存取權） {#option-b-use-prisma-migrate-resolve-if-you-have-cli-access}

如果您可以使用 Prisma CLI（例如，在本機開發環境中，或在安裝了 `litellm-proxy-extras` 套件的除錯容器中）：

```bash
DATABASE_URL="<your_database_url>" prisma migrate resolve --rolled-back "<migration_name>"
```

> **注意：** 這需要您的環境可用 Prisma CLI（透過 `prisma-client-py` 安裝）。如果您沒有 CLI 存取權（例如，無法進入執行中的容器 shell），請改用**選項 A**（直接 SQL）。

### 自動復原邏輯 {#auto-recovery-logic}
LiteLLM 內部的 `ProxyExtrasDBManager` 會自動嘗試處理具冪等性的遷移。在許多情況下，如果資料庫變更是追加式的（例如新增欄位或資料表），只要回復版本並重新啟動 proxy 就足夠了。

## 6. 驗證檢查清單 {#6-verification-checklist}

回復後，請驗證系統健康狀態：

- [ ] **健康端點**：確認 `/health` 端點回傳 `200 OK`。
- [ ] **檢查記錄**：確認沒有出現 Prisma 錯誤。在記錄中尋找 `relation "..." does not exist`、`column "..." does not exist` 或 `prisma migrate` 失敗。
- [ ] **支出追蹤**：執行一次測試 completion，並確認支出已記錄在 `LiteLLM_SpendLogs` 表中。
- [ ] **計費（Lago）**：如果您使用 Lago 進行計費（例如，Lago → Stripe），請檢查 proxy 記錄中是否有 `Logged Lago Object`，以確認使用事件正在傳送。
- [ ] **狀態一致性**：如果您使用 Redis 進行快取或速率限制，請考慮在較新版本變更了快取金鑰結構時清除快取。
- [ ] **管理介面**：確認 Admin UI 可載入並顯示金鑰與團隊的正確資料。

## 7. 疑難排解 {#7-troubleshooting}

### "無法套用新遷移" {#new-migrations-cannot-be-applied}
如果您在回復後看到此錯誤，表示資料庫中有一個處於「failed」狀態的遷移。
1. 找出失敗的遷移名稱（請參閱步驟 5 中的 SQL 查詢）。
2. 從 `_prisma_migrations` 刪除失敗的項目。
3. 重新啟動 proxy。

### "relation X 不存在" {#relation-x-does-not-exist}
這通常表示 `_prisma_migrations` 中存在遷移項目，但實際的資料表/欄位從未建立或已被刪除。
1. 刪除過時的遷移項目。
2. 重新啟動 LiteLLM 以重新執行該遷移。

如需更多 Prisma 錯誤的詳細資訊，請參閱[Prisma Migrations 疑難排解](prisma_migrations)。
