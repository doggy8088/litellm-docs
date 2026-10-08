---
title: "v1.103.1 - UI 與 CLI 工作階段權杖格式"
slug: "v1-103-1"
date: 2026-09-30T00:59:00
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
docker.litellm.ai/berriai/litellm:1.103.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.1
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.103.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發布。請參閱 [GitHub 發行版](https://github.com/BerriAI/litellm/releases/tag/v1.103.1) 以及完整的 [發行頁面](https://github.com/BerriAI/litellm/releases)

:::danger 破壞性變更

**從 `v1.102.x` 或更早版本升級時，會在 `LiteLLM_SpendLogs` 上新增索引，這會在啟動時建置期間封鎖 spend log 寫入。** 在大型資料表上，這可能需要很長時間。為了避免這種情況，請在升級前先使用 `CONCURRENTLY` 自行建立索引，這不會封鎖寫入。之後 migration 會找到它並略過建置。請參閱 [PR #37983](https://github.com/BerriAI/litellm/pull/37983)

```sql
SET statement_timeout = 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_api_key_startTime_idx" ON "LiteLLM_SpendLogs"("api_key", "startTime");
```

請在交易之外執行，並從會保持連線直到完成的工作階段中執行。失敗的並行建置會留下無效索引，而 migration 也會略過該索引，因此在升級前請先檢查。這必須回傳 `true`，否則請執行 `DROP INDEX CONCURRENTLY "LiteLLM_SpendLogs_api_key_startTime_idx";` 並重新建立：

```sql
SELECT indisvalid FROM pg_index WHERE indexrelid = '"LiteLLM_SpendLogs_api_key_startTime_idx"'::regclass;
```

如果您的 spend logs 資料表已分割區，Postgres 無法並行建立其索引。請先在每個分割區上並行建立符合的索引，然後在父表上執行相同的 `CREATE INDEX`，但不要加上 `CONCURRENTLY`，這樣就只會附加它們

**在升級前發出的工作階段權杖將停止運作。** 管理員 UI 和 `lite` CLI 使用者在升級後必須再次登入。在滾動升級期間，舊版與新版上的 pod 會拒絕彼此的工作階段權杖，因此請先完成 rollout，再請使用者重新登入。虛擬金鑰、主金鑰和已儲存的憑證不受影響。請參閱 [`a80eaca`](https://github.com/BerriAI/litellm/commit/a80eacacee118fbed54e3d98f239d17a63fac818)

:::

:::warning `lite` CLI 使用者必須重新登入

升級 proxy 之後，每位 `lite` CLI 使用者都必須再次執行 `lite login`。在他們這麼做之前，CLI 會持續傳送舊的工作階段權杖，而其對 proxy 的請求會失敗

:::

`v1.103.1` 是建構在 [`v1.103.0`](https://github.com/BerriAI/litellm/releases/tag/v1.103.0) 之上的修補版本。它包含一項變更：Admin UI 和 `lite` CLI 在登入後收到的工作階段權杖，現在使用它們自己的加密 context 與具標頭安全的格式。Docker 映像與 PyPI 套件皆是從 [`580bde9`](https://github.com/BerriAI/litellm/commit/580bde9a2d148714889ec1c04a9872819e78a778) 建置而來

## UI 和 CLI 工作階段權杖有自己的格式 {#ui-and-cli-session-tokens-get-their-own-format}

工作階段權杖是使用與 proxy 為已儲存憑證所用相同的程序加密，因此它們帶有 `v2:gcm:` 前綴與 base64 填充。基本驗證解析器會在第一個 `:` 處分割，而瀏覽器會拒絕 WebSocket 子通訊協定中的 `:` 和 `=`，因此 Langfuse pass-through 與 realtime playground 無法使用它們。約每 262,144 次登入也會產生一個以 `sk-` 開頭的權杖，而 proxy 會將其視為虛擬金鑰並以 401 拒絕

工作階段權杖現在是在它們自己的 context 下以 AES-256-GCM 加密，並以 `litellm_login_` 開頭，後接未填充的 base64url。它們可通過任何標頭，在記錄中也很容易辨識，而且只會被當作工作階段權杖檢查。已儲存憑證會保留目前的加密方式，因此沒有需要遷移的內容

### 有哪些變更 {#whats-changed}

- refactor(auth): 將 UI/CLI 工作階段權杖繫結至它們自己的 AES-GCM context - [`a80eaca`](https://github.com/BerriAI/litellm/commit/a80eacacee118fbed54e3d98f239d17a63fac818)
- chore(lint): 將 TRY004 suppression 範圍限定於 bearer-token salt key 檢查 - [`d3bf006`](https://github.com/BerriAI/litellm/commit/d3bf0066132899ca86fce126a11f4c133d9a74c8)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.0...v1.103.1
