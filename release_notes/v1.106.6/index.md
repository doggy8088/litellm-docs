---
title: "LiteLLM v1.106.6 與 v1.105.7 修正 gzip 效能回歸"
description: "代理程式只對儀表板分析回應進行 gzip 壓縮，並在 worker 執行緒上壓縮，因此 gzip 不再拖慢推論請求。"
slug: "v1-106-6"
date: 2026-10-28T23:03:09
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
docker.litellm.ai/berriai/litellm:1.106.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.6
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.6) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

:::danger 重大變更

**儀表板分析路由之外的推論與其他端點不再回傳 gzip 回應。** 代理程式在這些路由上會忽略 `Accept-Encoding: gzip`，因此它們的回應在傳輸時較大。LiteLLM 沒有可還原舊行為的設定。若您需要壓縮後的回應，請在代理程式前方的反向代理或負載平衡器上開啟壓縮。請參閱 [PR #46712](https://github.com/BerriAI/litellm/pull/46712)。

:::

`v1.106.6` 是建立在 [`v1.106.5`](/release_notes/v1.106.5/v1-106-5) 之上的修補版本。它修正 [`v1.106.5`](/release_notes/v1.106.5/v1-106-5) 說明所警告的 `stable/1.106.x` 上的 gzip 效能回歸。沒有新的資料庫 migration。`v1.106.6` 標籤指向 [`61c6ab7`](https://github.com/BerriAI/litellm/commit/61c6ab78393ef45683dd7d963d2a315bd845e20b)。

### 變更內容 {#whats-changed}

- 代理程式只對儀表板分析路由（例如 Usage 與 Cost Optimization 頁面）的回應進行 gzip 壓縮，並在 worker 執行緒而非事件迴圈上壓縮。以 `Accept-Encoding: gzip` 傳送的請求（大多數 HTTP 用戶端與 OpenAI SDK 都預設傳送）不再拖慢同一個 worker 上的其他請求 - [PR #46712](https://github.com/BerriAI/litellm/pull/46712)

此變更與版本提升在 [PR #48680](https://github.com/BerriAI/litellm/pull/48680) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.5...v1.106.6
