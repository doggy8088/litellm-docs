import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Triton Inference Server {#triton-inference-server}

LiteLLM 支援 Triton Inference Server 上的嵌入模型

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | NVIDIA Triton Inference Server |
| LiteLLM 上的提供者路由 | `triton/` |
| 支援的操作 | `/chat/completion`, `/completion`, `/embedding` |
| 支援的 Triton 端點 | `/infer`, `/generate`, `/embeddings` |
| 提供者文件連結 | [Triton Inference Server ↗](https://developer.nvidia.com/triton-inference-server) |

## Triton `/generate` - 聊天完成 {#triton-generate---chat-completion}

<Tabs>
<TabItem value="sdk" label="SDK">

使用 `triton/` 前綴來路由至 triton server
```python
from litellm import completion
response = completion(
    model="triton/llama-3-8b-instruct",
    messages=[{"role": "user", "content": "who are u?"}],
    max_tokens=10,
    api_base="http://localhost:8000/generate",
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至您的 config.yaml

  ```yaml
  model_list:
    - model_name: my-triton-model
      litellm_params:
        model: triton/<your-triton-model>"
        api_base: https://your-triton-api-base/triton/generate
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --detailed_debug
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

    ```python
    import openai
    from openai import OpenAI

    # set base_url to your proxy server
    # set api_key to send to proxy server
    client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

    response = client.chat.completions.create(
        model="my-triton-model",
        messages=[{"role": "user", "content": "who are u?"}],
        max_tokens=10,
    )

    print(response)

    ```

  </TabItem>

  <TabItem value="curl" label="curl">

  `--header` 為選用項目，僅在您使用帶有 Virtual Keys 的 litellm proxy 時才需要

    ```shell
    curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data ' {
    "model": "my-triton-model",
    "messages": [{"role": "user", "content": "who are u?"}]
    }'

    ```
  </TabItem>

  </Tabs>

</TabItem>
</Tabs>

## Triton `/infer` - 聊天完成 {#triton-infer---chat-completion}

<Tabs>
<TabItem value="sdk" label="SDK">

使用 `triton/` 前綴來路由至 triton server
```python
from litellm import completion


response = completion(
    model="triton/llama-3-8b-instruct",
    messages=[{"role": "user", "content": "who are u?"}],
    max_tokens=10,
    api_base="http://localhost:8000/infer",
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至您的 config.yaml

  ```yaml
  model_list:
    - model_name: my-triton-model
      litellm_params:
        model: triton/<your-triton-model>"
        api_base: https://your-triton-api-base/triton/infer
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --detailed_debug
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

    ```python
    import openai
    from openai import OpenAI

    # set base_url to your proxy server
    # set api_key to send to proxy server
    client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

    response = client.chat.completions.create(
        model="my-triton-model",
        messages=[{"role": "user", "content": "who are u?"}],
        max_tokens=10,
    )

    print(response)

    ```

  </TabItem>

  <TabItem value="curl" label="curl">

  `--header` 為選用項目，僅在您使用帶有 Virtual Keys 的 litellm proxy 時才需要

    ```shell
    curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data ' {
    "model": "my-triton-model",
    "messages": [{"role": "user", "content": "who are u?"}]
    }'

    ```
  </TabItem>

  </Tabs>

</TabItem>
</Tabs>

## Triton `/embeddings` - 嵌入 {#triton-embeddings---embedding}

<Tabs>
<TabItem value="sdk" label="SDK">

使用 `triton/` 前綴來路由至 triton server
```python
from litellm import embedding
import os

response = await litellm.aembedding(
    model="triton/<your-triton-model>",                                                       
    api_base="https://your-triton-api-base/triton/embeddings", # /embeddings endpoint you want litellm to call on your server
    input=["good morning from litellm"],
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至您的 config.yaml

  ```yaml
  model_list:
    - model_name: my-triton-model
      litellm_params:
        model: triton/<your-triton-model>"
        api_base: https://your-triton-api-base/triton/embeddings
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --detailed_debug
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

    ```python
    import openai
    from openai import OpenAI

    # set base_url to your proxy server
    # set api_key to send to proxy server
    client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

    response = client.embeddings.create(
        input=["hello from litellm"],
        model="my-triton-model"
    )

    print(response)

    ```

  </TabItem>

  <TabItem value="curl" label="curl">

  `--header` 為選用項目，僅在您使用帶有 Virtual Keys 的 litellm proxy 時才需要

    ```shell
    curl --location 'http://0.0.0.0:4000/embeddings' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data ' {
    "model": "my-triton-model",
    "input": ["write a litellm poem"]
    }'

    ```
  </TabItem>

  </Tabs>

</TabItem>

</Tabs>
