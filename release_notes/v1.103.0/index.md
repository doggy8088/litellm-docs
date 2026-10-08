---
title: "v1.103.0 - 設定檔所有權、Fuse 路由與閘道強化"
slug: "v1-103-0"
date: 2026-09-27T00:00:00
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
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.103.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

這些提醒涵蓋 `v1.102.0` 中可用的行為變更，也就是前一個穩定版

**此版本在 `LiteLLM_SpendLogs` 上新增索引，會在啟動時建立索引期間阻擋 spend log 寫入。** 在大型資料表上，這可能需要很長時間。為避免這點，請在升級前先用 `CONCURRENTLY` 自行建立索引，這不會阻擋寫入。接著 migration 會找到它並略過建立。請參閱 [PR #37983](https://github.com/BerriAI/litellm/pull/37983)

```sql
SET statement_timeout = 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_api_key_startTime_idx" ON "LiteLLM_SpendLogs"("api_key", "startTime");
```

請在 transaction 外執行，並從會保持連線直到完成的 session 執行。失敗的 concurrent build 會留下無效索引，而 migration 也會略過它，因此升級前請先檢查。這必須回傳 `true`，否則請執行 `DROP INDEX CONCURRENTLY "LiteLLM_SpendLogs_api_key_startTime_idx";` 並重新建立：

```sql
SELECT indisvalid FROM pg_index WHERE indexrelid = '"LiteLLM_SpendLogs_api_key_startTime_idx"'::regclass;
```

如果您的 spend logs 資料表已分割區，Postgres 無法並行建立其索引。請先在每個分割區上並行建立對應索引，然後在父層以不帶 `CONCURRENTLY` 的相同 `CREATE INDEX` 執行，這樣只會附加它們

**設定檔現在擁有其宣告的每一項設定，資料庫不再覆寫它。** 一條規則取代了每個鍵值上 DB 優先、設定檔優先與合併優先順序的混合做法：如果 `config.yaml` 宣告了某個鍵，該檔案就擁有它，而對該鍵的 runtime 寫入會被拒絕並回傳 400，且會指出要編輯的檔案，而不是被儲存後又悄悄忽略。這涵蓋 `POST /config/field/update`、`POST /config/field/delete`、`POST /config/update` 以及 `allowed_ips` 路由。設定檔未列出的鍵仍然來自資料庫，且仍可編輯。`GET /config/field/info` 和 `GET /config/list` 現在透過相同的 store 解析，並回報 `source` 與 `editable`，而由設定檔擁有的欄位則回報該檔案宣告的值，因此 `os.environ/...` 參照會照原樣回傳，而不是被解析。於 Admin UI 中，設定檔擁有的欄位會以唯讀顯示。啟動時會針對每個其儲存的資料庫值正被忽略的鍵發出一次警告，而拒絕訊息也會附上相同句子加上 `stored_database_value_ignored: true`。請將任何您在 runtime 編輯的設定移出設定檔，或編輯檔案後重新啟動。請參閱 [PR #41779](https://github.com/BerriAI/litellm/pull/41779)、[PR #41862](https://github.com/BerriAI/litellm/pull/41862)、[PR #41868](https://github.com/BerriAI/litellm/pull/41868)、[PR #41931](https://github.com/BerriAI/litellm/pull/41931)、[PR #41985](https://github.com/BerriAI/litellm/pull/41985)、[PR #42009](https://github.com/BerriAI/litellm/pull/42009)

**所有 router fallback 目標都會重新檢查預算。** 一個從免費模型開始並 fallback 到付費模型的請求，現在會在 fallback 時進行把關，而 caller 無法負擔的目標會被略過，而不是提供服務。主要嘗試不變。依賴免費 primary 將超出預算的 key 帶到付費 fallback 的 workflows，現在會收到下一個可負擔的目標或 budget 錯誤。請參閱 [PR #41379](https://github.com/BerriAI/litellm/pull/41379)

**organization 或 project `max_budget` 為 0 現在表示零額度，而非無限制。** 這與既有的 key、team 與 user 語意一致。將 `max_budget` 設為 `null` 即可無限制。請參閱 [PR #41271](https://github.com/BerriAI/litellm/pull/41271)、[PR #41997](https://github.com/BerriAI/litellm/pull/41997)

**key 自己的 per-model rpm/tpm 覆寫現在會優先於 team 的 per-model 限制。** 文件化的優先順序（key metadata 優於 team metadata）現在就是程式碼的實際行為，適用於 chat、batch 與 `/cost/predict-cache`。若某個 key 只覆寫 RPM，仍會套用 team 的 TPM pool；反之亦然。請檢查那些依賴 per-model team 上限來壓住自己宣告 key 的 teams。請參閱 [PR #41302](https://github.com/BerriAI/litellm/pull/41302)

**Delegated MCP OAuth 需要核准。** 尚未獲准加入 LiteLLM 的舊版 delegated MCP 整合現在會收到 401，直到它們核准或移轉到 `oauth_delegate`。請參閱 [PR #40923](https://github.com/BerriAI/litellm/pull/40923)

**`CustomLogger` moderation callback 現在會拒絕該請求。** `llm_api_check` moderation 透過 `during_call_hook` 分派，因此被標記的請求現在會回傳 400，而先前是 200。請參閱 [PR #41685](https://github.com/BerriAI/litellm/pull/41685)

**Bedrock Realtime 需要 `aws-sdk-bedrock-runtime` 0.10 或 0.11。** 固定版本已移到 `aws-sdk-bedrock-runtime[awscrt]>=0.10.0,<0.12.0`；0.7.x 不再支援，而初始化錯誤現在會區分缺少 SDK 與不支援的版本。Nova Sonic sessions 會失敗，直到操作人員安裝帶有 `awscrt` 額外套件的受支援 SDK。請參閱 [PR #41542](https://github.com/BerriAI/litellm/pull/41542)

**`/v1/rag/ingest` 會解析已註冊的 store 並拒絕未具備 ingestion 的提供者。** 以 id 指定已註冊 store 的請求現在會使用該 store 的提供者與 `litellm_params`，而不是預設為 OpenAI Files；只會保留來自 caller 的每次上傳選項；而沒有 ingestion 實作的提供者會回傳 400，指出支援的項目，而不是回傳帶有 `status: failed` 的 200 或 500。請參閱 [PR #41940](https://github.com/BerriAI/litellm/pull/41940)

**Capability 與 Fuse v2 routers 在沒有授權時，各自只能有一個。** 註冊第二個任一分類的 router 會回傳 403，並指出 `auto_router` 權益。既有 routers 不受影響。請參閱 [PR #41326](https://github.com/BerriAI/litellm/pull/41326)

**先前 v1.102 以前的 Admin UI 編輯複製到 `model_info` 的價格會被忽略。** 儲存的 `model_info` blob 若在價格旁帶有 `key` 欄位，會被視為複製的 `/model/info` 回應，因此該列會再次遵循 cost map，並在下次儲存時修復。於 `litellm_params` 中宣告的自訂定價，或是在未使用 `key` 下輸入的定價，不受影響。`/model/info` 現在回報 `model_info.pricing_overrides`。請參閱 [PR #41843](https://github.com/BerriAI/litellm/pull/41843)

**`litellm-proxy` 進入點已被標記為過時，改用 `lite`。** 它仍可執行，並會在 stderr 印出一行過時提示。`lite autoroute up` 與 `down` 已重新命名為 `start` 與 `stop`，舊名稱則保留為已棄用別名。請參閱 [PR #41673](https://github.com/BerriAI/litellm/pull/41673)、[PR #41672](https://github.com/BerriAI/litellm/pull/41672)

**重複失敗的 Admin UI 登入嘗試會被節流**，而 `lite login` session token 會重新與即時的 user 與 team 資料列比對，因此被移除的成員會得到 403、已刪除的 user 會得到 401，而被降權的 admin 會在快取視窗後的下一個請求失去 admin 路由權限。請參閱 [PR #40982](https://github.com/BerriAI/litellm/pull/40982)、[PR #40657](https://github.com/BerriAI/litellm/pull/40657)

:::

## 重點摘要 {#key-highlights}

- **設定檔所有權**：所有設定介面統一一套優先規則，兩個讀取端點上都有 `source` 與 `editable` 旗標，Admin UI 中的欄位為唯讀，並在啟動時針對設定檔正忽略的每個儲存值發出警告
- **Fuse 與 Capability 路由**：capability classifier、capability forecasting 之後的 Fuse V2、per-model Fast mode、維持的 Fuse model 與 harness 預設、作為複雜度分類器的 TypeSafe Jev，以及路由詳情中的 heuristic v2 分數估計
- **閘道強化**：MCP client allowlisting、含 admin 強制關閉的即時 session 可見性、delegated OAuth 核准、供 IdP JWT 使用的 RFC 8693 token exchange，以及依 issuer 區分的 JWT key 範圍
- **Spend 與預算正確性**：以組織成員為單位的 spend、以加總方式強制執行的 project 預算、可被 key 覆寫的 team 層級 `model_max_budget`、暫時性預算增加、key 上的終身 `total_spend`，以及在 fallback targets 上重新檢查預算
- **408 個新的模型目錄項目**：涵蓋 OpenRouter、AIHubMix、Azure、Together AI、Vertex AI、Deepgram 等新增項目，並有 147 項價格修正

## 收錄於 v1.103.0-rc.1 之後 {#included-after-the-v11030-rc1-cut}

穩定版標籤包含以下這些發行線新增內容：

- **Prompt 快取** 會在用戶端快取標記旁套用已設定的 `cache_control_injection_points`，在出現重播的 `redacted_thinking` 區塊時保留 `prompt_caching` 釘選，並在 `/v1/messages` 隱藏用戶端自身標記時，將自動快取點移至 `extra_body`；-[PR #41956](https://github.com/BerriAI/litellm/pull/41956), [PR #42069](https://github.com/BerriAI/litellm/pull/42069), [PR #43341](https://github.com/BerriAI/litellm/pull/43341)
- **MCP** `/v1/mcp/tools` 在 MCP SDK 2 升級後會再次回傳 camelCase `inputSchema` 和 `outputSchema` - [PR #42352](https://github.com/BerriAI/litellm/pull/42352)
- **Rust 橋接** 在設定 `LITELLM_RUST=1` 時，會將 `/v1/messages`、權杖計數器與分詞器保留在 Python 上，因此壓縮編輯不再會以 400 失敗 - [PR #42517](https://github.com/BerriAI/litellm/pull/42517)
- **Bedrock** 會直接串流 `/v1/messages` Invoke 位元組，而不是將其保留在 1024 位元組的區塊器中 - [PR #42607](https://github.com/BerriAI/litellm/pull/42607)
- **串流** 會保留 LiteLLM 在文字完成用量區塊上的 `Usage`，因此帶有 `include_usage` 的 `/v1/completions` 串流會以權杖計數結束，而不是發生錯誤 - [PR #43047](https://github.com/BerriAI/litellm/pull/43047)
- **JWT 與 OpenTelemetry**：`x-litellm-team-id` 接受 team 別名，其 403 錯誤訊息會指出未比對到任何 team id 或別名，而且在啟用 `fallback_to_db_teams` 時，可選取呼叫者所屬的任何 DB team。v2 LLM span 會將呼叫者的 session id 以 `gen_ai.conversation.id` 帶上 - [PR #42445](https://github.com/BerriAI/litellm/pull/42445), [PR #42495](https://github.com/BerriAI/litellm/pull/42495), [PR #43206](https://github.com/BerriAI/litellm/pull/43206), [PR #42486](https://github.com/BerriAI/litellm/pull/42486)
- **Proxy 可靠性** 會停止 DB 設定重新載入時洩漏背景工作，將 team 成員支出資料列以 `jsonb` 傳遞，因此 $0 flush 不會汙染連線池中的連線，並且會取消註冊已從儲存設定中移除的記錄回呼 - [PR #42784](https://github.com/BerriAI/litellm/pull/42784), [PR #43029](https://github.com/BerriAI/litellm/pull/43029), [PR #43429](https://github.com/BerriAI/litellm/pull/43429)
- **用量頁面** 會再次載入每個 key 的支出。top-N key 上限與每日全域支出彙總從 rc.1 讀取的內容已在 stable 之前回復，而 `LiteLLM_DailyGlobalSpend` 表格與 migration 仍保留，因此 [PR #41293](https://github.com/BerriAI/litellm/pull/41293) 和 [PR #41324](https://github.com/BerriAI/litellm/pull/41324) 已不再列於下方 - [PR #43326](https://github.com/BerriAI/litellm/pull/43326)

## 新增提供者與端點 {#new-providers-and-endpoints}

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做什麼 |
| --- | --- | --- |
| [NVIDIA NIM](../../docs/providers/nvidia_nim) | `/nvidia_nim/*` | 透過轉送路由存取 NIM 物件偵測與 OCR `/v1/infer` |
| [Amazon Transcribe](../../docs/pass_through/transcribe) | `/transcribe/*` | 透過轉送路由提交轉錄工作，採完成時計價 |
| [Deepgram](../../docs/pass_through/deepgram_listen_websocket) | `/v1/listen` | 透過 WebSocket 轉送串流音訊，並以持續時間追蹤成本 |
| [Azure AI Speech](../../docs/pass_through/azure_speech) | `/azure/speech/*` | 透過轉送路由存取 Azure AI Speech |
| [xAI](../../docs/providers/xai) | `/v1/audio/transcriptions` | 使用 Grok Voice Transcribe 轉錄音訊 |
| [Vertex AI](../../docs/providers/vertex) | `/v1/realtime` | 透過 realtime API 串流 Chirp 語音轉文字 |
| [Hosted vLLM](../../docs/providers/vllm) | `/v1/batches` | 在 LiteLLM 內對託管的 vLLM 部署執行批次 |
| [Mistral](../../docs/pass_through/mistral) | `/v1/files`, `/v1/batches` | 提交 Mistral 檔案與批次，並進行每頁 OCR 批次成本追蹤 |
| [AWS Textract](../../docs/providers/bedrock) | `/v1/ocr` | 在 Rust OCR 路徑上透過 Textract 執行 OCR |
| [Microsoft Foundry](../../docs/providers/azure_ai) | `/a2a/*` | 透過 Entra 驗證與具版本的卡片探索存取 Foundry 代理程式 |
| [TypeSafe AI](../../docs/pass_through/typesafe) | `/typesafe/*` | 存取 Jev evaluate 端點，並依註冊表計價追蹤支出 |

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（新增 408 個模型） {#new-model-support-408-new-models}

數量代表新的型錄識別碼，包括別名與區域變體。以下價格為本次發行隨附的 USD 值；執行階段重新載入 pricing map 可更新這些值。輸入與輸出欄位顯示基礎權杖費率；長上下文、快取、影像權杖及其他專用費率取決於模型

| 提供者 | 模型 | Context Window | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| AIHubMix | `aihubmix/agnes-2.5-flash` | 512,000 | $0.03 | $0.15 | 聊天；推理；視覺 |
| AIHubMix | `aihubmix/agnes-2.5-pro` | 1,000,000 | $0.45 | $0.9 | 聊天；推理；視覺；提示快取 |
| AIHubMix | `aihubmix/cc-glm-5.1` | 200,000 | $0.06 | $0.22 | 聊天；推理；工具呼叫；結構化輸出 |
| AIHubMix | `aihubmix/claude-fable-5` | 1,000,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/claude-haiku-4-5` | 200,000 | $1.1 | $5.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/claude-opus-4-8-think` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/claude-opus-5` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/claude-sonnet-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/coding-glm-5.3` | 1,048,576 | $0.06 | $0.22 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/coding-kimi-k3` | 1,048,576 | $0.44 | $1.61333 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/coding-xiaomi-mimo-v2-omni` | - | $0.08 | $0.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/coding-xiaomi-mimo-v2.5` | 1,048,576 | $0.08 | $0.16 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/coding-xiaomi-mimo-v2.5-pro` | 1,048,576 | $0.2 | $0.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/command-a-plus-05-2026` | 128,000 | $2.5 | $10 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| AIHubMix | `aihubmix/deepseek-v4-flash` | 1,000,000 | $0.142 | $0.284 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/deepseek-v4-pro` | 1,000,000 | $1.69 | $3.38 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/doubao-seed-2-0-code-preview` | 256,000 | $0.4822 | $2.411 | 聊天；推理；視覺；工具呼叫；提示快取；網頁搜尋 |
| AIHubMix | `aihubmix/doubao-seed-2-0-lite-260428` | 256,000 | $0.09041 | $0.54246 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/doubao-seed-2-0-mini` | 256,000 | $0.030136 | $0.30136 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/doubao-seed-2-0-pro` | 256,000 | $0.4822 | $2.411 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/doubao-seed-2-1-turbo` | 256,000 | $0.46475 | $2.32375 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/ernie-5.1` | 119,000 | $0.5634 | $2.5353 | 聊天；推理；提示快取 |
| AIHubMix | `aihubmix/gemini-3-flash-preview` | 1,048,576 | $0.5 | $3 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemini-3-flash-preview-search` | 1,048,576 | $0.5 | $3 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemini-3.1-pro-preview` | 1,048,576 | $2 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemini-3.1-pro-preview-customtools` | 1,048,576 | $2 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemini-3.5-flash-lite` | 1,048,576 | $0.3 | $2.499999 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemini-3.7-flash` | 1,048,576 | $0.75 | $3.75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gemma-4-26b-a4b-it` | 262,144 | $0.14 | $0.39998 | 聊天；推理；視覺 |
| AIHubMix | `aihubmix/gemma-4-31b-it` | 262,144 | $0.14 | $0.39998 | 聊天；推理；視覺 |
| AIHubMix | `aihubmix/glm-5.2-fast-preview` | 1,000,000 | $2.254 | $7.889 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/glm-5.3` | 1,048,576 | $1.1268 | $3.9438 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/glm-5.3-flash` | 1,048,576 | $0.11268 | $0.39438 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/glm-5v-turbo` | 200,000 | $0.7042 | $3.09848 | 聊天；推理；視覺；提示快取 |
| AIHubMix | `aihubmix/gpt-5.3-codex` | 400,000 | $1.75 | $14 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/gpt-5.4-high` | 1,050,000 | $2.5 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.4-low` | 1,050,000 | $2.5 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.4-mini` | 400,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.4-nano` | 400,000 | $0.2 | $1.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.5` | 1,050,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.5-pro` | 1,050,000 | $30 | $180 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/gpt-5.6-luna` | 1,050,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/gpt-5.6-sol-disc` | 1,050,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/gpt-5.6-terra` | 1,050,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/gpt-chat-latest` | 400,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/grok-4-20-non-reasoning` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/grok-4-20-reasoning` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/grok-4.6` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/grok-build-0.1` | 256,000 | $1 | $2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/hy3` | 256,000 | $0.1562 | $0.6248 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/hy4-preview` | 1,048,576 | $0.845 | $2.535 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/kimi-k2.6` | 262,144 | $0.95 | $3.9995 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/kimi-k2.7-code-highspeed` | 262,144 | $1.9 | $7.999 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/kimi-k3` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/longcat-2.0` | 1,000,000 | $0.7746 | $3.0984 | 聊天；推理；工具呼叫；提示快取 |
| AIHubMix | `aihubmix/mai-thinking-1` | 256,000 | $2 | $8 | 聊天；推理；結構化輸出 |
| AIHubMix | `aihubmix/mimo-v2-omni` | 256,000 | $0.44 | $2.2 | 聊天；視覺；提示快取；網頁搜尋 |
| AIHubMix | `aihubmix/mimo-v2-pro` | 1,000,000 | $1.1 | $3.3 | 聊天；提示快取；網頁搜尋 |
| AIHubMix | `aihubmix/minimax-m2.7` | 204,800 | $0.2958 | $1.1832 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIHubMix | `aihubmix/minimax-m3` | 1,000,000 | $0.288 | $1.152 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| AIHubMix | `aihubmix/muse-spark-1.2` | 1,048,576 | $1.375 | $4.675 | 聊天；推理；視覺；工具呼叫 |
| AIHubMix | `aihubmix/qwen3-coder-next` | 262,144 | $0.137 | $0.548 | 聊天；工具呼叫；結構化輸出 |
| AIHubMix | `aihubmix/qwen3.5-122b-a10b` | 262,144 | $0.1126 | $0.9008 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |

| AIHubMix | `aihubmix/qwen3.5-397b-a17b` | 262,144 | $0.1644 | $0.9864 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.6-27b` | 262,144 | $0.422 | $2.532 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.6-35b-a3b` | 262,144 | $0.254 | $1.524 | 聊天；推理；視覺；工具呼叫；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.6-max-preview` | 262,144 | $1.268 | $7.608 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.7-plus` | 1,000,000 | $0.282 | $1.128 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.8-2.4t-a95b` | 1,000,000 | $2 | $6 | 聊天；推理；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.8-flash` | 1,000,000 | $0.1126 | $0.380025 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/qwen3.8-max` | 1,000,000 | $1.69 | $5.07 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| AIHubMix | `aihubmix/step-3.7-flash` | 256,000 | $0.22 | $1.32 | 聊天；推理；視覺；提示快取 |
| Amazon Bedrock | `writer.palmyra-vision-7b` | 4,096 | $0.15 | $0.6 | 聊天；視覺 |
| Amazon Transcribe | `transcribe/StartTranscriptionJob` | - | - | - | 轉錄；`input_cost_per_second`：$0.0001；`output_cost_per_second`：$0 |
| Azure AI | `azure_ai/FLUX.2-flex` | 32,000 | - | - | 圖像生成 |
| Azure AI | `azure_ai/gpt-5.5-2026-04-24` | 1,050,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/chat-latest` | 272,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/eu/codex-mini` | - | $1.65 | $6.6 | 聊天 |
| Azure OpenAI | `azure/eu/computer-use-preview` | - | $3.3 | $13.2 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-4.1` | - | $2.2 | $8.8 | 聊天；`input_cost_per_token_batches`：$1.1e-06；`output_cost_per_token_batches`：$4.4e-06 |
| Azure OpenAI | `azure/eu/gpt-4.1-mini` | - | $0.44 | $1.76 | 聊天；`input_cost_per_token_batches`：$2.2e-07；`output_cost_per_token_batches`：$8.8e-07 |
| Azure OpenAI | `azure/eu/gpt-4.1-nano` | - | $0.11 | $0.44 | 聊天；`input_cost_per_token_batches`：$5.5e-08；`output_cost_per_token_batches`：$2.2e-07 |
| Azure OpenAI | `azure/eu/gpt-4o-2024-05-13` | - | $5.5 | $16.5 | 聊天；`input_cost_per_token_batches`：$2.75e-06；`output_cost_per_token_batches`：$8.25e-06 |
| Azure OpenAI | `azure/eu/gpt-5` | - | $1.375 | $11 | 聊天；`input_cost_per_token_batches`：$6.875e-07；`output_cost_per_token_batches`：$5.5e-06 |
| Azure OpenAI | `azure/eu/gpt-5-codex` | - | $1.375 | $11 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5-mini` | - | $0.275 | $2.2 | 聊天；`input_cost_per_token_batches`：$1.375e-07；`output_cost_per_token_batches`：$1.1e-06 |
| Azure OpenAI | `azure/eu/gpt-5-nano` | - | $0.055 | $0.44 | 聊天；`input_cost_per_token_batches`：$2.75e-08；`output_cost_per_token_batches`：$2.2e-07 |
| Azure OpenAI | `azure/eu/gpt-5-pro` | - | $16.5 | $132 | 聊天；`input_cost_per_token_batches`：$8.25e-06；`output_cost_per_token_batches`：$6.6e-05 |
| Azure OpenAI | `azure/eu/gpt-5.1-codex-max` | - | $1.375 | $11 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5.2` | - | $1.925 | $15.4 | 聊天；`input_cost_per_token_batches`：$9.625e-07；`output_cost_per_token_batches`：$7.7e-06 |
| Azure OpenAI | `azure/eu/gpt-5.2-chat` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5.2-codex` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5.2-pro` | - | $23.1 | $184.8 | 聊天；`input_cost_per_token_batches`：$1.155e-05；`output_cost_per_token_batches`：$9.24e-05 |
| Azure OpenAI | `azure/eu/gpt-5.3-chat` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5.3-codex` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/eu/gpt-5.4-mini` | - | $0.825 | $4.95 | 聊天；`input_cost_per_token_batches`：$4.125e-07；`output_cost_per_token_batches`：$2.475e-06 |
| Azure OpenAI | `azure/eu/gpt-5.4-nano` | - | $0.22 | $1.375 | 聊天；`input_cost_per_token_batches`：$1.1e-07；`output_cost_per_token_batches`：$6.875e-07 |
| Azure OpenAI | `azure/eu/gpt-5.4-pro` | - | $33 | $198 | 聊天；`input_cost_per_token_batches`：$1.65e-05；`output_cost_per_token_batches`：$9.9e-05 |
| Azure OpenAI | `azure/eu/gpt-5.5-2026-04-24` | 1,050,000 | $5.5 | $33 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具；`input_cost_per_token_batches`：$2.75e-06；`output_cost_per_token_batches`：$1.65e-05 |
| Azure OpenAI | `azure/eu/gpt-6-astra` | - | $11 | $55 | 聊天 |
| Azure OpenAI | `azure/eu/o1-mini` | - | $1.21 | $4.84 | 聊天；`input_cost_per_token_batches`：$6.05e-07；`output_cost_per_token_batches`：$2.42e-06 |
| Azure OpenAI | `azure/eu/o1-preview` | - | $16.5 | $66 | 聊天 |
| Azure OpenAI | `azure/eu/o3-2025-04-16` | - | $2.2 | $8.8 | 聊天；`input_cost_per_token_batches`：$1.1e-06；`output_cost_per_token_batches`：$4.4e-06 |
| Azure OpenAI | `azure/eu/o3-deep-research` | - | $11 | $44 | 聊天 |
| Azure OpenAI | `azure/eu/o4-mini-2025-04-16` | - | $1.21 | $4.84 | 聊天；`input_cost_per_token_batches`：$6.05e-07；`output_cost_per_token_batches`：$2.42e-06 |
| Azure OpenAI | `azure/eu/text-embedding-3-large` | - | $0.143 | - | 嵌入 |
| Azure OpenAI | `azure/eu/text-embedding-3-small` | - | $0.022 | - | 嵌入 |
| Azure OpenAI | `azure/eu/text-embedding-ada-002` | - | $0.11 | - | 嵌入 |
| Azure OpenAI | `azure/gpt-5.5-2026-04-24` | 1,050,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具；`input_cost_per_token_batches`：$2.5e-06；`output_cost_per_token_batches`：$1.5e-05 |
| Azure OpenAI | `azure/gpt-5.6-luna-2026-07-09` | 922,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/gpt-5.6-sol-2026-07-09` | 922,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/gpt-5.6-terra-2026-07-09` | 922,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/gpt-6-astra-2026-09-03` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；電腦使用；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/gpt-chat-latest` | 272,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；系統訊息；平行工具 |
| Azure OpenAI | `azure/gpt-image-2.5-flare` | - | $5 | - | 圖像生成；視覺；PDF 輸入 |
| Azure OpenAI | `azure/gpt-image-2.5-sunburst` | - | $5 | - | 圖像生成；視覺；PDF 輸入 |
| Azure OpenAI | `azure/us/codex-mini` | - | $1.65 | $6.6 | 聊天 |
| Azure OpenAI | `azure/us/computer-use-preview` | - | $3.3 | $13.2 | 聊天 |
| Azure OpenAI | `azure/us/gpt-4.1` | - | $2.2 | $8.8 | 聊天；`input_cost_per_token_batches`：$1.1e-06；`output_cost_per_token_batches`：$4.4e-06 |
| Azure OpenAI | `azure/us/gpt-4.1-mini` | - | $0.44 | $1.76 | 聊天；`input_cost_per_token_batches`：$2.2e-07；`output_cost_per_token_batches`：$8.8e-07 |
| Azure OpenAI | `azure/us/gpt-4.1-nano` | - | $0.11 | $0.44 | 聊天；`input_cost_per_token_batches`：$5.5e-08；`output_cost_per_token_batches`：$2.2e-07 |
| Azure OpenAI | `azure/us/gpt-4o-2024-05-13` | - | $5.5 | $16.5 | 聊天；`input_cost_per_token_batches`：$2.75e-06；`output_cost_per_token_batches`：$8.25e-06 |
| Azure OpenAI | `azure/us/gpt-5` | - | $1.375 | $11 | 聊天；`input_cost_per_token_batches`：$6.875e-07；`output_cost_per_token_batches`：$5.5e-06 |
| Azure OpenAI | `azure/us/gpt-5-codex` | - | $1.375 | $11 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5-mini` | - | $0.275 | $2.2 | 聊天；`input_cost_per_token_batches`：$1.375e-07；`output_cost_per_token_batches`：$1.1e-06 |
| Azure OpenAI | `azure/us/gpt-5-nano` | - | $0.055 | $0.44 | 聊天；`input_cost_per_token_batches`：$2.75e-08；`output_cost_per_token_batches`：$2.2e-07 |
| Azure OpenAI | `azure/us/gpt-5-pro` | - | $16.5 | $132 | 聊天；`input_cost_per_token_batches`：$8.25e-06；`output_cost_per_token_batches`：$6.6e-05 |

| Azure OpenAI | `azure/us/gpt-5.1-codex-max` | - | $1.375 | $11 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5.2` | - | $1.925 | $15.4 | 聊天; `input_cost_per_token_batches`: $9.625e-07; `output_cost_per_token_batches`: $7.7e-06 |
| Azure OpenAI | `azure/us/gpt-5.2-chat` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5.2-codex` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5.2-pro` | - | $23.1 | $184.8 | 聊天; `input_cost_per_token_batches`: $1.155e-05; `output_cost_per_token_batches`: $9.24e-05 |
| Azure OpenAI | `azure/us/gpt-5.3-chat` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5.3-codex` | - | $1.925 | $15.4 | 聊天 |
| Azure OpenAI | `azure/us/gpt-5.4-mini` | - | $0.825 | $4.95 | 聊天; `input_cost_per_token_batches`: $4.125e-07; `output_cost_per_token_batches`: $2.475e-06 |
| Azure OpenAI | `azure/us/gpt-5.4-nano` | - | $0.22 | $1.375 | 聊天; `input_cost_per_token_batches`: $1.1e-07; `output_cost_per_token_batches`: $6.875e-07 |
| Azure OpenAI | `azure/us/gpt-5.4-pro` | - | $33 | $198 | 聊天; `input_cost_per_token_batches`: $1.65e-05; `output_cost_per_token_batches`: $9.9e-05 |
| Azure OpenAI | `azure/us/gpt-5.5-2026-04-24` | 1,050,000 | $5.5 | $33 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋; 系統訊息; 平行工具; `input_cost_per_token_batches`: $2.75e-06; `output_cost_per_token_batches`: $1.65e-05 |
| Azure OpenAI | `azure/us/gpt-chat-latest` | 272,000 | $5.5 | $33 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋; 系統訊息; 平行工具 |
| Azure OpenAI | `azure/us/o1-mini` | - | $1.21 | $4.84 | 聊天; `input_cost_per_token_batches`: $6.05e-07; `output_cost_per_token_batches`: $2.42e-06 |
| Azure OpenAI | `azure/us/o1-preview` | - | $16.5 | $66 | 聊天 |
| Azure OpenAI | `azure/us/o3-deep-research` | - | $11 | $44 | 聊天 |
| Azure OpenAI | `azure/us/text-embedding-3-large` | - | $0.143 | - | 嵌入 |
| Azure OpenAI | `azure/us/text-embedding-3-small` | - | $0.022 | - | 嵌入 |
| Azure OpenAI | `azure/us/text-embedding-ada-002` | - | $0.11 | - | 嵌入 |
| Cohere | `command-a-plus-05-2026` | 128,000 | $0 | $0 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 結構化輸出 |
| DashScope | `dashscope/qwen3.8-flash` | 991,808 | $0.15 | $0.47 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 網頁搜尋; 影片輸入 |
| DashScope | `dashscope/qwen3.8-omni-flash` | 991,808 | $0.15 | $0.47 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 網頁搜尋; 音訊輸入; 影片輸入 |
| Deepgram | `deepgram/streaming/detect_entities` | - | - | - | 轉錄; `input_cost_per_second`: $2.833e-05; `output_cost_per_second`: $0 |
| Deepgram | `deepgram/streaming/diarize` | - | - | - | 轉錄; `input_cost_per_second`: $3.333e-05; `output_cost_per_second`: $0 |
| Deepgram | `deepgram/streaming/keyterm` | - | - | - | 轉錄; `input_cost_per_second`: $2.167e-05; `output_cost_per_second`: $0 |
| Deepgram | `deepgram/streaming/nova-3` | - | - | - | 轉錄; `input_cost_per_second`: $8e-05; `output_cost_per_second`: $0 |
| Deepgram | `deepgram/streaming/nova-3-multilingual` | - | - | - | 轉錄; `input_cost_per_second`: $9.667e-05; `output_cost_per_second`: $0 |
| Deepgram | `deepgram/streaming/redact` | - | - | - | 轉錄; `input_cost_per_second`: $3.333e-05; `output_cost_per_second`: $0 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-5p3-fast` | 1,048,576 | $2.1 | $6.6 | 聊天; 推理; 工具呼叫; 工具選擇; 結構化輸出 |
| Fireworks AI | `fireworks_ai/glm-5p3-fast` | 1,048,576 | $2.1 | $6.6 | 聊天; 推理; 工具呼叫; 工具選擇; 結構化輸出 |
| FriendliAI | `friendliai/LGAI-EXAONE/K-EXAONE-2.0-750B-A37B` | 262,144 | $0.6 | $2.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 系統訊息; 平行工具 |
| FriendliAI | `friendliai/MiniMaxAI/MiniMax-M2.5` | 196,608 | $0.3 | $1.2 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 系統訊息; 平行工具 |
| FriendliAI | `friendliai/deepseek-ai/DeepSeek-V3.2` | 163,840 | $0.5 | $1.5 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 系統訊息; 平行工具 |
| FriendliAI | `friendliai/google/gemma-4-31B-it` | 262,144 | $0.14 | $0.4 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 結構化輸出; 系統訊息; 平行工具 |
| FriendliAI | `friendliai/zai-org/GLM-5.1` | 202,752 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 系統訊息; 平行工具 |
| FriendliAI | `friendliai/zai-org/GLM-5.2` | 1,048,576 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; 系統訊息; 平行工具 |
| Gemini | `gemini-3.8-live` | 131,072 | $0.75 | $4.5 | 即時; 視覺; 工具呼叫; 網頁搜尋; 音訊輸入; 音訊輸出; `input_cost_per_video_per_second`: $3.333333333e-05; `input_cost_per_audio_token`: $3e-06; `output_cost_per_audio_token`: $1.2e-05 |
| Gemini | `gemini-3.8-live-extended-thinking` | 131,072 | $0.75 | $4.5 | 即時; 推理; 視覺; 工具呼叫; 網頁搜尋; 音訊輸入; 音訊輸出; `input_cost_per_video_per_second`: $3.333333333e-05; `input_cost_per_audio_token`: $3e-06; `output_cost_per_audio_token`: $1.2e-05 |
| Gemini | `gemini/gemini-3.8-live` | 131,072 | $0.75 | $4.5 | 即時; 視覺; 工具呼叫; 網頁搜尋; 音訊輸入; `input_cost_per_audio_token`: $3e-06; `output_cost_per_audio_token`: $1.2e-05 |
| Gemini | `gemini/gemini-3.8-live-extended-thinking` | 131,072 | $0.75 | $4.5 | 即時; 視覺; 工具呼叫; 網頁搜尋; 音訊輸入; `input_cost_per_audio_token`: $3e-06; `output_cost_per_audio_token`: $1.2e-05 |
| Mistral | `mistral/zai-glm-5` | 1,048,576 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| Mistral | `mistral/zai-glm-5-3` | 1,048,576 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| Mistral | `mistral/zai-glm-latest` | 1,048,576 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| Nebius | `nebius/deepseek-ai/DeepSeek-V4-Pro-0813` | - | $1.32 | $3.96 | 聊天; 推理; 工具呼叫 |
| Nebius | `nebius/zai-org/GLM-5.3` | 1,048,576 | $1.4 | $4.4 | 聊天; 推理; 工具呼叫 |
| OpenAI | `gpt-5.5-cyber` | - | $12.5 | $75 | 聊天; 推理 |
| OpenAI | `gpt-rosalind-research` | - | $5 | $25 | 聊天 |
| OpenRouter | `openrouter/aion-labs/aion-2.0` | 131,072 | $0.8 | $1.6 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| OpenRouter | `openrouter/aion-labs/aion-3.0` | 131,072 | $3 | $6 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| OpenRouter | `openrouter/aion-labs/aion-3.0-mini` | 131,072 | $0.7 | $1.4 | 聊天; 推理; 工具呼叫; 工具選擇; 提示快取; 結構化輸出 |
| OpenRouter | `openrouter/aion-labs/aion-rp-llama-3.1-8b` | 32,768 | $0.8 | $1.6 | 聊天 |
| OpenRouter | `openrouter/amazon/nova-2-lite-v1` | 1,000,000 | $0.3 | $2.5 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; PDF 輸入 |
| OpenRouter | `openrouter/amazon/nova-lite-v1` | 300,000 | $0.06 | $0.24 | 聊天; 視覺; 工具呼叫 |
| OpenRouter | `openrouter/amazon/nova-micro-v1` | 128,000 | $0.035 | $0.14 | 聊天; 工具呼叫 |
| OpenRouter | `openrouter/amazon/nova-premier-v1` | 1,000,000 | $2.5 | $12.5 | 聊天; 視覺; 工具呼叫; 提示快取 |
| OpenRouter | `openrouter/amazon/nova-pro-v1` | 300,000 | $0.8 | $3.2 | 聊天; 視覺; 工具呼叫 |
| OpenRouter | `openrouter/anthracite-org/magnum-v4-72b` | 32,768 | $2.5 | $5 | 聊天; 結構化輸出 |
| OpenRouter | `openrouter/anthropic/claude-fable-5.1:batch` | 1,000,000 | $5 | $25 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-fable-5:batch` | 1,000,000 | $5 | $25 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-haiku-4.5:batch` | 200,000 | $0.5 | $2.5 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-4.1:batch` | 200,000 | $7.5 | $37.5 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-4.5:batch` | 200,000 | $2.5 | $12.5 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-4.6:batch` | 1,000,000 | $2.5 | $12.5 | 聊天; 推理; 視覺; 工具呼叫; 工具選擇; 提示快取; 結構化輸出; PDF 輸入; 網頁搜尋 |

| OpenRouter | `openrouter/anthropic/claude-opus-4.7:batch` | 1,000,000 | $2.5 | $12.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-4.8:batch` | 1,000,000 | $2.5 | $12.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-5:batch` | 1,000,000 | $2.5 | $12.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/anthropic/claude-sonnet-4.5:batch` | 1,000,000 | $1.5 | $7.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/anthropic/claude-sonnet-4.6:batch` | 1,000,000 | $1.5 | $7.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/anthropic/claude-sonnet-5:batch` | 1,000,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋 |
| OpenRouter | `openrouter/arcee-ai/trinity-large-thinking` | 262,144 | $0.25 | $0.8 | 聊天；推理；工具呼叫；工具選擇；提示快取 |
| OpenRouter | `openrouter/baidu/ernie-4.5-vl-424b-a47b` | 123,000 | $0.42 | $1.25 | 聊天；推理；視覺 |
| OpenRouter | `openrouter/bytedance-seed/seed-1.6` | 262,144 | $0.25 | $2 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/bytedance-seed/seed-1.6-flash` | 262,144 | $0.075 | $0.3 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/bytedance-seed/seed-2-1-turbo` | 262,144 | $0.5 | $2.5 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/bytedance-seed/seed-2.0-code` | 262,144 | $0.5 | $3 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/bytedance-seed/seed-2.0-lite` | 262,144 | $0.25 | $2 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/bytedance-seed/seed-2.0-mini` | 262,144 | $0.1 | $0.4 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition` | 128,000 | $0.2 | $0.9 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/cohere/command-a` | 256,000 | $2.5 | $10 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/cohere/command-r-08-2024` | 128,000 | $0.15 | $0.6 | 聊天；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/cohere/command-r-plus-08-2024` | 128,000 | $2.5 | $10 | 聊天；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/cohere/command-r7b-12-2024` | 128,000 | $0.0375 | $0.15 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/cohere/north-mini-code:free` | 256,000 | $0 | $0 | 聊天；推理；工具呼叫；工具選擇 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-flash-0731:batch` | 1,048,576 | $0.11 | $0.33 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-flash-0731:free` | 1,048,576 | $0 | $0 | 聊天；推理；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-flash-vision-exp:batch` | 1,048,576 | $0.11 | $0.33 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/deepseek/deepseek-v4-pro-0813:batch` | 1,048,576 | $0.66 | $1.98 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/dots-studio/dots-3-note-preview:free` | 512,000 | $0 | $0 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/google/gemini-2.5-flash-lite:batch` | 1,048,576 | $0.05 | $0.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $1.5e-07 |
| OpenRouter | `openrouter/google/gemini-2.5-flash:batch` | 1,048,576 | $0.15 | $1.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $5e-07 |
| OpenRouter | `openrouter/google/gemini-2.5-pro:batch` | 1,048,576 | $0.625 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $6.25e-07 |
| OpenRouter | `openrouter/google/gemini-3-flash-preview:batch` | 1,048,576 | $0.25 | $1.5 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $5e-07 |
| OpenRouter | `openrouter/google/gemini-3.1-flash-lite:batch` | 1,048,576 | $0.125 | $0.75 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $2.5e-07 |
| OpenRouter | `openrouter/google/gemini-3.1-pro-preview:batch` | 1,048,576 | $1 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $1e-06 |
| OpenRouter | `openrouter/google/gemini-3.5-flash-lite:batch` | 1,048,576 | $0.15 | $1.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $1.5e-07 |
| OpenRouter | `openrouter/google/gemini-3.5-flash:batch` | 1,048,576 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $1.5e-06 |
| OpenRouter | `openrouter/google/gemini-3.6-flash:batch` | 1,048,576 | $0.375 | $1.875 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $3.75e-07 |
| OpenRouter | `openrouter/google/gemini-3.7-flash:batch` | 1,048,576 | $0.375 | $1.875 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $3.75e-07 |
| OpenRouter | `openrouter/google/gemini-3.8-flash:batch` | 1,048,576 | $0.375 | $1.875 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入；視訊輸入；`input_cost_per_audio_token`: $3.75e-07 |
| OpenRouter | `openrouter/ibm-granite/granite-4.0-h-micro` | 131,000 | $0.017 | $0.112 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/ibm-granite/granite-4.2-8b` | 131,072 | $0.06 | $0.25 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inception/mercury-2` | 128,000 | $0.25 | $0.75 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inception/mercury-2.5` | 260,000 | $0.04 | $0.15 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash` | 262,144 | $0.021 | $0.063 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-fin` | 262,144 | $0.06 | $0.18 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-fin:free` | 262,144 | $0 | $0 | 聊天；推理；工具呼叫；工具選擇 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-sante:free` | 262,144 | $0 | $0 | 聊天；推理；工具呼叫；工具選擇 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-vl` | 131,072 | $0.06 | $0.18 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inclusionai/ling-3.0-flash-vl:free` | 262,144 | $0 | $0 | 聊天；推理；視覺；工具呼叫；工具選擇 |
| OpenRouter | `openrouter/inference-net/schematron-v2-small` | 128,000 | $0.05 | $0.23 | 聊天；提示快取；結構化輸出 |
| OpenRouter | `openrouter/inference-net/schematron-v2-turbo` | 128,000 | $0.03 | $0.15 | 聊天；提示快取；結構化輸出 |
| OpenRouter | `openrouter/kwaipilot/kat-coder-pro-v2` | 262,144 | $0.3 | $1.2 | 聊天；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/kwaipilot/kat-coder-pro-v2.5` | 262,144 | $0.74 | $2.96 | 聊天；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/liquid/lfm-2.5-2.6b:free` | 65,536 | $0 | $0 | 聊天；推理；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/meituan/longcat-2.0` | 1,048,756 | $0.3 | $1.2 | 聊天；推理；工具呼叫；工具選擇；提示快取 |
| OpenRouter | `openrouter/meta/muse-glimmer-30b` | 131,072 | $0.35 | $1.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/meta/muse-glimmer-30b:batch` | 131,072 | $0.175 | $0.75 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/meta/muse-spark-1.1` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網路搜尋；音訊輸入 |

| OpenRouter | `openrouter/meta/muse-spark-1.2` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入 |
| OpenRouter | `openrouter/meta/muse-spark-1.2-contributor` | 1,048,576 | $0.1 | $0.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入 |
| OpenRouter | `openrouter/meta/muse-spark-1.3` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入 |
| OpenRouter | `openrouter/meta/muse-spark-1.3-contributor` | 1,048,576 | $0.1 | $0.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入 |
| OpenRouter | `openrouter/microsoft/phi-4` | 16,384 | $0.07 | $0.14 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/microsoft/wizardlm-2-8x22b` | 65,535 | $0.62 | $0.62 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/minimax/minimax-m3:batch` | 524,288 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/mistralai/codestral-2508:batch` | 256,000 | $0.15 | $0.45 | 聊天；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/mistralai/ministral-8b-2512:batch` | 262,144 | $0.075 | $0.075 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/mistralai/mistral-large-2512:batch` | 262,144 | $0.25 | $0.75 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/mistralai/mistral-medium-3-5:batch` | 262,144 | $0.75 | $3.75 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/mistralai/mistral-medium-3.1:batch` | 131,072 | $0.2 | $1 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入 |
| OpenRouter | `openrouter/mistralai/mistral-small-2603:batch` | 262,144 | $0.075 | $0.3 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/moonshotai/kimi-k3:batch` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/morph/morph-v3-fast` | 81,920 | $0.8 | $1.2 | 聊天 |
| OpenRouter | `openrouter/morph/morph-v3-large` | 262,144 | $0.9 | $1.9 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/nex-agi/nex-n2.5-mini:free` | 262,144 | $0 | $0 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/nex-agi/nex-n2.5-pro:free` | 262,144 | $0 | $0 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/nousresearch/hermes-3-llama-3.1-405b` | 131,072 | $1 | $1 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/nousresearch/hermes-3-llama-3.1-70b` | 131,072 | $0.7 | $0.7 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/nousresearch/hermes-4-405b` | 131,072 | $1 | $3 | 聊天；推理；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-3.5-turbo-0613` | 4,095 | $1 | $2 | 聊天；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-3.5-turbo:batch` | 16,385 | $0.25 | $0.75 | 聊天；工具呼叫；工具選擇；結構化輸出；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4-turbo:batch` | 128,000 | $5 | $15 | 聊天；視覺；工具呼叫；工具選擇；結構化輸出；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4.1-mini:batch` | 1,047,576 | $0.2 | $0.8 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4.1-nano:batch` | 1,047,576 | $0.05 | $0.2 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4.1:batch` | 1,047,576 | $1 | $4 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4o-mini:batch` | 128,000 | $0.075 | $0.3 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-4o:batch` | 128,000 | $1.25 | $5 | 聊天；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5-image` | 400,000 | $10 | $10 | 聊天；推理；視覺；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5-image-mini` | 400,000 | $2.5 | $2 | 聊天；推理；視覺；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5-mini:batch` | 400,000 | $0.125 | $1 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5-nano:batch` | 400,000 | $0.025 | $0.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5-pro:batch` | 400,000 | $7.5 | $60 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.1:batch` | 400,000 | $0.625 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.2-pro:batch` | 400,000 | $10.5 | $84 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.2:batch` | 400,000 | $0.875 | $7 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.4-image-2` | 272,000 | $8 | $15 | 聊天；推理；視覺；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.4-mini:batch` | 400,000 | $0.375 | $2.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.4-nano:batch` | 400,000 | $0.1 | $0.625 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.4-pro:batch` | 1,050,000 | $15 | $90 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.4:batch` | 1,050,000 | $1.25 | $7.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.5-pro:batch` | 1,050,000 | $15 | $90 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.5:batch` | 1,050,000 | $2.5 | $15 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-luna-pro:batch` | 1,050,000 | $0.1 | $0.6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-luna:batch` | 1,050,000 | $0.1 | $0.6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-sol-pro:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-sol:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-terra-pro:batch` | 1,050,000 | $1 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5.6-terra:batch` | 1,050,000 | $1 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-5:batch` | 400,000 | $0.625 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-astra-pro:batch` | 1,050,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-astra:batch` | 1,050,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-oss-120b:batch` | 131,072 | $0.15 | $0.6 | 聊天；推理；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/openai/o3-mini:batch` | 200,000 | $0.55 | $2.2 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/o3:batch` | 200,000 | $1 | $4 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |

| OpenRouter | `openrouter/openai/o4-mini:batch` | 200,000 | $0.55 | $2.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/perceptron/perceptron-mk1` | 32,768 | $0.15 | $1.5 | 聊天；推理；視覺；結構化輸出 |
| OpenRouter | `openrouter/perplexity/sonar` | 127,072 | $1 | $1 | 聊天；視覺；網頁搜尋 |
| OpenRouter | `openrouter/perplexity/sonar-deep-research` | 128,000 | $2 | $8 | 聊天；推理；網頁搜尋 |
| OpenRouter | `openrouter/perplexity/sonar-pro` | 200,000 | $3 | $15 | 聊天；視覺；網頁搜尋 |
| OpenRouter | `openrouter/perplexity/sonar-pro-search` | 200,000 | $3 | $15 | 聊天；推理；視覺；結構化輸出；網頁搜尋 |
| OpenRouter | `openrouter/perplexity/sonar-reasoning-pro` | 128,000 | $2 | $8 | 聊天；推理；視覺；網頁搜尋 |
| OpenRouter | `openrouter/prism-ml/ternary-bonsai-2-27b` | 262,144 | $0.075 | $0.5 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/qwen/qwen3.5-9b:batch` | 262,144 | $0.17 | $0.25 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/qwen/qwen3.8-2.4t-a95b:batch` | 1,010,000 | $2 | $6 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/qwen/qwen3.8-27b:free` | 262,144 | $0 | $0 | 聊天；推理；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/rekaai/reka-edge` | 16,384 | $0.1 | $0.1 | 聊天；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/rekaai/reka-flash-3` | 65,536 | $0.1 | $0.2 | 聊天；推理；結構化輸出 |
| OpenRouter | `openrouter/relace/relace-apply-3` | 256,000 | $0.85 | $1.25 | 聊天 |
| OpenRouter | `openrouter/relace/relace-search` | 256,000 | $1 | $3 | 聊天；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/sakana/fugu-max` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/sakana/fugu-ultra` | 1,000,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；網頁搜尋 |
| OpenRouter | `openrouter/sakana/fugu-ultra-v2` | 1,000,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/sakana/sakana-namazu` | 262,144 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/sao10k/l3-lunaris-8b` | 8,192 | $0.04 | $0.05 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/sao10k/l3.1-euryale-70b` | 131,072 | $0.85 | $0.85 | 聊天；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/sao10k/l3.3-euryale-70b` | 131,072 | $0.65 | $0.75 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/stealth/union-alpha` | 262,144 | $0 | $0 | 聊天；視覺；工具呼叫；工具選擇；結構化輸出 |
| OpenRouter | `openrouter/stepfun/step-3.5-flash` | 262,144 | $0.1 | $0.3 | 聊天；推理；工具呼叫；工具選擇 |
| OpenRouter | `openrouter/stepfun/step-3.7-flash` | 262,144 | $0.2 | $1.15 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/tencent/hunyuan-a13b-instruct` | 131,072 | $0.14 | $0.57 | 聊天；推理；結構化輸出 |
| OpenRouter | `openrouter/tencent/hy-mt2-1.8b` | 8,192 | $0.044 | $0.177 | 聊天 |
| OpenRouter | `openrouter/tencent/hy-mt2-30b-a3b` | 8,192 | $0.074 | $0.295 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/tencent/hy-mt2-7b` | 8,192 | $0.074 | $0.295 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/tencent/hy3` | 262,144 | $0.132 | $0.528 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/tencent/hy3-preview` | 262,144 | $0.18 | $0.6 | 聊天；推理；工具呼叫；工具選擇；提示快取 |
| OpenRouter | `openrouter/tencent/hy4-preview` | 1,048,576 | $0.834 | $2.501 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/thedrummer/cydonia-24b-v4.1` | 131,072 | $0.3 | $0.5 | 聊天；提示快取；結構化輸出 |
| OpenRouter | `openrouter/thedrummer/skyfall-36b-v2` | 32,768 | $0.55 | $0.8 | 聊天；提示快取；結構化輸出 |
| OpenRouter | `openrouter/thedrummer/unslopnemo-12b` | 1,024,000 | $0.4 | $0.4 | 聊天；結構化輸出 |
| OpenRouter | `openrouter/thinkingmachines/inkling` | 1,048,576 | $1 | $4.05 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；音訊輸入 |
| OpenRouter | `openrouter/thinkingmachines/inkling-small` | 1,048,576 | $0.45 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；音訊輸入 |
| OpenRouter | `openrouter/thinkingmachines/inkling-small:free` | 1,048,576 | $0 | $0 | 聊天；推理；視覺；工具呼叫；音訊輸入 |
| OpenRouter | `openrouter/thinkingmachines/inkling:batch` | 524,288 | $1 | $4.05 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；音訊輸入 |
| OpenRouter | `openrouter/thinkingmachines/inkling:free` | 1,048,576 | $0 | $0 | 聊天；推理；視覺；工具呼叫；音訊輸入 |
| OpenRouter | `openrouter/unbiased/pareto` | 262,144 | $2.5 | $7.5 | 聊天；視覺；工具呼叫；工具選擇；提示快取 |
| OpenRouter | `openrouter/upstage/solar-pro-3` | 131,072 | $0.15 | $0.6 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/upstage/solar-pro4` | 524,288 | $0.09 | $0.36 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/writer/palmyra-x5` | 1,040,000 | $0.6 | $6 | 聊天 |
| OpenRouter | `openrouter/x-ai/grok-4.3:batch` | 1,000,000 | $1 | $2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/z-ai/glm-5.2:batch` | 1,048,576 | $0.7 | $2.2 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/z-ai/glm-5.3-flash:batch` | 1,048,576 | $0.075 | $0.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/z-ai/glm-5.3-flashx` | 1,048,576 | $0.37 | $1.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/z-ai/glm-5.3:batch` | 1,048,576 | $0.7 | $2.2 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~anthropic/claude-fable-latest` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~anthropic/claude-haiku-latest` | 200,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~anthropic/claude-opus-latest` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~anthropic/claude-sonnet-latest` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~deepseek/deepseek-flash-latest` | 1,048,576 | $0.13 | $0.52 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~deepseek/deepseek-pro-latest` | 1,048,576 | $0.57816 | $1.73448 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~deepseek/deepseek-v4-flash-latest` | 1,310,720 | $0.04 | $0.08 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~google/gemini-flash-latest` | 1,048,576 | $0.75 | $3.75 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入；`input_cost_per_audio_token`：$7.5e-07 |
| OpenRouter | `openrouter/~google/gemini-pro-latest` | 1,048,576 | $2 | $12 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋；音訊輸入；`input_cost_per_audio_token`：$2e-06 |
| OpenRouter | `openrouter/~moonshotai/kimi-latest` | 1,048,576 | $1.7 | $8.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~openai/gpt-astra-latest` | 1,050,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~openai/gpt-luna-latest` | 1,050,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~openai/gpt-mini-latest` | 400,000 | $0.75 | $4.5 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~openai/gpt-sol-latest` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |

| OpenRouter | `openrouter/~openai/gpt-terra-latest` | 1,050,000 | $2 | $12 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~x-ai/grok-latest` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/~z-ai/glm-flash-latest` | 1,310,720 | $0.075 | $0.25 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出 |
| OpenRouter | `openrouter/~z-ai/glm-latest` | 1,310,720 | $0.8442 | $2.6532 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Qwen | `qwen_ai_platform/qwen3.8-flash` | 991,808 | $0.15 | $0.47 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；網頁搜尋；影片輸入 |
| Qwen | `qwen_ai_platform/qwen3.8-omni-flash` | 991,808 | $0.15 | $0.47 | 聊天；推理；視覺；工具呼叫；工具選擇；提示快取；結構化輸出；網頁搜尋；音訊輸入；影片輸入 |
| Together AI | `together_ai/NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO` | - | $0.6 | $0.6 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2-1.5B-Instruct` | - | $0.02 | $0.02 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2-72B-Instruct` | - | $0.9 | $0.9 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2-VL-72B-Instruct` | - | $1.2 | $1.2 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2.5-14B-Instruct` | - | $0.8 | $0.8 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2.5-72B-Instruct` | - | $1.2 | $1.2 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2.5-Coder-32B-Instruct` | - | $0.8 | $0.8 | 聊天 |
| Together AI | `together_ai/Qwen/Qwen2.5-VL-72B-Instruct` | - | $1.95 | $8 | 聊天 |
| Together AI | `together_ai/arcee-ai/trinity-mini` | - | $0.045 | $0.15 | 聊天 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-R1-Distill-Llama-70B` | - | $2 | $2 | 聊天 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B` | - | $0.18 | $0.18 | 聊天 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B` | - | $1.6 | $1.6 | 聊天 |
| Together AI | `together_ai/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.3 | $1.2 | 聊天；工具呼叫；工具選擇；提示快取；結構化輸出 |
| Together AI | `together_ai/deepseek-ai/deepseek-coder-33b-instruct` | - | $0.8 | $0.8 | 聊天 |
| Together AI | `together_ai/google/gemma-2-27b-it` | - | $0.8 | $0.8 | 聊天 |
| Together AI | `together_ai/meta-llama/Llama-3-8b-chat-hf` | - | $0.2 | $0.2 | 聊天 |
| Together AI | `together_ai/meta-llama/Llama-3.1-405B-Instruct` | - | $3.5 | $3.5 | 聊天 |
| Together AI | `together_ai/meta-llama/Llama-3.2-1B-Instruct` | - | $0.06 | $0.06 | 聊天 |
| Together AI | `together_ai/meta-llama/Llama-3.2-3B-Instruct` | - | $0.06 | $0.06 | 聊天 |
| Together AI | `together_ai/meta-llama/Meta-Llama-3-70B-Instruct-Turbo` | - | $0.88 | $0.88 | 聊天 |
| Together AI | `together_ai/meta-llama/Meta-Llama-3-8B-Instruct` | - | $0.2 | $0.2 | 聊天 |
| Together AI | `together_ai/nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` | - | $0.88 | $0.88 | 聊天 |
| TypeSafe | `typesafe/jev-1.13.0` | - | $0.042 | $0 | - |
| TypeSafe | `typesafe/jev-latest` | - | $0.042 | $0 | - |
| TypeSafe | `typesafe/jev-preview` | - | $0.042 | $0 | - |
| Vertex AI | `vertex_ai/gemini-2.5-flash-native-audio` | - | $0.5 | $2 | 即時；`input_cost_per_audio_token`: $3e-06；`output_cost_per_audio_token`: $1.2e-05 |
| Vertex AI | `vertex_ai/gemini-2.5-flash-preview-tts` | - | $0.5 | $10 | 語音；`output_cost_per_audio_token`: $1e-05；`input_cost_per_token_batches`: $2.5e-07 |
| Vertex AI | `vertex_ai/gemini-3.1-flash-live-preview` | - | $0.75 | $4.5 | 即時；`input_cost_per_second`: $8.333333333e-05；`input_cost_per_audio_token`: $3e-06；`output_cost_per_audio_token`: $1.2e-05 |
| Vertex AI | `vertex_ai/gemini-3.1-flash-tts-preview` | - | $1 | $20 | 語音；`output_cost_per_audio_token`: $2e-05；`input_cost_per_token_batches`: $5e-07 |
| Vertex AI | `vertex_ai/gemini-3.5-transcribe` | - | - | $12 | 轉錄；`input_cost_per_second`: $5e-05；`input_cost_per_audio_token`: $2e-06 |
| Vertex AI | `vertex_ai/gemini-3.5-transcribe-live` | - | - | $21 | 轉錄；`input_cost_per_second`: $8.333333333e-05；`input_cost_per_audio_token`: $3.5e-06 |
| Vertex AI | `vertex_ai/gemini-omni-1.1-flash` | - | $1.5 | $9 | 聊天 |
| Vertex AI | `vertex_ai/gemini-robotics-er-2` | - | $1 | $5 | 聊天；`input_cost_per_token_batches`: $5e-07；`output_cost_per_token_batches`: $2.5e-06 |
| Vertex AI | `vertex_ai/gemma-4-26b-a4b-it` | - | $0.15 | $0.6 | 聊天 |
| Volcengine | `volcengine/doubao-seed-2-1-pro-260628` | 256,000 | $0.8625 | $4.3125 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Volcengine | `volcengine/doubao-seed-2-1-turbo-260628` | 256,000 | $0.43125 | $2.15625 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Weights & Biases | `wandb/zai-org/GLM-5.3-Flash` | 1,049,000 | $0.15 | $0.5 | 聊天；推理；工具呼叫；工具選擇；提示快取；結構化輸出 |
| xAI | `xai/grok-voice-transcribe-1.0` | - | - | - | 轉錄；`input_cost_per_second`: $2.778e-05；`output_cost_per_second`: $0 |
| xAI | `xai/grok-voice-transcribe-2.0` | - | - | - | 轉錄；`input_cost_per_second`: $2.778e-05；`output_cost_per_second`: $0 |

#### 已更新的定價（147 個模型） {#updated-pricing-147-models}

| 提供者 / 模型 | 變更後的 token 價格（USD 每 1M tokens） |
| --- | --- |
| `amazon.nova-lite-v1:0` | Cache read: not set to $0.015 |
| `amazon.nova-micro-v1:0` | Cache read: not set to $0.00875 |
| `amazon.nova-pro-v1:0` | Cache read: not set to $0.2 |
| `apac.amazon.nova-lite-v1:0` | Cache read: not set to $0.01575 |
| `apac.amazon.nova-micro-v1:0` | Cache read: not set to $0.00925 |
| `apac.amazon.nova-pro-v1:0` | Cache read: not set to $0.21 |
| `azure/eu/gpt-4o-2024-11-20` | Cache read: not set to $1.375 |
| `azure/eu/gpt-5.1` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/eu/gpt-5.1-chat` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/eu/gpt-5.1-codex` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/eu/gpt-5.1-codex-mini` | Cache read: $0.028 to $0.0275 |
| `azure/eu/gpt-5.4` | Cache read: $0.28 to $0.275 |
| `azure/eu/gpt-5.4-2026-03-05` | Cache read: $0.28 to $0.275 |
| `azure/eu/gpt-5.6-sol` | Input: $5.5 to $4.4; Output: $33 to $22; Cache read: $0.55 to $0.44; Cache write: $6.875 to $5.5 |
| `azure/gpt-4o-2024-11-20` | Input: $2.75 to $2.5; Output: $11 to $10 |
| `azure/gpt-4o-mini-2024-07-18` | Input: $0.165 to $0.15; Output: $0.66 to $0.6 |
| `azure/gpt-5.6-sol` | Input: $5 to $4; Output: $30 to $20; Cache read: $0.5 to $0.4; Cache write: $6.25 to $5 |
| `azure/gpt-realtime-1.5-2026-02-23` | Cache read: $4 to $0.4 |
| `azure/gpt-realtime-2025-08-28` | Cache read: $4 to $0.4 |
| `azure/o1-mini` | Input: $1.21 to $1.1; Output: $4.84 to $4.4; Cache read: $0.605 to $0.55 |
| `azure/us/gpt-4.1-nano-2025-04-14` | Cache read: $0.025 to $0.028 |
| `azure/us/gpt-4o-2024-11-20` | Cache read: not set to $1.375 |
| `azure/us/gpt-5.1` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/us/gpt-5.1-chat` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/us/gpt-5.1-codex` | Input: $1.38 to $1.375; Cache read: $0.14 to $0.1375 |
| `azure/us/gpt-5.1-codex-mini` | Cache read: $0.028 to $0.0275 |
| `azure/us/gpt-5.4` | Cache read: $0.28 to $0.275 |
| `azure/us/gpt-5.4-2026-03-05` | Cache read: $0.28 to $0.275 |
| `azure/us/gpt-5.6-sol` | Input: $5.5 to $4.4; Output: $33 to $22; Cache read: $0.55 to $0.44; Cache write: $6.875 to $5.5 |
| `azure/us/o4-mini-2025-04-16` | Cache read: $0.31 to $0.303 |
| `azure_ai/FW-GLM-5.2-Fast` | Input: $2.1 to $2.31; Output: $6.6 to $7.26; Cache read: $0.21 to $0.231 |
| `azure_ai/FW-Inkling` | Input: $1 to $1.1; Output: $4.05 to $4.46; Cache read: $0.17 to $0.19 |
| `azure_ai/FW-Kimi-K3` | Input: $3.3 to $3; Output: $16.5 to $15; Cache read: $0.33 to $0.3 |
| `azure_ai/FW-Nemotron-3-Ultra-NVFP4` | Input: $0.6 to $0.66; Output: $2.4 to $2.64; Cache read: $0.119 to $0.13 |
| `azure_ai/Llama-4-Maverick-17B-128E-Instruct-FP8` | Input: $1.41 to $0.25; Output: $0.35 to $1 |
| `azure_ai/Phi-4-mini-reasoning` | Input: $0.08 to $0.075; Output: $0.32 to $0.3 |
| `bedrock/us-gov-east-1/amazon.nova-pro-v1:0` | Cache read: not set to $0.24 |
| `bedrock/us-gov-west-1/amazon.nova-lite-v1:0` | Cache read: not set to $0.018 |
| `bedrock/us-gov-west-1/amazon.nova-micro-v1:0` | Cache read: not set to $0.0105 |
| `bedrock/us-gov-west-1/amazon.nova-pro-v1:0` | Cache read: not set to $0.24 |
| `bedrock_mantle/openai.gpt-5.6-sol` | Input: $5.5 to $4.4; Output: $33 to $22; Cache read: $0.55 to $0.44; Cache write: $6.875 to $5.5 |
| `chatgpt-image-latest` | Output: not set to $10 |
| `deep-research-pro-preview-12-2025` | Cache read: not set to $0.2 |
| `eu.amazon.nova-lite-v1:0` | Cache read: not set to $0.0195 |
| `eu.amazon.nova-micro-v1:0` | Cache read: not set to $0.0115 |
| `eu.amazon.nova-pro-v1:0` | Cache read: not set to $0.2625 |
| `fireworks_ai/accounts/fireworks/models/deepseek-v4-pro` | Input: $1.74 to $1.2; Output: $3.48 to $1.2; Cache read: $0.145 to $0.6 |
| `fireworks_ai/accounts/fireworks/models/qwen3-reranker-8b` | Input: $0 to $0.2 |
| `fireworks_ai/deepseek-v4-pro` | Input: $1.74 to $1.2; Output: $3.48 to $1.2; Cache read: $0.145 to $0.6 |
| `gemini-2.0-flash` | Input: $0.1 to $0.15; Output: $0.4 to $0.6 |
| `gemini-3-pro-image` | Cache read: not set to $0.2 |
| `gemini-3.1-flash-image` | Cache read: not set to $0.05 |
| `gemini-flash-latest` | Input: $0.3 to $0.75; Output: $2.5 to $3.75; Cache read: $0.03 to $0.075 |
| `gemini-flash-lite-latest` | Input: $0.1 to $0.3; Output: $0.4 to $2.5; Cache read: $0.01 to $0.03 |
| `gemini-pro-latest` | Input: $1.25 to $2; Output: $10 to $12; Cache read: $0.125 to $0.2 |
| `gemini/gemini-flash-latest` | Input: $0.3 to $0.75; Output: $2.5 to $3.75; Cache read: $0.03 to $0.075 |
| `gemini/gemini-flash-lite-latest` | Input: $0.1 to $0.3; Output: $0.4 to $2.5; Cache read: $0.01 to $0.03 |
| `gemini/gemini-pro-latest` | Input: $1.25 to $2; Output: $10 to $12; Cache read: $0.125 to $0.2 |
| `gemini/gemini-robotics-er-2-preview` | Input: $2 to $1; Output: $10 to $5; Cache read: $0.2 to $0.1 |
| `gpt-4o-mini-tts` | Input: $2.5 to $0.6 |
| `gpt-4o-mini-tts-2025-03-20` | Input: $2.5 to $0.6 |
| `gpt-4o-mini-tts-2025-12-15` | Input: $2.5 to $0.6 |
| `gpt-realtime-mini` | Cache read: not set to $0.06 |
| `inception/mercury-2.5` | Cache read: not set to $0.02 |
| `mistral/codestral-mamba-latest` | Cache read: not set to $0.025 |
| `mistral/devstral-latest` | Cache read: not set to $0.04 |
| `mistral/devstral-medium-latest` | Cache read: not set to $0.04 |
| `mistral/devstral-small-latest` | Cache read: not set to $0.01 |
| `mistral/mistral-code-agent-latest` | Cache read: not set to $0.04 |
| `mistral/mistral-medium-3` | Cache read: not set to $0.15 |
| `mistral/mistral-small` | Cache read: not set to $0.01 |
| `mistral/mistral-tiny` | Cache read: not set to $0.025 |
| `mistral/open-mistral-nemo` | Cache read: not set to $0.03 |
| `mistral/pixtral-large-latest` | Cache read: not set to $0.2 |
| `mistral/voxtral-small-2507` | Cache read: not set to $0.01 |
| `mistral/voxtral-small-latest` | Cache read: not set to $0.01 |
| `openrouter/anthropic/claude-3-haiku` | Cache read: not set to $0.03; Cache write: not set to $0.3 |
| `openrouter/bytedance/ui-tars-1.5-7b` | Cache read: not set to $0.1 |
| `openrouter/deepseek/deepseek-r1-0528` | Cache read: not set to $0.35 |
| `openrouter/deepseek/deepseek-v3.2` | Cache read: not set to $0.1345 |
| `openrouter/deepseek/deepseek-v4-flash` | Input: $0.0854 to $0.03724; Output: $0.1708 to $0.07448; Cache read: $0.01708 to $0.007448 |
| `openrouter/deepseek/deepseek-v4-flash-0731` | Input: $0.065 to $0.04; Output: $0.18 to $0.08 |
| `openrouter/deepseek/deepseek-v4-flash-vision-exp` | Input: $0.22 to $0.2156; Output: $0.66 to $0.6468; Cache read: $0.007 to $0.00686 |
| `openrouter/deepseek/deepseek-v4-pro` | Input: $0.859908 to $0.422298; Output: $1.719816 to $0.844596; Cache read: $0.071659 to $0.0351915 |
| `openrouter/deepseek/deepseek-v4-pro-0813` | Input: $0.57948 to $0.57816; Output: $1.73844 to $1.73448; Cache read: $0.019316 to $0.018396 |
| `openrouter/deepseek/deepseek-v4.1-flash` | Input: $0.15 to $0.3; Output: $0.6 to $1.2; Cache read: $0.003 to $0.006 |
| `openrouter/google/gemini-2.5-flash` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-2.5-flash-lite` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-2.5-pro` | Cache write: not set to $0.375 |
| `openrouter/google/gemini-3-flash-preview` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-3.1-flash-lite` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-3.1-flash-lite-preview` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-3.1-pro-preview` | Cache write: not set to $0.375 |
| `openrouter/google/gemini-3.5-flash` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-3.5-flash-lite` | Cache write: not set to $0.0833333333 |
| `openrouter/google/gemini-3.6-flash` | Cache write: not set to $0.0416666667 |
| `openrouter/google/gemini-3.7-flash` | Cache write: not set to $0.0416666667 |
| `openrouter/google/gemini-3.8-flash` | Cache write: not set to $0.0416666667 |
| `openrouter/google/gemma-4-26b-a4b-it` | Input: $0.042 to $0.09; Output: $0.22 to $0.3; Cache read: not set to $0.05 |
| `openrouter/gryphe/mythomax-l2-13b` | Input: $0.06 to $0.08; Output: $0.06 to $0.11 |
| `openrouter/meta-llama/llama-4-maverick` | Input: $0.2 to $0.1875; Output: $0.696 to $0.6525 |
| `openrouter/minimax/minimax-m1` | Input: $0.55 to $0.4 |
| `openrouter/mistralai/devstral-2512` | Cache read: not set to $0.04 |
| `openrouter/mistralai/ministral-14b-2512` | Cache read: not set to $0.02 |
| `openrouter/mistralai/ministral-3b-2512` | Cache read: not set to $0.01 |
| `openrouter/mistralai/ministral-8b-2512` | Cache read: not set to $0.015 |
| `openrouter/mistralai/mistral-large` | Cache read: not set to $0.2 |
| `openrouter/mistralai/mistral-large-2512` | Input: $0.5 to $0.55; Output: $1.5 to $1.65; Cache read: not set to $0.055 |
| `openrouter/mistralai/mistral-small-3.2-24b-instruct` | Input: $0.075 to $0.09375; Output: $0.2 to $0.25 |
| `openrouter/mistralai/mixtral-8x22b-instruct` | Cache read: not set to $0.2 |
| `openrouter/moonshotai/kimi-k2.7-code` | Input: $0.71 to $0.7062; Output: $3.5 to $3.21; Cache read: $0.15 to $0.18 |
| `openrouter/moonshotai/kimi-k3` | Input: $2.1 to $1.7; Output: $10.53 to $8.5; Cache read: $0.235 to $0.17 |

| `openrouter/nvidia/nemotron-3-nano-30b-a3b` | 輸入：$0.05 至 $0.06；輸出：$0.2 至 $0.24 |
| `openrouter/nvidia/nemotron-3-super-120b-a12b` | 輸入：$0.085 至 $0.08；輸出：$0.4 至 $0.45 |
| `openrouter/nvidia/nemotron-3-ultra-550b-a55b` | 輸入：$0.625 至 $0.6；輸出：$3.125 至 $2.4；快取讀取：$0.1875 至 $0.12 |
| `openrouter/nvidia/nemotron-3.5-lightning` | 輸入：$0.08 至 $0.07；快取讀取：未設定至 $0.04 |
| `openrouter/openai/gpt-5.6-luna` | 快取寫入：未設定至 $0.25 |
| `openrouter/openai/gpt-5.6-terra` | 快取寫入：未設定至 $2.5 |
| `openrouter/openai/gpt-oss-120b` | 輸入：$0.037 至 $0.15；輸出：$0.17 至 $0.6；快取讀取：未設定至 $0.075 |
| `openrouter/openai/gpt-oss-20b` | 快取讀取：未設定至 $0.03 |
| `openrouter/qwen/qwen-plus-2025-07-28` | 快取讀取：未設定至 $0.052；快取寫入：未設定至 $0.325 |
| `openrouter/qwen/qwen3-14b` | 輸入：$0.2275 至 $0.12；輸出：$0.91 至 $0.24 |
| `openrouter/qwen/qwen3-235b-a22b-2507` | 輸入：$0.22 至 $0.0875；輸出：$0.88 至 $0.35；快取讀取：未設定至 $0.0175 |
| `openrouter/qwen/qwen3-30b-a3b-instruct-2507` | 輸入：$0.09 至 $0.04815；輸出：$0.3 至 $0.19305 |
| `openrouter/qwen/qwen3-coder` | 快取讀取：未設定至 $0.1 |
| `openrouter/qwen/qwen3-coder-plus` | 快取讀取：未設定至 $0.13；快取寫入：未設定至 $0.8125 |
| `openrouter/qwen/qwen3-vl-30b-a3b-instruct` | 輸入：$0.15 至 $0.13；輸出：$0.6 至 $0.52 |
| `openrouter/qwen/qwen3.5-397b-a17b` | 快取讀取：未設定至 $0.225 |
| `openrouter/qwen/qwen3.6-plus` | 快取寫入：未設定至 $0.40625 |
| `openrouter/undi95/remm-slerp-l2-13b` | 輸入：$0.45 至 $0.35 |
| `openrouter/z-ai/glm-4.7-flash` | 輸入：$0.06 至 $0.0605 |
| `openrouter/z-ai/glm-5` | 快取讀取：未設定至 $0.12 |
| `openrouter/z-ai/glm-5.2` | 輸入：$0.6 至 $0.5544；輸出：$2 至 $1.7424；快取讀取：$0.15 至 $0.10296 |
| `openrouter/z-ai/glm-5.3` | 輸入：$1.4 至 $0.896；輸出：$4.4 至 $2.816；快取讀取：$0.14 至 $0.1664 |
| `openrouter/z-ai/glm-5.3-flash` | 輸入：$0.15 至 $0.09；輸出：$0.5 至 $0.3；快取讀取：$0.03 至 $0.018 |
| `replicate/google/gemini-2.5-flash` | 輸入：$2.5 至 $0.3 |
| `us.amazon.nova-lite-v1:0` | 快取讀取：未設定至 $0.015 |
| `us.amazon.nova-micro-v1:0` | 快取讀取：未設定至 $0.00875 |
| `us.amazon.nova-premier-v1:0` | 快取讀取：未設定至 $0.625 |
| `us.amazon.nova-pro-v1:0` | 快取讀取：未設定至 $0.2 |
| `vercel_ai_gateway/google/gemini-2.5-flash` | 快取讀取：未設定至 $0.03 |
| `vercel_ai_gateway/google/gemini-2.5-pro` | 輸入：$2.5 至 $1.25；快取讀取：未設定至 $0.125 |
| `vertex_ai/deep-research-pro-preview-12-2025` | 快取讀取：未設定至 $0.2 |
| `vertex_ai/gemini-3-pro-image` | 快取讀取：未設定至 $0.2 |
| `vertex_ai/gemini-3.1-flash-image` | 快取讀取：未設定至 $0.05 |
| `wandb/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B` | 輸入：$0.75 至 $0.5；輸出：$2.75 至 $2.15；快取讀取：$0.15 至 $0.1 |
| `wandb/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B` | 輸入：$0.1 至 $0.07；輸出：$0.25 至 $0.2；快取讀取：$0.05 至 $0.04 |

註冊表也更新了能力旗標、上下文/輸出限制、非 token 費率，以及淘汰日期。已移除五個項目：`friendliai/meta-llama-3.1-70b-instruct`、`friendliai/meta-llama-3.1-8b-instruct`、`github_copilot/gemini-2.5-pro`、`github_copilot/gemini-3-pro-preview` 和 `gmi/google/gemini-3-pro-preview`

### Amazon Bedrock {#amazon-bedrock}

- 透過單一有型別的驗證結構，在每次 STS 呼叫中傳送 aws_session_tags - [PR #40500](https://github.com/BerriAI/litellm/pull/40500)
- 將用戶端 tool_call id 清理為 Bedrock toolUseId 限制 - [PR #40872](https://github.com/BerriAI/litellm/pull/40872)
- 將 s3_endpoint_url 和 s3_region_name 帶入檔案內容下載 - [PR #41138](https://github.com/BerriAI/litellm/pull/41138)
- 在 web identity session policy 中授與 rerank、retrieve、agent 和 agentcore 動作 - [PR #41168](https://github.com/BerriAI/litellm/pull/41168)
- 讓提示快取可在 Nova InvokeModel 路由上運作 - [PR #41343](https://github.com/BerriAI/litellm/pull/41343)
- 絕不為 OpenAI 系列模型發出 Converse cachePoint - [PR #41419](https://github.com/BerriAI/litellm/pull/41419)
- 在 Knowledge Base Retrieve 請求中傳遞 userContext - [PR #41475](https://github.com/BerriAI/litellm/pull/41475)
- 將遺留的 tool blocks 中性化，而不是引發錯誤或注入虛設工具 - [PR #41513](https://github.com/BerriAI/litellm/pull/41513)
- 在 Bedrock Realtime 中支援 aws-sdk-bedrock-runtime 0.10/0.11 - [PR #41542](https://github.com/BerriAI/litellm/pull/41542)
- 針對 Opus 4.8 和 gen 5 Claude，依模型對應表限制 Invoke tool search - [PR #41702](https://github.com/BerriAI/litellm/pull/41702)
- 依據 inputTextTokenCount 計費 Bedrock Titan embedding 批次列 - [PR #41767](https://github.com/BerriAI/litellm/pull/41767)
- 在 Converse 上將 maxTokens 夾限為 OpenAI GPT 和 xAI Grok 模型的 16 token 最低值 - [PR #41870](https://github.com/BerriAI/litellm/pull/41870)
- 遵循 Bedrock 和 Anthropic Claude 工具上的 eager_input_streaming - [PR #41871](https://github.com/BerriAI/litellm/pull/41871)
- 當設定 AWS_BEARER_TOKEN_BEDROCK 時，以部署憑證簽署 batch retrieve 和 cancel - [PR #41904](https://github.com/BerriAI/litellm/pull/41904)

### Anthropic {#anthropic}

- 當訊息帶有 output_config 時，加入每輪控制 beta - [PR #41189](https://github.com/BerriAI/litellm/pull/41189)
- 在 beta 標頭設定中註冊 thinking-binding-controls-2026-08-01 - [PR #41203](https://github.com/BerriAI/litellm/pull/41203)
- 在串流時容忍沒有 usage 的 message_delta 事件 - [PR #41336](https://github.com/BerriAI/litellm/pull/41336)
- 將 message_start 中的已提供模型帶到串流區塊 - [PR #41446](https://github.com/BerriAI/litellm/pull/41446)
- 從 reasoning_content 估算中斷的 Anthropic 串流用量 - [PR #41503](https://github.com/BerriAI/litellm/pull/41503)
- 為 /v1/messages 上的 Gemini 目標保留 cache_control，並標準化 Anthropic ttl 單位 - [PR #41938](https://github.com/BerriAI/litellm/pull/41938)

### Azure {#azure}

- 支援 FLUX.2 flex images - [PR #39424](https://github.com/BerriAI/litellm/pull/39424)
- 在影像生成請求上傳送解析後的 Entra ID 權杖 - [PR #40147](https://github.com/BerriAI/litellm/pull/40147)
- 從檔案與影像內容部分移除 litellm format 欄位 - [PR #41275](https://github.com/BerriAI/litellm/pull/41275)
- 在向量儲存搜尋路徑之後保留 api-version 查詢字串 - [PR #41384](https://github.com/BerriAI/litellm/pull/41384)
- 將 Azure Speech 短音訊分類到帶有前綴的 api base 後面 - [PR #41882](https://github.com/BerriAI/litellm/pull/41882)
- 當請求沒有 tools 時，移除 tool_choice - [PR #42031](https://github.com/BerriAI/litellm/pull/42031)

### Bedrock Mantle {#bedrock-mantle}

- 依區域成本列為 GovCloud 區域定價，並接受以區域為前綴的模型名稱 - [PR #39846](https://github.com/BerriAI/litellm/pull/39846)
- 接受並轉送 gpt-5.x chat completions 上的 verbosity - [PR #41509](https://github.com/BerriAI/litellm/pull/41509)

### DashScope {#dashscope}

- 將 reasoning_effort 轉送給提供者 - [PR #37506](https://github.com/BerriAI/litellm/pull/37506)

### Fireworks AI {#fireworks-ai}

- 將短模型名稱解析為較長的成本對應表鍵值 - [PR #40929](https://github.com/BerriAI/litellm/pull/40929)
- 將 dict 形式的 reasoning_effort 攤平成其 effort 字串 - [PR #41335](https://github.com/BerriAI/litellm/pull/41335)
- 透過共用成本計算器計費快取寫入、推理與音訊 token - [PR #41339](https://github.com/BerriAI/litellm/pull/41339)
- 在成本對應表中還原 minimax-m3 的 supports_vision - [PR #41699](https://github.com/BerriAI/litellm/pull/41699)
- 當對應表沒有 cache-read 費率時，將 fireworks 快取輸入預設為文件記載的 50% 折扣 - [PR #41917](https://github.com/BerriAI/litellm/pull/41917)

### Gemini and Vertex AI {#gemini-and-vertex-ai}

- 端到端計費 Gemini Live sessions - [PR #40915](https://github.com/BerriAI/litellm/pull/40915)
- 將 minimal thinking 對應為 Gemini 3.7 和 3.8 Flash 的 low - [PR #41201](https://github.com/BerriAI/litellm/pull/41201)
- 在 passthrough 上計費 Gemini Omni Interactions 用量與 Veo sampleCount - [PR #41322](https://github.com/BerriAI/litellm/pull/41322)
- 將提供者的 modelVersion 傳遞到回應模型 - [PR #41338](https://github.com/BerriAI/litellm/pull/41338)
- 從 `/v1/files/{id}/content` 串流 GCS 批次輸出檔案 - [PR #41506](https://github.com/BerriAI/litellm/pull/41506)
- 將 vertex gemma-4-26b-a4b-it-maas 上下文視窗設為 262144 - [PR #41887](https://github.com/BerriAI/litellm/pull/41887)
- 保留具有 finishReason 且沒有內容的 candidates - [PR #41892](https://github.com/BerriAI/litellm/pull/41892)

### Mistral {#mistral}

- 在所有模型上接受 reasoning_effort，並為了 Codex 相容性移除 client_metadata - [PR #41062](https://github.com/BerriAI/litellm/pull/41062)
- 為缺少 cache-read 定價的 Mistral chat models 加入 cache-read 定價 - [PR #41736](https://github.com/BerriAI/litellm/pull/41736)

### OpenAI {#openai}

- 新增 openai_system_messages_first，以便將 system messages 放在前面進行提示快取 - [PR #41304](https://github.com/BerriAI/litellm/pull/41304)
- 將有日期的 openai/azure snapshots 解析為其無日期的成本對應表項目 - [PR #41423](https://github.com/BerriAI/litellm/pull/41423)
- 當設定 drop_params 時，從 gpt-5 reasoning models 移除 top_p - [PR #41469](https://github.com/BerriAI/litellm/pull/41469)

### xAI {#xai}

- 在 xAI Responses API 上保留 'instructions'，以便 system messages 在 web search 中仍可保留 - [PR #38254](https://github.com/BerriAI/litellm/pull/38254)
- 在 xAI Responses API 上遵循巢狀 web_search filters - [PR #38268](https://github.com/BerriAI/litellm/pull/38268)
- 停止將 web_search_options 傳送到 xAI 已退役的 Live Search 路徑 - [PR #38278](https://github.com/BerriAI/litellm/pull/38278)

### 模型型錄與定價 {#model-catalog-and-pricing}

- 自動將 Friendli 模型中繼資料同步至價格登錄 - [PR #35918](https://github.com/BerriAI/litellm/pull/35918)
- 同步 Vertex AI 價格：14 個模型 - [PR #40955](https://github.com/BerriAI/litellm/pull/40955)
- 新增 azure gpt-chat-latest 費率，並移除已退役的 friendliai llama-3.1 項目 - [PR #40976](https://github.com/BerriAI/litellm/pull/40976)
- 以提供者範圍的 fill_missing_for_providers 從備援一般化規則回填 - [PR #41093](https://github.com/BerriAI/litellm/pull/41093)
- 滾動式登錄稽核：Gemini latest 別名、Nova 快取定價、OpenRouter/Together 同步、Mistral GLM 5.3、Azure 快照、Grok 快取 - [PR #41112](https://github.com/BerriAI/litellm/pull/41112)
- 同步 Azure、Azure AI、Gemini、OpenAI、Bedrock、Together AI、Fireworks 和 Vertex 價格：278 個模型、59 個新增、30 個已棄用 - [PR #41154](https://github.com/BerriAI/litellm/pull/41154)
- 新增 aihubmix 提供者定價項目 - [PR #41179](https://github.com/BerriAI/litellm/pull/41179)
- 新增與提供者無關的 Gemini 2.5+ 聊天基準備援一般化 - [PR #41320](https://github.com/BerriAI/litellm/pull/41320)
- 同步 Google Gemini 價格：22 個模型 - [PR #41457](https://github.com/BerriAI/litellm/pull/41457)
- 去除由文字合併遺留的 Nova cache_read_input_token_cost 鍵重複 - [PR #41496](https://github.com/BerriAI/litellm/pull/41496)
- 同步 Together AI 價格：6 個模型、6 個已棄用 [同步失敗：Google Gemini] - [PR #41570](https://github.com/BerriAI/litellm/pull/41570)
- 將 stealth/union-alpha 新增至模型成本對照表 - [PR #41576](https://github.com/BerriAI/litellm/pull/41576)
- 滾動式登錄稽核：Azure 退役日期、Bedrock Mantle Grok 4.3 上下文視窗 - [PR #41597](https://github.com/BerriAI/litellm/pull/41597)
- 同步 OpenRouter 價格：443 個模型、191 個新增、4 個已棄用 - [PR #41727](https://github.com/BerriAI/litellm/pull/41727)
- 新增 qwen3.8 flash 列，修正 Cohere embed v3 上下文、Bedrock Mantle 與 OpenRouter 定價 - [PR #41754](https://github.com/BerriAI/litellm/pull/41754)
- 同步 OpenRouter 價格：2 個模型、1 個已棄用 - [PR #41770](https://github.com/BerriAI/litellm/pull/41770)
- 同步 OpenRouter 價格：15 個模型、6 個已棄用 - [PR #41772](https://github.com/BerriAI/litellm/pull/41772)
- 同步 OpenRouter 價格：172 個模型、2 個新增 - [PR #41833](https://github.com/BerriAI/litellm/pull/41833)
- 在 model prices schema generator 中將 off_peak_pricing 分類為結構化物件 - [PR #41847](https://github.com/BerriAI/litellm/pull/41847)
- 依提供者型錄回填 reseller Gemini 項目，並清理已退役的 id - [PR #41902](https://github.com/BerriAI/litellm/pull/41902)
- 移除 anthropic 棄用下限，並修正 azure gpt-4.1-nano 退役日期 - [PR #41964](https://github.com/BerriAI/litellm/pull/41964)
- 同步 Azure 價格：5 個模型、5 個已棄用 - [PR #41966](https://github.com/BerriAI/litellm/pull/41966)
- 同步 OpenRouter 價格：2 個模型 - [PR #41996](https://github.com/BerriAI/litellm/pull/41996)
- 同步 OpenRouter 價格：2 個模型 - [PR #42006](https://github.com/BerriAI/litellm/pull/42006)
- 同步 OpenRouter 價格：5 個模型 - [PR #42058](https://github.com/BerriAI/litellm/pull/42058)
- 同步 OpenRouter 價格：2 個模型 - [PR #42063](https://github.com/BerriAI/litellm/pull/42063)

### 一般 {#general}

- 在已發出的回應仍在讀取時保持處理常式存活 - [PR #34829](https://github.com/BerriAI/litellm/pull/34829)
- 每筆記錄只掃描一次，並在秘密 regex 之前折疊 base64 負載 - [PR #40934](https://github.com/BerriAI/litellm/pull/40934)
- 將來自 litellm_proxy 400 的 BadRequestError 保留 body 和 proxy headers - [PR #40994](https://github.com/BerriAI/litellm/pull/40994)
- 不要將 litellm 參數保留在提供者請求主體中 - [PR #41018](https://github.com/BerriAI/litellm/pull/41018)
- 在 httpx 處理常式路徑上，不要將 extra_headers 保留在聊天請求主體中 - [PR #41141](https://github.com/BerriAI/litellm/pull/41141)
- 將無法轉譯的 tool_choice 以 400 拒絕，而不是 500 - [PR #41234](https://github.com/BerriAI/litellm/pull/41234)
- 為 httpx 用戶端選擇性啟用傳出 HTTP/2 - [PR #41268](https://github.com/BerriAI/litellm/pull/41268)
- 在第一次 completion 呼叫前接受 custom_provider_map 提供者 - [PR #41300](https://github.com/BerriAI/litellm/pull/41300)
- 保留已解析的提供者，以便 router 自訂定價能為 azure_ai 部署正確解析 - [PR #41623](https://github.com/BerriAI/litellm/pull/41623)
- 將 internal_server_error 保持為上游 500 的公開類型 - [PR #41930](https://github.com/BerriAI/litellm/pull/41930)
- 快取共用節點，並在超過深度上限後以失敗封閉 - [PR #41952](https://github.com/BerriAI/litellm/pull/41952)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 停止受管理的 Responses WebSocket 將 litellm_params 洩漏到提供者請求主體中 - [PR #33101](https://github.com/BerriAI/litellm/pull/33101)
- 將 Foundry Models 的 Responses API 路由到原生 /openai/v1/responses - [PR #33856](https://github.com/BerriAI/litellm/pull/33856)
- 在 Responses API 串流橋接中防護空 choices 區塊 - [PR #34455](https://github.com/BerriAI/litellm/pull/34455)
- 將 reasoning 物件轉譯為 chat-completion 的 reasoning effort - [PR #36363](https://github.com/BerriAI/litellm/pull/36363)
- 發出具型別的串流失敗事件 - [PR #40243](https://github.com/BerriAI/litellm/pull/40243)
- 遵循巢狀 additional_drop_params 路徑 - [PR #40730](https://github.com/BerriAI/litellm/pull/40730)
- 將 Codex additional_tools 輸入項目提升到聊天橋接 tools 中 - [PR #40989](https://github.com/BerriAI/litellm/pull/40989)
- 如同原生 Responses 路徑一樣篩選 bridged kwargs - [PR #41144](https://github.com/BerriAI/litellm/pull/41144)
- 當串流回應完成但沒有 usage 時重新計算 token - [PR #41337](https://github.com/BerriAI/litellm/pull/41337)
- 在聊天 completions 橋接中，先公告 message item，再公告 text events - [PR #41564](https://github.com/BerriAI/litellm/pull/41564)
- 將已定位的 response id 排除在 bridged provider 請求之外 - [PR #41689](https://github.com/BerriAI/litellm/pull/41689)
- 將部署 litellm_params 合併到原生 websocket response.create frames 中 - [PR #41881](https://github.com/BerriAI/litellm/pull/41881)
- 在原生 WebSocket relay 上還原 encrypted_content 並套用 affinity - [PR #41893](https://github.com/BerriAI/litellm/pull/41893)
- 對沒有 input 的 /v1/responses 回傳 400，而非 500 - [PR #41939](https://github.com/BerriAI/litellm/pull/41939)
- 在聊天 completions 橋接中移除 tool_search 和 local_shell - [PR #41953](https://github.com/BerriAI/litellm/pull/41953)

### Anthropic Messages {#anthropic-messages}

- 在延後的 /v1/messages 請求上記錄提供者用量，並在沒有建立費率時寫入價格快取 - [PR #41172](https://github.com/BerriAI/litellm/pull/41172)
- 將對話中途的 system 回合轉換為 /v1/messages 到 chat completions 的 user 回合 - [PR #41493](https://github.com/BerriAI/litellm/pull/41493)
- 將部署 api_base 轉送到 /v1/messages 上的 agentic 後續請求 - [PR #41918](https://github.com/BerriAI/litellm/pull/41918)

### 批次與檔案 {#batches-and-files}

- 支援 S3 支援的受管理檔案刪除與列出 - [PR #39836](https://github.com/BerriAI/litellm/pull/39836)
- 為 /v1/files 上傳新增 general_settings.allowed_file_extensions - [PR #41106](https://github.com/BerriAI/litellm/pull/41106)
- 支援 Mistral 檔案/批次，以及每頁 OCR 批次成本追蹤 - [PR #41934](https://github.com/BerriAI/litellm/pull/41934)
- 在 LiteLLM 內執行 hosted_vllm 批次 - [PR #41942](https://github.com/BerriAI/litellm/pull/41942)

### OCR {#ocr}

- 當 callback 攔截請求時，保留已下載文件的內嵌內容 - [PR #41719](https://github.com/BerriAI/litellm/pull/41719)
- 新增僅限 Rust 的 Textract，並在 host hooks 之後為提供者請求簽章 - [PR #41977](https://github.com/BerriAI/litellm/pull/41977)
- 設定 DeepSeek OCR 抽樣預設值 - [PR #41992](https://github.com/BerriAI/litellm/pull/41992)

### 即時與音訊 {#realtime-and-audio}

- 將延後的 Nova Sonic 串流失敗傳遞給 router - [PR #41064](https://github.com/BerriAI/litellm/pull/41064)
- 當即時工作階段結束且沒有 LLM callback 時，釋放 max_parallel_requests 名額 - [PR #41113](https://github.com/BerriAI/litellm/pull/41113)
- 在即時健康檢查中解析 litellm_credential_name - [PR #41173](https://github.com/BerriAI/litellm/pull/41173)
- 新增 Azure AI Speech 直通路由 - [PR #41557](https://github.com/BerriAI/litellm/pull/41557)
- 透過 /v1/realtime 串流 Chirp speech-to-text - [PR #41721](https://github.com/BerriAI/litellm/pull/41721)
- 透過 /v1/audio/transcriptions 新增語音轉文字（Grok Voice Transcribe） - [PR #41914](https://github.com/BerriAI/litellm/pull/41914)

### 向量儲存、RAG 與搜尋 {#vector-stores-rag-and-search}

- 將 retrieval_config 的 retrieval_filter 轉送至向量儲存搜尋 - [PR #34427](https://github.com/BerriAI/litellm/pull/34427)
- 將 model_group_alias 解析為其對應目標，供 /v1/models 中繼資料使用 - [PR #41483](https://github.com/BerriAI/litellm/pull/41483)
- 在 /v1/rag/ingest 上解析登錄儲存，並拒絕沒有 ingestion 的提供者 - [PR #41940](https://github.com/BerriAI/litellm/pull/41940)

### 圖片生成與編輯 {#image-generation-and-edits}

- 停止轉送原始 `image[]` 和 `mask[]` 表單鍵 - [PR #39512](https://github.com/BerriAI/litellm/pull/39512)

### 代理對代理 {#agent-to-agent}

- 透過 Entra 驗證與版本化卡片探索連線 Microsoft Foundry agents - [PR #41511](https://github.com/BerriAI/litellm/pull/41511)

### 重新排序 {#rerank}

- 依輸入記錄計費 Vertex search_units，並為每個 rerank 回應提供唯一 id - [PR #35180](https://github.com/BerriAI/litellm/pull/35180)

### 直通端點 {#pass-through-endpoints}

- 在 /claude_code_gateway 下提供 Claude Code 閘道協定 - [PR #34267](https://github.com/BerriAI/litellm/pull/34267)
- 將 Vertex 直通成功歸因於已解析的路由部署 - [PR #41307](https://github.com/BerriAI/litellm/pull/41307)
- 新增 /nvidia_nim 直通路由，供 NIM 物件偵測與 OCR /v1/infer 使用 - [PR #41316](https://github.com/BerriAI/litellm/pull/41316)
- 當用戶端未送出查詢參數時，保留目標 URL 查詢字串 - [PR #41448](https://github.com/BerriAI/litellm/pull/41448)
- Bedrock agent-runtime 直通時停止轉發 LiteLLM 憑證標頭 - [PR #41504](https://github.com/BerriAI/litellm/pull/41504)
- 新增 Amazon Transcribe 直通，依完成時間作業計價 - [PR #41515](https://github.com/BerriAI/litellm/pull/41515)
- Deepgram 串流 /v1/listen WebSocket 直通，支援依持續時間追蹤成本 - [PR #41554](https://github.com/BerriAI/litellm/pull/41554)
- 新增 TypeSafe AI Jev evaluate 直通，支援依登錄定價追蹤支出 - [PR #41607](https://github.com/BerriAI/litellm/pull/41607)
- 轉發 typesafe 直通路由上的每個方法 - [PR #41723](https://github.com/BerriAI/litellm/pull/41723)

### 一般 {#general-1}

- 在對應的錯誤回應上轉發提供者請求 ID 標頭 - [PR #40925](https://github.com/BerriAI/litellm/pull/40925)
- 當路由省略 call_id 時，從回應中繼資料解析 x-litellm-call-id - [PR #41056](https://github.com/BerriAI/litellm/pull/41056)
- 在 LLM API 例外記錄中包含 litellm_call_id - [PR #41205](https://github.com/BerriAI/litellm/pull/41205)
- 對請求主體中孤立代理項逸出返回 400，而非 500 - [PR #41297](https://github.com/BerriAI/litellm/pull/41297)
- 在特定端點錯誤記錄與失敗回應中保留 litellm_call_id - [PR #41356](https://github.com/BerriAI/litellm/pull/41356)

## 管理端點 / UI {#management-endpoints--ui}

### 管理員 UI {#admin-ui}

- 在記錄 UI 中加總多輪工作階段持續時間 - [PR #35388](https://github.com/BerriAI/litellm/pull/35388)
- 註冊技能時接受 ssh clone URL - [PR #35418](https://github.com/BerriAI/litellm/pull/35418)
- 對僅檢視管理員隱藏 models 頁面上的管理寫入表單分頁 - [PR #38867](https://github.com/BerriAI/litellm/pull/38867)
- 顯示影片模型的每秒定價，而不是 $0.00 token 成本 - [PR #39308](https://github.com/BerriAI/litellm/pull/39308)
- 讓團隊管理員授權整個團隊使用所有 proxy models - [PR #40196](https://github.com/BerriAI/litellm/pull/40196)
- 在模型更新時保留停用快取控制注入點 - [PR #40632](https://github.com/BerriAI/litellm/pull/40632)
- 讓管理員可從模型編輯頁面變更模型的團隊 - [PR #40700](https://github.com/BerriAI/litellm/pull/40700)
- 在 Top Virtual Keys 使用量表格中顯示使用者歸因 - [PR #40729](https://github.com/BerriAI/litellm/pull/40729)
- 在記錄表格與記錄詳細資料抽屜中顯示內部使用者電子郵件 - [PR #40737](https://github.com/BerriAI/litellm/pull/40737)
- 在按模型劃分的快取外洩表格中列出每個提供者 - [PR #40875](https://github.com/BerriAI/litellm/pull/40875)
- 在模型資訊頁面與其原始 JSON 中顯示團隊別名 - [PR #40992](https://github.com/BerriAI/litellm/pull/40992)
- 將輸入到 key metadata JSON 的 tags 移至 Tags 欄位 - [PR #41023](https://github.com/BerriAI/litellm/pull/41023)
- 當支出頁面失敗時，封鎖使用量匯出並標記區間 - [PR #41294](https://github.com/BerriAI/litellm/pull/41294)
- 在 URL 中保留 Models 表格搜尋、篩選、排序與頁面狀態 - [PR #41296](https://github.com/BerriAI/litellm/pull/41296)
- 將自訂請求標頭新增至 API Playground - [PR #41309](https://github.com/BerriAI/litellm/pull/41309)
- 在使用量模型活動中顯示每個模型的平均回應時間 - [PR #41313](https://github.com/BerriAI/litellm/pull/41313)
- 設定 capability 與 Fuse v2 分類器 - [PR #41315](https://github.com/BerriAI/litellm/pull/41315)
- 供表格與分頁使用的共用 URL 狀態層 - [PR #41331](https://github.com/BerriAI/litellm/pull/41331)
- 簡化 Capability 與 Fuse 進階路由選項 - [PR #41371](https://github.com/BerriAI/litellm/pull/41371)
- 在請求生命週期中保留未計時的防護欄項目 - [PR #41374](https://github.com/BerriAI/litellm/pull/41374)
- 在 URL 中保留 organizations 與 projects 清單、詳細分頁與 key 表格狀態 - [PR #41445](https://github.com/BerriAI/litellm/pull/41445)
- 將 MCP Servers 頁面連結到使用者已連線的 MCP servers - [PR #41888](https://github.com/BerriAI/litellm/pull/41888)
- 在路由詳細資料中顯示 heuristic v2 分數估計 - [PR #42001](https://github.com/BerriAI/litellm/pull/42001)
- 從管理員 UI 設定 web search 攔截 - [PR #42007](https://github.com/BerriAI/litellm/pull/42007)
- 回報服務 proxy 是否已套用 web search 攔截 - [PR #42042](https://github.com/BerriAI/litellm/pull/42042)

### 金鑰、團隊與組織 {#keys-teams-and-organizations}

- 讓 proxy 管理員選擇團隊管理員可編輯哪些團隊欄位 - [PR #39996](https://github.com/BerriAI/litellm/pull/39996)
- 讓團隊服務帳戶金鑰可使用 key management 端點管理其所屬團隊 - [PR #40807](https://github.com/BerriAI/litellm/pull/40807)
- 透過 agent_id_jwt_field 將 JWT claims 綁定至已註冊代理程式 - [PR #40904](https://github.com/BerriAI/litellm/pull/40904)
- 在憑證名稱衝突時回傳 409，將 Terraform 採用設為選擇加入 - [PR #40917](https://github.com/BerriAI/litellm/pull/40917)
- 統一的 custom_key_policy hook，供 key generate、update 與 regenerate 使用 - [PR #40921](https://github.com/BerriAI/litellm/pull/40921)
- 允許每個 issuer 使用不同的 virtual_key_claim_field - [PR #40927](https://github.com/BerriAI/litellm/pull/40927)
- 新增 POST /management/v1/users/bulk，用於批次建立使用者與團隊成員資格 - [PR #41028](https://github.com/BerriAI/litellm/pull/41028)
- 新增 POST /management/v1/users/bulk_delete 與 POST `/management/v1/teams/{team_id}/members/bulk_delete` - [PR #41039](https://github.com/BerriAI/litellm/pull/41039)
- 讓組織管理員在其他組織中的自身團隊成員資格仍可在團隊清單中可見 - [PR #41086](https://github.com/BerriAI/litellm/pull/41086)
- 在 /model_group/info 中向 proxy 管理員顯示所有模型群組 - [PR #41094](https://github.com/BerriAI/litellm/pull/41094)
- 允許已選擇加入的團隊成員管理其路由器 - [PR #41175](https://github.com/BerriAI/litellm/pull/41175)
- 追蹤每位成員的組織支出 - [PR #41255](https://github.com/BerriAI/litellm/pull/41255)
- 在模型存取錯誤中列出直接指派的團隊模型 - [PR #41256](https://github.com/BerriAI/litellm/pull/41256)
- 當 max_budget 為 0 時強制執行組織預算 - [PR #41271](https://github.com/BerriAI/litellm/pull/41271)
- 依啟用、過期、撤銷或刪除狀態篩選 /key/list，並從 /key/info 提供已刪除的金鑰 - [PR #41311](https://github.com/BerriAI/litellm/pull/41311)
- 團隊層級 model_max_budget，並支援金鑰層級覆寫 - [PR #41330](https://github.com/BerriAI/litellm/pull/41330)
- 將 team_member_budget 更新套用至仍採用團隊預設值的成員 - [PR #41347](https://github.com/BerriAI/litellm/pull/41347)
- 當成員沒有預算時，追蹤團隊成員支出 - [PR #41349](https://github.com/BerriAI/litellm/pull/41349)
- 追蹤專案支出並以累加方式強制執行專案預算 - [PR #41354](https://github.com/BerriAI/litellm/pull/41354)
- 在 virtual keys 上公開終身 total_spend - [PR #41403](https://github.com/BerriAI/litellm/pull/41403)
- 啟用時讓團隊管理員可編輯 rpm_limit 與 max_budget - [PR #41525](https://github.com/BerriAI/litellm/pull/41525)
- 針對團隊成員的暫時性預算增加 - [PR #41620](https://github.com/BerriAI/litellm/pull/41620)
- 批次更新團隊成員預算 - [PR #41632](https://github.com/BerriAI/litellm/pull/41632)
- 供動態建立客戶使用的每個金鑰預設預算 - [PR #41636](https://github.com/BerriAI/litellm/pull/41636)
- 保留分叉的成員預算重設視窗，並稽核批次成員預算寫入 - [PR #41686](https://github.com/BerriAI/litellm/pull/41686)
- 將資料庫模型重新命名傳播至金鑰、團隊、組織、專案與使用者模型允許清單 - [PR #41694](https://github.com/BerriAI/litellm/pull/41694)
- 為 member_delete 與角色變更發出稽核事件，並在建立團隊時攜帶最終名單 - [PR #41840](https://github.com/BerriAI/litellm/pull/41840)
- 讓團隊管理員透過 team_admin_editable_team_fields 管理專案 - [PR #41916](https://github.com/BerriAI/litellm/pull/41916)
- 在讀取位置解析 role_permissions - [PR #41924](https://github.com/BerriAI/litellm/pull/41924)
- 將 transcribe 註冊為模型授權可識別的已知提供者 - [PR #41926](https://github.com/BerriAI/litellm/pull/41926)
- /key/bulk_update 只寫入每個項目攜帶的欄位 - [PR #41949](https://github.com/BerriAI/litellm/pull/41949)
- 當 max_budget 為 0 時封鎖專案請求 - [PR #41997](https://github.com/BerriAI/litellm/pull/41997)

### 驗證 {#authentication}

- 透過即時使用者與團隊資料列重新整理 lite login session token grants - [PR #40657](https://github.com/BerriAI/litellm/pull/40657)
- 在 proxy 管理員上限制 webhook 測試警示 - [PR #40814](https://github.com/BerriAI/litellm/pull/40814)
- 限制重複失敗的 Admin UI 登入嘗試 - [PR #40982](https://github.com/BerriAI/litellm/pull/40982)
- 當設定 UI_PASSWORD 時，隱藏預設憑證登入提示 - [PR #41107](https://github.com/BerriAI/litellm/pull/41107)
- 依 issuer 範圍界定 JWT 金鑰對應，以避免跨 issuer 衝突 - [PR #41281](https://github.com/BerriAI/litellm/pull/41281)
- 在 db overlay 之後，讓 yaml pass-through endpoints 對 auth 保持可見 - [PR #41303](https://github.com/BerriAI/litellm/pull/41303)
- 絕不在 /anthropic passthrough 上將 LiteLLM 虛擬金鑰轉送給 Anthropic - [PR #41340](https://github.com/BerriAI/litellm/pull/41340)
- 將分頁 `count` 驗證與 RFC 7644 對齊 - [PR #41444](https://github.com/BerriAI/litellm/pull/41444)
- 在閘道 token endpoint 上為 IdP JWT 新增 RFC 8693 token exchange - [PR #41485](https://github.com/BerriAI/litellm/pull/41485)
- 為 JWT 與團隊關聯金鑰繼承 org alias、budget 與 rate limits - [PR #41681](https://github.com/BerriAI/litellm/pull/41681)
- 在使用者、團隊、org 與大量金鑰刪除時，清除 jwt key mapping cache - [PR #41707](https://github.com/BerriAI/litellm/pull/41707)
- 在 SCIM user PUT 上接受沒有 value 的 entitlements 與 roles 項目 - [PR #41830](https://github.com/BerriAI/litellm/pull/41830)

### Proxy 組態 {#proxy-configuration}

- 遵循 LITELLM_DISABLE_ACCESS_LOG_PATHS 以移除雜訊過多的 uvicorn access log 行 - [PR #41096](https://github.com/BerriAI/litellm/pull/41096)
- 當最新資料列讀取失敗時，跳過背景健康檢查 DB 寫入 - [PR #41145](https://github.com/BerriAI/litellm/pull/41145)
- 遵循 LITELLM_LOG 於 uvicorn 與 proxy 額外記錄器 - [PR #41306](https://github.com/BerriAI/litellm/pull/41306)
- 對用戶端可見的 model access denied 錯誤隱藏 model allowlist - [PR #41310](https://github.com/BerriAI/litellm/pull/41310)
- 為 policy attachment 執行順序明確設定優先順序 - [PR #41571](https://github.com/BerriAI/litellm/pull/41571)
- 在 save_config 中僅保存呼叫者變更過的 keys - [PR #41748](https://github.com/BerriAI/litellm/pull/41748)
- 讓設定檔優先於資料庫，並在兩個讀取端點上支援 `source` 與 `editable` - [PR #41779](https://github.com/BerriAI/litellm/pull/41779)
- 當設定檔擁有某個 key 時，讓 SettingsStore.clear() 終止 - [PR #41862](https://github.com/BerriAI/litellm/pull/41862)
- 拒絕 POST /config/update 上屬於設定檔的 keys - [PR #41868](https://github.com/BerriAI/litellm/pull/41868)
- 拒絕對屬於設定檔的設定進行執行階段寫入 - [PR #41931](https://github.com/BerriAI/litellm/pull/41931)
- 說明何時儲存的設定因設定檔擁有而被忽略 - [PR #41985](https://github.com/BerriAI/litellm/pull/41985)
- 修補 QA 在 settings store 中發現的設定檔擁有權缺口 - [PR #42009](https://github.com/BerriAI/litellm/pull/42009)

### CLI 與 coding agents {#cli-and-coding-agents}

- 將 Codex /model picker 與 lite codex 中的 proxy /v1/models 同步 - [PR #40476](https://github.com/BerriAI/litellm/pull/40476)
- 移除 enum.StrEnum 以便 CLI 可在 Python 3.10 匯入 - [PR #41046](https://github.com/BerriAI/litellm/pull/41046)
- 顯示 LLM API keys 的 routed models 與 session stats - [PR #41116](https://github.com/BerriAI/litellm/pull/41116)
- 標示 router costs 並簡化 routed-model 標頭 - [PR #41186](https://github.com/BerriAI/litellm/pull/41186)
- 將 lite autoroute up/down 重新命名為 start/stop，並將舊名稱保留為已淘汰別名 - [PR #41672](https://github.com/BerriAI/litellm/pull/41672)
- 將 litellm-proxy 進入點標示為已棄用，改用 lite - [PR #41673](https://github.com/BerriAI/litellm/pull/41673)
- 新增一個將 LiteLLM 註冊為 language model provider 的 VS Code 擴充功能 - [PR #41865](https://github.com/BerriAI/litellm/pull/41865)

### Terraform {#terraform}

- 將 tpm_limit、rpm_limit、budget_duration、allowed_models 新增到 litellm_team_member_add - [PR #38682](https://github.com/BerriAI/litellm/pull/38682)
- 解除連結那些點擊後會 404 的 Terraform registry 文件項目 - [PR #42003](https://github.com/BerriAI/litellm/pull/42003)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 新增上游 presidio pii entities，包括 german set - [PR #36775](https://github.com/BerriAI/litellm/pull/36775)
- 新增 Microsoft Agent 365 MCP tool-call 防護欄 - [PR #38241](https://github.com/BerriAI/litellm/pull/38241)
- 當範圍設定後沒有任何可掃描內容時，記錄 not_run evaluation - [PR #39050](https://github.com/BerriAI/litellm/pull/39050)
- 將被阻擋的串流防護欄回應記錄為失敗，而非成功 - [PR #40191](https://github.com/BerriAI/litellm/pull/40191)
- 保護歷史紀錄中任何位置的 cache_control 標記列 - [PR #40315](https://github.com/BerriAI/litellm/pull/40315)
- 不要為僅限 MCP 的 Presidio 模式新增 post_call 輸出掃描 - [PR #40571](https://github.com/BerriAI/litellm/pull/40571)
- `logging_only` 模式會在傳遞後掃描已完成的串流 - [PR #40702](https://github.com/BerriAI/litellm/pull/40702)
- 對防護欄新增的 tags 強制執行 tag 預算 - [PR #40842](https://github.com/BerriAI/litellm/pull/40842)
- 將逐訊息的防護欄重寫寫回 Responses input items - [PR #40939](https://github.com/BerriAI/litellm/pull/40939)
- 掃描 Anthropic 最上層 system prompt 與 tool_use 引數 - [PR #40984](https://github.com/BerriAI/litellm/pull/40984)
- 從自訂程式碼防護欄中的 metadata buckets 解析呼叫者身分 - [PR #41126](https://github.com/BerriAI/litellm/pull/41126)
- 支援 llm_as_a_judge 的 pre_call 與 during_call 模式 - [PR #41128](https://github.com/BerriAI/litellm/pull/41128)
- 讓輪詢檔案清理持續經過非終止狀態 - [PR #41131](https://github.com/BerriAI/litellm/pull/41131)
- 從純文字訊息推導 contextual grounding source 與 query - [PR #41132](https://github.com/BerriAI/litellm/pull/41132)
- 透過最後一個 cache_control breakpoint 保護快取前綴 - [PR #41161](https://github.com/BerriAI/litellm/pull/41161)
- 讓 post-call 掃描取得有範圍限定的 request 對話與工具 - [PR #41220](https://github.com/BerriAI/litellm/pull/41220)
- Singulr v2 API 合約，包含 logging_only、pre_mcp_call 和 post_mcp_call - [PR #41329](https://github.com/BerriAI/litellm/pull/41329)
- 為每個串流區塊掃描一個受限視窗 - [PR #41407](https://github.com/BerriAI/litellm/pull/41407)
- 在每次通過掃描後釋放已緩衝的串流區塊 - [PR #41425](https://github.com/BerriAI/litellm/pull/41425)
- 將 prompt injection heuristics 移出事件迴圈執行 - [PR #41541](https://github.com/BerriAI/litellm/pull/41541)
- 以 incremental_diff 模式串流 Prompt Security post_call redactions - [PR #41558](https://github.com/BerriAI/litellm/pull/41558)
- 在 x-litellm-applied-guardrails 中命名阻擋型防護欄 - [PR #41583](https://github.com/BerriAI/litellm/pull/41583)
- 在工具執行期間保留請求選定的防護欄 - [PR #41619](https://github.com/BerriAI/litellm/pull/41619)
- 透過 during_call_hook 分派 llm_api_check moderation - [PR #41685](https://github.com/BerriAI/litellm/pull/41685)
- 新增 TypeSafe Jev 相關性為基礎的壓縮防護欄 - [PR #41757](https://github.com/BerriAI/litellm/pull/41757)
- 在 rate-limit fallback 時保留請求的模型防護欄與 key disable_fallbacks - [PR #41783](https://github.com/BerriAI/litellm/pull/41783)
- 在呼叫時解析 openai_moderations model，並預設為 omni-moderation-latest - [PR #41895](https://github.com/BerriAI/litellm/pull/41895)
- 在多選項、未完成與無 envelope 的串流上傳遞防護欄文字重寫 - [PR #41933](https://github.com/BerriAI/litellm/pull/41933)
- 停止 Javelin api_version 預設值洩漏到 Azure Content Safety - [PR #41941](https://github.com/BerriAI/litellm/pull/41941)
- 從 post-call 掃描中移除有範圍限定的 request 對話與工具 - [PR #41986](https://github.com/BerriAI/litellm/pull/41986)
- 透過 hook 邊界傳遞串流回應屬性，並合併已記錄的 applied_guardrails - [PR #42027](https://github.com/BerriAI/litellm/pull/42027)

### 記錄與可觀測性 {#logging-and-observability}

- 在 OTLP 匯出前移除 None 指標與事件屬性 - [PR #36815](https://github.com/BerriAI/litellm/pull/36815)
- 釐清預算門檻訊息 - [PR #39102](https://github.com/BerriAI/litellm/pull/39102)
- 將其餘內嵌 token 計數移出事件迴圈 - [PR #40262](https://github.com/BerriAI/litellm/pull/40262)
- 讓模型輸出目標 + 多查詢搜尋形狀 - [PR #40399](https://github.com/BerriAI/litellm/pull/40399)
- 依索引上限限制 OpenInference 訊息屬性於整個 span 的範圍內 - [PR #40562](https://github.com/BerriAI/litellm/pull/40562)
- 在 HTTP 與 WebSocket 透傳時傳遞 W3C trace context - [PR #40669](https://github.com/BerriAI/litellm/pull/40669)
- 以已解析的 api_provider 標註前置呼叫速率限制失敗 - [PR #41059](https://github.com/BerriAI/litellm/pull/41059)
- 對 5xx HTTPException 與 ProxyException 傳送 llm_exceptions Slack 警示 - [PR #41125](https://github.com/BerriAI/litellm/pull/41125)
- 將呼叫者的 Langfuse user、session 與 tags 對映到 root 與 generation spans - [PR #41140](https://github.com/BerriAI/litellm/pull/41140)
- 在 litellm_proxy_failed_requests_metric 中計入 401 驗證失敗 - [PR #41170](https://github.com/BerriAI/litellm/pull/41170)
- 在進行中的 flush 期間保留已附加的 events，而不是清除它們 - [PR #41288](https://github.com/BerriAI/litellm/pull/41288)
- 新增 s3_log_prompts_only 選項以記錄 prompts 而不記錄 responses - [PR #41327](https://github.com/BerriAI/litellm/pull/41327)
- 將 litellm_trace_id 預設為 OTel server span 的 trace id - [PR #41386](https://github.com/BerriAI/litellm/pull/41386)
- 將巢狀請求 metadata keys 提升為 litellm.metadata.* span attributes - [PR #41462](https://github.com/BerriAI/litellm/pull/41462)
- 新增 customer（end_user）預算 gauge - [PR #41472](https://github.com/BerriAI/litellm/pull/41472)
- 將每索引 OpenInference messages 對齊至 span 剩餘的 attribute 預算 - [PR #41498](https://github.com/BerriAI/litellm/pull/41498)
- 新增所有指標儀表板並修正過時的 dashboard_v2 gauges - [PR #41578](https://github.com/BerriAI/litellm/pull/41578)
- 為 Langfuse destinations 與 operator Langfuse exporter 啟用選用的 llm_only span 範圍 - [PR #41740](https://github.com/BerriAI/litellm/pull/41740)
- 在透傳 relay 中保留呼叫者的 traceparent 與 tracestate - [PR #41786](https://github.com/BerriAI/litellm/pull/41786)
- 以 proxy 接收時間作為回應持續時間與額外負擔的基準 - [PR #41891](https://github.com/BerriAI/litellm/pull/41891)
- 將失敗的搜尋顯示為 web_search_tool_result_error 區塊並結束該回合 - [PR #41905](https://github.com/BerriAI/litellm/pull/41905)
- 將自動中斷點範圍限定於受支援的 Claude 傳輸 - [PR #41920](https://github.com/BerriAI/litellm/pull/41920)
- 將請求 metadata 排除於成本追蹤失敗警示之外 - [PR #41950](https://github.com/BerriAI/litellm/pull/41950)
- 將 embedding 向量摘要為 Langfuse observation 輸出 - [PR #41982](https://github.com/BerriAI/litellm/pull/41982)
- 將 Responses API 輸出對映至 Langfuse generation 輸出 - [PR #41991](https://github.com/BerriAI/litellm/pull/41991)

### Secret Managers {#secret-managers}

- 在無 body 的 key regenerate 與 key alias 變更時同步 AWS Secrets Manager - [PR #41458](https://github.com/BerriAI/litellm/pull/41458)
- 在 key alias 變更時重新命名 AWS Secrets Manager secret - [PR #41468](https://github.com/BerriAI/litellm/pull/41468)
- 為 HashiCorp Vault 新增獨立的 login 與 secret 命名空間 - [PR #41539](https://github.com/BerriAI/litellm/pull/41539)

## Spend Tracking, Budgets and Rate Limiting {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 從使用者 docstrings 移除不支援的 soft_budget 參數 - [PR #36585](https://github.com/BerriAI/litellm/pull/36585)
- 以 (api_key, startTime) 為 LiteLLM_SpendLogs 建立索引 - [PR #37983](https://github.com/BerriAI/litellm/pull/37983)
- 儲存 litellm_call_id 並在 request_id 查詢中比對它 - [PR #39068](https://github.com/BerriAI/litellm/pull/39068)
- 將快取的即時音訊 token 依音訊 cache-read 費率計費 - [PR #40627](https://github.com/BerriAI/litellm/pull/40627)
- 跨部署預測 prompt-cache 成本 - [PR #40877](https://github.com/BerriAI/litellm/pull/40877)
- 對未定價的部署回報 null cost，而不是 0 - [PR #40878](https://github.com/BerriAI/litellm/pull/40878)
- 使用 orjson 將 /model/info 清單序列化一次 - [PR #41114](https://github.com/BerriAI/litellm/pull/41114)
- 將 gemini-embedding-2 依 token 計費並停止對音訊重複收費 - [PR #41157](https://github.com/BerriAI/litellm/pull/41157)
- 追蹤被部署 hook 轉換為非串流的串流 spend - [PR #41171](https://github.com/BerriAI/litellm/pull/41171)
- 依持久快取歷史估算 auto-router 基準成本 - [PR #41177](https://github.com/BerriAI/litellm/pull/41177)
- 將圖像與影片輸入 token 帶過 Responses usage 橋接層 - [PR #41237](https://github.com/BerriAI/litellm/pull/41237)
- 在驗證失敗的 spend logs 中保留用戶端 User-Agent - [PR #41291](https://github.com/BerriAI/litellm/pull/41291)
- 依其回傳的 service_tier 為原生 Responses WebSocket 回合計價 - [PR #41318](https://github.com/BerriAI/litellm/pull/41318)
- 在 router savings 中保留 Anthropic 定價調整因子 - [PR #41341](https://github.com/BerriAI/litellm/pull/41341)
- 移除會對零成本模型回傳 429 的重複 user budget hook - [PR #41345](https://github.com/BerriAI/litellm/pull/41345)
- 將 router 拒絕的請求歸因於 model group provider - [PR #41507](https://github.com/BerriAI/litellm/pull/41507)
- 以標準 token 費率為 Azure PTU spillover 請求計價 - [PR #41569](https://github.com/BerriAI/litellm/pull/41569)
- 以 400 拒絕非字串模型，並將其 spend 記錄為 unknown-model - [PR #41633](https://github.com/BerriAI/litellm/pull/41633)
- 當映射表沒有 cache-read 費率時，將 cache-read token 依輸入費率計費 - [PR #41832](https://github.com/BerriAI/litellm/pull/41832)
- 取消釘選複製到 model_info 的 cost-map 定價，並回報定價覆寫 - [PR #41843](https://github.com/BerriAI/litellm/pull/41843)
- 當提交在沒有 Redis 緩衝區的情況下失敗時，重新佇列每日 spend 列 - [PR #41878](https://github.com/BerriAI/litellm/pull/41878)
- 對 router 之外的拒絕請求，將原始用戶端模型排除在 spend logs 之外 - [PR #41943](https://github.com/BerriAI/litellm/pull/41943)
- 在尖峰時段外，以離峰費率計費 DeepSeek V4.1 Flash 與 V4 Pro - [PR #41960](https://github.com/BerriAI/litellm/pull/41960)

### Budgets {#budgets}

- 在將 spend 排入 DB 前先協調預算保留 - [PR #40310](https://github.com/BerriAI/litellm/pull/40310)
- 透過扣減重置前的 spend 來重設 budgets，而不是將列歸零 - [PR #41279](https://github.com/BerriAI/litellm/pull/41279)
- key model rpm/tpm 覆寫優先於 team model limit - [PR #41302](https://github.com/BerriAI/litellm/pull/41302)
- 在 router 備援目標上重新檢查 budget - [PR #41379](https://github.com/BerriAI/litellm/pull/41379)
- 在建立 rate-limit headers 前先計入 TPM/RPM 使用量 - [PR #41474](https://github.com/BerriAI/litellm/pull/41474)
- 在 budget 重設後重新整理 end-user cache invalidation - [PR #41488](https://github.com/BerriAI/litellm/pull/41488)
- 當 deployment 的 max_parallel_requests 位置全部被使用時，以 429 拒絕 - [PR #41555](https://github.com/BerriAI/litellm/pull/41555)
- 當共用速率限制視窗輪替時，重設同層 tpm/rpm 計數器 - [PR #41838](https://github.com/BerriAI/litellm/pull/41838)
- 將 429 重設時間以 UTC 並加上標籤顯示 - [PR #41911](https://github.com/BerriAI/litellm/pull/41911)
- 對跨複本共用的 redis 使用量強制執行 model tpm 限制 - [PR #41915](https://github.com/BerriAI/litellm/pull/41915)

### Rate limiting {#rate-limiting}

- 為批次提交新增 tpd_limit（每日 token 數） - [PR #40997](https://github.com/BerriAI/litellm/pull/40997)

## MCP Gateway {#mcp-gateway}

### MCP Gateway {#mcp-gateway-1}

- 要求 delegated OAuth 的 admission - [PR #40923](https://github.com/BerriAI/litellm/pull/40923)
- 授權 JWT OAuth 憑證持久化 - [PR #41314](https://github.com/BerriAI/litellm/pull/41314)
- 在缺少上游憑證時採取失敗關閉 - [PR #41364](https://github.com/BerriAI/litellm/pull/41364)
- 將管理員靜態 headers 計為 api_key 憑證槽位 - [PR #41514](https://github.com/BerriAI/litellm/pull/41514)
- 將健康狀態探索限制為虛擬金鑰授權 - [PR #41609](https://github.com/BerriAI/litellm/pull/41609)
- 在閘道上將 MCP 用戶端應用程式列入允許清單 - [PR #41667](https://github.com/BerriAI/litellm/pull/41667)
- 依 AI 用戶端與使用者顯示即時閘道工作階段 - [PR #41692](https://github.com/BerriAI/litellm/pull/41692)
- 在保留舊版閘道行為的同時升級 SDK2 - [PR #41718](https://github.com/BerriAI/litellm/pull/41718)
- 讓 proxy 管理員強制關閉即時 MCP 工作階段並撤銷已儲存的使用者憑證 - [PR #41725](https://github.com/BerriAI/litellm/pull/41725)

## Performance / Loadbalancing / Reliability improvements {#performance--loadbalancing--reliability-improvements}

### Auto Router and model routing {#auto-router-and-model-routing}

- 保留提供者親和性 - [PR #40228](https://github.com/BerriAI/litellm/pull/40228)
- 記錄扁平化的重試次數，並根據 attempted_retries 封頂重試 - [PR #40930](https://github.com/BerriAI/litellm/pull/40930)
- 透過 exception_type 傳遞串流中途錯誤事件，讓 content_policy_fallbacks 觸發 - [PR #40988](https://github.com/BerriAI/litellm/pull/40988)
- 當同層服務相同公開模型時，在 429 時讓團隊部署進入冷卻 - [PR #40991](https://github.com/BerriAI/litellm/pull/40991)
- 為 429 回應中的所有部署進入冷卻錯誤命名 - [PR #40995](https://github.com/BerriAI/litellm/pull/40995)
- 遵循團隊與金鑰提供者權重 - [PR #41072](https://github.com/BerriAI/litellm/pull/41072)
- 當 deployment id 等於 model_name 時，保留加權路由 - [PR #41156](https://github.com/BerriAI/litellm/pull/41156)
- 在每個複雜度層級中保留工作階段的模型選擇 - [PR #41174](https://github.com/BerriAI/litellm/pull/41174)
- 將每次請求的 routing_strategy 覆寫選取器繫結到該請求的回呼 - [PR #41178](https://github.com/BerriAI/litellm/pull/41178)
- 跨備援跳轉計算 num_retries_per_request - [PR #41191](https://github.com/BerriAI/litellm/pull/41191)
- 停止將呼叫端設定的 timeout 408s 計入部署冷卻 - [PR #41230](https://github.com/BerriAI/litellm/pull/41230)
- 新增 capability 分類器作為 Fuse 基礎 - [PR #41270](https://github.com/BerriAI/litellm/pull/41270)
- 在 capability 預測之後新增 Fuse V2 分類器 - [PR #41272](https://github.com/BerriAI/litellm/pull/41272)
- 新增每個模型的 Fast mode 切換 - [PR #41282](https://github.com/BerriAI/litellm/pull/41282)
- 停止將呼叫端提供的憑證註冊為 router 部署 - [PR #41289](https://github.com/BerriAI/litellm/pull/41289)
- 在 key/team model 驗證之前解析 router_settings.model_group_alias - [PR #41308](https://github.com/BerriAI/litellm/pull/41308)
- 將未授權的 Capability 與 Fuse v2 routers 各限制為一個 - [PR #41326](https://github.com/BerriAI/litellm/pull/41326)
- 在儲存時驗證 routing_groups，並避免無效的 DB 群組阻擋 SSO 載入 - [PR #41351](https://github.com/BerriAI/litellm/pull/41351)
- 串流影子流量並將 silent_model 分發到多個目標 - [PR #41368](https://github.com/BerriAI/litellm/pull/41368)
- 偵測代管 OpenAI 相容模型的 token 限制 - [PR #41508](https://github.com/BerriAI/litellm/pull/41508)
- 將 TypeSafe Jev 新增為複雜度 router 分類器 - [PR #41615](https://github.com/BerriAI/litellm/pull/41615)
- 新增維護中的 Fuse 模型與 harness 預設值 - [PR #41617](https://github.com/BerriAI/litellm/pull/41617)
- 允許萬用字元 allowed_features 授權 auto_router 功能 - [PR #41684](https://github.com/BerriAI/litellm/pull/41684)
- 在 SDK 原生 passthrough 路由（/v1/messages、/converse）上遵循 stream_timeout - [PR #41875](https://github.com/BerriAI/litellm/pull/41875)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 從乾淨的請求快照重試 rate-limit 備援 - [PR #40596](https://github.com/BerriAI/litellm/pull/40596)
- 每個間隔只記錄一次 timeout streak，而不是每次快取呼叫都記錄一行 - [PR #40817](https://github.com/BerriAI/litellm/pull/40817)
- 及時釋放已完成的 max-parallel slots - [PR #40843](https://github.com/BerriAI/litellm/pull/40843)
- 針對一波逾時的 LoggingWorker 回呼，只記錄一則有界摘要 - [PR #40912](https://github.com/BerriAI/litellm/pull/40912)
- 當 request_correlation_in_logs 關閉時，略過 correlation contextvar 標記 - [PR #41054](https://github.com/BerriAI/litellm/pull/41054)
- 每次請求只載入一次團隊成員資格，並在 L1 命中時略過 prisma - [PR #41102](https://github.com/BerriAI/litellm/pull/41102)
- 在 /utils/token_counter 請求之間快取自訂 HuggingFace tokenizer - [PR #41216](https://github.com/BerriAI/litellm/pull/41216)
- 在 writer_unavailable 過時期間，讓 access-group 原始 SQL 寫入保留在 writer 上 - [PR #41283](https://github.com/BerriAI/litellm/pull/41283)
- 將 fastapi 與 tiktoken BPE 匯入延後，移出 import litellm - [PR #41585](https://github.com/BerriAI/litellm/pull/41585)
- 新增 litellm-http 用戶端連線池並注入 OCR 路由 - [PR #41897](https://github.com/BerriAI/litellm/pull/41897)
- 拒絕在執行階段啟動後 fork 出來的程序中的原生路由 - [PR #41987](https://github.com/BerriAI/litellm/pull/41987)

### 按負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

原始 rc.1 附註中對客戶可見的 PR：**366**，包括在 stable 之前回復的兩個使用量彙總 PR。上方列出的 release-line 新增項目與此彙總分開

- 管理端點 / UI：90
- 模型與提供者：86
- AI 整合：59
- LLM API 端點：51
- 支出 / 預算 / 速率限制：36
- 效能 / 可靠性：35
- MCP：9

## 新貢獻者 {#new-contributors}

- [@AaronHowell](https://github.com/AaronHowell)
- [@abhirup7](https://github.com/abhirup7)
- [@adssoccer1](https://github.com/adssoccer1)
- [@clonylu](https://github.com/clonylu)
- [@elifozdamar](https://github.com/elifozdamar)
- [@etiennechabert](https://github.com/etiennechabert)
- [@gaurav-pandey-zocdoc](https://github.com/gaurav-pandey-zocdoc)
- [@HUAHAODIA](https://github.com/HUAHAODIA)
- [@IToSSc](https://github.com/IToSSc)
- [@joshgarnett](https://github.com/joshgarnett)
- [@Lee-Si-Yoon](https://github.com/Lee-Si-Yoon)
- [@max-sixty](https://github.com/max-sixty)
- [@MvdB](https://github.com/MvdB)
- [@rad-p44](https://github.com/rad-p44)
- [@runjivu](https://github.com/runjivu)
- [@zachbernstein-sdx](https://github.com/zachbernstein-sdx)
- [@zoroyihan7](https://github.com/zoroyihan7)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.102.0...v1.103.0
