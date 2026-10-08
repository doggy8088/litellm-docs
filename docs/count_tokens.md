import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Token 計數 {#token-counting}

## 概覽 {#overview}

LiteLLM 透過呼叫各提供者特定的 token 計數 API 提供精確的 token 計數。這可讓您在傳送請求前取得準確的 token 數量，協助進行成本估算與上下文視窗管理。

| 功能 | 詳細資訊 |
|---------|---------|
| SDK 方法 | `litellm.acount_tokens()` |
| Proxy 端點 | `/v1/messages/count_tokens`（Anthropic 格式）、`/v1/responses/input_tokens`（OpenAI 格式） |
| 備援 | 對不支援的提供者採用本地 tiktoken 基礎計數 |

## 支援的提供者 {#supported-providers}

| 提供者 | Token 計數 API | 格式 |
|----------|-------------------|--------|
| OpenAI | [Responses API `/input_tokens`](https://platform.openai.com/docs/api-reference/responses/input-tokens) | OpenAI Responses |
| Anthropic | [Messages `/count_tokens`](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) | Anthropic Messages |
| Vertex AI (Claude) | Vertex AI Partner Models Token Counter | Anthropic Messages |
| Bedrock (Claude) | AWS Bedrock CountTokens API | Anthropic Messages |
| Gemini | Google AI Studio countTokens API | Anthropic Messages |
| Vertex AI (Gemini) | Vertex AI countTokens API | Anthropic Messages |
| 其他提供者 | 本地 tiktoken 備援 | N/A |

## SDK 使用方式 {#sdk-usage}

### 基本用法 {#basic-usage}

```python
import asyncio
import litellm

async def main():
    # OpenAI
    result = await litellm.acount_tokens(
        model="openai/{{openai_large}}",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "openai_api"

    # Anthropic
    result = await litellm.acount_tokens(
        model="anthropic/{{anthropic}}",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "anthropic_api"

asyncio.run(main())
```

### 搭配工具與系統訊息 {#with-tools-and-system-message}

```python
import asyncio
import litellm

async def main():
    result = await litellm.acount_tokens(
        model="openai/{{openai_large}}",
        messages=[{"role": "user", "content": "What's the weather in Paris?"}],
        tools=[{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                },
            },
        }],
        system="You are a helpful weather assistant.",
    )
    print(f"Token count (with tools): {result.total_tokens}")

asyncio.run(main())
```

### 回應格式 {#response-format}

`litellm.acount_tokens()` 會回傳一個 `TokenCountResponse`：

```python
TokenCountResponse(
    total_tokens=15,           # Token count
    request_model="openai/{{openai_large}}",  # Model requested
    model_used="{{openai_large}}",      # Model used for counting
    tokenizer_type="openai_api",    # "openai_api", "anthropic_api", "local_tokenizer"
    original_response={"input_tokens": 15},  # Raw API response
    error=False,               # True if counting failed
    error_message=None,        # Error details if failed
)
```

### 備援行為 {#fallback-behavior}

如果提供者不支援 token 計數 API，或 API 金鑰遺失，`acount_tokens()` 會自動退回到本地 tiktoken 基礎計數：

```python
# Unsupported provider → automatic fallback
result = await litellm.acount_tokens(
    model="together_ai/meta-llama/Llama-3-8b-chat-hf",
    messages=[{"role": "user", "content": "Hello"}],
)
print(result.tokenizer_type)  # "local_tokenizer"
```

在 proxy 上，本地計數會在工作執行緒中執行，因此大型負載不會阻塞其他請求。每個 worker process 同時最多會計算 `TOKEN_COUNTER_MAX_CONCURRENT_COUNTS` 個負載（預設 4），其餘會排隊，這可限制大量大型計數突發時所需的記憶體。長度超過 `TOKEN_COUNTER_MAX_EXACT_CHARS` 個字元的字串（預設 4,000,000，約 100 萬個 token）會透過對 16 個平均分布的樣本進行 tokenization 來估算，這些樣本合計達到該字元數，再依字串長度縮放結果，如此可將最大負載的成本限制在可控範圍內。

## Proxy 使用方式 {#proxy-usage}

### OpenAI 格式：`/v1/responses/input_tokens` {#openai-format-v1responsesinput_tokens}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl -X POST "http://localhost:4000/v1/responses/input_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "input": "Hello, how are you?"
  }'
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python
import httpx

response = httpx.post(
    "http://localhost:4000/v1/responses/input_tokens",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-<your-litellm-api-key>"
    },
    json={
        "model": "{{openai_large}}",
        "input": "Hello, how are you?"
    }
)

print(response.json())
# {"object": "response.input_tokens", "input_tokens": 13}
```

</TabItem>
</Tabs>

**回應：**
```json
{"object": "response.input_tokens", "input_tokens": 13}
```

### Anthropic 格式：`/v1/messages/count_tokens` {#anthropic-format-v1messagescount_tokens}

請參閱 [Anthropic Token Counting](./anthropic_count_tokens.md) 取得完整文件。

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

## Proxy 設定 {#proxy-configuration}

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
```
