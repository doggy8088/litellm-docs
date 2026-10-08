# 基於相關性的壓縮（TypeSafe / Jev） {#relevance-based-compaction-typesafe--jev}

[TypeSafe](https://typesafe.ai) 的 Jev 模型會判斷每個已完成的工具交換是否仍與目前的任務相關。作為 LiteLLM 的防護欄，它會在請求到達模型之前，將 Jev 低於相關性閾值的工具結果清空，因此無效內容不會再消耗輸入 token。與摘要式壓縮器不同，這是以每次交換為單位的全有或全無：結果不是原封不動保留，就是被取代為移除通知。

此功能適用於 `/v1/chat/completions`、`/v1/messages`（Anthropic 格式）以及 `/v1/responses`。

## 運作方式 {#how-it-works}

此防護欄會在 `pre_call` 步驟於進程內執行，並呼叫 TypeSafe 的代管 API（`https://api.typesafe.ai`），因此不需要額外部署服務。只有 proxy 會與 TypeSafe 通訊。只有請求輸入會被重寫；回應則原封不動地通過。

壓縮會依每個已完成的工具交換進行：

1. **選取候選項目。** 候選項目是指有進行工具呼叫的 assistant 訊息，以及回覆它的 `tool`/`function` 訊息，且其合併後的結果文字至少有 `min_chars_to_evaluate` 個字元。系統訊息、最後一則 user 訊息，以及最近一次交換（透過 last-assistant 規則）絕不會被評估或重寫，這與 litellm 的共享壓縮保護政策一致。每次請求最多會評估最近 200 個符合條件的交換。
2. **評估。** 一次 `POST {api_base}/v1/systemone` 呼叫會將最後一則 user 訊息作為 `task`、合併後的系統文字，以及每個候選項目的工具呼叫與（截斷後的）結果放入 `state`，並對每個交換提出一個 `noul` 是/否問題：這個交換是否仍然是完成任務所必需？
3. **壓縮。** 每個 `noul` 分數低於 `relevance_threshold` 的交換，其工具結果都會被替換為 `[Tool result removed by TypeSafe compaction: judged no longer relevant to the current task]`。assistant 的工具呼叫列會保持不變，因此對話仍會維持格式正確。如果沒有任何內容被移除，則請求會以完全相同的位元組內容轉送。

## 必要條件 {#requirements}

包含 `typesafe` 防護欄的 LiteLLM 建置版本，以及來自 [typesafe.ai](https://typesafe.ai) 的 TypeSafe API 金鑰。

## 快速開始 {#quick-start}

### 1. 在您的設定中定義防護欄 {#1-define-the-guardrail-in-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

guardrails:
  - guardrail_name: jev-compaction
    litellm_params:
      guardrail: typesafe
      mode: pre_call
      api_key: os.environ/TYPESAFE_API_KEY
      optional_params:
        relevance_threshold: 0.2
```

請使用 `mode: pre_call`，因為此防護欄只會轉換請求輸入。`api_key` 是必填項目，可來自設定或 `TYPESAFE_API_KEY` 環境變數。將 `default_on: true` 設為對每個請求都進行壓縮，或保持關閉，以便依每個金鑰或每個請求選擇性啟用壓縮。

### 2. 啟動 LiteLLM 閘道 {#2-start-the-litellm-gateway}

```shell
litellm --config config.yaml
```

### 3. 傳送請求 {#3-send-a-request}

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Which filing discusses Q3 revenue?"},
      {"role": "assistant", "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": "search_filings", "arguments": "{\"query\": \"Q1 revenue\"}"}}]},
      {"role": "tool", "tool_call_id": "call_1", "content": "<...tens of thousands of tokens of Q1 filing text...>"},
      {"role": "assistant", "tool_calls": [{"id": "call_2", "type": "function", "function": {"name": "search_filings", "arguments": "{\"query\": \"Q3 revenue\"}"}}]},
      {"role": "tool", "tool_call_id": "call_2", "content": "<...tens of thousands of tokens of Q3 filing text...>"}
    ],
    "guardrails": ["jev-compaction"]
  }'
```

偏離主題的 Q1 結果會被清空，而任務所需的 Q3 結果則會原封不動地通過。

## 依金鑰啟用壓縮 {#enabling-compaction-per-key}

當未設定 `default_on` 時，壓縮只會針對選擇加入的請求執行。典型做法是將防護欄附加到虛擬金鑰。

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
        "guardrails": ["jev-compaction"]
      }'
```

## 依請求啟用壓縮 {#enabling-compaction-per-request}

用戶端可以在單次呼叫中，透過在請求本文中傳入 `guardrails` 陣列來選擇加入，或在沒有頂層 `guardrails` 欄位的 `/v1/messages` 中傳入 `litellm_metadata.guardrails`。當壓縮有執行時，回應會包含 `x-litellm-applied-guardrails: jev-compaction` 標頭。

## 失敗語意 {#failure-semantics}

預設為 `fail_open`：如果 TypeSafe 服務無法連線、逾時（30 秒預算），或回傳錯誤的狀態或本文，請求會在 proxy 記錄中附帶警告地以未壓縮狀態轉送。壓縮是一種最佳化，因此評估器當機絕不會阻擋流量。

將 `unreachable_fallback: fail_closed` 設為改以 `500` 和一般錯誤訊息使請求失敗；上游回應本文會留在伺服器記錄中，不會傳給用戶端。

## 驗證 TypeSafe 已執行 {#validate-typesafe-ran}

1. `x-litellm-applied-guardrails: jev-compaction` 回應標頭。
2. 在支出記錄列上的 `guardrail_information`：`exchanges_evaluated`、`exchanges_dropped`、`chars_removed`、`model`。
3. Admin UI：在 **Logs** 中開啟任一請求，捲動至 **Guardrails & Policy Compliance**，並查看 `jev-compaction` 是否以 `pre-call` 步驟顯示在 **Request Lifecycle** 下方。

## 設定參考 {#configuration-reference}

頂層 `litellm_params`：

| 參數                   | 類型 | 說明                                                                                              |
| ---------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| `guardrail`            | str  | 必須為 `typesafe`。                                                                                      |
| `mode`                 | str  | 使用 `pre_call`。此防護欄只會轉換請求輸入；回應則原封不動地通過。           |
| `api_key`              | str  | TypeSafe API 金鑰，會以 `Authorization: Bearer` 傳送。預設回退至 `TYPESAFE_API_KEY`。必填。           |
| `api_base`             | str  | TypeSafe API base URL。預設回退至 `TYPESAFE_API_BASE`，再回退至 `https://api.typesafe.ai`。                |
| `model`                | str  | TypeSafe 評估模型（不是 LLM）。預設為 `jev-latest`。                                       |
| `unreachable_fallback` | str  | `fail_open`（預設）會在服務失敗時以未壓縮狀態轉送；`fail_closed` 會回傳 500。                |
| `default_on`           | bool | 每個請求都執行，不需逐次呼叫選擇加入。預設為 `false`。                                       |

巢狀 `optional_params`（每一項也可直接在 `litellm_params` 下接受；巢狀值優先）：

| 參數                      | 類型  | 預設 | 說明                                                                                  |
| -------------------------- | ----- | ------- | -------------------------------------------------------------------------------------------- |
| `relevance_threshold`      | float | `0.2`   | 分數低於此 `noul` 機率的交換會被捨棄。                                 |
| `min_chars_to_evaluate`    | int   | `200`   | 合併後工具結果文字較短的交換，絕不會傳送給 Jev 或被捨棄。       |
| `max_result_chars_in_state`| int   | `4000`  | 傳送給 Jev 的狀態中，工具結果文字會被截斷為這麼多字元。              |

## 環境變數 {#environment-variables}

| 變數            | 說明                                    |
| ------------------- | ---------------------------------------------- |
| `TYPESAFE_API_KEY`  | 當未設定 `api_key` 時使用的備用 API 金鑰。    |
| `TYPESAFE_API_BASE` | 當未設定 `api_base` 時使用的備用 API base。  |
