import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Google AI Studio SDK {#google-ai-studio-sdk}

Google AI Studio 的穿透式端點 - 以原生格式呼叫提供者特定端點（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 支援 `/generateContent` 端點上的所有模型 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 端用戶追蹤 | ❌ | [如果您需要此功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://generativelanguage.googleapis.com` 替換為 `LITELLM_PROXY_BASE_URL/gemini`

#### **使用範例** {#example-usage}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl 'http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:countTokens?key=sk-anything' \
-H 'Content-Type: application/json' \
-d '{
    "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }]
        }]
}'
```

</TabItem>
<TabItem value="js" label="Google GenAI JS SDK">

```javascript
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: "sk-1234", // litellm proxy API key
    httpOptions: {
        baseUrl: "http://localhost:4000/gemini", // http://<proxy-base-url>/gemini
    },
});

async function main() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Explain how AI works",
        });
        console.log(response.text);
    } catch (error) {
        console.error('Error:', error);
    }
}

// For streaming responses
async function main_streaming() {
    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: "Explain how AI works",
        });
        for await (const chunk of response) {
            process.stdout.write(chunk.text);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
// main_streaming();
```

</TabItem>
</Tabs>

支援 **所有** Google AI Studio 端點（包含串流）。

[**查看所有 Google AI Studio 端點**](https://ai.google.dev/api)

## 快速開始 {#quick-start}

我們來呼叫 Gemini [`/countTokens` 端點](https://ai.google.dev/api/tokens#method:-models.counttokens)

1. 將 Gemini API 金鑰加入您的環境變數 

```bash
export GEMINI_API_KEY=""
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試一下！ 

我們來呼叫 Google AI Studio 的 token 計數端點

```bash
http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:countTokens?key=anything' \
-H 'Content-Type: application/json' \
-d '{
    "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }]
        }]
}'
```


## 範例 {#examples}

`http://0.0.0.0:4000/gemini` 之後的內容都會被視為提供者特定路由，並相應處理。

主要變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://generativelanguage.googleapis.com`          | `http://0.0.0.0:4000/gemini` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `key=$GOOGLE_API_KEY`                                 | `key=anything`（如果 proxy 上已設定 Virtual Keys，請使用 `key=LITELLM_VIRTUAL_KEY`）                    |

### **範例 1：計算 token** {#example-1-counting-tokens}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash
curl http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:countTokens?key=anything \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }],
        }],
      }'
```

#### 直接 Google AI Studio 呼叫  {#direct-google-ai-studio-call}

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:countTokens?key=$GOOGLE_API_KEY \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }],
        }],
      }'
```

### **範例 2：產生內容** {#example-2-generate-content}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash
curl "http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:generateContent?key=anything" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{"text": "Write a story about a magic backpack."}]
        }]
       }' 2> /dev/null
```

#### 直接 Google AI Studio 呼叫  {#direct-google-ai-studio-call-1}

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GOOGLE_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{"text": "Write a story about a magic backpack."}]
        }]
       }' 2> /dev/null
```

### **範例 3：快取** {#example-3-caching}

```bash
curl -X POST "http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash-001:generateContent?key=anything" \
-H 'Content-Type: application/json' \
-d '{
      "contents": [
        {
          "parts":[{
            "text": "Please summarize this transcript"
          }],
          "role": "user"
        },
      ],
      "cachedContent": "'$CACHE_NAME'"
    }'
```

#### 直接 Google AI Studio 呼叫  {#direct-google-ai-studio-call-2}

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=$GOOGLE_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
      "contents": [
        {
          "parts":[{
            "text": "Please summarize this transcript"
          }],
          "role": "user"
        },
      ],
      "cachedContent": "'$CACHE_NAME'"
    }'
```


## **範例 4：使用 Veo 產生影片** {#example-4-video-generation-with-veo}

透過 LiteLLM 穿透式路由，使用 Google 的 Veo 模型產生影片。

[**→ 完整 Veo 影片產生指南**](../proxy/veo_video_generation.md)

## 進階  {#advanced}

前置需求
- [使用 DB 設定 proxy](../proxy/virtual_keys.md#setup)

使用這個方式，避免提供給開發人員原始的 Google AI Studio 金鑰，但仍讓他們可以使用 Google AI Studio 端點。

### 搭配 Virtual Keys 使用 {#use-with-virtual-keys}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export GEMINI_API_KEY=""
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生 virtual key 

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
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

3. 測試一下！ 

```bash
http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:countTokens?key=sk-1234ewknldferwedojwojw' \
-H 'Content-Type: application/json' \
-d '{
    "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }]
        }]
}'
```


### 在請求標頭中傳送 `tags` {#send-tags-in-request-headers}

如果您希望 `tags` 同時被追蹤於 LiteLLM DB 和記錄回呼中，請使用這個方式。

請在請求標頭中以逗號分隔清單傳入標籤。以下範例中，將會追蹤下列標籤

```
tags: ["gemini-js-sdk", "pass-through-endpoint"]
```

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl 'http://0.0.0.0:4000/gemini/v1beta/models/gemini-1.5-flash:generateContent?key=sk-anything' \
-H 'Content-Type: application/json' \
-H 'tags: gemini-js-sdk,pass-through-endpoint' \
-d '{
    "contents": [{
        "parts":[{
          "text": "The quick brown fox jumps over the lazy dog."
          }]
        }]
}'
```

</TabItem>
<TabItem value="js" label="Google GenAI JS SDK">

```javascript
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: "sk-1234",
    httpOptions: {
        baseUrl: "http://localhost:4000/gemini", // http://<proxy-base-url>/gemini
        headers: {
            "tags": "gemini-js-sdk,pass-through-endpoint",
        },
    },
});

async function main() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Explain how AI works",
        });
        console.log(response.text);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

</TabItem>
</Tabs>
