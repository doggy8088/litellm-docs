---
title: "v1.76.1-stable - Gemini 2.5 Flash Image"
slug: "v1-76-1"
date: 2025-08-30T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.76.1
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.76.1
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **重大效能改善** - 結合 fastuuid 整合後，LiteLLM Python SDK completion 速度提升 6.5 倍。
- **新模型支援** - Gemini 2.5 Flash Image Preview、Grok Code Fast，以及 GPT Realtime 模型
- **增強的提供者支援** - Fireworks AI、Vercel AI Gateway 上的 DeepSeek-v3.1 定價，以及改良的 Anthropic/GitHub Copilot 整合
- **MCP 改善** - 更好的連線測試與 SSE MCP tools 錯誤修正

## 主要變更  {#major-changes}
- 新增支援在 /chat/completions 使用 Gemini 2.5 Flash Image Preview。**🚨 警告** 如果您一直在使用 `gemini-2.0-flash-exp-image-generation`，請遵循此遷移指南。
  [Gemini Image Generation Migration Guide](../../docs/extras/gemini_img_migration)
---

## 效能改善 {#performance-improvements}

此版本包含重大效能最佳化：

- **LiteLLM Python SDK Completion 速度提升 6.5 倍** - completion 操作的重大效能提升 - [PR #13990](https://github.com/BerriAI/litellm/pull/13990)
- **fastuuid 整合** - UUID 產生速度提升 2.1 倍，/chat/completions 與其他 LLM 端點的 RPS 提升 +80 - [PR #13992](https://github.com/BerriAI/litellm/pull/13992), [PR #14016](https://github.com/BerriAI/litellm/pull/14016)
- **最佳化請求記錄** - 預設不要列印請求參數，以提升 +50 RPS - [PR #14015](https://github.com/BerriAI/litellm/pull/14015)
- **快取效能** - InMemoryCache.evict_cache 提升 21%，`_is_debugging_on` 函式提升 45% - [PR #14012](https://github.com/BerriAI/litellm/pull/14012), [PR #13988](https://github.com/BerriAI/litellm/pull/13988)

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | -------- |
| Google | `gemini-2.5-flash-image-preview` | 1M | $0.30 | $2.50 | Chat completions + image generation ($0.039/image) |
| X.AI | `xai/grok-code-fast` | 256K | $0.20 | $1.50 | Code generation |
| OpenAI | `gpt-realtime` | 32K | $4.00 | $16.00 | Real-time conversation + audio |
| Vercel AI Gateway | `vercel_ai_gateway/openai/o3` | 200K | $2.00 | $8.00 | Advanced reasoning |
| Vercel AI Gateway | `vercel_ai_gateway/openai/o3-mini` | 200K | $1.10 | $4.40 | Efficient reasoning |
| Vercel AI Gateway | `vercel_ai_gateway/openai/o4-mini` | 200K | $1.10 | $4.40 | Latest mini model |
| DeepInfra | `deepinfra/zai-org/GLM-4.5` | 131K | $0.55 | $2.00 | 聊天補全 |
| Perplexity | `perplexity/codellama-34b-instruct` | 16K | $0.35 | $1.40 | Code generation |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/deepseek-v3p1` | 128K | $0.56 | $1.68 | 聊天補全 |

**新增其他模型：** 也新增了多個其他 Vercel AI Gateway 模型。請參閱 [models.litellm.ai](https://models.litellm.ai) 取得完整清單。

#### 功能 {#features}

- **[Google Gemini](../../docs/providers/gemini)**
    - 新增 `gemini-2.5-flash-image-preview` 的圖像回傳能力支援 - [PR #13979](https://github.com/BerriAI/litellm/pull/13979), [PR #13983](https://github.com/BerriAI/litellm/pull/13983)
    - 支援僅含 system prompt 的請求 - [PR #14010](https://github.com/BerriAI/litellm/pull/14010)
    - 修正 Gemini Imagen 模型的無效模型名稱錯誤 - [PR #13991](https://github.com/BerriAI/litellm/pull/13991)
- **[X.AI](../../docs/providers/xai)**
    - 新增 `xai/grok-code-fast` 模型家族支援 - [PR #14054](https://github.com/BerriAI/litellm/pull/14054)
    - 修正 grok-4 模型的 frequency_penalty 參數 - [PR #14078](https://github.com/BerriAI/litellm/pull/14078)
- **[OpenAI](../../docs/providers/openai)**
    - 新增 gpt-realtime 模型支援 - [PR #14082](https://github.com/BerriAI/litellm/pull/14082)
    - 預設支援 reasoning 與 reasoning_effort 參數 - [PR #12865](https://github.com/BerriAI/litellm/pull/12865)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 新增 DeepSeek-v3.1 定價 - [PR #13958](https://github.com/BerriAI/litellm/pull/13958)
- **[DeepInfra](../../docs/providers/deepinfra)**
    - 修正 DeepSeek-V3.1 的 reasoning_effort 設定 - [PR #14053](https://github.com/BerriAI/litellm/pull/14053)
- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 新增 thinking 與 reasoning_effort 參數支援 - [PR #13691](https://github.com/BerriAI/litellm/pull/13691)
    - 新增圖像標頭支援 - [PR #13955](https://github.com/BerriAI/litellm/pull/13955)
- **[Anthropic](../../docs/providers/anthropic)**
    - 支援自訂 Anthropic 相容的 API 端點 - [PR #13945](https://github.com/BerriAI/litellm/pull/13945)
    - 修正 /messages 從 Anthropic API 備援到 Bedrock API 的問題 - [PR #13946](https://github.com/BerriAI/litellm/pull/13946)
- **[Nebius](../../docs/providers/nebius)**
    - 擴充提供者模型並標準化模型 ID - [PR #13965](https://github.com/BerriAI/litellm/pull/13965)
- **[Vertex AI](../../docs/providers/vertex)**
    - 修正 Vertex Mistral 串流問題 - [PR #13952](https://github.com/BerriAI/litellm/pull/13952)
    - 修正 Gemini tool calls 的 anyOf 邊界情況 - [PR #12797](https://github.com/BerriAI/litellm/pull/12797)
- **[Bedrock](../../docs/providers/bedrock)**
    - 修正結構化輸出問題 - [PR #14005](https://github.com/BerriAI/litellm/pull/14005)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 GPT-5 家族模型定價 - [PR #13536](https://github.com/BerriAI/litellm/pull/13536)

#### 新提供者支援 {#new-provider-support}

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 新增提供者支援 - [PR #13144](https://github.com/BerriAI/litellm/pull/13144)
- **[DataRobot](../../docs/providers/datarobot)**
    - 新增提供者文件 - [PR #14038](https://github.com/BerriAI/litellm/pull/14038), [PR #14074](https://github.com/BerriAI/litellm/pull/14074)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Images API](../../docs/image_generation)**
    - 支援 OpenAI images/edits 端點的多張圖片 - [PR #13916](https://github.com/BerriAI/litellm/pull/13916)
    - 允許在圖像生成請求中使用動態 `api_key` - [PR #14007](https://github.com/BerriAI/litellm/pull/14007)
- **[Responses API](../../docs/response_api)**
    - 修正 `/responses` 端點在 GitHub Copilot 中忽略 extra_headers 的問題 - [PR #13775](https://github.com/BerriAI/litellm/pull/13775)
    - 新增對新 web_search tool 的支援 - [PR #14083](https://github.com/BerriAI/litellm/pull/14083)
- **[Azure Passthrough](../../docs/providers/azure/azure)**
    - 修正串流中的 Azure Passthrough 請求 - [PR #13831](https://github.com/BerriAI/litellm/pull/13831)

#### 錯誤 {#bugs}

- **一般**
    - 修正 batch 請求中 None metadata 的處理 - [PR #13996](https://github.com/BerriAI/litellm/pull/13996)
    - 修正含特殊 token 輸入時的 token_counter - [PR #13374](https://github.com/BerriAI/litellm/pull/13374)
    - 移除 azure/gpt-4.1 家族不正確的 web search 支援 - [PR #13566](https://github.com/BerriAI/litellm/pull/13566)

---

## [MCP Gateway](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-2}

- **SSE MCP 工具**
    - 新增 SSE MCP tools 的錯誤修正 - 在新增 MCP 時改善連線測試 - [PR #14048](https://github.com/BerriAI/litellm/pull/14048)

[閱讀更多](../../docs/mcp)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}

- **團隊管理**
    - 建立團隊時允許設定 Team Member RPM/TPM 限制 - [PR #13943](https://github.com/BerriAI/litellm/pull/13943)
- **UI 改善**
    - 修正 UI 儀表板中的 Next.js 安全漏洞 - [PR #14084](https://github.com/BerriAI/litellm/pull/14084)
    - 修正可摺疊導覽列設計 - [PR #14075](https://github.com/BerriAI/litellm/pull/14075)

#### 錯誤 {#bugs-1}

- **驗證**
    - 修正 llm_api 類型的 Virtual keys 導致 /anthropic/* 與其他 LLM passthrough 路由出現 Internal Server Error 的問題 - [PR #14046](https://github.com/BerriAI/litellm/pull/14046)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}

- **[Langfuse OTEL](../../docs/proxy/logging#langfuse)**
    - 允許使用 LANGFUSE_OTEL_HOST 來設定主機 - [PR #14013](https://github.com/BerriAI/litellm/pull/14013)
- **[Braintrust](../../docs/proxy/logging#braintrust)**
    - 新增 span 名稱中繼資料功能 - [PR #13573](https://github.com/BerriAI/litellm/pull/13573)
    - 修正測試以參照 `braintrust_logging` 模組中已移動的屬性 - [PR #13978](https://github.com/BerriAI/litellm/pull/13978)
- **[OpenMeter](../../docs/proxy/logging#openmeter)**
    - 在 OpenMeter 整合中，將 token 的 user_id 設為使用者 - [PR #13152](https://github.com/BerriAI/litellm/pull/13152)

#### 新的防護欄支援 {#new-guardrail-support}

- **[Noma Security](../../docs/proxy/guardrails)**
    - 新增 Noma Security 防護欄支援 - [PR #13572](https://github.com/BerriAI/litellm/pull/13572)
- **[Pangea](../../docs/proxy/guardrails)**
    - 更新 Pangea Guardrail 以支援新的 AIDR 端點 - [PR #13160](https://github.com/BerriAI/litellm/pull/13160)

---

## 效能／負載平衡／可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}

- **快取**
    - 在提供給用戶端之前，先驗證快取項目是否已過期 - [PR #13933](https://github.com/BerriAI/litellm/pull/13933)
    - 修正將延遲以 timedelta 存入 Redis 時發生的錯誤 - [PR #14040](https://github.com/BerriAI/litellm/pull/14040)
- **路由器**
    - 重構路由器，在 simple_shuffle 中以單一迴圈依照 'weight'、'rpm'、'tpm' 選擇權重 - [PR #13562](https://github.com/BerriAI/litellm/pull/13562)
- **記錄**
    - 修正 LoggingWorker 的優雅關閉，以避免 CancelledError 警告 - [PR #14050](https://github.com/BerriAI/litellm/pull/14050)
    - 強化容器的記錄，將一般格式與 json 格式都寫入檔案 - [PR #13394](https://github.com/BerriAI/litellm/pull/13394)

#### 錯誤 {#bugs-2}

- **依賴項**
    - 將 `orjson` 版本升級為 "3.11.2" - [PR #13969](https://github.com/BerriAI/litellm/pull/13969)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-6}

- **AWS**
    - 新增對帶有 session token 的 AWS assume_role 支援 - [PR #13919](https://github.com/BerriAI/litellm/pull/13919)
- **OCI 提供者**
    - 新增將 oci_key_file 作為 optional_parameter - [PR #14036](https://github.com/BerriAI/litellm/pull/14036)
- **設定**
    - 允許設定在支出記錄中的請求項目被截斷前的門檻 - [PR #14042](https://github.com/BerriAI/litellm/pull/14042)
    - 強化 proxy_config 設定：在 Helm charts 中新增對現有 configmap 的支援 - [PR #14041](https://github.com/BerriAI/litellm/pull/14041)
- **Docker**
    - 在 non-root 映像中加回 supervisor - [PR #13922](https://github.com/BerriAI/litellm/pull/13922)

---

## 新貢獻者 {#new-contributors}
* @ArthurRenault 首次貢獻於 [PR #13922](https://github.com/BerriAI/litellm/pull/13922)
* @stevenmanton 首次貢獻於 [PR #13919](https://github.com/BerriAI/litellm/pull/13919)
* @uc4w6c 首次貢獻於 [PR #13914](https://github.com/BerriAI/litellm/pull/13914)
* @nielsbosma 首次貢獻於 [PR #13573](https://github.com/BerriAI/litellm/pull/13573)
* @Yuki-Imajuku 首次貢獻於 [PR #13567](https://github.com/BerriAI/litellm/pull/13567)
* @codeflash-ai[bot] 首次貢獻於 [PR #13988](https://github.com/BerriAI/litellm/pull/13988)
* @ColeFrench 首次貢獻於 [PR #13978](https://github.com/BerriAI/litellm/pull/13978)
* @dttran-glo 首次貢獻於 [PR #13969](https://github.com/BerriAI/litellm/pull/13969)
* @manascb1344 首次貢獻於 [PR #13965](https://github.com/BerriAI/litellm/pull/13965)
* @DorZion 首次貢獻於 [PR #13572](https://github.com/BerriAI/litellm/pull/13572)
* @edwardsamuel 首次貢獻於 [PR #13536](https://github.com/BerriAI/litellm/pull/13536)
* @blahgeek 首次貢獻於 [PR #13374](https://github.com/BerriAI/litellm/pull/13374)
* @Deviad 首次貢獻於 [PR #13394](https://github.com/BerriAI/litellm/pull/13394)
* @XSAM 首次貢獻於 [PR #13775](https://github.com/BerriAI/litellm/pull/13775)
* @KRRT7 首次貢獻於 [PR #14012](https://github.com/BerriAI/litellm/pull/14012)
* @ikaadil 首次貢獻於 [PR #13991](https://github.com/BerriAI/litellm/pull/13991)
* @timelfrink 首次貢獻於 [PR #13691](https://github.com/BerriAI/litellm/pull/13691)
* @qidu 首次貢獻於 [PR #13562](https://github.com/BerriAI/litellm/pull/13562)
* @nagyv 首次貢獻於 [PR #13243](https://github.com/BerriAI/litellm/pull/13243)
* @xywei 首次貢獻於 [PR #12885](https://github.com/BerriAI/litellm/pull/12885)
* @ericgtkb 首次貢獻於 [PR #12797](https://github.com/BerriAI/litellm/pull/12797)
* @NoWall57 首次貢獻於 [PR #13945](https://github.com/BerriAI/litellm/pull/13945)
* @lmwang9527 首次貢獻於 [PR #14050](https://github.com/BerriAI/litellm/pull/14050)
* @WilsonSunBritten 首次貢獻於 [PR #14042](https://github.com/BerriAI/litellm/pull/14042)
* @Const-antine 首次貢獻於 [PR #14041](https://github.com/BerriAI/litellm/pull/14041)
* @dmvieira 首次貢獻於 [PR #14040](https://github.com/BerriAI/litellm/pull/14040)
* @gotsysdba 首次貢獻於 [PR #14036](https://github.com/BerriAI/litellm/pull/14036)
* @moshemorad 首次貢獻於 [PR #14005](https://github.com/BerriAI/litellm/pull/14005)
* @joshualipman123 首次貢獻於 [PR #13144](https://github.com/BerriAI/litellm/pull/13144)

---

## **[完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.76.0-nightly...v1.76.1)** {#full-changeloghttpsgithubcomberriailitellmcomparev1760-nightlyv1761}
