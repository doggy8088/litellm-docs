---
title: "v1.92.1 - Docker 遷移資產、Model Armor 附件與 Anthropic Passthrough"
slug: "v1-92-1"
date: 2026-07-19T03:07:45
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

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.92.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.92.1
```

</TabItem>
</Tabs>

`v1.92.1` 是建立在 [`v1.92.0`](/release_notes/v1.92.0/v1-92-0) 之上的修補版本。它將兩個 Docker 修正回補到 1.92.x 分支：執行階段映像重新包含 `/app/litellm-proxy-extras` 原始碼目錄，因此將 `prisma migrate deploy` 指向該路徑的下游工作會再次套用遷移，而不會在未套用 schema 的情況下以 0 結束；而且 prisma CLI 與引擎會內建於 `/opt/prisma`，這是一個任何執行階段 uid 都可讀取的固定路徑，因此全新資料庫的遷移可在 kubernetes `runAsUser`、`docker --user` 以及其他無法對外連線的非 root 部署中正常運作。

另外也帶入兩個提供者修正。Model Armor 不再遺漏參考附件；`skip_unscannable_attachments` 會將其還原，且已移除附件數量上限。Anthropic passthrough 現在會在針對 4.6 之前的模型降級 adaptive thinking 時，移除不相容的 `temperature`，而不是轉送上游 API 會拒絕的組合。此版本也包含映像鎖定檔中 mcp 與 soupsieve 的例行相依性維護更新。

### 有哪些變更 {#whats-changed}

- fix(docker): 在執行階段映像中還原 litellm-proxy-extras 原始碼目錄 - [PR #33592](https://github.com/BerriAI/litellm/pull/33592)
- fix(docker): 將 prisma CLI 與引擎內建於固定路徑，讓任何 uid 都能離線執行 fresh-DB migrations - [PR #33853](https://github.com/BerriAI/litellm/pull/33853)
- fix(model_armor): 透過 skip_unscannable_attachments 還原參考附件，並移除附件數量上限 - [PR #33554](https://github.com/BerriAI/litellm/pull/33554)
- fix(anthropic/passthrough): 在針對 4.6 之前的模型降級 adaptive thinking 時移除不相容的 temperature - [PR #33244](https://github.com/BerriAI/litellm/pull/33244)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.92.0...v1.92.1
