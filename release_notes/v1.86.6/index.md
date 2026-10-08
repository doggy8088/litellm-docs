---
title: "v1.86.6 - DB 復原能力、Passthrough 與相依性回補"
slug: "v1-86-6"
date: 2026-06-13T17:37:03
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
docker.litellm.ai/berriai/litellm:1.86.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.6
```

</TabItem>
</Tabs>

`v1.86.6` 是建立在 [`v1.86.5`](/release_notes/v1.86.5/v1-86-5) 之上的修補版本。它將 1.84.8 的資料庫復原能力與 passthrough 功能集帶入 1.86 系列，新增預算保留切換，強化 Anthropic 串流記錄，並更新相依性。

### 有哪些變更 {#whats-changed}

- fix(router): 使用轉送的 model_id 來處理原生 Azure container IDs - [PR #27921](https://github.com/BerriAI/litellm/pull/27921)
- fix(proxy): 暴露 Prisma 閒置/連線逾時與額外 DB URL 參數 - [PR #28395](https://github.com/BerriAI/litellm/pull/28395)
- feat(proxy): 新增 `disable_budget_reservation` 全域設定 - [PR #29493](https://github.com/BerriAI/litellm/pull/29493)
- fix(proxy): 透過重新連線 Prisma client 來從快取的規劃錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- feat(proxy): 新增停用 DB 查詢伺服器端預備陳述式的選項 - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 在驗證期間發生 DB 基礎設施錯誤時回傳 5xx；401 保留給真正的驗證失敗 - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- fix(passthrough): 在 body model 不明時解析成本模型 - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(passthrough): 在 Anthropic 串流記錄中略過 `[DONE]` sentinels 與非 JSON SSE frames - [PR #30202](https://github.com/BerriAI/litellm/pull/30202)
- fix(proxy): 在 get_data combined view 中直接回傳已棄用金鑰查詢結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- chore(deps): 提升 pypdf、tornado、aiohttp 約束、vitest 與 brace-expansion 版本 - [PR #30220](https://github.com/BerriAI/litellm/pull/30220)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.5...v1.86.6
