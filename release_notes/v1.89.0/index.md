---
title: "v1.89.0 - Claude Fable 5、A2A 代理程式提供者與 MCP 每伺服器控制"
slug: "v1-89-0"
date: 2026-06-10T11:04:00
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

## 部署此版本 {#deploy-this-version}

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.89.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.89.0
```

</TabItem>
</Tabs>

## 重點亮點 {#key-highlights}

`v1.89.0` 建立於 [`v1.88.0`](/release_notes/v1.88.0/v1-88-0)。

- **Claude Fable 5** 已在 Anthropic、Bedrock、Azure AI 和 Vertex 全面支援，具備 100 萬 token 上下文、自適應思考與電腦使用功能。
- **Agent-to-agent (A2A)** 新增兩個新的代理程式提供者 - watsonx Orchestrate 和 LangFlow（含 A2A 會話橋接）- 以及 Databricks Apps 代理程式的 OAuth M2M。
- **MCP gateway** 新增每伺服器環境變數，具備全域與每位使用者範圍；為金鑰與團隊提供每伺服器 RPM 速率限制；具備發行者範圍 JWT 驗證的 OAuth passthrough，以及伺服器註冊時的 `oauth2_flow` 持久化。
- **可觀測性** 為 Arize/Phoenix 帶來 OpenInference 渲染一致性（工具呼叫、成本、passthrough I/O、會話、多模態、快取 token），在 typed OTel v2 spans 上加入 MCP 語意慣例，並提供使用 ingest-traces API 的 Galileo logger。
- **新的搜尋與轉錄提供者** - APISerpent、You.com 與 Soniox - 加入閘道，並且儀表板已遷移至完全 typed、由 OpenAPI 產生的 API 用戶端。

---

### MCP 憑證存放區 {#mcp-credential-store}

<Image img={require('../../img/release_notes/mcp_credential_store.png')} style={{ width: '800px', height: 'auto' }} />

<br/>

此版本可讓您在閘道上直接安全地為 MCP 伺服器儲存每個伺服器的憑證。您可在伺服器上一次定義變數，並將其範圍設定為 **Instance**（跨所有使用者共用）或 **Per-user**（每位使用者提供自己的值），再透過 `${VAR_NAME}` 語法（例如 `${DB_PROTOCOL}://${CORP_USERNAME}:${CORP_PASSWORD}@${DB_HOSTNAME}`）在靜態標頭或驗證中參照，讓每位使用者連接自己的身分。

[開始使用](../../docs/mcp#server-variables)

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（3 個新提供者） {#new-providers-3-new-providers}

| 提供者                  | 支援的 LiteLLM 端點 | 說明                           |
| ------------------------- | --------------------------- | ------------------------------------- |
| APISerpent (`apiserpent`) | 搜尋                      | 網頁搜尋與深度搜尋 API        |
| You.com (`you_com`)       | 搜尋                      | You.com 網頁搜尋 API                |
| Soniox (`soniox`)         | Audio Transcription         | 非同步語音轉文字 (`stt-async-v4`) |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（精選） {#new-model-support-selected}

| 提供者       | 模型                                                           | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能                                                                  |
| -------------- | --------------------------------------------------------------- | -------------- | ------------------- | -------------------- | ------------------------------------------------------------------------- |
| Anthropic      | `claude-fable-5`                                                | 1,000,000      | $10.00              | $50.00               | 自適應思考、電腦使用、函式呼叫、提示快取、視覺 |
| Vertex AI      | `vertex_ai/claude-fable-5`                                      | 1,000,000      | $10.00              | $50.00               | 與 Anthropic 直接相同                                                  |
| Azure AI       | `azure_ai/claude-fable-5`                                       | 1,000,000      | $10.00              | $50.00               | 與 Anthropic 直接相同                                                  |
| Bedrock        | `anthropic.claude-fable-5` (+ `global.` / `us.` / `eu.` 路由) | 1,000,000      | $10.00              | $50.00               | 與 Anthropic 直接相同                                                  |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-5.5`                                 | 272,000        | $5.50               | $33.00               | Responses API、推理、函式呼叫、提示快取                |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-5.4`                                 | 272,000        | $2.75               | $16.50               | Responses API、推理、函式呼叫、提示快取                |
| Azure AI       | `azure_ai/kimi-k2.6`                                            | 262,144        | $0.95               | $4.00                | 推理、視覺、函式呼叫、工具選擇                          |
| MiniMax        | `minimax/MiniMax-M3`                                            | 512,000        | $0.60               | $2.40                | 推理、提示快取、函式呼叫                               |
| Inception      | `inception/mercury-2` (+ `mercury-edit-2`)                      | 128,000        | $0.25               | $0.75                | 函式呼叫、提示快取、回應結構                         |

其他 model-map 新增項目：fal.ai Nano Banana 與 Gemini 2.5 Flash Image 生成 - [PR #29798](https://github.com/BerriAI/litellm/pull/29798)；`mistral/ministral-8b-latest` - [PR #29453](https://github.com/BerriAI/litellm/pull/29453)；一批新的 Snowflake Cortex 模型項目（Claude、GPT、Llama、embeddings）；`vertex_ai/google/gemma-4-26b-a4b-it-maas`；APISerpent、You.com 與 Soniox 目錄項目；以及 Claude Opus 4.7 的 `jp.` 區域路由。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
  - 透過模式比對將未來的 Claude 模型路由至 Anthropic 提供者 - [PR #29239](https://github.com/BerriAI/litellm/pull/29239)
  - 將 Claude Opus 4.8 經由自適應思考路由 - [PR #29702](https://github.com/BerriAI/litellm/pull/29702)
  - 在 Anthropic 適配器中，為僅有 `reasoning_content` 的串流區塊輸出 thinking block - [PR #29600](https://github.com/BerriAI/litellm/pull/29600)
  - 將舊版 `$ref` defs 內嵌至工具結構描述（Anthropic 和 Fireworks）- [PR #28646](https://github.com/BerriAI/litellm/pull/28646)
- **[Gemini](../../docs/providers/gemini)**
  - 支援 `googleSearch` 搭配伺服器端工具與 `googleMaps` JSON schema - [PR #29582](https://github.com/BerriAI/litellm/pull/29582)
  - 在 Gemini realtime 上使用 GA event names 以相容 Pipecat 1.3.x - [PR #29662](https://github.com/BerriAI/litellm/pull/29662)
- **[Vertex AI](../../docs/providers/vertex)**
  - 將使用者提供的 `api_base` 原樣用於 Model Garden OpenAI-compatible 路徑 - [PR #29530](https://github.com/BerriAI/litellm/pull/29530)
  - 處理 namespace tools，並移除 `client_metadata` 以相容 Vertex/Anthropic 上的 Codex - [PR #29489](https://github.com/BerriAI/litellm/pull/29489)
- **[Azure AI](../../docs/providers/azure_ai)**
  - 在發生 400 時移除工具層級額外欄位並重試 - [PR #29479](https://github.com/BerriAI/litellm/pull/29479)

#### 錯誤修正 {#bug-fixes}

- **一般**
  - 在 Anthropic 上下文溢位時回傳 400（而非 500），並在驗證失敗時種子化身分 - [PR #29848](https://github.com/BerriAI/litellm/pull/29848)
  - 在 google-genai `streamGenerateContent` 上省略 OpenAI `[DONE]` sentinel - [PR #29426](https://github.com/BerriAI/litellm/pull/29426)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[批次](../../docs/batches)**
  - 略過不必要的批次輸入檔案讀取 - [PR #29114](https://github.com/BerriAI/litellm/pull/29114)
  - 取消受管理的批次時正確解析憑證 - [PR #29734](https://github.com/BerriAI/litellm/pull/29734)
- **向量儲存**
  - 從團隊部署解析向量儲存檔案清單憑證 - [PR #29739](https://github.com/BerriAI/litellm/pull/29739)
  - 支援 Vertex AI Search 的 engines URL - [PR #27885](https://github.com/BerriAI/litellm/pull/27885)
  - 將每個請求的參數轉送至 Vertex AI Search - [PR #29459](https://github.com/BerriAI/litellm/pull/29459)
- **即時**
  - 追蹤即時音訊 token 成本 - [PR #29722](https://github.com/BerriAI/litellm/pull/29722)
  - 允許串流記錄負載中的 null 逐字稿 - [PR #29625](https://github.com/BerriAI/litellm/pull/29625)
  - WebSocket 連線改善 - [PR #29563](https://github.com/BerriAI/litellm/pull/29563)

#### 代理程式（A2A） {#agents-a2a}

- watsonx Orchestrate 代理程式提供者 - [PR #29410](https://github.com/BerriAI/litellm/pull/29410)
- 具備 A2A 會話橋接的 LangFlow 代理程式提供者 - [PR #28963](https://github.com/BerriAI/litellm/pull/28963)
- Databricks Apps A2A 代理程式的 OAuth M2M - [PR #29586](https://github.com/BerriAI/litellm/pull/29586)
- A2A 錯誤修正 - [PR #29566](https://github.com/BerriAI/litellm/pull/29566)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰與驗證**
  - JWT 到虛擬金鑰的對應 - [PR #28510](https://github.com/BerriAI/litellm/pull/28510)
  - 讓內部使用者檢視搜尋工具 - [PR #29542](https://github.com/BerriAI/litellm/pull/29542)
  - 在 `can_key_call_model` 中擴充 all-team-models sentinel 以進行批次驗證 - [PR #29746](https://github.com/BerriAI/litellm/pull/29746)
- **儀表板**
  - 從 proxy OpenAPI 規格產生儀表板 API 型別 - [PR #29816](https://github.com/BerriAI/litellm/pull/29816)
  - 將 proxy 基底 URL 解析集中到經過測試的 resolver - [PR #29793](https://github.com/BerriAI/litellm/pull/29793)
  - 將網路呼叫路由ผ่าน共用、位置固定的 `apiClient` - [PR #29723](https://github.com/BerriAI/litellm/pull/29723), [PR #29806](https://github.com/BerriAI/litellm/pull/29806), [PR #29815](https://github.com/BerriAI/litellm/pull/29815)
  - 將 ESLint 遷移至 flat config，並將 `eslint-config-next` 升級至 16 - [PR #29626](https://github.com/BerriAI/litellm/pull/29626)

#### 錯誤修正 {#bug-fixes-1}

- 針對舊版電子郵件比對（JWT）的花費使用已解析的 DB `user_id` - [PR #29217](https://github.com/BerriAI/litellm/pull/29217)
- 在 OTel traces 中保留過期 JWT 的 401 狀態 - [PR #29510](https://github.com/BerriAI/litellm/pull/29510)
- 停止團隊 BYOK 模型名稱在模型編輯時損毀 - [PR #29731](https://github.com/BerriAI/litellm/pull/29731)
- 從 `team.models` 移除已刪除的團隊 BYOK 模型名稱 - [PR #29820](https://github.com/BerriAI/litellm/pull/29820)
- 將 `default=None` 加入 `LiteLLM_TeamMembership.litellm_budget_table` - [PR #29684](https://github.com/BerriAI/litellm/pull/29684)
- 重新產生過期金鑰時需要新的到期時間 - [PR #29838](https://github.com/BerriAI/litellm/pull/29838)
- 依呼叫者順序呈現呼叫者提供的篩選器選項（LIT-3151） - [PR #29462](https://github.com/BerriAI/litellm/pull/29462)
- 讓 A2A 技能標籤可輸入並可驗證 - [PR #29512](https://github.com/BerriAI/litellm/pull/29512)
- 將 Tools 分頁的 MCP OAuth token 持久化到 DB - [PR #29809](https://github.com/BerriAI/litellm/pull/29809)
- 依 OAuth2 模式而非 `token_url` 路由 MCP playground 驗證 - [PR #29714](https://github.com/BerriAI/litellm/pull/29714)
- 停止 MCP playground 工具呼叫重複送出 - [PR #29821](https://github.com/BerriAI/litellm/pull/29821)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Arize / Phoenix](../../docs/proxy/logging)**
  - OpenInference 呈現一致性：工具呼叫、成本、passthrough I/O、session/user、多模態，以及快取 token - [PR #28800](https://github.com/BerriAI/litellm/pull/28800)
- **[Datadog](../../docs/proxy/logging#datadog)**
  - 在 413 時拆分過大的批次，而不是無限期重新排入佇列 - [PR #29444](https://github.com/BerriAI/litellm/pull/29444)
- **Galileo**
  - 使用 ingest-traces API 與標準記錄負載 - [PR #29651](https://github.com/BerriAI/litellm/pull/29651)
- **OpenTelemetry**
  - 將升級為 baggage 的 `team_metadata` 子鍵加入允許清單 - [PR #29442](https://github.com/BerriAI/litellm/pull/29442)
  - 將 MCP 語意慣例新增至 OTel v2 - [PR #29468](https://github.com/BerriAI/litellm/pull/29468)
  - 在管理端點 spans 中擷取 401 錯誤詳細資訊 - [PR #29535](https://github.com/BerriAI/litellm/pull/29535)
  - 發出缺少的 MCP span 屬性 - [PR #29554](https://github.com/BerriAI/litellm/pull/29554)
  - 在 passthrough 時發出 guardrail span，包括 guardrail 阻擋時 - [PR #29552](https://github.com/BerriAI/litellm/pull/29552), [PR #29470](https://github.com/BerriAI/litellm/pull/29470)

### 防護欄 {#guardrails}

- **[敏感資料路由](../../docs/proxy/guardrails/quick_start)**
  - 將敏感資料路由至內部部署模型 - [PR #29531](https://github.com/BerriAI/litellm/pull/29531)

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 從花費記錄負載中移除 NUL 位元組，以防止 PostgreSQL `22P05` 錯誤 - [PR #29515](https://github.com/BerriAI/litellm/pull/29515)
- 將 session-token team-key 預算豁免的範圍限制為呼叫者提供的 `team_id` - [PR #29641](https://github.com/BerriAI/litellm/pull/29641)

## MCP 閘道 {#mcp-gateway}

- 具有全域與每位使用者範圍的每伺服器環境變數 - [PR #28917](https://github.com/BerriAI/litellm/pull/28917)
- 針對每個 MCP 伺服器的 keys 與 teams RPM 速率限制 - [PR #29482](https://github.com/BerriAI/litellm/pull/29482)
- 支援 MCP OAuth passthrough 與 issuer 範圍的 JWT 驗證 - [PR #28356](https://github.com/BerriAI/litellm/pull/28356)
- 在 MCP 伺服器註冊時持久化 `oauth2_flow` - [PR #29690](https://github.com/BerriAI/litellm/pull/29690)
- 在編輯 MCP 伺服器時清除 `allowed_tools` 與工具覆寫 - [PR #29411](https://github.com/BerriAI/litellm/pull/29411)
- 嚴格依 `litellm.public_mcp_servers` 限制 `/public/mcp_hub` - [PR #27764](https://github.com/BerriAI/litellm/pull/27764)

## 效能 / 負載平衡 / 可靠度改善 {#performance--loadbalancing--reliability-improvements}

- 原生 `/health/drain` preStop hook，用於優雅關閉 - [PR #29439](https://github.com/BerriAI/litellm/pull/29439)
- 停用串流 SSE 回應上的 proxy 緩衝 - [PR #29557](https://github.com/BerriAI/litellm/pull/29557)
- 在內部速率限制錯誤上填入 `llm_provider` - [PR #27707](https://github.com/BerriAI/litellm/pull/27707)
- 在開發環境中以 `--reload` 執行時熱重載 `.env` - [PR #29783](https://github.com/BerriAI/litellm/pull/29783)
- 啟用 Helm backend deployment 以掛載 gateway `config.yaml` - [PR #29605](https://github.com/BerriAI/litellm/pull/29605)
- 將 AWS 與 GCP Terraform stacks 轉換為可重用模組 - [PR #28103](https://github.com/BerriAI/litellm/pull/28103)
- Terraform GCP：在銷毀時放棄 SQL 使用者 - [PR #29855](https://github.com/BerriAI/litellm/pull/29855)；在 DeployStack 一鍵部署中提示輸入 `image_registry` - [PR #29852](https://github.com/BerriAI/litellm/pull/29852)
- 相依套件升級 - [PR #29860](https://github.com/BerriAI/litellm/pull/29860)

## 文件更新 {#documentation-updates}

- 釐清何時建立新的測試檔案 - [PR #29472](https://github.com/BerriAI/litellm/pull/29472)
- 從 README hero image 移除固定尺寸 - [PR #29496](https://github.com/BerriAI/litellm/pull/29496)
- CLAUDE.md 細部調整 - [PR #29504](https://github.com/BerriAI/litellm/pull/29504), [PR #29749](https://github.com/BerriAI/litellm/pull/29749)

### 依擁有權區域彙總的 PR {#pr-roll-up-by-ownership-area}

```
PRs by ownership area (visible, non-vehicle set; total: 101)
  - UI / Dashboard: 22
  - General Proxy (testing / CI / build): 22
  - Models & Providers: 13
  - Performance / Reliability: 10
  - Logging: 9
  - LLM API Endpoints: 8
  - MCP: 6
  - Auth & Management: 5
  - Agents (A2A): 4
  - Docs: 4
  - Spend / Budgets / Rate Limits: 2
  - Models & Providers (new providers): 3
  - Guardrails: 1
```

## 新貢獻者 {#new-contributors}

- @someswar177 在 https://github.com/BerriAI/litellm/pull/26585 完成了第一次貢獻
- @trexinc 在 https://github.com/BerriAI/litellm/pull/26597 完成了第一次貢獻
- @navnitshukla 在 https://github.com/BerriAI/litellm/pull/26609 完成了第一次貢獻
- @tanmay958 在 https://github.com/BerriAI/litellm/pull/27580 完成了第一次貢獻
- @samagana 在 https://github.com/BerriAI/litellm/pull/27810 完成了第一次貢獻
- @DrishnaTrivedi 在 https://github.com/BerriAI/litellm/pull/28330 完成了第一次貢獻
- @brainsparker 在 https://github.com/BerriAI/litellm/pull/28370 完成了第一次貢獻
- @icep87 在 https://github.com/BerriAI/litellm/pull/28846 完成了第一次貢獻
- @adriangomez24 在 https://github.com/BerriAI/litellm/pull/29097 完成了第一次貢獻
- @zzw-math 在 https://github.com/BerriAI/litellm/pull/29325 完成了第一次貢獻
- @BeginnerRudy 在 https://github.com/BerriAI/litellm/pull/29392 完成了第一次貢獻
- @danisalvaa 在 https://github.com/BerriAI/litellm/pull/29394 完成了第一次貢獻
- @kapelame 在 https://github.com/BerriAI/litellm/pull/29412 完成了第一次貢獻
- @Zhao73 在 https://github.com/BerriAI/litellm/pull/29419 完成了第一次貢獻
- @suleimanelkhoury 在 https://github.com/BerriAI/litellm/pull/29420 完成了第一次貢獻
- @aneeshsangvikar 在 https://github.com/BerriAI/litellm/pull/29427 完成了第一次貢獻
- @Ar-maan05 在 https://github.com/BerriAI/litellm/pull/29483 完成了第一次貢獻
- @kingdoooo 在 https://github.com/BerriAI/litellm/pull/29490 完成了第一次貢獻
- @dan2k3k4 在 https://github.com/BerriAI/litellm/pull/29508 完成了第一次貢獻
- @yanismiraoui 在 https://github.com/BerriAI/litellm/pull/29522 完成了第一次貢獻
- @josx 在 https://github.com/BerriAI/litellm/pull/29532 完成了第一次貢獻
- @1qh 在 https://github.com/BerriAI/litellm/pull/29561 完成了第一次貢獻
- @tin-berri 在 https://github.com/BerriAI/litellm/pull/29605 完成了第一次貢獻
- @mak2508 在 https://github.com/BerriAI/litellm/pull/29606 完成了第一次貢獻
- @VANDRANKI 在 https://github.com/BerriAI/litellm/pull/29620 完成了第一次貢獻
- @andrey-dubnik 在 https://github.com/BerriAI/litellm/pull/29621 完成了第一次貢獻
- @ErRickow 在 https://github.com/BerriAI/litellm/pull/29646 完成了第一次貢獻
- @saswatds 在 https://github.com/BerriAI/litellm/pull/29650 完成了第一次貢獻
- @Dinesh-Girbide 在 https://github.com/BerriAI/litellm/pull/29655 完成了第一次貢獻
- @BWAAEEEK 在 https://github.com/BerriAI/litellm/pull/29660 完成了第一次貢獻
- @hectorc98 在 https://github.com/BerriAI/litellm/pull/29672 完成了第一次貢獻
- @abhay23-AI 在 https://github.com/BerriAI/litellm/pull/29779 完成了第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.0...v1.89.0

---

## 06/10/2026 {#06102026}

- 新模型 / 更新模型：16
- LLM API 端點：12
- 管理端點 / UI：22
- AI 整合（記錄 / 防護欄）：10
- 支出追蹤、預算與速率限制：2
- MCP 閘道：6
- 效能 / 負載平衡 / 可靠性改進：10
- 一般 Proxy 改進（測試 / CI / build）：22
- 文件更新：4
