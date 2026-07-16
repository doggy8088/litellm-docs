---
title: "v1.83.10 - Claude Opus 4.7、Prompt Compression 與 Multi-Window Budgets"
slug: "v1-83-10"
date: 2026-04-27T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Ryan Crabbe
    title: Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/ryan-crabbe-0b9687214
    image_url: https://github.com/ryan-crabbe.png
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
  - name: Shivam Rawat
    title: Forward Deployed Engineer, LiteLLM
    url: https://linkedin.com/in/shivam-rawat-482937318
    image_url: https://github.com/shivamrawat1.png
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:main-v1.83.10-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.83.10
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **Claude Opus 4.7 首日支援** — Opus 4.7 於 [Anthropic](../../docs/providers/anthropic)、[Bedrock](../../docs/providers/bedrock)、[Vertex AI](../../docs/providers/vertex)、[Azure AI](../../docs/providers/azure_ai) 與 [Perplexity](../../docs/providers/perplexity) 均可使用，並支援 reasoning、vision、prompt caching、computer use 與 1M token context。
- **`litellm.compress()`** — [基於 BM25 且搭配檢索工具的 prompt 壓縮](../../docs/completion/prompt_compression)，可在長 context 進入模型前將其裁切。
- **多閾值預算警示** — [虛擬 key 可在多個可設定的支出閾值觸發警示](../../docs/proxy/alerting)（例如 50% / 80% / 95%），而不是只有單一 soft-budget 層級。
- **並行預算視窗** — [key 與 team 可同時執行多個預算期間（每日 + 每月）](../../docs/proxy/users)，每個期間都有自己的重設節奏。
- **每個 Team 的 Guardrail 退出選項** — [team 可在 team 設定中選擇退出特定全域 guardrail](../../docs/proxy/guardrails/quick_start)，無須變更設定檔。
- **PromptGuard Guardrail 整合** — [用於 prompt-injection 偵測的一等級 pre/post-call guardrail](../../docs/proxy/guardrails/promptguard)。
- **uv 套件封裝遷移** — [以 uv 取代 Poetry，涵蓋套件封裝、CI 與 Docker](../../docs/extras/code_quality)，以加快且可重現的建置。

---

## 破壞性變更 {#breaking-changes}

#### 除非 key/team 選擇加入，否則呼叫端提供的 `tags` 會被移除 {#caller-supplied-tags-are-stripped-unless-the-keyteam-opts-in}

- **變更內容：** 由呼叫端提供的標籤 — `metadata.tags`、`litellm_metadata.tags`、根層級 `tags`，以及 `x-litellm-tags` header — 會在 [基於標籤的路由](../../docs/proxy/tag_routing) 與 [基於標籤的支出歸屬](../../docs/proxy/cost_tracking#custom-tags) 執行前，從請求中移除，除非呼叫用 key 或其父層 team 帶有 `metadata.allow_client_tags: true`。在模型部署、key 中繼資料或 team 中繼資料上設定的標籤不受影響。每次移除時，proxy 都會記錄一行 `WARNING`：
  ```
  Stripped caller-supplied tags from metadata, tags (root): this key/team does not have `allow_client_tags: true` in its metadata. Set it to opt into client-supplied routing/budget tags.
  ```
  — [PR #25905](https://github.com/BerriAI/litellm/pull/25905)

- **受影響對象：** 任何仰賴用戶端在請求本文或 `x-litellm-tags` header 中傳入 `tags`，以進行基於標籤的成本追蹤、標籤預算或基於標籤路由的部署。升級後，這些標籤將靜默落入預設 bucket / 預設部署，而依標籤的支出報告將顯示為空白。

- **恢復先前行為：** 在受影響 key（或其所屬 team）的中繼資料中設定 `allow_client_tags: true`。任一旗標即可生效——只要該 key 或其父層 team 帶有此旗標，呼叫端提供的標籤就會通過。
  ```bash
  # Per key
  curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{"metadata": {"allow_client_tags": true}}'

  # Per team
  curl -L -X POST 'http://0.0.0.0:4000/team/new' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{"metadata": {"allow_client_tags": true}}'
  ```

  既有的 key/team 可透過 `/key/update` 或 `/team/update` 進行修補，並帶入相同的 `metadata` payload。

#### UI 或 API 中的 `os.environ/…` 值 {#osenviron-values-in-the-ui-or-api}

- **變更內容：** 像 `os.environ/OPENAI_API_KEY`（以及其他 `os.environ/…` 模式）這類值，當它們來自**請求提供**的欄位時，不再展開——包含 Admin UI 以及 UI 所呼叫的相同 proxy APIs。— [PR #25592](https://github.com/BerriAI/litellm/pull/25592)

- **受影響對象：** 任何在 UI 或 API 中輸入字面上的 `os.environ/SECRET_NAME` 字串，並預期 proxy 在執行時以主機環境變數代入的人。

- **替代做法：** 提供者 API 金鑰與類似機密應使用 [**Reusable Credentials**](../../docs/proxy/ui_credentials.md) 儲存，並附加至模型（例如透過 `litellm_credential_name`）。對於可觀測性回呼（Langfuse、LangSmith 等），請將 key 與 endpoint 設定在 proxy `config.yaml` 中，或設定在程序在啟動時讀取的環境變數中——不要作為每個請求中中繼資料內的 `os.environ/…` 字串。

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（10 個新模型） {#new-model-support-10-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Anthropic | `claude-opus-4-7`, `claude-opus-4-7-20260416` | 1M | $5.00 | $25.00 | Chat、reasoning、vision、computer use、prompt caching、PDF input、xhigh reasoning effort |
| AWS Bedrock | `anthropic.claude-opus-4-7`, `us.anthropic.claude-opus-4-7`, `eu.anthropic.claude-opus-4-7`, `au.anthropic.claude-opus-4-7`, `global.anthropic.claude-opus-4-7` | 1M | $5.50 | $27.50 | Chat、reasoning、vision、computer use、prompt caching、PDF input、native structured output |
| Vertex AI | `vertex_ai/claude-opus-4-7`, `vertex_ai/claude-opus-4-7@default` | 1M | $5.00 | $25.00 | Chat、reasoning、vision、computer use、prompt caching、PDF input |
| Azure AI | `azure_ai/claude-opus-4-7` | 200K | $5.00 | $25.00 | Chat、reasoning、vision、computer use、prompt caching、PDF input |
| Perplexity | `perplexity/anthropic/claude-opus-4-7` | - | - | - | Web search、function calling（Responses mode） |
| Google Gemini | `gemini/veo-3.1-lite-generate-preview` | 1024 | - | $0.05 / sec | 影片生成預覽 |
| OpenRouter | `openrouter/google/gemini-3.1-flash-lite-preview` | 1.05M | $0.25 | $1.50 | Chat、code execution、file search、function calling、prompt caching、reasoning、web search、vision、video/audio/PDF input |
| xAI | `xai/grok-4.20-0309-reasoning` | 2M | $2.00 | $6.00 | Function calling、reasoning、tool choice、vision、web search |
| W&B Inference | `wandb/MiniMaxAI/MiniMax-M2.5` | 197K | $0.30 | $1.20 | Function calling、reasoning、response schema |
| W&B Inference | `wandb/moonshotai/Kimi-K2.5` | 262K | $0.60 | $3.00 | Function calling、reasoning、response schema、vision |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - Claude Opus 4.7 於 Anthropic native、Bedrock、Vertex AI、Azure AI 與 Perplexity 的首日支援 - [PR #25867](https://github.com/BerriAI/litellm/pull/25867)
    - Opus 4.7 routing/version-string 處理的 hotfix 後續修正 - [PR #25875](https://github.com/BerriAI/litellm/pull/25875)、[PR #25876](https://github.com/BerriAI/litellm/pull/25876)
    - 在無效 thinking signature 錯誤後重試 `/v1/messages` - [PR #25674](https://github.com/BerriAI/litellm/pull/25674)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 標準化 Invoke 與 Converse APIs 的自訂工具 JSON schema - [PR #25396](https://github.com/BerriAI/litellm/pull/25396)
    - Bedrock API 回應 null 型別處理 - [PR #25810](https://github.com/BerriAI/litellm/pull/25810)、[PR #24147](https://github.com/BerriAI/litellm/pull/24147)
    - 防止僅起始快取使用產生負的串流成本 - [PR #25846](https://github.com/BerriAI/litellm/pull/25846)
    - 在 UI 與 SpendLogs 中準確顯示快取 token 成本拆分 - [PR #25735](https://github.com/BerriAI/litellm/pull/25735)
    - 移除 Bedrock 測試檔案中未解決的合併衝突標記 - [PR #25995](https://github.com/BerriAI/litellm/pull/25995)
    - 以請求本文 mock 取代不穩定的 Bedrock gpt-oss tool-call live test - [PR #25739](https://github.com/BerriAI/litellm/pull/25739)
    - Mock Bedrock Moonshot tests + 修正 `TogetherAIConfig` 遞迴 - [PR #25920](https://github.com/BerriAI/litellm/pull/25920)
    - 移除已無作用的 Bedrock `clear_thinking` interleaved-thinking-beta 斷言 - [PR #25913](https://github.com/BerriAI/litellm/pull/25913)

- **[Google Vertex AI](../../docs/providers/vertex)**
    - 透過 `map_finish_reason` 標準化 Gemini `finish_reason` enum - [PR #25337](https://github.com/BerriAI/litellm/pull/25337)
    - 為 `vertex_ai/qwen3-235b-a22b-instruct-2507-maas` 新增 `us-south1` 區域 - [PR #25382](https://github.com/BerriAI/litellm/pull/25382)
    - 新增 `vertex_ai/claude-opus-4-7` 與 `vertex_ai/claude-opus-4-7@default` 成本對映項目 - 成本對映

- **[Google Gemini](../../docs/providers/gemini)**
    - Veo 3.1 Lite 的定價、影片解析度用量，以及分級成本追蹤 - [PR #25348](https://github.com/BerriAI/litellm/pull/25348)

- **[Azure AI](../../docs/providers/azure_ai)**
    - 新增 `azure_ai/claude-opus-4-7` 成本對應條目 - 成本對應
    - 透過 logging hook 為 Azure passthrough 填入 `standard_logging_object` - [PR #25679](https://github.com/BerriAI/litellm/pull/25679)

- **[OpenAI](../../docs/providers/openai)**
    - 省略 OpenAI embedding 請求中的空值 `encoding_format` - [PR #25395](https://github.com/BerriAI/litellm/pull/25395)（之後在 [PR #25698](https://github.com/BerriAI/litellm/pull/25698) 中回復 — 請見 Bug Fixes）

- **[xAI](../../docs/providers/xai)**
    - 新增 `xai/grok-4.20-0309-reasoning` 成本對應條目 - [PR #25930](https://github.com/BerriAI/litellm/pull/25930)

- **[Together AI](../../docs/providers/togetherai)**
    - 在 `get_model_info` 中公開 reasoning effort 欄位，並新增 `together_ai/gpt-oss-120b` - [PR #25263](https://github.com/BerriAI/litellm/pull/25263)
    - 在測試中以無伺服器的 Qwen3.5-9B 取代已淘汰的 Mixtral - [PR #25728](https://github.com/BerriAI/litellm/pull/25728)

- **[DashScope](../../docs/providers/dashscope)**
    - 為明確的 prompt caching 保留 `cache_control` - [PR #25331](https://github.com/BerriAI/litellm/pull/25331)

- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 允許覆寫預設的 GitHub Copilot 驗證端點 - [PR #25915](https://github.com/BerriAI/litellm/pull/25915)

- **[W&B Inference](../../docs/providers/wandb_inference)**
    - 新增 Kimi-K2.5 和 MiniMax-M2.5 成本對應條目 - [PR #25409](https://github.com/BerriAI/litellm/pull/25409)

### Bug 修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 回傳來自 `/v1/messages/count_tokens` 的實際上游狀態碼，而非一律 200 - [PR #21352](https://github.com/BerriAI/litellm/pull/21352)

- **[Vertex AI](../../docs/providers/vertex)**
    - Gemini `finish_reason` enum 正規化（請見上方 Features）- [PR #25337](https://github.com/BerriAI/litellm/pull/25337)

- **[Embeddings API](../../docs/embedding/supported_embedding)**
    - 在下游回歸之後，回復對空值 `encoding_format` 的省略 - [PR #25698](https://github.com/BerriAI/litellm/pull/25698)

- **一般**
    - 修正文件橫幅中顯示的 `version` - [PR #25875](https://github.com/BerriAI/litellm/pull/25875)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 將 Responses API 參數新增至 cache key allow-list - [PR #25673](https://github.com/BerriAI/litellm/pull/25673)

- **[OCR API](../../docs/ocr)**
    - 透過 Azure DI analyze 查詢字串提供 Mistral 風格的 `pages` 參數 - [PR #25929](https://github.com/BerriAI/litellm/pull/25929)
    - 將缺少的 Mistral OCR 參數新增至 allowlist - [PR #25858](https://github.com/BerriAI/litellm/pull/25858)

- **[Embeddings API](../../docs/embedding/supported_embedding)**
    - OpenAI 對空值的 `encoding_format` 處理（初始修正之後又回復）- [PR #25395](https://github.com/BerriAI/litellm/pull/25395), [PR #25698](https://github.com/BerriAI/litellm/pull/25698)

- **[Anthropic Messages](../../docs/anthropic_unified/)**
    - 在無效的 thinking signature 時重試 - [PR #25674](https://github.com/BerriAI/litellm/pull/25674)
    - 在 `count_tokens` 上游錯誤時回傳實際狀態碼 - [PR #21352](https://github.com/BerriAI/litellm/pull/21352)

- **[Pass-Through Endpoints](../../docs/pass_through/intro)**
    - 為 Azure passthrough 填入 `standard_logging_object` - [PR #25679](https://github.com/BerriAI/litellm/pull/25679)
    - 限制 `x-pass-` 標頭轉送，適用於憑證與通訊協定標頭 - [PR #25916](https://github.com/BerriAI/litellm/pull/25916)

- **[Video Generation](../../docs/proxy/veo_video_generation)**
    - Veo 3.1 Lite 感知解析度的分級成本追蹤 - [PR #25348](https://github.com/BerriAI/litellm/pull/25348)

- **一般 — `litellm.compress()`**
    - 新的基於 BM25 的 [prompt 壓縮 API](../../docs/completion/prompt_compression) 搭配 retrieval 工具，透過 `litellm.compress()` 公開，用於在模型呼叫前截短長 prompt - [PR #25637](https://github.com/BerriAI/litellm/pull/25637)

#### 錯誤 {#bugs}

- **一般**
    - 在憑證驗證中收緊 `api_key` 值檢查 - [PR #25917](https://github.com/BerriAI/litellm/pull/25917)
    - 收緊請求參數中的環境參照處理 - [PR #25592](https://github.com/BerriAI/litellm/pull/25592)
    - 強化請求參數處理 - [PR #25827](https://github.com/BerriAI/litellm/pull/25827)
    - 新增共用路徑工具並防止目錄遍歷 - [PR #25834](https://github.com/BerriAI/litellm/pull/25834)
    - 為使用者提供的 URL 新增 URL 驗證 - [PR #25906](https://github.com/BerriAI/litellm/pull/25906)
    - 從管理中繼資料讀取 guardrail 設定；修正標籤路由一致性 - [PR #25905](https://github.com/BerriAI/litellm/pull/25905)
    - 在管理操作中強制執行組織邊界 - [PR #25904](https://github.com/BerriAI/litellm/pull/25904)
    - 解決 `prometheus_helpers` 檔案/套件遮蔽，避免破壞 `/global/spend/logs` - [PR #26026](https://github.com/BerriAI/litellm/pull/26026)
    - 強化 CORS 憑證、`create_views` 例外處理，以及 spend-log 清理迴圈 - [PR #25559](https://github.com/BerriAI/litellm/pull/25559)
    - 防止 API 金鑰外洩於錯誤追蹤回溯、記錄與警示中 - [PR #25117](https://github.com/BerriAI/litellm/pull/25117)
    - 移除 license `public_key.pem` 前導空白 - [PR #25339](https://github.com/BerriAI/litellm/pull/25339)
    - 快取失效：停止在大量更新與金鑰輪替中對 token 進行雙重雜湊 - [PR #25552](https://github.com/BerriAI/litellm/pull/25552)
    - `model_max_budget` 對已路由模型靜默失效 - [PR #25549](https://github.com/BerriAI/litellm/pull/25549)
    - 升級 25 個由 dependabot 回報的脆弱相依套件中的 22 個 - [PR #25442](https://github.com/BerriAI/litellm/pull/25442)
    - 修正 `multiple values` 在 `TypeError` 中的 `get_cache_key` - [PR #20261](https://github.com/BerriAI/litellm/pull/20261)
    - S3v2：對 SigV4 簽署的 S3 請求使用已準備好的 URL - [PR #25074](https://github.com/BerriAI/litellm/pull/25074)
    - 健康檢查 reasoning-token 與 max-token 的優先順序 - [PR #25936](https://github.com/BerriAI/litellm/pull/25936)
    - `BACKGROUND_HEALTH_CHECK_MAX_TOKENS` 環境變數 - [PR #25344](https://github.com/BerriAI/litellm/pull/25344)
    - 批次限制過時的受管理物件清理，以避免 30 萬列 UPDATE - [PR #25227](https://github.com/BerriAI/litellm/pull/25227)
    - 保留 `StandardLoggingPayload` 中的提供者回應標頭 - [PR #25807](https://github.com/BerriAI/litellm/pull/25807)
    - 最佳化 DB 查詢，以防健康檢查期間發生 OOM - [PR #25732](https://github.com/BerriAI/litellm/pull/25732)
    - `PodLockManager.release_lock` 原子式 compare-and-delete（重新納入 #21226）- [PR #24466](https://github.com/BerriAI/litellm/pull/24466)
    - `routing_strategy_args` 在策略不是基於延遲時回傳 `None` - [PR #25882](https://github.com/BerriAI/litellm/pull/25882)
    - `is_tool_name_prefixed` 針對已知 MCP 伺服器前綴進行驗證 - [PR #25085](https://github.com/BerriAI/litellm/pull/25085)
    - 在重新啟動之間保留預設 router 終止預算 - [PR #25991](https://github.com/BerriAI/litellm/pull/25991)
    - 在 team 範圍的金鑰管理檢查中強制執行團隊成員資格 - [PR #25686](https://github.com/BerriAI/litellm/pull/25686)
    - 代理程式端點與路由權限檢查 - [PR #25922](https://github.com/BerriAI/litellm/pull/25922)
    - Prometheus metrics 的 JWT 驗證 `key_alias=user_id` — 初始修正與回復 - [PR #25340](https://github.com/BerriAI/litellm/pull/25340), [PR #25438](https://github.com/BerriAI/litellm/pull/25438)
    - 將 post-custom-auth DB 查詢設為需 opt-in 的旗標後才執行 - [PR #25634](https://github.com/BerriAI/litellm/pull/25634)
    - 對齊使用者與金鑰更新端點中的欄位層級檢查 - [PR #25541](https://github.com/BerriAI/litellm/pull/25541)
    - 與使用者範圍一致的 `/spend/logs` 篩選處理 - [PR #25594](https://github.com/BerriAI/litellm/pull/25594)
    - 以 RestrictedPython 取代 `custom_code` guardrail 沙箱 - [PR #25818](https://github.com/BerriAI/litellm/pull/25818)
    - Presidio：在 `anonymize_text` 中使用正確的文字位置 - [PR #24998](https://github.com/BerriAI/litellm/pull/24998)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 可設定多門檻預算警示（例如 50% / 80% / 95%）- [PR #25989](https://github.com/BerriAI/litellm/pull/25989)
    - 每個 API 金鑰與團隊可同時存在多個預算視窗（`#24883`）- [PR #25109](https://github.com/BerriAI/litellm/pull/25109)
    - 每成員模型範圍 + 團隊 `default_team_member_models` - [PR #24950](https://github.com/BerriAI/litellm/pull/24950)
    - 將重新產生金鑰的 modal 移轉至 AntD - [PR #25406](https://github.com/BerriAI/litellm/pull/25406)
    - 從金鑰更新負載中移除空白的 premium 欄位 - [PR #26023](https://github.com/BerriAI/litellm/pull/26023)
    - 預設邀請使用者 modal 的全域角色為最小權限 - [PR #25721](https://github.com/BerriAI/litellm/pull/25721)

- **團隊**
    - 允許在建立團隊後編輯路由設定 - [PR #25398](https://github.com/BerriAI/litellm/pull/25398)
    - 針對特定全域防護欄提供每個團隊的退出選項 - [PR #25575](https://github.com/BerriAI/litellm/pull/25575)
    - 已刪除的金鑰／團隊顯示企業提示橫幅 - [PR #25814](https://github.com/BerriAI/litellm/pull/25814)
    - 在團隊變更後使組織查詢失效 - [PR #25812](https://github.com/BerriAI/litellm/pull/25812)
    - 編輯團隊模型 TPM/RPM 限制的 E2E 測試 - [PR #25658](https://github.com/BerriAI/litellm/pull/25658)

- **模型 + 端點**
    - UI 設定中支援 Claude Code BYOK - [PR #25998](https://github.com/BerriAI/litellm/pull/25998)
    - Add Model 流程的 E2E 測試 - [PR #25590](https://github.com/BerriAI/litellm/pull/25590)
    - 為布林值防護欄提供者欄位預先選取後端預設值 - [PR #25700](https://github.com/BerriAI/litellm/pull/25700)
    - 在 `Select` 中呈現防護欄 `optional_params` 布林預設值 - [PR #25806](https://github.com/BerriAI/litellm/pull/25806)
    - MCP `ToolTestPanel` 布林輸入改用 AntD `Select` - [PR #25809](https://github.com/BerriAI/litellm/pull/25809)
    - 在 MCP 伺服器編輯時保留 `extra_headers` - [PR #26003](https://github.com/BerriAI/litellm/pull/26003)
    - 將 Guardrail Test Playground 從 `@tremor/react` 移轉到 AntD - [PR #25749](https://github.com/BerriAI/litellm/pull/25749)
    - 將 router_settings 頁面從 Tremor 移轉到 AntD - [PR #25879](https://github.com/BerriAI/litellm/pull/25879)
    - 減少 Guardrails Monitor 版面配置中的 Tremor 使用量 - [PR #25803](https://github.com/BerriAI/litellm/pull/25803)
    - 從 Swagger 文件訊息中移除 Chat UI 連結 - [PR #25727](https://github.com/BerriAI/litellm/pull/25727)
    - 透過受控對話框刪除 policy 附件 - [PR #25324](https://github.com/BerriAI/litellm/pull/25324)

- **驗證 / SSO**
    - 解決反向代理將 `HttpOnly` 加入 cookie 時的登入重新導向迴圈 - [PR #23532](https://github.com/BerriAI/litellm/pull/23532)
    - 將自訂驗證後的資料庫查詢置於 opt-in 標記之後 - [PR #25634](https://github.com/BerriAI/litellm/pull/25634)

- **記錄 / 活動**
    - 將 logs 團隊篩選下拉選單與根層級 teams 狀態隔離，避免狀態外洩 - [PR #25716](https://github.com/BerriAI/litellm/pull/25716)
    - 將 `/spend/logs` 篩選處理與使用者範圍一致化 - [PR #25594](https://github.com/BerriAI/litellm/pull/25594)

- **Helm**
    - 將 `tpl` 支援加入 `extraContainers` 與 `extraInitContainers` - [PR #25494](https://github.com/BerriAI/litellm/pull/25494)

#### 錯誤 {#bugs-1}

- 從金鑰更新負載中移除空的 premium 欄位 - [PR #26023](https://github.com/BerriAI/litellm/pull/26023)
- 收緊憑證驗證中的 `api_key` 值檢查 - [PR #25917](https://github.com/BerriAI/litellm/pull/25917)
- `extra_headers` 未在 MCP 伺服器編輯時持久化 - [PR #26003](https://github.com/BerriAI/litellm/pull/26003)
- logs 團隊篩選下拉選單外洩 - [PR #25716](https://github.com/BerriAI/litellm/pull/25716)
- 在 `user_dashboard` 測試中的 `cookieUtils` 模擬物件加入 `getCookie` - [PR #25719](https://github.com/BerriAI/litellm/pull/25719)
- 移除已棄用的 `tests/ui_e2e_tests/` 測試套件 - [PR #25657](https://github.com/BerriAI/litellm/pull/25657)
- 限制 `x-pass-` 標頭轉送 - [PR #25916](https://github.com/BerriAI/litellm/pull/25916)
- Blog 深色模式文字在深色背景上無法顯示 - [PR #25620](https://github.com/BerriAI/litellm/pull/25620)
- 預設邀請使用者角色為最小權限 - [PR #25721](https://github.com/BerriAI/litellm/pull/25721)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 新增 7m 和 10m 延遲 histogram bucket - [PR #25071](https://github.com/BerriAI/litellm/pull/25071)
    - Prometheus exporter 的效能改善 - [PR #25934](https://github.com/BerriAI/litellm/pull/25934)
    - 解決 `prometheus_helpers` 檔案／套件 shadow 導致 `/global/spend/logs` 中斷 - [PR #26026](https://github.com/BerriAI/litellm/pull/26026)

- **[Azure Pass-Through](../../docs/pass_through/azure_passthrough)**
    - 透過 logging hook 填入 `standard_logging_object` - [PR #25679](https://github.com/BerriAI/litellm/pull/25679)

- **一般**
    - 在 `StandardLoggingPayload` 中保留提供者回應標頭 - [PR #25807](https://github.com/BerriAI/litellm/pull/25807)

### 防護欄 {#guardrails}

- **[PromptGuard](../../docs/proxy/guardrails/promptguard)**
    - 用於提示注入偵測的新 PromptGuard 防護欄整合 - [PR #24268](https://github.com/BerriAI/litellm/pull/24268)

- **[自訂程式碼防護欄](../../docs/proxy/guardrails/custom_guardrail)**
    - 將 `custom_code` sandbox 取代為 RestrictedPython - [PR #25818](https://github.com/BerriAI/litellm/pull/25818)

- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 在 `anonymize_text` 中使用正確的文字位置 - [PR #24998](https://github.com/BerriAI/litellm/pull/24998)

- **一般**
    - 針對特定全域防護欄提供每個團隊的退出選項 - [PR #25575](https://github.com/BerriAI/litellm/pull/25575)
    - UI：為布林值防護欄提供者欄位預先選取後端預設值 - [PR #25700](https://github.com/BerriAI/litellm/pull/25700)
    - UI：在 `Select` 中呈現防護欄 `optional_params` 布林預設值 - [PR #25806](https://github.com/BerriAI/litellm/pull/25806)
    - 從管理員中繼資料讀取防護欄設定，並修正標籤路由一致性 - [PR #25905](https://github.com/BerriAI/litellm/pull/25905)

### 快取 {#caching}

- 將 Responses API 參數加入快取金鑰允許清單 - [PR #25673](https://github.com/BerriAI/litellm/pull/25673)
- 防止 `multiple values` `TypeError` 於 `get_cache_key` 中發生 - [PR #20261](https://github.com/BerriAI/litellm/pull/20261)
- S3v2：對 SigV4 簽章的 S3 請求使用已準備的 URL - [PR #25074](https://github.com/BerriAI/litellm/pull/25074)

### 提示管理 / 壓縮 {#prompt-management--compression}

- 以檢索工具推出新的 `litellm.compress()`、基於 BM25 的 [prompt compression API](../../docs/completion/prompt_compression) - [PR #25637](https://github.com/BerriAI/litellm/pull/25637)

### 密鑰管理器 {#secret-managers}

- 此版本沒有新增密鑰管理器提供者。

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 虛擬金鑰可設定多門檻預算警示（例如 50% / 80% / 95%） - [PR #25989](https://github.com/BerriAI/litellm/pull/25989)
- API 金鑰與團隊的多個並行預算視窗（`#24883`） - [PR #25109](https://github.com/BerriAI/litellm/pull/25109)
- Bedrock/Anthropic 在 UI 與 SpendLogs 中的快取 token 成本明細更精確 - [PR #25735](https://github.com/BerriAI/litellm/pull/25735)
- Bedrock：防止僅起始快取用量產生負值串流成本 - [PR #25846](https://github.com/BerriAI/litellm/pull/25846)
- 修正虛擬金鑰預估支出軟性預算警示 - [PR #25838](https://github.com/BerriAI/litellm/pull/25838)
- 在並行請求限制器中強制執行專案層級、模型特定的速率限制 - [PR #25994](https://github.com/BerriAI/litellm/pull/25994)
- 重新啟動後保留預設路由器 end-budget - [PR #25991](https://github.com/BerriAI/litellm/pull/25991)
- 將舊版實體（Team Members、End Users）的重設時間與標準化行事曆對齊 - [PR #25440](https://github.com/BerriAI/litellm/pull/25440)
- 批次限制過期 managed-object 清理，以避免 30 萬列 UPDATE - [PR #25227](https://github.com/BerriAI/litellm/pull/25227)
- 快取失效：停止在批次更新與金鑰輪替中對 token 進行雙重雜湊 - [PR #25552](https://github.com/BerriAI/litellm/pull/25552)
- `model_max_budget` 對已路由模型悄然失效 - [PR #25549](https://github.com/BerriAI/litellm/pull/25549)
- 在 `get_model_info` 中公開 reasoning-effort 欄位（並將 `together_ai/gpt-oss-120b` 加入成本對照表） - [PR #25263](https://github.com/BerriAI/litellm/pull/25263)
- Veo 3.1 Lite 具解析度感知的分級成本追蹤 - [PR #25348](https://github.com/BerriAI/litellm/pull/25348)
- 為 Vertex `qwen3-235b-a22b-instruct-2507-maas` 成本對照表新增 `us-south1` 區域 - [PR #25382](https://github.com/BerriAI/litellm/pull/25382)

## MCP 閘道 {#mcp-gateway}

- 根據已知 MCP server 前綴集合驗證 `is_tool_name_prefixed` - [PR #25085](https://github.com/BerriAI/litellm/pull/25085)
- 在未儲存的每位使用者 token 不存在時，恢復觸發 PKCE 的 401 - [PR #26032](https://github.com/BerriAI/litellm/pull/26032)
- 從 MCP 閘道公開每個伺服器的 `InitializeResult.instructions` - [PR #25694](https://github.com/BerriAI/litellm/pull/25694)
- 將共用 PKCE 輔助函式抽出至 `utils/pkce.ts` - [PR #25878](https://github.com/BerriAI/litellm/pull/25878)
- UI：MCP `ToolTestPanel` 布林輸入改用 AntD `Select` - [PR #25809](https://github.com/BerriAI/litellm/pull/25809)
- UI：在 MCP 伺服器編輯時保留 `extra_headers` - [PR #26003](https://github.com/BerriAI/litellm/pull/26003)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- Prometheus 匯出器效能改善 - [PR #25934](https://github.com/BerriAI/litellm/pull/25934)
- 最佳化 DB 查詢以防止健康檢查期間發生 OOM - [PR #25732](https://github.com/BerriAI/litellm/pull/25732)
- `PodLockManager.release_lock` 原子比較並刪除（#21226 的重新上線） - [PR #24466](https://github.com/BerriAI/litellm/pull/24466)
- 健康檢查 reasoning-token max-token 優先順序 - [PR #25936](https://github.com/BerriAI/litellm/pull/25936)
- 新的 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS` 環境變數 - [PR #25344](https://github.com/BerriAI/litellm/pull/25344)
- 當策略不是以延遲為基礎時，回傳 `None` 給 `routing_strategy_args` - [PR #25882](https://github.com/BerriAI/litellm/pull/25882)
- 提升 proxy 相依性；將最低 Python 版本提高至 3.10 - [PR #26022](https://github.com/BerriAI/litellm/pull/26022)
- 升級 25 個由 dependabot 回報的脆弱相依性中的 22 個 - [PR #25442](https://github.com/BerriAI/litellm/pull/25442)
- 將 packaging、CI 與 Docker 從 Poetry 遷移至 uv - [PR #25007](https://github.com/BerriAI/litellm/pull/25007)
- `[Infra]` 將 `llm_translation_testing` 資源類別提升至 `xlarge`，並容忍 worker 重新啟動 - [PR #25887](https://github.com/BerriAI/litellm/pull/25887), [PR #25898](https://github.com/BerriAI/litellm/pull/25898)
- `[Infra]` 擴充非 `main` PR 目標的 CI 分支篩選條件 - [PR #25819](https://github.com/BerriAI/litellm/pull/25819)
- `[Infra]` 限制 `main` 只接受來自 staging 與 hotfix 分支的 PR - [PR #25733](https://github.com/BerriAI/litellm/pull/25733)
- `[Infra]` 從 CircleCI 設定中移除未使用的 `publish_proxy_extras` 與 `prisma_schema_sync` 工作 - [PR #25821](https://github.com/BerriAI/litellm/pull/25821)
- `fix(ci)`：將 `test-server-root-path` 逾時時間提高至 30m - [PR #25741](https://github.com/BerriAI/litellm/pull/25741)
- 從 coverage combine 中移除不存在的 `litellm_mcps_tests_coverage` - [PR #25737](https://github.com/BerriAI/litellm/pull/25737)
- Helm：為 `extraContainers` / `extraInitContainers` 新增 `tpl` 支援 - [PR #25494](https://github.com/BerriAI/litellm/pull/25494)
- 非 Anthropic 提供者的 Advisor 工具協調迴圈 - [PR #25579](https://github.com/BerriAI/litellm/pull/25579)

## 文件更新 {#documentation-updates}

- 成本差異疑難排解指南 - [PR #25622](https://github.com/BerriAI/litellm/pull/25622)
- 第 2 週上手檢查清單 - [PR #25452](https://github.com/BerriAI/litellm/pull/25452)
- 在文件網站新增「將頁面複製為 Markdown」+ `llms.txt` - [PR #25975](https://github.com/BerriAI/litellm/pull/25975)
- Trivy 事件修復的文件公告列 - [PR #25870](https://github.com/BerriAI/litellm/pull/25870)
- 將 docs.litellm.ai/blog 重新設計為工程部落格風格 - [PR #25580](https://github.com/BerriAI/litellm/pull/25580)
- Ramp 風格工程部落格重新設計 + Redis circuit breaker 文章 - [PR #25583](https://github.com/BerriAI/litellm/pull/25583)
- 為部落格文章頁面新增返回箭頭 - [PR #25587](https://github.com/BerriAI/litellm/pull/25587)
- 備援圖片 - [PR #25731](https://github.com/BerriAI/litellm/pull/25731)
- 一般文件更新 - [PR #25736](https://github.com/BerriAI/litellm/pull/25736)
- 補上 v1.83.3-stable 與 v1.83.7.rc.1 的版本更新說明 - [PR #25723](https://github.com/BerriAI/litellm/pull/25723), [PR #25726](https://github.com/BerriAI/litellm/pull/25726)
- 修正文件中顯示的版本 - [PR #25875](https://github.com/BerriAI/litellm/pull/25875)

## 新貢獻者 {#new-contributors}

* @hunterchris 首次貢獻於 https://github.com/BerriAI/litellm/pull/20261
* @Dmitry-Kucher 首次貢獻於 https://github.com/BerriAI/litellm/pull/24998
* @kulia26 首次貢獻於 https://github.com/BerriAI/litellm/pull/25071
* @jaxhend 首次貢獻於 https://github.com/BerriAI/litellm/pull/23532
* @abhyudayareddy 首次貢獻於 https://github.com/BerriAI/litellm/pull/25337
* @avarga1 首次貢獻於 https://github.com/BerriAI/litellm/pull/25263
* @acebot712 首次貢獻於 https://github.com/BerriAI/litellm/pull/24268
* @meutsabdahal 首次貢獻於 https://github.com/BerriAI/litellm/pull/25395
* @shreyescodes 首次貢獻於 https://github.com/BerriAI/litellm/pull/25559
* @Lucas-Song-Dev 首次貢獻於 https://github.com/BerriAI/litellm/pull/25324
* @steromano87 首次貢獻於 https://github.com/BerriAI/litellm/pull/25915
* @jlav 首次貢獻於 https://github.com/BerriAI/litellm/pull/25494

**完整更新記錄**：https://github.com/BerriAI/litellm/compare/v1.83.7-stable...v1.83.10-stable

---

## 04/27/2026 {#04272026}

* 新模型 / 更新模型：23
* LLM API 端點：18
* 管理端點 / UI：22
* AI 整合（記錄 / 防護欄 / 快取 / 提示詞）：16
* 支出追蹤、預算與速率限制：13
* MCP 閘道：6
* 效能 / 負載平衡 / 可靠性改善：17
* 文件更新：11
