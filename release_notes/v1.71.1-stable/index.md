---
title: v1.71.1-stable - 2x 更高的每秒請求數（RPS）
slug: v1.71.1-stable
date: 2025-05-24T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
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
docker.litellm.ai/berriai/litellm:main-v1.71.1-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.71.1
```
</TabItem>
</Tabs>

## 重點亮點 {#key-highlights}

LiteLLM v1.71.1-stable 現已上線。以下是此版本的重點亮點：

- **效能改進**：LiteLLM 現在每個執行個體可擴充至 200 RPS，且中位回應時間為 74ms。 
- **檔案權限**：在 OpenAI、Azure、VertexAI 之間控制檔案存取。 
- **MCP x OpenAI**：將 MCP 伺服器與 OpenAI Responses API 搭配使用。

## 效能改進 {#performance-improvements}

<Image img={require('../../img/perf_imp.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本為所有 LLM API 提供者帶來 aiohttp 支援。這表示 LiteLLM 現在在 40ms 的中位延遲額外開銷下，每個執行個體可擴充至 200 RPS。 

此變更讓 LiteLLM 在此延遲額外開銷下可擴充的 RPS 直接加倍。

您可以透過啟用下方旗標來採用此功能。（我們預計在 1 週內將其設為預設值。）

### 啟用旗標 {#flag-to-enable}

**在 LiteLLM Proxy 上**

在環境變數中設定 `USE_AIOHTTP_TRANSPORT=True`。 

```yaml showLineNumbers title="Environment Variable"
export USE_AIOHTTP_TRANSPORT="True"
```

**在 LiteLLM Python SDK 上**

設定 `use_aiohttp_transport=True` 以啟用 aiohttp 傳輸。 

```python showLineNumbers title="Python SDK"
import litellm

litellm.use_aiohttp_transport = True # default is False, enable this to use aiohttp transport
result = litellm.completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello, world!"}],
)
print(result)
```

## 檔案權限 {#file-permissions}

<Image img={require('../../img/files_api_graphic.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本為 [LiteLLM Managed Files](../../docs/proxy/litellm_managed_files) 帶來 [File Permissions](../../docs/proxy/litellm_managed_files#file-permissions) 與 [Finetuning APIs](../../docs/proxy/managed_finetuning) 支援。這非常適合： 

- **Proxy 管理員**：因為使用者只能檢視/編輯/刪除自己建立的檔案——即使是在使用共用的 OpenAI/Azure/Vertex 部署時也是如此。
- **開發者**：取得一個標準介面，可在 Chat/Finetuning/Batch APIs 之間使用 Files。

## 新模型 / 更新模型 {#new-models--updated-models}

- **Gemini [VertexAI](https://docs.litellm.ai/docs/providers/vertex), [Google AI Studio](https://docs.litellm.ai/docs/providers/gemini)**
    - 新的 gemini 模型 - [PR 1](https://github.com/BerriAI/litellm/pull/10991), [PR 2](https://github.com/BerriAI/litellm/pull/10998)
        - `gemini-2.5-flash-preview-tts`
        - `gemini-2.0-flash-preview-image-generation`
        - `gemini/gemini-2.5-flash-preview-05-20`
        - `gemini-2.5-flash-preview-05-20`
- **[Anthropic](../../docs/providers/anthropic)**
    - 支援 Claude-4 模型家族 - [PR](https://github.com/BerriAI/litellm/pull/11060)
- **[Bedrock](../../docs/providers/bedrock)**
    - 支援 Claude-4 模型家族 - [PR](https://github.com/BerriAI/litellm/pull/11060)
    - 支援 Claude-4 的 `reasoning_effort` 與 `thinking` 參數 - [PR](https://github.com/BerriAI/litellm/pull/11114)
- **[VertexAI](../../docs/providers/vertex)**
    - 支援 Claude-4 模型家族 - [PR](https://github.com/BerriAI/litellm/pull/11060)
    - 支援全域端點 - [PR](https://github.com/BerriAI/litellm/pull/10658)
    - 支援 authorized_user 憑證類型 - [PR](https://github.com/BerriAI/litellm/pull/10899)
- **[xAI](../../docs/providers/xai)**
    - `xai/grok-3` 定價資訊 - [PR](https://github.com/BerriAI/litellm/pull/11028)
- **[LM Studio](../../docs/providers/lm_studio)**
    - 支援結構化 JSON schema 輸出 - [PR](https://github.com/BerriAI/litellm/pull/10929)
- **[SambaNova](../../docs/providers/sambanova)**
    - 更新的模型與參數 - [PR](https://github.com/BerriAI/litellm/pull/10900)
- **[Databricks](../../docs/providers/databricks)**
    - Llama 4 Maverick 模型成本 - [PR](https://github.com/BerriAI/litellm/pull/11008)
    - Claude 3.7 Sonnet 輸出 token 成本修正 - [PR](https://github.com/BerriAI/litellm/pull/11007)
- **[Azure](../../docs/providers/azure)**
    - 支援 Mistral Medium 25.05 - [PR](https://github.com/BerriAI/litellm/pull/11063)
    - 支援以憑證為基礎的驗證 - [PR](https://github.com/BerriAI/litellm/pull/11069)
- **[Mistral](../../docs/providers/mistral)**
    - devstral-small-2505 模型定價與 context window - [PR](https://github.com/BerriAI/litellm/pull/11103)
- **[Ollama](../../docs/providers/ollama)**
    - 支援萬用字元模型 - [PR](https://github.com/BerriAI/litellm/pull/10982)
- **[CustomLLM](../../docs/providers/custom_llm_server)**
    - 新增 embeddings 支援 - [PR](https://github.com/BerriAI/litellm/pull/10980)
- **[Featherless AI](../../docs/providers/featherless_ai)**
    - 可存取 4200+ 個模型 - [PR](https://github.com/BerriAI/litellm/pull/10596)

## LLM API 端點 {#llm-api-endpoints}

- **[Image Edits](../../docs/image_generation)**
    - `/v1/images/edits` - 支援 /images/edits 端點 - [PR](https://github.com/BerriAI/litellm/pull/11020) [PR](https://github.com/BerriAI/litellm/pull/11123)
    - 內容政策違規錯誤對應 - [PR](https://github.com/BerriAI/litellm/pull/11113)
- **[Responses API](../../docs/response_api)**
    - Responses API 的 MCP 支援 - [PR](https://github.com/BerriAI/litellm/pull/11029)
- **[Files API](../../docs/fine_tuning)**
    - LiteLLM Managed Files 的 finetuning 支援 - [PR](https://github.com/BerriAI/litellm/pull/11039) [PR](https://github.com/BerriAI/litellm/pull/11040)
    - 檔案操作（retrieve/list/delete）驗證 - [PR](https://github.com/BerriAI/litellm/pull/11081)

## 管理端點 / UI {#management-endpoints--ui}

- **團隊**
    - 顯示 key 與成員數量 - [PR](https://github.com/BerriAI/litellm/pull/10950)
    - spend 四捨五入到小數點後 4 位 - [PR](https://github.com/BerriAI/litellm/pull/11013)
    - 重新調整 organization 與 team 建立按鈕的位置 - [PR](https://github.com/BerriAI/litellm/pull/10948)
- **金鑰**
    - 重新指派 key 與「updated at」欄位 - [PR](https://github.com/BerriAI/litellm/pull/10960)
    - 在建立時顯示模型存取群組 - [PR](https://github.com/BerriAI/litellm/pull/10965)
- **記錄**
    - logs 上的模型篩選器 - [PR](https://github.com/BerriAI/litellm/pull/11048)
    - 支援 passthrough 端點錯誤記錄 - [PR](https://github.com/BerriAI/litellm/pull/10990)
- **防護欄**
    - Config.yaml guardrails 顯示 - [PR](https://github.com/BerriAI/litellm/pull/10959)
- **組織/使用者**
    - spend 四捨五入到小數點後 4 位 - [PR](https://github.com/BerriAI/litellm/pull/11023)
    - 在將使用者加入 team 時顯示清楚的錯誤訊息 - [PR](https://github.com/BerriAI/litellm/pull/10978)
- **稽核記錄**
    - Audit Logs 的 `/list` 與 `/info` 端點 - [PR](https://github.com/BerriAI/litellm/pull/11102)

## 記錄 / 警示整合 {#logging--alerting-integrations}

- **[Prometheus](../../docs/proxy/prometheus)**
    - 追蹤 proxy_* 指標上的 `route` - [PR](https://github.com/BerriAI/litellm/pull/10992)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 支援 `prompt_label` 參數 - [PR](https://github.com/BerriAI/litellm/pull/11018)
    - 一致的 modelParams 記錄 - [PR](https://github.com/BerriAI/litellm/pull/11018)
- **[DeepEval/ConfidentAI](../../docs/proxy/logging#deepeval)**
    - 為 proxy 與 SDK 啟用記錄 - [PR](https://github.com/BerriAI/litellm/pull/10649)
- **[Logfire](../../docs/proxy/logging)**
    - 修正在使用 Logfire 時 otel proxy server 的初始化 - [PR](https://github.com/BerriAI/litellm/pull/11091)

## 驗證與安全性 {#authentication--security}

- **[JWT Authentication](../../docs/proxy/token_auth)**
    - 支援在透過 JWT authentication upsert 使用者時套用預設內部使用者參數 - [PR](https://github.com/BerriAI/litellm/pull/10995)
    - 支援在透過 JWT authentication upsert 使用者時將使用者對應至 team - [PR](https://github.com/BerriAI/litellm/pull/11108)
- **自訂驗證**
    - 支援在 custom auth 與 API key auth 之間切換 - [PR](https://github.com/BerriAI/litellm/pull/11070)

## 效能 / 可靠性改進 {#performance--reliability-improvements}

- **aiohttp Transport**
    - 中位延遲降低 97%（功能旗標控制） - [PR](https://github.com/BerriAI/litellm/pull/11097) [PR](https://github.com/BerriAI/litellm/pull/11132)
- **背景健康檢查**
    - 可靠性提升 - [PR](https://github.com/BerriAI/litellm/pull/10887)
- **回應處理**
    - 更好的串流狀態碼偵測 - [PR](https://github.com/BerriAI/litellm/pull/10962)
    - 回應 ID 傳遞改進 - [PR](https://github.com/BerriAI/litellm/pull/11006)
- **執行緒管理**
    - 移除會產生錯誤的執行緒以提升可靠性 - [PR](https://github.com/BerriAI/litellm/pull/11066)

## 一般 Proxy 改進 {#general-proxy-improvements}

- **[Proxy CLI](../../docs/proxy/cli)**
    - 跳過伺服器啟動旗標 - [PR](https://github.com/BerriAI/litellm/pull/10665)
    - 提供 DATABASE_URL 時避免覆寫 - [PR](https://github.com/BerriAI/litellm/pull/11076)
- **模型管理**
    - 更新模型後清除快取並重新載入 - [PR](https://github.com/BerriAI/litellm/pull/10853)
    - 電腦使用支援追蹤 - [PR](https://github.com/BerriAI/litellm/pull/10881)
- **Helm Chart**
    - 支援 LoadBalancer 類別 - [PR](https://github.com/BerriAI/litellm/pull/11064)

## 錯誤修正 {#bug-fixes}

本次版本包含多項錯誤修正，以提升穩定性與可靠性：

- **LLM 提供者修正**
    - VertexAI: 
        - 修正 quota_project_id 參數問題 - [PR](https://github.com/BerriAI/litellm/pull/10915)
        - 修正憑證重新整理例外 - [PR](https://github.com/BerriAI/litellm/pull/10969)
    - Cohere: 
        修正在 LiteLLM UI 中新增 Cohere 模型的問題 - [PR](https://github.com/BerriAI/litellm/pull/10822)
    - Anthropic: 
        - 修正 /v1/messages 的串流 dict 物件處理 - [PR](https://github.com/BerriAI/litellm/pull/11032)
    - OpenRouter: 
        - 修正串流使用量 ID 問題 - [PR](https://github.com/BerriAI/litellm/pull/11004)

- **驗證與使用者**
    - 修正邀請電子郵件連結產生 - [PR](https://github.com/BerriAI/litellm/pull/10958) 
    - 修正 JWT 驗證預設角色 - [PR](https://github.com/BerriAI/litellm/pull/10995)
    - 修正使用者預算重設功能 - [PR](https://github.com/BerriAI/litellm/pull/10993)
    - 修正 SSO 使用者相容性與電子郵件驗證 - [PR](https://github.com/BerriAI/litellm/pull/11106)

- **資料庫與基礎架構**
    - 修正 DB 連線參數處理 - [PR](https://github.com/BerriAI/litellm/pull/10842)
    - 修正電子郵件邀請連結 - [PR](https://github.com/BerriAI/litellm/pull/11031)

- **UI 與顯示**
    - 在不需要任何引數時修正 MCP 工具呈現 - [PR](https://github.com/BerriAI/litellm/pull/11012)
    - 修正團隊模型別名刪除 - [PR](https://github.com/BerriAI/litellm/pull/11121)
    - 修正團隊檢視者權限 - [PR](https://github.com/BerriAI/litellm/pull/11127)

- **模型與路由**
    - 修正路由請求中的團隊模型對應 - [PR](https://github.com/BerriAI/litellm/pull/11111)
    - 修正標準可選參數傳遞 - [PR](https://github.com/BerriAI/litellm/pull/11124)

## 新貢獻者 {#new-contributors}
* [@DarinVerheijke](https://github.com/DarinVerheijke) 在 PR [#10596](https://github.com/BerriAI/litellm/pull/10596) 中完成其首次貢獻
* [@estsauver](https://github.com/estsauver) 在 PR [#10929](https://github.com/BerriAI/litellm/pull/10929) 中完成其首次貢獻
* [@mohittalele](https://github.com/mohittalele) 在 PR [#10665](https://github.com/BerriAI/litellm/pull/10665) 中完成其首次貢獻
* [@pselden](https://github.com/pselden) 在 PR [#10899](https://github.com/BerriAI/litellm/pull/10899) 中完成其首次貢獻
* [@unrealandychan](https://github.com/unrealandychan) 在 PR [#10842](https://github.com/BerriAI/litellm/pull/10842) 中完成其首次貢獻
* [@dastaiger](https://github.com/dastaiger) 在 PR [#10946](https://github.com/BerriAI/litellm/pull/10946) 中完成其首次貢獻
* [@slytechnical](https://github.com/slytechnical) 在 PR [#10881](https://github.com/BerriAI/litellm/pull/10881) 中完成其首次貢獻
* [@daarko10](https://github.com/daarko10) 在 PR [#11006](https://github.com/BerriAI/litellm/pull/11006) 中完成其首次貢獻
* [@sorenmat](https://github.com/sorenmat) 在 PR [#10658](https://github.com/BerriAI/litellm/pull/10658) 中完成其首次貢獻
* [@matthid](https://github.com/matthid) 在 PR [#10982](https://github.com/BerriAI/litellm/pull/10982) 中完成其首次貢獻
* [@jgowdy-godaddy](https://github.com/jgowdy-godaddy) 在 PR [#11032](https://github.com/BerriAI/litellm/pull/11032) 中完成其首次貢獻
* [@bepotp](https://github.com/bepotp) 在 PR [#11008](https://github.com/BerriAI/litellm/pull/11008) 中完成其首次貢獻
* [@jmorenoc-o](https://github.com/jmorenoc-o) 在 PR [#11031](https://github.com/BerriAI/litellm/pull/11031) 中完成其首次貢獻
* [@martin-liu](https://github.com/martin-liu) 在 PR [#11076](https://github.com/BerriAI/litellm/pull/11076) 中完成其首次貢獻
* [@gunjan-solanki](https://github.com/gunjan-solanki) 在 PR [#11064](https://github.com/BerriAI/litellm/pull/11064) 中完成其首次貢獻
* [@tokoko](https://github.com/tokoko) 在 PR [#10980](https://github.com/BerriAI/litellm/pull/10980) 中完成其首次貢獻
* [@spike-spiegel-21](https://github.com/spike-spiegel-21) 在 PR [#10649](https://github.com/BerriAI/litellm/pull/10649) 中完成其首次貢獻
* [@kreatoo](https://github.com/kreatoo) 在 PR [#10927](https://github.com/BerriAI/litellm/pull/10927) 中完成其首次貢獻
* [@baejooc](https://github.com/baejooc) 在 PR [#10887](https://github.com/BerriAI/litellm/pull/10887) 中完成其首次貢獻
* [@keykbd](https://github.com/keykbd) 在 PR [#11114](https://github.com/BerriAI/litellm/pull/11114) 中完成其首次貢獻
* [@dalssoft](https://github.com/dalssoft) 在 PR [#11088](https://github.com/BerriAI/litellm/pull/11088) 中完成其首次貢獻
* [@jtong99](https://github.com/jtong99) 在 PR [#10853](https://github.com/BerriAI/litellm/pull/10853) 中完成其首次貢獻

## 示範執行個體 {#demo-instance}

這裡有一個示範執行個體可用於測試變更：

- 執行個體：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/releases) {#git-diffhttpsgithubcomberriailitellmreleases}
