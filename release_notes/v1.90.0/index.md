---
title: "v1.90.0 - 六個新提供者、OpenTelemetry v2 對等功能與串流可靠性"
slug: "v1-90-0"
date: 2026-06-26T19:52:37
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.90.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.0
```

</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

- **六個新提供者** - ModelScope、LibertAI、Parasail、Pinstripes、TinyFish（搜尋）與 FastCRW（搜尋）- 另外還有新的 e2b 程式碼執行 sandbox 基元。
- **91 個新模型** 涵蓋 Fireworks AI、Scaleway、Tensormesh、LibertAI、Azure AI（包含 `gpt-5.5` 與 DeepSeek V4）以及 Bedrock Mantle。
- **OpenTelemetry v2 在指標上達到與 v1 對等**，會發出六個 `gen_ai.client.*` 指標、標記輸入/輸出訊息內容，並依租戶範圍隔離 OTLP 憑證。
- **廣泛的串流可靠性檢視**：當用戶端在串流中途中斷連線時，會釋放上游連線（Gemini、aiohttp），請求會被乾淨地取消，且中斷的串流會記錄部分消費。
- **兩個新的防護欄**（Cisco AI Defense、Repello Argus）以及一項大規模的 Next.js App Router UI 遷移，涵蓋 models、teams、users、organizations、api-keys 與 usage 頁面。

## App Router 路由 {#app-router-routing}

<Image img={require('../../img/release_notes/app_router_routing.png')} style={{ width: '800px', height: 'auto' }} />

我們正在把 Admin UI 從基於查詢參數的路由遷移到 Nextjs App Router。其動機是路由現在位於 URL 中，因此任何檢視（特定團隊、篩選過的 usage 報告、單一 key）都會變成可分享的連結，您可以傳給同事或加入書籤，而不是只存在於記憶體中的用戶端狀態。 

這麼做有雙重動機：它為許多高度期待的 UI 功能/改善奠定基礎，也為更容易為 LiteLLM 貢獻、讓維護者更容易以人類可讀的方式審查程式碼奠定基礎。

其中最大的好處將會是能夠分享不同頁面的連結，例如特定 logs 頁面、teams 頁面等等。

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（6 個新提供者） {#new-providers-6-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| ModelScope (`modelscope`) | 聊天補全 | 與 OpenAI 相容的 ModelScope 託管模型提供者 - [PR #28460](https://github.com/BerriAI/litellm/pull/28460) |
| LibertAI (`libertai`) | Chat Completions, Embeddings | 以 JSON 設定的 OpenAI 相容提供者；提供 12 個目錄模型，包含 `bge-m3` embeddings - [PR #30203](https://github.com/BerriAI/litellm/pull/30203) |
| TinyFish (`tinyfish`) | 搜尋 | 網頁搜尋提供者 - [PR #30634](https://github.com/BerriAI/litellm/pull/30634) |
| FastCRW (`fastcrw`) | 搜尋 | 網頁搜尋提供者 - [PR #30434](https://github.com/BerriAI/litellm/pull/30434) |
| Parasail (`parasail`) | 聊天補全 | 與 OpenAI 相容的提供者 |
| Pinstripes (`pinstripes`) | 聊天補全 | 新的聊天提供者；提供 6 個目錄模型 |

### 新 LLM API 端點 {#new-llm-api-endpoints}

| 功能 | 說明 | 文件 |
| --- | --- | --- |
| 程式碼執行 (e2b) | 用於執行模型生成程式碼的新 sandbox / code-interpreter 基元 - [PR #30898](https://github.com/BerriAI/litellm/pull/30898) | [Sandbox](../../docs/sandbox) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（91 個新模型） {#new-model-support-91-new-models}

| 提供者 | 模型 | 上下文 | 輸入 ($/1M) | 輸出 ($/1M) | 功能 |
| --- | --- | --- | --- | --- | --- |
| Azure AI | `azure_ai/gpt-5.5` | 1,050,000 | $5 | $30 | reasoning, function calling, prompt caching, pdf, vision |
| Azure AI | `azure_ai/gpt-5.5-2026-04-23` | 1,050,000 | $5 | $30 | reasoning, function calling, prompt caching, pdf, vision |
| Azure AI | `azure_ai/deepseek-v4-flash` | 1,000,000 | $0.19 | $0.51 | reasoning, function calling |
| Azure AI | `azure_ai/deepseek-v4-pro` | 1,000,000 | $1.74 | $3.48 | reasoning, function calling |
| Azure AI | `azure_ai/deepseek-v3.1` | 131,072 | $1.23 | $4.94 | reasoning, function calling |
| Azure AI | `azure_ai/MAI-Image-2.5` | - | $5 | - | 影像生成 |
| Azure AI | `azure_ai/MAI-Image-2.5-Flash` | - | $1.75 | - | 影像生成 |
| Azure AI | `azure_ai/MAI-Image-2e` | - | $5 | - | 影像生成 |
| Azure | `azure/gpt-realtime-whisper` | - | - | - | 音訊轉錄 |
| OpenAI | `gpt-realtime-whisper` | - | - | - | 音訊轉錄 |
| DeepSeek | `deepseek-v4-flash` / `deepseek/deepseek-v4-flash` | 1,000,000 | $0.14 | $0.28 | function calling, prompt caching |
| DeepSeek | `deepseek-v4-pro` / `deepseek/deepseek-v4-pro` | 1,000,000 | $0.43 | $0.87 | function calling, prompt caching |
| Mistral | `mistral/mistral-medium-3-5` | 262,144 | $1.50 | $7.50 | function calling, vision |
| GitHub Copilot | `github_copilot/mai-code-1-flash` | 128,000 | $0.75 | $4.50 | 函式呼叫 |
| Fireworks AI | 24 models incl. `deepseek-v4-pro`, `glm-5p2`, `kimi-k2p6`/`kimi-k2p7-code`, `minimax-m3`, `qwen3p7-plus`, `gpt-oss-120b`/`gpt-oss-20b` | up to 1,048,576 | $0.07-$2.80 | $0.28-$8.80 | function calling, reasoning, vision |
| Bedrock Mantle | `bedrock_mantle/google.gemma-4-26b-a4b` / `gemma-4-31b` / `gemma-4-e2b` | 128k-256k | $0.04-$0.14 | $0.08-$0.40 | function calling, reasoning, vision |
| LibertAI | 12 models incl. `qwen3.6-35b-a3b(-thinking)`, `gemma-4-31b-it(-thinking)`, `deepseek-v4-flash`, `bge-m3` | up to 262,144 | $0.01-$0.25 | free-$1.75 | function calling, reasoning, vision, embedding |
| Pinstripes | 6 models incl. `ps/minimax-m2.7`, `ps/qwen3.6-35b-a3b`, `ps/glm-4.5-air`, `ps/deepseek-v4-flash` | up to 1,000,192 | $0.09-$0.30 | $0.20-$0.60 | function calling, reasoning |
| Scaleway | 17 models incl. `qwen3.5-397b-a17b`, `mistral-medium-3.5-128b`, `gemma-4-26b-a4b-it`, `gpt-oss-120b`, `whisper-large-v3` | up to 256,000 | free-$1.50 | free-$7.50 | function calling, reasoning, vision, audio, embedding |
| Tensormesh | 10 models incl. `Qwen3-Coder-480B-A35B-FP8`, `Qwen3.5-397B-A17B-FP8`, `Kimi-K2.6`, `DeepSeek-V4-Flash`, `gpt-oss-120b`/`gpt-oss-20b` | up to 262,144 | $0.07-$1.40 | $0.28-$4.40 | function calling, reasoning, prompt caching |
| Soniox | `soniox/stt-async-v5` | 8,000 | - | - | 音訊轉錄 |
| TinyFish | `tinyfish/search` | - | - | - | search |

這 91 個新項目也包含完整的 `fireworks_ai/accounts/...` 模型與 router 路徑。Claude Fable 5 已在 v1.89.0 發布，因此不計入此處。完整 diff：`model_prices_and_context_window.json`。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 顯示 compaction 使用迭代資料 - [PR #27065](https://github.com/BerriAI/litellm/pull/27065)
    - 提供 Anthropic 原生 `/v1/models` 供 Claude Code gateway 探索 - [PR #30273](https://github.com/BerriAI/litellm/pull/30273)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 將 reasoning `max` 層級對應到 `xhigh` - [PR #28881](https://github.com/BerriAI/litellm/pull/28881)
- **[Bedrock](../../docs/providers/bedrock)**
    - 在 AgentCore `InvokeAgentRuntime` 中可選擇性轉送多模態內容區塊 - [PR #28885](https://github.com/BerriAI/litellm/pull/28885)
    - 支援批次輸出檔案的檔案內容擷取 - [PR #30595](https://github.com/BerriAI/litellm/pull/30595)
    - 讓 Bedrock Mantle Responses routing 對每個模型採用資料驅動 - [PR #30700](https://github.com/BerriAI/litellm/pull/30700)
- **[DashScope](../../docs/providers/dashscope)**
    - 新增 Responses API 支援 - [PR #30286](https://github.com/BerriAI/litellm/pull/30286)
- **[OCI](../../docs/providers/oci)**
    - 讓 Cohere `{{trace}}` judges 可運作（tool 參數型別 + agentic tool-calling continuation）- [PR #30646](https://github.com/BerriAI/litellm/pull/30646)

#### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 `/v1/messages` 路徑上套用 `cache_control_injection_points` - [PR #30341](https://github.com/BerriAI/litellm/pull/30341)
    - 從 `/v1/messages` 回應中移除 LiteLLM 注入的 `total_tokens` - [PR #30382](https://github.com/BerriAI/litellm/pull/30382)
    - 將 cache_control 注入上限設為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
    - 在通用 OpenAI 用戶端的多輪重播中，移除孤立的 `server_tool_use` - [PR #30486](https://github.com/BerriAI/litellm/pull/30486)
    - 不要將工具 `type` 洩漏到 OpenAI function parameters schema 中 - [PR #30618](https://github.com/BerriAI/litellm/pull/30618)
- **[Bedrock](../../docs/providers/bedrock)**
    - 在 `/v1/messages` adapter 中為 ARN models 保留 `cache_control` - [PR #29823](https://github.com/BerriAI/litellm/pull/29823)
    - 處理 `/v1/messages` 上 messages array 內的 `role: "system"` - [PR #30443](https://github.com/BerriAI/litellm/pull/30443)
    - 為 Bedrock Mantle responses->chat tool calls 使用唯一的 function-call id - [PR #30426](https://github.com/BerriAI/litellm/pull/30426)
    - 為 Bedrock Mantle chat completions 驗證新增 SigV4 備援 - [PR #30714](https://github.com/BerriAI/litellm/pull/30714)
- **[Gemini / Vertex AI](../../docs/providers/gemini)**
    - 對 `cachedContents` host 使用 `get_vertex_base_url` - [PR #29707](https://github.com/BerriAI/litellm/pull/29707)
    - 緩衝原生 Gemini SSE frames - [PR #30225](https://github.com/BerriAI/litellm/pull/30225)
    - 將 Gemini upstream-error body code 429 對應為 `RateLimitError` - [PR #30417](https://github.com/BerriAI/litellm/pull/30417)
    - 確保檢查顯示 `gemini-3-flash-preview` 支援 `responseJsonSchema` - [PR #30696](https://github.com/BerriAI/litellm/pull/30696)
- **[OpenAI-compatible](../../docs/providers/openai_compatible)**
    - 為 OpenAI-compatible 自訂 endpoints 保留 `cache_control` - [PR #30387](https://github.com/BerriAI/litellm/pull/30387)
    - hosted_vllm: 移除 `thinking_blocks` 並將 list content 轉換為字串 - [PR #30475](https://github.com/BerriAI/litellm/pull/30475)
    - 不要在具有自訂 prefix 的 wildcard models 上堆疊 provider prefix - [PR #30360](https://github.com/BerriAI/litellm/pull/30360)
- **[WatsonX](../../docs/providers/watsonx)**
    - 為 WatsonX API 將字串 embedding input 包裝在 array 中 - [PR #30897](https://github.com/BerriAI/litellm/pull/30897)
- **價格／成本對照表**
    - 為 `deepseek-v4-flash`/`deepseek-v4-pro` 新增成本對應 - [PR #27056](https://github.com/BerriAI/litellm/pull/27056)
    - 將 `mistral-medium-3-5` 新增至成本對應 - [PR #29303](https://github.com/BerriAI/litellm/pull/29303)
    - 將 `azure_ai/gpt-5.5` 新增至 model cost map - [PR #30428](https://github.com/BerriAI/litellm/pull/30428)
    - 新增 GitHub Copilot MAI Code Flash 定價 - [PR #30415](https://github.com/BerriAI/litellm/pull/30415)
    - 將 Fireworks AI model registry 與目前的平台目錄同步 - [PR #30616](https://github.com/BerriAI/litellm/pull/30616)
    - 新增 `soniox/stt-async-v5` - [PR #30672](https://github.com/BerriAI/litellm/pull/30672)
    - 更正 `command-r7b-12-2024` 的輸入/輸出 token 成本對調 - [PR #30413](https://github.com/BerriAI/litellm/pull/30413)
    - 為 Anthropic Sonnet 4.5/4.6 新增 1h cache-write 成本 - [PR #30474](https://github.com/BerriAI/litellm/pull/30474)
    - 將 Volcengine (Doubao) tiered-pricing models 路由至 tiered cost handler - [PR #30357](https://github.com/BerriAI/litellm/pull/30357)；按數值排序 tiered thresholds - [PR #30375](https://github.com/BerriAI/litellm/pull/30375)；將 DashScope 明確的 `0.0` tier cost 視為真實價格 - [PR #30653](https://github.com/BerriAI/litellm/pull/30653)
    - 捨棄 `register_model` 中合成的零成本，以保留稀疏項目 - [PR #30201](https://github.com/BerriAI/litellm/pull/30201)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 將 `completed_response` 透過 `FallbackResponsesStreamWrapper` 傳遞，以進行串流 `/v1/responses` container ownership - [PR #30213](https://github.com/BerriAI/litellm/pull/30213)
- **[/v1/models](../../docs/proxy/model_management)**
    - 在 `/v1/models` 上顯示 `max_input_tokens`/`max_output_tokens` - [PR #30272](https://github.com/BerriAI/litellm/pull/30272)
    - 在 v1 model info 中包含 model group aliases - [PR #30626](https://github.com/BerriAI/litellm/pull/30626)
- **[Realtime](../../docs/realtime)**
    - 允許非管理員 virtual keys 呼叫 GA Realtime WebRTC HTTP routes - [PR #30089](https://github.com/BerriAI/litellm/pull/30089)
- **[Files](../../docs/files_endpoints)**
    - 附加既有的 OpenAI file ids - [PR #30628](https://github.com/BerriAI/litellm/pull/30628)

#### 錯誤 {#bugs}

- **一般**
    - Token counter：處理 Anthropic `tool_reference` blocks，以停止遺失的 spend logs - [PR #30302](https://github.com/BerriAI/litellm/pull/30302)
    - Streaming：保護 `raise_on_model_repetition` 免於空的 choices - [PR #30485](https://github.com/BerriAI/litellm/pull/30485)
    - Audio：不要以 `verbose_json` 覆寫明確的 `response_format` - [PR #30599](https://github.com/BerriAI/litellm/pull/30599)
    - 驗證 `/realtime/client_secrets` 中非轉錄 sessions 的已解析模型 - [PR #30710](https://github.com/BerriAI/litellm/pull/30710)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **App Router 遷移** - models - [PR #30677](https://github.com/BerriAI/litellm/pull/30677), teams - [PR #30343](https://github.com/BerriAI/litellm/pull/30343), users - [PR #30334](https://github.com/BerriAI/litellm/pull/30334), organizations - [PR #30336](https://github.com/BerriAI/litellm/pull/30336), api-keys - [PR #30699](https://github.com/BerriAI/litellm/pull/30699), usage report - [PR #30694](https://github.com/BerriAI/litellm/pull/30694), agents + router-settings - [PR #30323](https://github.com/BerriAI/litellm/pull/30323)
- **UI cleanup** - 移除無法抵達的 `/chat` 頁面 - [PR #30178](https://github.com/BerriAI/litellm/pull/30178)、失效的 UI components - [PR #30340](https://github.com/BerriAI/litellm/pull/30340)、孤立的 pass-through-settings route - [PR #30692](https://github.com/BerriAI/litellm/pull/30692)；移除產品內問卷與回饋提醒 - [PR #30773](https://github.com/BerriAI/litellm/pull/30773)
- **虛擬金鑰** - 在 `/key/info` 中顯示每個模型的 budget 使用量 - [PR #30394](https://github.com/BerriAI/litellm/pull/30394)；grace-period key rotation 在 401 時回傳 deprecated-key lookup 的結果 - [PR #30327](https://github.com/BerriAI/litellm/pull/30327)
- **Teams / Orgs** - 新增 `key_limit` query param 至 `/team/info` - [PR #30006](https://github.com/BerriAI/litellm/pull/30006)；在 `/v1/models` 中列出公開 team model names - [PR #30588](https://github.com/BerriAI/litellm/pull/30588)
- **Proxy CLI Auth** - 將 `verification_uri_complete` 新增至 CLI SSO device flow - [PR #30571](https://github.com/BerriAI/litellm/pull/30571)
- **Proxy** - 可設定的 response headers 與登入頁面提示 - [PR #30792](https://github.com/BerriAI/litellm/pull/30792)；在 env flag 後方將 `/ui/login` 上的 "Default Credentials" 提示設為閘道 - [PR #30234](https://github.com/BerriAI/litellm/pull/30234)

#### 錯誤 {#bugs-1}

- **存取控制 / 金鑰**
    - `/key/list` 現在預設採用精確的 `user_id`/`key_alias` 比對，防止跨使用者金鑰外洩 - [PR #30593](https://github.com/BerriAI/litellm/pull/30593)
    - 將 `/customer/daily/activity` 限制為僅管理員可用 - [PR #28849](https://github.com/BerriAI/litellm/pull/28849)
    - 當 UI 傳送自己的 `user_id` 時，`org_admin` 會看到所有組織團隊 - [PR #30247](https://github.com/BerriAI/litellm/pull/30247)
    - 允許內部角色存取向量儲存 CRUD 路由 - [PR #30503](https://github.com/BerriAI/litellm/pull/30503)
    - 僅在啟用 premium 中繼資料欄位時才要求 premium - [PR #30506](https://github.com/BerriAI/litellm/pull/30506)
    - 保護 `check_and_fix_namespace` 不受 `None` 金鑰影響 - [PR #30435](https://github.com/BerriAI/litellm/pull/30435)
    - 當 `custom_auth` 跳過 `common_checks` 強制執行時，在啟動時發出警告 - [PR #30665](https://github.com/BerriAI/litellm/pull/30665)
    - 從團隊 BYOK 部署解析 list-files 憑證 - [PR #30495](https://github.com/BerriAI/litellm/pull/30495)；在 `azure_ad_token` 與 `CredentialLiteLLMParams` 中保留 `/v1/files` + 批次 - [PR #30241](https://github.com/BerriAI/litellm/pull/30241)
    - 對不在成本對照表中的模型強制執行預算 - [PR #24949](https://github.com/BerriAI/litellm/pull/24949)
- **UI**
    - 停止 Virtual Keys 頁面的無限重新渲染迴圈 - [PR #30397](https://github.com/BerriAI/litellm/pull/30397)
    - 從 `useAuthorized` 取得 api-keys 身分，以避免顯示「User ID is not set」 - [PR #30903](https://github.com/BerriAI/litellm/pull/30903)
    - 在自訂 `server_root_path` 下正確顯示標誌 - [PR #31156](https://github.com/BerriAI/litellm/pull/31156)
    - 在刪除團隊對話框中警告團隊模型將被刪除 - [PR #29990](https://github.com/BerriAI/litellm/pull/29990)
    - 三個小修正 - Gemini `api_base`、憑證表單重設、Mode 徽章 - [PR #30419](https://github.com/BerriAI/litellm/pull/30419)
    - 將失效的 usage-guide 連結重新指向成本追蹤文件 - [PR #30859](https://github.com/BerriAI/litellm/pull/30859)
- **Proxy**
    - 支援 SMTP 隱式 SSL（465 埠） - [PR #30395](https://github.com/BerriAI/litellm/pull/30395)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/proxy/logging)**
    - 在 v2 中以與 v1 相同的標準發出六項 `gen_ai.client.*` 指標 - [PR #30326](https://github.com/BerriAI/litellm/pull/30326)
    - 單一 v2 記錄器擁有全域 provider；依 exporter 範圍限定租戶 OTLP 憑證 - [PR #30590](https://github.com/BerriAI/litellm/pull/30590)
    - 將 v2 gen_ai client 指標匯出到已設定的 meter provider - [PR #30549](https://github.com/BerriAI/litellm/pull/30549)
    - 在 v2 spans 上加上 `gen_ai.input/output.messages` - [PR #30548](https://github.com/BerriAI/litellm/pull/30548)
    - 使用 include/exclude 清單限制指標屬性的基數 - [PR #30257](https://github.com/BerriAI/litellm/pull/30257)
    - 在 v2 的標準 exception event 上記錄完整錯誤訊息 - [PR #30380](https://github.com/BerriAI/litellm/pull/30380)
    - 接受 v2 中的 `UPPER_SNAKE_CASE` `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` - [PR #30562](https://github.com/BerriAI/litellm/pull/30562)
- **一般**
    - 在支出記錄中，`ProxyException` 失敗時保留 `error_message` - [PR #30381](https://github.com/BerriAI/litellm/pull/30381)

### 防護欄 {#guardrails}

- **Cisco AI Defense** - 新整合 - [PR #28249](https://github.com/BerriAI/litellm/pull/28249)
- **Repello Argus** - 新整合 - [PR #30465](https://github.com/BerriAI/litellm/pull/30465)
- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)** - 新增缺少的 UK PII 實體類型 - [PR #30537](https://github.com/BerriAI/litellm/pull/30537)；當防護欄為 `logging_only` 時，不要遮罩即時請求 - [PR #30461](https://github.com/BerriAI/litellm/pull/30461)
- **AIM** - 當 AIM 封鎖請求時，回傳 400 而非 500 - [PR #30573](https://github.com/BerriAI/litellm/pull/30573)
- **一般**
    - 停止在每次輪詢時重新初始化 DB 防護欄 - [PR #30542](https://github.com/BerriAI/litellm/pull/30542)
    - 對模型層級防護欄只執行一次 `pre_call` hook - [PR #30543](https://github.com/BerriAI/litellm/pull/30543)
    - `disable_global_guardrails` 會覆寫團隊清單 - [PR #28563](https://github.com/BerriAI/litellm/pull/28563)
    - 在防護欄追蹤中顯示 OpenAI moderation `violation_categories` - [PR #30659](https://github.com/BerriAI/litellm/pull/30659)

### 機密管理器 {#secret-managers}

- **[AWS Secrets Manager](../../docs/secret)** - 跨區域複寫 - [PR #30368](https://github.com/BerriAI/litellm/pull/30368)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **服務等級定價** - 將 `service_tier` 後綴套用於超過門檻的快取費率，並在 `ModelInfo` 中顯示 priority+threshold 金鑰 - [PR #30450](https://github.com/BerriAI/litellm/pull/30450)；在成本追蹤中為 Anthropic 回應 `service_tier` 定價並顯示 - [PR #30558](https://github.com/BerriAI/litellm/pull/30558)；停止非字串 `service_tier` 悄悄略過成本追蹤 - [PR #30690](https://github.com/BerriAI/litellm/pull/30690), [PR #30706](https://github.com/BerriAI/litellm/pull/30706)
- **預算** - 當跨 pod 計數器過期時，根據具權威性的 DB 支出強制執行預算 - [PR #30684](https://github.com/BerriAI/litellm/pull/30684)；當請求在傳輸途中取消時釋放預算保留額度 - [PR #30522](https://github.com/BerriAI/litellm/pull/30522)；當 `budget_duration` 變更時重新計算 `budget_reset_at` - [PR #30555](https://github.com/BerriAI/litellm/pull/30555)
- **速率限制** - 防止內部 `parallel_request_limiter` 欄位洩漏到上游提供者 - [PR #30545](https://github.com/BerriAI/litellm/pull/30545)
- **支出準確性** - 在中斷的串流之失敗列上記錄部分支出 - [PR #30788](https://github.com/BerriAI/litellm/pull/30788)；回復中斷的 Anthropic 串流輸出 token - [PR #30787](https://github.com/BerriAI/litellm/pull/30787)；停止 Perplexity 在手動成本備援中對推理 token 進行雙重計費 - [PR #30488](https://github.com/BerriAI/litellm/pull/30488)；修正搭配 `ChatCompletionUsageBlock` 的快取 token 使用量 - [PR #30422](https://github.com/BerriAI/litellm/pull/30422)
- **用量彙總** - 在每個 flush 週期排空所有 daily-spend 批次 - [PR #30505](https://github.com/BerriAI/litellm/pull/30505)；在請求記錄中顯示 session-aggregate 成本與持續時間 - [PR #30507](https://github.com/BerriAI/litellm/pull/30507)；合併無支出金鑰的空值彙總 - [PR #29945](https://github.com/BerriAI/litellm/pull/29945)；移除 daily-activity 彙總中的時區日期展開 - [PR #29569](https://github.com/BerriAI/litellm/pull/29569)

## MCP 閘道 {#mcp-gateway}

- 透過 env vars 使 MCP gateway 名稱與描述可設定 - [PR #30473](https://github.com/BerriAI/litellm/pull/30473)
- 當範圍篩選器解析為沒有伺服器時，採取封閉失敗 - [PR #30353](https://github.com/BerriAI/litellm/pull/30353)
- 重新拋出，而不是悄悄丟棄 MCP 團隊權限 - [PR #30477](https://github.com/BerriAI/litellm/pull/30477)
- 移除委派 OAuth2 tool calls 上虛構的 401 span - [PR #30494](https://github.com/BerriAI/litellm/pull/30494)
- 使用上游 `resource_metadata` 向 delegate-auth OAuth servers 發出挑戰 - [PR #31255](https://github.com/BerriAI/litellm/pull/31255)
- 將 Linear MCP registry 項目預設為可串流 HTTP - [PR #30396](https://github.com/BerriAI/litellm/pull/30396)
- 在 semantic filter hook 中保留原生 tools - [PR #26650](https://github.com/BerriAI/litellm/pull/26650)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **串流連線衛生** - 在用戶端中斷連線時取消上游 Gemini 請求並釋放 httpx 連線 - [PR #30075](https://github.com/BerriAI/litellm/pull/30075); 在用戶端於串流中途中斷時關閉上游 LLM 串流 - [PR #30245](https://github.com/BerriAI/litellm/pull/30245); 在串流迭代異常結束時釋放 aiohttp 連線 - [PR #30271](https://github.com/BerriAI/litellm/pull/30271); 在 `ModifyResponseException` 串流透傳中對 `logging_obj` 使用 `e.request_data` - [PR #30800](https://github.com/BerriAI/litellm/pull/30800)
- **快取** - 新增 valkey-semantic 快取後端並修正 semantic-cache 作用域鍵 - [PR #30675](https://github.com/BerriAI/litellm/pull/30675); 在 GCS 快取 GET 路徑中對物件名稱進行 URL 編碼 - [PR #30378](https://github.com/BerriAI/litellm/pull/30378); 允許沒有 Redis 快取的 `use_redis_transaction_buffer` - [PR #28764](https://github.com/BerriAI/litellm/pull/28764)
- **路由 / 備援** - 解決模型別名上的 list-unhashable 當機問題 - [PR #30464](https://github.com/BerriAI/litellm/pull/30464); 在 upsert/delete 時清理 pattern_router 狀態 - [PR #29601](https://github.com/BerriAI/litellm/pull/29601); 在 SDK 備援回應中保留備援模型 - [PR #28260](https://github.com/BerriAI/litellm/pull/28260); 新增 `expose_router_debug_in_errors`（預設為 True）以遮罩內部 model_group/fallback 名稱 - [PR #30418](https://github.com/BerriAI/litellm/pull/30418)
- **啟動 / 工作程序** - 對非 PostgreSQL 的 `DATABASE_URL` 失敗即快速結束，而不是卡住 - [PR #30366](https://github.com/BerriAI/litellm/pull/30366); 新增 `--max_requests_before_restart_jitter` 以錯開工作程序重啟 - [PR #30601](https://github.com/BerriAI/litellm/pull/30601); 修正 IAM refresh-engine 監看程式競態條件 - [PR #30183](https://github.com/BerriAI/litellm/pull/30183); 透過匹配 `async_set_cache` JSON 編碼來釋放 cron pod-lock - [PR #30600](https://github.com/BerriAI/litellm/pull/30600)
- **健康檢查** - 修正 Bedrock embedding 健康檢查 - [PR #30583](https://github.com/BerriAI/litellm/pull/30583); 將健康檢查 `max_tokens` 預設值提高到 16，以符合 GPT-5 相容性 - [PR #30708](https://github.com/BerriAI/litellm/pull/30708), [PR #26610](https://github.com/BerriAI/litellm/pull/26610)
- **開發者體驗 / CI** - 約 30 個 PR 強化 lint 與 type-check 閘門（統一採用 basedpyright、移除 mypy、逐步提高任何規範的預算），一個 osv-scanner lockfile 工作流程、zizmor PR 閘門、以本機 fake-OpenAI 測試端點取代共用 mock、相依性升級，以及固定的建置工具鏈。

## 文件更新 {#documentation-updates}

- 新增 1-click AWS/GCP Terraform 部署按鈕並修正 README 部署按鈕渲染 - [PR #29879](https://github.com/BerriAI/litellm/pull/29879)
- 強化 `CLAUDE.md` 中的程式碼慣例 - [PR #30333](https://github.com/BerriAI/litellm/pull/30333)
- 釐清 PR 範本中 Linear 的部分 - [PR #30766](https://github.com/BerriAI/litellm/pull/30766)

## 新貢獻者 {#new-contributors}

@hannahmadison, @ayushh0110, @Dotify71, @munnr, @V-3604, @yrk111222, @Silvenga, @djmaze, @apshada, @HumphreySun98, @Harshxth, @tomoyat1, @S0ngRu1, @habonlaci, @moshemalawach, @nahrinoda, @Vedant-Agarwal, @lollinng, @anneheartrecord, @hdt12a1, @vineethsaivs, @krishvsoni, @rvishwas26, @santino18727-debug, @darktheorys, @songkuan-zheng, @Thijmen, @Kropiunig, @jay-tau, @KnyazSh, @koztkozt, @us, @Anuj7411, @zkryakgul, @lavish619, @EugeneLugovtsov, @Bochenski, @menardorama, @factnn, @semmons99, @nitishagar, @FadelT, @jho1-godaddy, @yucheng-berri, @ad1269, @shzdehmd, @vanika02, @Nithish-Yenaganti, @simantak-dabhade, @devYRPauli, @clpatterson, @tcconnally

## 完整變更記錄 {#full-changelog}

[`v1.89.0...v1.90.0`](https://github.com/BerriAI/litellm/compare/v1.89.0...v1.90.0)
