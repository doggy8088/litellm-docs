---
title: "v1.81.0-stable - Claude Code - 全部提供者的 Web Search"
slug: "v1-81-0"
date: 2026-01-18T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.81.0-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.81.0
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Claude Code** - 支援在 Bedrock、Vertex AI 與所有 LiteLLM 提供者之間使用 web search
- **重大變更** - [圖片 URL 下載的 50MB 限制](#major-change---chatcompletions-image-url-download-size-limit)，以提升可靠性
- **效能** - 透過從熱路徑移除過早的 model.dump() 呼叫，達成 [CPU 使用量降低 25%](#performance---25-cpu-usage-reduction)
- **UI 中的已刪除金鑰稽核表格** - [檢視已刪除的金鑰與團隊以供稽核](../../docs/proxy/deleted_keys_teams)，包含刪除當下的支出與預算資訊

---

## Claude Code - 全部提供者的 Web Search {#claude-code---web-search-across-all-providers}

<Image img={require('../../img/release_notes/claude_code_websearch.png')} />

此版本將 web search 支援帶入 LiteLLM 所有提供者上的 Claude Code（Bedrock、Azure、Vertex AI 等），讓 AI 程式撰寫助理能夠搜尋網路以取得即時資訊。

這表示您現在可以在任何提供者上使用 Claude Code 的 web search 工具，而不僅限於 Anthropic 的原生 API。LiteLLM 會自動攔截 web search 請求，並使用您設定的搜尋提供者（Perplexity、Tavily、Exa AI 等）在伺服器端執行。

Proxy 管理員可以在 LiteLLM proxy 設定中設定 web search 攔截，為使用 Claude Code 搭配 Bedrock、Azure 或任何其他受支援提供者的團隊啟用此功能。

[**深入瞭解 →**](https://docs.litellm.ai/docs/tutorials/claude_code_websearch)

---

## 重大變更 - /chat/completions 圖片 URL 下載大小限制 {#major-change---chatcompletions-image-url-download-size-limit}

為了提升可靠性並防止記憶體問題，LiteLLM 現在預設包含可設定的 **50MB 限制**，用於圖片 URL 下載。先前圖片下載沒有限制，遇到非常大的圖片時偶爾可能會造成記憶體問題。

### 其運作方式 {#how-it-works}

圖片 URL 超過 50MB 的請求將收到一則有幫助的錯誤訊息：

```bash
curl -X POST 'https://your-litellm-proxy.com/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What is in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/very-large-image.jpg"
            }
          }
        ]
      }
    ]
  }'
```

**錯誤回應：**

```json
{
  "error": {
    "message": "Error: Image size (75.50MB) exceeds maximum allowed size (50.0MB). url=https://example.com/very-large-image.jpg",
    "type": "ImageFetchError"
  }
}
```

### 設定限制 {#configuring-the-limit}

預設的 50MB 限制對大多數使用情境都很合適，但如有需要，您可以輕鬆調整：

**提高限制（例如，調整為 100MB）：**

```bash
export MAX_IMAGE_URL_DOWNLOAD_SIZE_MB=100
```

**停用圖片 URL 下載（基於安全性）：**

```bash
export MAX_IMAGE_URL_DOWNLOAD_SIZE_MB=0
```

**Docker 設定：**

```bash
docker run \
  -e MAX_IMAGE_URL_DOWNLOAD_SIZE_MB=100 \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:v1.81.0
```

**Proxy 設定（config.yaml）：**

```yaml
general_settings:
  master_key: sk-1234
  
# Set via environment variable
environment_variables:
  MAX_IMAGE_URL_DOWNLOAD_SIZE_MB: "100"
```

### 為什麼要加入這項功能？ {#why-add-this}

此功能透過以下方式提升可靠性：
- 防止超大圖片造成記憶體問題
- 與 OpenAI 的 50MB 負載限制保持一致
- 及早驗證圖片大小（當 Content-Length 標頭可用時）

---

## 效能 - CPU 使用量降低 25% {#performance---25-cpu-usage-reduction}

LiteLLM 現在透過從請求處理的熱路徑中移除過早的 `model.dump()` 呼叫來降低 CPU 使用量。先前，Pydantic 模型序列化會比必要時更早且更頻繁地執行，導致每個請求都有不必要的 CPU 負擔。透過將序列化延後到真正需要時，LiteLLM 可降低 CPU 使用量，並在高負載下提升請求吞吐量。

---

## UI 中的已刪除金鑰稽核表格 {#deleted-keys-audit-table-on-ui}

<Image img={require('../../img/ui_deleted_keys_table.png')} />

LiteLLM 現在在 UI 中直接為已刪除的 API 金鑰與團隊提供完整的稽核表格。此功能可讓您輕鬆追蹤已刪除金鑰的支出、檢視其相關團隊資訊，並維護準確的財務記錄，以供稽核與法遵用途。此表格會顯示金鑰別名、團隊關聯，以及刪除當下擷取的支出資訊等詳細資料。若要進一步瞭解如何使用此功能，請參閱 [Deleted Keys & Teams 文件](../../docs/proxy/deleted_keys_teams)。

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 功能 |
| -------- | ----- | -------- |
| OpenAI | `gpt-5.2-codex` | 程式碼生成 |
| Azure | `azure/gpt-5.2-codex` | 程式碼生成 |
| Cerebras | `cerebras/zai-glm-4.7` | 推理、函式呼叫 |
| Replicate | 所有 chat models | 全面支援所有 Replicate chat models |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
  - 在回應中新增缺失的 anthropic tool results - [PR #18945](https://github.com/BerriAI/litellm/pull/18945)
  - 在多輪對話中保留 web_fetch_tool_result - [PR #18142](https://github.com/BerriAI/litellm/pull/18142)

- **[Gemini](../../docs/providers/gemini)**
  - 為 Google AI Studio 新增 presence_penalty 支援 - [PR #18154](https://github.com/BerriAI/litellm/pull/18154)
  - 在 generateContent adapter 中轉送 extra_headers - [PR #18935](https://github.com/BerriAI/litellm/pull/18935)
  - 為 detail 參數新增 medium 值支援 - [PR #19187](https://github.com/BerriAI/litellm/pull/19187)

- **[Vertex AI](../../docs/providers/vertex)**
  - 改善 passthrough endpoint URL 的解析與建構 - [PR #17526](https://github.com/BerriAI/litellm/pull/17526)
  - 為缺少 type 欄位的 tool schemas 新增 type object - [PR #19103](https://github.com/BerriAI/litellm/pull/19103)
  - 當 properties 為空時，保留 Gemini schema 中的 type 欄位 - [PR #18979](https://github.com/BerriAI/litellm/pull/18979)

- **[Bedrock](../../docs/providers/bedrock)**
  - 新增 OpenAI 相容的 service_tier 參數轉譯 - [PR #18091](https://github.com/BerriAI/litellm/pull/18091)
  - 為 Bedrock passthrough 新增標準記錄物件中的 user 驗證 - [PR #19140](https://github.com/BerriAI/litellm/pull/19140)
  - 移除模型名稱中的 throughput tier 後綴 - [PR #19147](https://github.com/BerriAI/litellm/pull/19147)

- **[OCI](../../docs/providers/oci)**
  - 在多模態訊息中處理 OpenAI 風格的 image_url 物件 - [PR #18272](https://github.com/BerriAI/litellm/pull/18272)

- **[Ollama](../../docs/providers/ollama)**
  - 將 finish_reason 設為 tool_calls，並移除有問題的能力檢查 - [PR #18924](https://github.com/BerriAI/litellm/pull/18924)

- **[Watsonx](../../docs/providers/watsonx/index)**
  - 允許為 Watsonx inferencing 傳遞 scope ID - [PR #18959](https://github.com/BerriAI/litellm/pull/18959)

- **[Replicate](../../docs/providers/replicate)**
  - 新增所有 chat Replicate models 支援 - [PR #18954](https://github.com/BerriAI/litellm/pull/18954)

- **[OpenRouter](../../docs/providers/openrouter)**
  - 新增 OpenRouter 對 image/generation endpoints 的支援 - [PR #19059](https://github.com/BerriAI/litellm/pull/19059)

- **[Volcengine](../../docs/providers/volcano)**
  - 為 Volcengine models（deepseek-v3-2、glm-4-7、kimi-k2-thinking）新增 max_tokens 設定 - [PR #19076](https://github.com/BerriAI/litellm/pull/19076)

- **Azure Model Router**
  - 新模型 - LiteLLM AI Gateway 上的 Azure Model Router - [PR #19054](https://github.com/BerriAI/litellm/pull/19054)

- **GPT-5 模型**
  - 更正 GPT-5 model variants 的上下文視窗大小 - [PR #18928](https://github.com/BerriAI/litellm/pull/18928)
  - 更正 GPT-5 models 的 max_input_tokens - [PR #19056](https://github.com/BerriAI/litellm/pull/19056)

- **文字完成**
  - 支援將 token IDs（整數清單）作為 prompt - [PR #18011](https://github.com/BerriAI/litellm/pull/18011)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
  - 當任何訊息具有 thinking_blocks 時，避免捨棄 thinking - [PR #18929](https://github.com/BerriAI/litellm/pull/18929)
  - 修正帶有 thinking 的 anthropic token counter - [PR #19067](https://github.com/BerriAI/litellm/pull/19067)
  - 為 Anthropic 新增更好的錯誤處理 - [PR #18955](https://github.com/BerriAI/litellm/pull/18955)
  - 修正 Anthropic during call 錯誤 - [PR #19060](https://github.com/BerriAI/litellm/pull/19060)

- **[Gemini](../../docs/providers/gemini)**
  - 修正在未使用 reasoning_effort 時，Gemini 3 Flash 中缺少的 `completion_tokens_details` - [PR #18898](https://github.com/BerriAI/litellm/pull/18898)
  - 修正 Gemini Image Generation 的 imageConfig 參數 - [PR #18948](https://github.com/BerriAI/litellm/pull/18948)

- **[Vertex AI](../../docs/providers/vertex)**
  - 修正 Vertex AI 400 錯誤與 CachedContent model 不符的問題 - [PR #19193](https://github.com/BerriAI/litellm/pull/19193)
  - 修正 Vertex AI 不支援結構化輸出 - [PR #19201](https://github.com/BerriAI/litellm/pull/19201)

- **[Bedrock](../../docs/providers/bedrock)**
  - 修正 Claude Code (`/messages`) Bedrock Invoke 用量與請求簽章 - [PR #19111](https://github.com/BerriAI/litellm/pull/19111)
  - 修正 Bedrock passthrough 的模型 ID 編碼 - [PR #18944](https://github.com/BerriAI/litellm/pull/18944)
  - 在思考功能中尊重 max_completion_tokens - [PR #18946](https://github.com/BerriAI/litellm/pull/18946)
  - 修正 Bedrock passthrough 的標頭轉送 - [PR #19007](https://github.com/BerriAI/litellm/pull/19007)
  - 修正 Bedrock 穩定性模型用量問題 - [PR #19199](https://github.com/BerriAI/litellm/pull/19199)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[/messages (Claude Code)](../../docs/providers/anthropic)**
  - 在 Azure、Bedrock 和 Anthropic API 的 `/messages` API 上新增 Tool Search 支援 - [PR #19165](https://github.com/BerriAI/litellm/pull/19165)
  - 透過 Claude Code (`/messages`) 追蹤終端使用者，以利更好的分析與監控 - [PR #19171](https://github.com/BerriAI/litellm/pull/19171)
  - 使用 LiteLLM `/search` 端點與 Claude Code (`/messages`) 新增網頁搜尋支援 - [PR #19263](https://github.com/BerriAI/litellm/pull/19263), [PR #19294](https://github.com/BerriAI/litellm/pull/19294)

- **[/messages (Claude Code) - Bedrock](../../docs/providers/bedrock)**
  - 在 `/messages` 上為 Bedrock Converse 新增 Prompt Caching 支援 - [PR #19123](https://github.com/BerriAI/litellm/pull/19123)
  - 確保預算 token 在 `/messages` 上正確傳遞給 Bedrock Converse API - [PR #19107](https://github.com/BerriAI/litellm/pull/19107)

- **[Responses API](../../docs/response_api)**
  - 為 responses API 新增快取支援 - [PR #19068](https://github.com/BerriAI/litellm/pull/19068)
  - 為 responses API 新增重試策略支援 - [PR #19074](https://github.com/BerriAI/litellm/pull/19074)

- **即時 API**
  - 對端點 v1/a2a/message/send 使用非串流方法 - [PR #19025](https://github.com/BerriAI/litellm/pull/19025)

- **批次 API**
  - 修正批次刪除與擷取 - [PR #18340](https://github.com/BerriAI/litellm/pull/18340)

#### 錯誤 {#bugs}

- **一般**
  - 修正 responses content 不能為 none - [PR #19064](https://github.com/BerriAI/litellm/pull/19064)
  - 修正 realtime 請求中從 query param 取得的 model name - [PR #19135](https://github.com/BerriAI/litellm/pull/19135)
  - 修正 wildcard models 的 video status/content credential 注入 - [PR #18854](https://github.com/BerriAI/litellm/pull/18854)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

**虛擬金鑰**
- 檢視已刪除的金鑰以供稽核 - [PR #18228](https://github.com/BerriAI/litellm/pull/18228), [PR #19268](https://github.com/BerriAI/litellm/pull/19268)
- 為金鑰清單新增 status query parameter - [PR #19260](https://github.com/BerriAI/litellm/pull/19260)
- 建立金鑰後重新擷取金鑰 - [PR #18994](https://github.com/BerriAI/litellm/pull/18994)
- 刪除時重新整理金鑰清單 - [PR #19262](https://github.com/BerriAI/litellm/pull/19262)
- 簡化金鑰產生權限錯誤 - [PR #18997](https://github.com/BerriAI/litellm/pull/18997)
- 在金鑰編輯團隊下拉選單中新增搜尋 - [PR #19119](https://github.com/BerriAI/litellm/pull/19119)

**團隊與組織**
- 檢視已刪除的團隊以供稽核 - [PR #18228](https://github.com/BerriAI/litellm/pull/18228), [PR #19268](https://github.com/BerriAI/litellm/pull/19268)
- 為 organization 表格新增篩選器 - [PR #18916](https://github.com/BerriAI/litellm/pull/18916)
- 為 `/organization/list` 新增查詢參數 - [PR #18910](https://github.com/BerriAI/litellm/pull/18910)
- 為團隊清單新增 status query parameter - [PR #19260](https://github.com/BerriAI/litellm/pull/19260)
- 僅向內部使用者顯示其支出 - [PR #19227](https://github.com/BerriAI/litellm/pull/19227)
- 允許防止團隊管理員從團隊中刪除成員 - [PR #19128](https://github.com/BerriAI/litellm/pull/19128)
- 重構團隊成員圖示按鈕 - [PR #19192](https://github.com/BerriAI/litellm/pull/19192)

**模型 + 端點**
- 在公開 model hub 顯示健康資訊 - [PR #19256](https://github.com/BerriAI/litellm/pull/19256), [PR #19258](https://github.com/BerriAI/litellm/pull/19258)
- Anthropic models 的生活品質改善 - [PR #19058](https://github.com/BerriAI/litellm/pull/19058)
- 建立可重用的 model select component - [PR #19164](https://github.com/BerriAI/litellm/pull/19164)
- 編輯設定的 model 下拉選單 - [PR #19186](https://github.com/BerriAI/litellm/pull/19186)
- 修正 model hub 用戶端例外 - [PR #19045](https://github.com/BerriAI/litellm/pull/19045)

**用量與分析**
- 允許頂部 virtual keys 和 models 顯示更多項目 - [PR #19050](https://github.com/BerriAI/litellm/pull/19050)
- 修正 model activity 圖表的 Y 軸 - [PR #19055](https://github.com/BerriAI/litellm/pull/19055)
- 在匯出報告中新增 Team ID 與 Team Name - [PR #19047](https://github.com/BerriAI/litellm/pull/19047)
- 為 Prometheus 新增使用者指標 - [PR #18785](https://github.com/BerriAI/litellm/pull/18785)

**SSO 與驗證**
- 允許設定自訂的 MSFT Base URLs - [PR #18977](https://github.com/BerriAI/litellm/pull/18977)
- 允許覆寫 env var 屬性名稱 - [PR #18998](https://github.com/BerriAI/litellm/pull/18998)
- 修正 SCIM GET /Users 錯誤並強制 SCIM 2.0 相容性 - [PR #17420](https://github.com/BerriAI/litellm/pull/17420)
- SCIM 相容性修正的功能旗標 - [PR #18878](https://github.com/BerriAI/litellm/pull/18878)

**一般 UI**
- 在下拉元件中新增 allowClear 以改善 UX - [PR #18778](https://github.com/BerriAI/litellm/pull/18778)
- 新增社群互動按鈕 - [PR #19114](https://github.com/BerriAI/litellm/pull/19114)
- UI 意見回饋表單 - 為什麼選擇 LiteLLM - [PR #18999](https://github.com/BerriAI/litellm/pull/18999)
- 將使用者與團隊表格篩選器重構為可重用元件 - [PR #19010](https://github.com/BerriAI/litellm/pull/19010)
- 調整新徽章 - [PR #19278](https://github.com/BerriAI/litellm/pull/19278)

#### 錯誤 {#bugs-1}

- Container API 路由對非管理員使用者回傳 401 - openai_routes 中缺少路由 - [PR #19115](https://github.com/BerriAI/litellm/pull/19115)
- 允許將 Containers API 路由至區域性端點 - [PR #19118](https://github.com/BerriAI/litellm/pull/19118)
- 修正 Azure Storage circular reference 錯誤 - [PR #19120](https://github.com/BerriAI/litellm/pull/19120)
- 修正使用 Prisma FieldNotFoundError 時 prompt 刪除失敗 - [PR #18966](https://github.com/BerriAI/litellm/pull/18966)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/proxy/logging#opentelemetry)**
  - 將語意慣例更新至 1.38（gen_ai 屬性） - [PR #18793](https://github.com/BerriAI/litellm/pull/18793)

- **[LangSmith](../../docs/proxy/logging#langsmith)**
  - 提升執行緒分組中繼資料（session_id、thread） - [PR #18982](https://github.com/BerriAI/litellm/pull/18982)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
  - 使用 Langfuse callback 時，在 JSON 記錄中包含 Langfuse logger - [PR #19162](https://github.com/BerriAI/litellm/pull/19162)

- **[Logfire](../../docs/observability/logfire)**
  - 新增可透過 env var 自訂 Logfire base URL 的能力 - [PR #19148](https://github.com/BerriAI/litellm/pull/19148)

- **一般記錄**
  - 透過設定啟用 JSON 記錄並新增迴歸測試 - [PR #19037](https://github.com/BerriAI/litellm/pull/19037)
  - 修正 embeddings 端點的標頭轉送 - [PR #18960](https://github.com/BerriAI/litellm/pull/18960)
  - 在錯誤回應中保留 llm_provider-* 標頭 - [PR #19020](https://github.com/BerriAI/litellm/pull/19020)
  - 修正 turn_off_message_logging 未在 proxy_server_request 欄位中遮蔽請求訊息 - [PR #18897](https://github.com/BerriAI/litellm/pull/18897)

### 防護欄 {#guardrails}

- **[Grayswan](../../docs/proxy/guardrails/grayswan)**
  - 實作 fail-open 選項（預設：True） - [PR #18266](https://github.com/BerriAI/litellm/pull/18266)

- **[Pangea](../../docs/proxy/guardrails/pangea)**
  - 在初始化期間尊重 `default_on` - [PR #18912](https://github.com/BerriAI/litellm/pull/18912)

- **[Panw Prisma AIRS](../../docs/proxy/guardrails/panw_prisma_airs)**
  - 新增自訂違規訊息支援 - [PR #19272](https://github.com/BerriAI/litellm/pull/19272)

- **一般防護欄**
  - 修正 SerializationIterator 錯誤並將 tools 傳遞給 guardrail - [PR #18932](https://github.com/BerriAI/litellm/pull/18932)
  - 正確處理自訂 guardrails 參數 - [PR #18978](https://github.com/BerriAI/litellm/pull/18978)
  - 對被阻擋的請求使用乾淨的錯誤訊息 - [PR #19023](https://github.com/BerriAI/litellm/pull/19023)
  - 搭配 responses API 的 guardrail moderation 支援 - [PR #18957](https://github.com/BerriAI/litellm/pull/18957)
  - 修正模型層級防護欄未生效 - [PR #18895](https://github.com/BerriAI/litellm/pull/18895)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本計算修正**
  - 在 Gemini models 的成本計算中包含 IMAGE token 數量 - [PR #18876](https://github.com/BerriAI/litellm/pull/18876)
  - 修正使用快取與圖片時出現的負數 text_tokens - [PR #18768](https://github.com/BerriAI/litellm/pull/18768)
  - 修正 `/images/generations` 的圖片 token 支出記錄 - [PR #19009](https://github.com/BerriAI/litellm/pull/19009)
  - 修正 Gemini Image Generation 中不正確的 `prompt_tokens_details` - [PR #19070](https://github.com/BerriAI/litellm/pull/19070)
  - 修正不區分大小寫的 model cost map 查找 - [PR #18208](https://github.com/BerriAI/litellm/pull/18208)

- **價格更新**
  - 修正 `openrouter/openai/gpt-oss-20b` 的定價 - [PR #18899](https://github.com/BerriAI/litellm/pull/18899)
  - 新增 `azure_ai/claude-opus-4-5` 的定價 - [PR #19003](https://github.com/BerriAI/litellm/pull/19003)
  - 更新 Novita 模型價格 - [PR #19005](https://github.com/BerriAI/litellm/pull/19005)
  - 修正 Azure Grok 價格 - [PR #19102](https://github.com/BerriAI/litellm/pull/19102)
  - 修正 GCP GLM-4.7 定價 - [PR #19172](https://github.com/BerriAI/litellm/pull/19172)
  - 同步 DeepSeek chat/reasoner 至 V3.2 定價 - [PR #18884](https://github.com/BerriAI/litellm/pull/18884)
  - 修正 gemini-2.5-pro 模型的 cache_read 定價 - [PR #18157](https://github.com/BerriAI/litellm/pull/18157)

- **預算與速率限制**
  - 修正團隊成員的預算上限驗證運算子 (>=) - [PR #19207](https://github.com/BerriAI/litellm/pull/19207)
  - 透過確保優先佇列邏輯來修正 TPM 25% 限制 - [PR #19092](https://github.com/BerriAI/litellm/pull/19092)
  - 清理支出記錄 cron 驗證、修正與文件 - [PR #19085](https://github.com/BerriAI/litellm/pull/19085)

---

## MCP 閘道 {#mcp-gateway}

- 防止重複註冊 MCP reload 排程器 - [PR #18934](https://github.com/BerriAI/litellm/pull/18934)
- 以不區分大小寫方式轉發 MCP 額外標頭 - [PR #18940](https://github.com/BerriAI/litellm/pull/18940)
- 修正 MCP REST 驗證檢查 - [PR #19051](https://github.com/BerriAI/litellm/pull/19051)
- 修正回應中生成兩個 telemetry 事件 - [PR #18938](https://github.com/BerriAI/litellm/pull/18938)
- 修正 MCP chat completions - [PR #19129](https://github.com/BerriAI/litellm/pull/19129)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **效能改善**
  - 移除在高負載下造成高 CPU 使用率與額外負擔的瓶頸 - [PR #19049](https://github.com/BerriAI/litellm/pull/19049)
  - 為 `_get_model_cost_key` 中的 O(1) 操作新增 CI 強制檢查，以防止效能回歸 - [PR #19052](https://github.com/BerriAI/litellm/pull/19052)
  - 修正 Azure embeddings JSON 解析，以防止連線洩漏並確保正確的路由冷卻時間 - [PR #19167](https://github.com/BerriAI/litellm/pull/19167)
  - 若啟用 `disable_token_counter`，則不要回退到 token 計數器 - [PR #19041](https://github.com/BerriAI/litellm/pull/19041)

- **可靠性**
  - 新增備援端點支援 - [PR #19185](https://github.com/BerriAI/litellm/pull/19185)
  - 修正 stream_timeout 參數功能 - [PR #19191](https://github.com/BerriAI/litellm/pull/19191)
  - 修正設定中的模型比對優先順序 - [PR #19012](https://github.com/BerriAI/litellm/pull/19012)
  - 依據設定修正 litellm_params 中的 num_retries - [PR #18975](https://github.com/BerriAI/litellm/pull/18975)
  - 處理不含 response 參數的例外 - [PR #18919](https://github.com/BerriAI/litellm/pull/18919)

- **基礎架構**
  - 將自訂 CA 憑證新增至 boto3 用戶端 - [PR #18942](https://github.com/BerriAI/litellm/pull/18942)
  - 將 boto3 更新至 1.40.15，並將 aioboto3 更新至 15.5.0 - [PR #19090](https://github.com/BerriAI/litellm/pull/19090)
  - 使 keepalive_timeout 參數可用於 Gunicorn - [PR #19087](https://github.com/BerriAI/litellm/pull/19087)

- **Helm Chart**
  - 修正將 config.yaml 掛載為單一檔案的 Helm chart - [PR #19146](https://github.com/BerriAI/litellm/pull/19146)
  - 將 Helm chart 版本控管與正式環境標準及 Docker 版本同步 - [PR #18868](https://github.com/BerriAI/litellm/pull/18868)

---

## 資料庫變更 {#database-changes}

### 結構描述更新 {#schema-updates}

| 資料表 | 變更類型 | 說明 | PR |
| ----- | ----------- | ----------- | -- |
| `LiteLLM_ProxyModelTable` | 新增欄位 | 新增 `created_at` 和 `updated_at` 時戳欄位 | [PR #18937](https://github.com/BerriAI/litellm/pull/18937) |

---

## 文件更新 {#documentation-updates}

- 新增 LiteLLM 架構 md 文件 - [PR #19057](https://github.com/BerriAI/litellm/pull/19057), [PR #19252](https://github.com/BerriAI/litellm/pull/19252)
- 新增疑難排解指南 - [PR #19096](https://github.com/BerriAI/litellm/pull/19096), [PR #19097](https://github.com/BerriAI/litellm/pull/19097), [PR #19099](https://github.com/BerriAI/litellm/pull/19099)
- 新增 CPU 與記憶體問題的結構化問題回報指南 - [PR #19117](https://github.com/BerriAI/litellm/pull/19117)
- 為高流量部署新增 Redis 要求警告 - [PR #18892](https://github.com/BerriAI/litellm/pull/18892)
- 搭配 enable_pre_call_checks 更新負載平衡與路由 - [PR #18888](https://github.com/BerriAI/litellm/pull/18888)
- 使用 guided 參數更新 pass_through - [PR #18886](https://github.com/BerriAI/litellm/pull/18886)
- 更新 message content types 連結並新增 content types 表格 - [PR #18209](https://github.com/BerriAI/litellm/pull/18209)
- 新增包含 kwargs 的 Redis 初始化 - [PR #19183](https://github.com/BerriAI/litellm/pull/19183)
- 改善透過 SAP Gen AI Hub 路由 LLM 請求的文件 - [PR #19166](https://github.com/BerriAI/litellm/pull/19166)
- 刪除 Keys 與 Teams 文件 - [PR #19291](https://github.com/BerriAI/litellm/pull/19291)
- Claude Code 最終使用者追蹤指南 - [PR #19176](https://github.com/BerriAI/litellm/pull/19176)
- 新增 MCP 疑難排解指南 - [PR #19122](https://github.com/BerriAI/litellm/pull/19122)
- 新增驗證訊息 UI 文件 - [PR #19063](https://github.com/BerriAI/litellm/pull/19063)
- 新增在 Helm/K8s 中掛載自訂回呼的指南 - [PR #19136](https://github.com/BerriAI/litellm/pull/19136)

---

## 錯誤修正 {#bug-fixes-1}

- 修正 OpenAPI schema 中 server_root_path 的 Swagger UI 路徑執行錯誤 - [PR #18947](https://github.com/BerriAI/litellm/pull/18947)
- 標準化 OpenAI SDK BaseModel choices/messages 以避免 Pydantic 序列化器警告 - [PR #18972](https://github.com/BerriAI/litellm/pull/18972)
- 新增上下文間隙檢查與單字形式數字 - [PR #18301](https://github.com/BerriAI/litellm/pull/18301)
- 清理儲存庫根目錄中孤兒檔案 - [PR #19150](https://github.com/BerriAI/litellm/pull/19150)
- 在 non-root 中包含 proxy/prisma_migration.py - [PR #18971](https://github.com/BerriAI/litellm/pull/18971)
- 更新 prisma_migration.py - [PR #19083](https://github.com/BerriAI/litellm/pull/19083)

---

## 新貢獻者 {#new-contributors}

* @yogeshwaran10 在 [PR #18898](https://github.com/BerriAI/litellm/pull/18898) 完成了第一次貢獻
* @theonlypal 在 [PR #18937](https://github.com/BerriAI/litellm/pull/18937) 完成了第一次貢獻
* @jonmagic 在 [PR #18935](https://github.com/BerriAI/litellm/pull/18935) 完成了第一次貢獻
* @houdataali 在 [PR #19025](https://github.com/BerriAI/litellm/pull/19025) 完成了第一次貢獻
* @hummat 在 [PR #18972](https://github.com/BerriAI/litellm/pull/18972) 完成了第一次貢獻
* @berkeyalciin 在 [PR #18966](https://github.com/BerriAI/litellm/pull/18966) 完成了第一次貢獻
* @MateuszOssGit 在 [PR #18959](https://github.com/BerriAI/litellm/pull/18959) 完成了第一次貢獻
* @xfan001 在 [PR #18947](https://github.com/BerriAI/litellm/pull/18947) 完成了第一次貢獻
* @nulone 在 [PR #18884](https://github.com/BerriAI/litellm/pull/18884) 完成了第一次貢獻
* @debnil-mercor 在 [PR #18919](https://github.com/BerriAI/litellm/pull/18919) 完成了第一次貢獻
* @hakhundov 在 [PR #17420](https://github.com/BerriAI/litellm/pull/17420) 完成了第一次貢獻
* @rohanwinsor 在 [PR #19078](https://github.com/BerriAI/litellm/pull/19078) 完成了第一次貢獻
* @pgolm 在 [PR #19020](https://github.com/BerriAI/litellm/pull/19020) 完成了第一次貢獻
* @vikigenius 在 [PR #19148](https://github.com/BerriAI/litellm/pull/19148) 完成了第一次貢獻
* @burnerburnerburnerman 在 [PR #19090](https://github.com/BerriAI/litellm/pull/19090) 完成了第一次貢獻
* @yfge 在 [PR #19076](https://github.com/BerriAI/litellm/pull/19076) 完成了第一次貢獻
* @danielnyari-seon 在 [PR #19083](https://github.com/BerriAI/litellm/pull/19083) 完成了第一次貢獻
* @guilherme-segantini 在 [PR #19166](https://github.com/BerriAI/litellm/pull/19166) 完成了第一次貢獻
* @jgreek 在 [PR #19147](https://github.com/BerriAI/litellm/pull/19147) 完成了第一次貢獻
* @anand-kamble 在 [PR #19193](https://github.com/BerriAI/litellm/pull/19193) 完成了第一次貢獻
* @neubig 在 [PR #19162](https://github.com/BerriAI/litellm/pull/19162) 完成了第一次貢獻

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上查看完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.80.15.rc.1...v1.81.0.rc.1)**
