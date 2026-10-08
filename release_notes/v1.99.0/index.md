---
title: "v1.99.0 - 深色模式、CLI OAuth 登入與批次計費"
slug: "v1-99-0"
date: 2026-09-01T00:00:00
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

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.99.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.99.0
```

</TabItem>
</Tabs>

:::note

此版本的 PyPI 與 Docker 成品是由不同的 SHA 建置，但預期在功能上相同。PyPI 是從 [`d0c8667`](https://github.com/BerriAI/litellm/commit/d0c86678ed3c8951a2c47ed1b1fabcf8de65b553) 建置，而 Docker 是從 [`fa647f7`](https://github.com/BerriAI/litellm/commit/fa647f742d7baefe8eb1181899d9c81b41559772) 建置。

:::

:::danger[重大變更]

**Enterprise 授權執行的 proxy 現在預設啟用稽核記錄。** `store_audit_logs` 變成三態：未設定加上 premium 授權會解析為已啟用，以一個解析器取代大約十五個分散的閘道檢查，而 `LITELLM_STORE_AUDIT_LOGS` 現在會被先前忽略它的 key hook 接受。從未設定此旗標的 enterprise proxy 在升級後會開始寫入稽核資料列，這會增加稽核表。請明確設定 `store_audit_logs: false` 以維持先前行為。請參閱 [PR #37518](https://github.com/BerriAI/litellm/pull/37518)。

**Shadow eval 工作改以美元預算，而不是 turn。** `POST /auto_router/shadow_eval/start` 現在針對每個 key 接受以 USD 表示的 `max_budget`；仍傳送 `max_turns` 的請求會收到一個 422，並指出替代項目。sampler、sweep、stop guard 與衍生狀態都會以 shadow arm 與 judge 的已計費 `response_cost` 為門檻，且 admission 會重新檢查 proxy 的跨 pod 支出計數器。建立於移轉之前的工作會保留其已設定的 turn 預算，因為那些資料列上的 `max_budget` 仍為 NULL。請參閱 [PR #37555](https://github.com/BerriAI/litellm/pull/37555)。

**Shadow eval 工作現在涵蓋的是 key 清單，而不是單一 key。** `api_key_ids` 在啟動 payload 中取代 `api_key_id`，結果會以 pooled 與 per key 方式回傳，且兄弟資料列會透過新的 `group_id` 欄位連在一起。仍傳送單數 `api_key_id` 的呼叫端必須改用清單形式。請參閱 [PR #37251](https://github.com/BerriAI/litellm/pull/37251)。

:::

## 主要亮點 {#key-highlights}

- **Admin UI 從 antd 與 Tremor 的移轉已完成** - `@tremor/react`、`antd` 與 `@ant-design/icons` 都已自 dashboard 依賴項中移除，最後的元件、共享基元，以及每個表單都已移轉到 shadcn (base-vega) 與 react-hook-form。這個期間共合併了 130 個 UI pull request，而 dashboard 現在已使用 React 19
- **深色模式已推出** - 頂端列中的 light/dark/system 切換、success、warning 與 info 的語意狀態 token、LiteLLM 標誌的深色版本，以及由 admin 提供的自訂標誌深色版本。整個 dashboard 中硬編碼的 Tailwind 色盤類別已對應到 theme token，因此 surface、表單控制、inline style 與程式碼區塊都會跟隨主題
- **`lite login` 現在是真正的 OAuth 流程** - CLI 現在透過授權碼加上 PKCE 與 proxy 驗證，將憑證與 refresh token 儲存在 OS keychain，而不是磁碟上的 `token.json`，且 `lite login --config-claude` 會在登入時將 Claude Code 連接起來
- **Batch 支出已端到端納入計費** - 以 enqueued-token 為基礎的 rate limiting 會依 token 預算接受 batch，並在完成或取消時退款，cost 資料列會以原子方式認領，因此多 pod 輪詢不會重複計費，已取消與失敗但仍產生輸出的 batch 會被計費，單一無法解碼的輸出行不再會把 batch 的支出歸零，而 Bedrock batch 可以透過 `POST /v1/batches/{id}/cancel` 取消
- **Provisioned throughput 可在 `config.yaml` 中宣告** - PTU reservation 不再一定要透過 API 建立；rollup 會為在設定中宣告的 deployment 累計固定成本，像 endpoints 一樣拒絕不完整的 reservation，要求由 operator 宣告 id，並在設定宣告 PTU 但 attribution 已關閉時發出警告
- **複雜度路由可由 operator 設定** - 針對 LLM classifier 的 operator 定義 tier 集合、透過 `classifier_type: custom` 自訂 classifier 外掛、coding-agent 用戶端的 plan-mode tier 下限、business classification rubric 預設，以及 tier 編輯器中的每個模型 reasoning effort

## 包含自 v1.99.0-rc.2 {#included-from-v1990-rc2}

此穩定版也包含 rc.1 截點之後在 release 線上登入的所有內容，於 v1.99.0-rc.2 發布並收錄於此：

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 `/v1/messages` bridge 中翻譯 `tool_result` 文件區塊 - [PR #38251](https://github.com/BerriAI/litellm/pull/38251)
- **Dashboard（深色模式後續工作）**
    - 讓提供者標誌在深色模式下可讀 - [PR #38588](https://github.com/BerriAI/litellm/pull/38588)
    - 一鍵主題切換，以及頂端列中與 Docs/Blog 對應的樣式 - [PR #38601](https://github.com/BerriAI/litellm/pull/38601)
    - 讓程式碼區塊與 logs JSON viewer 在深色模式下跟隨主題 - [PR #38771](https://github.com/BerriAI/litellm/pull/38771), [PR #38778](https://github.com/BerriAI/litellm/pull/38778)
    - 讓 playground 對話泡泡具有主題感知，並替 created-key 方塊套用主題 - [PR #37978](https://github.com/BerriAI/litellm/pull/37978), [PR #37985](https://github.com/BerriAI/litellm/pull/37985)
- **Dashboard（錯誤修正）**
    - 讓 select 彈出視窗顯示在觸發器下方，而不是覆蓋其上 - [PR #38554](https://github.com/BerriAI/litellm/pull/38554)
    - 防止 server 搜尋的 combobox 覆寫選取與查詢，並讓分頁搜尋 select 保留使用者輸入內容 - [PR #38574](https://github.com/BerriAI/litellm/pull/38574), [PR #38475](https://github.com/BerriAI/litellm/pull/38475)
    - 保留來自 search 查詢的已刪除內容，而不是將輸入框清空 - [PR #38830](https://github.com/BerriAI/litellm/pull/38830)
    - 在輸入 add model public name 時保持焦點，並恢復其 tooltip 版面配置 - [PR #38366](https://github.com/BerriAI/litellm/pull/38366), [PR #37986](https://github.com/BerriAI/litellm/pull/37986)
    - 還原 log drawer 的 trace sidebar 重新開啟控制項 - [PR #38782](https://github.com/BerriAI/litellm/pull/38782)
    - 將 policy flow builder 疊放在彈出層下方，讓 guardrail 選項能正常顯示 - [PR #38273](https://github.com/BerriAI/litellm/pull/38273)
    - 移除 model connection test 對話框中 Close 旁邊多餘的文字 - [PR #38852](https://github.com/BerriAI/litellm/pull/38852)
- **Docker**
    - 將映像建置的 apk python 鎖定為 3.13，並將 wolfi-base 升級以取得 glibc 2.44 - [PR #38917](https://github.com/BerriAI/litellm/pull/38917), [PR #38973](https://github.com/BerriAI/litellm/pull/38973)
- **端到端測試**
    - 修正 select-anchoring、router-fallback、vertex realtime 與 vision fixture 規格的不穩定性（僅限測試） - [PR #38848](https://github.com/BerriAI/litellm/pull/38848), [PR #38862](https://github.com/BerriAI/litellm/pull/38862)

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新的提供者（5 個新提供者） {#new-providers-5-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| SCX.ai | `/chat/completions` | 以 JSON 設定的相容 OpenAI 提供者，已註冊於 provider enum、config map、pricing map 與 dashboard，提供 GLM-5.2 與 Qwen3.8-Max |
| Cognition | `/chat/completions` | Cognition 擁有自己的提供者身分，而不是沿用 OpenAI 相容別名，並對 `swe-1.6`、`swe-1.7` 與 `swe-1.7-lightning` 設定價格 |
| AWS Bedrock AgentCore | `/search` | 將 Bedrock AgentCore 註冊為搜尋提供者 |
| Amazon Comprehend Medical | `/*` passthrough | Comprehend Medical 的 passthrough 提供者，透過 proxy 路由並使用憑證 |
| Valkey | 向量儲存 | 作為受管理向量儲存提供者的 Valkey，與既有後端並列 |

### 新的 LLM API 端點（4 個新端點） {#new-llm-api-endpoints-4-new-endpoints}

| Endpoint | 方法 | 說明 | 文件 |
| --- | --- | --- | --- |
| `/model/deprecations` | GET | 列出其模型帶有提供者公告的 `deprecation_date` 的部署，支援主動式棄用警示 | [Proxy 設定](../../docs/proxy/configs) |
| `/team/daily/activity/aggregated` | GET | 預先彙總供 Usage 分頁使用的團隊活動，取代先前在用戶端逐列掃描的作法 | [成本追蹤](../../docs/proxy/cost_tracking) |
| `/team/{team_id}/callback/{callback_name}` | DELETE | 在不重寫整個 callback 集合的情況下，移除單一團隊範圍的 logging callback | [團隊記錄](../../docs/proxy/team_logging) |
| `/auto_router/validate_complexity_router_config` | POST | 先對寫入閘道對複雜度路由器設定執行試跑，讓無效的 tier 集合在儲存前就被拒絕 | [自動路由器](../../docs/adaptive_router) |

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援（136 個新模型） {#new-model-support-136-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/100萬 tokens) | 輸出 ($/100萬 tokens) | 功能 |
| --- | --- | --- | --- | --- | --- |
| OpenAI | `gpt-5.6-cyber` | 400K | $12.50 | $75.00 | 推理、視覺、PDF 輸入、function calling、parallel function calling、tool choice、prompt caching、response schema、web search、computer use、原生串流 |
| OpenAI | `daybreak-red-latest` | 400K | $12.50 | $75.00 | 推理、視覺、PDF 輸入、function calling、parallel function calling、tool choice、prompt caching、response schema、web search、computer use、原生串流 |
| OpenAI | `daybreak-blue-latest` | 1M | $4.00 | $20.00 | 推理、視覺、PDF 輸入、function calling、parallel function calling、tool choice、prompt caching、response schema、web search、computer use、原生串流 |
| OpenAI | `chat-latest` | 400K | $5.00 | $30.00 | 視覺、PDF 輸入、function calling、parallel function calling、tool choice、prompt caching、response schema、web search、原生串流 |
| Azure | `azure/gpt-audio-mini` | 128K | $0.60 | $2.40 | function calling、parallel function calling、tool choice、原生串流 |
| Azure | `azure/gpt-realtime-mini` | 32K | $0.60 | $2.40 | 即時、音訊輸入與輸出、function calling、parallel function calling、tool choice、每張圖片 $0.0000008 |
| Amazon Bedrock | `us.openai.gpt-5.6-sol` | 1M | $5.50 | $33.00 | 視覺、function calling、tool choice |
| Amazon Bedrock | `global.openai.gpt-5.6-sol` | 1M | $5.00 | $30.00 | 視覺、function calling、tool choice |
| Amazon Bedrock | `us.openai.gpt-5.6-terra` | 1M | $2.20 | $13.20 | 視覺、function calling、tool choice |
| Amazon Bedrock | `global.openai.gpt-5.6-terra` | 1M | $2.00 | $12.00 | 視覺、function calling、tool choice |
| Amazon Bedrock | `us.openai.gpt-5.6-luna` | 1M | $0.22 | $1.32 | 視覺、function calling、tool choice |
| Amazon Bedrock | `global.openai.gpt-5.6-luna` | 1M | $0.20 | $1.20 | 視覺、function calling、tool choice |
| Amazon Bedrock | `us.xai.grok-4.6` | 500K | $2.20 | $6.60 | 推理、視覺、function calling、tool choice、prompt caching |
| Amazon Bedrock | `global.xai.grok-4.6` | 500K | $2.00 | $6.00 | 推理、視覺、function calling、tool choice、prompt caching |
| Amazon Bedrock | `bedrock_mantle/xai.grok-4.6` | 500K | $2.20 | $6.60 | 推理、視覺、function calling、tool choice、prompt caching、response schema |
| Amazon Bedrock | `bedrock/guardrails` | - | - | - | 防護欄使用與成本計費 |
| AWS Bedrock AgentCore | `agentcore/search` | - | - | - | 搜尋 |
| Databricks | `databricks/databricks-claude-opus-4-6` | 1M | $5.00 | $25.00 | 推理、function calling、tool choice |
| Databricks | `databricks/databricks-claude-sonnet-4-6` | 1M | $3.00 | $15.00 | 推理、function calling、tool choice |
| Databricks | `databricks/databricks-gemini-3-pro` | 1M | $2.50 | $15.00 | function calling、tool choice |
| Databricks | `databricks/databricks-gemini-3-1-pro` | 1M | $2.50 | $15.00 | function calling、tool choice |
| Databricks | `databricks/databricks-gemini-3-flash` | 1M | $0.625 | $3.75 | function calling、tool choice |
| Databricks | `databricks/databricks-gemini-3-1-flash-lite` | 1M | $0.3125 | $1.88 | function calling、tool choice |
| Databricks | `databricks/databricks-gpt-5-4` | 272K | $2.50 | $15.00 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-4-mini` | 272K | $0.75 | $4.50 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-4-nano` | 272K | $0.20 | $1.25 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-2` | 272K | $1.75 | $14.00 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-2-codex` | 272K | $1.75 | $14.00 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-3-codex` | 272K | $1.75 | $14.00 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-1-codex-max` | 272K | $1.25 | $10.00 | 聊天 |
| Databricks | `databricks/databricks-gpt-5-1-codex-mini` | 272K | $0.25 | $2.00 | 聊天 |
| Google Gemini | `gemini/gemini-3.1-flash-lite-image` | 65K | $0.25 | $1.50 | 圖片生成、視覺、function calling、每張圖片 $0.00028 |
| Google Gemini | `gemini/gemini-3.5-live-translate-preview` | - | $3.50 | $21.00 | 音訊輸入與輸出 |
| Google Vertex AI | `vertex_ai/gemini-3.1-flash-lite-image` | 65K | $0.25 | $1.50 | 圖片生成、視覺、PDF 輸入、影片輸入、prompt caching、每張圖片 $0.00028 |
| Google Vertex AI | `gemini-3.1-flash-lite-image` | 65K | $0.25 | $1.50 | 圖片生成、視覺、PDF 輸入、影片輸入、prompt caching、每張圖片 $0.00028 |
| Fireworks AI | `fireworks_ai/kimi-k3` | 1M | $3.00 | $15.00 | 推理、視覺、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/kimi-k3-fast` | 1M | $4.50 | $22.50 | 推理、視覺、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/kimi-k3-us` | 1M | $3.30 | $16.50 | 推理、視覺、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/glm-5p2-fast` | 1M | $2.10 | $6.60 | 推理、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/glm-5p2-fast-us` | 1M | $2.10 | $6.60 | 推理、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/deepseek-v4-flash-0731` | 1M | $0.14 | $0.28 | 推理、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/qwen3p8-max` | 262K | $2.00 | $6.00 | 推理、視覺、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/muse-glimmer-30b` | 131K | $0.35 | $1.50 | 推理、視覺、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/nemotron-3-ultra-nvfp4` | 262K | $0.60 | $2.40 | 推理、function calling、tool choice、response schema |
| Fireworks AI | `fireworks_ai/nemotron-lightning-3p5-30b-a3b` | 262K | $0.05 | $0.20 | 推理、function calling、tool choice、response schema |
| Mistral | `mistral/glm-5-2` | 1M | $1.40 | $4.40 | 推理、function calling、tool choice、prompt caching、response schema |
| Mistral | `mistral/zai-glm-5-2` | 1M | $1.40 | $4.40 | 推理、function calling、tool choice、prompt caching、response schema |
| Mistral | `mistral/mistral-ocr-4-1` | - | - | - | OCR |
| Moonshot | `moonshot/kimi-k3` | 1M | $3.00 | $15.00 | 推理、視覺、影片輸入、function calling、tool choice、response schema |
| OpenRouter | `openrouter/anthropic/claude-opus-5` | 1M | $5.00 | $25.00 | 推理、視覺、PDF 輸入、function calling、tool choice、prompt caching、response schema、computer use |
| OpenRouter | `openrouter/deepseek/deepseek-v4-pro` | 1M | $1.32 | $3.96 | 推理、function calling、tool choice、prompt caching、response schema |
| OpenRouter | `openrouter/deepseek/deepseek-v4-pro-0813` | 1M | $1.32 | $3.96 | 推理、function calling、tool choice、prompt caching、response schema |
| Perplexity | `perplexity/perplexity/kimi-k3` | - | $3.00 | $15.00 | 回應、推理、function calling、web search |
| Perplexity | `perplexity/perplexity/glm-5.2` | - | $1.40 | $4.40 | 回應、推理、function calling、web search |
| Perplexity | `perplexity/perplexity/kimi-k2.7-code` | - | $0.95 | $4.00 | 回應、function calling、web search |
| Perplexity | `perplexity/perplexity/deepseek-v4-flash-0731` | - | $0.13 | $0.26 | 回應、推理、function calling、web search |
| Perplexity | `perplexity/pplx-embed-context-v1-4b` | 32K | $0.05 | - | 嵌入 |
| Perplexity | `perplexity/pplx-embed-context-v1-0.6b` | 32K | $0.008 | - | 嵌入 |
| Voyage | `voyage/voyage-4-large` | 32K | $0.12 | - | 嵌入 |
| Voyage | `voyage/voyage-4` | 32K | $0.06 | - | 嵌入 |
| Voyage | `voyage/voyage-4-lite` | 32K | $0.02 | - | 嵌入 |
| Voyage | `voyage/voyage-code-4` | 32K | $0.12 | - | 嵌入 |
| Voyage | `voyage/voyage-context-4` | 120K | $0.12 | - | 嵌入 |
| Voyage | `voyage/voyage-multimodal-3.5` | 32K | $0.12 | - | 嵌入、圖片嵌入輸入 |
| SCX.ai | `scx-ai/GLM-5.2` | 1M | $0.61 | $1.98 | 推理、function calling、tool choice、prompt caching、response schema |
| SCX.ai | `scx-ai/Qwen3.8-Max` | 1M | $1.65 | $4.99 | 推理、視覺、function calling、tool choice、prompt caching、response schema |
| Cognition | `cognition/swe-1.6` | - | $0.50 | $2.50 | function calling、prompt caching |
| Cognition | `cognition/swe-1.7` | - | $0.50 | $2.50 | function calling、prompt caching |
| Cognition | `cognition/swe-1.7-lightning` | - | $2.50 | $12.50 | function calling、prompt caching |
| fal.ai | `fal_ai/gpt-image-2`, `fal_ai/openai/gpt-image-2` | - | - | - | 圖片生成與編輯，依請求參數中的尺寸與品質計價 |

fal.ai 項目展開為 57 個登錄檔金鑰：兩個基礎 slug，加上每個 `low`/`medium`/`high` 品質與六種輸出解析度的交叉組合，涵蓋生成與 `/edit`。Fireworks 的各個項目都帶有一個 `accounts/fireworks/models/` 別名，而兩個 `glm-5p2-fast` 與兩個 `kimi-k3` fast/US 變體也都帶有一個 `accounts/fireworks/routers/` 別名，因此您已經使用的 slug 仍會持續解析。

除了這些新項目之外，此版本也再次對 288 個既有項目進行大規模費用對照表維護。219 個項目新增或修正了提供者公布的 `deprecation_date`，25 個項目在 `regional_endpoint_uplift_multiplier` 之外同時新增 Batch API 輸入與輸出費率，15 個項目新增 `prompt_cache_min_tokens` 下限，包括 Gemini 3.5、3.6 與 3.7 Flash 以及 3.1 Pro Preview 的 4096。定價雙向變動：Gemini 3.6 Flash 在 Gemini 與 Vertex 上都減半為每 100 萬 $0.75 / $3.75，`gpt-5.6` 與 `gpt-5.6-sol` 在促銷調降中降至 $4.00 / $20.00，`mistral/codestral-latest` 降至 $0.30 / $0.90，Vertex DeepSeek V3.1 MaaS 降至 $0.60 / $1.70，而 `gemini-3.1-flash-image` 加倍至 $0.50 / $3.00，`mistral/mistral-small-latest` 上升至 $0.15 / $0.60。GPT-5.6 系列的最大輸入 token 數從 1.05M 更正為 922K，涵蓋 Azure、US 與 EU 項目。Flex 與 priority 服務層費率分別適用於 8 與 5 個項目，`thinking_always_on` 適用於 11 個項目，`supports_prompt_cache_breakpoint` 適用於 4 個項目。未移除任何定價項目。

#### 功能 {#features}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 在 Bedrock runtime 上提供 GPT-5.6 跨區域推論設定檔 - [PR #37821](https://github.com/BerriAI/litellm/pull/37821)
    - 將 LiteLLM 身分與中繼資料傳遞到 Bedrock `requestMetadata` - [PR #36861](https://github.com/BerriAI/litellm/pull/36861)
    - 新增用於停用 agent-runtime pass-through 的設定切換 - [PR #37386](https://github.com/BerriAI/litellm/pull/37386)
    - Grok 4.6 在 Bedrock 上的第 0 天定價 - [PR #37517](https://github.com/BerriAI/litellm/pull/37517)
- **[Cognition](../../docs/providers/cognition)**
    - 賦予 Cognition 專屬的提供者身分，接著將 `swe-1.7` 設為標準層級定價並新增 `swe-1.7-lightning` - [PR #37743](https://github.com/BerriAI/litellm/pull/37743), [PR #37763](https://github.com/BerriAI/litellm/pull/37763)
- **[SCX.ai](../../docs/providers/scx_ai)**
    - 將 SCX.ai 新增為以 JSON 設定的 OpenAI 相容提供者 - [PR #34752](https://github.com/BerriAI/litellm/pull/34752)
- **[Mistral](../../docs/providers/mistral)**
    - 新增 `zai-glm-5-2` 與 `glm-5-2` 定價 - [PR #37110](https://github.com/BerriAI/litellm/pull/37110)
- **[Perplexity](../../docs/providers/perplexity)**
    - 新增 Agent API 第三方模型 - [PR #37112](https://github.com/BerriAI/litellm/pull/37112)
- **[Databricks](../../docs/providers/databricks)**
    - 為 14 個較新的 Databricks 模型新增費用對照表項目 - [PR #28501](https://github.com/BerriAI/litellm/pull/28501)
- **[Moonshot](../../docs/providers/moonshot)**
    - 將 `moonshot/kimi-k3` 新增至費用對照表 - [PR #37552](https://github.com/BerriAI/litellm/pull/37552), [PR #37753](https://github.com/BerriAI/litellm/pull/37753)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將 `cache_control_injection_points` 對應到 GPT-5.6+ 目標上的 OpenAI `prompt_cache_breakpoint` - [PR #37628](https://github.com/BerriAI/litellm/pull/37628)
    - 將 `metadata.user_id` 對應到 `prompt_cache_key`，適用於 `/v1/messages` 橋接 - [PR #37623](https://github.com/BerriAI/litellm/pull/37623)
- **一般**
    - 透過 Rust core 將 `/chat/completions` 路由至 Anthropic 與 Bedrock - [PR #37241](https://github.com/BerriAI/litellm/pull/37241)
    - 顯示 TinyFish 回應標頭與頂層回應額外資訊 - [PR #32448](https://github.com/BerriAI/litellm/pull/32448)
    - 使用 Microsoft Entra ID 權杖驗證 Azure Postgres - [PR #37663](https://github.com/BerriAI/litellm/pull/37663)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 當 `invocationMetrics` 取代 usage 區塊時，保留快取 token 使用量，並回報提供者的 thinking tokens，而不是將其分類為文字 - [PR #36878](https://github.com/BerriAI/litellm/pull/36878), [PR #35998](https://github.com/BerriAI/litellm/pull/35998)
    - 在 chat completions 上轉送提供者回應標頭，於格式錯誤的 tool-call 參數時優雅降級，並根據設定的輸出儲存桶驗證檔案內容擷取 - [PR #37003](https://github.com/BerriAI/litellm/pull/37003), [PR #33842](https://github.com/BerriAI/litellm/pull/33842), [PR #31435](https://github.com/BerriAI/litellm/pull/31435)
    - 依有效負載形狀而非提供者名稱讀取批次用量，並在受管理批次上傳回傳的 `FileObject` 中回報已上傳大小 - [PR #37078](https://github.com/BerriAI/litellm/pull/37078), [PR #36392](https://github.com/BerriAI/litellm/pull/36392)
- **[Anthropic](../../docs/providers/anthropic)**
    - 不等待下一個區塊即可發出 `tool_use` `content_block_start`，並在 `/v1/messages` 時只解析一次提供者 - [PR #37310](https://github.com/BerriAI/litellm/pull/37310), [PR #37757](https://github.com/BerriAI/litellm/pull/37757)
    - 將由 guardrail 修改過的前置 system 列合併到頂層 `system` 參數 - [PR #37231](https://github.com/BerriAI/litellm/pull/37231)
    - 停止在 Responses adapter 上發出空的 thinking 區塊，並保留可選的 Responses tool 屬性 - [PR #36033](https://github.com/BerriAI/litellm/pull/36033), [PR #36979](https://github.com/BerriAI/litellm/pull/36979)
    - 當 `/v1/messages` 用戶端在串流中途中斷連線時，記錄部分串流支出 - [PR #37558](https://github.com/BerriAI/litellm/pull/37558)
    - 以與 `/v1/messages` 相同的方式對 `/chat/completions` gate sampling 參數，對於永遠啟用 thinking 的模型省略 `thinking.type=disabled`，並接受 bool `thinking` 參數，而不是拋出 `AttributeError` - [PR #37868](https://github.com/BerriAI/litellm/pull/37868), [PR #37510](https://github.com/BerriAI/litellm/pull/37510), [PR #37423](https://github.com/BerriAI/litellm/pull/37423)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 將區域端點提升套用至成本追蹤，從 passthrough URL、`optional_params` 以及原生 `/v1/messages` 呼叫的部署解析服務位置 - [PR #37543](https://github.com/BerriAI/litellm/pull/37543)
    - 只在第一個平行函式呼叫時回退到預留 thought signature - [PR #37541](https://github.com/BerriAI/litellm/pull/37541)
    - 將 Gemini `count_tokens` 中的訊息轉換為內容 - [PR #36981](https://github.com/BerriAI/litellm/pull/36981)
- **[Google Gemini](../../docs/providers/gemini)**
    - 以 Google 的導入優惠費率在所有服務層級為 Gemini 3.6 Flash 定價，並在去重其項目時修正 `gemini-3.1-flash-lite-image` 功能 - [PR #37197](https://github.com/BerriAI/litellm/pull/37197), [PR #36849](https://github.com/BerriAI/litellm/pull/36849)
- **[Azure](../../docs/providers/azure)**
    - 對 `gpt-5-chat` 部署將 `max_tokens` 重新命名為 `max_completion_tokens` - [PR #36857](https://github.com/BerriAI/litellm/pull/36857)
    - 在 Azure AI 上的請求之前移除不符合 OpenAI 規格的訊息欄位 - [PR #34445](https://github.com/BerriAI/litellm/pull/34445)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 略過對 `FW-*` Foundry 部署 id 的 `accounts/` 重寫 - [PR #37242](https://github.com/BerriAI/litellm/pull/37242)
- **[SageMaker](../../docs/providers/aws_sagemaker)**
    - 傳送 inference component 標頭並遵循 `hf_model_name` - [PR #37766](https://github.com/BerriAI/litellm/pull/37766)
- **一般**
    - 停止將客戶端 Anthropic OAuth token 轉送至 Bedrock 與 Vertex - [PR #37905](https://github.com/BerriAI/litellm/pull/37905)
    - 阻止 Rust flag 與 `client_side_timeout` 標記滲漏到上游提供者請求本文中 - [PR #37218](https://github.com/BerriAI/litellm/pull/37218), [PR #37346](https://github.com/BerriAI/litellm/pull/37346)
    - 透過 proxy router 解析 advisor 子呼叫 - [PR #36246](https://github.com/BerriAI/litellm/pull/36246)
    - 顯示來自 container file content 端點的提供者錯誤 - [PR #37737](https://github.com/BerriAI/litellm/pull/37737)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[批次](../../docs/batches)**
    - 針對批次的已排隊 token 速率限制，並在完成與取消時退款 - [PR #37539](https://github.com/BerriAI/litellm/pull/37539)
    - 透過 `StopModelInvocationJob` 支援 AWS Bedrock 批次取消 - [PR #34087](https://github.com/BerriAI/litellm/pull/34087)
    - 紅act 或捨棄個別批次記錄，而不是拒絕整個檔案 - [PR #37561](https://github.com/BerriAI/litellm/pull/37561)
- **[OCR](../../docs/ocr)**
    - 透過 `req_format=native` 傳回 `/v1/ocr` 的原生載荷 - [PR #37194](https://github.com/BerriAI/litellm/pull/37194)
- **[向量儲存](../../docs/completion/knowledgebase)**
    - 新增 Valkey 作為受管理的向量儲存提供者 - [PR #37002](https://github.com/BerriAI/litellm/pull/37002)
- **[圖片生成](../../docs/image_generation)**
    - 新增 fal.ai `gpt-image-2` 圖片生成與編輯支援 - [PR #37729](https://github.com/BerriAI/litellm/pull/37729)
- **[直通端點](../../docs/pass_through/bedrock)**
    - 新增 Amazon Comprehend Medical 直通提供者 - [PR #37229](https://github.com/BerriAI/litellm/pull/37229)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 在橋接中保留 reasoning 輸入項目與已簽署的 thinking 區塊 - [PR #36355](https://github.com/BerriAI/litellm/pull/36355)
    - 在 completion bridge 中建立 Responses API 項目 ID - [PR #37946](https://github.com/BerriAI/litellm/pull/37946)
    - 將不完整回應對應為 `finish_reason: length` 而不是 500，並將 Bedrock Mantle 上下文溢出對應為 `ContextWindowExceededError` - [PR #37710](https://github.com/BerriAI/litellm/pull/37710), [PR #37862](https://github.com/BerriAI/litellm/pull/37862)
    - 在呼叫 Responses API 之前解開物件形式的 `tool_choice`，移除路徑上的 `responses/` 路由前綴，並保留 Bedrock Mantle 驗證錯誤 - [PR #36032](https://github.com/BerriAI/litellm/pull/36032), [PR #37345](https://github.com/BerriAI/litellm/pull/37345), [PR #36580](https://github.com/BerriAI/litellm/pull/36580)
- **[批次](../../docs/batches)**
    - 阻止單一錯誤輸出行將整個批次的支出歸零，並解碼模型編碼的輸出檔案 ID，使已完成批次能正確記帳支出 - [PR #37457](https://github.com/BerriAI/litellm/pull/37457), [PR #37573](https://github.com/BerriAI/litellm/pull/37573)
    - 對已取消與失敗但仍產生輸出檔案的批次計費 - [PR #37205](https://github.com/BerriAI/litellm/pull/37205)
    - 根據所擷取批次的部署模型與費率計價 - [PR #37219](https://github.com/BerriAI/litellm/pull/37219)
    - 當已完成批次沒有輸出檔案時，不要讓記錄當掉；且當 `output_file_id` 落後時，不要在成本回收中將已完成批次退役 - [PR #34067](https://github.com/BerriAI/litellm/pull/34067), [PR #37715](https://github.com/BerriAI/litellm/pull/37715)
    - 傳回與 OpenAI 一致的錯誤：`GET /v1/batches` 上超出範圍的 `limit` 回 400、`POST /v1/batches` 上缺少必要參數則回 400 並指出該參數名稱，以及無法解析的批次與檔案 ID 回 404 而非 500 - [PR #37198](https://github.com/BerriAI/litellm/pull/37198), [PR #37199](https://github.com/BerriAI/litellm/pull/37199), [PR #37201](https://github.com/BerriAI/litellm/pull/37201)
    - 讀取批次記錄的方式與上傳驗證相同 - [PR #37776](https://github.com/BerriAI/litellm/pull/37776)
- **[檔案](../../docs/files_endpoints)**
    - 在本機列出並分頁未加範圍的受管理檔案 - [PR #37855](https://github.com/BerriAI/litellm/pull/37855)
- **[直通端點](../../docs/pass_through/bedrock)**
    - 為 OpenAI 前綴註冊 WebSocket 直通，並在未緩衝的直通上轉送 Bedrock event-stream content-type - [PR #36151](https://github.com/BerriAI/litellm/pull/36151), [PR #33767](https://github.com/BerriAI/litellm/pull/33767)
    - 從 DB 模型部署解析 Vertex 即時憑證，並限制 Vertex 憑證解析範圍，讓即時失敗更明顯 - [PR #37602](https://github.com/BerriAI/litellm/pull/37602), [PR #37604](https://github.com/BerriAI/litellm/pull/37604)
- **一般**
    - 當 agentic web-search loop 達到上限時結束該回合 - [PR #37911](https://github.com/BerriAI/litellm/pull/37911)
    - 為 A2A `message/stream` 傳回 SSE (`text/event-stream`) 而非 NDJSON，並接受規格定義的整個 JSON-RPC id 聯集 - [PR #35037](https://github.com/BerriAI/litellm/pull/35037), [PR #37704](https://github.com/BerriAI/litellm/pull/37704)
    - 停止在直接向量儲存搜尋除錯記錄中洩漏已儲存的憑證 - [PR #37373](https://github.com/BerriAI/litellm/pull/37373)
    - 依請求參數中的大小與品質為 fal.ai `gpt-image-2` 計價 - [PR #37751](https://github.com/BerriAI/litellm/pull/37751)
    - 對非物件的 `metadata` 與 `litellm_metadata` 傳回 400，而不是靜默捨棄或 500 - [PR #37203](https://github.com/BerriAI/litellm/pull/37203)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **設計系統**
    - 完成脫離 Ant Design 和 Tremor 的遷移：最後的元件、共用基礎元件與通用元件都已遷移到 shadcn，`@tremor/react` 和 `antd` 已從相依性樹中移除，而 `@ant-design/icons` 已替換為 `lucide-react` - [PR #37569](https://github.com/BerriAI/litellm/pull/37569), [PR #37574](https://github.com/BerriAI/litellm/pull/37574), [PR #37394](https://github.com/BerriAI/litellm/pull/37394), [PR #37521](https://github.com/BerriAI/litellm/pull/37521), [PR #37553](https://github.com/BerriAI/litellm/pull/37553)
    - 將所有表單遷移到 react-hook-form 和 shadcn，涵蓋 virtual keys、新增模型、團隊、使用者、政策、邊界、代理程式、標籤、記憶體、憑證、自動路由器、向量儲存、pass-through、專案、存取群組、MCP、SSO、SCIM、警示、備援，以及登入和 onboarding 流程 - [PR #37442](https://github.com/BerriAI/litellm/pull/37442), [PR #37446](https://github.com/BerriAI/litellm/pull/37446), [PR #37417](https://github.com/BerriAI/litellm/pull/37417), [PR #37305](https://github.com/BerriAI/litellm/pull/37305), [PR #37357](https://github.com/BerriAI/litellm/pull/37357), [PR #37266](https://github.com/BerriAI/litellm/pull/37266), [PR #37304](https://github.com/BerriAI/litellm/pull/37304), [PR #37353](https://github.com/BerriAI/litellm/pull/37353), [PR #37354](https://github.com/BerriAI/litellm/pull/37354), [PR #37334](https://github.com/BerriAI/litellm/pull/37334), [PR #37315](https://github.com/BerriAI/litellm/pull/37315)
    - 將儀表板升級至 React 19 - [PR #37411](https://github.com/BerriAI/litellm/pull/37411)
    - 將儀表板提示從 antd `message`/`notification` 移至 sonner，並將每個呼叫點以 codemod 轉換為 `lib/toast` - [PR #37207](https://github.com/BerriAI/litellm/pull/37207), [PR #37253](https://github.com/BerriAI/litellm/pull/37253)
- **深色模式**
    - 在頂部列新增明／暗／系統主題切換，並在主題選單中標示為 beta - [PR #37669](https://github.com/BerriAI/litellm/pull/37669), [PR #37680](https://github.com/BerriAI/litellm/pull/37680)
    - 新增 success、warning 和 info 狀態權杖，並將硬編碼的 Tailwind 調色盤類別對應到語意權杖 - [PR #37393](https://github.com/BerriAI/litellm/pull/37393), [PR #37576](https://github.com/BerriAI/litellm/pull/37576)
    - 提供 LiteLLM 標誌的深色模式版本，並讓管理員提供其自訂標誌的深色模式版本 - [PR #37656](https://github.com/BerriAI/litellm/pull/37656), [PR #37662](https://github.com/BerriAI/litellm/pull/37662)
- **自動路由器**
    - 多金鑰 shadow 評估選擇器，並提供每個金鑰的明細，且在工作回應與 UI 標題中顯示被 shadow 的金鑰名稱 - [PR #37389](https://github.com/BerriAI/litellm/pull/37389), [PR #37221](https://github.com/BerriAI/litellm/pull/37221)
    - 可從管理員 UI 設定 heuristic scorer，新增 Lite mixed-provider 預設值，並在建立與編輯表單中設定 plan-mode 覆寫層級 - [PR #37216](https://github.com/BerriAI/litellm/pull/37216), [PR #37068](https://github.com/BerriAI/litellm/pull/37068), [PR #37319](https://github.com/BerriAI/litellm/pull/37319)
    - 在複雜度層級編輯器中提供每個模型的 reasoning effort - [PR #37673](https://github.com/BerriAI/litellm/pull/37673)
- **虛擬金鑰**
    - 將金鑰資訊標頭連結到其使用者、建立者、團隊與組織 - [PR #37187](https://github.com/BerriAI/litellm/pull/37187)
    - 在金鑰詳細頁新增每個金鑰的 Savings 分頁 - [PR #37693](https://github.com/BerriAI/litellm/pull/37693)
- **使用情況與記錄**
    - 新增 user ID 請求記錄篩選器，並在 Usage 頁面新增可搜尋的每位使用者使用情況篩選器 - [PR #36781](https://github.com/BerriAI/litellm/pull/36781), [PR #36790](https://github.com/BerriAI/litellm/pull/36790), [PR #37206](https://github.com/BerriAI/litellm/pull/37206)
    - 新增 `/team/daily/activity/aggregated`，並將 Usage 團隊分頁切換至此 - [PR #36562](https://github.com/BerriAI/litellm/pull/36562)
- **團隊與專案**
    - 從 Projects 模態視窗編輯專案輸入與輸出 TPM 限制 - [PR #37676](https://github.com/BerriAI/litellm/pull/37676)
    - 標準化 Teams 頁面標頭，並將批次邀請與邀請使用者按鈕解耦 - [PR #36897](https://github.com/BerriAI/litellm/pull/36897), [PR #37061](https://github.com/BerriAI/litellm/pull/37061)
- **驗證與管理**
    - 用於移除單一團隊 callback 的 `DELETE /team/{team_id}/callback/{callback_name}` - [PR #37331](https://github.com/BerriAI/litellm/pull/37331)
    - 當 UserInfo 不完整時，從 ID token 或 access token 取得通用 OIDC 使用者 claims - [PR #37696](https://github.com/BerriAI/litellm/pull/37696)
    - 主動式模型淘汰警示與 `/model/deprecations` 端點 - [PR #26900](https://github.com/BerriAI/litellm/pull/26900)
    - 以 `maximum_health_check_retention_period` 限制 health-check 表格 - [PR #37681](https://github.com/BerriAI/litellm/pull/37681)
- **CLI**
    - 原生 CLI 登入，使用 OAuth 授權碼搭配 PKCE - [PR #37626](https://github.com/BerriAI/litellm/pull/37626)
    - 將 `lite login` 憑證與 `--pkce` refresh token 儲存在作業系統 keychain，而不是 `token.json` - [PR #37566](https://github.com/BerriAI/litellm/pull/37566), [PR #37665](https://github.com/BerriAI/litellm/pull/37665)
    - `lite login --config-claude` 在登入時串接 Claude Code - [PR #37507](https://github.com/BerriAI/litellm/pull/37507)

#### 錯誤 {#bugs-1}

- **深色模式與主題設定**
    - 讓深色模式的表單控制項可見，為狀態色彩提供可讀的前景色，讓硬編碼的調色盤表面具備主題感知，讓行內樣式與程式碼區塊跟隨主題，並將政策流程建構器移至主題 token - [PR #37648](https://github.com/BerriAI/litellm/pull/37648), [PR #37649](https://github.com/BerriAI/litellm/pull/37649), [PR #37650](https://github.com/BerriAI/litellm/pull/37650), [PR #37651](https://github.com/BerriAI/litellm/pull/37651), [PR #37654](https://github.com/BerriAI/litellm/pull/37654)
    - 還原在 token 移轉中遺失的 hover 回饋與深色模式變體，並在 hover 時保留語意化按鈕色彩 - [PR #37579](https://github.com/BerriAI/litellm/pull/37579), [PR #37580](https://github.com/BerriAI/litellm/pull/37580)
- **表單**
    - 在掛載欄位投影中重建巢狀與清單路徑，為 MCP 伺服器表單圖新增掛載欄位投影，並將可選陣列與物件 MCP 工具參數以 JSON 輸入呈現 - [PR #37450](https://github.com/BerriAI/litellm/pull/37450), [PR #37440](https://github.com/BerriAI/litellm/pull/37440), [PR #37548](https://github.com/BerriAI/litellm/pull/37548)
    - 在觸發器上顯示選擇標籤而非原始值，還原快取控制 Role 與 Index 欄位提示，並在區段停用時停用 pass-through 防護欄欄位輸入 - [PR #37372](https://github.com/BerriAI/litellm/pull/37372), [PR #37437](https://github.com/BerriAI/litellm/pull/37437), [PR #37435](https://github.com/BerriAI/litellm/pull/37435)
    - 當建立彈出視窗重新開啟時清除 pass-through 標頭列，並阻止 Add Model 對應表格讓頁面無限循環 - [PR #37549](https://github.com/BerriAI/litellm/pull/37549), [PR #37741](https://github.com/BerriAI/litellm/pull/37741)
    - 將第一個成員搜尋命中高亮，讓 Enter 可選取它 - [PR #37429](https://github.com/BerriAI/litellm/pull/37429)
    - 還原在 shadcn 移轉中遺失的分頁列樣式與面板持久性 - [PR #37403](https://github.com/BerriAI/litellm/pull/37403)
    - 讓 completion 模式模型保留在 playground 聊天下拉選單中 - [PR #37954](https://github.com/BerriAI/litellm/pull/37954)
- **成本最佳化**
    - 每個日期繪製一個 Per Day 節省長條，顯示分頁式備援，並從共用時間選擇器驅動 auto-router 用量 - [PR #37643](https://github.com/BerriAI/litellm/pull/37643), [PR #37659](https://github.com/BerriAI/litellm/pull/37659), [PR #37871](https://github.com/BerriAI/litellm/pull/37871)
    - 在載入編輯彈出視窗時保留以操作員定義階層為目標的關鍵字階層規則，並在 complexity router 上固定預設模型 - [PR #37413](https://github.com/BerriAI/litellm/pull/37413), [PR #36615](https://github.com/BerriAI/litellm/pull/36615)
    - 當金鑰沒有預算時，停止將金鑰支出與團隊預算配對 - [PR #37196](https://github.com/BerriAI/litellm/pull/37196)
- **驗證與管理**
    - 將 `/team/member_delete` 的四項清理動作做成原子操作，並填入 roster 快照中缺少的團隊成員電子郵件 - [PR #37959](https://github.com/BerriAI/litellm/pull/37959), [PR #37759](https://github.com/BerriAI/litellm/pull/37759)
    - 停止讓團隊備援擴大模型存取，並在無法解析的團隊備援中獨立解析團隊 `object_permission` - [PR #37962](https://github.com/BerriAI/litellm/pull/37962), [PR #37960](https://github.com/BerriAI/litellm/pull/37960)
    - 在模型存取群組中將裸模型名稱與萬用字元部署相對應解析，並在專案金鑰限制中接受繼承的模型 sentinel - [PR #37492](https://github.com/BerriAI/litellm/pull/37492), [PR #37515](https://github.com/BerriAI/litellm/pull/37515)
    - SCIM：在建立 placeholder 前，先以 SSO 身分或電子郵件比對群組成員；當成員新增或使用者建立失敗時讓群組同步失敗；傳遞團隊 roster 寫入失敗；並在電子郵件比對到 `POST /Users` 時保留比對到的 `user_id` - [PR #37686](https://github.com/BerriAI/litellm/pull/37686), [PR #37688](https://github.com/BerriAI/litellm/pull/37688), [PR #37700](https://github.com/BerriAI/litellm/pull/37700), [PR #37701](https://github.com/BerriAI/litellm/pull/37701)
    - 重試 JWKS 擷取，提供陳舊金鑰，並在 IdP 無法連線時回傳 503 - [PR #37690](https://github.com/BerriAI/litellm/pull/37690)
    - 將團隊成員預設預算快取為型別化模型，並在 401 與驗證期間 429 失敗記錄中擷取請求者 IP - [PR #37695](https://github.com/BerriAI/litellm/pull/37695), [PR #37707](https://github.com/BerriAI/litellm/pull/37707)
    - 讓 org 管理員可檢視其組織的用量，並在彙總的活動實體篩選器為空時回傳無列 - [PR #37235](https://github.com/BerriAI/litellm/pull/37235), [PR #37414](https://github.com/BerriAI/litellm/pull/37414)
    - 分離代理程式推理與管理路由，讓管理節點可以建立代理程式 - [PR #37730](https://github.com/BerriAI/litellm/pull/37730)
    - 在解析 `os.environ` 設定參照之前初始化密鑰管理器 - [PR #37544](https://github.com/BerriAI/litellm/pull/37544)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 為語音、圖片、審核、OCR 與轉錄發出 LLM Call spans - [PR #37752](https://github.com/BerriAI/litellm/pull/37752)
    - 界定並關閉以憑證為範圍的 tracer providers，並且每個 logger 只建構一次以憑證為範圍的 Resource - [PR #36591](https://github.com/BerriAI/litellm/pull/36591), [PR #37542](https://github.com/BerriAI/litellm/pull/37542)
    - 將 Prisma 資料庫 spans 歸屬到 PostgreSQL，而非 localhost - [PR #36595](https://github.com/BerriAI/litellm/pull/36595)
    - 在 OTel v2 下將 Phoenix traces 路由到每個 key 與每個團隊專案 - [PR #36706](https://github.com/BerriAI/litellm/pull/36706)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 在事件迴圈外渲染 `/metrics`，並合併並行抓取 - [PR #37702](https://github.com/BerriAI/litellm/pull/37702)
    - 將驗證與 pre-call 時間併入 `litellm_request_total_latency_metric` - [PR #37958](https://github.com/BerriAI/litellm/pull/37958)
- **[DataDog](../../docs/proxy/logging#datadog)**
    - 標準化衍生自別名的標記值，讓指標與實際送出的內容一致 - [PR #37682](https://github.com/BerriAI/litellm/pull/37682)
- **一般**
    - 關閉 verbose logging 中三條密鑰外洩路徑，從寫入請求中繼資料的驗證物件移除 callback 憑證，並在密鑰遮罩期間保留 uvicorn `color_message` 參數 - [PR #37391](https://github.com/BerriAI/litellm/pull/37391), [PR #37233](https://github.com/BerriAI/litellm/pull/37233), [PR #37122](https://github.com/BerriAI/litellm/pull/37122)
    - 限制寫入 stdout 的過大錯誤負載，並限制共用 logging 執行器的積壓 - [PR #37684](https://github.com/BerriAI/litellm/pull/37684), [PR #37694](https://github.com/BerriAI/litellm/pull/37694)
    - 停止對 results 做 deepcopy，因為遮罩無法遮罩它 - [PR #36638](https://github.com/BerriAI/litellm/pull/36638)
    - 將每個請求的 auto-router 節省顯示給 logging 回呼，並將 Codex turn 歸為同一個 session id - [PR #37894](https://github.com/BerriAI/litellm/pull/37894), [PR #37895](https://github.com/BerriAI/litellm/pull/37895)
    - 在 router 呼叫前複製訊息，並在 shadow eval 中提高 judge 輸出上限，然後移除未使用的 judge reasoning 欄位並挽救遭截斷的裁決 - [PR #37232](https://github.com/BerriAI/litellm/pull/37232), [PR #37239](https://github.com/BerriAI/litellm/pull/37239)

### 防護欄 {#guardrails}

- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 追蹤每次呼叫的 Bedrock guardrail 使用單位，並將 Bedrock guardrail 成本計入支出與預算 - [PR #37225](https://github.com/BerriAI/litellm/pull/37225), [PR #37362](https://github.com/BerriAI/litellm/pull/37362)
- **[Azure Content Safety](../../docs/proxy/guardrails/quick_start)**
    - 在 `/guardrails/apply_guardrail` 上掃描文字 - [PR #36894](https://github.com/BerriAI/litellm/pull/36894)
- **[Noma](../../docs/proxy/guardrails/quick_start)**
    - 停止在 v2 payload 中重複傳送對話 - [PR #36764](https://github.com/BerriAI/litellm/pull/36764)
- **一般**
    - 修補 SpendLogs、偵錯記錄與 `logging_only` 回應中的 PII 與 PCI 遮罩缺口 - [PR #37965](https://github.com/BerriAI/litellm/pull/37965)
    - 在批次輸入檔案上傳時執行 pre-call 防護欄，使用非防護欄的內容掛鉤掃描批次記錄，並在沒有防護欄作用時省略 `litellm_batch_guardrail` - [PR #37519](https://github.com/BerriAI/litellm/pull/37519), [PR #37786](https://github.com/BerriAI/litellm/pull/37786), [PR #37964](https://github.com/BerriAI/litellm/pull/37964)
    - 當呼叫端送出自己的中繼資料時執行政策管線，涵蓋 `/v1/messages` 與 Claude Code - [PR #36889](https://github.com/BerriAI/litellm/pull/36889)
    - 記錄 MCP 工具防護欄評估與封鎖 - [PR #36978](https://github.com/BerriAI/litellm/pull/36978)
    - 限制 `/guardrails/usage` 可接受的日期視窗，只在連線錯誤時重試用量 upsert，並重新排入在重試耗盡後被捨棄的 rollup 列 - [PR #37380](https://github.com/BerriAI/litellm/pull/37380), [PR #37247](https://github.com/BerriAI/litellm/pull/37247), [PR #37387](https://github.com/BerriAI/litellm/pull/37387)
    - 在註冊表查無項目時直接讀取 DB，讓新建立的模型、防護欄與代理程式可在同層副本上解析 - [PR #36263](https://github.com/BerriAI/litellm/pull/36263)

### 提示管理 {#prompt-management}

- **一般**
    - 不要將沒有 `prompt_id` 的請求路由到無法執行它們的提示管理器 - [PR #37575](https://github.com/BerriAI/litellm/pull/37575)

### 密鑰管理器 {#secret-managers}

- **一般**
    - 將 `lite login` 憑證及其重新整理權杖儲存在 OS 金鑰鏈中，而非磁碟上的檔案 - [PR #37566](https://github.com/BerriAI/litellm/pull/37566), [PR #37665](https://github.com/BerriAI/litellm/pull/37665)
    - 在解析設定中的 `os.environ` 參照之前先初始化秘密管理器 - [PR #37544](https://github.com/BerriAI/litellm/pull/37544)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預留輸送量**
    - 對在 `config.yaml` 中宣告的 PTU 部署累積固定成本，且以不依賴來源的部署記錄為準 - [PR #37556](https://github.com/BerriAI/litellm/pull/37556), [PR #37501](https://github.com/BerriAI/litellm/pull/37501)
    - 如同端點一樣拒絕不完整的 `config.yaml` 預留，要求由操作人員宣告的 id，絕不回溯撤銷執行無法看見之部署的固定費用，並在設定宣告 PTU 但停用歸因時發出警告 - [PR #37703](https://github.com/BerriAI/litellm/pull/37703), [PR #37794](https://github.com/BerriAI/litellm/pull/37794), [PR #37793](https://github.com/BerriAI/litellm/pull/37793), [PR #37898](https://github.com/BerriAI/litellm/pull/37898)
    - 將 prune 交給查詢建構器可序列化的純刪除篩選條件 - [PR #37571](https://github.com/BerriAI/litellm/pull/37571)
- **速率限制與預算**
    - 新增專案層級的 ITPM 與 OTPM 配額 - [PR #35110](https://github.com/BerriAI/litellm/pull/35110)
    - 讓每個模型的預算追蹤支出、執行限制與回報使用同一個計數器 - [PR #37736](https://github.com/BerriAI/litellm/pull/37736)
    - 在預算預留中，對大型提示詞每個請求只做一次分詞，且在事件迴圈外執行 - [PR #37683](https://github.com/BerriAI/litellm/pull/37683)
    - 在重設預算工作中每個 tick 只選出一個 sweeper 並限制 window 掃描範圍，並在暫時性的 DB transport 錯誤時重新連線並重試 - [PR #36497](https://github.com/BerriAI/litellm/pull/36497), [PR #37705](https://github.com/BerriAI/litellm/pull/37705)
    - 新增管理員切換以封鎖沒有定價的模型請求 - [PR #35181](https://github.com/BerriAI/litellm/pull/35181)
- **支出記錄**
    - 在將原始 API 金鑰持久化到支出記錄之前先雜湊處理，因此非 `sk-` 或以 Bearer 為前綴的金鑰無法以明文儲存在 Key Hash 欄位或顯示 - [PR #30736](https://github.com/BerriAI/litellm/pull/30736)
    - 為支出記錄新增生命週期時間戳；`endTime` 回填遷移已在封版前回復 - [PR #37361](https://github.com/BerriAI/litellm/pull/37361), [PR #37554](https://github.com/BerriAI/litellm/pull/37554), [PR #37875](https://github.com/BerriAI/litellm/pull/37875)
    - 以資料列數量以及位元組數來限制每個支出記錄寫入語句 - [PR #37758](https://github.com/BerriAI/litellm/pull/37758)
    - 在失敗請求的支出記錄中記錄估計的輸入 token，並填入部署歸因 - [PR #37365](https://github.com/BerriAI/litellm/pull/37365), [PR #37520](https://github.com/BerriAI/litellm/pull/37520)
    - 記錄 OpenAI passthrough embeddings 且未對應模型的支出 - [PR #37425](https://github.com/BerriAI/litellm/pull/37425)
- **成本計算**
    - 以原子方式認領批次成本列，避免多 pod 輪詢造成重複計費 - [PR #37685](https://github.com/BerriAI/litellm/pull/37685)
    - 依據實際模型為部分串流支出列計價，並保留 prompt 與 cache 欄位 - [PR #37734](https://github.com/BerriAI/litellm/pull/37734)
    - 在成本計算中識別 ultrafast service tier，將串流 Messages 使用成本與已記錄的支出匹配，並在呼叫端未提供 `include_usage` 時追蹤提供者回報的成本 - [PR #37355](https://github.com/BerriAI/litellm/pull/37355), [PR #35114](https://github.com/BerriAI/litellm/pull/35114), [PR #35013](https://github.com/BerriAI/litellm/pull/35013), [PR #36593](https://github.com/BerriAI/litellm/pull/36593)
- **成本對照表維護**
    - 將十一個開放的登錄檢查合併為一個 changeset，並將提供者宣布的 `deprecation_date` 新增到 205 筆登錄項目 - [PR #37658](https://github.com/BerriAI/litellm/pull/37658), [PR #37283](https://github.com/BerriAI/litellm/pull/37283)
    - 套用 GPT-5.6 Sol 宣傳定價折扣，並將 GPT-5.6 最大輸入 token 更正為 922K - [PR #37880](https://github.com/BerriAI/litellm/pull/37880), [PR #37722](https://github.com/BerriAI/litellm/pull/37722)
    - 更正 Gemini 3.1 flash image 與 DeepSeek V4 定價，新增 OpenAI 淘汰日期，並在 Gemini 3.5/3.6/3.7 Flash 與 3.1 Pro Preview 設定 `prompt_cache_min_tokens=4096` - [PR #37473](https://github.com/BerriAI/litellm/pull/37473), [PR #37516](https://github.com/BerriAI/litellm/pull/37516)
    - 為 `gpt-audio-mini` 與 `gpt-realtime-mini` 新增未指定日期的 Azure 別名，並為裸露的第一方 Claude 金鑰新增 `supports_mid_conversation_system` - [PR #37867](https://github.com/BerriAI/litellm/pull/37867), [PR #36969](https://github.com/BerriAI/litellm/pull/36969)
    - 要求 model prices JSON 檔案通過 pricing-owner 核准 - [PR #37551](https://github.com/BerriAI/litellm/pull/37551)

## MCP 閘道 {#mcp-gateway}

- **OAuth**
    - 當 OAuth discovery 失敗時，提供 token-forwarding servers，並阻止 OAuth discovery 導致服務中斷 - [PR #37399](https://github.com/BerriAI/litellm/pull/37399), [PR #36599](https://github.com/BerriAI/litellm/pull/36599)
    - 讓因 salt-key 遺失而孤立的 OAuth 憑證可透過重新授權來替換 - [PR #37672](https://github.com/BerriAI/litellm/pull/37672)
    - 拒絕沒有伺服器存取權的使用者進行互動式 `dcr_bridge` 授權，並將管理員 OAuth 工作階段解析為 connect 頁面所顯示的相同伺服器集合 - [PR #37865](https://github.com/BerriAI/litellm/pull/37865), [PR #37900](https://github.com/BerriAI/litellm/pull/37900)
    - 為已命名的 MCP servers 限定 authorization server issuer；請注意，先前在相同修正上的嘗試已在此期間回復 - [PR #37204](https://github.com/BerriAI/litellm/pull/37204), [PR #36482](https://github.com/BerriAI/litellm/pull/36482), [PR #37220](https://github.com/BerriAI/litellm/pull/37220)
- **工具與路由**
    - 將工具存在性檢查繫結到所選伺服器，並在比對每個伺服器的 MCP route 拼字之前移除 `root_path` - [PR #37388](https://github.com/BerriAI/litellm/pull/37388), [PR #35576](https://github.com/BerriAI/litellm/pull/35576)
    - 在 OpenAPI 工具呼叫時轉送每個伺服器的 auth header，並停止將失敗的 OpenAPI 工具呼叫回報為成功 - [PR #37410](https://github.com/BerriAI/litellm/pull/37410), [PR #37496](https://github.com/BerriAI/litellm/pull/37496)
    - 正規化 auth schemes，讓 MCP egress 僅發出一個前綴 - [PR #37668](https://github.com/BerriAI/litellm/pull/37668)
    - 在列出非 OAuth2 auth types 的工具時，附加每位使用者的 BYOK 憑證 - [PR #34787](https://github.com/BerriAI/litellm/pull/34787)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由**
    - 為自動提示快取賦予部署親和性，並將部署模型資訊與已快取的後端中繼資料分離 - [PR #37689](https://github.com/BerriAI/litellm/pull/37689), [PR #37687](https://github.com/BerriAI/litellm/pull/37687)
    - 將 Responses API 輸入透過自動路由器路由，並讓已路由部署自身的 `litellm_params` 勝過轉送的自動路由器標記參數 - [PR #37333](https://github.com/BerriAI/litellm/pull/37333), [PR #37615](https://github.com/BerriAI/litellm/pull/37615)
    - 在前置路由中遵守金鑰層級的標籤篩選，將 `acreate_file` 備援保留在要求的模型群組內，並在檔案上傳時將 `target_model_names` 轉送至 `litellm_proxy` 部署 - [PR #37366](https://github.com/BerriAI/litellm/pull/37366), [PR #37424](https://github.com/BerriAI/litellm/pull/37424), [PR #36240](https://github.com/BerriAI/litellm/pull/36240)
    - 將 `router_model_name` 加入自動路由的回應主體，並在部署名稱可從成本對應表解析時停止記錄「Could not identify azure model」 - [PR #37725](https://github.com/BerriAI/litellm/pull/37725), [PR #37869](https://github.com/BerriAI/litellm/pull/37869)
- **複雜度路由器**
    - 為 LLM 分類器提供操作員定義的階層集合、透過 `classifier_type: custom` 的自訂分類器外掛、供 coding-agent 用戶端使用的 plan 模式階層下限、每個階層的 `litellm_params`，以及商業分類準則預設集 - [PR #37226](https://github.com/BerriAI/litellm/pull/37226), [PR #37249](https://github.com/BerriAI/litellm/pull/37249), [PR #37230](https://github.com/BerriAI/litellm/pull/37230), [PR #37064](https://github.com/BerriAI/litellm/pull/37064), [PR #37534](https://github.com/BerriAI/litellm/pull/37534)
    - 將 reasoning 覆寫限制在非 SIMPLE 分數上 - [PR #37500](https://github.com/BerriAI/litellm/pull/37500)
- **快取**
    - 限制語意快取的 embedding 查找，避免已失效的 embedding 端點阻塞請求，並截斷語意快取 embedding 輸入 - [PR #37742](https://github.com/BerriAI/litellm/pull/37742), [PR #37367](https://github.com/BerriAI/litellm/pull/37367)
    - 對未標記的 Claude 模型保留對話中段 system 訊息的提示快取 - [PR #36968](https://github.com/BerriAI/litellm/pull/36968)
    - 將 Azure AD 和 GCP IAM 驗證套用至每一條 async Redis 用戶端路徑，並在叢集用戶端逾時時只重設失敗的節點，而不是整個用戶端 - [PR #37740](https://github.com/BerriAI/litellm/pull/37740), [PR #37863](https://github.com/BerriAI/litellm/pull/37863)
- **Proxy 執行階段**
    - 防止大量 token 數量阻塞 proxy 事件迴圈 - [PR #37697](https://github.com/BerriAI/litellm/pull/37697)
    - 在上游仍無回應時發送 SSE keepalives，包括 assistants runs 和 A2A streams - [PR #37322](https://github.com/BerriAI/litellm/pull/37322), [PR #37368](https://github.com/BerriAI/litellm/pull/37368)
    - 停止在 auth 中以 registry 快取進行每請求的標籤與 end-user Postgres 讀取 - [PR #36801](https://github.com/BerriAI/litellm/pull/36801)
    - 在 chat completions 上轉送 `store` 和 `prompt_cache_key`，並將巢狀 `prompt_tokens_details.cache_creation_input_tokens` 對應至 `cache_write_tokens` - [PR #33195](https://github.com/BerriAI/litellm/pull/33195), [PR #37377](https://github.com/BerriAI/litellm/pull/37377)
- **資料庫與部署**
    - 將已設定的連線參數套用至 read replica URL，並在 Helm 中以 reader 主機密鑰組合 `DATABASE_URL_READ_REPLICA` - [PR #37691](https://github.com/BerriAI/litellm/pull/37691), [PR #37109](https://github.com/BerriAI/litellm/pull/37109)
    - 在 migration 錯誤時使獨立的 Prisma migration entrypoint 失敗，但不要因失敗的 `prisma generate` 而讓它失敗 - [PR #37692](https://github.com/BerriAI/litellm/pull/37692), [PR #37947](https://github.com/BerriAI/litellm/pull/37947)
    - 為 Helm migrations Job 設定上限，避免被阻塞的 migration 卡住 release，並讓 `USE_V2_MIGRATION_RESOLVER` 選擇 v2 migration resolver - [PR #36975](https://github.com/BerriAI/litellm/pull/36975), [PR #36258](https://github.com/BerriAI/litellm/pull/36258)
    - 更新 wolfi-base digest，以納入 busybox 1.38.0-r1 和 openssl 3.6.3-r5，並將 sqlparse 升級至 0.6.0 以清除 osv-scan 發現項目 - [PR #37950](https://github.com/BerriAI/litellm/pull/37950), [PR #37200](https://github.com/BerriAI/litellm/pull/37200)
- **型別**
    - 移除 72 個 `Any` 熱點檔案中約 2.6k 個 basedpyright 錯誤 - [PR #37073](https://github.com/BerriAI/litellm/pull/37073), [PR #37439](https://github.com/BerriAI/litellm/pull/37439)

## 文件更新 {#documentation-updates}

- 注意 Terraform provider 現在會以 LiteLLM 版本隨附 - [PR #37912](https://github.com/BerriAI/litellm/pull/37912)

文件現在位於 [BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs)，因此此期間的文件變更會在該處計入，而不是在此 repository 的 PR 集合中。

### 依擁有區域彙總的 PR {#pr-roll-up-by-ownership-area}

依擁有區域分類的 PR（總計：451）

- UI: 130
- 其他（CI / chore / tests / build / version bumps）: 67
- Spend / Budgets / Rate Limits: 48
- Performance: 44
- Models & Providers: 43
- LLM API Endpoints: 41
- Logging: 23
- Auth & Management: 22
- MCP: 16
- Guardrails: 15
- Prompt Management: 1
- Docs: 1

## 端到端測試 {#end-to-end-testing}

我們正大力投入端到端測試，以減少迴歸並讓 LiteLLM 在每個版本間更穩定。每個版本都會由一個即時測試套件驗證，該套件會對真實已部署的 proxy 執行，並呼叫真實的提供者端點，而不是 mock，因此我們驗證的行為就是您在正式環境中得到的行為。

此期間新增了 73 個僅測試的 pull request，其中 14 個涉及即時 e2e 套件。主要變更是一個錄製與回放的傳輸接縫：fixture bundle 格式、以內容為基礎的標準化比對鍵、作為回放識別一部分固定的 query params 與 multipart form fields，以及將接縫下移到提供者邊緣，因此非串流的提供者流程可以被確定性地回放，而即時套件仍會對真實提供者執行。新的永久迴歸測試固定了 prompt-cache、service-tier 與 cost-header 計費、OpenAI passthrough 路由與檔案清單隔離、OpenAI WebSocket passthrough 前綴，以及十二個先前已關閉的問題。

套件本身也針對遮蔽真實訊號的失敗情況進行了強化：response-cache 串音、緩慢的提供者和單一上游抖動現在會被刻意容忍，而不是靠運氣；不具判斷力的睡眠改為 deadline 等待；live suites 也已重新指向已退役的 Gemini、Groq、Together AI 和 Vertex 圖像模型。在收緊機制方面，六條 ruff 規則現在會拒絕不可能失敗的測試，`pytest.raises(Exception)` 被全面禁止，`PT011`/`PT012`/`PT014`/`PT017`/`RUF043` 已被強制執行，因此大範圍的 raises 區塊不能因錯誤的錯誤而通過，而 `F811` 和 `F821` 也已被強制執行，因此重複或未定義的名稱不能悄悄取代第一個名稱。散落在第二個 mirror 中的三十個測試檔案現在真的會執行，`tests/old_proxy_tests` 已退役，且 conftest 的 save/restore 清單已被凍結，因此只能縮小；全域狀態清理僅在 cost-calc suites 中就解開了 182 次洩漏寫入。

## 新貢獻者 {#new-contributors}

- @ChenluJi 在 [PR #32448](https://github.com/BerriAI/litellm/pull/32448) 中做出他們的首次貢獻
- @Sujithr07 在 [PR #33195](https://github.com/BerriAI/litellm/pull/33195) 中做出他們的首次貢獻
- @MUSE-CODE-SPACE 在 [PR #34067](https://github.com/BerriAI/litellm/pull/34067) 中做出他們的首次貢獻
- @ayaangazali 在 [PR #34445](https://github.com/BerriAI/litellm/pull/34445) 中做出他們的首次貢獻
- @bhuvan2134686 在 [PR #34752](https://github.com/BerriAI/litellm/pull/34752) 中做出他們的首次貢獻
- @shivijain2323 在 [PR #35110](https://github.com/BerriAI/litellm/pull/35110) 中做出他們的首次貢獻
- @Scott-Wilson-ZocDoc 在 [PR #36032](https://github.com/BerriAI/litellm/pull/36032) 中做出他們的首次貢獻
- @LHMQ878 在 [PR #36151](https://github.com/BerriAI/litellm/pull/36151) 中做出他們的首次貢獻
- @harryzhou2000 在 [PR #36355](https://github.com/BerriAI/litellm/pull/36355) 中做出他們的首次貢獻
- @irosh-colombage-ZocDoc2 在 [PR #36482](https://github.com/BerriAI/litellm/pull/36482) 中做出他們的首次貢獻
- @itaimodi 在 [PR #36764](https://github.com/BerriAI/litellm/pull/36764) 中做出他們的首次貢獻
- @brian5021 在 [PR #36878](https://github.com/BerriAI/litellm/pull/36878) 中做出他們的首次貢獻
- @oneKn8 在 [PR #36968](https://github.com/BerriAI/litellm/pull/36968) 中做出他們的首次貢獻
- @sailikhithk 在 [PR #36981](https://github.com/BerriAI/litellm/pull/36981) 中做出他們的首次貢獻
- @bruno-olivia 在 [PR #37242](https://github.com/BerriAI/litellm/pull/37242) 中做出他們的首次貢獻
- @longwind48 在 [PR #37821](https://github.com/BerriAI/litellm/pull/37821) 中做出他們的首次貢獻

此版本中的三項修正以維護者推送的副本形式進入 repository，因此可對它們執行完整 CI pipeline，且保留提交作者資訊： [PR #37867](https://github.com/BerriAI/litellm/pull/37867)、[PR #37868](https://github.com/BerriAI/litellm/pull/37868) 和 [PR #37869](https://github.com/BerriAI/litellm/pull/37869) 是 @mihidumh 的工作，而 [PR #37219](https://github.com/BerriAI/litellm/pull/37219) 是 @marty-sullivan 的工作。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.98.0...v1.99.0
