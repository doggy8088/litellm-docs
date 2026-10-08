---
title: "v1.96.0 - MCP 權益、Redis 設定同步與自動路由器脈絡"
slug: "v1-96-0"
date: 2026-08-09T00:00:00
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
docker.litellm.ai/berriai/litellm:1.96.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.96.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**模擬測試請求參數受到單一組態旗標控管。** 先前有六個 `mock_*` 請求參數存在三種不同行為，而被移除的參數會回傳一般成功，因此備援演練可能在完全沒有執行的情況下通過。現在這六個參數都會以 400 拒絕，並指出參數與金鑰，除非管理員在 `config.yaml` 中設定 `general_settings.dangerously_allow_mock_testing_request_params: true`；此旗標無法從 Admin UI 或 API 變更。請參閱 [PR #35423](https://github.com/BerriAI/litellm/pull/35423)。

**無金鑰閘道 OAuth 現在允許任何 MCP 範圍的 session bearer。** session-bearer 的允許與 RFC 9728 `WWW-Authenticate` 挑戰會在每個伺服器的 MCP URL 路徑上觸發，而不僅限於彙總的 `/mcp/` 範圍，因此先前會直接遭到拒絕的每伺服器路徑現在會發出挑戰。請參閱 [PR #34856](https://github.com/BerriAI/litellm/pull/34856)。

:::

## 主要亮點 {#key-highlights}

- **MCP 權益終於直接與人員綁定，而不只是金鑰** - 內部使用者的 `object_permission` 現在作為一個 MCP 權益等級，會與金鑰、團隊、代理程式和組織範圍相交集，會在 `tools/list` 與 `tools/call` 時讀取，由 `/user/new` 與 `/user/update` 保留，並由 `/v2/user/info` 回傳，且可從內部使用者頁面編輯。
- **防護欄終於可以看見 MCP 工具回應** - 新的 `post_mcp_call` 模式會將工具回應文字導入統一的 `apply_guardrail` 接點，因此防護欄可以遮蔽回應中的值，或直接拒絕它；先前回傳敏感資料的工具會繞過所有防護欄。
- **設定變更會立即傳播到每個 pod** - 管理寫入會在協調 Redis 上發佈失效事件，而每個 pod 在收到後會重新同步，透過抖動去抖並限制為每 10 秒最多一次重新同步，取代了模型、憑證與設定上 30 秒的輪詢延遲。沒有 Redis 時，雙方都不執行任何動作，而輪詢行為維持不變。
- **OpenAI 下調 GPT-5.6 價格** - `gpt-5.6-terra` 下調 20%，`gpt-5.6-luna` 下調 80%，並同步反映到 Bedrock Mantle，另外在 `gpt-5.6` 家族上新增超過 272K 的 flex 長脈絡費率，以及修正公開標示的 `gpt-5.4-mini` 與 `gpt-5.4-nano` 脈絡視窗。
- **自動路由器學會它實際上正在路由什麼** - 複雜度分類器現在會看見前文回合與 assistant 回合，評估一則簡短回覆所核准的內容，將其準則關閉於它被提供的視窗，並在花費記錄與記錄抽屜中記錄其分層決策、請求本文與其自身的分類器呼叫。
- **預算成為一級管理介面** - 一個通用的 `/management/v1` 清單合約落地，並在其上加入 `GET /management/v1/budgets`，而預算頁面也新增排序、篩選與搜尋。
- **大型部署的營運強化** - 可選的 `database_statement_timeout` 與 `database_lock_timeout`、在每次 migration 後重新套用的可選 `REPLICA IDENTITY FULL`、元件化 Helm chart 上的 pod 強化與 migration Job 參數，以及無法連線的 Redis 不再阻擋每一個請求。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（2 個新模型） {#new-model-support-2-new-models}

| 提供者 | 模型 | 脈絡視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| DashScope | `dashscope/qwen3.7-max` | 991.8K | $2.50 | $7.50 | 推理、函式呼叫、工具選擇、提示快取、回應結構 |
| DashScope | `dashscope/qwen3.7-plus` | 991.8K | $0.40（分級） | $1.60（分級） | 推理、視覺、函式呼叫、工具選擇、提示快取、回應結構 |

`dashscope/qwen3.7-plus` 採兩級定價：每 100 萬 tokens 於 256K tokens 以下為 $0.40 / $1.60，256K 以上為每 100 萬 tokens $1.20 / $4.80。

除了新增項目之外，此版本也將 OpenAI 的降價套用到 GPT-5.6 家族：`gpt-5.6-terra` 由每 100 萬 tokens $2.50 / $15.00 降為 $2.00 / $12.00，而 `gpt-5.6-luna` 則由每 100 萬 tokens $1.00 / $6.00 降為 $0.20 / $1.20，且同樣的降幅也同步套用到 `bedrock_mantle/openai.gpt-5.6-terra` 與 `bedrock_mantle/openai.gpt-5.6-luna`，並一致適用於 batch、flex、priority 與 cache 變體。超過 272K tokens 的 flex 長脈絡費率新增到 `gpt-5.6`、`gpt-5.6-sol`、`gpt-5.6-terra` 與 `gpt-5.6-luna`。`gpt-5.4-mini` 與 `gpt-5.4-nano` 上公告的脈絡視窗已在 OpenAI、Azure 與 Azure AI Foundry 中從 1.05M 更正為 272K，而 Azure AI 的超過 272K 分級也一併移除。Fireworks AI Kimi K2.5、K2.6 與 K2.7 的最大輸出 tokens 由 262,144 降為 32,768。沒有移除任何定價項目。

#### 功能 {#features}

- **[DashScope](../../docs/providers/dashscope)**
    - 將 `qwen3.7-plus` 與 `qwen3.7-max` 新增至模型成本對照表 - [PR #35123](https://github.com/BerriAI/litellm/pull/35123)

### 錯誤修正 {#bug-fixes}

- **[OpenAI](../../docs/providers/openai)**
    - 更正 OpenAI、Bedrock 與 flex 長脈絡的 GPT-5.6 價格 - [PR #35270](https://github.com/BerriAI/litellm/pull/35270)
    - 依照 OpenAI 公開費率調整 `gpt-5.6-terra` 與 `gpt-5.6-luna` 價格 - [PR #35258](https://github.com/BerriAI/litellm/pull/35258)
    - 更正 `gpt-5.4-mini` 與 `gpt-5.4-nano` token 限制 - [PR #35182](https://github.com/BerriAI/litellm/pull/35182)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 在 Vertex Gemini 3+ 工具回合轉送 `function_call` id - [PR #34603](https://github.com/BerriAI/litellm/pull/34603)
    - 停止向 Gemini 傳送重複的 `thoughtSignature` 副本 - [PR #35004](https://github.com/BerriAI/litellm/pull/35004)
    - 當快取區塊在模型回合結束時，略過脈絡快取 - [PR #35172](https://github.com/BerriAI/litellm/pull/35172)
- **[Anthropic](../../docs/providers/anthropic)**
    - 依有效負載種類拆分混合串流區塊 - [PR #35289](https://github.com/BerriAI/litellm/pull/35289)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 依歸因身分快取 `AssumeRole` 憑證 - [PR #35467](https://github.com/BerriAI/litellm/pull/35467)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 更正 Kimi K2.5、K2.6 與 K2.7 的最大輸出 token 限制 - [PR #35174](https://github.com/BerriAI/litellm/pull/35174)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **一般**
    - 預設向上游請求串流使用量，並將其自用戶端串流中移除 - [PR #35290](https://github.com/BerriAI/litellm/pull/35290)

#### 錯誤 {#bugs}

- **[Anthropic `/v1/messages`](../../docs/anthropic_unified)**
    - 以真正的上游類型開啟第一個內容區塊，讓以推理為先的串流以 thinking 開始 - [PR #34433](https://github.com/BerriAI/litellm/pull/34433)
    - 為非 Claude 目標轉譯 `stop_sequences` 與停用 thinking - [PR #34589](https://github.com/BerriAI/litellm/pull/34589)
- **[Responses API](../../docs/response_api)**
    - 將所有文件化的串流中錯誤代碼對應到實際 HTTP 狀態 - [PR #35307](https://github.com/BerriAI/litellm/pull/35307)
- **[批次](../../docs/batches)**
    - 在背景建立的輸出檔案 id 上編碼公開模型群組 - [PR #35406](https://github.com/BerriAI/litellm/pull/35406)
- **受管理檔案**
    - 從每個模型的 `litellm_params` 取得 Vertex AI 受管理檔案讀取儲存桶與憑證 - [PR #34847](https://github.com/BerriAI/litellm/pull/34847)
- **[直通](../../docs/pass_through/vertex_ai)**
    - 根據請求本文決定 Vertex `rawPredict` passthrough 串流 - [PR #34672](https://github.com/BerriAI/litellm/pull/34672)
- **A2A**
    - 保持由設定定義的代理程式已註冊，並接受文件中記載的 `agents:` key - [PR #35163](https://github.com/BerriAI/litellm/pull/35163)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **管理 API**
    - `/management/v1` 實體清單的通用 list 合約 - [PR #35308](https://github.com/BerriAI/litellm/pull/35308)
    - `GET /management/v1/budgets` - [PR #35310](https://github.com/BerriAI/litellm/pull/35310)
    - 讓 AI API 金鑰可讀取 `/model/info` - [PR #35473](https://github.com/BerriAI/litellm/pull/35473)
- **虛擬金鑰與 CLI**
    - 透過 `/key/update` 上的 `key_alias` 來識別金鑰 - [PR #34851](https://github.com/BerriAI/litellm/pull/34851)
    - 從持久化的 CLI 設定檔讀取 `base_url` - [PR #35015](https://github.com/BerriAI/litellm/pull/35015)
- **模型 + 端點**
    - 為自動路由器提供自己的分頁 - [PR #35009](https://github.com/BerriAI/litellm/pull/35009)
    - 在 Auto-Router 畫面公開 classifier 的 context window 欄位 - [PR #35315](https://github.com/BerriAI/litellm/pull/35315)
    - 在 Auto-Router 畫面公開 assistant-turn classifier 的 context switch - [PR #35500](https://github.com/BerriAI/litellm/pull/35500)
- **儀表板**
    - budgets 頁面上的排序、篩選與搜尋 - [PR #35309](https://github.com/BerriAI/litellm/pull/35309)
    - 透過 `?team=` 與 `?org=` query params 深入連結團隊與組織詳細頁，並將組織團隊連結到其團隊詳細頁 - [PR #35112](https://github.com/BerriAI/litellm/pull/35112), [PR #35117](https://github.com/BerriAI/litellm/pull/35117), [PR #35120](https://github.com/BerriAI/litellm/pull/35120)
    - 透過 logs 頁面上的 `log_id` query param 提供可分享的 log 連結 - [PR #34879](https://github.com/BerriAI/litellm/pull/34879)
    - 在 cache 儀表板上將失敗的請求拆成自己的序列 - [PR #34862](https://github.com/BerriAI/litellm/pull/34862)
    - 顯示哪些 log 列是 auto-router 自己的 classifier 請求 - [PR #35304](https://github.com/BerriAI/litellm/pull/35304)

#### 錯誤 {#bugs-1}

- **團隊與使用者**
    - 在 `/team/update` 之後停止提供過時的團隊模型 allowlist - [PR #34266](https://github.com/BerriAI/litellm/pull/34266)
    - 將新增團隊成員與既有的使用者佈建規則對齊 - [PR #35435](https://github.com/BerriAI/litellm/pull/35435)
    - 跳過指向已刪除部署的團隊模型別名 - [PR #34993](https://github.com/BerriAI/litellm/pull/34993)
    - 在團隊搜尋中顯示 passthrough route 選取項目，並比對 team id 子字串 - [PR #35319](https://github.com/BerriAI/litellm/pull/35319)
    - 回報來自 `GET /team/{team_id}/callback` 的 API 註冊回呼 - [PR #35512](https://github.com/BerriAI/litellm/pull/35512)
- **驗證與 SSO**
    - 預設僅將 `/v1/messages` 路由授予 JWT 團隊，而非所有 Anthropic 路由 - [PR #34222](https://github.com/BerriAI/litellm/pull/34222)
    - 將受管理的 batch 或 file deployment `model_id` 解析為模型名稱，以供團隊存取檢查 - [PR #32587](https://github.com/BerriAI/litellm/pull/32587)
- **SCIM**
    - 停止將巢狀群組 id 佈建為內部使用者 - [PR #34997](https://github.com/BerriAI/litellm/pull/34997)
- **模型寫入**
    - 拒絕會損壞 auto-router 偽模型的模型寫入 - [PR #34151](https://github.com/BerriAI/litellm/pull/34151)
    - 回報模型寫入在寫入後重新載入時無法保留的情況 - [PR #34861](https://github.com/BerriAI/litellm/pull/34861)
    - 停止模型寫入因另一個 pod 的刪除而 500 錯誤 - [PR #35400](https://github.com/BerriAI/litellm/pull/35400)
- **設定與憑證**
    - 在僅提供者的 batch 與 files 請求上解析具名憑證 - [PR #35028](https://github.com/BerriAI/litellm/pull/35028)
    - 從標籤管理 key lookup 與工具管理 team lookup 中移除不支援的 prisma `select` kwarg - [PR #35288](https://github.com/BerriAI/litellm/pull/35288), [PR #35293](https://github.com/BerriAI/litellm/pull/35293)
- **政策引擎**
    - 在 DB 同步期間保留設定中定義的政策，並透過 list APIs 公開它們 - [PR #35263](https://github.com/BerriAI/litellm/pull/35263)
- **儀表板**
    - 讓內部使用者與組織表單可儲存 sub-cent budgets - [PR #35302](https://github.com/BerriAI/litellm/pull/35302)
    - 停止將 budgets 的 Budget ID 欄位限制在 15 個字元 - [PR #35268](https://github.com/BerriAI/litellm/pull/35268)
    - 在選取其中的 log 時保持 session 檢視開啟 - [PR #35399](https://github.com/BerriAI/litellm/pull/35399)
    - 在用量明細中顯示公開模型名稱 - [PR #35107](https://github.com/BerriAI/litellm/pull/35107)
    - 將一般登入導向 keys 儀表板，並將 MCP 同意送至 `/ui/connect` - [PR #35523](https://github.com/BerriAI/litellm/pull/35523)
    - 將導覽列與側邊欄標誌指向儀表板首頁路由 - [PR #35041](https://github.com/BerriAI/litellm/pull/35041)
    - 依容器寬度調整 Object Permissions 卡片格線大小 - [PR #35019](https://github.com/BerriAI/litellm/pull/35019)
    - 在 Claude Code marketplace 設定片段中巢狀放置 `source` 物件 - [PR #35322](https://github.com/BerriAI/litellm/pull/35322)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 讓 OTLP 匯出可對應 Grafana Cloud 運作 - [PR #35060](https://github.com/BerriAI/litellm/pull/35060)
    - 限制 tool-definition 屬性，避免它們將 `gen_ai.*` 從 LLM span 中驅逐 - [PR #34828](https://github.com/BerriAI/litellm/pull/34828)
    - 正確標示 retrieval 與 agent 指標，並發出 `gen_ai.provider.name` - [PR #35151](https://github.com/BerriAI/litellm/pull/35151)
    - 在失敗的請求上記錄 GenAI duration 指標 - [PR #35152](https://github.com/BerriAI/litellm/pull/35152)
    - 將 OTel GenAI 指標的 Grafana 儀表板加入 cookbook - [PR #35159](https://github.com/BerriAI/litellm/pull/35159)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 全域 `exclude_metrics` 與 `exclude_labels` 選項 - [PR #34201](https://github.com/BerriAI/litellm/pull/34201)
    - 為 latency 與 spend 指標新增 `service_tier` 標籤 - [PR #34966](https://github.com/BerriAI/litellm/pull/34966)
- **[s3](../../docs/proxy/logging#s3-buckets)**
    - 支援兩條 S3 記錄路徑上的 SSE-KMS 加密參數 - [PR #35291](https://github.com/BerriAI/litellm/pull/35291)
- **一般**
    - 在 `function_setup` 中以參照綁定 `litellm_metadata`，以便防護欄資訊能傳遞到 spend logs - [PR #35292](https://github.com/BerriAI/litellm/pull/35292)

### 防護欄 {#guardrails}

- **[一般](../../docs/proxy/guardrails/quick_start)**
    - 透過新的 `post_mcp_call` 模式掃描並遮罩 MCP 工具結果 - [PR #35155](https://github.com/BerriAI/litellm/pull/35155)
    - 不依賴 DB，且以穩定 id 從 list 與 info endpoints 提供設定中定義的防護欄 - [PR #35259](https://github.com/BerriAI/litellm/pull/35259)
    - 透過統一的防護欄翻譯，在 `/v1/messages` 串流上執行 `post_call` 防護欄 - [PR #35260](https://github.com/BerriAI/litellm/pull/35260)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 以 `during_mcp_call` 模式在 MCP 工具呼叫上執行 Bedrock guardrail - [PR #35149](https://github.com/BerriAI/litellm/pull/35149)
- **壓縮器 / Headroom**
    - 停止壓縮模型必須處理的那一輪 - [PR #35294](https://github.com/BerriAI/litellm/pull/35294)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預算**
    - 停止將使用者預算套用到團隊金鑰，回復先前的階層變更 - [PR #35271](https://github.com/BerriAI/litellm/pull/35271)
    - 只對可以產生支出的路由強制執行預算 - [PR #35274](https://github.com/BerriAI/litellm/pull/35274)
- **速率限制**
    - 在 pre-call increment 為零時強制執行 token 限制 - [PR #35422](https://github.com/BerriAI/litellm/pull/35422)
    - 將 v3 limiter 的每請求 stash 從 request metadata 移到 `ContextVar` 上 - [PR #35278](https://github.com/BerriAI/litellm/pull/35278)
    - 在 Responses 路由上讓 v3 limiter 不出現在面向提供者的 metadata 中 - [PR #35207](https://github.com/BerriAI/litellm/pull/35207)
- **[成本追蹤](../../docs/proxy/cost_tracking)**
    - 依 priority rate 計費 fast service tier - [PR #35320](https://github.com/BerriAI/litellm/pull/35320)
    - 計算已完成 Vertex AI batch 的成本與用量，並在單次傳遞中彙總 batch 輸出成本、用量與模型 - [PR #35186](https://github.com/BerriAI/litellm/pull/35186), [PR #35205](https://github.com/BerriAI/litellm/pull/35205)
    - 在 embedding cache-hit spend logs 上標記提供者 - [PR #35282](https://github.com/BerriAI/litellm/pull/35282)

## MCP 閘道 {#mcp-gateway}

- **授權**
    - 在 auth 模組中強制執行每位使用者的 MCP 工具呼叫授權 - [PR #35146](https://github.com/BerriAI/litellm/pull/35146)
    - 在每一條 MCP 工具派送路徑上強制執行工具授權 - [PR #35156](https://github.com/BerriAI/litellm/pull/35156)
    - 當無法讀取具名授權時拒絕 MCP 存取 - [PR #35160](https://github.com/BerriAI/litellm/pull/35160)
    - 從已註冊的前綴還原工具名稱前綴邊界 - [PR #34673](https://github.com/BerriAI/litellm/pull/34673)
- **OAuth**
    - 將無金鑰閘道 OAuth 流程擴展到每個伺服器的 MCP URL 路徑 - [PR #34856](https://github.com/BerriAI/litellm/pull/34856)
    - 從使用者儲存的 SSO assertion 取得 ID-JAG subject - [PR #35147](https://github.com/BerriAI/litellm/pull/35147)
    - 為無頭 MCP 用戶端手動傳遞 authorization code - [PR #34848](https://github.com/BerriAI/litellm/pull/34848)
- **伺服器與探索**
    - 絕不將探索結果寫入該資料列，修復先前版本已標記的資料列，並以回退重試失敗的探索 - [PR #34990](https://github.com/BerriAI/litellm/pull/34990)
    - 在閘道連線頁面上標註已連線應用程式的可達性 - [PR #34867](https://github.com/BerriAI/litellm/pull/34867)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **設定傳播**
    - 改為透過 Redis pub/sub 將設定同步推送到 pod，而不是等待 30 秒輪詢 - [PR #35436](https://github.com/BerriAI/litellm/pull/35436)
- **資料庫**
    - 透過 `general_settings` 限制 DB statement 和鎖定時間 - [PR #35496](https://github.com/BerriAI/litellm/pull/35496)
    - 在 prisma migrations 之後重新套用 opt-in `REPLICA IDENTITY FULL` - [PR #35267](https://github.com/BerriAI/litellm/pull/35267)
    - 依 payload bytes 限制每一筆 spend-log 寫入 statement - [PR #34956](https://github.com/BerriAI/litellm/pull/34956)
- **路由器與自動路由器**
    - 讓 ComplexityRouter LLM classifier 具備前一輪對話脈絡 - [PR #35185](https://github.com/BerriAI/litellm/pull/35185)
    - 讓 classifier 看見 assistant 輪次，並評估短回覆所核准的內容 - [PR #35471](https://github.com/BerriAI/litellm/pull/35471)
    - 移除 tier-rubric override，並在給定的視窗內關閉 rubric - [PR #35504](https://github.com/BerriAI/litellm/pull/35504)
    - 記錄 auto-router 為何選擇某個 tier，擷取 classifier 請求本文，並在 spend logs 中標記 auto-router 自己的 classifier 呼叫 - [PR #35016](https://github.com/BerriAI/litellm/pull/35016), [PR #35164](https://github.com/BerriAI/litellm/pull/35164), [PR #35300](https://github.com/BerriAI/litellm/pull/35300)
    - 以請求層級 `num_retries` 優先於部署的 `litellm_params` 值 - [PR #35483](https://github.com/BerriAI/litellm/pull/35483)
    - 在最低延遲路由中序列化非聊天回應的延遲 - [PR #33290](https://github.com/BerriAI/litellm/pull/33290)
- **連線與快取**
    - 停止讓無法連線的 Redis 阻擋每一個請求 - [PR #35273](https://github.com/BerriAI/litellm/pull/35273)
    - 以確定性方式釋放已回收的 aiohttp 用戶端 session，並在 session 重建時保留 keep-alive connector 設定 - [PR #33428](https://github.com/BerriAI/litellm/pull/33428), [PR #34962](https://github.com/BerriAI/litellm/pull/34962)
- **Rust 核心**
    - 讓 `litellm-core` 成為可呼叫的 `messages()` SDK，並移除 ai-gateway handler - [PR #35044](https://github.com/BerriAI/litellm/pull/35044)
- **部署與 Helm**
    - 在元件化 chart 上提供 Pod 強化與 migration Job 參數 - [PR #35489](https://github.com/BerriAI/litellm/pull/35489)
    - 在 migration Job 上渲染 pod 層級 `securityContext` - [PR #35482](https://github.com/BerriAI/litellm/pull/35482)
    - 為 gateway 與 backend probe 提供明確的 `timeoutSeconds` - [PR #35497](https://github.com/BerriAI/litellm/pull/35497)
    - 在元件化的 gateway 與 backend deployments 中套用 `USE_DDTRACE` - [PR #35490](https://github.com/BerriAI/litellm/pull/35490)
    - 在元件化 migrations image 中內建 prisma offline - [PR #35485](https://github.com/BerriAI/litellm/pull/35485)
    - 將內建的 postgres 與 redis 鎖定為 bitnamilegacy images - [PR #34963](https://github.com/BerriAI/litellm/pull/34963)
- **依賴項與維護**
    - 將 aiohttp 最低版本提高到 3.14.2，以清除 pooled-connection timeout - [PR #35337](https://github.com/BerriAI/litellm/pull/35337)
    - 將 `pydantic-settings` 移入基礎依賴項 - [PR #35518](https://github.com/BerriAI/litellm/pull/35518)
    - 移除已無作用的 `BedrockLLM` invoke 程式碼路徑 - [PR #35188](https://github.com/BerriAI/litellm/pull/35188)

## 文件更新 {#documentation-updates}

- 在 PR 範本中，於適用時要求所有三個 LLM endpoint 都提供 e2e 證明 - [PR #35280](https://github.com/BerriAI/litellm/pull/35280)
- 要求 AI PR review bot 提供 15-25 字的可讀性回覆 - [PR #35266](https://github.com/BerriAI/litellm/pull/35266)

### 依 ownership 區域彙整的 PR {#pr-roll-up-by-ownership-area}

依 ownership 區域的 PR（總計：151）

- 其他（CI / chore / tests / build / version bumps）：35
- 效能：24
- 驗證與管理：20
- UI：19
- 模型與提供者：11
- 記錄：9
- MCP：9
- 花費 / 預算 / 速率限制：9
- LLM API 端點：8
- 防護欄：5
- 文件：2

## 端到端測試 {#end-to-end-testing}

我們正大力投入端到端測試，以減少 regression，並讓 LiteLLM 每個版本都更穩定。每個版本都會由一套 live suite 驗證，該套件會對真實已部署的 proxy 執行，並呼叫真實的提供者端點，而不是 mock，因此我們驗證的行為就是您在 production 中得到的行為。

這個視窗新增了 18 個僅測試用 PR，其中 10 個是針對 live e2e suite。新增與修復後的涵蓋範圍涵蓋跨多 worker 延遲的 MCP 工具輪詢、將 budget-reset 時間改為輪詢到截止期限而非固定 sleep、revert 之後的 team-key budget 階層，以及每個 replica 衍生的 throughput SLO，並顯示 locust 的 error breakdown。涵蓋範圍登錄現在會將被跳過的測試排除在分母之外，因此回報的數字反映實際執行的內容，而數個 suite 則以命名的 Linear tickets（LIT-5027、LIT-5052、LIT-5054、LIT-5118、LIT-5119）暫時擱置，而不是保留為不穩定狀態。

## 新貢獻者 {#new-contributors}

- @ljogeiger 在 [PR #34603](https://github.com/BerriAI/litellm/pull/34603) 作出了他們的首次貢獻
- @lihugang 在 [PR #35258](https://github.com/BerriAI/litellm/pull/35258) 作出了他們的首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.95.0...v1.96.0
