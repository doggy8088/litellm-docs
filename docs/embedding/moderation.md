# litellm.moderation() {#litellmmoderation}
LiteLLM 支援 OpenAI 的審核端點

## 使用方式 {#usage}
```python
import os
from litellm import moderation
os.environ['OPENAI_API_KEY'] = ""
response = moderation(input="i'm ishaan cto of litellm")   
```
