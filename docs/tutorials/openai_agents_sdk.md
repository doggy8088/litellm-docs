import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 搭配 LiteLLM 的 OpenAI Agents SDK {#openai-agents-sdk-with-litellm}

透過 LiteLLM Proxy，使用 OpenAI 的 Agents SDK 搭配任何 LLM 提供者。

本教學示範如何使用 OpenAI Agents SDK 建立 AI 代理程式，並透過 LiteLLM 支援多個 LLM 提供者。

## 總覽 {#overview}

OpenAI Agents SDK 提供用於建立 AI 代理程式的高階介面。透過與 LiteLLM 整合，您可以：

- 使用多個 LLM 提供者（Bedrock、Azure、Vertex AI 等），而代理程式程式碼保持相同
- 在不同提供者的模型之間輕鬆切換
- 連接到 LiteLLM proxy 以進行集中式模型管理

:::tip 內建 LiteLLM 擴充功能

OpenAI Agents SDK 包含官方 LiteLLM 擴充功能（`LitellmModel`），無需 proxy 即可運作。如果您不需要集中式 proxy 功能（成本追蹤、速率限制、負載平衡），可以直接使用：

```python
from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel


agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    model=LitellmModel(model="anthropic/claude-sonnet-4-20250514"),
)

result = Runner.run_sync(agent, "Hello!")
print(result.final_output)
```

更多詳細資訊請參閱[文件](https://openai.github.io/openai-agents-python/models/litellm/)。本教學其餘部分將聚焦於**以 proxy 為基礎的方法**，適用於需要集中式模型管理的團隊。

:::

## 必要條件 {#prerequisites}

- Python 環境設定
- 您的 LLM 提供者的 API 金鑰
- 對 LLM 與代理程式概念的基本理解

## 安裝 {#installation}

```bash showLineNumbers title="Install dependencies"
uv add openai-agents litellm
```

## 1. 啟動 LiteLLM Proxy {#1-start-litellm-proxy}

設定並啟動 LiteLLM proxy，並載入您要使用的模型：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: bedrock-claude-sonnet-4
    litellm_params:
      model: "bedrock/us.anthropic.claude-sonnet-4-20250514-v1:0"
      aws_region_name: "us-east-1"

  - model_name: gpt-4o
    litellm_params:
      model: "openai/gpt-4o"

  - model_name: claude-sonnet-4
    litellm_params:
      model: "anthropic/claude-sonnet-4-20250514"

  - model_name: bedrock-claude-haiku
    litellm_params:
      model: "bedrock/us.anthropic.claude-3-5-haiku-20241022-v1:0"
      aws_region_name: "us-east-1"

  - model_name: bedrock-nova-premier
    litellm_params:
      model: "bedrock/amazon.nova-premier-v1:0"
      aws_region_name: "us-east-1"
```

```bash
litellm --config config.yaml
```

必要的環境變數：

| 變數 | 值 | 說明 |
|----------|-------|-------------|
| `LITELLM_BASE_URL` | `http://localhost:4000` | LiteLLM proxy URL |
| `LITELLM_API_KEY` | `sk-1234` | 您的 LiteLLM API 金鑰（不是提供者的金鑰） |

## 2. 設定環境 {#2-setting-up-environment}

匯入必要的函式庫並設定您的 LiteLLM proxy 連線：

```python showLineNumbers title="Setup environment"
from __future__ import annotations

import asyncio
import os

from openai import AsyncOpenAI

from agents import (
    Agent,
    Model,
    ModelProvider,
    OpenAIChatCompletionsModel,
    RunConfig,
    Runner,
    function_tool,
    set_tracing_disabled,
)

# Point to LiteLLM proxy
BASE_URL = os.getenv("LITELLM_BASE_URL") or "http://localhost:4000"
API_KEY = os.getenv("LITELLM_API_KEY") or "sk-1234"

# Define model constants for cleaner code
MODEL_BEDROCK_SONNET = "bedrock-claude-sonnet-4"
MODEL_BEDROCK_HAIKU = "bedrock-claude-haiku"
MODEL_GPT_4O = "gpt-4o"

# Create the OpenAI client pointed at LiteLLM
client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)

# Disable tracing since we're not using OpenAI's platform directly
set_tracing_disabled(disabled=True)
```

## 3. 建立自訂模型提供者 {#3-create-a-custom-model-provider}

Agents SDK 使用 `ModelProvider` 來解析模型名稱。建立一個會透過 LiteLLM 路由所有請求的自訂提供者：

```python showLineNumbers title="Custom LiteLLM model provider"
class LiteLLMModelProvider(ModelProvider):
    def get_model(self, model_name: str | None) -> Model:
        return OpenAIChatCompletionsModel(
            model=model_name or MODEL_BEDROCK_SONNET,
            openai_client=client,
        )


LITELLM_MODEL_PROVIDER = LiteLLMModelProvider()
```

## 4. 定義簡單的工具 {#4-define-a-simple-tool}

建立您的代理程式可使用的工具：

```python showLineNumbers title="Weather tool implementation"
@function_tool
def get_weather(city: str) -> str:
    """Retrieves the current weather report for a specified city.

    Args:
        city: The name of the city (e.g., "New York", "London", "Tokyo").

    Returns:
        A string containing the weather information for the city.
    """
    print(f"[debug] getting weather for {city}")

    mock_weather_db = {
        "new york": "The weather in New York is sunny with a temperature of 25°C.",
        "london": "It's cloudy in London with a temperature of 15°C.",
        "tokyo": "Tokyo is experiencing light rain and a temperature of 18°C.",
    }

    city_normalized = city.lower()

    if city_normalized in mock_weather_db:
        return mock_weather_db[city_normalized]
    else:
        return f"Sorry, I don't have weather information for '{city}'."
```

## 5. 搭配 Agents 使用不同模型 {#5-using-different-models-with-agents}

### 5.1 使用 Bedrock 模型 {#51-using-bedrock-models}

```python showLineNumbers title="Bedrock model via LiteLLM proxy"
async def test_bedrock_agent():
    print("\n--- Testing Bedrock Claude Agent ---")

    agent = Agent(
        name="weather_agent_bedrock",
        instructions="You are a helpful weather assistant powered by Claude. "
                     "Use the 'get_weather' tool for city weather requests. "
                     "Present information clearly.",
        tools=[get_weather],
    )

    result = await Runner.run(
        agent,
        "What's the weather in Tokyo?",
        run_config=RunConfig(
            model_provider=LITELLM_MODEL_PROVIDER,
            model="bedrock-claude-sonnet-4",  # Uses the model name from your LiteLLM config
        ),
    )
    print(f"<<< Agent Response: {result.final_output}")


asyncio.run(test_bedrock_agent())
```

### 5.2 使用 OpenAI 模型 {#52-using-openai-models}

```python showLineNumbers title="OpenAI model via LiteLLM proxy"
async def test_openai_agent():
    print("\n--- Testing OpenAI GPT Agent ---")

    agent = Agent(
        name="weather_agent_gpt",
        instructions="You are a helpful weather assistant powered by GPT-4o. "
                     "Use the 'get_weather' tool for city weather requests. "
                     "Present information clearly.",
        tools=[get_weather],
    )

    result = await Runner.run(
        agent,
        "What's the weather in London?",
        run_config=RunConfig(
            model_provider=LITELLM_MODEL_PROVIDER,
            model="gpt-4o",  # Uses the model name from your LiteLLM config
        ),
    )
    print(f"<<< Agent Response: {result.final_output}")


asyncio.run(test_openai_agent())
```

### 5.3 使用 Anthropic 模型 {#53-using-anthropic-models}

```python showLineNumbers title="Anthropic model via LiteLLM proxy"
async def test_anthropic_agent():
    print("\n--- Testing Anthropic Claude Agent ---")

    agent = Agent(
        name="weather_agent_claude",
        instructions="You are a helpful weather assistant powered by Claude. "
                     "Use the 'get_weather' tool for city weather requests. "
                     "Present information clearly.",
        tools=[get_weather],
    )

    result = await Runner.run(
        agent,
        "What's the weather in New York?",
        run_config=RunConfig(
            model_provider=LITELLM_MODEL_PROVIDER,
            model="claude-sonnet-4",  # Uses the model name from your LiteLLM config
        ),
    )
    print(f"<<< Agent Response: {result.final_output}")


asyncio.run(test_anthropic_agent())
```

## 6. 完整可運作範例 {#6-complete-working-example}

以下是一個完整的端到端腳本，您可以直接複製並執行：

```python showLineNumbers title="complete_agent.py"
from __future__ import annotations

import asyncio
import os

from openai import AsyncOpenAI

from agents import (
    Agent,
    Model,
    ModelProvider,
    OpenAIChatCompletionsModel,
    RunConfig,
    Runner,
    function_tool,
    set_tracing_disabled,
)

# Point to LiteLLM proxy
BASE_URL = os.getenv("LITELLM_BASE_URL") or "http://localhost:4000"
API_KEY = os.getenv("LITELLM_API_KEY") or "sk-1234"
MODEL_NAME = os.getenv("MODEL_NAME") or "bedrock-claude-sonnet-4"

client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)
set_tracing_disabled(disabled=True)


class LiteLLMModelProvider(ModelProvider):
    def get_model(self, model_name: str | None) -> Model:
        return OpenAIChatCompletionsModel(
            model=model_name or MODEL_NAME,
            openai_client=client,
        )


LITELLM_MODEL_PROVIDER = LiteLLMModelProvider()


@function_tool
def get_weather(city: str) -> str:
    """Retrieves the current weather report for a specified city."""
    print(f"[debug] getting weather for {city}")

    mock_weather_db = {
        "new york": "The weather in New York is sunny with a temperature of 25°C.",
        "london": "It's cloudy in London with a temperature of 15°C.",
        "tokyo": "Tokyo is experiencing light rain and a temperature of 18°C.",
    }

    city_normalized = city.lower()
    if city_normalized in mock_weather_db:
        return mock_weather_db[city_normalized]
    else:
        return f"Sorry, I don't have weather information for '{city}'."


async def main():
    agent = Agent(
        name="Assistant",
        instructions="You are a helpful weather assistant. "
                     "Use the 'get_weather' tool for city weather requests. "
                     "Present information clearly and concisely.",
        tools=[get_weather],
    )

    # Run with the default model (bedrock-claude-sonnet-4)
    result = await Runner.run(
        agent,
        "What's the weather in Tokyo?",
        run_config=RunConfig(model_provider=LITELLM_MODEL_PROVIDER),
    )
    print(result.final_output)

    # Switch to a different model by passing model in RunConfig
    result = await Runner.run(
        agent,
        "What's the weather in London?",
        run_config=RunConfig(
            model_provider=LITELLM_MODEL_PROVIDER,
            model="gpt-4o",
        ),
    )
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
```

## 為什麼要在 Agents SDK 中使用 LiteLLM？ {#why-use-litellm-with-agents-sdk}

| 功能 | 效益 |
|---------|---------|
| **多提供者** | 使用相同的代理程式程式碼搭配 OpenAI、Bedrock、Azure、Vertex AI 等 |
| **成本追蹤** | 追蹤所有代理程式對話的支出 |
| **速率限制** | 為代理程式使用量設定預算與限制 |
| **負載平衡** | 在多個 API 金鑰或區域之間分散請求 |
| **備援** | 若某個模型失敗，自動以不同模型重試 |

## 相關資源 {#related-resources}

- [OpenAI Agents SDK 文件](https://openai.github.io/openai-agents-python/)
- [LiteLLM Proxy 快速入門](../proxy/quick_start)
