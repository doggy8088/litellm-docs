---
title: "LiteLLM v1.110.2 與 v1.111.0rc3 修正 Responses 串流重啟"
description: "Responses 串流在輸出送達用戶端後不再重試，且 GPT-6.2 會在已儲存的 Chat Completions 與 Messages 請求上快取系統提示詞。"
slug: "v1-110-2"
date: 2026-11-20T04:05:22
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
docker.litellm.ai/berriai/litellm:1.110.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.110.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.110.2` 是接在 [`v1.110.1`](/release_notes/v1.110.1/v1-110-1) 之上的修補版本。沒有新的資料庫遷移。`v1.110.2` 標籤指向 [`c3cafa3`](https://github.com/BerriAI/litellm/commit/c3cafa3782642685ef10777e4c5931400c0a7176)。

### 變更內容 {#whats-changed}

- **Anthropic：**修正 `temperature=1` 在 Anthropic、Vertex AI 與 Azure AI 上已移除取樣參數的 Claude 模型回傳 400 的問題，此問題自 v1.110.0-rc.2 起存在 - [PR #52341](https://github.com/BerriAI/litellm/pull/52341)
- **Responses API：**修正串流在輸出送達用戶端後仍重試的問題，該問題會傳送重複事件並收取額外呼叫費用 - [PR #52461](https://github.com/BerriAI/litellm/pull/52461)
- **Responses API：**修正串流在推理輸出後失敗時，於備援群組重新啟動並傳送第二個回應的問題 - [PR #52616](https://github.com/BerriAI/litellm/pull/52616)
- **快取：**修正 GPT-6.2 系統提示詞在 `/v1/chat/completions` 與 `/v1/messages` 上，除非 `store: false` 否則無法使用提示詞快取的問題 - [PR #52906](https://github.com/BerriAI/litellm/pull/52906)
- **成本追蹤與定價：**修正 `/v1/messages` 上轉發的 Anthropic 憑證忽略部署自訂價格的問題，此問題自 v1.109.0 起存在 - [PR #52313](https://github.com/BerriAI/litellm/pull/52313)
- **金鑰、團隊與驗證：**修正未設定 `jwt_issuer` 的 JWT 金鑰對應在設定 `litellm_jwtauth.issuers` 時需 5 分鐘才生效的問題，此問題自 v1.103.0 起存在 - [PR #52350](https://github.com/BerriAI/litellm/pull/52350)
- **金鑰、團隊與驗證：**修正 `/key/info` 讓沒有使用者的金鑰可透過雜湊或別名讀取其他無使用者的金鑰的問題 - [PR #52838](https://github.com/BerriAI/litellm/pull/52838) 與 [PR #52925](https://github.com/BerriAI/litellm/pull/52925)
- **效能：**修正每個已完成的請求在完整 GC 前一直留在記憶體中導致記憶體增長的問題，此問題自 v1.110.0-rc.1 起存在 - [PR #51888](https://github.com/BerriAI/litellm/pull/51888)

這些變更已回移至 [PR #52463](https://github.com/BerriAI/litellm/pull/52463)、[PR #52469](https://github.com/BerriAI/litellm/pull/52469)、[PR #52690](https://github.com/BerriAI/litellm/pull/52690)、[PR #52751](https://github.com/BerriAI/litellm/pull/52751)、[PR #52920](https://github.com/BerriAI/litellm/pull/52920) 與 [PR #52938](https://github.com/BerriAI/litellm/pull/52938)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.1...v1.110.2
