---
title: "v1.86.5 - Claude Fable 5、CrowdStrike AIDR 與批次檔案驗證"
slug: "v1-86-5"
date: 2026-06-10T19:46:17
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
docker.litellm.ai/berriai/litellm:1.86.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.5
```

</TabItem>
</Tabs>

`v1.86.5` 是建立在 [`v1.86.4`](/release_notes/v1.86.4/v1-86-4) 之上的修補版本。它新增 Claude Fable 5，回補 CrowdStrike AIDR 的身分擷取與後續修正（這是一個升級單調性回補，讓 1.86 分支保留 AIDR 身分歸屬），並透過上傳 `target_model_names` 授權批次檔案。

### 變更內容 {#whats-changed}

- feat: 在 Anthropic、Bedrock、Vertex AI 和 Azure AI 中新增 Claude Fable 5 - [PR #30064](https://github.com/BerriAI/litellm/pull/30064)
- feat(guardrails): 擷取 CrowdStrike AIDR 使用者與模型中繼資料 - [PR #29517](https://github.com/BerriAI/litellm/pull/29517)
- fix(guardrails): 從兩個 metadata bags 讀取 CrowdStrike AIDR 身分 - [PR #29991](https://github.com/BerriAI/litellm/pull/29991)
- fix(proxy): 使用上傳 `target_model_names` 授權批次檔案 (LIT-3593) - [PR #30009](https://github.com/BerriAI/litellm/pull/30009)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.4...v1.86.5
