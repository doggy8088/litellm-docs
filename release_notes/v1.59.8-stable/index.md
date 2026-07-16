---
title: v1.59.8-stable
slug: v1.59.8-stable
date: 2025-01-31T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [admin ui, logging, db schema]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.59.8-穩定版 {#v1598-stable}

:::info

立即可取得 LiteLLM Enterprise 7 天免費試用 [這裡](https://litellm.ai/#trial)。

**無需來電**

:::

## 新模型 / 更新模型  {#new-models--updated-models}

1. 新的 OpenAI `/image/variations` 端點 BETA 支援 [文件](../../docs/image_variations)
2. OpenAI `/image/variations` BETA 端點上的 Topaz API 支援 [文件](../../docs/providers/topaz)
3. Deepseek - r1 支援 reasoning_content（[Deepseek API](../../docs/providers/deepseek#reasoning-models)、[Vertex AI](../../docs/providers/vertex#model-garden)、[Bedrock](../../docs/providers/bedrock#deepseek)） 
4. Azure - 新增 azure o1 定價 [請見此處](https://github.com/BerriAI/litellm/blob/b8b927f23bc336862dacb89f59c784a8d62aaa15/model_prices_and_context_window.json#L952)
5. Anthropic - 在模型中處理 `-latest` 標籤以進行成本計算
6. Gemini-2.0-flash-thinking - 新增模型定價（其為 0.0）[請見此處](https://github.com/BerriAI/litellm/blob/b8b927f23bc336862dacb89f59c784a8d62aaa15/model_prices_and_context_window.json#L3393)
7. Bedrock - 新增 stability sd3 模型定價 [請見此處](https://github.com/BerriAI/litellm/blob/b8b927f23bc336862dacb89f59c784a8d62aaa15/model_prices_and_context_window.json#L6814)  （感謝 [Marty Sullivan](https://github.com/marty-sullivan)）
8. Bedrock - 將 us.amazon.nova-lite-v1:0 新增至模型成本對照表 [請見此處](https://github.com/BerriAI/litellm/blob/b8b927f23bc336862dacb89f59c784a8d62aaa15/model_prices_and_context_window.json#L5619)
9. TogetherAI - 新增新的 together_ai llama3.3 模型 [請見此處](https://github.com/BerriAI/litellm/blob/b8b927f23bc336862dacb89f59c784a8d62aaa15/model_prices_and_context_window.json#L6985)

## LLM 翻譯 {#llm-translation}

1. LM Studio -> 修正非同步嵌入請求呼叫 
2. Gpt 4o models - 修正 response_format 翻譯 
3. Bedrock nova - 擴充支援的文件類型，加入 .md、.csv 等 [從這裡開始](../../docs/providers/bedrock#usage---pdf--document-understanding)
4. Bedrock - 關於 bedrock 的 IAM role based access 文件 - [從這裡開始](https://docs.litellm.ai/docs/providers/bedrock#sts-role-based-auth)
5. Bedrock - 在使用時快取 IAM role 憑證 
6. Google AI Studio (`gemini/`) - 支援 gemini 的 'frequency_penalty' 與 'presence_penalty'
7. Azure O1 - 修正模型名稱檢查 
8. WatsonX - 支援 WatsonX 的 ZenAPIKey [文件](../../docs/providers/watsonx)
9. Ollama Chat - 支援 json schema 回應格式 [從這裡開始](../../docs/providers/ollama#json-schema-support)
10. Bedrock - 若串流期間發生錯誤，回傳正確的 bedrock 狀態碼與錯誤訊息
11. Anthropic - 支援 anthropic 呼叫中的巢狀 json schema
12. OpenAI - 支援 `metadata` 參數預覽 
    1. SDK - 透過 `litellm.enable_preview_features = True` 啟用 
    2. PROXY - 透過 `litellm_settings::enable_preview_features: true` 啟用 
13. Replicate - 在 status=processing 時重試 completion 回應 

## 支出追蹤改善 {#spend-tracking-improvements}

1. Bedrock - QA 斷言所有 bedrock 區域模型都具有與基礎模型相同的 `supported_` 
2. Bedrock - 修正指定區域名稱時的 bedrock converse 成本追蹤
3. Spend Logs 可靠性修正 - 當請求本文中傳入的 `user` 是整數而非字串時 
4. 確保 ‘base_model’ 成本追蹤可跨所有端點運作 
5. 圖片生成成本追蹤修正 
6. Anthropic - 修正 anthropic 終端使用者成本追蹤
7. JWT / OIDC Auth - 新增從 jwt auth 追蹤終端使用者 id

## 管理端點 / UI {#management-endpoints--ui}

1. 允許團隊成員在新增後成為管理員（ui + endpoints） 
2. UI 上用於更新團隊成員資格的新編輯 / 刪除按鈕 
3. 若為團隊管理員 - 顯示所有團隊金鑰 
4. Model Hub - 澄清模型成本是每 1m tokens 計算 
5. 邀請連結 - 修正產生無效 url 的問題
6. 新增 - SpendLogs 表格檢視器 - 允許 proxy 管理員在 UI 上檢視 spend logs 
    1. 新的 spend logs - 允許 proxy 管理員在 spend logs 表格中「選擇加入」記錄 request/response - 以更容易偵測濫用 
    2. 顯示 spend logs 中的來源國家 
    3. 新增依金鑰名稱 / 團隊名稱分頁 + 篩選 
7. `/key/delete` - 允許團隊管理員刪除團隊金鑰 
8. Internal User ‘view’ - 修正在選擇團隊時的支出計算
9. Model Analytics 現在在 Free 上  
10. Usage 頁面 - 顯示 spend = 0 的日期，並將圖表上的 spend 四捨五入到 2 位有效數字 
11. Public Teams - 允許管理員在 UI 上將團隊公開，供新使用者「加入」 - [從這裡開始](https://docs.litellm.ai/docs/proxy/public_teams)
12. 防護欄
    1. 在虛擬金鑰上設定 / 編輯防護欄 
    2. 允許在團隊上設定防護欄 
    3. 在建立 + 編輯團隊頁面上設定防護欄
13. 支援在 `/key/update` 上暫時提高預算 - 新增 `temp_budget_increase` 與 `temp_budget_expiry` 欄位 - [從這裡開始](../../docs/proxy/virtual_keys#temporary-budget-increase)
14. 支援在金鑰輪替時將新的金鑰別名寫入 AWS Secret Manager [從這裡開始](../../docs/secret#aws-secret-manager)

## Helm {#helm}

1. 將 securityContext 與拉取政策值加入 migration job（感謝 https://github.com/Hexoplon） 
2. 允許在 values.yaml 上指定 envVars
3. 新的 helm lint 測試

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

1. 在使用 prompt management 時記錄所使用的 prompt。[從這裡開始](../../docs/proxy/prompt_management)
2. 支援帶有團隊別名前綴的 s3 記錄 - [從這裡開始](https://docs.litellm.ai/docs/proxy/logging#team-alias-prefix-in-object-key)
3. Prometheus [從這裡開始](../../docs/proxy/prometheus)
    1. 修正 litellm_llm_api_time_to_first_token_metric 未為 bedrock 模型填入
    2. 定期發出剩餘團隊預算指標（即使未發出請求）- 可在 Grafana/etc. 上獲得更穩定的指標 
    3. 新增金鑰與團隊層級預算指標
    4. 發出 `litellm_overhead_latency_metric` 
    5. 發出 `litellm_team_budget_reset_at_metric` 與 `litellm_api_key_budget_remaining_hours_metric` 
4. Datadog - 支援將 spend 標籤記錄到 Datadog。[從這裡開始](../../docs/proxy/enterprise#tracking-spend-for-custom-tags)
5. Langfuse - 修正記錄 request 標籤，改從標準 logging payload 讀取 
6. GCS - 記錄時不要截斷 payload 
7. 新的 GCS Pub/Sub 記錄支援 [從這裡開始](https://docs.litellm.ai/docs/proxy/logging#google-cloud-storage---pubsub-topic)
8. 新增 AIM Guardrails 支援 [從這裡開始](../../docs/proxy/guardrails/aim_security)

## 安全性 {#security}

1. 針對修補安全漏洞的新 Enterprise SLA。[請見此處](../../docs/enterprise#slas--professional-support)
2. Hashicorp - 支援使用 vault namespace 進行 TLS auth。[從這裡開始](../../docs/secret#hashicorp-vault)
3. Azure - DefaultAzureCredential 支援 

## 健康檢查 {#health-checks}

1. 從萬用路由清單中清除僅定價的模型名稱 - 防止錯誤的健康檢查 
2. 允許為萬用路由指定健康檢查模型 - https://docs.litellm.ai/docs/proxy/health#wildcard-routes
3. 新增 ‘health_check_timeout ‘ 參數，預設上限為 1 分鐘，以防止不良模型在健康檢查中卡住並導致 pod 重新啟動。[從這裡開始](../../docs/proxy/health#health-check-timeout)
4. Datadog - 新增 data dog 服務健康檢查 + 公開新的 `/health/services` 端點。[從這裡開始](../../docs/proxy/health#healthservices)

## 效能 / 可靠性改善 {#performance--reliability-improvements}

1. RPS 提升 3 倍 - 改為使用 orjson 讀取 request body 
2. LLM 路由速度提升 - 使用快取的 get model group info
3. SDK 速度提升 - 使用快取的 get model info helper - 降低取得模型資訊所需的 CPU 工作量 
4. Proxy 速度提升 - 每個請求只讀取一次 request body 
5. 程式碼庫新增無限迴圈偵測腳本 
6. Bedrock - 純非同步圖片轉換請求 
7. 冷卻機制 - 在高流量下，若 100% 呼叫失敗則改為單一部署模型群組 - 防止 o1 當機影響其他呼叫 
8. 回應標頭 - 回傳 
    1. `x-litellm-timeout` 
    2. `x-litellm-attempted-retries`
    3. `x-litellm-overhead-duration-ms` 
    4. `x-litellm-response-duration-ms` 
9. 確保不會將重複的 callback 加入 proxy
10. Requirements.txt - 提升 certifi 版本

## 一般 Proxy 改善 {#general-proxy-improvements}

1. JWT / OIDC Auth - 新增 `enforce_rbac` 參數，允許 proxy 管理員防止任何尚未對應但已驗證的 jwt token 呼叫 proxy。[從這裡開始](../../docs/proxy/token_auth#enforce-role-based-access-control-rbac)
2. 修正自訂 swagger 的自訂 openapi schema 產生
3. Request Headers - 支援從 request headers 讀取 `x-litellm-timeout` 參數。啟用在使用 Vercel 的 AI SDK + LiteLLM Proxy 時進行模型逾時控制。[從這裡開始](../../docs/proxy/request_headers#litellm-headers)
4. JWT / OIDC Auth - 針對模型驗證新增以 `role` 為基礎的權限。[請見此處](https://docs.litellm.ai/docs/proxy/jwt_auth_arch)

## 完整 Git Diff {#complete-git-diff}

這是 v1.57.8-stable 與 v1.59.8-stable 之間的 diff。

可使用這項內容查看程式碼庫中的變更。

[**Git Diff**](https://github.com/BerriAI/litellm/compare/v1.57.8-stable...v1.59.8-stable)
