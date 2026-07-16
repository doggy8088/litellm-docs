import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI Agents SDK {#openai-agents-sdk}

透過 LiteLLM Proxy 使用 OpenAI Agents SDK 搭配任何 LLM 提供者。

[OpenAI Agents SDK](https://github.com/openai/openai-agents-python) 是一個用於建置多代理程式工作流程的輕量型框架。它包含官方的 LiteLLM 擴充功能，讓您可以使用 100+ 個受支援的提供者。

## 快速開始 {#quick-start}

### 1. 安裝相依套件 {#1-install-dependencies}

```bash
uv add "openai-agents[litellm]"
```

### 2. 將模型加入設定檔 {#2-add-model-to-config}

```yaml title="config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: "openai/gpt-4o"
      api_key: "os.environ/OPENAI_API_KEY"

  - model_name: claude-sonnet
    litellm_params:
      model: "anthropic/claude-3-5-sonnet-20241022"
      api_key: "os.environ/ANTHROPIC_API_KEY"

  - model_name: gemini-pro
    litellm_params:
      model: "gemini/gemini-2.0-flash-exp"
      api_key: "os.environ/GEMINI_API_KEY"
```

### 3. 啟動 LiteLLM Proxy {#3-start-litellm-proxy}

```bash
litellm --config config.yaml
```

### 4. 搭配 Proxy 使用 {#4-use-with-proxy}

<Tabs>
<TabItem value="proxy" label="透過 Proxy">

```python
from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel

# Point to LiteLLM proxy
agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    model=LitellmModel(
        model="claude-sonnet",  # Model from config.yaml
        api_key="sk-1234",      # LiteLLM API key
        base_url="http://localhost:4000"
    )
)

result = await Runner.run(agent, "What is LiteLLM?")
print(result.final_output)
```

</TabItem>
<TabItem value="direct" label="直接使用（不透過 Proxy）">

```python
from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel

# Use any provider directly
agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    model=LitellmModel(
        model="anthropic/claude-3-5-sonnet-20241022",
        api_key="your-anthropic-key"
    )
)

result = await Runner.run(agent, "What is LiteLLM?")
print(result.final_output)
```

</TabItem>
</Tabs>

## 追蹤用量 {#track-usage}

啟用用量追蹤以監控 token 消耗：

```python
from agents import Agent, ModelSettings
from agents.extensions.models.litellm_model import LitellmModel

agent = Agent(
    name="Assistant",
    model=LitellmModel(model="claude-sonnet", api_key="sk-1234"),
    model_settings=ModelSettings(include_usage=True)
)

result = await Runner.run(agent, "Hello")
print(result.context_wrapper.usage)  # Token counts
```

## 環境變數 {#environment-variables}

| 變數 | 值 | 說明 |
|----------|-------|-------------|
| `LITELLM_BASE_URL` | `http://localhost:4000` | LiteLLM proxy URL |
| `LITELLM_API_KEY` | `sk-1234` | 您的 LiteLLM API 金鑰 |

## 相關資源 {#related-resources}

- [OpenAI Agents SDK 文件](https://openai.github.io/openai-agents-python/)
- [LiteLLM 擴充功能文件](https://openai.github.io/openai-agents-python/models/litellm/)
- [LiteLLM Proxy 快速開始](../proxy/quick_start)
