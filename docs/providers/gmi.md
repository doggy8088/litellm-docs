# GMI Cloud {#gmi-cloud}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | GMI Cloud 是一家 GPU 雲端基礎架構提供者，透過與 OpenAI 相容的 API 提供 Claude、GPT、DeepSeek、Gemini 等頂尖 AI 模型的存取。 |
| LiteLLM 上的提供者路由 | `gmi/` |
| 提供者文件連結 | [GMI Cloud 文件 ↗](https://docs.gmicloud.ai) |
| 基礎 URL | `https://api.gmi-serving.com/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage), [`/models`](#supported-models) |

<br />

## 什麼是 GMI Cloud？ {#what-is-gmi-cloud}

GMI Cloud 是一家有創投支持的數位基礎架構公司（募資超過 8,200 萬美元），提供：
- **頂級 GPU 存取**：用於 AI 工作負載的 NVIDIA H100 GPU
- **多種 AI 模型**：Claude、GPT、DeepSeek、Gemini、Kimi、Qwen 等
- **與 OpenAI 相容的 API**：可直接取代 OpenAI SDK
- **全球基礎架構**：位於美國（科羅拉多）與 APAC（台灣）的資料中心

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["GMI_API_KEY"] = ""  # your GMI Cloud API key
```

請從 [console.gmicloud.ai](https://console.gmicloud.ai) 取得您的 GMI Cloud API 金鑰。

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="GMI Cloud Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["GMI_API_KEY"] = ""  # your GMI Cloud API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# GMI Cloud call
response = completion(
    model="gmi/deepseek-ai/DeepSeek-V3.2",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="GMI Cloud Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["GMI_API_KEY"] = ""  # your GMI Cloud API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# GMI Cloud call with streaming
response = completion(
    model="gmi/anthropic/claude-sonnet-4.5",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export GMI_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: deepseek-v3
    litellm_params:
      model: gmi/deepseek-ai/DeepSeek-V3.2
      api_key: os.environ/GMI_API_KEY
  - model_name: claude-sonnet
    litellm_params:
      model: gmi/anthropic/claude-sonnet-4.5
      api_key: os.environ/GMI_API_KEY
```

## 支援的模型 {#supported-models}

| 模型 | 模型 ID | Context Length |
|-------|----------|----------------|
| Claude Opus 4.5 | `gmi/anthropic/claude-opus-4.5` | 409K |
| Claude Sonnet 4.5 | `gmi/anthropic/claude-sonnet-4.5` | 409K |
| Claude Sonnet 4 | `gmi/anthropic/claude-sonnet-4` | 409K |
| Claude Opus 4 | `gmi/anthropic/claude-opus-4` | 409K |
| GPT-5.2 | `gmi/openai/gpt-5.2` | 409K |
| GPT-5.1 | `gmi/openai/gpt-5.1` | 409K |
| GPT-5 | `gmi/openai/gpt-5` | 409K |
| GPT-4o | `gmi/openai/gpt-4o` | 131K |
| GPT-4o-mini | `gmi/openai/gpt-4o-mini` | 131K |
| DeepSeek V3.2 | `gmi/deepseek-ai/DeepSeek-V3.2` | 163K |
| DeepSeek V3 0324 | `gmi/deepseek-ai/DeepSeek-V3-0324` | 163K |
| Gemini 3 Pro | `gmi/google/gemini-3-pro-preview` | 1M |
| Gemini 3 Flash | `gmi/google/gemini-3-flash-preview` | 1M |
| Kimi K2 Thinking | `gmi/moonshotai/Kimi-K2-Thinking` | 262K |
| MiniMax M2.1 | `gmi/MiniMaxAI/MiniMax-M2.1` | 196K |
| Qwen3-VL 235B | `gmi/Qwen/Qwen3-VL-235B-A22B-Instruct-FP8` | 262K |
| GLM-4.7 | `gmi/zai-org/GLM-4.7-FP8` | 202K |

## 支援的 OpenAI 參數 {#supported-openai-parameters}

GMI Cloud 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。包含 'role' 與 'content' 的訊息物件陣列 |
| `model` | string | **必要**。來自可用模型的 Model ID |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。抽樣溫度 |
| `top_p` | float | 選用。核心抽樣參數 |
| `max_tokens` | integer | 選用。要產生的最大 token 數量 |
| `frequency_penalty` | float | 選用。對高頻 token 進行懲罰 |
| `presence_penalty` | float | 選用。根據存在性對 token 進行懲罰 |
| `stop` | string/array | 選用。停止序列 |
| `response_format` | object | 選用。搭配 `{"type": "json_object"}` 的 JSON 模式 |

## 其他資源 {#additional-resources}

- [GMI Cloud 網站](https://www.gmicloud.ai)
- [GMI Cloud 文件](https://docs.gmicloud.ai)
- [GMI Cloud Console](https://console.gmicloud.ai)
