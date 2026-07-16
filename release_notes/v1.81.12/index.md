---
title: "v1.81.12-stable.1 - 防護欄政策範本與動作建構器"
slug: "v1-81-12"
date: 2026-02-14T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-v1.81.12-stable.1
```

</TabItem>
<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.81.12
```

</TabItem>
</Tabs>

## 重點亮點 {#key-highlights}

- **政策範本** - [針對常見安全與合規使用案例（包含 NSFW、有毒內容與兒少安全）預先設定的防護欄政策範本](../../docs/proxy/guardrails/policy_templates)
- **防護欄動作建構器** - [使用全新的 action-builder UI 與條件式執行支援，建置並自訂防護欄政策流程](../../docs/proxy/guardrails/policy_templates)
- **MCP OAuth2 M2M + Tracing** - [為 MCP 伺服器新增 machine-to-machine OAuth2 支援，並為透過 AI Gateway 的 MCP 呼叫加入 OpenTelemetry tracing](../../docs/mcp)
- **Responses API `shell` Tool 與 `context_management` 支援** - [OpenAI Responses API 的伺服器端內容管理（compaction）與 Shell tool 支援](../../docs/response_api)
- **存取群組** - [建立存取群組以管理跨團隊與金鑰的模型、MCP 伺服器與代理程式存取](../../docs/proxy/access_groups)
- **50+ 個全新的 Bedrock 區域模型項目** - DeepSeek V3.2、MiniMax M2.1、Kimi K2.5、Qwen3 Coder Next，以及 NVIDIA Nemotron Nano，涵蓋多個區域
- **新增 Semgrep 並修正 OOM** - [靜態分析規則與記憶體用盡修正](#add-semgrep--fix-ooms) - [PR #20912](https://github.com/BerriAI/litellm/pull/20912)

---

## 新增 Semgrep 並修正 OOM {#add-semgrep--fix-ooms}

此版本修正了因無界限 `asyncio.Queue()` 使用所造成的記憶體用盡（OOM）風險。記錄佇列（例如 GCS bucket）與 DB spend-update 佇列先前都沒有上限，在負載下可能無限制成長。它們現在使用可設定的最大大小（`LITELLM_ASYNCIO_QUEUE_MAXSIZE`，預設 1000）；當滿載時，佇列會立即 flush 以騰出空間，而不是持續增加記憶體。另新增了一條 Semgrep 規則（`.semgrep/rules/python/unbounded-memory.yml`）以標記未來程式碼中類似的無界限記憶體模式。[PR #20912](https://github.com/BerriAI/litellm/pull/20912)

---

## 防護欄動作建構器 {#guardrail-action-builder}

此版本新增了具條件式執行支援的防護欄政策視覺化動作建構器。您現在可以將防護欄串接成多步驟流程——如果簡單的防護欄失敗，就改為路由到進階防護欄，而不是立即封鎖。每個步驟都可設定 ON PASS 與 ON FAIL 動作（Next Step、Block 或 Allow），而且您可以在儲存前用範例訊息測試完整流程。

![防護欄動作建構器](../../img/release_notes/guard_actions.png)

### 存取群組 {#access-groups}

存取群組可簡化您組織內資源存取的定義。一個群組即可授與模型、MCP 伺服器與代理程式的存取權——只要將其附加到金鑰或團隊即可。在 Admin UI 中建立群組、定義每個群組包含哪些資源，然後在建立金鑰或團隊時指派該群組。對群組的更新會自動套用到所有已附加的金鑰與團隊。

<Image img={require('../../img/ui_access_groups.png')} />

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新的提供者（2 個新增提供者） {#new-providers-2-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | --------------------------- | ----------- |
| [Scaleway](../../docs/providers/scaleway) | `/chat/completions` | 用於聊天補全的 Scaleway Generative APIs |
| [Sarvam AI](../../docs/providers/sarvam) | `/chat/completions`, `/audio/transcriptions`, `/audio/speech` | Sarvam AI 為印度語言提供 STT 與 TTS 支援 |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（19 個重點模型） {#new-model-support-19-highlighted-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100萬 tokens） | 輸出（$/100萬 tokens） |
| -------- | ----- | -------------- | ------------------- | -------------------- |
| AWS Bedrock | `deepseek.v3.2` | 164K | $0.62 | $1.85 |
| AWS Bedrock | `minimax.minimax-m2.1` | 196K | $0.30 | $1.20 |
| AWS Bedrock | `moonshotai.kimi-k2.5` | 262K | $0.60 | $3.00 |
| AWS Bedrock | `moonshotai.kimi-k2-thinking` | 262K | $0.73 | $3.03 |
| AWS Bedrock | `qwen.qwen3-coder-next` | 262K | $0.50 | $1.20 |
| AWS Bedrock | `nvidia.nemotron-nano-3-30b` | 262K | $0.06 | $0.24 |
| Azure AI | `azure_ai/kimi-k2.5` | 262K | $0.60 | $3.00 |
| Vertex AI | `vertex_ai/zai-org/glm-5-maas` | 200K | $1.00 | $3.20 |
| MiniMax | `minimax/MiniMax-M2.5` | 1M | $0.30 | $1.20 |
| MiniMax | `minimax/MiniMax-M2.5-lightning` | 1M | $0.30 | $2.40 |
| Dashscope | `dashscope/qwen3-max` | 258K | 分級定價 | 分級定價 |
| Perplexity | `perplexity/preset/pro-search` | - | 每次請求 | 每次請求 |
| Perplexity | `perplexity/openai/gpt-4o` | - | 每次請求 | 每次請求 |
| Perplexity | `perplexity/openai/gpt-5.2` | - | 每次請求 | 每次請求 |
| Vercel AI Gateway | `vercel_ai_gateway/anthropic/claude-opus-4.6` | 200K | $5.00 | $25.00 |
| Vercel AI Gateway | `vercel_ai_gateway/anthropic/claude-sonnet-4` | 200K | $3.00 | $15.00 |
| Vercel AI Gateway | `vercel_ai_gateway/anthropic/claude-haiku-4.5` | 200K | $1.00 | $5.00 |
| Sarvam AI | `sarvam/sarvam-m` | 8K | 免費方案 | 免費方案 |
| Anthropic | `fast/claude-opus-4-6` | 1M | $30.00 | $150.00 |

*注意：AWS Bedrock 模型可在多個區域使用（us-east-1、us-east-2、us-west-2、eu-central-1、eu-north-1、ap-northeast-1、ap-south-1、ap-southeast-3、sa-east-1）。總共新增了 54 個區域模型項目。*

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 使用 `output_format` 參數在 Claude Opus 4.5 與 4.6 上啟用非 tool 結構化輸出 - [PR #20548](https://github.com/BerriAI/litellm/pull/20548)
    - 在 prompt caching 中新增對 `anthropic_messages` 呼叫類型的支援 - [PR #19233](https://github.com/BerriAI/litellm/pull/19233)
    - 透過遠端 URL 取回管理 Anthropic Beta Headers - [PR #20935](https://github.com/BerriAI/litellm/pull/20935), [PR #21110](https://github.com/BerriAI/litellm/pull/21110)
    - 移除 `x-anthropic-billing` 區塊 - [PR #20951](https://github.com/BerriAI/litellm/pull/20951)
    - 對 OAuth token 使用 Authorization Bearer，而不是 x-api-key - [PR #21039](https://github.com/BerriAI/litellm/pull/21039)
    - 篩除不支援的 JSON schema 約束以供結構化輸出 - [PR #20813](https://github.com/BerriAI/litellm/pull/20813)
    - 為 `/v1/messages` 新增 Claude Opus 4.6 功能 - [PR #20733](https://github.com/BerriAI/litellm/pull/20733)
    - 修正 `reasoning_effort=None` 與 `"none"` 在 Opus 4.6 應回傳 None - [PR #20800](https://github.com/BerriAI/litellm/pull/20800)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 透過 4 個新的 beta 模型擴充模型支援 - [PR #21035](https://github.com/BerriAI/litellm/pull/21035)
    - 將 Claude Opus 4.6 新增至 `_supports_tool_search_on_bedrock` - [PR #21017](https://github.com/BerriAI/litellm/pull/21017)
    - 修正 Bedrock Claude Opus 4.6 model IDs（移除 `:0` 尾碼） - [PR #20564](https://github.com/BerriAI/litellm/pull/20564), [PR #20671](https://github.com/BerriAI/litellm/pull/20671)
    - 將 `output_config` 新增為支援的參數 - [PR #20748](https://github.com/BerriAI/litellm/pull/20748)

- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 Vertex GLM-5 模型支援 - [PR #21053](https://github.com/BerriAI/litellm/pull/21053)
    - 將 `extra_headers` anthropic-beta 傳遞至 request body - [PR #20666](https://github.com/BerriAI/litellm/pull/20666)
    - 在 `_hidden_params` 中保留 `usageMetadata` - [PR #20559](https://github.com/BerriAI/litellm/pull/20559)
    - 將 `IMAGE_PROHIBITED_CONTENT` 對應至 `content_filter` - [PR #20524](https://github.com/BerriAI/litellm/pull/20524)
    - 新增 Vertex AI 的 RAG ingest - [PR #21120](https://github.com/BerriAI/litellm/pull/21120)

- **[OCI / Cohere](../../docs/providers/cohere)**
    - OCI Cohere responseFormat/Pydantic 支援 - [PR #20663](https://github.com/BerriAI/litellm/pull/20663)
    - 透過填入 `preambleOverride` 修正 OCI Cohere system messages - [PR #20958](https://github.com/BerriAI/litellm/pull/20958)

- **[Perplexity](../../docs/providers/perplexity)**
    - 支援帶有預設搜尋的 Perplexity Research API - [PR #20860](https://github.com/BerriAI/litellm/pull/20860)

- **[MiniMax](../../docs/providers/minimax)**
    - 新增 MiniMax-M2.5 與 MiniMax-M2.5-lightning 模型 - [PR #21054](https://github.com/BerriAI/litellm/pull/21054)

- **[Kimi / Moonshot](../../docs/providers/moonshot)**
    - 依地區新增 Kimi 模型定價 - [PR #20855](https://github.com/BerriAI/litellm/pull/20855)
    - 新增 `moonshotai.kimi-k2.5` - [PR #20863](https://github.com/BerriAI/litellm/pull/20863)

- **[Dashscope](../../docs/providers/dashscope)**
    - 新增具有分級定價的 `dashscope/qwen3-max` 模型 - [PR #20919](https://github.com/BerriAI/litellm/pull/20919)

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 新增 Vercel AI Anthropic 模型 - [PR #20745](https://github.com/BerriAI/litellm/pull/20745)

- **[Azure AI](../../docs/providers/azure_ai)**
    - 將 `azure_ai/kimi-k2.5` 新增至 Azure 模型 DB - [PR #20896](https://github.com/BerriAI/litellm/pull/20896)
    - 支援非 Claude 的 azure_ai 模型使用 Azure AD token 驗證 - [PR #20981](https://github.com/BerriAI/litellm/pull/20981)
    - 修正 Azure batches 問題 - [PR #21092](https://github.com/BerriAI/litellm/pull/21092)

- **[DeepSeek](../../docs/providers/deepseek)**
    - 同步 DeepSeek 模型中繼資料並新增裸名稱 fallback - [PR #20938](https://github.com/BerriAI/litellm/pull/20938)

- **[Gemini](../../docs/providers/gemini)**
    - 處理 Gemini 的 assistant 訊息中的圖片 - [PR #20845](https://github.com/BerriAI/litellm/pull/20845)
    - 新增 Gemini 模型缺少的 tpm/rpm - [PR #21175](https://github.com/BerriAI/litellm/pull/21175)

- **一般**
    - 在 pricing JSON 中新增 30 個缺少的模型 - [PR #20797](https://github.com/BerriAI/litellm/pull/20797)
    - 清理 39 個已棄用的 OpenRouter 模型 - [PR #20786](https://github.com/BerriAI/litellm/pull/20786)
    - 標準化端點 `display_name` 命名慣例 - [PR #20791](https://github.com/BerriAI/litellm/pull/20791)
    - 修正並穩定模型成本對應格式 - [PR #20895](https://github.com/BerriAI/litellm/pull/20895)
    - 從 `litellm.__init__` 匯出 `PermissionDeniedError` - [PR #20960](https://github.com/BerriAI/litellm/pull/20960)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 `get_supported_anthropic_messages_params` - [PR #20752](https://github.com/BerriAI/litellm/pull/20752)
    - 修正 URL 中 body 和 deployment name 的 `base_model` 名稱 - [PR #20747](https://github.com/BerriAI/litellm/pull/20747)

- **[Azure](../../docs/providers/azure/azure)**
    - 保留 Azure OpenAI 的 `content_policy_violation` 錯誤詳細資訊 - [PR #20883](https://github.com/BerriAI/litellm/pull/20883)

- **[Vertex AI](../../docs/providers/vertex)**
    - 修正 Gemini 多輪工具呼叫訊息格式（已新增並回復） - [PR #20569](https://github.com/BerriAI/litellm/pull/20569), [PR #21051](https://github.com/BerriAI/litellm/pull/21051)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增伺服器端上下文管理（壓縮）支援 - [PR #21058](https://github.com/BerriAI/litellm/pull/21058)
    - 為 OpenAI Responses API 新增 Shell tool 支援 - [PR #21063](https://github.com/BerriAI/litellm/pull/21063)
    - 在串流時省略 streaming id 時，保留工具呼叫引數 delta - [PR #20712](https://github.com/BerriAI/litellm/pull/20712)
    - 在串流期間保留交錯的 thinking/redacted_thinking 區塊 - [PR #20702](https://github.com/BerriAI/litellm/pull/20702)

- **[Chat Completions](../../docs/completion/input)**
    - 使用 LiteLLM `/search` 新增 Web Search 支援（web search 攔截 hook）- [PR #20483](https://github.com/BerriAI/litellm/pull/20483)
    - 透過攜帶 schema properties 保留可為空的物件欄位 - [PR #19132](https://github.com/BerriAI/litellm/pull/19132)
    - 支援 OpenAI 與 Azure chat completions 的 `prompt_cache_key` - [PR #20989](https://github.com/BerriAI/litellm/pull/20989)

- **[Pass-Through Endpoints](../../docs/pass_through/bedrock)**
    - 透過 LiteLLM passthrough 新增 `langchain_aws` 支援 - [PR #20843](https://github.com/BerriAI/litellm/pull/20843)
    - 在 `create_pass_through_route` 中為 `endpoint_func` 新增 `custom_body` 參數 - [PR #20849](https://github.com/BerriAI/litellm/pull/20849)

- **[Vector Stores](../../docs/providers/openai)**
    - 為 vector store 端點新增 `target_model_names` - [PR #21089](https://github.com/BerriAI/litellm/pull/21089)

- **一般**
    - 將 `output_config` 新增為支援的參數 - [PR #20748](https://github.com/BerriAI/litellm/pull/20748)
    - 新增受管理的錯誤檔案支援 - [PR #20838](https://github.com/BerriAI/litellm/pull/20838)

#### 錯誤 {#bugs}

- **一般**
    - 停止在串流 SSE 錯誤回應中洩漏 Python traceback - [PR #20850](https://github.com/BerriAI/litellm/pull/20850)
    - 修正未以提供者中繼資料編碼的影片清單分頁游標 - [PR #20710](https://github.com/BerriAI/litellm/pull/20710)
    - 在 SDK 路徑的 retry/error 邏輯中處理 `metadata=None` - [PR #20873](https://github.com/BerriAI/litellm/pull/20873)
    - 修正 Spend logs 與 Pydantic models 及 redaction 的 pickle 錯誤 - [PR #20685](https://github.com/BerriAI/litellm/pull/20685)
    - 移除來自 `LLM_CONFIG_NAMES` 的重複 `PerplexityResponsesConfig` - [PR #21105](https://github.com/BerriAI/litellm/pull/21105)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **存取群組**
    - 新增 Access Groups 功能，用於管理模型、MCP server 與 agent 存取 - [PR #21022](https://github.com/BerriAI/litellm/pull/21022)
    - Access Groups 表格與詳細頁面 UI - [PR #21165](https://github.com/BerriAI/litellm/pull/21165)
    - 將 `model_ids` 重構為 `model_names` 以維持向後相容性 - [PR #21166](https://github.com/BerriAI/litellm/pull/21166)

- **政策**
    - 允許將 Policies 連接到 Tags、模擬 Policies、查看 key/team 數量 - [PR #20904](https://github.com/BerriAI/litellm/pull/20904)
    - 支援條件式依序執行的 guardrail pipeline - [PR #21177](https://github.com/BerriAI/litellm/pull/21177)
    - guardrail policies 的 pipeline flow builder UI - [PR #21188](https://github.com/BerriAI/litellm/pull/21188)

- **SSO / 驗證**
    - 新增 SSO 登入按鈕 - [PR #20908](https://github.com/BerriAI/litellm/pull/20908)
    - M2M OAuth2 UI 流程 - [PR #20794](https://github.com/BerriAI/litellm/pull/20794)
    - 允許 Organization 和 Team Admins 呼叫 `/invitation/new` - [PR #20987](https://github.com/BerriAI/litellm/pull/20987)
    - 邀請使用者：電子郵件整合警示 - [PR #20790](https://github.com/BerriAI/litellm/pull/20790)
    - 在 proxy admin JWT early-return 路徑中填入 identity 欄位 - [PR #21169](https://github.com/BerriAI/litellm/pull/21169)

- **支出記錄**
    - 在篩選器中顯示預先定義的錯誤代碼，並提供使用者可定義的 fallback - [PR #20773](https://github.com/BerriAI/litellm/pull/20773)
    - 可分頁且可搜尋的模型選擇 - [PR #20892](https://github.com/BerriAI/litellm/pull/20892)
    - 支援欄位排序 - [PR #21143](https://github.com/BerriAI/litellm/pull/21143)
    - 允許對 `/spend/logs/ui` 排序 - [PR #20991](https://github.com/BerriAI/litellm/pull/20991)

- **UI 改進**
    - Navbar：可選擇隱藏 Usage Popup - [PR #20910](https://github.com/BerriAI/litellm/pull/20910)
    - Model 頁面：改善憑證訊息 - [PR #21076](https://github.com/BerriAI/litellm/pull/21076)
    - Fallbacks：預設可設定為 10 個模型 - [PR #21144](https://github.com/BerriAI/litellm/pull/21144)
    - 以箭頭與卡片結構顯示 fallback - [PR #20922](https://github.com/BerriAI/litellm/pull/20922)
    - Team Info：遷移至 AntD Tabs + Table - [PR #20785](https://github.com/BerriAI/litellm/pull/20785)
    - AntD 重構與 0 cost models 修正 - [PR #20687](https://github.com/BerriAI/litellm/pull/20687)
    - Zscaler AI Guard UI - [PR #21077](https://github.com/BerriAI/litellm/pull/21077)
    - 包含 Config Defined Pass Through Endpoints - [PR #20898](https://github.com/BerriAI/litellm/pull/20898)
    - 在 MCP server 頁面將 "HTTP" 重新命名為 "Streamable HTTP (Recommended)" - [PR #21000](https://github.com/BerriAI/litellm/pull/21000)
    - MCP server discovery UI - [PR #21079](https://github.com/BerriAI/litellm/pull/21079)

- **虛擬金鑰**
    - 允許 Management keys 存取 `user/daily/activity` 與 team - [PR #20124](https://github.com/BerriAI/litellm/pull/20124)
    - 在 team/key 更新時，對空白中繼資料欄位略過 premium 檢查 - [PR #20598](https://github.com/BerriAI/litellm/pull/20598)

#### 錯誤 {#bugs-1}

- Logs：修正輸入與輸出複製 - [PR #20657](https://github.com/BerriAI/litellm/pull/20657)
- Teams：修正可用 Teams - [PR #20682](https://github.com/BerriAI/litellm/pull/20682)
- Spend Logs：重設篩選器會重設自訂日期範圍 - [PR #21149](https://github.com/BerriAI/litellm/pull/21149)
- Usage：修正 Request Chart stack 變體 - [PR #20894](https://github.com/BerriAI/litellm/pull/20894)
- 新增 Auto Router：描述文字輸入框聚焦 - [PR #21004](https://github.com/BerriAI/litellm/pull/21004)
- Guardrail 編輯：LiteLLM Content Filter 類別 - [PR #21002](https://github.com/BerriAI/litellm/pull/21002)
- 為 API keys 表格中的 models 新增空值防護 - [PR #20655](https://github.com/BerriAI/litellm/pull/20655)
- 失敗請求顯示錯誤詳細資訊，而非 'Data Not Available' - [PR #20656](https://github.com/BerriAI/litellm/pull/20656)
- 修正 Spend Management Tests - [PR #21088](https://github.com/BerriAI/litellm/pull/21088)
- 修正 JWT email domain 驗證錯誤訊息 - [PR #21212](https://github.com/BerriAI/litellm/pull/21212)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[PostHog](../../docs/observability/posthog_integration)**
    - 修正不可序列化物件的 JSON 序列化錯誤 - [PR #20668](https://github.com/BerriAI/litellm/pull/20668)

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 清理標籤值以防止指標抓取失敗 - [PR #20600](https://github.com/BerriAI/litellm/pull/20600)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 防止將空白 proxy request spans 傳送至 Langfuse - [PR #19935](https://github.com/BerriAI/litellm/pull/19935)

- **[OpenTelemetry](../../docs/proxy/logging#otel)**
    - 在設定 endpoint 時自動推斷 `otlp_http` exporter - [PR #20438](https://github.com/BerriAI/litellm/pull/20438)

- **[CloudZero](../../docs/proxy/logging)**
    - 依 LIT-1907 更新 CBF 欄位對應 - [PR #20906](https://github.com/BerriAI/litellm/pull/20906)

- **一般**
    - 允許透過 env var 覆寫 `MAX_CALLBACKS` - [PR #20781](https://github.com/BerriAI/litellm/pull/20781)
    - 新增 `standard_logging_payload_excluded_fields` 設定選項 - [PR #20831](https://github.com/BerriAI/litellm/pull/20831)
    - 當 `LITELLM_LOG=DEBUG` 時啟用 `verbose_logger` - [PR #20496](https://github.com/BerriAI/litellm/pull/20496)
    - 在批次記錄路徑中防止 None `litellm_metadata` - [PR #20832](https://github.com/BerriAI/litellm/pull/20832)
    - 將模型層級標籤從 config 傳遞至 SpendLogs - [PR #20769](https://github.com/BerriAI/litellm/pull/20769)

### 防護欄 {#guardrails}

- **政策範本**
    - 全新政策範本：針對特定使用案例預先設定的防護欄組合 - [PR #21025](https://github.com/BerriAI/litellm/pull/21025)
    - 新增 NSFW 政策範本、多語言毒性關鍵字、兒童安全內容過濾器、JSON 內容檢視器 - [PR #21205](https://github.com/BerriAI/litellm/pull/21205)
    - 新增有毒／辱罵性內容過濾防護欄 - [PR #20934](https://github.com/BerriAI/litellm/pull/20934)

- **Pipeline 執行**
    - 新增防護欄 pipeline 對條件式順序執行的支援 - [PR #21177](https://github.com/BerriAI/litellm/pull/21177)
    - 串流輸出上的代理程式防護欄 - [PR #21206](https://github.com/BerriAI/litellm/pull/21206)
    - Pipeline flow builder UI - [PR #21188](https://github.com/BerriAI/litellm/pull/21188)

- **[Zscaler AI Guard](../../docs/apply_guardrail)**
    - Zscaler AI Guard 錯誤修正，以及在 post-call 期間的支援 - [PR #20801](https://github.com/BerriAI/litellm/pull/20801)
    - Zscaler AI Guard UI - [PR #21077](https://github.com/BerriAI/litellm/pull/21077)

- **[ZGuard](../../docs/apply_guardrail)**
    - 為 ZGuard 新增團隊政策對應 - [PR #20608](https://github.com/BerriAI/litellm/pull/20608)

- **一般**
    - 為所有統一防護欄新增記錄 + 連結至自訂程式碼防護欄範本 - [PR #20900](https://github.com/BerriAI/litellm/pull/20900)
    - 將 request headers + `litellm_version` 傳遞給一般防護欄 - [PR #20729](https://github.com/BerriAI/litellm/pull/20729)
    - 空白 `guardrails`/`policies` 陣列不應觸發企業授權檢查 - [PR #20567](https://github.com/BerriAI/litellm/pull/20567)
    - 修正 OpenAI moderation 防護欄 - [PR #20718](https://github.com/BerriAI/litellm/pull/20718)
    - 修正 `/v2/guardrails/list` 回傳敏感值 - [PR #20796](https://github.com/BerriAI/litellm/pull/20796)
    - 修正防護欄狀態錯誤 - [PR #20972](https://github.com/BerriAI/litellm/pull/20972)
    - 在 `initialize_custom_guardrail` 中重複使用 `get_instance_fn` - [PR #20917](https://github.com/BerriAI/litellm/pull/20917)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **防止共享後端模型金鑰被污染**，避免 per-deployment 自訂定價影響 - [PR #20679](https://github.com/BerriAI/litellm/pull/20679)
- **避免原地修改** SpendUpdateQueue 聚合中的資料 - [PR #20876](https://github.com/BerriAI/litellm/pull/20876)

---

## MCP 閘道 (12 項更新) {#mcp-gateway-12-updates}

- **MCP M2M OAuth2 支援** - 為 MCP servers 新增 machine-to-machine OAuth2 支援 - [PR #20788](https://github.com/BerriAI/litellm/pull/20788)
- **MCP Server Discovery UI** - 從 UI 瀏覽並探索可用的 MCP servers - [PR #21079](https://github.com/BerriAI/litellm/pull/21079)
- **MCP Tracing** - 為透過 AI Gateway 執行的 MCP 呼叫新增 OpenTelemetry tracing - [PR #21018](https://github.com/BerriAI/litellm/pull/21018)
- **MCP OAuth2 Debug Headers** - 用於 OAuth2 疑難排解的 client-side debug headers - [PR #21151](https://github.com/BerriAI/litellm/pull/21151)
- **修正 MCP「找不到 Session」錯誤** - 解決 session 持續化問題 - [PR #21040](https://github.com/BerriAI/litellm/pull/21040)
- **修正 MCP OAuth2 root endpoints** 回傳「找不到 MCP server」 - [PR #20784](https://github.com/BerriAI/litellm/pull/20784)
- **修正 MCP OAuth2 query param 合併**，當 `authorization_url` 已包含參數時 - [PR #20968](https://github.com/BerriAI/litellm/pull/20968)
- **修正 Atlassian 上的 MCP SCOPES** 問題 - [PR #21150](https://github.com/BerriAI/litellm/pull/21150)
- **修正 MCP StreamableHTTP backend** - 使用 `anyio.fail_after` 取代 `asyncio.wait_for` - [PR #20891](https://github.com/BerriAI/litellm/pull/20891)
- **將 `NPM_CONFIG_CACHE` 注入** STDIO MCP subprocess env - [PR #21069](https://github.com/BerriAI/litellm/pull/21069)
- **封鎖 MCP server 名稱與別名中的空格和連字號** - [PR #21074](https://github.com/BerriAI/litellm/pull/21074)

---

## 效能 / 負載平衡 / 可靠性改進 (8 項改進) {#performance--loadbalancing--reliability-improvements-8-improvements}

- **移除 queue 中的孤立項目** - 修正 scheduler queue 的記憶體洩漏 - [PR #20866](https://github.com/BerriAI/litellm/pull/20866)
- **移除重複的提供者解析**，用於 budget limiter 熱路徑 - [PR #21043](https://github.com/BerriAI/litellm/pull/21043)
- **重試退避時使用目前的 retry exception**，而非過時的 exception - [PR #20725](https://github.com/BerriAI/litellm/pull/20725)
- **新增 Semgrep 並修正 OOM** - 靜態分析規則與記憶體不足修正 - [PR #20912](https://github.com/BerriAI/litellm/pull/20912)
- **新增 Pyroscope** 用於持續剖析與可觀測性 - [PR #21167](https://github.com/BerriAI/litellm/pull/21167)
- **在共享 aiohttp sessions 下遵守 `ssl_verify`** - [PR #20349](https://github.com/BerriAI/litellm/pull/20349)
- **修正共享健康檢查序列化** - [PR #21119](https://github.com/BerriAI/litellm/pull/21119)
- **將 model mismatch 記錄** 從 WARNING 改為 DEBUG - [PR #20994](https://github.com/BerriAI/litellm/pull/20994)

---

## 資料庫變更 {#database-changes}

### 結構描述更新 {#schema-updates}

| Table | Change Type | 說明 | PR | 移轉 |
| ----- | ----------- | ----------- | -- | --------- |
| `LiteLLM_VerificationToken` | New Indexes | 新增 `user_id`+`team_id`、`team_id`，以及 `budget_reset_at`+`expires` 的索引 | [PR #20736](https://github.com/BerriAI/litellm/pull/20736) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260209085821_add_verificationtoken_indexes/migration.sql) |
| `LiteLLM_PolicyAttachmentTable` | 新欄位 | 為 policy-to-tag connections 新增 `tags` text array | [PR #21061](https://github.com/BerriAI/litellm/pull/21061) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260212103349_adjust_tags_policy_table/migration.sql) |
| `LiteLLM_AccessGroupTable` | New Table | 用於管理 model、MCP server 與 agent 存取的 access groups | [PR #21022](https://github.com/BerriAI/litellm/pull/21022) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260212143306_add_access_group_table/migration.sql) |
| `LiteLLM_AccessGroupTable` | Column Change | 將 `access_model_ids` 重新命名為 `access_model_names` | [PR #21166](https://github.com/BerriAI/litellm/pull/21166) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260213170952_access_group_change_to_model_name/migration.sql) |
| `LiteLLM_ManagedVectorStoreTable` | New Table | 搭配 model mappings 的受管理 vector store 追蹤 | - | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260213105436_add_managed_vector_store_table/migration.sql) |
| `LiteLLM_TeamTable`, `LiteLLM_VerificationToken` | 新欄位 | 新增 `access_group_ids` text array | [PR #21022](https://github.com/BerriAI/litellm/pull/21022) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260212143306_add_access_group_table/migration.sql) |
| `LiteLLM_GuardrailsTable` | 新欄位 | 新增 `team_id` text column | - | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260214094754_schema_sync/migration.sql) |

---

## 文件更新 (14 項更新) {#documentation-updates-14-updates}

- 在 v1.81.9 release notes 中新增 LiteLLM Observatory 章節 - [PR #20675](https://github.com/BerriAI/litellm/pull/20675)
- 在 release notes 中新增 callback 註冊最佳化 - [PR #20681](https://github.com/BerriAI/litellm/pull/20681)
- Middleware 效能部落格文章 - [PR #20677](https://github.com/BerriAI/litellm/pull/20677)
- UI Team Soft Budget 文件 - [PR #20669](https://github.com/BerriAI/litellm/pull/20669)
- UI Contributing and Troubleshooting 指南 - [PR #20674](https://github.com/BerriAI/litellm/pull/20674)
- 重新組織 Admin UI 子區段 - [PR #20676](https://github.com/BerriAI/litellm/pull/20676)
- SDK proxy authentication (OAuth2/JWT auto-refresh) - [PR #20680](https://github.com/BerriAI/litellm/pull/20680)
- Forward client headers to LLM API 文件修正 - [PR #20768](https://github.com/BerriAI/litellm/pull/20768)
- 新增使用 policies 的文件指南 - [PR #20914](https://github.com/BerriAI/litellm/pull/20914)
- 為 Claude Opus 4.6 新增 native thinking 參數範例 - [PR #20799](https://github.com/BerriAI/litellm/pull/20799)
- 修正 Claude Code MCP 教學 - [PR #21145](https://github.com/BerriAI/litellm/pull/21145)
- 新增 Dashscope（International 與 China/Beijing）的 API base URLs - [PR #21083](https://github.com/BerriAI/litellm/pull/21083)
- 修正 `DEFAULT_NUM_WORKERS_LITELLM_PROXY` 預設值（1，而非 4） - [PR #21127](https://github.com/BerriAI/litellm/pull/21127)
- 修正 README 中的 ElevenLabs 支援狀態 - [PR #20643](https://github.com/BerriAI/litellm/pull/20643)

---

## 新貢獻者 {#new-contributors}
* @iver56 首次貢獻於 [PR #20643](https://github.com/BerriAI/litellm/pull/20643)
* @eliasaronson 首次貢獻於 [PR #20666](https://github.com/BerriAI/litellm/pull/20666)
* @NirantK 首次貢獻於 [PR #19656](https://github.com/BerriAI/litellm/pull/19656)
* @looksgood 首次貢獻於 [PR #20919](https://github.com/BerriAI/litellm/pull/20919)
* @kelvin-tran 首次貢獻於 [PR #20548](https://github.com/BerriAI/litellm/pull/20548)
* @bluet 首次貢獻於 [PR #20873](https://github.com/BerriAI/litellm/pull/20873)
* @itayov 首次貢獻於 [PR #20729](https://github.com/BerriAI/litellm/pull/20729)
* @CSteigstra 首次貢獻於 [PR #20960](https://github.com/BerriAI/litellm/pull/20960)
* @rahulrd25 首次貢獻於 [PR #20569](https://github.com/BerriAI/litellm/pull/20569)
* @muraliavarma 首次貢獻於 [PR #20598](https://github.com/BerriAI/litellm/pull/20598)
* @joaokopernico 首次貢獻於 [PR #21039](https://github.com/BerriAI/litellm/pull/21039)
* @datzscaler 首次貢獻於 [PR #21077](https://github.com/BerriAI/litellm/pull/21077)
* @atapia27 首次貢獻於 [PR #20922](https://github.com/BerriAI/litellm/pull/20922)
* @fpagny 首次貢獻於 [PR #21121](https://github.com/BerriAI/litellm/pull/21121)
* @aidankovacic-8451 首次貢獻於 [PR #21119](https://github.com/BerriAI/litellm/pull/21119)
* @luisgallego-aily 首次貢獻於 [PR #19935](https://github.com/BerriAI/litellm/pull/19935)

---

## 完整變更記錄 {#full-changelog}
[v1.81.9.rc.1...v1.81.12.rc.1](https://github.com/BerriAI/litellm/compare/v1.81.9.rc.1...v1.81.12.rc.1)
