---
title: "v1.84.8 - 資料庫韌性與寬限期金鑰輪替"
slug: "v1-84-8"
date: 2026-06-12T18:20:57
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
docker.litellm.ai/berriai/litellm:1.84.8
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.8
```

</TabItem>
</Tabs>

`v1.84.8` 是基於 [`v1.84.7`](/release_notes/v1.84.7/v1-84-7) 的修補版本。它回溯移植了資料庫韌性相關的一組修正（Prisma 重新連線、prepared statement 與 timeout 控制、認證期間資料庫基礎架構錯誤回傳 5xx），以及完整的寬限期金鑰輪替修正，外加路由與串流修正。

### 有哪些變更 {#whats-changed}

- fix(anthropic): 修正串流 reasoning token 用量 - [PR #27319](https://github.com/BerriAI/litellm/pull/27319)
- fix(proxy): 寬限期金鑰輪替已棄用金鑰查找 - [PR #27756](https://github.com/BerriAI/litellm/pull/27756)
- fix(router): native Azure container IDs 使用轉送的 model_id - [PR #27921](https://github.com/BerriAI/litellm/pull/27921)
- fix(proxy): 透過重新連線 Prisma client 從快取方案錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- fix(proxy): 公開 Prisma 閒置/連線 timeout 與額外 DB URL 參數 - [PR #28395](https://github.com/BerriAI/litellm/pull/28395)
- feat(proxy): 新增停用資料庫查詢伺服器端 prepared statements 的選項 - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 認證期間資料庫基礎架構錯誤回傳 5xx - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- fix(passthrough): 當 body model 未知時解析 costing model - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(proxy): 在 get_data combined view 中直接回傳已棄用金鑰查找結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.7...v1.84.8
