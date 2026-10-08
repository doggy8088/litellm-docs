---
title: "v1.94.1 - 已還原團隊金鑰預算強制執行"
slug: "v1-94-1"
date: 2026-07-30T21:45:00
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
docker.litellm.ai/berriai/litellm:1.94.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.94.1
```

</TabItem>
</Tabs>

`v1.94.1` 是建構在 [`v1.94.0`](/release_notes/v1.94.0/v1-94-0) 之上的修補版發行。它還原了將使用者的個人 `max_budget` 套用到其團隊金鑰的變更。

如果您正在使用 `v1.94.0`，建議升級至 `v1.94.1`。在 `v1.94.0` 下，一旦使用者的個人支出超過其自己的 `max_budget`，即使團隊仍有預算，使用該使用者所屬團隊範圍金鑰發出的每個請求都會被拒絕並回傳 `429 ExceededBudget`。這項檢查同時會在管理路由與 LLM 路由上執行，而 Admin UI 工作階段權杖本身就是團隊範圍，因此受影響的使用者也會被鎖定在儀表板之外：金鑰清單、團隊清單與大多數其他面板都會回傳 `429`，且頁面會顯示為空白。

團隊範圍金鑰現在再次只受團隊與團隊成員預算管理。使用者的個人 `max_budget` 仍然適用於其個人金鑰，且維持不變。

`general_settings.skip_user_budget_on_team_key` 標記是在 `v1.94.0` 中作為可選關閉項而新增的，本版已將其移除。它存在的目的只是關閉已還原的行為，因此隨著該行為一起移除，而不是保留成一個毫無作用的設定。如果您有設定它，請將其從設定中移除；它所恢復的階層現在已是預設值。

### 變更內容 {#whats-changed}

- revert(proxy): 停止對團隊金鑰強制執行使用者預算 - [PR #35271](https://github.com/BerriAI/litellm/pull/35271)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.94.0...v1.94.1
