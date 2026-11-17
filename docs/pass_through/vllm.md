# VLLM {#vllm}

VLLM 的通過端點 - 呼叫提供者專屬端點，使用原生格式（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ❌ | 不支援 |
| 記錄 | ✅ | 可在所有整合中運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這個功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://my-vllm-server.com` 換成 `LITELLM_PROXY_BASE_URL/vllm`

#### **範例用法** {#example-usage}

```bash
curl -L -X GET 'http://0.0.0.0:4000/vllm/metrics' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
```

支援 **所有** VLLM 端點（包含串流）。

## 快速開始 {#quick-start}

我們來呼叫 VLLM [`/score` 端點](https://vllm.readthedocs.io/en/latest/api_reference/api_reference.html)

1. 將一個由 VLLM 主機代管的模型新增至您的 LiteLLM Proxy 

<SinceVersion v="1.72.0" />

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

## 向以 `--api-key` 啟動的 vLLM 伺服器進行驗證 {#authenticate-to-a-vllm-server-started-with---api-key}

<SinceVersion v="1.110.0" />

以 `vllm serve <model> --api-key <key>` 啟動的 vLLM 伺服器只接受 `Authorization: Bearer <key>`。將相同的金鑰提供給 LiteLLM，它就會在 `/vllm` 呼叫時將該標頭送往上游。

對於 `model_list` 中的模型，請在該模型上設定 `api_key`。LiteLLM 會將它作為 `Authorization: Bearer <key>` 送出，與 `/chat/completions` 為該模型送出的標頭相同。沒有 `api_key` 的模型，在 `HOSTED_VLLM_API_KEY` 有設定時會送出該值，與 `/chat/completions` 的行為相同。沒有 `api_base` 的模型，在 `HOSTED_VLLM_API_BASE` 有設定時會前往該位址，否則前往 `VLLM_API_BASE`。仍然沒有金鑰、且被送往 `VLLM_API_BASE` 伺服器的模型，會送出 `VLLM_API_KEY`。在所有其他情況下，它不會送出任何驗證標頭。

```yaml
model_list:
  - model_name: "my-vllm-model"
    litellm_params:
      model: hosted_vllm/vllm-1.72
      api_base: https://my-vllm-server.com
      api_key: os.environ/MY_VLLM_SERVER_KEY
```

對於轉送至 `VLLM_API_BASE` 的請求，請設定 `VLLM_API_KEY`。LiteLLM 會將它作為 `Authorization: Bearer <key>` 以及 `x-api-key` 送出。

```bash
export VLLM_API_BASE="https://my-vllm-server.com"
export VLLM_API_KEY="<key your vLLM server was started with>"
```

位於伺服器前方、負責驗證 JWT 的 mesh（例如 Istio `RequestAuthentication`）會拒絕不是 JWT 的 bearer token。若您的閘道在這類 mesh 後方檢查 `x-api-key`，請將該 mesh 的 `jwtRules` `fromHeaders` 指向不同的標頭，使它不再讀取 `Authorization`。

模型的 `api_base` 與 `VLLM_API_BASE` 可以是伺服器根目錄，或以 `/v1` 結尾。當 base 以 `/v1` 結尾時，`/vllm/v1/chat/completions` 與 `/vllm/chat/completions` 都會到達伺服器的 `/v1/chat/completions`。`/v1` 之外的路徑，例如 `/tokenize` 或 `/metrics`，需要將 base 設為伺服器根目錄。

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

請使用這個方式，避免讓開發人員直接存取您的 VLLM 伺服器，同時仍然讓他們能使用 VLLM 端點。

其 `model` 不在您的 `model_list` 中的請求，會轉送到 `VLLM_API_BASE` 中設定的伺服器。如果該變數缺失，proxy 會拋出 `VLLM_API_BASE is not set`。`HOSTED_VLLM_API_BASE` 不會改變這些請求的去向。它只會為您 `model_list` 中沒有 `api_base` 的 `hosted_vllm/...` 模型設定伺服器。

### 用法 {#usage}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export VLLM_API_BASE=""
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生虛擬金鑰 

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應 

```bash
{
    ...
    "key": "sk-<virtual-key>"
}
```

3. 測試看看！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/vllm/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
