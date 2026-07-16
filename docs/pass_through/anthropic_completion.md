import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Anthropic 通透傳遞 {#anthropic-passthrough}

Anthropic 的通透傳遞端點 - 以原生格式呼叫特定提供者端點（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 支援 `/messages` 上的所有模型、`/v1/messages/batches` 端點 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 最終使用者追蹤 | ✅ | Prometheus `end_user` 標籤預設為關閉；可透過 `litellm.enable_end_user_cost_tracking_prometheus_only` 啟用 |
| 串流 | ✅ | |

只要將 `https://api.anthropic.com` 替換為 `LITELLM_PROXY_BASE_URL/anthropic`

#### **使用範例** {#example-usage}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'
```

</TabItem>
<TabItem value="python" label="Anthropic Python SDK">

```python
from anthropic import Anthropic

# Initialize client with proxy base URL
client = Anthropic(
    base_url="http://0.0.0.0:4000/anthropic", # <proxy-base-url>/anthropic
    api_key="sk-anything" # proxy virtual key
)

# Make a completion request
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, world"}
    ]
)

print(response)
```

</TabItem>
</Tabs>

支援 **所有** Anthropic 端點（包括串流）。

[**查看所有 Anthropic 端點**](https://docs.anthropic.com/en/api/messages)

## 快速開始 {#quick-start}

我們來呼叫 Anthropic [`/messages` 端點](https://docs.anthropic.com/en/api/messages)

1. 將 Anthropic API 金鑰加入您的環境

```bash
export ANTHROPIC_API_KEY=""
```

2. 啟動 LiteLLM Proxy

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試一下！

我們來呼叫 Anthropic /messages 端點

```bash
curl http://0.0.0.0:4000/anthropic/v1/messages \
     --header "x-api-key: $LITELLM_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "content-type: application/json" \
     --data \
    '{
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'
```


## 範例 {#examples}

`http://0.0.0.0:4000/anthropic` 之後的內容都會被視為特定提供者路由，並依此處理。

主要變更：

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://api.anthropic.com`          | `http://0.0.0.0:4000/anthropic` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `bearer $ANTHROPIC_API_KEY`                                 | `bearer anything` (如果 Proxy 上已設定 Virtual Keys，請使用 `bearer LITELLM_VIRTUAL_KEY`)                    |
    

### **範例 1：Messages 端點** {#example-1-messages-endpoint}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header "x-api-key: $LITELLM_API_KEY" \
    --header "anthropic-version: 2023-06-01" \
    --header "content-type: application/json" \
  --data '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ]
  }'
```

#### 直接 Anthropic API 呼叫  {#direct-anthropic-api-call}

```bash
curl https://api.anthropic.com/v1/messages \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "content-type: application/json" \
     --data \
    '{
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'
```

### **範例 2：Token 計數 API** {#example-2-token-counting-api}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash
curl --request POST \
    --url http://0.0.0.0:4000/anthropic/v1/messages/count_tokens \
    --header "x-api-key: $LITELLM_API_KEY" \
    --header "anthropic-version: 2023-06-01" \
    --header "anthropic-beta: token-counting-2024-11-01" \
    --header "content-type: application/json" \
    --data \
    '{
        "model": "claude-3-5-sonnet-20241022",
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'
```

#### 直接 Anthropic API 呼叫  {#direct-anthropic-api-call-1}

```bash
curl https://api.anthropic.com/v1/messages/count_tokens \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "anthropic-beta: token-counting-2024-11-01" \
     --header "content-type: application/json" \
     --data \
'{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ]
}'
```

### **範例 3：批次 Messages** {#example-3-batch-messages}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-2}

```bash
curl --request POST \
    --url http://0.0.0.0:4000/anthropic/v1/messages/batches \
    --header "x-api-key: $LITELLM_API_KEY" \
    --header "anthropic-version: 2023-06-01" \
    --header "anthropic-beta: message-batches-2024-09-24" \
    --header "content-type: application/json" \
    --data \
'{
    "requests": [
        {
            "custom_id": "my-first-request",
            "params": {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": "Hello, world"}
                ]
            }
        },
        {
            "custom_id": "my-second-request",
            "params": {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": "Hi again, friend"}
                ]
            }
        }
    ]
}'
```

#### 直接 Anthropic API 呼叫  {#direct-anthropic-api-call-2}

```bash
curl https://api.anthropic.com/v1/messages/batches \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "anthropic-beta: message-batches-2024-09-24" \
     --header "content-type: application/json" \
     --data \
'{
    "requests": [
        {
            "custom_id": "my-first-request",
            "params": {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": "Hello, world"}
                ]
            }
        },
        {
            "custom_id": "my-second-request",
            "params": {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": "Hi again, friend"}
                ]
            }
        }
    ]
}'
```

:::note 批次成本追蹤需要設定
若要讓批次通透傳遞成本追蹤正常運作，您需要在 `proxy_config.yaml` 中定義 Anthropic 模型：

```yaml
model_list:
  - model_name: claude-sonnet-4-5-20250929  # or any alias
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20250929
      api_key: os.environ/ANTHROPIC_API_KEY
```

這可確保輪詢機制能正確識別提供者，並擷取批次狀態以進行成本計算。
:::

## 進階 {#advanced}

先決條件
- [使用 DB 設定 Proxy](../proxy/virtual_keys.md#setup)

請使用此方式，避免將原始 Anthropic API 金鑰提供給開發人員，同時仍讓他們能使用 Anthropic 端點。

### 搭配 Virtual Keys 使用  {#use-with-virtual-keys}

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
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-1234ewknldferwedojwojw" \
  --data '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ]
  }'
```


### 傳送 `litellm_metadata`（tags、最終使用者成本追蹤） {#send-litellm_metadata-tags-end-user-cost-tracking}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ],
    "litellm_metadata": {
        "tags": ["test-tag-1", "test-tag-2"], 
        "user": "test-user" # track end-user/customer cost
    }
  }'
```

</TabItem>
<TabItem value="python" label="Anthropic Python SDK">

```python
from anthropic import Anthropic

client = Anthropic(
    base_url="http://0.0.0.0:4000/anthropic",
    api_key="sk-anything"
)

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, world"}
    ],
    extra_body={
        "litellm_metadata": {
            "tags": ["test-tag-1", "test-tag-2"], 
            "user": "test-user" # track end-user/customer cost
        }
    }, 
    ## OR## 
    metadata={ # anthropic native param - https://docs.anthropic.com/en/api/messages
        "user_id": "test-user" # track end-user/customer cost
    }

)

print(response)
```

</TabItem>
</Tabs>
