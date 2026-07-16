import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Bedrock 知識庫 {#bedrock-knowledge-bases}

AWS Bedrock Knowledge Bases 可讓您將 LLM 連接至您組織的資料，讓模型擷取並參照與您業務相關的資訊。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Bedrock Knowledge Bases 將您的資料連接至 LLM，讓它們能在回應中擷取並參照您組織的資訊。 |
| LiteLLM 提供者路由 | `bedrock` 於 litellm vector_store_registry 中 |
| 提供者文件 | [AWS Bedrock Knowledge Bases ↗](https://aws.amazon.com/bedrock/knowledge-bases/) |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Example using LiteLLM Python SDK"
import os
import litellm

from litellm.vector_stores.vector_store_registry import VectorStoreRegistry, LiteLLM_ManagedVectorStore

# Init vector store registry with your Bedrock Knowledge Base
litellm.vector_store_registry = VectorStoreRegistry(
    vector_stores=[
        LiteLLM_ManagedVectorStore(
            vector_store_id="YOUR_KNOWLEDGE_BASE_ID",  # KB ID from AWS Bedrock
            custom_llm_provider="bedrock"
        )
    ]
)

# Make a completion request using your Knowledge Base
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet", 
    messages=[{"role": "user", "content": "What does our company policy say about remote work?"}],
    tools=[
        {
            "type": "file_search",
            "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"]
        }
    ],
)

print(response.choices[0].message.content)
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 設定您的 vector_store_registry {#1-configure-your-vector_store_registry}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml
model_list:
  - model_name: claude-3-5-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_API_KEY

vector_store_registry:
  - vector_store_name: "bedrock-company-docs"
    litellm_params:
      vector_store_id: "YOUR_KNOWLEDGE_BASE_ID"
      custom_llm_provider: "bedrock"
      vector_store_description: "Bedrock Knowledge Base for company documents"
      vector_store_metadata:
        source: "Company internal documentation"
```

</TabItem>

<TabItem value="litellm-ui" label="LiteLLM UI">

在 LiteLLM UI 中，前往 Experimental > Vector Stores > Create Vector Store。在此頁面中，您可以建立具有名稱、vector store id 和憑證的 vector store。

<Image 
  img={require('../../img/kb_2.png')}
  style={{width: '50%'}}
/>

</TabItem>
</Tabs>

#### 2. 使用 vector_store_ids 參數發出請求 {#2-make-a-request-with-vector_store_ids-parameter}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "What does our company policy say about remote work?"}],
    "tools": [
        {
            "type": "file_search",
            "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"]
        }
    ]
  }'
```

</TabItem>

<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

# Make a completion request with vector_store_ids parameter
response = client.chat.completions.create(
    model="claude-3-5-sonnet",
    messages=[{"role": "user", "content": "What does our company policy say about remote work?"}],
    tools=[
        {
            "type": "file_search",
            "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"]
        }
    ]
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 篩選結果 {#filter-results}

依中繼資料屬性篩選。

**運算子**（OpenAI 樣式，自動轉譯）：
- `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`

**AWS 運算子**（直接使用）：
- `equals`, `notEquals`, `greaterThan`, `greaterThanOrEquals`, `lessThan`, `lessThanOrEquals`, `in`, `notIn`, `startsWith`, `listContains`, `stringContains`

<Tabs>
<TabItem value="single-filter" label="單一篩選器">

```python
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet",
    messages=[{"role": "user", "content": "What are the latest updates?"}],
    tools=[{
        "type": "file_search",
        "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"],
        "filters": {
            "key": "category",
            "value": "updates",
            "operator": "eq"
        }
    }]
)
```

</TabItem>

<TabItem value="and-filters" label="AND">

```python
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet",
    messages=[{"role": "user", "content": "What are the policies?"}],
    tools=[{
        "type": "file_search",
        "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"],
        "filters": {
            "and": [
                {"key": "category", "value": "policy", "operator": "eq"},
                {"key": "year", "value": 2024, "operator": "gte"}
            ]
        }
    }]
)
```

</TabItem>

<TabItem value="or-filters" label="OR">

```python
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet",
    messages=[{"role": "user", "content": "Show me technical docs"}],
    tools=[{
        "type": "file_search",
        "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"],
        "filters": {
            "or": [
                {"key": "category", "value": "api", "operator": "eq"},
                {"key": "category", "value": "sdk", "operator": "eq"}
            ]
        }
    }]
)
```

</TabItem>

<TabItem value="advanced-filters" label="AWS 運算子">

```python
response = await litellm.acompletion(
    model="anthropic/claude-3-5-sonnet",
    messages=[{"role": "user", "content": "Find docs"}],
    tools=[{
        "type": "file_search",
        "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"],
        "filters": {
            "and": [
                {"key": "title", "value": "Guide", "operator": "stringContains"},
                {"key": "tags", "value": "important", "operator": "listContains"}
            ]
        }
    }]
)
```

</TabItem>

<TabItem value="proxy-filters" label="Proxy">

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "What are our policies?"}],
    "tools": [{
        "type": "file_search",
        "vector_store_ids": ["YOUR_KNOWLEDGE_BASE_ID"],
        "filters": {
            "and": [
                {"key": "department", "value": "engineering", "operator": "eq"},
                {"key": "type", "value": "policy", "operator": "eq"}
            ]
        }
    }]
  }'
```

</TabItem>
</Tabs>

## 存取搜尋結果 {#accessing-search-results}

了解如何在回應中存取 vector store 搜尋結果：
- [存取搜尋結果（非串流與串流）](../completion/knowledgebase#accessing-search-results-citations)

## 延伸閱讀 {#further-reading}

Vector Stores：
- [Always on Vector Stores](https://docs.litellm.ai/docs/completion/knowledgebase#always-on-for-a-model)
- [在 litellm proxy 上列出可用的 vector stores](https://docs.litellm.ai/docs/completion/knowledgebase#listing-available-vector-stores)
- [LiteLLM Vector Stores 的運作方式](https://docs.litellm.ai/docs/completion/knowledgebase#how-it-works)
