import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CoralBricks {#coralbricks}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | CoralBricks 透過相容於 OpenAI 的 API 提供開源權重的 GLM 與 DeepSeek 模型，並以 FP4 服務 |
| LiteLLM 上的提供者路由 | `coralbricks/` |
| 提供者文件連結 | [CoralBricks](https://www.coralbricks.ai) |
| 預設 Base URL | `https://inference.coralbricks.ai/v1` |
| 支援的操作 | `/chat/completions`, `/responses`, `/messages` |

CoralBricks 在 LiteLLM 中是獨立的提供者，而不是一般的 OpenAI 相容路由，因此其支出會依據 CoralBricks 成本對應表項目計價，並回報於 `coralbricks`，而不是與 OpenAI 流量合併。`/responses` 與 `/messages` 請求會在到達時直接轉送至對應的 CoralBricks 端點，不經由 chat completions 轉換

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["CORALBRICKS_API_KEY"] = "your-api-key"
os.environ["CORALBRICKS_API_BASE"] = "https://inference.coralbricks.ai/v1"  # optional override
```

## 模型 {#models}

| 模型 | 輸入 / 每 1M tokens | 輸出 / 每 1M tokens | 快取寫入 / 每 1M tokens | 快取讀取 / 每 1M tokens |
|-------|-------------------|--------------------|-------------------------|------------------------|
| `coralbricks/glm-5.3-fp4` | $1.12 | $4.40 | $1.68 | $0 |
| `coralbricks/glm-5.3-flash-fp4` | $0.15 | $0.50 | $0.23 | $0 |
| `coralbricks/deepseek-v4.1-flash-fast-fp4` | $0.30 | $1.20 | $0.09 | $0 |

每個模型最多可處理 1,048,576 個輸入 tokens，並支援工具呼叫、推理與提示快取。定價依照 [CoralBricks 定價頁面](https://www.coralbricks.ai/pricing)：快取寫入依快取寫入費率計費，而快取讀取免費。如果您的合約價格不同，請在部署上設定 `input_cost_per_token` / `output_cost_per_token`，這些設定會覆寫成本對應表

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天完成 {#chat-completions}

```python showLineNumbers title="CoralBricks Chat Completion"
import os
from litellm import completion

os.environ["CORALBRICKS_API_KEY"] = "your-api-key"

response = completion(
    model="coralbricks/glm-5.3-flash-fp4",
    messages=[{"role": "user", "content": "Write a python function that reverses a string"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="CoralBricks Streaming Chat Completion"
import os
from litellm import completion

os.environ["CORALBRICKS_API_KEY"] = "your-api-key"

response = completion(
    model="coralbricks/glm-5.3-flash-fp4",
    messages=[{"role": "user", "content": "Explain a binary search in two sentences"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 回應 API {#responses-api}

```python showLineNumbers title="CoralBricks Responses API"
import os
import litellm

os.environ["CORALBRICKS_API_KEY"] = "your-api-key"

response = litellm.responses(
    model="coralbricks/glm-5.3-flash-fp4",
    input="Explain a binary search in two sentences",
    max_output_tokens=256,
)

print(response.output_text)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將 CoralBricks 新增到您的 LiteLLM Proxy 設定中：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: glm-5.3-flash
    litellm_params:
      model: coralbricks/glm-5.3-flash-fp4
      api_key: os.environ/CORALBRICKS_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export CORALBRICKS_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-coralbricks"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="CoralBricks via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-coralbricks",
)

response = client.chat.completions.create(
    model="glm-5.3-flash",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="CoralBricks via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "glm-5.3-flash",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>

</Tabs>

您也可以從管理介面新增 CoralBricks。前往 Models，然後選擇 Add Model，將 CoralBricks 作為提供者，選取其中一個 `coralbricks/` 模型，並貼上您的金鑰

## 回應 API {#responses-api-1}

proxy 會將 `/v1/responses` 請求轉送至 CoralBricks Responses 端點：

```bash showLineNumbers title="Responses API through LiteLLM Proxy"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "glm-5.3-flash",
    "input": "hello from litellm",
    "max_output_tokens": 128
  }'
```

## Anthropic Messages 相容性 {#anthropic-messages-compatibility}

proxy 會將 `/v1/messages` 請求轉送至 CoralBricks Messages 端點，因此 Anthropic SDK 用戶端可不需修改即可運作：

```bash showLineNumbers title="Anthropic Messages through LiteLLM Proxy"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "glm-5.3-flash",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

## 成本追蹤 {#cost-tracking}

`coralbricks/` 模型已註冊於 LiteLLM 的模型成本對應表，因此所有三個端點的每次請求支出都會自動計算，並在 `x-litellm-response-cost` 回應標頭中傳回，且會以提供者 `coralbricks` 記錄於支出記錄中。快取寫入與快取讀取會根據 CoralBricks 回傳的使用量進行追蹤，因此重複的提示會以其快取前綴適用免費的快取讀取費率計費

## 自訂端點 {#custom-endpoints}

設定 `CORALBRICKS_API_BASE` 或明確傳入 `api_base`，即可改由不同的 CoralBricks 端點路由。`coralbricks/` 路由無論如何都會保留提供者身分與定價

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: glm-5.3-flash
    litellm_params:
      model: coralbricks/glm-5.3-flash-fp4
      api_base: https://your-coralbricks-endpoint/v1
      api_key: os.environ/CORALBRICKS_API_KEY
```
