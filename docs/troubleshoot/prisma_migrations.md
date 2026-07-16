# 疑難排解 Prisma Migration 錯誤 {#troubleshooting-prisma-migration-errors}

在升級或降級 LiteLLM proxy 版本時遇到的常見 Prisma migration 問題，以及如何修復。

如需完整指南，了解如何安全地還原您的 LiteLLM 版本，請參閱 **[安全還原指南](rollback)**。

## LiteLLM 中的 Prisma Migration 如何運作 {#how-prisma-migrations-work-in-litellm}

- LiteLLM 使用 [Prisma](https://www.prisma.io/) 來管理其 PostgreSQL 資料庫結構。
- migration 歷史會記錄在資料庫中的 `_prisma_migrations` 資料表。
- 當 LiteLLM 啟動時，會執行 `prisma migrate deploy` 來套用任何新的 migrations。
- 升級 LiteLLM 時，會套用自您上次套用版本以來新增的所有 migrations。

## 常見錯誤 {#common-errors}

### 1. `relation "X" does not exist` {#1-relation-x-does-not-exist}

**錯誤範例：**

```
ERROR: relation "LiteLLM_DeletedTeamTable" does not exist
Migration: 20260116142756_update_deleted_keys_teams_table_routing_settings
```

**原因：** 這通常發生在版本回滾之後。`_prisma_migrations` 資料表仍將較新版本的 migrations 記錄為「已套用」，但底層資料庫資料表已被修改、刪除，或從未完整建立。

**如何修復：**

#### 步驟 1 — 刪除失敗的 migration 項目並重新啟動 {#step-1--delete-the-failed-migration-entry-and-restart}

從歷史記錄中移除有問題的 migration，以便重新套用：

```sql
-- View recent migrations
SELECT migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;

-- Delete the failed migration entry
DELETE FROM "_prisma_migrations"
WHERE migration_name = '<failed_migration_name>';
```

刪除項目後，重新啟動 LiteLLM — 它會在啟動時重新套用該 migration。

#### 步驟 2 — 如果仍無法解決，請使用 `prisma db push` {#step-2--if-that-doesnt-work-use-prisma-db-push}

如果刪除 migration 項目並重新啟動仍無法解決問題，請直接同步結構描述：

> **警告：** `prisma db push` 若 Prisma schema 移除了您資料庫中存在的欄位或資料表，可能會造成 **資料遺失**。僅在萬不得已時使用，並且請先確認您已有資料庫備份。

```bash
DATABASE_URL="<your_database_url>" prisma db push
```

這會略過 migration 歷史，並強制資料庫結構描述與 Prisma schema 一致。

---

### 2. `New migrations cannot be applied before the error is recovered from` {#2-new-migrations-cannot-be-applied-before-the-error-is-recovered-from}

**原因：** 先前的 migration 失敗（在 `_prisma_migrations` 中記錄了錯誤），而 Prisma 會拒絕套用任何新的 migrations，直到該失敗問題被解決。

**如何修復：**

1. 找出失敗的 migration：

```sql
SELECT migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
ORDER BY started_at DESC;
```

2. 刪除失敗的項目並重新啟動 LiteLLM：

```sql
DELETE FROM "_prisma_migrations"
WHERE migration_name = '<failed_migration_name>';
```

3. 如果仍無法解決，請使用 `prisma db push`（請參閱上方的 [警告](#step-2--if-that-doesnt-work-use-prisma-db-push) — 請先備份您的資料庫）：

```bash
DATABASE_URL="<your_database_url>" prisma db push
```

---

### 3. 版本回滾後 migration 狀態不一致 {#3-migration-state-mismatch-after-version-rollback}

**原因：** 您升級到版本 X（套用了新的 migrations），然後回滾到版本 Y，接著又再次升級。`_prisma_migrations` 資料表對於部分已套用的 migrations，或對於不再存在的結構描述狀態，保留了過時的項目。

**修復：**

1. 檢查 migration 資料表中是否有有問題的項目：

```sql
SELECT migration_name, started_at, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 20;
```

2. 對於不應存在的每個 migration（也就是您回滾來源的版本中的 migration），刪除該項目：
     ```sql
     DELETE FROM "_prisma_migrations" WHERE migration_name = '<migration_name>';
     ```

3. 重新啟動 LiteLLM 以重新執行 migrations。

4. 如果仍無法解決，請使用 `prisma db push`（請參閱上方的 [警告](#step-2--if-that-doesnt-work-use-prisma-db-push) — 請先備份您的資料庫）：

```bash
DATABASE_URL="<your_database_url>" prisma db push
```
