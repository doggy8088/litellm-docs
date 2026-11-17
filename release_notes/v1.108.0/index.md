---
title: "LiteLLM v1.108.0 (LTS) 新增 Gemini 4 Argon、Microsoft 365 Copilot 與 OpenAI Live"
description: "新增 Gemini 4 Argon、Microsoft 365 Copilot、OpenAI Live 工作階段與共用的 Azure PTU 容量。計數路由會回傳提供者錯誤，而非估計值。"
slug: "v1-108-0"
date: 2026-11-04T03:35:33
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

:::tip

`v1.108.0` 是 1.108 LTS 線上的第一個版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

:::

:::info

`v1.108.0` 已由 `v1.107.0rc1` 晉升為穩定版。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.108.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.0
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.0`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.0) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

這些說明涵蓋自 [`v1.106.0`](/release_notes/v1.106.0/v1-106-0) 以來的所有內容。在 `v1.107.0-rc.1` 切版之後加入發佈線的變更，經 `v1.108.0-rc.1` 以及穩定版標籤前回移的修正，列於 [v1.107.0-rc.1 切版後納入的變更](#included-after-the-v11070-rc1-cut)

面向客戶的變更列在前面。測試、CI 與內部變更列在最後

:::danger Breaking Changes

這些提示涵蓋與上一個穩定版 `v1.106.0` 不同的面向使用者行為

**呼叫者無法使用的模型備援現在會被跳過。** `enforce_fallback_model_access` 預設為 `true`。設定 `general_settings.enforce_fallback_model_access: false` 可還原舊行為。請參閱 [PR #46127](https://github.com/BerriAI/litellm/pull/46127)

**當設定的記錄回呼無法載入時，proxy 不再啟動**，例如 `langfuse` SDK 版本不受支援時。請安裝受支援的版本或移除該回呼。請參閱 [PR #46378](https://github.com/BerriAI/litellm/pull/46378)

**OpenRouter 模型已不在內建成本對照表中。** 支出仍來自 OpenRouter 的 `usage.cost`，但 `litellm.get_model_info("openrouter/...")` 現在會擲出錯誤，因此請將您依賴的任何上下文視窗或價格設定在 `model_info` 中。請參閱 [PR #45665](https://github.com/BerriAI/litellm/pull/45665)、[PR #45666](https://github.com/BerriAI/litellm/pull/45666)、[PR #45667](https://github.com/BerriAI/litellm/pull/45667)、[PR #45668](https://github.com/BerriAI/litellm/pull/45668)、[PR #45669](https://github.com/BerriAI/litellm/pull/45669)

**`refusal` 已從 `provider_specific_fields` 移至 `message.refusal`**（位於聊天補全回應上）。請參閱 [PR #44788](https://github.com/BerriAI/litellm/pull/44788)

**當 proxy 計數路由無法使用提供者的計數時，現在會回傳錯誤。** 在此版本之前，這些路由會回傳 200 與本機 tiktoken 估計值。對某些模型而言，這個估計值與正確計數相差甚大。這些路由是 `/v1/messages/count_tokens`、`/v1/responses/input_tokens`、Google `:countTokens` 以及 `/utils/token_counter?call_endpoint=true`。每個錯誤都使用您所用 API 的錯誤格式。

若對提供者的計數呼叫失敗，路由會回傳提供者的狀態與訊息。沒有 API 金鑰的 OpenAI、Anthropic 或 Azure AI 部署會回傳 401 並指明缺少的金鑰。提供者計數 API 未涵蓋的模型會回傳 400 或 404，例如 Vertex AI 上的 GLM 與 Bedrock 上的 Amazon Nova。Claude Code 使用 `/v1/messages/count_tokens` 計算其上下文視窗。若您透過 proxy 使用 Claude Code，請在升級前先測試此路由。

若要為提供者無法計數的模型取得本機估計值，請在 `model_info` 中設定 `token_count_framing`。或者，設定 `token_count_model`，以提供者可以計數的模型來計數。沒有計數 API 的提供者，例如 Groq、Together AI、Fireworks AI、OpenRouter 與自行託管的 vLLM，會繼續使用本機計數。SDK 函式 `litellm.acount_tokens()` 也繼續使用本機計數。請參閱 [Token Counting](../../docs/count_tokens#proxy-errors-instead-of-local-estimates)、[PR #46121](https://github.com/BerriAI/litellm/pull/46121)、[PR #46815](https://github.com/BerriAI/litellm/pull/46815)、[PR #47163](https://github.com/BerriAI/litellm/pull/47163)、[PR #46777](https://github.com/BerriAI/litellm/pull/46777)、[PR #47209](https://github.com/BerriAI/litellm/pull/47209)

**Bedrock 防護欄對無法掃描的附件回傳 400**，例如 PDF、音訊或以 URL 傳送的圖片。設定 `skip_unscannable_attachments: true` 可讓它們通過。請參閱 [PR #43383](https://github.com/BerriAI/litellm/pull/43383)

**若您的 Helm values 啟用了 `lensWorker`，請在升級前將它移除，讓 chart 能正確算繪。** 我們正在重新調整 beta 功能與核心產品 LiteLLM 的協作方式。自此版本起，Helm charts 不再內含 Lens beta，而是透過 `lens` values 區塊連接到獨立部署的 Lens。請參閱 [Commit a979952](https://github.com/BerriAI/litellm/commit/a979952bb68363167aa30e512349197b618321de)

**proxy 拒絕之請求的失敗記錄只保留核心請求欄位。** 它們包含 `model`、`messages`、`input`、`prompt`、`user`、`stream`、`litellm_call_id`、`tags` 與防護欄詳細資訊。GCS 記錄器使用 proxy 上設定的 bucket 與憑證，而非請求時的 `gcs_bucket_name` 與 `gcs_path_service_account`。請參閱 [PR #48599](https://github.com/BerriAI/litellm/pull/48599)

:::

## 重點摘要 {#key-highlights}

- **新模型**：Gemini API 與 Vertex AI 上的 Gemini 4 Argon（可自動接續長回答）、Together AI、Fireworks AI 與 Baseten 上的 Meta Muse Spark Open、MiniMax H3 影片、xAI Grok Voice 3.0，以及 DashScope 上的 Wan 3.0 影片，共 237 個新目錄條目
- **新提供者**：Inference APIs、CoralBricks、ScaleDown 與 Microsoft 365 Copilot，以及代理程式閘道中的 Databricks Agent Platform 代理程式
- **OpenAI Live 與 SDK 3**：`/v1/live/sessions` 上的 OpenAI Live 工作階段，具備與 Realtime 相同的驗證、預算與支出記錄；LiteLLM 可與 OpenAI SDK 3 並存安裝；提示快取中斷點可在 gpt-5.6 上運作
- **共用的 Azure PTU 容量**：一個 Azure PTU 部署可跨團隊拆分，具備每團隊 token 上限、每日彙總中的固定成本分攤與 PTU 小時回報
- **管理與可觀測性**：Usage 上的 Errors 分頁、Settings 下可選擇啟用的遙測控制、GitHub Copilot 的每使用者 GitHub OAuth，以及 `disable_requester_ip_address_logging`，讓呼叫者 IP 不出現在支出記錄中
- **MCP 閘道**：閘道 token 端點上的 ID-JAG 授權，以及 DCR 橋接伺服器共用的閘道用戶端

## v1.107.0-rc.1 切版後納入的變更 {#included-after-the-v11070-rc1-cut}

### 新增模型 / 更新模型 {#new-models--updated-models}

- 將模型成本對照表與截至 2026 年 10 月 20 日的 `main` 同步，帶入下列目錄變更 - [Commit 99671dd](https://github.com/BerriAI/litellm/commit/99671ddcf82ba21349d5e11e9961fab82426a814)
- 當模型沒有模態費率時，以解析出的輸入費率計費 Gemini 音訊、影像與影片提示 tokens，讓 816k-token 的影片請求不再記錄 $0.118 而非約 $3.35 - [PR #47373](https://github.com/BerriAI/litellm/pull/47373)
- 依 Vertex 的 `billableCharacterCount` 按字元計費 `text-embedding-005` 與 `text-multilingual-embedding-002`，並以 `usage.prompt_tokens_details.character_count` 回傳 - [PR #47460](https://github.com/BerriAI/litellm/pull/47460)
- 在 `drop_params` 下丟棄 `gpt-6.1-sol` 拒絕的推理努力等級（例如 `none`），而非收到 OpenAI 400，適用於 OpenAI 與 Azure 的聊天與 `/v1/responses`，並修正對應的成本對照表旗標 - [PR #43935](https://github.com/BerriAI/litellm/pull/43935)
- 將 `together_ai/reflection/Beam-1.0-501B-A23B` 加入成本對照表，價格取自 Together models API - [PR #46964](https://github.com/BerriAI/litellm/pull/46964)
- 從 us-east-1 的 AWS offer index 回填 Bedrock 與 `bedrock_mantle/` 成本對照表資料列的 Priority 與 Batch 層級價格，不變更任何既有價格 - [PR #46987](https://github.com/BerriAI/litellm/pull/46987)
- 新增 `baseten/reflection/Beam-1.0` 與 `nebius/reflection/beam` 成本對照表資料列，讓 Baseten 與 Nebius 上的 Reflection Beam 1.0 不再以 $0 記錄 - [PR #46991](https://github.com/BerriAI/litellm/pull/46991)
- 在 Bedrock 的 `gpt-6-sol` 與 `gpt-6-luna` 資料列上設定 `supports_none_reasoning_effort`，與 OpenAI 提供者的資料列一致 - [PR #47000](https://github.com/BerriAI/litellm/pull/47000)
- 依 Copilot 定價表為 21 個 `github_copilot/` 模型定價，讓對它們的呼叫不再記錄 `spend = 0` - [PR #47085](https://github.com/BerriAI/litellm/pull/47085)
- 為三個 Azure AI Mistral 與四個 Vertex Gemini 資料列新增 `deprecation_date`，並新增 Perplexity `pplx-decider-v1.2` 與 `pplx-decider-flash-v1.2` 資料列及其 `-latest` 別名 - [PR #47114](https://github.com/BerriAI/litellm/pull/47114)
- 將 DeepInfra `DeepSeek-V4.1-Flash` 與 `DeepSeek-V4.1-Flash-1017` 加入成本對照表，讓它們的支出被追蹤而非記錄為 0 - [PR #47132](https://github.com/BerriAI/litellm/pull/47132)
- 為 12 個 Bedrock Llama 3.1 405B 與 Llama 3.2 資料列新增 2026-07-07 的 `deprecation_date` - [PR #47196](https://github.com/BerriAI/litellm/pull/47196)
- 依模型卡所述，將五個 Bedrock Claude Sonnet 4 資料列的 `max_input_tokens` 設為 200000 - [PR #47202](https://github.com/BerriAI/litellm/pull/47202)
- 依模型卡所述，將兩個 Bedrock Daybreak Mantle 資料列的 `max_input_tokens` 設為 1050000 - [PR #47211](https://github.com/BerriAI/litellm/pull/47211)
- 從 Bedrock 模型卡取得 Grok 4.7 與 Pegasus v1.5 的上下文限制，其中 `global.xai.grok-4.7` 與 `us.xai.grok-4.7` 為 524288 tokens - [PR #47226](https://github.com/BerriAI/litellm/pull/47226)
- 將 Baseten `DeepSeek-V4.1-Flash-1017` 與 `DeepSeek-V4.1-Flash-1017-Fast` 加入成本對照表，價格與上下文限制取自 Baseten 的 models API - [PR #47252](https://github.com/BerriAI/litellm/pull/47252)
- 將 `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash-1017` 加入成本對照表，含標準與 priority 價格及 1048576 token 的上下文視窗 - [PR #47253](https://github.com/BerriAI/litellm/pull/47253)
- 從 Copilot 定價表新增六個缺少的 `github_copilot/` 資料列，並補上 `github_copilot/claude-opus-4.8-fast` 的價格 - [PR #47254](https://github.com/BerriAI/litellm/pull/47254)
- 依模型卡所述，將兩個 Bedrock Qwen3 Coder 480B 資料列的 `max_input_tokens` 設為 262144 - [PR #47283](https://github.com/BerriAI/litellm/pull/47283)
- 將 `together_ai/deepseek-ai/DeepSeek-V4.1-Flash-1017` 加入成本對照表，輸入、輸出與快取輸入價格取自 Together models API - [PR #47291](https://github.com/BerriAI/litellm/pull/47291)
- 依 Azure OpenAI 定價頁所列，將 `azure/container` 程式碼解譯器工作階段定價為 0.033 USD 而非 0.03 - [PR #47292](https://github.com/BerriAI/litellm/pull/47292)
- 移除 `vertex_ai/gemini-3.8-flash` 與 `gemini-3.8-flash` 的 `deprecation_date`，因為 Google 只列出下限日期而非固定的淘汰日期 - [PR #47294](https://github.com/BerriAI/litellm/pull/47294)
- 將 `meta/muse-image-1.0` 加入成本對照表，每張生成影像 0.01 USD - [PR #47318](https://github.com/BerriAI/litellm/pull/47318)
- 將 Fireworks `deepseek-v4p1-flash-1017` 標記為支援函式呼叫與 tool choice，讓 `tools` 與 `tool_choice` 不再回傳 400 或在 `drop_params` 下被丟棄 - [PR #47326](https://github.com/BerriAI/litellm/pull/47326)
- 將 `fireworks_ai/accounts/fireworks/models/minimax-m3p1-flash` 加入成本對照表，含 priority 層級價格與 1M 上下文視窗 - [PR #47346](https://github.com/BerriAI/litellm/pull/47346)
- 為 `github_copilot/claude-opus-4.8` 新增 2026-11-16 的 `deprecation_date` - [PR #47370](https://github.com/BerriAI/litellm/pull/47370)
- 為 Fireworks `minimax-m3p1-flash` 新增標準輸入、輸出與快取輸入價格，讓沒有 `service_tier` 的請求不再記錄 0 支出 - [PR #47371](https://github.com/BerriAI/litellm/pull/47371)
- 將 `meta/sam-3.1` 加入成本對照表，影像分割價格為每張影像 0.0025 USD - [PR #47395](https://github.com/BerriAI/litellm/pull/47395)
- 移除 `vertex_ai/gemini-4-argon` 的下限 `deprecation_date`，因為 Google 未列出固定的淘汰日期 - [PR #47404](https://github.com/BerriAI/litellm/pull/47404)
- 移除 `vertex_ai/gemini-3.8-live` 的下限 `deprecation_date`，因為 Google 只給下限日期而非固定的淘汰日期 - [PR #47447](https://github.com/BerriAI/litellm/pull/47447)
- 為 Bedrock Writer Palmyra X4、Palmyra X5 與 TwelveLabs Pegasus v1.2 資料列新增模型 EOL 的 `deprecation_date` 值 - [PR #47462](https://github.com/BerriAI/litellm/pull/47462)
- 為 GitHub 在當日棄用的六個 `github_copilot` 資料列新增 2026-10-19 的 `deprecation_date` - [PR #47487](https://github.com/BerriAI/litellm/pull/47487)
- 為 `github_copilot/gpt-4.1` 與 `github_copilot/gpt-4.1-2025-04-14` 新增 2026-06-01 的 `deprecation_date` - [PR #47492](https://github.com/BerriAI/litellm/pull/47492)
- 為四個 Fireworks AI serverless 模型及其短鍵分身新增 2026-11-07 的 `deprecation_date` - [PR #47518](https://github.com/BerriAI/litellm/pull/47518)
- 新增 Volcengine `doubao-seed-2-1-pro-260915` 與 `doubao-seed-2-1-lite-260915` 資料列，以及未標日期的 `azure/eu/*` 與 `azure/us/*` Data Zone 資料列，讓這些模型計費而非 $0 - [PR #47561](https://github.com/BerriAI/litellm/pull/47561)
- 為 `fireworks_ai/glm-5p3-flash-us` 及其路由器分身新增 2026-11-07 的 `deprecation_date` - [PR #47591](https://github.com/BerriAI/litellm/pull/47591)
- 移除 `gemini-nano-banana-2.1` 與 `vertex_ai/gemini-nano-banana-2.1` 的 flex 價格 - [PR #47666](https://github.com/BerriAI/litellm/pull/47666)
- 以基礎 serverless 價格 1.5 倍新增 `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash-1017-us`，讓其請求不再以 $0 計費 - [PR #47667](https://github.com/BerriAI/litellm/pull/47667)

### LLM API 端點 {#llm-api-endpoints}

- 當 `/v1/messages` 請求帶有 `safeguards` 時加入 `dangerous-tool-use-2026-09-03` beta，讓透過 Azure AI Foundry Claude 部署的 Claude Code 自動模式不再收到 400 - [PR #43955](https://github.com/BerriAI/litellm/pull/43955)
- 在帶有 `safeguards` 的 Rust 路由 Anthropic `/v1/messages` 請求上加入 `dangerous-tool-use-2026-09-03` beta，而非回傳 400 `safeguards: Extra inputs are not permitted` - [PR #46102](https://github.com/BerriAI/litellm/pull/46102)
- 依模型的 `token_count_model.litellm_provider` 中繼資料直接在 Bedrock Runtime 或 Mantle 上計算 Bedrock tokens，讓 `/v1/messages/count_tokens` 不再以失敗的 Runtime 請求開頭 - [PR #47441](https://github.com/BerriAI/litellm/pull/47441)
- 將 `litellm.decisions` 欄位中的非 UTF-8 位元組以 base64 記錄，讓呼叫收到 400 而非原始的 `UnicodeDecodeError` - [PR #47564](https://github.com/BerriAI/litellm/pull/47564)
- 在 `/v1/chat/completions` 與 `/v1/messages` 上，將 `tool_config` 快取控制點套用為 Anthropic 最後一個工具上的中斷點，而非 400 或無聲丟棄該點 - [PR #47394](https://github.com/BerriAI/litellm/pull/47394)
- 將 `litellm_proxy/` 部署上的 `tool_config` 快取控制點轉送到下游 proxy，讓工具快取中斷點與快取命中恢復運作 - [PR #47570](https://github.com/BerriAI/litellm/pull/47570)

### 管理端點 / UI {#management-endpoints--ui}

- 在批次擷取與取消時授權團隊範圍模型的公開名稱，讓團隊金鑰不再對自己團隊的批次收到 403 - [PR #47067](https://github.com/BerriAI/litellm/pull/47067)

### AI 整合 {#ai-integrations}

- 在 `x-litellm-applied-guardrails`、支出記錄與 OTel 中只列出實際執行的請求管線步驟，而非請求政策提早停止時被跳過的步驟 - [PR #49262](https://github.com/BerriAI/litellm/pull/49262)
- 在 `x-litellm-applied-guardrails`、支出記錄與 OTel 中只列出實際執行的回應管線步驟，而非回應政策提早停止時被跳過的步驟 - [PR #49264](https://github.com/BerriAI/litellm/pull/49264)
- 在 `/v1/systemone` 與 `/v1/decisions` 上記錄呼叫者送出的完整請求（包含 `questions`），即使它被以 400 拒絕 - [PR #47183](https://github.com/BerriAI/litellm/pull/47183)
- 不再為 proxy 自行擲出的失敗標記提供者呼叫開始，讓 `litellm.preprocessing.duration_ms` 不再回報從未發生的提供者呼叫 - [PR #47456](https://github.com/BerriAI/litellm/pull/47456)
- 以固定欄位清單為 proxy 拒絕的請求建立失敗記錄，將 GCS 記錄器固定在其設定的 bucket，並丟棄呼叫者送出的 `standard_logging_guardrail_information` - [PR #48599](https://github.com/BerriAI/litellm/pull/48599)
- 為 proxy 拒絕的請求（例如呼叫前防護欄 400）在 `/metrics` 失敗指標上保留部署的 `model_id`，而非回報 `None` - [PR #49717](https://github.com/BerriAI/litellm/pull/49717)

### 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 當請求與價格資料重新載入競速時，保持 Bedrock 地理部署的定價，讓它們不再記錄 $0，重新載入也不再以 `dictionary changed size during iteration` 中止 - [PR #41523](https://github.com/BerriAI/litellm/pull/41523)
- 為模型清單為空的全失敗批次完成成本對帳，而非在 proxy 記錄中重複 `list index out of range` - [PR #47155](https://github.com/BerriAI/litellm/pull/47155)
- 當結果行有格式錯誤的回應封套時保留可復原的批次支出，並在最終寫入失敗時還原批次中繼資料 - [PR #47184](https://github.com/BerriAI/litellm/pull/47184)
- 以交替分頁檢查近期與較舊的未處理批次，讓舊的重試積壓不再阻擋較新批次的成本追蹤，並讓已完成批次在計費前保持可復原 - [PR #47190](https://github.com/BerriAI/litellm/pull/47190)
- 在套用自訂費率前先解析 Bedrock 推論設定檔定價，讓 Converse 設定檔呼叫不再記錄零支出，部分自訂價格也保留其他 token 費用 - [PR #47419](https://github.com/BerriAI/litellm/pull/47419)
- 為從提供者讀取逾時的請求，在其支出資料列上為估計的輸入 tokens 定價，而非記錄 `spend` 0 - [PR #47435](https://github.com/BerriAI/litellm/pull/47435)
- 在 `cancel_on_disconnect` 下，為呼叫者掛斷之請求的 499 支出資料列上的估計輸入 tokens 定價，而非記錄 0 - [PR #47436](https://github.com/BerriAI/litellm/pull/47436)
- 比照成功路徑，以部署自身的費率（Azure 別名則用其 `model_info.base_model`）為計費失敗資料列定價，而非成本對照表費率或 $0 - [PR #47437](https://github.com/BerriAI/litellm/pull/47437)
- 將 Vertex AI 區域端點的 1.1 倍加價套用到批次成本，讓區域批次支出不再被低估 10% - [PR #47466](https://github.com/BerriAI/litellm/pull/47466)
- 新增可選擇啟用的 `litellm_settings.apply_search_free_tier`，在成本對照表 `search_free_requests` 的免費額度內以 $0 記錄 Google Search grounding，讓支出與 Google 發票相符 - [PR #47494](https://github.com/BerriAI/litellm/pull/47494)
- 當部署模型的 `model_info.base_model` 不在成本對照表中時，以該模型的費率為計費失敗資料列定價，而非記錄 $0 - [PR #47568](https://github.com/BerriAI/litellm/pull/47568)
- 當用戶端中斷連線時，為串流 `/v1/responses` 或 Responses 路由 `/v1/messages` 請求的部分輸出計費，而非記錄無支出的 499 - [PR #47611](https://github.com/BerriAI/litellm/pull/47611)
- 在任何收費前發生暫時性會計失敗後，為已完成的批次重試成本對帳，讓該批次不再未計費 - [PR #47625](https://github.com/BerriAI/litellm/pull/47625)
- 為 Google Search 免費額度將 `search_free_requests` 加入模型價格結構描述 - [PR #47635](https://github.com/BerriAI/litellm/pull/47635)
- 在為支出定價時忽略呼叫者的 `base_model`，除非金鑰或團隊有 `allow_client_pricing_override`；並對 multipart `metadata` 中的孤立 surrogate 回傳 400，而非遺失其支出資料列 - [PR #47639](https://github.com/BerriAI/litellm/pull/47639)
- 按提供者分別計算 `apply_search_free_tier` 的 Google Search 免費額度，讓 Gemini API 與 Vertex AI grounding 各自保留自己的免費查詢 - [PR #47646](https://github.com/BerriAI/litellm/pull/47646)
- 比照成功資料列，以部署的 200k 以上輸入層級為計費失敗資料列定價，讓 246,717-token 的逾時提示不再只記錄約五分之一的成本 - [PR #47647](https://github.com/BerriAI/litellm/pull/47647)
- 以每次嘗試自身部署的模型費率，為先前逾時的重試嘗試定價，而非最終備援模型的費率 - [PR #47648](https://github.com/BerriAI/litellm/pull/47648)
- 只為 proxy 自身的用戶端中斷連線為 499 支出資料列定價，讓提供者自身的 499 或呼叫完成後的中斷不再額外計費 - [PR #47652](https://github.com/BerriAI/litellm/pull/47652)
- 保留路由器在提供者 `event: error` 後重試的 `/v1/messages` 串流支出記錄資料列，以提供服務的訊息 id 寫入一次，而非遺失或寫在失敗嘗試的 id 之下 - [PR #45136](https://github.com/BerriAI/litellm/pull/45136)
- 在 `model_map_information` 中回報計費所用的成本對照表條目，讓有自有 `input_cost_per_token` 的部署不再記錄目錄價格 - [PR #47182](https://github.com/BerriAI/litellm/pull/47182)
- 為每次計費的逾時重試嘗試各寫一筆支出資料列，鍵為 `<request_id>-attempt-<n>`，讓資料列總和與提供者發票相符，且每次嘗試都從金鑰、團隊與使用者支出中扣除 - [PR #47416](https://github.com/BerriAI/litellm/pull/47416)
- 在 `model_map_information` 中記錄 Azure PTU 溢出時計費所用的隨用隨付成本對照表條目，而非 PTU 的 `$0` 費率 - [PR #47567](https://github.com/BerriAI/litellm/pull/47567)
- 當 Postgres 重新啟動在寫入中途拆毀 Prisma 引擎時，重新排入支出記錄，讓批次不再被丟棄、支出不再被低報 - [PR #47571](https://github.com/BerriAI/litellm/pull/47571)
- 為沒有 `base_model` 的 Azure PTU 溢出請求，在 `model_map_information` 中記錄提供服務的模型及其隨用隨付費率，而非歸零的 PTU 費率 - [PR #47655](https://github.com/BerriAI/litellm/pull/47655)
- 將每次重試嘗試的支出資料列寫在其計費的部署之下，並讓這些資料列不計入每日請求與失敗請求數，讓一次失敗呼叫不再被算作三次 - [PR #47658](https://github.com/BerriAI/litellm/pull/47658)

### MCP 閘道 {#mcp-gateway}

- 比照 v1.103.0 之前，允許只送出上游 token 的呼叫者進入有 `delegate_auth_to_upstream` 的 MCP 伺服器，並將該 token 轉送上游，而非回傳 401 - [PR #48939](https://github.com/BerriAI/litellm/pull/48939)

### 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- 在 `litellm_params` 上新增 `timeout_by_service_tier` 與 `stream_timeout_by_service_tier`，讓部署可為 `flex` 請求給予比其標準 `timeout` 更長的逾時 - [PR #47406](https://github.com/BerriAI/litellm/pull/47406)
- 先透過 `model_info.base_model` 為 `cost-based-routing` 部署定價，讓有自訂名稱的 Azure 部署不再以未對應的預設值評分而被跳過 - [PR #47617](https://github.com/BerriAI/litellm/pull/47617)
- 讓快取的驗證資料保持最新，並在 proxy 的記憶體內與 Redis 快取間正確套用支出更新 - [Commit 5352ed9](https://github.com/BerriAI/litellm/commit/5352ed94fb80dfcaae70d60876c082ed3e4d4df2)
- 只為聊天補全橋接讀回的 Responses 輪次立即排清支出記錄佇列，讓原生 OpenAI 與 Azure `/v1/responses` 流量不再迫使每個請求都排清 - [PR #47614](https://github.com/BerriAI/litellm/pull/47614)
- 為落後的套件以 `main` 的版本重新推導 `uv.lock` - [Commit 8521ea1](https://github.com/BerriAI/litellm/commit/8521ea164c38e4fa19d89a7b48d0b1a1ec4cf807)
- 將 1.108 的相依性版本與 `main` 對齊 - [Commit 9f2570e](https://github.com/BerriAI/litellm/commit/9f2570e0d182547300be51a0769a33b9f5087c12)
- 將 `ddtrace` 更新至 4.15.6 - [Commit ca46168](https://github.com/BerriAI/litellm/commit/ca461683b6bfdf757ea6d15bd8ead4a27754553d)
- 更新 `pillow` 與儀表板的 `vite` - [PR #47678](https://github.com/BerriAI/litellm/pull/47678)
- 更新包含 OpenTelemetry SDK 在內的 Python 相依性，並讓 OTLP JSON 匯出、AgentOps 驗證與 FastAPI 檢測在新版本下保持運作 - [PR #48055](https://github.com/BerriAI/litellm/pull/48055)
- 更新 `mlflow`、`pypdf` 與 `setuptools` - [PR #48110](https://github.com/BerriAI/litellm/pull/48110)
- 將 `webpki-roots` 與 `webpki-root-certs` 更新至 1.0.11 - [PR #48301](https://github.com/BerriAI/litellm/pull/48301)
- 將 Lens beta 移出兩個 Helm charts，它們現在透過僅連線的 `lens` 區塊連接到獨立部署的 Lens - [Commit a979952](https://github.com/BerriAI/litellm/commit/a979952bb68363167aa30e512349197b618321de)
- 更新 `certifi`、Rust 信任根與 Docker CA 套件以移除被撤銷的 `emSign ECC Root CA - G3`，並為 Prisma 在 Docker 執行階段保留 `libssl3` - [PR #47670](https://github.com/BerriAI/litellm/pull/47670)
- 將 `grpcio` 更新至 1.84.1、`boto3` 更新至 1.43.117，讓其隨附的 CA 檔案拒絕被撤銷的 eMudhra 根憑證，並在映像建置器中安裝 `libssl3` 讓 Prisma 引擎能啟動 - [PR #47969](https://github.com/BerriAI/litellm/pull/47969)
- 更新 Docker 映像隨附 LiteAdmin 環境中的 CA 根憑證與 `aiohttp`，讓它不再信任被撤銷的 `emSign ECC Root CA - G3` - [PR #48139](https://github.com/BerriAI/litellm/pull/48139)
- 刷新 Docker 基礎映像，元件映像只隨附執行階段檔案 - [PR #48279](https://github.com/BerriAI/litellm/pull/48279)

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（4 個新提供者）{#new-providers-4-new-providers} {#new-providers-4-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Inference APIs | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `inferenceapis/` 下的 OpenAI 相容提供者，讀取 `INFERENCEAPIS_API_KEY` |
| CoralBricks | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `coralbricks/` 下的 OpenAI 相容提供者，讀取 `CORALBRICKS_API_KEY` |
| ScaleDown | `/v1/chat/completions` | `scaledown/` 下的原生 classify、extract、summarize、decisions 與 compress 操作 |
| Microsoft 365 Copilot | `/v1/chat/completions` | `microsoft_365_copilot/` 下的 Graph Copilot Chat，將呼叫者的 JWT 交換為委派的 Entra token |

### 新 LLM API 端點（1 個新端點）{#new-llm-api-endpoints-1-new-endpoint} {#new-llm-api-endpoints-1-new-endpoint}

| 端點 | 方法 | 說明 |
| --- | --- | --- |
| `/v1/live/sessions` | WebSocket | OpenAI Live 工作階段，也可在 `/live/sessions` 與 `/openai/v1/live/sessions` 使用，依 `usage.seconds` 計費 |

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做的事 |
| --- | --- | --- |
| Databricks Agent Platform | `/a2a/<agent>`, agent gateway | 以 PAT 或 OAuth M2M 驗證呼叫 Model Serving 代理程式端點與 Databricks Apps 代理程式 |
| DashScope, Qwen Cloud, Qwen AI Platform | `/v1/videos` | Wan 3.0、Wan 2.7 與 HappyHorse 影片生成 |
| MiniMax | `/v1/videos` | MiniMax-H3 與 H3-Max 影片生成 |

## 新增模型 / 更新模型 {#new-models--updated-models-1}

#### 新模型支援（237 個新模型）{#new-model-support-237-new-models} {#new-model-support-237-new-models}

這些數字代表與 `v1.106.0` 相比新增的目錄識別碼，包含別名與區域變體。價格為本版本隨附的值（以 USD 計），執行階段重新載入定價對照表時可更新。496 個 `openrouter` 資料列與 11 個已淘汰的 `github_copilot` 資料列已被移除，請參閱上方的重大變更

<details>
<summary>全部 237 個新目錄條目</summary>

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens）| 輸出（$/1M tokens）| 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `amazon.nova-premier-v1:0` | 1,000,000 | $2.5 | $12.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `jp.amazon.nova-2-lite-v1:0` | 1,000,000 | $0.396 | $3.311 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；影片輸入 |
| Amazon Bedrock | `twelvelabs.pegasus-1-5-v1:0` | 261,120 | - | $7.5 | 聊天；影片輸入 |
| Amazon Bedrock | `us.stability.stable-conservative-upscale-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.4 |
| Amazon Bedrock | `us.stability.stable-creative-upscale-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.6 |
| Amazon Bedrock | `us.stability.stable-fast-upscale-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.03 |
| Amazon Bedrock | `us.stability.stable-image-control-sketch-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-control-structure-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-erase-object-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-inpaint-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-remove-background-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-search-recolor-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-search-replace-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-image-style-guide-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.07 |
| Amazon Bedrock | `us.stability.stable-outpaint-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.06 |
| Amazon Bedrock | `us.stability.stable-style-transfer-v1:0` | 77 | - | - | 影像編輯；`output_cost_per_image`: $0.08 |
| Azure | `azure/eu/gpt-4o` | 128,000 | $2.75 | $11 | 聊天；視覺；工具呼叫；結構化輸出 |
| Azure | `azure/eu/gpt-4o-mini` | 128,000 | $0.165 | $0.66 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/eu/o1` | 200,000 | $16.5 | $66 | 聊天；視覺；工具呼叫；提示快取 |
| Azure | `azure/eu/o3` | 200,000 | $2.2 | $8.8 | 聊天 |
| Azure | `azure/eu/o3-mini` | 200,000 | $1.21 | $4.84 | 聊天；推理；提示快取 |
| Azure | `azure/eu/o4-mini` | 200,000 | $1.21 | $4.84 | 聊天 |
| Azure | `azure/us/gpt-4o` | 128,000 | $2.75 | $11 | 聊天；視覺；工具呼叫；結構化輸出 |
| Azure | `azure/us/gpt-4o-mini` | 128,000 | $0.165 | $0.66 | 聊天；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us/o1` | 200,000 | $16.5 | $66 | 聊天；視覺；工具呼叫；提示快取 |
| Azure | `azure/us/o3` | 200,000 | $2.2 | $8.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/us/o3-mini` | 200,000 | $1.21 | $4.84 | 聊天；推理；提示快取 |
| Azure | `azure/us/o4-mini` | 200,000 | $1.21 | $4.84 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/claude-opus-5-5-fast` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/Cohere-Embed-V5-Fast` | 128,000 | $0.08 | $0 | 嵌入 |
| Azure AI | `azure_ai/Cohere-Embed-V5-Pro` | 128,000 | $0.12 | $0 | 嵌入 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4.1-Flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4.1-Flash-1017-Fast` | 1,048,576 | $0.6 | $2.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/meta-models/muse-spark-open` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入 |
| Baseten | `baseten/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B` | 1,048,576 | $0.2 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/reflection/Beam-1.0` | 1,048,576 | $1.3 | $4.3 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ChatGPT | `chatgpt/gpt-rosalind-discovery` | - | - | - | 回應 |
| Cloudflare | `cloudflare/@cf/cloudflare/clairic` | 65,536 | $0.1 | $0 | 擷取；視覺 |
| Cloudflare | `cloudflare/clairic` | 65,536 | $0.1 | $0 | 擷取；視覺 |
| Coralbricks | `coralbricks/deepseek-v4.1-flash` | 1,048,576 | $0.01 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Coralbricks | `coralbricks/deepseek-v4.1-flash-fast` | 1,048,576 | $0.01 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Coralbricks | `coralbricks/deepseek-v4.1-flash-fast-fp4` | 1,048,576 | $0.01 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Coralbricks | `coralbricks/glm-5.3` | 1,048,576 | $1.12 | $4.4 | 聊天；推理；工具呼叫；提示快取 |
| Coralbricks | `coralbricks/glm-5.3-fast` | 1,048,576 | $1.12 | $4.4 | 聊天；推理；工具呼叫；提示快取 |
| Coralbricks | `coralbricks/glm-5.3-fp4` | 1,048,576 | $1.12 | $4.4 | 聊天；推理；工具呼叫；提示快取 |
| DashScope | `dashscope/happyhorse-1.0-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| DashScope | `dashscope/happyhorse-1.0-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| DashScope | `dashscope/happyhorse-1.0-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| DashScope | `dashscope/happyhorse-1.1-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| DashScope | `dashscope/happyhorse-1.1-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| DashScope | `dashscope/happyhorse-1.1-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| DashScope | `dashscope/wan2.7-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| DashScope | `dashscope/wan2.7-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| DashScope | `dashscope/wan2.7-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| DashScope | `dashscope/wan3.0-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.165025 |
| DashScope | `dashscope/wan3.0-video-prime` | - | - | - | 影片生成；`output_cost_per_second`: $0.254399 |
| Databricks | `databricks/ai_decide` | - | $0 | $0 | 評估 |
| Databricks | `databricks/system.ai.deepseek-v4-flash-0731` | - | - | - | 聊天 |
| Databricks | `databricks/system.ai.kimi-k3` | - | - | - | 聊天 |
| Deepinfra | `deepinfra/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.14 | $0.42 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Deepinfra | `deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017` | 1,048,576 | $0.14 | $0.42 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Deepseek | `deepseek/search` | - | - | - | 搜尋；`input_cost_per_query`: $0.00075 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash-1017-us` | 1,048,576 | $0.45 | $1.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/minimax-m3p1-flash` | 1,048,576 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/muse-spark-open` | 1,048,576 | $1.25 | $4.25 | 聊天；視覺；工具呼叫 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/rune` | 262,144 | $0.042 | $0 | 評估 |
| Gemini | `gemini/gemini-4-argon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入；網頁搜尋 |
| GitHub Copilot | `github_copilot/claude-fable-5` | 200,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-fable-5.1` | 200,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-haiku-5.5` | 128,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-opus-4.8` | 200,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-opus-4.8-fast` | 200,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-opus-5` | 200,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-opus-5.5` | 200,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-sonnet-4.6` | 200,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-sonnet-5` | 200,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/claude-sonnet-5.5` | 200,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gemini-3.7-flash` | 200,000 | $0.75 | $3.75 | 聊天；推理；視覺；工具呼叫 |
| GitHub Copilot | `github_copilot/gemini-3.8-flash` | 200,000 | $0.75 | $3.75 | 聊天；推理；視覺；工具呼叫 |
| GitHub Copilot | `github_copilot/gemini-4-argon` | 200,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫 |
| GitHub Copilot | `github_copilot/gpt-5.4` | 272,000 | $2.5 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.4-mini` | 272,000 | $0.75 | $4.5 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.4-nano` | 272,000 | $0.2 | $1.25 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.5` | 272,000 | $5 | $30 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.6-luna` | 200,000 | $0.2 | $1.2 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.6-sol` | 272,000 | $4 | $20 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-5.6-terra` | 272,000 | $2 | $12 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6-astra` | 272,000 | $10 | $50 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6-luna` | 272,000 | $0.1 | $0.5 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6-sol` | 272,000 | $2 | $10 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6.1-sol` | 272,000 | $2 | $10 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/grok-4.5` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/grok-4.6` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/grok-4.7` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/kimi-k3` | 917,504 | $3 | $15 | 聊天；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/mai-code-1.1-flash` | 128,000 | $0.2 | $1.2 | 回應；視覺；工具呼叫；結構化輸出 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V3` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V4-Flash` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V4-Flash-0731` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V4-Pro` | 1,048,576 | $1.72 | $5.15 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V4-Pro-0813` | 1,048,576 | $1.72 | $5.15 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.4 | $1.6 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-chat` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-flash` | 1,048,576 | $0.4 | $1.6 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-reasoner` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-v3` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-v4-flash` | 1,048,576 | $0.19 | $0.38 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-v4-pro` | 1,048,576 | $1.72 | $5.15 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/deepseek-v4.1-flash` | 1,048,576 | $0.4 | $1.6 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/glm-5.3` | 1,048,575 | $1.82 | $5.72 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/glm-5.3-flash` | 1,048,575 | $0.2 | $0.66 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/gpt-oss-120b` | 131,072 | $0.2 | $0.8 | 聊天；推理；工具呼叫 |
| Inferenceapis | `inferenceapis/gpt-oss-20b` | 131,072 | $0.04 | $0.19 | 聊天；推理；工具呼叫 |
| Inferenceapis | `inferenceapis/kimi-k2.7-code` | 262,144 | $0.89 | $4.42 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/llama-3.1-8b-instant` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/llama-3.3-70b` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/llama-3.3-70b-instruct` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/llama-3.3-70b-versatile` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/meta-llama/Llama-3.3-70B-Instruct` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/meta-llama/Llama-3.3-70B-Instruct-Turbo` | 131,072 | $0.2 | $0.5 | 聊天；工具呼叫 |
| Inferenceapis | `inferenceapis/minimax-m3` | 524,288 | $0.39 | $1.56 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/MiniMaxAI/MiniMax-M3` | 524,288 | $0.39 | $1.56 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/moonshotai/Kimi-K2.7-Code` | 262,144 | $0.89 | $4.42 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/openai/gpt-oss-120b` | 131,072 | $0.2 | $0.8 | 聊天；推理；工具呼叫 |
| Inferenceapis | `inferenceapis/openai/gpt-oss-20b` | 131,072 | $0.04 | $0.19 | 聊天；推理；工具呼叫 |
| Inferenceapis | `inferenceapis/Qwen/Qwen3-VL-235B-A22B-Instruct` | 262,144 | $0.26 | $1.15 | 聊天；視覺；工具呼叫 |
| Inferenceapis | `inferenceapis/Qwen/Qwen3.8-Flash` | 1,000,000 | $0.15 | $0.5 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/qwen3-vl` | 262,144 | $0.26 | $1.15 | 聊天；視覺；工具呼叫 |
| Inferenceapis | `inferenceapis/qwen3-vl-235b` | 262,144 | $0.26 | $1.15 | 聊天；視覺；工具呼叫 |
| Inferenceapis | `inferenceapis/qwen3.8-flash` | 1,000,000 | $0.15 | $0.5 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/zai-org/GLM-5.3` | 1,048,575 | $1.82 | $5.72 | 聊天；推理；工具呼叫；提示快取 |
| Inferenceapis | `inferenceapis/zai-org/GLM-5.3-Flash` | 1,048,575 | $0.2 | $0.66 | 聊天；推理；工具呼叫；提示快取 |
| Meta | `meta/muse-image-1.0` | - | - | - | 影像生成；`output_cost_per_image`: $0.01 |
| Meta | `meta/muse-wonder-1.0` | 1,048,576 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| Meta | `meta/sam-3.1` | - | - | - | 回應；`input_cost_per_image`: $0.0025 |
| Microsoft 365 Copilot | `microsoft_365_copilot/chat` | - | $0 | $0 | 聊天 |
| Minimax | `minimax/MiniMax-H3` | - | - | - | 影片生成；`output_cost_per_second`: $0.08；`input_cost_per_image`: $0.04 |
| Minimax | `minimax/MiniMax-H3-Max` | - | - | - | 影片生成；`output_cost_per_second`: $0.08；`input_cost_per_image`: $0.074 |
| Nace | `nace/drex-latest` | 131,072 | $0.06 | $0 | 評估 |
| Nace | `nace/drex-v1.0` | 32,768 | $0.04 | $0 | 評估 |
| Nace | `nace/drex-v1.5` | 131,072 | $0.05 | $0 | 評估 |
| Nace | `nace/drex-v2.0` | 131,072 | $0.06 | $0 | 評估 |
| Nebius | `nebius/reflection/beam` | 1,048,576 | $0.25 | $1 | 聊天；推理；工具呼叫 |
| Oci | `oci/openai.gpt-oss-120b` | 128,000 | $0.15 | $0.6 | 聊天；推理；工具呼叫 |
| Oci | `oci/openai.gpt-oss-20b` | 128,000 | $0.07 | $0.3 | 聊天；推理；工具呼叫 |
| Oci | `oci/xai.grok-4.20-0309-non-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；工具呼叫 |
| Oci | `oci/xai.grok-4.20-0309-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；工具呼叫 |
| Oci | `oci/xai.grok-4.20-non-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；工具呼叫 |
| Oci | `oci/xai.grok-4.20-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；工具呼叫 |
| OpenAI | `computer-use-preview-2025-03-11` | 8,192 | $3 | $12 | 聊天；推理；視覺；工具呼叫；PDF 輸入 |
| OpenAI | `gpt-4o-mini-search-preview-2025-03-11` | 128,000 | $0.15 | $0.6 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenAI | `gpt-4o-search-preview-2025-03-11` | 128,000 | $2.5 | $10 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenAI | `gpt-5.5-cyber-preview` | - | $12.5 | $75 | 聊天；推理 |
| OpenAI | `gpt-audio-mini-2025-10-06` | 128,000 | $0.6 | $2.4 | 聊天；工具呼叫；音訊輸入；`input_cost_per_audio_token`: $0.00001；`output_cost_per_audio_token`: $0.00002 |
| OpenAI | `gpt-rosalind-discovery` | - | $5 | $25 | 聊天 |
| OpenAI | `o3-deep-research-2025-06-26` | 200,000 | $10 | $40 | 回應；推理；視覺；提示快取；PDF 輸入 |
| OpenAI | `o4-mini-deep-research-2025-06-26` | 200,000 | $2 | $8 | 回應；推理；視覺；提示快取；PDF 輸入 |
| Openinfer | `openinfer/@oi/GLM-5.3-Flash` | 393,216 | $0.195 | $1.56 | 聊天；推理；工具呼叫 |
| Openinfer | `openinfer/@oi/Qwen3.5-27B` | 32,768 | $0.195 | $1.56 | 聊天；推理；工具呼叫 |
| Openinfer | `openinfer/@oi/Qwen3.5-9B` | 100,000 | $5 | $0.15 | 聊天；推理；工具呼叫 |
| Perplexity | `perplexity/openai/gpt-5-nano` | - | $0.05 | $0.4 | 回應 |
| Perplexity | `perplexity/openai/gpt-5.3-codex` | - | $3.5 | $28 | 回應 |
| Perplexity | `perplexity/openai/gpt-6-astra` | - | $10 | $50 | 回應 |
| Perplexity | `perplexity/perplexity/deepseek-v4-pro-0813` | - | $1.32 | $3.96 | 回應 |
| Perplexity | `perplexity/pplx-decider-flash-latest` | 262,144 | $0.01 | $0 | 評估 |
| Perplexity | `perplexity/pplx-decider-flash-v1.2` | 262,144 | $0.01 | $0 | 評估 |
| Perplexity | `perplexity/pplx-decider-latest` | 262,144 | $0.02 | $0 | 評估 |
| Perplexity | `perplexity/pplx-decider-v1.1-27b` | 262,144 | $0.02 | $0 | 評估 |
| Perplexity | `perplexity/pplx-decider-v1.2` | 262,144 | $0.02 | $0 | 評估 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.0-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.0-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.0-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.220034 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.1-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.1-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| Qwen Ai Platform | `qwen_ai_platform/happyhorse-1.1-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.165026 |
| Qwen Ai Platform | `qwen_ai_platform/wan2.7-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| Qwen Ai Platform | `qwen_ai_platform/wan2.7-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| Qwen Ai Platform | `qwen_ai_platform/wan2.7-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.143353 |
| Qwen Ai Platform | `qwen_ai_platform/wan3.0-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.165025 |
| Qwen Ai Platform | `qwen_ai_platform/wan3.0-video-prime` | - | - | - | 影片生成；`output_cost_per_second`: $0.254399 |
| Qwencloud | `qwencloud/happyhorse-1.0-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.24 |
| Qwencloud | `qwencloud/happyhorse-1.0-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.24 |
| Qwencloud | `qwencloud/happyhorse-1.0-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.24 |
| Qwencloud | `qwencloud/happyhorse-1.1-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.18 |
| Qwencloud | `qwencloud/happyhorse-1.1-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.18 |
| Qwencloud | `qwencloud/happyhorse-1.1-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.18 |
| Qwencloud | `qwencloud/wan2.7-i2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.15 |
| Qwencloud | `qwencloud/wan2.7-r2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.15 |
| Qwencloud | `qwencloud/wan2.7-t2v` | - | - | - | 影片生成；`output_cost_per_second`: $0.15 |
| Qwencloud | `qwencloud/wan3.0-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.2 |
| Qwencloud | `qwencloud/wan3.0-video-prime` | - | - | - | 影片生成；`output_cost_per_second`: $0.28 |
| Scaledown | `scaledown/classify` | - | $0.05 | $0 | 聊天 |
| Scaledown | `scaledown/compress` | - | $0.05 | $0 | 聊天 |
| Scaledown | `scaledown/decisions` | - | $0.05 | $0 | 聊天 |
| Scaledown | `scaledown/extract` | - | $0.05 | $0 | 聊天 |
| Scaledown | `scaledown/summarize` | - | $0.05 | $0 | 聊天 |
| Scx-Ai | `scx-ai/DeepSeek-V4.1-flash` | 1,000,000 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Scx-Ai | `scx-ai/GLM-5.3` | 1,000,000 | $0.98 | $3.08 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Scx-Ai | `scx-ai/Kimi-K3` | 1,000,000 | $2.83 | $14.13 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/deepseek-v4-pro-0813` | 1,000,000 | $1.32 | $3.96 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/deepseek-v4.1-flash` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/glm-5.2` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/glm-5.3` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/glm-5.3-flash` | 1,000,000 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；影片輸入 |
| Tencent TokenHub | `tencent/glm-5.3-flashx` | 1,000,000 | $0.37 | $1.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；影片輸入 |
| Tencent TokenHub | `tencent/kimi-k2.7-code` | 256,000 | $0.95 | $4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/kimi-k2.7-code-highspeed` | 256,000 | $1.9 | $8 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/kimi-k2.8-preview` | 1,000,000 | $1 | $4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/kimi-k3` | 1,000,000 | $3 | $15 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-V4.1-Flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/meta-models/Muse-Spark-Open-816B-A42B` | 1,048,576 | $1.25 | $4.25 | 聊天；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/nvidia/NVIDIA-Nemotron-3.5-Super-VL` | 262,144 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/reflection/Beam-1.0-501B-A23B` | 1,048,576 | $0.4 | $1.2 | 聊天；工具呼叫；提示快取；結構化輸出 |
| Vertex Ai | `vertex_ai/gemini-4-argon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入；網頁搜尋；`input_cost_per_audio_token`: $0.000002 |
| Vertex Ai | `vertex_ai/gemini-4-argon-cyber-permissive` | 1,048,576 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入；網頁搜尋；`input_cost_per_audio_token`: $0.000004 |
| Vertex Ai | `vertex_ai/gemini-robotics-er-2-preview` | 131,072 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入；網頁搜尋；`input_cost_per_audio_token`: $0.000001 |
| Vertex Ai | `vertex_ai/semantic-ranker-default` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-default-002` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-default-003` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-default-004` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-default@latest` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-fast` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-fast-004` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai | `vertex_ai/semantic-ranker-fast@latest` | - | $0 | $0 | 重新排序；`input_cost_per_query`: $0.001 |
| Vertex Ai-Deepseek Models | `vertex_ai/deepseek-ai/deepseek-v4.1-flash-maas` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Vertex Ai-Language-Models | `gemini-robotics-er-2-preview` | 131,072 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入；網頁搜尋；`input_cost_per_audio_token`: $0.000001 |
| Volcengine | `volcengine/doubao-seed-2-1-lite-260915` | 1,024,000 | $0.115 | $0.388126 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入；`input_cost_per_audio_token`: $0.00000173 |
| Volcengine | `volcengine/doubao-seed-2-1-pro-260915` | 1,024,000 | $0.8625 | $4.3125 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Volcengine | `volcengine/doubao-seedance-2-0-260128` | - | - | - | 影片生成；`output_cost_per_second`: $0.14194286 |
| Volcengine | `volcengine/doubao-seedance-2-0-fast-260128` | - | - | - | 影片生成；`output_cost_per_second`: $0.11417143 |
| Volcengine | `volcengine/doubao-seedance-2-0-mini-260615` | - | - | - | 影片生成；`output_cost_per_second`: $0.07097143 |
| Volcengine | `volcengine/doubao-seedance-2-5-260628` | - | - | - | 影片生成；`output_cost_per_second`: $0.216 |
| Weights and Biases | `wandb/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B` | 1,049,000 | $0.15 | $0.75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Xai | `xai/grok-voice-2.0` | - | - | - | 即時；工具呼叫；音訊輸入；`input_cost_per_second`: $0.00133333 |
| Xai | `xai/grok-voice-3.0` | - | - | - | 即時；工具呼叫；音訊輸入；`input_cost_per_second`: $0.00133333 |
| Xai | `xai/grok-voice-latest` | - | - | - | 即時；工具呼叫；音訊輸入；`input_cost_per_second`: $0.00133333 |

</details>

### 新提供者 {#new-providers}

- 新增 Inference APIs 為 `inferenceapis/` 前綴下的 OpenAI 相容提供者，讀取 `INFERENCEAPIS_API_KEY`，列於 Add Model 表單，含 12 個已定價的聊天模型與原生 `/v1/responses` 及 `/v1/messages` - [PR #41669](https://github.com/BerriAI/litellm/pull/41669)
- 新增 ScaleDown 為 `scaledown/` 前綴下的原生文字提供者，含 classify、extract、summarize、decisions 與 compress 操作、`x-api-key` 驗證、成本追蹤，以及管理 UI 中的 Add Model 條目 - [PR #44168](https://github.com/BerriAI/litellm/pull/44168)
- 新增 CoralBricks 為 `coralbricks/` 前綴下的 OpenAI 相容提供者，讀取 `CORALBRICKS_API_KEY`，列於 Add Model 表單，含 `glm-5.3-fast` 與 `deepseek-v4.1-flash-fast` 的定價 - [PR #44700](https://github.com/BerriAI/litellm/pull/44700)
- 新增 Microsoft 365 Copilot 為 `microsoft_365_copilot/` 前綴下的聊天提供者，透過 RFC 8693 或 JWT bearer on-behalf-of 將呼叫者的 JWT 交換為委派的 Graph token，並在 Add Model 表單中以 LLM 憑證設定 - [PR #45158](https://github.com/BerriAI/litellm/pull/45158)

### Decisions 提供者 {#decisions-providers}

- 將 Laya 與 Bespoke Nimble 加入 Add Model 表單，並透過 `<api_base>/v1/systemone` 在 Decisions 路由上提供 `laya/*` 與 `bespoke/*` 部署 - [PR #45260](https://github.com/BerriAI/litellm/pull/45260)
- 為 `databricks/ai_decide` 呼叫位於 `<workspace>/api/2.0/ai-functions/ai-decide` 的 `ai_decide` AI Function 路由，讓 Decisions 與 Databricks Auto Router 分類器不再收到 404 - [PR #45722](https://github.com/BerriAI/litellm/pull/45722)
- 依 `<field>_decisions` 成本對照表鍵為 `/v1/decisions` 與 `/v1/systemone` 計費，讓 `gpt-6-luna` Decisions 以每 1M 輸入 tokens 0.10 USD 定價，且不收輸出或快取費用 - [PR #45904](https://github.com/BerriAI/litellm/pull/45904)
- 在 `/v1/decisions` 與 `/v1/systemone` 上新增 Fireworks AI `accounts/fireworks/routers/rune`，讀取 `FIREWORKS_AI_API_KEY`，並以較便宜的費率為快取 tokens 計費 - [PR #46057](https://github.com/BerriAI/litellm/pull/46057)
- 當 `litellm.decisions` 與 `litellm.systemone` 中的 `provider_specific_header` 格式錯誤時回傳 400，而非無聲丟棄 - [PR #46619](https://github.com/BerriAI/litellm/pull/46619)
- 保留 OpenAI 格式 decisions 提供者的 `box` 回答，而非將其解析為拒絕 - [PR #46633](https://github.com/BerriAI/litellm/pull/46633)
- 在成本對照表之前先讀取部署自身的 `supports_box_questions` 旗標，讓被標記的部署接受 `box` 問題 - [PR #46696](https://github.com/BerriAI/litellm/pull/46696)

### Amazon Bedrock {#amazon-bedrock}

- 將 Bedrock Mantle 的 OpenAI 形狀 `context_length_exceeded` 錯誤對應到 `ContextWindowExceededError`，讓 Claude Code 執行壓縮並觸發 `context_window_fallbacks` - [PR #41747](https://github.com/BerriAI/litellm/pull/41747)
- 當 `check_provider_endpoint: true` 時，列出帳號可在 `bedrock/*` 後呼叫的模型，而非靜態目錄或完全沒有 Bedrock 模型 - [PR #43981](https://github.com/BerriAI/litellm/pull/43981)
- 對 Bedrock Mantle gpt-5.x 與 gpt-6 聊天補全送出 `max_completion_tokens` 而非 `max_tokens`，後者曾被以 400 拒絕 - [PR #43982](https://github.com/BerriAI/litellm/pull/43982)
- 在 Bedrock Converse 上將工具結果中的每個 `tool_reference` 轉成持有工具名稱的文字區塊，讓 ToolSearch 結果不再以空的 `toolResult.content` 抵達 Bedrock 並以 400 失敗 - [PR #44590](https://github.com/BerriAI/litellm/pull/44590)
- 將 Bedrock Grok 4.6 與 4.7 預設為原生 Chat Completions，將位置式 `call_<n>` 工具呼叫 id 重新鑄造為唯一的 `call_<uuid>`，並為 Grok 丟棄 `stop`，讓 Claude Code 在 ToolSearch 輪次後不再收到 400 - [PR #45473](https://github.com/BerriAI/litellm/pull/45473)
- 在 Bedrock OpenAI GPT 模型上將工具結果中的圖片放在工具結果旁邊，該模型曾以 400 拒絕嵌在 `toolResult.content` 中的圖片 - [PR #45579](https://github.com/BerriAI/litellm/pull/45579)
- 新增 `twelvelabs.pegasus-1-5-v1:0` 資料列，並依模型卡將 Bedrock GPT-5.x 資料列的上下文視窗設為 1,050,000 tokens - [PR #45621](https://github.com/BerriAI/litellm/pull/45621)
- 為 Bedrock GPT 5.6 及更新版本丟棄 `stop`，而非送出被 Bedrock 以 400 拒絕的 `stopSequences`，藉此解除 Claude Code 自動模式的阻擋 - [PR #45664](https://github.com/BerriAI/litellm/pull/45664)
- 將無區域的 `bedrock/moonshotai.kimi-k2.5` 與 `bedrock/moonshotai.kimi-k2-thinking` 資料列重新定價為 us-east-1 的 Bedrock 價格 - [PR #45836](https://github.com/BerriAI/litellm/pull/45836)
- 依模型卡將 Bedrock `zai.glm-4.7` 與 `zai.glm-4.7-flash` 資料列的最大輸出 tokens 從 4,000 提高到 128,000 - [PR #45976](https://github.com/BerriAI/litellm/pull/45976)
- 從 Bedrock 模型卡取得 46 個 Bedrock 資料列的上下文視窗、最大輸出 tokens 與生命週期結束日期 - [PR #45980](https://github.com/BerriAI/litellm/pull/45980)
- 在 Converse 上重播 `redacted_thinking` 並將其 `data` 以 Claude 自己的字串回傳，讓 Converse 輪次可在 Invoke 與 `anthropic/` 上重播，而非收到 400 - [PR #46532](https://github.com/BerriAI/litellm/pull/46532)
- 在應用程式推論設定檔 ARN 上以 `base_model` 進行 Claude 能力檢查，讓 Opus 4.8 ARN 上的適應性 `thinking` 不再被改寫為固定預算 - [PR #46569](https://github.com/BerriAI/litellm/pull/46569)
- 在 web identity 工作階段政策中授予 `sts:GetWebIdentityToken` 與 `sts:TagGetWebIdentityToken`，讓使用 OIDC web identity 驗證的 `bedrock/claude_platform/*` 模型不再回傳 403 - [PR #46670](https://github.com/BerriAI/litellm/pull/46670)
- 將 `PerformanceConfigBlock.latency` 型別定為 `standard` 或 `optimized`，以符合 Bedrock 接受的值，而非 `throughput` - [PR #46698](https://github.com/BerriAI/litellm/pull/46698)
- 將 `jp.amazon.nova-2-lite-v1:0` 日本地理推論設定檔加入模型目錄 - [PR #46721](https://github.com/BerriAI/litellm/pull/46721)
- 為 `openai.gpt-oss-120b-1:0` 與 `openai.gpt-oss-20b-1:0` 新增 Priority 與 Flex 層級價格 - [PR #46728](https://github.com/BerriAI/litellm/pull/46728)
- 拒絕格式錯誤的 Nova Sonic 即時工作階段設定，在串流快取命中時保留快取讀取與寫入 tokens，在 `/v1/messages` 上保留 Prometheus 速率限制量測，並為精確的成本對照表名稱定價，讓 Bedrock 呼叫不再以零計費 - [PR #47090](https://github.com/BerriAI/litellm/pull/47090)

### Anthropic {#anthropic}

- 當最後一則 Claude 使用者訊息的 `content` 為 `null`、`[]` 或缺失時，加入空的 `""` 佔位符，讓這些請求不再以 prefill 400 失敗 - [PR #41397](https://github.com/BerriAI/litellm/pull/41397)
- 在 `/chat/completions`、`/v1/responses` 與 `/v1/messages` 上，將 Anthropic 拒絕的 `stop_reason` 與 `stop_details` 保留在回應與記錄的回應中，讓回呼看到的不只是 `content_filter` - [PR #46104](https://github.com/BerriAI/litellm/pull/46104)
- 在 Bedrock Mantle 與 Claude Platform 上以 `delta.content` 串流 `json_schema` 回答，並將 Claude 拆成每欄位一個工具區塊的回答合併為單一物件 - [PR #46331](https://github.com/BerriAI/litellm/pull/46331)
- 在真正的 Vertex 模型上檢查強制工具支援，跳過非字串的 `metadata.user_id` 而非回傳 500，並為拒絕它的提供者在 `drop_params` 下丟棄 `speed` - [PR #46337](https://github.com/BerriAI/litellm/pull/46337)
- 在聊天補全上保留文字為空的已簽署思考區塊，當 `/v1/messages` 呼叫者將 `block_binding.prefix_mismatch_behavior` 設為 `error` 時回傳該 400，並在 Bedrock Invoke 上保留 `thinking.block_binding` - [PR #46342](https://github.com/BerriAI/litellm/pull/46342)
- 在 `/v1/chat/completions` 上將 OpenAI 的 `tool_search` 工具轉譯為 Anthropic 的 regex 工具搜尋供 Claude 模型使用，而非回傳 500；並在路由無法執行時回傳 400 並指明修正方式 - [PR #46389](https://github.com/BerriAI/litellm/pull/46389)
- 將 `tool_search_tool_result` 區塊保留在 `provider_specific_fields["tool_results"]` 中，並在其 `server_tool_use` 之後重播，讓 Claude 工具搜尋迴圈的第二次呼叫不再收到 400 - [PR #46440](https://github.com/BerriAI/litellm/pull/46440)
- 在聊天補全上將 `service_tier` 轉送到 Anthropic 與 Azure Foundry Claude，將 OpenAI 的 `default` 對應到 `standard_only`，並對 Claude 不接受的層級回傳 400 並附 `drop_params` 提示 - [PR #46461](https://github.com/BerriAI/litellm/pull/46461)
- 依 `modify_params` 送出的方式計算重播之伺服器工具呼叫上的快取標記，讓快取控制 hook 不再加入被 Anthropic 以 400 拒絕的第五個標記 - [PR #46591](https://github.com/BerriAI/litellm/pull/46591)
- 在重建適應性 `thinking` 時於 `drop_params` 下丟棄未知的舊版 `thinking` 鍵，並從重建的區塊中丟棄 `budget_tokens`，讓 Claude 不再回傳 400 - [PR #46741](https://github.com/BerriAI/litellm/pull/46741)

### Azure {#azure}

- 將 `azure_ai/Cohere-Embed-V5-Fast` 與 `azure_ai/Cohere-Embed-V5-Pro` 嵌入模型加入成本對照表 - [PR #45764](https://github.com/BerriAI/litellm/pull/45764)
- 將 `azure/gpt-realtime-translate` 的 `deprecation_date` 移至 2027-11-09，與 Azure Models API 一致 - [PR #45849](https://github.com/BerriAI/litellm/pull/45849)
- 將 `azure_ai/kimi-k2.7-code` 的 `deprecation_date` 移至 2027-04-16，與 Azure Models API 一致 - [PR #45945](https://github.com/BerriAI/litellm/pull/45945)
- 將 Azure `text-embedding-3-large`、`text-embedding-3-small`、`text-embedding-ada-002`、`tts-1-hd` 以及舊版 GPT-4 Turbo 與 GPT-3.5 Turbo Instruct 的價格與 Azure OpenAI 定價頁同步 - [PR #46200](https://github.com/BerriAI/litellm/pull/46200)
- 以 `azure_ai/claude-opus-5-5` 兩倍的價格新增 `azure_ai/claude-opus-5-5-fast`，淘汰日期為 2027-10-01 - [PR #46760](https://github.com/BerriAI/litellm/pull/46760)

### Baseten {#baseten}

- 將 `baseten/meta-models/muse-spark-open` 與 `baseten/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B` 加入模型目錄 - [PR #46794](https://github.com/BerriAI/litellm/pull/46794)

### Crusoe {#crusoe}

- 將 Crusoe 呼叫預設為 `https://api.inference.crusoecloud.com/v1`，因為舊主機的防火牆曾以 403 拒絕部分提示，且 `CRUSOE_API_BASE` 仍可覆寫 - [PR #33121](https://github.com/BerriAI/litellm/pull/33121)

### DashScope {#dashscope}

- 為 `dashscope/`、`qwencloud` 與 `qwen_ai_platform` 在 `/v1/videos` 上新增 Wan 3.0、Wan 2.7 與 HappyHorse 影片生成，含按區域定價 - [PR #43706](https://github.com/BerriAI/litellm/pull/43706)

### Databricks {#databricks}

- 在 Databricks `json_schema` 回應格式中保留用戶端送出的 `#/$defs` 參照，讓巢狀型別不再於非 Claude 模型上以 400 失敗 - [PR #45659](https://github.com/BerriAI/litellm/pull/45659)
- 將單一純文字區塊以字串送到非 Claude 的 Databricks 模型，讓 JSON 模式不再於 `model_info.mode: responses` 部署上以 400 失敗 - [PR #45686](https://github.com/BerriAI/litellm/pull/45686)
- 接受 Databricks 請求上的 `service_tier`，包含對聊天模型的 `/v1/responses` 呼叫，並在非串流回應上回傳提供服務的 `service_tier`，讓定價能看到它 - [PR #46111](https://github.com/BerriAI/litellm/pull/46111)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 新增 `litellm_settings.gemini_include_thoughts_default`，將其設為 `false` 可停止請求 Gemini 思考摘要，同時保持思考與推理 tokens 開啟 - [PR #36460](https://github.com/BerriAI/litellm/pull/36460)
- 將含有字串 `$ref` 的工具結果以原始 JSON 文字放在 `content` 中送到 Gemini 與 Vertex AI，讓下一輪不再被以 400 拒絕 - [PR #38284](https://github.com/BerriAI/litellm/pull/38284)
- 將無法讀取的 `vertex_credentials` 檔案回報為指向記錄的檔案讀取失敗，而非說 JSON 無效 - [PR #40173](https://github.com/BerriAI/litellm/pull/40173)
- 為 Gemini 與 Vertex AI 剝除 `null` 型別時保留每個非 null 的 `anyOf` 分支，讓雙重或單一 `null` 聯合不再洩漏 `null` 分支或以 500 失敗，`["integer","null"]` 欄位也不再以 `0` 回傳 - [PR #41683](https://github.com/BerriAI/litellm/pull/41683)
- 在 `:generateContent`、`:streamGenerateContent` 與 `:countTokens` 上，將 Vertex AI Model Garden 與夥伴模型（例如 `xai/grok-*`）透過聊天補全轉接器路由，而非原生 Google 路徑的 404 與 500 錯誤 - [PR #41836](https://github.com/BerriAI/litellm/pull/41836)
- 不再為省略它的 Gemini 3 及更新版本請求加入 `temperature: 1.0`，並如以往轉送明確的 `temperature` - [PR #45107](https://github.com/BerriAI/litellm/pull/45107)
- 將 12 個 OpenAI 語音名稱（例如 `alloy`）對應到 Gemini 預建 TTS 語音，讓 Gemini TTS 不再以 400 失敗並通過預設健康檢查 - [PR #45303](https://github.com/BerriAI/litellm/pull/45303)
- 解開嵌在 `parameters` 或 `input` 等鍵之下的 Vertex AI Claude `json_schema` 回答，並送出 `output_config.format` 而非已棄用的 `output_format`，讓結構化輸出不再以 400 失敗 - [PR #45871](https://github.com/BerriAI/litellm/pull/45871)
- 將 Vertex AI `semantic-ranker` 重新排序定價為每 1,000 次查詢 1.00 USD，而非將每個重新排序請求以零支出記錄 - [PR #46061](https://github.com/BerriAI/litellm/pull/46061)
- 將 `vertex_ai/gemini-robotics-er-2-preview` 加入模型目錄 - [PR #46126](https://github.com/BerriAI/litellm/pull/46126)
- 將 `gemini/gemini-4-argon` 加入模型目錄，含 Gemini API 價格 - [PR #46227](https://github.com/BerriAI/litellm/pull/46227)
- 將 `vertex_ai/gemini-4-argon` 加入模型目錄，含 Vertex AI 價格與能力旗標 - [PR #46228](https://github.com/BerriAI/litellm/pull/46228)
- 將 `gemini/gemini-4-argon` 的 `max_output_tokens` 從 32768 提高到 65536，以符合模型文件中的預設輸出限制 - [PR #46236](https://github.com/BerriAI/litellm/pull/46236)
- 為 `vertex_ai/gemini-4-argon` 新增標準、priority 與 flex/batch 定價及非全域加價，讓 Vertex AI 呼叫回傳回應成本 - [PR #46237](https://github.com/BerriAI/litellm/pull/46237)
- 以 Google 的 `continuationToken` 自動接續 Gemini 4 的長回答，直到 `max_tokens` 用完，彙總各次呼叫的用量，並在 `{id}/cancel` 取消互動 - [PR #46240](https://github.com/BerriAI/litellm/pull/46240)
- 移除重複的 `vertex_ai/gemini-4-argon` 資料列與裸名 `gemini-4-argon` 資料列，讓只有 `vertex_ai/` 前綴的名稱能解析 - [PR #46246](https://github.com/BerriAI/litellm/pull/46246)
- 將 `vertex_ai/gemini-4-argon-cyber-permissive` 加入模型目錄，含 Vertex AI 價格 - [PR #46249](https://github.com/BerriAI/litellm/pull/46249)
- 將每請求的 `timeout` 傳給 Vertex AI 與 Google AI Studio Gemini 串流呼叫，讓停滯的串流擲出錯誤，而非等待 6000 秒的預設值 - [PR #46349](https://github.com/BerriAI/litellm/pull/46349)
- 為 `gemini-2.0-flash-exp-image-generation` 及其 `gemini/` 資料列新增 2025-11-14 的關閉日期 - [PR #46489](https://github.com/BerriAI/litellm/pull/46489)
- 為 `gemini-nano-banana-2.1` 與 `vertex_ai/gemini-nano-banana-2.1` 新增輸入、快取輸入與輸出的 Flex 價格 - [PR #46512](https://github.com/BerriAI/litellm/pull/46512)
- 將 `vertex_ai/deepseek-ai/deepseek-v4.1-flash-maas` 加入模型目錄，含 Vertex AI 價格 - [PR #46729](https://github.com/BerriAI/litellm/pull/46729)
- 在 Vertex AI 免費提供期間，將 `vertex_ai/deepseek-ai/deepseek-v4.1-flash-maas` 定價為零 - [PR #46753](https://github.com/BerriAI/litellm/pull/46753)
- 免費期結束後，將 `vertex_ai/deepseek-ai/deepseek-v4.1-flash-maas` 從 $0 改為其公布的付費價格 - [PR #46793](https://github.com/BerriAI/litellm/pull/46793)
- 從四個 Vertex AI Gemini 3 預覽資料列移除 `cache_read_input_token_cost_flex`，因為 Vertex AI 將快取 Flex 輸入列為不可用 - [PR #46826](https://github.com/BerriAI/litellm/pull/46826)

### GitHub Copilot {#github-copilot}

- 為 GitHub Copilot 憑證新增每使用者 GitHub OAuth 驗證類型，讓每個 `github_copilot/` 請求使用呼叫使用者自己的 GitHub 登入，內部使用者可在 LLM Credentials 的 Your connections 下連接其帳號 - [PR #45241](https://github.com/BerriAI/litellm/pull/45241)
- 將 GitHub Copilot 模型目錄與 Copilot 提供的模型同步，移除 11 個回傳 `model_not_supported` 的已淘汰 id，並新增 22 個現行 id - [PR #45386](https://github.com/BerriAI/litellm/pull/45386)
- 將 `github_copilot/claude-haiku-5.5` 加入成本對照表 - [PR #45656](https://github.com/BerriAI/litellm/pull/45656)
- 以 Copilot 牌價將 `github_copilot/gemini-4-argon` 加入模型目錄 - [PR #46280](https://github.com/BerriAI/litellm/pull/46280)
- 為 `github_copilot/claude-opus-5` 與 `github_copilot/gpt-5.6-terra` 新增 2026-11-16 的棄用日期 - [PR #46792](https://github.com/BerriAI/litellm/pull/46792)

### Meta {#meta}

- 新增 `meta/muse-wonder-1.0`，含 Meta 的定價並支援 `max` 與 `xhigh` 推理努力 - [PR #46072](https://github.com/BerriAI/litellm/pull/46072)

### MiniMax {#minimax}

- 在 `/v1/videos` 上新增 MiniMax-H3 與 H3-Max 影片生成，含按解析度的每秒價格，並為超出免費額度的輸入圖片計費 - [PR #43705](https://github.com/BerriAI/litellm/pull/43705)

### OCI {#oci}

- 在 `drop_params` 下為 OCI Grok 4.20 丟棄 `reasoning_effort`、為每個 OCI 模型丟棄非函式工具，讓 Codex 與 Claude Code 不再每輪以 400 失敗 - [PR #40732](https://github.com/BerriAI/litellm/pull/40732)

### Ollama {#ollama}

- 為 Ollama 的 OpenAI 相容回應給予唯一的 `chatcmpl-` id，而非 Ollama 重複使用的 id（該 id 曾無聲地將成功請求從支出記錄中丟棄），並將原始 id 保留在 `provider_specific_fields.original_response_id` - [PR #39227](https://github.com/BerriAI/litellm/pull/39227)

### OpenAI {#openai}

- 將 `gpt-rosalind-discovery` 加入成本對照表，價格取自 OpenAI 的定價頁 - [PR #45653](https://github.com/BerriAI/litellm/pull/45653)

### SageMaker {#sagemaker}

- 在 SageMaker 嵌入部署上以 `InferenceComponentName` 送出 `model_id`，並新增 `sagemaker/openai/<endpoint>` 路由，送出 OpenAI `input` 主體並解析 `data[].embedding` 回應 - [PR #44985](https://github.com/BerriAI/litellm/pull/44985)
- 停止在 `sagemaker_chat` 請求主體中送出部署的 AWS 憑證，同時請求仍以它們簽署 - [PR #45724](https://github.com/BerriAI/litellm/pull/45724)

### SCX.ai {#scxai}

- 以 SCX.ai 公布的價格將 `scx-ai/DeepSeek-V4.1-flash`、`scx-ai/GLM-5.3` 與 `scx-ai/Kimi-K3` 加入模型目錄，讓其支出不再以 $0 記錄 - [PR #46496](https://github.com/BerriAI/litellm/pull/46496)

### Soniox {#soniox}

- 將透過 `/v1/audio/transcriptions` 送出的 Soniox `context`、`translation` 與 flag 表單欄位解碼為型別值，並在未設定時以 OpenAI `language` 填入 `language_hints` - [PR #40605](https://github.com/BerriAI/litellm/pull/40605)

### Together AI {#together-ai}

- 上市促銷結束後，將 `together_ai/moonshotai/Kimi-K3` 還原為 Together 的標準 serverless 價格 - [PR #46226](https://github.com/BerriAI/litellm/pull/46226)
- 將 `together_ai/Qwen/Qwen3.7-Max` 設為其公布價格，並還原受影響 Together 模型上 2026-09-15 的移除日期 - [PR #46281](https://github.com/BerriAI/litellm/pull/46281)
- 以 Together 公布的價格將 `together_ai/nvidia/NVIDIA-Nemotron-3.5-Super-VL` 加入模型目錄 - [PR #46693](https://github.com/BerriAI/litellm/pull/46693)

### Weights and Biases {#weights-and-biases}

- 將 `wandb/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B` 加入模型目錄 - [PR #46795](https://github.com/BerriAI/litellm/pull/46795)

### xAI {#xai}

- 新增按秒定價的 `xai/grok-voice-3.0`、`xai/grok-voice-2.0` 與 `xai/grok-voice-latest` 即時資料列 - [PR #46602](https://github.com/BerriAI/litellm/pull/46602)

### 模型目錄與定價 {#model-catalog-and-pricing}

- 為五個 ScaleDown 模型登記文字定價，每百萬輸入 tokens 0.05 USD 且輸出免費，讓成本計算不再將它們回報為未對應 - [PR #44167](https://github.com/BerriAI/litellm/pull/44167)
- 為 `gemini/deep-research-pro-preview-12-2025` 新增 2026-10-23 的 `deprecation_date`，並移除 `gemini/gemini-3.1-flash-image` 已撤回的關閉日期，與 Google 的變更紀錄一致 - [PR #45491](https://github.com/BerriAI/litellm/pull/45491)
- 將 `together_ai/Qwen/Qwen3.7-Max` 提高到 Together 目前的每 1M tokens 輸入 2.50 USD、輸出 7.50 USD（先前少計費 40%），並修正 `azure_ai/kimi-k2.7-code` 的 `deprecation_date` - [PR #45595](https://github.com/BerriAI/litellm/pull/45595)
- 新增 Perplexity Agent API 模型，並將 `claude-sonnet-4-5` 設為 200,000 token 上下文，因為 Anthropic 已淘汰該模型的 1M 上下文 beta - [PR #45647](https://github.com/BerriAI/litellm/pull/45647)
- 為 `together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo` 與 `together_ai/deepseek-ai/DeepSeek-V4-Flash-0731` 新增 2026-10-22 的 `deprecation_date` - [PR #45657](https://github.com/BerriAI/litellm/pull/45657)
- 從模型成本對照表移除前 105 個 `openrouter` 資料列（五部分之一），因為 OpenRouter 依其自身的 `usage.cost` 計費 - [PR #45665](https://github.com/BerriAI/litellm/pull/45665)
- 從模型成本對照表再移除 29 個 `openrouter` 資料列（五部分之二） - [PR #45666](https://github.com/BerriAI/litellm/pull/45666)
- 從模型成本對照表再移除 139 個 `openrouter` 資料列（五部分之三），並丟棄只有它們使用的 `*_above_32k_tokens`、`*_above_128k_tokens` 與 `*_above_256k_tokens` 欄位 - [PR #45667](https://github.com/BerriAI/litellm/pull/45667)
- 從模型成本對照表再移除 202 個 `openrouter` 資料列（五部分之四），包含 `openrouter/openai/gpt-image-*` 資料列 - [PR #45668](https://github.com/BerriAI/litellm/pull/45668)
- 從模型成本對照表移除最後 21 個 `openrouter` 資料列（五部分之五），讓不再有任何 `openrouter` 資料列留下 - [PR #45669](https://github.com/BerriAI/litellm/pull/45669)
- 依 AWS Price List 修正六個 Bedrock Titan Text 與 Nova 2 Lite 價格，新增 `amazon.nova-premier-v1:0`，並清除兩個已撤回的 Together 淘汰日期 - [PR #45793](https://github.com/BerriAI/litellm/pull/45793)
- 新增六個帶 2026-07-23 `deprecation_date` 的 OpenAI 日期快照，將兩個 Perplexity decider 模型定價為每 1M 輸入 tokens 0.02 USD，並移除一個 Together 模型過時的快取價格 - [PR #45842](https://github.com/BerriAI/litellm/pull/45842)
- 修正 `tencent/deepseek-v4-pro` 的 TokenHub 定價，新增十個 TokenHub DeepSeek、GLM 與 Kimi 模型，修正 Fireworks 上下文視窗與 Bedrock Claude 3.5 Sonnet 限制，並更新四個 Together 移除日期 - [PR #46206](https://github.com/BerriAI/litellm/pull/46206)
- 為五個 OpenAI GPT-4o 與 GPT-4.1 快照新增 2027-01-14 的關閉日期，將 Azure `gpt-chat-latest` 移至 2027-05-18，為 xAI 語音模型計收每文字輸入費用，並刷新 Sail DeepSeek V4.1 Flash 價格 - [PR #46675](https://github.com/BerriAI/litellm/pull/46675)
- 將 16 個缺少的已定價 OpenAI、Together、Fireworks 與 Bedrock 模型加入模型目錄，讓其支出不再未對應 - [PR #46742](https://github.com/BerriAI/litellm/pull/46742)

## LLM API 端點 {#llm-api-endpoints-1}

### Responses API {#responses-api}

- 在 `/v1/responses` 與 Bedrock 事件串流的串流中途錯誤上保留提供者的請求 id 標頭，讓失敗的記錄資料列帶有 `error_provider_request_id` - [PR #45453](https://github.com/BerriAI/litellm/pull/45453)
- 將結構化的 OpenAI `cyber_policy` 錯誤（包含串流錯誤事件）對應到 `ContentPolicyViolationError`，讓設定的內容政策備援得以執行 - [PR #45828](https://github.com/BerriAI/litellm/pull/45828)
- 在 `/v1/responses` 上將 OpenAI 的 `tool_search` 工具轉譯為 Anthropic 的 regex 工具搜尋供 Claude 模型使用，並將 Claude 的搜尋以 `tool_search_call` 項目回傳，包含串流 - [PR #45882](https://github.com/BerriAI/litellm/pull/45882)
- 保留頂層串流 `error` 事件中提供者的 `code` 與 `message`，而非回報 `Response API in-stream error` - [PR #46438](https://github.com/BerriAI/litellm/pull/46438)
- 在 OpenAI Responses 請求上將 Anthropic 的 bm25 與 regex 工具搜尋工具對應到 OpenAI 的伺服器 `tool_search`，讓 Claude 到 OpenAI 的備援不再回傳 400 - [PR #46441](https://github.com/BerriAI/litellm/pull/46441)
- 以空內容開啟偽造的 Responses 串流項目，讓文字與工具引數只抵達一次，避免串流 `/v1/messages` 工具呼叫得到加倍的 JSON 輸入 - [PR #46533](https://github.com/BerriAI/litellm/pull/46533)
- 比照 HTTP，為 WebSocket 上的 `/v1/responses` 使用部署自身的提供者與 `api_key`，而非回退到全域 OpenAI 金鑰 - [PR #46724](https://github.com/BerriAI/litellm/pull/46724)
- 在原生 Responses WebSocket 上為每個 `response.create` 輪次各寫一筆支出記錄資料列，以 `resp_` id 為鍵，而非在 socket 關閉時寫一筆彙總資料列 - [PR #46768](https://github.com/BerriAI/litellm/pull/46768)

### 透過 Responses API 橋接的 Chat Completions {#chat-completions-over-the-responses-api-bridge}

- 在 `choices[0]` 上回傳橋接回覆的每則訊息、推理項目與工具呼叫，讓只讀第一個 choice 的用戶端能執行工具 - [PR #46099](https://github.com/BerriAI/litellm/pull/46099)
- 將橋接聊天工具呼叫編號為 0、1 依此類推，而非每次呼叫都是 0，與原生聊天一致 - [PR #46109](https://github.com/BerriAI/litellm/pull/46109)
- 在送到 Responses API 的函式工具上保留 `defer_loading`，並在 OpenAI 與 Azure 上將帶有 `tool_search` 工具的請求路由到 Responses，讓 GPT-5.5 工具搜尋不再回傳 400 - [PR #46439](https://github.com/BerriAI/litellm/pull/46439)
- 透過 `provider_specific_fields.tool_search_items` 在橋接聊天輪次間來回傳遞 `tool_search_call` 與 `tool_search_output` 項目，讓 GPT-5.5 保留每次搜尋及其 `namespace` - [PR #46444](https://github.com/BerriAI/litellm/pull/46444)
- 為 `json_schema` 與 `json_object` 請求只回傳第一個訊息項目作為 `content`，讓結構化輸出不再以兩份黏在一起的 JSON 文件回傳 - [PR #46508](https://github.com/BerriAI/litellm/pull/46508)

### Anthropic Messages API {#anthropic-messages-api}

- 在轉譯 Anthropic 工具時，停止將 `input_examples` 等額外鍵寫入呼叫者自己的工具 `input_schema`，讓嚴格工具不再於防護欄下收到 400，之後備援到 Claude 時也保留每個欄位 - [PR #34653](https://github.com/BerriAI/litellm/pull/34653)
- 在 `/v1/messages` 請求上保留文字為空且有有效 `signature` 的 `thinking` 區塊，讓在省略思考文字的 Claude 模型上重播的輪次不再遺失其推理 - [PR #41362](https://github.com/BerriAI/litellm/pull/41362)
- 新增 `general_settings.safeguards_classifier_model`，在非 Claude 的 `/v1/messages` 路由上評斷每次工具呼叫並回傳 Anthropic 形狀的 `safeguard_results`，讓 Claude Code 自動模式保留其伺服器端檢查 - [PR #45600](https://github.com/BerriAI/litellm/pull/45600)
- 將 `/v1/messages` 上的 `service_tier` 轉送到 Anthropic、Azure AI 與 Bedrock Mantle，讓 `standard_only` 請求不再落在 Priority Tier 容量上 - [PR #46370](https://github.com/BerriAI/litellm/pull/46370)
- 當 `/v1/messages` 串流區塊帶有多個工具呼叫時，每次呼叫各發出一個 `tool_use` 區塊，讓 Mistral 模型的平行工具呼叫不再合併成無效的 JSON - [PR #46492](https://github.com/BerriAI/litellm/pull/46492)
- 在從 `/v1/messages` 橋接到 Responses 的 `input_image` 部分以及管理 UI playground 中送出 `detail: auto`，讓對 vLLM 後端 `openai/` 模型的圖片請求不再回傳 400 - [PR #46720](https://github.com/BerriAI/litellm/pull/46720)
- 在原生 Messages 呼叫上遵循 `litellm_settings.request_timeout` 與 `REQUEST_TIMEOUT`，而非在 600 秒後讓長輪次逾時 - [PR #46749](https://github.com/BerriAI/litellm/pull/46749)

### 計算 tokens {#count-tokens}

- 當提供者的 token 計數呼叫在 `/v1/messages/count_tokens`、`/v1/responses/input_tokens` 與 Gemini `countTokens` 路由上失敗時，回傳提供者自身的狀態與訊息，而非帶本機 tiktoken 估計值的 200 - [PR #46121](https://github.com/BerriAI/litellm/pull/46121)
- 在 Vertex Gemini 與 Google AI Studio 上計算系統提示與工具，遵循部署的 `api_base`，並在 Bedrock Claude 計數收到執行階段 404 時備援到 Mantle - [PR #46430](https://github.com/BerriAI/litellm/pull/46430)
- 依 `/v1/messages` 轉換它們的方式，為 OpenAI 模型計算 `/v1/messages/count_tokens` 請求，讓 PDF、圖片、工具區塊與清單形式的 `system` 提示都被涵蓋 - [PR #46759](https://github.com/BerriAI/litellm/pull/46759)
- 依 `/v1/messages` 轉換它們的方式，為 Gemini 模型計算 `/v1/messages/count_tokens` 請求，讓 PDF、圖片與工具輪次都被涵蓋，AI Studio Gemini 也回傳計數而非 500 - [PR #46767](https://github.com/BerriAI/litellm/pull/46767)
- 回傳 400 並指明 `/v1/messages/count_tokens` 無法為 OpenAI 與 Gemini 模型轉換的 Anthropic 區塊，而非以 200 回傳偏低的計數 - [PR #46772](https://github.com/BerriAI/litellm/pull/46772)
- 從計數端點回傳 401 並指明缺少的提供者金鑰，而非本機估計值；錯誤在 `/v1/messages/count_tokens` 上使用 Anthropic 的封套、在 `:countTokens` 上使用 Google 的封套 - [PR #46815](https://github.com/BerriAI/litellm/pull/46815)
- 新增 `token_count_model` 與 `token_count_framing` 設定，並在計數回應上回報 `litellm_count_source` 與 `litellm_count_model`，讓 Bedrock Claude Sonnet 5.5 與 Kimi K3 的計數能運作，並對格式錯誤的 `tools` 回傳 400 而非 500 - [PR #47209](https://github.com/BerriAI/litellm/pull/47209)

### 提示快取 {#prompt-caching}

- 將 `/v1/responses` 訊息、`function_call` 與 `function_call_output` 項目上的 `cache_control` 帶到橋接聊天訊息上，讓 Bedrock、Vertex AI 與 Azure AI 上的 Claude 取得快取命中 - [PR #32511](https://github.com/BerriAI/litellm/pull/32511)
- 當聊天補全與 `/v1/messages` 為 Bedrock Mantle GPT-5.6 橋接到 Responses 時，保留部署設定的提示快取中斷點，讓明確的快取寫入再次發生 - [PR #45500](https://github.com/BerriAI/litellm/pull/45500)
- 在 `/v1/messages` 到 Responses 的橋接上，為 OpenAI gpt-5.6 及更新版本將 `cache_control` 標記改寫為 `prompt_cache_breakpoint`，並將系統提示保留為 developer 訊息，讓其標記存留 - [PR #46082](https://github.com/BerriAI/litellm/pull/46082)
- 當可快取前綴有 `"ttl": "1h"` 中斷點時，將提示快取親和性釘選保持 3600 秒，而非固定的 300 秒，讓前綴留在持有其快取的部署上 - [PR #46084](https://github.com/BerriAI/litellm/pull/46084)
- 在 `/v1/chat/completions` 上為 OpenAI gpt-5.6 及更新版本將 `cache_control` 標記改寫為 `prompt_cache_breakpoint`，而非將它們剝除 - [PR #46101](https://github.com/BerriAI/litellm/pull/46101)
- 在原生 `/v1/responses` 上為 OpenAI gpt-5.6 及更新版本將 `cache_control` 標記改寫為 `prompt_cache_breakpoint`，而非將它們剝除 - [PR #46105](https://github.com/BerriAI/litellm/pull/46105)
- 在 `/v1/messages` 到 Responses 的橋接上快取 `tool_result` 區塊內的螢幕截圖，並遵循工具結果內區塊上的 `cache_control` - [PR #46324](https://github.com/BerriAI/litellm/pull/46324)
- 為無法讀取它的 OpenAI 模型，在 `drop_params` 下從訊息、內容部分、工具呼叫與工具中剝除 `prompt_cache_breakpoint` - [PR #46453](https://github.com/BerriAI/litellm/pull/46453)
- 在 Bedrock 應用程式推論設定檔的回應快取命中時保留 1 小時路由釘選，與基礎模型的 1 小時快取 TTL 一致，而非 5 分鐘 - [PR #47174](https://github.com/BerriAI/litellm/pull/47174)

### 即時 {#realtime}

- 在 `/v1/live/sessions`、`/live/sessions` 與 `/openai/v1/live/sessions` 上代理 OpenAI Live 工作階段，具備與 Realtime 相同的金鑰驗證、模型存取檢查、路由、預算與支出記錄，Live 語音依 `usage.seconds` 計費 - [PR #43621](https://github.com/BerriAI/litellm/pull/43621)
- 只在逐字稿防護欄關閉自動回應時，才在逐字稿後送出 `response.create`，讓有 `create_response: false` 的用戶端不再收到從未要求的回應 - [PR #43791](https://github.com/BerriAI/litellm/pull/43791)
- 透過 `/v1/realtime` 轉送 Nova Sonic 工具呼叫及其引數，接受平面與巢狀工具形狀，並對 Bedrock 無法套用的 `session.update` 回傳錯誤，而非結束工作階段 - [PR #46214](https://github.com/BerriAI/litellm/pull/46214)

### 批次與檔案 {#batches-and-files}

- 當 Vertex AI 批次上傳有格式錯誤的 JSONL 資料列時，回傳指明行號的 400，而非指向錯誤行號的 500 - [PR #40097](https://github.com/BerriAI/litellm/pull/40097)
- 新增可選擇啟用的 `batch_line_item_callbacks`（`s3_v2`、`gcs_bucket`），在受管理批次計費後，將每個批次行的請求、回應、tokens、成本與建立者寫入 bucket - [PR #41691](https://github.com/BerriAI/litellm/pull/41691)
- 將 Vertex AI 批次與檔案時間戳解析為 UTC，讓 `created_at` 不再被主機時區偏移，整秒的 `createTime` 也不再讓批次建立與擷取以 500 失敗 - [PR #45550](https://github.com/BerriAI/litellm/pull/45550)
- 從批次本身將已完成的 xAI 批次 id 讀為檔案，而非 xAI 的 files API（它總是回傳 404），讓結果檔案立即被命名，其大小由批次成本工作填入 - [PR #45559](https://github.com/BerriAI/litellm/pull/45559)
- 從受管理檔案建立批次與微調工作時檢查輸入檔案擁有權，對缺失檔案回傳 404、對他人檔案回傳 403，並讓重新產生的金鑰保留其自身檔案 - [PR #45855](https://github.com/BerriAI/litellm/pull/45855)

### 向量儲存 {#vector-stores}

- 讓每個預設建構的向量儲存註冊表有自己的清單，讓新的 `VectorStoreRegistry()` 不再繼承先前註冊表上的儲存 - [PR #38879](https://github.com/BerriAI/litellm/pull/38879)
- 透過 proxy 建立或更新向量儲存時，確切地將呼叫者的 `metadata` 送給提供者，讓儲存不再填滿 OpenAI 的 16 個 metadata 欄位，後續更新也不再以 400 失敗 - [PR #47159](https://github.com/BerriAI/litellm/pull/47159)

### 透傳端點 {#pass-through-endpoints}

- 讓設定的透傳端點優先於同前綴的內建 `/<prefix>/{param:path}` 提供者路由，並在端點被刪除或從設定中移除時移除其路由 - [PR #44133](https://github.com/BerriAI/litellm/pull/44133)
- 在任何主機上將串流 `/v1/messages` 透傳呼叫分類為 Anthropic，讓自訂 `ANTHROPIC_API_BASE` 閘道記錄真實 tokens、成本與提供者訊息 id，而非零支出 - [PR #45602](https://github.com/BerriAI/litellm/pull/45602)
- 在 Bedrock 透傳上回傳 AWS 形狀的錯誤，讓 AWS SDK 讀到防護欄阻擋或 Bedrock 失敗的錯誤碼與訊息，而非空的 `ClientError` - [PR #46522](https://github.com/BerriAI/litellm/pull/46522)

### 代理程式與 Agent-to-Agent {#agents-and-agent-to-agent}

- 新增可選擇啟用的 `general_settings.agent_access_default_deny`，讓自身或其團隊上沒有代理程式授權的金鑰無法觸及任何代理程式 - [PR #43979](https://github.com/BerriAI/litellm/pull/43979)
- 新增每代理程式的 `litellm_params.a2a_protocol_version`（`0.3` 或 `1.0`），覆寫代理程式卡宣告的版本，讓 langgraph-api 0.15 上的 LangGraph 代理程式不再以 `has no field named "kind"` 失敗 - [PR #44463](https://github.com/BerriAI/litellm/pull/44463)
- 新增 `databricks_agent` 提供者，讓 Databricks Agent Platform 代理程式（Model Serving 端點、統一 responses URL 與 Databricks Apps）能以 PAT 或 OAuth M2M 驗證在代理程式閘道中運作，並在管理 UI 中提供 Databricks Agent 卡片 - [PR #45681](https://github.com/BerriAI/litellm/pull/45681)

### SDK {#sdk}

- 在串流 SDK 錯誤上保留提供者的回應標頭，讓串流的 Gemini 429 如同非串流呼叫一樣在 `litellm_response_headers` 上公開它們 - [PR #41528](https://github.com/BerriAI/litellm/pull/41528)
- 停止以提示為基礎的工具呼叫編輯呼叫者的訊息，讓清單內容的系統訊息不再每輪多出一份工具清單副本 - [PR #41676](https://github.com/BerriAI/litellm/pull/41676)
- 在屬性存取時延遲解析 `litellm.proxy`，讓 `litellm.proxy._types` 能在 `import litellm` 不載入 proxy 模組的情況下運作 - [Commit 691ca03](https://github.com/BerriAI/litellm/commit/691ca03266539c7278c88a4d10eb161fc7e68e2b)
- 新增 `CustomStreamWrapper.close()`，並在同步串流結束或失敗時釋放上游連線，讓 Anthropic 與其他同步串流不再釘住池化連線 - [PR #46354](https://github.com/BerriAI/litellm/pull/46354)

### 一般 {#general}

- 在非同步影像生成、語音、轉錄與每個即時路由上遵循明確的 `custom_llm_provider` 與 `api_base`，讓裸名自訂模型名稱不再以 `LLM Provider NOT provided` 失敗 - [PR #36346](https://github.com/BerriAI/litellm/pull/36346)
- 在 `GET /v1/models` 上顯示列出之團隊或金鑰別名的目標模型中繼資料，並停止在 `GET /v1/models/{model_id}` 上對別名（包含路由器 `model_group_alias` 名稱）回傳 404 - [PR #41041](https://github.com/BerriAI/litellm/pull/41041)
- 在為 Perplexity、Jina、Tavily 與其他提供者加入路由前，先剝除 `api_base` 的結尾斜線，讓 URL 不再出現回傳 404 或 403 的 `//` - [PR #42887](https://github.com/BerriAI/litellm/pull/42887)
- 在 `/v1/chat/completions` 上透傳提供者回應中的 `refusal`、`logprobs` 與 `system_fingerprint`（包含明確的 null），而非將 `refusal` 移入 `provider_specific_fields` - [PR #44788](https://github.com/BerriAI/litellm/pull/44788)
- 當提供者錯誤命中 assistants 與 threads 路由時保留對應的狀態與訊息，讓提供者 404 回傳 404 而非空白 500，且主體中的檔案路徑與機密已被清除 - [PR #44994](https://github.com/BerriAI/litellm/pull/44994)
- 在網頁搜尋、程式碼解譯器與 headroom 攔截的強制非串流呼叫中丟棄 `stream_options`，並在最終串流上重播它，讓串流請求不再於 Azure 上以 400 失敗 - [PR #45433](https://github.com/BerriAI/litellm/pull/45433)
- 對沒有 `file` 的 OCR 請求、反轉的每日活動日期範圍、`/v1/responses` 上為 0 的 `max_output_tokens`，以及超過 16 個向量儲存檔案屬性，回傳與提供者相符的 400，而非 500 或無聲變更的 200 - [PR #45537](https://github.com/BerriAI/litellm/pull/45537)
- 在原生聊天、Responses、Messages 與 OCR 路由上，讓呼叫前 hook 刪除的請求欄位與標頭不出現於提供者請求中 - [PR #45692](https://github.com/BerriAI/litellm/pull/45692)
- 為來自 Anthropic、Bedrock Converse 與 Databricks 的串流 `thinking_blocks` 加入 `index`，讓 OpenAI SDK 的 `client.chat.completions.stream()` 輔助工具不再於推理輸出上當掉 - [PR #46611](https://github.com/BerriAI/litellm/pull/46611)
- 在聊天補全上攔截 OpenAI 的裸 `{"type": "web_search"}` 工具，讓 Claude 模型不再回傳 500、OpenAI 模型不再回傳 400 - [PR #46736](https://github.com/BerriAI/litellm/pull/46736)

## 管理端點 / UI {#management-endpoints--ui-1}

### 管理 UI {#admin-ui}

#### 自動路由器 {#auto-routers}

- 在自動路由器設定中將分類器、層級與進階設定分組，並讓新的決策路由器挑選已上線的決策模型，而非輸入提供者與原始模型名稱 - [PR #45913](https://github.com/BerriAI/litellm/pull/45913)

#### 一般 {#general-1}

- 新增 Settings、Telemetry 頁面，每個遙測群組有一個開關與目的地挑選器，只在該群組開啟時才記錄頁面檢視與分頁點擊 - [PR #45494](https://github.com/BerriAI/litellm/pull/45494)
- 還原儀表板對話框背後的背景模糊 - [PR #45866](https://github.com/BerriAI/litellm/pull/45866)
- 移除深色模式切換上的 beta 標記 - [PR #46305](https://github.com/BerriAI/litellm/pull/46305)
- 移除 Memory、Prompts、Agent Builder 與 MCP Network Settings 上的棄用橫幅，並讓它在 Workflows、舊 Usage 頁面與 API Reference 分頁上永久顯示 - [PR #46314](https://github.com/BerriAI/litellm/pull/46314)
- 將新版本通知從橫幅移到通知鈴鐺中，該鈴鐺現在列出公告且每項有已讀狀態 - [PR #46334](https://github.com/BerriAI/litellm/pull/46334)
- 以標頭健康圖示、一個警示橫幅與側邊面板取代堆疊的部署警告橫幅，proxy 管理員可在面板中延後、忽略或還原每個警告 - [PR #46498](https://github.com/BerriAI/litellm/pull/46498)
- 在搜尋工具的新增與編輯表單中加入 Cost per Query (USD) 欄位，並在編輯工具時保留已儲存的價格 - [PR #46723](https://github.com/BerriAI/litellm/pull/46723)
- 從新的 `GET /management/v1/users/me` 讀取已登入使用者的角色，而非工作階段 cookie，且在無法載入時登出 - [PR #47224](https://github.com/BerriAI/litellm/pull/47224)

#### 首頁與 LiteAdmin {#home-and-liteadmin}

- 讓 LiteAdmin 透過需確認的工具將金鑰與其團隊分離，並在新聊天中預選一個可存取的 Sonnet 5.5 模型 - [PR #45625](https://github.com/BerriAI/litellm/pull/45625)
- 在 Home 加入 LiteAdmin 編寫器與獨立的 LiteAdmin 聊天分頁，讓 New chat 開啟分頁而非清除目前對話 - [PR #46068](https://github.com/BerriAI/litellm/pull/46068)
- 將 Home 上的 LiteAdmin 簡化為獨立標題與一個帶可編輯建議的編寫器，並將虛擬金鑰動作放在 Home 標題旁 - [PR #46301](https://github.com/BerriAI/litellm/pull/46301)
- 加寬 Home 上的 LiteAdmin 模型挑選器，讓較長的模型名稱能容納 - [PR #46446](https://github.com/BerriAI/litellm/pull/46446)
- 將 Home 的 Create New Virtual Key 按鈕以預設樣式放在標題下，如同 Virtual Keys 頁面 - [PR #46778](https://github.com/BerriAI/litellm/pull/46778)

#### 記錄 {#logs}

- 在 `/key/list` 與 `/team/list` 等儀表板資訊路由上跳過過期管理 UI 工作階段金鑰的失敗資料列，讓過時分頁不再以 401 資料列灌滿 Request Logs - [PR #45881](https://github.com/BerriAI/litellm/pull/45881)

#### 模型 + 端點 {#models--endpoints}

- 透過將提供者鍵解析為後端宣告的 slug，修正 Add Model 對 14 個提供者（包含 MiniMax、Cursor 與 SageMaker）顯示空模型欄位的問題 - [PR #43707](https://github.com/BerriAI/litellm/pull/43707)
- 在 Models and Endpoints 中加入含 All、Active 與 Paused 選項的 Status 篩選器 - [PR #43710](https://github.com/BerriAI/litellm/pull/43710)
- 在編輯對話框中顯示 LiteLLM 簽署之 Anthropic 憑證的公開 JWKS，並附 Copy JWKS 按鈕 - [PR #45527](https://github.com/BerriAI/litellm/pull/45527)
- 為 Microsoft 365 Copilot 模型顯示 Microsoft 365 Copilot 標誌而非 Azure 標誌 - [PR #45687](https://github.com/BerriAI/litellm/pull/45687)
- 修正憑證編輯儲存到不同憑證的問題，將 `PATCH /credentials` 合併到寫入者的資料列，對 `config.yaml` 中定義的名稱以 409 拒絕 `POST /credentials`，並在管理 UI 中顯示每個憑證的名稱與來源 - [PR #45835](https://github.com/BerriAI/litellm/pull/45835)
- 停用 `config.yaml` 擁有的模型群組別名的新增、編輯與刪除控制項，並在別名分頁上顯示唯讀通知 - [PR #45857](https://github.com/BerriAI/litellm/pull/45857)
- 將 `config.yaml` 擁有的路由器設定與備援變灰，附徽章與工具提示，並在儲存時跳過它們 - [PR #45861](https://github.com/BerriAI/litellm/pull/45861)
- 在點擊 Test Connect 時執行 Add Model 驗證，讓不完整的表單顯示行內錯誤而非以 `t[0] is undefined` 當掉，並在成功新增後清除提供者輸入 - [PR #46834](https://github.com/BerriAI/litellm/pull/46834)

#### Playground 與 Decisions {#playground-and-decisions}

- 在公開 Model Hub 中將成本對照表決策模型顯示為 decisions，並在 AI Hub 中列出受支援者，附文件連結與預填的 Add Model 表單 - [PR #45965](https://github.com/BerriAI/litellm/pull/45965)
- 為 Decisions playground 提供有標籤的設定卡、一張含 Form 與 cURL 分頁的編輯器卡，以及永遠可見的 Response 卡 - [PR #45981](https://github.com/BerriAI/litellm/pull/45981)
- 在 Model Hub 模式篩選器、Mode 欄與防護欄決策模型挑選器中，將舊版 `evaluation` 模式顯示為 `decisions` - [PR #46098](https://github.com/BerriAI/litellm/pull/46098)
- 以問題鍵而非索引標記 Decisions playground 的問題，並修正 Response 卡標頭的對齊 - [PR #46145](https://github.com/BerriAI/litellm/pull/46145)

#### 團隊、使用者與存取群組 {#teams-users-and-access-groups}

- 將團隊與組織成員表格以 25 列分頁，並從每團隊只建一次的對照表中查找預算資料列，讓有數千成員的團隊能快速開啟 - [PR #26667](https://github.com/BerriAI/litellm/pull/26667)
- 在 Virtual Keys 表格、團隊 Virtual Keys 分頁與金鑰詳細頁面上，為沒有自身預算的金鑰顯示 `$X of $Y (team member)`，而非 Unlimited - [PR #43927](https://github.com/BerriAI/litellm/pull/43927)
- 將金鑰編輯的 `Team ID` 欄位改名為 `Team`，以別名列出團隊，並加入將金鑰與其團隊分離的清除按鈕 - [PR #45629](https://github.com/BerriAI/litellm/pull/45629)
- 在成員表單中接受含有 `#` 的電子郵件地址，讓 Entra ID 訪客的預算與速率限制編輯能運作 - [PR #45688](https://github.com/BerriAI/litellm/pull/45688)

#### 用量 {#usage}

- 新增 `GET /user/daily/activity/aggregated/users`、Usage Overview 上的 Top Users by Spend 面板與 User Activity 分頁，讓 JWT 驗證的使用者出現在用量中 - [PR #45310](https://github.com/BerriAI/litellm/pull/45310)
- 在 Usage 中加入僅管理員可見的 Errors 分頁，含隨時間的錯誤率、按狀態碼的失敗請求，以及按金鑰、團隊、使用者與模型的失敗 - [PR #45396](https://github.com/BerriAI/litellm/pull/45396)
- 將 Usage Overview 圖表標題定為 `Daily usage`（或 `Weekly usage`），並將排名模型清單標記為 `Top models` - [PR #45604](https://github.com/BerriAI/litellm/pull/45604)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 在 `/v1/model/info` 上列出團隊存取群組模型，並讓有自身模型清單的金鑰在清單路由與 `GET /v1/models/{model_id}` 上看不到它們無法呼叫的團隊模型 - [PR #32599](https://github.com/BerriAI/litellm/pull/32599)
- 對未知金鑰回傳純文字的 `Invalid API key provided.` 401，不含金鑰表名稱或送出金鑰的雜湊 - [PR #39787](https://github.com/BerriAI/litellm/pull/39787)
- 在對無效 `key_alias` 回傳的 400 中指明被拒絕的控制字元與 `..` 路徑段 - [PR #41412](https://github.com/BerriAI/litellm/pull/41412)
- 在封鎖已儲存後，從 `POST /customer/block` 回傳 HTTP 200 與被封鎖的終端使用者，而非 500 - [PR #41677](https://github.com/BerriAI/litellm/pull/41677)
- 新增可選擇啟用的 `personal_key_model_access_from_teams`，讓個人金鑰能呼叫其擁有者目前團隊的模型聯集並在 `/v1/models` 上列出，每次請求都檢查 - [PR #43692](https://github.com/BerriAI/litellm/pull/43692)
- 在專案模型存取檢查中展開 `all-team-models` 值，讓設為 All Team Models 的專案中的金鑰不再收到 403 `project_model_access_denied` - [PR #43734](https://github.com/BerriAI/litellm/pull/43734)
- 在產生、更新、重新產生與批次更新金鑰時檢查專案擁有權，並在其他團隊的金鑰仍附著時拒絕將專案移到另一團隊 - [PR #44165](https://github.com/BerriAI/litellm/pull/44165)
- 新增 proxy 管理員團隊設定 `require_trace_id`，當團隊的 LLM、MCP 與 A2A 請求未帶 trace ID 時以 HTTP 400 拒絕，並在團隊頁面上有開關 - [PR #44933](https://github.com/BerriAI/litellm/pull/44933)
- 新增 `raise_max_budget` 團隊管理員可編輯欄位（預設關閉），讓團隊管理員將其團隊的 `max_budget` 提高到組織上限 - [PR #45404](https://github.com/BerriAI/litellm/pull/45404)
- 在團隊管理員可編輯欄位下新增可選擇啟用的 `create_member_keys`，讓團隊管理員透過 `/key/generate` 與 Create Key 表單為 internal user 與 viewer 隊友建立 LLM API 金鑰 - [PR #45870](https://github.com/BerriAI/litellm/pull/45870)
- 預設強制 `enforce_fallback_model_access`，讓設定與請求主體中對呼叫者允許模型之外模型的備援被跳過，並回傳主要模型的錯誤 - [PR #46127](https://github.com/BerriAI/litellm/pull/46127)
- 新增四個可選擇啟用的 Team 管理員可編輯欄位（成員預設預算、預算期間、TPM 限制與 RPM 限制），讓團隊管理員能從團隊 Settings 分頁管理它們 - [PR #46353](https://github.com/BerriAI/litellm/pull/46353)
- 在 Team 管理員可編輯欄位下新增可選擇啟用的 `soft_budget` 條目，讓團隊管理員能從團隊 Settings 分頁設定其團隊的軟預算 - [PR #46485](https://github.com/BerriAI/litellm/pull/46485)
- 在每次 `/user/update` 與 `/user/bulk_update` 時逐出並廣播快取的使用者，讓僅模型或僅角色的變更立即在每個 proxy 上生效，而非等快取條目過期 - [PR #46500](https://github.com/BerriAI/litellm/pull/46500)
- 在 Team 管理員可編輯欄位下新增可選擇啟用的 `metadata` 條目，讓團隊管理員能編輯其團隊的中繼資料，而 proxy 控制的中繼資料鍵仍歸 proxy 管理員 - [PR #46506](https://github.com/BerriAI/litellm/pull/46506)
- 當 JWT 對應到虛擬金鑰時遵循 `end_user_id_jwt_field`，讓支出資料列、客戶預算與限制使用已驗證的終端使用者宣告，優先於主體 `user` 或 `x-litellm-end-user-id` 標頭 - [PR #46637](https://github.com/BerriAI/litellm/pull/46637)
- 為 `/team/delete` 交易給予 30 秒逾時，讓並行的首次 SSO 登入落在同一帳號而非 500，停止支出中繼資料合併中的間歇性 500，並在表單重新整理時保留金鑰設定草稿 - [PR #47043](https://github.com/BerriAI/litellm/pull/47043)

### SSO 與 SCIM {#sso-and-scim}

- 以 HTTP 401 拒絕解析不出使用者 id 的 SSO 登入，並在 Graph 回傳錯誤而非個人檔案時讓 Microsoft 登入失敗，讓空白帳號工作階段永遠不會被建立 - [PR #44098](https://github.com/BerriAI/litellm/pull/44098)
- 在一個鎖定的交易中寫入 SCIM 群組的完整名冊，讓對有數百成員的 `/scim/v2/Groups` 的 `POST`、`PUT` 與 `PATCH` 不再於負載平衡器逾時 - [PR #45197](https://github.com/BerriAI/litellm/pull/45197)
- 以與密碼登入相同的輔助工具儲存 SSO 交換 token，讓 UI 工作階段 cookie 在 https 部署上保留其 `Secure` 旗標 - [PR #45840](https://github.com/BerriAI/litellm/pull/45840)
- 當通用 SSO userinfo 回應不是 JSON 時回退到 `id_token` 宣告，並在沒有可用 `id_token` 時回傳指明 userinfo 端點的 401 `auth_error`，而非 500 - [PR #46187](https://github.com/BerriAI/litellm/pull/46187)
- 每次推送以一個分塊查詢解析 SCIM 群組成員身分，而非每成員一個查詢，將 851 名成員無變更的 `PUT` 在 2 萬使用者表格上從約 11 秒縮短 - [PR #46412](https://github.com/BerriAI/litellm/pull/46412)
- 將通用、Google 與 Microsoft 提供者的 SSO token 交換與 userinfo 呼叫透過 LiteLLM 的 httpx 用戶端路由，讓非 PKCE 登入遵循 `ssl_verify` 與 `SSL_VERIFY`，IdP 連線失敗時回傳指明端點的 401 - [PR #46547](https://github.com/BerriAI/litellm/pull/46547)
- 只要 Redis 已設定，就透過 Redis 共用 SAML 登入狀態，無需 `enable_redis_auth_cache`，讓落在另一副本或 worker 上的回呼不再回傳 401 - [PR #46807](https://github.com/BerriAI/litellm/pull/46807)

### 模型管理 {#model-management}

- 以 `model_info.successor_model` 指明棄用中部署的替代者，顯示於 `GET /v1/model/deprecations` 與每日 Slack 棄用警示中 - [PR #41670](https://github.com/BerriAI/litellm/pull/41670)
- 在呼叫提供者前，從部署的 `litellm_params` 中丟棄 `supports_max_reasoning_effort` 等模型能力旗標，並在載入時警告將它們移到 `model_info` - [PR #46647](https://github.com/BerriAI/litellm/pull/46647)

### 用量與分析 {#usage-and-analytics}

- 按 HTTP 狀態以及金鑰、團隊、使用者與模型群組記錄失敗請求，並從僅管理員可用的 `GET /gateway/errors/activity` 提供，同時在 `GET /gateway/daily/activity` 中加入 `by_status_code` - [PR #45244](https://github.com/BerriAI/litellm/pull/45244)
- 為非管理員呼叫者將 `/global/activity/cache_hits` 限定於呼叫者自身與被允許團隊的記錄，包含其金鑰別名與模型篩選選項 - [PR #46210](https://github.com/BerriAI/litellm/pull/46210)

### Proxy 設定 {#proxy-configuration}

- 當 `config.yaml` 中設定了 `router_settings.fallbacks` 時，以 400 拒絕 `POST /fallback` 與 `DELETE /fallback/{model}`，與 `/config/update` 一致 - [PR #45860](https://github.com/BerriAI/litellm/pull/45860)
- 將空白的數字環境變數視為未設定，讓 proxy 不再於開機時當機迴圈，並將空白的防護欄 `litellm_params` 環境值解析為欄位預設值，而非無聲丟棄防護欄 - [PR #46341](https://github.com/BerriAI/litellm/pull/46341)
- 將清單值的稽核記錄變更以 JSON 文字儲存，讓帶有清單的變更（例如忽略或延後部署警告）被寫入稽核記錄而非失敗 - [PR #46555](https://github.com/BerriAI/litellm/pull/46555)
- 在稽核記錄值中將 JSON null 保持為 null，而非儲存字串 `None`，讓清除的預算讀作空值，同時金鑰保持遮罩 - [PR #46577](https://github.com/BerriAI/litellm/pull/46577)
- 還原 `LITELLM_FIPS_MODE` 啟動閘門及其喧鬧的密碼遷移失敗，因為其 FIPS 探測會誤報真正強制執行的執行階段 - [PR #46740](https://github.com/BerriAI/litellm/pull/46740)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- 為 Claude Code marketplace 外掛加入 `installation_preference` 欄位（`available`、`auto_install` 或 `required`），並在 `marketplace.json` 中以 `installationPreference` 發出，讓 Claude Desktop 能自動安裝封存外掛 - [PR #41430](https://github.com/BerriAI/litellm/pull/41430)
- 透過存取群組以 `access_skill_names` 授予私有 Claude Code 技能，讓群組的團隊與金鑰在 `/claude-code/plugins` 上看到它們，並在團隊 Skills 卡上將群組授予的技能顯示為繼承 - [PR #46294](https://github.com/BerriAI/litellm/pull/46294)
- 在 `lite` shell 中以真實名稱執行 `credentials list` 等群組子命令，保持引號 JSON 引數完整，並從 `lite login` 在伺服器上開啟裸 `lite` shell - [PR #46511](https://github.com/BerriAI/litellm/pull/46511)

### 部署 {#deployment}

- 新增 `GET /health/deployment_warnings` 列出含嚴重程度的啟用中警告，以及 `PATCH /health/deployment_warnings/{warning_id}` 讓每位管理員忽略或延後一個警告最長 30 天，變更寫入稽核記錄 - [PR #46347](https://github.com/BerriAI/litellm/pull/46347)
- 當 STS 拒絕 `AWS_ROLE_NAME` 的直接 web identity 交換時，透過 pod 的 IRSA 角色串連 RDS IAM 資料庫驗證，讓只信任 pod 角色的資料庫角色能在啟動時連線 - [PR #46540](https://github.com/BerriAI/litellm/pull/46540)
- 為 RDS IAM 驗證將 `AWS_SESSION_TOKEN` 轉送到 STS AssumeRole 與直接 RDS 用戶端，讓 proxy 以暫時 AWS 憑證啟動，而非以 `InvalidClientTokenId` 失敗 - [PR #46559](https://github.com/BerriAI/litellm/pull/46559)

### Terraform {#terraform}

- 在 Terraform 提供者中停止於 `litellm_user` 更新時送出 `blocked`，讓變更使用者不再以來自 `/user/update` 的 400 失敗 - [PR #45410](https://github.com/BerriAI/litellm/pull/45410)
- 為 `litellm_team` 加入可選的 `team_member_model_max_budget` JSON 字串，從 `/team/info` 讀回，讓帶外編輯顯示為漂移，並在屬性被移除時清除上限 - [PR #46274](https://github.com/BerriAI/litellm/pull/46274)
- 新增可選擇啟用的唯寫 `*_wo` 機密屬性及 `*_wo_version` 夥伴（例如 `credential_values_wo`），讓機密不進入 state，並讓 `litellm_mcp_server` 能設定 `client_id`、`client_secret_wo` 與 `auth_value_wo` - [PR #46538](https://github.com/BerriAI/litellm/pull/46538)
- 在 MCP 伺服器、模型、金鑰與組織請求上接受 proxy 的任何 2xx，讓 `201` 或 `202` 不再讓 `terraform apply` 或 `terraform destroy` 失敗或讓資源不在 state 中 - [PR #46550](https://github.com/BerriAI/litellm/pull/46550)
- 透過將 `alias` 設為 computed、當 proxy 未回傳時保留設定的 `spec_version`，以及將只有未建模欄位的 `mcp_info` 儲存為空，停止 `litellm_mcp_server` 上永久的 plan 差異 - [PR #46781](https://github.com/BerriAI/litellm/pull/46781)
- 將 `additional_drop_params` 以部署的丟棄清單送到 proxy，而非刪除它指名的鍵，並將其讀回，讓漂移出現在 `terraform plan` 中 - [PR #46782](https://github.com/BerriAI/litellm/pull/46782)

## AI 整合 {#ai-integrations-1}

### Lens 與代理程式追蹤 {#lens-and-agent-traces}

- 將獨立的 Lens UI 嵌入儀表板，並將已驗證的 `/lens/*` 請求委派給獨立 Lens 服務，讓 Lens 自行部署與發佈 - [PR #45529](https://github.com/BerriAI/litellm/pull/45529)
- 在閘道中載入 Lens 套件樣式表，讓嵌入的 Lens 顯示其版面樣式 - [PR #45829](https://github.com/BerriAI/litellm/pull/45829)

### 防護欄 {#guardrails}

- 新增內建 `airia` 防護欄，在呼叫前檢查提示、呼叫後檢查回應，依 Airia 的決定阻擋或遮蔽，並在 Gateway 回覆格式錯誤時採失敗關閉 - [PR #40784](https://github.com/BerriAI/litellm/pull/40784)
- 以 Bedrock 防護欄掃描行內 PNG 與 JPEG 圖片及文字文件，並以 400 阻擋帶有它無法掃描之附件的請求，除非設定了 `skip_unscannable_attachments: true` - [PR #43383](https://github.com/BerriAI/litellm/pull/43383)
- 在事件迴圈外刷新 HiddenLayer 防護欄 JWT，讓 401 不再阻擋不相關的請求 - [PR #45437](https://github.com/BerriAI/litellm/pull/45437)
- 當 `streaming_buffer_until_moderated` 為 `false` 時，即時串流僅偵測的 `post_call` 政策管線步驟，並在串流結束時仍掃描完整回答 - [PR #45516](https://github.com/BerriAI/litellm/pull/45516)
- 對串流 Bedrock Converse 回應的每個內容區塊各自套用防護欄，讓被遮蔽的區塊不再損壞串流或破壞平行工具呼叫 JSON - [PR #45822](https://github.com/BerriAI/litellm/pull/45822)
- 在呼叫者的團隊範圍內解析決策防護欄的模型，讓團隊自有模型上的防護欄不再回傳 502，且呼叫向該團隊收費 - [PR #46085](https://github.com/BerriAI/litellm/pull/46085)
- 在 execute-policy 主體中將請求的頂層 `user` 字串送到 Zscaler AI Guard - [PR #46094](https://github.com/BerriAI/litellm/pull/46094)
- 新增 `wingback` 防護欄，將聊天請求送到 Wingback 檢查 - [PR #46136](https://github.com/BerriAI/litellm/pull/46136)
- 將 Airia 防護欄卡片與標誌加入 Guardrail Garden 與防護欄提供者清單 - [PR #46562](https://github.com/BerriAI/litellm/pull/46562)
- 為 `noma_v2` 以及帶 `use_v2: true` 的 `noma`，從 Noma v2 防護欄設定讀取四個 `streaming_*` 鍵，讓緩衝與掃描節奏設定生效 - [PR #46606](https://github.com/BerriAI/litellm/pull/46606)
- 在 `logging_only` 模式下將每個內容篩選命中記錄為 `guardrail_flagged` 並給風險分數 10，繼續掃描回應，並在管理 UI 模式挑選器中提供 `logging_only` - [PR #46673](https://github.com/BerriAI/litellm/pull/46673)
- 在 post_call 防護欄掃描時轉送 Bedrock 透傳 `converse-stream` 框架，也掃描 Claude `invoke-with-response-stream` 輸出，並以 SDK 能讀的 AWS 例外結束被阻擋的串流 - [PR #47157](https://github.com/BerriAI/litellm/pull/47157)
- 以聊天補全形狀將 Bedrock Converse 訊息與工具送到防護欄，並將其遮蔽寫回 Converse 請求；當編輯無法安全寫回時回傳 500 - [PR #47234](https://github.com/BerriAI/litellm/pull/47234)

### 記錄與可觀測性 {#logging-and-observability}

#### Azure Storage {#azure-storage}

- 當 `audit_log_callbacks` 包含 `azure_storage` 時，將稽核記錄事件以 JSON 檔案上傳到 Azure Storage 的 `audit_logs/` 下 - [PR #43838](https://github.com/BerriAI/litellm/pull/43838)

#### Datadog {#datadog}

- 為 JWT 驗證的請求以 `litellm.user_email` 標記 Datadog spans，並在 `/model_group/info` 與 Model Hub 表格中顯示 `model_info.description` - [PR #42749](https://github.com/BerriAI/litellm/pull/42749)

#### FOCUS 與 Ternary {#focus-and-ternary}

- 新增 `ternary` 回呼，將 LiteLLM 支出以每日 FOCUS CSV 匯出到 Ternary，只在首次匯出時載入 polars，並在任何 Postgres 時區下依資料列自身的 `date` 保留資料列 - [PR #46106](https://github.com/BerriAI/litellm/pull/46106)

#### 一般 {#general-2}

- 當訊息遮蔽開啟時，從回呼承載中遮蔽巢狀請求主體與 `provider_specific_fields` 中的推理 - [PR #45923](https://github.com/BerriAI/litellm/pull/45923)
- 在 `/health/services` 上接受每個已知的記錄回呼，讓管理 UI 的 Test 按鈕能用於 zerobus 等記錄器，而非回傳 400 `Service must be in list`；並對已知但未設定的記錄器回傳 400 - [PR #46297](https://github.com/BerriAI/litellm/pull/46297)
- 當設定的記錄回呼 SDK 缺失或超出支援版本範圍時，讓 proxy 啟動以指明記錄器的錯誤失敗，而非在第一個請求時回傳 500 - [PR #46378](https://github.com/BerriAI/litellm/pull/46378)

#### Langfuse {#langfuse}

- 在 Langfuse 中記錄串流 `/v1/responses` 呼叫以及橋接到 Responses API 的聊天呼叫的 token 用量，而非顯示 0 輸入與 0 輸出 tokens - [PR #42212](https://github.com/BerriAI/litellm/pull/42212)

#### OpenTelemetry {#opentelemetry}

- 當 `LITELLM_OTEL_V2=1` 時，在取樣回應上回傳 W3C `traceresponse` 標頭，指明追蹤與閘道的伺服器 span，該 span 帶有回應的 `litellm.call_id` - [PR #42079](https://github.com/BerriAI/litellm/pull/42079)
- 讓團隊或金鑰能為其自身的 OTel v2 目的地將 `callback_vars.capture_message_content` 設為 `no_content` 或 `span_only`，覆寫全域設定 - [PR #44264](https://github.com/BerriAI/litellm/pull/44264)
- 讓團隊或金鑰能設定 `callback_vars.excluded_services`，為其自身目的地覆寫全域 OTel v2 排除服務，其中 `none` 表示不排除任何服務 - [PR #45880](https://github.com/BerriAI/litellm/pull/45880)

#### Prometheus {#prometheus}

- 在 `PROMETHEUS_MULTIPROC_DIR` 下，將 `litellm_redis_circuit_breaker_state` 跨 worker 程序以每狀態一個序列收集，讓回收的 Celery 或 gunicorn worker 不再堆積序列 - [PR #46357](https://github.com/BerriAI/litellm/pull/46357)
- 透過 Prometheus services 記錄器回報 Redis 斷路器指標，讓 Redis 快取不再未經要求就在預設註冊表上註冊 `litellm_redis_circuit_breaker_*` 收集器 - [PR #46484](https://github.com/BerriAI/litellm/pull/46484)

#### S3 {#s3}

- 將 S3 物件鍵檔名限制在 255 個 UTF-8 位元組內，保留回應 ID 的開頭加上 SHA-256，讓長 `/v1/responses` ID 的 `s3_v2` 記錄能上傳到檔案系統後端的儲存，並以 `aws s3 cp` 下載 - [PR #40825](https://github.com/BerriAI/litellm/pull/40825)
- 以 `S3_UPLOAD_ATTEMPT_TIMEOUT_SECONDS`（預設 30）限制每次 `s3_v2` 上傳嘗試，為退避加入抖動，並在同一次排清內重試 429 與傳輸錯誤 - [PR #46340](https://github.com/BerriAI/litellm/pull/46340)

#### Sentry {#sentry}

- 一旦設定 `SENTRY_DSN` 就在開機時啟動 Sentry，除非 `SENTRY_SEND_DEFAULT_PII=true`，否則讓請求主體與框架區域變數不進入事件；在冷卻 429 上回傳 `rate_limit_error`，並將 Lens 資料列計數器匯出到 Prometheus - [PR #46344](https://github.com/BerriAI/litellm/pull/46344)

#### 遙測 {#telemetry}

- 在 `litellm.telemetry` 中新增可選擇啟用的遙測，具固定的記錄欄位允許清單與同意群組，群組只在其所有父群組都開啟時才計數 - [PR #45484](https://github.com/BerriAI/litellm/pull/45484)
- 將遙測記錄彙總為固定桶直方圖資料列，並將每個視窗以一份 JSON 報告透過 HTTP 匯出，在 429 與 5xx 回應時重試 - [PR #45487](https://github.com/BerriAI/litellm/pull/45487)
- 為啟用的遙測群組記錄請求延遲、狀態與提供者嘗試，每 5 分鐘排清一次，`LITELLM_TELEMETRY_DISABLED=true` 可關閉一切 - [PR #45489](https://github.com/BerriAI/litellm/pull/45489)
- 當 `LITELLM_TELEMETRY_DESTINATION=local_table` 時，將遙測報告儲存在 `LiteLLM_TelemetryReport` 表格中，跨重新啟動與 worker 保持同一個實例 ID，並新增 `GET /telemetry/reports` 供管理員匯出 - [PR #45490](https://github.com/BerriAI/litellm/pull/45490)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting-1}

### 成本追蹤 {#cost-tracking}

- 將 Responses API 的 `image_generation` 工具呼叫，以及只在 `tool_usage.web_search.num_requests` 中回報的網頁搜尋，以 `tool_usage_cost` 計費 - [PR #41877](https://github.com/BerriAI/litellm/pull/41877)
- 以 `model_info.ptu_shares` 將一個 Azure PTU 部署跨團隊拆分，將每份份額強制為每團隊 token 上限，在每日彙總中跨團隊分攤固定成本，並在團隊用量中回報 PTU 小時 - [PR #43043](https://github.com/BerriAI/litellm/pull/43043)
- 在 `cost_discount_config` 中接受 `<provider>/<model-pattern>` 鍵（例如 `vertex_ai/claude-*`），並在管理 UI 的 Provider Discounts 表單中提供 Model pattern 欄位 - [PR #43335](https://github.com/BerriAI/litellm/pull/43335)
- 在定價層級中保留明確的零每小時快取寫入費率，而非以一般寫入費率為這些寫入計費 - [PR #45545](https://github.com/BerriAI/litellm/pull/45545)
- 在有資料庫的 proxy 上，將背景 Responses 呼叫向建立者的金鑰、團隊、使用者、終端使用者與標籤計費一次，而非在每次讀取與背景輪詢時再次計費 - [PR #45703](https://github.com/BerriAI/litellm/pull/45703)
- 將來自 URL 上下文、程式碼執行與 File Search 的 Gemini 工具使用提示 tokens 以輸入計費，讓回報 14,138 個提示 tokens 的回應不再只記錄 23 的輸入成本 - [PR #46021](https://github.com/BerriAI/litellm/pull/46021)
- 將 Anthropic `fast` 倍率套用到 `cost_breakdown` 中的快取讀取與快取建立成本，讓它們加總等於計費的 `input_cost` - [PR #46112](https://github.com/BerriAI/litellm/pull/46112)
- 依 `usage.server_tool_use.web_search_requests` 為 `azure_ai` Claude 網頁搜尋逐次計費，而非每次回應計費一次 - [PR #46114](https://github.com/BerriAI/litellm/pull/46114)
- 以部署自訂的 `input_cost_per_token` 與 `output_cost_per_token` 費率計費，而非上游 `x-litellm-response-cost` 標頭，讓串連的 LiteLLM proxies 遵循營運者的價格 - [PR #46120](https://github.com/BerriAI/litellm/pull/46120)
- 為結尾是 `eu.` 或 `us.` 前綴模型 id 的 Bedrock 推論設定檔 ARN，以該區域價格資料列計費，而非基礎模型資料列 - [PR #46128](https://github.com/BerriAI/litellm/pull/46128)
- 對帶有自有價格的部署，也依每次請求為 `azure_ai` Claude 網頁搜尋計費，而非每次回應計費一次 - [PR #46135](https://github.com/BerriAI/litellm/pull/46135)
- 將 Gemini 與 Vertex AI 明確上下文快取建立 tokens 從 `cachedContents` 回應以 `cache_creation_input_tokens` 計費，讓快取建立不再被少計費 - [PR #46144](https://github.com/BerriAI/litellm/pull/46144)
- 讓 Vertex AI 快取建立 token 數不進入請求 kwargs，並將負數夾到 0，讓請求主體無法改變計費 tokens - [PR #46152](https://github.com/BerriAI/litellm/pull/46152)
- 為非管理員呼叫者將 `/spend/tags` 限定於呼叫者自身與被允許團隊的記錄，並讓其 `start_date` 與 `end_date` 參數篩選彙總視窗 - [PR #46194](https://github.com/BerriAI/litellm/pull/46194)
- 當 `chatgpt/` 部署自身的提供者資料列沒有費率時，透過 `model_info.base_model` 為其定價，而非記錄 $0 支出 - [PR #46318](https://github.com/BerriAI/litellm/pull/46318)
- 將 `xai` 支出資料列拆分到 `input_cost` 與 `output_cost`，而非將總額全記為輸出 - [PR #46320](https://github.com/BerriAI/litellm/pull/46320)
- 在回應快取命中時，於 `x-litellm-response-cost` 中回報 `response_cost` 為 0，讓標頭與 `/spend/logs` 相符 - [PR #46471](https://github.com/BerriAI/litellm/pull/46471)
- 將 `agentcore/search` 定價為每次查詢 0.007 USD，與 AWS 的每 1,000 次查詢 7 USD 一致，而非 0 - [PR #46571](https://github.com/BerriAI/litellm/pull/46571)
- 使用新的可選 `input_cost_per_text_message` 定價欄位，依音訊秒數加用戶端文字訊息為 xAI Grok Voice 即時工作階段計費，而非記錄 $0 支出 - [PR #46600](https://github.com/BerriAI/litellm/pull/46600)
- 從橋接轉譯出的聊天補全為橋接 `/v1/messages` 呼叫的推理 tokens 定價，讓 `cost_breakdown.reasoning_cost` 永遠存在，且 `output_cost` 與 `spend` 一致 - [PR #46726](https://github.com/BerriAI/litellm/pull/46726)
- 為故障移轉到未定價備援的搜尋工具，以備援自身的價格計費，而非失敗主要來源的 `input_cost_per_query` - [PR #46734](https://github.com/BerriAI/litellm/pull/46734)
- 比照原生 `/v1/responses`，為橋接 `/v1/messages` 的 Responses 回覆就推理 tokens 與 flex 服務層級計費 - [PR #47009](https://github.com/BerriAI/litellm/pull/47009)

### 支出記錄與每日彙總 {#spend-logs-and-daily-rollups}

- 在支出記錄、ClickHouse 資料列與終端使用者表格中遵循 `litellm_settings.disable_end_user_cost_tracking`，並停止讓失敗請求建立客戶資料列 - [PR #40945](https://github.com/BerriAI/litellm/pull/40945)
- 將支出記錄清理的刪除批次限制在 Postgres 陳述式逾時內，而非 Prisma 的 5 秒交易逾時，讓緩慢批次不再以 422 失敗，過期記錄能被刪除 - [PR #43279](https://github.com/BerriAI/litellm/pull/43279)
- 在寫入者上執行 `POST /global/spend/refresh` 而非讀取副本，讓它不再失敗，舊 Usage 頁面也顯示最新的每月總額 - [PR #45699](https://github.com/BerriAI/litellm/pull/45699)
- 為對路由器模型的 `/vllm` 聊天與文字補全呼叫寫入支出記錄資料列（這些呼叫曾讓金鑰、團隊與使用者支出為零），也為有同步成功回呼之 proxy 上的 `/azure` 與 `/azure_ai` 呼叫寫入 - [PR #45733](https://github.com/BerriAI/litellm/pull/45733)
- 新增 `general_settings.disable_requester_ip_address_logging`，在新的支出記錄資料列中儲存 null 呼叫者 IP，並遮蔽已儲存標頭與錯誤中的 IP，也可在管理 UI 的 General Settings 中切換 - [PR #45804](https://github.com/BerriAI/litellm/pull/45804)
- 在 `db_scripts/partition_spend_logs.sql` 中將 call-id 索引與其他六個索引一併移開，讓下一個遷移工作在支出記錄分區後不再以索引已存在的錯誤失敗 - [PR #46131](https://github.com/BerriAI/litellm/pull/46131)

### 預算 {#budgets}

- 在 LLM 路由上強制執行 JWT 帶有 proxy 管理員角色之使用者的個人 `max_budget`，如同對其他使用者已有的作法 - [PR #43070](https://github.com/BerriAI/litellm/pull/43070)
- 在 `/team/new` 與 `/team/update` 上新增 `team_member_model_max_budget`，在 `/team/member_update` 上新增 `model_max_budget`，用於每模型團隊成員預算，超預算請求依 `router_settings.fallbacks` 處理，並在管理 UI 中有對應編輯器 - [PR #43887](https://github.com/BerriAI/litellm/pull/43887)
- 在每個 `model_max_budget_usage` 條目上回報 `budget_reset_at`，並讓每月預算視窗在開啟後一個日曆月結束，以 UTC 計算 - [PR #45797](https://github.com/BerriAI/litellm/pull/45797)
- 以每頁 `RESET_BUDGET_JOB_BATCH_SIZE` 筆已提交資料列重置終端使用者支出，讓預算重置工作在 `LiteLLM_EndUserTable` 有數百萬筆資料列時仍能提交 - [PR #46502](https://github.com/BerriAI/litellm/pull/46502)

### 速率限制 {#rate-limiting}

- 新增 `general_settings.disable_fallbacks_on_per_model_rate_limits`，讓每模型的金鑰、團隊、組織與專案限制（`model_rpm_limit`、`model_tpm_limit`）回傳 429，而非在備援上重試 - [PR #45459](https://github.com/BerriAI/litellm/pull/45459)
- 只從被准入的 Responses WebSocket 釋放舊版速率限制器的槽位，讓被拒絕的即時嘗試不再於 `LEGACY_MULTI_INSTANCE_RATE_LIMITING` 下降低金鑰的進行中計數 - [PR #46822](https://github.com/BerriAI/litellm/pull/46822)

## MCP 閘道 {#mcp-gateway-1}

### 驗證與 OAuth {#auth-and-oauth}

- 向 Google 上游 OAuth 提供者請求離線存取與同意，讓 Google MCP 連線收到刷新 tokens - [PR #41197](https://github.com/BerriAI/litellm/pull/41197)
- 在零支出的 MCP 探索路由與 JSON-RPC 方法（例如 `/mcp-rest/tools/list`、`/v1/mcp/tools`、`initialize` 與 `tools/list`）上跳過預算檢查，讓超預算金鑰仍能啟動 MCP 用戶端，同時 `tools/call` 保持強制 - [PR #41276](https://github.com/BerriAI/litellm/pull/41276)
- 當請求缺少 `litellm_key_header_name` 標頭時保留已解析的金鑰，讓使用 `Authorization` 或 `x-litellm-api-key` 的用戶端不再收到 401，MCP 工具集也能載入 - [PR #44469](https://github.com/BerriAI/litellm/pull/44469)
- 將彙總 `/mcp` 上的閘道 OAuth 同意限定於 `x-mcp-servers` 中的伺服器，並新增可選擇啟用的 `general_settings.mcp_require_explicit_server_scope`，對裸 `/mcp` 回傳 400 `mcp_server_scope_required` - [PR #44957](https://github.com/BerriAI/litellm/pull/44957)
- 讓 `/v1/mcp/server` 上的 MCP 伺服器建立與更新主體能帶四個 `token_exchange_*` 欄位，讓儲存帶 OAuth token 交換的 MCP 伺服器不再回傳 401 - [PR #45723](https://github.com/BerriAI/litellm/pull/45723)
- 只將 JSON-RPC `method` 傳給 MCP 准入驗證，讓加了額外 `model` 欄位的 `tools/call` 仍對金鑰預算進行檢查 - [PR #45844](https://github.com/BerriAI/litellm/pull/45844)
- 當受管理 OAuth 伺服器要求更多權限時保留既有範圍，並將範圍不足的拒絕以 403 OAuth 挑戰轉送，讓 MCP 用戶端能請求缺少的範圍 - [PR #45886](https://github.com/BerriAI/litellm/pull/45886)
- 新增可選的 `id_jag_resource_client_id` 與 `id_jag_resource_client_secret`，讓 ID-JAG 第二段能使用自己的機密用戶端，而非 IdP 用戶端 - [PR #46211](https://github.com/BerriAI/litellm/pull/46211)
- 當 `PROXY_BASE_URL` 已設定時，無論由誰註冊，都為設定宣告的 MCP 伺服器保存第一個 DCR 用戶端，讓非管理員使用者不再於每次存取 token 過期時被登出 - [PR #46544](https://github.com/BerriAI/litellm/pull/46544)
- 在虛擬金鑰對應後接受已驗證的 JWT 作為 OBO 主體 token，並在其缺失或無效時以 IdP 驗證說明回傳 401 - [PR #46549](https://github.com/BerriAI/litellm/pull/46549)
- 在閘道 token 端點上接受 ID-JAG 作為 RFC 7523 `jwt-bearer` 授權，並將登入的 IdP `id_token`、SAML 斷言或 OIDC 刷新 token 保留為 `oauth2_id_jag` 伺服器的主體 - [PR #47058](https://github.com/BerriAI/litellm/pull/47058)
- 當 ID-JAG 存取 token 簽署的 `resource` 只有 `{base}/mcp` 時，將其限制在 MCP 路由，並以 400 `invalid_target` 拒絕未知的 `resource` - [PR #47138](https://github.com/BerriAI/litellm/pull/47138)
- 在 MCP 伺服器的 OAuth Delegate 表單中加入 Authorization URL、Token URL 與 Scopes 欄位，並為 DCR 橋接伺服器在 `{PROXY_BASE_URL}/callback` 上註冊一個共用閘道用戶端，讓限制重新導向網域的上游接受登入 - [PR #47153](https://github.com/BerriAI/litellm/pull/47153)

### 速率限制與防護欄 {#rate-limits-and-guardrails}

- 在 JWT 到金鑰對應後，將呼叫者的 bearer 私下傳給 MCP 呼叫前防護欄，讓 Agent 365 防護欄不再拒絕有效的工具呼叫 - [PR #45746](https://github.com/BerriAI/litellm/pull/45746)
- 當閘道自身的金鑰同時以 `x-litellm-api-key` 與 `Authorization` 送出時，將其排除在傳給 MCP 防護欄的呼叫者 bearer 之外，同時呼叫者 JWT 仍抵達防護欄 - [PR #45897](https://github.com/BerriAI/litellm/pull/45897)
- 停止讓 proxy 啟動的舊版 MCP 監聽器耗用伺服器的 `rpm`，讓用戶端取得其完整設定的預算 - [PR #46982](https://github.com/BerriAI/litellm/pull/46982)

### 通訊協定與目錄 {#protocol-and-catalog}

- 在工具呼叫間，為每個閘道 `mcp-session-id` 與伺服器保持一個上游 MCP 工作階段，讓有狀態的上游伺服器在呼叫間記住狀態 - [PR #42741](https://github.com/BerriAI/litellm/pull/42741)
- 略過太長而無法嵌入的工具文字，而非讓每個 MCP 工具搜尋都以嵌入長度錯誤失敗 - [PR #43554](https://github.com/BerriAI/litellm/pull/43554)
- 透過閘道轉送 MCP 進度訊息並套用輸出防護欄，並迅速取消進行中的上游工具呼叫，而非等待工作階段鎖 - [PR #46134](https://github.com/BerriAI/litellm/pull/46134)
- 透過呼叫者範圍的串流轉送上游工具、提示與資源變更通知及資源訂閱，並在傳遞前重新檢查存取權 - [PR #46153](https://github.com/BerriAI/litellm/pull/46153)
- 將單一伺服器範圍（`/{server_name}/mcp` 或 `x-mcp-servers`）上的裸工具名稱路由到該伺服器，讓 `tools/call` 不再於尚未列出它的副本上回傳 `Tool not found` - [PR #46225](https://github.com/BerriAI/litellm/pull/46225)
- 在 `server/discover` 中公布已授權上游伺服器受支援的通知能力，保留舊版 `initialize` 旗標，並將可選探測限制在剩餘的清單預算內 - [PR #46264](https://github.com/BerriAI/litellm/pull/46264)
- 從擁有 `tool_id` 的伺服器解析 `/mcp/proxy` 上的 `get_tool_schema` 與 `call_tool`，讓緩慢的同級伺服器不再延遲呼叫 - [PR #46545](https://github.com/BerriAI/litellm/pull/46545)
- 新增 `general_settings.mcp_disabled_capabilities` 以停止公布 `prompts` 與 `resources`，並在管理 UI 的 MCP 網路設定卡上有對應開關 - [PR #46563](https://github.com/BerriAI/litellm/pull/46563)
- 透過 `__aiter__` 讀取第一個 `Router` 串流區塊，讓帶自動執行 MCP 工具的串流 `/v1/chat/completions` 不再回傳 500 - [PR #46578](https://github.com/BerriAI/litellm/pull/46578)

### 管理 MCP 與 UI {#admin-mcp-and-ui}

- 為存取群組加入 `mcp_tool_permissions`，即金鑰、團隊與代理程式繼承的每伺服器工具允許清單，空清單表示拒絕該伺服器上的每個工具，並在管理 UI 中有建立、編輯與詳細頁面 - [PR #46300](https://github.com/BerriAI/litellm/pull/46300)
- 將團隊、金鑰與使用者表單上的 MCP 伺服器挑選器限定於它們能觸及的伺服器，並為 `GET /v1/mcp/server` 加入 `user_id` 以列出單一使用者的伺服器 - [PR #46565](https://github.com/BerriAI/litellm/pull/46565)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements-1}

### 自動路由器與模型路由 {#auto-router-and-model-routing}

- 當路由器無法計算請求的 tokens 時，保持區域、RPM 與參數檢查執行，只跳過上下文視窗檢查，讓釘選在 EU 的終端使用者的音訊或圖片提示不再抵達美國部署 - [PR #44544](https://github.com/BerriAI/litellm/pull/44544)
- 讓完全相同模型的 `base_model` 在路由器中擴大非 Azure 部署的上下文視窗，讓符合 `/model/info` 所示視窗的提示不再被拒絕 - [PR #46197](https://github.com/BerriAI/litellm/pull/46197)
- 將因存取或預算被跳過的備援回報為已跳過而非失敗，讓 500 不再重複主要錯誤，彷彿備援曾被呼叫 - [PR #46291](https://github.com/BerriAI/litellm/pull/46291)
- 為 `Router` 與 `router_settings` 加入 `fallback_on_unsupported_params`，將其設為 `False` 會擲出參數拒絕，而非從備援模型回答 - [PR #46350](https://github.com/BerriAI/litellm/pull/46350)
- 在 `Router` 聊天補全內讀取第一個串流區塊，讓在任何 token 前失敗的串流耗用 `num_retries` 並如同非串流請求般逐一走過備援 - [PR #46493](https://github.com/BerriAI/litellm/pull/46493)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 追蹤管理稽核記錄寫入並在關閉時排清最長 5 秒，讓部署期間的 SIGTERM 不再丟棄回傳 200 之呼叫的稽核資料列 - [PR #43594](https://github.com/BerriAI/litellm/pull/43594)
- 為 RDS 主機名稱中的區域簽署 RDS IAM 資料庫 tokens，並有 `AWS_RDS_REGION` 與 `AWS_RDS_READ_REPLICA_REGION` 覆寫，讓跨區域寫入者與讀取副本能連線 - [PR #44782](https://github.com/BerriAI/litellm/pull/44782)
- 在 worker 執行緒中建構已完成 `/v1/messages` 串流的提供文字，且只在 `set_verbose` 開啟時才將 Redis 快取值字串化，讓其他請求不再等待事件迴圈 - [PR #45252](https://github.com/BerriAI/litellm/pull/45252)
- 回滾並重試在等待表格鎖時逾時的開機遷移，讓長時間的 `LiteLLM_SpendLogs` 讀取者不再於推出期間阻擋每個 pod 的支出記錄寫入 - [PR #45389](https://github.com/BerriAI/litellm/pull/45389)
- 每個 proxy 可運行的 CPU 最多啟動一個冷 MCP 結構描述驗證 worker - [PR #45791](https://github.com/BerriAI/litellm/pull/45791)
- 在團隊寫入時向每個實例廣播快取失效，讓團隊編輯立即在所有實例上套用，而非最長 60 秒後 - [PR #46113](https://github.com/BerriAI/litellm/pull/46113)
- 當 `--max_requests_before_restart` 以單一 worker 運行時印出啟動警告，並在其說明文字中註明只有 2 個以上 worker 時才安全 - [PR #46185](https://github.com/BerriAI/litellm/pull/46185)
- 以 `GRACEFUL_SHUTDOWN_TIMEOUT` 限制 uvicorn 與 gunicorn 上的 SIGTERM 等待，讓逾時後仍在執行的請求被取消，proxy 的關閉拆解仍能執行 - [PR #46186](https://github.com/BerriAI/litellm/pull/46186)
- 讓新遷移在其 SQL 中以 `SET LOCAL lock_timeout = '10s'` 開始，而非連線選項，讓池化資料庫 URL 能開機，卡在表格鎖後的遷移也能逾時並重試 - [PR #46329](https://github.com/BerriAI/litellm/pull/46329)
- 只在沒有任何內容抵達上游時，才在新連線上重送 POST 或 PATCH，讓提供者已讀取的請求不再於連線中斷後被執行並計費兩次 - [PR #46336](https://github.com/BerriAI/litellm/pull/46336)
- 在 Python 與 Rust HTTP 用戶端中還原 `AIOHTTP_KEEPALIVE_TIMEOUT` 的 15 秒預設值，讓關閉閒置連線的閘道不再於安靜期後的第一個請求造成 500 - [PR #46355](https://github.com/BerriAI/litellm/pull/46355)
- 讓回應快取命中不含提供者從未送出的欄位，讓命中不再於主體中加入 `system_fingerprint: null` - [PR #46359](https://github.com/BerriAI/litellm/pull/46359)
- 在 worker 執行緒中壓縮超過 16 KiB 的 gzip 回應，而非在事件迴圈上，讓大型嵌入回應不再拖住健康檢查與其他請求 - [PR #46362](https://github.com/BerriAI/litellm/pull/46362)
- 在釘選的遷移協調器鎖內執行 `prisma migrate deploy` 並關閉 Prisma 的工作階段諮詢鎖，讓交易池化器後的重新啟動不再於擱淺的鎖上等待 600 秒 - [PR #46368](https://github.com/BerriAI/litellm/pull/46368)
- 以 `SET LOCAL lock_timeout` 開始 `telemetry_reports` 遷移，讓在被持有的 `LiteLLM_TelemetryReport` 鎖後開機時放棄並重試，而非永遠等待 - [PR #46386](https://github.com/BerriAI/litellm/pull/46386)
- 當未設定時，將每個 Redis 用戶端預設為 5 秒 socket 逾時，並將 `REDIS_SOCKET_TIMEOUT` 預設值從 0.1 提高到 5 秒，讓卡住的 Redis 不再無限阻擋請求 - [PR #46501](https://github.com/BerriAI/litellm/pull/46501)
- 當 Prisma 引擎請求的呼叫者在關閉期間被取消時完成它們，讓最終支出排清不再失敗，200 回應的每日使用者與團隊支出得以保留 - [PR #46503](https://github.com/BerriAI/litellm/pull/46503)
- 在 v2 遷移鎖中接受帶空格或引號的資料庫密碼，從鎖錯誤中遮蔽密碼，並在資料庫無法連線時回報 `P1001` - [PR #46592](https://github.com/BerriAI/litellm/pull/46592)
- 每個程序只建構一次 `/public/providers/fields` 與 `/public/agents/fields` 回應並從記憶體提供，而非在每個請求時重新讀取並重新驗證提供者檔案 - [PR #46617](https://github.com/BerriAI/litellm/pull/46617)
- 在 `prisma migrate deploy` 期間只持有 Prisma 自己的諮詢鎖，讓開機中的 pod 不再於正在建構請求記錄索引的副本後逾時 - [PR #46660](https://github.com/BerriAI/litellm/pull/46660)
- 將 gzip 限制在 35 個儀表板分析 GET 路由，並在 worker 執行緒中壓縮每個符合資格的回應，讓推論與其他 API 回應不再於 proxy 上被壓縮 - [PR #46712](https://github.com/BerriAI/litellm/pull/46712)

### Docker 與 Helm {#docker-and-helm}

- 在元件化 Helm chart 中以 `ingress.componentHosts` 支援每元件獨立主機名稱，讓 UI、後端與閘道各有自己的 DNS 名稱，UI 在執行階段能找到後端與閘道 - [PR #46360](https://github.com/BerriAI/litellm/pull/46360)
- 透過每個 `passwordSecret` 區塊上新的 `hostKey` 與 `urlKey` 欄位，從 Kubernetes Secret 讀取資料庫與 Redis 主機或完整 URL，讓 values 檔案中不再需要 `host` - [PR #46410](https://github.com/BerriAI/litellm/pull/46410)
- 為快速入門安裝加入 `litellm-gateway` 命令，含 `status`、`up`、`down`、`restart`、`logs`、`open`、`update` 與 `uninstall`，並在既有安裝上重跑安裝命令時開啟選單 - [PR #46486](https://github.com/BerriAI/litellm/pull/46486)
- 為 `litellm-helm` chart 加入 `db.useIAMAuth` 與 `db.useAzureEntraAuth`，讓 RDS IAM 與 Azure Entra 使用者以鑄造的 token 啟動 proxy，無需密碼 Secret - [PR #46534](https://github.com/BerriAI/litellm/pull/46534)
- 在 `helm/litellm` chart 中公開 `redis.ssl`、`redis.sslCertReqs` 與 `redis.sslCaCerts`，為每個元件算繪為 `REDIS_SSL`、`REDIS_SSL_CERT_REQS` 與 `REDIS_SSL_CA_CERTS` - [PR #46536](https://github.com/BerriAI/litellm/pull/46536)

### 相依性更新 {#dependency-updates}

- 允許 `openai>=2.20.0,<4.0.0`，讓 LiteLLM 能與 OpenAI SDK 3 並存安裝，同時 SDK 2 使用者保持相同下限 - [PR #44927](https://github.com/BerriAI/litellm/pull/44927)
- 在 lockfile 中將 mlflow 升至 3.17.0，並移除其 osv-scanner 抑制 - [PR #45777](https://github.com/BerriAI/litellm/pull/45777)

## 文件更新 {#documentation-updates}

- 將 GCP 一鍵部署按鈕與教學指向 `terraform-google-litellm` 鏡像儲存庫 - [Commit 320536d](https://github.com/BerriAI/litellm/commit/320536d23c28539d55dbbe6e5a644f942c44b96e)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 245 項變更涉及測試、CI、貢獻者工具、重構、尚未接入面向使用者路徑的 Rust 執行階段鷹架，或在切版前已被還原的產品變更。它們本身不會改變 proxy 或 SDK 的行為。以 commit 列出的變更沒有公開的 PR


<details>
<summary>整合與 e2e 測試 (66)</summary>

- 新增一個 e2e 案例，檢查已設定定價的持久化支出 - [PR #41566](https://github.com/BerriAI/litellm/pull/41566)
- 以整合測試涵蓋 `agents_a2a` 端點契約 - [PR #44650](https://github.com/BerriAI/litellm/pull/44650)
- 以整合測試涵蓋 `images` 端點契約 - [PR #44653](https://github.com/BerriAI/litellm/pull/44653)
- 以整合測試涵蓋 `small_inference` 端點契約 - [PR #44654](https://github.com/BerriAI/litellm/pull/44654)
- 以整合測試涵蓋 `scim` 端點契約 - [PR #44656](https://github.com/BerriAI/litellm/pull/44656)
- 以整合測試涵蓋 `embeddings` 端點契約 - [PR #44660](https://github.com/BerriAI/litellm/pull/44660)
- 以整合測試涵蓋 `mcp_runtime` 端點契約 - [PR #44671](https://github.com/BerriAI/litellm/pull/44671)
- 以整合測試涵蓋 `keys_auth` 端點契約 - [PR #44674](https://github.com/BerriAI/litellm/pull/44674)
- 以整合測試涵蓋 `google_genai` 端點契約 - [PR #44680](https://github.com/BerriAI/litellm/pull/44680)
- 以整合測試涵蓋 `model_management` 端點契約 - [PR #44684](https://github.com/BerriAI/litellm/pull/44684)
- 以整合測試涵蓋 `prompts_tags_caching` 端點契約 - [PR #44686](https://github.com/BerriAI/litellm/pull/44686)
- 以整合測試涵蓋 `mcp_management` 端點契約 - [PR #44687](https://github.com/BerriAI/litellm/pull/44687)
- 以整合測試涵蓋 `chat_completions` 端點契約 - [PR #44688](https://github.com/BerriAI/litellm/pull/44688)
- 以整合測試涵蓋 `realtime` 端點契約 - [PR #44689](https://github.com/BerriAI/litellm/pull/44689)
- 以整合測試涵蓋 `pass_through` 端點契約 - [PR #44690](https://github.com/BerriAI/litellm/pull/44690)
- 以整合測試涵蓋 `videos_containers` 端點契約 - [PR #44691](https://github.com/BerriAI/litellm/pull/44691)
- 以整合測試涵蓋 `fine_tuning` 端點契約 - [PR #44697](https://github.com/BerriAI/litellm/pull/44697)
- 以整合測試涵蓋 `audio` 端點契約 - [PR #44699](https://github.com/BerriAI/litellm/pull/44699)
- 以整合測試涵蓋 `files_batches` 端點契約 - [PR #44703](https://github.com/BerriAI/litellm/pull/44703)
- 以整合測試涵蓋 `anthropic_messages` 端點契約 - [PR #44704](https://github.com/BerriAI/litellm/pull/44704)
- 以整合測試涵蓋 `teams` 端點契約 - [PR #44705](https://github.com/BerriAI/litellm/pull/44705)
- 以整合測試涵蓋 `guardrails_policies` 端點契約 - [PR #44722](https://github.com/BerriAI/litellm/pull/44722)
- 以整合測試涵蓋 `orgs_users_customers` 端點契約 - [PR #44725](https://github.com/BerriAI/litellm/pull/44725)
- 以整合測試涵蓋 `responses` 端點契約 - [PR #44733](https://github.com/BerriAI/litellm/pull/44733)
- 在整合測試中釘選 assistants 與 evals 端點契約 - [PR #44734](https://github.com/BerriAI/litellm/pull/44734)
- 以整合測試涵蓋 `budgets_spend` 端點契約 - [PR #44736](https://github.com/BerriAI/litellm/pull/44736)
- 以整合測試涵蓋 `config_utils` 端點契約 - [PR #44737](https://github.com/BerriAI/litellm/pull/44737)
- 以整合測試涵蓋 `vector_stores` 端點契約 - [PR #44739](https://github.com/BerriAI/litellm/pull/44739)
- 以整合測試涵蓋 `health_routing` 端點契約 - [PR #44744](https://github.com/BerriAI/litellm/pull/44744)
- 在整合測試中讓 MCP 範圍探索伺服器別名只含數字 - [PR #45675](https://github.com/BerriAI/litellm/pull/45675)
- 在 MCP DCR 准入 fixture 中建模團隊成員查找，並斷言每路由的 Decisions 呼叫類型 - [PR #45917](https://github.com/BerriAI/litellm/pull/45917)
- 在 canary egress rig 中將 What's new 目錄釘選到本機副本 - [PR #45925](https://github.com/BerriAI/litellm/pull/45925)
- 在遷移測試中斷言鎖逾時重試與耗盡，而非無界等待 - [PR #45955](https://github.com/BerriAI/litellm/pull/45955)
- 當自有 Redis 測試輔助工具的連接埠已被服務時，在另一個連接埠重試 - [PR #46019](https://github.com/BerriAI/litellm/pull/46019)
- 在 MCP 測試中將透傳探測流量歸因於呼叫者，而非整個對等記錄 - [PR #46020](https://github.com/BerriAI/litellm/pull/46020)
- 為擁有權測試 proxy 給予其自身的 DB 池餘裕 - [PR #46025](https://github.com/BerriAI/litellm/pull/46025)
- 預設隔離每個多 worker 整合套件 - [PR #46027](https://github.com/BerriAI/litellm/pull/46027)
- 在計時的自有 proxy 啟動前遷移，並在每個 worker 上閘控憑證探測 - [PR #46030](https://github.com/BerriAI/litellm/pull/46030)
- 為混沌與計時測試提供 harness API 並閘控原始訊號 - [PR #46031](https://github.com/BerriAI/litellm/pull/46031)
- 以並行 worker 堆疊與單 worker 測試 proxies 縮短 CircleCI proxy 開機時間 - [PR #46037](https://github.com/BerriAI/litellm/pull/46037)
- 將 e2e `load` 測試改名為 `perf`，並將選擇啟用整併到 `E2E_PERF_TESTS` - [PR #46077](https://github.com/BerriAI/litellm/pull/46077)
- 在整合測試中，等待 SIGSTOP 生效後再交回被暫停的 proxy 程序 - [PR #46088](https://github.com/BerriAI/litellm/pull/46088)
- 隔離六個順序相依不穩定整合測試背後的共用 proxy 狀態 - [PR #46172](https://github.com/BerriAI/litellm/pull/46172)
- 移除六個造成 CircleCI 整合失敗的測試設定原因 - [PR #46490](https://github.com/BerriAI/litellm/pull/46490)
- 在快取控制變更後更新中斷點快取標記普查預期 - [PR #46509](https://github.com/BerriAI/litellm/pull/46509)
- 再修正三個由測試設定造成的 CircleCI 整合失敗 - [PR #46510](https://github.com/BerriAI/litellm/pull/46510)
- 刪除不穩定的團隊模型 TPM 並行測試 - [PR #46541](https://github.com/BerriAI/litellm/pull/46541)
- 更新過時的 CircleCI 整合預期 - [PR #46570](https://github.com/BerriAI/litellm/pull/46570)
- 在整合測試中快取兩輪的 `tool_search` 防護欄重播 - [PR #46614](https://github.com/BerriAI/litellm/pull/46614)
- 在整合套件中預期串流思考區塊上的清單位置索引 - [PR #46618](https://github.com/BerriAI/litellm/pull/46618)
- 擴充 Messages 與 SDK 的執行階段迴歸契約 - [PR #46641](https://github.com/BerriAI/litellm/pull/46641)
- 在 CI 測試中釘選 xAI 回報成本拆分與協調器持有的 Prisma 鎖等待 - [PR #46645](https://github.com/BerriAI/litellm/pull/46645)
- 在整合套件中預期已簽署的空思考區塊能在 `/v1/messages` 重播中存留 - [PR #46686](https://github.com/BerriAI/litellm/pull/46686)
- 新增 e2e perf rig，含程序外 mocks、`PerformanceTestCase` 執行器、每請求限制與 `small_bodies_5rps` 案例 - [PR #46713](https://github.com/BerriAI/litellm/pull/46713)
- 新增 `mixed_size_requests_2rps` perf 案例，含程式設計代理程式主體、工具、JWT 與金鑰呼叫者及兩個防護欄 - [PR #46717](https://github.com/BerriAI/litellm/pull/46717)
- 移除三個在 main 上通過之整合測試的 BUG 跳過 - [PR #46725](https://github.com/BerriAI/litellm/pull/46725)
- 從整合執行器環境中丟棄繼承的提供者 API 金鑰 - [PR #46733](https://github.com/BerriAI/litellm/pull/46733)
- 在五個不穩定的整合契約中等待正確的訊號 - [PR #46737](https://github.com/BerriAI/litellm/pull/46737)
- 從每個 worker 一個的區塊中為每個 harness 伺服器給一個連接埠 - [PR #46761](https://github.com/BerriAI/litellm/pull/46761)
- 將 e2e perf 案例指標與限制以 JUnit 屬性附加 - [PR #46774](https://github.com/BerriAI/litellm/pull/46774)
- 以抖動錯開啟動 perf 使用者，並為工具呼叫串流給予第一個 token - [PR #46776](https://github.com/BerriAI/litellm/pull/46776)
- 在整合測試啟動執行緒前建構 OpenAI 與 Anthropic SDK 模型 - [PR #46797](https://github.com/BerriAI/litellm/pull/46797)
- 在 e2e perf 資料儲存限制中計算請求等待的 Postgres 陳述式與 Redis 命令，並將背景工作分開回報 - [PR #46798](https://github.com/BerriAI/litellm/pull/46798)
- 在每個整合瀏覽器請求上送出 `Connection` close 標頭 - [PR #46805](https://github.com/BerriAI/litellm/pull/46805)
- 在讀取排除服務的操作者追蹤前等待 gen-AI span - [PR #46846](https://github.com/BerriAI/litellm/pull/46846)
- 在整合 harness 中排清 SDK 記錄，讓生命週期測試保持穩定 - [PR #47143](https://github.com/BerriAI/litellm/pull/47143)

</details>

<details>
<summary>重構與型別 (43)</summary>

- 透過在邊界驗證提供者承載，清除 670 個 basedpyright `Any` 錯誤 - [PR #45388](https://github.com/BerriAI/litellm/pull/45388)
- 在 3 個檔案中以經證明的型別取代 `Any` - [PR #45565](https://github.com/BerriAI/litellm/pull/45565)
- 從 `litellm.models` 匯入 `LiteLLM_SkillsTable` - [Commit 6c71452](https://github.com/BerriAI/litellm/commit/6c714523559fd0d13af9ab574048f276982fc409)
- 從 `litellm.models` 匯入團隊與使用者表格模型 - [Commit 3fafd00](https://github.com/BerriAI/litellm/commit/3fafd0062af38be86ad95a5426e3edd65d8bbff6)
- 將 `LitellmUserRoles` 與 `KeyManagementRoutes` 移到 `litellm.types.proxy.auth.user_roles` - [Commit a3f05fb](https://github.com/BerriAI/litellm/commit/a3f05fb52fadf0114affdea1f844c6074f369fa4)
- 將型別安全的透傳記錄處理器移出 proxy 套件 - [Commit 396e8d1](https://github.com/BerriAI/litellm/commit/396e8d1e6c0cbb70c396afb22ee7819e512fd3b4)
- 將 Anthropic 透傳 SSE 串流組裝移到 `litellm/llms` - [Commit 7f5abff](https://github.com/BerriAI/litellm/commit/7f5abfffb4fb3fca21118ea99287c3e3de9df6e5)
- 將 `CommonProxyErrors` 移到 `litellm/types/proxy` - [Commit 38880fd](https://github.com/BerriAI/litellm/commit/38880fd5ce266ee2abd8f38a635149ba82d5d9d5)
- 將 `is_jwt` 移到 `litellm.types.proxy.auth.user_api_key_auth` - [Commit 7831d8a](https://github.com/BerriAI/litellm/commit/7831d8a9915e9171cacdd18038d73070f706f1ef)
- 將提示快取觀察查找移出 proxy hook - [Commit ebf2156](https://github.com/BerriAI/litellm/commit/ebf2156ec4a64996fbf03d27412d9fdd116fd783)
- 將原始 SSE 串流組裝輔助工具移出 proxy 防護欄 - [Commit 3981228](https://github.com/BerriAI/litellm/commit/3981228d7038383fcc7e998e2561ef124f8c878c)
- 將 Slack 警示葉型別移出 `proxy/_types.py` - [Commit 9c8083e](https://github.com/BerriAI/litellm/commit/9c8083e323ca6619fe3d28aa653e68952ab7db1b)
- 將提示快取定價輔助工具移出 proxy 套件 - [Commit c397b57](https://github.com/BerriAI/litellm/commit/c397b57f2b8685d05e7c5ffc5bdacef6a310f33f)
- 將 `PassThroughGuardrailSettings` 移到透傳型別模組 - [Commit 8f047e0](https://github.com/BerriAI/litellm/commit/8f047e0a333401c02075f03943a636e966bce8c9)
- 將 `stream_chunk_builder` 移到 `streaming_chunk_builder_utils` - [Commit 9e3cd2f](https://github.com/BerriAI/litellm/commit/9e3cd2f0a4868f8d444ed6cfceb1abf710ce8f07)
- 將 `NewSkillRequest` 移到 `litellm.models.skills` - [Commit 7383f59](https://github.com/BerriAI/litellm/commit/7383f59ad2719ee0edf7725f5fa50e2f7f326919)
- 清理每使用者 Copilot 驗證、Ternary FOCUS 匯出與遙測中的型別與重複的匯出工作程式碼，不改變行為 - [PR #45769](https://github.com/BerriAI/litellm/pull/45769)
- 將快取 token 擷取器移出 proxy savings - [Commit 8d510a6](https://github.com/BerriAI/litellm/commit/8d510a6b1bdd1aa2ae1824863c8010112a3461ce)
- 將 `responses_api_bridge_check` 移出 `litellm.main` - [Commit d02dc43](https://github.com/BerriAI/litellm/commit/d02dc43154218b38962efdab1f35cf4b7320d508)
- 在轉接器 TypedDicts 中於 `TYPE_CHECKING` 下匯入 `CustomLogger` 與 `CustomLLM` - [Commit 13191e5](https://github.com/BerriAI/litellm/commit/13191e5b661b1a155855429261668a66b43da896)
- 將 `path_utils` 從 proxy `common_utils` 移到 `litellm_core_utils` - [Commit 9d559d8](https://github.com/BerriAI/litellm/commit/9d559d85795b6175f4851ad20a00da916b34fdba)
- 在 Prometheus 型別輔助工具中延遲匯入 `litellm` - [Commit 4606bf5](https://github.com/BerriAI/litellm/commit/4606bf532e8d4c7ca465de42aa4c2ba5f7d2ab72)
- 將 `AUTH_OBJECTS_TARGET` 移到 `litellm.constants` - [Commit 12c36b0](https://github.com/BerriAI/litellm/commit/12c36b054b2247b47eb9ccbc1aa7a3ae0cefe249)
- 將複雜度路由器請求模型移到其基礎設定旁 - [Commit 0fc6d4d](https://github.com/BerriAI/litellm/commit/0fc6d4d16d8b1b044de69c594cdc813be2f34260)
- 在使用 proxy 輔助工具的儲存庫方法內匯入它們 - [Commit d1c4d06](https://github.com/BerriAI/litellm/commit/d1c4d0666ff0e601ae2c4e48827dacc2e3b9cab6)
- 將 `ColdStorageHandler` 移出 proxy 到 `litellm_core_utils` - [Commit c9e0ec8](https://github.com/BerriAI/litellm/commit/c9e0ec871989194b29b78d041bf7d15abc276861)
- 就地為 `UserAPIKeyAuth`、其 token 檢視與 `hash_token` 定型別 - [Commit dec8ec5](https://github.com/BerriAI/litellm/commit/dec8ec5daa6b1cc8c163a7b60a923199a3ada01b)
- 將 `UserAPIKeyAuth`、其 token 檢視與 `hash_token` 移到 `litellm.types.proxy.auth.user_api_key_auth` - [Commit 9e7e5c2](https://github.com/BerriAI/litellm/commit/9e7e5c24e4315ca8b5d87d2c30de64b5fb816aa1)
- 為 `GenerateRequestBase` 容器與 `check_max_budget` 加註型別 - [Commit b7d48ec](https://github.com/BerriAI/litellm/commit/b7d48ecd281fb229d7c7e9e89f4da12ce5b632e3)
- 將 `GenerateRequestBase` 與 `LiteLLM_ObjectPermissionBase` 移到 `litellm.types.proxy.management_endpoints.request_base` - [Commit 981710f](https://github.com/BerriAI/litellm/commit/981710fab81c5551c09717b66da57ed41504885a)
- 將 `resource_ownership` 移出 proxy 到 `litellm_core_utils` - [Commit c582bc6](https://github.com/BerriAI/litellm/commit/c582bc6e68a1b78e9d63d6d63f37ee66f8c976c1)
- 在 SDK 中從 `litellm.types.proxy.auth` 匯入 `UserAPIKeyAuth` - [Commit a1e5c90](https://github.com/BerriAI/litellm/commit/a1e5c90e56b31a5592693027fbdce4c3014acbbb)
- 為使用者請求中繼資料與 `check_user_info` 驗證器加註型別 - [Commit a859d84](https://github.com/BerriAI/litellm/commit/a859d844edab037372cb79748ad9cf9cc6efebd4)
- 為金鑰請求容器與 `drop_blank_team_id` 加註型別 - [Commit 2374b0c](https://github.com/BerriAI/litellm/commit/2374b0c398865e332f6b3b77f31a09ef707d4ed5)
- 將金鑰請求模型移到 `litellm.types.proxy.management_endpoints.key_requests` - [Commit c9d706a](https://github.com/BerriAI/litellm/commit/c9d706adb5d387807d9d03fd9d90c49ef8a66847)
- 將使用者請求模型移到 `litellm.types.proxy.management_endpoints.user_requests` - [Commit 513e7a8](https://github.com/BerriAI/litellm/commit/513e7a89ac17e5301ceb57fa30e078454cacee7f)
- 將 `MemberDeleteRequest` 移到 `litellm.types.proxy.management_endpoints.team_endpoints` - [Commit 2011004](https://github.com/BerriAI/litellm/commit/2011004d0adf28c45d0bc2194b3cdba67f666327)
- 在 12 個檔案中以經證明的型別取代 `Any` - [PR #45943](https://github.com/BerriAI/litellm/pull/45943)
- 在 6 個檔案中以經證明的型別取代 `Any` - [PR #46042](https://github.com/BerriAI/litellm/pull/46042)
- 將 `is_claude_4_5_on_bedrock` 改名為 `supports_bedrock_prompt_cache_ttl` - [PR #46058](https://github.com/BerriAI/litellm/pull/46058)
- 為兩條串流路徑的內容前串流重試輔助工具命名，並讓重試迴圈接收其嘗試函式 - [PR #46474](https://github.com/BerriAI/litellm/pull/46474)
- 跨 273 個檔案清除 1143 個 basedpyright `Any` 錯誤 - [PR #46574](https://github.com/BerriAI/litellm/pull/46574)
- 在 24 個檔案中以經證明的型別取代 `Any` - [PR #46663](https://github.com/BerriAI/litellm/pull/46663)

</details>

<details>
<summary>Rust 核心 (28)</summary>

- 將 Rust 工作區的 `serde_with` 升至 3.21.0 以清除 osv-scan - [PR #45498](https://github.com/BerriAI/litellm/pull/45498)
- 為 `auth-aws` 中的 AWS 連線參數定型別 - [PR #45610](https://github.com/BerriAI/litellm/pull/45610)
- 為 Messages 設定給予型別化的 LiteLLM 參數 - [PR #45611](https://github.com/BerriAI/litellm/pull/45611)
- 為 Rust 核心加入原生 DeepSeek `/v1/messages` 支援，以 `LITELLM_RUST` 選擇啟用 - [PR #45614](https://github.com/BerriAI/litellm/pull/45614)
- 為 Rust 核心加入原生 Vertex AI Claude `/v1/messages` 支援，以 `LITELLM_RUST` 選擇啟用 - [PR #45626](https://github.com/BerriAI/litellm/pull/45626)
- 為 `auth-gcp` 中的 Vertex AI 連線參數定型別 - [PR #45641](https://github.com/BerriAI/litellm/pull/45641)
- 為設定與呼叫者使用同一個 `LitellmParams` 型別 - [PR #45642](https://github.com/BerriAI/litellm/pull/45642)
- 在 Rust 橋接中透過主機模組路由 Python 狀態讀取 - [PR #45689](https://github.com/BerriAI/litellm/pull/45689)
- 為 Rust 核心加入原生 EdenAI `/v1/messages` 支援，並將提供者的計費成本傳給支出記錄 - [PR #45698](https://github.com/BerriAI/litellm/pull/45698)
- 為 Messages 路由加入即時提供者 harness - [PR #45823](https://github.com/BerriAI/litellm/pull/45823)
- 透過 `llms-types` 共用提供者常數，並重構 Rust `AGENTS.md` - [PR #45850](https://github.com/BerriAI/litellm/pull/45850)
- 為 Rust 核心加入原生 MiniMax `/v1/messages` 支援，包含 SSE 串流與快取提示 - [PR #45896](https://github.com/BerriAI/litellm/pull/45896)
- 為 Rust 核心加入原生 Tencent `/v1/messages` 支援，包含 SSE 串流與快取提示 - [PR #45899](https://github.com/BerriAI/litellm/pull/45899)
- 為 Rust 核心加入原生 Bedrock Claude Platform 與 Bedrock Mantle `/v1/messages` 支援 - [PR #45908](https://github.com/BerriAI/litellm/pull/45908)
- 為 Rust 核心加入原生 OpenRouter `/v1/messages` 支援 - [PR #45910](https://github.com/BerriAI/litellm/pull/45910)
- 每種 API 格式使用一種串流編解碼器形狀 - [PR #45996](https://github.com/BerriAI/litellm/pull/45996)
- 為 Rust 核心加入原生 OpenRouter `/v1/responses` 支援 - [PR #46000](https://github.com/BerriAI/litellm/pull/46000)
- 在 `host-python` 中將 Python 驅動程式以一個非同步主體執行 - [PR #46235](https://github.com/BerriAI/litellm/pull/46235)
- 在 Rust 橋接中使用產生器風格的執行通訊協定與串流步驟名稱 - [PR #46282](https://github.com/BerriAI/litellm/pull/46282)
- 從原生進入點回傳未啟動的 `Execution` 並在 Python 中驅動它 - [PR #46299](https://github.com/BerriAI/litellm/pull/46299)
- 將 `host-python` 驅動程式測試移出行內模組 - [PR #46325](https://github.com/BerriAI/litellm/pull/46325)
- 將 `host-python` 失敗收集在 `thiserror` `Error` 列舉中 - [PR #46361](https://github.com/BerriAI/litellm/pull/46361)
- 在原生路徑上釘選 Messages 與 Responses 回呼契約 - [PR #46443](https://github.com/BerriAI/litellm/pull/46443)
- 透過 `x-litellm-rust` 回應標記斷言原生提供服務 - [PR #46531](https://github.com/BerriAI/litellm/pull/46531)
- 在不使用 `LITELLM_RUST` 的情況下按測試挑選原生路由 - [PR #46620](https://github.com/BerriAI/litellm/pull/46620)
- 從 Rust 橋接目錄移除 `LoggerRule` 概念 - [PR #46711](https://github.com/BerriAI/litellm/pull/46711)
- 將路由主機模組移到 `host/routes` 下 - [PR #46786](https://github.com/BerriAI/litellm/pull/46786)
- 讓每個路由主機挑選主體參數 - [PR #46787](https://github.com/BerriAI/litellm/pull/46787)

</details>

<details>
<summary>CI 與發佈工具 (22)</summary>

- 依記錄的時間將整合套件分片，並為其 worker 提供私有資料庫與 fixtures - [PR #44146](https://github.com/BerriAI/litellm/pull/44146)
- 修正 CircleCI、GHA 與 Buildkite 上過時與不穩定的測試 - [PR #45530](https://github.com/BerriAI/litellm/pull/45530)
- 完成 lint、單元與冒煙檢查的佈局 - [PR #45706](https://github.com/BerriAI/litellm/pull/45706)
- 將封裝與安裝檢查移出 CircleCI `build_and_test` 工作 - [PR #45757](https://github.com/BerriAI/litellm/pull/45757)
- 為整合套件使用 CircleCI 原生時間分片與較少的平行節點 - [PR #45837](https://github.com/BerriAI/litellm/pull/45837)
- 在 proxy OpenAPI 文件中閘控未記錄的 POST 路由 - [PR #45843](https://github.com/BerriAI/litellm/pull/45843)
- 為重型整合套件 worker 提供私有 proxies、資料庫、Redis 與提供者邊緣 - [PR #45863](https://github.com/BerriAI/litellm/pull/45863)
- 從整合工作流程執行每個 CircleCI 檢查 - [PR #45938](https://github.com/BerriAI/litellm/pull/45938)
- 在每次推送到 main 時觸發 gateway-dev 部署 - [PR #45958](https://github.com/BerriAI/litellm/pull/45958)
- 移除沒有任何 CI 工作執行的透傳與 `user_api_key_auth` 覆蓋腳本 - [PR #45969](https://github.com/BerriAI/litellm/pull/45969)
- 將 redis-compat 與 MCP 單元套件從 CircleCI 移到 GitHub Actions - [PR #46026](https://github.com/BerriAI/litellm/pull/46026)
- 在大型機器上執行整合分片，並按套件調整 worker 數量 - [PR #46034](https://github.com/BerriAI/litellm/pull/46034)
- 將 litellm 升至 1.107.0、litellm-enterprise 升至 0.1.77、litellm-proxy-extras 升至 0.4.109 - [PR #46239](https://github.com/BerriAI/litellm/pull/46239)
- 以 4 個 worker 執行兩個最慢的單元分片 - [PR #46743](https://github.com/BerriAI/litellm/pull/46743)
- 以 dist load 執行 `mcp-elicitation` 分片，讓 `test_interactions.py` 的 74 個參數分散到其 4 個 worker - [PR #46770](https://github.com/BerriAI/litellm/pull/46770)
- 在自己的單元分片中執行 MCP interactions 整合契約，讓 `mcp-elicitation` 分片不再逾時 - [PR #46773](https://github.com/BerriAI/litellm/pull/46773)
- 只在 CircleCI 執行 MCP interactions 與 Redis cluster IAM 整合測試 - [PR #46780](https://github.com/BerriAI/litellm/pull/46780)
- 在 `mcp-interactions` 分片上還原 loadscope，讓其 MCP 訂閱案例不在 worker 間競速 - [PR #46783](https://github.com/BerriAI/litellm/pull/46783)
- 在成本對照表結構描述產生器中分類 `token_count_framing` 與 `token_count_fallback_model` - [PR #46784](https://github.com/BerriAI/litellm/pull/46784)
- 在 CI 相依性群組中將 `claude-agent-sdk` 升至 0.2.165 以清除 osv-scan - [PR #46976](https://github.com/BerriAI/litellm/pull/46976)
- 將 litellm-enterprise 升至 0.1.78、litellm-proxy-extras 升至 0.4.110，讓候選版本發佈其新遷移 - [PR #47230](https://github.com/BerriAI/litellm/pull/47230)
- 為 `rc/1.107.0` 重建管理 UI 套件 - [PR #47232](https://github.com/BerriAI/litellm/pull/47232)

</details>

<details>
<summary>成本計算測試 (20)</summary>

- 檢查串流請求與非串流請求計費到同一個 `SpendLogs` 資料列 - [PR #45730](https://github.com/BerriAI/litellm/pull/45730)
- 將 OpenAI 成本追蹤案例從 `cost_tracking_cases.json` 移到 `CostTrackingTestCase` 字面值 - [PR #45879](https://github.com/BerriAI/litellm/pull/45879)
- 在成本測試中，從擷取的提供者回應為 `/v1/decisions` 與 `/v1/systemone` 計費 Decisions 支出 - [PR #45902](https://github.com/BerriAI/litellm/pull/45902)
- 新增 tier 1 Claude 5 與 gpt-6 原生成本案例 - [PR #46124](https://github.com/BerriAI/litellm/pull/46124)
- 新增 `BridgeCostParityTestCase`，含一組 gpt-6-sol `/v1/messages` 到 Responses 的配對 - [PR #46130](https://github.com/BerriAI/litellm/pull/46130)
- 新增 Azure gpt-6 `/v1/messages` 橋接成本對等配對 - [PR #46139](https://github.com/BerriAI/litellm/pull/46139)
- 新增 Claude 5 `/v1/responses` 橋接成本對等配對 - [PR #46140](https://github.com/BerriAI/litellm/pull/46140)
- 新增 Bedrock Converse Claude 5 `/v1/responses` 橋接成本對等配對 - [PR #46141](https://github.com/BerriAI/litellm/pull/46141)
- 新增 gpt-6 聊天到 Responses 的橋接成本對等配對 - [PR #46143](https://github.com/BerriAI/litellm/pull/46143)
- 為 gpt-6 (272k) 與 `claude-haiku-5-5` (100k) 新增長上下文層級成本案例 - [PR #46147](https://github.com/BerriAI/litellm/pull/46147)
- 新增 xAI grok-4.7、Bedrock runtime 聊天補全與 Bedrock Mantle 成本案例 - [PR #46154](https://github.com/BerriAI/litellm/pull/46154)
- 新增 tier 1 gpt `cache_read` 案例，並重新擷取 `input_text` 用量形狀 - [PR #46623](https://github.com/BerriAI/litellm/pull/46623)
- 讓 `CostMapEntry` 能持有 flex、priority 與 ultrafast 快取與層級價格 - [PR #46629](https://github.com/BerriAI/litellm/pull/46629)
- 為 `vertex_ai` 與 `azure_ai` Claude 與 gpt-6 `cache_write_5m` 新增最佳猜測的 tier 1 案例 - [PR #46687](https://github.com/BerriAI/litellm/pull/46687)
- 新增 tier 1 Claude Messages 串流雙胞胎案例，並重新擷取漂移的用量形狀 - [PR #46690](https://github.com/BerriAI/litellm/pull/46690)
- 新增 `azure_ai` `claude-haiku-5-5` 案例與 gpt-6 服務層級快取價格 - [PR #46694](https://github.com/BerriAI/litellm/pull/46694)
- 涵蓋跨橋接 `previous_response_id`、快取串流與透傳快取寫入的第二輪用量形狀 - [PR #46703](https://github.com/BerriAI/litellm/pull/46703)
- 涵蓋自訂部署別名、離峰定價、橋接用量形狀與重複支出資料列 - [PR #46708](https://github.com/BerriAI/litellm/pull/46708)
- 當串流未帶用量時，在工具呼叫歷史上釘選 LiteLLM 自己的提示計數 - [PR #46710](https://github.com/BerriAI/litellm/pull/46710)
- 在每個成本案例上斷言串流的 `usage.cost` 與支出資料列相符 - [PR #46762](https://github.com/BerriAI/litellm/pull/46762)

</details>

<details>
<summary>翻譯測試矩陣 (11)</summary>

- 為整合套件新增 `claude-haiku-5-5` 基本轉譯案例 - [PR #45176](https://github.com/BerriAI/litellm/pull/45176)
- 新增 `StreamingTranslationTestCase`，含一個 Claude Sonnet 5.5 聊天補全案例 - [PR #46151](https://github.com/BerriAI/litellm/pull/46151)
- 跨轉譯測試共用豐富的請求與回應範本 - [PR #46546](https://github.com/BerriAI/litellm/pull/46546)
- 在用量形狀變更後重新擷取 Bedrock Invoke `claude-sonnet-4-6` 基礎 - [PR #46579](https://github.com/BerriAI/litellm/pull/46579)
- 新增 `gpt-6-astra` 轉譯案例 - [PR #46580](https://github.com/BerriAI/litellm/pull/46580)
- 新增 `claude-fable-5-1` 轉譯案例 - [PR #46581](https://github.com/BerriAI/litellm/pull/46581)
- 在轉譯測試中跨 Claude、GPT 與 Gemini 提供者共用豐富的 fixtures - [PR #46585](https://github.com/BerriAI/litellm/pull/46585)
- 跨模型層級比較程式設計代理程式回應契約 - [PR #46597](https://github.com/BerriAI/litellm/pull/46597)
- 涵蓋跨轉譯端點的回應契約 - [PR #46632](https://github.com/BerriAI/litellm/pull/46632)
- 新增 `claude-sonnet-5-5` Anthropic Messages `service_tier` 案例 - [PR #46678](https://github.com/BerriAI/litellm/pull/46678)
- 重新擷取 Azure `gpt-6-astra` 內容篩選器 - [PR #46691](https://github.com/BerriAI/litellm/pull/46691)

</details>

<details>
<summary>測試套件遷移 (11)</summary>

- 將離線路由器、重試與延遲測試從 `local_testing` 移到 `tests/unit` - [PR #45551](https://github.com/BerriAI/litellm/pull/45551)
- 將離線記錄、機密管理員與提供者測試從舊目錄移到 `tests/unit` - [PR #45554](https://github.com/BerriAI/litellm/pull/45554)
- 將離線 proxy 驗證、hook、支出與透傳測試移到 `tests/unit` - [PR #45568](https://github.com/BerriAI/litellm/pull/45568)
- 將離線 Anthropic 提示快取測試移到 `tests/unit` - [PR #45616](https://github.com/BerriAI/litellm/pull/45616)
- 將 SDK 與 proxy 開機的舊版 CircleCI 測試遷移到其層級 - [PR #45758](https://github.com/BerriAI/litellm/pull/45758)
- 將 `tests/llm_translation` 遷移到單元、整合與 e2e 層級 - [PR #45759](https://github.com/BerriAI/litellm/pull/45759)
- 將 `local_testing` 的 SDK 與提供者測試移出 `build_and_test` - [PR #45760](https://github.com/BerriAI/litellm/pull/45760)
- 將路由、快取與回呼測試移出 `local_testing` - [PR #45761](https://github.com/BerriAI/litellm/pull/45761)
- 將舊版 proxy 存取檢查、結構描述遷移與 MCP 測試遷移到新層級 - [PR #45937](https://github.com/BerriAI/litellm/pull/45937)
- 將 `tests/proxy_behavior` 遷移到整合與單元層級 - [PR #45939](https://github.com/BerriAI/litellm/pull/45939)
- 將舊版單元目錄與未執行資料夾遷移到 `tests/unit`、`tests/integration` 與 `tests/e2e` - [PR #45940](https://github.com/BerriAI/litellm/pull/45940)

</details>

<details>
<summary>單元測試 (7)</summary>

- 新增單元測試，確保 SDK 回顯的 null `tool_calls` 永遠不會抵達 Headroom `/v1/compress` 呼叫 - [PR #39667](https://github.com/BerriAI/litellm/pull/39667)
- 在防護欄平行與範圍選項測試中等待條件，而非實際時鐘時間 - [PR #45571](https://github.com/BerriAI/litellm/pull/45571)
- 讓冷並行結構描述驗證測試設定自己的逾時，讓它不再於單一 CPU 核心上不穩定 - [PR #46184](https://github.com/BerriAI/litellm/pull/46184)
- 在單元測試中等待工作本身，而非固定睡眠 - [PR #46261](https://github.com/BerriAI/litellm/pull/46261)
- 涵蓋 `/health/services` 上的 OTel V2 `otel` 回呼 - [PR #46394](https://github.com/BerriAI/litellm/pull/46394)
- 在 Redis 快取測試中，於 gc 後從即時狀態為斷路器指標建立基線 - [PR #46652](https://github.com/BerriAI/litellm/pull/46652)
- 在團隊名冊同步測試中等待卡住的 Redis 被觸及，而非固定的 0.1 秒睡眠 - [PR #46727](https://github.com/BerriAI/litellm/pull/46727)

</details>

<details>
<summary>貢獻者工具 (7)</summary>

- 在 git 中忽略 `.mypy_cache` - [Commit 0519882](https://github.com/BerriAI/litellm/commit/0519882fefb99250aa441d3179363d1acec2172b)
- 將巢狀 `AGENTS.md` 檔案載入為限定於其目錄的 Greptile 審查上下文 - [PR #45636](https://github.com/BerriAI/litellm/pull/45636)
- 在 AGENTS.md 檔案中禁止面向人類文字使用分號與冒號 - [PR #45684](https://github.com/BerriAI/litellm/pull/45684)
- 從儲存庫移除已提交的 PR 螢幕截圖 - [PR #45816](https://github.com/BerriAI/litellm/pull/45816)
- 從 PR 範本、`AGENTS.md` 與 CI 中移除 Greptile - [PR #46013](https://github.com/BerriAI/litellm/pull/46013)
- 在 AGENTS.md 中引導測試遠離實作細節與刻意還原 - [PR #46317](https://github.com/BerriAI/litellm/pull/46317)
- 更新一位維護者帳號的 `CODEOWNERS` 條目 - [PR #46452](https://github.com/BerriAI/litellm/pull/46452)

</details>

<details>
<summary>rc.1 切版後的發佈線維護 (27)</summary>

- 將 main 對 filelock 的 grype 忽略帶到 1.108 - [Commit 2c5177b](https://github.com/BerriAI/litellm/commit/2c5177b924fbc8224c9b79f7daf79344787b20c4)
- 更新 Next.js 建置產物 (2026-11-04 01:05 UTC, node v24.19.0) - [Commit da398ed](https://github.com/BerriAI/litellm/commit/da398ed319a61db07e000004644abf17f2a97c6c)
- 將自有 A2A 整合覆蓋回移到 rc 108 - [Commit 573c0f6](https://github.com/BerriAI/litellm/commit/573c0f6659e721c321dfef66d68b6d070f65a69d)
- 使用 rc 108 資料庫讀取輔助工具 - [Commit c863004](https://github.com/BerriAI/litellm/commit/c86300491fab61af69224d42064d587bdadd02a4)
- 將 Presidio Sail 與 Weave 遷移回移到 rc 108 - [Commit b5049a4](https://github.com/BerriAI/litellm/commit/b5049a43cec842997c75f359f9f1f3f1ce3e85ad)
- 將資格修復回移到 rc 1.108.0 - [Commit e02e279](https://github.com/BerriAI/litellm/commit/e02e279d6a04d79c5521c920292c414e3e14150c)
- 將長輸入突發與匹配的良性流量比較 - [Commit d1b3f10](https://github.com/BerriAI/litellm/commit/d1b3f10c6faac99753924d16b24cb76528b72e9f)
- 等待已完成的回呼並直接觀察鎖 - [Commit de19b8d](https://github.com/BerriAI/litellm/commit/de19b8d7ce2c8a4b0e38ec1dbb24dd1afb9c0f3f)
- 在快取命中失敗時要求部署 ID - [Commit ddb384f](https://github.com/BerriAI/litellm/commit/ddb384ff61cf077454c8033fba533d5ad2960958)
- 回移已校準的重新啟動預算 - [Commit 35e6802](https://github.com/BerriAI/litellm/commit/35e68021ab15d23565b10769cc93d5b494050174)
- 修復代理程式讀取與批次刪除設定 - [PR #49719](https://github.com/BerriAI/litellm/pull/49719)
- 修正四個不穩定的整合測試 - [PR #49554](https://github.com/BerriAI/litellm/pull/49554)
- 將 #47108 中卡住 Redis 的突發上限回移到 rc/1.108.0 - [Commit 9a929f8](https://github.com/BerriAI/litellm/commit/9a929f871d371f66f698c0674939910ea014ccf7)
- 在讀取其支出資料列前，先保留上游直到中斷連線落定 - [PR #47303](https://github.com/BerriAI/litellm/pull/47303)
- 將 #47135 的團隊刪除暖機修正回移到 rc/1.108.0 - [Commit 1321862](https://github.com/BerriAI/litellm/commit/13218620ede4be6f62776f6c70202fc29b2186ff)
- 將 rc/1.108.0 需要的 #48665 過時測試修正回移 - [Commit 187d933](https://github.com/BerriAI/litellm/commit/187d933de24aa65fbab0c2956731ae743e6d246f)
- 將 #47600 的 cursor responses wire 測試修正回移到 rc/1.108.0 - [Commit 38482f7](https://github.com/BerriAI/litellm/commit/38482f7cda185e2b532c32d80b43029680411242)
- 在 count_tokens wire 測試中遵循 #47441 的中繼資料路由計數 - [PR #47525](https://github.com/BerriAI/litellm/pull/47525)
- 以 48 個 worker 執行 extensions 整合群組 - [PR #49134](https://github.com/BerriAI/litellm/pull/49134)
- 在 GitHub Actions 上執行整合群組 - [PR #48985](https://github.com/BerriAI/litellm/pull/48985)
- 讓每月視窗老化超過任何日曆月，讓重置測試在 31 日也能通過 - [PR #49372](https://github.com/BerriAI/litellm/pull/49372)
- 依 proxy 開機預算調整突發中重新啟動的逾時大小 - [PR #49376](https://github.com/BerriAI/litellm/pull/49376)
- 等待停滯租戶的根 span，並接受裸 POST 名稱 - [PR #49406](https://github.com/BerriAI/litellm/pull/49406)
- 讓 applied-header 整合檔案符合 rc/1.108.0 的 harness - [Commit d2de047](https://github.com/BerriAI/litellm/commit/d2de047602bdf08ed43c12b0e371fb71546851c5)
- 將 litellm 升至 1.108.0、litellm-enterprise 升至 0.1.79 - [Commit b359154](https://github.com/BerriAI/litellm/commit/b359154e4fe004fe9805f89f961090a451ea6a6b)
- 接受鏡像成本對照表的擷取模式、新資料列欄位與 openinfer 資料列 - [Commit 82925fc](https://github.com/BerriAI/litellm/commit/82925fc3c0ee9600fc146a5fff6b6160eb247cba)
- 將先前已計費的逾時重試嘗試附加到失敗請求，供後續支出資料列使用 - [PR #47490](https://github.com/BerriAI/litellm/pull/47490)

</details>

<details>
<summary>在本版本內已被取代 (3)</summary>

- 預設在 Home 上提供隨附的 `whats_new.json`，已在切版前被 v1.106.0 已出貨的部落格來源 What's new 卡片取代 - [PR #45934](https://github.com/BerriAI/litellm/pull/45934)
- 新增 `azure_ai/claude-fable-5-5`，之後又被本版本中較晚的 PR 移除 - [PR #46201](https://github.com/BerriAI/litellm/pull/46201)
- 再次移除 `azure_ai/claude-fable-5-5`，因為 Azure 未列出該模型 - [PR #46428](https://github.com/BerriAI/litellm/pull/46428)

</details>

### 依擁有權區域彙整 PR {#pr-roll-up-by-ownership-area}

面向客戶的變更：**476**。測試、CI 與內部變更：**245**。總計：**721**

- 其他（測試、CI、內部）：245
- 模型與提供者：147
- LLM API 端點：71
- 支出 / 預算 / 速率限制：60
- 效能：49
- 驗證與管理：46
- UI：35
- MCP：28
- 記錄與追蹤：24
- 防護欄：15
- 文件：1

## 新貢獻者 {#new-contributors}

- [@Acacian](https://github.com/Acacian) 在 [PR #41528](https://github.com/BerriAI/litellm/pull/41528) 做出了他們的第一次貢獻
- [@adityajoy-1902](https://github.com/adityajoy-1902) 在 [PR #42079](https://github.com/BerriAI/litellm/pull/42079) 做出了他們的第一次貢獻
- [@airia-open-source](https://github.com/airia-open-source) 在 [PR #40784](https://github.com/BerriAI/litellm/pull/40784) 做出了他們的第一次貢獻
- [@akram1089](https://github.com/akram1089) 在 [PR #43594](https://github.com/BerriAI/litellm/pull/43594) 做出了他們的第一次貢獻
- [@Apeksha9389](https://github.com/Apeksha9389) 在 [PR #46471](https://github.com/BerriAI/litellm/pull/46471) 做出了他們的第一次貢獻
- [@Arjun-Aravind](https://github.com/Arjun-Aravind) 在 [PR #45437](https://github.com/BerriAI/litellm/pull/45437) 做出了他們的第一次貢獻
- [@Aryan-Pardeshi](https://github.com/Aryan-Pardeshi) 在 [PR #36460](https://github.com/BerriAI/litellm/pull/36460) 做出了他們的第一次貢獻
- [@debanshd](https://github.com/debanshd) 在 [PR #41683](https://github.com/BerriAI/litellm/pull/41683) 做出了他們的第一次貢獻
- [@ErenAta16](https://github.com/ErenAta16) 在 [PR #34653](https://github.com/BerriAI/litellm/pull/34653) 做出了他們的第一次貢獻
- [@jonvarley-fw](https://github.com/jonvarley-fw) 在 [PR #47326](https://github.com/BerriAI/litellm/pull/47326) 做出了他們的第一次貢獻
- [@jsvisa](https://github.com/jsvisa) 在 [PR #46021](https://github.com/BerriAI/litellm/pull/46021) 做出了他們的第一次貢獻
- [@le-shi](https://github.com/le-shi) 在 [PR #32599](https://github.com/BerriAI/litellm/pull/32599) 做出了他們的第一次貢獻
- [@link89](https://github.com/link89) 在 [PR #40825](https://github.com/BerriAI/litellm/pull/40825) 做出了他們的第一次貢獻
- [@marcusgreer](https://github.com/marcusgreer) 在 [PR #45410](https://github.com/BerriAI/litellm/pull/45410) 做出了他們的第一次貢獻
- [@matthowardcohere](https://github.com/matthowardcohere) 在 [PR #46274](https://github.com/BerriAI/litellm/pull/46274) 做出了他們的第一次貢獻
- [@mayank-affirm](https://github.com/mayank-affirm) 在 [PR #41747](https://github.com/BerriAI/litellm/pull/41747) 做出了他們的第一次貢獻
- [@narmstrong-berri](https://github.com/narmstrong-berri) 在 [PR #46492](https://github.com/BerriAI/litellm/pull/46492) 做出了他們的第一次貢獻
- [@pOpO1-9](https://github.com/pOpO1-9) 在 [PR #43935](https://github.com/BerriAI/litellm/pull/43935) 做出了他們的第一次貢獻
- [@rameswaran-mohan](https://github.com/rameswaran-mohan) 在 [PR #41670](https://github.com/BerriAI/litellm/pull/41670) 做出了他們的第一次貢獻
- [@Raushankumar0720](https://github.com/Raushankumar0720) 在 [PR #42887](https://github.com/BerriAI/litellm/pull/42887) 做出了他們的第一次貢獻
- [@RonP3](https://github.com/RonP3) 在 [PR #43791](https://github.com/BerriAI/litellm/pull/43791) 做出了他們的第一次貢獻
- [@ryuto-takemoto](https://github.com/ryuto-takemoto) 在 [PR #44544](https://github.com/BerriAI/litellm/pull/44544) 做出了他們的第一次貢獻
- [@setarm01](https://github.com/setarm01) 在 [PR #46197](https://github.com/BerriAI/litellm/pull/46197) 做出了他們的第一次貢獻
- [@shubhamjain0594](https://github.com/shubhamjain0594) 在 [PR #45579](https://github.com/BerriAI/litellm/pull/45579) 做出了他們的第一次貢獻
- [@soham96](https://github.com/soham96) 在 [PR #44167](https://github.com/BerriAI/litellm/pull/44167) 做出了他們的第一次貢獻
- [@sukhdeepjohar](https://github.com/sukhdeepjohar) 在 [PR #45107](https://github.com/BerriAI/litellm/pull/45107) 做出了他們的第一次貢獻
- [@Sushit-prog](https://github.com/Sushit-prog) 在 [PR #38284](https://github.com/BerriAI/litellm/pull/38284) 做出了他們的第一次貢獻
- [@TaylorHawkes](https://github.com/TaylorHawkes) 在 [PR #41669](https://github.com/BerriAI/litellm/pull/41669) 做出了他們的第一次貢獻
- [@thementalcoding](https://github.com/thementalcoding) 在 [PR #43710](https://github.com/BerriAI/litellm/pull/43710) 做出了他們的第一次貢獻
- [@VimarshDwivedi](https://github.com/VimarshDwivedi) 在 [PR #46184](https://github.com/BerriAI/litellm/pull/46184) 做出了他們的第一次貢獻
- [@WongAnneLister](https://github.com/WongAnneLister) 在 [PR #36346](https://github.com/BerriAI/litellm/pull/36346) 做出了他們的第一次貢獻
- [@yuefdev](https://github.com/yuefdev) 在 [PR #41677](https://github.com/BerriAI/litellm/pull/41677) 做出了他們的第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.0...v1.108.0
