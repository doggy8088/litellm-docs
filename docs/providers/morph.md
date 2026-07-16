# Morph {#morph}

LiteLLM 支援 [Morph](https://morphllm.com) 上的所有模型

## 概觀 {#overview}

Morph 提供專為代理式工作流程設計的專用 AI 模型，特別擅長精確的程式碼編輯與操作。其「Apply」模型可在不完整重寫檔案的情況下，進行有針對性的程式碼變更，非常適合需要進行智慧、具情境感知程式碼修改的 AI 代理程式。

## API 金鑰 {#api-key}
```python
import os 
os.environ["MORPH_API_KEY"] = "your-api-key"
```

## 範例用法 {#sample-usage}

```python
from litellm import completion

# set env variable 
os.environ["MORPH_API_KEY"] = "your-api-key"

messages = [
    {"role": "user", "content": "Write a Python function to calculate factorial"}
]

## Morph v3 Fast - Optimized for speed
response = completion(
    model="morph/morph-v3-fast",
    messages=messages,
)
print(response)

## Morph v3 Large - Most capable model
response = completion(
    model="morph/morph-v3-large", 
    messages=messages,
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion

# set env variable
os.environ["MORPH_API_KEY"] = "your-api-key"

messages = [
    {"role": "user", "content": "Write a Python function to calculate factorial"}
]

## Morph v3 Fast with streaming
response = completion(
    model="morph/morph-v3-fast",
    messages=messages,
    stream=True,
)

for chunk in response:
    print(chunk)
```

## 支援的模型 {#supported-models}

| 模型名稱               | 函式呼叫                              | 說明 | 上下文視窗 |
|--------------------------|--------------------------------------------|-----------------------|----------------|
| morph-v3-fast            | `completion('morph/morph-v3-fast', messages)` | 速度最快的模型，針對快速回應進行最佳化 | 16k tokens |
| morph-v3-large           | `completion('morph/morph-v3-large', messages)` | 最適合複雜任務的高能力模型 | 16k tokens |

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

以下是如何在 LiteLLM Proxy Server 中使用 Morph：

1. 將 API 金鑰儲存在您的環境中
```bash
export MORPH_API_KEY="your-api-key"
```

2. 將模型加入 config.yaml
```yaml
model_list:
  - model_name: morph-v3-fast
    litellm_params:
      model: morph/morph-v3-fast
      
  - model_name: morph-v3-large
    litellm_params:
      model: morph/morph-v3-large
```

3. 啟動 proxy server
```bash
litellm --config config.yaml
```

## 進階用法 {#advanced-usage}

### 設定 API Base {#setting-api-base}
```python
import litellm 

# set custom api base
response = completion(
    model="morph/morph-v3-large",
    messages=[{"role": "user", "content": "Hello, world!"}],
    api_base="https://api.morphllm.com/v1"
)
print(response)
```

### 設定 API 金鑰 {#setting-api-key}
```python 
import litellm 

# set api key via completion
response = completion(
    model="morph/morph-v3-large",
    messages=[{"role": "user", "content": "Hello, world!"}],
    api_key="your-api-key"
)
print(response)
```
