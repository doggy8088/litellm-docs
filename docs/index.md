---
id: index
title: 開始使用
sidebar_label: 快速入門
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import NavigationCards from '@site/src/components/NavigationCards';
import Image from '@theme/IdealImage';

<Image style={{padding: '10px', margin: '0 0 2.5rem'}} img={require('../img/hero.png')} />

**LiteLLM** 是一個開放原始碼函式庫，讓您能以單一、統一的介面呼叫 100+ 個 LLM——OpenAI、Anthropic、Vertex AI、Bedrock 等等——並使用 OpenAI 格式。

- 使用相同的 `completion()` 介面呼叫任何提供者——不必為每個提供者重新學習 API
- 無論使用哪個提供者或模型，都能保持一致的輸出格式
- 透過 [Router](./routing.md) 在多個部署之間內建重試 / 備援邏輯
- 自行代管的 [LLM 閘道 (Proxy)](./simple_proxy)，具備虛擬金鑰、成本追蹤與管理介面

[![PyPI](https://img.shields.io/pypi/v/litellm.svg)](https://pypi.org/project/litellm/)
[![GitHub 星星](https://img.shields.io/github/stars/BerriAI/litellm?style=social)](https://github.com/BerriAI/litellm)

---

## 安裝 {#installation}

```shell
uv add litellm
```

若要執行完整的 Proxy Server（LLM Gateway）：

```shell
uv tool install 'litellm[proxy]'
```

---

## 快速開始 {#quick-start}

使用您選擇的提供者進行第一次 LLM 請求：

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

無論使用哪個提供者，每個回應都遵循 OpenAI Chat Completions 格式。✅

### 回應格式 {#response-format}

非串流回應會回傳一個 `ModelResponse` 物件：

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

📖 [完整輸出格式參考 →](./completion/output)

:::tip 在 Colab 中開啟
<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/liteLLM_Getting_Started.ipynb">
<img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>
:::

---

## LiteLLM 新手？ {#new-to-litellm}

**想快速開始嗎？** 前往 [教學](/docs/tutorials) 查看逐步導覽——AI 程式撰寫工具、agent SDK、proxy 設定等等。

**需要了解特定功能嗎？** 查看 [指南](/docs/guides)，了解串流、函式呼叫、提示快取及其他操作說明。

---

## 選擇您的路徑 {#choose-your-path}

<NavigationCards
columns={2}
items={[
{
icon: "🐍",
title: "Python SDK",
description: "將 LiteLLM 直接整合到您的 Python 應用程式中。可直接替代 OpenAI client。",
listDescription: [
"completion()、embedding()、image_generation() 等更多功能",
"具備重試、備援與負載平衡的 Router",
"跨所有提供者相容於 OpenAI 的例外狀況",
"可觀測性回呼（Langfuse、MLflow、Helicone…）",
],
to: "#litellm-python-sdk",
},
{
icon: "🖥️",
title: "Proxy Server (LLM Gateway)",
description: "供平台團隊自行代管的閘道，用於管理整個組織的 LLM 存取。",
listDescription: [
"具備每個金鑰／團隊／使用者預算的虛擬金鑰",
"集中式記錄、防護欄與快取",
"用於監控與管理的管理介面",
"可直接替代任何相容 OpenAI 的 client",
],
to: "#litellm-proxy-server-llm-gateway",
},
]}
/>

---

## LiteLLM Python SDK {#litellm-python-sdk}

### 串流 {#streaming}

加入 `stream=True` 以在區塊產生時接收它們：

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

### 例外狀況處理 {#exception-handling}

LiteLLM 會將每個提供者的錯誤對應到 OpenAI 例外類型——您現有的錯誤處理可立即運作：

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

### 記錄與可觀測性 {#logging--observability}

只需一行即可將輸入／輸出傳送到 Langfuse、MLflow、Helicone、Lunary 等更多工具：

```python
import litellm

litellm.success_callback = ["langfuse", "mlflow", "helicone"]

response = litellm.completion(
  model="gpt-4o",
  messages=[{"role": "user", "content": "Hi!"}]
)
```

📖 [查看所有可觀測性整合 →](/docs/observability/opentelemetry_v2)

### 追蹤成本與用量 {#track-costs--usage}

使用回呼來擷取每個回應的成本：

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

📖 [自訂回呼文件 →](./observability/custom_callback)

---

## LiteLLM Proxy Server (LLM 閘道) {#litellm-proxy-server-llm-gateway}

proxy 是一個自行代管、相容 OpenAI 的閘道。任何可搭配 OpenAI 使用的 client，都能與 proxy 搭配使用——不需要變更程式碼。

![LiteLLM Proxy 儀表板](https://github.com/BerriAI/litellm/assets/29436595/47c97d5e-b9be-4839-b28c-43d7f4f10033)

#### 步驟 1 — 啟動 proxy {#step-1--start-the-proxy}

<Tabs>
<TabItem value="cli" label="LiteLLM CLI">

```shell
litellm --model huggingface/bigcode/starcoder
# Proxy running on http://0.0.0.0:4000
```

</TabItem>
<TabItem value="docker" label="Docker">

```yaml title="litellm_config.yaml"
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/your-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
```

```shell
docker run \
  -v $(pwd)/litellm_config.yaml:/app/config.yaml \
  -e AZURE_API_KEY=your-key \
  -e AZURE_API_BASE=https://your-resource.openai.azure.com/ \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml --detailed_debug
```

</TabItem>
</Tabs>

#### 步驟 2 — 使用 OpenAI client 呼叫它 {#step-2--call-it-with-the-openai-client}

```python
import openai

client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[{"role": "user", "content": "Write a short poem"}]
)
print(response.choices[0].message.content)
```

👉 [含 Docker 的完整 proxy 快速入門 →](./proxy/docker_quick_start)

:::tip 偵錯工具
使用 [**`/utils/transform_request`**](./utils/transform_request) 檢視 LiteLLM 傳送給任何提供者的確切內容——這對於偵錯提示格式、標頭問題以及提供者特定參數很有幫助。
:::

🔗 [互動式 API 探索工具（Swagger） →](https://litellm-api.up.railway.app/)

---

## Agent 與 MCP Gateway {#agent--mcp-gateway}

LiteLLM 是一個統一的閘道，適用於 **LLMs、agents 與 MCP**——您不需要另外的 agent 或 MCP gateway。一個端點即可連接 100+ 個模型、A2A agents 與 MCP 工具。

<NavigationCards
columns={3}
items={[
{
icon: "🔗",
title: "A2A Agents",
description: "透過 LiteLLM gateway 新增並呼叫 A2A agents。",
to: "/docs/a2a",
},
{
icon: "🛠️",
title: "MCP Gateway",
description: "具備每個金鑰存取控制的集中式 MCP 端點。",
to: "/docs/mcp",
},
{
icon: "✨",
title: "✨ Enterprise Quickstart",
description: "試用客戶的快速入門指南——LLM、MCP 與 Agent gateway。",
to: "/docs/learn/enterprise_quickstart",
},
]}
/>

---

## 接下來可以探索什麼 {#what-to-explore-next}

<NavigationCards
columns={3}
items={[
{
icon: "🔀",
title: "Routing & Load Balancing",
description: "在多個部署之間進行負載平衡並設定自動備援。",
to: "/docs/routing-load-balancing",
},
{
icon: "🔑",
title: "Virtual Keys",
description: "依團隊或使用者管理存取、預算與速率限制。",
to: "/docs/proxy/virtual_keys",
},
{
icon: "📊",
title: "Spend Tracking",
description: "追蹤所有提供者中每個金鑰、團隊與使用者的成本。",
to: "/docs/proxy/cost_tracking",
},
{
icon: "🛡️",
title: "Guardrails",
description: "加入內容過濾、PII 遮罩與安全檢查。",
to: "/docs/proxy/guardrails/quick_start",
},
{
icon: "📡",
title: "Observability",
description: "與 Langfuse、MLflow、Helicone 等更多工具整合。",
to: "/docs/observability/opentelemetry_v2",
},
{
icon: "🏭",
title: "Enterprise",
description: "供正式環境使用的 SSO/SAML、稽核記錄與進階安全性。",
to: "/docs/enterprise",
},
]}
/>
