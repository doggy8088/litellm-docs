---
title: "v1.80.0-stable - 介紹 Agent Hub：註冊、發布與分享代理程式"
slug: "v1-80-0"
date: 2025-11-15T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.80.0-stable
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

- **🆕 Agent Hub 支援** - 為您的組織註冊並公開代理程式
- **RunwayML 提供者** - 完整支援影片生成、圖像生成與文字轉語音
- **GPT-5.1 系列支援** - 對 OpenAI 最新的 GPT-5.1 與 GPT-5.1-Codex 模型提供首日支援
- **Prometheus OSS** - Prometheus 指標現已可於開源版本使用
- **Vector Store Files API** - 完整的 OpenAI 相容 Vector Store Files API，具備完整 CRUD 作業
- **Embeddings 效能** - 透過共用工作階段對路由器 embeddings 進行 O(1) 查找最佳化

---

### 代理程式中樞 {#agent-hub}

<Image img={require('../../img/agent_hub_clean.png')} />  

此版本新增為您的組織註冊並公開代理程式的支援。這對於想要在組織內建立一個集中位置、讓使用者能夠探索代理程式的 **Proxy 管理員** 來說非常實用。 

流程如下： 
1. 將代理程式新增至 litellm。 
2. 將其設為公開。 
3. 允許任何人在公開的 AI Hub 頁面上探索它。

[**開始使用 Agent Hub**](../../docs/proxy/ai_hub)

### 效能 – `/embeddings` p95 延遲降低 13× {#performance--embeddings-13-lower-p95-latency}

此更新透過將 `/embeddings` 延遲路由到與 `/chat/completions` 相同且已最佳化的管線，顯著改善其延遲，並受益於先前套用的所有網路最佳化。

### 結果 {#results}

| 指標 | 之前 | 之後 | 改善 |
| --- | --- | --- | --- |
| p95 latency | 5,700 ms | **430 ms** | −92%（約快 13×）** |
| p99 latency | 7,200 ms | **780 ms** | −89% |
| Average latency | 844 ms | **262 ms** | −69% |
| Median latency | 290 ms | **230 ms** | −21% |
| RPS | 1,216.7 | **1,219.7** | **+0.25%** |

### 測試設定 {#test-setup}

| 類別 | 規格 |
| --- | --- |
| **負載測試** | Locust：1,000 位並行使用者，500 個漸進增加 |
| **系統** | 4 vCPUs、8 GB RAM、4 個 workers、4 個 instances |
| **資料庫** | PostgreSQL（未使用 Redis） |
| **設定** | [config.yaml](https://gist.github.com/AlexsanderHamir/550791675fd752befcac6a9e44024652) |
| **負載腳本** | [no_cache_hits.py](https://gist.github.com/AlexsanderHamir/99d673bf74cdd81fd39f59fa9048f2e8) |

---

### 🆕 RunwayML {#-runwayml}

RunwayML 的 Gen-4 系列模型完整整合，支援影片生成、圖像生成與文字轉語音。

**支援的端點：**
- `/v1/videos` - 影片生成（Gen-4 Turbo、Gen-4 Aleph、Gen-3A Turbo）
- `/v1/images/generations` - 圖像生成（Gen-4 Image、Gen-4 Image Turbo）
- `/v1/audio/speech` - 文字轉語音（ElevenLabs Multilingual v2）

**快速開始：**

```bash showLineNumbers title="Generate Video with RunwayML"
curl --location 'http://localhost:4000/v1/videos' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "runwayml/gen4_turbo",
    "prompt": "A high quality demo video of litellm ai gateway",
    "input_reference": "https://example.com/image.jpg",
    "seconds": 5,
    "size": "1280x720"
}'
```

[開始使用 RunwayML](../../docs/providers/runwayml/videos)

---

### Prometheus 指標 - 開源版 {#prometheus-metrics---open-source}

Prometheus 指標現已可在 LiteLLM 的開源版本中使用，為您的 AI Gateway 提供完整的可觀測性，且無需企業授權。

**快速開始：**

```yaml
litellm_settings:
  success_callback: ["prometheus"]
  failure_callback: ["prometheus"]
```

[開始使用 Prometheus](../../docs/proxy/logging#prometheus)

---

### 向量儲存檔案 API {#vector-store-files-api}

完整相容 OpenAI 的 Vector Store Files API 現已穩定，可在向量儲存中實現完整的檔案生命週期管理。

**支援的端點：**
- `POST /v1/vector_stores/{vector_store_id}/files` - 建立 vector store file
- `GET /v1/vector_stores/{vector_store_id}/files` - 列出 vector store files
- `GET /v1/vector_stores/{vector_store_id}/files/{file_id}` - 取得 vector store file
- `GET /v1/vector_stores/{vector_store_id}/files/{file_id}/content` - 取得檔案內容
- `DELETE /v1/vector_stores/{vector_store_id}/files/{file_id}` - 刪除 vector store file
- `DELETE /v1/vector_stores/{vector_store_id}` - 刪除 vector store

**快速開始：**

```bash showLineNumbers title="Create Vector Store File"
curl --location 'http://localhost:4000/v1/vector_stores/vs_123/files' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "file_id": "file_abc"
}'
```

[開始使用 Vector Stores](../../docs/vector_store_files)

---

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新提供者 {#new-providers}

| 提供者 | 支援的端點 | 說明 |
| -------- | ------------------- | ----------- |
| **[RunwayML](../../docs/providers/runwayml/videos)** | `/v1/videos`, `/v1/images/generations`, `/v1/audio/speech` | Gen-4 影片生成、圖像生成與文字轉語音 |

### 新 LLM API 端點 {#new-llm-api-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| -------- | ------ | ----------- | ------------- |
| `/v1/vector_stores/{vector_store_id}/files` | POST | 建立 vector store file | [文件](../../docs/vector_store_files) |
| `/v1/vector_stores/{vector_store_id}/files` | GET | 列出 vector store files | [文件](../../docs/vector_store_files) |
| `/v1/vector_stores/{vector_store_id}/files/{file_id}` | GET | 取得 vector store file | [文件](../../docs/vector_store_files) |
| `/v1/vector_stores/{vector_store_id}/files/{file_id}/content` | GET | 取得檔案內容 | [文件](../../docs/vector_store_files) |
| `/v1/vector_stores/{vector_store_id}/files/{file_id}` | DELETE | 刪除 vector store file | [文件](../../docs/vector_store_files) |
| `/v1/vector_stores/{vector_store_id}` | DELETE | 刪除 vector store | [文件](../../docs/vector_store_files) |

---

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.1` | 272K | $1.25 | $10.00 | Reasoning、vision、PDF input、responses API |
| OpenAI | `gpt-5.1-2025-11-13` | 272K | $1.25 | $10.00 | Reasoning、vision、PDF input、responses API |
| OpenAI | `gpt-5.1-chat-latest` | 128K | $1.25 | $10.00 | Reasoning、vision、PDF input |
| OpenAI | `gpt-5.1-codex` | 272K | $1.25 | $10.00 | Responses API、reasoning、vision |
| OpenAI | `gpt-5.1-codex-mini` | 272K | $0.25 | $2.00 | Responses API、reasoning、vision |
| Moonshot | `moonshot/kimi-k2-thinking` | 262K | $0.60 | $2.50 | Function calling、web search、reasoning |
| Mistral | `mistral/magistral-medium-2509` | 40K | $2.00 | $5.00 | Reasoning、function calling |
| Vertex AI | `vertex_ai/moonshotai/kimi-k2-thinking-maas` | 256K | $0.60 | $2.50 | Function calling、web search |
| OpenRouter | `openrouter/deepseek/deepseek-v3.2-exp` | 164K | $0.20 | $0.40 | Function calling、prompt caching |
| OpenRouter | `openrouter/minimax/minimax-m2` | 205K | $0.26 | $1.02 | Function calling、reasoning |
| OpenRouter | `openrouter/z-ai/glm-4.6` | 203K | $0.40 | $1.75 | Function calling、reasoning |
| OpenRouter | `openrouter/z-ai/glm-4.6:exacto` | 203K | $0.45 | $1.90 | Function calling、reasoning |
| Voyage | `voyage/voyage-3.5` | 32K | $0.06 | - | 嵌入 |
| Voyage | `voyage/voyage-3.5-lite` | 32K | $0.02 | - | 嵌入 |

#### 影片生成模型 {#video-generation-models}

| 提供者 | 模型 | 每秒成本 | 解析度 | 功能 |
| -------- | ----- | --------------- | ----------- | -------- |
| RunwayML | `runwayml/gen4_turbo` | $0.05 | 1280x720, 720x1280 | 文字 + 圖像轉影片 |
| RunwayML | `runwayml/gen4_aleph` | $0.15 | 1280x720, 720x1280 | 文字 + 圖像轉影片 |
| RunwayML | `runwayml/gen3a_turbo` | $0.05 | 1280x720, 720x1280 | 文字 + 圖像轉影片 |

#### 圖像生成模型 {#image-generation-models}

| 提供者 | 模型 | 每張圖片成本 | 解析度 | 功能 |
| -------- | ----- | -------------- | ----------- | -------- |
| RunwayML | `runwayml/gen4_image` | $0.05 | 1280x720, 1920x1080 | 文字 + 圖像轉圖像 |
| RunwayML | `runwayml/gen4_image_turbo` | $0.02 | 1280x720, 1920x1080 | 文字 + 圖像轉圖像 |
| Fal.ai | `fal_ai/fal-ai/flux-pro/v1.1` | $0.04/image | - | 圖像生成 |
| Fal.ai | `fal_ai/fal-ai/flux/schnell` | $0.003/image | - | 快速圖像生成 |
| Fal.ai | `fal_ai/fal-ai/bytedance/seedream/v3/text-to-image` | $0.03/image | - | 圖像生成 |
| Fal.ai | `fal_ai/fal-ai/bytedance/dreamina/v3.1/text-to-image` | $0.03/image | - | 圖像生成 |
| Fal.ai | `fal_ai/fal-ai/ideogram/v3` | $0.06/image | - | 圖像生成 |
| Fal.ai | `fal_ai/fal-ai/imagen4/preview/fast` | $0.02/image | - | 快速圖像生成 |
| Fal.ai | `fal_ai/fal-ai/imagen4/preview/ultra` | $0.06/image | - | 高品質圖像生成 |

#### 音訊模型 {#audio-models}

| 提供者 | 模型 | 成本 | 功能 |
| -------- | ----- | ---- | -------- |
| RunwayML | `runwayml/eleven_multilingual_v2` | $0.0003/char | 文字轉語音 |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增支援具備推理能力的 GPT-5.1 系列 - [PR #16598](https://github.com/BerriAI/litellm/pull/16598)
    - 新增 GPT-5.1 的 `reasoning_effort='none'` 支援 - [PR #16658](https://github.com/BerriAI/litellm/pull/16658)
    - 新增 GPT-5 系列模型的 `verbosity` 參數支援 - [PR #16660](https://github.com/BerriAI/litellm/pull/16660)
    - 修正影像生成時向前傳遞 OpenAI 組織資訊 - [PR #16607](https://github.com/BerriAI/litellm/pull/16607)

- **[Gemini (Google AI Studio + Vertex AI)](../../docs/providers/gemini)**
    - 新增 Gemini 模型的 `reasoning_effort='none'` 支援 - [PR #16548](https://github.com/BerriAI/litellm/pull/16548)
    - 新增影像生成中所有 Gemini 影像模型支援 - [PR #16526](https://github.com/BerriAI/litellm/pull/16526)
    - 新增 Gemini 影像編輯支援 - [PR #16430](https://github.com/BerriAI/litellm/pull/16430)
    - 修正函式呼叫引數中非 ASCII 字元的保留 - [PR #16550](https://github.com/BerriAI/litellm/pull/16550)
    - 修正 MCP 自動執行時的 Gemini 對話格式問題 - [PR #16592](https://github.com/BerriAI/litellm/pull/16592)

- **[Bedrock](../../docs/providers/bedrock)**
    - 新增知識庫查詢篩選支援 - [PR #16543](https://github.com/BerriAI/litellm/pull/16543)
    - 確保在 embedding 動態提供時使用正確的 `aws_region` - [PR #16547](https://github.com/BerriAI/litellm/pull/16547)
    - 新增 Bedrock Batch 作業中的自訂 KMS 加密金鑰支援 - [PR #16662](https://github.com/BerriAI/litellm/pull/16662)
    - 新增 AgentCore 的 bearer token 驗證支援 - [PR #16556](https://github.com/BerriAI/litellm/pull/16556)
    - 修正 AgentCore SSE 串流迭代器為 async，以正確支援串流 - [PR #16293](https://github.com/BerriAI/litellm/pull/16293)

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增 context management 參數支援 - [PR #16528](https://github.com/BerriAI/litellm/pull/16528)
    - 修正 Anthropic tools 輸入 schema 的 `$defs` 保留 - [PR #16648](https://github.com/BerriAI/litellm/pull/16648)
    - 修正 token counter 對 Anthropic tool_use 與 tool_result 的支援 - [PR #16351](https://github.com/BerriAI/litellm/pull/16351)

- **[Vertex AI](../../docs/providers/vertex_ai)**
    - 新增 Vertex Kimi-K2-Thinking 支援 - [PR #16671](https://github.com/BerriAI/litellm/pull/16671)
    - 新增 `vertex_credentials` 對 `litellm.rerank()` 的支援 - [PR #16479](https://github.com/BerriAI/litellm/pull/16479)

- **[Mistral](../../docs/providers/mistral)**
    - 修正 Magistral 串流以輸出推理區塊 - [PR #16434](https://github.com/BerriAI/litellm/pull/16434)

- **[Moonshot (Kimi)](../../docs/providers/moonshot)**
    - 新增 Kimi K2 thinking model 支援 - [PR #16445](https://github.com/BerriAI/litellm/pull/16445)

- **[SambaNova](../../docs/providers/sambanova)**
    - 修正 SambaNova API 在訊息內容以清單格式傳遞時拒絕請求 - [PR #16612](https://github.com/BerriAI/litellm/pull/16612)

- **[VLLM](../../docs/providers/vllm)**
    - 修正使用 vllm passthrough 設定於代管 vllm 提供者時，不再拋出錯誤 - [PR #16537](https://github.com/BerriAI/litellm/pull/16537)
    - 在 VLLM Passthrough 請求中加入標頭與成功事件記錄 - [PR #16532](https://github.com/BerriAI/litellm/pull/16532)

- **[Azure](../../docs/providers/azure)**
    - 修正 Azure 驗證參數對 None 值的處理 - [PR #14436](https://github.com/BerriAI/litellm/pull/14436)

- **[Groq](../../docs/providers/groq)**
    - 修正 Groq 失敗區塊的解析 - [PR #16595](https://github.com/BerriAI/litellm/pull/16595)

- **[Voyage](../../docs/providers/voyage)**
    - 新增 Voyage 3.5 與 3.5-lite embeddings 定價及文件更新 - [PR #16641](https://github.com/BerriAI/litellm/pull/16641)

- **[Fal.ai](../../docs/image_generation)**
    - 新增 fal-ai/flux/schnell 支援 - [PR #16580](https://github.com/BerriAI/litellm/pull/16580)
    - 在模型對應中新增所有 fal ai 的 Imagen4 變體 - [PR #16579](https://github.com/BerriAI/litellm/pull/16579)

### 錯誤修正 {#bug-fixes}

- **一般**
    - 修正 OpenAI 相容回應中的 null token usage 清理 - [PR #16493](https://github.com/BerriAI/litellm/pull/16493)
    - 修正將提供的 timeout 值套用至 ClientTimeout.total - [PR #16395](https://github.com/BerriAI/litellm/pull/16395)
    - 修正因錯誤例外而拋出錯誤的 429 - [PR #16482](https://github.com/BerriAI/litellm/pull/16482)
    - 新增模型、刪除重複模型、更新定價 - [PR #16491](https://github.com/BerriAI/litellm/pull/16491)
    - 更新自訂 LLM 提供者的模型記錄格式 - [PR #16485](https://github.com/BerriAI/litellm/pull/16485)

---

## LLM API 端點 {#llm-api-endpoints}

#### 新端點 {#new-endpoints}

- **[GET /providers](../../docs/proxy/management_endpoints)**
    - 新增 GET 提供者清單端點 - [PR #16432](https://github.com/BerriAI/litellm/pull/16432)

#### 功能 {#features-1}

- **[Video Generation API](../../docs/video_generation)**
    - 允許內部使用者存取影片生成路由 - [PR #16472](https://github.com/BerriAI/litellm/pull/16472)

- **[Vector Stores API](../../docs/vector_stores)**
    - 向量儲存區檔案正式版發布，具備完整 CRUD 作業 - [PR #16643](https://github.com/BerriAI/litellm/pull/16643)
      - `POST /v1/vector_stores/{vector_store_id}/files` - 建立向量儲存區檔案
      - `GET /v1/vector_stores/{vector_store_id}/files` - 列出向量儲存區檔案
      - `GET /v1/vector_stores/{vector_store_id}/files/{file_id}` - 取得向量儲存區檔案
      - `GET /v1/vector_stores/{vector_store_id}/files/{file_id}/content` - 取得檔案內容
      - `DELETE /v1/vector_stores/{vector_store_id}/files/{file_id}` - 刪除向量儲存區檔案
      - `DELETE /v1/vector_stores/{vector_store_id}` - 刪除向量儲存區
    - 確保使用者可在串流與非串流回應中存取 `search_results` - [PR #16459](https://github.com/BerriAI/litellm/pull/16459)

#### 錯誤 {#bugs}

- **[Video Generation API](../../docs/video_generation)**
    - 修正對 `/v1/videos/{video_id}/content` 使用 GET - [PR #16672](https://github.com/BerriAI/litellm/pull/16672)

- **一般**
    - 修正移除通用例外處理 - [PR #16599](https://github.com/BerriAI/litellm/pull/16599)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **Proxy CLI 驗證**
    - 修正 add_deployment 中移除嚴格的 master_key 檢查 - [PR #16453](https://github.com/BerriAI/litellm/pull/16453)

- **虛擬金鑰**
    - UI - 在編輯金鑰流程中新增標籤 - [PR #16500](https://github.com/BerriAI/litellm/pull/16500)
    - UI - 測試金鑰頁面根據所選端點顯示模型 - [PR #16452](https://github.com/BerriAI/litellm/pull/16452)
    - UI - 在檢視與更新路徑中公開 user_alias - [PR #16669](https://github.com/BerriAI/litellm/pull/16669)

- **模型 + 端點**
    - UI - 將 LiteLLM 參數新增至編輯模型 - [PR #16496](https://github.com/BerriAI/litellm/pull/16496)
    - UI - 新增模型使用後端資料 - [PR #16664](https://github.com/BerriAI/litellm/pull/16664)
    - UI - 自 LLM 憑證中移除描述欄位 - [PR #16608](https://github.com/BerriAI/litellm/pull/16608)
    - UI - 在 Admin UI 支援的模型/提供者中新增 RunwayML - [PR #16606](https://github.com/BerriAI/litellm/pull/16606)
    - Infra - 將新增模型欄位遷移到後端 - [PR #16620](https://github.com/BerriAI/litellm/pull/16620)
    - 新增建立模型存取群組的 API 端點 - [PR #16663](https://github.com/BerriAI/litellm/pull/16663)

- **團隊**
    - UI - 邀請使用者可搜尋的團隊選擇 - [PR #16454](https://github.com/BerriAI/litellm/pull/16454)
    - 修正建立新團隊時使用使用者預算而非金鑰預算 - [PR #16074](https://github.com/BerriAI/litellm/pull/16074)

- **預算**
    - UI - 將預算移出實驗性功能 - [PR #16544](https://github.com/BerriAI/litellm/pull/16544)

- **防護欄**
    - UI - 設定的防護欄不應可自表格刪除 - [PR #16540](https://github.com/BerriAI/litellm/pull/16540)
    - 修正從防護欄清單端點移除企業限制 - [PR #15333](https://github.com/BerriAI/litellm/pull/15333)

- **回呼**
    - UI - 新增回呼表格 - [PR #16512](https://github.com/BerriAI/litellm/pull/16512)
    - 修正刪除回呼失敗 - [PR #16473](https://github.com/BerriAI/litellm/pull/16473)

- **用量與分析**
    - UI - 改善用量指示器 - [PR #16504](https://github.com/BerriAI/litellm/pull/16504)
    - UI - 模型資訊頁面健康檢查 - [PR #16416](https://github.com/BerriAI/litellm/pull/16416)
    - Infra - 為模型分析分頁顯示淘汰警告 - [PR #16417](https://github.com/BerriAI/litellm/pull/16417)
    - 修正 Litellm 標籤用量新增 request_id - [PR #16111](https://github.com/BerriAI/litellm/pull/16111)

- **健康檢查**
    - 將 Langfuse OTEL 與 SQS 加入健康檢查 - [PR #16514](https://github.com/BerriAI/litellm/pull/16514)

- **一般 UI**
    - UI - 標準化表格操作欄外觀 - [PR #16657](https://github.com/BerriAI/litellm/pull/16657)
    - UI - 設定頁面的按鈕樣式與大小 - [PR #16600](https://github.com/BerriAI/litellm/pull/16600)
    - UI - SSO 彈出視窗外觀變更 - [PR #16554](https://github.com/BerriAI/litellm/pull/16554)
    - 修正使用 SERVER_ROOT_PATH 載入 UI 標誌 - [PR #16618](https://github.com/BerriAI/litellm/pull/16618)
    - 修正從 OpenAI 端點提示中移除誤導性的「Custom」選項提及 - [PR #16622](https://github.com/BerriAI/litellm/pull/16622)

- **SSO**
    - 當使用者被插入到 LiteLLM 時，請確保使用來自 SSO 提供者的 `role` - [PR #16794](https://github.com/BerriAI/litellm/pull/16794)

#### 錯誤 {#bugs-1}

- **管理端點**
    - 修正客戶管理端點中不一致的錯誤回應 - [PR #16450](https://github.com/BerriAI/litellm/pull/16450)
    - 修正 /spend/logs 端點中正確的日期範圍篩選 - [PR #16443](https://github.com/BerriAI/litellm/pull/16443)
    - 修正 /spend/logs/ui 存取控制 - [PR #16446](https://github.com/BerriAI/litellm/pull/16446)
    - 為 /spend/logs/session/ui 端點新增分頁 - [PR #16603](https://github.com/BerriAI/litellm/pull/16603)
    - 修正 LiteLLM Usage 顯示 key_hash - [PR #16471](https://github.com/BerriAI/litellm/pull/16471)
    - 修正 jwt payload 中缺少 app_roles - [PR #16448](https://github.com/BerriAI/litellm/pull/16448)

---

## Logging / Guardrail / Prompt Management 整合 {#logging--guardrail--prompt-management-integrations}

#### 新整合 {#new-integration}

- **🆕 [Zscaler AI Guard](../../docs/proxy/guardrails/zscaler_ai_guard)**
    - 新增 Zscaler AI Guard 掛鉤以強制執行安全政策 - [PR #15691](https://github.com/BerriAI/litellm/pull/15691)

#### 記錄 {#logging}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正處理 null usage 值以避免驗證錯誤 - [PR #16396](https://github.com/BerriAI/litellm/pull/16396)

- **[CloudZero](../../docs/proxy/logging)**
    - 修正更新後的 spend 不會傳送到 CloudZero - [PR #16201](https://github.com/BerriAI/litellm/pull/16201)

#### 防護欄 {#guardrails}

- **[IBM Detector](../../docs/proxy/guardrails)**
    - 確保 detector-id 以標頭形式傳遞給 IBM detector server - [PR #16649](https://github.com/BerriAI/litellm/pull/16649)

#### 提示詞管理 {#prompt-management}

- **[自訂提示管理](../../docs/proxy/prompt_management)**
    - 新增以 SDK 為重點的 custom prompt management 範例 - [PR #16441](https://github.com/BerriAI/litellm/pull/16441)

---

## Spend Tracking、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **終端使用者預算**
    - 允許將 max_end_user budget 指向某個 id，讓預設 ID 套用於所有終端使用者 - [PR #16456](https://github.com/BerriAI/litellm/pull/16456)

---

## MCP 閘道 {#mcp-gateway}

- **組態**
    - 為 MCP servers 新增動態 OAuth2 metadata discovery - [PR #16676](https://github.com/BerriAI/litellm/pull/16676)
    - 修正即使缺少 server name prefix 也允許 tool call - [PR #16425](https://github.com/BerriAI/litellm/pull/16425)
    - 修正將未經授權的 MCP servers 排除於允許的 server list 之外 - [PR #16551](https://github.com/BerriAI/litellm/pull/16551)
    - 修正無法從 permission settings 刪除 MCP server - [PR #16407](https://github.com/BerriAI/litellm/pull/16407)
    - 修正當 MCP server record 缺少 credentials 時避免當機 - [PR #16601](https://github.com/BerriAI/litellm/pull/16601)

---

## 代理程式 {#agents}

- **[代理程式註冊 (A2A 規格)](../../docs/agents)**
    - 支援依照 Agent-to-Agent specification 進行 agent registration + discovery - [PR #16615](https://github.com/BerriAI/litellm/pull/16615)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **嵌入效能**
    - 對 embeddings 使用 router 的 O(1) lookup 與共用 sessions - [PR #16344](https://github.com/BerriAI/litellm/pull/16344)

- **路由器可靠性**
    - 支援未知模型的預設 fallback - [PR #16419](https://github.com/BerriAI/litellm/pull/16419)

- **回呼管理**
    - 新增 atexit handlers 以在 async completions 時 flush callbacks - [PR #16487](https://github.com/BerriAI/litellm/pull/16487)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

- **組態管理**
    - 修正 update model_cost_map_url 以使用環境變數 - [PR #16429](https://github.com/BerriAI/litellm/pull/16429)

---

## 文件更新 {#documentation-updates}

- **Provider 文件**
    - 修正 README 中的 streaming 範例 - [PR #16461](https://github.com/BerriAI/litellm/pull/16461)
    - 更新損壞的 Slack invite links 以指向 support page - [PR #16546](https://github.com/BerriAI/litellm/pull/16546)
    - 修正 fallbacks page 的 code block 縮排 - [PR #16542](https://github.com/BerriAI/litellm/pull/16542)
    - 文件 code 範例修正 - [PR #16502](https://github.com/BerriAI/litellm/pull/16502)
    - 文件化 `reasoning_effort` summary field options - [PR #16549](https://github.com/BerriAI/litellm/pull/16549)

- **API 文件**
    - 新增關於模型存取管理 APIs 的文件 - [PR #16673](https://github.com/BerriAI/litellm/pull/16673)
    - 新增文件說明如何自動重新載入新的 pricing data - [PR #16675](https://github.com/BerriAI/litellm/pull/16675)
    - LiteLLM 快速入門 - 示範 model resolution 如何運作 - [PR #16602](https://github.com/BerriAI/litellm/pull/16602)
    - 新增追蹤 callback failure 的文件 - [PR #16474](https://github.com/BerriAI/litellm/pull/16474)

- **一般文件**
    - 修正 release page 中的 container api link - [PR #16440](https://github.com/BerriAI/litellm/pull/16440)
    - 將 softgen 新增到使用 litellm 的專案中 - [PR #16423](https://github.com/BerriAI/litellm/pull/16423)

---

## 新貢獻者 {#new-contributors}

* @artplan1 在 [PR #16423](https://github.com/BerriAI/litellm/pull/16423) 完成了首次貢獻
* @JehandadK 在 [PR #16472](https://github.com/BerriAI/litellm/pull/16472) 完成了首次貢獻
* @vmiscenko 在 [PR #16453](https://github.com/BerriAI/litellm/pull/16453) 完成了首次貢獻
* @mcowger 在 [PR #16429](https://github.com/BerriAI/litellm/pull/16429) 完成了首次貢獻
* @yellowsubmarine372 在 [PR #16395](https://github.com/BerriAI/litellm/pull/16395) 完成了首次貢獻
* @Hebruwu 在 [PR #16201](https://github.com/BerriAI/litellm/pull/16201) 完成了首次貢獻
* @jwang-gif 在 [PR #15691](https://github.com/BerriAI/litellm/pull/15691) 完成了首次貢獻
* @AnthonyMonaco 在 [PR #16502](https://github.com/BerriAI/litellm/pull/16502) 完成了首次貢獻
* @andrewm4894 在 [PR #16487](https://github.com/BerriAI/litellm/pull/16487) 完成了首次貢獻
* @f14-bertolotti 在 [PR #16485](https://github.com/BerriAI/litellm/pull/16485) 完成了首次貢獻
* @busla 在 [PR #16293](https://github.com/BerriAI/litellm/pull/16293) 完成了首次貢獻
* @MightyGoldenOctopus 在 [PR #16537](https://github.com/BerriAI/litellm/pull/16537) 完成了首次貢獻
* @ultmaster 在 [PR #14436](https://github.com/BerriAI/litellm/pull/14436) 完成了首次貢獻
* @bchrobot 在 [PR #16542](https://github.com/BerriAI/litellm/pull/16542) 完成了首次貢獻
* @sep-grindr 在 [PR #16622](https://github.com/BerriAI/litellm/pull/16622) 完成了首次貢獻
* @pnookala-godaddy 在 [PR #16607](https://github.com/BerriAI/litellm/pull/16607) 完成了首次貢獻
* @dtunikov 在 [PR #16592](https://github.com/BerriAI/litellm/pull/16592) 完成了首次貢獻
* @lukapecnik 在 [PR #16648](https://github.com/BerriAI/litellm/pull/16648) 完成了首次貢獻
* @jyeros 在 [PR #16618](https://github.com/BerriAI/litellm/pull/16618) 完成了首次貢獻

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上查看完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.79.3.rc.1...v1.80.0.rc.1)**

---
