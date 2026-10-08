---
title: "v1.100.4 - UI 與 CLI 工作階段權杖格式"
slug: "v1-100-4"
date: 2026-09-30T00:56:00
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
docker.litellm.ai/berriai/litellm:1.100.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.100.4
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.100.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發布。請參閱 [GitHub 發行版](https://github.com/BerriAI/litellm/releases/tag/v1.100.4) 以及完整的 [發行版頁面](https://github.com/BerriAI/litellm/releases)

:::danger Breaking Changes

**升級前簽發的工作階段權杖將停止運作。** Admin UI 與 `lite` CLI 使用者在升級後需要再次登入一次。在滾動升級期間，舊版與新版上的 pod 會拒絕彼此的工作階段權杖，因此請先完成部署再要求使用者重新登入。虛擬金鑰、主金鑰與已儲存的憑證不受影響。請參閱 [`f7cd90f`](https://github.com/BerriAI/litellm/commit/f7cd90f09e9716652b38daec9f0640cdf49d582b)

:::

:::warning `lite` CLI 使用者必須重新登入

升級 proxy 之後，每位 `lite` CLI 使用者都必須再次執行 `lite login`。在此之前，CLI 會持續傳送舊的工作階段權杖，而對 proxy 的請求將失敗

:::

`v1.100.4` 是建立在 [`v1.100.3`](https://github.com/BerriAI/litellm/releases/tag/v1.100.3) 之上的修補版。它帶來一項變更：Admin UI 與 `lite` CLI 在登入後接收的工作階段權杖，現在使用它們自己的加密內容與標頭安全格式。Docker 映像與 PyPI 套件皆是從 [`883282f`](https://github.com/BerriAI/litellm/commit/883282fb72f31ab90a0ba828a10bbfe7d2680805) 建置而成

## UI 和 CLI 工作階段權杖有了自己的格式 {#ui-and-cli-session-tokens-get-their-own-format}

工作階段權杖先前是用 proxy 為已儲存憑證使用的相同程序加密，因此帶有 `v2:gcm:` 前綴與 base64 填充。基本驗證剖析器會在第一個 `:` 處分割，而瀏覽器會在 WebSocket 子協定中拒絕 `:` 與 `=`，因此 Langfuse pass-through 與即時 playground 無法使用它們。大約每 262,144 次登入也會產生一個以 `sk-` 開頭的權杖，而 proxy 隨即將其視為虛擬金鑰並以 401 拒絕

工作階段權杖現在以它們自己的內容下的 AES-256-GCM 加密，並以 `litellm_login_` 加上未填充的 base64url 形式回傳。它們可通過任何標頭、在記錄中容易辨識，且只會作為工作階段權杖進行檢查。已儲存的憑證維持目前的加密方式，因此不需要遷移

### 有什麼變更 {#whats-changed}

- refactor(auth): 將 UI/CLI 工作階段權杖繫結到它們自己的 AES-GCM 內容 - [`f7cd90f`](https://github.com/BerriAI/litellm/commit/f7cd90f09e9716652b38daec9f0640cdf49d582b)
- chore(lint): 將 TRY004 抑制範圍限定於 bearer-token salt key 檢查 - [`241abae`](https://github.com/BerriAI/litellm/commit/241abaec794d19b74ab6b490056be62d22836867)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.100.3...v1.100.4
