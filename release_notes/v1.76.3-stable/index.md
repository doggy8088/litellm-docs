---
title: "v1.76.3-stable - 效能、影片生成與 CloudZero 整合"
slug: "v1-76-3"
date: 2025-09-06T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

hide_table_of_contents: false
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

此版本有一個已知問題：在 Kubernetes 上部署時，啟動會導致記憶體不足錯誤。我們建議在升級到此版本之前先暫緩。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.76.3
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.76.3
```

</TabItem>
</Tabs>

---

## 重點亮點 {#key-highlights}

- **主要效能改善**：在使用正確的 workers 數量 + CPU 核心組合時，提升 +400 RPS
- **影片生成支援**：透過 LiteLLM Pass through routes 新增 Google AI Studio 和 Vertex AI Veo 影片生成
- **CloudZero 整合**：新的成本追蹤整合，可將 LiteLLM 用量與支出資料匯出到 CloudZero。 

## 主要變更  {#major-changes}
- **效能最佳化**：LiteLLM Proxy 在使用正確數量的 CPU 核心時，現在可達到 +400 RPS - [PR #14153](https://github.com/BerriAI/litellm/pull/14153), [PR #14242](https://github.com/BerriAI/litellm/pull/14242)
  
  預設情況下，LiteLLM 現在會使用 `num_workers = os.cpu_count()` 以達到最佳效能。 
  
  **覆寫選項：**
  
  設定環境變數：
  ```bash
  DEFAULT_NUM_WORKERS_LITELLM_PROXY=1
  ```
  
  或以以下方式啟動 LiteLLM Proxy：
  ```bash
  litellm --num_workers 1
  ```

- **安全性修正**：修正 memory_usage_in_mem_cache cache endpoint 漏洞 - [PR #14229](https://github.com/BerriAI/litellm/pull/14229)

---

## 效能改善 {#performance-improvements}

此版本包含重大的效能最佳化。在我們的內部基準測試中，使用正確的 workers 數量 + CPU 核心組合時，1 個 instance 可達到 +400 RPS。

- **+400 RPS 效能提升** - LiteLLM Proxy 現在會使用正確數量的 CPU 核心以達到最佳效能 - [PR #14153](https://github.com/BerriAI/litellm/pull/14153)
- **預設 CPU Workers** - 將 DEFAULT_NUM_WORKERS_LITELLM_PROXY 的預設值改為 CPU 數量 - [PR #14242](https://github.com/BerriAI/litellm/pull/14242)

---

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                                  | 上下文視窗 | 輸入 ($/100萬 tokens) | 輸出 ($/100萬 tokens) | 功能 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | -------- |
| OpenRouter | `openrouter/openai/gpt-4.1` | 1M | $2.00 | $8.00 | 含 vision 的 chat completions |
| OpenRouter | `openrouter/openai/gpt-4.1-mini` | 1M | $0.40 | $1.60 | 高效率 chat completions |
| OpenRouter | `openrouter/openai/gpt-4.1-nano` | 1M | $0.10 | $0.40 | 超高效率 chat |
| Vertex AI | `vertex_ai/openai/gpt-oss-20b-maas` | 131K | $0.075 | $0.30 | 推理支援 |
| Vertex AI | `vertex_ai/openai/gpt-oss-120b-maas` | 131K | $0.15 | $0.60 | 進階推理 |
| Gemini | `gemini/veo-3.0-generate-preview` | 1K | - | $0.75/秒 | 影片生成 |
| Gemini | `gemini/veo-3.0-fast-generate-preview` | 1K | - | $0.40/秒 | 快速影片生成 |
| Gemini | `gemini/veo-2.0-generate-001` | 1K | - | $0.35/秒 | 影片生成 |
| Volcengine | `doubao-embedding-large` | 4K | 免費 | 免費 | 2048 維 embeddings |
| Together AI | `together_ai/deepseek-ai/DeepSeek-V3.1` | 128K | $0.60 | $1.70 | 推理支援 |

#### 功能 {#features}

- **[Google Gemini](../../docs/providers/gemini)**
    - 透過 'thinking_blocks' 新增 'thoughtSignature' 支援 - [PR #14122](https://github.com/BerriAI/litellm/pull/14122)
    - 新增對 Gemini 模型的 reasoning_effort='minimal' 支援 - [PR #14262](https://github.com/BerriAI/litellm/pull/14262)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 GPT-4.1 模型家族 - [PR #14101](https://github.com/BerriAI/litellm/pull/14101)
- **[Groq](../../docs/providers/groq)**
    - 新增 reasoning_effort 參數支援 - [PR #14207](https://github.com/BerriAI/litellm/pull/14207)
- **[X.AI](../../docs/providers/xai)**
    - 修正 XAI 成本計算 - [PR #14127](https://github.com/BerriAI/litellm/pull/14127)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 Vertex AI 上 GPT-OSS 模型支援 - [PR #14184](https://github.com/BerriAI/litellm/pull/14184)
    - 為 Vertex AI Schema 定義新增 additionalProperties - [PR #14252](https://github.com/BerriAI/litellm/pull/14252)
- **[VLLM](../../docs/providers/vllm)**
    - 處理輸出解析回應 API 輸出 - [PR #14121](https://github.com/BerriAI/litellm/pull/14121)
- **[Ollama](../../docs/providers/ollama)**
    - 透過 `reasoning_content` 新增統一的 'thinking' 參數支援 - [PR #14121](https://github.com/BerriAI/litellm/pull/14121)
- **[Anthropic](../../docs/providers/anthropic)**
    - 為 anthropic citation 回應新增支援的 text 欄位 - [PR #14126](https://github.com/BerriAI/litellm/pull/14126)
- **[OCI 提供者](../../docs/providers/oci)**
    - 處理同時具有 content 和 tool_calls 的 assistant 訊息 - [PR #14171](https://github.com/BerriAI/litellm/pull/14171)
- **[Bedrock](../../docs/providers/bedrock)**
    - 修正結構化輸出 - [PR #14130](https://github.com/BerriAI/litellm/pull/14130)
    - 新增對 Bedrock Batches API 的初始支援 - [PR #14190](https://github.com/BerriAI/litellm/pull/14190)
- **[Databricks](../../docs/providers/databricks)**
    - 新增 Databricks 對 anthropic citation API 的支援 - [PR #14077](https://github.com/BerriAI/litellm/pull/14077)

### 錯誤修正 {#bug-fixes}
- **[Google Gemini（Google AI Studio + Vertex AI）](../../docs/providers/gemini)**
    - 修正 Gemini 2.5 Pro 在 tools 中使用 OpenAI 風格型別陣列時的 schema 驗證 - [PR #14154](https://github.com/BerriAI/litellm/pull/14154)
    - 修正 Gemini Tool Calling 空白 enum 屬性 - [PR #14155](https://github.com/BerriAI/litellm/pull/14155)

#### 新提供者支援 {#new-provider-support}

- **[Volcengine](../../docs/providers/volcengine)**
    - 新增 Volcengine embedding 模組，包含 handler 與轉換邏輯 - [PR #14028](https://github.com/BerriAI/litellm/pull/14028)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Images API](../../docs/image_generation)**
    - 新增 OpenAI 上的 pass through image generation 與 image editing - [PR #14292](https://github.com/BerriAI/litellm/pull/14292)
    - 支援 image generation 的 extra_body 參數 - [PR #14211](https://github.com/BerriAI/litellm/pull/14211)
- **[Responses API](../../docs/response_api)**
    - 修正 litellm proxy 的 response API，處理輸入中的 reasoning item - [PR #14200](https://github.com/BerriAI/litellm/pull/14200)
    - 為 SDK 新增結構化輸出 - [PR #14206](https://github.com/BerriAI/litellm/pull/14206)
- **[Bedrock 傳遞](../../docs/pass_through/bedrock)**
    - 在 bedrock passthrough 上支援 AWS_BEDROCK_RUNTIME_ENDPOINT - [PR #14156](https://github.com/BerriAI/litellm/pull/14156)
- **[Google AI Studio 傳遞](../../docs/pass_through/google_ai_studio)**
    - 允許透過 LiteLLM Pass through routes 使用 Veo 影片生成 - [PR #14228](https://github.com/BerriAI/litellm/pull/14228)
- **一般**
    - 新增 chat.completions.create 的 safety_identifier 參數支援 - [PR #14174](https://github.com/BerriAI/litellm/pull/14174)
    - 修正 /chat/completions 請求中無效 image_url 的 500 錯誤誤判 - [PR #14149](https://github.com/BerriAI/litellm/pull/14149)
    - 修正 Gemini CLI 的 token 計數錯誤 - [PR #14133](https://github.com/BerriAI/litellm/pull/14133)

#### 錯誤 {#bugs}

- **一般**
    - 當 model name 作為 h11 header name 使用時，移除其中的 "/" 或 ":" - [PR #14191](https://github.com/BerriAI/litellm/pull/14191)
    - openai.gpt-oss 在使用 reasoning_effort 參數時的錯誤修正 - [PR #14300](https://github.com/BerriAI/litellm/pull/14300)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 功能 {#features-2}
    - 新增 spend_logs_metadata 的 header 支援 - [PR #14186](https://github.com/BerriAI/litellm/pull/14186)
    - 用於 chat completion 的 Litellm passthrough 成本追蹤 - [PR #14256](https://github.com/BerriAI/litellm/pull/14256)

### 錯誤修正 {#bug-fixes-1}
    - 修正 TPM Rate Limit Bug - [PR #14237](https://github.com/BerriAI/litellm/pull/14237)
    - 修正 Key Budget 未在預期時間重置 - [PR #14241](https://github.com/BerriAI/litellm/pull/14241)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}

- **UI 改進**
    - 已修正 Logs 頁面螢幕大小 - [PR #14135](https://github.com/BerriAI/litellm/pull/14135)
    - 成功時新增建立組織工具提示 - [PR #14132](https://github.com/BerriAI/litellm/pull/14132)
    - Back to Keys 應顯示為 Back to Logs - [PR #14134](https://github.com/BerriAI/litellm/pull/14134)
    - 在 All Models 表格新增用戶端分頁 - [PR #14136](https://github.com/BerriAI/litellm/pull/14136)
    - Model Filters UI 改進 - [PR #14131](https://github.com/BerriAI/litellm/pull/14131)
    - 移除 user info 頁面的表格篩選器 - [PR #14169](https://github.com/BerriAI/litellm/pull/14169)
    - 在 User Details 新增團隊名稱徽章 - [PR #14003](https://github.com/BerriAI/litellm/pull/14003)
    - 修正：Logs 頁面參數傳遞錯誤 - [PR #14193](https://github.com/BerriAI/litellm/pull/14193)
- **驗證與授權**
    - 支援 ES256/ES384/ES512 和 EdDSA JWT 驗證 - [PR #14118](https://github.com/BerriAI/litellm/pull/14118)
    - 確保 `team_id` 是產生服務帳戶金鑰的必要欄位 - [PR #14270](https://github.com/BerriAI/litellm/pull/14270)

#### 錯誤 {#bugs-1}

- **一般**
    - 驗證 db 設定中的 store model - [PR #14269](https://github.com/BerriAI/litellm/pull/14269)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}

- **[Datadog](../../docs/proxy/logging#datadog)**
    - 確保在 DD LLM 可觀測性追蹤上設定 `apm_id` - [PR #14272](https://github.com/BerriAI/litellm/pull/14272)
- **[Braintrust](../../docs/proxy/logging#braintrust)**
    - 在啟用 OTEL 時修正記錄 - [PR #14122](https://github.com/BerriAI/litellm/pull/14122)
- **[OTEL](../../docs/proxy/logging#otel)**
    - 依循語義慣例的可選指標與記錄 - [PR #14179](https://github.com/BerriAI/litellm/pull/14179)
- **[Slack 警示](../../docs/proxy/alerting)**
    - 在傳送給 slack 的警示訊息中新增警示類型，以利更容易處理 - [PR #14176](https://github.com/BerriAI/litellm/pull/14176)

#### 防護欄 {#guardrails}
    - 在 Anthropic API 端點新增防護欄 - [PR #14107](https://github.com/BerriAI/litellm/pull/14107)

#### 新整合 {#new-integration}

- **[CloudZero](../../docs/proxy/cost_tracking)**
    - 用於成本追蹤的 LiteLLM x CloudZero 整合 - [PR #14296](https://github.com/BerriAI/litellm/pull/14296)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}

- **效能**
    - LiteLLM Proxy：使用正確數量的 CPU 核心時 +400 RPS - [PR #14153](https://github.com/BerriAI/litellm/pull/14153)
    - 允許在請求中使用 `x-litellm-stream-timeout` 標頭設定串流逾時 - [PR #14147](https://github.com/BerriAI/litellm/pull/14147)
    - 將 DEFAULT_NUM_WORKERS_LITELLM_PROXY 預設值改為 CPU 數量 - [PR #14242](https://github.com/BerriAI/litellm/pull/14242)
- **監控**
    - 新增缺少的 Prometheus 指標 - [PR #14139](https://github.com/BerriAI/litellm/pull/14139)
- **逾時**
    - **串流逾時控制** - 允許在請求中使用 `x-litellm-stream-timeout` 標頭設定串流逾時 - [PR #14147](https://github.com/BerriAI/litellm/pull/14147)
- **路由**
    - 已修正 x-litellm-tags 在使用 Responses API 時無法路由 - [PR #14289](https://github.com/BerriAI/litellm/pull/14289)

#### 錯誤 {#bugs-2}

- **安全性**
    - 已修正 memory_usage_in_mem_cache 快取端點漏洞 - [PR #14229](https://github.com/BerriAI/litellm/pull/14229)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-6}

- **SCIM 支援**
    - 新增更好的 SCIM 除錯 - [PR #14221](https://github.com/BerriAI/litellm/pull/14221)
    - 處理 SCIM 群組成員資格的錯誤修正 - [PR #14226](https://github.com/BerriAI/litellm/pull/14226)
- **Kubernetes**
    - 為 litellm proxy 新增可選的 PodDisruptionBudget - [PR #14093](https://github.com/BerriAI/litellm/pull/14093)
- **錯誤處理**
    - 在 azure 錯誤訊息中加入 model - [PR #14294](https://github.com/BerriAI/litellm/pull/14294)

---

## 新貢獻者 {#new-contributors}
* @iabhi4 在 [PR #14093](https://github.com/BerriAI/litellm/pull/14093) 完成了首次貢獻
* @zainhas 在 [PR #14087](https://github.com/BerriAI/litellm/pull/14087) 完成了首次貢獻
* @LifeDJIK 在 [PR #14146](https://github.com/BerriAI/litellm/pull/14146) 完成了首次貢獻
* @retanoj 在 [PR #14133](https://github.com/BerriAI/litellm/pull/14133) 完成了首次貢獻
* @zhxlp 在 [PR #14193](https://github.com/BerriAI/litellm/pull/14193) 完成了首次貢獻
* @kayoch1n 在 [PR #14191](https://github.com/BerriAI/litellm/pull/14191) 完成了首次貢獻
* @kutsushitaneko 在 [PR #14171](https://github.com/BerriAI/litellm/pull/14171) 完成了首次貢獻
* @mjmendo 在 [PR #14176](https://github.com/BerriAI/litellm/pull/14176) 完成了首次貢獻
* @HarshavardhanK 在 [PR #14213](https://github.com/BerriAI/litellm/pull/14213) 完成了首次貢獻
* @eycjur 在 [PR #14207](https://github.com/BerriAI/litellm/pull/14207) 完成了首次貢獻
* @22mSqRi 在 [PR #14241](https://github.com/BerriAI/litellm/pull/14241) 完成了首次貢獻
* @onlylhf 在 [PR #14028](https://github.com/BerriAI/litellm/pull/14028) 完成了首次貢獻
* @btpemercier 在 [PR #11319](https://github.com/BerriAI/litellm/pull/11319) 完成了首次貢獻
* @tremlin 在 [PR #14287](https://github.com/BerriAI/litellm/pull/14287) 完成了首次貢獻
* @TobiMayr 在 [PR #14262](https://github.com/BerriAI/litellm/pull/14262) 完成了首次貢獻
* @Eitan1112 在 [PR #14252](https://github.com/BerriAI/litellm/pull/14252) 完成了首次貢獻

---

## **[完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.76.1-nightly...v1.76.3-nightly)** {#full-changeloghttpsgithubcomberriailitellmcomparev1761-nightlyv1763-nightly}
