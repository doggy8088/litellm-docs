import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Lago {#lago}

[Lago](https://www.getlago.com/) 提供自架與雲端、依用量計費與基於使用量計費的解決方案。

<Image img={require('../../img/lago.jpeg')} />

## 快速開始 {#quick-start}
只需 1 行程式碼，即可立即將您的回應記錄到 **所有提供者**，搭配 Lago

取得您的 Lago [API 金鑰](https://docs.getlago.com/guide/self-hosted/docker#find-your-api-key)

```python
litellm.callbacks = ["lago"] # logs cost + usage of successful calls to lago
```


<Tabs>
<TabItem value="sdk" label="SDK">

```python
# uv add lago 
import litellm
import os

os.environ["LAGO_API_BASE"] = "" # http://0.0.0.0:3000
os.environ["LAGO_API_KEY"] = ""
os.environ["LAGO_API_EVENT_CODE"] = "" # The billable metric's code - https://docs.getlago.com/guide/events/ingesting-usage#define-a-billable-metric
os.environ["LAGO_API_CHARGE_BY"] = "user_id" # the default, end_user_id, is only populated for proxy requests

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set lago as a callback, litellm will send the data to lago
litellm.success_callback = ["lago"] 
 
# openai call
response = litellm.completion(
  model="{{openai_small}}",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={"user_api_key_user_id": "your_customer_id"} # 👈 SET YOUR CUSTOMER ID HERE
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 新增至 Config.yaml
```yaml
model_list:
- litellm_params:
    api_base: https://openai-function-calling-workers.tasslexyz.workers.dev/
    api_key: my-fake-key
    model: openai/my-fake-model
  model_name: fake-openai-endpoint

litellm_settings:
  callbacks: ["lago"] # 👈 KEY CHANGE
```

2. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

3. 測試它！ 

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "fake-openai-endpoint",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ],
      "user": "your-customer-id" # 👈 SET YOUR CUSTOMER ID
    }
'
```
</TabItem>
<TabItem value="openai_python" label="OpenAI Python SDK">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="{{openai_small}}", messages = [
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
    model = "{{openai_small}}",
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
</Tabs>

<Image img={require('../../img/lago_2.png')} />

## 進階 - Lagos 記錄物件  {#advanced---lagos-logging-object}

這是 LiteLLM 將記錄到 Lagos 的內容

```
{
    "event": {
      "transaction_id": "<generated_unique_id>",
      "external_subscription_id": <customer_id>, # selected by LAGO_API_CHARGE_BY
      "code": os.getenv("LAGO_API_EVENT_CODE"), 
      "properties": {
          "model": <string>,
          "response_cost": <number>, # 👈 LITELLM CALCULATED RESPONSE COST - https://github.com/BerriAI/litellm/blob/d43f75150a65f91f60dc2c0c9462ce3ffc713c1f/litellm/utils.py#L1473
          "prompt_tokens": <number>,
          "completion_tokens": <number>,
          "total_tokens": <number>
      }
    }
}
```

`LAGO_API_CHARGE_BY` 會選取作為 `external_subscription_id` 傳送的值。`end_user_id`（預設）會使用代理請求的 `user` 參數，`user_id` 會使用虛擬金鑰的 `user_id`，而 `team_id` 會使用虛擬金鑰的 `team_id`。如果所選值不存在，則不會將任何內容傳送到 Lago。在 SDK 中沒有代理請求，因此請設定 `LAGO_API_CHARGE_BY=user_id`，並將 customer id 作為 `metadata={"user_api_key_user_id": ...}` 傳入
