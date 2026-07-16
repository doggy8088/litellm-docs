# Mistral {#mistral}

Mistral 的透傳端點 - 直接呼叫提供者專屬端點，使用原生格式（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ❌ | 不支援 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ❌ | [若您需要，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://api.mistral.ai/v1` 替換為 `LITELLM_PROXY_BASE_URL/mistral` 🚀

#### **使用範例** {#example-usage}

```bash
curl -L -X POST 'http://0.0.0.0:4000/mistral/v1/ocr' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "mistral-ocr-latest",
    "document": {
        "type": "image_url",
        "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
    }

}'
```

支援 **所有** Mistral 端點（包含串流）。

## 快速開始 {#quick-start}

讓我們呼叫 Mistral [`/chat/completions` 端點](https://docs.mistral.ai/api/#tag/chat/operation/chat_completion_v1_chat_completions_post)

1. 將 MISTRAL_API_KEY 加入您的環境 

```bash
export MISTRAL_API_KEY="sk-1234"
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試一下！ 

讓我們呼叫 Mistral `/ocr` 端點

```bash
curl -L -X POST 'http://0.0.0.0:4000/mistral/v1/ocr' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "mistral-ocr-latest",
    "document": {
        "type": "image_url",
        "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
    }

}'
```


## 範例 {#examples}

`http://0.0.0.0:4000/mistral` 之後的任何內容都會被視為提供者專屬路由，並據此處理。

主要變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://api.mistral.ai/v1`          | `http://0.0.0.0:4000/mistral` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `bearer $MISTRAL_API_KEY`                                 | `bearer anything` (若 proxy 上已設定 Virtual Keys，請使用 `bearer LITELLM_VIRTUAL_KEY`)                    |

### **範例 1：OCR 端點** {#example-1-ocr-endpoint}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash
curl -L -X POST 'http://0.0.0.0:4000/mistral/v1/ocr' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_API_KEY' \
-d '{
    "model": "mistral-ocr-latest",
    "document": {
        "type": "image_url",
        "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
    }
}'
```


#### 直接 Mistral API 呼叫  {#direct-mistral-api-call}

```bash
curl https://api.mistral.ai/v1/ocr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MISTRAL_API_KEY}" \
  -d '{
    "model": "mistral-ocr-latest",
    "document": {
        "type": "document_url",
        "document_url": "https://arxiv.org/pdf/2201.04234"
    },
    "include_image_base64": true
  }'
```

### **範例 2：Chat API** {#example-2-chat-api}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash
curl -L -X POST 'http://0.0.0.0:4000/mistral/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_VIRTUAL_KEY' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": "I am going to Paris, what should I see?"
        }
    ],
    "max_tokens": 2048,
    "temperature": 0.8,
    "top_p": 0.1,
    "model": "mistral-large-latest",
}'
```

#### 直接 Mistral API 呼叫  {#direct-mistral-api-call-1}

```bash
curl -L -X POST 'https://api.mistral.ai/v1/chat/completions' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": "I am going to Paris, what should I see?"
        }
    ],
    "max_tokens": 2048,
    "temperature": 0.8,
    "top_p": 0.1,
    "model": "mistral-large-latest",
}'
```


## 進階 - 搭配 Virtual Keys 使用  {#advanced---use-with-virtual-keys}

前置需求
- [以 DB 設定 proxy](../proxy/virtual_keys.md#setup)

請使用這個方式，避免將原始 Mistral API 金鑰提供給開發者，但仍可讓他們使用 Mistral 端點。

### 使用方式 {#usage}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export MISTRAL_API_BASE=""
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
curl -L -X POST 'http://0.0.0.0:4000/mistral/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234ewknldferwedojwojw' \
  --data '{
    "messages": [
        {
            "role": "user",
            "content": "I am going to Paris, what should I see?"
        }
    ],
    "max_tokens": 2048,
    "temperature": 0.8,
    "top_p": 0.1,
    "model": "qwen2.5-7b-instruct",
}'
```
