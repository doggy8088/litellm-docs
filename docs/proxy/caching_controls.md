---
title: Cache Controls
description: 控制 LiteLLM proxy 快取哪些內容以及快取多久，可依請求、依虛擬金鑰，或由 proxy 全域控制。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快取控制 {#cache-controls}

一旦啟用快取，就會套用到每一種支援的呼叫類型。本頁說明如何縮小範圍：可在每個
請求中使用 body 內的 `cache` 物件、透過金鑰中繼資料依虛擬金鑰設定，或透過
`cache_params` 進行 proxy 全域設定。

## 動態快取控制 {#dynamic-cache-controls}

| 參數   | 類型             | 說明                                                                       |
| ----------- | ---------------- | --------------------------------------------------------------------------------- |
| `ttl`       | _Optional(int)_  | 會將回應快取使用者定義的時間長度（以秒為單位）          |
| `s-maxage`  | _Optional(int)_  | 只會接受在使用者定義範圍內（以秒為單位）的快取回應 |
| `no-cache`  | _Optional(bool)_ | 不會將回應儲存在快取中。                                             |
| `no-store`  | _Optional(bool)_ | 不會快取回應                                                       |
| `namespace` | _Optional(str)_  | 會將回應快取在使用者定義的命名空間下                            |

每個快取參數都可以依請求層級控制。以下是每個參數的範例：

### `ttl` {#ttl}

設定回應快取的時間長度（以秒為單位）。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="{{openai_small}}",
    extra_body={
        "cache": {
            "ttl": 300  # Cache response for 5 minutes
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"ttl": 300},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `s-maxage` {#s-maxage}

只接受在指定年齡內（以秒為單位）的快取回應。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="{{openai_small}}",
    extra_body={
        "cache": {
            "s-maxage": 600  # Only use cache if less than 10 minutes old
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"s-maxage": 600},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `no-cache` {#no-cache}

強制取得新的回應，略過快取。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="{{openai_small}}",
    extra_body={
        "cache": {
            "no-cache": True  # Skip cache check, get fresh response
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"no-cache": true},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `no-store` {#no-store}

不會將回應儲存在快取中。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="{{openai_small}}",
    extra_body={
        "cache": {
            "no-store": True  # Don't cache this response
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"no-store": true},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `namespace` {#namespace}

將回應儲存在特定快取命名空間下。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="{{openai_small}}",
    extra_body={
        "cache": {
            "namespace": "my-custom-namespace"  # Store in custom namespace
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"namespace": "my-custom-namespace"},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

## 依金鑰的快取控制 {#per-key-cache-controls}

在虛擬金鑰的中繼資料中設定 `cache` 欄位，proxy 就會將其套用到使用該金鑰發出的每個請求，
因此用戶端無需變更。這通常是讓某一類流量排除於
快取之外，同時讓其他所有地方維持啟用的做法。

```shell
curl http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {"cache": {"no-cache": true}}
  }'
```

支援的金鑰層級快取控制：`ttl`、`s-maxage`、`no-cache`、`no-store`。

## 將快取預設關閉（僅 opt in） {#set-caching-default-off-opt-in-only}

1. **將 `mode: default_off` 設為快取**

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

# default off mode
litellm_settings:
  set_verbose: True
  cache: True
  cache_params:
    mode: default_off # 👈 Key change cache is default_off
```

2. **在快取預設關閉時 opt in 使用快取**

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
import os
from openai import OpenAI

client = OpenAI(api_key="<litellm-api-key>", base_url="http://0.0.0.0:4000")

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say this is a test",
        }
    ],
    model="{{openai_small}}",
    extra_body = {        # OpenAI python accepts extra args in extra_body
        "cache": {"use-cache": True}
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "cache": {"use-cache": True}
    "messages": [
      {"role": "user", "content": "Say this is a test"}
    ]
  }'
```

</TabItem>

</Tabs>

## 控制啟用快取的呼叫類型 -（`/chat/completion`、`/embeddings` 等） {#control-call-types-caching-is-on-for---chatcompletion-embeddings-etc}

預設情況下，所有呼叫類型都會啟用快取。您可以透過
在 `cache_params` 中設定 `supported_call_types`，來控制哪些呼叫類型啟用快取。

**快取只會對 `supported_call_types` 中指定的呼叫類型啟用**

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    supported_call_types:
      ["acompletion", "atext_completion", "aembedding", "atranscription", "aresponses"]
      # /chat/completions, /completions, /embeddings, /audio/transcriptions, /v1/responses
```

## 為 proxy 設定快取，但不套用於實際的 llm api 呼叫 {#set-cache-for-proxy-but-not-on-the-actual-llm-api-call}

如果您只想啟用像是速率限制與跨多個
執行個體的負載平衡等功能，請使用此項。

將 `supported_call_types: []` 設為停用實際 api 呼叫上的快取。

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    supported_call_types: []
```

## 刪除快取鍵 - `/cache/delete` {#deleting-cache-keys---cachedelete}

若要刪除快取鍵，請將請求送到 `/cache/delete`，並帶上您要刪除的 `keys`

範例

```shell
curl -X POST "http://0.0.0.0:4000/cache/delete" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{"keys": ["586bf3f3c1bf5aecb55bd9996494d3bbc69eb58397163add6d49537762a7548d", "key2"]}'
```

```shell
# {"status":"success"}
```

### 檢視回應中的快取鍵 {#viewing-cache-keys-from-responses}

您可以在回應標頭中查看 cache_key；在快取命中時，快取鍵會以
`x-litellm-cache-key` 回應標頭送出

```shell
curl -i --location 'http://0.0.0.0:4000/chat/completions' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "{{openai_small}}",
    "user": "ishan",
    "messages": [
        {
        "role": "user",
        "content": "what is litellm"
        }
    ],
}'
```

來自 litellm proxy 的回應

```text
date: Thu, 04 Apr 2024 17:37:21 GMT
content-type: application/json
x-litellm-cache-key: 586bf3f3c1bf5aecb55bd9996494d3bbc69eb58397163add6d49537762a7548d

{
    "id": "chatcmpl-9ALJTzsBlXR9zTxPvzfFFtFbFtG6T",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "I'm sorr.."
                "role": "assistant"
            }
        }
    ],
    "created": 1712252235,
}

```

## 提供者特定的選用參數快取 {#provider-specific-optional-parameters-caching}

預設情況下，LiteLLM 只會將標準 OpenAI 參數納入快取鍵。不過，有些提供者（例如 Vertex AI）會使用會影響輸出的額外參數，但這些參數不包含在標準快取鍵產生中。

### 啟用提供者特定參數快取 {#enable-provider-specific-parameter-caching}

將此設定加入您的 `config.yaml`，以便將提供者特定的選用參數納入快取鍵：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: "redis"
  enable_caching_on_provider_specific_optional_params: True  # Include provider-specific params in cache keys
```
