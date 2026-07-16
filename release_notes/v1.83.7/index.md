---
title: "v1.83.7-stable - 每位使用者的 MCP OAuth、團隊支出記錄 RBAC"
slug: "v1-83-7-stable"
date: 2026-04-18T00:00:00
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
docker.litellm.ai/berriai/litellm:main-v1.83.7-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.83.7
```

</TabItem>
</Tabs>

:::warning

**破壞性變更 — Prometheus 延遲直方圖 bucket 已減少。** 預設的 `LATENCY_BUCKETS` 集合已從 35 個邊界減少為 18 個邊界，以降低 Prometheus 的基數。參照特定 `le=` bucket 值的儀表板和 PromQL 查詢可能會停止比對。升級前請檢視您的警示/儀表板，並在需要時使用 `LATENCY_BUCKETS` 環境變數覆寫以還原先前的邊界 — [PR #25527](https://github.com/BerriAI/litellm/pull/25527)。

:::

## 重點摘要 {#key-highlights}

- **每位使用者的 MCP OAuth Tokens** — [每位終端使用者現在都可以在互動式 MCP 伺服器流程中持有自己的 OAuth tokens，將不同使用者的憑證彼此隔離](../../docs/mcp)
- **團隊支出記錄 RBAC** — 具有 `/spend/logs` 權限的團隊可從 UI 和 API 檢視整個團隊的支出記錄
- **批次團隊權限 API** — 新的 `POST /team/permissions_bulk_update` 端點，可在一次呼叫中更新多個團隊的成員權限
- **Azure 容器路由** — Azure Responses API containers 的容器路由、受管理容器 ID，以及刪除回應解析
- **UI E2E 測試套件** — 基於 Playwright 的 proxy 管理員、團隊與金鑰管理流程端對端測試 այժմ 在 CI 中執行

---

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援（14 個新模型） {#new-model-support-14-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| AWS Bedrock（GovCloud） | `bedrock/us-gov-east-1/anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.30 | $16.50 | 對話、視覺、工具使用、提示快取、推理 |
| AWS Bedrock（GovCloud） | `bedrock/us-gov-west-1/anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.30 | $16.50 | 對話、視覺、工具使用、提示快取、推理 |
| AWS Bedrock（GovCloud） | `us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.30 | $16.50 | Bedrock Converse，並採用 200K 以上級距定價 |
| Baseten | `baseten/MiniMaxAI/MiniMax-M2.5` | - | $0.30 | $1.20 | 對話 |
| Baseten | `baseten/nvidia/Nemotron-120B-A12B` | - | $0.30 | $0.75 | 對話 |
| Baseten | `baseten/zai-org/GLM-5` | - | $0.95 | $3.15 | 對話 |
| Baseten | `baseten/zai-org/GLM-4.7` | - | $0.60 | $2.20 | 對話 |
| Baseten | `baseten/zai-org/GLM-4.6` | - | $0.60 | $2.20 | 對話 |
| Baseten | `baseten/moonshotai/Kimi-K2.5` | - | $0.60 | $3.00 | 對話 |
| Baseten | `baseten/moonshotai/Kimi-K2-Thinking` | - | $0.60 | $2.50 | 對話 |
| Baseten | `baseten/moonshotai/Kimi-K2-Instruct-0905` | - | $0.60 | $2.50 | 對話 |
| Baseten | `baseten/openai/gpt-oss-120b` | - | $0.10 | $0.50 | 對話 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V3.1` | - | $0.50 | $1.50 | 對話 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V3-0324` | - | $0.77 | $0.77 | 對話 |

#### 功能 {#features}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 支援 AWS GovCloud 模式（`us-gov` 前綴 routing） - [PR #25254](https://github.com/BerriAI/litellm/pull/25254)
    - 更新 GovCloud Claude Sonnet 4.5 定價，將 `max_tokens` 提高至 8192，並新增提示快取成本
    - 當設定 assistant 前綴 prefill 時，略過 dummy `user` continue 訊息 - [PR #25419](https://github.com/BerriAI/litellm/pull/25419)
    - 避免在 Anthropic Messages 串流用量中重複計算快取 tokens - [PR #25517](https://github.com/BerriAI/litellm/pull/25517)
- **[Anthropic](../../docs/providers/anthropic)**
    - 支援 `advisor_20260301` tool type - [PR #25525](https://github.com/BerriAI/litellm/pull/25525)
- **[Triton](../../docs/providers/triton-inference-server)**
    - 自架 Triton 回應的 embedding 用量估算 - [PR #25345](https://github.com/BerriAI/litellm/pull/25345)
- **[Baseten](../../docs/providers/baseten)**
    - 新增 11 個 Baseten 託管模型的定價項目 - [PR #25358](https://github.com/BerriAI/litellm/pull/25358)
- **[Google Gemini / Vertex AI](../../docs/providers/gemini)**
    - 將適用的 Gemini 2.5/3 模型標記為 `supports_service_tier`

### 錯誤修正 {#bug-fixes}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - Bedrock JSON body 與 multipart uploads 的透傳修正 - [PR #25464](https://github.com/BerriAI/litellm/pull/25464)
- **[OpenAI](../../docs/providers/openai)**
    - 在 `test_completion_fine_tuned_model` 中模擬標頭以穩定測試 - [PR #25444](https://github.com/BerriAI/litellm/pull/25444)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - Containers：Azure routing、受管理容器 ID，以及刪除回應解析 - [PR #25287](https://github.com/BerriAI/litellm/pull/25287)
    - WebSocket：將 `?model=` 附加到後端 WebSocket URL，以便模型選擇正確路由 - [PR #25437](https://github.com/BerriAI/litellm/pull/25437)
- **[OpenAI / Files API](../../docs/providers/openai)**
    - 為 OpenAI 與相關工具新增檔案內容串流支援 - [PR #25450](https://github.com/BerriAI/litellm/pull/25450)
- **[A2A](../../docs/mcp)**
    - 建立 A2A 用戶端時預設 60 秒逾時 - [PR #25514](https://github.com/BerriAI/litellm/pull/25514)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 在串流中將拒絕 `stop_reason` 對應為 `incomplete` 狀態 - [PR #25498](https://github.com/BerriAI/litellm/pull/25498)
    - 修正 Responses WebSocket 路徑中的重複關鍵字引數錯誤 - [PR #25513](https://github.com/BerriAI/litellm/pull/25513)
- **路由器**
    - 對未加前綴的模型名稱傳遞 `custom_llm_provider` 給 `get_llm_provider` - [PR #25334](https://github.com/BerriAI/litellm/pull/25334)
    - 啟用 `encrypted_content_affinity` 時修正基於標籤的 routing - [PR #25347](https://github.com/BerriAI/litellm/pull/25347)
- **一般**
    - 確保在 web-search 攔截時 `stream=True` 會執行支出/成本記錄 - [PR #25424](https://github.com/BerriAI/litellm/pull/25424)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **團隊 + 組織**
    - 新的 `POST /team/permissions_bulk_update` 端點，用於跨團隊批次更新權限 - [PR #25239](https://github.com/BerriAI/litellm/pull/25239)
    - 團隊成員權限 `/spend/logs` 可檢視整個團隊的支出記錄（UI + RBAC）- [PR #25458](https://github.com/BerriAI/litellm/pull/25458)
    - 對齊 org 與 team 端點的權限檢查 - [PR #25554](https://github.com/BerriAI/litellm/pull/25554)
- **虛擬金鑰**
    - 將 `/v2/key/info` 回應處理與 v1 對齊 - [PR #25313](https://github.com/BerriAI/litellm/pull/25313)
- **驗證 / 路由**
    - 允許 JWT 覆寫 OAuth2 routing，而不需要全域啟用 OAuth2 - [PR #25252](https://github.com/BerriAI/litellm/pull/25252)
    - 將 UI 與 API tokens 的 route auth 整併 - [PR #25473](https://github.com/BerriAI/litellm/pull/25473)
    - 對 `combined_view` token 查詢使用參數化查詢 - [PR #25467](https://github.com/BerriAI/litellm/pull/25467)
- **提供者憑證**
    - 透過 `model_config` metadata 進行每團隊 / 每專案憑證覆寫 - [PR #24438](https://github.com/BerriAI/litellm/pull/24438)
- **UI**
    - 改善瀏覽器儲存體處理與 Dockerfile 一致性 - [PR #25384](https://github.com/BerriAI/litellm/pull/25384)
    - 將 v1 guardrail 與 agent 清單回應的 field 處理與 v2 對齊 - [PR #25478](https://github.com/BerriAI/litellm/pull/25478)
    - 在 `user_edit_view` 測試中 flush Tremor Tooltip timers - [PR #25480](https://github.com/BerriAI/litellm/pull/25480)

#### 錯誤 {#bugs-1}

- 改善管理端點的輸入驗證 - [PR #25445](https://github.com/BerriAI/litellm/pull/25445)
- 強化 skill archive 解壓縮中的檔案路徑解析 - [PR #25475](https://github.com/BerriAI/litellm/pull/25475)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Ramp](../../docs/proxy/logging)**
    - 將 Ramp 新增為內建成功回呼 - [PR #23769](https://github.com/BerriAI/litellm/pull/23769)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 保留 `/v1/messages` Langfuse traces 上的 proxy key-auth 中繼資料 - [PR #25448](https://github.com/BerriAI/litellm/pull/25448)
- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 將預設 `LATENCY_BUCKETS` 從 35 → 18 個邊界 - [PR #25527](https://github.com/BerriAI/litellm/pull/25527)
- **一般**
    - S3 記錄：針對暫時性 503/500 錯誤使用指數退避重試 - [PR #25530](https://github.com/BerriAI/litellm/pull/25530)

### 防護欄 {#guardrails}

- 在統一的防護欄輸入中可選擇略過系統訊息 - [PR #25481](https://github.com/BerriAI/litellm/pull/25481)
- 內嵌 IAM：套用防護欄支援 - [PR #25241](https://github.com/BerriAI/litellm/pull/25241)
- 在防護欄錯誤中保留 `dict` `HTTPException.detail` 與 Bedrock 背景資訊 - [PR #25558](https://github.com/BerriAI/litellm/pull/25558)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 與 Session-TZ 無關的支出／錯誤記錄查詢日期篩選 - [PR #25542](https://github.com/BerriAI/litellm/pull/25542)
- 批次限制過時受管物件清理，以避免 300K+ 列更新 - [PR #25258](https://github.com/BerriAI/litellm/pull/25258)

## MCP 閘道 {#mcp-gateway}

- **互動式 MCP 流程的每位使用者 OAuth token 儲存** - [PR #25441](https://github.com/BerriAI/litellm/pull/25441)
- 透過 MCP `stdio` 傳輸阻擋任意命令執行 - [PR #25343](https://github.com/BerriAI/litellm/pull/25343)
- 在不存在已儲存的每位使用者 token 時，還原觸發 PKCE 的 401 - [commit e0d5c28](https://github.com/BerriAI/litellm/commit/e0d5c28db02b3219dbd944666a55f49732197922)
- 在 `config_settings` 中說明缺少的 MCP 每位使用者 token 環境變數 - [PR #25471](https://github.com/BerriAI/litellm/pull/25471)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- 降低 Prometheus 延遲直方圖的基數（預設區間 35 → 18） - [PR #25527](https://github.com/BerriAI/litellm/pull/25527)
- 針對暫時性錯誤進行 S3 指數退避重試 - [PR #25530](https://github.com/BerriAI/litellm/pull/25530)

## 文件更新 {#documentation-updates}

- 新增涵蓋 cosign 驗證與部署最佳實務的 Docker 映像安全指南 - [PR #25439](https://github.com/BerriAI/litellm/pull/25439)
- 文件化 4 月 townhall 公告 - [PR #25537](https://github.com/BerriAI/litellm/pull/25537)
- 文件化缺少的 MCP 每位使用者 token 環境變數 - [PR #25471](https://github.com/BerriAI/litellm/pull/25471)
- 在 PR 範本中新增「Screenshots / Proof of Fix」章節 - [PR #25564](https://github.com/BerriAI/litellm/pull/25564)

## 基礎架構 / 安全性備註 {#infrastructure--security-notes}

- 將 cosign.pub 驗證釘選到初始 commit hash - [PR #25273](https://github.com/BerriAI/litellm/pull/25273)
- 修正 npm 升級後 Dockerfile 中的 node-gyp symlink 路徑 - [PR #25048](https://github.com/BerriAI/litellm/pull/25048)
- `Dockerfile.non_root`：妥善處理缺少的 `.npmrc` - [PR #25307](https://github.com/BerriAI/litellm/pull/25307)
- 新增具備本機 PostgreSQL 的 Playwright E2E 測試 - [PR #25126](https://github.com/BerriAI/litellm/pull/25126)
- 代理管理員團隊與金鑰管理的 UI E2E 測試 - [PR #25365](https://github.com/BerriAI/litellm/pull/25365)
- 將 Redis 快取測試從 GHA 遷移至 CircleCI - [PR #25354](https://github.com/BerriAI/litellm/pull/25354)
- 更新 `check_responses_cost` 的 `_expire_stale_rows` 測試 - [PR #25299](https://github.com/BerriAI/litellm/pull/25299)
- 提高全域 vitest timeout 並移除每個測試的覆寫 - [PR #25468](https://github.com/BerriAI/litellm/pull/25468)
- 版本升級與 UI 重建：[PR #25316](https://github.com/BerriAI/litellm/pull/25316), [PR #25528](https://github.com/BerriAI/litellm/pull/25528), [PR #25578](https://github.com/BerriAI/litellm/pull/25578), [PR #25571](https://github.com/BerriAI/litellm/pull/25571), [PR #25573](https://github.com/BerriAI/litellm/pull/25573), [PR #25577](https://github.com/BerriAI/litellm/pull/25577)

## 新貢獻者 {#new-contributors}

* @kedarthakkar 完成了他們的首次貢獻於 https://github.com/BerriAI/litellm/pull/23769
* @csoni-cweave 完成了他們的首次貢獻於 https://github.com/BerriAI/litellm/pull/25441
* @jimmychen-p72 完成了他們的首次貢獻於 https://github.com/BerriAI/litellm/pull/25530

**完整變更紀錄**：https://github.com/BerriAI/litellm/compare/v1.83.3-stable...v1.83.7-stable
