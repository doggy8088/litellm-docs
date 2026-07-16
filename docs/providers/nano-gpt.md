# NanoGPT {#nanogpt}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | NanoGPT 是一項按提示付費與訂閱制的 AI 服務，提供即時存取超過 200+ 個強大的 AI 模型，且無需訂閱或註冊。 |
| LiteLLM 上的提供者路由 | `nano-gpt/` |
| 提供者文件連結 | [NanoGPT 網站 ↗](https://nano-gpt.com) |
| 基礎 URL | `https://nano-gpt.com/api/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage), [`/completions`](#text-completion), [`/embeddings`](#embeddings) |

<br />

## 什麼是 NanoGPT？ {#what-is-nanogpt}

NanoGPT 是一個彈性的 AI API 服務，提供：
- **按提示付費計價**：無需訂閱，只需為您實際使用的部分付費
- **200+ 個 AI 模型**：可存取文字、圖片與影片生成模型
- **無需註冊**：立即開始使用
- **相容 OpenAI 的 API**：可輕鬆與既有程式碼整合
- **串流支援**：即時回應串流
- **工具呼叫**：支援函式呼叫

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["NANOGPT_API_KEY"] = ""  # your NanoGPT API key
```

請從 [nano-gpt.com](https://nano-gpt.com) 取得您的 NanoGPT API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="NanoGPT Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["NANOGPT_API_KEY"] = ""  # your NanoGPT API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# NanoGPT call
response = completion(
    model="nano-gpt/model-name",  # Replace with actual model name
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="NanoGPT Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["NANOGPT_API_KEY"] = ""  # your NanoGPT API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# NanoGPT call with streaming
response = completion(
    model="nano-gpt/model-name",  # Replace with actual model name
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 工具呼叫 {#tool-calling}

```python showLineNumbers title="NanoGPT Tool Calling"
import os
import litellm

os.environ["NANOGPT_API_KEY"] = ""

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                }
            }
        }
    }
]

response = litellm.completion(
    model="nano-gpt/model-name",
    messages=[{"role": "user", "content": "What's the weather in Paris?"}],
    tools=tools
)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export NANOGPT_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: nano-gpt-model
    litellm_params:
      model: nano-gpt/model-name  # Replace with actual model name
      api_key: os.environ/NANOGPT_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

NanoGPT 支援所有標準的 OpenAI 相容參數：

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。包含 'role' 與 'content' 的訊息物件陣列 |
| `model` | string | **必要**。來自 200+ 個可用模型的模型 ID |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。取樣溫度 |
| `top_p` | float | 選用。核心取樣參數 |
| `max_tokens` | integer | 選用。要生成的最大 token 數 |
| `frequency_penalty` | float | 選用。對常見 token 進行懲罰 |
| `presence_penalty` | float | 選用。根據出現情況對 token 進行懲罰 |
| `stop` | string/array | 選用。停止序列 |
| `n` | integer | 選用。要生成的完成數量 |
| `tools` | array | 選用。可用工具/函式清單 |
| `tool_choice` | string/object | 選用。控制工具/函式呼叫 |
| `response_format` | object | 選用。回應格式規格 |
| `user` | string | 選用。使用者識別碼 |

## 模型類別 {#model-categories}

NanoGPT 提供多種模型類別的存取：
- **文字生成**：200+ 個用於聊天、補全與分析的 LLM
- **圖片生成**：用於建立圖片的 AI 模型
- **影片生成**：用於建立影片的 AI 模型
- **Embedding 模型**：用於向量搜尋的文字嵌入模型

## 計價模式 {#pricing-model}

NanoGPT 提供彈性的計價結構：
- **按提示付費**：無需訂閱
- **無需註冊**：立即開始使用
- **透明計價**：只需為您實際使用的部分付費

## API 文件 {#api-documentation}

如需詳細 API 文件，請造訪 [docs.nano-gpt.com](https://docs.nano-gpt.com)。

## 其他資源 {#additional-resources}

- [NanoGPT 網站](https://nano-gpt.com)
- [NanoGPT API 文件](https://nano-gpt.com/api)
- [NanoGPT 模型清單](https://docs.nano-gpt.com/api-reference/endpoint/models)
