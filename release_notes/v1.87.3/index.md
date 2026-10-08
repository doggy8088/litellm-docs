---
title: "v1.87.3 - DB 彈性與 Passthrough 強化"
slug: "v1-87-3"
date: 2026-06-13T17:37:18
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
docker.litellm.ai/berriai/litellm:1.87.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.3
```

</TabItem>
</Tabs>

`v1.87.3` 是建立在 [`v1.87.2`](/release_notes/v1.87.2/v1-87-2) 之上的修補版本。它將 1.84.8 的資料庫彈性套件帶到 1.87 系列，新增預算保留切換，強化 Anthropic 串流記錄，並更新相依性。

### 變更內容 {#whats-changed}

- feat(proxy): 新增 `disable_budget_reservation` 一般設定 - [PR #29493](https://github.com/BerriAI/litellm/pull/29493)
- fix(proxy): 透過重新連線 Prisma client 從快取方案錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- feat(proxy): 新增選項以停用資料庫查詢的伺服器端預備敘述句 - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 在驗證期間的 DB 基礎架構錯誤回傳 5xx；僅將真正的驗證失敗保留為 401 - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- fix(passthrough): 當 body model 未知時解析計價模型 - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(passthrough): 在 Anthropic 串流記錄中跳過 `[DONE]` sentinel 與非 JSON SSE frame - [PR #30202](https://github.com/BerriAI/litellm/pull/30202)
- fix(proxy): 在 get_data combined view 中直接回傳已棄用金鑰查詢結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- chore(deps): 升級 pypdf、tornado、aiohttp 限制、vitest 與 brace-expansion - [PR #30220](https://github.com/BerriAI/litellm/pull/30220)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.87.2...v1.87.3
