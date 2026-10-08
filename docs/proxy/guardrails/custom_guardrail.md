import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自訂 Guardrail {#custom-guardrail}

如果您想撰寫程式碼來執行自訂 guardrail，請使用這個

## 快速開始  {#quick-start}

### 1. 撰寫一個 `CustomGuardrail` 類別 {#1-write-a-customguardrail-class}

您只需要實作一個方法：`apply_guardrail`。LiteLLM 會從請求（或回應）中取出內容，將其作為 `inputs` 交給您，並寫回您回傳的任何內容。若要封鎖呼叫，請拋出例外。

**範例 `CustomGuardrail` 類別**

建立一個名為 `custom_guardrail.py` 的新檔案，並加入以下程式碼：

```python
import os
from typing import TYPE_CHECKING, List, Literal, Optional

from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.llms.custom_httpx.http_handler import (
    get_async_httpx_client,
    httpxSpecialProvider,
)
from litellm.types.utils import GenericGuardrailAPIInputs

if TYPE_CHECKING:
    from litellm.litellm_core_utils.litellm_logging import Logging as LiteLLMLoggingObj


class myCustomGuardrail(CustomGuardrail):
    def __init__(self, api_key: Optional[str] = None, api_base: Optional[str] = None, **kwargs):
        self.api_key = api_key or os.getenv("MY_GUARDRAIL_API_KEY")
        self.api_base = api_base or os.getenv("MY_GUARDRAIL_API_BASE", "https://api.myguardrail.com")
        super().__init__(**kwargs)

    async def apply_guardrail(
        self,
        inputs: GenericGuardrailAPIInputs,
        request_data: dict,
        input_type: Literal["request", "response"],
        logging_obj: Optional["LiteLLMLoggingObj"] = None,
    ) -> GenericGuardrailAPIInputs:
        """
        Check the extracted content against your guardrail rules.
        Raise an exception to block the call.
        Return the inputs (optionally modified) to allow it through.
        """
        checked_texts: List[str] = []
        for text in inputs.get("texts") or []:
            result = await self._check_with_api(text, request_data)

            if result.get("action") == "BLOCK":
                raise Exception(f"Content blocked: {result.get('reason', 'Policy violation')}")

            checked_texts.append(result.get("masked_text") or text)

        inputs["texts"] = checked_texts
        return inputs

    async def _check_with_api(self, text: str, request_data: dict) -> dict:
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

### `apply_guardrail` 參數 {#apply_guardrail-parameters}

| Parameter | What it is |
|-----------|------------|
| `inputs` | LiteLLM 從這次呼叫中擷取出的所有內容。下方為各鍵。 |
| `request_data` | 請求本文。`request_data["metadata"]` 保存呼叫方——`user_api_key_user_id`、`user_api_key_team_id` 等。 |
| `input_type` | 進入時的 `"request"`、傳出時的 `"response"`。可讓同一個類別同時處理雙向。 |
| `logging_obj` | LiteLLM 針對此呼叫的記錄物件，若您想附加自己的中繼資料可使用。 |

`inputs` 中的每個鍵都是選用的，因此您只會收到這次呼叫實際具有的那些：

| Key | What's in it |
|-----|--------------|
| `texts` | 要檢查的文字。這是大多數 guardrails 會使用的項目。 |
| `images` | 來自請求的圖片，格式為 base64 或 URL。 |
| `tools` | 傳送給 LLM 的工具定義。 |
| `tool_calls` | LLM 要求的工具呼叫。 |
| `structured_messages` | OpenAI 格式的完整訊息，因此您可以分辨系統訊息與使用者訊息。 |
| `model` | 此呼叫路由到的模型。 |

**若要允許此呼叫，請回傳 `inputs`。** 若要遮罩，直接原地編輯 `texts` 或 `tool_calls`；LiteLLM 會將它們映射回原始請求或回應。

`structured_messages` 是例外：**請以新的列表取代該列表。** LiteLLM 只有在您回傳不同物件時才會使用它，因此原地編輯會被忽略。

在串流期間，您也可以設定 `stream_holdback_chars`，這是 LiteLLM 要延遲保留的尾端字元逐字串計數，以免比對結果被拆到兩個 chunk 中。

:::tip[進階：使用個別事件回呼]

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
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "my-custom-guardrail"
    litellm_params:
      guardrail: custom_guardrail.myCustomGuardrail  # 👈 Key change
      mode: "pre_call"                  # when apply_guardrail runs - see Mode Options below
      api_key: os.environ/MY_GUARDRAIL_API_KEY
      api_base: https://api.myguardrail.com
```

:::info[模式選項]

`apply_guardrail` 會在三種模式中都執行。模式決定它何時執行，以及它看到的是請求還是回應。

| Mode | Runs | `input_type` | Can it mask? |
|------|------|--------------|--------------|
| `pre_call` | 在 LLM 呼叫之前 | `"request"` | 是 |
| `during_call` | 與 LLM 呼叫同時 | `"request"` | 僅可阻擋——見下文 |
| `post_call` | 在 LLM 回應之後 | `"response"` | 是 |

**如果您要遮罩或重寫內容，請使用 `pre_call`。** `during_call` 會讓您的 guardrail 與 LLM 呼叫平行執行以節省延遲，因此它可以可靠地*阻擋*不良請求，但您的編輯可能在請求送出前尚未生效。

如果您改為實作個別事件回呼，這三種模式會分別呼叫 `async_pre_call_hook`、`async_moderation_hook` 與 `async_post_call_success_hook`。

:::

:::note[串流與 post_call guardrails]

針對**串流回應**，`post_call` guardrails 會在所有 chunk 都已傳送給用戶端後，於完全組裝完成的回應上執行。這使得串流上的 `post_call` guardrails 成為**僅供稽核**：它們可以檢查並記錄完整回應，但無法阻擋內容傳遞。Guardrail 結果會記錄在記錄負載中的 `guardrail_information`，以供法規遵循與稽核。

若要即時篩選或封鎖串流內容，請改用 `async_post_call_streaming_iterator_hook`，它會在 chunk 抵達時進行處理。

實作 `apply_guardrail`（例如 [Bedrock](./bedrock#streaming)）的內建 guardrails 在串流上採取相反的預設行為：LiteLLM 會快取每個 chunk，直到組裝後的回應通過審核，因此封鎖會在任何內容送達用戶端之前發生。對此類 guardrail 設定 `streaming_buffer_until_moderated: false` 並搭配 `streaming_end_of_stream_only: true`，即可取得上述僅供稽核的行為，且不會增加首 token 時間。

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

**[Langchain、OpenAI SDK 使用範例](/docs/proxy/user_keys#request-format)**

<Tabs>
<TabItem label="已封鎖的請求" value = "blocked">

如果這個請求違反您的 guardrail 政策，將會被封鎖：

```shell
curl -i -X POST http://localhost:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
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

<EnterpriseFeature />

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

LiteLLM Proxy 允許您依照 [`guardrails` 規格](/docs/proxy/guardrails/quick_start#guardrails-request-parameter) 在請求本文中傳遞 `guardrails`。若要將 `extra_body` 附加到 guardrail，請將 `guardrails` 作為列表傳送，並使 guardrail 成為以其 `guardrail_name` 為鍵的物件。

<Tabs>
<TabItem value="openai" label="OpenAI Python">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "Write a short poem"}],
    extra_body={
        "guardrails": [
            {
                "custom-pre-guard": {
                    "extra_body": {
                        "success_threshold": 0.9
                    }
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
    "model": "{{openai_large}}",
    "messages": [
        {
            "role": "user",
            "content": "Write a short poem"
        }
    ],
    "guardrails": [
        {
            "custom-pre-guard": {
                "extra_body": {
                    "success_threshold": 0.9
                }
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

| Component | Description | Optional | Checked Data | Can Modify Input | Can Modify Output | Can Fail Call |
|-----------|-------------|----------|--------------|------------------|-------------------|----------------|
| `apply_guardrail` | 用於檢查並可選擇性修改擷取輸入的單一方法，適用於請求與回應 | ✅ | INPUT 或 OUTPUT | ✅ | ✅ | ✅ |
| `async_pre_call_hook` | 在 LLM API 呼叫之前執行的回呼 | ✅ | INPUT | ✅ | ❌ | ✅ |
| `async_moderation_hook` | 在 LLM API 呼叫期間執行的回呼| ✅ | INPUT | ❌ | ❌ | ✅ |
| `async_post_call_success_hook` | 在成功的 LLM API 呼叫之後執行的回呼。對於串流，會在傳送後於組裝完成的回應上執行（僅供稽核，無法阻擋）。 | ✅ | INPUT, OUTPUT | ❌ | ✅ | ✅（僅限非串流） |
| `async_post_call_streaming_iterator_hook` | 即時處理串流回應的回呼（可過濾／阻擋 chunk） | ✅ | OUTPUT | ❌ | ✅ | ✅ |

## 常見問題 {#frequently-asked-questions}

**Q. `apply_guardrail` 是否同時適用於請求與回應（pre_call、during_call 和 post_call hooks）？**

**A.** 是的，同一個函式兩者都可使用 - 實作請見 [此處](https://github.com/BerriAI/litellm/blob/0292b84dc47473ddeff29bd5a86f529bc523034b/litellm/proxy/utils.py#L825)

**Q. 在 `apply_guardrail` 的輸入中，我會得到什麼？每個欄位代表什麼？**

**A.** 請參閱上方的[參數參考](#apply_guardrail-parameters)。您首先應該關注的是 `inputs["texts"]`，也就是您將傳送到 API 進行驗證的擷取文字——實作請見[此處](https://github.com/BerriAI/litellm/blob/main/litellm/llms/anthropic/chat/guardrail_translation/handler.py)

**Q. 這個函式是否與 LLM 提供者無關？意思是，對 OpenAI 和 Anthropic 等提供者是否會傳遞相同的值？**

**A.** 是

**Q. 我如何知道我的防護欄正在執行？**

**A.** 如果您實作 `apply_guardrail`，您可以透過 [`/apply_guardrail` API](../../apply_guardrail) 直接查詢該防護欄。
