---
title: "/v1/decisions and /v1/systemone"
---

import Image from '@theme/IdealImage';

# /v1/decisions and /v1/systemone {#v1decisions-and-v1systemone}

決策模型對一個輸入回答型別問題，並回傳機率而不是文字：yes/no 機率、從固定清單中挑選、在一個量尺上評分，或在支援的模型上，框出圖片中的某個東西。LiteLLM 在兩條共用同一份提供者清單的路由上提供它們，因此您 `model_list` 中的任何決策模型都能在任一條路由上運作

| 路由 | 別名 | 請求格式 | 使用時機 |
|-------|-------|----------------|-------------|
| [`POST /v1/decisions`](#v1decisions) | `/decisions` | OpenAI Decisions：`input` 加上一份 `predicate`、`choice`、`score` 與 `box` 問題清單 | 您以 OpenAI 的格式撰寫 |
| [`POST /v1/systemone`](#v1systemone) | `/systemone` | [System One](https://docs.typesafe.ai/api)：`state` 加上一份 `noul`、`choice`、`score` 與 `box` 問題對照 | 您已經有 TypeSafe Jev 請求主體 |

[Python SDK](#sdk-usage) 不透過代理呼叫相同模型，[TypeSafe 圖片與 box 問題](#typesafe-images-box-questions-and-long-context)涵蓋 TypeSafe 的選擇加入標頭，[Admin UI](#try-it-in-the-admin-ui) 可新增決策模型並在 playground 中測試它們，而[基準測試](./decisions/benchmark.md)將決策模型以防護欄、Auto Router 分類器與 Lens judge 三種角色比較

擷取模型（例如填入日期、數字與清單等型別欄位而不是回答問題的 Cloudflare Clairic）在 [/v1/extraction](./extraction.md) 上提供。

## 搭配 LiteLLM 代理使用決策模型 {#proxy-setup}

1. 將決策模型加入 `config.yaml`

```yaml showLineNumbers keep-model-ids
model_list:
  - model_name: luna
    litellm_params:
      model: openai/gpt-6-luna
      api_key: os.environ/OPENAI_API_KEY
  - model_name: jev
    litellm_params:
      model: typesafe/jev-latest
      api_key: os.environ/TYPESAFE_API_KEY
```

2. 啟動代理

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

## 可用性與支援的功能 {#availability-and-supported-features}

決策路由自 <SinceVersion v="1.104.2" /> 起可用，但 `v1.105.0` 開發版本、`v1.105.0-rc.1` 與 `v1.105.0-rc.2` 除外。部分提供者與功能需要較新的版本，列於下方。開發版本或候選版本仍可能缺少其正式版本擁有的一個提供者或功能，例如 `v1.105.0-rc.3` 與 `v1.106.0` 開發版本中的 vLLM、Microsoft Foundry，以及來自 `usage.cost` 的 OpenRouter 支出

| 提供者或功能 | 版本 |
|---------------------|---------|
| [Gemini Decision 1](./providers/gemini.md#decisions) | `v1.111.0-rc.1` |
| vLLM、Microsoft Foundry、來自 `usage.cost` 的 OpenRouter 支出 | `v1.104.3` |
| Databricks 服務端點、Cloudflare Clef 上的圖片輸入、Cloudflare Clef-omni 上的[音訊與視訊輸入](#audio-and-video-input)、TypeSafe 圖片與 box 問題 | `v1.106.0` |
| Databricks `ai_decide`、Fireworks AI、Laya 與 Bespoke Nimble（包含 Add Model 表單），以及部署自己的 [`supports_box_questions`](#box-questions-on-other-deployments) 值（在設定與 SDK 中） | `v1.107.0-rc.1` |
| 部署自己的 [`supports_audio_input` 與 `supports_video_input`](#audio-and-video-on-other-deployments) 值，以及 clip 請求只送到接受 clip 的群組部署 | `v1.110.0` |
| [JSON 輸入](#json-input)（OpenAI） | `v1.112.0-rc.1`，以及 1.108.x LTS 線上的 `v1.108.14` |
| [另一個 LiteLLM 代理](#send-decision-calls-through-a-litellm-proxy)作為提供者，搭配 `litellm_proxy/` 模型 | `v1.112.0-rc.1`，以及 1.108.x LTS 線上的 `v1.108.15` |

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | 是 | 在 `x-litellm-response-cost` 標頭中回傳，並寫入支出記錄。自我託管的 vLLM 模型沒有價格，因此 vLLM 呼叫不回傳成本標頭。Databricks OpenJev 與 `ai_decide` 在成本對照中價格為零，因此其呼叫記錄 $0，即使 Databricks 仍會向您的工作區收費 |
| 記錄 | 是 | 在所有整合上運作 |
| 虛擬金鑰、預算、速率限制 | 是 | 一般的代理金鑰驗證 |
| 負載平衡、備援 | 是 | 像 `/chat/completions` 一樣經過路由器 |
| 圖片輸入 | OpenAI、Gemini、Cloudflare Clef 與 TypeSafe | TypeSafe 需要 `TypeSafe-Danger-Zone-Images: true` 標頭。其他提供者回傳 400，或在 `drop_params` 下丟棄圖片 |
| 音訊與視訊輸入 | Gemini Decision 1 與 Cloudflare Clef-omni | 其他模型回傳 400，或在 `drop_params` 下丟棄 clip，除非[部署旗標](#audio-and-video-on-other-deployments)開啟 clip。`openai/` 與 `azure/` 部署無論旗標如何都拒絕 clip |
| JSON 輸入 | OpenAI | `azure/` 部署會像 OpenAI 一樣把這些部分繼續往下傳。其他提供者（包含 Microsoft Foundry）會回傳一個指名 `input_json` 的 400，或在 `drop_params` 下丟棄這些部分 |
| 串流 | 否 | |

## 支援的提供者 {#supported-providers}

| 提供者 | 範例模型 | 憑證 | LiteLLM 端點 | 圖片 |
|----------|---------------|-------------|------------------|--------|
| [OpenAI](https://developers.openai.com/api/docs/guides/decisions) | `openai/gpt-6-luna` | `OPENAI_API_KEY`，可選 `OPENAI_BASE_URL` | `/v1/decisions` | 是 |
| [Gemini](./providers/gemini.md#decisions) | `gemini/gemini-decision-1` | `GEMINI_API_KEY` | `/v1/systemone` | 是 |
| [TypeSafe Jev](https://docs.typesafe.ai/api) | `typesafe/jev-latest` | `TYPESAFE_API_KEY`，可選 `TYPESAFE_API_BASE` | `/v1/systemone` | 搭配[圖片標頭](#typesafe-images-box-questions-and-long-context) |
| [OpenRouter](./providers/openrouter.md#decisions-jev) | `openrouter/typesafe/jev-1.14` | `OPENROUTER_API_KEY`，可選 `OPENROUTER_API_BASE` | `/v1/systemone` | 否 |
| [Fireworks AI](https://docs.fireworks.ai) (private preview) | `fireworks_ai/accounts/fireworks/routers/rune` | `FIREWORKS_AI_API_KEY` 或 `FIREWORKS_API_KEY`，可選 `FIREWORKS_API_BASE` | `/v1/systemone` | 否 |
| [Perplexity](https://docs.perplexity.ai/docs/decisions/quickstart) | `perplexity/pplx-decider-v1-27b` | `PERPLEXITYAI_API_KEY` 或 `PERPLEXITY_API_KEY`，可選 `PERPLEXITY_API_BASE` | `/v1/systemone` | 否 |
| [Cloudflare Clef](https://developers.cloudflare.com/workers-ai/models/clef/) | `cloudflare/clef`、`cloudflare/clef-flash` 或 `cloudflare/clef-omni` | `CLOUDFLARE_API_KEY` 與 `CLOUDFLARE_ACCOUNT_ID`，或 `api_base` | `/v1/systemone` | 是 |
| [Databricks](https://docs.databricks.com/aws/en/sql/language-manual/functions/ai_decide) | `databricks/databricks-openjev-qwen35-4b` | `DATABRICKS_API_KEY` 或 `DATABRICKS_TOKEN`，`DATABRICKS_API_BASE` 必填 | `/v1/systemone` | 否 |
| [Databricks `ai_decide`](./providers/databricks.md#decisions-ai_decide) | `databricks/ai_decide` | `DATABRICKS_API_KEY` 或 `DATABRICKS_TOKEN`，`DATABRICKS_API_BASE` 必填 | `/v1/systemone` | 否 |
| [Microsoft Foundry](https://ai.azure.com/catalog/models/Microsoft-Decision-1) | `azure_ai/<deployment>`，搭配 `base_model: azure_ai/Microsoft-Decision-1` | `AZURE_AI_API_KEY`，`AZURE_AI_API_BASE` 必填 | `/v1/systemone` | 否 |
| [Strands Decider](./providers/strands_decider.md) (self-hosted) | `strands_decider/strands-decider-2B-hobson-v19` | `STRANDS_DECIDER_API_BASE` 必填，`STRANDS_DECIDER_API_KEY` 可選 | `/v1/systemone` | 否 |
| [vLLM](https://docs.vllm.ai/en/latest/serving/online_serving/structured_decisions.html) (self-hosted) | `hosted_vllm/Qwen/Qwen3-0.6B` | `HOSTED_VLLM_API_BASE` 或 `api_base` 必填，`HOSTED_VLLM_API_KEY` 可選 | `/v1/systemone` | 否 |
| [Laya](https://github.com/NandhaKishorM/laya) (self-hosted) | `laya/english`、`laya/multilingual` 或 `laya/typed-decisions` | `api_base` 或 `LAYA_API_BASE` 必填，`LAYA_API_KEY` 可選 | `/v1/systemone` | 否 |
| [Bespoke Nimble](https://github.com/bespokelabsai/nimble) (self-hosted) | 在 Ollama 上為 `bespoke/nimble`，其他為 `bespoke/nimble-latest` 或 `bespoke/bespokelabs/Bespoke-Nimble-9B` | `api_base` 或 `BESPOKE_API_BASE` 必填，`BESPOKE_API_KEY` 可選 | `/v1/systemone` | 否 |
| [LiteLLM 代理](#send-decision-calls-through-a-litellm-proxy) | `litellm_proxy/<該代理上的模型>` | `LITELLM_PROXY_API_BASE` 或 `api_base` 必填，`LITELLM_PROXY_API_KEY` 可選 | 您呼叫的路由 | 當該代理的模型接受圖片時 |

其中部分提供者需要比決策路由更新的 LiteLLM 版本，如[可用性與支援的功能](#availability-and-supported-features)所列

主機與模型同樣重要。決策模型只在 LiteLLM 有 Decisions 整合的提供者上運作。GPT-6 Luna 在 `openai/gpt-6-luna` 上以及在 Azure OpenAI 上以 `azure/gpt-6-luna` 提供決策。AWS Bedrock 不是 Decisions 提供者，因此 GPT-6 Luna 的 `bedrock/` 部署（包含 `bedrock/converse/`）與 `bedrock_mantle/` 部署能回答聊天請求，但在 `/v1/decisions` 上會回傳 `Unknown Decisions provider`，作為 Auto Router 決策分類器時與在 Decision Model 防護欄中也是如此。Amazon 在 Bedrock 上的 Decisions 端點目前不接受 GPT-6 Luna。若要以 Bedrock 託管的 GPT-6 Luna 分類 Auto Router 請求，請使用 [LLM 分類器](./proxy/auto_routing.md)並設定 `classifier_type: llm`，它會透過聊天呼叫模型

LiteLLM 在兩種格式之間轉換，因此您呼叫的路由不會限制您能使用哪個提供者。OpenAI 接收 OpenAI 格式的主體，Gemini 接收其原生 Decisions 格式，其他提供者接收 System One 主體。答案以您呼叫的路由的格式回來。OpenAI `input` 的文字部分會被連接成 System One 的 `state`，而 System One 問題在送到 OpenAI 時以其鍵命名

Gemini Decision 1 回答 yes/no、choice 與 rubric score 問題，支援文字、圖片與行內音訊/視訊輸入。每個請求最多接受 16 張圖片，解碼後的圖片資料總共最多 20 MiB，包含 LiteLLM 下載的遠端圖片。訊息輸入保留文字與圖片的順序。Box 問題回傳 400。PDF 與遠端音訊/視訊 URL 不在 LiteLLM 的 Decisions 輸入結構描述中對應。每次請求的 `api_base` 或 `base_url` 覆寫需要在同一個請求中有明確的 `api_key`，否則回傳 400，即使部署有金鑰也一樣。請以自己的金鑰設定自訂部署 URL。請參閱 [Gemini 設定](./providers/gemini.md#decisions)

沒有 `@cf/` 前綴的 Cloudflare 模型名稱會被擴展為 `@cf/cloudflare/<model>`，而 Cloudflare 回傳的 `{"result": ...}` 信封會被拆開，讓回應與其他提供者有相同的形狀。在 Databricks 上，模型是裸的服務端點名稱，`DATABRICKS_API_BASE` 指向 `https://<workspace-host>/serving-endpoints`，因此請求會送到該端點的 `/invocations` 路由。`databricks/ai_decide` 則改為呼叫同一個工作區上 `/api/2.0/ai-functions/ai-decide` 的 `ai_decide` AI Function，這需要開啟 `ai_decide` 預覽，且不回報權杖使用量。在 Microsoft Foundry 上，模型是您的部署名稱，`AZURE_AI_API_BASE` 是資源主機 `https://<resource>.services.ai.azure.com`。專案範圍的基礎位址，例如 `https://<resource>.services.ai.azure.com/api/projects/<project>/openai/v1`，會被修剪回主機。Azure 不讓您把部署命名為 `Microsoft-Decision-1`，因此請以其他名稱部署它，並設定 `base_model`，讓成本追蹤能找到價格

```yaml showLineNumbers
model_list:
  - model_name: decision-1
    litellm_params:
      model: azure_ai/decision-1
      api_base: https://<resource>.services.ai.azure.com
      api_key: os.environ/AZURE_AI_API_KEY
    model_info:
      base_model: azure_ai/Microsoft-Decision-1
```

[Strands Decider](./providers/strands_decider.md) 沒有預設主機，因此請設定 `STRANDS_DECIDER_API_BASE` 或傳入 `api_base`。vLLM 需要 v0.32.0 或更新版本，其中包含 [vllm-project/vllm#59299](https://github.com/vllm-project/vllm/pull/59299)，並如 vLLM 的 [Structured Decisions](https://github.com/vllm-project/vllm/blob/v0.32.0/docs/serving/online_serving/structured_decisions.md) 文件所述回答 `choice`、`noul` 與 `score` 問題。它服務其 [`READ_STRATEGIES`](https://github.com/vllm-project/vllm/blob/v0.32.0/vllm/entrypoints/generate/structured_decisions/strategies.py#L812) 中列出的模型架構，Qwen3 與 Qwen3.5 在其中。若要將 vLLM 用作 Auto Router 分類器，請參閱 [vLLM](./auto_router/decision_classifiers.md#vllm)

### 自我託管的 Laya 與 Nimble {#self-hosted-laya-and-nimble}

[Laya](https://github.com/NandhaKishorM/laya) 與 [Bespoke Nimble](https://github.com/bespokelabsai/nimble) 是您自己託管的決策模型。自包含 [LiteLLM #45260](https://github.com/BerriAI/litellm/pull/45260) 的版本起，它們是 `/v1/decisions` 與 `/v1/systemone` 的提供者，您可以在 Admin UI 的 Models + Endpoints、Add Model 中將 Mode 設為 `Decisions - /v1/decisions` 來加入它們。較早的版本只在它們自己的閘道路由上服務它們

| 模型 | 閘道路由 | 伺服器設定 |
|-------|---------------|-----------------|
| Laya | `/laya/v1/systemone` | `LAYA_API_BASE`，可選 `LAYA_API_KEY` |
| Bespoke Nimble | `/bespoke/v1/systemone` | `BESPOKE_API_BASE`，可選 `BESPOKE_API_KEY` |

`laya/*` 或 `bespoke/*` 部署只接受上方提供者表格中的模型名稱，任何其他名稱都會在請求離開代理之前回應 400。Ollama 以 `bespoke/nimble` 服務 Nimble。API 基礎位址必須是沒有憑證、查詢或片段的 HTTP 或 HTTPS URL。`LAYA_API_KEY` 與 `BESPOKE_API_KEY` 只會送到 `api_base` 為 `LAYA_API_BASE` 或 `BESPOKE_API_BASE` 的部署（忽略結尾的 `/` 或 `/v1`），且部署上設定的 `api_key` 永遠優先。兩者的價格都是 $0，因為硬體費用由您支付，因此請在部署上設定 Custom Pricing 以追蹤支出

Laya、Nimble 與 Jev 也可以為 Auto Router 挑選模型層級。請求範例與分類器設定請參閱[呼叫原生決策 API](./auto_router/decision_classifiers.md#call-a-native-decision-api)

## 基準測試 {#benchmarks}

[決策模型基準測試](./decisions/benchmark.md)將 LiteLLM 支援的每一個決策模型以防護欄、Auto Router 分類器與 Lens Signals 的 LLM judge 三種角色比較，並列出各自的準確率、成本與延遲。

## /v1/decisions {#v1decisions}

以 OpenAI 格式各問一種類型的問題

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/decisions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "luna",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today."}
      ]
    }
  ],
  "questions": [
    {"type": "predicate", "name": "is_refund_request", "instructions": "Is the customer asking for a refund?"},
    {
      "type": "choice",
      "name": "needs_human",
      "instructions": "Should a human agent take over?",
      "choices": [{"value": true, "description": "billing dispute that needs a person"}, {"value": false}]
    },
    {
      "type": "score",
      "name": "frustration",
      "instructions": "How frustrated is the customer?",
      "levels": [{"label": "calm"}, {"label": "mildly annoyed"}, {"label": "angry", "description": "uses hostile language"}]
    }
  ]
}'
```

回應

```json keep-model-ids
{
  "model": "gpt-6-luna",
  "answers": [
    {"type": "predicate", "name": "is_refund_request", "probability": 1.0},
    {
      "type": "choice",
      "name": "needs_human",
      "choice": true,
      "probabilities": [{"value": true, "probability": 0.99}, {"value": false, "probability": 0.01}],
      "confidence": 0.98
    },
    {
      "type": "score",
      "name": "frustration",
      "score": 0.74,
      "probabilities": [
        {"value": 0, "label": "calm", "probability": 0.26},
        {"value": 1, "label": "mildly annoyed", "probability": 0.74},
        {"value": 2, "label": "angry", "probability": 0.0}
      ],
      "confidence": 0.61
    }
  ],
  "usage": {
    "input_tokens": 401,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 0,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 401
  }
}
```

將 `"model"` 改為 `"jev"` 會把相同問題送到 TypeSafe，並回傳相同的形狀

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `model` | string | 代理模型名稱，或在 SDK 中為 `<provider>/<model>` |
| `input` | string or array | 一個字串，或形狀如 `{"type": "message", "role": "user", "content": ...}` 的訊息。`content` 是一個字串，或一份 `input_text`、`input_image` 與 [`input_json`](#json-input) 部分的清單 |
| `questions` | array | 1 至 128 個問題。答案以相同順序回來 |
| `safety_identifier` | string, optional | 您終端使用者的穩定 ID。傳送給 OpenAI。其他提供者回傳 400，或在 `drop_params` 下丟棄它 |
| `audio` | array, optional | 最多 4 段音訊 clip，規則見[音訊與視訊輸入](#audio-and-video-input) |
| `videos` | array, optional | 最多 2 段視訊 clip，規則見[音訊與視訊輸入](#audio-and-video-input) |

每個問題都接受 `instructions` 與一個可選的 `name`，該名稱會在其答案中回顯

| `type` | 額外欄位 | 答案欄位 |
|--------|--------------|---------------|
| `predicate` | 無 | 答案為 yes 的 `probability` |
| `choice` | `choices`：2 至 255 個 `{"value": string or boolean, "description": optional}` 條目 | `choice`、每個值的 `probabilities`、`confidence` |
| `score` | `levels`：2 至 10 個 `{"label": ..., "description": optional}` 條目，最低在前 | `score`（機率加權的層級索引）、每個層級的 `probabilities`、`confidence` |
| `box` | 無。搭配[圖片標頭](#typesafe-images-box-questions-and-long-context) 的 TypeSafe `jev-1.14.0` 與 `jev-preview`，或帶有 [`supports_box_questions: true`](#box-questions-on-other-deployments) 的部署，且在 TypeSafe 上需要相同標頭 | 帶有 `top`、`bottom`、`left` 與 `right` 的 `box`、`confidence` |

模型不願回答的問題會以 `{"type": "refusal", "name": ...}` 回來

### 圖片輸入 {#image-input}

OpenAI、Gemini、Cloudflare Clef 與 TypeSafe 模型接受 `input_image` 部分，TypeSafe 僅限搭配[圖片標頭](#typesafe-images-box-questions-and-long-context)。`image_url` 是圖片 URL 或 data URL，`detail` 為可選且僅由 OpenAI 使用。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/decisions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "luna",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Here is the swatch the customer uploaded."},
        {"type": "input_image", "image_url": "data:image/png;base64,<BASE64_PNG>", "detail": "low"}
      ]
    }
  ],
  "questions": [
    {"type": "predicate", "name": "is_red", "instructions": "Is the swatch mostly red?"},
    {
      "type": "choice",
      "name": "color",
      "instructions": "Which color dominates the swatch?",
      "choices": [{"value": "red"}, {"value": "green"}, {"value": "blue"}]
    }
  ],
  "safety_identifier": "user-1234"
}'
```

純紅色方塊的回應

```json keep-model-ids
{
  "model": "gpt-6-luna",
  "answers": [
    {"type": "predicate", "name": "is_red", "probability": 1.0},
    {
      "type": "choice",
      "name": "color",
      "choice": "red",
      "probabilities": [
        {"value": "red", "probability": 1.0},
        {"value": "green", "probability": 0.0},
        {"value": "blue", "probability": 0.0}
      ],
      "confidence": 1.0
    }
  ],
  "usage": {
    "input_tokens": 277,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 0,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 277
  }
}
```

將 `"model"` 改為 `"clef"` 會把圖片送到 Cloudflare。Cloudflare 不接受 `safety_identifier`，因此請移除該欄位或開啟 `drop_params`。同一塊色樣接著回傳

```json
{
  "model": "clef",
  "answers": [
    {"type": "predicate", "name": "is_red", "probability": 0.995},
    {
      "type": "choice",
      "name": "color",
      "choice": "red",
      "probabilities": [
        {"value": "red", "probability": 0.9908},
        {"value": "green", "probability": 0.0043},
        {"value": "blue", "probability": 0.0049}
      ],
      "confidence": 0.9727
    }
  ],
  "usage": {
    "input_tokens": 289,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 0,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 289
  }
}
```

在呼叫 Cloudflare 之前，LiteLLM 會將圖片 URL 下載成 data URL 並檢查 Clef 的限制：每個請求最多 4 張圖片，每張是最多 4 MiB 的 PNG、JPEG 或 WebP，總共最多 8 MiB。超過限制的請求會在呼叫 Cloudflare 之前得到 400。開啟 `drop_params` 時，其他類型的圖片會改為被丟棄，且 4 張圖片的限制只計算剩下的圖片。Cloudflare 接收連接成 `state` 的文字部分與一份獨立清單中的圖片，因此模型看不到哪段文字與哪張圖片相鄰。

其他提供者不接受圖片，TypeSafe 僅在搭配圖片標頭時接受。因此同一個請求，若 `"model": "jev"`、沒有 `safety_identifier` 也沒有圖片標頭，會在呼叫 TypeSafe 之前被拒絕。

```json
{
  "error": {
    "message": "litellm.UnsupportedParamsError: typesafe does not support parameters: ['input_image'], for model=typesafe/jev-latest. To drop these, set `litellm.drop_params=True` or for proxy:\n\n`litellm_settings:\n drop_params: true`\n\n\nLiteLLM: model group 'jev' failed with the error above. No fallback was attempted.",
    "type": "invalid_request_error",
    "param": null,
    "code": "400"
  }
}
```

在 `litellm_settings` 中或部署上設定 `drop_params: true` 時，LiteLLM 會丟棄圖片，只傳送文字。丟棄後沒有剩下文字的請求仍會得到 400。

### JSON 輸入 {#json-input}

OpenAI 模型會在使用者訊息中接受 `input_json` 部分。`data` 是一個物件或一份物件陣列，LiteLLM 會把它原樣傳送給提供者，放在訊息的其他部分旁邊。developer 或 system 訊息中的 `input_json` 部分會得到 400，即使開啟 `drop_params` 也一樣。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/decisions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "luna",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Evaluate the ticket using the order evidence."},
        {"type": "input_json", "data": {"ticket": {"body": "Please refund the duplicate charge."}, "order": {"charges": [49, 49]}}}
      ]
    }
  ],
  "questions": [
    {"type": "predicate", "name": "duplicate_charge", "instructions": "Does the ticket describe a duplicate charge supported by the order?"}
  ]
}'
```

答案的形狀與純文字請求的答案相同。[`hide-secrets`](./proxy/guardrails/secret_detection.md) 防護欄也會檢查 `data` 內的鍵與字串值，把每個值連同其鍵一起讀取，並在請求送到提供者之前，把找到的每個 secret 換成 `[REDACTED]`。一個經過遮罩的鍵若會與同一物件中的另一個鍵衝突，就會得到一個編號，例如 `[REDACTED] (2)`，因此不會遺失任何值。[LLM Shield Proxy](./proxy/guardrails/llm_shield_proxy.md) 防護欄會把 `data` 內的鍵、字串值與數字中的個人資料換成替代值，而被換掉的數字會以字串形式傳送。其他讀取訊息文字的防護欄，例如禁用關鍵字、OpenAI 審核與 Azure Content Safety，會把 `data` 當作 JSON 文字讀取。Cisco AI Defense 無法改寫 `data`，因此當它要求遮罩一個帶有 `input_json` 的請求時，閘道會以 400 封鎖該請求，即使在監控模式下也一樣。

其他提供者會在呼叫提供者之前回傳一個指名 `input_json` 的 400。開啟 `drop_params` 時，LiteLLM 會丟棄 `input_json` 部分並傳送其餘部分。丟棄後沒有剩下輸入的請求仍會得到 400。`data` 不是物件或物件陣列時，即使開啟 `drop_params` 也會得到 400。

在負載平衡群組中，帶有 `input_json` 部分的請求只會送到接受它們的部署，沒有這些部分的請求仍會使用每一個部署。開啟 `drop_params` 時，不接受 JSON 的部署仍留在候選中並丟棄 JSON 部分，只要它還保有一些輸入。一個部署若在丟棄 JSON 部分以及它不接受的任何圖片或 developer 與 system 訊息後沒有剩下輸入，就會被跳過。因此，使用者訊息中只有 `input_json` 部分的請求，只會送到接受 JSON 的部署。群組中沒有部署能接受請求時，它會得到指名 `input_json` 的 400，然後群組的[備援](./proxy/reliability.md)會執行（若有的話）。未開啟 `drop_params` 時，若每個接受 JSON 的部署都在冷卻中，請求會得到同樣的 400，而在 1.108.x LTS 線上則會得到路由器的 429 冷卻錯誤。開啟 `drop_params` 時，不接受 JSON 的部署就能以其餘輸入來回答它。若要讓 JSON 請求留在讀取 JSON 的部署上，請把這些部署放在自己的模型群組中，並把 JSON 請求傳送到該群組。

## /v1/systemone {#v1systemone}

以 System One 格式提出的同類請求

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "jev",
  "state": "Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today.",
  "questions": {
    "is_refund_request": {"type": "noul", "instructions": "Is the customer asking for a refund?"},
    "urgency": {
      "type": "choice",
      "instructions": "How urgent is this?",
      "criteria": {"low": "can wait a week", "high": "needs action today"}
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the customer?",
      "criteria": ["calm", "mildly annoyed", "angry"]
    }
  }
}'
```

回應

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "is_refund_request": {"type": "noul", "noul": 0.99},
    "urgency": {
      "type": "choice",
      "choice": "high",
      "confidence": 1.0,
      "probabilities": {"low": 0.0, "high": 1.0}
    },
    "frustration": {
      "type": "score",
      "score": 0.95,
      "confidence": 0.86,
      "legend": {"0": "calm", "1": "mildly annoyed", "2": "angry"},
      "probabilities": {"0": 0.07, "1": 0.91, "2": 0.02}
    }
  },
  "usage": {"input_tokens": 391, "output_tokens": 67}
}
```

將 `"model"` 改為 `"luna"` 會改問 OpenAI，且仍回傳以問題名稱為鍵的 System One 答案

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `model` | string | 代理模型名稱，或在 SDK 中為 `<provider>/<model>` |
| `state` | string, object or array | 被評判的對象，例如支援工單、文件或聊天記錄 |
| `questions` | object | 1 至 128 個具名問題。每個鍵會成為 `answers` 中的一個鍵 |
| `images` | array, optional | 圖片 URL 或 data URL，提供者支援與規則見[圖片輸入](#image-input) |
| `assets` | object, optional | 以您在 `state` 中使用的名稱為鍵的圖片，每個為 `{"type": "image", "format": "png", "jpg" or "jpeg", "data_base64": ...}`。僅限 TypeSafe，搭配[圖片標頭](#typesafe-images-box-questions-and-long-context) |
| `audio` | array, optional | 最多 4 段音訊 clip，規則見[音訊與視訊輸入](#audio-and-video-input) |
| `videos` | array, optional | 最多 2 段視訊 clip，規則見[音訊與視訊輸入](#audio-and-video-input) |

每個問題都有一個 `type` 與一個可選的 `instructions` 欄位。問題上的額外欄位會原封不動地轉發給 System One 提供者

| `type` | `criteria` | 答案欄位 |
|--------|------------|---------------|
| `noul` | 可選的物件，帶有 `true` 與 `false` 說明。noul 問題需要 `instructions` 或 `criteria` | `noul`：答案為 true 的機率 |
| `choice` | 必填的物件，將 1 至 255 個標籤對應到說明 | `choice`、`confidence`、每個標籤的 `probabilities` |
| `score` | 必填的陣列，1 至 10 個層級，最低在前 | `score`（0 至層級數減 1）、`confidence`、`legend`、每個層級的 `probabilities` |
| `box` | 無。搭配[圖片標頭](#typesafe-images-box-questions-and-long-context) 的 TypeSafe `jev-1.14.0` 與 `jev-preview`，或帶有 [`supports_box_questions: true`](#box-questions-on-other-deployments) 的部署，且在 TypeSafe 上需要相同標頭 | 帶有 `top`、`bottom`、`left` 與 `right` 的 `box`、`confidence` |

在兩條路由上，違反這些規則的請求（例如完全沒有問題、choice 值重複，或有 11 個層級的 `score` 問題）都會在呼叫任何提供者之前被 LiteLLM 以 400 拒絕

## 音訊與視訊輸入 {#audio-and-video-input}

Gemini Decision 1 與 Cloudflare Clef-omni 會連同文字一起讀取音訊與視訊 clip。將它們放在頂層的 `audio` 與 `videos` 欄位中，在 `/v1/systemone` 上放在 `state` 旁邊，或在 `/v1/decisions` 上放在 `input` 旁邊。一個請求最多接受 4 段音訊 clip 與 2 段視訊 clip。每段 clip 是一個 base64 data URL，例如 `data:audio/wav;base64,...` 或 `data:video/mp4;base64,...`，在 `;base64` 之前不帶例如 `;codecs=` 的媒體類型參數，或是一個物件，例如 `{"content_type": "audio/wav", "base64": "..."}`。`null` 或空清單表示沒有該類 clip。其他形式的 clip，或 clip 數量更多的請求，會在呼叫提供者之前得到 400。LiteLLM 檢查 clip 的數量與形式，以及音訊 clip 的媒體類型以 `audio/` 開頭、視訊 clip 以 `video/` 開頭。clip 長度、大小與確切格式的限制由提供者決定。

```yaml showLineNumbers
model_list:
  - model_name: clef-omni
    litellm_params:
      model: cloudflare/clef-omni
      api_key: os.environ/CLOUDFLARE_API_KEY
```

代理還需要 `CLOUDFLARE_ACCOUNT_ID`，或在部署上設定 `api_base`，與其他 Clef 模型相同。以 `jq` 建構請求，讓長 clip 不必塞進命令列

```bash showLineNumbers
base64 < call.wav | tr -d '\n' > call.b64

jq -n --rawfile clip call.b64 '{
  model: "clef-omni",
  state: "Listen to the attached call recording.",
  audio: [{content_type: "audio/wav", base64: $clip}],
  questions: {
    asks_for_refund: {type: "noul", instructions: "Does the caller ask for a refund?"}
  }
}' > request.json

curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d @request.json
```

LiteLLM 讀取成本對照來決定哪些模型接受 clip，而成本對照只標記 `cloudflare/clef-omni`。傳送給其他模型的 clip 會在呼叫提供者之前得到一個指名 `audio` 或 `videos` 的 400。開啟 `drop_params` 時，LiteLLM 會改為丟棄它們（不論格式是否正確），並傳送請求的其餘部分。`openai/` 與 `azure/` 上的部署無論其旗標如何都拒絕 clip。

### 其他部署上的音訊與視訊 {#audio-and-video-on-other-deployments}

<SinceVersion v="1.110.0" />

若要將 clip 傳送到成本對照未標記的部署，請在部署的 `model_info` 中設定 `supports_audio_input: true`、`supports_video_input: true` 或兩者。若要對成本對照有標記的部署停止某一類 clip，請將其旗標設為 `false`。這個部署在 `cloudflare/clef-omni` 上保留視訊並關閉音訊。

```yaml showLineNumbers
model_list:
  - model_name: clef-omni-video-only
    litellm_params:
      model: cloudflare/clef-omni
      api_key: os.environ/CLOUDFLARE_API_KEY
    model_info:
      supports_audio_input: false
```

每個旗標對其自己的 clip 類型優先於成本對照。`true` 為該部署開啟該類型，`false` 將其關閉，即使在 `cloudflare/clef-omni` 上也一樣，因此送到它的 clip 會得到與送到不支援音訊或視訊的模型相同的 400，或在開啟 `drop_params` 時相同的丟棄行為。沒有旗標的部署對該類型使用成本對照。這些旗標只在決策模型上計數。當部署設定 `mode` 時，它必須是 `decisions` 或 `evaluation`。當它未設定時，成本對照中該模型的 mode 必須是其中之一，或成本對照未列出該模型。因此聊天部署的 `supports_audio_input`（描述的是聊天輸入）不會開啟 clip。值必須是布林值。任何其他值（例如字串 `"true"`）都不會開啟 clip，且可能將其關閉，影響該部署與其未設旗標的同類部署。[其他部署上的 box 問題](#box-questions-on-other-deployments)中關於萬用字元部署與同提供者同模型未設旗標部署的註記也適用於這些旗標，因此當某個模型的任一部署設定了旗標時，請在該模型的每個部署上都設定它。在 SDK 中，傳入 `model_info={"supports_audio_input": True}`。

在負載平衡群組中，帶有 clip 的請求只會送到依其自身旗標或成本對照接受 clip 的部署，而沒有 clip 的請求仍使用每個部署。開啟 `drop_params` 的部署會留在挑選中，並丟棄它不接受的 clip。當群組中沒有部署接受 clip 時，請求會送到整個群組，並得到指名 `audio` 或 `videos` 的 400。在 `litellm_settings` 或 `router_settings.default_litellm_params` 中設定 `drop_params: true` 時，每個部署都被視為接受 clip，因此 clip 請求會送到整個群組，不接受的部署會丟棄 clip 並在沒有 clip 的情況下回答。若要讓 clip 請求只送到能讀取 clip 的部署，請將那些部署放在它們自己的模型群組中，並將 clip 請求送到該群組。

這些旗標只控制 LiteLLM 傳送什麼。在對部署設定 `true` 之前，請檢查提供者是否讀取 clip，因為不論提供者是否使用，LiteLLM 都會傳送它們。例如，截至 2026 年 10 月，OpenRouter 的 `cloudflare/clef-omni` 路由接受 clip 並像沒有傳送 clip 一樣回答，因此請透過 `cloudflare/clef-omni` 將 clip 傳送給 Clef-omni。

在 `v1.110.0` 之前，LiteLLM 不會依部署套用這些旗標。SDK 會忽略它們。在代理上，旗標可能改變同一個模型每個部署的 clip，或完全不起作用，取決於模型名稱的寫法。帶有 clip 的請求送到負載平衡群組時，也可能送到不接受它們的部署，並得到指名 `audio` 或 `videos` 的 400。

## TypeSafe 圖片、box 問題與長上下文 {#typesafe-images-box-questions-and-long-context}

TypeSafe Jev 1.14 讀取圖片並回答 `box` 問題，而 TypeSafe 將兩者都放在選擇加入的請求標頭之後。代理會將任何以 `TypeSafe-Danger-Zone-` 開頭的用戶端標頭轉發給 TypeSafe 部署，且不轉發給任何其他提供者。

| 標頭 | 啟用的功能 |
|--------|------------------|
| `TypeSafe-Danger-Zone-Images: true` | `/v1/systemone` 上 `assets` 中的圖片、`/v1/decisions` 上的 `input_image` 部分，以及兩條路由上的 `box` 問題 |
| `TypeSafe-Danger-Zone-Long-Context: true` | 超過 TypeSafe 預設限制（每個請求 64k 權杖、每個問題 32k）的請求 |

為 `assets` 中的每張圖片命名，並在 `state` 中使用該名稱，因為 TypeSafe 會拒絕 state 從未提及的資產。這個請求詢問一張照片是否顯示紅色方塊以及它在哪裡

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-H 'TypeSafe-Danger-Zone-Images: true' \
-d '{
  "model": "jev-1.14.0",
  "state": {"photo": "photo-7f3a9c"},
  "assets": {
    "photo-7f3a9c": {"type": "image", "format": "png", "data_base64": "<BASE64_PNG>"}
  },
  "questions": {
    "has_red_square": {"type": "noul", "instructions": "Is there a red square in `photo`?"},
    "red_square": {"type": "box", "instructions": "the red square in `photo`"}
  }
}'
```

box 的邊緣是圖片高度與寬度的分數，從左上角量起

```json
{
  "model": "jev-1.14.0",
  "answers": {
    "has_red_square": {"type": "noul", "noul": 0.99},
    "red_square": {"type": "box", "box": {"top": 0.11, "bottom": 0.51, "left": 0.49, "right": 0.83}, "confidence": 0.94}
  },
  "usage": {"input_tokens": 756, "output_tokens": 39}
}
```

在 `/v1/decisions` 上，以相同的標頭將圖片作為 `input_image` 部分傳送。LiteLLM 將每張 PNG 或 JPEG 轉成一個資產，把資產的名稱放在文字中圖片原本的位置，並先下載圖片 URL。`box` 問題會在 `answers` 中的其位置以 `{"type": "box", "name": ..., "box": {...}, "confidence": ...}` 回來。

沒有部署旗標時，`box` 在 `jev-1.14.0` 與 `jev-preview` 上運作，且僅限搭配圖片標頭，即使請求沒有圖片也一樣。對其他模型（包含 `jev-1.13.0` 與 `jev-latest`）的 box 問題，或沒有標頭的 box 問題，會在呼叫提供者之前得到 400，或在開啟 `drop_params` 時，LiteLLM 丟棄該問題。部署的 [`supports_box_questions`](#box-questions-on-other-deployments) 旗標會改變哪些模型接受 box 問題，但 TypeSafe 部署仍需要標頭。被丟棄的問題在 `/v1/decisions` 上以 `{"type": "refusal"}` 回來，在 `/v1/systemone` 上則從 `answers` 中省略。沒有圖片標頭時，`assets` 與 `input_image` 部分在 TypeSafe 上會得到與在沒有圖片輸入的提供者上相同的 400 或丟棄，且在開啟 `drop_params` 時，LiteLLM 也會丟棄任何它無法讀取的 `assets` 條目並保留其餘部分。

在 SDK 中，將標頭傳入 `extra_headers`

```python showLineNumbers
import litellm

response = litellm.systemone(
    model="typesafe/jev-1.14.0",
    state={"photo": "photo-7f3a9c"},
    assets={"photo-7f3a9c": {"type": "image", "format": "png", "data_base64": "<BASE64_PNG>"}},
    questions={"red_square": {"type": "box", "instructions": "the red square in `photo`"}},
    extra_headers={"TypeSafe-Danger-Zone-Images": "true"},
)
print(response.answers["red_square"].box)
```

### 其他部署上的 box 問題 {#box-questions-on-other-deployments}

LiteLLM 讀取成本對照來決定哪些模型接受 `box` 問題，而成本對照只標記 TypeSafe `jev-1.14.0` 與 `jev-preview`。若要將 box 問題傳送到成本對照未標記的部署（例如 `typesafe/jev-latest`），請在部署的 `model_info` 中設定 `supports_box_questions: true`。

```yaml showLineNumbers
model_list:
  - model_name: jev
    litellm_params:
      model: typesafe/jev-latest
      api_key: os.environ/TYPESAFE_API_KEY
    model_info:
      supports_box_questions: true
```

TypeSafe 的 box 問題仍需要[圖片標頭](#typesafe-images-box-questions-and-long-context)。如上所示隨每個請求傳送它，或在部署的 `extra_headers` 中設定它。在另一條路由上呼叫 TypeSafe API 的部署必須使用 `extra_headers`，因為代理只將用戶端的 TypeSafe 標頭轉發給 `typesafe/` 部署。

部署旗標優先於成本對照。`true` 為該部署開啟 box 問題，`false` 將其關閉，即使在 `jev-1.14.0` 與 `jev-preview` 上也一樣，因此送到它的 box 問題會得到與送到不支援 box 的模型相同的 400，或在開啟 `drop_params` 時相同的丟棄行為。沒有旗標的部署使用成本對照。值必須是布林值，因為任何其他值（例如字串 `"true"`）都不會開啟 box 問題，且可能將其關閉，影響該部署與其未設旗標的同類部署。在萬用字元部署（例如 `typesafe/*`）上，旗標適用於該部署對應的每個模型。在 SDK 中，傳入 `model_info={"supports_box_questions": True}`。代理會忽略請求主體頂層的 `model_info` 欄位。

旗標只控制 LiteLLM 傳送什麼，提供者仍必須回答。開啟旗標時，即使 `drop_params` 開啟，LiteLLM 也會傳送 box 問題，因此拒絕它們的模型會以提供者的錯誤讓整個請求失敗。`typesafe/jev-latest` 是 TypeSafe 可以移動到另一個模型的別名，它在服務 `jev-1.14.0` 時回答 box 問題，每個回應都會在其 `model` 欄位中列出該名稱。OpenAI 不回答 box 問題，因此設了旗標的 OpenAI 部署仍會以 OpenAI 對送到 `gpt-6-luna` 的 box 問題回傳的 400 失敗。在對自我託管伺服器，或通往 Jev 的託管路由（例如 OpenRouter 或 Databricks 的路由）設定旗標之前，請檢查它是否回答 box 問題。

未設定旗標的部署可能取得同提供者同模型的另一個部署所設定的值，因此一個 `false` 也可能關閉其未設旗標同類部署上的 box 問題，且該值在設定它的部署被移除後仍可能留存。當多個部署設定不同的值時，未設定的部署取得的值取決於它們在設定中的順序。當某個模型的任一部署設定了旗標時，請在該模型的每個部署上都設定它。在 `v1.107.0-rc.1` 之前，部署自己的值不會優先於同提供者同模型的其部署，因此 `true` 與 `false` 不能在同一個提供者與模型上混用。

## SDK 用法 {#sdk-usage}

SDK 對每種請求格式各有一個函式。`litellm.decisions` 接受 OpenAI Decisions 形狀（`input`、一份 `questions` 清單與一個可選的 `safety_identifier`），並回傳 OpenAI 回應，其中 `answers` 是清單。`litellm.systemone` 接受 System One 形狀（`state` 與一份以問題名稱為鍵的 `questions` 對照），並回傳 System One 回應，其中 `answers` 以問題名稱為鍵。兩者都能與每個受支援的提供者運作，因此您依您撰寫的請求形狀挑選函式，而不是依您呼叫的提供者。

```python showLineNumbers title="OpenAI Decisions format" keep-model-ids
import os
import litellm

os.environ["OPENAI_API_KEY"] = ""

response = litellm.decisions(
    model="openai/gpt-6-luna",
    input="Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today.",
    questions=[
        {"type": "predicate", "name": "is_refund_request", "instructions": "Is the customer asking for a refund?"},
    ],
)
print(response.answers[0].probability)
print(response.usage)
```

```python showLineNumbers title="System One format"
import os
import litellm

os.environ["TYPESAFE_API_KEY"] = ""

response = litellm.systemone(
    model="typesafe/jev-latest",
    state="Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today.",
    questions={
        "is_refund_request": {"type": "noul", "instructions": "Is the customer asking for a refund?"},
    },
)
print(response.answers["is_refund_request"].noul)
```

非同步版本是 `litellm.adecisions` 與 `litellm.asystemone`，接受相同的引數。

```python showLineNumbers
import asyncio
import os
import litellm

os.environ["TYPESAFE_API_KEY"] = ""

async def main():
    response = await litellm.asystemone(
        model="typesafe/jev-latest",
        state="Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today.",
        questions={
            "is_refund_request": {"type": "noul", "instructions": "Is the customer asking for a refund?"},
        },
    )
    print(response.answers["is_refund_request"].noul)

asyncio.run(main())
```

四個函式都還接受 `safety_identifier`、`api_key`、`api_base`、`timeout`、`custom_llm_provider`、`extra_headers`、`model_info`，以及[音訊與視訊輸入](#audio-and-video-input)中所述的 `audio` 與 `videos` clip。`litellm.systemone` 與 `litellm.asystemone` 還接受 `images`（一份圖片 URL 或 data URL 清單）與 `assets`（[TypeSafe 圖片、box 問題與長上下文](#typesafe-images-box-questions-and-long-context)中所述的 TypeSafe 圖片對照）。將 `images` 傳入 `litellm.decisions` 會引發 `BadRequestError`，除非 `drop_params` 開啟，因為 OpenAI 格式以 `input_image` 部分攜帶圖片。將 `input` 傳入 `litellm.systemone` 會引發指向 `litellm.decisions` 的 `BadRequestError`。將 `state` 傳入 `litellm.decisions` 對既有呼叫者仍可運作，它傳送 System One 格式並發出指向 `litellm.systemone` 的 `UserWarning`。前綴不是受支援提供者之一的模型會以列出受支援提供者的 `BadRequestError` 失敗。

透過 Router 時，同樣的區分適用：`router.decisions` 與 `router.adecisions` 接受 OpenAI 形狀，`router.systemone` 與 `router.asystemone` 接受 System One 形狀。在代理上，`/v1/systemone` 請求以呼叫類型 `asystemone` 記錄，`/v1/decisions` 請求以 `adecisions` 記錄。

:::info 從 v1.104.x 升級
在 v1.104.2 至 v1.104.x 中，`litellm.decisions` 接受兩種形狀，並依您傳入 `input` 或 `state` 挑選格式。這些呼叫維持不變地運作，並帶有 `UserWarning`。方便時將 `litellm.decisions(state=...)` 改名為 `litellm.systemone(state=...)`，引數維持相同。
:::

### 透過 LiteLLM 代理傳送決策呼叫 {#send-decision-calls-through-a-litellm-proxy}

為模型加上 `litellm_proxy/` 前綴，即可把呼叫傳送到另一個 LiteLLM 代理。`litellm.decisions` 呼叫會送到該代理的 `/v1/decisions`，`litellm.systemone` 呼叫則送到其 `/v1/systemone`，因此該代理的虛擬金鑰需要有您所呼叫路由的存取權。答案包含直接呼叫該模型會回傳的欄位，而呼叫的成本取自該代理的 `x-litellm-response-cost` 標頭，否則取前綴後模型的成本對照價格。

```python showLineNumbers title="SDK through a LiteLLM proxy"
import os
import litellm

os.environ["LITELLM_PROXY_API_BASE"] = "https://litellm.example.com"
os.environ["LITELLM_PROXY_API_KEY"] = "sk-..."

response = litellm.systemone(
    model="litellm_proxy/jev",
    state="Customer wrote: I was charged twice for my order #4411 and want one of the charges refunded today.",
    questions={
        "is_refund_request": {"type": "noul", "instructions": "Is the customer asking for a refund?"},
    },
)
print(response.answers["is_refund_request"].noul)
```

在呼叫上設定 `use_litellm_proxy=True`，或設定 `litellm.use_litellm_proxy = True`，即可把沒有前綴的模型也傳送到同一個代理。您在呼叫上傳入的 `drop_params` 也會一併送到該代理，而全域的 `litellm.drop_params` 則留在本機。

在代理上，`litellm_proxy/` 部署會把決策呼叫轉送到其 `api_base` 所指名的 LiteLLM 代理。該部署自己的 `drop_params` 也會一併送到該代理，而 `litellm_settings` 中的 `drop_params` 則留在本機。

```yaml showLineNumbers
model_list:
  - model_name: jev
    litellm_params:
      model: litellm_proxy/jev
      api_base: https://litellm.example.com
      api_key: os.environ/UPSTREAM_LITELLM_KEY
    model_info:
      mode: decisions
```

## 限制 {#limits}

OpenAI 要求每個問題都有 `instructions`，且至少有 2 個 choice 或 score 層級。當沒有 `instructions` 的 System One 問題送到 OpenAI 模型時，LiteLLM 會填入一個通用的說明，例如 "Which choice best fits the input?"，而 noul 問題的 `criteria` 會被摺入 OpenAI 看到的 instructions 中。只有一個標籤的 choice 或只有一個層級的 score 沒有 OpenAI 對應形式，因此 LiteLLM 會在呼叫 OpenAI 之前以 400 拒絕它

choice 問題不能同時有布林值與文字相同的字串，例如 `true` 與 `"true"`，因為 System One 提供者以其文字作為 choice 的鍵。LiteLLM 會以 400 拒絕該請求

vLLM 每個請求最多接受 64 個問題，每個 `choice` 26 個選項，每個 `score` 10 個層級，如其 [Structured Decisions](https://github.com/vllm-project/vllm/blob/v0.32.0/docs/serving/online_serving/structured_decisions.md#limits) 文件的 Limits 章節所列

## 在 Admin UI 中試用 {#try-it-in-the-admin-ui}

### 新增決策模型 {#add-a-decision-model}

前往 **Models + Endpoints**，開啟 **Add Model** 分頁並挑選提供者，例如 OpenAI。在 **LiteLLM Model Name(s)** 下挑選決策模型，例如 `gpt-6-luna`，一個 **Decision model** 註記會確認此挑選並連到 Decisions playground。如同其他模型一樣輸入提供者憑證，然後點擊 **Add Model**。該模型接著會在 `/v1/decisions` 與 `/v1/systemone` 上以其公開模型名稱回答。需要端點 URL 的提供者（例如 Databricks 與 Microsoft Foundry）將其填入 **API Base** 欄位，與[代理設定](#proxy-setup)中的 `api_base` 對應。可選的 **Mode** 下拉選單自 `v1.107.0-rc.1` 起有 **Decisions - /v1/decisions** 條目（在 `v1.106.0` 中名為 **Evaluation - /v1/decisions**），用於透過 `/v1/decisions` 對模型做健康檢查。

<Image img={require('../img/decisions_add_model.png')} alt="Add Model 已挑選 OpenAI 與 gpt-6-luna，並顯示 Decision model 註記" />

### Decisions playground {#decisions-playground}

Playground 的 **Decisions** 分頁 (Beta) 將請求傳送到兩條路由。在 `LITELLM_PROXY_BASE_URL/ui/?page=llm-playground&tab=system-one` 開啟它，或前往 **Playground** 並挑選 **Decisions**。**Endpoint** 選擇器挑選 `/v1/decisions`（OpenAI Decisions 格式）或 `/v1/systemone`（System One 格式）。**Model** 選擇器列出您 `model_list` 中的決策模型，例如[代理設定](#proxy-setup)中的 `jev`，而沒有決策模型的代理會改為顯示 **Add a decision model** 連結。例如 `luna` 的 OpenAI 決策模型，在其 `model_info` 設定 `mode: evaluation` 後會被列出。

```yaml showLineNumbers keep-model-ids
model_list:
  - model_name: luna
    litellm_params:
      model: openai/gpt-6-luna
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: evaluation
```

**API key** 挑選金鑰。**Current UI Session** 使用您的儀表板登入，**Virtual Key** 將呼叫歸屬到您貼上的金鑰。**Load example** 填入四個請求之一：**Triage a bug report**、**Route a support ticket**、**Moderate a forum comment** 或 **Score a sales lead**。表單一開始是空的，橡皮擦按鈕會清除它。將模型應讀取的文字輸入 **Input**，然後為每個問題給一個 **Name**、一個 **Answer type** 與 **Instructions**。答案類型在 `/v1/systemone` 上是 **Choice**、**Yes / no** 與 **Score**，在 `/v1/decisions` 上是 **Predicate**、**Choice** 與 **Score**，後者還接受一個可選的 **Safety identifier**。**Add question** 新增一張卡片，垃圾桶按鈕移除問題、選項與層級。**cURL** 分頁將相同請求顯示為會隨您的編輯變化的 curl 命令，**Copy cURL** 在表單沒有問題時複製它。表單只接受文字，因此請以 curl 或 SDK 傳送圖片、音訊與視訊輸入。

表單能抓到的問題（例如空的 **Input**）會列在 **Send** 上方，**Send** 在它們修復之前保持停用。其他問題在您傳送時從提供者回來，例如沒有 instructions 也沒有 **Yes means** 或 **No means** 的 `/v1/systemone` yes / no 問題。呼叫回來後，每個問題顯示其答案與機率，**Response** 標頭顯示延遲、回應中的模型名稱與權杖使用量。**Raw response** 開啟 JSON 主體。錯誤（例如金鑰錯誤的 401）會顯示 **Decisions request failed** 與錯誤訊息，而不是答案。

<Image img={require('../img/decisions_playground_systemone.png')} alt="Decisions playground 已挑選 /v1/systemone 與 jev 模型，Form 分頁中有錯誤報告分流範例及其答案" />

<Image img={require('../img/decisions_playground_openai.png')} alt="Decisions playground 已挑選 /v1/decisions 與 luna 模型，錯誤報告分流範例帶有 choice、predicate 與 score 問題及其答案" />

此分頁在 `v1.106.0` 與更新版本中，且不在 `v1.104.2` 或 `v1.105.0` 中。`v1.106.0` 一開始填入第一個範例，從下拉選單而不是 **Load example** 挑選其他範例，並將橡皮擦標示為 **Clear**。[TypeSafe 頁面](./pass_through/typesafe.md#try-it-in-the-admin-ui)逐步介紹 System One 表單、驗證與答案檢視。

## 將決策模型用作防護欄 {#use-a-decision-model-as-a-guardrail}

[決策模型防護欄](./proxy/guardrails/decision_model.md)對每個請求或回應詢問任何[受支援的決策模型](#supported-providers)您撰寫的 yes/no 問題，並在機率達到其閾值時封鎖或記錄該呼叫

## 決策路由與直通路由的比較 {#decision-routes-vs-pass-through-routes}

位於 `/typesafe/v1/systemone` 的 [TypeSafe 直通](./pass_through/typesafe.md)只將原始請求轉發給 TypeSafe，並從代理環境讀取金鑰。位於 `/openrouter/alpha/decisions` 的 [OpenRouter 直通](./providers/openrouter.md#through-the-openrouter-pass-through)只將原始請求轉發給 OpenRouter。`/v1/decisions` 與 `/v1/systemone` 使用您 `model_list` 中的模型，因此您可以切換提供者、負載平衡並設定每個部署的金鑰，而不改變請求主體
