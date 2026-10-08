# Prisma Migration 錯誤疑難排解 {#troubleshooting-prisma-migration-errors}

升級或降級 LiteLLM proxy 版本時常見的 Prisma migration 問題，以及在任何 migration 執行前就可能讓 proxy 停止的 query engine 解析失敗，還有如何修復。

如需安全回復 LiteLLM 版本的完整指南，請參閱 **[安全回復指南](rollback)**。

## Prisma Migration 在 LiteLLM 中的運作方式 {#how-prisma-migrations-work-in-litellm}

- LiteLLM 使用 [Prisma](https://www.prisma.io/) 來管理其 PostgreSQL 資料庫 schema。
- migration 歷史會記錄在資料庫中的 `_prisma_migrations` 資料表。
- LiteLLM 啟動時，會執行 `prisma migrate deploy` 來套用任何新的 migrations。
- 如果啟動時資料庫設定失敗（資料庫無法連線、連線重試次數耗盡，或 `prisma migrate deploy` 失敗），proxy 會以非零狀態結束，而不是用舊版 schema 提供請求服務。在 rolling update 期間，新 pod 會進入 crash-loop，而舊 pod 會持續提供服務，migration 錯誤則會出現在新 pod 的記錄中。
- 當 `DATABASE_URL` 已設定，但 Prisma CLI 既不在 `PATH` 上，也無法被匯入時，情況也一樣：proxy 會以紅色錯誤結束，而不是在沒有資料庫的情況下啟動。請使用 `pip install 'litellm[extra_proxy]'` 安裝它，或執行隨附的 LiteLLM 映像檔，該映像檔已內建它。
- 升級 LiteLLM 會套用自您上次套用版本以來新增的所有 migrations。

## 常見錯誤 {#common-errors}

### 1. `relation "X" does not exist` {#1-relation-x-does-not-exist}

**錯誤範例：**

```
ERROR: relation "LiteLLM_DeletedTeamTable" does not exist
Migration: 20260116142756_update_deleted_keys_teams_table_routing_settings
```

**原因：** 這通常發生在版本回滾之後。`_prisma_migrations` 資料表仍將較新版的 migrations 記錄為「已套用」，但底層資料庫資料表已被修改、刪除，或從未完全建立。

**修復方式：**

#### 步驟 1：刪除失敗的 migration 項目並重新啟動 {#step-1-delete-the-failed-migration-entry-and-restart}

從歷史記錄中移除有問題的 migration，讓它可以重新套用：

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

刪除該項目後，重新啟動 LiteLLM，它會在啟動時重新套用該 migration。

#### 步驟 2：如果這樣仍然無效，請使用 `prisma db push` {#step-2-if-that-doesnt-work-use-prisma-db-push}

如果刪除 migration 項目並重新啟動仍無法解決問題，請直接同步 schema：

> **警告：** `prisma db push` 可能會造成**資料遺失**，如果 Prisma schema 移除了您資料庫中存在的欄位或資料表。只有在最後手段時才使用此方法，並且請先確保您已有資料庫備份。

```bash
DATABASE_URL="<your_database_url>" prisma db push
```

這會略過 migration 歷史，並強制資料庫 schema 與 Prisma schema 相符。

---

### 2. `New migrations cannot be applied before the error is recovered from` {#2-new-migrations-cannot-be-applied-before-the-error-is-recovered-from}

**原因：** 先前有一個 migration 失敗（在 `_prisma_migrations` 中記錄了錯誤），而 Prisma 會拒絕套用任何新的 migrations，直到該失敗被解決。

**修復方式：**

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

3. 如果這樣仍無效，請使用 `prisma db push`（請見上方的[警告](#step-2-if-that-doesnt-work-use-prisma-db-push)，並先備份您的資料庫）：

```bash
DATABASE_URL="<your_database_url>" prisma db push
```

---

### 3. 版本回退後 migration 狀態不一致 {#3-migration-state-mismatch-after-version-rollback}

**原因：** 您先升級到版本 X（套用了新的 migrations），再回滾到版本 Y，之後又再次升級。`_prisma_migrations` 資料表中有一些過時項目，對應於部分套用或已不再存在的 schema 狀態。

**修復：**

1. 檢查 migration 資料表中是否有有問題的項目：

```sql
SELECT migration_name, started_at, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 20;
```

2. 對於每個不該存在的 migration（也就是來自您回滾前的版本），刪除該項目：
     ```sql
     DELETE FROM "_prisma_migrations" WHERE migration_name = '<migration_name>';
     ```

3. 重新啟動 LiteLLM 以重新執行 migrations。

4. 如果這樣仍無效，請使用 `prisma db push`（請見上方的[警告](#step-2-if-that-doesnt-work-use-prisma-db-push)，並先備份您的資料庫）：

```bash
DATABASE_URL="<your_database_url>" prisma db push
```

---

### 4. 在解析 query engine 時發生 `PermissionError` {#4-permissionerror-while-resolving-the-query-engine}

**錯誤範例：**

```
PermissionError: [Errno 13] Permission denied:
'/usr/local/lib/python{{python_version}}/site-packages/prisma/binaries/prisma-query-engine-debian-openssl-3.0.x'
```

**原因：** 在 Prisma 與您的資料庫通訊之前，它必須先決定要執行哪個 query engine binary，而它會依照 Prisma CLI 在產生 client 時記錄的 engine 路徑逐一檢查。產生出的 client 會帶有五個這類路徑，每個支援的平台各一個，因此這個檢查一定會執行。它會用 `Path.exists()` 測試每個候選項，該函式會將缺少檔案回報為 `False`，但當候選項路徑上的某個目錄拒絕執行中的 uid 時，會重新拋出 `PermissionError`；它只會吞掉 `ENOENT`、`ENOTDIR`、`EBADF` 和 `ELOOP`。因此，如果映像檔以某個 uid 產生 client，卻以另一個 uid 執行，或是將 client 安裝在執行階段 uid 無法穿越的路徑，啟動時就會直接失敗，而不會繼續嘗試下一個候選項。Python 3.14 在此會回傳 `False`，且不受影響；LiteLLM 支援的所有較舊直譯器都會拋出例外。{/* keep-python-version */}

**修復方式：** 將 Prisma 指向執行階段 uid 能讀取的 engine，並同時設定兩個變數。`PRISMA_QUERY_ENGINE_BINARY` 單獨設定無法解決此問題，因為會拋出例外的檢查在 Prisma 讀取該變數之前就已發生。`PRISMA_BINARY_PLATFORM` 才是會在測試任何候選項之前中止檢查的那個，因此這兩個變數不能互相替代：

```bash
export PRISMA_BINARY_PLATFORM=debian-openssl-3.0.x
export PRISMA_QUERY_ENGINE_BINARY=/opt/prisma/binaries/prisma-query-engine-debian-openssl-3.0.x
```

`PRISMA_BINARY_PLATFORM` 必須指定 client 實際產生時所對應的平台。Prisma 會直接在產生出的路徑中查找該名稱，因此指定一個您未產生的名稱，等於把 `PermissionError` 換成 `KeyError`。`PRISMA_QUERY_ENGINE_BINARY` 必須指向一個執行階段 uid 既能讀取也能執行的 engine 檔案。請在環境中同時設定這兩者，而不是在 import 時修補 `BINARY_PATHS`：`PRISMA_BINARY_PLATFORM` 是已宣告的 Prisma 設定選項，而 `PRISMA_QUERY_ENGINE_BINARY` 則是直接從環境讀取，因此兩者都不依賴可能在版本升級時變動的 Prisma 內部實作。

官方映像檔已透過在固定且所有人可讀的 `/opt/prisma` 中內建 Prisma CLI 與 engines 來避免這個情況，因此任何 uid 都能解析它們。`v1.95.0` 是第一個同時包含這項修正的穩定版，適用於兩種映像變體。標準映像自 `v1.94.0` 起就已有此修正，但整個 `1.94.x` 系列在 `litellm-non_root` 之前都沒有，因此在 `v1.94.1` 或更早版本上的非 root 部署仍需要上述兩個變數。自訂映像與純 `pip install` 部署都不在這兩種修正之內，因此一律需要它們。

映像檔會發佈到 `ghcr.io/berriai`，並鏡像到 `docker.litellm.ai/berriai`；`ghcr.io/berriai/litellm-non_root:v1.95.0` 是非 root 變體。

---

### 5. 升級至 v1.99.0 或更新版本在 `20260818000000_add_spend_log_timestamps` 上停滯（PostgreSQL 10） {#5-upgrade-to-v1990-or-later-stalls-on-20260818000000_add_spend_log_timestamps-postgresql-10}

**症狀：** proxy 在啟動時停在 `prisma migrate deploy`，且不會提供任何流量。依版本而定，它可能會被 Prisma 指令逾時終止，並重新啟動後又進入同一個 migration；或者在長時間停頓後才最終啟動，而此時 `pg_stat_activity` 顯示 `ALTER TABLE "LiteLLM_SpendLogs"` 持有 `ACCESS EXCLUSIVE` 鎖。部署在 PostgreSQL 11 或更新版本時，會在數毫秒內套用相同的 migration。

**原因：** 這個 migration 會將 `created_at` 和 `updated_at` 以 `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` 的方式新增到 `LiteLLM_SpendLogs`。PostgreSQL 11 會將該預設值儲存為欄位中繼資料，且不會觸碰任何資料列，因此無論是空資料表或持有多年記錄的資料表，該語句都只需要相同的幾毫秒。PostgreSQL 10 沒有這種快速路徑：它會把整個 heap 重寫到新檔案、重新建立資料表上的每個索引，並在整個過程中持有 `ACCESS EXCLUSIVE` 鎖。在一個 1,000,000 列、1 GB 的 `LiteLLM_SpendLogs` 上，該語句在 PostgreSQL 10 大約花了 10 秒，而在 PostgreSQL 16 上少於 2 毫秒；所需時間會隨資料表大小而變，且重寫過程在交易提交之前，需要額外磁碟空間存放第二份資料表及其索引。由於 LiteLLM 會在開機時執行 migrations，因此若 Prisma client 被終止，重寫會回滾，而下一次重新啟動會從零開始。

**修復方式：** 請在您升級之前，於維護時段自行先套用欄位新增。這個 migration 會使用 `ADD COLUMN IF NOT EXISTS`，因此一旦欄位已存在，它在啟動時就會變成 no-op，升級也會正常進行。請先確認重寫需要多少磁碟空間：

```sql
SELECT pg_size_pretty(pg_total_relation_size('"LiteLLM_SpendLogs"'));
```

直接的方式是在 proxy 停止的情況下執行 migration 自己的語句。這會執行相同的重寫，但沒有 client 逾時限制，且是在您選定的時間進行：

```sql
ALTER TABLE "LiteLLM_SpendLogs"
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

如果資料表太大而無法鎖定那麼久，請完全避免重寫。先在不設定預設值的情況下新增欄位，再於之後設定預設值，這兩步在所有 PostgreSQL 版本上都是僅變更 metadata 的操作，而在您處理期間，proxy 可以繼續在舊版上運作：

```sql
ALTER TABLE "LiteLLM_SpendLogs"
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);

ALTER TABLE "LiteLLM_SpendLogs"
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
```

新列現在會套用預設值。請分批回填現有資料列，重複執行該陳述式，直到回報 `UPDATE 0`，如此一來就不會有單一交易長時間持有鎖定或使表格膨脹：

```sql
UPDATE "LiteLLM_SpendLogs"
SET "created_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
WHERE "request_id" IN (
    SELECT "request_id" FROM "LiteLLM_SpendLogs" WHERE "created_at" IS NULL LIMIT 10000
);
```

`CURRENT_TIMESTAMP` 與遷移本身原本會寫入的內容相符。如果您希望回填後的值反映每個請求實際執行的時間，請改用 `COALESCE("endTime", "startTime", CURRENT_TIMESTAMP)`。回填完成後，再新增限制；這會掃描一次表格，但不會重寫它：

```sql
ALTER TABLE "LiteLLM_SpendLogs"
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;
```

接著再升級。不要手動將資料列插入 `_prisma_migrations`，也不要執行 `prisma migrate resolve --applied`；讓 `prisma migrate deploy` 在發現這些欄位已就緒時，記錄該遷移本身。

如果您寧可讓 proxy 在啟動時執行重寫，請提高逾時時間，避免 Prisma 用戶端在陳述式執行到一半時被終止。從 v1.101.0 起，`prisma migrate deploy` 有自己的限制，`LITELLM_PRISMA_MIGRATE_DEPLOY_TIMEOUT`（預設 600 秒）。在 v1.99.x 與 v1.100.x 上，它是在 `LITELLM_PRISMA_COMMAND_TIMEOUT` 下執行（預設 60 秒），而這也涵蓋所有其他 Prisma 指令。較長的逾時只會停止重試迴圈：在重寫完成之前，proxy 仍然不可用，資料表也仍然鎖定，因此無論如何都應將重新啟動安排為維護時段。
