import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自訂 Guardrail {#custom-guardrail}

如果您想撰寫程式碼來執行自訂 guardrail，請使用這個

## 快速開始  {#quick-start}

### 1. 撰寫一個 `CustomGuardrail` 類別 {#1-write-a-customguardrail-class}

建立自訂 guardrail 最簡單的方法，是實作 `apply_guardrail` 方法。這個方法會在檢查文字內容時被呼叫，並且可以透過擲出例外來封鎖請求。

**範例 `CustomGuardrail` 類別**

建立一個名為 `custom_guardrail.py` 的新檔案，並加入以下程式碼：

```python
import os
from typing import Optional, List
from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.types.guardrails import PiiEntityType
from litellm._logging import verbose_proxy_logger
from litellm.llms.custom_httpx.http_handler import (
    get_async_httpx_client,
    httpxSpecialProvider,
)

class myCustomGuardrail(CustomGuardrail):
    def __init__(self, api_key: Optional[str] = None, api_base: Optional[str] = None, **kwargs):
        self.api_key = api_key or os.getenv("MY_GUARDRAIL_API_KEY")
        self.api_base = api_base or os.getenv("MY_GUARDRAIL_API_BASE", "https://api.myguardrail.com")
        super().__init__(**kwargs)

    async def apply_guardrail(
        self,
        text: str, # IMPORTANT: This is the text to check against your guardrail rules. It's extracted from the request or response across all LLM call types.
        language: Optional[str] = None, # ignore 
        entities: Optional[List[PiiEntityType]] = None, # ignore
        request_data: Optional[dict] = None, # ignore
    ) -> str:
        """
        Check text content against your guardrail rules.
        Raise an exception to block the request.
        Return the text (optionally modified) to allow it through.
        """
        result = await self._check_with_api(text, request_data)
        
        if result.get("action") == "BLOCK":
            raise Exception(f"Content blocked: {result.get('reason', 'Policy violation')}")
        
        return text

    async def _check_with_api(self, text: str, request_data: Optional[dict]) -> dict:
        async_client = get_async_httpx_client(llm_provider=httpxSpecialProvider.LoggingCallback)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        
        response = await async_client.post(
            f"{self.api_base}/check",
            headers=headers,
            json={"text": text},
            timeout=5,
        )
        
        response.raise_for_status()
        return response.json()
```

:::tip 進階：使用個別事件 hook

如果您需要更細緻的控制，可以實作個別事件 hook，取代（或額外搭配）`apply_guardrail`：

- `async_pre_call_hook` - 在發出 LLM API 呼叫前修改輸入或拒絕請求
- `async_moderation_hook` - 拒絕請求，與 LLM API 呼叫平行執行（有助於降低延遲）
- `async_post_call_success_hook` - 在發出 LLM API 呼叫後，對輸入/輸出套用 guardrail
- `async_post_call_streaming_iterator_hook` - 將整個串流傳遞給 guardrail

**[在此查看個別事件 hook 的範例](#advanced-individual-event-hooks)** | **[在此查看方法的詳細規格](#customguardrail-methods)**

:::

### 2. 在 LiteLLM `config.yaml` 中傳入您的自訂 guardrail 類別 {#2-pass-your-custom-guardrail-class-in-litellm-configyaml}

在下方設定中，我們透過設定 `guardrail: custom_guardrail.myCustomGuardrail`，將 guardrail 指向我們的自訂 guardrail

- Python 檔名：`custom_guardrail.py`
- Guardrail 類別名稱：`myCustomGuardrail`。這是在步驟 1 中定義的

`guardrail: custom_guardrail.myCustomGuardrail`

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "my-custom-guardrail"
    litellm_params:
      guardrail: custom_guardrail.myCustomGuardrail  # 👈 Key change
      mode: "during_call"               # runs apply_guardrail method
      api_key: os.environ/MY_GUARDRAIL_API_KEY
      api_base: https://api.myguardrail.com
```

:::info 模式選項

- `during_call` - 預設模式，執行 `apply_guardrail` 方法（若使用個別 hook，則執行 `async_moderation_hook`）
- `pre_call` - 執行 `async_pre_call_hook` 進行輸入修改
- `post_call` - 執行 `async_post_call_success_hook` 進行輸出驗證

:::

:::note 串流與 post_call guardrails

對於**串流回應**，`post_call` guardrails 會在所有 chunk 都已傳送給用戶端之後，對完整組裝好的回應執行。這表示串流上的 `post_call` guardrails 只能作為**稽核用途**——它們可以檢查並記錄完整回應，但無法阻止內容傳送。guardrail 結果會記錄在記錄負載中的 `guardrail_information`，以供合規與稽核使用。

若要即時篩選或封鎖串流內容，請改用 `async_post_call_streaming_iterator_hook`，它會在 chunk 抵達時進行處理。

:::

<details>
<summary>進階：使用個別事件 hook 設定多種模式</summary>

如果您正在使用個別事件 hook，可以設定具有不同模式的多個 guardrail：

```yaml
guardrails:
  - guardrail_name: "custom-pre-guard"
    litellm_params:
      guardrail: custom_guardrail.myCustomGuardrail
      mode: "pre_call"                  # runs async_pre_call_hook
  - guardrail_name: "custom-during-guard"
    litellm_params:
      guardrail: custom_guardrail.myCustomGuardrail  
      mode: "during_call"               # runs async_moderation_hook
  - guardrail_name: "custom-post-guard"
    litellm_params:
      guardrail: custom_guardrail.myCustomGuardrail
      mode: "post_call"                 # runs async_post_call_success_hook
```

</details>

### 3. 啟動 LiteLLM 閘道  {#3-start-litellm-gateway}

<Tabs>
<TabItem value="docker" label="Docker 執行">

將您的 `custom_guardrail.py` 掛載到 LiteLLM Docker 容器上

這會將您本機目錄中的 `custom_guardrail.py` 檔案掛載到 Docker 容器中的 `/app` 目錄，讓 LiteLLM Gateway 可以存取。

```shell
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  --name my-app \
  -v $(pwd)/my_config.yaml:/app/config.yaml \
  -v $(pwd)/custom_guardrail.py:/app/custom_guardrail.py \
  my-app:latest \
  --config /app/config.yaml \
  --port 4000 \
  --detailed_debug \
```

</TabItem>

<TabItem value="py" label="litellm pip">

```shell
litellm --config config.yaml --detailed_debug
```

</TabItem>

</Tabs>

### 4. 測試它  {#4-test-it}

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="已封鎖的請求" value = "blocked">

如果這個請求違反您的 guardrail 政策，將會被封鎖：

```shell
curl -i -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "Content that violates policy"
        }
    ],
   "guardrails": ["my-custom-guardrail"]
}'
```

被封鎖時的預期回應：

```json
{
  "error": {
    "message": "Content blocked: Policy violation",
    "type": "None",
    "param": "None",
    "code": "500"
  }
}
```

</TabItem>

<TabItem label="成功呼叫" value = "allowed">

這個請求會通過 guardrail：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is the weather like today?"}
    ],
    "guardrails": ["my-custom-guardrail"]
  }'
```

</TabItem>

</Tabs>

<details>
<summary>進階：測試個別事件 hook</summary>

如果您正在使用個別事件 hook，可以分別測試每種模式：

#### 測試 `"custom-pre-guard"` {#test-custom-pre-guard}

<Tabs>
<TabItem label="修改輸入" value = "not-allowed">

預期在將請求傳送到 LLM API 之前，這會將字詞 `litellm` 遮蔽。[這會執行 `async_pre_call_hook`](#advanced-individual-event-hooks)

```shell
curl -i  -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "say the word - `litellm`"
        }
    ],
   "guardrails": ["custom-pre-guard"]
}'
```

</TabItem>

<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["custom-pre-guard"]
  }'
```

</TabItem>

</Tabs>

#### 測試 `"custom-during-guard"` {#test-custom-during-guard}

<Tabs>
<TabItem label="未成功的呼叫" value = "not-allowed">

預期這會失敗，因為訊息內容中包含 `litellm`。[這會執行 `async_moderation_hook`](#advanced-individual-event-hooks)

```shell
curl -i  -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "say the word - `litellm`"
        }
    ],
   "guardrails": ["custom-during-guard"]
}'
```

預期回應：

```json
{
  "error": {
    "message": "Guardrail failed words - `litellm` detected",
    "type": "None",
    "param": "None",
    "code": "500"
  }
}
```

</TabItem>

<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["custom-during-guard"]
  }'
```

</TabItem>

</Tabs>

#### 測試 `"custom-post-guard"` {#test-custom-post-guard}

<Tabs>
<TabItem label="未成功的呼叫" value = "not-allowed">

預期這會失敗，因為回應內容中會包含 `coffee`。[這會執行 `async_post_call_success_hook`](#advanced-individual-event-hooks)

```shell
curl -i  -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "what is coffee"
        }
    ],
   "guardrails": ["custom-post-guard"]
}'
```

預期回應：

```json
{
  "error": {
    "message": "Guardrail failed Coffee Detected",
    "type": "None",
    "param": "None",
    "code": "500"
  }
}
```

</TabItem>

<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i  -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "what is tea"
        }
    ],
   "guardrails": ["custom-post-guard"]
}'
```

</TabItem>

</Tabs>

</details>

## ✨ 將額外參數傳遞給 guardrail {#-pass-additional-parameters-to-guardrail}

:::info

✨ 這是企業版限定功能 [聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

可用於將額外參數傳遞給 guardrail API 呼叫，例如成功門檻之類的設定

1. 使用 `get_guardrail_dynamic_request_body_params`

`get_guardrail_dynamic_request_body_params` 是 `litellm.integrations.custom_guardrail.CustomGuardrail` 類別中的一個方法，會擷取在請求本文中傳入的動態 guardrail 參數。

```python
from typing import Any, Dict, List, Literal, Optional, Union
import litellm
from litellm._logging import verbose_proxy_logger
from litellm.caching.caching import DualCache
from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.proxy._types import UserAPIKeyAuth

class myCustomGuardrail(CustomGuardrail):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def async_pre_call_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        cache: DualCache,
        data: dict,
        call_type: Literal[
            "completion",
            "text_completion",
            "embeddings",
            "image_generation",
            "moderation",
            "audio_transcription",
            "pass_through_endpoint",
            "rerank"
        ],
    ) -> Optional[Union[Exception, str, dict]]:
        # Get dynamic params from request body
        params = self.get_guardrail_dynamic_request_body_params(request_data=data)
        # params will contain: {"success_threshold": 0.9}
        verbose_proxy_logger.debug("Guardrail params: %s", params)
        return data
```

2. 在您的 API 請求中傳入參數：

LiteLLM Proxy 允許您依照 [`guardrails` 規格](quick_start#spec-guardrails-parameter)，在請求本文中傳入 `guardrails`。

<Tabs>
<TabItem value="openai" label="OpenAI Python">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Write a short poem"}],
    extra_body={
        "guardrails": [
            "custom-pre-guard": {
                "extra_body": {
                    "success_threshold": 0.9
                }
            }
        ]
    }
)
```
</TabItem>

<TabItem value="curl" label="Curl">

```shell
curl 'http://0.0.0.0:4000/chat/completions' \
    -H 'Content-Type: application/json' \
    -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "user",
            "content": "Write a short poem"
        }
    ],
    "guardrails": [
        "custom-pre-guard": {
            "extra_body": {
                "success_threshold": 0.9
            }
        }
    ]
}'
```
</TabItem>
</Tabs>

`get_guardrail_dynamic_request_body_params` 方法會回傳：
```json
{
    "success_threshold": 0.9
}
```

## 進階：個別事件 Hook {#advanced-individual-event-hooks}

優點：更具彈性
缺點：您需要針對每一種 LLM 呼叫類型實作此功能（chat completions、text completions、embeddings、image generation、moderation、audio transcription、pass through endpoint、rerank 等）

若要更細緻地控制 guardrail 執行的時間與方式，您可以實作個別事件 hook。這讓您能夠：
- 在 LLM 呼叫前修改輸入
- 與 LLM 呼叫並行執行檢查（更低延遲）
- 在 LLM 呼叫後驗證或修改輸出
- 處理串流回應

### 使用個別事件 Hook 的範例 {#example-with-individual-event-hooks}

```python
from typing import Any, AsyncGenerator, Literal, Optional, Union

import litellm
from litellm._logging import verbose_proxy_logger
from litellm.caching.caching import DualCache
from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.proxy._types import UserAPIKeyAuth
from litellm.types.utils import ModelResponseStream, CallTypes


class myCustomGuardrail(CustomGuardrail):
    def __init__(
        self,
        **kwargs,
    ):
        # store kwargs as optional_params
        self.optional_params = kwargs

        super().__init__(**kwargs)

    async def async_pre_call_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        cache: DualCache,
        data: dict,
        call_type: Optional[CallTypes],
    ) -> Optional[Union[Exception, str, dict]]:
        """
        Runs before the LLM API call
        Runs on only Input
        Use this if you want to MODIFY the input
        """

        # In this guardrail, if a user inputs `litellm` we will mask it and then send it to the LLM
        _messages = data.get("messages")
        if _messages:
            for message in _messages:
                _content = message.get("content")
                if isinstance(_content, str):
                    if "litellm" in _content.lower():
                        _content = _content.replace("litellm", "********")
                        message["content"] = _content

        verbose_proxy_logger.debug(
            "async_pre_call_hook: Message after masking %s", _messages
        )

        return data

    async def async_moderation_hook(
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        call_type: Literal["completion", "embeddings", "image_generation", "moderation", "audio_transcription"],
    ):
        """
        Runs in parallel to LLM API call
        Runs on only Input

        This can NOT modify the input, only used to reject or accept a call before going to LLM API
        """

        # this works the same as async_pre_call_hook, but just runs in parallel as the LLM API Call
        # In this guardrail, if a user inputs `litellm` we will mask it.
        _messages = data.get("messages")
        if _messages:
            for message in _messages:
                _content = message.get("content")
                if isinstance(_content, str):
                    if "litellm" in _content.lower():
                        raise ValueError("Guardrail failed words - `litellm` detected")

    async def async_post_call_success_hook(
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        response,
    ):
        """
        Runs on response from LLM API call

        It can be used to reject a response

        If a response contains the word "coffee" -> we will raise an exception
        """
        verbose_proxy_logger.debug("async_pre_call_hook response: %s", response)
        if isinstance(response, litellm.ModelResponse):
            for choice in response.choices:
                if isinstance(choice, litellm.Choices):
                    verbose_proxy_logger.debug("async_pre_call_hook choice: %s", choice)
                    if (
                        choice.message.content
                        and isinstance(choice.message.content, str)
                        and "coffee" in choice.message.content
                    ):
                        raise ValueError("Guardrail failed Coffee Detected")

    async def async_post_call_streaming_iterator_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        response: Any,
        request_data: dict,
    ) -> AsyncGenerator[ModelResponseStream, None]:
        """
        Passes the entire stream to the guardrail

        This is useful for guardrails that need to see the entire response, such as PII masking.

        See Aim guardrail implementation for an example - https://github.com/BerriAI/litellm/blob/d0e022cfacb8e9ebc5409bb652059b6fd97b45c0/litellm/proxy/guardrails/guardrail_hooks/aim.py#L168

        Triggered by mode: 'post_call'
        """
        async for item in response:
            yield item

```

## **CustomGuardrail 方法** {#customguardrail-methods}

| 元件 | 說明 | 可選 | 檢查資料 | 可修改輸入 | 可修改輸出 | 可使呼叫失敗 |
|-----------|-------------|----------|--------------|------------------|-------------------|----------------|
| `apply_guardrail` | 用於檢查並可選擇性修改文字的簡單方法 | ✅ | INPUT 或 OUTPUT | ✅ | ✅ | ✅ |
| `async_pre_call_hook` | 在 LLM API 呼叫之前執行的 hook | ✅ | INPUT | ✅ | ❌ | ✅ |
| `async_moderation_hook` | 在 LLM API 呼叫期間執行的 hook| ✅ | INPUT | ❌ | ❌ | ✅ |
| `async_post_call_success_hook` | 在成功的 LLM API 呼叫之後執行的 hook。對於串流，會在傳送後對已組裝的回應執行（僅供稽核，無法封鎖）。 | ✅ | INPUT, OUTPUT | ❌ | ✅ | ✅（僅限非串流） |
| `async_post_call_streaming_iterator_hook` | 即時處理串流回應的 hook（可篩選/封鎖 chunk） | ✅ | OUTPUT | ❌ | ✅ | ✅ |

## 常見問題 {#frequently-asked-questions}

**Q. `apply_guardrail` 是否同時適用於請求與回應（pre_call、during_call 和 post_call hooks）？**

**A.** 是的，同一個函式兩者都可使用 - 實作請見 [此處](https://github.com/BerriAI/litellm/blob/0292b84dc47473ddeff29bd5a86f529bc523034b/litellm/proxy/utils.py#L825)

**Q. 在 `apply_guardrail` 的輸入中我會拿到什麼？每個欄位代表什麼（text、language、entities、request_data 是什麼）？**

**A.** 您最需要關注的是 'text' - 這是您會想傳送到 API 進行驗證的內容 - 實作請見 [此處](https://github.com/BerriAI/litellm/blob/0292b84dc47473ddeff29bd5a86f529bc523034b/litellm/llms/anthropic/chat/guardrail_translation/handler.py#L102)

**Q. 這個函式是否與 LLM 提供者無關？也就是說，例如對 OpenAI 和 Anthropic 會傳回相同的值嗎？

**A.** 是

**Q. 我如何知道我的防護欄正在執行？**

**A.** 如果您實作 `apply_guardrail`，您可以透過 [`/apply_guardrail` API](../../apply_guardrail) 直接查詢該防護欄。
