---
title: "v1.90.4 - Responses API 防護欄涵蓋範圍"
slug: "v1-90-4"
date: 2026-07-11T13:00:41
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
docker.litellm.ai/berriai/litellm:1.90.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.4
```

</TabItem>
</Tabs>

`v1.90.4` 是在 [`v1.90.3`](/release_notes/v1.90.3/v1-90-3) 之上的修補版發行。它恢復了 Responses API（`/v1/responses`）上的文字防護欄涵蓋範圍。共用的防護欄內容輔助工具現在會遍歷 Responses `input` 分類法（`text`、`input_text` 與 `output_text` 部分類型，以及 `message`、`function_call` 與 `function_call_output` 項目），因此建立在這些輔助工具之上的防護欄（AIM、Lakera v2、Cato、Lasso、Repello、IBM、Azure Content Safety，以及企業祕密偵測）會以與處理聊天完成相同的方式，在 `/v1/responses` 上檢查並遮罩請求文字。

### 變更內容 {#whats-changed}

- fix(guardrails): 在共用內容輔助工具中遍歷 Responses-API 文字分類法 - [PR #32542](https://github.com/BerriAI/litellm/pull/32542)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.3...v1.90.4
