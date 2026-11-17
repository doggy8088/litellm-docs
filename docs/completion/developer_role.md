# Developer 角色 {#developer-role}

OpenAI 的 `developer` 角色所帶的指令，優先級高於使用者的訊息。大多數提供者沒有這樣的角色，因此 LiteLLM 會在請求離開閘道之前，依各後端進行轉換。本頁說明當請求在 `/v1/chat/completions` 與 `/v1/responses` 上帶有 `developer` 訊息時，各後端會收到什麼。

## 各後端會收到什麼 {#what-each-backend-receives}

| 後端 | `developer` 訊息會如何處理 |
|---|---|
| OpenAI o 系列模型（o1、o3、o4-mini） | 原樣傳遞 |
| OpenAI，其他所有模型 | 每一則都轉換為相同位置的 `system` 訊息 |
| Azure OpenAI | 每一則都轉換為相同位置的 `system` 訊息 |
| OpenAI 相容後端 | 每一則都轉換為相同位置的 `system` 訊息，除非該模型宣告 `supports_mid_conversation_system: false` |
| 有自有訊息格式的提供者（Anthropic、Bedrock Converse、Gemini、Vertex AI、Ollama） | 不做處理。由其自身的轉換邏輯處理 `developer` |

OpenAI 相容後端包括 `openai/`（搭配自訂 `api_base`）、`custom_openai/`、`hosted_vllm/`、`fireworks_ai/`、`deepseek/`、`together_ai/`、`groq/`、`xai/`、`openrouter/`、`mistral/`、`databricks/`、`azure_ai/`、`litellm_proxy/`，以及其他所有建立在 OpenAI chat 格式之上的提供者。

## 需要 system 訊息位於最前面的模型 chat template {#models-whose-chat-template-needs-the-system-message-first}

許多開放權重的 chat template（包括 Qwen3.5 與 Qwen3.8）只接受位於對話最開頭的 `system` 訊息。Codex CLI 與其他代理程式會在對話稍後才傳送 `developer` 訊息，例如權限更新，或在 context compaction 之後新增的指令。若就地轉換，這些訊息會以對話中段的 `system` 訊息送達模型，後端便會回應 `400 System message must be at the beginning`。

<SinceVersion v="1.109.0" />

在部署的 `model_info` 中，將這類模型宣告為 `supports_mid_conversation_system: false`：

```yaml
model_list:
  - model_name: qwen3.5
    litellm_params:
      model: custom_openai/Qwen/Qwen3.5-27B
      api_base: http://my-vllm-server:8000/v1
    model_info:
      supports_mid_conversation_system: false
```

LiteLLM 接著會將第一則對話訊息之後出現的每一則 `developer` 訊息移到最上方，並與開頭的 `system` 與 `developer` 訊息合併為一則開頭的 `system` 訊息。以下請求

```json
{
  "messages": [
    {"role": "system", "content": "You are a terse assistant."},
    {"role": "user", "content": "Hi there"},
    {"role": "developer", "content": "Answer with exactly one word."},
    {"role": "user", "content": "What is the capital of France?"}
  ]
}
```

送達後端時會變成

```json
{
  "messages": [
    {"role": "system", "content": "You are a terse assistant.\n\nAnswer with exactly one word."},
    {"role": "user", "content": "Hi there"},
    {"role": "user", "content": "What is the capital of France?"}
  ]
}
```

純字串內容會以一個空白行連接。當合併的訊息帶有清單內容時，例如帶有 `cache_control` 的區塊或 Anthropic 計費中繼資料，每個區塊會保持各自獨立的文字區塊，讓每個快取斷點維持其位置，而後續每則訊息的第一個文字區塊會以空白行開頭，Anthropic 計費標頭除外。當多則合併的訊息都帶有 `name` 時，合併後的訊息會保留最後一個。

在 `assistant` 回合之後緊接著結束對話的 `developer` 訊息，會改以 `user` 訊息傳送。將它移到最上方會讓請求結束在 assistant 的回合上，而位於該處的 `system` 訊息在相同的 template 上會失敗。

用戶端撰寫的 `system` 訊息永遠不會被移動。放在對話中段的 `system` 訊息會照原樣轉送，而具有 system-first template 的後端會拒絕它，就如同直接呼叫該後端時一樣。

模型成本對照表已為某些託管模型宣告此旗標，例如 `fireworks_ai/qwen3p8-max`，因此這些模型不需要任何設定。部署 `model_info` 中的值會在兩個方向上覆寫成本對照表。沒有宣告的模型會維持就地轉換，因此提供者所快取的 prompt 前綴不會因它們而改變。

## 原生 Responses API 路由 {#native-responses-api-routes}

有些後端自行實作 Responses API，並接收用戶端的 `input` 項目。Fireworks（`fireworks_ai/`）會將請求的 `instructions`、開頭的 `system` 與 `developer` 項目，以及之後的每個文字 `developer` 項目併入最上層的 `instructions` 欄位，除非部署自身的 `model_info` 宣告 `supports_mid_conversation_system: true`；在此情況下，每個 `developer` 項目會就地以 `system` 項目傳送。在同一模型的其他部署上設定的 `true`，不會關閉此併入行為。未被併入的 `developer` 項目，例如在 assistant 回合之後結束輸入的項目，在宣告旗標為 `false` 的模型上會以 `user` 項目傳送，否則會以 `system` 項目傳送。

自行原生提供 `/v1/responses` 的 `hosted_vllm/` 部署會照原樣轉送 `developer` 項目，除非模型宣告 `supports_mid_conversation_system: false`。有此宣告時，它們會以與 Fireworks 相同的方式將項目併入 `instructions`。

透過 chat completions 橋接（`use_chat_completions_api: true`）的請求，遵循上述的 chat 規則。
