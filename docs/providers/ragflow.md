import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# RAGFlow {#ragflow}

Litellm 支援 Ragflow 的 chat completions API

## 支援的功能 {#supported-features}

- ✅ 聊天 completions
- ✅ 串流回應
- ✅ 聊天與 agent 端點皆支援
- ✅ 多種認證來源（params、env vars、litellm_params）
- ✅ 相容 OpenAI 的 API 格式

## API 金鑰 {#api-key}

```python
# env variable
os.environ['RAGFLOW_API_KEY']
```

## API 基底網址 {#api-base}

```python
# env variable
os.environ['RAGFLOW_API_BASE']
```

## 概觀 {#overview}

RAGFlow 提供相容 OpenAI 的 API，且具有包含 chat 與 agent ID 的獨特路徑結構：

- **聊天端點**：`/api/v1/chats_openai/{chat_id}/chat/completions`
- **Agent 端點**：`/api/v1/agents_openai/{agent_id}/chat/completions`

模型名稱格式會內嵌端點類型與 ID：
- Chat：`ragflow/chat/{chat_id}/{model_name}`
- Agent：`ragflow/agent/{agent_id}/{model_name}`

## 範例用法 - 聊天端點 {#sample-usage---chat-endpoint}

```python
from litellm import completion
import os

os.environ['RAGFLOW_API_KEY'] = "your-ragflow-api-key"
os.environ['RAGFLOW_API_BASE'] = "http://localhost:9380"  # or your hosted URL

response = completion(
    model="ragflow/chat/my-chat-id/gpt-4o-mini",
    messages=[{"role": "user", "content": "How does the deep doc understanding work?"}]
)
print(response)
```

## 範例用法 - Agent 端點 {#sample-usage---agent-endpoint}

```python
from litellm import completion
import os

os.environ['RAGFLOW_API_KEY'] = "your-ragflow-api-key"
os.environ['RAGFLOW_API_BASE'] = "http://localhost:9380"  # or your hosted URL

response = completion(
    model="ragflow/agent/my-agent-id/gpt-4o-mini",
    messages=[{"role": "user", "content": "What are the key features?"}]
)
print(response)
```

## 範例用法 - 使用參數 {#sample-usage---with-parameters}

您也可以直接將 `api_key` 和 `api_base` 作為參數傳入：

```python
from litellm import completion

response = completion(
    model="ragflow/chat/my-chat-id/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="your-ragflow-api-key",
    api_base="http://localhost:9380"
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}

```python
from litellm import completion
import os

os.environ['RAGFLOW_API_KEY'] = "your-ragflow-api-key"
os.environ['RAGFLOW_API_BASE'] = "http://localhost:9380"

response = completion(
    model="ragflow/agent/my-agent-id/gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain RAGFlow"}],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 模型名稱格式 {#model-name-format}

模型名稱必須符合以下其中一種格式：

### 聊天端點 {#chat-endpoint}
```
ragflow/chat/{chat_id}/{model_name}
```

範例：`ragflow/chat/my-chat-id/gpt-4o-mini`

### Agent 端點 {#agent-endpoint}
```
ragflow/agent/{agent_id}/{model_name}
```

範例：`ragflow/agent/my-agent-id/gpt-4o-mini`

其中：
- `{chat_id}` 或 `{agent_id}` 是您在 RAGFlow 中的 chat 或 agent ID
- `{model_name}` 是實際的模型名稱（例如 `gpt-4o-mini`、`gpt-4o` 等）

## 設定來源 {#configuration-sources}

LiteLLM 支援多種提供認證資訊的方式，並依照以下順序檢查：

1. **函式參數**：`api_key="..."`、`api_base="..."`
2. **litellm_params**：`litellm_params={"api_key": "...", "api_base": "..."}`
3. **環境變數**：`RAGFLOW_API_KEY`、`RAGFLOW_API_BASE`
4. **全域 litellm 設定**：`litellm.api_key`、`litellm.api_base`

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export RAGFLOW_API_KEY="your-ragflow-api-key"
export RAGFLOW_API_BASE="http://localhost:9380"
```

### 2. 啟動 proxy {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: ragflow-chat-gpt4
    litellm_params:
      model: ragflow/chat/my-chat-id/gpt-4o-mini
      api_key: os.environ/RAGFLOW_API_KEY
      api_base: os.environ/RAGFLOW_API_BASE
  - model_name: ragflow-agent-gpt4
    litellm_params:
      model: ragflow/agent/my-agent-id/gpt-4o-mini
      api_key: os.environ/RAGFLOW_API_KEY
      api_base: os.environ/RAGFLOW_API_BASE
```

</TabItem>
<TabItem value="cli" label="CLI">

```bash
$ litellm --config /path/to/config.yaml

# Server running on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "ragflow-chat-gpt4",
    "messages": [
      {"role": "user", "content": "How does RAGFlow work?"}
    ]
  }'
```

</TabItem>
<TabItem value="Python" label="Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",  # Your LiteLLM proxy key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="ragflow-chat-gpt4",
    messages=[
        {"role": "user", "content": "How does RAGFlow work?"}
    ]
)
print(response)
```

</TabItem>
</Tabs>

## API 基底網址處理 {#api-base-url-handling}

`api_base` 參數可帶有或不帶有 `/v1` 後綴。LiteLLM 會自動處理：

- `http://localhost:9380` → `http://localhost:9380/api/v1/chats_openai/{chat_id}/chat/completions`
- `http://localhost:9380/v1` → `http://localhost:9380/api/v1/chats_openai/{chat_id}/chat/completions`
- `http://localhost:9380/api/v1` → `http://localhost:9380/api/v1/chats_openai/{chat_id}/chat/completions`

這三種格式都可正常運作。

## 錯誤處理 {#error-handling}

如果您遇到錯誤：

1. **無效的模型格式**：請確認您的模型名稱符合 `ragflow/{chat|agent}/{id}/{model_name}` 格式
2. **缺少 api_base**：透過參數、環境變數或 litellm_params 提供 `api_base`
3. **連線錯誤**：驗證您的 RAGFlow 伺服器正在執行，且可透過提供的 `api_base` 存取

:::info

如需更多關於傳入 provider-specific 參數的資訊，請[前往此處](../completion/provider_specific_params.md)

:::
