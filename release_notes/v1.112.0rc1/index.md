---
title: "LiteLLM v1.112.0rc1 新增控制平面與 Perplexity Orchestrator"
description: "為資料平面叢集新增控制平面、Perplexity Orchestrator 提供者、429 重試優先佇列，以及共用預算的應用程式群組。"
slug: "v1-112-0-rc-1"
date: 2026-11-24T22:29:04
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
docker.litellm.ai/berriai/litellm:1.112.0-rc.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.112.0rc1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.112.0-rc.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.112.0-rc.1) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

已發佈的 GitHub 標籤為 `v1.112.0-rc.1`。這些說明將其與前一個 release candidate `v1.111.0-rc.3` 比較。已回溯至 `rc/1.111.0` 並已隨 `v1.111.0` 發佈的變更不在此列。

面向客戶的變更列在前面。測試、CI 與內部變更列在底部。

:::danger[重大變更]

與最新穩定版本 [`v1.111.0`](/release_notes/v1.111.0/v1-111-0) 相比，以下變更在升級時需要注意。

**FOCUS 匯出現在使用 FOCUS 1.5 結構描述，不再寫入 `ProviderName` 與 `PublisherName` 欄位。**從 CSV 或 Parquet 匯出讀取這些欄位的查詢與儀表板，必須改讀 `ServiceProviderName`。請參閱 [PR #52105](https://github.com/BerriAI/litellm/pull/52105)。

**`/v1/chat/completions` 與 `/v1/messages` 現在會以 400 拒絕 `previous_response_id`。**先前，對於 LiteLLM 透過提供者的 Responses API 服務的模型，帶有 `previous_response_id` 的請求會回傳 200 並繼續使用已儲存的回應，在 Bedrock 上，每一輪後續對話都會對系統提示詞重複計費兩次。現在它會回傳 400，並指向 `/v1/responses`，而 `/v1/messages/count_tokens` 也會回傳相同的 400。`/v1/responses` 仍會接受此欄位。請改為在 `messages` 中傳送先前的對話輪次，或將呼叫移至 `/v1/responses`。`drop_params: true` 不會略過此檢查。如果您暫時無法變更用戶端，請在部署上將此欄位加入 `additional_drop_params`，LiteLLM 就會捨棄在請求主體最上層傳送的 `previous_response_id`，而非拒絕請求。如此一來，模型只會看到 `messages`，因此只有在用戶端已傳送完整對話紀錄時才使用此做法。請參閱 [PR #53038](https://github.com/BerriAI/litellm/pull/53038)。

```yaml
model_list:
  - model_name: gpt-openai-chat
    litellm_params:
      model: openai/responses/gpt-6.2-sol
      api_key: os.environ/OPENAI_API_KEY
      additional_drop_params: ["previous_response_id"]
```

:::

## 重點摘要 {#key-highlights}

`v1.112.0rc1` 是 1.112.0 目前的 release candidate。

- **控制平面**：以 `--control-plane` 啟動的控制平面，可管理資料平面的叢集用量、管理直通、OCSF 稽核事件，以及 S3 Object Lock、Splunk 與 Sentinel 稽核接收端
- **新提供者**：Perplexity Orchestrator、Vispark、ResetData、Gradium 文字轉語音與 Gnani 轉錄
- **優先佇列**：部署回傳 429 或 529 時，自願加入的佇列會暫存非同步非串流聊天請求
- **客戶管理**：共用預算的應用程式群組、設有上限的預算結轉、請求附加費用、非美元定價與各應用程式預算
- **Realtime**：WebRTC 上的 `gpt-live-1`，支援 sideband 附加、Realtime WebRTC 通話計費，以及 Vertex AI 上的 Gemini Live Avatar
- **Rust 閘道**：Vertex AI 上的 Claude、Bedrock Mantle 與 AWS `/v1/messages` 上的 Claude Platform 皆在 Rust 上執行，原生閘道現在會執行重試、備援與冷卻
- **Lens**：`/lens/login` 登入、透過 `POST /v1/traces` 轉發代理程式 span，以及 Lens 0.2.0 UI
- **簡體中文**：管理 UI 帳戶選單新增語言選擇器，支援簡體中文與 4,243 條新增翻譯字串，未翻譯的文字仍以英文顯示。歡迎提交更多語言的翻譯 PR。請在 [locales 資料夾](https://github.com/BerriAI/litellm/tree/main/litellm/ui/litellm-dashboard/src/i18n/locales)中，於 `en.json` 旁新增 locale 檔案，並在 `languages.ts` 中註冊

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（5 個新提供者） {#new-providers-5-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Perplexity Orchestrator | `/v1/chat/completions`、`/v1/responses`、`/v1/messages` | 透過 Perplexity 的 orchestrator，在 `perplexity_orchestrator/` 下呼叫 Claude、GPT 與其他模型，支援 47 個模型的成本追蹤 |
| Vispark | `/v1/chat/completions`、`/v1/responses`、`/v1/messages` | `vispark/` 下的 Vision Small、Medium 與 Large 模型 |
| ResetData | `/v1/chat/completions`、`/v1/responses`、`/v1/messages`、`/v1/audio/transcriptions` | `resetdata/` 下與 OpenAI 相容的聊天與 Whisper 轉錄模型 |
| Gradium | `/v1/audio/speech` | `gradium/` 下的文字轉語音 |
| Gnani | `/v1/audio/transcriptions` | `gnani/` 下的 Prisma v2.5 與 v3.0 REST 轉錄 |

## 新模型 / 更新的模型 {#new-models--updated-models}

#### 新模型支援（1,157 筆新型錄項目） {#new-model-support-1157-new-catalog-entries}

數量為與 `v1.111.0` 相比新增的型錄識別碼，包含別名與地區變體。價格為此版本內附的值，以美元計價，執行階段重新載入定價對映表時可以更新。移除了兩列 GovCloud 資料：`bedrock/us-gov-east-1/claude-sonnet-4-5-20250929-v1:0`、`bedrock/us-gov-west-1/claude-sonnet-4-5-20250929-v1:0`。

- **Amazon Bedrock**：776 筆新資料。378 筆為 Gemma 3、MiniMax M2、Mistral Devstral、Magistral、Ministral 與 Voxtral、DeepSeek V3.2 及 GPT-5.6 在各區域的 Mantle 資料。349 筆為 Nova 2 Lite、Nova Lite、Pro 與 Micro、GLM 4.7 與 5、Nemotron Super 3、gpt-oss 及 GPT-5.6 Cyber 與 Daybreak Blue 的區域 Converse 資料。其餘 49 筆包含 Mistral、Llama 3.2、Kimi K2.5、Nova Sonic，以及 Mantle Claude Fable 5、Mythos 5 與 Opus 4.7
- **NVIDIA NIM**：84 個模型，來自更新後的內附型錄
- **fal.ai**：67 個圖片與影片端點，包含 Seedance 2.5 Flash 與 PixVerse v3.5 至 v5
- **Perplexity Orchestrator**：`perplexity_orchestrator/` 下的 47 個模型

<details>
<summary>其餘 183 筆新型錄項目</summary>

| 提供者 | 模型 | 上下文視窗 | 輸入（每 100 萬 tokens / 美元） | 輸出（每 100 萬 tokens / 美元） | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| AssemblyAI | `assemblyai/assemblyai-stt-3-7` | - | - | - | 轉錄；每秒輸入 $0.000058 |
| AssemblyAI | `assemblyai/assemblyai-stt-3-7-realtime` | - | - | - | 轉錄；每秒輸入 $0.000083 |
| AssemblyAI | `assemblyai/assemblyai-stt-3-7-realtime-agent` | - | - | - | 轉錄；每秒輸入 $0.000125 |
| AssemblyAI | `assemblyai/universal-2` | - | - | - | 轉錄；每秒輸入 $0.000042 |
| AssemblyAI | `assemblyai/universal-3-5-pro` | - | - | - | 轉錄；每秒輸入 $0.000058 |
| AssemblyAI | `assemblyai/universal-3-6-pro` | - | - | - | 轉錄；每秒輸入 $0.000125 |
| Azure | `azure/apac/gpt-6.2-astra` | 922,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/apac/gpt-6.2-sol` | 922,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/eu/gpt-6.2-astra` | 922,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/eu/gpt-6.2-sol` | 922,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/gpt-6.2-astra` | 922,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/gpt-6.2-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/us-gov/gpt-4-turbo` | 128,000 | $12.5 | $37.5 | 聊天；工具呼叫 |
| Azure | `azure/us-gov/gpt-4.1` | 128,000 | $2.75 | $11 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us-gov/gpt-4.1-mini` | 128,000 | $0.55 | $2.2 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us-gov/gpt-4o` | 128,000 | $3.438 | $13.75 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us-gov/gpt-4o-2024-05-13` | 128,000 | $6.25 | $18.75 | 聊天；視覺；工具呼叫；提示快取 |
| Azure | `azure/us-gov/gpt-4o-2024-11-20` | 128,000 | $3.438 | $13.75 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us-gov/gpt-4o-mini` | 128,000 | $0.207 | $0.825 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us-gov/gpt-5.6-luna` | 922,000 | $0.275 | $1.65 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Azure | `azure/us-gov/gpt-5.6-sol` | 922,000 | $5.5 | $27.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Azure | `azure/us-gov/gpt-5.6-terra` | 922,000 | $2.75 | $16.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Azure | `azure/us-gov/o3-mini-2025-01-31` | 200,000 | $1.513 | $6.05 | 聊天；推理；提示快取 |
| Azure | `azure/us-gov/text-embedding-ada-002` | 8,192 | $0.125 | $0 | 嵌入 |
| Azure | `azure/us/gpt-6.2-astra` | 922,000 | $8.8 | $44 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure | `azure/us/gpt-6.2-sol` | 922,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure AI | `azure_ai/Microsoft-Decision-1.1` | 32,768 | $0.042 | $0 | 決策 |
| Azure AI | `azure_ai/gpt-5.6-luna` | 922,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/gpt-5.6-luna-2026-07-09` | 922,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/gpt-5.6-sol` | 922,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/gpt-5.6-sol-2026-07-09` | 922,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/gpt-5.6-terra` | 922,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/gpt-5.6-terra-2026-07-09` | 922,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/kimi-k3.1-pro` | 1,048,576 | $2.3 | $11.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Baseten | `baseten/decision-models/baseten-bison-latest` | 32,768 | $0.1 | $0 | 決策；視覺 |
| Baseten | `baseten/decision-models/baseten-groundhog-latest` | 16,384 | $0.035 | $0 | 決策；視覺 |
| ChatGPT | `chatgpt/gpt-6.2-astra` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 {/* keep-model-ids */} |
| ChatGPT | `chatgpt/gpt-6.2-astra-law` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 {/* keep-model-ids */} |
| ChatGPT | `chatgpt/gpt-6.2-sol` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 {/* keep-model-ids */} |
| Cloudflare | `cloudflare/@cf/thinkingmachines/inkling-2-small` | 1,048,576 | $0.3 | $1 | 聊天；推理；視覺；工具呼叫 |
| Cohere | `c4ai-aya-vision-32b` | 16,384 | - | - | 聊天；視覺 |
| Cohere | `command-a-reasoning-08-2025` | 256,000 | $0 | $0 | 聊天；推理；工具呼叫；結構化輸出 |
| Cohere | `command-a-translate-08-2025` | 8,000 | $0 | $0 | 聊天；工具呼叫；結構化輸出 |
| Cohere | `command-a-vision-07-2025` | 128,000 | $0 | $0 | 聊天；視覺；結構化輸出 |
| Cohere | `command-r7b-arabic-02-2025` | 128,000 | - | - | 聊天；工具呼叫；結構化輸出 |
| Cohere | `north-mini-code-1.0` | 256,000 | $0 | $0 | 聊天；推理；工具呼叫 |
| Cohere | `north-small-translate-1.0` | 16,000 | $0 | $0 | 聊天 |
| Cohere | `tiny-aya-earth` | 8,192 | - | - | 聊天；工具呼叫 |
| Cohere | `tiny-aya-fire` | 8,192 | - | - | 聊天；工具呼叫 |
| Cohere | `tiny-aya-global` | 8,192 | - | - | 聊天；工具呼叫 |
| Cohere | `tiny-aya-water` | 8,192 | - | - | 聊天；工具呼叫 |
| DashScope | `dashscope/qwen4-max` | 991,808 | $1.5 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；影片輸入 |
| Databricks | `databricks/system.ai.gemini-4-hydrogen` | 1,048,576 | $1.87502 | $9.37503 | 聊天；推理；提示快取 |
| Databricks | `databricks/system.ai.gpt-6-2-astra` | 922,000 | $8.00002 | $40.00003 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/system.ai.gpt-6-2-sol` | 922,000 | $1.99997 | $9.99999 | 回應；推理；視覺；工具呼叫；提示快取 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-1017-flex` | 1,048,576 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-1017-us` | 1,048,576 | $0.45 | $1.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/kimi-k3p1-pro-us` | 1,048,576 | $2.5 | $12.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Gemini | `gemini/gemini-4-neon` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；音訊輸入；影片輸入 |
| Gemini | `gemini/genie-4` | 1,048,576 | $1.5 | $9 | 聊天；視覺 |
| GitHub Copilot | `github_copilot/gemini-4-neon` | 200,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫 |
| GitHub Copilot | `github_copilot/gpt-6.2-astra` | 922,000 | $8 | $40 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6.2-sol` | 922,000 | $2 | $10 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/mai-code-2` | 128,000 | $0.5 | $2.5 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/mai-code-2-flash` | 128,000 | $0.05 | $0.25 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GMI | `gmi/google/gemini-4-hydrogen` | 1,048,576 | $1.5 | $7.5 | 聊天 |
| Gnani | `gnani/prisma-v2.5` | - | - | - | 轉錄 |
| Gnani | `gnani/prisma-v3.0` | - | - | - | 轉錄 |
| Gradium | `gradium/default` | - | - | - | 文字轉語音；每個字元 $0.00007 |
| Gradium | `gradium/gradium-tts-202602` | - | - | - | 文字轉語音；每個字元 $0.00007 |
| Gradium | `gradium/gradium-tts-beta` | - | - | - | 文字轉語音；每個字元 $0.00007 |
| InferenceAPIs | `inferenceapis/MiniMaxAI/MiniMax-M3.1-Flash` | 1,048,576 | $0.2 | $0.78 | 聊天；推理；工具呼叫；提示快取 |
| InferenceAPIs | `inferenceapis/moonshotai/Kimi-K2.6` | 262,144 | $0.98 | $4.55 | 聊天；推理；工具呼叫 |
| InferenceAPIs | `inferenceapis/moonshotai/Kimi-K3.1-Pro` | 1,048,576 | $2.6 | $13 | 聊天；推理；工具呼叫；提示快取 |
| InferenceAPIs | `inferenceapis/nvidia/NVIDIA-Nemotron-3.5-Super-VL` | 262,144 | $0.2 | $0.65 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Jina AI | `jina-embeddings-v5-omni-nano` | 8,192 | $0.02 | $0 | 嵌入 |
| Jina AI | `jina-embeddings-v5-omni-small` | 32,768 | $0.05 | $0 | 嵌入 |
| Jina AI | `jina-embeddings-v5-text-nano` | 8,192 | $0.02 | $0 | 嵌入 |
| Jina AI | `jina-embeddings-v5-text-small` | 32,768 | $0.05 | $0 | 嵌入 |
| Mistral | `mistral/voxtral-mini-transcribe-latest` | - | - | - | 轉錄；音訊輸入；每秒輸入 $0.000058 |
| Mistral | `mistral/voxtral-small-transcribe-latest` | - | - | - | 轉錄；音訊輸入；每秒輸入 $0.000067 |
| Nebius | `nebius/thinkingmachines/Inkling-2-Small` | 1,048,576 | $0.3 | $1 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| OpenAI | `gpt-6.2-astra` | 922,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| OpenAI | `gpt-6.2-astra-law` | 922,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| OpenAI | `gpt-6.2-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| OpenAI | `gpt-live-1.1` | - | - | - | 即時；工具呼叫；音訊輸入；每秒輸入 $0.000833 |
| OpenAI | `omni-moderation-csam-latest` | 32,768 | $0 | $0 | 審核 |
| OpenRouter | `openrouter/anthropic/claude-fable-5.2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/cloudflare/clef` | 65,537 | $0.192 | $0 | 評估 |
| OpenRouter | `openrouter/cloudflare/clef-flash` | 24,576 | $0.019 | $0 | 評估 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-flash` | 1,048,576 | $0.09 | $0.18 | 聊天；推理；工具呼叫；結構化輸出 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-pro` | 1,048,576 | $0.9 | $1.5 | 聊天；推理；工具呼叫；結構化輸出 |
| OpenRouter | `openrouter/google/gemini-4-hydrogen` | 1,048,576 | $1.5 | $7.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inception/mercury-decide` | 65,536 | $0.02 | $0 | 評估 |
| OpenRouter | `openrouter/inception/mercury-decide:free` | 65,536 | $0 | $0 | 評估 |
| OpenRouter | `openrouter/jaredpalmer/kev-4b` | 8,192 | $0.042 | $0 | 評估 |
| OpenRouter | `openrouter/liquid/d1` | 65,536 | $0.02 | $0 | 評估 |
| OpenRouter | `openrouter/openai/gpt-6-luna-decisions` | 1,050,000 | $0.1 | $0 | 評估 |
| OpenRouter | `openrouter/openai/gpt-6.2-astra` | 1,050,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-6.2-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/perplexity/pplx-decider-v1.1-27b` | 262,144 | $0.02 | $0 | 評估 |
| OpenRouter | `openrouter/respan/span-01` | - | $0.02 | $0 | 評估 |
| OpenRouter | `openrouter/respan/span-01-lite` | - | $0 | $0 | 評估 |
| OpenRouter | `openrouter/respan/span-01-lite:free` | - | $0 | $0 | 評估 |
| OpenRouter | `openrouter/togethercomputer/tev1-4b-experimental` | 32,768 | $0.042 | $0 | 評估 |
| OpenRouter | `openrouter/upstage/solar-decide` | 524,288 | $0.05 | $0 | 評估 |
| OpenRouter | `openrouter/upstage/solar-decide-flash` | 524,288 | $0.05 | $0 | 評估 |
| OpenRouter | `openrouter/~typesafe/jev-latest` | 262,144 | $0.042 | $0 | 評估 |
| Perplexity | `perplexity/openai/gpt-6.1-terra` | - | $1 | $5 | 回應 |
| Perplexity | `perplexity/openai/gpt-6.2-astra` | - | $8 | $40 | 回應 |
| Perplexity | `perplexity/openai/gpt-6.2-sol` | - | $2 | $10 | 回應 |
| Perplexity | `perplexity/pplx-decider-flash-v1.3` | - | $0.01 | $0 | 評估 |
| Perplexity | `perplexity/pplx-decider-v1.3` | - | $0.02 | $0 | 評估 |
| Perplexity | `perplexity/pplx-embed-v2-context-0.6b` | - | $0.02 | - | 嵌入 |
| Perplexity | `perplexity/pplx-embed-v2-context-9b` | - | $0.12 | - | 嵌入 |
| ResetData | `resetdata/deepseek/deepseek-v4-flash` | 1,048,576 | $0.07432 | $0.1486 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ResetData | `resetdata/google/gemma-4-26b-a4b-it` | 262,144 | $0.06054 | $0.3328 | 聊天；視覺；工具呼叫；結構化輸出 |
| ResetData | `resetdata/openai/whisper-large-v3-turbo` | - | - | - | 轉錄；每秒輸入 $0.000003 |
| ResetData | `resetdata/qwen/qwen3-coder-30b-a3b-instruct` | 262,144 | $0.07061 | $0.2723 | 聊天；工具呼叫；結構化輸出 |
| ResetData | `resetdata/qwen/qwen3.8-27b` | 262,144 | $0.2905 | $2.453 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| ResetData | `resetdata/zai/glm-5.3` | 524,288 | $1.189 | $3.736 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Runway | `runwayml/seedance2_5_flash` | - | - | - | 影片生成；每秒輸出 $0.2 |
| Sarvam | `sarvam/deepseekv4.1-flash-1017` | 1,048,576 | $0.148936 | $0.585106 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/deepseekv4.1-flash-1017-interactive` | 1,048,576 | $0.265957 | $1.117021 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/gemma4` | 262,144 | $0.37234 | $0.957447 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/glm5.3` | 1,048,576 | $1.340426 | $4.148936 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/glm5.3-flash` | 1,048,576 | $0.143617 | $0.478723 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/sarvam-105b` | 128,000 | $0.106383 | $0.265957 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sarvam | `sarvam/sarvam-105b-conversations` | 32,000 | $0.106383 | $0.265957 | 聊天；工具呼叫；提示快取；結構化輸出 |
| Snowflake | `snowflake/claude-haiku-5-5` | - | $0.1 | $0.5 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-4-5` | - | $5 | $25 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-4-6` | - | $5 | $25 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-4-7` | - | $5 | $25 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-4-8` | - | $5 | $25 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-5` | - | $5 | $25 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-opus-5-5` | - | $4 | $20 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-sonnet-5` | - | $2 | $10 | 聊天；視覺；工具呼叫；提示快取 |
| Snowflake | `snowflake/claude-sonnet-5-5` | - | $2 | $10 | 聊天；視覺；工具呼叫；提示快取 |
| Together AI | `together_ai/ByteDance-Seed/Seedream-3.0` | - | - | - | 圖片生成；每張圖片 $0.018 |
| Together AI | `together_ai/ByteDance-Seed/Seedream-4.0` | - | - | - | 圖片生成；每張圖片 $0.03 |
| Together AI | `together_ai/ByteDance/Seedream-5.0-lite` | - | - | - | 圖片生成；每張圖片 $0.035 |
| Together AI | `together_ai/Qwen/Qwen-Image` | - | - | - | 圖片生成；每張圖片 $0.0058 |
| Together AI | `together_ai/Qwen/Qwen-Image-2.0` | - | - | - | 圖片生成；每張圖片 $0.035 |
| Together AI | `together_ai/Qwen/Qwen-Image-2.0-Pro` | - | - | - | 圖片生成；每張圖片 $0.075 |
| Together AI | `together_ai/Qwen/Qwen3-TTS-12Hz-1.7B` | - | - | - | 文字轉語音；每個字元 $0.00002 |
| Together AI | `together_ai/Qwen/Qwen4-Max` | 1,000,000 | $1.05 | $3.15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/RunDiffusion/Juggernaut-pro-flux` | - | - | - | 圖片生成；每張圖片 $0.0049 |
| Together AI | `together_ai/Rundiffusion/Juggernaut-Lightning-Flux` | - | - | - | 圖片生成；每張圖片 $0.0017 |
| Together AI | `together_ai/Wan-AI/Wan2.6-image` | - | - | - | 圖片生成；每張圖片 $0.03 |
| Together AI | `together_ai/black-forest-labs/FLUX.1-kontext-max` | - | - | - | 圖片生成 |
| Together AI | `together_ai/black-forest-labs/FLUX.1-kontext-pro` | - | - | - | 圖片生成 |
| Together AI | `together_ai/black-forest-labs/FLUX.1.1-pro` | - | - | - | 圖片生成 |
| Together AI | `together_ai/black-forest-labs/FLUX.2-dev` | - | - | - | 圖片生成；每張圖片 $0.0154 |
| Together AI | `together_ai/black-forest-labs/FLUX.2-flex` | - | - | - | 圖片生成；每張圖片 $0.03 |
| Together AI | `together_ai/black-forest-labs/FLUX.2-max` | - | - | - | 圖片生成 |
| Together AI | `together_ai/black-forest-labs/FLUX.2-pro` | - | - | - | 圖片生成；每張圖片 $0.03 |
| Together AI | `together_ai/canopylabs/orpheus-3b-0.1-ft` | - | - | - | 文字轉語音；每個字元 $0.000015 |
| Together AI | `together_ai/cartesia/sonic` | - | - | - | 文字轉語音；每個字元 $0.000065 |
| Together AI | `together_ai/cartesia/sonic-3` | - | - | - | 文字轉語音；每個字元 $0.000065 |
| Together AI | `together_ai/google/flash-image-2.5` | - | - | - | 圖片生成；每張圖片 $0.039 |
| Together AI | `together_ai/google/flash-image-3.1` | - | - | - | 圖片生成；每張圖片 $0.04657 |
| Together AI | `together_ai/google/flash-image-3.1-lite` | - | - | - | 圖片生成；每張圖片 $0.069 |
| Together AI | `together_ai/google/gemini-3-pro-image` | - | - | - | 圖片生成；每張圖片 $0.134 |
| Together AI | `together_ai/hexgrad/Kokoro-82M` | - | - | - | 文字轉語音；每個字元 $0.000004 |
| Together AI | `together_ai/ideogram/ideogram-3.0` | - | - | - | 圖片生成；每張圖片 $0.06 |
| Together AI | `together_ai/ideogram/ideogram-4.0` | - | - | - | 圖片生成；每張圖片 $0.06 |
| Together AI | `together_ai/nvidia/nemotron-3-asr-streaming-0.6b` | - | - | - | 轉錄；每秒輸入 $0.000025 |
| Together AI | `together_ai/nvidia/nemotron-3.5-asr-streaming-0.6b` | - | - | - | 轉錄；每秒輸入 $0.000025 |
| Together AI | `together_ai/nvidia/parakeet-tdt-0.6b-v3` | - | - | - | 轉錄；每秒輸入 $0.000025 |
| Together AI | `together_ai/openai/gpt-image-1.5` | - | - | - | 圖片生成；每張圖片 $0.034 |
| Together AI | `together_ai/openai/gpt-image-2` | - | - | - | 圖片生成；每張圖片 $0.053 |
| Together AI | `together_ai/openai/whisper-large-v3` | - | - | - | 轉錄；每秒輸入 $0.000025 |
| Together AI | `together_ai/prunaai/p-image-ideogram` | - | - | - | 圖片生成；每張圖片 $0.00225 |
| Together AI | `together_ai/stabilityai/stable-diffusion-xl-base-1.0` | - | - | - | 圖片生成；每張圖片 $0.0019 |
| Together AI | `together_ai/tencent/Hy4` | 1,048,576 | $0.834 | $2.501 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/thinkingmachines/inkling` | 524,288 | $1 | $4.05 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| Vertex AI | `vertex_ai/gemini-4-neon` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；音訊輸入；影片輸入 |
| Vertex AI | `vertex_ai/meta/muse-ember-1.0` | 1,048,576 | $0.1 | $0.5 | 回應；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Vertex AI | `vertex_ai/meta/muse-spark-1.3` | 1,048,576 | $1.25 | $4.25 | 回應；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Vertex AI | `vertex_ai/meta/muse-wonder-1.0` | 1,048,576 | $4 | $20 | 回應；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Vispark | `vispark/vision-large` | 1,000,000 | $7.37 | $22.11 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Vispark | `vispark/vision-medium` | 1,000,000 | $4.21 | $12.63 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Vispark | `vispark/vision-small` | 1,000,000 | $1.05 | $3.16 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |

</details>

### Amazon Bedrock {#amazon-bedrock}

- 新增 Bedrock GPT-6.2 Astra 與 Sol 定價，並修正 `bedrock_mantle/openai.gpt-6.2-*` 透過代理程式失敗的問題 - [PR #52332](https://github.com/BerriAI/litellm/pull/52332)、[PR #52359](https://github.com/BerriAI/litellm/pull/52359)
- 新增缺少的 Bedrock 區域、Mantle 與 Azure Government 定價資料 - [PR #52458](https://github.com/BerriAI/litellm/pull/52458)
- 新增 GovCloud Mantle Nemotron Nano 12B v2 與 9B v2 的退役日期 - [PR #52552](https://github.com/BerriAI/litellm/pull/52552)
- 新增源自呼叫者身分的 STS 工作階段標籤與工作階段名稱，讓 CloudTrail 能指出呼叫者 - [PR #52978](https://github.com/BerriAI/litellm/pull/52978)
- 修正原生聊天與 `/v1/responses` 呼叫忽略 `aws_bedrock_runtime_endpoint` 的問題 - [PR #50582](https://github.com/BerriAI/litellm/pull/50582)
- 修正 Converse 與 `/v1/responses` 上，最後一則使用者訊息為空時，Claude 5.x 出現 prefill 400 的問題 - [PR #50701](https://github.com/BerriAI/litellm/pull/50701)
- 修正 Bedrock 嵌入預設值與巢狀物件的 `extra_body` 值被忽略的問題 - [PR #51710](https://github.com/BerriAI/litellm/pull/51710)
- 修正 Bedrock Converse 上，系統與助理訊息中的 `guarded_text` 內容被捨棄的問題 - [PR #51776](https://github.com/BerriAI/litellm/pull/51776)
- 修正 `us.` 與 `global.` Bedrock 設定檔上，Daybreak Blue 與 Red 未記錄支出的問題 - [PR #52122](https://github.com/BerriAI/litellm/pull/52122)
- 修正 `/v1/messages` 上 `bedrock/<region>/<model>` 忽略區域的問題 - [PR #52136](https://github.com/BerriAI/litellm/pull/52136)
- 修正 Bedrock 直通記錄顯示預留位置提示詞、空白設定與 null 串流旗標的問題 - [PR #52146](https://github.com/BerriAI/litellm/pull/52146)
- 修正 Bedrock `ca.` 推論設定檔捨棄 `reasoning_effort` 且未記錄成本的問題 - [PR #52152](https://github.com/BerriAI/litellm/pull/52152)
- 修正 `supports_prompt_cache_breakpoint` 為 false 時，Bedrock Claude 提示快取關閉的問題，自 v1.106.0 起損壞 - [PR #52180](https://github.com/BerriAI/litellm/pull/52180)
- 修正 Bedrock Converse 上的 GPT 結構化輸出未傳送 `text.format.strict` 的問題 - [PR #52419](https://github.com/BerriAI/litellm/pull/52419)
- 修正 Bedrock GPT-6.2 Astra 與 Sol 價格，包含 Mantle Ultrafast 定價 - [PR #52464](https://github.com/BerriAI/litellm/pull/52464)
- 修正 ConverseStream 以預設層級而非實際提供的服務層級計費的問題 - [PR #52565](https://github.com/BerriAI/litellm/pull/52565)
- 修正 GovCloud Mantle Claude token 計數導向商業版 `us-east-1` 端點的問題 - [PR #52708](https://github.com/BerriAI/litellm/pull/52708)
- 修正 BM25 工具搜尋工具在 Claude 聊天請求中被捨棄的問題，讓 Claude 能找到隱藏的工具 - [PR #52959](https://github.com/BerriAI/litellm/pull/52959)
- 修正 Nova 嵌入提示 token 與支出，改為遵循 Bedrock 計量的 token 數量 - [PR #53142](https://github.com/BerriAI/litellm/pull/53142)
- 修正 Nova 嵌入成本忽略圖片旁的文字，並將音訊與影片以固定 768 個 token 計費的問題 - [PR #53296](https://github.com/BerriAI/litellm/pull/53296)、[PR #53307](https://github.com/BerriAI/litellm/pull/53307)
- 修正原生 Bedrock 聊天在 `drop_params` 下捨棄呼叫者提供的快取檢查點的問題 - [PR #53370](https://github.com/BerriAI/litellm/pull/53370)
- 修正與以 ARN 命名的模型並列時，`model_id` 設定檔模型失敗的問題 - [PR #53461](https://github.com/BerriAI/litellm/pull/53461)
- 修正 AWS 未傳送事件或截斷最後一個事件時，SageMaker 與 Bedrock 代理程式串流回傳空的 200 的問題 - [PR #53482](https://github.com/BerriAI/litellm/pull/53482)
- 修正 Converse 上 Bedrock Mistral Large 3 與 Ministral 3 的 `tool_choice` 出現 400 的問題 - [PR #53589](https://github.com/BerriAI/litellm/pull/53589)
- 修正沒有 AWS 憑證時，Bedrock token 計數回傳 500 而非 401 的問題 - [PR #53593](https://github.com/BerriAI/litellm/pull/53593)
- 修正 Bedrock count-tokens 直通的 400 與 429 以 ERROR 而非警告記錄的問題 - [PR #53595](https://github.com/BerriAI/litellm/pull/53595)
- 變更 Bedrock Mantle `/v1/messages` 上的 Claude，改由 Rust 閘道提供服務 - [PR #52328](https://github.com/BerriAI/litellm/pull/52328)
- 變更 `bedrock/mantle/` GovCloud 呼叫改以 GovCloud 費率計費，記錄的支出約增加 20% - [PR #52864](https://github.com/BerriAI/litellm/pull/52864)
- 變更 GovCloud Claude 模型對 `response_format` JSON 結構描述改用 Bedrock 原生結構化輸出 - [PR #53175](https://github.com/BerriAI/litellm/pull/53175)

### Anthropic {#anthropic}

- 新增將 `/v1/messages` 上的 `diagnostics` 轉發至 Anthropic - [PR #52969](https://github.com/BerriAI/litellm/pull/52969)
- 修正 400 `extra_body: Extra inputs are not permitted` 的問題，做法是將 `extra_body` 欄位傳送至最上層 - [PR #48373](https://github.com/BerriAI/litellm/pull/48373)
- 修正 `modify_params` 開啟時，工具呼叫後續輪次捨棄自適應思考的問題 - [PR #52615](https://github.com/BerriAI/litellm/pull/52615)
- 修正執行緒拒絕遺失錯誤碼並觸發部署冷卻的問題 - [PR #53292](https://github.com/BerriAI/litellm/pull/53292)
- 修正聊天、responses 與 `/v1/messages` 上，`data:` 行非 JSON 物件時，Anthropic 串流失敗的問題 - [PR #53393](https://github.com/BerriAI/litellm/pull/53393)
- 修正 `anthropic-version: 2026-10-21` 下，`/v1/messages` 在 `temperature`、`top_p` 與 `top_k` 上失敗的問題 - [PR #53407](https://github.com/BerriAI/litellm/pull/53407)
- 修正代理程式加入 retrieve 工具後，串流 `/v1/messages` 在輪次結束前只傳送 ping 的問題 - [PR #53658](https://github.com/BerriAI/litellm/pull/53658)
- 變更座位額度涵蓋的 Claude 訂閱 OAuth 用量改記錄為 $0，超額部分以 API 費率計價 - [PR #52901](https://github.com/BerriAI/litellm/pull/52901)

### Azure {#azure}

- 新增 gpt-5.6、gpt-4.1、gpt-4o 與 ada-002 的 `azure/us-gov/` 定價 - [PR #52135](https://github.com/BerriAI/litellm/pull/52135)
- 新增 Azure `gpt-6.2-astra`、`gpt-6.2-sol` 與 `azure_ai/Microsoft-Decision-1.1` 的定價 - [PR #52293](https://github.com/BerriAI/litellm/pull/52293)
- 新增 `/v1/live/sessions` 上的 `azure/gpt-live-1` 工作階段 - [PR #53238](https://github.com/BerriAI/litellm/pull/53238)
- 修正未附內文傳送時，直通 `DELETE /azure/openai/v1/responses/{id}` 回傳 400 的問題 - [PR #50833](https://github.com/BerriAI/litellm/pull/50833)
- 修正 Azure Responses 模型在重播時遺失 `phase`，且串流文字增量缺少該欄位的問題 - [PR #51059](https://github.com/BerriAI/litellm/pull/51059)
- 修正 Azure Document Intelligence OCR 忽略 `extra_body` 中 `outputContentFormat` 與 `pages` 等查詢選項的問題 - [PR #51102](https://github.com/BerriAI/litellm/pull/51102)
- 修正 Foundry 專案 URL 的聊天 400 與 401，以及 `/openai/v1` 基底的 404 問題 - [PR #51144](https://github.com/BerriAI/litellm/pull/51144)
- 修正 Azure AI DeepSeek V4 Flash 與 Pro 模型拒絕 `reasoning_effort` 的問題 - [PR #51775](https://github.com/BerriAI/litellm/pull/51775)
- 修正快取的 Azure 與 base64 嵌入用戶端被逐出時，未關閉的工作階段問題 - [PR #52266](https://github.com/BerriAI/litellm/pull/52266)
- 修正 Foundry 模型路由器的 Compact 500 問題，改為原生呼叫 Responses - [PR #52474](https://github.com/BerriAI/litellm/pull/52474)
- 修正 Azure AI Foundry GPT-5 Chat 收到 `max_tokens` 而非 `max_completion_tokens` 的問題 - [PR #52680](https://github.com/BerriAI/litellm/pull/52680)
- 修正 Azure OpenAI 資源 URL 的 `azure_ai/` 聊天與嵌入出現 404 的問題，改用 v1 路徑 - [PR #52759](https://github.com/BerriAI/litellm/pull/52759)
- 修正 Azure 橋接串流回傳 `model` 為 null 的區塊問題 - [PR #53126](https://github.com/BerriAI/litellm/pull/53126)
- 修正混合 Azure 群組上的聊天呼叫落到僅支援批次的部署並收到 400 的問題 - [PR #53454](https://github.com/BerriAI/litellm/pull/53454)
- 變更 `azure/gpt-image-1.5` 退役日期為 2027-06-16，並為 `azure_ai/Codestral-2501` 設定後繼者 - [PR #52699](https://github.com/BerriAI/litellm/pull/52699)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 新增 Vertex AI 上的 Meta Muse 模型，支援原生 Responses 路由 - [PR #50768](https://github.com/BerriAI/litellm/pull/50768)
- 新增 `gemini/gemini-4-neon` 與 `vertex_ai/gemini-4-neon` 定價 - [PR #52640](https://github.com/BerriAI/litellm/pull/52640)、[PR #52648](https://github.com/BerriAI/litellm/pull/52648)
- 新增 Gemini 嵌入的明確文字輸入，並讓本機媒體錯誤回傳 400 而非重試的 500 - [PR #53135](https://github.com/BerriAI/litellm/pull/53135)
- 修正 Vertex Gemini 對每個 `service_tier` 值都回應 400 的問題 - [PR #34959](https://github.com/BerriAI/litellm/pull/34959)
- 修正 Gemini Embedding 2 批次計費，讓影片等媒體輸入不再以 $0 計價 - [PR #49682](https://github.com/BerriAI/litellm/pull/49682)
- 修正過去的工具呼叫含有 null 或截斷的引數時，Gemini 請求失敗的問題 - [PR #50020](https://github.com/BerriAI/litellm/pull/50020)
- 修正 Gemini 圖片回應在 `message.images` 與 `/v1/responses` 中回傳思考草稿圖片的問題 - [PR #50709](https://github.com/BerriAI/litellm/pull/50709)
- 修正 `generateContent` 上 snake_case `generation_config` 鍵被捨棄的問題 - [PR #51139](https://github.com/BerriAI/litellm/pull/51139)
- 修正 Vertex AI 批次檔案中，一列 `json_schema` 導致每隔一列失敗的問題，自 v1.81.3 起損壞 - [PR #51790](https://github.com/BerriAI/litellm/pull/51790)
- 修正 `gemini-4-hydrogen` 上 `reasoning_effort: "xhigh"` 的 400 問題 - [PR #52060](https://github.com/BerriAI/litellm/pull/52060)
- 修正無圖片的 `gemini/` 圖片編輯回傳 500 的問題，現在為 400 - [PR #52087](https://github.com/BerriAI/litellm/pull/52087)
- 修正 `n` 大於 1 時 Gemini 圖片生成與編輯失敗，以及 Vertex AI 編輯拒絕 `n` 的問題 - [PR #52103](https://github.com/BerriAI/litellm/pull/52103)
- 修正用戶端從工具呼叫 ID 清除思考簽章時，Gemini 出現 400 錯誤的問題 - [PR #52207](https://github.com/BerriAI/litellm/pull/52207)
- 修正非串流 Gemini `content_filter` 選擇捨棄 Google 封鎖原因的問題 - [PR #52208](https://github.com/BerriAI/litellm/pull/52208)
- 修正代理程式模型名稱不含 `gemini` 時，Gemini 思考簽章被移除的問題 - [PR #52212](https://github.com/BerriAI/litellm/pull/52212)
- 修正串流 Gemini 答案捨棄 Google 完成原因的問題，現在位於最後一個區塊的 `provider_specific_fields` 中 - [PR #52242](https://github.com/BerriAI/litellm/pull/52242)
- 修正 `drop_params` 開啟時，Gemini 圖片模型對不支援的思考層級與 logprobs 出現 400 的問題 - [PR #52514](https://github.com/BerriAI/litellm/pull/52514)
- 修正 Gemini 與 Vertex 圖片生成上，快取輸入 token 以全額費率計費的問題 - [PR #52572](https://github.com/BerriAI/litellm/pull/52572)
- 修正 `drop_params` 未捨棄拒絕 `logprobs` 的 Gemini 模型上的 `logprobs` 問題 - [PR #52700](https://github.com/BerriAI/litellm/pull/52700)
- 修正非串流 Gemini 內容篩選回應中，思考 token 未計入 `completion_tokens` 與成本的問題 - [PR #52930](https://github.com/BerriAI/litellm/pull/52930)
- 修正 `/v1/responses` 上，跨助理輪次拆分的 Gemini 工具呼叫出現 500 的問題 - [PR #52960](https://github.com/BerriAI/litellm/pull/52960)
- 修正百分比編碼的 Gemini 檔案 ID 在存取檢查與 Gemini 請求中解析方式不同的問題 - [PR #53004](https://github.com/BerriAI/litellm/pull/53004)
- 修正完成原因前遭截斷的 Gemini 串流以正常 `stop` 而非錯誤結束的問題 - [PR #53187](https://github.com/BerriAI/litellm/pull/53187)
- 修正格式錯誤的完成原因導致 Gemini 空白回應的問題，現在會失敗以便執行重試與備援 - [PR #53231](https://github.com/BerriAI/litellm/pull/53231)
- 修正 Gemini 2.x 捨棄引數相同的不同平行工具呼叫的問題 - [PR #53233](https://github.com/BerriAI/litellm/pull/53233)
- 修正零預算金鑰在 Google `generateContent` 路由收到 200 的問題，這些路由的 URL 未包含模型 - [PR #53404](https://github.com/BerriAI/litellm/pull/53404)
- 修正 Gemini 與 Vertex AI 無聲捨棄 `video_url` 內容部分的問題 - [PR #53406](https://github.com/BerriAI/litellm/pull/53406)
- 修正小預算金鑰重疊的 Gemini 原生 `generateContent` 呼叫出現 422 的問題 - [PR #53412](https://github.com/BerriAI/litellm/pull/53412)
- 修正 Gemini 工具與回應結構描述捨棄 `const` 值的問題 - [PR #53413](https://github.com/BerriAI/litellm/pull/53413)
- 修正 Gemini 3+ 在函式工具旁捨棄網頁搜尋，且未回報 `web_search_call` 項目的問題 - [PR #53423](https://github.com/BerriAI/litellm/pull/53423)
- 修正 Vertex 圖片編輯每輪重繪新圖片，並在第三輪以 400 失敗的問題 - [PR #53435](https://github.com/BerriAI/litellm/pull/53435)
- 修正 Vertex 上 `n` 大於 1 且使用圖片 `modalities` 時錯誤訊息不明確的問題，現在會回應明確的 400 - [PR #53598](https://github.com/BerriAI/litellm/pull/53598)
- 修正系統訊息出現在對話中段時，Gemini 提示快取永不命中的問題 - [PR #53623](https://github.com/BerriAI/litellm/pull/53623)

### OpenAI {#openai}

- 新增 `/v1/moderations` 成本對映表中的 `omni-moderation-csam-latest` - [PR #52047](https://github.com/BerriAI/litellm/pull/52047)
- 新增 OpenAI `gpt-6.2-astra`、`gpt-6.2-sol` 與 `gpt-6.2-astra-law` 定價 - [PR #52316](https://github.com/BerriAI/litellm/pull/52316)
- 修正 `prompt_cache_key`、`prompt_cache_options` 與 `12h` 快取 ttl 被拒絕或未轉發至 OpenAI 的問題 - [PR #51457](https://github.com/BerriAI/litellm/pull/51457)
- 修正 `gpt-4o-mini-tts` 支出缺少 OpenAI 計費的音訊輸出 token 的問題 - [PR #52317](https://github.com/BerriAI/litellm/pull/52317)
- 修正圖片回應上 `svg_usage` 中的 SVG 撰寫 token 未計費的問題 - [PR #52571](https://github.com/BerriAI/litellm/pull/52571)
- 修正 `chatgpt/gpt-5.6-sol`、`-terra` 與 `-luna` 的 `max_input_tokens` 為 922000 - [PR #52614](https://github.com/BerriAI/litellm/pull/52614) {/* keep-model-ids */}
- 修正 `truncation` 為 `auto` 時，傳送至 OpenAI 模型的極長系統提示詞出現 400 的問題 - [PR #52964](https://github.com/BerriAI/litellm/pull/52964)
- 修正省略 `Authorization` 標頭時，聊天與嵌入請求失敗的問題，自 v1.108.1 起損壞 - [PR #53132](https://github.com/BerriAI/litellm/pull/53132)
- 修正與 OpenAI 相容的後端錯誤捨棄 `error.param`，並將整個內文回傳為 `error.message` 的問題 - [PR #53217](https://github.com/BerriAI/litellm/pull/53217)
- 修正 O 系列 Responses 請求儘管有 `drop_params` 仍傳送不支援的 `temperature` 的問題 - [PR #53234](https://github.com/BerriAI/litellm/pull/53234)
- 修正 vLLM 錯誤將 `error.type` 轉發為 `BadRequestError` 而非提供者的錯誤類型的問題 - [PR #54031](https://github.com/BerriAI/litellm/pull/54031)

### 其他提供者 {#other-providers}

- 新增 Moonshot Kimi K3 與 Together AI Inkling 模型支援 - [PR #33922](https://github.com/BerriAI/litellm/pull/33922)
- 新增 Vispark 提供者，包含 Vision Small、Medium 與 Large 模型 - [PR #41192](https://github.com/BerriAI/litellm/pull/41192)
- 新增 Sarvam Token Factory 模型、定價，以及 `sarvam/*` 的 `reasoning_effort` 支援 - [PR #49792](https://github.com/BerriAI/litellm/pull/49792)
- 新增透過所選連線在新增模型時發現 NVIDIA NIM 模型的功能，並更新內附型錄 - [PR #50439](https://github.com/BerriAI/litellm/pull/50439)
- 新增 ResetData 提供者，並停止將 `OPENAI_API_KEY` 傳送至無金鑰的 JSON 設定提供者 - [PR #50819](https://github.com/BerriAI/litellm/pull/50819)
- 新增 Sarvam 聊天請求上的 LiteLLM `User-Agent` - [PR #52012](https://github.com/BerriAI/litellm/pull/52012)
- 新增 DashScope `qwen4-max` 與 ChatGPT GPT-5.6 的 `max` 推理強度 - [PR #52097](https://github.com/BerriAI/litellm/pull/52097)
- 新增 2026-11-16 退役的 GitHub Copilot 模型的退役來源與後繼模型 - [PR #52160](https://github.com/BerriAI/litellm/pull/52160)
- 新增 `github_copilot/` MAI Code 2、MAI Code 2 Flash、GPT-6.2 Astra 與 GPT-6.2 Sol 的成本追蹤 - [PR #52338](https://github.com/BerriAI/litellm/pull/52338)、[PR #52395](https://github.com/BerriAI/litellm/pull/52395)
- 新增 GitHub Copilot 的自動 `copilot-integration-id` 標頭，支援自訂 `GITHUB_COPILOT_CLIENT_ID` - [PR #52386](https://github.com/BerriAI/litellm/pull/52386)
- 新增 `together_ai/Qwen/Qwen4-Max` 定價以追蹤支出 - [PR #52487](https://github.com/BerriAI/litellm/pull/52487)
- 新增 Gnani Prisma v2.5 與 v3.0 REST 轉錄支援 - [PR #52520](https://github.com/BerriAI/litellm/pull/52520)
- 新增成本對映表中的 Databricks GPT-6.2 Astra 與 Sol Unity Gateway 模型 - [PR #52635](https://github.com/BerriAI/litellm/pull/52635)
- 新增 Cohere 免費層 Command A Reasoning、Translate 與 Vision 的零定價 - [PR #52687](https://github.com/BerriAI/litellm/pull/52687)
- 新增成本模型對映表中的 `github_copilot/gemini-4-neon` - [PR #52704](https://github.com/BerriAI/litellm/pull/52704)
- 新增 `fal_ai` Iris-Z 深度估計定價，呼叫不再以 $0 追蹤 - [PR #52715](https://github.com/BerriAI/litellm/pull/52715)
- 新增 Baseten `baseten-bison-latest` 與 `baseten-groundhog-latest` 決策模型 - [PR #53165](https://github.com/BerriAI/litellm/pull/53165)
- 新增 Runway `seedance2_5_flash` 模型定價 - [PR #53166](https://github.com/BerriAI/litellm/pull/53166)
- 新增 xAI `grok-build-0.1` 的 2026-11-19 終止支援日期 - [PR #53167](https://github.com/BerriAI/litellm/pull/53167)
- 新增 Databricks `gpt-5` 與 `gpt-5-mini` 的退役日期 - [PR #53168](https://github.com/BerriAI/litellm/pull/53168)
- 新增 Fireworks `kimi-k3p1-pro-us`，採用已發佈的僅限美國費率 - [PR #53377](https://github.com/BerriAI/litellm/pull/53377)
- 新增 Perplexity Orchestrator 提供者，包含 `perplexity_orchestrator/` 模型與成本追蹤 - [PR #53583](https://github.com/BerriAI/litellm/pull/53583)
- 修正 `sap/` 聊天與嵌入呼叫每次呼叫都取得新的 OAuth token 的問題 - [PR #49260](https://github.com/BerriAI/litellm/pull/49260)
- 修正 Cohere v2 聊天忽略 `tool_choice`，且對 `reasoning_effort` 與 `json_schema` 回傳 400 的問題 - [PR #50834](https://github.com/BerriAI/litellm/pull/50834)
- 修正 GitHub Copilot 模型在使用金鑰參照且儲存的金鑰為空或空白時回傳 400 的問題 - [PR #52032](https://github.com/BerriAI/litellm/pull/52032)
- 修正 8 秒 PixVerse 特效、轉場與延伸片段的 $0 支出與遭拒的 `/fal_ai` 請求問題 - [PR #52107](https://github.com/BerriAI/litellm/pull/52107)
- 修正 OpenCode Go 聊天請求上 `reasoning_effort` 被捨棄的問題 - [PR #52156](https://github.com/BerriAI/litellm/pull/52156)
- 修正 Baseten Kimi K3.1 Pro 過時的輸入 token 上限問題 - [PR #52158](https://github.com/BerriAI/litellm/pull/52158)
- 修正 `/v1/messages` 上，對話中段的系統提醒在 Databricks Claude Opus 5.5 上變成使用者輪次的問題 - [PR #52214](https://github.com/BerriAI/litellm/pull/52214)
- 修正 Together AI Kimi-K3.1-Pro 將 `reasoning_effort: max` 向上游傳送為 `high` 的問題 - [PR #52294](https://github.com/BerriAI/litellm/pull/52294)
- 修正 DashScope 1 小時快取寫入以 5 分鐘費率計費的問題 - [PR #52331](https://github.com/BerriAI/litellm/pull/52331)
- 修正 `dashscope/qwen4-max` 錯誤的快取讀取與寫入成本問題 - [PR #52334](https://github.com/BerriAI/litellm/pull/52334)
- 修正 GitHub Copilot 失敗全部顯示相同的「Connect GitHub Copilot」訊息而非真正原因的問題 - [PR #52352](https://github.com/BerriAI/litellm/pull/52352)
- 修正沒有 `service_tier` 的 Groq 回應在聊天、`/v1/messages` 與 Responses 橋接上失敗的問題 - [PR #52431](https://github.com/BerriAI/litellm/pull/52431)
- 修正回應缺少 `prompt_eval_count` 時，Ollama 嵌入以 400 失敗的問題 - [PR #52432](https://github.com/BerriAI/litellm/pull/52432)
- 修正自動選擇進階深度的 Tavily 搜尋以基本方案計價的問題 - [PR #52564](https://github.com/BerriAI/litellm/pull/52564)
- 修正 Groq Whisper 轉錄未回傳成本的問題 - [PR #52570](https://github.com/BerriAI/litellm/pull/52570)
- 修正 `voyage/` 嵌入忽略 `VOYAGE_API_BASE` 的問題 - [PR #52645](https://github.com/BerriAI/litellm/pull/52645)
- 修正透過 `chatgpt` 提供者時，`gpt-5.6-*` 上的 Codex CLI 一律收到 400 的問題 - [PR #52731](https://github.com/BerriAI/litellm/pull/52731)
- 修正 `reasoning_content` 為清單時，SAP Gemini 3.x 回應被拒絕的問題 - [PR #52741](https://github.com/BerriAI/litellm/pull/52741)
- 修正 Perplexity 圖片嵌入以文字 token 費率計費的問題 - [PR #53125](https://github.com/BerriAI/litellm/pull/53125)
- 修正 Vertex AI 與 Bedrock 上的 Mistral 對工具呼叫 ID 回應 400 的問題 - [PR #53416](https://github.com/BerriAI/litellm/pull/53416)
- 修正 OCI 串流以 500 `cannot use a decompressobj multiple times` 失敗的問題 - [PR #53439](https://github.com/BerriAI/litellm/pull/53439)
- 修正與 OpenAI 相容的提供者上，非同步串流忽略 `stream_timeout`，且逾時回傳 500 而非 408 的問題 - [PR #53442](https://github.com/BerriAI/litellm/pull/53442)
- 變更 `together_ai/Qwen/Qwen4-Max` 定價為 Together 計費至 2026-11-23 的促銷費率 - [PR #52814](https://github.com/BerriAI/litellm/pull/52814)
- 變更 Fireworks `inkling` 退役日期為 2026-11-20 - [PR #53303](https://github.com/BerriAI/litellm/pull/53303)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 修正已取消的輪詢回應稍後完成，且模型呼叫持續計費的問題 - [PR #49384](https://github.com/BerriAI/litellm/pull/49384)
- 修正遭拒的 Responses WebSocket 輪次每個 socket 只記錄一列失敗資料的問題 - [PR #50731](https://github.com/BerriAI/litellm/pull/50731)
- 修正 `GET /v1/responses/{id}/input_items` 忽略 `limit`、`order`、`after`、`before` 與 `include` 的問題 - [PR #51259](https://github.com/BerriAI/litellm/pull/51259)
- 修正模型只在 done 事件中傳送時，串流工具呼叫以空白引數抵達的問題 - [PR #52069](https://github.com/BerriAI/litellm/pull/52069)
- 修正串流 `/v1/responses` 請求完成後，記憶體持續佔用直至完整垃圾回收的問題 - [PR #52215](https://github.com/BerriAI/litellm/pull/52215)
- 修正呼叫者的小寫 `authorization` 標頭與設定的金鑰一同傳送至上游，導致 401 的問題 - [PR #52259](https://github.com/BerriAI/litellm/pull/52259)
- 修正截斷的 Responses 串流以 `response.completed` 而非未完成狀態結束的問題 - [PR #52489](https://github.com/BerriAI/litellm/pull/52489)
- 修正儲存的 Responses 鏈結將系統提示詞計費兩次的問題 - [PR #52694](https://github.com/BerriAI/litellm/pull/52694)
- 修正 Claude Code 計費中繼資料變更傳送至 Responses API 的提示詞，並破壞提示快取重複使用的問題 - [PR #52732](https://github.com/BerriAI/litellm/pull/52732)
- 修正 websocket 錯誤與防護欄封鎖訊框未攜帶 HTTP 狀態，導致 Codex 掛住直至逾時的問題 - [PR #52874](https://github.com/BerriAI/litellm/pull/52874)、[PR #52942](https://github.com/BerriAI/litellm/pull/52942)
- 修正 Responses 工具結果遺失在 Anthropic 路由上載入延遲工具所需的參照問題 - [PR #52977](https://github.com/BerriAI/litellm/pull/52977)
- 修正 `http://` `api_base` 上 Responses WebSocket 以代碼 1011 關閉的問題 - [PR #53240](https://github.com/BerriAI/litellm/pull/53240)
- 修正透過 `/v1/responses` 的 Bedrock Claude 上，Codex `compaction_trigger` 未回傳壓縮項目的問題 - [PR #53266](https://github.com/BerriAI/litellm/pull/53266)
- 修正 Claude 上遭截斷的 `/v1/responses` 串流以估計值計費，且缺少 499 標記或支出列的問題 - [PR #53394](https://github.com/BerriAI/litellm/pull/53394)
- 修正沒有原生 WebSocket 的提供者上，`ws /v1/responses` 的 Codex 在第一次工具呼叫後失敗的問題 - [PR #53410](https://github.com/BerriAI/litellm/pull/53410)
- 變更聊天完成與 Messages 請求上的 `previous_response_id` 改回傳 400 而非 200 - [PR #53038](https://github.com/BerriAI/litellm/pull/53038)

### 聊天完成 {#chat-completions}

- 修正自訂提供者串流在缺少 `is_finished` 等欄位的區塊上崩潰的問題 - [PR #43501](https://github.com/BerriAI/litellm/pull/43501)
- 修正 LiteLLM 內部 MCP 與 `fake_stream` 參數被傳送至提供者請求內文的問題 - [PR #46083](https://github.com/BerriAI/litellm/pull/46083)
- 修正 `extra_headers` 非物件時出現 500 的問題，現在為指明 `extra_headers` 的 400 - [PR #50581](https://github.com/BerriAI/litellm/pull/50581)
- 修正自訂提示詞管理器的系統訊息在非同步呼叫中傳送兩次，搭配備援時傳送三次的問題 - [PR #51836](https://github.com/BerriAI/litellm/pull/51836)
- 修正 Bedrock 與 Anthropic 上，閘道聊天完成對 `max_tokens`、`top_p` 與 `stop` 回傳 501 的問題 - [PR #52211](https://github.com/BerriAI/litellm/pull/52211)
- 修正歷程記錄中串接的工具呼叫引數在 Anthropic 與 Bedrock 上失敗的問題 - [PR #52216](https://github.com/BerriAI/litellm/pull/52216)
- 修正失敗的 llama-3 請求在回傳錯誤前，等待約 23 秒下載 tokenizer 的問題 - [PR #52232](https://github.com/BerriAI/litellm/pull/52232)
- 修正 `stream=true` 且以逗號分隔 `model` 時出現 500 的問題，現在會在呼叫任何提供者前回傳 400 - [PR #52264](https://github.com/BerriAI/litellm/pull/52264)
- 修正路徑模型路由上的非串流聊天回應回傳提供者模型名稱而非別名的問題 - [PR #53192](https://github.com/BerriAI/litellm/pull/53192)
- 修正完成路由捨棄個別的連線、寫入與連線池逾時的問題 - [PR #53391](https://github.com/BerriAI/litellm/pull/53391)
- 修正 `n` 大於 1 的串流聊天只將 `delta.role` 提供給一個選項的問題 - [PR #53582](https://github.com/BerriAI/litellm/pull/53582)
- 變更對 Responses、Messages 與 Completions 上文字模型的音訊輸出請求，在沒有 `drop_params` 時回傳 400 - [PR #49960](https://github.com/BerriAI/litellm/pull/49960)
- 變更來自 OpenAI 風格提供者的上游 403 改為 `PermissionDeniedError`，且不再重試 - [PR #52179](https://github.com/BerriAI/litellm/pull/52179)

### Anthropic Messages API {#anthropic-messages-api}

- 修正傳送金鑰為 `X-Api-Key` 的 Anthropic SDK 用戶端收到 Rust 閘道 401 的問題 - [PR #49410](https://github.com/BerriAI/litellm/pull/49410)
- 修正用戶端提早關閉 `/v1/messages` 串流後，OpenAI 串流仍繼續執行的問題 - [PR #51274](https://github.com/BerriAI/litellm/pull/51274)
- 修正 `/v1/messages` 思考區塊缺少 `signature`，以及橋接的 `openai/` 回應回傳空 `content` 的問題 - [PR #52116](https://github.com/BerriAI/litellm/pull/52116)
- 修正傳送捨棄的接續內容時，無狀態 Messages 請求對 GPT-6.2 遺失提示快取的問題 - [PR #52743](https://github.com/BerriAI/litellm/pull/52743)
- 修正引數只在最後才抵達時，串流 `/v1/messages` 呼叫 OpenAI 模型的空工具輸入問題 - [PR #53306](https://github.com/BerriAI/litellm/pull/53306)
- 變更 Vertex AI `/v1/messages` 上的 Claude，改由 Rust 閘道提供服務 - [PR #52314](https://github.com/BerriAI/litellm/pull/52314)
- 變更 AWS `/v1/messages` 上的 Claude Platform，改由 Rust 閘道提供服務，並修正其計費為零的問題 - [PR #52681](https://github.com/BerriAI/litellm/pull/52681)

### Realtime {#realtime}

- 新增 Vertex AI `/v1/realtime` 上的 Gemini Live Avatar 支援 - [PR #53270](https://github.com/BerriAI/litellm/pull/53270)
- 新增 WebRTC 上的 `gpt-live-1`，支援 sideband 附加，以及 Realtime WebRTC 通話計費 - [PR #53282](https://github.com/BerriAI/litellm/pull/53282)、[PR #53548](https://github.com/BerriAI/litellm/pull/53548)
- 修正沒有 `intent` 的按住說話轉錄在逐字稿防護欄下被強制使用伺服器端 VAD 的問題 - [PR #50594](https://github.com/BerriAI/litellm/pull/50594)
- 修正 Realtime WebSocket 忽略團隊的模型別名並選擇其他部署的問題 - [PR #52124](https://github.com/BerriAI/litellm/pull/52124)
- 修正 Gemini 與 Vertex Live 插話以完成而非取消的 `response.done` 結束的問題 - [PR #52596](https://github.com/BerriAI/litellm/pull/52596)

### 圖片、音訊與嵌入 {#images-audio-and-embeddings}

- 新增 `/v1/audio/speech` 上的 Gradium 文字轉語音 - [PR #46427](https://github.com/BerriAI/litellm/pull/46427)
- 修正自訂圖片處理器未收到 `n`、`size`、`quality`、`response_format`、`user` 與 `mask` 的問題 - [PR #52051](https://github.com/BerriAI/litellm/pull/52051)
- 修正 `additional_drop_params` 忽略 `input_type` 等提供者專屬嵌入參數的問題 - [PR #52098](https://github.com/BerriAI/litellm/pull/52098)
- 修正以 tuple 傳入或含有非字串項目時，`additional_drop_params` 在圖片生成與編輯上被忽略的問題 - [PR #52390](https://github.com/BerriAI/litellm/pull/52390)
- 修正自訂嵌入 HTTP 用戶端遺失上游錯誤狀態的問題 - [PR #52904](https://github.com/BerriAI/litellm/pull/52904)
- 修正 `text`、`srt` 與 `vtt` 轉錄以及 Groq 記錄的空白用量問題，現在會記錄片段長度 - [PR #53256](https://github.com/BerriAI/litellm/pull/53256)
- 變更 `/v1/audio/speech` 在音訊抵達時即串流音訊，並為 `stream: true` 記錄支出 - [PR #46222](https://github.com/BerriAI/litellm/pull/46222)

### 批次與檔案 {#batches-and-files}

- 修正 `gpt-*` 萬用字元金鑰在檔案、批次、RAG 與向量儲存檔案上使用代理程式自身的金鑰的問題，自 v1.96.0 起損壞 - [PR #49744](https://github.com/BerriAI/litellm/pull/49744)
- 修正模型路由的 JSONL 上傳含有模型別名列時，批次失敗的問題 - [PR #51843](https://github.com/BerriAI/litellm/pull/51843)
- 修正 Vertex 與 Bedrock 批次將輸入 token 計為 0，導致未強制執行 `model_batch_enqueued_token_limit` 的問題 - [PR #53257](https://github.com/BerriAI/litellm/pull/53257)

### 向量儲存 {#vector-stores}

- 新增統一向量儲存搜尋的 YAML 設定備援 - [PR #52093](https://github.com/BerriAI/litellm/pull/52093)
- 新增原生向量儲存搜尋直通，在失敗時切換至該儲存區設定的 `fallbacks` - [PR #52856](https://github.com/BerriAI/litellm/pull/52856)

### 計算 token {#count-tokens}

- 修正自訂名稱的部署在選擇 tokenizer 時忽略 `base_model` 的問題 - [PR #50734](https://github.com/BerriAI/litellm/pull/50734)
- 修正 Rust tokenizer 在孤立代理字元與超出範圍的 token ID 上出錯的問題，改為與 tiktoken 一致 - [PR #51720](https://github.com/BerriAI/litellm/pull/51720)
- 修正非 xAI 主機上的 grok-4.3 與 Azure grok-4-1-fast-non-reasoning 的 token 計數問題 - [PR #53418](https://github.com/BerriAI/litellm/pull/53418)
- 修正 token 計數路由在選擇部署時忽略金鑰的團隊、標籤、別名與 `router_settings` 的問題 - [PR #53425](https://github.com/BerriAI/litellm/pull/53425)

## 管理端點 / UI {#management-endpoints--ui}

### 管理 UI {#admin-ui}

- 新增管理 UI 語言選單中的簡體中文，包含 4,243 條新增翻譯字串 - [PR #48257](https://github.com/BerriAI/litellm/pull/48257)、[PR #52990](https://github.com/BerriAI/litellm/pull/52990)
- 新增目前頁面上虛擬金鑰的批次操作 - [PR #52138](https://github.com/BerriAI/litellm/pull/52138)
- 新增警示的電子郵件標籤、批次清除與可編輯的閾值 - [PR #52139](https://github.com/BerriAI/litellm/pull/52139)
- 新增客戶入口網站的預算群組、用量頁面上的各應用程式預算，以及客戶的 TPM 與 RPM 上限 - [PR #52411](https://github.com/BerriAI/litellm/pull/52411)、[PR #52477](https://github.com/BerriAI/litellm/pull/52477)、[PR #52493](https://github.com/BerriAI/litellm/pull/52493)、[PR #52608](https://github.com/BerriAI/litellm/pull/52608)
- 新增技能下載歷程記錄的 CSV 匯出 - [PR #52569](https://github.com/BerriAI/litellm/pull/52569)
- 新增客戶入口網站的 token 用量與快取成本明細 - [PR #52601](https://github.com/BerriAI/litellm/pull/52601)
- 新增透過物件權限對客戶管理進行應用程式範圍的讀取存取，未取得應用程式授權時會隱藏 - [PR #52781](https://github.com/BerriAI/litellm/pull/52781)
- 新增將整體應用程式預算連結至共用預算預設值 - [PR #52946](https://github.com/BerriAI/litellm/pull/52946)
- 新增團隊設定中自訂團隊中繼資料的唯讀檢視 - [PR #53459](https://github.com/BerriAI/litellm/pull/53459)
- 新增當 `config.yaml` 控制成本利潤時，成本追蹤設定中的提示 - [PR #53475](https://github.com/BerriAI/litellm/pull/53475)
- 新增請求記錄頁面的 CSV 匯出 - [PR #53501](https://github.com/BerriAI/litellm/pull/53501)
- 修正透過純 HTTP 開啟時，管理 UI 按鈕與 Aria Agent 失敗的問題 - [PR #52129](https://github.com/BerriAI/litellm/pull/52129)
- 修正 Aria Agent 日期工具在 DeepSeek 模型群組上以 400 失敗的問題 - [PR #52189](https://github.com/BerriAI/litellm/pull/52189)
- 修正自動路由器設定無法辨識 Bedrock `in.` 與 `ca.` 推論設定檔的問題 - [PR #52574](https://github.com/BerriAI/litellm/pull/52574)
- 修正客戶管理中，暫時性預算提高取代永久自訂上限的問題 - [PR #52787](https://github.com/BerriAI/litellm/pull/52787)
- 修正環境憑證登入警告的文件連結導向快速入門的問題 - [PR #52788](https://github.com/BerriAI/litellm/pull/52788)
- 修正新增備援按鈕下缺少間距的問題 - [PR #52793](https://github.com/BerriAI/litellm/pull/52793)
- 修正 AI Hub 對透過 `bedrock/*` 等萬用字元項目發佈的模型顯示未知健康狀態的問題 - [PR #52875](https://github.com/BerriAI/litellm/pull/52875)
- 修正使用者詳細資料在儲存角色變更後仍顯示舊角色的問題 - [PR #52991](https://github.com/BerriAI/litellm/pull/52991)
- 修正變更策略時，自動路由器簡易設定被進階控制項取代的問題 - [PR #53054](https://github.com/BerriAI/litellm/pull/53054)
- 修正建立金鑰列出成員無法建立金鑰的團隊的問題 - [PR #53139](https://github.com/BerriAI/litellm/pull/53139)
- 修正儲存的團隊政策在重新開啟團隊後顯示為空的問題 - [PR #53434](https://github.com/BerriAI/litellm/pull/53434)
- 修正為成員金鑰擴充選擇成員模型時，取代其繼承模型清單的問題 - [PR #53445](https://github.com/BerriAI/litellm/pull/53445)
- 修正沒有電子郵件的 SSO 使用者顯示 UUID 而非儲存的別名的問題 - [PR #53476](https://github.com/BerriAI/litellm/pull/53476)
- 修正記錄公開模型篩選器回傳零列的問題 - [PR #53489](https://github.com/BerriAI/litellm/pull/53489)
- 修正記錄詳細資料抽屜對內部使用者只顯示使用者 ID 而非電子郵件的問題 - [PR #53499](https://github.com/BerriAI/litellm/pull/53499)
- 修正模型重新整理按鈕位置，以及用罄的預算百分比與其上限黏在一起顯示的問題 - [PR #53939](https://github.com/BerriAI/litellm/pull/53939)
- 修正新頁面標頭下錯置的頁面控制項與分頁底線問題 - [PR #54100](https://github.com/BerriAI/litellm/pull/54100)
- 變更專案預設對 Proxy、組織與團隊管理員顯示，並移除專案切換開關 - [PR #49391](https://github.com/BerriAI/litellm/pull/49391)
- 變更儀表板與聊天側邊欄為 shadcn Sidebar，並新增 Cmd/Ctrl+B 切換 - [PR #51257](https://github.com/BerriAI/litellm/pull/51257)
- 變更客戶管理入口網站，減少說明文字並使用更一致的間距 - [PR #52381](https://github.com/BerriAI/litellm/pull/52381)
- 變更專案導覽項目不再顯示 Beta 徽章 - [PR #52389](https://github.com/BerriAI/litellm/pull/52389)
- 變更應用程式頁面以表格列出每個應用程式 - [PR #52496](https://github.com/BerriAI/litellm/pull/52496)
- 變更記錄回呼，標示在 config.yaml 中設定的列，並停用其刪除動作 - [PR #52507](https://github.com/BerriAI/litellm/pull/52507)
- 變更工作區切換器提供 Lens 選項 - [PR #52563](https://github.com/BerriAI/litellm/pull/52563)
- 變更 Model Hub 為模型型錄版面，包含快速入門區段與 Cmd/Ctrl+K 搜尋 - [PR #52672](https://github.com/BerriAI/litellm/pull/52672)
- 變更客戶入口網站預算編輯為包含預設與自訂金額的對話框，用量列會開啟詳細頁面 - [PR #52682](https://github.com/BerriAI/litellm/pull/52682)
- 變更登入頁面顯示新的 LiteLLM 標誌 - [PR #52789](https://github.com/BerriAI/litellm/pull/52789)
- 變更未儲存主題時，儀表板改為遵循系統色彩配置 - [PR #52792](https://github.com/BerriAI/litellm/pull/52792)
- 變更約 120 個管理 UI 標籤，每個概念使用一個英文名稱 - [PR #52968](https://github.com/BerriAI/litellm/pull/52968)
- 變更頁面標頭與間距，管理 UI 全站改為與虛擬金鑰一致 - [PR #53278](https://github.com/BerriAI/litellm/pull/53278)、[PR #53283](https://github.com/BerriAI/litellm/pull/53283)、[PR #53284](https://github.com/BerriAI/litellm/pull/53284)、[PR #53440](https://github.com/BerriAI/litellm/pull/53440)
- 變更團隊成員預設值改放在專屬的成員預設值分頁 - [PR #53371](https://github.com/BerriAI/litellm/pull/53371)
- 變更金鑰總覽一律在可見的卡片中顯示繼承的預算 - [PR #53375](https://github.com/BerriAI/litellm/pull/53375)
- 變更用量頁面改為開啟本月至今，而非過去七天 - [PR #53457](https://github.com/BerriAI/litellm/pull/53457)
- 變更側邊欄項目為模型管理，並將三個頁面標題縮短以符合其側邊欄標籤 - [PR #53466](https://github.com/BerriAI/litellm/pull/53466)
- 變更 zh-CN 儀表板文字，將 USD、URL 與 RPM 等縮寫保留為英文 - [PR #53472](https://github.com/BerriAI/litellm/pull/53472)
- 變更虛擬金鑰總覽分頁、標頭與載入狀態為重新設計的版面 - [PR #53514](https://github.com/BerriAI/litellm/pull/53514)
- 變更金鑰支出卡片一律顯示終身支出，並將欄位靠上對齊 - [PR #53537](https://github.com/BerriAI/litellm/pull/53537)
- 移除模型表格上方的決策模型公告橫幅 - [PR #53202](https://github.com/BerriAI/litellm/pull/53202)
- 移除舊的使用者名稱與密碼登入頁面，改用 `/ui/login` - [PR #53205](https://github.com/BerriAI/litellm/pull/53205)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 新增 `/team/info` 上的 `include_members=false`，以及大型名冊用的分頁團隊成員端點 - [PR #51885](https://github.com/BerriAI/litellm/pull/51885)
- 新增客戶組織、客戶成員與客戶團隊的 JWT 宣告對映 - [PR #52399](https://github.com/BerriAI/litellm/pull/52399)
- 新增推論請求上租戶與使用者的可設定客戶身分標頭 - [PR #52467](https://github.com/BerriAI/litellm/pull/52467)
- 新增各應用程式設定，決定請求是否可建立未知的客戶 - [PR #52485](https://github.com/BerriAI/litellm/pull/52485)
- 新增 `/user/info`、`/v2/user/info` 與 `/team/info` 上的目前預算期間支出 - [PR #52673](https://github.com/BerriAI/litellm/pull/52673)
- 新增客戶入口網站中，應用程式成員的自訂支出期間與共用預算範本 - [PR #52784](https://github.com/BerriAI/litellm/pull/52784)、[PR #52976](https://github.com/BerriAI/litellm/pull/52976)、[PR #52989](https://github.com/BerriAI/litellm/pull/52989)、[PR #53066](https://github.com/BerriAI/litellm/pull/53066)
- 新增團隊設定或 `metadata.max_budget_alert_emails` 中，團隊的多個百分比預算電子郵件警示 - [PR #52859](https://github.com/BerriAI/litellm/pull/52859)、[PR #52860](https://github.com/BerriAI/litellm/pull/52860)
- 新增客戶預算 webhook 與自訂回呼中，應用程式客戶範圍的預算警示 - [PR #52955](https://github.com/BerriAI/litellm/pull/52955)
- 新增依閘道、團隊或金鑰設定的必填客戶標頭 - [PR #53045](https://github.com/BerriAI/litellm/pull/53045)
- 新增客戶管理中共用預算與用量的應用程式群組 - [PR #53232](https://github.com/BerriAI/litellm/pull/53232)
- 新增未用預算結轉至下一期，設有上限 - [PR #53309](https://github.com/BerriAI/litellm/pull/53309)
- 修正 `/scim/v2` 錯誤，改為回傳 RFC 7644 SCIM Error 結構描述 - [PR #51322](https://github.com/BerriAI/litellm/pull/51322)
- 修正預算保留使用提供者看不到的輸出上限，導致平行呼叫超支金鑰的問題，自 v1.102.0 起損壞 - [PR #51752](https://github.com/BerriAI/litellm/pull/51752)
- 修正優先請求標頭與計數器在優先池的 token 用罄後停止的問題 - [PR #52081](https://github.com/BerriAI/litellm/pull/52081)
- 修正僅檢視的預設角色對無儲存角色的使用者被忽略的問題 - [PR #52295](https://github.com/BerriAI/litellm/pull/52295)
- 修正無資料庫的代理程式上，錯誤的金鑰回傳 400 `No connected db` 而非 401 的問題 - [PR #52349](https://github.com/BerriAI/litellm/pull/52349)
- 修正模型群組上的 `model_max_budget` 項目忽略以其全域別名傳送的請求的問題 - [PR #52385](https://github.com/BerriAI/litellm/pull/52385)
- 修正團隊未快取時，用罄的團隊成員、終端使用者與組織上限未提早檢查的問題 - [PR #52388](https://github.com/BerriAI/litellm/pull/52388)
- 修正 JWT 團隊呼叫者在已授權直通端點的子路徑與資料庫中斷時收到 403 的問題 - [PR #52397](https://github.com/BerriAI/litellm/pull/52397)
- 修正設定 `LITELLM_SALT_KEY` 時輪換主金鑰，導致資料庫模型憑證仍為密文的問題 - [PR #52413](https://github.com/BerriAI/litellm/pull/52413)
- 修正 `Connection` 列出 `x-litellm-api-key` 時出現 401 `No api key passed in` 的問題 - [PR #52427](https://github.com/BerriAI/litellm/pull/52427)
- 修正超支金鑰透過自訂驗證仍收到 200 的問題，改為強制執行金鑰的 `max_budget` - [PR #52654](https://github.com/BerriAI/litellm/pull/52654)
- 修正停滯的模型存取群組掃描拖住後續驗證請求的問題 - [PR #52899](https://github.com/BerriAI/litellm/pull/52899)
- 修正組織管理員支出記錄讀取改為遵循其管理的組織，並對齊 Gemini 檔案 ID 解析 - [PR #52943](https://github.com/BerriAI/litellm/pull/52943)
- 修正主金鑰輪換後，部分儲存的密鑰仍以舊金鑰加密的問題 - [PR #52998](https://github.com/BerriAI/litellm/pull/52998)
- 修正預算期間提早重設的問題，包含多日的小時預算與非 UTC 的 `litellm_settings.timezone` - [PR #53012](https://github.com/BerriAI/litellm/pull/53012)、[PR #53020](https://github.com/BerriAI/litellm/pull/53020)
- 修正授權錯誤提及內建標頭而非設定的客戶標頭的問題 - [PR #53043](https://github.com/BerriAI/litellm/pull/53043)
- 修正 PostgreSQL 停機時，已知應用程式客戶收到 503 的問題 - [PR #53056](https://github.com/BerriAI/litellm/pull/53056)
- 修正預算重設覆寫較新的預算上限編輯或還原已過期期間的問題 - [PR #53064](https://github.com/BerriAI/litellm/pull/53064)
- 修正每日與每月預算期間在日光節約時間變更時重新開啟或計數錯誤的問題 - [PR #53065](https://github.com/BerriAI/litellm/pull/53065)
- 修正預算重設提早觸發的問題，讓 `45m` 與 `5h` 等排程獲得完整間隔 - [PR #53151](https://github.com/BerriAI/litellm/pull/53151)
- 修正具有明確模型清單的使用者在記錄合規檢查上收到 403 的問題 - [PR #53160](https://github.com/BerriAI/litellm/pull/53160)
- 修正 OAuth 登入的管理員工作階段 token 缺少使用者電子郵件的問題 - [PR #53184](https://github.com/BerriAI/litellm/pull/53184)
- 修正 Realtime 與 HTTP 路由上任何大小寫的 `bearer` 驗證方式被拒絕的問題 - [PR #53259](https://github.com/BerriAI/litellm/pull/53259)
- 修正資料庫中斷期間 JWT 團隊讀取回傳 401 的問題，現在會重試並回應 503 - [PR #53260](https://github.com/BerriAI/litellm/pull/53260)
- 修正 `litellm_jwtauth` 下 `audience` 與 `public_key_url` 導致代理程式啟動失敗的問題 - [PR #53288](https://github.com/BerriAI/litellm/pull/53288)
- 變更 `/spend/logs` 與 `/spend/logs/v2`，讓每把金鑰讀取自己的記錄，超出範圍的篩選器回傳 403 - [PR #52449](https://github.com/BerriAI/litellm/pull/52449)
- 變更 `GET /customer/info` 要求代理程式管理員角色，組織管理員現在會收到 401 - [PR #52451](https://github.com/BerriAI/litellm/pull/52451)
- 變更未知的 JWT 團隊宣告改回傳通用的 401，而非回應團隊 ID 的 404 - [PR #53044](https://github.com/BerriAI/litellm/pull/53044)
- 變更金鑰與團隊的 `budget_limits` 對負數上限、不支援的期間與重複的期間回傳 422 - [PR #53218](https://github.com/BerriAI/litellm/pull/53218)

### Lens {#lens}

- 新增閘道模型呼叫在 Lens 儲存區連線時，以追蹤形式傳送至 Lens - [PR #53042](https://github.com/BerriAI/litellm/pull/53042)
- 新增傳送至 Lens 的閘道追蹤的框架、工作與工作階段屬性，Pi 執行現在會合併為一次執行 - [PR #53186](https://github.com/BerriAI/litellm/pull/53186)
- 新增 `/lens/login`，讓 LiteLLM 登入可登入獨立 Lens，並在其側邊欄顯示使用者 - [PR #53190](https://github.com/BerriAI/litellm/pull/53190)、[PR #53212](https://github.com/BerriAI/litellm/pull/53212)、[PR #53213](https://github.com/BerriAI/litellm/pull/53213)
- 新增透過 `POST /v1/traces` 將代理程式 span 轉發至 Lens，閘道呼叫包含在代理程式的追蹤中 - [PR #53285](https://github.com/BerriAI/litellm/pull/53285)
- 修正 Lens 工作區仍顯示完整閘道側邊欄的問題 - [PR #52771](https://github.com/BerriAI/litellm/pull/52771)
- 修正 Lens 將未傳送工作階段 ID 的代理程式對同一提示詞的個別執行合併的問題 - [PR #53194](https://github.com/BerriAI/litellm/pull/53194)
- 修正超過 1 MiB 的請求抵達 Lens 時沒有成本記錄的問題 - [PR #53268](https://github.com/BerriAI/litellm/pull/53268)
- 修正 Lens 頁面在未設定的閘道上顯示升級提示，並在託管的閘道上顯示 localhost 連結的問題 - [PR #53534](https://github.com/BerriAI/litellm/pull/53534)
- 修正 Lens 捨棄具有大型工具定義的請求的成本記錄的問題 - [PR #53711](https://github.com/BerriAI/litellm/pull/53711)
- 變更內嵌 Lens UI 為已發佈的 0.1.0 版本，包含新導覽與可隱藏的活動圖表 - [PR #53041](https://github.com/BerriAI/litellm/pull/53041)
- 變更 Lens 自身的呼叫為標示為 `lens-signals` 的一般呼叫，並移除 `x-lens-internal` 標頭 - [PR #53163](https://github.com/BerriAI/litellm/pull/53163)
- 變更閘道 Codex 執行命名為 `codex-cli`，以符合 Lens 中 Codex 自身的追蹤 - [PR #53197](https://github.com/BerriAI/litellm/pull/53197)
- 變更閘道在傳送給 Lens 的追蹤中去除代理程式框架上下文 - [PR #53226](https://github.com/BerriAI/litellm/pull/53226)
- 變更傳送至 Lens 的閘道成本記錄省略請求與回應內文 - [PR #53274](https://github.com/BerriAI/litellm/pull/53274)
- 變更管理 UI 的 Lens 頁面為 Lens 0.2.0 UI - [PR #53281](https://github.com/BerriAI/litellm/pull/53281)
- 變更儀表板顯示由已連線 Lens 提供的 Lens UI - [PR #53473](https://github.com/BerriAI/litellm/pull/53473)
- 變更 Lens 顯示 Claude Code 自身的追蹤與記錄，並停止傳送閘道自身的記錄 - [PR #53485](https://github.com/BerriAI/litellm/pull/53485)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 新增 PANW 與 Presidio 防護欄的自願加入 pre_call 掃描，將工具說明視為文字掃描 - [PR #50301](https://github.com/BerriAI/litellm/pull/50301)
- 新增 Bedrock 防護欄在 `/apply_guardrail` 上的圖片掃描 - [PR #51016](https://github.com/BerriAI/litellm/pull/51016)
- 新增 Model Armor 以 `post_mcp_call` 掃描 MCP 工具結果 - [PR #51887](https://github.com/BerriAI/litellm/pull/51887)
- 新增自願加入的 Bedrock 防護欄掃描，將工具呼叫引數與工具說明視為文字掃描 - [PR #52999](https://github.com/BerriAI/litellm/pull/52999)
- 新增 `reject_unregistered_guardrails`，拒絕指名未註冊防護欄的請求 - [PR #53214](https://github.com/BerriAI/litellm/pull/53214)
- 修正通用防護欄 API 改寫的 `tool_calls` 在任何端點上都未傳達給用戶端的問題 - [PR #50413](https://github.com/BerriAI/litellm/pull/50413)
- 修正 `/apply_guardrail` 請求未出現在請求記錄中的問題，現在會記錄判決與成本 - [PR #51014](https://github.com/BerriAI/litellm/pull/51014)
- 修正 Alice 防護欄將每個提示詞傳送給 Alice 四次的問題 - [PR #51392](https://github.com/BerriAI/litellm/pull/51392)
- 修正 Gray Swan 防護欄將 `error: true` 回應與無效分數視為乾淨，而非遵循 `fail_open` 的問題 - [PR #52191](https://github.com/BerriAI/litellm/pull/52191)
- 修正每個請求的 `extra_body` 未傳達至通用防護欄服務的問題 - [PR #52438](https://github.com/BerriAI/litellm/pull/52438)
- 修正呼叫後 `MASK` 防護欄在 `/v1/responses` 上讓推理文字未遮罩的問題 - [PR #52504](https://github.com/BerriAI/litellm/pull/52504)
- 修正 `/v1/messages` 上的防護欄改寫捨棄工具結果的 `is_error` 與系統列的 `output_config` 的問題 - [PR #52828](https://github.com/BerriAI/litellm/pull/52828)
- 修正政策範本競爭者名稱生成在較新的 OpenAI 模型上未回傳名稱的問題 - [PR #53311](https://github.com/BerriAI/litellm/pull/53311)
- 修正防護欄在 `/v1/messages` 上看不到 `web_search` 工具的問題 - [PR #53376](https://github.com/BerriAI/litellm/pull/53376)
- 修正 `tool_permission` 在每個 Gemini `streamGenerateContent` 串流上回傳 400 的問題 - [PR #53600](https://github.com/BerriAI/litellm/pull/53600)
- 變更 Straiker 串流在判決前保留工具呼叫，並以回應記錄其封鎖的提示詞 - [PR #51872](https://github.com/BerriAI/litellm/pull/51872)

### 記錄與可觀測性 {#logging-and-observability}

- 新增每次失敗的重試與備援嘗試的 OTel span，包含目的地與錯誤 - [PR #50310](https://github.com/BerriAI/litellm/pull/50310)
- 新增警示中的提示快取建議，包含重複的 Anthropic 提示快取未命中警示 - [PR #51943](https://github.com/BerriAI/litellm/pull/51943)、[PR #51973](https://github.com/BerriAI/litellm/pull/51973)
- 新增支出記錄中自願加入的前綴區塊雜湊，供工作負載重播使用 - [PR #52120](https://github.com/BerriAI/litellm/pull/52120)
- 新增代理程式生命週期中自訂回呼的啟動與關閉掛鉤 - [PR #52908](https://github.com/BerriAI/litellm/pull/52908)
- 修正設定重新載入堆疊通用 API 記錄器沖洗工作，並保留舊標頭的問題 - [PR #50879](https://github.com/BerriAI/litellm/pull/50879)
- 修正 OTel V2 將 Langfuse 追蹤傳送至遭拒的金鑰或團隊主機的問題 - [PR #51344](https://github.com/BerriAI/litellm/pull/51344)
- 修正支出記錄保留從不刪除防護欄索引列的問題，每次 `default_on` 防護欄呼叫會增加一列 - [PR #51518](https://github.com/BerriAI/litellm/pull/51518)
- 修正串流成功記錄回呼在完成前被捨棄的問題 - [PR #52067](https://github.com/BerriAI/litellm/pull/52067)
- 修正中斷的串流記錄捏造的完成原因，現在為 `finish_reason_unspecified` - [PR #52088](https://github.com/BerriAI/litellm/pull/52088)
- 修正非同步 Interactions 串流成功記錄被垃圾回收或關閉捨棄的問題 - [PR #52300](https://github.com/BerriAI/litellm/pull/52300)
- 修正串流失敗回呼與保留在記憶體中的已完成請求的過時請求欄位問題 - [PR #52408](https://github.com/BerriAI/litellm/pull/52408)
- 修正 Datadog 記錄與 LLM 可觀測性 span 未傳送 `DD_TAGS` 的問題 - [PR #52415](https://github.com/BerriAI/litellm/pull/52415)
- 修正用戶端中斷後，提供者失敗永遠無法傳達至失敗回呼的問題 - [PR #52450](https://github.com/BerriAI/litellm/pull/52450)
- 修正 TypeSafe 與決策呼叫的直通支出列記錄 0 個提示與完成 token 的問題，自 v1.110.0 起損壞 - [PR #52527](https://github.com/BerriAI/litellm/pull/52527)
- 修正 `turn_off_message_logging` 開啟時，產生的圖片仍被記錄的問題 - [PR #52605](https://github.com/BerriAI/litellm/pull/52605)
- 修正聊天以外的追蹤與 Prometheus 部署指標顯示 `None` 而非真正提供者的問題 - [PR #52622](https://github.com/BerriAI/litellm/pull/52622)、[PR #52709](https://github.com/BerriAI/litellm/pull/52709)
- 修正 Rust 背景工作警告與除錯行未出現在代理程式記錄中，並印出其欄位的問題 - [PR #53539](https://github.com/BerriAI/litellm/pull/53539)、[PR #53717](https://github.com/BerriAI/litellm/pull/53717)、[PR #53738](https://github.com/BerriAI/litellm/pull/53738)
- 修正 Rust 閘道未遮罩記錄密鑰的問題，其記錄行現在顯示 `REDACTED` - [PR #53714](https://github.com/BerriAI/litellm/pull/53714)
- 修正 MCP `authorization_token` 值在除錯記錄中仍可讀取的問題 - [PR #53740](https://github.com/BerriAI/litellm/pull/53740)
- 變更支出記錄的 `key_alias` 篩選器為使用索引的精確比對 - [PR #47795](https://github.com/BerriAI/litellm/pull/47795)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 新增 OpenRouter 與 Perplexity 決策模型的定價，先前記錄的支出為 $0 - [PR #45476](https://github.com/BerriAI/litellm/pull/45476)
- 新增每日活動用量匯出列中的金鑰與使用者中繼資料物件 - [PR #49360](https://github.com/BerriAI/litellm/pull/49360)
- 新增 `fal_ai` Seedance 2.5 Flash 與 PixVerse 片段價格、Copilot 退役日期，以及 Groq 與 Nebius 價格修正 - [PR #51929](https://github.com/BerriAI/litellm/pull/51929)、[PR #52041](https://github.com/BerriAI/litellm/pull/52041)
- 新增非美元定價，支援 `pricing_currency` 覆寫、ECB 匯率查詢，以及用量卡片上的貨幣估計 - [PR #51934](https://github.com/BerriAI/litellm/pull/51934)、[PR #51971](https://github.com/BerriAI/litellm/pull/51971)、[PR #51979](https://github.com/BerriAI/litellm/pull/51979)
- 新增 Databricks `gemini-4-hydrogen`、fal_ai `iris-z` 與 Bedrock `eu.cohere.embed-v4:0` 的價格 - [PR #52162](https://github.com/BerriAI/litellm/pull/52162)
- 新增 Mantle 模型的 `bedrock_mantle/` 與 `bedrock/mantle/` 價格，並修正 Claude Haiku 4.5 費率 - [PR #52231](https://github.com/BerriAI/litellm/pull/52231)
- 新增 fal_ai Kling V4 圖片模型、Azure GPT-6 Luna flex、Snowflake 與 Bedrock Mantle Claude 5.5 的定價 - [PR #52299](https://github.com/BerriAI/litellm/pull/52299)
- 新增 fal_ai HeyGen Avatar 6 與 Microsoft MAI-Image-2.7 端點的定價 - [PR #52340](https://github.com/BerriAI/litellm/pull/52340)
- 新增客戶請求的附加費用，可設定整體費用或各應用程式百分比 - [PR #52406](https://github.com/BerriAI/litellm/pull/52406)、[PR #52492](https://github.com/BerriAI/litellm/pull/52492)
- 新增 286 筆更多有日期的模型清單的替代模型與退役連結 - [PR #52710](https://github.com/BerriAI/litellm/pull/52710)
- 新增 `gemini/genie-4` 定價以追蹤其支出 - [PR #52872](https://github.com/BerriAI/litellm/pull/52872)
- 新增 `azure_ai/kimi-k3.1-pro` 定價，呼叫不再以 $0 追蹤 - [PR #52873](https://github.com/BerriAI/litellm/pull/52873)
- 新增已退役模型清單上大多數有日期的模型的替代模型 - [PR #52893](https://github.com/BerriAI/litellm/pull/52893)
- 新增 Together、Perplexity、InferenceAPIs 與 AssemblyAI 的 27 列成本對映表資料，並補齊 72 筆現有資料的中繼資料 - [PR #52912](https://github.com/BerriAI/litellm/pull/52912)
- 新增已發佈每分鐘費率的 `gpt-live-1.1` 定價 - [PR #52926](https://github.com/BerriAI/litellm/pull/52926)
- 新增 `fal_ai` Ideogram 4.6 文字轉圖片與編輯定價 - [PR #52927](https://github.com/BerriAI/litellm/pull/52927)
- 新增成本對映表中的 `together_ai/tencent/Hy4`，其支出不再以零追蹤 - [PR #52985](https://github.com/BerriAI/litellm/pull/52985)
- 修正自訂模型價格儘管回應成功卻未儲存的問題 - [PR #48746](https://github.com/BerriAI/litellm/pull/48746)
- 修正 `gpt-4o-transcribe` 音訊輸入以每 100 萬 token $2.50 而非 $6.00 計費的問題 - [PR #52303](https://github.com/BerriAI/litellm/pull/52303)
- 修正 fal_ai Seedance 2.5 1080p 影片以 720p 費率計費的問題 - [PR #52304](https://github.com/BerriAI/litellm/pull/52304)
- 修正網頁搜尋在同一 Responses 呼叫中執行時，缺少檔案搜尋費用的問題 - [PR #52555](https://github.com/BerriAI/litellm/pull/52555)
- 修正 `claude-mythos-preview` 退役日期，並新增 `azure/us-gov/gpt-4o-mini` 定價 - [PR #52557](https://github.com/BerriAI/litellm/pull/52557)
- 修正成本對映表中錯誤的上限、價格與能力旗標，並新增缺少的近期模型 - [PR #52619](https://github.com/BerriAI/litellm/pull/52619)
- 修正 `fireworks_ai/kimi-latest` 以 Kimi K3 而非 Kimi K3.1 Pro 費率定價的問題 - [PR #52634](https://github.com/BerriAI/litellm/pull/52634)
- 修正 `generateContent` 支出在用量頁面顯示於 `/chat/completions` 下或無端點的問題 - [PR #52701](https://github.com/BerriAI/litellm/pull/52701)
- 修正 Azure 與 Together 模型退役日期，並新增成本對映表中的 GMI Gemini 4 Hydrogen - [PR #52763](https://github.com/BerriAI/litellm/pull/52763)
- 修正 `fireworks_ai` spot 路由器與 deepseek-v4p1-flash-1017 ultrafast 列計費高於 Fireworks 牌價的問題 - [PR #52928](https://github.com/BerriAI/litellm/pull/52928)、[PR #52947](https://github.com/BerriAI/litellm/pull/52947)
- 修正成本中忽略圖片輸入、快取圖片 token 與圖片輸出的優先費率問題 - [PR #52972](https://github.com/BerriAI/litellm/pull/52972)
- 修正聊天完成與 `/v1/messages` 上 Fireworks 路由器呼叫的錯誤支出問題 - [PR #52973](https://github.com/BerriAI/litellm/pull/52973)
- 修正 `wandb` NVIDIA Nemotron 3.5 Super VL 輸出價格為每 100 萬 token $0.47 - [PR #52983](https://github.com/BerriAI/litellm/pull/52983)
- 修正 Databricks Gemini 4 Carbon 與 Hydrogen 價格以符合 Databricks 定價頁面 - [PR #52986](https://github.com/BerriAI/litellm/pull/52986)
- 修正 `gpt-6-rosalind` 長上下文與快取寫入價格計費高出 50% 的問題 - [PR #53050](https://github.com/BerriAI/litellm/pull/53050)
- 修正轉發憑證的請求在最後一次重試逾時時產生額外的支出列的問題，自 v1.110.2 起損壞 - [PR #53072](https://github.com/BerriAI/litellm/pull/53072)
- 修正 Together AI 語音模型按字元計費卻遠低於其費率的問題 - [PR #53130](https://github.com/BerriAI/litellm/pull/53130)
- 修正 Azure AI GPT-5.6 與 OpenRouter DeepSeek V4 請求記錄的 $0 成本問題 - [PR #53149](https://github.com/BerriAI/litellm/pull/53149)
- 修正 `gpt-4o-mini-tts` 支出以符合 OpenAI 的帳單，語音約低 20 至 35 個百分點 - [PR #53150](https://github.com/BerriAI/litellm/pull/53150)
- 修正語音計費忽略部署自訂的 `input_cost_per_character`（包含 0）的問題 - [PR #53265](https://github.com/BerriAI/litellm/pull/53265)
- 修正停用錯誤記錄時，失敗請求的費用被捨棄的問題 - [PR #53271](https://github.com/BerriAI/litellm/pull/53271)
- 修正 `gpt-4o-mini-tts` aac 與 flac 語音支出記錄較 OpenAI 帳單高約 19% 的問題 - [PR #53308](https://github.com/BerriAI/litellm/pull/53308)
- 修正備援在逾時後失敗時重複的計費列與錯誤的部署標籤問題 - [PR #53313](https://github.com/BerriAI/litellm/pull/53313)
- 修正 Fireworks DeepSeek V4.1 Flash 1017 定價與 Azure 及 Vertex 退役日期 - [PR #53331](https://github.com/BerriAI/litellm/pull/53331)
- 修正 Prometheus 預算量測重複減去請求自身成本，以及 UTC Postgres 上遺失的支出傳送問題 - [PR #54074](https://github.com/BerriAI/litellm/pull/54074)
- 變更 FOCUS 匯出為 1.5 結構描述，並移除 `ProviderName` 與 `PublisherName` 欄位 - [PR #52105](https://github.com/BerriAI/litellm/pull/52105)
- 變更 fal.ai FLUX 3 Max 影片定價在促銷結束後改為常規費率 - [PR #53670](https://github.com/BerriAI/litellm/pull/53670)

## MCP 閘道 {#mcp-gateway}

- 新增 MCP 探索登錄中的 Parallel 免費網頁搜尋伺服器 - [PR #52141](https://github.com/BerriAI/litellm/pull/52141)
- 修正提供者省略已包含的範圍時，GitHub MCP 登入在連線頁面循環的問題，自 v1.107.0-rc.1 起損壞 - [PR #51788](https://github.com/BerriAI/litellm/pull/51788)
- 修正 MCP JWT 簽署器開啟時，帶金鑰的 MCP 伺服器出現 401 與 500 錯誤的問題 - [PR #51867](https://github.com/BerriAI/litellm/pull/51867)
- 修正具有大量金鑰與團隊資料的代理程式上，代理程式管理員的每個託管管理 MCP 請求出現 503 的問題 - [PR #52096](https://github.com/BerriAI/litellm/pull/52096)
- 修正 `registry.json` 將別名顯示為每個伺服器的說明與標題的問題 - [PR #52319](https://github.com/BerriAI/litellm/pull/52319)
- 修正 `/mcp` 上上游 `-32042` URL 徵求錯誤被扁平化，現在同意 URL 可傳達至用戶端 - [PR #52384](https://github.com/BerriAI/litellm/pull/52384)
- 修正權限拒絕同時發生時重複的 MCP 登入問題 - [PR #52809](https://github.com/BerriAI/litellm/pull/52809)
- 修正 MCP OAuth token 重新整理遺忘缺少的權限請求，導致重新連線的工具損壞的問題 - [PR #53200](https://github.com/BerriAI/litellm/pull/53200)
- 變更超支的使用者與金鑰可呼叫未定價或成本為 $0 的 MCP 工具 - [PR #52130](https://github.com/BerriAI/litellm/pull/52130)

## 代理程式、SDK 與其他變更 {#agents-sdk-and-other-changes}

### 代理程式 {#agents}

- 新增 Pi 框架壓縮上下文時的壓縮事件 - [PR #52655](https://github.com/BerriAI/litellm/pull/52655)
- 修正未定價模型在代理程式評估建議中顯示為免費的問題 - [PR #53455](https://github.com/BerriAI/litellm/pull/53455)

### SDK {#sdk}

- 新增 `aagent_eval_attempt` 與自訂 `EvalAgent` 代理程式，可與支援的框架比較 - [PR #53366](https://github.com/BerriAI/litellm/pull/53366)、[PR #53381](https://github.com/BerriAI/litellm/pull/53381)
- 修正使用 `pip install litellm` 時，Messages 串流與快取命中出現 `No module named 'fastapi'` 的問題 - [PR #52339](https://github.com/BerriAI/litellm/pull/52339)
- 修正對 `litellm_proxy/` 模型的 `litellm.asystemone` 呼叫遺失信心度、`decision_id` 與代理程式成本的問題 - [PR #53195](https://github.com/BerriAI/litellm/pull/53195)
- 修正 Responses API 與其他端點的提供者錯誤上，`e.response.text` 為空的問題 - [PR #53587](https://github.com/BerriAI/litellm/pull/53587)

### 其他 {#other}

- 新增自願加入的選項，可跳過比較同一模型群組的反向影子評估 - [PR #52192](https://github.com/BerriAI/litellm/pull/52192)
- 新增已登入 Cursor CLI 訂閱的支援 - [PR #52205](https://github.com/BerriAI/litellm/pull/52205)
- 新增影子評估的 1 至 5 分自選評分標準等級，以及啟動評估與讀取分數分布的 API - [PR #52321](https://github.com/BerriAI/litellm/pull/52321)
- 修正 `lite codex` 型錄捨棄每個模型設定的服務層級與顯示名稱的問題 - [PR #49422](https://github.com/BerriAI/litellm/pull/49422)
- 修正原始文字內文含有孤立 UTF-16 代理字元時，請求 UTF-8 編碼失敗的問題 - [PR #49599](https://github.com/BerriAI/litellm/pull/49599)
- 修正使用 `litellm.use_litellm_proxy` 或 `litellm_proxy/` 模型時，Decisions API 呼叫失敗的問題 - [PR #51611](https://github.com/BerriAI/litellm/pull/51611)
- 修正輸入為 addict `Dict` 等 dict 子類別時，OCR 與 `/v1/messages` 請求失敗的問題 - [PR #51812](https://github.com/BerriAI/litellm/pull/51812)
- 修正 Skills Hub 在部分編輯與 ZIP 取代時遺失來源與中繼資料的問題 - [PR #51977](https://github.com/BerriAI/litellm/pull/51977)
- 修正 Decisions 答案依位置而非名稱與問題配對的問題 - [PR #52597](https://github.com/BerriAI/litellm/pull/52597)
- 修正 OpenAI `input_json` 內容部分在 `/v1/decisions` 上出現 400 的問題 - [PR #52805](https://github.com/BerriAI/litellm/pull/52805)
- 修正 OAuth 直通路由拒絕授權 URL 中的 `client_id` 的問題，自 v1.110.1 起損壞 - [PR #53379](https://github.com/BerriAI/litellm/pull/53379)
- 變更 OpenAI 403 `invalid_request_error` 回應改為引發 `PermissionDeniedError` - [PR #53177](https://github.com/BerriAI/litellm/pull/53177)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

### 路由與備援 {#routing-and-fallbacks}

- 新增自願加入的優先佇列，部署回傳 429 或 529 時暫存非同步非串流聊天 - [PR #51892](https://github.com/BerriAI/litellm/pull/51892)
- 新增對話上限，讓複雜度路由器在長對話中分類簡短提問 - [PR #52183](https://github.com/BerriAI/litellm/pull/52183)
- 新增路由器工作階段親和性可選擇的對話標頭 - [PR #52193](https://github.com/BerriAI/litellm/pull/52193)
- 新增拒絕跨不相關模型群組衝突的原始提供者模型名稱的選項 - [PR #52895](https://github.com/BerriAI/litellm/pull/52895)
- 新增複雜度路由器可自選的分類器輸出上限，可從儀表板設定 - [PR #52979](https://github.com/BerriAI/litellm/pull/52979)
- 新增透過 Redis 在閘道與 Python Pod 之間共用的冷卻、允許失敗次數與用量 - [PR #53060](https://github.com/BerriAI/litellm/pull/53060)
- 修正呼叫前防護欄開啟時，標籤路由選擇預設部署的問題 - [PR #50488](https://github.com/BerriAI/litellm/pull/50488)
- 修正 `enforce_fallback_model_access` 檢查用戶端傳送的 `model_group_alias` 而非儲存的別名的問題 - [PR #52077](https://github.com/BerriAI/litellm/pull/52077)
- 修正 `fallback_on_unsupported_params` 為 false 時，413 與 422 `BadRequestError` 仍備援的問題 - [PR #52195](https://github.com/BerriAI/litellm/pull/52195)
- 修正優先限制器計算快取讀取 token，並對快取提示詞提早回傳 429 的問題 - [PR #52209](https://github.com/BerriAI/litellm/pull/52209)
- 修正跨群組備援也失敗時，串流 `/v1/messages` 與 `/v1/responses` 捨棄一個錯誤的問題 - [PR #52217](https://github.com/BerriAI/litellm/pull/52217)
- 修正原生閘道跳過重試、備援與冷卻，並以提供者的模型名稱回應的問題 - [PR #52274](https://github.com/BerriAI/litellm/pull/52274)、[PR #52428](https://github.com/BerriAI/litellm/pull/52428)、[PR #52466](https://github.com/BerriAI/litellm/pull/52466)、[PR #52790](https://github.com/BerriAI/litellm/pull/52790)
- 修正 `/v1/responses`、`/v1/messages` 與 SDK 呼叫上的團隊順序與加權容錯移轉問題 - [PR #53264](https://github.com/BerriAI/litellm/pull/53264)
- 修正一位呼叫者的錯誤憑證讓共用部署對其他所有呼叫者冷卻的問題 - [PR #53431](https://github.com/BerriAI/litellm/pull/53431)
- 修正最不忙碌群組上的並行 `/vertex_ai/*` 呼叫全部打到同一個部署的問題 - [PR #53588](https://github.com/BerriAI/litellm/pull/53588)
- 變更 `silent_model` 鏡像，用戶端不再能以中繼資料中的 `is_silent_experiment` 選擇退出 - [PR #52083](https://github.com/BerriAI/litellm/pull/52083)
- 變更未比對的 `content_policy_fallbacks` 改為像 `context_window_fallbacks` 一樣，改走其他備援 - [PR #52132](https://github.com/BerriAI/litellm/pull/52132)
- 改善自動路由器，在沒有觀察資料時跳過頻繁的復原查詢 - [PR #52523](https://github.com/BerriAI/litellm/pull/52523)

### 快取 {#caching}

- 新增從回應快取排除嵌入的選項 - [PR #52902](https://github.com/BerriAI/litellm/pull/52902)
- 修正快取命中為 `vertex_location: global` 的部署記錄 `us-central1` 的問題 - [PR #52150](https://github.com/BerriAI/litellm/pull/52150)
- 修正 `ssl: false` 與 `ssl_check_hostname` 一同設定時，非同步 Redis 呼叫失敗的問題 - [PR #52344](https://github.com/BerriAI/litellm/pull/52344)
- 修正使用 Redis 快取設定 `cache_params.default_redis_ttl` 時，代理程式啟動崩潰的問題 - [PR #52440](https://github.com/BerriAI/litellm/pull/52440)
- 修正快取查詢忽略 `Cache-Control` `no-cache` 與 `no-store` 請求標頭的問題 - [PR #52840](https://github.com/BerriAI/litellm/pull/52840)
- 修正含有大型 base64 圖片的快取 `responses` 呼叫重複成功記錄的問題 - [PR #52852](https://github.com/BerriAI/litellm/pull/52852)
- 修正 OpenTelemetry 追蹤阻止重複請求命中回應快取的問題 - [PR #52971](https://github.com/BerriAI/litellm/pull/52971)
- 修正重複快取的 Anthropic Responses SDK 呼叫出錯的問題 - [PR #53188](https://github.com/BerriAI/litellm/pull/53188)
- 修正快取命中變更工具呼叫完成時儲存的 `finish_reason` 的問題 - [PR #53236](https://github.com/BerriAI/litellm/pull/53236)
- 改善大型請求的快取鍵雜湊，並修正降低 `max_tokens` 時快取未命中的問題 - [PR #52267](https://github.com/BerriAI/litellm/pull/52267)

### 部署 {#deployment}

- 新增 Helm chart 中閘道 ConfigMap 的 `labels` 與 `annotations` - [PR #44061](https://github.com/BerriAI/litellm/pull/44061)
- 新增以 `--control-plane` 啟動的控制平面，以叢集用量與稽核記錄接收端管理資料平面 - [PR #49654](https://github.com/BerriAI/litellm/pull/49654)、[PR #49655](https://github.com/BerriAI/litellm/pull/49655)、[PR #49656](https://github.com/BerriAI/litellm/pull/49656)、[PR #49657](https://github.com/BerriAI/litellm/pull/49657)、[PR #49658](https://github.com/BerriAI/litellm/pull/49658)、[PR #49659](https://github.com/BerriAI/litellm/pull/49659)、[PR #49660](https://github.com/BerriAI/litellm/pull/49660)、[PR #49661](https://github.com/BerriAI/litellm/pull/49661)、[PR #49662](https://github.com/BerriAI/litellm/pull/49662)、[PR #51762](https://github.com/BerriAI/litellm/pull/51762)
- 新增 FIPS 140-3 代理程式 Docker 映像 - [PR #50330](https://github.com/BerriAI/litellm/pull/50330)
- 新增 `include_litellm_headers: false` 支援，可省略 `x-litellm-*` 回應標頭，先前會被忽略 - [PR #52949](https://github.com/BerriAI/litellm/pull/52949)
- 修正 Rust 閘道將 config.yaml 中的 `os.environ/` 參照以字面文字傳送的問題 - [PR #52025](https://github.com/BerriAI/litellm/pull/52025)
- 修正停用結構描述更新時，啟動結構描述漂移檢查從不回報漂移的問題 - [PR #52435](https://github.com/BerriAI/litellm/pull/52435)
- 修正唯讀根目錄上遷移成功後，Helm 遷移 Job 被 OOMKilled 的問題，自 v1.105.1 起損壞 - [PR #52460](https://github.com/BerriAI/litellm/pull/52460)
- 修正讀取複本重新連線逾時後，`/health/readiness` 與 `/key/info` 錯誤持續存在的問題 - [PR #52592](https://github.com/BerriAI/litellm/pull/52592)
- 修正 Postgres 拒絕連線時，緩慢失敗與延遲的就緒恢復問題 - [PR #52617](https://github.com/BerriAI/litellm/pull/52617)
- 修正 Docker 映像啟動後留下的殭屍 `node` 處理程序問題 - [PR #52642](https://github.com/BerriAI/litellm/pull/52642)
- 修正 Rust 閘道開啟超過設定上限的 Postgres 連線數的問題 - [PR #52729](https://github.com/BerriAI/litellm/pull/52729)
- 修正 Unix socket Postgres 上的代理程式無法啟動的問題，原因是遷移鎖定 URL 捨棄了 `host` 查詢參數，自 v1.108.0 起損壞 - [PR #52797](https://github.com/BerriAI/litellm/pull/52797)
- 修正 psycopg 無法載入 libpq 時，遷移工作崩潰的問題 - [PR #53146](https://github.com/BerriAI/litellm/pull/53146)
- 變更 `fips_mode` 以 FIPS 提供者的 AES-256-GCM 加密儲存的密鑰 - [PR #51429](https://github.com/BerriAI/litellm/pull/51429)
- 變更 Rust 閘道改為像 Python 代理程式一樣讀取設定值與 YAML - [PR #52023](https://github.com/BerriAI/litellm/pull/52023)
- 變更 `fips_mode` 在沒有至少 112 位元的 `LITELLM_SALT_KEY` 時拒絕啟動 - [PR #52099](https://github.com/BerriAI/litellm/pull/52099)
- 變更 FIPS 映像改為從 Chainguard apks 安裝 cryptography、grpcio 與 libpq，以支援 FIPS 模組 TLS - [PR #52997](https://github.com/BerriAI/litellm/pull/52997)

### 效能 {#performance}

- 新增主金鑰與虛擬金鑰的 `/v1/messages` 原生 Rust 閘道處理，包含 `models` 清單與上限 - [PR #52813](https://github.com/BerriAI/litellm/pull/52813)、[PR #52839](https://github.com/BerriAI/litellm/pull/52839)、[PR #53015](https://github.com/BerriAI/litellm/pull/53015)、[PR #53332](https://github.com/BerriAI/litellm/pull/53332)、[PR #53333](https://github.com/BerriAI/litellm/pull/53333)
- 改善長提示詞的請求速度，依 tokenizer 快取 token 計數 - [PR #51904](https://github.com/BerriAI/litellm/pull/51904)
- 改善與 OpenAI 相容的串流速度，每個區塊只解碼一次 - [PR #51905](https://github.com/BerriAI/litellm/pull/51905)
- 改善具有大型憑證表的代理程式上的設定重新載入，不再停滯請求 - [PR #52305](https://github.com/BerriAI/litellm/pull/52305)
- 改善記憶體用量，不再保留無人讀取的完整回應副本 - [PR #52524](https://github.com/BerriAI/litellm/pull/52524)
- 改善推論請求，快取應用程式定義查詢而非每次查詢 Postgres - [PR #52688](https://github.com/BerriAI/litellm/pull/52688)
- 改善大型路由器的路由延遲，只讀取每個請求候選部署的冷卻狀態 - [PR #52913](https://github.com/BerriAI/litellm/pull/52913)

## 文件更新 {#documentation-updates}

- 新增撰寫 v2 回呼的使用者指南 - [PR #52076](https://github.com/BerriAI/litellm/pull/52076)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

未發佈版本的迴歸修正、測試與 CI 變更、相依性升級與內部重構。

- 新增 gemini-3.1-pro-preview flex 層級成本追蹤案例 - [PR #47845](https://github.com/BerriAI/litellm/pull/47845)
- 新增 gpt-6.1-terra 的 tier 1 成本追蹤案例，並同步套件價格欄位 - [PR #49587](https://github.com/BerriAI/litellm/pull/49587)
- 以真實模型名稱作為團隊模型執行 codex，包含往返與壓縮 - [PR #49896](https://github.com/BerriAI/litellm/pull/49896)
- 以真實模型名稱在快速模式下執行 codex - [PR #49899](https://github.com/BerriAI/litellm/pull/49899)
- 清理路由、riva、最不忙碌、代理程式快取與提示詞範本輔助函式中的新技術債 - [PR #50192](https://github.com/BerriAI/litellm/pull/50192)
- 讓建構子 stub 可用於 mypy，並在 CI 中守護 - [PR #50354](https://github.com/BerriAI/litellm/pull/50354)
- 新增 azure gpt flex 服務層級成本追蹤案例 - [PR #50634](https://github.com/BerriAI/litellm/pull/50634)
- 為驗證快取鍵加上型別，並讓快取一律為原生 - [PR #51130](https://github.com/BerriAI/litellm/pull/51130)
- 將失效通道移至原生用戶端 - [PR #51135](https://github.com/BerriAI/litellm/pull/51135)
- 將 /litellm/rust 中的 zip 從 2.4.2 升級至 9.0.5 - [PR #51354](https://github.com/BerriAI/litellm/pull/51354)
- 在 Rust 核心中移植金鑰與 JWT 驗證 - [PR #51374](https://github.com/BerriAI/litellm/pull/51374)
- 將每個請求的未命中、結算與關閉排空追蹤從 Python 移至 Rust - [PR #51384](https://github.com/BerriAI/litellm/pull/51384)
- 將平行請求限制器 v3 移植為 rust 回呼 - [PR #51537](https://github.com/BerriAI/litellm/pull/51537)
- 以 rust 回呼取代 python 動態速率限制器 v3 - [PR #51540](https://github.com/BerriAI/litellm/pull/51540)
- 共用 Replicate HTTP 用戶端工廠，並宣告 PagerDuty 型別別名 - [PR #51594](https://github.com/BerriAI/litellm/pull/51594)
- 將非驗證寫入移出驗證快取 - [PR #51599](https://github.com/BerriAI/litellm/pull/51599)
- 新增壅塞觸發的優先佇列控制器 - [PR #51883](https://github.com/BerriAI/litellm/pull/51883)
- 移除速率限制器與 rust 串流中的新抑制，並為 perplexity 快取讀取加上型別 - [PR #51996](https://github.com/BerriAI/litellm/pull/51996)
- 移除設定載入已解析處的 os.environ/ 剝除 - [PR #52026](https://github.com/BerriAI/litellm/pull/52026)
- 移除已標示跳過的無用測試，並重寫 Redis 緩衝區排空測試 - [PR #52063](https://github.com/BerriAI/litellm/pull/52063)
- 更新四個過時的整合與 UI 測試以符合預期的行為變更 - [PR #52108](https://github.com/BerriAI/litellm/pull/52108)
- 在讀取重設列之前等待排程的重設提交 - [PR #52128](https://github.com/BerriAI/litellm/pull/52128)
- 支出記錄合約欄位與關閉時的原生沖洗 - [PR #52151](https://github.com/BerriAI/litellm/pull/52151)
- 在 rust agents.md 中新增 python 移植規則 - [PR #52154](https://github.com/BerriAI/litellm/pull/52154)
- 在 OTel v2 控制台測試中將關鍵 Langfuse 收集器主機列入允許清單 - [PR #52157](https://github.com/BerriAI/litellm/pull/52157)
- Rust 支出記錄列建構器 - [PR #52161](https://github.com/BerriAI/litellm/pull/52161)
- Rust 支出記錄帳本寫入器 - [PR #52163](https://github.com/BerriAI/litellm/pull/52163)
- 在 rust 中執行帳本的呼叫後支出計數步驟 - [PR #52166](https://github.com/BerriAI/litellm/pull/52166)
- 使用者、終端使用者與預算驗證物件的 Rust 儲存庫 - [PR #52170](https://github.com/BerriAI/litellm/pull/52170)
- 透過 rust 儲存庫讀取虛擬金鑰、jwt 金鑰對映與模型存取群組 - [PR #52173](https://github.com/BerriAI/litellm/pull/52173)
- 新增具型別的代理程式評估（#52143） - [PR #52174](https://github.com/BerriAI/litellm/pull/52174)
- 透過 rust 儲存庫讀取團隊、團隊成員與組織 - [PR #52176](https://github.com/BerriAI/litellm/pull/52176)
- 透過 rust 儲存庫讀取專案、標籤、存取群組與物件權限 - [PR #52178](https://github.com/BerriAI/litellm/pull/52178)
- Rust 支出記錄回呼 - [PR #52182](https://github.com/BerriAI/litellm/pull/52182)
- 只在篩選器有 beta 可篩選時才載入 anthropic beta 對映 - [PR #52188](https://github.com/BerriAI/litellm/pull/52188)
- 在斷線復原後精確比較 FOCUS RequesterDetails 別名 - [PR #52198](https://github.com/BerriAI/litellm/pull/52198)
- 預期模型路由上傳的批次別名列改寫為部署模型 - [PR #52199](https://github.com/BerriAI/litellm/pull/52199)
- 以離線模式執行自有的安全代理程式，讓 ECB 匯率查詢永不離開測試環境 - [PR #52202](https://github.com/BerriAI/litellm/pull/52202)
- 移除未使用的 MCP、UI 與管理 rust 路由 - [PR #52221](https://github.com/BerriAI/litellm/pull/52221)
- 在各自的 crate 中解析 Redis 與資料庫，並以 axum 狀態交給路由 - [PR #52222](https://github.com/BerriAI/litellm/pull/52222)
- 將代理程式的中介軟體移植至原生應用程式 - [PR #52223](https://github.com/BerriAI/litellm/pull/52223)
- 標示對帳自動化對照真實提供者計費的成本追蹤案例 - [PR #52226](https://github.com/BerriAI/litellm/pull/52226)
- 在啟動時驗證一次 LiteLLM 授權 - [PR #52227](https://github.com/BerriAI/litellm/pull/52227)
- 在兩種模式下提供同一個原生應用程式，以主金鑰呼叫者的 /v1/messages 在 Python 前方回應 - [PR #52229](https://github.com/BerriAI/litellm/pull/52229)
- 重用共用的工作階段 ID 讀取器，並移除新的重述註解 - [PR #52250](https://github.com/BerriAI/litellm/pull/52250)
- 在重播測試中使用有效的 base64 Gemini 簽章 fixture - [PR #52311](https://github.com/BerriAI/litellm/pull/52311)
- 將全域政策測試與共用的對等代理程式隔離 - [PR #52318](https://github.com/BerriAI/litellm/pull/52318)
- 停止要求 safeguards 呼叫等待 anthropic beta 對映 - [PR #52329](https://github.com/BerriAI/litellm/pull/52329)
- 忽略 picomatch GHSA-fc5q-39xc-vjpf，為期 7 天 - [PR #52337](https://github.com/BerriAI/litellm/pull/52337)
- 標示 anthropic 案例供成本追蹤對帳自動化使用 - [PR #52358](https://github.com/BerriAI/litellm/pull/52358)
- 在內部參數線路遍歷中涵蓋提示詞管理標記與 vispark - [PR #52363](https://github.com/BerriAI/litellm/pull/52363)
- 為 autorouter 基準 Prisma 用戶端提供測試環境的啟動預算 - [PR #52364](https://github.com/BerriAI/litellm/pull/52364)
- 透過 Redis 協調壅塞佇列 - [PR #52367](https://github.com/BerriAI/litellm/pull/52367)
- 預期代理程式現在為語音計費傳送的 sse stream_format - [PR #52392](https://github.com/BerriAI/litellm/pull/52392)
- 大型內文 400 使用者案例與混合路徑記憶體浸泡，用於逸出迴歸 - [PR #52404](https://github.com/BerriAI/litellm/pull/52404)
- 在 #47790 標頭修正後重新校準 overhead p50 上限 - [PR #52410](https://github.com/BerriAI/litellm/pull/52410)
- 在拒絕的請求記錄後快照記錄 - [PR #52422](https://github.com/BerriAI/litellm/pull/52422)
- 涵蓋 modify_params 下工具輪次的自適應思考 - [PR #52425](https://github.com/BerriAI/litellm/pull/52425)
- 以 rust 儲存庫假資料支援對映的 jwt 部署設定檔案例 - [PR #52442](https://github.com/BerriAI/litellm/pull/52442)
- 驗證 Projects 授權提示與頁面內容 - [PR #52454](https://github.com/BerriAI/litellm/pull/52454)
- 為 responses_2rps 提供專屬的 overhead p50 上限 - [PR #52459](https://github.com/BerriAI/litellm/pull/52459)
- 重大變更標記只要求有證據的破壞與 LLM 翻譯 PR 的即時證明 - [PR #52465](https://github.com/BerriAI/litellm/pull/52465)
- 依 Prisma 連線池拆分調整團隊刪除鎖定探測大小 - [PR #52481](https://github.com/BerriAI/litellm/pull/52481)
- 透過完成橋接保留單一物件輸入 - [PR #52483](https://github.com/BerriAI/litellm/pull/52483)
- 依 Prisma 連線池拆分調整並行首次 JWT 呼叫代理程式大小 - [PR #52486](https://github.com/BerriAI/litellm/pull/52486)
- 清理 2026-11-18 的新技術債 - [PR #52491](https://github.com/BerriAI/litellm/pull/52491)
- 將主機交給每次路由呼叫，而非保留在路由器上 - [PR #52509](https://github.com/BerriAI/litellm/pull/52509)
- 刪除無人呼叫的路由器程式碼 - [PR #52516](https://github.com/BerriAI/litellm/pull/52516)
- 依 rust 連線共用調整測試環境連線池大小，並停止路由器匯入代理程式 - [PR #52532](https://github.com/BerriAI/litellm/pull/52532)
- 轉發 SSE 區塊且不捨棄任何位元組 - [PR #52544](https://github.com/BerriAI/litellm/pull/52544)
- 停止在每個 PR 上執行根目錄項目上限檢查 - [PR #52579](https://github.com/BerriAI/litellm/pull/52579)
- 在 pull request 上執行核心單元、lint 與 smoke 工作，其餘工作在 main 上執行 - [PR #52582](https://github.com/BerriAI/litellm/pull/52582)
- 新增 gpt-6.2-sol、gpt-6.2-astra 與 azure_ai claude-opus-5-5 的 tier 1 成本追蹤案例 - [PR #52587](https://github.com/BerriAI/litellm/pull/52587)
- 將核心路由器單元工作拆為三個 - [PR #52594](https://github.com/BerriAI/litellm/pull/52594)
- 為群組刪除鎖定測試提供兩個 Prisma 連線 - [PR #52607](https://github.com/BerriAI/litellm/pull/52607)
- 只在推送至 main 時執行 LiteLLM Rust DB，並涵蓋發佈線 PR - [PR #52609](https://github.com/BerriAI/litellm/pull/52609)
- 要求共用翻譯路由的全程即時 QA - [PR #52631](https://github.com/BerriAI/litellm/pull/52631)
- 在擷取前初始化 JSON 啟動資料庫 - [PR #52650](https://github.com/BerriAI/litellm/pull/52650)
- 依每個測試隔離種子名冊 - [PR #52652](https://github.com/BerriAI/litellm/pull/52652)
- 從成本對映表推導轉錄費用 - [PR #52653](https://github.com/BerriAI/litellm/pull/52653)
- 將 pull request 閘門壓縮至五分鐘內 - [PR #52660](https://github.com/BerriAI/litellm/pull/52660)
- 支出記錄期間支出總和的 Rust 儲存庫 - [PR #52661](https://github.com/BerriAI/litellm/pull/52661)
- 穩定不穩定的提示快取偵測器單元測試 - [PR #52671](https://github.com/BerriAI/litellm/pull/52671)
- 將 rust 連線池拒絕探測移至 FailFastPool 後方的 RefusalWatch - [PR #52675](https://github.com/BerriAI/litellm/pull/52675)
- 在 Rust 儲存庫假資料中種子備援預算 - [PR #52685](https://github.com/BerriAI/litellm/pull/52685)
- 重新校準小型內文 Postgres 陳述式上限 - [PR #52686](https://github.com/BerriAI/litellm/pull/52686)
- 預期 #52599 留下過時的橋接系統提示詞在測試中作為輸入訊息 - [PR #52693](https://github.com/BerriAI/litellm/pull/52693)
- 預期系統提示詞為第一則 Responses 輸入訊息 - [PR #52697](https://github.com/BerriAI/litellm/pull/52697)
- 避免 regex 覆蓋耗盡遞迴 - [PR #52706](https://github.com/BerriAI/litellm/pull/52706)
- 跨 PR 推送重用 Rust 橋接建置，並重新整理 Cargo 快取 - [PR #52718](https://github.com/BerriAI/litellm/pull/52718)
- 拆分 core-router 與 core-auth-spend 分片 - [PR #52719](https://github.com/BerriAI/litellm/pull/52719)
- 在僅測試的 PR 上跳過 unit-core 分片 - [PR #52720](https://github.com/BerriAI/litellm/pull/52720)
- 為每次 Lakera 中斷爆發呼叫提供各自的提示詞 - [PR #52730](https://github.com/BerriAI/litellm/pull/52730)
- 整合 Pod CPU 期間，讓 cpu_seconds_per_request 不再低估 - [PR #52735](https://github.com/BerriAI/litellm/pull/52735)
- 在檢查前等待非同步上傳失敗報告 - [PR #52737](https://github.com/BerriAI/litellm/pull/52737)
- 在 usage-based-v2 RPM 呼叫前測試中固定時鐘 - [PR #52746](https://github.com/BerriAI/litellm/pull/52746)
- 升級 litellm-enterprise 0.1.86 -&gt; 0.1.87、litellm-proxy-extras 0.4.117 -&gt; 0.4.119、litellm 1.111.0 -&gt; 1.112.0 - [PR #52748](https://github.com/BerriAI/litellm/pull/52748)
- 在比較 TPM 序列前排空佇列的路由器會計 - [PR #52750](https://github.com/BerriAI/litellm/pull/52750)
- 在驗證 fixture 中使用正式快取 - [PR #52754](https://github.com/BerriAI/litellm/pull/52754)
- 透過 rust 儲存庫路由 jwt 佈建寫入 - [PR #52756](https://github.com/BerriAI/litellm/pull/52756)
- 依 Databricks DBU 費率為 databricks system.ai.gpt-6-2-astra 與 gpt-6-2-sol 定價 - [PR #52762](https://github.com/BerriAI/litellm/pull/52762)
- 在共用的線路 fixture 中比對儲存的請求 - [PR #52765](https://github.com/BerriAI/litellm/pull/52765)
- 透過 rust 儲存庫新增 jwt 團隊成員 - [PR #52766](https://github.com/BerriAI/litellm/pull/52766)
- 清除 365 個檔案中 1146 個 basedpyright Any 錯誤 - [PR #52768](https://github.com/BerriAI/litellm/pull/52768)
- 修復 main 完整執行中失敗的單元測試 - [PR #52769](https://github.com/BerriAI/litellm/pull/52769)
- 跨 PR 推送重用 Rust 橋接建置，並重新整理 Cargo 快取（#52718） - [PR #52770](https://github.com/BerriAI/litellm/pull/52770)
- 預期圖片用量中的快取欄位 - [PR #52777](https://github.com/BerriAI/litellm/pull/52777)
- 透過 rust 儲存庫插入稽核記錄 - [PR #52779](https://github.com/BerriAI/litellm/pull/52779)
- 在 rust 中新增 StandardLoggingPayload 型別 - [PR #52783](https://github.com/BerriAI/litellm/pull/52783)
- 預期 gemini 圖片編輯用量中的快取欄位 - [PR #52798](https://github.com/BerriAI/litellm/pull/52798)
- 清理提供者設定載入器與提示詞輔助函式中的新技術債 - [PR #52817](https://github.com/BerriAI/litellm/pull/52817)
- 從 config.yaml 下的 LITELLM_&lt;KEY&gt; 讀取環境支援的 litellm_settings 鍵 - [PR #52822](https://github.com/BerriAI/litellm/pull/52822)
- 將 Gemini Flash 別名從退役的 gemini-2.5-flash 移開 - [PR #52823](https://github.com/BerriAI/litellm/pull/52823)
- 在 JWT 快取主機呼叫中命名 keyspace - [PR #52830](https://github.com/BerriAI/litellm/pull/52830)
- 以具型別的鍵為每個驗證快取物件命名 - [PR #52831](https://github.com/BerriAI/litellm/pull/52831)
- 在請求型別上一次命名 Messages 內文欄位 - [PR #52836](https://github.com/BerriAI/litellm/pull/52836)
- 將 RoutingStrategy 與 RoutingGroupSpec 移出 router-core - [PR #52847](https://github.com/BerriAI/litellm/pull/52847)
- 將圖片用量中快取為 null 的 token 計數讀為 0 - [PR #52857](https://github.com/BerriAI/litellm/pull/52857)
- 以 complete_response 為空的 Invoke 串流回傳回應 - [PR #52862](https://github.com/BerriAI/litellm/pull/52862)
- 將未回應的 RSS 擷取回報為探測未完成，而非工作程序死亡 - [PR #52867](https://github.com/BerriAI/litellm/pull/52867)
- 新增 azure gpt-6.2-sol 與 Mantle gpt-6.2-sol、gpt-6.2-astra 及 gpt-6.1-terra 的 tier 1 成本追蹤案例 - [PR #52871](https://github.com/BerriAI/litellm/pull/52871)
- 對齊儲存的 Responses 橋接 fixture - [PR #52894](https://github.com/BerriAI/litellm/pull/52894)
- 在每日活動預期中包含快取與利潤欄位 - [PR #52897](https://github.com/BerriAI/litellm/pull/52897)
- 在圖片路由 fixture 中包含快取與 SVG 欄位 - [PR #52898](https://github.com/BerriAI/litellm/pull/52898)
- 在 gemini tpm/rpm 檢查中跳過 gemini/genie-4 - [PR #52900](https://github.com/BerriAI/litellm/pull/52900)
- 讓應用程式關聯預算遷移可重複執行 - [PR #52909](https://github.com/BerriAI/litellm/pull/52909)
- 在每個請求形狀上證明翻譯與成本修正 - [PR #52911](https://github.com/BerriAI/litellm/pull/52911)
- 在 pull request 觸及 proxy-extras 時執行 proxy-extras 測試 - [PR #52917](https://github.com/BerriAI/litellm/pull/52917)
- 重新產生提供者端點支援 - [PR #52918](https://github.com/BerriAI/litellm/pull/52918)
- 清除過時提供者檔案背後的兩個程式碼品質失敗 - [PR #52921](https://github.com/BerriAI/litellm/pull/52921)
- 移除 model hub 中未使用的 agentSnippets - [PR #52931](https://github.com/BerriAI/litellm/pull/52931)
- 移除合規提示詞中未使用的 getCategories - [PR #52932](https://github.com/BerriAI/litellm/pull/52932)
- 移除 model hub 元件中未使用的 EndpointField - [PR #52933](https://github.com/BerriAI/litellm/pull/52933)
- 移除未使用的回呼查詢輔助函式 - [PR #52934](https://github.com/BerriAI/litellm/pull/52934)
- 移除 MCP 工具中未使用的 validateToolDisplayName - [PR #52935](https://github.com/BerriAI/litellm/pull/52935)
- 在 re 快取逐出時保持線性掃描測試穩定 - [PR #52940](https://github.com/BerriAI/litellm/pull/52940)
- 在每日活動儲存庫黃金檔案中包含快取與利潤欄位 - [PR #52944](https://github.com/BerriAI/litellm/pull/52944)
- 在下一個備援測試前排空串流記錄 - [PR #52945](https://github.com/BerriAI/litellm/pull/52945)
- 在 Windows 上建置金鑰檔案版本 - [PR #52951](https://github.com/BerriAI/litellm/pull/52951)
- 在組織管理員支出記錄篩選器上記錄界限 - [PR #52961](https://github.com/BerriAI/litellm/pull/52961)
- 將 Claude Platform 參數移至 AwsParams 與 VertexParams 旁 - [PR #52966](https://github.com/BerriAI/litellm/pull/52966)
- 在 litellm-proxy sdist 中附上授權公開金鑰 - [PR #52970](https://github.com/BerriAI/litellm/pull/52970)
- 縮小 zh-CN 相關測試執行，並以英文撰寫測試 - [PR #52993](https://github.com/BerriAI/litellm/pull/52993)
- 從原生儲存區提供動態速率限制器的作用中團隊 - [PR #52995](https://github.com/BerriAI/litellm/pull/52995)
- 讓指令碼驗證與 Rust 路由對齊 - [PR #53001](https://github.com/BerriAI/litellm/pull/53001)
- 隔離原生備援冷卻狀態 - [PR #53002](https://github.com/BerriAI/litellm/pull/53002)
- 在每次推論呼叫周圍透過一個原生階段執行回呼 - [PR #53011](https://github.com/BerriAI/litellm/pull/53011)
- 預期客戶範圍中的軟性預算期間 - [PR #53017](https://github.com/BerriAI/litellm/pull/53017)
- 從排空的期間支出中移除僅 Redis 的欄位 - [PR #53022](https://github.com/BerriAI/litellm/pull/53022)
- 阻止反向代理程式緩衝 Rust SSE 串流 - [PR #53025](https://github.com/BerriAI/litellm/pull/53025)
- 像代理程式一樣，先讀取 api-key 標頭再讀取 x-api-key - [PR #53026](https://github.com/BerriAI/litellm/pull/53026)
- 新增 databricks-gemini-nano-banana-2-1 - [PR #53027](https://github.com/BerriAI/litellm/pull/53027)
- 修正四個不穩定的路由器與 s3 記錄單元測試 - [PR #53034](https://github.com/BerriAI/litellm/pull/53034)
- 不設期限等待 WebSocket 崩潰測試 - [PR #53035](https://github.com/BerriAI/litellm/pull/53035)
- 移除過去一天新增的旁白註解 - [PR #53053](https://github.com/BerriAI/litellm/pull/53053)
- 將客戶應用程式快取家族命名為 AuthObjects - [PR #53088](https://github.com/BerriAI/litellm/pull/53088)
- 移除 databricks-gemini-nano-banana-2-1，直到 Databricks 記錄該端點 - [PR #53108](https://github.com/BerriAI/litellm/pull/53108)
- 重新校準 Postgres 尖峰連線上限 - [PR #53121](https://github.com/BerriAI/litellm/pull/53121)
- 為 Together AI 語音重新產生提供者端點支援 - [PR #53124](https://github.com/BerriAI/litellm/pull/53124)
- 在預算重設測試中提供用量快取 - [PR #53128](https://github.com/BerriAI/litellm/pull/53128)
- 斷言兩個專案快取逐出金鑰 - [PR #53129](https://github.com/BerriAI/litellm/pull/53129)
- 將轉錄工作階段放在兩個工作程序上 - [PR #53141](https://github.com/BerriAI/litellm/pull/53141)
- 升級 litellm-enterprise 0.1.87 -&gt; 0.1.88、litellm-proxy-extras 0.4.119 -&gt; 0.4.120 - [PR #53143](https://github.com/BerriAI/litellm/pull/53143)
- 保留 Rust 儲存庫現在傳送的 JWT 對映插入 - [PR #53144](https://github.com/BerriAI/litellm/pull/53144)
- 從 typing_extensions 匯入 TypedDict，讓 Lens 代理程式測試在 Python 3.10 上通過 - [PR #53148](https://github.com/BerriAI/litellm/pull/53148) {/* keep-python-version */}
- 移除 Postgres 尖峰連線量測 - [PR #53154](https://github.com/BerriAI/litellm/pull/53154)
- 以寬鬆的用戶端 p50 上限，依回應時間與 CPU 為大型內文案例設限 - [PR #53155](https://github.com/BerriAI/litellm/pull/53155)
- 將狀態與掛鉤快取類別排除於金鑰家族檢查 - [PR #53157](https://github.com/BerriAI/litellm/pull/53157)
- 不將 Lens 自身的分析呼叫以追蹤形式傳回 Lens - [PR #53158](https://github.com/BerriAI/litellm/pull/53158)
- 移除已提交的 Lens 審查截圖 - [PR #53169](https://github.com/BerriAI/litellm/pull/53169)
- 阻止偽造的 Authorization 標頭在操作員 OAuth 部署上記錄零支出 - [PR #53170](https://github.com/BerriAI/litellm/pull/53170)
- 隔離匯出器的 Prometheus 計數器 - [PR #53172](https://github.com/BerriAI/litellm/pull/53172)
- 保持 Nova 嵌入 transform_response 為單純轉發器 - [PR #53183](https://github.com/BerriAI/litellm/pull/53183)
- 不使用實際時鐘延遲驗證串流逾時 - [PR #53189](https://github.com/BerriAI/litellm/pull/53189)
- 新增一致性表格，以及 messages 設定的單一版面、命名與順序 - [PR #53199](https://github.com/BerriAI/litellm/pull/53199)
- 將 messages 設定拆為四個部分，並以單一管線建置請求 - [PR #53203](https://github.com/BerriAI/litellm/pull/53203)
- 將 anthropic 家族設定寫為 anthropic 加上具名主機編輯 - [PR #53204](https://github.com/BerriAI/litellm/pull/53204)
- 等待事件而非一秒期限，以處理關閉的 socket 列 - [PR #53228](https://github.com/BerriAI/litellm/pull/53228)
- 從觀察到的報告證明未列出的上傳狀態不會重試 - [PR #53229](https://github.com/BerriAI/litellm/pull/53229)
- 為標籤更新假資料提供資料庫交易 - [PR #53230](https://github.com/BerriAI/litellm/pull/53230)
- 清除 main 上的程式碼品質失敗 - [PR #53237](https://github.com/BerriAI/litellm/pull/53237)
- 停止 Bedrock invoke 中斷測試假設每個截斷的串流都全額計費 - [PR #53239](https://github.com/BerriAI/litellm/pull/53239)
- 宣告 GPT-Live 與翻譯端點 - [PR #53277](https://github.com/BerriAI/litellm/pull/53277)
- 在 Rust 型錄中接受 Live 工作階段路由 - [PR #53279](https://github.com/BerriAI/litellm/pull/53279)
- 從驗證物件鍵家族下的驗證快取讀取預算期間 - [PR #53287](https://github.com/BerriAI/litellm/pull/53287)
- 為 reject_unregistered_guardrails 重新產生儀表板 API 型別 - [PR #53289](https://github.com/BerriAI/litellm/pull/53289)
- 計入帳本寫入器的保留量 - [PR #53293](https://github.com/BerriAI/litellm/pull/53293)
- 預期 CLI 登入重新導向 - [PR #53294](https://github.com/BerriAI/litellm/pull/53294)
- 為 pin 測試的 proxy_server stub 提供通用設定讀取器 - [PR #53295](https://github.com/BerriAI/litellm/pull/53295)
- 斷言帳本回呼計數，不受線路命令順序影響 - [PR #53317](https://github.com/BerriAI/litellm/pull/53317)
- 在大型上傳重寫測試中只量測上傳路徑配置 - [PR #53318](https://github.com/BerriAI/litellm/pull/53318)
- 在防護欄選擇退出測試中 stub realtime 簽署 - [PR #53319](https://github.com/BerriAI/litellm/pull/53319)
- 透過一個驅動程式提供推論路由，該驅動程式也會向路由器回報 - [PR #53324](https://github.com/BerriAI/litellm/pull/53324)
- 在 Rust 中塑造快取的虛擬金鑰，並透過單一 Python 路徑載入 - [PR #53325](https://github.com/BerriAI/litellm/pull/53325)
- 透過核心驗證並攜帶其呼叫者 - [PR #53342](https://github.com/BerriAI/litellm/pull/53342)
- 更新 rust 支出記錄寫入器留下過時的兩個支出測試 - [PR #53363](https://github.com/BerriAI/litellm/pull/53363)
- 移除 Lens 0.2.0 不再使用的 Lens 支出記錄接線 - [PR #53380](https://github.com/BerriAI/litellm/pull/53380)
- 在儀表板工作階段金鑰失效時停止 MCP 授權登入循環 - [PR #53383](https://github.com/BerriAI/litellm/pull/53383)
- 在內部參數聊天路由矩陣中涵蓋 ResetData - [PR #53398](https://github.com/BerriAI/litellm/pull/53398)
- 在 pull request 上重新執行快速 lint 檢查，不編譯 Rust - [PR #53421](https://github.com/BerriAI/litellm/pull/53421)
- 預期每個元件上只有記錄上傳路由退役 - [PR #53424](https://github.com/BerriAI/litellm/pull/53424)
- 將冷儲存輔助函式的支出記錄型別標示為 mapping - [PR #53430](https://github.com/BerriAI/litellm/pull/53430)
- 涵蓋記錄處理器，現已移除退役的追蹤處理器 - [PR #53433](https://github.com/BerriAI/litellm/pull/53433)
- 以 Mapping 為冷儲存輔助函式加上型別，讓 ruff 在 main 上通過 - [PR #53436](https://github.com/BerriAI/litellm/pull/53436)
- 阻止組織中具有每模型上限的金鑰建立回傳 500 - [PR #53447](https://github.com/BerriAI/litellm/pull/53447)
- 將 anthropic messages 純量輔助函式移至 python-compat - [PR #53456](https://github.com/BerriAI/litellm/pull/53456)
- 修正 Prometheus 已儲存憑證 401 儲存格中的競爭條件 - [PR #53460](https://github.com/BerriAI/litellm/pull/53460)
- 列出儀表板永不翻譯的詞彙 - [PR #53467](https://github.com/BerriAI/litellm/pull/53467)
- 在成本對映表中保留模型能力旗標 - [PR #53468](https://github.com/BerriAI/litellm/pull/53468)
- 從成本對映表規則中移除函式名稱 - [PR #53470](https://github.com/BerriAI/litellm/pull/53470)
- 在其餘支出計數器測試中，斷言帳本回呼計數，不受線路命令順序影響 - [PR #53471](https://github.com/BerriAI/litellm/pull/53471)
- 預期記錄上傳路由退役，且無金鑰的追蹤上傳回應 401 - [PR #53474](https://github.com/BerriAI/litellm/pull/53474)
- 將另外七個頁面移至版面框架 - [PR #53477](https://github.com/BerriAI/litellm/pull/53477)
- 遮罩每個測試的動詞，讓徵求防護欄無法遮蔽相鄰測試 - [PR #53479](https://github.com/BerriAI/litellm/pull/53479)
- 在編輯將 PR 的手寫說明重設為預留位置時還原該說明 - [PR #53486](https://github.com/BerriAI/litellm/pull/53486)
- 讓儀表板版面繪製頁面框架 - [PR #53496](https://github.com/BerriAI/litellm/pull/53496)
- 更新轉發路由的 OTLP 上傳測試與 API 型別 - [PR #53517](https://github.com/BerriAI/litellm/pull/53517)
- 為用量讀取可能落入的兩個分鐘種子 io token 計數器 - [PR #53518](https://github.com/BerriAI/litellm/pull/53518)
- 在傳送旁邊的請求前等待被保留的串流本身 - [PR #53519](https://github.com/BerriAI/litellm/pull/53519)
- 預設匯出 Claude Code 模型呼叫內文 - [PR #53520](https://github.com/BerriAI/litellm/pull/53520)
- 停止預設匯出 Claude Code 模型呼叫內文（#53520） - [PR #53529](https://github.com/BerriAI/litellm/pull/53529)
- 預期無金鑰的記錄上傳回應 401，如同無金鑰的追蹤上傳 - [PR #53530](https://github.com/BerriAI/litellm/pull/53530)
- 在預期新的團隊金鑰被拒絕前，等待團隊封鎖抵達對等代理程式 - [PR #53532](https://github.com/BerriAI/litellm/pull/53532)
- 將七個全高頁面移至版面框架 - [PR #53536](https://github.com/BerriAI/litellm/pull/53536)
- 在 UI 規格中比對更名的虛擬金鑰與管理員標籤 - [PR #53542](https://github.com/BerriAI/litellm/pull/53542)
- 預期建立金鑰團隊下拉選單中只有可建立金鑰的團隊 - [PR #53543](https://github.com/BerriAI/litellm/pull/53543)
- 比對 Skills Hub 搜尋預留位置 - [PR #53544](https://github.com/BerriAI/litellm/pull/53544)
- 預期管理頁面上的管理設定標題 - [PR #53545](https://github.com/BerriAI/litellm/pull/53545)
- 預期分頁上方頁面標頭中的模型重新整理動作 - [PR #53549](https://github.com/BerriAI/litellm/pull/53549)
- 移除新程式碼中的 slop 註解與字串 getattr - [PR #53552](https://github.com/BerriAI/litellm/pull/53552)
- 修正 GPT-Live 附加路由留下紅色的三個單元測試 - [PR #53574](https://github.com/BerriAI/litellm/pull/53574)
- 預期預算更新測試中的結轉防護 - [PR #53575](https://github.com/BerriAI/litellm/pull/53575)
- 在 68 個檔案中以已證明的型別取代 Unknown - [PR #53642](https://github.com/BerriAI/litellm/pull/53642)
- 為記錄器模組賦予單一職責，並依關注點拆分 - [PR #53690](https://github.com/BerriAI/litellm/pull/53690)
- 將密鑰遮蔽器移出追蹤 crate - [PR #53709](https://github.com/BerriAI/litellm/pull/53709)
- 在一處為 Rust 目標選擇 Python 記錄器 - [PR #53713](https://github.com/BerriAI/litellm/pull/53713)
- 移除未使用的 sink_layer 與記錄巨集重新匯出 - [PR #53739](https://github.com/BerriAI/litellm/pull/53739)
- 為新 dict 回傳加上型別，並移除團隊清單成員資格中的字串 getattr - [PR #53771](https://github.com/BerriAI/litellm/pull/53771)
- 在檢查前等待捨棄警告記錄 - [PR #53842](https://github.com/BerriAI/litellm/pull/53842)
- 預期 Vertex Gemini 聊天回應的預設服務層級 - [PR #53847](https://github.com/BerriAI/litellm/pull/53847)
- 為內部參數遍歷 Perplexity Orchestrator 聊天路由 - [PR #53856](https://github.com/BerriAI/litellm/pull/53856)
- 以外部簽署的區塊驅動思考簽章重試 - [PR #53874](https://github.com/BerriAI/litellm/pull/53874)
- 預期在內容前捨棄的 /v1/messages 嘗試沒有輸出 token - [PR #53885](https://github.com/BerriAI/litellm/pull/53885)
- 更新過時的整合與 e2e 預期以符合預期的變更 - [PR #53940](https://github.com/BerriAI/litellm/pull/53940)
- 在代理程式預先建立記錄物件時，依部署的自訂定價計費 - [PR #53994](https://github.com/BerriAI/litellm/pull/53994)
- 在非同步 cache_control 注入前轉換 Pydantic 訊息 - [PR #54055](https://github.com/BerriAI/litellm/pull/54055)
- 在 rc/1.112.0 上升級版本 - [PR #54114](https://github.com/BerriAI/litellm/pull/54114)
- 預期分頁列上的模型重新整理動作（rc/1.112.0） - [PR #54206](https://github.com/BerriAI/litellm/pull/54206)

### 依負責領域彙整 PR {#pr-roll-up-by-ownership-area}

依負責領域區分的 PR（總計：760）

- 其他：267
- 模型與提供者：146
- UI：76
- 效能：68
- LLM API 端點：59
- 支出 / 預算 / 速率限制：49
- 驗證與管理：45
- 記錄：24
- 防護欄：16
- MCP：9
- 文件：1

## 新貢獻者 {#new-contributors}

- [@abesticode](https://github.com/abesticode) 首次貢獻於 [PR #51014](https://github.com/BerriAI/litellm/pull/51014)
- [@ANAMASGARD](https://github.com/ANAMASGARD) 首次貢獻於 [PR #52520](https://github.com/BerriAI/litellm/pull/52520)
- [@Ayushshuklai](https://github.com/Ayushshuklai) 首次貢獻於 [PR #52295](https://github.com/BerriAI/litellm/pull/52295)
- [@bofenghuang](https://github.com/bofenghuang) 首次貢獻於 [PR #51611](https://github.com/BerriAI/litellm/pull/51611)
- [@drweber](https://github.com/drweber) 首次貢獻於 [PR #48373](https://github.com/BerriAI/litellm/pull/48373)
- [@DucNgn](https://github.com/DucNgn) 首次貢獻於 [PR #52359](https://github.com/BerriAI/litellm/pull/52359)
- [@edvinsq](https://github.com/edvinsq) 首次貢獻於 [PR #53038](https://github.com/BerriAI/litellm/pull/53038)
- [@ellisc42](https://github.com/ellisc42) 首次貢獻於 [PR #53416](https://github.com/BerriAI/litellm/pull/53416)
- [@izzybn](https://github.com/izzybn) 首次貢獻於 [PR #53418](https://github.com/BerriAI/litellm/pull/53418)
- [@kabooboo](https://github.com/kabooboo) 首次貢獻於 [PR #46222](https://github.com/BerriAI/litellm/pull/46222)
- [@kirosvi](https://github.com/kirosvi) 首次貢獻於 [PR #44061](https://github.com/BerriAI/litellm/pull/44061)
- [@minhtuan-ne](https://github.com/minhtuan-ne) 首次貢獻於 [PR #49260](https://github.com/BerriAI/litellm/pull/49260)
- [@nicolasmota](https://github.com/nicolasmota) 首次貢獻於 [PR #51457](https://github.com/BerriAI/litellm/pull/51457)
- [@omarboukherys](https://github.com/omarboukherys) 首次貢獻於 [PR #49682](https://github.com/BerriAI/litellm/pull/49682)
- [@owen-hj](https://github.com/owen-hj) 首次貢獻於 [PR #53406](https://github.com/BerriAI/litellm/pull/53406)
- [@pradeep-ramola](https://github.com/pradeep-ramola) 首次貢獻於 [PR #43501](https://github.com/BerriAI/litellm/pull/43501)
- [@rhea-tk](https://github.com/rhea-tk) 首次貢獻於 [PR #53407](https://github.com/BerriAI/litellm/pull/53407)
- [@Shanmukh-l33t](https://github.com/Shanmukh-l33t) 首次貢獻於 [PR #52840](https://github.com/BerriAI/litellm/pull/52840)
- [@stanley-zhou](https://github.com/stanley-zhou) 首次貢獻於 [PR #50020](https://github.com/BerriAI/litellm/pull/50020)
- [@TheRealKraken](https://github.com/TheRealKraken) 首次貢獻於 [PR #50819](https://github.com/BerriAI/litellm/pull/50819)
- [@ULLAS-7](https://github.com/ULLAS-7) 首次貢獻於 [PR #52852](https://github.com/BerriAI/litellm/pull/52852)
- [@vansh-one](https://github.com/vansh-one) 首次貢獻於 [PR #41192](https://github.com/BerriAI/litellm/pull/41192)
- [@vikashmaddi-sarvam](https://github.com/vikashmaddi-sarvam) 首次貢獻於 [PR #52012](https://github.com/BerriAI/litellm/pull/52012)
- [@xinglan163](https://github.com/xinglan163) 首次貢獻於 [PR #51720](https://github.com/BerriAI/litellm/pull/51720)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.111.0-rc.3...v1.112.0-rc.1
