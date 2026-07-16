# AI/ML API {#aiml-api}
https://aimlapi.com/

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | AI/ML API 提供存取最先進的 AI 模型，包括用於高品質圖片生成的 flux-pro/v1.1。 |
| LiteLLM 提供者路由 | `aiml/` |
| 提供者文件連結 | [AI/ML API ↗](https://docs.aimlapi.com/) |
| 支援的操作 | [`/chat/completions`], [`/images/generations`](#image-generation) |

LiteLLM 支援 AI/ML API 圖片生成請求。

## API 基礎位址、金鑰 {#api-base-key}
```python
# env variable
os.environ['AIML_API_KEY'] = "your-api-key"
os.environ['AIML_API_BASE'] = "https://api.aimlapi.com"  # [optional] 
```
使用 AI/ML API 入門很簡單。請依照以下步驟設定您的整合：

### 1. 取得您的 API 金鑰   {#1-get-your-api-key}
首先，您需要一組 API 金鑰。您可以在這裡取得：  
🔑 [取得您的 API 金鑰](https://aimlapi.com/app/keys/?utm_source=aimlapi&utm_medium=github&utm_campaign=integration)  

### 2. 探索可用模型   {#2-explore-available-models}
想找不同的模型嗎？瀏覽完整的支援模型清單：  
📚 [模型完整清單](https://docs.aimlapi.com/api-overview/model-database/text-models?utm_source=aimlapi&utm_medium=github&utm_campaign=integration)  

### 3. 閱讀文件   {#3-read-the-documentation}
如需詳細的設定說明與使用指南，請查看官方文件：  
📖 [AI/ML API 文件](https://docs.aimlapi.com/quickstart/setting-up?utm_source=aimlapi&utm_medium=github&utm_campaign=integration)  

### 4. 需要協助嗎？   {#4-need-help}
如果您有任何問題，歡迎隨時聯絡。我們很樂意提供協助！ 🚀  [Discord](https://discord.gg/hvaUsJpVJf)

## 使用方式 {#usage}
您可以在 aimlapi.com/models 上從 LLama、Qwen、Flux，以及 200+ 其他開放原始碼與閉源模型中選擇。例如：

```python
import litellm

response = litellm.completion(
    model="aiml/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", # The model name must include prefix "openai" + the model name from ai/ml api
    api_key="", # your aiml api-key 
    api_base="https://api.aimlapi.com/v2",
    messages=[
        {
            "role": "user",
            "content": "Hey, how's it going?",
        }
    ],
)
```

## 串流 {#streaming}

```python
import litellm

response = litellm.completion(
    model="aiml/Qwen/Qwen2-72B-Instruct",  # The model name must include prefix "openai" + the model name from ai/ml api
    api_key="",  # your aiml api-key 
    api_base="https://api.aimlapi.com/v2",
    messages=[
        {
            "role": "user",
            "content": "Hey, how's it going?",
        }
    ],
    stream=True,
)
for chunk in response:
    print(chunk)
```

## 非同步完成 {#async-completion}

```python
import asyncio

import litellm


async def main():
    response = await litellm.acompletion(
        model="aiml/anthropic/claude-3-5-haiku",  # The model name must include prefix "openai" + the model name from ai/ml api
        api_key="",  # your aiml api-key
        api_base="https://api.aimlapi.com/v2",
        messages=[
            {
                "role": "user",
                "content": "Hey, how's it going?",
            }
        ],
    )
    print(response)


if __name__ == "__main__":
    asyncio.run(main())
```

## 非同步串流 {#async-streaming}

```python
import asyncio
import traceback

import litellm


async def main():
    try:
        print("test acompletion + streaming")
        response = await litellm.acompletion(
            model="aiml/nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", # The model name must include prefix "openai" + the model name from ai/ml api
            api_key="", # your aiml api-key
            api_base="https://api.aimlapi.com/v2",
            messages=[{"content": "Hey, how's it going?", "role": "user"}],
            stream=True,
        )
        print(f"response: {response}")
        async for chunk in response:
            print(chunk)
    except:
        print(f"error occurred: {traceback.format_exc()}")
        pass


if __name__ == "__main__":
    asyncio.run(main())
```

## 非同步嵌入 {#async-embedding}

```python
import asyncio

import litellm


async def main():
    response = await litellm.aembedding(
        model="aiml/text-embedding-3-small", # The model name must include prefix "openai" + the model name from ai/ml api
        api_key="",  # your aiml api-key
        api_base="https://api.aimlapi.com/v1", # 👈 the URL has changed from v2 to v1
        input="Your text string",
    )
    print(response)


if __name__ == "__main__":
    asyncio.run(main())
```

## 非同步圖片生成 {#async-image-generation}

```python
import asyncio

import litellm


async def main():
    response = await litellm.aimage_generation(
        model="aiml/dall-e-3",  # The model name must include prefix "openai" + the model name from ai/ml api
        api_key="",  # your aiml api-key
        api_base="https://api.aimlapi.com/v1", # 👈 the URL has changed from v2 to v1
        prompt="A cute baby sea otter",
    )
    print(response)


if __name__ == "__main__":
    asyncio.run(main())
```
