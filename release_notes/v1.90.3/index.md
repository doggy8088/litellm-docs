---
title: "v1.90.3 - Bedrock 工具設定與 MCP 記錄去識別化"
slug: "v1-90-3"
date: 2026-07-03T19:17:20
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
docker.litellm.ai/berriai/litellm:1.90.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.3
```

</TabItem>
</Tabs>

`v1.90.3` 是建構於 [`v1.90.2`](/release_notes/v1.90.2/v1-90-2) 之上的修補版。它移除了 Claude Opus 4.7/4.8 的 Bedrock Converse 不支援的 `toolSpec.strict` 欄位，會遵守 Bedrock `tool_config` 快取注入點的快取 TTL，並停止 MCP client 記錄 tool-call input。

### 變更內容 {#whats-changed}

- fix(bedrock/converse): 為 Opus 4.7/4.8 移除 toolSpec.strict - [PR #31582](https://github.com/BerriAI/litellm/pull/31582)
- fix(bedrock): 在 tool_config 快取注入點遵循 ttl - [PR #31929](https://github.com/BerriAI/litellm/pull/31929)
- fix(mcp): 停止在 MCP 用戶端記錄 tool-call 輸入 - [PR #31393](https://github.com/BerriAI/litellm/pull/31393)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.2...v1.90.3
