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
                'model': '{{openai_small}}',
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
    api_key="sk-<your-litellm-api-key>",
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
) # User config

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
                model: '{{openai_small}}',
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
  apiKey: "sk-<your-api-key>",
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: '{{openai_small}}',
    user_config: userConfig // # User config
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
      configurable_clientside_auth_params: [{"api_base": '^https://litellm.*direct\.fireworks\.ai/v1$'}] # regex
```

指定您希望使用者能夠設定的端點參數：

- api_base（支援 regex）
- base_url
- model_id，請參閱[讓用戶端選擇部署的 `model_id`](#let-clients-choose-a-deployments-model_id)

若沒有此選擇性啟用，或 `general_settings.allow_client_side_credentials: true` 全域，設定 `api_base` 或 `base_url` 的請求本文將會被拒絕，回傳 `Rejected Request: api_base is not allowed in request body`

`api_key` 不需要列出。請求本文中的 `api_key` 可在任何部署上被接受，不論是否為萬用字元，且只會取代該部署針對該次請求所設定的金鑰。若要改為將使用者的金鑰作為提供者標頭傳送，例如 Anthropic 的 `x-api-key`，請參閱 [轉送 LLM 提供者驗證標頭](./forward_client_headers.md#forward-llm-provider-authentication-headers)

（請查看 [提供者文件](../providers/) 以了解提供者特定的認證參數 - 例如 `vertex_project`）


#### 2. 測試看看！ {#2-test-it}

```python
import openai
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="{{openai_small}}", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
], 
    extra_body={"api_key": "my-bad-key", "api_base": "https://litellm-dev.direct.fireworks.ai/v1"}) # clientside credentials

print(response)
```

更多範例：
<Tabs>
<TabItem value="openai-py" label="Azure 認證">

透過 OpenAI client 中的 `extra_body` 參數傳入 litellm_params（例如 api_key、api_base 等）。

```python
import openai
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="{{openai_small}}", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
], 
    extra_body={
      "api_key": "my-azure-key",
      "api_base": "my-azure-base",
      "api_version": "my-azure-version"
    }) # User Key

print(response)
```


</TabItem>
<TabItem value="openai-js" label="OpenAI JS">

對於 JS，OpenAI client 可正常接受在 `create(..)` 主體中傳遞參數。

```javascript
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "sk-<your-api-key>",
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: '{{openai_small}}',
    api_key: "my-bad-key" // User Key
  });
}

main();
```
</TabItem>
</Tabs>

### 讓用戶端選擇部署的 `model_id` {#let-clients-choose-a-deployments-model_id}

<SinceVersion v="1.109.0" />

如果某個部署設定了 `model_id`（例如 SageMaker 推論元件、Bedrock 模型 ID 或 ARN），LiteLLM 會使用該部署的值，並忽略請求本文中出現的任何 `model_id`，除非該部署已依下述方式選擇性啟用。設定了 `extra_headers` 中 `X-Amzn-SageMaker-Inference-Component` 標頭的 SageMaker 部署，也會以相同方式被固定。這同時適用於 proxy 請求與 SDK `Router` 呼叫。

若要讓用戶端在某個部署上選擇該值，請將 `model_id` 列入其 `configurable_clientside_auth_params`：

```yaml
model_list:
  - model_name: my-sagemaker
    litellm_params:
      model: sagemaker_chat/<your-endpoint-name>
      model_id: <default-inference-component>
      configurable_clientside_auth_params: ["model_id"]
```

對 `my-sagemaker` 發出的請求，若本文中帶有 `"model_id": "<other-inference-component>"`，會被路由到該元件；沒有 `model_id` 的請求則會被路由到 `<default-inference-component>`。`general_settings.allow_client_side_credentials: true` 不會啟用此選擇性啟用，因此會保留固定的 `model_id`。既未設定 `model_id` 也未設定 SageMaker 標頭的部署，仍會使用請求的 `model_id`。在 1.109.0 之前，請求本文中的 `model_id` 會優先於部署的值。SageMaker 範例請參閱[在部署上固定推論元件](../providers/aws_sagemaker.md#pin-the-inference-component-on-a-deployment)。

### 傳遞提供者特定參數（例如 Region、Project ID 等） {#pass-provider-specific-params-eg-region-project-id-etc}

指定要在用戶端用於對 Vertex AI 發出請求的 region、project id 等。

`vertex_location`、`vertex_project`、`vertex_ai_location` 與 `vertex_ai_project` 會覆寫部署上設定的 region 與 project，因此 proxy 預設會拒絕請求本文中的它們，並回傳 `Rejected Request: vertex_location is not allowed in request body`。若要讓使用者選取它們，請將它們列入部署上的 `configurable_clientside_auth_params`，或在整個 proxy 設定 `general_settings.allow_client_side_credentials: true`。

```yaml
model_list:
  - model_name: gemini-2.5-flash
    litellm_params:
      model: vertex_ai/gemini-2.5-flash
      vertex_project: my-project
      vertex_location: europe-west4
      configurable_clientside_auth_params: ["vertex_location"] # 👈 lets the request pick the region
```

當多個部署共用一個模型名稱時，每一個都必須列出該參數，因為挑選由哪個部署提供服務的是路由器，而不是請求。`model_group_alias` 路由該名稱所到的模型群組也一樣，請求或路由器的 `fallbacks` 可能移往的每個備援也一樣，因為它們都會提供同一個請求。只有 Vertex AI、Gemini 與 GDC 部署會讀取這四個參數，因此其部署全都使用其他提供者的模型群組，不需要為它們進行選擇性啟用。

這條每個部署都必須列出的規則涵蓋每個 `configurable_clientside_auth_params` 項目，包括 `api_base`，因此只有部分部署列出 `api_base` 的模型群組現在會拒絕它。在 URL 中命名模型的路由上，例如 `/v1beta/models/<model>:generateContent` 與 Azure 的 `/openai/deployments/<model>/chat/completions`，proxy 會檢查該模型的部署。命名超過 100 個備援模型的請求會被拒絕。

:::info

proxy 會在沒有選擇性啟用時拒絕這些參數，並會針對每個選擇性啟用檢查每個部署 <SinceVersion v="1.111.0" />。較早版本接受來自任何請求本文的 Vertex 參數，並以單一部署的選擇性啟用涵蓋整個模型群組，因此如果您的使用者會傳送它們，請在升級前將選擇性啟用加入每個部署。

:::

在 Proxy 的請求主體中傳入的任何值，都會由 LiteLLM 針對對應的 openai / litellm 認證參數進行檢查。

未對應的參數會被視為提供者特定參數，並會在 LLM API 的請求主體中原樣傳遞給提供者。

```python
import openai
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ # pass any additional litellm_params here
        "vertex_location": "us-central1"
    }
)

print(response)
```
