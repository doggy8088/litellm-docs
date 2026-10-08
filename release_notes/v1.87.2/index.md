---
title: "v1.87.2 - Claude Fable 5, Batch Auth, CrowdStrike & Mantle SigV4"
slug: "v1-87-2"
date: 2026-06-10T21:47:54
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
docker.litellm.ai/berriai/litellm:1.87.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.2
```

</TabItem>
</Tabs>

`v1.87.2` 是建立在 [`v1.87.1`](/release_notes/v1.87.1/v1-87-1) 之上的修補版本。它加入了 Claude Fable 5、批次檔授權、CrowdStrike AIDR 身分配對，以及 Bedrock Mantle Responses API 路由的 SigV4/IAM 驗證。

### 有哪些變更 {#whats-changed}

- feat: 在 Anthropic、Bedrock、Vertex AI 和 Azure AI 中新增 Claude Fable 5 - [PR #30064](https://github.com/BerriAI/litellm/pull/30064)
- fix(proxy): 使用上傳 `target_model_names` 授權批次檔 (LIT-3593) - [PR #30009](https://github.com/BerriAI/litellm/pull/30009)
- feat(guardrails): 擷取 CrowdStrike AIDR 使用者與模型中繼資料 - [PR #29517](https://github.com/BerriAI/litellm/pull/29517)
- fix(guardrails): 從兩個 metadata bag 讀取 CrowdStrike AIDR 身分 - [PR #29991](https://github.com/BerriAI/litellm/pull/29991)
- feat(bedrock_mantle): 為 Responses API 路由新增 SigV4/IAM 驗證，並包含其前置需求 Mantle Responses 路由 (#29490) - [PR #29788](https://github.com/BerriAI/litellm/pull/29788)

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.87.1...v1.87.2
