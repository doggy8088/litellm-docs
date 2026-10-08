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
fallbacks=[{"{{openai_small}}": ["{{openai_large}}"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python keep-model-ids
from litellm import Router 
router = Router(
  model_list=[
    {
      "model_name": "{{openai_small}}",
      "litellm_params": {
        "model": "azure/<your-deployment-name>",
        "api_base": "<your-azure-endpoint>",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    },
    {
      "model_name": "{{openai_large}}",
      "litellm_params": {
        "model": "azure/gpt-4-ca",
        "api_base": "https://my-endpoint-canada-berri992.openai.azure.com/",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    }
  ],
  fallbacks=[{"{{openai_small}}": ["{{openai_large}}"]}] # 👈 KEY CHANGE
)

```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml keep-model-ids
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: {{openai_large}}
    litellm_params:
      model: azure/gpt-4-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6

router_settings:
  fallbacks: [{"{{openai_small}}": ["{{openai_large}}"]}]
```


</TabItem>
</Tabs>

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試備援 {#3-test-fallbacks}

:::warning[已棄用於 Proxy 請求]
從 LiteLLM Proxy v1.85.0 起，`mock_testing_fallbacks`、`mock_testing_context_fallbacks` 和 `mock_testing_content_policy_fallbacks` 會從進入的 Proxy 請求中剝除，且不會產生任何效果。這些旗標僅在測試中針對直接的 `litellm.Router` 呼叫仍受支援。
:::

對於直接的 `Router` 測試，請傳入 `mock_testing_fallbacks=True` 以觸發備援。

<Tabs>
<TabItem value="sdk" label="SDK">

```python

from litellm import Router

model_list = [{...}, {...}] # defined in Step 1.

router = Router(model_list=model_list, fallbacks=[{"bad-model": ["my-good-model"]}])

response = router.completion(
  model="bad-model",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
  mock_testing_fallbacks=True,
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

模擬測試旗標已針對 Proxy 請求棄用。若要驗證 Proxy 備援，請在非正式環境中觸發實際的提供者錯誤，並在不帶 `mock_testing_*` 旗標的情況下送出一般請求。

</TabItem>
</Tabs>

### 說明 {#explanation}

備援會依順序執行 - ["gpt-4o-mini", "gpt-4o", "gpt-4.1"]，會先使用 'gpt-4o-mini'，接著是 'gpt-4o'，依此類推。

您也可以設定 [`default_fallbacks`](#default-fallbacks)，以防某個特定模型群組設定錯誤／有問題。

備援有 3 種類型： 
- `content_policy_fallbacks`：適用於 litellm.ContentPolicyViolationError - LiteLLM 會跨提供者對應內容政策違規錯誤 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8495C27-L8495C54)
- `context_window_fallbacks`：適用於 litellm.ContextWindowExceededErrors - LiteLLM 會跨提供者對應上下文視窗錯誤訊息 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8469)
- `fallbacks`：適用於其餘所有錯誤 - 例如 litellm.RateLimitError

## 用戶端端備援 {#client-side-fallbacks}

在 SDK 與 proxy 的用戶端端，於 `.completion()` 呼叫中設定備援。

在此請求中會發生以下情況：
1. 對 `model="zephyr-beta"` 的請求會失敗
2. litellm proxy 會迴圈處理 `fallbacks=["{{openai_small}}"]` 中指定的所有 model_groups
3. 對 `model="{{openai_small}}"` 的請求會成功，而發出請求的用戶端將會收到來自 gpt-5.6-luna 的回應 

👉 關鍵變更： `"fallbacks": ["{{openai_small}}"]`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(model_list=[...]) # defined in Step 1.

resp = router.completion(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Hey, how's it going?"}],
    mock_testing_fallbacks=True, # 👈 trigger fallbacks
    fallbacks=[
        {
            "model": "{{anthropic}}",
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
        "fallbacks": ["{{openai_small}}"]
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
    "model": "zephyr-beta",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "fallbacks": ["{{openai_small}}"]
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
        "fallbacks": ["{{openai_small}}"]
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

router = Router(model_list=[...]) # defined in Step 1.

resp = router.completion(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Hey, how's it going?"}],
    mock_testing_fallbacks=True, # 👈 trigger fallbacks
    fallbacks=[
        {
            "model": "{{anthropic}}",
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
          "model": "{{anthropic}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_small}}",
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
        "model": "{{anthropic}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}]
    }]
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
          "model": "{{anthropic}}",
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
content_policy_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "{{anthropic}}",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": Exception("content filtering policy"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  content_policy_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}], # 👈 KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # context_window_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="{{anthropic}}",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行 👇

```yaml
router_settings:
  content_policy_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}]
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
context_window_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "{{anthropic}}",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": Exception("prompt is too long"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  context_window_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}], # 👈 KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # content_policy_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="{{anthropic}}",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行 👇

```yaml
router_settings:
  context_window_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}]
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
  fallbacks: [{"zephyr-beta": ["{{openai_small}}"]}] 
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
  - model_name: {{openai_small}}
    litellm_params:
        model: {{openai_small}}
        api_key: <my-openai-key>
  - model_name: {{openai_large}}
    litellm_params:
        model: {{openai_large}}
        api_key: <my-openai-key>

litellm_settings:
  num_retries: 3 # retry call 3 times on each model_name (e.g. zephyr-beta)
  request_timeout: 10 # raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout 
  fallbacks: [{"zephyr-beta": ["{{openai_small}}"]}] # fallback to {{openai_small}} if call fails num_retries 
  allowed_fails: 3 # cooldown model if it fails > 1 call in a minute. 
  cooldown_time: 30 # how long to cooldown model if fails/min > allowed_fails
```

### 備援到特定模型 ID {#fallback-to-specific-model-id}

如果某個群組中的所有模型都在冷卻期（例如受速率限制），LiteLLM 會備援到具有特定模型 ID 的模型。

這會略過該備援模型的任何冷卻期檢查。

1. 在 `model_info` 中指定模型 ID
```yaml keep-model-ids
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
    model_info:
      id: my-specific-model-id # 👈 KEY CHANGE
  - model_name: {{openai_large}}
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
```

**注意：** 這只會備援到具有特定模型 ID 的模型。如果您想備援到另一個模型群組，可以設定 `fallbacks=[{"{{openai_large}}": ["anthropic-claude"]}]`

2. 在 config 中設定備援

```yaml
litellm_settings:
  fallbacks: [{"{{openai_large}}": ["my-specific-model-id"]}]
```

3. 在主要部署不可用時進行測試。

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "{{openai_large}}",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ]
}'
```

透過檢查回應標頭 `x-litellm-model-id` 來驗證是否可正常運作

```bash
x-litellm-model-id: my-specific-model-id
```

### 測試備援！  {#test-fallbacks}

透過在非正式環境中觸發相關的提供者錯誤，確認您的備援是否如預期運作。

#### **一般備援** {#regular-fallbacks}

讓主要測試部署回傳可重試的提供者錯誤，例如速率限制或伺服器錯誤，然後送出一般請求。

#### **內容政策備援** {#content-policy-fallbacks}

使用一個會被主要提供者以內容政策錯誤拒絕的測試請求。

#### **上下文視窗備援** {#context-window-fallbacks}

啟用前置呼叫檢查，並送出一個超過主要模型已設定內容視窗的測試請求。

### 在支出記錄中追蹤備援 {#track-fallbacks-in-spend-logs}

每一筆支出記錄列都會記錄該請求是由用戶端要求的 model group 提供，還是由備援提供。Proxy 會寫入 `metadata` 欄位中的兩個鍵，位於 `LiteLLM_SpendLogs`：

| Key | Type | Description |
|-----|------|-------------|
| `attempted_fallbacks` | int | 進行的備援嘗試次數。`0` 表示所請求的 model group 提供了此請求 |
| `original_model_group` | str | 用戶端最初請求的 model group |

範例來說，對 `{{openai_small}}` 的請求若失敗並切換到 `claude-fable-5`，會產生一筆包含 `model_group=claude-fable-5`、`attempted_fallbacks=1` 和 `original_model_group={{openai_small}}` 的列，因此事後仍能區分由備援提供與直接提供的請求：

```sql
SELECT model_group,
       metadata->>'attempted_fallbacks' AS attempted_fallbacks,
       metadata->>'original_model_group' AS original_model_group
FROM "LiteLLM_SpendLogs";
```

這兩個鍵都由 Proxy 設定，並會覆寫任何用戶端提供的同名值。此功能推出前寫入的列，這兩個鍵都會顯示 `null`。

### 上下文視窗備援（呼叫前檢查 + 備援） {#context-window-fallbacks-pre-call-checks--fallbacks}

**在發出呼叫之前**，使用 **`enable_pre_call_checks: true`** 檢查請求是否在模型上下文視窗內。

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/c9e6b05cfb20dfb17272218e2555d6b496c47f6f/litellm/router.py#L2163)

:::important
**`enable_pre_call_checks` 是必要的**，才能強制執行上下文視窗。若沒有它，不論輸入 token 數量多少，請求都會送到提供者。請在您的設定中的 `enable_pre_call_checks: true` 設定 `router_settings`。
:::

#### 每個 deployment 自訂 max_input_tokens {#custom-max_input_tokens-per-deployment}

您可以在 `max_input_tokens` 中設定 `model_info`，以覆寫某個 deployment 的預設上下文限制。這對測試、對長提示詞做速率限制，或強制比提供者預設值更嚴格的限制都很有用。

以下 **兩者都** 必須具備：

1. **`router_settings.enable_pre_call_checks: true`** — 啟用前置呼叫檢查
2. **`model_info.max_input_tokens`** 在部署上，這會覆寫該模型的限制

```yaml
router_settings:
  enable_pre_call_checks: true  # Required for enforcement

model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      max_input_tokens: 10  # Override: reject prompts > 10 tokens
```

如果請求超過限制，LiteLLM 會拋出 `ContextWindowExceededError`，並帶有如 `Model={{openai_large}}, Max Input Tokens=10, Got=306` 之類的詳細資訊。

**1. 設定 config**

針對 azure deployments，請設定 base model。請從 [這份清單](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中選擇 base model，所有 azure models 都以 azure/ 開頭。

<Tabs>
<TabItem value="same-group" label="Same Group">

以較小內容視窗篩選模型的實例（例如 gpt-4o-mini）

此範例中的 model ids 僅供說明，並保留其內容視窗大小。

```yaml keep-model-ids
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
  - model_name: gpt-4o-mini
    litellm_params:
    model: azure/chatgpt-v-2
    api_base: os.environ/AZURE_API_BASE
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-07-01-preview"
    model_info:
    base_model: azure/gpt-4.1 # 2. 👈 (azure-only) SET BASE MODEL

  - model_name: gpt-4o-mini
    litellm_params:
    model: gpt-4o-mini
    api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試看看！**

```python keep-model-ids
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 25000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-4o-mini",
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

此範例中的 model ids 僅供說明，並保留其內容視窗大小。

```yaml keep-model-ids
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
      base_model: azure/gpt-4o # 2. 👈 (azure-only) SET BASE MODEL

  - model_name: gpt-3.5-turbo-large
    litellm_params:
      model: gpt-4.1
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-opus
    litellm_params:
      model: claude-opus-4-6
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

```python keep-model-ids
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 25000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo-small",
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

```yaml keep-model-ids
model_list:
    - model_name: gpt-3.5-turbo-small
      litellm_params:
        model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: {{anthropic_large}}
        api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  content_policy_fallbacks: [{"gpt-3.5-turbo-small": ["claude-opus"]}]
```

### 預設備援  {#default-fallbacks}

您也可以設定 default_fallbacks，以防某個特定模型群組設定錯誤／有問題。

```yaml keep-model-ids
model_list:
    - model_name: gpt-3.5-turbo-small
      litellm_params:
        model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: {{anthropic_large}}
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

```yaml keep-model-ids
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
- model_name: {{openai_small}}
  litellm_params:
    model: azure/chatgpt-v-2
    api_base: os.environ/AZURE_API_BASE
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-07-01-preview"
    region_name: "eu" # 👈 SET EU-REGION

- model_name: {{openai_small}}
  litellm_params:
    model: {{openai_small}}
    api_key: os.environ/OPENAI_API_KEY

- model_name: {{gemini_flash}}
  litellm_params:
    model: vertex_ai/{{gemini_flash}}
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
    model="{{openai_small}}",
    messages = [{"role": "user", "content": "Who was Alexander?"}]
)

print(response)

print(response.headers.get('x-litellm-model-api-base'))
```

### 為萬用字元模型設定備援 {#setting-fallbacks-for-wildcard-models}

您可以在設定檔中為萬用字元模型（例如 `azure/*`）設定備援。

1. 設定設定檔
```yaml
model_list:
  - model_name: "{{openai_large}}"
    litellm_params:
      model: "openai/{{openai_large}}"
      api_key: os.environ/OPENAI_API_KEY
  - model_name: "azure/*"
    litellm_params:
      model: "azure/*"
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

litellm_settings:
  fallbacks: [{"{{openai_large}}": ["azure/{{openai_large}}"]}]
```

2. 啟動 Proxy
```bash
litellm --config /path/to/config.yaml
```

3. 在主要部署不可用時進行測試。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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
    "max_tokens": 300
}'
```

#### 針對裸模型名稱的提供者前綴備援鍵 {#provider-prefixed-fallback-keys-for-bare-model-names}

對於像 `{{anthropic}}` 這類裸模型名稱的請求，也就是 Claude Code 傳送的格式，會由 `anthropic/*` 部署提供，而備援查找會將其與以該萬用字元寫法記錄的鍵比對，也就是 `anthropic/{{anthropic}}`。LiteLLM 會以與路由相同的方式推斷提供者，並且只有在某個備援鍵以 `/<model name>` 結尾時才會嘗試這種方式，因此解析為沒有提供者的別名仍會落到 `*`。優先順序是先比對完全相同的鍵，接著是同層級的鍵（裸名稱的 `<provider>/<model>` 拼法，或帶前綴名稱的裸拼法），最後是 `*`，而相同的查找也適用於 `fallbacks`、`context_window_fallbacks` 和 `content_policy_fallbacks`。匹配到的鏈是終點：一旦選定 `anthropic/{{anthropic}}` 鏈，`*` 就不會在其目標失敗後再嘗試，因此當 `*` 目標也應該執行時，請將它們列在該鏈的末端。新增於 [PR #43062](https://github.com/BerriAI/litellm/pull/43062)，將在下一個 release candidate 提供

```yaml
model_list:
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: "openai/{{openai_large}}"
    litellm_params:
      model: "openai/{{openai_large}}"
      api_key: os.environ/OPENAI_API_KEY
  - model_name: "{{openai_small}}"
    litellm_params:
      model: "openai/{{openai_small}}"
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  fallbacks:
    - {"anthropic/{{anthropic}}": ["openai/{{openai_large}}", "{{openai_small}}"]}
    - {"*": ["{{openai_small}}"]}
```

對於 `{{anthropic}}` 的請求若在 `anthropic/*` 上失敗，會先重試 `openai/{{openai_large}}`，接著再重試 `{{openai_small}}`；而對於任何其他沒有自己鍵值的裸名稱請求，則會直接送往 `*`

### 在備援上強制執行 Key 模型存取權限 {#enforce-key-model-access-on-fallbacks}

預設情況下，在 `router_settings` 中設定的備援，會套用於每一個請求，即使呼叫用的 key 不允許直接呼叫備援模型也是如此。僅限於 `gpt-5.6` 存取群組的 key，在 `gpt-5.6` 失敗且 `{{anthropic}}` 是其備援時，仍會收到來自 `{{anthropic}}` 的回應。

設定 `general_settings.enforce_fallback_model_access: true`，可在嘗試每個備援目標之前，將相同的 key、team 與 project 模型存取檢查套用到所有備援目標。呼叫者不能使用的目標會被略過。當沒有授權的目標可用時，呼叫者會收到主要模型本身的錯誤。允許呼叫備援模型的 key 仍會如以往一樣進行備援，而此檢查涵蓋 `fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks` 和 `default_fallbacks`。

```yaml keep-model-ids
model_list:
  - model_name: gpt-5.6
    litellm_params:
      model: openai/gpt-5.6
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      access_groups: ["openai-only"]
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  fallbacks:
    - gpt-5.6: ["{{anthropic}}"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enforce_fallback_model_access: true
```

以 `"models": ["openai-only"]` 建立的 key 可以呼叫 `gpt-5.6`，但不能呼叫 `{{anthropic}}`。在開啟此旗標後，來自該 key 的失敗 `gpt-5.6` 請求會回傳 OpenAI 錯誤，而不是 `{{anthropic}}` completion，且回應不會帶有 `x-litellm-attempted-fallbacks` header。以 `"models": ["openai-only", "{{anthropic}}"]` 建立的 key 仍然會進行備援。

未攜帶虛擬 key 的請求，例如 Proxy 自身的健康檢查，永遠不會受到限制。如果存取查找本身失敗，則會略過備援，而不是允許。

### 在備援上強制執行預算 {#enforce-budget-on-fallbacks}

預算只會在請求通過驗證時檢查一次，檢查對象是呼叫者所要求的模型。之後才會選定備援目標，因此單靠這次檢查無法看見實際計費的模型。這在主要模型的定價為零時最重要：零成本模型完全免於預算檢查，因此若沒有第二次檢查，該模型的請求會被允許通過、再備援到付費模型，並且會在沒有套用上限的情況下完整計費。

Proxy 會在嘗試每個備援目標之前，重新檢查呼叫用 key 與使用者的預算，因此這不需要任何設定。超出預算的目標會被略過。當沒有可負擔的目標可用時，呼叫者會收到主要模型本身的錯誤。主要嘗試本身永遠不會被阻擋，因此零成本模型在上限下仍可運作，而零成本的備援目標則一律允許。此檢查涵蓋 `fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks` 和 `default_fallbacks`。

```yaml keep-model-ids
model_list:
  - model_name: free-model
    litellm_params:
      model: ollama/llama2
      api_base: http://localhost:11434
      input_cost_per_token: 0
      output_cost_per_token: 0
    model_info:
      input_cost_per_token: 0
      output_cost_per_token: 0
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  fallbacks:
    - free-model: ["{{anthropic}}"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

支出已超過其 `max_budget` 的使用者，仍可呼叫 `free-model` 並且不需支付任何費用。當 `free-model` 失敗時，該使用者會收到 `free-model` 錯誤，而不是一個會計費的 `{{anthropic}}` completion，且回應不會帶有 `x-litellm-attempted-fallbacks` header。仍在預算內的使用者則會照以往一樣繼續備援到 `{{anthropic}}`。

若要關閉此功能，讓備援不受呼叫者預算限制，請設定 `enforce_fallback_budget: false`：

```yaml
general_settings:
  enforce_fallback_budget: false
```

team key 不會繼承 key 擁有者個人的 `max_budget`，除非設定了 `general_settings.apply_user_budget_to_team_keys`，這與其他地方套用個人預算的方式一致。未攜帶虛擬 key 的請求，例如 Proxy 自身的健康檢查，永遠不會受到限制。如果支出查找本身失敗，則會略過備援，而不是允許。

### 停用備援（每次請求/金鑰） {#disable-fallbacks-per-requestkey}

<Tabs>

<TabItem value="request" label="每次請求">

您可以在請求本文中設定 `disable_fallbacks: true`，以停用每個請求的備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "messages": [
        {
            "role": "user",
            "content": "List 5 important events in the XIX century"
        }
    ],
    "model": "{{openai_small}}",
    "disable_fallbacks": true
}'
```

</TabItem>

<TabItem value="key" label="每個金鑰">

您可以在金鑰中繼資料中設定 `disable_fallbacks: true`，以按金鑰停用備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "disable_fallbacks": true
    }
}'
```

</TabItem>
</Tabs>

這兩種形式都涵蓋了代理程式原本會為該請求進行的所有備援，包括串流中途的那一種：當所選部署的串流在其第一個 chunk 之前於 `/chat/completions`、`/v1/messages` 或 `/v1/responses` 失敗時，該請求會回傳該部署自身的錯誤，而不是備援部署的回應
