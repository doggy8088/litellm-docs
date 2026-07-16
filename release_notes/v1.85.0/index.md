---
title: "v1.85.0 - Realtime GA、MCP Gateway 擴充與加固的多租戶"
slug: "v1-85-0"
date: 2026-05-16T00:00:00
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
docker.litellm.ai/berriai/litellm:1.85.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.85.0
```

</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

- **OpenAI Realtime GA** — 對 GA 版 OpenAI Realtime API 的一級支援（同時相容 beta），包含 `gpt-realtime-2` 計價與 `/openai/v1/realtime` 記錄。
- **加固的多租戶** — 大範圍修正各租戶的範圍控管，涵蓋金鑰、專案、批次、檔案、MCP 伺服器與分析端點（project-hijack/key-org 隔離、service-account 資源隔離、按實體的 team/agent 活動範圍）。
- **MCP Gateway 擴充** — 組織層級的 MCP 伺服器/工具集權限、OBO（on-behalf-of）MCP 驗證、`delegate_auth_to_upstream` PKCE passthrough，以及 MCP 存取群組名稱命名空間。
- **可觀測性大修** — 廣泛的 Prometheus 修正（標籤數量正確性、end-user cardinality 上限、PromQL 跳脫）、OTEL handler 隔離 + GenAI 訊息內容擷取，以及解耦的 S3 稽核記錄設定。
- **新模型** — xAI `grok-4.3` / `grok-4.3-latest`、OpenAI `gpt-realtime-2`、OpenRouter `qwen/qwen3.6-plus`、SambaNova `MiniMax-M2.7`，以及 Bedrock Z.AI `GLM-5`。

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（5 個新模型） {#new-model-support-5-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| OpenAI | `gpt-realtime-2` | 32K | $4.00（audio in $32.00） | $16.00（audio out $64.00） | Realtime（`/v1/realtime`）、audio in/out、function calling、parallel tool calls |
| xAI | `xai/grok-4.3` | 1M | $1.25（>200K：$2.50） | $2.50（>200K：$5.00） | Reasoning、vision、prompt caching、response schema、web search、tool calling |
| xAI | `xai/grok-4.3-latest` | 1M | $1.25（>200K：$2.50） | $2.50（>200K：$5.00） | Reasoning、vision、prompt caching、response schema、web search、tool calling |
| OpenRouter | `openrouter/qwen/qwen3.6-plus` | 1M | $0.325 | $1.95 | Reasoning、vision、function calling、tool choice |
| SambaNova | `sambanova/MiniMax-M2.7` | 204.8K | $0.30 | $1.20 | Reasoning、function calling、tool choice |

既有項目的價格/中繼資料也已更新：Gemini multimodal-embedding 計價重新指向 Vertex 計價來源，包含 image/audio/video 的單位成本，realtime/Gemini 項目的 audio token 成本降低，以及 `gemini-embedding-2-preview` 成本對齊。

- xAI grok-4.3 / grok-4.3-latest 中繼資料 - [PR #27154](https://github.com/BerriAI/litellm/pull/27154)、[PR #27396](https://github.com/BerriAI/litellm/pull/27396)
- OpenAI gpt-realtime-2 計價 - [PR #27653](https://github.com/BerriAI/litellm/pull/27653)
- OpenRouter Qwen 3.6 Plus 中繼資料 - [PR #27486](https://github.com/BerriAI/litellm/pull/27486)
- 新聊天模型中繼資料 + Bedrock Z.AI GLM-5 - [PR #27313](https://github.com/BerriAI/litellm/pull/27313)、[PR #24338](https://github.com/BerriAI/litellm/pull/24338)
- GPT-4o-Transcribe 計價修正 - [PR #27875](https://github.com/BerriAI/litellm/pull/27875)

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 轉送 `output_config.effort`、以 400 拒絕垃圾 `reasoning_effort`，並在 `reasoning_effort="none"` 時省略 thinking/output_config - [PR #27074](https://github.com/BerriAI/litellm/pull/27074)、[PR #27039](https://github.com/BerriAI/litellm/pull/27039)
    - 新增 Bedrock Claude Platform 路由 - [PR #27678](https://github.com/BerriAI/litellm/pull/27678)
    - 注入 dummy tool 而不含 `modify_params` - [PR #27620](https://github.com/BerriAI/litellm/pull/27620)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 Z.AI GLM-5 模型支援 - [PR #24338](https://github.com/BerriAI/litellm/pull/24338)
    - 在 Converse API 訊息轉換中處理 document content blocks - [PR #24644](https://github.com/BerriAI/litellm/pull/24644)
    - 重構回應串流形狀處理 - [PR #27257](https://github.com/BerriAI/litellm/pull/27257)
- **[Vertex AI](../../docs/providers/vertex)**
    - 為 publisher model ID 提供 Model Garden OpenAPI 支援 - [PR #26076](https://github.com/BerriAI/litellm/pull/26076)
    - 在 `cachedContent` 設定時省略 `system_instruction`/`tools`/`toolConfig` - [PR #26077](https://github.com/BerriAI/litellm/pull/26077)
- **[Gemini](../../docs/providers/gemini)**
    - Gemini 3 thinking 追隨提供者預設值 - [PR #25764](https://github.com/BerriAI/litellm/pull/25764)
    - 處理不需擷取的 Gemini Files API URI - [PR #24922](https://github.com/BerriAI/litellm/pull/24922)
    - 在原生 `generateContent` 上正規化 `response_schema` - [PR #27775](https://github.com/BerriAI/litellm/pull/27775)
- **[xAI](../../docs/providers/xai)**
    - 將 `parallel_tool_calls` 新增至支援的參數 - [PR #25106](https://github.com/BerriAI/litellm/pull/25106)
- **[Azure](../../docs/providers/azure)**
    - 使用 token 向 Azure 驗證 - [PR #27556](https://github.com/BerriAI/litellm/pull/27556)
    - Azure Sentinel 稽核記錄支援 - [PR #27280](https://github.com/BerriAI/litellm/pull/27280)
- **一般**
    - `gpt-5.5` reasoning-effort 能力旗標 + `supports_low_reasoning_effort` - [PR #26456](https://github.com/BerriAI/litellm/pull/26456)
    - 將 `litellm.completion` 支援的參數與 proxy model 資訊對齊 - [PR #27720](https://github.com/BerriAI/litellm/pull/27720)

#### 錯誤修正 {#bug-fixes}

- **[OpenRouter](../../docs/providers/openrouter)**
    - 移除模型名稱前綴 `openrouter/` - [PR #24282](https://github.com/BerriAI/litellm/pull/24282)
- **[Azure](../../docs/providers/azure)**
    - 將 `api_version` 轉送給 Azure AI Foundry v1 端點的 `aembedding()` - [PR #24911](https://github.com/BerriAI/litellm/pull/24911)
    - 依解碼後的 deployment 路由 Azure container 檔案請求 - [PR #26402](https://github.com/BerriAI/litellm/pull/26402)
- **[Anthropic](../../docs/providers/anthropic)** / **[Vertex](../../docs/providers/vertex)**
    - 修正 Vertex Anthropic 串流狀態錯誤卡住問題 - [PR #27310](https://github.com/BerriAI/litellm/pull/27310)
    - 修正 Anthropic 串流 reasoning token 使用量 - [PR #27319](https://github.com/BerriAI/litellm/pull/27319)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 在 Fireworks API 呼叫前從聊天訊息中移除 `thinking_blocks` - [PR #27881](https://github.com/BerriAI/litellm/pull/27881)
- **[hosted vLLM](../../docs/providers/vllm)**
    - 為 chat completions 正規化自訂工具 - [PR #25763](https://github.com/BerriAI/litellm/pull/25763)
- **一般**
    - 在 `model_file_id_mapping` 無法使用時解碼統一的 `file_id` - [PR #27406](https://github.com/BerriAI/litellm/pull/27406)
    - 將 `output_config` 傳遞給接受它的後端 - [PR #26439](https://github.com/BerriAI/litellm/pull/26439)
    - 從 deployment 解析多提供者預設設定的提供者 - [PR #27517](https://github.com/BerriAI/litellm/pull/27517)
    - 當目標模型不健康或 DB 中斷連線時，從 `/health` 回傳 `503` - [PR #27003](https://github.com/BerriAI/litellm/pull/27003)
    - 保護具 URL 值的模型目的地，並對齊 resource-model 驗證檢查 - [PR #26915](https://github.com/BerriAI/litellm/pull/26915)、[PR #26963](https://github.com/BerriAI/litellm/pull/26963)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[即時 API](../../docs/realtime)**
    - OpenAI Realtime GA 支援與 beta 相容性 - [PR #27110](https://github.com/BerriAI/litellm/pull/27110)
    - 將 `/openai/v1/realtime` 新增至路由以供記錄 - [PR #27323](https://github.com/BerriAI/litellm/pull/27323)
- **[回應 API](../../docs/response_api)**
    - 從快取中儲存並重播串流式 Responses API 請求 - [PR #24580](https://github.com/BerriAI/litellm/pull/24580)
    - 將 `gpt-5.4+` chat-without-tools 路由至 Responses API - [PR #27618](https://github.com/BerriAI/litellm/pull/27618)
    - 在 Responses → Chat Completion 轉換中保留 `cache_control` - [PR #27727](https://github.com/BerriAI/litellm/pull/27727)
    - 針對 completions→responses 橋接標準化 chat `tool_choice` - [PR #27634](https://github.com/BerriAI/litellm/pull/27634)
- **[批次](../../docs/batches)**
    - Bedrock batch model-invocation 工作取得 - [PR #26834](https://github.com/BerriAI/litellm/pull/26834)
    - 將 Vertex AI batch prediction 輸出轉換為 OpenAI 格式 - [PR #25627](https://github.com/BerriAI/litellm/pull/25627)
    - 依 OpenAI 規格在批次錯誤項目上設定 `response=null` - [PR #27041](https://github.com/BerriAI/litellm/pull/27041)
- **[嵌入](../../docs/embedding/supported_embedding)**
    - 預設 OpenAI 路徑 `encoding_format` 為 `float` - [PR #26976](https://github.com/BerriAI/litellm/pull/26976)
    - 將多模態輸入的 embeddings 與透過巢狀輸入的組合式多模態 embeddings 分開 - [PR #24337](https://github.com/BerriAI/litellm/pull/24337), [PR #24341](https://github.com/BerriAI/litellm/pull/24341)
- **[音訊轉錄](../../docs/audio_transcription)**
    - 新增 NVIDIA Riva STT 提供者 - [PR #27185](https://github.com/BerriAI/litellm/pull/27185)
- **[向量儲存](../../docs/vector_stores)**
    - 在請求時解析 embedding 設定，絕不儲存認證資訊 - [PR #27082](https://github.com/BerriAI/litellm/pull/27082)
    - 收緊受管理儲存區的存取 - [PR #26930](https://github.com/BerriAI/litellm/pull/26930)

#### 錯誤 {#bugs}

- **一般**
    - 保留 Bedrock `/v1/messages` 上下文管理的 `compact_20260112` - [PR #27534](https://github.com/BerriAI/litellm/pull/27534)
    - 修正當路由器解析單一 deployment dict 時的受管理檔案 `model_mappings` - [PR #26950](https://github.com/BerriAI/litellm/pull/26950)
    - 在 Azure deployment image-gen / image-edit 主體中省略 `model` - [PR #27103](https://github.com/BerriAI/litellm/pull/27103)
    - 修正 Bedrock passthrough call-ID 標頭 - [PR #27412](https://github.com/BerriAI/litellm/pull/27412)
    - 在 model-group 切換時，將 Responses API affinity 固定到 Azure 資源 - [PR #27703](https://github.com/BerriAI/litellm/pull/27703)
    - 將 `vertex_ai/gemini-embedding-2-preview` 成本與 Vertex multimodal 定價對齊 - [PR #27848](https://github.com/BerriAI/litellm/pull/27848)
    - 合併 batch + dynamic limiter 檢查/遞增 - [PR #26954](https://github.com/BerriAI/litellm/pull/26954)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 團隊的批次金鑰更新 - [PR #26468](https://github.com/BerriAI/litellm/pull/26468)
    - 將「Default」金鑰類型重新命名為「Full Access」並重新排序下拉選單 - [PR #27218](https://github.com/BerriAI/litellm/pull/27218)
    - 在金鑰 Overview 標題列新增 `Expires`；將 User 合併為單一欄位 - [PR #27696](https://github.com/BerriAI/litellm/pull/27696)
- **團隊與模型**
    - 依團隊 ID 與名稱一起搜尋團隊 - [PR #27684](https://github.com/BerriAI/litellm/pull/27684)
    - 在用量頁面為管理員使用者新增「您的用量」檢視 - [PR #26746](https://github.com/BerriAI/litellm/pull/26746)
    - 在 UI 中新增 Vertex AI Search 作為 vector-store 提供者 - [PR #27790](https://github.com/BerriAI/litellm/pull/27790)
    - Logs 時間範圍中的「Last Minute」快速選取 - [PR #27446](https://github.com/BerriAI/litellm/pull/27446)
    - 將缺少的 Z.AI (`zai`) 提供者新增至 Add-Model 下拉選單 - [PR #26419](https://github.com/BerriAI/litellm/pull/26419)
- **SSO / 驗證**
    - 路由覆寫的 JWT 範圍 + 萬用字元支援，並在未範圍化警告下進行 issuer 驗證 - [PR #26325](https://github.com/BerriAI/litellm/pull/26325), [PR #27008](https://github.com/BerriAI/litellm/pull/27008)
    - Grafana Cloud Pyroscope 驗證 - [PR #26902](https://github.com/BerriAI/litellm/pull/26902)
    - 在 `/sso/debug/callback` 中顯示完整的 IdP 聲明 - [PR #27498](https://github.com/BerriAI/litellm/pull/27498)

#### 錯誤 — 存取範圍與正確性 {#bugs--access-scoping--correctness}

- **多租戶隔離**
    - 依實體為 project、key-org、team 與 agent-activity 查詢設定範圍；在非管理員分析中拒絕 `user_id=None`；在 `/user/info` 重新解析查詢後重新驗證 `user_id` - [PR #27011](https://github.com/BerriAI/litellm/pull/27011), [PR #27014](https://github.com/BerriAI/litellm/pull/27014), [PR #26929](https://github.com/BerriAI/litellm/pull/26929), [PR #27009](https://github.com/BerriAI/litellm/pull/27009)
    - 限制雲端儲存檔案路徑與批次檔案模型存取 - [PR #27019](https://github.com/BerriAI/litellm/pull/27019), [PR #27015](https://github.com/BerriAI/litellm/pull/27015)
    - 將受管理資源與 service-account API 金鑰隔離 - [PR #27004](https://github.com/BerriAI/litellm/pull/27004)
    - 收緊資源擁有權檢查與敏感公開端點防護 - [PR #26951](https://github.com/BerriAI/litellm/pull/26951), [PR #26912](https://github.com/BerriAI/litellm/pull/26912)
- **授權強化**
    - 封鎖 proxy 管理員檢視者缺少的寫入路由；恢復 Logs + Settings 上管理員檢視者的讀取一致性 - [PR #27007](https://github.com/BerriAI/litellm/pull/27007), [PR #26846](https://github.com/BerriAI/litellm/pull/26846)
    - 將上游 URL 路徑識別碼編碼；要求受信任代理程式用於標頭識別驗證 - [PR #26860](https://github.com/BerriAI/litellm/pull/26860), [PR #26825](https://github.com/BerriAI/litellm/pull/26825)
    - 將通用 SSO 狀態繫結至 session cookie；允許非管理員 compliance-path 讀取 - [PR #26944](https://github.com/BerriAI/litellm/pull/26944), [PR #27234](https://github.com/BerriAI/litellm/pull/27234)
- **金鑰 / 團隊 / SCIM**
    - 當團隊限制模型時遵守 `key access_group_ids`；在團隊篩選與同名 deployment 路由中解析 access-group 名稱 - [PR #26275](https://github.com/BerriAI/litellm/pull/26275), [PR #25224](https://github.com/BerriAI/litellm/pull/25224), [PR #26161](https://github.com/BerriAI/litellm/pull/26161)
    - 當 SCIM 取消佈建使用者時撤銷虛擬金鑰；修正 SCIM 使用者查找篩選條件 - [PR #26861](https://github.com/BerriAI/litellm/pull/26861), [PR #27308](https://github.com/BerriAI/litellm/pull/27308)
    - 金鑰輪替錯誤修正；在 `/key/list` 上遵守 `team_member_permissions` - [PR #27756](https://github.com/BerriAI/litellm/pull/27756), [PR #27026](https://github.com/BerriAI/litellm/pull/27026)
    - `/config/update` 針對各區段寫入（移除 `store_model_in_db` 閘道） - [PR #26643](https://github.com/BerriAI/litellm/pull/26643)
    - 將 CLI 儲存的 token 範圍限制為 `base_url`；在錯誤追蹤中從 URL 查詢參數遮罩 Gemini API key - [PR #26945](https://github.com/BerriAI/litellm/pull/26945), [PR #24943](https://github.com/BerriAI/litellm/pull/24943)
- **UI 修正**
    - 從登入頁面移除不安全的 `?token=` URL 處理常式；在建立受邀使用者的 session 之前清除管理員 session cookie；在 `teamInfoCall` 中將 `team_id` 進行 URL 編碼 - [PR #26924](https://github.com/BerriAI/litellm/pull/26924), [PR #27227](https://github.com/BerriAI/litellm/pull/27227), [PR #27466](https://github.com/BerriAI/litellm/pull/27466)
    - 內部使用者的 Project 下拉選單為空白（3 個 bug）；移除 access-group model 下拉選單前方的空白首項；當未變更時，在 key 編輯儲存中省略 `allowed_routes` - [PR #26664](https://github.com/BerriAI/litellm/pull/26664), [PR #27521](https://github.com/BerriAI/litellm/pull/27521), [PR #27553](https://github.com/BerriAI/litellm/pull/27553)
    - Member/team access-group 修正；team model 測試連線授權 - [PR #27317](https://github.com/BerriAI/litellm/pull/27317), [PR #27487](https://github.com/BerriAI/litellm/pull/27487)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Prometheus](../../docs/proxy/prometheus)**
    - 修正自訂中繼資料標籤計數，限制終端使用者指標基數，修正剩餘指標零值，為 PromQL 字串常值逸出 `api_key`，為 Bedrock 與 Vertex 發出 `litellm_remaining_tokens_metric` - [PR #27268](https://github.com/BerriAI/litellm/pull/27268), [PR #27272](https://github.com/BerriAI/litellm/pull/27272), [PR #27348](https://github.com/BerriAI/litellm/pull/27348), [PR #27013](https://github.com/BerriAI/litellm/pull/27013), [PR #27705](https://github.com/BerriAI/litellm/pull/27705)
    - 修正 `/metrics` 當 `require_auth_for_metrics_endpoint` 為 true 且驗證成功時卡住的問題；將 `/metrics` 401 指向退出選項旗標；修正 litellm 端拒絕的指標標籤 - [PR #25980](https://github.com/BerriAI/litellm/pull/25980), [PR #27502](https://github.com/BerriAI/litellm/pull/27502), [PR #26947](https://github.com/BerriAI/litellm/pull/26947)
- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 分離雙重 OTEL 處理器；遵循 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`；修正 proxy 整合追蹤錯誤 - [PR #27018](https://github.com/BerriAI/litellm/pull/27018), [PR #27403](https://github.com/BerriAI/litellm/pull/27403), [PR #27757](https://github.com/BerriAI/litellm/pull/27757)
- **[Arize](../../docs/observability/arize_integration)** / **LangSmith**
    - Arize `_set_usage_outputs` 可處理原始 OpenAI Pydantic `CompletionUsage`；移除 LangSmith 中不需要的中繼資料資訊 - [PR #26506](https://github.com/BerriAI/litellm/pull/26506), [PR #26894](https://github.com/BerriAI/litellm/pull/26894)
- **一般**
    - 透過 `s3_audit_callback_params` 解耦 S3 稽核記錄設定 - [PR #27222](https://github.com/BerriAI/litellm/pull/27222)
    - 在 `verbose_logger` 等級於 `LITELLM_LOG=INFO` 時設定；在 `/team/{id}/callback` 上要求團隊管理角色；關閉回呼設定與可觀測性憑證側通道；保護動態整合主機 - [PR #26401](https://github.com/BerriAI/litellm/pull/26401), [PR #26819](https://github.com/BerriAI/litellm/pull/26819), [PR #27081](https://github.com/BerriAI/litellm/pull/27081), [PR #26921](https://github.com/BerriAI/litellm/pull/26921)

### 防護欄 {#guardrails}

- **一般**
    - 新增 Qohash Nexus 防護欄掛鉤 - [PR #24927](https://github.com/BerriAI/litellm/pull/24927)
    - 在串流請求上執行模型層級 `post_call` 防護欄；確保呼叫後防護欄只觸發一次 - [PR #26922](https://github.com/BerriAI/litellm/pull/26922), [PR #27012](https://github.com/BerriAI/litellm/pull/27012), [PR #26109](https://github.com/BerriAI/litellm/pull/26109)
    - 在 Presidio 輸出遮罩中保留 Responses 事件串流 - [PR #26878](https://github.com/BerriAI/litellm/pull/26878)
    - 涵蓋多模態 + Responses API 內容形狀；收緊工具權限檢查；在整合式防護欄輸入中可選擇略過工具訊息 - [PR #26957](https://github.com/BerriAI/litellm/pull/26957), [PR #26969](https://github.com/BerriAI/litellm/pull/26969), [PR #27441](https://github.com/BerriAI/litellm/pull/27441)
    - 在 Team UI 中處理 `metadata.guardrails` 的舊版 dict 形狀 - [PR #27224](https://github.com/BerriAI/litellm/pull/27224)

### 提示詞管理 {#prompt-management}

- **一般**
    - 封鎖 BitBucket / Arize Phoenix / AssemblyAI 用戶端中的路徑遍歷；在 GitLab/Arize/BitBucket 提示詞管理器中沙箱化 jinja2 - [PR #26943](https://github.com/BerriAI/litellm/pull/26943), [PR #27043](https://github.com/BerriAI/litellm/pull/27043)

### 密鑰管理員 {#secret-managers}

- **一般**
    - 稽核記錄 `/cache/settings` 與 `/config_overrides/hashicorp_vault` 變更 - [PR #26953](https://github.com/BerriAI/litellm/pull/26953)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **速率限制**
    - 原子性 TPM 速率限制；在優先速率限制 429 錯誤中包含模型名稱 + 設定的 TPM/RPM - [PR #27001](https://github.com/BerriAI/litellm/pull/27001), [PR #27216](https://github.com/BerriAI/litellm/pull/27216)
    - 在整合檢視中從會員預算載入團隊成員 RPM/TPM - [PR #24925](https://github.com/BerriAI/litellm/pull/24925)
- **預算**
    - 當保留量涵蓋計數器時略過個人預算掛鉤 - [PR #27021](https://github.com/BerriAI/litellm/pull/27021)
    - 將 `0` `team_member_budget` 視為無上限；在沒有使用者資料列時仍強制執行團隊成員預算；正確重設 org/tag/proxy 預算 - [PR #27133](https://github.com/BerriAI/litellm/pull/27133), [PR #27273](https://github.com/BerriAI/litellm/pull/27273), [PR #27326](https://github.com/BerriAI/litellm/pull/27326), [PR #27488](https://github.com/BerriAI/litellm/pull/27488)
    - 在成功記錄後，將虛擬金鑰 `model_max` 預算支出清空到 Redis；收緊預算支出准入 - [PR #27334](https://github.com/BerriAI/litellm/pull/27334), [PR #26845](https://github.com/BerriAI/litellm/pull/26845)
- **標籤預算與路由**
    - 對 `x-litellm-tags` 標頭請求強制執行標籤預算；標籤預算重設會移除過期的管理快取項目；將 `x-litellm-tags` 與靜態團隊/金鑰標籤聯集；修正內部標籤使用範圍；一律將呼叫端提供的標籤合併到請求中繼資料 - [PR #27573](https://github.com/BerriAI/litellm/pull/27573), [PR #27568](https://github.com/BerriAI/litellm/pull/27568), [PR #27247](https://github.com/BerriAI/litellm/pull/27247), [PR #27315](https://github.com/BerriAI/litellm/pull/27315), [PR #27784](https://github.com/BerriAI/litellm/pull/27784)
    - 標籤路由測試，防止嚴格純文字標籤遭 header-regex 繞過 - [PR #26805](https://github.com/BerriAI/litellm/pull/26805)
- **支出記錄 / 成本**
    - 透過 Azure 與 Azure AI 成本計算傳遞 `service_tier` - [PR #24926](https://github.com/BerriAI/litellm/pull/24926)
    - 可選擇抑制支出追蹤錯誤記錄中的堆疊追蹤；批次失敗後持續執行支出記錄清理；在 `error_information` 中遮罩回傳的提示詞；防止 `secret_fields` 洩漏到支出記錄中；從請求本文中移除由用戶端提供的定價欄位 - [PR #26899](https://github.com/BerriAI/litellm/pull/26899), [PR #27303](https://github.com/BerriAI/litellm/pull/27303), [PR #27689](https://github.com/BerriAI/litellm/pull/27689), [PR #27143](https://github.com/BerriAI/litellm/pull/27143), [PR #27071](https://github.com/BerriAI/litellm/pull/27071)

## MCP 閘道 {#mcp-gateway}

- **功能**
    - 組織層級 MCP 伺服器與工具集權限 - [PR #26960](https://github.com/BerriAI/litellm/pull/26960)
    - OBO（on-behalf-of）MCP 驗證 - [PR #27421](https://github.com/BerriAI/litellm/pull/27421)
    - PKCE 傳遞的 `delegate_auth_to_upstream` 旗標 - [PR #27834](https://github.com/BerriAI/litellm/pull/27834)
    - 在以 URL 為基礎的命名空間中支援 MCP 存取群組名稱 - [PR #27726](https://github.com/BerriAI/litellm/pull/27726)
- **錯誤**
    - 將工具名稱清理為 Anthropic 的 `[a-zA-Z0-9_-]{1,128}` 模式 - [PR #26788](https://github.com/BerriAI/litellm/pull/26788)
    - 在 OAuth discovery 上接受 `X-Forwarded-*` 前，要求受信任 proxy 閘道；保留工具路由的 oauth2 m2m 驗證；在 OpenAPI/本機登錄路徑上執行 `pre_call_tool_check` - [PR #26841](https://github.com/BerriAI/litellm/pull/26841), [PR #26871](https://github.com/BerriAI/litellm/pull/26871), [PR #27016](https://github.com/BerriAI/litellm/pull/27016)
    - 為非管理員檢視者遮罩 MCP 伺服器 URL/標頭；將使用者 API 金鑰驗證改為 MCP 伺服器建立的授權或 cookie - [PR #27027](https://github.com/BerriAI/litellm/pull/27027), [PR #27190](https://github.com/BerriAI/litellm/pull/27190)
    - 修正 MCP DB 重新載入部分失敗；在 token-forwarding MCP 伺服器上顯示上游 401 - [PR #27314](https://github.com/BerriAI/litellm/pull/27314), [PR #27847](https://github.com/BerriAI/litellm/pull/27847)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **路由與可靠性**
    - 在串流中段觸發備援 `httpx.TimeoutException` - [PR #26998](https://github.com/BerriAI/litellm/pull/26998)
    - 在失敗時註冊冷卻時間 + 對過時 `encrypted_content`（Responses）快速失敗 - [PR #27820](https://github.com/BerriAI/litellm/pull/27820)
    - 在 responses/-stripped 變體下註冊模型資訊 - [PR #27531](https://github.com/BerriAI/litellm/pull/27531)
    - 修正已驗證 Sentinel 設定的 Redis Sentinel 用戶端處理 - [PR #26302](https://github.com/BerriAI/litellm/pull/26302)
- **Proxy 熱路徑**
    - Token 驗證查詢最佳化 - [PR #26202](https://github.com/BerriAI/litellm/pull/26202)
    - 將每日活動彙總移出事件迴圈執行 - [PR #27264](https://github.com/BerriAI/litellm/pull/27264)
    - `BaseAWSLLM` 中的共用 IAM 快取 + 靜態憑證 - [PR #27125](https://github.com/BerriAI/litellm/pull/27125)
    - 隔離 semantic 快取項目；跨工作目錄保持穩定的 Redis 金鑰產生；移除重複的記憶體快取大小常數 - [PR #26990](https://github.com/BerriAI/litellm/pull/26990), [PR #27025](https://github.com/BerriAI/litellm/pull/27025), [PR #26385](https://github.com/BerriAI/litellm/pull/26385)
    - 及早強制 Proxy 請求大小；將非 str `x-litellm-*` 標頭值轉為字串，以避免 httpx `TypeError` - [PR #27311](https://github.com/BerriAI/litellm/pull/27311), [PR #27504](https://github.com/BerriAI/litellm/pull/27504)
    - 分離 DB 讀取與寫入端點 - [PR #27493](https://github.com/BerriAI/litellm/pull/27493)
- **健康檢查**
    - 共用健康檢查輪詢；`health_check_reasoning_effort` 用於模型健康檢查；在 `GET /health` 時略過 `disable_background_health_check` 模型；將 `/health` 回應限定為呼叫者的模型；移除獨立的健康應用程式 - [PR #26434](https://github.com/BerriAI/litellm/pull/26434), [PR #27115](https://github.com/BerriAI/litellm/pull/27115), [PR #27716](https://github.com/BerriAI/litellm/pull/27716), [PR #26935](https://github.com/BerriAI/litellm/pull/26935), [PR #27430](https://github.com/BerriAI/litellm/pull/27430)
- **設定 / 啟動穩健性**
    - 當設定 `--reload` 時熱重新載入 config YAML；在 Python 3.13 上打破 managed-resources 匯入循環；拒絕裸字串檔案輸入 sink（local-file 讀取強化） - [PR #27274](https://github.com/BerriAI/litellm/pull/27274), [PR #27160](https://github.com/BerriAI/litellm/pull/27160), [PR #27762](https://github.com/BerriAI/litellm/pull/27762)
- **封裝 / Docker / Helm / CI**
    - 將 Wolfi 與 uv 鎖定為 multi-arch index digest；移除 multi-arch builds 的硬編碼 Prisma binary target；清除 Docker 映像上標記的 OS 套件漏洞警示；更新相依性鎖定檔 - [PR #27123](https://github.com/BerriAI/litellm/pull/27123), [PR #27170](https://github.com/BerriAI/litellm/pull/27170), [PR #27225](https://github.com/BerriAI/litellm/pull/27225), [PR #27126](https://github.com/BerriAI/litellm/pull/27126)
    - Helm：當啟用 migrations Job 時略過啟動 `prisma db push`；提高預設探測逾時，預設停用除錯記錄 - [PR #27200](https://github.com/BerriAI/litellm/pull/27200), [PR #27237](https://github.com/BerriAI/litellm/pull/27237)
    - CI：為所有 pytest jobs 重新執行 Failed Tests，阻擋降低涵蓋率的 PR，Redis 支援的 VCR replay 快取，減少 cassette 膨脹，mutation-testing workflow，release workflow 中的 dev-tag 偵測，Playwright apt-install 跳過 - [PR #27155](https://github.com/BerriAI/litellm/pull/27155), [PR #27340](https://github.com/BerriAI/litellm/pull/27340), [PR #26838](https://github.com/BerriAI/litellm/pull/26838), [PR #27159](https://github.com/BerriAI/litellm/pull/27159), [PR #27409](https://github.com/BerriAI/litellm/pull/27409), [PR #27576](https://github.com/BerriAI/litellm/pull/27576), [PR #26966](https://github.com/BerriAI/litellm/pull/26966), [PR #27169](https://github.com/BerriAI/litellm/pull/27169)
    - 移除舊版部署成品與 litellm-js 套件；移除多餘的備份定價檔案；其他測試/匯入清理 - [PR #27541](https://github.com/BerriAI/litellm/pull/27541), [PR #16590](https://github.com/BerriAI/litellm/pull/16590), [PR #27699](https://github.com/BerriAI/litellm/pull/27699), [PR #27633](https://github.com/BerriAI/litellm/pull/27633)
    - 收緊 router-settings-override 與 mock-testing 的信任；取消對空白 Bedrock Converse thinking blocks 的空文字備援 - [PR #26968](https://github.com/BerriAI/litellm/pull/26968), [PR #27850](https://github.com/BerriAI/litellm/pull/27850)

## 文件更新 {#documentation-updates}

- 將 Greptile README 標誌更新為更高品質的圖片 - [PR #25385](https://github.com/BerriAI/litellm/pull/25385)
- 新增 `BudgetManager.reset_cost` 文件字串 - [PR #27867](https://github.com/BerriAI/litellm/pull/27867)
- 新增 `_LoopWrapper` 類別文件字串 - [PR #27870](https://github.com/BerriAI/litellm/pull/27870)

## 新貢獻者 {#new-contributors}

- @kimimgo 首次貢獻於 [#24282](https://github.com/BerriAI/litellm/pull/24282)
- @shubham-arora-clear 首次貢獻於 [#24644](https://github.com/BerriAI/litellm/pull/24644)
- @ohnoah 首次貢獻於 [#24580](https://github.com/BerriAI/litellm/pull/24580)
- @ushiromiya-lion 首次貢獻於 [#25106](https://github.com/BerriAI/litellm/pull/25106)
- @gowtham2809 首次貢獻於 [#25224](https://github.com/BerriAI/litellm/pull/25224)
- @he-yufeng 首次貢獻於 [#26401](https://github.com/BerriAI/litellm/pull/26401)
- @MackDing 首次貢獻於 [#26419](https://github.com/BerriAI/litellm/pull/26419)
- @dgu1-godaddy 首次貢獻於 [#26834](https://github.com/BerriAI/litellm/pull/26834)
- @Vedanshu7 首次貢獻於 [#24943](https://github.com/BerriAI/litellm/pull/24943)
- @dennishenry 首次貢獻於 [#27190](https://github.com/BerriAI/litellm/pull/27190)
- @SHARP155 首次貢獻於 [#27466](https://github.com/BerriAI/litellm/pull/27466)
- @mats852 首次貢獻於 [#24927](https://github.com/BerriAI/litellm/pull/24927)

**完整變更記錄**：https://github.com/BerriAI/litellm/compare/v1.84.0...v1.85.0

---

## 05/16/2026 (`v1.85.0`) {#05162026-v1850}

> 計數涵蓋相對於 `v1.84.0` **stable** 之 **`v1.85.0` 新增** PR。為避免重複計算，已排除 14 個回補至 `v1.84.0` stable（且已記錄於 v1.84.0 release notes）的 PR。

* 新模型 / 更新模型：43
* LLM API 端點：24
* 管理端點 / UI：54
* AI 整合（Logging / Guardrails / Prompt 管理 / Secret Managers）：32
* 支出追蹤、預算與速率限制：23
* MCP Gateway：12
* 效能 / 負載平衡 / 可靠性改善：41
* 文件更新：3

總計：232 個 PR
