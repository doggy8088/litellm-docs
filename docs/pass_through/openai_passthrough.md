# OpenAI 直通 {#openai-passthrough}

直接存取 OpenAI API 的轉送端點

## 概觀 {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | Chat completions、embeddings、image generations、image edits，以及 Responses API。其他端點（包括 Agents API）會被記錄，但不計入成本 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | 完整支援 |

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

## WebSocket 端點預設為關閉 {#websocket-endpoints-are-off-by-default}

這兩個前綴也可以將 WebSocket 連線（例如 `/openai_passthrough/v1/realtime` 和 `/openai/v1/responses`）轉送到 OpenAI。轉送會在不讀取 frame 的情況下傳遞，因此無法檢查工作階段要求哪個模型，而且會使用 proxy 自己的 OpenAI 憑證提供服務。因此，除非 proxy 管理員明確啟用，否則會停用：

```yaml
general_settings:
  enable_openai_websocket_passthrough: true
```

在關閉狀態下，WebSocket 用戶端會收到一則 `error` 事件，其中會標示這項設定，並且連線會以代碼 `1008` 關閉。即使啟用後，只要有任何模型限制適用於該請求，也會以相同方式拒絕，無論該限制是設定在 key、其 team、呼叫者的 team membership、internal user，或 project 上。這項設定也可以透過 `store_model_in_db: true`、經由 `POST /config/field/update` 儲存在資料庫中，而每個 proxy instance 會在下一次 config 重新載入時取得它；YAML 中設定的值會優先於已儲存的值。如果只需要 `model_list` 中模型的 Realtime API，請改用 proxy 自己的 `/v1/realtime` route，這不需要明確啟用，且會強制套用 key 的模型存取權

## 何時使用這個？ {#when-to-use-this}

- 對於 90% 的使用情境，您應該使用 [原生 LiteLLM OpenAI 整合](https://docs.litellm.ai/docs/providers/openai)（`/chat/completions`、`/embeddings`、`/completions`、`/images`、`/batches` 等）
- 使用 `/openai_passthrough` 來呼叫 LiteLLM 尚未完整支援、較不熱門或較新的 OpenAI 端點，例如 `/assistants`、`/threads`、`/vector_stores`、`/responses`，以及 [Agents API](#agents-api)

只要將 `https://api.openai.com` 替換為 `LITELLM_PROXY_BASE_URL/openai_passthrough` 即可

## 使用範例 {#usage-examples}

需求：
請在您的環境變數中設定 `OPENAI_API_KEY`。

### Embeddings {#embeddings}

passthrough embeddings 請求所產生的花費會被追蹤，並歸屬到呼叫的 key，就像原生的 `/embeddings` route 一樣

```bash
curl http://0.0.0.0:4000/openai_passthrough/v1/embeddings \
  -H "Authorization: Bearer sk-anything" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "hello world"
  }'
```

### Assistants API {#assistants-api}

#### 建立 OpenAI 用戶端 {#create-openai-client}

請確保您執行以下事項：
- 將 `base_url` 指向您的 `LITELLM_PROXY_BASE_URL/openai_passthrough`
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
    model="{{openai_large}}",
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

### Agents API {#agents-api}

[OpenAI Agents API](https://developers.openai.com/api/docs/guides/agents-api/overview) 可透過 `/openai` 與 `/openai_passthrough` 兩者運作。將 OpenAI SDK 指向 `<your-proxy-url>/openai/v1`，並像對 OpenAI 呼叫一樣呼叫 `client.beta.agents`，無需額外的標頭。代理會使用自己的 `OPENAI_API_KEY` 呼叫 OpenAI，因此該金鑰需要有 Agents API 的存取權。<SinceVersion v="1.109.0" />

#### 建立 Session {#create-a-session}

```python
import openai

client = openai.OpenAI(
    base_url="http://0.0.0.0:4000/openai/v1",  # <your-proxy-url>/openai/v1
    api_key="sk-anything",  # <your-proxy-api-key>
)

session = client.beta.agents.sessions.create(
    environment={"type": "none"},
    agent={"model": "{{openai_small}}"},
    input="Reply with the word hi",
)
print(session.id, session.status)
```

#### 串流後續回合 {#stream-a-follow-up-turn}

Session 會在目前回合結束後接受新的輸入。

```python
import time

while client.beta.agents.sessions.retrieve(session.id).status == "in_progress":
    time.sleep(2)

with client.beta.agents.sessions.stream(session.id, input="Now reply with the word bye") as stream:
    for event in stream:
        print(event.type)

items = client.beta.agents.sessions.items.list(session.id)
```

#### 支援的路由 {#supported-routes}

`/v1/agents` 與 `/v1/vaults` 底下的每個路徑都可搭配任一前綴使用。這涵蓋已儲存的 agents（`/v1/agents`）、sessions 及其 events、items、turns、artifacts、subagents 與 traces（`/v1/agents/sessions/...`）、environments（`/v1/agents/environments/...`）、automations（`/v1/agents/automations/...`），以及 vaults 及其憑證（`/v1/vaults/...`）。

#### `OpenAI-Beta` 標頭的處理方式 {#how-the-openai-beta-header-is-handled}

OpenAI 會拒絕未送出 `OpenAI-Beta: agents=v1` 的 Agents API 呼叫。在 `/v1/agents/...` 與 `/v1/vaults/...` 路徑上，用戶端送出的 `x-pass-openai-beta` 標頭優先，代理會將其值作為 `OpenAI-Beta` 送給 OpenAI。若沒有該標頭，代理會轉送用戶端自己的 `OpenAI-Beta` 標頭，OpenAI SDK 會在每次 Agents API 呼叫時將其設為 `agents=v1`。若用戶端兩者都沒有送出，代理會送出 `agents=v1`，因此一般的 curl 也能運作：

```bash
curl http://0.0.0.0:4000/openai/v1/agents/sessions \
  -H "Authorization: Bearer sk-anything" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {"type": "none"},
    "agent": {"model": "{{openai_small}}"},
    "input": "Reply with the word hi"
  }'
```

代理也會在 `/v1/chatkit/...` 路徑上轉送用戶端的 `OpenAI-Beta` 標頭，因此 `client.beta.chatkit` 呼叫可搭配 SDK 送出的 `chatkit_beta=v1` 值運作。在所有其他路徑上，代理不會轉送用戶端的 `OpenAI-Beta` 標頭，並會在 assistants 與 threads 路徑上送出 `assistants=v2`。若要在這些路徑送出不同的值，請使用 `x-pass-openai-beta`。

#### 記錄與支出 {#logging-and-spend}

建立或擷取 session、建立已儲存的 agent，以及串流一個回合，都會以該 agent 的模型出現在支出記錄中。其他 Agents API 呼叫，例如送出回合的輸入，或列出 items 或 vaults，會以模型 `unknown` 記錄。目前每個 Agents API 呼叫的支出都是 $0，因為代理轉送的回應不帶有 token 使用量。
