# Oobabooga Text Web API 教學 {#oobabooga-text-web-api-tutorial}

### 安裝 + 匯入 LiteLLM  {#install--import-litellm}
```python 
!uv add litellm
from litellm import completion 
import os
```

### 呼叫您的 oobabooga 模型 {#call-your-oobabooga-model}
請記得設定您的 api_base
```python
response = completion(
  model="oobabooga/WizardCoder-Python-7B-V1.0-GPTQ",
  messages=[{ "content": "can you write a binary tree traversal preorder","role": "user"}], 
  api_base="http://localhost:5000",
  max_tokens=4000
)
```

### 查看您的回應  {#see-your-response}
```python 
print(response)
```

感謝 [Shuai Shao](https://www.linkedin.com/in/shuai-sh/) 提供本教學。
