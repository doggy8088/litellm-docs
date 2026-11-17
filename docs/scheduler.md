---
sidebar_label: "請求優先順序（Beta）"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# [BETA] 請求優先順序 {#beta-request-prioritization}

:::info 

測試版功能。僅供測試使用。 

[協助我們改進這項功能](https://github.com/BerriAI/litellm/issues)
:::

在高流量情況下優先處理 LLM API 請求。

- 將請求加入優先佇列
- 輪詢佇列，檢查是否可以發出請求。回傳 'True'：
    * 如果有健康的部署
    * 或如果請求位於佇列頂端
- 優先順序 - 數字越小，優先順序越高：
    * 例如 `priority=0` > `priority=2000`

支援的 Router 端點：
- `acompletion`（Proxy 上的 `/v1/chat/completions`）
- `atext_completion`（Proxy 上的 `/v1/completions`）

## 快速開始  {#quick-start}

```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "{{openai_small}}",
            "litellm_params": {
                "model": "{{openai_small}}",
                "mock_response": "Hello world this is Macintosh!", # fakes the LLM API call
                "rpm": 1,
            },
        },
    ],
    timeout=2, # timeout request if takes > 2s
    routing_strategy="simple-shuffle", # recommended for best performance
    polling_interval=0.03 # poll queue every 3ms if no healthy deployments
)

try:
    _response = await router.acompletion( # ADDS TO QUEUE + POLLS + MAKES CALL
        model="{{openai_small}}",
        messages=[{"role": "user", "content": "Hey!"}],
        priority=0, # LOWER IS BETTER
    )
except Exception as e:
    print("didn't make request")
```

## LiteLLM Proxy {#litellm-proxy}

若要在 LiteLLM Proxy 上優先處理請求，請將 `priority` 加入請求中。

<Tabs>
<TabItem value="curl" label="curl">

```curl 
curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "model": "{{openai_small}}-fake-model",
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe? 1234"
        }],
    "priority": 0 SET VALUE HERE
}'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="{{openai_small}}",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ 
        "priority": 0 # SET VALUE HERE
    }
)

print(response)
```

</TabItem>
</Tabs>

### Priority 標頭 {#priority-header}

將 `x-litellm-priority` 標頭設為整數，即可設定 scheduler 的請求佇列優先順序，適合比起 body 欄位更容易新增標頭的用戶端。數值越小，優先順序越高。標頭會覆寫 body 的 `priority` 值；若值不是整數，會得到與錯誤的 body `priority` 相同的 400 錯誤。空的標頭視為未設定。開啟 `drop_params` 時，非整數的標頭值會被忽略，改為套用 body 的 `priority` 或 `default_priority`。 <SinceVersion v="1.109.0" />

當 router 處理請求時，proxy 會在 chat completions 與 text completions 路由上讀取此標頭，例如 `/v1/chat/completions`、`/v1/completions`，以及 Azure 風格的 `/openai/deployments/{model}/chat/completions`。它也會在 `/queue/chat/completions` 上讀取此標頭。其他路由，例如 `/v1/responses`、`/v1/messages`、`/v1/embeddings` 與 `/cursor/chat/completions`，會忽略此標頭；以 `litellm --model` 啟動且沒有設定的 proxy 也一樣。

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'x-litellm-priority: 0' \
-d '{
    "model": "{{openai_small}}",
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe?"
        }],
    "priority": 5
}'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://localhost:4000/v1"
)

response = client.chat.completions.create(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Write a short poem"}],
    extra_headers={"x-litellm-priority": "0"},
)

print(response)
```

</TabItem>
</Tabs>

回應也可以帶有一個名為 `x-litellm-priority` 的標頭。在 `/queue/chat/completions` 上，它保存的是請求被排入佇列時的優先順序。開啟 dynamic rate limiter 時，每個非串流回應（包含 429）都會帶有該金鑰的優先順序層級，例如 `premium` 或 `default`。該層級來自金鑰中繼資料的 `priority`，與此 scheduler 佇列優先順序是分開的，因此請勿將它作為請求標頭回傳。

## 進階 - Redis 快取  {#advanced---redis-caching}

使用 redis 快取，可在 LiteLLM 的多個執行個體之間進行請求優先順序處理。 

### SDK {#sdk}
```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "{{openai_small}}",
            "litellm_params": {
                "model": "{{openai_small}}",
                "mock_response": "Hello world this is Macintosh!", # fakes the LLM API call
                "rpm": 1,
            },
        },
    ],
    ### REDIS PARAMS ###
    redis_host=os.environ["REDIS_HOST"], 
    redis_password=os.environ["REDIS_PASSWORD"], 
    redis_port=os.environ["REDIS_PORT"], 
)

try:
    _response = await router.acompletion( # ADDS TO QUEUE + POLLS + MAKES CALL
        model="{{openai_small}}",
        messages=[{"role": "user", "content": "Hey!"}],
        priority=0, # LOWER IS BETTER
    )
except Exception as e:
    print("didn't make request")
```

### PROXY {#proxy}

```yaml
model_list:
    - model_name: {{openai_small}}-fake-model
      litellm_params:
        model: {{openai_small}}
        mock_response: "hello world!" 
        api_key: my-good-key

litellm_settings:
    request_timeout: 600 # Will keep retrying until timeout occurs

router_settings:
    redis_host: os.environ/REDIS_HOST
    redis_password: os.environ/REDIS_PASSWORD
    redis_port: os.environ/REDIS_PORT
```

```bash
$ litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000s
```

```bash
curl -X POST 'http://localhost:4000/queue/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-D '{
    "model": "{{openai_small}}-fake-model",
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe? 1234"
        }],
    "priority": 0 SET VALUE HERE
}'
```
