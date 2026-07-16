import Image from '@theme/IdealImage';

# PromptLayer {#promptlayer}

:::tip

這是由社群維護的文件，如果您遇到錯誤，請提出 issue
https://github.com/BerriAI/litellm

:::

Promptlayer 是一個供提示工程師使用的平台。記錄 OpenAI 請求。搜尋使用歷史。追蹤效能。以視覺化方式管理提示範本。

<Image img={require('../../img/promptlayer.png')} />

## 使用 Promptlayer 記錄跨所有 LLM 提供者（OpenAI、Azure、Anthropic、Cohere、Replicate、PaLM）的請求 {#use-promptlayer-to-log-requests-across-all-llm-providers-openai-azure-anthropic-cohere-replicate-palm}

liteLLM 提供 `callbacks`，讓您能依據回應狀態輕鬆記錄資料。

### 使用回呼 {#using-callbacks}

從 https://promptlayer.com/ 取得您的 PromptLayer API 金鑰

只要 2 行程式碼，就能立即使用 promptlayer 記錄您**跨所有提供者**的回應：

```python
litellm.success_callback = ["promptlayer"]

```

完整程式碼

```python
from litellm import completion

## set env variables
os.environ["PROMPTLAYER_API_KEY"] = "your-promptlayer-key"

os.environ["OPENAI_API_KEY"], os.environ["COHERE_API_KEY"] = "", ""

# set callbacks
litellm.success_callback = ["promptlayer"]

#openai call
response = completion(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}])

#cohere call
response = completion(model="command-nightly", messages=[{"role": "user", "content": "Hi 👋 - i'm cohere"}])
```

### 記錄中繼資料  {#logging-metadata}

您也可以將 completion 呼叫中繼資料記錄到 Promptlayer。 

您可以透過 metadata 參數將中繼資料新增到 completion 呼叫：
```python 
completion(model,messages, metadata={"model": "ai21"})
```

**完整程式碼**
```python
from litellm import completion

## set env variables
os.environ["PROMPTLAYER_API_KEY"] = "your-promptlayer-key"

os.environ["OPENAI_API_KEY"], os.environ["COHERE_API_KEY"] = "", ""

# set callbacks
litellm.success_callback = ["promptlayer"]

#openai call - log llm provider is openai
response = completion(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}], metadata={"provider": "openai"})

#cohere call - log llm provider is cohere
response = completion(model="command-nightly", messages=[{"role": "user", "content": "Hi 👋 - i'm cohere"}], metadata={"provider": "cohere"})
```

感謝 [Nick Bradford](https://github.com/nsbradford)，來自 [Vim-GPT](https://github.com/nsbradford/VimGPT)，提供這個建議。 

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
