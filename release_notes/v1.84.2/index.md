---
title: "v1.84.2 - 路徑處理加固回補"
slug: "v1-84-2"
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
docker.litellm.ai/berriai/litellm:1.84.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.2
```

</TabItem>
</Tabs>

`v1.84.2` 是在 [`v1.84.1`](/release_notes/v1.84.1/v1-84-1) 之上的修補版發行。它回補了 [host-header authentication bypass advisory](/blog/host-header-auth-bypass) 中涵蓋的路徑處理加固，並將 `npm` 還原到非 root 的 Docker builder。

非 root 部署應改為鎖定 [`v1.84.3`](/release_notes/v1.84.3/v1-84-3)；`litellm-non_root:1.84.2` 映像因為 builder 中缺少 `npm` 而無法建置，而 `v1.84.3` 提供了相同的應用程式程式碼以及修正後的 `Dockerfile.non_root`。

### 錯誤修正 {#bug-fixes}

- **Proxy 驗證／路由**
    - 將 proxy 中依賴路徑的呼叫點透過 `get_request_route()` 路由，讓它們都從 ASGI scope 而不是由 `Host` 重建的 URL 衍生請求路由 - [PR #28547](https://github.com/BerriAI/litellm/pull/28547)

### 基礎架構 {#infrastructure}

- **Docker**
    - 將 `npm` 還原到 `Dockerfile.non_root` builder 階段，使 `prisma-python` 不再回退到由 `nodeenv` 啟動的 Node runtime。適用於 `v1.84.3` 及之後版本；`litellm-non_root:1.84.2` 映像無法建置 - [PR #28519](https://github.com/BerriAI/litellm/pull/28519)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.1...5560f35279
