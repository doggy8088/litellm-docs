---
title: "LiteLLM v1.110.3 與 v1.109.4 將閘道 MCP DCR 註冊改為自願加入"
description: "新的無用戶端 MCP DCR 橋接預設會轉發用戶端自身的註冊，除非您選擇加入；v1.110.3 也修正金鑰或團隊更新後 `GET /audit` 回應 500 的問題。"
slug: "v1-110-3"
date: 2026-11-24T04:09:58
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.110.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.3
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.110.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.3) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

:::danger[重大變更]

**設定 `LITELLM_MCP_DCR_GATEWAY_CLIENT=true`，以保留新無用戶端 DCR 橋接的自動閘道擁有註冊。**請參閱 [PR #53059](https://github.com/BerriAI/litellm/pull/53059)。

:::

`v1.110.3` 是接在 [`v1.110.2`](/release_notes/v1.110.2/v1-110-2) 之上的修補版本。沒有新的資料庫遷移。`v1.110.3` 標籤指向 [`e76668a`](https://github.com/BerriAI/litellm/commit/e76668a4719faaa3f8ad68c2c5c42c45211f8135)。

### 變更內容 {#whats-changed}

- **批次與檔案：**修正 `/gemini` 透傳的檔案取得、下載與刪除略過 `/v1/files` 所套用的檔案擁有權檢查的問題 - [PR #53171](https://github.com/BerriAI/litellm/pull/53171) 與 [PR #53210](https://github.com/BerriAI/litellm/pull/53210)
- **MCP：**將閘道擁有的 DCR 用戶端註冊改為自願加入，修正共用服務金鑰出現 `403 oauth_principal_mismatch` 的問題 - [PR #53059](https://github.com/BerriAI/litellm/pull/53059)
- **路由與備援：**修正複雜度路由的請求在模型冷卻期間失敗、而未使用該模型備援的問題 - [PR #52510](https://github.com/BerriAI/litellm/pull/52510)
- **記錄與可觀測性：**修正金鑰或團隊更新後 `GET /audit` 回應 500 的問題，該問題使管理 UI 的稽核記錄頁面空白，自 v1.108.0 起存在 - [PR #50929](https://github.com/BerriAI/litellm/pull/50929) 與 [PR #53305](https://github.com/BerriAI/litellm/pull/53305)

這些變更已回移至 [PR #53109](https://github.com/BerriAI/litellm/pull/53109)、[PR #53178](https://github.com/BerriAI/litellm/pull/53178)、[PR #53207](https://github.com/BerriAI/litellm/pull/53207) 與 [PR #53298](https://github.com/BerriAI/litellm/pull/53298)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.2...v1.110.3
