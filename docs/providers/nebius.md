import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nebius AI Studio {#nebius-ai-studio}
https://docs.nebius.com/studio/inference/quickstart

:::tip

**Litellm 支援 Nebius AI Studio 的所有模型。若要使用模型，請將 `model=nebius/<any-model-on-nebius-ai-studio>` 設為 litellm 請求的前綴。完整的支援模型清單請參閱 https://studio.nebius.ai/ **

:::

## API 金鑰 {#api-key}
```python
import os
# env variable
os.environ['NEBIUS_API_KEY']
```

## 範例用法：文字生成 {#sample-usage-text-generation}
```python
from litellm import completion
import os

os.environ['NEBIUS_API_KEY'] = "insert-your-nebius-ai-studio-api-key"
response = completion(
    model="nebius/Qwen/Qwen3-235B-A22B",
    messages=[
        {
            "role": "user",
            "content": "What character was Wall-e in love with?",
        }
    ],
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    stop=["\n\n"],
    temperature=0.6,  # either set temperature or `top_p`
    top_p=0.01,  # to get as deterministic results as possible
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

os.environ['NEBIUS_API_KEY'] = ""
response = completion(
    model="nebius/Qwen/Qwen3-235B-A22B",
    messages=[
        {
            "role": "user",
            "content": "What character was Wall-e in love with?",
        }
    ],
    stream=True,
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    stop=["\n\n"],
    temperature=0.6,  # either set temperature or `top_p`
    top_p=0.01,  # to get as deterministic results as possible
    tool_choice="auto",
    tools=[],
    user="user",
)

for chunk in response:
    print(chunk)
```

## 範例用法 - 嵌入 {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['NEBIUS_API_KEY'] = ""
response = embedding(
    model="nebius/BAAI/bge-en-icl",
    input=["What character was Wall-e in love with?"],
)
print(response)
```


## 與 LiteLLM Proxy Server 一起使用 {#usage-with-litellm-proxy-server}

以下說明如何透過 LiteLLM Proxy Server 呼叫 Nebius AI Studio 模型

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: nebius/<your-model-name>  # add nebius/ prefix to use Nebius AI Studio as provider
        api_key: api-key                 # api key to send your model
  ```
2. 啟動 proxy 
  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 傳送請求到 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="litellm-proxy-key",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "What character was Wall-e in love with?"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: litellm-proxy-key' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "What character was Wall-e in love with?"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>

## 支援的參數 {#supported-parameters}

Nebius 提供者支援下列參數：

### 聊天完成參數 {#chat-completion-parameters}

| 參數 | 類型 | 說明 |
| --------- | ---- | ----------- |
| frequency_penalty | number | 依據文字中出現頻率對新 tokens 施加懲罰 |
| function_call | string/object | 控制模型如何呼叫函式 |
| functions | array | 函式清單，模型可為其產生 JSON 輸入 |
| logit_bias | map | 修改指定 tokens 的可能性 |
| max_tokens | integer | 要生成的 token 最大數量 |
| n | integer | 要生成的完成數量 |
| presence_penalty | number | 依據 tokens 到目前為止是否出現在文字中對其施加懲罰 |
| response_format | object | 回應格式，例如 `{"type": "json"}` |
| seed | integer | 用於決定性結果的取樣種子 |
| stop | string/array | API 將停止生成 tokens 的序列 |
| stream | boolean | 是否串流回應 |
| temperature | number | 控制隨機性（0-2） |
| top_p | number | 控制 nucleus sampling |
| tool_choice | string/object | 控制要呼叫哪個函式（如果有） |
| tools | array | 模型可使用的工具清單 |
| user | string | 使用者識別碼 |

### 嵌入參數 {#embedding-parameters}

| 參數 | 類型 | 說明 |
| --------- | ---- | ----------- |
| input | string/array | 要嵌入的文字 |
| user | string | 使用者識別碼 |

## 錯誤處理 {#error-handling}

此整合使用標準的 LiteLLM 錯誤處理。常見錯誤包括：

- **驗證錯誤**：檢查您的 API 金鑰
- **找不到模型**：請確認您使用的是有效的模型名稱
- **速率限制錯誤**：您已超過速率限制
- **逾時錯誤**：請求完成所需時間過長
