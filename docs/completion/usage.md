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
  model="gpt-3.5-turbo",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)

print(response.usage)
```
> **注意：** LiteLLM 支援 endpoint bridge——如果某個模型原生不支援請求的 endpoint，LiteLLM 會根據模型在 `model_prices_and_context_window` 中設定的 `mode`，自動將呼叫路由到正確支援的 endpoint（例如將 `/chat/completions` bridge 到 `/responses`，或反之）。

## 串流使用量 {#streaming-usage}

如果 `stream_options={"include_usage": True}` 已設定，在 data: [DONE] 訊息之前還會額外串流一個 chunk。這個 chunk 上的 usage 欄位會顯示整個請求的 token 使用統計，而 choices 欄位一律會是空陣列。所有其他 chunk 也會包含 usage 欄位，但其值為 null。

```python
from litellm import completion 

completion = completion(
  model="gpt-4o",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  stream=True,
  stream_options={"include_usage": True}
)

for chunk in completion:
  print(chunk.choices[0].delta)

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
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

將會自動在回應中收到 usage 資訊，而無需明確包含 `stream_options`。

```
