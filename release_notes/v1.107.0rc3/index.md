---
title: "LiteLLM v1.107.0rc3 修正 GitHub Copilot 個別使用者連線並新增 GHE.com"
description: "GitHub Copilot 個別使用者憑證可在 GHE.com 租戶上運作，且個別使用者連線可搭配自訂 GitHub client ID。"
slug: "v1-107-0-rc-3"
date: 2026-11-05T02:06:31
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
docker.litellm.ai/berriai/litellm:1.107.0-rc.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.107.0rc3
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.107.0-rc.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.107.0-rc.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.107.0rc3` 是建立在 [`v1.107.0-rc.2`](https://github.com/BerriAI/litellm/releases/tag/v1.107.0-rc.2) 之上的候選版本。沒有新的資料庫 migration。`v1.107.0-rc.3` 標籤指向 [`f9778e9`](https://github.com/BerriAI/litellm/commit/f9778e945daf481495272d68283d51bd72002f7c)。

### 為何推出新的 1.107 候選版本 {#why-a-new-1107-release-candidate}

部分使用者仍在執行 1.107 候選版本，且需要兩個 GitHub Copilot 個別使用者憑證的修正，因此此版本將這些修正帶到該產品線。已有更新的穩定版發佈。若您未執行 1.107 候選版本，請改用[最新穩定版](https://github.com/BerriAI/litellm/releases/latest)。

### 變更內容 {#whats-changed}

- **其他提供者：** 透過新的選填 `github_copilot_host` 欄位，在 GHE.com 租戶上新增 GitHub Copilot 個別使用者憑證 - [PR #47610](https://github.com/BerriAI/litellm/pull/47610)
- **其他提供者：** 修正設定 `GITHUB_COPILOT_CLIENT_ID` 時，GitHub Copilot 個別使用者連線以 `no Copilot access found` 失敗的問題 - [PR #50116](https://github.com/BerriAI/litellm/pull/50116)

這些變更在 [PR #50129](https://github.com/BerriAI/litellm/pull/50129) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.107.0-rc.2...v1.107.0-rc.3
