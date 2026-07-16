---
title: "v1.84.10 - 中斷串流成本回收"
slug: "v1-84-10"
date: 2026-06-24T04:00:54
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
docker.litellm.ai/berriai/litellm:1.84.10
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.10
```

</TabItem>
</Tabs>

`v1.84.10` 是建構在 [`v1.84.9`](/release_notes/v1.84.9/v1-84-9) 之上的修補版本。它回補了針對中斷的 Anthropic 串流之成本追蹤回復——回收輸出 token、在失敗列記錄部分支出，以及為中斷與 agentic 串流計費——同時也包含為了涵蓋 CVE 而更新的 OpenSSL 與 OSV 標記依賴套件。

### 變更內容 {#whats-changed}

- fix(passthrough): 修復中斷的 Anthropic 串流之輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 將中斷串流的部分支出記錄在失敗列 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- fix(passthrough,streaming): 復原中斷及 agentic Anthropic 串流的成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix(deps): 升級有 OSV 標記的相依套件以清除已知 CVE - [PR #31122](https://github.com/BerriAI/litellm/pull/31122)
- fix(docker): 更新 wolfi-base digest 以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.9...v1.84.10
