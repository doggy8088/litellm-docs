import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI 相容端點 {#openai-compatible-endpoints}

:::info

將 `openai` 選為提供者，會透過上游的 [官方 OpenAI Python API 函式庫](https://github.com/openai/openai-python/blob/main/README.md) 將您的請求路由到 OpenAI 相容端點。

此函式庫對所有請求都**需要** API 金鑰，可透過 `api_key` 參數或 `OPENAI_API_KEY` 環境變數提供。

如果您不想在每個請求中提供假的 API 金鑰，請考慮使用與您的 OpenAI 相容端點直接匹配的提供者，例如 [`hosted_vllm`](/docs/providers/vllm) 或 [`llamafile`](/docs/providers/llamafile)。

:::

若要呼叫託管在 openai proxy 後方的模型，請做 2 項變更：

1. 對 `/chat/completions`：在模型名稱前加上 `openai/`，讓 litellm 知道您正在嘗試呼叫 openai `/chat/completions` 端點。 

1. 對 `/completions`：在模型名稱前加上 `text-completion-openai/`，讓 litellm 知道您正在嘗試呼叫 openai `/completions` 端點。[對透過 `/v1/completions` 路由呼叫的 `openai/` 端點**不需要**。]

1. **請勿**在 base url 後額外加上任何內容，例如 `/v1/embedding`。LiteLLM 會使用 openai-client 進行這些呼叫，而它會自動加入相關端點。 

## 使用方式 - completion {#usage---completion}
```python
import litellm
import os

response = litellm.completion(
    model="openai/mistral",               # add `openai/` prefix to model so litellm knows to route to OpenAI
    api_key="sk-1234",                  # api key to your openai compatible endpoint
    api_base="http://0.0.0.0:4000",     # set API Base of your Custom OpenAI Endpoint
    messages=[
                {
                    "role": "user",
                    "content": "Hey, how's it going?",
                }
    ],
)
print(response)
```

## 使用方式 - embedding {#usage---embedding}

```python
import litellm
import os

response = litellm.embedding(
    model="openai/GPT-J",               # add `openai/` prefix to model so litellm knows to route to OpenAI
    api_key="sk-1234",                  # api key to your openai compatible endpoint
    api_base="http://0.0.0.0:4000",     # set API Base of your Custom OpenAI Endpoint
    input=["good morning from litellm"]
)
print(response)
```


## 搭配 LiteLLM Proxy Server 使用 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 OpenAI 相容端點

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: openai/<your-model-name>  # add openai/ prefix to route as OpenAI provider
        api_base: <model-api-base>       # add api base for OpenAI compatible provider
        api_key: api-key                 # api key to send your model
  ```

  :::info

  如果測試時看到 `Not Found Error`，請確認您的 `api_base` 具有 `/v1` 後綴

  範例：`http://vllm-endpoint.xyz/v1`

  :::

2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 將請求送至 LiteLLM Proxy Server

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

### 進階 - 停用系統訊息 {#advanced---disable-system-messages}

某些 VLLM 模型（例如 gemma）不支援系統訊息。若要將這些請求對應為 'user' 訊息，請使用 `supports_system_message` 旗標。 

```yaml
model_list:
- model_name: my-custom-model
   litellm_params:
      model: openai/google/gemma
      api_base: http://my-custom-base
      api_key: "" 
      supports_system_message: False # 👈 KEY CHANGE
```
