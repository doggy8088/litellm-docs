---
title: v1.65.4-stable
slug: v1.65.4-stable
date: 2025-04-05T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

tags: []
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.65.4-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.65.4.post1
```
</TabItem>
</Tabs>

v1.65.4-stable 已上線。以下是自 v1.65.0-stable 以來的改進。

## 主要亮點 {#key-highlights}
- **防止 DB 死鎖**：修正多個執行個體同時寫入 DB 時，在高流量下發生的問題。
- **新的使用量分頁**：可依 model 查看支出，並自訂日期範圍

讓我們深入了解。

### 防止 DB 死鎖 {#preventing-db-deadlocks}

<Image img={require('../../img/prevent_deadlocks.jpg')} />

此版本修正了使用者在高流量（10K+ RPS）下遇到的 DB 死鎖問題。這很棒，因為它使 user/key/team 的支出追蹤能在該規模下運作。

閱讀更多關於新架構的內容 [這裡](https://docs.litellm.ai/docs/proxy/db_deadlocks)

### 新的使用量分頁 {#new-usage-tab}

<Image img={require('../../img/release_notes/spend_by_model.jpg')} />

新的 Usage 分頁現在提供依 model 追蹤每日支出的能力。結合可檢視成功請求與 token 使用量的功能後，這讓您更容易發現任何支出追蹤或 token 計算錯誤。

若要測試此功能，只要前往 Experimental > New Usage > Activity。

## 新模型 / 更新模型 {#new-models--updated-models}

1. Databricks - claude-3-7-sonnet 成本追蹤 [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L10350)
2. VertexAI - `gemini-2.5-pro-exp-03-25` 成本追蹤 [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L4492)
3. VertexAI - `gemini-2.0-flash` 成本追蹤 [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L4689)
4. Groq - 將 whisper ASR 模型加入 model cost map [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L3324)
5. IBM - 將 watsonx/ibm/granite-3-8b-instruct 加入 model cost map [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L91)
6. Google AI Studio - 將 gemini/gemini-2.5-pro-preview-03-25 加入 model cost map [PR](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/model_prices_and_context_window.json#L4850)

## LLM 翻譯 {#llm-translation}
1. Vertex AI - 支援 OpenAI JSON schema 翻譯的 anyOf 參數 [Get Started](https://docs.litellm.ai/docs/providers/vertex#json-schema)
2. Anthropic- 支援 response_format + thinking 參數（可跨 Anthropic API、Bedrock、Vertex 使用） [Get Started](https://docs.litellm.ai/docs/reasoning_content)
3. Anthropic - 如果指定了 thinking token 但未指定 max tokens，請確保傳給 anthropic 的 max token 高於 thinking tokens（可跨 Anthropic API、Bedrock、Vertex 使用） [PR](https://github.com/BerriAI/litellm/pull/9594)
4. Bedrock - 支援 latency optimized inference [Get Started](https://docs.litellm.ai/docs/providers/bedrock#usage---latency-optimized-inference)
5. Sagemaker - 處理回應中的特殊 tokens + 多位元組字元碼 [Get Started](https://docs.litellm.ai/docs/providers/aws_sagemaker)
6. MCP - 新增對使用 SSE MCP servers 的支援 [Get Started](https://docs.litellm.ai/docs/mcp#usage)
8. Anthropic - 用於透過 passthrough 呼叫 Anthropic `/v1/messages` 的新 `litellm.messages.create` 介面 [Get Started](https://docs.litellm.ai/docs/anthropic_unified#usage)
11. Anthropic - 支援 message 參數中的 ‘file’ 內容類型（可跨 Anthropic API、Bedrock、Vertex 使用） [Get Started](https://docs.litellm.ai/docs/providers/anthropic#usage---pdf)
12. Anthropic - 將 openai 的 'reasoning_effort' 對應至 anthropic 的 'thinking' 參數（可跨 Anthropic API、Bedrock、Vertex 使用） [Get Started](https://docs.litellm.ai/docs/providers/anthropic#usage---thinking--reasoning_content)
13. Google AI Studio (Gemini) - [BETA] 支援 `/v1/files` 上傳 [Get Started](../../docs/providers/google_ai_studio/files) 
14. Azure - 修正 o-series 工具呼叫 [Get Started](../../docs/providers/azure#tool-calling--function-calling)
15. Unified file id - [ALPHA] 允許使用相同的 file id 呼叫多個提供者 [PR](https://github.com/BerriAI/litellm/pull/9718)
    - 這是實驗性功能，不建議用於正式環境。
    - 我們預計下週會有可供正式環境使用的實作。
16. Google AI Studio (Gemini) - 回傳 logprobs [PR](https://github.com/BerriAI/litellm/pull/9713)
17. Anthropic - 支援 Anthropic 工具呼叫的 prompt 快取 [Get Started](https://docs.litellm.ai/docs/completion/prompt_caching)
18. OpenRouter - 在 open router 呼叫時解包額外的 body [PR](https://github.com/BerriAI/litellm/pull/9747)
19. VertexAI - 修正憑證快取問題 [PR](https://github.com/BerriAI/litellm/pull/9756)
20. XAI - 過濾掉 XAI 的 'name' 參數 [PR](https://github.com/BerriAI/litellm/pull/9761)
21. Gemini - 支援影像生成輸出 [Get Started](../../docs/providers/gemini#image-generation)
22. Databricks - 支援帶有 thinking + response_format 的 claude-3-7-sonnet [Get Started](../../docs/providers/databricks#usage---thinking--reasoning_content)

## 支出追蹤改進 {#spend-tracking-improvements}
1. 可靠性修正 - 檢查送出與接收的 model 以進行成本計算 [PR](https://github.com/BerriAI/litellm/pull/9669)
2. Vertex AI - 多模態 embedding 成本追蹤 [Get Started](https://docs.litellm.ai/docs/providers/vertex#multi-modal-embeddings), [PR](https://github.com/BerriAI/litellm/pull/9623)

## 管理端點 / UI {#management-endpoints--ui}

<Image img={require('../../img/release_notes/new_activity_tab.png')} />

1. 新的使用量分頁
    - 回報 'total_tokens' + 回報成功/失敗請求
    - 移除捲動時的雙重條紋
    - 確保 ‘daily spend’ 圖表依最早到最晚日期排序
    - 顯示每天每個 model 的支出
    - 在 usage 分頁顯示 key 別名
    - 允許非管理員檢視自己的活動
    - 在新的使用量分頁新增日期選擇器
2. Virtual Keys 分頁
    - 註冊使用者時移除 'default key'
    - 修正顯示可用於建立個人 key 的使用者 models
3. Test Key 分頁
    - 允許測試影像生成模型
4. Models 分頁
    - 修正批次新增 models
    - 支援 passthrough endpoints 的可重用憑證
    - 允許團隊成員查看團隊 models
5. Teams 分頁
    - 修正更新 team metadata 時的 json 序列化錯誤
6. Request Logs 分頁
    - 在串流時新增跨所有提供者的 reasoning_content token 追蹤
7. API 
    - 在 /user/daily/activity 回傳 key 別名 [Get Started](../../docs/proxy/cost_tracking#daily-spend-breakdown-api)
8. SSO
    - 允許在 MSFT SSO 上將 SSO 使用者指派給 teams [PR](https://github.com/BerriAI/litellm/pull/9745)

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

1. Console Logs - 為未捕捉的例外新增 json 格式化 [PR](https://github.com/BerriAI/litellm/pull/9619)
2. Guardrails - 支援以 virtual key 為基礎的原則之 AIM Guardrails [Get Started](../../docs/proxy/guardrails/aim_security)
3. Logging - 修正 completion start time 追蹤 [PR](https://github.com/BerriAI/litellm/pull/9688)
4. Prometheus
    - 允許在 Prometheus /metrics endpoints 新增驗證 [PR](https://github.com/BerriAI/litellm/pull/9766)
    - 在 metric 命名中區分 LLM Provider Exception 與 LiteLLM Exception [PR](https://github.com/BerriAI/litellm/pull/9760)
    - 為新的 DB Transaction 架構發出營運指標 [PR](https://github.com/BerriAI/litellm/pull/9719)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}
1. 防止死鎖
    - 透過將支出更新儲存在 Redis，然後提交到 DB，以減少 DB 死鎖 [PR](https://github.com/BerriAI/litellm/pull/9608)
    - 確保更新 DailyUserSpendTransaction 時不會發生死鎖 [PR](https://github.com/BerriAI/litellm/pull/9690)
    - 高流量修正 - 確保新的 DB + Redis 架構準確追蹤支出 [PR](https://github.com/BerriAI/litellm/pull/9673)
    - 將 PodLock Manager 改用 Redis 而非 PG（確保不會發生死鎖） [PR](https://github.com/BerriAI/litellm/pull/9715)
    - v2 DB 死鎖減少架構 – 新增記憶體內佇列的最大大小 + 背壓機制 [PR](https://github.com/BerriAI/litellm/pull/9759)
    
2. Prisma Migrations [Get Started](../../docs/proxy/prod#9-use-prisma-migrate-deploy)
    - 將 litellm proxy 連接到 litellm 的 prisma migration files
    - 處理來自新的 `litellm-proxy-extras` sdk 的資料庫 schema 更新
3. Redis - 支援 sync sentinel clients 的密碼 [PR](https://github.com/BerriAI/litellm/pull/9622)
4. 修正 max_parallel_requests = 0 時的 "Circular reference detected" 錯誤 [PR](https://github.com/BerriAI/litellm/pull/9671)
5. Code QA - 禁止硬編碼數字 [PR](https://github.com/BerriAI/litellm/pull/9709)

## Helm {#helm}
1. 修正：chart 中 ttlSecondsAfterFinished 縮排錯誤 [PR](https://github.com/BerriAI/litellm/pull/9611)

## 一般 Proxy 改進 {#general-proxy-improvements}
1. 修正 - 只將 service_account_settings.enforced_params 套用於 service accounts [PR](https://github.com/BerriAI/litellm/pull/9683)
2. 修正 - 處理 `/chat/completion` 上的 metadata 為 null [PR](https://github.com/BerriAI/litellm/issues/9717)
3. 修正 - 將每日使用者交易記錄移出 'disable_spend_logs' 標記之外，因為兩者無關 [PR](https://github.com/BerriAI/litellm/pull/9772)

## 示範 {#demo}

請在示範執行個體上試用這個功能 [今天](https://docs.litellm.ai/docs/proxy/demo)

## 完整 Git Diff {#complete-git-diff}

查看自 v1.65.0-stable 以來的完整 git diff，請見 [這裡](https://github.com/BerriAI/litellm/releases/tag/v1.65.4-stable)
