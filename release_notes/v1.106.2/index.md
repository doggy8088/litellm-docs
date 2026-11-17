---
title: "LiteLLM v1.106.2 修正失敗請求的支出、批次成本與 Bedrock token 計數"
description: "為提供者已計費的逾時與取消請求定價，讓批次支出在失敗後保留，為 Bedrock 設定檔定價，並在執行階段 404 時備援到 Bedrock Mantle。"
slug: "v1-106-2"
date: 2026-10-21T10:50:35
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
docker.litellm.ai/berriai/litellm:1.106.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.106.2` 是建立在 [`v1.106.1`](/release_notes/v1.106.1/v1-106-1) 之上的修補版本。它將逾時、取消與重試請求的支出修正、批次成本、定價與翻譯修正，以及執行階段 404 時的 Bedrock Mantle 備援，從 `main` 回移到 `stable/1.106.x`，並將 aiohttp 更新至 3.14.5。沒有新的資料庫 migration。`v1.106.2` 標籤指向 [`49943cd`](https://github.com/BerriAI/litellm/commit/49943cd52ea46aacf8db2e5cb2b890d580fe9bb4)

## 升級說明 {#upgrade-notes}

- **不支援的推理強度回傳 400**：使用 `reasoning_effort: none` 的 Azure `gpt-6-astra` 與使用 `minimal` 的 `gpt-5.3-codex` 會被代理程式以 400 拒絕，而不是傳送到上游。設定 `drop_params: true` 可丟棄該值，或傳送模型支援的等級 - [PR #43935](https://github.com/BerriAI/litellm/pull/43935)
- **OpenRouter 資料列已離開隨附的成本對照表**：在 `LITELLM_LOCAL_MODEL_COST_MAP=True` 時，`openrouter/*` 模型的成本與模型資訊查詢現在會引發 `ModelNotMappedError`，與代理程式預設載入的遠端成本對照表相同。請在這些部署的 `model_info` 中設定 `input_cost_per_token`、`output_cost_per_token` 以及您所依賴的任何上下文視窗 - [PR #45665](https://github.com/BerriAI/litellm/pull/45665)
- **計費的失敗會計入預算**：在抵達提供者後逾時的請求，以及帶有 `cancel_on_disconnect: true` 的用戶端取消，現在會記錄其估計輸入成本，並從金鑰、團隊與使用者預算中扣除。重試的請求會依每次計費嘗試各扣除一次 - [PR #47435](https://github.com/BerriAI/litellm/pull/47435)、[PR #47416](https://github.com/BerriAI/litellm/pull/47416)
- **請求主體中的 `base_model` 不再設定價格**：它會像其他用戶端定價欄位一樣被丟棄，除非金鑰或團隊帶有 `allow_client_pricing_override` - [PR #47639](https://github.com/BerriAI/litellm/pull/47639)
- **Decisions 記錄整個請求**：`/v1/systemone` 與 `/v1/decisions` 記錄的使用者訊息現在是完整的請求物件，例如 `{"state": ..., "questions": ...}` 或 `{"input": ..., "questions": ...}`，而不是只有 state 或 input。請更新所有解析該 `content` 的項目 - [PR #47183](https://github.com/BerriAI/litellm/pull/47183)

## 重點摘要 {#key-highlights}

- **失敗請求的支出**：在抵達提供者後逾時的請求、用戶端取消與每次計費的重試嘗試，會依其提示定價而非記錄 $0，且溢出的 Azure PTU 請求會記錄其支出背後的費率
- **批次成本、定價與 `safeguards`**：已完成的批次在格式錯誤的結果與暫時會計失敗後仍保留其支出，Bedrock 推論設定檔已定價，且帶有 `safeguards` 的 `/v1/messages` 請求回傳 200
- **執行階段 404 時的 Bedrock Claude 計數**：當 Bedrock Runtime 對 Claude 模型回應 404 時，`/v1/messages/count_tokens` 現在會備援到 Bedrock Mantle，如同先前對 400 的處理

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 功能 {#features}

- **成本對照表**
    - 隨附的成本對照表現在與 `main` 一致。它移除了 `openrouter/*` 資料列與 11 個 `github_copilot` 資料列，重新定價 `azure/gpt-4o-mini` 系列，修正 Azure EU `gpt-6-astra` 價格，並將 19 個區域 Azure codex 與 pro 資料列從 `chat` 模式移至 `responses` 模式。載入遠端成本對照表（預設）的代理程式已經能看到這些值 - [PR #45665](https://github.com/BerriAI/litellm/pull/45665)、[PR #47736](https://github.com/BerriAI/litellm/pull/47736)

#### 錯誤 {#bugs}

- **[Anthropic](../../docs/providers/anthropic)**
    - 當用戶端未傳送 `anthropic-beta` 標頭時，帶有 `safeguards` 的 `/v1/messages` 請求會以 400 `safeguards: Extra inputs are not permitted` 失敗，且 Azure AI Foundry 上的 Claude Code 自動模式會退回其用戶端分類器。代理程式現在會在 Anthropic、Azure AI 與 Databricks 部署上自行加入 `dangerous-tool-use-2026-09-03` beta，且以 `additional_drop_params` 移除的參數也會一併丟棄其 beta - [PR #43955](https://github.com/BerriAI/litellm/pull/43955)
    - 在 `LITELLM_RUST=true` 時，帶有 `safeguards` 的 Anthropic `/v1/messages` 請求會取得相同的 beta，且明確的 `"safeguards": null` 會被丟棄 - [PR #46102](https://github.com/BerriAI/litellm/pull/46102)
    - 帶有 `location: tool_config` 的快取控制點，現在會將其斷點放在 Anthropic、Bedrock Invoke、Vertex AI 與 Azure AI 上 Claude 的最後一個工具上，適用於 `/v1/chat/completions` 與 `/v1/messages`。Chat 請求過去會以「欄位不被允許」的 400 失敗，且 `/v1/messages` 傳送工具時沒有斷點。OpenAI 部署不再收到此設定，而 `litellm_proxy/` 部署仍會將其轉送到下游代理程式 - [PR #47394](https://github.com/BerriAI/litellm/pull/47394)、[PR #47570](https://github.com/BerriAI/litellm/pull/47570)
- **Databricks**
    - `json_schema` 回應格式會保留用戶端傳送的 `#/$defs` 參照，因此巢狀型別不再於非 Claude 模型上以 400 失敗。傳入 Pydantic 類別的 SDK 呼叫者會傳送帶有 `additionalProperties: false` 的嚴格 schema，與其他 OpenAI 相容提供者相同 - [PR #45659](https://github.com/BerriAI/litellm/pull/45659)
    - 非 Claude 模型會取得單一純文字區塊作為字串，因此 JSON 模式不再於 `model_info.mode: responses` 部署上以要求 json 一詞的 400 失敗 - [PR #45686](https://github.com/BerriAI/litellm/pull/45686)
- **OpenAI 與 Azure**
    - 推理等級會在 chat completions 與 Responses API 上對照模型的成本對照表資料列檢查。使用 `reasoning_effort: none` 的 `gpt-6.1-sol` 在開啟 `drop_params` 時會被丟棄，而不是以 OpenAI 400 回傳，否則會收到代理程式指出該等級的 400。Azure `gpt-6-astra` 以相同方式拒絕 `none`，`gpt-5.3-codex` 拒絕 `minimal` - [PR #43935](https://github.com/BerriAI/litellm/pull/43935)

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤 {#bugs-1}

- **Token 計數**
    - Bedrock Runtime `CountTokens` 對無法計數的 Claude 模型會回應 404 以及 400，而先前只有 400 會備援到 Bedrock Mantle，因此那些 `/v1/messages/count_tokens` 請求會退回本機估計。404 現在也會備援到 Mantle - [PR #46430](https://github.com/BerriAI/litellm/pull/46430)
- **Decisions API**
    - `/v1/systemone` 與 `/v1/decisions` 只記錄 `state` 或 `input`，從未記錄 `questions`，因此 S3、Langfuse 與支出記錄只保存答案，卻沒有問了什麼的記錄。它們現在會在驗證之前記錄呼叫者傳送的整個請求，因此以 400 拒絕的請求仍會被記錄。傳入 `litellm.decisions()` 的原始非 UTF-8 位元組仍會收到 400，並以 base64 記錄 - [PR #47183](https://github.com/BerriAI/litellm/pull/47183)、[PR #47564](https://github.com/BerriAI/litellm/pull/47564)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

#### 功能 {#features-1}

- **Google Search grounding 免費層級**
    - 新的選用設定 `litellm_settings.apply_search_free_tier`（預設 `false`，需要 Redis）會套用 Google 的免費 Google Search grounding 額度，因此額度內的 grounding 查詢以 $0 記錄。Gemini API 與 Vertex AI 請求各自使用自己的額度，快取命中不計入。在此版本中，每個資料列的 `spend` 都正確，而 `metadata.cost_breakdown.discount_amount` 在部分折扣資料列上可能顯示 0.0 - [PR #47494](https://github.com/BerriAI/litellm/pull/47494)、[PR #47646](https://github.com/BerriAI/litellm/pull/47646)

#### 錯誤 {#bugs-2}

- **提供者已計費的失敗請求**
    - 在抵達提供者後逾時的請求，雖然提供者對提示計費，卻以 $0 記錄。其支出資料列現在以輸入費率為估計的提示 token 定價，並從金鑰、團隊與使用者預算中扣除。從未抵達提供者的連線逾時維持 $0 - [PR #47435](https://github.com/BerriAI/litellm/pull/47435)
    - 在 `general_settings.cancel_on_disconnect: true` 時，於請求中途掛斷的呼叫者現在會得到一個 499 資料列，帶有其估計的提示 token 與輸入價格。提供者自身的 HTTP 499，以及呼叫已完成並記錄後的掛斷，維持 $0 - [PR #47436](https://github.com/BerriAI/litellm/pull/47436)、[PR #47652](https://github.com/BerriAI/litellm/pull/47652)
    - 代理程式自身引發的失敗（例如 401，或在呼叫提供者之前掛斷）不再被標記為已抵達提供者，因此維持 $0，且其 OpenTelemetry 失敗 span 不再帶有 `litellm.preprocessing.duration_ms` - [PR #47456](https://github.com/BerriAI/litellm/pull/47456)
    - 計費失敗資料列的定價方式與成功資料列相同：部署自身的 `input_cost_per_token`、名稱不在成本對照表中的 Azure 部署使用其 `model_info.base_model`，以及有設定時的 200k 以上輸入層級 - [PR #47437](https://github.com/BerriAI/litellm/pull/47437)、[PR #47647](https://github.com/BerriAI/litellm/pull/47647)
    - 在 `router_settings.num_retries` 時，每次先前同樣逾時的嘗試都是個別計費的提供者呼叫。每一次現在都有自己的支出資料列（`<request_id>-attempt-<n>`），以提供服務的模型定價，包括備援到另一個模型群組之後 - [PR #47490](https://github.com/BerriAI/litellm/pull/47490)、[PR #47416](https://github.com/BerriAI/litellm/pull/47416)、[PR #47648](https://github.com/BerriAI/litellm/pull/47648)
    - 串流的 `/v1/responses` 請求，或透過 Responses API 提供服務的串流 `/v1/messages` 請求（OpenAI 與 Azure 模型的預設路由），在用戶端於輸出開始後關閉時不會寫入任何支出。它現在會依部分輸出計費，如同 `/v1/chat/completions` 原本的做法。在任何輸出之前中斷連線仍不計費 - [PR #47611](https://github.com/BerriAI/litellm/pull/47611)
- **批次**
    - 模型清單為空的全部失敗批次，在成本對帳期間不再重複出現 `list index out of range`。它會記錄一個零成本事件並停止重試 - [PR #47155](https://github.com/BerriAI/litellm/pull/47155)
    - 輸出中同時帶有格式錯誤回應封套的批次，其有效結果現在會被計費一次而非完全不計費，且最終中繼資料寫入失敗不再讓已處理的批次停留在過時狀態 - [PR #47184](https://github.com/BerriAI/litellm/pull/47184)
    - 較新的已完成批次不再被較舊的可重試批次積壓拖住，較舊的已完成批次保持可復原，而不是連同其支出一起被淘汰，且 404 只有在指名該批次自身資源時才淘汰該批次 - [PR #47190](https://github.com/BerriAI/litellm/pull/47190)
    - 在任何支出變更之前會計失敗的已完成批次，會在後續的處理中重試並計費一次，且提供者、部署與標籤預算在多次重試中只計入一次。無法分類的記錄失敗會讓批次保持已認領狀態而不是重試，以避免重複收費 - [PR #47625](https://github.com/BerriAI/litellm/pull/47625)
    - 位於區域位置的 Vertex AI 批次先前以全球費率定價，約比 Google 的計費低 10%。它們現在會獲得線上請求已有的區域端點加成 - [PR #47466](https://github.com/BerriAI/litellm/pull/47466)
- **定價**
    - Bedrock 推論設定檔部署可能記錄 $0 或丟棄費用，例如只設定自訂輸入價格時輸出支出為 $0。設定檔部署現在以設定檔的目錄費率定價，您設定的每個自訂價格在其自身欄位上優先，且 `register_model` 自訂費率也適用於帶區域前綴的設定檔 - [PR #47419](https://github.com/BerriAI/litellm/pull/47419)
    - 當模型沒有音訊費率時，Gemini 提示音訊 token 計費 $0，且影像與影片提示 token 忽略了 200k 以上層級。它們現在以解析後的輸入費率計費，因此在 `vertex_ai/gemini-3.1-pro-preview` 上的一個 816k token 影片請求記錄約 $3.35，而非 $0.118 - [PR #47373](https://github.com/BerriAI/litellm/pull/47373)
    - Vertex AI `text-embedding-005` 與 `text-multilingual-embedding-002` 改依 Google 的 `billableCharacterCount` 逐字元計費，而非逐 token，且每個 Vertex 文字嵌入回應現在都帶有 `usage.prompt_tokens_details.character_count` - [PR #47460](https://github.com/BerriAI/litellm/pull/47460)
    - 請求主體中的 `base_model` 現在會像其他用戶端定價欄位一樣被丟棄，除非金鑰或團隊帶有 `allow_client_pricing_override`，因此它不再變更呼叫者支出資料列的價格。multipart 請求（例如音訊轉錄）若其 `metadata` 表單欄位帶有單獨的代理字元，例如 `"\ud800"`，現在會收到與 JSON 主體相同的 400，而不是遺失其支出記錄資料列與標籤支出 - [PR #47639](https://github.com/BerriAI/litellm/pull/47639)
- **支出記錄中繼資料**
    - 帶有自身 `input_cost_per_token` 與 `output_cost_per_token`（包括 $0）的部署，現在會在支出記錄中繼資料與回呼的 `model_map_information` 中顯示那些費率，而非目錄費率。`model_map_key` 維持不變 - [PR #47182](https://github.com/BerriAI/litellm/pull/47182)
    - 在 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION=True` 時，溢出到隨用隨付的 Azure PTU 請求，現在會在 `model_map_information` 中記錄隨用隨付費率，無論有沒有 `base_model`，因此資料列中的費率能解釋其支出。一般 PTU 請求維持其固定定價 - [PR #47567](https://github.com/BerriAI/litellm/pull/47567)、[PR #47655](https://github.com/BerriAI/litellm/pull/47655)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-2}

- 新的 `timeout_by_service_tier` 與 `stream_timeout_by_service_tier` 部署設定，讓帶有相符 `service_tier`（例如 `flex`）的請求有自己的逾時。用戶端以 `timeout` 或 `x-litellm-timeout` 傳送的逾時仍然優先，其他請求保留部署的 `timeout` - [PR #47406](https://github.com/BerriAI/litellm/pull/47406)

#### 錯誤 {#bugs-3}

- `cost-based-routing` 先前以每個部署的 `litellm_params.model` 定價，因此名稱不在成本對照表中的 Azure 部署會以每 token $10 的未對應預設值評分，並在每次挑選中落敗。它現在會先透過 `model_info.base_model` 定價，與支出記錄相同 - [PR #47617](https://github.com/BerriAI/litellm/pull/47617)
- 在 Postgres 重新啟動期間執行的支出記錄排清會丟棄其整個批次，因此那些請求從未取得 `LiteLLM_SpendLogs` 資料列。該批次現在會重新排隊，並在下一次嘗試時寫入 - [PR #47571](https://github.com/BerriAI/litellm/pull/47571)
- 原生 OpenAI 與 Azure `/v1/responses` 請求不再各自強制立即排清支出記錄，因此其資料列會隨下一次批次寫入落地。chat completions 橋接上的請求保留立即排清，因此 `previous_response_id` 仍能找到它們 - [PR #47614](https://github.com/BerriAI/litellm/pull/47614)

所有這些修正、aiohttp 3.14.5 更新與版本提升都在 [PR #47742](https://github.com/BerriAI/litellm/pull/47742)、[PR #47736](https://github.com/BerriAI/litellm/pull/47736) 與 [PR #47695](https://github.com/BerriAI/litellm/pull/47695) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- 支出 / 預算 / 速率限制：23
- 模型與提供者：8
- 效能：4
- LLM API 端點：3
- 記錄：1

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.1...v1.106.2
