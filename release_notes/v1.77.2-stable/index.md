---
title: "v1.77.2-stable - Bedrock Batches API"
slug: "v1-77-2"
date: 2025-09-13T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

hide_table_of_contents: false
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:main-v1.77.2-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.77.2.post1
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Bedrock Batches API** - 支援使用 LiteLLM 的統一 batch API（相容 OpenAI）在 Bedrock 上建立 Batch Inference Jobs
- **Qwen API 分級定價** - 支援 Dashscope（Qwen）模型的成本追蹤，包含多個定價級距

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                           | 上下文視窗 | Pricing ($/1M tokens) | 功能 |
| ----------- | ------------------------------- | -------------- | --------------------- | -------- |
| DeepInfra   | `deepinfra/deepseek-ai/DeepSeek-R1` | 164K | **Input:** $0.70<br/>**Output:** $2.40 | 聊天 completions、工具呼叫 |
| Heroku      | `heroku/claude-4-sonnet`        | 8K | 請聯絡提供者以取得定價 | 函式呼叫、tool choice |
| Heroku      | `heroku/claude-3-7-sonnet`      | 8K | 請聯絡提供者以取得定價 | 函式呼叫、tool choice |
| Heroku      | `heroku/claude-3-5-sonnet-latest` | 8K | 請聯絡提供者以取得定價 | 函式呼叫、tool choice |
| Heroku      | `heroku/claude-3-5-haiku`       | 4K | 請聯絡提供者以取得定價 | 函式呼叫、tool choice |
| Dashscope   | `dashscope/qwen-plus-latest`    | 1M | **分級定價：**<br/>• 0-256K tokens: $0.40 / $1.20<br/>• 256K-1M tokens: $1.20 / $3.60 | 函式呼叫、推理 |
| Dashscope   | `dashscope/qwen3-max-preview`   | 262K | **分級定價：**<br/>• 0-32K tokens: $1.20 / $6.00<br/>• 32K-128K tokens: $2.40 / $12.00<br/>• 128K-252K tokens: $3.00 / $15.00 | 函式呼叫、推理 |
| Dashscope   | `dashscope/qwen-flash`          | 1M | **分級定價：**<br/>• 0-256K tokens: $0.05 / $0.40<br/>• 256K-1M tokens: $0.25 / $2.00 | 函式呼叫、推理 |
| Dashscope   | `dashscope/qwen3-coder-plus`    | 1M | **分級定價：**<br/>• 0-32K tokens: $1.00 / $5.00<br/>• 32K-128K tokens: $1.80 / $9.00<br/>• 128K-256K tokens: $3.00 / $15.00<br/>• 256K-1M tokens: $6.00 / $60.00 | 函式呼叫、推理、快取 |
| Dashscope   | `dashscope/qwen3-coder-flash`   | 1M | **分級定價：**<br/>• 0-32K tokens: $0.30 / $1.50<br/>• 32K-128K tokens: $0.50 / $2.50<br/>• 128K-256K tokens: $0.80 / $4.00<br/>• 256K-1M tokens: $1.60 / $9.60 | 函式呼叫、推理、快取 |

---

#### 功能 {#features}

- **[Bedrock](../../docs/providers/bedrock_batches)**
    - Bedrock Batches API - 支援批次處理，包含檔案上傳與請求轉換 - [PR #14518](https://github.com/BerriAI/litellm/pull/14518), [PR #14522](https://github.com/BerriAI/litellm/pull/14522)
- **[VLLM](../../docs/providers/vllm)**
    - 新增轉錄端點支援 - [PR #14523](https://github.com/BerriAI/litellm/pull/14523)
- **[Ollama](../../docs/providers/ollama)**
    - `ollama_chat/` - 以清單處理 images、thinking 與 content - [PR #14523](https://github.com/BerriAI/litellm/pull/14523)
- **一般**
    - 新增詳細請求/回應記錄的 debug 標記 [PR #14482](https://github.com/BerriAI/litellm/pull/14482)

#### 錯誤修正 {#bug-fixes}

- **[Azure OpenAI](../../docs/providers/azure)**
    - 修正 extra_body 注入導致影像生成時 payload 被拒絕的問題 - [PR #14475](https://github.com/BerriAI/litellm/pull/14475)
- **[LM Studio](../../docs/providers/lm-studio)**
    - 解決非法 Bearer 標頭值問題 - [PR #14512](https://github.com/BerriAI/litellm/pull/14512)

---

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bug-fixes-1}

- **[/messages](../../docs/anthropic_unified)**
    - 在訊息後不要傳送 content block，若有 finish reason + usage block - [PR #14477](https://github.com/BerriAI/litellm/pull/14477)
- **[/generateContent](../../docs/generateContent)**
    - Gemini CLI 整合 - 修正 token 計數錯誤 - [PR #14451](https://github.com/BerriAI/litellm/pull/14451), [PR #14417](https://github.com/BerriAI/litellm/pull/14417)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

#### 功能 {#features-1}

- **[Qwen API 分級定價](../../docs/providers/dashscope)** - 新增 Dashscope/Qwen 模型完整的分級成本追蹤 - [PR #14471](https://github.com/BerriAI/litellm/pull/14471), [PR #14479](https://github.com/BerriAI/litellm/pull/14479)

#### 錯誤修正 {#bug-fixes-2}

- **提供者預算** - 修正提供者預算計算 - [PR #14459](https://github.com/BerriAI/litellm/pull/14459)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **使用者標頭對應** - 新增 X-LiteLLM Users 對應功能，以加強使用者追蹤 - [PR #14485](https://github.com/BerriAI/litellm/pull/14485)
- **金鑰解鎖** - 支援 `/key/unblock` 端點中的雜湊 token - [PR #14477](https://github.com/BerriAI/litellm/pull/14477)
- **模型群組標頭轉送** - 以文件加強萬用字元模型支援 - [PR #14528](https://github.com/BerriAI/litellm/pull/14528)

#### 錯誤修正 {#bug-fixes-3}

- **記錄分頁金鑰別名** - 修正失敗記錄的篩選不準確問題 - [PR #14469](https://github.com/BerriAI/litellm/pull/14469), [PR #14529](https://github.com/BerriAI/litellm/pull/14529)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-3}

- **Noma 整合** - 新增非阻塞監控模式，支援匿名化輸入 - [PR #14401](https://github.com/BerriAI/litellm/pull/14401)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 效能 {#performance}
- 移除靜態值的動態建立 - [PR #14538](https://github.com/BerriAI/litellm/pull/14538)
- 預設使用 `_PROXY_MaxParallelRequestsHandler_v3` 以達到最佳吞吐量 - [PR #14450](https://github.com/BerriAI/litellm/pull/14450)
- 改善執行內容傳遞至記錄工作 - [PR #14455](https://github.com/BerriAI/litellm/pull/14455)

---

## 新貢獻者 {#new-contributors}
* @Sameerlite 首次貢獻於 [PR #14460](https://github.com/BerriAI/litellm/pull/14460)
* @holzman 首次貢獻於 [PR #14459](https://github.com/BerriAI/litellm/pull/14459)
* @sashank5644 首次貢獻於 [PR #14469](https://github.com/BerriAI/litellm/pull/14469)
* @TomAlon 首次貢獻於 [PR #14401](https://github.com/BerriAI/litellm/pull/14401)
* @AlexsanderHamir 首次貢獻於 [PR #14538](https://github.com/BerriAI/litellm/pull/14538)

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.77.1.dev.2...v1.77.2.dev)** {#full-changeloghttpsgithubcomberriailitellmcomparev1771dev2v1772dev}
