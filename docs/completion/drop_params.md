import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 移除不支援的參數  {#drop-unsupported-params}

依據您的 LLM 提供者移除不支援的 OpenAI 參數。

## 預設行為 {#default-behavior}

**預設情況下，LiteLLM 會擲回例外**，如果您將某個參數傳給不支援該參數的模型。 

例如，如果您將 `temperature=0.2` 傳給不支援 `temperature` 參數的模型，LiteLLM 會擲回例外。

**當 `drop_params=True` 已設定時**，LiteLLM 會移除不支援的參數，而不是擲回例外。這讓您的程式碼能在不同提供者之間順暢運作，而不需要為每個提供者自訂參數。

## 快速開始  {#quick-start}

```python 
import litellm 
import os 

# set keys 
os.environ["COHERE_API_KEY"] = "co-.."

litellm.drop_params = True # 👈 KEY CHANGE

response = litellm.completion(
                model="command-r",
                messages=[{"role": "user", "content": "Hey, how's it going?"}],
                response_format={"key": "value"},
            )
```


LiteLLM 會依據提供者 + 模型對應所有支援的 openai 參數（例如，function calling 在 bedrock 上的 anthropic 支援，但 titan 不支援）。 

請參閱 `litellm.get_supported_openai_params("command-r")` [**程式碼**](https://github.com/BerriAI/litellm/blob/main/litellm/utils.py#L3584)

如果某個提供者/模型不支援特定參數，您可以將其移除。 

## OpenAI Proxy 使用方式 {#openai-proxy-usage}

```yaml
litellm_settings:
    drop_params: true
```

## 在 `completion(..)` 中傳入 drop_params {#pass-drop_params-in-completion}

在呼叫特定模型時直接傳入 drop_params 

<Tabs>
<TabItem value="sdk" label="SDK">

```python 
import litellm 
import os 

# set keys 
os.environ["COHERE_API_KEY"] = "co-.."

response = litellm.completion(
                model="command-r",
                messages=[{"role": "user", "content": "Hey, how's it going?"}],
                response_format={"key": "value"},
                drop_params=True
            )
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
- litellm_params:
    api_base: my-base
    model: openai/my-model
    drop_params: true # 👈 KEY CHANGE
  model_name: my-model
```
</TabItem>
</Tabs>

## 指定要移除的參數  {#specify-params-to-drop}

在呼叫提供者時移除特定參數（例如 vllm 的 'logit_bias'）

使用 `additional_drop_params`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm 
import os 

# set keys 
os.environ["COHERE_API_KEY"] = "co-.."

response = litellm.completion(
                model="command-r",
                messages=[{"role": "user", "content": "Hey, how's it going?"}],
                response_format={"key": "value"},
                additional_drop_params=["response_format"]
            )
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
- litellm_params:
    api_base: my-base
    model: openai/my-model
    additional_drop_params: ["response_format"] # 👈 KEY CHANGE
  model_name: my-model
```
</TabItem>
</Tabs>

**additional_drop_params**：List 或 null - 這是一個您希望在呼叫模型時移除的 openai 參數清單。

### 巢狀欄位移除 {#nested-field-removal}

使用類似 JSONPath 的表示法，移除複雜物件中的巢狀欄位：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

response = litellm.completion(
    model="bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    messages=[{"role": "user", "content": "Hello"}],
    tools=[{
        "name": "search",
        "description": "Search files",
        "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}},
        "input_examples": [{"query": "test"}]  # Will be removed
    }],
    additional_drop_params=["tools[*].input_examples"]  # Remove from all tools
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0
      additional_drop_params: ["tools[*].input_examples"]  # Remove from all tools
```

</TabItem>
</Tabs>

**支援的語法：**
- `field` - 頂層欄位
- `parent.child` - 巢狀物件欄位
- `array[*]` - 所有陣列元素
- `array[0]` - 特定陣列索引
- `tools[*].input_examples` - 所有陣列元素中的欄位
- `tools[0].metadata.field` - 特定索引 + 巢狀欄位

**使用範例：**
- 從工具定義中移除 `input_examples`（Claude Code + AWS Bedrock）
- 移除巢狀結構中的提供者特定欄位
- 在傳送給 LLM 之前清理巢狀參數

## 在請求中指定允許的 openai 參數 {#specify-allowed-openai-params-in-a-request}

告訴 litellm 在請求中允許特定的 openai 參數。如果您收到 `litellm.UnsupportedParamsError` 並希望允許某個參數，請使用此功能。LiteLLM 會原樣將該參數傳遞給模型。

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

在此範例中，我們傳入 `allowed_openai_params=["tools"]`，以允許 `tools` 參數。

```python showLineNumbers title="Pass allowed_openai_params to LiteLLM Python SDK"
await litellm.acompletion(
    model="azure/o_series/<my-deployment-name>",
    api_key="xxxxx",
    api_base=api_base,
    messages=[{"role": "user", "content": "Hello! return a json object"}],
    tools=[{"type": "function", "function": {"name": "get_current_time", "description": "Get the current time in a given location.", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The city name, e.g. San Francisco"}}, "required": ["location"]}}}]
    allowed_openai_params=["tools"],
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

使用 litellm proxy 時，您可以透過兩種方式傳入 `allowed_openai_params`：

1. 在請求中動態傳入 `allowed_openai_params`
2. 在特定模型的 config.yaml 檔案中設定 `allowed_openai_params`

#### 在請求中動態傳入 allowed_openai_params {#dynamically-pass-allowed_openai_params-in-a-request}
在此範例中，我們傳入 `allowed_openai_params=["tools"]`，以允許送往 proxy 上設定之模型的請求使用 `tools` 參數。

```python showLineNumbers title="Dynamically pass allowed_openai_params in a request"
import openai
from openai import AsyncAzureOpenAI

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ 
        "allowed_openai_params": ["tools"]
    }
)
```

#### 在 config.yaml 中設定 allowed_openai_params {#set-allowed_openai_params-on-configyaml}

您也可以在特定模型的 config.yaml 檔案中設定 `allowed_openai_params`。這表示所有對此部署的請求都允許傳入 `tools` 參數。

```yaml showLineNumbers title="Set allowed_openai_params on config.yaml"
model_list:
  - model_name: azure-o1-preview
    litellm_params:
      model: azure/o_series/<my-deployment-name>
      api_key: xxxxx
      api_base: https://openai-prod-test.openai.azure.com/openai/deployments/o1/chat/completions?api-version=2025-01-01-preview
      allowed_openai_params: ["tools"]
```
</TabItem>
</Tabs>
