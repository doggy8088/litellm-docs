---
title: "v1.101.0 - 啟發式自動路由器、語意 MCP 工具搜尋與離峰定價"
slug: "v1-101-0"
date: 2026-09-14T00:00:00
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.101.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**MongoDB Vector Search 需要一個可選的 sidecar。** 現有設定必須提供 sidecar URL 和金鑰；請將 MongoDB 連線字串與 TLS 檔案移到 sidecar 中。PyMongo 不再安裝於 LiteLLM SDK extras 或映像檔中。請參閱[設定指南](../../docs/providers/mongodb_vector_stores)與[PR #40316](https://github.com/BerriAI/litellm/pull/40316)。

**預設情況下，相同後端的租戶 trace 目的地會覆蓋 operator 目的地。** 團隊設定的 tracing 現在會隨著模型呼叫接收請求 trace；請使用 `additive` 模式以保留 operator 副本。租戶 Langfuse 主機需要 operator allowlist。請參閱[PR #40321](https://github.com/BerriAI/litellm/pull/40321)。

**OpenAI WebSocket passthrough 路由預設為關閉。** `/openai_passthrough/*` 與 `/openai/*` WebSocket relay 會拒絕連線，直到在 YAML 中或透過 `POST /config/field/update` 設定 `general_settings.enable_openai_websocket_passthrough: true`；proxy 自身的 `/v1/realtime` 路由不受影響。請參閱[PR #39841](https://github.com/BerriAI/litellm/pull/39841)。

**只要設定了密碼，預設就會強制套用密碼政策。** `/user/update`、`/user/bulk_update` 與邀請權杖現在都需要 12 個字元，且包含大寫字母、小寫字母、數字與特殊字元。可透過 `general_settings.password_policy_min_length` 與 `password_policy_require_*` 切換來放寬；`disable_password_login_when_sso_enabled` 仍為選擇性啟用。請參閱[PR #39381](https://github.com/BerriAI/litellm/pull/39381)。

**非管理員的 agent 與 vector store 清單只會回傳已授權的資源。** `GET /v1/agents`、儀表板 agent 清單、MCP `agent_search` 與 `/vector_store/list` 現在對沒有授權的 key、team 與使用者回傳空清單，而不是像以前一樣回傳全部內容。請在 key、team 或使用者上授權 agent，並透過 `object_permission.vector_stores` 授權 vector store；對已命名的 agent 或 store 直接存取則不受影響。請參閱[PR #39636](https://github.com/BerriAI/litellm/pull/39636)、[PR #39612](https://github.com/BerriAI/litellm/pull/39612)。

**MCP token-exchange 與 ID-JAG 伺服器不再接受 LiteLLM virtual key 作為上游 subject token。** 只帶有 `Authorization: Bearer sk-...` 的請求現在會收到 401 challenge，而不是悄悄交換 gateway key；請將 virtual key 放在 `x-litellm-api-key`，並將 IdP token 放在 `Authorization`。請參閱[PR #39446](https://github.com/BerriAI/litellm/pull/39446)。

**多值 SSO role claim 會解析為最高權限的角色。** 在一般 OIDC、JWT access token、SAML 與 Entra `app_roles` 中，若提供者送出多個角色，使用者現在會取得最強的角色，並在下次登入時重新指派角色；升級前請檢查是否有提供者將無關的群組放入 role claim。請參閱[PR #39480](https://github.com/BerriAI/litellm/pull/39480)。

**缺少或空白 `groups` 陣列的 SCIM `PUT /Users` 不再移除團隊成員資格。** 依賴 `"groups": []` 將使用者從所有 team 移除的用戶端，必須對 `/scim/v2/Groups` 使用 PATCH 或 PUT；非空的 `groups` 仍會完整取代成員資格。請參閱[PR #39623](https://github.com/BerriAI/litellm/pull/39623)。

**`POST` 與 `PUT /v1/access_group` 會以 400 拒絕未知的 team id。** 解析不到任何 team 的 team id 以前會被靜默儲存；在其 team 尚未存在前就先建立存取群組的自動化流程，必須先建立這些 team。請參閱[PR #39218](https://github.com/BerriAI/litellm/pull/39218)。

**Shadow eval 重新命名其目標欄位與回應欄位。** `api_key_id` 欄位會變成 `target_id`，結果將 `keys` 重新命名為 `targets`、`api_key_id` 重新命名為 `target_id`、`key_alias` 重新命名為 `target_alias`，而 `by_key` slice 清單會改為每個目標各自的 `verdicts`。在 rolling deploy 期間，仍運行舊版建置的 pod 會暫停 shadow eval，直到重新啟動；推論、key 與預算不受影響。請參閱[PR #39015](https://github.com/BerriAI/litellm/pull/39015)。

**自動路由器的 tier 與分類器自訂會依 `auto_router` 授權功能計量。** 若沒有此功能，proxy 只能擁有一個 `heuristic_v2` router，以及一個具有 operator 定義 `tier_definitions` 或自訂 classifier prompt 的 router；超出限制的 config.yaml 會拒絕啟動，而 `/model/new` 會回傳 403。隨附的 prompt、rubric 預設值與 `tier_labels` 仍為免費。請參閱[PR #39468](https://github.com/BerriAI/litellm/pull/39468)、[PR #39674](https://github.com/BerriAI/litellm/pull/39674)。

**Azure Storage logging 只會使用部署所攜帶的身分進行驗證。** 無金鑰的憑證鏈不再會取得開發人員的 `az login` 或 LLM 的 `AZURE_CLIENT_SECRET`；Storage 的 service principal 必須透過 `AZURE_STORAGE_CLIENT_*` 設定，而且開發人員機器上的空白 storage credentials 現在會失敗，而不是寫入。請參閱[PR #39637](https://github.com/BerriAI/litellm/pull/39637)。

**Datadog LLM Observability 會將 tool call 移至 Datadog 自己的欄位，並在 redaction 下移除含 prompt 的 metadata。** 扁平化的 `input_tool_calls.*` 與 `output_tool_calls.*` metadata key 會被移除，而且在開啟訊息 redaction 時，tool 定義以及 `routing_decision`、`requester_metadata`、`prompt_management_metadata`、`mcp_tool_call_metadata`、`vector_store_request_metadata` 與 `guardrail_information` 記錄將不再送出；請重新指向建立於其上的已儲存檢視與 facet。請參閱[PR #39222](https://github.com/BerriAI/litellm/pull/39222)、[PR #39402](https://github.com/BerriAI/litellm/pull/39402)。

**`/v1/messages` 錯誤使用 Anthropic 的 `{"type": "error", "error": {...}}` 封套。** 在該路由上解析舊的 OpenAI 形狀錯誤本文的用戶端必須調整；狀態碼與訊息不變，官方 Anthropic SDK 不受影響，而在路由執行前拋出的錯誤仍會保留 OpenAI 封套。請參閱[PR #39037](https://github.com/BerriAI/litellm/pull/39037)。

**Headroom 壓縮請求預設在 60 秒後逾時。** `litellm_settings.request_timeout` 不再限制 `/v1/compress` 與 `/v1/retrieve`；請在 Headroom guardrail 的 `litellm_params` 中設定 `timeout`，以保持較低上限或允許較慢的服務。請參閱[PR #39527](https://github.com/BerriAI/litellm/pull/39527)。

**`fail_closed_budget_enforcement: true` 會根據最壞情況估算預先拒絕。** 接近上限的 key 現在會在輸入 token 加上 `max_tokens`（或 16K fallback）超過剩餘預算時收到 429，而不是像以前一樣以縮減後的保留量執行請求。未啟用此旗標的部署不受影響。請參閱[PR #39214](https://github.com/BerriAI/litellm/pull/39214)。

**含有 `sslmode=verify-ca`、`verify-full` 或 `sslrootcert` 的資料庫 URL 現在會進行驗證。** Prisma 會將這些靜默降級為 `prefer`；錯誤或無法讀取的 CA bundle 現在會在啟動時以 `P1011` 失敗，而 `verify-ca` 會執行完整鏈與主機名稱驗證。operator 鎖定的 `sslcert` 與 `sslaccept` 參數仍具有優先權。請參閱[PR #39563](https://github.com/BerriAI/litellm/pull/39563)。

**`max_idle_connection_lifetime` 在資料庫 URL 上預設為 60 秒。** 適用於 `DATABASE_URL`、`DIRECT_URL` 與 read replica，因此被 RDS 或 NLB 回收的閒置連線不會再以 `Error { kind: Closed }` 形式浮現；請將其鎖定在 URL 上或設定 `general_settings.database_max_idle_connection_lifetime` 以還原先前的 300 秒。請參閱[PR #39134](https://github.com/BerriAI/litellm/pull/39134)。

**Hide Secrets 預設會遮蔽較少內容。** base64 熵值門檻從 3.0 移至 4.5，且 OpenAI 偵測器只比對帶有數字的獨立 `sk-` token，因此熵值介於 3.0 與 4.5 之間的引號字串會通過；在 `detect_secrets_config` 中將 `Base64HighEntropyString` 設回 3.0 以維持原本的敏感度。請參閱 [PR #39879](https://github.com/BerriAI/litellm/pull/39879)。

**Model Armor 會拒絕無法組裝的串流，而不是將未掃描的串流往下傳遞。** 在 `/v1/chat/completions` 中，原本無法組裝的串流會被放行；現在會以該端點自身的錯誤格式遭到拒絕，而 `fail_on_error: false` 會恢復原本的轉送行為並附帶警告。請參閱 [PR #39181](https://github.com/BerriAI/litellm/pull/39181)。

**串流聊天與 `/v1/responses` 用量預設會帶上 `usage.cost`。** 最終的串流用量物件會新增一個 `cost` 欄位，且無法關閉；零成本與無法定價的回應不會標記任何內容，而每個 chunk 的成本注入仍維持在既有旗標之後。請參閱 [PR #39069](https://github.com/BerriAI/litellm/pull/39069)。

**xAI 請求會依 xAI 回報的成本計費。** 現在會計入伺服器端工具，例如 X search，且自訂價格的 Perplexity 部署會依營運者設定的價格計費，而不是依提供者的總額計費。請參閱 [PR #39441](https://github.com/BerriAI/litellm/pull/39441)。

**相容 OpenAI 的 embeddings 在用戶端未提供 `encoding_format` 時會省略它。** 回應仍會傳回浮點數，但 SDK 的 base64 傳輸壓縮已移除，且省略格式的請求在升級後會有一次無法命中 embedding 快取；請明確傳送 `encoding_format: base64` 以維持精簡傳輸。請參閱 [PR #38774](https://github.com/BerriAI/litellm/pull/38774)。

**`azure_ai/` 在 `.services.ai.azure.com` 主機上的部署會維持在 Foundry `/models` 路由。** 它們曾被悄悄重新分類為 `azure`，並以錯誤的成本對應表送往 Azure OpenAI deployments 路由；轉錄、語音與 realtime 仍會保留 Azure OpenAI 路由。請參閱 [PR #38975](https://github.com/BerriAI/litellm/pull/38975)。

**`/v1/models` 不再列出像 `bedrock/*` 這類萬用字元路由。** 傳入 `return_wildcard_routes=True` 即可將它們重新顯示。請參閱 [PR #31731](https://github.com/BerriAI/litellm/pull/31731)。

**`/v1/agents` 回應會遮蔽已儲存的認證。** Secret `litellm_params` 欄位對每位呼叫者都會回傳固定標記，包括管理員；一個回寫該標記的編輯會保留已儲存的值。請參閱 [PR #39389](https://github.com/BerriAI/litellm/pull/39389)。

**管理寫入的驗證更加嚴格。** 以名稱或別名鍵入、且被多個 MCP 伺服器共用的 `mcp_tool_permissions` 會被以 400 拒絕（既有列會持續運作，直到其工具清單被編輯），`/config/update` 會針對不是路由設定的鍵回傳 400，而不是靜默回傳 200，`/upload/logo` 需要 proxy admin 角色，且 `/v1/files` 會拒絕包含 `..` 的檔名。請參閱 [PR #39947](https://github.com/BerriAI/litellm/pull/39947)、[PR #39249](https://github.com/BerriAI/litellm/pull/39249)、[PR #39379](https://github.com/BerriAI/litellm/pull/39379)。

**`litellm[proxy-runtime]` 需要 pypdf 6.16.1 與 tornado 6.5.8 或更新版本。** 鎖定在這些下限以下的環境將無法解析。請參閱 [PR #39188](https://github.com/BerriAI/litellm/pull/39188)。

:::

## 主要亮點 {#key-highlights}

- **啟發式與混合式 auto-router 分類器** - `classifier_type: heuristic_v2` 會在本機選擇層級而不呼叫分類器，`hybrid` 只在接近層級邊界時才交由 LLM，`classification_mode: user_turn` 會對每次人類提問只分類一次，過大的提示詞會升級到具備足夠上下文視窗的層級，停滯的 agent 任務會自動升級，圖像請求會路由到具備視覺能力的層級，而 Configure automatically 動作會根據 proxy 已提供的模型填滿每個層級
- **MCP gateway：語意工具搜尋與完整目錄** - `mcp_tool_search` 會依 embedding 相似度對呼叫者已授權的工具排序，上游 `tools/list` 分頁會一路追蹤到最後一頁，一個 `x-mcp-<access_group>-*` 標頭涵蓋群組中的每個伺服器，ID-JAG 斷言會從儲存的 refresh token 重新整理，而 `pre_mcp_call` 防護欄會掃描並遮蔽工具呼叫引數
- **支出控制** - 以時間為基礎的離峰定價、最終串流用量區塊上的 `usage.cost`、跨複本強制執行的每模型預算、具異常偵測的每位使用者每日與每月 Slack 支出門檻、按用量單位彙總的防護欄成本，以及團隊中每位使用者在 `/team/spend/by_user` 上的支出
- **Proxy 強化** - 每個 worker 的准入控制會以立即的 503 回應超載情況、從自身程序提供的 Prometheus `/metrics`、可選 SSO-only 登入的預設密碼政策、受 grant 範圍限制的 agent 與向量儲存列示、資料庫 URL 上會遵守的 libpq TLS 參數，以及新的 Alice 防護欄
- **411 個新模型** - Anthropic、Bedrock、Vertex AI 與 Azure AI 的 day-0 `claude-fable-5-1`、OpenAI 與 Azure 上的 `gpt-6-astra`、Gemini 與 Vertex 上的 `gemini-3.8-flash`、Bedrock GovCloud Claude 與 Nova Sonic realtime、Cohere Parse OCR、160 個 OpenRouter 項目，以及 DashScope 上的 `qwencloud/` 與 `qwen_ai_platform/` 別名

## 已包含於 v1.101.0-rc.1 截止點之後 {#included-after-the-v11010-rc1-cut}

穩定版標籤包含這些 release-line 新增內容，包括 rc.2 之後的變更：

- **MongoDB Vector Search** 將資料庫連線移入可選 sidecar，從而移除 LiteLLM SDK extras 與映像中的 PyMongo。請參閱上方的升級說明 - [PR #40316](https://github.com/BerriAI/litellm/pull/40316)。
- **Tenant tracing** 會將 request trace 與 model call 路由到團隊設定的目的地；後續修補則恢復 Datadog auth spans 與 last-wins callback 認證合併 - [PR #40321](https://github.com/BerriAI/litellm/pull/40321)、[PR #40346](https://github.com/BerriAI/litellm/pull/40346)。
- **Team callback management** 讓團隊管理員可透過 callback API 讀取、新增與移除自己團隊的 callback，並在讀取時遮蔽認證 - [PR #40325](https://github.com/BerriAI/litellm/pull/40325)。
- **Dashboard dependencies** 升級至 Next.js 16.3.3 與 Vitest 4.1.11 - [PR #40324](https://github.com/BerriAI/litellm/pull/40324)。
- **Redis reliability** 會將 spend-counter 作業串流化、降低 circuit-breaker 拒絕的噪音、保護 breaker 復原，並新增 Redis-chaos load 資格驗證 - [PR #40886](https://github.com/BerriAI/litellm/pull/40886)。

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新提供者（3 個新提供者） {#new-providers-3-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [QwenCloud and Qianwen AI Platform](../../docs/providers/qwencloud) | `/chat/completions`、`/embeddings`、`/rerank`、`/images/generations` | 基於 DashScope 實作的 `qwencloud/`（國際版）與 `qwen_ai_platform/`（中國大陸）前綴，各有 45 個計價項目 |
| [MongoDB Vector Search (BETA)](../../docs/providers/mongodb_vector_stores) | `/v1/vector_stores/{id}/search`、帶有 `file_search` 的 `/v1/chat/completions` | 搜尋既有的 Atlas 或自行管理的 MongoDB 索引，並將擷取的文件作為聊天上下文。LiteLLM 不支援建立 collection/index 與文件匯入。 |
| [Alice](../../docs/proxy/guardrails/alice) | 防護欄（`pre_call`、`post_call`） | 防護欄提供者（原 ActiveFence），會強制執行 ALLOW、BLOCK、MASK 或 DETECT 判定，並依每個 virtual key 由應用程式選擇 | 

### 新增的 LLM API 端點（6 個新端點） {#new-llm-api-endpoints-6-new-endpoints}

| Endpoint | Method | Description | Documentation |
| --- | --- | --- | --- |
| `/v1/responses/input_tokens` | POST | 透過提供者自身的計數 API 計算 Responses API 請求的輸入 token，包含圖片與檔案 | [Responses API](../../docs/response_api) |
| `/team/spend/by_user` | GET | 團隊內每位使用者的花費，包含 JWT 流量，並可在 Team Usage 頁面下載 CSV | [Team Budgets](../../docs/proxy/team_budgets) |
| `/public/autorouter_presets` | GET | 在執行時提供自動路由器預設目錄，因此預設更新不需要重新建置儀表板 | [Auto Router](../../docs/proxy/auto_routing) |
| `/scim/v2/placeholders` and `/scim/v2/placeholders/{id}/merge` | GET, POST | 列出與真實帳號對應的 SCIM 佔位使用者，並將其中一個合併到該帳號上 | [SCIM](../../docs/tutorials/scim_litellm) |
| `/v2/organization/{organization_id}` | PATCH | 組織更新的 merge-patch（null 會清除，省略則保持不變），現在已發佈於 `/openapi.json` | [Organizations](../../docs/proxy/users) |
| `/gigachat/{endpoint}` | ANY | 原生 GigaChat API 轉送，含花費記錄 | [GigaChat](../../docs/providers/gigachat) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（411 個新模型） {#new-model-support-411-new-models}

| 提供者 | 模型 | Context Window | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `amazon.nova-2-sonic-v1:0` | - | $0.33 | $2.75 | 音訊輸入、音訊輸出 |
| Amazon Bedrock | `amazon.nova-sonic-v1:0` | - | $0.06 | $0.24 | 音訊輸入、音訊輸出 |
| Amazon Bedrock | `anthropic.claude-fable-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-opus-4-8` | 1M | $6.00 | $30.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-sonnet-5` | 1M | $2.40 | $12.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/nvidia.nemotron-nano-12b-v2` | 128K | $0.24 | $0.72 | 視覺 |
| Amazon Bedrock | `bedrock/us-gov-east-1/nvidia.nemotron-nano-3-30b` | 262K | $0.07 | $0.29 | 函式呼叫、工具選擇 |
| Amazon Bedrock | `bedrock/us-gov-east-1/nvidia.nemotron-super-3-120b` | 256K | $0.18 | $0.78 | 推理、函式呼叫、工具選擇 |
| Amazon Bedrock | `bedrock/us-gov-east-1/openai.gpt-oss-120b-1:0` | 128K | $0.18 | $0.72 | 推理、函式呼叫、工具選擇、回應結構 |
| Amazon Bedrock | `bedrock/us-gov-east-1/openai.gpt-oss-20b-1:0` | 128K | $0.08 | $0.36 | 推理、函式呼叫、工具選擇、回應結構 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-opus-4-8` | 1M | $6.00 | $30.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-sonnet-5` | 1M | $2.40 | $12.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/nvidia.nemotron-nano-12b-v2` | 128K | $0.24 | $0.72 | 視覺 |
| Amazon Bedrock | `bedrock/us-gov-west-1/nvidia.nemotron-nano-3-30b` | 262K | $0.07 | $0.29 | 函式呼叫、工具選擇 |
| Amazon Bedrock | `bedrock/us-gov-west-1/nvidia.nemotron-super-3-120b` | 256K | $0.18 | $0.78 | 推理、函式呼叫、工具選擇 |
| Amazon Bedrock | `bedrock/us-gov-west-1/openai.gpt-oss-120b-1:0` | 128K | $0.18 | $0.72 | 推理、函式呼叫、工具選擇、回應結構 |
| Amazon Bedrock | `bedrock/us-gov-west-1/openai.gpt-oss-20b-1:0` | 128K | $0.08 | $0.36 | 推理、函式呼叫、工具選擇、回應結構 |
| Amazon Bedrock | `bedrock_mantle/us-gov-east-1/openai.gpt-5.4` | 1.05M | $3.30 | $19.80 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構 |
| Amazon Bedrock | `bedrock_mantle/us-gov-west-1/openai.gpt-5.4` | 1.05M | $3.30 | $19.80 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構 |
| Amazon Bedrock | `bedrock_mantle/us-gov-west-1/openai.gpt-5.6-luna` | 1.05M | $0.26 | $1.58 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構 |
| Amazon Bedrock | `bedrock_mantle/us-gov-west-1/openai.gpt-5.6-terra` | 1.05M | $2.64 | $15.84 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構 |
| Amazon Bedrock | `bedrock_mantle/us-gov-west-1/xai.grok-4.3` | 131K | $1.50 | $3.00 | 推理、視覺、函式呼叫、工具選擇、回應結構 |
| Amazon Bedrock | `eu.anthropic.claude-fable-5-1` | 1M | $11.00 | $55.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-fable-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-opus-4-8` | 1M | $6.00 | $30.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-sonnet-5` | 1M | $2.40 | $12.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-fable-5-1` | 1M | $11.00 | $55.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Anthropic | `claude-fable-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Anthropic | `claude-mythos-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Azure AI Foundry | `azure_ai/Codestral-2501` | 256K | $0.30 | $0.90 | - |
| Azure AI Foundry | `azure_ai/Cohere-parse-v5` | - | - | - | OCR |
| Azure AI Foundry | `azure_ai/DeepSeek-V4-Flash-0731` | 1M | $0.44 | $1.32 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI Foundry | `azure_ai/FW-Nemotron-Lightning-3.5-30B-A3B` | 262K | $0.06 | $0.22 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI Foundry | `azure_ai/MAI-Thinking-1` | 256K | $2.00 | $8.00 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI Foundry | `azure_ai/claude-fable-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Azure AI Foundry | `azure_ai/grok-4.6` | 200K | $2.00 | $6.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋 |
| Azure AI Foundry | `azure_ai/kimi-k2.7-code` | 262K | $0.95 | $4.00 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI Foundry | `azure_ai/mistral-ocr-4-0` | - | - | - | OCR |
| Azure OpenAI | `azure/gpt-6-astra` | 922K | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入、電腦使用 |
| Azure OpenAI | `azure/gpt-realtime-2` | 32K | $4.00 | $24.00 | 函式呼叫、工具選擇、音訊輸入、音訊輸出 |
| Azure OpenAI | `azure/gpt-realtime-2.1` | 32K | $4.00 | $24.00 | 函式呼叫、工具選擇、音訊輸入、音訊輸出 |
| Azure OpenAI | `azure/gpt-realtime-2.1-mini` | 32K | $0.60 | $2.40 | 函式呼叫、工具選擇、音訊輸入、音訊輸出 |
| Azure OpenAI | `azure/us-gov/gpt-5.1` | 272K | $1.72 | $13.75 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入 |
| Azure OpenAI | `azure/us-gov/o3-mini` | 200K | $1.51 | $6.05 | 推理、工具選擇、提示快取、回應結構 |
| Azure OpenAI | `azure/us-gov/text-embedding-3-large` | 8K | $0.16 | $0.0000 | 嵌入 |
| Azure OpenAI | `azure/us-gov/text-embedding-3-small` | 8K | $0.02 | $0.0000 | 嵌入 |
| Azure OpenAI | `azure/us/gpt-6-astra` | 922K | $11.00 | $55.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入、電腦使用 |
| Baseten | `baseten/zai-org/GLM-5.3` | 1.04858M | $1.40 | $4.40 | 視覺、函式呼叫、工具選擇、提示快取、回應結構 |
| Cerebras | `cerebras/gemma-4-31b` | 131K | $0.99 | $1.49 | 推理、視覺、函式呼叫、工具選擇、回應結構 |
| Cloudflare Workers AI | `cloudflare/@cf/openai/whisper` | - | - | - | 轉錄 |
| Cloudflare Workers AI | `cloudflare/@cf/openai/whisper-large-v3-turbo` | - | - | - | 轉錄 |
| Cohere | `cohere/parse-v5.0` | - | - | - | OCR |
| ElevenLabs | `elevenlabs/scribe_v2` | - | - | - | 轉錄 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v4-flash-vision-exp` | 1.04858M | $0.22 | $0.66 | 視覺、函式呼叫、工具選擇 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/glm-5p3-flash` | 1.04858M | $0.15 | $0.50 | 視覺、函式呼叫、工具選擇、回應結構 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/inkling` | 1.04858M | $1.00 | $4.05 | 視覺、函式呼叫、工具選擇、回應結構 |
| Fireworks AI | `fireworks_ai/deepseek-v4-flash-vision-exp` | 1.04858M | $0.22 | $0.66 | 視覺、函式呼叫、工具選擇 |
| FriendliAI | `friendliai/zai-org/GLM-5.3` | 1.04858M | $1.26 | $3.96 | 推理、函式呼叫、工具選擇、提示快取、回應結構 |
| FriendliAI | `friendliai/zai-org/GLM-5.3-Flash` | 1.04858M | $0.15 | $0.50 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、影片輸入 |
| GigaChat | `gigachat/GigaChat-2` | 128K | $0.0000 | $0.0000 | 函式呼叫 |
| GigaChat | `gigachat/GigaEmbeddings-3B-2025-09` | 4K | $0.0000 | $0.0000 | 嵌入 |
| Google Gemini | `gemini/gemini-3.8-flash` | 1.04858M | $0.75 | $3.75 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、音訊輸入、影片輸入、PDF 輸入 |
| Google Gemini | `gemini/lyria-3.5-clip-preview` | 131K | $0.0000 | $0.0000 | 音訊輸出 |
| Google Gemini | `gemini/lyria-3.5-pro-preview` | 131K | $0.0000 | $0.0000 | 音訊輸出 |
| IBM watsonx | `watsonx/bigscience/mt0-xxl` | 4K | $1.91 | $1.91 | - |
| IBM watsonx | `watsonx/meta-llama/llama-4-maverick-17b-128e-instruct-fp8` | 131K | $0.37 | $1.48 | 函式呼叫 |

| Meta Llama API | `meta/muse-spark-1.3` | 1.04858M | $1.25 | $4.25 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入 |
| Meta Llama API | `meta/muse-spark-1.3-contributor` | 1.04858M | $0.10 | $0.20 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入 |
| OpenAI | `gpt-6-astra` | 922K | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入、電腦使用 |
| OpenAI | `gpt-daybreak-blue-latest` | 1.05M | $4.00 | $20.00 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入、電腦使用 |
| OpenAI | `gpt-daybreak-red-latest` | 400K | $12.50 | $75.00 | Responses API、推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、PDF 輸入、電腦使用 |
| Parallel AI | `parallel_ai/search-fast` | - | - | - | 搜尋 |
| Parallel AI | `parallel_ai/search-turbo` | - | - | - | 搜尋 |
| Scaleway | `scaleway/deepseek-v4-flash-0731` | 256K | $0.40 | $0.80 | 推理、函式呼叫、提示快取 |
| Scaleway | `scaleway/glm-5.2` | 256K | $1.80 | $5.50 | 推理、函式呼叫 |
| Together AI | `together_ai/Qwen/Qwen3.8-Flash` | 1M | $0.15 | $0.47 | - |
| Vertex AI | `gemini-3.8-flash` | 1.04858M | $0.75 | $3.75 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、音訊輸入、影片輸入、PDF 輸入 |
| Vertex AI | `vertex_ai/claude-fable-5-1` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Vertex AI | `vertex_ai/claude-fable-5-1@default` | 1M | $10.00 | $50.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、PDF 輸入、電腦使用 |
| Vertex AI | `vertex_ai/gemini-3.8-flash` | 1.04858M | $0.75 | $3.75 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋、音訊輸入、影片輸入、PDF 輸入 |
| Voyage AI | `voyage/rerank-3` | 32K | $0.05 | $0.0000 | 重新排序 |
| Voyage AI | `voyage/rerank-3-lite` | 32K | $0.02 | $0.0000 | 重新排序 |
| Z.AI | `zai/glm-5.2` | 1M | $1.40 | $4.40 | 推理、函式呼叫、工具選擇、提示快取 |
| xAI | `xai/grok-build-latest` | 500K | $2.00 | $6.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構、網頁搜尋 |

除了表格之外，其餘 327 筆條目來自批次登錄作業：160 筆 OpenRouter 條目，以及來自已驗證登錄稽核的 Perplexity Agent API（29）、Nebius Token Factory（27）與 Databricks（21）目錄（[PR #39388](https://github.com/BerriAI/litellm/pull/39388)），還有新 `qwencloud/` 與 `qwen_ai_platform/` 前綴下各 45 筆條目，對應 DashScope 目錄（[PR #39149](https://github.com/BerriAI/litellm/pull/39149)）。

移除了 1 筆條目：`gigachat/GigaChat-2-Lite` 重新命名為 `gigachat/GigaChat-2`，以追蹤即時的 GigaChat 清單，因此仍指向舊鍵的設定會失去其成本對映中繼資料（[PR #38913](https://github.com/BerriAI/litellm/pull/38913)）。

這次維護作業影響了 306 筆既有條目，集中在 OpenRouter（49）、OpenAI（39）、Nebius（30）、Azure AI（27）與 Databricks（22）：155 筆條目的 `source` URL 已更新，69 筆輸出與 66 筆輸入價格已修正，37 筆快取讀取費率與 33 筆淘汰日期已新增或修正，且約 40 筆條目的內容或輸出限制已修正。值得注意的價格變動：Azure AI `deepseek-v4-flash-0731` 上漲超過一倍至每 1M 為 $0.44 / $1.32，`gpt-realtime-2` 文字輸出從 $16 調升至 $24，`mistral/mistral-medium` 調整為 Medium 3.5 費率（$1.50 / $7.50），GPT-5.4 到 5.6 的 flex 與 priority prompts 在 272k tokens 以上依長上下文費率計費，且 GovCloud Claude 條目的計費比商業費率高 20%（[PR #39170](https://github.com/BerriAI/litellm/pull/39170)、[PR #39388](https://github.com/BerriAI/litellm/pull/39388)、[PR #38990](https://github.com/BerriAI/litellm/pull/38990)、[PR #38801](https://github.com/BerriAI/litellm/pull/38801)）。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 Anthropic、Bedrock、Vertex AI 與 Azure AI 上新增 `claude-fable-5-1` 的 day-0 定價與中繼資料，接受 `reasoning_effort`，快取讀取定價為 $0.25/MTok，且在 `drop_params` 下強制 `tool_choice` 會回傳清楚的 400，或降級為 `auto` - [PR #39148](https://github.com/BerriAI/litellm/pull/39148)
- **[OpenAI](../../docs/providers/openai)**
    - 為 `gpt-6-astra` 新增 day-0 定價與中繼資料，涵蓋標準、flex、priority、batch 以及高於 272K 的費率，並包含其從 `low` 到 `max` 的 reasoning effort 等級 - [PR #39622](https://github.com/BerriAI/litellm/pull/39622)
    - 透過 workload identity federation 支援無金鑰 OpenAI 驗證：設定 `OPENAI_IDENTITY_PROVIDER_ID`、`OPENAI_SERVICE_ACCOUNT_ID` 與 `OPENAI_IDENTITY_TOKEN_FILE`，proxy 會在 `auth.openai.com` 將 OIDC token 交換成可自動重新整理的 bearer，適用於 chat、embeddings、images、audio、moderations 與 responses - [PR #38995](https://github.com/BerriAI/litellm/pull/38995)
- **[Azure](../../docs/providers/azure)**
    - 新增 `azure/gpt-6-astra` 與 `azure/us/gpt-6-astra` Foundry 定價，包含長上下文與快取費率，並讀取 `azure/` 條目中的 `reasoning_effort: none` 閘道，使具有 `/v1/responses` 與 `none` 再加上 temperature 的請求不再回傳 400 - [PR #39827](https://github.com/BerriAI/litellm/pull/39827)
- **[Azure AI Foundry](../../docs/providers/azure_ai)**
    - 為 `azure_ai/grok-4.6` 新增 day-0 定價與中繼資料（200k context、128k output、`supports_tool_choice`），讓支出不再記錄為 $0，且 `tool_choice` 可到達 Foundry - [PR #39426](https://github.com/BerriAI/litellm/pull/39426)
    - 新增 `azure_ai/DeepSeek-V4-Flash-0731` 定價與中繼資料，以其 Foundry catalog id 為鍵，使 `/model/deprecations` 顯示其 2026-12-03 退役時間 - [PR #39023](https://github.com/BerriAI/litellm/pull/39023)、[PR #39341](https://github.com/BerriAI/litellm/pull/39341)
- **[Google Gemini](../../docs/providers/gemini)**
    - 在 `gemini/` 與 `vertex_ai/` 上，為 `gemini-3.8-flash` 新增 day-0 定價與中繼資料，價格為每 1M tokens 輸入 $0.75、輸出 $3.75，並包含 1M context、64k output、thinking、快取與 batch 標記 - [PR #39340](https://github.com/BerriAI/litellm/pull/39340)
- **[Dashscope](../../docs/providers/dashscope)**
    - 將 `qwencloud/` 與 `qwen_ai_platform/` 新增為 DashScope 的別名，分別預設為國際與中國大陸主機，品牌環境變數優先，且仍接受 `DASHSCOPE_API_KEY` - [PR #39149](https://github.com/BerriAI/litellm/pull/39149)
- **[FriendliAI](../../docs/providers/friendliai)**
    - 為 `friendliai/zai-org/GLM-5.3` 與 `friendliai/zai-org/GLM-5.3-Flash` 新增 day-0 定價與中繼資料，具 1M token 上限、提示快取費率，以及 `low`/`high`/`max` reasoning effort 等級 - [PR #38880](https://github.com/BerriAI/litellm/pull/38880)、[PR #38881](https://github.com/BerriAI/litellm/pull/38881)
- **[Meta](../../docs/providers/meta)**
    - 為 `meta/muse-spark-1.3` 與 `meta/muse-spark-1.3-contributor` 新增 day-0 定價與中繼資料，共享 1.2 等級的費率、context window 與功能 - [PR #39417](https://github.com/BerriAI/litellm/pull/39417)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 在 Converse 請求中一次送出 `guardrailConfig`、`performanceConfig` 與 `serviceTier`，而不是另外在 `inferenceConfig` 內巢狀放入一份無效的副本 - [PR #38993](https://github.com/BerriAI/litellm/pull/38993)
    - 僅在 `AWS_BEARER_TOKEN_BEDROCK` 上提供 Bedrock：當缺少 SigV4 憑證時，Converse 不再當機；當設定了 bearer token 或 `api_key` 時會跳過憑證鏈，因此沒有 `botocore[crt]` 的 `login_session` 設定檔不再讓 chat、embedding、image 與 guardrail 請求變成 500 - [PR #39166](https://github.com/BerriAI/litellm/pull/39166), [PR #39411](https://github.com/BerriAI/litellm/pull/39411)
    - 將原生結構化輸出（`output_config.format`）轉送到支援它們的模型之 Invoke，而不是悄悄內嵌 schema，對內嵌回退發出警告，並停止 Claude 5 Bedrock 項目宣稱支援原生功能，讓 `json_schema` 請求不再變成 400 - [PR #39070](https://github.com/BerriAI/litellm/pull/39070)
    - 依據成本對應表的 `supports_prompt_caching`，對 Converse `cachePoint` 的發送進行控管，因此 Claude Code `cache_control` 標記不再在像 Nemotron 這類不支援快取的模型上回傳 403，而支援快取的模型仍可快取 - [PR #39210](https://github.com/BerriAI/litellm/pull/39210)
    - 在建立 Converse 請求前移除 `client_metadata`，因此在 Claude、Nova 與 Llama 4 上開啟的 Codex CLI 不再因 `client_metadata: Extra inputs are not permitted` 而失敗 - [PR #35967](https://github.com/BerriAI/litellm/pull/35967)
    - 呈現 Nova Sonic 使用者逐字稿、`speech_started`/`speech_stopped` 事件，以及每個回應的真實用量，在 `/v1/realtime` 上每個回應只發出一次 `response.created`，記錄工作階段花費，並新增 Nova Sonic 與 Nova 2 Sonic 定價 - [PR #38597](https://github.com/BerriAI/litellm/pull/38597)
    - 遵循自訂 Mantle 主機：只有完全相符的 `bedrock-mantle.<region>.api.aws` 主機會被重寫為公開端點，而 `bedrock/mantle/*` 部署會在 `/v1/messages` 和 chat URL 上回退到 `BEDROCK_MANTLE_API_BASE`，就像 `bedrock_mantle/*` 已經做的那樣 - [PR #39361](https://github.com/BerriAI/litellm/pull/39361), [PR #39364](https://github.com/BerriAI/litellm/pull/39364)
    - 將每個請求的 `aws_role_name`、`aws_session_name` 與部署層級靜態 AWS 金鑰帶入 Bedrock Mantle chat completions 的 SigV4 簽章，與 `/v1/responses` 已經做的方式一致 - [PR #39362](https://github.com/BerriAI/litellm/pull/39362)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將舊版 `thinking: {"type": "enabled", "budget_tokens": N}` 升級為 `thinking: {"type": "adaptive"}`，並在僅支援 adaptive 的 Claude 模型（Opus 4.7 與 4.8、Sonnet 5、Fable 5）上加入衍生的 `output_config.effort`，適用於 chat、Bedrock Converse、Invoke、Vertex AI、Databricks 與 Azure AI Foundry - [PR #39159](https://github.com/BerriAI/litellm/pull/39159)
    - 修正 Vertex AI 與 Bedrock 上 `claude-fable-5-1` 的 `response_format` 400 錯誤：對標記為 `supports_forced_tool_use: false` 的模型，使用 JSON tool 回退而不強制 `tool_choice` - [PR #39184](https://github.com/BerriAI/litellm/pull/39184)
    - 絕不在翻譯過的 thinking 區塊上攜帶 `cache_control`，因此重放的 Claude Code 回合不再因 `content.0.thinking.cache_control: Extra inputs are not permitted` 而失敗 - [PR #39815](https://github.com/BerriAI/litellm/pull/39815)
- **[OpenAI](../../docs/providers/openai)**
    - 在 OpenAI 與 Azure 設定中，將 `gpt-6` 名稱視為 gpt-5 請求家族，因此 `reasoning_effort`、`max_tokens` 與 function tools 可在 `gpt-6-astra` 上運作，且 `temperature` 會從 Responses 與 Messages 中移除 - [PR #39631](https://github.com/BerriAI/litellm/pull/39631)
    - 展平傳給 `api.openai.com` 的 chat completions 中頂層 `anyOf`/`oneOf`/`allOf` tool schema 組合器，與先前的 Responses 修正一致 - [PR #38839](https://github.com/BerriAI/litellm/pull/38839)
    - 當 chat completions 請求不含 `tools` 或 `functions` 時，移除 `tool_choice`，因此 Pi coding agent `/compact` 與其備援重試不再變成 400 - [PR #39147](https://github.com/BerriAI/litellm/pull/39147)
    - 將 `reasoning_effort` 傳遞給未知的 `openai/` 模型名稱，而不是在 SDK 中失敗關閉，因此由 reasoning 模型支援的 proxy 別名可接受它，而已知的 OpenAI 模型仍保留用戶端驗證 - [PR #39065](https://github.com/BerriAI/litellm/pull/39065)
    - 在 PrivateLink（`<region>.privatelink.api.openai.com`）與區域性 `api.openai.com` 主機上預設啟用串流用量，因此那裡的 SDK 串流會回報 OpenAI 自身的 reasoning 與快取 token，而不是低估的本機用量 - [PR #39614](https://github.com/BerriAI/litellm/pull/39614)
    - 為 PrivateLink 與區域性 `*.api.openai.com` 主機簽發工作負載身分 token，而不只限於 `api.openai.com`；同時，純文字 `http://` 與相似外觀的主機仍不會取得 token - [PR #39652](https://github.com/BerriAI/litellm/pull/39652)
- **[Azure](../../docs/providers/azure)**
    - 在 Azure chat completions 與 `/v1/messages` 上，展平頂層 `anyOf`/`oneOf`/`allOf` tool schema 組合器，而啟用 reasoning 的 gpt-5.4+ 請求則透過 Responses 橋接保留聯集 - [PR #38870](https://github.com/BerriAI/litellm/pull/38870)
- **[Azure AI Foundry](../../docs/providers/azure_ai)**
    - 將 `azure_ai/` 部署在 `.services.ai.azure.com` 主機上維持分類為 `azure_ai`，因此它們會路由到 Foundry 的 `/models` 端點、依據 `azure_ai/` 成本對應表計價，並停止記錄多餘的 `base_model` 警告 - [PR #38975](https://github.com/BerriAI/litellm/pull/38975)
- **[Google Gemini](../../docs/providers/gemini)**
    - 當 `thinking: {"type": "enabled"}` 在 Gemini 3 模型上省略 `budget_tokens` 時，預設回傳 thinking 內容，對應到 `includeThoughts: true`，除非 `budget_tokens` 明確設為 0 - [PR #39160](https://github.com/BerriAI/litellm/pull/39160)
- **[Vertex AI](../../docs/providers/vertex)**
    - 將預設 `projects/{project}/locations/{location}/publishers/google/models/{model}` 路徑 graft 到其路徑僅為 `api_base` 或 `/v1` 的 `/v1beta1` 上，因此那些基底不再回傳 404 - [PR #38986](https://github.com/BerriAI/litellm/pull/38986)
- **[Databricks](../../docs/providers/databricks)**
    - 從外送訊息中移除 `thinking_blocks`、`reasoning_content` 與 `provider_specific_fields`，因此在 `databricks/databricks-claude-*` 上進行 Claude Code thinking 工作階段的第二輪不再因 `messages.N.thinking_blocks: Extra inputs are not permitted` 而失敗 - [PR #39409](https://github.com/BerriAI/litellm/pull/39409)
- **[Snowflake](../../docs/providers/snowflake)**
    - 標準化 Cortex Claude 請求形狀：保留帶有 Cortex 固定 TTL 的系統快取區塊，將圖片與工具結果轉換為原生 Anthropic 區塊，依能力控管 adaptive thinking，每個串流呼叫只發出一次工具身分，並回傳快取用量與 thinking 區塊 - [PR #39453](https://github.com/BerriAI/litellm/pull/39453)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 透過先檢查 `accounts/fireworks/models/` 成本對應表鍵，解決像 `fireworks_ai/deepseek-v4-pro-0813` 這類短模型名稱的 `tool_choice` 與 reasoning 支援問題，因此 opencode 工具呼叫不再變成 400 - [PR #39763](https://github.com/BerriAI/litellm/pull/39763)
- **[Ollama](../../docs/providers/ollama)**
    - 當 `ollama_chat` 在 done 區塊之前串流工具呼叫時，標記 `finish_reason: tool_calls`，因此 `/v1/messages` 會以 `stop_reason: tool_use` 結束，而 Claude Code 會執行該工具 - [PR #39010](https://github.com/BerriAI/litellm/pull/39010)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增 `POST /v1/responses/input_tokens`，透過提供者自身的計數 API 進行計數（包含圖片、內嵌檔案與多輪輸入），並回傳 OpenAI 完全相同的回應與 400 形狀 - [PR #38997](https://github.com/BerriAI/litellm/pull/38997)
    - 將 `/v1/responses` 原生轉送至設定 `model_info.supported_endpoints: ["/v1/responses"]` 的 OpenAI 相容部署上的 `{api_base}/responses`，讓 `previous_response_id` 與其他僅限 Responses 的欄位可送達伺服器，而不是在 chat completions 橋接中遺失 - [PR #39725](https://github.com/BerriAI/litellm/pull/39725)
- **[/v1/messages](../../docs/anthropic_unified)**
    - Anthropic 防護欄拒絕時改為備援：帶有 `stop_reason: "refusal"` 的 `/v1/messages` 回應現在會進入內容政策備援鏈，包含串流，因此位於自動路由器後方的 Claude Code 工作階段會在設定的備援上恢復，而不是直接失敗 - [PR #39157](https://github.com/BerriAI/litellm/pull/39157)
- **[Batches](../../docs/batches)**
    - 對提供者格式的 batch ids 強制執行團隊隔離：在另一個團隊的 batch 上進行取得、取消，以及輸出或錯誤檔案讀取現在會回傳 403，而沒有擁有權資料列的 ids 則會持續通過 - [PR #33536](https://github.com/BerriAI/litellm/pull/33536)
- **[Vector Stores](../../docs/completion/knowledgebase)**
    - 新增 **MongoDB Vector Search (BETA)**：透過 Admin UI、組態檔或管理 API 註冊既有的 Atlas 或自架索引，接著直接搜尋或在 chat completions 中使用 `file_search`。查詢嵌入模型必須與已儲存的向量一致。請參閱 [設定指南](../../docs/providers/mongodb_vector_stores)、[chat-completions 範例](../../docs/providers/mongodb_vector_stores#use-mongodb-in-chat-completions) 與 [sample-document 教學](../../docs/tutorials/mongodb_vector_search) - [PR #39811](https://github.com/BerriAI/litellm/pull/39811), [PR #39994](https://github.com/BerriAI/litellm/pull/39994)
- **OCR**
    - 在 `/v1/ocr` 上為 `cohere/parse-v5.0` 與 Azure AI Foundry `Cohere-parse-v5` 部署新增 Cohere Parse，以每頁 $0.0015 計費，且健康檢查會以各 OCR 部署的提供者可接受文件進行探測 - [PR #39862](https://github.com/BerriAI/litellm/pull/39862)
- **代理程式與 A2A**
    - 從 A2A `message.contextId` 推導 AgentCore 執行階段 session id，並以前綴為呼叫 key 的雜湊值，如此代理程式可依 `contextId` 保留對話上下文，而且各個 keys 永不共享 session；33 到 256 字元之外的 ids 會回傳 JSON-RPC `-32602` 400 - [PR #39371](https://github.com/BerriAI/litellm/pull/39371)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 在重播的 `function_call` 輸入項目上的對象 `arguments` 進行 JSON 編碼，讓上游模型取得有效的 JSON，而不是 Python dict repr - [PR #35417](https://github.com/BerriAI/litellm/pull/35417)
    - 為由 Claude 備援服務的工具呼叫提供 `fc_` 和 `ctc_` 形狀的項目 id，並保留原始 `call_id`；在對 OpenAI 的請求中捨棄外部項目 id，並停止輸出 null-text 訊息項目，讓 gpt-5 到 claude 備援對話可重播至任一模型 - [PR #39144](https://github.com/BerriAI/litellm/pull/39144)
    - 對每個串流事件加密回應 id，包括 `response.queued`，讓背景串流回應不再能被其他金鑰讀取或取消 - [PR #39534](https://github.com/BerriAI/litellm/pull/39534)
    - 在傳送給提供者之前，先解碼 JSON 字串的工具 `parameters` 結構描述，並拒絕任何無法解析為物件的內容，回傳 400 並命名 `tools[i].parameters` - [PR #39844](https://github.com/BerriAI/litellm/pull/39844)
    - 將未設定 `reasoning_effort` 的 gpt-5.4+ 工具呼叫，在任何 `api.openai.com` 子網域上橋接到 `/v1/responses`，讓 PrivateLink 主機在 Chat Completions 上不再得到 400 - [PR #39587](https://github.com/BerriAI/litellm/pull/39587)
    - 在串流 `/v1/responses` 上於伺服器端解析 Headroom `headroom_retrieve` 呼叫，並將壓縮後的輸入寫回 `input`，讓用戶端取得文字差異而不是原始工具呼叫，且壓縮不再默默無作為 - [PR #38808](https://github.com/BerriAI/litellm/pull/38808)
    - 停止在非 `bedrock_mantle` `/v1/responses` 請求上丟棄 `web_search` 工具，並將 GPT-5.4、5.5 和 5.6 Mantle 項目標記為支援網路搜尋，讓回應能帶有 `url_citation` 註解並基於內容 - [PR #35987](https://github.com/BerriAI/litellm/pull/35987)
- **[/v1/messages](../../docs/anthropic_unified)**
    - 回報串流 `message_start` 上請求的模型，而不是上游部署名稱，以符合非串流回應，讓 Claude Code 工作階段能在別名上恢復；`return_raw_model_name` 仍會選擇退出 - [PR #35816](https://github.com/BerriAI/litellm/pull/35816)
    - 當用戶端在串流中途中斷連線時，以分離的 pump 排空上游串流，讓中斷的 Bedrock `/v1/messages` 串流按 AWS 實際收取的輸出 token 計費，而不是用戶端讀取到的少量區塊 - [PR #36008](https://github.com/BerriAI/litellm/pull/36008)
    - 在 `/v1/messages` 錯誤時回傳 Anthropic 的 `{"type": "error", "error": {...}}` 封套，並將類型對應自狀態碼，而不是回傳帶有 `"None"` 字串的 OpenAI 封套 - [PR #39037](https://github.com/BerriAI/litellm/pull/39037)
    - 在非 Anthropic 的 `/v1/messages` 轉送上移除 `cache_control.ttl`，讓使用 1 小時提示快取的 Claude Code 不再因為拒絕它的提供者而得到 400；上游若支援 `ttl`，可透過 `model_info.cache_control_ttl: true` 選擇加入 - [PR #39355](https://github.com/BerriAI/litellm/pull/39355)
- **[Batches](../../docs/batches)**
    - 為從模型編碼的檔案 id、`model` 參數或 `?provider=` 建立的批次註冊擁有權，讓它們能顯示在建立它們的金鑰的 `GET /v1/batches` 中 - [PR #39810](https://github.com/BerriAI/litellm/pull/39810)
    - 在 Bedrock files 和 batches 憑證載入中轉送 `aws_external_id`，讓信任政策要求 `sts:ExternalId` 的角色在 `/v1/files` 上傳時不再失敗於 AssumeRole - [PR #39066](https://github.com/BerriAI/litellm/pull/39066)
- **[Files](../../docs/files_endpoints)**
    - 對每個 `/v1/files` 用途新增 `general_settings.max_file_size_mb` 和 `blocked_file_extensions` 檢查，拒絕帶有 `..` 的檔名，並要求 `PROXY_ADMIN` 用於 `/upload/logo` - [PR #39379](https://github.com/BerriAI/litellm/pull/39379)
- **[Images](../../docs/image_generation)**
    - 將 `n` 等數值型 multipart 欄位在 `/v1/images/edits` 上解析回數字，讓 Bedrock Nova Canvas 不再因為字串 `numberOfImages` 而拒絕 `n=2` - [PR #39510](https://github.com/BerriAI/litellm/pull/39510), [PR #39780](https://github.com/BerriAI/litellm/pull/39780)
    - 為 OpenAI 和 Azure 上的 gpt-image 模型轉送 `background`、`output_format`、`moderation` 和 `output_compression`，並在回應中保留提供者回顯的 `background`、`size`、`quality` 和 `output_format` - [PR #39525](https://github.com/BerriAI/litellm/pull/39525)
- **[Realtime](../../docs/realtime)**
    - 在 `/v1/realtime/client_secrets` 上將 `session.model` 重寫為路由後的部署，讓為別名模型群組鑄造的暫時金鑰能在 `/v1/realtime/calls` 上連線，而不會因模型不符 400 而失敗 - [PR #36811](https://github.com/BerriAI/litellm/pull/36811)
    - 將上游 websocket 拒絕或關閉轉送給用戶端為 `error` 事件，再加上帶有上游代碼與原因的關閉，將其記錄為失敗而不是 $0 成功，並釋放呼叫前的預算保留 - [PR #39851](https://github.com/BerriAI/litellm/pull/39851)
- **[Speech](../../docs/text_to_speech)**
    - 當 Gemini TTS `/v1/audio/speech` 請求帶有 `response_format` 時，停止回傳 500；`pcm` 現在以 `audio/pcm` 回傳原始 PCM16，`wav` 保留 WAV 包裝，而 `mp3`、`flac`、`opus` 和 `aac` 會得到一個列出支援格式的 400，適用於 Gemini 和 Vertex AI - [PR #38819](https://github.com/BerriAI/litellm/pull/38819), [PR #38868](https://github.com/BerriAI/litellm/pull/38868)
- **Embeddings**
    - 當用戶端未提供時，在 OpenAI 相容的 embedding 呼叫上省略 `encoding_format`，讓串接的代理與拒絕該參數的提供者不再回傳 400；明確值、模型設定與環境變數仍會轉送 - [PR #38774](https://github.com/BerriAI/litellm/pull/38774)
- **[Rerank](../../docs/rerank)**
    - 在同步與非同步路徑上，使用已解析的提供者來對應 rerank 錯誤，讓訊息顯示為 `DashscopeException - ...` 而不是 `None - `，且 `arerank` 會拋出 litellm 例外，而不是原始提供者類別 - [PR #39176](https://github.com/BerriAI/litellm/pull/39176)
    - 在 `hosted_vllm` rerank 請求上轉送 `truncate_prompt_tokens`、`truncation_side`、`max_tokens_per_query` 和 `max_tokens_per_doc`，並以 400 拒絕無效值，同時命名欄位 - [PR #39363](https://github.com/BerriAI/litellm/pull/39363)
- **[Search](../../docs/search)**
    - 將 search tool 設定的 `litellm_params`（`mode`、`max_results`、...）透過路由器傳遞，將 Parallel AI 篩選器巢狀放在 `advanced_settings` 下，保留回應中的 `search_id` 和 `excerpts`，並依公開價格按模式層級向 Parallel 計費 - [PR #37883](https://github.com/BerriAI/litellm/pull/37883)
    - 在任何提供者被呼叫之前，先拒絕缺少或格式錯誤的明確 `search_tool_name`，然後在同一版釋出中回復，因為沒有路由器的 SDK 呼叫端每個請求都失敗；自 v1.100 起，靜默備援維持不變 - [PR #38113](https://github.com/BerriAI/litellm/pull/38113), [PR #39146](https://github.com/BerriAI/litellm/pull/39146)
- **[Vector Stores](../../docs/completion/knowledgebase)**
    - 將 Router 傳入 S3 Vectors 的搜尋階段 embedding，讓虛擬模型名稱得以解析，讓儲存的設定保留在 `/v1/rag/query` 上而不是以 `aws_region_name is required` 失敗，並在 UI 中顯示後端搜尋錯誤，而不是「找不到結果」 - [PR #34788](https://github.com/BerriAI/litellm/pull/34788)
    - 透過 Router 逐請求解析 vector store embedding 憑證，讓僅有 Router 別名作為 `litellm_embedding_model` 時可在 Milvus、Valkey 和 Azure AI Search 的搜尋與聊天擷取上運作；`litellm_embedding_config` 現在是選用項目 - [PR #38936](https://github.com/BerriAI/litellm/pull/38936)
    - 將受管理儲存的 `api_key`、`api_base`，以及像 Milvus `outputFields` 這類提供者額外資訊，轉送給 `/v1/rag/query` 搜尋呼叫，讓受管理的 Milvus 儲存不再以 `MILVUS_API_KEY is not set` 失敗 - [PR #39452](https://github.com/BerriAI/litellm/pull/39452)

- 透過共用的向量儲存執行器，連同呼叫者的團隊與金鑰中繼資料來嵌入 S3 Vectors 搜尋請求，讓查詢嵌入顯示在團隊的支出記錄中 - [PR #39474](https://github.com/BerriAI/litellm/pull/39474)
    - 在聊天完成回呼中，當一個 `vector_store_ids` 搜尋失敗時，保留每個可達儲存的內容，於各儲存之間串接內容，並在警告中標示失敗的 `vector_store_id` - [PR #39495](https://github.com/BerriAI/litellm/pull/39495)
    - 對於非管理員金鑰與儀表板工作階段，只列出呼叫者在 `/vector_store/list` 上獲授權的向量儲存；未設定範圍的儲存現在需要金鑰或團隊上的 `object_permission.vector_stores` 授權 - [PR #39612](https://github.com/BerriAI/litellm/pull/39612)
- **OCR**
    - 停止對 `vertex_ai/deepseek-ai/deepseek-ocr-maas` 重複前置 `deepseek-ai/` 兩次，如此成本對應名稱會回傳 OCR 輸出，而不是 Vertex 的「Malformed publisher model」400 - [PR #39194](https://github.com/BerriAI/litellm/pull/39194)
- **Containers**
    - 透過由 `model` 指定名稱的 `model_list` 部署來路由 container create 與 list，因此沒有全域 `OPENAI_API_KEY` 的團隊不再收到 `Bearer None` 401，並從非同步 create 回傳受管理的 `cntr_` ids - [PR #39220](https://github.com/BerriAI/litellm/pull/39220)
    - 在 container 路由上傳遞上游錯誤狀態（已刪除的 container 會回傳 OpenAI 的 404 而不是 500），並在 `GET /v1/containers` 與檔案 list 上轉送 `limit`、`order` 與 `after` - [PR #39464](https://github.com/BerriAI/litellm/pull/39464)
- **代理程式與 A2A**
    - 從每個 `/v1/agents` 回應中遮蔽機密 `litellm_params` 欄位，例如 `aws_secret_access_key`，即使是管理員也一樣；而會回顯標記的編輯會保留儲存值 - [PR #39389](https://github.com/BerriAI/litellm/pull/39389)
    - 除非金鑰、團隊或使用者已獲授權，否則在 `GET /v1/agents`、儀表板與 MCP `agent_search` 中隱藏非管理員清單中的 agents；直接存取具名 agent 則維持不變 - [PR #39636](https://github.com/BerriAI/litellm/pull/39636)
    - 在發布另一個 agent 時，保留先前已發布的 agents 於 `public_agent_groups` 中，因此第二次 `make_public` 不再會在未實際發布任何內容的情況下回傳 200 - [PR #39554](https://github.com/BerriAI/litellm/pull/39554)
- **穿透式端點**
    - 新增原生 `/gigachat/{endpoint}` passthrough 路由並支援支出記錄，如此 GigaChat-native tools 就能使用 gateway；在設定中註冊模型即可取得 token accounting - [PR #38913](https://github.com/BerriAI/litellm/pull/38913)
    - 除非已設定 `general_settings.enable_openai_websocket_passthrough: true`，否則關閉 `/openai_passthrough/*` 與 `/openai/*` WebSocket relay；啟用後，若識別身分在任何層級帶有 model restriction，則拒絕該識別身分 - [PR #39841](https://github.com/BerriAI/litellm/pull/39841)
    - 在 Vertex passthrough count-tokens 路由上移除 `anthropic-beta`，如此 Vertex 模式下的 Claude Code 在 Vertex 拒絕該路由上的 beta values 時，讀取大型檔案就不會卡住 - [PR #39597](https://github.com/BerriAI/litellm/pull/39597)
    - 在 Vertex passthrough 上，對無版本的 `/projects/...` 路由加上 `/v1`（或對 `cachedContent` 加上 `/v1beta1`），如此使用文件中所述 base URL 的 Vertex 模式 Claude Code 就不再收到 404 - [PR #39625](https://github.com/BerriAI/litellm/pull/39625)
    - 在建構 Vertex passthrough base URL 之前先套用 `default_vertex_config` project 與 location，如此沒有 `/projects/<project>/locations/<location>/` 的路由也能運作；若沒有可用的 location，則回傳一個 400 並說明修正方式 - [PR #39662](https://github.com/BerriAI/litellm/pull/39662)
- **一般**
    - 在 `/v1/messages` 與 `/v1/responses` 上發出 `x-litellm-response-duration-ms` 與 `x-litellm-overhead-duration-ms`，並在 SpendLogs 與記錄負載中填入這些呼叫類型的 `litellm_overhead_time_ms` - [PR #38840](https://github.com/BerriAI/litellm/pull/38840)
    - 從 `/v1/models` 中移除如 `bedrock/*` 這類萬用字元路由，如此模型選擇器只會列出可呼叫的 ids；`return_wildcard_routes=True` 仍會只新增一次萬用字元 - [PR #31731](https://github.com/BerriAI/litellm/pull/31731)
    - 將語音轉錄提供者解析、轉換、簽署與 HTTP 執行移入 Rust gateway 核心 crate，並保留 callback、防護欄與 logging 生命週期 - [PR #39126](https://github.com/BerriAI/litellm/pull/39126)

## Management Endpoints / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **SSO 與驗證**
    - 在設定密碼的所有位置強制執行可設定的密碼原則（預設為 12 個字元，且需包含大寫、小寫、數字與特殊字元，可透過 `general_settings.password_policy_*` 調整），並在以 `general_settings.disable_password_login_when_sso_enabled: true` 設定 SSO 後關閉使用者名稱/密碼登入，同時保留 master key 存取作為復原路徑 - [PR #39381](https://github.com/BerriAI/litellm/pull/39381)
- **自動路由器**
    - 在執行階段從 `GET /public/autorouter_presets` 提供 auto-router 預設設定目錄，每個程序只會從 main 上已發佈的目錄解析一次（可用 `LITELLM_AUTOROUTER_PRESETS_URL` 覆寫，或設定 `LITELLM_LOCAL_AUTOROUTER_PRESETS=True` 以使用內建副本），因此預設設定更新不再需要重建儀表板 - [PR #39412](https://github.com/BerriAI/litellm/pull/39412)
- **存取群組**
    - 在存取群組回應中，為 MCP servers、agents、teams 和 keys 回傳 `{id, name}` 配對（`access_mcp_servers`、`access_agents`、`assigned_teams`、`assigned_keys`），當 id 不再可解析時由伺服器端以 `name: null` 解析，因此詳細資料頁會顯示名稱而不是原始 id - [PR #39822](https://github.com/BerriAI/litellm/pull/39822)
- **SCIM**
    - 新增 `GET /scim/v2/placeholders` 以列出會遮蔽真實帳號的佔位使用者，並新增 `POST /scim/v2/placeholders/{id}/merge`，將其團隊移轉到該帳號並刪除它們，終結群組推送時永久出現的「名稱超過一位 LiteLLM 使用者」拒絕 - [PR #39231](https://github.com/BerriAI/litellm/pull/39231)
    - 讓 SCIM 群組成員的解析改為每位成員只讀取一次 user table，而不是先做精確查詢再做 email `ILIKE` 掃描，同時維持精確 id 優先順序與歧義偵測不變 - [PR #39228](https://github.com/BerriAI/litellm/pull/39228)
- **模型 + 端點**
    - 在 config.yaml 中新增每個模型的 `model_info.display_name`，並在 Anthropic 形式的 `GET /v1/models` 清單中以 `display_name` 傳回，讓 Claude Code 的 `/model` 選擇器顯示乾淨標籤，而模型 id 仍持續路由；OpenAI 形式的清單則維持不變 - [PR #39238](https://github.com/BerriAI/litellm/pull/39238)
- **組織**
    - 在 `/openapi.json` 和 Swagger 中公開 `PATCH /v2/organization/{organization_id}`，讓 API 使用者與產生的用戶端可透過 merge-patch 語意探索 org 更新路由（null 會清除、未提供則維持不變） - [PR #39672](https://github.com/BerriAI/litellm/pull/39672), [PR #39794](https://github.com/BerriAI/litellm/pull/39794)
- **LiteLLM CLI (lite)**
    - 在 `lite claude` 中設定 `ENABLE_TOOL_SEARCH=true`，並從 `lite up`、`lite login --config-claude` 與 `lite autoroute up` 將相同預設值寫入 Claude Code 設定，讓 MCP 工具 schema 維持延後載入而不是塞滿 context window；既有值會優先 - [PR #38942](https://github.com/BerriAI/litellm/pull/38942)
    - 預設啟用 Claude Code gateway 模型探索：`lite claude` 會匯出 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`，而 `lite up` / `lite login --config-claude` 會將其寫入 `~/.claude/settings.json`，因此 `/model` 選擇器在首次啟動時就會列出 proxy 的模型 - [PR #39445](https://github.com/BerriAI/litellm/pull/39445)
    - 新增 `lite debug claude`，可為 Claude Code 工作階段產生一份 markdown 報告（花費、tokens、錯誤、失敗與最近幾輪的 request 和 response bodies），並將其儲存在 `~/.litellm/debug/`，另提供 `lite debug install-claude-command` 供 `/debug-lite` slash command 使用 - [PR #39435](https://github.com/BerriAI/litellm/pull/39435)
    - 在 `lite login` 期間，當 proxy 設定 `general_settings.allow_cli_sso_verification_uri_complete: true` 時，於瀏覽器中預先填入 SSO 驗證碼，讓使用者只需確認驗證碼而不必重新輸入 - [PR #39428](https://github.com/BerriAI/litellm/pull/39428)
    - 在 `lite opencode` 中，透過將產生的 `litellm` provider 經由 `OPENCODE_CONFIG_CONTENT` 傳遞，讓 OpenCode 的模型選擇器從 proxy 的 `/v1/models` 同步，因此 proxy 模型會出現而無需手動維護 `opencode.json`；即使擷取失敗，OpenCode 仍會啟動 - [PR #39789](https://github.com/BerriAI/litellm/pull/39789)
- **Helm 與部署**
    - 在元件化 chart 中新增 `migrationJob.hooks.argocd.enabled` 和 `migrationJob.hooks.helm.enabled`，讓 Argo CD 使用者可在每次 sync 時將 migrations 以 PreSync hook 執行，並在 gateway、backend 與 ui 上新增 `strategy`，供 `maxSurge` / `maxUnavailable` 控制；預設值維持目前行為 - [PR #39112](https://github.com/BerriAI/litellm/pull/39112)
    - 在元件化 chart 的 migrations Job 上渲染 `migrationJob.nodeSelector`、`migrationJob.tolerations` 與 `migrationJob.affinity`，讓它固定到與 Deployments 相同的 node pool，而不是落到任何節點上 - [PR #39843](https://github.com/BerriAI/litellm/pull/39843)
- **Terraform**
    - 在 `terraform/litellm/gcp`（`create_runtime = false`）中新增僅依賴模式，外加自備網路（`network_id`、`create_psa_connection = false`）與 `redis_transit_encryption`，並加入可直接對應到 Shared VPC 上 GKE 部署之 `helm/litellm` values 的新輸出 - [PR #39695](https://github.com/BerriAI/litellm/pull/39695)
- **自動路由器**
    - 在 Add Auto Router 表單中新增「自動設定」動作，會以 proxy 已提供的聊天模型群組填入每一層，優先使用目前的 OpenAI、Anthropic、Google、DeepSeek 與 xAI 階梯，並套用旗艦模型所宣告的最強 reasoning effort - [PR #39693](https://github.com/BerriAI/litellm/pull/39693)
    - 透過單一「分類頻率」單選鈕選擇 complexity router 的分類頻率（每個請求、每則新使用者訊息，或每個工作階段一次），在建立與編輯時寫入 `classification_mode`，而自訂 tier 集合時停用每個工作階段一次 - [PR #39042](https://github.com/BerriAI/litellm/pull/39042)
    - 從新的進階：Context Window Escalation 區段切換 context-window escalation，並設定其 window-fit buffer，將 `enable_context_window_escalation` 與 `context_window_escalation_buffer` 儲存在 router 上，且在未變更時兩者皆不寫入 - [PR #39054](https://github.com/BerriAI/litellm/pull/39054)
    - 透過建立與編輯表單中的「將圖片請求路由至具 vision 能力的模型」切換來啟用 modality routing，明確寫入 `modality_routing`，並可在之後的儲存中保留 - [PR #39059](https://github.com/BerriAI/litellm/pull/39059)
    - 從進階：Affinity 設定 session affinity 閒置視窗（以秒為單位），空白欄位會在建立、編輯與預設設定流程中追蹤後端預設值 3600 秒（`session_affinity_ttl_seconds`） - [PR #39679](https://github.com/BerriAI/litellm/pull/39679)
    - 在進階：Classification Method 中將圖片送往 LLM 分類器，並限制每個請求的圖片數量，為新舊 router 持久化 `vision` 設定於 `classifier_llm_config` - [PR #39840](https://github.com/BerriAI/litellm/pull/39840)
    - 新增 1M Context 預設設定，預填 Luna、Terra、Opus 5，以及在 Heuristic v2 分類器上使用 high thinking 的 Opus 5，並將 OpenAI Family 預設設定改為 GPT-5.6 Luna、Terra 與 Sol，且 Sol 以 xhigh thinking 進行 reasoning，同時將 1M Context 預設設定的 complex tier 路由至 `gpt-5.6-sol` - [PR #39490](https://github.com/BerriAI/litellm/pull/39490), [PR #39396](https://github.com/BerriAI/litellm/pull/39396), [PR #39797](https://github.com/BerriAI/litellm/pull/39797)
- **Model Hub**
    - 將公開的 Model Hub 表格以 `/public/v1/model_hub` 分頁，一次一頁，並將 paging、sorting、search，以及 provider、mode 和 feature 篩選器作為查詢參數傳送，且從新的 facet 路由填入篩選下拉選單 - [PR #39691](https://github.com/BerriAI/litellm/pull/39691)
- **代理程式**
    - 在 Agent Hub 分頁與管理員 Agents 表格中新增名稱與描述搜尋框，且當 hub 搜尋完全沒有匹配時，顯示「沒有符合項目」狀態，而不是顯示每一列 - [PR #39155](https://github.com/BerriAI/litellm/pull/39155)
- **一般**
    - 透過貼上的 ID 尋找資料列：Virtual Keys、Memory、Audit Logs 與 Request Logs 搜尋框會傳送新的 `search` 參數，以比對 key hashes、memory ids 與 session ids；Agents 搜尋會比對 agent id，而團隊的 Virtual Keys 則新增 Key ID 篩選器 - [PR #39661](https://github.com/BerriAI/litellm/pull/39661)

#### 錯誤修正 {#bugs-1}

- **團隊與金鑰**
    - 阻止部分 `/team/update` 或 `PATCH /team/{team_id}` 清除團隊中繼資料：現在，省略 `metadata` 的更新會併入已儲存的中繼資料（明確的 `null` 仍會清除它），並保留團隊成員預算連結，因此在限制變更後，防護欄、記錄與金鑰期限仍可保留 - [PR #36328](https://github.com/BerriAI/litellm/pull/36328)
    - 讓 `/team/member_delete` 在群組同步後清除留在使用者列上的團隊，而不是回應 400「User not found in team」，移除過期的團隊以及使用者在其下持有的任何金鑰 - [PR #38703](https://github.com/BerriAI/litellm/pull/38703)
    - 允許非管理員在 `/key/update` 上，將既有金鑰在 `key_type` 預設之間切換（例如從「AI APIs」切換為「Full access」），而不是回傳 403；若要將唯讀金鑰擴充，或清除由管理員設定的自訂路由清單，仍需要 proxy 管理員 - [PR #39051](https://github.com/BerriAI/litellm/pull/39051)
    - 將 `team_id` 在 `/key/generate` 與 `/key/regenerate` 上視為沒有團隊，並在清除時讓 Team 下拉式選單輸出 `null`，因此非管理員先選取團隊再清除時，仍會取得個人金鑰，而不是「Team not found for team_id=」 - [PR #39206](https://github.com/BerriAI/litellm/pull/39206)
    - 將 `project_id: ""` 在 `/key/generate` 上視為未設定，並在清除時讓 Organization 下拉式選單輸出 `null`，因此清除 Organization 欄位不再因「Organization doesn't exist in db. Organization=」而導致金鑰建立失敗 - [PR #39316](https://github.com/BerriAI/litellm/pull/39316)
    - 將 `litellm_model_table` 納入活躍團隊的 `GET /v2/team/list` 中，以便能讀回團隊的 `model_aliases`，而不是一律回傳 `null` - [PR #39045](https://github.com/BerriAI/litellm/pull/39045)
    - 當 Team ID 提交為空白時產生 UUID，而不是儲存空字串，因此 Teams 表不再顯示空白的 Team ID 儲存格 - [PR #39571](https://github.com/BerriAI/litellm/pull/39571)
    - 在預設團隊附加後，從 `POST /user/new` 回傳已持久化的團隊成員資格，因此新的 SSO 使用者第一次 `lite login` 會在預設團隊上鑄造權杖，並遵守其模型允許清單，而不是 `teams: []` - [PR #39545](https://github.com/BerriAI/litellm/pull/39545)
- **存取群組**
    - 在 GET 和 PUT 時，從團隊資料表推導存取群組已附加的團隊，因此在鏡像欄位存在之前附加的團隊會顯示出來，而已刪除的 id 會被移除，並在 POST 與 PUT 的 `/v1/access_group` 中，對解析不到任何團隊的 id 回傳 `400 Unknown team ids: ...` - [PR #39218](https://github.com/BerriAI/litellm/pull/39218)
    - 當 `DATABASE_URL_READ_REPLICA` 已設定時，在寫入端執行存取群組金鑰同步的 `UPDATE` 陳述式，因此 `/key/generate`、`/key/update`、`/key/delete` 與 `/key/{key}/regenerate` 使用存取群組時，不再因「cannot execute UPDATE in a read-only transaction」而失敗 - [PR #39128](https://github.com/BerriAI/litellm/pull/39128)
- **模型 + 端點**
    - 將模型重新命名套用到 router 的記憶體內部署清單，使新名稱可被呼叫，並且在頁面重新整理後仍能保留，而不需要重新啟動 proxy - [PR #38479](https://github.com/BerriAI/litellm/pull/38479)
    - 從 `POST /model/block` 與 `/model/unblock` 回傳包含已更新模型列的 200，而不是為已經套用的變更回傳 500 - [PR #38873](https://github.com/BerriAI/litellm/pull/38873)
    - 在 master key 輪替時就地重新加密 `litellm_params`，而不是刪除並重新建立每一個模型列，因此 `blocked`、`created_at`、`updated_at`、`created_by` 與 `updated_by` 都能保留下來，而且遭封鎖的模型在輪替後仍會保持封鎖 - [PR #38878](https://github.com/BerriAI/litellm/pull/38878)
    - 在模型重新命名或刪除時，將 `model_name` 持久化於 `POST /model/update`，並重寫每個存取群組中的 `access_model_names`；在 `/key/generate` 與 `/key/update` 上將 `organization_id: ""` 視為未設定，並透過 `session_models` 在 `/spend/logs/ui` 上列出對話的不同模型 - [PR #39436](https://github.com/BerriAI/litellm/pull/39436)
    - 在 Add Model 時，當 credentials 下拉式選單為空白時，保留輸入到 LiteLLM Params JSON 的 `litellm_credential_name`，並拒絕 `/model/new` 與 `/model/update`，回傳 403，除非 proxy 管理員附加已儲存的憑證 - [PR #39047](https://github.com/BerriAI/litellm/pull/39047)
    - 從提供者請求本文中移除 `default_api_key_rpm_limit` 與 `default_api_key_tpm_limit`，因此帶有它們的部署不再會在每次呼叫時因 Anthropic 400「Extra inputs are not permitted」而失敗，同時每個金鑰的限制仍然適用 - [PR #39211](https://github.com/BerriAI/litellm/pull/39211)
    - 在 `/utils/supported_openai_params` 中解析 router 模型別名，因此每個模型 `/v1/models` 列出的回應都可回答，而不是回傳 400「Could not map model」，並且根據其宣告的提供者回答 `github_copilot/` 與 `chatgpt/` 名稱，而不是啟動一個讓 proxy 凍結的 OAuth 裝置流程 - [PR #39000](https://github.com/BerriAI/litellm/pull/39000)
    - 當沒有符合的已儲存憑證時，從 `DELETE /credentials/{name}` 回傳 404，而不是 200「deleted successfully」，並從 `GET /credentials` 與刪除操作中拋出 proxy 例外，因此拒絕會帶有自己的狀態碼 - [PR #36260](https://github.com/BerriAI/litellm/pull/36260)
- **SSO 與驗證**
    - 將多值的 SSO 角色宣告解析為 generic OIDC、JWT access tokens、SAML 與 Entra `app_roles` 中權限最高的角色，因此同時持有 `proxy_admin_viewer` 與 `internal_user` 的使用者不再會落到先出現的那個角色；受影響的使用者會在下次登入時重新指派角色 - [PR #39480](https://github.com/BerriAI/litellm/pull/39480)
    - 在公開來源網址位於 TLS 終結的反向 proxy 後方且使用 HTTPS 時，將 session、SSO 與 SAML cookie 標記為 `Secure`，信任 `PROXY_BASE_URL`，接著只從 `general_settings.mcp_trusted_proxy_ranges` 信任 `X-Forwarded-Proto`，並在那個從未如此設定過的路徑上設定 `HttpOnly` / `SameSite` - [PR #39391](https://github.com/BerriAI/litellm/pull/39391)
    - 在 `/key/{key}/regenerate` 時使 JWT 金鑰對應快取失效，並從 `/jwt/key/mapping` 的建立、更新與刪除向每個 worker 廣播清除，因此 JWT 請求在金鑰輪替後最多五分鐘內不再回傳 401 - [PR #39808](https://github.com/BerriAI/litellm/pull/39808)
- **SCIM**
    - 當 SCIM 建立使用者時，加入已設定的預設團隊（`default_internal_user_params.teams`），並將沒有或空白 `groups` 的 `PUT /scim/v2/Users` 視為未指定，因此 Okta 個人資料同步不再移除每一個團隊成員資格，並刪除使用者在那些團隊中的金鑰 - [PR #39623](https://github.com/BerriAI/litellm/pull/39623)
- **自動 router**
    - 在 `GET /v1/models` 中公開自動 router 模型已設定的 `model_info.mode`，因此 Claude Code 可以將該 router 識別為可進行聊天 - [PR #39619](https://github.com/BerriAI/litellm/pull/39619)
    - 編輯內建的自動 router 分類器提示時，只儲存開頭指示與校準範例，讓 proxy 推導層級準則、標籤與 guard，因此層級重新命名不再與提示不一致；既有的整體提示覆寫仍可在舊版模式中編輯 - [PR #39688](https://github.com/BerriAI/litellm/pull/39688)
- **健康檢查**
    - 在 Test Connect 時，使用請求所命名的憑證進行探測，而不是借用來自無關匹配部署的金鑰或 `api_base`（這在萬用字元路由中很常見），因此已儲存的憑證不再因從未輸入過的金鑰而出現驗證錯誤 - [PR #39801](https://github.com/BerriAI/litellm/pull/39801)
- **LiteLLM CLI (lite)**
    - 在 Windows 的 cmd.exe 中，將 Claude Code `apiKeyHelper` 在 `lite up` 與 `lite login --config-claude` 內加上引號，而不是使用 POSIX 單引號，因此 Claude Code 可以執行 helper 並連到 proxy；POSIX 輸出保持不變 - [PR #39174](https://github.com/BerriAI/litellm/pull/39174)
- **Helm 與部署**
    - 在 `helm upgrade` 上重用產生的 master key Secret，而不是每次發布都鑄造新的金鑰，因此持有安裝時金鑰的用戶端可繼續運作；明確的 `masterkey` 與 `masterkeySecretName` 行為維持不變 - [PR #39219](https://github.com/BerriAI/litellm/pull/39219)

- 新增 `ingress.controller: alb | nginx`（預設 `alb`，位元完全相同的呈現），因此在 `nginx` 下，帶點號的內建路徑會呈現為 `ImplementationSpecific`，且會移除僅適用於 ALB 的 `/*.txt` 規則，讓 `helm install` 可通過 ingress-nginx 從 v1.12.0 到 v1.13.1 的 admission webhook - [PR #39465](https://github.com/BerriAI/litellm/pull/39465)
    - 將 classic chart 的 HPA 擴縮調整為 `targetCPUUtilizationPercentage: 60`，而不是 `helm create` scaffold 的 80，以符合文件中的建議，並將 chart 升級到 1.1.3 - [PR #35975](https://github.com/BerriAI/litellm/pull/35975)
- **Docker 映像**
    - 將 `wolfi-base` 升級到 glibc 2.44，將 apk `python-3.13` 鎖定為固定版本，而不是可滾動的 `python3` meta 套件，並在 proxy 與 migrations 的 Dockerfile 中設定 `UV_PYTHON_DOWNLOADS=0`，使映像建置不再因為靜默的 CPython 3.14 下載與 `uvloop` 原始碼建置而失敗 - [PR #38917](https://github.com/BerriAI/litellm/pull/38917), [PR #38973](https://github.com/BerriAI/litellm/pull/38973)
    - 在 root、`bedrock-realtime` 與 `non_root` proxy 映像中安裝 `database` 額外套件，讓 `/v1/realtime` 上的 Bedrock Nova Sonic sessions 不再因為「Missing aws_sdk_bedrock_runtime」而失敗 - [PR #39223](https://github.com/BerriAI/litellm/pull/39223)
    - 在分割式 `saml` 映像中安裝 `litellm-backend` 額外套件，讓 `/sso/saml/*` 在 Helm 分割映像部署時不再回傳 501 - [PR #39291](https://github.com/BerriAI/litellm/pull/39291)
    - 在 entrypoint scripts 與 Terraform 啟動命令中以不分大小寫方式比對 `USE_DDTRACE`，使 `USE_DDTRACE=True` 能在 `ddtrace-run` 下執行，並透過 `build_from_pip` 傳遞 `prod_entrypoint.sh` 映像，讓它至少確實遵循該變數 - [PR #39344](https://github.com/BerriAI/litellm/pull/39344)
    - 在 runtime 映像中新增公開的 Wolfi apk repository，讓 `apk add` 能在已發佈的容器內運作，而不需要 Chainguard enterprise credentials - [PR #39033](https://github.com/BerriAI/litellm/pull/39033)
    - 以 digest 將 UI 映像的 nginx runtime 鎖定為 `1.31.5-alpine3.24`，而不是浮動的 `1.31-alpine` tag，讓已發佈映像包含最新的 Alpine 套件並通過映像掃描 - [PR #39561](https://github.com/BerriAI/litellm/pull/39561)
- **一般**
    - 在 `blocked: false` 上保留明確的 `/customer/update`，因此被封鎖的客戶可以透過該端點解除封鎖，而不是更新回應 200 卻仍維持封鎖狀態 - [PR #34696](https://github.com/BerriAI/litellm/pull/34696)
    - 將格式錯誤的 virtual key 拒絕事件（例如 `Bearer undefined`）記錄為 stdout 上的 `WARNING`，而不是 stderr 上的 `ERROR`，同時維持相同的 401 回應，讓記錄收集器不再將它們計為 proxy 錯誤；可透過 `LITELLM_LOG=ERROR` 關閉 - [PR #38838](https://github.com/BerriAI/litellm/pull/38838)
    - 在請求未指定任何 vector stores 時，於驗證期間略過 object permission 資料庫查詢，讓每個不含 object permissions 的一般聊天請求少一次資料庫往返 - [PR #39347](https://github.com/BerriAI/litellm/pull/39347)
- **使用情況與記錄**
    - 透過 `group_by_session` 參數在 `/spend/logs/ui` 上於伺服器端將 request logs 每列固定為一個 session，並在預設的新到舊排序上使用 keyset cursor，因此每一頁都能容納 footer 宣稱的相同數量 distinct sessions，且較舊的 traces 仍可存取 - [PR #39257](https://github.com/BerriAI/litellm/pull/39257), [PR #38794](https://github.com/BerriAI/litellm/pull/38794)
    - 在 logs table 的 Tokens 欄位中像 Cost 欄位一樣加總某個 session 的 prompt、completion 與 total tokens，並在 `session_total_tokens`、`session_total_prompt_tokens` 與 `session_total_completion_tokens` 的 `/spend/logs/ui` 列上顯示 - [PR #39598](https://github.com/BerriAI/litellm/pull/39598)
    - 將 Usage 頁面的 Total Requests 資料磚改為讀取 gateway 的 successful 加上 failed 計數，使其等於 Successful 與 Failed 資料磚，而不是會漂移的 spend-rollup 數值 - [PR #39963](https://github.com/BerriAI/litellm/pull/39963)
    - 透過共用的 DataTable server pagination footer 呈現 Per User Usage 的完整 server page，並提供 25/50/100 rows-per-page 選擇器，讓每一頁中排名 11-50 的使用者不再被跳過 - [PR #39682](https://github.com/BerriAI/litellm/pull/39682)
- **團隊與金鑰**
    - 將 Virtual Keys 的搜尋、篩選、排序與頁碼保留在 URL query string 中（例如 `?key_search=`），因此離開頁面再按 Back，或將連結貼給隊友時，都能還原相同的篩選清單 - [PR #39481](https://github.com/BerriAI/litellm/pull/39481)
    - 當 virtual key 被輪替時，以新的瀏覽器歷史項目取代原本的紀錄，因此按 Back 會回到 key list，而不是看到已撤銷 hash 的「Key not found」錯誤 - [PR #39471](https://github.com/BerriAI/litellm/pull/39471)
    - 當 organization 清單重新擷取時，不再讓 Create Team 表單清空 Organization 與 Models 的選項，只有在選擇不同 organization 時才清除 models - [PR #39476](https://github.com/BerriAI/litellm/pull/39476)
    - 當移除最後一個 agent 時，從 team settings 傳送 `object_permission.agents` 與 `agent_access_groups` 作為 `[]`，讓移除動作會清除該 agent，而不是在不提示的情況下保留它 - [PR #39600](https://github.com/BerriAI/litellm/pull/39600)
    - 透過在 `search` 參數上的 `/user/list` 新增支援，讓 Internal Users 搜尋框能同時比對貼上的 user ID 與 email - [PR #39604](https://github.com/BerriAI/litellm/pull/39604)
- **設計系統**
    - 讓 Admin UI 表格遵守所選的頁面大小：All Models 篩選器透過 `access_group` 與 `wildcard_only` 新參數在 `/v2/model/info` 上改為伺服器端處理，Request Logs 預設為 25 列，Deleted Teams 取得共用頁尾，而 20 個不受限制的清單新增大小選擇器 - [PR #39680](https://github.com/BerriAI/litellm/pull/39680)
    - 在固定欄標題下方捲動 Keys、Teams、Logs 與 Tags 的列，保留可觸及的分頁頁尾，並停止讓 Model Hub 與 Tags 的列繪製超出其固定高度方框 - [PR #39684](https://github.com/BerriAI/litellm/pull/39684)
    - 當列數縮減時，將 server-paginated 表格對齊到最後一個有效頁面，因此在最後一頁刪除最後幾列後，不再讓使用者卡在「Page 2 of 1」 - [PR #39776](https://github.com/BerriAI/litellm/pull/39776)
    - 將 invite-user 與 SSO 設定的核取方塊水平排版，讓它們顯示為標籤旁邊的方形方框，而不是全寬的深色橫條 - [PR #39108](https://github.com/BerriAI/litellm/pull/39108)
    - 以主題 token 而非硬編碼的淺色調色盤顏色呈現 request logs Tools panel、skill detail page，以及 guardrail garden detail page，讓它們在深色模式下可讀 - [PR #39129](https://github.com/BerriAI/litellm/pull/39129), [PR #39130](https://github.com/BerriAI/litellm/pull/39130), [PR #39131](https://github.com/BerriAI/litellm/pull/39131)
- **模型 + 端點**
    - 將 Add Model 分頁、Auto Router 的建立、編輯與刪除控制項，以及 model 的 Delete 和 Update API Key 按鈕，從僅可檢視的 admin (`proxy_admin_viewer`) sessions 中隱藏，因為 API 早已對這些寫入拒絕並回傳 403 - [PR #38872](https://github.com/BerriAI/litellm/pull/38872)
    - 透過移除 Create Routing Group 表單上僅限 client 的字元模式，接受 proxy 可接受的任何 routing group 名稱，例如 `team a/fast chat`，同時仍會拒絕只包含空白的名稱 - [PR #39807](https://github.com/BerriAI/litellm/pull/39807)
- **代理程式**
    - 在 agent 編輯表單中顯示完整的 AgentCore runtime ARN，而不是在 `runtime/` 之後就被截斷的值，如此一來在未修改內容下儲存就不會再損毀儲存的 ARN，並在儲存前就於欄位內拒絕格式錯誤的 ARN - [PR #39382](https://github.com/BerriAI/litellm/pull/39382)
- **自動路由器**
    - 以主題的 muted-foreground token 呈現 How Classification Works 下方的 scoring tier 清單，讓它在深色模式下可讀，而不是黑底黑字 - [PR #39040](https://github.com/BerriAI/litellm/pull/39040)
- **一般**
    - 移除一個無法到達的 AI Hub「See Page」對話框，其按鈕原本會導向 `/model_hub_table?key=<session key>`，因此不再有任何程式路徑會把 admin 的 session key 放入頁面 URL 中 - [PR #39968](https://github.com/BerriAI/litellm/pull/39968)
    - 有一項 dashboard 變更原本要讓 `litellm_credential_name` 不再從 LiteLLM Params JSON 一起發布，且已在此期間內回復，因此那裡不會有任何變動；修正實際上已在後端於 #39047 完成 - [PR #39005](https://github.com/BerriAI/litellm/pull/39005), [PR #39046](https://github.com/BerriAI/litellm/pull/39046)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 在 OTel v2 LLM span 上發出 `gen_ai.usage.cache_creation.input_tokens` 和 `gen_ai.usage.cache_read.input_tokens`，將 Anthropic、OpenAI-compatible、DeepSeek 和 DashScope 的快取欄位正規化並保留明確的 0，讓以 token 為基礎的成本工具不再把快取使用量計為 0 - [PR #38716](https://github.com/BerriAI/litellm/pull/38716), [PR #39202](https://github.com/BerriAI/litellm/pull/39202)
    - 在 OTel v2 LLM 呼叫 span 上加上 `litellm.request.route`，從根伺服器 span 的 `http.route` 讀取，因此可依 proxy 端點篩選 LLM span，而不需要與父 span 進行 join；SDK 呼叫會省略該 key - [PR #39698](https://github.com/BerriAI/litellm/pull/39698)
- **[Datadog LLM Observability](../../docs/proxy/logging#datadog)**
    - 將 tool 呼叫、tool 結果、提供的 tool 定義與 prompt-cache token 數寫入 Datadog 自己的 schema 欄位，因此 Tools 面板會顯示資料，而 Metrics 分頁會顯示 `cache_read_input_tokens`；扁平的 `input_tool_calls.*` 與 `output_tool_calls.*` 中繼資料 key 已移除 - [PR #39222](https://github.com/BerriAI/litellm/pull/39222)
    - 新增 `user`、`key_alias` 和 `model_group` 成本標籤，其宣告位於 `_dd.cost_tags` 之下，將自動路由器決策攤平成 `router_*` 欄位（包括 `router_escalated`），發出 `reasoning_output_tokens`，並在訊息遮罩下從成功與失敗 span 移除 tool 定義與 prompt 引用中繼資料 - [PR #39402](https://github.com/BerriAI/litellm/pull/39402)
    - 在已遮罩的 span 上保留 guardrail 稽核記錄（名稱、模式、狀態、時間、`masked_entity_count`、`guardrail_cost_by_unit`），只替換四個攜帶 prompt 的欄位，因此 `turn_off_message_logging` 或 `x-litellm-enable-message-redaction` 不再會讓 `guardrail_information` 變空白 - [PR #39702](https://github.com/BerriAI/litellm/pull/39702), [PR #39848](https://github.com/BerriAI/litellm/pull/39848)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 透過新的 `--prometheus_metrics_port` 旗標或 `PROMETHEUS_METRICS_PORT` 環境變數，從獨立程序提供 `/metrics`，讓多 worker 的抓取彙總不再與 uvicorn worker 上的推論互相競爭；主連接埠仍提供 `/metrics`，而新連接埠沒有虛擬 key 驗證 - [PR #39889](https://github.com/BerriAI/litellm/pull/39889)
    - 新增帶有 `rate_limit_type` 標籤的 `litellm_api_key_rate_limit_allowed_metric`、`litellm_api_key_rate_limit_used_metric`、`litellm_team_rate_limit_allowed_metric` 和 `litellm_team_rate_limit_used_metric` gauge，直接從 v3 rate limiter 自己的標頭讀取，不需額外 Redis 讀取，因此警示可在 key 或 team 達到上限前觸發 - [PR #39236](https://github.com/BerriAI/litellm/pull/39236)
    - 在失敗路徑上將未知的 client model 名稱合併為單一 `requested_model="other"` series，而已知名稱、別名、team models 與萬用字元比對仍保留各自的標籤，因此拼錯或幻覺產生的 model 名稱不再讓 `/metrics` 與 pod 記憶體無限制成長 - [PR #39136](https://github.com/BerriAI/litellm/pull/39136)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 在 root span 仍在記錄時，將 root observation 的 input 與 output 加到 `langfuse_otel` traces 上，適用於 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages`，不論是否串流，因此 Langfuse trace 清單與 trace 檢視不再顯示空白的 Input 與 Output - [PR #39369](https://github.com/BerriAI/litellm/pull/39369)
- **[CloudZero](../../docs/proxy/logging)**
    - 改為從每一列而不是前 100 列推斷每日 batch 與 CBF schema，因此 `POST /cloudzero/export` 不再因 500 Polars schema error 而失敗，而較晚出現的 `resource/tag:team_alias` 與 `resource/tag:entity_id` 標籤也能送達 CloudZero - [PR #39871](https://github.com/BerriAI/litellm/pull/39871), [PR #39873](https://github.com/BerriAI/litellm/pull/39873)
- **[S3](../../docs/proxy/logging#s3-buckets)**
    - 針對很長的 Responses API ids，以可讀的開頭加上 sha256 摘要來縮短 s3 物件 key 與下載檔名，且只在預設前綴溢位時才裁切，因此上傳不再因 `KeyTooLongError` 而失敗，而 session replay 與 logs 頁面也能保留 payload - [PR #39164](https://github.com/BerriAI/litellm/pull/39164)
- **Azure Storage**
    - 透過 `DefaultAzureCredential` 鏈驗證無 key 的 Azure Storage 記錄與受管理檔案，因此 Workload Identity Federation 部署可在不需要 service principal 變數的情況下運作，且鏈 token 會在 worker 執行緒上讀取 - [PR #39229](https://github.com/BerriAI/litellm/pull/39229)
    - 將該鏈限制為部署所攜帶的身分（workload identity、`AZURE_STORAGE_CLIENT_*` service principal、managed identity），因此開發者的 `az login` 或 LLM 的 `AZURE_CLIENT_SECRET` 絕不會寫入 blob - [PR #39637](https://github.com/BerriAI/litellm/pull/39637)
- **支出記錄**
    - 在支出列上保留 `metadata.router_metadata`（請求的 model、選定的 model 與 provider，以及等於 `x-litellm-call-id` 標頭的 `router_correlation_id`），適用於標記為 `model_info.internal_router_model: true` 的部署，並捨棄任何 client 提供的 `router_metadata` - [PR #39001](https://github.com/BerriAI/litellm/pull/39001)
    - 將 Postgres deadlock 重試處理得像 transport error 一樣，並在任何其他 Prisma error 時把批次重新排到佇列前端，因此 spend log 列可在 DB 小故障時存活，而不會被丟棄 - [PR #39883](https://github.com/BerriAI/litellm/pull/39883)
    - 重新將可讀的 `litellm-internal-health-check` service-account 名稱以 `api_key` 形式儲存在 health-check spend 列上，而不是 sha256 hash，因此這些列在 Usage 與 BI 匯出中可被歸屬，與 v1.99 之前相同 - [PR #39572](https://github.com/BerriAI/litellm/pull/39572)
- **一般**
    - 將串流中途的 provider timeout 在 `/v1/messages` 與 pass-through 路由上記錄為失敗，並帶著已傳遞區塊的使用量與成本，因此 failure callback 會觸發，`litellm_deployment_failure_responses_total` 會移動，而 spend 列會顯示 `status: "failure"` 而不是 success - [PR #39589](https://github.com/BerriAI/litellm/pull/39589)
    - 在 20+ 個 pass-through 路由與 websocket passthrough 上觸發 team 層級的記錄回呼，例如 Langfuse 和 Datadog，對格式錯誤的 team 記錄設定採取 fail open，並停止這些請求在前置呼叫 guardrail 執行時回傳 500 `'NoneType' object has no attribute 'get'` - [PR #38979](https://github.com/BerriAI/litellm/pull/38979), [PR #39216](https://github.com/BerriAI/litellm/pull/39216)
    - 在串流 `/v1/responses` 記錄 payload 上保留 provider 回應標頭，包括 provider request id 與 Azure `apim-request-id`，與非串流記錄目前已帶有的內容一致 - [PR #38131](https://github.com/BerriAI/litellm/pull/38131)
    - 將每個 callback 的 logging hook 失敗彼此隔離，並在串流結束後一律執行釋放 slot 的 limiter callback，因此會拋錯的記錄整合不再洩漏 `max_parallel_requests` slot，並以錯誤的 429 將 key 鎖出長達一小時 - [PR #39093](https://github.com/BerriAI/litellm/pull/39093)
    - 依嚴重性彙總跨越每個 guardrail 條目的 `status_fields.guardrail_status`（`guardrail_intervened` 高於 `guardrail_failed_to_respond` 高於 `success` 高於 `not_run`），因此被較後面的 guardrail 封鎖的請求不再記錄為 `success`，而非字串狀態也不再會讓整個 payload 消失 - [PR #39596](https://github.com/BerriAI/litellm/pull/39596)
    - 從 uvicorn access log 遮罩憑證查詢參數（包含百分比編碼的 key），因此 `/key/info?key=sk-...` 會記錄為 `GET /key/info?REDACTED`，並停止讓超出預算的 429 回顯原始 key 材料；`LITELLM_DISABLE_REDACT_SECRETS=true` 可關閉此過濾器 - [PR #39293](https://github.com/BerriAI/litellm/pull/39293)
    - 從 `set_verbose` `Request to litellm:` 與 `Final returned optional params` 行中遮罩以憑證命名的 kwargs，包含巢狀在 `extra_headers` 與 `extra_body` 內的項目，因此 provider key 不再出現在終端機、CI 工作記錄與 log drain 中 - [PR #39526](https://github.com/BerriAI/litellm/pull/39526), [PR #39538](https://github.com/BerriAI/litellm/pull/39538)
    - 對超過 256 KiB 的 payload 在 worker 執行緒上執行用於 log 截斷的 base64 圖片掃描，因此記錄 12 MB 多模態請求不再會讓事件迴圈為其他 client 停滯 - [PR #39890](https://github.com/BerriAI/litellm/pull/39890)

### 防護欄 {#guardrails}

- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 遵循 Bedrock `post_call` guardrails 上的 `streaming_buffer_until_moderated`、`streaming_end_of_stream_only` 和 `streaming_sampling_rate`，使稽核模式串流能以即時方式送達用戶端，對組裝後的文字只進行一次 OUTPUT 掃描，將其判定記錄在 `guardrail_information` 中，並在 flush 之後以串流內錯誤框架結束串流 - [PR #38722](https://github.com/BerriAI/litellm/pull/38722)
    - 將串流中的 `/v1/responses` 輸出導向統一的 guardrail，因此 Bedrock `post_call` guardrail 不再回傳 HTTP 500 `Error building chunks for logging/streaming usage calculation`；事件會暫存到整個回應都掃描完畢，若有違規則回傳 guardrail block 而非模型文字 - [PR #38734](https://github.com/BerriAI/litellm/pull/38734)
    - 停止將 `toolConfig` 工具定義作為使用者內容在 Bedrock passthrough `converse` 和 `converse-stream` 上進行掃描，讓工具描述中的禁用字詞不再封鎖無害的 prompt，並修補這讓 `experimental_use_latest_role_message_only` 可利用的繞過 - [PR #39281](https://github.com/BerriAI/litellm/pull/39281)
    - 在 Bedrock ApplyGuardrail 偵錯記錄行中遮罩 `X-Amz-Security-Token` 和 `Authorization`，使 `--detailed_debug` 不再列印即時的暫時性 AWS 憑證 - [PR #39044](https://github.com/BerriAI/litellm/pull/39044)
- **Alice**
    - 新增 `alice` guardrail（前身為 ActiveFence），針對 Alice 評估請求與回應並強制執行其 ALLOW、BLOCK、MASK 或 DETECT 判定，應用程式的政策由虛擬金鑰中繼資料內的 `alice_app_id` 選定，從外送 payload 中移除具備憑證樣式的金鑰，且傳輸失敗遵循 `unreachable_fallback` - [PR #38898](https://github.com/BerriAI/litellm/pull/38898)
- **防護欄成本與監控**
    - 將 Bedrock guardrail 成本按用量計數器彙總：spend logs 帶有 `guardrail_cost_by_unit`，`/guardrails/usage/overview` 新增 `cost`、`untrackedUsageUnits` 和 `totalCost`，而 `/guardrails/usage/detail/{id}` 則新增按單位、團隊與金鑰的成本；未定價或遷移前的單位會顯示為未追蹤，而非 $0 - [PR #39196](https://github.com/BerriAI/litellm/pull/39196)
    - 在 Guardrails Monitor 上顯示 Usage Units 和 Cost 欄位、Guardrail Cost 卡片，以及按計數器、團隊與金鑰區分的 Usage & Cost 區段，並提供「How is this calculated?」彈出說明，且在成本旁標示被排除的未定價單位 - [PR #39853](https://github.com/BerriAI/litellm/pull/39853)
    - 以 `?guardrail=<id>` 在 Guardrails 與 Guardrails Monitor 頁面深連結 guardrail 詳細檢視，因此分享連結、重新載入或瀏覽器返回都會保留所選的 guardrail，而過期的 id 會顯示 Guardrail not found，並提供 Back to Guardrails 按鈕 - [PR #39930](https://github.com/BerriAI/litellm/pull/39930)
- **自訂程式碼防護欄**
    - 為自訂程式碼 guardrails 新增非封鎖性的 `flag(reason, metadata={})` 判定，因此內容會原樣通過，但會記錄一筆 `guardrail_flagged` 項目，在 Guardrails Monitor 上計為 flagged，能以 `?action=flagged` 搭配 `/guardrails/usage/logs` 進行篩選，且在 Request Logs 中呈現為 FLAGGED - [PR #39728](https://github.com/BerriAI/litellm/pull/39728)
    - 為 `CustomGuardrail` 子類別記錄 guardrail 資訊，這些子類別的 `apply_guardrail` 覆寫未被 `@log_guardrail_information` 包裹，因此現在一個會封鎖的文件式自訂 guardrail 會出現在 Guardrails Monitor 和請求的 Guardrails 分頁中 - [PR #39727](https://github.com/BerriAI/litellm/pull/39727)
- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 追蹤並拆除 Presidio 的同層級 `post_call` 回呼，適用於 `DELETE` 和 `PUT /guardrails/{id}`，因此已刪除的 guardrail 會停止遮罩回應，而實體編輯也不再留下仍強制舊 `pii_entities_config` 的過期同層級項目 - [PR #39271](https://github.com/BerriAI/litellm/pull/39271)
- **[CrowdStrike AIDR](../../docs/proxy/guardrails/crowdstrike_aidr)**
    - 遵循 `mode`、`streaming_end_of_stream_only` 和 `streaming_sampling_rate` 於 `crowdstrike_aidr` guardrail，而非一律執行 pre_call 與 post_call 並每 5 個串流區塊重新掃描一次；具有 `mode: during_call` 或 `logging_only` 的設定現在會在嚴格 guardrail 模式下於啟動時失敗 - [PR #39317](https://github.com/BerriAI/litellm/pull/39317)
- **[HiddenLayer](../../docs/proxy/guardrails/hiddenlayer)**
    - 在建立 HiddenLayer v1 偵測 payload 之前移除 `image_url` 部分，因為 v1 端點只接受文字；HiddenLayer v2 仍會接收完整的多模態內容 - [PR #29210](https://github.com/BerriAI/litellm/pull/29210)
- **[Prompt Security](../../docs/proxy/guardrails/prompt_security)**
    - 為 Prompt Security 檔案清理新增 `file_sanitization_timeout`（預設 30s）與 `file_sanitization_fail_open` 政策：逾時的檔案預設會以未清理狀態轉送，而 `file_sanitization_fail_open: false` 則改回傳 HTTP 408 - [PR #38083](https://github.com/BerriAI/litellm/pull/38083)
- **隱藏密鑰**
    - 停止將無害識別字元遮罩：OpenAI 偵測器只會比對帶有數字的獨立 `sk-` token，base64 熵值門檻改為 detect-secrets 的 4.5 預設值，且在不同 worker 間的遮罩順序具決定性，因此 prompt 快取金鑰能維持穩定 - [PR #39879](https://github.com/BerriAI/litellm/pull/39879)
    - 在 guardrail playground（`POST /guardrails/apply_guardrail`）中遮罩 secrets，而不是將其回顯，於 Add Guardrail 表單中列出 Hide Secrets 及其 `pre_call` 模式，並在 Spend Logs 和 Guardrails Monitor 中記錄 `allow` 或 `mask` guardrail 遙測資料及其已遮罩的實體數量 - [PR #39398](https://github.com/BerriAI/litellm/pull/39398)
- **[Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 處理 Model Armor `post_call` 中串流的 `/v1/messages`、`/v1/responses` 與 Google `:streamGenerateContent` 回應，而不是回傳 500，拒絕無法在該端點自身錯誤形狀中組裝的串流（`fail_on_error: false` 會在未掃描的情況下轉送並附帶警告），並對需要遮罩的串流 `/v1/responses` 採取封鎖而非重寫 - [PR #39181](https://github.com/BerriAI/litellm/pull/39181)
- **政策引擎**
    - 在 policy pipeline 以 allow 結束後，還原請求自身的 guardrails 清單，因此獨立附加的 `post_call` 內容過濾器，不會在同一模型附加了無關的 `pre_call` pipeline 時靜默略過 - [PR #39038](https://github.com/BerriAI/litellm/pull/39038)
- **一般**
    - 將 `PUT /guardrails/{id}` 立即套用到服務它的 worker，並由新列重建 guardrail，使模式變更無需重新啟動即可生效；同時對無效設定（無法編譯的 regex）在 PUT 與 PATCH 時回傳 HTTP 422，而先前的設定仍持續執行防護 - [PR #38877](https://github.com/BerriAI/litellm/pull/38877), [PR #39243](https://github.com/BerriAI/litellm/pull/39243)
    - 在串流 `/v1/chat/completions` 和 `/v1/responses` 時，以有效的 SSE 串流送出 `modify_response` guardrail block，並以 HTTP 200 結束於 `data: [DONE]`（chat 使用 `content_filter` finish chunk，Responses 使用 `response.completed`），而不是在緩衝時送出錯誤框架或單純的 HTTP 500 - [PR #39036](https://github.com/BerriAI/litellm/pull/39036)
    - 跳過自上次掃描以來文字未改變的串流 guardrail 回合（包含串流結尾），因此完成的答案只會被掃描一次，且不會以空文字發出任何掃描；包含工具呼叫的回合絕不會被跳過 - [PR #39386](https://github.com/BerriAI/litellm/pull/39386)
    - 在 `apply_guardrail` 專用提供者（`custom_code`、`panw_prisma_airs`）上，以已記錄的請求與回應副本執行 `mode: logging_only`，使判定結果落入 `guardrail_information`，顯示為 `success` 或 `guardrail_intervened`，而不是根本沒有呼叫提供者 - [PR #39297](https://github.com/BerriAI/litellm/pull/39297)
    - 當 guardrail 回傳時，保留 Codex `namespace` (MCP) tools、`custom` tools，以及 computer_use、image_generation 和 shell tools 在 `/v1/responses` 上不變，僅重建 guardrail 編輯或移除的成員，因此 MCP 工具呼叫不再回來時變成不支援的 `ns__member` 函式 - [PR #39366](https://github.com/BerriAI/litellm/pull/39366)

- 將 Anthropic `url` 圖片來源沿用到 `/v1/messages` 上的 guardrails，並將 `base64` 來源標記為 `data:<media_type>;base64,...`，如此具備圖片感知能力的 guardrail 便能看見圖片，而不是記錄為通過檢查 - [PR #38940](https://github.com/BerriAI/litellm/pull/38940)
    - 在任何 guardrail 已註冊時，透過讓未執行的 guardrail post-success hook 回傳 None，並將結果串接通過每個 callback，以便在 `provider_specific_fields` 上保留 `search_results` 中的 `/v1/chat/completions` - [PR #38984](https://github.com/BerriAI/litellm/pull/38984)

### 提示管理 {#prompt-management}

- **一般**
    - 依環境為記憶體中的提示註冊表建立索引，因此同一個 `prompt_id` 的 development 與 production 副本不再彼此遮蔽：serving 預設為 production，接著是 staging，再來是 development；`/v1/chat/completions` 和 `/v1/responses` 上新增的 `prompt_environment` 參數可鎖定單一環境，且儀表板會為每個環境列出一列 - [PR #38440](https://github.com/BerriAI/litellm/pull/38440)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **[預算與速率限制](../../docs/proxy/users)**
    - 在 `/key/info` 和 `/v2/key/info` 上顯示每個視窗的預算用量：新增的 `budget_limits_usage` 欄位會回報 `current_spend`，針對 `budget_duration` 中的每個 `budget_limits`，並從與強制執行使用相同的計數器讀取資料 - [PR #37044](https://github.com/BerriAI/litellm/pull/37044)
    - 當 `fail_closed_budget_enforcement: true` 的最壞情況估算超過 API 金鑰剩餘預算時，預先拒絕請求，回傳 429，並同時回傳已持久化的花費與預估成本，而不是縮減保留額度並讓花費超出 `max_budget` - [PR #39214](https://github.com/BerriAI/litellm/pull/39214)
    - 透過將每個模型預算（`model_max_budget`）的計數器移至 Redis 支援的花費計數器快取中，於複本間強制執行，讓有上限的 API 金鑰在每個複本上都會收到 429，且 `/key/info` 會回報共享的 `current_spend`，而不會 `enable_redis_auth_cache` - [PR #39375](https://github.com/BerriAI/litellm/pull/39375)
    - 在預算重設時，清空記憶體與 Redis 中快取的終端使用者花費計數器，並逐出快取的終端使用者物件，讓請求在每個 worker 與複本上的視窗一輪替就立即停止回傳 429 - [PR #39729](https://github.com/BerriAI/litellm/pull/39729)
    - 當 `PATCH /organization/update` 針對 `null`、`tpm_limit`、`rpm_limit` 或其他預算欄位送出 `max_budget` 時，清除組織預算欄位，與 `PATCH /v2/organization/{organization_id}` 的合併修補語意一致 - [PR #39670](https://github.com/BerriAI/litellm/pull/39670)
    - 在 `PATCH /v2/organization/{organization_id}` 對負的 `tpm_limit`、`rpm_limit` 或 `max_parallel_requests`，以及無法解析的 `budget_duration` 回傳 422，而不是將這些值寫入預算資料列 - [PR #39793](https://github.com/BerriAI/litellm/pull/39793)
    - 以具時間範圍限制的花費日誌彙總來建立新的預算視窗資料列，而不是採用由用戶端選擇的 `request_id` 清單，因此在資料庫中斷期間代理程式記憶體仍保持平穩，且視窗花費在各個 pod 間與日誌一致 - [PR #38851](https://github.com/BerriAI/litellm/pull/38851)
- **離峰定價**
    - 新增以時間為基礎的離峰定價：模型的 `off_peak_pricing` 區塊可採用 `hours_utc` 視窗或具星期幾條件的 `windows`（含 `weekday_timezone`），並在視窗開啟期間以折扣後的每 token 費率取代標準、分級或閾值費率 - [PR #31725](https://github.com/BerriAI/litellm/pull/31725)
    - 在 `off_peak_pricing` 區塊中接受 `output_cost_per_reasoning_token` 和 `cache_creation_input_token_cost`，因此在視窗內，推理與快取建立 token 會在通用成本路徑與 DashScope 計算器上以折扣費率計費 - [PR #39635](https://github.com/BerriAI/litellm/pull/39635)
    - 在 DashScope、Fireworks AI 與 Perplexity 成本計算器中遵循 `off_peak_pricing`；先前這些計算器在視窗內仍以標準費率計費，而具有相同區塊的 DeepSeek 部署已經享有折扣 - [PR #39592](https://github.com/BerriAI/litellm/pull/39592), [PR #39632](https://github.com/BerriAI/litellm/pull/39632)
- **[成本計算](../../docs/proxy/cost_tracking)**
    - 將最終回應成本在 chat completions 與 `/v1/responses` 的最後一個串流使用量區塊上預設為 `usage.cost`，因此為別名模型計價的用戶端不再收到 None；每個區塊的 SSE 成本注入仍受其旗標控制 - [PR #39069](https://github.com/BerriAI/litellm/pull/39069)
    - 依照 xAI 在 `usage.cost_in_usd_ticks` 中回報的成本對 xAI 請求計費，適用於 chat 與 Responses，無論是否串流，因此像 X search 這類伺服器端工具也會被計費；config 計價的部署與利潤仍會疊加套用 - [PR #39441](https://github.com/BerriAI/litellm/pull/39441)
    - 將自動路由器的 routing embedding 計入呼叫者的 key 與團隊，因此每個自動路由的請求都會在 completion 旁記錄一筆 `aembedding` 資料列，而不是讓該 embedding 無法歸屬 - [PR #39532](https://github.com/BerriAI/litellm/pull/39532)
    - 以每 1,000 次查詢 $12 為 Bedrock Mantle web search 計價，使用 Bedrock 在 `/v1/responses` 上回報的 `tool_usage.web_search.num_requests` 計數；若沒有計數，則退回改以計算 `web_search_call` 項目 - [PR #39610](https://github.com/BerriAI/litellm/pull/39610)
    - 透過 `annotation_cost_per_page` 對 OCR 註解頁面計費（若無則退回 `ocr_cost_per_page`），因此在 `/v1/ocr` 上僅含註解的與混合式 Document AI 呼叫不再記錄 $0 花費 - [PR #38985](https://github.com/BerriAI/litellm/pull/38985)
    - 在快取命中時保留防護欄成本於花費中，因此由付費防護欄前置的快取請求，會在花費日誌、每日表格與預算中記錄防護欄費用，而不是 $0 - [PR #39960](https://github.com/BerriAI/litellm/pull/39960)
    - 保留在部署選擇之前記錄的 gateway 快取注入標記之 every-deployment 範圍，因此 `gateway_injected_caching_savings_spend` 會將透過任何部署或備援路徑計費的快取命中歸功於 gateway - [PR #39241](https://github.com/BerriAI/litellm/pull/39241)
- **花費日誌**
    - 在 Team Usage 頁面新增 `GET /team/spend/by_user` 與 Team 內每位使用者花費卡片，並提供 CSV 下載，將團隊花費按使用者拆分，包括 JWT 流量；團隊管理員可查看所有成員，成員只能看到自己 - [PR #39771](https://github.com/BerriAI/litellm/pull/39771)
    - 將 `/v1/messages` 花費資料列以用戶端收到的 `msg_` id 為鍵，包括串流、`/anthropic/v1/messages` passthrough 以及經橋接的非 Anthropic 模型，因此 `GET /spend/logs?request_id=msg_...` 能找到該資料列 - [PR #39511](https://github.com/BerriAI/litellm/pull/39511), [PR #39541](https://github.com/BerriAI/litellm/pull/39541)
    - 為沒有 session id 的請求新增 `general_settings.missing_session_id`：`generate` 會寫入一個由 SpendLogs 與 Langfuse 共用的 id，`reject` 會回傳 400，而 `omit` 則讓 `SpendLogs.session_id` 保持為 null；未設定時仍維持今天的備援 - [PR #39450](https://github.com/BerriAI/litellm/pull/39450), [PR #39458](https://github.com/BerriAI/litellm/pull/39458)
    - 在批次成本寫入器上標記 `user_api_key_hash`，並在 Usage、CloudZero 與 Focus 匯出中為雙重雜湊資料列還原別名與電子郵件，因此自 v1.99 以來的批次花費會顯示在 key alias 之下，而不是 `key-hash-...` - [PR #39568](https://github.com/BerriAI/litellm/pull/39568)
    - 在 Postgres 內依天分組 `GET /spend/logs` 摘要，而不是逐列 Prisma `group_by`，回傳相同的每日 JSON，同時讓代理程式記憶體在重複呼叫期間保持平穩 - [PR #39351](https://github.com/BerriAI/litellm/pull/39351)
    - 在 proxy extras 中提供 `psycopg`，以便在遷移期間執行分區化的 `LiteLLM_SpendLogs` 偵測，並在缺少時發出警告，而不是在重寫主鍵時失敗 - [PR #38994](https://github.com/BerriAI/litellm/pull/38994)
- **警示**
    - 新增 `user_spend_thresholds` 與 `user_spend_anomalies` Slack 警示類型，具備每日與每月的每位使用者門檻，以及可透過 `alerting_args` 或 Admin UI 設定的異常倍數；對於超出範圍的值則回傳 400，而不是讓 config 重新載入失敗 - [PR #38438](https://github.com/BerriAI/litellm/pull/38438)
    - 當 `alerting` 只包含 `webhook` 時傳送預算警示，並接受 `ALERTING_WEBHOOK_URL` 作為 `SLACK_WEBHOOK_URL` 的提供者中立備援，讓 Slack 格式警示可送達 Rocket.Chat 或 Mattermost - [PR #38441](https://github.com/BerriAI/litellm/pull/38441)
- **模型定價對照表**
    - 在 429、5xx 與傳輸錯誤時重試啟動時的成本對照表擷取，並採用 aware of Retry-After 的 backoff；對於過時成本對照表在下一次 `/reload/model_cost_map` 時掉失的 config 部署則重新建立，而不是讓它們在 pod 的生命週期內永久消失 - [PR #39230](https://github.com/BerriAI/litellm/pull/39230)
    - 跨 119 個條目替換 52 個失效的成本對照表 `source` URL，並修正或新增 12 個 `deprecation_date` 值，包括 OpenAI realtime previews（2026-05-07）與 `whisper-1`，以及 transcribe models（2027-02-26） - [PR #38801](https://github.com/BerriAI/litellm/pull/38801)
    - 在 Gemini 與 Vertex AI 上依解析度層級為 Veo 3.1 計價，將 Fireworks DeepSeek V4 Flash 的費率與其已公布費率對齊，新增 `zai/glm-5.2`、`together_ai/Qwen/Qwen3.8-Flash`、`cerebras/gemma-4-31b`、`elevenlabs/scribe_v2` 與 Databricks DeepSeek V4，另加六個淘汰日期 - [PR #38990](https://github.com/BerriAI/litellm/pull/38990)
    - 依提供者頁面重新定價 registry：OpenAI realtime 限制與 GPT-5.4 到 5.6 在 272k 以上的 flex 與 priority tiers、Mistral aliases、Together Qwen3.8、Azure AI cache rates、GovCloud 與 Azure Government models、Cloudflare Whisper，以及新的淘汰日期 - [PR #39170](https://github.com/BerriAI/litellm/pull/39170)

- 新增 252 筆已驗證的登錄項目，並修正另外 135 筆（Databricks September catalog、OpenRouter、W&B 每 1M 分母），將 realtime image 費率移至 per-token 欄位，並移除未發布的 GPT Image 2 文字輸出價格 - [PR #39388](https://github.com/BerriAI/litellm/pull/39388)

## MCP Gateway {#mcp-gateway}

- **工具與存取**
    - 將語意工具搜尋新增至原生 MCP Gateway：在設定 `litellm_settings.mcp_tool_search.embedding_model` 時，`mcp_tool_search` 虛擬工具會依 embedding 相似度對呼叫者已授權的工具重新排序，`top_k`、分數門檻，以及始終置頂的 `core_tools` 都可從 Admin UI 調整；若沒有 embedding 模型，則維持關鍵字比對 - [PR #39404](https://github.com/BerriAI/litellm/pull/39404)
    - 在 `mode: pre_mcp_call` 防護欄中掃描並遮罩 MCP 工具呼叫參數：Presidio、Model Armor、Noma、Pillar、Bedrock 以及其他 `apply_guardrail` 整合現在會將參數字串以 `texts` 傳入，而其重寫結果會落在 `modified_arguments`，因此 MCP 載荷中的 PII 會被遮罩，而不是未經掃描就通過 - [PR #35142](https://github.com/BerriAI/litellm/pull/35142)
    - 在上游 `tools/list` 上跟隨 `nextCursor` 分頁，因此多頁目錄會在 gateway、REST 端點、Admin UI 預覽與 SDK `load_mcp_tools` 輔助函式中公開每一個工具，而不只是第一頁；整個走訪會在 `MCP_TOOL_LISTING_TIMEOUT` 下執行，因此對於非常慢的上游請提高 `LITELLM_MCP_TOOL_LISTING_TIMEOUT` - [PR #39172](https://github.com/BerriAI/litellm/pull/39172)
    - 在彙總 `GET /mcp-rest/tools/list` 上回報每個伺服器的結果：新的 `server_outcomes` 對映會將每個查詢到的伺服器命名為帶有工具數量的 `ok`，或帶有其 HTTP 狀態的 `auth_required`，因此沒有憑證的 OAuth 保護伺服器不再會無聲地從清單中消失 - [PR #39232](https://github.com/BerriAI/litellm/pull/39232)
    - 新增一個可選加入的 `mcp_allow_all_keys_respects_mcp_scope: true` 設定，讓具有明確 MCP 伺服器清單的虛擬金鑰不再發現或呼叫無關的 allow-all 伺服器；未範圍化的金鑰與預設行為維持不變 - [PR #39531](https://github.com/BerriAI/litellm/pull/39531)
    - 將金鑰的 MCP 別名授權原樣保存，而不是將其重寫為區域本地伺服器 id，因此在共享資料庫多區域設定中於某一區域建立的金鑰，現在可再次在另一區域運作（在 v1.88.0 回歸）；在故障期間儲存的金鑰需要以別名重新儲存 - [PR #39119](https://github.com/BerriAI/litellm/pull/39119)
    - 若 `mcp_tool_permissions` 金鑰是多個 MCP 伺服器共用的名稱或別名，則在金鑰、團隊、組織、使用者、客戶與代理程式寫入時以 400 拒絕，並列出那些伺服器；既有的歧義項目會持續運作，直到其工具清單被編輯為止 - [PR #39947](https://github.com/BerriAI/litellm/pull/39947)
    - 在工具權限矩陣中顯示透過存取群組、工具集或工具權限繼承而來的 MCP 伺服器，並以其來源加上徽章標示，因此儲存團隊時不會再清除繼承伺服器的工具允許清單；具有相同 id、名稱與別名的項目在寫入時會合併為一筆 - [PR #35154](https://github.com/BerriAI/litellm/pull/35154)
    - 在團隊 Overview 與 Settings Object Permissions 卡片中列出從存取群組繼承而來的 MCP 伺服器與代理程式，並與直接授權一併計數，懸浮提示會顯示授權的群組名稱；`/team/info` `access_group_details` 現在每個群組都會帶有 `mcp_server_ids` 與 `agent_ids` - [PR #39215](https://github.com/BerriAI/litellm/pull/39215)
    - 在 `store: false` 下保持 `/v1/responses` MCP 自動執行無狀態：後續的模型呼叫會重播前一回合及其 `reasoning.encrypted_content`，而不是傳送提供者從未儲存的 `previous_response_id`，因此零資料保留的呼叫者會得到回應，而不是 400 - [PR #36575](https://github.com/BerriAI/litellm/pull/36575)
- **OAuth 與 session token**
    - 透過在 assertion 接近到期時兌換已儲存的 refresh token，為 `oauth2_id_jag` 伺服器背後的 SSO identity assertion 續期，並在 replicas 間以每位使用者單飛處理，因此 ID-JAG 代理程式可在超過一個 `id_token` 壽命後仍持續運作，而無需再次互動式登入；若續期遭拒，仍會回傳重新登入的 412 - [PR #35401](https://github.com/BerriAI/litellm/pull/35401)
    - 當作用中的 SSO 提供者（Google、Microsoft、SAML）無法擷取 identity assertion 時，在建立、更新或從設定載入 `oauth2_id_jag` 伺服器時，以及在 SSO 登入時完全沒有擷取到任何內容時發出警告，而不是讓伺服器從此無聲失敗 - [PR #35394](https://github.com/BerriAI/litellm/pull/35394)
    - 將 `x-mcp-<access_group>-<header>` 接受為該存取群組中每個伺服器的預設上游憑證，適用於 `/mcp/<group>`、目標工具呼叫與 `/mcp-rest`，因此單一標頭即可涵蓋整個群組；伺服器自身的 `x-mcp-<server>-*` 標頭仍會優先，且群組外的伺服器永遠不會收到它 - [PR #39717](https://github.com/BerriAI/litellm/pull/39717)
    - 不再將 LiteLLM virtual key 在 token-exchange 與 ID-JAG 伺服器中交換為上游 subject token：僅攜帶 `Authorization: Bearer sk-...` 的請求現在會收到 401 challenge，而不是將 gateway 金鑰送到 IdP；請將金鑰放在 `x-litellm-api-key`，並將 IdP token 放在 `Authorization` - [PR #39446](https://github.com/BerriAI/litellm/pull/39446)
    - 透過金鑰允許的伺服器來解析連線時的 OBO 預檢，因此沒有權限使用 token-exchange 伺服器的金鑰不再會觸發 IdP 交換或為其快取憑證 - [PR #39447](https://github.com/BerriAI/litellm/pull/39447)
    - 在連線時對 `oauth2_id_jag` 憑證進行預檢，因此遺失或過期的已儲存 assertion 會以單純的 412 呈現，而 assertion 儲存區故障會以 503 呈現，而不是出現一個沒有工具的 200 `tools/list`，接著在呼叫時才出現「tool not found」 - [PR #35392](https://github.com/BerriAI/litellm/pull/35392)
    - 透過每個金鑰的 generation counter，將進行中的外送 token mint 與重疊的失效隔離，因此上游剛以 401 拒絕的 bearer 不會再次快取完整 TTL，而重試會取得新的 token - [PR #35398](https://github.com/BerriAI/litellm/pull/35398)
    - 在 ID-JAG 路徑上將 SSO identity assertion 讀取快取於記憶體中，快取時間為 `MCP_SSO_ASSERTION_CACHE_TTL_SECONDS`（預設 60 秒），並由同一個 pod 上的登入使其失效，因此重複的 `tools/call` 請求不再需要每次呼叫都讀取 Postgres - [PR #39348](https://github.com/BerriAI/litellm/pull/39348)
    - 在 token exchange 前，以不區分大小寫且跨越任何空白的方式剝除傳入的 `Authorization` scheme，因此送出 `authorization: bearer <jwt>` 的用戶端不再會將 `bearer` 洩漏到 RFC 8693 `subject_token`，並對每個 `oauth2_token_exchange` 伺服器收到 401 - [PR #39346](https://github.com/BerriAI/litellm/pull/39346)
    - 透過 `server_id` 解析 OAuth broker 路由（`/{server}/authorize`、`/{server}/.well-known/oauth-authorization-server` 以及其餘路由），當名稱或別名查找失敗時也同樣如此，並保留相同的用戶端 IP 存取檢查，因此將穩定 id 放在路徑中的用戶端不再收到 404 - [PR #39432](https://github.com/BerriAI/litellm/pull/39432)
- **伺服器設定**
    - 讓 config.yaml MCP 伺服器可釘選其 `server_id`，因此編輯伺服器的 url 不再會改變其 id，並無聲地破壞其所有金鑰與團隊授權；與其他設定項目衝突的已釘選 id 會在啟動時被拒絕，而沒有釘選 id 的伺服器則維持其現有 id - [PR #39286](https://github.com/BerriAI/litellm/pull/39286)
    - 將 Admin UI 工具預覽與 Test Connection（`POST /mcp-rest/test/tools/list`）在 OAuth discovery、connect 與 handshake 全程的上限設為 `MCP_TOOL_LISTING_TIMEOUT`（30 秒），並在錯誤中標出無法連線的上游 URL，因此被阻擋的上游會回傳 JSON 訊息，而不是 load balancer 504 - [PR #38791](https://github.com/BerriAI/litellm/pull/38791)
    - 如同 v1 用戶端已經做的那樣，在 v2 shared-key 與 OpenAPI static 路徑上正規化帶有 scheme 的 `authentication_token`，因此貼上 `Bearer eyJ...` 不再會將 `Bearer Bearer eyJ...` 傳送到上游，而以 `basic` 提供的 `user:pass` 憑證會以 base64 編碼 - [PR #39345](https://github.com/BerriAI/litellm/pull/39345)
    - 在任何上游用戶端建立之前，就拒絕位於 `auth_type: none` 之下的 `username:password@host` MCP URL，並將管理員導向 `auth_type: basic`，而不是送出未驗證請求並顯示一般性的上游 401 - [PR #39926](https://github.com/BerriAI/litellm/pull/39926)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **複雜度路由器（自動路由器）**
    - 新增 `classifier_type: heuristic_v2`，這是一個經校準的本地四層分類器，搭配內建的 UltraFeedback 預設值，無需呼叫分類器模型即可選擇層級；在 Terminal-Bench 子集上，它以 9.78 美元解決了 21 個任務中的 14 個，相較於 heuristic v1 的 21 個中 11 個、花費 14.06 美元 - [PR #39276](https://github.com/BerriAI/litellm/pull/39276)
    - 以 `auto_router` 授權功能衡量自動路由器能力：若沒有它，proxy 會保留一個 `heuristic_v2` router，以及一個帶有操作者定義 `tier_definitions` 或自訂分類器提示詞的 router；超出限制的 config.yaml 將拒絕啟動，而 `/model/new` 會回傳 403；隨附的提示詞、評分準則預設值與 `tier_labels` 保持免費 - [PR #39468](https://github.com/BerriAI/litellm/pull/39468), [PR #39674](https://github.com/BerriAI/litellm/pull/39674)
    - 將無法容納其已分類層級 context window 的提示詞，在派送前升級到能容納它的最低層級，如此長時間的 coding-agent 會話就不再在便宜層級上得到 400；spend 記錄會以原始層級記錄 `context_escalated`，而 `enable_context_window_escalation: false` 會將其關閉 - [PR #38844](https://github.com/BerriAI/litellm/pull/38844)
    - 在 `complexity_router_config` 下新增 `classification_mode: user_turn`，只對新的人工請求進行分類，並在 tool-result 延續時重播該會話保留的決策（記錄為 `user_turn_continuation`）；某項 agentic 基準測試量得分類器呼叫減少 85%，且循環中途沒有模型切換 - [PR #38861](https://github.com/BerriAI/litellm/pull/38861)
    - 新增 `classifier_type: hybrid`，可將 heuristic scorer 的層級維持在任何層次，且只有在分數落在層級邊界 `hybrid_boundary_margin` 內，或未觸發 scorer 訊號時才呼叫 LLM 分類器，並記錄為 `hybrid_short_circuit` - [PR #39403](https://github.com/BerriAI/litellm/pull/39403)
    - 在 `complexity_router_config` 中新增可選用的 `modality_routing: true`，使圖像請求先路由到持有具 vision 能力模型的最近層級，然後 `default_model`，最後才是明確的 400，而不是在純文字層級上遭到提供者拒絕；決策會記錄 `cause: modality_escalation` - [PR #39032](https://github.com/BerriAI/litellm/pull/39032)
    - 新增可選用的 `modality_pin_override`，讓綁定到純文字模型的會話中的圖像回合重新路由到具 vision 能力的模型，同時已儲存的固定綁定仍會保留，因此下一個文字回合會返回原始模型 - [PR #39454](https://github.com/BerriAI/litellm/pull/39454)
    - 讓 LLM 分類器能以可選用的 `classifier_llm_config.vision` 查看請求圖片（`enabled`、`max_images`），且只轉送給宣告 `supports_vision` 的分類器，因此帶有平凡標題的硬截圖會依其內容路由，而僅含圖片的回合也會被分類，而不是落到備援模型上 - [PR #39825](https://github.com/BerriAI/litellm/pull/39825)
    - 在複雜度自動路由器上設定僅供分類器使用的 `reasoning_effort`，其允許值取自分類器模型群組的能力，且在未設定時保留提供者預設值；Test Connection 會在儲存前以此覆寫值探測分類器 - [PR #39372](https://github.com/BerriAI/litellm/pull/39372)
    - 當請求自身的歷史顯示重複的相同 tool 呼叫或重複的 tool 錯誤時，讓停滯的代理程式任務自動升級一個層級（`stall_escalation_enabled`，預設為最近 6 次 tool 呼叫中重複 3 次），預設關閉，且會與 `session_affinity`、`classification_mode: user_turn` 和 `tier_definitions` 一併遭到拒絕 - [PR #39809](https://github.com/BerriAI/litellm/pull/39809)
    - 在 Advanced: Compression 下為自動路由器中的每一跳命名一個壓縮防護欄，一個用於路由決策、一個用於模型呼叫（或不使用），如此分類器與被路由的模型就能獨立壓縮；若兩跳都使用相同防護欄，則只會執行一次壓縮 - [PR #39823](https://github.com/BerriAI/litellm/pull/39823)
    - 為自動路由器分類器設定一次總逾時，且不重試也不備援；明確的 `num_retries: 0` 優先於已設定的重試政策，並在分類器逾時後開啟預設為啟用的 circuit breaker，讓其他會話直接前往 `classifier_fallback` 進行 `circuit_breaker_cooldown_seconds`（預設 30s） - [PR #39696](https://github.com/BerriAI/litellm/pull/39696), [PR #39701](https://github.com/BerriAI/litellm/pull/39701)
    - 當所決定層級的模型之所有部署都已冷卻時，改用同一層級中的即時同儕備援，包含已固定的會話，而不是在綁定到期前回傳 429 `No deployments available`；路由記錄會記錄 `cause: health_failover` 與被替換的模型 - [PR #39675](https://github.com/BerriAI/litellm/pull/39675)
- **陰影評估**
    - 針對團隊與使用者（`team_ids`、`user_ids`，位於 `POST /auto_router/shadow_eval/start`）而非僅針對金鑰，並依每次請求在驗證時解析到的身分進行比對，因此沒有 virtual keys 的 JWT 驗證部署也能對其流量進行 shadow eval；dashboard 的啟始表單新增 Teams 與 Users 選擇器 - [PR #39015](https://github.com/BerriAI/litellm/pull/39015)
    - 透過 `router_names` 在一次 shadow eval 工作中比較最多四個自動路由器，讓每個 sampled request 都執行每個 arm，並將每個 blind 與同一個 live 回應進行判定，並在 dashboard 中提供 `results.by_router` 勝率與 spend，以及每個 router 的比較表 - [PR #39028](https://github.com/BerriAI/litellm/pull/39028)
    - 以 `models` 清單與其金鑰、團隊及使用者目標進行 AND 結合，將 forward shadow eval 工作的範圍限定於模型群組，並依請求的模型群組或別名進行比對；未知名稱會在啟動時以 400 失敗，而 dashboard 的啟始表單新增 Only on models 選擇器 - [PR #39828](https://github.com/BerriAI/litellm/pull/39828)
    - 判定 tool-call 回合，而非捨棄或在其上發生錯誤：tool call 會序列化為文字，judge 會看到兩個 arm 可用的 tools，而空白回覆會以其 `finish_reason` 與模型清楚讀取；目前抽樣 spend 與 agentic 流量上的 `shadow_percentage` 相符 - [PR #39818](https://github.com/BerriAI/litellm/pull/39818)
    - 將 judge 輸出上限從 1500 提高到 4096 tokens，使以較高 reasoning effort 執行的 `judge_model` 不再回傳空白或被截斷的裁決（`unparseable judge verdict`），並在 judge 錯誤列上記錄 `finish_reason`、內容長度與提供的模型 - [PR #39817](https://github.com/BerriAI/litellm/pull/39817)
- **路由**
    - 當不存在 `content_policy_fallbacks` 清單時，在一般 `fallbacks` chain 上啟用 `/v1/messages` safeguard-refusal 備援，因此 dashboard 設定的 fallback row 可在備援模型上復原被標記的請求；已設定的 content-policy 清單仍具權威，而 `disable_fallbacks` 請求會原樣收到拒絕回應 - [PR #39274](https://github.com/BerriAI/litellm/pull/39274)
    - 透過走訪例外的 class hierarchy 來解析 `model_group_retry_policy`，並新增 `ServiceUnavailableErrorRetries` 與 `DefaultRetries` 的 catch-all，讓 `InternalServerErrorRetries` 不再被忽略，且 503、502 與連線錯誤可設定為快速失敗；這兩個欄位都會出現在 Admin UI 的重試設定中 - [PR #35853](https://github.com/BerriAI/litellm/pull/35853)
    - 在請求的 order level 上保留 `order` 備援：沒有匹配項的目標 order 會保持空白，當設定了目標 order 時，prompt-cache 與 deployment affinity 不會鎖定，而每一跳都會清除前一個目標，因此當 `order: 1` Azure deployment 回傳 429 時，`order: 2` Bedrock deployment 會提供服務 - [PR #38969](https://github.com/BerriAI/litellm/pull/38969)
    - 將 `optional_pre_call_checks` 從 `POST /config/update` 作為即時 router 設定套用，可在無需重新啟動的情況下安裝、去重與解除安裝如 `prompt_caching` 等檢查，並對不是 router 設定的鍵回傳 400，而不是錯誤的 200 - [PR #39249](https://github.com/BerriAI/litellm/pull/39249)
    - 在 context-window 的 pre-call 檢查中，針對 Chat Completions、Responses 與 Anthropic Messages 請求以及 Anthropic 最上層的 `system` 區塊計算 `tools`，使 `enable_pre_call_checks` 能在任何提供者呼叫之前，以 `ContextWindowExceededError` 拒絕過大的請求 - [PR #39663](https://github.com/BerriAI/litellm/pull/39663)
    - 在更新或刪除時，從全域 pattern router 中移除萬用字元 deployment，與團隊 pattern routers 的行為一致，如此一來，修正過的 `openai/*` 項目就不會再將一半的請求以 round-robin 方式送到過時的更新前 deployment，直到 pods 重新啟動為止 - [PR #39664](https://github.com/BerriAI/litellm/pull/39664)

- 將部署的 `max_parallel_requests` 佇列保留到串流回應耗盡或關閉為止（`[DONE]`、`aclose()`、用戶端中斷連線、串流中途備援），而不是在上游串流開啟時就釋放，因此上限會套用於串流用戶端 - [PR #39859](https://github.com/BerriAI/litellm/pull/39859)
    - 讓路由器重試回溯資訊按請求保留，且不放入請求快照中，如此在 `--detailed_debug` 下反覆失敗的請求就不會在每次嘗試時變慢，最後導致代理程式掛住 - [PR #39491](https://github.com/BerriAI/litellm/pull/39491)
    - 將在 aiohttp 傳輸層中拋出的 `CancelledError`（連接器在 DNS 查詢途中關閉）對應為可重試的 `httpx.ConnectError`，前提是請求工作本身未被取消，這樣就會套用路由器重試與錯誤對應，而不是直接回傳裸露的 500 `No response returned` - [PR #39240](https://github.com/BerriAI/litellm/pull/39240)
    - 透過 `dispatch_failure_handlers` 協調其餘五個路由器失敗路徑上的非同步與同步失敗處理器，讓同步回呼在非同步回呼完成後於記錄 executor 上執行，而不是在並行的原始執行緒上執行，這被懷疑是回報的 exit 139 當機原因 - [PR #39887](https://github.com/BerriAI/litellm/pull/39887)
- **工作階段親和性**
    - 將 Claude Code 子代理程式透過其前景工作階段所選擇的 Auto Router 路由，並透過 Redis 讀取，讓每個代理程式工作者都遵循最新的主執行緒路由器，因此攜帶具體模型的子代理程式請求會取得路由決策與節省，而不是繞過路由器 - [PR #39239](https://github.com/BerriAI/litellm/pull/39239)
    - 若不存在金鑰雜湊，則以使用者 ID 將 JWT 驗證的呼叫者固定在 `deployment_affinity` 中，且名稱空間與金鑰固定分開，因此 JWT 使用者會像虛擬金鑰呼叫者一樣，在親和性 TTL 期間固定到單一部署 - [PR #39594](https://github.com/BerriAI/litellm/pull/39594)
    - 將 opencode 只帶 `x-session-id` 的標頭辨識為 `session_affinity` 的工作階段 ID，位於明確的 `x-litellm-*` 與供應商範圍標頭之後，如此 opencode 會歸到同一個工作階段下，並待在同一個部署上 - [PR #39802](https://github.com/BerriAI/litellm/pull/39802)
- **快取**
    - 新增 `cache_params.semantic_cache_scope: end_user`，使語意快取命中結果按已驗證的終端使用者隔離，而不是在同一個虛擬金鑰上的所有人之間共用；在 chat、Responses 與 Messages 上可從 `metadata` 與 `litellm_metadata` 讀取，並可從 `/cache/settings` 與 Admin UI 設定 - [PR #39590](https://github.com/BerriAI/litellm/pull/39590)
    - 將 `REDIS_*` 環境變數與 Helm `--set` 字串（例如 `REDIS_HEALTH_CHECK_INTERVAL`）轉型為 redis-py 預期的型別，並透過 redis-py 6.x 裝飾器包裝器探索 Redis 參數，因此透過環境設定的 Redis 快取不再每次操作都因 `TypeError` 而失敗 - [PR #30644](https://github.com/BerriAI/litellm/pull/30644)
    - 將 Redis 逾時與硬性連線失敗分開計數，避免對健康 Redis 的短暫逾時暴增不再打開 circuit breaker；僅逾時的連續失敗要在 `REDIS_CIRCUIT_BREAKER_TIMEOUT_MIN_DURATION`（預設 5s）之後才會開啟，而 breaker 狀態、轉換與失敗會匯出至 Prometheus - [PR #38999](https://github.com/BerriAI/litellm/pull/38999)
    - 避免 Redis Cluster 中某個節點的逾時在 redis-py 8.x 上迫使整個叢集重新初始化拓樸，如此金鑰位於健康節點上的請求就不再被慢節點卡住，而 `litellm_redis_latency` 上限會維持接近 p99 - [PR #39349](https://github.com/BerriAI/litellm/pull/39349)
    - 透過阻塞式 Redis 用戶端讀取同步快取批次（路由冷卻狀態），而不是在 event loop 間重複使用非同步用戶端，對這些讀取保留 circuit-breaker 防護，並在 `litellm_redis_failed_requests_total` 中計入被吞掉的失敗 - [PR #39358](https://github.com/BerriAI/litellm/pull/39358)
- **Proxy 執行階段**
    - 新增每個 worker 的接納控制：設定 `general_settings.max_in_flight_requests_per_worker`（加上 `max_queued_requests_per_worker` 與 `admission_queue_timeout_seconds`）可用即時的 `503 overloaded_error` 與 `retry-after: 1` 拒絕超額請求，探測路徑會繞過此閘門，並新增 `litellm_admission_*` 指標與 `/health/backlog` 欄位 - [PR #39352](https://github.com/BerriAI/litellm/pull/39352)
    - 在啟動時，若沒有 `coordination_redis` 區塊或 `litellm_settings.cache` 設定，則從 `REDIS_HOST`/`REDIS_PORT` 環境變數建立協調用 Redis，如此多副本的預算強制執行與 `/key/{key}/reset_spend` 便會在各個 pod 間生效，而無需額外設定 - [PR #39410](https://github.com/BerriAI/litellm/pull/39410)
    - 當設定 `sse_keepalive_ping_interval_seconds` 時，對 `: ping` SSE keepalive、`/queue/chat/completions`、`/v1/rag/query`、Azure 路由器模型透傳、`/usage/ai/chat` 與 `/policy/templates/enrich/stream` 發送，這樣像 ALB 或 nginx 這類閒置逾時中繼節點就不會在第一個 token 之前切斷連線 - [PR #39273](https://github.com/BerriAI/litellm/pull/39273)
    - 在註冊時保持萬用字元模型註冊表排序，並重用失敗記錄載荷，如此一波無效模型 403 拒絕的 CPU 成本每次拒絕大約可降低 8% 到 15%，有效流量等待也會更少 - [PR #39892](https://github.com/BerriAI/litellm/pull/39892)
    - 當 `force_ipv4: true` 在 httpx 傳輸（`DISABLE_AIOHTTP_TRANSPORT=true`）上執行時，遵循 `HTTP_PROXY`、`HTTPS_PROXY` 與 `NO_PROXY`，如此外連流量就不會在 `AsyncHTTPHandler`、`HTTPHandler` 與 OpenAI 非同步用戶端上繞過代理程式 - [PR #39443](https://github.com/BerriAI/litellm/pull/39443)
- **資料庫**
    - 將 v1 migration resolver 維持為代理程式預設值：#31125 將預設改為 v2，而 #39178 在兩個副本對同一個資料庫啟動時於 `prisma migrate deploy` 發生死鎖後將其還原；v2 仍需透過 `--use_v2_migration_resolver` 或 `USE_V2_MIGRATION_RESOLVER=true` 明確啟用 - [PR #31125](https://github.com/BerriAI/litellm/pull/31125), [PR #39178](https://github.com/BerriAI/litellm/pull/39178)
    - 從並行 `prisma migrate deploy` 死鎖中復原 v2 migration resolver：失敗者回滾並重試，存活者在 `P3009` 或 `P1002` advisory-lock 逾時時重試，而且任何死鎖的 migration 都不會被標記為已套用，因此兩個副本同時啟動時不再需要手動修復 - [PR #39187](https://github.com/BerriAI/litellm/pull/39187)
    - 讓 `prisma migrate deploy` 擁有自己的 `LITELLM_PRISMA_MIGRATE_DEPLOY_TIMEOUT` 預算（預設 600s），而不是每個命令共用 60s 的 `LITELLM_PRISMA_COMMAND_TIMEOUT`，如此重新播放所有 migrations 的全新資料庫就不會再以「Database migration failed after 4 attempts」失敗開機 - [PR #39365](https://github.com/BerriAI/litellm/pull/39365)
    - 當命令逾時時，終止整個 Prisma 程序群組（wrapper、Node 與 schema engine），如此孤兒化的 schema engine 就不會再持有 migration advisory lock 並阻擋之後的每次啟動 - [PR #39466](https://github.com/BerriAI/litellm/pull/39466)
    - 只有在一次通過完全沒有進展時才消耗一次 migrate-deploy 嘗試，因此以 `--use_prisma_db_push` 初次建立的資料庫可以在 `--use_v2_migration_resolver` 下啟動，而不會在處理冪等錯誤復原時耗盡四次嘗試 - [PR #39506](https://github.com/BerriAI/litellm/pull/39506)
    - 預設 `max_idle_connection_lifetime=60` 於 `DATABASE_URL`、`DIRECT_URL` 與讀取複本上啟用，可透過 `database_max_idle_connection_lifetime` 調整，因此 RDS 或 NLB 閒置回收不再表現為 `Error { kind: Closed }` 與安靜時段後的請求卡住 - [PR #39134](https://github.com/BerriAI/litellm/pull/39134)
    - 將 libpq `sslmode=verify-ca`/`verify-full` 與 `sslrootcert=<pem>` 轉換為 Prisma 在每個 DB URL 上使用的 `sslmode=require&sslaccept=strict` 與 `sslcert`，因此掛載的 CA bundle 會真正被驗證（憑證鏈與主機名稱），而不是被默默降級為 `prefer` - [PR #39563](https://github.com/BerriAI/litellm/pull/39563)
- **錯誤處理**
    - 在代理程式回應邊界，將未分類例外訊息中的憑證、檔案系統路徑、內部主機名稱與內嵌 traceback 進行遮罩（完整例外仍會在 `x-litellm-call-id` 下寫入伺服器記錄），並停止送出 `Server: uvicorn` 標頭 - [PR #39380](https://github.com/BerriAI/litellm/pull/39380)
    - 依資料庫 503 是暫時性還是永久性來區分：永久性的 Prisma engine 故障現在會表示部署需要注意，而不是「暫時無法連線，請稍後重試」，適用於 auth、MCP admission、bridge 與 DCR 流程，且 503 狀態保持不變 - [PR #39256](https://github.com/BerriAI/litellm/pull/39256)

- 停止將字面字串 `"None"` 序列化為 `type` 和 `param`，用於 `/v1/chat/completions`、`/v1/responses` 和 `/v1/messages` 的錯誤酬載中；`type` 會回退為狀態碼的錯誤類型（例如 `invalid_request_error`），而 `param` 會變成 JSON `null` - [PR #39521](https://github.com/BerriAI/litellm/pull/39521)
- **Headroom 壓縮**
    - 將擷取到的 `headroom_retrieve`（以及 `mcp__<server>__headroom_retrieve`）工具結果暫緩傳送到壓縮服務，因此執行自己工具迴圈的用戶端不再會把擷取到的內文重新設為相同的 `<<ccr:HASH>>` 並在其上陷入迴圈 - [PR #38591](https://github.com/BerriAI/litellm/pull/38591)
    - 將 Headroom `/v1/compress` 和 `/v1/retrieve` 呼叫設下 60 秒預設逾時，並在防護欄的 `litellm_params` 中遵循 `timeout`，因此停滯的壓縮服務會在一分鐘內失敗，而不是讓請求卡住約十分鐘 - [PR #39527](https://github.com/BerriAI/litellm/pull/39527)
- **Python bridge 和 Rust**
    - 在首次發佈前，將 Rust rollout API 重新命名為單一布林值 `litellm.rust(True)`，並讓 `LITELLM_RUST` 和傳統 OCR 環境旗標都能啟用所有符合資格的 Rust 路由 - [PR #39704](https://github.com/BerriAI/litellm/pull/39704)
    - 在同一處統一 Rust opt-in 與 bridge policy：無法識別或空白的 `LITELLM_RUST` 以及傳統 OCR 值會停用 Rust，而不是在路由期間引發錯誤；明確的請求與程序覆寫則維持優先順序 - [PR #39334](https://github.com/BerriAI/litellm/pull/39334)
    - 在 bridge 的預設 Cargo features 中啟用 ABI3，並將 strip 與 panic policy 放入 release profile，使得 release builds 可在每個平台產生一個 `cp310-abi3` wheel，而無需重寫 manifest，且 PyPI release 維持在接近 200 MB，而不是 900 MB - [PR #39020](https://github.com/BerriAI/litellm/pull/39020)
    - 以共用 helper 強化 bridge 的同步與非同步執行邊界，涵蓋 GIL 釋放、巢狀 runtime 拒絕、訊號輪詢、取消與 panic 對應 - [PR #39332](https://github.com/BerriAI/litellm/pull/39332)
    - 將 bridge 的 `lib.rs` 拆分為錯誤、marshaling、診斷與路由模組，並共用函式追蹤；透過巨集一次宣告同步與非同步路由配對，並讓 `Error` 成為唯一公開的 core error type - [PR #39031](https://github.com/BerriAI/litellm/pull/39031), [PR #39333](https://github.com/BerriAI/litellm/pull/39333), [PR #39331](https://github.com/BerriAI/litellm/pull/39331)
    - 將 `litellm-config` crate 抽出作為閘道的設定載入邊界，並移除低訊號的 GIL 計數器與 `/health/gil` 路由 - [PR #39706](https://github.com/BerriAI/litellm/pull/39706)
    - 以 Python 擁有的策略定義與由 trace 衍生的 unit-test 對應方式重組 Rust/Python 測試 harness，並加入 Rust OCR 回應 metadata、選用參數與 multipart upload plumbing - [PR #39628](https://github.com/BerriAI/litellm/pull/39628)
- **SDK**
    - 恢復 Python 3.10 和 3.14 相容性（透過 `typing_extensions` 的 typing imports、reasoning-summary Pydantic 驗證、遞迴 Prisma types、3.14 上的 uvloop、aware UTC timestamps），並在 3.10 到 3.14 之間執行 unit-test shards - [PR #39399](https://github.com/BerriAI/litellm/pull/39399)
    - 透過將其餘僅限 3.11 的 `typing` imports（`NotRequired`、`assert_never`、`Never`、`Required`）移至 `typing_extensions`，讓 `import litellm` 在 Python 3.10 上可用，並在 CI 中加入 AST 檢查與 3.10 import job - [PR #39448](https://github.com/BerriAI/litellm/pull/39448)
    - 維持 `import litellm` eager：#39121 將 SDK symbols 改為延遲載入，以將 import RSS 從約 225 MB 降到 55 MB，而 #39969 因 `litellm.cost_calculator` 中的循環 imports 與損壞的 Interactions API bridge 而將其回退，因此這個版本沒有淨變更 - [PR #39121](https://github.com/BerriAI/litellm/pull/39121), [PR #39969](https://github.com/BerriAI/litellm/pull/39969)
    - 對於不傳送上游 id 的提供者（例如 GigaChat），在每個串流 chunk 中固定同一個回應 `id`，因此以 chunk id 合併 delta 的用戶端（例如 goose）會只渲染一則訊息，而不是多則 - [PR #38106](https://github.com/BerriAI/litellm/pull/38106)
- **依賴項**
    - 將 tornado 下限提高到 6.5.8，並將 `proxy-runtime` pypdf 下限提高到 6.16.1，以清除六個新的 OSV advisory；將 pypdf 鎖定在 6.16.1 以下的環境將無法解析 - [PR #39188](https://github.com/BerriAI/litellm/pull/39188)
- **一般**
    - 在測試 mock `prisma` 模組時，避免 `PrismaDBExceptionHandler` predicates 引發 `TypeError`；使用真實 prisma 時的 production 行為不變 - [PR #39253](https://github.com/BerriAI/litellm/pull/39253)

## 文件更新 {#documentation-updates}

文件現已移至 [BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs)，因此此時間窗內的文件變更會計入那裡，而不是計入此儲存庫的 PR 集合中。有一項僅限 docstring 的變更已登上 proxy：`spend` 在 `/v2/user/info` 和 `/user/daily/activity` 上的欄位現在被記錄為使用者自己的支出（[PR #38883](https://github.com/BerriAI/litellm/pull/38883)）。

### 依擁有權領域彙總的 PR {#pr-roll-up-by-ownership-area}

原始 rc.1 notes 的各擁有權領域 PR（總計：458）。上方列出的 release-line additions 與這個既有彙總是分開的。

- 其他（CI / chore / tests / build / 版本升級）：87
- 效能：72
- LLM API Endpoints：55
- 驗證與管理：55
- Models 與 Providers：39
- UI：36
- 支出 / 預算 / 費率限制：33
- 記錄：29
- 防護欄：26
- MCP：24
- Prompt 管理：1
- 文件：1

## 端到端測試 {#end-to-end-testing}

我們正大力投入端到端測試，以減少 regression，並讓 LiteLLM 在每個版本之間都更穩定。每個版本都會透過一個 live suite 進行測試，該 suite 會對真實部署的 proxy 執行，並呼叫真實的提供者端點，而不是 mocks，因此我們驗證的行為，就是您在 production 中得到的行為。

這個時間窗新增了 58 個僅限測試的 pull requests，其中 25 個涉及 live e2e suite。Admin UI Playwright suite 擴增最多：現在有八個手動 QA checklist flows 已自動化，而且 SCIM token 建立與驗證、Budgets 頁面、guardrail 建立、測試與刪除、Logs filter drawer、team Settings 分頁，以及 Usage activity 分頁都具備 browser 覆蓋；此外也修復了 seeded passwords、credential polling 與 page-size 選擇，因此多 instance 執行不再因為非 regression 的問題而失敗。在 proxy 端，共用 e2e cells 現在涵蓋 Anthropic `/chat/completions` 串流與工具呼叫、Anthropic、OpenAI 與 Vertex 上的 prompt caching、Cohere embeddings、計費的 `/openai` passthrough、Bedrock batch 取消與列表、逾時重試與 context-window fallback、key spend reset 與 regenerate grace period，以及 Presidio、tool-permission 與 Weave 記錄；而 `/v1/messages` 串流與 background-cancel 個案則以時鐘來判定，因此上游停滯會快速略過，而不是讓執行失敗。新的互動式 harness 會將既有的 e2e SDK tests 同時對 Python 與 Rust gateways 執行，並透過 OCR parity、migration strategy runners、已記錄的提供者 fixtures，以及 python-to-rust parity ledger 來延續。測試品質也有進展：CLAUDE.md 現在要求測試應驗證行為而非程式碼結構，而 dashboard 與 e2e suites 也已全面檢視，以便查詢畫面、依角色選取選項，並在執行時讀取 preset catalog。CI 會在一個 job 中回報每個失敗的測試，而不是在第一個就停止，並在 JUnit report 中記錄每個 e2e test 的來源位置，而 unit shards 則會在 Python 3.10 到 3.14 上執行。完整的測試與 CI pull requests 清單在這些 notes 的底部。

## 新貢獻者 {#new-contributors}

- @cat0825 完成了他們的首次貢獻，見 [PR #34696](https://github.com/BerriAI/litellm/pull/34696)
- @eeshsaxena 完成了他們的首次貢獻，見 [PR #36260](https://github.com/BerriAI/litellm/pull/36260)
- @koladefaj 完成了他們的首次貢獻，見 [PR #30644](https://github.com/BerriAI/litellm/pull/30644)
- @jliounis 完成了他們的首次貢獻，見 [PR #37883](https://github.com/BerriAI/litellm/pull/37883)
- @Timik232 完成了他們的首次貢獻，見 [PR #38106](https://github.com/BerriAI/litellm/pull/38106)
- @georgeatparallel 完成了他們的首次貢獻，見 [PR #38113](https://github.com/BerriAI/litellm/pull/38113)
- @yatishgoel 完成了他們的首次貢獻，見 [PR #38479](https://github.com/BerriAI/litellm/pull/38479)
- @QuantumBreakz 完成了他們的首次貢獻，見 [PR #38591](https://github.com/BerriAI/litellm/pull/38591)
- @Lee-Si-Yoon 完成了他們的首次貢獻，見 [PR #38880](https://github.com/BerriAI/litellm/pull/38880)
- @seanyasno-af 完成了他們的首次貢獻，見 [PR #38898](https://github.com/BerriAI/litellm/pull/38898)
- @samtsai15 完成了他們的首次貢獻，見 [PR #38940](https://github.com/BerriAI/litellm/pull/38940)
- @rakeshrepository 完成了他們的首次貢獻，見 [PR #39561](https://github.com/BerriAI/litellm/pull/39561)
- @amasen02 完成了他們的首次貢獻，見 [PR #39729](https://github.com/BerriAI/litellm/pull/39729)

## CI、測試與內部例行維護 {#ci-tests-and-internal-housekeeping}

這些 pull request 不面向客戶。之所以列在這裡，是為了讓上方的計數能與完整更新日誌對齊，並在彙總中歸類為其他項目。

- **Admin UI 端到端涵蓋範圍** - Playwright 測試套件自動化八個手動 QA 檢查清單流程，並新增 SCIM token 建立與驗證、預算頁面、防護欄建立、測試與刪除、Logs 篩選抽屜、團隊 Settings 分頁，以及 Usage 活動分頁的涵蓋，並修正種子密碼、憑證輪詢、搜尋預留位置與表格頁面大小，讓多實例執行不再因非回歸問題失敗 - [PR #39025](https://github.com/BerriAI/litellm/pull/39025), [PR #39027](https://github.com/BerriAI/litellm/pull/39027), [PR #39052](https://github.com/BerriAI/litellm/pull/39052), [PR #39053](https://github.com/BerriAI/litellm/pull/39053), [PR #39056](https://github.com/BerriAI/litellm/pull/39056), [PR #39058](https://github.com/BerriAI/litellm/pull/39058), [PR #39061](https://github.com/BerriAI/litellm/pull/39061), [PR #39063](https://github.com/BerriAI/litellm/pull/39063), [PR #39073](https://github.com/BerriAI/litellm/pull/39073), [PR #39442](https://github.com/BerriAI/litellm/pull/39442), [PR #39678](https://github.com/BerriAI/litellm/pull/39678), [PR #39934](https://github.com/BerriAI/litellm/pull/39934)
- **Proxy 端到端涵蓋範圍** - 新的 shared-proxy e2e cells 涵蓋 Anthropic `/chat/completions` 串流與工具呼叫、Anthropic、OpenAI 與 Vertex 的提示快取、Cohere embeddings、計費的 `/openai` 傳遞、Bedrock batch 取消與列出、重試逾時與 context-window 備援、金鑰支出重設與重新產生寬限期，以及 Presidio、工具權限與 Weave 記錄；同時 `/v1/messages` 串流與背景取消現在以時鐘判定，因此上游卡住會更快略過 - [PR #39055](https://github.com/BerriAI/litellm/pull/39055), [PR #39197](https://github.com/BerriAI/litellm/pull/39197), [PR #39279](https://github.com/BerriAI/litellm/pull/39279), [PR #39617](https://github.com/BerriAI/litellm/pull/39617), [PR #39804](https://github.com/BerriAI/litellm/pull/39804), [PR #39847](https://github.com/BerriAI/litellm/pull/39847), [PR #39916](https://github.com/BerriAI/litellm/pull/39916), [PR #39917](https://github.com/BerriAI/litellm/pull/39917), [PR #39920](https://github.com/BerriAI/litellm/pull/39920), [PR #39938](https://github.com/BerriAI/litellm/pull/39938), [PR #39946](https://github.com/BerriAI/litellm/pull/39946), [PR #39953](https://github.com/BerriAI/litellm/pull/39953)
- **以行為為先的測試斷言** - CLAUDE.md 現在要求測試檢查行為，而非程式碼結構；dashboard 與 e2e 測試套件也已全面調整為查詢畫面、依角色選取 select 選項、斷言 DataTable 行為而不是 DOM 結構，並在執行期讀取 preset catalog - [PR #38772](https://github.com/BerriAI/litellm/pull/38772), [PR #39016](https://github.com/BerriAI/litellm/pull/39016), [PR #39082](https://github.com/BerriAI/litellm/pull/39082), [PR #39084](https://github.com/BerriAI/litellm/pull/39084), [PR #39085](https://github.com/BerriAI/litellm/pull/39085), [PR #39175](https://github.com/BerriAI/litellm/pull/39175), [PR #39478](https://github.com/BerriAI/litellm/pull/39478)
- **Rust 與 Python 等價性 harness** - 互動式 harness 現在會將既有 e2e SDK 測試同時執行於 Python 與 Rust gateway，上面透過 migration strategy runners、記錄的提供者 fixture、Mistral 轉換涵蓋、python-to-rust 等價性帳本、完整 Rust 單元測試等價性，以及書面的 harness 結構來建立 OCR 等價性 - [PR #38765](https://github.com/BerriAI/litellm/pull/38765), [PR #39419](https://github.com/BerriAI/litellm/pull/39419), [PR #39425](https://github.com/BerriAI/litellm/pull/39425), [PR #39434](https://github.com/BerriAI/litellm/pull/39434), [PR #39456](https://github.com/BerriAI/litellm/pull/39456), [PR #39463](https://github.com/BerriAI/litellm/pull/39463), [PR #39482](https://github.com/BerriAI/litellm/pull/39482), [PR #39689](https://github.com/BerriAI/litellm/pull/39689)
- **型別與技術債清理** - 約 7,000 個基於 basedpyright `Any` 的錯誤已在約 370 個後端檔案中清除，並逐步下調上限，8 月 29 日至 9 月 4 日的新技術債時段也已清理，已移除已失效的 `get_api_key` provider-key resolver，且 dashboard 的 inline-object lint 預算已回到其上限之下 - [PR #36722](https://github.com/BerriAI/litellm/pull/36722), [PR #37778](https://github.com/BerriAI/litellm/pull/37778), [PR #38796](https://github.com/BerriAI/litellm/pull/38796), [PR #39104](https://github.com/BerriAI/litellm/pull/39104), [PR #39461](https://github.com/BerriAI/litellm/pull/39461), [PR #38884](https://github.com/BerriAI/litellm/pull/38884), [PR #39091](https://github.com/BerriAI/litellm/pull/39091), [PR #39518](https://github.com/BerriAI/litellm/pull/39518), [PR #39260](https://github.com/BerriAI/litellm/pull/39260), [PR #39856](https://github.com/BerriAI/litellm/pull/39856)
- **CI 基礎架構** - CI 現在會回報作業中每一個失敗的測試，而不是在第一個就停止，會在 JUnit 報告中記錄每個 e2e 測試的來源位置，會建置並測試 Rust ai-gateway server 功能，會透過映像檔的 ui-builder 階段執行 UI 建置檢查，將 setup-uv 鎖定至 v10.0.1，授予 release wheel reporter `pull_requests` 寫入權限，並在三天寬限期後關閉重複議題 - [PR #39772](https://github.com/BerriAI/litellm/pull/39772), [PR #39209](https://github.com/BerriAI/litellm/pull/39209), [PR #39246](https://github.com/BerriAI/litellm/pull/39246), [PR #39493](https://github.com/BerriAI/litellm/pull/39493), [PR #39496](https://github.com/BerriAI/litellm/pull/39496), [PR #39111](https://github.com/BerriAI/litellm/pull/39111), [PR #39922](https://github.com/BerriAI/litellm/pull/39922), [PR #38381](https://github.com/BerriAI/litellm/pull/38381)
- **依賴與版本升級** - litellm 升級到 1.101.0，litellm-enterprise 從 0.1.62 -> 0.1.65，litellm-proxy-extras 從 0.4.91 -> 0.4.94，分三次升級完成；browserslist 升到 4.28.8 以通過 osv-scan，且 Admin UI bundle 已為此次發行重新建置 - [PR #39140](https://github.com/BerriAI/litellm/pull/39140), [PR #39595](https://github.com/BerriAI/litellm/pull/39595), [PR #39912](https://github.com/BerriAI/litellm/pull/39912), [PR #39142](https://github.com/BerriAI/litellm/pull/39142), [PR #39959](https://github.com/BerriAI/litellm/pull/39959)
- **測試修復與去 flaky** - 長期失敗與 flaky 的單元測試已修復或去 flaky（JWT tamper、fuzzy picker、tag routing、liveliness、redis stall burst、MCP registry、team race、timeout 與 migrate-deploy harness 等），fake 也已針對 Bedrock KB `router` 與 `embedding_executor` kwargs、OpenAI 對未知模型的 404，以及 CrowdStrike 去重後的 end-of-stream 掃描更新；已移除洩漏的 module-global guardrail mapping 與 EOL Cohere 模型，並補上 `NO_DOCS`/`NO_REDOC`/`NO_OPENAPI`、router configured-mode lookup、New Relic per-team routing，以及未知模型 spend log 400 的涵蓋 - [PR #39770](https://github.com/BerriAI/litellm/pull/39770), [PR #39932](https://github.com/BerriAI/litellm/pull/39932), [PR #38891](https://github.com/BerriAI/litellm/pull/38891), [PR #39306](https://github.com/BerriAI/litellm/pull/39306), [PR #39611](https://github.com/BerriAI/litellm/pull/39611), [PR #39583](https://github.com/BerriAI/litellm/pull/39583), [PR #39773](https://github.com/BerriAI/litellm/pull/39773), [PR #39669](https://github.com/BerriAI/litellm/pull/39669), [PR #39673](https://github.com/BerriAI/litellm/pull/39673), [PR #39185](https://github.com/BerriAI/litellm/pull/39185), [PR #38863](https://github.com/BerriAI/litellm/pull/38863), [PR #39074](https://github.com/BerriAI/litellm/pull/39074), [PR #39420](https://github.com/BerriAI/litellm/pull/39420), [PR #39472](https://github.com/BerriAI/litellm/pull/39472), [PR #39502](https://github.com/BerriAI/litellm/pull/39502), [PR #39457](https://github.com/BerriAI/litellm/pull/39457), [PR #39467](https://github.com/BerriAI/litellm/pull/39467), [PR #39543](https://github.com/BerriAI/litellm/pull/39543), [PR #39608](https://github.com/BerriAI/litellm/pull/39608), [PR #39378](https://github.com/BerriAI/litellm/pull/39378), [PR #39630](https://github.com/BerriAI/litellm/pull/39630), [PR #39634](https://github.com/BerriAI/litellm/pull/39634), [PR #39659](https://github.com/BerriAI/litellm/pull/39659), [PR #38857](https://github.com/BerriAI/litellm/pull/38857), [PR #39842](https://github.com/BerriAI/litellm/pull/39842)

## 完整更新日誌 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.100.0...v1.101.0
