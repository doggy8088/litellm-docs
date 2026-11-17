---
title: "LiteLLM v1.108.4 (LTS) 修正 Bedrock pass-through 防護欄與影片輪詢"
description: "Bedrock pass-through 路由強制執行模型的 guardrailConfig，影片輪詢保留其模型，且工具呼叫在沒有 mcp 的基礎 SDK 安裝上可運作。"
slug: "v1-108-4"
date: 2026-11-09T23:00:51
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

`v1.108.4` 是 1.108 LTS 產品線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.4
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.4) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.108.4` 是建立在 [`v1.108.3`](/release_notes/v1.108.3/v1-108-3) 之上的修補版本。沒有新的資料庫 migration。`v1.108.4` 標籤指向 [`e6f080f`](https://github.com/BerriAI/litellm/commit/e6f080fb5633aa71ea81b652bd72069aff1f0228)。

### 變更內容 {#whats-changed}

- **AWS Bedrock：** 修正對話帶有 Claude 已簽署 thinking 時，Bedrock 上的 GLM、GPT-6 Luna 與 Nova 2 回傳 400 的問題 - [PR #50399](https://github.com/BerriAI/litellm/pull/50399)
- **AWS Bedrock：** `/bedrock` pass-through 路由改為強制執行模型的 `guardrailConfig`，優先於呼叫者傳送的任何防護欄 - [PR #47429](https://github.com/BerriAI/litellm/pull/47429)
- **Vertex AI 與 Gemini：** 修正 Vertex AI Claude 批次在建立時以 404 失敗的問題 - [PR #50365](https://github.com/BerriAI/litellm/pull/50365)
- **Messages API：** 修正 `/v1/messages` 上的 `chatgpt/` 模型在回合之間丟棄加密推理的問題 - [PR #50456](https://github.com/BerriAI/litellm/pull/50456)
- **Messages API：** 修正 `/v1/messages` 到 OpenAI 向上游傳送 `background: true` 的問題，該問題會對回傳空白的完整執行計費 - [PR #50462](https://github.com/BerriAI/litellm/pull/50462)
- **嵌入、影像與音訊：** 修正 `/v1/videos` 輪詢在使用個別模型金鑰時失敗，或以 404 打到錯誤的提供者帳戶的問題 - [PR #44614](https://github.com/BerriAI/litellm/pull/44614)
- **路由與備援：** 修正團隊金鑰由整個代理程式範圍的萬用字元提供服務，而非團隊自己的 BYOK 萬用字元部署的問題 - [PR #48490](https://github.com/BerriAI/litellm/pull/48490)
- **SDK：** 修正帶工具的 `completion()`、`responses()` 與 `messages` 在基礎安裝上以 `No module named 'mcp'` 失敗的問題，該問題自 v1.106.0 起存在 - [PR #45961](https://github.com/BerriAI/litellm/pull/45961)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.3...v1.108.4
