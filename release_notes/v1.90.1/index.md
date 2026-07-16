---
title: "v1.90.1 - Vertex 批次上傳與金鑰去識別化"
slug: "v1-90-1"
date: 2026-06-30T01:40:47
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
docker.litellm.ai/berriai/litellm:1.90.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.1
```

</TabItem>
</Tabs>

`v1.90.1` 是建立在 [`v1.90.0`](/release_notes/v1.90.0/v1-90-0) 之上的修補版本。它將三個修正回補到 1.90.x 版本線：Vertex AI 批次檔案上傳改為單一媒體上傳，因此大型上傳不再會因 499 錯誤而失敗，OpenAI→Vertex 批次 JSONL 上傳改為串流而非在記憶體中緩衝，且 API 金鑰會從 `/key/info` 用戶端錯誤訊息中移除。隨附的 `litellm-enterprise` 套件已升級至 `0.1.43.post1`。

### 有哪些變更 {#whats-changed}

- fix(vertex_ai/files): batch files 單一媒體上傳以修正大型上傳時的 499 錯誤 - [PR #31653](https://github.com/BerriAI/litellm/pull/31653)
- fix(vertex/files): 串流 OpenAI->Vertex 批次 JSONL 上傳 - [PR #31036](https://github.com/BerriAI/litellm/pull/31036)
- fix(proxy/client): 從 key/info 用戶端錯誤訊息中移除 api key - [PR #31342](https://github.com/BerriAI/litellm/pull/31342)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.0...v1.90.1
