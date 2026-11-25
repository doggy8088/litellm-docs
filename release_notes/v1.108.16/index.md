---
title: "LiteLLM v1.108.16（LTS）新增 Perplexity Orchestrator 並修正 Bedrock 上的 Codex"
description: "Perplexity Orchestrator、Gradium 與 Gnani 加入 LTS 版本線，Codex 在 Bedrock 上首次工具呼叫後仍可繼續運作，Anthropic SDK 2.x 的呼叫也不再因最新 API 版本而失敗。"
slug: "v1-108-16"
date: 2026-11-23T22:11:31
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

`v1.108.16` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.16
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.16
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.16`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.16) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

:::danger[重大變更]

**在依賴 `OPENAI_API_KEY` 的 `azure` `/openai/v1` 部署上設定 `api_key` 或 `AZURE_API_KEY`。**請參閱 [PR #51144](https://github.com/BerriAI/litellm/pull/51144) 與 [PR #53408](https://github.com/BerriAI/litellm/pull/53408)。

**設定 `LITELLM_MCP_DCR_GATEWAY_CLIENT=true`，以保留新無用戶端 DCR 橋接的自動閘道擁有註冊。**請參閱 [PR #53059](https://github.com/BerriAI/litellm/pull/53059)。

:::

`v1.108.16` 是接在 [`v1.108.15`](/release_notes/v1.108.15/v1-108-15) 之上的修補版本。沒有新的資料庫遷移。`v1.108.16` 標籤指向 [`c9a0e74`](https://github.com/BerriAI/litellm/commit/c9a0e742cc02860accfcacebd7f238a6fbaaa1a6)。

### 變更內容 {#whats-changed}

- **Azure：**修正僅以 Entra 權杖驗證的 `azure_ai` 呼叫遭 Foundry 回應 400 的問題 - [PR #49769](https://github.com/BerriAI/litellm/pull/49769)
- **Azure：**修正 Foundry 專案、資源與 `/openai/v1` 基礎上的 `azure_ai` 聊天與 `/v1/messages` 回應 4xx 錯誤的問題 - [PR #51144](https://github.com/BerriAI/litellm/pull/51144) 與 [PR #53408](https://github.com/BerriAI/litellm/pull/53408)
- **Anthropic：**修正 `anthropic-version: 2026-10-21` 下帶有 `temperature`、`top_p` 或 `top_k` 的 `/v1/messages` 失敗的問題 - [PR #53395](https://github.com/BerriAI/litellm/pull/53395)
- **Anthropic：**修正 `extra_body` 欄位傳入 Claude 巢狀結構並回應 400 `Extra inputs are not permitted` 的問題 - [PR #53411](https://github.com/BerriAI/litellm/pull/53411)
- **AWS Bedrock：**修正同時設定 `api_base` 時，Bedrock 原生聊天與 `/v1/responses` 忽略 `aws_bedrock_runtime_endpoint` 的問題 - [PR #50582](https://github.com/BerriAI/litellm/pull/50582)
- **AWS Bedrock：**修正 Bedrock `model_id` 設定檔模型在旁邊有以 ARN 命名同一設定檔的部署時失敗的問題 - [PR #53462](https://github.com/BerriAI/litellm/pull/53462)
- **AWS Bedrock：**修正 Bedrock Converse 上的 Mistral Large 3 與 Ministral 3 對 `tool_choice` 回應 400 的問題 - [PR #53591](https://github.com/BerriAI/litellm/pull/53591)
- **Vertex AI 與 Gemini：**在 `/v1/decisions` 與 `/v1/systemone` 上新增 `gemini-decision-1` - [PR #53696](https://github.com/BerriAI/litellm/pull/53696)
- **Vertex AI 與 Gemini：**修正 Gemini 影像聊天在 `message.images` 中同時回傳思考草稿影像與最終影像的問題 - [PR #50709](https://github.com/BerriAI/litellm/pull/50709)
- **Vertex AI 與 Gemini：**修正 Gemini 從工具與回應結構描述中捨棄 `const`，導致 const 欄位回傳空白或憑空捏造內容的問題 - [PR #53415](https://github.com/BerriAI/litellm/pull/53415)
- **Vertex AI 與 Gemini：**修正 Gemini 與 Vertex AI 悄悄捨棄 `video_url` 內容片段的問題 - [PR #53420](https://github.com/BerriAI/litellm/pull/53420)
- **Vertex AI 與 Gemini：**修正 Vertex Gemini 對每個 `service_tier` 值都回應 400 的問題 - [PR #53428](https://github.com/BerriAI/litellm/pull/53428)
- **Vertex AI 與 Gemini：**修正同時傳送函式工具時 Gemini 3 以上版本捨棄網路搜尋的問題 - [PR #53432](https://github.com/BerriAI/litellm/pull/53432)
- **Vertex AI 與 Gemini：**修正 Vertex 影像編輯每輪都重新繪製圖片，並在第三個影像回合回應 400 失敗的問題 - [PR #53446](https://github.com/BerriAI/litellm/pull/53446)
- **Vertex AI 與 Gemini：**修正 Gemini 影像產生與編輯忽略 `size`、`aspect_ratio`、`image_size` 與 `imageConfig` 的問題 - [PR #53581](https://github.com/BerriAI/litellm/pull/53581)
- **Vertex AI 與 Gemini：**修正 Anthropic SDK 2.x 對 Vertex AI `/v1/messages` 上 Claude 的呼叫因 `anthropic-version` 回應 400 失敗的問題 - [PR #53590](https://github.com/BerriAI/litellm/pull/53590)
- **Vertex AI 與 Gemini：**修正對話帶有後續系統訊息時，Gemini 提示詞快取永遠無法命中的問題 - [PR #53635](https://github.com/BerriAI/litellm/pull/53635)
- **Vertex AI 與 Gemini：**修正 Gemini 批次嵌入以 $0 或文字費率計費影片與其他媒體輸入的問題 - [PR #53679](https://github.com/BerriAI/litellm/pull/53679)
- **Vertex AI 與 Gemini：**修正 Vertex 影像模型上 `n` 大於 1 且帶有影像 `modalities` 時回應含糊錯誤的問題，現為明確的 400 - [PR #53752](https://github.com/BerriAI/litellm/pull/53752)
- **其他提供者：**在 `/v1/audio/speech` 上新增 Gradium 文字轉語音 - [PR #53463](https://github.com/BerriAI/litellm/pull/53463)
- **其他提供者：**新增 Perplexity Orchestrator 提供者（`perplexity_orchestrator/`）並附成本追蹤 - [PR #53585](https://github.com/BerriAI/litellm/pull/53585)
- **其他提供者：**在 `/v1/audio/transcriptions` 上新增 Gnani 轉錄，支援 Prisma v2.5 與 v3 - [PR #53672](https://github.com/BerriAI/litellm/pull/53672)
- **其他提供者：**修正 Vertex AI 與 Bedrock 上的 Mistral 對對話記錄中的工具呼叫 ID 回應 400 的問題 - [PR #53426](https://github.com/BerriAI/litellm/pull/53426)
- **其他提供者：**修正 SAP 以已簽署區塊清單串流 `reasoning_content` 時出現 `TypeError` 的問題 - [PR #53458](https://github.com/BerriAI/litellm/pull/53458)
- **其他提供者：**修正空白或截斷的 SageMaker 與 Bedrock 代理程式串流回應 200 的問題，現為 502，因此會執行重試與備援 - [PR #53482](https://github.com/BerriAI/litellm/pull/53482)
- **Chat completions：**修正自訂提供者串流在區塊缺少欄位時以 `APIConnectionError: 'is_finished'` 失敗的問題 - [PR #53417](https://github.com/BerriAI/litellm/pull/53417)
- **Chat completions：**修正 `n` 大於 1 的串流聊天僅將 `delta.role` 提供給一個選項的問題 - [PR #53592](https://github.com/BerriAI/litellm/pull/53592)
- **Responses API：**修正 Bedrock、Azure AI 與 OpenRouter 上的 Codex 經 `ws /v1/responses` 在首次工具呼叫後失敗的問題 - [PR #53410](https://github.com/BerriAI/litellm/pull/53410)
- **Responses API：**修正偽造的 `/v1/responses` 串流回傳推理項目，稍後卻以 400 `invalid_encrypted_content` 失敗的問題 - [PR #53747](https://github.com/BerriAI/litellm/pull/53747)
- **嵌入、影像與音訊：**修正橋接端點上對 Gemini TTS 與 gpt-audio 的音訊輸出請求回傳空白但仍計費的 200 的問題 - [PR #53745](https://github.com/BerriAI/litellm/pull/53745)
- **Token 計數：**修正 grok-4.3 與 Azure grok-4-1-fast-non-reasoning 的 Token 計數比帳單少 23 至 328 個 Token 的問題 - [PR #53443](https://github.com/BerriAI/litellm/pull/53443)
- **MCP：**修正強制託管 MCP `tool_choice` 在 `drop_params` 下失敗，以及 Bedrock 批次列忽略 `drop_params` 的問題 - [PR #53697](https://github.com/BerriAI/litellm/pull/53697)
- **MCP：**將閘道擁有的 DCR 用戶端註冊改為自願加入，修正共用服務金鑰出現 `403 oauth_principal_mismatch` 的問題 - [PR #53059](https://github.com/BerriAI/litellm/pull/53059)
- **防護欄：**修正 `/v1/messages` 防護欄在 Claude 與 Gemini 別名上捨棄 `cache_control`，導致提示詞快取遺失的問題 - [PR #53832](https://github.com/BerriAI/litellm/pull/53832)
- **快取：**修正快取命中在大型 `/v1/responses` 提示詞與傳送至僅聊天模型的 `/v1/messages` 上重複記錄成功的問題 - [PR #53465](https://github.com/BerriAI/litellm/pull/53465)
- **成本追蹤與定價：**修正橋接提供者上截斷的 `/v1/responses` 串流以估計值而非回報的輸入計費的問題 - [PR #53419](https://github.com/BerriAI/litellm/pull/53419)
- **成本追蹤與定價：**修正僅資料庫模型在價格資料重新載入後遺失自訂定價並記錄 $0 支出的問題 - [PR #53870](https://github.com/BerriAI/litellm/pull/53870)
- **SDK：**修正 Responses API 與 Anthropic 錯誤向 SDK 呼叫端引發時 `e.response.text` 為空白的問題 - [PR #53743](https://github.com/BerriAI/litellm/pull/53743)
- **一般：**修正使用 `use_litellm_proxy` 或 `litellm_proxy/` 模型的決策呼叫失敗，且 Router 將其傳送至 OpenAI 的問題 - [PR #53196](https://github.com/BerriAI/litellm/pull/53196)

這些變更已回移至 [PR #53180](https://github.com/BerriAI/litellm/pull/53180)、[PR #53409](https://github.com/BerriAI/litellm/pull/53409)、[PR #53414](https://github.com/BerriAI/litellm/pull/53414)、[PR #53441](https://github.com/BerriAI/litellm/pull/53441)、[PR #53483](https://github.com/BerriAI/litellm/pull/53483)、[PR #53584](https://github.com/BerriAI/litellm/pull/53584) 與 [PR #53764](https://github.com/BerriAI/litellm/pull/53764)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.15...v1.108.16
