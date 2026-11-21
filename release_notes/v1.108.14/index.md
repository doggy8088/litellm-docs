---
title: "LiteLLM v1.108.14 (LTS) 修正 Claude 在 Responses 後續對話中的工具搜尋"
description: "Claude 的工具搜尋在 /v1/responses 後續對話中保持啟用，且 /v1/decisions 接受 OpenAI input_json 內容片段。"
slug: "v1-108-14"
date: 2026-11-20T23:42:30
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

`v1.108.14` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以取得最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.14
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.14
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.14`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.14) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.14` 是接在 [`v1.108.13`](/release_notes/v1.108.13/v1-108-13) 之上的修補版本。沒有新的資料庫遷移。`v1.108.14` 標籤指向 [`2e46e4c`](https://github.com/BerriAI/litellm/commit/2e46e4c77f3192b041ca13942a4c1035ef453969)。

### 變更內容 {#whats-changed}

- **Anthropic：**修正 Claude 的工具搜尋在 `/v1/responses` 後續對話中遺失的問題，該問題會導致 Anthropic 回傳 400 錯誤 - [PR #50821](https://github.com/BerriAI/litellm/pull/50821)
- **其他：**新增 OpenAI `input_json` 內容片段在 `/v1/decisions` 上的支援 - [PR #52807](https://github.com/BerriAI/litellm/pull/52807)

這些變更已回移至 [PR #53007](https://github.com/BerriAI/litellm/pull/53007) 與 [PR #52807](https://github.com/BerriAI/litellm/pull/52807)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.13...v1.108.14
