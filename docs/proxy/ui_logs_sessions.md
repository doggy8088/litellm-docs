import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 會話記錄 {#session-logs}

將請求分組為會話。這可讓您將相關請求分組在一起。

<Image img={require('../../img/ui_session_logs.png')}/>

## 用法  {#usage}

### `/chat/completions` {#chatcompletions}

若要將多個請求分組成單一會話，請在每個請求的中繼資料中傳入相同的 `litellm_session_id`。做法如下：

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

**請求 1**
使用唯一的 ID 建立新會話，並發出第一個請求。會話 ID 將用於追蹤所有相關請求。

```python showLineNumbers
import openai
import uuid

# Create a session ID
session_id = str(uuid.uuid4())

client = openai.OpenAI(
    api_key="<your litellm api key>",
    base_url="http://0.0.0.0:4000"
)

# First request in session
response1 = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": "Write a short story about a robot"
        }
    ],
    extra_body={
        "litellm_session_id": session_id  # Pass the session ID
    }
)
```

**請求 2**
使用相同的會話 ID 發出另一個請求，將其與先前的請求連結。這可讓您將相關請求一起追蹤。

```python showLineNumbers
# Second request using same session ID
response2 = client.chat.completions.create(
    model="gpt-4o", 
    messages=[
        {
            "role": "user",
            "content": "Now write a poem about that robot"
        }
    ],
    extra_body={
        "litellm_session_id": session_id  # Reuse the same session ID
    }
)
```

</TabItem>
<TabItem value="langchain" label="Langchain">

**請求 1**
以唯一的 ID 初始化新會話，並建立一個 chat model 實例以發出請求。會話 ID 會嵌入模型的設定中。

```python showLineNumbers
from langchain.chat_models import ChatOpenAI
import uuid

# Create a session ID
session_id = str(uuid.uuid4())

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    api_key="<your litellm api key>",
    model="gpt-4o",
    extra_body={
        "litellm_session_id": session_id  # Pass the session ID
    }
)

# First request in session
response1 = chat.invoke("Write a short story about a robot")
```

**請求 2**
使用相同的 chat model 實例發出另一個請求，透過先前設定的會話 ID 自動維持會話內容。

```python showLineNumbers
# Second request using same chat object and session ID
response2 = chat.invoke("Now write a poem about that robot")
```

</TabItem>
<TabItem value="curl" label="Curl">

**請求 1**
產生新的會話 ID 並發出初始 API 呼叫。中繼資料中的會話 ID 將用於追蹤這段對話。

```bash showLineNumbers
# Create a session ID
SESSION_ID=$(uuidgen)

# Store your API key
API_KEY="<your litellm api key>"

# First request in session
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $API_KEY" \
    --data '{
    "model": "gpt-4o",
    "messages": [
        {
        "role": "user",
        "content": "Write a short story about a robot"
        }
    ],
    "litellm_session_id": "'$SESSION_ID'"
}'
```

**請求 2**
使用相同的會話 ID 發出後續請求，以維持對話內容與追蹤。

```bash showLineNumbers
# Second request using same session ID
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $API_KEY" \
    --data '{
    "model": "gpt-4o",
    "messages": [
        {
        "role": "user",
        "content": "Now write a poem about that robot"
        }
    ],
    "litellm_session_id": "'$SESSION_ID'"
}'
```

</TabItem>
<TabItem value="litellm" label="LiteLLM Python SDK">

**請求 1**
透過建立唯一的 ID 並發出初始請求來開始新會話。此會話 ID 將用於將相關請求分組在一起。

```python showLineNumbers
import litellm
import uuid

# Create a session ID
session_id = str(uuid.uuid4())

# First request in session
response1 = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a short story about a robot"}],
    api_base="http://0.0.0.0:4000",
    api_key="<your litellm api key>",
    metadata={
        "litellm_session_id": session_id  # Pass the session ID
    }
)
```

**請求 2**
使用相同的會話 ID 發出另一個請求，將其連結到先前的互動，以延續對話。

```python showLineNumbers
# Second request using same session ID
response2 = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Now write a poem about that robot"}],
    api_base="http://0.0.0.0:4000",
    api_key="<your litellm api key>",
    metadata={
        "litellm_session_id": session_id  # Reuse the same session ID
    }
)
```

</TabItem>
</Tabs>

### `/responses` {#responses}

對於 `/responses` 端點，請使用 `previous_response_id` 將請求分組成會話。每個請求回應都會回傳 `previous_response_id`。

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

**請求 1**
發出初始請求並儲存回應 ID，以便連結後續請求。

```python showLineNumbers
from openai import OpenAI

client = OpenAI(
    api_key="<your litellm api key>",
    base_url="http://0.0.0.0:4000"
)

# First request in session
response1 = client.responses.create(
    model="anthropic/claude-3-sonnet-20240229-v1:0",
    input="Write a short story about a robot"
)

# Store the response ID for the next request
response_id = response1.id
```

**請求 2**
使用先前的回應 ID 發出後續請求，以維持對話內容。

```python showLineNumbers
# Second request using previous response ID
response2 = client.responses.create(
    model="anthropic/claude-3-sonnet-20240229-v1:0",
    input="Now write a poem about that robot",
    previous_response_id=response_id  # Link to previous request
)
```

</TabItem>
<TabItem value="curl" label="Curl">

**請求 1**
發出初始請求。回應將包含可用於連結後續請求的 ID。

```bash showLineNumbers
# Store your API key
API_KEY="<your litellm api key>"

# First request in session
curl http://localhost:4000/v1/responses \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $API_KEY" \
    --data '{
        "model": "anthropic/claude-3-sonnet-20240229-v1:0",
        "input": "Write a short story about a robot"
    }'

# Response will include an 'id' field that you'll use in the next request
```

**請求 2**
使用先前的回應 ID 發出後續請求，以維持對話內容。

```bash showLineNumbers
# Second request using previous response ID
curl http://localhost:4000/v1/responses \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $API_KEY" \
    --data '{
        "model": "anthropic/claude-3-sonnet-20240229-v1:0",
        "input": "Now write a poem about that robot",
        "previous_response_id": "resp_abc123..."  # Replace with actual response ID from previous request
    }'
```

</TabItem>
<TabItem value="litellm" label="LiteLLM Python SDK">

**請求 1**
發出初始請求並儲存回應 ID，以便連結後續請求。

```python showLineNumbers
import litellm

# First request in session
response1 = litellm.responses(
    model="anthropic/claude-3-sonnet-20240229-v1:0",
    input="Write a short story about a robot",
    api_base="http://0.0.0.0:4000",
    api_key="<your litellm api key>"
)

# Store the response ID for the next request
response_id = response1.id
```

**請求 2**
使用先前的回應 ID 發出後續請求，以維持對話內容。

```python showLineNumbers
# Second request using previous response ID
response2 = litellm.responses(
    model="anthropic/claude-3-sonnet-20240229-v1:0",
    input="Now write a poem about that robot",
    api_base="http://0.0.0.0:4000",
    api_key="<your litellm api key>",
    previous_response_id=response_id  # Link to previous request
)
```

</TabItem>
</Tabs>
