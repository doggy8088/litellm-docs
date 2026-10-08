import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GigaChat {#gigachat}
https://developers.sber.ru/docs/ru/gigachat/api/overview

GigaChat 是 Sber AI 的大型語言模型，也是俄羅斯領先的 LLM 提供者。

:::tip

**我們支援所有 GigaChat 模型，只要在傳送 litellm 請求時將 `model=gigachat/<any-model-on-gigachat>` 作為前綴即可**

:::

:::warning

GigaChat API 使用自簽署 SSL 憑證。您必須在請求中傳遞 `ssl_verify=False`。

:::

## 支援的功能 {#supported-features}

| 功能 | 支援 |
|---------|-----------|
| 聊天完成 | 是 |
| 串流 | 是 |
| 非同步 | 是 |
| 函式呼叫 / 工具 | 是 |
| 結構化輸出（JSON Schema） | 是（透過函式呼叫模擬） |
| 圖片輸入 | 是（base64 和 URL）- 僅限 GigaChat-2-Max、GigaChat-2-Pro |
| 嵌入 | 是 |

## API 金鑰 {#api-key}

GigaChat 使用 OAuth 驗證。請將您的憑證設定為環境變數：

```python
import os

# Required: Set credentials (base64-encoded client_id:client_secret)
os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

# Optional: Set scope (default is GIGACHAT_API_PERS for personal use)
os.environ['GIGACHAT_SCOPE'] = "GIGACHAT_API_PERS"  # or GIGACHAT_API_B2B for business
```

您的憑證可在此取得：https://developers.sber.ru/studio/

## 範例用法 {#sample-usage}

```python
from litellm import completion
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

response = completion(
    model="gigachat/GigaChat-2-Max",
    messages=[
       {"role": "user", "content": "Hello from LiteLLM!"}
   ],
    ssl_verify=False,  # Required for GigaChat
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}

```python
from litellm import completion
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

response = completion(
    model="gigachat/GigaChat-2-Max",
    messages=[
       {"role": "user", "content": "Hello from LiteLLM!"}
   ],
    stream=True,
    ssl_verify=False,  # Required for GigaChat
)

for chunk in response:
    print(chunk)
```

## 範例用法 - 函式呼叫 {#sample-usage---function-calling}

```python
from litellm import completion
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get weather for a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }
    }
}]

response = completion(
    model="gigachat/GigaChat-2-Max",
    messages=[{"role": "user", "content": "What's the weather in Moscow?"}],
    tools=tools,
    ssl_verify=False,  # Required for GigaChat
)
print(response)
```

## 範例用法 - 結構化輸出 {#sample-usage---structured-output}

GigaChat 支援透過 JSON schema 的結構化輸出（透過函式呼叫模擬）：

```python
from litellm import completion
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

response = completion(
    model="gigachat/GigaChat-2-Max",
    messages=[{"role": "user", "content": "Extract info: John is 30 years old"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "person",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"}
                }
            }
        }
    },
    ssl_verify=False,  # Required for GigaChat
)
print(response)  # Returns JSON: {"name": "John", "age": 30}
```

## 範例用法 - 圖片輸入 {#sample-usage---image-input}

GigaChat 支援透過 base64 或 URL 的圖片輸入（僅限 GigaChat-2-Max 和 GigaChat-2-Pro）：

```python
from litellm import completion
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

response = completion(
    model="gigachat/GigaChat-2-Max",  # Vision requires GigaChat-2-Max or GigaChat-2-Pro
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
        ]
    }],
    ssl_verify=False,  # Required for GigaChat
)
print(response)
```

## 範例用法 - Embeddings {#sample-usage---embeddings}

```python
from litellm import embedding
import os

os.environ['GIGACHAT_CREDENTIALS'] = "your-credentials-here"

response = embedding(
    model="gigachat/Embeddings",
    input=["Hello world", "How are you?"],
    ssl_verify=False,  # Required for GigaChat
)
print(response)
```

## 與 LiteLLM Proxy 搭配使用 {#usage-with-litellm-proxy}

### 1. 在 config.yaml 上設定 GigaChat 模型 {#1-set-gigachat-models-on-configyaml}

```yaml
model_list:
  - model_name: gigachat
    litellm_params:
      model: gigachat/GigaChat-2-Max
      api_key: "os.environ/GIGACHAT_CREDENTIALS"
      ssl_verify: false
  - model_name: gigachat-lite
    litellm_params:
      model: gigachat/GigaChat-2-Lite
      api_key: "os.environ/GIGACHAT_CREDENTIALS"
      ssl_verify: false
  - model_name: gigachat-embeddings
    litellm_params:
      model: gigachat/Embeddings
      api_key: "os.environ/GIGACHAT_CREDENTIALS"
      ssl_verify: false
```

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "gigachat",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
}'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gigachat",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response)
```
</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

### 聊天模型 {#chat-models}

| 模型名稱 | Context 視窗 | 視覺 | 說明 |
|------------|----------------|--------|-------------|
| gigachat/GigaChat-2-Lite | 128K | 否 | 快速、輕量級模型 |
| gigachat/GigaChat-2-Pro | 128K | 是 | 具備視覺能力的專業模型 |
| gigachat/GigaChat-2-Max | 128K | 是 | 最高能力模型 |

### Embedding 模型 {#embedding-models}

| 模型名稱 | 最大輸入 | 維度 | 說明 |
|------------|-----------|------------|-------------|
| gigachat/Embeddings | 512 | 1024 | 標準 embeddings |
| gigachat/Embeddings-2 | 512 | 1024 | 更新的 embeddings |
| gigachat/EmbeddingsGigaR | 4096 | 2560 | 高維度 embeddings |

:::note
可用模型可能會因您的 API 存取層級（個人或企業）而有所不同。
:::

## 限制 {#limitations}

- 每個請求僅限一個函式呼叫（GigaChat API 限制）
- 每則訊息最多 1 張圖片，每次對話總共最多 10 張圖片
- GigaChat API 使用自簽署 SSL 憑證 - 需要 `ssl_verify=False`
