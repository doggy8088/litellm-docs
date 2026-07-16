import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI SDK {#vertex-ai-sdk}

Vertex AI 的 pass-through 端點 - 以原生格式呼叫特定提供者端點（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 支援 `/generateContent` 端點上的所有模型 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 端使用者追蹤 | ❌ | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

## 支援的端點 {#supported-endpoints}

LiteLLM 支援 3 個 vertex ai passthrough 路由：

1. `/vertex_ai` → 路由至 `https://{vertex_location}-aiplatform.googleapis.com/`
2. `/vertex_ai/discovery` → 路由至 [`https://discoveryengine.googleapis.com`](https://discoveryengine.googleapis.com/) - [請參閱 Search Datastores 指南](./vertex_ai_search_datastores.md)
3. `/vertex_ai/live` → 升級至 Vertex AI Live API WebSocket（`google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent`）- [請參閱 Live WebSocket 指南](./vertex_ai_live_websocket.md)

## 如何使用 {#how-to-use}

只要將 `https://REGION-aiplatform.googleapis.com` 替換為 `LITELLM_PROXY_BASE_URL/vertex_ai`

LiteLLM 支援透過 pass-through 呼叫 Vertex AI 端點的 3 種流程：

1. **特定憑證**：管理員為特定專案/區域設定 passthrough 憑證。

2. **預設憑證**：管理員設定預設憑證。

3. **用戶端憑證**：使用者可將用戶端憑證傳送至 Vertex AI（預設行為 - 如果找不到預設或對應的憑證，請求會直接 pass-through）。

## 範例用法 {#example-usage}

<Tabs>
<TabItem value="specific_credentials" label="特定專案/區域">

```yaml
model_list:
  - model_name: gemini-1.0-pro
    litellm_params:
      model: vertex_ai/gemini-1.0-pro
      vertex_project: adroit-crow-413218
      vertex_location: us-central1
      vertex_credentials: /path/to/credentials.json
      use_in_pass_through: true # 👈 KEY CHANGE
```

</TabItem>
<TabItem value="default_credentials" label="預設憑證">

<Tabs>
<TabItem value="yaml" label="在 config.yaml 中設定">

```yaml
default_vertex_config:
  vertex_project: adroit-crow-413218
  vertex_location: us-central1
  vertex_credentials: /path/to/credentials.json
```
</TabItem>
<TabItem value="env_var" label="在環境變數中設定">

```bash
export DEFAULT_VERTEXAI_PROJECT="adroit-crow-413218"
export DEFAULT_VERTEXAI_LOCATION="us-central1"
export DEFAULT_GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

</TabItem>
</Tabs>
</TabItem>
<TabItem value="client_credentials" label="用戶端憑證">

試試 Gemini 2.0 Flash（curl）

```
MODEL_ID="gemini-2.0-flash-001"
PROJECT_ID="YOUR_PROJECT_ID"
```

```bash
curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  "${LITELLM_PROXY_BASE_URL}/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:streamGenerateContent" -d \
  $'{
    "contents": {
      "role": "user",
      "parts": [
        {
        "fileData": {
          "mimeType": "image/png",
          "fileUri": "gs://generativeai-downloads/images/scones.jpg"
          }
        },
        {
          "text": "Describe this picture."
        }
      ]
    }
  }'
```

</TabItem>
</Tabs>

#### **範例用法** {#example-usage-1}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:generateContent \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{
    "contents":[{
      "role": "user", 
      "parts":[{"text": "How are you doing today?"}]
    }]
  }'
```

</TabItem>
<TabItem value="js" label="Vertex Node.js SDK">

```javascript
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
    project: 'your-project-id', // enter your vertex project id
    location: 'us-central1', // enter your vertex region
    apiEndpoint: "localhost:4000/vertex_ai" // <proxy-server-url>/vertex_ai # note, do not include 'https://' in the url
});

const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.0-pro'
}, {
    customHeaders: {
        "x-litellm-api-key": "sk-1234" // Your litellm Virtual Key
    }
});

async function generateContent() {
    try {
        const prompt = {
            contents: [{
                role: 'user',
                parts: [{ text: 'How are you doing today?' }]
            }]
        };

        const response = await model.generateContent(prompt);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

generateContent();
```

</TabItem>
</Tabs>

## Vertex AI Live API WebSocket {#vertex-ai-live-api-websocket}

LiteLLM 現在可以代理 Vertex AI Live API，協助您在不向用戶端暴露 Google 憑證的情況下，試驗來自 Gemini Live models 的串流音訊/文字。

- 透過 `default_vertex_config` 或環境變數設定預設的 Vertex 憑證（請參閱上方範例）。
- 連線至 `wss://<PROXY_URL>/vertex_ai/live`。LiteLLM 會將您儲存的憑證交換為短效存取權杖，並雙向轉送訊息。
- 可選的查詢參數 `vertex_project`、`vertex_location` 和 `model` 可讓您在多專案設定或僅全域模型中覆寫預設值。

```python title="client.py"
import asyncio
import json

from websockets.asyncio.client import connect


async def main() -> None:
    headers = {
        "x-litellm-api-key": "Bearer sk-your-litellm-key",
        "Content-Type": "application/json",
    }
    async with connect(
        "ws://localhost:4000/vertex_ai/live",
        additional_headers=headers,
    ) as ws:
        await ws.send(
            json.dumps(
                {
                    "setup": {
                        "model": "projects/your-project/locations/us-central1/publishers/google/models/gemini-2.0-flash-live-preview-04-09",
                        "generation_config": {"response_modalities": ["TEXT"]},
                    }
                }
            )
        )

        async for message in ws:
            print("server:", message)


if __name__ == "__main__":
    asyncio.run(main())
```


## 快速開始 {#quick-start}

我們來呼叫 Vertex AI [`/generateContent` 端點](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference)

1. 將 Vertex AI 憑證加入您的環境 

```bash
export DEFAULT_VERTEXAI_PROJECT="" # "adroit-crow-413218"
export DEFAULT_VERTEXAI_LOCATION="" # "us-central1"
export DEFAULT_GOOGLE_APPLICATION_CREDENTIALS="" # "/Users/Downloads/adroit-crow-413218-a956eef1a2a8.json"
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

我們來呼叫 Google AI Studio token counting 端點

```bash
curl http://localhost:4000/vertex-ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "contents":[{
      "role": "user",
      "parts":[{"text": "How are you doing today?"}]
    }]
  }'
```


## 支援的 API 端點 {#supported-api-endpoints}

- Gemini API
- Embeddings API
- Imagen API
- Code Completion API
- Batch prediction API
- Tuning API
- CountTokens API

#### Vertex AI 的驗證 {#authentication-to-vertex-ai}

LiteLLM Proxy Server 支援兩種對 Vertex AI 的驗證方法：

1. 將 Vertex 憑證從用戶端傳遞到 proxy server

2. 在 proxy server 上設定 Vertex AI 憑證

## 使用範例 {#usage-examples}

### Gemini API（產生內容） {#gemini-api-generate-content}

```shell
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:generateContent \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{"contents":[{"role": "user", "parts":[{"text": "hi"}]}]}'
```


### Embeddings API {#embeddings-api}

```shell
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/textembedding-gecko@001:predict \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{"instances":[{"content": "gm"}]}'
```


### Imagen API {#imagen-api}

```shell
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{"instances":[{"prompt": "make an otter"}], "parameters": {"sampleCount": 1}}'
```


### Count Tokens API {#count-tokens-api}

```shell
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:countTokens \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{"contents":[{"role": "user", "parts":[{"text": "hi"}]}]}'
```
### Tuning API {#tuning-api}

建立 Fine Tuning Job

```shell
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:tuningJobs \
      -H "Content-Type: application/json" \
      -H "x-litellm-api-key: Bearer sk-1234" \
      -d '{
  "baseModel": "gemini-1.0-pro-002",
  "supervisedTuningSpec" : {
      "training_dataset_uri": "gs://cloud-samples-data/ai-platform/generative_ai/sft_train_data.jsonl"
  }
}'
```

## 進階 {#advanced}

先決條件
- [使用 DB 設定 proxy](../proxy/virtual_keys.md#setup)

使用這個方式，可避免將原始的 Anthropic API 金鑰提供給開發人員，但仍可讓他們使用 Anthropic 端點。

### 搭配虛擬金鑰使用 {#use-with-virtual-keys}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""

# vertex ai credentials
export DEFAULT_VERTEXAI_PROJECT="" # "adroit-crow-413218"
export DEFAULT_VERTEXAI_LOCATION="" # "us-central1"
export DEFAULT_GOOGLE_APPLICATION_CREDENTIALS="" # "/Users/Downloads/adroit-crow-413218-a956eef1a2a8.json"
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生虛擬金鑰 

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'x-litellm-api-key: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應 

```bash
{
    ...
    "key": "sk-1234ewknldferwedojwojw"
}
```

3. 測試它！ 

```bash
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{
    "contents":[{
      "role": "user", 
      "parts":[{"text": "How are you doing today?"}]
    }]
  }'
```

### 在請求標頭中傳送 `tags` {#send-tags-in-request-headers}

如果您希望將 `tags` 追蹤到 LiteLLM DB 和記錄回呼中，請使用這個方式

將 `tags` 以逗號分隔清單的形式傳入請求標頭。在下方範例中，將會追蹤以下標籤 

```
tags: ["vertex-js-sdk", "pass-through-endpoint"]
```

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -H "tags: vertex-js-sdk,pass-through-endpoint" \
  -d '{
    "contents":[{
      "role": "user", 
      "parts":[{"text": "How are you doing today?"}]
    }]
  }'
```

</TabItem>
<TabItem value="js" label="Vertex Node.js SDK">

```javascript
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
    project: 'your-project-id', // enter your vertex project id
    location: 'us-central1', // enter your vertex region
    apiEndpoint: "localhost:4000/vertex_ai" // <proxy-server-url>/vertex_ai # note, do not include 'https://' in the url
});

const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.0-pro'
}, {
    customHeaders: {
        "x-litellm-api-key": "sk-1234", // Your litellm Virtual Key
        "tags": "vertex-js-sdk,pass-through-endpoint"
    }
});

async function generateContent() {
    try {
        const prompt = {
            contents: [{
                role: 'user',
                parts: [{ text: 'How are you doing today?' }]
            }]
        };

        const response = await model.generateContent(prompt);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

generateContent();
```

</TabItem>
</Tabs>

### 在 Vertex AI 上使用 Anthropic Beta 功能 {#using-anthropic-beta-features-on-vertex-ai}

當透過 Vertex AI passthrough 使用 Anthropic models（例如 Vertex 上的 Claude）時，您可以啟用 Anthropic beta 功能，例如延伸的 context windows。

在呼叫 Anthropic models 時，`anthropic-beta` 標頭會自動轉送到 Vertex AI。

```bash
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-east5/publishers/anthropic/models/claude-3-5-sonnet:rawPredict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -H "anthropic-beta: context-1m-2025-08-07" \
  -d '{
    "anthropic_version": "vertex-2023-10-16",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 500
  }'
```

### 透過 `x-pass-` 前綴轉送自訂標頭 {#forwarding-custom-headers-with-x-pass--prefix}

您可以透過在任意自訂標頭前加上 `x-pass-`，將其轉送給提供者。該前綴會在標頭送出給提供者之前被移除。

例如：
- `x-pass-anthropic-beta: value` 會變成 `anthropic-beta: value`
- `x-pass-custom-header: value` 會變成 `custom-header: value`

當您需要傳送不在預設允許清單中的提供者特定標頭時，這很有用。

```bash
curl http://localhost:4000/vertex_ai/v1/projects/${PROJECT_ID}/locations/us-east5/publishers/anthropic/models/claude-3-5-sonnet:rawPredict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -H "x-pass-anthropic-beta: context-1m-2025-08-07" \
  -H "x-pass-custom-feature: enabled" \
  -d '{
    "anthropic_version": "vertex-2023-10-16",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 500
  }'
```

:::info
`x-pass-` 前綴適用於所有 LLM pass-through 端點，不僅限於 Vertex AI。
:::
