---
title: "v1.101.4 - Straiker v3 平台與 Guardrail api_version 修正"
slug: "v1-101-4"
date: 2026-10-01T05:10:00
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
docker.litellm.ai/berriai/litellm:1.101.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.4
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.101.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.101.4) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::info 升級

在 [`v1.101.3`](/release_notes/v1.101.3/v1-101-3) 之上沒有新的資料庫遷移或破壞性變更。如果您是從 `v1.101.2` 或更早版本升級，請先閱讀 `v1.101.3` notes 中的破壞性變更：Admin UI 和 `lite` CLI 使用者在升級後需要再次登入

:::

:::warning `lite` CLI 使用者必須重新登入

如果您是從早於 `v1.101.3` 的版本升級，則適用此項。在升級 proxy 之後，每位 `lite` CLI 使用者都必須再次執行 `lite login`。在此之前，CLI 會繼續送出舊的 session token，而它們對 proxy 的請求會失敗

:::

`v1.101.4` 是建立在 [`v1.101.3`](https://github.com/BerriAI/litellm/releases/tag/v1.101.3) 之上的修補版本。它讓 Straiker guardrail 能使用 v3 platform keys，並阻止共用的 `api_version` 預設值破壞 Azure Content Safety guardrails。`v1.101.4` 標籤指向 [`f471923`](https://github.com/BerriAI/litellm/commit/f4719232112d87f9f815f37120f916c42a37a30e)

## Straiker guardrail 支援 v3 platform keys {#straiker-guardrail-supports-v3-platform-keys}

Straiker v3 keys（`sk_agt_...`）在每個受防護的請求上都收到 401，因為 guardrail 只知道 v1 webhook route。使用 v3 key 時，guardrail 現在會將流量轉送到 `/api/v3/detect`，`x-s6r-agent` request header 會標示呼叫應用程式，而來自 Straiker 的 block 會以 400 與租戶的 block 訊息回傳給呼叫端。既有的 v1 keys 不受影響

一個其 config 帶有殘留的 `api_version`、且不屬於 `v1` 或 `v3` 的 Straiker guardrail，例如從 Azure block 複製而來的 `2024-09-01`，現在會在載入時帶有警告，並依據 key prefix 選擇其 route。若沒有這項修正，proxy 會在未載入 guardrail 的情況下啟動，並在未受檢查的狀態下提供請求

## Azure Content Safety guardrails 可在沒有 `api_version` 的情況下運作 {#azure-content-safety-guardrails-work-without-api_version}

共用的 guardrail 參數將 `api_version` 預設為 Javelin 的 `v1`，因此沒有明確 `api_version` 的 Azure Content Safety guardrails 會以 `api-version=v1` 呼叫 Azure 並得到 404，這會在 guardrail 為 `default_on` 時導致每個請求失敗。現在已取消共用預設值，Azure guardrails 會回退到 `2024-09-01`，而透過 `POST /guardrails` 建立的 Azure guardrail 上所儲存的 `v1` 會被視為未設定，因此這些 guardrails 在升級後不用修改就能開始運作。Javelin 仍然會自行填入 `v1`

### 變更內容 {#whats-changed}

- fix(guardrails): 停止 Javelin api_version 預設值外洩到 Azure Content Safety - [PR #41941](https://github.com/BerriAI/litellm/pull/41941)
- feat(guardrails): straiker guardrail 改用 v3 platform API (/api/v3/detect) - [PR #41880](https://github.com/BerriAI/litellm/pull/41880)
- fix(guardrails): 將未知的 straiker api_version 視為未設定，而不是跳過防護欄 - [PR #43956](https://github.com/BerriAI/litellm/pull/43956)
- chore(deps): 將 pyjwt 升級至 2.14.0 - [`bdc4212`](https://github.com/BerriAI/litellm/commit/bdc421261e1b744bfdfe6819d652bc056146c417)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.3...v1.101.4
