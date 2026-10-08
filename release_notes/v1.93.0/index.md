---
title: "v1.93.0 - GPT-5.6、Client-Forwarded MCP Credentials 與 Meta Model API"
slug: "v1-93-0"
date: 2026-07-18T00:00:00
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
docker.litellm.ai/berriai/litellm:1.93.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.93.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**當金鑰達到支出上限時，現在會被節流而不是撤銷。** 超出預算的金鑰會被速率限制，而不是直接失去存取權，因此依賴在上限時硬性封鎖的工作流程，將會看到請求變慢而不是被拒絕。請參閱 [PR #31300](https://github.com/BerriAI/litellm/pull/31300)。

**OpenTelemetry 錯誤詳細資料鍵已移至 `litellm.*` 命名空間下。** 錯誤 span 現在會將 litellm 錯誤詳細資料放在 `litellm.*` 下，而不是先前的鍵，因此儀表板和查詢若參考舊屬性名稱，將不再符合。請參閱 [PR #32591](https://github.com/BerriAI/litellm/pull/32591)。

:::

## 重點亮點 {#key-highlights}

- **GPT-5.6 與更多新模型** - OpenAI GPT-5.6（`sol` / `terra` / `luna`）在 OpenAI 和 Azure 上提供第 0 天定價與中繼資料、xAI Grok-4.5、OpenAI Realtime 2.1（以及 `-mini`）、Google Cloud Chirp 3 語音轉文字，以及 Bedrock Claude Opus 4.8 的 `jp` 區域推論設定檔。
- **Meta Model API 提供者** - 一個新的相容 OpenAI 的提供者（`meta`），在聊天完成、`muse-spark-1.1` 與 Responses 中第 0 天提供 `/v1/messages`。
- **Client-forwarded MCP 憑證** - 新的 `true_passthrough` 與 `oauth_delegate` 驗證模式，加上 `dcr_bridge` sealed-envelope 路徑，讓用戶端可持有自己的上游 MCP 憑證，並在授權兩端都強制使用 PKCE S256，且上游探索會繫結到每個伺服器。
- **shadcn / Base UI 儀表板遷移** - 共用的 DataTable、圖表（recharts）以及全高側邊欄外殼改用 Base UI 原語，並重新設計帳號選單與可重用的篩選／欄位可見性控制。
- **更智慧的複雜度路由器** - 關鍵字層級覆寫、語意關鍵字比對、可選的以 LLM 為基礎分類器，以及自動路由器的逐決策路由記錄。

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新的提供者（1 個新提供者） {#new-providers-1-new-provider}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Meta Model API (`meta`) | 聊天完成、`/v1/messages`、Responses | 相容 OpenAI 的 Meta Model API 提供者，於第 0 天提供 `muse-spark-1.1` - [PR #32701](https://github.com/BerriAI/litellm/pull/32701) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（31 筆新定價項目） {#new-model-support-31-new-pricing-entries}

| 提供者 | 模型 | Context Window | 輸入（每 100 萬 token） | 輸出（每 100 萬 token） | 功能 |
| --- | --- | --- | --- | --- | --- |
| OpenAI | `gpt-5.6`（以及 `-sol` / `-terra` / `-luna`） | 1.05M | $5.00（`terra` $2.50，`luna` $1.00） | $30.00（`terra` $15.00，`luna` $6.00） | 推理、視覺、函式呼叫、提示快取、PDF 輸入、網頁搜尋 |
| Azure | `azure/gpt-5.6`（以及 `us` / `eu` 區域 + `-sol` / `-terra` / `-luna`） | 1.05M | $5.00 | $30.00 | 推理、視覺、函式呼叫、提示快取、PDF 輸入、網頁搜尋 |
| Azure | `azure/{us,eu}/gpt-5.4`、`azure/{us,eu}/gpt-5.5`（data-zone + 長上下文） | 1.05M | $2.75 / $5.50 | $16.50 / $33.00 | 推理、視覺、函式呼叫、提示快取、PDF 輸入 |
| OpenAI | `gpt-realtime-2.1`、`gpt-realtime-2.1-mini` | 128K | $4.00 / $0.60 | $24.00 / $2.40 | 音訊輸入／輸出、函式呼叫 |
| xAI | `xai/grok-4.5`、`xai/grok-4.5-latest` | 500K | $2.00 | $6.00 | 推理、視覺、函式呼叫、網頁搜尋 |
| Meta | `meta/muse-spark-1.1` | 1.05M | $1.25 | $4.25 | 推理、視覺、函式呼叫、提示快取、PDF 輸入、網頁搜尋 |
| Amazon Bedrock | `jp.anthropic.claude-opus-4-8` | 1M | $5.50 | $27.50 | 推理、電腦使用、視覺、PDF 輸入、自適應思考 |
| Google Vertex AI | `vertex_ai/chirp_3`（語音轉文字） | n/a | $0.00026667 / sec | n/a | 音訊轉錄 |

GPT-5.6 在 OpenAI 和 Azure 上提供 priority、flex、batch，以及高於 272k 的長上下文定價層級 - [PR #32659](https://github.com/BerriAI/litellm/pull/32659), [PR #32678](https://github.com/BerriAI/litellm/pull/32678). Azure `gpt-5.4` / `gpt-5.5` 新增了 data-zone 與長上下文項目 - [PR #32279](https://github.com/BerriAI/litellm/pull/32279)，而 Bedrock 區域推論設定檔現在會在 `get_model_info` 中解析為其區域定價 - [PR #32389](https://github.com/BerriAI/litellm/pull/32389)。

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增 GPT-5.6（`sol` / `terra` / `luna`）定價與中繼資料 - [PR #32659](https://github.com/BerriAI/litellm/pull/32659)
    - 新增 `gpt-realtime-2.1` 模型與區域處理加成 - [PR #32387](https://github.com/BerriAI/litellm/pull/32387)
    - 將 `verbosity` 參數轉送至聊天完成提供者 - [PR #32254](https://github.com/BerriAI/litellm/pull/32254)
- **[Azure](../../docs/providers/azure)**
    - 新增 Azure GPT-5.6（`sol` / `terra` / `luna`）定價與中繼資料 - [PR #32678](https://github.com/BerriAI/litellm/pull/32678)
    - 新增 Azure data-zone 與長上下文定價，用於 `gpt-5.4` / `gpt-5.5` - [PR #32279](https://github.com/BerriAI/litellm/pull/32279)
- **[xAI](../../docs/providers/xai)**
    - 新增 `xai/grok-4.5` 定價與中繼資料 - [PR #32549](https://github.com/BerriAI/litellm/pull/32549)
- **[Meta](../../docs/providers/meta)**
    - 新增 Meta Model API 提供者與 `muse-spark-1.1`，於第 0 天提供 - [PR #32701](https://github.com/BerriAI/litellm/pull/32701)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 將 `jp.anthropic.claude-opus-4-8` 新增至模型成本對照表 - [PR #32840](https://github.com/BerriAI/litellm/pull/32840)
    - 保留 `clear_tool_uses_20250919` context-management 編輯並輸出 Claude Invoke 的 `context-management-2025-06-27` beta 版 - [PR #32658](https://github.com/BerriAI/litellm/pull/32658)
    - 將對應的 Claude 4.8+ 項目標記為 `supports_mid_conversation_system` - [PR #32882](https://github.com/BerriAI/litellm/pull/32882)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 新增 Google Cloud Speech-to-Text Chirp 3 轉錄支援 - [PR #32274](https://github.com/BerriAI/litellm/pull/32274)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將 adaptive thinking/effort 轉譯為 pre-4.6 模型支援，並將真正的提供者傳遞通過 capability probes - [PR #32867](https://github.com/BerriAI/litellm/pull/32867), [PR #32874](https://github.com/BerriAI/litellm/pull/32874)
    - 透過在查找候選項中移除 `@version` 後綴，將 `@default` Vertex AI 模型解析為 adaptive thinking - [PR #32833](https://github.com/BerriAI/litellm/pull/32833)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 保留 stream 參數，並為 Bedrock Mantle 串流解碼 SSE - [PR #32141](https://github.com/BerriAI/litellm/pull/32141)
    - 當 invoke Messages 串流結束且沒有 `message_stop` 時，發出 SSE 錯誤事件 - [PR #32159](https://github.com/BerriAI/litellm/pull/32159)
    - 在 strip-and-retry 重簽時，防止過期的 SigV4 標頭覆蓋新的簽章 - [PR #32371](https://github.com/BerriAI/litellm/pull/32371)
    - 在訊息層級的快取點上遵守 `cache_control` ttl - [PR #32538](https://github.com/BerriAI/litellm/pull/32538), [PR #32551](https://github.com/BerriAI/litellm/pull/32551)
    - 在 Claude Invoke 中保留對話中途的系統訊息，並以模型支援為條件 - [PR #32578](https://github.com/BerriAI/litellm/pull/32578), [PR #32831](https://github.com/BerriAI/litellm/pull/32831)
    - 在即時處理常式中遵守 AWS 驗證參數 - [PR #32275](https://github.com/BerriAI/litellm/pull/32275)
    - 將 AWS 憑證 kwargs 傳遞到 `litellm_params`，以便 chat -> Responses 橋接保留 Web Identity Federation 驗證 - [PR #32956](https://github.com/BerriAI/litellm/pull/32956)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 當自訂 `api_base` 沒有 path 時，建立完整請求路徑 - [PR #32367](https://github.com/BerriAI/litellm/pull/32367)
    - 對具有自訂 `api_base` 的 openai-path partner models 直接回傳 `create_vertex_url` 結果 - [PR #32380](https://github.com/BerriAI/litellm/pull/32380)
    - 傳遞即時健康檢查參數 - [PR #32550](https://github.com/BerriAI/litellm/pull/32550)
- **[Azure](../../docs/providers/azure)**
    - 使用 query string 之前的路徑建立 responses `input_items` url - [PR #32270](https://github.com/BerriAI/litellm/pull/32270)
- **[Anthropic](../../docs/providers/anthropic)**
    - 在對 pre-4.6 模型於 `/v1/messages` 降級 adaptive thinking 時，移除不相容的釘選 `temperature` - [PR #33244](https://github.com/BerriAI/litellm/pull/33244)
- **一般**
    - 在串流 `/v1/messages` 回應時，傳遞提供者回應標頭 - [PR #32160](https://github.com/BerriAI/litellm/pull/32160)
    - 將回應內的錯誤載荷顯示於 OpenAI 相容串流中 - [PR #32237](https://github.com/BerriAI/litellm/pull/32237)
    - 在 DB 來源模型中全面解析 `os.environ/` 參照 - [PR #32405](https://github.com/BerriAI/litellm/pull/32405)
    - 停止每個請求的自訂定價覆蓋共用 `model_cost` 定價 - [PR #32163](https://github.com/BerriAI/litellm/pull/32163)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 在 responses 橋接中保留 Codex CLI 的自訂工具往返與 allowlist - [PR #32258](https://github.com/BerriAI/litellm/pull/32258)
    - 在 chat -> responses 用量轉譯過程中保留 `reasoning_tokens` - [PR #32837](https://github.com/BerriAI/litellm/pull/32837)
- **[轉發](/docs/pass_through/intro)**
    - 串流非 SSE 的 pass-through 回應，而不是將它們緩衝在記憶體中 - [PR #32386](https://github.com/BerriAI/litellm/pull/32386)
- **一般**
    - 合併 websearch 工具參數 - [PR #32162](https://github.com/BerriAI/litellm/pull/32162)
    - 在第一個 chunk 上標記 `completion_start_time`，適用於 `/v1/messages` 和 `/v1/responses` - [PR #32284](https://github.com/BerriAI/litellm/pull/32284)

#### 錯誤修正 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 將 response-id 編碼改為冪等，以防止重複編碼 - [PR #32034](https://github.com/BerriAI/litellm/pull/32034)
    - 將取消時的上游 4xx 對應為用戶端錯誤而非 500，並在 get 時顯示上游錯誤狀態 - [PR #32271](https://github.com/BerriAI/litellm/pull/32271), [PR #32287](https://github.com/BerriAI/litellm/pull/32287)
    - 在串流內錯誤事件上拋出 `APIError`，並將 `ErrorEventError.param` 擴充為可接受 dict - [PR #32835](https://github.com/BerriAI/litellm/pull/32835)
    - 停止將同步 `success_handler` 與 `async_success_handler` 同時排程 - [PR #32239](https://github.com/BerriAI/litellm/pull/32239)
    - 為 `input_items` 後續請求解密 response ids - [PR #32269](https://github.com/BerriAI/litellm/pull/32269)
- **[重新排序](../../docs/rerank)**
    - 以 debug 記錄 `optional_rerank_params`，使請求內容不會寫入記錄 - [PR #32533](https://github.com/BerriAI/litellm/pull/32533)
- **一般**
    - 在 pass-through 中停止讓請求參數覆蓋合併後的目標查詢參數 - [PR #32404](https://github.com/BerriAI/litellm/pull/32404)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **UI（shadcn / Base UI 遷移）**
    - 將 shadcn primitives 從 Radix 切換到 Base UI - [PR #32124](https://github.com/BerriAI/litellm/pull/32124)
    - 新增共用可組合 DataTable，並以 shadcn table primitives 重新設計，包含篩選抽屜、欄位可見性與搜尋 - [PR #32680](https://github.com/BerriAI/litellm/pull/32680), [PR #32209](https://github.com/BerriAI/litellm/pull/32209), [PR #32856](https://github.com/BerriAI/litellm/pull/32856)
    - 以 tremor 相容包裝器建立 shadcn 圖表基礎，並將 caching、projects、activity、usage 與 per-user 圖表轉換為 shadcn/recharts - [PR #32668](https://github.com/BerriAI/litellm/pull/32668), [PR #32721](https://github.com/BerriAI/litellm/pull/32721), [PR #32722](https://github.com/BerriAI/litellm/pull/32722), [PR #32725](https://github.com/BerriAI/litellm/pull/32725), [PR #32726](https://github.com/BerriAI/litellm/pull/32726), [PR #32729](https://github.com/BerriAI/litellm/pull/32729)
    - 全高度側邊欄外殼，包含以內容為範圍的頂部列、重新設計的帳號選單，以及共用 CopyButton - [PR #32793](https://github.com/BerriAI/litellm/pull/32793), [PR #32931](https://github.com/BerriAI/litellm/pull/32931), [PR #32945](https://github.com/BerriAI/litellm/pull/32945)
    - 型別化的 openapi-fetch 基礎（`fetchClient`），並附帶第一個型別化呼叫端 - [PR #29884](https://github.com/BerriAI/litellm/pull/29884)
- **儀表板**
    - 管理儀表板上的企業授權到期橫幅 - [PR #32540](https://github.com/BerriAI/litellm/pull/32540)
    - 請求記錄與 session 側邊欄的 session id 篩選及 duration/start-time 排序 - [PR #32568](https://github.com/BerriAI/litellm/pull/32568), [PR #32432](https://github.com/BerriAI/litellm/pull/32432)
    - models 頁面的成本最佳化回饋橫幅 - [PR #32174](https://github.com/BerriAI/litellm/pull/32174)
    - 在 server 建立與編輯表單中顯示 MCP `max_concurrent_requests` - [PR #32397](https://github.com/BerriAI/litellm/pull/32397)
    - 將 gateway 麵包屑根節點設在 AI Gateway 選擇器中 - [PR #32886](https://github.com/BerriAI/litellm/pull/32886)
    - 端到端支援 Redis URL 與 Database Index UI 欄位 - [PR #32075](https://github.com/BerriAI/litellm/pull/32075)
- **驗證與管理**
    - 可由 org admins 存取的 RESTful `PATCH /team/{team_id}`，採用 JSON merge patch 語意 - [PR #32883](https://github.com/BerriAI/litellm/pull/32883)
    - 當 token 沒有 team claims 時，JWT 驗證會回退到 DB team memberships - [PR #31356](https://github.com/BerriAI/litellm/pull/31356)
    - 針對 Claude Code `apiKeyHelper` 支援的 `lite auth print-token` - [PR #32846](https://github.com/BerriAI/litellm/pull/32846)
    - 新增 `expires` 篩選器至 `GET /key/list` - [PR #32953](https://github.com/BerriAI/litellm/pull/32953)
    - 使 Microsoft Graph 端點可為 GCC High 設定 - [PR #32517](https://github.com/BerriAI/litellm/pull/32517)

#### 錯誤修正 {#bugs-1}

- **UI**
    - 將 key models 下拉選單選項範圍限制為 key 的 team - [PR #32382](https://github.com/BerriAI/litellm/pull/32382)
    - 載入時反映已保存的「在 Spend Logs 中儲存 Prompts」切換設定 - [PR #32145](https://github.com/BerriAI/litellm/pull/32145)
    - 防止 reasoning 區塊擴展 chat playground 版面配置 - [PR #32485](https://github.com/BerriAI/litellm/pull/32485)
    - 將 Virtual Keys 的「Key Hash」篩選標籤重新命名為「Key ID」 - [PR #32672](https://github.com/BerriAI/litellm/pull/32672)
    - 在 UI primitives 中傳遞 refs，並在 ref 被吞掉時使測試失敗 - [PR #32401](https://github.com/BerriAI/litellm/pull/32401)
    - 在 lite CLI 中移除 `--base-url` 的尾端斜線 - [PR #32845](https://github.com/BerriAI/litellm/pull/32845)
- **驗證與管理**
    - 在 SSO callback 中顯示 OAuth 錯誤參數 - [PR #32433](https://github.com/BerriAI/litellm/pull/32433)
    - 從 `team_id` 解析 team org，讓 org admins 能更新 team budgets - [PR #32560](https://github.com/BerriAI/litellm/pull/32560)
    - 在 DB 來源模型中，遵守所有 AWS 驗證參數的 `os.environ/` 參照 - [PR #32256](https://github.com/BerriAI/litellm/pull/32256)
    - 在寫入 spend logs 之前，先對以 Bearer 開頭的 API 金鑰進行雜湊 - [PR #31799](https://github.com/BerriAI/litellm/pull/31799)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 在串流 LLM span 上標記 `gen_ai.response.time_to_first_chunk` - [PR #32236](https://github.com/BerriAI/litellm/pull/32236)
    - 在失敗的 LLM 請求上發出 `gen_ai.client.operation.exception` 事件，並在 v2 錯誤 span 上還原 `error.*` span 屬性 - [PR #32655](https://github.com/BerriAI/litellm/pull/32655), [PR #32524](https://github.com/BerriAI/litellm/pull/32524)
    - 將 litellm 錯誤詳細鍵移到 `litellm.*` 命名空間下 - [PR #32591](https://github.com/BerriAI/litellm/pull/32591)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 當 gauges 為 NoOpMetric 時，略過預算指標的 DB/快取查詢 - [PR #32834](https://github.com/BerriAI/litellm/pull/32834)
- **[DataDog](../../docs/proxy/logging#datadog)**
    - 主動拆分記錄批次，以維持在 intake payload 限制以下 - [PR #32860](https://github.com/BerriAI/litellm/pull/32860)
- **一般**
    - 將 `allm_passthrough_route` 分類為 async，以防止重複的成功回呼 - [PR #32265](https://github.com/BerriAI/litellm/pull/32265)
    - 在串流 ModifyResponseException 路徑中，於 `post_call_failure_hook` 將其彈出前先擷取 `logging_obj` - [PR #32665](https://github.com/BerriAI/litellm/pull/32665)

### 防護欄 {#guardrails}

- **[Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 在 `pre_mcp_call` / `during_mcp_call` 模式中掃描 MCP 工具呼叫 - [PR #32296](https://github.com/BerriAI/litellm/pull/32296)
    - 對僅供參考的附件直接傳遞並搭配 `skip_unscannable_attachments`，並移除附件數量上限 - [PR #33554](https://github.com/BerriAI/litellm/pull/33554)
- **[內容篩選](/docs/proxy/guardrails/quick_start)**
    - 為 Content Filter 新增 `pre_mcp_call` 支援 - [PR #32936](https://github.com/BerriAI/litellm/pull/32936)
- **[CrowdStrike AIDR](/docs/proxy/guardrails/quick_start)**
    - 僅傳送自上次助理輪次以來的新訊息 - [PR #31974](https://github.com/BerriAI/litellm/pull/31974)
- **[GraySwan](/docs/proxy/guardrails/quick_start)**
    - 傳遞 GraySwan scan id 標頭 - [PR #32544](https://github.com/BerriAI/litellm/pull/32544)
- **一般**
    - 在共用內容輔助函式中走訪 Responses-API 文字分類 - [PR #32542](https://github.com/BerriAI/litellm/pull/32542)
    - 透過為 Bedrock guardrails 提高 `ModifyResponseException` 來遵循 `disable_exception_on_block` - [PR #32289](https://github.com/BerriAI/litellm/pull/32289)
    - 匹配多模式 `guardrail_mode`，且不產生 false-COMPLIANT 結果 - [PR #32832](https://github.com/BerriAI/litellm/pull/32832)
    - 依提供者篩選 Add-Guardrail 模式下拉選單 - [PR #32712](https://github.com/BerriAI/litellm/pull/32712)
    - 在持久化前遮罩內嵌於 `guardrail_response` 中的認證資料 - [PR #32687](https://github.com/BerriAI/litellm/pull/32687)
    - 在 headroom guardrail 上記錄真實的 token/壓縮統計 - [PR #32158](https://github.com/BerriAI/litellm/pull/32158)

### 密鑰管理器 {#secret-managers}

- **一般**
    - 強化外部 secret-manager 名稱驗證 - [PR #32092](https://github.com/BerriAI/litellm/pull/32092)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預算**
    - 在達到支出上限後節流金鑰，而不是撤銷存取權 - [PR #31300](https://github.com/BerriAI/litellm/pull/31300)
    - 從 `team_id` 解析 team org，以便 org 管理員可以更新 team 預算 - [PR #32560](https://github.com/BerriAI/litellm/pull/32560)
- **速率限制**
    - 在單一金鑰上依標籤進行 RPM 限制 - [PR #31502](https://github.com/BerriAI/litellm/pull/31502)
    - 在 router 上分離 ITPM/OTPM 部署速率限制 - [PR #31952](https://github.com/BerriAI/litellm/pull/31952)
    - 在本機速率限制錯誤時觸發 gateway 備援 - [PR #31788](https://github.com/BerriAI/litellm/pull/31788)
    - 在串流的標準記錄物件中填入 `x-ratelimit-*` 剩餘/限制值 - [PR #32711](https://github.com/BerriAI/litellm/pull/32711)
- **成本追蹤**
    - 為 Dashscope 分層定價強制執行預算與成本追蹤 - [PR #32942](https://github.com/BerriAI/litellm/pull/32942)
    - 在批次成本工作中正確為 Anthropic pass-through 訊息批次定價 - [PR #32307](https://github.com/BerriAI/litellm/pull/32307)
    - 在 `group_by=team` 時，依 `team_id` 篩選 `/global/spend/report` - [PR #32170](https://github.com/BerriAI/litellm/pull/32170)
    - 在 logs UI 中加總多輪對話工作階段成本，並限制 logs 分頁標籤的分頁數量 - [PR #32796](https://github.com/BerriAI/litellm/pull/32796), [PR #31825](https://github.com/BerriAI/litellm/pull/31825)
    - 遵循 `store_prompts_in_spend_logs` 用於 `guardrail_information` - [PR #32688](https://github.com/BerriAI/litellm/pull/32688)

## MCP 閘道 {#mcp-gateway}

- **客戶端轉送認證（`true_passthrough` / `oauth_delegate` / `dcr_bridge`）**
    - 新增 `true_passthrough` 和 `oauth_delegate` auth 模式，且上游 OAuth discovery 綁定到每個 server - [PR #31989](https://github.com/BerriAI/litellm/pull/31989), [PR #32414](https://github.com/BerriAI/litellm/pull/32414)
    - 新增 `dcr_bridge` 欄位與配套、用於客戶端持有認證資料的 sealed-envelope 模組，以及 discovery facade 與 register/token 轉送，並強制使用 PKCE S256 - [PR #32745](https://github.com/BerriAI/litellm/pull/32745), [PR #32748](https://github.com/BerriAI/litellm/pull/32748), [PR #32753](https://github.com/BerriAI/litellm/pull/32753), [PR #32747](https://github.com/BerriAI/litellm/pull/32747)
    - 透過單一 envelope bearer 允許 `dcr_bridge` `oauth_delegate` 用戶端，並提供 key derivation 的消費者輔助函式 - [PR #32824](https://github.com/BerriAI/litellm/pull/32824), [PR #32794](https://github.com/BerriAI/litellm/pull/32794)
    - 在客戶端轉送的直通工具呼叫上轉送上游 401 - [PR #32556](https://github.com/BerriAI/litellm/pull/32556)
- **OAuth 2.0（On-Behalf-Of）**
    - 透過 REST API 與儀表板支援 `oauth2_token_exchange` auth type，並可在 UI 與 API 中選擇 `entra_obo` token_exchange profile - [PR #31772](https://github.com/BerriAI/litellm/pull/31772), [PR #31983](https://github.com/BerriAI/litellm/pull/31983), [PR #32144](https://github.com/BerriAI/litellm/pull/32144)
    - 在建立時明確保留 `oauth2_flow`，於啟動時回填舊版 null 列，並從 DB 列逐字讀取 - [PR #32288](https://github.com/BerriAI/litellm/pull/32288), [PR #32290](https://github.com/BerriAI/litellm/pull/32290), [PR #32292](https://github.com/BerriAI/litellm/pull/32292)
    - 在 MCP 編輯頁面新增 OAuth flow 選擇器 - [PR #32298](https://github.com/BerriAI/litellm/pull/32298)
    - 將輸出端並行限制套用到 OBO 工具呼叫 - [PR #32071](https://github.com/BerriAI/litellm/pull/32071)
- **語意篩選器**
    - 將語意篩選器套用到展開的 `litellm_proxy` 工具，並顯示被篩除的數量 - [PR #32285](https://github.com/BerriAI/litellm/pull/32285)
    - 在篩選回應標頭中完整保留工具名稱 - [PR #32282](https://github.com/BerriAI/litellm/pull/32282)
    - 在語意篩選器 context-window 錯誤時採用失敗即封閉並顯示錯誤 - [PR #32715](https://github.com/BerriAI/litellm/pull/32715)
- **錯誤修正**
    - 將回傳 `isError=true` 的 MCP 工具呼叫記錄為失敗 - [PR #32238](https://github.com/BerriAI/litellm/pull/32238)
    - 當 proxy origin 不再符合其已註冊的 `redirect_uri` 時，重新註冊 DCR 用戶端 - [PR #32527](https://github.com/BerriAI/litellm/pull/32527)
    - 當會影響 mint 的欄位變更時，讓瀏覽器授權的上游 token 失效 - [PR #32652](https://github.com/BerriAI/litellm/pull/32652)
    - 延後 proxy 匯入，使 `completion(tools=...)` 在沒有 proxy extras 的情況下也可運作 - [PR #32339](https://github.com/BerriAI/litellm/pull/32339)
    - 別名/顯示名稱工具路由、REST 篩選器與 BYOK auth - [PR #32320](https://github.com/BerriAI/litellm/pull/32320)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **路由**
    - 為複雜度自動 router 提供關鍵字層級覆寫與語意關鍵字比對 - [PR #32859](https://github.com/BerriAI/litellm/pull/32859)
    - 為複雜度 router 提供可選的 LLM-based classifier，外加自訂技術關鍵字與每次決策的路由記錄 - [PR #32169](https://github.com/BerriAI/litellm/pull/32169), [PR #32262](https://github.com/BerriAI/litellm/pull/32262), [PR #32943](https://github.com/BerriAI/litellm/pull/32943)
- **可靠性**
    - 當 client 已斷線時，恢復 Prisma DB 重新連線迴圈 - [PR #32323](https://github.com/BerriAI/litellm/pull/32323)
    - 獨立於 response cache 設定 coordination Redis，並從 `REDIS_*` env 建立 usage cache - [PR #32661](https://github.com/BerriAI/litellm/pull/32661), [PR #32635](https://github.com/BerriAI/litellm/pull/32635)
    - 僅在 connection-pool kwargs 中 ssl 為 truthy 時才使用 `SSLConnection` - [PR #32825](https://github.com/BerriAI/litellm/pull/32825)
    - 在 gateway route trim 中保留 Prometheus `/metrics` Mount - [PR #32317](https://github.com/BerriAI/litellm/pull/32317)
    - 將 `general_settings` request allowlist 連接到 litellm globals - [PR #32243](https://github.com/BerriAI/litellm/pull/32243)
- **熱路徑**
    - 在請求熱路徑上對缺少的 user/key 查詢做負值快取 - [PR #32368](https://github.com/BerriAI/litellm/pull/32368)
    - 停止 `CacheCodec` 在快取往返時丟棄 null 欄位 - [PR #32207](https://github.com/BerriAI/litellm/pull/32207)

- 直接從成本對應表而非逐模型路由器彙總來源 `/v1/models` 權杖限制，移除萬用字元深度複製 - [PR #33721](https://github.com/BerriAI/litellm/pull/33721)
    - 將格式錯誤的已設定權杖限制視為 `/v1/models` 上不存在 - [PR #33864](https://github.com/BerriAI/litellm/pull/33864)
- **建置**
    - 在執行階段映像中還原 litellm-proxy-extras 來源目錄 - [PR #33592](https://github.com/BerriAI/litellm/pull/33592)
    - 將 prisma CLI 和 engines 烘焙到固定路徑，以便全新資料庫遷移可離線適用於任何 uid - [PR #33853](https://github.com/BerriAI/litellm/pull/33853)
    - 將 requires-python 上限提高至 `<3.15`，使 Python 3.14 能安裝目前版本 - [PR #33438](https://github.com/BerriAI/litellm/pull/33438)
    - 允許 redisvl、pypdf 和 openapi-core 在 Python 3.14 上使用 - [PR #33801](https://github.com/BerriAI/litellm/pull/33801)
    - 將 pyo3 提升至 0.29，使原生橋接可在 Python 3.14 上編譯 - [PR #33798](https://github.com/BerriAI/litellm/pull/33798)
    - 將 ddtrace 更新至 4.x 系列 - [PR #33484](https://github.com/BerriAI/litellm/pull/33484)
    - 將 mcp 升級至 1.28.1、pillow 升級至 12.3.0，並固定 httplib2/setuptools 下限 - [PR #33803](https://github.com/BerriAI/litellm/pull/33803), [PR #33093](https://github.com/BerriAI/litellm/pull/33093), [PR #33233](https://github.com/BerriAI/litellm/pull/33233)

## 文件更新 {#documentation-updates}

- 引導 OSS 貢獻者前往每日 OSS 分支 - [PR #32830](https://github.com/BerriAI/litellm/pull/32830)

### 依擁有權區域彙整的 PR {#pr-roll-up-by-ownership-area}

依擁有權區域劃分的 PR（總計：254）

- 其他（CI / chore / tests / refactors / version bumps）：65
- UI：42
- MCP：36
- 模型與提供者：33
- 效能：14
- 花費 / 預算 / 費率限制：13
- LLM API 端點：15
- 防護欄：11
- 驗證與管理：9
- 記錄：9
- 文件：6
- 密鑰管理員：1

## 新貢獻者 {#new-contributors}

- @thibault-linktree 完成了他們的首次貢獻，見 [PR #32034](https://github.com/BerriAI/litellm/pull/32034)
- @akapur99 完成了他們的首次貢獻，見 [PR #32829](https://github.com/BerriAI/litellm/pull/32829)

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.92.0...v1.93.0
