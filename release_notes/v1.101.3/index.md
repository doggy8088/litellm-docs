---
title: "v1.101.3 - UI 與 CLI 工作階段權杖格式"
slug: "v1-101-3"
date: 2026-09-30T00:58:00
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
docker.litellm.ai/berriai/litellm:1.101.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.3
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.101.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.101.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::danger 破壞性變更

**升級前發出的工作階段權杖將停止運作。** Admin UI 和 `lite` CLI 使用者在升級後需要再次登入一次。在滾動升級期間，舊版與新版上的 pods 會拒絕彼此的工作階段權杖，因此請先完成部署，再請使用者重新登入。虛擬金鑰、master key 與已儲存的憑證不受影響。請參閱 [`9161d7f`](https://github.com/BerriAI/litellm/commit/9161d7f9d6073603ba61ee4aa5e2c0ef5b37a81b)

:::

:::warning `lite` CLI 使用者必須重新登入

升級 proxy 後，每位 `lite` CLI 使用者都必須再執行一次 `lite login`。在他們這麼做之前，CLI 會持續送出舊的工作階段權杖，而其對 proxy 的請求會失敗

:::

`v1.101.3` 是在 [`v1.101.2`](https://github.com/BerriAI/litellm/releases/tag/v1.101.2) 之上的修補版本。它帶來一項變更：Admin UI 與 `lite` CLI 在登入後收到的工作階段權杖，現在使用各自的加密內容與可安全放入標頭的格式。Docker 映像與 PyPI 套件皆是從 [`1b6ee73`](https://github.com/BerriAI/litellm/commit/1b6ee737c96c346430b04f36827fbe64935328df) 建置而成

## UI 與 CLI 工作階段權杖各自採用自己的格式 {#ui-and-cli-session-tokens-get-their-own-format}

工作階段權杖是使用 proxy 用於已儲存憑證的相同程序加密，因此帶有 `v2:gcm:` 前綴與 base64 填充。基本驗證解析器會在第一個 `:` 處切分，而瀏覽器會在 WebSocket 子通訊協定中拒絕 `:` 和 `=`，因此 Langfuse pass-through 和 realtime playground 無法使用它們。大約每 262,144 次登入也會產生一個以 `sk-` 開頭的權杖，接著 proxy 會將其視為虛擬金鑰並以 401 拒絕

工作階段權杖現在會在各自的內容下以 AES-256-GCM 加密，並以 `litellm_login_` 開頭，後接未填充的 base64url。它們可通過任何標頭、在記錄中也很容易辨識，且只會被當作工作階段權杖檢查。已儲存的憑證維持目前的加密方式，因此無需遷移

### 有哪些變更 {#whats-changed}

- refactor(auth): 將 UI/CLI 工作階段權杖繫結到各自的 AES-GCM 內容 - [`9161d7f`](https://github.com/BerriAI/litellm/commit/9161d7f9d6073603ba61ee4aa5e2c0ef5b37a81b)
- chore(lint): 將 TRY004 的抑制範圍限制在 bearer-token salt key 檢查 - [`9335067`](https://github.com/BerriAI/litellm/commit/9335067229f6606cca91141fe280cad696366a73)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.2...v1.101.3
