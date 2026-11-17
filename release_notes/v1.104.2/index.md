---
title: "LiteLLM v1.104.2 為 OpenAI 與 System One 新增 Decisions API 路由"
description: "在 /v1/decisions 與 /v1/systemone 上新增 Decisions API，決策模型來自 OpenAI、Perplexity、TypeSafe、OpenRouter、Cloudflare 與 Strands。"
slug: "v1-104-2"
date: 2026-10-08T08:39:07
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
docker.litellm.ai/berriai/litellm:1.104.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.2
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.104.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.2) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.104.2` 是建立在 [`v1.104.1`](/release_notes/v1.104.1/v1-104-1) 之上的修補版本。它新增 Decisions API 路由與提供者。沒有新的資料庫遷移或破壞性變更：Decisions 路由是本系列的新功能。`v1.104.2` 標籤指向 [`fc3920b`](https://github.com/BerriAI/litellm/commit/fc3920bf403124ad075bc04990f999f7e0612e12)

## Decisions API {#decisions-api}

proxy 現在提供決策模型，它們會針對輸入回答具型別的問題（是/否謂詞、選項與分數）。請求會經過慣常的金鑰、預算、支出追蹤與防護欄。請參閱 [Decisions 文件](../../docs/decisions)

- **兩種請求格式**
    - `POST /v1/decisions` 與 `POST /decisions` 採用 OpenAI 的 Decisions API 格式：`input` 加上一份 `questions` 清單，以帶有 OpenAI 風格 `usage` 的 `answers` 清單回答
    - `POST /v1/systemone` 與 `POST /systemone` 採用 System One 格式：`state` 加上一份具名的 `questions` 對應表，以依問題名稱索引的 `answers` 對應表回答
    - 兩條路由在 proxy 內部都經過同一個共用格式，因此任何 Decisions 模型都能在任一路由上呼叫
- **提供者**：`openai/`（`gpt-6-luna`）、`perplexity/`、`typesafe/`、`openrouter/`、`cloudflare/clef` 與 `cloudflare/clef-flash`，以及自託管的 `strands_decider/`（需要 `api_base`）
- **OpenAI**：圖片、多訊息輸入、`safety_identifier`、名稱與拒絕會在 `/v1/decisions` 上透傳。提供者會以與其他 OpenAI 呼叫相同的順序讀取 `litellm.api_key`、`litellm.openai_key`、`litellm.api_base`、`OPENAI_BASE_URL` 與 `OPENAI_API_BASE`
- **任何上游呼叫之前的驗證**：缺少 `state`、問題格式錯誤、問題超過 128 個、只有單一選項的問題，或主體不是 JSON，都會回傳 400。送往只接受文字之提供者的圖片輸入會回傳明確的 400
- **支出追蹤**：來自成本對照表的按 token 定價，快取與快取寫入的輸入 token 以各自的費率計費
- **健康檢查**：`/health` 會以一個單一問題的 Decisions 呼叫探測 `mode: evaluation` 部署，且 `health_check_params` 可以覆寫其 `state` 與 `questions`
- **防護欄**：當呼叫端設定 `include_guardrail_response` 時，OpenAI 格式的回應會包含 `guardrail_information`
- **透傳**：位於 `/v1/decisions` 的既有 `pass_through_endpoints` 項目會繼續回答該路徑，而 `/decisions` 則提供原生路由

#### 新增模型支援（6 個新模型） {#new-model-support-6-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) |
| --- | --- | --- | --- | --- |
| Perplexity | `perplexity/pplx-decider-v1-27b` | 262K | $0.04 | $0.00 |
| Cloudflare | `cloudflare/clef` | 65K | $0.24 | $0.00 |
| Cloudflare | `cloudflare/clef-flash` | 65K | $0.09 | $0.00 |
| Cloudflare | `cloudflare/@cf/cloudflare/clef` | 65K | $0.24 | $0.00 |
| Cloudflare | `cloudflare/@cf/cloudflare/clef-flash` | 65K | $0.09 | $0.00 |
| Strands Decider | `strands_decider/strands-decider-2B-hobson-v19` | - | $0.00（自託管） | $0.00 |

既有的 `gpt-6-luna` 項目現在將 `/v1/decisions` 列入其支援的端點中

### 有什麼變更 {#whats-changed}

- 為與 System One 相容的提供者新增統一的 `/v1/decisions` 端點 - [PR #44236](https://github.com/BerriAI/litellm/pull/44236)
- 在 `/v1/systemone` 提供 System One 格式、在 `/v1/decisions` 提供 OpenAI 的格式 - [PR #45184](https://github.com/BerriAI/litellm/pull/45184)
- 在共用的 decisions 格式背後新增 OpenAI 作為 Decisions 提供者 - [PR #45214](https://github.com/BerriAI/litellm/pull/45214)

這三者於 [PR #45190](https://github.com/BerriAI/litellm/pull/45190) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.1...v1.104.2
