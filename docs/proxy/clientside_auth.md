import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 用戶端 LLM 認證  {#clientside-llm-credentials}

### 傳遞使用者 LLM API 金鑰、備援 {#pass-user-llm-api-keys-fallbacks}
讓您的終端使用者傳遞其模型清單、api base、OpenAI API 金鑰（任何 LiteLLM 支援的提供者）以發出請求

**注意** 這與 [虛擬金鑰](./virtual_keys.md) 無關。這是用於您想要傳入使用者實際的 LLM API 金鑰時。

:::info

**您可以將 litellm.RouterConfig 作為 `user_config` 傳遞，請在此查看所有支援的參數 https://github.com/BerriAI/litellm/blob/main/litellm/types/router.py **

:::

<Tabs>

<TabItem value="openai-py" label="OpenAI Python">

#### 步驟 1：定義使用者模型清單與設定 {#step-1-define-user-model-list--config}
```python
import os

user_config = {
    'model_list': [
        {
            'model_name': 'user-azure-instance',
            'litellm_params': {
                'model': 'azure/chatgpt-v-2',
                'api_key': os.getenv('AZURE_API_KEY'),
                'api_version': os.getenv('AZURE_API_VERSION'),
                'api_base': os.getenv('AZURE_API_BASE'),
                'timeout': 10,
            },
            'tpm': 240000,
            'rpm': 1800,
        },
        {
            'model_name': 'user-openai-instance',
            'litellm_params': {
                'model': 'gpt-3.5-turbo',
                'api_key': os.getenv('OPENAI_API_KEY'),
                'timeout': 10,
            },
            'tpm': 240000,
            'rpm': 1800,
        },
    ],
    'num_retries': 2,
    'allowed_fails': 3,
    'fallbacks': [
        {
            'user-azure-instance': ['user-openai-instance']
        }
    ]
}


```

#### 步驟 2：在 `extra_body` 中傳送 user_config {#step-2-send-user_config-in-extra_body}
```python
import openai
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

# send request to `user-azure-instance`
response = client.chat.completions.create(model="user-azure-instance", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
], 
    extra_body={
      "user_config": user_config
    }
) # 👈 User config

print(response)
```

</TabItem>

<TabItem value="openai-js" label="OpenAI JS">

#### 步驟 1：定義使用者模型清單與設定 {#step-1-define-user-model-list--config-1}
```javascript
const os = require('os');

const userConfig = {
    model_list: [
        {
            model_name: 'user-azure-instance',
            litellm_params: {
                model: 'azure/chatgpt-v-2',
                api_key: process.env.AZURE_API_KEY,
                api_version: process.env.AZURE_API_VERSION,
                api_base: process.env.AZURE_API_BASE,
                timeout: 10,
            },
            tpm: 240000,
            rpm: 1800,
        },
        {
            model_name: 'user-openai-instance',
            litellm_params: {
                model: 'gpt-3.5-turbo',
                api_key: process.env.OPENAI_API_KEY,
                timeout: 10,
            },
            tpm: 240000,
            rpm: 1800,
        },
    ],
    num_retries: 2,
    allowed_fails: 3,
    fallbacks: [
        {
            'user-azure-instance': ['user-openai-instance']
        }
    ]
};
```

#### 步驟 2：將 `user_config` 作為參數傳遞給 `openai.chat.completions.create` {#step-2-send-user_config-as-a-param-to-openaichatcompletionscreate}

```javascript
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "sk-1234",
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
    user_config: userConfig // # 👈 User config
  });
}

main();
```

</TabItem>

</Tabs>

### 傳遞使用者 LLM API 金鑰 / API Base {#pass-user-llm-api-keys--api-base}
允許您的使用者傳入其 OpenAI API 金鑰/API base（任何 LiteLLM 支援的提供者）以發出請求

操作如下：

#### 1. 為提供者啟用可設定的用戶端認證 {#1-enable-configurable-clientside-auth-credentials-for-a-provider}

```yaml
model_list:
  - model_name: "fireworks_ai/*"
    litellm_params:
      model: "fireworks_ai/*"
      configurable_clientside_auth_params: ["api_base"]
      # OR 
      configurable_clientside_auth_params: [{"api_base": "^https://litellm.*direct\.fireworks\.ai/v1$"}] # 👈 regex
```

指定您希望使用者能夠設定的任何／所有認證參數：

- api_base（✅ 支援 regex）
- api_key
- base_url 

（請查看 [提供者文件](../providers/) 以了解提供者特定的認證參數 - 例如 `vertex_project`）

#### 2. 測試看看！ {#2-test-it}

```python
import openai
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-3.5-turbo", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
], 
    extra_body={"api_key": "my-bad-key", "api_base": "https://litellm-dev.direct.fireworks.ai/v1"}) # 👈 clientside credentials

print(response)
```

更多範例：
<Tabs>
<TabItem value="openai-py" label="Azure 認證">

透過 OpenAI client 中的 `extra_body` 參數傳入 litellm_params（例如 api_key、api_base 等）。

```python
import openai
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-3.5-turbo", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
], 
    extra_body={
      "api_key": "my-azure-key",
      "api_base": "my-azure-base",
      "api_version": "my-azure-version"
    }) # 👈 User Key

print(response)
```


</TabItem>
<TabItem value="openai-js" label="OpenAI JS">

對於 JS，OpenAI client 可正常接受在 `create(..)` 主體中傳遞參數。

```javascript
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "sk-1234",
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
    api_key: "my-bad-key" // 👈 User Key
  });
}

main();
```
</TabItem>
</Tabs>

### 傳遞提供者特定參數（例如 Region、Project ID 等） {#pass-provider-specific-params-eg-region-project-id-etc}

指定要在用戶端用於對 Vertex AI 發出請求的 region、project id 等。

在 Proxy 的請求主體中傳入的任何值，都會由 LiteLLM 針對對應的 openai / litellm 認證參數進行檢查。

未對應的參數會被視為提供者特定參數，並會在 LLM API 的請求主體中原樣傳遞給提供者。

```bash
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ # pass any additional litellm_params here
        vertex_ai_location: "us-east1" 
    }
)

print(response)
```
