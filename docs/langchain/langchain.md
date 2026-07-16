import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 ChatLiteLLM() - Langchain {#using-chatlitellm---langchain}

## 先決條件 {#pre-requisites}
```shell
!uv add litellm langchain
```
## 快速開始 {#quick-start}

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
import os
from langchain_community.chat_models import ChatLiteLLM
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

os.environ['OPENAI_API_KEY'] = ""
chat = ChatLiteLLM(model="gpt-3.5-turbo")
messages = [
    HumanMessage(
        content="what model are you"
    )
]
chat.invoke(messages)
```

</TabItem>

<TabItem value="anthropic" label="Anthropic">

```python
import os
from langchain_community.chat_models import ChatLiteLLM
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

os.environ['ANTHROPIC_API_KEY'] = ""
chat = ChatLiteLLM(model="claude-2", temperature=0.3)
messages = [
    HumanMessage(
        content="what model are you"
    )
]
chat.invoke(messages)
```

</TabItem>

<TabItem value="replicate" label="Replicate">

```python
import os
from langchain_community.chat_models import ChatLiteLLM
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

os.environ['REPLICATE_API_TOKEN'] = ""
chat = ChatLiteLLM(model="replicate/llama-2-70b-chat:2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1")
messages = [
    HumanMessage(
        content="what model are you?"
    )
]
chat.invoke(messages)
```

</TabItem>

<TabItem value="cohere" label="Cohere">

```python
import os
from langchain_community.chat_models import ChatLiteLLM
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

os.environ['COHERE_API_KEY'] = ""
chat = ChatLiteLLM(model="command-nightly")
messages = [
    HumanMessage(
        content="what model are you?"
    )
]
chat.invoke(messages)
```

</TabItem>
</Tabs>

## 使用 Langchain ChatLiteLLM 搭配 MLflow {#use-langchain-chatlitellm-with-mlflow}

MLflow 為 ChatLiteLLM 提供開源可觀測性解決方案。

若要啟用整合，只要先在程式碼中呼叫 `mlflow.litellm.autolog()` 即可。無需其他設定。

```python
import mlflow

mlflow.litellm.autolog()
```

啟用自動追蹤後，您可以呼叫 `ChatLiteLLM`，並在 MLflow 中查看已記錄的追蹤。

```python
import os
from langchain.chat_models import ChatLiteLLM

os.environ['OPENAI_API_KEY']="sk-..."

chat = ChatLiteLLM(model="gpt-4o-mini")
chat.invoke("Hi!")
```

## 使用 Langchain ChatLiteLLM 搭配 Lunary {#use-langchain-chatlitellm-with-lunary}
```python
import os
from langchain.chat_models import ChatLiteLLM
from langchain.schema import HumanMessage
import litellm

os.environ["LUNARY_PUBLIC_KEY"] = "" # from https://app.lunary.ai/settings
os.environ['OPENAI_API_KEY']="sk-..."

litellm.success_callback = ["lunary"] 
litellm.failure_callback = ["lunary"] 

chat = ChatLiteLLM(
  model="gpt-4o"
  messages = [
    HumanMessage(
        content="what model are you"
    )
]
chat(messages)
```

更多詳細資訊請見[此處](../observability/lunary_integration.md)

## 使用 LangChain ChatLiteLLM + Langfuse {#use-langchain-chatlitellm--langfuse}
請查看[此處](../observability/langfuse_integration#use-langchain-chatlitellm--langfuse)這個章節，以了解更多關於如何將 Langfuse 與 ChatLiteLLM 整合的資訊。

## 在 LangChain 和 LiteLLM 中使用標籤 {#using-tags-with-langchain-and-litellm}

標籤是 LiteLLM 中一項強大的功能，可讓您將 LLM 請求分類、篩選並追蹤。當搭配 LiteLLM 使用 LangChain 時，您可以透過中繼資料中的 `extra_body` 參數傳遞標籤。

### 基本標籤用法 {#basic-tag-usage}

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

os.environ['OPENAI_API_KEY'] = "sk-your-key-here"

chat = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    extra_body={
        "metadata": {
            "tags": ["production", "customer-support", "high-priority"]
        }
    }
)

messages = [
    SystemMessage(content="You are a helpful customer support assistant."),
    HumanMessage(content="How do I reset my password?")
]

response = chat.invoke(messages)
print(response)
```

</TabItem>

<TabItem value="anthropic" label="Anthropic">

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

os.environ['ANTHROPIC_API_KEY'] = "sk-ant-your-key-here"

chat = ChatOpenAI(
    model="claude-3-sonnet-20240229",
    temperature=0.7,
    extra_body={
        "metadata": {
            "tags": ["research", "analysis", "claude-model"]
        }
    }
)

messages = [
    SystemMessage(content="You are a research analyst."),
    HumanMessage(content="Analyze this market trend...")
]

response = chat.invoke(messages)
print(response)
```

</TabItem>

<TabItem value="litellm-proxy" label="LiteLLM Proxy">

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# No API key needed when using proxy
chat = ChatOpenAI(
    openai_api_base="http://localhost:4000",  # Your proxy URL
    model="gpt-4o",
    temperature=0.7,
    extra_body={
        "metadata": {
            "tags": ["proxy", "team-alpha", "feature-flagged"],
            "generation_name": "customer-onboarding",
            "trace_user_id": "user-12345"
        }
    }
)

messages = [
    SystemMessage(content="You are an onboarding assistant."),
    HumanMessage(content="Welcome our new customer!")
]

response = chat.invoke(messages)
print(response)
```

</TabItem>
</Tabs>

### 進階標籤模式 {#advanced-tag-patterns}

#### 根據內容動態標籤 {#dynamic-tags-based-on-context}

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

def create_chat_with_tags(user_type: str, feature: str):
    """Create a chat instance with dynamic tags based on context"""
    
    # Build tags dynamically
    tags = ["langchain-integration"]
    
    if user_type == "premium":
        tags.extend(["premium-user", "high-priority"])
    elif user_type == "enterprise":
        tags.extend(["enterprise", "custom-sla"])
    else:
        tags.append("standard-user")
    
    # Add feature-specific tags
    if feature == "code-review":
        tags.extend(["development", "code-analysis"])
    elif feature == "content-gen":
        tags.extend(["marketing", "content-creation"])
    
    return ChatOpenAI(
        openai_api_base="http://localhost:4000",
        model="gpt-4o",
        temperature=0.7,
        extra_body={
            "metadata": {
                "tags": tags,
                "user_type": user_type,
                "feature": feature,
                "trace_user_id": f"user-{user_type}-{feature}"
            }
        }
    )

# Usage examples
premium_chat = create_chat_with_tags("premium", "code-review")
enterprise_chat = create_chat_with_tags("enterprise", "content-gen")

messages = [HumanMessage(content="Help me with this task")]
response = premium_chat.invoke(messages)
```

#### 用於成本追蹤與分析的標籤 {#tags-for-cost-tracking-and-analytics}

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Tags for cost tracking
cost_tracking_chat = ChatOpenAI(
    openai_api_base="http://localhost:4000",
    model="gpt-4o",
    temperature=0.7,
    extra_body={
        "metadata": {
            "tags": [
                "cost-center-marketing",
                "budget-q4-2024",
                "project-launch-campaign",
                "high-cost-model"  # Flag for expensive models
            ],
            "department": "marketing",
            "project_id": "campaign-2024-q4",
            "cost_threshold": "high"
        }
    }
)

messages = [
    SystemMessage(content="You are a marketing copywriter."),
    HumanMessage(content="Create compelling ad copy for our new product launch.")
]

response = cost_tracking_chat.invoke(messages)
```

#### 用於 A/B 測試的標籤 {#tags-for-ab-testing}

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import random

def create_ab_test_chat(test_variant: str = None):
    """Create chat instance for A/B testing with appropriate tags"""
    
    if test_variant is None:
        test_variant = random.choice(["variant-a", "variant-b"])
    
    return ChatOpenAI(
        openai_api_base="http://localhost:4000",
        model="gpt-4o",
        temperature=0.7 if test_variant == "variant-a" else 0.9,  # Different temp for variants
        extra_body={
            "metadata": {
                "tags": [
                    "ab-test-experiment-1",
                    f"variant-{test_variant}",
                    "temperature-test",
                    "user-experience"
                ],
                "experiment_id": "ab-test-001",
                "variant": test_variant,
                "test_group": "temperature-optimization"
            }
        }
    )

# Run A/B test
variant_a_chat = create_ab_test_chat("variant-a")
variant_b_chat = create_ab_test_chat("variant-b")

test_message = [HumanMessage(content="Explain quantum computing in simple terms")]

response_a = variant_a_chat.invoke(test_message)
response_b = variant_b_chat.invoke(test_message)
```

### 標籤最佳實務 {#tag-best-practices}

#### 1. **一致的命名慣例** {#1-consistent-naming-convention}
```python
# ✅ Good: Consistent, descriptive tags
tags = ["production", "api-v2", "customer-support", "urgent"]

# ❌ Avoid: Inconsistent or unclear tags
tags = ["prod", "v2", "support", "urgent123"]
```

#### 2. **階層式標籤** {#2-hierarchical-tags}
```python
# ✅ Good: Hierarchical structure
tags = ["env:production", "team:backend", "service:api", "priority:high"]

# This allows for easy filtering and grouping
```

#### 3. **包含內容資訊** {#3-include-context-information}
```python
extra_body={
    "metadata": {
        "tags": ["production", "user-onboarding"],
        "user_id": "user-12345",
        "session_id": "session-abc123",
        "feature_flag": "new-onboarding-flow",
        "environment": "production"
    }
}
```

#### 4. **標籤類別** {#4-tag-categories}
考慮將標籤整理成以下類別：
- **環境**：`production`, `staging`, `development`
- **團隊/服務**：`backend`, `frontend`, `api`, `worker`
- **功能**：`authentication`, `payment`, `notification`
- **優先順序**：`critical`, `high`, `medium`, `low`
- **使用者類型**：`premium`, `enterprise`, `free`

### 在 LiteLLM Proxy 中使用標籤 {#using-tags-with-litellm-proxy}

使用 LiteLLM Proxy 搭配標籤時，您可以：

1. **根據標籤篩選請求**
2. **依標籤追蹤成本**，顯示於支出報表中
3. **根據標籤套用路由規則**
4. **使用基於標籤的分析監控用量**

#### 含標籤的範例 Proxy 設定 {#example-proxy-configuration-with-tags}

```yaml
# config.yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: your-key

# Tag-based routing rules
tag_routing:
  - tags: ["premium", "high-priority"]
    models: ["gpt-4o", "claude-3-opus"]
  - tags: ["standard"]
    models: ["gpt-3.5-turbo", "claude-3-haiku"]
```

### 監控與分析 {#monitoring-and-analytics}

標籤可啟用強大的分析功能：

```python
# Example: Get spend reports by tags
import requests

response = requests.get(
    "http://localhost:4000/global/spend/report",
    headers={"Authorization": "Bearer sk-your-key"},
    params={
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "group_by": "tags"
    }
)

spend_by_tags = response.json()
```

本文件涵蓋了在 LangChain 和 LiteLLM 中有效使用標籤的核心模式，讓您能更好地組織、追蹤並分析您的 LLM 請求。
