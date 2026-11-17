---
title: "LiteLLM v1.108.2 (LTS) 修正 Bedrock 服務層級與 Claude PDF 輸入"
description: "遵循 Bedrock Converse 服務層級，修正 Claude 以 image_url 拒絕的 base64 PDF，並在 affinity 與冷卻篩選後保留標籤路由。"
slug: "v1-108-2"
date: 2026-11-06T22:07:43
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

`v1.108.2` 是 1.108 LTS 產品線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.108.2` 是建立在 [`v1.108.1`](/release_notes/v1.108.1/v1-108-1) 之上的修補版本。沒有新的資料庫 migration。`v1.108.2` 標籤指向 [`831a14c`](https://github.com/BerriAI/litellm/commit/831a14c8f48e189e24a85b47da1b31b44e0718b6)。

### 變更內容 {#whats-changed}

- **OpenAI：** 修正 `api_key` 為空的 `openai/` 部署將 `OPENAI_ADMIN_KEY` 作為 bearer token 傳送的問題 - [PR #50218](https://github.com/BerriAI/litellm/pull/50218)
- **AWS Bedrock：** 修正 Converse `service_tier`，讓不支援的層級回應 400，且 `reserved`、`auto` 與 `standard_only` 受到遵循 - [PR #50360](https://github.com/BerriAI/litellm/pull/50360)
- **AWS Bedrock：** 修正 Invoke 在 Claude 4.5 及更新版本上丟棄 `per-turn-control-2026-07-01` beta 的問題 - [PR #50362](https://github.com/BerriAI/litellm/pull/50362)
- **Vertex AI 與 Gemini：** 修正 chirp 文字轉語音忽略 `vertex_location` 的問題，讓美國與歐盟部署呼叫其多區域主機 - [PR #50392](https://github.com/BerriAI/litellm/pull/50392)
- **Chat completions：** 修正 `openai/responses/*` 與 `azure/responses/*` 上的 `response_format: json_object` 因 json 一詞回應 400 的問題 - [PR #50267](https://github.com/BerriAI/litellm/pull/50267)
- **Chat completions：** 修正以 `image_url` 傳送給 Claude 的 base64 PDF 回應 400，以及 Bedrock JSON schema 呼叫丟棄 thinking 的問題 - [PR #50280](https://github.com/BerriAI/litellm/pull/50280)
- **Responses API：** 修正預設開啟 `during_call` 防護欄時 `/v1/responses/compact` 回傳 500 的問題 - [PR #50274](https://github.com/BerriAI/litellm/pull/50274)
- **嵌入、影像與音訊：** 修正音訊轉錄錯誤將完整的提供者回覆（包括轉錄內容）回傳給用戶端與記錄的問題 - [PR #50325](https://github.com/BerriAI/litellm/pull/50325)
- **MCP：** 託管的 MCP 工具若轉換後的路由無法執行，改為回傳明確的 400，或以 `drop_params` 丟棄 - [PR #50348](https://github.com/BerriAI/litellm/pull/50348)
- **路由與備援：** 修正接受未比對標籤的群組在 affinity 或冷卻篩選後拒絕請求的問題 - [PR #48470](https://github.com/BerriAI/litellm/pull/48470)
- **路由與備援：** 修正開啟 `turn_off_message_logging` 時，提示快取路由未將後續請求固定到單一部署的問題 - [PR #50276](https://github.com/BerriAI/litellm/pull/50276)
- **成本追蹤與定價：** 修正 Postgres 重新啟動或關閉期間支出資料列遭丟棄、且有效金鑰收到 401 的問題 - [PR #50132](https://github.com/BerriAI/litellm/pull/50132)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.1...v1.108.2
