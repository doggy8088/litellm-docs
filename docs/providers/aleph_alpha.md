# Aleph Alpha {#aleph-alpha}

LiteLLM 支援來自 [Aleph Alpha](https://www.aleph-alpha.com/) 的所有模型。 

如同 AI21 和 Cohere，您可以在沒有候補名單的情況下使用這些模型。 

### API 金鑰 {#api-keys}
```python
import os
os.environ["ALEPHALPHA_API_KEY"] = ""
```

### Aleph Alpha 模型 {#aleph-alpha-models}
https://www.aleph-alpha.com/

| 模型名稱       | 函式呼叫                                  | 必要的作業系統變數              |
|------------------|--------------------------------------------|------------------------------------|
| luminous-base       | `completion(model='luminous-base', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-base-control       | `completion(model='luminous-base-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended       | `completion(model='luminous-extended', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended-control       | `completion(model='luminous-extended-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme     | `completion(model='luminous-supreme', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme-control     | `completion(model='luminous-supreme-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
