import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /responses/compact {#responsescompact}

使用 OpenAI 的 `/responses/compact` 端點壓縮對話歷史。

| 功能 | 支援 |
|---------|-----------|
| 支援的 LiteLLM 版本 | 1.72.0+ |
| 支援的提供者 | `openai` |

## 用法 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Compact Response"
import litellm

response = litellm.compact_responses(
    model="openai/gpt-4o",
    input=[{"role": "user", "content": "Hello, how are you?"}],
    instructions="Be helpful",
    previous_response_id="resp_abc123"  # optional
)

print(response.id)
print(response.object)  # "response.compaction"
print(response.output)
```

### LiteLLM Proxy {#litellm-proxy}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Compact Request"
curl http://localhost:4000/v1/responses/compact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "openai/gpt-4o",
    "input": [{"role": "user", "content": "Hello"}],
    "instructions": "Be helpful"
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Compact with OpenAI SDK"
import httpx

response = httpx.post(
    "http://localhost:4000/v1/responses/compact",
    headers={"Authorization": "Bearer sk-1234"},
    json={
        "model": "openai/gpt-4o",
        "input": [{"role": "user", "content": "Hello"}],
        "instructions": "Be helpful"
    }
)

print(response.json())
```

</TabItem>
</Tabs>

## 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 描述 |
|-----------|------|----------|-------------|
| `model` | string | 是 | 用於壓縮的模型 |
| `input` | string or array | 是 | 要壓縮的輸入訊息 |
| `instructions` | string | 否 | 系統指示 |
| `previous_response_id` | string | 否 | 要接續的前一個回應 ID |

## 回應格式 {#response-format}

```json
{
  "id": "resp_abc123",
  "object": "response.compaction",
  "created_at": 1734366691,
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [...]
    },
    {
      "type": "compaction",
      "encrypted_content": "..."
    }
  ],
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "total_tokens": 150
  }
}
```
