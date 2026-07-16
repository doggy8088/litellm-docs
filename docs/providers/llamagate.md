# LlamaGate {#llamagate}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | LlamaGate 是一個與 OpenAI 相容的開源 LLM API 閘道，採用基於點數的計費方式。以具競爭力的價格存取 26+ 個開源模型，包括 Llama、Mistral、DeepSeek 和 Qwen。 |
| LiteLLM 上的提供者路由 | `llamagate/` |
| 提供者文件連結 | [LlamaGate 文件 ↗](https://llamagate.dev/docs) |
| 基礎 URL | `https://api.llamagate.dev/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage), [`/embeddings`](#embeddings) |

<br />

## 什麼是 LlamaGate？ {#what-is-llamagate}

LlamaGate 透過與 OpenAI 相容的 API 提供開源 LLM 的存取：
- **26+ 個開源模型**：Llama 3.1/3.2、Mistral、Qwen、DeepSeek R1 等更多模型
- **與 OpenAI 相容的 API**：OpenAI SDK 的即插即用替代方案
- **視覺模型**：Qwen VL、LLaVA、olmOCR、UI-TARS，適用於多模態任務
- **推理模型**：DeepSeek R1、OpenThinker，用於複雜問題解決
- **程式碼模型**：CodeLlama、DeepSeek Coder、Qwen Coder、StarCoder2
- **嵌入模型**：Nomic、Qwen3 Embedding，用於 RAG 與搜尋
- **具競爭力的價格**：每 1M tokens $0.02-$0.55

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["LLAMAGATE_API_KEY"] = ""  # your LlamaGate API key
```

請從 [llamagate.dev](https://llamagate.dev) 取得您的 API 金鑰。

## 支援的模型 {#supported-models}

### 一般用途 {#general-purpose}
| 模型 | 模型 ID |
|-------|----------|
| Llama 3.1 8B | `llamagate/llama-3.1-8b` |
| Llama 3.2 3B | `llamagate/llama-3.2-3b` |
| Mistral 7B v0.3 | `llamagate/mistral-7b-v0.3` |
| Qwen 3 8B | `llamagate/qwen3-8b` |
| Dolphin 3 8B | `llamagate/dolphin3-8b` |

### 推理模型 {#reasoning-models}
| 模型 | 模型 ID |
|-------|----------|
| DeepSeek R1 8B | `llamagate/deepseek-r1-8b` |
| DeepSeek R1 Distill Qwen 7B | `llamagate/deepseek-r1-7b-qwen` |
| OpenThinker 7B | `llamagate/openthinker-7b` |

### 程式碼模型 {#code-models}
| 模型 | 模型 ID |
|-------|----------|
| Qwen 2.5 Coder 7B | `llamagate/qwen2.5-coder-7b` |
| DeepSeek Coder 6.7B | `llamagate/deepseek-coder-6.7b` |
| CodeLlama 7B | `llamagate/codellama-7b` |
| CodeGemma 7B | `llamagate/codegemma-7b` |
| StarCoder2 7B | `llamagate/starcoder2-7b` |

### 視覺模型 {#vision-models}
| 模型 | 模型 ID |
|-------|----------|
| Qwen 3 VL 8B | `llamagate/qwen3-vl-8b` |
| LLaVA 1.5 7B | `llamagate/llava-7b` |
| Gemma 3 4B | `llamagate/gemma3-4b` |
| olmOCR 7B | `llamagate/olmocr-7b` |
| UI-TARS 1.5 7B | `llamagate/ui-tars-7b` |

### 嵌入模型 {#embedding-models}
| 模型 | 模型 ID |
|-------|----------|
| Nomic Embed Text | `llamagate/nomic-embed-text` |
| Qwen 3 Embedding 8B | `llamagate/qwen3-embedding-8b` |
| EmbeddingGemma 300M | `llamagate/embeddinggemma-300m` |

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="LlamaGate Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LLAMAGATE_API_KEY"] = ""  # your LlamaGate API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# LlamaGate call
response = completion(
    model="llamagate/llama-3.1-8b",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="LlamaGate Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LLAMAGATE_API_KEY"] = ""  # your LlamaGate API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# LlamaGate call with streaming
response = completion(
    model="llamagate/llama-3.1-8b",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 視覺 {#vision}

```python showLineNumbers title="LlamaGate Vision Completion"
import os
import litellm
from litellm import completion

os.environ["LLAMAGATE_API_KEY"] = ""  # your LlamaGate API key

messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
        ]
    }
]

# LlamaGate vision call
response = completion(
    model="llamagate/qwen3-vl-8b",
    messages=messages
)

print(response)
```

### 嵌入 {#embeddings}

```python showLineNumbers title="LlamaGate Embeddings"
import os
import litellm
from litellm import embedding

os.environ["LLAMAGATE_API_KEY"] = ""  # your LlamaGate API key

# LlamaGate embedding call
response = embedding(
    model="llamagate/nomic-embed-text",
    input=["Hello world", "How are you?"]
)

print(response)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將 key 儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export LLAMAGATE_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: llama-3.1-8b
    litellm_params:
      model: llamagate/llama-3.1-8b
      api_key: os.environ/LLAMAGATE_API_KEY
  - model_name: deepseek-r1
    litellm_params:
      model: llamagate/deepseek-r1-8b
      api_key: os.environ/LLAMAGATE_API_KEY
  - model_name: qwen-coder
    litellm_params:
      model: llamagate/qwen2.5-coder-7b
      api_key: os.environ/LLAMAGATE_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

LlamaGate 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必填**。包含 'role' 與 'content' 的訊息物件陣列 |
| `model` | string | **必填**。Model ID |
| `stream` | boolean | 選填。啟用串流回應 |
| `temperature` | float | 選填。取樣溫度（0-2） |
| `top_p` | float | 選填。核採樣參數 |
| `max_tokens` | integer | 選填。要產生的最大 tokens 數量 |
| `frequency_penalty` | float | 選填。對常見 tokens 加以懲罰 |
| `presence_penalty` | float | 選填。根據存在情況對 tokens 加以懲罰 |
| `stop` | string/array | 選填。停止序列 |
| `tools` | array | 選填。可用工具/函式清單 |
| `tool_choice` | string/object | 選填。控制工具/函式呼叫 |
| `response_format` | object | 選填。JSON 模式或 JSON schema |

## 價格 {#pricing}

LlamaGate 提供具競爭力的每 token 定價：

| 模型類別 | 輸入（每 1M） | 輸出（每 1M） |
|----------------|----------------|-----------------|
| 嵌入 | $0.02 | - |
| 小型（3-4B） | $0.03-$0.04 | $0.08 |
| 中型（7-8B） | $0.03-$0.15 | $0.05-$0.55 |
| 程式碼模型 | $0.06-$0.10 | $0.12-$0.20 |
| 推理 | $0.08-$0.10 | $0.15-$0.20 |

## 其他資源 {#additional-resources}

- [LlamaGate 文件](https://llamagate.dev/docs)
- [LlamaGate 價格](https://llamagate.dev/pricing)
- [LlamaGate API 參考](https://llamagate.dev/docs/api)
