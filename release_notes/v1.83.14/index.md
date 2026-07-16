---
title: "v1.83.14 - GPT-5.5、Prompt Compression 與 Memory API"
slug: "v1-83-14"
date: 2026-04-27T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Ryan Crabbe
    title: Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/ryan-crabbe-0b9687214
    image_url: https://github.com/ryan-crabbe.png
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
  - name: Shivam Rawat
    title: Forward Deployed Engineer, LiteLLM
    url: https://linkedin.com/in/shivam-rawat-482937318
    image_url: https://github.com/shivamrawat1.png
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
docker.litellm.ai/berriai/litellm:main-v1.83.14-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.83.14
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **即日支援 GPT-5.5 與 GPT-5.5 Pro** — OpenAI 與 Azure 版本附帶完整價格對照表、日期化快照，以及 Pro 層級的 Responses 模式路由。
- **伺服器端 Prompt Compression** — 一級代理回呼，在長上下文輸入（Claude Code、RAG、文件工作負載）送達上游模型前透明壓縮，無需用戶端選擇啟用。
- **`/v1/memory` CRUD 端點** — 代理現在公開一個記憶體儲存 API，具備 Prisma 支援的中繼資料，由新的 agent loop 使用。
- **LLM-as-a-Judge 防護欄** — 以模型評分的請求後防護欄，具備可設定的評分準則，加入 Bedrock / Lakera / Presidio / Noma 家族。
- **MCP OAuth 強化** — 可發現的 + BYOK authorize/token 端點已加強，臨時 OAuth 工作階段現在透過 Redis 在代理執行個體間共享，而且每個伺服器的存取政策在代理與 broker 中都一致執行。
- **成員級團隊預算正式上線** — 個別成員預算、Teams UI 中的每位成員週期呈現，以及用於使用者／組織支出檢查的原子計數器對齊。
- **自適應路由** — 可選用的路由器政策，在既有萬用字元備援之上，依近期延遲／錯誤歷史加權部署。

---

## 新模型／更新模型 {#new-models--updated-models}

#### 新模型支援（22 個新模型） {#new-model-support-22-new-models}

| 提供者       | 模型                                                                                  | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | Mode             |
| ------------ | -------------------------------------------------------------------------------------- | -------------- | ------------------- | -------------------- | ---------------- |
| OpenAI       | `gpt-5.5`, `gpt-5.5-2026-04-23`                                                        | 1,050,000      | $5.00               | $30.00               | 聊天             |
| OpenAI       | `gpt-5.5-pro`, `gpt-5.5-pro-2026-04-23`                                                | 1,050,000      | $60.00              | $360.00              | responses        |
| OpenAI       | `gpt-5.4-mini-2026-03-17`                                                              | 272,000        | $0.75               | $4.50                | 聊天             |
| OpenAI       | `gpt-5.4-nano-2026-03-17`                                                              | 272,000        | $0.20               | $1.25                | 聊天             |
| Azure OpenAI | `azure/gpt-5.5`, `azure/gpt-5.5-2026-04-23`                                            | 1,050,000      | $5.00               | $30.00               | 聊天             |
| Azure OpenAI | `azure/gpt-5.5-pro`, `azure/gpt-5.5-pro-2026-04-23`                                    | 1,050,000      | $60.00              | $360.00              | responses        |
| Azure OpenAI | `azure/gpt-5.4-mini-2026-03-17`                                                        | 1,050,000      | $0.75               | $4.50                | 聊天             |
| Azure OpenAI | `azure/gpt-5.4-nano-2026-03-17`                                                        | 1,050,000      | $0.20               | $1.25                | 聊天             |
| AWS Bedrock  | `anthropic.claude-mythos-preview`                                                      | 1,000,000      | -                   | -                    | 聊天             |
| AWS Bedrock  | `bedrock/us-east-1/zai.glm-5`, `bedrock/us-west-2/zai.glm-5`                           | 200,000        | $1.00               | $3.20                | 聊天             |
| AWS Bedrock  | `bedrock/us-east-1/minimax.minimax-m2.5`, `bedrock/us-west-2/minimax.minimax-m2.5`     | -              | -                   | -                    | 聊天             |
| Moonshot     | `moonshot/kimi-k2.6`                                                                   | 262,144        | $0.95               | $4.00                | 聊天             |
| OpenRouter   | `openrouter/anthropic/claude-opus-4.7`                                                 | 1,000,000      | $5.00               | $25.00               | 聊天             |
| Gemini       | `gemini/gemini-embedding-2`, `gemini-embedding-2`, `vertex_ai/gemini-embedding-2`      | 8,192          | $0.20               | -                    | embedding        |
| DashScope    | `dashscope/qwen-image-2.0`, `dashscope/qwen-image-2.0-pro`                             | -              | -                   | -                    | image_generation |

#### 功能 {#features}

- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 GLM-5 與 Minimax M2.5 項目及區域別別名 - [PR #24423](https://github.com/BerriAI/litellm/pull/24423)
    - 透過 `bedrock-mantle` 端點即日支援 Claude Mythos Preview - [PR #26196](https://github.com/BerriAI/litellm/pull/26196)
    - 允許清單化 Bedrock Invoke body 欄位並過濾所有 `anthropic-beta` 值 - [PR #26148](https://github.com/BerriAI/litellm/pull/26148)
- **[OpenAI](../../docs/providers/openai)**
    - 具版本的 GPT-5.4 mini / nano 快照 - [PR #26115](https://github.com/BerriAI/litellm/pull/26115)
    - 將 `gpt-5.5` 與 `gpt-5.5-pro` 加入模型成本對照表 - [PR #26345](https://github.com/BerriAI/litellm/pull/26345), [PR #26348](https://github.com/BerriAI/litellm/pull/26348)
    - 即日支援 GPT-5.5 與 GPT-5.5 Pro - [PR #26449](https://github.com/BerriAI/litellm/pull/26449)
- **[Azure OpenAI](../../docs/providers/azure)**
    - 具日期版本的 `azure/gpt-5.5` + `azure/gpt-5.5-pro` 項目 - [PR #26361](https://github.com/BerriAI/litellm/pull/26361)
- **[Gemini](../../docs/providers/gemini)**
    - Gemini Embedding 2 GA：成本對照表、部落格與測試 - [PR #26391](https://github.com/BerriAI/litellm/pull/26391)
    - 將 `VideoMetadata` 支援擴展至所有 Gemini 模型 - [PR #25767](https://github.com/BerriAI/litellm/pull/25767)
- **[Vertex AI](../../docs/providers/vertex)**
    - 多區域 Vertex hosts (`aiplatform.*.rep.googleapis.com`) - [PR #26281](https://github.com/BerriAI/litellm/pull/26281)
- **[DashScope](../../docs/providers/dashscope)**
    - 支援 `qwen-image-2.0` 與 `qwen-image-2.0-pro` 的圖片生成 - [PR #25672](https://github.com/BerriAI/litellm/pull/25672)
- **[Moonshot](../../docs/providers/moonshot)**
    - 將 `moonshot/kimi-k2.6` 加入模型登錄檔 - [PR #26203](https://github.com/BerriAI/litellm/pull/26203)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將已停用的 `claude-3-haiku-20240307` 參照遷移至 `claude-haiku-4-5-20251001` - [PR #26139](https://github.com/BerriAI/litellm/pull/26139)
- **一般**
    - 將 38 個模型從舊版 `max_tokens` 遷移至 `max_input_tokens` / `max_output_tokens` - [PR #24422](https://github.com/BerriAI/litellm/pull/24422)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 adapter 串流中保留 `tool_use` 輸入引數 - [PR #24355](https://github.com/BerriAI/litellm/pull/24355)
    - 從串流 `tool_use` ID 移除 Gemini thought 後綴 - [PR #25935](https://github.com/BerriAI/litellm/pull/25935)
    - 在 file-id 探索輔助工具中略過非 OpenAI 的檔案內容區塊 - [PR #26228](https://github.com/BerriAI/litellm/pull/26228)
    - 在 messages API 中處理 `tool_choice` 類型 `'none'` - [PR #24457](https://github.com/BerriAI/litellm/pull/24457)
- **[Azure](../../docs/providers/azure)**
    - 在搭配 `include_usage` 的串流中保留 `role='assistant'` - [PR #24354](https://github.com/BerriAI/litellm/pull/24354)
- **[Bedrock](../../docs/providers/bedrock)**
    - 排序 assistant 內容區塊，使文字先於 `toolUse` - [PR #24368](https://github.com/BerriAI/litellm/pull/24368)
    - 為 Claude Sonnet/Opus 4.6 + Sonnet 4.6 修正 20 萬以上 token 的定價，`max_input_tokens` 為 1M - [PR #24164](https://github.com/BerriAI/litellm/pull/24164)
- **[Gemini](../../docs/providers/gemini)**
    - 從 embedding 請求中過濾 params - [PR #24370](https://github.com/BerriAI/litellm/pull/24370)
    - 從 `model_info` 讀取 web search 成本，而非硬編碼 - [PR #24372](https://github.com/BerriAI/litellm/pull/24372)
    - 在成本計算中包含 DOCUMENT 模態 token - [PR #24410](https://github.com/BerriAI/litellm/pull/24410)
- **[Vertex AI](../../docs/providers/vertex)**
    - 在 `multimodalembedding` 請求中轉送 `dimensions` 參數 - [PR #24415](https://github.com/BerriAI/litellm/pull/24415)
- **[Zhipu / GLM](../../docs/providers/zhipu)**
    - 映射非標準 `finish_reason` 值 - [PR #24373](https://github.com/BerriAI/litellm/pull/24373)
- **[OVHcloud](../../docs/providers/ovhcloud)**
    - 修正 tool calling 無法運作的問題 - [PR #25948](https://github.com/BerriAI/litellm/pull/25948)
- **[Scaleway](../../docs/providers/scaleway)**
    - 新增音訊支援 - [PR #26110](https://github.com/BerriAI/litellm/pull/26110)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 擷取 Responses API 與 Chat Completions 橋接器之間共用的格式對應 - [PR #24417](https://github.com/BerriAI/litellm/pull/24417)
    - `use_chat_completions_api` 旗標，用於具有自訂 `api_base` 的 `openai/` 模型 - [PR #25346](https://github.com/BerriAI/litellm/pull/25346)
    - `route_all_chat_openai_to_responses` 全域旗標 - [PR #25359](https://github.com/BerriAI/litellm/pull/25359)
    - 移除所有提供者的 `custom_tool_call` 命名空間 - [PR #26221](https://github.com/BerriAI/litellm/pull/26221)
- **[Anthropic Messages API](../../docs/anthropic_unified)**
    - 將 `reasoning_auto_summary` 對應為原生 `/v1/messages` 的 `thinking.display` - [PR #25883](https://github.com/BerriAI/litellm/pull/25883)
    - 以優雅降級方式標準化 reasoning effort - [PR #26111](https://github.com/BerriAI/litellm/pull/26111)
- **記憶 API**
    - 新增 `/v1/memory` CRUD 端點 - [PR #26218](https://github.com/BerriAI/litellm/pull/26218)
    - Memory 改進 v2 - [PR #26541](https://github.com/BerriAI/litellm/pull/26541)
- **一般**
    - 在 Responses API 中套用 GPT-5 temperature 驗證 - [PR #24371](https://github.com/BerriAI/litellm/pull/24371)

#### 錯誤修正 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 標準化橋接的 object 欄位 - [PR #26327](https://github.com/BerriAI/litellm/pull/26327)
- **[Anthropic Messages API](../../docs/anthropic_unified)**
    - 在 `/v1/messages` 記錄中保留 `anthropic_messages` 呼叫類型 - [PR #26248](https://github.com/BerriAI/litellm/pull/26248)
- **[Image API](../../docs/image_generation)**
    - 將 `litellm_params` 轉送至 `validate_environment`，供 `image_edit` 中的 Vertex AI 憑證使用 - [PR #26160](https://github.com/BerriAI/litellm/pull/26160)
    - 在 image edit 端點強制僅接受 multipart 檔案輸入 - [PR #26293](https://github.com/BerriAI/litellm/pull/26293)
    - 將 image URL 擷取與已驗證的 HTTP client 對齊（Bedrock + token counter 路徑）- [PR #26272](https://github.com/BerriAI/litellm/pull/26272)
- **[Vector Stores](../../docs/vector_stores)**
    - 恢復具備團隊範圍部署的 vector store 端點 BYOK 金鑰注入 - [PR #25746](https://github.com/BerriAI/litellm/pull/25746)
    - 尊重受管理 vector store 端點的物件層級權限 - [PR #26351](https://github.com/BerriAI/litellm/pull/26351)
- **記憶 API**
    - 在 `/v1/memory` 前將 metadata 轉為 JSON 後再寫入 Prisma - [PR #26536](https://github.com/BerriAI/litellm/pull/26536)
- **一般**
    - 強化 passthrough 目標 URL 建構 - [PR #26467](https://github.com/BerriAI/litellm/pull/26467)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰 / 驗證**
    - 在 `POST /model/update` 後重新整理 router - [PR #26427](https://github.com/BerriAI/litellm/pull/26427)
    - 移動時自動將 SSO 團隊成員新增至 org（僅 proxy admin）- [PR #26377](https://github.com/BerriAI/litellm/pull/26377)
    - 使用 `x-litellm-team-id` 的管理員套用團隊 TPM/RPM + 歸因 - [PR #26438](https://github.com/BerriAI/litellm/pull/26438)
    - 當 JWT 沒有 `team_id` 時，採用單一團隊 DB 備援 - [PR #26418](https://github.com/BerriAI/litellm/pull/26418)
- **UI**
    - 團隊資訊頁上的「My User」分頁 - [PR #26520](https://github.com/BerriAI/litellm/pull/26520)
    - Users 分頁上的 Send Invitation Email 切換開關 - [PR #25808](https://github.com/BerriAI/litellm/pull/25808)
    - 供 org 管理員停用 `/key/generate` 的 UI 設定 - [PR #26442](https://github.com/BerriAI/litellm/pull/26442)
    - Spend Logs 上可排序的 Model 與 TTFT 欄位 - [PR #26488](https://github.com/BerriAI/litellm/pull/26488)
    - 在 Teams › Members 分頁顯示每位成員的 budget 週期 - [PR #26207](https://github.com/BerriAI/litellm/pull/26207)
- **重構**
    - 將 projects 管理移至 enterprise 套件 - [PR #25677](https://github.com/BerriAI/litellm/pull/25677)

#### 錯誤修正 {#bugs-1}

- **虛擬金鑰 / 驗證**
    - 集中處理 `common_checks` 以封堵授權繞過 - [PR #26279](https://github.com/BerriAI/litellm/pull/26279)
    - 收緊 key 路由欄位上的呼叫端權限檢查 - [PR #26492](https://github.com/BerriAI/litellm/pull/26492)
    - 將呼叫端權限檢查擴展至 service-account + 收緊 raw-body 接受條件 - [PR #26493](https://github.com/BerriAI/litellm/pull/26493)
    - 在 `/key/regenerate` 上強制執行 `upperbound_key_generate_params` - [PR #26340](https://github.com/BerriAI/litellm/pull/26340)
    - 在 `/key/update` 的 metadata 中保留 `service_account_id` - [PR #26004](https://github.com/BerriAI/litellm/pull/26004)
    - 將 `/global/spend/*` 路由限制為 admin 角色 - [PR #26490](https://github.com/BerriAI/litellm/pull/26490)
    - 強化 `/team/new` 與 `/team/update` 中的團隊 metadata 處理 - [PR #26464](https://github.com/BerriAI/litellm/pull/26464)
    - 將請求本文參數限制擴展至雲端提供者 auth 欄位 - [PR #26264](https://github.com/BerriAI/litellm/pull/26264)
    - 在提供者 URL 參數上強制執行格式限制 - [PR #26287](https://github.com/BerriAI/litellm/pull/26287)
    - 將 RAG ingestion 設定繫結到已儲存的憑證值 - [PR #26512](https://github.com/BerriAI/litellm/pull/26512)
    - 將 RAG ingestion 憑證清理範圍擴大至 AWS endpoint/identity 欄位 - [PR #26525](https://github.com/BerriAI/litellm/pull/26525)
    - 強化 `/model/info` 對複數憑證欄位名稱的遮罩 - [PR #26513](https://github.com/BerriAI/litellm/pull/26513)
- **UI**
    - 在 model 編輯時停止注入 $0 成本 - [PR #26001](https://github.com/BerriAI/litellm/pull/26001)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **一般**
    - 將 `litellm_call_id` 新增至 `StandardLoggingPayload` 與 OTel span - [PR #26133](https://github.com/BerriAI/litellm/pull/26133)
- **[Vertex AI Passthrough](../../docs/pass_through/vertex_ai)**
    - 記錄 `:embedContent` 與 `:batchEmbedContents` 回應 - [PR #26146](https://github.com/BerriAI/litellm/pull/26146)

### 防護欄 {#guardrails}

- **[Bedrock 防護欄](../../docs/proxy/guardrails/bedrock_guardrails)**
    - 在掃描模型回應時，對 `apply_guardrail` 使用 Bedrock OUTPUT 來源 - [PR #26144](https://github.com/BerriAI/litellm/pull/26144)
    - 當只設定 `post_call` 時，去重複 post-call 記錄項目 - [PR #26474](https://github.com/BerriAI/litellm/pull/26474)
    - spend logs 的 hook mode + match redaction + streaming `request_data` - [PR #25854](https://github.com/BerriAI/litellm/pull/25854), [PR #26266](https://github.com/BerriAI/litellm/pull/26266)
- **LLM-as-a-Judge**
    - 推出 LLM-as-a-Judge 防護欄 - [PR #26360](https://github.com/BerriAI/litellm/pull/26360)
- **一般**
    - 團隊層級防護欄與全域政策防護欄可以同時執行 - [PR #26466](https://github.com/BerriAI/litellm/pull/26466)
    - 清單與提交端點中的防護欄參數處理 - [PR #26390](https://github.com/BerriAI/litellm/pull/26390)
    - 在串流 post-call 時記錄 `guardrail_information` - [PR #26448](https://github.com/BerriAI/litellm/pull/26448)
    - 當 post-call 防護欄阻擋時，抑制延後的成功記錄 - [PR #26528](https://github.com/BerriAI/litellm/pull/26528)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **每位成員的預算**
    - 個別團隊成員預算 - [PR #26208](https://github.com/BerriAI/litellm/pull/26208)
    - 追蹤團隊會員的每位成員總支出 - [PR #26195](https://github.com/BerriAI/litellm/pull/26195)
    - 修正每位團隊成員預算繞過問題 - [PR #26204](https://github.com/BerriAI/litellm/pull/26204)
- **速率限制**
    - 在 counter miss 時，從資料庫重新播種 enforcement 讀取路徑 - [PR #26459](https://github.com/BerriAI/litellm/pull/26459)
- **預算**
    - 將使用者與組織預算支出檢查對齊至原子計數器模式 - [PR #26182](https://github.com/BerriAI/litellm/pull/26182)
    - 修正因 Prisma `Json?` null 過濾器而失敗的預算視窗重設 - [PR #26346](https://github.com/BerriAI/litellm/pull/26346)

---

## MCP 閘道 {#mcp-gateway}

- **OAuth**
    - 強化 OAuth `authorize`/`token` 端點（BYOK + 可探索）- [PR #26274](https://github.com/BerriAI/litellm/pull/26274)
    - 透過 Redis 在執行個體之間共享暫時性 MCP OAuth 工作階段 - [PR #26162](https://github.com/BerriAI/litellm/pull/26162), [PR #26318](https://github.com/BerriAI/litellm/pull/26318)
    - 將 MCP OAuth proxy 端點與每台伺服器的存取政策對齊 - [PR #26516](https://github.com/BerriAI/litellm/pull/26516)
    - MCP broker OAuth 端點存取控制 - [PR #26142](https://github.com/BerriAI/litellm/pull/26142)
- **權限 / 路由**
    - 依名稱或別名解析團隊/金鑰 MCP 權限 - [PR #26338](https://github.com/BerriAI/litellm/pull/26338)
    - 將 MCP 路由拆分為推論與管理（解除 `DISABLE_LLM_API_ENDPOINTS` 節點上的 Admin UI 阻塞）- [PR #26367](https://github.com/BerriAI/litellm/pull/26367)
- **工具篩選**
    - 在 `mcp_semantic_tool_filter` 中比對帶有用戶端命名空間前綴的工具 - [PR #26117](https://github.com/BerriAI/litellm/pull/26117)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由**
    - 自適應路由 - [PR #26049](https://github.com/BerriAI/litellm/pull/26049)
    - 萬用字元順序備援至較高層級的部署 - [PR #25772](https://github.com/BerriAI/litellm/pull/25772)
- **Prompt 壓縮**
    - 一等公民的伺服器端 prompt 壓縮回呼 - [PR #25729](https://github.com/BerriAI/litellm/pull/25729)
- **可靠性**
    - 修正資料庫無法連線時的 `/health/readiness` 503 迴圈 - [PR #26134](https://github.com/BerriAI/litellm/pull/26134)
- **開發者易用性**
    - 供 uvicorn 熱重載使用的 `--reload` 旗標（僅限開發）- [PR #25901](https://github.com/BerriAI/litellm/pull/25901)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

- **建置 / Docker**
    - 簡化 `Dockerfile.non_root` 建置時間 - [PR #26055](https://github.com/BerriAI/litellm/pull/26055)
    - 在 `docker.non_root` 中為 K8s `runAsNonRoot` 使用數值 UID 65534 - [PR #26268](https://github.com/BerriAI/litellm/pull/26268)
    - 還原 pre-uv Prisma 快取路徑 - [PR #26201](https://github.com/BerriAI/litellm/pull/26201)
- **遷移**
    - 可選加入 v2 遷移解析器 - [PR #26194](https://github.com/BerriAI/litellm/pull/26194)
    - 遷移工作流程中的新鮮度與破壞性防護 - [PR #26185](https://github.com/BerriAI/litellm/pull/26185)
- **CI / 基礎設施**
    - 將更多 CI 工作從 CircleCI 遷移到 GitHub Actions - [PR #26261](https://github.com/BerriAI/litellm/pull/26261)
    - CCI：快取、清理、anchors、install-path 一致性、Python 3.12、Ruby/Node pins - [PR #26286](https://github.com/BerriAI/litellm/pull/26286)
    - CircleCI 設定清理與整併 - [PR #26226](https://github.com/BerriAI/litellm/pull/26226)
    - 加快 proxy 單元測試並將 `proxy-utils` 拆成獨立的 matrix 項目 - [PR #26150](https://github.com/BerriAI/litellm/pull/26150)
    - 移除 CCI/GHA 測試重複並以語意方式分片 proxy DB 測試 - [PR #26356](https://github.com/BerriAI/litellm/pull/26356)
    - 獨立的 `create-release-branch` 工作流程 + `contents:write` 權限 - [PR #26342](https://github.com/BerriAI/litellm/pull/26342), [PR #26359](https://github.com/BerriAI/litellm/pull/26359)
    - 供應鏈防護以封鎖修改依賴項的 fork PR - [PR #26511](https://github.com/BerriAI/litellm/pull/26511)
    - 對 `auth_ui_unit_tests` 使用 Postgres sidecar，而非共享資料庫 - [PR #26141](https://github.com/BerriAI/litellm/pull/26141)
    - 修正 Ubuntu 上 `e2e_ui_testing` 的 stale-bundle 問題（`cp -r` 合併語意）- [PR #26047](https://github.com/BerriAI/litellm/pull/26047)
    - 套用 black 格式化以修正 CI lint 失敗 - [PR #26140](https://github.com/BerriAI/litellm/pull/26140)
- **測試穩定性**
    - 穩定化支出準確性測試 + 修補 Redis buffer 資料遺失路徑 - [PR #26270](https://github.com/BerriAI/litellm/pull/26270)
    - 穩定化支出準確性測試傳輸層偶發失敗 - [PR #26290](https://github.com/BerriAI/litellm/pull/26290)
    - 消除支出追蹤測試的不穩定性 - [PR #26349](https://github.com/BerriAI/litellm/pull/26349)
    - 在 `test_router_caching_ttl` 中排空記錄工作者以修正不穩定性 - [PR #26355](https://github.com/BerriAI/litellm/pull/26355)
    - 分離 `master_key`/`prisma_client` 模組全域變數於各 proxy 測試之間 - [PR #26362](https://github.com/BerriAI/litellm/pull/26362)
- **封裝 / 依賴項**
    - 提升有漏洞的依賴項版本 - [PR #26365](https://github.com/BerriAI/litellm/pull/26365)
    - 在 `litellm-proxy-extras` 中繼資料中宣告 MIT 授權 - [PR #26369](https://github.com/BerriAI/litellm/pull/26369)
    - 在 `litellm-enterprise` 中繼資料中宣告專有授權 - [PR #26457](https://github.com/BerriAI/litellm/pull/26457)
- **UI**
    - Request Logs 頁面上的 Fetch 按鈕忽略作用中的篩選條件 - [PR #25788](https://github.com/BerriAI/litellm/pull/25788)
    - 在 Request Logs 上排序／頁面／時間變更後套用過時的篩選條件 - [PR #25789](https://github.com/BerriAI/litellm/pull/25789)
- **雜項**
    - 在 `is_model_gpt_5_model` 中以 `startswith` 取代子字串檢查 - [PR #25793](https://github.com/BerriAI/litellm/pull/25793)

---

## 文件更新 {#documentation-updates}

- 在 View All 頁面新增缺少的可觀測性整合 - [PR #24420](https://github.com/BerriAI/litellm/pull/24420)
- 釐清 proxy 文件中的 `x-litellm-model-group` 與提供者 model id 之間的差異 - [PR #25497](https://github.com/BerriAI/litellm/pull/25497)
- Gemini 3 thinking_level 預設值與發行說明 - [PR #25842](https://github.com/BerriAI/litellm/pull/25842)
- 對齊部落格與文件頁面的 fenced code block padding - [PR #25932](https://github.com/BerriAI/litellm/pull/25932)
- 在 prompt caching 文件中新增支援的提供者 - [PR #26124](https://github.com/BerriAI/litellm/pull/26124)
- 移除 `docs/my-website`，將貢獻者導向 `BerriAI/litellm-docs` - [PR #26454](https://github.com/BerriAI/litellm/pull/26454)

---

## 新貢獻者 {#new-contributors}

- @dongyu-turo 首次貢獻於 [#24164](https://github.com/BerriAI/litellm/pull/24164)
- @Alpha-Zark 首次貢獻於 [#25672](https://github.com/BerriAI/litellm/pull/25672)
- @vinhphamhuu-ct 首次貢獻於 [#25767](https://github.com/BerriAI/litellm/pull/25767)
- @Bytechoreographer 首次貢獻於 [#25788](https://github.com/BerriAI/litellm/pull/25788)
- @BraulioV 首次貢獻於 [#25793](https://github.com/BerriAI/litellm/pull/25793)
- @Vigilans 首次貢獻於 [#25883](https://github.com/BerriAI/litellm/pull/25883)
- @nhyy244 首次貢獻於 [#26110](https://github.com/BerriAI/litellm/pull/26110)
- @sakenuGOD 首次貢獻於 [#26117](https://github.com/BerriAI/litellm/pull/26117)
- @Michael-RZ-Berri 首次貢獻於 [#26124](https://github.com/BerriAI/litellm/pull/26124)
- @anmolg1997 首次貢獻於 [#26228](https://github.com/BerriAI/litellm/pull/26228)

**完整變更記錄**: https://github.com/BerriAI/litellm/compare/v1.83.10-stable...v1.83.14-stable

---

## 04/27/2026 {#04272026}

* 新模型 / 更新模型：29
* LLM API 端點：18
* 管理端點 / UI：23
* AI 整合（記錄 / 防護欄）：11
* 支出追蹤、預算與速率限制：6
* MCP 閘道：8
* 效能 / 負載平衡 / 可靠性改善：5
* 一般 Proxy 改進：27
* 文件更新：6
