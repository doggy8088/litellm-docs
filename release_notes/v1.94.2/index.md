---
title: "v1.94.2 - 儀表板 Token 儲存與相依性更新"
slug: "v1-94-2"
date: 2026-08-07T19:10:07
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
docker.litellm.ai/berriai/litellm:1.94.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.94.2
```

</TabItem>
</Tabs>

`v1.94.2` 是在 [`v1.94.1`](/release_notes/v1.94.1/v1-94-1) 之上的修補版本。它將 Admin UI 的 MCP 會話 token 儲存透過共用的瀏覽器儲存輔助工具進行路由，更新 Terraform provider 的 Go 模組，並納入四個第三方 Python 相依套件的維護更新。

在 Admin UI 中，MCP 會話 token 儲存現在透過與儀表板其餘部分相同的共用儲存輔助工具進行讀寫，而不是直接與 `sessionStorage` 溝通。此儲存不再會將重新整理 token 與存取 token 一起保留，且其儲存的負載也不再以可讀文字寫入。這僅限於瀏覽器工作階段內部，無需變更設定；此版本隨附的儀表板 bundle 已重新建置以包含此功能。

Terraform provider 的 `grpc` 與 `golang.org/x` 模組已移至目前版本。這只會影響 provider 本身的建置，不會變更 proxy 映像或 Python 套件。

在相依性方面，`aiohttp` 更新至 3.14.3，`cryptography` 更新至 50.0.0，`gitpython` 更新至 3.1.58，`h2` 更新至 4.4.1，皆為維持版本最新所需的最小升級。`cryptography` 更新也將 `proxy` 額外套件的支援範圍擴大至 `>=49.0.0,<51.0`，與開發分支所使用的範圍一致。如果您將 `cryptography` 鎖定在 49 以下且同時使用 `litellm[proxy]`，請在升級時調整該鎖定值。

### 變更內容 {#whats-changed}

- refactor(ui): 透過共用儲存輔助工具路由 MCP 會話 token - [PR #35835](https://github.com/BerriAI/litellm/pull/35835)
- chore(deps): 更新 terraform provider 中的 grpc 和 golang.org/x 模組 - [PR #35844](https://github.com/BerriAI/litellm/pull/35844)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.94.1...v1.94.2
