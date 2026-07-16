---
title: "備援（提供者故障轉移）"
description: "在 LiteLLM 中設定自動提供者故障轉移。若模型或提供者在 num_retries 後失敗，則備援到另一個模型群組，以達到高可用性與可靠性。"
keywords:
  [
    備援,
    故障轉移,
    提供者故障轉移,
    模型故障轉移,
    自動故障轉移,
    高可用性,
    可靠性,
    重試,
    備用模型,
    跨提供者故障轉移,
  ]
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 備援（提供者故障轉移） {#fallbacks-provider-failover}

備援是 LiteLLM 執行自動 **故障轉移** 的方式。若請求在 num_retries 之後失敗，LiteLLM 會備援到另一個模型群組，讓失敗的模型或提供者自動故障轉移到健康的備用項目。如果您正在尋找「provider failover」或「model failover」，就是這一頁。 

- 快速開始 [load balancing](./load_balancing.md)
- 快速開始 [用戶端端備援](#client-side-fallbacks)

備援通常是從一個 `model_name` 到另一個 `model_name`。 

## 快速開始  {#quick-start}

### 1. 設定備援 {#1-setup-fallbacks}

關鍵變更： 

```python
fallbacks=[{"gpt-3.5-turbo": ["gpt-4"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 
router = Router(
  model_list=[
    {
      "model_name": "gpt-3.5-turbo",
      "litellm_params": {
        "model": "azure/<your-deployment-name>",
        "api_base": "<your-azure-endpoint>",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    },
    {
      "model_name": "gpt-4",
      "litellm_params": {
        "model": "azure/gpt-4-ca",
        "api_base": "https://my-endpoint-canada-berri992.openai.azure.com/",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    }
  ],
  fallbacks=[{"gpt-3.5-turbo": ["gpt-4"]}] # 👈 KEY CHANGE
)

```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6

router_settings:
  fallbacks: [{"gpt-3.5-turbo": ["gpt-4"]}]
```


</TabItem>
</Tabs>

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試備援 {#3-test-fallbacks}

在請求本文中傳入 `mock_testing_fallbacks=true`，以觸發備援。

<Tabs>
<TabItem value="sdk" label="SDK">

```python

from litellm import Router

model_list = [{..}, {..}] # defined in Step 1.

router = Router(model_list=model_list, fallbacks=[{"bad-model": ["my-good-model"]}])

response = router.completion(
  model="bad-model",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
  mock_testing_fallbacks=True,
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "my-bad-model",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
  "mock_testing_fallbacks": true # 👈 KEY CHANGE
}
'
```

</TabItem>
</Tabs>

### 說明 {#explanation}

備援會依序執行 - ["gpt-3.5-turbo, "gpt-4", "gpt-4-32k"]，會先使用 'gpt-3.5-turbo'，再使用 'gpt-4'，依此類推。

您也可以設定 [`default_fallbacks`](#default-fallbacks)，以防某個特定模型群組設定錯誤／有問題。

備援有 3 種類型： 
- `content_policy_fallbacks`：適用於 litellm.ContentPolicyViolationError - LiteLLM 會跨提供者對應內容政策違規錯誤 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8495C27-L8495C54)
- `context_window_fallbacks`：適用於 litellm.ContextWindowExceededErrors - LiteLLM 會跨提供者對應上下文視窗錯誤訊息 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8469)
- `fallbacks`：適用於其餘所有錯誤 - 例如 litellm.RateLimitError

## 用戶端端備援 {#client-side-fallbacks}

在 SDK 與 proxy 的用戶端端，於 `.completion()` 呼叫中設定備援。 

在此請求中會發生以下情況：
1. 對 `model="zephyr-beta"` 的請求會失敗
2. litellm proxy 會依序遍歷 `fallbacks=["gpt-3.5-turbo"]` 中指定的所有 model_groups
3. 對 `model="gpt-3.5-turbo"` 的請求會成功，而發出請求的用戶端會收到來自 gpt-3.5-turbo 的回應 

👉 關鍵變更： `"fallbacks": ["gpt-3.5-turbo"]`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(model_list=[..]) # defined in Step 1.

resp = router.completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hey, how's it going?"}],
    mock_testing_fallbacks=True, # 👈 trigger fallbacks
    fallbacks=[
        {
            "model": "claude-3-haiku",
            "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        }
    ],
)

print(resp)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="zephyr-beta",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={
        "fallbacks": ["gpt-3.5-turbo"]
    }
)

print(response)
```
</TabItem>

<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "zephyr-beta"",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "fallbacks": ["gpt-3.5-turbo"]
}'
```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage
import os 

os.environ["OPENAI_API_KEY"] = "anything"

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    model="zephyr-beta",
    extra_body={
        "fallbacks": ["gpt-3.5-turbo"]
    }
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```

</TabItem>

</Tabs>
</TabItem>

</Tabs>

### 控制備援提示詞   {#control-fallback-prompts}

在備援中，針對每個模型傳入 messages/temperature/etc.（也適用於 embedding/image generation/etc.）。

關鍵變更：

```
fallbacks = [
  {
    "model": <model_name>,
    "messages": <model-specific-messages>
    ... # any other model-specific parameters
  }
]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(model_list=[..]) # defined in Step 1.

resp = router.completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hey, how's it going?"}],
    mock_testing_fallbacks=True, # 👈 trigger fallbacks
    fallbacks=[
        {
            "model": "claude-3-haiku",
            "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        }
    ],
)

print(resp)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="zephyr-beta",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={
      "fallbacks": [{
          "model": "claude-3-haiku",
          "messages": [{"role": "user", "content": "What is LiteLLM?"}]
      }]
    }
)

print(response)
```
</TabItem>

<TabItem value="Curl" label="Curl Request">

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Hi, how are you ?"
          }
        ]
      }
    ],
    "fallbacks": [{
        "model": "claude-3-haiku",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}]
    }],
    "mock_testing_fallbacks": true
}'
```

</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage
import os 

os.environ["OPENAI_API_KEY"] = "anything"

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    model="zephyr-beta",
    extra_body={
      "fallbacks": [{
          "model": "claude-3-haiku",
          "messages": [{"role": "user", "content": "What is LiteLLM?"}]
      }]
    }
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```

</TabItem>

</Tabs>

</TabItem>
</Tabs>

## 內容政策違規備援 {#content-policy-violation-fallback}

關鍵變更： 

```python
content_policy_fallbacks=[{"claude-2": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "claude-2",
      "litellm_params": {
        "model": "claude-2",
        "api_key": "",
        "mock_response": Exception("content filtering policy"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "claude-2",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  content_policy_fallbacks=[{"claude-2": ["my-fallback-model"]}], # 👈 KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # context_window_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="claude-2",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行 👇

```yaml
router_settings:
  content_policy_fallbacks=[{"claude-2": ["my-fallback-model"]}]
```

啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

## 上下文視窗超出備援 {#context-window-exceeded-fallback}

關鍵變更： 

```python
context_window_fallbacks=[{"claude-2": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "claude-2",
      "litellm_params": {
        "model": "claude-2",
        "api_key": "",
        "mock_response": Exception("prompt is too long"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "claude-2",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  context_window_fallbacks=[{"claude-2": ["my-fallback-model"]}], # 👈 KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # content_policy_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="claude-2",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行 👇

```yaml
router_settings:
  context_window_fallbacks=[{"claude-2": ["my-fallback-model"]}]
```

啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

## 進階 {#advanced}
### 備援 + 重試 + 逾時 + 冷卻期 {#fallbacks--retries--timeouts--cooldowns}

設定備援，只要這樣做： 

```
litellm_settings:
  fallbacks: [{"zephyr-beta": ["gpt-3.5-turbo"]}] 
```

**涵蓋所有錯誤（429、500 等）**

**透過 config 設定**
```yaml
model_list:
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8001
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8002
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8003
  - model_name: gpt-3.5-turbo
    litellm_params:
        model: gpt-3.5-turbo
        api_key: <my-openai-key>
  - model_name: gpt-3.5-turbo-16k
    litellm_params:
        model: gpt-3.5-turbo-16k
        api_key: <my-openai-key>

litellm_settings:
  num_retries: 3 # retry call 3 times on each model_name (e.g. zephyr-beta)
  request_timeout: 10 # raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout 
  fallbacks: [{"zephyr-beta": ["gpt-3.5-turbo"]}] # fallback to gpt-3.5-turbo if call fails num_retries 
  allowed_fails: 3 # cooldown model if it fails > 1 call in a minute. 
  cooldown_time: 30 # how long to cooldown model if fails/min > allowed_fails
```

### 備援到特定模型 ID {#fallback-to-specific-model-id}

如果某個群組中的所有模型都在冷卻期（例如受速率限制），LiteLLM 會備援到具有特定模型 ID 的模型。

這會略過該備援模型的任何冷卻期檢查。

1. 在 `model_info` 中指定模型 ID
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
    model_info:
      id: my-specific-model-id # 👈 KEY CHANGE
  - model_name: gpt-4
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY
```

**注意：** 這只會備援到具有特定模型 ID 的模型。如果您想備援到另一個模型群組，可以設定 `fallbacks=[{"gpt-4": ["anthropic-claude"]}]`

2. 在 config 中設定備援

```yaml
litellm_settings:
  fallbacks: [{"gpt-4": ["my-specific-model-id"]}]
```

3. 測試看看！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
  "mock_testing_fallbacks": true
}'
```

透過檢查回應標頭 `x-litellm-model-id` 來驗證是否可正常運作

```bash
x-litellm-model-id: my-specific-model-id
```

### 測試備援！  {#test-fallbacks}

檢查您的備援是否如預期運作。 

#### **一般備援** {#regular-fallbacks}
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "my-bad-model",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
  "mock_testing_fallbacks": true # 👈 KEY CHANGE
}
'
```


#### **內容政策備援** {#content-policy-fallbacks}
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "my-bad-model",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
  "mock_testing_content_policy_fallbacks": true # 👈 KEY CHANGE
}
'
```

#### **上下文視窗備援** {#context-window-fallbacks}

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "my-bad-model",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
  "mock_testing_context_window_fallbacks": true # 👈 KEY CHANGE
}
'
```


### 上下文視窗備援（呼叫前檢查 + 備援） {#context-window-fallbacks-pre-call-checks--fallbacks}

**在發出呼叫之前**，使用 **`enable_pre_call_checks: true`** 檢查請求是否在模型上下文視窗內。

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/c9e6b05cfb20dfb17272218e2555d6b496c47f6f/litellm/router.py#L2163)

:::important
**`enable_pre_call_checks` 是必要的**，才能強制執行上下文視窗。若沒有它，不論輸入 token 數量多少，請求都會送到提供者。請在您的設定中的 `router_settings` 設定 `enable_pre_call_checks: true`。
:::

#### 每個 deployment 自訂 max_input_tokens {#custom-max_input_tokens-per-deployment}

您可以在 `model_info` 中設定 `max_input_tokens`，以覆寫某個 deployment 的預設上下文限制。這對測試、對長提示詞做速率限制，或強制比提供者預設值更嚴格的限制都很有用。

以下 **兩者都** 必須具備：

1. **`router_settings.enable_pre_call_checks: true`** — 啟用呼叫前檢查
2. deployment 上的 **`model_info.max_input_tokens`** — 覆寫該模型的限制

```yaml
router_settings:
  enable_pre_call_checks: true  # Required for enforcement

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      max_input_tokens: 10  # Override: reject prompts > 10 tokens
```

如果請求超過限制，LiteLLM 會拋出 `ContextWindowExceededError`，並帶有如 `Model=gpt-4o, Max Input Tokens=10, Got=306` 之類的詳細資訊。

**1. 設定 config**

針對 azure deployments，請設定 base model。請從 [這份清單](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中選擇 base model，所有 azure models 都以 azure/ 開頭。

<Tabs>
<TabItem value="same-group" label="Same Group">

使用較小上下文視窗過濾較舊的模型實例（例如 gpt-3.5-turbo）

```yaml
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
    model: azure/chatgpt-v-2
    api_base: os.environ/AZURE_API_BASE
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-07-01-preview"
    model_info:
    base_model: azure/gpt-4-1106-preview # 2. 👈 (azure-only) SET BASE MODEL

  - model_name: gpt-3.5-turbo
    litellm_params:
    model: gpt-3.5-turbo-1106
    api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試看看！**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 5000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
      {"role": "system", "content": text},
      {"role": "user", "content": "Who was Alexander?"},
    ],
)

print(response)
```

</TabItem>

<TabItem value="different-group" label="Context Window Fallbacks (Different Groups)">

如果目前模型太小，則備援到更大的模型。

```yaml
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
  - model_name: gpt-3.5-turbo-small
    litellm_params:
    model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
      model_info:
      base_model: azure/gpt-4-1106-preview # 2. 👈 (azure-only) SET BASE MODEL

  - model_name: gpt-3.5-turbo-large
    litellm_params:
      model: gpt-3.5-turbo-1106
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-opus
    litellm_params:
      model: claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  context_window_fallbacks: [{"gpt-3.5-turbo-small": ["gpt-3.5-turbo-large", "claude-opus"]}]
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試看看！**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 5000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
      {"role": "system", "content": text},
      {"role": "user", "content": "Who was Alexander?"},
    ],
)

print(response)
```

</TabItem>
</Tabs>

### 內容政策備援 {#content-policy-fallbacks-1}

如果遇到內容政策違規錯誤，則跨提供者備援（例如從 Azure OpenAI 備援到 Anthropic）。 

```yaml
model_list:
  - model_name: gpt-3.5-turbo-small
    litellm_params:
    model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: claude-3-opus-20240229
        api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  content_policy_fallbacks: [{"gpt-3.5-turbo-small": ["claude-opus"]}]
```


### 預設備援  {#default-fallbacks}

您也可以設定 default_fallbacks，以防某個特定模型群組設定錯誤／有問題。

```yaml
model_list:
  - model_name: gpt-3.5-turbo-small
    litellm_params:
    model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: claude-3-opus-20240229
        api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  default_fallbacks: ["claude-opus"]
```

這會在任何模型失敗時預設使用 claude-opus。

特定模型的備援（例如 `{"gpt-3.5-turbo-small": ["claude-opus"]}`）會覆寫預設備援。

### EU 區域篩選（呼叫前檢查） {#eu-region-filtering-pre-call-checks}

**在發出呼叫之前**，使用 **`enable_pre_call_checks: true`** 檢查請求是否在模型上下文視窗內。

設定 deployment 的 'region_name'。

**注意：** LiteLLM 可根據您的 litellm 參數，自動推斷 Vertex AI、Bedrock 和 IBM WatsonxAI 的 region_name。對於 Azure，請設定 `litellm.enable_preview = True`。

**1. 設定設定**

```yaml
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
- model_name: gpt-3.5-turbo
  litellm_params:
    model: azure/chatgpt-v-2
    api_base: os.environ/AZURE_API_BASE
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-07-01-preview"
    region_name: "eu" # 👈 SET EU-REGION

- model_name: gpt-3.5-turbo
  litellm_params:
    model: gpt-3.5-turbo-1106
    api_key: os.environ/OPENAI_API_KEY

- model_name: gemini-pro
  litellm_params:
    model: vertex_ai/gemini-pro-1.5
    vertex_project: adroit-crow-1234
    vertex_location: us-east1 # 👈 AUTOMATICALLY INFERS 'region_name'
```

**2. 啟動代理伺服器**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試它！**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.with_raw_response.create(
    model="gpt-3.5-turbo",
    messages = [{"role": "user", "content": "Who was Alexander?"}]
)

print(response)

print(f"response.headers.get('x-litellm-model-api-base')")
```

### 為萬用字元模型設定備援 {#setting-fallbacks-for-wildcard-models}

您可以在設定檔中為萬用字元模型（例如 `azure/*`）設定備援。

1. 設定設定
```yaml
model_list:
  - model_name: "gpt-4o"
    litellm_params:
      model: "openai/gpt-4o"
      api_key: os.environ/OPENAI_API_KEY
  - model_name: "azure/*"
    litellm_params:
      model: "azure/*"
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

litellm_settings:
  fallbacks: [{"gpt-4o": ["azure/gpt-4o"]}]
```

2. 啟動代理伺服器
```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [    
          {
            "type": "text",
            "text": "what color is red"
          }
        ]
      }
    ],
    "max_tokens": 300,
    "mock_testing_fallbacks": true
}'
```

### 停用備援（每次請求/金鑰） {#disable-fallbacks-per-requestkey}

<Tabs>

<TabItem value="request" label="每次請求">

您可以在請求本文中設定 `disable_fallbacks: true`，以按金鑰停用備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": "List 5 important events in the XIX century"
        }
    ],
    "model": "gpt-3.5-turbo",
    "disable_fallbacks": true # 👈 DISABLE FALLBACKS
}'
```

</TabItem>

<TabItem value="key" label="每個金鑰">

您可以在金鑰中繼資料中設定 `disable_fallbacks: true`，以按金鑰停用備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "disable_fallbacks": true
    }
}'
```

</TabItem>
</Tabs>
