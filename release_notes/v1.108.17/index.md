---
title: "LiteLLM v1.108.17（LTS）修正串流 OpenAI 工具呼叫並新增 MiniMax-H3-Image"
description: "串流 OpenAI 工具呼叫會保留其引數，`chat-latest` 模型不再回應 400 錯誤，MiniMax-H3-Image 與 Gemini 檔案頁面範圍也加入 LTS 版本線。"
slug: "v1-108-17"
date: 2026-11-24T22:55:03
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

`v1.108.17` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.17
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.17
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.17`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.17) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

`v1.108.17` 是接在 [`v1.108.16`](/release_notes/v1.108.16/v1-108-16) 之上的修補版本。沒有新的資料庫遷移。遷移執行後會建立部分 `LiteLLM_EndUserTable_restricted_idx` 索引，且不會阻擋寫入。遷移任務會建立該索引，而自行執行遷移的 Proxy 則會在開始提供服務後於背景建立。`v1.108.17` 標籤指向 [`e552bff`](https://github.com/BerriAI/litellm/commit/e552bffcaf7a921f14101ec288c5719580ffe9b5)。

### 變更內容 {#whats-changed}

- **OpenAI：**修正 OpenAI、Azure 與 vLLM 錯誤遺失 `param`、`type` 與 `code`，並在 `message` 中回傳原始 JSON 的問題 - [PR #51809](https://github.com/BerriAI/litellm/pull/51809) 與 [PR #53217](https://github.com/BerriAI/litellm/pull/53217)
- **OpenAI：**修正 LiteLLM 在 OpenAI SDK 3 上執行時，聊天補全捨棄 `access_programs` 與提示詞快取欄位的問題 - [PR #51814](https://github.com/BerriAI/litellm/pull/51814)
- **OpenAI：**修正串流 OpenAI 工具呼叫在 OpenAI 僅於結尾傳送引數時，以空白引數送達代理程式的問題 - [PR #52069](https://github.com/BerriAI/litellm/pull/52069) 與 [PR #53306](https://github.com/BerriAI/litellm/pull/53306)
- **OpenAI：**修正 `/v1/responses` 上的 `background_options` 在送達 OpenAI 前遭捨棄的問題 - [PR #53993](https://github.com/BerriAI/litellm/pull/53993)
- **OpenAI：**修正 o3 `reasoning_effort` `minimal` 與 `none` 即使開啟 `drop_params` 仍回傳 OpenAI 的 400 的問題 - [PR #54066](https://github.com/BerriAI/litellm/pull/54066)
- **Anthropic：**修正 Claude 請求上格式錯誤的 `thinking_blocks` 回應 500 失敗的問題，現為指明欄位的 400 - [PR #53762](https://github.com/BerriAI/litellm/pull/53762)
- **Anthropic：**修正 Claude 傳送錯誤訊框時，失敗的 `/v1/messages` 串流記錄佔位輸出 Token 與成本的問題 - [PR #53920](https://github.com/BerriAI/litellm/pull/53920)
- **AWS Bedrock：**修正 Bedrock 批次擷取與取消回報並儲存嵌入批次的 `/v1/chat/completions` 的問題 - [PR #53831](https://github.com/BerriAI/litellm/pull/53831)
- **AWS Bedrock：**修正 OpenAI SDK 在 Bedrock Nova 2 上的嵌入因 `encoding_format` 一律回應 400 失敗的問題 - [PR #53938](https://github.com/BerriAI/litellm/pull/53938)
- **AWS Bedrock：**修正 `api_base` 或執行階段端點設為空值時，Nova Sonic 即時工作階段卡住的問題 - [PR #53969](https://github.com/BerriAI/litellm/pull/53969)
- **AWS Bedrock：**修正共用 `$defs` 的 Bedrock Claude 工具使工作者停滯約 30 秒、隨後回應 400 失敗的問題 - [PR #54118](https://github.com/BerriAI/litellm/pull/54118)
- **AWS Bedrock：**修正 Bedrock `/v1/messages` 上的電腦與瀏覽器工具組回應 400 失敗的問題 - [PR #54128](https://github.com/BerriAI/litellm/pull/54128)
- **Vertex AI 與 Gemini：**在聊天補全上為檔案新增 Gemini 頁面與試算表範圍選項，因此僅讀取並計費該部分 - [PR #52611](https://github.com/BerriAI/litellm/pull/52611)
- **Vertex AI 與 Gemini：**修正最後一則使用者訊息為空白時，Gemini 與 Vertex AI 回應 400 的問題 - [PR #53947](https://github.com/BerriAI/litellm/pull/53947)
- **Vertex AI 與 Gemini：**修正 Gemini 嵌入 `video_metadata` 視窗以整部影片計費或回應 500 失敗的問題，現為明確的 400 - [PR #54090](https://github.com/BerriAI/litellm/pull/54090)
- **Vertex AI 與 Gemini：**修正 Gemini TTS 在 `/v1/audio/speech` 上對 `pcm16` 回傳 WAV 位元組與雙重 WAV 標頭的問題 - [PR #54193](https://github.com/BerriAI/litellm/pull/54193)
- **其他提供者：**在 `/v1/images/generations` 與 `/v1/images/edits` 上新增 MiniMax-H3-Image 並附成本追蹤 - [PR #53986](https://github.com/BerriAI/litellm/pull/53986)
- **其他提供者：**修正 `/v1/messages` 上的 DeepSeek V4 忽略呼叫端 effort 的問題，因此 Claude Code 的 `--effort` 現在會生效 - [PR #52196](https://github.com/BerriAI/litellm/pull/52196)
- **其他提供者：**修正 GitHub Copilot 以 400 拒絕 HTML 與純文字文件，且該回合與之後每個回合皆然的問題 - [PR #53669](https://github.com/BerriAI/litellm/pull/53669)
- **其他提供者：**修正 Together AI 影像呼叫記錄 $0，以及已退役的 Together 模型缺少棄用日期的問題 - [PR #53964](https://github.com/BerriAI/litellm/pull/53964)
- **其他提供者：**修正 `nvidia_nim/` 聊天呼叫因 `logprobs` 與 `top_logprobs` 回應 400 失敗的問題 - [PR #54043](https://github.com/BerriAI/litellm/pull/54043)
- **Chat completions：**修正 OpenAI、Azure 與 Azure AI 上的 `chat-latest` 與 `gpt-chat-latest` 在首個提示詞回應 400 失敗的問題 - [PR #51151](https://github.com/BerriAI/litellm/pull/51151)
- **Chat completions：**修正 Azure 與託管 vLLM 變更呼叫端的訊息的問題，因此重複的 Azure 影像請求現在會命中快取 - [PR #53972](https://github.com/BerriAI/litellm/pull/53972)
- **Messages API：**修正 Gemini 思考回合後，在 DeepSeek 的 Anthropic 端點與 Claude `count_tokens` 上出現 400 的問題 - [PR #51793](https://github.com/BerriAI/litellm/pull/51793)
- **Messages API：**修正傳送至 OpenAI 模型的 `/v1/messages` 上忽略 `thinking` 停用、`display`、`between_tools` 與 `effort` 的問題 - [PR #53987](https://github.com/BerriAI/litellm/pull/53987)
- **Vector stores：**修正帶有 `vector_store_ids` 的聊天請求在未設定儲存區時遭提供者回應 400 失敗的問題 - [PR #51209](https://github.com/BerriAI/litellm/pull/51209)
- **Token 計數：**修正 `/utils/token_counter` 與 `/v1/messages/count_tokens` 在帶有 Anthropic 備援區塊的記錄上失敗的問題 - [PR #54006](https://github.com/BerriAI/litellm/pull/54006)
- **成本追蹤與定價：**修正經 `/openai` 的 OpenAI Agents API 工作階段呼叫記錄 $0 的問題，因此金鑰與團隊預算現在會生效 - [PR #53881](https://github.com/BerriAI/litellm/pull/53881)
- **金鑰、團隊與驗證：**修正非管理員金鑰擁有者向 `/key/update` 傳送 `null` 以清除其金鑰 `max_budget` 的問題，現為 403 - [PR #53978](https://github.com/BerriAI/litellm/pull/53978)
- **部署：**修正獨立 UI 映像搭載過時的 nginx 與 zlib 的問題，現為 nginx 1.31.10 與 zlib 1.4 - [PR #54207](https://github.com/BerriAI/litellm/pull/54207)
- **SDK：**修正同步 `messages.create(stream=True)` 在 `openai/` 模型上於一般 `for` 迴圈中引發 `TypeError` 的問題 - [PR #54159](https://github.com/BerriAI/litellm/pull/54159)
- **效能：**改善終端使用者限制重新整理，改為僅讀取受限的客戶，而非整個終端使用者資料表 - [PR #51772](https://github.com/BerriAI/litellm/pull/51772)

這些變更已回移至 [PR #52618](https://github.com/BerriAI/litellm/pull/52618)、[PR #53427](https://github.com/BerriAI/litellm/pull/53427)、[PR #53928](https://github.com/BerriAI/litellm/pull/53928)、[PR #53979](https://github.com/BerriAI/litellm/pull/53979)、[PR #54070](https://github.com/BerriAI/litellm/pull/54070)、[PR #54082](https://github.com/BerriAI/litellm/pull/54082)、[PR #54120](https://github.com/BerriAI/litellm/pull/54120)、[PR #54125](https://github.com/BerriAI/litellm/pull/54125)、[PR #54131](https://github.com/BerriAI/litellm/pull/54131)、[PR #54137](https://github.com/BerriAI/litellm/pull/54137) 與 [PR #54232](https://github.com/BerriAI/litellm/pull/54232)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.16...v1.108.17
