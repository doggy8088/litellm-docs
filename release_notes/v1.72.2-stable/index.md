---
title: "v1.72.2-stable"
slug: "v1-72-2-stable"
date: 2025-06-07T10:00:00
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
docker.litellm.ai/berriai/litellm:main-v1.72.2-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.72.2.post1
```

</TabItem>
</Tabs>

## TLDR {#tldr}

* **為什麼要升級**
    - /v1/messages 的效能改善：對於此端點，LiteLLM Proxy 的額外負擔現在在 250 RPS 下已降至 50ms。
    - 精準的速率限制：多實例速率限制現在可跨金鑰、模型、團隊與使用者追蹤速率限制，且不會溢出。
    - UI 上的稽核記錄：透過查看 LiteLLM UI 上的稽核記錄，可追蹤金鑰、團隊與模型何時被刪除。
    - /v1/messages 支援所有模型：您現在可以在 /v1/messages API 中使用所有 LiteLLM 模型（`gpt-4.1`、`o1-pro`、`gemini-2.5-pro`）。
    - [Anthropic MCP](../../docs/providers/anthropic#mcp-tool-calling)：使用 Anthropic 模型搭配遠端 MCP Servers。
* **誰應該閱讀**
    - 使用 `/v1/messages` API（Claude Code）的團隊
    - 使用 LiteLLM Virtual Keys 並設定速率限制的 Proxy 管理員
* **升級風險**
    - **中**
        - 已升級 `ddtrace==3.8.0`，如果您使用 DataDog tracing，這屬於中等風險。我們建議監控記錄以檢查任何問題。

---

## `/v1/messages` 效能改善 {#v1messages-performance-improvements}

<Image 
  img={require('../../img/release_notes/v1_messages_perf.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

此版本為 LiteLLM 的 /v1/messages API 帶來顯著的效能改善。

對於此端點，LiteLLM Proxy 的額外延遲現在已降至 50ms，而且每個實例可處理 250 RPS。我們透過載入測試驗證了這些改善，測試負載包含超過 1,000 個串流分段。

這對於包含大型請求的即時使用情境（例如多輪對話、Claude Code 等）非常有幫助。

## 多實例速率限制改善 {#multi-instance-rate-limiting-improvements}

<Image 
  img={require('../../img/release_notes/multi_instance_rate_limits_v3.jpg')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

LiteLLM 現在可精準追蹤跨金鑰、模型、團隊與使用者的速率限制，且不會有任何溢出。

相較於上一版，這是一項重大改善；先前在高流量、多實例部署中曾出現洩漏與溢出的問題。

**主要變更：**
- Redis 現在成為速率限制檢查的一部分，而不再只是背景同步。這可確保準確性，並在低活動時減少讀寫作業。
- LiteLLM 現在使用 Lua scripts 以確保所有檢查都是原子性的。
- 記憶體內快取使用 Redis 值。這可防止漂移，並在物件超過其限制後減少 Redis 查詢。

這些變更目前位於功能旗標 - `EXPERIMENTAL_ENABLE_MULTI_INSTANCE_RATE_LIMITING=True` 之後。我們計畫在下一版中將其 GA——視回饋而定。

## UI 上的稽核記錄 {#audit-logs-on-ui}

<Image 
  img={require('../../img/release_notes/ui_audit_log.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

此版本加入了在 UI 中查看稽核記錄的支援。身為 Proxy 管理員，您現在可以查看金鑰是否以及何時被刪除，以及是誰執行了該動作。

LiteLLM 會追蹤下列實體與動作的變更：

- **實體：** 金鑰、團隊、使用者、模型
- **動作：** 建立、更新、刪除、重新產生

## 新模型 / 已更新模型 {#new-models--updated-models}

**新加入的模型**

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- |
| Anthropic   | `claude-4-opus-20250514`               | 200K           | $15.00              | $75.00               |
| Anthropic   | `claude-4-sonnet-20250514`             | 200K           | $3.00               | $15.00               |
| VertexAI, Google AI Studio      | `gemini-2.5-pro-preview-06-05`         | 1M             | $1.25               | $10.00               |
| OpenAI      | `codex-mini-latest`                    | 200K           | $1.50               | $6.00                |
| Cerebras    | `qwen-3-32b`                           | 128K           | $0.40               | $0.80                |
| SambaNova   | `DeepSeek-R1`                          | 32K            | $5.00               | $7.00                |
| SambaNova   | `DeepSeek-R1-Distill-Llama-70B`       | 131K           | $0.70               | $1.40                |

### 模型更新 {#model-updates}

- **[Anthropic](../../docs/providers/anthropic)**
    - 新 Claude 模型新增成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11339)
        - `claude-4-opus-20250514`
        - `claude-4-sonnet-20250514`
    - 支援 Anthropic 模型的 MCP tool calling - [PR](https://github.com/BerriAI/litellm/pull/11474)
- **[Google AI Studio](../../docs/providers/gemini)**
    - 支援 Google Gemini 2.5 Pro Preview 06-05 - [PR](https://github.com/BerriAI/litellm/pull/11447)
    - Gemini streaming thinking content 解析搭配 `reasoning_content` - [PR](https://github.com/BerriAI/litellm/pull/11298)
    - 支援 Gemini 模型的 no reasoning 選項 - [PR](https://github.com/BerriAI/litellm/pull/11393)
    - 支援 Gemini 模型的 URL context - [PR](https://github.com/BerriAI/litellm/pull/11351)
    - Gemini embeddings-001 模型價格與 context window - [PR](https://github.com/BerriAI/litellm/pull/11332)
- **[OpenAI](../../docs/providers/openai)**
    - `codex-mini-latest` 的成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11492)
- **[Vertex AI](../../docs/providers/vertex)**
    - 串流請求的 cache token 追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11387)
    - 回傳與上游回應 ID 相符的 response_id，適用於串流與非串流 - [PR](https://github.com/BerriAI/litellm/pull/11456)
- **[Cerebras](../../docs/providers/cerebras)**
    - Cerebras/qwen-3-32b 模型定價與 context window - [PR](https://github.com/BerriAI/litellm/pull/11373)
- **[HuggingFace](../../docs/providers/huggingface)**
    - 修正使用非預設 `input_type` 的 embeddings - [PR](https://github.com/BerriAI/litellm/pull/11452)
- **[DataRobot](../../docs/providers/datarobot)**
    - 新的提供者整合，用於企業 AI 工作流程 - [PR](https://github.com/BerriAI/litellm/pull/10385)
- **[DeepSeek](../../docs/providers/together_ai)**
    - 透過 Together AI 設定 DeepSeek R1 系列模型 - [PR](https://github.com/BerriAI/litellm/pull/11394)
    - DeepSeek R1 定價與 context window 設定 - [PR](https://github.com/BerriAI/litellm/pull/11339)

---

## LLM API 端點 {#llm-api-endpoints}

- **[圖片 API](../../docs/image_generation)**
    - 支援影像端點的 Azure 端點 - [PR](https://github.com/BerriAI/litellm/pull/11482)
- **[Anthropic 訊息 API](../../docs/completion/chat)**
    - 在 /v1/messages API 規格上支援所有 LiteLLM 提供者（OpenAI、Azure、Bedrock、Vertex、DeepSeek 等） - [PR](https://github.com/BerriAI/litellm/pull/11502)
    - /v1/messages 路由的效能改善 - [PR](https://github.com/BerriAI/litellm/pull/11421)
    - 在使用 LiteLLM 搭配 Bedrock 模型時回傳串流使用統計資料 - [PR](https://github.com/BerriAI/litellm/pull/11469)
- **[嵌入向量 API](../../docs/embedding/supported_embedding)**
    - 嵌入請求的提供者特定可選參數處理 - [PR](https://github.com/BerriAI/litellm/pull/11346)
    - Embeddings 正確使用 Sagemaker request attribute - [PR](https://github.com/BerriAI/litellm/pull/11362)
- **[Rerank API](../../docs/rerank/supported_rerank)**
    - 新增 HuggingFace rerank 提供者支援 - [PR](https://github.com/BerriAI/litellm/pull/11438), [指南](../../docs/providers/huggingface_rerank)

---

## 支出追蹤 {#spend-tracking}

- 新增透過 /anthropic passthrough route 進行 anthropic batch 請求的 token 追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11388)

---

## 管理端點 / UI {#management-endpoints--ui}

- **SSO/驗證**
    - SSO 設定端點與具備持久化設定的 UI 整合 - [PR](https://github.com/BerriAI/litellm/pull/11417)
    - 在資料庫中更新 proxy admin ID 角色 + 使用自訂根路徑處理 SSO 重新導向 - [PR](https://github.com/BerriAI/litellm/pull/11384)
    - 支援在自訂驗證中回傳虛擬金鑰 - [PR](https://github.com/BerriAI/litellm/pull/11346)
    - 使用者 ID 驗證，以確保其不是電子郵件或電話號碼 - [PR](https://github.com/BerriAI/litellm/pull/10102)
- **團隊**
    - 修正建立/更新團隊成員 API 500 錯誤 - [PR](https://github.com/BerriAI/litellm/pull/10479)
    - KeyInfoView 中 RegenerateKeyModal 的企業功能閘控 - [PR](https://github.com/BerriAI/litellm/pull/11400)
- **SCIM**
    - 修正 SCIM 執行 patch 作業的大小寫敏感性 - [PR](https://github.com/BerriAI/litellm/pull/11335)
- **一般**
    - 將 action 按鈕改為固定頁尾 action 按鈕 - [PR](https://github.com/BerriAI/litellm/pull/11293)
    - 自訂伺服器根路徑 - 支援在自訂根路徑上提供 UI - [指南](../../docs/proxy/custom_root_ui)
---

## 記錄 / 防護欄 整合 {#logging--guardrails-integrations}

#### 記錄 {#logging}
- **[S3](../../docs/proxy/logging#s3)**
    - 非同步 + 批次化 S3 記錄，以提升效能 - [PR](https://github.com/BerriAI/litellm/pull/11340)
- **[DataDog](../../docs/observability/datadog_integration)**
    - 為串流區塊新增 instrumentation - [PR](https://github.com/BerriAI/litellm/pull/11338)
    - 新增 DD profiler 以監控 LiteLLM CPU% 的 Python 設定檔 - [PR](https://github.com/BerriAI/litellm/pull/11375)
    - 提升 DD trace 版本 - [PR](https://github.com/BerriAI/litellm/pull/11426)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 在 litellm_total_token 指標中傳遞自訂中繼資料標籤 - [PR](https://github.com/BerriAI/litellm/pull/11414)
- **[GCS](../../docs/proxy/logging#google-cloud-storage)**
    - 更新 GCSBucketBase，以在有傳入 GSM 專案 ID 時加以處理 - [PR](https://github.com/BerriAI/litellm/pull/11409)

#### 防護欄 {#guardrails}
- **[Presidio](../../docs/proxy/guardrails/presidio)**
    - 新增 presidio_language yaml 設定支援供防護欄使用 - [PR](https://github.com/BerriAI/litellm/pull/11331)

---

## 效能 / 可靠性改善 {#performance--reliability-improvements}

- **效能最佳化**
    - 不要在 /health/liveliness 端點執行驗證 - [PR](https://github.com/BerriAI/litellm/pull/11378)
    - 不要為每個卡住的請求警示建立 1 個 task - [PR](https://github.com/BerriAI/litellm/pull/11385)
    - 新增除錯端點以追蹤作用中的 /asyncio-tasks - [PR](https://github.com/BerriAI/litellm/pull/11382)
    - 讓 spend logs 中保留上限的批次大小可供控制 - [PR](https://github.com/BerriAI/litellm/pull/11459)
    - 提供停用 token counter 的旗標 - [PR](https://github.com/BerriAI/litellm/pull/11344)
    - 支援較舊 redis 版本的 pipeline redis lpop - [PR](https://github.com/BerriAI/litellm/pull/11425)
---

## 錯誤修正 {#bug-fixes}

- **LLM API 修正**
    - **Anthropic**：修正將檔案 URL 傳入 'file_id' 參數時的迴歸問題 - [PR](https://github.com/BerriAI/litellm/pull/11387)
    - **Vertex AI**：修正 Vertex AI any_of 在 Description 和 Default 上的問題。 - [PR](https://github.com/BerriAI/litellm/issues/11383) 
    - 修正轉錄模型名稱對應 - [PR](https://github.com/BerriAI/litellm/pull/11333)
    - **圖片生成**：修正 gpt-image-1 模型回應中 usage 欄位的 None 值 - [PR](https://github.com/BerriAI/litellm/pull/11448)
    - **Responses API**：修正 _transform_responses_api_content_to_chat_completion_content 不支援檔案內容類型 - [PR](https://github.com/BerriAI/litellm/pull/11494)
    - **Fireworks AI**：修正速率限制例外對應 - 在錯誤訊息中偵測「rate limit」文字 - [PR](https://github.com/BerriAI/litellm/pull/11455)
- **消費追蹤/預算**
    - 遵循 user_header_name 屬性以進行預算選擇與使用者識別 - [PR](https://github.com/BerriAI/litellm/pull/11419)
- **MCP 伺服器**
    - 移除重複的 server_id MCP 設定伺服器 - [PR](https://github.com/BerriAI/litellm/pull/11327)
- **函式呼叫**
    - supports_function_calling 可與 llm_proxy models 搭配運作 - [PR](https://github.com/BerriAI/litellm/pull/11381)
- **知識庫**
    - 修正 Knowledge Base Call 傳回錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11467)

---

## 新貢獻者 {#new-contributors}
* [@mjnitz02](https://github.com/mjnitz02) 在 [#10385](https://github.com/BerriAI/litellm/pull/10385) 中完成了第一次貢獻
* [@hagan](https://github.com/hagan) 在 [#10479](https://github.com/BerriAI/litellm/pull/10479) 中完成了第一次貢獻
* [@wwells](https://github.com/wwells) 在 [#11409](https://github.com/BerriAI/litellm/pull/11409) 中完成了第一次貢獻
* [@likweitan](https://github.com/likweitan) 在 [#11400](https://github.com/BerriAI/litellm/pull/11400) 中完成了第一次貢獻
* [@raz-alon](https://github.com/raz-alon) 在 [#10102](https://github.com/BerriAI/litellm/pull/10102) 中完成了第一次貢獻
* [@jtsai-quid](https://github.com/jtsai-quid) 在 [#11394](https://github.com/BerriAI/litellm/pull/11394) 中完成了第一次貢獻
* [@tmbo](https://github.com/tmbo) 在 [#11362](https://github.com/BerriAI/litellm/pull/11362) 中完成了第一次貢獻
* [@wangsha](https://github.com/wangsha) 在 [#11351](https://github.com/BerriAI/litellm/pull/11351) 中完成了第一次貢獻
* [@seankwalker](https://github.com/seankwalker) 在 [#11452](https://github.com/BerriAI/litellm/pull/11452) 中完成了第一次貢獻
* [@pazevedo-hyland](https://github.com/pazevedo-hyland) 在 [#11381](https://github.com/BerriAI/litellm/pull/11381) 中完成了第一次貢獻
* [@cainiaoit](https://github.com/cainiaoit) 在 [#11438](https://github.com/BerriAI/litellm/pull/11438) 中完成了第一次貢獻
* [@vuanhtu52](https://github.com/vuanhtu52) 在 [#11508](https://github.com/BerriAI/litellm/pull/11508) 中完成了第一次貢獻

---

## 示範實例 {#demo-instance}

這裡有一個 Demo Instance 供測試變更：

- Instance: https://demo.litellm.ai/
- 登入憑證：
    - Username: admin
    - Password: sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/releases/tag/v1.72.2-stable) {#git-diffhttpsgithubcomberriailitellmreleasestagv1722-stable}
