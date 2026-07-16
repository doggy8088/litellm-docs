import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /v1/messages/count_tokens {#v1messagescount_tokens}

## 概覽 {#overview}

Anthropic 相容的 token 計數端點。在將訊息送入模型之前先計算其 token 數。

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ❌ | 僅進行 token 計數，不產生成本 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 終端使用者追蹤 | ✅ | |
| 支援的提供者 | Anthropic、Vertex AI（Claude）、Bedrock（Claude）、Gemini、Vertex AI | 會自動路由至提供者專屬的 token 計數 API |

## 快速入門 {#quick-start}

### 1. 啟動 LiteLLM Proxy {#1-start-litellm-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 2. 計算 Token {#2-count-tokens}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python
import httpx

response = httpx.post(
    "http://localhost:4000/v1/messages/count_tokens",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-1234"
    },
    json={
        "model": "claude-3-5-sonnet-20241022",
        "messages": [
            {"role": "user", "content": "Hello, how are you?"}
        ]
    }
)

print(response.json())
# {"input_tokens": 14}
```

</TabItem>
</Tabs>

**預期回應：**

```json
{
  "input_tokens": 14
}
```

## LiteLLM Proxy 設定 {#litellm-proxy-configuration}

將模型新增至您的 `config.yaml`：

```yaml
model_list:
  - model_name: claude-3-5-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-vertex
    litellm_params:
      model: vertex_ai/claude-3-5-sonnet-v2@20241022
      vertex_project: my-project
      vertex_location: us-east5
      vertex_count_tokens_location: us-east5 # Optional: Override location for token counting (count_tokens not available on global location)

  - model_name: claude-bedrock
    litellm_params:
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
      aws_region_name: us-west-2
```

## 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | ✅ | 用於 token 計數的模型 |
| `messages` | array | ✅ | Anthropic 格式的訊息陣列 |

### 訊息格式 {#messages-format}

```json
{
  "messages": [
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ]
}
```

## 回應格式 {#response-format}

```json
{
  "input_tokens": <number>
}
```

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `input_tokens` | integer | 輸入訊息中的 token 數量 |

## 支援的提供者 {#supported-providers}

`/v1/messages/count_tokens` 端點會自動路由至適當的提供者專屬 token 計數 API：

| 提供者 | Token 計數方法 |
|----------|----------------------|
| Anthropic | [Anthropic Token Counting API](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) |
| OpenAI | [OpenAI Responses API `/input_tokens`](https://platform.openai.com/docs/api-reference/responses/input-tokens) — 參閱 [Token Counting](./count_tokens.md) |
| Vertex AI（Claude） | Vertex AI Partner Models Token Counter |
| Bedrock（Claude） | AWS Bedrock CountTokens API |
| Gemini | Google AI Studio countTokens API |
| Vertex AI（Gemini） | Vertex AI countTokens API |

## 範例 {#examples}

### 透過系統訊息計算 Token {#count-tokens-with-system-message}

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
      {"role": "user", "content": "You are a helpful assistant. Please help me write a haiku about programming."}
    ]
  }'
```

### 計算多輪對話的 Token {#count-tokens-for-multi-turn-conversation}

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"},
      {"role": "assistant", "content": "The capital of France is Paris."},
      {"role": "user", "content": "What is its population?"}
    ]
  }'
```

### 搭配 Vertex AI Claude 使用 {#using-with-vertex-ai-claude}

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "claude-vertex",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

### 搭配 Bedrock Claude 使用 {#using-with-bedrock-claude}

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "claude-bedrock",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

## 與 Anthropic 轉送相比 {#comparison-with-anthropic-passthrough}

LiteLLM 提供兩種計算 token 的方式：

| 端點 | 說明 | 使用情境 |
|----------|-------------|----------|
| `/v1/messages/count_tokens` | LiteLLM 的 Anthropic 相容端點 | 可與所有支援的提供者（Anthropic、Vertex AI、Bedrock 等）搭配使用 |
| `/anthropic/v1/messages/count_tokens` | [轉送至 Anthropic API](./pass_through/anthropic_completion.md#example-2-token-counting-api) | 直接存取 Anthropic API，使用原生標頭 |

### 轉送範例 {#pass-through-example}

若要直接存取 Anthropic API 並保留完整原生標頭：

```bash
curl --request POST \
    --url http://0.0.0.0:4000/anthropic/v1/messages/count_tokens \
    --header "x-api-key: $LITELLM_API_KEY" \
    --header "anthropic-version: 2023-06-01" \
    --header "anthropic-beta: token-counting-2024-11-01" \
    --header "content-type: application/json" \
    --data '{
        "model": "claude-3-5-sonnet-20241022",
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'
```
