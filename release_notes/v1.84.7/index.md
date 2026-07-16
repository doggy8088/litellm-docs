---
title: "v1.84.7 - Claude Fable 5 與批次檔案授權"
slug: "v1-84-7"
date: 2026-06-10T18:11:13
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
docker.litellm.ai/berriai/litellm:1.84.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.7
```

</TabItem>
</Tabs>

`v1.84.7` 是建立在 [`v1.84.6`](/release_notes/v1.84.6/v1-84-6) 之上的修補版發行。它在 Anthropic、Bedrock、Vertex AI 和 Azure AI 上新增 Claude Fable 5，並使用上傳 `target_model_names` 授權批次檔案。

### 有哪些變更 {#whats-changed}

- feat: 在 Anthropic、Bedrock、Vertex AI 和 Azure AI 上新增 Claude Fable 5 - [PR #30064](https://github.com/BerriAI/litellm/pull/30064)
- fix(proxy): 使用上傳 `target_model_names` 授權批次檔案 (LIT-3593) - [PR #30009](https://github.com/BerriAI/litellm/pull/30009)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.6...v1.84.7
