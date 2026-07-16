import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /assistants {#assistants}

:::warning 淘汰公告

OpenAI 已淘汰 Assistants API。它將於 **2026 年 8 月 26 日** 關閉。

請考慮改為遷移到 [Responses API](/docs/response_api)。詳情請參閱 [OpenAI 的遷移指南](https://platform.openai.com/docs/guides/responses-vs-assistants)。

:::

涵蓋 Threads、Messages、Assistants。 

LiteLLM 目前涵蓋： 
- 建立 Assistants 
- 刪除 Assistants
- 取得 Assistants
- 建立 Thread
- 取得 Thread
- 新增 Messages
- 取得 Messages
- 執行 Thread

## **支援的提供者**: {#supported-providers}
- [OpenAI](#quick-start)
- [Azure OpenAI](#azure-openai)
- [OpenAI 相容 API](#openai-compatible-apis)

## 快速開始  {#quick-start}

呼叫既有的 Assistant。 

- 取得 Assistant 

- 當使用者開始對話時建立 Thread。

- 當使用者提出問題時，將 Messages 新增至 Thread。

- 在 Thread 上執行 Assistant，透過呼叫模型與工具來產生回應。

### SDK + PROXY {#sdk--proxy}
<Tabs>
<TabItem value="sdk" label="SDK">

**建立 Assistant**

```python
import litellm
import os 

# setup env
os.environ["OPENAI_API_KEY"] = "sk-.."

assistant = litellm.create_assistants(
            custom_llm_provider="openai",
            model="gpt-4-turbo",
            instructions="You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
            name="Math Tutor",
            tools=[{"type": "code_interpreter"}],
)

### ASYNC USAGE ### 
# assistant = await litellm.acreate_assistants(
#             custom_llm_provider="openai",
#             model="gpt-4-turbo",
#             instructions="You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
#             name="Math Tutor",
#             tools=[{"type": "code_interpreter"}],
# )
```

**取得 Assistant**

```python
from litellm import get_assistants, aget_assistants
import os 

# setup env
os.environ["OPENAI_API_KEY"] = "sk-.."

assistants = get_assistants(custom_llm_provider="openai")

### ASYNC USAGE ### 
# assistants = await aget_assistants(custom_llm_provider="openai")
```

**建立 Thread**

```python
from litellm import create_thread, acreate_thread
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

new_thread = create_thread(
            custom_llm_provider="openai",
            messages=[{"role": "user", "content": "Hey, how's it going?"}],  # type: ignore
        )

### ASYNC USAGE ### 
# new_thread = await acreate_thread(custom_llm_provider="openai",messages=[{"role": "user", "content": "Hey, how's it going?"}])
```

**將 Messages 新增至 Thread**

```python
from litellm import create_thread, get_thread, aget_thread, add_message, a_add_message
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

## CREATE A THREAD
_new_thread = create_thread(
            custom_llm_provider="openai",
            messages=[{"role": "user", "content": "Hey, how's it going?"}],  # type: ignore
        )

## OR retrieve existing thread
received_thread = get_thread(
            custom_llm_provider="openai",
            thread_id=_new_thread.id,
        )

### ASYNC USAGE ### 
# received_thread = await aget_thread(custom_llm_provider="openai", thread_id=_new_thread.id,)

## ADD MESSAGE TO THREAD
message = {"role": "user", "content": "Hey, how's it going?"}
added_message = add_message(
            thread_id=_new_thread.id, custom_llm_provider="openai", **message
        )

### ASYNC USAGE ### 
# added_message = await a_add_message(thread_id=_new_thread.id, custom_llm_provider="openai", **message)
```

**在 Thread 上執行 Assistant**

```python
from litellm import get_assistants, create_thread, add_message, run_thread, arun_thread
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."
assistants = get_assistants(custom_llm_provider="openai")

## get the first assistant ###
assistant_id = assistants.data[0].id

## GET A THREAD
_new_thread = create_thread(
            custom_llm_provider="openai",
            messages=[{"role": "user", "content": "Hey, how's it going?"}],  # type: ignore
        )

## ADD MESSAGE
message = {"role": "user", "content": "Hey, how's it going?"}
added_message = add_message(
            thread_id=_new_thread.id, custom_llm_provider="openai", **message
        )

## 🚨 RUN THREAD
response = run_thread(
            custom_llm_provider="openai", thread_id=thread_id, assistant_id=assistant_id
        )

### ASYNC USAGE ### 
# response = await arun_thread(custom_llm_provider="openai", thread_id=thread_id, assistant_id=assistant_id)

print(f"run_thread: {run_thread}")
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
assistant_settings:
  custom_llm_provider: azure
  litellm_params: 
    api_key: os.environ/AZURE_API_KEY
    api_base: os.environ/AZURE_API_BASE
    api_version: os.environ/AZURE_API_VERSION
```

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```


**建立 Assistant**

```bash
curl "http://localhost:4000/v1/assistants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "instructions": "You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
    "name": "Math Tutor",
    "tools": [{"type": "code_interpreter"}],
    "model": "gpt-4-turbo"
  }'
```


**取得 Assistant**

```bash
curl "http://0.0.0.0:4000/v1/assistants?order=desc&limit=20" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234"
```

**建立 Thread**

```bash
curl http://0.0.0.0:4000/v1/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d ''
```

**取得 Thread**

```bash
curl http://0.0.0.0:4000/v1/threads/{thread_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234"
```

**將 Messages 新增至 Thread**

```bash
curl http://0.0.0.0:4000/v1/threads/{thread_id}/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
      "role": "user",
      "content": "How does AI work? Explain it in simple terms."
    }'
```

**在 Thread 上執行 Assistant**

```bash
curl http://0.0.0.0:4000/v1/threads/thread_abc123/runs \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "asst_abc123"
  }'
```

</TabItem>
</Tabs>

## 串流  {#streaming}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import run_thread_stream 
import os

os.environ["OPENAI_API_KEY"] = "sk-.."

message = {"role": "user", "content": "Hey, how's it going?"}  

data = {"custom_llm_provider": "openai", "thread_id": _new_thread.id, "assistant_id": assistant_id, **message}

run = run_thread_stream(**data)
with run as run:
    assert isinstance(run, AssistantEventHandler)
    for chunk in run: 
      print(f"chunk: {chunk}")
    run.until_done()
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl -X POST 'http://0.0.0.0:4000/threads/{thread_id}/runs' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
      "assistant_id": "asst_6xVZQFFy1Kw87NbnYeNebxTf",
      "stream": true
}'
```

</TabItem>
</Tabs>

## [👉 Proxy API 參考](https://litellm-api.up.railway.app/#/assistants) {#-proxy-api-referencehttpslitellm-apiuprailwayappassistants}

## Azure OpenAI {#azure-openai}

**設定**
```yaml
assistant_settings:
  custom_llm_provider: azure
  litellm_params: 
    api_key: os.environ/AZURE_API_KEY
    api_base: os.environ/AZURE_API_BASE
```

**curl**

```bash
curl -X POST "http://localhost:4000/v1/assistants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "instructions": "You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
    "name": "Math Tutor",
    "tools": [{"type": "code_interpreter"}],
    "model": "<my-azure-deployment-name>"
  }'
```

## OpenAI 相容 API  {#openai-compatible-apis}

若要呼叫相容於 openai 的 Assistants API（例如 Astra Assistants API），只要將 `openai/` 加到模型名稱即可： 

**設定**
```yaml
assistant_settings:
  custom_llm_provider: openai
  litellm_params: 
    api_key: os.environ/ASTRA_API_KEY
    api_base: os.environ/ASTRA_API_BASE
```

**curl**

```bash
curl -X POST "http://localhost:4000/v1/assistants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "instructions": "You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
    "name": "Math Tutor",
    "tools": [{"type": "code_interpreter"}],
    "model": "openai/<my-astra-model-name>"
  }'
```
