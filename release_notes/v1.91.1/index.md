---
title: "v1.91.1 - DB Model Config 一致性與 OTel 錯誤 span"
slug: "v1-91-1"
date: 2026-07-08T23:01:36
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
docker.litellm.ai/berriai/litellm:1.91.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.91.1
```

</TabItem>
</Tabs>

`v1.91.1` 是建立在 [`v1.91.0`](/release_notes/v1.91.0/v1-91-0) 之上的修補版本。它將三個修正回補到 1.91.x 系列。前兩個改善儲存在資料庫中的模型之設定處理，使其與 YAML 設定中定義的模型保持一致。第三個則恢復 OpenTelemetry v2 錯誤 span 上完整的 `error.*` 屬性集合，因此可觀測性後端能再次看到完整的錯誤形狀，而不只是錯誤類型。

### 變更內容 {#whats-changed}

- fix(proxy): 改善資料庫儲存模型的設定處理 - [PR #32256](https://github.com/BerriAI/litellm/pull/32256), [PR #32405](https://github.com/BerriAI/litellm/pull/32405)
- fix(otel): 還原 v2 錯誤 span 上的 error.* span 屬性 - [PR #32524](https://github.com/BerriAI/litellm/pull/32524)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.91.0...v1.91.1
