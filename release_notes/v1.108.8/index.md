---
title: "LiteLLM v1.108.8 (LTS) 修復 Azure Decisions 呼叫與 MCP 登入循環"
description: "Azure 部署可在 /v1/decisions 上運作，Gemini 檔案所有權檢查涵蓋檔案 ID 的各種形式，MCP 登入不再因詳細 scopes 而循環。"
slug: "v1-108-8"
date: 2026-11-13T20:21:21
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

`v1.108.8` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可維持在最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.8
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.8
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.108.8`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.8) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.8` 是 [`v1.108.7`](/release_notes/v1.108.7/v1-108-7) 之上的修補版本。沒有新的資料庫 migration。`v1.108.8` 標籤指向 [`e1476b2`](https://github.com/BerriAI/litellm/commit/e1476b249a130ba551d179466a6de6e17a050945)。

### 變更內容 {#whats-changed}

- **Azure：** 修復 `azure/` 部署在 `/v1/decisions` 回應 400 的問題 - [PR #51460](https://github.com/BerriAI/litellm/pull/51460)
- **批次與檔案：** 修復檔案所有權檢查遺漏 Gemini 檔案 ID 的其他寫法（例如 `files/<id>` 或其 URL）的問題 - [PR #51503](https://github.com/BerriAI/litellm/pull/51503)
- **MCP：** 修復在以詳細 scopes 回應 `mcp_all` 的伺服器上，登入循環最後以 `Authentication incomplete` 結束的問題，此問題自 v1.107.0 起出現 - [PR #51578](https://github.com/BerriAI/litellm/pull/51578)

此變更已透過 [PR #51640](https://github.com/BerriAI/litellm/pull/51640) 回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.7...v1.108.8
