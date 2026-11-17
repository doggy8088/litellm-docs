---
title: "LiteLLM v1.107.0rc4 新增連結 GitHub Copilot 帳戶的 CLI 指令"
description: "開發人員以 lite credentials connect 從終端機連結自己的 GitHub Copilot 帳戶，無需存取 Admin UI。"
slug: "v1-107-0-rc-4"
date: 2026-11-14T23:46:31
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
docker.litellm.ai/berriai/litellm:1.107.0-rc.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.107.0rc4
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.107.0-rc.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.107.0-rc.4) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.107.0rc4` 是建立在 [`v1.107.0rc3`](/release_notes/v1.107.0rc3/v1-107-0-rc-3) 之上的候選版本。沒有新的資料庫 migration。`v1.107.0-rc.4` 標籤指向 [`a1a541b`](https://github.com/BerriAI/litellm/commit/a1a541bfb1295d44bcb3b9ab882ba8f8b1c2dfa5)。

### 為何推出新的 1.107 候選版本 {#why-a-new-1107-release-candidate}

部分使用者仍在執行 1.107 候選版本，且需要在不存取 Admin UI 的情況下連結其 GitHub Copilot 個別使用者憑證，因此此版本將 `lite credentials connect` 指令帶到該產品線。已有更新的穩定版發佈。若您未執行 1.107 候選版本，請改用[最新穩定版](https://github.com/BerriAI/litellm/releases/latest)。

### 變更內容 {#whats-changed}

- **其他提供者：** 新增 `lite credentials connect`，可從終端機連結個別使用者的 GitHub Copilot 憑證，無需 Admin UI - [PR #50863](https://github.com/BerriAI/litellm/pull/50863)
- **部署：** 將 Docker 映像中的 `aiohttp`、`ddtrace`、`pypdf` 與其他鎖定的相依性變更為較新的版本 - [PR #51771](https://github.com/BerriAI/litellm/pull/51771)

這些變更在 [PR #51771](https://github.com/BerriAI/litellm/pull/51771) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.107.0-rc.3...v1.107.0-rc.4
