---
title: "v1.85.7 - 串流成本復原與 Cache-Control 上限"
slug: "v1-85-7"
date: 2026-06-24T04:58:06
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
docker.litellm.ai/berriai/litellm:1.85.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.85.7
```

</TabItem>
</Tabs>

`v1.85.7` 是建立在 [`v1.85.6`](/release_notes/v1.85.6/v1-85-6) 之上的修補版發行。它回補了中斷的 Anthropic 串流的成本追蹤復原，將 Anthropic `cache_control` 注入上限設為 4 個區塊的 API 限制，並納入 OpenSSL 與 OSV 標記的相依性升級以涵蓋 CVE。此外，也透過將 dict `server_tool_use` 強制轉型為具型別的 `ServerToolUse` 物件來強化使用量解析。

### 變更內容 {#whats-changed}

- fix(integrations): 將 Anthropic cache_control 注入上限設為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
- fix(passthrough): 復原中斷的 anthropic 串流之輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 在失敗列中記錄中斷串流的部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- fix(passthrough,streaming): 復原中斷與 agentic Anthropic 串流的成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix(deps): 升級 osv 標記的相依性以清除已知 CVE - [PR #31122](https://github.com/BerriAI/litellm/pull/31122)
- fix(docker): 升級 wolfi-base digest 以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.85.6...v1.85.7
