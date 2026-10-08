---
title: "v1.84.0 - 可靠性強化 + 多 pod 預算準確性"
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

> **自 `v1.84.0` 起，LiteLLM 版本遵循 [PEP 440](https://peps.python.org/pep-0440/)。** 穩定版會移除 `-stable` 後綴，因此此版本的 Docker 標籤是 `litellm:1.84.0`，而不是 `litellm:1.84.0-stable`。每個 Docker 標籤都會以裸格式與 `v` 前綴格式同時發布（`litellm:1.84.0` 和 `litellm:v1.84.0` 會解析為同一個映像），因此包含 `v` 前綴的既有固定版本仍可正常運作。PyPI 版本仍維持裸的 PEP 440 格式：`pip install litellm==1.84.0`。如果您在部署工具（Helm values、`requirements.txt`、Renovate 規則等）中鎖定 LiteLLM，請將這些鎖定更新為 PEP 440 格式。

從舊有後綴方案到新的 PEP 440 方案的對應如下：

| 頻道 | 舊版（≤ `v1.83.x`） | 新版（≥ `v1.84.0`） |
| --- | --- | --- |
| 穩定版 | `vX.Y.Z-stable` | `vX.Y.Z` |
| 穩定版修補 | `vX.Y.Z-stable.patch.N` | `vX.Y.Z.postN` |
| 發行候選版 | `vX.Y.Z.rc.N` / `vX.Y.Z-rc.N` | `vX.Y.ZrcN` |
| 開發版 / nightly | `vX.Y.Z-nightly` / `vX.Y.Z.dev.N` | `vX.Y.Z.devN` |

這只是名稱變更；發布節奏、穩定性保證與映像內容都沒有改變。`v1.84.0-rc.1` 標籤（在切換前截取）為了歷史延續而保留舊格式；從 `v1.84.0` 起的每個標籤都會使用 PEP 440 格式。

---

> **提醒：大量行為變更。** 此版本整合了大量在短時間內發佈的可靠性與強化工作。下方的 **重要行為變更** 章節會涵蓋所有會變更預設值、移除組態捷徑，或改變請求/回應格式的項目，以及讓您維持先前行為所需的停用方式。升級正式版部署前，請先閱讀該章節。如果您已經對 `v1.84.0-rc.1` 完成驗證，請參閱 **自 v1.84.0-rc.1 以來的變更** 章節，了解 rc 之後的差異。

## 重點摘要 {#key-highlights}

- **轉送端點預設需要驗證。** `auth` 欄位在 `general_settings.pass_through_endpoints` 底下的項目現在預設為 `true`。過去「OSS 預設提供未驗證的 forwarder；`auth: true` 僅限企業版」的組合已經移除：`auth: true` 可在 OSS 上運作，而想要未驗證 forwarder 的操作者必須明確設定 `auth: false`。
- **多 pod 預算強制執行的準確度明顯提升。** `RedisCache.async_increment` 新增 `refresh_ttl` 的選用加入，支出計數器也加入該機制，而在 Redis 正常失敗時，過時的記憶體內計數器會被跳過。`ResetBudgetJob` 會在 DB 重設時一併使 Redis 計數器失效，因此重新整理後的計數器也會被重設。
- **Prisma DB 重新連線不再凍結 event loop。** 重新連線路徑把 `await self.db.disconnect()`（其會同步呼叫 `subprocess.Popen.wait()`）替換為 SIGTERM→SIGKILL → 全新的 `Prisma()`+`connect()` 序列。資料庫閃斷期間，存活探針不再失敗。相應修正恢復了 `PrismaClient.get_generic_data` 的重新連線與重試。
- **記憶體占用降低約 700 MB**：在雙 worker Docker 部署中，這是透過延遲載入功能路由器與延遲載入首頁達成。對延遲路由的第一次請求會承擔匯入成本；後續請求則不變。
- **MCP OAuth + Azure Entra 探索支援**、可選的短 ID 工具前綴以讓 MCP 工具名稱維持在 60 字元限制內，以及 OAuth 根端點可見性現在與明確的伺服器名稱查詢一致。
- **透過新的 `/v1/workflows/runs` REST 介面進行持久化代理程式工作流程執行追蹤**，其由 `LiteLLM_WorkflowRun` / `LiteLLM_WorkflowEvent` / `LiteLLM_WorkflowMessage` 資料表支援。支出記錄 `session_id` 聯結，用於免費成本歸因。
- **透過 Routing Groups 提供每個模型的路由策略。** 新的 `router_settings.routing_groups` 結構將一組 `model_name` 綁定到其自身的路由策略（例如 `latency-based-routing` 用於 `gpt-4o`、`simple-shuffle` 用於較便宜的模型），且都在單一 router 內。可在 `proxy_config.yaml` 中設定，或在 LiteLLM 儀表板的 General Settings → Routing Groups 中設定；由 UI 管理的 groups 會保留並覆寫 YAML 值。

---

## 自 `v1.84.0-rc.1` 以來的變更 {#changes-since-v1840-rc1}

以下所有內容都是建立在 `v1.84.0-rc.1` 之上，並包含在 `v1.84.0` 中。如果您已經對 rc 完成驗證，這是唯一需要重新測試的差異。

### 加固 {#hardening}
- **`/key/update` 授權檢查** — [PR #27878](https://github.com/BerriAI/litellm/pull/27878)
- **`/key/regenerate` 所有權重新綁定 + premium-gate 防護** — [PR #27793](https://github.com/BerriAI/litellm/pull/27793)
- **在 file-input sinks 拒絕裸字串**，以防止透過精心構造的請求主體讀取本機檔案。請見 [PR #27762](https://github.com/BerriAI/litellm/pull/27762)
- **拒絕 config-file 路徑外的 remote-URL instance-fn 載入。** 請見 [PR #27801](https://github.com/BerriAI/litellm/pull/27801)
- **在 banned-params 檢查中涵蓋 `extra_body` + `azure_ad_token`** — [PR #27898](https://github.com/BerriAI/litellm/pull/27898)
- **MCP BYOK / OAuth：在 RAG ingest `vector_store` 設定中封鎖 SSRF 欄位；封鎖透過請求主體進行的 client-side pricing 注入** — [PR #27892](https://github.com/BerriAI/litellm/pull/27892)

### 預算保留 {#budget-reservation}
- **將每個請求的預算保留上限設為固定值**，而不是在沒有 `max_tokens` 的請求上，把整個剩餘的 team/key/user 預留額度都綁定住。請見 [PR #27509](https://github.com/BerriAI/litellm/pull/27509)
- **圖片生成：預留每張圖片成本**，而不是 max-tokens 成本；嚴格依 model mode 進行門控

### 健康探針 {#health-probes}
- **在未驗證的 `/health/readiness` payload 上重新暴露 `db` 狀態**，使外部探測可在無需驗證的情況下區分 DB 無法連線的 worker。請見 [PR #27866](https://github.com/BerriAI/litellm/pull/27866)
- **UI 從 `/health/readiness/details` 取得 `litellm_version` + `is_detailed_debug`**（受驗證保護），因為這些欄位已從公開 payload 移出。請見 [PR #27896](https://github.com/BerriAI/litellm/pull/27896)
- **UI：停用 `/health/readiness/details` 的重試 + 涵蓋 token 轉送**

### MCP {#mcp}
- **將 MCP client 中設定的 `extra_headers` 轉送到上游 OpenAPI HTTP 呼叫**（關閉 [#26794](https://github.com/BerriAI/litellm/issues/26794)）。請見 [PR #27383](https://github.com/BerriAI/litellm/pull/27383)
- **在相同的轉送路徑上，名稱衝突時 `static_headers` 現在會優先於呼叫端轉送的 `extra_headers`**（不區分大小寫）。請見下方 [重要行為變更 → MCP](#openapi-mcp-static_headers-now-win-over-caller-forwarded-extra_headers)。

### `SERVER_ROOT_PATH` 下的路由 {#routing-under-server_root_path}
- **在非空 `SERVER_ROOT_PATH` 下的延遲功能載入**，不再會在 `/api/v1/policies/attachments/list` 等路由上回傳 404；在 lazy-feature 比對前先移除前綴，並在 middleware init 時快取正規化後的路徑。請見 [PR #27812](https://github.com/BerriAI/litellm/pull/27812)

### 標記與指標 {#tagging--metrics}
- **⚠️ 回復 v1.83.10 的 caller-tag strip / `allow_client_tags` 選用。** 呼叫端提供的 tags 會再次合併到請求中繼資料；不再強制執行 strip。**完整影響請參閱下方「重要行為變更 → Tags」中的新條目。** 請見 [PR #27789](https://github.com/BerriAI/litellm/pull/27789)
- **將 `/metrics` 的 401 提示指向實際的停用旗標** — [PR #27505](https://github.com/BerriAI/litellm/pull/27505)

### 封裝 {#packaging}
- **將核心執行階段固定版本放寬為範圍**，讓下游套件可解析出單一共用的 `openai`/等版本。請參閱 [PR #27241](https://github.com/BerriAI/litellm/pull/27241)
- **將 `jinja2` 的最低版本在 `[project.dependencies]` 提升至 `>=3.1.6`**，以符合 lockfile。請參閱 [PR #27552](https://github.com/BerriAI/litellm/pull/27552)

---

## ⚠️ 重要行為變更 {#️-important-behavior-changes}

此版本收緊了認證、入口、回呼、MCP 與 UI 的多項預設值。以下每一項都會說明變更內容，並在適用時列出還原先前行為所需的精確設定。

### 驗證與請求進入 {#auth--request-ingress}

#### 預設直通端點為 `auth: true` {#pass-through-endpoints-default-to-auth-true}
- **變更內容：** `PassThroughGenericEndpoint.auth` 現在預設為 `True`。`user_api_key_auth.py` 中的執行階段分派會將端點視為原始 dict，因此即使 dict 沒有明確的 key，`endpoint.get("auth", True)` 仍會套用。`premium_user` 在 `auth: true` 上的 gate 也已移除，因此 OSS 部署現在可使用 `auth: true`。
- **受影響對象：** `general_settings.pass_through_endpoints` 中任何省略 `auth:` 的 pass-through 項目。在此 rc 之前，這代表未驗證；現在則代表已由 LiteLLM-key 驗證。
- **還原先前行為：** 對每個預期公開的 pass-through 項目（例如 webhook 接收端）明確設定 `auth: false`。
  ```yaml
  general_settings:
    pass_through_endpoints:
      - path: /webhook/something
        target: https://example.com/webhook
        auth: false   # was implicit before; must be explicit now
  ```

#### 用戶端 `api_base` / `base_url` 受控管且會移除憑證 {#clientside-api_base--base_url-are-gated-and-credential-stripped}
- **變更內容：**
  1. 當 `litellm.user_url_validation` 啟用時，client-side 的 `api_base` / `base_url` 會根據 `validate_url` 進行驗證。
  2. 當請求重新導向 `api_base` / `base_url` 時，管理員設定的提供者憑證與每個部署的中繼資料（OCI 簽章金鑰、AWS / Azure / Vertex token、可觀測性變數、`CredentialLiteLLMParams` 上的每個欄位）都會在呼叫轉送前被移除。
  3. `get_llm_provider_logic.py` 中的提供者推斷比對器不再進行未錨定的子字串比對；現在會比較解析後 URL 的 hostname + 以段落邊界為界的 path prefix。
  4. client-side 可覆寫參數的黑名單新增 `aws_bedrock_runtime_endpoint`、`langsmith_base_url`、`langfuse_host`、`posthog_host`、`braintrust_host`、`slack_webhook_url`、`s3_endpoint_url`、`sagemaker_base_url`、`deployment_url`。原本「當 `api_key` 非空時，黑名單不生效」的條款已移除。
- **受影響對象：** 任何在請求時傳入 `api_base`（或任何新加入黑名單的欄位），並依賴隱式 `api_key` 繞過來傳遞它的人。
- **還原先前行為：** 改用文件記載的 BYOK 路徑，而不要使用繞過：
  - 整體 Proxy：`general_settings.allow_client_side_credentials: true`
  - 每個部署：`litellm_params.configurable_clientside_auth_params: ["api_base", ...]`

  Proxy 在阻擋請求時回傳的 400 會指出有問題的欄位，並連到相同的兩個設定。

#### 主金鑰請求現在傳遞別名，而非主金鑰雜湊 {#master-key-requests-now-propagate-an-alias-instead-of-the-master-key-hash}
- **變更內容：** 當請求以主金鑰驗證時，傳給下游程式碼的 `UserAPIKeyAuth.api_key` / `token` 值現在為常數 `LITELLM_PROXY_MASTER_KEY_ALIAS = "litellm_proxy_master_key"`。快取查詢不變（仍以 `hash_token(master_key)` 為鍵）。`_is_master_key` 不再接受 SHA-256 雜湊形式，只接受原始主金鑰。
- **受影響對象：** 任何會以先前的主金鑰雜湊值進行 join 或 filter 的功能，包括針對支出記錄的自訂儀表板，以及固定在雜湊字面值上的 Prometheus `/metrics` 查詢。
- **還原先前行為：** 無。查詢主金鑰活動的支出記錄或指標的營運者，應將篩選條件改為別名 `"litellm_proxy_master_key"`。

#### 邀請連結入門流程不再從 `GET` 產生金鑰 {#invite-link-onboarding-no-longer-mints-a-key-from-get}
- **變更內容：** `GET /onboarding/get_token` 會回傳一個與邀請 + 使用者 id 綁定、效期 15 分鐘的簽署版 onboarding JWT；它**不會**鑄造 `sk-...` 虛擬金鑰。`POST /onboarding/claim_token` 需要該 JWT，並透過 `update_many(... is_accepted=False, ... → True)` 原子化地保留邀請。
- **受影響對象：** 任何曾在完成密碼認領前，將 `GET /onboarding/get_token` 用於內嵌的 `sk-...`，並把它當作可用 session 金鑰的工具。
- **還原先前行為：** 無。用戶端必須呼叫 `POST /onboarding/claim_token` 以取得有效金鑰。

#### CLI SSO 登入流程使用伺服器端工作階段 {#cli-sso-login-flow-uses-a-server-side-session}
- **變更內容：** `litellm-proxy login` 現在會啟動一個 CLI SSO 流程，回傳登入 id + polling secret + 終端驗證碼。瀏覽器回呼必須先確認終端代碼，polling 端點才會回傳 JWT。
- **受影響對象：** 任何使用較舊 `litellm-proxy` CLI 搭配升級後 proxy 的人，因為舊的由呼叫端提供 handle 的交接方式已移除。
- **還原先前行為：** 無。請將 CLI 與 proxy 一併升級。

#### 團隊自助加入（`_is_available_team`）只允許以 `role=user` 自行加入 {#team-self-join-_is_available_team-only-allows-self-add-as-roleuser}
- **變更內容：**
  - `/team/member_add`：當呼叫者不是管理員且 team 為「可用」時，請求必須**只新增呼叫者本人**且權限為 **`role="user"`**。批次形狀也會以相同方式檢查；混合了有效自我項目與 `role="admin"` 項目的清單會被拒絕。僅含電子郵件的成員在自我加入路徑上會被拒絕。
  - `/team/permissions_update`：`_is_available_team` 子句已完全移除，因此只有 proxy/team/org 管理員可以更新 `team_member_permissions`。
- **受影響對象：** 任何依賴全面繞過，來在沒有管理員權限的情況下把管理員加入可用 team，或從非管理員情境修改 `team_member_permissions` 的流程。
- **還原先前行為：** 無。請使用管理員範圍的金鑰執行管理員操作。

#### 防護欄修改權限以金鑰存在為門檻 {#guardrail-modification-permission-gates-on-key-presence}
- **變更內容：** `auth_checks.py` 中的 guardrail 修改授權檢查現在改為根據意圖（即該 key 是否存在於請求中）進行 gate，而不是根據 payload 的真值判斷。某些先前可接受的形狀現在會回傳 403。
- **還原先前行為：** 無。對於先前會因為 falsy payload 而意外通過的非管理員呼叫者，必須更新流程。

#### 不受信任的根控制欄位會從用戶端請求中移除 {#untrusted-root-control-fields-are-stripped-from-client-requests}
- **變更內容：** `_UNTRUSTED_ROOT_CONTROL_FIELDS` 的 `litellm_pre_call_utils.py` 中包含 `mock_response`、`mock_tool_calls`、redaction-bypass 控制項，以及其他幾項。除非呼叫的 key/team 帶有 `allow_client_mock_response: true`（適用於 `mock_response` / `mock_tool_calls`）或 redaction bypass 對應的管理員 opt-in 中繼資料，否則這些項目會自用戶端請求中移除。未明確允許時，Pillar guardrail 快取標頭與 Bedrock 動態評估覆寫也會被過濾。
- **受影響對象：** 在 `extra_body` 中傳入 `mock_response` / `mock_tool_calls` 以提前終止 completions 的測試與工具。
- **還原先前行為：** 在測試金鑰（或其所屬 team）的管理員中繼資料中設定 `allow_client_mock_response: true`：
  ```python
  client.keys.generate(
      key_alias="ci-mock-key",
      metadata={"allow_client_mock_response": True},
  )
  ```

#### `LiteLLM-Changed-By` 稽核歸因需要明確選擇加入 {#litellm-changed-by-audit-attribution-requires-opt-in}
- **變更內容：** 稽核記錄只有在呼叫的 key（或其 team）在中繼資料中帶有 `allow_litellm_changed_by_header: true` 時，才會接受 `LiteLLM-Changed-By` 標頭。若未 opt-in，`changed_by` 會退回到呼叫 key 的 `user_id`。先前該標頭一律會被接受，任何呼叫者都能重寫稽核歸因。
- **受影響對象：** 代表使用者呼叫管理端點，並依賴該標頭作為稽核追蹤中「Changed By」值的平台。主金鑰無法 opt-in（它沒有儲存的中繼資料）；請改用管理員 virtual key 傳送標頭。
- **還原先前行為：** 在送出標頭的 key（或其 team）上設定 opt-in：
  ```shell
  curl -X POST 'http://0.0.0.0:4000/key/update' \
      -H "Authorization: Bearer $LITELLM_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{"key": "<admin key that sends the header>", "metadata": {"allow_litellm_changed_by_header": true}}'
  ```

#### 錯誤回應不再洩漏重新拋出的本地參數 {#error-responses-no-longer-leak-re-raised-local-parameters}
- **變更內容：** response-utils 路徑中的廣泛 `except` 處理器過去會將捕捉到的請求參數渲染進重新拋出的錯誤訊息。那些參數可能包含憑證，因此現在會從渲染後的訊息中移除。
- **受影響對象：** 任何會從 5xx 錯誤本文中解析出類憑證欄位的用戶端。錯誤回應的形狀其餘部分不變。
- **還原先前行為：** 無。

### 向量儲存 {#vector-stores}

#### 已移除憑證中的識別資訊；`/vector_store/update` 針對每個儲存區受控管 {#credentials-redacted-vector_storeupdate-is-per-store-gated}
- **變更內容：**
  - `/vector_store/list`、`/vector_store/info`、`/vector_store/update` 會將持久化的 `litellm_params` 中包含憑證的值遮罩（可處理 dict、JSON 字串序列化的參數，以及像 `litellm_embedding_config` 這類巢狀 dict 形狀）。
  - `/vector_store/update` 現在受 `_fetch_and_authorize_vector_store` 約束，與 `/vector_store/info` 已有的每個 store 存取檢查相同。
  - `SensitiveDataMasker` 已將複數形式的 `"credentials"` 新增至其預設敏感模式集合，因此以區段精確比對可捕捉 `vertex_credentials`、`aws_credentials` 等。（這是潛在修正，影響所有以預設值初始化的 masker，不僅是向量儲存。）
  - `get_vector_store_info` 與 `update_vector_store` 會重新拋出 `HTTPException`，而不是讓全捕捉例外處理將 `403` / `404` 降級為 `500`。
- **受影響對象：** 任何會從這些回應讀取 `litellm_params` 以復原提供者金鑰的功能，或任何非 store 管理員呼叫端透過 `/vector_store/update` 修改任意向量儲存。
- **還原先前行為：** 無。

### 記錄回呼與金鑰／團隊中繼資料 {#logging-callbacks--keyteam-metadata}

#### 金鑰／團隊中繼資料中的 `os.environ/*` 回呼參照不再解析 {#osenviron-callback-refs-in-keyteam-metadata-are-no-longer-resolved}
- **變更內容：** `convert_key_logging_metadata_to_callback()` 不再透過 `get_secret()` 從 key/team 中繼資料解析 `os.environ/*` 值。現有包含這類值的資料列會在請求設定時被靜默忽略，而不是讓請求當場崩潰。受信任的 `config.yaml` team-callback env 解析在 `add_team_based_callbacks_from_config()` 中維持不變。從 key/team 記錄中繼資料新建的 `AddTeamCallback` 也會拒絕 `os.environ/*` callback vars。
- **受影響對象：** 任何在其 callback 中繼資料中儲存 `os.environ/DATABASE_URL`（或類似值），以便在請求時取得伺服器環境變數的 key/team。
- **還原先前行為：** 請透過受信任的 proxy `config.yaml`（`team_callbacks` / `model_list[*].litellm_params`）設定這些 callback secrets，而不要在由資料庫支援的 key 或 team 中繼資料中放入 `os.environ/*` 參照。如有絕對必要，仍可在中繼資料中儲存字面量憑證值。

#### 團隊回呼的管理員異動現在會發出稽核記錄 {#team-callback-admin-mutations-now-emit-audit-logs}
- **變更內容：** `POST /team/{id}/callback`（`add_team_callbacks`）與 `POST /team/{id}/disable_logging`（`disable_team_logging`）在 `LiteLLM_AuditLogs` 時會產生 `litellm.store_audit_logs=True` 資料列。啟用稽核記錄時為附加式變更。
- **還原先前行為：** `litellm.store_audit_logs: false`（預設值）會抑制新的資料列。

### MCP {#mcp-1}

#### 靜態保存時已加密的使用者範圍 MCP 憑證 {#encrypted-user-scoped-mcp-credentials-at-rest}
- **變更內容：** 對 `LiteLLM_MCPUserCredentials.credential_b64` 的寫入現在透過 `encrypt_value_helper`（nacl SecretBox）進行，而不是明文 `urlsafe_b64encode`。讀取路徑會先嘗試 nacl 解密，並對舊資料列回退到明文 `urlsafe_b64decode`；現有資料列仍可讀取。
- **受影響對象：** 直接讀取該表的營運人員；欄位內容在第一次重新寫入時會改變形狀。
- **還原先前行為：** 無。向後相容的讀取路徑會讓舊資料列持續可用，直到它們下次被寫入。

#### OAuth 中繼資料探索遵循 SSRF 防護 {#oauth-metadata-discovery-follows-ssrf-guard}
- **變更內容：** MCP discovery 所遵循的兩個 URL（來自 `WWW-Authenticate` 的 `resource_metadata`，以及來自 protected-resource-metadata 的 `authorization_servers[0]`）現在都受 `async_safe_get` 約束。同一 authority 的中繼資料擷取仍保持直接（含 `follow_redirects=False`）；跨來源擷取則透過既有的使用者 URL 驗證政策進行驗證。公開聯邦提供者（Azure Entra、Google、Okta、GitHub）仍受支援。
- **受影響對象：** 跨來源的內部/迴路本機/cloud-metadata OAuth 中繼資料 URL。
- **還原先前行為：** 切換 `litellm.user_url_validation`，並依 proxy URL 驗證文件中的既有 URL 驗證控制，允許您特定的內部目標。

#### MCP 公開路由偵測不再匹配查詢字串；OAuth2 備援不再在失敗時開啟 {#mcp-public-route-detection-no-longer-matches-query-strings-oauth2-fallback-no-longer-fail-opens}
- **變更內容：**
  - `MCPRequestHandler.process_mcp_request` 檢查的是 `request.url.path.startswith("/.well-known/")`，而不是 `".well-known" in str(request.url)`。像 `?.well-known` 這類查詢字串 smuggling 會被拒絕。
  - 當 `Authorization` 標頭未通過 LiteLLM 金鑰驗證時，處理常式不再將失敗視為「OAuth2 passthrough」，而是回傳空的 `UserAPIKeyAuth()`。
- **還原先前行為：** 無。

#### MCP OAuth 根端點依請求可見性規則解析 {#mcp-oauth-root-endpoint-resolves-with-request-visibility-rules}
- **變更內容：** 根端點 fallback 會以與明確伺服器名稱查找相同的可見性規則解析單一 OAuth2 伺服器；不可見伺服器不再透過 fallback 路徑被選取。回呼重新導向路徑會驗證 state 中攜帶的完整用戶端重新導向 URI，並在不丟失既有查詢字串的情況下附加參數。
- **還原先前行為：** 無。請調整伺服器可見性，而不要仰賴 fallback。

#### OpenAPI MCP：`static_headers` 現在優先於呼叫端轉送的 `extra_headers` {#openapi-mcp-static_headers-now-win-over-caller-forwarded-extra_headers}
- **變更內容：** v1.84.0 透過 [PR #27383](https://github.com/BerriAI/litellm/pull/27383) 為以 OpenAPI 為基礎的 MCP 伺服器（`spec_path:` 設定）引入標頭轉送，讓您可將呼叫端請求標頭加入上游 OpenAPI HTTP 請求的 allowlist。當相同標頭名稱同時出現在您的 YAML `static_headers` 與請求時的 `extra_headers` allowlist 中時，**`static_headers` 值現在會勝出**，且名稱比較採不分大小寫，因此 `X-Tenant-Id` 與 `x-tenant-id` 會被視為相同標頭。這與受管理的 MCP 路徑一向的行為一致。`Authorization` 仍會在最後被 BYOK `x-mcp-auth` token 覆寫（若有提供）。
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
  的情況下，呼叫端送出的 `X-Tenant-Id: evil-corp` 現在會讓 `X-Tenant-Id: acme-corp` 傳送到上游。`extra_headers` 中任何**不**與 `static_headers` 衝突的標頭仍會維持原樣轉送。
- **受影響對象：** 在 OpenAPI MCP 伺服器上同時於 `static_headers` 與 `extra_headers` 設定相同標頭名稱，且原本依賴呼叫端值生效的營運人員。（注意：這只在 v1.84.0 release-candidate 週期中出貨；任何先前穩定版都完全沒有為 OpenAPI MCP 轉送 `extra_headers`。）
- **還原先前行為：** 無。如果您 वास्तव需要讓呼叫端控制某個標頭，請將其從 `static_headers` 移除，並只保留在 `extra_headers`，或為營運人員固定的值與呼叫端提供的值使用不同名稱。

### UI / 靜態資產 {#ui--static-assets}

#### `/get_image`、`/get_favicon`、`/get_logo_url` {#get_image-get_favicon-get_logo_url}
- **變更內容：**
  - 遠端 HTTP(S) `UI_LOGO_PATH` / `LITELLM_FAVICON_URL` 現在會透過重新導向由瀏覽器載入；proxy 不再從這些未驗證端點在伺服器端擷取它們。
  - 本機檔案路徑仍可原地使用，但解析後的檔案必須具有支援的圖片簽章（`jpeg`、`png`、`gif`、`webp`、`ico`）；非圖片路徑會回退至內建預設值。
  - `/get_logo_url` 只會回傳 HTTP(S) 值；本機檔案系統路徑不會被揭露。
  - 已過時的 `cached_logo.jpg` 檔案不再由 `/get_image` 提供。
- **受影響對象：** 將 `UI_LOGO_PATH` / `LITELLM_FAVICON_URL` 指向非圖片本機檔案的自訂品牌設定，或依賴 `/get_logo_url` 顯示本機路徑的設定。
- **還原先前行為：** 不需要新的 env vars。既有遠端 URL 仍可正常運作；本機圖片路徑也仍可正常運作，只要檔案是可識別的圖片類型。

#### 移除 `/ui/chat` {#uichat-removed}
- **變更內容：** 靜態 `chat.html` / `chat.txt` / `chat/` 已移除；該路由回傳 404。聊天 UI 早已從導覽中移除；殘留的靜態建置現在也一併移除。
- **還原先前行為：** 無。

#### 「將提示詞儲存在支出記錄中」切換項已移至管理員設定 {#store-prompts-in-spend-logs-toggle-moved-to-admin-settings}
- **變更內容：** 「將 Prompts 儲存在 Spend Logs 中」與「Maximum Spend Logs Retention Period」都已從 Logs 頁面的齒輪圖示 modal 移至 **Admin Settings → Logging Settings**。該齒輪對非管理員可見，且在儲存時會出現 403。
- **還原先前行為：** 無。控制項僅供管理員使用，因為 `/config/update` 與 `/config/list` 早已要求如此。

### 標籤 {#tags}

#### ⚠️ 已回復：v1.83.10 呼叫端標籤移除 / `allow_client_tags` 選擇加入 {#️-reverted-v18310-caller-tag-strip--allow_client_tags-opt-in}
- **變更內容：** **此版本回復了 [v1.83.10 的破壞性變更](/release_notes/v1.83.10/v1-83-10)，該變更會移除呼叫端提供的標籤，除非 key/team 中繼資料具有 `allow_client_tags: true`。** 來自 `x-litellm-tags`、層級為 body 的 `tags`，以及 `metadata.tags` 的呼叫端提供標籤，現在會再次流入 `metadata.tags`，並與來自 key/team/project 中繼資料的管理員設定靜態標籤聯集，因此 proxy 的行為已回到 v1.83.10 之前的狀態。`litellm_pre_call_utils.py` 中的呼叫前移除區塊已刪除，且此旗標沒有 schema 或端點影響，因此現有 keys/teams 上殘留的 `allow_client_tags: true` 值不會產生作用。
- **受影響對象：**
  - 在 keys/teams 上設定 `metadata.allow_client_tags: true` 以啟用用戶端標籤的營運者：此旗標現在沒有作用，可隨時清理。
  - **依賴 v1.83.10 的移除功能來阻止用戶端提供的標籤進入基於標籤的路由或基於標籤的支出歸因的營運者：此移除功能不再強制執行。** 請在升級前重新評估您基於標籤的路由與成本歸因風險。
- **恢復先前行為：** 無。移除路徑已從 proxy 中移除。若必須阻止呼叫端提供的標籤，請在上游（gateway / ingress）或自訂呼叫前 hook 中過濾。

---

## 新模型／更新模型 {#new-models--updated-models}

#### 新模型支援（16 個新模型） {#new-model-support-16-new-models}

| 提供者     | 模型                                          | Context Window | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能                                                  |
| ------------ | ---------------------------------------------- | -------------- | ------------------- | -------------------- | --------------------------------------------------------- |
| OpenAI       | `gpt-image-2`, `gpt-image-2-2026-04-21`        | n/a (image)    | $5.00               | $10.00               | vision, pdf input                                         |
| Azure OpenAI | `azure/gpt-image-2`, `azure/gpt-image-2-2026-04-21` | n/a (image) | $5.00               | $10.00               | vision, pdf input                                         |
| AWS Bedrock  | `zai.glm-5`                                    | 200,000        | $1.00               | $3.20                | function calling, reasoning, tool choice                  |
| Crusoe       | `crusoe/deepseek-ai/DeepSeek-R1-0528`          | 163,840        | $3.00               | $7.00                | reasoning                                                 |
| Crusoe       | `crusoe/deepseek-ai/DeepSeek-V3-0324`          | -              | -                   | -                    | -                                                         |
| Crusoe       | `crusoe/google/gemma-3-12b-it`                 | 131,072        | $0.10               | $0.10                | function calling, vision, tool choice                     |
| Crusoe       | `crusoe/meta-llama/Llama-3.3-70B-Instruct`     | 131,072        | $0.20               | $0.20                | function calling, tool choice                             |
| Crusoe       | `crusoe/moonshotai/Kimi-K2-Thinking`           | 262,144        | $2.50               | $2.50                | reasoning                                                 |
| Crusoe       | `crusoe/openai/gpt-oss-120b`                   | 131,072        | $0.80               | $0.80                | function calling, tool choice                             |
| Crusoe       | `crusoe/Qwen/Qwen3-235B-A22B-Instruct-2507`    | 262,144        | $3.00               | $3.00                | function calling, tool choice                             |
| Vertex AI    | `vertex_ai/xai/grok-4.1-fast-reasoning`        | 2,000,000      | $0.20               | $0.50                | function calling, vision, reasoning, response schema, tool choice |
| Vertex AI    | `vertex_ai/xai/grok-4.1-fast-non-reasoning`    | 2,000,000      | $0.20               | $0.50                | function calling, vision, response schema, tool choice    |
| Vertex AI    | `vertex_ai/xai/grok-4.20-reasoning`            | 2,000,000      | $2.00               | $6.00                | function calling, vision, reasoning, response schema, tool choice |
| Vertex AI    | `vertex_ai/xai/grok-4.20-non-reasoning`        | 2,000,000      | $2.00               | $6.00                | function calling, vision, response schema, tool choice    |

#### 新提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者     | 端點                                              | 備註                                                                                |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **AIHubMix** | 相容 OpenAI 的 chat completions                     | [PR #24294](https://github.com/BerriAI/litellm/pull/24294)                            |
| **Crusoe**   | 跨 reasoning / instruct catalog 的 chat completions  | 上方 catalog                                                                        |

#### 定價更新 {#pricing-updates}

- **OpenAI [`gpt-5.5-pro`](../../docs/providers/openai)**：已更正，因為它是 OpenAI 公開價格的 2 倍。`gpt-5.5-pro` 的成本追蹤輸出將降為先前版本回報的一半，因此在升級邊界上對帳支出報告的營運者應預期此不連續性。 - [PR #26651](https://github.com/BerriAI/litellm/pull/26651)
- **AWS Bedrock Anthropic Claude 4.5 / 4.6 / 4.7**（Global + US）：新增 `cache_creation_input_token_cost_above_1hr`（以及 Sonnet 4.5 的 `_above_200k_tokens` LC 變體）。Bedrock 上 1 小時 TTL 的 prompt-cache 寫入現在會依公開的 1.6× 費率計費，而不是回退到 5 分鐘費率（原先少計約 60%）。 - [PR #26800](https://github.com/BerriAI/litellm/pull/26800)

#### 功能 {#features}

- **[Bedrock](../../docs/providers/bedrock)**
    - 在 Converse 路徑上保留 Claude 4.5+ 工具的 `cache_control` TTL；在 Invoke 路徑上清理 `tools` 區塊 - [PR #25855](https://github.com/BerriAI/litellm/pull/25855)
    - 在 tool-result 路徑上轉換 OpenAI `file` 內容（Bedrock Converse + direct Anthropic） - [PR #26710](https://github.com/BerriAI/litellm/pull/26710)
    - 透過 `retrievalConfiguration` 為向量儲存搜尋轉送 `extra_body` - [PR #26685](https://github.com/BerriAI/litellm/pull/26685)
- **[Vertex AI](../../docs/providers/vertex)**
    - 將中繼資料標籤傳遞給 embeddings（`labels`）、Imagen（`labels`）與 Discovery Engine rerank（`userLabels`）；跨路徑共用 helper - [PR #25499](https://github.com/BerriAI/litellm/pull/25499)
    - 透過 `@lru_cache` 重用 Anthropic-messages 設定實例，讓 `VertexBase` 憑證快取可跨請求保留 - [PR #26099](https://github.com/BerriAI/litellm/pull/26099)
- **[Google Native](../../docs/pass_through/google_ai_studio)**
    - 在 `:generateContent` 和 `:streamGenerateContent` 上發出 LiteLLM proxy 成功標頭（`x-litellm-*`） - [PR #25500](https://github.com/BerriAI/litellm/pull/25500)
    - 在 `:generateContent` / `:streamGenerateContent` 上執行 `pre_call_hook`，使 guardrails 觸發 - [PR #26914](https://github.com/BerriAI/litellm/pull/26914)
- **[Anthropic](../../docs/providers/anthropic)**
    - 非串流的 JSON `response_format` + 使用者工具：過濾後的 tool calls + 結構化 JSON 合併到 `content`；內部 `json_tool_call` 不再顯示 - [PR #26222](https://github.com/BerriAI/litellm/pull/26222)
- **[Ollama](../../docs/providers/ollama)**
    - 在 assistant messages 上轉送 `tool_calls`，並在 `role: tool` messages 上轉送 `tool_call_id`，修正多輪代理程式的無限 tool-call 迴圈 - [PR #26122](https://github.com/BerriAI/litellm/pull/26122)
- **[Predibase](../../docs/providers/predibase)**
    - 將 `transform_request` / `transform_response` 移入 `transformation.py`（重構，無行為變更） - [PR #25249](https://github.com/BerriAI/litellm/pull/25249)
- **AIHubMix（新）**
    - OpenAI 相容的第一類提供者入口 - [PR #24294](https://github.com/BerriAI/litellm/pull/24294)

### 錯誤修正 {#bug-fixes}

- **[Vertex AI](../../docs/providers/vertex)**
    - 在 `anyOf` 結構的陣列分支中保留 `items`，並搭配 `null`（Vertex 會拒絕 `INVALID_ARGUMENT`） - [PR #26675](https://github.com/BerriAI/litellm/pull/26675)
- **[Bedrock](../../docs/providers/bedrock)**
    - `GET /v1/batches/{batch_id}` 會從編碼後的 id 傳遞 `model`（原本會回傳 `LiteLLM doesn't support bedrock for 'create_batch'`） - [PR #26814](https://github.com/BerriAI/litellm/pull/26814)
    - pass-through 串流中斷現在會刷新花費追蹤；來自用戶端中斷連線的 `GeneratorExit` 會漏掉每個區塊的使用量值 - [PR #26719](https://github.com/BerriAI/litellm/pull/26719)
    - 將已棄用的 Claude 3.7 Sonnet 測試參照在 16 個測試檔案中全部替換為 `claude-sonnet-4-5-20250929-v1:0` - [PR #26721](https://github.com/BerriAI/litellm/pull/26721)
- **[Router 自訂定價](../../docs/proxy/custom_pricing)**
    - 將來自資料庫 `model_info` 的自訂 `cost_per_token` 沿著備援路徑傳遞 - [PR #25888](https://github.com/BerriAI/litellm/pull/25888)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **Workflows API（新）**
    - 持久化的代理程式工作流程執行追蹤。新增結構描述（`LiteLLM_WorkflowRun`、`LiteLLM_WorkflowEvent`、`LiteLLM_WorkflowMessage`）以及 `/v1/workflows/runs/...` 底下的 8 個端點（建立、列出、取得、修補、附加/列出事件、附加/列出訊息）。`session_id` 會與 `LiteLLM_SpendLogs.session_id` 連結，以便免費歸因成本。 - [PR #26793](https://github.com/BerriAI/litellm/pull/26793)
- **[Vector Stores](../../docs/vector_stores)**
    - 透過 `extra_body` 的 Bedrock `retrievalConfiguration` 傳遞，並針對每個提供者明確允許清單 - [PR #26685](https://github.com/BerriAI/litellm/pull/26685)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - `DELETE /openai/responses/{id}` 不再送出 `json={}`，因為 Azure 現在會以 `unexpected_body` 拒絕空的 `{}` 主體 - [PR #26949](https://github.com/BerriAI/litellm/pull/26949)
- **Pass-through 端點**
    - 在非串流的 pass-through 回應上呼叫請求後防護欄（`/vertex_ai/*`、`/openai/*`、`/bedrock/*`）；僅在該路由已設定防護欄時才會選用 - [PR #26262](https://github.com/BerriAI/litellm/pull/26262)
    - 在為受管理檔案的 passthrough 批次建立製作 `UserAPIKeyAuth` 時，從 `litellm_params` 中繼資料繼承呼叫者身分（Anthropic + Vertex AI） - [PR #26831](https://github.com/BerriAI/litellm/pull/26831)
- **Embedding 快取**
    - 在快取往返過程中保留 `prompt_tokens_details`（含 `image_count`）；在擷取時彙總每個項目的詳細資料；針對部分快取命中，在 `combine_usage()` 中合併 - [PR #26653](https://github.com/BerriAI/litellm/pull/26653)
- **串流記錄**
    - 將串流隱藏回應成本回填到成功記錄路徑 - [PR #26606](https://github.com/BerriAI/litellm/pull/26606)
- **成本計算**
    - 統一 `success_handler` 的型別化與字典分支，使花費列不再記錄 `0` 及其造成的預算超支報告 - [PR #26629](https://github.com/BerriAI/litellm/pull/26629)

---

## 管理端點／UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **團隊**
    - 團隊層級搜尋工具憑證：在 `LiteLLM_ObjectPermissionTable` 上新增 `search_tools` 陣列；每個金鑰的權限會驗證為擁有團隊權限的子集合；在團隊管理下提供 UI 選擇器 - [PR #26691](https://github.com/BerriAI/litellm/pull/26691)
- **[Routing Groups](../../docs/proxy/ui/routing_groups)**
    - 全新的 **一般設定 → Routing Groups** 頁面：可直接從儀表板建立、編輯與刪除每個模型的路由策略，而無需編輯 `proxy_config.yaml`。由 UI 管理的群組會持久化並覆寫 YAML 中定義的值；每個群組的狀態會在儲存時重建 - [PR #27131](https://github.com/BerriAI/litellm/pull/27131)
- **模型健康度**
    - 模型健康狀態頁面上的分頁控制項 - [PR #26826](https://github.com/BerriAI/litellm/pull/26826)
- **CLI / Workers**
    - `--timeout_worker_healthcheck` CLI 旗標（env `TIMEOUT_WORKER_HEALTHCHECK`）：轉送至 uvicorn 0.37.0+ Config kwarg；較舊的 uvicorn = 警告 + 無操作；gunicorn / hypercorn 路徑不受影響 - [PR #26622](https://github.com/BerriAI/litellm/pull/26622)
- **記憶體 / lazy loading**
    - 在第一次請求時延遲載入可選功能路由器（兩個 worker 的 Docker 部署可降低約 700 MB 記憶體） - [PR #26534](https://github.com/BerriAI/litellm/pull/26534)
    - 延遲載入的 openapi.json 首頁；規格生成移至 CI，並在執行階段以 stub 備援 - [PR #26802](https://github.com/BerriAI/litellm/pull/26802)
- **背景工作**
    - 過期 LiteLLM 儀表板工作階段金鑰的清理工作 - [PR #26460](https://github.com/BerriAI/litellm/pull/26460)
- **MCP OAuth**
    - 支援 Azure Entra 探索端點 - [PR #26584](https://github.com/BerriAI/litellm/pull/26584)

#### 錯誤 {#bugs-1}

- **MCP UI**
    - MCP 伺服器編輯頁面的工具設定面板已從 `POST /mcp-rest/test/tools/list`（暫時工作階段預覽，需要內嵌憑證）切換為 `GET /mcp-rest/tools/list?server_id=...`（已儲存的憑證）。已儲存且具有 `auth_type`、`api_key`、`bearer_token`、`basic`、`authorization` 的伺服器現在會載入工具，而不會出現「無法載入工具。連線 MCP 伺服器失敗。」 - [PR #26002](https://github.com/BerriAI/litellm/pull/26002)
- **團隊**
    - 具有 `max_budget=NULL` 的每位成員列現在會改為套用團隊層級強制執行，而不是靜默停用 - [PR #26809](https://github.com/BerriAI/litellm/pull/26809)
- **花費記錄**
    - 從花費記錄錯誤訊息中移除請求資料 - [PR #26662](https://github.com/BerriAI/litellm/pull/26662)
- **Vertex retrieve 模擬測試**
    - 在模擬的 retrieve 回應上設定 `is_redirect=False` - [PR #26844](https://github.com/BerriAI/litellm/pull/26844)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **一般**
    - Generic API 記錄器批次傳送新增可選的重試設定，因此暫時性的 `litellm.Timeout` / `httpx.ConnectTimeout` 失敗會重試，而不是直接丟棄該批次 - [PR #26645](https://github.com/BerriAI/litellm/pull/26645)
    - 快取用於 Redis 的 GCP IAM token（原本會每次連線都重新產生；同步的 `google-auth` + `google-cloud-iam` 呼叫會凍結 asyncio event loop，導致 production 中約 25 秒的 `INCRBYFLOAT` Redis spans） - [PR #26441](https://github.com/BerriAI/litellm/pull/26441)
    - 回填串流隱藏回應成本 - [PR #26606](https://github.com/BerriAI/litellm/pull/26606)

### 防護欄 {#guardrails}

- **CyCraft XecGuard（新）**
    - 第一方合作夥伴防護欄。多政策 prompt/response 掃描（prompt injection、有害內容、PII、系統提示詞強制執行、偏見、技能保護），以及透過 `/grounding` 的 RAG 情境對齊 - [PR #26011](https://github.com/BerriAI/litellm/pull/26011)
- **Noma v2**
    - `_build_scan_payload` 不再會在 `post_call` / `during_call` / `during_mcp_call` 遇到 `deepcopy(request_data)` 失敗且物件無法序列化（例如 `uvloop.Loop`）時當機 - [PR #26605](https://github.com/BerriAI/litellm/pull/26605)
- **透傳**
    - 非串流 pass-through 回應上的請求後防護欄（請見 LLM API Endpoints） - [PR #26262](https://github.com/BerriAI/litellm/pull/26262)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **多叢集預算強制執行**
    - `RedisCache.async_increment` 新增 `refresh_ttl` 可選用功能（供花費計數器使用）；`get_current_spend` 與 `SpendCounterReseed.coalesced` 會在乾淨的 Redis miss 時略過過時的每叢集記憶體內資料；`ResetBudgetJob` 會在每次 DB 列重設時一併讓 Redis 計數器失效（金鑰、使用者、團隊、團隊成員、與預算關聯的金鑰） - [PR #26829](https://github.com/BerriAI/litellm/pull/26829)
- **成本計算統一**
    - `success_handler` 的型別化 + 字典分支現在以相同方式計算成本 - [PR #26629](https://github.com/BerriAI/litellm/pull/26629)
- **每位成員的空值預算**
    - 具有 `max_budget=NULL` 的每位成員列會改為套用團隊強制執行 - [PR #26809](https://github.com/BerriAI/litellm/pull/26809)
- **Bedrock 1 小時快取寫入定價**
    - Claude 4.5 / 4.6 / 4.7 Global + US 項目新增 `cache_creation_input_token_cost_above_1hr`（原本低估約 60%） - [PR #26800](https://github.com/BerriAI/litellm/pull/26800)
- **`gpt-5.5-pro` 修正後的定價**
    - 原本重複計價 - [PR #26651](https://github.com/BerriAI/litellm/pull/26651)
- **Bedrock pass-through 串流中斷**
    - 當用戶端在串流中途中斷連線時，花費追蹤現在會刷新 - [PR #26719](https://github.com/BerriAI/litellm/pull/26719)

---

## MCP 閘道 {#mcp-gateway}

- **工具前綴**
    - 啟用選用的 `LITELLM_USE_SHORT_MCP_TOOL_PREFIX` 環境變數：將每個工具的前綴從人類可讀的伺服器名稱（`github_onprem-get_repo`）切換為一個由 `server_id`（`Xy7-get_repo`）衍生出的決定性 3 字元 base62 id。讓較長的伺服器名稱仍可維持在某些模型 API 強制的 60 字元工具名稱限制內 - [PR #26733](https://github.com/BerriAI/litellm/pull/26733)
- **OAuth**
    - 支援 Azure Entra 探索端點 - [PR #26584](https://github.com/BerriAI/litellm/pull/26584)
    - 請參閱 **重要行為變更**，了解公開路由偵測、OAuth 根端點可見性、OAuth metadata SSRF 防護欄，以及使用者範圍憑證加密。

---

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **[路由群組（每模型策略）](/docs/routing#routing-groups---per-model-strategies-and-callable-virtual-models)**
    - 新的 `router_settings.routing_groups` schema 會將一個 `model_name` 清單繫結到其專屬的 `routing_strategy` 與可選的 `routing_strategy_args`；未分組的模型會回退到頂層 `routing_strategy`（隱含的 `default` 群組，名稱保留）。每個 `model_name` 最多只能屬於一個群組；重疊時會在初始化時引發 `ValueError`。可透過 `Router.update_settings(routing_groups=[...])` 或 `/config/update` 在執行期間更新；每個群組的狀態會在更新時重建 - [PR #27022](https://github.com/BerriAI/litellm/pull/27022)
- **資料庫重新連線**
    - Prisma 重新連線不再阻塞 asyncio 事件迴圈。以 SIGTERM → 0.5 秒 sleep → SIGKILL → 全新 `Prisma()` + `connect()` 取代 `await self.db.disconnect()`（其會同步呼叫 `subprocess.Popen.wait()`，並在正式環境中讓迴圈凍結 30–120 秒以上，導致 K8s 存活探測失敗）。直接重新連線路徑會委派給 `recreate_prisma_client` - [PR #26225](https://github.com/BerriAI/litellm/pull/26225)
    - `call_with_db_reconnect_retry` 輔助函式集中處理重新連線並重試一次的模式。恢復 1.83.x 在 `PrismaClient.get_generic_data` 上遺失的自我修復（問題 [#25143](https://github.com/BerriAI/litellm/issues/25143)），並強化重新連線狀態機 - [PR #26756](https://github.com/BerriAI/litellm/pull/26756)
- **Redis IAM 權杖快取**
    - GCP IAM 權杖不再於每次 Redis 連線時重新產生；在正式環境的一段 28.4 秒 trace 中，單次 Redis `INCRBYFLOAT` 竟耗費 25.6 秒 - [PR #26441](https://github.com/BerriAI/litellm/pull/26441)
- **設定快取**
    - DualCache 設定參數讀取會被快取與批次處理。在 Docker 上端到端測試時，讀取負載從 2.8 q/s 降至 0.7 q/s；改善幅度會隨 pod 數量擴大。注意：設定編輯傳播到其他處所需時間會更長（直到快取失效為止） - [PR #26469](https://github.com/BerriAI/litellm/pull/26469)
- **記憶體占用**
    - 延遲載入的功能路由器 - [PR #26534](https://github.com/BerriAI/litellm/pull/26534)
    - 延遲載入的首頁 + openapi.json 移至 CI - [PR #26802](https://github.com/BerriAI/litellm/pull/26802)
- **連線層**
    - 在 aiohttp 的 `TCPConnector` 上支援可選的 TCP `SO_KEEPALIVE` - [PR #26730](https://github.com/BerriAI/litellm/pull/26730)
- **CLI**
    - 供 uvicorn worker 分流的 `--timeout_worker_healthcheck` 旗標（請參閱管理端點） - [PR #26622](https://github.com/BerriAI/litellm/pull/26622)
- **測試穩定性**
    - 將 `test_model_alias_map` ERROR 記錄斷言限制在 LiteLLM logger，以便 `asyncio` 記錄（例如 `Unclosed client session`）不再間歇性地使斷言失敗 - [PR #26741](https://github.com/BerriAI/litellm/pull/26741)
    - 以靜態原始碼掃描取代延遲載入 subprocess 啟動匯入 diff（約 13 秒，而不是逾兩分鐘後逾時） - [PR #26934](https://github.com/BerriAI/litellm/pull/26934)
    - 在 request-control 強化後，將模型存取 E2E 測試納入 `allow_client_mock_response: true` - [PR #26941](https://github.com/BerriAI/litellm/pull/26941)
- **驗證**
    - 在憑證輸入時驗證 AWS 區域名稱 - [PR #26906](https://github.com/BerriAI/litellm/pull/26906)
    - 從 `MILVUS_OPTIONAL_PARAMS` 移除不支援的 `dbName` 與 `partitionNames` - [PR #26910](https://github.com/BerriAI/litellm/pull/26910)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

- **CI / 工具鏈**
    - 支援 CircleCI「重新執行失敗的測試」用於 `local_testing_part1` / `local_testing_part2` / `litellm_router_testing` 作業（原本會收集 0 個項目 + exit 123） - [PR #26461](https://github.com/BerriAI/litellm/pull/26461)
    - 更正 `min-release-age` 檔案中的 `.npmrc` 值：移除 `d` 後綴，以避免 `npm install` 在 npm 11.x 搭配 `RangeError: Invalid time value` 時當機 - [PR #26850](https://github.com/BerriAI/litellm/pull/26850)
- **Pull request 範本**
    - 為內部貢獻者新增 Linear ticket 欄位 - [PR #26655](https://github.com/BerriAI/litellm/pull/26655)

---

## 新貢獻者 {#new-contributors}

- @xinrui-z 首次貢獻於 [#24294](https://github.com/BerriAI/litellm/pull/24294)
- @Jerry-SDE 首次貢獻於 [#25249](https://github.com/BerriAI/litellm/pull/25249)
- @Zerohertz 首次貢獻於 [#25888](https://github.com/BerriAI/litellm/pull/25888)
- @clyang 首次貢獻於 [#26011](https://github.com/BerriAI/litellm/pull/26011)
- @mverrilli 首次貢獻於 [#26122](https://github.com/BerriAI/litellm/pull/26122)
- @tuhinspatra 首次貢獻於 [#26262](https://github.com/BerriAI/litellm/pull/26262)
- @omriShukrun08 首次貢獻於 [#26605](https://github.com/BerriAI/litellm/pull/26605)
- @lmcdonald-godaddy 首次貢獻於 [#26651](https://github.com/BerriAI/litellm/pull/26651)
- @minznerjosh 首次貢獻於 [#26710](https://github.com/BerriAI/litellm/pull/26710)
- @yassinkortam 首次貢獻於 [#26730](https://github.com/BerriAI/litellm/pull/26730)
- @sruthi-sixt-26 首次貢獻於 [#26814](https://github.com/BerriAI/litellm/pull/26814)

**完整變更紀錄**：https://github.com/BerriAI/litellm/compare/v1.83.14-stable...v1.84.0

---

## 05/05/2026（`v1.84.0-rc.1`） {#05052026-v1840-rc1}

* 新模型 / 更新模型：19
* LLM API 端點：6
* 管理端點 / UI：22
* AI 整合（記錄 / 防護欄）：3
* 支出追蹤、預算與速率限制：5
* MCP 閘道：6
* 效能 / 負載平衡 / 可靠性改善：14
* 一般 Proxy 改善：2
* 文件更新：1

小計：78 個 PR

## 05/14/2026（`v1.84.0`，在 rc.1 之上之增量） {#05142026-v1840-delta-on-top-of-rc1}

* 強化：6
* 預算保留：2
* 健康探測：3
* MCP：2
* `SERVER_ROOT_PATH` 下的路由：1
* 標記與指標：2
* 封裝：2

小計：18 個 PR

總計：96 個 PR
