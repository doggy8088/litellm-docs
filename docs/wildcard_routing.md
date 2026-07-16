import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 依提供者的萬用字元路由  {#provider-specific-wildcard-routing}

**代理來自提供者的所有模型**

如果您想要**代理來自特定提供者的所有模型，而不在 config.yaml 中定義它們**，請使用此功能

## 步驟 1. 定義依提供者的路由  {#step-1-define-provider-specific-routing}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "anthropic/*",
            "litellm_params": {
                "model": "anthropic/*",
                "api_key": os.environ["ANTHROPIC_API_KEY"]
            }
        }, 
        {
            "model_name": "groq/*",
            "litellm_params": {
                "model": "groq/*",
                "api_key": os.environ["GROQ_API_KEY"]
            }
        }, 
        {
            "model_name": "fo::*:static::*", # all requests matching this pattern will be routed to this deployment, example: model="fo::hi::static::hi" will be routed to deployment: "openai/fo::*:static::*"
            "litellm_params": {
                "model": "openai/fo::*:static::*",
                "api_key": os.environ["OPENAI_API_KEY"]
            }
        }
    ]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**步驟 1** - 在 config.yaml 上定義依提供者的路由
```yaml
model_list:
  # provider specific wildcard routing
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: "groq/*"
    litellm_params:
      model: "groq/*"
      api_key: os.environ/GROQ_API_KEY
  - model_name: "fo::*:static::*" # all requests matching this pattern will be routed to this deployment, example: model="fo::hi::static::hi" will be routed to deployment: "openai/fo::*:static::*"
    litellm_params:
      model: "openai/fo::*:static::*"
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
</Tabs>

## [僅限 PROXY] 步驟 2 - 執行 litellm proxy  {#proxy-only-step-2---run-litellm-proxy}

```shell
$ litellm --config /path/to/config.yaml
```

## 步驟 3 - 測試它  {#step-3---test-it}

<Tabs>  
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(model_list=...)

# Test with `anthropic/` - all models with `anthropic/` prefix will get routed to `anthropic/*`
resp = completion(model="anthropic/claude-3-sonnet-20240229", messages=[{"role": "user", "content": "Hello, Claude!"}])
print(resp)

# Test with `groq/` - all models with `groq/` prefix will get routed to `groq/*`
resp = completion(model="groq/llama3-8b-8192", messages=[{"role": "user", "content": "Hello, Groq!"}])
print(resp)

# Test with `fo::*::static::*` - all requests matching this pattern will be routed to `openai/fo::*:static::*`
resp = completion(model="fo::hi::static::hi", messages=[{"role": "user", "content": "Hello, Claude!"}])
print(resp)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

使用 `anthropic/` 進行測試 - 所有帶有 `anthropic/` 前綴的模型都會被路由到 `anthropic/*`
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "anthropic/claude-3-sonnet-20240229",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

使用 `groq/` 進行測試 - 所有帶有 `groq/` 前綴的模型都會被路由到 `groq/*`
```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "groq/llama3-8b-8192",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

使用 `fo::*::static::*` 進行測試 - 所有符合此模式的請求都會被路由到 `openai/fo::*:static::*`
```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "fo::hi::static::hi",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

</TabItem>
</Tabs>

## [[僅限 PROXY] 控制萬用字元模型存取](./proxy/model_access#-control-access-on-wildcard-models) {#proxy-only-control-wildcard-model-accessproxymodel_access-control-access-on-wildcard-models}
