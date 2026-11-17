# 使用 {#usage}

LiteLLM 會在所有提供者之間回傳與 OpenAI 相容的 usage 物件。

```bash
"usage": {
    "prompt_tokens": int,
    "completion_tokens": int,
    "total_tokens": int
  }
```

## 快速開始 {#quick-start}

```python
from litellm import completion
import os

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="{{openai_small}}",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)

print(response.usage)
```
> **注意：** LiteLLM 支援端點橋接。如果模型原生不支援所請求的端點，LiteLLM 會自動將請求路由到正確支援的端點（例如依據模型的 `mode`，在 `model_prices_and_context_window` 中設定，將 `/chat/completions` 橋接到 `/responses`，或反之亦然）。

## 串流使用量 {#streaming-usage}

如果 `stream_options={"include_usage": True}` 已設定，在 data: [DONE] 訊息之前還會額外串流一個 chunk。這個 chunk 上的 usage 欄位會顯示整個請求的 token 使用統計，而 choices 欄位一律會是空陣列。所有其他 chunk 也會包含 usage 欄位，但其值為 null。

```python
from litellm import completion 

completion = completion(
  model="{{openai_large}}",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  stream=True,
  stream_options={"include_usage": True}
)

for chunk in completion:
  if chunk.choices:
    print(chunk.choices[0].delta)
  else:
    print(chunk.usage)

```

### Proxy：一律包含串流使用量 {#proxy-always-include-streaming-usage}

使用 LiteLLM Proxy 時，您可以將其設定為在所有串流回應中自動包含 usage 資訊，即使用戶端沒有送出 `stream_options={"include_usage": True}` 也是如此。

#### 設定 {#configuration}

將下列內容加入您的 config.yaml：

```yaml
general_settings:
  always_include_stream_usage: true
```

或者，也可以透過 UI 進行設定：

1. 前往 LiteLLM Proxy UI
2. 進入 `Settings` >  `Router Settings` > `General`
3. 找到 `always_include_stream_usage` 設定
4. 將其切換為 `true`
5. 點擊 `Update` 以儲存

#### 運作方式 {#how-it-works}

當 `always_include_stream_usage` 啟用時：
- 所有串流請求都會自動加入 `stream_options={"include_usage": True}`
- 用戶端會在最後一個 chunk 中收到 usage 資訊，即使他們沒有明確請求
- 如果用戶端已經提供 `stream_options`，`include_usage: True` 也會被加入，而不會覆寫其他選項
- 非串流請求不受影響

#### 範例 {#example}

啟用此設定後，像這樣簡單的串流請求：

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

將會自動在回應中收到 usage 資訊，而無需明確包含 `stream_options`。

### Proxy：在串流使用量中包含成本 {#proxy-include-cost-in-streaming-usage}

`/v1/chat/completions` 與 `/v1/responses` 的串流會在最終的 `usage` 物件中攜帶 `cost`。`/v1/messages` 以及 Anthropic 與 OpenAI 的傳遞（pass-through）路由則不會，除非開啟下方兩個開關之一。兩者都會將 `cost` 加入攜帶 usage 的串流事件（在 `/v1/messages` 上為 `message_delta`），且該數字與 LiteLLM 寫入 `LiteLLM_SpendLogs` 的支出相同。

#### 設定 {#configuration-1}

全域開關適用於 proxy 提供的每一個串流：

```yaml
litellm_settings:
  include_cost_in_streaming_usage: true
```

逐請求的開關是 `x-litellm-include-cost-in-streaming-usage: true` header。它只對攜帶此 header 的請求生效，因此您的其餘流量仍維持 proxy 在不逐一檢查每個 chunk 時所採用的較輕量串流路徑。只有 `true` 這個值才有效。<SinceVersion v="1.110.0" />

#### 範例 {#example-1}

```bash
curl -N http://localhost:4000/v1/messages \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-include-cost-in-streaming-usage: true" \
  -H "content-type: application/json" \
  -d '{"model": "claude-haiku-4-5", "max_tokens": 16, "stream": true, "messages": [{"role": "user", "content": "hi"}]}'
```

```text
event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "max_tokens", ...}, "usage": {"input_tokens": 8, "output_tokens": 16, "cost": 8.8e-05}}
```

任何能呼叫 proxy 的金鑰都可以送出此 header，且沒有任何金鑰或團隊設定能拒絕它。當只有部分請求需要負擔逐 chunk 的成本時，請將全域開關保持關閉。
