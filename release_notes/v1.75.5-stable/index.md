---
title: "v1.75.5-stable - Redis 延遲改善"
slug: "v1-75-5"
date: 2025-08-10T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.75.5-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.75.5.post2
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Redis - 延遲改善** - 在啟用 Redis 時將 P99 延遲降低 50%。 
- **Responses API 工作階段管理** - 支援管理含圖片的 responses API 工作階段。
- **Oracle Cloud Infrastructure** - 用於在 Oracle Cloud Infrastructure 上呼叫模型的新 LLM 提供者。
- **Digital Ocean's Gradient AI** - 用於在 Digital Ocean's Gradient AI 平台上呼叫模型的新 LLM 提供者。

---

### 升級風險 {#risk-of-upgrade}

如果您是從 pip 套件建置 proxy，應該暫緩升級。這個版本會讓 `prisma migrate deploy` 成為我們管理 DB 的預設值。這樣更安全，因為不會重設 DB，但需要手動 `prisma generate` 步驟。 

Docker 映像的使用者不會受到此變更影響。 

---

## Redis 延遲改善 {#redis-latency-improvements}

<Image 
  img={require('../../img/release_notes/faster_caching_calls.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

這個版本為 Redis 請求新增了記憶體內快取，讓高流量情境下的回應時間更快。現在，LiteLLM 實例會先檢查其記憶體內快取是否命中，然後才檢查 Redis。這將 LLM API 呼叫的快取相關延遲從 100ms 降低到命中快取時的 1ms 以下。 

---

## 含圖片的 Responses API 工作階段管理 {#responses-api-session-management-w-images}

<Image 
  img={require('../../img/release_notes/responses_api_session_mgt_images.jpg')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

LiteLLM 現在支援含圖片的 Responses API 請求的工作階段管理。這對於像聊天機器人這類使用 Responses API 追蹤對話狀態的使用情境非常有幫助。LiteLLM 工作階段管理可跨 **所有** LLM API 運作（包括 Anthropic、Bedrock、OpenAI 等）。LiteLLM 工作階段管理的運作方式是將您可指定的請求與回應內容儲存在 s3 bucket 中。 

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/100萬 tokens） | 輸出（$/100萬 tokens） |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | 
| Bedrock | `bedrock/us.anthropic.claude-opus-4-1-20250805-v1:0` | 200k | $15 | $75 |
| Bedrock | `bedrock/openai.gpt-oss-20b-1:0` | 200k | 0.07 | 0.3 |
| Bedrock | `bedrock/openai.gpt-oss-120b-1:0` | 200k | 0.15 | 0.6 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/glm-4p5` | 128k | 0.55 | 2.19 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/glm-4p5-air` | 128k | 0.22 | 0.88 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/gpt-oss-120b` | 131072 | 0.15 | 0.6 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/gpt-oss-20b` | 131072 | 0.05 | 0.2 |
| Groq | `groq/openai/gpt-oss-20b` | 131072 | 0.1 | 0.5 |
| Groq | `groq/openai/gpt-oss-120b` | 131072 | 0.15 | 0.75 |
| OpenAI | `openai/gpt-5` | 400k | 1.25 | 10 | 
| OpenAI | `openai/gpt-5-2025-08-07` | 400k | 1.25 | 10 | 
| OpenAI | `openai/gpt-5-mini` | 400k | 0.25 | 2 |
| OpenAI | `openai/gpt-5-mini-2025-08-07` | 400k | 0.25 | 2 | 
| OpenAI | `openai/gpt-5-nano` | 400k | 0.05 | 0.4 | 
| OpenAI | `openai/gpt-5-nano-2025-08-07` | 400k | 0.05 | 0.4 | 
| OpenAI | `openai/gpt-5-chat` | 400k | 1.25 | 10 | 
| OpenAI | `openai/gpt-5-chat-latest` | 400k | 1.25 | 10 | 
| Azure | `azure/gpt-5` | 400k | 1.25 | 10 | 
| Azure | `azure/gpt-5-2025-08-07` | 400k | 1.25 | 10 | 
| Azure | `azure/gpt-5-mini` | 400k | 0.25 | 2 | 
| Azure | `azure/gpt-5-mini-2025-08-07` | 400k | 0.25 | 2 | 
| Azure | `azure/gpt-5-nano-2025-08-07` | 400k | 0.05 | 0.4 | 
| Azure | `azure/gpt-5-nano` | 400k | 0.05 | 0.4 | 
| Azure | `azure/gpt-5-chat` | 400k | 1.25 | 10 | 
| Azure | `azure/gpt-5-chat-latest` | 400k | 1.25 | 10 | 

#### 功能 {#features}

- **[OCI](../../docs/providers/oci)**
    - 新 LLM 提供者 - [PR #13206](https://github.com/BerriAI/litellm/pull/13206)
- **[JinaAI](../../docs/providers/jina_ai)**
    - 支援多模態 embedding 模型 - [PR #13181](https://github.com/BerriAI/litellm/pull/13181)
- **GPT-5 ([OpenAI](../../docs/providers/openai)/[Azure](../../docs/providers/azure))**
    - 支援 temperature 的 drop_params - [PR #13390](https://github.com/BerriAI/litellm/pull/13390)
    - 將 max_tokens 對應到 max_completion_tokens - [PR #13390](https://github.com/BerriAI/litellm/pull/13390)
- **[Anthropic](../../docs/providers/anthropic)**
    - 在 model cost map 中新增 claude-opus-4-1 - [PR #13384](https://github.com/BerriAI/litellm/pull/13384)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 在 model cost map 中新增 gpt-oss - [PR #13442](https://github.com/BerriAI/litellm/pull/13442)
- **[Cerebras](../../docs/providers/cerebras)**
    - 在 model cost map 中新增 gpt-oss - [PR #13442](https://github.com/BerriAI/litellm/pull/13442)
- **[Azure](../../docs/providers/azure)**
    - 支援 o-series 模型的 ‘temperature’ drop params - [PR #13353](https://github.com/BerriAI/litellm/pull/13353)
- **[GradientAI](../../docs/providers/gradient_ai)**
    - 新 LLM 提供者 - [PR #12169](https://github.com/BerriAI/litellm/pull/12169)

#### 錯誤 {#bugs}

- **[OpenAI](../../docs/providers/openai)**
    - 將 ‘service_tier’ 和 ‘safety_identifier’ 新增為受支援的 responses api 參數 - [PR #13258](https://github.com/BerriAI/litellm/pull/13258)
    - 修正 4o-mini 的 web search 定價 - [PR #13269](https://github.com/BerriAI/litellm/pull/13269)
- **[Mistral](../../docs/providers/mistral)**
    - 呼叫 mistral 時處理 $id 與 $schema 欄位 - [PR #13389](https://github.com/BerriAI/litellm/pull/13389)
---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- `/responses` 
    - 支援圖片的 Responses API 工作階段處理 - [PR #13347](https://github.com/BerriAI/litellm/pull/13347)
    - 若輸入包含 ResponseReasoningItem 則失敗 - [PR #13465](https://github.com/BerriAI/litellm/pull/13465)
    - 支援自訂工具 - [PR #13418](https://github.com/BerriAI/litellm/pull/13418)

#### 錯誤 {#bugs-1}

- `/chat/completions` 
    - 修正 completion_token_details usage 物件缺少 ‘text’ tokens - [PR #13234](https://github.com/BerriAI/litellm/pull/13234)
    - （SDK）處理工具為 pydantic 物件 - [PR #13274](https://github.com/BerriAI/litellm/pull/13274)
    - 在串流 usage 物件中包含成本 - [PR #13418](https://github.com/BerriAI/litellm/pull/13418)
    - 在 /chat/completion 排除 none 欄位 - 允許與 n8n 搭配使用 - [PR #13320](https://github.com/BerriAI/litellm/pull/13320)
- `/responses` 
    - 轉換非 OpenAI 模型（gemini/anthropic）回應中的 function call - [PR #13260](https://github.com/BerriAI/litellm/pull/13260)
    - 修正 model groups 的不支援運算元錯誤 - [PR #13293](https://github.com/BerriAI/litellm/pull/13293)
    - 串流回應的 responses api 工作階段管理 - [PR #13396](https://github.com/BerriAI/litellm/pull/13396)
- `/v1/messages`
    - 新增 litellm claude code count tokens - [PR #13261](https://github.com/BerriAI/litellm/pull/13261)
- `/vector_stores`
    - 修正建立/搜尋 vector store 錯誤 - [PR #13285](https://github.com/BerriAI/litellm/pull/13285)
---

## [MCP 閘道](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-2}

- 新增內部使用者的路由檢查 - [PR #13350](https://github.com/BerriAI/litellm/pull/13350)
- MCP 防護欄 - 文件 - [PR #13392](https://github.com/BerriAI/litellm/pull/13392)

#### 錯誤 {#bugs-2}

- 修正 bearer token servers 的 UI 驗證 - [PR #13312](https://github.com/BerriAI/litellm/pull/13312)
- 允許在 mcp tool 擷取時使用存取群組 - [PR #13425](https://github.com/BerriAI/litellm/pull/13425)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}

- **團隊**
    - 新增對含有金鑰之團隊的刪除檢查 - [PR #12953](https://github.com/BerriAI/litellm/pull/12953)
- **模型**
    - 新增可為每個金鑰/團隊設定模型別名的功能 - [PR #13276](https://github.com/BerriAI/litellm/pull/13276)
    - 新增從 model cost map 重新載入模型定價的按鈕 - [PR #13464](https://github.com/BerriAI/litellm/pull/13464), [PR #13470](https://github.com/BerriAI/litellm/pull/13470)
- **金鑰**
    - 建立服務帳戶金鑰時，將 ‘team’ 欄位設為必填 - [PR #13302](https://github.com/BerriAI/litellm/pull/13302)
    - 將非企業版使用者的以金鑰為基礎的記錄設定設為灰色不可用 - 可避免對是否支援整體 ‘logging’ 造成混淆 - [PR #13431](https://github.com/BerriAI/litellm/pull/13431)
- **導覽列**
    - 為 LiteLLM 管理介面新增 Logo 自訂功能 - [PR #12958](https://github.com/BerriAI/litellm/pull/12958)
- **記錄**
    - 在記錄與 session 頁面新增 token 拆分資訊 - [PR #13357](https://github.com/BerriAI/litellm/pull/13357)
- **用量**
    - 確保用量頁面在資料庫有大型項目後仍可載入 - [PR #13400](https://github.com/BerriAI/litellm/pull/13400)
- **測試金鑰頁面**
    - 允許為 /chat/completions 和 /responses 上傳圖片 - [PR #13445](https://github.com/BerriAI/litellm/pull/13445)
- **MCP**
    - 將認證 token 新增至本機儲存的驗證 - [PR #13473](https://github.com/BerriAI/litellm/pull/13473)

#### 錯誤 {#bugs-3}

- **自訂根路徑**
    - 在啟用 SSO 時修正登入路由 - [PR #13267](https://github.com/BerriAI/litellm/pull/13267)
- **客戶/終端使用者**
    - 允許在終端使用者超出預算時呼叫 /v1/models - 可讓客戶超出預算時，OpenWebUI 上的模型清單功能正常運作 - [PR #13320](https://github.com/BerriAI/litellm/pull/13320)
- **團隊**
    - 從團隊移除使用者時，同步移除使用者 - 團隊成員資格 - [PR #13433](https://github.com/BerriAI/litellm/pull/13433)
- **錯誤**
    - 將網路錯誤回傳給 Logging 與 Alerts 頁面的使用者 - [PR #13427](https://github.com/BerriAI/litellm/pull/13427)
- **模型中樞**
    - 在設定 base model 時顯示 azure 模型的定價 - [PR #13418](https://github.com/BerriAI/litellm/pull/13418)
---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}

- **Bedrock 防護欄**
    - 在 bedrock guardrails 錯誤訊息中移除敏感資訊 - [PR #13356](https://github.com/BerriAI/litellm/pull/13356)
- **標準記錄負載**
    - 修正 ‘can’t register atextexit’ 錯誤 - [PR #13436](https://github.com/BerriAI/litellm/pull/13436)

#### 錯誤 {#bugs-4}

- **Braintrust**
    - 允許設定 braintrust callback base url - [PR #13368](https://github.com/BerriAI/litellm/pull/13368)
- **OTEL**
    - 追蹤 pre_call hook 延遲 - [PR #13362](https://github.com/BerriAI/litellm/pull/13362)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}

- **團隊 BYOK 模型**
    - 新增萬用字元 model 支援 - [PR #13278](https://github.com/BerriAI/litellm/pull/13278)
- **快取**
    - 支援用於快取的 GCP IAM 驗證 - [PR #13275](https://github.com/BerriAI/litellm/pull/13275)
- **延遲**
    - 在啟用 redis 時將 p99 延遲降低 50% - 僅在設定 tpm/rpm 限制時更新模型用量 - [PR #13362](https://github.com/BerriAI/litellm/pull/13362)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-6}

- **模型**
    - 支援 /v1/models/\{model_id\} 擷取 - [PR #13268](https://github.com/BerriAI/litellm/pull/13268)
- **多執行個體**
    - 確保 disable_llm_api_endpoints 可正常運作 - [PR #13278](https://github.com/BerriAI/litellm/pull/13278)
- **記錄**
    - 新增 apscheduler 記錄抑制 - [PR #13299](https://github.com/BerriAI/litellm/pull/13299)
- **Helm**
    - 在 migrations 工作範本中新增標籤 - [PR #13343](https://github.com/BerriAI/litellm/pull/13343) 感謝 [@unique-jakub](https://github.com/unique-jakub)

#### 錯誤 {#bugs-5}

- **非 root 映像**
    - 修正 migration 的非 root 映像 - [PR #13379](https://github.com/BerriAI/litellm/pull/13379)
- **取得路由**
    - 在使用 fastapi-offline 時載入 get routes - [PR #13466](https://github.com/BerriAI/litellm/pull/13466)
- **健康檢查**
    - 為 Langfuse 健康檢查產生唯一的 trace ID - [PR #13468](https://github.com/BerriAI/litellm/pull/13468)
- **Swagger**
    - 允許將 Swagger 用於 /chat/completions - [PR #13469](https://github.com/BerriAI/litellm/pull/13469)
- **驗證**
    - 修正 JWTs access 與 model access groups 搭配時無法運作的問題 - [PR #13474](https://github.com/BerriAI/litellm/pull/13474)
    
---

## 新貢獻者 {#new-contributors}

* @bbartels 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13244
* @breno-aumo 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13206
* @pascalwhoop 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13122
* @ZPerling 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13045
* @zjx20 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13181
* @edwarddamato 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/13368
* @msannan2 完成了他們的首次貢獻，於 https://github.com/BerriAI/litellm/pull/12169

## **[完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.74.15-stable...v1.75.5-stable.rc-draft)** {#full-changeloghttpsgithubcomberriailitellmcomparev17415-stablev1755-stablerc-draft}
