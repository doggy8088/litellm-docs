---
title: "LiteLLM v1.111.0rc1 新增 Customer Management 與效能警示"
description: "新增客戶管理，可為客戶組織、團隊與成員設定預算，並新增效能警示、Claude Fable 5.2 與 Mythos 5.2，以及 Gemini 4 Carbon。"
slug: "v1-111-0-rc-1"
date: 2026-11-18T02:22:41
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
docker.litellm.ai/berriai/litellm:1.111.0-rc.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.111.0rc1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.111.0-rc.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.111.0-rc.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

已發佈的 GitHub 標籤是 `v1.111.0-rc.1`。這些說明將它與前一個發行候選版 `v1.110.0-rc.3` 比較。已回移至 `rc/1.110.0` 並已隨 `v1.110.0` 出貨的變更不在此列。

面向客戶的變更列在前面。測試、CI 與內部變更列在最後。

:::danger Breaking Changes

與最新穩定版 [`v1.110.0`](/release_notes/v1.110.0/v1-110-0) 相比，下列變更在升級時可能需要採取行動。

- **打包**：Docker 映像預設改以非 root 身分執行，並整併為單一映像（不再有 `litellm-database` 或 `litellm-non_root`）與單一 Helm chart `helm/litellm` - [PR #43332](https://github.com/BerriAI/litellm/pull/43332), [PR #43330](https://github.com/BerriAI/litellm/pull/43330)
- **Vertex AI**：除非管理員選擇加入，否則用戶端提供的 `vertex_location` 與 `vertex_project` 會被拒絕 - [PR #47028](https://github.com/BerriAI/litellm/pull/47028)
- **SSO 與 JWT 登入**：電子郵件備援只會連結到電子郵件完全相符且已驗證的未連結使用者。設定 `LITELLM_EMAIL_FALLBACK_LINKS_ANY_USER=true` 可恢復舊行為 - [PR #51897](https://github.com/BerriAI/litellm/pull/51897)
- **Chat Completions**：沒有 `role` 的訊息現在會回傳 400 - [PR #51124](https://github.com/BerriAI/litellm/pull/51124)
- **Bedrock**：模型無法提供的 `service_tier` 現在會回傳 400，除非已設定捨棄不支援的參數 - [PR #50516](https://github.com/BerriAI/litellm/pull/50516)
- **管理 API**：`/customer/new` 與 `/customer/update` 會拒絕未知欄位，金鑰、使用者、團隊與專案寫入則會拒絕未知的防護欄名稱 - [PR #50965](https://github.com/BerriAI/litellm/pull/50965), [PR #51080](https://github.com/BerriAI/litellm/pull/51080)

:::

## 重點摘要 {#key-highlights}

`v1.111.0rc1` 是 1.111.0 目前的發行候選版。

- **客戶管理**：客戶組織、團隊與成員階層，具備預算範本、彙總、每層級速率限制、每日用量，以及專屬的儀表板區域
- **效能警示**：警示頁面會對照前七天標示支出與流量激增、回應變慢與錯誤率上升，預設開啟，可選擇加入以電子郵件與 Slack 接收每日摘要
- **Rust 閘道**：Anthropic、Bedrock Invoke 與 Azure AI Foundry Claude 的 `/v1/messages` 只走 Rust，預算由 Rust 引擎保留與結算，S3 記錄器現在是 Rust 回呼
- **更快的串流，更少的記憶體**：串流在最後一個事件後立即關閉，省去 30 至 100 毫秒的等待，Rust 路由器會釋放已完成的請求，而非等到完整垃圾回收才釋放
- **動態速率限制器**：團隊與客戶組織可借用閒置的模型容量至上限，優先順序類別的配額在活躍團隊之間拆分，`rate_limited_by` 標頭會指出 429 背後的限制
- **新模型與提供者**：Anthropic、Bedrock、Vertex AI 與 Azure 上的 Claude Fable 5.2 與 Mythos 5.2、Gemini 4 Carbon 與 Hydrogen、Microsoft Web IQ 搜尋，以及 Replicate 影片、影像與語音生成
- **單一映像，單一 chart**：單一非 root Docker 映像搭配單一進入點，`helm/litellm` 是唯一的 Helm chart，並提供單體模式

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（1 個新提供者） {#new-providers-1-new-provider}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Microsoft Web IQ | `/v1/search` | `webiq/` 下的原生網頁搜尋提供者，可透過 SDK、閘道使用，也可在管理 UI 的搜尋工具選擇器中選用 |

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（98 個新模型，另加 1,020 個 fal.ai 與 Replicate 模型） {#new-model-support-98-new-models-plus-1020-falai-and-replicate-models}

這些數字代表與 `v1.110.0` 相比新增的目錄識別碼，包含別名與區域變體。價格為本版本隨附的值（以 USD 計），執行階段重新載入定價對照表時可更新。已淘汰的兩列 FriendliAI 資料列已被移除：`friendliai/MiniMaxAI/MiniMax-M2.5` 與 `friendliai/deepseek-ai/DeepSeek-V3.2`。

- **fal.ai**：736 個新的影像與影片模型，包含 FLUX（122）、Kling（52）、Hailuo 與 MiniMax（37）、Seedance（16）以及 Nano Banana 2.1
- **Replicate**：284 個新的影像、影片、文字與語音模型，包含 FLUX（46）、Wan（21）、MiniMax（10）、Nano Banana 2.1 以及 ElevenLabs 語音

<details>
<summary>全部 98 個其他新目錄條目</summary>

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens）| 輸出（$/1M tokens）| 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `anthropic.claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `anthropic.claude-mythos-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-fable-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-mythos-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-fable-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-mythos-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `eu.anthropic.claude-fable-5-2` | 1,000,000 | $8.8 | $44 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `eu.anthropic.claude-mythos-5-2` | 1,000,000 | $8.8 | $44 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-mythos-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-fable-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us-gov.anthropic.claude-mythos-5-2` | 1,000,000 | $9.6 | $48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-fable-5-2` | 1,000,000 | $8.8 | $44 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-mythos-5-2` | 1,000,000 | $8.8 | $44 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock Mantle | `bedrock_mantle/us-gov-east-1/openai.gpt-5.6-cyber` | 922,000 | $16.875 | $101.25 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Anthropic | `claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Anthropic | `claude-mythos-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure AI | `azure_ai/claude-fable-5-2-fast` | 1,000,000 | $16 | $80 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure AI | `azure_ai/claude-mythos-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure AI | `azure_ai/claude-mythos-5-2-fast` | 1,000,000 | $16 | $80 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋 |
| Azure AI | `azure_ai/deepseek-v4.1-flash-1017` | 1,000,000 | $0.3 | $1.2 | 聊天；提示快取 |
| Azure AI | `azure_ai/mistral-large-4-latest` | 1,048,576 | $0.7 | $2.1 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Databricks | `databricks/databricks-claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gemini-4-carbon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入；影片輸入 |
| Databricks | `databricks/system.ai.claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/system.ai.gemini-4-carbon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入；影片輸入 |
| DeepInfra | `deepinfra/XiaomiMiMo/MiMo-V2.6-Flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入；影片輸入 |
| DeepInfra | `deepinfra/nvidia/NVIDIA-Nemotron-3.5-Super-VL` | 262,144 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；影片輸入 |
| DeepInfra | `deepinfra/tencent/Hy4-preview` | 1,048,576 | $0.834 | $2.501 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| DeepInfra | `deepinfra/zai-org/GLM-5.3-Flash` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；影片輸入 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-flash-latest` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-fast-latest` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-flash-latest` | 1,048,576 | $0.15 | $0.5 | 聊天；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-latest` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/kimi-fast-latest` | 1,048,576 | $4.5 | $22.5 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/kimi-latest` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/minimax-latest` | 512,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/qwen-max-latest` | 262,144 | $2 | $6 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Gemini | `gemini/gemini-4-carbon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；音訊輸入；影片輸入 |
| Gemini | `gemini/gemini-decision-1` | 262,144 | $0.1 | $0 | 決策；視覺；PDF 輸入；音訊輸入；影片輸入 |
| Gemini | `gemini/nano-banana-latest` | 131,072 | $1.5 | $7.5 | 影像生成；推理；視覺；PDF 輸入；網頁搜尋；每張影像 $0.0336；為 `gemini/gemini-nano-banana-2.1` 的別名 |
| GitHub Copilot | `github_copilot/claude-fable-5.2` | 200,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| GitHub Copilot | `github_copilot/gemini-4-carbon` | 200,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫 |
| GitHub Copilot | `github_copilot/gemini-4-hydrogen` | 200,000 | $1.5 | $7.5 | 聊天；推理；視覺；工具呼叫 |
| GMI Cloud | `gmi/google/gemini-4-carbon` | 1,048,576 | $2 | $10 | 聊天 |
| GMI Cloud | `gmi/xai/grok4.7` | 500,000 | $2 | $6 | 聊天 |
| Meta | `meta/muse-ember-1.0` | 1,048,576 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| MiniMax | `minimax/MiniMax-M3.1-Flash` | 1,000,000 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Nace | `nace/drex-max` | 262,144 | $0.03 | $0 | 評估；視覺 |
| Nace | `nace/drex-max-v1.1` | 262,144 | $0.03 | $0 | 評估；視覺 |
| Perplexity | `perplexity/anthropic/claude-fable-5-2` | - | $8 | $40 | 回應 |
| Perplexity | `perplexity/google/gemini-4-carbon` | - | $2 | $10 | 回應 |
| Perplexity | `perplexity/google/gemini-4-hydrogen` | - | $1.5 | $7.5 | 回應 |
| Runway | `runwayml/bria_fibo_edit_1_5` | - | - | - | 影像生成；每張影像 $0.05 |
| Runway | `runwayml/eleven_v3` | - | - | - | 文字轉語音；每字元 $0.0002 |
| Runway | `runwayml/eleven_v4` | - | - | - | 文字轉語音；每字元 $0.00005 |
| Runway | `runwayml/gemini_2.5_flash` | - | - | - | 影像生成；每張影像 $0.05 |
| Runway | `runwayml/gemini_image3.1_flash_lite` | - | - | - | 影像生成；每張影像 $0.04 |
| Runway | `runwayml/gemini_omni_flash_1.1` | - | - | - | 影片生成；每秒 $0.1 |
| Runway | `runwayml/gemini_omni_flash_1.2` | - | - | - | 影片生成；每秒 $0.07 |
| Runway | `runwayml/grok_imagine_1_5` | - | - | - | 影片生成；每秒 $0.16 |
| Runway | `runwayml/grok_imagine_1_5_lite` | - | - | - | 影片生成；每秒 $0.03 |
| Runway | `runwayml/h3_max` | - | - | - | 影片生成；每秒 $0.08 |
| Runway | `runwayml/happyhorse_1_0` | - | - | - | 影片生成；每秒 $0.15 |
| Runway | `runwayml/kling2.5_turbo_pro` | - | - | - | 影片生成；每秒 $0.12 |
| Runway | `runwayml/kling3.0_4k` | - | - | - | 影片生成；每秒 $0.43 |
| Runway | `runwayml/kling3.0_pro` | - | - | - | 影片生成；每秒 $0.17 |
| Runway | `runwayml/kling3.0_standard` | - | - | - | 影片生成；每秒 $0.13 |
| Runway | `runwayml/klingO3_4k` | - | - | - | 影片生成；每秒 $0.43 |
| Runway | `runwayml/klingO3_pro` | - | - | - | 影片生成；每秒 $0.17 |
| Runway | `runwayml/klingO3_standard` | - | - | - | 影片生成；每秒 $0.13 |
| Runway | `runwayml/kling_4` | - | - | - | 影片生成；每秒 $0.1256 |
| Runway | `runwayml/kling_4_flash` | - | - | - | 影片生成；每秒 $0.094 |
| Runway | `runwayml/muse_image` | - | - | - | 影像生成；每張影像 $0.01 |
| Runway | `runwayml/seedance-latest` | - | - | - | 影片生成；每秒 $0.3；為 `runwayml/seedance2_5` 的別名 |
| Runway | `runwayml/seedream5_flash` | - | - | - | 影像生成；每張影像 $0.02 |
| Runway | `runwayml/seedream5_lite` | - | - | - | 影像生成；每張影像 $0.04 |
| Runway | `runwayml/wan3` | - | - | - | 影片生成；每秒 $0.1 |
| Runway | `runwayml/wan3_prime` | - | - | - | 影片生成；每秒 $0.14 |
| Soniox | `soniox/stt-async-v6` | 8,000 | - | - | 音訊轉錄；音訊輸入；每秒 $0.000028 |
| Soniox | `soniox/stt-rt-v6` | - | - | - | 音訊轉錄；音訊輸入 |
| Together AI | `together_ai/elorian-labs/glimpse-1.0` | 262,144 | $0.6 | $3 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/thinkingmachines/Inkling-2-Small` | 1,048,576 | $0.3 | $1 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Vercel AI Gateway | `vercel_ai_gateway/openai/gpt-6-luna-decisions` | 1,050,000 | $0.1 | $0 | 評估 |
| Vercel AI Gateway | `vercel_ai_gateway/typesafe-ai/jev` | 32,000 | $0.042 | $0 | 評估；視覺 |
| Vercel AI Gateway | `vercel_ai_gateway/typesafe-ai/jev-1.13.0` | 32,000 | $0.042 | $0 | 評估；視覺 |
| Vercel AI Gateway | `vercel_ai_gateway/typesafe-ai/jev-1.14.0` | 32,000 | $0.042 | $0 | 評估；視覺 |
| Vertex AI | `vertex_ai/claude-fable-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-fable-5-2@default` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-mythos-5-2` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-mythos-5-2@default` | 1,000,000 | $8 | $40 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/deep-research-preview-04-2026` | - | $2 | $12 | 聊天 |
| Vertex AI | `vertex_ai/gemini-4-carbon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；音訊輸入；影片輸入 |
| Vertex AI | `vertex_ai/gemini-4-carbon-cyber-permissive` | 1,048,576 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入；影片輸入 |
| Vertex AI | `vertex_ai/nano-banana-latest` | 131,072 | $1.5 | $7.5 | 影像生成；推理；視覺；提示快取；PDF 輸入；網頁搜尋；影片輸入；每張影像 $0.0336；為 `vertex_ai/gemini-nano-banana-2.1` 的別名 |
| WebIQ | `webiq/search` | - | - | - | 搜尋 |

</details>

### Decisions 提供者 {#decisions-providers}

- 新增 Nace `drex-max` 決策模型，依 Nace 的讀取方式以內嵌形式傳送圖片，並讓自動路由器能透過 `provider: nace` 以 `drex-max` 選取層級 - [PR #48426](https://github.com/BerriAI/litellm/pull/48426)
- 新增 Vercel AI Gateway 作為 Decisions 提供者，讓其模型的 Decisions 請求能抵達閘道，而非回傳 400 失敗，且支出會被記錄而非記為零 - [PR #50642](https://github.com/BerriAI/litellm/pull/50642)

### 新提供者 {#new-providers}

- 新增 Microsoft Web IQ 作為原生搜尋提供者，可透過 SDK 與閘道使用，也可在管理 UI 中選用 - [PR #50883](https://github.com/BerriAI/litellm/pull/50883)

### Amazon Bedrock {#amazon-bedrock}

- 對於 Bedrock 模型無法提供的服務層級改回 400，而非默默忽略，並將保留層級轉送給 Bedrock、讓自動選取層級生效，讓請求不再以未取得的較快價格計費 - [PR #50516](https://github.com/BerriAI/litellm/pull/50516)
- 將 `s3://` 影像、文件與影片 URL 以 S3 來源形式傳送給 Bedrock Converse，用於聊天、Responses、Messages 與 Gemini generateContent 請求，讓 Nova 模型讀取檔案，而非由閘道回傳 500 - [PR #50577](https://github.com/BerriAI/litellm/pull/50577)
- 對於格式錯誤的 Bedrock 計數 tokens 請求改回 400 而非 500，例如缺少或空白的 `messages` 清單、沒有 role 或內容的訊息，或只有區域前綴的模型 id - [PR #50708](https://github.com/BerriAI/litellm/pull/50708)
- 新增 GovCloud 區域內定價資料列，涵蓋 `us-gov-east-1` 與 `us-gov-west-1` 的 Bedrock Claude Fable 5.2 與 Mythos 5.2，讓這些金鑰的支出被追蹤 - [PR #50746](https://github.com/BerriAI/litellm/pull/50746)
- 依生命週期表的 GovCloud 淘汰日期修正 Bedrock 目錄資料列，新增 GPT-5.6 Cyber 的 GovCloud Mantle 資料列，並修正 Daybreak Blue 的輸入上限 - [PR #51095](https://github.com/BerriAI/litellm/pull/51095)
- 在 Bedrock 與 SageMaker Cohere 嵌入請求中傳送 `max_tokens` 與 `priority`，而非默默捨棄，讓呼叫者能限制每筆輸入的嵌入量 - [PR #51435](https://github.com/BerriAI/litellm/pull/51435)
- 將 `extra_body` 欄位放入 Bedrock 非同步呼叫嵌入的 `modelInput` 內，讓以此方式傳送的 Nova 與 TwelveLabs 選項能抵達模型 - [PR #51676](https://github.com/BerriAI/litellm/pull/51676)
- 在 `drop_params` 的 effort 檢查之前先箝制 Bedrock effort，讓 Opus 4.6 的 `xhigh` 以 `output_config.effort="max"` 傳送，而非被捨棄 - [PR #51972](https://github.com/BerriAI/litellm/pull/51972)

### Anthropic {#anthropic}

- 將 `claude-fable-5-2` 及其 `bedrock/claude_platform/claude-fable-5-2` Claude Platform on AWS 鏡像加入成本對照表，讓兩列都有定價與模型資訊 - [PR #50715](https://github.com/BerriAI/litellm/pull/50715)

### Azure {#azure}

- 將 `azure_ai/claude-fable-5-2` 與 `claude-fable-5-2-fast` 加入成本對照表，資料取自 Azure Foundry Claude 頁面，上下文 1M、最大輸出 128K - [PR #50723](https://github.com/BerriAI/litellm/pull/50723)
- 將會計入網頁搜尋費用的 `azure_ai` Claude 資料列標記為 `supports_web_search`，讓依此旗標判斷的呼叫者不再隱藏 Azure 支援的工具 - [PR #50960](https://github.com/BerriAI/litellm/pull/50960)
- 依 Mistral 的牌價將 `azure_ai/mistral-large-4-latest` 加入模型目錄，淘汰日期取自 Azure Models API - [PR #51047](https://github.com/BerriAI/litellm/pull/51047)
- 將過舊的 Azure Responses API 版本換成預設的 Responses 版本，讓 Azure `gpt-6` 帶工具的聊天請求不再回傳 400 失敗 - [PR #51116](https://github.com/BerriAI/litellm/pull/51116)
- 在 Azure Responses 請求上，從部署名稱中移除 GPT-5 路由標記，讓 Azure 收到真正的部署名稱，而非該標記 - [PR #51438](https://github.com/BerriAI/litellm/pull/51438)
- 將 `reasoning_effort` 傳送給 Azure AI Foundry 上的 Kimi K3，並在工具呼叫之間保留其 `reasoning_content`，讓 Claude Code 工作階段不再遺失模型先前的思考內容 - [PR #51747](https://github.com/BerriAI/litellm/pull/51747)
- 從傳送給用戶端與 Slack 警示的 Azure 串流中斷錯誤中移除 Python traceback，讓回應中途斷線時顯示簡短的錯誤行，而非重複多次的伺服器檔案路徑 - [PR #51760](https://github.com/BerriAI/litellm/pull/51760)
- 在 Foundry 專案 `/openai/v1` Responses 基礎 URL 上不傳送 `api-version`，讓指向這些 URL 的 Azure 部署不再讓每個 Responses 與聊天呼叫都失敗 - [PR #51767](https://github.com/BerriAI/litellm/pull/51767)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 為 Vertex AI 上有版本的 Claude id 解析正確的預設 `max_tokens`，讓沒有 `max_tokens` 的請求不再因模型上限低於舊的 128000 備援值而被拒絕，例如 Haiku 4.5 - [PR #40376](https://github.com/BerriAI/litellm/pull/40376)
- 在 Vertex AI 上新增 Claude Fable 5.2，並將 `claude-fable-latest` 指向它，讓 `vertex_ai/claude-fable-5-2` 有模型資訊並追蹤支出 - [PR #50713](https://github.com/BerriAI/litellm/pull/50713)
- 新增設定，以呼叫者的金鑰、團隊、組織與專案名稱標記 Vertex 呼叫，讓 Cloud Billing 能依標籤拆分 Vertex 支出。Proxy 會捨棄呼叫者自行設定的任何身分標籤 - [PR #50732](https://github.com/BerriAI/litellm/pull/50732)
- 新增 `gemini/gemini-4-carbon`，含 Standard、Batch、Flex 與 Priority 價格、token 上限與能力旗標，讓對它的請求能追蹤成本 - [PR #50931](https://github.com/BerriAI/litellm/pull/50931)
- 將 `vertex_ai/claude-mythos-5-2` 與 `vertex_ai/claude-mythos-5-2@default` 加入成本對照表，讓查詢能運作，支出不再以 $0 計費 - [PR #50940](https://github.com/BerriAI/litellm/pull/50940)
- 新增 `vertex_ai/gemini-4-carbon` 與 `vertex_ai/gemini-4-carbon-cyber-permissive`，含取自 Vertex 定價頁的 Standard、Priority 與 Batch 價格 - [PR #50942](https://github.com/BerriAI/litellm/pull/50942)
- 讓 Gemini 4 Carbon 資料列享有與 Gemini 3 共用的每月 5,000 次 grounding 查詢免費額度，讓 grounding 呼叫不再從第一次查詢就開始計費 - [PR #50951](https://github.com/BerriAI/litellm/pull/50951)
- 讓 Gemini 4 Argon 資料列享有與 Gemini 3 共用的每月 5,000 次 grounding 查詢免費額度，讓 grounding 呼叫不再從第一次查詢就開始計費 - [PR #50959](https://github.com/BerriAI/litellm/pull/50959)
- 為 Gemini `-latest` 別名資料列補上缺少的批次與 flex 層級價格，包含 `gemini-pro-latest` 的批次上下文快取與 200k 以上提示價格 - [PR #51150](https://github.com/BerriAI/litellm/pull/51150)
- 移除 12 列 Vertex 資料列上只有下限的淘汰日期，更新 Veo 3.1 的後繼者，並修正 `gemini-3.1-flash-image` 的輸入 token 上限，依 Vertex 模型頁面為準 - [PR #51180](https://github.com/BerriAI/litellm/pull/51180)
- 將 `gemini/gemini-decision-1` 以每 1M 輸入 tokens $0.10 的價格加入模型目錄，讓 Decisions API 對它的支出能被追蹤 - [PR #51215](https://github.com/BerriAI/litellm/pull/51215)
- 在 Vertex AI RAG Engine 搜尋與冷啟動爆量期間，每個 worker 共用一個 Google token，讓 2 個 worker 的 proxy 上 21 次搜尋只需 2 次 token 取得，而非每次搜尋各取一次 - [PR #51239](https://github.com/BerriAI/litellm/pull/51239)
- 將 `gemini/gemini-4-hydrogen` 加入成本對照表，價格取自 Gemini API 定價頁，讓對它的呼叫有成本計算，而非記錄為零 - [PR #51423](https://github.com/BerriAI/litellm/pull/51423)
- 將 `vertex_ai/gemini-4-hydrogen` 加入成本對照表，價格取自 Vertex 定價頁，涵蓋 Standard、Priority 與 Flex 或 Batch 層級 - [PR #51432](https://github.com/BerriAI/litellm/pull/51432)
- 將 Gemini TTS 與 Live 預覽資料列的 11 月 17 日關閉日期，改為 Google 淘汰頁面上的日期，即 2026 年 12 月 18 日與 2027 年 3 月 31 日 - [PR #51657](https://github.com/BerriAI/litellm/pull/51657)
- 將 `extra_body` 欄位以平面形式作為 Vertex BGE 嵌入模型的 predict 參數傳送，如同其他 Vertex 文字嵌入模型，而非巢狀放在 `parameters.extra_body` 下 - [PR #51662](https://github.com/BerriAI/litellm/pull/51662)
- 在 Vertex Gemini `embedContent` 回應上回報 PDF tokens 與成本，依影像費率計價，讓 PDF 嵌入不再顯示 0 tokens 與 $0 - [PR #51673](https://github.com/BerriAI/litellm/pull/51673)
- 在 Gemini 嵌入的一般與批次請求上都傳送 `document_ocr`、`audio_track_extraction` 與 `auto_truncate`，因為它們先前被默默忽略 - [PR #51686](https://github.com/BerriAI/litellm/pull/51686)
- 從三列 Vertex AI Gemini 4 資料列移除 Flex 價格欄位，因為 Google 不支援 Gemini 4 的 Flex PayGo，且成本是依無法適用的價格計算 - [PR #51735](https://github.com/BerriAI/litellm/pull/51735)
- 在聊天補全上以 `delta.audio` 串流 Gemini 文字轉語音音訊，讓串流 TTS 請求能回傳音訊，而非只有空白的最終停止 chunk - [PR #51750](https://github.com/BerriAI/litellm/pull/51750)
- 在 Vertex AI 與 Gemini API 上將 union-root 工具結構描述以 `parametersJsonSchema` 傳送，讓參數允許多種形狀的工具不再回傳 400 失敗 - [PR #51835](https://github.com/BerriAI/litellm/pull/51835)

### OpenAI {#openai}

- 新增 `gpt-image-2.6-sunburst` 與 `gpt-image-2.6-flare` 的批次價格，並移除 OpenAI 不再公布的 `gpt-5.5-pro` 長上下文批次價格，讓批次影像呼叫不再以兩倍價格計費 - [PR #51647](https://github.com/BerriAI/litellm/pull/51647)
- 對經由 Responses API 傳送的 OpenAI 聊天補全，限制網頁搜尋輪次並計費，讓管理員的上限獲得遵守，而非一直搜尋到請求回傳 500 失敗 - [PR #51802](https://github.com/BerriAI/litellm/pull/51802)

### 其他提供者 {#other-providers}

- 讓 `ollama_chat/` 模型的每個串流工具呼叫各有自己的索引，讓 OpenAI 風格的用戶端能組裝多個工具呼叫，而非一個參數黏在一起的呼叫 - [PR #49183](https://github.com/BerriAI/litellm/pull/49183)
- 將 `reasoning_effort` 轉送給成本對照表標記為推理的 MiniMax 模型，讓 low 與 high effort 請求有不同行為，並將 `MiniMax-M3.1-Flash` 加入成本對照表 - [PR #49583](https://github.com/BerriAI/litellm/pull/49583)
- 不再於 OpenRouter 串流的 finish chunk 與 usage chunk 之間發出空白的助理 choice，讓把完成後 choice 當作會計資料的用戶端仍能看到用量 - [PR #50210](https://github.com/BerriAI/litellm/pull/50210)
- 從 `hosted_vllm` 聊天請求中省略空白的 `tools` 清單，連同 `tool_choice` 與 `parallel_tool_calls`，讓 vLLM 風格的後端不再回傳 400 - [PR #50812](https://github.com/BerriAI/litellm/pull/50812)
- 對於以 HTTP 200 回傳的失敗 OpenRouter 非串流補全改為擲出錯誤，讓呼叫者能重試或備援，同時仍記錄 tokens 與成本 - [PR #50880](https://github.com/BerriAI/litellm/pull/50880)
- 新增 Databricks `claude-fable-5-2`，標註 `glm-5-2` 的淘汰日期，並修正 `llama-3-1-8b` 的上下文視窗，依 Databricks 支援模型頁面為準 - [PR #51076](https://github.com/BerriAI/litellm/pull/51076)
- 依專屬定價頁為 Databricks `claude-fable-5-2` 定價，而非沿用 Bedrock 的價格，並修正與輸入價格設為相同的快取讀取價格 - [PR #51232](https://github.com/BerriAI/litellm/pull/51232)
- 將 Magistral 推理以 Mistral 支援的原生層級傳送，而非提示詞指示，讓思考內容與答案保持分離。無效的推理設定會回傳明確錯誤，除非已開啟捨棄不支援參數 - [PR #51329](https://github.com/BerriAI/litellm/pull/51329)
- 透過 predictions API 新增 Replicate 影片生成、影像生成與文字轉語音，讓 `/v1/videos`、`/v1/images/generations` 與 `/v1/audio/speech` 能搭配 `replicate/` 模型使用，而非失敗 - [PR #51360](https://github.com/BerriAI/litellm/pull/51360)
- 新增 fal.ai Nano Banana 2.1，依 `x-fal-billable-units` 標頭計費，並正確路由 `google/` 模型，讓 `fal_ai/google/nano-banana-2.1` 不再回傳 404 且計費為零 - [PR #51410](https://github.com/BerriAI/litellm/pull/51410)
- 為 GitHub Copilot 提供者支援 GitHub App 驗證。管理員在儀表板上傳 App 的 PEM 金鑰，以加密形式儲存，安裝 token 會自動更新，每個應用程式有各自的憑證 - [PR #51427](https://github.com/BerriAI/litellm/pull/51427)
- 不呼叫提供者，直接從內建目錄註冊 Ollama 部署價格，讓設定部署不再觸及預設的本機 Ollama 位址 - [PR #51561](https://github.com/BerriAI/litellm/pull/51561)
- 將 `together_ai/elorian-labs/glimpse-1.0` 標記為支援函式呼叫與結構化輸出，符合 Together 的文件 - [PR #51612](https://github.com/BerriAI/litellm/pull/51612)
- 為 `mistral/mistral-large-4` 與 `mistral/mistral-large-4-0` 宣告 `low`、`medium` 與 `high` 推理 effort，讓要求的 low 或 medium 層級不再以 high 傳送給 Mistral - [PR #51693](https://github.com/BerriAI/litellm/pull/51693)
- 不再於 `/v1/models` 上將 23 個已淘汰的 Together AI id 列在 `together_ai/*` 萬用字元下，讓選取列出的模型不再以 400 收場 - [PR #51827](https://github.com/BerriAI/litellm/pull/51827)

### 模型目錄與定價 {#model-catalog-and-pricing}

- 將 Bedrock Fable 5.2 與 Mythos 5.2 資料列，加上 Azure 即時快取、Vertex 與 Friendli 登錄檔更新，加入成本對照表，兩份登錄檔副本保持一致 - [PR #50707](https://github.com/BerriAI/litellm/pull/50707)
- 新增 `gpt-6-cyber` 的長上下文價格，取自 OpenAI 定價頁，讓超過 272K 輸入 tokens 的請求以正確費率計費 - [PR #50770](https://github.com/BerriAI/litellm/pull/50770)
- 新增 `github_copilot/claude-fable-5.2` 資料列，取自 Copilot 模型與定價表，讓該模型能解析價格 - [PR #50775](https://github.com/BerriAI/litellm/pull/50775)
- 將 `wandb/deepseek-ai/DeepSeek-V4.1-Flash-1017` 依 CoreWeave Forge 公布的輸入、快取輸入與輸出費率定價，而非沿用 DeepSeek-V4.1-Flash 的價格 - [PR #50776](https://github.com/BerriAI/litellm/pull/50776)
- 在 Anthropic API 與 Azure AI 上新增 `claude-mythos-5-2`，從 GovCloud Fable 5.2 移除不支援的 Mantle token 計數模型，並新增 Friendli GLM-5.1 的淘汰日期 - [PR #50777](https://github.com/BerriAI/litellm/pull/50777)
- 新增 `gpt-image-2` 的 2027-02-10 關閉日期，取自 OpenAI 淘汰頁面 - [PR #50829](https://github.com/BerriAI/litellm/pull/50829)
- 新增 `together_ai/elorian-labs/glimpse-1.0`，價格取自 Together models API，讓它的支出不再以零追蹤 - [PR #50830](https://github.com/BerriAI/litellm/pull/50830)
- 新增 `meta/muse-ember-1.0`，含取自 Meta 定價頁的基礎與長上下文費率，讓它的請求能解析價格 - [PR #50847](https://github.com/BerriAI/litellm/pull/50847)
- 在 2026-11-10 稽核後修正 Together、Mistral、Fireworks、Azure AI 與 Copilot 模型的登錄檔中繼資料，欄位層級的變更皆引述官方提供者頁面 - [PR #51003](https://github.com/BerriAI/litellm/pull/51003)
- 將 `github_copilot/gemini-4-carbon` 加入模型目錄，讓新推出的 Copilot 模型有定價與上限，並能搭配成本追蹤使用 - [PR #51012](https://github.com/BerriAI/litellm/pull/51012)
- 將 `together_ai/together/Tev1-4B-experimental` 的輸入價格更新為 Together models API 回傳的值，讓此模型的支出依公布費率計算 - [PR #51013](https://github.com/BerriAI/litellm/pull/51013)
- 將第一批 `fal_ai` 影像與影片模型加入成本對照表，價格取自各 fal.ai 模型頁面並附上來源連結，讓它們的支出被追蹤 - [PR #51035](https://github.com/BerriAI/litellm/pull/51035)
- 將 282 個 Replicate 模型加入成本對照表，價格取自各模型頁面，並為 25 列既有資料列加上來源連結，讓官方模型的 Replicate 支出被追蹤 - [PR #51067](https://github.com/BerriAI/litellm/pull/51067)
- 將騰訊 Hy4 與 Hy4 preview 的成本更新為目前的 TokenHub 促銷費率，即牌價的一半，並新增 2026 年 12 月 31 日的提醒以便重新檢視 - [PR #51072](https://github.com/BerriAI/litellm/pull/51072)
- 再將 61 個 `fal_ai` 影像與影片模型加入成本對照表，價格取自其 fal.ai 模型頁面並附上來源連結，讓它們的支出被追蹤 - [PR #51077](https://github.com/BerriAI/litellm/pull/51077)
- 將 `replicate/google/gemini-4-carbon` 加入模型目錄，價格取自 Replicate 模型頁面 - [PR #51125](https://github.com/BerriAI/litellm/pull/51125)
- 再將三列 `fal_ai` 資料列加入成本對照表，價格取自 fal 定價 API 與模型頁面，讓它們的支出被追蹤 - [PR #51126](https://github.com/BerriAI/litellm/pull/51126)
- 新增 19 個 Fal 端點與 Databricks Gemini 4 Carbon 資料列，恢復三個 DeepInfra 價格，並修正 Bedrock Kimi K2.5 的 priority 與 GLM 5 的 flex 定價，讓這些模型的支出正確計費 - [PR #51193](https://github.com/BerriAI/litellm/pull/51193)
- 新增 24 個 `runwayml` 模型至成本對照表，並修正 `seedance2` 與 `eleven_multilingual_v2` 的費率以符合 Runway 定價頁 - [PR #51216](https://github.com/BerriAI/litellm/pull/51216)
- 在三列有日期的 Fireworks `deepseek-v4-flash` 資料列上記錄淘汰來源與後繼模型，價格與上限不變，讓淘汰通知指向正確的替代模型 - [PR #51285](https://github.com/BerriAI/litellm/pull/51285)
- 為 `gemini/gemini-2.5-flash-image` 新增批次與優先影像輸出 token 價格，讓這些層級下的影像生成依所述費率計費，而非 Standard 費率 - [PR #51368](https://github.com/BerriAI/litellm/pull/51368)
- 以 xAI 已淘汰的影像費率、Kling 4、GMI Gemini 4 Carbon 與 Grok 4.7 的資料列，以及 Seedance 與 Nano Banana 的 `-latest` 別名更新成本對照表，讓支出不再以錯誤費率追蹤 - [PR #51395](https://github.com/BerriAI/litellm/pull/51395)
- 新增七列 fal.ai 成本對照表資料列，涵蓋 Seedream 5.5、Flux 虛擬試穿、Patina 材質與 Vidu 範本，讓對這些模型的呼叫不再以零支出追蹤 - [PR #51407](https://github.com/BerriAI/litellm/pull/51407)
- 新增 Azure DeepSeek V4.1 Flash 1017 與兩個 Perplexity Agent API 模型的成本對照表資料列，讓對它們的呼叫不再以零支出記錄 - [PR #51444](https://github.com/BerriAI/litellm/pull/51444)
- 依 OpenAI 對 2026 年 12 月 1 日關閉的更新建議，將 `gpt-image-1-mini`、`gpt-image-1.5` 與 `chatgpt-image-latest` 指向 GPT-Image-2.6 模型作為後繼者 - [PR #51475](https://github.com/BerriAI/litellm/pull/51475)
- 將已淘汰的 Fireworks `deepseek-v4-flash` 資料列指向仍在運作的 `deepseek-v4p1-flash` 作為後繼者，因為先前的後繼者本身也已淘汰 - [PR #51478](https://github.com/BerriAI/litellm/pull/51478)
- 依 OpenAI 對 2026 年 12 月 11 日關閉的更新建議，將 `gpt-5`、`gpt-5-mini`、`gpt-5-nano`、`gpt-5-pro`、`o3` 與 `o3-pro` 指向 GPT-6 模型作為後繼者 - [PR #51492](https://github.com/BerriAI/litellm/pull/51492)
- 將 `fal_ai/google/gemini-omni-flash/v1.2/upscale` 加入成本對照表，依放大影片的秒數計價，讓對它的呼叫不再沒有定價 - [PR #51500](https://github.com/BerriAI/litellm/pull/51500)
- 將 `together_ai/thinkingmachines/Inkling-2-Small` 加入成本對照表，價格取自 Together models API，讓它的支出不再以零追蹤 - [PR #51501](https://github.com/BerriAI/litellm/pull/51501)
- 在 Rust 載入器搬移後恢復成本對照表載入的回溯相容性，讓頂層值不是物件的成本對照表（例如 `_comment` 字串）能再次載入，而非失敗 - [PR #51545](https://github.com/BerriAI/litellm/pull/51545)
- 將 `fal_ai/decart/lucy-5b/image-to-video` 以每支影片 $0.15 的價格加入成本對照表，取自其 fal.ai 頁面 - [PR #51551](https://github.com/BerriAI/litellm/pull/51551)
- 在成本對照表中，將 `gpt-audio-1.5` 與 `gpt-realtime-1.5` 記錄為 `gpt-4o-mini-audio-preview-2024-12-17` 與 `gpt-4o-mini-realtime-preview-2024-12-17` 快照的後繼者 - [PR #51563](https://github.com/BerriAI/litellm/pull/51563)
- 在成本對照表中記錄 `databricks/databricks-gemini-3-6-flash` 的 2026 年 11 月 19 日淘汰與後繼者 - [PR #51593](https://github.com/BerriAI/litellm/pull/51593)
- 新增 Soniox v6 與 DeepInfra 成本對照表資料列，修正與提供者文件牴觸的能力與價格，並標註 Soniox、Bedrock Claude 與 Azure Whisper 模型的淘汰日期 - [PR #51620](https://github.com/BerriAI/litellm/pull/51620)
- 將 `github_copilot/gemini-4-hydrogen` 加入成本對照表，取自 GitHub Copilot 變更紀錄的推出文章 - [PR #51696](https://github.com/BerriAI/litellm/pull/51696)
- 將 4K 輸出費率新增至 `runwayml/seedance2_5`，作為 `output_cost_per_second_4k`，讓 4K 生成不再以 720p 基礎費率計費 - [PR #51697](https://github.com/BerriAI/litellm/pull/51697)
- 將 `azure_ai/claude-haiku-4-5` 與 `azure_ai/claude-opus-4-5` 的淘汰日期移至 2027-03-16，讓 `/model/deprecations` 不再針對 Azure 不再公布的日期發出警告 - [PR #51716](https://github.com/BerriAI/litellm/pull/51716)
- 新增兩個 fal.ai Seedream 5.0 Pro US 資料列，編輯與文字轉影像，依端點頁面以每張影像計價 - [PR #51881](https://github.com/BerriAI/litellm/pull/51881)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 為 `/v1/responses` 回傳的延遲頂層函式工具，保留 `namespace == name` 的形狀，符合 OpenAI Agents SDK 以 `defer_loading: true` 進行工具搜尋時的預期 - [PR #50602](https://github.com/BerriAI/litellm/pull/50602)
- 將串流 `/v1/responses` 的備援中繼資料，以具型別的 `litellm.fallback_metadata` Responses 事件傳送，讓 OpenAI SDK 用戶端不再將它誤讀為音訊 delta 事件 - [PR #50804](https://github.com/BerriAI/litellm/pull/50804)
- 在 `/v1/responses` 後續輪次重播 Claude 工具搜尋，在第一輪回傳工具搜尋輸出，並在後續輪次捨棄已載入的工具時不再讓 Anthropic 回傳 400 錯誤 - [PR #50821](https://github.com/BerriAI/litellm/pull/50821)
- 讓推理項目 ID 在串流事件與已完成的回應之間保持一致，讓依 ID 追蹤項目的用戶端不再看到重複項目，涵蓋 HTTP、WebSocket、補全橋接與 Rust 處理器 - [PR #51243](https://github.com/BerriAI/litellm/pull/51243)
- 在 Responses API 模型上接受字串或 tuple 形式的 `allowed_openai_params`，讓聊天與 `/v1/messages` 請求不再以 500「can only concatenate list」錯誤失敗 - [PR #51751](https://github.com/BerriAI/litellm/pull/51751)

### Chat Completions {#chat-completions}

- 在串流聊天請求上以非同步用戶端下載 PDF URL，讓事件迴圈不再被阻塞，並對非同步 OpenAI 相容呼叫只執行一次訊息轉換，而非兩次 - [PR #49176](https://github.com/BerriAI/litellm/pull/49176)
- 在聊天補全上接受 Responses API 的平面 `allowed_tools` `tool_choice` 版面，而非回傳 400，並在提供者無法強制執行且 `drop_params` 開啟時捨棄它 - [PR #50467](https://github.com/BerriAI/litellm/pull/50467)
- 讓未設定 effort 的 `gpt-5.4` 與 `gpt-5.5` 工具呼叫，在 OpenAI 與 Azure 的 Chat Completions 上保持原樣，而非橋接至 `/responses`，避免額外的轉換層錯誤 - [PR #50968](https://github.com/BerriAI/litellm/pull/50968)
- 只在提供者真的未收到 effort 時才記錄 GPT-5 `reasoning_effort` 捨棄警告，讓 Azure 使用者不再為不存在的問題調整設定 - [PR #50995](https://github.com/BerriAI/litellm/pull/50995)
- 對於未帶 role 傳送的聊天訊息，改回 400 並附上 OpenAI 的訊息與 `param`，而非將它當作助理輪次送往上游，並將該 400 排除在冷卻計數之外 - [PR #51124](https://github.com/BerriAI/litellm/pull/51124)
- 在 `/queue/chat/completions` 上執行行李標籤對映、驗證檢查與預算保留，讓佇列聊天呼叫的標記與限制方式與 `/v1/chat/completions` 相同 - [PR #51753](https://github.com/BerriAI/litellm/pull/51753)
- 在 Rust 閘道的聊天補全上回傳 Claude 思考區塊，而非 500，讓它在 Claude 回答前思考時與 Python proxy 一致 - [PR #51774](https://github.com/BerriAI/litellm/pull/51774)

### Anthropic Messages API {#anthropic-messages-api}

- 在 `bedrock/invoke/*` 上被捨棄的 `/v1/messages` 串流提早關閉時重設上游連線，讓中止的 Bedrock Invoke 串流真的停止 - [PR #50657](https://github.com/BerriAI/litellm/pull/50657)
- 在不支援參數檢查之前，先在 `/v1/messages` 上套用 `additional_drop_params`，讓設定為捨棄 `top_k` 等參數的部署，在用戶端傳送該參數時不再回傳 400 - [PR #50753](https://github.com/BerriAI/litellm/pull/50753)
- 在原生 `/v1/messages` 上轉送訊息執行緒，讓啟用執行緒的 Claude Code 保留其聊天與工具，並保持 `error.details.error_code` 完整，讓 SDK 重播能運作 - [PR #50976](https://github.com/BerriAI/litellm/pull/50976)
- 從 `/v1/messages` 與 token 計數的 Swagger 標籤移除過時的 beta 標示，讓使用者能看到這些端點已穩定 - [PR #51046](https://github.com/BerriAI/litellm/pull/51046)
- 為路由至 OpenAI 或 Azure 的串流 `/v1/messages` 呼叫恢復同步迭代，讓使用一般 for 迴圈的應用程式能再次運作，提早關閉串流時也會關閉上游連線 - [PR #51305](https://github.com/BerriAI/litellm/pull/51305)
- 只透過 Rust 閘道提供 Bedrock invoke Messages 請求，將請求重寫、AWS 憑證、SigV4 簽署與串流錯誤處理從 Python 移植過來 - [PR #51330](https://github.com/BerriAI/litellm/pull/51330)
- 在 Messages 轉 Responses 橋接上，如同 Chat 橋接已做的，關閉嚴格 JSON 結構描述中的巢狀物件，讓經由 `/v1/messages` 對 OpenAI 模型提出的嚴格結構描述請求不再以 400 失敗 - [PR #51337](https://github.com/BerriAI/litellm/pull/51337)
- 在 Rust Messages 路徑上保留 Anthropic 已簽署的空白思考區塊，讓它們仍與 Anthropic 端儲存的思考區段相符 - [PR #51349](https://github.com/BerriAI/litellm/pull/51349)
- 只將 Anthropic 請求中繼資料中的 `user_id` 傳給 Rust，讓設定中繼資料為大型物件的 hook 不再破壞 Rust Messages 路徑 - [PR #51355](https://github.com/BerriAI/litellm/pull/51355)
- 在 Rust `/v1/messages` 串流中途斷線或停滯時，於錯誤中指出部署名稱，讓呼叫者取得 `litellm_debug_info`，而非原始的傳輸錯誤 - [PR #51358](https://github.com/BerriAI/litellm/pull/51358)
- 不再要求安裝 Redis 才能匯入 Messages 串流路徑，讓未安裝 Redis 時 Anthropic 與 Bedrock 串流仍保留成功回呼、成本追蹤與記錄 - [PR #51685](https://github.com/BerriAI/litellm/pull/51685)
- 只在 Rust 閘道上透過 `/v1/messages` 提供 Azure AI Foundry 上的 Claude，並修復對等性問題，讓呼叫者看不到變更，非 Claude 的 azure_ai 模型則保留 Python 路徑 - [PR #51721](https://github.com/BerriAI/litellm/pull/51721)
- 在用戶端省略時，於 Rust 閘道的 `/v1/messages` 上套用部署的 `litellm_params`，例如 `thinking`、`system`、`tools` 與 `stream`，並從成本對照表補齊模型能力，讓 Claude 5.5 不再回傳 400 - [PR #51834](https://github.com/BerriAI/litellm/pull/51834)
- 關閉數個高與中嚴重性的 Rust `/v1/messages` 對等性落差，包含在 `api_key` 為空時以 SigV4 簽署 Bedrock invoke，讓 Rust 閘道與 Python proxy 一致 - [PR #52042](https://github.com/BerriAI/litellm/pull/52042)

### 計算 tokens {#count-tokens}

- 以 Mistral 自己的 `/v1/responses/input_tokens` 端點計算 Mistral tokens，而非本機估計，讓計數與 Mistral 的 tokenizer 及計費相符 - [PR #50653](https://github.com/BerriAI/litellm/pull/50653)
- 在 Anthropic、OpenAI 與 Azure AI 上，也將僅含提示詞的 `call_endpoint=true` token 計數傳送至提供者的計數 API，讓 Claude 的計數與提供者相符，而非偏低的本機估計 - [PR #50783](https://github.com/BerriAI/litellm/pull/50783)
- 在每個 token 計數回應上回傳 `x-litellm-call-id` 標頭，與 proxy token 計數記錄行中的 id 相同，讓看起來錯誤的計數能追溯到其記錄 - [PR #51037](https://github.com/BerriAI/litellm/pull/51037)
- 以推論實際傳送的 `thinking`、推理 effort 與 `tool_choice` 計算 tokens，讓 proxy 的計數與 Claude 及 DeepSeek V4 的提供者計費相符，而非偏低 - [PR #51079](https://github.com/BerriAI/litellm/pull/51079)
- 在 token 計數路由上計算請求的 `tool_choice`，讓強制使用工具或關閉工具的計數方式，如同 OpenAI 與 xAI 的計費，而非與未設定時相同 - [PR #51133](https://github.com/BerriAI/litellm/pull/51133)
- 在 Anthropic 與 Azure AI 部署的 `/v1/messages/count_tokens` 上，當訊息沒有 `role` 或 `content` 時改回 400 `invalid_request_error` 而非 500，並指出該訊息 - [PR #51284](https://github.com/BerriAI/litellm/pull/51284)
- 計算對話中途新增或移除工具的 Anthropic 對話，包含內嵌工具定義與工具參照，並將已移除的工具定義保留計數，如同 Anthropic 的做法，而非拒絕這些區塊 - [PR #51447](https://github.com/BerriAI/litellm/pull/51447)

### 提示快取 {#prompt-caching}

- 在聊天轉 Responses 橋接上，將 `cache_control` 以 `prompt_cache_breakpoint` 傳送，讓經由 Responses API 提供給 GPT 模型的函式工具請求保留用戶端的快取標記 - [PR #51783](https://github.com/BerriAI/litellm/pull/51783)

### 批次與檔案 {#batches-and-files}

- 讓團隊能為批次工作與檔案上傳使用自己的允許 S3 bucket，作為全域允許清單之外的補充，讓個別團隊能擁有自己的 bucket - [PR #50571](https://github.com/BerriAI/litellm/pull/50571)
- 即使聊天部署的順序較低，也將受管批次檔案上傳傳送至混合模型群組的批次部署，讓後續的批次建立不再收到 Azure 的 400 - [PR #50971](https://github.com/BerriAI/litellm/pull/50971)
- 當請求也透過路由標頭或 `model` 查詢參數指定模型時，仍能擷取與刪除受管檔案，而非在 OpenAI 等提供者上回傳 404 - [PR #51780](https://github.com/BerriAI/litellm/pull/51780)

### 透傳端點 {#pass-through-endpoints}

- 將選擇加入的透傳端點以可讀名稱發佈在公開的 Model Hub 上，讓使用者能在模型旁找到非 LLM 路由，例如 NER 服務 - [PR #43905](https://github.com/BerriAI/litellm/pull/43905)
- 新增 Amazon OpenSearch 索引透傳，具備每金鑰與每團隊的讀取或寫入授權。LiteLLM 以自己的 AWS 憑證簽署每次呼叫，讓應用程式不必持有這些憑證 - [PR #50573](https://github.com/BerriAI/litellm/pull/50573)
- 在 `/bedrock/model` 透傳路由上轉送 `x-pass-` 標頭，讓呼叫時傳送的防護欄與請求中繼資料標頭能抵達 AWS - [PR #50728](https://github.com/BerriAI/litellm/pull/50728)
- 將 Bedrock `/invoke` 透傳上的 Titan 嵌入回覆，以提供者的 token 計數與影像費用作為嵌入記錄並計費，讓它們不再從支出記錄中遺漏 - [PR #51701](https://github.com/BerriAI/litellm/pull/51701)

### 影像、音訊與影片 {#images-audio-and-video}

- 透過與 Azure OpenAI 相同的部署路由與 multipart 格式，在 Azure AI Foundry 上支援 gpt-image 編輯，讓 `azure_ai` 搭配 gpt-image 模型的影像編輯不再於請求傳送前失敗 - [PR #49650](https://github.com/BerriAI/litellm/pull/49650)
- 為 multipart 上傳中以 tuple 傳入 `Path` 的音訊測量長度，讓提供者未回傳長度時仍保留本機計算的長度 - [PR #49806](https://github.com/BerriAI/litellm/pull/49806)
- 對於格式錯誤的 Replicate 影片 `seconds` 改回 400，並捨棄非十進位的 `size` 數字，而非對 `nan`、`1e999` 或 `abc` 等值回傳 500 或 503 - [PR #51670](https://github.com/BerriAI/litellm/pull/51670)

### Embeddings 與 rerank {#embeddings-and-rerank}

- 對 Cohere 嵌入遵守 `COHERE_API_BASE`，讓閘道使用者不再將閘道金鑰傳送至 api.cohere.ai 而收到 401，與 rerank 與聊天一致 - [PR #50249](https://github.com/BerriAI/litellm/pull/50249)
- 在 rerank 端點上遵守 `cancel_on_disconnect`，讓用戶端中斷連線時如同其他推論端點，捨棄上游提供者連線 - [PR #51252](https://github.com/BerriAI/litellm/pull/51252)
- 將 `extra_body` 展開至 Bedrock、Gemini、Vertex、Ollama、SageMaker 與 NVIDIA NIM 嵌入的提供者請求主體，讓額外欄位不再以字面的 `extra_body` 鍵傳送並被忽略 - [PR #51335](https://github.com/BerriAI/litellm/pull/51335)

### 向量儲存 {#vector-stores}

- 從團隊 OpenAI 萬用字元模型經由 RAG 擷取回傳 LiteLLM 受管檔案 id，並在向量儲存檔案路由上使用團隊的 OpenAI 憑證，讓取得、讀取或分離檔案不再以錯誤的 API 金鑰失敗 - [PR #50459](https://github.com/BerriAI/litellm/pull/50459)
- 讓多模態嵌入模型上的 Bedrock 知識庫能以影像搜尋向量儲存，並回傳相符的影像，而非失敗或以文字搜尋執行 - [PR #51063](https://github.com/BerriAI/litellm/pull/51063)
- 將 OpenAI 風格的向量儲存搜尋篩選器對映至 OpenSearch k-NN 篩選器，並新增可選的混合搜尋，混合關鍵字與向量排名，讓事故編號等精確 id 排在前面 - [PR #51131](https://github.com/BerriAI/litellm/pull/51131)
- 將 OpenAI 風格的向量儲存搜尋篩選器對映至 Bedrock Knowledge Bases 的 AWS `RetrievalFilter` 形狀，讓篩選搜尋不再以 AWS 400 失敗，格式錯誤的篩選器也會在呼叫 AWS 前收到明確的 400 - [PR #51291](https://github.com/BerriAI/litellm/pull/51291)

### 一般 {#general}

- 為 Bedrock 部署提供 Codex 專用的 Bedrock 執行階段與 Mantle 模型目錄項目，讓 Codex 能看到它實際可透過 LiteLLM 呼叫的模型 - [PR #50743](https://github.com/BerriAI/litellm/pull/50743)
- 讓透過 `custom_provider_map` 註冊的自訂提供者能提供原生 Gemini `generateContent`，讓模型群組能為 Google GenAI SDK 流量混合真正的 Gemini 路徑與自訂路徑 - [PR #51083](https://github.com/BerriAI/litellm/pull/51083)
- 在 `/v1/decisions` 與 `/v1/systemone` 上支援 `gemini/gemini-decision-1` 並追蹤支出，而非以 Unknown Decisions provider 'gemini' 失敗 - [PR #51220](https://github.com/BerriAI/litellm/pull/51220)
- 將 Vertex Interactions 的 GET、取消與 DELETE 呼叫，經由選定的部署路由，檢查對該部署的存取權，並修正 Vertex 取消 URL，讓生命週期呼叫與建立呼叫使用相同的專案 - [PR #51511](https://github.com/BerriAI/litellm/pull/51511)
- 將 Vertex Deep Research 代理程式綁定至各自的部署，新增成本對照表資料列，讓它們的工作不再以 $0 記錄，並將背景成本輪詢延長至 130 分鐘，讓長時間執行仍能計費 - [PR #51517](https://github.com/BerriAI/litellm/pull/51517)

## 管理端點 / UI {#management-endpoints--ui}

### 管理 UI {#admin-ui}

- 將 Request Logs 的模型儲存格保留為該列自身呼叫的模型，其餘模型以小型 +N 計數表示，完整清單保留在懸停彈出視窗中，讓長工作階段不再拉寬欄位 - [PR #49619](https://github.com/BerriAI/litellm/pull/49619)
- 在 `/ui` 前綴下提供 Next.js 導覽 payload，讓預先擷取能再次運作，而非回傳 404，讓管理 UI 的頁面導覽更快 - [PR #50758](https://github.com/BerriAI/litellm/pull/50758)
- 讓升級通知離開請求路徑，並以帶有領域標籤的方式計算修補說明，讓橫幅不再顯示 0 個新功能，首次儀表板請求也不再等待隔絕網路的 proxy - [PR #51027](https://github.com/BerriAI/litellm/pull/51027)
- 讓管理員能從管理 UI，為虛擬金鑰設定每個門檻的預算警示收件者，使用已存在的後端支援 - [PR #51061](https://github.com/BerriAI/litellm/pull/51061)
- 從管理 UI 移除已淘汰的 API Reference 頁面、其路由及其 Developer Tools 側欄項目 - [PR #51246](https://github.com/BerriAI/litellm/pull/51246)
- 從管理 UI 的 Developer Tools 側欄移除已淘汰的 Learning Resources 連結 - [PR #51251](https://github.com/BerriAI/litellm/pull/51251)
- 讓管理員能從 Skill Hub 將較舊的保留技能版本還原為新版本，可附上備註，而非手動重新上傳檔案。非管理員與過時或並行的更新會被拒絕 - [PR #51309](https://github.com/BerriAI/litellm/pull/51309)
- 讓作者能從 Skill Hub 編輯與撤回自己待審的技能提交。所有權與待審狀態在資料庫交易內檢查，過時的核准會被拒絕，編輯後會清除掃描結果 - [PR #51312](https://github.com/BerriAI/litellm/pull/51312)
- 移除獨立的 Model Leaderboard 頁面，因為 Usage 已涵蓋這些比較，並將兩種舊書籤格式都重新導向至 Usage。後端 API 與共用圖表保留 - [PR #51426](https://github.com/BerriAI/litellm/pull/51426)
- 在 UI Settings 下新增 Hide Aria Agent for everyone 設定，讓管理員能為整個部署，從導覽、Usage 頁面、捷徑與直接 Aria URL 移除 Aria - [PR #51506](https://github.com/BerriAI/litellm/pull/51506)
- 在存取群組表單新增向量儲存分頁，並列出群組的儲存（依名稱），包含各團隊頁面上，讓向量儲存存取權能在儀表板中看見並編輯 - [PR #51581](https://github.com/BerriAI/litellm/pull/51581)
- 讓管理員能以 `aria_internal_user_access` 設定控制內部使用者的 Aria 存取權，讓他們能隱藏 Aria，或讓它回答團隊支出的問題，而非僅限自己的支出 - [PR #51641](https://github.com/BerriAI/litellm/pull/51641)

### 客戶管理 {#customer-management}

- 在管理 UI 新增客戶管理（beta）模式，提供列出、建立、編輯、封鎖與解除封鎖客戶的頁面，並查看其用量與計費給它們的金鑰 - [PR #50807](https://github.com/BerriAI/litellm/pull/50807)
- 在客戶頁面上方、Keys 清單上方，顯示每日模型用量、總計、排名與日期選擇器，依伺服器端選定的客戶篩選 - [PR #51419](https://github.com/BerriAI/litellm/pull/51419)
- 從客戶管理移除獨立的 Chargebacks 頁面，改為只在首頁顯示 chargebacks，連同其導覽項目、路由與翻譯一併移除 - [PR #51474](https://github.com/BerriAI/litellm/pull/51474)
- 在清單中顯示客戶組織用量與預算使用率，含支出、請求、tokens、預算百分比與成員數，讓組織能在各報告期間比較 - [PR #51483](https://github.com/BerriAI/litellm/pull/51483)
- 在儀表板為客戶組織新增 Teams、Members 與 Settings 頁面，讓管理員能編輯顯示名稱與預算、選取成員預算範本並管理覆寫，而不變更 ID - [PR #51507](https://github.com/BerriAI/litellm/pull/51507)
- 新增客戶組織的詳細頁面，含 Usage、Customer teams、Customer members 與 Settings 分頁，讓管理員能從儀表板建立與管理客戶團隊與成員 - [PR #51521](https://github.com/BerriAI/litellm/pull/51521)
- 在客戶成員預算表單中讀取並提交 API 既有的 `budget_id`，而非不支援的範本欄位，這也修正了儀表板建置與型別檢查 - [PR #51523](https://github.com/BerriAI/litellm/pull/51523)
- 新增具冪等性的客戶組織與客戶成員 upsert API，讓佈建重試能成功，並以 409 拒絕重複的客戶組織別名，讓它們不再破壞客戶請求 - [PR #51607](https://github.com/BerriAI/litellm/pull/51607)
- 在建立時依名稱、修補時依 id 選取客戶組織的預設預算範本，讓預設值不再需要手動標記，且日後可以移動 - [PR #51636](https://github.com/BerriAI/litellm/pull/51636)
- 讓客戶預算顯示與記錄的重設視窗一致，讓月度與年度設定檔不再顯示 No cap，日曆總計不再將成員預算標記為已用完，表格也與管理摘要相符 - [PR #51658](https://github.com/BerriAI/litellm/pull/51658)
- 為既有客戶新增原子預算群組編輯器，讓群組儲存一次提交，背景重新整理保留草稿，純量範本不再阻擋無關的編輯 - [PR #51661](https://github.com/BerriAI/litellm/pull/51661)
- 在客戶用量頁面上，於 Usage over time 之後、Top models 之上方顯示成員支出，讓管理員不再需要捲過模型表格才能看到誰花了錢 - [PR #51677](https://github.com/BerriAI/litellm/pull/51677)
- 讓客戶組織、團隊與成員的設定分頁全寬顯示，讓表單與標頭及分頁對齊，而非侷限在狹窄的左欄 - [PR #51700](https://github.com/BerriAI/litellm/pull/51700)
- 顯示整體客戶用量總計，並讓管理員能依預算排序客戶，讓總計不再只涵蓋可見頁面，新建立的客戶也不再出現在最後 - [PR #51713](https://github.com/BerriAI/litellm/pull/51713)
- 在客戶團隊與成員表格重用新的用量支出設計，讓每個客戶管理表格的外觀與行為一致 - [PR #51724](https://github.com/BerriAI/litellm/pull/51724)
- 將 Customer Portal 更名為 Customer Management，涵蓋每個面向使用者的標籤，符合產品的新名稱 - [PR #51891](https://github.com/BerriAI/litellm/pull/51891)
- 釐清客戶用量期間，並在導覽時保留選定的日期範圍，讓客戶詳細檢視在本地午夜過後仍包含當日的 UTC 用量 - [PR #51899](https://github.com/BerriAI/litellm/pull/51899)
- 將客戶管理的用量範圍預設為本月至今，讓未選日期開啟時不再顯示完整日曆月，也不再將未來的結束日期帶入組織連結 - [PR #51923](https://github.com/BerriAI/litellm/pull/51923)

### 警示 {#alerts}

- 新增保存的警示表格與列出、讀取及更新警示狀態的 API。管理員與唯讀管理員可讀取警示，只有管理員能解決、關閉或重新開啟它們 - [PR #50658](https://github.com/BerriAI/litellm/pull/50658)
- 新增可選擇加入的警示，針對支出激增、流量變化、回應變慢與錯誤率上升，比較昨日用量與前七日平均，涵蓋閘道、模型、團隊、使用者與金鑰 - [PR #50666](https://github.com/BerriAI/litellm/pull/50666)
- 在 Anthropic 聊天、`/v1/completions`、`/v1/responses` 與 `/v1/messages` 的串流錯誤警示中，指出 API 基礎、模型群組與部署，讓管理員能分辨哪個部署在串流中途故障 - [PR #51034](https://github.com/BerriAI/litellm/pull/51034)
- 在警示頁面上同時顯示效能警示與模型淘汰，含用量圖表、受影響資源 Activity 頁面的連結，以及解決或關閉警示的選項 - [PR #51104](https://github.com/BerriAI/litellm/pull/51104)
- 預設開啟效能監控，並提供管理員開關以關閉它，非 Enterprise 閘道在偵測停止前有五則效能警示，Enterprise 閘道則無上限 - [PR #51123](https://github.com/BerriAI/litellm/pull/51123)
- 在效能警示中停止偵測流量下降，只保留流量激增，讓平靜的日子不再為眾多資源產生下降警示 - [PR #51338](https://github.com/BerriAI/litellm/pull/51338)
- 為管理員新增 Manage alerts 控制項，含閘道層級的淘汰警示開關，以及可選擇加入的每日效能摘要（電子郵件與 Slack），並更新電子郵件設定文字以涵蓋兩個類別 - [PR #51418](https://github.com/BerriAI/litellm/pull/51418)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 除非管理員選擇加入，否則拒絕用戶端提供的 Vertex 位置與專案值，讓呼叫者無法將 proxy 的 Google 服務帳號指向管理員未選定的專案或區域 - [PR #47028](https://github.com/BerriAI/litellm/pull/47028)
- 讓存取群組能持有向量儲存，讓管理員不再逐一將儲存加入每個金鑰或團隊，儲存的計數方式與團隊或金鑰自有清單上的相同 - [PR #50290](https://github.com/BerriAI/litellm/pull/50290)
- 透過主體屬性規則授權既有的存取群組，讓管理員能將 JWT 聲明對映至存取群組，同時可編輯的個人資料欄位永遠不會成為存取權來源 - [PR #50455](https://github.com/BerriAI/litellm/pull/50455)
- 當 `general_settings.fips_mode` 為 true 時，只以 FIPS 提供者的金鑰衍生、隨機產生器、AES 與 HMAC 建立儀表板外掛程式工作階段聲明 - [PR #50544](https://github.com/BerriAI/litellm/pull/50544)
- 當預算強制執行發現團隊使用者沒有成員資料列時，改回 403 並指出 `/team/member_add`，而非 503，讓錯誤告知管理員如何修正金鑰 - [PR #50603](https://github.com/BerriAI/litellm/pull/50603)
- 對 `/customer/new` 與 `/customer/update` 上的未知欄位，以 422 回應並逐一指出欄位，而非默默捨棄，讓 `tpm_limti` 等錯字不再看似已套用 - [PR #50965](https://github.com/BerriAI/litellm/pull/50965)
- 允許僅限 `management_routes` 的金鑰呼叫 `PATCH /model/{model_id}/update`，讓部分模型更新不再回傳 403 - [PR #50979](https://github.com/BerriAI/litellm/pull/50979)
- 在解析 CLI 工作階段授權時，重新檢查被快取為不存在的使用者，讓剛登入的使用者在大量並行登入後不再被拒絕為不存在 - [PR #51030](https://github.com/BerriAI/litellm/pull/51030)
- 在建立或更新金鑰、使用者、團隊與專案時拒絕未知的防護欄名稱，讓錯字與不存在的防護欄不再能被儲存 - [PR #51080](https://github.com/BerriAI/litellm/pull/51080)
- 依處理器實際選定的模型檢查模型存取權，適用於 Google 生成與 Azure 風格影像 URL 路由，同時保留已設定的模型覆寫與正常的預算備援 - [PR #51226](https://github.com/BerriAI/litellm/pull/51226)
- 在金鑰的整體或每模型預算用完後，仍允許檢查影片狀態與下載已完成的影片，新的影片生成則仍受預算限制 - [PR #51227](https://github.com/BerriAI/litellm/pull/51227)
- 在儀表板上遵守使用者、團隊與團隊存取群組對私人技能的授權，讓成員能看到自己有權存取的私人技能，並在使用者設定新增直接的 Skills 授權控制項 - [PR #51416](https://github.com/BerriAI/litellm/pull/51416)
- 在請求固定部署 ID 時強制執行模型存取群組，同時保持有效的萬用字元權限能運作 - [PR #51442](https://github.com/BerriAI/litellm/pull/51442)
- 在選擇加入的虛擬金鑰到期前，以電子郵件通知金鑰擁有者，使用具備全域開啟開關與每金鑰選擇加入的背景工作，讓擁有者能提前收到通知，而非突然收到 401 - [PR #51482](https://github.com/BerriAI/litellm/pull/51482)
- 在存取群組回應上回傳向量儲存名稱，並在團隊資訊上列出團隊透過存取群組取得的向量儲存，讓儀表板能同時顯示兩者 - [PR #51484](https://github.com/BerriAI/litellm/pull/51484)
- 讓儀表板工作階段使用使用者的團隊模型與團隊存取群組，讓模型存取權僅來自團隊的使用者不再讓 Aria 顯示 No available models - [PR #51663](https://github.com/BerriAI/litellm/pull/51663)
- 在請求驗證失敗時保留 `x-litellm-spend-logs-metadata` 標頭，包含無效金鑰與超出預算，讓失敗的支出記錄與回呼帶有呼叫者中繼資料 - [PR #51745](https://github.com/BerriAI/litellm/pull/51745)
- 將登入電子郵件備援對映至正確的使用者，適用於 JWT 與 UI SSO，讓新的登入 id 只選取電子郵件完全相符且未被標記為未驗證的未連結使用者 - [PR #51897](https://github.com/BerriAI/litellm/pull/51897)

### SSO 與 SCIM {#sso-and-scim}

- 修正 Microsoft 與 Google SSO 登入回傳 500（缺少用戶端密鑰）的問題，該問題發生於管理員在同一時刻移除 SSO 用戶端，修正方式為將密鑰與用戶端 id 一起讀取 - [PR #50773](https://github.com/BerriAI/litellm/pull/50773)
- 跳過沒有對應團隊的 SCIM 群組，讓來自身分提供者的 PATCH 或 PUT 仍能停用使用者，而非回傳 404 並讓其金鑰繼續有效 - [PR #51829](https://github.com/BerriAI/litellm/pull/51829)

### 模型管理 {#model-management}

- 為部分別名（例如 `team1/gpt-*`）列出可呼叫的 id，涵蓋 catch-all 部署，讓每個列出的模型 id 都能運作，而非回傳 400 - [PR #50963](https://github.com/BerriAI/litellm/pull/50963)
- 以模式的呼叫型別與模型 id 記錄 Test Connection 的支出，讓影像與其他非聊天健康檢查不再記錄 $0 與支出記錄中的空白 `model_id` - [PR #50987](https://github.com/BerriAI/litellm/pull/50987)
- 在 `/model_group/info` 上列出金鑰與團隊的模型別名，並對它們套用清單回呼，讓 pi、OpenCode 與 Codex 能看到別名及其上下文視窗與推理層級 - [PR #51754](https://github.com/BerriAI/litellm/pull/51754)
- 不再讓提供者沒有的組織上的萬用字元別名，於模型端點列出每個目錄 id，列出的模型隨後都會以 404 失敗 - [PR #51805](https://github.com/BerriAI/litellm/pull/51805)
- 拒絕非 proxy 管理員的團隊模型寫入帶入新的 `os.environ/` 值，避免團隊模型寫入帶入 proxy 層級設定，團隊管理員仍可儲存原樣送回的模型 - [PR #51874](https://github.com/BerriAI/litellm/pull/51874)

### 用量與分析 {#usage-and-analytics}

- 在金鑰、團隊、使用者與模型詳細頁面新增 Activity 分頁，重用 Usage 圖表與 API，讓用量不需離開頁面即可看見 - [PR #50630](https://github.com/BerriAI/litellm/pull/50630)
- 先依 `request_id` 開啟 Logs 抽屜，只有在找不到時才退回 `litellm_call_id`，讓它不再於缺少呼叫 id 索引的支出記錄表格上卡住 30 秒 - [PR #50789](https://github.com/BerriAI/litellm/pull/50789)

### Proxy 設定 {#proxy-configuration}

- 當 `fips_mode` 開啟時，以 SHA-256 雜湊 MCP 建議鎖定金鑰，讓在 FIPS Python 上建立或重新命名 MCP 伺服器，以及儲存使用者的 MCP 環境變數，不再回傳 500 - [PR #51165](https://github.com/BerriAI/litellm/pull/51165)
- 讓備援設定寫入在 PostgreSQL 中具原子性，並立即從已儲存的設定提供備援 GET，讓並行寫入不再互相覆寫，Terraform 也不再因過時的副本讀取而失敗 - [PR #51245](https://github.com/BerriAI/litellm/pull/51245)
- 恢復管理 MCP 連接器固定的 `/budget/new` 與 `/budget/update` operation id，先前的處理器更名曾變更它們 - [PR #51959](https://github.com/BerriAI/litellm/pull/51959)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- 將完整模型目錄傳送給 Codex 0.166.0-alpha.1 及更新版本，而非修剪至 1 MB 的清單，因為舊版 Codex 會捨棄較大的清單，新版則不會 - [PR #50736](https://github.com/BerriAI/litellm/pull/50736)
- 只在 Codex 目錄中為成本對照表指出支援視覺的模型列出影像，並在模型背後的任一部署關閉視覺時關閉它 - [PR #50738](https://github.com/BerriAI/litellm/pull/50738)
- 新增 CLI 指令，透過 github.com 上的裝置碼連接每位使用者的 GitHub Copilot 憑證，讓沒有管理 UI 存取權的開發者能連結自己的帳號 - [PR #50863](https://github.com/BerriAI/litellm/pull/50863)
- 在 `lite login --pkce --config-claude` 之後，將 Claude Code 的 `apiKeyHelper` 指向 `lite auth print-token`，讓金鑰自行更新，開發者不再遇到 401 Expired Key，也不再每天重新核准 SSO - [PR #51319](https://github.com/BerriAI/litellm/pull/51319)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 新增 CollieAi 作為原生防護欄，依 CollieAi 政策檢查提示詞與回應。預設僅觀察，在防護欄記錄中記錄每項發現，並在設定中設為封鎖模式時強制執行 - [PR #49224](https://github.com/BerriAI/litellm/pull/49224)
- 使用金鑰或團隊中繼資料中的 `rac_agent_id` 套用代理程式範圍的 Rubrik 政策，並在模型呼叫前審核 `/v1/completions` 提示詞，讓文字補全提示詞不再未經檢查就抵達 webhook - [PR #49912](https://github.com/BerriAI/litellm/pull/49912)
- 當封鎖發生在聊天、文字補全與 Anthropic messages 請求的 SSE keepalive ping 之後，串流防護欄封鎖訊息，而非以錯誤結束串流 - [PR #51114](https://github.com/BerriAI/litellm/pull/51114)
- 將防護欄的建立、更新與刪除變更寫入稽核記錄，只儲存固定的欄位清單，讓密鑰永遠不會被記錄 - [PR #51118](https://github.com/BerriAI/litellm/pull/51118)
- 為 Straiker 的 408、429 與 500 回應新增 `stream_mode` 選項、每階段記錄與 fail open 處理，並以 HTTP 200 回覆被封鎖的提示詞，而非在聊天、messages 與 responses 路由上回傳 400 - [PR #51401](https://github.com/BerriAI/litellm/pull/51401)

### 記錄與可觀測性 {#logging-and-observability}

- 序列化 `langfuse_otel`、`weave_otel` 與 `langtrace` 中以 `messages` 傳入的 `litellm.Message` 物件，讓 token 用量與模型參數被記錄，每次呼叫的錯誤不再出現 - [PR #46845](https://github.com/BerriAI/litellm/pull/46845)
- 為串流請求記錄 `litellm_overhead_latency_metric`，包含 proxy 的首個 chunk 工作，讓 Prometheus 的額外負擔指標不再缺少串流資料 - [PR #49920](https://github.com/BerriAI/litellm/pull/49920)
- 讓金鑰的記錄回呼項目能參照由 proxy 管理員設定的閘道憑證，讓每金鑰的 Arize 追蹤不再需要在每個金鑰的中繼資料中貼上憑證 - [PR #50572](https://github.com/BerriAI/litellm/pull/50572)
- 讓團隊或金鑰的 OTel v2 目的地能設定自己的 `baggage_metadata_keys`，讓共用 proxy 上的團隊能選擇哪些請求中繼資料進入其追蹤，而不需變更環境變數 - [PR #50813](https://github.com/BerriAI/litellm/pull/50813)
- 新增 CustomLoggerV2 的型別、分派器與回呼呼叫點，將每個舊版 `CustomLogger` 包裝為 V2 回呼，讓原生 V2 回呼能在同一個有序清單的任何位置 - [PR #51214](https://github.com/BerriAI/litellm/pull/51214)
- 在 OTel v2 追蹤上傳送 Langfuse 環境、發行版與版本，讓 `LANGFUSE_TRACING_ENVIRONMENT` 與每金鑰或團隊的 `langfuse_environment` 不再落入 `default` 環境 - [PR #51385](https://github.com/BerriAI/litellm/pull/51385)
- 為動態速率限制器新增三個 Prometheus 數列，涵蓋團隊在模型上的配額、超出配額的程度，以及節流原因，`reason` 標籤與 429 的 `rate_limited_by` 標頭相符 - [PR #51417](https://github.com/BerriAI/litellm/pull/51417)
- 當設定 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，在實驗性 GenAI 追蹤的 `gen_ai.response.model` 上回報提供者的實際模型，而非面向用戶端的別名 - [PR #51430](https://github.com/BerriAI/litellm/pull/51430)
- 在未復原用量時，將失敗聊天 span 上的提供者 token 用量標記為未知，並為純文字提示詞新增單獨的估計輸入 token 計數。計費與成功請求的用量維持不變 - [PR #51443](https://github.com/BerriAI/litellm/pull/51443)
- 新增 Rust 回呼在 CustomLoggerV2 中的合約，包含它們讀取的具型別欄位，以及在呼叫中途向 Python 索取資料的方式。此變更未隨附任何 Rust 回呼 - [PR #51526](https://github.com/BerriAI/litellm/pull/51526)
- 在 Langfuse OTEL 中只為待處理的失敗用量欄位保留 span 容量，讓接近屬性上限的失敗請求保留既有屬性，仍能回報用量 - [PR #51538](https://github.com/BerriAI/litellm/pull/51538)
- 以 Rust 回呼取代 Python `s3_v2` 記錄器，保留相同的名稱、設定、物件鍵、批次處理與重試，讓 S3 記錄設定不需變更 - [PR #51539](https://github.com/BerriAI/litellm/pull/51539)
- 在記錄的訊息中保留內容區塊形式的系統提示詞，讓 Claude Code 以區塊清單傳送至 `/v1/messages` 的系統提示詞，現在出現在每個記錄器的標準記錄 payload 中 - [PR #51699](https://github.com/BerriAI/litellm/pull/51699)
- 新增 `LITELLM_OTEL_LANGFUSE_DESTINATION_SPAN_SCOPE` 設定，讓金鑰與團隊的 Langfuse 目的地能預設為 `llm_only`，而不需在每個金鑰上設定。明確的 `langfuse_span_scope` 仍優先 - [PR #51726](https://github.com/BerriAI/litellm/pull/51726)
- 每個同步橋接的 Responses 串流只傳送一次非同步成功記錄，讓自訂記錄器 hook 與成功回呼不再為單次呼叫執行三或四次 - [PR #51787](https://github.com/BerriAI/litellm/pull/51787)

### 提示詞管理 {#prompt-management}

- 保留 Complexity Router 選定提示詞的溫度與輸出 token 上限，適用於 Chat Completions 上的 Dotprompt 與 Langfuse，衝突時以範本設定為準 - [PR #51702](https://github.com/BerriAI/litellm/pull/51702)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 客戶階層 {#customer-hierarchy}

- 依金鑰目前的團隊拆分客戶支出，在客戶用量路由上提供 `teams` 細分與 `team_ids` 篩選，讓管理員能看到每個團隊為一位客戶花了多少 - [PR #50764](https://github.com/BerriAI/litellm/pull/50764)
- 跨 worker 重設已刪除客戶的支出計數器，讓以相同 id 重新建立客戶時從頭開始，不再因過時的預算封鎖而被拒絕 - [PR #51224](https://github.com/BerriAI/litellm/pull/51224)
- 對以 JWT 驗證的請求強制執行客戶預算的 `rpm_limit` 與 `tpm_limit`，如同已對虛擬金鑰的做法，讓 JWT 呼叫者不再能超出其客戶的速率限制 - [PR #51405](https://github.com/BerriAI/litellm/pull/51405)
- 新增客戶組織、團隊與成員階層，含預算範本，讓轉售閘道的平台能為每個層級提供自己的預算，並跨成員共用具名的預設預算 - [PR #51459](https://github.com/BerriAI/litellm/pull/51459)
- 在請求路徑上強制執行客戶組織、團隊與成員的預算與速率限制，含每日支出追蹤與定期預算重設，讓儲存的客戶預算現在能管理傳入的請求 - [PR #51489](https://github.com/BerriAI/litellm/pull/51489)
- 將每日客戶用量資料列加入既有的會計交付，並透過既有的重設工作重設客戶預算，讓客戶取得每日歷史記錄與定期預算重設 - [PR #51493](https://github.com/BerriAI/litellm/pull/51493)
- 透過會計帳本與共用的每日分析，新增依客戶組織、團隊與成員的客戶用量追蹤與深入檢視，讓客戶管理能顯示每個層級的支出 - [PR #51495](https://github.com/BerriAI/litellm/pull/51495)
- 在首次請求時，將未知的客戶成員註冊至別名組織的 `default` 團隊，讓客戶的新使用者不再因管理員尚未建立他們而收到 401 - [PR #51546](https://github.com/BerriAI/litellm/pull/51546)
- 讓未知客戶 id 的請求以未追蹤方式執行，而非以 401 拒絕，讓缺少的客戶記錄不再導致流量失敗。不相符或含糊的別名仍回傳 403 或 400 - [PR #51548](https://github.com/BerriAI/litellm/pull/51548)
- 透過 Redis 跨 worker 強制執行已結算的客戶預算，讓三個 worker 上的 $100 預算不再讓客戶最多花費 $300 - [PR #51568](https://github.com/BerriAI/litellm/pull/51568)
- 在客戶組織、客戶團隊或客戶成員跨越預算時傳送 webhook 警示，並讓月度預算在副本延遲下不再重複警示或錯過最後一次跨越 - [PR #51579](https://github.com/BerriAI/litellm/pull/51579)
- 新增客戶預算彙總，依每個預算資料列的視窗重設，含具名範本、團隊覆寫、月度加年度上限，以及具備管理員審查的增加請求佇列的 `pause_allow_increase` 上限政策 - [PR #51582](https://github.com/BerriAI/litellm/pull/51582)
- 將未知的 `x-litellm-customer-org-alias` 註冊為新的組織，並對該請求收費，讓客戶的首次請求建立自己的組織，而非以未追蹤方式執行 - [PR #51637](https://github.com/BerriAI/litellm/pull/51637)
- 在階層結構描述變更後修正客戶預算警示 webhook，讓定期警示依期間去重，成員警示不再查詢已移除的關聯，團隊警示使用有效的預算 - [PR #51645](https://github.com/BerriAI/litellm/pull/51645)
- 在客戶組織沒有預設預算時，為沒有預算的客戶成員註冊，讓首次請求不再捨棄成員，且其支出被追蹤 - [PR #51660](https://github.com/BerriAI/litellm/pull/51660)
- 捨棄未搭配 `budget_override` 傳送的客戶 `budget_override_expires_at`，讓過期的到期時間不再使後續的覆寫被默默忽略 - [PR #51667](https://github.com/BerriAI/litellm/pull/51667)
- 在註冊未知的組織別名之前，拒絕固定至一個客戶組織的金鑰，讓 403 在寫入新的組織資料列之前回傳 - [PR #51674](https://github.com/BerriAI/litellm/pull/51674)
- 為客戶管理新增免費層級上限與 Enterprise 升級路徑，在達到上限時於儀表板顯示免費層級備註與警告橫幅 - [PR #51687](https://github.com/BerriAI/litellm/pull/51687)
- 防止客戶預算重設被過時的階層快取項目撤銷，讓請求在資料庫支出已重設為 0 後不再收到 `ExceededBudget` - [PR #51694](https://github.com/BerriAI/litellm/pull/51694)
- 在沒有團隊的成員 upsert 上保留既有成員資格，並依組織界定免費層級容量鎖定，讓既有成員在 5 個團隊時不再收到 403，建立也不再序列化 - [PR #51698](https://github.com/BerriAI/litellm/pull/51698)
- 當團隊沒有整體預算時，刪除客戶團隊的覆寫預算，讓刪除這類團隊不再於 `LiteLLM_BudgetTable` 留下無法觸及的資料列 - [PR #51703](https://github.com/BerriAI/litellm/pull/51703)
- 讓管理員能在 Members 分頁依 ID 或別名搜尋客戶成員，讓他們不再需要一次 20 筆地翻頁 - [PR #51896](https://github.com/BerriAI/litellm/pull/51896)
- 讓管理員能透過 API 與 UI 在團隊之間移動既有的客戶成員，讓成員不再需要重新建立並遺失歷史記錄 - [PR #51913](https://github.com/BerriAI/litellm/pull/51913)
- 在排定的預算重設之間保留無上限的客戶組織、團隊與成員支出，讓支出不再低於加總的每日用量 - [PR #51918](https://github.com/BerriAI/litellm/pull/51918)
- 在客戶管理中依預算上限排序客戶組織、團隊與成員 - [PR #51924](https://github.com/BerriAI/litellm/pull/51924)
- 在交易逾時內串聯刪除大型的客戶組織，讓刪除擁有數千個團隊的組織不再以誤導的資料庫錯誤失敗 - [PR #51969](https://github.com/BerriAI/litellm/pull/51969)

### 成本追蹤 {#cost-tracking}

- 依提供者在用量中回報的秒數為 OpenAI 轉錄計費，而非從音訊檔案推測 - [PR #50727](https://github.com/BerriAI/litellm/pull/50727)
- 為路由器備援的被拒回應（例如內容違規）計費，讓重試的請求不再未計費 - [PR #50735](https://github.com/BerriAI/litellm/pull/50735)
- 只對 OpenAI 或 Azure 透傳背景回應計費一次，涵蓋重複讀取，讓輪詢已完成的回應不再每次讀取都收取完整成本 - [PR #50841](https://github.com/BerriAI/litellm/pull/50841)
- 不再將標頭中沒有取樣數的 FLAC 以 576 兆秒計費，這曾產生荒謬的成本並鎖定金鑰 - [PR #50842](https://github.com/BerriAI/litellm/pull/50842)
- 使用新的 `cache_read_input_image_token_cost_batches` 欄位，為 OpenAI 影像模型的批次快取影像輸入 tokens 計費，而非文字快取費率 - [PR #50997](https://github.com/BerriAI/litellm/pull/50997)
- 以文字、思考與影像 tokens 各自的費率為 Vertex Gemini 影像呼叫計費，Vertex 以 Priority 提供呼叫時使用 Priority 價格，讓影像支出不再多算或少算 - [PR #51017](https://github.com/BerriAI/litellm/pull/51017)
- 依 Vertex 回傳的 token 計數為 Vertex Gemini 影像編輯計費，輸入、文字與影像 tokens 各自定價，而非固定的每張影像費用 - [PR #51038](https://github.com/BerriAI/litellm/pull/51038)
- 在串流聊天與 Responses 呼叫上，對 token 費率明確為零者回報零成本，讓 `usage.cost` 不再於免費呼叫上省略，缺少價格時成本仍維持未設定 - [PR #51093](https://github.com/BerriAI/litellm/pull/51093)
- 以新的 `output_cost_per_video` 欄位為固定每支影片計費的 fal.ai 模型計費，涵蓋 27 個影片模型，讓它們的支出不再是 $0，`/fal_ai` 透傳也不再為它們回傳 400 - [PR #51225](https://github.com/BerriAI/litellm/pull/51225)
- 依部署的自訂價格為 Anthropic 透傳呼叫（含串流）計費，使用覆寫與呼叫前 hook 後實際送往上游的模型，並遵守團隊資格 - [PR #51267](https://github.com/BerriAI/litellm/pull/51267)
- 防止管理 UI 中進行的成本利潤或折扣變更，被進行中的設定重新載入撤銷，讓變更後立即提出的請求依新價格計費 - [PR #51273](https://github.com/BerriAI/litellm/pull/51273)
- 當 Bedrock 回傳不含區域前綴的模型時，保留串流與非串流 Messages 請求的 Bedrock 跨區域定價，包含快取 tokens，讓記錄的支出與用戶端可見的成本相符 - [PR #51479](https://github.com/BerriAI/litellm/pull/51479)
- 對沒有解析度的 fal 影片請求，依該資料列的預設費率計費，而非 720p 層級，讓預設以 1080p 或 480p 執行的模型正確計費 - [PR #51665](https://github.com/BerriAI/litellm/pull/51665)
- 依期間與解析度為 fal 影片片段計費，讓已設定的每片段價格（例如 Pixverse 的價格）被收取，而非 $0 或每秒備援價格 - [PR #51679](https://github.com/BerriAI/litellm/pull/51679)
- 讓部署的每秒影片價格優先於成本對照表資料列的固定價格，讓具備 `off_peak_pricing` 或自訂每秒費率的部署不再以目錄的固定費率計費 - [PR #51688](https://github.com/BerriAI/litellm/pull/51688)

### 支出記錄與每日彙總 {#spend-logs-and-daily-rollups}

- 為設定定義的透傳端點上的失敗請求寫入支出記錄資料列，讓自訂路由上的失敗不再被默默捨棄，內建路由的失敗也帶有填入的 `api_base` - [PR #41831](https://github.com/BerriAI/litellm/pull/41831)
- 新增 `general_settings.redact_tokens_in_spend_logs`，在寫入資料列之前，遮罩儲存的支出記錄請求與回應主體中形似 token 的值，例如提供者金鑰、JWT 與 PEM 金鑰。預設為關閉 - [PR #48968](https://github.com/BerriAI/litellm/pull/48968)
- 從資料庫支援的排定工作表格執行支出記錄清理，讓工作在重新啟動後繼續存在，保留執行的稽核軌跡，不再依賴副本的本機記憶體 - [PR #50131](https://github.com/BerriAI/litellm/pull/50131)
- 當支出收集器開啟時，在程序內寫入 OpenAI 透傳背景回應的結算讀取，讓其成本資料列出現在支出記錄中，並與金鑰的支出相符 - [PR #50957](https://github.com/BerriAI/litellm/pull/50957)
- 在每日活動中以新的 `guardrail_spend` 欄位單獨回報防護欄支出，讓自行支付防護欄的租戶不再於模型支出中被重複計費 - [PR #51010](https://github.com/BerriAI/litellm/pull/51010)
- 在擁有者範圍的支出記錄讀取中，保留未帶 API 金鑰記錄的資料列，讓依使用者或團隊篩選的管理員與團隊成員，在索引變更後看到與先前相同的資料列 - [PR #51127](https://github.com/BerriAI/litellm/pull/51127)
- 保留 `/v1/messages` 上非串流網頁搜尋的第一輪支出資料列，含其自己的上游 ID、用量與成本，而非在後續呼叫共用回應 ID 時捨棄它 - [PR #51441](https://github.com/BerriAI/litellm/pull/51441)
- 在支出記錄中顯示客戶身分，於 Metrics 下方提供可收合的 Customer 區段與可識別的客戶標籤，並不再為未授權的請求保存另一位客戶的階層 - [PR #51596](https://github.com/BerriAI/litellm/pull/51596)
- 除非 `general_settings.redact_tokens_in_spend_logs` 為 true，否則關閉支出記錄的 token 遮罩，讓預設的支出記錄不需支付掃描儲存文字的 CPU 成本 - [PR #51729](https://github.com/BerriAI/litellm/pull/51729)

### 預算 {#budgets}

- 在金鑰、團隊、使用者與組織的 Prometheus 剩餘預算量測中顯示已承諾的支出，讓免費請求不再將它們重設為較舊的值，客戶量測也不再每次收費扣減兩次 - [PR #49199](https://github.com/BerriAI/litellm/pull/49199)
- 讓排定的金鑰、使用者與團隊支出重設具冪等性，讓重疊的重設不再重複扣除同一筆支出，浮點數殘值不再顯示為微小的負餘額，支出也永遠不會低於零 - [PR #50298](https://github.com/BerriAI/litellm/pull/50298)
- 當另一位 worker 的會計維護鎖定被孤立時，仍繼續將待處理支出套用至金鑰、團隊與使用者，讓預算與 `/key/info` 不再於最多一分鐘內讀數偏低 - [PR #50774](https://github.com/BerriAI/litellm/pull/50774)
- 在預算與客戶中新增每模型對映的 `model_tpm_limit` 與 `model_rpm_limit`，並拒絕負值，而非默默捨棄 - [PR #50797](https://github.com/BerriAI/litellm/pull/50797)
- 依金鑰或團隊別名實際提供的模型判斷零成本預算豁免，讓免費別名不再收到 422，別名指向付費模型的免費名稱也不再跳過預算 - [PR #51058](https://github.com/BerriAI/litellm/pull/51058)
- 記錄每位終端使用者、客戶團隊與客戶成員上次預算重設的視窗，讓重試的重設工作不再捨棄應帶入新視窗的支出 - [PR #51143](https://github.com/BerriAI/litellm/pull/51143)
- 支援年度預算，`12mo` 期間依設定的時區與重設時間於 1 月 1 日重設，並計算完整的日曆年，包含閏日 - [PR #51508](https://github.com/BerriAI/litellm/pull/51508)
- 以 Rust 引擎取代 Python 的預算保留與結算引擎，在驗證時受理請求時保留、調整、釋放與結算預算 - [PR #51535](https://github.com/BerriAI/litellm/pull/51535)
- 修正預算更新回傳內部錯誤的問題，原因是客戶查詢要求了不存在的關聯，並透過儲存的組織與團隊 id 重新整理繼承的預算快取 - [PR #51654](https://github.com/BerriAI/litellm/pull/51654)
- 在內部使用者上支援 `budget_limits` 視窗，讓使用者能同時擁有月度上限與嚴格的小時上限，如同金鑰與團隊已有的，率先用完的視窗會阻擋請求 - [PR #51763](https://github.com/BerriAI/litellm/pull/51763)
- 將預算視窗開始時間對映至儲存的毫秒精度，讓帶有微秒的 `reset_at` 不再使記錄的視窗支出讀數為零 - [PR #51921](https://github.com/BerriAI/litellm/pull/51921)

### 速率限制 {#rate-limiting}

- 在傳送最後一個事件之前，計算 Responses WebSocket 輪次的 tokens，讓具備 `tpm` 上限的用量型路由在下一個輪次回傳 429，而非晚一個輪次 - [PR #50730](https://github.com/BerriAI/litellm/pull/50730)
- 在 v3 限制器中強制執行每客戶每模型的 `model_tpm_limit` 與 `model_rpm_limit`，讓一位客戶無法透過眾多金鑰與副本超出模型的配額 - [PR #50857](https://github.com/BerriAI/litellm/pull/50857)
- 在重試與備援目標上重新檢查並保留每模型的 `model_rpm_limit` 與 `model_tpm_limit`，讓備援模型不再能被呼叫至超出上限 - [PR #50994](https://github.com/BerriAI/litellm/pull/50994)
- 將備援的 tokens 結算至實際提供請求的模型群組，並將保留的估計值歸還給請求的模型，讓 v3 速率限制計入正確的群組 - [PR #51082](https://github.com/BerriAI/litellm/pull/51082)
- 在速率限制 429 回應新增 `rate_limited_by` 標頭，指出觸發的限制，例如客戶的每模型配額、金鑰或團隊，讓用戶端不再需要解析訊息 - [PR #51228](https://github.com/BerriAI/litellm/pull/51228)
- 新增 `team_model_limit_borrows_idle_capacity_from_other_teams`，讓團隊的模型 TPM 與 RPM 上限能在動態速率限制器中借用閒置容量，而非在模型閒置時回傳 429 - [PR #51328](https://github.com/BerriAI/litellm/pull/51328)
- 讓團隊能在其中繼資料選擇加入 `model_preferences`，讓飽和模型的請求由低於 `saturation_threshold` 的允許替代模型提供，並以回應標頭指出轉向 - [PR #51350](https://github.com/BerriAI/litellm/pull/51350)
- 新增 `team_model_limit_max_borrow_multiple`，限制單一團隊借用閒置模型容量的程度，讓單一團隊無法取走大部分閒置的 TPM 與 RPM - [PR #51359](https://github.com/BerriAI/litellm/pull/51359)
- 新增 `priority_class_share_splits_equally_among_active_teams`，讓優先順序類別的配額在模型上活躍的團隊之間拆分，而非一個團隊掏空池子、隊友收到 429 - [PR #51366](https://github.com/BerriAI/litellm/pull/51366)
- 將路由器備援、巢狀呼叫、Responses WebSocket 輪次與過大的提示詞，限制在借用團隊的模型配額內，讓它們不再跳過或濫用團隊的借用容量上限 - [PR #51367](https://github.com/BerriAI/litellm/pull/51367)
- 在模型飽和後，將借用閒置容量的團隊的完整配額歸還，讓閒置期間的 tokens 不再計入該團隊並導致立即被拒 - [PR #51415](https://github.com/BerriAI/litellm/pull/51415)
- 在 proxy 自身的 429 上執行團隊的 `router_settings.fallbacks`，並新增可選擇加入的 `router_settings.fallback_on_saturation`，在 `saturation_threshold` 開始備援巡覽，取代團隊的 `model_preferences` - [PR #51439](https://github.com/BerriAI/litellm/pull/51439)
- 將設有上限的借用團隊的上限保留在其自己的計數器 `model_per_team_max_borrow_multiple` 上，讓閒置用量不再計入該團隊，並在模型飽和時取得新的配額 - [PR #51494](https://github.com/BerriAI/litellm/pull/51494)
- 在專案上新增每模型批次佇列 token 上限，讓管理員能限制一個應用程式為某模型排入佇列的批次 tokens 數量，避免它為團隊的其他人填滿佇列 - [PR #51608](https://github.com/BerriAI/litellm/pull/51608)
- 讓客戶組織與金鑰能在動態速率限制器中借用閒置的模型容量並拆分類別配額，而非將它們的每模型上限視為硬性上限 - [PR #51705](https://github.com/BerriAI/litellm/pull/51705)
- 發佈團隊在模型閒置期間提供請求的配額量測，讓具備每模型 token 配額的團隊，以零借用 tokens 出現在動態速率限制器儀表板上 - [PR #51709](https://github.com/BerriAI/litellm/pull/51709)
- 將模型閒置期間使用的 tokens 計入團隊的類別配額，讓 `priority_class_share_config.split_equally_among_active` 保護輕量團隊免於被餓死 - [PR #51952](https://github.com/BerriAI/litellm/pull/51952)

## MCP 閘道 {#mcp-gateway}

### 驗證與 OAuth {#auth-and-oauth}

- 當上游拒絕憑證且使用者可重新登入時，以閘道自身的 401 挑戰回應單一伺服器 MCP 清單，讓用戶端不再將已撤銷的連線顯示為已連線且有 0 個工具 - [PR #50389](https://github.com/BerriAI/litellm/pull/50389)
- 當管理員在 Extra Headers 中列出 LiteLLM 金鑰，或呼叫者傳送 `x-mcp-{alias}-authorization` 或 `x-mcp-auth` 時，將 LiteLLM 金鑰轉送至 MCP 伺服器，恢復先前版本中捨棄的行為 - [PR #50604](https://github.com/BerriAI/litellm/pull/50604)
- 在 MCP 連接檢查上接受以逗號分隔的廠商範圍授權，讓重新連接過期 Slack 登入的使用者不再於 Slack 與連接頁面之間循環 - [PR #50717](https://github.com/BerriAI/litellm/pull/50717)
- 將 MCP 閘道登入範圍限定為連接頁面上選取的伺服器，讓關閉的伺服器不再觸及程式設計工具，所有伺服器預設皆開啟 - [PR #50973](https://github.com/BerriAI/litellm/pull/50973)
- 將 `mcp_all` OAuth 範圍視為任何已授權範圍都涵蓋的萬用字元，讓重新連接 Datadog MCP 伺服器不再於其允許畫面之間循環，並以 Authentication incomplete 收場 - [PR #51578](https://github.com/BerriAI/litellm/pull/51578)

### 通訊協定與目錄 {#protocol-and-catalog}

- 快取上游 MCP 工具清單，存留時間由管理員設定（預設 0），讓每個工作階段開始時列出工具的代理程式，能從閘道取得工具，而非等待伺服器 - [PR #51160](https://github.com/BerriAI/litellm/pull/51160)
- 將彙總 `/mcp` 路由上的 `resources/read` 路由至列出該 URI 的伺服器，讓設定多個 MCP 伺服器時讀取不再失敗 - [PR #51462](https://github.com/BerriAI/litellm/pull/51462)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

### Rust 核心 {#rust-core}

- 在公開連接埠新增受監督、可選擇加入的 Rust 轉送伺服器，搭配 `LITELLM_RUST_FIRST=1`，Python 仍處理每個請求，並如同用戶端直接連接般看見用戶端 IP 與信任的 proxy - [PR #49606](https://github.com/BerriAI/litellm/pull/49606)
- 新增 Rust 資料庫層的 SQLx 寫入池，依 Prisma 用於池大小、TLS、逾時、結構描述、PgBouncer 模式與輪換 RDS IAM 或 Entra token 的相同 `DATABASE_URL` 設定建立。目前尚未經由它查詢 - [PR #49798](https://github.com/BerriAI/litellm/pull/49798)
- 將原生資料庫錯誤分類為與 Prisma 相同的種類，例如無法觸及、容量與死結，並回收受污染的池，讓 Rust 資料庫層能如 Prisma 般從失敗中恢復 - [PR #49801](https://github.com/BerriAI/litellm/pull/49801)
- 為已設定的讀取副本新增可選的原生讀取池，具備明確的寫入或讀取路由與備援，讓日後移至 Rust 的讀取仍前往副本 - [PR #49804](https://github.com/BerriAI/litellm/pull/49804)
- 從 Rust 資料庫查詢發出 DB 服務事件，讓它們出現在與 Prisma 查詢相同的 Prometheus 與 OpenTelemetry DB 指標中，含相同的呼叫型別、表格與成功或失敗標籤 - [PR #49810](https://github.com/BerriAI/litellm/pull/49810)
- 讓 proxy 的 `/v1/messages` 請求能以 `LITELLM_RUST=1` 走 Rust 路徑，調整偵測器，讓 proxy 共用的 aiohttp 工作階段與預設串流逾時不再強制走 Python 路徑 - [PR #50335](https://github.com/BerriAI/litellm/pull/50335)
- 將 Redis 金鑰建構從 router-core 移出至儲存層，讓 `RouterCache` 操作命名冷卻與用量等狀態，Python 主機則建立金鑰 - [PR #50356](https://github.com/BerriAI/litellm/pull/50356)
- 從新的原生 `deployment_health` Redis 儲存提供部署健康檢查狀態，而非 DualCache 與 redis-py，背後是 `DeploymentHealthCache` 的 Rust 儲存與 pyo3 綁定 - [PR #50357](https://github.com/BerriAI/litellm/pull/50357)
- 在 proxy 釋放原生 `/v1/messages` 成功後，透過 Python 記錄路徑只記錄一次，讓 Rust 提供的請求記錄方式與 Python 相同 - [PR #50420](https://github.com/BerriAI/litellm/pull/50420)
- 以與 Python 相同的方式填寫原生 `/v1/messages` 請求的記錄物件，包含 `model_parameters`、`litellm_params` 與標準記錄 payload 欄位 - [PR #50421](https://github.com/BerriAI/litellm/pull/50421)
- 在原生 `/v1/messages` 處理器上，如同 Python 般傳遞非訊息 200 主體，並將非字串請求標頭視為錯誤請求拒絕，而非稍後才失敗 - [PR #50422](https://github.com/BerriAI/litellm/pull/50422)
- 讓原生非同步聊天與嵌入呼叫經過與 Python 相同的非同步包裝步驟，讓 Rust 的錯誤回應帶有 `x-litellm-timeout`，其他包裝行為也相符 - [PR #50423](https://github.com/BerriAI/litellm/pull/50423)
- 將原生 `/v1/messages` 失敗以相同的 Python 例外、相同的標頭與支出處理方式擲出，讓 Rust 路徑的錯誤對用戶端看起來與 Python 相同 - [PR #50424](https://github.com/BerriAI/litellm/pull/50424)
- 像 Python 般為用戶端中途捨棄的原生 `/v1/messages` 串流計費，讓支出、支出記錄與金鑰的預算及 tpm 反映已交付的 chunk - [PR #50425](https://github.com/BerriAI/litellm/pull/50425)
- 在路由器蓋章後，如同 Python 般寫入原生一元 `/v1/messages` 快取項目，讓快取命中帶有 `model_id` 與路由器標頭，例如 `x-litellm-cache-key` - [PR #50426](https://github.com/BerriAI/litellm/pull/50426)
- 將成本對照表輸入、擷取與 `register_model` 覆蓋移至 Rust，讓 Rust 主機重用相同的成本對照表規則，S3 成本對照表與 S3 快取共用一個 S3 存取路徑 - [PR #50501](https://github.com/BerriAI/litellm/pull/50501)
- 在 Python 主機邊界安裝 rustls 加密提供者，讓未指名提供者而建立 TLS 用戶端的相依性（例如 `redis` 1.8）不再 panic - [PR #50502](https://github.com/BerriAI/litellm/pull/50502)
- 新增 `litellm-s3` Rust crate，含 `AwsCredentialsProvider` 與成本對照表擷取，將下載上限設為 100 MB，並以標準 jitter 重試 - [PR #50547](https://github.com/BerriAI/litellm/pull/50547)
- 依 id 查詢路由器主機步驟的答案，而非掃描每個候選者，在 1,000 個部署下，將約 3.2 毫秒的 Rust 選取縮短約 2 毫秒 - [PR #50704](https://github.com/BerriAI/litellm/pull/50704)
- 不再於 Rust 路由器 `acompletion` 路徑上，每個請求將模型群組的部署列出三次，在部署數量龐大時每次呼叫節省數毫秒 - [PR #50749](https://github.com/BerriAI/litellm/pull/50749)
- 在原生 Redis 儲存上計算整個 `router_usage` 系列，讓 Redis span 保留其父層，用量讀取不再經過 Python 批次路徑 - [PR #50862](https://github.com/BerriAI/litellm/pull/50862)
- 從原生 Redis 儲存提供路由器的部署親和性與複雜度路由器工作階段固定，讓固定讀取搭上原生呼叫前管線 - [PR #50870](https://github.com/BerriAI/litellm/pull/50870)
- 只在 Rust 上為 `anthropic` 提供者提供 Anthropic Messages，將每個僅限 Python 的 `/v1/messages` 功能移植至 Rust，不需 `LITELLM_RUST` 選擇加入，也沒有 Python 備援 - [PR #51119](https://github.com/BerriAI/litellm/pull/51119)
- 以原生 Rust Redis 儲存取代 Python `RedisBatch`，用於請求路徑操作，並刪除已死的 Python 批次程式碼與其測試 - [PR #51383](https://github.com/BerriAI/litellm/pull/51383)
- 在精確的到期索引上重建 Rust 記憶體內快取，讓刪除或重新設定金鑰不再留下已死的到期記錄 - [PR #51388](https://github.com/BerriAI/litellm/pull/51388)
- 在 Python 記錄回呼中，不再重新序列化 Messages 請求主體，改為從 Rust 傳下已處理的位元組，在大型主體上每個請求節省約 1 毫秒 - [PR #51440](https://github.com/BerriAI/litellm/pull/51440)
- 新增 Rust `fnmatch` crate，符合 Python `fnmatchcase` 的 glob 規則，作為將驗證路由檢查移至 Rust 的基礎工作。目前尚未接入任何請求路徑 - [PR #51530](https://github.com/BerriAI/litellm/pull/51530)
- 在 Rust 中決定驗證路由規則，而非 Python，哪些路由允許每種金鑰型別則不變 - [PR #51531](https://github.com/BerriAI/litellm/pull/51531)
- 從呼叫者取得原生彙總的 `lock_timeout`，讓 Rust 與 Python 使用相同的 `SPEND_ROLLUP_LOCK_TIMEOUT_MS` 值，並保持團隊鎖定陳述式不具名，讓它們能在 PgBouncer 下運作 - [PR #51549](https://github.com/BerriAI/litellm/pull/51549)
- 在 Rust 中規劃驗證路徑，讓每個請求的驗證路由選擇在一個地方決定，哪些請求被接受則不變 - [PR #51605](https://github.com/BerriAI/litellm/pull/51605)
- 在 router-core 中為每次嘗試塑形備援躍點 kwargs 並交給 Python，將邏輯移至 Rust，行為不變 - [PR #51644](https://github.com/BerriAI/litellm/pull/51644)
- 在 Rust 中原生掃描選擇加入的支出記錄 tokens，讓啟用 token 遮罩不再於大型提示詞上降低輸送量，遮罩規則維持相同 - [PR #51770](https://github.com/BerriAI/litellm/pull/51770)
- 不再讓 Rust 路由器將每個已完成的請求保留在記憶體中，直到完整垃圾回收，讓繁忙的 proxy 不再遠超出其實際工作集 - [PR #51888](https://github.com/BerriAI/litellm/pull/51888)
- 將就緒的非同步值以內嵌方式結算，而非在 Python 主機的 tokio 上產生，讓 Redis 批次呼叫節省大量時間 - [PR #51906](https://github.com/BerriAI/litellm/pull/51906)
- 立即釋放失敗的 Rust 路由器呼叫的請求，包含失敗一次後在重試時成功的呼叫，而非等到下一次垃圾回收才釋放 - [PR #51963](https://github.com/BerriAI/litellm/pull/51963)
- 只在篩選器有 beta 需要篩選時才載入 Anthropic beta 對照表，讓冷啟動的 Rust `/v1/messages` worker 不再於沒有 `anthropic-beta` 標頭的請求上下載它 - [PR #52188](https://github.com/BerriAI/litellm/pull/52188)

### 自動路由器與模型路由 {#auto-router-and-model-routing}

- 將預設中繼資料合併至請求自身的中繼資料之下，而非取代它，讓團隊的標籤能抵達 GCP 計費，管理員預設值只補齊呼叫者留空的部分 - [PR #50700](https://github.com/BerriAI/litellm/pull/50700)
- 當相同模型的兄弟部署關閉 box 問題時，仍將 box 問題保留在部署上，讓第一個部署不再於另一個部署設定 `supports_box_questions: false` 後回傳 400 - [PR #50724](https://github.com/BerriAI/litellm/pull/50724)
- 避免 Claude Code 子代理程式與背景附屬請求共用主代理程式的複雜度路由器層級固定，並使用 Claude 的請求型別標頭區分三種流量 - [PR #50741](https://github.com/BerriAI/litellm/pull/50741)
- 讓部署能宣告共用的 `model_info.encrypted_content_boundary`，讓一個組織的區域端點被視為對等者，後續請求能保留其加密推理 - [PR #50750](https://github.com/BerriAI/litellm/pull/50750)
- 在 5xx、429 或連線錯誤後，讓重試能離開因加密推理而固定的部署，讓群組中健康的部署獲得嘗試，而非每次重試都失敗 - [PR #50769](https://github.com/BerriAI/litellm/pull/50769)
- 為複雜度分類器失敗的 `user_turn` 提問固定預設模型，讓其後續內容保持一致，下一個新的提問再重新分類 - [PR #50793](https://github.com/BerriAI/litellm/pull/50793)
- 讓明確的路由標籤優先於加密內容固定，讓標記給部署 B 的請求不再被固定至 A，隨後又被標籤篩選器捨棄 - [PR #50975](https://github.com/BerriAI/litellm/pull/50975)
- 在同步的 `router.responses()` 與 `generate_content()` 中套用路由器的 `num_retries` 與 `fallbacks`，讓它們能像非同步版本般重試與備援 - [PR #51011](https://github.com/BerriAI/litellm/pull/51011)
- 在 `/auto_router/session` 上將工作階段的全部支出回報為 `total_spend`，包含未經路由的呼叫，例如直接的 Haiku 背景請求，並說明節省金額未估計的原因 - [PR #51066](https://github.com/BerriAI/litellm/pull/51066)
- 在管理員將自動路由器分類器部署移至新的 workspace 時，讓它們繼續提供服務，方式為就地替換部署，讓請求不再以沒有健康部署而失敗 - [PR #51111](https://github.com/BerriAI/litellm/pull/51111)
- 在複雜度路由器中保留 OpenCode 子代理程式結果的已持有層級，讓這些結果不再觸發新的分類與層級變更 - [PR #51176](https://github.com/BerriAI/litellm/pull/51176)
- 避免 Responses 串流備援重播已交付的工具呼叫，讓工具呼叫後的錯誤能抵達用戶端，而非讓動作執行兩次 - [PR #51683](https://github.com/BerriAI/litellm/pull/51683)
- 在用量型路由拒絕超過 tpm 的請求時指出請求大小，並立即以 429 失敗，而非等待約 3 分鐘，群組備援仍會執行 - [PR #51838](https://github.com/BerriAI/litellm/pull/51838)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 在 FIPS 模式下，從出站 TLS 加密套件清單排除 RSA 金鑰交換與 ChaCha20，讓出站連線只使用 FIPS 核准的套件 - [PR #50671](https://github.com/BerriAI/litellm/pull/50671)
- 接受裸服務帳號電子郵件作為 GCP Memorystore IAM，讓 worker 不再退回記憶體，速率限制、預算與金鑰封鎖在 worker 之間保持共用 - [PR #50676](https://github.com/BerriAI/litellm/pull/50676)
- 在 proxy 啟動時記錄一次警告，計算仍使用已淘汰空白 `models` 預設值的金鑰與團隊數量，並說明在 LiteLLM 2.0.0 移除該規則前如何保留其存取權 - [PR #50720](https://github.com/BerriAI/litellm/pull/50720)
- 重用來自 DeepSeek、Mistral、Groq、Anthropic、Gemini 與 Bedrock 等提供者的一般 HTTP 處理器串流 chunk 的上游 choice 物件，讓每個串流 chunk 的 proxy CPU 減少約 5% - [PR #50786](https://github.com/BerriAI/litellm/pull/50786)
- 讓作業系統指派 Prisma 引擎連接埠，並從引擎啟動訊息讀取實際連接埠，讓同時啟動的 proxy 與 worker 不再因連接埠衝突而失敗 - [PR #50850](https://github.com/BerriAI/litellm/pull/50850)
- 當金鑰有快取中繼資料時，保留請求的快取選擇加入，讓這些金鑰上 `use-cache: true` 的請求能命中快取，重複呼叫不再再次計費 - [PR #50999](https://github.com/BerriAI/litellm/pull/50999)
- 將使用者與團隊的支出記錄讀取縮小至擁有者的 API 金鑰，讓 `api_key` 與 `startTime` 索引被使用，讓 `/spend/logs/ui` 與 `/team/spend/by_user` 不再掃描整個日期視窗 - [PR #51026](https://github.com/BerriAI/litellm/pull/51026)
- 讓 `/team/delete` 交易等待彙集的資料庫連線，而非在連接池只是忙碌時，於 2 秒後以 503 失敗 - [PR #51099](https://github.com/BerriAI/litellm/pull/51099)
- 使用 Google 應用程式預設憑證，從私有的 `gs://` bucket 載入 `LITELLM_MODEL_COST_MAP_URL`，讓模型成本對照表能像託管於 S3 般託管於 GCS - [PR #51108](https://github.com/BerriAI/litellm/pull/51108)
- 在 `x-litellm-attempted-fallbacks` 中計算速率限制備援，並在新的 `x-litellm-fallback-reason` 標頭中指出原因，讓用戶端能分辨何時是本機每模型上限將請求送往備援 - [PR #51138](https://github.com/BerriAI/litellm/pull/51138)
- 將 Gemini 串流開啟錯誤對映至可捕捉的 LiteLLM API 錯誤，適用於同步與非同步路由器呼叫，而非原始的提供者錯誤或 `TypeError`，同時保留逾時備援與原始原因 - [PR #51218](https://github.com/BerriAI/litellm/pull/51218)
- 限制 Anthropic messages 已分離串流排空幫浦的範圍，讓它無法比其串流存活更久，修正潛在的記憶體洩漏 - [PR #51268](https://github.com/BerriAI/litellm/pull/51268)
- 在已分離的串流失敗 hook 中以弱參照持有記錄物件，讓已完成的串流 `/v1/messages` 請求立即被釋放，而非等待完整的垃圾回收 - [PR #51318](https://github.com/BerriAI/litellm/pull/51318)
- 透過彙集的非同步 HTTP 用戶端擷取 `/public/litellm_blog_posts`，讓無法觸及的文件站點不再於每次管理 UI 載入時凍結 worker 5 秒 - [PR #51369](https://github.com/BerriAI/litellm/pull/51369)
- 在 Transcribe 記錄處理器中延遲匯入 `soundfile`，讓 Anthropic 與 Bedrock messages 串流不再需要安裝它 - [PR #51480](https://github.com/BerriAI/litellm/pull/51480)
- 在傳送最後一個事件後立即關閉串流，並在之後為記錄重建已提供的輸出，移除 30 至 100 毫秒的等待，該等待占 LiteLLM 為串流增加的大部分延遲 - [PR #51487](https://github.com/BerriAI/litellm/pull/51487)
- 在動態速率限制器中從 Redis 讀取模型的飽和度，讓每個 worker 對模型是否飽和有一致看法，超過配額的團隊也被一致地限制 - [PR #51519](https://github.com/BerriAI/litellm/pull/51519)
- 在匯入時積極建立 Usage 型別結構描述，讓全新 worker 上大量並行首次請求的爆量不再以內部結構描述錯誤失敗 - [PR #51591](https://github.com/BerriAI/litellm/pull/51591)
- 在資料庫中斷連線後保留未寫入的工具用量記錄與自動路由器輪次，連線恢復後重試一次，只將部分批次中未寫入的輪次重新排入佇列，避免重複計算 - [PR #51706](https://github.com/BerriAI/litellm/pull/51706)
- 避免全域 `model_fallbacks` 清單在每次補全呼叫上遞迴，這曾讓 SDK 與 proxy 的聊天及 Responses 請求卡住，直到遞迴錯誤才停止，永遠無法抵達提供者 - [PR #51817](https://github.com/BerriAI/litellm/pull/51817)
- 在驗證路徑中從類別讀取 token 模型欄位，而非已淘汰的 `__fields__`，減少每個請求的額外負擔 - [PR #51901](https://github.com/BerriAI/litellm/pull/51901)
- 延遲格式化雙重快取除錯記錄，讓快取讀取與寫入在除錯記錄關閉時跳過字串建立 - [PR #51902](https://github.com/BerriAI/litellm/pull/51902)
- 在組裝串流用量時，每個 chunk 只擷取一次用量，減少長串流回應上的重複工作 - [PR #51903](https://github.com/BerriAI/litellm/pull/51903)
- 在 `UserApiKeyCache` 記憶體命中時重用已驗證的模型，讓重複的金鑰查詢跳過重新驗證 - [PR #51912](https://github.com/BerriAI/litellm/pull/51912)
- 為客戶成員團隊、預算與覆寫查詢新增資料庫索引，讓客戶管理篩選不再掃描整個表格 - [PR #51961](https://github.com/BerriAI/litellm/pull/51961)
- 新增遷移，移除 `LiteLLM_DailyCustomerMemberSpend` 上 `updated_at` 的預設值，並重新命名截斷的外鍵，讓遷移與 `schema.prisma` 相符，下一個產生的遷移不再有意外的陳述式 - [PR #52175](https://github.com/BerriAI/litellm/pull/52175)

### Docker 與 Helm {#docker-and-helm}

- 以單一 `helm/litellm` chart 取代兩個 Helm chart，該 chart 能以單一單體 proxy Deployment 執行，並使用一個共用映像，讓只有一個映像值需要更新 - [PR #43330](https://github.com/BerriAI/litellm/pull/43330)
- 提供一個以非 root 使用者執行的根 `Dockerfile`，搭配單一 `docker-entrypoint.sh`，可啟動任何元件，以及一個 compose 檔案，取代十個 Dockerfile 與每映像的包裝器 - [PR #43332](https://github.com/BerriAI/litellm/pull/43332)
- 讓每個 AWS 與 GCP Terraform 工作負載都從單一 `litellm` 映像執行，讓 ECS 工作、Cloud Run 服務與遷移工作不再依賴已淘汰的每元件映像 - [PR #43358](https://github.com/BerriAI/litellm/pull/43358)
- 在 Helm chart 的閘道 ServiceMonitor 新增 `scheme` 與 `tlsConfig` 值，讓 Prometheus 能透過 https 或在嚴格 mTLS 下經由 Istio sidecar 抓取閘道 - [PR #50759](https://github.com/BerriAI/litellm/pull/50759)
- 在元件化的 Helm ingress 中，將每個閘道允許清單路徑路由至閘道，並將 ALB 規則保持在 100 條規則上限以下，另以 CI 檢查防止日後的路徑漂移 - [PR #50760](https://github.com/BerriAI/litellm/pull/50760)
- 將建置與執行階段固定使用的 Wolfi 基礎映像更新至已修補 glibc 的版本，保持相同的 2.44 ABI，讓映像掃描再次通過 - [PR #51550](https://github.com/BerriAI/litellm/pull/51550)

### 相依性更新 {#dependency-updates}

- 將 `tzdata` 加入 `litellm[proxy]` 附加項目，讓舊版 `TZ` 值（例如 `Asia/Calcutta`）在沒有舊版時區資料庫的主機上，不再使啟動以代碼 3 結束 - [PR #49914](https://github.com/BerriAI/litellm/pull/49914)
- 在 Python 版本允許處，將 `soupsieve` 升級至已修正的發行版，並為最舊支援的 Python 新增有日期的掃描忽略，讓 OSV 掃描再次通過 - [PR #51585](https://github.com/BerriAI/litellm/pull/51585)
- 將 opentelemetry 升級至 1.45.2，連同 dnspython、tornado 與 soupsieve，超過 11 月 13 日公布的建議，讓 osv-scan 檢查再次通過 - [PR #51712](https://github.com/BerriAI/litellm/pull/51712)

## 文件更新 {#documentation-updates}

- 更新儲存庫的回報政策，含新的郵寄清單註冊連結與揭露表單，並移除影片要求 - [PR #51199](https://github.com/BerriAI/litellm/pull/51199)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

- 讓 `SemanticToolFilterHook` 將其 MCP 工具載入器作為參數，讓測試注入載入器，而非修補類別屬性 - [PR #50483](https://github.com/BerriAI/litellm/pull/50483)
- 使用 `eslint-plugin-i18next`，在 JSX 與 toast 訊息中的硬編碼英文上使儀表板 lint 失敗，讓新文字經過 i18n - [PR #50593](https://github.com/BerriAI/litellm/pull/50593)
- 清理近期的技術債，直接讀取具型別的設定、新增缺少的回傳型別，並刪除兩個未使用的 helper，行為不變 - [PR #50617](https://github.com/BerriAI/litellm/pull/50617)
- 清除 182 個檔案中 1141 個 basedpyright `Any` 錯誤，讓型別檢查器能捕捉真正的錯誤，行為不變 - [PR #50711](https://github.com/BerriAI/litellm/pull/50711)
- 讓已移動的私有提示詞範本 helper 仍能從 `common_utils` 匯入，讓經由舊模組的修補能觸及真正的 helper，並以 helper 的新位置發出警告 - [PR #50721](https://github.com/BerriAI/litellm/pull/50721)
- 為 `claude-fable-5-2` 的能力旗標與提示快取定價，在腳本化的 Anthropic 上游新增整合測試 - [PR #50722](https://github.com/BerriAI/litellm/pull/50722)
- 為 `claude-fable-5-2` 新增 Vertex AI 與 Bedrock Converse 的線路與成本測試，並將它加入 Bedrock Converse 模型清單，讓能力旗標與提示快取定價保持正確 - [PR #50742](https://github.com/BerriAI/litellm/pull/50742)
- 更新音訊轉錄計費測試，預期一秒上傳依 OpenAI 回報的秒數計費，符合預期的計費行為 - [PR #50767](https://github.com/BerriAI/litellm/pull/50767)
- 更新團隊模型可見性整合測試，檢查團隊的模型只對該團隊的金鑰與管理員顯示 - [PR #50772](https://github.com/BerriAI/litellm/pull/50772)
- 修復仍斷言先前合併變更刻意取代行為的整合測試，包含批次快取定價、OTel baggage 與串流 EOF 案例 - [PR #50782](https://github.com/BerriAI/litellm/pull/50782)
- 從 Gemini 長解碼整合測試移除空字串 n 案例，因為 Google 以 400 拒絕它 - [PR #50796](https://github.com/BerriAI/litellm/pull/50796)
- 更新仍預期帳本前會計佇列的支出與整合測試，並修正數個因無關原因失敗的測試 - [PR #50814](https://github.com/BerriAI/litellm/pull/50814)
- 更新 Mantle `count_tokens` 線路測試，預期無內容的前導系統訊息會收到 400 `invalid_request_error` - [PR #50820](https://github.com/BerriAI/litellm/pull/50820)
- 將每個 Rust 至 Python 的呼叫，經由 `rust_bridge` 主機模組路由，作為純重構，讓邊界一致 - [PR #50822](https://github.com/BerriAI/litellm/pull/50822)
- 重寫支出帳本對等測試，斷言在另一位 worker 的維護鎖定下套用支出，同時清理等待該鎖定 - [PR #50843](https://github.com/BerriAI/litellm/pull/50843)
- 在層級固定批次測試前清空共用用戶端快取，讓它不再依測試順序失敗 - [PR #50854](https://github.com/BerriAI/litellm/pull/50854)
- 限制混合能力 MCP 訂閱整合測試中的 OAuth 中繼資料查詢，讓它不再間歇性逾時 - [PR #50867](https://github.com/BerriAI/litellm/pull/50867)
- 讓 gunicorn 伺服器接受私有監聽器，並將連接埠備援與閘道資料庫設定拆分為較小的函式 - [PR #50871](https://github.com/BerriAI/litellm/pull/50871)
- 從儲存庫根目錄移除未使用的檔案，包含 `GEMINI.md`、`mcp_servers.json`、`router_plugins.json`、根目錄 `package.json` 與 `examples` 資料夾 - [PR #50936](https://github.com/BerriAI/litellm/pull/50936)
- 移除過時的 `cookbook` 資料夾，並將 Grafana 儀表板與測試使用的檔案移至 `litellm` 下 - [PR #50944](https://github.com/BerriAI/litellm/pull/50944)
- 移除 CircleCI，並將 GitHub Actions 工作仍呼叫的腳本移至 `.github/scripts/ci/` - [PR #50950](https://github.com/BerriAI/litellm/pull/50950)
- 將成本計算整合案例中的 Vertex 3.1 Pro 價格欄位與 Bedrock Converse 用量形狀，與真實的目錄資料列同步 - [PR #50956](https://github.com/BerriAI/litellm/pull/50956)
- 將 lint、掃描器、文件與腳本設定移出儲存庫根目錄，Ruff 與 pyright 設定現在位於 `pyproject.toml` - [PR #50966](https://github.com/BerriAI/litellm/pull/50966)
- 更新預算部分更新整合測試，預期預算資訊中包含每模型 tpm 與 rpm 上限欄位 - [PR #50967](https://github.com/BerriAI/litellm/pull/50967)
- 在 HTTP/2 整合測試伺服器中，傳送 GOAWAY 後排空用戶端流量，讓向量儲存搜尋測試不再於一般中斷連線時失敗 - [PR #50972](https://github.com/BerriAI/litellm/pull/50972)
- 在並行部署刪除測試的持有寫入 helper 中，識別模型清單的登錄檔鎖定，讓它們再次通過 - [PR #50974](https://github.com/BerriAI/litellm/pull/50974)
- 將 docker、compose、helm 與 terraform 來源移至 `litellm/deploy` 下，縮小儲存庫根目錄 - [PR #50981](https://github.com/BerriAI/litellm/pull/50981)
- 將 Vertex Anthropic 結構化輸出測試擷取範圍限定為推論路由，讓模型清單查詢等雜散請求不再使其崩潰 - [PR #50983](https://github.com/BerriAI/litellm/pull/50983)
- 將 `ui` 與 `vscode-extension` 移至 `litellm` 下，並刪除 `docs` 資料夾，因為文件現在位於 litellm-docs - [PR #50992](https://github.com/BerriAI/litellm/pull/50992)
- 將 `enterprise`、`litellm-proxy-extras`、`litellm-rust` 與 `packaging` 移至 `litellm` 下，CLI 來源移至 `litellm/cli` - [PR #51000](https://github.com/BerriAI/litellm/pull/51000)
- 將腳本、後端、遷移與 `schema.prisma` 移至 `litellm` 下，縮小儲存庫根目錄 - [PR #51006](https://github.com/BerriAI/litellm/pull/51006)
- 新增 CI 檢查，在儲存庫根目錄超過 15 個項目時失敗 - [PR #51007](https://github.com/BerriAI/litellm/pull/51007)
- 讓整合測試中的假上游伺服器遠離暫時連接埠，讓它們不再與 Prisma 為其查詢引擎選取的連接埠衝突，並使排定執行失敗 - [PR #51019](https://github.com/BerriAI/litellm/pull/51019)
- 讓 MCP 逗號範圍連接測試透過真實的憑證儲存來儲存與讀取授權，讓損壞的儲存授權現在會使測試失敗 - [PR #51065](https://github.com/BerriAI/litellm/pull/51065)
- 在映像掃描工作中以快速的 `ci` cargo 設定檔建置 Rust，而非完整的發行版最佳化，讓相依性 PR 更快完成掃描、遷移與啟動檢查 - [PR #51075](https://github.com/BerriAI/litellm/pull/51075)
- 消除 db 指標 span 與排空逾時單元測試的不穩定性，並將最大的 proxy-infra 分片一分為二，讓 PR 執行不再需要重跑，必要的單元檢查也更快完成 - [PR #51078](https://github.com/BerriAI/litellm/pull/51078)
- 修正兩個不穩定的整合測試，在私有的 Postgres 中執行基線會計，並修正差了一個請求的數列上限計數 - [PR #51096](https://github.com/BerriAI/litellm/pull/51096)
- 更新兩個 Vertex 影像編輯支出測試，當編輯回傳用量時預期以 token 計費，而非舊的固定每張影像價格 - [PR #51109](https://github.com/BerriAI/litellm/pull/51109)
- 教導模型目錄讀取 `min_billed_input_tokens`，讓設定它的成本對照表資料列能通過成本對照表檢查 - [PR #51128](https://github.com/BerriAI/litellm/pull/51128)
- 更新 Vertex 影像編輯區域加價支出測試，預期現在用於 Gemini 影像編輯的 token 型成本 - [PR #51148](https://github.com/BerriAI/litellm/pull/51148)
- 更新 Gemini 影像編輯用量測試，當提供者未提供細分時預期空白的輸出細分，因為影像 token 計數不再被編造 - [PR #51149](https://github.com/BerriAI/litellm/pull/51149)
- 移除 rubrik 防護欄、透傳標頭與外掛程式模式程式碼中三則最近新增的註解，它們只是重述旁邊的程式碼，行為不變 - [PR #51163](https://github.com/BerriAI/litellm/pull/51163)
- 更新離線模式測試，預期最新的發行版檢查在背景查詢發行版時，現在回傳的 202 - [PR #51213](https://github.com/BerriAI/litellm/pull/51213)
- 移除密鑰管理員 e2e 套件，它自 10 月下旬以來在每次 Buildkite 建置都軟性失敗，且已被單元與整合測試涵蓋 - [PR #51241](https://github.com/BerriAI/litellm/pull/51241)
- 讓不穩定的支出計數器測試在斷言前，等待背景計數器更新的明確事件，而非與未完成的更新競爭 - [PR #51249](https://github.com/BerriAI/litellm/pull/51249)
- 讓已取消的監督者單元測試具確定性，讓它不再因子程序被 SIGTERM 終止而使 CI 失敗 - [PR #51258](https://github.com/BerriAI/litellm/pull/51258)
- 移除 `AnthropicBeta::rejected_by` 中重複的 `compact-2026-09-04` 比對分支，該分支使 main 上的 rust-lint 檢查失敗 - [PR #51280](https://github.com/BerriAI/litellm/pull/51280)
- 更新防護欄效果測試，在被封鎖的聊天串流上預期 `content_filter` 完成原因，符合晚期封鎖修正帶來的新行為 - [PR #51281](https://github.com/BerriAI/litellm/pull/51281)
- 檢查完整的自動路由器工作階段回應，包含預期的 `total_spend`，並在工作階段整合測試中斷言前等待總計 - [PR #51283](https://github.com/BerriAI/litellm/pull/51283)
- 移除 OpenAPI 文件門檻的整合測試，它需要網路存取下載 maturin，且每次排定執行都失敗，因為 lint 工作流程已涵蓋該行為 - [PR #51300](https://github.com/BerriAI/litellm/pull/51300)
- 在排定的整合工作中安裝 Rust 閘道，並在 proxy 退回 Python 時讓轉送測試工具大聲失敗，讓缺少的二進位檔案不再能默默通過 - [PR #51307](https://github.com/BerriAI/litellm/pull/51307)
- 將最長的單元測試分片一分為二，隔離其子 Python 測試，並將其檔案排除切換為 `--deselect` 以使其生效，讓 805 個測試不再執行兩次 - [PR #51316](https://github.com/BerriAI/litellm/pull/51316)
- 從錯誤收集它的分片取消選取 `test_unit_test_proxy_hooks.py`，並固定未使用的 `proxy-infra-root` codecov 旗標，作為單元分片拆分的後續修正 - [PR #51324](https://github.com/BerriAI/litellm/pull/51324)
- 將測試中的橋接呼叫記錄器，以 `success_callback` 限定於每個請求，讓其他測試的延遲記錄不再使它們失敗 - [PR #51339](https://github.com/BerriAI/litellm/pull/51339)
- 從成本對照表移除重複的 `gemini/gemini-decision-1` 項目，讓重複金鑰測試通過，PR 不再繼承紅色檢查 - [PR #51341](https://github.com/BerriAI/litellm/pull/51341)
- 只讓 main 儲存 Actions 快取，讓 sccache 使用不同的後端，並停止 smoke 工作從原始碼編譯 Rust 與 numpy，讓 PR 執行不再逐出快取並遇到 429 - [PR #51343](https://github.com/BerriAI/litellm/pull/51343)
- 將 CollieAi 加入防護欄設定整合測試中，無法進行方向性僅記錄範圍的防護欄預期清單 - [PR #51345](https://github.com/BerriAI/litellm/pull/51345)
- 更新安靜串流 keepalive 測試，預期 Anthropic Messages 走 Rust 路由，因為它現在只由 Rust 路徑提供 - [PR #51346](https://github.com/BerriAI/litellm/pull/51346)
- 更新仍預期 Python 提供 Anthropic `/v1/messages` 的整合測試，讓它們在 Rust 專屬切換後預期 Rust - [PR #51351](https://github.com/BerriAI/litellm/pull/51351)
- 更新閒置重新連接測試，預期串流 Anthropic Messages 走 Rust 路由，同時保留其對新連線、回應與支出記錄的檢查 - [PR #51364](https://github.com/BerriAI/litellm/pull/51364)
- 在 Rust 模型目錄登錄檔檢查中讀取 `output_cost_per_billable_unit`，讓新的價格欄位與使用它的成本對照表資料列能在同一個 PR 落地 - [PR #51365](https://github.com/BerriAI/litellm/pull/51365)
- 在 Rust 模型目錄登錄檔檢查中讀取 `output_cost_per_video`，讓 fal.ai 的每支影片價格資料列能與其使用的欄位一起落地 - [PR #51433](https://github.com/BerriAI/litellm/pull/51433)
- 將管理 MCP 結構描述推送映像測試指向 `/app/litellm/schema.prisma`，符合移動後的套件版面，讓映像掃描驗證工作不再失敗 - [PR #51446](https://github.com/BerriAI/litellm/pull/51446)
- 將資料庫整合測試指向移動後的 `litellm/proxy-extras` 與 enterprise 套件，讓約 40 個遷移與啟動測試能再次找到 Prisma 結構描述 - [PR #51453](https://github.com/BerriAI/litellm/pull/51453)
- 更新思考簽章重試測試，預期 Rust 在重試時捨棄 null 的 `signature` - [PR #51461](https://github.com/BerriAI/litellm/pull/51461)
- 將 litellm 升級至 1.111.0、litellm-enterprise 至 0.1.84、litellm-proxy-extras 至 0.4.115，讓來自 main 的 nightly 建置固定包含新遷移的子套件 wheel - [PR #51486](https://github.com/BerriAI/litellm/pull/51486)
- 移除五個在 11 月 5 日至 11 月 12 日期間於 main 上變紅的單元測試，其背後沒有程式碼變更 - [PR #51488](https://github.com/BerriAI/litellm/pull/51488)
- 重新命名客戶成員預算欄位，讓 `budget_id` 為成員遵循的組織預算，`budget_override_id` 持有成員自己的覆寫，與組織與團隊上的意義一致 - [PR #51490](https://github.com/BerriAI/litellm/pull/51490)
- 更新請求記錄索引重新命名整合測試，預期在該遷移步驟現在發生的單獨每日使用者支出索引建置 - [PR #51504](https://github.com/BerriAI/litellm/pull/51504)
- 更新透傳端點整合測試，預期現在於每個端點儲存的預設 Model Hub 設定，讓排定執行不再失敗 - [PR #51505](https://github.com/BerriAI/litellm/pull/51505)
- 給技能面板測試 5 秒時間，在首次冷渲染時顯示目錄，讓 `ui-unit` 檢查不再時好時壞 - [PR #51509](https://github.com/BerriAI/litellm/pull/51509)
- 在設定覆寫測試中刪除 Vault 設定之前，等待進行中的請求會計完成，讓晚到的支出記錄不再於 Vault 密鑰消失後讀取它 - [PR #51515](https://github.com/BerriAI/litellm/pull/51515)
- 將 SageMaker 嵌入請求主體比較為解析後的 JSON，而非原始文字，並斷言呼叫者的編碼獲勝，讓線路測試不再因欄位順序而損壞 - [PR #51536](https://github.com/BerriAI/litellm/pull/51536)
- 在 OTEL 排除服務矩陣測試中，依團隊 id 識別團隊資料儲存 span，讓金鑰驗證前的新的僅限操作者快取查詢不被計為團隊 span - [PR #51554](https://github.com/BerriAI/litellm/pull/51554)
- 在自己的 proxy 上以正常監督執行 worker 替換混沌測試，讓 uvicorn 能快速注意到已死的 worker，測試不再於 CI 逾時 - [PR #51590](https://github.com/BerriAI/litellm/pull/51590)
- 給 K3 worker 當機支出測試使用 K4 校準的 proxy 啟動預算，而非固定的 300 秒，讓緩慢的執行器不再使其逾時 - [PR #51592](https://github.com/BerriAI/litellm/pull/51592)
- 將 `litellm-enterprise` 升級至 0.1.85、`litellm-proxy-extras` 至 0.4.116，讓 nightly 建置固定包含新遷移的 wheel - [PR #51643](https://github.com/BerriAI/litellm/pull/51643)
- 在並行成員重設測試中持有餘額資料列，直到兩個請求都在等待，讓一個請求不再能提早完成並使有效的回應失敗 - [PR #51655](https://github.com/BerriAI/litellm/pull/51655)
- 在憑證掃描測試中，從其自身的 fixture 解析預算請求路由識別碼，而非以聊天請求 id 探測它們 - [PR #51659](https://github.com/BerriAI/litellm/pull/51659)
- 在 MCP 相依性解析工作流程中不以最佳化建置 Rust 程式碼，讓它在約 11 分鐘內完成，而非於 30 分鐘逾時 - [PR #51684](https://github.com/BerriAI/litellm/pull/51684)
- 讓未緩衝的 Noma 串流密鑰暴露測試具確定性，讓腳本化的電子郵件不再落入取樣防護欄掃描執行的 chunk - [PR #51707](https://github.com/BerriAI/litellm/pull/51707)
- 在 Prometheus 整合測試中測量動態限制器團隊配額指標之前，先讓模型飽和，讓它符合限制器給予借用團隊新配額的行為 - [PR #51714](https://github.com/BerriAI/litellm/pull/51714)
- 在來源移動破壞它之後，將整合工作流程中的 Rust 閘道安裝步驟指向 `litellm/packaging` - [PR #51743](https://github.com/BerriAI/litellm/pull/51743)
- 給 S3 v2 慢速接收端 ramp 測試一個能撐過其 400 個請求爆量的回呼上限，讓它不再於緩慢的 CI 執行器上失敗 - [PR #51744](https://github.com/BerriAI/litellm/pull/51744)
- 在 OTEL 排除服務矩陣測試中，將 proxy 啟動排除在每測試逾時之外，讓緩慢的共用 proxy 啟動不再一次使它們全部失敗 - [PR #51759](https://github.com/BerriAI/litellm/pull/51759)
- 在 OpenAI 於 2027-01-14 關閉它們之前，將範例設定、Helm 與 Terraform 範例，以及約 20 個 e2e 測試移出 `gpt-4o` 與 `gpt-4.1` - [PR #51800](https://github.com/BerriAI/litellm/pull/51800)
- 從新的客戶階層與 v2 回呼程式碼中，捨棄一個 comprehension 抑制與重述的註解 - [PR #51804](https://github.com/BerriAI/litellm/pull/51804)
- 透過 `cz bump` 與一個測試，讓 `litellm-proxy` 套件版本與 `litellm` 保持同步，讓從 main 建置的映像回報正確的版本 - [PR #51807](https://github.com/BerriAI/litellm/pull/51807)
- 將音訊、即時與 Langfuse e2e 測試移出將於 2027 年 1 月至 2 月間關閉的 OpenAI 模型 id - [PR #51816](https://github.com/BerriAI/litellm/pull/51816)
- 對齊佇列聊天 baggage 對映測試 fixture，讓它們使用 fixture 實際的詞彙進行標籤對映與標籤預算檢查 - [PR #51847](https://github.com/BerriAI/litellm/pull/51847)
- 在設定測試中恢復隔離的閘道啟動器匯入，讓它們能在執行階段來源移動後，再次檢查 Rust 後方的真實用戶端位址 - [PR #51848](https://github.com/BerriAI/litellm/pull/51848)
- 更新佇列串流防護欄測試，當首次 chunk 之前發生失敗時，預期刻意的 HTTP 403 JSON 回應 - [PR #51849](https://github.com/BerriAI/litellm/pull/51849)
- 以只能觸及自身部署的金鑰執行批次生命週期 e2e 測試，讓上傳後 Azure 提供者備援案例不再以 404 失敗 - [PR #51857](https://github.com/BerriAI/litellm/pull/51857)
- 在 Claude Opus 4.6 整合測試中，預期 `drop_params` 下的適應性思考溫度下降，符合 #51834 中預期的變更 - [PR #51859](https://github.com/BerriAI/litellm/pull/51859)
- 以較便宜的每測試重設與較少的非單元測試，縮短單元檢查時間，因為 fixture 設定占了大部分的單元測試時間 - [PR #51864](https://github.com/BerriAI/litellm/pull/51864)
- 將 `litellm-enterprise` 0.1.85 升級至 0.1.86、`litellm-proxy-extras` 0.4.116 至 0.4.117，讓下一個建置固定包含新遷移的 wheel - [PR #51876](https://github.com/BerriAI/litellm/pull/51876)
- 在路由器刪除測試的並行 upsert 中，於其建置讀回清單處持有它，讓它不再於每次排定的整合執行中失敗 - [PR #51878](https://github.com/BerriAI/litellm/pull/51878)
- 捨棄兩個永遠無法及時完成的批次 e2e 等待，在最長的 e2e 檔案中節省約 9 分鐘 - [PR #51882](https://github.com/BerriAI/litellm/pull/51882)
- 將 Rust 支援的 S3 記錄器從 `s3_v3` 移至 `s3_v2`，僅移動檔案，檔案內的行為或名稱皆不變 - [PR #51893](https://github.com/BerriAI/litellm/pull/51893)
- 將 `callbacks-s3-log` 中的 Python 格式 helper 移至 `python-compat`，每個皆由 CPython 或 pydantic 撰寫的 fixture 固定 - [PR #51895](https://github.com/BerriAI/litellm/pull/51895)
- 在 proxy 生命週期清理測試中預期沒有原生資料庫池，因為 proxy 自 #49798 起已不再開啟資料庫池 - [PR #51911](https://github.com/BerriAI/litellm/pull/51911)
- 在整合測試中，當擁有的 proxy 當機時記錄 stack，讓啟動的 segmentation fault 留下可除錯的內容 - [PR #51922](https://github.com/BerriAI/litellm/pull/51922)
- 將已分離的串流失敗 hook 狀態保留在記錄物件上，並以引數傳給回呼，行為不變 - [PR #51962](https://github.com/BerriAI/litellm/pull/51962)
- 透過 ruff `PLR0916` 標示超過三個布林子句的條件式 - [PR #51964](https://github.com/BerriAI/litellm/pull/51964)
- 移除無法觸及的 `VertexAIFilesHandler.afile_content`，因為 Vertex 檔案讀取已透過 Vertex 檔案轉換進行 - [PR #51966](https://github.com/BerriAI/litellm/pull/51966)
- 在支出帳本對等測試中，給客戶重設 fixture 明確的上限，因為無上限的客戶現在會在重設之間保留支出 - [PR #52058](https://github.com/BerriAI/litellm/pull/52058)
- 在空白使用者 id SSO 測試中，於儀表板與 CLI 登入之間重用提供者身分，符合更嚴格的電子郵件備援 - [PR #52062](https://github.com/BerriAI/litellm/pull/52062)
- 在優先速率限制標頭測試中預期零個入場 tokens，因為閒置模型上的入場現在保留一個請求，不保留 tokens - [PR #52065](https://github.com/BerriAI/litellm/pull/52065)
- 更新四個在預期變更後仍預期舊行為的過時整合與 UI 測試，產品程式碼沒有變更 - [PR #52108](https://github.com/BerriAI/litellm/pull/52108)
- 在冷 worker 整合測試中，不再要求 safeguards 呼叫等待 Anthropic beta 對照表，符合 #52188 的延遲載入 - [PR #52329](https://github.com/BerriAI/litellm/pull/52329)
- 將 `litellm-proxy-extras` 0.4.117 升級至 0.4.118，適用於 rc/1.111.0，讓發行版固定包含新遷移的 wheel - [PR #52370](https://github.com/BerriAI/litellm/pull/52370)

### 依所屬領域的 PR 彙總 {#pr-roll-up-by-ownership-area}

依所屬領域的 PR（總計：525）

- 其他：111
- 模型與提供者：96
- 效能：84
- 花費 / 預算 / 速率限制：78
- LLM API 端點：56
- 驗證與管理：36
- UI：35
- 記錄：15
- MCP：7
- 防護欄：5
- 文件：1
- 提示詞管理：1

## 新貢獻者 {#new-contributors}

- [@collieai-dev](https://github.com/collieai-dev) 在 [PR #49224](https://github.com/BerriAI/litellm/pull/49224) 做出了他們的第一次貢獻
- [@giladk1221](https://github.com/giladk1221) 在 [PR #50883](https://github.com/BerriAI/litellm/pull/50883) 做出了他們的第一次貢獻
- [@hktitof](https://github.com/hktitof) 在 [PR #40376](https://github.com/BerriAI/litellm/pull/40376) 做出了他們的第一次貢獻
- [@Jeongho0805](https://github.com/Jeongho0805) 在 [PR #50880](https://github.com/BerriAI/litellm/pull/50880) 做出了他們的第一次貢獻
- [@kaizen-38](https://github.com/kaizen-38) 在 [PR #51318](https://github.com/BerriAI/litellm/pull/51318) 做出了他們的第一次貢獻
- [@kenneth-berri](https://github.com/kenneth-berri) 在 [PR #50764](https://github.com/BerriAI/litellm/pull/50764) 做出了他們的第一次貢獻
- [@kirti22jain](https://github.com/kirti22jain) 在 [PR #51608](https://github.com/BerriAI/litellm/pull/51608) 做出了他們的第一次貢獻
- [@maciej-berri](https://github.com/maciej-berri) 在 [PR #51446](https://github.com/BerriAI/litellm/pull/51446) 做出了他們的第一次貢獻
- [@mishdotdev](https://github.com/mishdotdev) 在 [PR #50642](https://github.com/BerriAI/litellm/pull/50642) 做出了他們的第一次貢獻
- [@nurlanmnn](https://github.com/nurlanmnn) 在 [PR #50979](https://github.com/BerriAI/litellm/pull/50979) 做出了他們的第一次貢獻
- [@princejain756](https://github.com/princejain756) 在 [PR #50657](https://github.com/BerriAI/litellm/pull/50657) 做出了他們的第一次貢獻
- [@raunakpandey1](https://github.com/raunakpandey1) 在 [PR #49806](https://github.com/BerriAI/litellm/pull/49806) 做出了他們的第一次貢獻
- [@saruar-dev](https://github.com/saruar-dev) 在 [PR #48426](https://github.com/BerriAI/litellm/pull/48426) 做出了他們的第一次貢獻
- [@satwik-bankapur](https://github.com/satwik-bankapur) 在 [PR #49914](https://github.com/BerriAI/litellm/pull/49914) 做出了他們的第一次貢獻
- [@srik-straiker](https://github.com/srik-straiker) 在 [PR #51401](https://github.com/BerriAI/litellm/pull/51401) 做出了他們的第一次貢獻
- [@taxfree-python](https://github.com/taxfree-python) 在 [PR #46845](https://github.com/BerriAI/litellm/pull/46845) 做出了他們的第一次貢獻
- [@tedswinyar](https://github.com/tedswinyar) 在 [PR #49183](https://github.com/BerriAI/litellm/pull/49183) 做出了他們的第一次貢獻
- [@VISHNU0906](https://github.com/VISHNU0906) 在 [PR #50210](https://github.com/BerriAI/litellm/pull/50210) 做出了他們的第一次貢獻
- [@zhengqiuyang](https://github.com/zhengqiuyang) 在 [PR #50249](https://github.com/BerriAI/litellm/pull/50249) 做出了他們的第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.0-rc.3...v1.111.0-rc.1
