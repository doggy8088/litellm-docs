---
title: "v1.102.0 - 自動路由控制、原生 OCR 與閘道可靠性"
slug: "v1-102-0"
date: 2026-09-19T00:00:00
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
docker.litellm.ai/berriai/litellm:1.102.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.102.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

這些提示說明涵蓋 `v1.101.0` 中可用的行為變更，也就是前一個穩定版

**組織端點現在需要企業授權。** 未授權的組織 API 呼叫在驗證後會回傳 403。請先啟用授權再使用組織 API。請參閱 [PR #40613](https://github.com/BerriAI/litellm/pull/40613)

**回應 ID 不論其格式如何都會被授權。** 預設會拒絕此 proxy 未發出的提供者 ID，用於擷取、取消、刪除與串接。僅在刻意接受未受管理 ID 的部署上設定 `allow_unmanaged_response_ids`。請參閱 [PR #39548](https://github.com/BerriAI/litellm/pull/39548)

**新模型寫入不再接受透過 `model_info` 的價格覆寫。** 請將自訂價格放在 `litellm_params`。曾將顯示的目錄費率回寫到 `model_info` 的用戶端，現在將繼續遵循目錄。請參閱 [PR #36222](https://github.com/BerriAI/litellm/pull/36222)

**支援的 OCR 預設改用原生引擎，且 Rust 控制現在為全程序範圍。** 請將 `LITELLM_USE_RUST_OCR` 與每請求或部署的 `rust` 設定改為 `LITELLM_RUST` 或 `litellm.rust(bool)`。Python OCR 路徑請使用 `LITELLM_RUST=0`。請參閱 [PR #40734](https://github.com/BerriAI/litellm/pull/40734), [PR #39928](https://github.com/BerriAI/litellm/pull/39928)

**Auto Router 預設會以所選分層模型的限制取代呼叫端的輸出上限。** 各分層限制仍然具有優先權。設定 `max_tokens_from_tier_model: false` 以保留呼叫端的上限。請參閱 [PR #40209](https://github.com/BerriAI/litellm/pull/40209)

**既有企業授權金鑰可完整存取所有 Auto-Router 功能。** 具有 `allowed_features: ["*"]` 或明確 `auto_router` 授予的有效企業金鑰，包含對 heuristic-v1 routers 的無限制調校。升級時請繼續使用現有金鑰；不需要替換金鑰或額外的 Auto-Router 授權。若沒有任一授予，既有快照與未變更的預設值仍然有效，但只允許一個已調校的 router。請參閱 [PR #39952](https://github.com/BerriAI/litellm/pull/39952), [PR #40007](https://github.com/BerriAI/litellm/pull/40007), [PR #41684](https://github.com/BerriAI/litellm/pull/41684)

**Prompt Security 預設會封鎖檔案修改判定。** 若您的工作流程刻意接受重寫後的檔案，請設定 `block_on_file_modify: false`。請參閱 [PR #38204](https://github.com/BerriAI/litellm/pull/38204)

**既有 Bedrock 與 Azure 直通請求會強制執行已解析模型的存取規則。** 轉送必須使用已授予該金鑰與團隊的模型。請更新那些先前仰賴較寬鬆直通存取的整合。請參閱 [PR #39660](https://github.com/BerriAI/litellm/pull/39660), [PR #39863](https://github.com/BerriAI/litellm/pull/39863)

**MCP 請求更嚴格地強制執行伺服器與終端使用者工具授予。** 以未授予的 MCP 伺服器初始化會回傳 403，遭拒的 served-MCP tools 不再被靜默省略，且終端使用者工具權限會限制清單與呼叫。請授予所需的伺服器、存取群組與工具。請參閱 [PR #39234](https://github.com/BerriAI/litellm/pull/39234), [PR #40616](https://github.com/BerriAI/litellm/pull/40616), [PR #40865](https://github.com/BerriAI/litellm/pull/40865)

**政策管線順序現在是確定的。** 管線會依序從全域、團隊、金鑰、標籤到模型範圍執行，接著是明確請求的政策。請檢視那些結果依賴於先前未指定順序的工作流程。請參閱 [PR #39697](https://github.com/BerriAI/litellm/pull/39697)

**Marengo 2.7 嵌入使用量回報請求與圖片數量，而非估算 token。** 請更新依賴非零 token 使用量的消費端。計費現在使用請求、圖片與持續時間費率。請參閱 [PR #40180](https://github.com/BerriAI/litellm/pull/40180)

**MAI 圖片請求會驗證數量與大小，而不是靜默忽略。** 請使用 `n: 1` 與支援的生成尺寸。圖片編輯不支援 `size`；啟用 `drop_params` 以省略不支援的選項。請參閱 [PR #40074](https://github.com/BerriAI/litellm/pull/40074)

**GPT-5.1、GPT-5.2、GPT-5.4 與 GPT-5.4 Pro 不再宣告 minimal reasoning effort。** 這包含它們的日期快照。請對先前會送出 `minimal` 的請求，改用支援的 effort 或 `drop_params`。請參閱 [PR #40581](https://github.com/BerriAI/litellm/pull/40581)

**無標頭 Azure Realtime 用戶端預設使用 GA 上游。** Beta 用戶端必須送出 `OpenAI-Beta: realtime=v1`，或固定 `realtime_protocol` / `LITELLM_AZURE_REALTIME_PROTOCOL`。健康檢查會遵循 GA 預設。請參閱 [PR #40769](https://github.com/BerriAI/litellm/pull/40769)

**非常大的本機 token 數量會變成抽樣估計值。** 預設的精確計數上限為每個字串 4,000,000 個字元。設定 `TOKEN_COUNTER_MAX_EXACT_CHARS` 以選擇不同的限制。請參閱 [PR #40186](https://github.com/BerriAI/litellm/pull/40186)

**模型健康檢查會強制執行部署可見性並限制回傳欄位。** 明確的範圍外目標會回傳 403，團隊特定部署會遵循路由權限，且結果只包含允許清單中的顯示欄位。請更新依賴先前回應的監控用戶端。請參閱 [PR #40765](https://github.com/BerriAI/litellm/pull/40765)

**既有的 lite login --config-claude 指令現在會寫入靜態閘道 token。** Claude Code 設定先前使用 `apiKeyHelper` 動態擷取登入 token。當儲存的登入金鑰過期時，請重新執行 `lite login --config-claude`。請參閱 [PR #40330](https://github.com/BerriAI/litellm/pull/40330)

:::

## 重點摘要 {#key-highlights}

- **Auto Router 控制與可見性**：自訂 heuristic 維度、可編輯的評分權重、可選的 NON_REASONING 階層、每個階層的輸出限制、更健康的備援，以及供 coding agents 使用的 routed-model/session-savings 回饋
- **原生 OCR 與擴充的提供者端點**：支援提供者上的原生 OCR 執行、Meta Muse Voice realtime 轉錄、Mistral 文字轉語音、Vertex Lyria 音樂，以及原生 Fireworks Responses
- **閘道可靠性**：可選的共用 PgBouncer 連線與 spend collector、更少的資料庫與 Redis 呼叫、穩定的 Redis 當機處理，以及基於請求/token 的自動擴縮控制
- **MCP、記錄與防護欄**：schema-discovery proxy 模式、改善的 OAuth 相容性與權限強制執行、可設定的 OTel trace URLs 與 HTTP/JSON 匯出、PointFive 記錄、Conduct Guard，以及更廣泛的 post-call pipeline 涵蓋範圍
- **99 個新的模型目錄項目**：涵蓋 Bedrock、Azure AI、OpenAI、Fireworks、OpenRouter、Together AI 與其他提供者的新增項目，以及價格與功能修正

## 包含自 v1.102.0-rc.1 截止後的內容 {#included-after-the-v11020-rc1-cut}

穩定版標籤包含這些此發布線的新增項目，包括 rc.2 之後的變更：

- **提供者請求主體** 移除 LiteLLM 內部參數，在 httpx 處理常式路徑中讓 `extra_headers` 不會出現在聊天主體中，依照原生 Responses 路徑的方式過濾橋接的 kwargs，並停止將指定的回應 ID 傳送給橋接提供者 - [PR #41018](https://github.com/BerriAI/litellm/pull/41018), [PR #41141](https://github.com/BerriAI/litellm/pull/41141), [PR #41144](https://github.com/BerriAI/litellm/pull/41144), [PR #41689](https://github.com/BerriAI/litellm/pull/41689)。
- **圖片編輯** 停止將原始的 `image[]` 與 `mask[]` form keys 向上游轉送 - [PR #39512](https://github.com/BerriAI/litellm/pull/39512)。
- **支出與預算** 追蹤由部署回呼轉換為非串流的串流請求支出，在那些已轉換的聊天串流上執行 post-call 部署回呼，並將 `team_member_budget` 更新套用至仍在團隊預設值上的成員 - [PR #41171](https://github.com/BerriAI/litellm/pull/41171), [PR #41495](https://github.com/BerriAI/litellm/pull/41495), [PR #41347](https://github.com/BerriAI/litellm/pull/41347)。
- **路由與重試** 從原始請求快照重播速率限制備援，並將每個請求的 `routing_strategy` 覆寫選取器繫結到該請求的回呼 - [PR #40596](https://github.com/BerriAI/litellm/pull/40596), [PR #41178](https://github.com/BerriAI/litellm/pull/41178)。
- **驗證與管理** 允許萬用字元 `allowed_features` 授權讓 `auto_router` 功能可用，讓組織管理員自己在其他組織中的團隊成員資格能在團隊清單中可見，並在 `writer_unavailable` 過期時，將存取群組的原始 SQL 寫入維持在 writer 上 - [PR #41684](https://github.com/BerriAI/litellm/pull/41684), [PR #41086](https://github.com/BerriAI/litellm/pull/41086), [PR #41283](https://github.com/BerriAI/litellm/pull/41283)。
- **CLI** 在移除 `enum.StrEnum` 後，於 Python 3.10 上再次匯入 - [PR #41046](https://github.com/BerriAI/litellm/pull/41046)。

## 新提供者與端點 {#new-providers-and-endpoints}

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做什麼 |
| --- | --- | --- |
| [Meta](../../docs/providers/meta) | `/v1/realtime` | 使用與 OpenAI 相容的即時事件串流 Muse Voice 轉錄 |
| [Fireworks AI](../../docs/providers/fireworks_ai) | `/v1/responses` | 使用 Fireworks 的原生 Responses API，包括伺服器端 MCP 與鏈結 |
| [Mistral](../../docs/providers/mistral) | `/v1/audio/speech` | 使用 Voxtral TTS 與支援的聲音複製輸入產生語音 |
| [Vertex AI](../../docs/providers/vertex) | `/v1/audio/speech` | 使用 Lyria 模型產生音樂 |
| [Hosted vLLM](../../docs/providers/vllm) | `/v1/images/edits` | 透過代管的 vLLM 部署使用圖片編輯 |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（99 個新模型） {#new-model-support-99-new-models}

數量代表新的目錄識別碼，包括別名與區域變體。以下價格為此版本隨附的美元值；執行階段的 pricing-map 重新載入可加以更新。輸入與輸出欄位顯示基礎 token 費率；長上下文、快取、圖像 token 及其他特殊費率取決於模型

| 供應商 | 模型 | 上下文視窗 | 輸入（每 100 萬 tokens / 美元） | 輸出（每 100 萬 tokens / 美元） | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Azure AI | `azure_ai/codex-mini` | 200,000 | $1.5 | $6 | 回應；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；系統訊息；平行工具 |
| Azure AI | `azure_ai/cohere-command-a` | 131,072 | $2.5 | $10 | 聊天；工具呼叫；工具選擇 |
| Azure AI | `azure_ai/gpt-6-astra` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；系統訊息；平行工具 |
| Azure AI | `azure_ai/gpt-chat-latest` | 272,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure AI | `azure_ai/grok-4-20-non-reasoning` | 262,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；工具選擇；結構化輸出；網頁搜尋 |
| Azure AI | `azure_ai/grok-4-20-reasoning` | 262,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；網頁搜尋 |
| Azure AI | `azure_ai/model-router` | 200,000 | $0.14 | $0 | 聊天 |
| Azure AI | `azure_ai/whisper` | - | - | - | 轉錄；`input_cost_per_second`：$0.0001；`output_cost_per_second`：$0.0001 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-fable-5-1` | 1,000,000 | $12 | $60 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-opus-5` | 1,000,000 | $6 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/nvidia.nemotron-nano-9b-v2` | 128,000 | $0.072 | $0.276 | 聊天；系統訊息 |
| Amazon Bedrock | `bedrock/us-gov-west-1/amazon.nova-2-multimodal-embeddings-v1:0` | 8,172 | $0.162 | $0 | 嵌入；音訊輸入；`input_cost_per_audio_per_second`：$0.000168；`input_cost_per_image`：$7.2e-05；`input_cost_per_video_per_second`：$0.00084 |
| Amazon Bedrock | `bedrock/us-gov-west-1/amazon.nova-lite-v1:0` | 300,000 | $0.072 | $0.288 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `bedrock/us-gov-west-1/amazon.nova-micro-v1:0` | 128,000 | $0.042 | $0.168 | 聊天；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-fable-5-1` | 1,000,000 | $12 | $60 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-opus-5` | 1,000,000 | $6 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/nvidia.nemotron-nano-9b-v2` | 128,000 | $0.072 | $0.276 | 聊天；系統訊息 |
| Amazon Bedrock | `eu.twelvelabs.marengo-embed-3-0-v1:0` | 500 | - | $0 | 嵌入；`input_cost_per_audio_per_second`：$0.00014；`input_cost_per_image`：$0.0001；`input_cost_per_query`：$7e-05；`input_cost_per_video_per_second`：$0.0007 |
| Amazon Bedrock | `global.cohere.embed-v4:0` | 128,000 | $0.12 | $0 | 嵌入 |
| Amazon Bedrock | `global.twelvelabs.pegasus-1-2-v1:0` | - | - | $7.5 | 聊天；`input_cost_per_video_per_second`：$0.00049 |
| Amazon Bedrock | `twelvelabs.marengo-embed-3-0-v1:0` | 500 | - | $0 | 嵌入；`input_cost_per_audio_per_second`：$0.00014；`input_cost_per_image`：$0.0001；`input_cost_per_query`：$7e-05；`input_cost_per_video_per_second`：$0.0007 |
| Amazon Bedrock | `us.cohere.embed-v4:0` | 128,000 | $0.12 | $0 | 嵌入 |
| Amazon Bedrock | `us.twelvelabs.marengo-embed-3-0-v1:0` | 500 | - | $0 | 嵌入；`input_cost_per_audio_per_second`：$0.00014；`input_cost_per_image`：$0.0001；`input_cost_per_query`：$7e-05；`input_cost_per_video_per_second`：$0.0007 |
| Amazon Bedrock | `global.openai.gpt-6-astra` | 1,050,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取 |
| Amazon Bedrock | `us-gov.anthropic.claude-3-haiku-20240307-v1:0` | 200,000 | $0.3 | $1.5 | 聊天；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `us-gov.anthropic.claude-fable-5-1` | 1,000,000 | $12 | $60 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-opus-5` | 1,000,000 | $6 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us-gov.nvidia.nemotron-nano-12b-v2` | 128,000 | $0.24 | $0.72 | 聊天；視覺；系統訊息 |
| Amazon Bedrock | `us-gov.nvidia.nemotron-nano-3-30b` | 262,144 | $0.072 | $0.288 | 聊天；工具呼叫；工具選擇；系統訊息 |
| Amazon Bedrock | `us-gov.nvidia.nemotron-nano-9b-v2` | 128,000 | $0.072 | $0.276 | 聊天；系統訊息 |
| Amazon Bedrock | `us-gov.nvidia.nemotron-super-3-120b` | 256,000 | $0.18 | $0.78 | 聊天；推理；工具呼叫；工具選擇；系統訊息 |
| Amazon Bedrock | `us-gov.openai.gpt-oss-120b-1:0` | 128,000 | $0.18 | $0.72 | 聊天；推理；工具呼叫；工具選擇；結構化輸出 |
| Amazon Bedrock | `us-gov.openai.gpt-oss-20b-1:0` | 128,000 | $0.084 | $0.36 | 聊天；推理；工具呼叫；工具選擇；結構化輸出 |
| Amazon Bedrock | `us-gov.xai.grok-4.6` | 500,000 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫；工具選擇 |
| Amazon Bedrock | `us.openai.gpt-6-astra` | 1,050,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取 |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-6-astra` | 1,050,000 | $11 | $55 | 回應；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-daybreak-blue-5.6-sol` | 1,050,000 | $5.5 | $33 | 回應；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/us-gov-east-1/openai.gpt-oss-120b` | 131,072 | $0.18 | $0.72 | 聊天；推理；工具呼叫；工具選擇；結構化輸出；平行工具 |
| Bedrock Mantle | `bedrock_mantle/us-gov-east-1/openai.gpt-oss-20b` | 131,072 | $0.084 | $0.36 | 聊天；推理；工具呼叫；工具選擇；結構化輸出；平行工具 |
| Bedrock Mantle | `bedrock_mantle/us-gov-east-1/xai.grok-4.6` | 500,000 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/google.gemma-4-26b-a4b` | 256,000 | $0.156 | $0.48 | 聊天；推理；視覺；工具呼叫；工具選擇 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/google.gemma-4-31b` | 256,000 | $0.168 | $0.48 | 聊天；推理；視覺；工具呼叫；工具選擇 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/google.gemma-4-e2b` | 128,000 | $0.048 | $0.096 | 聊天；推理；視覺；工具呼叫；工具選擇 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/openai.gpt-oss-120b` | 131,072 | $0.18 | $0.72 | 聊天；推理；工具呼叫；工具選擇；結構化輸出；平行工具 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/openai.gpt-oss-20b` | 131,072 | $0.084 | $0.36 | 聊天；推理；工具呼叫；工具選擇；結構化輸出；平行工具 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/xai.grok-4.6` | 500,000 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Cerebras | `cerebras/qwen-3.8-27b` | 65,536 | $0.99 | $1.49 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；平行工具 |
| ChatGPT subscription | `chatgpt/gpt-5.5` | 1,050,000 | - | - | 回應；視覺；工具呼叫；結構化輸出；平行工具；訂閱存取；目錄中無每 token 定價 |
| ChatGPT subscription | `chatgpt/gpt-5.6-luna` | 1,050,000 | - | - | 回應；視覺；工具呼叫；結構化輸出；平行工具；訂閱存取；目錄中無每 token 定價 |
| ChatGPT subscription | `chatgpt/gpt-5.6-sol` | 1,050,000 | - | - | 回應；視覺；工具呼叫；結構化輸出；平行工具；訂閱存取；目錄中無每 token 定價 |
| ChatGPT subscription | `chatgpt/gpt-5.6-terra` | 1,050,000 | - | - | 回應；視覺；工具呼叫；結構化輸出；平行工具；訂閱存取；目錄中無每 token 定價 |
| Cohere | `rerank-v4.0-fast` | 32,768 | $0 | $0 | 重新排序；`input_cost_per_query`：$0.002 |
| Cohere | `rerank-v4.0-pro` | 32,768 | $0 | $0 | 重新排序；`input_cost_per_query`：$0.0025 |
| DeepSeek | `deepseek-flash` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；系統訊息；平行工具；助理預填 |
| DeepSeek | `deepseek/deepseek-flash` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；系統訊息；平行工具；助理預填 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash` | 1,048,576 | $0.22 | $0.66 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |

| Fireworks AI | `fireworks_ai/deepseek-v4p1-flash` | 1,048,576 | $0.22 | $0.66 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Gemini | `gemini/lyria-3.5` | 1,048,576 | $0 | $0 | 聊天；音訊輸出；`output_cost_per_image`: $0.08 |
| Inception | `inception/mercury-2.5` | 260,000 | $0.2 | $0.75 | 聊天；工具呼叫；工具選擇；結構化輸出；系統訊息 |
| Meta | `meta/muse-voice-transcribe-1.0` | - | - | - | 即時轉錄；音訊輸入；`input_cost_per_second`: $5e-05 |
| OpenAI | `gpt-image-2.5-flare` | - | $5 | - | 圖片生成；視覺；PDF 輸入；`input_cost_per_image_token`: $8e-06；`output_cost_per_image_token`: $3e-05 |
| OpenAI | `gpt-image-2.5-flare-2026-09-08` | - | $5 | - | 圖片生成；視覺；PDF 輸入；`input_cost_per_image_token`: $8e-06；`output_cost_per_image_token`: $3e-05 |
| OpenAI | `gpt-image-2.5-sunburst` | - | $5 | - | 圖片生成；視覺；PDF 輸入；`input_cost_per_image_token`: $8e-06；`output_cost_per_image_token`: $3e-05 |
| OpenAI | `gpt-image-2.5-sunburst-2026-09-08` | - | $5 | - | 圖片生成；視覺；PDF 輸入；`input_cost_per_image_token`: $8e-06；`output_cost_per_image_token`: $3e-05 |
| OpenAI | `gpt-live-1` | - | - | - | 即時；工具呼叫；音訊輸入；音訊輸出；`input_cost_per_second`: $0.000833333333333 |
| OpenRouter | `openrouter/deepseek/deepseek-v4.1-flash` | 1,048,576 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-5.6-luna-pro` | 1,050,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/openai/gpt-5.6-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/openai/gpt-5.6-sol-pro` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/openai/gpt-5.6-terra-pro` | 1,050,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/openai/gpt-6-astra-pro` | 1,050,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/openai/gpt-chat-latest` | 400,000 | $5 | $30 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/qwen/qwen3.8-max-0902` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Together AI | `together_ai/MiniMaxAI/MiniMax-M2.7` | 196,608 | $0.3 | $1.2 | 聊天 |
| Together AI | `together_ai/Qwen/QwQ-32B` | 131,072 | $1.2 | $1.2 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen3-Coder-Next-FP8` | 262,144 | $0.5 | $1.2 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen3-VL-32B-Instruct` | 262,144 | $0.5 | $1.5 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen3-VL-8B-Instruct` | 262,144 | $0.18 | $0.68 | 聊天 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-R1-0528` | 163,840 | $3 | $7 | 聊天 |
| Together AI | `together_ai/mistralai/Ministral-3-14B-Instruct-2512` | 262,144 | $0.2 | $0.2 | 聊天 |
| Together AI | `together_ai/mistralai/Mistral-7B-Instruct-v0.3` | 32,768 | $0.2 | $0.2 | 聊天 |
| Together AI | `together_ai/moonshotai/Kimi-K2.5-fp4` | 262,144 | $0.5 | $2.8 | 聊天 |
| Together AI | `together_ai/moonshotai/Kimi-K2.6` | 262,144 | $1.2 | $4.5 | 聊天 |
| Together AI | `together_ai/nvidia/NVIDIA-Nemotron-Nano-9B-v2` | 131,072 | $0.06 | $0.25 | 聊天 |
| Together AI | `together_ai/zai-org/GLM-5` | 202,752 | $1 | $3.2 | 聊天 |
| Together AI | `together_ai/zai-org/GLM-5.1` | 202,752 | $1.4 | $4.4 | 聊天 |
| Vertex AI | `vertex_ai/gemini-3.5-live-translate-preview` | - | $3.5 | $21 | 即時；音訊輸入；音訊輸出；`input_cost_per_audio_token`: $3.5e-06；`output_cost_per_audio_token`: $2.1e-05 |
| Vertex AI | `vertex_ai/lyria-002` | - | - | - | 音訊生成；音訊輸出；`output_cost_per_image`: $0.06 |
| Vertex AI | `vertex_ai/lyria-3-clip-preview` | 131,072 | $0 | $0 | 音訊生成；音訊輸出；`output_cost_per_image`: $0.04 |
| Vertex AI | `vertex_ai/lyria-3-pro-preview` | 131,072 | $0 | $0 | 音訊生成；音訊輸出；`output_cost_per_image`: $0.08 |
| Vertex AI | `vertex_ai/xai/grok-4.3` | 200,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| Vertex AI | `vertex_ai/xai/grok-4.6` | 524,288 | $2 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| Voyage | `voyage/voyage-multilingual-2` | 32,000 | $0.12 | $0 | 嵌入向量 |
| Weights & Biases | `wandb/deepseek-ai/DeepSeek-V4-Pro-0813` | - | $1.31 | $3.96 | 聊天；推理；提示快取 |
| Weights & Biases | `wandb/ibm-granite/granite-4.2-8b` | - | $0.1 | $0.15 | 聊天；推理；提示快取 |
| xAI | `xai/grok-imagine-video` | - | - | - | 影片生成；`input_cost_per_image`: $0.002；`output_cost_per_second`: $0.05；`output_cost_per_second_480p`: $0.05；`output_cost_per_second_720p`: $0.07 |
| xAI | `xai/grok-imagine-video-1.5` | - | - | - | 影片生成；`input_cost_per_image`: $0.01；`output_cost_per_second`: $0.08；`output_cost_per_second_1080p`: $0.25；`output_cost_per_second_480p`: $0.08；`output_cost_per_second_720p`: $0.14 |
| xAI | `xai/grok-imagine-video-1.5-2026-05-30` | - | - | - | 影片生成；`input_cost_per_image`: $0.01；`output_cost_per_second`: $0.08；`output_cost_per_second_1080p`: $0.25；`output_cost_per_second_480p`: $0.08；`output_cost_per_second_720p`: $0.14 |
| xAI | `xai/grok-imagine-video-1.5-preview` | - | - | - | 影片生成；`input_cost_per_image`: $0.01；`output_cost_per_second`: $0.08；`output_cost_per_second_1080p`: $0.25；`output_cost_per_second_480p`: $0.08；`output_cost_per_second_720p`: $0.14 |

破折號表示型錄未定義該以 token 為基礎的價格或 context 欄位。上方非 token 計價欄位使用其指定的計費單位

#### 更新的定價 {#updated-pricing}

| 提供者 / model | 變更後的 token 價格（USD，每 100 萬 token） |
| --- | --- |
| `bedrock_mantle/openai.gpt-oss-20b` | 輸入：$0.075 到 $0.07 |
| `bedrock_mantle/openai.gpt-oss-safeguard-20b` | 輸入：$0.075 到 $0.07；輸出：$0.3 到 $0.2 |
| `deepseek-v4-flash` | 輸入：$0.44 到 $0.3；輸出：$1.32 到 $1.2；快取讀取：$0.014 到 $0.006 |
| `deepseek-v4-flash-vision-exp` | 輸入：$0.44 到 $0.3；輸出：$1.32 到 $1.2；快取讀取：$0.014 到 $0.006 |
| `deepseek/deepseek-v4-flash` | 輸入：$0.44 到 $0.3；輸出：$1.32 到 $1.2；快取讀取：$0.014 到 $0.006 |
| `deepseek/deepseek-v4-flash-vision-exp` | 輸入：$0.44 到 $0.3；輸出：$1.32 到 $1.2；快取讀取：$0.014 到 $0.006 |
| `eu.anthropic.claude-3-5-haiku-20241022-v1:0` | 輸入：$0.25 到 $0.8；輸出：$1.25 到 $4；快取讀取：$0.025 到 $0.08；快取寫入：$0.3125 到 $1 |
| `eu.twelvelabs.marengo-embed-2-7-v1:0` | 輸入：$70 到未設定 |
| `gpt-5.4-pro` | 快取讀取：$3 到未設定 |
| `gpt-5.4-pro-2026-03-05` | 快取讀取：$3 到未設定 |
| `gpt-5.5-pro` | 快取讀取：$3 到未設定 |
| `gpt-5.5-pro-2026-04-23` | 快取讀取：$3 到未設定 |
| `jina-reranker-v2-base-multilingual` | 輸入：$0.018 到 $0.05；輸出：$0.018 到 $0 |
| `openrouter/deepseek/deepseek-chat-v3.1` | 輸入：$0.2 到 $0.25；輸出：$0.8 到 $0.95；快取讀取：未設定 到 $0.13 |
| `openrouter/deepseek/deepseek-v4-flash` | 輸入：$0.08778 到 $0.0854；輸出：$0.17556 到 $0.1708；快取讀取：$0.017556 到 $0.01708 |
| `openrouter/deepseek/deepseek-v4-pro` | 輸入：$1.32 到 $0.859908；輸出：$3.96 到 $1.719816；快取讀取：未設定 到 $0.071659 |
| `openrouter/deepseek/deepseek-v4-pro-0813` | 輸入：$1.32 到 $0.57948；輸出：$3.96 到 $1.73844；快取讀取：未設定 到 $0.019316 |
| `openrouter/google/gemma-4-26b-a4b-it` | 輸入：$0.07 到 $0.042；輸出：$0.34 到 $0.22 |
| `openrouter/moonshotai/kimi-k2.7-code` | 輸入：$0.66 到 $0.71；輸出：$3.4 到 $3.5；快取讀取：$0.18 到 $0.15 |
| `openrouter/moonshotai/kimi-k3` | 輸入：$3 到 $2.1；輸出：$15 到 $10.53；快取讀取：$0.3 到 $0.235 |
| `openrouter/qwen/qwen3-14b` | 輸入：$0.12 到 $0.2275；輸出：$0.24 到 $0.91 |
| `openrouter/qwen/qwen3-235b-a22b-2507` | 輸入：$0.0875 到 $0.22；輸出：$0.35 到 $0.88 |
| `openrouter/qwen/qwen3-30b-a3b-instruct-2507` | 輸入：$0.04815 到 $0.09；輸出：$0.19305 到 $0.3 |
| `openrouter/qwen/qwen3-next-80b-a3b-instruct` | 輸入：$0.1 到 $0.09 |
| `openrouter/qwen/qwen3.5-122b-a10b` | 輸入：$0.29 到 $0.26；輸出：$2.4 到 $2.08 |
| `openrouter/qwen/qwen3.5-35b-a3b` | 輸入：$0.25 到 $0.3125；快取讀取：未設定 到 $0.15625 |
| `openrouter/z-ai/glm-4.6` | 輸入：$0.55 到 $0.43；輸出：$2.2 到 $1.75；快取讀取：未設定 到 $0.08 |
| `openrouter/z-ai/glm-5.2` | 輸入：$0.966 到 $0.6；輸出：$3.036 到 $2；快取讀取：$0.1932 到 $0.15 |
| `openrouter/z-ai/glm-5.3-flash` | 輸入：$0.075 到 $0.15；輸出：$0.25 到 $0.5；快取讀取：$0.015 到 $0.03 |
| `together_ai/Qwen/Qwen2.5-72B-Instruct-Turbo` | 輸入：未設定 到 $1.2；輸出：未設定 到 $1.2 |
| `together_ai/Qwen/Qwen2.5-7B-Instruct-Turbo` | 輸入：未設定 到 $0.3；輸出：未設定 到 $0.3 |
| `together_ai/mistralai/Mistral-7B-Instruct-v0.1` | 輸入：未設定 到 $0.2；輸出：未設定 到 $0.2 |
| `together_ai/mistralai/Mistral-Small-24B-Instruct-2501` | 輸入：未設定 到 $0.1；輸出：未設定 到 $0.3 |
| `twelvelabs.marengo-embed-2-7-v1:0` | 輸入：$70 到未設定 |
| `us.twelvelabs.marengo-embed-2-7-v1:0` | 輸入：$70 到未設定 |
| `vertex_ai/gemini-3.5-transcribe-preview` | 輸入：$2.5 到 $2 |
| `vertex_ai/mistral-small-2503` | 輸入：$1 到 $0.1；輸出：$3 到 $0.3 |
| `vertex_ai/mistral-small-2503@001` | 輸入：$1 到 $0.1；輸出：$3 到 $0.3 |
| `vertex_ai/openai/gpt-oss-20b-maas` | 輸入：$0.075 到 $0.07；輸出：$0.3 到 $0.25；快取讀取：未設定 到 $0.007 |
| `vertex_ai/xai/grok-4.20-non-reasoning` | 輸入：$2 到 $1.25；輸出：$6 到 $2.5 |
| `vertex_ai/xai/grok-4.20-reasoning` | 輸入：$2 到 $1.25；輸出：$6 到 $2.5 |

登錄也會更新能力旗標、context/output 限制、非 token 費率，以及棄用日期。沒有移除任何 model 項目

### Amazon Bedrock {#amazon-bedrock}

- 停止將 Anthropic `thinking`/`reasoning_effort` 洩漏到 DeepSeek Converse 請求中 - [PR #33409](https://github.com/BerriAI/litellm/pull/33409)
- 在聊天錯誤時保留 Bedrock 的 `x-amzn-RequestId` - [PR #40089](https://github.com/BerriAI/litellm/pull/40089)
- 在 Bedrock 上支援 TwelveLabs Marengo Embed 3.0，並依請求、圖片與持續時間計費 Marengo embeddings - [PR #40180](https://github.com/BerriAI/litellm/pull/40180)
- 將部署設定的 `aws_session_tags` 傳遞給 Bedrock 與 SageMaker 的 STS AssumeRole - [PR #40446](https://github.com/BerriAI/litellm/pull/40446)

### Anthropic {#anthropic}

- 略過一次性 Claude Code 快取注入 - [PR #40175](https://github.com/BerriAI/litellm/pull/40175)
- 將 /v1/messages prompt 快取的鍵只以 Claude Code 的 session_id 為準 - [PR #40342](https://github.com/BerriAI/litellm/pull/40342)

### Azure AI {#azure-ai}

- 將 Azure AI passthrough 請求路由到已設定的部署，強制執行 model 存取，並在支援的 endpoint 類型間追蹤支出 - [PR #39863](https://github.com/BerriAI/litellm/pull/39863)
- 驗證 MAI 圖片數量與大小選項；不支援的值會回傳 400，或在啟用 `drop_params` 時被捨棄 - [PR #40074](https://github.com/BerriAI/litellm/pull/40074)

### Azure OpenAI {#azure-openai}

- 在建立 Azure SDK 用戶端時遵守 `DEFAULT_MAX_RETRIES` - [PR #40464](https://github.com/BerriAI/litellm/pull/40464)

### Bedrock Mantle {#bedrock-mantle}

- 驗證 Bedrock Mantle `reasoning.summary`；只有在啟用 `drop_params` 時，才會捨棄不支援的值 - [PR #40798](https://github.com/BerriAI/litellm/pull/40798)

### DashScope {#dashscope}

- 將 chat 形狀的 api_base 重新對應到即時 rerank 路由 - [PR #39237](https://github.com/BerriAI/litellm/pull/39237)

### Databricks {#databricks}

- 為 Databricks 托管的 Gemini 2.5 模型正確轉譯 `reasoning_effort` - [PR #32786](https://github.com/BerriAI/litellm/pull/32786), [PR #40909](https://github.com/BerriAI/litellm/pull/40909)
- 保留來自 OpenAI 相容 gateway 模型的頂層 reasoning_content - [PR #40449](https://github.com/BerriAI/litellm/pull/40449)
- 將 Databricks Unity model services 路由ผ่าน AI Gateway - [PR #40492](https://github.com/BerriAI/litellm/pull/40492)

### Fireworks AI {#fireworks-ai}

- 呼叫 Fireworks 的原生 Responses API，包括伺服器端 MCP 與 response chaining - [PR #39826](https://github.com/BerriAI/litellm/pull/39826)
- 在 Responses 路徑上，將 instructions 與 developer 項目合併為一則前置 system 訊息 - [PR #40268](https://github.com/BerriAI/litellm/pull/40268)
- 在重播的 assistant 訊息上保留 reasoning_content - [PR #40682](https://github.com/BerriAI/litellm/pull/40682)

### 一般 {#general}

- 在啟用 `drop_params` 時捨棄不支援的 Responses reasoning 參數，同時保留支援的 reasoning models - [PR #38842](https://github.com/BerriAI/litellm/pull/38842)

### Meta {#meta}

- 透過 Realtime API 串流 Meta Muse Voice 轉錄，支援二進位 PCM 輸入、turn 完成，以及依持續時間計費 - [PR #39395](https://github.com/BerriAI/litellm/pull/39395)

### Mistral {#mistral}

- 透過 `/v1/audio/speech` 使用 Mistral Voxtral text-to-speech，支援語音對應、二進位音訊回應、voice cloning，以及按字元計費 - [PR #38755](https://github.com/BerriAI/litellm/pull/38755)

### Model 目錄與定價 {#model-catalog-and-pricing}

- 新增 Bedrock GPT-6 Astra、GPT Image 2.5、Cohere Rerank 4、Vertex Grok 與即時翻譯、Lyria、Voyage、ChatGPT，以及 xAI 影片目錄項目；修正 web-search 費用與 model 能力中繼資料 - [PR #31884](https://github.com/BerriAI/litellm/pull/31884)
- 新增缺少的 Bedrock GovCloud 定價，包括區域內與跨區域推論 model ID - [PR #39764](https://github.com/BerriAI/litellm/pull/39764)
- 新增 azure_ai/gpt-6-astra Foundry 定價 - [PR #39983](https://github.com/BerriAI/litellm/pull/39983)
- 為 Azure AI Foundry 目錄別名計價，並只收取一次 model-router 費用 - [PR #40189](https://github.com/BerriAI/litellm/pull/40189)
- 修正 Jina reranker 定價與 OpenAI reasoning-effort 中繼資料，並新增 OpenRouter GPT-5.6 Sol - [PR #40581](https://github.com/BerriAI/litellm/pull/40581)
- 登錄稽核滾動 PR：deepseek-flash、gpt-live-1、xAI/Groq 棄用日期、Perplexity Nemotron reasoning - [PR #40606](https://github.com/BerriAI/litellm/pull/40606)
- 新增 Cerebras、Inception、Together AI，以及 OpenRouter 目錄項目；修正既有價格與 Bedrock OpenAI reasoning 能力 - [PR #40740](https://github.com/BerriAI/litellm/pull/40740)
- 在 Fireworks 上新增 DeepSeek V4.1 Flash - [PR #40812](https://github.com/BerriAI/litellm/pull/40812)
- 更新 Azure 與 Together AI 的棄用日期，並修正 Computer Use 與 OpenRouter 能力中繼資料 - [PR #40855](https://github.com/BerriAI/litellm/pull/40855)
- 透過能力備援保留未對應 OpenAI 家族 model ID 的 reasoning 支援 - [PR #40902](https://github.com/BerriAI/litellm/pull/40902)

### OpenAI {#openai}

- 移除 OpenAI 無法編譯的 tool-schema regex pattern，同時保留其餘 schema - [PR #40485](https://github.com/BerriAI/litellm/pull/40485)

### Oracle Cloud Infrastructure {#oracle-cloud-infrastructure}

- 保持穩定的 OCI 串流回應 ID，並避免重複的 Cohere 工具呼叫答案 - [PR #39507](https://github.com/BerriAI/litellm/pull/39507), [PR #39965](https://github.com/BerriAI/litellm/pull/39965)

### Vertex AI {#vertex-ai}

- 透過 `/v1/audio/speech` 產生 Lyria 音樂，並正確處理音訊格式與音樂定價 - [PR #30856](https://github.com/BerriAI/litellm/pull/30856)
- 在受管理批次中支援微調過的 Gemini 端點 - [PR #39668](https://github.com/BerriAI/litellm/pull/39668)
- 對不支援的 Vertex AI reasoning efforts 以清楚的參數錯誤回傳 400 - [PR #40748](https://github.com/BerriAI/litellm/pull/40748)

### Voyage {#voyage}

- 接受單一字串或扁平文件清單作為 Voyage contextual embeddings，同時保留明確的分塊選項 - [PR #35091](https://github.com/BerriAI/litellm/pull/35091)

### Weights & Biases {#weights--biases}

- 在 chat completions 中保留 reasoning_effort - [PR #39190](https://github.com/BerriAI/litellm/pull/39190)
- 將未對應的 W&B 模型視為具備推理能力，同時允許精確的目錄項目覆寫此備援 - [PR #40625](https://github.com/BerriAI/litellm/pull/40625)

## LLM API 端點 {#llm-api-endpoints}

### Agent-to-Agent {#agent-to-agent}

- 在 message/send 和 message/stream 上傳遞呼叫者身分標頭 - [PR #40305](https://github.com/BerriAI/litellm/pull/40305)

### Chat Completions、Responses 與 Messages {#chat-completions-responses-and-messages}

- 在建立回應時處理空白 choices 和缺失的 role，包括用於備援的部分串流 - [PR #37781](https://github.com/BerriAI/litellm/pull/37781), [PR #40294](https://github.com/BerriAI/litellm/pull/40294)
- 將 Responses 或 Chat Completions 轉換為 Anthropic Messages 時，保留拒絕文字與拒絕停止原因 - [PR #39723](https://github.com/BerriAI/litellm/pull/39723)
- 讓 provider_specific_fields 不出現在原生 /v1/messages wire 上 - [PR #39967](https://github.com/BerriAI/litellm/pull/39967)
- 在 Responses API 橋接的 chat completions 上保留 provider id 和 metadata - [PR #39981](https://github.com/BerriAI/litellm/pull/39981)
- 在用戶端中斷連線後，讓背景輪詢持續運作 - [PR #40114](https://github.com/BerriAI/litellm/pull/40114)
- 為 mode: responses 橋接部署保留 reasoning_effort - [PR #40249](https://github.com/BerriAI/litellm/pull/40249)
- 將會話中途的 system messages 保留在 input 中，而不是將它們折疊進 instructions - [PR #40269](https://github.com/BerriAI/litellm/pull/40269)
- 逐字逐 byte 透過 /v1/messages 橋接重播 OpenAI 加密推理 - [PR #40451](https://github.com/BerriAI/litellm/pull/40451)
- 在 chat-completions 橋接上的 Responses API 形狀中回顯具名的 tool_choice - [PR #40462](https://github.com/BerriAI/litellm/pull/40462)
- 保留受託管的 web search 呼叫 - [PR #40828](https://github.com/BerriAI/litellm/pull/40828)
- 在原生路由上接受支援的 deferred stream-logging 格式 - [PR #40869](https://github.com/BerriAI/litellm/pull/40869)

### Files {#files}

- 透過對已設定的 bucket 發出的簽署請求刪除 Bedrock files，並在刪除期間保留部署憑證與受管理的 file IDs - [PR #40161](https://github.com/BerriAI/litellm/pull/40161)

### Image Edits {#image-edits}

- 新增 image edit 支援 - [PR #40329](https://github.com/BerriAI/litellm/pull/40329)

### OCR {#ocr}

- 保留原生 OCR 提供者錯誤並執行 post-call logging hooks - [PR #40061](https://github.com/BerriAI/litellm/pull/40061), [PR #40154](https://github.com/BerriAI/litellm/pull/40154)
- 預設透過原生引擎執行支援的 OCR，適用於 Mistral、Azure Mistral、Azure Document Intelligence、Reducto、Vertex Mistral 與 Vertex DeepSeek，並具有限制的文件擷取與提供者專屬驗證；Python 路徑請使用 `LITELLM_RUST=0` - [PR #40502](https://github.com/BerriAI/litellm/pull/40502), [PR #40507](https://github.com/BerriAI/litellm/pull/40507), [PR #40509](https://github.com/BerriAI/litellm/pull/40509), [PR #40530](https://github.com/BerriAI/litellm/pull/40530), [PR #40532](https://github.com/BerriAI/litellm/pull/40532), [PR #40533](https://github.com/BerriAI/litellm/pull/40533), [PR #40534](https://github.com/BerriAI/litellm/pull/40534), [PR #40535](https://github.com/BerriAI/litellm/pull/40535), [PR #40734](https://github.com/BerriAI/litellm/pull/40734)

### Realtime {#realtime}

- 為 GA 用戶端連線至 Azure 的 GA realtime upstream - [PR #40769](https://github.com/BerriAI/litellm/pull/40769)

### Search {#search}

- 傳遞 GET provider HTTP 錯誤 - [PR #40779](https://github.com/BerriAI/litellm/pull/40779)

### Vector Search and retrieval {#vector-search-and-retrieval}

- 在回應中公開 vector-store retrieval 失敗；可透過 `vector_store_search_failure_mode: error` 選擇啟用 request 失敗 - [PR #39516](https://github.com/BerriAI/litellm/pull/39516)
- 將模擬的 file_search 範圍限定為請求的 vector stores - [PR #39972](https://github.com/BerriAI/litellm/pull/39972)
- 僅針對服務宣告的 cache hashes 注入 Headroom retrieval tools，並保留 assistant content blocks - [PR #39974](https://github.com/BerriAI/litellm/pull/39974)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

- 在 Request Logs 中顯示 batch IDs、部分成功數量、模型、reasoning tokens 與成本明細，並將 batch 支出歸屬到組織 - [PR #39626](https://github.com/BerriAI/litellm/pull/39626)
- 重新整理 Virtual Keys 時保留 Playground 對話與工作階段狀態，並在僅可檢視角色中隱藏 Create Key - [PR #39991](https://github.com/BerriAI/litellm/pull/39991)
- 新增以 key 為範圍的 auto-router 使用量分頁 - [PR #39999](https://github.com/BerriAI/litellm/pull/39999)
- 當移除最後一個團隊 vector store 時送出空的 vector_stores - [PR #40144](https://github.com/BerriAI/litellm/pull/40144)
- 讓自動 auto-router 設定更容易被發現，並顯示其設定內容 - [PR #40146](https://github.com/BerriAI/litellm/pull/40146)
- 在 Add Model 表單中列出 ChatGPT 訂閱提供者 - [PR #40170](https://github.com/BerriAI/litellm/pull/40170)
- 保護 playground 成本指標避免 null 和 NaN - [PR #40257](https://github.com/BerriAI/litellm/pull/40257)
- 修復 pass-through delete confirm dialog，並停用設定端點的刪除功能 - [PR #40303](https://github.com/BerriAI/litellm/pull/40303)
- 將 shadow eval models 的範圍限制為已設定的 chat groups - [PR #40488](https://github.com/BerriAI/litellm/pull/40488)
- 直接跳到最後一頁 Request Logs，而不是一頁一頁前進 - [PR #40644](https://github.com/BerriAI/litellm/pull/40644)
- 從 Keys、Teams、Deleted Keys、Deleted Teams、Memory 與 Prompts 的實體表格中，直接開啟相關的 users、teams、organizations 與 creators - [PR #40646](https://github.com/BerriAI/litellm/pull/40646), [PR #40647](https://github.com/BerriAI/litellm/pull/40647), [PR #40749](https://github.com/BerriAI/litellm/pull/40749), [PR #40750](https://github.com/BerriAI/litellm/pull/40750), [PR #40751](https://github.com/BerriAI/litellm/pull/40751), [PR #40752](https://github.com/BerriAI/litellm/pull/40752), [PR #40753](https://github.com/BerriAI/litellm/pull/40753)
- 依 key alias、key hash、user id 或 email 搜尋 Key Activity - [PR #40652](https://github.com/BerriAI/litellm/pull/40652)
- 在表格搜尋進行中時，顯示載入狀態而非過時列 - [PR #40656](https://github.com/BerriAI/litellm/pull/40656)
- 為團隊成員表格提供搜尋、排序與角色篩選 - [PR #40659](https://github.com/BerriAI/litellm/pull/40659)
- 釐清預算對話框中空白的 TPM/RPM 提示 - [PR #40697](https://github.com/BerriAI/litellm/pull/40697)
- 在共享選取器與本機表單之間保留已清除的選取項目與預設選項 - [PR #40795](https://github.com/BerriAI/litellm/pull/40795), [PR #40826](https://github.com/BerriAI/litellm/pull/40826)
- 讓 env-credential 登入警告橫幅可關閉 - [PR #40831](https://github.com/BerriAI/litellm/pull/40831)

### 驗證與管理 {#authentication-and-management}

- 當其虛擬金鑰刪除時，級聯刪除 JWT 金鑰對應 - [PR #33703](https://github.com/BerriAI/litellm/pull/33703)
- 讓內部使用者讀取自己的支出記錄之請求/回應 - [PR #35448](https://github.com/BerriAI/litellm/pull/35448)
- 防止模型編輯將顯示的型錄價格變成永久的部署覆寫；請透過 `litellm_params` 設定自訂價格 - [PR #36222](https://github.com/BerriAI/litellm/pull/36222)
- 在 `/v1/models` 中回報來自已解析部署的模型限制，包括別名模型 - [PR #39296](https://github.com/BerriAI/litellm/pull/39296)
- 檢查每個已指派的 Responses API ID 的擁有權；未受管理的提供者 ID 需要 `allow_unmanaged_response_ids` - [PR #39548](https://github.com/BerriAI/litellm/pull/39548)
- 將金鑰與團隊模型允許清單套用至 Bedrock passthrough 請求 - [PR #39660](https://github.com/BerriAI/litellm/pull/39660)
- 在 JWT 驗證路徑上套用團隊模型別名 - [PR #39985](https://github.com/BerriAI/litellm/pull/39985)
- 使用 `general_settings.disable_env_credential_login` 停用共享的環境憑證登入，並引導管理員完成帳戶設定 - [PR #40116](https://github.com/BerriAI/litellm/pull/40116)
- 只向 proxy 管理員顯示建立向量儲存 - [PR #40148](https://github.com/BerriAI/litellm/pull/40148)
- 讓已授權的內部使用者開啟向量儲存詳細資訊 - [PR #40150](https://github.com/BerriAI/litellm/pull/40150)
- 在 SpendLogs 中保留 body litellm_session_id，於 missing_session_id omit 下 - [PR #40379](https://github.com/BerriAI/litellm/pull/40379)
- 在 /key/update 忽略 team_id=""，使無團隊金鑰也可更新與匯入 - [PR #40421](https://github.com/BerriAI/litellm/pull/40421)
- 依其公開名稱解析以團隊為範圍的自動路由器 - [PR #40432](https://github.com/BerriAI/litellm/pull/40432)
- 擷取公開團隊別名時保留中繼資料 - [PR #40554](https://github.com/BerriAI/litellm/pull/40554)
- 組織端點需要企業授權 - [PR #40613](https://github.com/BerriAI/litellm/pull/40613)
- 支援明確的專案分離 - [PR #40836](https://github.com/BerriAI/litellm/pull/40836)
- 保留清除使用者模型預算的變更 - [PR #40837](https://github.com/BerriAI/litellm/pull/40837)
- 允許非管理員使用者在其授權範圍內依子字串搜尋金鑰別名 - [PR #40907](https://github.com/BerriAI/litellm/pull/40907)

### 程式編寫代理程式與技能 {#coding-agents-and-skills}

- 透過閘道執行 pi 程式編寫代理程式，使用 `lite pi`，包含模型限制與基於金鑰的存取 - [PR #36841](https://github.com/BerriAI/litellm/pull/36841)
- 透過 `GET /v1/skills?query=...` 與 `skill_search` MCP 工具，依語意相似度搜尋可存取的代管技能 - [PR #39401](https://github.com/BerriAI/litellm/pull/39401)
- 以閘道金鑰與可回復設定設定 Claude Code、Codex，或兩者皆設；使用 `lite unconfigure claude` 還原 Claude 設定 - [PR #40319](https://github.com/BerriAI/litellm/pull/40319), [PR #40829](https://github.com/BerriAI/litellm/pull/40829)
- 讓 apiKeyHelper 在 lite claude 下提供 Claude Code 的金鑰 - [PR #40489](https://github.com/BerriAI/litellm/pull/40489)
- 將 HTTPS ZIP 封存檔註冊為 Claude Code marketplace 外掛程式來源，並可選擇提供 SHA-256 校驗和 - [PR #40496](https://github.com/BerriAI/litellm/pull/40496)
- 讓閘道模型以 Claude 相容 ID 顯示，供 Claude Code 模型探索與請求使用 - [PR #40515](https://github.com/BerriAI/litellm/pull/40515)
- 透過 Allowed Skills，授予對私有 Claude Code marketplace 外掛程式的金鑰與團隊範圍存取權 - [PR #40518](https://github.com/BerriAI/litellm/pull/40518)
- 設定 `litellm_settings.public_skills_index: true`，透過公開的 Agent Skills 索引與可下載封存檔發佈所有已儲存技能 - [PR #40770](https://github.com/BerriAI/litellm/pull/40770)

### Terraform 管理 {#terraform-management}

- 從中繼資料讀取團隊每個模型的 rpm/tpm 限制，並在移除時清除 - [PR #40439](https://github.com/BerriAI/litellm/pull/40439)
- 在虛擬金鑰已不存在時還原 Terraform 狀態，包括級聯刪除 - [PR #40443](https://github.com/BerriAI/litellm/pull/40443), [PR #40880](https://github.com/BerriAI/litellm/pull/40880)
- 以 proxy 可接受的結構編碼 Terraform 每個模型的金鑰預算 - [PR #40450](https://github.com/BerriAI/litellm/pull/40450)
- 允許在 litellm_team 上使用自訂 team_id - [PR #40459](https://github.com/BerriAI/litellm/pull/40459)
- 當持續時間變更時，重新計算 Terraform 管理的金鑰到期時間 - [PR #40511](https://github.com/BerriAI/litellm/pull/40511)
- 當更新遭拒時，保留先前的 Terraform 金鑰狀態 - [PR #40512](https://github.com/BerriAI/litellm/pull/40512), [PR #40527](https://github.com/BerriAI/litellm/pull/40527)
- 將儲存在中繼資料中的金鑰設定讀回 Terraform 狀態 - [PR #40513](https://github.com/BerriAI/litellm/pull/40513)
- 保留 Terraform 未管理的伺服器端金鑰中繼資料 - [PR #40514](https://github.com/BerriAI/litellm/pull/40514)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 預設封鎖 Prompt Security 檔案修改判定；設定 `block_on_file_modify: false` 以允許重寫 - [PR #38204](https://github.com/BerriAI/litellm/pull/38204)
- 將後呼叫原則管線套用至支援的 Responses 與串流路徑，包括背景擷取、文字與工具呼叫重寫，以及舊版後呼叫回呼 - [PR #38721](https://github.com/BerriAI/litellm/pull/38721), [PR #38788](https://github.com/BerriAI/litellm/pull/38788), [PR #39233](https://github.com/BerriAI/litellm/pull/39233), [PR #40271](https://github.com/BerriAI/litellm/pull/40271), [PR #40274](https://github.com/BerriAI/litellm/pull/40274), [PR #40284](https://github.com/BerriAI/litellm/pull/40284)
- 解析 generateContent 路由與以非同步優先的 passthrough 呼叫類型 - [PR #38869](https://github.com/BerriAI/litellm/pull/38869)
- 將金鑰與團隊防護欄套用至 MCP 工具呼叫 - [PR #39629](https://github.com/BerriAI/litellm/pull/39629)
- 以可預測順序執行已附加的原則管線：全域、團隊、金鑰、標籤，然後模型 - [PR #39697](https://github.com/BerriAI/litellm/pull/39697)
- 停止在 pre_call 回呼中將請求酬載記錄為 guardrail_response - [PR #39699](https://github.com/BerriAI/litellm/pull/39699)
- 為 AIM 與 Cato 新增 inspect_embeddings 切換 - [PR #39918](https://github.com/BerriAI/litellm/pull/39918)
- 偵測指派給 credential-named 欄位的短憑證，而不變更已設定的 entropy 閾值 - [PR #40190](https://github.com/BerriAI/litellm/pull/40190)
- 將預期的略過與拒絕事件記錄為低於 WARNING - [PR #40208](https://github.com/BerriAI/litellm/pull/40208)
- 在 telemetry 中保留防護欄結果與掃描識別碼，包括串流回應與請求重寫 - [PR #40211](https://github.com/BerriAI/litellm/pull/40211), [PR #40327](https://github.com/BerriAI/litellm/pull/40327), [PR #40806](https://github.com/BerriAI/litellm/pull/40806), [PR #40882](https://github.com/BerriAI/litellm/pull/40882)
- 允許框架支援的僅記錄模式 - [PR #40267](https://github.com/BerriAI/litellm/pull/40267)
- 將原始請求物件傳遞給後呼叫防護欄回呼 - [PR #40414](https://github.com/BerriAI/litellm/pull/40414)
- 掃描並重寫 Responses custom_tool_call 輸出項目 - [PR #40461](https://github.com/BerriAI/litellm/pull/40461)
- 當無法套用 Responses 輸入重寫時，以具名錯誤封閉失敗 - [PR #40609](https://github.com/BerriAI/litellm/pull/40609)
- 僅將掃描時間記錄為串流後呼叫防護欄持續時間 - [PR #40760](https://github.com/BerriAI/litellm/pull/40760)
- 透過 YAML 與 Admin UI 新增 [Conduct Guard](../../docs/proxy/guardrails/conduct)，包括支援的回呼、請求參數與警告/諮詢 telemetry；需要 `conduct-litellm-guard>=0.2.5` - [PR #40785](https://github.com/BerriAI/litellm/pull/40785)

### 記錄 {#logging}

- 在設定載入後於啟動時初始化字串型 success/failure 回呼 - [PR #38226](https://github.com/BerriAI/litellm/pull/38226)
- 將批次請求記錄匯出至 [PointFive](../../docs/observability/pointfive)，可從 YAML 或 Admin UI 進行，且在成功與失敗時會進行訊息遮罩 - [PR #38509](https://github.com/BerriAI/litellm/pull/38509)
- 在 UI Logging 頁面顯示執行階段註冊的回呼 - [PR #38974](https://github.com/BerriAI/litellm/pull/38974)
- 防止 MLflow 記錄中的串流 span 洩漏，並恢復與 MLflow 2.x trace 完成的相容性 - [PR #39049](https://github.com/BerriAI/litellm/pull/39049)
- 在同步 logging 回呼讀取前完成 response metadata - [PR #39869](https://github.com/BerriAI/litellm/pull/39869)
- 將 Azure Sentinel log 批次拆分至低於擷取限制，並重試過大的批次 - [PR #39880](https://github.com/BerriAI/litellm/pull/39880)
- 在失敗 log 中包含上游提供者 request ID - [PR #40045](https://github.com/BerriAI/litellm/pull/40045)
- 依輸入序列長度分桶 latency - [PR #40059](https://github.com/BerriAI/litellm/pull/40059)
- 讓 session header 中的每次呼叫都有自己的 trace，而不是每個 session 只 upsert 一個 trace - [PR #40177](https://github.com/BerriAI/litellm/pull/40177)
- 在簽署前凍結可重新整理的憑證，並以新的簽章重試 403 上傳 - [PR #40187](https://github.com/BerriAI/litellm/pull/40187)
- 透過環境設定或 Admin UI 設定完整的 OTel v2 trace export URL 與 HTTP/JSON 協定 - [PR #40286](https://github.com/BerriAI/litellm/pull/40286), [PR #40290](https://github.com/BerriAI/litellm/pull/40290)
- 在 `default_team_settings` 中接受非字串的 callback 設定 - [PR #40458](https://github.com/BerriAI/litellm/pull/40458)
- 將團隊最大與剩餘預算 gauge 匯出至 Metric API - [PR #40542](https://github.com/BerriAI/litellm/pull/40542)
- 在失敗 request 的花費 log 中保留 call_type 與 request 開始時間 - [PR #40558](https://github.com/BerriAI/litellm/pull/40558)
- 在遮罩下保留 tool call 與 result 結構，並輸出 tool output token - [PR #40666](https://github.com/BerriAI/litellm/pull/40666)
- 依 langfuse_trace_name 標頭或 metadata.trace_name 命名 Langfuse trace - [PR #40793](https://github.com/BerriAI/litellm/pull/40793)

### Secret Managers {#secret-managers}

- 使用 `kms_key_id` 搭配客戶自行管理的 KMS 金鑰，加密儲存在 AWS Secrets Manager 中的 virtual key - [PR #40475](https://github.com/BerriAI/litellm/pull/40475)

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- OCR 呼叫套用部署特定的自訂價格 - [PR #36609](https://github.com/BerriAI/litellm/pull/36609), [PR #40767](https://github.com/BerriAI/litellm/pull/40767)
- 不要在 token counting routes 上預留預算 - [PR #36718](https://github.com/BerriAI/litellm/pull/36718)
- 在 /v1/messages 上附加 v3 priority rate limit 標頭 - [PR #37228](https://github.com/BerriAI/litellm/pull/37228)
- 記錄原生 Responses API WebSocket session 的花費 - [PR #38856](https://github.com/BerriAI/litellm/pull/38856)
- 允許編輯現有金鑰的 soft budget - [PR #39002](https://github.com/BerriAI/litellm/pull/39002)
- 將嵌套於 text_tokens 中的 realtime reasoning token 只計費一次 - [PR #39850](https://github.com/BerriAI/litellm/pull/39850)
- 在第一個看到 batch 已完成的 retrieve 時，只計算一次該批次成本 - [PR #39980](https://github.com/BerriAI/litellm/pull/39980)
- 依已計費 request 計算快取節省金額 - [PR #40160](https://github.com/BerriAI/litellm/pull/40160)
- 細分 auto-router 分類花費 - [PR #40168](https://github.com/BerriAI/litellm/pull/40168)
- 在 `/cost/estimate` 中估算 cache-read、cache-write 與 reasoning-token 成本，包含自訂價格與一致的費率拆分 - [PR #40174](https://github.com/BerriAI/litellm/pull/40174)
- 透過 cost-map APIs 與 Price Data Reload 頁面公開已載入的 pricing-map revision 與 ETag - [PR #40179](https://github.com/BerriAI/litellm/pull/40179)
- 顯示 auto-router 分類 rate - [PR #40192](https://github.com/BerriAI/litellm/pull/40192)
- 依部署身分比較 auto-router 目標 - [PR #40206](https://github.com/BerriAI/litellm/pull/40206)
- 從花費 log 還原 session token 的 key alias - [PR #40275](https://github.com/BerriAI/litellm/pull/40275)
- 在上限處與 Redis counter 過期期間持續強制執行團隊成員預算 - [PR #40304](https://github.com/BerriAI/litellm/pull/40304)
- 發出內部使用者預算 webhook 警示 - [PR #40396](https://github.com/BerriAI/litellm/pull/40396)
- 防止花費 counter 重複計算 - [PR #40572](https://github.com/BerriAI/litellm/pull/40572)
- 跳過無法編碼進 HTTP response 的 priority 標頭，而不是讓 Anthropic Messages request 失敗 - [PR #40636](https://github.com/BerriAI/litellm/pull/40636)
- 正確重設關聯的 end-user 預算 - [PR #40639](https://github.com/BerriAI/litellm/pull/40639)
- 當 /v1/messages 用戶端在串流中途中斷連線時，為已恢復的 token 計價 - [PR #40766](https://github.com/BerriAI/litellm/pull/40766)
- 持久化已清除的預算上限與重設間隔，並在表單重新開啟時顯示已清除的值 - [PR #40895](https://github.com/BerriAI/litellm/pull/40895)

## MCP 閘道 {#mcp-gateway}

- 在啟用身分繫結時，驗證並將每位使用者的 OAuth 憑證繫結至已驗證的呼叫者，包含憑證重新整理 - [PR #38724](https://github.com/BerriAI/litellm/pull/38724)
- 如同 /test/tools/list 一樣，在 /mcp-rest/test/connection 轉送已暫存的憑證 - [PR #38806](https://github.com/BerriAI/litellm/pull/38806)
- 套用代理程式 MCP 授權與 toolset，並在請求指定金鑰無法存取的閘道 MCP server 時回傳清楚的 403 - [PR #39234](https://github.com/BerriAI/litellm/pull/39234)
- 為以資源為範圍的閘道流程直接啟動已命名 server 的 OAuth - [PR #39933](https://github.com/BerriAI/litellm/pull/39933)
- 新增可選用的 per-server oauth relay discovery - [PR #39936](https://github.com/BerriAI/litellm/pull/39936)
- 更新 MCP toolset 時，遵循明確的 `null` 值 - [PR #40022](https://github.com/BerriAI/litellm/pull/40022)
- 在 internal user 編輯器中顯示繼承的 MCP servers，並標示沒有成員的 access group - [PR #40036](https://github.com/BerriAI/litellm/pull/40036)
- 接受 mcp_security 的 on_violation block 與警示 - [PR #40155](https://github.com/BerriAI/litellm/pull/40155)
- 加密儲存的靜態標頭與 stdio 環境變數 - [PR #40164](https://github.com/BerriAI/litellm/pull/40164)
- 使用 `search_tools`、`get_tool_schema` 與 `call_tool`，透過 `/mcp/proxy` 依需求發現並呼叫工具，同時維持既有 MCP 存取控制 - [PR #40298](https://github.com/BerriAI/litellm/pull/40298)
- 發出已完成的 MCP proxy-call log，並帶有正確的上游 metadata - [PR #40337](https://github.com/BerriAI/litellm/pull/40337)
- 記錄 proxy tool dispatch 例外 - [PR #40351](https://github.com/BerriAI/litellm/pull/40351)
- 在各種 transport 間顯示連線失敗 - [PR #40359](https://github.com/BerriAI/litellm/pull/40359)
- 在 tool-list 與 OAuth2 token 失敗時，記錄上游 request method、body 與 response - [PR #40440](https://github.com/BerriAI/litellm/pull/40440)
- 為由閘道擁有的 server 驗證提出 challenge 並套用範圍 - [PR #40453](https://github.com/BerriAI/litellm/pull/40453)
- 在除錯標頭中回報已解析的上游驗證 - [PR #40454](https://github.com/BerriAI/litellm/pull/40454)
- 保留以點號分隔的 MCP tool 參數名稱 - [PR #40494](https://github.com/BerriAI/litellm/pull/40494)
- 在連線編輯後重新整理 MCP tool 預覽，並在變更目的地 origin 時要求明確憑證 - [PR #40498](https://github.com/BerriAI/litellm/pull/40498)
- 遵循可選的 discovery capabilities，並靜默處理不支援的方法 - [PR #40525](https://github.com/BerriAI/litellm/pull/40525)
- 為受 guardrail 阻擋的 /mcp-rest/tools/call 寫入失敗花費 log - [PR #40555](https://github.com/BerriAI/litellm/pull/40555)
- 當金鑰未授予任何 MCP servers 時，以 403 拒絕 initialize - [PR #40616](https://github.com/BerriAI/litellm/pull/40616)
- 接受 VS Code OAuth 註冊回呼 - [PR #40664](https://github.com/BerriAI/litellm/pull/40664)
- 在沒有原生 MCP handshake 的情況下檢查 OpenAPI 規格 - [PR #40665](https://github.com/BerriAI/litellm/pull/40665)
- 回傳可採取行動的 OAuth 註冊錯誤與有界的 MCP discovery 重試 - [PR #40679](https://github.com/BerriAI/litellm/pull/40679)
- 恢復 MCP catalog 提供者標誌 - [PR #40781](https://github.com/BerriAI/litellm/pull/40781)
- 快取上游 discovery 清單 - [PR #40790](https://github.com/BerriAI/litellm/pull/40790)
- root discovery 使用閘道驗證 - [PR #40791](https://github.com/BerriAI/litellm/pull/40791)
- 符合 per-server OAuth metadata issuer - [PR #40808](https://github.com/BerriAI/litellm/pull/40808)
- 在 tool 列表與執行時都強制執行 end-user MCP tool 權限 - [PR #40865](https://github.com/BerriAI/litellm/pull/40865)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

### Auto Router {#auto-router}

- 在升級過程中保留現有的 heuristic-v1 路由調整，且僅在沒有 `auto_router` 存取權限時套用單一路由器調整配額。具有 `allowed_features: ["*"]` 的有效企業授權可保留無限調整存取權限 - [PR #39952](https://github.com/BerriAI/litellm/pull/39952), [PR #40007](https://github.com/BerriAI/litellm/pull/40007), [PR #40140](https://github.com/BerriAI/litellm/pull/40140), [PR #41684](https://github.com/BerriAI/litellm/pull/41684)
- 建立語義路由設定而不阻塞事件迴圈 - [PR #39954](https://github.com/BerriAI/litellm/pull/39954)
- 從初始先驗與已持久化的學習結果還原 adaptive-routing 分數 - [PR #39955](https://github.com/BerriAI/litellm/pull/39955)
- 在依成本為 adaptive routes 評分時，使用 deployment `model_info` 定價 - [PR #39957](https://github.com/BerriAI/litellm/pull/39957)
- 為 heuristic 評分器新增宣告式自訂維度 - [PR #40156](https://github.com/BerriAI/litellm/pull/40156)
- 在儀表板中編輯內建與自訂 heuristic 維度、重新平衡權重，並啟用 match-count 評分 - [PR #40205](https://github.com/BerriAI/litellm/pull/40205)
- 根據所選階層模型設定自動路由輸出限制；在 `max_tokens_from_tier_model: false` 下保留呼叫端限制 - [PR #40209](https://github.com/BerriAI/litellm/pull/40209)
- 在 `SIMPLE` 下方新增可選的 `NON_REASONING` auto-router 階層，並可透過 `enable_non_reasoning_tier` 啟用 - [PR #40273](https://github.com/BerriAI/litellm/pull/40273)
- 在切換 auto-router 階層時捨棄不相容的加密推理，讓請求可以繼續 - [PR #40280](https://github.com/BerriAI/litellm/pull/40280)
- 在 Claude Code 與 Codex 中顯示路由後的模型與 session 節省，並搭配來自 `GET /auto_router/session` 的金鑰範圍資料 - [PR #40330](https://github.com/BerriAI/litellm/pull/40330)
- 重新整理支援模型系列的 auto-router 推理預設值 - [PR #40341](https://github.com/BerriAI/litellm/pull/40341)
- 一致地解析路由候選項，包括提供者限定的模式、團隊路由與預設 deployments - [PR #40491](https://github.com/BerriAI/litellm/pull/40491)
- 分類實際的 coding-agent 任務，包括加密委派任務，但不包含不相關的 Codex 封裝或 Claude Code 系統文字 - [PR #40599](https://github.com/BerriAI/litellm/pull/40599), [PR #40608](https://github.com/BerriAI/litellm/pull/40608), [PR #40655](https://github.com/BerriAI/litellm/pull/40655)
- 記錄 auto-router 診斷所需的精確分類器輸入與已遮罩來源請求 - [PR #40604](https://github.com/BerriAI/litellm/pull/40604)
- 當所選 auto-router 階層無法提供請求服務時，回退至健康的預設模型 - [PR #40757](https://github.com/BerriAI/litellm/pull/40757)
- 在回應標頭中公開 auto-router 階層、原因、分數與推理努力程度 - [PR #40792](https://github.com/BerriAI/litellm/pull/40792)
- 在 shadow evaluation 中略過 hosted-web-search 請求，以避免不完整的比較 - [PR #40827](https://github.com/BerriAI/litellm/pull/40827)
- 在覆寫被清除時還原繼承的壓縮設定 - [PR #40839](https://github.com/BerriAI/litellm/pull/40839)

### 部署、快取與資料庫可靠性 {#deployment-caching-and-database-reliability}

- 使用 IAM 憑證驗證 Amazon ElastiCache - [PR #38413](https://github.com/BerriAI/litellm/pull/38413)
- 修復因中斷的遷移而留下無效的資料庫索引 - [PR #39384](https://github.com/BerriAI/litellm/pull/39384)
- 在啟動遷移逾時後清理完整的遷移程序樹 - [PR #39509](https://github.com/BerriAI/litellm/pull/39509)
- 透過可選的 PgBouncer 共用 worker 資料庫連線，包括輪替中的 RDS IAM/Azure Entra 權杖與 spend collector - [PR #39683](https://github.com/BerriAI/litellm/pull/39683), [PR #40623](https://github.com/BerriAI/litellm/pull/40623), [PR #40660](https://github.com/BerriAI/litellm/pull/40660)
- 在 Helm、AWS Terraform 與 GCP Cloud Run deployments 中，透過專用程序或 sidecar 提供 metrics - [PR #40163](https://github.com/BerriAI/litellm/pull/40163), [PR #40614](https://github.com/BerriAI/litellm/pull/40614)
- 將基於成本的路由資料與延遲樣本分開 - [PR #40225](https://github.com/BerriAI/litellm/pull/40225)
- 在元件化資料庫 deployments 中遵循閒置連線預設值、CA bundle 與 SSL 設定 - [PR #40285](https://github.com/BerriAI/litellm/pull/40285), [PR #40428](https://github.com/BerriAI/litellm/pull/40428), [PR #40815](https://github.com/BerriAI/litellm/pull/40815)
- 減少驗證、預算保留與通話後 spend 追蹤中的重複資料庫與 Redis 工作 - [PR #40371](https://github.com/BerriAI/litellm/pull/40371), [PR #40593](https://github.com/BerriAI/litellm/pull/40593), [PR #40834](https://github.com/BerriAI/litellm/pull/40834), [PR #40841](https://github.com/BerriAI/litellm/pull/40841)
- 以 `PROXY_DB_LOOKUP_MAX_CONCURRENCY` 限制並行的金鑰與 spend 資料庫查詢，以減少快取未命中期間的過載 - [PR #40387](https://github.com/BerriAI/litellm/pull/40387)
- 在支援的 Helm 與 Terraform deployments 中啟用每秒請求數與每秒 token 數的閘道自動擴展 - [PR #40479](https://github.com/BerriAI/litellm/pull/40479)
- 將 spend 追蹤卸載至可選的 pod 本機 collector；若 collector 無法使用，workers 會恢復本機處理 - [PR #40545](https://github.com/BerriAI/litellm/pull/40545)
- 當 Prisma writer 的資料庫 session 變成唯讀時重新連線 - [PR #40610](https://github.com/BerriAI/litellm/pull/40610)
- 在中斷期間維持 Redis circuit breaker 穩定、計算 pool-wait 逾時、減少重複記錄，並使用可用的本機路由計數器 - [PR #40620](https://github.com/BerriAI/litellm/pull/40620), [PR #40624](https://github.com/BerriAI/litellm/pull/40624), [PR #40764](https://github.com/BerriAI/litellm/pull/40764)
- 將 virtual-key 快取與其他管理物件分離，並使管理快取容量可設定 - [PR #40713](https://github.com/BerriAI/litellm/pull/40713), [PR #40725](https://github.com/BerriAI/litellm/pull/40725)
- 當 Prisma 指令可作為 Python 模組使用但 PATH 中缺少時，執行 migrations - [PR #40768](https://github.com/BerriAI/litellm/pull/40768)
- 在快取分析中，將 dispatch 前被拒絕的請求歸屬到正確的端點 - [PR #40824](https://github.com/BerriAI/litellm/pull/40824)

### 負載平衡與重試 {#load-balancing-and-retries}

- 在沒有記錄延遲樣本時處理 deployments，而不讓路由失敗 - [PR #39970](https://github.com/BerriAI/litellm/pull/39970)
- 在 workers 之間共用 in-flight 計數、失敗閾值與冷卻時間，使負載平衡與 deployment 復原保持一致 - [PR #40009](https://github.com/BerriAI/litellm/pull/40009), [PR #40025](https://github.com/BerriAI/litellm/pull/40025), [PR #40224](https://github.com/BerriAI/litellm/pull/40224)
- 在所有 router 進入點略過曾拒絕可重試請求的 deployment - [PR #40014](https://github.com/BerriAI/litellm/pull/40014), [PR #40306](https://github.com/BerriAI/litellm/pull/40306)
- 保留串流 chat completions 上的提供者回應標頭 - [PR #40091](https://github.com/BerriAI/litellm/pull/40091)
- 使用原始首 token 時間為串流延遲路由排序 - [PR #40202](https://github.com/BerriAI/litellm/pull/40202)
- 在 simple-shuffle 路由中，使用任何 deployment 的已設定權重、RPM 或 TPM - [PR #40222](https://github.com/BerriAI/litellm/pull/40222)
- 防止 deployment 標籤在重試與備援期間變更請求標籤路由 - [PR #40226](https://github.com/BerriAI/litellm/pull/40226)
- 防止特定請求的路由策略累積全域回呼 - [PR #40229](https://github.com/BerriAI/litellm/pull/40229)
- 使用 `ttft_percentile` 依所選的首 token 時間百分位數來路由串流請求 - [PR #40352](https://github.com/BerriAI/litellm/pull/40352)

### 請求處理與執行階段 {#request-handling-and-runtime}

- 針對從 YAML 或資料庫部署載入的字串值 `drop_params` 設定予以遵循 - [PR #33738](https://github.com/BerriAI/litellm/pull/33738)
- 搭配 `SERVER_ROOT_PATHS`，讓單一部署可透過多個 ingress 前綴提供服務，包括正確加上前綴的 MCP OAuth 探索 - [PR #35935](https://github.com/BerriAI/litellm/pull/35935)
- 在 proxy 啟動時註冊技能注入，避免來自 SDK 匯入的回呼副作用 - [PR #38914](https://github.com/BerriAI/litellm/pull/38914)
- 還原獨立 AI Gateway 發行映像建置 - [PR #39523](https://github.com/BerriAI/litellm/pull/39523)
- 還原 Rust gateway 中安全的上游 WebSocket 連線 - [PR #39530](https://github.com/BerriAI/litellm/pull/39530)
- 在非 LLM 路由上回傳正確的可為空錯誤欄位，而不是字面字串 `"None"` - [PR #39536](https://github.com/BerriAI/litellm/pull/39536)
- 減少模型健康檢查重複的資料庫寫入與重複列 - [PR #39539](https://github.com/BerriAI/litellm/pull/39539)
- 將 spend-log flush 通知保留在各自工作執行緒的事件迴圈本地 - [PR #39556](https://github.com/BerriAI/litellm/pull/39556)
- 將遠端媒體與樣板擷取，以及非同步 Bedrock 請求簽章，移出推論工作執行緒的事件迴圈 - [PR #39839](https://github.com/BerriAI/litellm/pull/39839), [PR #40270](https://github.com/BerriAI/litellm/pull/40270), [PR #40311](https://github.com/BerriAI/litellm/pull/40311)
- 在每個工作執行緒上協調模型之前，先載入以資料庫為基礎的憑證 - [PR #39876](https://github.com/BerriAI/litellm/pull/39876)
- 透過 `litellm.rust(bool)` 或 `LITELLM_RUST` 控制可選的 Rust 執行；已移除請求層級控制 - [PR #39928](https://github.com/BerriAI/litellm/pull/39928)
- 從 passthrough 失敗追蹤回溯中遮罩提供者憑證 - [PR #39964](https://github.com/BerriAI/litellm/pull/39964)
- 允許 spend-log 分區維護在其設定的 statement timeout 內執行 - [PR #40098](https://github.com/BerriAI/litellm/pull/40098)
- 在啟動時記錄一次預算保留設定通知 - [PR #40167](https://github.com/BerriAI/litellm/pull/40167)
- 限制並行 token 計數，並將大量計數移出事件迴圈；高於 `TOKEN_COUNTER_MAX_EXACT_CHARS` 的字串改用抽樣估計 - [PR #40186](https://github.com/BerriAI/litellm/pull/40186)
- 同步載入第一個遠端定價對應表，並在背景執行失敗擷取重試 - [PR #40350](https://github.com/BerriAI/litellm/pull/40350)
- 批次處理 gateway 請求計數彙總，以減少資料庫寫入 - [PR #40362](https://github.com/BerriAI/litellm/pull/40362)
- 啟動 `lite` CLI 指令時不下載遠端定價對應表 - [PR #40372](https://github.com/BerriAI/litellm/pull/40372)
- 選擇性地以 Rust 計算支援的預算接納輸入 token；不支援的請求則回退至 Python - [PR #40381](https://github.com/BerriAI/litellm/pull/40381)
- 以固定的模型標籤與已清理的儲存錯誤文字記錄未知模型失敗 - [PR #40622](https://github.com/BerriAI/litellm/pull/40622), [PR #40820](https://github.com/BerriAI/litellm/pull/40820)
- 在請求派發中優先處理存活性與核心推論路由 - [PR #40687](https://github.com/BerriAI/litellm/pull/40687)
- 依需求載入提供者 passthrough 路由，同時保留路由優先順序 - [PR #40691](https://github.com/BerriAI/litellm/pull/40691)
- 以增量方式追蹤 Bedrock passthrough 串流使用量，避免完整回應緩衝 - [PR #40724](https://github.com/BerriAI/litellm/pull/40724)
- 將健康檢查範圍限制為可存取的模型與存取群組，並且只回傳核准的顯示欄位 - [PR #40765](https://github.com/BerriAI/litellm/pull/40765)
- 解決 bucket 託管的 proxy 設定中的包含檔案 - [PR #40772](https://github.com/BerriAI/litellm/pull/40772)
- 在資料平面上公開已驗證 gateway 記憶體摘要，包括 pod 身分與 Linux 記憶體讀取，且不需 psutil - [PR #40773](https://github.com/BerriAI/litellm/pull/40773)
- 將可選 Rust 預算接納計數擴充至支援的 `cl100k_base` tokenizer - [PR #40777](https://github.com/BerriAI/litellm/pull/40777)
- 以單次流程去重比對到的政策附加 - [PR #40883](https://github.com/BerriAI/litellm/pull/40883)

### 依擁有區域彙總的 PR {#pr-roll-up-by-ownership-area}

原始 rc.1 附註中使用者可見的 PR：**317**。上方列出的 release-line 新增項目與此既有彙總是分開的。

- 效能：92
- 模型與提供者：40
- 驗證與管理：37
- LLM API 端點：31
- MCP：29
- 防護欄：24
- UI：24
- 花費 / 預算 / 速率限制：22
- 記錄：17
- Secret Managers：1

## 新貢獻者 {#new-contributors}

- [@Atharva-Kanherkar](https://github.com/Atharva-Kanherkar)
- [@CaptainAni187](https://github.com/CaptainAni187)
- [@ZXT-zjbiliy](https://github.com/ZXT-zjbiliy)
- [@clement-paradex](https://github.com/clement-paradex)
- [@dclarksymmetry](https://github.com/dclarksymmetry)
- [@gym-cmd](https://github.com/gym-cmd)
- [@haydster7](https://github.com/haydster7)
- [@jon-walton](https://github.com/jon-walton)
- [@joshua-berri](https://github.com/joshua-berri)
- [@jrlprost](https://github.com/jrlprost)
- [@kerry-berri](https://github.com/kerry-berri)
- [@krth1k](https://github.com/krth1k)
- [@shotsan](https://github.com/shotsan)
- [@yinonkahta-p5](https://github.com/yinonkahta-p5)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.0...v1.102.0
