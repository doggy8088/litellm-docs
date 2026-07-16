---
title: "v1.74.3-stable"
slug: "v1-74-3-stable"
date: 2025-07-12T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.74.3-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.74.3.post1
```

</TabItem>
</Tabs>

---

## 重點摘要  {#key-highlights}

- **MCP: Model Access Groups** - 將 mcp servers 加入存取群組，以便輕鬆管理使用者與團隊的存取權限。
- **MCP: Tool Cost Tracking** - 為每個 MCP 工具設定價格。 
- **Model Hub v2** - 全新的 OSS Model Hub，用於告知開發者 proxy 上可用的模型。
- **Bytez** - 新的 LLM API 提供者。
- **Dashscope API** - 透過新的 Dashscope API 提供者呼叫 Alibaba 的 qwen 模型。

---

## MCP 閘道：模型存取群組 {#mcp-gateway-model-access-groups}

<Image 
  img={require('../../img/release_notes/mcp_access_groups.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>

v1.74.3-stable 新增了將 MCP servers 加入存取群組的支援，這讓 **Proxy Admins** 更容易管理跨使用者與團隊的 MCP servers 存取權限。

對於 **開發者** 而言，這表示您現在可以透過在 `x-mcp-servers` header 中傳入存取群組名稱，連接到多個 MCP servers。

在[此處](https://docs.litellm.ai/docs/mcp#grouping-mcps-access-groups)閱讀更多

---

## MCP 閘道：工具成本追蹤 {#mcp-gateway-tool-cost-tracking}

<Image 
  img={require('../../img/release_notes/mcp_tool_cost_tracking.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>

此版本新增了 MCP tool calls 的成本追蹤。這對於將 MCP 存取權提供給開發者的 **Proxy Admins** 非常有幫助，因為您現在可以將 MCP tool call 成本歸屬到特定的 LiteLLM keys 與團隊。

您可以設定：
- **Uniform server cost**：為來自某個 server 的所有工具設定統一成本
- **Individual tool cost**：為特定工具定義個別成本（例如，search_tool 成本為 $10，get_weather 成本為 $5）。
- **Dynamic costs**：針對您想要根據 MCP 的回應設定成本的使用案例，您可以撰寫自訂的 post mcp call hook 來解析回應並動態設定成本。

[立即開始](https://docs.litellm.ai/docs/mcp#mcp-cost-tracking)

---

## Model Hub v2 {#model-hub-v2}

<Image 
  img={require('../../img/release_notes/model_hub_v2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

v1.74.3-stable 推出了全新的 OSS Model Hub，用於告知開發者 proxy 上可用的模型。

這對 **Proxy Admins** 很有幫助，因為您現在可以告知開發者 proxy 上可用的模型。

這項改進相較於先前的 model hub，新增了：
- 即使 **Developers** 沒有 LiteLLM key，也能向他們顯示模型的能力。
- **Proxy Admins** 可選擇特定模型在 model hub 上公開。
- 改進的搜尋與篩選能力：
    - 依部分名稱搜尋模型（例如 `xai grok-4`）
    - 依提供者與功能篩選（例如 'vision' models）
    - 依成本排序（例如 OpenAI 最便宜的 vision model）

[立即開始](../../docs/proxy/model_hub)

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 定價 / Context Window 更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 類型 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | ---- |
| Xai | `xai/grok-4` | 256k | $3.00 | $15.00 | 新增 |
| Xai | `xai/grok-4-0709` | 256k | $3.00 | $15.00 | 新增 |
| Xai | `xai/grok-4-latest` | 256k | $3.00 | $15.00 | 新增 |
| Mistral | `mistral/devstral-small-2507` | 128k | $0.1 | $0.3 | 新增 |
| Mistral | `mistral/devstral-medium-2507` | 128k | $0.4 | $2 | 新增 |
| Azure OpenAI | `azure/o3-deep-research` | 200k | $10 | $40 | 新增 |

#### 功能 {#features}
- **[Xinference](../../docs/providers/xinference)**
    - 支援影像生成 API - [PR](https://github.com/BerriAI/litellm/pull/12439)
- **[Bedrock](../../docs/providers/bedrock)**
    - 支援 AWS Bedrock API 的 API Key Auth - [PR](https://github.com/BerriAI/litellm/pull/12495)
- **[🆕 Dashscope](../../docs/providers/dashscope)**
    - 來自 Alibaba 的新整合（可啟用 qwen 使用）- [PR](https://github.com/BerriAI/litellm/pull/12361)
- **[🆕 Bytez](../../docs/providers/bytez)**
    - 新的 /chat/completion 整合 - [PR](https://github.com/BerriAI/litellm/pull/12121)

#### 錯誤修正 {#bugs}
- **[Github Copilot](../../docs/providers/github_copilot)**
    - 修正 Github Copilot 的 API base url - [PR](https://github.com/BerriAI/litellm/pull/12418)
- **[Bedrock](../../docs/providers/bedrock)**
    - 確保支援的 bedrock/converse/ params = bedrock/ params - [PR](https://github.com/BerriAI/litellm/pull/12466)
    - 修正快取 token 成本計算 - [PR](https://github.com/BerriAI/litellm/pull/12488)
- **[XAI](../../docs/providers/xai)**
    - 確保當 xai 回應含有 tool calls 時，finish_reason 也包含 tool calls - [PR](https://github.com/BerriAI/litellm/pull/12545)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}
- **[/completions](../../docs/text_completion)**
    - 在串流時回傳 ‘reasoning_content’ - [PR](https://github.com/BerriAI/litellm/pull/12377)
- **[/chat/completions](../../docs/completion/input)** 
    - 將 'thinking blocks' 加入 stream chunk builder - [PR](https://github.com/BerriAI/litellm/pull/12395)
- **[/v1/messages](../../docs/anthropic_unified)**
    - 支援備援 - [PR](https://github.com/BerriAI/litellm/pull/12440)
    - 非 anthropic 模型的 tool call 處理（/v1/messages 到 /chat/completion 的橋接）- [PR](https://github.com/BerriAI/litellm/pull/12473)

---

## [MCP Gateway](../../docs/mcp) {#mcp-gatewaydocsmcp}

<Image 
  img={require('../../img/release_notes/mcp_tool_cost_tracking.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

#### 功能 {#features-2}
- **[成本追蹤](../../docs/mcp#-mcp-cost-tracking)**
    - 新增成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/12385)
    - 新增使用量追蹤 - [PR](https://github.com/BerriAI/litellm/pull/12397)
    - 為每個 MCP tool 新增自訂成本設定 - [PR](https://github.com/BerriAI/litellm/pull/12499)
    - 新增編輯每個 tool 的 MCP 成本支援 - [PR](https://github.com/BerriAI/litellm/pull/12501)
    - 允許使用自訂的 post call MCP hook 進行成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/12469)
- **[驗證](../../docs/mcp#using-your-mcp-with-client-side-credentials)**
    - 允許自訂要使用哪種 client side auth header - [PR](https://github.com/BerriAI/litellm/pull/12460)
    - 當請求中的 MCP server header 格式錯誤時，會拋出錯誤 - [PR](https://github.com/BerriAI/litellm/pull/12494)
- **[MCP 伺服器](../../docs/mcp#adding-your-mcp)**
    - 允許將 stdio MCPs 與 LiteLLM 一起使用（可啟用 Circle CI MCP 搭配 LiteLLM 使用）- [PR](https://github.com/BerriAI/litellm/pull/12530), [立即開始](../../docs/mcp#adding-a-stdio-mcp-server)

#### 錯誤修正 {#bugs-1}
- **一般**
    - 修正 task group 未初始化錯誤 - [PR](https://github.com/BerriAI/litellm/pull/12411) s/o [@juancarlosm](https://github.com/juancarlosm)
- **[MCP 伺服器](../../docs/mcp#adding-your-mcp)**
    - 修正 mcp tool separator 以配合 Claude code 使用 - [PR](https://github.com/BerriAI/litellm/pull/12430), [立即開始](../../docs/mcp#adding-your-mcp)
    - 為 mcp server name 新增驗證，不允許 "-"（可讓 namespaces 正常運作）- [PR](https://github.com/BerriAI/litellm/pull/12515)

---

## 管理端點 / UI {#management-endpoints--ui}

<Image 
  img={require('../../img/release_notes/model_hub_v2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

#### 功能 {#features-3}
- **模型中樞**
    - 新的 model hub 表格檢視 - [PR](https://github.com/BerriAI/litellm/pull/12468)
    - 新的 /public/model_hub 端點 - [PR](https://github.com/BerriAI/litellm/pull/12468)
    - 將 Model Hub 開源 - [PR](https://github.com/BerriAI/litellm/pull/12553)
    - 新的「make public」模態流程，用於在公開 model hub 上顯示 proxy models - [PR](https://github.com/BerriAI/litellm/pull/12555)
- **MCP**
    - 支援內部使用者使用和管理 MCP servers - [PR](https://github.com/BerriAI/litellm/pull/12458)
    - 新增 UI 支援以新增 MCP 存取群組（類似 namespaces） - [PR](https://github.com/BerriAI/litellm/pull/12470)
    - MCP 工具測試 Playground - [PR](https://github.com/BerriAI/litellm/pull/12520)
    - 在 MCP 設定根節點顯示成本設定 - [PR](https://github.com/BerriAI/litellm/pull/12526)
- **測試金鑰**
    - Stick sessions - [PR](https://github.com/BerriAI/litellm/pull/12365)
    - MCP 存取群組 - 允許 mcp 存取群組 - [PR](https://github.com/BerriAI/litellm/pull/12529)
- **用量**
    - 截斷過長標籤並改善 Top API Keys 圖表中的工具提示 - [PR](https://github.com/BerriAI/litellm/pull/12371)
    - 改善 Tag Usage 的圖表可讀性 - [PR](https://github.com/BerriAI/litellm/pull/12378)
- **團隊**
    - 防止團隊成員操作後導覽重設 - [PR](https://github.com/BerriAI/litellm/pull/12424)
    - Team Members - 若已設定 duration，重設預算 - [PR](https://github.com/BerriAI/litellm/pull/12534)
    - 當 UI 上設定 max_budget_in_team 時，使用中央團隊成員預算 - [PR](https://github.com/BerriAI/litellm/pull/12533)
- **SSO**
    - 允許使用者執行自訂 sso 登入處理器 - [PR](https://github.com/BerriAI/litellm/pull/12465)
- **導覽列**
    - 以 premium 徽章與更簡潔的版面改善使用者下拉選單 UI - [PR](https://github.com/BerriAI/litellm/pull/12502)
- **一般**
    - 所有頁面的 Create 和 Back 按鈕維持一致版面 - [PR](https://github.com/BerriAI/litellm/pull/12542)
    - 將 Show Password 與 Checkbox 對齊 - [PR](https://github.com/BerriAI/litellm/pull/12538)
    - 防止將預設使用者設定更新寫入 yaml（會在非 root 環境造成錯誤） - [PR](https://github.com/BerriAI/litellm/pull/12533)

#### 錯誤修正 {#bugs-2}
- **模型中樞**
    - 修正 /model_group/info 中的重複項目 - [PR](https://github.com/BerriAI/litellm/pull/12468)
- **MCP**
    - 修正 UI 未能正確將 MCP 存取群組與物件權限同步 - [PR](https://github.com/BerriAI/litellm/pull/12523)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}
- **[Langfuse](../../docs/observability/langfuse_integration)**
    - 版本升級 - [PR](https://github.com/BerriAI/litellm/pull/12376)
    - 支援 LANGFUSE_TRACING_ENVIRONMENT - [PR](https://github.com/BerriAI/litellm/pull/12376)
- **[Bedrock 防護欄](../../docs/proxy/guardrails/bedrock)**
    - 當防護欄動作為 'BLOCKED' 時，提升 Bedrock 輸出文字 - [PR](https://github.com/BerriAI/litellm/pull/12435)
- **[OTEL](../../docs/observability/opentelemetry_integration)**
    - 支援 `OTEL_RESOURCE_ATTRIBUTES` - [PR](https://github.com/BerriAI/litellm/pull/12468)
- **[Guardrails AI](../../docs/proxy/guardrails/guardrails_ai)**
    - 支援 pre-call + logging only 防護欄（pii 偵測/競品名稱） - [PR](https://github.com/BerriAI/litellm/pull/12506)
- **[Guardrails](../../docs/proxy/guardrails/quick_start)**
    - [Enterprise] 支援以 tag 為基礎的防護欄模式 - [PR](https://github.com/BerriAI/litellm/pull/12508), [Get Started](../../docs/proxy/guardrails/quick_start#-tag-based-guardrail-modes)
- **[OpenAI Moderations API](../../docs/proxy/guardrails/openai_moderation)**
    - 新的防護欄整合 - [PR](https://github.com/BerriAI/litellm/pull/12519)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 支援以 tag 為基礎的指標（可啟用 prometheus 指標以衡量 roo-code/cline/claude code 參與度） - [PR](https://github.com/BerriAI/litellm/pull/12534), [Get Started](../../docs/proxy/prometheus#custom-tags)
- **[Datadog LLM 可觀測性](../../docs/observability/datadog)**
    - 新增 `total_cost` 欄位以追蹤 DataDog LLM 可觀測性指標中的成本 - [PR](https://github.com/BerriAI/litellm/pull/12467)

#### 錯誤修正 {#bugs-3}
- **[Prometheus](../../docs/proxy/prometheus)**
    - 移除實驗性 `_by_tag` 指標（修正基數問題） - [PR](https://github.com/BerriAI/litellm/pull/12395)
- **[Slack 警示](../../docs/proxy/alerting)**
    - 修正停機與區域停機警示的 slack 警示 - [PR](https://github.com/BerriAI/litellm/pull/12464), [Get Started](../../docs/proxy/alerting#region-outage-alerting--enterprise-feature)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 錯誤修正 {#bugs-4}
- **[Responses API 橋接器](../../docs/response_api#calling-non-responses-api-endpoints-responses-to-chatcompletions-bridge)**
    - 在回退到 Chat Completions 時，為 Responses API 新增圖片支援 - [PR](https://github.com/BerriAI/litellm/pull/12204) s/o [@ryan-castner](https://github.com/ryan-castner)
- **aiohttp**
    - 正確關閉 aiohttp 用戶端 session 以防止資源洩漏 - [PR](https://github.com/BerriAI/litellm/pull/12251)
- **路由器**
    - 不要將無效部署加入 router pattern match - [PR](https://github.com/BerriAI/litellm/pull/12459)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

#### 錯誤修正 {#bugs-5}
- **S3**
  - s3 config.yaml 檔案 - 確保使用 yaml safe load - [PR](https://github.com/BerriAI/litellm/pull/12373)
- **稽核記錄**
  - 新增 model 更新的稽核記錄 - [PR](https://github.com/BerriAI/litellm/pull/12396)
- **啟動**
  - 當啟用 max_budget 時，啟動時建立多個 API Keys - [PR](https://github.com/BerriAI/litellm/pull/12436)
- **驗證**
  - 在 Auth 上解析 model group alias（如果使用者可存取底層 model，則允許 alias 請求運作） - [PR](https://github.com/BerriAI/litellm/pull/12440)
- **config.yaml**
  - 修正從 config.yaml 解析 environment_variables - [PR](https://github.com/BerriAI/litellm/pull/12482)
- **安全性**
  - 記錄帶有前綴的雜湊 jwt，而非實際值 - [PR](https://github.com/BerriAI/litellm/pull/12524)

#### 功能 {#features-5}
- **MCP**
    - 在 docker img 上升級 mcp 版本 - [PR](https://github.com/BerriAI/litellm/pull/12362)
- **請求標頭**
    - 當 forward_client_headers_to_llm_api 為 true 時，轉發 ‘anthropic-beta’ header - [PR](https://github.com/BerriAI/litellm/pull/12462)

---

## 新貢獻者 {#new-contributors}
* @kanaka 在 https://github.com/BerriAI/litellm/pull/12418 完成了第一次貢獻
* @juancarlosm 在 https://github.com/BerriAI/litellm/pull/12411 完成了第一次貢獻
* @DmitriyAlergant 在 https://github.com/BerriAI/litellm/pull/12356 完成了第一次貢獻
* @Rayshard 在 https://github.com/BerriAI/litellm/pull/12487 完成了第一次貢獻
* @minghao51 在 https://github.com/BerriAI/litellm/pull/12361 完成了第一次貢獻
* @jdietzsch91 在 https://github.com/BerriAI/litellm/pull/12488 完成了第一次貢獻
* @iwinux 在 https://github.com/BerriAI/litellm/pull/12473 完成了第一次貢獻
* @andresC98 在 https://github.com/BerriAI/litellm/pull/12413 完成了第一次貢獻
* @EmaSuriano 在 https://github.com/BerriAI/litellm/pull/12509 完成了第一次貢獻
* @strawgate 在 https://github.com/BerriAI/litellm/pull/12528 完成了第一次貢獻
* @inf3rnus 在 https://github.com/BerriAI/litellm/pull/12121 完成了第一次貢獻

## **[Git Diff](https://github.com/BerriAI/litellm/compare/v1.74.0-stable...v1.74.3-stable)** {#git-diffhttpsgithubcomberriailitellmcomparev1740-stablev1743-stable}
