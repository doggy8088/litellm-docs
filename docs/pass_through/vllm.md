# VLLM {#vllm}

VLLM 的通過端點 - 呼叫提供者專屬端點，使用原生格式（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ❌ | 不支援 |
| 記錄 | ✅ | 可在所有整合中運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這個功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://my-vllm-server.com` 換成 `LITELLM_PROXY_BASE_URL/vllm` 🚀

#### **範例用法** {#example-usage}

```bash
curl -L -X GET 'http://0.0.0.0:4000/vllm/metrics' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
```

支援 **所有** VLLM 端點（包含串流）。

## 快速開始 {#quick-start}

我們來呼叫 VLLM [`/score` 端點](https://vllm.readthedocs.io/en/latest/api_reference/api_reference.html)

1. 將一個由 VLLM 主機代管的模型新增至您的 LiteLLM Proxy 

:::info

適用 LiteLLM v1.72.0+。 

:::

```yaml
model_list:
  - model_name: "my-vllm-model"
    litellm_params:
      model: hosted_vllm/vllm-1.72
      api_base: https://my-vllm-server.com
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試看看！ 

我們來呼叫 VLLM `/score` 端點

```bash
curl -X 'POST' \
  'http://0.0.0.0:4000/vllm/score' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "my-vllm-model",
  "encoding_format": "float",
  "text_1": "What is the capital of France?",
  "text_2": "The capital of France is Paris."
}'
```


## 範例 {#examples}

`http://0.0.0.0:4000/vllm` 之後的任何內容都會被視為提供者專屬路由，並據此處理。

主要變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://my-vllm-server.com`          | `http://0.0.0.0:4000/vllm` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `bearer $VLLM_API_KEY`                                 | `bearer anything`（如果在 proxy 上設定了 Virtual Keys，請使用 `bearer LITELLM_VIRTUAL_KEY`）                    |

### **範例 1：指標端點** {#example-1-metrics-endpoint}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash
curl -L -X GET 'http://0.0.0.0:4000/vllm/metrics' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_VIRTUAL_KEY' \
```


#### 直接 VLLM API 呼叫  {#direct-vllm-api-call}

```bash
curl -L -X GET 'https://my-vllm-server.com/metrics' \
-H 'Content-Type: application/json' \
```

### **範例 2：聊天 API** {#example-2-chat-api}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash
curl -L -X POST 'http://0.0.0.0:4000/vllm/chat/completions' \
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
    "model": "qwen2.5-7b-instruct",
}'
```

#### 直接 VLLM API 呼叫  {#direct-vllm-api-call-1}

```bash
curl -L -X POST 'https://my-vllm-server.com/chat/completions' \
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
    "model": "qwen2.5-7b-instruct",
}'
```


## 進階 - 搭配 Virtual Keys 使用  {#advanced---use-with-virtual-keys}

先決條件
- [使用 DB 設定 proxy](../proxy/virtual_keys.md#setup)

請使用這個方式，避免將原始的 Cohere API 金鑰提供給開發人員，但仍可讓他們使用 Cohere 端點。

### 用法 {#usage}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export HOSTED_VLLM_API_BASE=""
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

3. 測試看看！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/vllm/chat/completions' \
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
