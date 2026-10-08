import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# QwenCloud 與 Qianwen AI Platform（Qwen models） {#qwencloud-and-qianwen-ai-platform-qwen-models}

Alibaba 已將其模型平台品牌（DashScope、Bailian、Model Studio）在中國大陸以外整合為 [QwenCloud](https://www.qwencloud.com/)，並在中國大陸整合為 [Qianwen AI Platform](https://www.qianwenai.com/)。LiteLLM 透過現有的 DashScope 實作來路由這兩個品牌，而舊版的 `dashscope/` 前綴仍可作為別名使用

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Alibaba 的 Qwen 模型平台，透過相容於 OpenAI 的 API 提供服務 |
| LiteLLM 上的提供者路由 | `qwencloud/`（國際版）、`qwen_ai_platform/`（中國大陸）、`dashscope/`（舊別名） |
| 提供者文件連結 | [QwenCloud 文件](https://docs.qwencloud.com/developer-guides/getting-started/introduction)、[Qianwen AI Platform 文件](https://platform.qianwenai.com/docs/developer-guides/getting-started/first-api-call) |
| 支援的操作 | `/chat/completions`、`/embeddings`、`/rerank`、`/images/generations` |

這些路由支援隨用隨付 API 金鑰。LiteLLM 尚未對 Token Plan 與 Coding Plan 端點進行對應（追蹤於 [issue #36150](https://github.com/BerriAI/litellm/issues/36150)）

## QwenCloud（國際版） {#qwencloud-international}

在中國大陸以外使用 `qwencloud/` 前綴

| 設定 | 值 |
|-------|-------|
| 前綴 | `qwencloud/` |
| 預設 API base | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| rerank 端點 | `https://dashscope-intl.aliyuncs.com/compatible-api/v1/reranks` |
| 圖像生成端點 | `https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| API 金鑰環境變數 | `QWENCLOUD_API_KEY`（會回退至 `DASHSCOPE_API_KEY`） |
| base URL 覆寫 | `QWENCLOUD_API_BASE`、`QWENCLOUD_API_BASE_RERANK`、`QWENCLOUD_API_BASE_IMAGE` |

## Qianwen AI Platform（中國大陸） {#qianwen-ai-platform-mainland-china}

在中國大陸使用 `qwen_ai_platform/` 前綴。它會連到大陸主機上的相同路徑

| 設定 | 值 |
|-------|-------|
| 前綴 | `qwen_ai_platform/` |
| 預設 API base | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| rerank 端點 | `https://dashscope.aliyuncs.com/compatible-api/v1/reranks` |
| 圖像生成端點 | `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| API 金鑰環境變數 | `QWEN_AI_PLATFORM_API_KEY`（會回退至 `DASHSCOPE_API_KEY`） |
| base URL 覆寫 | `QWEN_AI_PLATFORM_API_BASE`、`QWEN_AI_PLATFORM_API_BASE_RERANK`、`QWEN_AI_PLATFORM_API_BASE_IMAGE` |

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"
```

在中國大陸則請改用 `QWEN_AI_PLATFORM_API_KEY`。當各自的金鑰未設定時，兩個前綴也都會讀取 `DASHSCOPE_API_KEY`，因此現有的 DashScope 憑證可直接使用，無需變更

## 模型 {#models}

兩個前綴都接受 DashScope 目錄中的任何模型，例如 `qwencloud/qwen-max`、`qwencloud/qwen-flash`、`qwencloud/qwen-image-3.0` 或 `qwen_ai_platform/qwen-plus`。請參閱 [DashScope 頁面](./dashscope) 以查看模型清單

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completions}

```python showLineNumbers title="QwenCloud Chat Completion"
import os
from litellm import completion

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = completion(
    model="qwencloud/qwen-max",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="QwenCloud Streaming Chat Completion"
import os
from litellm import completion

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = completion(
    model="qwencloud/qwen-flash",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 嵌入 {#embedding}

```python showLineNumbers title="QwenCloud Embedding"
import os
from litellm import embedding

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = embedding(
    model="qwencloud/text-embedding-v4",
    input=["hello from litellm"],
)

print(response.data[0]["embedding"][:5])
```

### Rerank {#rerank}

```python showLineNumbers title="QwenCloud Rerank"
import os
from litellm import rerank

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = rerank(
    model="qwencloud/gte-rerank-v2",
    query="What is the capital of France?",
    documents=["Paris is the capital of France", "Berlin is the capital of Germany"],
)

print(response.results)
```

### 圖像生成 {#image-generation}

```python showLineNumbers title="QwenCloud Image Generation"
import os
from litellm import image_generation

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = image_generation(
    model="qwencloud/qwen-image-3.0",
    prompt="A cup of coffee on a wooden table",
)

print(response.data[0].url)
```

## 用法 - LiteLLM Proxy {#usage---litellm-proxy}

將模型加入您的 LiteLLM Proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: qwen-max
    litellm_params:
      model: qwencloud/qwen-max
      api_key: os.environ/QWENCLOUD_API_KEY
  - model_name: qwen-plus-cn
    litellm_params:
      model: qwen_ai_platform/qwen-plus
      api_key: os.environ/QWEN_AI_PLATFORM_API_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export QWENCLOUD_API_KEY="your-api-key"
litellm --config config.yaml --port 4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="QwenCloud via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-key",
)

response = client.chat.completions.create(
    model="qwen-max",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="QwenCloud via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

## 與 DashScope 的向後相容性 {#backward-compatibility-with-dashscope}

`dashscope/` 前綴、`DASHSCOPE_API_KEY`、`DASHSCOPE_API_BASE`，以及所有既有的 DashScope 設定都可維持不變地繼續運作。`qwencloud/` 與 `qwen_ai_platform/` 是同一實作上的別名，因此不需要遷移：您可在適合時切換前綴，或完全不切換
