import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 結構化輸出 /v1/messages {#structured-output-v1messages}

使用 LiteLLM 透過 `/v1/messages` 端點呼叫 Anthropic 的結構化輸出功能。

## 支援的提供者 {#supported-providers}

| 提供者 | 支援 | 備註 |
|----------|-----------|-------|
| Anthropic | ✅ | 原生支援 |
| Azure AI（Anthropic models） | ✅ | Azure AI 上的 Claude models |
| Bedrock（Converse Anthropic models） | ✅ | 透過 Bedrock Converse API 的 Claude models |
| Bedrock（Invoke Anthropic models） | ✅ | 透過 Bedrock Invoke API 的 Claude models |

## 用法 {#usage}

### LiteLLM Proxy 伺服器 {#litellm-proxy-server}

<Tabs>
<TabItem value="anthropic" label="Anthropic">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Extract the key information from this email: John Smith (john@example.com) is interested in our Enterprise plan and wants to schedule a demo for next Tuesday at 2pm."
      }
    ],
    "output_format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"},
          "plan_interest": {"type": "string"},
          "demo_requested": {"type": "boolean"}
        },
        "required": ["name", "email", "plan_interest", "demo_requested"],
        "additionalProperties": false
      }
    }
  }'
```

</TabItem>

<TabItem value="azure_ai" label="Azure AI (Anthropic)">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: azure-claude-sonnet
    litellm_params:
      model: azure_ai/claude-sonnet-4-5-20250514
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: https://your-endpoint.inference.ai.azure.com
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "azure-claude-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Extract the key information from this email: John Smith (john@example.com) is interested in our Enterprise plan and wants to schedule a demo for next Tuesday at 2pm."
      }
    ],
    "output_format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"},
          "plan_interest": {"type": "string"},
          "demo_requested": {"type": "boolean"}
        },
        "required": ["name", "email", "plan_interest", "demo_requested"],
        "additionalProperties": false
      }
    }
  }'
```

</TabItem>

<TabItem value="bedrock" label="Bedrock (Converse)">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-sonnet
    litellm_params:
      model: bedrock/global.anthropic.claude-sonnet-4-5-20250929-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "bedrock-claude-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Extract the key information from this email: John Smith (john@example.com) is interested in our Enterprise plan and wants to schedule a demo for next Tuesday at 2pm."
      }
    ],
    "output_format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"},
          "plan_interest": {"type": "string"},
          "demo_requested": {"type": "boolean"}
        },
        "required": ["name", "email", "plan_interest", "demo_requested"],
        "additionalProperties": false
      }
    }
  }'
```

</TabItem>

<TabItem value="bedrock_invoke" label="Bedrock (Invoke)">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-invoke
    litellm_params:
      model: bedrock/invoke/global.anthropic.claude-sonnet-4-5-20250929-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "bedrock-claude-invoke",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Extract the key information from this email: John Smith (john@example.com) is interested in our Enterprise plan and wants to schedule a demo for next Tuesday at 2pm."
      }
    ],
    "output_format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"},
          "plan_interest": {"type": "string"},
          "demo_requested": {"type": "boolean"}
        },
        "required": ["name", "email", "plan_interest", "demo_requested"],
        "additionalProperties": false
      }
    }
  }'
```


</TabItem>
</Tabs>

## 範例回應 {#example-response}

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"name\":\"John Smith\",\"email\":\"john@example.com\",\"plan_interest\":\"Enterprise\",\"demo_requested\":true}"
    }
  ],
  "model": "claude-sonnet-4-5-20250514",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 75,
    "output_tokens": 28
  }
}
```

## 請求格式 {#request-format}

### output_format {#output_format}

`output_format` 參數指定結構化輸出格式。

```json
{
  "output_format": {
    "type": "json_schema",
    "schema": {
      "type": "object",
      "properties": {
        "field_name": {"type": "string"},
        "another_field": {"type": "integer"}
      },
      "required": ["field_name", "another_field"],
      "additionalProperties": false
    }
  }
}
```

#### 欄位 {#fields}

- **type** (string): 必須是 `"json_schema"`
- **schema** (object): 定義預期輸出結構的 JSON Schema 物件
  - **type** (string): 根類型，通常是 `"object"`
  - **properties** (object): 定義欄位及其型別
  - **required** (array): 必填欄位名稱清單
  - **additionalProperties** (boolean): 設為 `false` 以強制嚴格遵循 schema
