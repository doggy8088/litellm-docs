---
title: "v1.89.3 - 防護欄與 Cache-Control 修正"
slug: "v1-89-3"
date: 2026-06-20T14:45:08
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

:::info 更新：未發現效能回歸

本說明先前版本曾標示可能有吞吐量回歸。我們已進行調查，無法在已發布版本中確認或重現任何回歸。我們收到的唯一一則回報來自一個在我們提供的內容之上執行自訂程式碼的部署，而我們的測試顯示最可能的原因是那些變更，而不是 LiteLLM。

正確性與錯誤率從未受到影響。如果您正在使用此版本，無需採取任何行動。

我們仍在監控後續回報，若有任何變化，將更新本說明。

:::

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.89.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.3
```

</TabItem>
</Tabs>

`v1.89.3` 是建置在 [`v1.89.2`](/release_notes/v1.89.2/v1-89-2) 之上的修補版發行。它回補了防護欄正確性修正（針對模型層級防護欄的單次 pre_call hook、每次輪詢時不重新初始化 DB、當 AIM 封鎖請求時回傳 400 而非 500），並將 Anthropic cache-control 注入上限設為 4 個區塊限制。

### 變更內容 {#whats-changed}

- fix(integrations): 將 Anthropic cache_control 注入上限限制為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
- fix(guardrails): 針對模型層級防護欄僅執行一次 pre_call hook - [PR #30543](https://github.com/BerriAI/litellm/pull/30543)
- fix(guardrails): 停止在每次輪詢時重新初始化 DB 防護欄 - [PR #30542](https://github.com/BerriAI/litellm/pull/30542)
- fix(guardrails): 當 AIM 封鎖請求時回傳 400 而非 500 - [PR #30573](https://github.com/BerriAI/litellm/pull/30573)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.89.2...v1.89.3
