---
title: "v1.87.5 - Web Search 成本計算與 MCP 金鑰範圍"
slug: "v1-87-5"
date: 2026-06-24T18:28:54
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
docker.litellm.ai/berriai/litellm:1.87.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.5
```

</TabItem>
</Tabs>

`v1.87.5` 是建構於 [`v1.87.4`](/release_notes/v1.87.4/v1-87-4) 之上的修補版本。它回補了中斷的 Anthropic 串流之成本追蹤復原，修正了串流 Anthropic web-search 回應中的 `completion_cost` `AttributeError`，新增了可將金鑰範圍限定為零個 MCP 伺服器的 `no-mcp-servers` sentinel，並將 wolfi-base 映像檔升級以修補 OpenSSL CVE。

### 有哪些變更 {#whats-changed}

- fix(passthrough): 為中斷的 Anthropic 串流恢復輸出 tokens - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 在中斷串流的失敗列上記錄部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- feat(mcp): 將 key 範圍限定為零個 MCP servers，使用 no-mcp-servers sentinel - [PR #31029](https://github.com/BerriAI/litellm/pull/31029)
- fix(passthrough,streaming): 在中斷的與 agentic Anthropic 串流上恢復成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix: 串流 Anthropic web_search 回應上的 completion_cost AttributeError - [PR #27346](https://github.com/BerriAI/litellm/pull/27346)
- fix(docker): 將 wolfi-base digest 升級以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.87.4...v1.87.5
