---
title: "v1.84.5 - Azure AD、Batch Auth 與 Passthrough 回補"
slug: "v1-84-5"
date: 2026-06-03T20:44:41
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
docker.litellm.ai/berriai/litellm:1.84.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.5
```

</TabItem>
</Tabs>

`v1.84.5` 是建立在 [`v1.84.4`](/release_notes/v1.84.4/v1-84-4) 之上的修補版本。它回補了六項已排程修正，涵蓋 Azure AD 權杖重新整理、批次與影片模型路由、組織範圍團隊金鑰建立、Vertex Claude effort 處理，以及重複的 passthrough 成本回呼。

### 變更內容 {#whats-changed}

- fix(azure): 在 v1 OpenAI 用戶端路徑中保留 AD 權杖重新整理 - [PR #28627](https://github.com/BerriAI/litellm/pull/28627)
- fix(proxy): 將移除的 batch `body.model` 對應回 proxy 別名，讓金鑰存取檢查能通過 - [PR #29264](https://github.com/BerriAI/litellm/pull/29264)
- fix(proxy): 在 auth、budget 與 key 檢查之前，先透過 router 解析受管理的影片模型 id - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- fix(key_generate): 讓團隊成員能在 org-scoped 團隊上建立金鑰（自 v1.84.0-rc.1 起的回歸） - [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
- fix(vertex): 對於會拒絕它的 Vertex Claude 模型（例如 Haiku 4.5），移除 `output_config.effort` - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)
- fix(passthrough): 停止 Anthropic 串流 passthrough 的重複成本回呼 - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.4...v1.84.5
