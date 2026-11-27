---
title: "LiteLLM v1.108.19（LTS）新增 Volcengine Seedream 與 Perplexity 代理工具"
description: "Volcengine Ark Seedream 加入 LTS 版本線，Perplexity Agent API 模型可使用函式工具，代理呼叫按各自的價格計費。"
slug: "v1-108-19"
date: 2026-11-26T19:04:36
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

`v1.108.19` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.19
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.19
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.19`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.19) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

`v1.108.19` 是接在 [`v1.108.18`](/release_notes/v1.108.18/v1-108-18) 之上的修補版本。沒有新的資料庫遷移。`v1.108.19` 標籤指向 [`56da5c3`](https://github.com/BerriAI/litellm/commit/56da5c3954805373220392a149e8821c55bededd)。

### 變更內容 {#whats-changed}

- **OpenAI：**修正 `disable_parallel_tool_use`、`speed` 與網頁搜尋篩選條件在 `/v1/messages` 上毫無作用的問題 - [PR #54367](https://github.com/BerriAI/litellm/pull/54367)
- **Azure：**修正音訊轉錄忽略部署的 `api_version`、在 `api_version="v1"` 時回應 500 失敗的問題 - [PR #53402](https://github.com/BerriAI/litellm/pull/53402)
- **Azure：**修正文件智慧 OCR 忽略 `pages`、`outputContentFormat` 與其他 `extra_body` 選項的問題 - [PR #53750](https://github.com/BerriAI/litellm/pull/53750)
- **Vertex AI 與 Gemini：**修正 Gemini 影像請求未取得影像時回應計費的 200 並帶有空的 `data`、而非錯誤的問題 - [PR #53429](https://github.com/BerriAI/litellm/pull/53429)
- **其他提供者：**新增 Volcengine Ark Seedream 影像生成、影像編輯與定價 - [PR #54507](https://github.com/BerriAI/litellm/pull/54507)
- **其他提供者：**修正 Perplexity Agent API 模型在 `/v1/chat/completions` 上拒絕或默默捨棄函式工具的問題 - [PR #53952](https://github.com/BerriAI/litellm/pull/53952) 與 [PR #54047](https://github.com/BerriAI/litellm/pull/54047)
- **其他提供者：**修正僅含 `reasoning_details` 的 OpenRouter 串流區塊遭捨棄、導致 Claude 的思考簽章遺失的問題 - [PR #54564](https://github.com/BerriAI/litellm/pull/54564)
- **Chat completions：**修正串流用量（如 watsonx）在無資料的 SSE 行先到時，退回本機 Token 估算值的問題 - [PR #54463](https://github.com/BerriAI/litellm/pull/54463)
- **Chat completions：**修正 vLLM 與其他串流中途的上游中斷以乾淨的 `stop` 結尾、導致半截答案被保留且略過備援的問題 - [PR #54466](https://github.com/BerriAI/litellm/pull/54466)
- **Chat completions：**修正串流區塊在最後一個區塊前漏掉 `finish_reason: null`、導致 Mistral SDK 拒絕的問題 - [PR #54623](https://github.com/BerriAI/litellm/pull/54623)
- **Messages API：**修正 `functions.Bash:0` 等工具 ID 在非 Anthropic 後端被重寫、導致 Claude Code 在一次呼叫後停滯的問題，此問題自 v1.91.0 起存在 - [PR #54445](https://github.com/BerriAI/litellm/pull/54445)
- **Messages API：**修正 GPT 與其他非 Claude 模型忽略思考預算旁明確指定的 `output_config.effort` 的問題 - [PR #54594](https://github.com/BerriAI/litellm/pull/54594)
- **代理程式：**修正聊天、`/v1/responses` 與 `/v1/messages` 上的代理呼叫計費為 $0 或其他代理的價格、而非自身價格的問題 - [PR #54584](https://github.com/BerriAI/litellm/pull/54584)
- **記錄與可觀測性：**修正 Prometheus 速率限制量測值遺漏串流 `/v1/messages`、`/anthropic` 直通與 Foundry Claude 呼叫的問題 - [PR #47039](https://github.com/BerriAI/litellm/pull/47039) 與 [PR #54373](https://github.com/BerriAI/litellm/pull/54373)
- **部署：**將 Docker 映像改為為 Prisma 內建 OpenSSL 3.5 LTS，取代已終止支援的 OpenSSL 3.6 - [PR #54428](https://github.com/BerriAI/litellm/pull/54428)

這些變更已回移至 [PR #54383](https://github.com/BerriAI/litellm/pull/54383) 與 [PR #54572](https://github.com/BerriAI/litellm/pull/54572)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.18...v1.108.19
