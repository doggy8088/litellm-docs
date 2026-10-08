---
title: "v1.88.5 - Vertex 批次上傳與串流成本回收"
slug: "v1-88-5"
date: 2026-06-25T00:00:17
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

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.88.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.5
```

</TabItem>
</Tabs>

`v1.88.5` 是建立在 [`v1.88.4`](/release_notes/v1.88.4/v1-88-4) 之上的修補版本。它會串流 OpenAI→Vertex 批次 JSONL 上傳，而不是將其緩衝在記憶體中，回補中斷的 Anthropic 串流之成本追蹤回復，新增一個 `no-mcp-servers` sentinal 以將金鑰範圍限定為零個 MCP 伺服器，並升級 OpenSSL 與執行階段相依套件（`cryptography`、`aiohttp`）以涵蓋 CVE。內建的 `litellm-enterprise` 套件已升級至 `0.1.42.post1`。

### 變更內容 {#whats-changed}

- fix(passthrough): 回復中斷 anthropic 串流的輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)
- fix(proxy): 在中斷串流的失敗列上記錄部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)
- feat(mcp): 使用 no-mcp-servers sentinel 將金鑰範圍限定為零個 MCP 伺服器 - [PR #31029](https://github.com/BerriAI/litellm/pull/31029)
- fix(passthrough,streaming): 回復中斷與 agentic Anthropic 串流的成本 - [PR #31035](https://github.com/BerriAI/litellm/pull/31035)
- fix(vertex/files): 串流 OpenAI->Vertex 批次 JSONL 上傳 - [PR #31036](https://github.com/BerriAI/litellm/pull/31036)
- fix(docker): 將 wolfi-base digest 升級以修補 openssl CVE-2026-34182 - [PR #31133](https://github.com/BerriAI/litellm/pull/31133)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.4...v1.88.5
