import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 逾時 {#timeouts}

在 router 中設定的逾時是針對整個呼叫的完整長度，且也會傳遞到 completion() 呼叫層級。 

### 全域逾時 {#global-timeouts}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

model_list = [{...}]

router = Router(model_list=model_list, 
                timeout=30) # raise timeout error if call takes > 30s 

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
router_settings:
    timeout: 30 # sets a 30s timeout for the entire call
```

**啟動 Proxy** 

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>
</Tabs>

### 自訂逾時與串流逾時（每個模型） {#custom-timeouts--stream-timeouts-per-model}

對於每個模型，您可以在 `litellm_params` 下設定 `timeout` 和 `stream_timeout`：

- **`timeout`** → 完整回應的最長時間。  
  用於限制長時間執行的 completions。

- **`stream_timeout`** → 在串流回應中等待第一個區塊（亦即第一個 token）的最長時間。  
  用於中止「卡住」的提供者（例如 Bedrock 啟動緩慢），並重試另一個模型。
<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 
import asyncio

model_list = [{
    "model_name": "gpt-3.5-turbo",
    "litellm_params": {
        "model": "azure/chatgpt-v-2",
        "api_key": os.getenv("AZURE_API_KEY"),
        "api_version": os.getenv("AZURE_API_VERSION"),
        "api_base": os.getenv("AZURE_API_BASE"),
        "timeout": 300 # sets a 5 minute timeout
        "stream_timeout": 30 # sets a 30s timeout for streaming calls
    }
}]

# init router
router = Router(model_list=model_list, routing_strategy="least-busy")
async def router_acompletion():
    response = await router.acompletion(
        model="gpt-3.5-turbo", 
        messages=[{"role": "user", "content": "Hey, how's it going?"}]
    )
    print(response)
    return response

asyncio.run(router_acompletion())
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-small-eu
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: <your-key>
      timeout: 0.1                      # timeout in (seconds)
      stream_timeout: 0.01              # timeout for stream requests (seconds)
      max_retries: 5
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-small-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: 
      timeout: 0.1                      # timeout in (seconds)
      stream_timeout: 0.01              # timeout for stream requests (seconds)
      max_retries: 5

```


**啟動 Proxy**

```shell
$ litellm --config /path/to/config.yaml
```


</TabItem>
</Tabs>

### 設定動態逾時 - 每個請求 {#setting-dynamic-timeouts---per-request}

LiteLLM 支援針對每個請求設定 `timeout` 

**使用範例**
<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

model_list = [{...}]
router = Router(model_list=model_list)

response = router.completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "what color is red"}],
    timeout=1
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
     --header 'Content-Type: application/json' \
     --data-raw '{
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": "what color is red"}
        ],
        "logit_bias": {12481: 100},
        "timeout": 1
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
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "what color is red"}
    ],
    logit_bias={12481: 100},
    extra_body={"timeout": 1} # 👈 KEY CHANGE
)

print(response)
```
</TabItem>
</Tabs>

</TabItem>
</Tabs>

## 測試逾時處理  {#testing-timeout-handling}

若要測試您的 retry/fallback 邏輯是否能處理逾時，您可以將 `mock_timeout=True` 設為測試用途。 

目前僅支援 `/chat/completions` 和 `/completions` 端點。若您需要其他端點支援，請[告訴我們](https://github.com/BerriAI/litellm/issues)。 

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer sk-1234' \
    --data-raw '{
        "model": "gemini/gemini-1.5-flash",
        "messages": [
        {"role": "user", "content": "hi my email is ishaan@berri.ai"}
        ],
        "mock_timeout": true # 👈 KEY CHANGE
    }'
```
