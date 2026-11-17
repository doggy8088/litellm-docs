---
title: "LiteLLM v1.103.7 修復失敗請求的支出、批次成本與 Bedrock token 計數"
description: "為提供者已計費的逾時與取消請求定價、在失敗時保留批次支出、為 claude-haiku-5-5 與 Bedrock 設定檔定價，並在 Mantle 上計算 Bedrock Claude token。"
slug: "v1-103-7"
date: 2026-10-21T09:40:05
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
docker.litellm.ai/berriai/litellm:1.103.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.7
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.7`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.7) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.7` 是建立在 [`v1.103.6`](/release_notes/v1.103.6/v1-103-6) 之上的修補版本。它將逾時、取消與重試請求的支出修復、批次成本、定價與轉譯修復，以及 Bedrock Mantle token 計數備援，從 `main` 回移到 `stable/1.103.x`，並將 aiohttp 更新至 3.14.5。沒有新的資料庫遷移。`v1.103.7` 標籤指向 [`30f6910`](https://github.com/BerriAI/litellm/commit/30f6910f84cd74049ada86ddde854b973fe6b6d0)

## 升級注意事項 {#upgrade-notes}

- **不支援的推理強度會回傳 400**：帶有 `reasoning_effort: none` 的 Azure `gpt-6-astra` 以及帶有 `minimal` 的 `gpt-5.3-codex` 會被 proxy 以 400 拒絕，而不是送往上游。設定 `drop_params: true` 以丟棄該值，或送出模型支援的等級 - [PR #43935](https://github.com/BerriAI/litellm/pull/43935)
- **自訂定價部署上的服務層級費率**：擁有自有或為零的 `input_cost_per_token` 與 `output_cost_per_token` 的部署，現在會以成本對照表的層級費率，對其未設定的每個層級費率收取 `service_tier` priority 與 flex 請求的費用。在部署上設定 `input_cost_per_token_priority`、`output_cost_per_token_priority` 以及 `_flex` 變體，以保留您自己的層級價格 - [PR #43890](https://github.com/BerriAI/litellm/pull/43890)
- **OpenRouter 列已離開內附的成本對照表**：在 `LITELLM_LOCAL_MODEL_COST_MAP=True` 下，`openrouter/*` 模型的成本與模型資訊查詢現在會引發 `ModelNotMappedError`，如同 proxy 預設載入的遠端成本對照表一樣。在這些部署的 `model_info` 中設定 `input_cost_per_token`、`output_cost_per_token` 以及您依賴的任何上下文視窗 - [PR #45665](https://github.com/BerriAI/litellm/pull/45665)
- **計費的失敗會計入預算**：抵達提供者後逾時的請求，以及帶有 `cancel_on_disconnect: true` 的用戶端取消，現在會記錄其預估輸入成本並從金鑰、團隊與使用者預算中扣除。重試的請求會按每次計費的嘗試扣除一次 - [PR #47435](https://github.com/BerriAI/litellm/pull/47435)、[PR #47416](https://github.com/BerriAI/litellm/pull/47416)
- **提供者預算會計入每個 API 介面**：提供者、部署與標籤預算現在也會計算 `/v1/responses`、`/v1/messages`、embeddings 與其他非 chat 支出，因此在這類流量上會更快耗盡 - [PR #38172](https://github.com/BerriAI/litellm/pull/38172)
- **請求主體中的 `base_model` 不再設定價格**：它會像其他用戶端定價欄位一樣被丟棄，除非金鑰或團隊擁有 `allow_client_pricing_override` - [PR #47639](https://github.com/BerriAI/litellm/pull/47639)
- **被截斷的橋接 Responses 會回報 `incomplete`**：在沒有原生 Responses API 的提供者上，被截斷的 `/v1/responses` 輸出現在會回傳 `status: "incomplete"`，且串流以 `response.incomplete` 結束而不是 `response.completed`，如同原生 OpenAI Responses API 一樣 - [PR #44460](https://github.com/BerriAI/litellm/pull/44460)

## 重點摘要 {#key-highlights}

- **失敗請求的支出**：抵達提供者後逾時的請求、用戶端取消，以及每次計費的重試嘗試，都會依其提示定價而不是記錄 $0，而溢出的 Azure PTU 請求會記錄其支出背後的費率
- **批次成本、定價與 `safeguards`**：已完成的批次在結果格式錯誤與暫時性記帳失敗時仍保留其支出，`claude-haiku-5-5` 與 Bedrock 推論設定檔已定價，且帶有 `safeguards` 的 `/v1/messages` 請求會回傳 200
- **Bedrock Claude token 計數**：當 Bedrock Runtime 無法計算 Claude 模型時，`/v1/messages/count_tokens` 會備援至 Bedrock Mantle，而不是以偏低的本地估計回答

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 功能 {#features}

- **成本對照表**
    - 內附的成本對照表現在與 `main` 一致。它移除了 `openrouter/*` 列與 11 列 `github_copilot`、重新定價 `azure/gpt-4o-mini` 家族、修正 Azure EU `gpt-6-astra` 價格，並將 19 列區域 Azure codex 與 pro 從 `chat` 模式移至 `responses` 模式。載入遠端成本對照表的 proxy（預設行為）已經能看到這些值 - [PR #45665](https://github.com/BerriAI/litellm/pull/45665)、[PR #47732](https://github.com/BerriAI/litellm/pull/47732)

#### 錯誤修正 {#bugs}

- **[Anthropic](../../docs/providers/anthropic)**
    - 當用戶端未送出 `anthropic-beta` 標頭時，帶有 `safeguards` 的 `/v1/messages` 請求會以 400 `safeguards: Extra inputs are not permitted` 失敗，且 Azure AI Foundry 上的 Claude Code 自動模式會備援至其用戶端分類器。proxy 現在會在 Anthropic 與 Azure AI 部署上自行加入 `dangerous-tool-use-2026-09-03` beta，而以 `additional_drop_params` 移除的參數也會一併丟棄其 beta - [PR #43955](https://github.com/BerriAI/litellm/pull/43955)
    - 帶有 `location: tool_config` 的快取控制點現在會將其斷點放在 `/v1/chat/completions` 與 `/v1/messages` 上最後一個工具處，適用於 Anthropic、Bedrock Invoke、Vertex AI 與 Azure AI 上的 Claude。Chat 請求過去會以表示該欄位不被允許的 400 失敗，而 `/v1/messages` 會在沒有斷點的情況下送出工具。OpenAI 部署不再收到此設定，而 `litellm_proxy/` 部署仍會將其轉送至下游 proxy - [PR #47394](https://github.com/BerriAI/litellm/pull/47394)、[PR #47570](https://github.com/BerriAI/litellm/pull/47570)
- **Claude Haiku 5.5**
    - `claude-haiku-5-5` 已定價，因此其呼叫會回報成本而不是 $0，包含 Bedrock、Bedrock Mantle、Azure 與 Vertex AI 上超過 100k token 的費率，以及超過 100k 的批次費率。它的列設定了 `supports_forced_tool_use: true` 與 `thinking_always_on: false` - [PR #45108](https://github.com/BerriAI/litellm/pull/45108)、[PR #45151](https://github.com/BerriAI/litellm/pull/45151)
- **Databricks**
    - `json_schema` 回應格式會保留用戶端送出的 `#/$defs` 參照，因此巢狀類型不再於非 Claude 模型上以 400 失敗。傳入 Pydantic 類別的 SDK 呼叫端會送出帶有 `additionalProperties: false` 的嚴格 schema，如同其他與 OpenAI 相容的提供者 - [PR #45659](https://github.com/BerriAI/litellm/pull/45659)
    - 非 Claude 模型會收到以字串表示的單一純文字區塊，因此 JSON 模式不再於 `model_info.mode: responses` 部署上以要求 json 字樣的 400 失敗 - [PR #45686](https://github.com/BerriAI/litellm/pull/45686)
- **OpenAI and Azure**
    - 推理等級會在 chat completions 與 Responses API 上對照模型的成本對照表列進行檢查。帶有 `reasoning_effort: none` 的 `gpt-6.1-sol` 在 `drop_params` 開啟時會被丟棄，而不是以 OpenAI 400 回傳，否則會從 proxy 收到指明該等級的 400。Azure `gpt-6-astra` 拒絕 `none`、`gpt-5.3-codex` 拒絕 `minimal`，方式相同 - [PR #43935](https://github.com/BerriAI/litellm/pull/43935)

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bugs-1}

- **Token 計數**
    - Bedrock Runtime `CountTokens` 會以 400 或 404 拒絕較新的 Claude 模型（例如 Claude Opus 4.8、5 與 5.5），因此 `/v1/messages/count_tokens` 會以遠低於計費輸入的本地估計回答。仍會先嘗試 Bedrock Runtime，然後 Claude 模型會以相同的 AWS 憑證備援至 Bedrock Mantle Anthropic `count_tokens` 端點。非 Claude 模型永遠不會呼叫 Mantle，而 Mantle 失敗時會保留先前的本地備援 - [PR #45317](https://github.com/BerriAI/litellm/pull/45317)、[PR #46430](https://github.com/BerriAI/litellm/pull/46430)
- **[Responses API](../../docs/response_api) bridge**
    - 在沒有原生 Responses API 的提供者上，`/v1/responses` 呼叫會將被截斷的輸出回報為 `completed`。被截斷的回應現在在觸及上限時帶有 `status: "incomplete"` 與 `incomplete_details.reason: max_output_tokens`，其串流以 `response.incomplete` 結束，且回應會回顯請求的 `temperature`、`top_p` 與 `max_output_tokens`。Bedrock JSON 模式保留 `length` 完成原因 - [PR #44460](https://github.com/BerriAI/litellm/pull/44460)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

#### 功能 {#features-1}

- **Google Search grounding 免費層級**
    - 新的選擇性啟用 `litellm_settings.apply_search_free_tier`（預設 `false`，需要 Redis）會套用 Google 的免費 Google Search grounding 額度，因此額度內的 grounding 查詢會以 $0 記錄。Gemini API 與 Vertex AI 請求各自使用自己的額度，且快取命中不計入。在此版本中，每一列的 `spend` 都是正確的，而 `metadata.cost_breakdown.discount_amount` 在某些折扣列上可能顯示為 0.0 - [PR #47494](https://github.com/BerriAI/litellm/pull/47494)、[PR #47646](https://github.com/BerriAI/litellm/pull/47646)

#### 錯誤修正 {#bugs-2}

- **提供者已計費的失敗請求**
    - 抵達提供者後逾時的請求過去會以 $0 記錄，儘管提供者已對提示計費。它的支出列現在會以輸入費率為預估的提示 token 定價，並從金鑰、團隊與使用者預算中扣除。從未抵達提供者的連線逾時維持 $0 - [PR #47435](https://github.com/BerriAI/litellm/pull/47435)
    - 在 `general_settings.cancel_on_disconnect: true` 下，於請求中途掛斷的呼叫端現在會得到一列 499，帶有其預估的提示 token 與其輸入價格。提供者自身的 HTTP 499，以及呼叫已完成並記錄後的掛斷，維持 $0 - [PR #47436](https://github.com/BerriAI/litellm/pull/47436)、[PR #47652](https://github.com/BerriAI/litellm/pull/47652)
    - proxy 自行引發的失敗（例如 401，或在呼叫提供者之前掛斷）不再被標記為已抵達提供者，因此維持 $0，且其 OpenTelemetry 失敗 span 不再帶有 `litellm.preprocessing.duration_ms` - [PR #47456](https://github.com/BerriAI/litellm/pull/47456)
    - 計費失敗列的定價方式與成功列相同：部署自身的 `input_cost_per_token`、名稱不在成本對照表中的 Azure 部署的 `model_info.base_model`，以及其在設定時超過 200k 的輸入層級 - [PR #47437](https://github.com/BerriAI/litellm/pull/47437)、[PR #47647](https://github.com/BerriAI/litellm/pull/47647)
    - 在 `router_settings.num_retries` 下，每次先前同樣逾時的嘗試都是一次個別計費的提供者呼叫。每一次現在都有自己的支出列（`<request_id>-attempt-<n>`），以提供服務的模型定價，包含備援至另一個模型群組之後 - [PR #47490](https://github.com/BerriAI/litellm/pull/47490)、[PR #47416](https://github.com/BerriAI/litellm/pull/47416)、[PR #47648](https://github.com/BerriAI/litellm/pull/47648)
    - 串流的 `/v1/responses` 請求，或透過 Responses API 提供服務的串流 `/v1/messages` 請求（OpenAI 與 Azure 模型的預設路由），在用戶端於輸出開始後關閉時，過去不會寫入任何支出。它現在會針對部分輸出計費，如同 `/v1/chat/completions` 一直以來的作法。在任何輸出之前中斷連線仍不計費 - [PR #47611](https://github.com/BerriAI/litellm/pull/47611)
- **批次**
    - 模型清單為空且全部失敗的批次，在成本對帳期間不再重複出現 `list index out of range`。它會記錄一個零成本事件並停止重試 - [PR #47155](https://github.com/BerriAI/litellm/pull/47155)
    - 輸出中同時含有格式錯誤回應封套的批次，其有效結果現在會被計費一次而不是完全不計費，且最終中繼資料寫入失敗不再讓已處理的批次停留在過時狀態 - [PR #47184](https://github.com/BerriAI/litellm/pull/47184)
    - 較新的已完成批次不再被較舊的可重試批次積壓所拖住，較舊的已完成批次保持可復原，而不是連同其支出一起被淘汰，且 404 只有在指名該批次自身資源時才會淘汰該批次 - [PR #47190](https://github.com/BerriAI/litellm/pull/47190)
    - 在任何支出變更之前記帳就失敗的已完成批次，會在後續的處理中重試並計費一次，且提供者、部署與標籤預算在多次重試間只計算它一次。無法分類的記錄失敗會讓批次保持已被認領，而不是重試，以避免重複收費 - [PR #47625](https://github.com/BerriAI/litellm/pull/47625)
- **預算**
    - 提供者預算過去不計算 `/v1/responses` 或 `/v1/messages` 支出，同樣的缺口也跳過了部署與標籤預算。它們現在會計入每個 API 介面的支出 - [PR #38172](https://github.com/BerriAI/litellm/pull/38172)
- **定價**
    - Bedrock 推論設定檔部署過去可能記錄 $0 或丟失費用，例如只設定了自訂輸入價格時輸出支出為 $0。設定檔部署現在以設定檔的目錄費率定價，您設定的每個自訂價格在其自身欄位上優先，且 `register_model` 自訂費率也適用於帶有區域前綴的設定檔 - [PR #47419](https://github.com/BerriAI/litellm/pull/47419)
    - 在帶有自訂標準費率的部署上，`service_tier` priority 與 flex 請求會以成本對照表的層級費率，對部署未設定的每個層級費率計費，而不是自訂標準費率 - [PR #43890](https://github.com/BerriAI/litellm/pull/43890)
    - 當模型沒有音訊費率時，Gemini 提示音訊 token 會以 $0 計費，且圖片與影片提示 token 忽略了超過 200k 的層級。它們現在以解析出的輸入費率計費，因此 `vertex_ai/gemini-3.1-pro-preview` 上一個 816k token 的影片請求會記錄約 $3.35，而不是 $0.118 - [PR #47373](https://github.com/BerriAI/litellm/pull/47373)
    - Vertex AI `text-embedding-005` 與 `text-multilingual-embedding-002` 改以 Google 的 `billableCharacterCount` 按字元計費，而不是按 token，且每個 Vertex 文字 embedding 回應現在都帶有 `usage.prompt_tokens_details.character_count` - [PR #47460](https://github.com/BerriAI/litellm/pull/47460)
    - 請求主體中的 `base_model` 現在會像其他用戶端定價欄位一樣被丟棄，除非金鑰或團隊擁有 `allow_client_pricing_override`，因此它不再變更呼叫端支出列的價格。`metadata` 表單欄位帶有孤立代理字元（例如 `"\ud800"`）的 multipart 請求（例如音訊轉錄），現在會得到與 JSON 主體相同的 400，而不是丟失其支出記錄列與標籤支出 - [PR #47639](https://github.com/BerriAI/litellm/pull/47639)
- **支出記錄中繼資料**
    - 擁有自有 `input_cost_per_token` 與 `output_cost_per_token`（包含 $0）的部署，現在會在支出記錄中繼資料與回呼的 `model_map_information` 中顯示那些費率，而不是目錄費率。`model_map_key` 維持不變 - [PR #47182](https://github.com/BerriAI/litellm/pull/47182)
    - 在 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION=True` 下，溢出至隨用隨付的 Azure PTU 請求，現在會在 `model_map_information` 中記錄隨用隨付費率，無論有沒有 `base_model`，因此該列中的費率能解釋其支出。一般 PTU 請求保留其固定定價 - [PR #47567](https://github.com/BerriAI/litellm/pull/47567)、[PR #47655](https://github.com/BerriAI/litellm/pull/47655)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-2}

- 新的 `timeout_by_service_tier` 與 `stream_timeout_by_service_tier` 部署設定，讓帶有相符 `service_tier`（例如 `flex`）的請求擁有自己的逾時。用戶端以 `timeout` 或 `x-litellm-timeout` 送出的逾時仍然優先，其他請求則保留部署的 `timeout` - [PR #47406](https://github.com/BerriAI/litellm/pull/47406)

#### 錯誤修正 {#bugs-3}

- `cost-based-routing` 過去以每個部署的 `litellm_params.model` 定價，因此名稱不在成本對照表中的 Azure 部署會以每個 token $10 的未對應預設值計分，並在每次挑選中落敗。它現在會先透過 `model_info.base_model` 定價，如同支出記錄的作法 - [PR #47617](https://github.com/BerriAI/litellm/pull/47617)
- 在 Postgres 重新啟動期間執行的支出記錄排清會丟棄其整個批次，因此那些請求永遠不會得到 `LiteLLM_SpendLogs` 列。該批次現在會重新排入佇列，並在下一次嘗試時寫入 - [PR #47571](https://github.com/BerriAI/litellm/pull/47571)
- 原生 OpenAI 與 Azure `/v1/responses` 請求不再各自強制立即排清支出記錄，因此它們的列會隨下一次批次寫入落地。chat completions 橋接上的請求保留立即排清，因此 `previous_response_id` 仍能找到它們 - [PR #47614](https://github.com/BerriAI/litellm/pull/47614)

所有這些修復、aiohttp 3.14.5 更新與版本提升，於 [PR #47743](https://github.com/BerriAI/litellm/pull/47743)、[PR #47763](https://github.com/BerriAI/litellm/pull/47763) 與 [PR #47732](https://github.com/BerriAI/litellm/pull/47732) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- 支出 / 預算 / 速率限制：24
- 模型與提供者：9
- 效能：4
- LLM API 端點：3
- 記錄：1

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.6...v1.103.7
