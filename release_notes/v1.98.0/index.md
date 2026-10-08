---
title: "v1.98.0 - 預置吞吐量計費、影子評估與路由群組"
slug: "v1-98-0"
date: 2026-08-22T00:00:00
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
docker.litellm.ai/berriai/litellm:1.98.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.98.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**Langfuse 中繼資料 blob 現在改為來自 StandardLoggingPayload allowlist，而不是原始請求中繼資料。** 約有 20 個欄位不再出現在 generation 中，實測從 52 個鍵降到 38 個，因此任何基於 `model_group`、`model_info`、`deployment`、`deployment_model_name`、`model_group_alias`、`model_group_size`、`litellm_api_version`、`litellm_received_at`、`litellm_parent_otel_span`、`queue_time_seconds`、`attempted_retries`、`max_retries`、`agent_id`、`caller_tags`、`inherited_tags`、`global_max_parallel_requests`、`user_api_key`，或剩餘的 `user_api_key_*` budget 與 permission-id 欄位所建立的任何已儲存 Langfuse 篩選器、儀表板或警示都將不再相符。`model_group` 和 deployment id 仍可從 `hidden_params` 取得。直接 SDK 呼叫端若傳入扁平的自訂中繼資料，必須將其巢狀化，`metadata={"metadata": {"my_key": "v"}}`，且它會出現在 `requester_metadata` 底下；代理呼叫端不受影響。`debug_langfuse` 現在輸出的是呼叫端純量，而不是原始中繼資料傾印。請參閱 [PR #36744](https://github.com/BerriAI/litellm/pull/36744)。

**Global Control Plane worker registry 現在需要 Enterprise 授權。** 若 proxy 已設定 `worker_registry` 但沒有有效的 `LITELLM_LICENSE`，則會拒絕啟動，而不會再在未授權狀態下靜默執行。請設定有效授權以保留 control plane，或移除 `worker_registry` 鍵以在沒有它的情況下啟動。請參閱 [PR #36996](https://github.com/BerriAI/litellm/pull/36996)。

**`litellm_settings.callbacks` 項目若其 dotted path 指向一個 class，現在會在設定載入時失敗。** 這類項目過去會被接受但靜默無作用：proxy 會啟動、提供流量，卻從未執行該 hook。請將該項目指向一個 instance 或 function，例如 `custom_callbacks.proxy_handler_instance`，即可重新啟動。請參閱 [PR #36858](https://github.com/BerriAI/litellm/pull/36858)。

:::

## 重點摘要 {#key-highlights}

- **保留容量以保留容量計費** - 現在 deployment 可帶有 `ptu_count` 與 `cost_per_ptu_per_hour`，並具有有效期間；每日彙總會按啟用的小時為每個 model 寫入平坦成本，且該 deployment 上的 per-token 計費會完全關閉，因此為 provisioned throughput 付費的團隊不會再為同一筆流量被重複收費。歸屬為環境變數後才啟用，而與 PTU 設定一同傳入的價格會被 400 拒絕
- **您可以在採用 auto-router 前先衡量它** - shadow eval job 會抽樣某個 key 的一部分成功流量，將其回放到 auto-router，並在一個不會提供回應也不會增加延遲的分離任務中執行，之後由 LLM judge 以隨機化 A/B 標籤盲測比較兩個答案。計數、狀態、judge 花費，以及按 tier 與 incumbent model 分組的勝率，全都由讀取時從每個樣本一筆 append-only row 推得，且該 job 也會反向執行
- **Routing groups 可以像模型一樣被呼叫** - `model=<group_name>` 現在會依據群組自身的策略，在成員 deployment 的聯集上進行路由，群組名稱會出現在 `/v1/models` 中，因此 Claude Code 與 Codex discovery surface 能看見它們，而且可授權給 keys 和 teams。Create Group modal 從第一天起就承諾了這件事
- **每個回應都可陳述自己的成本明細** - 六個 `x-litellm-response-cost-*` 標頭會與總計一起送出，其中 input、cache read、cache creation、output 與 tool usage 的總和會精確等於總計，而 reasoning 則是 output 的子集合，因此平台團隊無需本地價格表即可按元件歸屬支出
- **TPM 預留會遵循宣告的輸出大小** - 現在可為每個 key、每個 team 與每個 model 宣告預期輸出 token，而不是所有 tenant 共用一個靜態下限，因此並行請求不再會超出團隊的 TPM 上限，而那些模型輸出遠少於預期的團隊也不會再被限流。若未設定，則行為完全相同且無需遷移
- **Admin UI 脫離 antd 與 Tremor 的工作邁出至今最大一步** - 這個版本中的 75 個 UI pull request 已將 navbar、playground、guardrails、usage、cost tracking、models 與 endpoints、team 與 user 介面、log details drawer、AI Hub，以及大量共用元件庫遷移到 shadcn（base-vega）原語。遷移尚未完成；兩個程式庫仍是相依套件，且仍支援儀表板的部分區塊

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（1 個新提供者） {#new-providers-1-new-provider}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Nimble | `/search` | Nimble 的 Search API，作為第 18 個原生搜尋提供者，已註冊至 provider enum、config map、pricing map 與 dashboard，價格為每次查詢 $0.005 |

### 新增 LLM API 端點（2 個新端點） {#new-llm-api-endpoints-2-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| --- | --- | --- | --- |
| `/v1/indexes` | GET | 僅供 Admin 使用的已註冊 vector store index 清單，依最新優先排序，方便稽核透過 `POST /v1/indexes` 建立的 indexes | [Vector Stores](../../docs/completion/knowledgebase) |
| `/auto_router/shadow_eval/{start,stop,{job_id}}` | POST, GET | 啟動、停止並讀取 auto-router 的採用前 shadow eval job，回傳推得的計數、judge 花費、最新錯誤與勝率 | [Auto Router](../../docs/adaptive_router) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（52 個新模型） {#new-model-support-52-new-models}

| 提供者 | Model | Context Window | Input ($/1M tokens) | Output ($/1M tokens) | Features |
| --- | --- | --- | --- | --- | --- |
| Anthropic | `claude-mythos-5` | 1M | $10.00 | $50.00 | 推理、自適應思考、xhigh 和 max reasoning effort、視覺、PDF 輸入、電腦使用、函式呼叫、工具選擇、提示快取、回應結構描述、輸出設定 |
| Anthropic | `claude-mythos-preview` | 1M | $10.00 | $50.00 | 推理、自適應思考、xhigh 和 max reasoning effort、視覺、PDF 輸入、電腦使用、函式呼叫、工具選擇、提示快取、回應結構描述、輸出設定 |
| OpenAI | `gpt-transcribe` | - | - | - | 音訊轉錄，每秒 $0.000075 |
| OpenAI | `gpt-live-transcribe` | - | - | - | 音訊轉錄，每秒 $0.00028333 |
| OpenAI | `gpt-realtime-translate` | 16K | - | - | 即時、音訊輸入與輸出，每秒 $0.00056667 |
| Google Gemini | `gemini/gemini-3.7-flash` | 1M | $0.75 | $3.75 | 推理、視覺、音訊輸入、影片輸入、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋、URL 內容、原生串流 |
| Google Gemini | `gemini/gemini-3.1-flash-tts-preview` | 8K | $1.00 | $20.00 | 音訊語音 |
| Google Gemini | `gemini/gemini-robotics-er-2-streaming-preview` | - | $2.00 | $10.00 | 視覺、音訊輸入、影片輸入、函式呼叫、網頁搜尋 |
| Google Vertex AI | `vertex_ai/gemini-3.7-flash` | 1M | $0.75 | $3.75 | 推理、視覺、音訊輸入、影片輸入、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋、URL 內容、原生串流 |
| Google Vertex AI | `gemini-3.7-flash` | 1M | $0.75 | $3.75 | 推理、視覺、音訊輸入、影片輸入、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋、URL 內容、原生串流 |
| xAI | `xai/grok-4.6` | 500K | $2.00 | $6.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋、超過 200K 分級定價 |
| xAI | `xai/grok-build-0.1` | 256K | $1.00 | $2.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述、超過 200K 分級定價 |
| xAI | `xai/grok-4.20-0309-non-reasoning` | 1M | $1.25 | $2.50 | 視覺、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent-0309` | 1M | $1.25 | $2.50 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| Mistral | `mistral/mistral-small-2603` | 262K | $0.15 | $0.60 | 推理、函式呼叫、工具選擇、回應結構描述、assistant prefill |
| Mistral | `mistral/labs-leanstral-1-5` | 262K | $0.00 | $0.00 | 函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-moderation-2603` | 131K | $0.00 | $0.00 | 內容審核 |
| Mistral | `mistral/voxtral-mini-2602` | - | - | - | 音訊轉錄，每秒 $0.00005 |
| Mistral | `mistral/voxtral-mini-transcribe-realtime-2602` | - | - | - | 音訊轉錄，每秒 $0.0001 |
| Mistral | `mistral/voxtral-mini-tts-2603` | - | - | - | 音訊語音，每個輸出字元 $0.000016 |
| Groq | `groq/qwen/qwen3.6-27b` | 131K | $0.60 | $3.00 | 推理、視覺、函式呼叫、工具選擇 |
| Groq | `groq/meta-llama/llama-prompt-guard-2-22m` | 512 | $0.03 | $0.03 | 聊天 |
| Groq | `groq/meta-llama/llama-prompt-guard-2-86m` | 512 | $0.04 | $0.04 | 聊天 |
| Groq | `groq/canopylabs/orpheus-v1-english` | 4K | - | - | 音訊語音，每個字元 $0.000022 |
| Groq | `groq/canopylabs/orpheus-arabic-saudi` | 4K | - | - | 音訊語音，每個字元 $0.00004 |
| Meta | `meta/muse-spark-1.2` | 1M | $1.25 | $4.25 | 推理、minimal 和 xhigh reasoning effort、視覺、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| Meta | `meta/muse-spark-1.2-contributor` | 1M | $0.10 | $0.20 | 推理、minimal 和 xhigh reasoning effort、視覺、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| Azure AI | `azure_ai/grok-4.3` | 200K | $1.25 | $2.50 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| Azure AI | `azure_ai/FW-DeepSeek-V3.2` | 164K | $0.62 | $1.85 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-DeepSeek-V4-Pro` | 1M | $1.925 | $3.828 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-GLM-5` | 200K | $1.10 | $3.52 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-GLM-5.1` | 203K | $1.54 | $4.84 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-GLM-5.2` | 1M | $1.54 | $4.84 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-GLM-5.2-Fast` | 1M | $2.10 | $6.60 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Inkling` | 1M | $1.00 | $4.05 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Kimi-K2.5` | 262K | $0.66 | $3.30 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Kimi-K2.6` | 262K | $1.045 | $4.40 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Kimi-K2.7-Code` | 262K | $1.05 | $4.40 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Kimi-K3` | 1M | $3.30 | $16.50 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-MiniMax-M2.5` | 1M | $0.33 | $1.32 | 推理、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-MiniMax-M3` | 512K | $0.33 | $1.32 | 推理、視覺、函式呼叫、工具選擇、提示快取 |
| Azure AI | `azure_ai/FW-Nemotron-3-Ultra-NVFP4` | 262K | $0.60 | $2.40 | 推理、函式呼叫、工具選擇、提示快取 |
| DashScope | `dashscope/deepseek-v4-flash` | 1M | $0.20 | $0.40 | 推理、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/deepseek-v4-flash-0731` | 1M | $0.20 | $0.40 | 推理、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/deepseek-v4-pro` | 1M | $2.40 | $4.80 | 推理、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/glm-5.1` | 203K | $1.40 | $4.40 | 推理、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/glm-5.2` | 1M | $1.40 | $4.40 | 推理、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/kimi-k2.7-code` | 229K | $0.95 | $4.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DashScope | `dashscope/qwen3.8-max` | 992K | $2.00 | $6.00 | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構描述 |
| DeepInfra | `deepinfra/nvidia/NVIDIA-Nemotron-3.5-Lightning` | 262K | $0.05 | $0.20 | 推理、函式呼叫、工具選擇 |
| OpenRouter | `openrouter/nvidia/nemotron-3.5-lightning` | 262K | $0.05 | $0.20 | 推理、函式呼叫、工具選擇 |
| Nimble | `nimble/search` | - | - | - | 搜尋，每次查詢 $0.005 |

除了新增項目之外，此版本也進行了一次大規模的成本對應維護：270 個既有項目新增或修正了提供者公告的 `deprecation_date`，涵蓋 Bedrock、Mistral、Cohere、Gemini、OpenAI 和 xAI，另有 85 個新增了 `search_context_cost_per_query` 區塊。xAI 定價在兩個方向都已修正：`grok-4.20` 推理與非推理變體從每 1M tokens $2.00 / $6.00 降至 $1.25 / $2.50，且其 context window 從 2M 修正為 1M；同時 `grok-code-fast` 則從 $0.20 / $1.50 上調至 $1.00 / $2.00。Bedrock Mantle 的 `openai.gpt-5.6-sol`、`-terra` 與 `-luna` 項目從 272K context window 調整為 1M，並對應超過 272K 的分級；`gpt-5-pro` 的 max output 從 128K 提升至 272K；DeepSeek V4 項目的最大輸出從 8K 調整為 393K；而 Groq 的 `llama-3.1-8b-instant`、`llama-3.3-70b-versatile` 與 `gpt-oss` 項目已與 Groq 自身文件重新同步。17 個項目標記了原生結構化輸出，43 個標記了 `supports_tool_search`，另有 29 個標記了 reasoning-effort。未移除任何定價項目。

#### 功能 {#features}

- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 支援透過 `routers/` 前綴的 router slug - [PR #34257](https://github.com/BerriAI/litellm/pull/34257)
    - 將 NIM 和 vLLM 的額外參數轉譯為 Fireworks 原生引數 - [PR #35969](https://github.com/BerriAI/litellm/pull/35969)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 在 Azure AI Foundry 與 Grok 4.3 metadata 中新增 Fireworks FW 模型定價 - [PR #35613](https://github.com/BerriAI/litellm/pull/35613), [PR #27932](https://github.com/BerriAI/litellm/pull/27932)
- **[Google Gemini](../../docs/providers/gemini)**
    - `gemini-3.7-flash` 的 Day-0 定價 - [PR #36792](https://github.com/BerriAI/litellm/pull/36792)
- **[xAI](../../docs/providers/xai)**
    - `grok-4.6` 的 Day-0 定價 - [PR #36805](https://github.com/BerriAI/litellm/pull/36805)
- **[DashScope](../../docs/providers/dashscope)**
    - 將最新的 Model Studio 模型新增至成本對應表 - [PR #36496](https://github.com/BerriAI/litellm/pull/36496)
- **[Meta](../../docs/providers/meta_llama)**
    - 新增 `meta/muse-spark-1.2` 及其 contributor tier - [PR #36717](https://github.com/BerriAI/litellm/pull/36717)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 在 OpenRouter 和 DeepInfra 上新增 NVIDIA Nemotron 3.5 Lightning - [PR #36696](https://github.com/BerriAI/litellm/pull/36696)
- **[OpenAI](../../docs/providers/openai)**
    - 為 `gpt-5.4-mini` 模型啟用 xhigh reasoning 支援 - [PR #26909](https://github.com/BerriAI/litellm/pull/26909)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - AWS 請求使用部署的憑證，並在批次檔案記錄中解析別名 - [PR #36160](https://github.com/BerriAI/litellm/pull/36160), [PR #36159](https://github.com/BerriAI/litellm/pull/36159)
    - 在所有讀取 managed-batch 輸出 bucket 的路徑上解析它，並停止 managed-batch `litellm_params` 洩漏給提供者 - [PR #37047](https://github.com/BerriAI/litellm/pull/37047), [PR #37048](https://github.com/BerriAI/litellm/pull/37048)
    - 在 Converse 中移除 Claude Sonnet 5 的 `toolSpec.strict` - [PR #33196](https://github.com/BerriAI/litellm/pull/33196)
    - 為帶有文件的 Converse 使用者訊息新增文字區塊 - [PR #36499](https://github.com/BerriAI/litellm/pull/36499)
    - 在 Invoke `/v1/messages` 時為 Haiku 4.5 傳送 tool-search beta 標頭 - [PR #36502](https://github.com/BerriAI/litellm/pull/36502)
    - 透過 `/v1/messages` 橋接保留 adaptive thinking effort - [PR #36507](https://github.com/BerriAI/litellm/pull/36507)
    - 在 invoke tools 時先提升 `custom.defer_loading`，再移除 `custom` - [PR #36855](https://github.com/BerriAI/litellm/pull/36855)
    - 對 Anthropic server-side `web_search` tool 傳回可採取行動的錯誤，而非提供者失敗 - [PR #36473](https://github.com/BerriAI/litellm/pull/36473)
    - 為 GLM 5 和 DeepSeek V3.2 啟用原生結構化輸出，並在每個 Bedrock id 上宣告此功能 - [PR #35669](https://github.com/BerriAI/litellm/pull/35669), [PR #36597](https://github.com/BerriAI/litellm/pull/36597)
    - 將 Bedrock Mantle GPT-5.6 Sol、Terra 與 Luna 項目的 context window 提升為 1M，並使用 long-context 定價 - [PR #36698](https://github.com/BerriAI/litellm/pull/36698)
- **[Anthropic](../../docs/providers/anthropic)**
    - 保留中途的系統修正 - [PR #34290](https://github.com/BerriAI/litellm/pull/34290)
    - 在 usage 中保留 `speed=fast`，適用於 `/v1/messages` 與 pass-through - [PR #36447](https://github.com/BerriAI/litellm/pull/36447)
    - 在 Anthropic-direct `claude-sonnet-5` 和 `claude-haiku-4-5` 上標記原生結構化輸出 - [PR #35930](https://github.com/BerriAI/litellm/pull/35930)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 將 `/v1/embeddings` 批次列轉換為 Gemini embedding 形狀 - [PR #35092](https://github.com/BerriAI/litellm/pull/35092)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 辨識真正的 Search 文件端點，讓團隊可透過 passthrough 讀取與寫入 - [PR #36798](https://github.com/BerriAI/litellm/pull/36798)
- **[Databricks](../../docs/providers/databricks)**
    - 在串流分塊中顯示提供者使用量，包括 prompt-cache 計數 - [PR #36943](https://github.com/BerriAI/litellm/pull/36943)
- **[NVIDIA NIM](../../docs/providers/nvidia_nim)**
    - 保留影像片段，並停止將 `top_k` 傳送至 `/v1/ranking` - [PR #34177](https://github.com/BerriAI/litellm/pull/34177)
- **[Groq](../../docs/providers/groq)**
    - 將 Groq registry 與 Groq 的文件同步 - [PR #36664](https://github.com/BerriAI/litellm/pull/36664)
- **[OpenAI](../../docs/providers/openai)**
    - 當輸出預算容納不下任何 token 時，回傳長度截斷的 200 - [PR #36859](https://github.com/BerriAI/litellm/pull/36859)
- **一般**
    - 隨基礎 SDK 一併提供 boto3，讓 Bedrock 可在 `pip install litellm` 開箱即用 - [PR #36568](https://github.com/BerriAI/litellm/pull/36568)
    - 讓明確指定的提供者優先於已知的 OpenAI 模型名稱 - [PR #36800](https://github.com/BerriAI/litellm/pull/36800)
    - 更新棄用日期、修正 xAI 定價、新增缺少的提供者模型，並修正 DeepSeek V4 的最大輸出 - [PR #36403](https://github.com/BerriAI/litellm/pull/36403), [PR #36538](https://github.com/BerriAI/litellm/pull/36538), [PR #36788](https://github.com/BerriAI/litellm/pull/36788), [PR #36925](https://github.com/BerriAI/litellm/pull/36925)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Anthropic `/v1/messages`](../../docs/anthropic_unified)**
    - 提供 Anthropic 原生的 `/v1/models`，讓 Claude Code 的 gateway discovery 能填入其模型選擇器 - [PR #35455](https://github.com/BerriAI/litellm/pull/35455)
- **[向量儲存](../../docs/completion/knowledgebase)**
    - 僅限管理員的 `GET /v1/indexes`，列出每個已註冊的向量儲存索引 - [PR #36289](https://github.com/BerriAI/litellm/pull/36289)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 保留 Codex namespace tool calls - [PR #32536](https://github.com/BerriAI/litellm/pull/32536)
    - 在橋接串流 iterator 上初始化 `completed_response` - [PR #35413](https://github.com/BerriAI/litellm/pull/35413)
    - 將 interaction step 與 turn history 對應到 Responses API roles 與 content types - [PR #36733](https://github.com/BerriAI/litellm/pull/36733)
- **[批次處理](../../docs/batches)**
    - 停止在 list 和 cancel 中重複轉送 `custom_llm_provider` - [PR #32813](https://github.com/BerriAI/litellm/pull/32813)
- **[受管理檔案](../../docs/files_endpoints)**
    - 停止 `/{provider}/v1/files` 擷取 `/openai_passthrough` - [PR #36092](https://github.com/BerriAI/litellm/pull/36092)
    - 將檔案清單分頁游標限定於呼叫端，並在呼叫端限定的頁面上回報 `has_more` 為 false - [PR #36093](https://github.com/BerriAI/litellm/pull/36093), [PR #36326](https://github.com/BerriAI/litellm/pull/36326)
- **[直通](../../docs/pass_through/anthropic_completion)**
    - 停止將用戶端的 `Accept-Encoding` 向上游轉送，因為當 Anthropic 開始以 brotli 壓縮 JSON 後，這會在原生 Docker 映像中搞亂 Claude Code 的 `/v1/models` 與 `count_tokens` 主體 - [PR #37058](https://github.com/BerriAI/litellm/pull/37058)
- **Anthropic `/v1/models`**
    - 一律傳出 token limits，若未知則為 null - [PR #36961](https://github.com/BerriAI/litellm/pull/36961)
- **Web 搜尋**
    - 停止將攔截控制欄位洩漏給提供者 - [PR #36480](https://github.com/BerriAI/litellm/pull/36480)
- **一般**
    - 讓 `tool_result` 圖像對 OpenAI 相容提供者可見 - [PR #34462](https://github.com/BerriAI/litellm/pull/34462)
    - 停止在錯誤內容中的單獨 429 壓過例外對應中的狀態碼 - [PR #36705](https://github.com/BerriAI/litellm/pull/36705)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 透過 `enable_prompt_caching` 提供每個金鑰的 prompt 快取切換，並在建立與編輯金鑰時於 Admin UI 提供開關 - [PR #36466](https://github.com/BerriAI/litellm/pull/36466)
    - 新增 `config_updated_at` 稽核時間戳記 - [PR #36488](https://github.com/BerriAI/litellm/pull/36488)
- **Proxy CLI**
    - 透過 `~/.litellm/config.json` 使隱藏的 `lite` 命令清單可設定 - [PR #36816](https://github.com/BerriAI/litellm/pull/36816)
- **Auto-router 畫面**
    - 在 auto-router 使用量旁新增 shadow evals 分頁，並提供方向選擇器與反向模式顯示 - [PR #36588](https://github.com/BerriAI/litellm/pull/36588), [PR #36994](https://github.com/BerriAI/litellm/pull/36994)
    - 部署親和性切換，以及在 routing benchmark 圖表中每個層級下方顯示模型 - [PR #36302](https://github.com/BerriAI/litellm/pull/36302), [PR #36291](https://github.com/BerriAI/litellm/pull/36291)
    - 在導覽列公告中強調 Auto Router - [PR #36315](https://github.com/BerriAI/litellm/pull/36315)
- **儀表板**
    - 在 `/ui/chat` 畫面上呈現請求指標，包括聊天回應指標中的提供者 prompt cache tokens - [PR #36845](https://github.com/BerriAI/litellm/pull/36845), [PR #36827](https://github.com/BerriAI/litellm/pull/36827)
    - 在 Vector Stores 頁面顯示 vector store indexes - [PR #36306](https://github.com/BerriAI/litellm/pull/36306)
    - 在 model form 顯示 PTU 輸入，並在 Usage 頁面顯示 flat cost - [PR #35393](https://github.com/BerriAI/litellm/pull/35393)
    - 將 playground 聊天控制項移轉至 shadcn - [PR #36129](https://github.com/BerriAI/litellm/pull/36129)
    - 當未設定 Redis 時在 Admin UI 顯示警告 - [PR #36495](https://github.com/BerriAI/litellm/pull/36495)
    - 將使用者詳細資料中的 team 名稱連結到其 team 頁面 - [PR #37022](https://github.com/BerriAI/litellm/pull/37022)

#### 錯誤 {#bugs-1}

- **驗證與角色**
    - 在 `lite login` session token 中帶入 team 權限，使綁定 team 的 CLI 使用者在 `/v1/models` 不再看到整個 proxy - [PR #36826](https://github.com/BerriAI/litellm/pull/36826)
    - 在解析 team models 時，為 `/v2/model/info` 展開由設定檔定義的模型存取群組 - [PR #34211](https://github.com/BerriAI/litellm/pull/34211)
    - 在 UI SSO 偵測中將 SAML 視為已設定 - [PR #36196](https://github.com/BerriAI/litellm/pull/36196)
    - 恢復 `management_v1` 查詢參數驗證於 `fastapi>=0.140.7` 下 - [PR #35773](https://github.com/BerriAI/litellm/pull/35773)
- **Teams 與存取群組**
    - 從 team 與 key 寫入路徑同步 `assigned_team_ids` 和 `assigned_key_ids` - [PR #36825](https://github.com/BerriAI/litellm/pull/36825), [PR #36843](https://github.com/BerriAI/litellm/pull/36843)
    - 在刪除 team 時清除懸掛的 team 參照與快取 - [PR #36819](https://github.com/BerriAI/litellm/pull/36819)
    - 以使用者 id 而非所指定的電子郵件來處理 `member_delete` 清理 - [PR #36839](https://github.com/BerriAI/litellm/pull/36839)
    - 停止重複的舊版邀請電子郵件，並修正其 onboarding 連結 - [PR #36455](https://github.com/BerriAI/litellm/pull/36455)
- **Proxy CLI**
    - 在 Windows 上將 agents 以子行程啟動 - [PR #36822](https://github.com/BerriAI/litellm/pull/36822)
- **儀表板**
    - 對無法呼叫其端點的角色隱藏僅供管理員使用的 Logs 分頁，並為組織管理員恢復 Deleted Teams 分頁 - [PR #36333](https://github.com/BerriAI/litellm/pull/36333), [PR #36478](https://github.com/BerriAI/litellm/pull/36478)
    - 將 organization 與 agent 的使用量檢視、policy 與 prompt 查詢、Old Usage 頁面，以及四個側邊欄頁面限制於其端點允許的角色之下 - [PR #36334](https://github.com/BerriAI/litellm/pull/36334), [PR #36335](https://github.com/BerriAI/litellm/pull/36335), [PR #36469](https://github.com/BerriAI/litellm/pull/36469), [PR #36475](https://github.com/BerriAI/litellm/pull/36475)
    - 將 Virtual Keys 與 Logs 的 team 清單限制為呼叫者可見 - [PR #36472](https://github.com/BerriAI/litellm/pull/36472)
    - 在 virtual key 上顯示與編輯 key 層級的 router 設定 - [PR #36674](https://github.com/BerriAI/litellm/pull/36674)
    - 停止已取消選取的 MCP server 保留其在 virtual key 上的權限，並讓 MCP servers 數量徽章與其相鄰的權限徽章一致 - [PR #36840](https://github.com/BerriAI/litellm/pull/36840), [PR #36984](https://github.com/BerriAI/litellm/pull/36984)
    - 恢復 playground 依端點篩選模型、在聊天下拉選單中保留 `mode: completion` models，並在提供者下拉選單中區分代管與本機 vLLM - [PR #36130](https://github.com/BerriAI/litellm/pull/36130), [PR #37954](https://github.com/BerriAI/litellm/pull/37954), [PR #36974](https://github.com/BerriAI/litellm/pull/36974)
    - 將 NVIDIA Riva 新增至模型提供者清單 - [PR #36769](https://github.com/BerriAI/litellm/pull/36769)
    - 對齊 spend 與 budget 欄位，並將 models table 的 Status 欄重新命名為 Source - [PR #35176](https://github.com/BerriAI/litellm/pull/35176), [PR #37021](https://github.com/BerriAI/litellm/pull/37021)
    - 當某個視窗沒有 sessions 時顯示歸零的 auto-router 使用統計，並在 edit auto-router 表單上方開啟 classifier prompt 編輯器 - [PR #36868](https://github.com/BerriAI/litellm/pull/36868), [PR #36438](https://github.com/BerriAI/litellm/pull/36438)
    - 讓 cost tracking 移除確認視窗保持開啟直到完成，去重置 budget 選項，停止 models 分頁列垂直捲動，並將 chips-combobox popup 錨定到欄位 - [PR #36960](https://github.com/BerriAI/litellm/pull/36960), [PR #37010](https://github.com/BerriAI/litellm/pull/37010), [PR #36993](https://github.com/BerriAI/litellm/pull/36993), [PR #36995](https://github.com/BerriAI/litellm/pull/36995)
- **儀表板內部：shadcn 遷移**
    - 頁面層級從 antd 和 Tremor 遷移：guardrails-monitor、projects and logs、cost-optimization、cost-tracking、admin-panel、team settings、users dashboard、prompts、models-and-endpoints、guardrails、usage、playground，以及 AI Hub - [PR #34606](https://github.com/BerriAI/litellm/pull/34606), [PR #36629](https://github.com/BerriAI/litellm/pull/36629), [PR #36631](https://github.com/BerriAI/litellm/pull/36631), [PR #36635](https://github.com/BerriAI/litellm/pull/36635), [PR #36641](https://github.com/BerriAI/litellm/pull/36641), [PR #36642](https://github.com/BerriAI/litellm/pull/36642), [PR #36643](https://github.com/BerriAI/litellm/pull/36643), [PR #36648](https://github.com/BerriAI/litellm/pull/36648), [PR #36832](https://github.com/BerriAI/litellm/pull/36832), [PR #36834](https://github.com/BerriAI/litellm/pull/36834), [PR #36838](https://github.com/BerriAI/litellm/pull/36838), [PR #36847](https://github.com/BerriAI/litellm/pull/36847), [PR #36908](https://github.com/BerriAI/litellm/pull/36908)
    - Navbar、log details drawer、settings page 與 bulk user invite、key info 與 permissions 檢視、router settings 與 shared badges、MCP permission panels、model hub 與 model select、shared dropdowns 與 selectors、root-level dashboard components、cost tracking components、shared `common_components`，以及其餘十個小檔案 - [PR #36902](https://github.com/BerriAI/litellm/pull/36902), [PR #36904](https://github.com/BerriAI/litellm/pull/36904), [PR #36936](https://github.com/BerriAI/litellm/pull/36936), [PR #36913](https://github.com/BerriAI/litellm/pull/36913), [PR #36915](https://github.com/BerriAI/litellm/pull/36915), [PR #36964](https://github.com/BerriAI/litellm/pull/36964), [PR #36918](https://github.com/BerriAI/litellm/pull/36918), [PR #36924](https://github.com/BerriAI/litellm/pull/36924), [PR #36927](https://github.com/BerriAI/litellm/pull/36927), [PR #36955](https://github.com/BerriAI/litellm/pull/36955), [PR #36910](https://github.com/BerriAI/litellm/pull/36910), [PR #36966](https://github.com/BerriAI/litellm/pull/36966)
    - Log viewer 內部：TokenFlow 與 JsonViewer、SimpleMessageBlock 與 SimpleToolCallBlock、HistoryTree 與 CollapsibleMessage、TruncatedValue 與 OutputCard、SectionHeader 與 ToolsSection、防護欄與 duration 控制項、search 與 user 控制項、team detail 控制項，以及 policy impact popover - [PR #36735](https://github.com/BerriAI/litellm/pull/36735), [PR #36737](https://github.com/BerriAI/litellm/pull/36737), [PR #36738](https://github.com/BerriAI/litellm/pull/36738), [PR #36739](https://github.com/BerriAI/litellm/pull/36739), [PR #36793](https://github.com/BerriAI/litellm/pull/36793), [PR #36693](https://github.com/BerriAI/litellm/pull/36693), [PR #36694](https://github.com/BerriAI/litellm/pull/36694), [PR #36695](https://github.com/BerriAI/litellm/pull/36695), [PR #36653](https://github.com/BerriAI/litellm/pull/36653)
    - 將 usage、guardrails content 與 guardrails monitor 表格移至共用 DataTable，使不合法的 DataTable prop 組合無法表示，將 access group 建立 modal 移轉至 RHF 與 zod，將 badge 與 skeleton 重新同步到 base-vega 樣式，並改為在本地宣告 `DateRangePickerValue` 而非從 Tremor 匯入 - [PR #36707](https://github.com/BerriAI/litellm/pull/36707), [PR #36708](https://github.com/BerriAI/litellm/pull/36708), [PR #36709](https://github.com/BerriAI/litellm/pull/36709), [PR #36470](https://github.com/BerriAI/litellm/pull/36470), [PR #37033](https://github.com/BerriAI/litellm/pull/37033), [PR #36991](https://github.com/BerriAI/litellm/pull/36991), [PR #36962](https://github.com/BerriAI/litellm/pull/36962)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 從 StandardLoggingPayload 來源取得發出的 metadata blob，讓團隊自己的 Langfuse 憑證不再出現在該團隊自己的 trace 中 - [PR #36744](https://github.com/BerriAI/litellm/pull/36744)
    - 將 trace steering keys 限制為真正的 Langfuse trace 欄位，並強制轉型從標頭來源取得的 mask 與 trace-update steering 值 - [PR #36862](https://github.com/BerriAI/litellm/pull/36862), [PR #36740](https://github.com/BerriAI/litellm/pull/36740)
    - 在 Langfuse v4 讀取的 keys 上發出 OTel trace 版本與發行版 - [PR #36702](https://github.com/BerriAI/litellm/pull/36702)
- **[Arize](../../docs/proxy/logging#arize-ai)**
    - 追蹤 MCP 工具呼叫，而不是在 `CallToolResult` 上當機 - [PR #36453](https://github.com/BerriAI/litellm/pull/36453)
- **[Slack 警示](../../docs/proxy/alerting)**
    - 對跨 pod 排程的 Slack spend reports 進行去重 - [PR #36489](https://github.com/BerriAI/litellm/pull/36489)
- **一般**
    - 透過 contextvars 選擇性啟用 `session_id` 與 `trace_id` 在 JSON log records 上的關聯 - [PR #34418](https://github.com/BerriAI/litellm/pull/34418)
    - 當 `callbacks` 項目不可 dispatch 時使設定載入失敗，而不是帶著默默無作用的 hook 啟動 - [PR #36858](https://github.com/BerriAI/litellm/pull/36858)
    - 在 spend logs 中記錄因無法解析的 body 而被拒絕的請求 - [PR #36673](https://github.com/BerriAI/litellm/pull/36673)

### 防護欄 {#guardrails}

- **[Palo Alto Networks Prisma AIRS](../../docs/proxy/guardrails/panw_prisma_airs)**
    - 在被封鎖的請求上回傳完整掃描回應，在允許的請求上顯示 `scan_id`，並將工具呼叫引數掃描為純文字而非工具事件 - [PR #37036](https://github.com/BerriAI/litellm/pull/37036), [PR #37037](https://github.com/BerriAI/litellm/pull/37037), [PR #37038](https://github.com/BerriAI/litellm/pull/37038)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 當沒有可掃描的內容時略過 `ApplyGuardrail`，讓僅含工具的回合不再導致整個請求失敗 - [PR #36441](https://github.com/BerriAI/litellm/pull/36441)
    - 在 post-call hook 中掃描並重新發出原始 Anthropic SSE streams - [PR #36598](https://github.com/BerriAI/litellm/pull/36598)
- **一般**
    - 將 guardrail 載入失敗按列隔離，避免一筆壞資料把其他資料一併帶走 - [PR #36432](https://github.com/BerriAI/litellm/pull/36432)
    - 回報被 guardrail 封鎖的 `/v1/responses` 回覆的真實 token 使用量 - [PR #36907](https://github.com/BerriAI/litellm/pull/36907)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預留輸送量 (PTU)**
    - 在模型部署上設定 `ptu_count`、`cost_per_ptu_per_hour` 與有效視窗 - [PR #35341](https://github.com/BerriAI/litellm/pull/35341)
    - 在每日彙總中依啟用小時寫入每個模型的 PTU flat cost，並在每日活動讀取路徑上顯示 - [PR #35343](https://github.com/BerriAI/litellm/pull/35343), [PR #35391](https://github.com/BerriAI/litellm/pull/35391)
    - 透過選擇加入的 env var 來控管 PTU flat-cost 歸因 - [PR #36138](https://github.com/BerriAI/litellm/pull/36138)
    - 在 PTU 設定的部署上停止按 token 計費，並停止對 grounded search 計費 - [PR #36829](https://github.com/BerriAI/litellm/pull/36829), [PR #37043](https://github.com/BerriAI/litellm/pull/37043)
- **速率限制**
    - 為每個 key、team 與 model 宣告預期輸出 token，讓 TPM reservation 不再使用單一固定下限 - [PR #36143](https://github.com/BerriAI/litellm/pull/36143)
    - 為 TPM 限制保留較大的宣告輸出預算 - [PR #37001](https://github.com/BerriAI/litellm/pull/37001)
- **成本追蹤**
    - 在總計旁邊發出六個每個元件的 `x-litellm-response-cost-*` 標頭 - [PR #36965](https://github.com/BerriAI/litellm/pull/36965)
    - 追蹤 OpenAI 與 Azure web search tool 的每次呼叫成本，並從 `server_side_tool_usage_details` 計費 xAI web search - [PR #35286](https://github.com/BerriAI/litellm/pull/35286), [PR #30817](https://github.com/BerriAI/litellm/pull/30817)
    - 在分級定價中支援 cache creation cost，且採全有或全無 - [PR #36720](https://github.com/BerriAI/litellm/pull/36720)
    - 將 prompt-caching 節省額與 cache-write premium 互相抵銷 - [PR #36452](https://github.com/BerriAI/litellm/pull/36452)
    - 將 Anthropic 區域地理加成套用到快取 token，並在 iterations 路徑上彙總 5m 與 1h 的 cache-write 分攤 - [PR #34850](https://github.com/BerriAI/litellm/pull/34850), [PR #34860](https://github.com/BerriAI/litellm/pull/34860)
    - 以 image rate 計價 dict-shaped image input token 詳細資料 - [PR #33490](https://github.com/BerriAI/litellm/pull/33490)
    - 停止 zero output rate 將 transcription cost 歸零 - [PR #36914](https://github.com/BerriAI/litellm/pull/36914)
    - 在 `/cost/estimate` 中轉送已解析的提供者與部署定價 - [PR #35880](https://github.com/BerriAI/litellm/pull/35880)
    - 永遠不要為 strategy-router alias 定價，並停止 `get_router_model_info` 清除快取定價 - [PR #36691](https://github.com/BerriAI/litellm/pull/36691), [PR #36985](https://github.com/BerriAI/litellm/pull/36985)
- **直通與批次處理**
    - 追蹤 OpenAI passthrough `/v1/embeddings` 的支出，在 OpenAI passthrough streams 上注入串流使用量成本，並追蹤串流化 passthrough Responses 成本 - [PR #36660](https://github.com/BerriAI/litellm/pull/36660), [PR #36503](https://github.com/BerriAI/litellm/pull/36503), [PR #36529](https://github.com/BerriAI/litellm/pull/36529)
    - 將預算保留帶入 passthrough request metadata，讓成功的請求不再將 reservation 洩漏到 Redis 並觸發錯誤的 `BudgetExceededError` - [PR #36592](https://github.com/BerriAI/litellm/pull/36592)
    - 將 Vertex 與 Anthropic passthrough batch 成本歸因到建立該批次的 key、team 與 tags - [PR #34456](https://github.com/BerriAI/litellm/pull/34456), [PR #36468](https://github.com/BerriAI/litellm/pull/36468)
    - 僅一次記錄 managed batch 的成本，為 batch 的成本列賦予自己的主鍵，將沒有 output file 的終止 batch 標記為已處理，並停止無法計費的 batches 使 cost poll 頁面發生飢餓 - [PR #37050](https://github.com/BerriAI/litellm/pull/37050), [PR #36876](https://github.com/BerriAI/litellm/pull/36876), [PR #35360](https://github.com/BerriAI/litellm/pull/35360), [PR #36714](https://github.com/BerriAI/litellm/pull/36714)
    - 在 managed object 寫入前移除 passthrough batch tags 中的 NUL 位元組 - [PR #36688](https://github.com/BerriAI/litellm/pull/36688)
- **支出記錄與預算**
    - 當 DB commit 失敗時重新排入 Redis spend buffer transactions、在傳輸錯誤時重新排入 spend logs，並停止在 flush 被取消時遺失列 - [PR #33881](https://github.com/BerriAI/litellm/pull/33881), [PR #36716](https://github.com/BerriAI/litellm/pull/36716), [PR #34826](https://github.com/BerriAI/litellm/pull/34826)
    - 在重設預算工作中，使用分塊重設掃描的原子式預算級聯 - [PR #36287](https://github.com/BerriAI/litellm/pull/36287)
    - 在 team 與 key 建立時接受明確的 null `budget_duration`，並提供可清除的 UI 下拉選單 - [PR #36699](https://github.com/BerriAI/litellm/pull/36699)
    - 在建立 spend views 時容許並行建立者 - [PR #36824](https://github.com/BerriAI/litellm/pull/36824)

## MCP 閘道 {#mcp-gateway}

- 將閘道 session bearer 限定於 RFC 8707 resource - [PR #35045](https://github.com/BerriAI/litellm/pull/35045)
- 直接在 bare `/mcp` 上提供整合 MCP endpoint，而不是 307 redirect - [PR #34845](https://github.com/BerriAI/litellm/pull/34845)
- 透過 DB-backed drafts 從任何 worker 解析 admin OAuth sessions，並在管理讀取中保留管理者輸入的 OAuth endpoints - [PR #36844](https://github.com/BerriAI/litellm/pull/36844), [PR #36888](https://github.com/BerriAI/litellm/pull/36888)
- 以 session 讀取逾時限制 MCP client 請求 - [PR #36675](https://github.com/BerriAI/litellm/pull/36675)
- 將 client HTTP headers 暴露給 logging callbacks 與 hooks - [PR #36724](https://github.com/BerriAI/litellm/pull/36724)
- 在已記錄的 metadata 中移除呼叫端 host 與已設定的 upstream headers - [PR #36901](https://github.com/BerriAI/litellm/pull/36901)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由器與自動路由器**
    - 讓路由群組可作為虛擬模型呼叫，並將其列於 `/v1/models` 中 - [PR #36519](https://github.com/BerriAI/litellm/pull/36519)
    - 針對自動路由器進行採用前的影子評估，使用盲測配對評審，並擴充以取樣 `/v1/messages` 與 `/v1/responses` 流量，以及執行反向方向作業 - [PR #36587](https://github.com/BerriAI/litellm/pull/36587), [PR #36830](https://github.com/BerriAI/litellm/pull/36830), [PR #36865](https://github.com/BerriAI/litellm/pull/36865)
    - 以實作範例校準複雜度分類器的評分標準，每個路由器可選，並停止對程式碼與技術複雜度的系統提示文字進行評分 - [PR #36578](https://github.com/BerriAI/litellm/pull/36578), [PR #36721](https://github.com/BerriAI/litellm/pull/36721)
    - 新增必須 AND（`&`）標記前綴與 `allow_fail_open` 標記，允許未標記請求在共用模型名稱上繞過已標記的前路由策略，並停止將路由器選擇用的請求標記重新套用至已路由層級的部署 - [PR #36193](https://github.com/BerriAI/litellm/pull/36193), [PR #36627](https://github.com/BerriAI/litellm/pull/36627), [PR #36628](https://github.com/BerriAI/litellm/pull/36628)
    - 將自動路由器別名參數從標記條目而非第一個同名部署向前傳遞 - [PR #36626](https://github.com/BerriAI/litellm/pull/36626)
    - 每個部署的 `allowed_fails_policy` 與 `cooldown_time` 覆寫、失敗備援部署的冷卻時間，以及 Redis 回填後修正的冷卻時間 TTL - [PR #34416](https://github.com/BerriAI/litellm/pull/34416), [PR #35104](https://github.com/BerriAI/litellm/pull/35104)
    - 將批次備援保留在擁有該檔案的模型群組內 - [PR #36181](https://github.com/BerriAI/litellm/pull/36181)
    - 當部署的憑證與其提供者不一致時發出警告 - [PR #36486](https://github.com/BerriAI/litellm/pull/36486)
- **串流與連線**
    - 全域 `litellm_settings.sse_keepalive_ping_interval_seconds`，疊加在每個部署的 `keepalive_seconds` SSE 心跳之上，讓安靜的串流不再因 ingress 閒置逾時而被終止 - [PR #36154](https://github.com/BerriAI/litellm/pull/36154), [PR #34423](https://github.com/BerriAI/litellm/pull/34423)
    - 以用戶端支援重構 HTTP handler 初始化 - [PR #30952](https://github.com/BerriAI/litellm/pull/30952)
    - 快取 Anthropic `/v1/messages` 回應，包括串流 - [PR #34581](https://github.com/BerriAI/litellm/pull/34581)
    - 在推導 Redis `from_url` kwargs allowlist 時，解包已裝飾的 `__init__`s - [PR #36654](https://github.com/BerriAI/litellm/pull/36654)
- **資料庫與背景作業**
    - 以單一 upsert 陳述式寫入每個每日支出批次 - [PR #36448](https://github.com/BerriAI/litellm/pull/36448)
    - 限制 spend-logs 保留清理範圍，使單次執行不會使資料庫飽和 - [PR #36594](https://github.com/BerriAI/litellm/pull/36594)
    - 在各個作業與 pod 之間錯開排程背景作業 - [PR #36589](https://github.com/BerriAI/litellm/pull/36589)
    - 在 Postgres 快取計畫錯誤時強制 Prisma 重新建立 - [PR #36428](https://github.com/BerriAI/litellm/pull/36428)
    - 序列化模型協調流程，讓並行模型寫入不再互相驅逐 - [PR #36687](https://github.com/BerriAI/litellm/pull/36687)
    - 當未附加資料庫時，略過依賴 prisma 的 hooks - [PR #36273](https://github.com/BerriAI/litellm/pull/36273)
- **部署**
    - 讓 AWS Terraform 模組中的 VPC、Aurora 與 Redis 成為選用項目，如此鎖定的帳戶可重用自己的網路、Postgres 與 Redis - [PR #36676](https://github.com/BerriAI/litellm/pull/36676)
    - 在元件化 Helm chart 中新增 `startupProbe` 與 `hpa.behavior` 調整項 - [PR #36382](https://github.com/BerriAI/litellm/pull/36382)

## 文件更新 {#documentation-updates}

- 將 Terraform provider 發佈描述為自動化 - [PR #36467](https://github.com/BerriAI/litellm/pull/36467)
- 在錯誤回報中要求使用者流程與 live-proxy 證明，並在功能請求中要求使用者流程加上卡住狀態證明 - [PR #36498](https://github.com/BerriAI/litellm/pull/36498), [PR #36500](https://github.com/BerriAI/litellm/pull/36500)
- 在修復證明區段中僅將最新執行顯示為前/後，並包含巢狀案例 - [PR #37063](https://github.com/BerriAI/litellm/pull/37063)
- 將 Changes PR 範本區段替換為 Caveats - [PR #36423](https://github.com/BerriAI/litellm/pull/36423)
- 以明確的 any-of 例外重寫 CLAUDE.md 註解規則，要求每個 TypedDict 欄位都加上 `ReadOnly`，告知代理程式讓重量級閘道排隊等候機器層級槽位，並從 PR 範本路徑中移除 `@` 前綴 - [PR #36301](https://github.com/BerriAI/litellm/pull/36301), [PR #36421](https://github.com/BerriAI/litellm/pull/36421), [PR #37005](https://github.com/BerriAI/litellm/pull/37005), [PR #37057](https://github.com/BerriAI/litellm/pull/37057), [PR #36726](https://github.com/BerriAI/litellm/pull/36726)

### 依擁有權區域彙總 PR {#pr-roll-up-by-ownership-area}

依擁有權區域分類的 PR（總計：277）

- UI：75
- 模型與提供者：39
- 支出 / 預算 / 費率限制：37
- 其他（CI / chore / tests / build / version bumps）：36
- 效能：27
- 驗證與管理：16
- LLM API 端點：14
- 文件：10
- 記錄：9
- 防護欄：7
- MCP：7

## 端到端測試 {#end-to-end-testing}

我們正大力投資端到端測試，以減少回歸並讓 LiteLLM 在每次發佈時都更穩定。每個版本都會經過一套即時測試套件，該套件會針對真實已部署的 proxy 執行，並呼叫真實的提供者端點，而非 mock，因此我們驗證的行為就是您在正式環境中得到的行為。

這個期間新增了 18 個僅供測試的 pull request，其中 10 個碰到了即時 e2e 套件。供應商 API 覆蓋已加強，因此提供者拒絕、斷線、伺服器錯誤與缺少憑證會直接失敗，而不是通過；新的測試格涵蓋 Google-native `generateContent` framing、Prometheus queue time、Bedrock 上的 Anthropic `web_search` server tool，以及模型 allow-list 的正向案例，而不只是其拒絕情境。Admin UI e2e 測試不再只停留在成功提示：現在每個會修改狀態的流程都會斷言送出的請求本文，並從 API 讀回資源，且新增了 Logs、Playground、Usage，以及 MCP 編輯與刪除的覆蓋。三個用於解決 passthrough headers 與每模型預算開口問題的重現器已以略過狀態檢入，並在每個略過原因中標註產品缺口，因此當修復到位後，移除略過就會成為回歸測試。在維護方面，OTel 斷言現在鎖定的是提供串流的嘗試，而不是 span 計數；live Bedrock 測試已改指向已退役的 Claude 3 Sonnet；而導致 UI 套件每次執行都失敗的過時 antd 選擇器，也已改指向遷移後的儀表板實際渲染內容。

## 新貢獻者 {#new-contributors}

- @Praveen11558 在 [PR #30952](https://github.com/BerriAI/litellm/pull/30952) 做出了他們的首次貢獻
- @geraint0923 在 [PR #30817](https://github.com/BerriAI/litellm/pull/30817) 做出了他們的首次貢獻
- @dcadenas 在 [PR #32536](https://github.com/BerriAI/litellm/pull/32536) 做出了他們的首次貢獻
- @anxkhn 在 [PR #32813](https://github.com/BerriAI/litellm/pull/32813) 做出了他們的首次貢獻
- @kr0k 在 [PR #33196](https://github.com/BerriAI/litellm/pull/33196) 做出了他們的首次貢獻
- @vairodp 在 [PR #33490](https://github.com/BerriAI/litellm/pull/33490) 做出了他們的首次貢獻
- @atomic 在 [PR #34177](https://github.com/BerriAI/litellm/pull/34177) 做出了他們的首次貢獻
- @heathriel 在 [PR #34257](https://github.com/BerriAI/litellm/pull/34257) 做出了他們的首次貢獻
- @eugene-yao-zocdoc 在 [PR #34290](https://github.com/BerriAI/litellm/pull/34290) 做出了他們的首次貢獻
- @alexshtf 在 [PR #35669](https://github.com/BerriAI/litellm/pull/35669) 做出了他們的首次貢獻
- @HuanQian571 在 [PR #35773](https://github.com/BerriAI/litellm/pull/35773) 做出了他們的首次貢獻
- @milesadkins 在 [PR #35969](https://github.com/BerriAI/litellm/pull/35969) 做出了他們的首次貢獻
- @daleselaji-dev 在 [PR #36160](https://github.com/BerriAI/litellm/pull/36160) 做出了他們的首次貢獻
- @fancybear-dev 在 [PR #36196](https://github.com/BerriAI/litellm/pull/36196) 做出了他們的首次貢獻
- @ilchemla 在 [PR #36347](https://github.com/BerriAI/litellm/pull/36347) 做出了他們的首次貢獻
- @Louis-Vauterin 在 [PR #36382](https://github.com/BerriAI/litellm/pull/36382) 做出了他們的首次貢獻
- @william-xue 在 [PR #36529](https://github.com/BerriAI/litellm/pull/36529) 做出了他們的首次貢獻
- @lostmartian 在 [PR #36660](https://github.com/BerriAI/litellm/pull/36660) 做出了他們的首次貢獻
- @FahimaGold 在 [PR #36705](https://github.com/BerriAI/litellm/pull/36705) 做出了他們的首次貢獻
- @guptaishaan 在 [PR #36907](https://github.com/BerriAI/litellm/pull/36907) 做出了他們的首次貢獻
- @pokepoke81 在 [PR #36943](https://github.com/BerriAI/litellm/pull/36943) 做出了他們的首次貢獻
- @erensh27 在 [PR #36965](https://github.com/BerriAI/litellm/pull/36965) 做出了他們的首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.97.0...v1.98.0
