---
title: "v1.72.6-stable - MCP 閘道權限管理"
slug: "v1-72-6-stable"
date: 2025-06-14T10:00:00
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
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.72.6-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.72.6.post2
```

</TabItem>
</Tabs>

## 重點摘要 {#tldr}

* **為什麼要升級**
    - Claude Code 上的 Codex-mini：您現在可以透過 Claude Code 使用 `codex-mini`（OpenAI 的程式碼助理模型）。
    - MCP 權限管理：在 LiteLLM 上依 Keys、Teams、Organizations（entities）管理 MCP Servers 的權限。
    - UI：可在 logs view 上開啟/關閉自動重新整理。 
    - Rate Limiting：支援僅針對 output token 的 rate limiting。  
* **誰應該閱讀**
    - 使用 `/v1/messages` API（Claude Code）的團隊
    - 使用 **MCP** 的團隊
    - 提供自架模型存取並設定 rate limits 的團隊
* **升級風險**
    - **低**
        - 現有功能或套件更新沒有重大變更。

---

## 主要亮點 {#key-highlights}

### MCP 權限管理 {#mcp-permissions-management}

<Image img={require('../../img/release_notes/mcp_permissions.png')}/>

本次釋出新增支援在 LiteLLM 上依 Keys、Teams、Organizations（entities）管理 MCP Servers 的權限。當 MCP client 嘗試列出 tools 時，LiteLLM 只會回傳該 entity 有權存取的 tools。

這對於需要存取受限制資料（例如 Jira MCP）、但不希望所有人都能使用的情境非常有幫助。

對 Proxy Admins 而言，這可讓所有 MCP Servers 的存取控制集中管理。對開發者而言，這表示您只會看到指派給您的 MCP tools。

### Claude Code 上的 Codex-mini {#codex-mini-on-claude-code}

<Image img={require('../../img/release_notes/codex_on_claude_code.jpg')} />

本次釋出新增支援透過 Claude Code 呼叫 `codex-mini`（OpenAI 的程式碼助理模型）。

這是透過 LiteLLM 啟用任何 Responses API model（包括 `o3-pro`）可經由 `/chat/completions` 與 `/v1/messages` endpoints 呼叫而達成。這包括：

- 串流請求
- 非串流請求
- Responses API models 在成功與失敗時的成本追蹤

以下是今天的使用方式 [today](../../docs/tutorials/claude_responses_api)

---

## 新增 / 更新的模型 {#new--updated-models}

### 價格 / Context Window 更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 類型 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | -------------------- | 
| VertexAI   | `vertex_ai/claude-opus-4`               | 200K           | $15.00              | $75.00               | 新增 |
| OpenAI   | `gpt-4o-audio-preview-2025-06-03`             | 128k           | $2.5 (text), $40 (audio)              | $10 (text), $80 (audio)               | 新增 |
| OpenAI | `o3-pro` | 200k | 20 | 80 | 新增 |
| OpenAI | `o3-pro-2025-06-10` | 200k | 20 | 80 | 新增 |
| OpenAI | `o3` | 200k | 2 | 8 | 已更新 |
| OpenAI | `o3-2025-04-16` | 200k | 2 | 8 | 已更新 |
| Azure | `azure/gpt-4o-mini-transcribe` | 16k | 1.25 (text), 3 (audio) | 5 (text) | 新增 |
| Mistral | `mistral/magistral-medium-latest` | 40k | 2 | 5 | 新增 |
| Mistral | `mistral/magistral-small-latest` | 40k | 0.5 | 1.5 | 新增 |

- Deepgram：現在支援 `nova-3` 的每秒成本定價。(https://github.com/BerriAI/litellm/pull/11634)

### 已更新模型 {#updated-models}
#### 錯誤修正 {#bugs}
- **[Watsonx](../../docs/providers/watsonx)**
    - 忽略 Watsonx deployments 上的 space id（會拋出 json errors）- [PR](https://github.com/BerriAI/litellm/pull/11527)
- **[Ollama](../../docs/providers/ollama)**
    - 為串流請求設定 tool call id - [PR](https://github.com/BerriAI/litellm/pull/11528)
- **Gemini ([VertexAI](../../docs/providers/vertex) + [Google AI Studio](../../docs/providers/gemini))**
    - 修正 tool call indexes - [PR](https://github.com/BerriAI/litellm/pull/11558)
    - 處理 function calls 中 arguments 的空字串 - [PR](https://github.com/BerriAI/litellm/pull/11601)
    - 從 file url’s 推斷時新增 audio/ogg mime type 支援 - [PR](https://github.com/BerriAI/litellm/pull/11635)
- **[自訂 LLM](../../docs/providers/custom_llm_server)**
    - 修正將 api_base、api_key、litellm_params_dict 傳入 custom_llm embedding methods - [PR](https://github.com/BerriAI/litellm/pull/11450) s/o [ElefHead](https://github.com/ElefHead)
- **[Huggingface](../../docs/providers/huggingface)**
    - 在缺少時將 /chat/completions 加入 endpoint url - [PR](https://github.com/BerriAI/litellm/pull/11630)
- **[Deepgram](../../docs/providers/deepgram)**
    - 支援 async httpx calls - [PR](https://github.com/BerriAI/litellm/pull/11641)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將前綴（如果已設定）附加到 assistant content start - [PR](https://github.com/BerriAI/litellm/pull/11719)

#### 功能 {#features}
- **[VertexAI](../../docs/providers/vertex)**
    - 支援在 passthrough 上透過 env var 設定的 vertex credentials - [PR](https://github.com/BerriAI/litellm/pull/11527)
    - 支援在 model 只有該區域可用時選擇 ‘global’ region - [PR](https://github.com/BerriAI/litellm/pull/11566)
    - Anthropic passthrough 成本計算 + token 追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11611)
    - 支援 passthrough 上的 ‘global’ vertex region - [PR](https://github.com/BerriAI/litellm/pull/11661)
- **[Anthropic](../../docs/providers/anthropic)**
    - ‘none’ tool choice param 支援 - [PR](https://github.com/BerriAI/litellm/pull/11695), [開始使用](../../docs/providers/anthropic#disable-tool-calling)
- **[Perplexity](../../docs/providers/perplexity)**
    - 新增 ‘reasoning_effort’ 支援 - [PR](https://github.com/BerriAI/litellm/pull/11562), [開始使用](../../docs/providers/perplexity#reasoning-effort)
- **[Mistral](../../docs/providers/mistral)**
    - 新增 mistral reasoning 支援 - [PR](https://github.com/BerriAI/litellm/pull/11642), [開始使用](../../docs/providers/mistral#reasoning)
- **[SGLang](../../docs/providers/openai_compatible)**
    - 對 context window exceeded error 進行對應以便正確處理 - [PR](https://github.com/BerriAI/litellm/pull/11575/)
- **[Deepgram](../../docs/providers/deepgram)**
    - 支援 provider specific params - [PR](https://github.com/BerriAI/litellm/pull/11638)
- **[Azure](../../docs/providers/azure)**
    - 回傳內容安全性篩選結果 - [PR](https://github.com/BerriAI/litellm/pull/11655)
---

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bugs-1}
- **[聊天完成](../../docs/completion/input)**
    - 串流 - 確保各個 chunks 的 ‘created’ 一致 - [PR](https://github.com/BerriAI/litellm/pull/11528)
#### 功能 {#features-1}
- **MCP**
    - 新增 MCP 權限管理控制項 - [PR](https://github.com/BerriAI/litellm/pull/11598), [文件](../../docs/mcp#-mcp-permission-management)
    - 新增 MCP List + Call Tool 操作的權限管理 - [PR](https://github.com/BerriAI/litellm/pull/11682), [文件](../../docs/mcp#-mcp-permission-management)
    - 可串流 HTTP server 支援 - [PR](https://github.com/BerriAI/litellm/pull/11628), [PR](https://github.com/BerriAI/litellm/pull/11645), [文件](../../docs/mcp#using-your-mcp)
    - 使用 Experimental dedicated Rest endpoints 進行 list、呼叫 MCP tools - [PR](https://github.com/BerriAI/litellm/pull/11684)
- **[回應 API](../../docs/response_api)**
    - 新 API Endpoint - 列出輸入項目 - [PR](https://github.com/BerriAI/litellm/pull/11602) 
    - OpenAI + Azure OpenAI 的背景模式 - [PR](https://github.com/BerriAI/litellm/pull/11640)
    - responses api 請求上的 Langfuse/other Logging 支援 - [PR](https://github.com/BerriAI/litellm/pull/11685)
- **[聊天完成](../../docs/completion/input)**
    - Responses API 的橋接器 - 可透過 `/chat/completions` 和 `/v1/messages` 呼叫 codex-mini - [PR](https://github.com/BerriAI/litellm/pull/11632), [PR](https://github.com/BerriAI/litellm/pull/11685)

---

## 支出追蹤 {#spend-tracking}

#### 錯誤修正 {#bugs-2}
- **[終端使用者](../../docs/proxy/customers)**
    - 根據 budget duration 更新 enduser spend 與 budget reset date - [PR](https://github.com/BerriAI/litellm/pull/8460) (s/o [laurien16](https://github.com/laurien16))
- **[自訂定價](../../docs/proxy/custom_pricing)**
    - 將科學記號字串轉換為整數 - [PR](https://github.com/BerriAI/litellm/pull/11655)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤 {#bugs-3}
- **[使用者](../../docs/proxy/users)**
    - `/user/info` - 修正傳入使用者時，在使用者 ID 中包含 `+` 的情況
    - 新增由管理員啟動的密碼重設流程 - [PR](https://github.com/BerriAI/litellm/pull/11618)
    - 修正預設使用者設定 UI 渲染錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11674)
- **[預算](../../docs/proxy/users)**
    - 修正建立新使用者預算時的成功訊息 - [PR](https://github.com/BerriAI/litellm/pull/11608)

#### 功能 {#features-2}
- **左側導覽**
    - 在 UI 顯示剩餘的 Enterprise 使用者數
- **MCP**
    - 新增伺服器新增表單 - [PR](https://github.com/BerriAI/litellm/pull/11604)
    - 允許編輯 mcp 伺服器 - [PR](https://github.com/BerriAI/litellm/pull/11693)
- **模型**
    - 在 UI 新增 deepgram 模型
    - 在 UI 新增 Model Access Group 支援 - [PR](https://github.com/BerriAI/litellm/pull/11719)
- **金鑰**
    - 修剪過長的使用者 ID - [PR](https://github.com/BerriAI/litellm/pull/11488)
- **記錄**
    - 在記錄檢視新增即時尾隨功能，允許使用者在高流量時停用自動重新整理 - [PR](https://github.com/BerriAI/litellm/pull/11712)
    - 稽核記錄 - 預覽截圖 - [PR](https://github.com/BerriAI/litellm/pull/11715)

---

## 記錄 / 防護欄 整合 {#logging--guardrails-integrations}

#### 錯誤 {#bugs-4}
- **[Arize](../../docs/observability/arize_integration)**
    - 將 space_key 標頭改為 space_id - [PR](https://github.com/BerriAI/litellm/pull/11595)（s/o [vanities](https://github.com/vanities)）
- **[Prometheus](../../docs/proxy/prometheus)**
    - 修正總請求數累加 - [PR](https://github.com/BerriAI/litellm/pull/11718)

#### 功能 {#features-3}
- **[Lasso 防護欄](../../docs/proxy/guardrails/lasso_security)**
    - [NEW] Lasso Guardrails 支援 - [PR](https://github.com/BerriAI/litellm/pull/11565)
- **[使用者](../../docs/proxy/users)**
    - 在 `/user/new` 上新增 `organizations` 參數 - 可在建立時將使用者加入組織 - [PR](https://github.com/BerriAI/litellm/pull/11572/files)
- **在使用 bridge 邏輯時防止重複記錄** - [PR](https://github.com/BerriAI/litellm/pull/11687)

---

## 效能 / 可靠性改善 {#performance--reliability-improvements}

#### 錯誤 {#bugs-5}
- **[基於標籤的路由](../../docs/proxy/tag_routing)**
    - 當請求指定標籤時，不要考慮「default」模型 - [PR](https://github.com/BerriAI/litellm/pull/11454)（s/o [thiagosalvatore](https://github.com/thiagosalvatore)）

#### 功能 {#features-4}
- **[快取](../../docs/caching/all_caches)**
    - 新增可選的 ‘litellm[caching]’ pip install，以加入磁碟快取依賴 - [PR](https://github.com/BerriAI/litellm/pull/11600)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

#### 錯誤 {#bugs-6}
- **aiohttp**
    - 修正 aiohttp transport 的 transfer encoding 錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11561)

#### 功能 {#features-5}
- **aiohttp**
    - 為 aiohttp transport 啟用系統 Proxy 支援 - [PR](https://github.com/BerriAI/litellm/pull/11616)（s/o [idootop](https://github.com/idootop)）
- **CLI**
    - 讓所有命令都顯示伺服器 URL - [PR](https://github.com/BerriAI/litellm/pull/10801)
- **Unicorn**
    - 允許設定 keep alive timeout - [PR](https://github.com/BerriAI/litellm/pull/11594)
- **Experimental Rate Limiting v2**（透過 `EXPERIMENTAL_MULTI_INSTANCE_RATE_LIMITING="True"` 啟用）
    - 支援僅依 output_tokens 指定 rate limit - [PR](https://github.com/BerriAI/litellm/pull/11646)
    - 呼叫失敗時減少平行請求數 - [PR](https://github.com/BerriAI/litellm/pull/11646)
    - 僅支援 in-memory rate limiting - [PR](https://github.com/BerriAI/litellm/pull/11646)
    - 依 key/user/team 回傳剩餘 rate limits - [PR](https://github.com/BerriAI/litellm/pull/11646)
- **Helm**
    - 支援 migrations-job.yaml 中的 extraContainers - [PR](https://github.com/BerriAI/litellm/pull/11649)

---

## 新增貢獻者 {#new-contributors}
* @laurien16 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/8460
* @fengbohello 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11547
* @lapinek 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11570
* @yanwork 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11586
* @dhs-shine 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11575
* @ElefHead 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11450
* @idootop 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11616
* @stevenaldinger 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11649
* @thiagosalvatore 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11454
* @vanities 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11595
* @alvarosevilla95 完成了第一次貢獻，於 https://github.com/BerriAI/litellm/pull/11661

---

## Demo 實例 {#demo-instance}

以下是用來測試變更的 Demo 實例：

- 實例：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/compare/v1.72.2-stable...1.72.6.rc) {#git-diffhttpsgithubcomberriailitellmcomparev1722-stable1726rc}
