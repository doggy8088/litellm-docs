import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Cohere {#cohere}

## API 金鑰 {#api-keys}

```python
import os 
os.environ["COHERE_API_KEY"] = ""
```

## 使用方式 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

#### Cohere v2 API（預設） {#cohere-v2-api-default}

```python showLineNumbers
from litellm import completion

## set ENV variables
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere v2 call
response = completion(
    model="cohere_chat/command-a-03-2025", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

#### Cohere v1 API {#cohere-v1-api}

若要使用 Cohere v1/chat API，請在您的模型名稱前加上 `cohere_chat/v1/`：

```python showLineNumbers
from litellm import completion

## set ENV variables
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere v1 call
response = completion(
    model="cohere_chat/v1/command-a-03-2025", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

#### 串流 {#streaming}

**Cohere v2 串流：**

```python showLineNumbers
from litellm import completion

## set ENV variables
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere v2 streaming
response = completion(
    model="cohere_chat/command-a-03-2025", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    stream=True
)

for chunk in response:
    print(chunk)
```


**Cohere v1 串流：**

```python showLineNumbers
from litellm import completion

## set ENV variables
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere v1 streaming
response = completion(
    model="cohere_chat/v1/command-a-03-2025", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    stream=True
)

for chunk in response:
    print(chunk)
```


## 與 LiteLLM Proxy 一起使用  {#usage-with-litellm-proxy}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Cohere

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export COHERE_API_KEY="your-api-key"
```

### 2. 啟動 proxy  {#2-start-the-proxy}

在 config.yaml 中定義您要使用的 cohere 模型

**適用於 Cohere v1 模型：**
```yaml showLineNumbers
model_list:
  - model_name: command-a-03-2025 
    litellm_params:
      model: cohere_chat/v1/command-a-03-2025
      api_key: "os.environ/COHERE_API_KEY"
```

**適用於 Cohere v2 模型：**
```yaml showLineNumbers
model_list:
  - model_name: command-a-03-2025-v2
    litellm_params:
      model: cohere_chat/command-a-03-2025
      api_key: "os.environ/COHERE_API_KEY"
```

```bash
litellm --config /path/to/config.yaml
```


### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="v1-curl" label="Cohere v1 - Curl 請求">

```shell showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <your-litellm-api-key>' \
--data ' {
      "model": "command-a-03-2025",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="v2-curl" label="Cohere v2 - Curl 請求">

```shell showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <your-litellm-api-key>' \
--data ' {
      "model": "command-a-03-2025-v2",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="v1-openai" label="Cohere v1 - OpenAI SDK">

```python showLineNumbers
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to cohere v1 model
response = client.chat.completions.create(model="command-a-03-2025", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)
```
</TabItem>
<TabItem value="v2-openai" label="Cohere v2 - OpenAI SDK">

```python showLineNumbers
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to cohere v2 model
response = client.chat.completions.create(model="command-a-03-2025-v2", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)
```
</TabItem>
</Tabs>

## 支援的模型 {#supported-models}
| 模型名稱 | 函式呼叫 |
|------------|----------------|
| command-a-03-2025 | `litellm.completion('command-a-03-2025', messages)` |
| command-r-plus-08-2024 | `litellm.completion('command-r-plus-08-2024', messages)` |  
| command-r-08-2024 | `litellm.completion('command-r-08-2024', messages)` |
| command-r-plus | `litellm.completion('command-r-plus', messages)` |  
| command-r | `litellm.completion('command-r', messages)` |
| command-light | `litellm.completion('command-light', messages)` |  
| command-nightly | `litellm.completion('command-nightly', messages)` |

## 嵌入 {#embedding}

```python
from litellm import embedding
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere call
response = embedding(
    model="embed-english-v3.0", 
    input=["good morning from litellm", "this is another item"], 
)
```

### 設定 - v3 模型的輸入類型 {#setting---input-type-for-v3-models}
v3 模型有一個必要參數：`input_type`。LiteLLM 預設為 `search_document`。它可以是以下四個值之一：

- `input_type="search_document"`：（預設）用於您要儲存在向量資料庫中的文字（文件）
- `input_type="search_query"`：用於搜尋查詢，以在您的向量資料庫中找出最相關的文件
- `input_type="classification"`：當您將嵌入作為分類系統的輸入時使用
- `input_type="clustering"`：當您將嵌入用於文字分群時使用

https://txt.cohere.com/introducing-embed-v3/

```python
from litellm import embedding
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere call
response = embedding(
    model="embed-english-v3.0", 
    input=["good morning from litellm", "this is another item"], 
    input_type="search_document" 
)
```

### 支援的嵌入模型 {#supported-embedding-models}
| 模型名稱               | 函式呼叫                                                |
|--------------------------|--------------------------------------------------------------|
| embed-english-v3.0       | `embedding(model="embed-english-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-light-v3.0 | `embedding(model="embed-english-light-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-v3.0  | `embedding(model="embed-multilingual-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-light-v3.0 | `embedding(model="embed-multilingual-light-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-v2.0       | `embedding(model="embed-english-v2.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-light-v2.0 | `embedding(model="embed-english-light-v2.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-v2.0  | `embedding(model="embed-multilingual-v2.0", input=["good morning from litellm", "this is another item"])` |

## 重新排序  {#rerank}

### 使用方式 {#usage-1}

LiteLLM 支援 Cohere rerank 的 v1 與 v2 用戶端。預設情況下，`rerank` 端點使用 v2 用戶端，但您可以透過明確呼叫 `v1/rerank` 來指定 v1 用戶端

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK 使用方式">

```python
from litellm import rerank
import os

os.environ["COHERE_API_KEY"] = "sk-.."

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="cohere/rerank-english-v3.0",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```
</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy 使用方式">

LiteLLM 提供與 cohere api 相容的 `/rerank` 端點供 Rerank 呼叫。

**設定**

將以下內容加入您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: Salesforce/Llama-Rank-V1
    litellm_params:
      model: together_ai/Salesforce/Llama-Rank-V1
      api_key: os.environ/TOGETHERAI_API_KEY
  - model_name: rerank-english-v3.0
    litellm_params:
      model: cohere/rerank-english-v3.0
      api_key: os.environ/COHERE_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

測試請求

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "rerank-english-v3.0",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3
  }'
```

</TabItem>
</Tabs>
