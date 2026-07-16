---
title: "v1.73.6-stable"
slug: "v1-73-6-stable"
date: 2025-06-28T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.73.6-stable.patch.1
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.73.6.post1
```

</TabItem>
</Tabs>

---

## 主要重點  {#key-highlights}

### gemini-cli 上的 Claude {#claude-on-gemini-cli}

<Image img={require('../../img/release_notes/gemini_cli.png')} />

<br/>

此版本帶來了在 LiteLLM 中使用 gemini-cli 的支援。 

您可以在 gemini-cli 上使用 claude-sonnet-4、gemini-2.5-flash（Vertex AI 與 Google AI Studio）、gpt-4.1，以及任何 LiteLLM 支援的模型。

當您在 LiteLLM 中使用 gemini-cli 時，您會獲得以下優點：

**開發者優點：**
- 通用模型存取：透過 gemini-cli 介面使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）。
- 更高的速率限制與可靠性：跨多個模型與提供者進行負載平衡，以避免碰到單一提供者的限制，並以備援機制確保即使某個提供者失敗，您仍可取得回應。

**Proxy 管理員優點：**
- 集中管理：透過單一 LiteLLM proxy 執行個體控制所有模型的存取，而無需將每個提供者的 API 金鑰交給您的開發人員。
- 預算控制：設定支出上限，並追蹤所有 gemini-cli 使用情況的成本。

[開始使用](../../docs/tutorials/litellm_gemini_cli)

<br/>

### Batch API 成本追蹤 {#batch-api-cost-tracking}

<Image img={require('../../img/release_notes/batch_api_cost_tracking.jpg')}/>

<br/>

v1.73.6 為 [LiteLLM Managed Batch API](../../docs/proxy/managed_batches) 請求帶來成本追蹤。先前，對於使用 LiteLLM Managed Files 的 Batch API 請求並未進行此項處理。現在，LiteLLM 會將每個 batch 請求的狀態儲存在資料庫中，並在背景輪詢未完成的 batch 作業，在 batch 完成後發出支出記錄以供成本追蹤。

您端不需要任何新的旗標／變更。未來幾週內，我們希望將此擴展至涵蓋 Anthropic passthrough 的 batch 成本追蹤。 

[開始使用](../../docs/proxy/managed_batches)

---

## 新模型／更新模型 {#new-models--updated-models}

### 定價／上下文視窗更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/100萬 token） | 輸出（$/100萬 token） | 類型 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | ---- |
| Azure OpenAI | `azure/o3-pro` | 200k | $20.00 | $80.00 | 新增 |
| OpenRouter | `openrouter/mistralai/mistral-small-3.2-24b-instruct` | 32k | $0.1 | $0.3 | 新增 |
| OpenAI | `o3-deep-research` | 200k | $10.00 | $40.00 | 新增 |
| OpenAI | `o3-deep-research-2025-06-26` | 200k | $10.00 | $40.00 | 新增 |
| OpenAI | `o4-mini-deep-research` | 200k | $2.00 | $8.00 | 新增 |
| OpenAI | `o4-mini-deep-research-2025-06-26` | 200k | $2.00 | $8.00 | 新增 |
| Deepseek | `deepseek-r1` | 65k | $0.55 | $2.19 | 新增 |
| Deepseek | `deepseek-v3` | 65k | $0.27 | $0.07 | 新增 |

### 更新模型 {#updated-models}
#### 錯誤 {#bugs}
    - **[Sambanova](../../docs/providers/sambanova)**
        - 處理 float 時間戳記 - [PR](https://github.com/BerriAI/litellm/pull/11971) s/o [@neubig](https://github.com/neubig)
    - **[Azure](../../docs/providers/azure)**
        - 在 Responses API 上支援 Azure Authentication 方法（azure ad token、api keys） - [PR](https://github.com/BerriAI/litellm/pull/11941) s/o [@hsuyuming](https://github.com/hsuyuming)
        - 將 ‘image_url’ 字串對應為巢狀字典 - [PR](https://github.com/BerriAI/litellm/pull/12075) s/o [@davis-featherstone](https://github.com/davis-featherstone)
    - **[Watsonx](../../docs/providers/watsonx)**
        - 當模型是自訂部署的一部分時，將 ‘model’ 欄位設為 None——修正在這些情況下 WatsonX 拋出的錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11854) s/o [@cbjuan](https://github.com/cbjuan)
    - **[Perplexity](../../docs/providers/perplexity)**
        - 支援 web_search_options - [PR](https://github.com/BerriAI/litellm/pull/11983)
        - 支援 citation token 與搜尋查詢成本計算 - [PR](https://github.com/BerriAI/litellm/pull/11938)
    - **[Anthropic](../../docs/providers/anthropic)**
        - 處理 usage 區塊中的 null 值 - [PR](https://github.com/BerriAI/litellm/pull/12068)
    - **Gemini ([Google AI Studio](../../docs/providers/gemini) + [VertexAI](../../docs/providers/vertex))**
        - 只使用可接受的格式值（enum 與 datetime）——否則 gemini 會拋出錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11989) 
        - 若工具與快取內容一併傳入，則快取工具（否則 gemini 會拋出錯誤） - [PR](https://github.com/BerriAI/litellm/pull/11989)
        - Json schema 轉換改進：修正 unpack_def 在 anyof 項目內處理巢狀 $ref 的方式 - [PR](https://github.com/BerriAI/litellm/pull/11964)
    - **[Mistral](../../docs/providers/mistral)**
        - 修正 thinking 提示詞以符合 hugging face 建議 - [PR](https://github.com/BerriAI/litellm/pull/12007)
        - 為除 codestral-mamba 之外的所有 mistral 模型新增 `supports_response_schema: true` - [PR](https://github.com/BerriAI/litellm/pull/12024)
    - **[Ollama](../../docs/providers/ollama)**
        - 修正 embedding 請求上不必要的 await - [PR](https://github.com/BerriAI/litellm/pull/12024)
#### 功能 {#features}
    - **[Azure OpenAI](../../docs/providers/azure)**
        - 檢查 o-series 模型是否支援 reasoning effort（讓 drop_params 可用於 o1 模型） 
        - Assistant + tool 使用成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/12045)
    - **[Nvidia Nim](../../docs/providers/nvidia_nim)**
        - 新增 ‘response_format’ 參數支援 - [PR](https://github.com/BerriAI/litellm/pull/12003) @shagunb-acn 
    - **[ElevenLabs](../../docs/providers/elevenlabs)**
        - 新的 STT 提供者 - [PR](https://github.com/BerriAI/litellm/pull/12119)

---
## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}
    - [**/mcp**](../../docs/mcp)
        - 將適當的 auth 字串值傳送至 `/tool/call` 端點，並帶上 `x-mcp-auth` - [PR](https://github.com/BerriAI/litellm/pull/11968) s/o [@wagnerjt](https://github.com/wagnerjt)
    - [**/v1/messages**](../../docs/anthropic_unified)
        - [自訂 LLM](../../docs/providers/custom_llm_server#anthropic-v1messages) 支援 - [PR](https://github.com/BerriAI/litellm/pull/12016)
    - [**/chat/completions**](../../docs/completion/input)
        - 透過 chat completion 支援 Azure Responses API - [PR](https://github.com/BerriAI/litellm/pull/12016)
    - [**/responses**](../../docs/response_api)
        - 為非 openai 提供者新增 reasoning 內容支援 - [PR](https://github.com/BerriAI/litellm/pull/12055)
    - **[新增] /generateContent**
        - 為 gemini cli 支援新增端點 - [PR](https://github.com/BerriAI/litellm/pull/12040)
        - 支援以其原生格式呼叫 Google AI Studio / VertexAI Gemini 模型 - [PR](https://github.com/BerriAI/litellm/pull/12046)
        - 為串流與非串流 vertex/google ai studio 路由新增記錄 + 成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/12058)
        - 新增從 generateContent 到 /chat/completions 的橋接 - [PR](https://github.com/BerriAI/litellm/pull/12081)
    - [**/batches**](../../docs/batches)
        - 篩選部署，只保留已寫入 Managed File 的部署 - [PR](https://github.com/BerriAI/litellm/pull/12048)
        - 將所有 model / file id 對應儲存在 db 中（先前只有第一個）——啟用「真正的」負載平衡 - [PR](https://github.com/BerriAI/litellm/pull/12048)
        - 支援指定目標模型名稱的 List Batches - [PR](https://github.com/BerriAI/litellm/pull/12049)

---
## 支出追蹤／預算改進 {#spend-tracking--budget-improvements}

#### 功能 {#features-2}
    - [**直通**](../../docs/pass_through)
        - [Bedrock](../../docs/pass_through/bedrock) - 串流與非串流皆支援成本追蹤（`/invoke` + `/converse` 路由） - [PR](https://github.com/BerriAI/litellm/pull/12123)
        - [VertexAI](../../docs/pass_through/vertex_ai) - 支援 anthropic 成本計算 - [PR](https://github.com/BerriAI/litellm/pull/11992)
    - [**Batches**](../../docs/batches)
        - 用於追蹤 LiteLLM Managed batches 成本的背景作業 - [PR](https://github.com/BerriAI/litellm/pull/12125)

---
## 管理端點／UI {#management-endpoints--ui}

#### 錯誤 {#bugs-1}
    - **一般 UI**
        - 修正儀表板元件中的 today 選擇器日期變更 - [PR](https://github.com/BerriAI/litellm/pull/12042)
    - **用量**
        - 彙總分頁端點所有頁面的用量資料 - [PR](https://github.com/BerriAI/litellm/pull/12033)
    - **團隊**
        - 在團隊設定下拉選單中去除重複的模型 - [PR](https://github.com/BerriAI/litellm/pull/12074)
    - **模型**
        - 在使用 azure model 選取「test connect」時保留公開模型名稱（先前會重設） - [PR](https://github.com/BerriAI/litellm/pull/11713)
    - **邀請連結**
        - 確保使用 tf provider 時，Invite links email 內含正確的 invite id - [PR](https://github.com/BerriAI/litellm/pull/12130)
#### 功能 {#features-3}
    - **模型**
        - 在健康檢查表格中新增「最後成功」欄位 - [PR](https://github.com/BerriAI/litellm/pull/11903)
    - **MCP**
        - 新的 UI 元件，支援 auth 類型：api key、bearer token、basic auth - [PR](https://github.com/BerriAI/litellm/pull/11968) s/o [@wagnerjt](https://github.com/wagnerjt)
        - 確保內部使用者可以存取 /mcp 和 /mcp/ 路由 - [PR](https://github.com/BerriAI/litellm/pull/12106)
    - **SCIM**
        - 確保新使用者會套用 default_internal_user_params - [PR](https://github.com/BerriAI/litellm/pull/12015)
    - **團隊**
        - 支援團隊成員金鑰的預設到期時間 - [PR](https://github.com/BerriAI/litellm/pull/12023)
        - 擴充團隊成員新增檢查以涵蓋使用者電子郵件 - [PR](https://github.com/BerriAI/litellm/pull/12082)
    - **UI**
        - 依 SSO 群組限制 UI 存取 - [PR](https://github.com/BerriAI/litellm/pull/12023)
    - **金鑰**
        - 新增 new_key 參數以重新產生金鑰 - [PR](https://github.com/BerriAI/litellm/pull/12087)
    - **測試金鑰**
        - 新的「get code」按鈕，可根據 UI 設定取得可執行的 python 程式碼片段 - [PR](https://github.com/BerriAI/litellm/pull/11629)

--- 

## Logging / 防護欄 整合 {#logging--guardrail-integrations}

#### 錯誤 {#bugs-2}
    - **Braintrust**
        - 將模型加入中繼資料，以啟用 braintrust 成本估算 - [PR](https://github.com/BerriAI/litellm/pull/12022)
#### 功能 {#features-4}
    - **回呼**
        - （企業版）- 停用請求標頭中的記錄回呼 - [PR](https://github.com/BerriAI/litellm/pull/11985)
        - 新增 List Callbacks API Endpoint - [PR](https://github.com/BerriAI/litellm/pull/11987)
    - **Bedrock 防護欄**
        - 在 intervene 動作時不要引發例外 - [PR](https://github.com/BerriAI/litellm/pull/11875)
        - 使用 post call 時，確保 PII Masking 套用於回應串流或非串流內容 - [PR](https://github.com/BerriAI/litellm/pull/12086)
    - **[NEW] Palo Alto Networks Prisma AIRS 防護欄**
        - [PR](https://github.com/BerriAI/litellm/pull/12116)
    - **ElasticSearch**
        - 新的 Elasticsearch Logging 教學 - [PR](https://github.com/BerriAI/litellm/pull/11761)
    - **訊息去識別化**
        - 保留 Embedding 去識別化的用量 / 模型資訊 - [PR](https://github.com/BerriAI/litellm/pull/12088)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 錯誤 {#bugs-3}
    - **僅限團隊模型**
        - 在非團隊請求的路由邏輯中過濾僅限團隊模型
    - **超出 Context Window 的錯誤**
        - 捕捉 anthropic 例外 - [PR](https://github.com/BerriAI/litellm/pull/12113)
#### 功能 {#features-5}
    - **路由器**
        - 允許為特定部署使用動態冷卻時間 - [PR](https://github.com/BerriAI/litellm/pull/12037)
        - 處理部署的 cooldown_time = 0 - [PR](https://github.com/BerriAI/litellm/pull/12108)
    - **Redis**
        - 新增更好的偵錯資訊，以查看設定了哪些變數 - [PR](https://github.com/BerriAI/litellm/pull/12073)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

#### 錯誤 {#bugs-4}
    - **aiohttp**
        - 在網路請求中檢查 HTTP_PROXY 變數
        - 允許在 trust_env 中使用 HTTP_ Proxy 設定

#### 功能 {#features-6}
    - **文件**
        - 新增建議規格 - [PR](https://github.com/BerriAI/litellm/pull/11980)
    - **Swagger**
        - 引入新的環境變數 NO_REDOC 以選擇不使用 Redoc - [PR](https://github.com/BerriAI/litellm/pull/12092)

---

## 新貢獻者 {#new-contributors}
* @mukesh-dream11 首次貢獻於 https://github.com/BerriAI/litellm/pull/11969
* @cbjuan 首次貢獻於 https://github.com/BerriAI/litellm/pull/11854
* @ryan-castner 首次貢獻於 https://github.com/BerriAI/litellm/pull/12055
* @davis-featherstone 首次貢獻於 https://github.com/BerriAI/litellm/pull/12075
* @Gum-Joe 首次貢獻於 https://github.com/BerriAI/litellm/pull/12068
* @jroberts2600 首次貢獻於 https://github.com/BerriAI/litellm/pull/12116
* @ohmeow 首次貢獻於 https://github.com/BerriAI/litellm/pull/12022
* @amarrella 首次貢獻於 https://github.com/BerriAI/litellm/pull/11942
* @zhangyoufu 首次貢獻於 https://github.com/BerriAI/litellm/pull/12092
* @bougou 首次貢獻於 https://github.com/BerriAI/litellm/pull/12088
* @codeugar 首次貢獻於 https://github.com/BerriAI/litellm/pull/11972
* @glgh 首次貢獻於 https://github.com/BerriAI/litellm/pull/12133

## **[Git Diff](https://github.com/BerriAI/litellm/compare/v1.73.0-stable...v1.73.6.rc-draft)** {#git-diffhttpsgithubcomberriailitellmcomparev1730-stablev1736rc-draft}
