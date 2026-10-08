# Petals {#petals}
Petals: https://github.com/bigscience-workshop/petals

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_Petals.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

## 前置需求 {#pre-requisites}
請確認您已安裝 `petals`
```shell
uv add git+https://github.com/bigscience-workshop/petals
```

## 用法 {#usage}
請確認您將 `petals/` 加為所有 petals LLM 的前綴。這會將 custom_llm_provider 設為 petals

```python
from litellm import completion

response = completion(
    model="petals/petals-team/StableBeluga2", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)

print(response)
```

## 串流用法 {#usage-with-streaming}

```python
response = completion(
    model="petals/petals-team/StableBeluga2", 
    messages=[{ "content": "Hello, how are you?","role": "user"}],
    stream=True
)

print(response)
for chunk in response:
  print(chunk)
```

### 模型詳細資料 {#model-details}

| 模型名稱       | 函式呼叫                              |
|------------------|--------------------------------------------|
| petals-team/StableBeluga | `completion('petals/petals-team/StableBeluga2', messages)` | 
| huggyllama/llama-65b | `completion('petals/huggyllama/llama-65b', messages)` |
