---
title: "v1.86.4 - Azure AD、Batch Auth 與 Passthrough 回補"
slug: "v1-86-4"
date: 2026-06-03T20:10:47
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
docker.litellm.ai/berriai/litellm:1.86.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.4
```

</TabItem>
</Tabs>

`v1.86.4` 是建立在 [`v1.86.3`](/release_notes/v1.86.3/v1-86-3) 之上的修補版。它回補了 1.84 和 1.85 系列中發佈的同樣六項已排程修正：Azure AD token refresh、batch 與 video model routing、org-scoped team key 建立、Vertex Claude effort 處理，以及重複的 passthrough cost callbacks。

### 變更內容 {#whats-changed}

- fix(azure): 在 v1 OpenAI client 路徑中保留 AD token refresh - [PR #28627](https://github.com/BerriAI/litellm/pull/28627)
- fix(proxy): 將去除 batch `body.model` 的內容對回 proxy alias，讓 key 存取檢查可以通過 - [PR #29264](https://github.com/BerriAI/litellm/pull/29264)
- fix(proxy): 在 auth、budget 與 key 檢查之前，先透過 router 解析受管理的 video model ids - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- fix(key_generate): 允許 team members 在 org-scoped teams 上建立 keys（自 v1.84.0-rc.1 起的迴歸）- [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
- fix(vertex): 移除 Vertex Claude models 所拒絕的 `output_config.effort`，例如 Haiku 4.5 - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)
- fix(passthrough): 停止 Anthropic streaming pass-through 的重複 cost callbacks - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.3...v1.86.4
