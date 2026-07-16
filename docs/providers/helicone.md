import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Helicone {#helicone}

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Helicone 是一個 AI 閘道與可觀測性平台，提供與 OpenAI 相容的端點，具備進階監控、快取與分析功能。 |
| LiteLLM 上的提供者路由 | `helicone/` |
| 提供者文件連結 | [Helicone 文件 ↗](https://docs.helicone.ai) |
| Base URL | `https://ai-gateway.helicone.ai/` |
| 支援的操作 | [`/chat/completions`](#sample-usage), [`/completions`](#text-completion), [`/embeddings`](#embeddings) |

<br />

**我們支援透過 Helicone 的 AI Gateway 使用 [所有可用模型](https://helicone.ai/models)。傳送請求時，請使用 `helicone/` 作為前綴。**

## 什麼是 Helicone？ {#what-is-helicone}

Helicone 是一個適用於 LLM 應用程式的開源可觀測性平台，提供：
- **請求監控**：追蹤所有 LLM 請求，並提供詳細指標
- **快取**：透過智慧快取降低成本與延遲
- **速率限制**：依使用者/金鑰控制請求速率
- **成本追蹤**：監控跨模型與使用者的支出
- **自訂屬性**：使用中繼資料標記請求，方便篩選與分析
- **提示管理**：為提示進行版本控制

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key
```

請從您的 [Helicone 儀表板](https://helicone.ai) 取得 Helicone API 金鑰。

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Helicone Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Helicone call - routes through Helicone gateway to OpenAI
response = completion(
    model="helicone/gpt-4",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Helicone Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Helicone call with streaming
response = completion(
    model="helicone/gpt-4",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 含中繼資料（Helicone 自訂屬性） {#with-metadata-helicone-custom-properties}

```python showLineNumbers title="Helicone with Custom Properties"
import os
import litellm
from litellm import completion

os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

response = completion(
    model="helicone/gpt-4o-mini",
    messages=[{"role": "user", "content": "What's the weather like?"}],
    metadata={
        "Helicone-Property-Environment": "production",
        "Helicone-Property-User-Id": "user_123",
        "Helicone-Property-Session-Id": "session_abc"
    }
)

print(response)
```

### 文字補全 {#text-completion}

```python showLineNumbers title="Helicone Text Completion"
import os
import litellm

os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

response = litellm.completion(
    model="helicone/gpt-4o-mini",  # text completion model
    prompt="Once upon a time"
)

print(response)
```


## 重試與備援機制 {#retry-and-fallback-mechanisms}

```python
import litellm

litellm.api_base = "https://ai-gateway.helicone.ai/"
litellm.metadata = {
    "Helicone-Retry-Enabled": "true",
    "helicone-retry-num": "3",
    "helicone-retry-factor": "2",
}

response = litellm.completion(
    model="helicone/gpt-4o-mini/openai,claude-3-5-sonnet-20241022/anthropic", # Try OpenAI first, then fallback to Anthropic, then continue with other models,
    messages=[{"role": "user", "content": "Hello"}]
)
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Helicone 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必填**。具有 'role' 和 'content' 的訊息物件陣列 |
| `model` | string | **必填**。模型 ID（例如，gpt-4、claude-3-opus 等） |
| `stream` | boolean | 選填。啟用串流回應 |
| `temperature` | float | 選填。抽樣溫度 |
| `top_p` | float | 選填。Nucleus 抽樣參數 |
| `max_tokens` | integer | 選填。要生成的最大 tokens 數 |
| `frequency_penalty` | float | 選填。對常見 tokens 加以懲罰 |
| `presence_penalty` | float | 選填。根據出現次數對 tokens 加以懲罰 |
| `stop` | string/array | 選填。停止序列 |
| `n` | integer | 選填。要生成的完成數 |
| `tools` | array | 選填。可用工具／函式清單 |
| `tool_choice` | string/object | 選填。控制工具／函式呼叫 |
| `response_format` | object | 選填。回應格式規格 |
| `user` | string | 選填。使用者識別碼 |

## Helicone 特定標頭 {#helicone-specific-headers}

將這些作為 metadata 傳入，以運用 Helicone 功能：

| 標頭 | 說明 |
|--------|-------------|
| `Helicone-Property-*` | 用於篩選的自訂屬性（例如，`Helicone-Property-User-Id`） |
| `Helicone-Cache-Enabled` | 為此請求啟用快取 |
| `Helicone-User-Id` | 用於追蹤的使用者識別碼 |
| `Helicone-Session-Id` | 用於分組請求的工作階段識別碼 |
| `Helicone-Prompt-Id` | 用於版本管理的提示詞識別碼 |
| `Helicone-Rate-Limit-Policy` | 速率限制政策名稱 |

標頭範例：

```python showLineNumbers title="Helicone with Custom Headers"
import litellm

response = litellm.completion(
    model="helicone/gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
    metadata={
        "Helicone-Cache-Enabled": "true",
        "Helicone-Property-Environment": "production",
        "Helicone-Property-User-Id": "user_123",
        "Helicone-Session-Id": "session_abc",
        "Helicone-Prompt-Id": "prompt_v1"
    }
)
```

## 進階用法 {#advanced-usage}

### 與不同提供者搭配使用 {#using-with-different-providers}

Helicone 充當閘道，並支援多個提供者：

```python showLineNumbers title="Helicone with Anthropic"
import litellm

# Set both Helicone and Anthropic keys
os.environ["HELICONE_API_KEY"] = "your-helicone-key"

response = litellm.completion(
    model="helicone/claude-3.5-haiku/anthropic",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 快取 {#caching}

啟用快取以降低成本與延遲：

```python showLineNumbers title="Helicone Caching"
import litellm

response = litellm.completion(
    model="helicone/gpt-4",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    metadata={
        "Helicone-Cache-Enabled": "true"
    }
)

# Subsequent identical requests will be served from cache
response2 = litellm.completion(
    model="helicone/gpt-4",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    metadata={
        "Helicone-Cache-Enabled": "true"
    }
)
```

## 功能 {#features}

### 請求監控 {#request-monitoring}
- 追蹤所有請求與詳細指標
- 檢視請求／回應配對
- 監控延遲與錯誤
- 依自訂屬性篩選

### 成本追蹤 {#cost-tracking}
- 依模型追蹤成本
- 依使用者追蹤成本
- 成本警示與預算
- 歷史成本分析

### 速率限制 {#rate-limiting}
- 依使用者設定速率限制
- 依 API 金鑰設定速率限制
- 自訂速率限制政策
- 自動執行

### 分析 {#analytics}
- 請求量趨勢
- 成本趨勢
- 延遲百分位數
- 錯誤率

請造訪 [Helicone 定價](https://helicone.ai/pricing) 以取得詳細資訊。

## 其他資源 {#additional-resources}

- [Helicone 官方文件](https://docs.helicone.ai)
- [Helicone 儀表板](https://helicone.ai)
- [Helicone GitHub](https://github.com/Helicone/helicone)
- [API 參考](https://docs.helicone.ai/rest/ai-gateway/post-v1-chat-completions)
