# 使用 Text Completion 格式 - 搭配 Completion() {#using-text-completion-format---with-completion}

如果您偏好使用 OpenAI Text Completion 格式，本教學會說明如何以此格式使用 LiteLLM
```python
response = openai.Completion.create(
    model="text-davinci-003",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

## 使用 LiteLLM 的 Text Completion 格式 {#using-litellm-in-the-text-completion-format}
### 搭配 gpt-3.5-turbo {#with-gpt-35-turbo}
```python
from litellm import text_completion
response = text_completion(
    model="gpt-3.5-turbo",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### 搭配 text-davinci-003 {#with-text-davinci-003}
```python
response = text_completion(
    model="text-davinci-003",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### 搭配 llama2 {#with-llama2}
```python
response = text_completion(
    model="togethercomputer/llama-2-70b-chat",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```
