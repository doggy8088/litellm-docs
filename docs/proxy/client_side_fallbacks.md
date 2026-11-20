---
title: "用戶端備援"
sidebar_label: "用戶端備援"
description: "從用戶端或 Python SDK 依請求設定備援模型，並控制傳送給每個備援模型的提示。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 用戶端備援 {#client-side-fallbacks}

在 `.completion()` 呼叫中為 SDK 設定備援，並在用戶端為 proxy 設定備援。

在此請求中，將會發生下列情況：
1. 對 `model="zephyr-beta"` 的請求將會失敗
2. litellm proxy 會逐一嘗試 `fallbacks=["{{openai_small}}"]` 中指定的所有 model_groups
3. 對 `model="{{openai_small}}"` 的請求將會成功，而發出請求的用戶端將從 gpt-5.6-luna 取得回應

關鍵變更：`"fallbacks": ["{{openai_small}}"]`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(model_list=[...]) # defined in Step 1.

resp = router.completion(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Hey, how's it going?"}],
    mock_testing_fallbacks=True, # trigger fallbacks
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
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
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
response = chat.invoke(messages)

print(response)
```

</TabItem>

</Tabs>
</TabItem>

</Tabs>

## 控制備援提示 {#control-fallback-prompts}

在備援中依模型傳入 messages/temperature 等參數（同樣適用於 embedding/圖片生成等）。

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
    mock_testing_fallbacks=True, # trigger fallbacks
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

若要改為在閘道設定中為每個請求設定備援，請參閱 [Fallbacks](./reliability.md)。
