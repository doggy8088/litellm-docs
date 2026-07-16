---
title: "整合為模型提供者"
---

## OpenAI 相容提供者的快速開始 {#quick-start-for-openai-compatible-providers}

如果您的 API 與 OpenAI 相容，您可以透過編輯單一 JSON 檔案來新增支援。請參閱 [新增 OpenAI 相容提供者](/docs/contributing/adding_openai_compatible_providers) 了解簡單做法。

---

本指南著重於如何設定成為聊天提供者所需的類別與設定。

請先閱讀本指南，並查看程式碼庫中的既有程式碼，以了解如何作為其他提供者運作，例如處理 embeddings 或影像生成。

---

### 總覽 {#overview}

從提供者的角度來看，liteLLM 的運作方式很簡單。

liteLLM 作為一個包裝器，會接收 openai 請求並將它們路由到您的 API。接著，它會將您的輸出調整成標準輸出。

若要整合為提供者，您需要撰寫一個模組，將 API 接入，並作為 liteLLM API 與您的 API 之間的轉接器。

您要撰寫的模組同時扮演設定與轉換請求及回應的手段。

您的目標是有效地撰寫此模組，使其將輸入調整為您的 API，並將輸出調整為呼叫端的 liteLLM 程式碼。

它包含以下方法：

- 驗證請求
- 將請求轉換（調整）為傳送至您的 API 的請求
- 將來自您的 API 的回應轉換（調整）為回傳給呼叫端 liteLLM 程式碼的回應
- 以及其他幾項

---

### 1. 建立您的設定類別 {#1-create-your-config-class}

建立一個以您的提供者名稱命名的新目錄

#### `litellm/llms/your_provider_name_here` {#litellmllmsyour_provider_name_here}

在其中，您會想新增一個用於聊天設定的檔案

#### `litellm/llms/your_provider_name_here/chat/transformation.py` {#litellmllmsyour_provider_name_herechattransformationpy}

`transformation.py` 檔案將包含一個設定類別，決定您的 API 如何接入 liteLLM API。

將您的設定類別定義為繼承 `BaseConfig`：

```python
from litellm.llms.base_llm.chat.transformation import BaseConfig

class MyProviderChatConfig(BaseConfig):
    def __init__(self):
        ...
```

我們稍後會補上抽象方法。

---

### 2. 在程式碼庫的各處加入您自己 {#2-add-yourself-to-various-places-in-the-code-base}

liteLLM 正在努力改善這個流程，但目前您需要做的是以下幾點：

#### `litellm/__init__.py` {#litellm__init__py}

在檔案最上方，將您的 key 加入 keys 清單中作為一個選項

```py
azure_key: Optional[str] = None
anthropic_key: Optional[str] = None
replicate_key: Optional[str] = None
bytez_key: Optional[str] = None
cohere_key: Optional[str] = None
infinity_key: Optional[str] = None
clarifai_key: Optional[str] = None
```

匯入您的設定

```
from .llms.bytez.chat.transformation import BytezChatConfig
from .llms.custom_llm import CustomLLM
from .llms.bedrock.chat.converse_transformation import AmazonConverseConfig
from .llms.openai_like.chat.handler import OpenAILikeChatConfig
```

#### `litellm/main.py` {#litellmmainpy}

將您加入 `main.py`，讓請求可以路由到您的設定類別

```py
from .llms.bedrock.chat import BedrockConverseLLM, BedrockLLM
from .llms.bedrock.embed.embedding import BedrockEmbedding
from .llms.bedrock.image.image_handler import BedrockImageGeneration
from .llms.bytez.chat.transformation import BytezChatConfig
from .llms.codestral.completion.handler import CodestralTextCompletion
from .llms.cohere.embed import handler as cohere_embed
from .llms.custom_httpx.aiohttp_handler import BaseLLMAIOHTTPHandler

base_llm_http_handler = BaseLLMHTTPHandler()
base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler()
sagemaker_chat_completion = SagemakerChatHandler()
bytez_transformation = BytezChatConfig()
```

接著在程式碼更下方

```py
elif custom_llm_provider == "bytez":
    api_key = (
        api_key
        or litellm.bytez_key
        or get_secret_str("BYTEZ_API_KEY")
        or litellm.api_key
    )

    response = base_llm_http_handler.completion(
        model=model,
        messages=messages,
        headers=headers,
        model_response=model_response,
        api_key=api_key,
        api_base=api_base,
        acompletion=acompletion,
        logging_obj=logging,
        optional_params=optional_params,
        litellm_params=litellm_params,
        timeout=timeout,  # type: ignore
        client=client,
        custom_llm_provider=custom_llm_provider,
        encoding=encoding,
        stream=stream,
    )

    pass
```

注意：您可以依賴 liteLLM 透過 .completion() 呼叫將每個 args/kwargs 傳遞給您的設定

#### `litellm/constants.py` {#litellmconstantspy}

將您加入 `LITELLM_CHAT_PROVIDERS` 的清單

```py
LITELLM_CHAT_PROVIDERS = [
    "openai",
    "openai_like",
    "bytez",
    "xai",
    "custom_openai",
    "text-completion-openai",
```

將您加入這裡提供者的 if 陳述式鏈中

#### `litellm/litellm_core_utils/get_llm_provider_logic.py` {#litellmlitellm_core_utilsget_llm_provider_logicpy}

```py
elif model == "*":
    custom_llm_provider = "openai"
# bytez models
elif model.startswith("bytez/"):
    custom_llm_provider = "bytez"
if not custom_llm_provider:
    if litellm.suppress_debug_info is False:
        print()  # noqa
```

#### `litellm/litellm_core_utils/streaming_handler.py` {#litellmlitellm_core_utilsstreaming_handlerpy}

#### 如果您對串流做了某些自訂處理，這裡也需要更新，例如 {#if-you-are-doing-something-custom-with-streaming-this-needs-to-be-updated-eg}

```py
    def handle_bytez_chunk(self, chunk):
        try:
            is_finished = False
            finish_reason = ""

            return {
                "text": chunk,
                "is_finished": is_finished,
                "finish_reason": finish_reason,
            }
        except Exception as e:
            raise e
```

接著在檔案更下方

```
elif self.custom_llm_provider and self.custom_llm_provider == "bytez":
    response_obj = self.handle_bytez_chunk(chunk)
    completion_obj["content"] = response_obj["text"]
    if response_obj["is_finished"]:
        self.received_finish_reason = response_obj["finish_reason"]
    pass
```

---

### 3. 撰寫測試檔案來迭代您的程式碼 {#3-write-a-test-file-to-iterate-your-code}

在專案中的某個位置新增一個測試檔案，`tests/test_litellm/llms/my_provider/chat/test.py`

寫入以下內容：

```python
import os
from litellm import completion

os.environ["MY_PROVIDER_KEY"] = "KEY_GOES_HERE"

completion(model="my_provider/your-model", messages=[...], api_key="...")
```

如果您想用 vscode 偵錯工具執行，可以使用這個設定檔（建議）

`.vscode/launch.json`

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python Debugger: Current File",
      "type": "debugpy",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}",
        "MY_PROVIDER_API_KEY": "YOUR_API_KEY"
      }
    }
  ]
}
```

如果您使用偵錯工具執行，在更新 `"MY_PROVIDER_API_KEY": "YOUR_API_KEY"` 之後，可以從測試腳本中移除這段：

`os.environ["MY_PROVIDER_KEY"] = "KEY_GOES_HERE"`

---

### 4. 實作必要的方法 {#4-implement-required-methods}

最好按照 `completion()` 於 `litellm/llms/custom_httpx/llm_http_handler.py` 中的做法

您會看到它會呼叫基底類別中定義的每個方法。

偵錯工具是您的好幫手。

###### `validate_environment` {#validate_environment}

設定 headers，驗證 key/model：

```python
def validate_environment(...):
    headers.update({
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    })
    return headers
```

###### `get_complete_url` {#get_complete_url}

回傳最終請求 URL：

```python
def get_complete_url(...):
    return f"{api_base}/{model}"
```

###### `transform_request` {#transform_request}

將 OpenAI 風格的輸入調整為提供者特定格式：

```python
def transform_request(...):
    data = {"messages": messages, "params": optional_params}
    return data
```

###### `transform_response` {#transform_response}

處理並映射原始提供者回應：

```python
def transform_response(...):
    json = raw_response.json()
    model_response.model = model
    model_response.choices[0].message.content = json.get("output")
    return model_response
```

###### `get_sync_custom_stream_wrapper` / `get_async_custom_stream_wrapper` {#get_sync_custom_stream_wrapper--get_async_custom_stream_wrapper}

如果您需要做些什麼，這些都在這裡供您使用。請參閱 `litellm/llms/sagemaker/chat/transformation.py` 或 `litellm/llms/bytez/chat/transformation.py` 的實作，以更了解如何使用這些內容。

使用 `CustomStreamWrapper` + `httpx` 串流用戶端來回傳內容。

---

### 🧪 測試 {#-tests}

在 `tests/test_litellm/llms/my_provider/chat/test.py` 中建立測試。反覆迭代直到您對品質滿意為止！

---

### 其他想法 {#spare-thoughts}

如果您卡住了，請參考其他提供者實作，`ctrl + shift + f` 和 `ctrl + p` 會是您的好幫手！

您也可以造訪 [discord 意見回饋頻道](https://discord.gg/wuPM9dRgDw)
