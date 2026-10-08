# Nadir {#nadir}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Nadir 是一個智慧型 LLM 路由器。單一虛擬模型 `auto` 會在伺服器端依複雜度分類，並路由到能通過品質門檻的最便宜模型。 |
| LiteLLM 上的提供者路由 | `nadir/` |
| 提供者文件連結 | [Nadir 文件 ↗](https://getnadir.com/docs) |
| 基礎 URL | `https://api.getnadir.com/v1` |
| 支援的操作 | `/chat/completions` |

<br />

Nadir 使用 OpenAI `/v1/chat/completions` 方言，因此不需要請求轉換。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["NADIR_API_KEY"] = ""  # your Nadir API key
```

## 選用變數 {#optional-variables}

```python showLineNumbers title="Environment Variables"
os.environ["NADIR_API_BASE"] = ""  # defaults to https://api.getnadir.com/v1
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Nadir Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["NADIR_API_KEY"] = "your-api-key"

response = completion(
    model="nadir/auto",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
)
print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Nadir Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["NADIR_API_KEY"] = "your-api-key"

response = completion(
    model="nadir/auto",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
    stream=True,
)
for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: nadir-auto
    litellm_params:
      model: nadir/auto
      api_key: os.environ/NADIR_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

```bash showLineNumbers title="Nadir via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "nadir-auto",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

## 模型 {#model}

Nadir 提供一個虛擬模型。傳送 `nadir/auto`，路由器就會為每個請求挑選
底層模型。

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| auto | `completion(model="nadir/auto", messages=messages)` |

## 成本追蹤 {#cost-tracking}

回應上的 `model` 欄位會回報 Nadir 實際路由到的模型。
Nadir 會回傳其為非串流呼叫計算出的成本，而 LiteLLM 會將其記錄
為回應成本，因此 SDK 的 `response_cost`、proxy 的
`x-litellm-response-cost` 標頭，以及花費記錄都會帶有 Nadir 的數值：

```python
print(f"Request cost: ${response._hidden_params['response_cost']}")
```

串流回應不會從 Nadir 帶回成本。LiteLLM 會根據
路由後模型在 LiteLLM 模型成本對照表中的自己的項目進行計價，例如
`openrouter/anthropic/claude-haiku-4.5`，因此沒有成本對照表
項目的路由模型會將串流呼叫記錄為 $0。

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Nadir 會根據自己的結構定義驗證請求，並丟棄超出範圍的任何內容，
因此 LiteLLM 只宣告端點接受的參數：

`frequency_penalty`, `max_tokens`, `presence_penalty`, `response_format`,
`stream`, `temperature`, `top_p`

`extra_headers` 和 `max_retries` 由 LiteLLM 傳輸層處理，而不是
隨請求主體傳送。傳遞任何其他參數都會引發
`litellm.UnsupportedParamsError`，除非已設定 `drop_params=True`。

:::info

`tools`、`tool_choice` 和 `functions` **不**支援。函式呼叫
目前並非 Nadir 請求結構的一部分。

:::
