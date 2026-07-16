---
title: v1.63.14-stable
slug: v1.63.14-stable
date: 2025-03-22T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

tags: [credential management, thinking content, responses api, snowflake]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

這些是自 `v1.63.11-stable` 以來的變更。

此版本帶來：
- LLM 翻譯改進（MCP 支援與 Bedrock Application Profiles）
- 用量型路由的效能改進
- 透過 websockets 的串流防護欄支援
- Azure OpenAI 用戶端效能修正（來自前一個版本）

## 執行 LiteLLM Proxy 的 Docker {#docker-run-litellm-proxy}

```
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.63.14-stable.patch1
```

## 示範執行個體 {#demo-instance}

這裡有一個示範執行個體可用來測試變更：
- 執行個體：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## 新模型 / 已更新模型 {#new-models--updated-models}

- Azure gpt-4o - 修正定價為最新全球定價 - [PR](https://github.com/BerriAI/litellm/pull/9361)
- O1-Pro - 新增定價 + 模型資訊 - [PR](https://github.com/BerriAI/litellm/pull/9397)
- Azure AI - 新增 mistral 3.1 small 定價 - [PR](https://github.com/BerriAI/litellm/pull/9453)
- Azure - 新增 gpt-4.5-preview 定價 - [PR](https://github.com/BerriAI/litellm/pull/9453)

## LLM 翻譯 {#llm-translation}

1. **新 LLM 功能**

- Bedrock：支援 bedrock application inference profiles [文件](https://docs.litellm.ai/docs/providers/bedrock#bedrock-application-inference-profile)
   - 從 bedrock application profile id 推斷 aws region - (`arn:aws:bedrock:us-east-1:...`)
- Ollama - 支援透過 `/v1/completions` 呼叫 [開始使用](../../docs/providers/ollama#using-ollama-fim-on-v1completions)
- Bedrock - 支援 `us.deepseek.r1-v1:0` 模型名稱 [文件](../../docs/providers/bedrock#supported-aws-bedrock-models)
- OpenRouter - `OPENROUTER_API_BASE` 環境變數支援 [文件](../../docs/providers/openrouter)
- Azure - 新增音訊模型參數支援 - [文件](../../docs/providers/azure#azure-audio-model)
- OpenAI - PDF 檔案支援 [文件](../../docs/completion/document_understanding#openai-file-message-type)
- OpenAI - o1-pro Responses API 串流支援 [文件](../../docs/response_api#streaming)
- [BETA] MCP - 搭配 LiteLLM SDK 使用 MCP Tools [文件](../../docs/mcp)

2. **錯誤修正**

- Voyage：修正 embedding 追蹤中的 prompt token - [PR](https://github.com/BerriAI/litellm/commit/56d3e75b330c3c3862dc6e1c51c1210e48f1068e)
- Sagemaker - 修正「Content-Length 宣告的資料量過少」錯誤 - [PR](https://github.com/BerriAI/litellm/pull/9326)
- OpenAI 相容模型 - 修正呼叫設定了 custom_llm_provider 的 openai-compatible models 時的問題 - [PR](https://github.com/BerriAI/litellm/pull/9355)
- VertexAI - 支援 Embedding 的 ‘outputDimensionality’ - [PR](https://github.com/BerriAI/litellm/commit/437dbe724620675295f298164a076cbd8019d304)
- Anthropic - 在串流 / 非串流時回傳一致的 json 回應格式 - [PR](https://github.com/BerriAI/litellm/pull/9437)

## 支出追蹤改進 {#spend-tracking-improvements}

- `litellm_proxy/` - 支援在使用 client sdk 時，從 proxy 讀取 litellm response cost header 
- 重設預算工作 - 修正 keys/teams/users 的預算重設錯誤 [PR](https://github.com/BerriAI/litellm/pull/9329)
- 串流 - 防止包含 usage 的最後一個 chunk 被忽略（影響 bedrock 串流 + 成本追蹤）[PR](https://github.com/BerriAI/litellm/pull/9314)

## UI {#ui}

1. Users 頁面
   - 功能：控制預設內部使用者設定 [PR](https://github.com/BerriAI/litellm/pull/9328)
2. 圖示：
   - 功能：以本機 svg 取代外部 "artificialanalysis.ai" 圖示 [PR](https://github.com/BerriAI/litellm/pull/9374)
3. 登入 / 登出
   - 修正：當 `default_user_id` 使用者不存在於 DB 中時的預設登入 [PR](https://github.com/BerriAI/litellm/pull/9395)

## 記錄整合 {#logging-integrations}

- 支援串流回應的 post-call 防護欄 [開始使用](../../docs/proxy/guardrails/custom_guardrail#1-write-a-customguardrail-class)
- Arize [開始使用](../../docs/observability/arize_integration)
   - 修正無效的套件匯入 [PR](https://github.com/BerriAI/litellm/pull/9338)
   - 遷移為使用 standardloggingpayload 作為中繼資料，確保 spans 成功落地 [PR](https://github.com/BerriAI/litellm/pull/9338)
   - 修正記錄為僅記錄 LLM I/O [PR](https://github.com/BerriAI/litellm/pull/9353)
   - 動態 API 金鑰/Space 參數支援 [開始使用](../../docs/observability/arize_integration#pass-arize-spacekey-per-request)
- StandardLoggingPayload - 在 payload 中記錄 litellm_model_name。可知道傳送到 API 提供者的模型是什麼 [開始使用](../../docs/proxy/logging_spec#standardlogginghiddenparams)
- Prompt Management - 允許建置自訂 prompt management 整合 [開始使用](../../docs/proxy/custom_prompt_management)

## 效能 / 可靠性改進 {#performance--reliability-improvements}

- Redis 快取 - 新增 5 秒預設逾時，防止卡住的 redis 連線影響 llm 請求 [PR](https://github.com/BerriAI/litellm/commit/db92956ae33ed4c4e3233d7e1b0c7229817159bf)
- 允許停用所有支出更新 / 寫入 DB - patch 可透過旗標停用所有支出更新至 DB [PR](https://github.com/BerriAI/litellm/pull/9331)
- Azure OpenAI - 正確重複使用 azure openai client，修正前一個 Stable 版本中的效能問題 [PR](https://github.com/BerriAI/litellm/commit/f2026ef907c06d94440930917add71314b901413)
- Azure OpenAI - 在 Azure/OpenAI clients 上使用 litellm.ssl_verify [PR](https://github.com/BerriAI/litellm/commit/f2026ef907c06d94440930917add71314b901413)
- 用量型路由 - 萬用字元模型支援 [開始使用](../../docs/proxy/usage_based_routing#wildcard-model-support)
- 用量型路由 - 支援批次寫入增量到 redis - 將延遲降低至與 ‘simple-shuffle’ 相同 [PR](https://github.com/BerriAI/litellm/pull/9357)
- Router - 在 ‘no healthy deployments available error’ 中顯示模型降溫原因 [PR](https://github.com/BerriAI/litellm/pull/9438)
- 快取 - 為記憶體快取中的項目新增最大值限制（1MB）- 防止大型 image url 經由 proxy 傳送時發生 OOM 錯誤 [PR](https://github.com/BerriAI/litellm/pull/9448)

## 一般改進 {#general-improvements}

- Passthrough Endpoints - 支援在 pass-through endpoints Response Headers 回傳 api-base [文件](../../docs/proxy/response_headers#litellm-specific-headers)
- SSL - 支援從環境變數讀取 ssl security level - 允許使用者指定較低的安全設定 [開始使用](../../docs/guides/security_settings)
- Credentials - 只有在 `STORE_MODEL_IN_DB` 為 True 時才輪詢 Credentials 表 [PR](https://github.com/BerriAI/litellm/pull/9376)
- Image URL Handling - 關於 image url handling 的新架構文件 [文件](../../docs/proxy/image_handling)
- OpenAI - 升級至 pip install "openai==1.68.2" [PR](https://github.com/BerriAI/litellm/commit/e85e3bc52a9de86ad85c3dbb12d87664ee567a5a)
- Gunicorn - 安全性修正 - 升級 gunicorn==23.0.0 [PR](https://github.com/BerriAI/litellm/commit/7e9fc92f5c7fea1e7294171cd3859d55384166eb)

## 完整 Git Diff {#complete-git-diff}

[這裡是完整的 git diff](https://github.com/BerriAI/litellm/compare/v1.63.11-stable...v1.63.14.rc)
