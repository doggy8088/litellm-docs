import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Llamafile {#llamafile}

LiteLLM 支援 Llamafile 上的所有模型。

| 屬性                  | 詳細資訊                                                                                                                              |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| 說明               | llamafile 可讓您使用單一檔案來散佈並執行 LLM。 [文件](https://github.com/Mozilla-Ocho/llamafile/blob/main/README.md) |
| LiteLLM 提供者路由 | `llamafile/`（適用於 OpenAI 相容伺服器）                                                                                          |
| 提供者文件              | [llamafile ↗](https://github.com/Mozilla-Ocho/llamafile/blob/main/llama.cpp/server/README.md#api-endpoints)                          |
| 支援的端點       | `/chat/completions`, `/embeddings`, `/completions`                                                                                   |

# 快速開始 {#quick-start}

## 使用方式 - litellm.completion（呼叫 OpenAI 相容端點） {#usage---litellmcompletion-calling-openai-compatible-endpoint}
llamafile 提供 OpenAI 相容的聊天完成端點——以下是如何使用 LiteLLM 呼叫它

若要使用 litellm 呼叫 llamafile，請將下列內容加入您的 completion 呼叫中

* `model="llamafile/<your-llamafile-model-name>"` 
* `api_base = "your-hosted-llamafile"`

```python
import litellm 

response = litellm.completion(
            model="llamafile/mistralai/mistral-7b-instruct-v0.2", # pass the llamafile model name for completeness
            messages=messages,
            api_base="http://localhost:8080/v1",
            temperature=0.2,
            max_tokens=80)

print(response)
```


## 使用方式 -  LiteLLM Proxy Server（呼叫 OpenAI 相容端點） {#usage----litellm-proxy-server-calling-openai-compatible-endpoint}

以下是如何使用 LiteLLM Proxy Server 呼叫 OpenAI 相容端點

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: llamafile/mistralai/mistral-7b-instruct-v0.2 # add llamafile/ prefix to route as OpenAI provider
        api_base: http://localhost:8080/v1 # add api base for OpenAI compatible provider
  ```

1. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

1. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-1234", # pass litellm proxy key, if you're using virtual keys
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

## 嵌入向量 {#embeddings}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding   
import os

os.environ["LLAMAFILE_API_BASE"] = "http://localhost:8080/v1"


embedding = embedding(model="llamafile/sentence-transformers/all-MiniLM-L6-v2", input=["Hello world"])

print(embedding)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: my-model
      litellm_params:
        model: llamafile/sentence-transformers/all-MiniLM-L6-v2 # add llamafile/ prefix to route as OpenAI provider
        api_base: http://localhost:8080/v1 # add api base for OpenAI compatible provider
```

1. 啟動 proxy 

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

1. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/embeddings' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"input": ["hello world"], "model": "my-model"}'
```

[查看 OpenAI SDK/Langchain/etc. 範例](../proxy/user_keys.md#embeddings)

</TabItem>
</Tabs>
