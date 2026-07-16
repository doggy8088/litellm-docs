---
title: "v1.89.2 - 成本追蹤與模型清單修正"
slug: "v1-89-2"
date: 2026-06-17T19:22:38
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

:::info 更新：未發現效能回退

先前這則說明的版本曾標示可能有吞吐量回退。我們已進行調查，且無法在已發布版本中確認或重現任何回退。我們收到的唯一回報來自一個在我們所發布內容之上執行自訂程式碼的部署，而我們的測試顯示，較可能的原因是那些變更，而非 LiteLLM。

正確性與錯誤率從未受到影響。若您使用的是此版本，無需採取任何行動。

我們仍在持續監控傳入的回報，若有任何變化，會更新這則說明。

:::

## 以此版本部署 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.89.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.2
```

</TabItem>
</Tabs>

`v1.89.2` 是建構在 [`v1.89.1`](/release_notes/v1.89.1/v1-89-1) 之上的修補版釋出。它強化了 `service_tier` 周邊的成本追蹤，修正了團隊與 BYOK 設定中的 `/v1/models` 列出問題，並加強向量儲存區存取與 OTEL 錯誤回報。

### 變更內容 {#whats-changed}

- fix(cost): 停止非字串的 `service_tier` 在不發出任何提示下導致成本追蹤被忽略 - [PR #30690](https://github.com/BerriAI/litellm/pull/30690)
- fix(anthropic): 在成本追蹤中為回應 `service_tier` 計價並顯示 - [PR #30558](https://github.com/BerriAI/litellm/pull/30558)
- fix(proxy): 在 `/v1/models` 中列出公開的團隊模型名稱 - [PR #30588](https://github.com/BerriAI/litellm/pull/30588)
- feat(proxy): 新增可選加入的 `healthy_only` 篩選器至 `GET /v1/models` - [PR #30130](https://github.com/BerriAI/litellm/pull/30130)
- fix(proxy): 從團隊 BYOK 部署解析 list-files 憑證 - [PR #30495](https://github.com/BerriAI/litellm/pull/30495)
- fix(proxy): 允許內部角色存取 vector store CRUD 路由 - [PR #30503](https://github.com/BerriAI/litellm/pull/30503)
- fix(otel): 在 OTEL v2 的標準例外事件上記錄完整錯誤訊息 - [PR #30380](https://github.com/BerriAI/litellm/pull/30380)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.89.1...v1.89.2
