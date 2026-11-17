---
title: "LiteLLM v1.106.7 在 /v1/videos 上支援自訂影片提供者"
description: "為 custom_provider_map 中的提供者提供 /v1/videos。代理程式與其 Helm chart 不再隨附 Lens beta。"
slug: "v1-106-7"
date: 2026-11-04T04:28:59
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
docker.litellm.ai/berriai/litellm:1.106.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.7
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.7`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.7) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

:::danger 重大變更

**若您的 Helm values 設定了 `lensWorker.enabled`，請在升級前將其移除，讓 chart 能順利渲染。** 我們正在重新調整 beta 功能與核心產品 LiteLLM 並行運作的方式。自 1.106.7 起，Lens beta 不再隨代理程式或其 Helm chart 一併封裝。若您目前使用 Lens，v1.106.6 仍可照常運作。請參閱 [PR #49173](https://github.com/BerriAI/litellm/pull/49173)。

:::

`v1.106.7` 是建立在 [`v1.106.6`](/release_notes/v1.106.6/v1-106-6) 之上的修補版本。沒有新的資料庫 migration。`v1.106.7` 標籤指向 [`25fc8bf`](https://github.com/BerriAI/litellm/commit/25fc8bfefc006f47a61cf6ac360384e57e6a24c2)。

### 變更內容 {#whats-changed}

- **嵌入、影像與音訊：** 為在 `custom_provider_map` 中註冊的自訂提供者新增 `/v1/videos` 支援 - [PR #49802](https://github.com/BerriAI/litellm/pull/49802)
- **Lens：** 將 Lens beta 移出代理程式套件與 Helm chart - [PR #49173](https://github.com/BerriAI/litellm/pull/49173)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.6...v1.106.7
