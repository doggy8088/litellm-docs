# Abliteration {#abliteration}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Abliteration 提供 OpenAI 相容的 `/chat/completions` 端點。 |
| LiteLLM 提供者路由 | `abliteration/` |
| 提供者文件連結 | [Abliteration](https://abliteration.ai) |
| Base URL | `https://api.abliteration.ai/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["ABLITERATION_API_KEY"] = ""  # your Abliteration API key
```

## 範例用法 {#sample-usage}

```python showLineNumbers title="Abliteration Completion"
import os
from litellm import completion

os.environ["ABLITERATION_API_KEY"] = ""

response = completion(
    model="abliteration/abliterated-model",
    messages=[{"role": "user", "content": "Hello from LiteLLM"}],
)

print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}

```python showLineNumbers title="Abliteration Streaming Completion"
import os
from litellm import completion

os.environ["ABLITERATION_API_KEY"] = ""

response = completion(
    model="abliteration/abliterated-model",
    messages=[{"role": "user", "content": "Stream a short reply"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

## 與 LiteLLM Proxy Server 搭配使用 {#usage-with-litellm-proxy-server}

1. 將模型加入您的 proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: abliteration-chat
    litellm_params:
      model: abliteration/abliterated-model
      api_key: os.environ/ABLITERATION_API_KEY
```

2. 啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

## 直接 API 用法（Bearer Token） {#direct-api-usage-bearer-token}

使用環境變數作為 Bearer token，對 OpenAI 相容端點：
`https://api.abliteration.ai/v1/chat/completions`。

```bash showLineNumbers title="cURL"
export ABLITERATION_API_KEY=""
curl https://api.abliteration.ai/v1/chat/completions \
  -H "Authorization: Bearer ${ABLITERATION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "abliterated-model",
    "messages": [{"role": "user", "content": "Hello from Abliteration"}]
  }'
```

```python showLineNumbers title="Python (requests)"
import os
import requests

api_key = os.environ["ABLITERATION_API_KEY"]

response = requests.post(
    "https://api.abliteration.ai/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    json={
        "model": "abliterated-model",
        "messages": [{"role": "user", "content": "Hello from Abliteration"}],
    },
    timeout=60,
)

print(response.json())
```
