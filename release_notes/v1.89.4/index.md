---
title: "v1.89.4 - Vertex 批次上傳與 CVE 修補"
slug: "v1-89-4"
date: 2026-06-25T02:38:49
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

:::info 更新：未發現效能回歸

先前版本的此說明曾標示可能的吞吐量回歸。我們已調查，且無法在已發布版本中確認或重現任何回歸。我們收到的唯一回報來自一個在我們所提供內容之上執行自訂程式碼的部署，而我們的測試顯示，較可能的原因是那些變更，而非 LiteLLM。

正確性與錯誤率從未受到影響。如果您正在使用此版本，無需採取任何動作。

我們仍在持續監控進來的回報，若有任何變化，會更新此說明。

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
docker.litellm.ai/berriai/litellm:1.89.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.4
```

</TabItem>
</Tabs>

`v1.89.4` 是建基於 [`v1.89.3`](/release_notes/v1.89.3/v1-89-3) 的修補版本。它會串流 OpenAI→Vertex 批次 JSONL 上傳，而不是將其緩衝在記憶體中，回補中斷的 Anthropic 串流的成本追蹤復原功能，新增一個 `no-mcp-servers` sentinel，將金鑰的範圍限定為零個 MCP 伺服器，並透過更新 OpenSSL 與相依套件版本，清除其餘由 OSV 標記的 CVE。隨附的 `litellm-enterprise` 套件已升級至 `0.1.42.post2`。

### 變更內容 {#whats-changed}

- fix(passthrough): 復原中斷的 anthropic 串流的輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 在失敗列上記錄中斷串流的部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- feat(mcp): 使用 no-mcp-servers sentinel 將金鑰的範圍限定為零個 MCP 伺服器 - [PR #31029](https://github.com/BerriAI/litellm/pull/31029)
- fix(passthrough,streaming): 復原中斷與 agentic Anthropic 串流的成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix(vertex/files): 串流 OpenAI->Vertex 批次 JSONL 上傳 - [PR #31036](https://github.com/BerriAI/litellm/pull/31036)
- fix(deps): 升級被 OSV 標記的相依套件以清除已知 CVE - [PR #31122](https://github.com/BerriAI/litellm/pull/31122)
- fix(docker): 升級 wolfi-base digest 以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.89.3...v1.89.4
