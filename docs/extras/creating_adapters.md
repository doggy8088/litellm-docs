# 以自訂格式呼叫任何 LiteLLM 模型 {#call-any-litellm-model-in-your-custom-format}

使用此功能可用您的自訂格式呼叫任何 LiteLLM 支援的 `.completion()` 模型。若您有自訂 API，並想支援任何 LiteLLM 支援的模型，這會很有用。

## 運作方式 {#how-it-works}

您的請求 → Adapter 轉換為 OpenAI 格式 → LiteLLM 處理 → Adapter 將回應轉回 → 您的回應

## 建立 Adapter {#create-an-adapter}

繼承自 `CustomLogger` 並實作 3 個方法：

```python
from litellm.integrations.custom_logger import CustomLogger
from litellm.types.llms.openai import ChatCompletionRequest
from litellm.types.utils import ModelResponse

class MyAdapter(CustomLogger):
    def translate_completion_input_params(self, kwargs) -> ChatCompletionRequest:
        """Convert your format → OpenAI format"""
        # Example: Anthropic to OpenAI
        return {
            "model": kwargs["model"],
            "messages": self._convert_messages(kwargs["messages"]),
            "max_tokens": kwargs.get("max_tokens"),
        }

    def translate_completion_output_params(self, response: ModelResponse):
        """Convert OpenAI format → your format"""
        # Return your provider's response format
        return MyProviderResponse(
            id=response.id,
            content=response.choices[0].message.content,
            usage=response.usage,
        )

    def translate_completion_output_params_streaming(self, completion_stream):
        """Handle streaming responses"""
        return MyStreamWrapper(completion_stream)
```

## 註冊它 {#register-it}

```python
import litellm

my_adapter = MyAdapter()
litellm.adapters = [{"id": "my_provider", "adapter": my_adapter}]
```

## 使用它 {#use-it}

```python
from litellm import adapter_completion

# Now you can use your provider's format with any LiteLLM model
response = adapter_completion(
    adapter_id="my_provider",
    model="gpt-4",  # or any LiteLLM model
    messages=[{"role": "user", "content": "hello"}],
    max_tokens=100
)
```

### 串流 {#streaming}

```python
stream = adapter_completion(
    adapter_id="my_provider",
    model="gpt-4",
    messages=[{"role": "user", "content": "hello"}],
    stream=True
)

for chunk in stream:
    print(chunk)
```

### 非同步 {#async}

```python
from litellm import aadapter_completion

response = await aadapter_completion(
    adapter_id="my_provider",
    model="gpt-4",
    messages=[{"role": "user", "content": "hello"}]
)
```

## 範例：Anthropic Adapter {#example-anthropic-adapter}

以下是我們如何轉換 Anthropic 的格式：

### 輸入轉換 {#input-translation}

```python
def translate_completion_input_params(self, kwargs):
    model = kwargs.pop("model")
    messages = kwargs.pop("messages")
    
    # Convert Anthropic messages to OpenAI format
    openai_messages = []
    for msg in messages:
        if msg["role"] == "user":
            openai_messages.append({
                "role": "user",
                "content": msg["content"]
            })
    
    # Handle system message
    if "system" in kwargs:
        openai_messages.insert(0, {
            "role": "system",
            "content": kwargs.pop("system")
        })
    
    return {
        "model": model,
        "messages": openai_messages,
        **kwargs  # pass through other params
    }
```

### 輸出轉換 {#output-translation}

```python
def translate_completion_output_params(self, response):
    return AnthropicResponse(
        id=response.id,
        type="message",
        role="assistant",
        content=[{
            "type": "text",
            "text": response.choices[0].message.content
        }],
        usage={
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens
        }
    )
```

### 串流 {#streaming-1}

```python
from litellm.types.utils import AdapterCompletionStreamWrapper

class AnthropicStreamWrapper(AdapterCompletionStreamWrapper):
    def __init__(self, completion_stream, model):
        super().__init__(completion_stream)
        self.model = model
        self.first_chunk = True
    
    async def __anext__(self):
        # First chunk
        if self.first_chunk:
            self.first_chunk = False
            return {"type": "message_start", "message": {...}}
        
        # Stream chunks
        async for chunk in self.completion_stream:
            return {
                "type": "content_block_delta",
                "delta": {"text": chunk.choices[0].delta.content}
            }
        
        # Last chunk
        return {"type": "message_stop"}

def translate_completion_output_params_streaming(self, stream, model):
    return AnthropicStreamWrapper(stream, model)
```

## 搭配 Proxy 使用 {#use-with-proxy}

加入您的 proxy 設定：

```yaml
general_settings:
  pass_through_endpoints:
    - path: "/v1/messages"
      target: "my_module.MyAdapter"
```

然後這樣呼叫：

```bash
curl http://localhost:4000/v1/messages \
  -H "Authorization: Bearer sk-1234" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

## 實際範例 {#real-example}

查看完整的 Anthropic adapter：
- [transformation.py](https://github.com/BerriAI/litellm/blob/main/litellm/llms/anthropic/experimental_pass_through/adapters/transformation.py)
- [handler.py](https://github.com/BerriAI/litellm/blob/main/litellm/llms/anthropic/experimental_pass_through/adapters/handler.py)
- [streaming_iterator.py](https://github.com/BerriAI/litellm/blob/main/litellm/llms/anthropic/experimental_pass_through/adapters/streaming_iterator.py)

## 就是這樣 {#thats-it}

1. 建立一個繼承自 `CustomLogger` 的類別
2. 實作這 3 個轉換方法
3. 使用 `litellm.adapters = [{"id": "...", "adapter": ...}]` 註冊
4. 透過 `adapter_completion(adapter_id="...")` 呼叫
