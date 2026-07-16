# 設定 API 金鑰、Base、版本 {#setting-api-keys-base-version}

LiteLLM 讓您可以指定以下項目：
* API 金鑰
* API Base
* API 版本
* API 類型
* 專案
* 位置
* Token

實用的輔助函式：
* [`check_valid_key()`](#check_valid_key)
* [`get_valid_models()`](#get_valid_models)

您可以使用以下方式設定 API 設定：
* 環境變數
* litellm 變數 `litellm.api_key`
* 將引數傳遞給 `completion()`

## 環境變數 {#environment-variables}

### 設定 API 金鑰 {#setting-api-keys}

設定 liteLLM API 金鑰或特定提供者金鑰：

```python
import os 

# Set OpenAI API key
os.environ["OPENAI_API_KEY"] = "Your API Key"
os.environ["ANTHROPIC_API_KEY"] = "Your API Key"
os.environ["XAI_API_KEY"] = "Your API Key"
os.environ["REPLICATE_API_KEY"] = "Your API Key"
os.environ["TOGETHERAI_API_KEY"] = "Your API Key"
```

### 設定 API Base、API 版本、API 類型 {#setting-api-base-api-version-api-type}

```python
# for azure openai
os.environ['AZURE_API_BASE'] = "https://openai-gpt-4-test2-v-12.openai.azure.com/"
os.environ['AZURE_API_VERSION'] = "2023-05-15" # [OPTIONAL]
os.environ['AZURE_API_TYPE'] = "azure" # [OPTIONAL]

# for openai
os.environ['OPENAI_BASE_URL'] = "https://your_host/v1"
```

### 設定專案、位置、Token {#setting-project-location-token}

對於雲端提供者：
- Azure
- Bedrock
- GCP
- Watson AI 

您可能需要設定額外參數。LiteLLM 提供一組通用參數，我們會將其對應到所有提供者。 

|      | LiteLLM 參數 | Watson       | Vertex AI    | Azure        | Bedrock      |
|------|--------------|--------------|--------------|--------------|--------------|
| 專案 | project | watsonx_project | vertex_project | n/a | n/a |
| 區域 | region_name | watsonx_region_name | vertex_location | n/a | aws_region_name |
| Token | token | watsonx_token or token | n/a | azure_ad_token | n/a |

如果您願意，也可以使用各提供者的專屬參數來呼叫它們。 

## litellm 變數 {#litellm-variables}

### litellm.api_key {#litellmapi_key}
這個變數會針對所有提供者進行檢查

```python
import litellm
# openai call
litellm.api_key = "sk-OpenAIKey"
response = litellm.completion(messages=messages, model="gpt-3.5-turbo")

# anthropic call
litellm.api_key = "sk-AnthropicKey"
response = litellm.completion(messages=messages, model="claude-2")
```

### litellm.provider_key（範例：litellm.openai_key） {#litellmprovider_key-example-litellmopenai_key}

```python
litellm.openai_key = "sk-OpenAIKey"
response = litellm.completion(messages=messages, model="gpt-3.5-turbo")

# anthropic call
litellm.anthropic_key = "sk-AnthropicKey"
response = litellm.completion(messages=messages, model="claude-2")
```

### litellm.api_base {#litellmapi_base}

```python
import litellm
litellm.api_base = "https://hosted-llm-api.co"
response = litellm.completion(messages=messages, model="gpt-3.5-turbo")
```

### litellm.api_version {#litellmapi_version}

```python
import litellm
litellm.api_version = "2023-05-15"
response = litellm.completion(messages=messages, model="gpt-3.5-turbo")
```

### litellm.organization {#litellmorganization}
```python
import litellm
litellm.organization = "LiteLlmOrg"
response = litellm.completion(messages=messages, model="gpt-3.5-turbo")
```

## 將引數傳遞給 completion()（或任何 litellm 端點 - `transcription`、`embedding`、`text_completion` 等） {#passing-args-to-completion-or-any-litellm-endpoint---transcription-embedding-text_completion-etc}

您可以在 `completion()` 呼叫中傳入 API 金鑰：

### api_key {#api_key}
```python
from litellm import completion

messages = [{ "content": "Hello, how are you?","role": "user"}]

response = completion("command-nightly", messages, api_key="Your-Api-Key")
```

### api_base {#api_base}

```python
from litellm import completion

messages = [{ "content": "Hello, how are you?","role": "user"}]

response = completion("command-nightly", messages, api_base="https://hosted-llm-api.co")
```

### api_version {#api_version}

```python
from litellm import completion

messages = [{ "content": "Hello, how are you?","role": "user"}]

response = completion("command-nightly", messages, api_version="2023-02-15")
```

## 輔助函式 {#helper-functions}

### `check_valid_key()` {#check_valid_key}

檢查使用者是否為其嘗試呼叫的模型提交了有效金鑰。 

```python
key = "bad-key"
response = check_valid_key(model="gpt-3.5-turbo", api_key=key)
assert(response == False)
```

### `get_valid_models()` {#get_valid_models}

此輔助函式會讀取 .env，並傳回使用者支援的 llms 清單

```python
old_environ = os.environ
os.environ = {'OPENAI_API_KEY': 'temp'} # mock set only openai key in environ

valid_models = get_valid_models()
print(valid_models)

# list of openai supported llms on litellm
expected_models = litellm.open_ai_chat_completion_models + litellm.open_ai_text_completion_models

assert(valid_models == expected_models)

# reset replicate env key
os.environ = old_environ
```

### `get_valid_models(check_provider_endpoint: True)` {#get_valid_modelscheck_provider_endpoint-true}

此輔助函式會檢查提供者的端點是否有可用的模型。

目前已實作支援：
- OpenAI（如果已設定 OPENAI_API_KEY）
- Fireworks AI（如果已設定 FIREWORKS_AI_API_KEY）
- LiteLLM Proxy（如果已設定 LITELLM_PROXY_API_KEY）
- Gemini（如果已設定 GEMINI_API_KEY）
- XAI（如果已設定 XAI_API_KEY）   
- Anthropic（如果已設定 ANTHROPIC_API_KEY）

您也可以指定要檢查的自訂提供者：

**所有提供者**：
```python
from litellm import get_valid_models

valid_models = get_valid_models(check_provider_endpoint=True)
print(valid_models)
```

**特定提供者**：
```python
from litellm import get_valid_models

valid_models = get_valid_models(check_provider_endpoint=True, custom_llm_provider="openai")
print(valid_models)
```

### `validate_environment(model: str)` {#validate_environmentmodel-str}

此輔助函式會告訴您某個模型是否具備所有必要的環境變數；若否，也會指出缺少哪些項目。 

```python
from litellm import validate_environment

print(validate_environment("openai/gpt-3.5-turbo"))
```
