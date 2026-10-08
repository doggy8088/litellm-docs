---
title: "v1.84.4 - 重設預算與可觀測性修正"
slug: "v1-84-4"
date: 2026-05-31T00:00:00
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
docker.litellm.ai/berriai/litellm:1.84.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.4
```

</TabItem>
</Tabs>

`v1.84.4` 是建立在 [`v1.84.3`](/release_notes/v1.84.3/v1-84-3) 之上的修補版發布。它修正了影響 `v1.84` 這一行上 UI 建立金鑰的 `ResetBudgetJob` 回歸問題，移除了 Claude Code 串流重複的可觀測性匯出，並且收緊了代理程式驗證指標標籤中的 Bearer-prefix 邊界情況。

### 錯誤修正 {#bug-fixes}

- **消費追蹤、預算與速率限制**
    - `ResetBudgetJob` 不再預先將消費計數器歸零，且只會在週期回轉時寫入 `{spend, budget_reset_at}`。在 `v1.84.0+` 上，這先前會對每個 UI 建立的金鑰靜默失敗，導致在週期邊界消費量被凍結，並在每次排程器 tick 時開啟一個短暫的預算執行旁路視窗 - [PR #29358](https://github.com/BerriAI/litellm/pull/29358)

- **記錄 / 可觀測性**
    - 透過僅精確執行一次 success handler，而不是同時執行 `async_success_handler` 和 `success_handler`，停止在已完成的串流上傳送重複的 Datadog 記錄與 OTLP traces（Arize Phoenix、Langfuse 等）- [PR #29311](https://github.com/BerriAI/litellm/pull/29311)（原始為 [PR #29089](https://github.com/BerriAI/litellm/pull/29089)）

- **代理程式驗證**
    - 在 safe-hash helper 中將 `Bearer ` 前綴正規化，讓失敗指標標籤不論呼叫端是否移除了前綴，都會以相同方式進行雜湊 - [PR #29343](https://github.com/BerriAI/litellm/pull/29343)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.3...v1.84.4
