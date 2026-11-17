---
title: "LiteLLM v1.106.0 新增 Claude Haiku 5.5、Rust Lens 服務與 MCP 速率限制"
description: "第一天即新增 Claude Haiku 5.5、獨立的 Rust Lens 服務，以及涵蓋每個操作的 MCP 速率限制。MCP 伺服器不再取得呼叫者的金鑰。"
slug: "v1-106-0"
date: 2026-10-18T05:53:32
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
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.106.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.0
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.0`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.0) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

這些說明涵蓋自 `v1.105.0` 以來的所有內容。在 rc.1 之後加入發行線的變更，經 rc.4 以及在穩定標籤之前回移的修正，列於 [v1.106.0-rc.1 定版後納入的變更](#included-after-the-v11060-rc1-cut) 之下

先列出面向客戶的變更。測試、CI 與內部變更列在底部。

:::danger 重大變更

這些提示涵蓋與上一個穩定版本 `v1.105.0` 不同的使用者行為

**回應快取預設跳過超過 4 則訊息的請求。**新的 `cache_params.max_messages` 預設為 4，因此較長的對話與 Responses 輸入既不查閱也不儲存，無論精確或語義快取。提高它，或將其設為 `null` 以移除限制。請參閱 [PR #43878](https://github.com/BerriAI/litellm/pull/43878)

**Responses WebSocket 工作階段預設上限為 60 分鐘。**`/v1/responses` 上的工作階段在 `general_settings.responses_websocket_session_limit_seconds`（預設 3600，最大 7200）之後以代碼 1000 關閉，無論是否閒置。舊的 30 秒第一則訊息逾時已移除。請參閱 [PR #44433](https://github.com/BerriAI/litellm/pull/44433)

**呼叫者的 LiteLLM 金鑰永遠不會轉送到 MCP 伺服器**，包括在伺服器的 Extra Headers 之下設定的 `x-litellm-api-key`。透過靜態標頭或 OAuth 給上游伺服器它們自己的憑證。請參閱 [PR #45401](https://github.com/BerriAI/litellm/pull/45401)

**`PATCH /credentials/{name}` 不再重新命名憑證。**不同的 `credential_name` 回傳 400。使用新的 `display_name` 重新標示憑證，或建立新憑證來變更其名稱。請參閱 [PR #43148](https://github.com/BerriAI/litellm/pull/43148)

**傳送模型無法讀取之媒體的 Decisions 請求現在回傳 400。**`/v1/systemone` 上的 `images`、任一路由上的 `audio` 與 `videos`，以及 TypeSafe `assets`，過去會以 200 丟棄。它們現在回傳指名該欄位的 400，除非設定了 `drop_params`，且 OpenAI 決策模型現在會收到 System One `images`，並會被計費。請參閱 [PR #46628](https://github.com/BerriAI/litellm/pull/46628)

**在 Bedrock 模型上設定 `supports_prompt_cache_breakpoint: false` 會關閉其 Converse 提示快取。**該旗標原本用於選擇 OpenAI `prompt_cache_breakpoint` 格式，從本版本起 Bedrock Converse 也會讀取它來決定是否傳送 `cachePoint` 區塊。將該旗標設為 `false` 的 Bedrock Claude 部署不會傳送 `cachePoint`，也不會有快取寫入或讀取。若要恢復快取，請從支援提示快取的 Bedrock Claude 部署移除該旗標，只在描述 OpenAI 標記時才設定它。原本就是為了關閉 `cachePoint` 區塊而設定該旗標的地方請予以保留，例如 inference profile ARN 或會拒絕該欄位的模型。後續版本會把 Bedrock 的決策移至其專屬的 `supports_bedrock_converse_cache_point` 旗標，請參閱 [Bedrock 快取點](../../docs/completion/prompt_caching#control-bedrock-converse-cache-points) 與 [issue #52140](https://github.com/BerriAI/litellm/issues/52140)。請參閱 [PR #44292](https://github.com/BerriAI/litellm/pull/44292)

**`/v1/responses/compact` 現在以與 `/v1/responses` 相同的方式檢查 `previous_response_id`。**另一位使用者或團隊的 id 回傳 403，代理程式從未發出的 id 也一樣，除非 `general_settings.allow_unmanaged_response_ids` 為 `true`。websocket `/v1/responses` 路由發出的 id 對每個金鑰都被拒絕。請參閱 [PR #46827](https://github.com/BerriAI/litellm/pull/46827)

:::

## 重點摘要 {#key-highlights}

- **第一天即有新模型**：Claude Haiku 5.5 涵蓋 Anthropic、Bedrock、Bedrock Mantle、Vertex AI、Azure AI 與 Perplexity，Bedrock 上的 Kimi K3 與 GLM 5.3、Mistral Large 4，以及 Gemini Nano Banana 2.1，包含在 59 個新目錄條目之中
- **Lens 作為獨立 Rust 服務**：追蹤擷取與調查移出閘道，帶有常開的調查、Findings 收件匣、訊號、終端使用者回饋，以及從真實追蹤建構的資料集
- **Admin UI 首頁**：儀表板開啟於帶有用量摘要、近期發佈、部落格更新與模型排行榜的首頁，並有 Playground 中的 Decisions 頁籤、重新設計的 Usage 頁面與 Cmd+K 命令面板
- **更多 Decisions 提供者與媒體**：Laya、Bespoke Nimble 與 Databricks 提供 Decisions 並作為 Auto Router 分類器，Cloudflare Clef 讀取影像，Clef-omni 讀取音訊與影片，TypeSafe Jev 1.14 接受影像。Reka 加入成為 OpenAI 相容提供者
- **MCP 閘道控制**：速率限制涵蓋每個 MCP 操作，並有新的伺服器層級 rpm，OAuth 新增 Client ID Metadata Document 支援，且呼叫者的 LiteLLM 金鑰永遠不會轉送到上游
- **可觀測性**：OTel v2 上的 Arize 依團隊運作，Prometheus 可限制每個指標的 series，且 `litellm.agent()` 取得行程內工具呼叫迴圈

## v1.106.0-rc.1 定版後納入的變更 {#included-after-the-v11060-rc1-cut}

- Cloudflare Clef 在兩條 Decisions 路由上讀取影像，新的 `cloudflare/clef-omni` 讀取音訊與影片，TypeSafe Jev 1.14（`typesafe/jev-1.14.0`）透過 `assets`、`box` 問題與選用的 `TypeSafe-Danger-Zone-*` 標頭接受影像（rc.4） - [PR #46628](https://github.com/BerriAI/litellm/pull/46628)
- 部署可設定 `model_info.mode: decisions`，其在健康檢查與 Admin UI 上的行為與 `mode: evaluation` 相同（rc.4） - [PR #46628](https://github.com/BerriAI/litellm/pull/46628)
- 首頁 What's new 卡片顯示標記為 `day 0 support` 的最新 LiteLLM 部落格文章，因此新發佈無需升級代理程式即可出現（rc.2） - [PR #46309](https://github.com/BerriAI/litellm/pull/46309)
- yes / no Decisions 回答類型標示為 "Yes / No"，而非 `noul`（rc.2） - [PR #45933](https://github.com/BerriAI/litellm/pull/45933)
- 設定 `custom_prometheus_metadata_labels: ["project_alias"]` 不再破壞專案逐模型速率限制 gauges，也不再跳過專案金鑰的其他指標（rc.3） - [PR #46491](https://github.com/BerriAI/litellm/pull/46491)
- Decision Model 防護欄上的 `streaming_buffer_until_moderated: true` 會保留串流回答，直到決策模型通過它（rc.3） - [PR #46383](https://github.com/BerriAI/litellm/pull/46383)
- `/v1/responses/compact` 可使用呼叫者自己的 `previous_response_id`，過去會以 OpenAI 的 400 失敗 - [PR #46827](https://github.com/BerriAI/litellm/pull/46827)
- 設定了 `max_connections` 的 Redis Cluster 在負載下等待可用連線，而非將 Redis 關閉 60 秒 - [PR #47006](https://github.com/BerriAI/litellm/pull/47006)

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（3 個新提供者） {#new-providers-3-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Reka | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | Reka，作為 `reka/` 之下的 OpenAI 相容提供者，Responses 與 Messages 橋接到其 chat completions |
| Laya | `/v1/decisions`, Auto Router | Laya 決策模型與供 Auto Router 使用的 OSS 分類器 |
| Bespoke | `/v1/systemone`, Auto Router | Bespoke Nimble 決策模型與供 Auto Router 使用的 OSS 分類器 |

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做的事 |
| --- | --- | --- |
| [Databricks](../../docs/providers/databricks) | `/v1/decisions`, Auto Router | 將 Databricks `ai_decide` 作為 Decisions 提供者與 Auto Router 分類器呼叫 |

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（59 個新模型） {#new-model-support-59-new-models}

計數代表與 `v1.105.0` 相比的新目錄識別碼，包括別名與區域變體。下方價格為此版本隨附的值，以美元計；執行階段的定價對照表重新載入可更新它們。輸入與輸出欄顯示基本 token 費率；長上下文、快取、影像 token 與其他特殊費率依模型而定

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens）| 輸出（$/1M tokens）| 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `amazon.nova-2-5-sonic` | - | $0.33 | $2.75 | 即時；`input_cost_per_audio_token`: $3/1M；`output_cost_per_audio_token`: $12/1M |
| Amazon Bedrock | `anthropic.claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `au.anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-haiku-5-5` | 1,000,000 | $0.12 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-haiku-5-5` | 1,000,000 | $0.12 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `eu.anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.twelvelabs.pegasus-1-5-v1:0` | 98,304 | - | $7.5 | 聊天；`input_cost_per_video_per_second`: $0.00049 |
| Amazon Bedrock | `global.zai.glm-5.3` | 1,000,000 | $1.68 | $5.28 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `in.moonshotai.kimi-k3` | 1,000,000 | $3.3 | $16.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `jp.anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-haiku-5-5` | 1,000,000 | $0.12 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.twelvelabs.pegasus-1-5-v1:0` | 98,304 | - | $7.5 | 聊天；`input_cost_per_video_per_second`: $0.00049 |
| Amazon Bedrock | `us.zai.glm-5.3` | 1,000,000 | $1.848 | $5.808 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Anthropic | `claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/grok-4.7` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Azure AI | `azure_ai/kimi-k2-thinking` | 262,144 | $0.6 | $2.5 | 聊天；推理；工具呼叫 |
| Azure OpenAI | `azure/apac/gpt-6.1-sol` | 922,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/eu/gpt-6.1-sol` | 922,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/model-router` | 200,000 | $0.14 | $0 | 聊天；視覺 |
| Azure OpenAI | `azure/us/gpt-6.1-sol` | 922,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/whisper` | - | - | - | 轉錄；`input_cost_per_second`: $0.0001；`output_cost_per_second`: $0.0001 |
| Bedrock Mantle | `bedrock_mantle/anthropic.claude-haiku-5-5` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/anthropic.claude-haiku-5-5` | 1,000,000 | $0.12 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bespoke | `bespoke/bespokelabs/Bespoke-Nimble-9B` | 8,192 | $0 | $0 | 決策 |
| Bespoke | `bespoke/nimble` | 8,192 | $0 | $0 | 決策 |
| Bespoke | `bespoke/nimble-latest` | 8,192 | $0 | $0 | 決策 |
| ChatGPT | `chatgpt/gpt-6-astra` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| ChatGPT | `chatgpt/gpt-6-luna` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| ChatGPT | `chatgpt/gpt-6-sol` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| ChatGPT | `chatgpt/gpt-6.1-sol` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| Cohere | `cohere/embed-v5.0-fast` | 128,000 | $0.08 | $0 | 嵌入 |
| Cohere | `cohere/embed-v5.0-pro` | 128,000 | $0.12 | $0 | 嵌入 |
| Databricks | `databricks/databricks-openjev-qwen35-4b` | - | $0 | $0 | 決策 |
| Gemini | `gemini/gemini-nano-banana-2.1` | 131,072 | $1.5 | $7.5 | 影像生成；推理；視覺；PDF 輸入；網頁搜尋；`output_cost_per_image`: $0.0336；`output_cost_per_image_token`: $30/1M |
| Laya | `laya/english` | - | $0 | $0 | 決策 |
| Laya | `laya/multilingual` | - | $0 | $0 | 決策 |
| Laya | `laya/typed-decisions` | - | $0 | $0 | 決策 |
| Mistral | `mistral/mistral-large-4` | 1,048,576 | $0.68 | $2.09 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Mistral | `mistral/mistral-large-4-0` | 1,048,576 | $0.68 | $2.09 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/anthropic/claude-haiku-5.5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-haiku-5.5:batch` | 1,000,000 | $0.05 | $0.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/google/gemini-nano-banana-2.1` | 65,536 | $1.5 | $7.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋；`output_cost_per_image_token`: $30/1M |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-sante` | 262,144 | $0.042 | $0.1232 | 聊天；推理；工具呼叫；提示快取 |
| OpenRouter | `openrouter/inclusionai/ling-3.1-flash` | 262,144 | $0 | $0 | 聊天；推理；工具呼叫 |
| OpenRouter | `openrouter/mistralai/mistral-large-4-0` | 1,048,576 | $0.68 | $2.09 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-image-2` | - | $5 | - | 影像生成；視覺；`input_cost_per_image_token`: $8/1M；`output_cost_per_image_token`: $30/1M |
| OpenRouter | `openrouter/openai/gpt-image-2.5-flare` | - | $5 | - | 影像生成；視覺；`input_cost_per_image_token`: $8/1M；`output_cost_per_image_token`: $30/1M |
| OpenRouter | `openrouter/openai/gpt-image-2.5-sunburst` | - | $5 | - | 影像生成；視覺；`input_cost_per_image_token`: $8/1M；`output_cost_per_image_token`: $30/1M |
| OpenRouter | `openrouter/stepfun/step-5-preview` | 1,000,000 | $1 | $2.7 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Perplexity | `perplexity/anthropic/claude-haiku-5-5` | - | $0.1 | $0.5 | 回應；工具呼叫；網頁搜尋 |
| Vertex AI | `gemini-nano-banana-2.1` | 131,072 | $1.5 | $7.5 | 影像生成；推理；視覺；提示快取；PDF 輸入；網頁搜尋；`input_cost_per_image`: $0.00168；`output_cost_per_image`: $0.0336 |
| Vertex AI | `vertex_ai/claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-haiku-5-5@default` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/gemini-nano-banana-2.1` | 131,072 | $1.5 | $7.5 | 影像生成；推理；視覺；提示快取；PDF 輸入；網頁搜尋；`input_cost_per_image`: $0.00168；`output_cost_per_image`: $0.0336 |
| xAI | `xai/grok-imagine-video-1.5-lite` | - | - | - | 影片生成；`input_cost_per_image`: $0.01；`output_cost_per_second`: $0.02 |

### 新提供者 {#new-providers}

- 新增 Reka 作為 `reka/` 前綴之下的 OpenAI 相容提供者，讀取 `REKA_API_KEY` 與 `REKA_API_BASE`，列於 Add Model 表單中，`/v1/responses` 與 `/v1/messages` 橋接到其 chat completions - [PR #44278](https://github.com/BerriAI/litellm/pull/44278)

### Decisions 提供者 {#decisions-providers}

- 新增 Bespoke Nimble 作為 `BESPOKE_API_BASE` 之後的 Decisions 提供者，在 `POST /bespoke/v1/systemone` 上提供，並可選為 Auto Router OSS Classifier - [PR #44246](https://github.com/BerriAI/litellm/pull/44246)
- 新增 Databricks `ai_decide` 作為 `/v1/decisions` 提供者與 Auto Router 分類器（`opensource_classifier_config.provider: databricks`），以 `DATABRICKS_API_KEY` 或 `DATABRICKS_TOKEN` 為金鑰，並在 Add Auto Router 表單中有 Databricks 選項 - [PR #45200](https://github.com/BerriAI/litellm/pull/45200)
- 新增 Laya 作為 Decisions 提供者與 Auto Router OSS 分類器：路由器設定 `classifier_type: oss_classifier` 與 `opensource_classifier_config.provider: laya`（或 `jev` 用於 Jev 相容的自架分類器），且現有的 Jev 設定保持運作 - [PR #43626](https://github.com/BerriAI/litellm/pull/43626)

### Amazon Bedrock {#amazon-bedrock}

- 將 `bedrock_mantle/anthropic.claude-*` chat completions 路由到 Mantle 的原生 Messages 端點，並在存在時依其自身的 `bedrock_mantle/` 成本對照表資料列為 Mantle 呼叫定價 - [PR #43646](https://github.com/BerriAI/litellm/pull/43646)
- 新增 `anthropic_messages` 健康檢查模式，預設用於 Bedrock Mantle Claude 部署，讓它們不再於 `/health` 與 Test Connect 上顯示不健康 - [PR #44419](https://github.com/BerriAI/litellm/pull/44419)
- 當 bedrock-runtime 無法計數時，在 Bedrock Mantle 上為 Claude Opus 4.8、5 與 5.5 計數 token，而非退回本機 tokenizer - [PR #45317](https://github.com/BerriAI/litellm/pull/45317)
- 將專案 id 作為文件記載的 `anthropic-workspace-id` 標頭傳送到 Bedrock Mantle，讓 `aws_bedrock_project_id` 生效 - [PR #44173](https://github.com/BerriAI/litellm/pull/44173)
- 在 Converse 與 Invoke 串流呼叫上遵循逐請求 `timeout` - [PR #44134](https://github.com/BerriAI/litellm/pull/44134)
- 從工具 schema 中丟棄會拒絕它們的 Converse 模型（Kimi K3、Grok 4.6 與 4.7）的 lookaround regex 模式，由新的 `supports_regex_lookaround` 成本對照表與 `model_info` 旗標控制 - [PR #44138](https://github.com/BerriAI/litellm/pull/44138)
- 停止將 Converse `cachePoint` 區塊傳送給 Kimi K3，由現有的 `supports_prompt_cache_breakpoint` 旗標控制，該旗標現在也控制 Bedrock `cachePoint` 區塊（請參閱重大變更）- [PR #44292](https://github.com/BerriAI/litellm/pull/44292)
- 依 `drop_params` 丟棄或拒絕 Bedrock GPT 模型不支援的推理強度等級，而非轉送它們換來 Bedrock 400 - [PR #44183](https://github.com/BerriAI/litellm/pull/44183)
- 僅為原生 Chat Completions 上的 gpt-oss 將開頭的 `<reasoning>` 標籤從答案中分離，讓 GPT 5.6 與 Grok 答案保留它 - [PR #44432](https://github.com/BerriAI/litellm/pull/44432)
- 透過即時 API 將每個 Nova Sonic assistant 句子轉送一次，而非兩次 - [PR #44987](https://github.com/BerriAI/litellm/pull/44987)
- 在擷取時將 Scheduled Bedrock 批次工作回報為 `in_progress`，而非 `validating` - [PR #45157](https://github.com/BerriAI/litellm/pull/45157)
- 僅由無法辨識的事件影格組成的 converse-stream 200 現在以指名事件類型的 502 結束，且以 Bedrock 例外命名的影格會以該例外的狀態引發，而非以 $0 回傳空白的 `end_turn` - [PR #44112](https://github.com/BerriAI/litellm/pull/44112)
- 為 Bedrock Mantle GPT-5.6 與更新版本傳送 OpenAI 明確提示快取斷點，遵循部署上設定的 `supports_prompt_cache_breakpoint`，並阻止格式錯誤的 `cache_control_injection_points` 讓每個請求以 500 失敗 - [PR #38729](https://github.com/BerriAI/litellm/pull/38729)

### Anthropic {#anthropic}

- 停止在簽章區塊中重複串流的 thinking 文字，讓儲存與重播的 thinking 區塊只帶一次文字 - [PR #44127](https://github.com/BerriAI/litellm/pull/44127)
- 將 `inline-tools-2026-09-15` beta 標頭轉送到 Anthropic 與 Vertex AI，讓工作階段中途的工具變更不再以 400 失敗 - [PR #45297](https://github.com/BerriAI/litellm/pull/45297)
- 讓缺少其規則或組織 id 的 token 檔案或 inline-token federation 憑證以指名缺失 id 的 401 失敗 - [PR #45178](https://github.com/BerriAI/litellm/pull/45178)
- 透過 count_tokens 的 `system` 參數傳入開頭的 system 訊息，讓帶有 `instructions` 的 `/v1/responses/input_tokens` 與 `/v1/messages/count_tokens` 取得 Anthropic 的計數 - [PR #45463](https://github.com/BerriAI/litellm/pull/45463)
- 在 Anthropic 與 Azure AI Anthropic 上，於提供者 token 計數之前正規化影像 - [PR #45185](https://github.com/BerriAI/litellm/pull/45185)
- Anthropic：workload identity federation，以從 OIDC 斷言鑄造的短期 token（token 檔案、env token、LiteLLM 簽署的 issuer 或 Keycloak），透過設定、環境變數或具名憑證建立，外加 `GET /credentials/{name}/jwks` - [PR #44448](https://github.com/BerriAI/litellm/pull/44448)

### ChatGPT 與 GitHub Copilot {#chatgpt-and-github-copilot}

- 拒絕在代理程式請求內啟動 ChatGPT 或 GitHub Copilot 裝置代碼登入，以 400 回應，而非讓 worker 凍結長達 15 分鐘 - [PR #39585](https://github.com/BerriAI/litellm/pull/39585)
- 在 `chatgpt/*` 模型上遵循呼叫者的 `stream` 旗標，讓非串流的 `/v1/responses`、`/v1/chat/completions` 與 `/v1/messages` 呼叫回傳 JSON，而非原始 SSE 或 500 - [PR #41235](https://github.com/BerriAI/litellm/pull/41235)
- 在 ChatGPT Responses 呼叫上保留請求的 `service_tier`，將 `fast` 對應到 `priority` - [PR #40108](https://github.com/BerriAI/litellm/pull/40108)
- 為 `gpt-6-sol`、`gpt-6-luna`、`gpt-6-astra` 與 `gpt-6.1-sol` 新增 `chatgpt/` 目錄資料列，讓對它們的 chat completions 呼叫經過 Responses 橋接 - [PR #44758](https://github.com/BerriAI/litellm/pull/44758)

### Exa AI {#exa-ai}

- 當 Exa 未回傳 `text` 時，為搜尋結果摘要備援到 highlights 或 summary - [PR #42213](https://github.com/BerriAI/litellm/pull/42213)

### Fireworks AI {#fireworks-ai}

- 新增 `fireworks_forward_user_id` 部署設定，在 chat completions、Responses 與 Messages 上將金鑰的 LiteLLM 使用者 id 作為 `user` 傳送到 Fireworks - [PR #45265](https://github.com/BerriAI/litellm/pull/45265)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 停止將 Claude thinking 區塊簽章重播給 Gemini，讓混合 Claude 與 Gemini 模型群組不再以 `Invalid thought signature` 失敗 - [PR #44661](https://github.com/BerriAI/litellm/pull/44661)
- 將 `system` 與 `tools` 轉送到 Vertex 夥伴模型 count_tokens，並在 Vertex 計數錯誤時退回本機 tokenizer - [PR #43900](https://github.com/BerriAI/litellm/pull/43900)
- 為帶有 `vertex_location: us` 或 `eu` 的 Vertex 即時工作階段撥接多區域 Live API 主機，並允許純 `ws://` api_base 值 - [PR #45166](https://github.com/BerriAI/litellm/pull/45166)
- 在 Gemini 多模態嵌入上接受帶有 `video_metadata`（`fps`、`start_offset`、`end_offset`）的檔案內容區塊 - [PR #45305](https://github.com/BerriAI/litellm/pull/45305)
- 在 Vertex 影像生成與編輯成本路徑上套用區域端點加成，並為 `vertex_ai/gemini-3.1-flash-image` 新增 1.1x 加成 - [PR #44679](https://github.com/BerriAI/litellm/pull/44679)、[PR #44673](https://github.com/BerriAI/litellm/pull/44673)

### Mistral {#mistral}

- 新增 Mistral Large 4（`mistral/mistral-large-4`、`mistral/mistral-large-4-0`），帶有 524,288 token 上下文視窗、定價、提示快取與推理 - [PR #44870](https://github.com/BerriAI/litellm/pull/44870)

### OCI {#oci}

- 從 compartment OCID 解析 OCI GenAI 端點 realm，讓 `us-luke-1` 等 Government realm 區域能到達 `oci.oraclegovcloud.com` - [PR #43180](https://github.com/BerriAI/litellm/pull/43180)

### Ollama {#ollama}

- 將 `ollama/` 模型上串流與 fenced 的提示式 JSON 工具呼叫轉為真正的工具呼叫 - [PR #45053](https://github.com/BerriAI/litellm/pull/45053)
- 在 `ollama/` 模型上於工具結果之後以文字回答，而非重複工具呼叫 - [PR #45079](https://github.com/BerriAI/litellm/pull/45079)
- 每個 `ollama/` 串流使用一個 id、對非文字工具內容回傳 400、分離連續的工具結果，並從 Responses 串流中丟棄空訊息項目 - [PR #45177](https://github.com/BerriAI/litellm/pull/45177)

### OpenAI {#openai}

- 在即時 `intent=transcription` 工作階段的上游 OpenAI URL 中不帶 `model`，OpenAI 曾以 `invalid_model` 拒絕它 - [PR #43854](https://github.com/BerriAI/litellm/pull/43854)

### OpenAI 相容提供者 {#openai-compatible-providers}

- 在預設 SDK 路徑上傳送提供者歸屬標頭，修正 Novita 的 `X-Novita-Source` 並新增 Perplexity 的 `X-Pplx-Integration` - [PR #44291](https://github.com/BerriAI/litellm/pull/44291)

### SAP {#sap}

- 在 SAP 訊息與工具上轉送 `cache_control`，並停止傳送被 SAP 以 400 拒絕的 `cache_control: null` - [PR #39122](https://github.com/BerriAI/litellm/pull/39122)

### Scaleway {#scaleway}

- 在 `/v1/rerank` 上新增 Scaleway rerank 支援 - [PR #44160](https://github.com/BerriAI/litellm/pull/44160)

### VoyageAI by MongoDB {#voyageai-by-mongodb}

- 將 Voyage AI 提供者重新命名為 VoyageAI by MongoDB，並將 MongoDB 發出的 `al-` 金鑰傳送到 `ai.mongodb.com` 用於嵌入與 rerank；`voyage` 提供者 id 維持不變 - [PR #41812](https://github.com/BerriAI/litellm/pull/41812)

### 模型目錄與定價 {#model-catalog-and-pricing}

- 新增 `claude-haiku-5-5` 定價，然後整合其在各提供者上的 100k 以上 token 費率與能力旗標，並修正 Azure AI 與 Vertex AI 上的強制工具使用與 thinking 旗標 - [PR #45108](https://github.com/BerriAI/litellm/pull/45108)、[PR #45151](https://github.com/BerriAI/litellm/pull/45151)、[PR #45114](https://github.com/BerriAI/litellm/pull/45114)、[PR #45116](https://github.com/BerriAI/litellm/pull/45116)
- 降低 Anthropic、Bedrock、Bedrock Mantle 與 Vertex AI 上 Claude Sonnet 5.5 的快取讀取價格 - [PR #45113](https://github.com/BerriAI/litellm/pull/45113)、[PR #45216](https://github.com/BerriAI/litellm/pull/45216)、[PR #45223](https://github.com/BerriAI/litellm/pull/45223)、[PR #45217](https://github.com/BerriAI/litellm/pull/45217)
- 為 anthropic `claude-opus-5-5` 新增美國資料駐留乘數 - [PR #45078](https://github.com/BerriAI/litellm/pull/45078)
- 新增 OpenAI TTS 與 GPT-5.x 棄用日期 - [PR #44175](https://github.com/BerriAI/litellm/pull/44175)
- 新增 openai gpt-6.1-sol ultrafast 層級價格 - [PR #45408](https://github.com/BerriAI/litellm/pull/45408)
- 新增 xAI grok-voice-transcribe-1.0 棄用日期 - [PR #44237](https://github.com/BerriAI/litellm/pull/44237)
- 登錄表稽核 2026-10-03，新增 Cohere Embed v5、xAI grok-imagine-video-1.5-lite、OpenRouter GPT Image 資料列與 Gemini 3.5 Transcribe 限制 - [PR #44376](https://github.com/BerriAI/litellm/pull/44376)
- 設定 Gemini Deep Research 輸入限制、Vertex Gemini 3.6 與 3.7 Flash 淘汰日期，以及 Azure data zone gpt-6.1-sol 定價 - [PR #44633](https://github.com/BerriAI/litellm/pull/44633)
- 新增 Bedrock flex 價格、Anthropic 網頁搜尋旗標、Gemini 關閉日期、OpenRouter 別名修正與 Mistral Large 4 上下文 - [PR #44910](https://github.com/BerriAI/litellm/pull/44910)
- 移除格式錯誤、重複與已停用的 PaLM 成本對照表條目 - [PR #44880](https://github.com/BerriAI/litellm/pull/44880)
- 修正 Gemini 與 Vertex 影像資料列上的 `supported_endpoints`，並從 `gemini/gemini-nano-banana-2.1` 丟棄 `/v1/batch` - [PR #44891](https://github.com/BerriAI/litellm/pull/44891)、[PR #44940](https://github.com/BerriAI/litellm/pull/44940)
- 依 Gemini 定價頁新增 gemini/gemini-nano-banana-2.1 - [PR #44868](https://github.com/BerriAI/litellm/pull/44868)
- 新增 Vertex AI gemini-nano-banana-2.1 與 Nano Banana 2 優先定價 - [PR #44892](https://github.com/BerriAI/litellm/pull/44892)
- 為三個 Gemini 資料列新增優先層級音訊輸入價格 - [PR #44632](https://github.com/BerriAI/litellm/pull/44632)
- 為 vertex_ai gemini-3.1-flash-lite-image 新增棄用日期 - [PR #44639](https://github.com/BerriAI/litellm/pull/44639)
- 修正 Vertex gemini-3.5 transcribe-live 與 live-translate 上的 `input_cost_per_second` - [PR #45002](https://github.com/BerriAI/litellm/pull/45002)
- 將 Azure `us/` 與 `eu/` 僅 Responses 模型標記為 `mode: responses`，讓它們的 chat completions 呼叫橋接到 Azure Responses - [PR #44323](https://github.com/BerriAI/litellm/pull/44323)
- 為 Azure MAI-Image 與 azure_ai/flux.2-pro 資料列新增 `max_input_tokens`，並將 Azure text-embedding 最大輸入設為 8192 - [PR #44375](https://github.com/BerriAI/litellm/pull/44375)、[PR #44405](https://github.com/BerriAI/litellm/pull/44405)、[PR #44449](https://github.com/BerriAI/litellm/pull/44449)
- 新增 azure_ai/kimi-k2-thinking 及其淘汰日期 - [PR #44382](https://github.com/BerriAI/litellm/pull/44382)、[PR #44455](https://github.com/BerriAI/litellm/pull/44455)
- 新增 azure_ai/grok-4.7 並更新 azure_ai/grok-4.6 輸入價格 - [PR #44937](https://github.com/BerriAI/litellm/pull/44937)
- 新增 azure gpt-6-sol 優先處理價格 - [PR #44829](https://github.com/BerriAI/litellm/pull/44829)
- 以 Azure 定價頁同步 Azure OpenAI 音訊、即時與影像價格 - [PR #44992](https://github.com/BerriAI/litellm/pull/44992)
- 更新 gpt-realtime-2.1、gpt-4o-realtime-preview-2024-10-01、jamba-instruct、gpt-4o-transcribe、kimi-k2.7-code 與 sora-2 的 Azure 淘汰日期 - [PR #44526](https://github.com/BerriAI/litellm/pull/44526)、[PR #44567](https://github.com/BerriAI/litellm/pull/44567)、[PR #44585](https://github.com/BerriAI/litellm/pull/44585)、[PR #44986](https://github.com/BerriAI/litellm/pull/44986)、[PR #45355](https://github.com/BerriAI/litellm/pull/45355)
- 為 azure_ai claude-opus-5-5 與 claude-sonnet-5-5 標註日期，並填入 azure/eu/gpt-6-astra 限制 - [PR #45018](https://github.com/BerriAI/litellm/pull/45018)
- 以標準層級為 Bedrock Amazon Nova 2 Pro preview 定價 - [PR #44302](https://github.com/BerriAI/litellm/pull/44302)
- 為 Grok 4.3、4.6、4.7 與 Kimi K3 新增 Bedrock 優先與 flex 價格 - [PR #44670](https://github.com/BerriAI/litellm/pull/44670)
- 新增 Bedrock GLM 5.3 跨區域資料列、Nova 2.5 Sonic 與 Kimi K3 印度跨區域資料列 - [PR #44710](https://github.com/BerriAI/litellm/pull/44710)、[PR #44990](https://github.com/BerriAI/litellm/pull/44990)
- 新增 Bedrock TwelveLabs Pegasus 1.5 推論設定檔 - [PR #45477](https://github.com/BerriAI/litellm/pull/45477)
- 更新 Bedrock GovCloud OpenAI 價格，新增 GPT-6 Astra ultrafast 層級與 Titan Image v2 EOL 日期 - [PR #45077](https://github.com/BerriAI/litellm/pull/45077)
- 新增 Bedrock gpt-6.1-sol ultrafast 層級價格及其 1M 上下文視窗 - [PR #45482](https://github.com/BerriAI/litellm/pull/45482)、[PR #45488](https://github.com/BerriAI/litellm/pull/45488)
- 從 Bedrock 模型卡採用 Bedrock 與 Bedrock Mantle 上下文限制、輸出限制與 EOL 日期 - [PR #45091](https://github.com/BerriAI/litellm/pull/45091)、[PR #45409](https://github.com/BerriAI/litellm/pull/45409)、[PR #45417](https://github.com/BerriAI/litellm/pull/45417)
- 為 DeepSeek R1、Qwen3 Coder 與 Claude Sonnet 4.5 新增 Bedrock 棄用日期 - [PR #45089](https://github.com/BerriAI/litellm/pull/45089)、[PR #45496](https://github.com/BerriAI/litellm/pull/45496)
- 移除 AWS 無法呼叫的裸 Bedrock `xai.grok-4.7` 與 `openai.gpt-6.1-sol` 資料列，讓 `us.` 設定檔 ARN 以 `us.` 價格計費 - [PR #45460](https://github.com/BerriAI/litellm/pull/45460)、[PR #45479](https://github.com/BerriAI/litellm/pull/45479)
- 從 models API 同步 OpenRouter 價格、限制與棄用日期 - [PR #44287](https://github.com/BerriAI/litellm/pull/44287)、[PR #44466](https://github.com/BerriAI/litellm/pull/44466)、[PR #44533](https://github.com/BerriAI/litellm/pull/44533)、[PR #44975](https://github.com/BerriAI/litellm/pull/44975)、[PR #45469](https://github.com/BerriAI/litellm/pull/45469)
- 將 together_ai Kimi-K3 與 Qwen3.8-Flash 價格更新為已發佈費率 - [PR #44864](https://github.com/BerriAI/litellm/pull/44864)
- 更新 baseten DeepSeek-V4.1-Flash-Fast 快取讀取價格與最大輸出 - [PR #45468](https://github.com/BerriAI/litellm/pull/45468)
- `litellm.supports_audio_output()` 讀取 `supports_audio_output` 成本對照表鍵，而非 `supports_audio_input` - [PR #45294](https://github.com/BerriAI/litellm/pull/45294)
- Azure：新增 `azure/model-router` 定價（路由器自身的每 1M 輸入 token $0.14 費用，在路由模型之上收取）與 `azure/whisper` 音訊轉錄定價 - [PR #44872](https://github.com/BerriAI/litellm/pull/44872)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 讓帶有 `previous_response_id` 的 Anthropic `/v1/responses` 後續請求傳送工具結果加上 `instructions` 而不出現 400；後續請求的 `instructions` 現在取代先前回合的，而非堆疊在其後 - [PR #45322](https://github.com/BerriAI/litellm/pull/45322)
- 在將 Responses 歷史重播給 OpenAI 與 Azure 時丟棄 LiteLLM 鑄造的 reasoning 項目，讓對話可從 Claude 切換到 GPT - [PR #44132](https://github.com/BerriAI/litellm/pull/44132)
- 閒置的 Responses WebSockets 保持開啟，而非在 30 秒後關閉，且每個工作階段受新的 `general_settings.responses_websocket_session_limit_seconds`（預設 3600，60 到 7200）上限限制 - [PR #44433](https://github.com/BerriAI/litellm/pull/44433)

### 透過 Responses API 橋接的 Chat Completions {#chat-completions-over-the-responses-api-bridge}

- 將橋接回覆的文字與工具呼叫作為一個 choice 回傳，帶有 `finish_reason: "tool_calls"`，讓只讀取 `choices[0]` 的用戶端（例如 Google ADK）執行工具；第一次嘗試的 gpt-5.4/5.5 路由變更已還原 - [PR #44295](https://github.com/BerriAI/litellm/pull/44295)、[PR #44344](https://github.com/BerriAI/litellm/pull/44344)、[PR #44346](https://github.com/BerriAI/litellm/pull/44346)
- 在文字、影像與檔案區塊上保留 `prompt_cache_breakpoint` 標記，讓 gpt-5.6 上的工具呼叫聊天取得提示快取讀取，並在模型不支援斷點時丟棄它們 - [PR #44119](https://github.com/BerriAI/litellm/pull/44119)
- 在橋接字串化的區塊上保留快取斷點，在 `drop_params` 下丟棄格式錯誤的標記，並接受 `ttl: "30m"` 斷點欄位 - [PR #40032](https://github.com/BerriAI/litellm/pull/40032)
- 將 `input_audio` 部分作為 Responses `input_audio` 傳送，而非將 base64 作為文字計費；沒有 `drop_params` 時，現在回傳提供者自身的錯誤 - [PR #45224](https://github.com/BerriAI/litellm/pull/45224)
- 在橋接到 Responses API 的 chat completions 上遵循請求的 `cache` 控制（例如 `"no-cache": true`） - [PR #44676](https://github.com/BerriAI/litellm/pull/44676)
- 當橋接串流遇到 429 時，呈現提供者的 `RateLimitError`，而非巢狀的 `MidStreamFallbackError` - [PR #44989](https://github.com/BerriAI/litellm/pull/44989)
- 將遭截斷的橋接 Responses 輸出回報為 `incomplete`，以 `response.incomplete` 結束那些串流，並回顯請求的 `temperature`、`top_p` 與 `max_output_tokens` - [PR #44460](https://github.com/BerriAI/litellm/pull/44460)

### 提示快取 {#prompt-caching}

- 將閘道注入的提示快取斷點預設為在 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages` 上的隱含查閱，並透過 chat 到 Responses 橋接保留斷點，讓成長中的代理程式歷史重用先前快取的前綴 - [PR #42281](https://github.com/BerriAI/litellm/pull/42281)、[PR #45121](https://github.com/BerriAI/litellm/pull/45121)
- 在注入斷點時計數 assistant 工具呼叫上的用戶端 `cache_control` 標記，讓 Claude 請求保持在 4 個斷點限制內 - [PR #43556](https://github.com/BerriAI/litellm/pull/43556)

### 批次與檔案 {#batches-and-files}

- 為每個批次輸出與錯誤檔案儲存檔案詳細資訊，讓它們出現於 `GET /v1/files`，且 Bedrock 批次輸出檔案擷取時不出現 500 - [PR #41761](https://github.com/BerriAI/litellm/pull/41761)

### Vector Stores {#vector-stores}

- 從 `GET /v1/vector_stores/{id}/files` 回傳 LiteLLM 管理的檔案 id，讓列出的 id 可被擷取、刪除，並用作 `after` / `before` 游標 - [PR #43800](https://github.com/BerriAI/litellm/pull/43800)

### 透傳端點 {#pass-through-endpoints}

- 當未設定靜態 OpenAI 金鑰時，在 `/openai_passthrough` 與 `/openai` 上使用 OpenAI workload identity federation token - [PR #44140](https://github.com/BerriAI/litellm/pull/44140)
- 在每個請求上解析 `oidc/` 透傳憑證，讓輪換的 projected Kubernetes 服務帳號 token 可用於透傳驗證 - [PR #44577](https://github.com/BerriAI/litellm/pull/44577)

### SDK {#sdk}

- 新增 `litellm.run_tool_loop()` 與 `litellm.arun_tool_loop()`，執行 completion 加工具執行迴圈，直到模型停止呼叫工具 - [PR #44381](https://github.com/BerriAI/litellm/pull/44381)
- 透過 `scripts/build_core_distribution.py` 從其自身的封裝 manifest 建置獨立的 `litellm-core` 發行版；舊版封裝維持不變 - [PR #44340](https://github.com/BerriAI/litellm/pull/44340)
- 為 `litellm.agent()` 新增 `Harness.TOOL_LOOP`，一個在 `litellm.acompletion()` 之上的行程內工具呼叫迴圈，從型別提示與 docstrings 將純 Python 函式轉為工具，將工具錯誤回傳給模型，並支援 `output=`、`permissions="ask"`、`max_turns`、工作階段、成本與用量；閘道呼叫在支出記錄中標記為 `harness,tool_loop` - [PR #44391](https://github.com/BerriAI/litellm/pull/44391)
- 在 SDK 回應物件上於 `_hidden_params` 旁新增公開的 `hidden_params` 屬性，後者保持運作；代理程式回應標頭維持不變 - [PR #44668](https://github.com/BerriAI/litellm/pull/44668)

### 一般 {#general}

- 本機 token 計數以逐頁（文字加渲染影像）為 base64 PDF 文件定價，而非作為一張影像，讓 `count_tokens` 備援追蹤計費輸入 - [PR #45301](https://github.com/BerriAI/litellm/pull/45301)
- `GET /v1/models?client_version=...` 回傳 Codex 原生目錄，逐模型公開 `model_info.service_tiers`，讓 Codex 可提供如 `/ultrafast` 的層級；沒有 `client_version` 時 OpenAI 清單形狀維持不變 - [PR #44136](https://github.com/BerriAI/litellm/pull/44136)
- 帶有 `check_provider_endpoint: true` 的 `GET /v1/models` 為 `litellm_proxy/*` 與 `hosted_vllm` 萬用字元部署探索上游模型 - [PR #38617](https://github.com/BerriAI/litellm/pull/38617)
- 在 LLM 路由上回傳指名缺失欄位的 400 而非 500，對活動與向量儲存清單上小於 1 的 `page` 或 `page_size` 回傳 400，並對未知的影片、eval、向量儲存與 skill id 回傳提供者的 404 - [PR #43787](https://github.com/BerriAI/litellm/pull/43787)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

#### 首頁 {#home-page}

- 位於 `/ui/home` 的新首頁是儀表板根目錄，帶有 7 天用量條、What's new 發佈卡片、部落格更新與模型排行榜；登入或開啟 `/ui` 現在落於首頁，Virtual Keys 保留其側欄條目與 `/ui/api-keys` - [PR #45858](https://github.com/BerriAI/litellm/pull/45858)
- 首頁 What's new 卡片顯示三篇標記為 `day 0 support` 的最新 LiteLLM 部落格文章，且 `/public/litellm_blog_posts` 回傳每篇文章的標籤與最多 50 篇文章 - [PR #46309](https://github.com/BerriAI/litellm/pull/46309)

#### Playground 與 Decisions {#playground-and-decisions}

- Playground 中新的 Decisions 頁籤（`?tab=system-one`），以工作階段金鑰或虛擬金鑰在 `/v1/decisions` 或 `/v1/systemone` 上試用決策模型，逐端點保留個別草稿，並顯示每個選擇、yes / no 與分數答案及其信心度，外加用量與延遲 - [PR #44043](https://github.com/BerriAI/litellm/pull/44043)、[PR #44664](https://github.com/BerriAI/litellm/pull/44664)、[PR #45729](https://github.com/BerriAI/litellm/pull/45729)、[PR #45817](https://github.com/BerriAI/litellm/pull/45817)
- 在 Form 頁籤中建構決策請求，帶有 Input 方塊與每個問題一張卡片，而非手寫 JSON 主體 - [PR #45739](https://github.com/BerriAI/litellm/pull/45739)
- 挑選四個範例預設之一（bug triage、support ticket routing、comment moderation、lead scoring），或清除請求從空白開始；請求編輯後，挑選器顯示 Custom - [PR #45848](https://github.com/BerriAI/litellm/pull/45848)
- 在請求表單與 Add Model 表單中將 yes / no 問題類型標示為 "Yes / No"，並在懸停時說明 - [PR #45841](https://github.com/BerriAI/litellm/pull/45841)、[PR #45933](https://github.com/BerriAI/litellm/pull/45933)
- Decisions playground 先排列表單，其下有大型 Send 按鈕，僅在請求執行後顯示結果，並以顯示確切請求的唯讀 cURL 頁籤取代可編輯的 JSON 頁籤 - [PR #45903](https://github.com/BerriAI/litellm/pull/45903)
- Models + Endpoints 以決策模型橫幅取代成本最佳化回饋橫幅，提供者搜尋可找到決策模型提供者，且 playground 模型挑選器列出決策模型 - [PR #45735](https://github.com/BerriAI/litellm/pull/45735)

#### Models + Endpoints {#models--endpoints}

- 將 Tencent 加入 Add Model 提供者下拉選單，帶有其標誌、選用的 API base 與必要的 API 金鑰 - [PR #40924](https://github.com/BerriAI/litellm/pull/40924)
- Add Model 僅列出目錄模型，而非同時顯示自訂定價註冊的部署別名，使用 `GET /public/litellm_model_cost_map` 上新的 `catalog_only=true` 選項 - [PR #44877](https://github.com/BerriAI/litellm/pull/44877)
- 在模型目錄載入完成後顯示 Add Model 模型挑選器，即使提供者先被挑選 - [PR #45426](https://github.com/BerriAI/litellm/pull/45426)
- 將 Evaluation 模式（`Evaluation - /v1/decisions`）加入 Add Model 表單，讓決策模型可從 UI 新增與測試；`POST /health/test_connection` 現在接受 `mode: "evaluation"` - [PR #45481](https://github.com/BerriAI/litellm/pull/45481)
- 決策模型橫幅連結到支援的提供者文件，取代 Add a decision model 按鈕，且儀表板將 decisions playground 稱為 Decisions 而非 System One - [PR #45732](https://github.com/BerriAI/litellm/pull/45732)
- 從 Add Model 提供者下拉選單丟棄逐提供者的決策模型子標籤 - [PR #45755](https://github.com/BerriAI/litellm/pull/45755)
- 從 Add Credential、Edit Credential 與 Add Model 設定 Anthropic workload identity federation，federated 憑證在憑證表格中標示；Edit Credential 現在僅儲存管理員變更的值 - [PR #44889](https://github.com/BerriAI/litellm/pull/44889)
- 從 LLM Credentials 與 Add Model 設定 OpenAI workload identity federation，將 API Key 換為 Identity Provider ID、Service Account ID 與 Identity Token File - [PR #45528](https://github.com/BerriAI/litellm/pull/45528)

#### Auto-Routers {#auto-routers}

- 在 auto-router 進階設定、Sessions and efficiency 之下選用快取感知路由，帶有選用的輸出 token 估計與預測逾時 - [PR #43396](https://github.com/BerriAI/litellm/pull/43396)
- 將 Jev 分類器重新命名為 OSS Classifier，並新增 Laya 作為提供者選項，帶有 checkpoint 與逾時設定 - [PR #43768](https://github.com/BerriAI/litellm/pull/43768)
- Auto-router 設定將分類器、層級與進階設定分組；Decisions Model 分類器挑選已接入的決策模型部署，且層級以可編輯的建議預填開始 - [PR #45916](https://github.com/BerriAI/litellm/pull/45916)
- 在 Cost Optimization、Auto-Router、Usage 中新增逐路由器的 token、成本、每百萬 token 成本與節省表格，由新的每日 token 記錄支援 - [PR #45152](https://github.com/BerriAI/litellm/pull/45152)

#### 用量與模型排行榜 {#usage-and-model-leaderboard}

- 重新設計 Usage 頁面，帶有含 sparklines 的統計條、逐模型的堆疊每日圖表、在管理員全域檢視上從 User-Agent 標籤建構的 Top agents 面板，以及提供者占比條，在全域、團隊、組織、標籤與客戶檢視間共用 - [PR #45221](https://github.com/BerriAI/litellm/pull/45221)、[PR #45229](https://github.com/BerriAI/litellm/pull/45229)
- 將 Key Activity 搜尋移回頁籤頂部，並為 Model Activity 新增模型名稱搜尋 - [PR #44521](https://github.com/BerriAI/litellm/pull/44521)
- Model Leaderboard 的 Top models 圖表從第一個有用量的日子開始，讓條形保持寬且易讀 - [PR #44249](https://github.com/BerriAI/litellm/pull/44249)
- 從 Model Leaderboard 移除 Top models by task 卡片 - [PR #44502](https://github.com/BerriAI/litellm/pull/44502)

#### 團隊、使用者與存取群組 {#teams-users-and-access-groups}

- 在 `team_metadata_schema` 中宣告的鍵在團隊中繼資料中顯示為固定標籤，僅值可編輯 - [PR #41482](https://github.com/BerriAI/litellm/pull/41482)
- 存取群組、團隊、組織與預設使用者設定中的模型挑選器，將不再可用的已儲存模型列於 Unavailable 群組中，讓它們可被移除 - [PR #43944](https://github.com/BerriAI/litellm/pull/43944)
- 團隊與金鑰頁面上的模型存取群組 chips 連結到 Models + Endpoints 上的存取群組篩選器 - [PR #45402](https://github.com/BerriAI/litellm/pull/45402)
- 邀請與重設密碼連結顯示於唯讀欄位中，旁邊有 Copy 按鈕 - [PR #44454](https://github.com/BerriAI/litellm/pull/44454)

#### Logs {#logs}

- Logs 頁籤共用頁面間距，在工具列中顯示重新整理狀態，並讓分頁保持在全高表格底部 - [PR #44306](https://github.com/BerriAI/litellm/pull/44306)

#### 一般 {#general-1}

- 新增 Cmd+K（Ctrl+K）命令面板與頂欄搜尋，依別名或 ID 尋找虛擬金鑰並跳到任何側欄頁面 - [PR #45456](https://github.com/BerriAI/litellm/pull/45456)
- LiteAdmin 從浮動按鈕移入標頭 pill，開啟停靠的側邊面板，以 Cmd/Ctrl+J 切換，並再次於 Playground 上顯示 - [PR #44293](https://github.com/BerriAI/litellm/pull/44293)
- LiteAdmin 現在僅限企業版 - [PR #44399](https://github.com/BerriAI/litellm/pull/44399)
- 低於 768px 時側欄起始隱藏並在頁面上方開啟，次要標頭工具移入 More 選單 - [PR #44603](https://github.com/BerriAI/litellm/pull/44603)
- 將 Moyai 加入產品切換器，帶有啟動頁面與 Quick connect，為 Moyai 發出範圍限定的虛擬金鑰；UI Settings 以 Disconnect 按鈕顯示連線 - [PR #45196](https://github.com/BerriAI/litellm/pull/45196)
- 還原儀表板 modal 背後的背景模糊 - [PR #45877](https://github.com/BerriAI/litellm/pull/45877)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 在導覽中向組織與團隊管理員顯示 Projects，將 `/project/list` 與 `/project/info` 限定於組織管理員的組織，並在頁面可見性挑選器中提供 Projects - [PR #41325](https://github.com/BerriAI/litellm/pull/41325)
- 為 `litellm_jwtauth` 新增 `auto_register_map_existing_key`，讓 JWT 使用者的第一次呼叫重用其現有的虛擬金鑰，而非鑄造第二個（預設關閉） - [PR #42375](https://github.com/BerriAI/litellm/pull/42375)
- 以 `/customer/new`、`/customer/update` 與 `/customer/info` 上的 `models` 清單限制終端使用者可呼叫的模型；清單外的呼叫得到 403 `customer_model_access_denied` - [PR #43904](https://github.com/BerriAI/litellm/pull/43904)
- 套用無路徑的 SCIM 群組 PATCH 操作（Okta Push Groups 重新命名），而非將它們儲存在空的中繼資料鍵之下，並讓受影響的團隊可在 UI 中再次儲存 - [PR #43978](https://github.com/BerriAI/litellm/pull/43978)
- 新增選用的 `general_settings.vector_store_deny_by_default`，讓金鑰、團隊與使用者僅能查詢其 `object_permission` 中列出的向量儲存 - [PR #44244](https://github.com/BerriAI/litellm/pull/44244)
- `disable_model_add_for_internal_users` 現在阻止團隊管理員與已選入的成員透過 API 以及 UI 建立模型與 auto routers - [PR #44438](https://github.com/BerriAI/litellm/pull/44438)
- 在金鑰與團隊上新增 `denied_passthrough_routes`，從 `allowed_passthrough_routes` 授權中切出子路徑 - [PR #44924](https://github.com/BerriAI/litellm/pull/44924)
- 在客戶模型檢查中，列於終端使用者上的團隊別名優先於同名的金鑰別名，與路由一致 - [PR #44677](https://github.com/BerriAI/litellm/pull/44677)
- 在 `general_settings` 之下新增 `search_tool_deny_by_default`，讓金鑰在 `/v1/search`、`/search`、websearch 攔截與 `/search_tools/list` 上需要明確的搜尋工具授權 - [PR #44490](https://github.com/BerriAI/litellm/pull/44490)

### 憑證 {#credentials}

- 新增選用的憑證 `display_name`，並讓 `credential_name` 在 `PATCH /credentials/{name}` 上不可變；設定定義的憑證為唯讀，且 GET 回傳 `source` - [PR #43148](https://github.com/BerriAI/litellm/pull/43148)
- 讓憑證編輯停留在被編輯的憑證上，拒絕與設定憑證衝突的名稱（409），並為憑證清單新增 Source 欄 - [PR #45890](https://github.com/BerriAI/litellm/pull/45890)
- 將搜尋工具 `litellm_params` 以靜態加密儲存，並在主金鑰輪換中涵蓋它們 - [PR #43631](https://github.com/BerriAI/litellm/pull/43631)

### 模型管理 {#model-management}

- 在 `POST /fallback` 上以公開名稱接受團隊範圍的模型，並即時讀取已儲存的備援規則，讓並行寫入不再丟棄規則 - [PR #45455](https://github.com/BerriAI/litellm/pull/45455)

### 用量與分析 {#usage-and-analytics}

- 停止將失敗的支出記錄金鑰別名查詢快取為已確認未命中，並在每日活動路由的查詢期間熬過中斷的 DB 連線 - [PR #43560](https://github.com/BerriAI/litellm/pull/43560)
- 依選取的 UTC 請求日計數 Auto-Router 節省，讓 Auto-Router 與 Overall 頁籤一致，並移除 "Avg saved per session" 磚 - [PR #44115](https://github.com/BerriAI/litellm/pull/44115)
- 在 `disable_spend_logs: true` 以及沒有工作階段 id 的請求下，寫入逐路由器的 Auto-Router 每日彙總 - [PR #44226](https://github.com/BerriAI/litellm/pull/44226)
- ROI 計算器連接 GitLab 以及 GitHub，從成對的 `repo:` 與 `branch:` 標籤將成本歸屬到分支，並將 Overview、People 與 Branches 分為頁籤 - [PR #44324](https://github.com/BerriAI/litellm/pull/44324)
- ROI 計算器從儲存庫活動衡量出貨速度、品質訊號與記錄的支出，無需估計模型，並將多個提供者使用者名稱連結到一個電子郵件 - [PR #44426](https://github.com/BerriAI/litellm/pull/44426)
- ROI 計算器的人員、已合併變更與分支清單預設為僅 Matched people - [PR #44465](https://github.com/BerriAI/litellm/pull/44465)
- 淘汰整合的 ROI Calculator：其儀表板頁面、Observability 導覽條目、API 路由、OAuth 回呼與排程重新整理被移除，`/ui/roi-calculator/` 回傳 404，且已儲存的計算器設定保留在資料庫中。獨立的 litellm-roi-calculator 專案仍可使用 - [PR #44477](https://github.com/BerriAI/litellm/pull/44477)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- `lite pi` 釘選 compat 旗標，讓 pi 停止傳送 Anthropic 模型拒絕的 `store` 與提示快取欄位 - [PR #40739](https://github.com/BerriAI/litellm/pull/40739)
- 讓 `lite login` 與 Claude Code 閘道登入在 `DISABLE_ADMIN_UI=true` 節點上完成 - [PR #44620](https://github.com/BerriAI/litellm/pull/44620)
- Claude Code 閘道登入回傳輪換的 14 天 refresh token，且 `POST /claude_code_gateway/oauth/revoke` 撤銷它 - [PR #44635](https://github.com/BerriAI/litellm/pull/44635)
- Statusline 成本比較顯示完整工作階段的閘道支出，包括沒有基準估計的請求 - [PR #44959](https://github.com/BerriAI/litellm/pull/44959)
- 修正首次 SSO `lite login` 的金鑰在第一個請求上的 401 "user no longer exists" - [PR #45020](https://github.com/BerriAI/litellm/pull/45020)

### 部署 {#deployment}

- 將選用的 LiteAdmin Slack worker 捆綁在 Enterprise 閘道映像中，Slack 帳號透過閘道現有的 SSO 登入連接 - [PR #44444](https://github.com/BerriAI/litellm/pull/44444)
- 在授權驗證期間停止記錄授權值、解碼的 payload 與帶授權的 URL - [PR #44956](https://github.com/BerriAI/litellm/pull/44956)
- 為分離的閘道與後端部署允許清單 `/moyai/connect/*`，並將 Moyai UI 設定 Redis 寫入標記為 `config_params` - [PR #45220](https://github.com/BerriAI/litellm/pull/45220)

### Terraform {#terraform}

- 讓 `litellm_key` 上省略的 `allowed_routes` 在 plan 時已知，並阻止更新從 state 重新傳送過時路由 - [PR #44487](https://github.com/BerriAI/litellm/pull/44487)

## AI 整合 {#ai-integrations}

### Lens 與 Agent Traces {#lens-and-agent-traces}

#### Lens 服務與部署 {#lens-service-and-deployment}

- 將追蹤擷取、ClickHouse 生命週期與追蹤讀取移入獨立的 Rust Lens 服務；代理程式以專用追蹤金鑰直接上傳到 Lens，舊的閘道上傳 URL 回傳 410，且 Python workers 被取代 - [PR #45148](https://github.com/BerriAI/litellm/pull/45148)
- 簡化 Lens 安裝：Helm 提供私人憑證、持久化 ClickHouse 與 ingress 衍生的端點，Compose 生成並保留憑證，且設定顯示安裝指南或可複製的框架設定 - [PR #45230](https://github.com/BerriAI/litellm/pull/45230)
- 以一個 `general_settings.tracing.store` 區塊（`type`、`url`、`database`、`retention_days`）設定追蹤儲存，寫入與讀取使用同一個 ClickHouse URL，並對追蹤與支出表格套用一個 14 天預設 TTL - [PR #43941](https://github.com/BerriAI/litellm/pull/43941)
- 選取與執行中 LiteLLM 版本相符的 Lens worker 映像，在不相容 worker 認領工作之前拒絕它們，並為 Compose 與 Helm 安裝公開私人 worker token - [PR #44428](https://github.com/BerriAI/litellm/pull/44428)
- 將 Helm 安裝的 Lens worker 釘選到其核准的映像 digest，並以釘選的基礎映像與雜湊的 Python 相依性強化 worker 映像 - [PR #44467](https://github.com/BerriAI/litellm/pull/44467)
- 讓 Lens 原始碼設定指南與追蹤 Compose 檔案與實際發佈的 worker 映像一致 - [PR #44476](https://github.com/BerriAI/litellm/pull/44476)
- 修正 Lens 調查在 Python 3.10 上以 `module 'asyncio' has no attribute 'timeout'` 失敗 - [PR #44911](https://github.com/BerriAI/litellm/pull/44911)
- 在帶 checksum 的 `_sqlx_migrations` 帳本中追蹤 ClickHouse 追蹤 migrations，讓重新啟動僅套用待處理的 migrations，並將目前的 `retention_days` 重新套用到每個追蹤表格；已編輯且已套用的 migration 現在會在啟動時停用追蹤，而代理程式繼續提供流量 - [PR #44580](https://github.com/BerriAI/litellm/pull/44580)

#### 追蹤擷取 {#trace-ingestion}

- 支援 Claude Agent SDK 追蹤，帶有提示、工具引數與輸出、token 計數、代理程式名稱與 Claude 標誌 - [PR #44248](https://github.com/BerriAI/litellm/pull/44248)
- 在已驗證的 `/v1/logs` 端點上接受原生 Claude Code 回應記錄，以重建回覆、失敗工具輸出與子代理程式分支；以 `lens.session.capture=true` 將整個工作階段分組 - [PR #44711](https://github.com/BerriAI/litellm/pull/44711)
- 保留沒有追蹤上下文到達的原生 Claude Code 記錄，並復原在尾隨 system 訊息之前的 headless 工具結果 - [PR #44894](https://github.com/BerriAI/litellm/pull/44894)
- 為 Agent 欄與篩選器使用設定的框架代理程式名稱而非服務名稱，並渲染使用 `parts` 的 GenAI 訊息，而非讓 Traces 頁面崩潰 - [PR #44218](https://github.com/BerriAI/litellm/pull/44218)
- 將第一則使用者訊息顯示為執行的輸入，而非最新的後續訊息 - [PR #44958](https://github.com/BerriAI/litellm/pull/44958)
- 透過 `agent.source.type`、`agent.source.url` 與 `agent.source.title` span 屬性，將追蹤連結到啟動它的 Slack、Teams、Discord、Linear、GitHub 或 Jira 串 - [PR #45169](https://github.com/BerriAI/litellm/pull/45169)
- 保留帶有數字或混合型別標籤的請求記錄，並在被拒絕的 OTLP 批次中回傳有意義的 RPC 錯誤代碼 - [PR #45206](https://github.com/BerriAI/litellm/pull/45206)

#### 追蹤成本關聯 {#trace-cost-correlation}

- 保留不同的支出資料列、持久化閘道呼叫 ID，並以擁有權檢查配對閘道與提供者 ID，讓代理程式追蹤在 12 個代理程式 SDK 上顯示正確成本 - [PR #44421](https://github.com/BerriAI/litellm/pull/44421)
- 停止從一個 span 上衝突的支出 ID 加總成本，並阻止無關的工具 HTTP 呼叫隱藏模型呼叫的成本 - [PR #44456](https://github.com/BerriAI/litellm/pull/44456)
- 透過轉送並儲存提供者請求 ID，在 Lens 中為原生 Claude Code 呼叫定價，顯示帶有已定價呼叫數的部分總計，並將每個步驟連結到其支出記錄 - [PR #44738](https://github.com/BerriAI/litellm/pull/44738)
- 接受沒有提供者請求 ID 的歷史支出資料列 - [PR #44930](https://github.com/BerriAI/litellm/pull/44930)
- 每五秒持續重新整理執行，直到閘道成本到達，而非長達十分鐘顯示未知成本 - [PR #45105](https://github.com/BerriAI/litellm/pull/45105)
- 遮蔽 ClickHouse 支出資料列中類似憑證的自訂中繼資料，在訊息記錄關閉時丟棄自訂中繼資料，並在未計算成本時讓支出保持 null - [PR #44363](https://github.com/BerriAI/litellm/pull/44363)

#### Trace API 與 SQL 查詢 {#trace-api-and-sql-queries}

- 將追蹤讀取限定於呼叫者的使用者、金鑰或允許的團隊，以符合記錄可見性，並在追蹤 ID 跨執行共用時回傳帶有 `trace_ref` 提示的 400 - [PR #44228](https://github.com/BerriAI/litellm/pull/44228)
- `POST /v1/traces/query` 現在僅回傳 `{"data": [...]}`，丟棄原始 ClickHouse `meta`、`rows` 與 `statistics` 欄位 - [PR #44609](https://github.com/BerriAI/litellm/pull/44609)
- 從共用查詢檔案提供 `/v1/traces/query/help` 中精選的 SQL 範例 - [PR #44388](https://github.com/BerriAI/litellm/pull/44388)
- 新增 `GET /v1/traces/agents` 與 Lens 標頭中的代理程式挑選器，將 Traces 限定於一個代理程式並記住選擇 - [PR #45202](https://github.com/BerriAI/litellm/pull/45202)
- 在 ClickHouse 限制內以有界頁面載入大型追蹤清單與詳細資訊，而非以 HTTP 500 失敗，並為長執行提供 Load more 步驟 - [PR #44384](https://github.com/BerriAI/litellm/pull/44384)
- 批次處理執行清單讀取，將分頁快取上限設為 128 MiB，並從第一頁重新開始 Refresh trace - [PR #44398](https://github.com/BerriAI/litellm/pull/44398)
- 在行程中快取追蹤讀取，讓重複開啟、頁面與清單輪詢共用一次 ClickHouse 讀取，並回報 UI 可重試的有型別讀取失敗 - [PR #44422](https://github.com/BerriAI/litellm/pull/44422)
- 更快開啟大型追蹤與清單頁面，並將並行追蹤讀取排隊，而非以 503 拒絕第九個 - [PR #45228](https://github.com/BerriAI/litellm/pull/45228)
- 在所有代理程式進入點間保留 ASGI lifespan 狀態，讓 Agent Traces 不再於分離的閘道與後端部署或 eager 路由載入時回傳 501 - [PR #44214](https://github.com/BerriAI/litellm/pull/44214)
- 與 Trace API 共用支出記錄擁有權檢查，並移除其 API 金鑰存取授權 - [PR #44239](https://github.com/BerriAI/litellm/pull/44239)

#### Traces UI {#traces-ui}

- 將執行作為 Thread 閱讀，每個使用者提示一個回合，工作摺疊入 Worked 條，取代 Conversation 頁籤 - [PR #44947](https://github.com/BerriAI/litellm/pull/44947)
- 在執行標頭中先顯示代理程式、提問的使用者與 Slack 串，帶有一個 Copy for agent 選單 - [PR #45261](https://github.com/BerriAI/litellm/pull/45261)
- 預設在 Traces 上開啟 Lens，並新增 Show details 按鈕以重新開啟已關閉的 span 面板 - [PR #44260](https://github.com/BerriAI/litellm/pull/44260)
- 以顯示追蹤是否到達的即時點陣欄位取代時間軸條，並讓追蹤檢視填滿畫面 - [PR #44390](https://github.com/BerriAI/litellm/pull/44390)
- 將每個 Lens 檢視（開啟的執行、步驟、篩選器、範例工作階段）保留在 URL 中以便分享，並在標頭新增 Demo data 開關 - [PR #44468](https://github.com/BerriAI/litellm/pull/44468)
- 為追蹤標頭新增 Copy link 按鈕 - [PR #44749](https://github.com/BerriAI/litellm/pull/44749)
- 讓 Copy for agent 透過支援的 JSON 追蹤 API 取得選取步驟的內容 - [PR #44902](https://github.com/BerriAI/litellm/pull/44902)
- 在工具名稱旁顯示工具命令、路徑與查詢，並將記錄的訊息陣列渲染為對話而非 JSON - [PR #44645](https://github.com/BerriAI/litellm/pull/44645)
- 在分組重複步驟時，讓模型與工具呼叫保持執行順序 - [PR #44895](https://github.com/BerriAI/litellm/pull/44895)
- 依可見條目分頁長對話，每個子代理程式有個別的分頁控制 - [PR #44878](https://github.com/BerriAI/litellm/pull/44878)
- 在新的 spans 到達時重新整理開啟的追蹤，同時保留選取的步驟，並將收到的工作階段標示為 Recorded 而非 Completed - [PR #44900](https://github.com/BerriAI/litellm/pull/44900)
- 在頂層步驟上開啟執行，並對空輸入顯示 "No input recorded" 而非模型名稱 - [PR #45254](https://github.com/BerriAI/litellm/pull/45254)
- 以來自已完成調查的 Findings 欄取代追蹤表格的 Failed 欄 - [PR #44696](https://github.com/BerriAI/litellm/pull/44696)
- 持久化執行表格的欄選擇，並顯示欄形狀的載入 skeletons - [PR #44579](https://github.com/BerriAI/litellm/pull/44579)
- 在時間範圍變更時保持先前執行可見，並統一 Lens 載入狀態 - [PR #44789](https://github.com/BerriAI/litellm/pull/44789)
- 輸入以篩選追蹤代理程式下拉選單 - [PR #44745](https://github.com/BerriAI/litellm/pull/44745)
- 在搜尋方塊失去焦點時立即套用輸入的搜尋文字 - [PR #44665](https://github.com/BerriAI/litellm/pull/44665)
- 為 Traces 清單提供齊平的搜尋列，篩選器位於緊湊的第二列 - [PR #44972](https://github.com/BerriAI/litellm/pull/44972)
- Lens 追蹤重新整理按鈕永遠啟用，重新取得執行並清除時間軸縮放 - [PR #44252](https://github.com/BerriAI/litellm/pull/44252)
- Trace 抽屜新增跨步驟搜尋、錯誤篩選器、對話檢視、行內工具呼叫與全螢幕模式；ROI 估計僅涵蓋連結到閘道使用者的作者，並依真實名稱搜尋模型 - [PR #44351](https://github.com/BerriAI/litellm/pull/44351)
- Trace 抽屜在外部點擊時關閉，空執行狀態提供 Set up tracing，且 Lens 展示模式以藍色框標示 - [PR #44473](https://github.com/BerriAI/litellm/pull/44473)

#### 設定與上手 {#setup-and-onboarding}

- 新增帶有互動式範例追蹤與調查的 Preview sample，對齊全部 14 個框架設定指南，並回報不相容的 worker 認領，而非讓調查卡住 - [PR #44268](https://github.com/BerriAI/litellm/pull/44268)
- 引導新使用者從第一個追蹤經連接 worker 到建立第一個調查 - [PR #44475](https://github.com/BerriAI/litellm/pull/44475)
- 將 Lens 設定以行內方式顯示為每個頁籤的空狀態，而非 modal，並修正窄畫面上重疊的控制 - [PR #44604](https://github.com/BerriAI/litellm/pull/44604)
- 新增用於追蹤狀態與 worker 設定的 Lens Settings 頁籤，並以行內方式編輯調查而非在 modal 中 - [PR #44479](https://github.com/BerriAI/litellm/pull/44479)
- 將範例調查預覽簡化為一個帶有可展開證據的緊湊 finding - [PR #44123](https://github.com/BerriAI/litellm/pull/44123)
- 在所屬欄位之下顯示 Lens 設定驗證錯誤，並允許在儲存錯誤後重試 - [PR #44354](https://github.com/BerriAI/litellm/pull/44354)

#### 調查 {#investigations}

- 預設每 15 分鐘持續執行調查，僅針對新追蹤，Findings 與 Investigations 表格以及 Run now 限定於代理程式與時間範圍 - [PR #44418](https://github.com/BerriAI/litellm/pull/44418)
- 還原緊湊的 Traces、Findings 與 Investigations 頁籤，並顯示即時追蹤審查、結論與 worker 佇列狀態 - [PR #44472](https://github.com/BerriAI/litellm/pull/44472)
- 以隨需讀取與搜尋、受限的 Python、平行分析與上下文壓縮分析大型追蹤工作區 - [PR #44640](https://github.com/BerriAI/litellm/pull/44640)
- 重用未變更的追蹤審查，無需新的模型呼叫，整合跨執行的重複 findings，並分離保留與已花費的分析預算 - [PR #44778](https://github.com/BerriAI/litellm/pull/44778)
- 以透過萬用字元路由提供的模型執行調查，並在排隊前回報缺失的定價或 worker 存取 - [PR #44233](https://github.com/BerriAI/litellm/pull/44233)
- 顯示遮蔽後的調查失敗詳細資訊（階段、驗證錯誤、完成原因），並從模型容量推導輸出限制 - [PR #44406](https://github.com/BerriAI/litellm/pull/44406)
- 將帶有可用結果與部分失敗工作的執行標記為 Partial，並將被拒絕的最終結果上限設為三次重試 - [PR #44692](https://github.com/BerriAI/litellm/pull/44692)
- 當 worker 也回報來源診斷時，保留最終調查覆蓋 - [PR #44682](https://github.com/BerriAI/litellm/pull/44682)
- 在調查證據中包含 span 開始與結束時間戳記 - [PR #44702](https://github.com/BerriAI/litellm/pull/44702)
- 當分析模型呼叫失敗時，釋放保留的預算並回傳提供者錯誤 - [PR #44431](https://github.com/BerriAI/litellm/pull/44431)
- 阻止進度更新耗盡預算保留重試並提前結束調查 - [PR #45432](https://github.com/BerriAI/litellm/pull/45432)
- 以執行報告與一個建議的下一步行動引導調查詳細資訊 - [PR #44786](https://github.com/BerriAI/litellm/pull/44786)
- 以帶有剩餘時間的單一階段條顯示調查進度 - [PR #44301](https://github.com/BerriAI/litellm/pull/44301)
- 減少即時調查上的重新渲染，並將百分比標示為整體進度 - [PR #44935](https://github.com/BerriAI/litellm/pull/44935)
- 為調查設定新增八個預設 Watch for 檢查 - [PR #44313](https://github.com/BerriAI/litellm/pull/44313)
- 為調查詳細資訊新增 Copy for agent - [PR #44945](https://github.com/BerriAI/litellm/pull/44945)

#### Findings {#findings}

- 依優先順序排列 findings，帶有受影響追蹤的占比、每日頻率圖表與行內醒目標示的證據 - [PR #45143](https://github.com/BerriAI/litellm/pull/45143)
- 將 findings 撰寫為 issue 簡報，帶有問題、使用者目標、發生了什麼與測試案例，可複製到 Claude Code 或 Codex - [PR #44311](https://github.com/BerriAI/litellm/pull/44311)
- 在每個 finding 旁顯示調查名稱 - [PR #44753](https://github.com/BerriAI/litellm/pull/44753)

#### 訊號、回饋與資料集 {#signals-feedback-and-datasets}

- 以 System 1 評估模型檢查的全域訊號標記追蹤，在 Lens Settings 之下設定，並由 `GET /lens/signals`、`PUT /lens/signals` 與 `POST /lens/traces/signals` 提供 - [PR #45094](https://github.com/BerriAI/litellm/pull/45094)
- 在追蹤完成的數秒內分類訊號，而非數分鐘 - [PR #45186](https://github.com/BerriAI/litellm/pull/45186)
- 透過 `PUT /lens/feedback` 記錄終端使用者回饋分數與留言，並在追蹤上顯示 - [PR #45171](https://github.com/BerriAI/litellm/pull/45171)
- 拒絕沒有團隊的金鑰的回饋寫入 - [PR #45266](https://github.com/BerriAI/litellm/pull/45266)
- 新增 Datasets：從真實追蹤、步驟與 findings 建構的版本化 eval 案例，可匯出為 JSONL - [PR #44765](https://github.com/BerriAI/litellm/pull/44765)

#### 效能 {#performance}

- 在為調查取樣追蹤時修剪 ClickHouse 分割，並在一次處理中取樣 - [PR #45087](https://github.com/BerriAI/litellm/pull/45087)
- 以取樣的開始時間限制單一追蹤調查讀取 - [PR #45088](https://github.com/BerriAI/litellm/pull/45088)
- 從已索引的到期佇列認領 worker 工作，而非掃描每個調查 - [PR #45095](https://github.com/BerriAI/litellm/pull/45095)

### 防護欄 {#guardrails}

- 新增 LLM Shield Proxy 防護欄，在提供者呼叫之前以替身交換 PII，並在回應中還原原始值，包括串流 - [PR #42645](https://github.com/BerriAI/litellm/pull/42645)
- 將以 secret 命名的防護欄 `litellm_params` 以靜態加密儲存，在主金鑰輪換時重新加密，並以 400 拒絕用戶端傳送的 `litellm_enc::` 值 - [PR #43627](https://github.com/BerriAI/litellm/pull/43627)
- 新增 `logging_only_scope`（`input` 或 `output`）與 `logging_only_continue_on_input_failure`，讓 `logging_only` 防護欄可僅觀察請求、僅觀察回應，或在請求被標記後繼續掃描回應，並有相符的 Admin UI 控制 - [PR #43695](https://github.com/BerriAI/litellm/pull/43695)、[PR #45782](https://github.com/BerriAI/litellm/pull/45782)
- 新增 `stream_scope` 防護欄設定（`streaming`、`non_streaming` 或 `both`，逐模式），並將 Bedrock `converse-stream` 與 `invoke-with-response-stream` 透傳呼叫視為串流 - [PR #43801](https://github.com/BerriAI/litellm/pull/43801)
- 當用戶端在串流中途中斷連線時，對已傳遞的內容執行串流結束的 `post_call` 掃描，讓請求記錄帶有防護欄判定 - [PR #43839](https://github.com/BerriAI/litellm/pull/43839)
- 在 `/v1/images/edits` 上執行統一防護欄，以與 `/v1/images/generations` 相同的方式掃描文字提示 - [PR #44195](https://github.com/BerriAI/litellm/pull/44195)
- 在即時轉錄工作階段上跳過防護欄 VAD `session.update` 注入，先前它會破壞它們 - [PR #44843](https://github.com/BerriAI/litellm/pull/44843)
- 在 OpenAI 與 Azure 即時轉錄工作階段上執行逐字稿防護欄，回報 `guardrail_violation`，而不傳送工作階段拒絕的 assistant-turn 事件 - [PR #44844](https://github.com/BerriAI/litellm/pull/44844)
- 為 Akto 防護欄在請求與回應上支援 `logging_only` 模式 - [PR #45461](https://github.com/BerriAI/litellm/pull/45461)
- 擴充 Akto 防護欄，在 `post_call` 中封鎖或遮罩回覆，透過 `pre_mcp_call` / `post_mcp_call` 檢查 MCP 工具引數與結果，並將附件傳送到 Akto - [PR #44343](https://github.com/BerriAI/litellm/pull/44343)

### 記錄與可觀測性 {#logging-and-observability}

#### OpenTelemetry {#opentelemetry}

- 將回應快取與路由 spans 巢狀於 `cache.get` / `cache.set` 與 `route {model_group}` 階段之下，並依鍵家族而非 Python 方法命名 Redis spans - [PR #44150](https://github.com/BerriAI/litellm/pull/44150)
- 將 Postgres spans 命名為 `postgres.{verb} {table}`，表格位於 `db.collection.name`，並為支出寫入、原始 Prisma 查詢與背景工作發出 DB spans - [PR #44240](https://github.com/BerriAI/litellm/pull/44240)
- 追蹤 auto-router 選取的設定、路由原因與分類器失敗 - [PR #44926](https://github.com/BerriAI/litellm/pull/44926)
- 阻止 SDK `Router` 在查閱 OTel v2 記錄器時於其第一個請求載入整個代理程式 - [PR #44485](https://github.com/BerriAI/litellm/pull/44485)

#### Arize {#arize}

- 在 Arize OTel v2 LLM spans 上發出 OpenInference 工具呼叫與標準 `metadata` 屬性 - [PR #43698](https://github.com/BerriAI/litellm/pull/43698)
- 為團隊與金鑰 Arize 回呼新增 `arize_otlp_protocol`（`grpc` 或 `http/protobuf`），並在團隊與金鑰記錄表單中有下拉選單 - [PR #44492](https://github.com/BerriAI/litellm/pull/44492)
- 在每個 OTel v2 Arize 匯出上命名 Arize 專案（`ARIZE_PROJECT_NAME`，備援為 `litellm`），讓 Arize 不再拒絕團隊追蹤 - [PR #44605](https://github.com/BerriAI/litellm/pull/44605)
- 當未設定 Arize 憑證時，在 OTel v2 上跳過操作員 Arize 匯出器，讓僅團隊目的地匯出 - [PR #44596](https://github.com/BerriAI/litellm/pull/44596)
- 在 OTel v2 上遵循逐團隊的 `arize_success_sampling_rate` 與 `arize_error_sampling_rate`，整體保留或丟棄每個追蹤 - [PR #44595](https://github.com/BerriAI/litellm/pull/44595)

#### Prometheus {#prometheus}

- 為專案逐模型限制新增 `litellm_project_model_rate_limit_allowed_metric` 與 `litellm_project_model_rate_limit_used_metric` gauges，外加 Grafana 儀表板面板 - [PR #43561](https://github.com/BerriAI/litellm/pull/43561)
- 新增 `prometheus_metrics_max_series_per_metric` 以限制每個標記指標的 series，將溢出計入 `other` series，並以 `prometheus_metrics_ttl_seconds` 丟棄閒置 series - [PR #44420](https://github.com/BerriAI/litellm/pull/44420)
- 為端到端延遲指標新增 `model_group` 標籤 - [PR #44860](https://github.com/BerriAI/litellm/pull/44860)

#### 一般 {#general-2}

- 每個失敗的串流請求觸發一次失敗回呼，讓 `s3_v2` 寫入一個失敗物件，而非每次重試一個 - [PR #44442](https://github.com/BerriAI/litellm/pull/44442)
- 限制用於記錄截斷的 base64 data URI regex，讓帶有許多 `data:` 行的提示不再拖住代理程式 - [PR #45132](https://github.com/BerriAI/litellm/pull/45132)
- 為內部子呼叫跳過同步成功回呼，讓 `litellm.aquery` RAG 呼叫記錄 completion 而非向量儲存搜尋 - [PR #45345](https://github.com/BerriAI/litellm/pull/45345)
- 將 `/v1/messages` 串流中途失敗記錄為失敗支出資料列並執行失敗回呼，與 `/v1/chat/completions` 一致 - [PR #44800](https://github.com/BerriAI/litellm/pull/44800)
- 明確的 `metadata.trace_id` 與 `metadata.session_id` 現在在 chat、Responses 與 Messages 上優先於 `traceparent` 與 `baggage` 標頭備援 - [PR #43688](https://github.com/BerriAI/litellm/pull/43688)
- 僅在呼叫實際抵達 Postgres 時發出 `postgres` 服務 spans 與 `litellm_db_*` 指標，而非在記憶體內驗證快取命中時 - [PR #44148](https://github.com/BerriAI/litellm/pull/44148)
- 當最後的串流區塊同時帶有內容與完成原因時，記錄提供者最終的 `finish_reason`（例如 `tool_calls`、`length`） - [PR #44318](https://github.com/BerriAI/litellm/pull/44318)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 將金鑰、團隊與專案標籤以及 `spend_logs_metadata` 帶入透傳支出記錄，與原生路由一致 - [PR #42662](https://github.com/BerriAI/litellm/pull/42662)
- 再次透過 `cost_per_token` 為 `deepgram/nova-3` 等逐秒轉錄模型計費，在已知時使用音訊長度 - [PR #44458](https://github.com/BerriAI/litellm/pull/44458)
- 將 Azure Model Router 固定費用加入 `azure/` 部署，如同 `azure_ai/` 已有的做法 - [PR #44876](https://github.com/BerriAI/litellm/pull/44876)
- 以新的 `output_cost_per_image_token_batches` 鍵，依批次影像費率為 Gemini 批次影像輸出 token 定價 - [PR #44897](https://github.com/BerriAI/litellm/pull/44897)
- 跨 pods 與重新啟動持久地為背景 Gemini interactions 計費，並對已刪除或未知的 interaction 回傳 Gemini 的 404 或 400 - [PR #41955](https://github.com/BerriAI/litellm/pull/41955)
- 透過模型別名的串流請求依部署的模型定價，與非串流請求一致 - [PR #44341](https://github.com/BerriAI/litellm/pull/44341)
- 僅在部署自身的提供者內將部署的定價 id 與成本對照表配對，讓明確的 `model_info` 價格不再於 id 衝突時以 $0 計費 - [PR #45472](https://github.com/BerriAI/litellm/pull/45472)
- 當提供者回傳 404 時，將 ZDR 背景回應標記為 `stale_expired`，而非每小時重新輪詢它們 7 天 - [PR #41724](https://github.com/BerriAI/litellm/pull/41724)
- 為 chat 到 Responses 橋接上的大型非串流聊天請求記錄一次支出，它們先前被收費兩次 - [PR #44508](https://github.com/BerriAI/litellm/pull/44508)

### 支出記錄與每日彙總 {#spend-logs-and-daily-rollups}

- 當 Postgres 連線耗盡時重新排隊支出記錄批次，而非丟棄每個資料列 - [PR #44270](https://github.com/BerriAI/litellm/pull/44270)
- 以 `SPEND_ROLLUP_LOCK_TIMEOUT_MS`（預設 5000 ms）限制每日支出彙總的資料列鎖定等待，並重試逾時的批次而非丟棄它們 - [PR #44450](https://github.com/BerriAI/litellm/pull/44450)、[PR #45273](https://github.com/BerriAI/litellm/pull/45273)
- 新增帶有 `include` 或 `exclude` 清單的 `general_settings.spend_logs_metadata_fields`，以選擇哪些中繼資料鍵儲存在 `LiteLLM_SpendLogs` 中 - [PR #44659](https://github.com/BerriAI/litellm/pull/44659)

### 預算 {#budgets}

- 在金鑰的預算重設視窗內投射軟預算警示，而非到日曆月底 - [PR #31942](https://github.com/BerriAI/litellm/pull/31942)
- 在零成本預算檢查中解析隱藏的 `model_group_alias` 條目 - [PR #43741](https://github.com/BerriAI/litellm/pull/43741)
- 依別名路由到的群組判斷免費模型預算豁免 - [PR #44638](https://github.com/BerriAI/litellm/pull/44638)
- 在團隊成員資料列上顯示停用的 Reset spend 圖示並帶有說明工具提示，而非隱藏它 - [PR #44629](https://github.com/BerriAI/litellm/pull/44629)
- 在 UI 中清除團隊成員的 Default Budget 現在移除上限，而非儲存 $0 - [PR #44644](https://github.com/BerriAI/litellm/pull/44644)

### 速率限制 {#rate-limiting}

- 為批次檔案新增 `max_batch_file_records`、`max_batch_file_uploads_per_day` 與 `max_file_downloads_per_minute` 上限，可由代理程式管理員逐金鑰或團隊設定 - [PR #43632](https://github.com/BerriAI/litellm/pull/43632)
- 立即在每個代理程式上套用使用者 TPM/RPM 限制變更，以明確的 `null` 清除它們，並在 Users 頁面上編輯 - [PR #44130](https://github.com/BerriAI/litellm/pull/44130)
- 新增選用的 `litellm_settings.force_redis_hash_tag_grouping`，讓 v3 速率限制器可在 Azure Managed Redis 等 Redis Enterprise 叢集上運作 - [PR #45085](https://github.com/BerriAI/litellm/pull/45085)
- 在 v1 平行請求限制器中每個操作讀取一次時鐘，讓逐分鐘金鑰不會在分鐘切換時撕裂 - [PR #45522](https://github.com/BerriAI/litellm/pull/45522)

## MCP 閘道 {#mcp-gateway}

### 驗證與 OAuth {#auth-and-oauth}

- 永遠不要將呼叫者的 LiteLLM 金鑰轉送到上游 MCP 伺服器，包括透過設為 `x-litellm-api-key` 的 Extra Headers - [PR #45401](https://github.com/BerriAI/litellm/pull/45401)
- 透過發佈 `GET /oauth/client-metadata.json` 支援僅接受 Client ID Metadata Documents 的 OAuth 提供者，並以 `general_settings.mcp_prefer_client_id_metadata_document` 使其優先於動態註冊 - [PR #45231](https://github.com/BerriAI/litellm/pull/45231)
- 將 OAuth 用戶端綁定到其上游 issuer，讓將伺服器編輯為新 issuer 時對新 issuer 授權，並拒絕未驗證的回呼 issuers - [PR #37777](https://github.com/BerriAI/litellm/pull/37777)
- 在用戶端註冊期間轉送 `application_type`，讓帶有 loopback 重新導向的原生 MCP 用戶端可註冊 - [PR #45159](https://github.com/BerriAI/litellm/pull/45159)
- 讓對應的呼叫者 JWT 保持請求本機性，使其到達 MCP 防護欄，且受防護的工具呼叫成功 - [PR #45901](https://github.com/BerriAI/litellm/pull/45901)

### 速率限制與防護欄 {#rate-limits-and-guardrails}

- 對每個 MCP 操作（list、get 與 read，不僅 `tools/call`）進行速率限制，並新增所有呼叫者共用的伺服器層級 `rpm`，可在 Admin UI 中設定 - [PR #44600](https://github.com/BerriAI/litellm/pull/44600)
- 將列出的工具說明與輸入 schema 交給呼叫前防護欄 hooks - [PR #41162](https://github.com/BerriAI/litellm/pull/41162)

### 通訊協定與目錄 {#protocol-and-catalog}

- 接受明確設定的現代 MCP 上游（例如 `protocol_version: "2026-07-28"`），並在儲存前拒絕不相容的傳輸設定 - [PR #44232](https://github.com/BerriAI/litellm/pull/44232)
- 以可在任何複本上恢復的不透明 `nextCursor` 值分頁 `tools/list`、prompts 與 resources - [PR #44446](https://github.com/BerriAI/litellm/pull/44446)
- 讓舊版用戶端回答來自現代上游的輸入請求，延續狀態綁定到呼叫者與上游 - [PR #45464](https://github.com/BerriAI/litellm/pull/45464)
- 當 elicitation 轉送失敗時回傳明確的工具錯誤，而非捏造的使用者拒絕 - [PR #45255](https://github.com/BerriAI/litellm/pull/45255)
- 在 REST 探索中保留上游工具 schema、註解與中繼資料，傳送 schema 衍生的參數標頭，並在不取得外部 `$ref` schema 的情況下離線驗證引數 - [PR #44425](https://github.com/BerriAI/litellm/pull/44425)
- 透過目錄修訂讓 MCP 伺服器設定在各 worker 間保持一致，讓建立、編輯與刪除立即在每個 worker 上套用 - [PR #42568](https://github.com/BerriAI/litellm/pull/42568)
- 遵循上游新鮮度，並將快取的探索結果限定於呼叫者、憑證與目標 - [PR #45165](https://github.com/BerriAI/litellm/pull/45165)

### Admin MCP 與 UI {#admin-mcp-and-ui}

- 將 Enterprise LiteAdmin MCP 嵌入於 `/admin/mcp`，以 `LITELLM_ENABLE_ADMIN_MCP=true` 啟用 - [PR #44610](https://github.com/BerriAI/litellm/pull/44610)
- 在 Submitted MCPs 頁籤中顯示已儲存的 MCP 提交規則，並阻止儲存規則編輯器清除它們 - [PR #44648](https://github.com/BerriAI/litellm/pull/44648)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

### Auto Router 與模型路由 {#auto-router-and-model-routing}

- 在優先請求被准入、逾時或取消後移除其排程器佇列條目，修正約一半優先請求上 Redis 支援的 `TypeError`，以及過時條目在冷卻期間封鎖請求 - [PR #43061](https://github.com/BerriAI/litellm/pull/43061)
- 同步串流備援在設定的備份上恢復，而非重試失敗的主要目標直到遞迴失敗 - [PR #43959](https://github.com/BerriAI/litellm/pull/43959)
- 在同步 `Router.completion` 路徑上讓 `include_fallback_errors` 不進入提供者呼叫，讓 OpenAI 不再以 400 `Unknown parameter` 回應 - [PR #45218](https://github.com/BerriAI/litellm/pull/45218)
- 當串流在開啟後失敗時，遵循逐請求的 `fallbacks`、`context_window_fallbacks` 或 `content_policy_fallbacks` 清單，並阻止從儀表板儲存的 `null` 金鑰與團隊路由器設定關閉路由器層級的備援與重試 - [PR #45227](https://github.com/BerriAI/litellm/pull/45227)
- 每個備援跳點都丟棄其目標部署無法解密的加密推理並保留摘要，涵蓋 Responses、chat、Anthropic messages 與串流中途路徑 - [PR #45393](https://github.com/BerriAI/litellm/pull/45393)
- 依提供服務的部署為模型群組定價，而非跟隨群組自身的別名，讓預算豁免與 `GET /model_group/info` 與路由一致 - [PR #44732](https://github.com/BerriAI/litellm/pull/44732)
- 必要參數驗證接受 `router_settings.default_litellm_params` 提供的值，讓沒有 `max_tokens` 的 `/v1/messages` 與沒有 `documents` 的 `/rerank` 在路由器預設涵蓋時不再回傳 400 - [PR #44483](https://github.com/BerriAI/litellm/pull/44483)
- 將每個背景健康檢查結果歸屬到其自身的 `model_id`，讓 `GET /health/latest` 不再於部署共用一個 `litellm_params.model` 時將已死主機標記為健康 - [PR #44982](https://github.com/BerriAI/litellm/pull/44982)
- 將上游 402 回應對應到 `PaymentRequiredError`（`BadRequestError` 子類別），並在多部署群組中冷卻 402 部署 - [PR #44879](https://github.com/BerriAI/litellm/pull/44879)
- 讓 auto-router 基準的快取身分與會計不受層級覆寫與重複回呼影響 - [PR #44960](https://github.com/BerriAI/litellm/pull/44960)
- Auto Router 路由預覽與提供服務以相同方式解析預設模型，且提供服務在推斷層級預設之前遵循 `config.default_model` - [PR #44436](https://github.com/BerriAI/litellm/pull/44436)
- Auto Router UI 僅顯示選取 heuristic 的調整，分離 Heuristic 與 LLM 調整，並在鏈接時支援 v1 或 v2 heuristics - [PR #44928](https://github.com/BerriAI/litellm/pull/44928)
- 阻止 SDK 重試在 `aresponses` 等非同步路由器呼叫上巢狀於路由器重試之內，讓 `num_retries: 2` 產生 3 次提供者嘗試而非 9 次 - [PR #44791](https://github.com/BerriAI/litellm/pull/44791)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 新增 `cache_params.max_messages`（預設 4）：帶有更多訊息或 Responses `input` 項目的請求既不查閱也不儲存，且語義快取現在嵌入 Messages API `tool_result` 文字與清單形式的 Responses 工具輸出 - [PR #43878](https://github.com/BerriAI/litellm/pull/43878)
- 以 `litellm_metadata` 中承載的路由器模型群組為回應快取鍵，讓 `/v1/responses` 快取條目不再跨模型群組洩漏 - [PR #44542](https://github.com/BerriAI/litellm/pull/44542)
- 在記憶體中排隊每日模型用量，並在支出記錄排清時寫入，而非逐請求 upsert - [PR #44243](https://github.com/BerriAI/litellm/pull/44243)
- 將 Postgres 連線耗盡（`53300`、Prisma `P2024`）視為背壓：重新排隊工具用量批次、在金鑰查閱時回傳 503、跳過引擎重新連線、新增 `database_idle_in_transaction_session_timeout`，並在啟動時列印逐 pod 連線預算 - [PR #44266](https://github.com/BerriAI/litellm/pull/44266)
- 當 `log_db_metrics` 失敗 hook 本身引發時，保留原始資料庫錯誤 - [PR #44383](https://github.com/BerriAI/litellm/pull/44383)
- 以 ERROR 記錄 v1 migration 失敗，讓 `LITELLM_LOG=ERROR` 顯示 Prisma 錯誤與重試計數 - [PR #44202](https://github.com/BerriAI/litellm/pull/44202)
- 當設定了 `DATABASE_URL` 但缺少 Prisma 工具鏈時，以一個明確錯誤結束，包括在 `--skip_server_startup` migration 進入點上 - [PR #44207](https://github.com/BerriAI/litellm/pull/44207)
- 當 Lens 重新命名檢查無法連線 Postgres 時，包含資料庫錯誤文字（密碼已遮蔽） - [PR #45341](https://github.com/BerriAI/litellm/pull/45341)
- 新增 `LITELLM_FIPS_MODE` 啟動閘門，除非 OpenSSL 強制 FIPS 否則拒絕啟動，拒絕停用的 TLS 驗證，並在密碼 migration 加密失敗時停止啟動 - [PR #42700](https://github.com/BerriAI/litellm/pull/42700)
- 以一行記錄回答 `/v1/responses` 或 `/v1/realtime` 上被拒絕的 websocket 握手，而非 ASGI 崩潰 traceback - [PR #45251](https://github.com/BerriAI/litellm/pull/45251)
- 使用 `num_retries`，在模型群組內重試提供者在第一個內容區塊之前丟棄的 `/v1/messages` 串流 - [PR #44276](https://github.com/BerriAI/litellm/pull/44276)
- 永遠不要儲存或提供沒有輸出的快取 chat completion、Responses 或 Messages 答案 - [PR #44709](https://github.com/BerriAI/litellm/pull/44709)
- 阻止 `prompt_caching` 呼叫前檢查將整個對話 token 化，削減超大提示的 LLM 前時間，並新增請求階段 span 事件 - [PR #44221](https://github.com/BerriAI/litellm/pull/44221)
- 延遲載入企業警示記錄器，讓 `import litellm` 不再載入代理程式型別 - [PR #44762](https://github.com/BerriAI/litellm/pull/44762)
- 從 `litellm-core` 相依性中丟棄 `boto3`、`tokenizers` 與 `huggingface-hub`，並僅在需要處載入它們 - [PR #44447](https://github.com/BerriAI/litellm/pull/44447)
- 阻止排隊的模型登錄 read-through 耗用重新同步預算，修正新增模型後立即爆發的 400 `Invalid model name` - [PR #44277](https://github.com/BerriAI/litellm/pull/44277)
- 將 LiteLLM 模型的 pydantic schema 建置延遲到首次使用，跳過代理程式匯入時約 1,380 次 schema 建置；設定 `DEFER_PYDANTIC_BUILD=false` 可再次 eager 建置。延遲建置跨執行緒序列化，讓新 worker 上的第一批並行請求不再以 400 失敗 - [PR #44720](https://github.com/BerriAI/litellm/pull/44720)、[PR #45034](https://github.com/BerriAI/litellm/pull/45034)

### Docker 與 Helm {#docker-and-helm}

- 一鍵 Docker quickstart（`scripts/quickstart.sh`），啟動閘道、Postgres 與管理 UI，生成金鑰與隨機 Postgres 密碼，挑選可用連接埠並綁定到 127.0.0.1 - [PR #43673](https://github.com/BerriAI/litellm/pull/43673)
- Windows PowerShell quickstart（`scripts/quickstart.ps1`），兩個 quickstart 的樣式化終端輸出，以及 podman 與 nerdctl 支援 - [PR #44310](https://github.com/BerriAI/litellm/pull/44310)
- Helm `migrationJob` 接受 `jobLabels`、`jobAnnotations`、`podLabels`、`command` 與 `args` - [PR #42242](https://github.com/BerriAI/litellm/pull/42242)
- 移除從未被任何範本讀取的 `migrationJob.retries` 與 `migrationJob.disableSchemaUpdate` Helm 值；使用 `migrationJob.enabled: false` 跳過 migration Job - [PR #42141](https://github.com/BerriAI/litellm/pull/42141)
- 在 pgbouncer-builder 階段釘選 `openssl-3.6-dev`，然後還原釘選，因為沒有 runtime 階段附帶 `libssl3`；pgbouncer 再次對未釘選的 `openssl-dev` 建置 - [PR #44991](https://github.com/BerriAI/litellm/pull/44991)、[PR #44997](https://github.com/BerriAI/litellm/pull/44997)

### 相依性更新 {#dependency-updates}

- 提升 source-map-js、smol-toml、mako、multidict 與 werkzeug 以清除 OSV 公告 - [PR #44728](https://github.com/BerriAI/litellm/pull/44728)
- 將 langgraph-sdk 從 0.4.2 提升到 0.4.4 - [PR #44713](https://github.com/BerriAI/litellm/pull/44713)
- 將儀表板的 next 提升到 16.3.8 以清除 osv-scan - [PR #45207](https://github.com/BerriAI/litellm/pull/45207)

## 文件更新 {#documentation-updates}

- 為 Rust 核心新增架構決策記錄 - [PR #45205](https://github.com/BerriAI/litellm/pull/45205)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 166 個 PR 變更測試、CI、貢獻者工具、發行封裝，或尚未接入使用者路徑的 Rust runtime scaffolding。它們本身不會改變代理程式或 SDK 行為

<details>
<summary>翻譯測試矩陣 (14)</summary>

- 在共用假提供者與共用 YAML 部署上的精確四部分翻譯案例 - [PR #44451](https://github.com/BerriAI/litellm/pull/44451)
- 六個 Claude 模型在 messages、chat completions 與 responses 上的 Anthropic 路由基本翻譯案例 - [PR #44607](https://github.com/BerriAI/litellm/pull/44607)
- 現在橋接會回顯請求參數，執行 Anthropic /v1/responses 基本翻譯案例 - [PR #44615](https://github.com/BerriAI/litellm/pull/44615)
- 六個 Claude 模型的 Bedrock Converse 路由基本翻譯案例 - [PR #44646](https://github.com/BerriAI/litellm/pull/44646)
- 六個 Claude 模型的 Azure AI 路由基本翻譯案例 - [PR #44658](https://github.com/BerriAI/litellm/pull/44658)
- gemini 路由的基本翻譯案例 - [PR #44662](https://github.com/BerriAI/litellm/pull/44662)
- openai_responses 路由的基本翻譯案例 - [PR #44663](https://github.com/BerriAI/litellm/pull/44663)
- openai 路由的基本翻譯案例 - [PR #44667](https://github.com/BerriAI/litellm/pull/44667)
- azure 路由的基本翻譯案例 - [PR #44672](https://github.com/BerriAI/litellm/pull/44672)
- 將翻譯執行器的 run 重新命名為 assert_translation - [PR #44741](https://github.com/BerriAI/litellm/pull/44741)
- bedrock_mantle 路由的基本翻譯案例 - [PR #44750](https://github.com/BerriAI/litellm/pull/44750)
- vertex_ai 路由的基本翻譯案例 - [PR #44751](https://github.com/BerriAI/litellm/pull/44751)
- bedrock_invoke 路由的基本翻譯案例 - [PR #44752](https://github.com/BerriAI/litellm/pull/44752)
- hosted_vllm /v1/decisions 與提供者 400 翻譯案例 - [PR #45661](https://github.com/BerriAI/litellm/pull/45661)

</details>

<details>
<summary>E2E harness 與中繼資料 (13)</summary>

- 透過路由器斷言同級複本冷卻 - [PR #44706](https://github.com/BerriAI/litellm/pull/44706)
- e2e 中繼資料的 Enum 值、自動探索標籤閘門與機密隱藏 - [PR #44949](https://github.com/BerriAI/litellm/pull/44949)
- 以 Subject 中繼資料標記 llm_translation 測試並記錄 harness 步驟 - [PR #44950](https://github.com/BerriAI/litellm/pull/44950)
- 以 Subject 中繼資料標記 claude_code 單元並記錄 CLI 驅動步驟 - [PR #44961](https://github.com/BerriAI/litellm/pull/44961)
- 以 Subject 中繼資料標記管理測試並記錄管理用戶端步驟 - [PR #44962](https://github.com/BerriAI/litellm/pull/44962)
- 以 Subject 中繼資料標記防護欄與記錄測試並記錄用戶端步驟 - [PR #44963](https://github.com/BerriAI/litellm/pull/44963)
- 以 Subject 中繼資料標記路由器、批次與 MCP 測試並記錄用戶端步驟 - [PR #44964](https://github.com/BerriAI/litellm/pull/44964)
- 以 Subject 中繼資料標記 a2a、access_control、other、secret_manager 與 migrations 測試 - [PR #44965](https://github.com/BerriAI/litellm/pull/44965)
- 標記其餘 quota_management 測試並記錄預算與支出用戶端步驟 - [PR #44966](https://github.com/BerriAI/litellm/pull/44966)
- 讓即時傳送步驟接受輸入音訊緩衝影格 - [PR #45127](https://github.com/BerriAI/litellm/pull/45127)
- 為原始傳輸呼叫與輪詢輔助工具記錄步驟 - [PR #45150](https://github.com/BerriAI/litellm/pull/45150)
- 將 harness 自我測試移出 tests/e2e，讓它們不再膨脹 e2e 計數 - [PR #45172](https://github.com/BerriAI/litellm/pull/45172)
- 涵蓋 Gemini、Azure、compact 與上下文管理上的 Responses API 缺口 - [PR #45248](https://github.com/BerriAI/litellm/pull/45248)

</details>

<details>
<summary>舊版測試清理 (11)</summary>

- 移除 130 個由更強單元證明擁有的舊版測試 - [PR #44157](https://github.com/BerriAI/litellm/pull/44157)
- 將整單元舊版測試檔案移入 tests/unit 並刪除無用的 skips - [PR #44807](https://github.com/BerriAI/litellm/pull/44807)
- 將 126 個混合舊版檔案的單元部分移入 tests/unit - [PR #45090](https://github.com/BerriAI/litellm/pull/45090)
- 刪除 73 個已被 e2e 涵蓋、無法失敗或在 CI 中無用的舊版測試 - [PR #45195](https://github.com/BerriAI/litellm/pull/45195)
- 移除舊版測試刪除後遺留的無用匯入與輔助工具 - [PR #45208](https://github.com/BerriAI/litellm/pull/45208)
- 將 pass-through、spend、batches、audio、search、guardrails、image 與 OCR 目錄中 81 個舊版即時測試移為離線 - [PR #45288](https://github.com/BerriAI/litellm/pull/45288)
- 將 litellm_utils、router_unit 與 responses 目錄中 77 個舊版即時測試改為離線 - [PR #45298](https://github.com/BerriAI/litellm/pull/45298)
- 刪除 34 個已被 e2e 涵蓋的舊版測試 - [PR #45340](https://github.com/BerriAI/litellm/pull/45340)
- 將 38 個舊版即時基礎類別翻譯測試改為離線 - [PR #45351](https://github.com/BerriAI/litellm/pull/45351)
- 將 76 個即時頂層測試移至離線單元與整合覆蓋 - [PR #45352](https://github.com/BerriAI/litellm/pull/45352)
- 以離線單元與整合覆蓋取代 61 個即時記錄與 OTel 測試 - [PR #45362](https://github.com/BerriAI/litellm/pull/45362)

</details>

<details>
<summary>測試修正與新覆蓋 (43)</summary>

- 依條件而非實際時間觸發 MCP 用戶端測試期限 - [PR #44166](https://github.com/BerriAI/litellm/pull/44166)
- 將設定透傳支出記錄案例選入驗證 - [PR #44265](https://github.com/BerriAI/litellm/pull/44265)
- 讓整合 run.py 依 pytest node id 選取單元 - [PR #44319](https://github.com/BerriAI/litellm/pull/44319)
- 為透傳驗證迴歸測試提供真正的 FastAPI 應用程式 - [PR #44403](https://github.com/BerriAI/litellm/pull/44403)
- 以混合動作釘選 OpenAI 回報的網頁搜尋計數 - [PR #44414](https://github.com/BerriAI/litellm/pull/44414)
- 修正 main 上由漂移測試與洩漏狀態造成的六個 CircleCI 測試迴歸 - [PR #44429](https://github.com/BerriAI/litellm/pull/44429)
- 在 owned-proxy 連接埠競態重試中配對 OS bind 錯誤 - [PR #44462](https://github.com/BerriAI/litellm/pull/44462)
- 在 TraceDrawer 測試中等待步驟搜尋值穩定 - [PR #44470](https://github.com/BerriAI/litellm/pull/44470)
- 阻止 SSO 斷言往返在隨機密文中配對其 refresh token - [PR #44494](https://github.com/BerriAI/litellm/pull/44494)
- 在兩個漂移測試中釘選 ROI 估計器旗標與提示快取計數器 - [PR #44499](https://github.com/BerriAI/litellm/pull/44499)
- 在追蹤端點測試中將 Lens 預覽主體作為 selection 傳送 - [PR #44525](https://github.com/BerriAI/litellm/pull/44525)
- 為 ROI、JWKS 與發行身分變更修復安全掃描與 Lens 計費整合測試 - [PR #44529](https://github.com/BerriAI/litellm/pull/44529)
- 斷言 Mantle Claude 上的 Messages API 健康探測 - [PR #44612](https://github.com/BerriAI/litellm/pull/44612)
- 將 scratch 升級代理程式的讀取複本指向 scratch 資料庫 - [PR #44613](https://github.com/BerriAI/litellm/pull/44613)
- 為串流 claude-sonnet-5 無用量案例釘選 Claude-tokenizer 重新計數 - [PR #44643](https://github.com/BerriAI/litellm/pull/44643)
- 讓腳本化上游連線保持開啟超過代理程式的 keepalive - [PR #44695](https://github.com/BerriAI/litellm/pull/44695)
- 預期 PartRow start_time 與 end_time 為必要的 LENS_CONTENT 欄位 - [PR #44719](https://github.com/BerriAI/litellm/pull/44719)
- 在計費整合測試中使用目前的 Lens worker 通訊協定 - [PR #44760](https://github.com/BerriAI/litellm/pull/44760)
- 在追蹤 seed 中為 Claude 工作階段 id 命名空間，並在後端允許清單新的 `/v1/logs` 路由 - [PR #44761](https://github.com/BerriAI/litellm/pull/44761)
- 擷取 Rust 快取測試拆分 - [PR #44780](https://github.com/BerriAI/litellm/pull/44780)
- 讓 JEV 分類器選取與兩個繼承洩漏狀態的路由器測試不再不穩定 - [PR #44840](https://github.com/BerriAI/litellm/pull/44840)
- 修正 CircleCI 套件中共用提供者探索、Codex 目錄大小與生成的主金鑰不符 - [PR #44905](https://github.com/BerriAI/litellm/pull/44905)
- 從模型自身模組解析延遲的 pydantic 模型名稱，並新增缺失的 Lens review 外鍵 migration，兩者都是本版本變更的修正 - [PR #44981](https://github.com/BerriAI/litellm/pull/44981)
- 在行程內執行靜態根路徑 issuer 探索測試 - [PR #44988](https://github.com/BerriAI/litellm/pull/44988)
- 在 OpenAPI 本機假工具上設定 server_id - [PR #44998](https://github.com/BerriAI/litellm/pull/44998)
- 在有上限的可觀測性測試中等待暖機支出資料列，並在 X4 中僅計數清除後的一半 - [PR #45006](https://github.com/BerriAI/litellm/pull/45006)
- 修正過時的 MCP bridge-hook、applied-guardrails 與 pagination-revoke 整合測試 - [PR #45008](https://github.com/BerriAI/litellm/pull/45008)
- 讓 stagger-offset 與 linear-dedup 防護獨立於 runner 身分與負載 - [PR #45031](https://github.com/BerriAI/litellm/pull/45031)
- 在 owned-proxy 連接埠競態重試中配對小寫的 bind 錯誤 - [PR #45097](https://github.com/BerriAI/litellm/pull/45097)
- 在每個整合代理程式設定中關閉 model-info 重新整理 - [PR #45104](https://github.com/BerriAI/litellm/pull/45104)
- 將團隊範圍模型上游檢查限定於其自身模型 - [PR #45106](https://github.com/BerriAI/litellm/pull/45106)
- 保持 wire 屏障，直到測試釋放它或 wire 關閉 - [PR #45124](https://github.com/BerriAI/litellm/pull/45124)
- 讓雜項單元測試與 NativeCall 橋接及放寬的 e2e diff 閘門一致 - [PR #45180](https://github.com/BerriAI/litellm/pull/45180)
- 還原被 get_optional_params 測試變更的 Vertex 模型集合 - [PR #45209](https://github.com/BerriAI/litellm/pull/45209)
- 在路由測試中等待部署註冊，而非啟動 model-info 流量 - [PR #45267](https://github.com/BerriAI/litellm/pull/45267)
- 以就緒大小的 worker 健康檢查預算啟動 owned proxies - [PR #45292](https://github.com/BerriAI/litellm/pull/45292)
- 稽核每個即時路由上的 websocket 拒絕記錄 - [PR #45293](https://github.com/BerriAI/litellm/pull/45293)
- 在重新設計後更新 UI e2e 測試中的 Usage 頁面選取器 - [PR #45347](https://github.com/BerriAI/litellm/pull/45347)
- 在沒有訊息上限的代理程式上執行回應快取工具呼叫測試 - [PR #45350](https://github.com/BerriAI/litellm/pull/45350)
- 從 Voyage 路由測試中丟棄公開已知的主金鑰前綴 - [PR #45431](https://github.com/BerriAI/litellm/pull/45431)
- 在橋接的 /v1/messages 錯誤影格中預期未包裝的提供者錯誤 - [PR #45465](https://github.com/BerriAI/litellm/pull/45465)
- 在 Rust 追蹤測試中從 pytest scripts 路徑匯入 seed_tracing_fixtures - [PR #45485](https://github.com/BerriAI/litellm/pull/45485)
- 更新過時的 MCP call_tool 與用量卡片斷言，並為請求記錄索引啟動測試新增逾時餘裕 - [PR #45523](https://github.com/BerriAI/litellm/pull/45523)

</details>

<details>
<summary>CI、lint 閘門與貢獻者工具 (20)</summary>

- 以其 merge-base 計數閘控每個 lint 規則，並將 `Any` 上限設為固定的全 codebase 總量，取代預算檔案 - [PR #40193](https://github.com/BerriAI/litellm/pull/40193)
- 新增 lint 規則 LIT015，要求 pydantic 模型為 frozen - [PR #42348](https://github.com/BerriAI/litellm/pull/42348)
- 抑制未修正的 braces GHSA-vfj7-8cjw-p6xm（僅儀表板 devDependency）以清除 osv-scan，於 2026-11-03 到期 - [PR #44347](https://github.com/BerriAI/litellm/pull/44347)
- 將 Postgres、MCP 與 Redis 套件移至 CircleCI integration - [PR #44453](https://github.com/BerriAI/litellm/pull/44453)
- 從 GitHub Actions test-path 執行單元選取，並丟棄 CircleCI 單元工作 - [PR #44461](https://github.com/BerriAI/litellm/pull/44461)
- 在 xlarge 機器上執行 integration-mcp - [PR #44608](https://github.com/BerriAI/litellm/pull/44608)
- 拆分緩慢的單元分片，並每次執行建置一次 Rust 橋接 - [PR #44622](https://github.com/BerriAI/litellm/pull/44622)
- 將 PR 範本移至 PULL_REQUEST_TEMPLATE/general.md，並新增 Rust 範本 - [PR #44693](https://github.com/BerriAI/litellm/pull/44693)
- 在主金鑰防護中跳過生成的儀表板套件 - [PR #44890](https://github.com/BerriAI/litellm/pull/44890)
- 為 migration 啟動工作生成主金鑰 - [PR #44978](https://github.com/BerriAI/litellm/pull/44978)
- 給資料庫支援的 CircleCI 工作它們自己的 Postgres - [PR #45007](https://github.com/BerriAI/litellm/pull/45007)
- 在完整掃描上執行預設 CodeQL 套件，在 PR 上執行 security-extended - [PR #45149](https://github.com/BerriAI/litellm/pull/45149)
- 為重新命名的維護者帳號更新 CODEOWNERS - [PR #45173](https://github.com/BerriAI/litellm/pull/45173)
- 在空的基礎掃描上讓 lint 閘門失敗，然後還原它，因為零違規是合法計數 - [PR #45314](https://github.com/BerriAI/litellm/pull/45314)、[PR #45319](https://github.com/BerriAI/litellm/pull/45319)
- 修剪 rust-test debuginfo，讓工作能放進 runner 磁碟 - [PR #45318](https://github.com/BerriAI/litellm/pull/45318)
- 新增 `unit passed` 收集器工作，並將 proxy-db 分片併入 test-unit.yml - [PR #45466](https://github.com/BerriAI/litellm/pull/45466)
- 將 lint、unit 與 smoke 檢查渲染為 `<tier> / <job>`，每層一個必要的收集器 - [PR #45480](https://github.com/BerriAI/litellm/pull/45480)
- 僅在 PR CircleCI pipelines 上執行整合工作，並將路由器與防護欄套件移至 GitHub Actions - [PR #45509](https://github.com/BerriAI/litellm/pull/45509)
- 在 rc/1.106.0 上每個 CircleCI pipeline 中執行每個 build_and_test 工作 - [PR #45651](https://github.com/BerriAI/litellm/pull/45651)

</details>

<details>
<summary>Rust runtime 與 Python 橋接 (17)</summary>

- 透過 strum 與 serde_with 推導字串 enum serde - [PR #44675](https://github.com/BerriAI/litellm/pull/44675)
- 將 litellm-framing crate 重新命名為 litellm-framer - [PR #44683](https://github.com/BerriAI/litellm/pull/44683)
- 將 litellm-core 重新命名為 litellm-inference - [PR #44802](https://github.com/BerriAI/litellm/pull/44802)
- 擷取 inference-transcription crate - [PR #44809](https://github.com/BerriAI/litellm/pull/44809)
- 擷取 inference-responses crate - [PR #44811](https://github.com/BerriAI/litellm/pull/44811)
- 擷取 inference-messages crate - [PR #44818](https://github.com/BerriAI/litellm/pull/44818)
- 擷取 inference-chat crate - [PR #44827](https://github.com/BerriAI/litellm/pull/44827)
- 擷取 inference-ocr crate - [PR #44832](https://github.com/BerriAI/litellm/pull/44832)
- 修剪 inference crate 相依性並重寫分層文件 - [PR #44836](https://github.com/BerriAI/litellm/pull/44836)
- 擷取 inference-testing crate - [PR #44873](https://github.com/BerriAI/litellm/pull/44873)
- 移除規則閘控的原生 secret-manager 選取 - [PR #44906](https://github.com/BerriAI/litellm/pull/44906)
- 統一原生呼叫輸入與 Messages 設定 - [PR #45126](https://github.com/BerriAI/litellm/pull/45126)
- 在各橋接路由間共用欄位與回應 marshaling - [PR #45187](https://github.com/BerriAI/litellm/pull/45187)
- 直接採用 NativeCall，並將 Python 橋接路由併入逐路由資料夾 - [PR #45413](https://github.com/BerriAI/litellm/pull/45413)
- 推導 strum VariantArray 與字串轉換 - [PR #45434](https://github.com/BerriAI/litellm/pull/45434)
- 推導 NativeCall 擷取 - [PR #45449](https://github.com/BerriAI/litellm/pull/45449)
- 提供簽章基礎，並在 Python 橋接中讀取已解析的呼叫 - [PR #45450](https://github.com/BerriAI/litellm/pull/45450)

</details>

<details>
<summary>重構與型別 (15)</summary>

- 清理 2026-10-02 的新技術債 - [PR #44362](https://github.com/BerriAI/litellm/pull/44362)
- 在 4 個檔案中以已驗證型別取代 Any - [PR #44370](https://github.com/BerriAI/litellm/pull/44370)
- 在 9 個檔案中以已驗證型別取代 Any - [PR #44389](https://github.com/BerriAI/litellm/pull/44389)
- 在 137 個檔案中以已驗證型別取代 Any - [PR #44478](https://github.com/BerriAI/litellm/pull/44478)
- 清理 2026-10-03 的新技術債 - [PR #44484](https://github.com/BerriAI/litellm/pull/44484)
- 在 6 個檔案中以已驗證型別取代 Any - [PR #44491](https://github.com/BerriAI/litellm/pull/44491)
- 丟棄 harness 選項中未使用的 `Any` 匯入，它曾讓 main 上的 lint 失敗 - [PR #44625](https://github.com/BerriAI/litellm/pull/44625)、[PR #44627](https://github.com/BerriAI/litellm/pull/44627)
- 將 SpanAttributes、SpecialHeaders 與 AllowedModelRegion 移出 `litellm.proxy._types`，後者仍重新匯出它們 - [PR #44717](https://github.com/BerriAI/litellm/pull/44717)
- 在 SDK 模組中於 TYPE_CHECKING 之下匯入僅代理程式型別，讓 `import litellm` 跳過 `litellm.proxy._types` - [PR #44740](https://github.com/BerriAI/litellm/pull/44740)
- 在 157 個檔案中以已驗證型別取代 Any - [PR #44798](https://github.com/BerriAI/litellm/pull/44798)
- 移除 2026-10-05 視窗的新技術債 - [PR #44821](https://github.com/BerriAI/litellm/pull/44821)
- 以公開名稱公開核心私人輔助工具，舊名稱保留為別名 - [PR #44871](https://github.com/BerriAI/litellm/pull/44871)
- 移除 2026-10-06 視窗的新技術債 - [PR #45017](https://github.com/BerriAI/litellm/pull/45017)
- 在 16 個檔案中以已驗證型別取代 Any - [PR #45029](https://github.com/BerriAI/litellm/pull/45029)

</details>

<details>
<summary>發行與封裝 (5)</summary>

- 在 main 上提升 litellm-proxy-extras 0.4.104 -&gt; 0.4.105 - [PR #44234](https://github.com/BerriAI/litellm/pull/44234)
- 提升 litellm-enterprise 0.1.73 -&gt; 0.1.74、litellm-proxy-extras 0.4.105 -&gt; 0.4.106、litellm 1.105.0 -&gt; 1.106.0 - [PR #44942](https://github.com/BerriAI/litellm/pull/44942)
- 將 litellm-proxy-extras 提升到 0.4.107，litellm-enterprise 提升到 0.1.75 - [PR #45291](https://github.com/BerriAI/litellm/pull/45291)
- 提升 litellm-enterprise 0.1.75 -&gt; 0.1.76、litellm-proxy-extras 0.4.107 -&gt; 0.4.108 - [PR #45534](https://github.com/BerriAI/litellm/pull/45534)
- 在 rc/1.106.0 上重建 Admin UI 套件 - [PR #45930](https://github.com/BerriAI/litellm/pull/45930)

</details>

<details>
<summary>其他測試與內部變更 (28)</summary>

- 新增 `make lens-dev`，一起執行代理程式、worker 與儀表板，用於本機 Lens 開發 - [PR #44413](https://github.com/BerriAI/litellm/pull/44413)
- 為 ClickHouse 查詢說明回應加上型別 - [PR #44285](https://github.com/BerriAI/litellm/pull/44285)
- 將追蹤快照快取擷取到其自身的 crate - [PR #44424](https://github.com/BerriAI/litellm/pull/44424)
- 從 Rust schema 生成追蹤 HTTP 請求模型 - [PR #44591](https://github.com/BerriAI/litellm/pull/44591)
- 將 Lens 後端作為服務注入，而非假 HTTP 用戶端 - [PR #44369](https://github.com/BerriAI/litellm/pull/44369)
- 將 TraceView 移入 `components/lens/traces` - [PR #44501](https://github.com/BerriAI/litellm/pull/44501)
- 在 Lens 追蹤與記錄間共用 CopyButton - [PR #44513](https://github.com/BerriAI/litellm/pull/44513)
- 擷取共用的時間軸與時間範圍控制 - [PR #44584](https://github.com/BerriAI/litellm/pull/44584)
- 取消追蹤 `tsconfig.tsbuildinfo` 並 gitignore `*.tsbuildinfo` - [PR #44261](https://github.com/BerriAI/litellm/pull/44261)
- 將儀表板遷移到 zod 4 與 openai 6 - [PR #44345](https://github.com/BerriAI/litellm/pull/44345)
- 將儀表板 `view_logs` 元件重新命名為 `logs`，並拆分為 request、audit 與 detail - [PR #44505](https://github.com/BerriAI/litellm/pull/44505)
- 依 `Accept: application/json` 路由開發儀表板 API 呼叫，並對非 JSON 2xx 回應快速失敗 - [PR #44528](https://github.com/BerriAI/litellm/pull/44528)
- 透過 nuqs 解析器路由儀表板 URL 狀態 - [PR #44537](https://github.com/BerriAI/litellm/pull/44537)
- 為 Rust `llms-types` crate 新增獨立的有型別 LLM wire 合約 - [PR #45188](https://github.com/BerriAI/litellm/pull/45188)
- 以路徑限定 Rust 屬性別名，讓 rust-analyzer 解析它們 - [PR #45416](https://github.com/BerriAI/litellm/pull/45416)
- 將 Anthropic beta 標頭政策加入 Rust crates，尚未接入請求 - [PR #45419](https://github.com/BerriAI/litellm/pull/45419)
- 將 `inline-tools-2026-09-15` beta 加入 Rust `AnthropicBeta` 清單 - [PR #45439](https://github.com/BerriAI/litellm/pull/45439)
- 移除無用的 `Cache._native_cache` runtime 路徑及其 Rust 橋接程式碼 - [PR #44785](https://github.com/BerriAI/litellm/pull/44785)
- 當 Rust 原始碼變更時，在 `uv sync` 上重建 Rust 橋接 - [PR #44708](https://github.com/BerriAI/litellm/pull/44708)
- 為私人提供者輔助工具公開公開名稱 - [PR #45037](https://github.com/BerriAI/litellm/pull/45037)
- 為私人代理程式輔助工具公開公開名稱 - [PR #45170](https://github.com/BerriAI/litellm/pull/45170)
- 為閘道追蹤、PTU 彙總與 Mavvrik 匯出注入每個操作一次 UTC 時鐘讀取 - [PR #45520](https://github.com/BerriAI/litellm/pull/45520)
- 將 `management/teams/access.py` 重新命名為 `authz.py`，保留重新匯出 shim - [PR #44624](https://github.com/BerriAI/litellm/pull/44624)
- 從文件、測試與 CI 中移除公開已知的主金鑰，並新增防止重新引入的 CI 防護 - [PR #44718](https://github.com/BerriAI/litellm/pull/44718)
- 新增然後還原僅規則模型名稱的成本對照表候選重排（無淨變更） - [PR #44144](https://github.com/BerriAI/litellm/pull/44144)、[PR #44335](https://github.com/BerriAI/litellm/pull/44335)
- 修正 MCP 工具列出回傳型別並移除冗餘包裝器 - [PR #44556](https://github.com/BerriAI/litellm/pull/44556)
- 為 Moyai 連接輔助工具加上型別，並直接讀取 MCP 伺服器 `rpm` - [PR #45315](https://github.com/BerriAI/litellm/pull/45315)
- 從 `main` 回移三個過時 e2e 測試修正 - [PR #47229](https://github.com/BerriAI/litellm/pull/47229)

</details>

### 依擁有權區域彙整 PR {#pr-roll-up-by-ownership-area}

面向客戶的 PR：**397**。測試、CI 與內部 PR：**166**。總計：**563**

- 其他（測試、CI、內部）：166
- 模型與提供者：107
- UI：77
- 記錄與追蹤：72
- 效能：41
- LLM API 端點：26
- 支出 / 預算 / 速率限制：25
- 驗證與管理：22
- MCP：15
- 防護欄：11
- 文件：1

## 新貢獻者 {#new-contributors}

- [@Aasif-Multani](https://github.com/Aasif-Multani) 在 [PR #44183](https://github.com/BerriAI/litellm/pull/44183) 做出了他們的第一次貢獻
- [@amarrtech](https://github.com/amarrtech) 在 [PR #43959](https://github.com/BerriAI/litellm/pull/43959) 做出了他們的第一次貢獻
- [@ankitasahni511](https://github.com/ankitasahni511) 在 [PR #42242](https://github.com/BerriAI/litellm/pull/42242) 做出了他們的第一次貢獻
- [@anniejeng](https://github.com/anniejeng) 在 [PR #44278](https://github.com/BerriAI/litellm/pull/44278) 做出了他們的第一次貢獻
- [@Bernedotcom2312](https://github.com/Bernedotcom2312) 在 [PR #42141](https://github.com/BerriAI/litellm/pull/42141) 做出了他們的第一次貢獻
- [@D41910](https://github.com/D41910) 在 [PR #44800](https://github.com/BerriAI/litellm/pull/44800) 做出了他們的第一次貢獻
- [@hektorjg](https://github.com/hektorjg) 在 [PR #44508](https://github.com/BerriAI/litellm/pull/44508) 做出了他們的第一次貢獻
- [@hyamie](https://github.com/hyamie) 在 [PR #46594](https://github.com/BerriAI/litellm/pull/46594) 做出了他們的第一次貢獻
- [@jimaldon](https://github.com/jimaldon) 在 [PR #40924](https://github.com/BerriAI/litellm/pull/40924) 做出了他們的第一次貢獻
- [@joeym82956](https://github.com/joeym82956) 在 [PR #44318](https://github.com/BerriAI/litellm/pull/44318) 做出了他們的第一次貢獻
- [@kohjunhao](https://github.com/kohjunhao) 在 [PR #44173](https://github.com/BerriAI/litellm/pull/44173) 做出了他們的第一次貢獻
- [@mayuriphad](https://github.com/mayuriphad) 在 [PR #38617](https://github.com/BerriAI/litellm/pull/38617) 做出了他們的第一次貢獻
- [@misbahsy](https://github.com/misbahsy) 在 [PR #43673](https://github.com/BerriAI/litellm/pull/43673) 做出了他們的第一次貢獻
- [@msdianprince-7](https://github.com/msdianprince-7) 在 [PR #38729](https://github.com/BerriAI/litellm/pull/38729) 做出了他們的第一次貢獻
- [@nilpntr](https://github.com/nilpntr) 在 [PR #44577](https://github.com/BerriAI/litellm/pull/44577) 做出了他們的第一次貢獻
- [@ninadphalak](https://github.com/ninadphalak) 在 [PR #42645](https://github.com/BerriAI/litellm/pull/42645) 做出了他們的第一次貢獻
- [@RachelHuangZW](https://github.com/RachelHuangZW) 在 [PR #43061](https://github.com/BerriAI/litellm/pull/43061) 做出了他們的第一次貢獻
- [@rohan-akto](https://github.com/rohan-akto) 在 [PR #44343](https://github.com/BerriAI/litellm/pull/44343) 做出了他們的第一次貢獻
- [@Solomon-mithra](https://github.com/Solomon-mithra) 在 [PR #31942](https://github.com/BerriAI/litellm/pull/31942) 做出了他們的第一次貢獻
- [@sorgfresser](https://github.com/sorgfresser) 在 [PR #42281](https://github.com/BerriAI/litellm/pull/42281) 做出了他們的第一次貢獻
- [@SteffanWolter](https://github.com/SteffanWolter) 在 [PR #40108](https://github.com/BerriAI/litellm/pull/40108) 做出了他們的第一次貢獻
- [@wakqasahmed](https://github.com/wakqasahmed) 在 [PR #42213](https://github.com/BerriAI/litellm/pull/42213) 做出了他們的第一次貢獻
- [@yamaceay](https://github.com/yamaceay) 在 [PR #39122](https://github.com/BerriAI/litellm/pull/39122) 做出了他們的第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.105.0...v1.106.0
