---
title: "v1.87.1 - Azure AD、Batch 驗證與 Key 存取回補"
slug: "v1-87-1"
date: 2026-06-03T21:54:19
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
docker.litellm.ai/berriai/litellm:1.87.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.1
```

</TabItem>
</Tabs>

`v1.87.1` 是建立在 [`v1.87.0`](/release_notes/v1.87.0/v1-87-0) 之上的修補版發行。它回補了五項已分階段修正：Azure AD token 重新整理、batch 與 video model 路由、org 範圍團隊 key 建立，以及 Vertex Claude effort 處理。另一條分支收到的重複 passthrough cost-callback 修正刻意未在此納入，因為 1.87.x 是另外分支，且採用不同的 passthrough 記錄路徑，該防護不存在。

### 有哪些變更 {#whats-changed}

- fix(azure): 在 v1 OpenAI client 路徑中保留 AD token 重新整理 - [PR #28627](https://github.com/BerriAI/litellm/pull/28627)
- fix(proxy): 將已剝除的 batch `body.model` 對回 proxy alias，讓 key 存取檢查可以通過 - [PR #29264](https://github.com/BerriAI/litellm/pull/29264)
- fix(proxy): 在認證、預算與 key 檢查之前，透過 router 解析受管理的 video model IDs - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- fix(key_generate): 讓團隊成員可在 org 範圍的團隊中建立 keys（自 v1.84.0-rc.1 起的回歸） - [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
- fix(vertex): 為會拒絕它的 Vertex Claude models 移除 `output_config.effort`，例如 Haiku 4.5 - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.87.0...v1.87.1
