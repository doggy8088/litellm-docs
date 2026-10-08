import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deepseek {#deepseek}
https://deepseek.com/

**我們支援所有 Deepseek 模型，送出 completion 請求時只要將 `deepseek/` 作為前綴即可**

## API 金鑰 {#api-key}
```python
# env variable
os.environ['DEEPSEEK_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['DEEPSEEK_API_KEY'] = ""
response = completion(
    model="deepseek/deepseek-chat", 
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

os.environ['DEEPSEEK_API_KEY'] = ""
response = completion(
    model="deepseek/deepseek-chat", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 支援的模型 - 支援所有 Deepseek 模型！ {#supported-models---all-deepseek-models-supported}
我們支援所有 Deepseek 模型，送出 completion 請求時只要將 `deepseek/` 作為前綴即可

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| deepseek-chat | `completion(model="deepseek/deepseek-chat", messages)` | 
| deepseek-coder | `completion(model="deepseek/deepseek-coder", messages)` | 
| deepseek-flash | `completion(model="deepseek/deepseek-flash", messages)` | 
| deepseek-v4-pro | `completion(model="deepseek/deepseek-v4-pro", messages)` |

## 推理模型 {#reasoning-models}
| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| deepseek-reasoner | `completion(model="deepseek/deepseek-reasoner", messages)` |

### 思考 / 推理模式 {#thinking--reasoning-mode}

使用 `thinking` 或 `reasoning_effort` 參數，為 DeepSeek reasoner 模型啟用思考模式：

<Tabs>
<TabItem value="thinking" label="thinking 參數">

```python
from litellm import completion
import os

os.environ['DEEPSEEK_API_KEY'] = ""

resp = completion(
    model="deepseek/deepseek-reasoner",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    thinking={"type": "enabled"},
)
print(resp.choices[0].message.reasoning_content)  # Model's reasoning
print(resp.choices[0].message.content)  # Final answer
```

</TabItem>
<TabItem value="reasoning_effort" label="reasoning_effort 參數">

```python
from litellm import completion
import os

os.environ['DEEPSEEK_API_KEY'] = ""

resp = completion(
    model="deepseek/deepseek-reasoner",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    reasoning_effort="medium",  # low, medium, high all map to thinking enabled
)
print(resp.choices[0].message.reasoning_content)  # Model's reasoning
print(resp.choices[0].message.content)  # Final answer
```

</TabItem>
</Tabs>

:::note
DeepSeek 只支援 `{"type": "enabled"}` - 不像 Anthropic，它不支援 `budget_tokens`。任何不是 `reasoning_effort` 的 `"none"` 值都會啟用思考模式。
:::

### 基本用法 {#basic-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['DEEPSEEK_API_KEY'] = ""
resp = completion(
    model="deepseek/deepseek-reasoner",
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
  - model_name: deepseek-reasoner
    litellm_params:
        model: deepseek/deepseek-reasoner
        api_key: os.environ/DEEPSEEK_API_KEY
```

2. 執行 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "deepseek-reasoner",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Hi, how are you ?"
          }
        ]
      }
    ]
}'
```

</TabItem>

</Tabs>

## 離峰定價 {#off-peak-pricing}

DeepSeek 在其尖峰時段以標示費率的一半計費。尖峰時段為 UTC 週一至週五 01:00-04:00 和 06:00-10:00，排除中國國定假日。其他所有時段皆為離峰，包括週末與所有中國國定假日。以下費率為每 100 萬 tokens 的 USD，來自 [DeepSeek 定價頁面](https://api-docs.deepseek.com/quick_start/pricing)，適用於 `deepseek-flash`（DeepSeek-V4.1-Flash）與 `deepseek-v4-pro`（DeepSeek-V4-Pro-0813）

| 模型 | 費率 | 輸入 | 輸出 | 快取命中 |
|-------|------|-------|--------|-----------|
| deepseek-flash | 尖峰 | $0.30 | $1.20 | $0.006 |
| deepseek-flash | 離峰 | $0.15 | $0.60 | $0.003 |
| deepseek-v4-pro | 尖峰 | $1.32 | $3.96 | $0.044 |
| deepseek-v4-pro | 離峰 | $0.66 | $1.98 | $0.022 |

LiteLLM 的成本追蹤會自動套用離峰費率。這些模型的內建成本對照表項目已包含上述時程，且每個請求都會依其完成時的 UTC 時間與星期幾計價，因此追蹤的支出會與 DeepSeek 發票一致，無需額外設定。中國國定假日未納入模型，因此在那些日子尖峰時段仍會以尖峰費率計費，會稍微高估。舊版的 `deepseek-v4-flash` 與 `deepseek-v4-flash-vision-exp` 名稱由 DeepSeek-V4.1-Flash 提供，並以 Flash 費率計費，包含離峰時段。若要變更時程或費率，或在其他部署上設定，請參閱 [離峰定價](../proxy/off_peak_pricing)
