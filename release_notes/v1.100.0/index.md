---
title: "v1.100.0 - 存取群組預算、Together AI 同步與自訂路由器層級"
slug: "v1-100-0"
date: 2026-09-06T00:00:00
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
docker.litellm.ai/berriai/litellm:1.100.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.100.0
```

</TabItem>
</Tabs>

:::note

此版本的 PyPI 和 Docker 成品是從不同的 SHA 建置而成，但預期功能上相同。PyPI 是從 [`10631eb`](https://github.com/BerriAI/litellm/commit/10631eb834c7802aa61611e807474170b8a4d425) 建置，Docker 則是從 [`e4f2526`](https://github.com/BerriAI/litellm/commit/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4) 建置。

:::

:::danger[重大變更]

**附加到團隊、組織或內部使用者的 MCP 工具集現在會被強制套用。** 先前附加在這些層級的工具集會被忽略：授權伺服器上的每個工具都仍可呼叫，而一個無作用的團隊工具集會讓整份組織伺服器清單作為替代。現在工具集會在所有層級將 `tools/list` 和 `tools/call` 限制為其明確列出的工具與伺服器。仰賴 fail-open 行為的團隊將無法存取其工具集未列出的工具；擴充工具集即可恢復存取。請參閱 [PR #38488](https://github.com/BerriAI/litellm/pull/38488)。

**`GET /spend/logs` 上限為最近的 10,000 筆資料列。** 該端點過去會將整個 `LiteLLM_SpendLogs` 資料表讀入記憶體，在大型資料表上可能會讓 worker 停住。觸及上限的回應會帶有 `x-litellm-spend-logs-truncated: true` 標頭；需要更多資料列的呼叫端應改用分頁式的 `GET /spend/logs/v2`。請參閱 [PR #38420](https://github.com/BerriAI/litellm/pull/38420)。

**`prompt_token_calculator` 已自 `litellm.utils` 中刪除。** 這個包裝器重複了 `token_counter`，並且對多數 Claude id 靜默套用了 OpenAI 分詞。`from litellm.utils import prompt_token_calculator` 現在會擲回 `ImportError`；請改用 `litellm.token_counter(model=..., text=...)`。請參閱 [PR #38132](https://github.com/BerriAI/litellm/pull/38132)。

**在 `complexity_router_config` 之外寫入的 complexity-router 設定會被拒絕。** 像是 `tier_boundaries` 這類直接放在 `litellm_params` 底下的設定，過去寫入時會被接受，但路由器從未讀取，之後又會被轉送給提供者，導致每個請求都失敗。`/model/new`、`/model/update` 與 `config.yaml` 啟動時現在會拒絕所有 43 項設定放錯位置的情況，並回報錯誤說明該設定與其應放置的位置。先前若以放錯位置的設定成功啟動的設定檔，必須將其移到 `complexity_router_config` 底下。請參閱 [PR #38570](https://github.com/BerriAI/litellm/pull/38570)。

**透過 Router 的 Cerebras 請求現在預設為零個 SDK 層級重試。** `max_retries` 不在 Cerebras 支援的參數中，因此 Router 的 `max_retries=0` 被丟棄，而 SDK 退回其預設值 2。現在它會正常傳遞，與 OpenAI 和 Azure 的行為一致；若要恢復 SDK 重試，請明確傳入 `max_retries`。請參閱 [PR #36601](https://github.com/BerriAI/litellm/pull/36601)。

**`router_model_name` 已從自動路由的回應主體中移除。** 這個欄位只在 v1.99 release candidates 中出現，而常見的 SDK 會去除未知的回應欄位，因此它從未傳到呼叫端。請改用 router 上的 `return_raw_model_name: true`，它會透過標準的 `model` 欄位回報提供服務的模型。請參閱 [PR #38429](https://github.com/BerriAI/litellm/pull/38429)。

**`litellm_settings.autorouter_savings_baseline_model` 已刪除。** 整個 proxy 的基準值扭曲了每個自動路由器的節省數字；現在每個 complexity router 都會從其自身最難配置的層級推導反事實基準。留在 `config.yaml` 中的殘留鍵會被忽略且可移除，而回報的節省數字會改變。請參閱 [PR #38700](https://github.com/BerriAI/litellm/pull/38700)。

:::

## 重點摘要 {#key-highlights}

- **模型存取群組上的共享預算** - 存取群組現在可以攜帶一個在其中每個 deployment 上強制套用的預算，以新的每個視窗支出資料表追蹤，可在強制執行時讀取而無需 rollup 掃描，並可從儀表板設定。預算也新增可選的 rollover，將未使用的額度帶入下一個視窗
- **Together AI 大翻新** - 聊天完成移至專用的 Together 設定，並以 `api.together.ai` 作為預設端點，`reasoning_effort` 依模型類別對應，套用 cache-read 計價，對登錄中未知的模型採工具 fail open，以及一個每日同步工作流程，讓 Together 登錄的定價與即時的 serverless 目錄保持一致
- **操作者定義的 auto-router 層級** - complexity router 的層級集合現在可端到端編輯：由自訂分類器定義的層級、編輯後的層級集合所送出的精確分類器提示詞預覽、先以 heuristic 為主的分類器串接、在儲存前於 `/auto_router/test_routing` 上對真實請求主體進行 dry run，以及將分類器成本計入節省與基準測試
- **MCP gateway 工作階段強化** - RFC 7662 introspection 讓外部 gateway 可驗證 LiteLLM 工作階段權杖，工作階段權杖可使用 RS256 以非對稱方式簽署，Anthropic MCP 連接器可透過 API 與管理員 UI 批次匯入，而附加到團隊、組織與使用者的工具集會被強制套用
- **242 個新模型** - Gemini 與 Vertex 對 `gemini-3.5-transcribe` 和 `transcribe-live` 的 day-0 支援，xAI `grok-4.20` 系列與 `grok-imagine` 圖像模型，涵蓋 Voxtral audio、Ministral、OCR 3 與 4，以及 Code 和 Vibe CLI 系列的 24 個 Mistral 項目，RunwayML `gen4.5`、`veo3.1` 與 Seedance 2 系列，以及 Grounding with Bing Search 作為新的搜尋提供者

## 收錄於 v1.100.0-rc.1 截斷之後 {#included-after-the-v11000-rc1-cut}

這個穩定版也包含在 rc.1 截斷之後落入 release 線上的那一項變更：

- **Docker**
    - 將 wolfi-base 升級以支援 glibc 2.44，並將映像建置中的 apk python 鎖定為 3.13，因此在 Wolfi 將其 python 套件往前推進後，映像得以再次建置 - [PR #39992](https://github.com/BerriAI/litellm/pull/39992)（[PR #38917](https://github.com/BerriAI/litellm/pull/38917) 與 [PR #38973](https://github.com/BerriAI/litellm/pull/38973) 的 cherry-pick）

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（1 個新提供者） {#new-providers-1-new-provider}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [Bing Grounding](../../docs/search/bing_grounding) | `/search` | Grounding with Bing Search 註冊為搜尋提供者，並在 cost map 中按查詢計價 |

### 新增 LLM API 端點（3 個新端點） {#new-llm-api-endpoints-3-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| --- | --- | --- | --- |
| `/public/v1/model_hub` | GET | 具分頁、可篩選的 proxy 所公開模型清單 | [AI Hub](../../docs/proxy/ai_hub) |
| `/v1/mcp/server/import` | POST | 將 Anthropic MCP 連接器批次匯入為 LiteLLM MCP 伺服器 | [MCP Gateway](../../docs/mcp) |
| `/introspect` | POST | MCP gateway 工作階段權杖的 RFC 7662 introspection，使用 LiteLLM 虛擬金鑰進行驗證 | [MCP Gateway](../../docs/mcp) |

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援（242 個新模型） {#new-model-support-242-new-models}

| 提供者 | Model | Context Window | Input ($/1M tokens) | Output ($/1M tokens) | 功能 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `bedrock_mantle/openai.gpt-5.6-cyber` | 272K | $13.75 | $82.50 | 推理、Vision、函式呼叫、工具選擇、提示快取、回應結構描述 |
| Google Gemini | `gemini/gemini-3.5-transcribe` | - | $2.00 | $12.00 | 音訊輸入 |
| Google Gemini | `gemini/gemini-3.5-transcribe-live` | - | $3.50 | $21.00 | 音訊輸入 |
| Google Gemini | `gemini/gemini-omni-1.1-flash` | 131K | $1.50 | $9.00 | 推理、Vision、音訊輸入、影片輸入 |
| Google Gemini | `gemini/gemma-4-26b-a4b-it` | 262K | - | - | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Google Gemini | `gemini/gemma-4-31b-it` | 262K | - | - | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Google Gemini | `gemini/nano-banana-pro-preview` | 131K | $2.00 | $12.00 | Vision、提示快取、回應結構描述、網頁搜尋 |
| Google Vertex AI | `gemini-live-2.5-flash-native-audio` | 1.05M | $0.50 | $2.00 | Vision、PDF 輸入、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋、音訊輸入、音訊輸出 |
| Google Vertex AI | `vertex_ai/gemini-3.5-transcribe-live-preview` | - | $3.50 | $21.00 | 音訊輸入 |
| Google Vertex AI | `vertex_ai/gemini-3.5-transcribe-preview` | - | $2.50 | $12.00 | 音訊輸入 |
| Google Vertex AI | `vertex_ai/veo-3.1-lite-generate-001` | 1K | - | - | video_generation |
| Mistral | `mistral/labs-leanstral-1-5-1` | 262K | - | - | 函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/ministral-14b-2512` | 262K | $0.20 | $0.20 | Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/ministral-14b-latest` | 262K | $0.20 | $0.20 | Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/ministral-3b-2512` | 131K | $0.10 | $0.10 | Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/ministral-3b-latest` | 131K | $0.10 | $0.10 | Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-code-agent-latest` | 256K | $0.40 | $2.00 | 函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-code-fim-latest` | 128K | $0.30 | $0.90 | 函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-code-latest` | 128K | $0.30 | $0.90 | 函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-embed-2312` | 8K | $0.10 | - | 嵌入 |
| Mistral | `mistral/mistral-medium-3` | 262K | $1.50 | $7.50 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-medium-3.5` | 262K | $1.50 | $7.50 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-ocr-3` | - | - | - | ocr |
| Mistral | `mistral/mistral-ocr-3-0` | - | - | - | ocr |
| Mistral | `mistral/mistral-ocr-4` | - | - | - | ocr |
| Mistral | `mistral/mistral-vibe-cli-fast` | 262K | $0.15 | $0.60 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-vibe-cli-latest` | 262K | $1.50 | $7.50 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/mistral-vibe-cli-with-tools` | 262K | $1.50 | $7.50 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Mistral | `mistral/voxtral-mini-latest` | - | - | - | 音訊輸入 |
| Mistral | `mistral/voxtral-mini-realtime-2602` | - | - | - | 音訊輸入 |
| Mistral | `mistral/voxtral-mini-realtime-latest` | - | - | - | 音訊輸入 |
| Mistral | `mistral/voxtral-mini-transcribe-realtime-latest` | - | - | - | 音訊輸入 |
| Mistral | `mistral/voxtral-mini-tts-latest` | - | - | - | 音訊輸出 |
| Mistral | `mistral/voxtral-small-2507` | 33K | $0.10 | $0.40 | 函式呼叫、工具選擇、回應結構描述、音訊輸入 |
| Mistral | `mistral/voxtral-small-latest` | 33K | $0.10 | $0.40 | 函式呼叫、工具選擇、回應結構描述、音訊輸入 |
| xAI | `low/1024-x-1024/grok-imagine-image-2.0` | - | - | - | image_generation |
| xAI | `xai/grok-4.20` | 1M | $1.25 | $2.50 | 推理、Vision、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent` | 1M | $1.25 | $2.50 | 推理、Vision、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent-latest` | 1M | $1.25 | $2.50 | 推理、Vision、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-non-reasoning` | 1M | $1.25 | $2.50 | Vision、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-non-reasoning-latest` | 1M | $1.25 | $2.50 | Vision、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-reasoning` | 1M | $1.25 | $2.50 | 推理、Vision、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-4.20-reasoning-latest` | 1M | $1.25 | $2.50 | 推理、Vision、函式呼叫、工具選擇、提示快取、回應結構描述、網頁搜尋 |
| xAI | `xai/grok-imagine-image` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-2.0` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-2026-03-02` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-pro` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-quality` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-quality-20260403` | - | - | - | image_generation |
| xAI | `xai/grok-imagine-image-quality-latest` | - | - | - | image_generation |
| Databricks | `databricks/databricks-claude-fable-5` | 1M | $10.00 | $50.00 | 推理、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-claude-opus-4-7` | 1M | $5.00 | $25.00 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-claude-opus-4-8` | 1M | $5.00 | $25.00 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-claude-opus-5` | 1M | $5.00 | $25.00 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-claude-sonnet-5` | 1M | $3.00 | $15.00 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-glm-5-2` | 1M | $1.40 | $4.4 | 推理、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-glm-5-3-flash` | 1.05M | - | - | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Databricks | `databricks/databricks-kimi-k3` | 1M | $3.00 | $15.00 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v4-pro-0813` | 1.05M | $1.32 | $3.96 | 推理、函式呼叫、工具選擇、回應結構描述 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/glm-5p3` | 1.05M | $1.40 | $4.4 | 推理、函式呼叫、工具選擇、回應結構描述 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/qwen3-embedding-8b` | 41K | $0.10 | - | 嵌入 |
| RunwayML | `runwayml/aleph2` | - | - | - | video_generation |
| RunwayML | `runwayml/gemini_omni_flash` | - | - | - | video_generation |
| RunwayML | `runwayml/gen4.5` | - | - | - | video_generation |
| RunwayML | `runwayml/hailuo3` | - | - | - | video_generation |
| RunwayML | `runwayml/seedance2` | - | - | - | video_generation |
| RunwayML | `runwayml/seedance2_5` | - | - | - | video_generation |
| RunwayML | `runwayml/seedance2_fast` | - | - | - | video_generation |
| RunwayML | `runwayml/seedance2_mini` | - | - | - | video_generation |
| RunwayML | `runwayml/veo3.1` | - | - | - | video_generation |
| RunwayML | `runwayml/veo3.1_fast` | - | - | - | video_generation |
| Moonshot | `moonshot/kimi-k2.7-code` | 262K | $0.95 | $4.00 | 推理、Vision、函式呼叫、工具選擇、提示快取、回應結構描述、影片輸入 |
| DeepSeek | `deepseek-v4-flash-vision-exp` | 1M | $0.44 | $1.32 | 推理、Vision、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、原生串流 |
| DeepSeek | `deepseek/deepseek-v4-flash-vision-exp` | 1M | $0.44 | $1.32 | 推理、Vision、函式呼叫、平行函式呼叫、工具選擇、提示快取、回應結構描述、原生串流 |
| Dashscope | `dashscope/qwen-image-3.0` | - | - | - | image_generation |
| Dashscope | `dashscope/qwen-image-3.0-pro` | - | - | - | image_generation |
| Z.AI | `zai/glm-5.3` | 1M | $1.40 | $4.4 | 推理、函式呼叫、工具選擇、提示快取 |
| Z.AI | `zai/glm-5.3-flash` | 1.05M | $0.15 | $0.50 | 推理、Vision、函式呼叫、工具選擇、提示快取 |
| Tencent | `tencent/minimax-m3` | 1M | $0.30 | $1.20 | 推理、函式呼叫、提示快取、原生串流 |
| Groq | `groq/qwen/qwen3.8-27b` | 131K | $0.80 | $4.00 | 推理、Vision、函式呼叫、工具選擇、回應結構描述 |
| Bing Grounding | `bing_grounding/search` | - | - | - | 搜尋 |

除了該表格之外，242 筆新項目中有 161 筆來自四個 OpenAI 相容目錄的登錄稽核；每筆都依據提供者的即時 API 標示價格與能力：67 筆 DeepInfra 項目（Claude 系列、Gemini 3.x、Qwen 3.5 到 3.8、DeepSeek V3.2 與 V4、Kimi K2.5 到 K3、GLM 4.6 到 5.2、Nemotron 3 等更多），50 筆 Novita 項目（DeepSeek R1 與 V4、MiniMax M2.5 到 M3、GLM 4.7 到 5.3、Kimi、Qwen、Step 3.7 與社群變體），25 筆 Together AI 項目（GLM 5.2 與 5.3、Kimi K2.7 Code 與 K3、DeepSeek V4、MiniMax M3、Qwen 3.5 到 3.8、Nemotron 3 Ultra），以及 19 筆 W&B Inference 項目（DeepSeek V4、Kimi、Qwen、GLM 5.2、Nemotron、Granite 4.1）。

這個視窗也移除了 10 個已退役項目：xAI 的 `grok-2` 系列、`grok-beta`，以及 `grok-vision-beta`（已由 xAI 退役並重新定價），還有 RunwayML 的 `gen3a_turbo` 與 `gen4_aleph`（已由 `gen4.5` 與 `aleph2` 取代）。

對既有項目的維護性更新影響了其中 383 筆。快取定價變動最多：96 筆項目獲得或修正了快取讀取費率，56 筆獲得或修正了快取寫入費率，包括 Gemini `-latest`/preview 別名的快取讀取為輸入的 10%、Vertex flash-lite 上修正的 flex-tier 快取讀取、Azure gpt-5.6 快取寫入費率、Claude 3 Haiku 與 Opus 的 1 小時快取寫入為輸入的 2 倍，以及 Mistral 在其目錄中的快取讀取定價。52 筆項目新增提供者公告的棄用日期，48 筆修正了 `prompt_cache_min_tokens`（Claude Fable 5 降至 512，因此 prompt-cache-affinity 路由會啟用），45 筆 Gemini 與 Vertex 項目新增了新的 `google_maps_grounding_cost_per_query` SKU。Bedrock Mantle 的 GPT-5.6/5.5/5.4 項目提升至強制的 1,050,000 最大輸入 token，且套用高於 272K 的定價級距，37 筆項目新增了 `default_reasoning_effort`，28 筆 Claude 4.6 時代項目新增了 `supports_legacy_thinking`，而 9 筆項目現在明確宣告其精確的 `reasoning_effort_levels`。

#### 功能 {#features}

- **[Together AI](../../docs/providers/togetherai)**
    - 透過標準 HTTP 處理器上的專用 `TogetherAIChatConfig` 路由 Together AI chat completions，讓 Together 專屬的請求參數與回應欄位各就各位，同時維持 `litellm.TogetherAIConfig` 匯入路徑可用 - [PR #38248](https://github.com/BerriAI/litellm/pull/38248)
    - 將 Together AI 端點預設為 canonical `https://api.together.ai/v1` 主機，在 rerank 上像 chat 一樣遵循 `api_base` 與 `TOGETHER_AI_API_BASE`，並在以 `api_base` 傳入時解析兩個 Together 主機 - [PR #38233](https://github.com/BerriAI/litellm/pull/38233)
    - 讓可推理的 Together 模型接受 `reasoning_effort`：模型拒絕的值會收斂到最近的可接受等級，`reasoning_effort: none` 會送出 Together 的關閉推理切換，而 DeepSeek-V4-Pro 會使用其文件記載的 high/max 尺度 - [PR #38263](https://github.com/BerriAI/litellm/pull/38263)
    - 以每日同步保持 Together AI registry 最新：新的腳本會將 registry 項目與 Together 的即時 serverless catalog 與棄用文件進行差異比對、標準化定價（包含 cached-input 費率），並在任何變動時開啟 registry PR；首次自動執行已更新 Qwen3.8-2.4T-A95B 定價與 gpt-oss-20b context - [PR #38257](https://github.com/BerriAI/litellm/pull/38257), [PR #38694](https://github.com/BerriAI/litellm/pull/38694)
    - 新增 `together_ai/zai-org/GLM-5.3-Flash`，採用 Together 的即時定價、prompt caching 費率、1M context window，以及經驗證的能力旗標（tools、JSON schema、reasoning、vision） - [PR #38486](https://github.com/BerriAI/litellm/pull/38486)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 依據區域的 partition 建構每個 AWS 端點與 ARN，因此 China（`aws-cn`）與 GovCloud（`aws-us-gov`）區域可跨 Bedrock、STS role assumption、S3 spend logs 與 Secrets Manager 運作 - [PR #38747](https://github.com/BerriAI/litellm/pull/38747)
- **[Azure](../../docs/providers/azure)**
    - 當未設定 `api-key` 時，使用 Azure AD token 驗證 realtime websocket（及其健康檢查），因此僅有 Entra ID 的部署也能開啟 realtime sessions - [PR #34658](https://github.com/BerriAI/litellm/pull/34658)
- **[Azure AI Foundry](../../docs/providers/azure_ai)**
    - 在每條 Azure AI Foundry 路由（embeddings、rerank、OCR、document intelligence、image generation 與 edits）上支援 Entra ID / OAuth 驗證，依憑證組合與 scope 快取 Entra token providers，並移除悄悄回退到 OpenAI key 的行為 - [PR #35415](https://github.com/BerriAI/litellm/pull/35415)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 `vertex_ai/veo-3.1-lite-generate-001`，提供 720p 與 1080p 的每秒定價，並將 OpenAI 風格的 `size` 對應到 Veo `resolution`，使 1080p 請求回傳 1080p 影片 - [PR #30782](https://github.com/BerriAI/litellm/pull/30782)
- **[Dashscope](../../docs/providers/dashscope)**
    - 支援 `qwen-image-3.0` 與 `qwen-image-3.0-pro` 圖像生成，將 image calls 傳送至 DashScope 的 multimodal generation 端點，並轉送 `n`，使 multi-image 請求回傳每一張圖片 - [PR #38449](https://github.com/BerriAI/litellm/pull/38449)

### 錯誤修正 {#bug-fixes}

- **[Together AI](../../docs/providers/togetherai)**
    - 對於註冊表中缺少的 Together 模型，將 tools 和 `response_format` 原樣傳遞過去，讓 Together 自行驗證，而不是在用戶端產生 400 或在 `drop_params` 下被靜默捨棄；註冊表明確標示不支援的模型則維持原本明確的契約 - [PR #38265](https://github.com/BerriAI/litellm/pull/38265), [PR #38269](https://github.com/BerriAI/litellm/pull/38269)
    - 在 serverless sync 中停止將 Together 的 `context_length` 寫成 `max_output_tokens`，移除憑空捏造的 1M 級輸出上限，這些上限曾讓 otpm 限制拒絕小型請求；GLM-5.2 和 GLM-5.3-Flash 維持其文件記載的 128K 上限 - [PR #38820](https://github.com/BerriAI/litellm/pull/38820)
- **[Anthropic](../../docs/providers/anthropic)**
    - 在 `/v1/messages` 上保留呼叫者對 Claude 4.6 模型的 `thinking.budget_tokens`（新的 `supports_legacy_thinking` 標記會逐字傳遞舊有格式），以便強制執行硬性推理預算；4.7 以上與 Claude 5 系列則維持轉換 - [PR #38108](https://github.com/BerriAI/litellm/pull/38108)
    - 將自適應 `output_config.effort` 層級帶到每個宣告 `reasoning_effort` 的橋接 Claude 目標，並對於兩者都不接受的提供者保留原始 `thinking` 區塊不變 - [PR #38533](https://github.com/BerriAI/litellm/pull/38533), [PR #38592](https://github.com/BerriAI/litellm/pull/38592)
    - 在 `/v1/messages` 上，將從 `reasoning_effort` 對映的 thinking 預算上限設為低於請求的 `max_tokens`，並在連最低預算都無法容納時略過 extended thinking - [PR #38836](https://github.com/BerriAI/litellm/pull/38836)
    - 調和 `output_format` schema 中的列舉值與宣告型別 - [PR #37882](https://github.com/BerriAI/litellm/pull/37882)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 在 Converse 串流中，停止於 `finish_reason` chunk 之後再送出空的 assistant delta；usage 仍會進入記錄和支出追蹤，且 guardrail trace chunks 會保留其形狀 - [PR #36806](https://github.com/BerriAI/litellm/pull/36806)
    - 當 adaptive Claude models 上設定 `reasoning_effort` 時，請求摘要化的 adaptive thinking，讓 `reasoning_content` 能夠帶有內容回傳，並在 Converse 上回報提供者實際的 thinking token 計數 - [PR #37979](https://github.com/BerriAI/litellm/pull/37979)
    - 標準化 Bedrock Mantle 會拒絕的 Codex history item 類型（`agent_message`、`context_compaction`、`local_shell_call`），使多代理程式 Codex 工作階段不再因重播的 history 而失敗 - [PR #38227](https://github.com/BerriAI/litellm/pull/38227)
    - 在 Converse 上將 `reasoning_effort` 對應為 OpenAI GPT-5.x models 的 `reasoning.effort`，並將 gpt-5.6 項目標記為支援 reasoning - [PR #38279](https://github.com/BerriAI/litellm/pull/38279)
- **[Azure](../../docs/providers/azure)**
    - 對 `/openai/v1`、`preview` 和 `latest` api 版本使用 `v1` image 路由，讓 image generation 和 edits 不再在 v1 surface 上出現 404；具日期的 api 版本則維持 deployment 範圍的路徑 - [PR #38285](https://github.com/BerriAI/litellm/pull/38285)
- **[Google Gemini](../../docs/providers/gemini)**
    - 在 Gemini API 與 Vertex AI 上，將 Google Maps grounding 視為獨立 SKU 計費，並具有 `google_maps_grounding_requests` usage 計數器、`google_maps_grounding_cost_per_query` cost key，以及不將 Maps tool-use tokens 計入可計費 prompt tokens - [PR #38418](https://github.com/BerriAI/litellm/pull/38418)
- **[Vertex AI](../../docs/providers/vertex)**
    - 透過將 `ON_DEMAND_FLEX` traffic type 對映為 `flex` service tier，並沿著每字元成本路由傳遞，讓 Vertex AI flex-tier traffic 以 flex rate 計費 - [PR #37724](https://github.com/BerriAI/litellm/pull/37724)
- **[Databricks](../../docs/providers/databricks)**
    - 從 workspace origin 推導 OAuth token URL，讓 service principal (M2M) auth 在 `api_base` 帶有 AI Gateway path 時也能運作 - [PR #35940](https://github.com/BerriAI/litellm/pull/35940)
- **[Moonshot](../../docs/providers/moonshot)**
    - 傳送 Kimi K3 接受的 reasoning effort：當註冊表指出模型會進行 reasoning 時，Moonshot 接受 `reasoning_effort`；而 Together AI 會將已宣告的 `max` 原樣轉送，而不是折疊成 `high` - [PR #38611](https://github.com/BerriAI/litellm/pull/38611)
- **[DeepSeek](../../docs/providers/deepseek)**
    - 將 image content lists 傳遞給 DeepSeek vision models，讓附加的圖片確實送達模型，並註冊 `deepseek-v4-flash-vision-exp`；非 vision 模型、非 user roles，以及 RAG text 則維持既有的折疊為字串行為 - [PR #38397](https://github.com/BerriAI/litellm/pull/38397)
- **[Tencent](../../docs/providers/tencent)**
    - 將 `thinking` 經由 `extra_body` 路由，讓 reasoning 請求不再在到達 Tencent 前就發生 500；將 MiniMax models 的 `thinking.type: enabled` 強制轉為 `adaptive`，並將 `reasoning_effort: none` 對映為停用 thinking - [PR #38100](https://github.com/BerriAI/litellm/pull/38100)
- **[RunwayML](../../docs/providers/runwayml/videos)**
    - 將 text-to-video、image-to-video 和 video-to-video 請求路由到正確的 RunwayML endpoint，回傳帶有真實狀態碼的 Runway errors，輪詢時接受 Runway 的小數進度，並根據 deployment pricing 與更新後的 resolution-tier rates 追蹤 video spend - [PR #38115](https://github.com/BerriAI/litellm/pull/38115)
- **一般**
    - 停止將 `temperature` 和 `top_p` 傳遞給會拒絕它們的 gpt-5.5/5.6 reasoning models；新的 `default_reasoning_effort` map key 會在 chat、Responses 和 `/v1/messages` 中為這些參數加上閘控，且會採用 `drop_params`，而不是洩漏供應商的 400 - [PR #38593](https://github.com/BerriAI/litellm/pull/38593)
    - 在未明確指定 `supports_reasoning` 的註冊表項目上，遵循逐級的 `reasoning_effort` 標記，因此像 `minimal` 和 `xhigh` 這類宣告層級會被傳遞，而不會降級 - [PR #38618](https://github.com/BerriAI/litellm/pull/38618)
    - 在 `/v1/model/info`、`/model_group/info` 和 `litellm.supports_parallel_function_calling()` 中回報 `supports_parallel_function_calling`，方法是將註冊表值複製到 model info 中 - [PR #38692](https://github.com/BerriAI/litellm/pull/38692)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Videos](../../docs/videos)**
    - 為 `hosted_vllm` 新增 OpenAI Videos API，將 creates 以 multipart form data 送出，並把 `extra_params` 等 vLLM-Omni 欄位原樣傳遞到伺服器 - [PR #38148](https://github.com/BerriAI/litellm/pull/38148)
- **[Audio Transcription](../../docs/audio_transcription)**
    - 為 `gemini-3.5-transcribe` 和 `gemini-3.5-transcribe-live` 新增 day-0 支援，包含已註冊的定價、可運作的 realtime sessions，以及從串流音訊長度推估並記錄到 spend logs 的即時使用量 - [PR #38540](https://github.com/BerriAI/litellm/pull/38540)
    - 透過 `/v1/audio/transcriptions` 支援 Vertex AI 上的 `gemini-3.5-transcribe`，預設 location 為 `global`，並為兩個 transcribe models 新增 Vertex pricing - [PR #38740](https://github.com/BerriAI/litellm/pull/38740)
- **[Search](../../docs/search)**
    - 新增 Grounding with Bing Search（`bing_grounding`）作為 search provider，提供於 `/v1/search`、chat web-search interception、SDK 與 Admin UI - [PR #38119](https://github.com/BerriAI/litellm/pull/38119)
- **[Vector Stores](../../docs/completion/knowledgebase)**
    - 對 `/v1/rag/ingest` 強制執行上傳控制：根據 magic bytes 而非用戶端檔名分類檔案，將 PDF 和文字列入允許清單，拒絕壓縮檔、執行檔與過大的檔案，並以預設失敗的 malware scanner 檢查位元組 - [PR #38135](https://github.com/BerriAI/litellm/pull/38135)
- **Interactions API**
    - 新增原生 Vertex AI Interactions API 支援，因此 gemini-omni models 可透過串流、SDK 存取與成本追蹤提供 `/v1beta/interactions`，而不是 generateContent 400 - [PR #38229](https://github.com/BerriAI/litellm/pull/38229)
- **一般**
    - 在 e2e harness 中逐個 chunk 記錄並重播串流中的提供者回應，讓串流 `/v1/messages` 路徑可離線以提供者自己的 SSE frame 邊界完成驗證 - [PR #38136](https://github.com/BerriAI/litellm/pull/38136)

#### 錯誤 {#bugs}

- **[/v1/messages](../../docs/anthropic_unified)**
    - 將上一輪的 thinking blocks 來回傳遞給 OpenAI 系列後端，作為 Responses reasoning items 與 `reasoning_content`；丟棄並自我修復會讓混合提供者工具迴圈因 Anthropic 400 而失敗的空白 thinking blocks，並保留僅含簽章的 thinking blocks，以便已簽章的 reasoning 能在工具輪次之間重播 - [PR #37953](https://github.com/BerriAI/litellm/pull/37953), [PR #38625](https://github.com/BerriAI/litellm/pull/38625), [PR #38809](https://github.com/BerriAI/litellm/pull/38809)
    - 將 `tool_result` 與使用者內容文件 blocks 一併通過 chat 與 responses 橋接層，因此透過 Claude Code 或 Anthropic SDK 附加的 PDF 會送達 Bedrock Converse 和 OpenAI models，而不是消失 - [PR #38251](https://github.com/BerriAI/litellm/pull/38251), [PR #38261](https://github.com/BerriAI/litellm/pull/38261), [PR #38267](https://github.com/BerriAI/litellm/pull/38267)
    - 將部署層級的 provider-native tools（例如 Gemini `googleMaps`）與 OpenAI 格式的 tools 原封不動通過橋接層，並讀取 tool dict 所攜帶的每一個名稱，如此受限 keys 就無法夾帶不允許的 tools 通過 - [PR #38431](https://github.com/BerriAI/litellm/pull/38431)
    - 透過共享的 capability resolver 解析 effort tiers，因此降級後的等級一定是 model map 指出模型可接受的等級 - [PR #38492](https://github.com/BerriAI/litellm/pull/38492)
    - 預設翻譯後的 structured output schemas 為 non-strict，以便 optional properties 在 OpenAI 後端仍可保留，並保留明確的 `strict` values - [PR #38211](https://github.com/BerriAI/litellm/pull/38211)
    - 將帶有 server-fulfilled tools（例如 Headroom retrieval）的串流輪次先緩衝，因此 server-side tool calls 永遠不會送到用戶端，並透過 pings 維持串流存活，只轉送後續答案 - [PR #36245](https://github.com/BerriAI/litellm/pull/36245)
    - 在 MiniMax requests 上附加 `MINIMAX_API_KEY`，而不是要求 Anthropic key，並從對外的 Together AI messages 中移除 litellm 內部 thinking fields，同時保留 `reasoning_content` 以維持保存的 thinking - [PR #38393](https://github.com/BerriAI/litellm/pull/38393), [PR #38275](https://github.com/BerriAI/litellm/pull/38275)
    - 在 Anthropic passthrough 上明確拋出本機缺少憑證的錯誤，而不是將沒有 key 的 requests 轉送到上游，並像 `/v1/chat/completions` 和 `/v1/responses` 已經做到的那樣，乾淨地序列化 guardrail dict-detail 400s - [PR #38240](https://github.com/BerriAI/litellm/pull/38240), [PR #38741](https://github.com/BerriAI/litellm/pull/38741)
- **[Responses API](../../docs/response_api)**
    - 在 bridge 上串接 `previous_response_id` 時保留對話：每個 stream event 都帶有可用的 id，session lookup 會為剛結束的輪次重試，並且會重播 list 形狀的 `input` - [PR #37956](https://github.com/BerriAI/litellm/pull/37956)
    - 透過 Responses API bridge 轉送 `reasoning_effort: "max"`，而不是靜默丟棄 - [PR #38222](https://github.com/BerriAI/litellm/pull/38222)
    - 為 OpenAI 與 Azure model families 中其 validator 會拒絕的 tool schemas，攤平頂層的 `anyOf`/`oneOf`/`allOf`，同時保留 GPT-5 系列 schemas 不變 - [PR #38792](https://github.com/BerriAI/litellm/pull/38792), [PR #38837](https://github.com/BerriAI/litellm/pull/38837)
    - 在 OpenAI passthrough 與 `/openai/v1/responses` 及 `/responses` aliases 下，將串流回應回傳為 owner-scoped managed ids，封住其他 virtual key 可讀取、繼續或刪除串流回應的路徑 - [PR #38320](https://github.com/BerriAI/litellm/pull/38320), [PR #38325](https://github.com/BerriAI/litellm/pull/38325)
- **[Batches](../../docs/batches)**
    - 將 reasoning tokens 與每行 pass/fail counts 彙總到已完成 batch 的 spend log，包含只在 batch 錯誤檔中回報的失敗 - [PR #37208](https://github.com/BerriAI/litellm/pull/37208)
    - 將 managed batch 頁面往後填到那些無法解析的已儲存列之後，讓 SDK pagination 能到達所有剩餘 batch，而不是靜默停止 - [PR #38738](https://github.com/BerriAI/litellm/pull/38738)
    - 將真實 Bedrock record counts 對應到 `request_counts`，並讓已完成 batch 在其輸出實際處理完成前都維持可計費 - [PR #38744](https://github.com/BerriAI/litellm/pull/38744)
    - 讓沒有 `user_id` 或 `team_id` 的 keys 可讀回自己的 batches、files 與 vector stores，而其他所有 keys 仍維持拒絕 - [PR #34849](https://github.com/BerriAI/litellm/pull/34849)
- **[Files](../../docs/files_endpoints)**
    - 在 chat 與 responses requests 中，將 `x-litellm-model` 包裝的 file ids 解碼回原始 provider id，讓 gateway 發出的 ids 不再觸發 provider 404s - [PR #29832](https://github.com/BerriAI/litellm/pull/29832)
    - 在 `async_pre_call_hook` 上執行 `POST /v1/files`，讓自訂 hooks 可在上傳到達 provider 之前檢查或拒絕上傳 - [PR #38607](https://github.com/BerriAI/litellm/pull/38607)
- **[Videos](../../docs/videos)**
    - 解析 form-encoded 與 multipart 的 video edit 與 extension bodies，讓 OpenAI SDK `videos.edit()` calls 不再回傳 500 - [PR #36513](https://github.com/BerriAI/litellm/pull/36513)
    - 將上傳的來源檔案在 `/v1/videos/edits` 上以 multipart 形式轉送給 provider，同時保持 edit-by-id JSON 不變 - [PR #38155](https://github.com/BerriAI/litellm/pull/38155)
    - 對 image 與 video routes 對齊 OpenAI SDK wire format：無檔案的 video creates 以 multipart 發出，image edits 轉送 provider params 與 `extra_body`，而無檔案的 pass-through forms 則維持其 multipart 編碼 - [PR #38104](https://github.com/BerriAI/litellm/pull/38104)
- **[Audio Transcription](../../docs/audio_transcription)**
    - 將 Soniox 的 SRT/VTT cues 對齊到真實語音時序：只保留完整單字、在 silence gaps 與句尾斷開，且 cues 中不含未加時間戳的翻譯 tokens - [PR #34440](https://github.com/BerriAI/litellm/pull/34440)
    - 根據 word timestamps 為 Gemini transcription 合成 SRT/VTT 輸出，對齊 whisper-1 已回傳的字幕文件 - [PR #38561](https://github.com/BerriAI/litellm/pull/38561)
- **[Speech](../../docs/text_to_speech)**
    - 在 TTS completion 橋接層保留呼叫者 metadata 與 completion 計算出的成本，使 Gemini TTS calls 會被追蹤 spend 並以真實價格計費，而不是 $0 - [PR #38414](https://github.com/BerriAI/litellm/pull/38414)
- **[Realtime](../../docs/realtime)**
    - 在 Gemini 與 Vertex native-audio Live sessions 中保留呼叫者要求的 voice，將不支援的 OpenAI stock voice names 降級為預設 voice，而不是終止 session - [PR #38395](https://github.com/BerriAI/litellm/pull/38395)
- **Embeddings**
    - 將所有 Bedrock `cohere.embed` models 路由到 cohere embedding config，並將 `encoding_format: base64` 正規化為 `float`，讓預設的 OpenAI SDK embedding calls 能成功 - [PR #38670](https://github.com/BerriAI/litellm/pull/38670)
    - 在 Bedrock embeddings 與 SageMaker credential loading 中轉送 `aws_external_id`，與 chat 路徑一致，讓需要 ExternalId 的角色能順利 assume - [PR #38727](https://github.com/BerriAI/litellm/pull/38727)
- **[Rerank](../../docs/rerank)**
    - 使用共享的 header-filtered SigV4 helper 為 Bedrock rerank requests 簽章，讓轉送的 client headers 不再破壞 AWS signature - [PR #38093](https://github.com/BerriAI/litellm/pull/38093)
- **直通端點**
    - 將呼叫者的 LiteLLM key 與僅供 proxy 使用的 auth headers 排除在無憑證的 Vertex passthrough requests 之外，同時在 custom auth 下，呼叫者自己的 Google token 仍可通過；沒有真實 Google credential 的 requests 會得到乾淨的 401 - [PR #38114](https://github.com/BerriAI/litellm/pull/38114), [PR #38299](https://github.com/BerriAI/litellm/pull/38299)
    - 為 `bedrock_mantle` 註冊 Bedrock runtime passthrough config，讓 `/bedrock/model/<deployment>/invoke`、streaming 與 Converse 能搭配 spend tracked 運作 - [PR #38231](https://github.com/BerriAI/litellm/pull/38231)
- **A2A**
    - 正規化 agent card `protocolBinding` 的大小寫，並將大小寫錯誤的 interfaces 降級為 0.3 相容 transport，讓 LangGraph Platform agents 重新連線 - [PR #37917](https://github.com/BerriAI/litellm/pull/37917)
- **一般**
    - 依據每個唯一 web search query 來計費 Gemini 3 grounding，符合 Google 文件化的計費規則，而不是對重複查詢重複收費 - [PR #36397](https://github.com/BerriAI/litellm/pull/36397)
    - 以 10 秒 timeout 限制成本計算中的 Hugging Face config.json 取得，避免卡住的連線讓程序掛死 - [PR #38752](https://github.com/BerriAI/litellm/pull/38752)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **自動路由器**
    - 使用自訂的分類器定義階層來編輯 auto-router 階層組：命名二到八個階層、撰寫其分類器定義、為每個階層選取模型，並讓關鍵字規則在重新命名後與已儲存的集合保持逐位元組往返一致 - [PR #38602](https://github.com/BerriAI/litellm/pull/38602), [PR #38603](https://github.com/BerriAI/litellm/pull/38603)
    - 新增 Gemini Family 預設，讓 Lite 預設的中等與複雜階層以其文件所述的 reasoning efforts 執行，並讓 Anthropic Family 預設的 reasoning 階層在 Opus 上以高 thinking 執行 - [PR #38138](https://github.com/BerriAI/litellm/pull/38138), [PR #38482](https://github.com/BerriAI/litellm/pull/38482), [PR #38490](https://github.com/BerriAI/litellm/pull/38490)
    - 在儲存前，先透過後端的 dry-run 端點驗證 auto-router 設定，讓拒絕訊息以後端自身的措辭內嵌顯示，而不是原始的 400 - [PR #38595](https://github.com/BerriAI/litellm/pull/38595)
    - 將成本最佳化節省頁籤的主視覺置中於一個重點數字，並搭配支出軌與四個卡片的每次工作階段指標列 - [PR #38470](https://github.com/BerriAI/litellm/pull/38470)
- **用量與記錄**
    - 在快取頁面依錯誤代碼深入查看失敗的請求，並可在游標停留時查看每個代碼背後的錯誤類別 - [PR #38156](https://github.com/BerriAI/litellm/pull/38156)
    - 依快取命中或未命中篩選 Request Logs，並在詳細檢視中查看每次工作階段的快取計數，以及每個請求計算出的快取鍵 - [PR #38432](https://github.com/BerriAI/litellm/pull/38432), [PR #38442](https://github.com/BerriAI/litellm/pull/38442)
    - 透過新的工具列切換開關，在 Request Logs 中隱藏內部健康檢查列，並由 `exclude_internal_health_checks` 於 `/spend/logs/ui` 與 `/spend/logs/v2` 提供支援 - [PR #38391](https://github.com/BerriAI/litellm/pull/38391)
- **團隊與金鑰**
    - 將 Teams 清單匯出為 CSV，包含預算、模型授權、速率限制與成員預算，涵蓋目前篩選與排序下的所有頁面 - [PR #38436](https://github.com/BerriAI/litellm/pull/38436)
    - 從團隊與金鑰的模型標籤直接跳轉到已篩選至該精確模型群組的 models 頁面 - [PR #38626](https://github.com/BerriAI/litellm/pull/38626)
    - 透過新的 Model Access Group Budgets 分頁設定、編輯與清除模型存取群組的共享預算；`/access_group/list` 現在會回傳每個群組的支出與預算 - [PR #38843](https://github.com/BerriAI/litellm/pull/38843)
    - 以選用的 `general_settings.enforce_fallback_model_access`，授權 router fallback 與呼叫中的金鑰對應，因此鎖定於某個存取群組的金鑰，絕不會被提供其無法直接呼叫的備援模型 - [PR #38572](https://github.com/BerriAI/litellm/pull/38572)
- **模型 + 端點**
    - 透過選用的 `general_settings.model_list_healthy_only`，以及 `/model/info` 上的 `healthy_only` 查詢參數，從 `/models`、`/v1/models/{id}` 和 `/model/info` 隱藏目前不健康的模型 - [PR #38313](https://github.com/BerriAI/litellm/pull/38313)
    - 透過新的分頁式 `GET /public/v1/model_hub` 瀏覽公開 Model Hub，支援排序、搜尋與篩選，且只對可見的區段解析健康狀態 - [PR #38636](https://github.com/BerriAI/litellm/pull/38636)
- **深色模式與主題**
    - 只要點擊太陽／月亮圖示一次，就能在淺色與深色之間切換，並讓 Docs 與 Blog 在頂部列共用一套樣式 - [PR #38601](https://github.com/BerriAI/litellm/pull/38601)
    - 透過將黑色標記平面化為白色，並為深色多色標記鋪底，讓每個提供者標誌在深色模式下都保持可讀，共 36 個標誌 - [PR #38588](https://github.com/BerriAI/litellm/pull/38588)
- **設計系統**
    - 將儀表板移轉至 class-variance-authority 與 CLI 擁有的 shadcn primitives（field、alert、label、textarea、separator、skeleton），使 `shadcn add` 輸出可乾淨編譯，且狀態徽章在所有地方以同一方式呈現 - [PR #38125](https://github.com/BerriAI/litellm/pull/38125), [PR #38126](https://github.com/BerriAI/litellm/pull/38126), [PR #38300](https://github.com/BerriAI/litellm/pull/38300), [PR #38302](https://github.com/BerriAI/litellm/pull/38302)
    - 將每個頁面標頭移至共用的 PageHeader，讓標題、圖示、控制列與邊緣內距在各頁面間保持一致 - [PR #38306](https://github.com/BerriAI/litellm/pull/38306)
    - 以一套具名稱且經 lint 檢查的 z-index 尺度取代手動挑選的 z-index 值，讓彈出視窗總是繪製在對話框之上，並讓開啟的 select 彈出視窗顯示在觸發元件下方，而不是覆蓋其上 - [PR #38282](https://github.com/BerriAI/litellm/pull/38282), [PR #38554](https://github.com/BerriAI/litellm/pull/38554)
- **健康檢查**
    - 使用 `general_settings.background_health_check_model_groups`，將背景健康檢查與健康檢查路由限定於選定的模型群組，並依 deployment 合併共享 Redis 的健康狀態，而不是覆寫它 - [PR #38539](https://github.com/BerriAI/litellm/pull/38539)
- **Terraform**
    - 與社群提供者達成資源與 data source 的對等：新增 13 個資源、31 個新 data source、每個資源上的 `terraform import`，以及 key 的更新／讀取修正 - [PR #38158](https://github.com/BerriAI/litellm/pull/38158)
    - 透過新的 `litellm_jwt_key_mapping` 資源，以宣告式方式管理 JWT claim-to-key 對應 - [PR #38714](https://github.com/BerriAI/litellm/pull/38714)
    - 以 Terraform 對最新 OpenAPI 規格中每個管理端點的涵蓋率作為 CI 閘門，且過時的 allowlist 項目也會使閘門失敗 - [PR #38710](https://github.com/BerriAI/litellm/pull/38710), [PR #38720](https://github.com/BerriAI/litellm/pull/38720)
- **Helm**
    - 透過新的 `ingress.extraPaths` 值，在元件化 chart 中路由額外的 ingress 路徑（passthrough 與自訂端點） - [PR #35700](https://github.com/BerriAI/litellm/pull/35700)

#### 錯誤 {#bugs-1}

- **自動路由器**
    - 當 LLM 分類器沒有模型，或關鍵字規則指定了不存在的層級時，停用提交按鈕，而不是因為原始 400 錯誤而導致儲存失敗 - [PR #38427](https://github.com/BerriAI/litellm/pull/38427)
    - 在每個會執行評分器的路由器形狀上顯示「自訂技術關鍵字」控制項，而不只是單純的啟發式 - [PR #38451](https://github.com/BerriAI/litellm/pull/38451)
    - 將預設集的每層級 `litellm_params`（例如 `reasoning_effort`）從預先填入帶入已儲存的路由器 - [PR #38453](https://github.com/BerriAI/litellm/pull/38453)
    - 將自動路由器表格依最新優先排序，讓剛建立的路由器出現在第一頁 - [PR #38545](https://github.com/BerriAI/litellm/pull/38545)
    - 讓分類器數值欄位可原地編輯，而不是在按下退格鍵時立刻重新填入預設值 - [PR #38803](https://github.com/BerriAI/litellm/pull/38803)
    - 透過一個共用的列清單讀取層級集合，並從測試對話框頁尾移除多餘的 `, ]` - [PR #38408](https://github.com/BerriAI/litellm/pull/38408)
- **用量與記錄**
    - 保留使用者在伺服器搜尋選擇器中輸入的內容：已選取的使用者、團隊或錯誤代碼不再會覆蓋用量、記錄和建立金鑰選擇器中的新查詢、刪除或貼上內容 - [PR #38475](https://github.com/BerriAI/litellm/pull/38475), [PR #38574](https://github.com/BerriAI/litellm/pull/38574), [PR #38830](https://github.com/BerriAI/litellm/pull/38830)
    - 當呼叫者的範圍沒有可篩選內容時，在畫面上保留用量篩選器，並以原因停用 - [PR #38581](https://github.com/BerriAI/litellm/pull/38581)
    - 在收合記錄抽屜的追蹤側欄後，還原其重新開啟控制項 - [PR #38782](https://github.com/BerriAI/litellm/pull/38782)
- **遊樂場**
    - 將 LiteLLM 回應快取重播標示為「Response Cache: Hit」，而不是過時的提供者提示快取徽章，並透過 CORS 公開 `x-litellm-cache-key`，讓儀表板可以讀取 - [PR #37951](https://github.com/BerriAI/litellm/pull/37951)
    - 從 Responses API 的 `output_tokens_details` 讀取推理 token，讓推理徽章可顯示於 `/v1/responses` 呼叫 - [PR #37952](https://github.com/BerriAI/litellm/pull/37952)
    - 讓 `llm_api` 虛擬金鑰讀取 `/model_group/info`，以便遊樂場模型選擇器列出該金鑰的模型 - [PR #38662](https://github.com/BerriAI/litellm/pull/38662)
- **團隊與金鑰**
    - 將團隊和組織的 TPM/RPM 限制為 0 時顯示為 0，而不是 Unlimited，並在未變更的 Edit Member 儲存過程中保留已儲存的 0 - [PR #37916](https://github.com/BerriAI/litellm/pull/37916)
    - 在重新產生後，將金鑰詳細資訊 URL 重新指向已輪替的雜湊，讓頁面可在重新載入後仍能存活，而不是顯示 "Key not found" - [PR #37968](https://github.com/BerriAI/litellm/pull/37968)
    - 當 Redis 拒絕快取清除時，讓 `/key/update`、`/key/block` 和 `/key/regenerate` 仍可成功；失敗時只記錄警告，而不是以誤導性的驗證錯誤顯示 - [PR #38308](https://github.com/BerriAI/litellm/pull/38308)
    - 在團隊的 advisory lock 下序列化 `/team/member_add`、`/team/member_delete` 和 `/team/delete`，修補讓成員參照在刪除後仍殘留，或讓已移除成員復活的競態條件 - [PR #37969](https://github.com/BerriAI/litellm/pull/37969)
- **模型 + 端點**
    - 在新增模型的公開名稱輸入框中打字時保持焦點，並恢復 Public Model Name 工具提示的可讀版面 - [PR #38366](https://github.com/BerriAI/litellm/pull/38366), [PR #37986](https://github.com/BerriAI/litellm/pull/37986)
    - 移除模型與搜尋工具連線測試對話框中 Close 旁邊多餘的 `, ]`，並從產生的 OpenAPI schema 為搜尋工具參數指定型別 - [PR #38852](https://github.com/BerriAI/litellm/pull/38852), [PR #38633](https://github.com/BerriAI/litellm/pull/38633)
    - 將 Virtual Keys 提示連到遷移後的 `/ui/api-keys` 路由，而不是在元件化部署上會回傳 404 的舊版 `/public` 路徑 - [PR #38596](https://github.com/BerriAI/litellm/pull/38596)
    - 對於沒有模型清單的使用者，列出所有非團隊模型，與呼叫當下的驗證一致，並與呼叫金鑰自身的授權取交集 - [PR #38249](https://github.com/BerriAI/litellm/pull/38249)
- **深色模式與主題**
    - 讓遊樂場聊天泡泡和已建立金鑰方塊跟隨深色主題，而不是維持白色 - [PR #37978](https://github.com/BerriAI/litellm/pull/37978), [PR #37985](https://github.com/BerriAI/litellm/pull/37985)
    - 讓程式碼區塊與記錄 JSON 檢視器從目前主題取得色彩，讓負載在深色模式下仍保持可讀 - [PR #38771](https://github.com/BerriAI/litellm/pull/38771), [PR #38778](https://github.com/BerriAI/litellm/pull/38778)
- **防護欄與政策**
    - 將以標籤為基礎的防護欄模式顯示為可讀字串，而不是讓防護欄頁面當機 - [PR #37493](https://github.com/BerriAI/litellm/pull/37493)
    - 將 policy Flow Builder 疊放在彈出層下方，讓其防護欄下拉選單能正確渲染選項 - [PR #38273](https://github.com/BerriAI/litellm/pull/38273)
- **SSO 與驗證**
    - 解析權限最高的 Entra 應用程式角色，而不是聲明中的第一個角色，讓 `proxy_admin` 不再因聲明排序而輸給 `internal_user` - [PR #36728](https://github.com/BerriAI/litellm/pull/36728)
    - 比對像 `/internal-models/*` 這類尾端萬用字元前綴於 JWT `team_allowed_routes` 和 `admin_allowed_routes` 中 - [PR #37756](https://github.com/BerriAI/litellm/pull/37756)
- **SCIM**
    - 將 `user_id` 回傳為 Group `members[].value`，並在 POST /Users 採用時未帶 groups 時保留既有的團隊成員關係，讓 IdP 對帳可在沒有成員異動的情況下收斂 - [PR #38161](https://github.com/BerriAI/litellm/pull/38161), [PR #38166](https://github.com/BerriAI/litellm/pull/38166)
    - 將 `default_team_params`（模型、預算、限制）套用到 SCIM 建立的團隊，而不是授予 All Proxy Models - [PR #38433](https://github.com/BerriAI/litellm/pull/38433)
- **健康檢查**
    - 從 `GET /health` 輸出中移除每個含憑證欄位（`client_secret`、`azure_ad_token`、`aws_session_token`、自訂標頭、Vertex 憑證），封住健康與不健康項目中的外洩路徑 - [PR #37090](https://github.com/BerriAI/litellm/pull/37090)
    - 當 `allow_requests_on_db_unavailable` 開啟時，在資料庫中斷期間仍讓 `/health/readiness` 回傳 200，且整個探測路徑的資料庫檢查都有 4 秒期限 - [PR #37640](https://github.com/BerriAI/litellm/pull/37640)
    - 將 `model_info.health_check_params` 套用到健康探測與 UI 的 Test Connection，因此需要額外參數的部署（例如 Bedrock Pegasus `mediaSource`）可順利通過 - [PR #38101](https://github.com/BerriAI/litellm/pull/38101)
    - 以真實的影像編輯請求探測 `mode: image_edit` 部署，並將提供者的內容審核判定視為健康，而不是故障 - [PR #38291](https://github.com/BerriAI/litellm/pull/38291), [PR #38417](https://github.com/BerriAI/litellm/pull/38417)
    - 使用 `intent=transcription` 探測 Azure GA realtime 的僅轉錄模型，而不是總是回傳 400 的 beta 路徑 - [PR #38390](https://github.com/BerriAI/litellm/pull/38390)
    - 從其後方的模型回報自動路由器健康狀態：略過策略路由器上不可能的直接探測，並標示一個層級、預設或分類器模型無法提供服務的路由器，同時指出故障模型名稱 - [PR #37966](https://github.com/BerriAI/litellm/pull/37966), [PR #38174](https://github.com/BerriAI/litellm/pull/38174)
- **Helm 與部署**
    - 透過將 nginx 寫入錨定在 /tmp 底下，以任意 uid（OpenShift restricted-v2）啟動 UI 映像，這也使得只要一個 /tmp emptyDir 就能啟用 readOnlyRootFilesystem - [PR #37982](https://github.com/BerriAI/litellm/pull/37982)
- **MCP**
    - 將儲存的 OAuth issuer、authorization、token 和 registration URL 從 MCP server 編輯表單傳遞出去，讓 Authorize & Fetch Token 開始真正的 OAuth 流程，而不是回傳 400 - [PR #38154](https://github.com/BerriAI/litellm/pull/38154)
- **一般**
    - 更正技能安裝指令與 marketplace 設定 UX - [PR #33514](https://github.com/BerriAI/litellm/pull/33514)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 透過 OTel v2 目的地上的 `otel_service_name` 中繼資料，依每個金鑰或團隊設定 span `service.name`，並以 `OTEL_SERVICE_NAME` 作為備援 - [PR #38532](https://github.com/BerriAI/litellm/pull/38532)
    - 將以憑證路由的租戶 span 根置於各自的 trace 中，並連回操作端請求 trace，使每個團隊的後端不再渲染缺少父項的片段 - [PR #38847](https://github.com/BerriAI/litellm/pull/38847)
    - 在失敗記錄前，先將 `/v1/messages` 提供者錯誤透過與 `/v1/chat/completions` 相同的例外對應處理，讓錯誤 span 帶上提供者且上游狀態得以保留 - [PR #38310](https://github.com/BerriAI/litellm/pull/38310)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 支援將 `langfuse_environment` 作為每個金鑰的動態回呼參數，並在無效的 `LANGFUSE_TRACING_ENVIRONMENT` 時發出警告並回退至預設環境，而不是讓請求失敗 - [PR #38264](https://github.com/BerriAI/litellm/pull/38264), [PR #38582](https://github.com/BerriAI/litellm/pull/38582)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 新增 `prometheus_deployment_and_latency_caller_identity`，以在部署與延遲指標家族上公開呼叫者的別名、電子郵件，或兩者皆有，包括提早失敗計數器 - [PR #38221](https://github.com/BerriAI/litellm/pull/38221)
- **[New Relic](../../docs/proxy/logging)**
    - 透過 `newrelic` 團隊回呼，將每個團隊的 trace 路由到其各自的 New Relic 帳戶與區域，並以相同憑證發出每個團隊的成本、權杖、請求與延遲指標 - [PR #37603](https://github.com/BerriAI/litellm/pull/37603), [PR #37610](https://github.com/BerriAI/litellm/pull/37610)
- **[LangSmith](../../docs/proxy/logging)**
    - 保持 root-run ids 自洽，使攜帶 session 或 trace 標頭的請求不再讓 LangSmith 拒絕整個 ingest 批次 - [PR #38116](https://github.com/BerriAI/litellm/pull/38116)
- **警示**
    - 新增原生 `ms_teams` 警示目的地，將 Adaptive Cards 張貼到 Teams incoming webhook，可透過 `general_settings.alerting` 或 Admin UI 設定，並在 `/health/services?service=ms_teams` 時發出測試警示 - [PR #38367](https://github.com/BerriAI/litellm/pull/38367)
- **一般**
    - 新增 `async_post_call_failure_deployment_hook`，每次部署重試失敗時觸發一次，並包含備援深度，讓回呼可以計算備援鏈中的每一跳 - [PR #36657](https://github.com/BerriAI/litellm/pull/36657)
    - 停止將已儲存回應讀取計入帳單與記錄為 LLM 請求，因此回讀已儲存回應不會產生額外費用，記錄也不會有任何占位符提示 - [PR #36890](https://github.com/BerriAI/litellm/pull/36890)
    - 將 S3 物件金鑰僅進行一次百分比編碼，使其金鑰包含 `=` 的 s3_v2 記錄上傳不再以 403 失敗 - [PR #38005](https://github.com/BerriAI/litellm/pull/38005)
    - 略過對 proxy 自身預期的 4xx 拒絕進行 traceback 格式化，以降低失敗記錄的 CPU 用量（可用 `litellm.log_client_error_tracebacks` 還原），同時提供者來源的 4xx 錯誤仍保留其 traceback - [PR #38102](https://github.com/BerriAI/litellm/pull/38102), [PR #38296](https://github.com/BerriAI/litellm/pull/38296)
    - 將 `attempted_fallbacks` 與 `original_model_group` 持久化到 spend log 中繼資料，使每一列都顯示是否由備援提供該請求 - [PR #38107](https://github.com/BerriAI/litellm/pull/38107)
    - 將 redaction sentinel 視為空的 tool call 參數，而不是解析它，透過 `previous_response_id` 保持已遮罩的 tool call 可重播，並在 `turn_off_message_logging` 下保留 `null` assistant 內容 - [PR #38169](https://github.com/BerriAI/litellm/pull/38169), [PR #38182](https://github.com/BerriAI/litellm/pull/38182)
    - 在事件迴圈關閉時搶救已出列的記錄任務，使快取命中成功回呼在短生命週期的 SDK 腳本中得以觸發 - [PR #38394](https://github.com/BerriAI/litellm/pull/38394)
    - 只在 TTY 上以 ANSI 色彩將 WARNING 以下的記錄寫入 stdout，且僅在 `JSON_LOGS=true` 時啟用 JSON 記錄，因此以串流為基礎的收集器不再將 INFO 記錄歸類為錯誤 - [PR #38476](https://github.com/BerriAI/litellm/pull/38476)
    - 在回呼酬載中保留缺少的 end user 為 `null`，而非 `""` - [PR #38642](https://github.com/BerriAI/litellm/pull/38642)

### 防護欄 {#guardrails}

- **[Lakera](../../docs/proxy/guardrails/lakera_ai)**
    - 在 Lakera v2 上遵循 `skip_system_message_in_guardrail` 與 `skip_tool_message_in_guardrail`，並新增 `inject_system_message` 建議模式，讓 LLM 衡量旗標而非封鎖 - [PR #34940](https://github.com/BerriAI/litellm/pull/34940)
    - 再次在 monitor 模式下遮罩被標記的 Responses API 主體，使攜帶 `instructions` 的請求不再將未遮罩的 PII 轉送給模型 - [PR #38841](https://github.com/BerriAI/litellm/pull/38841)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 當防護欄假設跨帳戶角色時，轉送 `aws_external_id`，使需要 `sts:ExternalId` 的角色不再以 AccessDenied 失敗 - [PR #38376](https://github.com/BerriAI/litellm/pull/38376)
- **[Azure Prompt Shield](../../docs/proxy/guardrails/azure_content_guardrail)**
    - 追蹤來自 `cost_tier` 與 `price_per_1000_text_records` 的每個請求用量與成本，並在 spend log 項目、防護欄 OTel span 與 logs 頁面上回報，同時不納入 budgets 與 model spend - [PR #38387](https://github.com/BerriAI/litellm/pull/38387)
- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 在 `/analyze` 之前將過大的文字分塊（可透過 `presidio_analyze_chunk_size_bytes` 調整），使大型內容區塊不再因 analyzer 主體上限而失敗 - [PR #38483](https://github.com/BerriAI/litellm/pull/38483)
- **[CrowdStrike AIDR](../../docs/proxy/guardrails/crowdstrike_aidr)**
    - 透過 `fail_on_error: false` 新增 opt-in fail-open，在 schema 驗證前讀取已傳遞的封鎖判定，並在 telemetry 中將 fail-open 執行記錄為 `guardrail_failed_to_respond` - [PR #38568](https://github.com/BerriAI/litellm/pull/38568)
- **一般**
    - 將 `tool_reference` tool 結果完整經由防護欄翻譯往返傳遞，使位於訊息重寫防護欄之後的 Claude Code 會話不再因延遲載入 tool 而以 tool-use 400 失敗 - [PR #38465](https://github.com/BerriAI/litellm/pull/38465)
    - 讓 AI policy suggester 移除其模型拒絕的 sampling 參數，並對沒有 tool calling 的模型回傳清楚的 400 - [PR #38594](https://github.com/BerriAI/litellm/pull/38594)
    - 在原生 `/v1/messages` 串流上記錄 post_call 防護欄掃描，使 spend log 與 Guardrails Monitor 顯示輸出掃描 - [PR #38713](https://github.com/BerriAI/litellm/pull/38713)

### 提示管理 {#prompt-management}

- **一般**
    - 拒絕含糊的 keyed `prompt_data` 加上 `prompt_id` 組合並回傳 400，而不是靜默儲存空白範本；在 prompt hooks 上解析 `.vN` ids，並在建立時回傳真正的 `version`、`environment` 與 `created_by` 值 - [PR #38404](https://github.com/BerriAI/litellm/pull/38404)
    - 在 `/v1/responses` 上於路由前套用提示範本，使提示的模型切換解析為切換後提供者的憑證，並遵循儲存在提示上的 `ignore_prompt_manager_model` - [PR #38407](https://github.com/BerriAI/litellm/pull/38407)
    - 透過週期性的 DB 同步將提示 PATCH 與 DELETE 傳播到每個 worker 與 pod，並在過程中取消註冊過時的回呼 - [PR #38411](https://github.com/BerriAI/litellm/pull/38411), [PR #38434](https://github.com/BerriAI/litellm/pull/38434)

### 密鑰管理員 {#secret-managers}

- **[CyberArk Conjur](../../docs/secret_managers/cyberark)**
    - 透過 Admin UI 使用新的 `/config_overrides/cyberark` 端點設定 CyberArk Conjur，密鑰於靜態儲存時加密並在回應中遮罩，提供連線測試，並在各個 pod 間熱重新載入 - [PR #38445](https://github.com/BerriAI/litellm/pull/38445)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **[預算與速率限制](../../docs/proxy/users)**
    - 在新的 `LiteLLM_BudgetWindowSpend` 資料表中追蹤每個視窗的預算支出，並透過主鍵從中讀取強制執行，因此視窗預算檢查不再在大型資料表上彙總 `LiteLLM_SpendLogs` - [PR #35854](https://github.com/BerriAI/litellm/pull/35854), [PR #35887](https://github.com/BerriAI/litellm/pull/35887)
    - 新增可選加入的 `budget_rollover` 設定，將超出上限的支出帶到下一個視窗，而不是在重設時豁免，並在此輪替變更後讓 proxy 繼續以 Python 3.11 啟動 - [PR #38514](https://github.com/BerriAI/litellm/pull/38514), [PR #38687](https://github.com/BerriAI/litellm/pull/38687)
    - 在模型存取群組上強制共用預算：透過 `PUT /access_group/{group}/budget` 在群組上設定一個預算，而使用該群組的每個金鑰都從同一個資金池支取 - [PR #38784](https://github.com/BerriAI/litellm/pull/38784)
    - 新增需要在新增模型（`enforce_rpm_tpm_on_model_add`）或建立與更新專案（`enforce_project_model_quota`）時具備正值 rpm 和 tpm 限制的可選旗標 - [PR #36518](https://github.com/BerriAI/litellm/pull/36518), [PR #36514](https://github.com/BerriAI/litellm/pull/36514)
    - 解除因預算阻擋而卡住的團隊成員：`/team/member_update` 預算變更現在會立即在每個 pod 上生效，新的 `POST /team/{team_id}/member/{user_id}/reset_spend` 會重設成員的已追蹤支出，而超出預算的錯誤會標明阻擋的實體 - [PR #37971](https://github.com/BerriAI/litellm/pull/37971)
    - 在支出重設時重設金鑰的每個視窗預算計數器（例如每日上限），並將快取失效廣播到每個 pod，因此重設後的金鑰不會再回傳 429 - [PR #38686](https://github.com/BerriAI/litellm/pull/38686)
    - 允許團隊成員的預設預算永不重設；明確的 null `team_member_budget_duration` 現在會清除重設期間，而不是繼承團隊的設定 - [PR #37708](https://github.com/BerriAI/litellm/pull/37708)
    - 在 `/budget/update` 寫入之前先序列化 `model_max_budget`，因此可在既有預算上設定每個模型的上限，而不是回傳 500 - [PR #38430](https://github.com/BerriAI/litellm/pull/38430)
    - 將 `soft_budget`、`tags` 和 `soft_budget_alerting_emails` 新增至 Terraform provider 的 `litellm_team` 資源，讀取時解碼 `/team/info` 包裝層，讓規劃保持同步 - [PR #37918](https://github.com/BerriAI/litellm/pull/37918)
- **提示快取節省**
    - 將提示快取節省同時回報為總快取節省與 LiteLLM 自身注入所賺得的子集合，並停止讓備援分支繼承同層部署的注入額度 - [PR #38134](https://github.com/BerriAI/litellm/pull/38134)
- **成本最佳化**
    - 在 shadow evals 中量測兩邊的成本，包含 routing classifier，讓工作在勝率旁回報自動路由器原本會節省（或花費）多少 - [PR #38631](https://github.com/BerriAI/litellm/pull/38631)
    - 將自動路由器自身的 LLM classifier 費用計入節省數字與基準測試中，讓失敗的路由器設定不再看起來像是省下了錢 - [PR #38835](https://github.com/BerriAI/litellm/pull/38835)
- **[成本計算](../../docs/proxy/cost_tracking)**
    - 追蹤 Google Interactions API 請求的成本、支出與預算，包含串流、在輪詢時精確只計費一次的背景互動，以及每次查詢的 `google_search` grounding - [PR #33310](https://github.com/BerriAI/litellm/pull/33310)
    - 在 `/rerank` 上發出延遲與成本標頭，包含 `LITELLM_DETAILED_TIMING` 細項 - [PR #35419](https://github.com/BerriAI/litellm/pull/35419)
    - 為先前記錄為 $0 的串流流量計價：將含斜線的模型別名解析為真實的成本金鑰，將原生 Gemini 串流按照提供服務的提供者計費，將模型按照實際提供服務的串流路由器（例如 Fireworks FireRouter）計費，並透過 `stream_chunk_builder` 傳遞回應成本與 Anthropic 引用 - [PR #38344](https://github.com/BerriAI/litellm/pull/38344), [PR #36055](https://github.com/BerriAI/litellm/pull/36055), [PR #38656](https://github.com/BerriAI/litellm/pull/38656), [PR #38696](https://github.com/BerriAI/litellm/pull/38696)
    - 正確計費快取 token：解析 Bedrock Converse 的 1h/5m `cacheDetails` cache-write 拆分，讓 Databricks 使用具快取感知的計算器（加入快取費率與五個缺少的 Claude 項目），並將每種模態上限設為快取未涵蓋的部分，讓快取的影像 token 不再被重複計費 - [PR #36762](https://github.com/BerriAI/litellm/pull/36762), [PR #37975](https://github.com/BerriAI/litellm/pull/37975), [PR #37407](https://github.com/BerriAI/litellm/pull/37407)
    - 依 fast mode 調整 Anthropic 快取讀取與寫入成本，並信任回應用量中所服務的 `speed`，使標準服務的請求不再以 fast 費率計費 - [PR #38378](https://github.com/BerriAI/litellm/pull/38378)
    - 對名稱帶有參數大小的模型套用 Together AI 每模型登錄表費率與快取讀取定價，並依部署模型而非用戶端別名來計算 `/v1/messages` 成本標頭 - [PR #38280](https://github.com/BerriAI/litellm/pull/38280), [PR #38691](https://github.com/BerriAI/litellm/pull/38691)
    - 讓成本細項標頭遵守請求的服務等級，並將 Gemini 網頁搜尋成本帶入 `/v1/messages` 細項標頭，讓所有介面保持一致 - [PR #38424](https://github.com/BerriAI/litellm/pull/38424), [PR #38439](https://github.com/BerriAI/litellm/pull/38439)
- **[即時與音訊計費](../../docs/realtime)**
    - 在 Gemini API 與 Vertex 介面上都以音訊費率計費 Gemini Live 原生音訊輸出 token，並為 `vertex_ai/gemini-live-2.5-flash-native-audio` GA 會話定價，且即時成本會回落到 `base_model` - [PR #38457](https://github.com/BerriAI/litellm/pull/38457), [PR #38419](https://github.com/BerriAI/litellm/pull/38419)
    - 當 Gemini transcribe Live 會話在 turn 中途關閉時，對尾端音訊計費，因此掛斷不再讓串流音訊免費 - [PR #38563](https://github.com/BerriAI/litellm/pull/38563)
    - 將 Gemini TTS 音訊輸出費率與原生音訊 Live API 費率修正為 Google 公布的定價 - [PR #38412](https://github.com/BerriAI/litellm/pull/38412)
- **支出記錄**
    - 在支出記錄中儲存 Azure Model Router 實際選取的模型，不論模型群組名稱為何 - [PR #37770](https://github.com/BerriAI/litellm/pull/37770)
    - 針對 router-model `/vllm` 與 `/azure` passthrough 請求歸屬支出並釋放預算保留，因此已預算的金鑰會記錄真實支出而非 $0 與錯誤的 429 - [PR #38111](https://github.com/BerriAI/litellm/pull/38111)
    - 讓結構描述協調在分區的 `LiteLLM_SpendLogs` 資料表上持續可用，並在 `db push` 指向該資料表時快速失敗並提供指引 - [PR #38452](https://github.com/BerriAI/litellm/pull/38452)
    - 在啟動時靜默處理誤導性的 `register_model` 未解析成本警告；只針對具有不完整自訂定價的項目發出警告，並以模型名稱而非雜湊 ID 命名 - [PR #38542](https://github.com/BerriAI/litellm/pull/38542)
- **模型定價對照表**
    - 依實際提供者定價稽核登錄表：新增缺少的 Novita、DeepInfra、W&B、Together、Fireworks、Gemini、Mistral、Groq、Z.AI、Moonshot 與 xAI 模型，重新為已退役的 xAI slug 計價，並填入棄用日期 - [PR #38207](https://github.com/BerriAI/litellm/pull/38207), [PR #38560](https://github.com/BerriAI/litellm/pull/38560), [PR #38804](https://github.com/BerriAI/litellm/pull/38804)
    - 將 Bedrock Mantle GPT-5.6/5.5/5.4 `max_input_tokens` 提高到 Mantle 強制的 1,050,000，新增缺少的 272K 以上定價級距，並使 sol 費率與 AWS 發票一致 - [PR #38225](https://github.com/BerriAI/litellm/pull/38225), [PR #38368](https://github.com/BerriAI/litellm/pull/38368), [PR #38615](https://github.com/BerriAI/litellm/pull/38615)
    - 將 1.1x US 資料主權加成加入 claude-sonnet-4-6 與 mythos 項目，將 Claude 3 Haiku 與 Opus 的 1 小時快取寫入價格設為 2x input，並將 Claude Fable 5 項目的 `prompt_cache_min_tokens` 修正為 512，使 prompt-cache-affinity routing 得以啟用 - [PR #38369](https://github.com/BerriAI/litellm/pull/38369), [PR #38371](https://github.com/BerriAI/litellm/pull/38371), [PR #38405](https://github.com/BerriAI/litellm/pull/38405)
    - 將 Gemini `-latest`/preview 別名的快取讀取按 input 的 10% 計費，修正 Vertex flash-lite flex 的快取讀取定價，並新增 Azure gpt-5.6 快取寫入費率，且將 US/EU priority 修正為 Global 的 1.1x - [PR #38423](https://github.com/BerriAI/litellm/pull/38423), [PR #38422](https://github.com/BerriAI/litellm/pull/38422), [PR #38370](https://github.com/BerriAI/litellm/pull/38370)
    - 新增 21 個缺少的 Together AI serverless 模型，包含定價與功能旗標，並允許地圖項目宣告其精確的 `reasoning_effort_levels`（供 Kimi K3 使用） - [PR #38230](https://github.com/BerriAI/litellm/pull/38230), [PR #38481](https://github.com/BerriAI/litellm/pull/38481)

## MCP Gateway {#mcp-gateway}

- **OAuth 與 session token**
    - 將具名 `WWW-Authenticate` challenge 傳送給 DCR bridge 用戶端啟動或重新啟動 OAuth，僅允許該具名 bridge 的免憑證請求，同時維持完整的 LiteLLM key 驗證 - [PR #37384](https://github.com/BerriAI/litellm/pull/37384)
    - 將 DCR 存取信封的存續時間與提供者的 `expires_in` 對齊（省略時回退為一小時），並避免過早輪替 refresh token，結束長效提供者 token 每小時要求重新連線的提示 - [PR #38271](https://github.com/BerriAI/litellm/pull/38271)
    - 當 OAuth 探索失敗或固定的 issuer 沒有回傳內容時，遵循管理員輸入的 authorize、token 與 register URL，讓 UI 的 Authorize 按鈕重新導向至已儲存的 URL，而不是回傳 400 - [PR #38379](https://github.com/BerriAI/litellm/pull/38379)
    - 在 bridge egress 上將 `Bearer` 的大小寫標準化，讓拒絕小寫 `bearer` 的 upstream 在 token 重新整理後仍可繼續提供工具 - [PR #38398](https://github.com/BerriAI/litellm/pull/38398)
    - 將 gateway 解析出的 OAuth token 透過每台伺服器的 `upstream_token_header` 路由到自訂的 upstream header，讓靜態 `Authorization` 與已鑄造的 token 都能送達 API gateway 後方的伺服器 - [PR #38456](https://github.com/BerriAI/litellm/pull/38456)
    - 在 MCP JWT signer hook 注入標頭時，保留使用者的 upstream OAuth `Authorization` 在 `tools/call` 上，與現有的 `tools/list` 行為一致 - [PR #38555](https://github.com/BerriAI/litellm/pull/38555)
    - 為 gateway session token 新增經過驗證的 RFC 7662 `POST /introspect` endpoint，並可選擇以 `kid` 為基礎，透過 `general_settings.mcp_session_token_signing` 進行輪替的 RS256 簽署，讓外部驗證器永遠不需要簽署 secret - [PR #38726](https://github.com/BerriAI/litellm/pull/38726), [PR #38728](https://github.com/BerriAI/litellm/pull/38728)
- **工具與核准**
    - 在 MCP streamable HTTP 核准中接受原始 `x-litellm-api-key`（可帶或不帶 `Bearer ` 前綴）- [PR #38364](https://github.com/BerriAI/litellm/pull/38364)
    - 新增 `litellm[mcp]` 額外固定 `mcp>=1.28.1,<2.0`，並在缺少 streamable HTTP 支援時明確指出所需的版本下限與修正方式，而不是默默提供零個工具 - [PR #38399](https://github.com/BerriAI/litellm/pull/38399)
    - 透過 `POST /v1/mcp/server/import` 與管理後台中的「從 JSON 匯入」按鈕大量匯入 Anthropic MCP 連接器，並提供每個項目的結果與加密的標頭憑證 - [PR #38444](https://github.com/BerriAI/litellm/pull/38444)
    - 讓 `/key/update` 保留或縮減金鑰現有的 MCP 伺服器授權；只有新增且不屬於團隊內的伺服器會被拒絕 - [PR #38463](https://github.com/BerriAI/litellm/pull/38463)
- **可觀測性**
    - 將 MCP 工具呼叫 span 錨定到 gateway 自身的 trace，並將用戶端傳遞的 context 作為 span link 帶上，讓 IDE 代理程式的工具呼叫在 APM 後端中呈現為一條完整 trace - [PR #38317](https://github.com/BerriAI/litellm/pull/38317)
- **A2A**
    - 使用 `GET /v1/agents?query=...&top_k=...` 與新的 `agent_search` MCP 工具以語意方式搜尋 agent registry；結果僅包含呼叫該功能的 key 可存取的 agents，帶有每個 agent 的 `search_score`，並將 embedding 成本計入呼叫該功能的 key - [PR #38609](https://github.com/BerriAI/litellm/pull/38609)
- **一般**
    - 透過在測試之間清空排隊中的 logging，修正 MCP 資料夾 CI 工作的偶發失敗，並一併修正 PTU rollup、license-check retry 與 pricing test 隔離問題 - [PR #37833](https://github.com/BerriAI/litellm/pull/37833)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由**
    - 在顯式查找時解析隱藏的模型別名，讓別名後方的有序備援仍會觸發，並在前置路由派發前解析 `model_group_alias`，使指向自動路由器的別名可像路由器本身的名稱一樣運作 - [PR #38272](https://github.com/BerriAI/litellm/pull/38272), [PR #38382](https://github.com/BerriAI/litellm/pull/38382)
    - 當 DB 的 router_settings 列持有空的 `fallbacks` 清單時，保留 config.yaml 備援，因此 UI 刪除不再會在每次啟動時清空 yaml 失效接手 - [PR #38406](https://github.com/BerriAI/litellm/pull/38406)
    - 支援 `/v1/messages` 的串流中途備援：可重試的 SSE `event: error` frame 或在內容開始前拋出的串流錯誤（Bedrock）現在會像在 `/chat/completions` 一樣重新進入備援鏈 - [PR #38153](https://github.com/BerriAI/litellm/pull/38153), [PR #38606](https://github.com/BerriAI/litellm/pull/38606)
    - 在部署驗證與 `acompletion` 中，從 `api_base` 解析提供者，因此僅有裸模型加上已知端點時會載入，而不是啟動失敗並回傳「no healthy deployments」 - [PR #38235](https://github.com/BerriAI/litellm/pull/38235)
    - 在 `/model_group/info` 上回報每個群組的 `supported_reasoning_efforts`，並在各部署之間取交集，且將 `max` 經由 chat-to-Responses 橋接傳遞，而不是捨棄它 - [PR #37897](https://github.com/BerriAI/litellm/pull/37897)
    - 在重試與備援 breadcrumbs 抵達支出記錄與記錄回呼之前，清理轉送的 Authorization 標頭與提供者憑證 - [PR #38133](https://github.com/BerriAI/litellm/pull/38133)
    - 在清理 fallback stamp keys 時，保留呼叫端的 metadata dict 不變，並在 proxy 邊界移除用戶端提供的 `attempted_fallbacks` / `original_model_group`，使防護欄成本與狀態維持在支出列上 - [PR #38586](https://github.com/BerriAI/litellm/pull/38586), [PR #38690](https://github.com/BerriAI/litellm/pull/38690)
    - 在 chat 路由上將用戶端 `litellm_metadata` 合併到 `metadata`，使 team 與 body 標籤持續驅動標籤路由，而不是落到預設部署 - [PR #38739](https://github.com/BerriAI/litellm/pull/38739)
    - 在備援時將 batch、file 與 fine-tuning job 操作鎖定到擁有該 id 的模型群組，避免向從未發出該資源的外部提供者詢問 - [PR #38742](https://github.com/BerriAI/litellm/pull/38742)
- **複雜度路由器（自動路由器）**
    - 新增 `classifier_type: heuristic_first`：便宜且自信的本地分數會立即路由，只有模稜兩可的 prompt 才會支付分類器呼叫成本 - [PR #38428](https://github.com/BerriAI/litellm/pull/38428)
    - 以整個區塊的一個預算來約束分類器內容，而不是將每一輪都裁切到 200 個字元，並保留必須裁切之輪次的兩端，使末尾的請求得以保留 - [PR #38141](https://github.com/BerriAI/litellm/pull/38141), [PR #38145](https://github.com/BerriAI/litellm/pull/38145)
    - 將用戶端自己的例行管理 prompt，例如 coding agent 的 conversation-title 呼叫，路由到最便宜的層級，且不需要分類器呼叫 - [PR #38598](https://github.com/BerriAI/litellm/pull/38598)
    - 在 `/auto_router/test_routing` 上接受 `messages`、`system` 與 `tools`，使 dry run 可透過與服務路徑相同的路由重播真實的 agentic 流量 - [PR #38590](https://github.com/BerriAI/litellm/pull/38590)
    - 為自訂層級集合新增編輯 prompt 對話框，會寫入 `classification_prompt`，並從 proxy 預覽組裝後的分類器 prompt - [PR #38605](https://github.com/BerriAI/litellm/pull/38605)
    - 捨棄任一 routed group 中沒有部署可接受的 tier 參數，而不是以 400 使整個 tier 失敗，並讓 tier 固定的 `reasoning_effort` 取代用戶端的 `thinking` 與 `output_config.effort` carrier - [PR #38622](https://github.com/BerriAI/litellm/pull/38622), [PR #38698](https://github.com/BerriAI/litellm/pull/38698)
    - 拒絕同時也提供其評分對象之一的 shadow-eval judge model，並在工作建立時驗證 Anthropic SDK judge 憑證，而不是讓工作在執行途中失敗 - [PR #38589](https://github.com/BerriAI/litellm/pull/38589), [PR #38701](https://github.com/BerriAI/litellm/pull/38701)
    - 在用量選擇器中列出每一個已設定的自動路由器，閒置者顯示為零而不是缺席 - [PR #38129](https://github.com/BerriAI/litellm/pull/38129)
- **快取**
    - 在 redis-py >= 7.2.0 上未經修改地使用上游 `RedisCluster`，使停滯的叢集節點由每個連線的復原吸收，而不是放大成連線風暴 - [PR #38171](https://github.com/BerriAI/litellm/pull/38171)
    - 在所有用戶端路徑（async、健康檢查、Sentinel）上支援 Redis 憑證提供者，且明確的提供者優先於密碼、環境變數與 URL 憑證 - [PR #38094](https://github.com/BerriAI/litellm/pull/38094)
    - 只有當 Redis key 以 `<namespace>:` 開頭時，才將其視為已具名稱空間，因此內部支出緩衝區會獲得前綴，而最小權限 ACL 不再破壞支出追蹤 - [PR #38403](https://github.com/BerriAI/litellm/pull/38403)
    - 在 event-loop 關閉時取消的 async Redis 快取寫入進行重試，使短命的 SDK 腳本在結束前寫入快取項目 - [PR #38385](https://github.com/BerriAI/litellm/pull/38385)
    - Fireworks `x-session-affinity` 標頭只從呼叫端提供的 session id 傳送，而不是每個請求的 trace id，以維持 Fireworks prompt 快取熱度 - [PR #35754](https://github.com/BerriAI/litellm/pull/35754)
    - 讓 cache-control 自動注入可到達由 Responses API `instructions` 建立的 system prompt，使 prompt-caching 折扣可套用於橋接 - [PR #38120](https://github.com/BerriAI/litellm/pull/38120)
- **Proxy 執行階段**
    - 從驗證路徑移除保證命中失敗的查找：每個 project/team-key 請求會少四次浪費的 Redis 讀取，且不再對 litellm-dashboard sentinel team 進行每請求 DB 查詢 - [PR #38073](https://github.com/BerriAI/litellm/pull/38073), [PR #38471](https://github.com/BerriAI/litellm/pull/38471)
    - 以 O(1) 附加的累加器重組 Vertex 與 Anthropic 的串流 SSE JSON 片段，取代每個 chunk 都複製緩衝區、使大型 tool-call 串流呈二次方成長的作法 - [PR #36610](https://github.com/BerriAI/litellm/pull/36610)
    - 為每一次 `requests` 呼叫設定逾時（guardrail 驗證與管理用戶端 30 秒，chat 600 秒），以免無聲的主機把工作者的 event loop 卡住或讓 CLI 掛起 - [PR #38234](https://github.com/BerriAI/litellm/pull/38234)
    - 在工作者執行緒中執行 SMTP 電子郵件傳送，並設定連線逾時（`SMTP_TIMEOUT`，預設 30 秒），以免掛住的郵件伺服器阻塞 `/health/liveliness` - [PR #38473](https://github.com/BerriAI/litellm/pull/38473)
    - 在 `aiohttp_openai/` 處理路徑上遵守全域 `ssl_verify` - [PR #38400](https://github.com/BerriAI/litellm/pull/38400)
    - 保留重複表單鍵的每一個值，因此兩個 `timestamp_granularities[]` 值都會送達轉錄，而不只是最後一個 - [PR #37908](https://github.com/BerriAI/litellm/pull/37908)
    - 在元件化進入點上遵守 `DATABASE_DISABLE_PREPARED_STATEMENTS`，使 PgBouncer 交易池化不再因 prepared-statement 衝突而崩潰 - [PR #38363](https://github.com/BerriAI/litellm/pull/38363)
    - 從寫入者 DB 讀取寫入後的 router 重新載入，因此 `/model/new` 可在讀複本延遲下成功 - [PR #38580](https://github.com/BerriAI/litellm/pull/38580)
    - 在建立、更新與刪除時將搜尋工具同步到 router，因此新工具會立即提供服務，而已刪除的工具會停止 - [PR #38392](https://github.com/BerriAI/litellm/pull/38392)
    - 為延遲載入的路由提供目前的 `/openapi.json` 文件，並附帶 CI 漂移防護，且在連接 DB 的 proxy 上將 MCP、CloudZero、Vantage 與 config-override 路由保留在規格中 - [PR #38410](https://github.com/BerriAI/litellm/pull/38410), [PR #38416](https://github.com/BerriAI/litellm/pull/38416)
    - 保留串流 chunk 上的提供者 service-tier 中繼資料，使 Vertex/Gemini flex 串流以 flex 費率計費 - [PR #38458](https://github.com/BerriAI/litellm/pull/38458)
    - 在 `/v1/messages/count_tokens` 本地備援中計算 `tools`、`system` 以及 Anthropic 圖片與文件區塊，而不是忽略它們或因其崩潰 - [PR #38657](https://github.com/BerriAI/litellm/pull/38657)
    - 解決串流 chat completions 上的 Headroom CCR 擷取，因此用戶端會取得串流回應，而不是原始的 `headroom_retrieve` tool call - [PR #35017](https://github.com/BerriAI/litellm/pull/35017)
- **錯誤處理**
    - 對沒有 `exception_type` 分支的提供者映射上游狀態碼（壞掉的 MiniMax key 現在回傳 401 而不是重試的 500；類似 OpenAI 的 403 會拋出 `PermissionDeniedError`），並保留拒絕的連線為 `APIConnectionError`，使健康部署不會被降溫 - [PR #38318](https://github.com/BerriAI/litellm/pull/38318), [PR #38624](https://github.com/BerriAI/litellm/pull/38624)
    - 即使 model 與 provider 都未設定，也要映射未對應的例外，而不是顯示 `UnboundLocalError` - [PR #38496](https://github.com/BerriAI/litellm/pull/38496)

- 略過在 `stream_chunk_builder` 中沒有 `choices` 鍵的串流區塊，而不是將它們轉成 500 - [PR #34382](https://github.com/BerriAI/litellm/pull/34382)
- **SDK**
    - 將已排入佇列的記錄工作帶到新的事件迴圈，而不是在 `asyncio.run()` 邊界之間靜默丟棄支出與可觀測性事件 - [PR #38144](https://github.com/BerriAI/litellm/pull/38144)
    - 使用 litellm 自己的 `token_counter` 在 `prompt_token_calculator` 中計算 claude token，捨棄會引發 `AttributeError` 的已失效 anthropic SDK 路徑 - [PR #38130](https://github.com/BerriAI/litellm/pull/38130)
    - 在沒有執行中的事件迴圈時，當 `AsyncHTTPHandler` 結束初始化時釋放 aiohttp 連線工作階段 - [PR #36670](https://github.com/BerriAI/litellm/pull/36670)
    - 在 178 個後端檔案中以真實型別取代 `Any`，每個 JSON 邊界只用一次 TypedDict 與 Protocols 做型別註記 - [PR #38501](https://github.com/BerriAI/litellm/pull/38501)

## 文件更新 {#documentation-updates}

文件現在位於 [BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs)，因此此期間的文件變更會在那裡計入，而不是在此儲存庫的 PR 集合中。

### 依擁有區域彙總的 PR {#pr-roll-up-by-ownership-area}

依擁有區域分類的 PR（總計：392）

- 其他（CI / chore / tests / build / version bumps）：70
- 效能：55
- 支出 / 預算 / 費率限制：53
- UI：53
- LLM API 端點：49
- 模型與提供者：35
- 驗證與管理：25
- 記錄：21
- MCP：16
- 防護欄：9
- 提示管理：4
- 文件：1
- 密鑰管理員：1

## 端到端測試 {#end-to-end-testing}

我們正大力投資端到端測試，以減少回歸並讓 LiteLLM 每個版本都更穩定。每個版本都會透過一個即時測試套件來驗證，該套件會對真正部署的 proxy 執行，並連到真實的提供者端點，而不是 mock，因此我們驗證的行為就是您在 production 中得到的行為。

這個期間新增了 51 個僅測試用途的 pull request，其中 18 個有碰到即時 e2e 套件。最重要的變更是 e2e 套件現在會自我記錄：週六執行會測試真實提供者並發布一組固定 fixture 套件，而平日執行則會依 digest 重播該套件，完全不對提供者外送流量，並由一個 sentinel 保護；若有任何單一連線逃逸就會使執行失敗，且任何過期套件都會直接硬性失敗。Postgres 套件已從 CircleCI 轉到 GitHub Actions 服務容器，而企業版套件（涵蓋 guardrails、auth 與 management endpoints 的 244 個測試）現在作為 GitHub Actions 必要檢查執行，且首次量測了企業版涵蓋率。沉寂數月的 mutation-testing 工作流程再次產生並評分 mutant，而後續工作修補了讓 container、skills 與 openai-like config factories 中有 149 個 mutant 存活的缺口。新的 ruff gate 堅守測試品質底線：TQ008 拒絕任何會 patch litellm 內部實作的新測試，B003 禁止把 os.environ 直接換成一般 dict，且有十五條 assertion 與 handler 規則會拒絕無法失敗的測試。新的契約表鎖定每個提供者失敗所對應的狀態與錯誤形狀，25 個提供者、9 種上游狀態皆做端到端斷言，因此現在任何提供者對應的變更都必須是對該表的刻意編輯。剛完成大幅翻新的 Together AI，新增了涵蓋 chat、responses 與 messages 表面的回歸測試，以及針對 reasoning、tool calls、template kwargs、json_schema、cache-read pricing 與對真實 API 的成本追蹤之 live e2e 涵蓋。

其餘期間則補上了涵蓋率缺口並加強了既有項目。45 個完全沒有在任何工作中執行過的快取測試現在會在每個 PR 上執行，migration DDL guard 終於會執行，而會重寫資料列的 DML 也被直接禁止出現在 migrations 中，managed-files enforcement、客戶實際會跑的 Bedrock 組合、從真實 S3、GCS、team Langfuse 與 DataDog 目的地讀回的 logging delivery，以及 Admin UI 自己的 key 建立與編輯路徑，這些首次都有 live 涵蓋，另外還新增了針對 request validation、cost estimation、tiered-pricing rate fallbacks、Azure AI 422 retry 與 Prometheus caller-identity config validation 的固定契約。就不穩定測試而言，logging-worker drains 停止了 MCP 與 RAG 測試互相影響，vision 測試改為從 repo fixture 提供影像而不是 Wikipedia，reasoning-model token 預算不再讓 Gemini 與 gpt-5.5 的單字答案餓死，cache priming 以確定性方式將前綴大小設在可快取最小值之上，tool-call 與重播的 reasoning 個案在不原諒損壞的 proxy 前提下容忍模型非決定性，router-fallback 與 cost-header 個案會等到多副本設定傳播完成，harness 會重試先前被誤標為回歸的飽和上游失敗，Vertex realtime 套件已移出已退役模型，而先前被跳過的個案——涵蓋 per-model budget 更新、batches 驗證，以及三個 MCP 流程——現在又開始執行。另一輪修正也把 staging 分支自己的檢查從紅燈拉回綠燈，因此貢獻者的 PR 狀態再次只反映其自身變更。

## 新貢獻者 {#new-contributors}

- @ozolam 在 [PR #33514](https://github.com/BerriAI/litellm/pull/33514) 作出首次貢獻
- @AkshaySasi 在 [PR #34382](https://github.com/BerriAI/litellm/pull/34382) 作出首次貢獻
- @Hamjaster 在 [PR #35754](https://github.com/BerriAI/litellm/pull/35754) 作出首次貢獻
- @ump45nose 在 [PR #35940](https://github.com/BerriAI/litellm/pull/35940) 作出首次貢獻
- @ousamabenyounes 在 [PR #36397](https://github.com/BerriAI/litellm/pull/36397) 作出首次貢獻
- @ansh-agrawal 在 [PR #36514](https://github.com/BerriAI/litellm/pull/36514) 作出首次貢獻
- @imranismail 在 [PR #36728](https://github.com/BerriAI/litellm/pull/36728) 作出首次貢獻
- @danielva-monday 在 [PR #36762](https://github.com/BerriAI/litellm/pull/36762) 作出首次貢獻
- @Siraj637909 在 [PR #37090](https://github.com/BerriAI/litellm/pull/37090) 作出首次貢獻
- @bisma-nawaz 在 [PR #37724](https://github.com/BerriAI/litellm/pull/37724) 作出首次貢獻
- @mphilippnv 在 [PR #38221](https://github.com/BerriAI/litellm/pull/38221) 作出首次貢獻
- @ksk2023 在 [PR #38344](https://github.com/BerriAI/litellm/pull/38344) 作出首次貢獻
- @aaaaaandrew 在 [PR #38656](https://github.com/BerriAI/litellm/pull/38656) 作出首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.99.0...v1.100.0
