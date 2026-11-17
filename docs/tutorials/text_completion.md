# 使用 Text Completion 格式 - 搭配 Completion() {#using-text-completion-format---with-completion}

如果您偏好使用 OpenAI Text Completion 格式，本教學會說明如何以此格式使用 LiteLLM
```python keep-model-ids
from openai import OpenAI

client = OpenAI()
response = client.completions.create(
    model="gpt-5.4-mini",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

## 使用 LiteLLM 的 Text Completion 格式 {#using-litellm-in-the-text-completion-format}
### 搭配 gpt-5.4-mini {#with-gpt-54-mini}
```python keep-model-ids
from litellm import text_completion
response = text_completion(
    model="gpt-5.4-mini",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### 搭配 OpenAI completions 端點 {#with-the-openai-completions-endpoint}
這會將提示原封不動地傳送到 OpenAI 舊版的 `/v1/completions` 端點。哪些模型仍會在該端點回應，請參閱 [OpenAI (Text Completion)](../providers/text_completion_openai.md)。

```python keep-model-ids
response = text_completion(
    model="text-completion-openai/gpt-5.4-mini",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### 搭配 Together AI 上的開放模型 {#with-an-open-model-on-together-ai}
```python
response = text_completion(
    model="together_ai/openai/gpt-oss-120b",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```
