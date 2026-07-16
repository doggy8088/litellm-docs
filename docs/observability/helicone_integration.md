import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Helicone {#helicone}

:::tip

這是由社群維護的。若您遇到錯誤，請提出 issue：
https://github.com/BerriAI/litellm

:::

[Helicone](https://helicone.ai/) 是一個開源的可觀測性平台，可提供您使用量、支出、延遲等關鍵洞察。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="Python SDK">

只要 1 行程式碼，就能立即透過 Helicone 記錄您**跨所有提供者**的回應：

```python
import os
from litellm import completion

## Set env variables
os.environ["HELICONE_API_KEY"] = "your-helicone-key"

# OpenAI call
response = completion(
    model="helicone/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hi 👋 - I'm OpenAI"}],
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

將 Helicone 加入您的 LiteLLM proxy 設定：

```yaml title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

# Add Helicone callback
litellm_settings:
  success_callback: ["helicone"]

# Set Helicone API key
environment_variables:
  HELICONE_API_KEY: "your-helicone-key"
```

啟動 proxy：
```bash
litellm --config config.yaml
```

</TabItem>
</Tabs>

## 整合方式 {#integration-methods}

將 Helicone 與 LiteLLM 整合主要有兩種方式：

1. **作為提供者**：使用 Helicone 記錄 [所有支援的模型 ](../providers/helicone) 的請求
2. **回呼**：在使用任何提供者時將記錄送至 Helicone

### 支援的 LLM 提供者 {#supported-llm-providers}

Helicone 可以跨 [所有主要的 LLM 提供者](https://helicone.ai/models) 記錄請求，包括：

- OpenAI
- Azure
- Anthropic
- Gemini
- Groq
- Cohere
- Replicate
- 以及更多

## 方式 1：將 Helicone 作為提供者使用 {#method-1-using-helicone-as-a-provider}

Helicone 的 AI Gateway 提供 [進階功能](https://docs.helicone.ai)，例如快取、速率限制、LLM 安全性等。

<Tabs>
  <TabItem value="sdk" label="Python SDK">

  將 Helicone 設為您的 base URL，並傳入驗證標頭：

  ```python
  import os
  import litellm
  from litellm import completion

  os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

  messages = [{"content": "What is the capital of France?", "role": "user"}]

  # Helicone call - routes through Helicone gateway to any model
  response = completion(
      model="helicone/gpt-4o-mini", # or any 100+ models
      messages=messages
  )

  print(response)
  ```

  ### 進階用法

  您可以使用 Helicone 標頭為請求新增自訂中繼資料與屬性。以下是一些範例：

  ```python
  litellm.metadata = {
      "Helicone-User-Id": "user-abc",  # Specify the user making the request
      "Helicone-Property-App": "web",  # Custom property to add additional information
      "Helicone-Property-Custom": "any-value",  # Add any custom property
      "Helicone-Prompt-Id": "prompt-supreme-court",  # Assign an ID to associate this prompt with future versions
      "Helicone-Cache-Enabled": "true",  # Enable caching of responses
      "Cache-Control": "max-age=3600",  # Set cache limit to 1 hour
      "Helicone-RateLimit-Policy": "10;w=60;s=user",  # Set rate limit policy
      "Helicone-Retry-Enabled": "true",  # Enable retry mechanism
      "helicone-retry-num": "3",  # Set number of retries
      "helicone-retry-factor": "2",  # Set exponential backoff factor
      "Helicone-Model-Override": "gpt-3.5-turbo-0613",  # Override the model used for cost calculation
      "Helicone-Session-Id": "session-abc-123",  # Set session ID for tracking
      "Helicone-Session-Path": "parent-trace/child-trace",  # Set session path for hierarchical tracking
      "Helicone-Omit-Response": "false",  # Include response in logging (default behavior)
      "Helicone-Omit-Request": "false",  # Include request in logging (default behavior)
      "Helicone-LLM-Security-Enabled": "true",  # Enable LLM security features
      "Helicone-Moderations-Enabled": "true",  # Enable content moderation
  }
  ```

  ### 快取與速率限制

  啟用快取並設定速率限制政策：

  ```python
  litellm.metadata = {
      "Helicone-Cache-Enabled": "true",  # Enable caching of responses
      "Cache-Control": "max-age=3600",  # Set cache limit to 1 hour
      "Helicone-RateLimit-Policy": "100;w=3600;s=user",  # Set rate limit policy
  }
  ```

  </TabItem>
</Tabs>

## 方式 2：使用回呼 {#method-2-using-callbacks}

在直接使用任何 LLM 提供者時，將請求記錄到 Helicone。

<Tabs>
  <TabItem value="sdk" label="Python SDK">

  ```python
  import os
  import litellm
  from litellm import completion

  ## Set env variables
  os.environ["HELICONE_API_KEY"] = "your-helicone-key"
  os.environ["OPENAI_API_KEY"] = "your-openai-key"
  # os.environ["HELICONE_API_BASE"] = "" # [OPTIONAL] defaults to `https://api.helicone.ai`

  # Set callbacks
  litellm.success_callback = ["helicone"]

  # OpenAI call
  response = completion(
      model="gpt-4o",
      messages=[{"role": "user", "content": "Hi 👋 - I'm OpenAI"}],
  )

  print(response)
  ```

  </TabItem>
  <TabItem value="proxy" label="LiteLLM Proxy">

  ```yaml title="config.yaml"
  model_list:
    - model_name: gpt-4
      litellm_params:
        model: gpt-4
        api_key: os.environ/OPENAI_API_KEY
    - model_name: claude-3
      litellm_params:
        model: anthropic/claude-3-sonnet-20240229
        api_key: os.environ/ANTHROPIC_API_KEY

  # Add Helicone logging
  litellm_settings:
    success_callback: ["helicone"]

  # Environment variables
  environment_variables:
    HELICONE_API_KEY: "your-helicone-key"
    OPENAI_API_KEY: "your-openai-key"
    ANTHROPIC_API_KEY: "your-anthropic-key"
  ```

  啟動 proxy：
  ```bash
  litellm --config config.yaml
  ```

  向您的 proxy 發出請求：
  ```python
  import openai

  client = openai.OpenAI(
      api_key="anything",  # proxy doesn't require real API key
      base_url="http://localhost:4000"
  )

  response = client.chat.completions.create(
      model="gpt-4",  # This gets logged to Helicone
      messages=[{"role": "user", "content": "Hello!"}]
  )
  ```

  </TabItem>
</Tabs>

## 工作階段追蹤與追蹤 {#session-tracking-and-tracing}

使用工作階段 ID 與路徑追蹤多步驟與 agentic LLM 互動：

<Tabs>
  <TabItem value="sdk" label="Python SDK">

  ```python
  import os
  import litellm
  from litellm import completion

  os.environ["HELICONE_API_KEY"] = ""  # your Helicone API key

  messages = [{"content": "What is the capital of France?", "role": "user"}]

  response = completion(
      model="helicone/gpt-4",
      messages=messages,
      metadata={
          "Helicone-Session-Id": "session-abc-123",
          "Helicone-Session-Path": "parent-trace/child-trace",
      }
  )

  print(response)
  ```

  </TabItem>
  <TabItem value="proxy" label="LiteLLM Proxy">

  ```python
  import openai

  client = openai.OpenAI(
      api_key="anything",
      base_url="http://localhost:4000"
  )

  # First request in session
  response1 = client.chat.completions.create(
      model="gpt-4",
      messages=[{"role": "user", "content": "Hello"}],
      extra_headers={
          "Helicone-Session-Id": "session-abc-123",
          "Helicone-Session-Path": "conversation/greeting"
      }
  )

  # Follow-up request in same session
  response2 = client.chat.completions.create(
      model="gpt-4",
      messages=[{"role": "user", "content": "Tell me more"}],
      extra_headers={
          "Helicone-Session-Id": "session-abc-123",
          "Helicone-Session-Path": "conversation/follow-up"
      }
  )
  ```

  </TabItem>
</Tabs>

- `Helicone-Session-Id`：工作階段的唯一識別碼，用於將相關請求分組
- `Helicone-Session-Path`：用來表示父/子追蹤的階層式路徑（例如「parent/child」）

## 重試與備援機制 {#retry-and-fallback-mechanisms}

<Tabs>
  <TabItem value="sdk" label="Python SDK">

  ```python
  import litellm

  litellm.api_base = "https://ai-gateway.helicone.ai/"
  litellm.metadata = {
      "Helicone-Retry-Enabled": "true",
      "helicone-retry-num": "3",
      "helicone-retry-factor": "2",
  }

  response = litellm.completion(
      model="helicone/gpt-4o-mini/openai,claude-3-5-sonnet-20241022/anthropic", # Try OpenAI first, then fallback to Anthropic, then continue with other models
      messages=[{"role": "user", "content": "Hello"}]
  )
  ```

  </TabItem>
  <TabItem value="proxy" label="LiteLLM Proxy">

  ```yaml title="config.yaml"
  model_list:
    - model_name: gpt-4
      litellm_params:
        model: gpt-4
        api_key: os.environ/OPENAI_API_KEY
        api_base: "https://oai.hconeai.com/v1"

  default_litellm_params:
    headers:
      Helicone-Auth: "Bearer ${HELICONE_API_KEY}"
      Helicone-Retry-Enabled: "true"
      helicone-retry-num: "3"
      helicone-retry-factor: "2"
      Helicone-Fallbacks: '["gpt-3.5-turbo", "gpt-4"]'

  environment_variables:
    HELICONE_API_KEY: "your-helicone-key"
    OPENAI_API_KEY: "your-openai-key"
  ```

  </TabItem>
</Tabs>

> **支援的標頭** - 如需完整的支援 Helicone 標頭及其描述清單，請參閱 [Helicone 文件](https://docs.helicone.ai/features/advanced-usage/custom-properties)。
> 透過運用這些標頭與中繼資料選項，您可以更深入了解您的 LLM 使用情況、最佳化效能，並透過 Helicone 與 LiteLLM 更妥善地管理您的 AI 工作流程。
