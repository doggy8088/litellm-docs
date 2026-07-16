# 合成 {#synthetic}

## 概覽 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Synthetic 在美國與歐盟的安全資料中心中執行開源 AI 模型，並以隱私為重點。它們絕不會使用您的資料進行訓練，且會在 14 天內自動刪除 API 資料。 |
| LiteLLM 上的提供者路由 | `synthetic/` |
| 提供者文件連結 | [Synthetic Website ↗](https://synthetic.new) |
| 基礎 URL | `https://api.synthetic.new/openai/v1` |
| 支援的作業 | [`/chat/completions`](#sample-usage) |

<br />

## 什麼是 Synthetic？ {#what-is-synthetic}

Synthetic 是一個以隱私為重點的 AI 平台，提供對開源 LLM 的存取，並具備以下保證：
- **以隱私為優先**：資料絕不會用於訓練
- **安全託管**：模型在美國與歐盟的安全資料中心中執行
- **自動刪除**：API 資料會在 14 天內自動刪除
- **開源**：執行開源 AI 模型

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["SYNTHETIC_API_KEY"] = ""  # your Synthetic API key
```

請從 [synthetic.new](https://synthetic.new) 取得您的 Synthetic API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Synthetic Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["SYNTHETIC_API_KEY"] = ""  # your Synthetic API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Synthetic call
response = completion(
    model="synthetic/model-name",  # Replace with actual model name
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Synthetic Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["SYNTHETIC_API_KEY"] = ""  # your Synthetic API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Synthetic call with streaming
response = completion(
    model="synthetic/model-name",  # Replace with actual model name
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export SYNTHETIC_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: synthetic-model
    litellm_params:
      model: synthetic/model-name  # Replace with actual model name
      api_key: os.environ/SYNTHETIC_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Synthetic 支援所有標準的 OpenAI 相容參數：

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。具有 'role' 和 'content' 的訊息物件陣列 |
| `model` | string | **必要**。模型 ID |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。取樣溫度 |
| `top_p` | float | 選用。nucleus 取樣參數 |
| `max_tokens` | integer | 選用。要生成的最大 tokens 數 |
| `frequency_penalty` | float | 選用。對高頻 tokens 施加懲罰 |
| `presence_penalty` | float | 選用。根據存在與否對 tokens 施加懲罰 |
| `stop` | string/array | 選用。停止序列 |

## 隱私與安全性 {#privacy--security}

Synthetic 提供企業等級的隱私保護：
- 資料會在 14 天內自動刪除
- 不使用任何資料進行模型訓練
- 在美國與歐盟資料中心提供安全託管
- 符合合規需求的架構

## 其他資源 {#additional-resources}

- [Synthetic Website](https://synthetic.new)
