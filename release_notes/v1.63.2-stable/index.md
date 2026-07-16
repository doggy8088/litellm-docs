---
title: v1.63.2-stable
slug: v1.63.2-stable
date: 2025-03-08T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [llm translation, thinking, reasoning_content, claude-3-7-sonnet]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';


自 `v1.61.20-stable` 以來的變更如下。

此版本主要聚焦於：
- LLM 翻譯改進（更多 `thinking` 內容改進）
- UI 改進（錯誤記錄現在會顯示在 UI 上）

:::info

此版本將於 03/09/2025 上線

::: 

<Image img={require('../../img/release_notes/v1632_release.jpg')} />

## 示範執行個體 {#demo-instance}

以下是用來測試變更的 Demo Instance：
- Instance: https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## 新模型 / 更新模型 {#new-models--updated-models}

1. 為特定 Bedrock Claude 模型新增 `supports_pdf_input` [PR](https://github.com/BerriAI/litellm/commit/f63cf0030679fe1a43d03fb196e815a0f28dae92)
2. 為 amazon `eu` 模型新增定價 [PR](https://github.com/BerriAI/litellm/commits/main/model_prices_and_context_window.json)
3. 修正 Azure O1 mini 定價 [PR](https://github.com/BerriAI/litellm/commit/52de1949ef2f76b8572df751f9c868a016d4832c)

## LLM 翻譯 {#llm-translation}

<Image img={require('../../img/release_notes/anthropic_thinking.jpg')}/>

1. 支援 Assistant endpoints 的 `/openai/` passthrough。[開始使用](https://docs.litellm.ai/docs/pass_through/openai_passthrough)
2. Bedrock Claude - 修正在 invoke route 上的 tool calling transformation。[開始使用](../../docs/providers/bedrock#usage---function-calling--tool-calling)
3. Bedrock Claude - 在 invoke route 上支援 claude 的 response_format。[開始使用](../../docs/providers/bedrock#usage---structured-output--json-mode)
4. Bedrock - 如果 response_format 中有設定，傳遞 `description`。[開始使用](../../docs/providers/bedrock#usage---structured-output--json-mode)
5. Bedrock - 修正傳遞 response_format: `{"type": "text"}`。[PR](https://github.com/BerriAI/litellm/commit/c84b489d5897755139aa7d4e9e54727ebe0fa540)
6. OpenAI - 處理將 image_url 以字串形式傳送給 openai。[開始使用](https://docs.litellm.ai/docs/completion/vision)
7. Deepseek - 在串流時回傳缺少的 'reasoning_content'。[開始使用](https://docs.litellm.ai/docs/reasoning_content)
8. 快取 - 支援 reasoning content 的快取。[開始使用](https://docs.litellm.ai/docs/proxy/caching)
9. Bedrock - 處理 assistant 訊息中的 thinking blocks。[開始使用](https://docs.litellm.ai/docs/providers/bedrock#usage---thinking--reasoning-content)
10. Anthropic - 在串流時回傳 `signature`。[開始使用](https://docs.litellm.ai/docs/providers/bedrock#usage---thinking--reasoning-content)
- 注意：我們也已從 `signature_delta` 遷移到 `signature`。[閱讀更多](https://docs.litellm.ai/release_notes/v1.63.0)
11. 支援用於指定圖片類型的 format 參數。[開始使用](../../docs/completion/vision#explicitly-specify-image-type)
12. Anthropic - `/v1/messages` endpoint - 支援 `thinking` 參數。[開始使用](../../docs/anthropic_unified)
- 注意：這會重構 [BETA] 統一 `/v1/messages` endpoint，使其僅適用於 Anthropic API。
13. Vertex AI - 在呼叫 vertex ai 時處理回應 schema 中的 $id。[開始使用](https://docs.litellm.ai/docs/providers/vertex#json-schema)

## 支出追蹤改進 {#spend-tracking-improvements}

1. Batches API - 修正 cost calculation，使其在 retrieve_batch 時執行。[開始使用](https://docs.litellm.ai/docs/batches)
2. Batches API - 在支出記錄 / 標準記錄 payload 中記錄 batch models。[開始使用](../../docs/proxy/logging_spec#standardlogginghiddenparams)

## 管理端點 / UI {#management-endpoints--ui}

<Image img={require('../../img/release_notes/error_logs.jpg')} />

1. Virtual Keys 頁面
    - 允許在 Create Key 頁面中搜尋 team/org 篩選條件
    - 在 Keys 表格新增 created_by 和 updated_by 欄位
    - 在 key 表格顯示 'user_email'
    - 每頁顯示 100 個 Keys、使用完整高度、增加 key alias 寬度
2. Logs 頁面
    - 在 LiteLLM UI 顯示錯誤記錄
    - 允許 Internal Users 檢視自己的記錄
3. Internal Users 頁面 
    - 允許 admin 控制 internal users 的預設模型存取權限
7. 修正使用 cookies 的 session 處理

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

1. 修正在 keys 含有 team_id 且發出請求時，自訂 metrics 的 prometheus metrics。[PR](https://github.com/BerriAI/litellm/pull/8935)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

1. Cooldowns - 支援對使用 client side credentials 呼叫的 models 設定 cooldowns。[開始使用](https://docs.litellm.ai/docs/proxy/clientside_auth#pass-user-llm-api-keys--api-base)
2. 基於標籤的路由 - 確保跨所有 endpoints 的基於標籤的路由（`/embeddings`、`/image_generation` 等）。[開始使用](https://docs.litellm.ai/docs/proxy/tag_routing)

## 一般 Proxy 改進 {#general-proxy-improvements}

1. 當請求中傳入未知 model 時，拋出 BadRequestError
2. 在 Azure OpenAI proxy route 上強制執行 model access 限制
3. 可靠性修正 - 處理文字中的 emoji - 修正 orjson 錯誤
4. Model Access 修補 - 在執行 auth checks 時不要覆寫 litellm.anthropic_models
5. 啟用在 docker image 中設定時區資訊

## 完整 Git Diff {#complete-git-diff}

[這裡是完整的 git diff](https://github.com/BerriAI/litellm/compare/v1.61.20-stable...v1.63.2-stable)
