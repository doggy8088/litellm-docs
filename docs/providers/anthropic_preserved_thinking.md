# 保留思考前綴穩定性 {#preserved-thinking-prefix-stability}

會在各輪之間保留思考內容的 Claude 模型，會為每個思考區塊簽署並將其綁定到產生它的請求。當您使用 `thinking-binding-controls-2026-08-01` beta 重放對話時，Anthropic 會檢查區塊之前的請求部分是否仍與該區塊建立時一致：最上層的 `system` 提示、`tools` 清單，以及其前面的每則訊息。若前綴有變更，則會捨棄該區塊（`prefix_mismatch_behavior: drop_block`，Anthropic 會在 `input_transformations` 中將其回報為 `thinking_dropped` 項目）或以 400 拒絕請求，並指出差異部分（`prefix_mismatch_behavior: error`）。`cache_control` 標記不會納入比較

透過 LiteLLM，模型看到的是 LiteLLM 建構的請求，因此會重寫對話的功能，必須在每次請求時以相同方式重寫較早的輪次。本頁列出 LiteLLM 對每個會碰觸前綴的功能所做的處理、它如何在各提供者上放置對話中間的 `system` 訊息，以及哪些變更會依設計破壞前綴

## 開啟檢查 {#turning-the-check-on}

傳送 beta 標頭，以及 `block_binding` 設定到 `thinking` 中。兩者都會原封不動地通過 `/v1/chat/completions`

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/{{anthropic_large}}",
    "max_tokens": 4096,
    "extra_headers": {"anthropic-beta": "thinking-binding-controls-2026-08-01"},
    "thinking": {"type": "adaptive", "block_binding": {"prefix_mismatch_behavior": "error"}},
    "messages": [
      {"role": "system", "content": "You are a terse assistant."},
      {"role": "user", "content": "Which box do I open first?"}
    ]
  }'
```

在下一輪，將助理訊息完全照 LiteLLM 回傳的樣子重放，包含 `thinking_blocks`，並附加新的使用者訊息。使用 `error` 時，變更過的前綴會以 400 回應，訊息會指出哪個部分不同，例如 `The system prompt differs from the one this block was created with`。使用 `drop_block` 時，請求會成功，模型會在沒有先前推理內容的情況下回答，而 Anthropic 的回應會帶有 `input_transformations`，其中有一筆命名該區塊的 `thinking_dropped` 項目，代理程式會以 `--detailed_debug` 將其列印出來

## LiteLLM 在各項功能上的處理方式 {#what-litellm-does-on-each-feature}

| 功能 | 對前綴的影響 | 附註 |
|---|---|---|
| 在 `system` 訊息中置入 `/v1/chat/completions` | 穩定 | 只由其前後相鄰的訊息決定，因此追加的輪次不會移動它（詳情如下） |
| 提示管理，每輪使用相同變數 | 穩定 | 範本每次都會渲染成相同的前導訊息 |
| 提示管理，變數或提示版本變更 | 依設計而破壞 | 前導訊息會變更，因此所有較早的區塊都會被捨棄，或請求會失敗 |
| Presidio PII 遮罩 | 穩定 | 每則訊息都會各自進行遮罩，且對於給定文字的替換內容是決定性的 |
| 在沒有結果的工具呼叫中使用 `modify_params` 虛擬工具結果 | 穩定 | 插入的結果只取決於其回應的工具呼叫 |
| 對 assistant prefill 進行 `modify_params` 尾隨空白修剪 | 無法到達 | Thinking 會拒絕 assistant prefill，因此在開啟 thinking 時修剪永遠不會執行 |
| MCP 工具注入 | 當伺服器的工具清單變更時會破壞 | `tools` 會在每次請求時從伺服器重新建構 |
| `cache_control` 標記 | 排除 | Anthropic 會將其排除在比較之外 |

## 對話中間的 `system` 訊息 {#mid-conversation-system-messages}

OpenAI 風格的用戶端可以把 `system` 訊息放在 `messages` 中的任何位置。Anthropic 的 Messages API 在 LiteLLM 標記為 `supports_mid_conversation_system` 的模型（Claude Opus 4.8 以及 Claude 5 代之後）中，接受 `system` 角色置於 `messages` 內，但只限一種形式：該訊息必須直接跟在 user 輪次之後，並直接位於 assistant 輪次之前，或結束該陣列，而且兩則 `system` 訊息不能相鄰。Bedrock Converse 會在每個模型上拒絕 `system` 角色置於 `messages` 內

LiteLLM 以前會把每則 `system` 訊息提升到最上層的 `system` 提示中。在第 N+1 輪，這會讓在第 N 輪建立的區塊所對應的 `system` 發生變化，因此任何加入提醒的對話都會在第二輪觸發綁定檢查。LiteLLM 現在只依照相鄰訊息本身，放置每一連串 `system` 訊息。直接接在 user 輪次後面的連串會維持在原位，緊接其後，作為 `role: system`。接在 assistant 輪次後面的連串會滑到下一個 user 輪次之後，因此 `[user, assistant, system, user]` 會以 `[user, assistant, user, system]` 送出。當沒有 user 輪次接在這類連串之後（它結束了陣列，或下一個是 assistant 輪次）時，它會原地變成一個 user 輪次，並以前置的操作員註記為前綴。落在同一個位置的連串會合併成一則 `system` 訊息。每個決策都只看該連串旁邊的訊息，絕不看後面的訊息，因此以更多輪次追加後重放對話時，每個較早的連串都會留在原處，前綴也會保持位元組完全一致

| 路由 | 已標記為 `supports_mid_conversation_system` 的模型 | 其他 Claude 模型 |
|---|---|---|
| Anthropic、Vertex AI、Azure AI Foundry，以及在 `/v1/chat/completions` 上的 Bedrock Invoke | 以 `role: system` 形式保留於 `messages` 內，如上所述放置 | 轉換為原地的 user 輪次，並以前置的操作員註記為前綴 |
| 在 `/v1/chat/completions` 上的 Bedrock Converse | 轉換為原地的 user 輪次，並以前置的操作員註記為前綴 | 相同 |
| `/v1/messages` | 如實送出 | 如實送出 |

操作員註記會是 `Operator note (not from the user): the following was originally a mid-conversation system-role reminder.`，後接原始文字，因此模型仍然知道這項指令不是來自使用者。`litellm.supports_mid_conversation_system("{{anthropic_large}}", "anthropic")` 會告訴您某個模型是否保留 `system` 角色

## 依設計會破壞前綴的變更 {#changes-that-break-the-prefix-by-design}

有些重寫無法保持穩定，因為輸入本身已改變。以不同變數值渲染的提示範本，或提示的新版本，都會產生不同的前導訊息，而在舊版本下建立的每個 thinking 區塊都會失去其綁定。請在整個對話期間保持變數與提示版本固定，並在結尾的新訊息中放入新指令，而不要變更變數。MCP 伺服器也是如此：LiteLLM 會在每次請求時向伺服器擷取工具清單，因此若伺服器在輪次之間新增、移除或重新命名工具，就會變更 `tools`。請在對話開啟期間保持工具集合穩定，否則就要預期在變更後的下一輪區塊會被捨棄

如果您的應用程式無法保證這一點，請優先選擇 `prefix_mismatch_behavior: drop_block`，而不是 `error`：請求仍會成功，模型會在沒有先前推理內容的情況下回答，而 `thinking_dropped` 項目會告訴您受影響的是哪個區塊

## 僅追加式對話 {#append-only-conversations}

維持區塊綁定的規則，就是絕不編輯已經送出的內容。請將每則助理訊息完全照 LiteLLM 回傳的樣子重放，包含 `thinking_blocks`，並在結尾新增 user、tool result，以及 reminder 訊息，同時讓 `system`、`tools` 與提示變數在整個對話中保持固定。LiteLLM 對對話中間 `system` 訊息的放置、其 PII 遮罩，以及虛擬工具結果，都遵循同一條規則，因此只做追加的用戶端會在每一輪送出完全相同的前綴
