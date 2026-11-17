---
title: "LiteLLM v1.104.4 修復 count_tokens、團隊批次存取與防護欄設定"
description: "OpenAI 與 Gemini 模型的 Anthropic 格式 token 計數與推論一致，團隊金鑰可以讀取自己的批次，且 Add Guardrail 精靈再次載入。"
slug: "v1-104-4"
date: 2026-10-20T02:26:46
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
docker.litellm.ai/berriai/litellm:1.104.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.4
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.104.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.4) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.104.4` 是建立在 [`v1.104.3`](/release_notes/v1.104.3/v1-104-3) 之上的修補版本。它將 token 計數修復、團隊範圍的批次存取，以及一項管理介面防護欄設定修復，回移到 `stable/1.104.x`。沒有新的資料庫遷移。`v1.104.4` 標籤指向 [`5346a40`](https://github.com/BerriAI/litellm/commit/5346a40c37a25b6e264c7b3783c5afb7d99ba456)

## 重點摘要 {#key-highlights}

- **Token 計數**：OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以 `/v1/messages` 推論相同的轉換方式處理，且計數回應會說明數字來自何處
- **團隊批次**：團隊金鑰可以讀取與取消自己團隊的批次，並下載完成的結果
- **防護欄設定**：管理介面的 Add Guardrail 精靈再次列出其提供者

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bugs}

- **Token 計數**
    - OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以 `/v1/messages` 推論相同的轉換方式處理
    - 計數回應帶有 `litellm_count_source`，其值為 `provider`、`token_count_model` 或 `local_estimate`。當提供者計數失敗且本地計數開啟時，回應是標示為 `local_estimate` 的本地估計
    - 新的 `model_info` 設定 `token_count_framing` 與 `token_count_model` 可為單一部署調整計數。當計數模型回答時，回應也會帶有 `litellm_count_model`
    - 這些修復來自 [PR #47389](https://github.com/BerriAI/litellm/pull/47389)，而 [PR #47446](https://github.com/BerriAI/litellm/pull/47446) 與 [PR #47454](https://github.com/BerriAI/litellm/pull/47454) 讓先前的 Google `countTokens` 請求形狀，以及提示加訊息的輸入，維持先前的運作方式

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤修正 {#bugs-1}

- 團隊金鑰可以讀取與取消自己團隊的批次，並下載完成的結果。同樣的模型檢查適用於檔案、微調、向量儲存、角色與影片 id - [PR #47067](https://github.com/BerriAI/litellm/pull/47067)
- `GET /guardrails/ui/add_guardrail_settings` 在每次呼叫時都回傳 500，因此管理介面中的 Add Guardrail 精靈沒有列出任何提供者。它現在再次載入 - [PR #45935](https://github.com/BerriAI/litellm/pull/45935)

團隊批次修復於 [PR #47344](https://github.com/BerriAI/litellm/pull/47344) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- LLM API 端點：3
- 驗證與管理：1
- 防護欄：1

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.3...v1.104.4
