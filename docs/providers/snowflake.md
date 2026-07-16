---
sidebar_label: Snowflake Cortex
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Snowflake Cortex {#snowflake-cortex}

LiteLLM 支援 Snowflake Cortex REST API 上的所有模型，包括 Anthropic（Claude）、OpenAI（GPT）、Meta（Llama）、Mistral、DeepSeek，以及 Snowflake 的模型。

| | |
|---|---|
| 說明 | Snowflake Cortex REST API 透過相容 OpenAI 與相容 Anthropic 的端點，提供對領先前沿 LLM 的存取。所有推論都在 Snowflake 的安全邊界內執行。 |
| LiteLLM 提供者路由 | `snowflake/` |
| Provider Docs | [Cortex REST API ↗](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api) |
| API Endpoints | Chat Completions: `https://{account}.snowflakecomputing.com/api/v2/cortex/v1/chat/completions` <br/> Messages: `https://{account}.snowflakecomputing.com/api/v2/cortex/v1/messages` <br/> Legacy: `https://{account}.snowflakecomputing.com/api/v2/cortex/inference:complete` |
| 支援的 OpenAI 端點 | `/chat/completions`, `/completions`, `/embeddings` |

提示：我們支援所有 Snowflake Cortex 模型。傳送 LiteLLM 請求時，請使用 `model=snowflake/<model-name>` 作為前綴。

## 驗證 {#authentication}

Snowflake Cortex REST API 支援三種驗證方法。

### Programmatic Access Token (PAT) — 建議 {#programmatic-access-token-pat--recommended}

最簡單的方法。在 Snowsight 的 **User Menu → My Profile → Programmatic Access Tokens** 中產生 PAT。

```python
import os
from litellm import completion

os.environ["SNOWFLAKE_API_KEY"] = "pat/<your-programmatic-access-token>"
os.environ["SNOWFLAKE_API_BASE"] = "https://<account>.snowflakecomputing.com/api/v2/cortex/v1"

response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

### JWT（金鑰配對驗證） {#jwt-key-pair-authentication}

從 Snowflake 金鑰組產生 JWT。請參閱 [Key-pair authentication](https://docs.snowflake.com/en/user-guide/key-pair-auth)。

```python
import os
from litellm import completion

os.environ["SNOWFLAKE_JWT"] = "<your-jwt-token>"
os.environ["SNOWFLAKE_ACCOUNT_ID"] = "<orgname>-<account_name>"

response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

### 將憑證作為參數傳遞 {#pass-credentials-as-parameters}

```python
from litellm import completion

# Using PAT
response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="pat/<your-pat-token>",
    api_base="https://<account>.snowflakecomputing.com/api/v2/cortex/v1",
)

# Using JWT
response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="<your-jwt-token>",
    account_id="<orgname>-<account_name>",
)
```

關於所有驗證選項，請參閱 [Authenticating to Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api#authenticating-cortex-rest-api-requests)。

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["SNOWFLAKE_API_KEY"] = "pat/<your-pat>"
os.environ["SNOWFLAKE_API_BASE"] = "https://<account>.snowflakecomputing.com/api/v2/cortex/v1"

response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "What is Snowflake Cortex?"}],
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**1. 設定**

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: snowflake/claude-sonnet-4-5
      api_key: pat/<your-pat>
      api_base: https://<account>.snowflakecomputing.com/api/v2/cortex/v1
  - model_name: llama4-maverick
    litellm_params:
      model: snowflake/llama4-maverick
      api_key: pat/<your-pat>
      api_base: https://<account>.snowflakecomputing.com/api/v2/cortex/v1
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "claude-sonnet",
    "messages": [
        {"role": "user", "content": "What is Snowflake Cortex?"}
    ]
}'
```

</TabItem>
</Tabs>

## 支援的 OpenAI 參數 {#supported-openai-parameters}

```
temperature, max_tokens, top_p, stream, response_format,
tools, tool_choice
```

## 串流 {#streaming}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["SNOWFLAKE_API_KEY"] = "pat/<your-pat>"
os.environ["SNOWFLAKE_API_BASE"] = "https://<account>.snowflakecomputing.com/api/v2/cortex/v1"

response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Write a haiku about data."}],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "claude-sonnet",
    "messages": [{"role": "user", "content": "Write a haiku about data."}],
    "stream": true
}'
```

</TabItem>
</Tabs>

## 工具 / Function Calling {#tool--function-calling}

支援 Claude 和部分模型。LiteLLM 會自動將 OpenAI 工具格式轉換為 Snowflake 的 `tool_spec` 格式。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os, json

os.environ["SNOWFLAKE_API_KEY"] = "pat/<your-pat>"
os.environ["SNOWFLAKE_API_BASE"] = "https://<account>.snowflakecomputing.com/api/v2/cortex/v1"

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"}
                },
                "required": ["location"],
            },
        },
    }
]

response = completion(
    model="snowflake/claude-sonnet-4-5",
    messages=[{"role": "user", "content": "What's the weather in San Francisco?"}],
    tools=tools,
    tool_choice="auto",
)

print(response.choices[0].message.tool_calls)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: snowflake/claude-sonnet-4-5
      api_key: pat/<your-pat>
      api_base: https://<account>.snowflakecomputing.com/api/v2/cortex/v1
```

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "claude-sonnet",
    "messages": [{"role": "user", "content": "What is the weather in SF?"}],
    "tools": [{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather for a location",
            "parameters": {
                "type": "object",
                "properties": {"location": {"type": "string"}},
                "required": ["location"]
            }
        }
    }],
    "tool_choice": "auto"
}'
```

</TabItem>
</Tabs>

## 思考 / 推理 {#thinking--reasoning}

Cortex 上的 Claude 3.7 Sonnet、Claude 4 Opus 和 DeepSeek R1 支援延伸思考。LiteLLM 會將 `reasoning_effort` 轉換為提供者的 thinking 參數。

| `reasoning_effort` | `budget_tokens` |
|---|---|
| `"low"` | 1024 |
| `"medium"` | 2048 |
| `"high"` | 4096 |

```python
from litellm import completion

response = completion(
    model="snowflake/claude-3-7-sonnet",
    messages=[{"role": "user", "content": "Solve: what is 127 * 389?"}],
    reasoning_effort="low",
)
print(response.choices[0].message.content)
```

## 提示快取 {#prompt-caching}

Snowflake Cortex 支援提示快取以降低成本：

- **OpenAI models**：對於 ≥ 1,024 個 token 的提示進行隱式快取（不需要變更程式碼）
- **Claude models**：透過 `cache_control` breakpoint 進行顯式快取

當快取的輸入 token ≥ 1,024 時，快取的輸入 token 會以**一般輸入費率的 10%** 計費（折扣 90%）。

詳情請參閱 [Cortex REST API Billing & Cost Analysis](https://www.snowflake.com/en/developers/guides/cortex-rest-api-billing-cost/)。

## 嵌入 {#embeddings}

```python
from litellm import embedding
import os

os.environ["SNOWFLAKE_API_KEY"] = "pat/<your-pat>"
os.environ["SNOWFLAKE_API_BASE"] = "https://<account>.snowflakecomputing.com/api/v2/cortex/v1"

response = embedding(
    model="snowflake/snowflake-arctic-embed-l-v2.0",
    input=["Snowflake Cortex provides LLM inference"],
)
print(response.data[0]["embedding"][:5])
```

## 支援的模型 {#supported-models}

所有模型都可透過 `snowflake/` 前綴使用。

:::tip
如需目前的模型可用性、速率限制與價格，請參閱官方 [Cortex REST API docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api) 與 [Service Consumption Table](https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf)。
:::

### 聊天完成模型 {#chat-completion-models}

| 模型 | `litellm` model name | Function Calling | Vision | Prompt Caching |
|---|---|---|---|---|
| Claude Sonnet 4.5 | `snowflake/claude-sonnet-4-5` | ✅ | ✅ | ✅ |
| Claude Sonnet 4.6 | `snowflake/claude-sonnet-4-6` | ✅ | ✅ | ✅ |
| Claude 4 Sonnet | `snowflake/claude-4-sonnet` | ✅ | ✅ | ✅ |
| Claude 4 Opus | `snowflake/claude-4-opus` | ✅ | ✅ | ✅ |
| Claude Haiku 4.5 | `snowflake/claude-haiku-4-5` | ✅ | ✅ | ✅ |
| Claude 3.7 Sonnet | `snowflake/claude-3-7-sonnet` | ✅ | ✅ | ✅ |
| Claude 3.5 Sonnet | `snowflake/claude-3-5-sonnet` | ✅ | ✅ | ✅ |
| OpenAI GPT-4.1 | `snowflake/openai-gpt-4.1` | ✅ | ✅ | ✅ |
| OpenAI GPT-5 | `snowflake/openai-gpt-5` | ✅ | ✅ | ✅ |
| OpenAI GPT-5 Mini | `snowflake/openai-gpt-5-mini` | ✅ | | |
| OpenAI GPT-5 Nano | `snowflake/openai-gpt-5-nano` | ✅ | | |
| DeepSeek R1 | `snowflake/deepseek-r1` | | | |
| Mistral Large 2 | `snowflake/mistral-large2` | ✅ | | |
| Llama 3.1 8B | `snowflake/llama3.1-8b` | | | |
| Llama 3.1 70B | `snowflake/llama3.1-70b` | ✅ | | |
| Llama 3.1 405B | `snowflake/llama3.1-405b` | ✅ | | |
| Llama 3.3 70B | `snowflake/llama3.3-70b` | ✅ | | |
| Llama 4 Maverick | `snowflake/llama4-maverick` | ✅ | | |
| Snowflake Llama 3.3 70B | `snowflake/snowflake-llama-3.3-70b` | ✅ | | |

### 嵌入模型 {#embedding-models}

| 模型 | `litellm` model name |
|---|---|
| Snowflake Arctic Embed L v2.0 | `snowflake/snowflake-arctic-embed-l-v2.0` |
| Snowflake Arctic Embed M v2.0 | `snowflake/snowflake-arctic-embed-m-v2.0` |
