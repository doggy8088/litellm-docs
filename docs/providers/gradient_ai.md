import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GradientAI {#gradientai}
https://digitalocean.com/products/gradientai

LiteLLM 原生支援 GradientAI 模型。
若要使用 GradientAI 模型，請在您的 LiteLLM 請求中將其指定為 `gradient_ai/<model-name>`。

## API 金鑰與端點 {#api-key--endpoint}

請將您的憑證與端點設為環境變數：

```python
import os
os.environ['GRADIENT_AI_API_KEY'] = "your-api-key"
os.environ['GRADIENT_AI_AGENT_ENDPOINT'] = "https://api.gradient_ai.com/api/v1/chat"  # default endpoint
```

## 範例用法 {#sample-usage}

```python
from litellm import completion
import os

os.environ['GRADIENT_AI_API_KEY'] = "your-api-key"
response = completion(
    model="gradient_ai/model-name",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ],
)
print(response.choices[0].message.content)
```

## 串流範例 {#streaming-example}

```python
from litellm import completion
import os

os.environ['GRADIENT_AI_API_KEY'] = "your-api-key"
response = completion(
    model="gradient_ai/model-name",
    messages=[
        {"role": "user", "content": "Write a story about a robot learning to love"}
    ],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

## 支援的參數 {#supported-parameters}

| 參數                        | 類型         | 說明                                                        |
|-----------------------------------|--------------|--------------------------------------------------------------------|
| `temperature`                     | float        | 控制隨機性（0.0-2.0）                                      |
| `top_p`                           | float        | 核心採樣參數（0.0-1.0）                               |
| `max_tokens`                      | int          | 要生成的最大 tokens 數                                         |
| `max_completion_tokens`           | int          | max_tokens 的替代項                                          |
| `stream`                          | bool         | 是否串流回應                                     |
| `k`                               | int          | 從知識庫傳回的前幾個結果                         |
| `retrieval_method`                | string       | 擷取策略（rewrite/step_back/sub_queries/none）            |
| `frequency_penalty`               | float        | 對重複 tokens 施加懲罰（-2.0 到 2.0）                            |
| `presence_penalty`                | float        | 根據出現次數對 tokens 施加懲罰（-2.0 到 2.0）                   |
| `stop`                            | string/list  | 停止生成的序列                                       |
| `kb_filters`                      | List[Dict]   | 知識庫擷取篩選器                               |
| `instruction_override`            | string       | 覆寫代理程式的預設指令                               |
| `include_retrieval_info`          | bool         | 包含文件擷取中繼資料                                |
| `include_guardrails_info`         | bool         | 包含防護欄觸發中繼資料                                 |
| `provide_citations`               | bool         | 在回應中包含引用                                      |

---

更多詳情請參閱 [DigitalOcean GradientAI 文件](https://digitalocean.com/products/gradientai)。
