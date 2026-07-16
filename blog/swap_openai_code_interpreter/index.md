---
slug: swap_openai_code_interpreter
title: "將 OpenAI Code Interpreter 換成 E2B/OpenSandbox"
date: 2026-06-23T10:00:00
authors:
  - krrish
description: "在您的請求中保留 OpenAI code_interpreter tool，並在您自己的 sandbox 中執行程式碼。LiteLLM 會攔截 tool 呼叫並將其路由到 E2B 或 OpenSandbox；無需變更用戶端。"
image: ./hero.png
tags: [code interpreter, sandbox, e2b, opensandbox, agents]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![使用 E2B 取代 OpenAI Code Interpreter](./hero.png)

OpenAI Responses 和 Chat Completions API 讓您可以宣告 `code_interpreter` tool，而模型會在 OpenAI 託管的容器中執行 Python。該容器是封閉的、由 OpenAI 計費，而程式碼（通常是客戶資料）會離開您的邊界。LiteLLM 現在讓您攔截該 tool 呼叫，並在您可控制的 sandbox 中執行。用戶端請求維持不變。

自 `LiteLLM v1.91.0.dev1` 起可用。請在這裡查看 [版本發佈](https://github.com/BerriAI/litellm/releases)。

{/* truncate */}

## 交換如何運作 {#how-the-swap-works}

註冊一個 sandbox tool，啟用攔截器，然後照您一貫的方式呼叫模型。當模型發出 `code_interpreter` tool 呼叫時，LiteLLM 會建立一個 sandbox（E2B 或 OpenSandbox）、執行產生的程式碼、將結果回傳到迴圈中，並在完成時銷毀 sandbox。回應格式仍與 OpenAI 的原生 `code_interpreter_call` 相容。

目前支援兩種後端：[E2B](https://e2b.dev/) 用於受管理的 sandbox，以及 [OpenSandbox](https://github.com/opensandboxai/opensandbox) 用於在程式碼或資料不能離開您的網路時，採用自架 Docker 支援的執行。

## SDK {#sdk}

<Tabs>
<TabItem value="responses" label="Responses API">

```python
import os, litellm
from litellm.sandbox.sandbox_tools import register_sandbox_tools
from litellm.integrations.code_interpreter_interception.handler import (
    CodeInterpreterInterceptionLogger,
)

os.environ["E2B_API_KEY"] = "e2b_..."
os.environ["OPENAI_API_KEY"] = "sk-..."

register_sandbox_tools([
    {
        "sandbox_tool_name": "my-e2b",
        "litellm_params": {
            "sandbox_provider": "e2b",
            "api_key": "os.environ/E2B_API_KEY",
        },
    }
])

litellm.callbacks = [
    CodeInterpreterInterceptionLogger(sandbox_tool_name="my-e2b")
]

response = await litellm.aresponses(
    model="openai/gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Product of first 6 primes. Just the number.",
)
print(response.output_text)
```

</TabItem>
<TabItem value="chat" label="Chat Completions">

```python
import os, litellm
from litellm.sandbox.sandbox_tools import register_sandbox_tools
from litellm.integrations.code_interpreter_interception.handler import (
    CodeInterpreterInterceptionLogger,
)

os.environ["E2B_API_KEY"] = "e2b_..."
os.environ["OPENAI_API_KEY"] = "sk-..."

register_sandbox_tools([
    {
        "sandbox_tool_name": "my-e2b",
        "litellm_params": {
            "sandbox_provider": "e2b",
            "api_key": "os.environ/E2B_API_KEY",
        },
    }
])

litellm.callbacks = [
    CodeInterpreterInterceptionLogger(sandbox_tool_name="my-e2b")
]

response = await litellm.acompletion(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Product of first 6 primes. Just the number."}],
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    max_agentic_loops=4,
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

原生 `code_interpreter` tool 會在傳到 OpenAI 之前被重新寫入；在 chat 路徑上，它會變成 `litellm_code_execution` function tool，而 LiteLLM 會將每個 sandbox 結果附加為 `role: tool` 訊息，直到模型回傳最終答案為止。

## Proxy {#proxy}

在 AI gateway 後方進行相同的交換，且用戶端無需變更。

```yaml title="config.yaml"
model_list:
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY

sandbox_tools:
  - sandbox_tool_name: my-e2b
    litellm_params:
      sandbox_provider: e2b
      api_key: os.environ/E2B_API_KEY

litellm_settings:
  callbacks: ["code_interpreter_interception"]
  code_interpreter_interception_params:
    sandbox_tool_name: my-e2b
```

OpenAI SDK 會維持不變並正常運作。將它指向 proxy、宣告 `code_interpreter`，其餘部分由 gateway 處理。

```python
from openai import OpenAI

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000/v1")

response = client.responses.create(
    model="gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Product of first 6 primes. Just the number.",
)
print(response.output_text)
```

若要完全在地端執行，請將 `sandbox_tools` 項目切換為 OpenSandbox：

```yaml
sandbox_tools:
  - sandbox_tool_name: my-opensandbox
    litellm_params:
      sandbox_provider: opensandbox
      api_base: os.environ/OPEN_SANDBOX_API_BASE
      api_key: os.environ/OPEN_SANDBOX_API_KEY
```

OpenSandbox 會在本機執行 sandbox，預設拒絕 egress；當程式碼需要網路時，請切換 `allow_internet_access=True` 或傳入明確的 `network_policy`。

## 為什麼要透過您自己的 sandbox 路由 {#why-route-it-through-your-own-sandbox}

您可在擁有執行層的同時，保留 OpenAI client contract。產生的程式碼與任何上傳的資料都會留在您操作的 sandbox 中，執行計費不再流向 OpenAI，而且相同設定可適用於 Responses 與 Chat Completions，涵蓋 gateway 路由到的任何模型。串流、強制 `tool_choice` 與並行請求都會在每個請求間隔離，並在完成時清理。

完整參考請見 [sandbox 文件](/docs/sandbox)。
