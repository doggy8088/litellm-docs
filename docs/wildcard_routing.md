---
sidebar_label: "Wildcard Routing"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 依提供者的萬用字元路由  {#provider-specific-wildcard-routing}

**代理來自提供者的所有模型**

如果您想要**代理來自特定提供者的所有模型，而不在 config.yaml 中定義它們**，請使用此功能

對於像 `claude-newfamily-5` 這樣新的裸模型 ID，[備援歸納](./fallback_generalizations.md) 可以推斷虛擬金鑰的 `provider/*` 存取檢查所使用的提供者。路由規則不會新增定價，也不會繞過金鑰權限。

## 步驟 1. 定義依提供者的路由  {#step-1-define-provider-specific-routing}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
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
resp = router.completion(model="anthropic/{{anthropic}}", messages=[{"role": "user", "content": "Hello, Claude!"}])
print(resp)

# Test with `groq/` - all models with `groq/` prefix will get routed to `groq/*`
resp = router.completion(model="groq/llama3-8b-8192", messages=[{"role": "user", "content": "Hello, Groq!"}])
print(resp)

# Test with `fo::*::static::*` - all requests matching this pattern will be routed to `openai/fo::*:static::*`
resp = router.completion(model="fo::hi::static::hi", messages=[{"role": "user", "content": "Hello, Claude!"}])
print(resp)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

使用 `anthropic/` 進行測試 - 所有帶有 `anthropic/` 前綴的模型都會被路由到 `anthropic/*`
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "anthropic/{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

使用 `groq/` 進行測試 - 所有帶有 `groq/` 前綴的模型都會被路由到 `groq/*`
```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "fo::hi::static::hi",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

</TabItem>
</Tabs>

## [[僅限 PROXY] 控制萬用字元模型存取](/docs/proxy/model_access#advanced-model-access-groups) {#proxy-only-team-scoped-wildcards-take-precedence}

## [僅限 PROXY] 團隊範圍的萬用字元優先 {#proxy-only-control-wildcard-model-accessdocsproxymodel_accessadvanced-model-access-groups}

團隊可以[新增自己的萬用字元部署](/docs/proxy/team_model_add)並使用自己的憑證，讓該團隊的金鑰使用團隊的提供者帳戶。當同時存在相同模式的全 proxy 萬用字元時，團隊的部署會服務該團隊的金鑰，全 proxy 的部署則服務所有其他金鑰。兩者永遠不會一起做負載平衡，而沒有自己對應萬用字元的團隊會落回使用全 proxy 的那個。

```yaml
model_list:
  # Proxy-wide: serves keys that have no team-scoped openrouter/* deployment
  - model_name: openrouter/*
    litellm_params:
      model: openrouter/*
      api_key: os.environ/SHARED_OPENROUTER_API_KEY
```

```bash
# Team-scoped: serves keys that belong to this team, with the team's own credentials
curl -X POST 'http://0.0.0.0:4000/model/new' \
  -H 'Authorization: Bearer $LITELLM_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model_name": "openrouter/*",
    "litellm_params": {"model": "openrouter/*", "api_key": "<team-openrouter-key>"},
    "model_info": {"team_id": "<team-id>"}
  }'
```

`x-litellm-model-id` 回應標頭會指出服務某個請求的部署，因此使用團隊金鑰的呼叫會回傳團隊部署的 id，使用任何其他金鑰的呼叫則會回傳全 proxy 部署的 id。
