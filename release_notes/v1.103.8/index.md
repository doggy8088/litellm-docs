---
title: "LiteLLM v1.106.3、v1.105.4 與 v1.103.8 更換映像簽署金鑰並移除 eMudhra 根 CA"
description: "映像與 Helm chart 改以新的 cosign 金鑰簽署，每個憑證包都移除 eMudhra 根 CA，且 otel 回呼可與 OpenTelemetry 1.44 搭配運作。"
slug: "v1-103-8"
date: 2026-10-24T08:11:40
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
docker.litellm.ai/berriai/litellm:1.103.8
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.8
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.8`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.8) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.8` 是建立在 [`v1.103.7`](/release_notes/v1.103.7/v1-103-7) 之上的修補版本。它將映像簽署移至新的 cosign 金鑰、從每個憑證包中移除 eMudhra 根 CA，並修復 `stable/1.103.x` 上的 `otel` 回呼。沒有新的資料庫遷移。`v1.103.8` 標籤指向 [`20d52b0`](https://github.com/BerriAI/litellm/commit/20d52b018b233b6440587578b48e2f9f9851c50d)

:::warning 映像簽署金鑰已變更

自此版本起，每個 Docker 映像與 Helm chart 都以來自 commit [`e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 的 cosign 金鑰簽署。以 commit `0112e53` 的舊金鑰驗證將會失敗。請更新任何鎖定舊 `cosign.pub` 的項目，例如 `cosign verify` 指令碼、CI 檢查與准入政策。

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  ghcr.io/berriai/litellm:v1.103.8
```

:::

### 有什麼變更 {#whats-changed}

- SDK、proxy 與 Docker 映像所信任的每個憑證包都不再包含 eMudhra 根 CA - [PR #47670](https://github.com/BerriAI/litellm/pull/47670)、[PR #47969](https://github.com/BerriAI/litellm/pull/47969)
- Docker 映像與 Helm chart 以來自 commit `e82a3c6` 的 cosign 金鑰簽署。來自 commit `0112e53` 的舊金鑰不再能驗證它們 - [PR #48103](https://github.com/BerriAI/litellm/pull/48103)
- `otel` 回呼現在能以 OpenTelemetry 1.44 及更新版本初始化，而不是失敗 - [PR #42431](https://github.com/BerriAI/litellm/pull/42431)

這些變更與版本提升於 [PR #48075](https://github.com/BerriAI/litellm/pull/48075) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.7...v1.103.8
