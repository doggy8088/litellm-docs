import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM - 開始使用 {#litellm---getting-started}

https://github.com/BerriAI/litellm

## **使用 OpenAI 輸入/輸出格式呼叫 100+ 個 LLM** {#call-100-llms-using-the-openai-inputoutput-format}

- 將輸入轉換為提供者的端點（`/chat/completions`, `/responses`, `/embeddings`, `/images`, `/audio`, `/batches`, 以及更多）
- [一致的輸出](https://docs.litellm.ai/docs/supported_endpoints) - 無論使用哪個提供者，回應格式都相同
- 跨多個部署（例如 Azure/OpenAI）的重試/備援邏輯 - [Router](https://docs.litellm.ai/docs/routing)
- 追蹤支出並為每個專案設定預算 [LiteLLM Proxy Server](https://docs.litellm.ai/docs/simple_proxy)

## 如何使用 LiteLLM {#how-to-use-litellm}

您可以透過 Proxy Server 或 Python SDK 使用 LiteLLM。兩者都提供統一介面，讓您存取多個 LLM（100+ 個 LLM）。請選擇最符合您需求的選項：

<table style={{width: '100%', tableLayout: 'fixed'}}>
<thead>
<tr>
<th style={{width: '14%'}}></th>
<th style={{width: '43%'}}><strong><a href="#litellm-proxy-server-llm-gateway">LiteLLM Proxy Server</a></strong></th>
<th style={{width: '43%'}}><strong><a href="#basic-usage">LiteLLM Python SDK</a></strong></th>
</tr>
</thead>
<tbody>
<tr>
<td style={{width: '14%'}}><strong>使用情境</strong></td>
<td style={{width: '43%'}}>存取多個 LLM 的中央服務（LLM 閘道）</td>
<td style={{width: '43%'}}>直接在您的 Python 程式碼中使用 LiteLLM</td>
</tr>
<tr>
<td style={{width: '14%'}}><strong>誰會使用？</strong></td>
<td style={{width: '43%'}}>生成式 AI 賦能 / ML 平台團隊</td>
<td style={{width: '43%'}}>建置 LLM 專案的開發者</td>
</tr>
<tr>
<td style={{width: '14%'}}><strong>主要功能</strong></td>
<td style={{width: '43%'}}>• 具備驗證與授權的集中式 API 閘道<br />• 每個專案/使用者的多租戶成本追蹤與支出管理<br />• 每個專案的自訂化（記錄、防護欄、快取）<br />• 用於安全存取控制的虛擬金鑰<br />• 用於監控與管理的管理員儀表板 UI</td>
<td style={{width: '43%'}}>• 直接在您的程式碼基底中整合 Python 函式庫<br />• 跨多個部署（例如 Azure/OpenAI）具備重試/備援邏輯的 Router - <a href="https://docs.litellm.ai/docs/routing">Router</a><br />• 應用程式層級的負載平衡與成本追蹤<br />• 具備與 OpenAI 相容錯誤的例外處理<br />• 可觀測性回呼（Lunary、MLflow、Langfuse 等）</td>
</tr>
</tbody>
</table>

## **LiteLLM Python SDK** {#litellm-python-sdk}

### 基本使用  {#basic-usage}

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/liteLLM_Getting_Started.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

```shell
uv add litellm
```

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="openai/gpt-5",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```python
from litellm import completion
import os

## set ENV variables
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

response = completion(
  model="anthropic/claude-sonnet-4-5-20250929",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="xai" label="xAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["XAI_API_KEY"] = "your-api-key"

response = completion(
  model="xai/grok-2-latest",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```
</TabItem>
<TabItem value="vertex" label="VertexAI">

```python
from litellm import completion
import os

# auth: run 'gcloud auth application-default'
os.environ["VERTEXAI_PROJECT"] = "hardy-device-386718"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = completion(
  model="vertex_ai/gemini-1.5-pro",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

<TabItem value="nvidia" label="NVIDIA">

```python
from litellm import completion
import os

## set ENV variables
os.environ["NVIDIA_NIM_API_KEY"] = "nvidia_api_key"
os.environ["NVIDIA_NIM_API_BASE"] = "nvidia_nim_endpoint_url"

response = completion(
  model="nvidia_nim/<model_name>",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

<TabItem value="hugging" label="HuggingFace">

```python
from litellm import completion
import os

os.environ["HUGGINGFACE_API_KEY"] = "huggingface_api_key"

# e.g. Call 'WizardLM/WizardCoder-Python-34B-V1.0' hosted on HF Inference endpoints
response = completion(
  model="huggingface/WizardLM/WizardCoder-Python-34B-V1.0",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  api_base="https://my-endpoint.huggingface.cloud"
)

print(response)
```

</TabItem>

<TabItem value="azure" label="Azure OpenAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

# azure call
response = completion(
  "azure/<your_deployment_name>",
  messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

<TabItem value="ollama" label="Ollama">

```python
from litellm import completion

response = completion(
            model="ollama/llama2",
            messages = [{ "content": "Hello, how are you?","role": "user"}],
            api_base="http://localhost:11434"
)
```

</TabItem>
<TabItem value="or" label="Openrouter">

```python
from litellm import completion
import os

## set ENV variables
os.environ["OPENROUTER_API_KEY"] = "openrouter_api_key"

response = completion(
  model="openrouter/google/palm-2-chat-bison",
  messages = [{ "content": "Hello, how are you?","role": "user"}],
)
```

</TabItem>
<TabItem value="novita" label="Novita AI">

```python
from litellm import completion
import os

## set ENV variables. Visit https://novita.ai/settings/key-management to get your API key
os.environ["NOVITA_API_KEY"] = "novita-api-key"

response = completion(
  model="novita/deepseek/deepseek-r1",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

<TabItem value="vercel" label="Vercel AI Gateway">

```python
from litellm import completion
import os

## set ENV variables. Visit https://vercel.com/docs/ai-gateway#using-the-ai-gateway-with-an-api-key for instructions on obtaining a key
os.environ["VERCEL_AI_GATEWAY_API_KEY"] = "your-vercel-api-key"

response = completion(
  model="vercel_ai_gateway/openai/gpt-5",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

</Tabs>

### 回應格式（OpenAI Chat Completions 格式） {#response-format-openai-chat-completions-format}

```json
{
    "id": "chatcmpl-565d891b-a42e-4c39-8d14-82a1f5208885",
    "created": 1734366691,
    "model": "gpt-5",
    "object": "chat.completion",
    "system_fingerprint": null,
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "Hello! As an AI language model, I don't have feelings, but I'm operating properly and ready to assist you with any questions or tasks you may have. How can I help you today?",
                "role": "assistant",
                "tool_calls": null,
                "function_call": null
            }
        }
    ],
    "usage": {
        "completion_tokens": 43,
        "prompt_tokens": 13,
        "total_tokens": 56,
        "completion_tokens_details": null,
        "prompt_tokens_details": {
            "audio_tokens": null,
            "cached_tokens": 0
        },
        "cache_creation_input_tokens": 0,
        "cache_read_input_tokens": 0
    }
}
```

### 回應 API {#responses-api}

對於支援 reasoning content 的進階模型，請使用 `litellm.responses()`，例如 GPT-5、o3 等。

<Tabs>
<TabItem value="openai-responses" label="OpenAI">

```python
from litellm import responses
import os

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = responses(
  model="gpt-5-mini",
  messages=[{ "content": "What is the capital of France?","role": "user"}],
  reasoning_effort="medium"
)

print(response)
print(response.choices[0].message.content) # response
print(response.choices[0].message.reasoning_content) # reasoning

```

</TabItem>
<TabItem value="anthropic-responses" label="Anthropic (Claude)">

```python
from litellm import responses
import os

## set ENV variables
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

response = responses(
  model="claude-3.5-sonnet",
  messages=[{ "content": "What is the capital of France?","role": "user"}]
)
```

</TabItem>

<TabItem value="vertex-responses" label="VertexAI">

```python
from litellm import responses
import os

# auth: run 'gcloud auth application-default'
os.environ["VERTEXAI_PROJECT"] = "jr-smith-386718"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = responses(
  model="vertex_ai/gemini-1.5-pro",
  messages=[{ "content": "What is the capital of France?","role": "user"}]
)
```

</TabItem>

<TabItem value="azure-responses" label="Azure OpenAI">

```python
from litellm import responses
import os

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

# azure call
response = responses(
  "azure/<your_deployment_name>",
  messages = [{ "content": "What is the capital of France?","role": "user"}]
)

print(response)
```

</TabItem>

</Tabs>

### 串流 {#streaming}
請在 `completion` 引數中設定 `stream=True`。 

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="openai/gpt-5",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```python
from litellm import completion
import os

## set ENV variables
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

response = completion(
  model="anthropic/claude-sonnet-4-5-20250929",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>
<TabItem value="xai" label="xAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["XAI_API_KEY"] = "your-api-key"

response = completion(
  model="xai/grok-2-latest",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```
</TabItem>
<TabItem value="vertex" label="VertexAI">

```python
from litellm import completion
import os

# auth: run 'gcloud auth application-default'
os.environ["VERTEXAI_PROJECT"] = "hardy-device-386718"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = completion(
  model="vertex_ai/gemini-1.5-pro",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>

<TabItem value="nvidia" label="NVIDIA">

```python
from litellm import completion
import os

## set ENV variables
os.environ["NVIDIA_NIM_API_KEY"] = "nvidia_api_key"
os.environ["NVIDIA_NIM_API_BASE"] = "nvidia_nim_endpoint_url"

response = completion(
  model="nvidia_nim/<model_name>",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```
</TabItem>

<TabItem value="hugging" label="HuggingFace">

```python
from litellm import completion
import os

os.environ["HUGGINGFACE_API_KEY"] = "huggingface_api_key"

# e.g. Call 'WizardLM/WizardCoder-Python-34B-V1.0' hosted on HF Inference endpoints
response = completion(
  model="huggingface/WizardLM/WizardCoder-Python-34B-V1.0",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  api_base="https://my-endpoint.huggingface.cloud",
  stream=True,
)

print(response)
```

</TabItem>

<TabItem value="azure" label="Azure OpenAI">

```python
from litellm import completion
import os

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

# azure call
response = completion(
  "azure/<your_deployment_name>",
  messages = [{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>

<TabItem value="ollama" label="Ollama">

```python
from litellm import completion

response = completion(
            model="ollama/llama2",
            messages = [{ "content": "Hello, how are you?","role": "user"}],
            api_base="http://localhost:11434",
            stream=True,
)
```

</TabItem>
<TabItem value="or" label="Openrouter">

```python
from litellm import completion
import os

## set ENV variables
os.environ["OPENROUTER_API_KEY"] = "openrouter_api_key"

response = completion(
  model="openrouter/google/palm-2-chat-bison",
  messages = [{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>
<TabItem value="novita" label="Novita AI">

```python
from litellm import completion
import os

## set ENV variables. Visit https://novita.ai/settings/key-management to get your API key
os.environ["NOVITA_API_KEY"] = "novita_api_key"

response = completion(
  model="novita/deepseek/deepseek-r1",
  messages = [{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>

<TabItem value="vercel" label="Vercel AI Gateway">

```python
from litellm import completion
import os

## set ENV variables. Visit https://vercel.com/docs/ai-gateway#using-the-ai-gateway-with-an-api-key for instructions on obtaining a key
os.environ["VERCEL_AI_GATEWAY_API_KEY"] = "your-vercel-api-key"

response = completion(
  model="vercel_ai_gateway/openai/gpt-5",
  messages = [{ "content": "Hello, how are you?","role": "user"}],
  stream=True,
)
```

</TabItem>

</Tabs>

### 串流回應格式（OpenAI 格式） {#streaming-response-format-openai-format}

```json
{
    "id": "chatcmpl-2be06597-eb60-4c70-9ec5-8cd2ab1b4697",
    "created": 1734366925,
    "model": "claude-sonnet-4-5-20250929",
    "object": "chat.completion.chunk",
    "system_fingerprint": null,
    "choices": [
        {
            "finish_reason": null,
            "index": 0,
            "delta": {
                "content": "Hello",
                "role": "assistant",
                "function_call": null,
                "tool_calls": null,
                "audio": null
            },
            "logprobs": null
        }
    ]
}
```

### 例外處理  {#exception-handling}

LiteLLM 會將所有支援的提供者例外對應到 OpenAI 例外。所有例外都繼承自 OpenAI 的例外型別，因此您針對該部分所做的任何錯誤處理，都應可在 LiteLLM 中直接使用。

```python
import litellm
from litellm import completion
import os

os.environ["ANTHROPIC_API_KEY"] = "bad-key"
try:
    completion(model="anthropic/claude-instant-1", messages=[{"role": "user", "content": "Hey, how's it going?"}])
except litellm.AuthenticationError as e:
    # Thrown when the API key is invalid
    print(f"Authentication failed: {e}")
except litellm.RateLimitError as e:
    # Thrown when you've exceeded your rate limit
    print(f"Rate limited: {e}")
except litellm.APIError as e:
    # Thrown for general API errors
    print(f"API error: {e}")
```

### 記錄可觀測性 - 記錄 LLM 輸入/輸出 ([文件](https://docs.litellm.ai/docs/observability/callbacks)) {#logging-observability---log-llm-inputoutput-docshttpsdocslitellmaidocsobservabilitycallbacks}
LiteLLM 提供預先定義的回呼，可將資料傳送至 MLflow、Lunary、Langfuse、Helicone、Promptlayer、Traceloop、Slack

```python
from litellm import completion

## set env variables for logging tools (API key set up is not required when using MLflow)
os.environ["LUNARY_PUBLIC_KEY"] = "your-lunary-public-key" # get your key at https://app.lunary.ai/settings
os.environ["HELICONE_API_KEY"] = "your-helicone-key"
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""

os.environ["OPENAI_API_KEY"]

# set callbacks
litellm.success_callback = ["lunary", "mlflow", "langfuse", "helicone"] # log input/output to lunary, mlflow, langfuse, helicone

#openai call
response = completion(model="openai/gpt-5", messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}])
```

### 在串流中追蹤成本、用量、延遲 {#track-costs-usage-latency-for-streaming}
請使用回呼函式來達成此目的 - 更多自訂回呼資訊：https://docs.litellm.ai/docs/observability/custom_callback

```python
import litellm

# track_cost_callback
def track_cost_callback(
    kwargs,                 # kwargs to completion
    completion_response,    # response from completion
    start_time, end_time    # start/end time
):
    try:
      response_cost = kwargs.get("response_cost", 0)
      print("streaming response_cost", response_cost)
    except:
        pass
# set callback
litellm.success_callback = [track_cost_callback] # set custom callback function

# litellm.completion() call
response = completion(
    model="openai/gpt-5",
    messages=[
        {
            "role": "user",
            "content": "Hi 👋 - i'm openai"
        }
    ],
    stream=True
)
```

## **LiteLLM Proxy Server（LLM 閘道）** {#litellm-proxy-server-llm-gateway}

跨多個專案/人員追蹤支出

![ui_3](https://github.com/BerriAI/litellm/assets/29436595/47c97d5e-b9be-4839-b28c-43d7f4f10033)

proxy 提供：

1. [驗證用 Hook](https://docs.litellm.ai/docs/proxy/virtual_keys#custom-auth)
2. [記錄用 Hook](https://docs.litellm.ai/docs/proxy/logging#step-1---create-your-custom-litellm-callback-class)
3. [成本追蹤](https://docs.litellm.ai/docs/proxy/virtual_keys#tracking-spend)
4. [速率限制](https://docs.litellm.ai/docs/proxy/users#set-rate-limits)

### 📖 Proxy 端點 - [Swagger 文件](https://litellm-api.up.railway.app/) {#-proxy-endpoints---swagger-docshttpslitellm-apiuprailwayapp}

完整教學請見此處，包含金鑰與速率限制 - [**這裡**](https://docs.litellm.ai/docs/proxy/docker_quick_start)

### 快速開始 Proxy - CLI {#quick-start-proxy---cli}

```shell
uv tool install 'litellm[proxy]'
```

#### 步驟 1：啟動 litellm proxy {#step-1-start-litellm-proxy}

<Tabs>

<TabItem label="LiteLLM CLI" value="cli">

```shell
$ litellm --model huggingface/bigcode/starcoder

#INFO: Proxy running on http://0.0.0.0:4000
```

</TabItem>

<TabItem label="Docker container" value="docker">

### 步驟 1. 建立 config.yaml  {#step-1-create-configyaml}

範例 `litellm_config.yaml` 

```yaml
model_list:
  - model_name: gpt-5
    litellm_params:
      model: azure/<your-azure-model-deployment>
      api_base: os.environ/AZURE_API_BASE # runs os.getenv("AZURE_API_BASE")
      api_key: os.environ/AZURE_API_KEY # runs os.getenv("AZURE_API_KEY")
      api_version: "2023-07-01-preview"

litellm_settings:
  master_key: sk-1234
  database_url: postgres://
```

### 步驟 2. 執行 Docker 映像檔 {#step-2-run-docker-image}

```shell
docker run \
    -v $(pwd)/litellm_config.yaml:/app/config.yaml \
    -e AZURE_API_KEY=d6*********** \
    -e AZURE_API_BASE=https://openai-***********/ \
    -p 4000:4000 \
    docker.litellm.ai/berriai/litellm:main-latest \
    --config /app/config.yaml --detailed_debug
```

</TabItem>

</Tabs>

#### 步驟 2：對 Proxy 發出 ChatCompletions 請求 {#step-2-make-chatcompletions-request-to-proxy}

<Tabs>
<TabItem value="chat-completions" label="Chat Completions">

```python
import openai # openai v1.0.0+
client = openai.OpenAI(api_key="anything",base_url="http://0.0.0.0:4000") # set proxy to base_url
# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-5", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)
```

</TabItem>
<TabItem value="responses-api" label="Responses API">

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.responses.create(
  model="gpt-5",
  input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

</TabItem>
</Tabs>

## 更多詳細資訊 {#more-details}

- [例外對應](../../docs/exception_mapping)
- [LiteLLM Proxy Server 的端到端教學](../../docs/proxy/docker_quick_start)
- [proxy 虛擬金鑰與支出管理](../../docs/proxy/virtual_keys)
