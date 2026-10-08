---
title: v1.57.8-stable
slug: v1.57.8-stable
date: 2025-01-11T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [langfuse, humanloop, alerting, prometheus, secret management, management endpoints, ui, prompt management, finetuning, batch]
hide_table_of_contents: false
---

`alerting`, `prometheus`, `secret management`, `management endpoints`, `ui`, `prompt management`, `finetuning`, `batch`

## 新增 / 更新模型 {#new--updated-models}

1. Mistral large 定價 - https://github.com/BerriAI/litellm/pull/7452
2. Cohere command-r7b-12-2024 定價 - https://github.com/BerriAI/litellm/pull/7553/files
3. Voyage - 新模型、價格與內容視窗資訊 - https://github.com/BerriAI/litellm/pull/7472
4. Anthropic - 將 Bedrock claude-3-5-haiku 的 max_output_tokens 調高至 8192

## 一般 Proxy 改進 {#general-proxy-improvements}

1. 即時模型支援健康檢查 
2. 支援透過虛擬金鑰呼叫 Azure 即時路由 
3. 支援在 `/utils/token_counter` 上使用自訂 tokenizer - 在檢查自架模型的 token 數量時很有用 
4. 請求優先化 - 也支援在 `/v1/completion` 端點上使用 

## LLM 翻譯改進 {#llm-translation-improvements}

1. 支援 Deepgram STT。[從這裡開始](https://docs.litellm.ai/docs/providers/deepgram)
2. OpenAI Moderations - 支援 `omni-moderation-latest`。[從這裡開始](https://docs.litellm.ai/docs/moderation)
3. Azure O1 - 假串流支援。這可確保如果傳入 `stream=true`，回應就會以串流方式傳送。[從這裡開始](https://docs.litellm.ai/docs/providers/azure)
4. Anthropic - 非空白字元停止序列處理 - [PR](https://github.com/BerriAI/litellm/pull/7484)
5. Azure OpenAI - 支援 Entra ID 使用者名稱 + 密碼式驗證。[從這裡開始](https://docs.litellm.ai/docs/providers/azure#entra-id---use-tenant_id-client_id-client_secret)
6. LM Studio - embedding 路由支援。[從這裡開始](https://docs.litellm.ai/docs/providers/lm-studio)
7. WatsonX - ZenAPIKeyAuth 支援。[從這裡開始](https://docs.litellm.ai/docs/providers/watsonx)
    
## Prompt 管理改進 {#prompt-management-improvements}

1. Langfuse 整合
2. HumanLoop 整合 
3. 支援使用負載平衡模型 
4. 支援從 prompt manager 載入可選參數 

[從這裡開始](https://docs.litellm.ai/docs/proxy/prompt_management)

## Finetuning + Batch APIs 改進 {#finetuning--batch-apis-improvements}

1. 改善 Vertex AI finetuning 的統一端點支援 - [PR](https://github.com/BerriAI/litellm/pull/7487)
2. 新增支援擷取 vertex api 批次工作 - [PR](https://github.com/BerriAI/litellm/commit/13f364682d28a5beb1eb1b57f07d83d5ef50cbdc)

## *新增* 警報整合 {#new-alerting-integration}

PagerDuty 警報整合。 

可處理兩種類型的警報：

- 高 LLM API 失敗率。設定 X 秒內失敗 X 次以觸發警報。
- 高數量的 LLM 請求掛起。設定 X 秒內掛起 X 次以觸發警報。

[從這裡開始](https://docs.litellm.ai/docs/proxy/pagerduty)

## Prometheus 改進 {#prometheus-improvements}

新增支援可根據自訂指標追蹤延遲/支出/token。[從這裡開始](https://docs.litellm.ai/docs/proxy/prometheus#beta-custom-metrics)

## *新增* Hashicorp Secret Manager 支援  {#new-hashicorp-secret-manager-support}

支援讀取憑證 + 寫入 LLM API 金鑰。[從這裡開始](https://docs.litellm.ai/docs/secret#hashicorp-vault)

## 管理端點 / UI 改進 {#management-endpoints--ui-improvements}

1. 在 Proxy UI 上建立和檢視組織 + 指派組織管理員
2. 支援透過 key_alias 刪除金鑰
3. 允許在 UI 上將團隊指派給組織
4. 停用在 'test key' 面板中使用 ui session token
5. 顯示 'test key' 面板中使用的模型 
6. 支援在 'test key' 面板中輸出 Markdown

## Helm 改進 {#helm-improvements}

1. 防止 db migrations cron job 進行 istio 注入
2. 允許在 job 內使用 migrationJob.enabled 變數

## 記錄改進 {#logging-improvements}

1. braintrust logging: 遵循 project_id，新增更多指標  - https://github.com/BerriAI/litellm/pull/7613
2. Athina - 支援 base url - `ATHINA_BASE_URL`
3. Lunary - 允許將自訂 parent run id 傳遞給 LLM Calls 

## Git Diff {#git-diff}

這是 v1.56.3-stable 與 v1.57.8-stable 之間的 diff。 

請用這個來查看程式碼基底中的變更。 

[Git Diff](https://github.com/BerriAI/litellm/compare/v1.56.3-stable...189b67760011ea313ca58b1f8bd43aa74fbd7f55)
