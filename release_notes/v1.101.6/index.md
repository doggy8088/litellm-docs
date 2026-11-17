---
title: "LiteLLM v1.101.6 修復 Responses 轉 Chat 橋接上的 Codex CLI 工具呼叫"
description: "修復 Responses 轉 Chat Completions 橋接上的 Codex CLI 工具呼叫，讓工具能抵達 Bedrock Converse 與其他橋接模型。"
slug: "v1-101-6"
date: 2026-10-08T07:46:30
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
docker.litellm.ai/berriai/litellm:1.101.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.6
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.101.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.101.6) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.101.6` 是建立在 [`v1.101.5`](/release_notes/v1.101.5/v1-101-5) 之上的修補版本。它修復了透過 Responses 轉 Chat Completions 橋接提供之模型上的 Codex CLI 工具呼叫。沒有新的資料庫遷移或破壞性變更。`v1.101.6` 標籤指向 [`a501c70`](https://github.com/BerriAI/litellm/commit/a501c7002f576c516037971417a4df94b229c773)

## Responses 轉 Chat 橋接上的 Codex 工具 {#codex-tools-on-the-responses-to-chat-bridge}

Codex CLI 將其工具放在 `additional_tools` 輸入項目中傳送，而不是頂層的 `tools`。[Responses API](../../docs/response_api) 轉 Chat Completions 的橋接丟棄了該項目，因此 Bedrock Converse 等橋接模型從未看到工具，Codex 也無法執行 shell 命令

- `additional_tools` 輸入項目現在會為每個橋接提供者提升至 `tools`，而 [Bedrock Mantle](../../docs/providers/bedrock_mantle) 也重複使用同一個輔助函式
- 巢狀置於 `namespace` 內的 `custom` 工具（例如 Codex 的 `exec` shell 工具）現在會轉換為 chat 工具
- 模型的呼叫會以 `custom_tool_call` 回傳給 Codex，串流與非串流回應皆然
- 在自訂工具的文法區塊之後進行的防護欄編輯會落在工具本身，而不是被套用兩次

請參閱 [Codex CLI 設定指南](../../docs/proxy/client_setup/codex_cli)

### 有什麼變更 {#whats-changed}

- 將 Codex 的 `additional_tools` 輸入項目提升至 chat 橋接工具 - [PR #40989](https://github.com/BerriAI/litellm/pull/40989)，於 [PR #45212](https://github.com/BerriAI/litellm/pull/45212) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.5...v1.101.6
