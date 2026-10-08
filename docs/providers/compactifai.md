import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CompactifAI {#compactifai}
https://docs.compactif.ai/

CompactifAI 提供領先語言模型的高壓縮版本，可帶來**最多降低 70% 的推論成本**、**4 倍吞吐量提升**，以及**低延遲推論**，且品質損失極小（低於 5%）。CompactifAI 的 OpenAI 相容 API 讓整合變得直接，協助開發者打造超高效率、可擴展、具優異並行能力與資源效率的 AI 應用程式。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | CompactifAI 提供領先語言模型的壓縮版本，最多可降低 70% 成本並提升 4 倍吞吐量 |
| LiteLLM 上的提供者路由 | `compactifai/`（請將此前綴加到模型名稱前—例如 `compactifai/cai-llama-3-1-8b-slim`） |
| 提供者文件 | [CompactifAI ↗](https://docs.compactif.ai/) |
| 提供者 API 端點 | https://api.compactif.ai/v1 |
| 支援的端點 | `/chat/completions`, `/completions` |

## 支援的 OpenAI 參數 {#supported-openai-parameters}

CompactifAI 完全相容 OpenAI，並支援以下參數：

```
"stream",
"stop",
"temperature",
"top_p",
"max_tokens",
"presence_penalty",
"frequency_penalty",
"logit_bias",
"user",
"response_format",
"seed",
"tools",
"tool_choice",
"parallel_tool_calls",
"extra_headers"
```

## API 金鑰設定 {#api-key-setup}

CompactifAI API 金鑰可透過 AWS Marketplace 訂閱取得：

1. 透過 [AWS Marketplace](https://aws.amazon.com/marketplace) 訂閱
2. 完成訂閱驗證（24 小時審核流程）
3. 使用提供的憑證存取 MultiverseIAM 儀表板
4. 從儀表板擷取您的 API 金鑰

```python
import os

os.environ["COMPACTIFAI_API_KEY"] = "your-api-key"
```

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['COMPACTIFAI_API_KEY'] = "your-api-key"

response = completion(
    model="compactifai/cai-llama-3-1-8b-slim",
    messages=[
       {"role": "user", "content": "Hello from LiteLLM!"}
   ],
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml
model_list:
  - model_name: llama-2-compressed
    litellm_params:
      model: compactifai/cai-llama-3-1-8b-slim
      api_key: os.environ/COMPACTIFAI_API_KEY
```

</TabItem>
</Tabs>

## 串流 {#streaming}

```python
from litellm import completion
import os

os.environ['COMPACTIFAI_API_KEY'] = "your-api-key"

response = completion(
    model="compactifai/cai-llama-3-1-8b-slim",
    messages=[
       {"role": "user", "content": "Write a short story"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 進階使用方式 {#advanced-usage}

### 自訂參數 {#custom-parameters}

```python
from litellm import completion

response = completion(
    model="compactifai/cai-llama-3-1-8b-slim",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    temperature=0.7,
    max_tokens=500,
    top_p=0.9,
    stop=["Human:", "AI:"]
)
```

### 函式呼叫 {#function-calling}

CompactifAI 支援與 OpenAI 相容的函式呼叫：

```python
from litellm import completion

functions = [
    {
        "name": "get_weather",
        "description": "Get current weather information",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state"
                }
            },
            "required": ["location"]
        }
    }
]

response = completion(
    model="compactifai/cai-llama-3-1-8b-slim",
    messages=[{"role": "user", "content": "What's the weather in San Francisco?"}],
    tools=[{"type": "function", "function": f} for f in functions],
    tool_choice="auto"
)
```

### 非同步使用方式 {#async-usage}

```python
import asyncio
from litellm import acompletion

async def async_call():
    response = await acompletion(
        model="compactifai/cai-llama-3-1-8b-slim",
        messages=[{"role": "user", "content": "Hello async world!"}]
    )
    return response

# Run async function
response = asyncio.run(async_call())
print(response)
```

## 可用模型 {#available-models}

CompactifAI 提供熱門模型的壓縮版本。請使用 `/models` 端點取得最新清單：

```python
import httpx

headers = {"Authorization": f"Bearer {your_api_key}"}
response = httpx.get("https://api.compactif.ai/v1/models", headers=headers)
models = response.json()
```

常見模型格式：
- `compactifai/cai-llama-3-1-8b-slim`
- `compactifai/mistral-7b-compressed`
- `compactifai/codellama-7b-compressed`

## 優點 {#benefits}

- **成本效益高**：相較於標準模型，推論成本最多可降低 70%
- **高效能**：在品質損失極小（低於 5%）的情況下，吞吐量提升 4 倍
- **低延遲**：針對快速回應時間最佳化
- **即插即用替代**：完整相容 OpenAI API
- **可擴展**：具優異並行能力與資源效率

## 錯誤處理 {#error-handling}

CompactifAI 會回傳標準的 OpenAI 相容錯誤回應：

```python
from litellm import completion
from litellm.exceptions import AuthenticationError, RateLimitError

try:
    response = completion(
        model="compactifai/cai-llama-3-1-8b-slim",
        messages=[{"role": "user", "content": "Hello"}]
    )
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded")
```

## 支援 {#support}

- 文件：https://docs.compactif.ai/
- LinkedIn：[MultiverseComputing](https://www.linkedin.com/company/multiversecomputing)
- 分析：[Artificial Analysis 提供者比較](https://artificialanalysis.ai/providers/compactifai)
