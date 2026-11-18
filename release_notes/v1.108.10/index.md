---
title: "LiteLLM v1.108.10 (LTS) 修正 Vertex Claude 4096-token 上限與 EU o3 支出"
description: "Vertex AI 上的版本化 Claude 模型不再停在 4096 個 token，Azure EU o 系列基礎模型改為記錄實際支出，而非 $0。"
slug: "v1-108-10"
date: 2026-11-16T21:57:41
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

`v1.108.10` 是 1.108 LTS 線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.10
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.10
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.10`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.10) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.10` 是接在 [`v1.108.9`](/release_notes/v1.108.9/v1-108-9) 之上的修補版本。沒有新的資料庫遷移。`v1.108.10` 標籤指向 [`5d6a139`](https://github.com/BerriAI/litellm/commit/5d6a1394b8eea12099493c029334c1b78976f49e)。

### 變更內容 {#whats-changed}

- **Vertex AI 與 Gemini：**修正未設定 `max_tokens` 時，版本化 `claude-*@<version>` 模型停在 4096 個 token 的問題 - [PR #51863](https://github.com/BerriAI/litellm/pull/51863)
- **聊天補全：**修正非同步 Codestral 聊天帶有 `file` 部分時回傳 400，以及串流 PDF URL 讓 proxy 工作進程停滯的問題 - [PR #51860](https://github.com/BerriAI/litellm/pull/51860)
- **成本追蹤與定價：**修正 `base_model` 為 `azure/eu/o3`、`o4-mini`、`o1` 或 `o3-mini` 的部署支出記錄為 $0 的問題 - [PR #47497](https://github.com/BerriAI/litellm/pull/47497)

來自 [PR #47497](https://github.com/BerriAI/litellm/pull/47497) 的成本修正已回移至 [PR #51412](https://github.com/BerriAI/litellm/pull/51412)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.9...v1.108.10
