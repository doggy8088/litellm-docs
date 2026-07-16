# CometAPI {#cometapi}
LiteLLM 支援來自 [CometAPI](https://www.cometapi.com/) 的所有 AI 模型。CometAPI 透過統一的 API 介面提供超過 500 種 AI 模型的存取，包括 GPT-5、Claude Opus 4.1 等尖端模型，以及其他各種最先進的語言模型。

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_CometAPI.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

## 驗證 {#authentication}

若要使用 CometAPI 模型，您需要從 [CometAPI Token Console](https://api.cometapi.com/console/token) 取得 API 金鑰。CometAPI 為新使用者提供免費 token－您只要註冊就能立即取得免費 API 金鑰。

## 使用方式 {#usage}

將您的 CometAPI 金鑰設為環境變數，並使用 completion 函式：

```python
import os
from litellm import completion

# Set API key
os.environ["COMETAPI_KEY"] = "your_comet_api_key_here"

# Define messages
messages = [{"content": "Hello, how are you?", "role": "user"}]

# Method 1: Using environment variable (recommended)
response = completion(
    model="cometapi/gpt-5", 
    messages=messages
)

print(response.choices[0].message.content)
```

### 替代用法 - 明確指定 API 金鑰 {#alternative-usage---explicit-api-key}

您也可以明確傳入 API 金鑰：

```python
import os
from litellm import completion

# Define messages
messages = [{"content": "Hello, how are you?", "role": "user"}]

# Method 2: Explicitly passing API key
response = completion(
    model="cometapi/gpt-4o", 
    messages=messages, 
    api_key="your_comet_api_key_here"
)

print(response.choices[0].message.content)
```

## 使用方式 - 串流 {#usage---streaming}

在呼叫 completion 時，只要設定 `stream=True`：

```python
import os
from litellm import completion

os.environ["COMETAPI_KEY"] = "your_comet_api_key_here"

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(
    model="cometapi/gpt-5",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

## 使用方式 - 非同步串流 {#usage---async-streaming}

對於非同步串流，請使用 `acompletion`：

```python
from litellm import acompletion
import asyncio, os, traceback

async def completion_call():
    try:
        os.environ["COMETAPI_KEY"] = "your_comet_api_key_here"
        
        print("test acompletion + streaming")
        response = await acompletion(
            model="cometapi/chatgpt-4o-latest", 
            messages=[{"content": "Hello, how are you?", "role": "user"}], 
            stream=True
        )
        print(f"response: {response}")
        async for chunk in response:
            print(chunk)
    except:
        print(f"error occurred: {traceback.format_exc()}")
        pass

# Run the async function
await completion_call()
```

## CometAPI 模型 {#cometapi-models}

CometAPI 透過統一的 API 提供超過 500 種 AI 模型的存取。部分熱門模型包括：

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| cometapi/gpt-5 | `completion('cometapi/gpt-5', messages)` |
| cometapi/gpt-5-mini | `completion('cometapi/gpt-5-mini', messages)` |
| cometapi/gpt-5-nano | `completion('cometapi/gpt-5-nano', messages)` |
| cometapi/gpt-oss-20b | `completion('cometapi/gpt-oss-20b', messages)` |
| cometapi/gpt-oss-120b | `completion('cometapi/gpt-oss-120b', messages)` |
| cometapi/chatgpt-4o-latest | `completion('cometapi/chatgpt-4o-latest', messages)` |

如需可用模型的完整清單，請造訪 [CometAPI 模型頁面](https://www.cometapi.com/model/)。

## 環境變數 {#environment-variables}

| 變數 | 說明 | 必要 |
|----------|-------------|----------|
| `COMETAPI_KEY` | 您的 CometAPI API 金鑰 | 是 |

## 錯誤處理 {#error-handling}

```python
import os
from litellm import completion

try:
    os.environ["COMETAPI_KEY"] = "your_comet_api_key_here"
    
    messages = [{"content": "Hello, how are you?", "role": "user"}]
    
    response = completion(
        model="cometapi/gpt-5",
        messages=messages
    )
    
    print(response.choices[0].message.content)
    
except Exception as e:
    print(f"Error: {e}")
```
