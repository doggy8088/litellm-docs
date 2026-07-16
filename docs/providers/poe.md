# Poe {#poe}

## 概覽 {#overview}

| 屬性 | 詳情 |
|-------|-------|
| 說明 | Poe 是 Quora 的 AI 平台，透過對開發者友善的 API 提供超過 100 種涵蓋文字、圖片、影片與語音模態的模型存取。 |
| LiteLLM 上的提供者路由 | `poe/` |
| 提供者文件連結 | [Poe 網站 ↗](https://poe.com) |
| Base URL | `https://api.poe.com/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />

## 什麼是 Poe？ {#what-is-poe}

Poe 是 Quora 的完整 AI 平台，提供：
- **100+ 模型**：存取各式各樣的 AI 模型
- **多種模態**：文字、圖片、影片與語音 AI
- **熱門模型**：包含 OpenAI 的 GPT 系列與 Anthropic 的 Claude
- **開發者 API**：方便應用程式整合
- **廣泛觸及**：受益於 Quora 每月 4 億名不重複訪客

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["POE_API_KEY"] = ""  # your Poe API key
```

請從 [Poe 平台](https://poe.com) 取得您的 Poe API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Poe Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["POE_API_KEY"] = ""  # your Poe API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Poe call
response = completion(
    model="poe/model-name",  # Replace with actual model name
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Poe Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["POE_API_KEY"] = ""  # your Poe API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Poe call with streaming
response = completion(
    model="poe/model-name",  # Replace with actual model name
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export POE_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: poe-model
    litellm_params:
      model: poe/model-name  # Replace with actual model name
      api_key: os.environ/POE_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Poe 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。包含 'role' 與 'content' 的訊息物件陣列 |
| `model` | string | **必要**。來自 100+ 可用模型的模型 ID |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。取樣溫度 |
| `top_p` | float | 選用。核取樣參數 |
| `max_tokens` | integer | 選用。要產生的最大 token 數 |
| `frequency_penalty` | float | 選用。對常見 token 施加懲罰 |
| `presence_penalty` | float | 選用。根據出現與否對 token 施加懲罰 |
| `stop` | string/array | 選用。停止序列 |
| `tools` | array | 選用。可用工具／函式清單 |
| `tool_choice` | string/object | 選用。控制工具／函式呼叫 |
| `response_format` | object | 選用。回應格式規格 |
| `user` | string | 選用。使用者識別碼 |

## 可用模型類別 {#available-model-categories}

Poe 提供跨多個提供者的模型存取：
- **OpenAI 模型**：包含 GPT-4、GPT-4 Turbo、GPT-3.5 Turbo
- **Anthropic 模型**：包含 Claude 3 Opus、Sonnet、Haiku
- **其他熱門模型**：提供各種提供者模型
- **多模態**：文字、圖片、影片與語音模型

## 平台優點 {#platform-benefits}

透過 LiteLLM 使用 Poe 有以下幾項優勢：
- **統一存取**：單一 API 存取多種不同模型
- **Quora 整合**：可存取大型使用者基礎與內容生態系
- **內容分享**：可將模型輸出分享給追蹤者
- **內容分發**：將最佳 AI 內容分發給所有使用者
- **模型探索**：探索新 AI 模型的有效方式

## 開發者資源 {#developer-resources}

Poe 正積極打造開發者功能，並歡迎 API 整合的早期存取申請。

## 其他資源 {#additional-resources}

- [Poe 網站](https://poe.com)
- [Poe AI Quora Space](https://poeai.quora.com)
- [關於 Poe 的 Quora 部落格文章](https://quorablog.quora.com/Poe)
