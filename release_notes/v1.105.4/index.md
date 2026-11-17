---
title: "LiteLLM v1.106.3、v1.105.4 與 v1.103.8 更換映像簽署金鑰並移除 eMudhra 根 CA"
description: "映像與 Helm chart 改以新的 cosign 金鑰簽署，且所有憑證包都移除 eMudhra 根 CA。"
slug: "v1-105-4"
date: 2026-10-24T08:52:07
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
docker.litellm.ai/berriai/litellm:1.105.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.4
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.105.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.105.4) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.105.4` 是建立在 [`v1.105.3`](/release_notes/v1.105.3/v1-105-3) 之上的修補版本。它將映像簽署移至新的 cosign 金鑰，並在 `stable/1.105.x` 上從所有憑證包移除 eMudhra 根 CA。沒有新的資料庫 migration。`v1.105.4` 標籤指向 [`a3b1add`](https://github.com/BerriAI/litellm/commit/a3b1add96d5f2fc89fe3cda9d3f803f0d6ab685c)

:::warning 映像簽署金鑰已變更

自此版本起，每個 Docker 映像與 Helm chart 都以 commit [`e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 的 cosign 金鑰簽署。使用 commit `0112e53` 的舊金鑰驗證將會失敗。請更新所有固定使用舊 `cosign.pub` 的項目，例如 `cosign verify` 指令稿、CI 檢查與准入政策。

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  ghcr.io/berriai/litellm:v1.105.4
```

:::

### 變更內容 {#whats-changed}

- SDK、代理程式與 Docker 映像所信任的每個憑證包都不再包含 eMudhra 根 CA - [PR #47670](https://github.com/BerriAI/litellm/pull/47670)、[PR #47969](https://github.com/BerriAI/litellm/pull/47969)
- Docker 映像與 Helm chart 以 commit `e82a3c6` 的 cosign 金鑰簽署。commit `0112e53` 的舊金鑰不再能驗證它們 - [PR #48103](https://github.com/BerriAI/litellm/pull/48103)

這些變更與版本提升在 [PR #48077](https://github.com/BerriAI/litellm/pull/48077) 中回移

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.105.3...v1.105.4
