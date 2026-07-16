---
title: "v1.85.6 - 資料庫韌性回補"
slug: "v1-85-6"
date: 2026-06-13T17:14:49
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
docker.litellm.ai/berriai/litellm:1.85.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.85.6
```

</TabItem>
</Tabs>

`v1.85.6` 是建立在 [`v1.85.5`](/release_notes/v1.85.5/v1-85-5) 之上的修補版本。它回補了資料庫韌性相關變更集（Prisma 重新連線、prepared-statement 與 timeout 控制、在驗證期間遇到 DB 基礎架構錯誤時回傳 5xx），以及 passthrough 記錄和計費修正、路由修正與相依性升級。

### 有哪些變更 {#whats-changed}

- fix(router): 使用轉送的 model_id 來處理原生 Azure container IDs - [PR #27921](https://github.com/BerriAI/litellm/pull/27921)
- fix(proxy): 公開 Prisma idle/connect timeout 與額外的 DB URL 參數 - [PR #28395](https://github.com/BerriAI/litellm/pull/28395)
- fix(proxy): 透過重新連線 Prisma client 來從快取的 plan 錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- feat(proxy): 新增選項以停用 DB 查詢的伺服器端 prepared statements - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 在驗證期間遇到 DB 基礎架構錯誤時回傳 5xx - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- fix(passthrough): 在 body model 不明時解析計費 model - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(passthrough): 在 Anthropic 串流記錄中略過 `[DONE]` sentinels 和非 JSON 的 SSE frame - [PR #30404](https://github.com/BerriAI/litellm/pull/30404)
- fix(proxy): 在 get_data combined view 中直接回傳 deprecated-key 查詢結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- chore(deps): 升級 vitest、brace-expansion、pypdf 和 tornado - [PR #30220](https://github.com/BerriAI/litellm/pull/30220)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.85.5...v1.85.6
