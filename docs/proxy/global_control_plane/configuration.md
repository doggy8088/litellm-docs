---
title: 組態
sidebar_label: 組態
toc_max_heading_level: 2
description: LiteLLM 全域控制平面的環境變數、資料平面登錄欄位與 JWT 設定。
---

# 組態 {#configuration}

{/* keep-version-note */}

## 概覽 {#overview}

控制平面在啟動時讀取環境變數與其設定的資料平面登錄。變更啟動設定後請重新啟動它。啟用[執行期組態](#runtime-configuration)後，對執行期登錄項目與角色的 API 變更會傳播，無需重新啟動。端點與權限請參閱 [API 參考](./api_reference.md)。

### 伺服器 {#server}

```bash
litellm --control-plane --host 0.0.0.0 --port 4000 --num_workers 1
```

每個複本執行一個 worker，並以複本擴展。控制平面伺服器會拒絕大於 `1` 的 `--num_workers` 值、`--reload`、`--run_gunicorn`、`--run_hypercorn` 與 `--run_granian`。若要伺服器端 TLS，請同時設定 `--ssl_keyfile_path` 與 `--ssl_certfile_path`。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `LITELLM_LICENSE` | 必填 | 企業授權。 |
| `LITELLM_MASTER_KEY` | 必填 | 作為 bearer 憑證送出的靜態管理員 API 金鑰。也用於簽署工作階段 JWT。最少 32 位元組。 |
| `CONTROL_PLANE_API_PREFIX` | `/api/v1` | 管理 API 路由與 OpenAPI 文件的前綴。 |

## 驗證 {#authentication}

### 控制平面驗證 {#control-plane-authentication}

在 `Authorization: Bearer <credential>` 中送出 API 憑證，使用 [RFC 6750 第 2.1 節](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1) 的標頭語法。

#### 使用者名稱與密碼登入 {#password-sessions}

`POST /api/v1/auth/login` 會檢查設定的使用者名稱與密碼。它會在 `access_token` 中回傳工作階段 [JWT (RFC 7519)](https://www.rfc-editor.org/rfc/rfc7519.html)。在後續請求中將該 token 作為 bearer 憑證送出。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `UI_USERNAME`, `UI_PASSWORD` | 未設定 | 兩者都設定時啟用密碼登入。 |
| `CONTROL_PLANE_SESSION_TTL_SECONDS` | `43200` | 密碼工作階段的存活時間（秒）。 |
| `CONTROL_PLANE_SESSION_ISSUER` | `litellm-control-plane` | 密碼工作階段 JWT 的簽發者。 |
| `CONTROL_PLANE_SESSION_AUDIENCE` | `litellm-control-plane-api` | 密碼工作階段 JWT 的受眾。 |

#### OIDC 提供者 JWT 驗證 {#oidc}

控制平面會驗證來自 [OpenID Connect (OIDC) 提供者](https://openid.net/specs/openid-connect-core-1_0.html) 的 JWT 存取 token。它會檢查簽章、簽發者、受眾與到期時間。

請允許對 IdP 的 [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html) 與 JWKS 端點的 HTTPS 存取。明確設定 `CONTROL_PLANE_OIDC_JWKS_URL` 會跳過探索。Token 交換也需要對 IdP 的 token 端點的 HTTPS 存取。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_OIDC_ISSUER`, `CONTROL_PLANE_OIDC_AUDIENCE` | 未設定 | 兩者都設定時啟用 IdP JWT 驗證。 |
| `CONTROL_PLANE_OIDC_JWKS_URL` | 探索取得 | IdP 簽署金鑰端點。 |
| `CONTROL_PLANE_OIDC_ROLES_CLAIM` | `roles` | 包含控制平面角色的聲明。 |
| `CONTROL_PLANE_OIDC_SCOPE_CLAIM` | `scope` | 限制角色範圍的聲明。 |
| `CONTROL_PLANE_OIDC_DATAPLANES_CLAIM` | `litellm_dataplanes` | 包含允許的資料平面 ID 的聲明。 |
| `CONTROL_PLANE_OIDC_EMAIL_CLAIM` | `email` | 包含呼叫者電子郵件的聲明。 |
| `CONTROL_PLANE_OIDC_LEEWAY_SECONDS` | `30` | IdP JWT 驗證的時鐘容忍秒數。 |

<span id="roles" />

### 範圍與角色 {#scopes-and-roles}

使用角色來授予 API 範圍。權限與預設授予請參閱[範圍參考](./api_reference.md#scopes)。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_ROLES` | `{}` | 角色名稱對應 `scopes` 與選用 `inherits` 的 JSON 對照。自訂角色會取代同名的內建角色。 |
| `CONTROL_PLANE_INCLUDE_DEFAULT_ROLES` | `true` | 包含內建角色。 |

組態定義的角色與包含的預設角色無法透過執行期 API 變更。執行期角色變更會影響後續的 JWT 驗證，無需重建服務。JWT 角色名稱仍來自呼叫者的聲明，且範圍聲明仍可縮小解析後的授予。

### 資料平面 JWT 驗證 {#data-plane-jwt-authentication}

在每個接受交換 JWT 的資料平面上設定這些值。每個資料平面都必須能透過 HTTPS 到達 IdP 的探索與 JWKS 端點。它會獨立於控制平面擷取簽署金鑰。

對於 `us-prod` 登錄項目，請設定這些資料平面環境變數：

```bash
export JWT_PUBLIC_KEY_URL=https://idp.example.com/.well-known/openid-configuration
export JWT_ISSUER=https://idp.example.com
export JWT_AUDIENCE=litellm-us-production
```

將簽發者與受眾對應至交換 token 的 `iss` 與 `aud`。將這些欄位合併至資料平面的組態：

```yaml title="Data plane config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: sub
    user_email_jwt_field: email
    user_id_upsert: false
```

透過[使用者管理](../users.md)佈建每位操作人員。將本機 `user_id` 對應至交換 token 的 `sub`，並指派管理 API 所需的本機角色。控制平面角色不授予資料平面權限。

| 資料平面環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `JWT_PUBLIC_KEY_URL` | 未設定 | 交換 token 簽發者所需的 JWKS 或 OIDC 探索 URL。 |
| `JWT_ISSUER` | 未設定 | 預期的 `iss` 聲明。未設定時停用簽發者驗證。 |
| `JWT_AUDIENCE` | 未設定 | 預期的 `aud` 聲明。未設定時停用受眾驗證。 |

在資料平面的 `config.yaml` 中設定這些欄位：

| YAML 欄位 | 預設值 | 用途 |
| --- | --- | --- |
| `general_settings.enable_jwt_auth` | `false` | 啟用 JWT 驗證。 |
| `general_settings.litellm_jwtauth.user_id_jwt_field` | 未設定 | 包含本機 LiteLLM 使用者 ID 的聲明。Token 交換範例請使用 `sub`。 |
| `general_settings.litellm_jwtauth.user_email_jwt_field` | 未設定 | 包含使用者電子郵件的聲明。 |
| `general_settings.litellm_jwtauth.user_id_upsert` | `false` | 若使用者記錄不存在，則建立它。 |

其他資料平面設定請參閱 [JWT 組態參考](../jwt_auth_reference.md)。

<span id="data-plane-registry" />

## 資料平面 {#data-planes}

以靜態組態、執行期組態或兩者，將每個 LiteLLM 部署註冊為資料平面。執行期項目無法取代靜態項目。

### 靜態組態 {#static-configuration}

在啟動時從 YAML 或 JSON 載入登錄項目。此選項不需要為控制平面準備 PostgreSQL 或 Redis。重新啟動控制平面複本以套用變更。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_DATAPLANES_FILE` | 未設定 | YAML 登錄的路徑。 |
| `CONTROL_PLANE_DATAPLANES` | `{}` | JSON 登錄對照。不能與 `CONTROL_PLANE_DATAPLANES_FILE` 併用。 |

```yaml title="dataplanes.yaml"
dataplanes:
  us-prod:
    url: https://litellm-us.internal.example.com
    oidc_exchange:
      token_endpoint: https://idp.example.com/oauth2/token
      client_id: litellm-control-plane
      client_secret: REPLACE_WITH_CLIENT_SECRET
      profile: rfc8693
      audience: litellm-us-production
  eu-prod:
    url: https://litellm-eu.internal.example.com
    service_token:
      token: REPLACE_WITH_SERVICE_TOKEN
```

將 YAML 登錄存放在 Secret 中，並將 `CONTROL_PLANE_DATAPLANES_FILE` 設定為其掛載路徑。登錄值是字面值，不會展開 `os.environ/` 參照。

### 執行期組態 {#runtime-configuration}

透過 [API](./api_reference.md#runtime-data-plane-writes) 新增、更新或刪除執行期登錄項目，無需滾動重新啟動。此選項需要專屬的控制平面 PostgreSQL 與 Redis。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_DATABASE_URL` | 未設定 | 用於執行期資料平面與角色的專屬控制平面 PostgreSQL 資料庫。 |
| `CONTROL_PLANE_REDIS_URL` | 未設定 | 用於執行期組態事件的共用 Redis 連線 URL。 |
| `CONTROL_PLANE_CONFIG_STREAM` | `litellm:control_plane:config` | 此控制平面的複本共用的 Redis 串流名稱。 |
| `CONTROL_PLANE_CONFIG_STREAM_MAXLEN` | `10000` | 串流長度上限（概略）。最小 `1`。較舊事件被裁剪時，PostgreSQL 仍是權威來源。 |
| `CONTROL_PLANE_SALT_KEY` | 回退至 `LITELLM_SALT_KEY` | 用於持久化的資料平面用戶端祕密與服務 token 的加密金鑰。啟用執行期儲存時必填且不可為空。 |

兩個儲存 URL 都要設定，或都不設定。只設定一個是啟動錯誤。每個複本都必須使用相同的專屬資料庫、Redis 串流與穩定的 salt 金鑰。讓 salt 金鑰在重新啟動後仍可使用，並將它與資料庫備份分開保護。在未重新加密已儲存祕密的情況下變更或遺失它，會使這些祕密無法載入。

使用控制平面擁有的獨立 PostgreSQL 資料庫，而不是資料平面的資料庫。執行期儲存使用 SQLAlchemy Core 搭配非同步 psycopg 驅動程式與自己的 Alembic 遷移。它不使用 Prisma、`DATABASE_URL` 或資料平面的遷移檔案。`postgresql://` 與 `postgresql+psycopg://` URL 都可接受。執行期連線以 `prepare_threshold=None` 停用預備陳述式。

例如，在啟動複本前，從您的祕密管理器載入這些值：

```bash
export CONTROL_PLANE_DATABASE_URL='postgresql://control_plane:REPLACE_WITH_PASSWORD@postgres.internal.example.com:5432/control_plane'
export CONTROL_PLANE_REDIS_URL='redis://redis.internal.example.com:6379/0'
export CONTROL_PLANE_CONFIG_STREAM='litellm:control_plane:config'
export CONTROL_PLANE_SALT_KEY='REPLACE_WITH_SHARED_ENCRYPTION_KEY'
```

當您的 Redis 部署需要時，使用 `rediss://` 的啟用 TLS 的 Redis 連線。

#### 資料庫遷移 {#migration-job}

Helm chart 包含遷移 Job。對於有執行期組態的控制平面，請設定這些值：

```yaml title="values.yaml"
migrationJob:
  enabled: true
  mode: control-plane
  controlPlane:
    databaseSecret:
      name: control-plane-migrations
      key: database-url
```

在安裝前建立 Secret。它的 `database-url` 金鑰必須包含控制平面資料庫的直接 PostgreSQL URL。為 Job 允許至少兩個資料庫連線。

預設情況下，chart 使用 Helm 的 [`pre-install` 與 `pre-upgrade` hooks](https://helm.sh/docs/topics/charts_hooks/)。Helm 會在部署控制平面前等待 Job，若它失敗則停止發行。

對於 Argo CD，將這些覆寫加入相同的 `migrationJob` 值：

```yaml title="Argo CD overrides"
migrationJob:
  hooks:
    helm:
      enabled: false
    argocd:
      enabled: true
```

Argo CD 會將 Job 作為 [PreSync hook](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/#initialize-or-migrate-a-database) 執行。請同步完整應用程式，因為選擇性同步會跳過 hooks。

#### 有效狀態與祕密 {#effective-state-and-secrets}

執行期項目會合併至設定的登錄與角色政策。組態定義的項目與包含的預設角色仍是權威來源，且透過 API 為唯讀。執行期項目擴充該基礎，但無法遮蔽或取代受保護的名稱。執行期項目請使用[寫入 API](./api_reference.md#runtime-data-plane-writes)，受保護的項目請使用啟動設定。

服務會在發佈至 Redis 或寫入 PostgreSQL 前，加密 `oidc_exchange.client_secret` 與 `service_token.token`。API 回應公開憑證方法名稱，而不是祕密。執行期刪除會移除資料庫列。複本在重新啟動後載入持久化狀態，因此變更不依賴保留每個串流事件。稽核佇列與近期稽核記錄仍是處理程序本機的，不儲存在執行期組態資料庫或串流中。

### 登錄項目 {#registry-entries}

靜態與執行期項目使用這些欄位。每個項目都需要 `service_token`、`oidc_exchange` 或兩者。

| 欄位 | 預設值 | 用途 |
| --- | --- | --- |
| 資料平面 ID | 必填 | 靜態登錄對照鍵或執行期 API 路徑 ID。`control-plane` 為保留字。 |
| `url` | 必填 | 不含 userinfo 的資料平面 base URL。使用 HTTPS。 |
| `name` | 登錄 ID | 顯示名稱。 |
| `service_token.token` | 未設定 | 具有模擬權限的資料平面虛擬金鑰。 |
| `oidc_exchange.token_endpoint` | 交換時必填 | IdP HTTPS token 端點。 |
| `oidc_exchange.client_id`, `oidc_exchange.client_secret` | 交換時必填 | Token 交換應用程式憑證。 |
| `oidc_exchange.profile` | `rfc8693` | `rfc8693` 或 `jwt_bearer_obo`。 |
| `oidc_exchange.audience` | 未設定 | RFC 8693 交換的目標受眾。 |
| `oidc_exchange.scope` | 未設定 | 請求的範圍。`jwt_bearer_obo` 必填。 |
| `allow_insecure_http` | `false` | 允許本機或叢集內資料平面使用純 HTTP。 |

使用 `profile: rfc8693` 時，控制平面使用 [OAuth 2.0 Token Exchange (RFC 8693)](https://www.rfc-editor.org/rfc/rfc8693.html)。它將呼叫者的存取 token 作為 `subject_token` 送出，類型為 `urn:ietf:params:oauth:token-type:access_token`。設定時會包含 `audience` 與 `scope`。

使用 `profile: jwt_bearer_obo` 時，它使用 [Microsoft Entra on-behalf-of 流程](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)。將 `scope` 設定為資料平面 API 的委派範圍。此設定檔不送出 `audience`。

兩種設定檔都需要經驗證的控制平面的 IdP JWT 存取 token。IdP 必須為資料平面回傳已簽署的 JWT。若兩種憑證方法都已設定，當交換無法產生 token 時，控制平面會回退至服務 token。

服務 token 是作為 bearer 憑證送出的 LiteLLM 虛擬 API 金鑰。它們需要 `permissions: {impersonate: true}`。將每位操作人員的本機資料平面 `user_id` 對應至其控制平面 OIDC `sub` 或密碼登入使用者名稱。資料平面會套用該使用者的本機權限。此方法不需要在資料平面上進行 JWT 驗證。使用控制平面主金鑰的呼叫會使用服務 token 自身的身分。

<span id="requests-and-usage" />

## 機隊 {#fleet}

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_FANOUT_CONCURRENCY` | `16` | 每個複本對機隊與用量查詢的最大並行資料平面呼叫數。 |
| `CONTROL_PLANE_USAGE_MAX_WINDOW_DAYS` | `366` | 用量查詢區間的最大天數。 |

## 管理請求 {#management-requests}

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_DATAPLANE_TIMEOUT_SECONDS` | `10` | 資料平面請求與 token 交換的逾時秒數。 |
| `CONTROL_PLANE_DATAPLANE_RETRY_ATTEMPTS` | `3` | 可重試的資料平面讀取的最大嘗試次數。 |

## 稽核記錄 {#audit-logs}

稽核事件涵蓋密碼登入嘗試、驗證與範圍失敗、管理 proxy 呼叫，以及經驗證的執行期組態寫入嘗試。執行期寫入會在 `control-plane` 下記錄事件，包括允許、拒絕與失敗的嘗試。為成功的機隊與用量查詢啟用[追蹤](#tracing)。

### 傳遞 {#delivery}

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_AUDIT_SINKS` | `["log"]` | 啟用的目的地 JSON 陣列。接受 `log`、`otlp`、`s3`、`splunk_hec` 與 `sentinel`。 |
| `CONTROL_PLANE_AUDIT_CAPACITY` | `10000` | 每個近期事件緩衝區的容量。 |
| `CONTROL_PLANE_AUDIT_QUEUE_SIZE` | `10000` | 每個目的地的佇列容量。最小 `2`。 |
| `CONTROL_PLANE_AUDIT_BATCH_SIZE` | `100` | 傳遞批次中的最大記錄數。 |
| `CONTROL_PLANE_AUDIT_DRAIN_SECONDS` | `5` | 關閉時的佇列排空時間（秒）。 |
| `CONTROL_PLANE_AUDIT_STRICT` | `false` | 當稽核容量不可用時，拒絕管理 proxy 與執行期組態寫入。 |

S3、Splunk 與 Sentinel 的 URL 設定需要 HTTPS。只有 S3 相容與 Splunk 目的地有不安全 HTTP 的退出選項。OTLP 傳輸依循下方的匯出器設定。若啟用的 sink 缺少必要設定，LiteLLM 會拒絕啟動。

傳遞佇列與近期記錄是每個處理程序本機的。佇列滿時，預設會丟棄最舊的記錄。當任何 sink 沒有容量或已永久拒絕記錄時，嚴格模式會在管理 proxy 或執行期組態寫入前回傳 HTTP `503`。執行期寫入會在檢查寫入範圍與資料平面綁定前，先保留稽核容量。重新啟動可能遺失佇列中的記錄。將記錄匯出至共用目的地，以便跨複本與重新啟動保留。

傳遞 worker 會重試暫時性失敗。永久拒絕會計為遺失的記錄，並釋放該批次，而不是封鎖後續傳遞。對於 OTLP/HTTP，`408` 與 `429` 以外的用戶端錯誤是永久性的。對於 OTLP/gRPC，可重試的錯誤碼為 `CANCELLED`、`DEADLINE_EXCEEDED`、`RESOURCE_EXHAUSTED`、`ABORTED`、`OUT_OF_RANGE`、`UNAVAILABLE` 與 `DATA_LOSS`。其他非 OK 的碼（例如 `INVALID_ARGUMENT`）是永久性的。收集器的部分拒絕也會被計入。

### Amazon S3 {#amazon-s3}

授予控制平面的 IAM 角色在稽核前綴上的 `s3:PutObject`。物件保留還需要 `s3:PutObjectRetention`、儲存貯體版本控制與 [S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_AUDIT_S3_BUCKET` | 未設定 | 必填的目的地儲存貯體。 |
| `CONTROL_PLANE_AUDIT_S3_PREFIX` | `control-plane-audit` | 物件金鑰前綴。 |
| `CONTROL_PLANE_AUDIT_S3_REGION` | AWS 區域組態 | 儲存貯體區域。 |
| `CONTROL_PLANE_AUDIT_S3_ENDPOINT_URL` | AWS S3 端點 | S3 相容服務的覆寫端點。 |
| `CONTROL_PLANE_AUDIT_S3_OBJECT_LOCK_MODE` | 未設定 | `COMPLIANCE` 或 `GOVERNANCE` 保留。 |
| `CONTROL_PLANE_AUDIT_S3_RETENTION_DAYS` | `365` | 設定鎖定模式時的保留期間。 |
| `CONTROL_PLANE_AUDIT_S3_TIMEOUT_SECONDS` | `30` | 物件上傳逾時秒數。 |
| `CONTROL_PLANE_AUDIT_S3_ALLOW_INSECURE_HTTP` | `false` | 允許叢集內目的地使用 HTTP。 |

S3 上傳使用 SigV4 與條件式寫入。已存在物件的回應（`412`）視為已傳遞。重新導向與大多數用戶端錯誤是永久拒絕。`408`、`429`、伺服器錯誤與傳輸失敗仍可重試。可重試的 S3 錯誤碼還包括 `RequestTimeout`、`RequestTimeoutException`、`SlowDown`、`ConditionalRequestConflict`、`OperationAborted`、`ExpiredToken`、`ExpiredTokenException`、`RequestExpired` 與 `TokenRefreshRequired`。重試的上傳會重新簽署，以便更新後的憑證能傳遞待處理的記錄。

### Splunk HEC {#splunk-hec}

使用 base HEC URL。LiteLLM 會附加 `/services/collector/event`。[HEC token](https://help.splunk.com/en/splunk-enterprise/get-data-in/collect-http-event-data/http-event-collector-rest-api-endpoints) 必須允許寫入稽核索引。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_AUDIT_SPLUNK_URL`, `CONTROL_PLANE_AUDIT_SPLUNK_TOKEN` | 未設定 | 必填的 base HEC URL 與 token。 |
| `CONTROL_PLANE_AUDIT_SPLUNK_INDEX` | Token 預設值 | 目的地索引。 |
| `CONTROL_PLANE_AUDIT_SPLUNK_SOURCE` | `litellm-control-plane` | HEC 來源。 |
| `CONTROL_PLANE_AUDIT_SPLUNK_TIMEOUT_SECONDS` | `30` | HEC 請求逾時秒數。 |
| `CONTROL_PLANE_AUDIT_SPLUNK_ALLOW_INSECURE_HTTP` | `false` | 允許叢集內目的地使用 HTTP。 |

### Microsoft Sentinel {#microsoft-sentinel}

建立 Log Analytics 自訂資料表與資料收集規則 (DCR)。授予 Entra 應用程式在 DCR 上的 **Monitoring Metrics Publisher**。使用其不可變 ID 與輸入串流名稱。請遵循 [Azure Monitor 設定指南](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/tutorial-logs-ingestion-portal/)。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_AUDIT_SENTINEL_ENDPOINT` | 未設定 | 必填的 Logs Ingestion base 端點。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_DCR_IMMUTABLE_ID` | 未設定 | 必填的 DCR 不可變 ID。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_STREAM_NAME` | `Custom-LiteLLMControlPlaneAudit_CL` | DCR 輸入串流。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_TENANT_ID`, `CONTROL_PLANE_AUDIT_SENTINEL_CLIENT_ID`, `CONTROL_PLANE_AUDIT_SENTINEL_CLIENT_SECRET` | 未設定 | 必填的 Entra 應用程式憑證。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_AUTHORITY_HOST` | `https://login.microsoftonline.com` | Entra token 授權單位。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_TOKEN_SCOPE` | 衍生自授權單位 | Azure Monitor 範圍。公用 Azure 使用 `https://monitor.azure.com/.default`。 |
| `CONTROL_PLANE_AUDIT_SENTINEL_TIMEOUT_SECONDS` | `30` | Token 與擷取請求的逾時秒數。 |

DCR 輸入串流與目的地資料表請使用此結構描述。將 DCR 轉換設定為 `source`。

| 類型 | 欄位 |
| --- | --- |
| `datetime` | `TimeGenerated` |
| `int` | `ClassUid`, `ActivityId`, `StatusId`, `SeverityId`, `ResponseCode` |
| `long` | `Sequence` |
| `string` | `ClassName`, `ActivityName`, `ActorUid`, `ActorEmail`, `DataplaneId`, `HttpMethod`, `UrlPath`, `Decision`, `Detail`, `TraceId`, `Hash`, `PrevHash`, `Ocsf` |
| `boolean` | `Truncated` |

## 追蹤 {#tracing}

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `CONTROL_PLANE_OTEL_ENABLED` | 自動 | 啟用追蹤。當設定 OTLP base 或追蹤端點時自動啟用。 |
| `CONTROL_PLANE_OTEL_SERVICE_NAME` | `litellm-control-plane` | OpenTelemetry 服務名稱。 |
| `CONTROL_PLANE_OTEL_IDENTITY_ATTRIBUTES` | `true` | 在追蹤屬性中包含呼叫者 ID 與角色。 |

下方的 OTLP 設定用於設定稽核記錄與追蹤匯出器。

| 環境變數 | 預設值 | 用途 |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `console` | 匯出器通訊協定。OTLP/HTTP 設定 `http/protobuf`，OTLP/gRPC 設定 `grpc`。端點預設選取 OTLP/HTTP。 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 未設定 | Base 收集器端點。 |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 未設定 | 完整的記錄端點，例如 `https://otel.internal.example.com/v1/logs`。需要 `otlp` 稽核 sink。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | 未設定 | 完整的追蹤端點，例如 `https://otel.internal.example.com/v1/traces`。 |
| `OTEL_EXPORTER_OTLP_HEADERS` | 未設定 | 用於收集器驗證的逗號分隔 `key=value` 標頭。 |
