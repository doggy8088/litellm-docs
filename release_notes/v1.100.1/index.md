---
title: "v1.100.1 - 重試麵包屑記憶體修正"
slug: "v1-100-1"
date: 2026-09-10T01:42:29
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
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.100.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.100.1
```

</TabItem>
</Tabs>

`v1.100.1` 是建置於 [`v1.100.0`](/release_notes/v1.100.0/v1-100-0) 之上的修補版本。它只包含一個修正：路由器的重試麵包屑不再保留較早的請求，這可避免在重試頻繁的負載下讓 proxy 當機的記憶體洩漏。Docker 映像與 PyPI 套件皆是從 [`1dba17b`](https://github.com/BerriAI/litellm/commit/1dba17b10ded12ad0021edb453ba2c54e4637928) 建置而成。

如果您在任何部署後方執行 `v1.100.0`，且該部署失敗頻繁到足以觸發重試或備援，請升級。這個版本沒有任何組態變更，也沒有其他內容。

## 重試麵包屑不再洩漏記憶體 {#retry-breadcrumbs-no-longer-leak-memory}

每當請求失敗而路由器重試或備援時，它會在 `metadata.previous_models` 下記錄一筆描述失敗嘗試的麵包屑，作法與 Sentry breadcrumbs 相同。在 `v1.100.0` 下，這筆記錄出了兩個問題。麵包屑清單是存在 `Router` 執行個體上，而不是存在請求上，所以每個觸發重試的請求都會附加到同一個共享清單，並看到不相關的較早請求麵包屑。而且每一筆麵包屑都會複製 proxy 的傳入請求快照，而其主體別名指向實際執行中的請求中繼資料，並包含更早的麵包屑，因此每一筆新麵包屑都會巢狀包含之前的所有麵包屑。在持續重試下，這個結構會以幾何級數成長，事件迴圈把時間都花在複製與字串化上，`/health/liveliness` 從數毫秒變慢到數百毫秒，最後 pod 被 OOM-kill 並重新啟動，接著循環再次開始。任何持續失敗的 Redis 或上游部署都足以觸發這個問題。

麵包屑現在是按請求建立，並限制為最近四次嘗試，而且每一筆都會排除 `proxy_server_request` 快照。記憶體在重試之間保持平穩，而且請求記錄的麵包屑只描述該請求自身的失敗嘗試。這與 `v1.101.0` 中提供的修正相同，並已回補到穩定版本線。

### 有哪些變更 {#whats-changed}

- fix(router): 每個請求保留重試 breadcrumbs，且不納入請求快照 - [PR #40455](https://github.com/BerriAI/litellm/pull/40455) (backport of [PR #39491](https://github.com/BerriAI/litellm/pull/39491))

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.100.0...1dba17b10ded12ad0021edb453ba2c54e4637928
