import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Clarifai {#clarifai}
Anthropic、OpenAI、Qwen、xAI、Gemini 以及大多數開源 LLM 都支援 Clarifai。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Clarifai 是一個強大的 AI 平台，透過統一 API 提供存取多種 LLM 的能力。LiteLLM 使用相容 OpenAI 的介面，讓您能無縫整合 Clarifai 的模型。 |
| 提供者文件 | [Clarifai ↗](https://docs.clarifai.com/) |
|OpenAI compatible Endpoint for Provider | `https://api.clarifai.com/v2/ext/openai/v1` |
| 支援的端點 | `/chat/completions` |

## 先決條件 {#pre-requisites}

```bash
uv add litellm
```

## 必要環境變數 {#required-environment-variables}
若要取得您的 Clarifai Personal access token，請依照這個 [連結](https://docs.clarifai.com/clarifai-basics/authentication/personal-access-tokens/)。

```python
os.environ["CLARIFAI_PAT"] = "CLARIFAI_API_KEY"  # CLARIFAI_PAT
```

## 用法 {#usage}

```python
import os
from litellm import completion

os.environ["CLARIFAI_API_KEY"] = ""

response = completion(
  model="clarifai/openai.chat-completion.gpt-oss-20b",
  messages=[{ "content": "Tell me a joke about physics?","role": "user"}]
)
```
## 串流支援 {#streaming-support}

LiteLLM 支援與 Clarifai 模型的串流回應：

```python
import litellm

for chunk in litellm.completion(
    model="clarifai/openai.chat-completion.gpt-oss-20b",
    api_key="CLARIFAI_API_KEY",
    messages=[
        {"role": "user", "content": "Tell me a fun fact about space."}
    ],
    stream=True,
):
    print(chunk.choices[0].delta)
```

## 工具呼叫（函式呼叫） {#tool-calling-function-calling}

透過 LiteLLM 存取的 Clarifai 模型支援函式呼叫：

```python
import litellm

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current temperature for a given location.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country e.g. Tokyo, Japan"
                }
            },
            "required": ["location"],
            "additionalProperties": False
        },
    }
  }
}]

response = litellm.completion(
    model="clarifai/openai.chat-completion.gpt-oss-20b",
    api_key="CLARIFAI_API_KEY",
    messages=[{"role": "user", "content": "What is the weather in Paris today?"}],
    tools=tools,
)

print(response.choices[0].message.tool_calls)
```

## Clarifai 模型 {#clarifai-models}
liteLLM 支援 [Clarifai community](https://clarifai.com/explore/models?filterData=%5B%7B%22field%22%3A%22use_cases%22%2C%22value%22%3A%5B%22llm%22%5D%7D%5D&page=1&perPage=24) 上的所有模型

### 🧠 OpenAI 模型 {#-openai-models}
- [gpt-oss-20b](https://clarifai.com/openai/chat-completion/models/gpt-oss-20b)
- [gpt-oss-120b](https://clarifai.com/openai/chat-completion/models/gpt-oss-120b)
- [gpt-5-nano](https://clarifai.com/openai/chat-completion/models/gpt-5-nano)
- [gpt-5-mini](https://clarifai.com/openai/chat-completion/models/gpt-5-mini)
- [gpt-5](https://clarifai.com/openai/chat-completion/models/gpt-5)
- [gpt-4o](https://clarifai.com/openai/chat-completion/models/gpt-4o)
- [o3](https://clarifai.com/openai/chat-completion/models/o3)
- 更多...

### 🤖 Anthropic 模型 {#-anthropic-models}
- [claude-sonnet-4](https://clarifai.com/anthropic/completion/models/claude-sonnet-4)
- [claude-opus-4](https://clarifai.com/anthropic/completion/models/claude-opus-4)
- [claude-3_5-haiku](https://clarifai.com/anthropic/completion/models/claude-3_5-haiku)
- [claude-3_7-sonnet](https://clarifai.com/anthropic/completion/models/claude-3_7-sonnet)
- 更多...

### 🪄 xAI 模型 {#-xai-models}
- [grok-3](https://clarifai.com/xai/chat-completion/models/grok-3)
- [grok-2-vision-1212](https://clarifai.com/xai/chat-completion/models/grok-2-vision-1212)
- [grok-2-1212](https://clarifai.com/xai/chat-completion/models/grok-2-1212)
- [grok-code-fast-1](https://clarifai.com/xai/chat-completion/models/grok-code-fast-1)
- [grok-2-image-1212](https://clarifai.com/xai/image-generation/models/grok-2-image-1212)
- 更多...

### 🔷 Google Gemini 模型 {#-google-gemini-models}
- [gemini-2_5-pro](https://clarifai.com/gcp/generate/models/gemini-2_5-pro)
- [gemini-2_5-flash-lite](https://clarifai.com/gcp/generate/models/gemini-2_5-flash-lite)
- [gemini-2_0-flash](https://clarifai.com/gcp/generate/models/gemini-2_0-flash)
- [gemini-2_0-flash-lite](https://clarifai.com/gcp/generate/models/gemini-2_0-flash-lite)
- 更多...

### 🧩 Qwen 模型 {#-qwen-models}
- [Qwen3-30B-A3B-Instruct-2507](https://clarifai.com/qwen/qwenLM/models/Qwen3-30B-A3B-Instruct-2507)
- [Qwen3-30B-A3B-Thinking-2507](https://clarifai.com/qwen/qwenLM/models/Qwen3-30B-A3B-Thinking-2507)
- [Qwen3-14B](https://clarifai.com/qwen/qwenLM/models/Qwen3-14B)
- [QwQ-32B-AWQ](https://clarifai.com/qwen/qwenLM/models/QwQ-32B-AWQ)
- [Qwen2_5-VL-7B-Instruct](https://clarifai.com/qwen/qwen-VL/models/Qwen2_5-VL-7B-Instruct)
- [Qwen3-Coder-30B-A3B-Instruct](https://clarifai.com/qwen/qwenCoder/models/Qwen3-Coder-30B-A3B-Instruct)
- 更多...

### 💡 MiniCPM（OpenBMB）模型 {#-minicpm-openbmb-models}
- [MiniCPM-o-2_6-language](https://clarifai.com/openbmb/miniCPM/models/MiniCPM-o-2_6-language)
- [MiniCPM3-4B](https://clarifai.com/openbmb/miniCPM/models/MiniCPM3-4B)
- [MiniCPM4-8B](https://clarifai.com/openbmb/miniCPM/models/MiniCPM4-8B)
- 更多...

### 🧬 Microsoft Phi 模型 {#-microsoft-phi-models}
- [Phi-4-reasoning-plus](https://clarifai.com/microsoft/text-generation/models/Phi-4-reasoning-plus)
- [phi-4](https://clarifai.com/microsoft/text-generation/models/phi-4)
- 更多...

### 🦙 Meta Llama 模型 {#-meta-llama-models}
- [Llama-3_2-3B-Instruct](https://clarifai.com/meta/Llama-3/models/Llama-3_2-3B-Instruct)
- 更多...

### 🔍 DeepSeek 模型 {#-deepseek-models}
- [DeepSeek-R1-0528-Qwen3-8B](https://clarifai.com/deepseek-ai/deepseek-chat/models/DeepSeek-R1-0528-Qwen3-8B)
- 更多...

## 搭配 LiteLLM Proxy 的用法 {#usage-with-litellm-proxy}

以下是如何使用 LiteLLM Proxy Server 呼叫 Clarifai

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export CLARIFAI_PAT="CLARIFAI_API_KEY"
```

### 2. 啟動 proxy {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: clarifai-model
    litellm_params:
      model: clarifai/openai.chat-completion.gpt-oss-20b
      api_key: os.environ/CLARIFAI_PAT
```

```bash
litellm --config /path/to/config.yaml

# Server running on http://0.0.0.0:4000
```
</TabItem>
</Tabs>

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "clarifai-model",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="clarifai-model",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ]
)

print(response)
```
</TabItem>
</Tabs>

## 重要說明 {#important-notes}

- 指定模型名稱時，請務必在 Clarifai 模型 ID 前加上 `clarifai/`
- 使用您的 Clarifai Personal Access Token（PAT）作為 API 金鑰
- 使用量會透過 Clarifai 進行追蹤與計費
- API 速率限制受您的 Clarifai 帳戶設定影響
- 大多數 OpenAI 參數都支援，但某些進階功能可能因模型而異

## 常見問題 {#faqs}

| Question | Answer |
|----------|---------|
| Can I use all Clarifai models with LiteLLM? | 大多數聊天完成模型都支援。請使用 Clarifai 模型 URL 作為 `model`。 |
| Do I need a separate Clarifai PAT? | 是，您必須使用有效的 Clarifai Personal Access Token。 |
| Is tool calling supported? | 是，前提是底層的 Clarifai 模型支援函式／工具呼叫。 |
| How is billing handled? | Clarifai 的使用量會透過 Clarifai 個別計費。 |

## 其他資源 {#additional-resources}

- [Clarifai 文件](https://docs.clarifai.com/)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Clarifai Runners 範例](https://github.com/Clarifai/runners-examples)
