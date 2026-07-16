# Volcano Engine（Volcengine） {#volcano-engine-volcengine}
https://www.volcengine.com/docs/82379/1263482

:::tip

**我們支援所有 Volcengine 模型，包括 Chat 和 Embeddings，送出 litellm 請求時只要將 `model=volcengine/<any-model-on-volcengine>` 作為前綴即可**

:::

## API 金鑰 {#api-key}
```python
# env variable
os.environ['VOLCENGINE_API_KEY']
# or
os.environ['ARK_API_KEY']
```

## 使用範例 {#sample-usage}
```python
from litellm import completion
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = completion(
    model="volcengine/<OUR_ENDPOINT_ID>",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    temperature=0.2,        # optional
    top_p=0.9,              # optional
    frequency_penalty=0.1,  # optional
    presence_penalty=0.1,   # optional
    max_tokens=10,          # optional
    stop=["\n\n"],          # optional
)
print(response)
```

## 使用範例 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = completion(
    model="volcengine/<OUR_ENDPOINT_ID>",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    stream=True,
    temperature=0.2,        # optional
    top_p=0.9,              # optional
    frequency_penalty=0.1,  # optional
    presence_penalty=0.1,   # optional
    max_tokens=10,          # optional
    stop=["\n\n"],          # optional
)

for chunk in response:
    print(chunk)
```

## 使用範例 - 嵌入 {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = embedding(
    model="volcengine/doubao-embedding-text-240715",
    input=["hello world", "good morning"]
)
print(response)
```

### 支援的嵌入模型 {#supported-embedding-models}
- `doubao-embedding-large`（2048 維）
- `doubao-embedding-large-text-250515`（2048 維）
- `doubao-embedding-large-text-240915`（4096 維）
- `doubao-embedding`（2560 維） 
- `doubao-embedding-text-240715`（2560 維）

### 嵌入參數 {#embedding-parameters}
```python
from litellm import embedding

response = embedding(
    model="volcengine/doubao-embedding-text-240715",
    input=["sample text"],
    encoding_format="float",  # optional: "float" (default), "base64"
    user="user-123",          # optional: user identifier for tracking
)
```

## 支援的模型 - 💥 支援所有 Volcengine 模型！ {#supported-models----all-volcengine-models-supported}
我們支援所有 `volcengine` 模型，包含 chat completions 與 embeddings：
- **Chat 模型**：在送出 completion 請求時，將 `volcengine/<OUR_ENDPOINT_ID>` 設為前綴
- **Embedding 模型**：使用上方列出的特定模型名稱（例如：`volcengine/doubao-embedding-text-240715`）

## 使用範例 - LiteLLM Proxy {#sample-usage---litellm-proxy}

### Config.yaml 設定 {#configyaml-setting}

```yaml
model_list:
  # Chat model
  - model_name: volcengine-model
    litellm_params:
      model: volcengine/<OUR_ENDPOINT_ID>
      api_key: os.environ/VOLCENGINE_API_KEY
  # Embedding model
  - model_name: volcengine-embedding
    litellm_params:
      model: volcengine/doubao-embedding-text-240715
      api_key: os.environ/VOLCENGINE_API_KEY
```

### 送出請求 {#send-request}

#### 聊天完成 {#chat-completion}
```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "volcengine-model",
    "messages": [
        {
        "role": "user",
        "content": "here is my api key. openai_api_key=sk-1234"
        }
    ]
}'
```

#### 嵌入 {#embedding}
```shell
curl --location 'http://localhost:4000/embeddings' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "volcengine-embedding",
    "input": ["hello world", "good morning"]
}'
```
