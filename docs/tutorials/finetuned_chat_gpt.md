# 使用微調的 gpt-3.5-turbo {#using-fine-tuned-gpt-35-turbo}
LiteLLM 讓您能夠搭配您的微調 gpt-3.5-turbo 模型來呼叫 `completion`
如果您想要依照本教學建立自訂的微調 gpt-3.5-turbo 模型：https://platform.openai.com/docs/guides/fine-tuning/preparing-your-dataset

當您建立好微調模型後，就可以使用 `litellm.completion()` 來呼叫它

## 用法 {#usage}
```python
import os
from litellm import completion

# LiteLLM reads from your .env
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="ft:gpt-3.5-turbo:my-org:custom_suffix:id",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
)

print(response.choices[0].message)
```

## 用法 - 設定 OpenAI Organization ID {#usage---setting-openai-organization-id}
LiteLLM 讓您在呼叫 OpenAI LLM 時，可以指定您的 OpenAI Organization。更多詳細資訊請參閱： 
[設定 Organization ID](https://docs.litellm.ai/docs/providers/openai#setting-organization-id-for-completion-calls)
這可以透過以下其中一種方式設定：
- 環境變數 `OPENAI_ORGANIZATION`
- 傳遞給 `litellm.completion(model=model, organization="your-organization-id")` 的參數
- 設為 `litellm.organization="your-organization-id"`
```python
import os
from litellm import completion

# LiteLLM reads from your .env
os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENAI_ORGANIZATION"] = "your-org-id" # Optional

response = completion(
  model="ft:gpt-3.5-turbo:my-org:custom_suffix:id",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
)

print(response.choices[0].message)
```
