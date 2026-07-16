---
title: "v1.86.2 - 路徑處理強化回補"
slug: "v1-86-2"
date: 2026-05-27T00:00:00
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
docker.litellm.ai/berriai/litellm:1.86.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.2
```

</TabItem>
</Tabs>

`v1.86.2` 是建構在 [`v1.86.1`](/release_notes/v1.86.1/v1-86-1) 之上的修補版發行。它回補了 [host-header authentication bypass advisory](/blog/host-header-auth-bypass) 中涵蓋的路徑處理強化。

### 錯誤修正 {#bug-fixes}

- **Proxy 驗證 / 路由**
    - 將 proxy 依賴路徑的呼叫點透過 `get_request_route()` 路由，讓它們全部從 ASGI scope 而不是 `Host` 重建的 URL 衍生 request route - [PR #28547](https://github.com/BerriAI/litellm/pull/28547)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.1...v1.86.2
