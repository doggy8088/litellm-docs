---
title: "v1.79.1-stable - 防護欄 Playground"
slug: "v1-79-1"
date: 2025-11-01T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.79.1-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.0
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Container API 支援** - 端對端 OpenAI Container API 支援，包含 proxy 整合、記錄與成本追蹤
- **FAL AI 影像生成** - 原生支援 FAL AI 影像生成模型並提供成本追蹤
- **UI 增強** - 防護欄 Playground、快取設定、標籤路由、SSO 設定
- **Batch API 速率限制** - 支援 Batch API 請求的基於輸入的速率限制
- **向量儲存擴充** - 支援 Milvus 向量儲存與 Azure AI 虛擬索引
- **記憶體洩漏修正** - 修正了 Python SDK 與 AI Gateway 上 90% 記憶體洩漏的相關問題

---

## 依賴項升級 {#dependency-upgrades}

- **依賴項**
    - Build(deps): 將 starlette 從 0.47.2 升級到 0.49.1 - [PR #16027](https://github.com/BerriAI/litellm/pull/16027)
    - Build(deps): 將 fastapi 從 0.116.1 升級到 0.120.1 - [PR #16054](https://github.com/BerriAI/litellm/pull/16054)
    - Build(deps): 將 /litellm-js/spend-logs 中的 hono 從 4.9.7 升級到 4.10.3 - [PR #15915](https://github.com/BerriAI/litellm/pull/15915)

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Mistral | `mistral/codestral-embed` | 8K | $0.15 | - | 嵌入 |
| Mistral | `mistral/codestral-embed-2505` | 8K | $0.15 | - | 嵌入 |
| Gemini | `gemini/gemini-embedding-001` | 2K | $0.15 | - | 嵌入 |
| FAL AI | `fal_ai/fal-ai/flux-pro/v1.1-ultra` | - | - | - | 影像生成 - $0.0398/image |
| FAL AI | `fal_ai/fal-ai/imagen4/preview` | - | - | - | 影像生成 - $0.0398/image |
| FAL AI | `fal_ai/fal-ai/recraft/v3/text-to-image` | - | - | - | 影像生成 - $0.0398/image |
| FAL AI | `fal_ai/fal-ai/stable-diffusion-v35-medium` | - | - | - | 影像生成 - $0.0398/image |
| FAL AI | `fal_ai/bria/text-to-image/3.2` | - | - | - | 影像生成 - $0.0398/image |
| OpenAI | `openai/sora-2-pro` | - | - | - | 影片生成 - $0.30/video/second |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 將 Claude 3-7 Sonnet 的淘汰日期從 2026-02-01 延長至 2026-02-19 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 將 Claude Opus 4-0 的淘汰日期從 2025-03-01 延長至 2026-05-01 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 移除 Claude Haiku 3-5 的淘汰日期（原為 2025-03-01） - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 新增 Claude Opus 4-1、Claude Opus 4-0 20250513、Claude Sonnet 4 20250514 的淘汰日期 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 新增 Claude Opus 4-1 的網頁搜尋支援 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)

- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 AWS Bedrock Converse API 中空白 assistant 訊息的處理，以避免 400 Bad Request 錯誤 - [PR #15850](https://github.com/BerriAI/litellm/pull/15850)
    - 允許在透過 Bedrock 生成影像時使用 ARN - [PR #15789](https://github.com/BerriAI/litellm/pull/15789)
    - 新增 Bedrock Invoke API 的每個 model group header 轉發 - [PR #16042](https://github.com/BerriAI/litellm/pull/16042)
    - 在健康檢查中保留 Bedrock inference profile IDs - [PR #15947](https://github.com/BerriAI/litellm/pull/15947)
    - 新增在 S3 回傳 generic type 時偵測檔案 content-type 的備援邏輯 - 當搭配 S3 託管檔案使用 Bedrock 時，如果 S3 物件的 Content-Type 未正確設定（例如 binary/octet-stream 而不是 image/png），Bedrock 現在可以正確處理 - [PR #15635](https://github.com/BerriAI/litellm/pull/15635)

- **[Azure](../../docs/providers/azure)**
    - 新增 Azure OpenAI 模型的淘汰日期（gpt-4o-2024-08-06、gpt-4o-2024-11-20、gpt-4.1 系列、o3-2025-04-16、text-embedding-3-small） - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 修正 Azure OpenAI ContextWindowExceededError 與 Azure 錯誤的對應 - [PR #15981](https://github.com/BerriAI/litellm/pull/15981)
    - 新增在 Azure API versions 下對 `v1` 的處理 - [PR #15984](https://github.com/BerriAI/litellm/pull/15984)
    - 修正 azure 不接受額外的 body 參數 - [PR #16116](https://github.com/BerriAI/litellm/pull/16116)

- **[OpenAI](../../docs/providers/openai)**
    - 新增 gpt-3.5-turbo-1106、gpt-4-0125-preview、gpt-4-1106-preview、o1-mini-2024-09-12 的淘汰日期 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 新增延伸的 Sora-2 模態支援（文字 + 影像輸入） - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
    - 將 OpenAI Sora-2-Pro 定價更新為 $0.30/video/second - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 OpenRouter 的 Claude Haiku 4.5 定價 - [PR #15909](https://github.com/BerriAI/litellm/pull/15909)
    - 新增含環境變數文件的 base_url 設定 - [PR #15946](https://github.com/BerriAI/litellm/pull/15946)

- **[Mistral](../../docs/providers/mistral)**
    - 新增 codestral-embed-2505 embedding 模型 - [PR #16071](https://github.com/BerriAI/litellm/pull/16071)

- **[Gemini (Google AI Studio + Vertex AI)](../../docs/providers/gemini)**
    - 修正 Gemini 請求在工具使用時的變異 - [PR #16002](https://github.com/BerriAI/litellm/pull/16002)
    - 新增 Google GenAI API 的 gemini-embedding-001 定價項目 - [PR #16078](https://github.com/BerriAI/litellm/pull/16078)
    - 修正 gemini-2.5-pro 模型的 frequency_penalty 與 presence_penalty 問題 - [PR #16041](https://github.com/BerriAI/litellm/pull/16041)

- **[DeepInfra](../../docs/providers/deepinfra)**
    - 新增 Qwen/Qwen3-chat-32b 模型的視覺支援 - [PR #15976](https://github.com/BerriAI/litellm/pull/15976)

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 修正 glm-4.6 的 vercel_ai_gateway 項目（已從 vercel_ai_gateway/glm-4.6 移至 vercel_ai_gateway/zai/glm-4.6） - [PR #16084](https://github.com/BerriAI/litellm/pull/16084)

- **[Fireworks](../../docs/providers/fireworks_ai)**
    - 不要為 Fireworks 提供者新增 "accounts/fireworks/models" 前綴 - [PR #15938](https://github.com/BerriAI/litellm/pull/15938)

- **[Cohere](../../docs/providers/cohere)**
    - 新增與 OpenAI 相容的 annotations 支援，用於 Cohere v2 citations - [PR #16038](https://github.com/BerriAI/litellm/pull/16038)

- **[Deepgram](../../docs/providers/deepgram)**
    - 在可用時處理 Deepgram 偵測到的語言 - [PR #16093](https://github.com/BerriAI/litellm/pull/16093)

### 錯誤修正 {#bug-fixes}

- **[Xai](../../docs/providers/xai)**
    - 新增 Xai websearch 成本追蹤 - [PR #16001](https://github.com/BerriAI/litellm/pull/16001)

#### 新提供者支援 {#new-provider-support}

- **[FAL AI](../../docs/image_generation)**
    - 新增 FAL AI 影像生成支援 - [PR #16067](https://github.com/BerriAI/litellm/pull/16067)

- **[OCI (Oracle Cloud Infrastructure)](../../docs/providers/oci)**
    - 新增 OCI Signer Authentication 支援 - [PR #16064](https://github.com/BerriAI/litellm/pull/16064)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Container API](../../docs/containers)**
    - 新增 LiteLLM SDK 端對端 OpenAI Container API 支援 - [PR #16136](https://github.com/BerriAI/litellm/pull/16136)
    - 新增 container APIs 的 proxy 支援 - [PR #16049](https://github.com/BerriAI/litellm/pull/16049)
    - 新增 Container API 的記錄支援 - [PR #16049](https://github.com/BerriAI/litellm/pull/16049)
    - 新增包含文件的容器成本追蹤支援 - [PR #16117](https://github.com/BerriAI/litellm/pull/16117)

- **[Responses API](../../docs/response_api)**
    - 遵守 Responses API 的 `LiteLLM-Disable-Message-Redaction` 標頭 - [PR #15966](https://github.com/BerriAI/litellm/pull/15966)
    - 為 responses API 新增 /openai routes（Azure OpenAI SDK 相容性） - [PR #15988](https://github.com/BerriAI/litellm/pull/15988)
    - 在停用訊息記錄時，遮蔽 ResponsesAPI 輸出中的 reasoning summaries - [PR #15965](https://github.com/BerriAI/litellm/pull/15965)
    - 支援對於沒有原生 ResponsesAPIConfig 的提供者，在 Responses API 中使用 text.format 參數 - [PR #16023](https://github.com/BerriAI/litellm/pull/16023)
    - 為 Responses API 新增 LLM 提供者回應標頭 - [PR #16091](https://github.com/BerriAI/litellm/pull/16091)

- **[影片生成 API](../../docs/video_generation)**
    - 為影片端點（非生成）新增 `custom_llm_provider` 支援 - [PR #16121](https://github.com/BerriAI/litellm/pull/16121)
    - 修正影片文件 - [PR #15937](https://github.com/BerriAI/litellm/pull/15937)
    - 新增影片的 OpenAI 用戶端使用文件，並修正導覽可見性 - [PR #15996](https://github.com/BerriAI/litellm/pull/15996)

- **[審核 API](../../docs/moderations)**
    - 審核端點現在會遵循 `api_base` 設定參數 - [PR #16087](https://github.com/BerriAI/litellm/pull/16087)

- **[向量儲存](../../docs/vector_stores)**
    - Milvus - 搜尋向量儲存支援 - [PR #16035](https://github.com/BerriAI/litellm/pull/16035)
    - Azure AI 向量儲存 - 支援「虛擬」索引 + 在 passthrough API 上建立向量儲存 - [PR #16160](https://github.com/BerriAI/litellm/pull/16160)

- **[Passthrough 端點](../../docs/pass_through/vertex_ai)**
    - 支援 passthrough 上的多部分表單資料 - [PR #16035](https://github.com/BerriAI/litellm/pull/16035)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - SSO 設定中的 Proxy Base URL 驗證 - [PR #16082](https://github.com/BerriAI/litellm/pull/16082)
    - 測試金鑰 UI 嵌入支援 - [PR #16065](https://github.com/BerriAI/litellm/pull/16065)
    - 在金鑰設定中新增金鑰類型選擇 - [PR #16034](https://github.com/BerriAI/litellm/pull/16034)
    - 金鑰已存在錯誤通知 - [PR #15993](https://github.com/BerriAI/litellm/pull/15993)

- **模型 + 端點**
    - 在新的 LLM 憑證中，API Base 從選擇改為輸入 - [PR #15987](https://github.com/BerriAI/litellm/pull/15987)
    - 移除 admin UI 數值輸入的限制 - [PR #15991](https://github.com/BerriAI/litellm/pull/15991)
    - 組態模型不應可編輯 - [PR #16020](https://github.com/BerriAI/litellm/pull/16020)
    - 在模型建立時新增標籤 - [PR #16138](https://github.com/BerriAI/litellm/pull/16138)
    - 為更新模型新增標籤 - [PR #16140](https://github.com/BerriAI/litellm/pull/16140)

- **防護欄**
    - 新增套用防護欄測試遊樂場 - [PR #16030](https://github.com/BerriAI/litellm/pull/16030)
    - 組態防護欄不應可編輯，並修正防護欄資訊 - [PR #16142](https://github.com/BerriAI/litellm/pull/16142)

- **快取設定**
    - 允許在 UI 上設定快取設定 - [PR #16143](https://github.com/BerriAI/litellm/pull/16143)

- **路由**
    - 允許設定所有路由策略、UI 上的標籤篩選 - [PR #16139](https://github.com/BerriAI/litellm/pull/16139)

- **管理員設定**
    - 將授權中繼資料新增至 health/readiness 端點 - [PR #15997](https://github.com/BerriAI/litellm/pull/15997)
    - Litellm 後端 SSO 變更 - [PR #16029](https://github.com/BerriAI/litellm/pull/16029)

---

## 記錄 / 防護欄 / 提示管理整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[OpenTelemetry](../../docs/proxy/logging#opentelemetry)**
    - 啟用由外部追蹤器進行的 OpenTelemetry 內容傳播 - [PR #15940](https://github.com/BerriAI/litellm/pull/15940)
    - 確保錯誤資訊會記錄在 OTEL 上 - [PR #15978](https://github.com/BerriAI/litellm/pull/15978)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 langfuse_otel 中的重複追蹤 - [PR #15931](https://github.com/BerriAI/litellm/pull/15931)
    - 支援與 Langfuse OTEL 整合的工具使用訊息 - [PR #15932](https://github.com/BerriAI/litellm/pull/15932)

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 確保 key 的中繼資料 + 防護欄會記錄在 DD 上 - [PR #15980](https://github.com/BerriAI/litellm/pull/15980)

- **[Opik](../../docs/proxy/logging#opik)**
    - 改進從 API key 驗證擷取請求者中繼資料 - [PR #15897](https://github.com/BerriAI/litellm/pull/15897)
    - 使用者驗證金鑰中繼資料文件 - [PR #16004](https://github.com/BerriAI/litellm/pull/16004)

- **[SQS](../../docs/proxy/logging#sqs)**
    - 為 SQS Logger 新增 Base64 處理 - [PR #16028](https://github.com/BerriAI/litellm/pull/16028)

- **一般**
    - 修正：從自訂回呼遺漏的使用者 API key、團隊 id 和使用者 id 不會誤觸發 - [PR #15982](https://github.com/BerriAI/litellm/pull/15982)

#### 防護欄 {#guardrails}

- **[IBM Guardrails](../../docs/proxy/guardrails)**
    - 更新 IBM Guardrails 以正確使用 SSL Verify 引數 - [PR #15975](https://github.com/BerriAI/litellm/pull/15975)
    - 為 ibm_guardrails.md 文件新增更多細節 - [PR #15971](https://github.com/BerriAI/litellm/pull/15971)

- **[Model Armor](../../docs/proxy/guardrails)**
    - 支援 model armor 防護欄的 during_call - [PR #15970](https://github.com/BerriAI/litellm/pull/15970)

- **[Lasso Security](../../docs/proxy/guardrails)**
    - 升級至 Lasso API v3 並修正 ULID 產生 - [PR #15941](https://github.com/BerriAI/litellm/pull/15941)

- **[PANW Prisma AIRS](../../docs/proxy/guardrails)**
    - 為 PANW Prisma AIRS 新增每請求設定檔覆寫 - [PR #16069](https://github.com/BerriAI/litellm/pull/16069)

- **[Grayswan](../../docs/proxy/guardrails)**
    - 改善 Grayswan 防護欄文件 - [PR #15875](https://github.com/BerriAI/litellm/pull/15875)

- **[Pillar AI](../../docs/proxy/guardrails)**
    - 使用 litellm 時，pillar 服務的優雅降級 - [PR #15857](https://github.com/BerriAI/litellm/pull/15857)

- **一般**
    - 確保已套用 Key Guardrails - [PR #16025](https://github.com/BerriAI/litellm/pull/16025)

#### 提示管理 {#prompt-management}

- **[GitLab](../../docs/prompt_management)**
    - 新增 GitlabPromptCache 並啟用子資料夾存取 - [PR #15712](https://github.com/BerriAI/litellm/pull/15712)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤**
    - 修正 OCR/aOCR 請求的支出追蹤（log `pages_processed` + recognize `OCRResponse`）- [PR #16070](https://github.com/BerriAI/litellm/pull/16070)

- **速率限制**
    - 新增對 Batch API 速率限制的支援 - PR1 新增基於輸入的速率限制支援 - [PR #16075](https://github.com/BerriAI/litellm/pull/16075)
    - 處理每個描述元的多種速率限制類型並防止 IndexError - [PR #16039](https://github.com/BerriAI/litellm/pull/16039)

---

## MCP 閘道 {#mcp-gateway}

- **OAuth**
    - 新增對動態用戶端註冊的支援 - [PR #15921](https://github.com/BerriAI/litellm/pull/15921)
    - 在 OAuth 端點中遵循 X-Forwarded- 標頭 - [PR #16036](https://github.com/BerriAI/litellm/pull/16036)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **記憶體洩漏修正**
    - 修正：防止 AsyncHTTPHandler 中的 httpx DeprecationWarning 記憶體洩漏 - [PR #16024](https://github.com/BerriAI/litellm/pull/16024)
    - 修正：解決由 Pydantic 2.11+ deprecation warnings 造成的記憶體累積 - [PR #16110](https://github.com/BerriAI/litellm/pull/16110)
    - 修正(apscheduler)：防止由 jitter 與頻繁工作間隔造成的記憶體洩漏 - [PR #15846](https://github.com/BerriAI/litellm/pull/15846)

- **組態**
    - 移除 cache control injection index 的最小驗證 - [PR #16149](https://github.com/BerriAI/litellm/pull/16149)
    - 修正 prompt_caching.md：prompt_tokens 定義錯誤 - [PR #16044](https://github.com/BerriAI/litellm/pull/16044)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 在範例中使用 custom-llm-provider 標頭 - [PR #16055](https://github.com/BerriAI/litellm/pull/16055)
    - Litellm 文件 readme 修正 - [PR #16107](https://github.com/BerriAI/litellm/pull/16107)
    - readme 修正新增支援的提供者 - [PR #16109](https://github.com/BerriAI/litellm/pull/16109)

- **模型參考**
    - 在 model_prices_and_context_window.json 中為 qwen-vl 模型新增支援 vision 欄位 - [PR #16106](https://github.com/BerriAI/litellm/pull/16106)

- **一般文件**
    - 1-79-0 文件 - [PR #15936](https://github.com/BerriAI/litellm/pull/15936)
    - 為正式環境新增最低資源需求 - [PR #16146](https://github.com/BerriAI/litellm/pull/16146)

---

## 新貢獻者 {#new-contributors}

* @RobGeada 首次貢獻於 [PR #15975](https://github.com/BerriAI/litellm/pull/15975)
* @shanto12 首次貢獻於 [PR #15946](https://github.com/BerriAI/litellm/pull/15946)
* @dima-hx430 首次貢獻於 [PR #15976](https://github.com/BerriAI/litellm/pull/15976)
* @m-misiura 首次貢獻於 [PR #15971](https://github.com/BerriAI/litellm/pull/15971)
* @ylgibby 首次貢獻於 [PR #15947](https://github.com/BerriAI/litellm/pull/15947)
* @Somtom 首次貢獻於 [PR #15909](https://github.com/BerriAI/litellm/pull/15909)
* @rodolfo-nobrega 首次貢獻於 [PR #16023](https://github.com/BerriAI/litellm/pull/16023)
* @bernata 首次貢獻於 [PR #15997](https://github.com/BerriAI/litellm/pull/15997)
* @AlbertDeFusco 首次貢獻於 [PR #15881](https://github.com/BerriAI/litellm/pull/15881)
* @komarovd95 首次貢獻於 [PR #15789](https://github.com/BerriAI/litellm/pull/15789)
* @langpingxue 首次貢獻於 [PR #15635](https://github.com/BerriAI/litellm/pull/15635)
* @OrionCodeDev 首次貢獻於 [PR #16070](https://github.com/BerriAI/litellm/pull/16070)
* @sbinnee 首次貢獻於 [PR #16078](https://github.com/BerriAI/litellm/pull/16078)
* @JetoPistola 首次貢獻於 [PR #16106](https://github.com/BerriAI/litellm/pull/16106)
* @gvioss 首次貢獻於 [PR #16093](https://github.com/BerriAI/litellm/pull/16093)
* @pale-aura 首次貢獻於 [PR #16084](https://github.com/BerriAI/litellm/pull/16084)
* @tanvithakur94 首次貢獻於 [PR #16041](https://github.com/BerriAI/litellm/pull/16041)
* @li-boxuan 首次貢獻於 [PR #16044](https://github.com/BerriAI/litellm/pull/16044)
* @1stprinciple 首次貢獻於 [PR #15938](https://github.com/BerriAI/litellm/pull/15938)
* @raghav-stripe 首次貢獻於 [PR #16137](https://github.com/BerriAI/litellm/pull/16137)
* @steve-gore-snapdocs 首次貢獻於 [PR #16149](https://github.com/BerriAI/litellm/pull/16149)

---

## 完整變更紀錄 {#full-changelog}

**[在 GitHub 上查看完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.79.0-stable...v1.80.0-stable)**
