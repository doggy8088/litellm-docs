# OpenAI 直通 {#openai-passthrough}

直接存取 OpenAI API 的轉送端點

## 概觀 {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ❌ | 不支援 |
| 記錄 | ✅ | 可在所有整合中運作 |
| 串流 | ✅ | 完全支援 |

## 可用端點 {#available-endpoints}

### `/openai_passthrough` - 建議 {#openai_passthrough---recommended}
專用轉送端點，可保證直接路由到 OpenAI，且不會發生衝突。

**適用於：**
- OpenAI Responses API (`/v1/responses`)
- 任何您需要保證轉送的端點
- 當 `/openai` 路由與 LiteLLM 的原生實作衝突時

### `/openai` - 舊版 {#openai---legacy}
標準轉送端點，可能會與 LiteLLM 的原生實作衝突。

**注意：** 某些端點例如 `/openai/v1/responses`，會改為路由到 LiteLLM 的原生實作，而不是 OpenAI。

## 何時使用這個？ {#when-to-use-this}

- 對於 90% 的使用情境，您應該使用 [原生 LiteLLM OpenAI 整合](https://docs.litellm.ai/docs/providers/openai)（`/chat/completions`、`/embeddings`、`/completions`、`/images`、`/batches` 等）
- 使用 `/openai_passthrough` 來呼叫 LiteLLM 尚未完整支援、較不熱門或較新的 OpenAI 端點，例如 `/assistants`、`/threads`、`/vector_stores`、`/responses`

只要將 `https://api.openai.com` 替換為 `LITELLM_PROXY_BASE_URL/openai_passthrough` 即可

## 使用範例 {#usage-examples}

需求：
請在您的環境變數中設定 `OPENAI_API_KEY`。

### Assistants API {#assistants-api}

#### 建立 OpenAI 用戶端 {#create-openai-client}

請確保您執行以下事項：
- 將 `base_url` 指向您的 `LITELLM_PROXY_BASE_URL/openai`
- 將您的 `LITELLM_API_KEY` 用作 `api_key`

```python
import openai

client = openai.OpenAI(
    base_url="http://0.0.0.0:4000/openai_passthrough",  # <your-proxy-url>/openai_passthrough
    api_key="sk-anything"  # <your-proxy-api-key>
)
```

#### 建立 Assistant {#create-an-assistant}

```python
# Create an assistant
assistant = client.beta.assistants.create(
    name="Math Tutor",
    instructions="You are a math tutor. Help solve equations.",
    model="gpt-4o",
)
```

#### 建立 Thread {#create-a-thread}
```python
# Create a thread
thread = client.beta.threads.create()
```

#### 將訊息新增至 Thread {#add-a-message-to-the-thread}
```python
# Add a message
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Solve 3x + 11 = 14",
)
```

#### 執行 Assistant {#run-the-assistant}
```python
# Create a run to get the assistant's response
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

#### 取得訊息 {#retrieve-messages}
```python
# List messages after the run completes
messages = client.beta.threads.messages.list(
    thread_id=thread.id
)
```

#### 刪除 Assistant {#delete-the-assistant}

```python
# Delete the assistant when done
client.beta.assistants.delete(assistant.id)
```
