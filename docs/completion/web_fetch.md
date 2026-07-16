import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Web Fetch {#web-fetch}

Web fetch 工具可讓 LLM 從指定的網頁和 PDF 文件擷取完整內容。這使 AI 模型能從網際網路存取即時資訊，並將網頁內容納入其回應中。 

## Web Fetch 與 Web Search {#web-fetch-vs-web-search}

**Web Fetch** 會從您提供 URL 的特定網頁擷取完整內容，而 **Web Search** 則會進行網際網路搜尋，根據您的查詢尋找相關資訊。

| 功能 | Web Fetch | Web Search |
|---------|-----------|------------|
| **用途** | 從特定 URL 擷取內容 | 搜尋網際網路上的資訊 |
| **輸入** | 您提供要擷取的精確 URL | 您提供搜尋查詢／問題 |
| **輸出** | 來自指定 URL 的完整頁面內容 | 含有相關資訊的搜尋結果 |
| **使用情境** | - 分析特定文章<br/>- 比較已知網站的內容<br/>- 從特定頁面擷取資料 | - 尋找最新新聞／事件<br/>- 研究主題<br/>- 取得即時資訊 |

**Web Fetch 範例**： "從 https://example.com/pricing 擷取內容並摘要"  
**Web Search 範例**： "本週最新的 AI 發展有哪些？"

**支援的提供者：**
- Anthropic API (`anthropic/`)

**支援的工具類型：**
- `web_fetch_20250910` - 具有限制使用量、網域篩選與引用支援的網頁內容擷取工具

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

# Web fetch tool
tools = [
    {
        "type": "web_fetch_20250910",
        "name": "web_fetch",
        "max_uses": 5,
    }
]

messages = [
    {
        "role": "user", 
        "content": "Please analyze the content at https://example.com/article and summarize the main points"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

### LiteLLM 代理閘道 {#litellm-proxy}

1. 在 config.yaml 中定義 web fetch 模型

```yaml
model_list:
  - model_name: claude-3-5-sonnet-latest # Anthropic claude-3-5-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-5-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 執行 proxy 伺服器

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 進行測試

```python
import os 
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234", # your litellm proxy api key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet-latest",
    messages=[
        {
            "role": "user", 
            "content": "Please fetch and analyze the content from https://news.ycombinator.com and tell me about the top stories"
        }
    ],
    tools=[
        {
            "type": "web_fetch_20250910",
            "name": "web_fetch",
            "max_uses": 5,
        }
    ]
)

print(response)
```

## 支援的模型 {#supported-models}

web fetch 可用於以下 Anthropic API 模型：

- `claude-opus-4-6` (Claude Opus 4.6)
- `claude-sonnet-4-6` (Claude Sonnet 4.6)
- `claude-opus-4-5` (Claude Opus 4.5)
- `claude-sonnet-4-5` (Claude Sonnet 4.5)
- `claude-haiku-4-5` (Claude Haiku 4.5)
- `claude-opus-4-1-20250805` (Claude Opus 4.1)
- `claude-opus-4-20250514` (Claude Opus 4)
- `claude-sonnet-4-20250514` (Claude Sonnet 4)
- `claude-3-7-sonnet-20250219` (Claude Sonnet 3.7)
- `claude-3-5-sonnet-latest` (Claude Sonnet 3.5 v2 - deprecated)
- `claude-3-5-haiku-latest` (Claude Haiku 3.5)

:::note
目前 web fetch 工具不支援透過 JavaScript 動態渲染的網站。
:::

## 使用範例 {#usage-examples}

### 基本網頁內容擷取 {#basic-web-content-retrieval}

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "web_fetch_20250910",
        "name": "web_fetch",
        "max_uses": 3,
    }
]

messages = [
    {
        "role": "user",
        "content": "Fetch the latest news from https://techcrunch.com and summarize the top 3 articles"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

### 研究與分析 {#research-and-analysis}

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "web_fetch_20250910",
        "name": "web_fetch", 
        "max_uses": 10,
    }
]

messages = [
    {
        "role": "user",
        "content": "Research the latest developments in AI by fetching content from multiple tech news websites and provide a comprehensive analysis"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

### 內容比較 {#content-comparison}

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "web_fetch_20250910",
        "name": "web_fetch",
        "max_uses": 5,
    }
]

messages = [
    {
        "role": "user",
        "content": "Compare the pricing information from https://openai.com/pricing and https://anthropic.com/pricing and create a comparison table"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

## 結合多種工具的進階用法 {#advanced-usage-with-multiple-tools}

您可以將 web fetch 與其他工具結合，例如 computer use 或 text editor：

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "web_fetch_20250910",
        "name": "web_fetch",
        "max_uses": 5,
    },
    {
        "type": "text_editor_20250124", 
        "name": "str_replace_editor"
    }
]

messages = [
    {
        "role": "user",
        "content": "Fetch the latest AI research papers from arXiv, analyze them, and create a detailed report file with your findings"
    }
]
    
response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

## 規格 {#spec}

### Web Fetch 工具 (`web_fetch_20250910`) {#web-fetch-tool-web_fetch_20250910}

web fetch 工具支援以下參數：

```json
{
  "type": "web_fetch_20250910",
  "name": "web_fetch",

  // Optional: Limit the number of fetches per request
  "max_uses": 10,

  // Optional: Only fetch from these domains
  "allowed_domains": ["example.com", "docs.example.com"],

  // Optional: Never fetch from these domains
  "blocked_domains": ["private.example.com"],

  // Optional: Enable citations for fetched content
  "citations": {
    "enabled": true
  },

  // Optional: Maximum content length in tokens
  "max_content_tokens": 100000
}
```
