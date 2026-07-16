---
title: "v1.85.4 - Azure AD、批次驗證與 Passthrough 回溯移植"
slug: "v1-85-4"
date: 2026-06-03T16:25:32
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
docker.litellm.ai/berriai/litellm:1.85.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.85.4
```

</TabItem>
</Tabs>

`v1.85.4` 是建立在 [`v1.85.3`](/release_notes/v1.85.3/v1-85-3) 之上的修補版發布。它回溯移植了 1.84 系列中相同的六項階段性修正：Azure AD 權杖重新整理、批次與影片模型路由、組織範圍團隊金鑰建立、Vertex Claude 的 effort 處理，以及重複的 passthrough 成本回呼。

### 變更內容 {#whats-changed}

- fix(azure): 在 v1 OpenAI client 路徑中保留 AD token 重新整理 - [PR #28627](https://github.com/BerriAI/litellm/pull/28627)
- fix(proxy): 將剝離後的批次 `body.model` 對回 proxy 別名，讓金鑰存取檢查通過 - [PR #29264](https://github.com/BerriAI/litellm/pull/29264)
- fix(proxy): 在驗證、預算與金鑰檢查之前，先透過路由器解析受管理的影片模型 ID - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- fix(key_generate): 允許團隊成員在組織範圍的團隊上建立金鑰（自 v1.84.0-rc.1 起的回歸） - [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
- fix(vertex): 對會拒絕它的 Vertex Claude 模型（例如 Haiku 4.5）移除 `output_config.effort` - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)
- fix(passthrough): 停止 Anthropic 串流 passthrough 的重複成本回呼 - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.85.3...v1.85.4
