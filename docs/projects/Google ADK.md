# Google ADK（Agent Development Kit） {#google-adk-agent-development-kit}

[Google ADK](https://github.com/google/adk-python) 是一個開源、以程式碼為先的 Python 框架，用於建置、評估與部署複雜的 AI 代理程式。雖然針對 Gemini 進行最佳化，ADK 仍具備模型無關性，並支援 LiteLLM 以使用 100+ 提供者。

```python
from google.adk.agents.llm_agent import Agent
from google.adk.models.lite_llm import LiteLlm

root_agent = Agent(
    model=LiteLlm(model="openai/gpt-4o"),  # Or any LiteLLM-supported model
    name="my_agent",
    description="An agent using LiteLLM",
    instruction="You are a helpful assistant.",
    tools=[your_tools],
)
```

- [GitHub](https://github.com/google/adk-python)
- [文件](https://google.github.io/adk-docs)
- [LiteLLM 範例](https://github.com/google/adk-python/tree/main/contributing/samples/hello_world_litellm)
