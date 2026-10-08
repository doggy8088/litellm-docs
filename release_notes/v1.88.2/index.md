---
title: "v1.88.2 - DB 彈性、Passthrough、Model-Info 與 Budget"
slug: "v1-88-2"
date: 2026-06-13T19:29:53
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
docker.litellm.ai/berriai/litellm:1.88.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.2
```

</TabItem>
</Tabs>

`v1.88.2` 是在 [`v1.88.1`](/release_notes/v1.88.1/v1-88-1) 之上的修補版本。它回補了一組已合併的變更：資料庫彈性修正、passthrough 更正、`/v1/model/info` 團隊存取鏈、budget 保留切換，以及依賴套件升級。

### 變更內容 {#whats-changed}

- feat(proxy): 新增 `disable_budget_reservation` 一般設定 - [PR #29493](https://github.com/BerriAI/litellm/pull/29493)
- fix(proxy): 透過重新連線 Prisma client 來從快取計畫錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- feat(proxy): 新增停用資料庫查詢伺服器端預先準備語句的選項 - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 在驗證期間於 DB 基礎架構錯誤時回傳 5xx；僅將 401 保留給真正的驗證失敗 - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- fix(passthrough): 在 body model 不明時解析計價 model - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(passthrough): 在 Anthropic 串流記錄中略過 `[DONE]` sentinel 與非 JSON SSE frame - [PR #30202](https://github.com/BerriAI/litellm/pull/30202)
- fix(proxy): 在 get_data 合併檢視中直接回傳 deprecated-key 查詢結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- fix(proxy): 停止 team BYOK 在 model 編輯時發生 model name 損毀 - [PR #29731](https://github.com/BerriAI/litellm/pull/29731)
- fix(proxy): 將 `/v1/model/info` 與 router deployments 對齊 - [PR #30025](https://github.com/BerriAI/litellm/pull/30025)
- fix(proxy): 在 `/v1/model/info` 上填入 `access_via_team_ids` - [PR #30274](https://github.com/BerriAI/litellm/pull/30274)
- chore(deps): 升級 vitest、brace-expansion、pypdf 與 tornado - [PR #30220](https://github.com/BerriAI/litellm/pull/30220)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.1...v1.88.2
