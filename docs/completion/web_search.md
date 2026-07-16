import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 網頁搜尋 {#web-search}

在 litellm 中使用網路搜尋

| 功能 | 詳細資訊 |
|---------|---------|
| 支援的端點 | - `/chat/completions` <br/> - `/responses` <br/> - `/images/generations`（僅限 Gemini 圖像模型） |
| 支援的提供者 | `openai`、`xai`、`vertex_ai`、`anthropic`、`gemini`、`perplexity` |
| LiteLLM 成本追蹤 | ✅ 支援 |
| LiteLLM 版本 | `v1.71.0+` |

## 使用的是哪個搜尋引擎？ {#which-search-engine-is-used}

每個提供者都使用自己的搜尋後端：

| 提供者 | 搜尋引擎 | 備註 |
|----------|---------------|-------|
| **OpenAI** (`gpt-5-search-api`、`gpt-4o-search-preview`、`gpt-4o-mini-search-preview`) | OpenAI 的內部搜尋 | 即時網路資料 |
| **xAI** (`grok-3`) | xAI 的搜尋 + X/Twitter | 即時社群媒體資料 |
| **Google AI/Vertex** (`gemini-2.0-flash`) | **Google 搜尋** | 使用實際的 Google 搜尋結果 |
| **Anthropic** (`claude-3-5-sonnet`) | Anthropic 的網路搜尋 | 即時網路資料 |
| **Perplexity** | Perplexity 的搜尋引擎 | AI 驅動的搜尋與推理 |

:::warning 重要：只有搜尋模型支援 `web_search_options`
對於 OpenAI，只有專用搜尋模型支援 `web_search_options` 參數：
- `gpt-4o-search-preview`
- `gpt-4o-mini-search-preview`
- `gpt-5-search-api`

**像 `gpt-5`、`gpt-4.1`、`gpt-4o` 這類一般模型不支援 `web_search_options`**
:::

:::tip `web_search_options` 參數為選用
搜尋模型（如 `gpt-4o-search-preview`）即使沒有 `web_search_options` 參數，也會**自動搜尋網路**。

當您需要以下功能時，請使用 `web_search_options`：
- 調整 `search_context_size`（`"low"`、`"medium"`、`"high"`）
- 為在地化結果指定 `user_location`
:::

:::info
**Anthropic 網路搜尋模型**：支援網路搜尋的 Claude 模型：`claude-3-5-sonnet-latest`、`claude-3-5-sonnet-20241022`、`claude-3-5-haiku-latest`、`claude-3-5-haiku-20241022`、`claude-3-7-sonnet-20250219`
:::

## OpenAI 網路搜尋：兩種方式 {#openai-web-search-two-approaches}

OpenAI 依端點與模型提供兩種不同的網路搜尋使用方式：

| 方式 | 端點 | 模型 | 啟用方式 |
|----------|----------|--------|---------------|
| **搜尋模型** | `/chat/completions` | `gpt-5-search-api`、`gpt-4o-search-preview`、`gpt-4o-mini-search-preview` | 傳入 `web_search_options` 參數 |
| **網路搜尋工具** | `/responses` | `gpt-5`、`gpt-4.1`、`gpt-4o`，以及其他一般模型 | 傳入 `web_search_preview` 工具 |

:::tip 搜尋模型會自動搜尋
像 `gpt-5-search-api` 這類搜尋模型，即使沒有 `web_search_options` 參數，也會**自動搜尋網路**。使用 `web_search_options` 設定 `search_context_size`（`"low"`、`"medium"`、`"high"`），或指定 `user_location` 以取得在地化結果。
:::

## `/chat/completions`（litellm.completion） {#chatcompletions-litellmcompletion}

### 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
from litellm import completion

response = completion(
    model="openai/gpt-5-search-api",
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?",
        }
    ],
    web_search_options={
        "search_context_size": "medium"  # Options: "low", "medium", "high"
    }
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  # OpenAI search models
  - model_name: gpt-5-search-api
    litellm_params:
      model: openai/gpt-5-search-api
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o-search-preview
    litellm_params:
      model: openai/gpt-4o-search-preview
      api_key: os.environ/OPENAI_API_KEY

  # xAI
  - model_name: grok-3
    litellm_params:
      model: xai/grok-3
      api_key: os.environ/XAI_API_KEY

  # Anthropic
  - model_name: claude-3-5-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-5-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY

  # VertexAI
  - model_name: gemini-2-flash
    litellm_params:
      model: gemini-2.0-flash
      vertex_project: your-project-id
      vertex_location: us-central1

  # Google AI Studio
  - model_name: gemini-2-flash-studio
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python showLineNumbers
from openai import OpenAI

# Point to your proxy server
client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-5-search-api",  # or any other web search enabled model
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?"
        }
    ],
    extra_body={
        "web_search_options": {
            "search_context_size": "medium"
        }
    }
)
```
</TabItem>
</Tabs>

### 搜尋內容大小 {#search-context-size}

<Tabs>
<TabItem value="sdk" label="SDK">

**OpenAI（使用 web_search_options）**
```python showLineNumbers
from litellm import completion

# Customize search context size
response = completion(
    model="openai/gpt-5-search-api",
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?",
        }
    ],
    web_search_options={
        "search_context_size": "low"  # Options: "low", "medium" (default), "high"
    }
)
```

**xAI（使用 web_search_options）**
```python showLineNumbers
from litellm import completion

# Customize search context size for xAI
response = completion(
    model="xai/grok-3",
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?",
        }
    ],
    web_search_options={
        "search_context_size": "high"  # Options: "low", "medium" (default), "high"
    }
)
```

**Anthropic（使用 web_search_options）**
```python showLineNumbers
from litellm import completion

# Customize search context size for Anthropic
response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?",
        }
    ],
    web_search_options={
        "search_context_size": "medium",  # Options: "low", "medium" (default), "high"
        "user_location": {
            "type": "approximate",
            "approximate": {
                "city": "San Francisco",
            },
        }
    }
)
```

**VertexAI/Gemini（使用 web_search_options）**
```python showLineNumbers
from litellm import completion

# Customize search context size for Gemini
response = completion(
    model="gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?",
        }
    ],
    web_search_options={
        "search_context_size": "low"  # Options: "low", "medium" (default), "high"
    }
)
```

**Gemini 圖像生成（在 `/images/generations` 上使用 web_search_options）**

```python showLineNumbers
from litellm import image_generation

response = image_generation(
    model="gemini/gemini-3.1-flash-image-preview",
    prompt="Generate an image of the latest iPhone design",
    web_search_options={},
)
```

可與 `vertex_ai/gemini-3.1-flash-image-preview` 及其他 Gemini 圖像模型搭配使用。請參閱 [Vertex AI Image Generation](../providers/vertex_image.md) 與 [Google AI Studio Image Generation](../providers/google_ai_studio/image_gen.md)。
</TabItem>
<TabItem value="proxy" label="PROXY">

```python showLineNumbers
from openai import OpenAI

# Point to your proxy server
client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

# Customize search context size
response = client.chat.completions.create(
    model="grok-3",  # works with any web search enabled model
    messages=[
        {
            "role": "user",
            "content": "What was a positive news story from today?"
        }
    ],
    web_search_options={
        "search_context_size": "low"  # Options: "low", "medium" (default), "high"
    }
)
```
</TabItem>
</Tabs>

## `/responses`（litellm.responses） {#responses-litellmresponses}

將 `web_search_preview` 工具與 `gpt-5`、`gpt-4.1`、`gpt-4o` 等模型搭配使用。

:::info
像 `gpt-5-search-api` 和 `gpt-4o-search-preview` 這類專用搜尋模型**不**支援 `/responses` 端點。請改搭配 `/chat/completions` + `web_search_options` 使用（見上文）。
:::

### 快速開始 {#quick-start-1}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
from litellm import responses

response = responses(
    model="openai/gpt-5",
    input="What is the capital of France?",
    tools=[{
        "type": "web_search_preview"  # enables web search with default medium context size
    }]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4.1
    litellm_params:
      model: openai/gpt-4.1
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python showLineNumbers
from openai import OpenAI

# Point to your proxy server
client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.responses.create(
    model="gpt-5",
    tools=[{
        "type": "web_search_preview"
    }],
    input="What is the capital of France?",
)

print(response.output_text)
```
</TabItem>
</Tabs>

### 搜尋內容大小 {#search-context-size-1}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers
from litellm import responses

# Customize search context size
response = responses(
    model="openai/gpt-5",
    input="What is the capital of France?",
    tools=[{
        "type": "web_search_preview",
        "search_context_size": "low"  # Options: "low", "medium" (default), "high"
    }]
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```python showLineNumbers
from openai import OpenAI

# Point to your proxy server
client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

# Customize search context size
response = client.responses.create(
    model="gpt-5",
    tools=[{
        "type": "web_search_preview",
        "search_context_size": "low"  # Options: "low", "medium" (default), "high"
    }],
    input="What is the capital of France?",
)

print(response.output_text)
```
</TabItem>
</Tabs>

## 在 config.yaml 中設定網路搜尋 {#configuring-web-search-in-configyaml}

您可以直接在 proxy 設定檔中設定預設的網路搜尋選項：

<Tabs>
<TabItem value="default" label="Default Web Search">

```yaml
model_list:
  # Enable web search by default for all requests to this model
  - model_name: grok-3
    litellm_params:
      model: xai/grok-3
      api_key: os.environ/XAI_API_KEY
      web_search_options: {}  # Enables web search with default settings
```

### 進階 {#advanced}
您可以將 LiteLLM 的 router 設定為可選擇性地捨棄不支援 WebSearch 的模型，例如
```yaml
  - model_name: gpt-4.1
    litellm_params:
      model: openai/gpt-4.1
  - model_name: gpt-4.1
    litellm_params:
      model: azure/gpt-4.1
      api_base: "x.openai.azure.com/"
      api_version: 2025-03-01-preview
    model_info:
      supports_web_search: False <---- KEY CHANGE!
```
在此範例中，LiteLLM 仍會將 LLM 請求路由到兩個部署，但對於 WebSearch，則只會路由到 OpenAI。

</TabItem>
<TabItem value="custom" label="Custom Search Context">

```yaml
model_list:
  # Set custom web search context size
  - model_name: grok-3
    litellm_params:
      model: xai/grok-3
      api_key: os.environ/XAI_API_KEY
      web_search_options:
        search_context_size: "high"  # Options: "low", "medium", "high"
  
  # OpenAI search model with custom context size
  - model_name: gpt-5-search-api
    litellm_params:
      model: openai/gpt-5-search-api
      api_key: os.environ/OPENAI_API_KEY
      web_search_options:
        search_context_size: "low"

  # Gemini with medium context (default)
  - model_name: gemini-2-flash
    litellm_params:
      model: gemini-2.0-flash
      vertex_project: your-project-id
      vertex_location: us-central1
      web_search_options:
        search_context_size: "medium"
```

</TabItem>
</Tabs>

**注意：**當 `web_search_options` 在設定中有指定時，它會套用至該模型的所有請求。使用者仍可在 API 請求中傳入 `web_search_options` 來覆寫這些設定。

## 檢查模型是否支援網路搜尋 {#checking-if-a-model-supports-web-search}

<Tabs>
<TabItem label="SDK" value="sdk">

使用 `litellm.supports_web_search(model="model_name")` -> 若模型可執行網路搜尋，則回傳 `True`

```python showLineNumbers
# Check OpenAI models
assert litellm.supports_web_search(model="openai/gpt-5-search-api") == True
assert litellm.supports_web_search(model="openai/gpt-4o-search-preview") == True

# Check xAI models
assert litellm.supports_web_search(model="xai/grok-3") == True

# Check Anthropic models
assert litellm.supports_web_search(model="anthropic/claude-3-5-sonnet-latest") == True

# Check VertexAI models
assert litellm.supports_web_search(model="gemini-2.0-flash") == True

# Check Google AI Studio models
assert litellm.supports_web_search(model="gemini/gemini-2.0-flash") == True
```
</TabItem>

<TabItem label="PROXY" value="proxy">

1. 在 config.yaml 中定義模型

```yaml
model_list:
  # OpenAI
  - model_name: gpt-5-search-api
    litellm_params:
      model: openai/gpt-5-search-api
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      supports_web_search: True

  - model_name: gpt-4o-search-preview
    litellm_params:
      model: openai/gpt-4o-search-preview
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      supports_web_search: True

  # xAI
  - model_name: grok-3
    litellm_params:
      model: xai/grok-3
      api_key: os.environ/XAI_API_KEY
    model_info:
      supports_web_search: True
  
  # Anthropic
  - model_name: claude-3-5-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-5-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY
    model_info:
      supports_web_search: True
  
  # VertexAI
  - model_name: gemini-2-flash
    litellm_params:
      model: gemini-2.0-flash
      vertex_project: your-project-id
      vertex_location: us-central1
    model_info:
      supports_web_search: True
  
  # Google AI Studio
  - model_name: gemini-2-flash-studio
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY
    model_info:
      supports_web_search: True
```

2. 執行 proxy 伺服器

```bash
litellm --config config.yaml
```

3. 呼叫 `/model_group/info` 以檢查模型是否支援網路搜尋

```shell
curl -X 'GET' \
  'http://localhost:4000/model_group/info' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-1234'
```

預期回應 

```json showLineNumbers
{
  "data": [
    {
      "model_group": "gpt-5-search-api",
      "providers": ["openai"],
      "max_tokens": 128000,
      "supports_web_search": true
    },
    {
      "model_group": "gpt-4o-search-preview",
      "providers": ["openai"],
      "max_tokens": 128000,
      "supports_web_search": true
    },
    {
      "model_group": "grok-3",
      "providers": ["xai"],
      "max_tokens": 131072,
      "supports_web_search": true
    },
    {
      "model_group": "gemini-2-flash",
      "providers": ["vertex_ai"],
      "max_tokens": 8192,
      "supports_web_search": true
    }
  ]
}
```

</TabItem>
</Tabs>

## 網路搜尋成本追蹤 {#web-search-cost-tracking}

LiteLLM 會根據各提供者的計費模式自動追蹤網路搜尋成本。此成本會加在標準的 token 計價之上。

### 各提供者如何收取網路搜尋費用 {#how-providers-charge-for-web-search}

| 提供者 | 計費單位 | 運作方式 |
|----------|-------------|--------------|
| **Gemini 3.x** (3-flash、3-pro、3.1-*) | 每次搜尋查詢 | 每個內部搜尋查詢都會單獨計費。一個 prompt 可能會觸發多個查詢。 |
| **Gemini 2.x** (2.0-flash、2.5-flash、2.5-pro) | 每個 grounded prompt | 只要 API 呼叫使用 grounding，就按次收取固定費用，不論內部執行了多少查詢。 |
| **OpenAI** (gpt-4o-search、gpt-5-search) | 每個搜尋內容大小 | 費用會依 `search_context_size`（`low`、`medium`、`high`）而變動。 |
| **Anthropic**（支援網路搜尋的 Claude） | 每次搜尋請求 | 每次呼叫網路搜尋工具的固定費用。 |
| **Perplexity** (sonar、sonar-pro) | 每個搜尋內容大小 | 費用會依 `search_context_size` 而變動。 |

### 定價設定 {#pricing-configuration}

網路搜尋成本是在 `model_prices_and_context_window.json` 中使用兩個欄位定義：

- **`search_context_cost_per_query`**：每個可計費單位的成本（每個搜尋內容大小層級）。
- **`web_search_billing_unit`**（適用於 Gemini 模型）：`"per_query"`（每個搜尋查詢都會單獨計費）或 `"per_prompt"`（預設 — 只要 API 呼叫使用搜尋，就收取固定費用）。

```json
{
    "gemini/gemini-3-flash-preview": {
        "web_search_billing_unit": "per_query",
        "search_context_cost_per_query": {
            "search_context_size_low": 0.014,
            "search_context_size_medium": 0.014,
            "search_context_size_high": 0.014
        }
    },
    "gemini/gemini-2.5-flash": {
        "search_context_cost_per_query": {
            "search_context_size_low": 0.035,
            "search_context_size_medium": 0.035,
            "search_context_size_high": 0.035
        }
    }
}
```

:::info
未設定 `web_search_billing_unit` 的模型預設為 `"per_prompt"` — 每次使用 web search 的 API 呼叫只收取一筆固定費用，不論模型執行了多少內部查詢。
:::

您可以使用 `model_info` 在 proxy 設定中覆寫這些值：

```yaml
model_list:
  - model_name: gemini-3-flash
    litellm_params:
      model: gemini/gemini-3-flash-preview
    model_info:
      web_search_billing_unit: per_query
      search_context_cost_per_query:
        search_context_size_low: 0.014
        search_context_size_medium: 0.014
        search_context_size_high: 0.014
```

### LiteLLM 如何追蹤搜尋用量 {#how-litellm-tracks-search-usage}

web search 請求數量會儲存在 `usage.prompt_tokens_details.web_search_requests` 中。LiteLLM 會從各提供者的回應中擷取這個資訊：

- **Gemini**：從回應中的 `groundingMetadata.webSearchQueries` 擷取。對於 Gemini 2.x，會限制為 1（每個提示計費）。
- **OpenAI**：直接在用量中繼資料中回報。
- **Anthropic**：透過 `server_tool_use.web_search_requests` 回報。
- **xAI**：從回應中的 `num_sources_used` 對應而來。

```python
response = litellm.completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "Latest tech news?"}],
    web_search_options={"search_context_size": "medium"},
)

# Check web search usage
print(response.usage.prompt_tokens_details.web_search_requests)  # e.g., 3

# Get total cost (includes token cost + web search cost)
cost = litellm.completion_cost(completion_response=response)
print(f"Total cost: ${cost}")
```
