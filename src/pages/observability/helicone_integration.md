# Helicone 教學  {#helicone-tutorial}
[Helicone](https://helicone.ai/) 是一個開源的可觀測性平台，會代理您的 OpenAI 流量，並提供您關於支出、延遲與使用情況的關鍵洞察。

## 使用 Helicone 記錄跨所有 LLM 提供者（OpenAI、Azure、Anthropic、Cohere、Replicate、PaLM）的請求 {#use-helicone-to-log-requests-across-all-llm-providers-openai-azure-anthropic-cohere-replicate-palm}
liteLLM 提供 `success_callbacks` 和 `failure_callbacks`，讓您能夠輕鬆根據回應狀態將資料傳送至特定提供者。 

在這種情況下，我們希望在請求成功時將請求記錄到 Helicone。 

### 作法 1：使用回呼  {#approach-1-use-callbacks}
只要使用 1 行程式碼，即可透過 helicone 立即記錄您的回應，**跨所有提供者**： 
```
litellm.success_callback=["helicone"]
```

完整程式碼
```python
from litellm import completion

## set env variables
os.environ["HELICONE_API_KEY"] = "your-helicone-key" 
os.environ["OPENAI_API_KEY"], os.environ["COHERE_API_KEY"] = "", ""

# set callbacks
litellm.success_callback=["helicone"]

#openai call
response = completion(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}]) 

#cohere call
response = completion(model="command-nightly", messages=[{"role": "user", "content": "Hi 👋 - i'm cohere"}]) 
```

### 作法 2：［僅 OpenAI + Azure］將 Helicone 用作代理伺服器 {#approach-2-openai--azure-only-use-helicone-as-a-proxy}
Helicone 提供快取等進階功能。Helicone 目前支援 Azure 和 OpenAI 的這項功能。

如果您想使用 Helicone 來代理您的 OpenAI/Azure 請求，則可以——

- 透過以下方式將 helicone 設為您的 base url： `litellm.api_url` 
- 透過以下方式傳入 helicone 請求標頭： `litellm.headers` 

完整程式碼
```
import litellm
from litellm import completion

litellm.api_base = "https://oai.hconeai.com/v1"
litellm.headers = {"Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}"}

response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "how does a court case get to the Supreme Court?"}]
)

print(response)
```
