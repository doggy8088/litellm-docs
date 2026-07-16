import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Tencent TokenHub {#tencent-tokenhub}
https://www.tencentcloud.com/products/tokenhub

**我們支援所有 Tencent TokenHub 模型，只要在發送 completion 請求時將 `tencent/` 設為前綴**

TokenHub 是 Tencent Cloud 的統一 LLM 閘道。它提供與 OpenAI 相容的 Chat Completions endpoint，以及與 Anthropic 相容的 Messages endpoint，讓您能透過單一 API 金鑰存取 DeepSeek、GLM、Kimi、MiniMax 和 Hunyuan 模型。

## API 金鑰 {#api-key}
```python
# env variable
os.environ['TENCENT_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['TENCENT_API_KEY'] = ""
response = completion(
    model="tencent/deepseek-v4-pro",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['TENCENT_API_KEY'] = ""
response = completion(
    model="tencent/deepseek-v4-pro",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 支援的模型 {#supported-models}
我們支援 TokenHub international endpoint 上可用的所有模型。

| 模型名稱 | 函式呼叫 |
|---|---|
| deepseek-v4-flash-202605 | `completion(model="tencent/deepseek-v4-flash-202605", messages)` |
| deepseek-v4-pro-202606 | `completion(model="tencent/deepseek-v4-pro-202606", messages)` |
| deepseek-v4-flash | `completion(model="tencent/deepseek-v4-flash", messages)` |
| deepseek-v4-pro | `completion(model="tencent/deepseek-v4-pro", messages)` |
| deepseek-v3.2 | `completion(model="tencent/deepseek-v3.2", messages)` |
| glm-5.1 | `completion(model="tencent/glm-5.1", messages)` |
| glm-5v-turbo | `completion(model="tencent/glm-5v-turbo", messages)` |
| glm-5-turbo | `completion(model="tencent/glm-5-turbo", messages)` |
| glm-5 | `completion(model="tencent/glm-5", messages)` |
| kimi-k2.6 | `completion(model="tencent/kimi-k2.6", messages)` |
| kimi-k2.5 | `completion(model="tencent/kimi-k2.5", messages)` |
| minimax-m3 | `completion(model="tencent/minimax-m3", messages)` |
| minimax-m2.7 | `completion(model="tencent/minimax-m2.7", messages)` |
| minimax-m2.5 | `completion(model="tencent/minimax-m2.5", messages)` |
| hy-mt2-plus | `completion(model="tencent/hy-mt2-plus", messages)` |

## 自訂 API Base {#custom-api-base}

預設情況下，LiteLLM 使用新加坡區域的 endpoint。您可以用 `TENCENT_API_BASE` 覆寫它。

```python
import os

os.environ['TENCENT_API_BASE'] = "https://tokenhub.tencentcloudmaas.com/v1"  # Guangzhou region
```

## Thinking / Reasoning 模式 {#thinking--reasoning-mode}

許多 TokenHub 模型支援延伸思考。LiteLLM 支援 `thinking` 和 `reasoning_effort` 這兩個參數。

<Tabs>
<TabItem value="thinking" label="thinking 參數">

```python
from litellm import completion
import os

os.environ['TENCENT_API_KEY'] = ""

resp = completion(
    model="tencent/deepseek-v4-pro",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    thinking={"type": "enabled"},
)

print(resp.choices[0].message.reasoning_content)
print(resp.choices[0].message.content)
```

</TabItem>
<TabItem value="reasoning_effort" label="reasoning_effort 參數">

```python
from litellm import completion
import os

os.environ['TENCENT_API_KEY'] = ""

resp = completion(
    model="tencent/deepseek-v4-pro",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    reasoning_effort="medium",
)

print(resp.choices[0].message.reasoning_content)
print(resp.choices[0].message.content)
```

</TabItem>
</Tabs>

:::note
當 `reasoning_effort` 的值不是 `"none"` 時，LiteLLM 會自動將其對應為 `thinking={"type": "enabled"}`。
:::

### 基本用法 {#basic-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['TENCENT_API_KEY'] = ""
resp = completion(
    model="tencent/deepseek-v4-pro",
    messages=[{"role": "user", "content": "Tell me a joke."}],
)

print(
    resp.choices[0].message.reasoning_content
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: deepseek-v4-pro
    litellm_params:
        model: tencent/deepseek-v4-pro
        api_key: os.environ/TENCENT_API_KEY
```

2. 執行 proxy

```bash
python litellm/proxy/main.py
```

3. 測試看看！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "deepseek-v4-pro",
    "messages": [
      {
        "role": "user",
        "content": "hello from litellm proxy"
      }
    ]
}'
```

</TabItem>

</Tabs>

## 與 Anthropic 相容的 Messages API {#anthropic-compatible-messages-api}

TokenHub 也提供與 Anthropic 相容的 Messages API。LiteLLM 會在可用時透過此 endpoint 路由請求。

```python
os.environ['TENCENT_API_KEY'] = ""
```

若要分別覆寫與 Chat Completions endpoint 不同的 Anthropic 相容 base URL：

```python
os.environ['TENCENT_ANTHROPIC_API_BASE'] = "https://tokenhub-intl.tencentcloudmaas.com"
```

當 `TENCENT_ANTHROPIC_API_BASE` 和 `TENCENT_API_BASE` 都有設定時，針對 Messages API 呼叫會以 Anthropic 專用的設定為優先。
