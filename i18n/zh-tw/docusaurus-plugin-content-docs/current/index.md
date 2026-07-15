---
id: index
title: 開始使用
sidebar_label: 快速入門
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import NavigationCards from '@site/src/components/NavigationCards';

**LiteLLM** 是開放原始碼函式庫，提供統一介面，讓您使用 OpenAI 格式呼叫 100 多個 LLM，包括 OpenAI、Anthropic、Vertex AI、Bedrock 等提供者。

- 透過相同的 `completion()` 介面呼叫任何提供者，不必為每個 API 重新學習
- 無論使用哪個提供者或模型，都能取得一致的輸出格式
- 透過 [Router](/docs/routing) 在多個部署之間內建重試與備援邏輯
- 自行託管 [LLM Gateway（Proxy）](/docs/proxy)，支援虛擬金鑰、成本追蹤與管理介面

[![PyPI](https://img.shields.io/pypi/v/litellm.svg)](https://pypi.org/project/litellm/)
[![GitHub Stars](https://img.shields.io/github/stars/BerriAI/litellm?style=social)](https://github.com/BerriAI/litellm)

* * *

## 安裝

```shell
uv add litellm
```

若要執行完整的 Proxy Server（LLM Gateway）：

```shell
uv tool install 'litellm[proxy]'
```

* * *

## 快速開始

選擇您要使用的提供者，發出第一個 LLM 請求：

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="openai/gpt-4o",
  messages=[{"role": "user", "content": "Hello, how are you?"}]
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```python
from litellm import completion
import os

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

response = completion(
  model="anthropic/claude-3-5-sonnet-20241022",
  messages=[{"role": "user", "content": "Hello, how are you?"}]
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="vertex" label="Vertex AI">

```python
from litellm import completion
import os

# auth: run 'gcloud auth application-default login'
os.environ["VERTEXAI_PROJECT"] = "your-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = completion(
  model="vertex_ai/gemini-1.5-pro",
  messages=[{"role": "user", "content": "Hello, how are you?"}]
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

```python
from litellm import completion
import os

os.environ["AWS_ACCESS_KEY_ID"] = "your-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret"
os.environ["AWS_REGION_NAME"] = "us-east-1"

response = completion(
  model="bedrock/anthropic.claude-haiku-4-5-20251001:0",
  messages=[{"role": "user", "content": "Hello, how are you?"}]
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="ollama" label="Ollama">

```python
from litellm import completion

response = completion(
  model="ollama/llama3",
  messages=[{"role": "user", "content": "Hello, how are you?"}],
  api_base="http://localhost:11434"
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="azure" label="Azure OpenAI">

```python
from litellm import completion
import os

os.environ["AZURE_API_KEY"] = "your-key"
os.environ["AZURE_API_BASE"] = "https://your-resource.openai.azure.com"
os.environ["AZURE_API_VERSION"] = "2024-02-01"

response = completion(
  model="azure/your-deployment-name",
  messages=[{"role": "user", "content": "Hello, how are you?"}]
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

無論使用哪個提供者，所有回應都遵循 OpenAI Chat Completions 格式。

### 回應格式

非串流回應會回傳 `ModelResponse` 物件：

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thanks for asking."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 12,
    "total_tokens": 25
  }
}
```

串流回應（`stream=True`）會產生 `ModelResponseStream` 區塊：

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion.chunk",
  "created": 1677858242,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "delta": {
        "role": "assistant",
        "content": "Hello"
      },
      "finish_reason": null
    }
  ]
}
```

請參閱[完整輸出格式參考](/docs/completion/output)。

* * *

## 剛接觸 LiteLLM？

**想快速開始？** 前往[教學](/docs/tutorials)，依照步驟整合 AI 程式開發工具、代理程式 SDK、Proxy 設定等功能。

**想了解特定功能？** 請參閱[指南](/docs/guides)，查看串流、函式呼叫、提示快取與其他操作方式。

## 選擇使用路徑

<NavigationCards
columns={2}
items={[
{
icon: "🐍",
title: "Python SDK",
description: "直接將 LiteLLM 整合到 Python 應用程式，作為 OpenAI Client 的替代方案。",
listDescription: [
"completion()、embedding()、image_generation() 等功能",
"支援重試、備援與負載平衡的 Router",
"適用於所有提供者的 OpenAI 相容例外",
"可觀測性回呼（Langfuse、MLflow、Helicone 等）",
],
to: "#litellm-python-sdk",
},
{
icon: "🖥️",
title: "Proxy Server（LLM Gateway）",
description: "供平台團隊自行託管，管理整個組織的 LLM 存取。",
listDescription: [
"可依金鑰、團隊與使用者設定預算的虛擬金鑰",
"集中式記錄、防護欄與快取",
"用於監控與管理的管理介面",
"任何 OpenAI 相容 Client 的直接替代方案",
],
to: "#litellm-proxy-server-llm-gateway",
},
]}
/>

* * *

## LiteLLM Python SDK

### 串流

加入 `stream=True`，在內容生成時接收回應區塊：

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "your-api-key"

for chunk in completion(
  model="openai/gpt-4o",
  messages=[{"role": "user", "content": "Write a short poem"}],
  stream=True,
):
    print(chunk.choices[0].delta.content or "", end="")
```

### 例外處理

LiteLLM 會將每個提供者的錯誤對應到 OpenAI 例外類型，因此既有的錯誤處理程式碼可以直接使用：

```python
import litellm

try:
    litellm.completion(
      model="anthropic/claude-instant-1",
      messages=[{"role": "user", "content": "Hey!"}]
    )
except litellm.AuthenticationError as e:
    print(f"Bad API key: {e}")
except litellm.RateLimitError as e:
    print(f"Rate limited: {e}")
except litellm.APIError as e:
    print(f"API error: {e}")
```

### 記錄與可觀測性

只要一行設定，就能將輸入與輸出傳送至 Langfuse、MLflow、Helicone、Lunary 等服務：

```python
import litellm

litellm.success_callback = ["langfuse", "mlflow", "helicone"]

response = litellm.completion(
  model="gpt-4o",
  messages=[{"role": "user", "content": "Hi!"}]
)
```

請參閱[所有可觀測性整合](/docs/observability/opentelemetry_v2)。

### 追蹤成本與使用量

使用回呼擷取每次回應的成本：

```python
import litellm

def track_cost(kwargs, completion_response, start_time, end_time):
    print("Cost:", kwargs.get("response_cost", 0))

litellm.success_callback = [track_cost]

litellm.completion(
  model="gpt-4o",
  messages=[{"role": "user", "content": "Hello!"}],
  stream=True
)
```

請參閱[自訂回呼文件](/docs/observability/custom_callback)。

* * *

## LiteLLM Proxy Server（LLM Gateway）

Proxy 是自行託管的 OpenAI 相容 Gateway。任何能使用 OpenAI 的 Client 都能使用 Proxy，不需要修改程式碼。

### 步驟 1：啟動 Proxy

```shell
litellm --model huggingface/bigcode/starcoder
# Proxy running on http://0.0.0.0:4000
```

### 步驟 2：使用 OpenAI Client 呼叫

```python
import openai

client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[{"role": "user", "content": "Write a short poem"}]
)
print(response.choices[0].message.content)
```

請參閱[使用 Docker 的完整 Proxy 快速入門](/docs/proxy/docker_quick_start)。

* * *

## 代理程式與 MCP Gateway

LiteLLM 是整合 LLM、代理程式與 MCP 的 Gateway，不需要另外部署代理程式或 MCP Gateway。單一端點即可存取 100 多個模型、A2A 代理程式與 MCP 工具。

<NavigationCards
columns={3}
items={[
{
icon: "🔗",
title: "A2A 代理程式",
description: "透過 LiteLLM Gateway 新增並呼叫 A2A 代理程式。",
to: "/docs/a2a",
},
{
icon: "🛠️",
title: "MCP Gateway",
description: "具備每把金鑰存取控制的集中式 MCP 端點。",
to: "/docs/mcp",
},
{
icon: "✨",
title: "企業版快速入門",
description: "供試用客戶使用的 LLM、MCP 與代理程式 Gateway 快速入門。",
to: "/docs/learn/enterprise_quickstart",
},
]}
/>

* * *

## 接下來可以探索

<NavigationCards
columns={3}
items={[
{
icon: "🔀",
title: "路由與負載平衡",
description: "在不同部署之間進行負載平衡，並設定自動備援。",
to: "/docs/routing-load-balancing",
},
{
icon: "🔑",
title: "虛擬金鑰",
description: "依團隊或使用者管理存取權限、預算與速率限制。",
to: "/docs/proxy/virtual_keys",
},
{
icon: "📊",
title: "支出追蹤",
description: "追蹤所有提供者的金鑰、團隊與使用者成本。",
to: "/docs/proxy/cost_tracking",
},
{
icon: "🛡️",
title: "防護欄",
description: "加入內容篩選、個人識別資訊遮罩與安全檢查。",
to: "/docs/proxy/guardrails/quick_start",
},
{
icon: "📡",
title: "可觀測性",
description: "整合 Langfuse、MLflow、Helicone 等服務。",
to: "/docs/observability/opentelemetry_v2",
},
{
icon: "🏭",
title: "企業版",
description: "為正式環境提供 SSO/SAML、稽核記錄與進階安全性。",
to: "/docs/enterprise",
},
]}
/>
