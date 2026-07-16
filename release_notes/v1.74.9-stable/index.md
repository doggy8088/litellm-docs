---
title: "v1.74.9-stable - 自動路由器"
slug: "v1-74-9"
date: 2025-07-27T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.74.9-stable.patch.1
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.74.9.post2
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **自動路由器** - 根據請求內容自動將請求路由到特定模型。
- **模型層級防護欄** - 僅在使用特定模型時執行防護欄。
- **MCP 標頭傳遞** - 將標頭從用戶端傳遞到後端 MCP。
- **新 LLM 提供者** - 新增 Bedrock inpainting 支援與 Recraft API 圖像生成 / 圖像編輯支援。

---

## 自動路由器 {#auto-router}

<Image img={require('../../img/release_notes/auto_router.png')} />

<br/>

此版本導入了依據請求內容自動路由到模型的功能。這表示當 **Proxy Admins** 選擇啟用自動路由器時，**users** 可以定義一組關鍵字，讓系統一律路由到特定模型。

這非常適合內部使用情境，因為您不希望 **users** 去思考要使用哪個模型——例如，使用 Claude 模型進行程式撰寫，而使用 GPT 模型生成廣告文案。

[閱讀更多](../../docs/proxy/auto_routing)

---

## 模型層級防護欄 {#model-level-guardrails}

<Image img={require('../../img/release_notes/model_level_guardrails.jpg')} />

<br/>

此版本為您的 config.yaml + UI 帶來模型層級防護欄支援。這非常適合當您同時有內部部署與託管模型，且只想執行以防止將 PII 傳送到託管模型的情境。

```yaml
model_list:
  - model_name: claude-sonnet-4
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
      api_base: https://api.anthropic.com/v1
      guardrails: ["azure-text-moderation"] # 👈 KEY CHANGE

guardrails:
  - guardrail_name: azure-text-moderation
    litellm_params:
      guardrail: azure/text_moderations
      mode: "post_call" 
      api_key: os.environ/AZURE_GUARDRAIL_API_KEY
      api_base: os.environ/AZURE_GUARDRAIL_API_BASE 
```


[閱讀更多](../../docs/proxy/guardrails/quick_start#model-level-guardrails)

---
## MCP 標頭傳遞 {#mcp-header-propagation}

<Image img={require('../../img/release_notes/mcp_header_propogation.png')} />

<br/>

v1.74.9-stable 讓您可以透過 LiteLLM 傳遞 MCP 伺服器特定的驗證標頭

- 允許使用者透過標頭指定哪個 `header_name` 要傳遞到哪個 `mcp_server`
- 可為同一 MCP 伺服器類型的不同部署新增不同的驗證標頭

[閱讀更多](https://docs.litellm.ai/docs/mcp#new-server-specific-auth-headers-recommended)

---
## 新模型 / 更新模型 {#new-models--updated-models}

#### 價格 / Context Window 更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- |
| Fireworks AI | `fireworks/models/kimi-k2-instruct` | 131k | $0.6 | $2.5 | 
| OpenRouter | `openrouter/qwen/qwen-vl-plus` | 8192 | $0.21 | $0.63 | 
| OpenRouter | `openrouter/qwen/qwen3-coder` | 8192 | $1 | $5 | 
| OpenRouter | `openrouter/bytedance/ui-tars-1.5-7b` | 128k | $0.10 | $0.20 | 
| Groq | `groq/qwen/qwen3-32b` | 131k | $0.29 | $0.59 | 
| VertexAI | `vertex_ai/meta/llama-3.1-8b-instruct-maas` | 128k | $0.00 | $0.00 | 
| VertexAI | `vertex_ai/meta/llama-3.1-405b-instruct-maas` | 128k | $5 | $16 | 
| VertexAI | `vertex_ai/meta/llama-3.2-90b-vision-instruct-maas` | 128k | $0.00 | $0.00 | 
| Google AI Studio | `gemini/gemini-2.0-flash-live-001` | 1,048,576 | $0.35 | $1.5 | 
| Google AI Studio | `gemini/gemini-2.5-flash-lite` | 1,048,576 | $0.1 | $0.4 | 
| VertexAI | `vertex_ai/gemini-2.0-flash-lite-001` | 1,048,576 | $0.35 | $1.5 | 
| OpenAI | `gpt-4o-realtime-preview-2025-06-03` | 128k | $5 | $20 |

#### 功能 {#features}

- **[Lambda AI](../../docs/providers/lambda_ai)**
    - 新 LLM API 提供者 - [PR #12817](https://github.com/BerriAI/litellm/pull/12817)
- **[Github Copilot](../../docs/providers/github_copilot)**
    - 支援動態端點 - [PR #12827](https://github.com/BerriAI/litellm/pull/12827)
- **[Morph](../../docs/providers/morph)**
    - 新 LLM API 提供者 - [PR #12821](https://github.com/BerriAI/litellm/pull/12821)
- **[Groq](../../docs/providers/groq)**
    - 移除已淘汰的 groq/qwen-qwq-32b - [PR #12832](https://github.com/BerriAI/litellm/pull/12831)
- **[Recraft](../../docs/providers/recraft)**
    - 新圖像生成 API - [PR #12832](https://github.com/BerriAI/litellm/pull/12832)
    - 新圖像編輯 API - [PR #12874](https://github.com/BerriAI/litellm/pull/12874)
- **[Azure OpenAI](../../docs/providers/azure/azure)**
    - 支援 DefaultAzureCredential，無需硬編碼環境變數 - [PR #12841](https://github.com/BerriAI/litellm/pull/12841)
- **[Hyperbolic](../../docs/providers/hyperbolic)**
    - 新 LLM API 提供者 - [PR #12826](https://github.com/BerriAI/litellm/pull/12826)
- **[OpenAI](../../docs/providers/openai)**
    - `/realtime` API - 傳遞 intent 查詢參數 - [PR #12838](https://github.com/BerriAI/litellm/pull/12838)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 Amazon Nova Canvas 的 inpainting 支援 - [PR #12949](https://github.com/BerriAI/litellm/pull/12949) 感謝 @[SantoshDhaladhuli](https://github.com/SantoshDhaladhuli)

#### 錯誤修正 {#bugs}
- **Gemini ([Google AI Studio](../../docs/providers/gemini) + [VertexAI](../../docs/providers/vertex))**
    - 修正同步請求時洩漏檔案描述元錯誤 - [PR #12824](https://github.com/BerriAI/litellm/pull/12824)
- **IBM Watsonx**
    - 為 tool choice 使用正確的參數名稱 - [PR #9980](https://github.com/BerriAI/litellm/pull/9980)
- **[Anthropic](../../docs/providers/anthropic)**
    - 僅為支援的模型顯示 ‘reasoning_effort’ - [PR #12847](https://github.com/BerriAI/litellm/pull/12847)
    - 處理 tool call 請求中的 $id 和 $schema（Anthropic API 已停止接受它們）- [PR #12959](https://github.com/BerriAI/litellm/pull/12959)
- **[Openrouter](../../docs/providers/openrouter)**
    - 過濾掉非 anthropic 模型的 cache_control 標記（可搭配 claude code 使用）https://github.com/BerriAI/litellm/pull/12850
- **[Gemini](../../docs/providers/gemini)**
    - 縮短 Gemini tool_call_id 以相容 Open AI - [PR #12941](https://github.com/BerriAI/litellm/pull/12941) 感謝 @[tonga54](https://github.com/tonga54)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Passthrough 端點](../../docs/pass_through/)**
    - 將 key/user/team 成本追蹤改為 OSS - [PR #12847](https://github.com/BerriAI/litellm/pull/12847)
- **[/v1/models](../../docs/providers/passthrough)**
    - 將備援模型作為 API 回應的一部分回傳 - [PR #12811](https://github.com/BerriAI/litellm/pull/12811) 感謝 @[murad-khafizov](https://github.com/murad-khafizov)
- **[/vector_stores](../../docs/providers/passthrough)**
    - 將權限管理改為 OSS - [PR #12990](https://github.com/BerriAI/litellm/pull/12990)

#### 錯誤修正 {#bugs-1}
1. `/batches`
    1. 在成本追蹤檢查期間略過無效批次（先前會停止所有檢查） - [PR #12782](https://github.com/BerriAI/litellm/pull/12782)
2. `/chat/completions`
    1. 修正 .acompletion() 的非同步重試器 - [PR #12886](https://github.com/BerriAI/litellm/pull/12886)

---

## [MCP 閘道](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-2}
- **[權限管理](../../docs/mcp#grouping-mcps-access-groups)**
    - 將依 key/team 的權限管理改為 OSS - [PR #12988](https://github.com/BerriAI/litellm/pull/12988)
- **[MCP 別名](../../docs/mcp#mcp-aliases)**
    - 支援 mcp server 別名（適合在 Cursor 上呼叫很長的 mcp server 名稱）- [PR #12994](https://github.com/BerriAI/litellm/pull/12994)
- **標頭傳遞**
    - 支援將標頭從用戶端傳遞到後端 MCP（適合將 personal access tokens 傳送到後端 MCP）- [PR #13003](https://github.com/BerriAI/litellm/pull/13003)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}
- **用量**
    - 支援依模型群組檢視用量 - [PR #12890](https://github.com/BerriAI/litellm/pull/12890)
- **虛擬金鑰**
    - 在 `/key/generate` 上新增 `key_type` 欄位 - 可指定 key 是否能呼叫 LLM API 與管理路由 - [PR #12909](https://github.com/BerriAI/litellm/pull/12909)
- **模型**
    - 在 UI 上新增「自動路由器」- [PR #12960](https://github.com/BerriAI/litellm/pull/12960)
    - 在 UI 上顯示全域重試政策 - [PR #12969](https://github.com/BerriAI/litellm/pull/12969)
    - 在建立與更新時新增模型層級防護欄 - [PR #13006](https://github.com/BerriAI/litellm/pull/13006)

#### 錯誤修正 {#bugs-2}
- **SSO**
    - 在啟用 SSO 時修正登出問題 - [PR #12703](https://github.com/BerriAI/litellm/pull/12703)
    - 在更新 ui_access_mode 時修正重設 SSO - [PR #13011](https://github.com/BerriAI/litellm/pull/13011)
- **防護欄**
    - 編輯團隊時顯示正確的 guardrails - [PR #12823](https://github.com/BerriAI/litellm/pull/12823)
- **虛擬金鑰**
    - 重新產生 key 時取得更新後的 token - [PR #12788](https://github.com/BerriAI/litellm/pull/12788)
    - 修正 key 注入的 CVE - [PR #12840](https://github.com/BerriAI/litellm/pull/12840)
---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}
- **[Google Cloud Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 文件新的防護欄 - [PR #12492](https://github.com/BerriAI/litellm/pull/12492)
- **[Pillar Security](../../docs/proxy/guardrails/pillar_security)**
    - 新的 LLM 防護欄 - [PR #12791](https://github.com/BerriAI/litellm/pull/12791)
- **CloudZero**
    - 允許將支出匯出到 cloudzero - [PR #12908](https://github.com/BerriAI/litellm/pull/12908)
- **模型層級防護欄**
    - 支援模型層級防護欄 - [PR #12968](https://github.com/BerriAI/litellm/pull/12968)

#### 錯誤 {#bugs-3}
- **[Prometheus](../../docs/proxy/prometheus)**
    - 修正設定標籤式指標的標籤時的 `[tag]=false` - [PR #12916](https://github.com/BerriAI/litellm/pull/12916)
- **[Guardrails AI](../../docs/proxy/guardrails/guardrails_ai)**
    - 使用 ‘validatedOutput’ 以允許使用 “fix” guards - [PR #12891](https://github.com/BerriAI/litellm/pull/12891) 感謝 @[DmitriyAlergant](https://github.com/DmitriyAlergant)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}
- **[自動路由器](../../docs/proxy/auto_routing)**
    - 由 `semantic-router` 驅動的新 auto-router - [PR #12955](https://github.com/BerriAI/litellm/pull/12955)

#### 錯誤 {#bugs-4}
- **forward_clientside_headers**
    - 從標頭中篩除 `content-length`（導致後端請求卡住）- [PR #12886](https://github.com/BerriAI/litellm/pull/12886/files)
- **訊息遮罩**
    - 修正無法 pickle coroutine object 錯誤 - [PR #13005](https://github.com/BerriAI/litellm/pull/13005)
---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-6}
- **基準測試**
    - 更新 litellm proxy 基準測試（p50、p90、p99 額外負擔）- [PR #12842](https://github.com/BerriAI/litellm/pull/12842)
- **請求標頭**
    - 新增 `x-litellm-num-retries` 請求標頭
- **Swagger**
    - 支援自訂 root paths 上的本機 swagger - [PR #12911](https://github.com/BerriAI/litellm/pull/12911)
- **健康狀態**
    - 追蹤成本 + 為 LiteLLM Proxy 執行的健康檢查新增標籤 - [PR #12880](https://github.com/BerriAI/litellm/pull/12880)
#### 錯誤 {#bugs-5}

- **Proxy 啟動**
    - 修正在啟動時，當 team member budget 為 None 會阻擋啟動的問題 - [PR #12843](https://github.com/BerriAI/litellm/pull/12843)
- **Docker**
    - 將 non-root docker 移至 chain guard image（更少漏洞）- [PR #12707](https://github.com/BerriAI/litellm/pull/12707)
    - 將 azure-keyvault==4.2.0 加入 Docker img - [PR #12873](https://github.com/BerriAI/litellm/pull/12873)
- **分離式健康檢查應用程式**
    - 透過 supervisord 傳遞 cmd args（讓使用者設定在 docker 中仍可運作）- [PR #12871](https://github.com/BerriAI/litellm/pull/12871)
- **Swagger**
    - 升級 DOMPurify 版本（修正漏洞）- [PR #12911](https://github.com/BerriAI/litellm/pull/12911)
    - 加回本機 swagger bundle（讓 swagger 能在 air gapped 環境中運作）- [PR #12911](https://github.com/BerriAI/litellm/pull/12911)
- **請求標頭**
    - 將 ‘user_header_name’ 欄位檢查改為不分大小寫（修正 OpenWebUi 的客戶預算強制執行）- [PR #12950](https://github.com/BerriAI/litellm/pull/12950)
- **支出記錄**
    - 修正 custom_llm_provider 為 None 時寫入 DB 的問題 - [PR #13001](https://github.com/BerriAI/litellm/pull/13001)

---

## 新貢獻者 {#new-contributors}
* @magicalne 在 https://github.com/BerriAI/litellm/pull/12804 完成了他們的第一次貢獻
* @pavangudiwada 在 https://github.com/BerriAI/litellm/pull/12798 完成了他們的第一次貢獻
* @mdiloreto 在 https://github.com/BerriAI/litellm/pull/12707 完成了他們的第一次貢獻
* @murad-khafizov 在 https://github.com/BerriAI/litellm/pull/12811 完成了他們的第一次貢獻
* @eagle-p 在 https://github.com/BerriAI/litellm/pull/12791 完成了他們的第一次貢獻
* @apoorv-sharma 在 https://github.com/BerriAI/litellm/pull/12920 完成了他們的第一次貢獻
* @SantoshDhaladhuli 在 https://github.com/BerriAI/litellm/pull/12949 完成了他們的第一次貢獻
* @tonga54 在 https://github.com/BerriAI/litellm/pull/12941 完成了他們的第一次貢獻
* @sings-to-bees-on-wednesdays 在 https://github.com/BerriAI/litellm/pull/12950 完成了他們的第一次貢獻

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.74.7-stable...v1.74.9.rc-draft)** {#full-changeloghttpsgithubcomberriailitellmcomparev1747-stablev1749rc-draft}
