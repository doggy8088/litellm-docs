# NLP Cloud {#nlp-cloud}

LiteLLM 支援 NLP Cloud 上的所有 LLM。

## API 金鑰 {#api-keys}

```python 
import os 

os.environ["NLP_CLOUD_API_KEY"] = "your-api-key"
```

## 使用範例 {#sample-usage}

```python
import os
from litellm import completion 

# set env
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="dolphin", messages=messages)
print(response)
```

## 串流  {#streaming}
呼叫 completion 時，只要設定 `stream=True`。

```python
import os
from litellm import completion 

# set env
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="dolphin", messages=messages, stream=True)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```

## 非 dolphin 模型  {#non-dolphin-models}

預設情況下，LiteLLM 會將 `dolphin` 和 `chatdolphin` 對應到 nlp cloud。

如果您要嘗試透過 nlp cloud 呼叫其他任何模型（例如 GPT-J、Llama-2 等），只要將其設為您的自訂 llm provider 即可。

```python
import os
from litellm import completion 

# set env - [OPTIONAL] replace with your nlp cloud key
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]

# e.g. to call Llama2 on NLP Cloud
response = completion(model="nlp_cloud/finetuned-llama-2-70b", messages=messages, stream=True)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```
