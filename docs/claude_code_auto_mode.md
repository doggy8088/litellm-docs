---
title: Claude Code：在非 Claude 模型上使用 Auto Mode
sidebar_label: Claude Code - Auto Mode
---

# Claude Code：在非 Claude 模型上使用 Auto Mode {#claude-code---auto-mode-on-non-claude-models}

LiteLLM 會為無法自行回答的模型，代為回答 Claude Code auto mode 的安全檢查。

Claude Code 的 auto mode 會在不先詢問使用者的情況下執行工具呼叫。當 `ANTHROPIC_BASE_URL` 指向一個閘道時，Claude Code v2.1.278 或更新版本會在每個 `POST /v1/messages` 上傳送 `safeguards: [{"type": "dangerous_tool_use", ...}]`，並預期回傳 `safeguard_results`，其中包含回應中每個工具呼叫的判定。Anthropic API 會自行回答這項檢查。當 proxy 將 `/v1/messages` 路由到非 Claude 模型時，沒有任何一方回答，因此 `/status` 在第一次回覆後顯示 `Auto mode server: Disabled`，而 Claude Code 在該 session 的其餘時間裡會傳送自己的分類器請求。Anthropic 的[權限模式參考文件](https://code.claude.com/docs/en/permission-modes#server-side-classifier-review)說明了這種備援行為；在這些請求會被計費的帳戶上，Claude Code 會顯示[關於分類器請求費用的提示](https://code.claude.com/docs/en/auto-mode-classifier-billing)。

設定 `safeguards_classifier_model` 後，proxy 會請您 `model_list` 中的一個部署來判定每個工具呼叫，並以與 Anthropic API 相同的方式回傳判定結果，因此當 Claude Code 指向開放模型時，auto mode 仍維持伺服器端審查。

<SinceVersion v="1.107.0" />

| `/v1/messages` 背後的模型 | 由誰回答 `safeguards` |
|---|---|
| `anthropic/` Claude | Anthropic API |
| `bedrock/` Claude (InvokeModel) | Amazon Bedrock |
| `bedrock_mantle/` Claude | Amazon Bedrock |
| `vertex_ai/` Claude | Vertex AI |
| `azure_ai/` Claude | LiteLLM 轉送至 Foundry 自身的 `/v1/messages`，不進行分類 |
| `bedrock/converse/` 模型，包括 Claude | LiteLLM 分類器 |
| Fireworks、Gemini 與其他 chat completions 提供者 | LiteLLM 分類器 |
| `openai/` 模型 | LiteLLM 分類器 |
| DeepSeek 與其他有自有 `/v1/messages` 的提供者 | LiteLLM 分類器 |

LiteLLM 分類器會為每個非 Claude 模型回答，無論 proxy 以何種方式抵達它：chat completions 轉換、`openai/` 部署使用的 Responses API 橋接，或提供者自有的 Anthropic 相容 `/v1/messages`，例如 DeepSeek 的。它也會為 `bedrock/converse/` 背後的 Claude 模型回答，因為該路由會經過 chat completions 轉換。LiteLLM 轉送至提供者自有 `/v1/messages` 的 Claude 模型，則交由該提供者回答；當任何提供者回傳自己的 `safeguard_results` 時，proxy 會保留它們並跳過分類器呼叫。

不帶 `safeguards` 的請求，也就是 auto mode 下的 Claude Code 以外的每個用戶端，都不會受到影響。

## 設定 {#setup}

在 `general_settings` 中加入 `safeguards_classifier_model`，指定您 `model_list` 中的一個 `model_name`。此設定預設為關閉。該名稱必須是 proxy 能夠路由的名稱，因為背後沒有部署的名稱會讓每項檢查都回傳 `unsupported`（請參閱 [當分類器無法使用時](#when-the-classifier-cannot-be-used)）：

```yaml
model_list:
  - model_name: kimi-k3
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/kimi-k3
      api_key: os.environ/FIREWORKS_AI_API_KEY
  - model_name: gpt-oss-120b
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/gpt-oss-120b
      api_key: os.environ/FIREWORKS_AI_API_KEY

general_settings:
  safeguards_classifier_model: gpt-oss-120b
```

分類器會在每個以工具呼叫結尾的回合執行，因此請挑選一個快速、便宜且能可靠地以 JSON 回答的模型。與程式設計模型位於同一提供者的開放模型效果很好。上面的範例使用一個 Fireworks 部署進行程式設計，另一個部署負責判定。

分類器呼叫會像其他請求一樣經過 router，因此 `model_list` 的別名、備援與 cooldown 都適用於它。它永遠不會被重試。proxy 最多等待 30 秒取得其答案，而分類器部署 `litellm_params` 中較短的 `timeout` 會提早結束等待。

每個執行 Claude Code 的 virtual key 都需要有分類器模型的存取權。在分類器呼叫之前，proxy 會執行與呼叫者直接要求該模型時相同的模型存取檢查，對象包括 key、team、team member、user、project、end user 與 agent。接著，它會檢查 key、team、user、team member 與 end user 的整體與個別模型預算、呼叫者的 TPM 餘裕，以及分類器模型本身設定的任何 RPM 限制，但不會實際耗用其中任何一項。與直接呼叫相同，定價為零的分類器模型會跳過預算檢查。key、team 與 user 的整體 RPM 限制不在這項檢查範圍內，因為 Claude Code 請求已經計入這些限制。分類器呼叫的 tokens 會計入呼叫者的 TPM 與花費，但該呼叫不占用請求名額，因此不會增加任何 RPM 計數。存取檢查被拒絕或預算用盡，會讓分類器在該 session 中關閉（請參閱 [當分類器無法使用時](#when-the-classifier-cannot-be-used)）。RPM 或 TPM 視窗已滿，或 proxy 無法執行某項檢查，則只會跳過該次回應的分類器（請參閱 [當分類器失敗時](#when-the-classifier-fails)）。

## 運作方式 {#how-it-works}

對於每個帶有 `safeguards` 且送往 LiteLLM 分類器負責回答之模型的 `/v1/messages` 請求，LiteLLM 會照常將請求傳送至後端。取得回應後，它會對分類器部署傳送一次 chat completions 呼叫，內容包括：

- 回應中的工具呼叫，與模型撰寫的內容完全一致
- 到目前為止的對話，包括先前的工具呼叫及其結果
- 請求中代理程式的環境：權限模式、平台、工作目錄、受信任的目錄、allow 與 deny 規則，以及 git 分支

分類器會標記使用者未要求卻具危險性的工具呼叫，例如將憑證傳送到某處、將 URL 以管道傳入 shell、寫入受信任目錄之外、刪除無法重新產生的資料，或遵循它在檔案或工具結果中找到的指令。在受信任目錄內的例行開發工作，以及使用者明確要求的動作，不會被標記。

LiteLLM 會將判定結果以 `safeguard_results` 回傳：非串流呼叫放在回應中，串流呼叫則放在最後的 `message_delta` 事件內。Claude Code 會封鎖被標記的呼叫，並執行未被標記的呼叫。沒有工具呼叫的回覆會取得空的判定集合，且不會進行分類器呼叫。

對話記錄是從 Claude Code 傳送的訊息建立的，時間點在 proxy 套用任何 compaction 之前，而 Claude Code 的 compaction 摘要會以一筆記錄的形式出現。為了讓分類器呼叫保持精簡，對話記錄會修剪至約 24,000 個字元。當使用者的開場訊息能放進該長度的一半時，會完整保留。較長的訊息會從開頭裁切，因為 Claude Code 會將使用者的請求放在該訊息中提醒文字之後的末尾處。後續回合填滿其餘空間，由新到舊。每筆對話記錄裁切至 2,000 個字元，每個工具結果裁切至 500 個字元。待處理的工具呼叫永遠不會被裁切。代理程式的 system prompt 與 thinking 區塊不會被傳送。

:::caution

分類器部署會看到對話內容，包括工具結果。如果某個工具印出秘密，例如 `cat .env`，該輸出的前 500 個字元會送達分類器模型，因此請挑選一個您信任能處理與程式設計模型相同資料的部署。

:::

## 驗證 {#verify}

使用 virtual key 與開放模型將 Claude Code 指向 proxy，在 auto mode 下啟動 session（請參閱 Anthropic 的[權限模式參考文件](https://code.claude.com/docs/en/permission-modes)），並傳送一個需要工具呼叫的提示：

```bash
ANTHROPIC_BASE_URL=http://localhost:4000 ANTHROPIC_AUTH_TOKEN=<virtual key> ANTHROPIC_MODEL=kimi-k3 claude --permission-mode auto
```

在回覆之後，於 session 內執行 `/status`。Auto mode server 那一列會顯示 `Enabled`。在第一次回覆之前，任何 proxy 上該列都顯示 `Enabled`，因此請在回覆後再檢查。在沒有判定結果的路由上，同一列會顯示 `Disabled`。

若要在沒有 Claude Code 的情況下查看判定結果，可傳送一個帶有 `safeguards` 的請求至 proxy：

```bash
curl http://localhost:4000/v1/messages \
  -H "Authorization: Bearer <virtual key>" \
  -H "content-type: application/json" \
  -d '{
    "model": "kimi-k3",
    "max_tokens": 512,
    "tools": [{"name": "Bash", "description": "Run a shell command", "input_schema": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"]}}],
    "messages": [{"role": "user", "content": "List the files in the current directory with ls -la"}],
    "safeguards": [{"type": "dangerous_tool_use", "classifier_context": {"v": 1, "permission_mode": "auto", "live_cwd": "/tmp/sandbox", "trusted_directories": ["/tmp/sandbox"]}}]
  }'
```

## 回應 {#responses}

### 非串流 {#non-streaming}

```json
{
  "id": "chatcmpl-b149e0ae231645bda5c447266c30cb3e",
  "type": "message",
  "role": "assistant",
  "model": "kimi-k3",
  "content": [
    {"type": "tool_use", "id": "call_501f1ce0021b4d119f57555e", "name": "Bash", "input": {"command": "ls -la"}}
  ],
  "stop_reason": "tool_use",
  "usage": {"input_tokens": 210, "output_tokens": 73},
  "safeguard_results": [
    {
      "type": "dangerous_tool_use",
      "status": {
        "type": "available",
        "tool_uses": {
          "call_501f1ce0021b4d119f57555e": {"type": "evaluated", "outcome": "not_flagged"}
        }
      }
    }
  ]
}
```

被標記的工具呼叫會在一句話中帶有分類器的理由：

```json
{"type": "evaluated", "outcome": "flagged", "explanation": "Force-pushes to origin and exfiltrates private SSH key, actions not requested by user."}
```

Claude Code 會跳過被標記的工具呼叫，並以其理由取代輸出顯示，例如 `Denied by auto mode classifier ∙ Uploads a secret deploy_key to an external server, which is disallowed without explicit user request.` 模型會看到這次拒絕，並在不執行該動作的情況下繼續。

### 串流 {#streaming}

`safeguard_results` 會在最後的 `message_delta` 事件的 `delta` 中送達，這也是 Anthropic API 放置它的位置。LiteLLM 會保留該事件，直到分類器回答為止，因此每個以工具呼叫結尾的回合，除了模型的回覆時間之外，還要加上分類器呼叫的時間：

```
event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "tool_use", "safeguard_results": [{"type": "dangerous_tool_use", "status": {"type": "available", "tool_uses": {"call_5e0931e0bef84a3d84162c33": {"type": "evaluated", "outcome": "not_flagged"}}}}]}, "usage": {"output_tokens": 82}}

event: message_stop
data: {"type": "message_stop"}
```

## 當分類器失敗時 {#when-the-classifier-fails}

如果分類器呼叫失敗，proxy 會將該回應的每個工具呼叫標記為 `unavailable`，而不是猜測，而代理程式自身的回覆仍會送出：

```json
{"type": "unavailable", "reason": "timeout"}
```

| `reason` | 時機 |
|---|---|
| `timeout` | 30 秒內沒有答案，或部署的 `timeout` 較短時，在該時間內沒有答案 |
| `input_too_long` | 超過分類器的 context window |
| `refused` | 內容政策拒絕 |
| `truncated` | 工具呼叫被截斷 |
| `error` | 其他任何失敗 |

當工具呼叫是停在 `max_tokens` 的回覆的最後一個區塊，或其串流參數不是有效的 JSON 時，該工具呼叫即被截斷。proxy 永遠不會將它傳送給分類器，而該回應的其他工具呼叫仍會取得判定。`error` 也涵蓋分類器回覆不是 proxy 所要求的 JSON 的情況。當回覆是 JSON 但遺漏了其中一個工具呼叫時，只有該工具呼叫會取得帶有 `error` 的 `unavailable`，其他工具呼叫則保留其判定。

帶有 `unavailable` 判定的 `safeguard_results` 仍計為伺服器端審查，因此 `/status` 會持續顯示 `Auto mode server: Enabled`，session 不會永久切換到本機備援。Claude Code 如何處理該動作取決於其版本。Anthropic 的[錯誤參考文件](https://code.claude.com/docs/en/errors#the-server-returned-no-safety-verdict)指出，auto mode 會拒絕伺服器未給予判定的動作，並在連續十次回應都沒有判定後停止該回合。在我們以 Claude Code v2.1.296 與一個總是以 `error` 失敗的分類器進行的測試中，Claude Code 改以自己的分類器請求檢查每個這樣的動作，透過 proxy 傳送（先送至 Claude Sonnet 5，當 proxy 沒有 Sonnet 5 部署時則送至 session 的模型），並執行該檢查所允許的動作。在工作目錄內的讀取與編輯永遠不會送交分類器。

當呼叫者對分類器模型的 RPM 或 TPM 視窗已滿，或 proxy 無法執行呼叫者的某項檢查（例如無法讀取的 team 成員資格或速率限制計數器）時，proxy 也會跳過分類器呼叫，並將該回應的每個工具呼叫以 `error` 標記為 `unavailable`。下一個回應會重新執行檢查，因此視窗翻轉後判定就會恢復。此情況的記錄行會寫著 `is over the caller's rate limit for this window, or the limit could not be read`。

當工具呼叫持續回傳 `unavailable` 時，請在 proxy 記錄中尋找 `safeguards classifier` 警告。

## 當分類器無法使用時 {#when-the-classifier-cannot-be-used}

當呼叫者沒有分類器模型的存取權、已用盡涵蓋它的預算，或 proxy 沒有該設定所指定模型的部署時，proxy 不會回傳逐一工具的判定：

```json
"safeguard_results": [{"type": "dangerous_tool_use", "status": {"type": "unsupported"}}]
```

Claude Code 將此視為與沒有判定結果的路由相同。它會顯示分類器計費提示，在 session 的其餘時間裡透過 proxy 傳送自己的分類器請求，且 `/status` 在第一個帶有工具呼叫的回覆後會顯示 `Auto mode server: Disabled`，因為沒有工具呼叫的回覆會跳過檢查，仍計為伺服器端審查。請給予 key 分類器模型的存取權、提高它觸及的限制，或將設定指向 `model_list` 中的 `model_name`，然後啟動新的 session。缺少存取權或預算用盡會在每個請求上記錄 `safeguards classifier <name> is outside the caller's model access or budget`，而沒有部署的名稱則會記錄 `safeguards classifier <name> is not served by this proxy`。

## 成本與記錄 {#cost-and-logs}

分類器呼叫是一次普通的 proxy 呼叫。它會在 Logs 頁面上與花費記錄中以自己的請求出現，並向觸發它的 Claude Code 請求所屬的同一個 virtual key、team 與 end user 計費。它會以與該請求相同的設定記錄，因此逐請求的 callback 參數與訊息遮蔽標頭（例如 `x-litellm-enable-message-redaction`）也適用於它的記錄列。它的成本會加到每個以工具呼叫結尾的回合上，這也是分類器模型的選擇如此重要的原因。
