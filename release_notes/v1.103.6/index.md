---
title: "LiteLLM v1.103.6 修復即時交握錯誤與支出記錄重複"
description: "當上游拒絕交握時，即時用戶端會收到錯誤事件，且 chat 轉 Responses 橋接上的大型請求支出只記錄一次。"
slug: "v1-103-6"
date: 2026-10-20T17:26:16
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
docker.litellm.ai/berriai/litellm:1.103.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.6
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.6) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.6` 是建立在 [`v1.103.5`](/release_notes/v1.103.5/v1-103-5) 之上的修補版本。它將 `main` 的兩項修復回移到 `stable/1.103.x`，因此從 `stable/1.102.x` 升級時也能保留它們。沒有新的資料庫遷移。`v1.103.6` 標籤指向 [`dce7feb`](https://github.com/BerriAI/litellm/commit/dce7feb75cf6a8d642a3c6195e5d4159c0269566)

### 有什麼變更 {#whats-changed}

- 當上游即時 API 拒絕 websocket 交握時（例如來自 Azure 的 401），用戶端現在會收到一個指明上游 HTTP 狀態的 `error` 事件。接著 socket 會以 1008 關閉（對應 401 與 403）、以 1013 關閉（對應 429），其他情況則以 1011 關閉。在此之前，用戶端只會看到沒有事件的 1006 或 1011 關閉，且 Azure 轉送可能會讓用戶端 socket 保持開啟 - [PR #42388](https://github.com/BerriAI/litellm/pull/42388)
- chat 轉 Responses 橋接上 256 KiB 以上的非串流請求，其支出只記錄一次而不是兩次，因此單一請求的金鑰、團隊與每日支出不再被計算兩次 - [PR #44508](https://github.com/BerriAI/litellm/pull/44508)

這兩項修復與版本提升於 [PR #47522](https://github.com/BerriAI/litellm/pull/47522) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.5...v1.103.6
