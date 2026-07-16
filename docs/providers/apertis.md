# Apertis AI（Stima API） {#apertis-ai-stima-api}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Apertis AI（原名 Stima API）是一個統一的 API 平台，透過單一介面提供超過 430 個 AI 模型的存取，最高可節省 50% 成本。 |
| LiteLLM 上的提供者路由 | `apertis/` |
| 提供者文件連結 | [Apertis AI 網站 ↗](https://api.stima.tech) |
| 基礎 URL | `https://api.stima.tech/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />

## 什麼是 Apertis AI？ {#what-is-apertis-ai}

Apertis AI 是一個統一的 API 平台，可讓開發者：
- **存取 430+ 個 AI 模型**：透過單一 API 使用所有模型
- **節省 50% 成本**：具競爭力的定價與大幅折扣
- **統一計費**：所有模型用量只需一張帳單
- **快速設定**：只需 $2 註冊即可開始
- **GitHub 整合**：與您的 GitHub 帳戶連結

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["STIMA_API_KEY"] = ""  # your Apertis AI API key
```

請從 [api.stima.tech](https://api.stima.tech) 取得您的 Apertis AI API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Apertis AI Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["STIMA_API_KEY"] = ""  # your Apertis AI API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Apertis AI call
response = completion(
    model="apertis/model-name",  # Replace with actual model name
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Apertis AI Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["STIMA_API_KEY"] = ""  # your Apertis AI API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Apertis AI call with streaming
response = completion(
    model="apertis/model-name",  # Replace with actual model name
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export STIMA_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: apertis-model
    litellm_params:
      model: apertis/model-name  # Replace with actual model name
      api_key: os.environ/STIMA_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Apertis AI 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。包含 'role' 和 'content' 的訊息物件陣列 |
| `model` | string | **必要**。430+ 個可用模型中的模型 ID |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。取樣溫度 |
| `top_p` | float | 選用。核取樣參數 |
| `max_tokens` | integer | 選用。要產生的最大 tokens 數量 |
| `frequency_penalty` | float | 選用。懲罰常出現的 tokens |
| `presence_penalty` | float | 選用。根據出現與否懲罰 tokens |
| `stop` | string/array | 選用。停止序列 |
| `tools` | array | 選用。可用工具／函式清單 |
| `tool_choice` | string/object | 選用。控制工具／函式呼叫 |

## 成本優勢 {#cost-benefits}

Apertis AI 提供顯著的成本優勢：
- **節省 50% 成本**：與直接向提供者購買相比可省下費用
- **統一計費**：所有 AI 模型用量只需一張發票
- **低門檻**：只需 $2 註冊即可開始

## 模型可用性 {#model-availability}

透過存取超過 430 個 AI 模型，Apertis AI 提供：
- 透過單一 API 存取多個提供者
- 最新模型版本
- 各種類型的模型（文字、圖片、影片）

## 其他資源 {#additional-resources}

- [Apertis AI 網站](https://api.stima.tech)
- [Apertis AI 企業版](https://api.stima.tech/enterprise)
