---
title: "v1.76.0-stable - RPS 改進"
slug: "v1-76-0"
date: 2025-08-23T10:00:00
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

:::info

LiteLLM 正在招募 **創始後端工程師**，地點為舊金山。 

如果您有興趣，請[在此應徵](https://www.ycombinator.com/companies/litellm/jobs/6uvoBp3-founding-backend-engineer)！
:::

## 部署此版本 {#deploy-this-version}

:::info

此版本尚未上線。 
:::

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 錯誤 {#bugs}
- **[OpenAI](../../docs/providers/openai)**
    - Gpt-5 chat：澄清不支援函式呼叫 [PR #13612](https://github.com/BerriAI/litellm/pull/13612)，感謝 @[superpoussin22](https://github.com/superpoussin22)
- **[VertexAI](../../docs/providers/vertex)**
    - 修正 vertexai 批次檔案格式，作者 @[thiagosalvatore](https://github.com/thiagosalvatore) 於 [PR #13576](https://github.com/BerriAI/litellm/pull/13576)
- **[LiteLLM Proxy](../../docs/providers/litellm_proxy)**
    - 新增透過 SDK 在 Proxy 呼叫 image_edits + image_generations 的支援 - [PR #13735](https://github.com/BerriAI/litellm/pull/13735)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 修正 anthropic Claude 4 的 max_output_tokens 值 - [PR #13526](https://github.com/BerriAI/litellm/pull/13526)
- **[Gemini](../../docs/providers/gemini)**
    - 修正提示快取成本計算 - [PR #13742](https://github.com/BerriAI/litellm/pull/13742)
- **[Azure](../../docs/providers/azure)**
    - 支援 `../openai/v1/respones` API 基底位址 - [PR #13526](https://github.com/BerriAI/litellm/pull/13526)
    - 修正 azure/gpt-5-chat 的 max_input_tokens - [PR #13660](https://github.com/BerriAI/litellm/pull/13660)
- **[Groq](../../docs/providers/groq)**
    - 串流 ASCII 編碼問題 - [PR #13675](https://github.com/BerriAI/litellm/pull/13675)
- **[Baseten](../../docs/providers/baseten)**
    - 重構整合以使用新的 OpenAI 相容端點 - [PR #13783](https://github.com/BerriAI/litellm/pull/13783)
- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 Bedrock 轉送端點的 application inference profile - [PR #13881](https://github.com/BerriAI/litellm/pull/13881)
- **[DataRobot](../../docs/providers/datarobot)**
    - 更新 DataRobot 提供者 URL 的處理方式 - [PR #13880](https://github.com/BerriAI/litellm/pull/13880)

#### 功能 {#features}
- **[Together AI](../../docs/providers/together)**
    - 新增 Qwen3、Deepseek R1 0528 Throughput、GLM 4.5 與 GPT-OSS 模型成本追蹤 - [PR #13637](https://github.com/BerriAI/litellm/pull/13637)，感謝 @[Tasmay-Tibrewal](https://github.com/Tasmay-Tibrewal)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 新增 fireworks_ai/accounts/fireworks/models/deepseek-v3-0324 - [PR #13821](https://github.com/BerriAI/litellm/pull/13821)
- **[VertexAI](../../docs/providers/vertex)**
    - 新增 VertexAI qwen API 服務 - [PR #13828](https://github.com/BerriAI/litellm/pull/13828)
    - 新增 VertexAI 影像模型 vertex_ai/imagen-4.0-generate-001、vertex_ai/imagen-4.0-ultra-generate-001、vertex_ai/imagen-4.0-fast-generate-001 - [PR #13874](https://github.com/BerriAI/litellm/pull/13874)
- **[Anthropic](../../docs/providers/anthropic)**
    - 新增長上下文支援與成本追蹤 - [PR #13759](https://github.com/BerriAI/litellm/pull/13759)
- **[DeepInfra](../../docs/providers/deepinfra)**
    - 新增 deepinfra 的 rerank 端點支援 - [PR #13820](https://github.com/BerriAI/litellm/pull/13820)
    - 新增用於成本追蹤的新模型 - [PR #13883](https://github.com/BerriAI/litellm/pull/13883)，感謝 @[Toy-97](https://github.com/Toy-97)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增非同步呼叫的工具提示快取 - [PR #13803](https://github.com/BerriAI/litellm/pull/13803)，感謝 @[UlookEE](https://github.com/UlookEE)
    - aws bedrock 的角色鏈結與 webauthentication 的 session 名稱 - [PR #13753](https://github.com/BerriAI/litellm/pull/13753)，感謝 @[RichardoC](https://github.com/RichardoC)
- **[Ollama](../../docs/providers/ollama)**
    - 處理在使用工具呼叫且模型未經工具訓練時的 Ollama 空回應 - [PR #13902](https://github.com/BerriAI/litellm/pull/13902)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 deepseek/deepseek-chat-v3.1 支援 - [PR #13897](https://github.com/BerriAI/litellm/pull/13897)
- **[Mistral](../../docs/providers/mistral)**
    - 新增透過 chat completions 呼叫 mistral 檔案的支援 - [PR #13866](https://github.com/BerriAI/litellm/pull/13866)，感謝 @[jinskjoy](https://github.com/jinskjoy)
    - 處理空的 assistant 內容 - [PR #13671](https://github.com/BerriAI/litellm/pull/13671)
    - 支援新的「thinking」回應區塊 - [PR #13671](https://github.com/BerriAI/litellm/pull/13671)
- **[Databricks](../../docs/providers/databricks)**
    - 移除已棄用的 dbrx 模型（dbrx-instruct、llama 3.1）- [PR #13843](https://github.com/BerriAI/litellm/pull/13843)
- **[AI/ML API](../../docs/providers/ai_ml_api)**
    - 影像生成 API 支援 - [PR #13893](https://github.com/BerriAI/litellm/pull/13893)

## LLM API 端點 {#llm-api-endpoints}
#### 錯誤 {#bugs-1}
- **[Responses API](../../docs/response_api)**
    - 為 OpenAI responses API 請求新增預設 API 版本 - [PR #13526](https://github.com/BerriAI/litellm/pull/13526)
    - 支援 allowed_openai_params - [PR #13671](https://github.com/BerriAI/litellm/pull/13671)

## MCP 閘道 {#mcp-gateway}
#### 錯誤 {#bugs-2}
- 修正 StreamableHTTPSessionManager .run() 錯誤 - [PR #13666](https://github.com/BerriAI/litellm/pull/13666)

## 向量儲存  {#vector-stores}
#### 錯誤 {#bugs-3}
- **[Bedrock](../../docs/providers/bedrock)**
    - 查詢時使用 LiteLLM 受管理憑證 - [PR #13787](https://github.com/BerriAI/litellm/pull/13787)

## 管理端點 / UI {#management-endpoints--ui}
#### 錯誤 {#bugs-4}
- **[Passthrough](../../docs/pass_through/intro)**
    - 修正查詢 passthrough 刪除 - [PR #13622](https://github.com/BerriAI/litellm/pull/13622)

#### 功能 {#features-1}
- **模型**
    - 在模型儀表板中新增公共模型名稱的搜尋功能 - [PR #13687](https://github.com/BerriAI/litellm/pull/13687)
    - 在 UI 中自動將 `azure/` 加入 deployment 名稱 - [PR #13685](https://github.com/BerriAI/litellm/pull/13685)
    - Models 頁面的列 UI 重構 - [PR #13771](https://github.com/BerriAI/litellm/pull/13771)
- **通知**
    - 在所有地方新增新的通知吐司 UI - [PR #13813](https://github.com/BerriAI/litellm/pull/13813)
- **金鑰**
    - 重新產生金鑰後修正金鑰編輯設定 - [PR #13815](https://github.com/BerriAI/litellm/pull/13815)
    - 建立 service account 金鑰時需要 team_id - [PR #13873](https://github.com/BerriAI/litellm/pull/13873)
    - 篩選器 - 點擊篩選選項時顯示所有選項 - [PR #13858](https://github.com/BerriAI/litellm/pull/13858)
- **用量**
    - 修正使用者代理程式活動分頁上「Cannot read properties of undefined」例外 - [PR #13892](https://github.com/BerriAI/litellm/pull/13892)
- **SSO**
    - 免費提供最多 5 位使用者的 SSO 使用權 - [PR #13843](https://github.com/BerriAI/litellm/pull/13843)

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}
#### 錯誤 {#bugs-5}
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 新增 bedrock API 金鑰支援 - [PR #13835](https://github.com/BerriAI/litellm/pull/13835)
#### 功能 {#features-2}
- **[Datadog LLM Observability](../../docs/integrations/datadog)**
    - 新增失敗記錄支援 [PR #13726](https://github.com/BerriAI/litellm/pull/13726)
    - 新增首 token 時間、litellm 額外負擔、防護欄額外負擔延遲指標 - [PR #13734](https://github.com/BerriAI/litellm/pull/13734)
    - 新增防護欄輸入/輸出追蹤支援 - [PR #13767](https://github.com/BerriAI/litellm/pull/13767)
- **[Langfuse OTEL](../../docs/integrations/langfuse)**
    - 允許使用以金鑰/團隊為基礎的記錄 - [PR #13791](https://github.com/BerriAI/litellm/pull/13791)
- **[AIM](../../docs/integrations/aim)**
    - 遷移至新的防火牆 API - [PR #13748](https://github.com/BerriAI/litellm/pull/13748)
- **[OTEL](../../docs/observability/opentelemetry_integration)**
    - 為實際 LLM API 呼叫新增 OTEL 追蹤 - [PR #13836](https://github.com/BerriAI/litellm/pull/13836)
- **[MLFlow](../../docs/observability/mlflow_integration)**
    - 在 MLflow 追蹤中包含預測輸出 - [PR #13795](https://github.com/BerriAI/litellm/pull/13795)，感謝 @TomeHirata  

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}
#### 錯誤 {#bugs-6}
- **[Cooldowns](../../docs/routing#how-cooldowns-work)**
    - 不要將原始 Azure 例外回傳給用戶端（可能包含提示外洩）- [PR #13529](https://github.com/BerriAI/litellm/pull/13529)
- **[Auto-router](../../docs/proxy/auto_routing)**
    - 確保 LiteLLM Docker 上已有 auto router 的相關依賴 - [PR #13788](https://github.com/BerriAI/litellm/pull/13788)
- **模型別名**
    - 修正可存取 model alias 的呼叫金鑰 - [PR #13830](https://github.com/BerriAI/litellm/pull/13830)

#### 功能 {#features-3}
- **[S3 快取](../../docs/proxy/caching)**
    - 將 namespace 用作 s3 快取的前綴 - [PR #13704](https://github.com/BerriAI/litellm/pull/13704)
    - 支援非同步 S3 快取（RPS 提升 4 倍）- [PR #13852](https://github.com/BerriAI/litellm/pull/13852), 特別感謝 @[michal-otmianowski](https://github.com/michal-otmianowski)
- **Model Group 標頭轉送**
    - 重用與全域標頭轉送相同的邏輯 - [PR #13741](https://github.com/BerriAI/litellm/pull/13741)
    - 在 UI 上新增對 hosted_vllm 的支援 - [PR #13885](https://github.com/BerriAI/litellm/pull/13885)
- **效能**
    - 透過 +200 RPS 提升 LiteLLM Python SDK 的 RPS（braintrust 匯入 + aiohttp 傳輸修正）- [PR #13839](https://github.com/BerriAI/litellm/pull/13839)
    - 將模型路由改為使用 O(1) Set 查找 - [PR #13879](https://github.com/BerriAI/litellm/pull/13879)
    - 降低來自 litellm_logging.py 的顯著 CPU 額外負擔 - [PR #13895](https://github.com/BerriAI/litellm/pull/13895)
    - 提升 Async Success Handler（記錄回呼）效能 - 約 +130 RPS - [PR #13905](https://github.com/BerriAI/litellm/pull/13905)

## 一般 Proxy 改進 {#general-proxy-improvements}
#### 錯誤修正 {#bugs-7}

- **SDK**
    - 修正 litellm 與最新版 openAI（>v1.100.0）的相容性 - [PR #13728](https://github.com/BerriAI/litellm/pull/13728)
- **Helm**
    - 新增為 migrations-job 設定資源的可能性 - [PR #13617](https://github.com/BerriAI/litellm/pull/13617)
    - 確保 Helm chart 自動產生的 master key 符合 sk-xxxx 格式 - [PR #13871](https://github.com/BerriAI/litellm/pull/13871)
    - 強化資料庫設定：新增對可選 endpointKey 的支援 - [PR #13763](https://github.com/BerriAI/litellm/pull/13763)
- **速率限制**
    - 修正在 parallel_request_limiter_v3 上 descriptor/response 大小不匹配的問題 - [PR #13863](https://github.com/BerriAI/litellm/pull/13863), 特別感謝  @[luizrennocosta](https://github.com/luizrennocosta)
- **非 root**
    - 修正 non-root 映像中的 prisma migrate 權限存取問題 - [PR #13848](https://github.com/BerriAI/litellm/pull/13848), 特別感謝 @[Ithanil](https://github.com/Ithanil)
