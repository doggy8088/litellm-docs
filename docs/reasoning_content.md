import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 「思考」/「推理內容」 {#thinking--reasoning-content}

:::info

需要 LiteLLM v1.63.0+

:::

支援的提供者：
- Deepseek (`deepseek/`)
- Anthropic API (`anthropic/`)
- Bedrock（Anthropic + Deepseek + GPT-OSS）(`bedrock/`)
- OpenAI Responses API (`openai/responses/`)
- Vertex AI（Anthropic）(`vertexai/`)
- OpenRouter (`openrouter/`)
- XAI (`xai/`)
- Google AI Studio (`google/`)
- Vertex AI (`vertex_ai/`)
- Perplexity (`perplexity/`)
- Mistral AI（Magistral models）(`mistral/`)
- Groq (`groq/`)

LiteLLM 會將回應中的 `reasoning_content` 和助理訊息中的 `thinking_blocks` 標準化。

```python title="Example response from litellm"
"message": {
    ...
    "reasoning_content": "The capital of France is Paris.",
    "thinking_blocks": [ # only returned for Anthropic models
        {
            "type": "thinking",
            "thinking": "The capital of France is Paris.",
            "signature": "EqoBCkgIARABGAIiQL2UoU0b1OHYi+..."
        }
    ]
}
```

## 快速開始  {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
from litellm import completion
import os 

os.environ["ANTHROPIC_API_KEY"] = ""

response = completion(
  model="anthropic/claude-3-7-sonnet-20250219",
  messages=[
    {"role": "user", "content": "What is the capital of France?"},
  ],
  reasoning_effort="low", 
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "reasoning_effort": "low"
}'
```
</TabItem>
</Tabs>

**預期回應**

```bash
{
    "id": "3b66124d79a708e10c603496b363574c",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": " won the FIFA World Cup in 2022.",
                "role": "assistant",
                "tool_calls": null,
                "function_call": null
            }
        }
    ],
    "created": 1723323084,
    "model": "deepseek/deepseek-chat",
    "object": "chat.completion",
    "system_fingerprint": "fp_7e0991cad4",
    "usage": {
        "completion_tokens": 12,
        "prompt_tokens": 16,
        "total_tokens": 28,
    },
    "service_tier": null
}
```

## 使用 `thinking` 的工具呼叫 {#tool-calling-with-thinking}

以下說明如何搭配工具呼叫使用 Anthropic 的 `thinking` 區塊。

### 重要：OpenAI 相容 API 的限制 {#important-openai-compatible-api-limitations}

:::warning 相容性注意事項

Anthropic 的 extended thinking 搭配工具呼叫，與 OpenAI 相容 API 用戶端 **並非完全相容**。這是因為 OpenAI 與 Anthropic 在多輪對話中處理推理的架構有根本差異。

:::

當使用啟用 `thinking` 且有工具呼叫的 Anthropic 模型時，您 **必須包含 `thinking_blocks`**，也就是前一次助理回應中的內容，並在將工具結果送回時一併傳入。若未這麼做，將會產生 `400 Bad Request` 錯誤。

**OpenAI 與 Anthropic 架構：**

| 提供者 | API 架構 | 推理儲存 | 多輪處理 |
|----------|------------------|-------------------|---------------------|
| **OpenAI** (o1, o3) | Responses API（有狀態） | 伺服器端 | 伺服器會在內部儲存推理；用戶端會傳送 `previous_response_id` |
| **Anthropic** (Claude) | Messages API（無狀態） | 用戶端 | 用戶端必須儲存並在每次請求時重新傳送 `thinking_blocks` |

1. OpenAI 的 Chat Completions 規格 **沒有欄位**可用於 `thinking_blocks`
2. OpenAI 相容用戶端（LibreChat、Open WebUI、Vercel AI SDK 等）會 **忽略** 回應中的 `thinking_blocks` 欄位
3. 這些用戶端在重建下一輪的助理訊息時，thinking blocks 會遺失
4. Anthropic 會拒絕該請求，因為助理訊息不是以 thinking block 開頭

:::tip LiteLLM supports thinking_blocks
LiteLLM 的 `completion()` API **確實支援** 在助理訊息中傳送 `thinking_blocks`。如果您是直接使用 LiteLLM（不是透過 OpenAI 相容用戶端），就可以保留並重新傳送 `thinking_blocks`，一切都會正常運作。
:::

**解決方案：**

1. **使用 LiteLLM 內建的因應措施**（建議）：設定 `litellm.modify_params = True`，當 `thinking` 缺失時，LiteLLM 會自動透過移除 `thinking_blocks` 參數來處理此不相容問題（見下方）
2. **給用戶端開發者**：明確處理並重新傳送 `thinking_blocks` 欄位（見下方範例）
3. **在使用工具且搭配不支援 `thinking_blocks` 的 OpenAI 相容用戶端時，停用 extended thinking**
4. **直接使用 Anthropic 的原生 API**，而不是 OpenAI 相容端點

### LiteLLM 內建因應措施 {#litellm-built-in-workaround}

當設定 `modify_params=True` 時，LiteLLM 可以自動處理此不相容問題。如果用戶端送出啟用 `thinking` 的請求，但帶有 `tool_calls` 的助理訊息缺少 `thinking_blocks`，LiteLLM 會自動在該輪移除 `thinking` 參數，以避免錯誤。

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
import litellm

# Enable automatic parameter modification
litellm.modify_params = True

# Now this will work even if thinking_blocks are missing from the assistant message
response = litellm.completion(
    model="anthropic/claude-sonnet-4-20250514",
    thinking={"type": "enabled", "budget_tokens": 1024},
    tools=[...],
    messages=[
        {"role": "user", "content": "What's the weather in Madrid?"},
        {
            "role": "assistant",
            "tool_calls": [{"id": "call_123", "type": "function", "function": {"name": "get_weather", "arguments": '{"city": "Madrid"}'}}]
            # Note: thinking_blocks is missing here - LiteLLM will handle it
        },
        {"role": "tool", "tool_call_id": "call_123", "content": "22°C sunny"}
    ]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  modify_params: true  # Enable automatic parameter modification

model_list:
  - model_name: claude-thinking
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      thinking:
        type: enabled
        budget_tokens: 1024
```

</TabItem>
</Tabs>

:::info
當 `modify_params=True` 且 LiteLLM 移除 `thinking` 參數時，模型在該輪 **不會** 使用 extended thinking。對話會正常繼續，但該次回應不會有推理。
:::

**正確包含 `thinking_blocks` 的方式：**

```python
# After receiving a response with tool_calls, include thinking_blocks when sending back:
assistant_message = {
    "role": "assistant",
    "content": response.choices[0].message.content,
    "tool_calls": [...],
    "thinking_blocks": response.choices[0].message.thinking_blocks  # ← Required!
}
```

---

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
litellm._turn_on_debug()
litellm.modify_params = True
model = "anthropic/claude-3-7-sonnet-20250219" # works across Anthropic, Bedrock, Vertex AI
# Step 1: send the conversation and available functions to the model
messages = [
    {
        "role": "user",
        "content": "What's the weather like in San Francisco, Tokyo, and Paris? - give me 3 responses",
    }
]
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                    },
                },
                "required": ["location"],
            },
        },
    }
]
response = litellm.completion(
    model=model,
    messages=messages,
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
    reasoning_effort="low",
)
print("Response\n", response)
response_message = response.choices[0].message
tool_calls = response_message.tool_calls

print("Expecting there to be 3 tool calls")
assert (
    len(tool_calls) > 0
)  # this has to call the function for SF, Tokyo and paris

# Step 2: check if the model wanted to call a function
print(f"tool_calls: {tool_calls}")
if tool_calls:
    # Step 3: call the function
    # Note: the JSON response may not always be valid; be sure to handle errors
    available_functions = {
        "get_current_weather": get_current_weather,
    }  # only one function in this example, but you can have multiple
    messages.append(
        response_message
    )  # extend conversation with assistant's reply
    print("Response message\n", response_message)
    # Step 4: send the info for each function call and function response to the model
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        if function_name not in available_functions:
            # the model called a function that does not exist in available_functions - don't try calling anything
            return
        function_to_call = available_functions[function_name]
        function_args = json.loads(tool_call.function.arguments)
        function_response = function_to_call(
            location=function_args.get("location"),
            unit=function_args.get("unit"),
        )
        messages.append(
            {
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": function_response,
            }
        )  # extend conversation with function response
    print(f"messages: {messages}")
    second_response = litellm.completion(
        model=model,
        messages=messages,
        seed=22,
        reasoning_effort="low",
        # tools=tools,
        drop_params=True,
    )  # get a new response from the model where it can see the function response
    print("second response\n", second_response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml showLineNumbers
model_list:
  - model_name: claude-3-7-sonnet-thinking
    litellm_params:
      model: anthropic/claude-3-7-sonnet-20250219
      api_key: os.environ/ANTHROPIC_API_KEY
      thinking: {
        "type": "enabled",
        "budget_tokens": 1024
      }
```

2. 啟動 proxy

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 發出第 1 次呼叫

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-3-7-sonnet-thinking",
    "messages": [
      {"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris? - give me 3 responses"},
    ],
    "tools": [
        {
          "type": "function",
          "function": {
              "name": "get_current_weather",
              "description": "Get the current weather in a given location",
              "parameters": {
                  "type": "object",
                  "properties": {
                      "location": {
                          "type": "string",
                          "description": "The city and state",
                      },
                      "unit": {
                          "type": "string",
                          "enum": ["celsius", "fahrenheit"],
                      },
                  },
                  "required": ["location"],
              },
          },
        }
    ],
    "tool_choice": "auto"
  }'
```

4. 連同工具呼叫結果發出第 2 次呼叫

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "claude-3-7-sonnet-thinking",
    "messages": [
      {
        "role": "user",
        "content": "What\'s the weather like in San Francisco, Tokyo, and Paris? - give me 3 responses"
      },
      {
        "role": "assistant",
        "content": "I\'ll check the current weather for these three cities for you:",
        "tool_calls": [
          {
            "index": 2,
            "function": {
              "arguments": "{\"location\": \"San Francisco\"}",
              "name": "get_current_weather"
            },
            "id": "tooluse_mnqzmtWYRjCxUInuAdK7-w",
            "type": "function"
          }
        ],
        "function_call": null,
        "reasoning_content": "The user is asking for the current weather in three different locations: San Francisco, Tokyo, and Paris. I have access to the `get_current_weather` function that can provide this information.\n\nThe function requires a `location` parameter, and has an optional `unit` parameter. The user hasn't specified which unit they prefer (celsius or fahrenheit), so I'll use the default provided by the function.\n\nI need to make three separate function calls, one for each location:\n1. San Francisco\n2. Tokyo\n3. Paris\n\nThen I'll compile the results into a response with three distinct weather reports as requested by the user.",
        "thinking_blocks": [
          {
            "type": "thinking",
            "thinking": "The user is asking for the current weather in three different locations: San Francisco, Tokyo, and Paris. I have access to the `get_current_weather` function that can provide this information.\n\nThe function requires a `location` parameter, and has an optional `unit` parameter. The user hasn't specified which unit they prefer (celsius or fahrenheit), so I'll use the default provided by the function.\n\nI need to make three separate function calls, one for each location:\n1. San Francisco\n2. Tokyo\n3. Paris\n\nThen I'll compile the results into a response with three distinct weather reports as requested by the user.",
            "signature": "EqoBCkgIARABGAIiQCkBXENoyB+HstUOs/iGjG+bvDbIQRrxPsPpOSt5yDxX6iulZ/4K/w9Rt4J5Nb2+3XUYsyOH+CpZMfADYvItFR4SDPb7CmzoGKoolCMAJRoM62p1ZRASZhrD3swqIjAVY7vOAFWKZyPEJglfX/60+bJphN9W1wXR6rWrqn3MwUbQ5Mb/pnpeb10HMploRgUqEGKOd6fRKTkUoNDuAnPb55c="
          }
        ],
        "provider_specific_fields": {
          "reasoningContentBlocks": [
            {
              "reasoningText": {
                "signature": "EqoBCkgIARABGAIiQCkBXENoyB+HstUOs/iGjG+bvDbIQRrxPsPpOSt5yDxX6iulZ/4K/w9Rt4J5Nb2+3XUYsyOH+CpZMfADYvItFR4SDPb7CmzoGKoolCMAJRoM62p1ZRASZhrD3swqIjAVY7vOAFWKZyPEJglfX/60+bJphN9W1wXR6rWrqn3MwUbQ5Mb/pnpeb10HMploRgUqEGKOd6fRKTkUoNDuAnPb55c=",
                "text": "The user is asking for the current weather in three different locations: San Francisco, Tokyo, and Paris. I have access to the `get_current_weather` function that can provide this information.\n\nThe function requires a `location` parameter, and has an optional `unit` parameter. The user hasn't specified which unit they prefer (celsius or fahrenheit), so I'll use the default provided by the function.\n\nI need to make three separate function calls, one for each location:\n1. San Francisco\n2. Tokyo\n3. Paris\n\nThen I'll compile the results into a response with three distinct weather reports as requested by the user."
              }
            }
          ]
        }
      },
      {
        "tool_call_id": "tooluse_mnqzmtWYRjCxUInuAdK7-w",
        "role": "tool",
        "name": "get_current_weather",
        "content": "{\"location\": \"San Francisco\", \"temperature\": \"72\", \"unit\": \"fahrenheit\"}"
      }
    ]
  }'
```

</TabItem>
</Tabs>

## 在 Anthropic + Deepseek 模型之間切換  {#switching-between-anthropic--deepseek-models}

將 `drop_params=True` 設為在從 Anthropic 切換到 Deepseek 模型時移除 'thinking' 區塊。可在[這裡](https://github.com/BerriAI/litellm/discussions/8927)提出對此做法的改進建議。

```python showLineNumbers
litellm.drop_params = True # 👈 EITHER GLOBALLY or per request

# or per request
## Anthropic
response = litellm.completion(
  model="anthropic/claude-3-7-sonnet-20250219",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  reasoning_effort="low",
  drop_params=True,
)

## Deepseek
response = litellm.completion(
  model="deepseek/deepseek-chat",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  reasoning_effort="low",
  drop_params=True,
)
```

## 規格  {#spec}

這些欄位可透過 `response.choices[0].message.reasoning_content` 和 `response.choices[0].message.thinking_blocks` 存取。

- `reasoning_content` - str：來自模型的推理內容。所有提供者皆會回傳。
- `thinking_blocks` - Optional[List[Dict[str, str]]]：來自模型的 thinking blocks 清單。僅 Anthropic 模型會回傳。
  - `type` - str：thinking block 的類型。
  - `thinking` - str：來自模型的 thinking。
  - `signature` - str：來自模型的 signature delta。

## 將 `thinking` 傳給 Anthropic 模型 {#pass-thinking-to-anthropic-models}

您也可以將 `thinking` 參數傳給 Anthropic 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
response = litellm.completion(
  model="anthropic/claude-3-7-sonnet-20250219",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  thinking={"type": "enabled", "budget_tokens": 1024},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "thinking": {"type": "enabled", "budget_tokens": 1024}
  }'
```

</TabItem>
</Tabs>

## 檢查模型是否支援推理 {#checking-if-a-model-supports-reasoning}

<Tabs>
<TabItem label="LiteLLM Python SDK" value="Python">

使用 `litellm.supports_reasoning(model="")` -> 若模型支援推理則回傳 `True`，否則回傳 `False`。

```python showLineNumbers title="litellm.supports_reasoning() usage"
import litellm 

# Example models that support reasoning
assert litellm.supports_reasoning(model="anthropic/claude-3-7-sonnet-20250219") == True
assert litellm.supports_reasoning(model="deepseek/deepseek-chat") == True 

# Example models that do not support reasoning
assert litellm.supports_reasoning(model="openai/gpt-3.5-turbo") == False 
```
</TabItem>

<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在您的 `config.yaml` 中定義支援推理的模型。若 LiteLLM 未能自動偵測您的自訂模型，您也可以選擇在 `model_info` 中加入 `supports_reasoning: True`。

```yaml showLineNumbers title="litellm proxy config.yaml"
model_list:
  - model_name: claude-3-sonnet-reasoning
    litellm_params:
      model: anthropic/claude-3-7-sonnet-20250219
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: deepseek-reasoning
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY
  # Example for a custom model where detection might be needed
  - model_name: my-custom-reasoning-model 
    litellm_params:
      model: openai/my-custom-model # Assuming it's OpenAI compatible
      api_base: http://localhost:8000
      api_key: fake-key
    model_info:
      supports_reasoning: True # Explicitly mark as supporting reasoning
```

2. 啟動 proxy server：

```bash showLineNumbers title="litellm --config config.yaml"
litellm --config config.yaml
```

3. 呼叫 `/model_group/info` 以檢查您的模型是否支援 `reasoning`

```shell showLineNumbers title="curl /model_group/info"
curl -X 'GET' \
  'http://localhost:4000/model_group/info' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-1234'
```

預期回應 

```json showLineNumbers title="response from /model_group/info"
{
  "data": [
    {
      "model_group": "claude-3-sonnet-reasoning",
      "providers": ["anthropic"],
      "mode": "chat",
      "supports_reasoning": true,
    },
    {
      "model_group": "deepseek-reasoning",
      "providers": ["deepseek"],
      "supports_reasoning": true,
    },
    {
      "model_group": "my-custom-reasoning-model",
      "providers": ["openai"],
      "supports_reasoning": true,
    }
  ]
}
````


</TabItem>
</Tabs>

:::tip gpt-5.4: reasoning_effort + function tools

當 `gpt-5.4+` 對 `litellm.completion()` 的請求同時包含 `reasoning_effort` 和 `tools` 時，LiteLLM 會 **自動** 透過 Responses API bridge 來路由該請求。這同時適用於 **OpenAI** (`openai/gpt-5.4`) 與 **Azure** (`azure/gpt-5.4`) 提供者 — 無需額外設定。

您也可以透過 `openai/responses/gpt-5.4` 或 `azure/responses/gpt-5.4` 明確路由。詳情請參閱 [Responses API Bridge](/docs/providers/openai#openai-chat-completion-to-responses-api-bridge)。

**Azure 自訂部署名稱：** 自動路由依賴部署名稱符合 `gpt-5.4*` 模式。若您使用自訂部署名稱（例如 `"my-reasoning-model"`），請透過下列方式啟用路由：

**SDK：**
```python
litellm.completion(model="azure/responses/my-reasoning-model", ...)
```

**Proxy 設定：**
```yaml
model_list:
  - model_name: my-reasoning-model
    litellm_params:
      model: azure/my-reasoning-model
    model_info:
      mode: responses
```

:::

## OpenAI Responses API - 自動摘要控制 {#openai-responses-api---auto-summary-control}

使用 OpenAI Responses API 模型（例如 `gpt-5`）並透過 `/chat/completions` 搭配 `reasoning_effort` 時，您可以控制是否要將 `summary="detailed"` 自動加入 reasoning 參數。

### 啟用自動摘要 {#enabling-auto-summary}

您可以透過兩種方式啟用自動 `summary="detailed"`：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

# Enable auto-summary globally
litellm.reasoning_auto_summary = True

response = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",  # Will automatically add summary="detailed"
)
```

</TabItem>

<TabItem value="env" label="Environment Variable">

```bash
# Set environment variable
export LITELLM_REASONING_AUTO_SUMMARY=true

# Or in your .env file
LITELLM_REASONING_AUTO_SUMMARY=true
```

</TabItem>

<TabItem value="proxy" label="Proxy Config">

```yaml
litellm_settings:
  reasoning_auto_summary: true  # Enable auto-summary for all requests

model_list:
  - model_name: gpt-5-mini
    litellm_params:
      model: openai/responses/gpt-5-mini
```

**每個模型設定**（在使用 Open WebUI 或無法設定 `extra_body` 的用戶端時建議使用）：

```yaml
model_list:
  - model_name: gpt-5.1
    litellm_params:
      model: openai/gpt-5.1
      # String format - uses reasoning_auto_summary for summary when set
      reasoning_effort: "high"
    model_info:
      mode: responses  # if using Responses API bridge

  - model_name: gpt-5.1-with-summary
    litellm_params:
      model: openai/gpt-5.1
      # Dict format - explicit control over effort and summary
      reasoning_effort: {"effort": "high", "summary": "detailed"}
```

</TabItem>
</Tabs>

### 手動控制（建議） {#manual-control-recommended}

若要進行細緻控制，請將 `reasoning_effort` 以字典形式傳入：

```python
response = litellm.completion(
    model="openai/responses/gpt-5-mini",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort={"effort": "low", "summary": "detailed"},  # Explicit control
)
```

### 透過 `/v1/messages` Adapter 保留摘要 {#summary-preservation-via-v1messages-adapter}

使用 Anthropic `/v1/messages` adapter 將請求路由到非 Claude 模型（例如 `openai/gpt-5.1`）時，`thinking.summary` 值會被保留並轉送至下游提供者。範例如下：

```python
import litellm

response = await litellm.anthropic.messages.acreate(
    model="openai/gpt-5.1",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=8096,
    thinking={"type": "enabled", "budget_tokens": 5000, "summary": "concise"},
)
# The summary="concise" is preserved when routing to OpenAI's Responses API
```

### 為 `/v1/messages` Adapter 啟用預設摘要注入 {#enabling-default-summary-injection-for-v1messages-adapter}

當 Anthropic `/v1/messages` adapter 將非 Claude 模型的 `thinking` 參數轉換為 OpenAI `reasoning_effort` 時，您可以透過 `summary="detailed"` 旗標選擇啟用自動 `reasoning_auto_summary` 注入。這可確保推理文字會在回應中傳回（與 Anthropic thinking 行為一致）。

若要**啟用**此預設注入，請使用 `reasoning_auto_summary` 旗標：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

# Enable default summary="detailed" injection
litellm.reasoning_auto_summary = True

response = await litellm.anthropic.messages.acreate(
    model="openai/gpt-5.1",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=8096,
    thinking={"type": "enabled", "budget_tokens": 5000},
)
# summary="detailed" will be automatically added to reasoning_effort
```

</TabItem>

<TabItem value="env" label="環境變數">

```bash
export LITELLM_REASONING_AUTO_SUMMARY=true
```

</TabItem>

<TabItem value="proxy" label="代理設定">

```yaml
litellm_settings:
  reasoning_auto_summary: true
```

</TabItem>
</Tabs>

:::info

此旗標只會在沒有使用者提供的摘要時，影響 `summary="detailed"` 的自動注入。若您明確傳入 `thinking.summary`（例如 `"concise"` 或 `"auto"`），無論此旗標為何，您的值都會一律保留。

:::
