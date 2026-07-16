import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Xiaomi MiMo {#xiaomi-mimo}
https://platform.xiaomimimo.com/#/docs

:::tip

**我們支援所有 Xiaomi MiMo 模型，只要在傳送 litellm 請求時將 `model=xiaomi_mimo/<any-model-on-xiaomi-mimo>` 設為前綴即可**

:::

## API 金鑰 {#api-key}
```python
# env variable
os.environ['XIAOMI_MIMO_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['XIAOMI_MIMO_API_KEY'] = ""
response = completion(
    model="xiaomi_mimo/mimo-v2-flash",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    max_tokens=1024,
    temperature=0.3,
    top_p=0.95,
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['XIAOMI_MIMO_API_KEY'] = ""
response = completion(
    model="xiaomi_mimo/mimo-v2-flash",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    stream=True,
    max_tokens=1024,
    temperature=0.3,
    top_p=0.95,
)

for chunk in response:
    print(chunk)
```


## 與 LiteLLM Proxy Server 一起使用 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Xiaomi MiMo 模型

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: xiaomi_mimo/<your-model-name>  # add xiaomi_mimo/ prefix to route as Xiaomi MiMo provider
        api_key: api-key                      # api key to send your model
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 向 LiteLLM Proxy Server 發送請求

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

## 支援的模型 {#supported-models}

| 模型名稱 | 用法 |
|------------|-------|
| mimo-v2-flash | `completion(model="xiaomi_mimo/mimo-v2-flash", messages)` |
