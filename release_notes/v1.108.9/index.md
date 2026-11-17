---
title: "LiteLLM v1.108.9 (LTS) 新增 Vertex 標籤並修復 Foundry /openai/v1"
description: "Vertex 呼叫可帶上呼叫者的金鑰、團隊、組織與專案標籤，Azure Foundry /openai/v1 部署可正常運作，Bedrock Converse 可讀取 s3:// 媒體。"
slug: "v1-108-9"
date: 2026-11-14T22:00:02
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

:::tip

`v1.108.9` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可維持在最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.108.9
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.9
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.108.9`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.9) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.9` 是 [`v1.108.8`](/release_notes/v1.108.8/v1-108-8) 之上的修補版本。沒有新的資料庫 migration。`v1.108.9` 標籤指向 [`82ae95f`](https://github.com/BerriAI/litellm/commit/82ae95fa3d7194df7178e9f06e1c497e37611a07)。

### 變更內容 {#whats-changed}

- **Azure：** 修復 Azure AI Foundry 上的 Kimi K3 在工具呼叫後遺失先前推理並拒絕 `reasoning_effort` 的問題 - [PR #51747](https://github.com/BerriAI/litellm/pull/51747)
- **Azure：** 修復 Foundry 專案 `/openai/v1` base 回應 400，以及資源層級 `/openai/v1` Responses base 回應 404 的問題 - [PR #51767](https://github.com/BerriAI/litellm/pull/51767)
- **AWS Bedrock：** 修復 Converse 模型上的 `s3://` 圖片、PDF 與影片 URL 回應 500 的問題，現在會以 S3 來源形式傳送給 Bedrock - [PR #50577](https://github.com/BerriAI/litellm/pull/50577)
- **AWS Bedrock：** 修復使用 OpenAI 風格篩選條件進行 Bedrock 向量儲存搜尋時 AWS 回應 400 的問題 - [PR #51291](https://github.com/BerriAI/litellm/pull/51291)
- **Vertex AI and Gemini：** 新增 `vertex_request_label_fields`，以呼叫者的金鑰、團隊、組織與專案為 Vertex 呼叫加上標籤 - [PR #50732](https://github.com/BerriAI/litellm/pull/50732)
- **Vertex AI and Gemini：** 修復將 `labels` 傳送給 Vertex AI 上的 Claude 時回應 400 `Extra inputs are not permitted` 的問題 - [PR #48753](https://github.com/BerriAI/litellm/pull/48753)
- **其他提供者：** 在 `/v1/decisions` 新增 Vercel AI Gateway 模型，依 Vercel 回報的成本計費 - [PR #50642](https://github.com/BerriAI/litellm/pull/50642)
- **Responses API：** 修復串流 `/v1/responses` 在第一個回答片段與 reasoning 一起到達時將其丟棄的問題 - [PR #51356](https://github.com/BerriAI/litellm/pull/51356)
- **Responses API：** 修復帶有函式工具的 chat 請求橋接到 Responses API 時，`cache_control` 標記被丟棄的問題 - [PR #51783](https://github.com/BerriAI/litellm/pull/51783)
- **部署：** 將 Docker 映像改為較新的 Wolfi 基礎映像，並更新 opentelemetry、dnspython、tornado 與 soupsieve - [PR #51853](https://github.com/BerriAI/litellm/pull/51853)

這些變更的回移 PR 為 [PR #50401](https://github.com/BerriAI/litellm/pull/50401)、[PR #51250](https://github.com/BerriAI/litellm/pull/51250)、[PR #51292](https://github.com/BerriAI/litellm/pull/51292)、[PR #51748](https://github.com/BerriAI/litellm/pull/51748)、[PR #51769](https://github.com/BerriAI/litellm/pull/51769)、[PR #51786](https://github.com/BerriAI/litellm/pull/51786) 與 [PR #51796](https://github.com/BerriAI/litellm/pull/51796)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.8...v1.108.9
