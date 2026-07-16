---
title: "v1.80.5-stable - Gemini 3.0 支援"
slug: "v1-80-5"
date: 2025-11-22T10:00:00
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

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.80.5-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.5
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Gemini 3** - [支援 Gemini 3 模型的 Day-0，包含 thought signatures](../../blog/gemini_3)
- **提示管理** - [完整的提示版本控管支援，具備可編輯、測試與版本歷史的 UI](../../docs/proxy/litellm_prompt_management)
- **MCP Hub** - [在您的組織內發布並探索 MCP 伺服器](../../docs/proxy/ai_hub#mcp-servers)
- **模型比較 UI** - [並排模型比較介面，用於測試](../../docs/proxy/model_compare_ui)
- **批次 API 支出追蹤** - [針對批次與檔案建立請求的自訂中繼資料進行細緻的支出追蹤](../../docs/proxy/cost_tracking#-custom-spend-log-metadata)
- **AWS IAM Secret Manager** - [支援 AWS Secret Manager 的 IAM 角色驗證](../../docs/secret_managers/aws_secret_manager#iam-role-assumption)
- **記錄回呼控制** - [管理員層級控制，可防止呼叫端在合規環境中停用記錄回呼](../../docs/proxy/dynamic_logging#disabling-dynamic-callback-management-enterprise)
- **Proxy CLI JWT 驗證** - [讓開發者可使用 Proxy CLI 透過 LiteLLM AI Gateway 進行驗證](../../docs/proxy/cli_sso)
- **批次 API 路由** - [使用 config.yaml 中模型專屬憑證，將批次作業路由至不同的提供者帳戶](../../docs/batches#multi-account--model-based-routing)

---

### 提示管理 {#prompt-management}

<Image 
  img={require('../../img/prompt_history.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>
<br/>

本版本推出 **LiteLLM Prompt Studio** - 一套直接內建於 LiteLLM UI 的完整提示管理解決方案。您可以在不離開瀏覽器的情況下建立、測試與管理提示版本。

您現在可以在 LiteLLM Prompt Studio 中執行以下操作：

- **建立與測試提示**：使用開發者訊息（system 指令）建立提示，並透過互動式聊天介面即時測試
- **動態變數**：使用 `{{variable_name}}` 語法建立可重複使用的提示範本，並自動偵測變數
- **版本控制**：每次提示更新都會自動版本化，並完整追蹤版本歷史與回復功能
- **Prompt Studio**：在專用的工作室環境中編輯提示，並提供即時測試與預覽

**API 整合：**

使用簡單的 API 呼叫即可在任何應用程式中使用您的提示：

```python
response = client.chat.completions.create(
    model="gpt-4",
    extra_body={
        "prompt_id": "your-prompt-id",
        "prompt_version": 2,  # Optional: specify version
        "prompt_variables": {"name": "value"}  # Optional: pass variables
    }
)
```

從這裡開始： [LiteLLM 提示管理文件](../../docs/proxy/litellm_prompt_management)

---

### 效能 – `/realtime` 低 182× 的 p99 延遲 {#performance--realtime-182-lower-p99-latency}

這次更新透過移除熱路徑上的冗餘編碼、重複使用共用 SSL context，以及快取原本會在每次請求中重新產生兩次、但很少變動的格式化字串，來降低 `/realtime` 延遲。

#### 結果 {#results}

| 指標          | 更新前    | 更新後     | 改善幅度                 |
| --------------- | --------- | --------- | -------------------------- |
| 中位數延遲  | 2,200 ms  | **59 ms** | **−97%（約快 37×）**     |
| p95 延遲     | 8,500 ms  | **67 ms** | **−99%（約快 127×）**    |
| p99 延遲     | 18,000 ms | **99 ms** | **−99%（約快 182×）**    |
| 平均延遲 | 3,214 ms  | **63 ms** | **−98%（約快 51×）**     |
| RPS             | 165       | **1,207** | **+631%（約增加 7.3×）** |

#### 測試設定 {#test-setup}

| 類別 | 規格 |
|----------|---------------|
| **負載測試** | Locust：1,000 個並行使用者，500 個 ramp-up |
| **系統** | 4 vCPUs、8 GB RAM、4 workers、4 instances |
| **資料庫** | PostgreSQL（未使用 Redis） |
| **設定** | [config.yaml](https://gist.github.com/AlexsanderHamir/420fb44c31c00b4f17a99588637f01ec) |
| **負載腳本** | [no_cache_hits.py](https://gist.github.com/AlexsanderHamir/73b83ada21d9b84d4fe09665cf1745f5) |

---

### 模型比較 UI {#model-compare-ui}

新的互動式 playground UI 可讓您並排比較多個 LLM 模型，方便評估與比較模型回應。

**功能：**
- 即時比較多個模型的回應
- 並排檢視與同步捲動
- 支援所有 LiteLLM 支援的模型
- 依模型追蹤成本
- 回應時間比較
- 預先設定的提示，方便快速測試

**詳細資訊：**

- **參數化**：設定 API 金鑰、端點、模型與模型參數，以及互動類型（chat completions、embeddings 等）

- **模型比較**：最多可同時比較 3 個不同模型，並以並排回應檢視呈現

- **比較指標**：檢視詳細比較資訊，包括：

  - 首個 token 出現時間
  - 輸入 / 輸出 / 推理 tokens
  - 總延遲
  - 成本（若已在 config 中啟用）

- **安全過濾器**：直接在 playground 介面設定並測試 guardrails（安全過濾器）

[開始使用模型比較](../../docs/proxy/model_compare_ui)

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者 {#new-providers}

| 提供者 | 支援的端點 | 說明 |
| -------- | ------------------- | ----------- |
| **[Docker Model Runner](../../docs/providers/docker_model_runner)** | `/v1/chat/completions` | 在 Docker 容器中執行 LLM 模型 |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Azure | `azure/gpt-5.1` | 272K | $1.38 | $11.00 | 推理、視覺、PDF 輸入、responses API |
| Azure | `azure/gpt-5.1-2025-11-13` | 272K | $1.38 | $11.00 | 推理、視覺、PDF 輸入、responses API |
| Azure | `azure/gpt-5.1-codex` | 272K | $1.38 | $11.00 | responses API、推理、視覺 |
| Azure | `azure/gpt-5.1-codex-2025-11-13` | 272K | $1.38 | $11.00 | responses API、推理、視覺 |
| Azure | `azure/gpt-5.1-codex-mini` | 272K | $0.275 | $2.20 | responses API、推理、視覺 |
| Azure | `azure/gpt-5.1-codex-mini-2025-11-13` | 272K | $0.275 | $2.20 | responses API、推理、視覺 |
| Azure EU | `azure/eu/gpt-5-2025-08-07` | 272K | $1.375 | $11.00 | 推理、視覺、PDF 輸入 |
| Azure EU | `azure/eu/gpt-5-mini-2025-08-07` | 272K | $0.275 | $2.20 | 推理、視覺、PDF 輸入 |
| Azure EU | `azure/eu/gpt-5-nano-2025-08-07` | 272K | $0.055 | $0.44 | 推理、視覺、PDF 輸入 |
| Azure EU | `azure/eu/gpt-5.1` | 272K | $1.38 | $11.00 | 推理、視覺、PDF 輸入、responses API |
| Azure EU | `azure/eu/gpt-5.1-codex` | 272K | $1.38 | $11.00 | responses API、推理、視覺 |
| Azure EU | `azure/eu/gpt-5.1-codex-mini` | 272K | $0.275 | $2.20 | responses API、推理、視覺 |
| Gemini | `gemini-3-pro-preview` | 2M | $1.25 | $5.00 | 推理、視覺、function calling |
| Gemini | `gemini-3-pro-image` | 2M | $1.25 | $5.00 | 影像生成、推理 |
| OpenRouter | `openrouter/deepseek/deepseek-v3p1-terminus` | 164K | $0.20 | $0.40 | function calling、推理 |
| OpenRouter | `openrouter/moonshot/kimi-k2-instruct` | 262K | $0.60 | $2.50 | function calling、網頁搜尋 |
| OpenRouter | `openrouter/gemini/gemini-3-pro-preview` | 2M | $1.25 | $5.00 | 推理、視覺、function calling |
| XAI | `xai/grok-4.1-fast` | 2M | $0.20 | $0.50 | 推理、function calling |
| Together AI | `together_ai/z-ai/glm-4.6` | 203K | $0.40 | $1.75 | function calling、推理 |
| Cerebras | `cerebras/gpt-oss-120b` | 131K | $0.60 | $0.60 | 函式呼叫 |
| Bedrock | `anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.00 | $15.00 | 電腦使用、推理、視覺 |

#### 功能 {#features}

- **[Gemini (Google AI Studio + Vertex AI)](../../docs/providers/gemini)**
    - 新增 Day 0 gemini-3-pro-preview 支援 - [PR #16719](https://github.com/BerriAI/litellm/pull/16719)
    - 新增 Gemini 3 Pro Image 模型支援 - [PR #16938](https://github.com/BerriAI/litellm/pull/16938)
    - 在啟用 tools 時，為串流回應新增 reasoning_content - [PR #16854](https://github.com/BerriAI/litellm/pull/16854)
    - 為 Gemini 3 reasoning_effort 新增 includeThoughts=True - [PR #16838](https://github.com/BerriAI/litellm/pull/16838)
    - 在 responses API 中支援 Gemini 3 的 thought signatures - [PR #16872](https://github.com/BerriAI/litellm/pull/16872)
    - 修正 gemma 的 system message 處理錯誤 - [PR #16767](https://github.com/BerriAI/litellm/pull/16767)
    - Gemini 3 Pro Image：擷取 image_tokens 並支援 cost_per_output_image - [PR #16912](https://github.com/BerriAI/litellm/pull/16912)
    - 修正 gemini-2.5-flash-image 缺少成本 - [PR #16882](https://github.com/BerriAI/litellm/pull/16882)
    - Gemini 3 在 tool call id 中的 thought signatures - [PR #16895](https://github.com/BerriAI/litellm/pull/16895)

- **[Azure](../../docs/providers/azure)**
    - 新增 azure gpt-5.1 模型 - [PR #16817](https://github.com/BerriAI/litellm/pull/16817)
    - 將 Azure 2025 11 模型加入成本對照表 - [PR #16762](https://github.com/BerriAI/litellm/pull/16762)
    - 更新 Azure 定價 - [PR #16371](https://github.com/BerriAI/litellm/pull/16371)
    - 為 Azure Text-to-Speech (AVA) 新增 SSML 支援 - [PR #16747](https://github.com/BerriAI/litellm/pull/16747)

- **[OpenAI](../../docs/providers/openai)**
    - 在 proxy 中支援 GPT-5.1 reasoning.effort='none' - [PR #16745](https://github.com/BerriAI/litellm/pull/16745)
    - 將 gpt-5.1-codex 和 gpt-5.1-codex-mini 模型新增至文件 - [PR #16735](https://github.com/BerriAI/litellm/pull/16735)
    - 繼承 BaseVideoConfig 以啟用 OpenAI video 的非同步內容回應 - [PR #16708](https://github.com/BerriAI/litellm/pull/16708)

- **[Anthropic](../../docs/providers/anthropic)**
    - 為 Anthropic tool schemas 中的 `strict` 參數新增支援 - [PR #16725](https://github.com/BerriAI/litellm/pull/16725)
    - 為 anthropic 新增 image as url 支援 - [PR #16868](https://github.com/BerriAI/litellm/pull/16868)
    - 為 v1/messages api 新增 thought signature 支援 - [PR #16812](https://github.com/BerriAI/litellm/pull/16812)
    - Anthropic - 支援 Claude 4.5 sonnet 和 Opus 4.1 的 Structured Outputs `output_format` - [PR #16949](https://github.com/BerriAI/litellm/pull/16949)

- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 Haiku 4.5 的 Bedrock 設定 - [PR #16732](https://github.com/BerriAI/litellm/pull/16732)
    - 確保 Bedrock 串流回應中的 chunk ID 一致 - [PR #16596](https://github.com/BerriAI/litellm/pull/16596)
    - 為 US Gov Cloud 新增 Claude 4.5 - [PR #16957](https://github.com/BerriAI/litellm/pull/16957)
    - 修正 bedrock 中從 tool 結果遺失的圖片 - [PR #16492](https://github.com/BerriAI/litellm/pull/16492)

- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 Vertex AI Image Edit 支援 - [PR #16828](https://github.com/BerriAI/litellm/pull/16828)
    - 更新 veo 3 定價並新增正式版模型 - [PR #16781](https://github.com/BerriAI/litellm/pull/16781)
    - 修正 veo3 的影片下載 - [PR #16875](https://github.com/BerriAI/litellm/pull/16875)

- **[Snowflake](../../docs/providers/snowflake)**
    - Snowflake 提供者支援：新增 embeddings、PAT、account_id - [PR #15727](https://github.com/BerriAI/litellm/pull/15727)

- **[OCI](../../docs/providers/oci)**
    - 為 OCI Dedicated Endpoints 新增 oci_endpoint_id 參數 - [PR #16723](https://github.com/BerriAI/litellm/pull/16723)

- **[XAI](../../docs/providers/xai)**
    - 新增 Grok 4.1 Fast 模型支援 - [PR #16936](https://github.com/BerriAI/litellm/pull/16936)

- **[Together AI](../../docs/providers/togetherai)**
    - 新增來自 together.ai 的 GLM 4.6 - [PR #16942](https://github.com/BerriAI/litellm/pull/16942)

- **[Cerebras](../../docs/providers/cerebras)**
    - 修正 Cerebras GPT-OSS-120B 模型名稱 - [PR #16939](https://github.com/BerriAI/litellm/pull/16939)

### 錯誤修正 {#bug-fixes}

- **[OpenAI](../../docs/providers/openai)**
    - 修正 16863 - openai 從 responses 轉換為 completions - [PR #16864](https://github.com/BerriAI/litellm/pull/16864)
    - 回復「預設將所有 gpt-5 和 reasoning 模型設為 responses」 - [PR #16849](https://github.com/BerriAI/litellm/pull/16849)

- **一般**
    - 從查詢參數取得 custom_llm_provider - [PR #16731](https://github.com/BerriAI/litellm/pull/16731)
    - 修正可選參數對應 - [PR #16852](https://github.com/BerriAI/litellm/pull/16852)
    - 為 litellm_params 新增 None 檢查 - [PR #16754](https://github.com/BerriAI/litellm/pull/16754)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 為 gpt-5.1-codex 模型新增 Responses API 支援 - [PR #16845](https://github.com/BerriAI/litellm/pull/16845)
    - 為 responses API 新增 managed files 支援 - [PR #16733](https://github.com/BerriAI/litellm/pull/16733)
    - 為 chat completion 中支援的 response api 參數新增 extra_body 支援 - [PR #16765](https://github.com/BerriAI/litellm/pull/16765)

- **[Batch API](../../docs/batches)**
    - 支援 files 的 /delete，以及 batches 的 /cancel - [PR #16387](https://github.com/BerriAI/litellm/pull/16387)
    - 為 batches 和 files 新增基於設定的路由支援 - [PR #16872](https://github.com/BerriAI/litellm/pull/16872)
    - 在 batch 和 files 端點填入 spend_logs_metadata - [PR #16921](https://github.com/BerriAI/litellm/pull/16921)

- **[Search APIs](../../docs/search)**
    - Search APIs - firecrawl-search 發生「Invalid request body」錯誤 - [PR #16943](https://github.com/BerriAI/litellm/pull/16943)

- **[Vector Stores](../../docs/vector_stores)**
    - 修正 vector store 建立問題 - [PR #16804](https://github.com/BerriAI/litellm/pull/16804)
    - 現在會遵守團隊的 vector-store 權限以進行金鑰存取 - [PR #16639](https://github.com/BerriAI/litellm/pull/16639)

- **[Audio Transcription](../../docs/audio_transcription)**
    - 修正音訊轉錄成本追蹤 - [PR #16478](https://github.com/BerriAI/litellm/pull/16478)
    - 為 audio/transcriptions 新增缺少的 shared_sessions - [PR #16858](https://github.com/BerriAI/litellm/pull/16858)

- **[Video Generation API](../../docs/video_generation)**
    - 修正 videos 標記 - [PR #16770](https://github.com/BerriAI/litellm/pull/16770)

#### 錯誤 {#bugs}

- **一般**
    - 支援使用自訂部署名稱進行 Responses API 成本追蹤 - [PR #16778](https://github.com/BerriAI/litellm/pull/16778)
    - 縮短 spend-logs 中記錄的回應字串 - [PR #16654](https://github.com/BerriAI/litellm/pull/16654)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **Proxy CLI 驗證**
    - 允許使用 JWT 透過 Proxy CLI 登入 - [PR #16756](https://github.com/BerriAI/litellm/pull/16756)

- **虛擬金鑰**
    - 修正 Key Model Alias 無法運作 - [PR #16896](https://github.com/BerriAI/litellm/pull/16896)

- **模型 + 端點**
    - 在 test key 中為 chat models 新增額外模型設定 - [PR #16793](https://github.com/BerriAI/litellm/pull/16793)
    - 停用 config models 的 model table 刪除按鈕 - [PR #16787](https://github.com/BerriAI/litellm/pull/16787)
    - 將 Public Model Hub 改為使用 proxyBaseUrl - [PR #16892](https://github.com/BerriAI/litellm/pull/16892)
    - 在 request/response 面板新增 JSON 檢視器 - [PR #16687](https://github.com/BerriAI/litellm/pull/16687)
    - 統一圖示圖片樣式 - [PR #16837](https://github.com/BerriAI/litellm/pull/16837)

- **團隊**
    - Teams table 空白狀態 - [PR #16738](https://github.com/BerriAI/litellm/pull/16738)

- **備援**
    - Fallbacks 圖示按鈕提示與刪除時的摩擦 - [PR #16737](https://github.com/BerriAI/litellm/pull/16737)

- **MCP 伺服器**
    - 刪除使用者與 MCP Server Modal、MCP Table 提示 - [PR #16751](https://github.com/BerriAI/litellm/pull/16751)

- **回呼**
    - 針對 callbacks 設定公開 backend 端點 - [PR #16698](https://github.com/BerriAI/litellm/pull/16698)
    - 編輯新增 callbacks 路由以使用 backend 的資料 - [PR #16699](https://github.com/BerriAI/litellm/pull/16699)

- **用量與分析**
    - 允許在 User Table 中對使用者 ID 進行部分比對 - [PR #16952](https://github.com/BerriAI/litellm/pull/16952)

- **一般 UI**
    - 允許在 API 參考文件中設定 base_url - [PR #16674](https://github.com/BerriAI/litellm/pull/16674)
    - 變更 /public 欄位以遵循 server root path - [PR #16930](https://github.com/BerriAI/litellm/pull/16930)
    - 修正 ui 建置 - [PR #16702](https://github.com/BerriAI/litellm/pull/16702)
    - 根據系統偏好啟用自動深色／淺色模式 - [PR #16748](https://github.com/BerriAI/litellm/pull/16748)

#### 錯誤 {#bugs-1}

- **UI 修正**
    - 修正因 antd Notification Manager 導致的不穩定測試 - [PR #16740](https://github.com/BerriAI/litellm/pull/16740)
    - 修正 UI MCP Tool 測試回歸 - [PR #16695](https://github.com/BerriAI/litellm/pull/16695)
    - 修正編輯記錄設定未顯示 - [PR #16798](https://github.com/BerriAI/litellm/pull/16798)
    - 在請求檢視器中新增用於截斷長 request id 的 CSS - [PR #16665](https://github.com/BerriAI/litellm/pull/16665)
    - 移除 Add Model 中 Azure 的 Placeholder 內的 azure/ 前綴 - [PR #16597](https://github.com/BerriAI/litellm/pull/16597)
    - 從 user/info 回傳中移除 UI Session Token - [PR #16851](https://github.com/BerriAI/litellm/pull/16851)
    - 移除 model 分頁中的 console logs 和 errors - [PR #16455](https://github.com/BerriAI/litellm/pull/16455)
    - 變更 Bulk Invite User Roles 以符合後端 - [PR #16906](https://github.com/BerriAI/litellm/pull/16906)
    - Mock Tremor 的 Tooltip 以修正不穩定的 UI 測試 - [PR #16786](https://github.com/BerriAI/litellm/pull/16786)
    - 修正 e2e ui playwright 測試 - [PR #16799](https://github.com/BerriAI/litellm/pull/16799)
    - 修正 CI/CD 中的測試 - [PR #16972](https://github.com/BerriAI/litellm/pull/16972)

- **SSO**
    - 確保在將使用者插入到 LiteLLM 時使用來自 SSO provider 的 `role` - [PR #16794](https://github.com/BerriAI/litellm/pull/16794)
    - 文件 - SSO - 透過 Azure App Roles 管理使用者角色 - [PR #16796](https://github.com/BerriAI/litellm/pull/16796)

- **驗證**
    - 確保在使用 JWT Auth 時 Team Tags 可正常運作 - [PR #16797](https://github.com/BerriAI/litellm/pull/16797)
    - 修正 key 永不過期 - [PR #16692](https://github.com/BerriAI/litellm/pull/16692)

- **Swagger UI**
    - 修正由 Pydantic v2 `$defs` 未正確公開於 OpenAPI schema 所導致的 chat completion endpoints Swagger UI resolver errors - [PR #16784](https://github.com/BerriAI/litellm/pull/16784)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Arize Phoenix](../../docs/observability/arize_phoenix)**
    - 修正 arize phoenix logging - [PR #16301](https://github.com/BerriAI/litellm/pull/16301)
    - Arize Phoenix - 根 span 記錄 - [PR #16949](https://github.com/BerriAI/litellm/pull/16949)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 過濾 Langfuse 的 secret fields - [PR #16842](https://github.com/BerriAI/litellm/pull/16842)

- **一般**
    - 從 Sensitive Data Masker 中排除 litellm_credential_name（已更新）- [PR #16958](https://github.com/BerriAI/litellm/pull/16958)
    - 允許管理員停用動態 callback controls - [PR #16750](https://github.com/BerriAI/litellm/pull/16750)

### 防護欄 {#guardrails}

- **[IBM Guardrails](../../docs/proxy/guardrails)**
    - 修正 IBM Guardrails 的可選參數，新增 extra_headers 欄位 - [PR #16771](https://github.com/BerriAI/litellm/pull/16771)

- **[Noma Guardrail](../../docs/proxy/guardrails)**
    - 在 NomaGuardrail 中將 LiteLLM key alias 作為回退的 Noma applicationId - [PR #16832](https://github.com/BerriAI/litellm/pull/16832)
    - 允許為 tool-permission guardrail 自訂違規訊息 - [PR #16916](https://github.com/BerriAI/litellm/pull/16916)

- **[Grayswan Guardrail](../../docs/proxy/guardrails)**
    - 在標記時對 Grayswan guardrail 進行 passthrough - [PR #16891](https://github.com/BerriAI/litellm/pull/16891)

- **一般防護欄**
    - 修正 prompt injection 無法運作 - [PR #16701](https://github.com/BerriAI/litellm/pull/16701)

### 提示詞管理 {#prompt-management-1}

- **[Prompt Management](../../docs/proxy/prompt_management)**
    - 允許在對 model 的請求中只指定 prompt_id - [PR #16834](https://github.com/BerriAI/litellm/pull/16834)
    - 新增提示詞版本控管支援 - [PR #16836](https://github.com/BerriAI/litellm/pull/16836)
    - 允許將 prompt version 儲存在 DB 中 - [PR #16848](https://github.com/BerriAI/litellm/pull/16848)
    - 新增編輯提示詞的 UI - [PR #16853](https://github.com/BerriAI/litellm/pull/16853)
    - 允許使用 Chat UI 測試提示詞 - [PR #16898](https://github.com/BerriAI/litellm/pull/16898)
    - 允許檢視版本歷程 - [PR #16901](https://github.com/BerriAI/litellm/pull/16901)
    - 允許在程式碼中指定 prompt version - [PR #16929](https://github.com/BerriAI/litellm/pull/16929)
    - UI，允許查看 Prompt 的 model、prompt id - [PR #16932](https://github.com/BerriAI/litellm/pull/16932)
    - 顯示 prompt management 的「取得程式碼」區塊 + 小幅潤飾版本歷程顯示 - [PR #16941](https://github.com/BerriAI/litellm/pull/16941)

### 密鑰管理員 {#secret-managers}

- **[AWS Secrets Manager](../../docs/secret_managers)**
    - 新增 AWS Secret Manager 的 IAM role 假設支援 - [PR #16887](https://github.com/BerriAI/litellm/pull/16887)

---

## MCP 閘道 {#mcp-gateway}

- **MCP Hub** - 在公司內發布/探索 MCP Servers - [PR #16857](https://github.com/BerriAI/litellm/pull/16857)
- **MCP Resources** - MCP resources 支援 - [PR #16800](https://github.com/BerriAI/litellm/pull/16800)
- **MCP OAuth** - 文件 - mcp oauth flow 詳情 - [PR #16742](https://github.com/BerriAI/litellm/pull/16742)
- **MCP Lifecycle** - 移除 MCPClient.connect 並使用 run_with_session lifecycle - [PR #16696](https://github.com/BerriAI/litellm/pull/16696)
- **MCP Server IDs** - 新增 mcp server ids - [PR #16904](https://github.com/BerriAI/litellm/pull/16904)
- **MCP URL Format** - 修正 mcp url format - [PR #16940](https://github.com/BerriAI/litellm/pull/16940)

---

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **即時端點效能** - 修正降低即時端點效能的瓶頸 - [PR #16670](https://github.com/BerriAI/litellm/pull/16670)
- **SSL Context 快取** - 快取 SSL contexts 以避免過度記憶體配置 - [PR #16955](https://github.com/BerriAI/litellm/pull/16955)
- **快取最佳化** - 修正 cache cooldown key generation - [PR #16954](https://github.com/BerriAI/litellm/pull/16954)
- **路由器快取** - 修正對於具有相同可快取前綴但不同使用者訊息的請求之路由 - [PR #16951](https://github.com/BerriAI/litellm/pull/16951)
- **Redis Event Loop** - 修正第一次呼叫時 redis event loop 被關閉 - [PR #16913](https://github.com/BerriAI/litellm/pull/16913)
- **相依性管理** - 將 pydantic 升級至版本 2.11.0 - [PR #16909](https://github.com/BerriAI/litellm/pull/16909)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 補充 benchmark comparison 的缺漏細節 - [PR #16690](https://github.com/BerriAI/litellm/pull/16690)
    - 修正 anthropic pass-through endpoint - [PR #16883](https://github.com/BerriAI/litellm/pull/16883)
    - 清理 repo 並改善 AI 文件 - [PR #16775](https://github.com/BerriAI/litellm/pull/16775)

- **API 文件**
    - 新增與 openai metadata 相關的文件 - [PR #16872](https://github.com/BerriAI/litellm/pull/16872)
    - 更新文件以涵蓋所有支援的 endpoints 與成本追蹤 - [PR #16872](https://github.com/BerriAI/litellm/pull/16872)

- **一般文件**
    - 將 mini-swe-agent 新增至 LiteLLM 上建置的 Projects - [PR #16971](https://github.com/BerriAI/litellm/pull/16971)

---

## 基礎架構／CI/CD {#infrastructure--cicd}

- **UI 測試**
    - 將 e2e_ui_testing 拆分為 build、unit 和 e2e 步驟 - [PR #16783](https://github.com/BerriAI/litellm/pull/16783)
    - 建置用於測試的 UI - [PR #16968](https://github.com/BerriAI/litellm/pull/16968)
    - CI/CD 修正 - [PR #16937](https://github.com/BerriAI/litellm/pull/16937)

- **相依性管理**
    - 在 /tests/proxy_admin_ui_tests/ui_unit_tests 中將 js-yaml 從 3.14.1 升級至 3.14.2 - [PR #16755](https://github.com/BerriAI/litellm/pull/16755)
    - 將 js-yaml 從 3.14.1 升級至 3.14.2 - [PR #16802](https://github.com/BerriAI/litellm/pull/16802)

- **遷移**
    - 遷移作業標籤 - [PR #16831](https://github.com/BerriAI/litellm/pull/16831)

- **設定**
    - 這個 yaml 其實可運作 - [PR #16757](https://github.com/BerriAI/litellm/pull/16757)

- **版本說明**
    - 將 embeddings 的效能改善新增到版本說明 - [PR #16697](https://github.com/BerriAI/litellm/pull/16697)
    - 文件 - v1.80.0 - [PR #16694](https://github.com/BerriAI/litellm/pull/16694)

- **調查**
    - 調查問題根因 - [PR #16859](https://github.com/BerriAI/litellm/pull/16859)

---

## 新貢獻者 {#new-contributors}

* @mattmorgis 首次貢獻於 [PR #16371](https://github.com/BerriAI/litellm/pull/16371)
* @mmandic-coatue 首次貢獻於 [PR #16732](https://github.com/BerriAI/litellm/pull/16732)
* @Bradley-Butcher 首次貢獻於 [PR #16725](https://github.com/BerriAI/litellm/pull/16725)
* @BenjaminLevy 首次貢獻於 [PR #16757](https://github.com/BerriAI/litellm/pull/16757)
* @CatBraaain 首次貢獻於 [PR #16767](https://github.com/BerriAI/litellm/pull/16767)
* @tushar8408 首次貢獻於 [PR #16831](https://github.com/BerriAI/litellm/pull/16831)
* @nbsp1221 首次貢獻於 [PR #16845](https://github.com/BerriAI/litellm/pull/16845)
* @idola9 首次貢獻於 [PR #16832](https://github.com/BerriAI/litellm/pull/16832)
* @nkukard 首次貢獻於 [PR #16864](https://github.com/BerriAI/litellm/pull/16864)
* @alhuang10 首次貢獻於 [PR #16852](https://github.com/BerriAI/litellm/pull/16852)
* @sebslight 首次貢獻於 [PR #16838](https://github.com/BerriAI/litellm/pull/16838)
* @TsurumaruTsuyoshi 首次貢獻於 [PR #16905](https://github.com/BerriAI/litellm/pull/16905)
* @cyberjunk 首次貢獻於 [PR #16492](https://github.com/BerriAI/litellm/pull/16492)
* @colinlin-stripe 首次貢獻於 [PR #16895](https://github.com/BerriAI/litellm/pull/16895)
* @sureshdsk 首次貢獻於 [PR #16883](https://github.com/BerriAI/litellm/pull/16883)
* @eiliyaabedini 首次貢獻於 [PR #16875](https://github.com/BerriAI/litellm/pull/16875)
* @justin-tahara 首次貢獻於 [PR #16957](https://github.com/BerriAI/litellm/pull/16957)
* @wangsoft 首次貢獻於 [PR #16913](https://github.com/BerriAI/litellm/pull/16913)
* @dsduenas 首次貢獻於 [PR #16891](https://github.com/BerriAI/litellm/pull/16891)

---

## 已知問題 {#known-issues}
* `/audit` 和 `/user/available_users` 路由回傳 404。已在 [PR #17337](https://github.com/BerriAI/litellm/pull/17337) 修正

---

## 完整變更紀錄 {#full-changelog}

**[在 GitHub 上查看完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.80.0-nightly...v1.80.5.rc.2)**
