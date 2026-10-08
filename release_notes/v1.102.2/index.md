---
title: "v1.102.2 - UI 與 CLI 工作階段權杖格式"
slug: "v1-102-2"
date: 2026-09-30T00:58:30
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
docker.litellm.ai/berriai/litellm:1.102.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.102.2
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.102.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 的形式發佈。請參閱 [GitHub 發佈](https://github.com/BerriAI/litellm/releases/tag/v1.102.2) 以及完整的 [發佈頁面](https://github.com/BerriAI/litellm/releases)

:::danger 重大變更

**在升級之前發出的工作階段權杖將停止運作。** 管理介面與 `lite` CLI 使用者在升級後必須再次登入。在滾動升級期間，舊版與新版上的 Pod 會拒絕彼此的工作階段權杖，因此請先完成部署再要求使用者重新登入。虛擬金鑰、主金鑰與已儲存的憑證不受影響。請參閱 [`1d5fdc8`](https://github.com/BerriAI/litellm/commit/1d5fdc87fed66b49e1df8cf7d708ad93249eb7d0)

:::

:::warning `lite` CLI 使用者必須重新登入

升級 proxy 後，每位 `lite` CLI 使用者都必須再次執行 `lite login`。在他們這麼做之前，CLI 會繼續傳送舊的工作階段權杖，而其對 proxy 的請求會失敗

:::

`v1.102.2` 是在 [`v1.102.1`](https://github.com/BerriAI/litellm/releases/tag/v1.102.1) 之上的修補版本。它帶來一項變更：管理介面與 `lite` CLI 在登入後收到的工作階段權杖現在使用各自的加密內容與標頭安全格式。Docker 映像與 PyPI 套件皆是根據 [`a0c4a33`](https://github.com/BerriAI/litellm/commit/a0c4a3347afe19decf500ecf436f21d7fb471c34) 建置而成

## UI 與 CLI 工作階段權杖各自擁有自己的格式 {#ui-and-cli-session-tokens-get-their-own-format}

工作階段權杖是使用與 proxy 用於已儲存憑證相同的流程進行加密，因此它們帶有 `v2:gcm:` 前綴與 base64 填充。基本驗證解析器會在第一個 `:` 處分割，而瀏覽器會拒絕 WebSocket 子通訊協定中的 `:` 和 `=`，因此 Langfuse pass-through 與 realtime playground 無法使用它們。大約每 262,144 次登入也會產生一個以 `sk-` 開頭的權杖，而 proxy 隨後會將其視為虛擬金鑰並以 401 拒絕

工作階段權杖現在以其自己的內容下的 AES-256-GCM 加密，並以 `litellm_login_` 開頭，後接未填充的 base64url。它們可透過任何標頭，容易在記錄中辨識，且只會以工作階段權杖進行檢查。已儲存憑證維持目前的加密方式，因此無須遷移

### 有哪些變更 {#whats-changed}

- refactor(auth): 將 UI/CLI 工作階段權杖繫結到其自己的 AES-GCM 內容 - [`1d5fdc8`](https://github.com/BerriAI/litellm/commit/1d5fdc87fed66b49e1df8cf7d708ad93249eb7d0)
- chore(lint): 將 TRY004 抑制範圍限定於 bearer-token salt key 檢查 - [`02a0dc1`](https://github.com/BerriAI/litellm/commit/02a0dc1480754f12c3244d4ce866bb3fe9af4ba0)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.102.1...v1.102.2
