---
title: "v1.91.3 - Responses 防護欄涵蓋範圍與 OTel 例外事件"
slug: "v1-91-3"
date: 2026-07-11T15:20:47
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
docker.litellm.ai/berriai/litellm:1.91.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.91.3
```

</TabItem>
</Tabs>

`v1.91.3` 是 [`v1.91.2`](/release_notes/v1.91.2/v1-91-2) 之上的修補版本。它將兩項變更回補到 1.91.x 線。第一項恢復了 Responses API 上的防護欄涵蓋範圍：共用內容輔助函式現在會遍歷 Responses item 分類，因此文字防護欄再次能在 `/v1/responses` 上看到使用者與工具輸出文字，而不是掃描空白負載。第二項會將失敗的 LLM 請求記錄為 GenAI 標準的 `gen_ai.client.operation.exception` 記錄事件，並以 WARN 嚴重性帶上例外類型、訊息與堆疊追蹤，讓可觀測性後端能看到完整的失敗資訊。

### 變更內容 {#whats-changed}

- fix(guardrails): 在共用內容輔助函式中遍歷 Responses-API 文字分類 - [PR #32542](https://github.com/BerriAI/litellm/pull/32542)
- feat(otel): 在失敗的 LLM 請求上發出 gen_ai.client.operation.exception 事件 - [PR #32655](https://github.com/BerriAI/litellm/pull/32655)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.91.2...v1.91.3
