---
title: "v1.91.0 - MCP OAuth v2、Rust OCR Gateway 與 Realtime 效能"
slug: "v1-91-0"
date: 2026-07-04T17:55:59
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
docker.litellm.ai/berriai/litellm:1.91.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.91.0
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **MCP Gateway OAuth 2.0 v2 resolver** - 一個新的共用 OAuth token 基礎，具備跨複本 single-flight refresh、帶有型別化結果的 outbound-credentials 套件，以及首個遷移到 v2 resolver 的 authorization_code。
- **Rust OCR gateway** - 一個新的 LiteLLM Rust 工作區，推出以 async-first 為核心的 Mistral OCR bridge，直接封裝進 LiteLLM wheel，並附帶一個以 Axum 為基礎的 experimental realtime AI gateway。
- **Realtime API 效能** - upstream connection-pool 預熱與 client-disconnect 取消機制，縮短 session 建立延遲並停止浪費 upstream 工作。
- **最小權限 MCP 預設值** - team keys 現在可預設為最小權限 MCP 存取、透過 sentinel 範圍限定為零個 MCP servers，並以受信任的 X-Forwarded-For hop counts 強化 client-IP 解析。
- **約 48 個新模型** - 大批 Cloudflare Workers AI、Gemini 3 image models、Mistral Medium 3.5 / OCR 3 與 4、GLM/zai、SambaNova，以及 AI/ML image models。

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 描述 |
| --- | --- | --- |
| Amazon Bedrock Mantle (`bedrock_mantle`) | 聊天補全 | 透過 `api_base` 的 VPC endpoint routing 提供 Bedrock Mantle 支援，並作為其自身的 Add Model 提供者曝光 - [PR #31034](https://github.com/BerriAI/litellm/pull/31034), [PR #31141](https://github.com/BerriAI/litellm/pull/31141) |
| OpenSandbox (`opensandbox`) | Sandbox / code interpreter | 新的 sandbox 提供者，供 code-interpreter loop 使用 - [PR #31024](https://github.com/BerriAI/litellm/pull/31024) |

### 新的 LLM API 端點 {#new-llm-api-endpoints}

| 功能 | 描述 | 文件 |
| --- | --- | --- |
| Rust OCR (Mistral) | 一個新的 LiteLLM Rust 工作區推出以 async-first 為核心的 Mistral OCR bridge，封裝進 LiteLLM wheel - [PR #31033](https://github.com/BerriAI/litellm/pull/31033), [PR #31253](https://github.com/BerriAI/litellm/pull/31253), [PR #31267](https://github.com/BerriAI/litellm/pull/31267) | [OCR](../../docs/ocr) |
| Code interpreter | Responses API 上的 Sandbox code-interpreter interceptor，以及 chat-completions code-interpreter loop - [PR #30905](https://github.com/BerriAI/litellm/pull/30905), [PR #31027](https://github.com/BerriAI/litellm/pull/31027) | [Sandbox](../../docs/sandbox) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（約 48 個新模型） {#new-model-support-48-new-models}

| 提供者 | 模型 | 上下文 | 輸入（$/100萬） | 輸出（$/100萬） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Gemini / Vertex AI | `gemini-3-pro-image`, `gemini-3.1-flash-image`（+ `gemini/`、`vertex_ai/` variants） | 1M | 每張影像 | 每張影像 | 影像生成、GA pricing |
| AI/ML | `aiml/openai/gpt-image-2` | - | 每張影像 | 每張影像 | 影像生成 |
| Cloudflare Workers AI | 約 28 個文字生成模型（Llama 3.x/4、Qwen 2.5/3/QwQ、GLM 4.7/5.2、Kimi K2.6/K2.7、gpt-oss 20b/120b、Gemma、Granite、Nemotron、DeepSeek-R1 distill、Mistral、Llama Guard） | 視情況而定 | 視情況而定 | 視情況而定 | 透過 OpenAI-compatible endpoint 的原生 Workers AI |
| Mistral | `mistral-medium-2508`, `mistral-medium-2604`, `mistral-medium-latest`（Medium 3.5）, `mistral-ocr-2512`（OCR 3）, `mistral-ocr-4-0`（OCR 4） | 視情況而定 | 視情況而定 | 視情況而定 | Chat、OCR |
| SambaNova | `sambanova/DeepSeek-V3.2`, `sambanova/gemma-4-31B-it` | 視情況而定 | 視情況而定 | 視情況而定 | 聊天 |
| zai / OpenRouter | `zai/glm-4.7-flash`, `zai/glm-5.1`, `openrouter/z-ai/glm-5.1` | 視情況而定 | 視情況而定 | 視情況而定 | 聊天 |
| Bedrock | `amazon.titan-embed-g1-text-02` | - | embedding | - | 嵌入 |
| Darkbloom | `darkbloom/gemma-4-26b`, `darkbloom/gpt-oss-20b` | 視情況而定 | 視情況而定 | 視情況而定 | 聊天 |

各模型精確的 context window 與價格列於 `model_prices_and_context_window.json`。

#### 功能 {#features}

- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 與完整 Fireworks API surface 同步的 chat completions endpoint - [PR #30885](https://github.com/BerriAI/litellm/pull/30885)
- **[Cloudflare](../../docs/providers/cloudflare)**
    - 將目前的 Workers AI 文字生成模型加入 cost map - [PR #31051](https://github.com/BerriAI/litellm/pull/31051)
    - 透過 OpenAI-compatible endpoint 路由原生 Workers AI 提供者 - [PR #31053](https://github.com/BerriAI/litellm/pull/31053)
- **[Mistral](../../docs/providers/mistral)**
    - 支援 Mistral OCR 4 (`mistral-ocr-4-0`) - [PR #31353](https://github.com/BerriAI/litellm/pull/31353)
    - 將 `mistral/mistral-ocr-2512` 加入 cost map（OCR 3）- [PR #31463](https://github.com/BerriAI/litellm/pull/31463)
    - 將 `mistral-medium-latest` 重新指向 Medium 3.5，並加入 date-pinned aliases - [PR #31373](https://github.com/BerriAI/litellm/pull/31373)
- **[AI/ML](../../docs/providers/aiml_api)**
    - 新增 `openai/gpt-image-2` image model - [PR #31323](https://github.com/BerriAI/litellm/pull/31323)
- **[Rerank](../../docs/rerank)**
    - 約 15 個提供者的 rerank transformation 更新（Cohere v1/v2、Voyage、Jina、Vertex、Bedrock、Hugging Face、hosted vLLM、DashScope、DeepInfra、NVIDIA NIM、Fireworks、Watsonx）- [PR #31185](https://github.com/BerriAI/litellm/pull/31185)
- **[DeepSeek](../../docs/providers/deepseek)** / **[GitHub Copilot](../../docs/providers/github_copilot)** / **[Moonshot](../../docs/providers/moonshot)**
    - Chat transformation 更新 - [PR #31185](https://github.com/BerriAI/litellm/pull/31185)

#### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 在原生 `/v1/messages` 路徑上清理 `tool_use` ids - [PR #31094](https://github.com/BerriAI/litellm/pull/31094)
    - 在 `drop_params` 下移除不支援的 `speed` 參數 - [PR #31152](https://github.com/BerriAI/litellm/pull/31152)
    - 為 Claude Invoke 正規化 Messages `system` role 與 adaptive-thinking - [PR #31364](https://github.com/BerriAI/litellm/pull/31364)
- **[Bedrock](../../docs/providers/bedrock)**
    - 僅展開來自設定來源的 AWS credential references - [PR #30867](https://github.com/BerriAI/litellm/pull/30867)
    - 防止 key-level `metadata.tags` 洩漏到 Bedrock passthrough body - [PR #30985](https://github.com/BerriAI/litellm/pull/30985)
    - 在 `InvalidIdentityToken` 上顯示 web-identity token `aud`/`iss` - [PR #31412](https://github.com/BerriAI/litellm/pull/31412)
    - 移除 Claude Opus 4.7/4.8 的 Converse 不支援 `toolSpec.strict` 欄位 - [PR #31582](https://github.com/BerriAI/litellm/pull/31582)
    - 符合 `tool_config` cache injection points 的 cache TTL - [PR #31929](https://github.com/BerriAI/litellm/pull/31929)
- **[Vertex AI](../../docs/providers/vertex)**
    - 防止過期的 Vertex bearer token 在 token 過期後導致 `/v1/messages` 401 - [PR #31276](https://github.com/BerriAI/litellm/pull/31276)
    - 為自訂 `api_base` 附加 `rawPredict` 後綴 - [PR #31529](https://github.com/BerriAI/litellm/pull/31529)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - Responses API 上的 Code Interpreter 攔截器（沙箱）- [PR #30905](https://github.com/BerriAI/litellm/pull/30905)
    - Chat-completions code-interpreter 迴圈 - [PR #31027](https://github.com/BerriAI/litellm/pull/31027)
- **[Realtime API](../../docs/realtime)**
    - 為 litellm-rust 新增 OpenAI realtime 轉譯層（1/2）- [PR #31129](https://github.com/BerriAI/litellm/pull/31129)
    - 新增最小化 Rust router + Axum AI-gateway 呼叫 `router.realtime`（2/2）- [PR #31135](https://github.com/BerriAI/litellm/pull/31135)
- **OCR**
    - 讓 Rust OCR 橋接器以 async-first 為主 - [PR #31253](https://github.com/BerriAI/litellm/pull/31253)
    - 新增 Rust OCR 提供者 - [PR #31272](https://github.com/BerriAI/litellm/pull/31272)
    - 精簡 Rust OCR Python 橋接器 - [PR #31368](https://github.com/BerriAI/litellm/pull/31368)
- **[Batches](../../docs/batches)**
    - 將 OpenAI 串流到 Vertex batch JSONL 上傳 - [PR #31036](https://github.com/BerriAI/litellm/pull/31036)
- **[轉送](../../docs/pass_through)**
    - 轉送所有具有重複欄位名稱的 multipart 檔案 - [PR #31391](https://github.com/BerriAI/litellm/pull/31391)
    - 透過持久化記錄工作者排程支出記錄 - [PR #31485](https://github.com/BerriAI/litellm/pull/31485)
- **網路搜尋**
    - 在轉換 `web_search` 工具時同步 `tool_choice` - [PR #31375](https://github.com/BerriAI/litellm/pull/31375)
    - 將 agentic-loop 回應包裝成用於串流請求的假串流 - [PR #31484](https://github.com/BerriAI/litellm/pull/31484)

#### 錯誤 {#bugs}

- **[Realtime API](../../docs/realtime)**
    - 修正工具呼叫後 `function_response` id 遺漏 - [PR #30446](https://github.com/BerriAI/litellm/pull/30446)
    - 停止在記錄邊界重新驗證 realtime 事件 - [PR #31054](https://github.com/BerriAI/litellm/pull/31054)
- **一般**
    - 在回應沒有 `model` 欄位時略過模型覆寫 - [PR #31183](https://github.com/BerriAI/litellm/pull/31183)
    - 在中斷與 agentic Anthropic 串流中回收成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰與團隊**
    - 依據 `/model/info` 中的金鑰 `team_id` 來限定團隊 BYOK 模型範圍 - [PR #31009](https://github.com/BerriAI/litellm/pull/31009)
    - 還原 `/v1/model/info` 中的萬用字元展開 - [PR #31444](https://github.com/BerriAI/litellm/pull/31444)
    - 在直接存取查找中展開 all-proxy-models sentinel - [PR #31153](https://github.com/BerriAI/litellm/pull/31153)
    - 在 `/team/member_add` 成員預算上保留 `budget_duration` - [PR #31443](https://github.com/BerriAI/litellm/pull/31443)
    - 在虛擬金鑰上保留預算視窗刪除 - [PR #31107](https://github.com/BerriAI/litellm/pull/31107)
- **SCIM**
    - 將 enterprise-extension 屬性匯入使用者中繼資料 - [PR #30893](https://github.com/BerriAI/litellm/pull/30893)
    - 由 SCIM 管理員群組驅動全域 proxy role - [PR #30895](https://github.com/BerriAI/litellm/pull/30895)
- **Proxy CLI / Auth**
    - 在 `lite login` 上鑄造每個 session 的代理程式憑證 - [PR #31072](https://github.com/BerriAI/litellm/pull/31072)
- **設定與外掛**
    - LiteLLM 外掛架構 v2 - [PR #30688](https://github.com/BerriAI/litellm/pull/30688)
    - 透過 `/config/update` 保留全域 `retry_policy` - [PR #29540](https://github.com/BerriAI/litellm/pull/29540)
    - 收緊設定與 MCP 欄位的角色式可見性 - [PR #30587](https://github.com/BerriAI/litellm/pull/30587)
- **UI**
    - 在 UI 中顯示代理程式附加的虛擬金鑰 - [PR #29619](https://github.com/BerriAI/litellm/pull/29619)
    - 在新增模型提供者下拉選單中加入 Amazon Bedrock Mantle - [PR #31034](https://github.com/BerriAI/litellm/pull/31034)
    - 釐清相容 OpenAI 的提供者下拉選單標籤（chat 與 legacy completions）- [PR #31046](https://github.com/BerriAI/litellm/pull/31046)
    - 在自訂 `server_root_path` 下方顯示 logo - [PR #31156](https://github.com/BerriAI/litellm/pull/31156)

#### 錯誤 {#bugs-1}

- **UI**
    - 在單一組織設定中，讓團隊 Organization 對 proxy 管理員維持為可選 - [PR #30861](https://github.com/BerriAI/litellm/pull/30861)
    - 停止每個模型的用量匯出將使用者支出重複計入多個模型 - [PR #30980](https://github.com/BerriAI/litellm/pull/30980)
    - 在 Spend Per User 用量圖表中將 `user_id` 解析為電子郵件 - [PR #30992](https://github.com/BerriAI/litellm/pull/30992)
    - 將 request-logs 欄位標示為「Key Alias」以符合篩選條件 - [PR #31037](https://github.com/BerriAI/litellm/pull/31037)
    - 停止將 `bedrock_mantle` 模型列在 Bedrock 提供者底下 - [PR #31478](https://github.com/BerriAI/litellm/pull/31478)
- **Auth 與 Management**
    - 在 auth 接縫處一次性將呼叫者身分解析為 Principal - [PR #30887](https://github.com/BerriAI/litellm/pull/30887)
    - 將 auth-path team 物件快取在 canonical `team_id` key 下 - [PR #31418](https://github.com/BerriAI/litellm/pull/31418)
    - 在管理物件快取寫入時遵守 `user_api_key_cache_ttl` - [PR #31504](https://github.com/BerriAI/litellm/pull/31504)
    - 拒絕 proxy body 中的 `model_list`，並管制 advisor client credentials - [PR #30585](https://github.com/BerriAI/litellm/pull/30585)
    - 從 `key/info` client 錯誤訊息中隱藏 API 金鑰 - [PR #31342](https://github.com/BerriAI/litellm/pull/31342)
    - 停止在 `get_config` 中對 email/slack alerting env vars 進行雙重解密 - [PR #31117](https://github.com/BerriAI/litellm/pull/31117)
    - 將團隊 `budget_limits` 序列化為 `jsonify_team_object` 中的 JSON - [PR #31045](https://github.com/BerriAI/litellm/pull/31045)
    - 阻止伺服器憑證洩漏到呼叫者提供的 `api_base` - [PR #30682](https://github.com/BerriAI/litellm/pull/30682)
    - 恢復無 team 的金鑰存取所有團隊模型 - [PR #32032](https://github.com/BerriAI/litellm/pull/32032)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Prometheus](../../docs/proxy/prometheus)**
    - 新增 `requested_model` 標籤至支出與請求指標 - [PR #31410](https://github.com/BerriAI/litellm/pull/31410)
    - 新增每團隊 `litellm_team_members_metric` gauge - [PR #31506](https://github.com/BerriAI/litellm/pull/31506)
- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 一次性解析 `LITELLM_OTEL_V2` 標記，而非每次呼叫都重建設定 - [PR #30989](https://github.com/BerriAI/litellm/pull/30989)
    - 當 `guardrail_mode` 是清單時，為 `_emit_once` 使用可雜湊的範圍 - [PR #31262](https://github.com/BerriAI/litellm/pull/31262)
    - 將 AgentOps OTLP exporter 指向 `otlp.agentops.ai` - [PR #31490](https://github.com/BerriAI/litellm/pull/31490)
- **一般**
    - 新增 `POST /v1/callbacks/logs`，讓回放記錄酬載透過回呼傳遞 - [PR #31134](https://github.com/BerriAI/litellm/pull/31134)

### 防護欄 {#guardrails}

- **[Bedrock Guardrails](../../docs/proxy/guardrails)**
    - 在 `apply_guardrail` 中依原始角色選取最新的使用者訊息 - [PR #30482](https://github.com/BerriAI/litellm/pull/30482)
- **一般**
    - 為訊息壓縮新增 headroom 防護欄 - [PR #31407](https://github.com/BerriAI/litellm/pull/31407)
    - 在請求期間與請求後量測防護欄延遲 - [PR #31414](https://github.com/BerriAI/litellm/pull/31414)
    - 讓 policy-pipeline 封鎖回應與直接附加防護欄一致 - [PR #31421](https://github.com/BerriAI/litellm/pull/31421)
    - 讓 Generic Guardrail 能承受內建工具與錯誤 - [PR #31461](https://github.com/BerriAI/litellm/pull/31461)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤**
    - 在支出記錄上儲存 `litellm_call_id`，以便 DB-to-trace 對應 - [PR #31344](https://github.com/BerriAI/litellm/pull/31344)
    - 在成本追蹤中保留 Anthropic `server_tool_use` web-search 用量 - [PR #31355](https://github.com/BerriAI/litellm/pull/31355)
    - 恢復每次查詢的 Gemini 3.x web-search 計費 - [PR #31363](https://github.com/BerriAI/litellm/pull/31363)
    - 在成本追蹤中保留 Gemini Embedding 2 `usageMetadata` - [PR #31354](https://github.com/BerriAI/litellm/pull/31354)
    - 更正區域處理加成僅適用於 gpt-5.4/5.5 系列 - [PR #31136](https://github.com/BerriAI/litellm/pull/31136)
    - 將所有每個 deployment 的定價覆寫與同層 deployment 分離 - [PR #31021](https://github.com/BerriAI/litellm/pull/31021)
- **支出 UI 與端點**
    - 將 logs-tab 總計整合進頁面查詢，以避免額外的 `COUNT(*)` - [PR #31423](https://github.com/BerriAI/litellm/pull/31423)
    - 支出管理端點與 OpenAI image-generation 成本計算器更新 - [PR #31185](https://github.com/BerriAI/litellm/pull/31185)

## MCP 閘道 {#mcp-gateway}

- **OAuth 2.0 v2 解析器**
    - 共用 OAuth 權杖基礎：challenge、store seam、具到期感知的快取、single-flight 重新整理 - [PR #31275](https://github.com/BerriAI/litellm/pull/31275)
    - 以型別化的 Result 建立 `outbound_credentials` 套件骨架 - [PR #31047](https://github.com/BerriAI/litellm/pull/31047)
    - 新增 `resolve_credentials` 派發骨架 - [PR #31056](https://github.com/BerriAI/litellm/pull/31056)
    - 將 v2 解析器嫁接到 `_create_mcp_client`（none + api_key static family）- [PR #31058](https://github.com/BerriAI/litellm/pull/31058)
    - 將 authorization_code MCP 遷移到 v2 解析器（單副本）[1/2] - [PR #31473](https://github.com/BerriAI/litellm/pull/31473)
    - 跨副本的單飛重新整理，用於 v2 每位使用者 OAuth 儲存庫 [2/2] - [PR #31493](https://github.com/BerriAI/litellm/pull/31493)
    - 使用上游 `resource_metadata` 來 challenge delegate-auth OAuth 伺服器 - [PR #31255](https://github.com/BerriAI/litellm/pull/31255)
    - 支援上游 OAuth 權杖端點的 `client_secret_basic` - [PR #31635](https://github.com/BerriAI/litellm/pull/31635)
- **存取控制**
    - 為 team-key MCP 存取採用最小權限預設並可選擇啟用 - [PR #31380](https://github.com/BerriAI/litellm/pull/31380)
    - 透過 no-mcp-servers sentinal 將金鑰範圍設為零個 MCP 伺服器 - [PR #31029](https://github.com/BerriAI/litellm/pull/31029)
    - 允許 `llm_api_routes` 虛擬金鑰透過 `/v1/mcp/tools` 列出 MCP 工具 - [PR #31031](https://github.com/BerriAI/litellm/pull/31031)
    - 讓 proxy 管理員將 MCP 伺服器指派給無 team 的金鑰 - [PR #31126](https://github.com/BerriAI/litellm/pull/31126)
    - 在每位使用者的憑證與環境變數端點中解析以設定檔定義的伺服器 - [PR #31171](https://github.com/BerriAI/litellm/pull/31171)
- **X-Forwarded-For 強化**
    - 新增 `mcp_xff_num_trusted_hops` 以強化 X-Forwarded-For 用戶端 IP 解析 - [PR #31257](https://github.com/BerriAI/litellm/pull/31257)
    - 更正 XFF 存取控制中誤導性的 no-trusted-proxy 警告 - [PR #31264](https://github.com/BerriAI/litellm/pull/31264)
    - 當存在 X-Forwarded-For 但 `use_x_forwarded_for` 關閉時，發出明確警告 - [PR #31266](https://github.com/BerriAI/litellm/pull/31266)
- **錯誤修正**
    - 停止在 AI Hub 與公開 hub API 上公開 MCP 伺服器 URL - [PR #30902](https://github.com/BerriAI/litellm/pull/30902)
    - 停止將 `/mcp` 路徑上的驗證失敗顯示為已取消的工具請求 - [PR #31011](https://github.com/BerriAI/litellm/pull/31011)
    - 依伺服器已知前綴解析 toolset 工具 - [PR #31254](https://github.com/BerriAI/litellm/pull/31254)
    - 停止在 MCP 用戶端中記錄 tool-call 輸入 - [PR #31393](https://github.com/BerriAI/litellm/pull/31393)
    - 持久化來自 on-create MCP OAuth Authorize & Fetch 的 DCR `client_id` - [PR #31920](https://github.com/BerriAI/litellm/pull/31920)
    - 持久化 DCR `client_id`，使互動式 OAuth 權杖重新整理能正常運作 - [PR #31912](https://github.com/BerriAI/litellm/pull/31912)
    - 將 `tools/list` 401 驗證失敗在單伺服器路由上顯示為 challenge - [PR #31921](https://github.com/BerriAI/litellm/pull/31921)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **串流與即時**
    - 預先暖機上游即時連線池，以降低工作階段建立延遲 - [PR #31163](https://github.com/BerriAI/litellm/pull/31163)
    - 當用戶端在首個 token 前的時間內中斷連線時，取消上游 LLM 串流 - [PR #31499](https://github.com/BerriAI/litellm/pull/31499)
    - 針對 `stream=true` 快取命中進行按字切分的快取重播 - [PR #30216](https://github.com/BerriAI/litellm/pull/30216)
    - 停止對累積的 Gemini 串流 JSON 進行 O(n^2) 的重新解析 - [PR #31297](https://github.com/BerriAI/litellm/pull/31297)
    - 在沒有備援的串流中途 429 時顯示乾淨的 `RateLimitError` - [PR #31298](https://github.com/BerriAI/litellm/pull/31298)
- **路由與逾時**
    - 將 `litellm_settings.request_timeout` 視為獨立的每次嘗試逾時 - [PR #31119](https://github.com/BerriAI/litellm/pull/31119)
    - 在 `async_function_with_retries` 中保護 `num_retries=None` - [PR #30036](https://github.com/BerriAI/litellm/pull/30036)
- **快取與 proxy**
    - 將 Redis 命名空間套用到所有金鑰操作 - [PR #31288](https://github.com/BerriAI/litellm/pull/31288)
    - 迴圈範圍內的非同步 Lua script 註冊 - [PR #31501](https://github.com/BerriAI/litellm/pull/31501)
    - 針對每個請求重新建構的 `_get_all_llm_api_params` 進行記憶化 - [PR #31430](https://github.com/BerriAI/litellm/pull/31430)
    - 預先計算 service-tier cost-key 後綴 - [PR #31431](https://github.com/BerriAI/litellm/pull/31431)
    - 限制超大請求造成的 event loop 阻塞 - [PR #31497](https://github.com/BerriAI/litellm/pull/31497)
    - 停止每次重新載入時都增長的 pass-through route registry - [PR #31314](https://github.com/BerriAI/litellm/pull/31314)
    - 只在存在時移除 `safe_dumps` 中的 NUL 位元組 - [PR #31424](https://github.com/BerriAI/litellm/pull/31424)
    - Semantic-caching（Redis/Qdrant）與 embedding-router 更新 - [PR #31305](https://github.com/BerriAI/litellm/pull/31305)
- **供應鏈與建置**
    - 升級有 osv 標記的相依套件，以清除已知 CVE - [PR #31122](https://github.com/BerriAI/litellm/pull/31122)
    - 升級 wolfi-base digest 以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)
    - 新增 Grype 映像掃描以檢查 OS 與函式庫 CVE - [PR #31151](https://github.com/BerriAI/litellm/pull/31151)
    - 強化 maturin 建置期間的 cargo fetches - [PR #31348](https://github.com/BerriAI/litellm/pull/31348)
    - 在綁定建置平台的 stage 中從原始碼建置 Admin UI - [PR #31130](https://github.com/BerriAI/litellm/pull/31130)

## 文件更新 {#documentation-updates}

- 新增 MCP 伺服器變更指南 - [PR #31038](https://github.com/BerriAI/litellm/pull/31038)

## 新貢獻者 {#new-contributors}

此版本僅包含既有維護者的變更；在此期間沒有新貢獻者。

## 完整變更記錄 {#full-changelog}

[`v1.90.0...v1.91.0`](https://github.com/BerriAI/litellm/compare/v1.90.0...v1.91.0)
