---
title: "v1.86.7 - 串流成本回收與 MCP 金鑰範圍設定"
slug: "v1-86-7"
date: 2026-06-24T18:28:34
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
docker.litellm.ai/berriai/litellm:1.86.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.7
```

</TabItem>
</Tabs>

`v1.86.7` 是建置於 [`v1.86.6`](/release_notes/v1.86.6/v1-86-6) 之上的修補版本。它回補了中斷的 Anthropic 串流之成本追蹤回收功能，新增一個 `no-mcp-servers` sentinel，用來將金鑰範圍限定為零個 MCP 伺服器，將 Anthropic `cache_control` 注入上限限制為 4 個區塊的 API 限額，並升級 OpenSSL 以及 `cryptography`、`python-multipart`、`pydantic-settings` 和 `pypdf` 以涵蓋 CVE。

### 變更內容 {#whats-changed}

- fix(integrations): 將 Anthropic cache_control 注入上限限制為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
- fix(passthrough): 回收中斷的 anthropic 串流之輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 在失敗列為中斷的串流記錄部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- feat(mcp): 使用 no-mcp-servers sentinel 將金鑰範圍限定為零個 MCP 伺服器 - [PR #31029](https://github.com/BerriAI/litellm/pull/31029)
- fix(passthrough,streaming): 回收中斷與 agentic Anthropic 串流的成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix(docker): 更新 wolfi-base digest 以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.6...v1.86.7
