import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 計費 {#billing}

向內部團隊、外部客戶依其用量收費

**🚨 必要條件**
- [設定 Lago](https://docs.getlago.com/guide/self-hosted/docker#run-the-app)，用於依用量計費。我們建議遵循 [他們的 Stripe 教學](https://docs.getlago.com/templates/per-transaction/stripe#step-1-create-billable-metrics-for-transaction)

步驟：
- 將 proxy 連接到 Lago
- 設定您要計費的 id（客戶、內部使用者、團隊）
- 開始！ 

## 快速開始 {#quick-start}

向內部團隊依其用量收費

### 1. 將 proxy 連接到 Lago  {#1-connect-proxy-to-lago}

在您的 proxy config.yaml 中將 'lago' 設為 callback

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

litellm_settings:
  callbacks: ["lago"] # 👈 KEY CHANGE

general_settings:
  master_key: sk-1234
```

將您的 Lago 金鑰新增到環境變數

```bash
export LAGO_API_BASE="http://localhost:3000" # self-host - https://docs.getlago.com/guide/self-hosted/docker#run-the-app
export LAGO_API_KEY="3e29d607-de54-49aa-a019-ecf585729070" # Get key - https://docs.getlago.com/guide/self-hosted/docker#find-your-api-key
export LAGO_API_EVENT_CODE="openai_tokens" # name of lago billing code
export LAGO_API_CHARGE_BY="team_id" # 👈 Charges 'team_id' attached to proxy key
```

啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

### 2. 為內部團隊建立 Key  {#2-create-key-for-internal-team}

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data-raw '{"team_id": "my-unique-id"}' # 👈 Internal Team's ID
```

回應物件：

```bash
{
  "key": "sk-tXL0wt5-lOOVK9sfY2UacA",
}
```


### 3. 開始計費！  {#3-start-billing}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-tXL0wt5-lOOVK9sfY2UacA' \ # 👈 Team's Key
--data ' {
      "model": "fake-openai-endpoint",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ],
    }
'
```
</TabItem>
<TabItem value="openai_python" label="OpenAI Python SDK">

```python
import openai
client = openai.OpenAI(
    api_key="sk-tXL0wt5-lOOVK9sfY2UacA", # 👈 Team's Key
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-4o", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)
```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage
import os 

os.environ["OPENAI_API_KEY"] = "sk-tXL0wt5-lOOVK9sfY2UacA" # 👈 Team's Key

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    model = "gpt-4o",
    temperature=0.1,
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```
</TabItem>
</Tabs>

**在 Lago 上查看結果**

<Image img={require('../../img/lago_2.png')}  style={{ width: '500px', height: 'auto' }} />

## 進階 - Lago 記錄物件  {#advanced---lago-logging-object}

這就是 LiteLLM 會記錄到 Lagos 的內容

```
{
    "event": {
      "transaction_id": "<generated_unique_id>",
      "external_customer_id": <selected_id>, # either 'end_user_id', 'user_id', or 'team_id'. Default 'end_user_id'. 
      "code": os.getenv("LAGO_API_EVENT_CODE"), 
      "properties": {
          "input_tokens": <number>,
          "output_tokens": <number>,
          "model": <string>,
          "response_cost": <number>, # 👈 LITELLM CALCULATED RESPONSE COST - https://github.com/BerriAI/litellm/blob/d43f75150a65f91f60dc2c0c9462ce3ffc713c1f/litellm/utils.py#L1473
      }
    }
}
```

## 進階 - 向客戶、內部使用者收費  {#advanced---bill-customers-internal-users}

適用於：
- 客戶（透過 /chat/completion 呼叫中的 'user' 參數傳入的 id）= 'end_user_id'
- 內部使用者（在 [建立金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys#advanced---spend-tracking) 時設定的 id）= 'user_id' 
- 團隊（在 [建立金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys#advanced---spend-tracking) 時設定的 id）= 'team_id' 

<Tabs>
<TabItem value="customers" label="客戶計費">

1. 將 'LAGO_API_CHARGE_BY' 設為 'end_user_id'

  ```bash
  export LAGO_API_CHARGE_BY="end_user_id"
  ```

2. 測試看看！

  <Tabs>
  <TabItem value="curl" label="Curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --data ' {
        "model": "gpt-4o",
        "messages": [
          {
            "role": "user",
            "content": "what llm are you"
          }
        ],
        "user": "my_customer_id" # 👈 whatever your customer id is
      }
  '
  ```
  </TabItem>
  <TabItem value="openai_sdk" label="OpenAI Python SDK">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="anything",
      base_url="http://0.0.0.0:4000"
  )

  # request sent to model set on litellm proxy, `litellm --model`
  response = client.chat.completions.create(model="gpt-4o", messages = [
      {
          "role": "user",
          "content": "this is a test request, write a short poem"
      }
  ], user="my_customer_id") # 👈 whatever your customer id is

  print(response)
  ```

  </TabItem>
  <TabItem value="langchain" label="Langchain">

  ```python
  from langchain.chat_models import ChatOpenAI
  from langchain.prompts.chat import (
      ChatPromptTemplate,
      HumanMessagePromptTemplate,
      SystemMessagePromptTemplate,
  )
  from langchain.schema import HumanMessage, SystemMessage
  import os 

  os.environ["OPENAI_API_KEY"] = "anything"

  chat = ChatOpenAI(
      openai_api_base="http://0.0.0.0:4000",
      model = "gpt-4o",
      temperature=0.1,
      extra_body={
          "user": "my_customer_id"  # 👈 whatever your customer id is
      }
  )

  messages = [
      SystemMessage(
          content="You are a helpful assistant that im using to make a test request to."
      ),
      HumanMessage(
          content="test from litellm. tell me why it's amazing in 1 sentence"
      ),
  ]
  response = chat(messages)

  print(response)
  ```

  </TabItem>
  </Tabs>

</TabItem>
<TabItem value="users" label="內部使用者計費">

1. 將 'LAGO_API_CHARGE_BY' 設為 'user_id'

```bash
export LAGO_API_CHARGE_BY="user_id"
```

2. 為該使用者建立一個 key 

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"user_id": "my-unique-id"}' # 👈 Internal User's id
```

回應物件：

```bash
{
  "key": "sk-tXL0wt5-lOOVK9sfY2UacA",
}
```

3. 使用該 Key 發出 API 請求 

```python
import openai
client = openai.OpenAI(
    api_key="sk-tXL0wt5-lOOVK9sfY2UacA", # 👈 Generated key
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-4o", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)
```
</TabItem>
</Tabs>
