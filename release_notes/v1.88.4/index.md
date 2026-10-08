---
title: "v1.88.4 - Proxy Exception 與防護欄修正"
slug: "v1-88-4"
date: 2026-06-20T14:44:42
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
docker.litellm.ai/berriai/litellm:1.88.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.4
```

</TabItem>
</Tabs>

`v1.88.4` 是建立在 [`v1.88.3`](/release_notes/v1.88.3/v1-88-3) 之上的修補版發行。它會還原可讀的 `ProxyException` 訊息、在 AIM 防護欄封鎖請求時回傳 400 而非 500、限制 Anthropic cache-control 注入，並修正 Datadog 批次分割以及 chat-completions 旗標外洩問題。

### 有哪些變更 {#whats-changed}

- fix(proxy): 填入 Exception.args，使 str(ProxyException) 回傳訊息 - [PR #29015](https://github.com/BerriAI/litellm/pull/29015)
- fix(datadog): 在 413 時分割過大的批次，而不是永遠重新佇列 - [PR #29444](https://github.com/BerriAI/litellm/pull/29444)
- fix: 阻止 use_chat_completions_api 旗標外洩到提供者請求主體中 - [PR #29447](https://github.com/BerriAI/litellm/pull/29447)
- fix(integrations): 將 Anthropic cache_control 注入上限設為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
- fix(guardrails): 當 AIM 封鎖請求時回傳 400 而非 500 - [PR #30573](https://github.com/BerriAI/litellm/pull/30573)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.3...v1.88.4
