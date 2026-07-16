import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Databricks {#databricks}

LiteLLM 支援 Databricks 上的所有模型

:::tip

**我們支援所有 Databricks 模型；在傳送 litellm 請求時，只要將 `model=databricks/<any-model-on-databricks>` 設為前綴即可**

:::

## 驗證 {#authentication}

LiteLLM 依偏好順序支援 Databricks 的多種驗證方法：

### OAuth M2M（建議用於正式環境） {#oauth-m2m-recommended-for-production}

使用 Service Principal 憑證的 OAuth 機器對機器驗證，是依 Databricks Partner 要求，正式環境部署的**建議方法**。

```python
import os
from litellm import completion

# Set OAuth credentials (Service Principal)
os.environ["DATABRICKS_CLIENT_ID"] = "your-service-principal-application-id"
os.environ["DATABRICKS_CLIENT_SECRET"] = "your-service-principal-secret"
os.environ["DATABRICKS_API_BASE"] = "https://adb-xxx.azuredatabricks.net/serving-endpoints"

response = completion(
    model="databricks/databricks-dbrx-instruct",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

### 個人存取權杖（PAT） {#personal-access-token-pat}

支援 PAT 驗證，用於開發與測試情境。

```python
import os
from litellm import completion

os.environ["DATABRICKS_API_KEY"] = "dapi..."  # Your Personal Access Token
os.environ["DATABRICKS_API_BASE"] = "https://adb-xxx.azuredatabricks.net/serving-endpoints"

response = completion(
    model="databricks/databricks-dbrx-instruct",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

### Databricks SDK 驗證（自動） {#databricks-sdk-authentication-automatic}

如果未提供任何憑證，LiteLLM 會使用 Databricks SDK 進行自動驗證。這支援您環境中設定的 OAuth、Azure AD 及其他統一驗證方法。

```python
from litellm import completion

# No environment variables needed - uses Databricks SDK unified auth
# Requires: uv add databricks-sdk
response = completion(
    model="databricks/databricks-dbrx-instruct",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

## 用於合作夥伴歸因的自訂 User-Agent {#custom-user-agent-for-partner-attribution}

如果您正在以 LiteLLM 為基礎建立一個與 Databricks 整合的產品，您可以傳遞自己的合作夥伴識別碼，以便在 Databricks telemetry 中正確歸因。

合作夥伴名稱會以前綴形式加到 LiteLLM user agent 之前：

```python
# Via parameter
response = completion(
    model="databricks/databricks-dbrx-instruct",
    messages=[{"role": "user", "content": "Hello!"}],
    user_agent="mycompany/1.0.0",
)
# Resulting User-Agent: mycompany_litellm/1.79.1

# Via environment variable
os.environ["DATABRICKS_USER_AGENT"] = "mycompany/1.0.0"
# Resulting User-Agent: mycompany_litellm/1.79.1
```

| 輸入 | 產生的 User-Agent |
|-------|---------------------|
| （無） | `litellm/1.79.1` |
| `mycompany/1.0.0` | `mycompany_litellm/1.79.1` |
| `partner_product/2.5.0` | `partner_product_litellm/1.79.1` |
| `acme` | `acme_litellm/1.79.1` |

**注意：** 來自您自訂 user agent 的版本會被忽略；LiteLLM 一律使用自己的版本。

## 安全性 {#security}

LiteLLM 會自動從所有除錯記錄中遮罩敏感資訊（權杖、密鑰、API 金鑰），以防止憑證外洩。這包括：

- Authorization 標頭
- API 金鑰與權杖
- 用戶端密鑰
- 個人存取權杖（PATs）

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### 環境變數 {#env-var}
```python
import os 
os.environ["DATABRICKS_API_KEY"] = ""
os.environ["DATABRICKS_API_BASE"] = ""
```

### 範例呼叫 {#example-call}

```python
from litellm import completion
import os
## set ENV variables
os.environ["DATABRICKS_API_KEY"] = "databricks key"
os.environ["DATABRICKS_API_BASE"] = "databricks base url" # e.g.: https://adb-3064715882934586.6.azuredatabricks.net/serving-endpoints

# Databricks dbrx-instruct call
response = completion(
    model="databricks/databricks-dbrx-instruct", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型加入您的 config.yaml

  ```yaml
  model_list:
    - model_name: dbrx-instruct
      litellm_params:
        model: databricks/databricks-dbrx-instruct
        api_key: os.environ/DATABRICKS_API_KEY
        api_base: os.environ/DATABRICKS_API_BASE
        user_agent: "mycompany/1.0.0"  # Optional: for partner attribution
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml --debug
  ```

3. 向 LiteLLM Proxy Server 傳送請求

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="dbrx-instruct",
      messages = [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
    ]
  )

  print(response)
  ```

  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "dbrx-instruct",
      "messages": [
        {
            "role": "system",
            "content": "Be a good human!"
        },
        {
            "role": "user",
            "content": "What do you know about earth?"
        }
        ],
  }'
  ```
  </TabItem>

  </Tabs>

</TabItem>

</Tabs>

## 傳遞額外參數 - max_tokens、temperature  {#passing-additional-params---max_tokens-temperature}
請參閱所有 litellm.completion 支援的參數 [此處](../completion/input.md#translated-openai-params)

```python
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["DATABRICKS_API_KEY"] = "databricks key"
os.environ["DATABRICKS_API_BASE"] = "databricks api base"

# databricks dbrx call
response = completion(
    model="databricks/databricks-dbrx-instruct", 
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    max_tokens=20,
    temperature=0.5
)
```

**代理**

```yaml
  model_list:
    - model_name: llama-3
      litellm_params:
        model: databricks/databricks-meta-llama-3-70b-instruct
        api_key: os.environ/DATABRICKS_API_KEY
        max_tokens: 20
        temperature: 0.5
```


## 使用方式 - Thinking / `reasoning_content` {#usage---thinking--reasoning_content}

LiteLLM 會將 OpenAI 的 `reasoning_effort` 轉換為 Anthropic 的 `thinking` 參數。[程式碼](https://github.com/BerriAI/litellm/blob/23051d89dd3611a81617d84277059cd88b2df511/litellm/llms/anthropic/chat/transformation.py#L298)

| reasoning_effort | thinking |
| ---------------- | -------- |
| "low"            | "budget_tokens": 1024 |
| "medium"         | "budget_tokens": 2048 |
| "high"           | "budget_tokens": 4096 |

已知限制：
- 支援將 thinking 區塊回傳給 Claude [Issue](https://github.com/BerriAI/litellm/issues/9790)
 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

# set ENV variables (can also be passed in to .completion() - e.g. `api_base`, `api_key`)
os.environ["DATABRICKS_API_KEY"] = "databricks key"
os.environ["DATABRICKS_API_BASE"] = "databricks base url"

resp = completion(
    model="databricks/databricks-claude-3-7-sonnet",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    reasoning_effort="low",
)

```

</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
- model_name: claude-3-7-sonnet
  litellm_params:
    model: databricks/databricks-claude-3-7-sonnet
    api_key: os.environ/DATABRICKS_API_KEY
    api_base: os.environ/DATABRICKS_API_BASE
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

**預期回應**

```python
ModelResponse(
    id='chatcmpl-c542d76d-f675-4e87-8e5f-05855f5d0f5e',
    created=1740470510,
    model='claude-3-7-sonnet-20250219',
    object='chat.completion',
    system_fingerprint=None,
    choices=[
        Choices(
            finish_reason='stop',
            index=0,
            message=Message(
                content="The capital of France is Paris.",
                role='assistant',
                tool_calls=None,
                function_call=None,
                provider_specific_fields={
                    'citations': None,
                    'thinking_blocks': [
                        {
                            'type': 'thinking',
                            'thinking': 'The capital of France is Paris. This is a very straightforward factual question.',
                            'signature': 'EuYBCkQYAiJAy6...'
                        }
                    ]
                }
            ),
            thinking_blocks=[
                {
                    'type': 'thinking',
                    'thinking': 'The capital of France is Paris. This is a very straightforward factual question.',
                    'signature': 'EuYBCkQYAiJAy6AGB...'
                }
            ],
            reasoning_content='The capital of France is Paris. This is a very straightforward factual question.'
        )
    ],
    usage=Usage(
        completion_tokens=68,
        prompt_tokens=42,
        total_tokens=110,
        completion_tokens_details=None,
        prompt_tokens_details=PromptTokensDetailsWrapper(
            audio_tokens=None,
            cached_tokens=0,
            text_tokens=None,
            image_tokens=None
        ),
        cache_creation_input_tokens=0,
        cache_read_input_tokens=0
    )
)
```

### 引用 {#citations}

透過 Databricks 提供的 Anthropic 模型可以回傳引用中繼資料。LiteLLM 會透過 `response.choices[0].message.provider_specific_fields["citations"]` 提供這些資料。

### 傳遞 `thinking` 給 Anthropic 模型 {#pass-thinking-to-anthropic-models}

您也可以將 `thinking` 參數傳遞給 Anthropic 模型。

您也可以將 `thinking` 參數傳遞給 Anthropic 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

# set ENV variables (can also be passed in to .completion() - e.g. `api_base`, `api_key`)
os.environ["DATABRICKS_API_KEY"] = "databricks key"
os.environ["DATABRICKS_API_BASE"] = "databricks base url"

response = litellm.completion(
  model="databricks/databricks-claude-3-7-sonnet",
  messages=[{"role": "user", "content": "What is the capital of France?"}],
  thinking={"type": "enabled", "budget_tokens": 1024},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "databricks/databricks-claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "thinking": {"type": "enabled", "budget_tokens": 1024}
  }'
```

</TabItem>
</Tabs>

## 支援的 Databricks Chat Completion 模型  {#supported-databricks-chat-completion-models}

:::tip

**我們支援所有 Databricks 模型；在傳送 litellm 請求時，只要將 `model=databricks/<any-model-on-databricks>` 設為前綴即可**

:::

| 模型名稱                 | 指令                                                          |
|----------------------------|------------------------------------------------------------------|
| databricks/databricks-claude-3-7-sonnet    | `completion(model='databricks/databricks/databricks-claude-3-7-sonnet', messages=messages)`   | 
| databricks-meta-llama-3-1-70b-instruct    | `completion(model='databricks/databricks-meta-llama-3-1-70b-instruct', messages=messages)`   | 
| databricks-meta-llama-3-1-405b-instruct    | `completion(model='databricks/databricks-meta-llama-3-1-405b-instruct', messages=messages)`   | 
| databricks-dbrx-instruct    | `completion(model='databricks/databricks-dbrx-instruct', messages=messages)`   | 
| databricks-meta-llama-3-70b-instruct    | `completion(model='databricks/databricks-meta-llama-3-70b-instruct', messages=messages)`   | 
| databricks-llama-2-70b-chat    | `completion(model='databricks/databricks-llama-2-70b-chat', messages=messages)`   | 
| databricks-mixtral-8x7b-instruct    | `completion(model='databricks/databricks-mixtral-8x7b-instruct', messages=messages)`   | 
| databricks-mpt-30b-instruct    | `completion(model='databricks/databricks-mpt-30b-instruct', messages=messages)`   | 
| databricks-mpt-7b-instruct    | `completion(model='databricks/databricks-mpt-7b-instruct', messages=messages)`   | 

## 嵌入模型 {#embedding-models}

### 傳遞 Databricks 特定參數 - 'instruction' {#passing-databricks-specific-params---instruction}

對於嵌入模型，databricks 允許您傳入額外參數 'instruction'. [完整規格](https://github.com/BerriAI/litellm/blob/43353c28b341df0d9992b45c6ce464222ebd7984/litellm/llms/databricks.py#L164)

```python
# !uv add litellm
from litellm import embedding
import os
## set ENV variables
os.environ["DATABRICKS_API_KEY"] = "databricks key"
os.environ["DATABRICKS_API_BASE"] = "databricks url"

# Databricks bge-large-en call
response = litellm.embedding(
      model="databricks/databricks-bge-large-en",
      input=["good morning from litellm"],
      instruction="Represent this sentence for searching relevant passages:",
  )
```

**代理**

```yaml
  model_list:
    - model_name: bge-large
      litellm_params:
        model: databricks/databricks-bge-large-en
        api_key: os.environ/DATABRICKS_API_KEY
        api_base: os.environ/DATABRICKS_API_BASE
        instruction: "Represent this sentence for searching relevant passages:"
```

## 支援的 Databricks 嵌入模型  {#supported-databricks-embedding-models}

:::tip

**我們支援所有 Databricks 模型；在傳送 litellm 請求時，只要將 `model=databricks/<any-model-on-databricks>` 設為前綴即可**

:::

| 模型名稱                 | 指令                                                          |
|----------------------------|------------------------------------------------------------------|
| databricks-bge-large-en    | `embedding(model='databricks/databricks-bge-large-en', messages=messages)`   |
| databricks-gte-large-en    | `embedding(model='databricks/databricks-gte-large-en', messages=messages)`   |
