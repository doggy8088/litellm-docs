import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Predibase {#predibase}

LiteLLM 支援 Predibase 上的所有模型

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### API 金鑰 {#api-keys}
```python
import os 
os.environ["PREDIBASE_API_KEY"] = ""
```

### 範例呼叫 {#example-call}

```python
from litellm import completion
import os
## set ENV variables
os.environ["PREDIBASE_API_KEY"] = "predibase key"
os.environ["PREDIBASE_TENANT_ID"] = "predibase tenant id"

# predibase llama-3 call
response = completion(
    model="predibase/llama-3-8b-instruct", 
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
        model: predibase/llama-3-8b-instruct
        api_key: os.environ/PREDIBASE_API_KEY
        tenant_id: os.environ/PREDIBASE_TENANT_ID
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --debug
  ```

3. 將請求傳送至 LiteLLM Proxy Server

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

</TabItem>

</Tabs>

## 進階使用方式 - 提示詞格式化  {#advanced-usage---prompt-formatting}

LiteLLM 為所有 `meta-llama` llama3 instruct 模型提供提示詞範本對應。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/4f46b4c3975cd0f72b8c5acb2cb429d23580c18a/litellm/llms/prompt_templates/factory.py#L1360)

若要套用自訂提示詞範本： 

<Tabs>
<TabItem value="sdk" label="SDK">

```python 
import litellm

import os 
os.environ["PREDIBASE_API_KEY"] = ""

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

def predibase_custom_model():
    model = "predibase/togethercomputer/LLaMA-2-7B-32K"
    response = completion(model=model, messages=messages)
    print(response['choices'][0]['message']['content'])
    return response

predibase_custom_model()
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
# Model-specific parameters
model_list:
  - model_name: mistral-7b # model alias
    litellm_params: # actual params for litellm.completion()
      model: "predibase/mistralai/Mistral-7B-Instruct-v0.1" 
      api_key: os.environ/PREDIBASE_API_KEY
      initial_prompt_value: "\n"
      roles: {"system":{"pre_message":"<|im_start|>system\n", "post_message":"<|im_end|>"}, "assistant":{"pre_message":"<|im_start|>assistant\n","post_message":"<|im_end|>"}, "user":{"pre_message":"<|im_start|>user\n","post_message":"<|im_end|>"}}
      final_prompt_value: "\n"
      bos_token: "<s>"
      eos_token: "</s>"
      max_tokens: 4096
```

</TabItem>

</Tabs>

## 傳遞額外參數 - max_tokens, temperature  {#passing-additional-params---max_tokens-temperature}
查看所有 litellm.completion 支援的參數 [這裡](https://docs.litellm.ai/docs/completion/input)

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["PREDIBASE_API_KEY"] = "predibase key"

# predibae llama-3 call
response = completion(
    model="predibase/llama3-8b-instruct", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    max_tokens=20,
    temperature=0.5
)
```

**代理**

```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: predibase/llama-3-8b-instruct
        api_key: os.environ/PREDIBASE_API_KEY
        max_tokens: 20
        temperature: 0.5
```

## 傳遞 Predibase 特定參數 - adapter_id, adapter_source,  {#passings-predibase-specific-params---adapter_id-adapter_source}
傳送 [不受 `litellm.completion()` 支援](https://docs.litellm.ai/docs/completion/input) 但可透過將其傳遞給 `litellm.completion` 來由 Predibase 支援的參數

範例 `adapter_id`, `adapter_source` 是 Predibase 特定參數 - [查看清單](https://github.com/BerriAI/litellm/blob/8a35354dd6dbf4c2fcefcd6e877b980fcbd68c58/litellm/llms/predibase.py#L54)

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["PREDIBASE_API_KEY"] = "predibase key"

# predibase llama3 call
response = completion(
    model="predibase/llama-3-8b-instruct", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    adapter_id="my_repo/3",
    adapter_source="pbase",
)
```

**代理**

```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: predibase/llama-3-8b-instruct
        api_key: os.environ/PREDIBASE_API_KEY
        adapter_id: my_repo/3
        adapter_source: pbase
```
