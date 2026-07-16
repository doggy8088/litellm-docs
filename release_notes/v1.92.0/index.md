---
title: "v1.92.0 - Claude Sonnet 5、正式版 MCP OAuth 與新提供者"
slug: "v1-92-0"
date: 2026-07-11T00:00:00
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
docker.litellm.ai/berriai/litellm:1.92.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.92.0
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **Claude Sonnet 5** - 跨 Anthropic、Amazon Bedrock（包括區域推論設定檔）、Vertex AI 與 Azure AI 的一級支援，具備 1M token 上下文視窗、推理、電腦使用、PDF 輸入，以及截至 2026-08-31 的入門定價。
- **可直接用於正式環境的 MCP OAuth（On-Behalf-Of）** - token_exchange 分支移至 v2 resolver，採用 RFC 9728 -> RFC 8414 端點探索（不猜測 IdP）、持久化的 Dynamic Client Registration、每個伺服器的對外併發限制，以及適用於大型工具目錄的 `mcp_tool_search` 虛擬工具。
- **兩個新提供者** - Tencent（透過 TokenHub 提供 DeepSeek V4 flash/pro，支援聊天與 `/v1/messages`）以及 Google Distributed Cloud（GDC）Gemini，適用於內部部署／主權部署。
- **存取控制強化** - 對 `permissions` 與 `allowed_routes` 在 key、user 與 team 端點上的 admin-gating、具版本化重新加密遷移的 AES-256-GCM 靜態憑證加密，以及從啟動與 router 錯誤記錄中去除 secrets。
- **更快的熱路徑** - spend-counter 增量與請求前的 budget 讀取現在會同時收集，cost-callback deepcopy 已移出請求事件迴圈，OTel runtime imports 會被記憶化，而 Redis-叢集重新連線與 read-replica 啟動韌性可在基礎設施短暫異常時維持 proxy 服務。

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| Tencent (`tencent`) | Chat Completions、`/v1/messages` | Tencent TokenHub 提供者，提供支援推理、prompt 快取與 Anthropic Messages 支援的 DeepSeek V4（flash 與 pro）- [PR #31903](https://github.com/BerriAI/litellm/pull/31903) |
| Google Distributed Cloud - GDC (`gdc`) | 聊天補全 | 適用於內部部署與主權雲端部署的 Google Distributed Cloud Gemini 提供者 - [PR #31895](https://github.com/BerriAI/litellm/pull/31895) |

## 新模型／更新模型 {#new-models--updated-models}

#### 新增模型支援（4 個模型共有 13 筆新定價項目） {#new-model-support-13-new-pricing-entries-across-4-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（每 100 萬 token） | 輸出（每 100 萬 token） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Anthropic / Bedrock / Vertex / Azure AI | `claude-sonnet-5` | 1M | $2.00 | $10.00 | 推理、視覺、函式呼叫、prompt 快取、電腦使用、PDF 輸入、自適應思考 |
| Bedrock Mantle | `bedrock_mantle/xai.grok-4.3` | 131K | $1.25 | $2.50 | 推理、視覺、函式呼叫 |
| Tencent | `tencent/deepseek-v4-flash` | 1M | $0.14 | $0.28 | 推理、函式呼叫、prompt 快取 |
| Tencent | `tencent/deepseek-v4-pro` | 1M | $0.435 | $0.87 | 推理、函式呼叫、prompt 快取 |

Claude Sonnet 5 隨附 Anthropic（`claude-sonnet-5`）、Amazon Bedrock（`anthropic.claude-sonnet-5` 以及 `us` / `eu` / `au` / `jp` / `global` 區域推論設定檔）、Vertex AI（`vertex_ai/claude-sonnet-5`）與 Azure AI（`azure_ai/claude-sonnet-5`）的定價項目 - [PR #31740](https://github.com/BerriAI/litellm/pull/31740)，並已套用入門定價至 2026-08-31 - [PR #31917](https://github.com/BerriAI/litellm/pull/31917)。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增具備推理、電腦使用與 PDF 輸入的 Claude Sonnet 5 - [PR #31740](https://github.com/BerriAI/litellm/pull/31740)
    - 在啟用 `drop_params` 時仍保持 `context_management` 正常運作 - [PR #32020](https://github.com/BerriAI/litellm/pull/32020)
    - 為第一方 Anthropic 保留 `x-anthropic-billing-header` system blocks - [PR #29584](https://github.com/BerriAI/litellm/pull/29584)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 將 `strict` 與 `additionalProperties` 傳遞至 Converse `toolSpec` - [PR #29814](https://github.com/BerriAI/litellm/pull/29814)
    - 將 `xai.grok-4.3` 新增至 Bedrock Mantle SigV4 auth 的模型成本對照表 - [PR #31916](https://github.com/BerriAI/litellm/pull/31916)
    - Bedrock Mantle Responses API route 上的 SigV4/IAM auth - [PR #29788](https://github.com/BerriAI/litellm/pull/29788)
    - 尊重 `ttl` 於 `tool_config` 快取注入點的設定 - [PR #31929](https://github.com/BerriAI/litellm/pull/31929)
    - 將 `guardrailConfig` 對應至 InvokeModel guardrail 標頭 - [PR #31985](https://github.com/BerriAI/litellm/pull/31985)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 傳遞完整的 `imageConfig` dict 以供 Gemini 影像生成 - [PR #31811](https://github.com/BerriAI/litellm/pull/31811)
    - 在串流成功回呼中傳遞 Vertex AI 中繼資料 - [PR #29899](https://github.com/BerriAI/litellm/pull/29899)
    - 批次檔案採用單次媒體上傳，以修正大型上傳時的 499 錯誤 - [PR #31653](https://github.com/BerriAI/litellm/pull/31653)
- **[Google Gemini](../../docs/providers/gemini)**
    - 支援 Gemini TTS `languageCode` 參數 - [PR #29623](https://github.com/BerriAI/litellm/pull/29623)
    - 新的 Google Distributed Cloud（GDC）Gemini 提供者 - [PR #31895](https://github.com/BerriAI/litellm/pull/31895)
- **[Tencent](../../docs/providers)**
    - 新增 Tencent TokenHub 作為提供 DeepSeek V4 的提供者 - [PR #31903](https://github.com/BerriAI/litellm/pull/31903)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 在模型成本對照表中啟用 `glm-5p1` 的工具呼叫 - [PR #29697](https://github.com/BerriAI/litellm/pull/29697)
- **[Databricks](../../docs/providers/databricks)**
    - 拆分平行工具呼叫，讓每則工具訊息都接在其 `tool_calls` 之後 - [PR #31633](https://github.com/BerriAI/litellm/pull/31633)
- **一般**
    - 新增 Parasail 作為以 JSON 設定的 OpenAI 相容提供者 - [PR #29842](https://github.com/BerriAI/litellm/pull/29842)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 對 Opus 4.7/4.8 移除 `toolSpec.strict` 以解除工具呼叫阻塞 - [PR #31923](https://github.com/BerriAI/litellm/pull/31923)
    - 從 Claude Sonnet 4 的 `toolSpec` 中移除 `strict`/`additionalProperties` - [PR #31943](https://github.com/BerriAI/litellm/pull/31943)
    - 從 Converse 負載中省略空白的 `additionalModelRequestFields` 與 `system` - [PR #29565](https://github.com/BerriAI/litellm/pull/29565)
    - 對 DB 來源模型中的 AWS auth 參數先展開 `os.environ/` 參照，再展開所有欄位 - [PR #32256](https://github.com/BerriAI/litellm/pull/32256), [PR #32405](https://github.com/BerriAI/litellm/pull/32405)
- **[Anthropic](../../docs/providers/anthropic)**
    - 將串流 1h prompt-cache 寫入以 1h 費率計費 - [PR #32073](https://github.com/BerriAI/litellm/pull/32073)
    - 移除無法簽章的 thinking blocks，並在記錄中允許空值簽章 - [PR #31654](https://github.com/BerriAI/litellm/pull/31654)
    - 在 advisor 工具中要求呼叫者 `api_key` 並驗證 `api_base` - [PR #32093](https://github.com/BerriAI/litellm/pull/32093)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 透過 `supported_endpoints` 將 `/v1/messages` 直通至原生提供者端點 - [PR #31685](https://github.com/BerriAI/litellm/pull/31685)
    - 將 GitHub Copilot `/v1/messages` 路由至原生 Anthropic 端點 - [PR #31802](https://github.com/BerriAI/litellm/pull/31802)
    - 為 `/v1/messages` 端點新增 cache-control 注入支援 - [PR #31778](https://github.com/BerriAI/litellm/pull/31778)
- **[/v1/messages](../../docs/anthropic_unified)**
    - 移除 `/v1/messages` 上的頂層 `additional_drop_params` - [PR #31645](https://github.com/BerriAI/litellm/pull/31645)
- **[Image Generation](../../docs/image_generation)**
    - 支援 Azure AI MAI-Image-2.5 影像生成 - [PR #29688](https://github.com/BerriAI/litellm/pull/29688)
- **[A2A](../../docs/a2a)**
    - 支援 `a2a-sdk` 1.x 代理路由，適用於 0.3 和 1.0 代理程式 - [PR #30950](https://github.com/BerriAI/litellm/pull/30950)
- **[Sandbox](../../docs/sandbox)**
    - 當設定 `metadata.session_id` 時，在請求之間重用 e2b container - [PR #31688](https://github.com/BerriAI/litellm/pull/31688)
- **一般**
    - 將 response-headers hook 擴展至串流、TTS、影像生成，以及直通 - [PR #24232](https://github.com/BerriAI/litellm/pull/24232)
    - `websearch_interception` 代理迴圈針對 chat completions 和 Anthropic messages 的修正 - [PR #31669](https://github.com/BerriAI/litellm/pull/31669)
    - 讓 TinyFish 搜尋提供者採取寬鬆處理並回報錯誤 - [PR #31997](https://github.com/BerriAI/litellm/pull/31997)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 在 Responses-to-Chat 轉換中保留強制 function `tool_choice` 名稱 - [PR #29812](https://github.com/BerriAI/litellm/pull/29812)
    - 在 Responses bridge 中將僅含 system 的 chat request 對應到 system input 項目 - [PR #29817](https://github.com/BerriAI/litellm/pull/29817)
    - 在 `/v1/responses` 路由上將 `metadata.tags` 合併至 `litellm_metadata` - [PR #31793](https://github.com/BerriAI/litellm/pull/31793)
    - 依據模型資訊，將 GitHub Copilot `/v1/responses` 以每個模型進行路由 - [PR #29747](https://github.com/BerriAI/litellm/pull/29747)
    - 移除無法對應的 Bedrock Responses tools，而不是讓請求失敗 - [PR #31663](https://github.com/BerriAI/litellm/pull/31663)
- **[Realtime API](../../docs/realtime)**
    - 停止第二個 Gemini Live 設定、重試卡住的 handshake，並關閉 guardrail 繞過 - [PR #31519](https://github.com/BerriAI/litellm/pull/31519)
    - 在 `response.create` 上觸發 Nova Sonic 生成，讓 realtime sessions 不再卡住 - [PR #31924](https://github.com/BerriAI/litellm/pull/31924)
    - 將 realtime HTTP endpoints 透過 router 進行憑證解析 - [PR #32077](https://github.com/BerriAI/litellm/pull/32077)
- **[OCR](../../docs/ocr)**
    - 在 Azure AI doc-intelligence `/v1/ocr` 中保留內容、表格與 `keyValuePairs` - [PR #32018](https://github.com/BerriAI/litellm/pull/32018)
- **[A2A](../../docs/a2a)**
    - 在 A2A chat 轉換中填入回應使用量 - [PR #31980](https://github.com/BerriAI/litellm/pull/31980)
- **一般**
    - 在直通模式中原樣回傳上游錯誤回應主體 - [PR #32133](https://github.com/BerriAI/litellm/pull/32133)
    - 標準化 Anthropic 直通 server tool 使用方式 - [PR #29827](https://github.com/BerriAI/litellm/pull/29827)
    - 遮罩內嵌於備援錯誤訊息中的提供者憑證 - [PR #32083](https://github.com/BerriAI/litellm/pull/32083)
    - 在 Redis semantic cache 中支援 Responses 輸入 - [PR #29581](https://github.com/BerriAI/litellm/pull/29581)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰與存取控制**
    - 將 `permissions`、`/key/update`、`/key/regenerate`、`/user/new`、`/user/update` 以及批次金鑰更新設為僅管理員可用 - [PR #31810](https://github.com/BerriAI/litellm/pull/31810), [PR #31998](https://github.com/BerriAI/litellm/pull/31998), [PR #32002](https://github.com/BerriAI/litellm/pull/32002)
    - 將 `allowed_routes` 是否存在於 `/key/update` 與 `/key/regenerate` 設為僅管理員可用 - [PR #31987](https://github.com/BerriAI/litellm/pull/31987)
    - 為非管理員限制 `/key/generate` `budget_limits` 與權限 - [PR #31469](https://github.com/BerriAI/litellm/pull/31469)
    - 拒絕非管理員在個人金鑰上使用團隊範圍的 `object_permission` - [PR #31471](https://github.com/BerriAI/litellm/pull/31471)
    - 支援 `object_permission` 於 `default_key_generate_params` 中 - [PR #31776](https://github.com/BerriAI/litellm/pull/31776)
    - 拒絕非有限的 `budget_limits` 視窗，並在 `/key/generate` 上強制拒絕 CLI session-token 個人金鑰預算 - [PR #31630](https://github.com/BerriAI/litellm/pull/31630), [PR #31631](https://github.com/BerriAI/litellm/pull/31631)
    - 收緊 `/get/config/callbacks` 回應上的角色限制，並擴充 banned-params + admin-clear 清單 - [PR #31745](https://github.com/BerriAI/litellm/pull/31745), [PR #31742](https://github.com/BerriAI/litellm/pull/31742)
    - 稽核 default-user-settings 與其餘 system-wide-settings 更新 - [PR #31753](https://github.com/BerriAI/litellm/pull/31753), [PR #31754](https://github.com/BerriAI/litellm/pull/31754)
    - JWT auth 在無法解析的 claim 上改為選用回退至 DB team - [PR #28913](https://github.com/BerriAI/litellm/pull/28913)
    - 在建立 policy attachment 時，拒絕不存在的 team/key/model scope 項目 - [PR #32131](https://github.com/BerriAI/litellm/pull/32131)
- **UI**
    - shadcn migration 基礎：Tailwind v4、shadcn init 與 antd cascade 修正 - [PR #31995](https://github.com/BerriAI/litellm/pull/31995)
    - 將 chat UI 從 antd 遷移至 shadcn/ui，並新增金鑰管理與使用量面板 - [PR #32074](https://github.com/BerriAI/litellm/pull/32074)
    - 在專用 modal 中輪替模型憑證，避免一般儲存覆寫 secrets - [PR #28089](https://github.com/BerriAI/litellm/pull/28089)
    - 說明 Update API Key modal 僅會輪替 `api_key` - [PR #31805](https://github.com/BerriAI/litellm/pull/31805)
    - 在 edit-team-member 表單中新增預算持續時間 - [PR #29717](https://github.com/BerriAI/litellm/pull/29717)
    - 在公開 model hub 上顯示提供者圖示 - [PR #29958](https://github.com/BerriAI/litellm/pull/29958)

#### 錯誤 {#bugs-1}

- **虛擬金鑰與模型**
    - 在建立金鑰時向內部使用者顯示團隊專案 - [PR #28855](https://github.com/BerriAI/litellm/pull/28855)
    - 在金鑰編輯頁面將預設金鑰類型標示為「Full Access」 - [PR #29870](https://github.com/BerriAI/litellm/pull/29870)
    - 在刪除與重新整理之間保留 virtual-keys 篩選條件 - [PR #31533](https://github.com/BerriAI/litellm/pull/31533)
    - 允許在團隊被刪除後刪除 BYOK model，並在刪除團隊時刪除其 BYOK models - [PR #29875](https://github.com/BerriAI/litellm/pull/29875), [PR #29977](https://github.com/BerriAI/litellm/pull/29977)
    - 在 token counter 中僅計算舊版 `function_call.arguments` - [PR #31741](https://github.com/BerriAI/litellm/pull/31741)
    - 修正拼字錯誤 `generic_role_mappoings` -> `generic_role_mappings` - [PR #29753](https://github.com/BerriAI/litellm/pull/29753)
- **UI**
    - 防止 Request Logs 頁面在水平方向溢出，並調整其欄寬 - [PR #31426](https://github.com/BerriAI/litellm/pull/31426)
    - 修正 Router Settings Loadbalancing 分頁儲存問題 - [PR #31735](https://github.com/BerriAI/litellm/pull/31735)
    - 允許 skills 新增表單使用任何 git host - [PR #31652](https://github.com/BerriAI/litellm/pull/31652)
    - 在使用量匯出中包含 cache token 欄位 - [PR #32015](https://github.com/BerriAI/litellm/pull/32015)
    - 統一遷移後的 route URLs，並遷移 API Reference 頁面 - [PR #29953](https://github.com/BerriAI/litellm/pull/29953)
    - 讓 workflow runs 頁面填滿整個寬度 - [PR #29868](https://github.com/BerriAI/litellm/pull/29868)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Prometheus](../../docs/proxy/prometheus)**
    - 為 token、延遲、請求與快取指標新增一個 `api_provider` 標籤 - [PR #32126](https://github.com/BerriAI/litellm/pull/32126)
    - 新增 `litellm_overhead_with_guardrails_latency_metric` - [PR #31593](https://github.com/BerriAI/litellm/pull/31593)
    - 在自訂中繼資料標籤中公開 `project_alias`，並公開 MCP 工具中繼資料 - [PR #31784](https://github.com/BerriAI/litellm/pull/31784), [PR #31899](https://github.com/BerriAI/litellm/pull/31899)
    - 以逾時限制每次請求的預算指標發送 - [PR #31632](https://github.com/BerriAI/litellm/pull/31632)
- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 在串流 LLM span 上標記 `gen_ai.response.time_to_first_chunk` - [PR #32236](https://github.com/BerriAI/litellm/pull/32236)
    - 在 v2 錯誤 span 上還原 `error.*` span 屬性 - [PR #32524](https://github.com/BerriAI/litellm/pull/32524)
- **[S3](../../docs/proxy/logging)**
    - 在 PUT 時送出 `Content-MD5`，並在 s3 v2 記錄器中支援可選的伺服器端加密 - [PR #31928](https://github.com/BerriAI/litellm/pull/31928)
- **[Microsoft Sentinel](../../docs/proxy/logging)**
    - 從 `AZURE_SENTINEL_AUDIT_STREAM_NAME` 解析稽核串流 - [PR #32010](https://github.com/BerriAI/litellm/pull/32010)
- **[FOCUS Export](../../docs/proxy/cost_tracking)**
    - 在 Vantage FOCUS Tags 匯出中包含組織中繼資料，並為 FOCUS 匯出新增 GCS 目的地 - [PR #28184](https://github.com/BerriAI/litellm/pull/28184), [PR #29751](https://github.com/BerriAI/litellm/pull/29751)
- **一般**
    - 將即時成功記錄透過受限 worker 路由 - [PR #31733](https://github.com/BerriAI/litellm/pull/31733)
    - 還原 admin key/team `callback_vars.turn_off_message_logging` 覆寫 - [PR #31905](https://github.com/BerriAI/litellm/pull/31905)
    - 在標準記錄中解析代理程式自訂定價的 `model_map_value` - [PR #31940](https://github.com/BerriAI/litellm/pull/31940)
    - 記錄雜湊後的快取金鑰 - [PR #29890](https://github.com/BerriAI/litellm/pull/29890)
    - 為 UI 回呼測試新增 Galileo 健康檢查 - [PR #29908](https://github.com/BerriAI/litellm/pull/29908)

### 防護欄 {#guardrails}

- **[Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 使用 Model Armor 掃描檔案與文件附件 - [PR #31655](https://github.com/BerriAI/litellm/pull/31655)
- **[CrowdStrike AIDR](../../docs/proxy/guardrails)**
    - 擷取使用者與模型中繼資料，並從兩個 metadata bag 讀取身分 - [PR #29517](https://github.com/BerriAI/litellm/pull/29517), [PR #29991](https://github.com/BerriAI/litellm/pull/29991)
- **[Headroom](../../docs/proxy/guardrails)**
    - 透過代理式迴圈新增 CCR（compress-cache-retrieve） - [PR #31681](https://github.com/BerriAI/litellm/pull/31681)
    - 為 headroom 防護欄新增 `unreachable_fallback` fail-open 選項 - [PR #32026](https://github.com/BerriAI/litellm/pull/32026)
- **一般**
    - 在遭到審核前先緩衝串流回應，封鎖時提供乾淨的 SSE - [PR #31389](https://github.com/BerriAI/litellm/pull/31389)
    - 在 `generic_guardrail_api` 上公開串流旋鈕 - [PR #31730](https://github.com/BerriAI/litellm/pull/31730)
    - 在外部點擊時保持 create-guardrail 視窗開啟，並將 guardrails 頁面預設為 Guardrails 分頁 - [PR #29871](https://github.com/BerriAI/litellm/pull/29871), [PR #29872](https://github.com/BerriAI/litellm/pull/29872)

### 秘密管理員 {#secret-managers}

- **一般**
    - 具版本化格式與重新加密遷移的 AES-256-GCM 靜態憑證加密 - [PR #31215](https://github.com/BerriAI/litellm/pull/31215)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預算與備援**
    - 在 key 層級提供 `budget_fallbacks`，當超過每個模型的預算時重新路由請求 - [PR #31783](https://github.com/BerriAI/litellm/pull/31783), 並在 key 建立/編輯表單上提供 UI 設定 - [PR #32072](https://github.com/BerriAI/litellm/pull/32072)
    - 新增 `disable_budget_reservation` 一般設定 - [PR #29493](https://github.com/BerriAI/litellm/pull/29493)
    - 將 team-budget 調高保留給 proxy 管理員，且不要因預算未變更而阻擋 `/team/update` - [PR #30030](https://github.com/BerriAI/litellm/pull/30030), [PR #29525](https://github.com/BerriAI/litellm/pull/29525)
    - 防止在並行超過門檻時重複寄送預算警示電子郵件，並對其套用 `EMAIL_SIGNATURE` - [PR #32011](https://github.com/BerriAI/litellm/pull/32011), [PR #31712](https://github.com/BerriAI/litellm/pull/31712)
- **成本追蹤**
    - 以 `category`、`rate_limit_type`、`model` 與 `llm_provider` 欄位標準化 rate-limit 錯誤 - [PR #27687](https://github.com/BerriAI/litellm/pull/27687)
    - 儲存 `/v1/realtime` 會話的成本明細 - [PR #30069](https://github.com/BerriAI/litellm/pull/30069)
    - 追蹤未受管理 Vertex AI 批次工作成本 - [PR #31442](https://github.com/BerriAI/litellm/pull/31442)
    - 回報被封鎖回應上的實際 token 用量 - [PR #31217](https://github.com/BerriAI/litellm/pull/31217)
    - 在 `/messages` 與 `/generateContent` 上發出 `x-litellm-response-cost` 標頭 - [PR #31675](https://github.com/BerriAI/litellm/pull/31675)
    - 在傳遞式成本追蹤中將 `*.cognitiveservices.azure.com` 辨識為 OpenAI 相容 - [PR #29730](https://github.com/BerriAI/litellm/pull/29730)
    - 在 A2A 原生送出路徑上記錄代理程式 `cost_per_query` 與輸入 token - [PR #31979](https://github.com/BerriAI/litellm/pull/31979)
    - 只將活躍使用者計入授權席次上限 - [PR #31227](https://github.com/BerriAI/litellm/pull/31227)
    - 記錄每種 token 類型的推理與快取成本明細 - [PR #31623](https://github.com/BerriAI/litellm/pull/31623)

## MCP 閘道 {#mcp-gateway}

- **OAuth 2.0（On-Behalf-Of）v2**
    - 將 token_exchange (OBO) 分支移轉到 v2 resolver，並透過 discovery threading、稽核強化與 RFC 9728 challenge 使其可投入正式環境 - [PR #31526](https://github.com/BerriAI/litellm/pull/31526), [PR #31622](https://github.com/BerriAI/litellm/pull/31622)
    - 透過 RFC 9728 -> RFC 8414 探索 OBO token endpoint，而不是猜測 IdP - [PR #31762](https://github.com/BerriAI/litellm/pull/31762)
    - 保留 DCR `client_id`，讓互動式 OAuth token 更新可運作，包括 on-create Authorize & Fetch - [PR #31912](https://github.com/BerriAI/litellm/pull/31912), [PR #31920](https://github.com/BerriAI/litellm/pull/31920)
    - 在 token endpoint 權威性地解析每位使用者的 OAuth 身分 - [PR #31657](https://github.com/BerriAI/litellm/pull/31657)
    - 支援上游 OAuth token endpoint 的 `client_secret_basic`，並在 UI 中新增 token-endpoint auth-method 選擇器 - [PR #31635](https://github.com/BerriAI/litellm/pull/31635), [PR #31739](https://github.com/BerriAI/litellm/pull/31739)
    - 依據 `auth_type=oauth2` 限制 OAuth authorize/token/register/discovery - [PR #31736](https://github.com/BerriAI/litellm/pull/31736)
    - 鏡像上游 token 存續時間，而不是強制 1 小時 OBO 到期 - [PR #29951](https://github.com/BerriAI/litellm/pull/29951)
    - 在 create-server 視窗關閉時重設 OAuth 狀態，讓先前伺服器的 token 不再洩漏到下一次 add-server 工作階段 - [PR #30000](https://github.com/BerriAI/litellm/pull/30000)
    - 允許非建立者使用者以 OAuth 登入 OBO 模式伺服器，並在 authorize/token 檢查中允許 team access-group 授權 - [PR #29867](https://github.com/BerriAI/litellm/pull/29867), [PR #30041](https://github.com/BerriAI/litellm/pull/30041)
- **伺服器管理與工具**
    - 為大型工具目錄新增 `mcp_tool_search` 虛擬工具 - [PR #31777](https://github.com/BerriAI/litellm/pull/31777)
    - 限制每個 MCP server 的對外工具呼叫並行數 - [PR #31641](https://github.com/BerriAI/litellm/pull/31641)
    - 新增 `all-proxy-mcpservers` sentinel，以授權團隊擁有每個 MCP server - [PR #32012](https://github.com/BerriAI/litellm/pull/32012)
    - 將 MCP 工具支出彙總到使用者計數器與使用量 UI - [PR #31576](https://github.com/BerriAI/litellm/pull/31576)
    - 在 `store_model_in_db` 為 false 時，於啟動時從 DB 載入 MCP server registry - [PR #31775](https://github.com/BerriAI/litellm/pull/31775)
    - 在 otel_v2 下為 MCP discovery 發出 `tools/list` CLIENT span - [PR #31525](https://github.com/BerriAI/litellm/pull/31525)
- **錯誤修正**
    - 阻止一個未驗證的 server 清空彙總 `tools/list` - [PR #31684](https://github.com/BerriAI/litellm/pull/31684)
    - 將 `tools/list` 驗證失敗在單一 server 路由上顯示為 401 challenge - [PR #31921](https://github.com/BerriAI/litellm/pull/31921)
    - 透過 OBO/passthrough-aware GET 路徑載入 MCP 工具組態工具 - [PR #29960](https://github.com/BerriAI/litellm/pull/29960)
    - 收緊 `/v1/mcp/server/submissions` 的基於角色可見性 - [PR #31932](https://github.com/BerriAI/litellm/pull/31932)
    - 當已登入使用者缺少每位使用者的環境變數時，將 MCP 卡片標示為紅色 - [PR #29856](https://github.com/BerriAI/litellm/pull/29856)
    - BYOM 可見性、預覽 UX 與 admin-settings 門檻控管 - [PR #31809](https://github.com/BerriAI/litellm/pull/31809)
    - 重新加入聊天 UI，並允許 MCP OBO auth 使用簡易 UI - [PR #31893](https://github.com/BerriAI/litellm/pull/31893)
    - 在 create-server 視窗於關閉狀態掛載時，讓進行中的 OAuth resume 不會重設 - [PR #32416](https://github.com/BerriAI/litellm/pull/32416)

## 效能／負載平衡／可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **支出與 Auth 熱路徑**
    - 彙整各個獨立作用域的支出計數器遞增 - [PR #31578](https://github.com/BerriAI/litellm/pull/31578)
    - 將 cost-callback 負載的 deep copy 移出請求事件迴圈 - [PR #31579](https://github.com/BerriAI/litellm/pull/31579)
    - 彙整 `common_checks` 中獨立的呼叫前預算強制執行讀取 - [PR #31604](https://github.com/BerriAI/litellm/pull/31604)
    - 將每個請求的 OTel runtime hooks 延遲匯入結果做記憶化 - [PR #31707](https://github.com/BerriAI/litellm/pull/31707)
    - 從快速的 v2 端點載入 virtual-keys 團隊篩選器 - [PR #31638](https://github.com/BerriAI/litellm/pull/31638)
- **可靠性**
    - 在主要 DB 啟動時離線時，持續從讀取複本提供讀取服務 - [PR #31951](https://github.com/BerriAI/litellm/pull/31951)
    - 在節點重新啟動後重新建立非同步 Redis 叢集連線 - [PR #31577](https://github.com/BerriAI/litellm/pull/31577)
    - 將有問題的 spend-log 資料列隔離，避免單一損壞記錄拖垮整個批次 - [PR #31705](https://github.com/BerriAI/litellm/pull/31705)
    - 停止在啟動 DEBUG 記錄中洩漏 `master_key` 和 `database_url` - [PR #31944](https://github.com/BerriAI/litellm/pull/31944)
- **路由**
    - 透過 `!` 前綴支援標籤路由黑名單 - [PR #31728](https://github.com/BerriAI/litellm/pull/31728)
    - 針對未知模型的宣告式備援泛化 - [PR #29718](https://github.com/BerriAI/litellm/pull/29718)
    - 對 semantic auto_router 部署略過健康檢查 - [PR #31668](https://github.com/BerriAI/litellm/pull/31668)
- **建置**
    - 將 wolfi-base digest 升級至 glibc 2.43-r10 - [PR #32277](https://github.com/BerriAI/litellm/pull/32277)

## 文件更新 {#documentation-updates}

- 在貢獻指南中，要求對回報的問題提供重現影片 - [PR #30063](https://github.com/BerriAI/litellm/pull/30063)

### 依歸屬區域彙整的 PR {#pr-roll-up-by-ownership-area}

依歸屬區域分類的 PR（總計：226）

- LLM API 端點：30
- UI：28
- MCP：28
- 模型與提供者：27
- 其他（CI / chore / tests / version bumps）：24
- Auth 與管理：23
- 記錄：22
- 支出 / 預算 / Rate Limits：18
- 防護欄：12
- 效能：11
- 文件：2
- Secret Managers：1

## 新貢獻者 {#new-contributors}

- @roytev 在 [PR #29565](https://github.com/BerriAI/litellm/pull/29565) 完成他們的第一次貢獻
- @balcsida 在 [PR #29581](https://github.com/BerriAI/litellm/pull/29581) 完成他們的第一次貢獻
- @PigeonMark 在 [PR #29584](https://github.com/BerriAI/litellm/pull/29584) 完成他們的第一次貢獻
- @johngarrido 在 [PR #29623](https://github.com/BerriAI/litellm/pull/29623) 完成他們的第一次貢獻
- @arnav-144p 在 [PR #29753](https://github.com/BerriAI/litellm/pull/29753) 完成他們的第一次貢獻
- @Kaihuang724 在 [PR #29842](https://github.com/BerriAI/litellm/pull/29842) 完成他們的第一次貢獻
- @fengjikui 在 [PR #29890](https://github.com/BerriAI/litellm/pull/29890) 完成他們的第一次貢獻
- @fernando-izar 在 [PR #31632](https://github.com/BerriAI/litellm/pull/31632) 完成他們的第一次貢獻

## 完整變更記錄 {#full-changelog}

[`v1.91.0...v1.92.0`](https://github.com/BerriAI/litellm/compare/v1.91.0...v1.92.0)
