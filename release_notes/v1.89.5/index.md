---
title: "v1.89.5 - Vertex Batch 上傳修正與金鑰遮罩"
slug: "v1-89-5"
date: 2026-06-29T18:17:14
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

:::info 更新：未發現效能退化

這則說明的較早版本曾標示可能有吞吐量退化。我們已進行調查，且無法在發布版本中確認或重現任何退化。我們收到的唯一一則回報來自一個在我們發布內容之上執行自訂程式碼的部署，我們的測試顯示，最可能的原因是那些變更，而不是 LiteLLM。

正確性與錯誤率從未受到影響。如果您使用的是這個版本，則無需採取任何動作。

我們仍在持續監控傳入的回報，若有任何變化，會更新這則說明。

:::

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.89.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.5
```

</TabItem>
</Tabs>

`v1.89.5` 是建立在 [`v1.89.4`](/release_notes/v1.89.4/v1-89-4) 之上的修補版發布。它將 Vertex AI 批次檔案上傳改為單一媒體上傳，因此大型上傳不再因 499 錯誤而失敗，並且會從 `/key/info` 用戶端錯誤訊息中遮罩 API 金鑰。

### 變更內容 {#whats-changed}

- fix(vertex_ai/files): 為批次檔案改用單一媒體上傳，以修正大型上傳時的 499 錯誤 - [PR #31653](https://github.com/BerriAI/litellm/pull/31653)
- fix(proxy/client): 從 key/info 用戶端錯誤訊息中遮罩 API 金鑰 - [PR #31342](https://github.com/BerriAI/litellm/pull/31342)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.89.4...v1.89.5
