---
title: "LiteLLM v1.104.6 更換映像簽署金鑰並修復成本追蹤"
description: "新的 cosign 金鑰、移除 eMudhra 根 CA，並修復失敗與批次請求的支出、token 計數，以及 gpt-5.4+ 模型上的工具呼叫。"
slug: "v1-104-6"
date: 2026-10-24T08:40:34
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
docker.litellm.ai/berriai/litellm:1.104.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.6
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.104.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.6) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.104.6` 是建立在 [`v1.104.5`](/release_notes/v1.104.5/v1-104-5) 之上的修補版本。它將映像簽署移至新的 cosign 金鑰、從每個憑證包中移除 eMudhra 根 CA，並將成本追蹤、token 計數與工具呼叫修復從 `main` 回移到 `stable/1.104.x`。沒有新的資料庫遷移。`v1.104.6` 標籤指向 [`4a8940a`](https://github.com/BerriAI/litellm/commit/4a8940a9fb2696122d683976c389179c92f1a6d2)

:::warning 映像簽署金鑰已變更

自此版本起，每個 Docker 映像與 Helm chart 都以來自 commit [`e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 的 cosign 金鑰簽署。以 commit `0112e53` 的舊金鑰驗證將會失敗。請更新任何鎖定舊 `cosign.pub` 的項目，例如 `cosign verify` 指令碼、CI 檢查與准入政策。

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  ghcr.io/berriai/litellm:v1.104.6
```

:::

## 重點摘要 {#key-highlights}

- **新的映像簽署金鑰**：Docker 映像與 Helm chart 以來自 commit `e82a3c6` 的 cosign 金鑰簽署，且每個憑證包都移除 eMudhra 根 CA
- **成本追蹤**：失敗、逾時、取消與溢出的請求會被正確定價，且批次成本追蹤已修復
- **工具呼叫**：橋接至 `/responses` 的 gpt-5.4+ 模型再次於 `choices[0]` 上回傳工具呼叫

## 映像簽署與憑證 {#image-signing-and-certificates}

- SDK、proxy 與 Docker 映像所信任的每個憑證包都不再包含 eMudhra 根 CA - [PR #47670](https://github.com/BerriAI/litellm/pull/47670)、[PR #47969](https://github.com/BerriAI/litellm/pull/47969)
- Docker 映像與 Helm chart 以來自 commit `e82a3c6` 的 cosign 金鑰簽署。來自 commit `0112e53` 的舊金鑰不再能驗證它們 - [PR #48103](https://github.com/BerriAI/litellm/pull/48103)

## 新增模型 / 更新模型 {#new-models--updated-models}

### 錯誤修正 {#bug-fixes}

- **[Azure](../../docs/providers/azure)**
    - 當用戶端送出 `dangerous-tool-use-2026-09-03` beta 時，Azure AI Foundry 不再回傳 400 - [PR #43934](https://github.com/BerriAI/litellm/pull/43934)

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bugs}

- **Chat completions**
    - 來自 gpt-5.4+ 模型的工具呼叫再次落在 `choices[0]` 上，而不是 `choices[1]`。此問題始於 `v1.97.0` - [PR #46099](https://github.com/BerriAI/litellm/pull/46099)
- **Messages API**
    - 在 Bedrock 與 Vertex 上進行適應性思考期間，`/v1/messages` 串流不再把 `message_start` 留置數分鐘。此問題始於 `v1.100.0` - [PR #43600](https://github.com/BerriAI/litellm/pull/43600)
- **Token 計數**
    - 計數端點上 DeepSeek 與 Qwen3.5 的 token 計數不再偏低多達 30% 或偏高一倍 - [PR #47685](https://github.com/BerriAI/litellm/pull/47685)
    - `/v1/messages/count_tokens` 會回傳 HTTP 400，而不是已知錯誤的本地估計 - [PR #47705](https://github.com/BerriAI/litellm/pull/47705)
- **快取**
    - 當 `extra_body` 覆寫用戶端標記時，自動提示快取不再於 `/v1/messages` 上加入額外的快取標記 - [PR #43341](https://github.com/BerriAI/litellm/pull/43341)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- Usage API 在為繁忙的雜湊金鑰查詢名稱時不再逾時 - [PR #43656](https://github.com/BerriAI/litellm/pull/43656)
- 透過模型別名的串流請求會以部署的價格計費，而不是 $0。此問題始於 `v1.92.0` - [PR #44341](https://github.com/BerriAI/litellm/pull/44341)
- 對 `openai/responses/*` 模型的大型非串流 chat 請求，其支出只記錄與收費一次，而不是兩次。此問題始於 `v1.102.0` - [PR #44508](https://github.com/BerriAI/litellm/pull/44508)
- 失敗、逾時、取消與溢出的請求會被正確定價，而不是定價錯誤或完全不定價 - [PR #47718](https://github.com/BerriAI/litellm/pull/47718)
- 批次成本追蹤、claude-haiku-5-5 與 Bedrock 設定檔定價，以及 `/v1/messages` 上的 `safeguards` 請求已修復 - [PR #47726](https://github.com/BerriAI/litellm/pull/47726)

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤修正 {#bugs-1}

- 即使支出記錄關閉或已被清除，使用報告仍會顯示 CLI 工作階段金鑰的擁有者 - [PR #43642](https://github.com/BerriAI/litellm/pull/43642)、[PR #47805](https://github.com/BerriAI/litellm/pull/47805)

這些修復與版本提升於 [PR #47802](https://github.com/BerriAI/litellm/pull/47802) 與 [PR #48076](https://github.com/BerriAI/litellm/pull/48076) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- 支出 / 預算 / 速率限制：5
- LLM API 端點：5
- 其他：3
- UI：2
- 模型與提供者：1

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.5...v1.104.6
