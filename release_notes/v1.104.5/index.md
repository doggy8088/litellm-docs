---
title: "LiteLLM v1.104.5 在 Bedrock Runtime 無法計算時，於 Bedrock Mantle 上計算 Claude token"
description: "Bedrock 上較新 Claude 模型的 token 計數來自 Bedrock Mantle 端點，而不是低估的本地估計。"
slug: "v1-104-5"
date: 2026-10-21T05:47:40
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.104.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.5
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.104.5`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.5) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.104.5` 是建立在 [`v1.104.4`](/release_notes/v1.104.4/v1-104-4) 之上的修補版本。它將 token 計數的 Bedrock Mantle 備援回移到 `stable/1.104.x`。沒有新的資料庫遷移。`v1.104.5` 標籤指向 [`5275320`](https://github.com/BerriAI/litellm/commit/5275320b6101fed58dd2294fb2fe93a7d39d599a)

### 有什麼變更 {#whats-changed}

- Bedrock Runtime CountTokens 會拒絕較新的 Claude 模型，因此 `/v1/messages/count_tokens` 會備援至低估的本地估計。對於 Claude 模型的 400 或 404，計數現在來自 Bedrock Mantle Anthropic 端點，且只有在 Mantle 也失敗時才備援至本地估計。非 Claude 模型永遠不會呼叫 Mantle - [PR #45317](https://github.com/BerriAI/litellm/pull/45317)、[PR #46430](https://github.com/BerriAI/litellm/pull/46430)

此修復與版本提升於 [PR #47634](https://github.com/BerriAI/litellm/pull/47634) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.4...v1.104.5
