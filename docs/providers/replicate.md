import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Replicate {#replicate}

LiteLLM 支援 Replicate 上的所有模型

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### API 金鑰 {#api-keys}
```python
import os 
os.environ["REPLICATE_API_KEY"] = ""
```

### 範例呼叫 {#example-call}

```python
from litellm import completion
import os
## set ENV variables
os.environ["REPLICATE_API_KEY"] = "replicate key"

# replicate llama-3 call
response = completion(
    model="replicate/meta/meta-llama-3-8b-instruct", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型加入您的 config.yaml

  ```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: replicate/meta/meta-llama-3-8b-instruct
        api_key: os.environ/REPLICATE_API_KEY
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --debug
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
      model="llama-3",
      messages = [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
    ]
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
      "model": "llama-3",
      "messages": [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
        ],
  }'
  ```
  </TabItem>

  </Tabs>

### 預期的 Replicate 呼叫  {#expected-replicate-call}

這是 litellm 將向 replicate 發出的呼叫，來自上述範例： 

```bash

POST Request Sent from LiteLLM:
curl -X POST \
https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct \
-H 'Authorization: Token your-api-key' -H 'Content-Type: application/json' \
-d '{'version': 'meta/meta-llama-3-8b-instruct', 'input': {'prompt': '<|start_header_id|>system<|end_header_id|>\n\nBe a good human!<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nWhat do you know about earth?<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n'}}'
```

</TabItem>

</Tabs>

## 進階用法 - Prompt 格式化  {#advanced-usage---prompt-formatting}

LiteLLM 針對所有 `meta-llama` llama3 instruct 模型都有 prompt 範本對應。[**請見程式碼**](https://github.com/BerriAI/litellm/blob/4f46b4c3975cd0f72b8c5acb2cb429d23580c18a/litellm/llms/prompt_templates/factory.py#L1360)

若要套用自訂 prompt 範本： 

<Tabs>
<TabItem value="sdk" label="SDK">

```python 
import litellm

import os 
os.environ["REPLICATE_API_KEY"] = ""

# Create your own custom prompt template 
litellm.register_prompt_template(
	    model="togethercomputer/LLaMA-2-7B-32K",
        initial_prompt_value="You are a good assistant" # [OPTIONAL]
	    roles={
            "system": {
                "pre_message": "[INST] <<SYS>>\n", # [OPTIONAL]
                "post_message": "\n<</SYS>>\n [/INST]\n" # [OPTIONAL]
            },
            "user": { 
                "pre_message": "[INST] ", # [OPTIONAL]
                "post_message": " [/INST]" # [OPTIONAL]
            }, 
            "assistant": {
                "pre_message": "\n" # [OPTIONAL]
                "post_message": "\n" # [OPTIONAL]
            }
        }
        final_prompt_value="Now answer as best you can:" # [OPTIONAL]
)

def test_replicate_custom_model():
    model = "replicate/togethercomputer/LLaMA-2-7B-32K"
    response = completion(model=model, messages=messages)
    print(response['choices'][0]['message']['content'])
    return response

test_replicate_custom_model()
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
# Model-specific parameters
model_list:
  - model_name: mistral-7b # model alias
    litellm_params: # actual params for litellm.completion()
      model: "replicate/mistralai/Mistral-7B-Instruct-v0.1" 
      api_key: os.environ/REPLICATE_API_KEY
      initial_prompt_value: "\n"
      roles: {"system":{"pre_message":"<|im_start|>system\n", "post_message":"<|im_end|>"}, "assistant":{"pre_message":"<|im_start|>assistant\n","post_message":"<|im_end|>"}, "user":{"pre_message":"<|im_start|>user\n","post_message":"<|im_end|>"}}
      final_prompt_value: "\n"
      bos_token: "<s>"
      eos_token: "</s>"
      max_tokens: 4096
```

</TabItem>

</Tabs>

## 進階用法 - 呼叫 Replicate 部署 {#advanced-usage---calling-replicate-deployments}
呼叫 [已部署的 replicate LLM](https://replicate.com/deployments)
將 `replicate/deployments/` 前綴加到您的 model，讓 litellm 會呼叫 `deployments` endpoint。這會呼叫 replicate 上的 `ishaan-jaff/ishaan-mistral` 部署

```python
response = completion(
    model="replicate/deployments/ishaan-jaff/ishaan-mistral", 
    messages= [{ "content": "Hello, how are you?","role": "user"}]
)
```

:::warning Replicate 冷啟動

由於 replicate 冷啟動，Replicate 回應可能需要 3-5 分鐘；如果您想除錯，請嘗試使用 `litellm.set_verbose=True` 發出請求。[更多關於 replicate 冷啟動的資訊](https://replicate.com/docs/how-does-replicate-work#cold-boots)

:::

## Replicate 模型 {#replicate-models}
liteLLM 支援所有 replicate LLM

對於 replicate 模型，請務必在 `model` 引數加上 `replicate/` 前綴。liteLLM 會使用此引數偵測它。 

以下是使用 liteLLM 呼叫 replicate LLM 的範例 

模型名稱                  | 函式呼叫                                                  | 必要的作業系統環境變數                |
-----------------------------|----------------------------------------------------------------|--------------------------------------|
 replicate/llama-2-70b-chat | `completion(model='replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf', messages)` | `os.environ['REPLICATE_API_KEY']`    |
 a16z-infra/llama-2-13b-chat| `completion(model='replicate/a16z-infra/llama-2-13b-chat:2a7f981751ec7fdf87b5b91ad4db53683a98082e9ff7bfd12c8cd5ea85980a52', messages)`| `os.environ['REPLICATE_API_KEY']`    |
 replicate/vicuna-13b  | `completion(model='replicate/vicuna-13b:6282abe6a492de4145d7bb601023762212f9ddbbe78278bd6771c8b3b2f2a13b', messages)` | `os.environ['REPLICATE_API_KEY']` |
 daanelson/flan-t5-large    | `completion(model='replicate/daanelson/flan-t5-large:ce962b3f6792a57074a601d3979db5839697add2e4e02696b3ced4c022d4767f', messages)`    | `os.environ['REPLICATE_API_KEY']`    |
 custom-llm    | `completion(model='replicate/custom-llm-version-id', messages)`    | `os.environ['REPLICATE_API_KEY']`    |
  replicate deployment    | `completion(model='replicate/deployments/ishaan-jaff/ishaan-mistral', messages)`    | `os.environ['REPLICATE_API_KEY']`    |

## 傳遞額外參數 - max_tokens, temperature  {#passing-additional-params---max_tokens-temperature}
查看所有 litellm.completion 支援的參數 [請見此處](https://docs.litellm.ai/docs/completion/input)

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["REPLICATE_API_KEY"] = "replicate key"

# replicate llama-2 call
response = completion(
    model="replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    max_tokens=20,
    temperature=0.5
)
```

**proxy**

```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: replicate/meta/meta-llama-3-8b-instruct
        api_key: os.environ/REPLICATE_API_KEY
        max_tokens: 20
        temperature: 0.5
```

## 傳遞 Replicate 特定參數 {#passings-replicate-specific-params}
透過將參數傳給 `litellm.completion`，傳送 [`litellm.completion()` 不支援的](https://docs.litellm.ai/docs/completion/input) 但 Replicate 支援的參數

範例 `seed`、`min_tokens` 是 Replicate 特定參數

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["REPLICATE_API_KEY"] = "replicate key"

# replicate llama-2 call
response = completion(
    model="replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    seed=-1,
    min_tokens=2,
    top_k=20,
)
```

**proxy**

```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: replicate/meta/meta-llama-3-8b-instruct
        api_key: os.environ/REPLICATE_API_KEY
        min_tokens: 2
        top_k: 20
```
