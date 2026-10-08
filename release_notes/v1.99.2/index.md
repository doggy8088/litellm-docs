---
title: "v1.99.2 - 呼叫端逾時冷卻"
slug: "v1-99-2"
date: 2026-09-15T10:00:00
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

:::info[這是僅適用於 Docker 的版本]

`v1.99.2` 以容器映像檔形式發布。此版本沒有 PyPI 套件，因此 `pip install litellm==1.99.2` 無法解析，而 `1.99.0` 是這條線路曾發布到 PyPI 的最新版本。如果您從 PyPI 安裝 LiteLLM，這個修正目前還不會到達您這裡：它位於開發線上，但不在目前的 PyPI 發行版 `1.101.0` 中，所以會在之後的版本才會提供。

`latest` 標籤並不指向此版本。LiteLLM 已經遠遠超過 1.99 線路，因此 `latest` 會維持原樣，您需要以名稱要求 `1.99.2`。

:::

## 部署此版本 {#deploy-this-version}

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.99.2
```

`v1.99.2` 是建立在 [`v1.99.1`](/release_notes/v1.99.1/v1-99-1) 之上的修補版。它會阻止呼叫端自身的請求逾時，將部署從其他人可用的輪替中移除。

如果您的 proxy 執行具有較低 `allowed_fails` 的模型群組，而且呼叫端會設定各自每次請求的 `timeout`，這個版本值得採用。在此之前，送出 `"timeout": 0.001` 並收到對應 408 的請求會被算作部署失敗，因此一個沒耐心的呼叫端就可能讓健康的部署進入冷卻，且該模型群組上的其他所有呼叫端都會看到「沒有可用的部署」，直到冷卻期結束為止。現在，只有在 408 抵達時已經晚於呼叫端自身逾時可能觸發的時間點，才會將其計入部署；也就是說，超過那個時間點後，已經不是呼叫端，而是提供者本身跑得太久。

這個防護刻意設得很狹窄。若部署本身配置了較小的 `timeout`，在收到 408 時仍會進入冷卻，因此真正緩慢或不健康的部署仍會照常被移出輪替。將逾時標記為由呼叫端設定的是 proxy，因此透過 SDK 直接驅動 Router 的呼叫端，不論哪種情況都不受影響。

此版本也在鎖定檔中將 tornado 更新至 6.5.8、GitPython 更新至 3.1.59，以及 pypdf 更新至 6.16.1，這些版本在開發線上都已解析為相同或更高版本。這些都是鎖定檔變更，因此會透過映像檔和鎖定的開發環境提供給您，而且沒有任何已宣告的相依版本範圍變動。沒有設定變更。

### 有哪些變更 {#whats-changed}

- fix(router): 停止將呼叫者設定的 timeout 408s 納入 deployment 冷卻時間 - [PR #41230](https://github.com/BerriAI/litellm/pull/41230)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.99.1...v1.99.2
