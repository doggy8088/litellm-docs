---
title: "LiteLLM v1.106.3、v1.105.4 與 v1.103.8 更換映像簽署金鑰並移除 eMudhra 根 CA"
description: "映像與 Helm chart 改以新的 cosign 金鑰簽署，且所有憑證包都移除 eMudhra 根 CA。"
slug: "v1-106-3"
date: 2026-10-24T09:34:13
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
docker.litellm.ai/berriai/litellm:1.106.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.3
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.106.3` 是建立在 [`v1.106.2`](/release_notes/v1.106.2/v1-106-2) 之上的修補版本。它將映像簽署移至新的 cosign 金鑰，並在 `stable/1.106.x` 上從所有憑證包移除 eMudhra 根 CA。沒有新的資料庫 migration。`v1.106.3` 標籤指向 [`4fa8bf1`](https://github.com/BerriAI/litellm/commit/4fa8bf1ff5515e2cb98908c62ba84c87ef938620)

:::warning 映像簽署金鑰已變更

自此版本起，每個 Docker 映像與 Helm chart 都以 commit [`e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 的 cosign 金鑰簽署。使用 commit `0112e53` 的舊金鑰驗證將會失敗。請更新所有固定使用舊 `cosign.pub` 的項目，例如 `cosign verify` 指令稿、CI 檢查與准入政策。

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  ghcr.io/berriai/litellm:v1.106.3
```

:::

### 變更內容 {#whats-changed}

- SDK、代理程式與 Docker 映像所信任的每個憑證包都不再包含 eMudhra 根 CA - [PR #47670](https://github.com/BerriAI/litellm/pull/47670)、[PR #47969](https://github.com/BerriAI/litellm/pull/47969)、[PR #48139](https://github.com/BerriAI/litellm/pull/48139)
- Docker 映像與 Helm chart 以 commit `e82a3c6` 的 cosign 金鑰簽署。commit `0112e53` 的舊金鑰不再能驗證它們 - [PR #48103](https://github.com/BerriAI/litellm/pull/48103)

這些變更與版本提升在 [PR #48078](https://github.com/BerriAI/litellm/pull/48078) 與 [PR #48142](https://github.com/BerriAI/litellm/pull/48142) 中回移

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.2...v1.106.3
