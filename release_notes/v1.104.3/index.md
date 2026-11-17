---
title: "LiteLLM v1.104.3 將託管 vLLM 與 Microsoft-Decision-1 新增至 Decisions"
description: "將託管 vLLM 與 Microsoft-Decision-1 新增為 Decisions 提供者，並新增 litellm.systemone() SDK 函式。在非 OpenAI 提供者上拒絕 safety_identifier。"
slug: "v1-104-3"
date: 2026-10-11T10:37:40
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
docker.litellm.ai/berriai/litellm:1.104.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.3
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.104.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.3) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::danger 破壞性變更

**將 `safety_identifier` 送往 OpenAI 以外提供者的 Decisions 請求，現在會回傳 400**，而不是在識別碼被默默丟棄的情況下回傳 200。這涵蓋 `/v1/decisions`、`/v1/systemone` 與 `litellm.decisions()` 上的 Perplexity、TypeSafe、OpenRouter、Strands Decider 與 Cloudflare。在部署上、於 `litellm_settings` 下、在請求主體中，或在 `litellm.drop_params` 上設定 `drop_params: true`，以保留舊行為。`/v1/systemone` 請求也會以呼叫類型 `asystemone` 記錄，而不是 `adecisions`。請參閱 [PR #44955](https://github.com/BerriAI/litellm/pull/44955) 與 [PR #45846](https://github.com/BerriAI/litellm/pull/45846)

:::

`v1.104.3` 是建立在 [`v1.104.2`](/release_notes/v1.104.2/v1-104-2) 之上的修補版本。它回移了 `main` 的 Decisions 後續工作：再多兩個提供者、AgentCore 上的 Strands Decider、一個 `litellm.systemone()` SDK 入口點、依 OpenRouter 回報成本的 OpenRouter 計費、一個決策模型防護欄，以及決策模型 Auto Router 設定。沒有新的資料庫遷移。`v1.104.3` 標籤指向 [`3645fe0`](https://github.com/BerriAI/litellm/commit/3645fe0a1cada9e3b4f0cbd50d5e1d436d5b21cb)

## Decisions API {#decisions-api}

- **新提供者**：`hosted_vllm/`（需要 `api_base`，或 `HOSTED_VLLM_API_BASE`）與用於 Microsoft-Decision-1 的 `azure_ai/`，加入 OpenAI、Perplexity、TypeSafe、OpenRouter、Cloudflare 與 Strands Decider。請參閱 [Decisions 文件](../../docs/decisions)
- **AgentCore 上的 Strands Decider**：`api_base` 為 AgentCore runtime ARN 的 `strands_decider/` 部署會呼叫 `InvokeAgentRuntime`，並以部署的 `aws_*` 憑證簽署
- **SDK**：新的 `litellm.systemone()` 採用 System One 格式，而 `litellm.decisions()` 採用 OpenAI 格式。`litellm.decisions(state=...)` 仍可運作，並會警告它已被棄用，請改用 `litellm.systemone()`
- **`safety_identifier`**：無法接受它的提供者會回傳 400，除非 `drop_params` 將其丟棄。OpenAI 會繼續從任一路由透傳它
- **支出追蹤**：OpenRouter Decisions 呼叫與 `/openrouter/alpha/decisions` 透傳會以 OpenRouter 在 `usage.cost` 中回報的成本計費
- **決策模型防護欄**：新的 `decision_model` 防護欄會以管理員撰寫的是/否問題篩選訊息與工具呼叫參數，每個問題都設定為在其閾值之上封鎖或記錄，並可從管理介面與 Guardrail Garden 設定
- **Auto Router**：新的 router 可以使用已接入的決策模型部署作為其分類器，且既有的 router 設定維持運作
- **管理介面與文件**：TypeSafe 與 Strands Decider 位於 Add Model 提供者清單中，且 Swagger UI 描述了 `/v1/decisions` 與 `/v1/systemone`

#### 新增模型支援（1 個新模型）{#new-model-support-1-new-model} {#new-model-support-1-new-model}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) |
| --- | --- | --- | --- | --- |
| Azure AI | `azure_ai/Microsoft-Decision-1` | - | $0.042 | $0.00 |

### 有什麼變更 {#whats-changed}

- 透過各提供者的設定與共用的 HTTP 處理常式分派 Decisions - [PR #45129](https://github.com/BerriAI/litellm/pull/45129)、[PR #45130](https://github.com/BerriAI/litellm/pull/45130)、[PR #45442](https://github.com/BerriAI/litellm/pull/45442)
- 新增託管 vLLM Decisions 提供者 - [PR #45501](https://github.com/BerriAI/litellm/pull/45501)
- 新增 `azure_ai/Microsoft-Decision-1` 並在 Decisions API 上支援它 - [PR #45639](https://github.com/BerriAI/litellm/pull/45639)、[PR #45673](https://github.com/BerriAI/litellm/pull/45673)、[PR #45717](https://github.com/BerriAI/litellm/pull/45717)
- 在 AgentCore runtime ARN 上呼叫 Strands Decider - [PR #45678](https://github.com/BerriAI/litellm/pull/45678)
- 新增 `litellm.systemone()` 並讓 `litellm.decisions()` 保持 OpenAI 格式 - [PR #45846](https://github.com/BerriAI/litellm/pull/45846)
- 在無法接受 `safety_identifier` 的提供者上拒絕它，除非 `drop_params` 將其丟棄 - [PR #44955](https://github.com/BerriAI/litellm/pull/44955)
- 以 `usage.cost` 為 OpenRouter Decisions 與 Decisions 透傳計費（僅 Decisions 與透傳計費部分）- [PR #45640](https://github.com/BerriAI/litellm/pull/45640)
- 將 TypeSafe 與 Strands Decider 新增至 Add Model 提供者清單，並在 Swagger UI 中描述兩條 Decisions 路由 - [PR #45335](https://github.com/BerriAI/litellm/pull/45335)、[PR #45838](https://github.com/BerriAI/litellm/pull/45838)
- 新增帶有管理介面流程的決策模型防護欄 - [PR #45663](https://github.com/BerriAI/litellm/pull/45663)，於 [PR #45900](https://github.com/BerriAI/litellm/pull/45900) 中回移，且 Add Guardrail 提供者清單在兩次回移都落地後於 [PR #45936](https://github.com/BerriAI/litellm/pull/45936) 中修復
- 挑選已接入的決策模型作為 Auto Router 分類器 - [PR #45913](https://github.com/BerriAI/litellm/pull/45913)，於 [PR #45914](https://github.com/BerriAI/litellm/pull/45914) 中回移
- 重建管理介面 bundle - [PR #45924](https://github.com/BerriAI/litellm/pull/45924)

Decisions 後續工作與版本提升一起於 [PR #45906](https://github.com/BerriAI/litellm/pull/45906) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.2...v1.104.3
