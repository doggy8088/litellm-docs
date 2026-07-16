# Cohere SDK {#cohere-sdk}

Cohere 的直通端點 - 以原生格式呼叫提供者專屬端點（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 支援 `/v1/chat` 和 `/v2/chat` |
| 記錄 | ✅ | 可跨所有整合運作 |
| 端使用者追蹤 | ❌ | [如果您需要，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://api.cohere.com` 替換為 `LITELLM_PROXY_BASE_URL/cohere` 🚀

#### **使用範例** {#example-usage}
```bash
curl --request POST \
  --url http://0.0.0.0:4000/cohere/v1/chat \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "chat_history": [
      {"role": "USER", "message": "Who discovered gravity?"},
      {"role": "CHATBOT", "message": "The man who is widely credited with discovering gravity is Sir Isaac Newton"}
    ],
    "message": "What year was he born?",
    "connectors": [{"id": "web-search"}]
  }'
```

支援 **所有** Cohere 端點（包括串流）。

[**查看所有 Cohere 端點**](https://docs.cohere.com/reference/chat)

## 快速開始 {#quick-start}

讓我們呼叫 Cohere 的 [`/rerank` 端點](https://docs.cohere.com/reference/rerank)

1. 將 Cohere API 金鑰加入您的環境 

```bash
export COHERE_API_KEY=""
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

讓我們呼叫 Cohere 的 /rerank 端點

```bash
curl --request POST \
  --url http://0.0.0.0:4000/cohere/v1/rerank \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "model": "rerank-english-v3.0",
    "query": "What is the capital of the United States?",
    "top_n": 3,
    "documents": ["Carson City is the capital city of the American state of Nevada.",
                  "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
                  "Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district.",
                  "Capitalization or capitalisation in English grammar is the use of a capital letter at the start of a word. English usage varies from capitalization in other languages.",
                  "Capital punishment (the death penalty) has existed in the United States since beforethe United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states."]
  }'
```


## 範例 {#examples}

`http://0.0.0.0:4000/cohere` 之後的所有內容都會被視為提供者專屬路由，並依此處理。

主要變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://api.cohere.com`          | `http://0.0.0.0:4000/cohere` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `bearer $CO_API_KEY`                                 | `bearer anything`（若 proxy 上已設定 Virtual Keys，請使用 `bearer LITELLM_VIRTUAL_KEY`）                    |

### **範例 1：Rerank 端點** {#example-1-rerank-endpoint}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash
curl --request POST \
  --url http://0.0.0.0:4000/cohere/v1/rerank \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "model": "rerank-english-v3.0",
    "query": "What is the capital of the United States?",
    "top_n": 3,
    "documents": ["Carson City is the capital city of the American state of Nevada.",
                  "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
                  "Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district.",
                  "Capitalization or capitalisation in English grammar is the use of a capital letter at the start of a word. English usage varies from capitalization in other languages.",
                  "Capital punishment (the death penalty) has existed in the United States since beforethe United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states."]
  }'
```

#### 直接 Cohere API 呼叫  {#direct-cohere-api-call}

```bash
curl --request POST \
  --url https://api.cohere.com/v1/rerank \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer $CO_API_KEY" \
  --data '{
    "model": "rerank-english-v3.0",
    "query": "What is the capital of the United States?",
    "top_n": 3,
    "documents": ["Carson City is the capital city of the American state of Nevada.",
                  "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
                  "Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district.",
                  "Capitalization or capitalisation in English grammar is the use of a capital letter at the start of a word. English usage varies from capitalization in other languages.",
                  "Capital punishment (the death penalty) has existed in the United States since beforethe United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states."]
  }'
```

### **範例 2：Chat API** {#example-2-chat-api}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash
curl --request POST \
  --url http://0.0.0.0:4000/cohere/v1/chat \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "chat_history": [
      {"role": "USER", "message": "Who discovered gravity?"},
      {"role": "CHATBOT", "message": "The man who is widely credited with discovering gravity is Sir Isaac Newton"}
    ],
    "message": "What year was he born?",
    "connectors": [{"id": "web-search"}]
  }'
```

#### 直接 Cohere API 呼叫  {#direct-cohere-api-call-1}

```bash
curl --request POST \
  --url https://api.cohere.com/v1/chat \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer $CO_API_KEY" \
  --data '{
    "chat_history": [
      {"role": "USER", "message": "Who discovered gravity?"},
      {"role": "CHATBOT", "message": "The man who is widely credited with discovering gravity is Sir Isaac Newton"}
    ],
    "message": "What year was he born?",
    "connectors": [{"id": "web-search"}]
  }'
```

### **範例 3：Embedding** {#example-3-embedding}

```bash
curl --request POST \
  --url https://api.cohere.com/v1/embed \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "model": "embed-english-v3.0",
    "texts": ["hello", "goodbye"],
    "input_type": "classification"
  }'
```

#### 直接 Cohere API 呼叫  {#direct-cohere-api-call-2}

```bash
curl --request POST \
  --url https://api.cohere.com/v1/embed \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer $CO_API_KEY" \
  --data '{
    "model": "embed-english-v3.0",
    "texts": ["hello", "goodbye"],
    "input_type": "classification"
  }'
```


## 進階 - 搭配 Virtual Keys 使用  {#advanced---use-with-virtual-keys}

先決條件
- [以資料庫設定 proxy](../proxy/virtual_keys.md#setup)

使用這個方式可避免直接提供開發者原始 Cohere API 金鑰，但仍可讓他們使用 Cohere 端點。

### 使用方式 {#usage}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export COHERE_API_KEY=""
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生虛擬金鑰 

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

3. 測試它！ 

```bash
curl --request POST \
  --url http://0.0.0.0:4000/cohere/v1/rerank \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-1234ewknldferwedojwojw" \
  --data '{
    "model": "rerank-english-v3.0",
    "query": "What is the capital of the United States?",
    "top_n": 3,
    "documents": ["Carson City is the capital city of the American state of Nevada.",
                  "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
                  "Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district.",
                  "Capitalization or capitalisation in English grammar is the use of a capital letter at the start of a word. English usage varies from capitalization in other languages.",
                  "Capital punishment (the death penalty) has existed in the United States since beforethe United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states."]
  }'
```
