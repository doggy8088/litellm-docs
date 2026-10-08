---
title: "v1.97.0 - 工具結果防護欄、部署親和性與檢視者一致性"
slug: "v1-97-0"
date: 2026-08-15T00:00:00
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
docker.litellm.ai/berriai/litellm:1.97.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.97.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**請求參數檢查現在也適用於路徑與表單輸入，而不僅是請求本文。** 透過 URL 路徑提供部署名稱，或透過方括號標記的表單欄位提供中繼資料的請求，現在都會受到與本文相同的目的地檢查，因此先前能通過的呼叫將開始被拒絕。已設定的憑證也會維持在其所屬的端點，因此連線測試不再能借用其他模型的憑證。為了合法覆寫，保留了三個管理員排除規則。請參閱 [PR #36011](https://github.com/BerriAI/litellm/pull/36011)。

**自動路由器 `deployment_affinity` 現在預設為開啟。** 其呼叫端會傳送 session id 的自動路由器，將把該 session 固定到所路由模型群組中的一個部署，而不是讓每次互動分散到所有部署。請在自動路由器設定中將 `deployment_affinity: false` 設為恢復先前行為。請參閱 [PR #36146](https://github.com/BerriAI/litellm/pull/36146)。

:::

## 主要重點 {#key-highlights}

- **防護欄現在可以只針對工具結果** - 新的每個防護欄 `scan_only_tool_results` 標記會掃描並遮罩工具輸出，而系統、使用者與助理內容則原樣通過，因此代理程式平台可以只對不受信任的工具結果保留注入偵測，而不會讓自己的 harness 提示詞觸發篩選。適用於 `/v1/messages` 與 `/v1/chat/completions`
- **自動路由器現在會固定到部署，而不只是模型群組** - `deployment_affinity` 預設為開啟，因此回到模型群組的對話會落到先前使用的部署上，提供者提示快取會保持暖態，而每一輪互動仍會各自依據其本身特性分類。`session_affinity` 表示它，且 session pin 現在依呼叫端的雜湊 API 金鑰進行範圍限制
- **成功與失敗的請求計數改由閘道提供，而不是 spend logs** - 由 ASGI request-metrics middleware 寫入的新 `LiteLLM_DailyGatewayRequests` 資料表支撐 Usage 圖塊，因此當 spend logging 關閉或資料庫無法使用時，數字不再掉為零，而且還會附帶一個 SpendLogs 路徑無法產生的按端點明細圖表
- **Proxy 管理員檢視者終於可以看到 proxy 了** - 大約十五個原本與 `PROXY_ADMIN` 做完全相等比較的唯讀端點，現在改用包含檢視者的檢查，而 UI 在門控用途上會將檢視者顯示為管理員，同時伺服器仍會拒絕所有寫入
- **金鑰、使用者、團隊與組織可以提取自己的 spend 報告** - 四個新的呼叫端範圍 `spend/report` 端點會自動將非管理員呼叫端套用到其自身身分，對不匹配的範圍覆寫回傳 403，並將日期範圍上限限制為 366 天
- **受管理檔案與批次作業進行正確性全面檢查** - 統一輸出檔案 id 現在會以決定性方式衍生，因此並行註冊會收斂，並會在 `GET /batches`、未範圍限定的檔案列表，以及取消時回傳；而無法解析的列現在也不再會讓列表當掉
- **管理員可以向儀表板廣播橫幅** - `GET /get/user_banner` 與 `PATCH /update/user_banner` 支援一個可關閉的 Markdown 橫幅，會在每個頁面上呈現，可從 Admin Settings 發布並即時預覽，且會儲存在既有的 `LiteLLM_UISettings` 資料表中，無需遷移

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（2 個新模型） {#new-model-support-2-new-models}

| 提供者 | 模型 | Context Window | Input ($/1M tokens) | Output ($/1M tokens) | 功能 |
| --- | --- | --- | --- | --- | --- |
| Google Gemini | `gemini/gemini-robotics-er-2-preview` | 131K | $2.00 | $10.00 | Reasoning、vision、audio input、video input、PDF input、function calling、tool choice、prompt caching、response schema、web search、URL context |
| Google Gemini | `gemini/gemini-robotics-er-1.6-preview` | 131K | $1.00 | $5.00 | Reasoning、vision、audio input、video input、PDF input、function calling、tool choice、prompt caching、response schema、web search、URL context |

除了新增項目外，此版本也將 OpenAI 的 GPT-5.6 降價套用到 Azure 成本對照表：`azure/gpt-5.6-terra` 從每 1M 的 $2.50 / $15.00 降至 $2.00 / $12.00，而 `azure/gpt-5.6-luna` 則從每 1M 的 $1.00 / $6.00 降至 $0.20 / $1.20；相同的調降也套用到區域 `azure/us/*` 與 `azure/eu/*` 變體，以及所有 cache、flex、priority 與 above-272K 層級。Flex 與 priority 層級金鑰已新增到原本缺少它們的日期版 OpenAI snapshot 變體（`gpt-4.1-2025-04-14`、`gpt-4.1-mini-2025-04-14`、`gpt-4.1-nano-2025-04-14`、`gpt-4o-2024-08-06`、`gpt-4o-2024-11-20`、`gpt-4o-mini-2024-07-18`、`gpt-5-nano-2025-08-07`、`o3-2025-04-16`、`o4-mini-2025-04-16`）。Groq `gpt-oss` 模型新增每次查詢 $0.005 的 web search context 價格，Bedrock `claude-sonnet-5` 項目標示為不支援 Converse strict tools，而一個破損的 `replicateopenai/gpt-oss-20b` 金鑰已修正為 `replicate/openai/gpt-oss-20b`。未移除任何定價項目。

#### 功能 {#features}

- **[Google Gemini](../../docs/providers/gemini)**
    - 將 `gemini-robotics-er-2-preview` 與 `gemini-robotics-er-1.6-preview` 新增到模型成本對照表 - [PR #35555](https://github.com/BerriAI/litellm/pull/35555)

### 錯誤修正 {#bug-fixes}

- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 在部署憑證中包含 batch 與 S3 欄位以及模型 - [PR #24548](https://github.com/BerriAI/litellm/pull/24548)
    - 在 OIDC session policy 中授予 `bedrock:CountTokens` - [PR #33145](https://github.com/BerriAI/litellm/pull/33145)
    - 將 SSE-KMS key 傳遞給 batch input-file S3 上傳 - [PR #35148](https://github.com/BerriAI/litellm/pull/35148)
    - 標準化 `/v1/completions` 與 `/v1/responses` 的 batch 記錄 - [PR #35675](https://github.com/BerriAI/litellm/pull/35675)
    - 停止將無作用的 `toolSpec.strict` 轉送到 Converse - [PR #35688](https://github.com/BerriAI/litellm/pull/35688)
    - 當 `toolConfig.toolChoice` 已設定時，移除衝突的 `tool_choice.type` - [PR #35738](https://github.com/BerriAI/litellm/pull/35738)
    - 以 `S3SigV4Auth` 簽署受管理檔案的 S3 請求 - [PR #35983](https://github.com/BerriAI/litellm/pull/35983)
- **[Anthropic](../../docs/providers/anthropic)**
    - 停止在 adapter 中對無選項 streaming chunks 索引 `choices[0]` - [PR #35314](https://github.com/BerriAI/litellm/pull/35314)
    - 將明確的 `additionalProperties` 在 `output_format` schema 中強制為 false - [PR #35811](https://github.com/BerriAI/litellm/pull/35811)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 在 batch 建立時顯示真實錯誤與狀態，而不是一個 `IndexError` 500 - [PR #35141](https://github.com/BerriAI/litellm/pull/35141)
- **[OpenAI](../../docs/providers/openai)**
    - 將 OpenAI 的 `gpt-5.6` terra 與 luna 降價套用到 Azure 成本對照表 - [PR #35481](https://github.com/BerriAI/litellm/pull/35481)
- **[Groq](../../docs/providers/groq)**
    - 將 `web_search_options` 轉譯到 `browser_search` 工具 - [PR #34971](https://github.com/BerriAI/litellm/pull/34971)
- **[Replicate](../../docs/providers/replicate)**
    - 修正破損的 `gpt-oss-20b` 模型金鑰 - [PR #34800](https://github.com/BerriAI/litellm/pull/34800)
- **[AI21](../../docs/providers/ai21)**
    - 解析文件中的 `AI21_API_KEY`，而不是拼錯的名稱 - [PR #35985](https://github.com/BerriAI/litellm/pull/35985)
- **[Jina AI](../../docs/providers/jina_ai)**
    - 將文件中的 `JINA_API_KEY` 解析為備援 - [PR #35992](https://github.com/BerriAI/litellm/pull/35992)
- **一般**
    - 以 `add_known_models` 重新建置 `models_by_provider`，讓成本對照表重新載入能觸及萬用字元展開 - [PR #36010](https://github.com/BerriAI/litellm/pull/36010)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Anthropic `/v1/messages`](../../docs/anthropic_unified)**
    - 在上游靜默期間，於 SSE 串流上送出 keepalive ping - [PR #36024](https://github.com/BerriAI/litellm/pull/36024)
- **Cursor**
    - 使 `/cursor/chat/completions` 可與 Cursor 代理程式模式搭配運作 - [PR #34029](https://github.com/BerriAI/litellm/pull/34029)
    - 解決 Cursor thinking 與快速模型名稱字尾 - [PR #35554](https://github.com/BerriAI/litellm/pull/35554)
- **[Claude Code](../../docs/claude_code_compatibility)**
    - 使用 `PUT` 更新路由建立僅可建立的技能註冊 - [PR #31752](https://github.com/BerriAI/litellm/pull/31752)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 將用戶端標頭轉送給 `/v1/responses` 上的提供者 - [PR #34531](https://github.com/BerriAI/litellm/pull/34531)
    - 透過 chat completions bridge 轉送 `allowed_openai_params` - [PR #35885](https://github.com/BerriAI/litellm/pull/35885)
- **[Batches](../../docs/batches)**
    - 在終端機 retrieve 時註冊受管理的批次輸出檔案 - [PR #34092](https://github.com/BerriAI/litellm/pull/34092)
    - 納入 Responses API 使用量 - [PR #35367](https://github.com/BerriAI/litellm/pull/35367)
    - 防止受管理檔案在各提供者之間回退 - [PR #35371](https://github.com/BerriAI/litellm/pull/35371)
    - 在批次取消時註冊受管理的輸出檔案，並為已取消、失敗與已過期的批次保存受管理的檔案 ID - [PR #36034](https://github.com/BerriAI/litellm/pull/36034), [PR #36048](https://github.com/BerriAI/litellm/pull/36048)
- **[受管理檔案](../../docs/files_endpoints)**
    - 在列出時略過沒有檔案物件的列，並略過無法解析的列 - [PR #35365](https://github.com/BerriAI/litellm/pull/35365), [PR #36021](https://github.com/BerriAI/litellm/pull/36021)
    - 在每個接受原始提供者 ID 的路由上強制執行 `require_managed_files` - [PR #35551](https://github.com/BerriAI/litellm/pull/35551)
    - 以決定性方式推導統一輸出檔案 ID，使並行註冊收斂 - [PR #36019](https://github.com/BerriAI/litellm/pull/36019)
    - 從不受範圍限制的檔案列出作業回傳統一 ID，並從 `GET /batches` 回傳統一輸出檔案 ID - [PR #36031](https://github.com/BerriAI/litellm/pull/36031), [PR #36049](https://github.com/BerriAI/litellm/pull/36049)
- **[直通](../../docs/pass_through/vertex_ai)**
    - 從路由器部署即時解析直通憑證 - [PR #35916](https://github.com/BerriAI/litellm/pull/35916)
    - 停止將用戶端的 `Accept-Encoding` 轉送到上游 - [PR #37058](https://github.com/BerriAI/litellm/pull/37058)
- **網頁搜尋**
    - 還原原生 `web_search_tool_result` 區塊中的片段文字 - [PR #36228](https://github.com/BerriAI/litellm/pull/36228)
- **一般**
    - 將通用的 `error` 完成原因對應為 `stop` - [PR #33972](https://github.com/BerriAI/litellm/pull/33972)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **支出報表**
    - 呼叫者範圍的 key、user、team 與 organization `spend/report` 端點 - [PR #35725](https://github.com/BerriAI/litellm/pull/35725)
- **團隊與使用者**
    - 用於 team 建立與更新的自訂中繼資料驗證掛鉤 - [PR #33353](https://github.com/BerriAI/litellm/pull/33353)
    - 從預設 team 設定套用預設 organization 到新 team - [PR #35540](https://github.com/BerriAI/litellm/pull/35540)
- **儀表板**
    - 可由管理員設定、可關閉的 markdown 使用者橫幅 - [PR #35729](https://github.com/BerriAI/litellm/pull/35729)
    - 角色能力門控，並將 Tool Policies 路由遷移到其上 - [PR #35812](https://github.com/BerriAI/litellm/pull/35812)
    - playground 中的非串流回應切換 - [PR #35560](https://github.com/BerriAI/litellm/pull/35560)
    - 在使用量資料匯出中顯示使用者 email 或別名 - [PR #36232](https://github.com/BerriAI/litellm/pull/36232)
- **自動路由器畫面**
    - 顯示 auto-router 節省效益，並在成本最佳化儀表板上新增 auto-router 使用分頁 - [PR #35522](https://github.com/BerriAI/litellm/pull/35522), [PR #35995](https://github.com/BerriAI/litellm/pull/35995)
    - 將 Add Auto Router 重新排列為名稱加範本，並加入可收合的詳細設定 - [PR #35746](https://github.com/BerriAI/litellm/pull/35746)
    - 在 auto router 建立表單中新增 Test Routing - [PR #35859](https://github.com/BerriAI/litellm/pull/35859)
    - 將預設模型與部署的底層模型 ID 進行比對 - [PR #35972](https://github.com/BerriAI/litellm/pull/35972)

#### 錯誤 {#bugs-1}

- **驗證與角色**
    - 讓 `proxy_admin_viewer` 在約十五個讀取端點與遮蔽它們的 UI 門控上，與 `proxy_admin` 擁有相同的讀取權限 - [PR #35851](https://github.com/BerriAI/litellm/pull/35851)
    - 在 body、path 與 form 輸入之間一致地套用請求參數檢查 - [PR #36011](https://github.com/BerriAI/litellm/pull/36011)
    - 在 JWT 驗證歸因路徑上傳播 `user_email` 並繫結 `api_key`，並為既有使用者回填空值 `user_email` - [PR #34331](https://github.com/BerriAI/litellm/pull/34331), [PR #34588](https://github.com/BerriAI/litellm/pull/34588)
    - 在 JWT 形狀的金鑰被拒絕時命名 `enable_jwt_auth` - [PR #35831](https://github.com/BerriAI/litellm/pull/35831)
    - 從 OAuth2 企業閘道回傳 403 - [PR #35838](https://github.com/BerriAI/litellm/pull/35838)
    - 重新確認直通請求上的已驗證身分 - [PR #36121](https://github.com/BerriAI/litellm/pull/36121)
    - 停止在 `/search_tools/list` 上解析 UI 工作階段 sentinel team - [PR #36061](https://github.com/BerriAI/litellm/pull/36061)
    - 讓非管理員可存取 `/user/daily/activity/aggregated` - [PR #36062](https://github.com/BerriAI/litellm/pull/36062)
- **金鑰與憑證**
    - 將 `key_alias` 與 `key_hash` 篩選條件套用至所有 `/key/list` 可見性分支 - [PR #35840](https://github.com/BerriAI/litellm/pull/35840)
    - 當憑證更新被拒絕時，回傳真實狀態碼 - [PR #36166](https://github.com/BerriAI/litellm/pull/36166)
- **代理程式與存取群組**
    - 從 `agent_name` 推導設定代理程式 ID，以便授權在密鑰輪替後仍可保留 - [PR #36020](https://github.com/BerriAI/litellm/pull/36020)
    - 當 key 與 team 授權都解析為無內容時，拒絕代理程式存取 - [PR #36221](https://github.com/BerriAI/litellm/pull/36221)
    - 在模型列出端點中解析實體存取群組 - [PR #36230](https://github.com/BerriAI/litellm/pull/36230)
- **設定與專案**
    - 套用 key 與 team `router_settings.model_group_alias` - [PR #35486](https://github.com/BerriAI/litellm/pull/35486)
    - 讓 YAML `store_prompts_in_spend_logs` 優先於 DB 快取值 - [PR #35769](https://github.com/BerriAI/litellm/pull/35769)
    - 保存週期性重新載入排程，使狀態可在重新啟動後保留，並在沒有 `store_model_in_db` 的情況下觸發 - [PR #35165](https://github.com/BerriAI/litellm/pull/35165)
    - 在專案更新與刪除時使快取的 project 物件失效 - [PR #36028](https://github.com/BerriAI/litellm/pull/36028)
- **儀表板**
    - 對非管理員使用者隱藏 guardrail 審核按鈕，並在直接 URL 存取時封鎖 viewer 角色的 Playground 頁面 - [PR #27535](https://github.com/BerriAI/litellm/pull/27535), [PR #35676](https://github.com/BerriAI/litellm/pull/35676)
    - 在 logs drawer 中呈現 Responses API 請求與回應 - [PR #35718](https://github.com/BerriAI/litellm/pull/35718)
    - 在開啟 project 時推送 `?project=`，將 project key 連結到其 virtual key 詳細資料，並將 projects list page index 同步至 `?page=` - [PR #36001](https://github.com/BerriAI/litellm/pull/36001), [PR #36002](https://github.com/BerriAI/litellm/pull/36002), [PR #36003](https://github.com/BerriAI/litellm/pull/36003)
    - 允許從 Edit Key 表單清除 key 的 budget reset - [PR #36140](https://github.com/BerriAI/litellm/pull/36140)
    - 讓 access groups 成為 team 唯一的模型來源，並顯示 hover 來源資訊 - [PR #36234](https://github.com/BerriAI/litellm/pull/36234)
    - 在 team fallback 設定中顯示 team BYOK 模型 - [PR #36241](https://github.com/BerriAI/litellm/pull/36241)
    - 拒絕留空的 auto-router 關鍵字規則，而不是將其丟棄 - [PR #35705](https://github.com/BerriAI/litellm/pull/35705)
    - 將 auto-router 預設模型與萬用字元展開的模型群組進行比對 - [PR #36111](https://github.com/BerriAI/litellm/pull/36111)
    - 更正 expired-miss 佔比為涵蓋所有已測量的回合，並修正成本最佳化分頁標籤 - [PR #36037](https://github.com/BerriAI/litellm/pull/36037)
    - 更新 Anthropic 模型預設值 - [PR #35896](https://github.com/BerriAI/litellm/pull/35896)
    - 在向量儲存設定文案中註明 Google 的 Agent Platform 更名 - [PR #28076](https://github.com/BerriAI/litellm/pull/28076)
- **儀表板內部**
    - 以 `nuqs` 取代手寫的 query-param 路由 - [PR #35871](https://github.com/BerriAI/litellm/pull/35871)
    - 注入 fetch client 的 base url，而不是在 import 時讀取它 - [PR #35802](https://github.com/BerriAI/litellm/pull/35802)
    - 將 MCP session token 透過共享儲存輔助程式路由 - [PR #35835](https://github.com/BerriAI/litellm/pull/35835)
    - 擷取 MCP 建立表單的邏輯與欄位群組，並將 create MCP server 元件重新命名為 PascalCase - [PR #35694](https://github.com/BerriAI/litellm/pull/35694), [PR #35686](https://github.com/BerriAI/litellm/pull/35686)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 將 v2 伺服器 span 在呼叫前錯誤時標記為失敗 - [PR #34546](https://github.com/BerriAI/litellm/pull/34546)
    - 在 inference spans 上加上 service tier 屬性 - [PR #35679](https://github.com/BerriAI/litellm/pull/35679)
    - 為 MCP tool-call spans 命名 RPC system 與 upstream - [PR #35857](https://github.com/BerriAI/litellm/pull/35857)
- **Arize Phoenix**
    - 將 OTLP/gRPC auth metadata key 轉為小寫 - [PR #34883](https://github.com/BerriAI/litellm/pull/34883)
- **[DataDog](../../docs/proxy/logging#datadog)**
    - 從 kwargs 而非被封鎖的動態參數讀取 team callback `dd_*` params - [PR #35687](https://github.com/BerriAI/litellm/pull/35687)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 停止已收集的 httpx handler 關閉共用 client - [PR #35981](https://github.com/BerriAI/litellm/pull/35981)
- **[s3](../../docs/proxy/logging#s3-buckets)**
    - 使用 `S3SigV4Auth` 簽署 S3 object URLs，以便已編碼路徑能通過驗證 - [PR #35726](https://github.com/BerriAI/litellm/pull/35726)
- **Azure 儲存體**
    - 在主權雲中遵循 `AZURE_STORAGE_ENDPOINT_SUFFIX` - [PR #35806](https://github.com/BerriAI/litellm/pull/35806)
- **[Azure Sentinel](../../docs/observability/azure_sentinel)**
    - 尊重 Entra token 的 `AZURE_AUTHORITY_HOST`，並依雲別推導 Azure Monitor audience，且以 `AZURE_SENTINEL_AUTHORITY_HOST` 作為範圍限定的覆寫 - [PR #36137](https://github.com/BerriAI/litellm/pull/36137), [PR #36165](https://github.com/BerriAI/litellm/pull/36165)
- **一般**
    - 當 team callback 呼叫 `disable_logging` 時，確實停止記錄 - [PR #35520](https://github.com/BerriAI/litellm/pull/35520)
    - 從 request logging 複本中移除 credential headers，並將 secret redaction 擴展到 litellm 未直接產生的 records - [PR #35678](https://github.com/BerriAI/litellm/pull/35678), [PR #35977](https://github.com/BerriAI/litellm/pull/35977)
    - 將 caller metadata trace fields 提升到 `litellm_metadata`，並在 `metadata` 為空時改回 `litellm_metadata` - [PR #35866](https://github.com/BerriAI/litellm/pull/35866), [PR #36105](https://github.com/BerriAI/litellm/pull/36105)

### 防護欄 {#guardrails}

- **[一般](../../docs/proxy/guardrails/quick_start)**
    - 新增 `scan_only_tool_results` 標記，將統一防護欄作用域限定於 tool results - [PR #36014](https://github.com/BerriAI/litellm/pull/36014)
    - 掃描 `/v1/messages` tool 流量 - [PR #35999](https://github.com/BerriAI/litellm/pull/35999)
    - 在 `/openai/v1/responses` 別名上掃描 model output - [PR #35818](https://github.com/BerriAI/litellm/pull/35818)
    - 讓 `litellm_content_filter` 在 `post_mcp_call` 上執行 - [PR #35980](https://github.com/BerriAI/litellm/pull/35980)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 將超出大小的 `ApplyGuardrail` 請求分塊處理，而不是失敗 - [PR #36119](https://github.com/BerriAI/litellm/pull/36119)
- **Rubrik**
    - 提示詞審核、回應文字封鎖、串流緩衝區，以及失敗記錄 - [PR #35722](https://github.com/BerriAI/litellm/pull/35722)
    - 將被封鎖的請求歸屬給發出該請求的 caller - [PR #35734](https://github.com/BerriAI/litellm/pull/35734)
- **Zscaler AI Guard**
    - 遵循已設定的逾時時間 - [PR #36110](https://github.com/BerriAI/litellm/pull/36110)
    - 當輸入被封鎖時回傳正確的 HTTP code - [PR #31948](https://github.com/BerriAI/litellm/pull/31948)
- **Compresr / Headroom**
    - 改善 `/v1/compress` HTTP 404 診斷資訊 - [PR #35952](https://github.com/BerriAI/litellm/pull/35952)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **閘道請求計帳**
    - 讓 gateway middleware 成為成功請求的唯一事實來源，並新增按端點細分 - [PR #35717](https://github.com/BerriAI/litellm/pull/35717)
- **報表**
    - caller 範圍的 key、user、team 與 organization 支出報告端點 - [PR #35725](https://github.com/BerriAI/litellm/pull/35725)
    - 當每日活動範圍在 caller 的當前日期結束時，包含今天的 UTC bucket - [PR #36051](https://github.com/BerriAI/litellm/pull/36051)
- **自動路由器節省**
    - 在成本最佳化儀表板中加入淨 auto-router savings，並從最困難的 tier 推導預設基準值 - [PR #35521](https://github.com/BerriAI/litellm/pull/35521), [PR #35907](https://github.com/BerriAI/litellm/pull/35907)
    - 以每個 session 的彙總重建 auto-router benchmarks 後端，並追蹤各複雜度 tier 的 turns - [PR #35910](https://github.com/BerriAI/litellm/pull/35910), [PR #36209](https://github.com/BerriAI/litellm/pull/36209)
    - 透過 `routing_decision` 與 `x-litellm-classifier-cost` 標頭回報每次請求的 LLM classifier 成本 - [PR #36015](https://github.com/BerriAI/litellm/pull/36015)
- **預算**
    - 新增可選加入的 `apply_user_budget_to_team_keys`，預設關閉，涵蓋全部三個個人預算閘門 - [PR #36102](https://github.com/BerriAI/litellm/pull/36102)
    - 針對已解析的 Cursor model variants 強制執行每模型預算 - [PR #35834](https://github.com/BerriAI/litellm/pull/35834)
    - 當 `max_budget` 已設定但未連接資料庫時，在啟動時發出警告 - [PR #36041](https://github.com/BerriAI/litellm/pull/36041)
- **[成本追蹤](../../docs/proxy/cost_tracking)**
    - 從記錄讀取請求成本，而不是重新計價 - [PR #35736](https://github.com/BerriAI/litellm/pull/35736)
    - 以 cache read rate 計費 `gpt-5.6` prompt cache reads，並在 usage reassembly 過程中保留 OpenAI prompt cache token 細節 - [PR #34957](https://github.com/BerriAI/litellm/pull/34957), [PR #34812](https://github.com/BerriAI/litellm/pull/34812)
    - 以 service tier output rate 計費 reasoning tokens，並將 flex 與 priority tier keys 同步至附日期的 OpenAI snapshot variants - [PR #35925](https://github.com/BerriAI/litellm/pull/35925), [PR #35923](https://github.com/BerriAI/litellm/pull/35923)
    - 將攔截到的 web 搜尋計費給呼叫的 key - [PR #35708](https://github.com/BerriAI/litellm/pull/35708)
    - 停止對 file content calls 的 placeholder input 進行 token 計價 - [PR #35140](https://github.com/BerriAI/litellm/pull/35140)
    - 追蹤未歸因至任何 key 或 user 的 managed batches 成本 - [PR #35468](https://github.com/BerriAI/litellm/pull/35468)
    - 透過 `CheckResponsesCost` 中的路由器擷取背景回應 - [PR #35137](https://github.com/BerriAI/litellm/pull/35137)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由器與自動路由器**
    - 自動路由器的獨立、預設啟用的 `deployment_affinity` - [PR #36146](https://github.com/BerriAI/litellm/pull/36146)
    - 允許營運人員替換 LLM 分類器的系統提示詞並重新命名四個複雜度層級 - [PR #35855](https://github.com/BerriAI/litellm/pull/35855), [PR #35893](https://github.com/BerriAI/litellm/pull/35893)
    - 預設關閉工作階段親和性，並在 UI 中公開 - [PR #35714](https://github.com/BerriAI/litellm/pull/35714)
    - 讓提醒標記配對可設定，並接受任何測試框架輸出的配對 - [PR #35874](https://github.com/BerriAI/litellm/pull/35874), [PR #36029](https://github.com/BerriAI/litellm/pull/36029)
    - 比對 regex 單字邊界會漏掉的 CJK `keyword_tier_rules` - [PR #35984](https://github.com/BerriAI/litellm/pull/35984)
    - 防止 embedding 模型的上下文視窗讓長請求失敗 - [PR #35956](https://github.com/BerriAI/litellm/pull/35956)
    - 限制備援遍歷的工作量與錯誤記錄量 - [PR #36148](https://github.com/BerriAI/litellm/pull/36148)
    - 在呼叫端遮罩備援 traceback，並涵蓋同步延遲串流 - [PR #35843](https://github.com/BerriAI/litellm/pull/35843)
    - 預先擷取 Vertex AI 延遲串流，讓 HTTP 錯誤在 `_acompletion` 備援路徑中浮現 - [PR #34627](https://github.com/BerriAI/litellm/pull/34627)
    - 在價格資料重新載入期間保留自訂 `model_info` - [PR #35491](https://github.com/BerriAI/litellm/pull/35491)
- **連線與快取**
    - 自我修復在快取逐出後關閉的處理器用戶端，然後再於其上重新加入逐出 LLM 用戶端的關閉處理 - [PR #35862](https://github.com/BerriAI/litellm/pull/35862), [PR #35870](https://github.com/BerriAI/litellm/pull/35870)
    - 停止 pooled clients 將 cookie 保存在 aiohttp jar 中 - [PR #36149](https://github.com/BerriAI/litellm/pull/36149)
    - 停止將每個呼叫端的狀態寫入共享的快取 A2A httpx 用戶端 - [PR #35978](https://github.com/BerriAI/litellm/pull/35978)
    - 安裝 hiredis，讓 redis-py 使用其 C parser 解析回應 - [PR #35709](https://github.com/BerriAI/litellm/pull/35709)
- **吞吐量**
    - 延後建立記錄訊息，因此被過濾掉的 log records 幾乎沒有成本 - [PR #35703](https://github.com/BerriAI/litellm/pull/35703)
    - 以線性時間組裝串流工具呼叫引數 - [PR #35826](https://github.com/BerriAI/litellm/pull/35826)
- **資料庫與啟動**
    - 只有將可復原的資料庫中斷視為可在沒有資料庫的情況下提供服務的依據，且在啟動健康檢查失敗時保留已連線的 DB 用戶端 - [PR #35864](https://github.com/BerriAI/litellm/pull/35864), [PR #35837](https://github.com/BerriAI/litellm/pull/35837)
    - 停止對失去預定 engine 重新啟動競爭的健康探測發出警報 - [PR #36141](https://github.com/BerriAI/litellm/pull/36141)
    - 以感知 Retry-After 的退避重試 model cost map 擷取，在重新載入失敗時保留目前的 map，並延後記錄該失敗 - [PR #35739](https://github.com/BerriAI/litellm/pull/35739), [PR #35750](https://github.com/BerriAI/litellm/pull/35750)
- **遷移與映像**
    - 從中斷的 Prisma toolchain 安裝中復原，並避免在無法讀取的 nodeenv cache 上讓修復動作拋出錯誤 - [PR #35832](https://github.com/BerriAI/litellm/pull/35832), [PR #35986](https://github.com/BerriAI/litellm/pull/35986)
    - 在 pip image 中將 prisma engines 烘焙到世界可讀的路徑，並在元件化映像中烘焙到 `/opt/prisma`，讓任何 uid 都能啟動 - [PR #35976](https://github.com/BerriAI/litellm/pull/35976), [PR #35989](https://github.com/BerriAI/litellm/pull/35989)
- **依賴項與維護**
    - 將 cryptography 升級到 50.0.0 - [PR #35803](https://github.com/BerriAI/litellm/pull/35803)
    - 將 gitpython 提升到 3.1.58、h2 到 4.4.1、js-yaml 到 4.3.1、nanoid 到 3.3.17、brace-expansion，以及 postcss - [PR #36212](https://github.com/BerriAI/litellm/pull/36212), [PR #36147](https://github.com/BerriAI/litellm/pull/36147), [PR #36227](https://github.com/BerriAI/litellm/pull/36227), [PR #35692](https://github.com/BerriAI/litellm/pull/35692)
    - 將 Admin UI toolchain 移至 Node 24 - [PR #35801](https://github.com/BerriAI/litellm/pull/35801)
    - 從鏡像同步 Terraform provider 0.3.0，並推出 0.4.0 - [PR #36098](https://github.com/BerriAI/litellm/pull/36098)

## 文件更新 {#documentation-updates}

- 文件化 `/key/info` 欄位，並澄清 `budget_reset_at` 是下一次重設 - [PR #36127](https://github.com/BerriAI/litellm/pull/36127)
- 將 classic Helm chart 的 128Mi 資源範例替換為文件中記載的 4Gi 規模 - [PR #35830](https://github.com/BerriAI/litellm/pull/35830)
- 在 PR template 中新增包含撰寫說明的 User Flow 區段 - [PR #36162](https://github.com/BerriAI/litellm/pull/36162)
- 將所有 GitHub comments 上限設為 15-25 個字，並在 contributor guide 中抑制分號拼接句 - [PR #36059](https://github.com/BerriAI/litellm/pull/36059)
- 在以逗號取代破折號時偏好逗號而非分號，並澄清準則優先順序 - [PR #35825](https://github.com/BerriAI/litellm/pull/35825), [PR #36296](https://github.com/BerriAI/litellm/pull/36296)

### 依擁有權領域彙總 PR {#pr-roll-up-by-ownership-area}

依擁有權領域的 PR（總計：253）

- 其他（CI / chore / tests / build / version bumps）：86
- 效能：30
- UI：28
- LLM API 端點：21
- 驗證與管理：20
- 支出 / 預算 / 速率限制：20
- 模型與提供者：17
- 記錄：15
- 防護欄：10
- 文件：6

## 端到端測試 {#end-to-end-testing}

我們正大力投資端到端測試，以減少回歸並讓 LiteLLM 隨著每次發版都更穩定。每個版本都由一個即時測試套件進行驗證，該套件會對真實已部署的 proxy 執行，並呼叫真實的提供者端點，而非 mock，因此我們驗證的行為就是您在 production 中得到的行為。

這個時段新增了 18 個僅測試用途的 PR，其中 11 個涉及即時 e2e 套件。新增與修補的涵蓋範圍落在 legacy text `/completions` 端點、control-plane 寫入在每個 replica 上都已穩定完成而不只是單一個、provider 暫時性狀態在 transport 層以有界退避重試，以及 UI 套件在 global setup 中自行播種自己的密碼登入用戶。負載與效能測試已自主套件中移出，因此較慢的 lane 不再卡住正確性，而中途新增的 vendor API strategy 涵蓋範圍在證實不穩定後已回退。以 view 為基礎的 global spend 探測則因 LIT-5211 而暫時保留，不再處於偶發失敗狀態。

## 新貢獻者 {#new-contributors}

- @hMED22 在 [PR #34971](https://github.com/BerriAI/litellm/pull/34971) 完成他們的第一次貢獻
- @AkashNaickar 在 [PR #34800](https://github.com/BerriAI/litellm/pull/34800) 完成他們的第一次貢獻
- @Souravrajvi0 在 [PR #34092](https://github.com/BerriAI/litellm/pull/34092) 完成他們的第一次貢獻
- @rimysore 在 [PR #35367](https://github.com/BerriAI/litellm/pull/35367) 完成他們的第一次貢獻
- @elinacse 在 [PR #35468](https://github.com/BerriAI/litellm/pull/35468) 完成他們的第一次貢獻
- @aayush598 在 [PR #35952](https://github.com/BerriAI/litellm/pull/35952) 完成他們的第一次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.96.0...v1.97.0
