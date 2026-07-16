---
title: "v1.84.0 - 可靠性強化 + 多 Pod 預算準確性"
slug: "v1-84-0"
date: 2026-05-14T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.84.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.0
```

</TabItem>
</Tabs>

## 版本命名變更 {#version-naming-change}

> **從 `v1.84.0` 開始，LiteLLM 版本遵循 [PEP 440](https://peps.python.org/pep-0440/)。** 穩定版發行會移除 `-stable` 後綴——此版本的 Docker 標籤是 `litellm:1.84.0`，而不是 `litellm:1.84.0-stable`。每個 Docker 標籤都會同時以不帶前綴與 `v`-前綴的形式發布（`litellm:1.84.0` 和 `litellm:v1.84.0` 會解析為同一個映像），因此包含 `v` 前綴的既有固定版本仍可正常使用。PyPI 版本則維持不帶前綴的 PEP 440 形式：`pip install litellm==1.84.0`。如果您在部署工具（Helm values、`requirements.txt`、Renovate 規則等）中固定 LiteLLM，請將那些固定值更新為 PEP 440 形式。

從舊的後綴方案對應到新的 PEP 440 方案：

| 頻道 | 舊版（≤ `v1.83.x`） | 新版（≥ `v1.84.0`） |
| --- | --- | --- |
| 穩定版 | `vX.Y.Z-stable` | `vX.Y.Z` |
| 穩定版修補 | `vX.Y.Z-stable.patch.N` | `vX.Y.Z.postN` |
| 發行候選版 | `vX.Y.Z.rc.N` / `vX.Y.Z-rc.N` | `vX.Y.ZrcN` |
| 開發／每夜版 | `vX.Y.Z-nightly` / `vX.Y.Z.dev.N` | `vX.Y.Z.devN` |

這只是名稱變更——發行節奏、穩定性保證與映像內容都沒有改變。`v1.84.0-rc.1` 標籤（在切換前截取）會保留舊格式以維持歷史連續性；從 `v1.84.0` 起的每個標籤都會使用 PEP 440 形式。

---

> **注意—大量行為變更。** 此版本整合了大量連續發佈的可靠性與強化工作。下方的 **重要行為變更** 章節涵蓋所有會變更預設值、移除設定捷徑或改變 request/response 形狀的內容，並提供您需要的停用選項，以維持先前行為。升級正式版部署前，請先閱讀該章節。如果您已針對 `v1.84.0-rc.1` 完成驗證，請參閱 **自 v1.84.0-rc.1 以來的變更** 章節，了解 rc 之後的差異。

## 重點摘要 {#key-highlights}

- **預設情況下，透傳端點需要驗證。** `auth` 欄位在 `general_settings.pass_through_endpoints` 下的項目現在預設為 `true`。先前「OSS 預設取得未驗證轉送器；`auth: true` 僅限企業版」的組合已不復存在——`auth: true` 可在 OSS 上運作，而想要未驗證轉送器的操作人員必須明確設定 `auth: false`。
- **多 pod 預算強制執行的準確度大幅提升。** `RedisCache.async_increment` 新增 `refresh_ttl` opt-in，支出計數器會 opt in；在 Redis 清除遺失時，過時的記憶體內計數器會被略過。`ResetBudgetJob` 會在資料庫重設時一併使 Redis 計數器失效，因此重新整理後的計數器也會重設。
- **Prisma 資料庫重新連線不再凍結事件迴圈。** 重新連線路徑以 SIGTERM→SIGKILL → 新的 `Prisma()`+`connect()` 序列取代了 `await self.db.disconnect()`（其會同步呼叫 `subprocess.Popen.wait()`）。存活探測在資料庫波動期間不再失敗。相應修正會在 `PrismaClient.get_generic_data` 上恢復重新連線與重試。
- **在雙 worker Docker 部署中，記憶體佔用下降約 700 MB**，原因是功能路由器與首頁改為延遲載入。對延遲路由的第一次請求會產生匯入成本；後續請求則維持不變。
- **支援 MCP OAuth + Azure Entra discovery**、可選的短 ID 工具前綴以將 MCP 工具名稱維持在 60 字元限制內，以及 OAuth 根端點可見性現在與明確的伺服器名稱查找一致。
- **透過新的 `/v1/workflows/runs` REST 表面，提供持久化代理程式工作流程執行追蹤**，其由 `LiteLLM_WorkflowRun` / `LiteLLM_WorkflowEvent` / `LiteLLM_WorkflowMessage` 資料表支援。支出記錄的 `session_id` joins 可免費進行成本歸因。
- **透過 Routing Groups 的每模型路由策略。** 新的 `router_settings.routing_groups` schema 會將一組 `model_name`s 綁定至其自己的路由策略（例如 `latency-based-routing` 用於 `gpt-4o`、`simple-shuffle` 用於較便宜的模型），且都位於單一 router 之內。可在 `proxy_config.yaml` 中設定，或在 LiteLLM 儀表板的 General Settings → Routing Groups 中設定；由 UI 管理的 groups 會持久儲存，並覆寫 YAML 值。

---

## 自 `v1.84.0-rc.1` 以來的變更 {#changes-since-v1840-rc1}

以下內容都是在 `v1.84.0-rc.1` 之上完成，並已包含在 `v1.84.0` 中。如果您已經針對 rc 驗證過，這就是唯一需要重新測試的差異。

### 強化 {#hardening}
- **`/key/update` 授權檢查** — [PR #27878](https://github.com/BerriAI/litellm/pull/27878)
- **`/key/regenerate` 所有權重新繫結 + premium-gate 防護欄** — [PR #27793](https://github.com/BerriAI/litellm/pull/27793)
- **在檔案輸入匯入點拒絕裸字串**，以防止透過精心構造的請求主體讀取本機檔案 — [PR #27762](https://github.com/BerriAI/litellm/pull/27762)
- **拒絕 config-file 路徑之外的遠端 URL instance-fn 載入** — [PR #27801](https://github.com/BerriAI/litellm/pull/27801)
- **在 banned-params 檢查中涵蓋 `extra_body` + `azure_ad_token`** — [PR #27898](https://github.com/BerriAI/litellm/pull/27898)
- **MCP BYOK / OAuth：在 RAG ingest `vector_store` 設定中封鎖 SSRF 欄位；透過請求主體封鎖用戶端端價格注入** — [PR #27892](https://github.com/BerriAI/litellm/pull/27892)

### 預算保留 {#budget-reservation}
- **依每個請求限制 budget reservation**，而不是在沒有 `max_tokens` 的請求上固定綁定整個剩餘的團隊／金鑰／使用者 headroom — [PR #27509](https://github.com/BerriAI/litellm/pull/27509)
- **圖像生成：保留每張圖片成本**，而非 max-tokens 成本；嚴格依 model mode 進行限制

### 健康探測 {#health-probes}
- **在未驗證的 `/health/readiness` 負載上重新曝光 `db` 狀態**，讓外部探測在未經授權的情況下也能區分 DB 無法連線的 worker — [PR #27866](https://github.com/BerriAI/litellm/pull/27866)
- **UI 從 `/health/readiness/details` 取得 `litellm_version` + `is_detailed_debug`**（受認證保護），因為這些欄位已從公開負載移除 — [PR #27896](https://github.com/BerriAI/litellm/pull/27896)
- **UI：停用 `/health/readiness/details` 的重試 + 涵蓋 token 轉送**

### MCP {#mcp}
- **將 MCP 用戶端中設定的 `extra_headers` 轉送到上游 OpenAPI HTTP 請求**（關閉 [#26794](https://github.com/BerriAI/litellm/issues/26794)）— [PR #27383](https://github.com/BerriAI/litellm/pull/27383)
- **在相同的轉送路徑上，名稱衝突時 `static_headers` 現在會優先於呼叫端轉送的 `extra_headers`**（不區分大小寫）。請參閱下方 [重要行為變更 → MCP](#openapi-mcp-static_headers-now-win-over-caller-forwarded-extra_headers)。

### `SERVER_ROOT_PATH` 下的路由 {#routing-under-server_root_path}
- **在非空的 `SERVER_ROOT_PATH` 下延遲載入功能** 不再會在 `/api/v1/policies/attachments/list` 等路由上出現 404；在 lazy-feature 比對前先移除前綴，並在 middleware 初始化時快取正規化後的路徑 — [PR #27812](https://github.com/BerriAI/litellm/pull/27812)

### 標記與指標 {#tagging--metrics}
- **⚠️ 已回復 v1.83.10 的 caller-tag strip / `allow_client_tags` opt-in** — 呼叫端提供的標籤會再次合併到請求中繼資料；不再強制進行 strip。**請參閱下方 Important Behavior Changes → Tags 下的新項目，以了解完整影響。** — [PR #27789](https://github.com/BerriAI/litellm/pull/27789)
- **將 `/metrics` 的 401 提示指向實際的 opt-out 標記** — [PR #27505](https://github.com/BerriAI/litellm/pull/27505)

### 封裝 {#packaging}
- **將核心執行階段鎖定版本放寬為版本範圍**，讓下游套件能解析出單一共用的 `openai`/etc. 版本 — [PR #27241](https://github.com/BerriAI/litellm/pull/27241)
- **將 `[project.dependencies]` 中的 `jinja2` 下限提升至 `>=3.1.6`**，以符合 lockfile — [PR #27552](https://github.com/BerriAI/litellm/pull/27552)

---

## ⚠️ 重要行為變更 {#️-important-behavior-changes}

此版本針對驗證、入口、回呼、MCP 與 UI 強化了多項預設值。下方每一項都列出變更內容，並在適用時提供您還原先前行為所需的確切設定。

### 驗證與請求入口 {#auth--request-ingress}

#### 通過端點預設為 `auth: true` {#pass-through-endpoints-default-to-auth-true}
- **變更內容：** `PassThroughGenericEndpoint.auth` 現在預設為 `True`。`user_api_key_auth.py` 中的執行階段派送會將端點視為原始 dict，因此即使 dict 沒有明確鍵值，`endpoint.get("auth", True)` 也會套用。`premium_user` 在 `auth: true` 上的閘道也已移除 — OSS 部署現在可以使用 `auth: true`。
- **受影響對象：** `general_settings.pass_through_endpoints` 中任何省略 `auth:` 的 pass-through 項目。在此 rc 之前，這代表未經驗證；現在則代表已通過 LiteLLM-key 驗證。
- **還原先前行為：** 在每個預期為公開的 pass-through 項目上明確設定 `auth: false`（例如 webhook 接收端）。
  ```yaml
  general_settings:
    pass_through_endpoints:
      - path: /webhook/something
        target: https://example.com/webhook
        auth: false   # was implicit before; must be explicit now
  ```

#### 用戶端 `api_base` / `base_url` 受到限制並會移除憑證 {#clientside-api_base--base_url-are-gated-and-credential-stripped}
- **變更內容：**
  1. 當啟用 `litellm.user_url_validation` 時，用戶端 `api_base` / `base_url` 會針對 `validate_url` 進行驗證。
  2. 當請求重新導向 `api_base` / `base_url` 時，管理員設定的提供者憑證與每個部署的中繼資料（OCI 簽署金鑰、AWS / Azure / Vertex 權杖、可觀測性變數、`CredentialLiteLLMParams` 上的每個欄位）會在呼叫轉送前被捨棄。
  3. `get_llm_provider_logic.py` 中的提供者推斷比對器不再使用未錨定的子字串比對 — 現在會比較解析後的 URL hostname + 以區段界定的路徑前綴。
  4. 用戶端可覆寫參數的封鎖清單新增 `aws_bedrock_runtime_endpoint`、`langsmith_base_url`、`langfuse_host`、`posthog_host`、`braintrust_host`、`slack_webhook_url`、`s3_endpoint_url`、`sagemaker_base_url`、`deployment_url`。移除了舊的「當 `api_key` 非空時，封鎖清單不會生效」條款。
- **受影響對象：** 任何在請求時傳入 `api_base`（或任何新封鎖的欄位），並依賴隱式 `api_key` 繞過機制將其傳遞的人。
- **還原先前行為：** 改用文件中記載的 BYOK 路徑，而不是使用繞過機制：
  - 整個 Proxy：`general_settings.allow_client_side_credentials: true`
  - 每個部署：`litellm_params.configurable_clientside_auth_params: ["api_base", ...]`

  Proxy 在封鎖的請求上回傳的 400 會指出有問題的欄位，並指向相同的兩個設定。

#### 主金鑰請求現在會傳遞別名，而不是主金鑰雜湊 {#master-key-requests-now-propagate-an-alias-instead-of-the-master-key-hash}
- **變更內容：** 當請求使用 master key 進行驗證時，傳遞給下游程式碼的 `UserAPIKeyAuth.api_key` / `token` 值現在是常數 `LITELLM_PROXY_MASTER_KEY_ALIAS = "litellm_proxy_master_key"`。快取查詢未變更（仍以 `hash_token(master_key)` 為索引鍵）。`_is_master_key` 不再接受 SHA-256 雜湊形式——僅接受原始 master key。
- **受影響對象：** 任何依賴先前 master-key 雜湊值進行聯結或篩選的項目，包括支出記錄上的自訂儀表板，以及固定為雜湊字面值的 Prometheus `/metrics` 查詢。
- **還原先前行為：** 無——查詢支出記錄或指標中 master-key 活動的操作人員，應將篩選條件切換為別名 `"litellm_proxy_master_key"`。

#### 邀請連結加入流程不再從 `GET` 產生金鑰 {#invite-link-onboarding-no-longer-mints-a-key-from-get}
- **變更內容：** `GET /onboarding/get_token` 現在會啟動 CLI SSO 流程，回傳綁定邀請 + 使用者 ID 的 15 分鐘簽署 onboarding JWT；它**不會**鑄造 `sk-...` 虛擬金鑰。`POST /onboarding/claim_token` 需要該 JWT，並透過 `update_many(... is_accepted=False, ... → True)` 原子性地保留邀請。
- **受影響對象：** 任何在完成密碼認領前，將 `GET /onboarding/get_token` 用於內嵌 `sk-...`，並把它視為可用工作階段金鑰的工具。
- **還原先前行為：** 無——用戶端必須呼叫 `POST /onboarding/claim_token` 以取得即時金鑰。

#### CLI SSO 登入流程使用伺服器端工作階段 {#cli-sso-login-flow-uses-a-server-side-session}
- **變更內容：** `litellm-proxy login` 現在會啟動一個 CLI SSO 流程，回傳登入 ID + 輪詢密鑰 + 終端驗證碼。瀏覽器回呼必須先確認終端代碼，輪詢端點才會回傳 JWT。
- **受影響對象：** 任何使用較舊 `litellm-proxy` CLI 搭配升級後 proxy 的人——舊的由呼叫端提供 handle 的交接方式已不存在。
- **還原先前行為：** 無——請將 CLI 與 proxy 一起升級。

#### 團隊自助加入（`_is_available_team`）僅允許自我加入為 `role=user` {#team-self-join-_is_available_team-only-allows-self-add-as-roleuser}
- **變更內容：**
  - `/team/member_add`：當呼叫端不是管理員且團隊為「available」時，請求必須只加入**呼叫者本人**，且使用**`role="user"`**。批次格式也會以相同方式檢查；混合有效自我條目與 `role="admin"` 條目的清單會被拒絕。僅含電子郵件成員、走自我加入路徑的請求會被拒絕。
  - `/team/permissions_update`：`_is_available_team` 子句已完全移除——只有 proxy/team/org 管理員可以更新 `team_member_permissions`。
- **受影響對象：** 任何依賴全面繞過機制來在沒有管理員權限的情況下，將管理員加入可用團隊，或在非管理員情境下修改 `team_member_permissions` 的流程。
- **還原先前行為：** 無——請使用管理員金鑰執行管理員範圍內的操作。

#### 防護欄修改權限會在金鑰存在時進行限制 {#guardrail-modification-permission-gates-on-key-presence}
- **變更內容：** `auth_checks.py` 中的防護欄修改授權檢查現在改為依意圖（也就是請求中是否存在該金鑰）而非 payload 的真值性來判定。部分先前可接受的格式現在會回傳 403。
- **還原先前行為：** 無——對於先前因 falsy payload 而被放行的非管理員呼叫者，需要調整流程。

#### 不受信任的根控制欄位會從用戶端請求中移除 {#untrusted-root-control-fields-are-stripped-from-client-requests}
- **變更內容：** `_UNTRUSTED_ROOT_CONTROL_FIELDS` 在 `litellm_pre_call_utils.py` 中包含 `mock_response`、`mock_tool_calls`、redaction-bypass 控制，以及其他幾項。除非呼叫金鑰／團隊具備 `allow_client_mock_response: true`（適用於 `mock_response` / `mock_tool_calls`）或具備 redaction bypass 對應的管理員 opt-in 中繼資料，否則這些項目會從用戶端請求中移除。當未明確允許時，Pillar 防護欄快取標頭與 Bedrock 動態評估覆寫也會被過濾。
- **受影響對象：** 在 `extra_body` 中傳入 `mock_response` / `mock_tool_calls` 以略過完成內容的測試與工具。
- **還原先前行為：** 在測試金鑰（或其所屬團隊）的管理員中繼資料中設定 `allow_client_mock_response: true`：
  ```python
  client.keys.generate(
      key_alias="ci-mock-key",
      metadata={"allow_client_mock_response": True},
  )
  ```

#### 錯誤回應不再洩漏重新拋出的本機參數 {#error-responses-no-longer-leak-re-raised-local-parameters}
- **變更內容：** response-utils 路徑中廣泛的 `except` 處理常式，過去會將擷取到的請求參數渲染到重新拋出的錯誤訊息中。這些參數可能包含憑證，因此現在會從渲染後的訊息中移除。
- **受影響對象：** 任何會從 5xx 錯誤本文中解析出具有憑證形式欄位的用戶端。錯誤回應的格式其他部分維持不變。
- **還原先前行為：** 無。

### 向量儲存 {#vector-stores}

#### 憑證已遮蔽；`/vector_store/update` 依儲存區受限制 {#credentials-redacted-vector_storeupdate-is-per-store-gated}
- **變更內容：**
  - `/vector_store/list`、`/vector_store/info`、`/vector_store/update` 會在持久化的 `litellm_params` 中遮罩含有憑證的值（可處理 dict、JSON 字串序列化的參數，以及像 `litellm_embedding_config` 這類巢狀 dict 形狀）。
  - `/vector_store/update` 現在受 `_fetch_and_authorize_vector_store` 約束——與 `/vector_store/info` 已有的每個儲存區存取檢查相同。
  - `SensitiveDataMasker` 將複數形式的 `"credentials"` 加入其預設敏感模式集合，因此以分段完全相符的比對可攔截 `vertex_credentials`、`aws_credentials` 等。（這是影響所有預設建立的遮罩器的潛在修正，不僅是向量儲存。）
  - `get_vector_store_info` 和 `update_vector_store` 會重新拋出 `HTTPException`，而不是讓萬用攔截將 `403` / `404` 降級為 `500`。
- **受影響對象：** 任何從這些回應中讀取 `litellm_params` 以還原提供者金鑰的內容，或任何非儲存區管理員呼叫端透過 `/vector_store/update` 修改任意向量儲存。
- **恢復先前行為：** 無。

### 記錄回呼與金鑰/團隊中繼資料 {#logging-callbacks--keyteam-metadata}

#### `os.environ/*` 在金鑰/團隊中繼資料中的回呼參照不再解析 {#osenviron-callback-refs-in-keyteam-metadata-are-no-longer-resolved}
- **變更內容：** `convert_key_logging_metadata_to_callback()` 不再透過 `get_secret()` 從金鑰/團隊中繼資料解析 `os.environ/*` 值。具有這類值的既有資料列在請求設定時會被靜默忽略，而不是讓請求當掉。`config.yaml` 團隊回呼環境變數解析在 `add_team_based_callbacks_from_config()` 中維持不變。由金鑰/團隊記錄中繼資料建立的新 `AddTeamCallback` 也會拒絕 `os.environ/*` 回呼變數。
- **受影響對象：** 任何在其回呼中繼資料中儲存 `os.environ/DATABASE_URL`（或類似內容）以便在請求時取得伺服器環境變數的金鑰/團隊。
- **恢復先前行為：** 請透過受信任的 proxy `config.yaml`（`team_callbacks` / `model_list[*].litellm_params`）設定這些回呼密鑰，而不是在資料庫支援的金鑰或團隊中繼資料中放入 `os.environ/*` 參照。若有絕對必要，仍可在中繼資料中儲存字面上的憑證值。

#### 團隊回呼的管理員變更現在會發出稽核記錄 {#team-callback-admin-mutations-now-emit-audit-logs}
- **變更內容：** `POST /team/{id}/callback`（`add_team_callbacks`）與 `POST /team/{id}/disable_logging`（`disable_team_logging`）在 `litellm.store_audit_logs=True` 時會發出 `LiteLLM_AuditLogs` 資料列。啟用稽核記錄時為增量式。
- **恢復先前行為：** `litellm.store_audit_logs: false`（預設）會抑制新的資料列。

### MCP {#mcp-1}

#### 靜態儲存的已加密使用者範圍 MCP 憑證 {#encrypted-user-scoped-mcp-credentials-at-rest}
- **變更內容：** 對 `LiteLLM_MCPUserCredentials.credential_b64` 的寫入改為經由 `encrypt_value_helper`（nacl SecretBox），而不是明文 `urlsafe_b64encode`。讀取路徑會先嘗試 nacl 解密，若遇到舊資料列則回退至明文 `urlsafe_b64decode`；現有資料列仍可正常讀取。
- **受影響對象：** 直接讀取資料表的操作人員；欄位內容在首次重新寫入後會變更格式。
- **恢復先前行為：** 無——向後相容的讀取路徑會讓舊資料列持續可用，直到下一次被寫入。

#### OAuth 中繼資料探索遵循 SSRF 防護 {#oauth-metadata-discovery-follows-ssrf-guard}
- **變更內容：** MCP discovery 會追蹤的兩個 URL（來自 `resource_metadata` 的 `WWW-Authenticate`，以及來自 protected-resource-metadata 的 `authorization_servers[0]`）現在都受 `async_safe_get` 約束。同一權限範圍的 metadata 擷取仍維持直接連線（含 `follow_redirects=False`）；跨來源擷取會透過既有的使用者 URL 驗證政策進行驗證。公開聯邦提供者（Azure Entra、Google、Okta、GitHub）仍受支援。
- **受影響對象：** 跨來源的 internal/loopback/cloud-metadata OAuth metadata URL。
- **恢復先前行為：** 切換 `litellm.user_url_validation`，並依照 proxy URL 驗證文件中的既有 URL 驗證控制，允許您特定的內部目標。

#### MCP 公開路由偵測不再比對查詢字串；OAuth2 備援不再 fail-open {#mcp-public-route-detection-no-longer-matches-query-strings-oauth2-fallback-no-longer-fail-opens}
- **變更內容：**
  - `MCPRequestHandler.process_mcp_request` 會檢查 `request.url.path.startswith("/.well-known/")`，而不是 `".well-known" in str(request.url)`。像 `?.well-known` 這類查詢字串 smuggling 會被拒絕。
  - 當 `Authorization` 標頭在 LiteLLM-key 驗證失敗時，處理常式不再將失敗視為「OAuth2 passthrough」，而是回傳空的 `UserAPIKeyAuth()`。
- **恢復先前行為：** 無。

#### MCP OAuth 根端點會依請求可見性規則解析 {#mcp-oauth-root-endpoint-resolves-with-request-visibility-rules}
- **變更內容：** 根端點 fallback 會以與明確 server-name 查詢相同的可見性規則解析單一 OAuth2 server；不可見的 server 不會再透過 fallback 路徑被選取。callback redirect 路徑會驗證 state 中攜帶的完整 client redirect URI，並在不捨棄既有 query string 的情況下附加參數。
- **恢復先前行為：** 無——請調整 server 可見性，而不是依賴 fallback。

#### OpenAPI MCP：`static_headers` 現在會優先於呼叫端轉送的 `extra_headers` {#openapi-mcp-static_headers-now-win-over-caller-forwarded-extra_headers}
- **變更內容：** v1.84.0 透過 [PR #27383](https://github.com/BerriAI/litellm/pull/27383) 為 OpenAPI 支援的 MCP 伺服器（`spec_path:` 設定）新增了標頭轉送功能，讓您可以將呼叫端請求標頭加入上游 OpenAPI HTTP 請求的 allowlist。當同一個標頭名稱同時出現在您的 YAML `static_headers` 與請求時 `extra_headers` allowlist 中時，**`static_headers` 值現在會優先生效**；名稱比較採不分大小寫，因此 `X-Tenant-Id` 與 `x-tenant-id` 會被視為同一個標頭。這與受管理的 MCP 路徑一向的行為一致。`Authorization` 仍會最後被 BYOK `x-mcp-auth` 權杖覆寫（若存在）。
- **範例：** 使用
  ```yaml
  mcp_servers:
    data_api:
      spec_path: http://upstream-api.local/openapi.json
      static_headers:
        X-Tenant-Id: "acme-corp"
      extra_headers:
        - X-Tenant-Id
  ```
  的呼叫端若傳送 `X-Tenant-Id: evil-corp`，現在會將 `X-Tenant-Id: acme-corp` 轉送至上游。`extra_headers` 中任何不會與 `static_headers` 衝突的標頭，仍會不變地轉送。
- **受影響對象：** 在 OpenAPI MCP 伺服器上同時於 `static_headers` 與 `extra_headers` 設定相同標頭名稱，且原本仰賴呼叫端值生效的營運者。（注意：這項變更只曾在 v1.84.0 release-candidate 週期發布——先前任何穩定版都沒有為 OpenAPI MCP 轉送過 `extra_headers`。）
- **恢復先前行為：** 無——如果您確實希望呼叫端控制某個標頭，請將它從 `static_headers` 移除，並僅保留在 `extra_headers` 中，或為營運者固定值與呼叫端提供的值使用不同名稱。

### UI / 靜態資產 {#ui--static-assets}

#### `/get_image`、`/get_favicon`、`/get_logo_url` {#get_image-get_favicon-get_logo_url}
- **變更內容：**
  - 遠端 HTTP(S) `UI_LOGO_PATH` / `LITELLM_FAVICON_URL` 現在會透過重新導向由瀏覽器載入——proxy 不再從這些未驗證端點在伺服器端抓取它們。
  - 本機檔案路徑仍可直接使用，但解析後的檔案必須具有支援的圖片簽章（`jpeg`、`png`、`gif`、`webp`、`ico`）；非圖片路徑會回退至內建預設值。
  - `/get_logo_url` 只會回傳 HTTP(S) 值；本機檔案系統路徑不會被揭露。
  - 過期的 `cached_logo.jpg` 檔案不再由 `/get_image` 提供。
- **受影響對象：** 將 `UI_LOGO_PATH` / `LITELLM_FAVICON_URL` 指向非圖片本機檔案，或仰賴 `/get_logo_url` 顯示本機路徑的自訂品牌設定。
- **恢復先前行為：** 不需要新的環境變數。現有遠端 URL 仍可正常運作；只要檔案是可辨識的圖片類型，本機圖片路徑也仍可正常運作。

#### 已移除 `/ui/chat` {#uichat-removed}
- **變更內容：** 靜態 `chat.html` / `chat.txt` / `chat/` 已被移除；該路由回傳 404。聊天 UI 先前已從導覽列移除；殘留的靜態建置現在也一併移除了。
- **恢復先前行為：** 無。

#### 「將 Prompts 儲存在消費記錄中」切換已移至管理設定 {#store-prompts-in-spend-logs-toggle-moved-to-admin-settings}
- **變更內容：** 「將 Prompt 儲存在 Spend Logs 中」與「Maximum Spend Logs Retention Period」都已從 Logs 頁面上的齒輪圖示彈出視窗移至 **Admin Settings → Logging Settings**。該齒輪對非管理員可見，且在儲存時會觸發 403。
- **恢復先前行為：** 無 — 控制項僅限管理員，因為 `/config/update` 和 `/config/list` 本來就已要求如此。

### 標籤 {#tags}

#### ⚠️ 已回復：v1.83.10 呼叫端標籤移除 / `allow_client_tags` opt-in {#️-reverted-v18310-caller-tag-strip--allow_client_tags-opt-in}
- **變更內容：** **此版本回復了 [v1.83.10 中的破壞性變更](/release_notes/v1.83.10/v1-83-10)，該變更會在 key/team 中繼資料沒有 `allow_client_tags: true` 時，移除呼叫端提供的 tags。** 來自 `x-litellm-tags`、請求本文層級的 `tags`，以及 `metadata.tags` 的呼叫端提供 tags，現在會再次流入 `metadata.tags`，並與來自 key/team/project 中繼資料的管理員設定靜態 tags 進行聯集——proxy 的行為已回到 v1.83.10 之前的狀態。`litellm_pre_call_utils.py` 中的呼叫前移除區塊已被刪除，而且該旗標沒有任何 schema 或 endpoint 足跡，因此現有 keys/teams 上殘留的 `allow_client_tags: true` 值不會產生作用。
- **受影響對象：**
  - 在 keys/teams 上設定 `metadata.allow_client_tags: true` 以啟用用戶端 tags 的營運者：此旗標現在已無作用，您可以視需要再清理。
  - **仰賴 v1.83.10 的移除機制來阻擋用戶端提供的 tags 傳遞到以 tag 為基礎的路由或以 tag 為基礎的支出歸因的營運者：該移除機制已不再強制執行。** 請在升級前重新評估您以 tag 為基礎的路由與成本歸因曝險。
- **恢復先前行為：** 無 — proxy 中已移除移除路徑。若必須阻擋呼叫端提供的 tags，請在上游（gateway / ingress）或自訂的呼叫前 hook 中進行過濾。

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（16 個新模型） {#new-model-support-16-new-models}

| 提供者     | 模型                                          | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能                                                  |
| ------------ | ---------------------------------------------- | -------------- | ------------------- | -------------------- | --------------------------------------------------------- |
| OpenAI       | `gpt-image-2`, `gpt-image-2-2026-04-21`        | n/a（影像）    | $5.00               | $10.00               | vision, pdf 輸入                                         |
| Azure OpenAI | `azure/gpt-image-2`, `azure/gpt-image-2-2026-04-21` | n/a（影像） | $5.00               | $10.00               | vision, pdf 輸入                                         |
| AWS Bedrock  | `zai.glm-5`                                    | 200,000        | $1.00               | $3.20                | function calling, reasoning, tool choice                  |
| Crusoe       | `crusoe/deepseek-ai/DeepSeek-R1-0528`          | 163,840        | $3.00               | $7.00                | 推理                                                 |
| Crusoe       | `crusoe/deepseek-ai/DeepSeek-V3-0324`          | -              | -                   | -                    | -                                                         |
| Crusoe       | `crusoe/google/gemma-3-12b-it`                 | 131,072        | $0.10               | $0.10                | function calling, vision, tool choice                     |
| Crusoe       | `crusoe/meta-llama/Llama-3.3-70B-Instruct`     | 131,072        | $0.20               | $0.20                | function calling, tool choice                             |
| Crusoe       | `crusoe/moonshotai/Kimi-K2-Thinking`           | 262,144        | $2.50               | $2.50                | 推理                                                 |
| Crusoe       | `crusoe/openai/gpt-oss-120b`                   | 131,072        | $0.80               | $0.80                | function calling, tool choice                             |
| Crusoe       | `crusoe/Qwen/Qwen3-235B-A22B-Instruct-2507`    | 262,144        | $3.00               | $3.00                | function calling, tool choice                             |
| Vertex AI    | `vertex_ai/xai/grok-4.1-fast-reasoning`        | 2,000,000      | $0.20               | $0.50                | function calling, vision, reasoning, response schema, tool choice |
| Vertex AI    | `vertex_ai/xai/grok-4.1-fast-non-reasoning`    | 2,000,000      | $0.20               | $0.50                | function calling, vision, response schema, tool choice    |
| Vertex AI    | `vertex_ai/xai/grok-4.20-reasoning`            | 2,000,000      | $2.00               | $6.00                | function calling, vision, reasoning, response schema, tool choice |
| Vertex AI    | `vertex_ai/xai/grok-4.20-non-reasoning`        | 2,000,000      | $2.00               | $6.00                | function calling, vision, response schema, tool choice    |

#### 新提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者      | 端點                                                   | 備註                                                                                 |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **AIHubMix** | 與 OpenAI 相容的 chat completions                      | [PR #24294](https://github.com/BerriAI/litellm/pull/24294)                            |
| **Crusoe**   | 跨 reasoning / instruct catalog 的 chat completions    | catalog above                                                                        |

#### 價格更新 {#pricing-updates}

- **OpenAI [`gpt-5.5-pro`](../../docs/providers/openai)** — 已更正：原本是 OpenAI 公布費率的 2 倍。`gpt-5.5-pro` 的成本追蹤輸出將降為前一版所回報的一半——在升級邊界之間對帳支出報告的營運人員應預期此不連續性。 - [PR #26651](https://github.com/BerriAI/litellm/pull/26651)
- **AWS Bedrock Anthropic Claude 4.5 / 4.6 / 4.7**（Global + US）— 已新增 `cache_creation_input_token_cost_above_1hr`（以及 Sonnet 4.5 的 `_above_200k_tokens` LC 變體）。Bedrock 上 1 小時 TTL 的 prompt-cache 寫入現在會依公布的 1.6× 費率計費，而不是回退到 5 分鐘費率（原本會少計約 60%）。- [PR #26800](https://github.com/BerriAI/litellm/pull/26800)

#### 功能 {#features}

- **[Bedrock](../../docs/providers/bedrock)**
    - 在 Converse 路徑上為 Claude 4.5+ 的工具保留 `cache_control` TTL；在 Invoke 路徑上清理 `tools` 區塊 - [PR #25855](https://github.com/BerriAI/litellm/pull/25855)
    - 在 tool-result 路徑上轉換 OpenAI `file` 內容（Bedrock Converse + 直接 Anthropic）- [PR #26710](https://github.com/BerriAI/litellm/pull/26710)
    - 透過 `extra_body` 進行向量儲存區搜尋時，`retrievalConfiguration` 直接傳遞 - [PR #26685](https://github.com/BerriAI/litellm/pull/26685)
- **[Vertex AI](../../docs/providers/vertex)**
    - 將中繼資料標籤傳播到 embeddings（`labels`）、Imagen（`labels`）以及 Discovery Engine rerank（`userLabels`）；跨路徑共用 helper - [PR #25499](https://github.com/BerriAI/litellm/pull/25499)
    - 透過 `@lru_cache` 重用 Anthropic-messages 設定實例，讓 `VertexBase` 憑證快取可在多次呼叫之間持續保留 - [PR #26099](https://github.com/BerriAI/litellm/pull/26099)
- **[Google Native](../../docs/pass_through/google_ai_studio)**
    - 在 `:generateContent` 和 `:streamGenerateContent` 上輸出 LiteLLM proxy 成功標頭（`x-litellm-*`）- [PR #25500](https://github.com/BerriAI/litellm/pull/25500)
    - 在 `:generateContent` / `:streamGenerateContent` 上執行 `pre_call_hook`，讓防護欄生效 - [PR #26914](https://github.com/BerriAI/litellm/pull/26914)
- **[Anthropic](../../docs/providers/anthropic)**
    - 非串流情境下的 JSON `response_format` + 使用者工具：篩選後的工具呼叫 + 結構化 JSON 合併到 `content`；內部 `json_tool_call` 不再顯示 - [PR #26222](https://github.com/BerriAI/litellm/pull/26222)
- **[Ollama](../../docs/providers/ollama)**
    - 在 assistant 訊息上轉送 `tool_calls`，並在 `role: tool` 訊息上轉送 `tool_call_id` —— 修正多輪代理程式中的無限工具呼叫迴圈 - [PR #26122](https://github.com/BerriAI/litellm/pull/26122)
- **[Predibase](../../docs/providers/predibase)**
    - 將 `transform_request` / `transform_response` 移至 `transformation.py`（重構，無行為變更）- [PR #25249](https://github.com/BerriAI/litellm/pull/25249)
- **[AIHubMix](../../docs/providers/aihubmix)（新）**
    - 首個一級 OpenAI 相容提供者項目 - [PR #24294](https://github.com/BerriAI/litellm/pull/24294)

### 錯誤修正 {#bug-fixes}

- **[Vertex AI](../../docs/providers/vertex)**
    - 在 `anyOf` 結構的陣列分支上保留 `items`，並搭配 `null`（Vertex 一直拒絕 `INVALID_ARGUMENT`）- [PR #26675](https://github.com/BerriAI/litellm/pull/26675)
- **[Bedrock](../../docs/providers/bedrock)**
    - `GET /v1/batches/{batch_id}` 會從編碼後的 id 轉送 `model`（原本會回傳 `LiteLLM doesn't support bedrock for 'create_batch'`）- [PR #26814](https://github.com/BerriAI/litellm/pull/26814)
    - 現在在透傳串流中斷時會刷出支出追蹤——來自用戶端中斷的 `GeneratorExit` 會遺漏每個 chunk 的用量值 - [PR #26719](https://github.com/BerriAI/litellm/pull/26719)
    - 將已棄用的 Claude 3.7 Sonnet 測試參照替換為 `claude-sonnet-4-5-20250929-v1:0`，涵蓋 16 個測試檔案 - [PR #26721](https://github.com/BerriAI/litellm/pull/26721)
- **[Router 自訂定價](../../docs/proxy/custom_pricing)**
    - 將來自 DB `model_info` 的自訂 `cost_per_token`，沿著備援路徑傳遞 - [PR #25888](https://github.com/BerriAI/litellm/pull/25888)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **工作流程 API（新增）**
    - 持久化 agent 工作流程執行追蹤。新的結構描述（`LiteLLM_WorkflowRun`、`LiteLLM_WorkflowEvent`、`LiteLLM_WorkflowMessage`）以及位於 `/v1/workflows/runs/...` 底下的 8 個端點（create、list、get、patch、append/list events、append/list messages）。`session_id` 會與 `LiteLLM_SpendLogs.session_id` 結合，以進行免費成本歸因。- [PR #26793](https://github.com/BerriAI/litellm/pull/26793)
- **[向量儲存](../../docs/vector_stores)**
    - 透過 `extra_body` 的 Bedrock `retrievalConfiguration` 透傳，並依提供者明確列入允許清單 - [PR #26685](https://github.com/BerriAI/litellm/pull/26685)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - `DELETE /openai/responses/{id}` 不再送出 `json={}` — Azure 現在會以 `unexpected_body` 拒絕空的 `{}` 主體 - [PR #26949](https://github.com/BerriAI/litellm/pull/26949)
- **直通端點**
    - 在非串流直通回應上呼叫後置請求防護欄（`/vertex_ai/*`、`/openai/*`、`/bedrock/*`）；僅在該路由已設定防護欄時才採用 - [PR #26262](https://github.com/BerriAI/litellm/pull/26262)
    - 在為受管檔案的直通批次建立 fabrication `UserAPIKeyAuth` 時，從 `litellm_params` 中繼資料繼承呼叫者身分（Anthropic + Vertex AI） - [PR #26831](https://github.com/BerriAI/litellm/pull/26831)
- **嵌入快取**
    - 在快取往返過程中保留 `prompt_tokens_details`（包含 `image_count`）；在擷取時彙總每個項目的詳細資訊；針對部分快取命中合併 `combine_usage()` - [PR #26653](https://github.com/BerriAI/litellm/pull/26653)
- **串流記錄**
    - 將串流隱藏回應成本回填到成功記錄路徑中 - [PR #26606](https://github.com/BerriAI/litellm/pull/26606)
- **成本計算**
    - 統一 `success_handler` 的 typed 與 dict 分支，使支出列不再記錄 `0` 及其導致的超出預算回報 - [PR #26629](https://github.com/BerriAI/litellm/pull/26629)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **團隊**
    - 團隊層級搜尋工具憑證：在 `LiteLLM_ObjectPermissionTable` 上新增 `search_tools` 陣列；逐鍵權限會驗證為所屬團隊權限的子集；團隊管理下方的 UI 選擇器 - [PR #26691](https://github.com/BerriAI/litellm/pull/26691)
- **[路由群組](../../docs/proxy/ui/routing_groups)**
    - 新的 **一般設定 → Routing Groups** 頁面：可直接在儀表板上建立、編輯與刪除各模型路由策略，無須編輯 `proxy_config.yaml`。由 UI 管理的群組會持久儲存，並覆寫 YAML 中定義的值；每個群組的狀態會在儲存時重建 - [PR #27131](https://github.com/BerriAI/litellm/pull/27131)
- **模型健康狀態**
    - 模型健康狀態頁面的分頁控制項 - [PR #26826](https://github.com/BerriAI/litellm/pull/26826)
- **CLI / Workers**
    - `--timeout_worker_healthcheck` CLI 旗標（env `TIMEOUT_WORKER_HEALTHCHECK`）— 轉送至 uvicorn 0.37.0+ Config kwarg；較舊的 uvicorn = 警告 + 不執行任何動作；gunicorn / hypercorn 路徑未受影響 - [PR #26622](https://github.com/BerriAI/litellm/pull/26622)
- **記憶體 / lazy loading**
    - 在第一次請求時延後載入可選功能路由器（兩個 worker 的 Docker 部署可降低約 700 MB 記憶體） - [PR #26534](https://github.com/BerriAI/litellm/pull/26534)
    - 延後載入的 openapi.json 首頁；規格產生已移至 CI，並在執行期以 stub 備援 - [PR #26802](https://github.com/BerriAI/litellm/pull/26802)
- **背景工作**
    - 已過期的 LiteLLM 儀表板工作階段金鑰清理作業 - [PR #26460](https://github.com/BerriAI/litellm/pull/26460)
- **MCP OAuth**
    - 支援 Azure Entra 探索端點 - [PR #26584](https://github.com/BerriAI/litellm/pull/26584)

#### 錯誤 {#bugs-1}

- **MCP UI**
    - MCP server 編輯頁面上的 Tool Configuration 面板已從 `POST /mcp-rest/test/tools/list`（temp-session 預覽，需要內嵌憑證）切換為 `GET /mcp-rest/tools/list?server_id=...`（已儲存的憑證）。使用 `auth_type` 的 `api_key` / `bearer_token` / `basic` / `authorization` 已儲存 server，現在載入工具時不會再出現「無法載入工具 — 無法連線至 MCP server。」 - [PR #26002](https://github.com/BerriAI/litellm/pull/26002)
- **團隊**
    - 具有 `max_budget=NULL` 的每位成員列現在會回落至團隊層級強制執行，而不是默默停用它 - [PR #26809](https://github.com/BerriAI/litellm/pull/26809)
- **花費記錄**
    - 從花費記錄錯誤訊息中移除請求資料 - [PR #26662](https://github.com/BerriAI/litellm/pull/26662)
- **Vertex retrieve mocked tests**
    - 在模擬的 retrieve 回應上設定 `is_redirect=False` - [PR #26844](https://github.com/BerriAI/litellm/pull/26844)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **一般**
    - Generic API 記錄器批次傳送的可選重試設定——暫時性的 `litellm.Timeout` / `httpx.ConnectTimeout` 失敗會重試，而不是丟棄批次 - [PR #26645](https://github.com/BerriAI/litellm/pull/26645)
    - 為 Redis 快取 GCP IAM token（原本每次連線都會重新產生；同步 `google-auth` + `google-cloud-iam` 呼叫會凍結 asyncio 事件迴圈，導致正式環境中約 25 秒的 `INCRBYFLOAT` Redis spans）- [PR #26441](https://github.com/BerriAI/litellm/pull/26441)
    - 回填串流隱藏回應成本 - [PR #26606](https://github.com/BerriAI/litellm/pull/26606)

### 防護欄 {#guardrails}

- **CyCraft XecGuard（新增）**
    - 一等級合作夥伴防護欄。多政策 prompt/response 掃描（prompt injection、有害內容、PII、系統提示強制執行、偏見、技能保護）以及透過 `/grounding` 的 RAG 上下文定錨 - [PR #26011](https://github.com/BerriAI/litellm/pull/26011)
- **Noma v2**
    - `_build_scan_payload` 在 `post_call` / `during_call` / `during_mcp_call` 遇到 `deepcopy(request_data)` 失敗且物件無法序列化（例如 `uvloop.Loop`）時不再當機 - [PR #26605](https://github.com/BerriAI/litellm/pull/26605)
- **透傳**
    - 非串流 pass-through 回應的呼叫後防護欄（請參閱 LLM API Endpoints）- [PR #26262](https://github.com/BerriAI/litellm/pull/26262)

---

## 消費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **多 pod 預算強制執行**
    - `RedisCache.async_increment` 新增 `refresh_ttl` 可選功能（由支出計數器使用）；`get_current_spend` 與 `SpendCounterReseed.coalesced` 在乾淨的 Redis miss 時會略過過期的每 pod 記憶體內資料；`ResetBudgetJob` 會在每次 DB row 重設時一併使 Redis 計數器失效（keys、users、teams、team members、與 budgets-linked keys）- [PR #26829](https://github.com/BerriAI/litellm/pull/26829)
- **成本計算統一**
    - `success_handler` 的 typed + dict 分支現在以相同方式計算成本 - [PR #26629](https://github.com/BerriAI/litellm/pull/26629)
- **每成員空值預算**
    - 具有 `max_budget=NULL` 的每成員列會回退到團隊強制執行 - [PR #26809](https://github.com/BerriAI/litellm/pull/26809)
- **Bedrock 1 小時快取寫入計價**
    - Claude 4.5 / 4.6 / 4.7 Global + US 項目新增 `cache_creation_input_token_cost_above_1hr`（原本少算約 60%）- [PR #26800](https://github.com/BerriAI/litellm/pull/26800)
- **`gpt-5.5-pro` 修正後計價**
    - 原本被重複計價 - [PR #26651](https://github.com/BerriAI/litellm/pull/26651)
- **Bedrock pass-through 串流中斷**
    - 當用戶端在串流中途中斷連線時，支出追蹤現在會 flush - [PR #26719](https://github.com/BerriAI/litellm/pull/26719)

---

## MCP 閘道 {#mcp-gateway}

- **工具前綴**
    - 可選用 `LITELLM_USE_SHORT_MCP_TOOL_PREFIX` 環境變數：將每個工具的前綴從人類可讀的伺服器名稱（`github_onprem-get_repo`）切換為由 `server_id`（`Xy7-get_repo`）衍生的決定性 3 字元 base62 ID。可讓較長的伺服器名稱維持在某些模型 API 強制的 60 字元工具名稱限制內 - [PR #26733](https://github.com/BerriAI/litellm/pull/26733)
- **OAuth**
    - 支援 Azure Entra discovery endpoint - [PR #26584](https://github.com/BerriAI/litellm/pull/26584)
    - 請參閱 **重要行為變更**，了解公開路由偵測、OAuth 根端點可見性、OAuth metadata SSRF 防護欄，以及以使用者範圍為基礎的憑證加密。

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **[路由群組（每模型策略）](../../docs/routing#routing-groups---per-model-strategies)**
    - 新的 `router_settings.routing_groups` schema 會將一組 `model_name` 綁定到其專屬的 `routing_strategy` 以及可選的 `routing_strategy_args`；未分組的模型會回退到頂層 `routing_strategy`（隱含的 `default` 群組，名稱保留）。每個 `model_name` 最多只能屬於一個群組——重疊時在 init 會引發 `ValueError`。可在執行時透過 `Router.update_settings(routing_groups=[...])` 或 `/config/update` 更新；更新時會重建每個群組的狀態 - [PR #27022](https://github.com/BerriAI/litellm/pull/27022)
- **資料庫重新連線**
    - Prisma 重新連線不再阻塞 asyncio 事件迴圈。以 SIGTERM → 0.5 秒 sleep → SIGKILL → 重新建立 `Prisma()` + `connect()`，取代 `await self.db.disconnect()`（其會同步呼叫 `subprocess.Popen.wait()`，並在正式環境中將迴圈凍結 30–120 秒以上，導致 K8s 存活探測失敗）。直接重新連線路徑會委派給 `recreate_prisma_client` - [PR #26225](https://github.com/BerriAI/litellm/pull/26225)
    - `call_with_db_reconnect_retry` helper 將重新連線並重試一次的模式集中處理。恢復 1.83.x 在 `PrismaClient.get_generic_data` 上失去的自我修復能力（issue [#25143](https://github.com/BerriAI/litellm/issues/25143)），並強化重新連線狀態機 - [PR #26756](https://github.com/BerriAI/litellm/pull/26756)
- **Redis IAM 權杖快取**
    - GCP IAM 權杖不再會在每次 Redis 連線時重新產生；在正式環境中的一段 28.4 秒 trace 裡，單次 Redis `INCRBYFLOAT` 就花了 25.6 秒 - [PR #26441](https://github.com/BerriAI/litellm/pull/26441)
- **設定快取**
    - DualCache 設定參數讀取會被快取並批次處理。在 Docker 的端到端情境中，讀取負載從 2.8 q/s 降到 0.7 q/s；改善幅度會隨 pod 數量擴大。注意：設定編輯的傳播時間會更長（直到快取失效為止） - [PR #26469](https://github.com/BerriAI/litellm/pull/26469)
- **記憶體占用**
    - 延遲載入的功能路由器 - [PR #26534](https://github.com/BerriAI/litellm/pull/26534)
    - 延遲載入的首頁 + openapi.json 移到 CI - [PR #26802](https://github.com/BerriAI/litellm/pull/26802)
- **連線層**
    - aiohttp 的 `TCPConnector` 上支援可選的 TCP `SO_KEEPALIVE` - [PR #26730](https://github.com/BerriAI/litellm/pull/26730)
- **CLI**
    - 用於 uvicorn worker triage 的 `--timeout_worker_healthcheck` 標誌（請參閱管理端點） - [PR #26622](https://github.com/BerriAI/litellm/pull/26622)
- **測試穩定性**
    - 將 `test_model_alias_map` ERROR-log 斷言的範圍限制在 LiteLLM logger 上，以便 `asyncio` 記錄（例如 `Unclosed client session`）不再間歇性地使該斷言失敗 - [PR #26741](https://github.com/BerriAI/litellm/pull/26741)
    - 以靜態原始碼掃描取代延遲載入子程序啟動-import diff（約 13 秒，而不是在兩分鐘後逾時） - [PR #26934](https://github.com/BerriAI/litellm/pull/26934)

- 將 model-access E2E 測試 opt-in 至 `allow_client_mock_response: true`，於 request-control hardening 之後 - [PR #26941](https://github.com/BerriAI/litellm/pull/26941)
- **驗證**
    - 在憑證輸入時驗證 AWS 區域名稱 - [PR #26906](https://github.com/BerriAI/litellm/pull/26906)
    - 從 `MILVUS_OPTIONAL_PARAMS` 移除不支援的 `dbName` 和 `partitionNames` - [PR #26910](https://github.com/BerriAI/litellm/pull/26910)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

- **CI / 工具**
    - 支援 CircleCI「重新執行失敗的測試」用於 `local_testing_part1` / `local_testing_part2` / `litellm_router_testing` 工作（原本會收集 0 個項目 + exit 123） - [PR #26461](https://github.com/BerriAI/litellm/pull/26461)
    - 修正 `min-release-age` 在 `.npmrc` 檔案中的值：移除 `d` 後綴，以避免 `npm install` 在 npm 11.x 搭配 `RangeError: Invalid time value` 時當機 - [PR #26850](https://github.com/BerriAI/litellm/pull/26850)
- **Pull request 範本**
    - 為內部貢獻者新增 Linear ticket 欄位 - [PR #26655](https://github.com/BerriAI/litellm/pull/26655)

---

## 新貢獻者 {#new-contributors}

- @xinrui-z 完成了他們的首次貢獻於 [#24294](https://github.com/BerriAI/litellm/pull/24294)
- @Jerry-SDE 完成了他們的首次貢獻於 [#25249](https://github.com/BerriAI/litellm/pull/25249)
- @Zerohertz 完成了他們的首次貢獻於 [#25888](https://github.com/BerriAI/litellm/pull/25888)
- @clyang 完成了他們的首次貢獻於 [#26011](https://github.com/BerriAI/litellm/pull/26011)
- @mverrilli 完成了他們的首次貢獻於 [#26122](https://github.com/BerriAI/litellm/pull/26122)
- @tuhinspatra 完成了他們的首次貢獻於 [#26262](https://github.com/BerriAI/litellm/pull/26262)
- @omriShukrun08 完成了他們的首次貢獻於 [#26605](https://github.com/BerriAI/litellm/pull/26605)
- @lmcdonald-godaddy 完成了他們的首次貢獻於 [#26651](https://github.com/BerriAI/litellm/pull/26651)
- @minznerjosh 完成了他們的首次貢獻於 [#26710](https://github.com/BerriAI/litellm/pull/26710)
- @yassinkortam 完成了他們的首次貢獻於 [#26730](https://github.com/BerriAI/litellm/pull/26730)
- @sruthi-sixt-26 完成了他們的首次貢獻於 [#26814](https://github.com/BerriAI/litellm/pull/26814)

**完整更新記錄**: https://github.com/BerriAI/litellm/compare/v1.83.14-stable...v1.84.0

---

## 05/05/2026（`v1.84.0-rc.1`） {#05052026-v1840-rc1}

* 新模型 / 更新模型: 19
* LLM API 端點: 6
* 管理端點 / UI: 22
* AI 整合（記錄 / 防護欄）: 3
* 支出追蹤、預算與速率限制: 5
* MCP 閘道: 6
* 效能 / 負載平衡 / 可靠性改善: 14
* 一般 Proxy 改善: 2
* 文件更新: 1

小計: 78 PRs

## 05/14/2026（`v1.84.0` — 在 rc.1 之上的差異） {#05142026-v1840--delta-on-top-of-rc1}

* 強化: 6
* 預算保留: 2
* 健康探針: 3
* MCP: 2
* 在 `SERVER_ROOT_PATH` 下的路由: 1
* 標記與指標: 2
* 打包: 2

小計: 18 PRs

總計: 96 PRs
