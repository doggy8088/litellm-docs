---
title: "透過 LiteLLM 使用 Z.AI (Zhipu) GLM API：設定"
sidebar_label: "Z.AI (Zhipu AI)"
description: "透過 SDK 或 AI Gateway 呼叫從 glm-4.7 到免費的 glm-4.5-flash 等 Z.AI (Zhipu AI) GLM 模型，支援串流、各模型價格與 -latest 別名。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Z.AI（Zhipu AI） {#zai-zhipu-ai}

Z.AI (Zhipu AI) 打造了 GLM 模型家族；LiteLLM 透過 Python SDK 或 AI Gateway 以 `zai/` 前綴呼叫 GLM 文字與聊天模型。

https://z.ai/

**我們支援 Z.AI GLM 文字／聊天模型，傳送 completion 請求時只要將 `zai/` 作為前綴即可**

## API 金鑰 {#api-key}
```python
# env variable
os.environ['ZAI_API_KEY']
```

## 使用範例 {#sample-usage}
```python
from litellm import completion
import os

os.environ['ZAI_API_KEY'] = ""
response = completion(
    model="zai/glm-4.7",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 使用範例 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['ZAI_API_KEY'] = ""
response = completion(
    model="zai/glm-4.7",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 支援的模型 {#supported-models}

我們支援所有 Z.AI GLM 模型，傳送 completion 請求時只要將 `zai/` 作為前綴即可。

| 模型名稱 | 函式呼叫 | 備註 |
|------------|---------------|-------|
| glm-4.7 | `completion(model="zai/glm-4.7", messages)` | **最新旗艦**，200K context，**推理** |
| glm-4.6 | `completion(model="zai/glm-4.6", messages)` | 200K context |
| glm-4.5 | `completion(model="zai/glm-4.5", messages)` | 128K context |
| glm-4.5v | `completion(model="zai/glm-4.5v", messages)` | 視覺模型 |
| glm-4.5-x | `completion(model="zai/glm-4.5-x", messages)` | 高階等級 |
| glm-4.5-air | `completion(model="zai/glm-4.5-air", messages)` | 輕量級 |
| glm-4.5-airx | `completion(model="zai/glm-4.5-airx", messages)` | 快速輕量級 |
| glm-4-32b-0414-128k | `completion(model="zai/glm-4-32b-0414-128k", messages)` | 32B 參數模型 |
| glm-4.5-flash | `completion(model="zai/glm-4.5-flash", messages)` | **免費等級** |

## 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

`zai/<family>-latest` 名稱會跟隨某個模型家族，當 LiteLLM 將它們移至較新的模型時，您的應用程式可以維持使用同一個模型字串。您可以像使用其他任何 Z.AI 模型名稱一樣使用它們。LiteLLM 會將目前的目標模型傳送給 Z.AI，並依該模型的價格計費。別名的運作方式以及各提供者的完整清單，請參閱[最新模型別名](../model_latest_aliases.md)。

| 別名 | 模型家族 |
| --- | --- |
| `zai/glm-latest` | GLM |
| `zai/glm-flash-latest` | GLM Flash |

## 模型價格 {#model-pricing}

| 模型 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 快取輸入（$/1M tokens） | 上下文視窗 |
|-------|---------------------|----------------------|---------------------------|----------------|
| glm-4.7 | $0.60 | $2.20 | $0.11 | 200K |
| glm-4.6 | $0.60 | $2.20 | - | 200K |
| glm-4.5 | $0.60 | $2.20 | - | 128K |
| glm-4.5v | $0.60 | $1.80 | - | 128K |
| glm-4.5-x | $2.20 | $8.90 | - | 128K |
| glm-4.5-air | $0.20 | $1.10 | - | 128K |
| glm-4.5-airx | $1.10 | $4.50 | - | 128K |
| glm-4-32b-0414-128k | $0.10 | $0.10 | - | 128K |
| glm-4.5-flash | **免費** | **免費** | - | 128K |

## 與 LiteLLM Proxy 搭配使用 {#using-with-litellm-proxy}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['ZAI_API_KEY'] = ""
response = completion(
    model="zai/glm-4.7",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: glm-4.7
    litellm_params:
        model: zai/glm-4.7
        api_key: os.environ/ZAI_API_KEY
  - model_name: glm-4.5-flash  # Free tier
    litellm_params:
        model: zai/glm-4.5-flash
        api_key: os.environ/ZAI_API_KEY
```

2. 執行 proxy

```bash
litellm --config config.yaml
```

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "glm-4.7",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
}'
```

</TabItem>
</Tabs>
