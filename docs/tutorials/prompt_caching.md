import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自動注入提示快取檢查點 {#auto-inject-prompt-caching-checkpoints}

透過使用 LiteLLM 自動注入提示快取檢查點，最多可將成本降低 90%。

<Image img={require('../../img/auto_prompt_caching.png')}  style={{ width: '800px', height: 'auto' }} />

支援的提供者（`cache_control` 標記）：
- Anthropic API (`anthropic/`)
- AWS Bedrock - Claude (`bedrock/`)
- Vertex AI - Claude and Gemini (`vertex_ai/`)
- Google AI Studio - Gemini (`gemini/`)
- Azure AI - Claude (`azure_ai/`)
- OpenRouter - Claude, Gemini, MiniMax, GLM, z-ai routes (`openrouter/`)
- Databricks - Claude (`databricks/`)
- DashScope / Qwen (`dashscope/`)
- MiniMax (`minimax/`)
- Z.ai / GLM (`zai/`)

提供者代管（自動，無需標記）：
- OpenAI (`openai/`)
- DeepSeek (`deepseek/`)
- xAI (`xai/`)

## 運作方式 {#how-it-works}

LiteLLM 可自動將提示快取檢查點注入到您對 LLM 提供者的請求中。這可帶來：

- **降低成本**：提示中長且靜態的部分可被快取，以避免重複處理
- **無需修改應用程式程式碼**：您可以在 LiteLLM UI 或 `litellm config.yaml` 檔案中設定自動快取行為。

## 設定 {#configuration}

您需要在模型設定中指定 `cache_control_injection_points`。這會告訴 LiteLLM：
1. 要在哪裡加入快取指令（`location`）
2. 要針對哪則訊息（`role`）

接著，LiteLLM 會自動將 `cache_control` 指令加入您請求中指定的訊息：

```json showLineNumbers title="cache_control_directive.json"
"cache_control": {
    "type": "ephemeral"
}
```

## LiteLLM Python SDK 使用方式 {#litellm-python-sdk-usage}

在您的 completion 呼叫中使用 `cache_control_injection_points` 參數，即可自動注入快取指令。

#### 基本範例 - 快取系統訊息 {#basic-example---cache-system-messages}

```python showLineNumbers title="cache_system_messages.py"
from litellm import completion
import os

os.environ["ANTHROPIC_API_KEY"] = ""

response = completion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ],
    # Auto-inject cache control to system messages
    cache_control_injection_points=[
        {
            "location": "message",
            "role": "system",
        }
    ],
)

print(response.usage)
```

**重點：**
- 使用 `cache_control_injection_points` 參數指定要注入快取的位置
- `location: "message"` 目標為對話中的訊息
- `role: "system"` 目標為所有系統訊息
- LiteLLM 會自動將 `cache_control` 加入符合條件訊息的**最後一個內容區塊**（依 Anthropic 的 API 規格）

**LiteLLM 修改後的請求：**

LiteLLM 會自動將您的請求轉換為，在系統訊息的最後一個內容區塊加入 `cache_control`：

```json showLineNumbers title="modified_request_system.json"
{
    "messages": [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents."
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement...",
                    "cache_control": {"type": "ephemeral"}  // Added by LiteLLM
                }
            ]
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?"
        }
    ]
}
```

#### 依索引指定特定訊息 {#target-specific-messages-by-index}

您可以依 messages 陣列中的索引來指定特定訊息。使用負索引可從尾端開始指定。

```python showLineNumbers title="cache_by_index.py"
from litellm import completion
import os

os.environ["ANTHROPIC_API_KEY"] = ""

response = completion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[
        {
            "role": "user",
            "content": "First message",
        },
        {
            "role": "assistant",
            "content": "Response to first",
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Here is a long document to analyze:"},
                {"type": "text", "text": "Document content..." * 500},
            ],
        },
    ],
    # Target the last message (index -1)
    cache_control_injection_points=[
        {
            "location": "message",
            "index": -1,  # -1 targets the last message, -2 would target second-to-last, etc.
        }
    ],
)

print(response.usage)
```

**重要說明：**
- 當一則訊息有多個內容區塊（例如圖片或多個文字區塊）時，`cache_control` 只會加入到**最後一個內容區塊**
- 這遵循 [Anthropic 的 API 規格](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching#continuing-a-multi-turn-conversation)，其要求：「當使用多個內容區塊時，只有最後一個內容區塊可以有 cache_control」
- Anthropic 每個請求最多可有 4 個帶有 `cache_control` 的區塊

**LiteLLM 修改後的請求：**

LiteLLM 會將 `cache_control` 加入目標訊息的最後一個內容區塊（index -1 = 最後一則訊息）：

```json showLineNumbers title="modified_request_index.json"
{
    "messages": [
        {
            "role": "user",
            "content": "First message"
        },
        {
            "role": "assistant",
            "content": "Response to first"
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Here is a long document to analyze:"
                },
                {
                    "type": "text",
                    "text": "Document content...",
                    "cache_control": {"type": "ephemeral"}  // Added by LiteLLM to last content block only
                }
            ]
        }
    ]
}
```

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

您可以在 proxy 設定檔中設定 cache control 注入。

<Tabs>
<TabItem value="litellm config.yaml" label="litellm config.yaml">

```yaml showLineNumbers title="litellm config.yaml"
model_list:
  - model_name: anthropic-auto-inject-cache-system-message
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20240620
      api_key: os.environ/ANTHROPIC_API_KEY
      cache_control_injection_points:
        - location: message
          role: system
```
</TabItem>

<TabItem value="UI" label="LiteLLM UI">

在 LiteLLM UI 上，您可以在新增模型時於 `Advanced Settings` 分頁中指定 `cache_control_injection_points`。
<Image img={require('../../img/ui_auto_prompt_caching.png')}/>

</TabItem>
</Tabs>

## 詳細範例 {#detailed-example}

### 1. 傳送至 LiteLLM 的原始請求  {#1-original-request-to-litellm}

在這個範例中，我們有一段非常長且靜態的 system message，以及一段變動的 user message。由於 system message 幾乎不會變更，因此將其快取會更有效率。

```json showLineNumbers title="original_request.json"
{
    "messages": [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are a helpful assistant. This is a set of very long instructions that you will follow. Here is a legal document that you will use to answer the user's question."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What is the main topic of this legal document?"
                }
            ]
        }
    ]
}
```

### 2. LiteLLM 修改後的請求 {#2-litellms-modified-request}

LiteLLM 會根據我們的設定，自動將快取指令注入 system message：

```json showLineNumbers title="modified_request.json"
{
    "messages": [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are a helpful assistant. This is a set of very long instructions that you will follow. Here is a legal document that you will use to answer the user's question.",
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What is the main topic of this legal document?"
                }
            ]
        }
    ]
}
```

當模型提供者處理這個請求時，會辨識快取指令，並且只處理一次 system message，將其快取供後續請求使用。

## 相關文件 {#related-documentation}

- [手動提示快取](../completion/prompt_caching.md) - 了解如何手動將 `cache_control` 指令加入您的訊息
