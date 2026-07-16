---
title: SDK 快速入門
sidebar_label: SDK 快速入門
description: 進行您的第一次 LiteLLM SDK 呼叫，然後跳到您接下來需要的功能之對應文件。
---

import NavigationCards from '@site/src/components/NavigationCards';

如果您要將 LiteLLM 直接整合到應用程式程式碼中，請使用此路徑。

## 1. 安裝 LiteLLM {#1-install-litellm}

```bash
uv add 'litellm==1.82.6'
```

## 2. 設定提供者憑證 {#2-set-provider-credentials}

先從一個提供者開始，並設定其環境變數。

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Azure OpenAI: `AZURE_API_KEY`, `AZURE_API_BASE`, `AZURE_API_VERSION`
- Bedrock: standard AWS credentials
- Vertex AI: `VERTEXAI_PROJECT`, `VERTEXAI_LOCATION`

如果您還沒有選定提供者，請瀏覽[所有支援的提供者](/docs/providers)。

## 3. 進行您的第一次呼叫 {#3-make-your-first-call}

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response.choices[0].message.content)
```

## 4. 檢查回應 {#4-check-the-response}

下面這行：

```python
print(response.choices[0].message.content)
```

會印出助理文字，例如：

```text
Hello! I'm doing well, thanks for asking.
```

如果您列印完整物件：

```python
print(response)
```

您會看到一個 Python `ModelResponse(...)` 物件。對於以 OpenAI 為後端的模型，可能會像這樣：

```python
ModelResponse(
    id='chatcmpl-abc123',
    created=1773782130,
    model='gpt-4o-2024-08-06',
    object='chat.completion',
    system_fingerprint='fp_4ff89bf575',
    choices=[
        Choices(
            finish_reason='stop',
            index=0,
            message=Message(
                content="Hello! I'm just a program, but I'm here to help you. How can I assist you today?",
                role='assistant',
                tool_calls=None,
                function_call=None,
                provider_specific_fields={'refusal': None},
                annotations=[]
            ),
            provider_specific_fields={}
        )
    ],
    usage=Usage(
        completion_tokens=21,
        prompt_tokens=13,
        total_tokens=34,
        completion_tokens_details=CompletionTokensDetailsWrapper(...),
        prompt_tokens_details=PromptTokensDetailsWrapper(...)
    ),
    service_tier='default'
)
```

相同的回應會遵循 OpenAI 風格的結構。概念上，它看起來會像這樣：

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thanks for asking."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 12,
    "total_tokens": 25
  }
}
```

`id`、`created`、token 數量，以及訊息文字都會因請求而異。

如果您呼叫的是以 OpenAI 為後端的模型，您也可能會看到其他欄位，例如 `system_fingerprint`、`service_tier`、`tool_calls`、`function_call`、`annotations`、`provider_specific_fields`，以及詳細的 token 使用量。完整輸出參考請見[completion output](/docs/completion/output)。

需要更多提供者範例嗎？請參閱主要的[Getting Started](/docs/#quick-start)頁面。

## 5. 選擇您的下一步 {#5-pick-your-next-step}

<NavigationCards
columns={3}
items={[
{
icon: "⚡",
title: "串流回應",
description: "使用 stream=True 逐步接收 token。",
to: "/docs/completion/stream",
},
{
icon: "🧰",
title: "使用工具",
description: "以與提供者無關的方式加入函式呼叫。",
to: "/docs/completion/function_call",
},
{
icon: "📦",
title: "回傳 JSON",
description: "將回應限制為結構化 JSON 輸出。",
to: "/docs/completion/json_mode",
},
{
icon: "🔀",
title: "加入路由",
description: "在應用程式程式碼中使用重試、備援與負載平衡。",
to: "/docs/routing",
},
{
icon: "🌐",
title: "選擇提供者",
description: "尋找特定提供者的驗證、模型命名與參數。",
to: "/docs/providers",
},
]}
/>

## 何時改用 Gateway {#when-to-use-gateway-instead}

如果您需要集中式驗證、虛擬金鑰、支出追蹤、共用記錄，或為多個應用程式提供單一相容 OpenAI 的端點，請使用 LiteLLM Gateway。

[前往 Gateway 快速入門 →](/docs/learn/gateway_quickstart)
