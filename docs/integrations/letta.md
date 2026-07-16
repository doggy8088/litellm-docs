import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Letta 整合 {#letta-integration}

[Letta](https://github.com/letta-ai/letta)（前稱 MemGPT）是一個用於建構具備持久記憶之有狀態 LLM 代理程式的框架。本指南說明如何將 LiteLLM SDK 與 LiteLLM Proxy 皆整合至 Letta，以便在建構具備記憶功能的代理程式時運用多個 LLM 提供者。

## 什麼是 Letta？ {#what-is-letta}

Letta 可讓您建構能夠：
- 在對話之間保留長期記憶
- 使用函式呼叫進行工具互動
- 有效率地處理大型上下文視窗
- 持久化代理程式狀態與記憶

## 前置需求 {#prerequisites}

```bash
uv add letta litellm
```

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

### 1. 啟動 LiteLLM Proxy {#1-start-litellm-proxy}

首先，為您的 LiteLLM proxy 建立設定檔：

```yaml
# config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-35-turbo
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: "2023-07-01-preview"
```

啟動 proxy：

```bash
litellm --config config.yaml --port 4000
```

### 2. 將 Letta 設定為使用 LiteLLM Proxy {#2-configure-letta-with-litellm-proxy}

設定 Letta 使用您的 LiteLLM proxy 端點：

```python
import letta
from letta import create_client

# Configure Letta to use LiteLLM proxy
client = create_client()

# Configure the LLM endpoint
client.set_default_llm_config(
    model="gpt-4",  # This should match a model from your LiteLLM config
    model_endpoint_type="openai",
    model_endpoint="http://localhost:4000",  # Your LiteLLM proxy URL
    context_window=8192
)

# Configure embedding endpoint (optional)
client.set_default_embedding_config(
    embedding_endpoint_type="openai",
    embedding_endpoint="http://localhost:4000",
    embedding_model="text-embedding-ada-002"
)
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

### 1. 設定 LiteLLM SDK {#1-configure-litellm-sdk}

設定您的 API 金鑰與 LiteLLM：

```python
import os
import litellm

# Set your API keys
os.environ["OPENAI_API_KEY"] = "your-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-key"

# Optional: Configure default settings
litellm.set_verbose = True  # For debugging
```

### 2. 為 Letta 建立自訂 LLM 包裝器 {#2-create-custom-llm-wrapper-for-letta}

建立一個使用 LiteLLM SDK 的自訂 LLM 包裝器：

```python
import letta
from letta import create_client
from letta.llm_api.llm_api_base import LLMConfig
import litellm
from typing import List, Dict, Any

class LiteLLMWrapper:
    def __init__(self, model: str):
        self.model = model
    
    def chat_completions_create(self, messages: List[Dict], **kwargs):
        # Use LiteLLM SDK for completion
        response = litellm.completion(
            model=self.model,
            messages=messages,
            **kwargs
        )
        return response

# Configure Letta with custom LiteLLM wrapper
client = create_client()

# Set up LLM configuration using direct SDK integration
llm_config = LLMConfig(
    model="gpt-4",  # or "claude-3-sonnet", "azure/gpt-35-turbo", etc.
    model_endpoint_type="openai",
    context_window=8192
)

client.set_default_llm_config(llm_config)
```

</TabItem>
</Tabs>

### 3. 建立並使用 Letta 代理程式 {#3-create-and-use-a-letta-agent}

<Tabs>
<TabItem value="proxy" label="使用 LiteLLM Proxy">

```python
import letta
from letta import create_client

# Create Letta client
client = create_client()

# Create a new agent
agent_state = client.create_agent(
    name="my-assistant",
    system="You are a helpful assistant with persistent memory.",
    llm_config=client.get_default_llm_config(),
    embedding_config=client.get_default_embedding_config()
)

# Send a message to the agent
response = client.user_message(
    agent_id=agent_state.id,
    message="Hi! My name is Alice and I love reading science fiction books."
)

print(f"Agent response: {response.messages[-1].text}")

# Send another message - the agent will remember previous context
response = client.user_message(
    agent_id=agent_state.id,
    message="What did I tell you about my interests?"
)

print(f"Agent response: {response.messages[-1].text}")
```

</TabItem>
<TabItem value="sdk" label="使用 LiteLLM SDK">

```python
import letta
from letta import create_client
import litellm
import os

# Set up environment variables
os.environ["OPENAI_API_KEY"] = "your-openai-key"

# Create Letta client with LiteLLM integration
client = create_client()

# Create a new agent
agent_state = client.create_agent(
    name="my-assistant",
    system="You are a helpful assistant with persistent memory.",
    llm_config=client.get_default_llm_config(),
    embedding_config=client.get_default_embedding_config()
)

# Send a message to the agent
response = client.user_message(
    agent_id=agent_state.id,
    message="Hi! My name is Alice and I love reading science fiction books."
)

print(f"Agent response: {response.messages[-1].text}")

# Send another message - the agent will remember previous context
response = client.user_message(
    agent_id=agent_state.id,
    message="What did I tell you about my interests?"
)

print(f"Agent response: {response.messages[-1].text}")
```

</TabItem>
</Tabs>

## 進階設定 {#advanced-configuration}

### 為不同代理程式使用不同模型 {#using-different-models-for-different-agents}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

```python
from letta import LLMConfig, EmbeddingConfig

# Create different LLM configurations pointing to your proxy
gpt4_config = LLMConfig(
    model="gpt-4",
    model_endpoint_type="openai",
    model_endpoint="http://localhost:4000",
    context_window=8192
)

claude_config = LLMConfig(
    model="claude-3-sonnet",
    model_endpoint_type="openai",  # Using OpenAI-compatible endpoint
    model_endpoint="http://localhost:4000",
    context_window=200000
)

# Create agents with different configurations
research_agent = client.create_agent(
    name="research-agent",
    system="You are a research assistant specialized in analysis.",
    llm_config=claude_config  # Use Claude for research tasks
)

creative_agent = client.create_agent(
    name="creative-agent", 
    system="You are a creative writing assistant.",
    llm_config=gpt4_config  # Use GPT-4 for creative tasks
)
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python
import os
import litellm
from letta import LLMConfig, EmbeddingConfig

# Set up API keys for different providers
os.environ["OPENAI_API_KEY"] = "your-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-key"

# Create different LLM configurations for direct SDK usage
gpt4_config = LLMConfig(
    model="openai/gpt-4",  # Using LiteLLM model format
    model_endpoint_type="openai",
    context_window=8192
)

claude_config = LLMConfig(
    model="anthropic/claude-3-sonnet-20240229",  # Using LiteLLM model format
    model_endpoint_type="openai",
    context_window=200000
)

# Create agents with different configurations
research_agent = client.create_agent(
    name="research-agent",
    system="You are a research assistant specialized in analysis.",
    llm_config=claude_config  # Use Claude for research tasks
)

creative_agent = client.create_agent(
    name="creative-agent", 
    system="You are a creative writing assistant.",
    llm_config=gpt4_config  # Use GPT-4 for creative tasks
)
```

</TabItem>
</Tabs>

### 搭配工具使用函式呼叫 {#function-calling-with-tools}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

```python
# Define custom tools for your agent
def search_web(query: str) -> str:
    """Search the web for information"""
    # Your web search implementation
    return f"Search results for: {query}"

def save_note(content: str) -> str:
    """Save a note to persistent storage"""
    # Your note saving implementation
    return f"Note saved: {content}"

# Create agent with tools (using proxy endpoint)
agent_state = client.create_agent(
    name="research-assistant",
    system="You are a research assistant that can search the web and save notes.",
    llm_config=client.get_default_llm_config(),
    embedding_config=client.get_default_embedding_config(),
    tools=[search_web, save_note]
)

# The agent can now use these tools
response = client.user_message(
    agent_id=agent_state.id,
    message="Search for recent developments in AI and save important findings."
)
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python
import litellm
import os

# Set up API keys
os.environ["OPENAI_API_KEY"] = "your-openai-key"

# Define custom tools for your agent
def search_web(query: str) -> str:
    """Search the web for information"""
    # Your web search implementation
    return f"Search results for: {query}"

def save_note(content: str) -> str:
    """Save a note to persistent storage"""
    # Your note saving implementation
    return f"Note saved: {content}"

# Create agent with tools (using LiteLLM SDK directly)
agent_state = client.create_agent(
    name="research-assistant",
    system="You are a research assistant that can search the web and save notes.",
    llm_config=LLMConfig(
        model="openai/gpt-4",  # Direct model specification
        model_endpoint_type="openai",
        context_window=8192
    ),
    embedding_config=client.get_default_embedding_config(),
    tools=[search_web, save_note]
)

# The agent can now use these tools
response = client.user_message(
    agent_id=agent_state.id,
    message="Search for recent developments in AI and save important findings."
)
```

</TabItem>
</Tabs>

## 驗證 {#authentication}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy 驗證">

如果您的 LiteLLM proxy 需要驗證：

```python
import os
from letta import LLMConfig

# Set up authenticated configuration
llm_config = LLMConfig(
    model="gpt-4",
    model_endpoint_type="openai",
    model_endpoint="http://localhost:4000",
    model_wrapper="openai",
    context_window=8192
)

# If using API keys with your proxy
os.environ["OPENAI_API_KEY"] = "your-litellm-proxy-api-key"

client = create_client()
client.set_default_llm_config(llm_config)
```

對於已啟用驗證的 proxy：

```yaml
# config.yaml with auth
general_settings:
  master_key: "your-master-key"

model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
```

```python
# Configure Letta with authenticated proxy
llm_config = LLMConfig(
    model="gpt-4",
    model_endpoint_type="openai",
    model_endpoint="http://localhost:4000",
    context_window=8192,
    api_key="your-master-key"  # Proxy master key
)
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK 驗證">

使用 LiteLLM SDK 時，直接設定您的提供者 API 金鑰：

```python
import os
import litellm

# Set up API keys for different providers
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key" 
os.environ["AZURE_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_API_BASE"] = "https://your-resource.openai.azure.com"
os.environ["AZURE_API_VERSION"] = "2023-07-01-preview"

# Optional: Configure default settings
litellm.api_key = os.environ.get("OPENAI_API_KEY")  # Default key
litellm.set_verbose = True  # For debugging

# Use in Letta configuration
from letta import LLMConfig

llm_config = LLMConfig(
    model="openai/gpt-4",  # Will use OPENAI_API_KEY automatically
    model_endpoint_type="openai",
    context_window=8192
)

# Or for Azure
azure_config = LLMConfig(
    model="azure/gpt-35-turbo", 
    model_endpoint_type="openai",
    context_window=4096
)
```

</TabItem>
</Tabs>

## 負載平衡與備援 {#load-balancing-and-fallbacks}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy 功能">

LiteLLM proxy 的負載平衡與備援功能可與 Letta 無縫搭配：

```yaml
# config.yaml with fallbacks
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
    tpm: 40000
    rpm: 500

  - model_name: gpt-4  # Same model name for fallback
    litellm_params:
      model: azure/gpt-4
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: "2023-07-01-preview"
    tpm: 80000
    rpm: 800

router_settings:
  routing_strategy: "usage-based-routing"
  fallbacks: [{"gpt-4": ["azure/gpt-4"]}]
```

proxy 會為 Letta 透明地處理所有路由、負載平衡與備援。

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK 路由器">

使用 LiteLLM SDK，您可以以程式方式設定路由與備援：

```python
import litellm
from litellm import Router

# Configure router with multiple models
router = Router(
    model_list=[
        {
            "model_name": "gpt-4",
            "litellm_params": {
                "model": "openai/gpt-4",
                "api_key": os.environ["OPENAI_API_KEY"]
            },
            "tpm": 40000,
            "rpm": 500
        },
        {
            "model_name": "gpt-4",  # Same name for fallback
            "litellm_params": {
                "model": "azure/gpt-4", 
                "api_key": os.environ["AZURE_API_KEY"],
                "api_base": os.environ["AZURE_API_BASE"],
                "api_version": "2023-07-01-preview"
            },
            "tpm": 80000,
            "rpm": 800
        }
    ],
    fallbacks=[{"gpt-4": ["azure/gpt-4"]}],
    routing_strategy="usage-based-routing"
)

# Create custom completion function for Letta
def custom_completion(messages, model="gpt-4", **kwargs):
    return router.completion(
        model=model,
        messages=messages,
        **kwargs
    )

# Use with Letta by monkey-patching or custom wrapper
litellm.completion = custom_completion
```

</TabItem>
</Tabs>

## 監控與可觀測性 {#monitoring-and-observability}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy 監控">

啟用記錄，以透過 proxy 追蹤您的 Letta 代理程式的 LLM 使用情況：

```yaml
# config.yaml with logging
model_list:
  # ... your models

litellm_settings:
  success_callback: ["langfuse"]  # or other observability tools
  
environment_variables:
  LANGFUSE_PUBLIC_KEY: "your-key"
  LANGFUSE_SECRET_KEY: "your-secret"
```

在 proxy 儀表板中檢視指標：
```bash
# Start proxy with UI
litellm --config config.yaml --port 4000 --detailed_debug
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK 監控">

直接在您的 SDK 整合中設定可觀測性：

```python
import litellm
import os

# Configure observability callbacks
os.environ["LANGFUSE_PUBLIC_KEY"] = "your-key"
os.environ["LANGFUSE_SECRET_KEY"] = "your-secret"

# Set global callbacks
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

# Optional: Set up custom logging
litellm.set_verbose = True

# Create custom completion wrapper with logging
def logged_completion(messages, model="gpt-4", **kwargs):
    try:
        response = litellm.completion(
            model=model,
            messages=messages,
            **kwargs
        )
        # Custom logging logic here if needed
        return response
    except Exception as e:
        # Custom error handling
        print(f"LLM call failed: {e}")
        raise

# Use in Letta configuration
litellm.completion = logged_completion
```

</TabItem>
</Tabs>

## 範例：多代理程式系統 {#example-multi-agent-system}

<Tabs>
<TabItem value="proxy" label="使用 LiteLLM Proxy">

```python
import letta
from letta import create_client, LLMConfig

client = create_client()

# Create specialized agents using proxy endpoints
agents = {}

# Research agent using Claude for analysis
agents['researcher'] = client.create_agent(
    name="researcher",
    system="You are a research specialist. Analyze information thoroughly.",
    llm_config=LLMConfig(
        model="claude-3-sonnet",
        model_endpoint="http://localhost:4000",
        model_endpoint_type="openai"
    )
)

# Writer agent using GPT-4 for content creation
agents['writer'] = client.create_agent(
    name="writer",
    system="You are a content writer. Create engaging, well-structured content.",
    llm_config=LLMConfig(
        model="gpt-4",
        model_endpoint="http://localhost:4000", 
        model_endpoint_type="openai"
    )
)

# Coordinator workflow
def research_and_write_workflow(topic: str):
    # Research phase
    research_response = client.user_message(
        agent_id=agents['researcher'].id,
        message=f"Research the topic: {topic}. Provide key insights and data."
    )
    
    research_results = research_response.messages[-1].text
    
    # Writing phase
    write_response = client.user_message(
        agent_id=agents['writer'].id,
        message=f"Based on this research: {research_results}\n\nWrite an article about {topic}."
    )
    
    return write_response.messages[-1].text

# Execute workflow
article = research_and_write_workflow("The future of AI in healthcare")
print(article)
```

</TabItem>
<TabItem value="sdk" label="使用 LiteLLM SDK">

```python
import letta
from letta import create_client, LLMConfig
import litellm
import os

# Set up environment
os.environ["OPENAI_API_KEY"] = "your-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-key"

client = create_client()

# Create specialized agents using direct SDK models
agents = {}

# Research agent using Claude for analysis
agents['researcher'] = client.create_agent(
    name="researcher",
    system="You are a research specialist. Analyze information thoroughly.",
    llm_config=LLMConfig(
        model="anthropic/claude-3-sonnet-20240229",
        model_endpoint_type="openai"
    )
)

# Writer agent using GPT-4 for content creation
agents['writer'] = client.create_agent(
    name="writer",
    system="You are a content writer. Create engaging, well-structured content.",
    llm_config=LLMConfig(
        model="openai/gpt-4",
        model_endpoint_type="openai"
    )
)

# Cost-conscious agent using GPT-3.5
agents['reviewer'] = client.create_agent(
    name="reviewer",
    system="You are an editor. Review and improve content quality.",
    llm_config=LLMConfig(
        model="openai/gpt-3.5-turbo",
        model_endpoint_type="openai"
    )
)

# Enhanced workflow with multiple agents
def enhanced_workflow(topic: str):
    # Research phase
    research_response = client.user_message(
        agent_id=agents['researcher'].id,
        message=f"Research the topic: {topic}. Provide key insights and data."
    )
    
    research_results = research_response.messages[-1].text
    
    # Writing phase
    write_response = client.user_message(
        agent_id=agents['writer'].id,
        message=f"Based on this research: {research_results}\n\nWrite an article about {topic}."
    )
    
    draft_article = write_response.messages[-1].text
    
    # Review phase
    review_response = client.user_message(
        agent_id=agents['reviewer'].id,
        message=f"Please review and improve this article:\n\n{draft_article}"
    )
    
    return review_response.messages[-1].text

# Execute enhanced workflow
article = enhanced_workflow("The future of AI in healthcare")
print(article)
```

</TabItem>
</Tabs>

## 最佳做法 {#best-practices}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy 最佳做法">

1. **模型選擇**：針對不同任務使用適當的模型：
   - 用 Claude 進行分析與推理
   - 用 GPT-4 進行創意任務
   - 用 GPT-3.5-turbo 處理簡單互動

2. **Proxy 設定**：
   - 設定適當的速率限制與逾時
   - 使用備援以提升可靠性
   - 為正式環境啟用驗證

3. **記憶管理**：Letta 會自動處理記憶，但在大型上下文時請監控使用量

4. **成本優化**：
   - 使用 proxy 的預算功能來控制成本
   - 針對每位使用者／團隊設定速率限制
   - 透過 proxy 儀表板監控 token 使用量

5. **監控**：啟用可觀測性以追蹤代理程式效能與 token 使用量

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK 最佳做法">

1. **模型選擇**：根據任務需求選擇模型：
   - 使用 `openai/gpt-4` 進行複雜推理
   - 使用 `anthropic/claude-3-sonnet-20240229` 進行分析
   - 使用 `openai/gpt-3.5-turbo` 處理具成本效益的簡單任務

2. **錯誤處理**：實作具重試功能的健全錯誤處理：
   ```python
   import litellm
   from litellm import completion
   
   # Set up retry logic
   litellm.num_retries = 3
   litellm.request_timeout = 60
   
   # Custom error handling
   def safe_completion(**kwargs):
       try:
           return completion(**kwargs)
       except Exception as e:
           print(f"LLM call failed: {e}")
           # Implement fallback logic
           return completion(model="openai/gpt-3.5-turbo", **kwargs)
   ```

3. **成本管理**：
   - 對非關鍵任務使用較便宜的模型
   - 實作 token 計數與預算
   - 在適當情況下快取回應

4. **效能**：
   - 使用非同步操作處理並行請求
   - 實作連線池
   - 監控回應時間

5. **安全性**：
   - 安全地儲存 API 金鑰（環境變數）
   - 定期輪換金鑰
   - 實作速率限制

</TabItem>
</Tabs>

## 疑難排解 {#troubleshooting}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy 問題">

### 連線問題 {#connection-issues}
```bash
# Test your LiteLLM proxy
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 設定除錯 {#configuration-debugging}
```python
# Enable verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test Letta configuration
client = create_client()
print(client.get_default_llm_config())
```

### 常見 Proxy 問題 {#common-proxy-issues}
- **連接埠衝突**：請確認 4000 連接埠未被使用
- **找不到模型**：驗證模型名稱是否與您的 config.yaml 相符
- **驗證錯誤**：檢查 master key 設定
- **速率限制**：監控 proxy 記錄中是否有觸發 rate limit

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK 問題">

### API 金鑰問題 {#api-key-issues}
```python
import os
import litellm

# Check if API keys are set
print("OpenAI Key:", os.environ.get("OPENAI_API_KEY", "Not set"))
print("Anthropic Key:", os.environ.get("ANTHROPIC_API_KEY", "Not set"))

# Test direct LiteLLM call
try:
    response = litellm.completion(
        model="openai/gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("LiteLLM working:", response.choices[0].message.content)
except Exception as e:
    print("LiteLLM error:", e)
```

### 設定除錯 {#configuration-debugging-1}
```python
# Enable verbose logging
litellm.set_verbose = True

# Test model availability
models = ["openai/gpt-4", "anthropic/claude-3-sonnet-20240229"]
for model in models:
    try:
        response = litellm.completion(
            model=model,
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=10
        )
        print(f"✓ {model} working")
    except Exception as e:
        print(f"✗ {model} failed: {e}")
```

### 常見 SDK 問題 {#common-sdk-issues}
- **匯入錯誤**：請確保已執行 `uv add litellm letta`
- **模型格式**：使用 `provider/model` 格式（例如，`openai/gpt-4`）
- **API 金鑰格式**：不同提供者有不同的金鑰格式
- **速率限制**：為重試實作指數退避

</TabItem>
</Tabs>

## 資源 {#resources}

- [Letta 文件](https://docs.letta.com/)
- [LiteLLM Proxy 文件](/docs/simple_proxy)
- [LiteLLM SDK 文件](/docs/#litellm-python-sdk)
- [函式呼叫指南](/docs/completion/function_call)
- [可觀測性設定](/docs/integrations/observability_integrations)
- [路由設定](/docs/routing)
