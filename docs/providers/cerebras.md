import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Cerebras {#cerebras}
https://inference-docs.cerebras.ai/api-reference/chat-completions

:::tip

**我們支援所有 Cerebras 模型，只要在傳送 litellm 請求時將 `model=cerebras/<any-model-on-cerebras>` 設為前綴即可**

:::

## API 金鑰 {#api-key}
```python
# env variable
os.environ['CEREBRAS_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['CEREBRAS_API_KEY'] = ""
response = completion(
    model="cerebras/llama3-70b-instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit? (Write in JSON)",
        }
    ],
    max_tokens=10,
        
    # The prompt should include JSON if 'json_object' is selected; otherwise, you will get error code 400.
    response_format={ "type": "json_object" },
    seed=123,
    stop=["\n\n"],
    temperature=0.2,
    top_p=0.9,
    tool_choice="auto",
    tools=[],
    user="user",
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['CEREBRAS_API_KEY'] = ""
response = completion(
    model="cerebras/llama3-70b-instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit? (Write in JSON)",
        }
    ],
    stream=True,
    max_tokens=10,

    # The prompt should include JSON if 'json_object' is selected; otherwise, you will get error code 400.
    response_format={ "type": "json_object" }, 
    seed=123,
    stop=["\n\n"],
    temperature=0.2,
    top_p=0.9,
    tool_choice="auto",
    tools=[],
    user="user",
)

for chunk in response:
    print(chunk)
```


## 搭配 LiteLLM Proxy Server 使用 {#usage-with-litellm-proxy-server}

以下是如何透過 LiteLLM Proxy Server 呼叫 Cerebras 模型

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: cerebras/<your-model-name>  # add cerebras/ prefix to route as Cerebras provider
        api_key: api-key                 # api key to send your model
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 向 LiteLLM Proxy Server 傳送請求

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "what llm are you"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "what llm are you"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>
