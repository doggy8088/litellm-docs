# Xinference [Xorbits Inference] {#xinference-xorbits-inference}
https://inference.readthedocs.io/en/latest/index.html

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Xinference 是一個開放原始碼平台，可使用任何開放原始碼 LLM、影像生成模型等進行推論。 |
| LiteLLM 提供者路由 | `xinference/` |
| 提供者文件連結 | [Xinference ↗](https://inference.readthedocs.io/en/latest/index.html) |
| 支援的操作 | [`/embeddings`](#sample-usage---embedding), [`/images/generations`](#image-generation) |

LiteLLM 支援 Xinference Embedding + Image Generation 呼叫。

## API 基底、金鑰 {#api-base-key}
```python
# env variable
os.environ['XINFERENCE_API_BASE'] = "http://127.0.0.1:9997/v1"
os.environ['XINFERENCE_API_KEY'] = "anything" #[optional] no api key required
```

## 範例用法 - Embedding {#sample-usage---embedding}
```python showLineNumbers
from litellm import embedding
import os

os.environ['XINFERENCE_API_BASE'] = "http://127.0.0.1:9997/v1"
response = embedding(
    model="xinference/bge-base-en",
    input=["good morning from litellm"],
)
print(response)
```

## 範例用法 `api_base` 參數 {#sample-usage-api_base-param}
```python showLineNumbers
from litellm import embedding
import os

response = embedding(
    model="xinference/bge-base-en",
    api_base="http://127.0.0.1:9997/v1",
    input=["good morning from litellm"],
)
print(response)
```

## 影像生成 {#image-generation}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

```python showLineNumbers
from litellm import image_generation
import os

# xinference image generation call
response = image_generation(
    model="xinference/stabilityai/stable-diffusion-3.5-large",
    prompt="A beautiful sunset over a calm ocean",
    api_base="http://127.0.0.1:9997/v1",
)
print(response)
```

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: xinference-sd
    litellm_params:
      model: xinference/stabilityai/stable-diffusion-3.5-large
      api_base: http://127.0.0.1:9997/v1
      api_key: anything
  model_info:
    mode: image_generation

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 proxy {#2-start-the-proxy}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 測試 {#3-test-it}

```bash showLineNumbers
curl --location 'http://0.0.0.0:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "xinference-sd",
    "prompt": "A beautiful sunset over a calm ocean",
    "n": 1,
    "size": "1024x1024",
    "response_format": "url"
}'
```

### 進階用法 - 使用額外參數 {#advanced-usage---with-additional-parameters}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['XINFERENCE_API_BASE'] = "http://127.0.0.1:9997/v1"

response = image_generation(
    model="xinference/stabilityai/stable-diffusion-3.5-large",
    prompt="A beautiful sunset over a calm ocean",
    n=1,                           # number of images
    size="1024x1024",             # image size
    response_format="b64_json",   # return format
)
print(response)
```

### 支援的影像生成模型 {#supported-image-generation-models}

Xinference 支援各種 stable diffusion 模型。以下是一些範例：

| 模型名稱                                              | 函式呼叫                                                                                      |
|---------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| stabilityai/stable-diffusion-3.5-large                 | `image_generation(model="xinference/stabilityai/stable-diffusion-3.5-large", prompt="...")`      |
| stabilityai/stable-diffusion-xl-base-1.0               | `image_generation(model="xinference/stabilityai/stable-diffusion-xl-base-1.0", prompt="...")`    |
| runwayml/stable-diffusion-v1-5                         | `image_generation(model="xinference/runwayml/stable-diffusion-v1-5", prompt="...")`              |

如需完整的支援影像生成模型清單，請參閱：https://inference.readthedocs.io/en/latest/models/builtin/image/index.html

## 支援的模型 {#supported-models}
此處列出的所有模型 https://inference.readthedocs.io/en/latest/models/builtin/embedding/index.html 都受支援

| 模型名稱                  | 函式呼叫                                                      |
|-----------------------------|--------------------------------------------------------------------|
| bge-base-en                 | `embedding(model="xinference/bge-base-en", input)`                 |
| bge-base-en-v1.5            | `embedding(model="xinference/bge-base-en-v1.5", input)`            |
| bge-base-zh                 | `embedding(model="xinference/bge-base-zh", input)`                 |
| bge-base-zh-v1.5            | `embedding(model="xinference/bge-base-zh-v1.5", input)`            |
| bge-large-en                | `embedding(model="xinference/bge-large-en", input)`                |
| bge-large-en-v1.5           | `embedding(model="xinference/bge-large-en-v1.5", input)`           |
| bge-large-zh                | `embedding(model="xinference/bge-large-zh", input)`                |
| bge-large-zh-noinstruct     | `embedding(model="xinference/bge-large-zh-noinstruct", input)`     |
| bge-large-zh-v1.5           | `embedding(model="xinference/bge-large-zh-v1.5", input)`           |
| bge-small-en-v1.5           | `embedding(model="xinference/bge-small-en-v1.5", input)`           |
| bge-small-zh                | `embedding(model="xinference/bge-small-zh", input)`                |
| bge-small-zh-v1.5           | `embedding(model="xinference/bge-small-zh-v1.5", input)`           |
| e5-large-v2                 | `embedding(model="xinference/e5-large-v2", input)`                 |
| gte-base                    | `embedding(model="xinference/gte-base", input)`                    |
| gte-large                   | `embedding(model="xinference/gte-large", input)`                   |
| jina-embeddings-v2-base-en  | `embedding(model="xinference/jina-embeddings-v2-base-en", input)`  |
| jina-embeddings-v2-small-en | `embedding(model="xinference/jina-embeddings-v2-small-en", input)` |
| multilingual-e5-large       | `embedding(model="xinference/multilingual-e5-large", input)`       |
