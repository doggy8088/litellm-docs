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
            "model_name": "gpt-3.5-turbo",
            "litellm_params": {
                "model": "gpt-3.5-turbo",
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
    _response = await router.acompletion( # 👈 ADDS TO QUEUE + POLLS + MAKES CALL
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hey!"}],
        priority=0, # 👈 LOWER IS BETTER
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
-H 'Authorization: Bearer sk-1234' \
-D '{
    "model": "gpt-3.5-turbo-fake-model",
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe? 1234"
        }],
    "priority": 0 👈 SET VALUE HERE
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
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ 
        "priority": 0 👈 SET VALUE HERE
    }
)

print(response)
```

</TabItem>
</Tabs>

## 進階 - Redis 快取  {#advanced---redis-caching}

使用 redis 快取，可在 LiteLLM 的多個執行個體之間進行請求優先順序處理。 

### SDK {#sdk}
```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "gpt-3.5-turbo",
            "litellm_params": {
                "model": "gpt-3.5-turbo",
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
    _response = await router.acompletion( # 👈 ADDS TO QUEUE + POLLS + MAKES CALL
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hey!"}],
        priority=0, # 👈 LOWER IS BETTER
    )
except Exception as e:
    print("didn't make request")
```

### PROXY {#proxy}

```yaml
model_list:
    - model_name: gpt-3.5-turbo-fake-model
      litellm_params:
        model: gpt-3.5-turbo
        mock_response: "hello world!" 
        api_key: my-good-key

litellm_settings:
    request_timeout: 600 # 👈 Will keep retrying until timeout occurs

router_settings:
    redis_host; os.environ/REDIS_HOST
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
-H 'Authorization: Bearer sk-1234' \
-D '{
    "model": "gpt-3.5-turbo-fake-model",
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe? 1234"
        }],
    "priority": 0 👈 SET VALUE HERE
}'
```
