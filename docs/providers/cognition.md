import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Cognition {#cognition}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Cognition 透過與 OpenAI 相容的 API 提供其 SWE 程式碼模型 |
| LiteLLM 上的提供者路由 | `cognition/` |
| 提供者文件連結 | [Cognition 文件](https://docs.devin.ai) |
| 預設 Base URL | `https://api.cognition.ai/v1` |
| 支援的操作 | `/chat/completions`、透過 LiteLLM 的 Anthropic Messages adapter 的 `/messages` |

Cognition 在 LiteLLM 上是獨立的提供者，而不是一般的 OpenAI 相容路由，因此其支出依據 Cognition cost map 項目計價，並回報在 `cognition`，而不是與 OpenAI 流量合併

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["COGNITION_API_KEY"] = "your-api-key"
os.environ["COGNITION_API_BASE"] = "https://api.cognition.ai/v1"  # optional override
```

## 模型 {#models}

| 模型 | 輸入 / 100 萬 tokens | 輸出 / 100 萬 tokens | 快取讀取 / 100 萬 tokens |
|-------|-------------------|--------------------|------------------------|
| `cognition/swe-1.7` | $0.50 | $2.50 | $0.20 |
| `cognition/swe-1.7-lightning` | $2.50 | $12.50 | $1.00 |
| `cognition/swe-1.6` | $0.50 | $2.50 | $0.20 |

定價遵循 [Cognition 模型清單](https://docs.devin.ai/desktop/models)。`swe-1.7` 是標準層級；`swe-1.7-lightning` 是由 Cerebras 提供服務的層級，回應速度約為每秒 1000 個 tokens，成本為 5 倍。如果您的合約定價不同，請在部署上設定 `input_cost_per_token` / `output_cost_per_token`，它們會覆寫 cost map

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天完成 {#chat-completions}

```python showLineNumbers title="Cognition Chat Completion"
import os
from litellm import completion

os.environ["COGNITION_API_KEY"] = "your-api-key"

response = completion(
    model="cognition/swe-1.7",
    messages=[{"role": "user", "content": "Write a python function that reverses a string"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="Cognition Streaming Chat Completion"
import os
from litellm import completion

os.environ["COGNITION_API_KEY"] = "your-api-key"

response = completion(
    model="cognition/swe-1.7",
    messages=[{"role": "user", "content": "Explain a binary search in two sentences"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 工具呼叫 {#tool-calling}

```python showLineNumbers title="Cognition Tool Calling"
import os
from litellm import completion

os.environ["COGNITION_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "function",
        "function": {
            "name": "run_tests",
            "description": "Run the test suite for a package",
            "parameters": {
                "type": "object",
                "properties": {"package": {"type": "string", "description": "Package name"}},
                "required": ["package"],
            },
        },
    }
]

response = completion(
    model="cognition/swe-1.7",
    messages=[{"role": "user", "content": "Run the tests for the billing package"}],
    tools=tools,
    tool_choice="auto",
)

print(response.choices[0].message.tool_calls)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將 Cognition 加入您的 LiteLLM Proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: swe-1.7
    litellm_params:
      model: cognition/swe-1.7
      api_key: os.environ/COGNITION_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export COGNITION_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-cognition"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Cognition via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-cognition",
)

response = client.chat.completions.create(
    model="swe-1.7",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Cognition via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "swe-1.7",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

您也可以從 Admin UI 新增 Cognition。前往 Models，然後選擇 Add Model，將 Cognition 作為提供者，選擇其中一個 `cognition/` 模型，並貼上您的金鑰

## Anthropic Messages 相容性 {#anthropic-messages-compatibility}

LiteLLM 會將 Anthropic Messages 形式的請求轉換為 Cognition chat completions，無論是透過 SDK facade 還是 proxy 的 `/v1/messages` endpoint 都一樣：

```bash showLineNumbers title="Anthropic Messages through LiteLLM Proxy"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "swe-1.7",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

## 成本追蹤 {#cost-tracking}

`cognition/` 模型已註冊在 LiteLLM 的 model cost map 中，因此每次請求的支出會自動計算、回傳於 `x-litellm-response-cost` 回應標頭中，並以提供者 `cognition` 記錄在支出日誌中。為 OpenAI 設定的折扣與報表不適用於此流量

## 自訂端點 {#custom-endpoints}

Cognition 目前會為每位客戶配置 API 端點，因此大多數部署應設定 `COGNITION_API_BASE`，或使用來自 Cognition onboarding 的 base URL 明確傳入 `api_base`。`https://api.cognition.ai/v1` 是在未設定前兩者時使用的慣用預設值。無論哪種方式，`cognition/` 路由都會保留提供者身分與定價

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: swe-1.7
    litellm_params:
      model: cognition/swe-1.7
      api_base: https://your-cognition-endpoint/v1
      api_key: os.environ/COGNITION_API_KEY
```
