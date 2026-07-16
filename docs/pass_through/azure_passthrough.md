# Azure 直通 {#azure-passthrough}

`/azure` 的直通端點

## 總覽 {#overview}

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ❌ | 不支援 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | 完整支援 |

### 什麼時候使用這個？ {#when-to-use-this}

- 對於大多數使用情境，您應該使用 [原生 LiteLLM Azure OpenAI 整合](../providers/azure/azure) (`/chat/completions`, `/embeddings`, `/completions`, `/images`, 等等)
- 使用此 passthrough 來呼叫 LiteLLM 尚未完整支援的較新或較少見的 Azure OpenAI 端點，例如 `/assistants`、`/threads`、`/vector_stores`

只要將您的 Azure 端點（例如 `https://<your-resource-name>.openai.azure.com`）替換為 `LITELLM_PROXY_BASE_URL/azure` 即可

## 使用範例 {#usage-examples}

### Assistants API {#assistants-api}

#### 建立 Azure OpenAI 用戶端 {#create-azure-openai-client}

請確保您執行以下操作：
- 將 `azure_endpoint` 指向您的 `LITELLM_PROXY_BASE_URL/azure`
- 將您的 `LITELLM_API_KEY` 作為 `api_key` 使用

```python
import openai

client = openai.AzureOpenAI(
    azure_endpoint="http://0.0.0.0:4000/azure",  # <your-proxy-url>/azure
    api_key="sk-anything",  # <your-proxy-api-key>
    api_version="2024-05-01-preview"  # required Azure API version
)
```

#### 建立 Assistant {#create-an-assistant}

```python
assistant = client.beta.assistants.create(
    name="Math Tutor",
    instructions="You are a math tutor. Help solve equations.",
    model="gpt-4o",
)
```

#### 建立 Thread {#create-a-thread}
```python
thread = client.beta.threads.create()
```

#### 將訊息新增到 Thread {#add-a-message-to-the-thread}
```python
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Solve 3x + 11 = 14",
)
```

#### 執行 Assistant {#run-the-assistant}
```python
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id,
)

# Check run status
run_status = client.beta.threads.runs.retrieve(
    thread_id=thread.id,
    run_id=run.id
)
```

#### 取回訊息 {#retrieve-messages}
```python
messages = client.beta.threads.messages.list(
    thread_id=thread.id
)
```

#### 刪除 Assistant {#delete-the-assistant}

```python
client.beta.assistants.delete(assistant.id)
```
