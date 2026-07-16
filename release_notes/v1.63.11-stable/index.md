---
title: v1.63.11-stable
slug: v1.63.11-stable
date: 2025-03-15T10:00:00
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

這些是自 `v1.63.2-stable` 以來的變更。

此版本主要聚焦於：
- [Beta] 回應 API 支援
- Snowflake Cortex 支援、Amazon Nova 圖片生成
- UI - 憑證管理，在新增模型時重複使用憑證
- UI - 在新增模型前測試與 LLM 提供者的連線

## 已知問題 {#known-issues}
- 🚨 Azure OpenAI 已知問題 - 如果您使用 Azure OpenAI，我們不建議升級。此版本未通過我們的 Azure OpenAI 負載測試

## Docker 執行 LiteLLM Proxy {#docker-run-litellm-proxy}

```
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.63.11-stable
```

## 示範執行個體 {#demo-instance}

以下是用來測試變更的示範執行個體：
- 執行個體：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## 新模型 / 更新模型 {#new-models--updated-models}

- Amazon Nova Canvas 的圖片生成支援 [Getting Started](https://docs.litellm.ai/docs/providers/bedrock#image-generation)
- 為 Jamba 新模型新增定價 [PR](https://github.com/BerriAI/litellm/pull/9032/files)
- 為 Amazon EU 模型新增定價 [PR](https://github.com/BerriAI/litellm/pull/9056/files)
- 新增 Bedrock Deepseek R1 模型定價 [PR](https://github.com/BerriAI/litellm/pull/9108/files)
- 更新 Gemini 定價：Gemma 3、Flash 2 thinking 更新、LearnLM [PR](https://github.com/BerriAI/litellm/pull/9190/files)
- 將 Cohere Embedding 3 模型標記為多模態 [PR](https://github.com/BerriAI/litellm/pull/9176/commits/c9a576ce4221fc6e50dc47cdf64ab62736c9da41)
- 新增 Azure Data Zone 定價 [PR](https://github.com/BerriAI/litellm/pull/9185/files#diff-19ad91c53996e178c1921cbacadf6f3bae20cfe062bd03ee6bfffb72f847ee37)
   - LiteLLM 會追蹤 `azure/eu` 與 `azure/us` 模型的成本

## LLM 翻譯 {#llm-translation}

<Image img={require('../../img/release_notes/responses_api.png')} />

1. **新端點**
- [Beta] POST `/responses` API. [Getting Started](https://docs.litellm.ai/docs/response_api)

2. **新的 LLM 提供者**
- Snowflake Cortex [Getting Started](https://docs.litellm.ai/docs/providers/snowflake)

3. **新的 LLM 功能**

- 支援在串流時透過 OpenRouter `reasoning_content` [Getting Started](https://docs.litellm.ai/docs/reasoning_content)

4. **錯誤修正**

- OpenAI：在錯誤請求錯誤時回傳 `code`、`param` 和 `type` [More information on litellm exceptions](https://docs.litellm.ai/docs/exception_mapping)
- Bedrock：修正 converse chunk 解析，僅在工具使用時回傳空字典 [PR](https://github.com/BerriAI/litellm/pull/9166)
- Bedrock：支援 extra_headers [PR](https://github.com/BerriAI/litellm/pull/9113)
- Azure：修正 Function Calling 錯誤並將預設 API Version 更新為 `2025-02-01-preview` [PR](https://github.com/BerriAI/litellm/pull/9191)
- Azure：修正 AI services URL [PR](https://github.com/BerriAI/litellm/pull/9185)
- Vertex AI：處理回應中的 HTTP 201 狀態碼 [PR](https://github.com/BerriAI/litellm/pull/9193)
- Perplexity：修正不正確的串流回應 [PR](https://github.com/BerriAI/litellm/pull/9081)
- Triton：修正串流 completions 錯誤 [PR](https://github.com/BerriAI/litellm/pull/8386)
- Deepgram：在處理用於轉錄的音訊檔案時支援 bytes.IO [PR](https://github.com/BerriAI/litellm/pull/9071)
- Ollama：修正「system」角色已變得不可接受 [PR](https://github.com/BerriAI/litellm/pull/9261)
- 所有提供者（串流）：修正從串流回應的整個內容中移除 String `data:` 的問題 [PR](https://github.com/BerriAI/litellm/pull/9070)

## 支出追蹤改善 {#spend-tracking-improvements}

1. 支援 Bedrock converse 快取 token 追蹤 [Getting Started](https://docs.litellm.ai/docs/completion/prompt_caching)
2. Responses API 的成本追蹤 [Getting Started](https://docs.litellm.ai/docs/response_api)
3. 修正 Azure Whisper 成本追蹤 [Getting Started](https://docs.litellm.ai/docs/audio_transcription)

## UI {#ui}

### 在 UI 上重複使用憑證 {#re-use-credentials-on-ui}

您現在可以在 LiteLLM UI 上上線 LLM 提供者憑證。這些憑證一旦新增後，您便可在新增新模型時重複使用它們 [Getting Started](https://docs.litellm.ai/docs/proxy/ui_credentials)

<Image img={require('../../img/release_notes/credentials.jpg')} />

### 在新增模型前測試連線 {#test-connections-before-adding-models}

在新增模型之前，您可以測試與 LLM 提供者的連線，以驗證您已正確設定 API Base + API Key

<Image img={require('../../img/release_notes/litellm_test_connection.gif')} />

### 一般 UI 改善 {#general-ui-improvements}
1. 新增模型頁面
   - 允許在 Admin UI 新增 Cerebras、Sambanova、Perplexity、Fireworks、Openrouter、TogetherAI Models、Text-Completion OpenAI 模型
   - 允許新增 EU OpenAI 模型
   - 修正：即時顯示模型的編輯與刪除
2. 金鑰頁面
   - 修正：在 Admin UI 即時顯示新建立的金鑰（不需要重新整理）
   - 修正：在顯示使用者 Top API Key 時，允許點進 Top Keys
   - 修正：允許依 Team Alias、Key Alias 與 Org 篩選金鑰
   - UI 改善：每頁顯示 100 個金鑰、使用全高、增加 key alias 寬度
3. 使用者頁面
   - 修正：在 Users Page 顯示正確的內部使用者金鑰數量
   - 修正：Team UI 中的中繼資料未更新
4. 記錄頁面
   - UI 改善：在 LiteLLM UI 中保持展開的記錄聚焦
   - UI 改善：記錄頁面的細微改善
   - 修正：允許內部使用者查詢自己的記錄
   - 允許關閉將錯誤記錄儲存在 DB [Getting Started](https://docs.litellm.ai/docs/proxy/ui_logs)
5. 登入/登出
   - 修正：在設定時正確使用 `PROXY_LOGOUT_URL` [Getting Started](https://docs.litellm.ai/docs/proxy/self_serve#setting-custom-logout-urls)

## 安全性 {#security}

1. 支援輪替 Master Keys [Getting Started](https://docs.litellm.ai/docs/proxy/master_key_rotations)
2. 修正：Internal User Viewer 權限，不允許 `internal_user_viewer` 角色查看 `Test Key Page` 或 `Create Key Button` [More information on role based access controls](https://docs.litellm.ai/docs/proxy/access_control)
3. 在所有使用者 + 模型建立/更新/刪除端點發出稽核記錄 [Getting Started](https://docs.litellm.ai/docs/proxy/multiple_admins)
4. JWT
    - 支援多個 JWT OIDC 提供者 [Getting Started](https://docs.litellm.ai/docs/proxy/token_auth)
    - 修正當 team 被指派 All Proxy Models 存取權時，Groups 的 JWT 存取無法運作的問題
5. 在 1 個 AWS Secret 中使用 K/V 配對 [Getting Started](https://docs.litellm.ai/docs/secret#using-kv-pairs-in-1-aws-secret)

## 記錄整合 {#logging-integrations}

1. Prometheus：追蹤 Azure LLM API 延遲指標 [Getting Started](https://docs.litellm.ai/docs/proxy/prometheus#request-latency-metrics)
2. Athina：將 tags、user_feedback 與 model_options 新增到可傳送給 Athina 的 additional_keys [Getting Started](https://docs.litellm.ai/docs/observability/athina_integration)

## 效能 / 可靠性改善 {#performance--reliability-improvements}

1. Redis + litellm router - 修正 litellm router 的 Redis 叢集模式 [PR](https://github.com/BerriAI/litellm/pull/9010)

## 一般改善 {#general-improvements}

1. OpenWebUI 整合 - 顯示 `thinking` tokens
- LiteLLM x OpenWebUI 入門指南。 [Getting Started](https://docs.litellm.ai/docs/tutorials/openweb_ui)
- 在 OpenWebUI 顯示 `thinking` tokens（Bedrock、Anthropic、Deepseek）[Getting Started](https://docs.litellm.ai/docs/tutorials/openweb_ui#render-thinking-content-on-openweb-ui)

<Image img={require('../../img/litellm_thinking_openweb.gif')} />

## 完整 Git Diff {#complete-git-diff}

[這裡是完整的 git diff](https://github.com/BerriAI/litellm/compare/v1.63.2-stable...v1.63.11-stable)
