import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Braintrust {#braintrust}

[Braintrust](https://www.braintrust.dev/) 管理 AI 產品的評估、記錄、提示遊樂場，以及資料管理。

## 快速開始 {#quick-start}

```python
# uv add braintrust
import litellm
import os

# set env
os.environ["BRAINTRUST_API_KEY"] = ""
os.environ["BRAINTRUST_API_BASE"] = "https://api.braintrustdata.com/v1"
os.environ['OPENAI_API_KEY']=""

# set braintrust as a callback, litellm will send the data to braintrust
litellm.callbacks = ["braintrust"]

# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

## OpenAI Proxy 使用方式 {#openai-proxy-usage}

1. 將金鑰加入環境變數

```env
BRAINTRUST_API_KEY=""
BRAINTRUST_API_BASE="https://api.braintrustdata.com/v1"
```

2. 將 braintrust 加入 callbacks

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["braintrust"]
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-D '{
    "model": "groq-llama3",
    "messages": [
        { "role": "system", "content": "Use your tools smartly"},
        { "role": "user", "content": "What time is it now? Use your tool"}
    ]
}'
```

## 進階 - 傳入 Project ID 或名稱 {#advanced---pass-project-id-or-name}

建議您加入 `project_id` 或 `project_name`，以確保您的追蹤資料會寫入正確的 Braintrust 專案。

### 自訂 Span 名稱 {#custom-span-names}

您可以在 Braintrust 記錄中，透過在 metadata 中傳入 `span_name` 來自訂 span 名稱。預設情況下，span 名稱會設為 "Chat Completion"。

### 自訂 Span 屬性 {#custom-span-attributes}

您可以在 Braintrust 記錄中，透過在 metadata 中傳入 `span_id`、`root_span_id` 和 `span_parents` 來自訂 span id、root span 名稱以及 span parents。 
`span_parents` 應該是一個字串，內含以 , 連接的 span ids 清單

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={
    "project_id": "1234",
    # passing project_name will try to find a project with that name, or create one if it doesn't exist
    # if both project_id and project_name are passed, project_id will be used
    # "project_name": "my-special-project",
    # custom span name for this operation (default: "Chat Completion")
    "span_name": "User Greeting Handler"
  }
)
```

注意：使用 SDK 時，這裡也可以包含其他 `metadata`。

```python
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={
    "project_id": "1234",
    "span_name": "Custom Operation",
    "item1": "an item",
    "item2": "another item"
  }
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**Curl**

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-D '{
    "model": "groq-llama3",
    "messages": [
        { "role": "system", "content": "Use your tools smartly"},
        { "role": "user", "content": "What time is it now? Use your tool"}
    ],
    "metadata": {
        "project_id": "my-special-project",
        "span_name": "Tool Usage Request"
    }
}'
```

**OpenAI SDK**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ # pass in any provider-specific param, if not supported by openai, https://docs.litellm.ai/docs/completion/input#provider-specific-params
        "metadata": { # 👈 use for logging additional params (e.g. to braintrust)
            "project_id": "my-special-project",
            "span_name": "Poetry Generation"
        }
    }
)

print(response)
```

如需更多範例，請[**點此**](../proxy/user_keys.md#chatcompletions)

</TabItem>
</Tabs>

您可以使用 `BRAINTRUST_API_BASE` 指向您自架的 Braintrust 資料平面。請在[這裡](https://www.braintrust.dev/docs/guides/self-hosting)閱讀更多資訊。

## 完整 API 規格 {#full-api-spec}

以下列出您可以在 braintrust 請求的 metadata 中傳入的所有內容

`braintrust_*` - 如果您是從 _proxy request headers_ 新增 metadata，任何以 `braintrust_` 開頭的 metadata 欄位都會作為 metadata 傳遞給記錄請求。如果您使用 SDK，只要照常傳入 metadata 即可（例如：`metadata={"project_name": "my-test-project", "item1": "an item", "item2": "another item"}`）

`project_id` - 設定 braintrust 呼叫的 project id。預設值為 `litellm`。

`project_name` - 設定 braintrust 呼叫的 project name。系統會嘗試尋找該名稱的專案，若不存在則建立一個。如果同時傳入 `project_id` 和 `project_name`，將使用 `project_id`。

`span_name` - 設定此操作的自訂 span 名稱。預設值為 `"Chat Completion"`。可用來為應用程式中不同類型的操作提供更具描述性的名稱（例如："User Query"、"Document Summary"、"Code Generation"）。
