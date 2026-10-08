import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CLF AI Gateway {#clf-ai-gateway}
https://clfaigateway.dev/docs

CLF AI Gateway 是一個相容於 OpenAI 的閘道，可提供開放權重模型。它是獨立服務，且不隸屬於 Cloudflare；若要查看 Cloudflare 自家的推論產品，請參閱 [Cloudflare Workers AI](./cloudflare_workers)

:::tip

設定 `model=clf_ai_gateway/<model>` 以透過 CLF AI Gateway 路由請求。最新的模型清單位於 [https://clfaigateway.dev/models](https://clfaigateway.dev/models)，以及來自 `GET /v1/models`

:::

## API 金鑰 {#api-key}

```python
import os

os.environ["CLF_AI_GATEWAY_API_KEY"] = "sk-gw-..."
os.environ["CLF_AI_GATEWAY_API_BASE"] = "https://api.clfaigateway.dev/v1"  # optional, this is the default
```

`CLF_AI_GATEWAY_API_BASE` 只需要在您將 LiteLLM 指向不同端點時設定。若不設定，則會使用 `https://api.clfaigateway.dev/v1`

## 使用範例 {#sample-usage}

```python
from litellm import completion
import os

os.environ["CLF_AI_GATEWAY_API_KEY"] = "sk-gw-..."

response = completion(
    model="clf_ai_gateway/glm-5.3",
    messages=[{"role": "user", "content": "What character was Wall-e in love with?"}],
)
print(response)
```

## 使用範例 - 串流 {#sample-usage---streaming}

```python
from litellm import completion
import os

os.environ["CLF_AI_GATEWAY_API_KEY"] = "sk-gw-..."

response = completion(
    model="clf_ai_gateway/glm-5.3",
    messages=[{"role": "user", "content": "What character was Wall-e in love with?"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

## 推理 {#reasoning}

閘道上的每個模型都是推理模型，因此所有模型都接受 `reasoning_effort`。各模型採用的等級不同，而 LiteLLM 會從模型對應表讀取，而不是假設只有一組固定值

```python
from litellm import completion
import os

os.environ["CLF_AI_GATEWAY_API_KEY"] = "sk-gw-..."

response = completion(
    model="clf_ai_gateway/glm-5.3",
    messages=[{"role": "user", "content": "How many r's are in strawberry?"}],
    reasoning_effort="high",
)
print(response)
```

推理 token 會計入 `completion_tokens`，因此它們會以輸出價格計費，而不是另外計費

## 與 LiteLLM Proxy Server 一起使用 {#usage-with-litellm-proxy-server}

1. 將模型加入您的 config.yaml

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: clf_ai_gateway/glm-5.3
        api_key: os.environ/CLF_AI_GATEWAY_API_KEY
  ```

2. 啟動 proxy

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 傳送請求

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai

  client = openai.OpenAI(
      api_key="litellm-proxy-key",
      base_url="http://0.0.0.0:4000",
  )

  response = client.chat.completions.create(
      model="my-model",
      messages=[{"role": "user", "content": "What character was Wall-e in love with?"}],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer litellm-proxy-key' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
              "role": "user",
              "content": "What character was Wall-e in love with?"
          }
      ]
  }'
  ```
  </TabItem>

  </Tabs>

## 支援的模型 {#supported-models}

以下所有模型都支援工具呼叫、JSON 模式與推理

| 模型 | 上下文視窗 | 影像 |
| ----- | -------------- | ------ |
| clf_ai_gateway/glm-5.3 | 1,048,576 | 否 |
| clf_ai_gateway/glm-5.3-flash | 1,048,576 | 是 |
| clf_ai_gateway/glm-5.2 | 262,144 | 否 |
| clf_ai_gateway/glm-4.7-flash | 131,072 | 否 |
| clf_ai_gateway/kimi-k2.7-code | 262,144 | 是 |
| clf_ai_gateway/kimi-k2.6 | 262,144 | 是 |
| clf_ai_gateway/deepseek-v4-pro | 1,048,576 | 否 |
| clf_ai_gateway/deepseek-v4-flash | 1,048,576 | 否 |
| clf_ai_gateway/qwen3.8-27b | 262,144 | 是 |

## 支援的參數 {#supported-parameters}

| 參數 | 類型 | 說明 |
| --------- | ---- | ----------- |
| frequency_penalty | number | 根據新 token 在文字中的出現頻率來懲罰它們 |
| max_completion_tokens | integer | 要產生的 token 最大數量 |
| max_tokens | integer | 要產生的 token 最大數量 |
| n | integer | 要產生的完成數量 |
| parallel_tool_calls | boolean | 模型是否可以同時呼叫多個工具 |
| presence_penalty | number | 根據 token 是否已出現在目前為止的文字中來懲罰它們 |
| reasoning_effort | string | 模型在回答前進行多少推理 |
| response_format | object | 回應格式，例如 `{"type": "json_object"}` |
| seed | integer | 用於決定性結果的取樣種子 |
| stop | string/array | API 停止產生 token 的序列 |
| stream | boolean | 是否串流回應 |
| stream_options | object | 串流選項，例如 `{"include_usage": true}` |
| temperature | number | 控制隨機性 |
| tool_choice | string/object | 控制模型呼叫哪個工具（如果有） |
| tools | array | 模型可使用的工具清單 |
| top_p | number | 控制 nucleus sampling |
| user | string | 使用者識別碼 |

## 提示詞快取 {#prompt-caching}

閘道會自動快取可辨識的提示詞前綴。快取的輸入 token 會以 `prompt_tokens_details.cached_tokens` 回來，並依模型的快取輸入價格計費，而 LiteLLM 會從模型對應表讀取該價格以進行成本追蹤
