import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nscale（EU 主權） {#nscale-eu-sovereign}

https://docs.nscale.com/docs/inference/chat

:::tip

**我們支援所有 Nscale 模型，只要在送出 litellm 請求時將 `model=nscale/<any-model-on-nscale>` 設為前綴即可**

:::

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | 位於歐洲的全端 AI 雲端平台，適用於 LLM 與影像生成。 |
| LiteLLM 上的提供者路由 | `nscale/` |
| 支援的端點 | `/chat/completions`, `/images/generations` |
| API 參考 | [Nscale 文件](https://docs.nscale.com/docs/getting-started/overview) |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["NSCALE_API_KEY"] = ""  # your Nscale API key
```

## 探索可用模型   {#explore-available-models}

探索我們完整的文字與多模態 AI 模型清單——全部皆可用極具競爭力的價格取得：
📚 [完整模型清單](https://docs.nscale.com/docs/inference/serverless-models/current)  

## 主要功能 {#key-features}
- **EU Sovereign**：完整資料主權與符合歐洲法規
- **超低成本（起價 $0.01 / 百萬 tokens）**：文字與影像生成模型皆具極具競爭力的價格
- **生產等級**：具完整隔離的可靠無伺服器部署
- **無需設定**：無需管理基礎架構即可立即使用運算資源
- **完整控制**：您的資料保持私有且隔離

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 文字生成 {#text-generation}

```python showLineNumbers title="Nscale Text Generation"
from litellm import completion
import os

os.environ["NSCALE_API_KEY"] = ""  # your Nscale API key
response = completion(
    model="nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=[{"role": "user", "content": "What is LiteLLM?"}]
)
print(response)
```

```python showLineNumbers title="Nscale Text Generation - Streaming"
from litellm import completion
import os

os.environ["NSCALE_API_KEY"] = ""  # your Nscale API key
stream = completion(
    model="nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=[{"role": "user", "content": "What is LiteLLM?"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

### 影像生成 {#image-generation}

```python showLineNumbers title="Nscale Image Generation"
from litellm import image_generation
import os

os.environ["NSCALE_API_KEY"] = ""  # your Nscale API key
response = image_generation(
    model="nscale/stabilityai/stable-diffusion-xl-base-1.0",
    prompt="A beautiful sunset over mountains",
    n=1,
    size="1024x1024"
)
print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct
    litellm_params:
      model: nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct
      api_key: os.environ/NSCALE_API_KEY
  - model_name: nscale/meta-llama/Llama-3.3-70B-Instruct
    litellm_params:
      model: nscale/meta-llama/Llama-3.3-70B-Instruct
      api_key: os.environ/NSCALE_API_KEY
  - model_name: nscale/stabilityai/stable-diffusion-xl-base-1.0
    litellm_params:
      model: nscale/stabilityai/stable-diffusion-xl-base-1.0
      api_key: os.environ/NSCALE_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Nscale via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=[{"role": "user", "content": "What is LiteLLM?"}]
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Nscale via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=[{"role": "user", "content": "What is LiteLLM?"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Nscale via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "messages": [{"role": "user", "content": "What is LiteLLM?"}]
  }'
```

</TabItem>
</Tabs>

## 開始使用 {#getting-started}
1. 在 [console.nscale.com](https://console.nscale.com) 建立帳戶
2. 領取免費點數
3. 在設定中建立 API 金鑰
4. 開始使用 LiteLLM 發送 API 請求

## 其他資源 {#additional-resources}
- [Nscale 文件](https://docs.nscale.com/docs/getting-started/overview)
- [部落格：Sovereign Serverless](https://www.nscale.com/blog/sovereign-serverless-how-we-designed-full-isolation-without-sacrificing-performance)
