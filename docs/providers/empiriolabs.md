import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# EmpirioLabs AI {#empiriolabs-ai}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | EmpirioLabs AI 在單一相容於 OpenAI 的 API 後方託管開源、專有與自訂模型，並對文字、圖片、影片、音訊、搜尋與 3D 端點提供隨用隨付定價。 |
| LiteLLM 提供者路由 | `empiriolabs/` |
| 提供者文件連結 | [EmpirioLabs AI 文件 ↗](https://docs.empiriolabs.ai) |
| Base URL | `https://api.empiriolabs.ai/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage), `/responses` |

<br />
<br />

**我們支援所有 EmpirioLabs 聊天模型，只要在傳送 completion 請求時將 `empiriolabs/` 設為前綴即可**

## 可用模型（選擇） {#available-models-selection}

完整即時目錄與定價請見 [empiriolabs.ai/models](https://empiriolabs.ai/models)。熱門聊天模型：

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `empiriolabs/qwen3-7-max` | 用於編碼、代理程式與深度思考的 Qwen3.7 Max 旗艦文字模型 | 1M tokens |
| `empiriolabs/qwen3-7-plus` | 成本效益高的 Qwen3.7 視覺語言模型（文字、圖片、影片輸入） | 1M tokens |
| `empiriolabs/deepseek-v4-pro` | DeepSeek V4 旗艦 MoE（總計 1.6T / 啟用 49B 參數） | 1M tokens |
| `empiriolabs/deepseek-v4-flash` | 輕量級 DeepSeek V4 MoE（總計 284B / 啟用 13B 參數） | 1M tokens |
| `empiriolabs/glm-5-1` | 具備工具使用能力的 Zhipu AI 長上下文推理模型 | 202K tokens |
| `empiriolabs/kimi-k2-6` | Moonshot Kimi K2.6 多模態推理模型 | 256K tokens |
| `empiriolabs/minimax-m3` | 用於編碼與代理程式的 MiniMax M3 多模態推理 | 524K tokens |
| `empiriolabs/gemma-4-26b-a4b` | Google Gemma 4 26B A4B 開源多模態模型 | 256K tokens |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["EMPIRIOLABS_API_KEY"] = ""  # your EmpirioLabs API key
```

從 [EmpirioLabs 儀表板](https://platform.empiriolabs.ai/dashboard/api-keys) 取得 API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="EmpirioLabs Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["EMPIRIOLABS_API_KEY"] = ""  # your EmpirioLabs API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# EmpirioLabs call
response = completion(model="empiriolabs/qwen3-7-plus", messages=messages)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="EmpirioLabs Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["EMPIRIOLABS_API_KEY"] = ""  # your EmpirioLabs API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# EmpirioLabs call with streaming
response = completion(
    model="empiriolabs/qwen3-7-plus",
    messages=messages,
    stream=True,
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: qwen3-7-plus
    litellm_params:
      model: empiriolabs/qwen3-7-plus
      api_key: os.environ/EMPIRIOLABS_API_KEY

  - model_name: deepseek-v4-flash
    litellm_params:
      model: empiriolabs/deepseek-v4-flash
      api_key: os.environ/EMPIRIOLABS_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="EmpirioLabs via Proxy"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key",      # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="qwen3-7-plus",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="EmpirioLabs via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "qwen3-7-plus",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

## 其他注意事項 {#additional-notes}

- 具備思考能力的模型接受 `reasoning_effort`（`none`、`low`、`medium`、`high`、`max`）；閘道會將其對應到每個模型原生的思考控制。
- 各模型參數、限制與即時定價列於 [docs.empiriolabs.ai](https://docs.empiriolabs.ai)，並可在每個模型頁面上的 [empiriolabs.ai/models](https://empiriolabs.ai/models) 查看。
