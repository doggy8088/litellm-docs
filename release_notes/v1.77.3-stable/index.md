---
title: "v1.77.3-stable - 以優先權為基礎的速率限制"
slug: "v1-77-3"
date: 2025-09-21T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
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
docker.litellm.ai/berriai/litellm:v1.77.3-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.77.3
```

</TabItem>
</Tabs>

---

## 重點摘要 {#key-highlights}

- **+550 RPS 效能改進** - 針對請求處理與物件初始化的最佳化。
- **優先配額保留** - Proxy 管理員現在可以為特定金鑰保留 TPM/RPM 容量。

## 優先配額保留 {#priority-quota-reservation}

此版本新增對優先配額保留的支援。這可讓 Proxy 管理員依不同用途保留模型容量的特定百分比。
 
這對於您希望確保即時用途一律獲得優先回應，而背景開發工作可以花更久時間的情境非常適合。

<Image img={require('../../img/release_notes/quota.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本新增對優先配額保留的支援。這可讓 **Proxy 管理員** 根據中繼資料優先層級，為金鑰保留 TPM/RPM 容量，確保關鍵的正式環境工作負載無論開發流量多寡都能獲得保證存取。

從[這裡](../../docs/proxy/dynamic_rate_limit#priority-quota-reservation)開始

## +550 RPS 效能改進 {#550-rps-performance-improvements}

<Image img={require('../../img/release_notes/perf_imp.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本透過針對性的最佳化，帶來顯著的 RPS 改進。
 
我們透過修正導致頻繁快取遺漏的快取型別不一致問題，提升了 +500 RPS；此外，還透過從熱路徑移除不必要的 coroutine 檢查，再增加 +50 RPS。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100萬 tokens） | 輸出（$/100萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| SambaNova | `sambanova/deepseek-v3.1` | 128K | $0.90 | $0.90 | 聊天完成 |
| SambaNova | `sambanova/gpt-oss-120b` | 128K | $0.72 | $0.72 | 聊天完成 |
| OVHCloud | Various models | 視情況而定 | 聯絡提供者 | 聯絡提供者 | 聊天完成 |
| CompactifAI | Various models | 視情況而定 | 聯絡提供者 | 聯絡提供者 | 聊天完成 |
| TwelveLabs | `twelvelabs/marengo-embed-2.7` | 32K | $0.12 | $0.00 | 嵌入 |

#### 功能 {#features}

- **[OVHCloud AI Endpoints](../../docs/providers/ovhcloud)**
    - 新增提供者支援，具備完整模型目錄 - [PR #14494](https://github.com/BerriAI/litellm/pull/14494)
- **[CompactifAI](../../docs/providers/compactifai)**
    - 新增提供者整合 - [PR #14532](https://github.com/BerriAI/litellm/pull/14532)
- **[SambaNova](../../docs/providers/sambanova)**
    - 新增 DeepSeek v3.1 與 GPT-OSS-120B 模型 - [PR #14500](https://github.com/BerriAI/litellm/pull/14500)
- **[Bedrock](../../docs/providers/bedrock)**
    - 跨區域推論設定檔成本計算 - [PR #14566](https://github.com/BerriAI/litellm/pull/14566)
    - AWS 外部 ID 參數驗證支援 - [PR #14582](https://github.com/BerriAI/litellm/pull/14582)
    - CountTokens API 實作 - [PR #14557](https://github.com/BerriAI/litellm/pull/14557)
    - Titan V2 encoding_format 參數支援 - [PR #14687](https://github.com/BerriAI/litellm/pull/14687)
    - Nova Canvas 影像生成推論設定檔 - [PR #14578](https://github.com/BerriAI/litellm/pull/14578)
    - Bedrock Batches API - 支援含檔案上傳與請求轉換的批次處理 - [PR #14618](https://github.com/BerriAI/litellm/pull/14618)
    - Bedrock Twelve Labs 嵌入提供者支援 - [PR #14697](https://github.com/BerriAI/litellm/pull/14697)
- **[Vertex AI](../../docs/providers/vertex)**
    - Gemini labels 欄位依提供者感知的篩選 - [PR #14563](https://github.com/BerriAI/litellm/pull/14563)
    - Gemini Batch API 支援 - [PR #14733](https://github.com/BerriAI/litellm/pull/14733)
- **[Volcengine](../../docs/providers/volcengine)**
    - 修正停用時的 thinking 參數 - [PR #14569](https://github.com/BerriAI/litellm/pull/14569)
- **[Cohere](../../docs/providers/cohere)**
    - 處理 Generate API 淘汰，預設改用聊天端點 - [PR #14676](https://github.com/BerriAI/litellm/pull/14676)
- **[TwelveLabs](../../docs/providers/twelvelabs)**
    - 新增 Marengo Embed 2.7 嵌入支援 - [PR #14674](https://github.com/BerriAI/litellm/pull/14674)

### 錯誤修正 {#bug-fixes}

- **[Bedrock](../../docs/providers/bedrock)**
    - 處理工具呼叫 invocation 中的空引數 - [PR #14583](https://github.com/BerriAI/litellm/pull/14583)
- **[Vertex AI](../../docs/providers/vertex)**
    - 避免 Gemini/Vertex 中非 pickleable 物件造成的 deepcopy 當機 - [PR #14418](https://github.com/BerriAI/litellm/pull/14418)
- **[XAI](../../docs/providers/xai)**
    - 修正 grok-code 模型不支援的 stop 參數 - [PR #14565](https://github.com/BerriAI/litellm/pull/14565)
- **[Gemini](../../docs/providers/gemini)**
    - 更新 Gemini API 的錯誤訊息 - [PR #14589](https://github.com/BerriAI/litellm/pull/14589)
    - 修正 2.5 Flash Image Preview 模型路由 - [PR #14715](https://github.com/BerriAI/litellm/pull/14715)
    - 用於 token 計數端點的 API 金鑰傳遞 - [PR #14744](https://github.com/BerriAI/litellm/pull/14744)

#### 新提供者支援 {#new-provider-support}

- **[OVHCloud AI Endpoints](../../docs/providers/ovhcloud)**
    - 完整提供者整合，包含模型目錄與驗證 - [PR #14494](https://github.com/BerriAI/litellm/pull/14494)
- **[CompactifAI](../../docs/providers/compactifai)**
    - 新增提供者支援與文件 - [PR #14532](https://github.com/BerriAI/litellm/pull/14532)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[/responses](../../docs/response_api)**
    - 新增非管理員使用者的取消端點支援 - [PR #14594](https://github.com/BerriAI/litellm/pull/14594)
    - 改善回應工作階段處理與 s3 冷儲存設定 - [PR #14534](https://github.com/BerriAI/litellm/pull/14534)
    - 新增 OpenAI 與 Azure /responses/cancel 端點支援 - [PR #14561](https://github.com/BerriAI/litellm/pull/14561)
- **一般**
    - 強化速率限制錯誤訊息，提供更多細節 - [PR #14736](https://github.com/BerriAI/litellm/pull/14736)
    - 支出記錄負載的中間截斷 - [PR #14637](https://github.com/BerriAI/litellm/pull/14637)

#### 錯誤 {#bugs}

- **[/chat/completions](../../docs/completion/input)**
    - 修正 completion chat ID 處理 - [PR #14548](https://github.com/BerriAI/litellm/pull/14548)
    - 防止 _get_tags_from_request_kwargs 發生 AttributeError - [PR #14735](https://github.com/BerriAI/litellm/pull/14735)
- **[/responses](../../docs/response_api)**
    - 修正成本計算 - [PR #14675](https://github.com/BerriAI/litellm/pull/14675)
- **一般**
    - 修正 rate limiter AttributeError - [PR #14609](https://github.com/BerriAI/litellm/pull/14609)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **Responses API 成本計算** 修正 - [PR #14675](https://github.com/BerriAI/litellm/pull/14675)
- **Anthropic 快取 token 定價** - 分開計算 1 小時與 5 分鐘的快取建立成本 - [PR #14620](https://github.com/BerriAI/litellm/pull/14620), [PR #14652](https://github.com/BerriAI/litellm/pull/14652)
- **印度支那時間時區** 支援預算重設 - [PR #14666](https://github.com/BerriAI/litellm/pull/14666)
- **軟性預算警示快取問題** - 已解決軟性預算警示快取問題 - [PR #14491](https://github.com/BerriAI/litellm/pull/14491)
- **Dynamic Rate Limiter v3** - 優先路由改進 - [PR #14734](https://github.com/BerriAI/litellm/pull/14734)
- **強化速率限制錯誤** - 更詳細的錯誤訊息 - [PR #14736](https://github.com/BerriAI/litellm/pull/14736)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **團隊成員服務帳戶金鑰** - 允許團隊成員查看自己建立的金鑰 - [PR #14619](https://github.com/BerriAI/litellm/pull/14619)
- **JWT 團隊預設預算** - 自動為產生的團隊指派預算 - [PR #14514](https://github.com/BerriAI/litellm/pull/14514)
- **SSO 存取控制群組** - 強化 token 資訊端點整合 - [PR #14738](https://github.com/BerriAI/litellm/pull/14738)
- **健康測試連接保護** - 根據模型建立權限限制存取 - [PR #14650](https://github.com/BerriAI/litellm/pull/14650)
- **Amazon Bedrock Guardrail 資訊檢視** - 強化記錄視覺化 - [PR #14696](https://github.com/BerriAI/litellm/pull/14696)

#### 錯誤修正 {#bug-fixes-1}

- **SCIM v2** - 修正群組 PUSH 和 PUT 作業對不存在成員的處理 - [PR #14581](https://github.com/BerriAI/litellm/pull/14581)
- **防護欄檢視/編輯/刪除** 行為修正 - [PR #14622](https://github.com/BerriAI/litellm/pull/14622)
- **記憶體內防護欄** 更新失敗 - [PR #14653](https://github.com/BerriAI/litellm/pull/14653)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-3}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 強化支出追蹤指標 - [PR #14555](https://github.com/BerriAI/litellm/pull/14555)
    - 支援使用 is_streamed_request 參數的串流 - [PR #14673](https://github.com/BerriAI/litellm/pull/14673)
    - 修正工具呼叫中繼資料傳遞 - [PR #14531](https://github.com/BerriAI/litellm/pull/14531)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 新增 Responses API 的記錄支援 - [PR #14597](https://github.com/BerriAI/litellm/pull/14597)
- **[Langsmith](../../docs/proxy/logging#langsmith)**
    - Langsmith 取樣率 - 金鑰/團隊層級追蹤組態 - [PR #14740](https://github.com/BerriAI/litellm/pull/14740)
- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 改進多工作者支援 - [PR #14530](https://github.com/BerriAI/litellm/pull/14530)
    - 監控中的使用者電子郵件標籤 - [PR #14520](https://github.com/BerriAI/litellm/pull/14520)
- **[Opik](../../docs/proxy/logging#opik)**
    - 修正時區問題 - [PR #14708](https://github.com/BerriAI/litellm/pull/14708)

### 錯誤修正 {#bug-fixes-2}

- **[S3](../../docs/proxy/logging#s3-buckets)**
    - 使用 s3_endpoint_url 時修正 404 錯誤 - [PR #14559](https://github.com/BerriAI/litellm/pull/14559)

#### 防護欄 {#guardrails}

- **工具權限防護欄** - 細粒度工具存取控制 - [PR #14519](https://github.com/BerriAI/litellm/pull/14519)
- **Bedrock Guardrails** - 支援可選擇性防護與執行階段端點組態 - [PR #14575](https://github.com/BerriAI/litellm/pull/14575), [PR #14650](https://github.com/BerriAI/litellm/pull/14650)
- **預設最後訊息** 於防護欄中 - [PR #14640](https://github.com/BerriAI/litellm/pull/14640)
- **即使回應為 200 仍處理 AWS 例外狀況** - [PR #14658](https://github.com/BerriAI/litellm/pull/14658)
#### 新整合 {#new-integration}

- **[PostHog](../../docs/observability/posthog)** - LiteLLM 使用追蹤與分析的完整可觀測性整合 - [PR #14610](https://github.com/BerriAI/litellm/pull/14610)

---

## MCP 閘道 {#mcp-gateway}

- **MCP Server 別名解析** - 支援多段 URL 路徑 - [PR #14558](https://github.com/BerriAI/litellm/pull/14558)
- **MCP 篩選器重新計算** - 於伺服器刪除後 - [PR #14542](https://github.com/BerriAI/litellm/pull/14542)
- **MCP 閘道工具清單** 改進 - [PR #14695](https://github.com/BerriAI/litellm/pull/14695)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- 在傳送 `user` 欄位時 **+500 RPS 效能提升** - [PR #14616](https://github.com/BerriAI/litellm/pull/14616)
- 透過從熱路徑中移除 iscoroutine **+50 RPS** - [PR #14649](https://github.com/BerriAI/litellm/pull/14649)
- __init__ 開銷 **降低 7%** - [PR #14689](https://github.com/BerriAI/litellm/pull/14689)
- **通用物件池** 實作，以便更佳的資源管理 - [PR #14702](https://github.com/BerriAI/litellm/pull/14702)

---

## 一般代理改善 {#general-proxy-improvements}

- 用於支出記錄負載的 **中段截斷** - [PR #14637](https://github.com/BerriAI/litellm/pull/14637)

#### 安全性 {#security}

- **安全性更新** - 升級 aiohttp==3.12.14，修正 CVE-2025-53643 - [PR #14638](https://github.com/BerriAI/litellm/pull/14638)

---

## 新貢獻者 {#new-contributors}

* @luisfucros 首次在 [PR #14500](https://github.com/BerriAI/litellm/pull/14500) 做出貢獻
* @hanakannzashi 首次在 [PR #14548](https://github.com/BerriAI/litellm/pull/14548) 做出貢獻
* @eliasto 首次在 [PR #14494](https://github.com/BerriAI/litellm/pull/14494) 做出貢獻
* @Rasmusafj 首次在 [PR #14491](https://github.com/BerriAI/litellm/pull/14491) 做出貢獻
* @LingXuanYin 首次在 [PR #14569](https://github.com/BerriAI/litellm/pull/14569) 做出貢獻
* @ronaldpereira 首次在 [PR #14613](https://github.com/BerriAI/litellm/pull/14613) 做出貢獻
* @hula-la 首次在 [PR #14534](https://github.com/BerriAI/litellm/pull/14534) 做出貢獻
* @carlos-marchal-ph 首次在 [PR #14610](https://github.com/BerriAI/litellm/pull/14610) 做出貢獻
* @akraines 首次在 [PR #14637](https://github.com/BerriAI/litellm/pull/14637) 做出貢獻
* @mrFranklin 首次在 [PR #14708](https://github.com/BerriAI/litellm/pull/14708) 做出貢獻
* @tcx4c70 首次在 [PR #14675](https://github.com/BerriAI/litellm/pull/14675) 做出貢獻
* @michaeltansg 首次在 [PR #14666](https://github.com/BerriAI/litellm/pull/14666) 做出貢獻
* @tosi29 首次在 [PR #14725](https://github.com/BerriAI/litellm/pull/14725) 做出貢獻
* @gmdfalk 首次在 [PR #14735](https://github.com/BerriAI/litellm/pull/14735) 做出貢獻
* @FelipeRodriguesGare 首次在 [PR #14733](https://github.com/BerriAI/litellm/pull/14733) 做出貢獻
* @mritunjaysharma394 首次在 [PR #14678](https://github.com/BerriAI/litellm/pull/14678) 做出貢獻

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.77.2.rc.1...v1.77.3.rc.1)** {#full-changeloghttpsgithubcomberriailitellmcomparev1772rc1v1773rc1}
