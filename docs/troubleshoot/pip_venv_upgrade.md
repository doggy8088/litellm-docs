# 升級 LiteLLM Proxy (uv/venv) {#upgrading-litellm-proxy-uvvenv}

在虛擬環境中透過 uv 安裝時，用於升級 LiteLLM Proxy 的指南。

:::info 重要
在執行任何 `litellm` 或 `prisma` 指令之前，請務必先啟用您的虛擬環境。本指南中的所有指令都假設您是在已啟用的 venv 中操作。
:::

## uv/venv 升級的運作方式 {#how-uvvenv-upgrades-work}

有兩個部分需要保持同步：

1. **Prisma client** - 與 DB 溝通的 Python 產生程式碼
2. **DB schema** - PostgreSQL 中的資料表/欄位

當您透過 uv 升級時，`litellm-proxy-extras` 套件會附帶新的 `schema.prisma` 和 `migrations/` 目錄。但與 Docker 映像不同，`uv add` 不會自動重新產生 Prisma client 或執行 migrations。您必須手動完成這兩件事。

## 升級流程 (uv/venv) {#upgrade-workflow-uvvenv}

### 1. 停止 proxy {#1-stop-the-proxy}

停止正在執行的 LiteLLM proxy 執行個體。

### 2. （選用）備份您的 DB {#2-optional-back-up-your-db}

```bash
pg_dump -h <host> -U <user> -d <db> -F c -f backup_$(date +%Y%m%d).dump
```

### 3. 升級套件 {#3-upgrade-the-package}

```bash
uv add 'litellm[proxy]==<version>'
```

### 4. 重新產生 Prisma client {#4-regenerate-the-prisma-client}

```bash
prisma generate --schema <venv>/lib/python<version>/site-packages/litellm_proxy_extras/schema.prisma
```

請將 `<venv>` 替換為您的虛擬環境路徑，並將 `<version>` 替換為您的 Python 版本（例如，`python3.11`、`python3.12`、`python3.13`）。

### 5. 套用 DB migrations {#5-apply-db-migrations}

您有兩個選項：

**選項 A：直接啟動 proxy**（最簡單）

proxy 會在啟動時自動執行 `prisma migrate deploy`，並套用任何新的 migrations。

首先，啟用您的虛擬環境：

```bash
source <venv>/bin/activate
```

接著啟動 proxy：

```bash
litellm --config your_config.yaml --port 4000
```

**選項 B：在啟動前手動執行**

請先啟用您的虛擬環境：

```bash
source <venv>/bin/activate
```

接著使用明確的 schema 路徑執行 migration：

```bash
prisma migrate deploy --schema <venv>/lib/python<version>/site-packages/litellm_proxy_extras/schema.prisma
```

請將 `<venv>` 替換為您的虛擬環境路徑，並將 `<version>` 替換為您的 Python 版本（例如，`python3.11`、`python3.12`、`python3.13`）。

### 6. 啟動 proxy {#6-start-the-proxy}

如果您使用了上面的選項 B，現在請啟動 proxy（同時保持 venv 已啟用）：

```bash
litellm --config your_config.yaml --port 4000
```

## 如何驗證 migrations {#how-to-verify-migrations}

> **注意：** `<schema-path>` = `<venv>/lib/python<version>/site-packages/litellm_proxy_extras/schema.prisma`

### 套用 migrations 前：預覽將會變更的內容 {#before-applying-migrations-preview-what-will-change}

請先執行 `uv add 'litellm[proxy]==<version>'`（步驟 3），讓新的 `schema.prisma` 可用。

```bash
prisma migrate diff \
  --from-url $DATABASE_URL \
  --to-schema-datamodel <schema-path> \
  --script
```

### 套用 migrations 後：檢查狀態 {#after-applying-migrations-check-status}

```bash
prisma migrate status --schema <schema-path>
```

所有 migrations 都應該有 `finished_at` 時間戳記，且不應有 `rolled_back_at`。

## 需要知道的重點 {#key-things-to-know}

- **`DISABLE_SCHEMA_UPDATE=true`** 環境變數可防止啟動時自動 migration——如果您希望完全手動控制，這會很有用

- **`prisma db push`** 是最後手段：會強制同步 DB 以符合 schema，並略過 migration 歷史。當所有變更都是追加式（新增欄位/資料表）時是安全的，但務必先備份。

- **`schema.prisma` 內的 `litellm_proxy_extras` 是唯一的真實來源**——務必使用那一份，而不是來自其他版本或 git repo 的版本

## 疑難排解 {#troubleshooting}

如果您遇到 migration 錯誤，請參閱 [Prisma Migration 疑難排解指南](./prisma_migrations)。
