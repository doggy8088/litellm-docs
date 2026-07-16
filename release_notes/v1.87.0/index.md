---
title: "v1.87.0 - OCI 生成式 AI 提供者、Gemini 3.5 Flash Day-0、OAuth 伺服器的 MCP UI"
slug: "v1-87-0"
date: 2026-05-23T16:35:00
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

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.87.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.0
```

</TabItem>
</Tabs>

## 重點亮點 {#key-highlights}

- **OCI Generative AI 作為一級提供者** — 可用於正式環境的聊天、嵌入、串流、推理與工具使用，涵蓋 Cohere Command-A、Meta Llama 3.1/3.2/3.3/4、xAI Grok 3/4、Google Gemini 2.5，以及託管於 OCI 上的 OpenAI GPT-5；並包含完整的模型定價目錄。
- **Gemini 3.5 Flash Day-0 支援** — `gemini-3.5-flash` 與 `gemini-3.1-flash-lite` 已在 Vertex AI、Google AI Studio 和 OpenRouter 上推出，並完整支援定價、函式呼叫、網頁搜尋、程式碼執行與 managed-agents。
- **OAuth 工具請求的 MCP UI** — 儀表板現在可直接對 OAuth 保護的 MCP 伺服器解析工具清單與工具請求，另新增 Cursor 的原生 MCP OAuth 支援，以及更清楚的 OAuth 錯誤訊息。
- **Codex CLI 驗證強化** — 為 OpenAI Codex CLI 加入由 JWT 衍生的團隊別名與 SSO 表單 URL 流程，並在 CLI SSO 輪詢期間保留加入允許清單的 OIDC claim。
- **Anthropic 串流熱路徑效能** — 在代理程式的 Anthropic `/v1/messages` SSE 路徑上，TTFT 額外負擔降低約 90%，且持續吞吐量更高；此結果是在一個實際的 4-pod 部署中，針對 Anthropic 與 Bedrock Invoke 共同測得（wire 輸出已通過 parity 測試）；另包含 Bedrock SageMaker 的延遲載入回應串流。

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新提供者（1 個新增提供者） {#new-providers-1-new-provider}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [OCI Generative AI](https://docs.litellm.ai/docs/providers/oci) | `/v1/chat/completions`, `/v1/embeddings` | Oracle Cloud Infrastructure Generative AI 的官方整合。可用於正式環境的聊天、串流、推理、工具呼叫與嵌入，涵蓋 Cohere Command-A（含 Reasoning + Vision）、Meta Llama 3.1 / 3.2 / 3.3 / 4、xAI Grok 3 / 4、Google Gemini 2.5 與 OpenAI GPT-5。包含完整的模型定價目錄。 - [PR #28223](https://github.com/BerriAI/litellm/pull/28223) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（22 個新模型） {#new-model-support-22-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Azure | `azure/speech/azure-stt` | — | $0.000278/秒 | — | 音訊轉錄 |
| Fireworks AI | `fireworks_ai/glm-5p1` | 202,800 | $1.40 | $4.40 | 推理 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/glm-5p1` | 202,800 | $1.40 | $4.40 | 推理 |
| Gemini | `gemini/gemini-3.5-flash` | 1,048,576 | $1.50 | $9.00 | 音訊輸入、函式呼叫、平行函式呼叫、PDF 輸入、提示快取、推理、回應結構描述、系統訊息、工具選擇、URL 上下文、影片輸入、視覺、網頁搜尋、服務層級 |
| Gemini | `gemini/gemini-3.1-flash-lite` | 1,048,576 | $0.25 | $1.50 | 音訊輸入、程式碼執行、檔案搜尋、函式呼叫、平行函式呼叫、PDF 輸入、提示快取、推理、回應結構描述、系統訊息、工具選擇、URL 上下文、影片輸入、視覺、網頁搜尋、服務層級 |
| Vertex AI | `vertex_ai/gemini-3.5-flash` | 1,048,576 | $1.50 | $9.00 | 與 Gemini 直接相同 |
| Vertex AI | `vertex_ai/gemini-3.1-flash-lite` | 1,048,576 | $0.25 | $1.50 | 與 Gemini 直接相同 |
| Mistral | `mistral/ministral-8b-2512` | 262,144 | $0.15 | $0.15 | Assistant prefill、函式呼叫、回應結構描述、工具選擇、視覺 |
| OCI | `oci/openai.gpt-5` | 272,000 | $1.25 | $10.00 | 函式呼叫、推理、回應結構描述、視覺 |
| OCI | `oci/openai.gpt-5-mini` | 272,000 | $0.25 | $2.00 | 函式呼叫、推理、回應結構描述、視覺 |
| OCI | `oci/openai.gpt-5-nano` | 272,000 | $0.05 | $0.40 | 函式呼叫、推理、回應結構描述、視覺 |
| OCI | `oci/cohere.command-a-reasoning` | 256,000 | $1.56 | $1.56 | 推理、原生串流 |
| OCI | `oci/cohere.command-a-vision` | 256,000 | $1.56 | $1.56 | 函式呼叫、視覺、原生串流 |
| OCI | `oci/cohere.embed-multilingual-image-v3.0` | 512 | $0.10 | — | 嵌入、視覺 |
| OCI | `oci/meta.llama-3.1-8b-instruct` | 128,000 | $0.72 | $0.72 | 函式呼叫、原生串流 |
| OpenRouter | `openrouter/google/gemini-3.1-flash-lite` | 1,048,576 | $0.25 | $1.50 | 音訊輸入、程式碼執行、檔案搜尋、函式呼叫、平行函式呼叫、PDF 輸入、提示快取、推理、回應結構描述、系統訊息、工具選擇、URL 上下文、影片輸入、視覺、網頁搜尋 |
| OpenRouter | `openrouter/xiaomi/mimo-v2.5` | 1,048,576 | $0.40 | $2.00 | 函式呼叫、推理、視覺、音訊輸入、影片輸入、回應結構描述、提示快取 |
| OpenRouter | `openrouter/xiaomi/mimo-v2.5-pro` | 1,048,576 | $1.00 | $3.00 | 函式呼叫、推理、回應結構描述、提示快取 |
| Reducto | `reducto/parse-v3` | — | — | — | OCR |
| Reducto | `reducto/parse-legacy` | — | — | — | OCR |

另外，所有 `claude-opus-4-6`、`claude-opus-4-7` 與 `claude-sonnet-4-6` 區域變體都有 Vertex / Anthropic `supports_output_config` 標誌切換，且在 Cohere、Gemini、Meta 與 xAI 目錄項目之間有一個 `oci/*` `supports_native_streaming` 切換。

#### 功能 {#features}

- **[Gemini](https://docs.litellm.ai/docs/providers/gemini)**
    - 新增 `gemini-3.5-flash` 的 Day-0 支援 - [PR #28268](https://github.com/BerriAI/litellm/pull/28268)
    - 新增 `gemini-3.1-flash-lite` 模型成本對應表 - [PR #28320](https://github.com/BerriAI/litellm/pull/28320)
    - 額外的 `gemini-3.1-flash-lite` 定價項目 - [PR #27933](https://github.com/BerriAI/litellm/pull/27933)
    - Gemini managed-agents 支援 - [PR #28270](https://github.com/BerriAI/litellm/pull/28270)
- **[Azure](https://docs.litellm.ai/docs/providers/azure)**
    - 新增 Azure Speech STT 組態支援 - [PR #27482](https://github.com/BerriAI/litellm/pull/27482)
- **[OpenRouter](https://docs.litellm.ai/docs/providers/openrouter)**
    - 新增 Xiaomi MiMo-V2.5 與 MiMo-V2.5-Pro 模型項目 - [PR #27700](https://github.com/BerriAI/litellm/pull/27700)
    - 新增 `openrouter/google/gemini-3.1-flash-lite` 定價項目 - [PR #28280](https://github.com/BerriAI/litellm/pull/28280)

#### 錯誤修正 {#bug-fixes}

- **[Vertex AI](https://docs.litellm.ai/docs/providers/vertex)**
    - 在 Vertex Gemini 3.5+ 工具輪次中省略 `function_call.id`（新結構描述會拒絕此欄位） - [PR #28324](https://github.com/BerriAI/litellm/pull/28324)
    - `vertex_gemma`：從請求主體中移除 `context_management` - [PR #28438](https://github.com/BerriAI/litellm/pull/28438)
- **[Bedrock](https://docs.litellm.ai/docs/providers/bedrock)**
    - `bedrock/cohere`：將 `embedding_types` 作為 JSON 陣列傳送，而非字串 - [PR #28172](https://github.com/BerriAI/litellm/pull/28172)
    - 清理批次中繼資料以防止 Pydantic `ValidationError` - [PR #28202](https://github.com/BerriAI/litellm/pull/28202)
    - 將 STS 區域與 Bedrock `aws_region_name` 分離 - [PR #28245](https://github.com/BerriAI/litellm/pull/28245)
- **[SageMaker](https://docs.litellm.ai/docs/providers/sagemaker)**
    - 將原生 Cohere embed 載荷傳送至 Cohere SageMaker 端點 - [PR #28613](https://github.com/BerriAI/litellm/pull/28613)
- **[DeepSeek](https://docs.litellm.ai/docs/providers/deepseek)**
    - 使用原生 `/anthropic/v1/messages` 端點並清理工具 - [PR #28200](https://github.com/BerriAI/litellm/pull/28200)
- **[Azure](https://docs.litellm.ai/docs/providers/azure)**
    - 透過 `base_model` 將 Azure OpenAI 部署 ID 與模型名稱分離，讓 GPT-5 模型路由可在自訂部署名稱上運作 - [PR #28490](https://github.com/BerriAI/litellm/pull/28490)
    - 路由器：對原生 Azure 容器 ID 使用轉送的 `model_id` - [PR #27921](https://github.com/BerriAI/litellm/pull/27921)
- **[vLLM](https://docs.litellm.ai/docs/providers/vllm)**
    - 修正在 vLLM 部署上的 Anthropic 工具呼叫轉換 - [PR #28549](https://github.com/BerriAI/litellm/pull/28549)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Interactions API](https://docs.litellm.ai/docs/interactions)**
    - 依照 Google Interactions API 步驟 schema（2026 年 5 月修訂版）進行遷移 - [PR #28153](https://github.com/BerriAI/litellm/pull/28153)
- **Google 原生 passthrough**
    - 解碼位元組並為 Google 原生 `streamGenerateContent` 透過 SSE 傳遞（wire 上不再有 `b'...'` 字面值） - [PR #28213](https://github.com/BerriAI/litellm/pull/28213)

#### 錯誤 {#bugs}

- **[Responses API](https://docs.litellm.ai/docs/response_api)**
    - 在 Anthropic、Bedrock 和 Vertex 的 completion-transformation 路徑上轉送 `timeout` - [PR #28133](https://github.com/BerriAI/litellm/pull/28133)
    - 接受來自 Anthropic Responses bridge 的 dict 形狀 `reasoning_effort` - [PR #28201](https://github.com/BerriAI/litellm/pull/28201)
    - 為中途路由備援包裝 `aresponses` 串流 iterator - [PR #28215](https://github.com/BerriAI/litellm/pull/28215)
    - 解除 staging 阻擋 — `aresponses` 串流備援的 mypy + coverage - [PR #28318](https://github.com/BerriAI/litellm/pull/28318)
    - 從 OpenAI Responses API 請求中移除 Anthropic `cache_control` - [PR #28431](https://github.com/BerriAI/litellm/pull/28431)
    - 將 OpenAI `SSEDecoder` 用於 Responses API 串流 - [PR #28566](https://github.com/BerriAI/litellm/pull/28566)
    - 將 `openai/responses` bridge 快取命中重播為 chat streams - [PR #28158](https://github.com/BerriAI/litellm/pull/28158)
- **[Interactions API](https://docs.litellm.ai/docs/interactions)**
    - 絕不捨棄串流文字 delta；一律發出終端 completion - [PR #28394](https://github.com/BerriAI/litellm/pull/28394)
- **[Batch API](https://docs.litellm.ai/docs/batches)**
    - 在 `ManagedObjectTable` 寫入前將 batch 檔案 ID 正規化 - [PR #28339](https://github.com/BerriAI/litellm/pull/28339)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **模型 + 端點**
    - 在 models table 新增 pause/resume 切換開關 - [PR #28151](https://github.com/BerriAI/litellm/pull/28151)
- **支出記錄**
    - 在 UI 中整合篩選狀態並抽出元件 - [PR #25847](https://github.com/BerriAI/litellm/pull/25847)
- **試玩場**
    - Playground 中支援 SSE 串流的 Interactions API endpoint - [PR #28156](https://github.com/BerriAI/litellm/pull/28156)
- **直通路由**
    - Team passthrough routes — 建立對等功能 + 修正編輯載入 - [PR #28098](https://github.com/BerriAI/litellm/pull/28098)
    - 將 `team.allowed_passthrough_routes` 寫入限制給 proxy 管理員 - [PR #28097](https://github.com/BerriAI/litellm/pull/28097)
- **驗證 / Codex CLI**
    - Codex CLI JWT team alias 傳播 - [PR #28621](https://github.com/BerriAI/litellm/pull/28621)
    - Codex CLI SSO 表單 URL 流程 - [PR #28271](https://github.com/BerriAI/litellm/pull/28271)
    - 在 CLI SSO poll 中保留 allowlisted OIDC claims - [PR #28463](https://github.com/BerriAI/litellm/pull/28463)
- **虛擬金鑰**
    - 將資料庫中 key/team metadata 內的 `callback_vars` 靜態加密 - [PR #27141](https://github.com/BerriAI/litellm/pull/27141)

#### 錯誤 {#bugs-1}

- **驗證 / 探索**
    - 填充 wildcard discovery credentials，讓 OIDC discovery 可對 wildcarded providers 運作 - [PR #28284](https://github.com/BerriAI/litellm/pull/28284)
- **支出記錄**
    - 還原 log-filter 載入指示器 - [PR #28282](https://github.com/BerriAI/litellm/pull/28282)
- **終端使用者記錄**
    - 修正 end-user logs 顯示 - [PR #27758](https://github.com/BerriAI/litellm/pull/27758)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Prometheus](https://docs.litellm.ai/docs/proxy/logging#prometheus)**
    - 發出每種 token 類型的詳細 metrics — 五個稀疏計數器，用以區分提供者已回報的 `usage.prompt_tokens_details` / `usage.completion_tokens_details` 欄位（LIT-3220） - [PR #28372](https://github.com/BerriAI/litellm/pull/28372)
    - 將 `user_email` 和 `user_alias` 標籤新增至使用者預算 metrics - [PR #28155](https://github.com/BerriAI/litellm/pull/28155)
- **[OpenTelemetry](https://docs.litellm.ai/docs/proxy/logging#opentelemetry)**
    - 將 `team_id` 和 `team_alias` 傳播至所有子 OTEL spans - [PR #28273](https://github.com/BerriAI/litellm/pull/28273)
    - 在違規時發出 guardrail span，並顯示狀態 + 類別 - [PR #28364](https://github.com/BerriAI/litellm/pull/28364)
    - 在 OTEL traces 中將 `guardrail_response` 序列化為 JSON - [PR #28362](https://github.com/BerriAI/litellm/pull/28362)
    - 在所有錯誤回應上標記 `http.response.status_code` - [PR #28405](https://github.com/BerriAI/litellm/pull/28405)

### 防護欄 {#guardrails}

- **[Microsoft Purview DLP](https://docs.litellm.ai/docs/proxy/guardrails)**
    - Microsoft Purview DLP 的新防護欄整合 - [PR #24966](https://github.com/BerriAI/litellm/pull/24966)

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **Spend Counter** — 透過 `SET NX` 初始化 Redis counter，以防止冷啟動時跨 pod 重複初始化 - [PR #27854](https://github.com/BerriAI/litellm/pull/27854)
- **成本追蹤** — 在 router retry 失敗後重新計算成本，讓記錄的成本反映實際成功的嘗試 - [PR #28476](https://github.com/BerriAI/litellm/pull/28476)
- **成本追蹤** — 在 `_check_provider_match` 中將 `litellm_provider=None` 視為萬用字元，以便成本查找可適用於省略 provider 欄位的目錄項目 - [PR #28523](https://github.com/BerriAI/litellm/pull/28523)

## MCP 閘道 {#mcp-gateway}

- **UI 中的 OAuth** — 透過儀表板為受 OAuth 保護的 MCP servers 新增工具呼叫與工具清單支援 - [PR #28454](https://github.com/BerriAI/litellm/pull/28454)
- **Cursor OAuth** — 允許 Cursor 原生 MCP OAuth 支援 - [PR #28327](https://github.com/BerriAI/litellm/pull/28327)
- **Auth Resolution** — 在 `tools/list` 上的 JWT 與 REST `tools/call` server 解析 - [PR #28227](https://github.com/BerriAI/litellm/pull/28227)
- **Cold-Start Init** — 在冷閘道初始化時轉送上游 `initialize` 指示 - [PR #28231](https://github.com/BerriAI/litellm/pull/28231)
- **OAuth Errors** — 在 OAuth flow 錯誤回應中新增 `error_description` 與提示 - [PR #28471](https://github.com/BerriAI/litellm/pull/28471)
- **Inspector** — 去除 MCP inspector tool-call 輸入中的空白 - [PR #28203](https://github.com/BerriAI/litellm/pull/28203)

## 效能 / 負載平衡 / 可靠度改進 {#performance--loadbalancing--reliability-improvements}

- **Anthropic `/v1/messages` streaming hot path** — 在 proxy 的 Anthropic 串流路徑上降低每請求與每區塊的額外負擔，並以 parity tests 確保位元組層級的 wire 輸出一致，這些測試會比較快速與舊路徑之間記錄與計費 payload。於實際 4 pod `m7i.xlarge` 部署（無 HPA）上進行測量，每個請求串流 256 個 `text_delta` 區塊，並同時對 Anthropic 與 Bedrock Invoke 進行測試 — **TTFT 額外負擔約降低 90%**，且**持續吞吐量更高**（完整數據如下） - [PR #28289](https://github.com/BerriAI/litellm/pull/28289)
    - 跳過預設設定中屬於 no-op 的工作：在 tracing 關閉時的每區塊 Datadog span、當沒有 callback / guardrail / cost-injection 啟用時的每區塊串流 hook，以及當沒有 callback 覆寫其 hook 時的 agentic post-processing wrapper（否則它會緩衝每個區塊，並僅為了呼叫所有都回傳 `(False, {})` 的 hooks 而從 SSE 重建回應）。
    - 停止每個請求重複做相同工作：請求本文只序列化一次並重用於 pre-call 記錄與 wire，將 optional-params 型別提示解析記憶化（約 80µs/請求），並在 async wrapper 已完成清理時略過冗餘的 `strip_empty_text_blocks` 掃描。
    - 更便宜的串流結束重建：在 `content_block_delta` text events 進入 `stream_chunk_builder` 前，先將同質連續事件壓縮成單一等效 SSE event，以移除 O(output-token) 的 `ModelResponseStream` 建構；tool-use / thinking / citations streams 仍回退至不變的舊路徑。
    - 更便宜的 hot-path 記錄：在 `isEnabledFor(DEBUG)` 之後才進行 debug f-string 評估，將 `cost_injection_active` 移出每區塊迴圈，並在 `async_sse_data_generator` 中每個區塊減少一層 async-generator。

*Anthropic `/v1/messages` 串流，每請求 256 個 `text_delta` 區塊 — `m7i.xlarge` 上的 4 個 pod（4 vCPU / 16 GB），無 HPA：*

| 指標 | 基準（`v1.87.0-dev.1`） | 已修補（[#28289](https://github.com/BerriAI/litellm/pull/28289)) | 變化 |
| --- | --- | --- | --- |
| TPM（p50 / p95 / p99） | 2634 / 2808 / 2867 | 2952 / 2968 / 2971 | +12% / +6% / +4% |
| TTFT 額外負擔 %（p50 / p95 / p99） | 2220 / 3057 / 3111 | 165 / 316 / 328 | 約降低 90% |

- **Bedrock / SageMaker** — 切換為對回應串流採用延遲載入 - [PR #28189](https://github.com/BerriAI/litellm/pull/28189)
- **Granian ASGI** — 新增 Granian 作為支援的 ASGI 伺服器，以提升吞吐穩定性 - [PR #26027](https://github.com/BerriAI/litellm/pull/26027)
- **Prisma** — 開放 Prisma idle/connect timeout 與額外 DB URL 參數，讓正式環境部署可調整連線池 - [PR #28395](https://github.com/BerriAI/litellm/pull/28395)
- **Proxy auth** — 針對表單本文採用嚴格的 media type 比對（防範模糊不清的 `Content-Type`）- [PR #27939](https://github.com/BerriAI/litellm/pull/27939)
- **Proxy auth** — 將 ASGI path 帶入 WebSocket auth 的 synthetic Request，讓 auth 能解析正確的路由 - [PR #27940](https://github.com/BerriAI/litellm/pull/27940)
- **Docker** — 將 `npm` 還原到 non-root builder image，讓 UI builds 能在其中執行 - [PR #28519](https://github.com/BerriAI/litellm/pull/28519)
- **Helm** — 從預設 image tag 移除 `main-` 前綴 - [PR #28710](https://github.com/BerriAI/litellm/pull/28710)
- **License check** — 在 `check_licenses` 中讀取 PEP 639 `license-expression` metadata - [PR #28529](https://github.com/BerriAI/litellm/pull/28529)

## 文件更新 {#documentation-updates}

- 修正不正確的 `/v1/agents` 請求範例 - [PR #28131](https://github.com/BerriAI/litellm/pull/28131)
- 修正 Gemini-agents GET/DELETE docstrings 中誤導性的憑證傳遞範例 - [PR #28293](https://github.com/BerriAI/litellm/pull/28293)

## 一般 Proxy 改善 {#general-proxy-improvements}

測試、CI 與建置強化：

- 行為固定 harness + Key Tier-1 matrix（以及 tier-2/3 + team management endpoints + phase-4 payload matrix）- [PR #28321](https://github.com/BerriAI/litellm/pull/28321), [PR #28441](https://github.com/BerriAI/litellm/pull/28441), [PR #28620](https://github.com/BerriAI/litellm/pull/28620), [PR #28681](https://github.com/BerriAI/litellm/pull/28681)
- 穩定 image-edit VCR cassettes，以停止實際的 `gpt-image-1` 花費 - [PR #28110](https://github.com/BerriAI/litellm/pull/28110)
- 將 realtime + rerank tests 轉移離開已停用的 upstream models；將 `gpt-4o-audio-preview` 替換為 `gpt-audio-1.5`；預期 `session.created` 為 xAI realtime 初始事件 - [PR #28191](https://github.com/BerriAI/litellm/pull/28191), [PR #28281](https://github.com/BerriAI/litellm/pull/28281), [PR #28424](https://github.com/BerriAI/litellm/pull/28424)
- 強化不穩定的 proxy callback-leak detector - [PR #28195](https://github.com/BerriAI/litellm/pull/28195)
- E2E runner 已遷移至 `uv`；新增「All Proxy Models」key test - [PR #28313](https://github.com/BerriAI/litellm/pull/28313)
- UI-e2e：以特定 proxy model 建立 admin key；將 `LITELLM_LICENSE` 轉送至 UI e2e proxy - [PR #28365](https://github.com/BerriAI/litellm/pull/28365), [PR #28398](https://github.com/BerriAI/litellm/pull/28398)
- Vertex AI grounding test 可容忍暫時性的 500；streaming test 可容忍包在 `MidStreamFallbackError` 中的 Vertex 429 - [PR #28503](https://github.com/BerriAI/litellm/pull/28503), [PR #28669](https://github.com/BerriAI/litellm/pull/28669)
- 將 black 升級到 26.3.1 並重新套用格式；一次性 lint 修正 - [PR #28525](https://github.com/BerriAI/litellm/pull/28525), [PR #28639](https://github.com/BerriAI/litellm/pull/28639)
- 允許 model-prices schema 中的 `audio_transcription_config` - [PR #28708](https://github.com/BerriAI/litellm/pull/28708)
- 移除已失效的舊版 Playwright e2e suite - [PR #28632](https://github.com/BerriAI/litellm/pull/28632)
- 常例依賴項/CI 升級 - [PR #28287](https://github.com/BerriAI/litellm/pull/28287), [PR #28524](https://github.com/BerriAI/litellm/pull/28524), [PR #28528](https://github.com/BerriAI/litellm/pull/28528), [PR #27665](https://github.com/BerriAI/litellm/pull/27665), [PR #28296](https://github.com/BerriAI/litellm/pull/28296), [PR #28303](https://github.com/BerriAI/litellm/pull/28303), [PR #28707](https://github.com/BerriAI/litellm/pull/28707)

### 依擁有區域彙總 PR {#pr-roll-up-by-ownership-area}

依擁有區域分類的 PR（總計：93）
  - Other（CI / tests / build hardening）：25
  - Models & Providers（含新提供者）：18
  - UI / Auth & Management：12
  - LLM API Endpoints：11
  - Performance：9
  - Logging：6
  - MCP：6
  - Spend / Budgets / Rate Limits：3
  - Docs：2
  - Guardrails：1

## 新貢獻者 {#new-contributors}

- @IshaMeera 首次貢獻於 [#28131](https://github.com/BerriAI/litellm/pull/28131)
- @TorvaldUtne 首次貢獻於 [#27700](https://github.com/BerriAI/litellm/pull/27700)
- @adityasingh2400 首次貢獻於 [#28523](https://github.com/BerriAI/litellm/pull/28523)
- @cwang-otto 首次貢獻於 [#28133](https://github.com/BerriAI/litellm/pull/28133)
- @ro31337 首次貢獻於 [#28280](https://github.com/BerriAI/litellm/pull/28280)
- @withomasmicrosoft 首次貢獻於 [#28490](https://github.com/BerriAI/litellm/pull/28490)

**完整變更記錄**：https://github.com/BerriAI/litellm/compare/v1.86.0...v1.87.0

---

## 05/23/2026 (`v1.87.0`) {#05232026-v1870}

* 新提供者：1
* 新模型 / 已更新模型：17
* LLM API Endpoints：11
* 管理端點 / UI：12
* AI 整合（Logging / Guardrails / Secret Managers）：7
* Spend Tracking、Budgets 與 Rate Limiting：3
* MCP Gateway：6
* Performance / Loadbalancing / Reliability improvements：9
* 一般 Proxy 改善（testing / CI / build）：25
* 文件更新：2

總計：93 個 PR
