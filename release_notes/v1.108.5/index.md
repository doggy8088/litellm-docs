---
title: "LiteLLM v1.108.5 (LTS) 修復 OpenAI 路由上的 workload identity 與轉錄成本"
description: "無金鑰的 workload identity OpenAI 部署現在可在所有路由上運作，部分 FLAC 檔案的轉錄成本已修正，ollama_chat 平行工具呼叫會以各自的 index 進行串流。"
slug: "v1-108-5"
date: 2026-11-10T22:51:37
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

:::tip

`v1.108.5` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可維持在最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.108.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.5
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.108.5`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.5) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.5` 是 [`v1.108.4`](/release_notes/v1.108.4/v1-108-4) 之上的修補版本。沒有新的資料庫 migration。`v1.108.5` 標籤指向 [`2a61f21`](https://github.com/BerriAI/litellm/commit/2a61f2114d45016bae77930903e65172cd8e762c)。

### 變更內容 {#whats-changed}

- **OpenAI：** 修復無金鑰 workload identity 部署在圖片編輯、音訊、檔案、批次與其他路由上回應 401 的問題 - [PR #50962](https://github.com/BerriAI/litellm/pull/50962)
- **其他提供者：** 修復 `ollama_chat/` 串流讓每個平行工具呼叫的 index 都變成 0，導致用戶端只執行第一個呼叫的問題 - [PR #50718](https://github.com/BerriAI/litellm/pull/50718)
- **Messages API：** 修復 `/v1/messages` 對部署的 `additional_drop_params` 中列出的參數回應 400 的問題 - [PR #50755](https://github.com/BerriAI/litellm/pull/50755)
- **成本追蹤與定價：** 修復部分 FLAC 檔案轉錄成本不正確、可能使金鑰超出預算的問題 - [PR #50860](https://github.com/BerriAI/litellm/pull/50860)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.4...v1.108.5
