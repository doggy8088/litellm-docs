---
title: "LiteLLM v1.110.0rc3 修復備援覆寫與 WebSocket 模型別名"
description: "字串備援覆寫不再回應 500，Responses WebSocket 保留團隊模型別名，並包含 Hugging Face、Fireworks AI 與 OpenCode Go 的修復。"
slug: "v1-110-0-rc-3"
date: 2026-11-15T01:10:14
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
docker.litellm.ai/berriai/litellm:1.110.0-rc.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.0rc3
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.110.0-rc.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.0-rc.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.110.0rc3` 是 1.110.0 目前的候選版本。發佈的 GitHub 標籤為 `v1.110.0-rc.3`。本說明將其與 `v1.110.0-rc.2`（`rc/1.110.0` 上的前一個候選版本）比較。這是一個小型 rc 修補版本，包含回移到 rc 分支的修復，其餘皆與 `v1.110.0-rc.2` 相同；前一個修補版本請參閱其 [release notes](/release_notes/v1.110.0rc2/v1-110-0-rc-2)。完整的 1.110 系列請參閱 [`v1.110.0rc1` release notes](/release_notes/v1.110.0rc1/v1-110-0-rc-1)。沒有新的資料庫 migration。`v1.110.0-rc.3` 標籤指向 [`3510cb6`](https://github.com/BerriAI/litellm/commit/3510cb6a60ddae1b75a012d249f15578a58ba82c)。

### 變更內容 {#whats-changed}

- **其他提供者：** 修復端點來自 `HUGGINGFACE_API_BASE` 時，Hugging Face chat 將請求傳送到 `None` 或崩潰的問題 - [PR #51449](https://github.com/BerriAI/litellm/pull/51449)
- **其他提供者：** 修復未對應的 Fireworks AI 模型（例如 `1p5b` 或 `0p6b` 規模）以 4B 以下費率的兩倍計費的問題 - [PR #51451](https://github.com/BerriAI/litellm/pull/51451)
- **其他提供者：** 修復透過 chat completions 串流 OpenCode Go Messages 協定模型時回應 500 的問題 - [PR #51715](https://github.com/BerriAI/litellm/pull/51715)
- **Responses API：** 修復 Responses WebSocket 請求丟棄團隊的模型別名並落到另一個部署的問題 - [PR #51380](https://github.com/BerriAI/litellm/pull/51380)
- **Token 計算：** 修復帶有 Anthropic 伺服器工具歷史（例如 web search）的後續請求略過 context window 檢查的問題 - [PR #51334](https://github.com/BerriAI/litellm/pull/51334)
- **路由與備援：** 修復請求傳送字串備援覆寫（例如 `"fallbacks": "default"`）時回應 500 的問題，此問題自 v1.110.0-dev.1 起出現 - [PR #51502](https://github.com/BerriAI/litellm/pull/51502)
- **部署：** 將 opentelemetry、dnspython、tornado 與 soupsieve 改為 main 已隨附的較新版本 - [PR #51854](https://github.com/BerriAI/litellm/pull/51854)

這些變更的回移 PR 為 [PR #51514](https://github.com/BerriAI/litellm/pull/51514)、[PR #51854](https://github.com/BerriAI/litellm/pull/51854) 與 [PR #51858](https://github.com/BerriAI/litellm/pull/51858)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.0-rc.2...v1.110.0-rc.3
