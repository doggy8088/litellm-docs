---
title: "v1.89.1 - DB 彈性、MCP 與 Model-Info 回補"
slug: "v1-89-1"
date: 2026-06-15T20:08:03
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
docker.litellm.ai/berriai/litellm:1.89.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.1
```

</TabItem>
</Tabs>

`v1.89.1` 是建立在 [`v1.89.0`](/release_notes/v1.89.0/v1-89-0) 之上的修補版發布。它將 1.84.8 的 database-resilience 套件帶入 1.89 線，強化 MCP OAuth 與憑證路徑，對齊 `/v1/model/info` 與 `/v2/model/info` 介面，新增預算保留切換，並重新整理相依性。

### 有哪些變更 {#whats-changed}

- fix(proxy): 透過重新連線 Prisma 用戶端來從快取的計畫錯誤中復原 - [PR #29983](https://github.com/BerriAI/litellm/pull/29983)
- feat(proxy): 新增停用資料庫查詢伺服器端預備語句的選項 - [PR #29984](https://github.com/BerriAI/litellm/pull/29984)
- fix(proxy): 在 DB 基礎架構錯誤的驗證期間回傳 5xx；僅在真正的驗證失敗時保留 401 - [PR #29986](https://github.com/BerriAI/litellm/pull/29986)
- feat(proxy): 新增 `disable_budget_reservation` 一般設定 - [PR #29493](https://github.com/BerriAI/litellm/pull/29493)
- fix(proxy): 將 `/v1/model/info` 與路由部署對齊 - [PR #30025](https://github.com/BerriAI/litellm/pull/30025)
- fix(proxy): 在 `/v1/model/info` 上填入 `access_via_team_ids` - [PR #30274](https://github.com/BerriAI/litellm/pull/30274)
- feat(proxy): 在 Swagger OpenAPI 規格中發布 `/v2/model/info` - [PR #29900](https://github.com/BerriAI/litellm/pull/29900)
- fix(proxy): 於 `get_data` 整合檢視中直接回傳已棄用金鑰查詢結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- fix(mcp): 移除委派 OAuth2 工具請求上的幽靈 401 span - [PR #30494](https://github.com/BerriAI/litellm/pull/30494)
- fix(mcp): 在刪除 MCP 伺服器時，移除孤立的每位使用者憑證列 - [PR #30141](https://github.com/BerriAI/litellm/pull/30141)
- fix(mcp): 在 OAuth authorize/token 存取檢查中允許團隊存取群組授權 - [PR #30041](https://github.com/BerriAI/litellm/pull/30041)
- fix(ui/mcp): 在 create-server modal 關閉時重設 OAuth 狀態，讓先前伺服器的 token 不再洩漏到下一個 add-server 工作階段 - [PR #30000](https://github.com/BerriAI/litellm/pull/30000)
- fix(mcp): 透過支援 OBO/passthrough 的 GET 路徑載入 MCP tool configuration tools - [PR #29960](https://github.com/BerriAI/litellm/pull/29960)
- fix(mcp): 讓非建立者使用者可從 Tools 頁面以 OAuth 登入 OBO 模式的 MCP 伺服器 - [PR #29867](https://github.com/BerriAI/litellm/pull/29867)
- fix(passthrough): 在 body model 未知時解析計費 model - [PR #30160](https://github.com/BerriAI/litellm/pull/30160)
- fix(passthrough): 在 Anthropic 串流記錄中跳過 `[DONE]` sentinel 與非 JSON SSE frame - [PR #30202](https://github.com/BerriAI/litellm/pull/30202)
- fix(cost): 解決串流 Anthropic web_search 回應上的 `completion_cost` AttributeError，包含 `server_tool_use` 型別強制轉換前置需求 - [PR #27346](https://github.com/BerriAI/litellm/pull/27346)
- fix(proxy): 使用上傳 `target_model_names` 來授權批次檔案 - [PR #30009](https://github.com/BerriAI/litellm/pull/30009)
- fix(proxy): 在 BYOK 建立時，團隊模型別名與 `team.models` 進行原子性合併 - [PR #29528](https://github.com/BerriAI/litellm/pull/29528)
- feat(datadog): 新增團隊範圍的 Datadog callback 支援 - [PR #29947](https://github.com/BerriAI/litellm/pull/29947)
- feat(bedrock_mantle): 將 SigV4/IAM 驗證新增至 Responses API 路由 - [PR #29788](https://github.com/BerriAI/litellm/pull/29788)
- fix(guardrails): 從兩個 metadata bag 讀取 CrowdStrike AIDR 身分資訊 - [PR #29991](https://github.com/BerriAI/litellm/pull/29991)
- fix(slack): 針對 `expires_in` 預設值使用實際的 Slack return details - [PR #29951](https://github.com/BerriAI/litellm/pull/29951)
- chore(deps): 升級 vitest、brace-expansion、pypdf 與 tornado - [PR #30220](https://github.com/BerriAI/litellm/pull/30220)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.89.0...v1.89.1
