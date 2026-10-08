---
title: "v1.90.2 - 即時穩定性與受限記錄"
slug: "v1-90-2"
date: 2026-07-01T02:09:44
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
docker.litellm.ai/berriai/litellm:1.90.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.2
```

</TabItem>
</Tabs>

`v1.90.2` 是建立在 [`v1.90.1`](/release_notes/v1.90.1/v1-90-1) 之上的修補版發布。它透過防止第二次 Gemini Live 設定、重試卡住的交握，以及關閉防護欄繞過，來加強即時處理，並將即時成功記錄導向受限記錄工作程序，因此不再與事件迴圈上的請求處理競爭。

### 有哪些變更 {#whats-changed}

- fix(realtime): 停止第二個 Gemini Live 設定，重試卡住的握手，關閉防護欄繞過 - [PR #31519](https://github.com/BerriAI/litellm/pull/31519)
- fix(logging): 將即時成功記錄路由到有界工作者 - [PR #31733](https://github.com/BerriAI/litellm/pull/31733)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.1...v1.90.2
