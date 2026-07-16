import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 預測輸出 {#predicted-outputs}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 當 LLM 的大部分輸出可事先得知時，請使用此功能。例如，如果您要請模型僅做少量修改來重寫某段文字或程式碼，您可以將既有內容作為預測輸入，藉由 Predicted Outputs 大幅降低延遲。 |
| 支援的提供者 | `openai` |
| OpenAI 關於 Predicted Outputs 的文件連結 | [Predicted Outputs ↗](https://platform.openai.com/docs/guides/latency-optimization#use-predicted-outputs) |
| LiteLLM 版本起支援 | `v1.51.4` |

## 使用 Predicted Outputs {#using-predicted-outputs}

<Tabs>
<TabItem label="LiteLLM Python SDK" value="Python">

在此範例中，我們要重構一段 C# 程式碼，並將 Username 屬性改為 Email：
```python
import litellm
os.environ["OPENAI_API_KEY"] = "your-api-key"
code = """
/// <summary>
/// Represents a user with a first name, last name, and username.
/// </summary>
public class User
{
    /// <summary>
    /// Gets or sets the user's first name.
    /// </summary>
    public string FirstName { get; set; }

    /// <summary>
    /// Gets or sets the user's last name.
    /// </summary>
    public string LastName { get; set; }

    /// <summary>
    /// Gets or sets the user's username.
    /// </summary>
    public string Username { get; set; }
}
"""

completion = litellm.completion(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "user",
            "content": "Replace the Username property with an Email property. Respond only with code, and with no markdown formatting.",
        },
        {"role": "user", "content": code},
    ],
    prediction={"type": "content", "content": code},
)

print(completion)
```

</TabItem>
<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 中定義模型

```yaml
model_list:
  - model_name: gpt-4o-mini # OpenAI gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY 

```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 進行測試

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-1234
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)

completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "user",
            "content": "Replace the Username property with an Email property. Respond only with code, and with no markdown formatting.",
        },
        {"role": "user", "content": code},
    ],
    prediction={"type": "content", "content": code},
)

print(completion)
```

</TabItem>
</Tabs>
