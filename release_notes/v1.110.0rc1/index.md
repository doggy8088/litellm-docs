---
title: "LiteLLM v1.110.0rc1 新增 Agent Skills Hub 與僅限 Rust 的路由器"
description: "LiteLLM 1.110.0 的發行候選版，帶有 Agent Skills Hub、僅限 Rust 的路由器、預設的花費分類帳與最新的 OpenAI 即時模型。"
slug: "v1-110-0-rc-1"
date: 2026-11-11T00:06:06
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
docker.litellm.ai/berriai/litellm:1.110.0-rc.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.0rc1
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.110.0-rc.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.0-rc.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

已發佈的 GitHub 標籤是 `v1.110.0-rc.1`。這些說明將它與上一個發行候選版 `v1.109.0-rc.1` 比較。已回移到 `rc/1.109.0` 並已隨 `v1.109.0` 出貨的變更省略。

面向客戶的變更在前。測試、CI 與內部變更列在底部。

:::danger 重大變更

這些提示涵蓋與最新穩定版 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0) 不同的使用者行為。

**路由器永遠在 Rust 核心上執行。** Rust 核心拒絕的路由器設定現在會在啟動時引發錯誤，而非備援到 Python 路由器，`LITELLM_RUST` 也不再選取路由器核心。請修正啟動錯誤指出的設定。請參閱 [PR #50178](https://github.com/BerriAI/litellm/pull/50178)。

**沒有任何設定 API 管理的已儲存 `general_settings` 金鑰不再生效。** 舊版留在資料庫中的值（例如過時的 `enforce_user_param`）停止生效。請將仍需要的值設定在設定檔中，或透過支援的設定。請參閱 [PR #48967](https://github.com/BerriAI/litellm/pull/48967)。

**串流的 `/v1/responses` 不再以 `[DONE]` 結尾。** 現在每個 SSE 事件都有名稱，如同 OpenAI 的 Responses 串流。請更新等待 `[DONE]` 或只讀取未命名 `onmessage` 事件的用戶端。請參閱 [PR #47980](https://github.com/BerriAI/litellm/pull/47980)。

**代理程式未核發的原始回應 ID 預設被拒絕。** 請重用代理程式回傳的受管理 ID，或設定 `allow_unmanaged_response_ids` 以繼續接受原始 ID。請參閱 [PR #49402](https://github.com/BerriAI/litellm/pull/49402)。

**批次請求只能指出管理員允許的 S3 bucket。** 帶有 `s3_bucket_name` 或 `s3_output_bucket_name` 的請求 body 現在會得到 401，除非該 bucket 在 `general_settings.allowed_client_side_s3_buckets` 中。請在升級前加入您的用戶端使用的 bucket。請參閱 [PR #47496](https://github.com/BerriAI/litellm/pull/47496)。

:::

## 重點摘要 {#key-highlights}

- **Rust 路由器核心**：`Router` 永遠在 Rust 核心上執行，並修復加權容錯移轉、計入冷卻的重試，以及與部署更新競態的讀取
- **花費分類帳**：花費預設透過 `LiteLLM_SpendLogDelivery` 分類帳收取，管理員可依金鑰或團隊關閉提示儲存
- **Agent Skills Hub**：從儀表板上傳與匯入可攜式技能、版本歷史，以及帶有管理員審查佇列的成員提交流程
- **即時與 Bedrock**：最新的 OpenAI 即時音訊模型（帶有翻譯路由），以及 Bedrock 上 Claude 的原生結構化輸出
- **模型生命週期**：第一方模型的 `-latest` 別名，外加模型退役警示與給受影響金鑰擁有者的可選電子郵件
- **可靠性**：每個請求在結束時釋放其 Redis 批次範圍，停止每個請求約 40 KiB 的 worker 記憶體增長，`total_timeout` 為包含重試的整個請求設上限

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Wally | `/v1/chat/completions` | `wally/` 之下的 OpenAI 相容提供者，帶有已定價模型與 Add Model 表單項目 |
| EmpirioLabs AI | `/v1/decisions`, `/v1/systemone`, `/v1/embeddings` | `empiriolabs/` 之下的 Decisions 與 embeddings 提供者 |

## 新增模型 / 更新的模型 {#new-models--updated-models}

#### 新增模型支援（370 個新模型） {#new-model-support-370-new-models}

數量表示與 `v1.109.0` 相比的新型錄識別碼，包含別名與區域變體。價格是此版本隨附的值（USD），執行階段定價對應表重新載入可以更新它們。已移除 52 列已退役模型，例如 `azure/gpt-4`、`azure/gpt-35-turbo-16k` 與 `azure/command-r-plus`。

<details>
<summary>全部 370 個新型錄項目</summary>

| 提供者 | Model | Context Window | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `bedrock/claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `global.anthropic.claude-fable-5-1` 的別名 |
| Amazon Bedrock | `bedrock/claude-haiku-latest` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `global.anthropic.claude-haiku-5-5` 的別名 |
| Amazon Bedrock | `bedrock/claude-opus-latest` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `global.anthropic.claude-opus-5-5` 的別名 |
| Amazon Bedrock | `bedrock/claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `global.anthropic.claude-sonnet-5-5` 的別名 |
| Amazon Bedrock | `bedrock/glm-latest` | 1,000,000 | $1.68 | $5.28 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `global.zai.glm-5.3` 的別名 |
| Amazon Bedrock | `bedrock/gpt-astra-latest` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；為 `global.openai.gpt-6-astra` 的別名 |
| Amazon Bedrock | `bedrock/gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `global.openai.gpt-6-luna` 的別名 |
| Amazon Bedrock | `bedrock/gpt-sol-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；為 `global.openai.gpt-6.1-sol` 的別名 |
| Amazon Bedrock | `bedrock/gpt-terra-latest` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `global.openai.gpt-6.1-terra` 的別名 |
| Amazon Bedrock | `bedrock/grok-latest` | 524,288 | $2 | $6 | 聊天；推理；視覺；工具呼叫；為 `global.xai.grok-4.7` 的別名 |
| Amazon Bedrock | `bedrock/kimi-latest` | 1,000,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `global.moonshotai.kimi-k3` 的別名 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-3-5-sonnet-20240620-v1:0` | 200,000 | $3.6 | $18 | 聊天；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-3-7-sonnet-20250219-v1:0` | 200,000 | $3.6 | $18 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-3-haiku-20240307-v1:0` | 195,904 | $0.3 | $1.5 | 聊天；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `bedrock/us-gov-east-1/moonshotai.kimi-k3` | 868,928 | $3.96 | $19.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-3-5-sonnet-20240620-v1:0` | 200,000 | $3.6 | $18 | 聊天；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-3-7-sonnet-20250219-v1:0` | 200,000 | $3.6 | $18 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-3-haiku-20240307-v1:0` | 195,904 | $0.3 | $1.5 | 聊天；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Amazon Bedrock | `bedrock/us-gov-west-1/moonshotai.kimi-k3` | 868,928 | $3.96 | $19.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `global.moonshotai.kimi-k3.1` | 868,928 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `in.moonshotai.kimi-k3.1` | 868,928 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `moonshotai.kimi-k3.1` | 868,928 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `us-gov.xai.grok-4.7` | 524,288 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `us.moonshotai.kimi-k3.1` | 868,928 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/claude-haiku-latest` | 1,000,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `bedrock_mantle/anthropic.claude-haiku-5-5` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/claude-opus-latest` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `bedrock_mantle/anthropic.claude-opus-5-5` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/claude-sonnet-latest` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `bedrock_mantle/anthropic.claude-sonnet-5-5` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/gpt-astra-latest` | 922,000 | $11 | $55 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `bedrock_mantle/openai.gpt-6-astra` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/gpt-luna-latest` | 922,000 | $0.11 | $0.55 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `bedrock_mantle/openai.gpt-6-luna` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/gpt-sol-latest` | 1,000,000 | $2.2 | $11 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `bedrock_mantle/openai.gpt-6.1-sol` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/gpt-terra-latest` | 922,000 | $1.1 | $5.5 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `bedrock_mantle/openai.gpt-6.1-terra` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/grok-latest` | 524,288 | $2.2 | $6.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `bedrock_mantle/xai.grok-4.7` 的別名 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/nvidia.nemotron-nano-12b-v2` | 128,000 | $0.24 | $0.72 | 聊天；視覺；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/nvidia.nemotron-nano-3-30b` | 262,144 | $0.072 | $0.288 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/nvidia.nemotron-nano-9b-v2` | 128,000 | $0.072 | $0.276 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/nvidia.nemotron-super-3-120b` | 256,000 | $0.18 | $0.78 | 聊天；推理；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/xai.grok-4.7` | 524,288 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-west-1/nvidia.nemotron-nano-12b-v2` | 128,000 | $0.24 | $0.72 | 聊天；視覺；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-west-1/nvidia.nemotron-nano-3-30b` | 262,144 | $0.072 | $0.288 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-west-1/nvidia.nemotron-nano-9b-v2` | 128,000 | $0.072 | $0.276 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-west-1/nvidia.nemotron-super-3-120b` | 256,000 | $0.18 | $0.78 | 聊天；推理；工具呼叫；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-west-1/xai.grok-4.7` | 524,288 | $2.64 | $7.92 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock Mantle | `bedrock_mantle/xai.grok-4.7` | 524,288 | $2.2 | $6.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Anthropic | `claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `claude-fable-5-1` 的別名 |
| Anthropic | `claude-haiku-latest` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `claude-haiku-5-5` 的別名 |
| Anthropic | `claude-opus-latest` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `claude-opus-5-5` 的別名 |
| Anthropic | `claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `claude-sonnet-5-5` 的別名 |
| Azure | `azure/gpt-astra-latest` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure/gpt-6-astra` 的別名 |
| Azure | `azure/gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure/gpt-6-luna` 的別名 |
| Azure | `azure/gpt-mini-latest` | 272,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；為 `azure/gpt-5.4-mini` 的別名 |
| Azure | `azure/gpt-realtime-2.1-2026-07-07` | 32,000 | $4 | $24 | 即時；推理；工具呼叫；提示快取；音訊輸入；音訊輸出 |
| Azure | `azure/gpt-realtime-2.1-mini-2026-07-07` | 32,000 | $0.6 | $2.4 | 即時；推理；工具呼叫；提示快取；音訊輸入；音訊輸出 |
| Azure | `azure/gpt-realtime-translate-2026-05-06` | 32,000 | - | - | 即時；音訊輸入；音訊輸出；每秒輸入 $0.000566667 |
| Azure | `azure/gpt-realtime-translate-2026-05-07` | 32,000 | - | - | 即時；音訊輸入；音訊輸出；每秒輸入 $0.000566667 |
| Azure | `azure/gpt-realtime-whisper-2026-05-06` | 32,000 | - | - | 音訊轉錄；音訊輸入；每秒輸入 $0.000283333 |
| Azure | `azure/gpt-realtime-whisper-2026-05-07` | 32,000 | - | - | 音訊轉錄；音訊輸入；每秒輸入 $0.000283333 |
| Azure | `azure/gpt-sol-latest` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure/gpt-6.1-sol` 的別名 |
| Azure | `azure/gpt-terra-latest` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure/gpt-6.1-terra` 的別名 |
| Azure | `azure/us/gpt-realtime-1.5` | 32,000 | $4.4 | $17.6 | 即時；工具呼叫；音訊輸入；音訊輸出 |
| Azure | `azure/us/gpt-realtime-2.1-mini` | 32,000 | $0.66 | $2.64 | 即時；推理；工具呼叫；提示快取；音訊輸入；音訊輸出 |
| Azure | `azure/us/gpt-realtime-2.1` | 32,000 | $4.4 | $26.4 | 即時；推理；工具呼叫；提示快取；音訊輸入；音訊輸出 |
| Azure AI | `azure_ai/claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `azure_ai/claude-fable-5-1` 的別名 |
| Azure AI | `azure_ai/claude-haiku-latest` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `azure_ai/claude-haiku-5-5` 的別名 |
| Azure AI | `azure_ai/claude-mythos-5-1` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/claude-opus-latest` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `azure_ai/claude-opus-5-5` 的別名 |
| Azure AI | `azure_ai/claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `azure_ai/claude-sonnet-5-5` 的別名 |
| Azure AI | `azure_ai/cohere-rerank-v5-fast` | 32,768 | $0.02 | $0 | 重新排名 |
| Azure AI | `azure_ai/cohere-rerank-v5-pro` | 32,768 | $0.05 | $0 | 重新排名 |
| Azure AI | `azure_ai/deepseek-flash-latest` | 1,000,000 | $0.19 | $0.51 | 聊天；推理；工具呼叫；提示快取；為 `azure_ai/deepseek-v4-flash` 的別名 |
| Azure AI | `azure_ai/deepseek-pro-latest` | 1,000,000 | $1.74 | $3.48 | 聊天；推理；工具呼叫；提示快取；為 `azure_ai/deepseek-v4-pro` 的別名 |
| Azure AI | `azure_ai/glm-flash-latest` | 1,048,576 | $0.188 | $0.625 | 聊天；推理；工具呼叫；提示快取；為 `azure_ai/FW-GLM-5.3-Flash` 的別名 |
| Azure AI | `azure_ai/glm-latest` | 1,048,576 | $1.75 | $5.5 | 聊天；推理；工具呼叫；提示快取；為 `azure_ai/FW-GLM-5.3` 的別名 |
| Azure AI | `azure_ai/gpt-astra-latest` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure_ai/gpt-6-astra` 的別名 |
| Azure AI | `azure_ai/gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure_ai/gpt-6-luna` 的別名 |
| Azure AI | `azure_ai/gpt-mini-latest` | 272,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；為 `azure_ai/gpt-5.4-mini` 的別名 |
| Azure AI | `azure_ai/gpt-sol-latest` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure_ai/gpt-6.1-sol` 的別名 |
| Azure AI | `azure_ai/gpt-terra-latest` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `azure_ai/gpt-6.1-terra` 的別名 |
| Azure AI | `azure_ai/grok-latest` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `azure_ai/grok-4.7` 的別名 |
| Azure AI | `azure_ai/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；為 `azure_ai/FW-Kimi-K3` 的別名 |
| Azure AI | `azure_ai/minimax-latest` | 512,000 | $0.33 | $1.32 | 聊天；推理；視覺；工具呼叫；提示快取；為 `azure_ai/FW-MiniMax-M3` 的別名 |
| Baseten | `baseten/deepseek-flash-latest` | 1,048,576 | $0.13 | $0.26 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `baseten/deepseek-ai/DeepSeek-V4-Flash-0731` 的別名 |
| Baseten | `baseten/deepseek-pro-latest` | 1,048,576 | $1.32 | $3.96 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `baseten/deepseek-ai/DeepSeek-V4-Pro-0813` 的別名 |
| Baseten | `baseten/glm-flash-latest` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `baseten/zai-org/GLM-5.3-Flash` 的別名 |
| Baseten | `baseten/glm-latest` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `baseten/zai-org/GLM-5.3` 的別名 |
| Baseten | `baseten/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `baseten/moonshotai/Kimi-K3` 的別名 |
| Baseten | `baseten/moonshotai/Kimi-K3.1-Pro` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| DashScope | `dashscope/qwen-flash-latest` | 991,808 | $0.15 | $0.47 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `dashscope/qwen3.8-flash` 的別名 |
| DashScope | `dashscope/qwen-max-latest` | 991,808 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `dashscope/qwen3.8-max` 的別名 |
| Databricks | `databricks/claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-claude-fable-5-1` 的別名 |
| Databricks | `databricks/claude-haiku-latest` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-claude-haiku-5-5` 的別名 |
| Databricks | `databricks/claude-opus-latest` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-claude-opus-5-5` 的別名 |
| Databricks | `databricks/claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；工具呼叫；提示快取；為 `databricks/databricks-claude-sonnet-5-5` 的別名 |
| Databricks | `databricks/databricks-kimi-k3-1-pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/glm-flash-latest` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-glm-5-3-flash` 的別名 |
| Databricks | `databricks/glm-latest` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `databricks/databricks-glm-5-3` 的別名 |
| Databricks | `databricks/gpt-astra-latest` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-gpt-6-astra` 的別名 |
| Databricks | `databricks/gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 回應；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-gpt-6-luna` 的別名 |
| Databricks | `databricks/gpt-mini-latest` | 272,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-gpt-5-4-mini` 的別名 |
| Databricks | `databricks/gpt-sol-latest` | 922,000 | $2 | $10 | 回應；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-gpt-6-1-sol` 的別名 |
| Databricks | `databricks/gpt-terra-latest` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-gpt-6-1-terra` 的別名 |
| Databricks | `databricks/grok-latest` | 500,000 | $2.5 | $7.5 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-grok-4-7` 的別名 |
| Databricks | `databricks/kimi-latest` | 1,000,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；為 `databricks/databricks-kimi-k3` 的別名 |
| Deepgram | `deepgram/streaming/nova-3-medical` | - | - | - | 音訊轉錄；每秒輸入 $0.00012833 |
| DeepSeek | `deepseek/deepseek-flash-latest` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `deepseek/deepseek-v4-flash` 的別名 |
| DeepSeek | `deepseek/deepseek-pro-latest` | 1,000,000 | $1.32 | $3.96 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `deepseek/deepseek-v4-pro` 的別名 |
| Empirio Labs | `empiriolabs/aplomb-1` | 1,000,000 | $0.02 | $0 | 聊天；視覺；音訊輸入 |
| Empirio Labs | `empiriolabs/deepseek-v4-1-flash-1017` | 1,000,000 | $0.2 | $0.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/deepseek-v4-flash-0731:variant1` | 1,000,000 | $0.44 | $1.32 | 聊天；推理；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/deepseek-v4-flash-0731` | 1,000,000 | $0.424 | $1.272 | 聊天；推理；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/deepseek-v4-pro-0813` | 1,000,000 | $1.32 | $3.96 | 聊天；推理；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/deepseek-v4-pro:variant1` | 1,000,000 | $2.4 | $4.8 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/deepseek-v4-pro:variant2` | 1,000,000 | $1.65 | $3.301 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/deepseek-v4-pro:variant3` | 1,000,000 | $2.4 | $4.8 | 聊天；推理；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/deepseek-v4-pro` | 1,000,000 | $1.65 | $3.3 | 聊天；推理；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/fugu-max` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/fugu-ultra-v1-0` | 1,000,000 | $7.5 | $45 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/fugu-ultra-v1-1` | 1,000,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/fugu-ultra-v2-0` | 1,000,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/gemma-4-26b-a4b` | 262,144 | $0.05 | $0.29 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/glm-4-6v-flashx` | 131,072 | $0.04 | $0.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-4-7-flashx` | 202,752 | $0.07 | $0.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-5-1` | 202,745 | $0.825 | $3.301 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/glm-5-2:variant1` | 1,048,576 | $1.1 | $3.851 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-5-2:variant2` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-5-2` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-5-3-flash` | 1,048,576 | $0.075 | $0.25 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/glm-5-3` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/kimi-k2-6` | 262,144 | $0.8939 | $3.7131 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/kimi-k2-7-code-highspeed` | 262,144 | $1.9 | $8 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/kimi-k2-7-code:variant1` | 262,144 | $0.8939 | $3.7131 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/kimi-k2-7-code` | 262,144 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/kimi-k3-1-pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/kimi-k3` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/mimo-v2-6-flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/mimo-v2-6-pro-ultraspeed` | 1,048,576 | $4.35 | $8.7 | 聊天；推理；視覺；工具呼叫；結構化輸出；音訊輸入 |
| Empirio Labs | `empiriolabs/mimo-v2-6-pro` | 1,048,576 | $0.435 | $0.87 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/minimax-m2-7-highspeed` | 204,800 | $0.3 | $1.2 | 聊天；推理；工具呼叫；提示快取 |
| Empirio Labs | `empiriolabs/minimax-m2-7` | 204,800 | $0.15 | $0.6 | 聊天；推理；工具呼叫；提示快取 |
| Empirio Labs | `empiriolabs/minimax-m3-1-flash` | 1,048,576 | $0.1125 | $0.45 | 聊天；推理；視覺；工具呼叫；提示快取；網頁搜尋 |
| Empirio Labs | `empiriolabs/minimax-m3:priority` | 1,048,458 | $0.3375 | $1.35 | 聊天；推理；視覺；工具呼叫；提示快取；網頁搜尋 |
| Empirio Labs | `empiriolabs/minimax-m3` | 1,048,576 | $0.225 | $0.9 | 聊天；推理；視覺；工具呼叫；提示快取；網頁搜尋 |
| Empirio Labs | `empiriolabs/mistral-small-4` | 262,144 | $0.15 | $0.6 | 聊天；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/muse-glimmer-30b` | 131,072 | $0.2 | $0.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/muse-spark-1-1` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/muse-spark-1-2` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/muse-spark-1-3` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/nova-lite-1-0` | 317,379 | $0.069 | $0.28 | 聊天；視覺；工具呼叫；提示快取 |
| Empirio Labs | `empiriolabs/nova-lite-2` | 1,000,000 | $0.38 | $3.16 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Empirio Labs | `empiriolabs/nova-micro-1-0` | 133,003 | $0.04 | $0.16 | 聊天；工具呼叫；提示快取 |
| Empirio Labs | `empiriolabs/nova-pro-1-0` | 317,319 | $2.4 | $9.6 | 聊天；視覺；工具呼叫 |
| Empirio Labs | `empiriolabs/perplexity-advanced-deep-research` | - | $12 | $60 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/perplexity-deep-research` | 919,327 | $4.8 | $19 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/perplexity-pro-search` | - | $7.8 | $39 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/perplexity-sonar-pro` | 919,328 | $7.2 | $36 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/perplexity-sonar-reasoning-pro` | 919,330 | $4.8 | $19 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/perplexity-sonar` | 919,327 | $2.4 | $2.4 | 聊天；推理；視覺；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-122b-a10b` | 258,048 | $0.115 | $0.917 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-27b` | 258,048 | $0.086 | $0.688 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-35b-a3b` | 258,048 | $0.057 | $0.459 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-397b-a17b` | 258,048 | $0.172 | $1.032 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-4b` | 262,144 | $0.04 | $0.07 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/qwen3-5-9b` | 262,144 | $0.09 | $0.13 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/qwen3-5-flash:variant1` | 995,904 | $0.029 | $0.287 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-flash` | 995,904 | $0.09 | $0.368 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-omni-flash` | 196,608 | $0.8 | $4.4 | 聊天；視覺；工具呼叫；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/qwen3-5-omni-plus` | 196,608 | $2.8 | $16.6 | 聊天；視覺；工具呼叫；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/qwen3-5-plus:variant1` | 983,616 | $0.115 | $0.688 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-5-plus` | 983,616 | $0.36 | $2.21 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-6-27b` | 229,376 | $0.4126 | $2.4754 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-6-35b-a3b` | 131,072 | $0.07 | $0.42 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/qwen3-6-flash:variant1` | 983,616 | $0.165 | $0.99 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-6-flash` | 983,616 | $0.25 | $1.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-6-plus:variant1` | 983,616 | $0.276 | $1.651 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-6-plus` | 983,616 | $0.5 | $3 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-flash:variant1` | 983,616 | $0.028 | $0.11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-flash` | 983,616 | $0.03 | $0.13 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-max:variant1` | 983,616 | $1.65 | $4.951 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-max` | 983,616 | $2.5 | $7.5 | 聊天；推理；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-plus:variant1` | 983,616 | $0.276 | $1.101 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-7-plus` | 983,616 | $0.4 | $1.6 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-8-27b` | 262,144 | $0.17 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/qwen3-8-flash` | 983,616 | $0.16 | $0.47 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-8-max-0902` | 983,616 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-8-max:variant1` | 983,616 | $1.65 | $4.951 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-8-max` | 983,616 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/qwen3-8-omni-flash` | 1,006,592 | $0.3 | $0.94 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/seed-2-0-code` | 229,096 | $0.4 | $2.4 | 聊天；推理；視覺；工具呼叫 |
| Empirio Labs | `empiriolabs/seed-2-0-lite` | 229,096 | $0.31 | $2.5 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/seed-2-0-mini` | 229,156 | $0.12 | $0.5 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/seed-2-0-pro` | 229,096 | $0.63 | $3.79 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/seed-2-1-turbo` | 229,093 | $0.63 | $3.13 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Empirio Labs | `empiriolabs/skylark-embedding-vision` | 8,000 | $0.25 | - | 嵌入 |
| Empirio Labs | `empiriolabs/step-3-5-flash-2603` | 262,144 | $0.1 | $0.3 | 聊天；推理；工具呼叫；提示快取；網頁搜尋 |
| Empirio Labs | `empiriolabs/step-3-5-flash` | 262,144 | $0.1 | $0.3 | 聊天；推理；工具呼叫；提示快取；網頁搜尋 |
| Empirio Labs | `empiriolabs/step-3-7-flash` | 262,144 | $0.2 | $1.15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| Empirio Labs | `empiriolabs/step-5-preview` | 1,024,000 | $1 | $2.7 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Empirio Labs | `empiriolabs/stepaudio-2-5-chat` | 262,144 | $1.5 | $3.5 | 聊天；工具呼叫；提示快取；結構化輸出；網頁搜尋；音訊輸入 |
| Empirio Labs | `empiriolabs/stepaudio-3-chat` | 262,144 | $1.5 | $3.5 | 聊天；推理；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| Empirio Labs | `empiriolabs/text-embedding-v4` | 8,192 | $0.07 | - | 嵌入 |
| Empirio Labs | `empiriolabs/tongyi-embedding-vision-flash` | 1,024 | $0.09 | - | 嵌入 |
| Empirio Labs | `empiriolabs/tongyi-embedding-vision-plus` | 1,024 | $0.09 | - | 嵌入 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/kimi-k3p1-pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-1017-ultrafast` | 1,048,576 | $2.4 | $9.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `fireworks_ai/accounts/fireworks/models/kimi-k3` 的別名 |
| Fireworks AI | `fireworks_ai/minimax-latest` | 512,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `fireworks_ai/accounts/fireworks/models/minimax-m3` 的別名 |
| Gemini | `gemini/gemini-omni-1.2-flash` | 131,072 | $1.5 | $9 | 聊天；推理；視覺；音訊輸出 |
| GitHub Copilot | `github_copilot/claude-fable-latest` | 200,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/claude-fable-5.1` 的別名 |
| GitHub Copilot | `github_copilot/claude-haiku-latest` | 128,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/claude-haiku-5.5` 的別名 |
| GitHub Copilot | `github_copilot/claude-opus-latest` | 200,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/claude-opus-5.5` 的別名 |
| GitHub Copilot | `github_copilot/claude-sonnet-latest` | 200,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/claude-sonnet-5.5` 的別名 |
| GitHub Copilot | `github_copilot/gpt-astra-latest` | 922,000 | $10 | $50 | 回應；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/gpt-6-astra` 的別名 |
| GitHub Copilot | `github_copilot/gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 回應；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/gpt-6-luna` 的別名 |
| GitHub Copilot | `github_copilot/gpt-sol-latest` | 922,000 | $2 | $10 | 回應；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/gpt-6.1-sol` 的別名 |
| GitHub Copilot | `github_copilot/gpt-terra-latest` | 922,000 | $1 | $5 | 回應；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/gpt-6.1-terra` 的別名 |
| GitHub Copilot | `github_copilot/grok-latest` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出；為 `github_copilot/grok-4.7` 的別名 |
| GitHub Copilot | `github_copilot/kimi-latest` | 917,504 | $3 | $15 | 聊天；視覺；工具呼叫；結構化輸出；為 `github_copilot/kimi-k3` 的別名 |
| GMI Cloud | `gmi/MiniMaxAI/MiniMax-M2.5` | 196,608 | $0.3 | $1.2 | 聊天 |
| GMI Cloud | `gmi/MiniMaxAI/MiniMax-M2.7` | 196,608 | $0.21 | $0.84 | 聊天 |
| GMI Cloud | `gmi/MiniMaxAI/MiniMax-M2` | 196,608 | $0.3 | $1.2 | 聊天 |
| GMI Cloud | `gmi/MiniMaxAI/MiniMax-M3.1-Flash` | 1,048,576 | $0.1125 | $0.45 | 聊天 |
| GMI Cloud | `gmi/MiniMaxAI/MiniMax-M3` | 1,048,576 | $0.24 | $0.96 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-235B-A22B-FP8` | 32,768 | $0.17 | $1.09 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-235B-A22B-Instruct-2507-FP8` | 262,144 | $0.0875 | $0.35 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-235B-A22B-Thinking-2507-FP8` | 262,141 | $0.35 | $4.2 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-30B-A3B` | 40,946 | $0.08 | $0.25 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-32B-FP8` | 32,768 | $0.1 | $0.6 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8` | 262,128 | $0.9 | $4.5 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-Next-80B-A3B-Instruct` | 262,144 | $0.15 | $1.5 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3-Next-80B-A3B-Thinking` | 262,144 | $0.15 | $1.5 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.5-122B-A10B` | 262,144 | $0.4 | $3.2 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.5-27B` | 262,144 | $0.3 | $2.4 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.5-35B-A3B` | 262,144 | $0.25 | $2 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.5-397B-A17B` | 262,144 | $0.6 | $3.6 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.6-35B-A3B` | 262,144 | $0.248 | $1.485 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.6-Plus-2026-04-02` | 262,144 | $0.5 | $3 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.6-Plus` | 262,144 | $0.5 | $3 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.7-Max` | 262,144 | $2.5 | $7.5 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.8-27B` | 1,048,575 | $0.45 | $3.2 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.8-Flash` | 1,048,575 | $0.16 | $0.47 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.8-Max-0902` | 262,144 | $1.65 | $4.951 | 聊天 |
| GMI Cloud | `gmi/Qwen/Qwen3.8-Max` | 262,144 | $2 | $6 | 聊天 |
| GMI Cloud | `gmi/XiaomiMiMo/MiMo-V2.5-Pro` | 1,050,000 | $0.3045 | $0.609 | 聊天 |
| GMI Cloud | `gmi/XiaomiMiMo/MiMo-V2.5` | 1,050,000 | $0.119 | $0.238 | 聊天 |
| GMI Cloud | `gmi/XiaomiMiMo/MiMo-V2.6-Flash` | 1,050,000 | $0.112 | $0.224 | 聊天 |
| GMI Cloud | `gmi/XiaomiMiMo/MiMo-V2.6-Pro` | 1,050,000 | $0.348 | $0.696 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-Prover-V2-671B` | 131,072 | $0.5 | $2.18 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-0528` | 131,072 | $0.57 | $2.29 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-Distill-Llama-70B` | 131,072 | $0.25 | $0.75 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-Distill-Llama-8B` | 131,072 | $0.14 | $0.39 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B` | 131,072 | $0.2 | $0.2 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` | 131,072 | $0.5 | $0.9 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` | 131,072 | $0.1 | $0.2 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-R1` | 131,072 | $0.5 | $2.18 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V3.1-Terminus` | 131,072 | $0.27 | $1 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V3.1` | 163,840 | $0.27 | $1 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V3.2-Exp` | 163,840 | $0.27 | $0.41 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V3.2-Speciale` | 163,840 | $0.28 | $0.4 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V4-Flash-0731` | 1,048,576 | $0.286 | $0.858 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V4-Flash` | 1,048,575 | $0.091 | $0.182 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V4-Pro-0813` | 1,048,575 | $1.056 | $3.168 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,575 | $0.18 | $0.72 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/deepseek-v4-flash-vision-exp` | 1,048,575 | $0.44 | $1.32 | 聊天 |
| GMI Cloud | `gmi/deepseek-ai/deepseek-v4.1-flash-1017` | 1,048,575 | $0.18 | $0.72 | 聊天 |
| GMI Cloud | `gmi/gmicloud/Ripple-65B-Preview` | 1,000,000 | $0.2 | $0.6 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.1-flash-lite-preview` | 1,048,576 | $0.25 | $1.5 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.1-pro-preview` | 1,048,576 | $2 | $12 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.5-flash-lite` | 1,048,576 | $0.3 | $2.5 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.5-flash` | 1,048,576 | $1.5 | $9 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.6-flash` | 1,048,576 | $1.5 | $7.5 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.7-flash` | 1,048,576 | $0.75 | $3.75 | 聊天 |
| GMI Cloud | `gmi/google/gemini-3.8-flash` | 1,048,576 | $0.75 | $3.75 | 聊天 |
| GMI Cloud | `gmi/google/gemini-4-argon` | 1,048,576 | $2 | $10 | 聊天 |
| GMI Cloud | `gmi/google/gemma-4-26b-a4b-it` | 256,000 | $0.13 | $0.4 | 聊天 |
| GMI Cloud | `gmi/google/gemma-4-31b-it` | 262,144 | $0.14 | $0.4 | 聊天 |
| GMI Cloud | `gmi/meta-llama/Llama-3.3-70B-Instruct` | 131,072 | $0.25 | $0.75 | 聊天 |
| GMI Cloud | `gmi/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 1,048,576 | $0.25 | $0.8 | 聊天 |
| GMI Cloud | `gmi/meta-llama/Llama-4-Scout-17B-16E-Instruct` | 1,048,576 | $0.08 | $0.5 | 聊天 |
| GMI Cloud | `gmi/moonshotai/Kimi-K2-Instruct-0905` | 262,144 | $0.57 | $2.29 | 聊天 |
| GMI Cloud | `gmi/moonshotai/Kimi-K2.5` | 262,144 | $0.6 | $3 | 聊天 |
| GMI Cloud | `gmi/moonshotai/Kimi-K2.6` | 262,144 | $0.855 | $3.6 | 聊天 |
| GMI Cloud | `gmi/moonshotai/kimi-k2.7-code-highspeed` | 262,144 | $1.9 | $8 | 聊天 |
| GMI Cloud | `gmi/moonshotai/kimi-k2.7-code` | 262,144 | $0.95 | $4 | 聊天 |
| GMI Cloud | `gmi/moonshotai/kimi-k3.1-pro` | 1,048,576 | $2 | $10 | 聊天 |
| GMI Cloud | `gmi/moonshotai/kimi-k3` | 1,048,576 | $3 | $15 | 聊天 |
| GMI Cloud | `gmi/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16` | 65,536 | $0.15 | $1 | 聊天 |
| GMI Cloud | `gmi/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16` | 32,768 | $0.1 | $0.5 | 聊天 |
| GMI Cloud | `gmi/nvidia/nemotron-3-ultra-550b-a55b` | 262,144 | $0.8 | $2.6 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.4-mini` | 409,600 | $0.75 | $4.5 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.4-nano` | 409,600 | $0.2 | $1.25 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.4-pro` | 409,600 | $30 | $180 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.4` | 409,600 | $2.5 | $15 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.5` | 1,050,000 | $5 | $30 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.6-luna` | 1,050,000 | $1 | $6 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.6-sol` | 1,050,000 | $5 | $30 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-5.6-terra` | 1,050,000 | $2.5 | $15 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-6-astra` | 1,050,000 | $10 | $50 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-6-luna` | 1,050,000 | $0.1 | $0.5 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-6-sol` | 1,050,000 | $2 | $10 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-6.1-sol` | 1,050,000 | $2 | $10 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-oss-120b` | 131,072 | $0.05 | $0.25 | 聊天 |
| GMI Cloud | `gmi/openai/gpt-oss-20b` | 131,072 | $0.04 | $0.15 | 聊天 |
| GMI Cloud | `gmi/stepfun-ai/Step-3.7-Flash` | 256,000 | $0.2 | $1.15 | 聊天 |
| GMI Cloud | `gmi/stepfun-ai/Step-5-Preview` | 1,048,576 | $1 | $2.7 | 聊天 |
| GMI Cloud | `gmi/tencent/HunyuanOCR` | 32,768 | $0.5 | $0.5 | 聊天 |
| GMI Cloud | `gmi/tencent/Hy3` | 262,144 | $0.14 | $0.58 | 聊天 |
| GMI Cloud | `gmi/tencent/hy3-preview` | 262,144 | $0.18 | $0.6 | 聊天 |
| GMI Cloud | `gmi/tencent/hy4-preview` | 262,144 | $0.834 | $2.501 | 聊天 |
| GMI Cloud | `gmi/tencent/hy4` | 1,000,000 | $0.417 | $1.2505 | 聊天 |
| GMI Cloud | `gmi/x-ai/grok-4.5` | 2,000,000 | $2 | $6 | 聊天 |
| GMI Cloud | `gmi/xai/grok4.6` | 2,000,000 | $2 | $6 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-4.5-Air-FP8` | 131,076 | $0.2 | $1.1 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-4.5-FP8` | 131,072 | $0.6 | $2.2 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-4.6` | 204,800 | $0.6 | $2 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-4.7-Flash` | 202,752 | $0.07 | $0.4 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-5-FP8` | 202,752 | $0.6 | $1.92 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-5.1-FP8` | 202,752 | $1.4 | $4.4 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-5.2-FP8` | 1,048,576 | $1.4 | $4.4 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-5.3-Flash` | 1,048,576 | $0.075 | $0.25 | 聊天 |
| GMI Cloud | `gmi/zai-org/GLM-5.3` | 1,048,576 | $0.7 | $2.2 | 聊天 |
| Jina AI | `jina-reranker-m0` | 10,240 | $0.05 | $0 | 重新排名 |
| Jina AI | `jina-reranker-v3.5` | 131,072 | $0.05 | $0 | 重新排名 |
| MiniMax | `minimax/minimax-latest` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；為 `minimax/MiniMax-M3` 的別名 |
| Moonshot | `moonshot/kimi-k3.1-pro-highspeed` | 1,048,576 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Moonshot | `moonshot/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `moonshot/kimi-k3` 的別名 |
| Nebius | `nebius/MiniMaxAI/MiniMax-M3.1-Flash` | 1,048,576 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫 |
| Nebius | `nebius/deepseek-ai/DeepSeek-V4.1-Flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫 |
| Nebius | `nebius/meta-models/muse-spark-open` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫 |
| Nebius | `nebius/moonshotai/Kimi-K3.1-Pro` | - | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Nebius | `nebius/nvidia/Nemotron-3.5-Super-VL` | 1,048,576 | $0.3 | $0.9 | 聊天；推理；視覺；工具呼叫 |
| OpenAI | `gpt-6-cyber` | 922,000 | $20 | $100 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用 |
| OpenAI | `gpt-astra-latest` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `gpt-6-astra` 的別名 |
| OpenAI | `gpt-image-2.6-flare` | - | $5 | - | 影像生成；視覺；PDF 輸入 |
| OpenAI | `gpt-image-2.6-sunburst` | - | $5 | - | 影像生成；視覺；PDF 輸入 |
| OpenAI | `gpt-luna-latest` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `gpt-6-luna` 的別名 |
| OpenAI | `gpt-mini-latest` | 272,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；為 `gpt-5.4-mini` 的別名 |
| OpenAI | `gpt-sol-latest` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `gpt-6.1-sol` 的別名 |
| OpenAI | `gpt-terra-latest` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；PDF 輸入；電腦使用；為 `gpt-6.1-terra` 的別名 |
| Parallel AI | `parallel_ai/decision` | 32,000 | $0 | $0 | 評估；每次查詢 $0.001 |
| Perplexity | `perplexity/google/gemini-4-argon` | - | $2 | $10 | 回應 |
| Perplexity | `perplexity/perplexity/nemotron-3.5-super-120b-a12b` | - | $0.2 | $0.5 | 回應 |
| Tencent TokenHub | `tencent/hy4-preview` | 960,000 | $0.834 | $2.501 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Tencent TokenHub | `tencent/hy4` | 960,000 | $0.834 | $2.501 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/deepseek-pro-latest` | 1,048,576 | $1.32 | $3.96 | 聊天；工具呼叫；提示快取；結構化輸出；為 `together_ai/deepseek-ai/DeepSeek-V4-Pro-0813` 的別名 |
| Together AI | `together_ai/essentialai/rnj-1-instruct` | - | $0.15 | $0.15 | 聊天 |
| Together AI | `together_ai/glm-flash-latest` | 1,048,575 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `together_ai/zai-org/GLM-5.3-Flash` 的別名 |
| Together AI | `together_ai/glm-latest` | 1,048,575 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `together_ai/zai-org/GLM-5.3` 的別名 |
| Together AI | `together_ai/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `together_ai/moonshotai/Kimi-K3` 的別名 |
| Together AI | `together_ai/moonshotai/Kimi-K3.1-Pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/qwen-flash-latest` | 1,000,000 | $0.15 | $0.47 | 聊天；為 `together_ai/Qwen/Qwen3.8-Flash` 的別名 |
| Together AI | `together_ai/ricursive-ai/Ripple-65B-Preview` | 131,072 | $0.2 | $0.6 | 聊天；提示快取 |
| Vertex AI | `vertex_ai/claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `vertex_ai/claude-fable-5-1` 的別名 |
| Vertex AI | `vertex_ai/claude-haiku-latest` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `vertex_ai/claude-haiku-5-5` 的別名 |
| Vertex AI | `vertex_ai/claude-opus-latest` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `vertex_ai/claude-opus-5-5` 的別名 |
| Vertex AI | `vertex_ai/claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；為 `vertex_ai/claude-sonnet-5-5` 的別名 |
| Vertex AI | `vertex_ai/gemini-omni-1.2-flash` | 131,072 | $1.5 | $9 | 聊天；推理；視覺 |
| Vertex AI | `vertex_ai/grok-latest` | 524,288 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `vertex_ai/xai/grok-4.7` 的別名 |
| Wally | `wally/deepseek-v4-flash-0731` | 1,048,576 | $0.44 | $1.32 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/deepseek-v4-pro-fast` | 1,048,576 | $1.91 | $3.83 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/deepseek-v4.1-flash-1017` | 1,048,576 | $0.375 | $1.5 | 聊天；推理；工具呼叫；提示快取 |
| Wally | `wally/deepseek-v4.1-flash-f2` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Wally | `wally/deepseek-v4.1-flash-fast` | 1,048,576 | $0.6 | $2.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/deepseek-v4.1-flash` | 1,048,569 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/glm-5.3-fast` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/glm-5.3-flash` | 1,048,567 | $0.272 | $0.65 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/kimi-k3` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Wally | `wally/minimax-m3` | 524,287 | $0.33 | $1.32 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Weights and Biases | `wandb/deepseek-ai/DeepSeek-V4.1-Flash-1017` | 1,049,000 | $0.13 | $0.65 | 聊天；推理；視覺；提示快取 |
| xAI | `xai/grok-latest` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋；為 `xai/grok-4.7` 的別名 |
| Z.AI | `zai/glm-flash-latest` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；為 `zai/glm-5.3-flash` 的別名 |
| Z.AI | `zai/glm-latest` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出；為 `zai/glm-5.3` 的別名 |

</details>

### 新增提供者 {#new-providers}

- 新增 Wally 作為 OpenAI 相容提供者，使 `wally/<model>` 能路由，其價格與限制在成本對應表中，並出現在 Admin UI 的新增模型表單中 - [PR #45662](https://github.com/BerriAI/litellm/pull/45662)

### Decisions providers {#decisions-providers}

- 新增 Parallel AI 網頁根據的 Decisions，使 Parallel Decisions API 能透過 LiteLLM 路由，選項與分數帶有可為 null 的 `confidence` - [PR #49188](https://github.com/BerriAI/litellm/pull/49188)
- 新增 EmpirioLabs AI 作為 Decisions 提供者，使 `empiriolabs/aplomb-1` 在 `/v1/decisions` 與 `/v1/systemone` 上運作，而非以 Unknown Decisions provider 失敗 - [PR #49977](https://github.com/BerriAI/litellm/pull/49977)

### Amazon Bedrock {#amazon-bedrock}

- 將用戶端的 `per-turn-control-2026-07-01` beta 標頭轉送到 Bedrock Invoke，與 Anthropic、Azure 與 Vertex 路由一致 - [PR #43086](https://github.com/BerriAI/litellm/pull/43086)
- 讓 Bedrock 串流中斷的 Nova Sonic 即時工作階段以 `error` 事件失敗，而非以 1000 關閉，使 Logs 頁面顯示失敗，冷卻計數保持準確 - [PR #49170](https://github.com/BerriAI/litellm/pull/49170)
- 當設定了 `response_format` `json_schema` 時，在 Bedrock 上保留 Claude 的 thinking，包含 Opus 5、Sonnet 5 與 Haiku 5.5 的預設 thinking，並在使用量中回報 reasoning token - [PR #49696](https://github.com/BerriAI/litellm/pull/49696)
- 為無法強制工具的 Bedrock Claude 模型（例如 Opus 5.5、Sonnet 5.5 與 Fable 5.1）的 `json_schema` 傳送原生結構化輸出，使回覆停止以圍欄、錯誤的鍵或空白回來 - [PR #49703](https://github.com/BerriAI/litellm/pull/49703)
- 在 DeepSeek V3.2 的提示限制中保留其輸出容量，並為 GovCloud West Llama 3 列新增退役日期 - [PR #49732](https://github.com/BerriAI/litellm/pull/49732)
- 透過新增 `token_count_model`，將別名 Claude Sonnet 4.5 與 Haiku 4.5 Bedrock 列上的 token 計數對應到 bedrock-runtime，使 Count tokens 能在它們上運作 - [PR #49981](https://github.com/BerriAI/litellm/pull/49981)
- 在向 Bedrock Converse 上的 GLM、GPT-6 Luna 或 Nova 2 以及 Bedrock Responses API 上的 GPT-6 Luna 重播歷史時，刪除 Claude 的簽署 thinking（這些曾回應 400） - [PR #50073](https://github.com/BerriAI/litellm/pull/50073)
- 移除 GovCloud Kimi K3 的 `bedrock_mantle` 成本對應表列，因為 AWS 不提供該路由 - [PR #50117](https://github.com/BerriAI/litellm/pull/50117)
- 為 28 個既有的 Bedrock 成本對應表列新增已發佈的 GovCloud 批次、flex、priority 與快取價格 - [PR #50121](https://github.com/BerriAI/litellm/pull/50121)
- 新增 Bedrock 上 Kimi、Haiku 與 Grok 的 GovCloud 價格，以及 Grok 的路由 metadata - [PR #50128](https://github.com/BerriAI/litellm/pull/50128)
- 在每種 thinking 模式下，預設在 Bedrock Opus 5.5、Fable 5.1、Sonnet 5 與 Haiku 5.5 上使用原生結構化輸出，避免較昂貴的 JSON 工具墊片，並以多個 chunk 串流 - [PR #50221](https://github.com/BerriAI/litellm/pull/50221)
- 在每種 thinking 模式下，預設在 Bedrock Opus 5 與 Opus 4.8 上使用 `outputConfig.textFormat` 的原生結構化輸出，而非成本高 1.25 倍到 1.5 倍的 JSON 工具墊片 - [PR #50222](https://github.com/BerriAI/litellm/pull/50222)
- 為 `bedrock/us-gov.xai.grok-4.7` 新增成本對應表列，使 GovCloud Grok 4.7 呼叫有價格與上下文資訊 - [PR #50288](https://github.com/BerriAI/litellm/pull/50288)
- 新增 Bedrock 上 GovCloud Grok 4.7 的已發佈批次費率，使批次呼叫被定價 - [PR #50291](https://github.com/BerriAI/litellm/pull/50291)
- 為 Bedrock Kimi K3.1 Highspeed 新增成本對應表列，價格取自 AWS 現在發佈的價格 - [PR #50451](https://github.com/BerriAI/litellm/pull/50451)
- 將帶有加密內容的 Codex 輔助代理程式訊息完整轉送到 Bedrock GPT，使子代理程式得到其任務，而非再次要求 - [PR #50457](https://github.com/BerriAI/litellm/pull/50457)
- 依每個 AWS 呼叫者推導網頁身分工作階段政策，使 Bedrock 即時、非同步 invoke、Mantle token 計數與 agent-runtime pass-through 在角色允許時停止回傳 403 - [PR #50592](https://github.com/BerriAI/litellm/pull/50592)

### Anthropic {#anthropic}

- 停止將 Anthropic `server_tool_use` 區塊呈現為用戶端 `tool_calls`，使網頁擷取與程式碼執行不再在 `/v1/responses` 上以 `function_call` 回來 - [PR #48385](https://github.com/BerriAI/litellm/pull/48385)
- 同步 `anthropic`、`vertex_ai` 與 `azure_ai` 的 beta 標頭允許清單，使它們接受的 beta（例如任務預算）現在生效，`computer_20251124` chat 呼叫停止回應 400 - [PR #49409](https://github.com/BerriAI/litellm/pull/49409)
- 依每個部署選取 beta 允許清單列，使 Foundry 託管的 `anthropic` 部署停止傳送會回傳 400 的不受支援 beta，並在 chat completions 上呈現 `input_transformations` - [PR #49689](https://github.com/BerriAI/litellm/pull/49689)
- 將 chat 訊息上的 `prompt_cache_breakpoint` 攜帶到 Claude 的 `cache_control`，使 OpenAI 形狀的用戶端得到提示快取，而非被默默丟棄 - [PR #49783](https://github.com/BerriAI/litellm/pull/49783)
- 修復 `get_supported_openai_params`，只為保留它們的 Anthropic 模型列出 `temperature` 與 `top_p`，因為 Opus 4.7 兩者都拒絕 - [PR #50144](https://github.com/BerriAI/litellm/pull/50144)
- 當 json_schema 帶有 `"properties": null` 時，停止串流的 Anthropic 結構化輸出將數字樣的工具引數片段換成 `Infinity` - [PR #50470](https://github.com/BerriAI/litellm/pull/50470)
- 讓 `reasoning_effort: "none"` 在每條路由上停用 `claude-haiku-5-5`、`claude-sonnet-5` 與 `claude-opus-5` 的 thinking，使它們停止思考並為此計費 - [PR #50541](https://github.com/BerriAI/litellm/pull/50541)
- 在 Anthropic 連線錯誤重試時重新整理 WIF bearer token，使在嘗試中途到期的 token 不再造成 401 - [PR #50570](https://github.com/BerriAI/litellm/pull/50570)
- 在強制重新整理時，為 Anthropic WIF 部署再次交換 Google 身分 token，並從 `ANTHROPIC_IDENTITY_TOKEN` 中讀出 `oidc/` 參照，而非將它們作為 token 傳送 - [PR #50583](https://github.com/BerriAI/litellm/pull/50583)

### Azure {#azure}

- 在 `/v1/messages` 上於 Azure OpenAI 主機原生串流 `azure_ai` 模型，修復假串流、沒有工具時的 404，以及僅環境部署上的 500 - [PR #49216](https://github.com/BerriAI/litellm/pull/49216)
- 讓 `azure_ad_token` 不進入 `azure_ai` 的請求 body，使只有 Entra token 的 chat 停止從 Foundry 為 Claude 部署、Cohere embeddings 與透過 `/v1/messages` 的 GPT 回傳 400 - [PR #49769](https://github.com/BerriAI/litellm/pull/49769)
- 為已帶有 `deprecation_date` 的 Ada embedding 列引用 Azure 退役排程 - [PR #50044](https://github.com/BerriAI/litellm/pull/50044)
- 從傳送到 Azure 的 Responses 輸入中去除 reasoning `status`，並在 `drop_params` 之下去除 reasoning `content`（Azure 曾拒絕它們），且不修改呼叫者自己的歷史 - [PR #50046](https://github.com/BerriAI/litellm/pull/50046)
- 依 Azure 已發佈的退役排程，同步三個 Azure 模型項目的退役日期 - [PR #50296](https://github.com/BerriAI/litellm/pull/50296)
- 將 Azure Whisper 退役日期與 Azure 較晚的 ARM 退役日期對齊，並為兩個 Azure TTS 退役日期新增來源連結 - [PR #50430](https://github.com/BerriAI/litellm/pull/50430)
- 新增 `azure_ai/cohere-rerank-v5-pro` 與 `azure_ai/cohere-rerank-v5-fast`，價格取自 Azure 零售價格摘要，每 100 萬個輸入 token 分別為 $0.05 與 $0.02 - [PR #50499](https://github.com/BerriAI/litellm/pull/50499)
- 將 Azure `chat-latest` 別名列的退役日期與來源，與其記錄的別名對齊 - [PR #50509](https://github.com/BerriAI/litellm/pull/50509)
- 為 Azure 上的 `gpt-realtime-2.1`、`gpt-realtime-2.1-mini` 與 `gpt-realtime-1.5` 新增 Data Zone 成本對應表列，使 US Data Zone 呼叫得到價格 - [PR #50519](https://github.com/BerriAI/litellm/pull/50519)

### Gemini and Vertex AI {#gemini-and-vertex-ai}

- 將 Vertex AI Claude 的 Anthropic 上下文溢位錯誤對應到上下文視窗錯誤，使 `context_window_fallbacks` 現在觸發，而非回傳一般的 400 或 500 - [PR #36963](https://github.com/BerriAI/litellm/pull/36963)
- 對不受支援的 Gemini chat 音訊格式回應 400 而非 500，在 `drop_params` 之下丟棄它，並停止忽略在 `speech_config` 內設定的格式 - [PR #49423](https://github.com/BerriAI/litellm/pull/49423)
- 為支援 `continuationToken` 長解碼的模型新增 `supports_continuation` 能力旗標，並在 `/model_group/info` 中保留部署的 `model_info` 覆寫 - [PR #49500](https://github.com/BerriAI/litellm/pull/49500)
- 當 AI Studio 或 Vertex AI 拒絕從另一個後端重播的思考簽章時，以佔位簽章重新傳送一次，而非回傳 400 - [PR #49697](https://github.com/BerriAI/litellm/pull/49697)
- 將 `gemini/gemini-3.5-flash-lite` 批次快取讀取價格降到 1.5e-08，並新增 `gemini/gemini-2.5-pro` 與 `gemini/gemini-2.5-flash` 的關閉日期 - [PR #49871](https://github.com/BerriAI/litellm/pull/49871)
- 從 `vertex_ai/gemini-robotics-er-2-preview` 與 `gemini-robotics-er-2-preview` 移除批次價格與 `/v1/batch` 端點，以符合 Vertex 模型頁面 - [PR #49895](https://github.com/BerriAI/litellm/pull/49895)
- 新增缺失的 Vertex 音訊、長上下文 Flex 與 Priority 影像價格，並移除 Google 只發佈為最早可能日期的六個固定退役日期 - [PR #49964](https://github.com/BerriAI/litellm/pull/49964)
- 將 `gemini/gemini-2.5-pro` 與 `gemini/gemini-2.5-flash` 上的 `successor_model` 指向 Google 現在在其淘汰頁面上指出的替代品 - [PR #50064](https://github.com/BerriAI/litellm/pull/50064)
- 新增 `vertex_ai/gemini-omni-1.2-flash`，帶有其已發佈的 token 價格、更大的輸出限制與僅 Interactions 的能力 - [PR #50227](https://github.com/BerriAI/litellm/pull/50227)
- 新增 Gemini Omni 1.2 Flash 定價，使代理程式呼叫不再以 $0 記錄，將已退役的 Gemini 影片模型指向它，並將 Omni 1.1 輸入限制修正為 131072 - [PR #50229](https://github.com/BerriAI/litellm/pull/50229)
- 當 Vertex AI Gemini 圖片編輯請求沒有圖片時，從 `/v1/images/edits` 回傳 400 而非 500，使用戶端 SDK 停止重試，5xx 警示保持安靜 - [PR #50244](https://github.com/BerriAI/litellm/pull/50244)
- 為 Vertex AI Chirp 文字轉語音遵循 `vertex_location`，使釘在 US 或 EU 區域的部署呼叫該多區域主機，而非全域主機 - [PR #50255](https://github.com/BerriAI/litellm/pull/50255)
- 將 `gemini/gemini-embedding-2-preview` 的關閉日期修正為 2026-11-06，屆時 Google 將它路由到 `gemini-embedding-2` - [PR #50429](https://github.com/BerriAI/litellm/pull/50429)
- 為五個遺漏了 Google 建議替代模型的 Gemini 成本對應表列新增它們 - [PR #50468](https://github.com/BerriAI/litellm/pull/50468)
- 為 `gemini/gemini-2.5-pro` 新增 20 萬個 token 以上的 Flex 快取讀取價格 `cache_read_input_token_cost_above_200k_tokens_flex` - [PR #50480](https://github.com/BerriAI/litellm/pull/50480)
- 為 `gemini/gemini-3.1-pro-preview` 與 customtools 列新增 Flex 20 萬以上快取讀取價格 - [PR #50607](https://github.com/BerriAI/litellm/pull/50607)

### OpenAI {#openai}

- 以 OpenAI 的 10% FedRAMP 加成（1.1 倍乘數）計費對 `gov.api.openai.com` 的請求，它們之前缺少此加成 - [PR #49951](https://github.com/BerriAI/litellm/pull/49951)
- 以 Standard 影像生成價格，將 `gpt-image-2.6-sunburst` 與 `gpt-image-2.6-flare` 加入成本對應表 - [PR #50134](https://github.com/BerriAI/litellm/pull/50134)
- 為 OpenAI 影像列新增已發佈的 Batch 影像輸出價格，使其與 `input_cost_per_image_token_batches` 一致，計費成本不變 - [PR #50138](https://github.com/BerriAI/litellm/pull/50138)
- 在執行 openai 3.x 時，停止為 `api_key` 為空的 `openai/` 部署將 `OPENAI_ADMIN_KEY` 作為 bearer token 傳送 - [PR #50218](https://github.com/BerriAI/litellm/pull/50218)
- 在模型型錄中，為 `gpt-6-cyber` 新增 922000 的 `max_input_tokens`，並為 `gpt-5.5-cyber-preview` 新增 2027-02-01 的 `deprecation_date` - [PR #50254](https://github.com/BerriAI/litellm/pull/50254)

### 其他提供者 {#other-providers}

- 將 `text` 與 `max_output_tokens` 轉送到 ChatGPT Codex 後端，使 `chatgpt/*` 遵循嚴格的 JSON schema、`text.verbosity` 與 `max_tokens`，而非默默忽略 - [PR #38086](https://github.com/BerriAI/litellm/pull/38086)
- 修復 Mistral 丟棄具名函式 `tool_choice` 的問題，使被強制的工具現在到達 Mistral、`codestral` 與 `vertex_ai` 上的 Mistral，而非由模型任選工具 - [PR #39737](https://github.com/BerriAI/litellm/pull/39737)
- 當 vLLM 伺服器沒有 api key 時，在 `/v1/models` 上列出 `hosted_vllm/*` 萬用字元模型，並讀取 chat 呼叫使用的同一個伺服器，而非 `VLLM_API_BASE` - [PR #40066](https://github.com/BerriAI/litellm/pull/40066)
- 在 `hosted_vllm` chat 選項與串流 chunk 上保留 vLLM 的 `stop_reason` 與 `token_ids`，包含過去丟棄它們的串流與快取命中 - [PR #48393](https://github.com/BerriAI/litellm/pull/48393)
- 修復 Databricks `json_object` 請求在最後一則訊息有多個文字部分時以 400 失敗的問題，方法是為非 Claude 模型連接純文字區塊 - [PR #49385](https://github.com/BerriAI/litellm/pull/49385)
- 修復 Cohere v2 非串流 chat 回應，為工具呼叫回傳 `finish_reason` `tool_calls`、為 `MAX_TOKENS` 回傳 `length`，使代理程式迴圈執行工具而非停止 - [PR #49529](https://github.com/BerriAI/litellm/pull/49529)
- 更新 EmpirioLabs 模型列並為 EmpirioLabs 新增 `/v1/embeddings`，使 `embedding(model="empiriolabs/text-embedding-v4")` 到達 OpenAI 相容端點 - [PR #49980](https://github.com/BerriAI/litellm/pull/49980)
- 為七個即將退役的 `together_ai` 列新增 `successor_model`，使用 Together 在其淘汰頁面與變更記錄中指出的替代品 - [PR #50026](https://github.com/BerriAI/litellm/pull/50026)
- 將 `together_ai/moonshotai/Kimi-K3.1-Pro` 加入模型型錄，因為 Together 提供它但它沒有列 - [PR #50069](https://github.com/BerriAI/litellm/pull/50069)
- 將 Databricks 退役繼任者與 `kimi-k2-7` 退役日期加入成本對應表，取自 Databricks 已退役模型頁面 - [PR #50094](https://github.com/BerriAI/litellm/pull/50094)
- 為 Fireworks 上的 Kimi K3.1 Pro 新增無伺服器定價到成本對應表，使其花費被追蹤 - [PR #50095](https://github.com/BerriAI/litellm/pull/50095)
- 修復使用自訂 GitHub 用戶端 ID 的 GitHub Copilot 逐使用者連線（登入後以找不到 Copilot 存取失敗） - [PR #50116](https://github.com/BerriAI/litellm/pull/50116)
- 修復 GitHub Copilot 請求從 `copilot_internal/v2/token` 得到 403 的問題，方法是直接傳送 GitHub token 而非交換它 - [PR #50126](https://github.com/BerriAI/litellm/pull/50126)
- 修復 token 檢查之後的 NVIDIA Riva 403 錯誤，方法是直接透過 gRPC 呼叫 Riva 並只傳送一次 api key，並將請求逾時套用到串流呼叫 - [PR #50140](https://github.com/BerriAI/litellm/pull/50140)
- 在模型型錄中為五個 Mistral 模型新增已發佈的退役日期，使其生命週期可查詢 - [PR #50294](https://github.com/BerriAI/litellm/pull/50294)
- 為 Databricks 上新的 Kimi K3.1 Pro 端點新增 `databricks/databricks-kimi-k3-1-pro` 逐 token 定價 - [PR #50303](https://github.com/BerriAI/litellm/pull/50303)
- 在模型型錄中為 Fireworks 淘汰新增有來源的退役日期與替代模型 - [PR #50334](https://github.com/BerriAI/litellm/pull/50334)
- 將 Weights & Biases `wandb` 價格同步到 CoreWeave Forge Serverless Inference 頁面，並新增 DeepSeek V4.1-Flash-1017 - [PR #50476](https://github.com/BerriAI/litellm/pull/50476)
- 將 Baseten Kimi K3.1 Pro 輸出 token 限制與 Baseten 現在發佈的限制同步 - [PR #50477](https://github.com/BerriAI/litellm/pull/50477)
- 新增 `moonshot/kimi-k3.1-pro-highspeed`，帶有 Moonshot 已發佈的價格：每 100 萬個輸入 token $4、每 100 萬個輸出 token $20 - [PR #50538](https://github.com/BerriAI/litellm/pull/50538)
- 將 Together Qwen3.7-Max 定價更新為目前已發佈的價格，並為 Together Rnj-1 Instruct 新增成本對應表項目 - [PR #50548](https://github.com/BerriAI/litellm/pull/50548)

### 模型型錄與定價 {#model-catalog-and-pricing}

- 在成本對應表中整合已驗證的提供者 metadata 與價格，涵蓋 Databricks、Perplexity Agent API、Vertex AI、DeepInfra、Novita、Nebius 與 Bedrock Opus 5 列 - [PR #49361](https://github.com/BerriAI/litellm/pull/49361)
- 為 Bedrock Mantle GPT-5.4 及後續列與 GovCloud West Mantle 列新增 `search_context_cost_per_query` 與 `supports_web_search`，使 Web Search 在它們上被定價 - [PR #49687](https://github.com/BerriAI/litellm/pull/49687)
- 為裸 `gpt-4o`、`gpt-4o-mini`、`gpt-4.1` 與 `gpt-4.1-mini` 列新增 2027-01-14 關閉日期，使 `/model/deprecations` 回報這些 ID 上的部署 - [PR #49707](https://github.com/BerriAI/litellm/pull/49707)
- 新增 `deepgram/streaming/nova-3-medical`，使 `/deepgram/v1/listen` 停止以 1008 關閉，並提高對照 Deepgram 頁面低估約 37% 的 Nova-3 串流費率 - [PR #49733](https://github.com/BerriAI/litellm/pull/49733)
- 將提供者建議的替代品記錄為淘汰中成本對應表列上的 `successor_model`，並從 `/model/deprecations` 回報 - [PR #49789](https://github.com/BerriAI/litellm/pull/49789)
- 以目前牌價為 Mistral Large 4 定價：每 100 萬個 token 輸入 $0.70、快取 $0.07、輸出 $2.10（從 $1.36、$0.14 與 $4.18 降下），兩個模型名稱皆然 - [PR #49814](https://github.com/BerriAI/litellm/pull/49814)
- 在 Anthropic、Azure、Bedrock 與 Vertex 上，從家族基線填入缺失的 Claude 能力欄位，使模型資訊顯示平行工具呼叫與 system 訊息為受支援 - [PR #49815](https://github.com/BerriAI/litellm/pull/49815)
- 以 `supports_box_questions` 將 `typesafe/jev-latest` 標記為支援 Box 問題，使它們不再在呼叫前被拒絕或丟棄 - [PR #49835](https://github.com/BerriAI/litellm/pull/49835)
- 將 `fedramp_uplift_multiplier` 金鑰加入成本對應表列 schema，使一列能攜帶 FedRAMP 價格加成 - [PR #49950](https://github.com/BerriAI/litellm/pull/49950)
- 為成本對應表列新增可選的 `deprecation_source` 屬性，保存讀取 `deprecation_date` 的提供者頁面或摘要 - [PR #49955](https://github.com/BerriAI/litellm/pull/49955)
- 在每個有已知提供者通知的帶日期成本對應表列上記錄 `deprecation_source`，使 models.litellm.ai 能連結到 `deprecation_date` 的來源頁面 - [PR #49968](https://github.com/BerriAI/litellm/pull/49968)
- 移除提供者在 2026 年之前退役的 52 個成本對應表列，使它們停止在型錄與 models.litellm.ai 上顯示為即時模型 - [PR #49974](https://github.com/BerriAI/litellm/pull/49974)
- 同步 xAI、Fireworks、Azure 與 Gemini 的成本對應表列，包含高估 1.5 倍的 Fireworks Ultramarine 1 Flash US 價格，以及缺失的 DeepSeek V4.1 Flash 1017 Ultra-fast 路由器 - [PR #50028](https://github.com/BerriAI/litellm/pull/50028)
- 將 `gpt-5.6-cyber` 輸入限制修正為 272000 個 token，並將 Azure GPT-6 Flex 定價、Bedrock GovCloud 列與 GMI 列加入成本對應表 - [PR #50082](https://github.com/BerriAI/litellm/pull/50082)
- 將 `baseten/moonshotai/Kimi-K3.1-Pro` 加入成本對應表，帶有價格、100 萬輸入限制，以及函式呼叫與工具選擇支援 - [PR #50093](https://github.com/BerriAI/litellm/pull/50093)
- 將 `together_ai/ricursive-ai/Ripple-65B-Preview` 加入成本對應表，帶有來自 Together 模型 API 的輸入、快取輸入與輸出價格 - [PR #50163](https://github.com/BerriAI/litellm/pull/50163)
- 將 20 萬個 token 以上提示的 Gemini Flex 價格、Live 根據價格、七個 GMI 列與 EmpirioLabs 頁面價格加入成本對應表 - [PR #50208](https://github.com/BerriAI/litellm/pull/50208)
- 為包含 `gpt-6-cyber` 與 Kimi K3.1 Pro 的五個已發佈模型新增成本對應表列，使其花費不再以零記錄，外加三列上的能力旗標 - [PR #50245](https://github.com/BerriAI/litellm/pull/50245)
- 為第一方提供者新增 OpenRouter 風格的 `-latest` 模型別名，使呼叫者不再需要寫死 `gpt-6-luna` 等釘住的名稱 - [PR #50315](https://github.com/BerriAI/litellm/pull/50315)
- 將 OpenAI 淘汰頁面新增為 `o1` 成本對應表列的淘汰來源，與其 `o1-2024-12-17` 兄弟列一致 - [PR #50402](https://github.com/BerriAI/litellm/pull/50402)
- 為 Perplexity `gpt-5.5` 成本對應表列新增已發佈的 272K 個 token 以上快取輸入費率 - [PR #50436](https://github.com/BerriAI/litellm/pull/50436)
- 修復 `azure_ai/jais-30b-chat` 與 `watsonx/core42/jais-13b-chat` 的價格（它們將每 1K token 價格存為逐 token 價格，高估了成本） - [PR #50452](https://github.com/BerriAI/litellm/pull/50452)
- 將 `-latest` 模型別名移入成本對應表，使沒有提供者的裸別名（例如 `gpt-mini-latest`）解析到其擁有者的提供者，而非失敗 - [PR #50491](https://github.com/BerriAI/litellm/pull/50491)
- 讓成本對應表列以 `alias_of` 指向另一個模型，使 `-latest` 名稱不再需要在其目標列上有 `aliases` 項目 - [PR #50512](https://github.com/BerriAI/litellm/pull/50512)
- 修正三個 OpenAI 微調列上的關閉日期，並為 Codestral 2405 列新增關閉日期 - [PR #50529](https://github.com/BerriAI/litellm/pull/50529)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 在每個橋接的 `/v1/responses` 串流事件上傳送 `sequence_number`，包含快取、mock 與防護欄阻擋串流，並停止 `response.output_item.done` 永遠回報 `1` - [PR #44944](https://github.com/BerriAI/litellm/pull/44944)
- 在串流的 `/v1/responses` 上保留 Responses SSE 事件框架，為每個事件命名並在沒有 Chat 的 `[DONE]` 的情況下結束，使具名事件用戶端收到事件 - [PR #47980](https://github.com/BerriAI/litellm/pull/47980)
- 授權並解碼比較請求中使用的回應 ID，使重用的代理程式 ID 不再失敗，比較也遵循與先前回應相同的使用者與團隊擁有權規則 - [PR #49402](https://github.com/BerriAI/litellm/pull/49402)
- 透過將 system 提示保留在 `input` 中，修復 Azure 與 OpenAI `json_object` 請求在 chat 轉 Responses 翻譯後回傳 400 的問題 - [PR #49957](https://github.com/BerriAI/litellm/pull/49957)
- 修復當 `during_call` 防護欄預設開啟時，`POST /v1/responses/compact` 以 `'acompact_responses' is not a valid CallTypes` 回傳 500 的問題 - [PR #50274](https://github.com/BerriAI/litellm/pull/50274)
- 對串流 `/v1/responses` 的 `flex_unavailable` 錯誤回傳 429 而非 500，使伺服器錯誤警示保持安靜，僅 429 的重試邏輯能運作 - [PR #50336](https://github.com/BerriAI/litellm/pull/50336)
- 當串流的 `/v1/responses` 呼叫中途以沒有事件類型的錯誤 chunk 失敗時，將 Bedrock 的錯誤回傳給用戶端，而非閘道崩潰或 `stream closed early` - [PR #50466](https://github.com/BerriAI/litellm/pull/50466)

### Chat Completions {#chat-completions}

- 在 OpenAI 與 Azure 的 chat completions 上接受 OpenAI `allowed_tools` 作為 `tool_choice`，為 Responses 橋接將其攤平，並對會忽略它的提供者保留清楚的 400 - [PR #49043](https://github.com/BerriAI/litellm/pull/49043)
- 在串流 chat completion chunk 上保留 Azure 的 `content_filter_results` 等提供者欄位，還原在 v1.86.0 中對純文字串流 frame 退化的行為 - [PR #49398](https://github.com/BerriAI/litellm/pull/49398)
- 在 OpenAI 路由上以 503 `server_is_overloaded` 回應上游過載，而非一般的 500，並停止 `/v1/completions` 以 `internal_server_error` 類型回傳原始 529 - [PR #49993](https://github.com/BerriAI/litellm/pull/49993)
- 在不讀取 `output_config` 的提供者上，於 `drop_params: true` 之下丟棄僅 Anthropic 的 `output_config`，使 OpenAI chat/completions 停止回傳 400 `Unknown parameter: 'output_config'` - [PR #50542](https://github.com/BerriAI/litellm/pull/50542)
- 在 `litellm.completion` 中接受 `tool_choice={"type": "web_search"}` 而非回傳 400，使 Chat 路由能強制 OpenAI 託管工具 - [PR #50578](https://github.com/BerriAI/litellm/pull/50578)

### Anthropic Messages API {#anthropic-messages-api}

- 在 `/v1/messages` 上將上游 Anthropic 529 回應為 529 `overloaded_error`，而非 500 `api_error`，還原在 v1.100.0 中退化的 pass-through - [PR #46063](https://github.com/BerriAI/litellm/pull/46063)
- 在 `/v1/messages`、閘道與 `/anthropic/` 路由上，為代理程式引發的驗證、模型存取、格式錯誤 JSON 與預算錯誤回傳 Anthropic 錯誤封套 - [PR #48466](https://github.com/BerriAI/litellm/pull/48466)
- 透過 `/v1/messages` 為 `chatgpt/` 模型來回傳輸加密的 reasoning，使下一個工具呼叫回合保留它，包含橋接到 Responses 的 Azure 與 OpenAI 回合 - [PR #49076](https://github.com/BerriAI/litellm/pull/49076)
- 當省略時，將透過 Responses 路由之 Messages 請求的 JSON-schema `strict` 預設為 `true`（與 Chat 一致），同時保留明確的 `true` 或 `false` - [PR #50375](https://github.com/BerriAI/litellm/pull/50375)
- 當 Messages API 路由到設定的 Azure Responses 目標時，保留加密的 thinking 區塊，使 reasoning 在工具續接時被重播 - [PR #50381](https://github.com/BerriAI/litellm/pull/50381)
- 讓逐請求標頭能讓串流選擇加入 `usage.cost`，而不需要全域 `include_cost_in_streaming_usage` 旗標，使只有選定的 `/v1/messages` 串流離開快速路徑 - [PR #50574](https://github.com/BerriAI/litellm/pull/50574)

### 計算 token {#count-tokens}

- 依其主機計費的方式計算 grok-4-1、grok-4.3 與 DeepSeek V4.1 的工具請求，修復因缺失隱藏提示而最多低估 90% 的計數 - [PR #49074](https://github.com/BerriAI/litellm/pull/49074)

### 提示快取 {#prompt-caching}

- 在 `drop_params` 之下，將 `prompt_cache_breakpoint` 修剪為每個 API 接受的範圍，使 OpenAI、Azure OpenAI 與 Mantle chat 停止回應 400，Responses 在 `ttl` 不受支援時保留標記 - [PR #49064](https://github.com/BerriAI/litellm/pull/49064)
- 當設定了 `turn_off_message_logging: true` 時寫入提示快取 pin，使後續請求停止在群組間跳動，並在永遠不提供讀取的部署上支付快取寫入 - [PR #50276](https://github.com/BerriAI/litellm/pull/50276)

### 即時 {#realtime}

- 支援最新的 OpenAI 即時音訊模型（帶有翻譯路由與轉錄串流），依提供者時長與快取 token 計費音訊，並從 beta 即時用戶端接受僅 GA 的 Azure 模型 - [PR #35600](https://github.com/BerriAI/litellm/pull/35600)
- 檢查每個 OpenAI websocket pass-through frame 中的模型，使帶有模型清單的金鑰不再被直接拒絕，已連線的工作階段也被計費 - [PR #48979](https://github.com/BerriAI/litellm/pull/48979)

### 批次與檔案 {#batches-and-files}

- 讓管理員限制代理程式用戶端能為批次工作選取的 S3 bucket，使用戶端無法再使用管理員的 AWS 憑證將批次指向任何 bucket - [PR #47496](https://github.com/BerriAI/litellm/pull/47496)
- 當兩個目標模型共用一個萬用字元部署時，保留受管理檔案 ID 編碼的上傳，並在向量儲存庫檔案清單中顯示受管理 ID - [PR #49420](https://github.com/BerriAI/litellm/pull/49420)

### Pass-through 端點 {#pass-through-endpoints}

- 將 Vertex AI pass-through 請求驗證一次，使有預算的金鑰停止在第一次或第二次呼叫時得到 422 - [PR #48942](https://github.com/BerriAI/litellm/pull/48942)

### 影像、音訊與影片 {#images-audio-and-video}

- 在 `/v1/videos` 上提供 `custom_provider_map` `BaseVideoConfig` 提供者，並對沒有影片支援的內建提供者回傳 400 而非 500 - [PR #49785](https://github.com/BerriAI/litellm/pull/49785)
- 讓轉錄文字不進入 Gemini、Vertex 與其他七個提供者的轉錄錯誤訊息，包含用戶端回應、代理程式記錄與 APM span - [PR #50137](https://github.com/BerriAI/litellm/pull/50137)
- 為常見輸入新增第一級的 OpenRouter 影片請求欄位，帶有提供者對應與圖片輸入的衝突檢查 - [PR #50319](https://github.com/BerriAI/litellm/pull/50319)

### Embeddings 與 rerank {#embeddings-and-rerank}

- 在 HuggingFace embeddings 與同步 Bedrock Cohere embeddings 上遵循呼叫者的 `timeout`（包含 HuggingFace 模型查詢），使緩慢的端點快速失敗 - [PR #48593](https://github.com/BerriAI/litellm/pull/48593)
- 在路由器呼叫前檢查中，依每個輸入計算 embeddings 批次，使清單輸入的 embeddings 呼叫停止記錄失敗的 token 計數，過大的輸入在提供者呼叫前得到 400 - [PR #49851](https://github.com/BerriAI/litellm/pull/49851)

### 一般 {#general}

- 將失敗的代理式後續模型呼叫呈現為錯誤，而非回傳回合要求執行 `litellm_web_search`（用戶端從未傳送的工具）的 200 - [PR #49227](https://github.com/BerriAI/litellm/pull/49227)
- 在 `/interactions` 上轉送 `continuation_token`，使長解碼能恢復，新增 `requires_continuation` 狀態，並接受沒有 `input` 的恢復請求 - [PR #50151](https://github.com/BerriAI/litellm/pull/50151)
- 新增 `total_timeout`，為整個非串流代理程式請求（含重試與退避）設定時長上限，而 `timeout` 只為單一提供者呼叫設上限 - [PR #50496](https://github.com/BerriAI/litellm/pull/50496)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

- 在五個詳細頁面的 Created by 與 Last Updated by 欄位中顯示連結的使用者名稱，而非原始使用者 UUID，使管理員能分辨誰變更了物件 - [PR #47181](https://github.com/BerriAI/litellm/pull/47181)
- 將公開 AI Hub 重建為可搜尋的清單，帶有能在手機上運作的詳細窗格，Agents 與 MCP 分頁永遠顯示，token 數量讀作 8K 或 200K - [PR #49496](https://github.com/BerriAI/litellm/pull/49496)
- 在 shadcn Command 上重建命令面板，使 `Cmd+K` 不再疊在開啟的對話框上、`Ctrl+K` 不再在 macOS 上開啟它，IME 的 Enter 不再開啟金鑰 - [PR #49528](https://github.com/BerriAI/litellm/pull/49528)
- 將 Admin UI 的 Agents 與 Knowledge 頁面上寫死的英文文字移到 i18n 翻譯金鑰上 - [PR #49530](https://github.com/BerriAI/litellm/pull/49530)
- 將 Admin UI 的管理與設定頁面上寫死的英文文字移到 i18n 翻譯金鑰上 - [PR #49546](https://github.com/BerriAI/litellm/pull/49546)
- 在 Admin UI 淺色主題中，以中灰色軌道顯示開關的關閉狀態，使管理員能在設定標籤旁看到控制項 - [PR #49718](https://github.com/BerriAI/litellm/pull/49718)
- 讓管理員在 Invite User 對話框與 Create User 表單中設定可選的自訂使用者 ID，使受邀使用者與 SSO 登入時來自 `GENERIC_USER_ID_ATTRIBUTE` 的 ID 一致 - [PR #49749](https://github.com/BerriAI/litellm/pull/49749)
- 以最新 50 篇文章重新整理隨附的 `litellm/blog_posts.json` 備份，使離線部署不再將三月的文章顯示為最新更新 - [PR #49971](https://github.com/BerriAI/litellm/pull/49971)
- 讓管理員從儀表板的 Add Skill 表單上傳本機技能 ZIP，與 Source URL 選項並列 - [PR #50008](https://github.com/BerriAI/litellm/pull/50008)
- 重新設計儀表板頂欄，讓 Aria 有自己的頁面（知道登入的使用者以回答個人花費問題），並在通知中分開公告、文章與部署設定 - [PR #50009](https://github.com/BerriAI/litellm/pull/50009)
- 讓 Chat 的樣式與儀表板一致，將主題切換移到頂欄，將 Settings 與 Sign out 放在帳號選單中，並讓 New Chat 成為唯一的空白對話項目 - [PR #50034](https://github.com/BerriAI/litellm/pull/50034)
- 在 Admin UI 模型頁面上顯示模型淘汰橫幅，使已淘汰模型無需設定 Slack 警示即可見 - [PR #50080](https://github.com/BerriAI/litellm/pull/50080)
- 將殼層、入口頁面、AI hub 與共用小工具文字移到 i18n 金鑰上，畫面上的英文不變 - [PR #50110](https://github.com/BerriAI/litellm/pull/50110)
- 將 Models、Model Insights 與 Transform Request 頁面文字移到 i18n 金鑰上，畫面上的英文不變 - [PR #50112](https://github.com/BerriAI/litellm/pull/50112)
- 在模型中心顯示每個部署的完整價格，包含快取、長提示、flex、priority、批次與依大小的價格，登入與公開中心皆然 - [PR #50145](https://github.com/BerriAI/litellm/pull/50145)
- 將約 110 個剩餘的 Logs 與 Usage 頁面字串移到 i18n 金鑰上，畫面上的英文不變 - [PR #50146](https://github.com/BerriAI/litellm/pull/50146)
- 將約 150 個剩餘的模型頁面字串移到 i18n 金鑰上，畫面上的英文不變 - [PR #50147](https://github.com/BerriAI/litellm/pull/50147)
- 將剩餘的側邊欄、帳號選單與共用小工具文字移到 i18n 金鑰上，畫面上的英文不變 - [PR #50148](https://github.com/BerriAI/litellm/pull/50148)
- 為技能新增可攜式版本歷史，使更新保留版本標籤與先前的發佈，過時的編輯無法覆寫較新的版本 - [PR #50152](https://github.com/BerriAI/litellm/pull/50152)
- 將公開 AI Hub 重新設計為只有 Model Hub 與 Skills Hub 的型錄，並將舊分頁連結傳送到已清除選取的 Models - [PR #50153](https://github.com/BerriAI/litellm/pull/50153)
- 新增可攜式 Agent Skills Hub API，帶有共用的上傳、匯入與探索，不再相依於 Claude 外掛路由 - [PR #50159](https://github.com/BerriAI/litellm/pull/50159)
- 讓成員提交技能或更新以供審查，帶有私人的管理員審查佇列與提交歷史，使用可攜式 ZIP 上傳與匯入 - [PR #50160](https://github.com/BerriAI/litellm/pull/50160)
- 在警示詳細頁面、收件匣與鈴鐺上，顯示建議替代模型的來源（成本對應表或部署設定），外加提供者淘汰通知連結 - [PR #50162](https://github.com/BerriAI/litellm/pull/50162)
- 在已發佈技能表格中顯示逐技能下載次數，並讓管理員檢視已驗證的下載者歷史，將可攜式、保留版本與 Claude 相容 ZIP 下載一起計算 - [PR #50165](https://github.com/BerriAI/litellm/pull/50165)
- 為受影響的金鑰擁有者與目前團隊管理員新增可選的模型淘汰電子郵件，帶有 30 天與 1 天提醒及建議替代品，在 Logging & Alerts、Email Alerts 之下啟用 - [PR #50172](https://github.com/BerriAI/litellm/pull/50172)
- 讓管理員以獨立託管的 SkillSpector 服務掃描待處理的 Skills Hub 提交，並在核准或拒絕前審查諮詢發現 - [PR #50194](https://github.com/BerriAI/litellm/pull/50194)
- 新增可排序的 Skills Hub 型錄，帶有發佈稽核欄、標籤、人員、日期、掃描結果與下載總計，對型錄讀者（包含公開訪客）可見 - [PR #50195](https://github.com/BerriAI/litellm/pull/50195)
- 為可攜式技能詳細資料新增 Install / Share 動作，提供已驗證的安裝與分享命令，並保留每個收件者的存取檢查 - [PR #50211](https://github.com/BerriAI/litellm/pull/50211)
- 將 Admin UI 中約 120 個剩餘的金鑰、團隊、代理程式與成本字串移到翻譯系統上，使其能被在地化 - [PR #50238](https://github.com/BerriAI/litellm/pull/50238)
- 將 15 個 Admin UI 檔案中約 230 個剩餘的 playground、chat 與合規字串移到翻譯系統上，使其能被在地化 - [PR #50239](https://github.com/BerriAI/litellm/pull/50239)
- 將 Admin UI 中剩餘的 Aria、chat 編寫器與管理小工具文字移到翻譯系統上，使其能被在地化 - [PR #50242](https://github.com/BerriAI/litellm/pull/50242)
- 將 Admin UI 中模型淘汰警示頁面文字移到翻譯系統上，使其能被在地化 - [PR #50271](https://github.com/BerriAI/litellm/pull/50271)
- 在重大與警告橫幅中（淺色與深色模式），將部署健康橫幅圖示置中於其標題上 - [PR #50302](https://github.com/BerriAI/litellm/pull/50302)
- 讓寫入 assistant 訊息的 Admin UI chat 字串保持英文，使模型永遠不會得到被翻譯的文字作為對話歷史 - [PR #50304](https://github.com/BerriAI/litellm/pull/50304)
- 為 Admin UI 帳號選單新增 beta 語言設定，對只翻譯了一部分的文字帶有安全的英文備援 - [PR #50309](https://github.com/BerriAI/litellm/pull/50309)
- 將 Admin UI 中 helpers、zod schema 與備援中約 150 個剩餘的寫死英文字串移到翻譯系統上 - [PR #50312](https://github.com/BerriAI/litellm/pull/50312)
- 讓管理員從 Admin UI 為標籤設定 `tpm_limit` 與 `rpm_limit`，並在 Edit Tag 按鈕中預填預算與限制欄位，使限制能被清除 - [PR #50314](https://github.com/BerriAI/litellm/pull/50314)
- 修復 Health 表格的 Last Check 與 Last Success 排序，以及非美國瀏覽器上重新產生金鑰的 Created 日期，方法是停止將格式化的日期與花費剖析回值 - [PR #50350](https://github.com/BerriAI/litellm/pull/50350)
- 從收合的導覽選取器中移除工作區圖示，在其無障礙標籤與懸停標題中保留目前工作區 - [PR #50369](https://github.com/BerriAI/litellm/pull/50369)
- 透過 i18next 格式化儀表板數字、金額與日期，使非英文瀏覽器上的英文 UI 以美國分隔符號顯示計數（例如 `8,123,456`） - [PR #50443](https://github.com/BerriAI/litellm/pull/50443)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 當沒有傳入 `key` 且工作階段沒有 api key（例如管理 UI 工作階段 token）時，從 `GET /key/info` 回傳 400 而非 500 - [PR #43577](https://github.com/BerriAI/litellm/pull/43577)
- 在 `/user/new` 上驗證自訂 ID，對空白、只有空白字元與含有 NUL 的 ID 回傳 422，並拒絕並行的重複建立，使只建立一位使用者 - [PR #49748](https://github.com/BerriAI/litellm/pull/49748)
- 在 FIPS 模式下以 PBKDF2 雜湊 Admin UI 密碼，因為 FIPS OpenSSL 拒絕 scrypt 且每個密碼寫入都失敗，並記錄 scrypt 列上的登入回傳的 401 - [PR #49874](https://github.com/BerriAI/litellm/pull/49874)
- 讓 `default_team_params` 為每個新團隊附加 `access_group_ids`，並在 Default Team Settings 頁面上顯示 Access Groups 列，帶有更清楚的註記：Models 列只適用於 SSO 自動建立的團隊 - [PR #49908](https://github.com/BerriAI/litellm/pull/49908)
- 新增僅連結的 JWT 對應（永遠不建立虛擬金鑰），並停止依路由篩選既有金鑰選取，使自訂與管理路由被包含 - [PR #49956](https://github.com/BerriAI/litellm/pull/49956)
- 讓團隊管理員在 UI 中編輯團隊服務帳號金鑰上的模型（過去以 Team admins can only change budget fields 拒絕，而 `/key/update` 接受該變更） - [PR #49970](https://github.com/BerriAI/litellm/pull/49970)
- 修復團隊管理員對成員金鑰的第一次保存只傳送金鑰 ID 的問題（它丟棄了預算編輯，卻顯示成功 toast，並讓重新命名看起來已保存） - [PR #50007](https://github.com/BerriAI/litellm/pull/50007)
- 在 Admin UI 中設定逐團隊與逐金鑰的部署權重，顯示已保存的權重，並停止保存團隊時丟棄透過 API 設定的權重 - [PR #50552](https://github.com/BerriAI/litellm/pull/50552)
- 拒絕沒有記錄擁有者的回應 ID，並在相關資源操作中一致地套用範圍設定 - [PR #50600](https://github.com/BerriAI/litellm/pull/50600)

### SSO and SCIM {#sso-and-scim}

- 讓 `/update/sso_settings` 成為真正的 PATCH，並從 UI 只傳送變更的 SSO 欄位，使編輯角色對應不再保存遮罩的祕密並弄壞 SSO 登入 - [PR #49527](https://github.com/BerriAI/litellm/pull/49527)
- 修復在 UI 中編輯一個 SSO 欄位會將 SAML 與其他未見的 SSO 設定設為 null 的問題（它曾讓 SAML 登入回傳 501），並讓空白的已保存祕密不清除舊版環境列祕密 - [PR #49973](https://github.com/BerriAI/litellm/pull/49973)

### 模型管理 {#model-management}

- 將展開的萬用字元 `/model/info` 列定價為其呼叫路由到的模型，使別名與路由群組列顯示呼叫計費的價格 - [PR #49128](https://github.com/BerriAI/litellm/pull/49128)
- 當 Entra 拒絕部署的憑證時，在 chat、Responses 與 Decisions 上回傳 401 而非 500，並停止路由器重試永遠不會成功的請求 - [PR #49863](https://github.com/BerriAI/litellm/pull/49863)
- 當憑證被修補時，保留儲存的 `credential_info` 金鑰，而非在資料庫中丟棄 - [PR #49919](https://github.com/BerriAI/litellm/pull/49919)
- 透過 `model_info.logo_url` 支援自訂模型標誌，顯示在 Model Management 表格、懸停詳細資料與模型詳細資料中（供透過相容閘道路由的模型） - [PR #50371](https://github.com/BerriAI/litellm/pull/50371)
- 讓管理員加入一次 LiteLLM Gateway 提供者並選取 `All LiteLLM Gateway Models (Wildcard)`，以該閘道的 URL 與金鑰探索上游模型，並讓其標誌保持可見 - [PR #50374](https://github.com/BerriAI/litellm/pull/50374)

### 使用量與分析 {#usage-and-analytics}

- 還原 `/user/daily/activity/aggregated` 上的逐使用者花費明細，使 User Usage Spend Per User 不再自 v1.105.0 起顯示沒有資料 - [PR #49464](https://github.com/BerriAI/litellm/pull/49464)
- 在 30 秒後於 Postgres 中取消 `/team/spend/by_user`，使重試停止將緩慢的 `LiteLLM_SpendLogs` 彙總堆到資料庫上，並在請求失敗時於 Spend Per User 卡片上顯示 Failed to load - [PR #49922](https://github.com/BerriAI/litellm/pull/49922)
- 在 30 秒後於 Postgres 中取消 Admin UI 的原始 `LiteLLM_SpendLogs` 讀取，使逾時的頁面不再讓其掃描或彙總在資料庫上繼續執行 - [PR #49965](https://github.com/BerriAI/litellm/pull/49965)
- 在 Admin UI 的 Observability and Alerts 之下新增 Model deprecations 警示，帶有依金鑰堆疊的每日請求，使管理員能看到哪些金鑰仍需要遷移 - [PR #50022](https://github.com/BerriAI/litellm/pull/50022)

### 代理程式設定 {#proxy-configuration}

- 新增 `general_settings.fips_mode` 啟動閘門，使代理程式拒絕在非 FIPS 加密上啟動，取代在非 FIPS OpenSSL 上通過的 MD5 探測 - [PR #48600](https://github.com/BerriAI/litellm/pull/48600)
- 忽略沒有任何設定 API 管理的已儲存 `general_settings` 金鑰，修復自 v1.103.0 起舊 UI 保存遺留的過時 `enforce_user_param` 造成的 Claude Code 401 - [PR #48967](https://github.com/BerriAI/litellm/pull/48967)
- 在設定重新載入期間保留資料庫儲存的一般設定，使儲存的每分鐘 2 次下載上限不再讓第三次下載通過 - [PR #49735](https://github.com/BerriAI/litellm/pull/49735)
- 讓 `general_settings.litellm_license` 中的授權解鎖 `allowed_ips`、`enforced_params` 與 `hide_secrets` 等企業設定，在設定授權無效時讓有效的 `LITELLM_LICENSE` 保持啟用，並修復授權錯誤中的環境拼字錯誤 - [PR #49745](https://github.com/BerriAI/litellm/pull/49745)
- 以代理程式擷取並重新整理的 Cognito bearer token，向遙測收集器驗證計費指標 - [PR #49852](https://github.com/BerriAI/litellm/pull/49852)
- 新增 `MAX_REQUEST_HEADER_SIZE` 與 `--max_request_header_size` 以提高 h11 請求標頭緩衝區，避免閘道加入大型身分標頭時間歇的 HTTP 400 回應 - [PR #49883](https://github.com/BerriAI/litellm/pull/49883)
- 修復 `fips_mode: true` 在預設設定讓 MD5 保持運作的 FIPS 映像上拒絕啟動的問題，方法是 OpenSSL 檢查改為探測 scrypt 而非 MD5 - [PR #50305](https://github.com/BerriAI/litellm/pull/50305)
- 在憑證建立、更新與刪除周圍持有 `DB_RECONCILE_LOCK`，使並行的設定重新載入停止在記憶體中還原它們 - [PR #50551](https://github.com/BerriAI/litellm/pull/50551)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- 為 Codex 提供 Claude、Gemini 與 Bedrock 託管 GPT 模型的準確 `/v1/models` 項目，並只在模型背後的每個部署都有 priority 價格時顯示 Fast 層級 - [PR #49825](https://github.com/BerriAI/litellm/pull/49825)
- 修復 `lite logout`，使其在本機 `token.json` 登入無法檢查 OS keychain 時也能移除，`lite whoami` 不再回報已登入狀態 - [PR #50098](https://github.com/BerriAI/litellm/pull/50098)
- 在 `/v1/models` 上為 Codex 提供其自身版本的模型型錄（從 GitHub 擷取），當 GitHub 無法連線或離線模式開啟時備援到目前行為 - [PR #50318](https://github.com/BerriAI/litellm/pull/50318)

### Terraform {#terraform}

- 將在 Terraform 之外刪除的 `litellm_key` 從狀態中刪除，並將其刪除時的 404 視為已消失，使 `terraform destroy` 不再以 `No keys found` 失敗 - [PR #47877](https://github.com/BerriAI/litellm/pull/47877)
- 修復當 body 帶有標籤自己的 `budget_id` 時 `/tag/update` 回傳 500 的問題（它曾讓來自 Terraform `litellm_tag` 資源的每個有預算標籤更新都失敗） - [PR #50324](https://github.com/BerriAI/litellm/pull/50324)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 在 `tool_permission` pre_call 中檢查傳送到 `/v1/messages` 與 `/v1/responses` 的工具，使拒絕規則現在在 Anthropic 與 Responses 請求工具上觸發 - [PR #41011](https://github.com/BerriAI/litellm/pull/41011)
- 在 Nova Sonic 工作階段上對輸入的文字、工具輸出與語音執行即時防護欄，轉送遮罩的文字，並在兩條即時路徑上遵循金鑰與團隊的防護欄選擇退出 - [PR #49833](https://github.com/BerriAI/litellm/pull/49833)
- 將遮罩防護欄套用到 Claude 的 Bedrock InvokeModel 請求與回覆（與原生 `/v1/messages` 路由一致），使原始卡號不再到達 Bedrock，回覆以遮罩形式回來 - [PR #49947](https://github.com/BerriAI/litellm/pull/49947)
- 在帶有 Zscaler AI Guard 的請求上，只掃描最後一個使用者回合，使 system 提示與舊回合不再觸發阻擋，掃描大小停止隨對話增長 - [PR #50139](https://github.com/BerriAI/litellm/pull/50139)
- 為 OpenAI、Anthropic 與 Gemini API 金鑰新增預建的內容篩選憑證模式，與既有的 AWS、GitHub 與 Slack 模式並列 - [PR #50268](https://github.com/BerriAI/litellm/pull/50268)
- 停止模型層級的 `post_call` 防護欄在每個代理程式回應上執行兩次（它曾讓審核提供者呼叫與延遲加倍，每個防護欄記錄兩次評估） - [PR #50300](https://github.com/BerriAI/litellm/pull/50300)

### 記錄與可觀測性 {#logging-and-observability}

- 當遮蔽開啟時，透過也遮蔽 `provider_specific_fields`，讓 reasoning、引用與搜尋結果不進入儲存的記錄 - [PR #47398](https://github.com/BerriAI/litellm/pull/47398)
- 當 chat completions、文字 completions 與 `/v1/messages` 呼叫被橋接到 Responses API 時，在記錄中保留呼叫者的 `call_type`，而非將它們記錄為 `responses` - [PR #49710](https://github.com/BerriAI/litellm/pull/49710)
- 在代理程式失敗（例如呼叫前防護欄 400）的 Prometheus 失敗指標上保留部署 ID，而非回報 `None` 的 `model_id` - [PR #49717](https://github.com/BerriAI/litellm/pull/49717)
- 修復當沒有列出全代理程式 `otel` 回呼時，團隊或金鑰層級的 OpenTelemetry v2 目的地（例如 New Relic）缺失允許清單中的 `litellm.metadata.*` 請求 metadata - [PR #50373](https://github.com/BerriAI/litellm/pull/50373)
- 在 OTel LLM span 的 `gen_ai.request.model` 與 `gen_ai.response.model` 中指出 auto router 選取的模型，而非路由器名稱 - [PR #50498](https://github.com/BerriAI/litellm/pull/50498)

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 對未定價的回應省略 `x-litellm-response-cost` 標頭，使呼叫者能區分免費模型與沒有價格的模型 - [PR #49467](https://github.com/BerriAI/litellm/pull/49467)
- 透過在記錄物件上攜帶完整的逐呼叫價格項目，停止一次呼叫的自訂價格改寫每個其他請求的 `litellm.model_cost` - [PR #49532](https://github.com/BerriAI/litellm/pull/49532)
- 在外部請求之下將網頁搜尋攔截後續計費一次，使被攔截的 Responses 串流寫入一列成功花費，chat 與 Responses 金鑰花費停止將後續計算兩次 - [PR #49762](https://github.com/BerriAI/litellm/pull/49762)
- 當一列沒有 Batch 快取價格時，以 Standard 快取價格計費 Batch 快取 token，使 `vertex_ai` Gemini Batch 快取音訊不再比 Standard 更貴 - [PR #50062](https://github.com/BerriAI/litellm/pull/50062)
- 為逐呼叫自訂價格保留資料居住地、區域與速度乘數，並在標準記錄負載中顯示計費的逐呼叫項目而非型錄費率 - [PR #50063](https://github.com/BerriAI/litellm/pull/50063)
- 修復在沒有 `prometheus-client` 的 `litellm[proxy]` 安裝上花費提交失敗的問題（在分類帳開啟或關閉時影響金鑰、團隊與使用者） - [PR #50230](https://github.com/BerriAI/litellm/pull/50230)
- 當防護欄拒絕回應時，保留原生 Responses 串流的花費，而非記錄沒有花費紀錄的失敗 - [PR #50286](https://github.com/BerriAI/litellm/pull/50286)
- 依計費的 `usage.cost_in_usd_ticks` 計費 xAI 圖片呼叫，並為 `grok-imagine-image-2.0` 新增 1K 與 2K 解析度價格，使 2K 生成停止以 1K 價格記錄 - [PR #50481](https://github.com/BerriAI/litellm/pull/50481)
- 在為 xAI 圖片呼叫計費時遵循部署的 `input_cost_per_pixel`，而非讓計費 ticks 或解析度價格覆寫它 - [PR #50490](https://github.com/BerriAI/litellm/pull/50490)

### 花費記錄與每日彙總 {#spend-logs-and-daily-rollups}

- 在分頁工作階段時只讀取最新的列，使每個工作階段頁面不再將整個日期視窗分組兩次，狀態篩選停止重新計算結果 - [PR #48886](https://github.com/BerriAI/litellm/pull/48886)
- 為 `store_prompts_in_spend_logs` 新增可選的 `latest_turn` 模式，只儲存無狀態請求的目前回合，使花費記錄儲存停止以回合數的平方增長 - [PR #49544](https://github.com/BerriAI/litellm/pull/49544)
- 在失敗的音訊、轉錄、審核、影像生成與 rerank 花費列上記錄每個端點自己的呼叫類型，而非空白值或在 429 等拒絕上的 `IGNORE_THIS` - [PR #49684](https://github.com/BerriAI/litellm/pull/49684)
- 移除未使用的實驗會計事件設定及其產生的 API 型別，並以 SpendLogs 投影取代擷取鷹架 - [PR #49843](https://github.com/BerriAI/litellm/pull/49843)
- 新增可選的 SpendLogs 分類帳，使彙總總計在花費佇列之間保持同步，會計不再相依於本機請求記錄是否存在 - [PR #49856](https://github.com/BerriAI/litellm/pull/49856)
- 預設透過 `LiteLLM_SpendLogDelivery` 分類帳收取花費，並修復無法解碼的傳遞阻擋後續收取、與團隊名冊變更和模型重新命名的死結，以及記錄關閉時完整列被排入佇列的問題 - [PR #49872](https://github.com/BerriAI/litellm/pull/49872)
- 讓管理員依金鑰或依團隊關閉花費記錄中的提示儲存，而非只能全域關閉 - [PR #50135](https://github.com/BerriAI/litellm/pull/50135)
- 停止使用量路由在資料庫於金鑰、使用者、防護欄、團隊、組織、客戶或代理程式詳細查詢期間中斷時回傳 500 - [PR #50253](https://github.com/BerriAI/litellm/pull/50253)
- 停止花費刷新為指標掃描每個保留的傳遞收據，並停止儲存與延遲警示在每次刷新時重新觸發 - [PR #50565](https://github.com/BerriAI/litellm/pull/50565)

### 預算 {#budgets}

- 當快取的金鑰或團隊在請求結束前到期時，收取預算視窗，使金鑰與團隊不再在長請求上超出其上限 - [PR #47608](https://github.com/BerriAI/litellm/pull/47608)
- 讓管理員在標籤的預算視窗結束前，透過 `/tag/update` 重設標籤的花費，使被預算阻擋的標籤能解除阻擋 - [PR #50323](https://github.com/BerriAI/litellm/pull/50323)
- 在 Admin UI 中以 UTC 標示每個預算重設時間，使美國檢視者不再看到提早一天的每月視窗 - [PR #50591](https://github.com/BerriAI/litellm/pull/50591)

### 速率限制 {#rate-limiting}

- 在 TPM 呼叫前檢查中，將 embeddings 圖片與音訊 data URI 估計為媒體，使 token 限制之下的圖片 embeddings 停止回傳 429 - [PR #49831](https://github.com/BerriAI/litellm/pull/49831)

## MCP 閘道 {#mcp-gateway}

### 驗證與 OAuth {#auth-and-oauth}

- 在 MCP 路由上回應裸 `OPTIONS` 請求而不執行 LiteLLM 驗證，使用 `OPTIONS` 探測的用戶端停止得到 401 並在重新驗證上循環 - [PR #49497](https://github.com/BerriAI/litellm/pull/49497)
- 以 FIPS 提供者的 KBKDF 推導 MCP 工作階段登入與橋接 token 簽署金鑰，使 `fips_mode` 不再因 FIPS OpenSSL 3 拒絕 scrypt 而讓它們回傳 500 - [PR #50032](https://github.com/BerriAI/litellm/pull/50032)

### 速率限制與防護欄 {#rate-limits-and-guardrails}

- 為防護欄新增 `mcp_block_behavior`，使 MCP 工具阻擋回傳 HTTP 400 而非 200，讓檢查狀態碼的用戶端看到阻擋 - [PR #50284](https://github.com/BerriAI/litellm/pull/50284)

### 通訊協定與型錄 {#protocol-and-catalog}

- 新增可選的逐伺服器設定以略過 MCP 工具輸出驗證，使無狀態工具呼叫停止重新下載上游的整個工具清單 - [PR #49961](https://github.com/BerriAI/litellm/pull/49961)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

### Auto Router 與模型路由 {#auto-router-and-model-routing}

- 在部署的 `least-busy` 選取被選中後立即保留它，使並行請求的爆發分散到各部署，而非堆到一個上 - [PR #47484](https://github.com/BerriAI/litellm/pull/47484)
- 將上下文備援優先順序限定在請求的群組，使上下文錯誤在沒有上下文規則符合時推進有序部署，不相關的上下文規則停止停用一般復原 - [PR #49779](https://github.com/BerriAI/litellm/pull/49779)
- 修復加權容錯移轉，使每個端點在失敗後於群組內重新選取，且帶有自己 `api_key` 或 `api_base` 的請求不再重新選取失敗的部署 - [PR #49941](https://github.com/BerriAI/litellm/pull/49941)
- 讓部署的 `max_input_tokens` 覆寫不進入共用的後端成本對應表金鑰，使同一模型的普通部署停止顯示兄弟部署的 token 限制 - [PR #49952](https://github.com/BerriAI/litellm/pull/49952)
- 刪除 Python 路由器核心，使 `Router` 永遠在 Rust 核心上執行，並移除路由器推出規則與路由器的 `LITELLM_RUST` 選擇 - [PR #50178](https://github.com/BerriAI/litellm/pull/50178)
- 在串流中途續接檢查中遵循請求自己的 `fallbacks`，使帶有自己 `messages` 的請求備援不再被接上舊前綴 - [PR #50260](https://github.com/BerriAI/litellm/pull/50260)
- 停止回應 ID 查詢的 404 將部署置入冷卻，使缺失的回應不再讓健康的部署停止服務 - [PR #50262](https://github.com/BerriAI/litellm/pull/50262)
- 在備援跳躍上保留請求的 metadata，使 Prometheus 備援計數器保留呼叫者的金鑰與團隊標籤，而非 `None` - [PR #50263](https://github.com/BerriAI/litellm/pull/50263)
- 修復團隊金鑰要求裸模型名稱（例如 `gpt-4o-mini`）時，當團隊只有 `openai/*` 等提供者萬用字元時得到 400 的問題 - [PR #50264](https://github.com/BerriAI/litellm/pull/50264)
- 透過路由器的 Redis 快取共用優先順序排程器佇列，使優先順序在設定了 Redis 時於 worker 與執行個體之間保持 - [PR #50265](https://github.com/BerriAI/litellm/pull/50265)
- 當請求使用 Anthropic `web_search_*` 或 Gemini `googleSearch` 與 `google_search` 工具時（不只是 OpenAI 網頁搜尋類型），丟棄 `supports_web_search: false` 的部署 - [PR #50275](https://github.com/BerriAI/litellm/pull/50275)
- 新增 Switchyard 階段路由器作為 auto router 策略，讀取工具結果以判斷代理程式回合何時困難，使簡單回合停止支付前沿價格，並在 Add Auto Router 表單中預先列出每個策略 - [PR #50407](https://github.com/BerriAI/litellm/pull/50407)
- 在代理程式處將重試與備援跳躍計入 `allowed_fails`、冷卻與 rpm，使持續回傳 429 的部署像透過 Router SDK 一樣冷卻 - [PR #50445](https://github.com/BerriAI/litellm/pull/50445)
- 立即釋放被取消或重試之請求的 ITPM/OTPM 保留與 least-busy 進行中計數，並停止將一個保留退款兩次 - [PR #50486](https://github.com/BerriAI/litellm/pull/50486)
- 透過在回呼篩選步驟中略過未使用的部署讀取，並在 Rust `/v1/messages` 路由上快取 Anthropic 能力查詢，減少逐請求路由器 CPU - [PR #50641](https://github.com/BerriAI/litellm/pull/50641)
- 在串流中途續接檢查中遵循請求自己的 `fallbacks`，使帶來自己訊息的備援不再被接到被切斷的串流上 - [PR #50798](https://github.com/BerriAI/litellm/pull/50798)
- 修復路由器讀取與其他執行緒上的部署 upsert 競態的問題（它曾在移除後以 `IndexError` 讓請求失敗，或回傳相鄰模型的部署） - [PR #50933](https://github.com/BerriAI/litellm/pull/50933)
- 修復路由器讀取與其他執行緒上的部署 upsert 競態的問題（它曾在提供者已回答後以 `IndexError: list index out of range` 讓請求失敗） - [PR #50993](https://github.com/BerriAI/litellm/pull/50993)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 將原生 AWS、GCP 與 Azure 憑證載入與到期與 Python SDK 對齊，使快取的 AWS 憑證準時到期，假設的角色停止在每個請求上呼叫 STS - [PR #49589](https://github.com/BerriAI/litellm/pull/49589)
- 為 Rust 閘道新增 `gateway-forward` 反向代理程式，將 HTTP 與 WebSocket 請求轉送到 Python 代理程式，並接受帶有 100 個以上標頭的回應 - [PR #49604](https://github.com/BerriAI/litellm/pull/49604)
- 在 SSO 設定中延後可選的 Prisma 匯入，使代理程式在沒有資料庫附加元件的安裝上啟動 - [PR #49771](https://github.com/BerriAI/litellm/pull/49771)
- 刪除未使用的 `LiteLLM_AccountingEvent` 與 `LiteLLM_AccountingDelivery` 表格，並修復 SpendLogs 傳遞 ID 預設值的 Prisma 漂移報告 - [PR #49923](https://github.com/BerriAI/litellm/pull/49923)
- 移除實驗的 Redis 快取堆疊與 V2 快取 API，包含 V2 快取匯入與原生記憶體和 Redis 快取控制代碼 - [PR #50005](https://github.com/BerriAI/litellm/pull/50005)
- 停止快取與重播沒有輸出的回覆，使 `/v1/messages` 與 `/v1/chat/completions` 上的空白 Gemini 回覆不再提供給每個重複請求 - [PR #50057](https://github.com/BerriAI/litellm/pull/50057)
- 將 Postgres 重新啟動與關閉錯誤（`57P03`）視為資料庫不可用，使花費記錄、使用量彙總與工具探索列被保留，有效金鑰不再得到 401 - [PR #50132](https://github.com/BerriAI/litellm/pull/50132)
- 以 Rust 儲存為代理程式的常見 Redis 呼叫提供服務，而非為每個 Redis 家族提供獨立的 redis-py 路徑 - [PR #50170](https://github.com/BerriAI/litellm/pull/50170)
- 在請求結束時釋放每個請求的 Redis 批次範圍，停止每個請求約 40 KiB 的 worker 記憶體增長，以及隨後在使用 Redis 的代理程式上發生的變慢與 pod 逐出 - [PR #50751](https://github.com/BerriAI/litellm/pull/50751)
- 在請求結束時釋放每個請求的 Redis 批次範圍，停止每個請求約 40 KiB 的 worker 記憶體增長，以及隨後在使用 Redis 的代理程式上發生的變慢與 pod 逐出 - [PR #50949](https://github.com/BerriAI/litellm/pull/50949)

### Docker 與 Helm {#docker-and-helm}

- 建置 `litellm-proxy` 閘道平台 wheel 並烘入 Docker 映像，而 `litellm[proxy]` 對 pip 使用者保持不變 - [PR #49605](https://github.com/BerriAI/litellm/pull/49605)

### 相依性更新 {#dependency-updates}

- 允許 `huggingface-hub` 2.x，使 LiteLLM 能安裝在需要它的套件旁邊，並從 hub 2.1 起使用 Xet 進行 hub 檔案下載 - [PR #49056](https://github.com/BerriAI/litellm/pull/49056)
- 將 `oauthlib` 升級到 4.0.1，並依 Python 版本釘住 `filelock` 以清除紅色的 osv-scan - [PR #49204](https://github.com/BerriAI/litellm/pull/49204)
- 在 VS Code 擴充功能中將 `@azure/msal-node` 升級到 7.x，使 OSV 掃描在抑制到期後保持綠色 - [PR #50198](https://github.com/BerriAI/litellm/pull/50198)

## 文件更新 {#documentation-updates}

- 記錄更新 PR 摘要的代理程式保留作者已審查的措辭，並且只在新寫的文字上保留草稿標籤 - [PR #49803](https://github.com/BerriAI/litellm/pull/49803)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

- 清理代理程式驗證讀取、ChatGPT 憑證轉送、messages drop_params 讀取與花費記錄讀取中的技術債 - [PR #46643](https://github.com/BerriAI/litellm/pull/46643)
- 在套件之間共用程式設計 CLI e2e 框架，使 Codex 套件能重用 Claude Code 輔助函式 - [PR #49370](https://github.com/BerriAI/litellm/pull/49370)
- 新增 e2e 套件，透過 LiteLLM 執行 Codex CLI 並在五個部署上檢查命令來回 - [PR #49374](https://github.com/BerriAI/litellm/pull/49374)
- 新增 Codex e2e 測試，涵蓋透過 LiteLLM 在五個部署上的檔案編輯、長工作階段與自動壓縮 - [PR #49386](https://github.com/BerriAI/litellm/pull/49386)
- 將 MCP Servers、MCP OAuth 回呼與共用 MCP 選取器文字移到 i18n 金鑰上 - [PR #49473](https://github.com/BerriAI/litellm/pull/49473)
- 將 Teams、Users 與 Organizations 頁面文字移到 i18n 金鑰上 - [PR #49484](https://github.com/BerriAI/litellm/pull/49484)
- 新增 Rust 路由器核心及其 PythonHost 橋接，宿主呼叫是唯一的邊界 - [PR #49513](https://github.com/BerriAI/litellm/pull/49513)
- 將陌生人批次授權整合測試與批次成本輪詢器隔離在私有代理程式上 - [PR #49522](https://github.com/BerriAI/litellm/pull/49522)
- 將 Guardrails 頁面文字與花園型錄移到 i18n 金鑰上 - [PR #49524](https://github.com/BerriAI/litellm/pull/49524)
- 修復四個間歇失敗且沒有產品程式碼原因的整合測試 - [PR #49554](https://github.com/BerriAI/litellm/pull/49554)
- 新增 Rust 與 Python `/v1/messages` 對等特徵測試套件 - [PR #49610](https://github.com/BerriAI/litellm/pull/49610)
- 讓 Rust `/v1/messages` 路徑在 Rust 提供呼叫之處複製 Python 行為 - [PR #49611](https://github.com/BerriAI/litellm/pull/49611)
- 在模型型錄中宣告工具與 Responses token 計數框架金鑰，使成本對應表防護停止失敗 - [PR #49683](https://github.com/BerriAI/litellm/pull/49683)
- 修復過時的整合合約夾具，使排程執行到達其剩餘的斷言 - [PR #49700](https://github.com/BerriAI/litellm/pull/49700)
- 對齊剩餘的發佈資格整合檢查，並讓離線建置解析快取的相依性 - [PR #49714](https://github.com/BerriAI/litellm/pull/49714)
- 在整合測試中修復代理程式詳細讀取與大量刪除設定 - [PR #49719](https://github.com/BerriAI/litellm/pull/49719)
- 在模型型錄中宣告 `thinking_on_by_default` 金鑰，使成本對應表防護停止失敗 - [PR #49720](https://github.com/BerriAI/litellm/pull/49720)
- 移除祕密已失效的 `weekly_load_anomaly.yml` 與 `deploy-dev-on-main.yml` 工作流程 - [PR #49722](https://github.com/BerriAI/litellm/pull/49722)
- 在 Gemini 串流測試中對內容 chunk 上的 Vertex 清單進行斷言 - [PR #49734](https://github.com/BerriAI/litellm/pull/49734)
- 修復發佈資格測試的時間與部署標籤檢查 - [PR #49737](https://github.com/BerriAI/litellm/pull/49737)
- 在提供者整合測試中，依面向用戶端的 ID 查詢串流 Responses 花費列 - [PR #49752](https://github.com/BerriAI/litellm/pull/49752)
- 從校準的啟動時間為代理程式重啟整合測試編列預算，以停止 180 秒逾時 - [PR #49761](https://github.com/BerriAI/litellm/pull/49761)
- 還原跨提供者與 UI 的 main E2E 資格，並為角色身分檢查使用區域 STS 端點 - [PR #49763](https://github.com/BerriAI/litellm/pull/49763)
- 在模型型錄中讀取 `successor_model`，使 `check-registry` 在淘汰列上接受它 - [PR #49791](https://github.com/BerriAI/litellm/pull/49791)
- 在拒絕強制工具之模型的 Bedrock 測試中，斷言原生結構化輸出 - [PR #49799](https://github.com/BerriAI/litellm/pull/49799)
- 在花費測試中，對損壞的 Messages 串流預期 Anthropic 預算封套 - [PR #49800](https://github.com/BerriAI/litellm/pull/49800)
- 新增 Codex e2e 測試，在第一個與恢復的回合呼叫本機 MCP 工具 - [PR #49817](https://github.com/BerriAI/litellm/pull/49817)
- 還原 PR #49763 的 AWS STS 身分檢查變更，它只處理了測試基礎設施問題 - [PR #49939](https://github.com/BerriAI/litellm/pull/49939)
- 保留 MCP 進度測試的上游通知確認直到分發，以停止 main 上的隨機失敗 - [PR #49967](https://github.com/BerriAI/litellm/pull/49967)
- 退役 e2e quiet_stack 鎖並將 claude_code 模型註冊分批，以減少閒置 worker 時間 - [PR #49984](https://github.com/BerriAI/litellm/pull/49984)
- 透過為負載與 kwargs 加型別，清除 303 個檔案中約 1,100 個 basedpyright Any 錯誤 - [PR #49986](https://github.com/BerriAI/litellm/pull/49986)
- 在進入 rc 分支的 PR 上執行 OSV 相依性掃描 - [PR #49987](https://github.com/BerriAI/litellm/pull/49987)
- 將 Playground、Chat 與 Moyai 頁面文字移到 i18n 上，顯示的英文不變 - [PR #49991](https://github.com/BerriAI/litellm/pull/49991)
- 將 Logs、Usage 與 Telemetry 頁面文字移到 i18n 上，顯示的英文不變 - [PR #49992](https://github.com/BerriAI/litellm/pull/49992)
- 將 Keys、Projects、Cost 與 Budgets 頁面文字移到 i18n 上，顯示的英文不變 - [PR #49994](https://github.com/BerriAI/litellm/pull/49994)
- 為工作階段頁面的 EXPLAIN 測試替身提供 `read_db` 交易，使排程整合執行再次通過 - [PR #49996](https://github.com/BerriAI/litellm/pull/49996)
- 讓背景狀態輪詢器不進入 Responses 取消線路測試，使它停止看到額外的狀態 GET - [PR #50002](https://github.com/BerriAI/litellm/pull/50002)
- 在 baggage 標籤對應編輯器佔位文字與測試中使用中性的範例名稱 `service` 與 `app:` - [PR #50011](https://github.com/BerriAI/litellm/pull/50011)
- 輪詢快取的 JWT 拒絕哨兵而非單一 Redis 讀取，以修復不穩定的整合測試 - [PR #50014](https://github.com/BerriAI/litellm/pull/50014)
- 移除已退役的 `database_upgrade_5rps` e2e 案例及其框架測試 - [PR #50076](https://github.com/BerriAI/litellm/pull/50076)
- 在進入 `stable/**`、`rc/**` 與 `lts/**` 分支的 PR 上執行 OSV 掃描與單元測試 - [PR #50086](https://github.com/BerriAI/litellm/pull/50086)
- 在整個中斷期間為可觀測性中斷測試的 sink 連接埠保留，使不相關的監聽器無法弄壞它 - [PR #50100](https://github.com/BerriAI/litellm/pull/50100)
- 讓三個不穩定的單元測試具確定性，使時鐘時間不再在 main 上讓它們失敗 - [PR #50114](https://github.com/BerriAI/litellm/pull/50114)
- 刪除一個技能封存拒絕測試，其 zip 位元組參數化 ID 在 xdist worker 之間不同 - [PR #50118](https://github.com/BerriAI/litellm/pull/50118)
- 停止 db-and-spend 單元分片上的完整歷史複製，並依 sha 擷取 schema 合併基底 - [PR #50120](https://github.com/BerriAI/litellm/pull/50120)
- 在 Anthropic 工具搜尋結果矩陣測試中，對上游 529 預期 503 `server_is_overloaded` - [PR #50154](https://github.com/BerriAI/litellm/pull/50154)
- 在提示快取 pin TTL 測試中，對過載的第一個回合預期 503 `server_is_overloaded` - [PR #50155](https://github.com/BerriAI/litellm/pull/50155)
- 在 responses 橋接快取控制測試中，對上游過載預期 503 `server_is_overloaded` - [PR #50166](https://github.com/BerriAI/litellm/pull/50166)
- 新增 Rust Redis 基礎（沒有執行階段變更），包含訂閱確認逾時 - [PR #50169](https://github.com/BerriAI/litellm/pull/50169)
- 在 Sonnet 5 的 Bedrock chat 翻譯測試中預期 thinking 使用量欄位 - [PR #50175](https://github.com/BerriAI/litellm/pull/50175)
- 在 Sonnet 5 的 Bedrock messages 翻譯測試中預期 thinking 使用量欄位 - [PR #50179](https://github.com/BerriAI/litellm/pull/50179)
- 在 Sonnet 5 的 Bedrock responses 翻譯測試中預期 thinking 使用量欄位 - [PR #50181](https://github.com/BerriAI/litellm/pull/50181)
- 從 PR 範本的手寫描述中刪除 make-me-human-readable 標籤 - [PR #50183](https://github.com/BerriAI/litellm/pull/50183)
- 刪除 Bedrock 工具轉換中多餘的 `$defs` 深層複製 - [PR #50240](https://github.com/BerriAI/litellm/pull/50240)
- 將 JSON schema 輔助函式從 `common_utils` 移到 `json_schema_utils` - [PR #50241](https://github.com/BerriAI/litellm/pull/50241)
- 更新每日活動整合測試，預期逐使用者實體花費列以及電子郵件與別名 metadata - [PR #50251](https://github.com/BerriAI/litellm/pull/50251)
- 更新 Claude Code 外掛偏好測試，涵蓋無版本更新的修補升級與衝突寫入的 409 - [PR #50252](https://github.com/BerriAI/litellm/pull/50252)
- 在 PR 範本證明區段中要求可重複執行的設定與收合的長輸出 - [PR #50258](https://github.com/BerriAI/litellm/pull/50258)
- 將路由器線路測試與 `include_fallback_errors` 的嚴格 `is True` 檢查對齊 - [PR #50259](https://github.com/BerriAI/litellm/pull/50259)
- 在託管 vLLM 串流停滯線路測試中，預期主要串流的停滯冷卻其部署 - [PR #50261](https://github.com/BerriAI/litellm/pull/50261)
- 讓型別檢查器看到真正的 `Router` 建構子引數，使 `make check` 停止在有效呼叫上失敗 - [PR #50278](https://github.com/BerriAI/litellm/pull/50278)
- 將 Copilot 登入防護測試夾具與直接存取 token 對齊，而非已移除的 token 交換 - [PR #50285](https://github.com/BerriAI/litellm/pull/50285)
- 透過路由器核心的植入時鐘讀取存取視窗、預設備援與選取時間 - [PR #50295](https://github.com/BerriAI/litellm/pull/50295)
- 在 Copilot 線路測試夾具中植入直接存取 token，而非過時的交換憑證 - [PR #50307](https://github.com/BerriAI/litellm/pull/50307)
- 現在 JSON 工具已退役，在測試中對 Bedrock Opus 4.8 設定檔預期原生輸出 - [PR #50343](https://github.com/BerriAI/litellm/pull/50343)
- 在 Bedrock Mantle 測試中，對固定取樣的 Claude 預期針對 temperature 的一般不受支援參數 400 - [PR #50344](https://github.com/BerriAI/litellm/pull/50344)
- 在瀏覽器整合測試中，等待已保存的 MCP 憑證後再刪除伺服器 - [PR #50366](https://github.com/BerriAI/litellm/pull/50366)
- 將最舊支援 Python 的 osv-scan 抑制保留到 2027-02-01，使到期的項目停止讓掃描變紅 - [PR #50386](https://github.com/BerriAI/litellm/pull/50386)
- 在測試套件列中同步 gpt-6-astra、gpt-6-luna 與 gpt-6.1-sol 的 Azure GPT flex 價格欄位 - [PR #50410](https://github.com/BerriAI/litellm/pull/50410)
- 讓 Rust 路由器事件可序列化，使宿主能以 JSON 記錄或轉送它們，而非剖析 Debug 文字 - [PR #50416](https://github.com/BerriAI/litellm/pull/50416)
- 修復保留 TTL 的 token 增量測試，驅動原生計數器增量而非私有屬性 - [PR #50418](https://github.com/BerriAI/litellm/pull/50418)
- 從代理程式寫作規則中移除段落結尾句號限制 - [PR #50419](https://github.com/BerriAI/litellm/pull/50419)
- 將 litellm 升級到 1.110.0、litellm-enterprise 升級到 0.1.83、litellm-proxy-extras 升級到 0.4.114 - [PR #50437](https://github.com/BerriAI/litellm/pull/50437)
- 更新五個 UI e2e 規格以跟隨 Aria 側邊欄移動與 Skills Hub 重新命名，使排程的 litellm-e2e 變綠 - [PR #50453](https://github.com/BerriAI/litellm/pull/50453)
- 在 `RedisCache` 與 Rust Redis 儲存之間共用一個斷路器，使卡住的 Redis 停止讓 `reset_spend` 停滯 - [PR #50473](https://github.com/BerriAI/litellm/pull/50473)
- 更新路由測試，預期 `/v1/responses` 將提供的部署 pin 一小時 - [PR #50474](https://github.com/BerriAI/litellm/pull/50474)
- 新增 Codex e2e 列，其中子代理程式必須讀取其父代理程式交給它的任務 - [PR #50494](https://github.com/BerriAI/litellm/pull/50494)
- 將每個惰性 `litellm` 屬性宣告一次，並透過單一函式解析全部 - [PR #50523](https://github.com/BerriAI/litellm/pull/50523)
- 以 `getattr` 讀取惰性屬性，而非一次性的 TypedDict 包裝 - [PR #50543](https://github.com/BerriAI/litellm/pull/50543)
- 從 `test_key_generate_prisma.py` 刪除 28 個從未在任何地方執行的已略過死測試 - [PR #50550](https://github.com/BerriAI/litellm/pull/50550)
- 將儀表板 JSX 中 283 個寫死的英文字串移到 i18n 上 - [PR #50575](https://github.com/BerriAI/litellm/pull/50575)
- 更新兩個 messages 翻譯測試，預期 Azure 與 Bedrock Mantle 上被遮蔽的 thinking 區塊 - [PR #50576](https://github.com/BerriAI/litellm/pull/50576)
- 在遮罩測試中比對完整的卡號，而非時間戳可能包含的 4111 子字串 - [PR #50612](https://github.com/BerriAI/litellm/pull/50612)
- 讓整合測試中的保留陳述式中繼跟隨快取的預備陳述式，使設定重新載入測試停止失敗 - [PR #50651](https://github.com/BerriAI/litellm/pull/50651)
- 更新整合測試，預期回應 ID 保持限定在鑄造它們的金鑰 - [PR #50703](https://github.com/BerriAI/litellm/pull/50703)
- 更新過時的整合測試預期，並將 Together reasoning 重播 e2e 測試重新釘到仍在提供的模型 - [PR #50756](https://github.com/BerriAI/litellm/pull/50756)
- 從 Gemini 長解碼整合測試中刪除空字串 n 案例，因為 Google 以 400 拒絕它 - [PR #50794](https://github.com/BerriAI/litellm/pull/50794)
- 更新仍預期舊會計佇列的整合與 e2e 花費測試，因為 SpendLogs 分類帳現在是預設 - [PR #50805](https://github.com/BerriAI/litellm/pull/50805)
- 在 Decisions 整合測試誘餌檢查中忽略 Ollama 模型資訊呼叫，使它不再依測試順序失敗 - [PR #50827](https://github.com/BerriAI/litellm/pull/50827)
- 修復四個整合測試，包含 Redis 用戶端快取逐出案例與 `env -i` 之下分離工作樹的原生擴充功能案例 - [PR #50855](https://github.com/BerriAI/litellm/pull/50855)

### 依所屬領域的 PR 彙總 {#pr-roll-up-by-ownership-area}

依所屬領域的 PR（總計：372）

- 模型與提供者：105
- 其他：90
- UI：40
- LLM API 端點：34
- 驗證與管理：33
- 效能：32
- 花費 / 預算 / 速率限制：22
- 防護欄：6
- 記錄：5
- MCP：4
- 文件：1

## 新貢獻者 {#new-contributors}

- [@adityabatra072](https://github.com/adityabatra072) 在 [PR #45662](https://github.com/BerriAI/litellm/pull/45662) 完成首次貢獻
- [@alchemicjon](https://github.com/alchemicjon) 在 [PR #47398](https://github.com/BerriAI/litellm/pull/47398) 完成首次貢獻
- [@alekc](https://github.com/alekc) 在 [PR #38086](https://github.com/BerriAI/litellm/pull/38086) 完成首次貢獻
- [@apex-mochen](https://github.com/apex-mochen) 在 [PR #43577](https://github.com/BerriAI/litellm/pull/43577) 完成首次貢獻
- [@chuckiihub](https://github.com/chuckiihub) 在 [PR #49851](https://github.com/BerriAI/litellm/pull/49851) 完成首次貢獻
- [@davanstrien](https://github.com/davanstrien) 在 [PR #49056](https://github.com/BerriAI/litellm/pull/49056) 完成首次貢獻
- [@devin-gupta](https://github.com/devin-gupta) 在 [PR #49188](https://github.com/BerriAI/litellm/pull/49188) 完成首次貢獻
- [@HootRock](https://github.com/HootRock) 在 [PR #47980](https://github.com/BerriAI/litellm/pull/47980) 完成首次貢獻
- [@Hugo-DDT](https://github.com/Hugo-DDT) 在 [PR #49076](https://github.com/BerriAI/litellm/pull/49076) 完成首次貢獻
- [@JeongCheolLee](https://github.com/JeongCheolLee) 在 [PR #48385](https://github.com/BerriAI/litellm/pull/48385) 完成首次貢獻
- [@julienparenti](https://github.com/julienparenti) 在 [PR #50255](https://github.com/BerriAI/litellm/pull/50255) 完成首次貢獻
- [@kaust1495](https://github.com/kaust1495) 在 [PR #44944](https://github.com/BerriAI/litellm/pull/44944) 完成首次貢獻
- [@meryemsakin](https://github.com/meryemsakin) 在 [PR #41011](https://github.com/BerriAI/litellm/pull/41011) 完成首次貢獻
- [@MukeshK17](https://github.com/MukeshK17) 在 [PR #50244](https://github.com/BerriAI/litellm/pull/50244) 完成首次貢獻
- [@pasqualtroncone](https://github.com/pasqualtroncone) 在 [PR #39737](https://github.com/BerriAI/litellm/pull/39737) 完成首次貢獻
- [@PrabalParihar](https://github.com/PrabalParihar) 在 [PR #48393](https://github.com/BerriAI/litellm/pull/48393) 完成首次貢獻
- [@PyExtreme](https://github.com/PyExtreme) 在 [PR #50057](https://github.com/BerriAI/litellm/pull/50057) 完成首次貢獻
- [@qibinjin](https://github.com/qibinjin) 在 [PR #50046](https://github.com/BerriAI/litellm/pull/50046) 完成首次貢獻
- [@qtim0](https://github.com/qtim0) 在 [PR #50137](https://github.com/BerriAI/litellm/pull/50137) 完成首次貢獻
- [@sidsri14](https://github.com/sidsri14) 在 [PR #50073](https://github.com/BerriAI/litellm/pull/50073) 完成首次貢獻
- [@tc3oliver](https://github.com/tc3oliver) 在 [PR #47484](https://github.com/BerriAI/litellm/pull/47484) 完成首次貢獻
- [@thinhnx128](https://github.com/thinhnx128) 在 [PR #50538](https://github.com/BerriAI/litellm/pull/50538) 完成首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.109.0-rc.1...v1.110.0-rc.1
