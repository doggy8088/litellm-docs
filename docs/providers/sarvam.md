# Sarvam.ai {#sarvamai}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 支援來自 [Sarvam ai](https://docs.sarvam.ai/api-reference-docs/chat/chat-completions) 的所有文字模型

## 用法 {#usage}

```python
import os
from litellm import completion

# Set your Sarvam API key
os.environ["SARVAM_API_KEY"] = ""

messages = [{"role": "user", "content": "Hello"}]

response = completion(
    model="sarvam/sarvam-m",
    messages=messages,
)
print(response)
```

## 搭配 LiteLLM Proxy Server 的用法 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Sarvam.ai 模型

1. **修改 `config.yaml`：**

    ```yaml
    model_list:
      - model_name: my-model
        litellm_params:
          model: sarvam/<your-model-name>  # add sarvam/ prefix to route as Sarvam provider
          api_key: api-key                 # api key to send your model
    ```

2. **啟動 proxy：**

    ```bash
    $ litellm --config /path/to/config.yaml
    ```

3. **向 LiteLLM Proxy Server 傳送請求：**

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
        messages=[
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
        ]
    }'
    ```
    </TabItem>

    </Tabs>
