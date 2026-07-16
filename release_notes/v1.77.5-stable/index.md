---
title: "v1.77.5-stable - MCP OAuth 2.0 支援"
slug: "v1-77-5"
date: 2025-09-29T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.77.5-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.77.5
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **MCP OAuth 2.0 支援** - 為 Model Context Protocol 整合強化驗證
- **排程金鑰輪換** - 具備自動化金鑰輪換功能，提升安全性
- **全新 Gemini 2.5 Flash 與 Flash-lite 模型** - 具改善定價與功能的最新 2025 年 9 月預覽模型
- **效能改善** - RPS 提升 54%

---

### 效能改善 - RPS 提升 54% {#performance-improvements---54-rps-improvement}

<Image img={require('../../img/release_notes/perf_77_5.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本帶來每個執行個體 54% 的 RPS 提升（1,040 → 1,602 RPS，彙總）。 

此改善來自修正 LiteLLM Router 中的 O(n²) 效率低落問題，主要原因是在針對大型陣列的迴圈中重複使用 `in` 陳述式。 

測試是在僅資料庫的設定下執行（沒有快取命中）。

#### 測試設定 {#test-setup}

所有基準測試皆使用 Locust 執行，包含 1,000 個並行使用者與 500 的漸進啟動。此環境經過配置，以壓測路由層並消除快取作為變數。

**系統規格**

- **CPU:** 8 vCPUs
- **記憶體:** 32 GB RAM

**組態 (config.yaml)**

查看完整組態：[gist.github.com/AlexsanderHamir/config.yaml](https://gist.github.com/AlexsanderHamir/53f7d554a5d2afcf2c4edb5b6be68ff4)

**載入腳本 (no_cache_hits.py)**

查看完整載入測試腳本：[gist.github.com/AlexsanderHamir/no_cache_hits.py](https://gist.github.com/AlexsanderHamir/42c33d7a4dc7a57f56a78b560dee3a42)

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（每 100 萬 tokens） | 輸出（每 100 萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Gemini | `gemini-2.5-flash-preview-09-2025` | 1M | $0.30 | $2.50 | 聊天、推理、視覺、音訊 |
| Gemini | `gemini-2.5-flash-lite-preview-09-2025` | 1M | $0.10 | $0.40 | 聊天、推理、視覺、音訊 |
| Gemini | `gemini-flash-latest` | 1M | $0.30 | $2.50 | 聊天、推理、視覺、音訊 |
| Gemini | `gemini-flash-lite-latest` | 1M | $0.10 | $0.40 | 聊天、推理、視覺、音訊 |
| DeepSeek | `deepseek-chat` | 131K | $0.60 | $1.70 | 聊天、函式呼叫、快取 |
| DeepSeek | `deepseek-reasoner` | 131K | $0.60 | $1.70 | 聊天、推理 |
| Bedrock | `deepseek.v3-v1:0` | 164K | $0.58 | $1.68 | 聊天、推理、函式呼叫 |
| Azure | `azure/gpt-5-codex` | 272K | $1.25 | $10.00 | Responses API、推理、視覺 |
| OpenAI | `gpt-5-codex` | 272K | $1.25 | $10.00 | Responses API、推理、視覺 |
| SambaNova | `sambanova/DeepSeek-V3.1` | 33K | $3.00 | $4.50 | 聊天、推理、函式呼叫 |
| SambaNova | `sambanova/gpt-oss-120b` | 131K | $3.00 | $4.50 | 聊天、推理、函式呼叫 |
| Bedrock | `qwen.qwen3-coder-480b-a35b-v1:0` | 262K | $0.22 | $1.80 | 聊天、推理、函式呼叫 |
| Bedrock | `qwen.qwen3-235b-a22b-2507-v1:0` | 262K | $0.22 | $0.88 | 聊天、推理、函式呼叫 |
| Bedrock | `qwen.qwen3-coder-30b-a3b-v1:0` | 262K | $0.15 | $0.60 | 聊天、推理、函式呼叫 |
| Bedrock | `qwen.qwen3-32b-v1:0` | 131K | $0.15 | $0.60 | 聊天、推理、函式呼叫 |
| Vertex AI | `vertex_ai/qwen/qwen3-next-80b-a3b-instruct-maas` | 262K | $0.15 | $1.20 | 聊天、函式呼叫 |
| Vertex AI | `vertex_ai/qwen/qwen3-next-80b-a3b-thinking-maas` | 262K | $0.15 | $1.20 | 聊天、函式呼叫 |
| Vertex AI | `vertex_ai/deepseek-ai/deepseek-v3.1-maas` | 164K | $1.35 | $5.40 | 聊天、推理、函式呼叫 |
| OpenRouter | `openrouter/x-ai/grok-4-fast:free` | 2M | $0.00 | $0.00 | 聊天、推理、函式呼叫 |
| XAI | `xai/grok-4-fast-reasoning` | 2M | $0.20 | $0.50 | 聊天、推理、函式呼叫 |
| XAI | `xai/grok-4-fast-non-reasoning` | 2M | $0.20 | $0.50 | 聊天、函式呼叫 |

#### 功能 {#features}

- **[Gemini](../../docs/providers/gemini)**
    - 新增 Gemini 2.5 Flash 與 Flash-lite 預覽模型（2025 年 9 月版本），定價更佳 - [PR #14948](https://github.com/BerriAI/litellm/pull/14948)
    - 新增 Anthropic 網頁擷取工具支援 - [PR #14951](https://github.com/BerriAI/litellm/pull/14951)
- **[XAI](../../docs/providers/xai)**
    - 新增 xai/grok-4-fast 模型 - [PR #14833](https://github.com/BerriAI/litellm/pull/14833)
- **[Anthropic](../../docs/providers/anthropic)**
    - 更新 Claude Sonnet 4 組態，以反映百萬 token 上下文視窗定價 - [PR #14639](https://github.com/BerriAI/litellm/pull/14639)
    - 在 anthropic citation 回應中新增 supported text 欄位 - [PR #14164](https://github.com/BerriAI/litellm/pull/14164)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增對 Qwen 模型家族與 Deepseek 3.1 在 Amazon Bedrock 上的支援 - [PR #14845](https://github.com/BerriAI/litellm/pull/14845)
    - 在 Bedrock Converse API 中支援 requestMetadata - [PR #14570](https://github.com/BerriAI/litellm/pull/14570)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 vertex_ai/qwen 模型與 azure/gpt-5-codex - [PR #14844](https://github.com/BerriAI/litellm/pull/14844)
    - 更新 vertex ai qwen 模型定價 - [PR #14828](https://github.com/BerriAI/litellm/pull/14828)
    - Vertex AI Context Caching：使用 Vertex ai API v1 取代 v1beta1，並接受 'cachedContent' 參數 - [PR #14831](https://github.com/BerriAI/litellm/pull/14831)
- **[SambaNova](../../docs/providers/sambanova)**
    - 新增 sambanova deepseek v3.1 與 gpt-oss-120b - [PR #14866](https://github.com/BerriAI/litellm/pull/14866)
- **[OpenAI](../../docs/providers/openai)**
    - 修正 gpt-5 模型不一致的 token 組態 - [PR #14942](https://github.com/BerriAI/litellm/pull/14942)
    - 更新 GPT-3.5-Turbo 價格 - [PR #14858](https://github.com/BerriAI/litellm/pull/14858)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 將 gpt-5 與 gpt-5-codex 新增至 OpenRouter 成本對照表 - [PR #14879](https://github.com/BerriAI/litellm/pull/14879)
- **[VLLM](../../docs/providers/vllm)**
    - 修正 vllm passthrough - [PR #14778](https://github.com/BerriAI/litellm/pull/14778)
- **[Flux](../../docs/image_generation)**
    - 支援 flux 圖片編輯 - [PR #14790](https://github.com/BerriAI/litellm/pull/14790)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正：支援透過訂閱（anthropic）進行 claude code 驗證 - [PR #14821](https://github.com/BerriAI/litellm/pull/14821)
    - 修正 Anthropic 串流 ID - [PR #14965](https://github.com/BerriAI/litellm/pull/14965)
    - 回復對 sonnet-4 最大輸出 tokens 的錯誤變更 - [PR #14933](https://github.com/BerriAI/litellm/pull/14933)
- **[OpenAI](../../docs/providers/openai)**
    - 修正 openai image edit 會靜默忽略多張圖片的錯誤 - [PR #14893](https://github.com/BerriAI/litellm/pull/14893)
- **[VLLM](../../docs/providers/vllm)**
    - 修正：將 vLLM 提供者的 rerank 端點從 /v1/rerank 改為 /rerank - [PR #14938](https://github.com/BerriAI/litellm/pull/14938)

#### 新增提供者支援 {#new-provider-support}

- **[W&B Inference](../../docs/providers/wandb)**
    - 將 W&B Inference 新增至 LiteLLM - [PR #14416](https://github.com/BerriAI/litellm/pull/14416)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **一般**
    - 新增對額外標頭的 SDK 支援 - [PR #14761](https://github.com/BerriAI/litellm/pull/14761)
    - 為 aiohttp ClientSession 重用新增 shared_session 參數 - [PR #14721](https://github.com/BerriAI/litellm/pull/14721)

#### 錯誤 {#bugs}

- **一般**
    - 修正多個 tool calls 的串流 tool call index 指派 - [PR #14587](https://github.com/BerriAI/litellm/pull/14587)
    - 修正 token counter proxy 載入憑證 - [PR #14808](https://github.com/BerriAI/litellm/pull/14808)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **Proxy CLI 驗證** 
    - 允許重複使用 cli auth token - [PR #14780](https://github.com/BerriAI/litellm/pull/14780)
    - 建立使用 litellm proxy 登入的 Python 方法 - [PR #14782](https://github.com/BerriAI/litellm/pull/14782)
    - LiteLLM Proxy CLI 驗證至 Gateway 的修正 - [PR #14836](https://github.com/BerriAI/litellm/pull/14836)
    
**虛擬金鑰**    
    - 排程金鑰輪換的初始支援 - [PR #14877](https://github.com/BerriAI/litellm/pull/14877)
    - 在建立虛擬金鑰時允許排程金鑰輪換 - [PR #14960](https://github.com/BerriAI/litellm/pull/14960)

**模型 + 端點**
    - 修正：將 Oracle 新增到提供者清單 - [PR #14835](https://github.com/BerriAI/litellm/pull/14835)

#### 錯誤 {#bugs-1}

- **SSO** - 修正：SSO「清除」按鈕會寫入空值，而不是移除 SSO 設定 - [PR #14826](https://github.com/BerriAI/litellm/pull/14826)
- **管理設定** - 從管理設定中移除實用連結 - [PR #14918](https://github.com/BerriAI/litellm/pull/14918)
- **管理路由** - 在管理路由中新增 /user/list - [PR #14868](https://github.com/BerriAI/litellm/pull/14868)
---

## Logging / Guardrail / Prompt Management 整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 記錄 - `datadog` 回呼記錄訊息內容，而不傳送至 datadog - [PR #14909](https://github.com/BerriAI/litellm/pull/14909)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 為快取 token 新增 langfuse 使用詳細資訊 - [PR #10955](https://github.com/BerriAI/litellm/pull/10955)
- **[Opik](../../docs/proxy/logging#opik)**
    - 改善 opik 整合程式碼 - [PR #14888](https://github.com/BerriAI/litellm/pull/14888)
- **[SQS](../../docs/proxy/logging#sqs)**
    - 為 SQS 記錄器新增錯誤記錄支援 - [PR #14974](https://github.com/BerriAI/litellm/pull/14974)

#### 防護欄 {#guardrails}

- **LakeraAI v2 防護欄** - 確保例外能正確拋出 - [PR #14867](https://github.com/BerriAI/litellm/pull/14867)
- **Presidio 防護欄** - 在 Presidio 防護欄中透過 Union[PiiEntityType, str] 支援自訂實體類型 - [PR #14899](https://github.com/BerriAI/litellm/pull/14899)
- **Noma 防護欄** - 在 UI 中新增 noma 防護欄提供者 - [PR #14415](https://github.com/BerriAI/litellm/pull/14415)

#### 提示管理 {#prompt-management}

- **BitBucket 整合** - 為 Prompt Management 新增 BitBucket 整合 - [PR #14882](https://github.com/BerriAI/litellm/pull/14882)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **Service Tier 定價** - 為 openai 新增基於 service_tier 的定價支援（Service 與 Priority Support 皆適用） - [PR #14796](https://github.com/BerriAI/litellm/pull/14796)
- **成本追蹤** - 在 StandardLoggingPayload 中顯示輸入、輸出、工具呼叫成本明細 - [PR #14921](https://github.com/BerriAI/litellm/pull/14921)
- **平行請求限制器 v3** 
    - 確保 Lua 腳本可在 redis 叢集上執行 - [PR #14968](https://github.com/BerriAI/litellm/pull/14968)
    - 修正：從 metadata 與 litellm_metadata 欄位都取得 metadata 資訊 - [PR #14783](https://github.com/BerriAI/litellm/pull/14783)
- **Priority Reservation** - 修正：Priority Reservation：沒有 priority metadata 的金鑰，會獲得比具有明確 priority 設定的金鑰更高的優先順序 - [PR #14832](https://github.com/BerriAI/litellm/pull/14832)

---

## MCP 閘道 {#mcp-gateway}

- **MCP 設定** - 在 mcp_info 設定中啟用自訂欄位 - [PR #14794](https://github.com/BerriAI/litellm/pull/14794)
- **MCP 工具** - 從 list_tools 移除 server_name 前綴 - [PR #14720](https://github.com/BerriAI/litellm/pull/14720)
- **OAuth 流程** - v2 oauth flow 的初始提交 - [PR #14964](https://github.com/BerriAI/litellm/pull/14964)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **記憶體洩漏修正** - 修正設定 TTL 時 InMemoryCache 的無界成長 - [PR #14869](https://github.com/BerriAI/litellm/pull/14869)
- **快取效能** - 修正：快取根本原因 - [PR #14827](https://github.com/BerriAI/litellm/pull/14827)
- **並行性修正** - 修正當許多 Python 執行緒使用 *sync* completions 進行串流時的並行性／擴充性 - [PR #14816](https://github.com/BerriAI/litellm/pull/14816)
- **效能最佳化** - 修正：將 get_deployment 成本降至 O(1) - [PR #14967](https://github.com/BerriAI/litellm/pull/14967)
- **效能最佳化** - 修正：移除緩慢的字串操作 - [PR #14955](https://github.com/BerriAI/litellm/pull/14955)
- **資料庫連線管理** - 修正：資料庫連線狀態重試 - [PR #14925](https://github.com/BerriAI/litellm/pull/14925)

---

## 文件更新 {#documentation-updates}

- **提供者文件** - 修正 provider_specific_params.md 的文件 - [PR #14787](https://github.com/BerriAI/litellm/pull/14787)
- **模型參考** - 將模型參考從 gemini-pro 更新為 gemini-2.5-pro - [PR #14775](https://github.com/BerriAI/litellm/pull/14775)
- **Letta 指南** - 新增 Letta 指南文件 - [PR #14798](https://github.com/BerriAI/litellm/pull/14798)
- **README** - 讓 README 文件更清楚 - [PR #14860](https://github.com/BerriAI/litellm/pull/14860)
- **Session Management** - 更新 session management 可用性的文件 - [PR #14914](https://github.com/BerriAI/litellm/pull/14914)
- **成本文件** - 為自訂定價中額外的成本相關鍵值新增文件 - [PR #14949](https://github.com/BerriAI/litellm/pull/14949)
- **Azure Passthrough** - 新增 azure passthrough 文件 - [PR #14958](https://github.com/BerriAI/litellm/pull/14958)
- **一般文件** - 2025 年 9 月文件更新 - [PR #14769](https://github.com/BerriAI/litellm/pull/14769)
    - 在文件中釐清端點與 mode 之間的橋接。
    - 在相關指南中新增 Vertex AI Gemini API 設定作為替代方案。
    在 Bedrock guardrails 文件中連結 AWS 驗證資訊。
    - 新增包含程式碼片段的 Cancel Response API 使用方式
    - 釐清 SSO（Single Sign-On）最多 5 位使用者免費：
    - 將側邊欄按字母排序，並將快速開始／簡介保留在各分類頂部
    - 在 cache_params 下記錄 max_connections。
    - 釐清 IAM AssumeRole Policy 要求。
    - 在 Getting Started 中新增 transform utilities 範例（展示請求轉換）。
    - 在各文件中新增 models.litellm.ai 作為完整模型清單的參考。
    - 新增 async_post_call_success_hook 的程式碼片段。
    - 移除指向 callbacks 管理指南的失效連結。 - 重新排版並連結 cookbooks + 其他相關文件
- **文件更正** - 更正 2025 年 9 月文件更新 - [PR #14916](https://github.com/BerriAI/litellm/pull/14916)

---

## 新貢獻者 {#new-contributors}

* @uzaxirr 在 [PR #14761](https://github.com/BerriAI/litellm/pull/14761) 中完成了首次貢獻
* @xprilion 在 [PR #14416](https://github.com/BerriAI/litellm/pull/14416) 中完成了首次貢獻
* @CH-GAGANRAJ 在 [PR #14779](https://github.com/BerriAI/litellm/pull/14779) 中完成了首次貢獻
* @otaviofbrito 在 [PR #14778](https://github.com/BerriAI/litellm/pull/14778) 中完成了首次貢獻
* @danielmklein 在 [PR #14639](https://github.com/BerriAI/litellm/pull/14639) 中完成了首次貢獻
* @Jetemple 在 [PR #14826](https://github.com/BerriAI/litellm/pull/14826) 中完成了首次貢獻
* @akshoop 在 [PR #14818](https://github.com/BerriAI/litellm/pull/14818) 中完成了首次貢獻
* @hazyone 在 [PR #14821](https://github.com/BerriAI/litellm/pull/14821) 中完成了首次貢獻
* @leventov 在 [PR #14816](https://github.com/BerriAI/litellm/pull/14816) 中完成了首次貢獻
* @fabriciojoc 在 [PR #10955](https://github.com/BerriAI/litellm/pull/10955) 中完成了首次貢獻
* @onlylonly 在 [PR #14845](https://github.com/BerriAI/litellm/pull/14845) 中完成了首次貢獻
* @Copilot 在 [PR #14869](https://github.com/BerriAI/litellm/pull/14869) 中完成了首次貢獻
* @arsh72 在 [PR #14899](https://github.com/BerriAI/litellm/pull/14899) 中完成了首次貢獻
* @berri-teddy 在 [PR #14914](https://github.com/BerriAI/litellm/pull/14914) 中完成了首次貢獻
* @vpbill 在 [PR #14415](https://github.com/BerriAI/litellm/pull/14415) 中完成了首次貢獻
* @kgritesh 在 [PR #14893](https://github.com/BerriAI/litellm/pull/14893) 中完成了首次貢獻
* @oytunkutrup1 在 [PR #14858](https://github.com/BerriAI/litellm/pull/14858) 中完成了首次貢獻
* @nherment 在 [PR #14933](https://github.com/BerriAI/litellm/pull/14933) 中完成了首次貢獻
* @deepanshululla 在 [PR #14974](https://github.com/BerriAI/litellm/pull/14974) 中完成了首次貢獻
* @TeddyAmkie 在 [PR #14758](https://github.com/BerriAI/litellm/pull/14758) 中完成了首次貢獻
* @SmartManoj 在 [PR #14775](https://github.com/BerriAI/litellm/pull/14775) 中完成了首次貢獻
* @uc4w6c 在 [PR #14720](https://github.com/BerriAI/litellm/pull/14720) 中完成了首次貢獻
* @luizrennocosta 在 [PR #14783](https://github.com/BerriAI/litellm/pull/14783) 中完成了首次貢獻
* @AlexsanderHamir 在 [PR #14827](https://github.com/BerriAI/litellm/pull/14827) 中完成了首次貢獻
* @dharamendrak 在 [PR #14721](https://github.com/BerriAI/litellm/pull/14721) 中完成了首次貢獻
* @TomeHirata 在 [PR #14164](https://github.com/BerriAI/litellm/pull/14164) 中完成了首次貢獻
* @mrFranklin 在 [PR #14860](https://github.com/BerriAI/litellm/pull/14860) 中完成了首次貢獻
* @luisfucros 在 [PR #14866](https://github.com/BerriAI/litellm/pull/14866) 中完成了首次貢獻
* @huangyafei 在 [PR #14879](https://github.com/BerriAI/litellm/pull/14879) 中完成了首次貢獻
* @thiswillbeyourgithub 在 [PR #14949](https://github.com/BerriAI/litellm/pull/14949) 中完成了首次貢獻
* @Maximgitman 在 [PR #14965](https://github.com/BerriAI/litellm/pull/14965) 中完成了首次貢獻
* @subnet-dev 在 [PR #14938](https://github.com/BerriAI/litellm/pull/14938) 中完成了首次貢獻
* @22mSqRi 在 [PR #14972](https://github.com/BerriAI/litellm/pull/14972) 中完成了首次貢獻

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.77.3.rc.1...v1.77.5.rc.1)** {#full-changeloghttpsgithubcomberriailitellmcomparev1773rc1v1775rc1}
