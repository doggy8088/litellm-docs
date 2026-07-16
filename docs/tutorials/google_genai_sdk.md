import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 搭配 LiteLLM 的 Google GenAI SDK {#google-genai-sdk-with-litellm}

透過 LiteLLM Proxy，使用 Google 的官方 GenAI SDK（JavaScript/TypeScript 和 Python）搭配任何 LLM 提供者。

Google GenAI SDK（JS 使用 `@google/genai`，Python 使用 `google-genai`）提供呼叫 Gemini 模型的原生介面。只要將其指向 LiteLLM，您就能用同一套 SDK 搭配 OpenAI、Anthropic、Bedrock、Azure、Vertex AI，或任何其他提供者，同時保留原生的 Gemini 請求／回應格式。

## 為什麼要將 LiteLLM 與 Google GenAI SDK 搭配使用？ {#why-use-litellm-with-google-genai-sdk}

**開發者優勢：**
- **通用模型存取**：透過 Google GenAI SDK 介面使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）
- **更高的速率限制與可靠性**：在多個模型與提供者之間進行負載平衡，以避免碰到單一提供者的限制，並以備援機制確保即使某個提供者失敗，您仍可取得回應

**Proxy 管理員優勢：**
- **集中管理**：透過單一 LiteLLM proxy 執行個體控制所有模型的存取，而不需要提供開發者各個提供者的 API 金鑰
- **預算控制**：設定支出上限並追蹤所有 SDK 使用量的成本
- **記錄與可觀測性**：以成本追蹤、記錄與分析功能追蹤所有請求

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | `/generateContent` 端點上的所有模型 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | 支援 `streamGenerateContent` |
| 虛擬金鑰 | ✅ | 使用 LiteLLM 金鑰而非 Google 金鑰 |
| 負載平衡 | ✅ | 透過原生路由端點 |
| 備援 | ✅ | 透過原生路由端點 |

## 快速開始 {#quick-start}

### 1. 安裝 SDK {#1-install-the-sdk}

<Tabs>
<TabItem value="js" label="JavaScript/TypeScript">

```bash
npm install @google/genai
```

</TabItem>
<TabItem value="python" label="Python">

```bash
uv add google-genai
```

</TabItem>
</Tabs>

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gemini-2.5-flash
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GEMINI_API_KEY
```

```bash
litellm --config config.yaml
```

### 3. 透過 LiteLLM 呼叫 SDK {#3-call-the-sdk-through-litellm}

<Tabs>
<TabItem value="js" label="JavaScript/TypeScript">

```javascript title="index.js" showLineNumbers
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: "sk-1234",  // LiteLLM virtual key (not a Google key)
  httpOptions: {
    baseUrl: "http://localhost:4000/gemini",  // LiteLLM proxy URL
  },
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });
  console.log(response.text);
}

main();
```

</TabItem>
<TabItem value="python" label="Python">

```python title="main.py" showLineNumbers
from google import genai

client = genai.Client(
    api_key="sk-1234",  # LiteLLM virtual key (not a Google key)
    http_options={"base_url": "http://localhost:4000/gemini"},  # LiteLLM proxy URL
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works",
)
print(response.text)
```

</TabItem>
<TabItem value="curl" label="curl">

```bash
curl "http://localhost:4000/gemini/v1beta/models/gemini-2.5-flash:generateContent?key=sk-1234" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "Explain how AI works"}]
    }]
  }'
```

</TabItem>
</Tabs>

## 串流 {#streaming}

<Tabs>
<TabItem value="js" label="JavaScript/TypeScript">

```javascript title="streaming.js" showLineNumbers
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: "sk-1234",
  httpOptions: {
    baseUrl: "http://localhost:4000/gemini",
  },
});

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Write a short poem about the ocean",
  });

  for await (const chunk of response) {
    process.stdout.write(chunk.text);
  }
}

main();
```

</TabItem>
<TabItem value="python" label="Python">

```python title="streaming.py" showLineNumbers
from google import genai

client = genai.Client(
    api_key="sk-1234",
    http_options={"base_url": "http://localhost:4000/gemini"},
)

response = client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="Write a short poem about the ocean",
)

for chunk in response:
    print(chunk.text, end="")
```

</TabItem>
</Tabs>

## 多輪對話 {#multi-turn-chat}

<Tabs>
<TabItem value="js" label="JavaScript/TypeScript">

```javascript title="chat.js" showLineNumbers
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: "sk-1234",
  httpOptions: {
    baseUrl: "http://localhost:4000/gemini",
  },
});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
  });

  const response1 = await chat.sendMessage({ message: "I have 2 dogs and 3 cats." });
  console.log(response1.text);

  const response2 = await chat.sendMessage({ message: "How many pets is that in total?" });
  console.log(response2.text);
}

main();
```

</TabItem>
<TabItem value="python" label="Python">

```python title="chat.py" showLineNumbers
from google import genai

client = genai.Client(
    api_key="sk-1234",
    http_options={"base_url": "http://localhost:4000/gemini"},
)

chat = client.chats.create(model="gemini-2.5-flash")

response1 = chat.send_message("I have 2 dogs and 3 cats.")
print(response1.text)

response2 = chat.send_message("How many pets is that in total?")
print(response2.text)
```

</TabItem>
</Tabs>

## 進階：在 GenAI SDK 中使用任何模型 {#advanced-use-any-model-with-the-genai-sdk}

預設情況下，GenAI SDK 會與 Gemini 模型通訊。但透過 LiteLLM 的路由器，您可以將 GenAI SDK 請求路由到**任何提供者**——Anthropic、OpenAI、Bedrock 等。

這是透過使用 `model_group_alias`，將 Gemini 模型名稱對應到您想要的提供者模型來運作。LiteLLM 會在內部處理格式轉換。

:::info

若要讓這項功能運作，請將 SDK `baseUrl` 指向 `http://localhost:4000`（不含 `/gemini`）。這會將請求路由經由 LiteLLM 的原生 Google 端點，再通過路由器並支援模型別名。

:::

<Tabs>
<TabItem value="anthropic" label="Anthropic">

將 `gemini-2.5-flash` 請求路由到 Claude Sonnet：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  model_group_alias: {"gemini-2.5-flash": "claude-sonnet"}
```

</TabItem>
<TabItem value="openai" label="OpenAI">

將 `gemini-2.5-flash` 請求路由到 GPT-4o：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o-model
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  model_group_alias: {"gemini-2.5-flash": "gpt-4o-model"}
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

將 `gemini-2.5-flash` 請求路由到 Bedrock 上的 Claude：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

router_settings:
  model_group_alias: {"gemini-2.5-flash": "bedrock-claude"}
```

</TabItem>
<TabItem value="multi" label="Multi-Provider Load Balancing">

在 Anthropic 與 OpenAI 之間進行負載平衡：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: my-model
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: my-model
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  model_group_alias: {"gemini-2.5-flash": "my-model"}
```

</TabItem>
</Tabs>

接著使用 SDK，並將 `baseUrl` 指向 LiteLLM（不含 `/gemini`）：

<Tabs>
<TabItem value="js" label="JavaScript/TypeScript">

```javascript title="any_model.js" showLineNumbers
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: "sk-1234",
  httpOptions: {
    baseUrl: "http://localhost:4000",  // No /gemini — goes through the router
  },
});

async function main() {
  // This calls Claude/GPT-4o/Bedrock under the hood via model_group_alias
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Hello from any model!",
  });
  console.log(response.text);
}

main();
```

</TabItem>
<TabItem value="python" label="Python">

```python title="any_model.py" showLineNumbers
from google import genai

client = genai.Client(
    api_key="sk-1234",
    http_options={"base_url": "http://localhost:4000"},  # No /gemini
)

# This calls Claude/GPT-4o/Bedrock under the hood via model_group_alias
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Hello from any model!",
)
print(response.text)
```

</TabItem>
</Tabs>

## 轉送 vs 原生路由端點 {#pass-through-vs-native-router-endpoints}

LiteLLM 提供兩種處理 GenAI SDK 請求的方式：

| | 轉送（`/gemini`） | 原生路由（`/`） |
|---|---|---|
| **baseUrl** | `http://localhost:4000/gemini` | `http://localhost:4000` |
| **模型** | 僅 Gemini | 透過 `model_group_alias` 使用任何提供者 |
| **轉換** | 無——直接代理到 Google | 在內部轉換 |
| **成本追蹤** | ✅ | ✅ |
| **虛擬金鑰** | ✅ | ✅ |
| **負載平衡** | ❌ | ✅ |
| **備援** | ❌ | ✅ |
| **最適合** | 簡單的 Gemini 代理 | 多提供者路由 |

## 環境變數設定 {#environment-variable-configuration}

您也可以透過環境變數而非程式碼來設定 SDK：

```bash
# For JavaScript SDK (@google/genai)
export GOOGLE_GEMINI_BASE_URL="http://localhost:4000/gemini"
export GEMINI_API_KEY="sk-1234"

# For Python SDK (google-genai)
# Note: The Python SDK does not support a base URL env var.
# Configure it in code with http_options={"base_url": "..."} instead.
export GEMINI_API_KEY="sk-1234"
```

這對於建立在 GenAI SDK 之上的工具特別有用（例如 [Gemini CLI](./litellm_gemini_cli.md)）。

## 相關資源 {#related-resources}

- [搭配 LiteLLM 的 Gemini CLI](./litellm_gemini_cli.md)
- [Google AI Studio 轉送](../pass_through/google_ai_studio)
- [搭配 LiteLLM 的 Google ADK](./google_adk.md)
- [LiteLLM Proxy 快速開始](../proxy/quick_start)
- [`@google/genai` npm 套件](https://www.npmjs.com/package/@google/genai)
- [`google-genai` PyPI 套件](https://pypi.org/project/google-genai/)
