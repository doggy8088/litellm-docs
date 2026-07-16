### 設定提供者特定參數 {#setting-provider-specific-params}

目標：跨 OpenAI + Cohere 設定 max tokens

**1. 透過 completion**

LiteLLM 會自動將 max_tokens 轉換為該特定模型提供者所遵循的命名慣例。

```python
from litellm import completion
import os

## set ENV variables 
os.environ["OPENAI_API_KEY"] = "your-openai-key" 
os.environ["COHERE_API_KEY"] = "your-cohere-key" 

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages, max_tokens=100)

# cohere call
response = completion(model="command-nightly", messages=messages, max_tokens=100)
print(response)
```

**2. 透過提供者特定設定**

對於 LiteLLM 上的每個提供者，我們都已取得其特定參數（依照其命名慣例等）。您只要透過 `litellm.<provider_name>Config` 叫出該提供者，就能為該提供者設定。 

所有提供者設定都有型別與 docstring，因此您應該會在 VSCode 中看到自動完成，並附上其意義的說明。 

以下是透過提供者設定來設定 max tokens 的範例。
