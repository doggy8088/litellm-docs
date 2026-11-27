---
title: "LiteLLM v1.108.18（LTS）新增 ElevenLabs 即時轉錄與 Meta Muse"
description: "ElevenLabs `scribe_v2_realtime` 與 Vertex AI 上的 Meta Muse 加入 LTS 版本線，`/v1/messages` 防護欄會保留工具並掃描系統提示詞。"
slug: "v1-108-18"
date: 2026-11-25T21:07:22
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

`v1.108.18` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.18
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.18
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.18`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.18) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

`v1.108.18` 是接在 [`v1.108.17`](/release_notes/v1.108.17/v1-108-17) 之上的修補版本。沒有新的資料庫遷移。`v1.108.18` 標籤指向 [`9b6796a`](https://github.com/BerriAI/litellm/commit/9b6796a64c6120a5c1aefcef25604aa78bdeabf5)。

### 變更內容 {#whats-changed}

- **OpenAI：**修正使用 `markup` 檔案的 GPT Image 2.5 編輯回應 400 失敗的問題，SDK tuple 或 `Path` 上傳現在可正常運作 - [PR #53815](https://github.com/BerriAI/litellm/pull/53815)
- **Azure：**修正串流 Azure 聊天捨棄 `prompt_filter_results` 與結尾區塊 `content_filter_results` 的問題 - [PR #54158](https://github.com/BerriAI/litellm/pull/54158)
- **Anthropic：**修正 Anthropic 格式上游傳送非物件或過深的 JSON 行時，串流失敗或未記錄成本的問題 - [PR #53393](https://github.com/BerriAI/litellm/pull/53393)
- **AWS Bedrock：**修正 Bedrock Mantle gemma-4 拒絕含 `propertyNames` 的工具結構描述、導致每個 Claude Code 回合皆失敗的問題 - [PR #54230](https://github.com/BerriAI/litellm/pull/54230)
- **AWS Bedrock：**修正歷史記錄含 `fallback` 區塊的 `/v1/messages` 在 Bedrock Invoke 與 Mantle 上回應 400 失敗的問題 - [PR #54386](https://github.com/BerriAI/litellm/pull/54386)
- **Vertex AI 與 Gemini：**在 Vertex AI 上新增 Meta Muse 模型，並以原生 Responses API 路由 - [PR #53388](https://github.com/BerriAI/litellm/pull/53388)
- **其他提供者：**修正 Z.AI GLM 模型對 `reasoning_effort` 回應 400 的問題，因此 `/v1/messages` 的思考現在可傳達至這些模型 - [PR #54313](https://github.com/BerriAI/litellm/pull/54313)
- **Responses API：**修正以未知 `previous_response_id` 進行聊天橋接的後續請求，在沒有歷史記錄的情況下回應計費的 200，現為 400 - [PR #53768](https://github.com/BerriAI/litellm/pull/53768)
- **Messages API：**新增每個部署的 `deferred_tools` 處理，因此 Claude Code 工具載入可在非 Anthropic 模型上保留提示詞快取 - [PR #54213](https://github.com/BerriAI/litellm/pull/54213)
- **Messages API：**修正 null 或數值文字區塊被捨棄並回應 200 的問題，除非開啟 `drop_params`，現為 400 - [PR #54227](https://github.com/BerriAI/litellm/pull/54227)
- **即時：**在 `/v1/realtime` 上新增 ElevenLabs `scribe_v2_realtime` 轉錄，並附成本追蹤 - [PR #48984](https://github.com/BerriAI/litellm/pull/48984)
- **防護欄：**修正回傳工具的防護欄重寫每個 `/v1/messages` 工具、導致 `web_search` 與 `defer_loading` 被捨棄的問題 - [PR #54323](https://github.com/BerriAI/litellm/pull/54323)
- **防護欄：**修正 Bedrock `during_call` 防護欄在 `/v1/messages` 上略過 `system` 提示詞與 `tool_result` 區塊的問題 - [PR #54327](https://github.com/BerriAI/litellm/pull/54327)
- **防護欄：**改善 Presidio 在以大量小型訊框開頭的串流上的 CPU 使用量 - [PR #54379](https://github.com/BerriAI/litellm/pull/54379)
- **Admin UI：**修正團隊管理員在團隊服務帳戶金鑰上編輯模型時遭拒的問題，此問題自 v1.104.0 起存在 - [PR #54473](https://github.com/BerriAI/litellm/pull/54473)

這些變更已回移至 [PR #53403](https://github.com/BerriAI/litellm/pull/53403)、[PR #54155](https://github.com/BerriAI/litellm/pull/54155) 與 [PR #54342](https://github.com/BerriAI/litellm/pull/54342)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.17...v1.108.18
