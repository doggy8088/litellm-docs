---
title: "透過 LiteLLM 使用 OpenAI Text Completion API"
sidebar_label: "OpenAI (Text Completion)"
description: "透過 SDK 或 AI 閘道，經由 text-completion-openai/，使用 gpt-5.4、gpt-5.4-mini 與 gpt-5.4-nano，將提示傳送至 OpenAI 的舊版 Completions 端點。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI（文字完成） {#openai-text-completion}

LiteLLM 支援 OpenAI 文字完成模型

:::note

OpenAI 的模型頁面將舊版 Completions 端點列為不支援目前的模型。截至 2026 年 10 月，gpt-5.4、gpt-5.4-mini 與 gpt-5.4-nano 仍可在該端點回應，而 gpt-5.5 及後續版本則回傳 404。這些是聊天模型，因此該端點會以純文字接續您的提示，而不是回覆提示，且文字可能包含模型內部的格式標記。LiteLLM 尚未追蹤此路由的花費。若需要聊天式回覆與花費追蹤，請使用 `openai/` 前綴，該前綴也支援 [`/completions`](../text_completion.md) 請求。

:::

### 必要的 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 用法 {#usage}
```python keep-model-ids
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "text-completion-openai/gpt-5.4-mini", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 OpenAI 模型

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export OPENAI_API_KEY=""
```

### 2. 啟動 proxy  {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml keep-model-ids
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}                          # The `openai/` prefix will call openai.chat.completions.create
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.4-mini-completions
    litellm_params:
      model: text-completion-openai/gpt-5.4-mini # The `text-completion-openai/` prefix will call openai.completions.create
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="config-*" label="config.yaml - 代理所有 OpenAI 模型">

使用這個來以一個 API 金鑰加入所有 openai 模型。**警告：這不會進行任何負載平衡**
這表示對 `{{openai_large}}`、`{{openai_small}}` 的請求都會經由這條路由

```yaml
model_list:
  - model_name: "*"             # all requests where model not in your config go to this deployment
    litellm_params:
      model: openai/*           # set `openai/` to use the openai route
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="cli" label="CLI">

```bash keep-model-ids
$ litellm --model text-completion-openai/gpt-5.4-mini

# Server running on http://0.0.0.0:4000
```
</TabItem>

</Tabs>

### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell keep-model-ids
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "gpt-5.4-mini-completions",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python keep-model-ids
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-5.4-mini-completions", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python keep-model-ids
from langchain_openai import OpenAI

llm = OpenAI(
    base_url="http://0.0.0.0:4000", # set base_url to the LiteLLM Proxy
    api_key="anything",
    model="gpt-5.4-mini-completions",
    temperature=0.1
)

response = llm.invoke("test from litellm. tell me why it's amazing in 1 sentence")

print(response)
```
</TabItem>
</Tabs>

## OpenAI 文字完成模型 / Instruct 模型 {#openai-text-completion-models--instruct-models}

| 模型名稱          | 函式呼叫                                      |
|---------------------|----------------------------------------------------|
| gpt-5.4             | `response = completion(model="text-completion-openai/gpt-5.4", messages=messages)` |
| gpt-5.4-mini        | `response = completion(model="text-completion-openai/gpt-5.4-mini", messages=messages)` |
| gpt-5.4-nano        | `response = completion(model="text-completion-openai/gpt-5.4-nano", messages=messages)` |

OpenAI 將於 2027 年 4 月 1 日停用 gpt-5.4-nano。
