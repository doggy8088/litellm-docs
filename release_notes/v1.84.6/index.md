---
title: "v1.84.6 - CrowdStrike AIDR 身分擷取"
slug: "v1-84-6"
date: 2026-06-08T18:25:32
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
docker.litellm.ai/berriai/litellm:1.84.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.6
```

</TabItem>
</Tabs>

`v1.84.6` 是基於 [`v1.84.5`](/release_notes/v1.84.5/v1-84-5) 的修補版發行。它回補了 CrowdStrike AIDR 使用者與模型中繼資料擷取，並加入後續修正，讓身分可從兩個中繼資料區塊讀取，而不是在請求帶有 `litellm_metadata` 時被捨棄。

### 變更內容 {#whats-changed}

- feat(guardrails): 擷取 CrowdStrike AIDR 使用者與模型中繼資料 - [PR #29517](https://github.com/BerriAI/litellm/pull/29517)
- fix(guardrails): 從兩個中繼資料區塊讀取 CrowdStrike AIDR 身分 - [PR #29991](https://github.com/BerriAI/litellm/pull/29991)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.5...v1.84.6
