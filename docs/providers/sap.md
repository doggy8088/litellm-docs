import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SAP Generative AI Hub {#sap-generative-ai-hub}

LiteLLM 支援 SAP Generative AI Hub 的 Orchestration Service。

| 屬性 | 詳細資訊                                                                                                                                                |
|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| 說明 | SAP 的 Generative AI Hub 透過 AI Core orchestration service 提供 OpenAI、Anthropic、Gemini、Mistral、NVIDIA、Amazon 和 SAP LLM 的存取。 |
| LiteLLM 提供者路由 | `sap/`                                                                                                                                                 |
| 支援的端點 | `/chat/completions`, `/embeddings`                                                                                                                                  |
| API Reference | [SAP AI Core 文件](https://help.sap.com/docs/sap-ai-core)                                                                                     |

## 必要條件 {#prerequisites}

開始之前，請確保您具備：

1. **SAP BTP 帳號**，且可存取 SAP AI Core
2. **AI Core Service Instance** 已在您的 subaccount 中佈建
3. 為您的 AI Core instance 建立的 **Service Key**（其中包含您的憑證）
4. 已部署 AI models 的 **Resource Group**（請向您的 SAP 管理員確認）

:::tip 在哪裡找到您的憑證
您的憑證來自您在 SAP BTP Cockpit 中建立的 **Service Key**：

1. 前往您的 **Subaccount** → **Instances and Subscriptions**
2. 找到您的 **AI Core** instance 並點擊它
3. 前往 **Service Keys** 並建立一個（或使用既有的）
4. JSON 內含下方所需的所有值

service key 的 JSON 如下所示：

```json
{
  "clientid": "sb-abc123...",
  "clientsecret": "xyz789...",
  "url": "https://myinstance.authentication.eu10.hana.ondemand.com",
  "serviceurls": {
    "AI_API_URL": "https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com"
  }
}
```

:::info Resource Group
resource group 通常是在您的 AI Core deployment 中另外設定，而不是在 service key 本身。您可以透過 `AICORE_RESOURCE_GROUP` 環境變數設定（預設為 "default"）。
:::

## 快速開始 {#quick-start}

### 步驟 1：安裝 LiteLLM {#step-1-install-litellm}

```bash
uv add litellm
```

### 步驟 2：設定您的憑證 {#step-2-set-your-credentials}
 
 請選擇以下 **一種** 驗證方法：
 
> **Breaking change**：憑證解析採用「先來源優先」 
> 
> 憑證解析不再跨來源合併個別欄位。
> 
> 解析順序為：
`kwargs` → `service key` → `env (AICORE_*)` → `config` → `VCAP service`
>
> **重要行為：** 一旦 LiteLLM 在某個來源找到 *任何* 憑證值，就會專屬採用該來源的 **所有** 憑證（除了 `resource_group`，它仍可能會獨立解析）。

 <Tabs>
 <TabItem value="service-key" label="Service Key JSON（建議）">

最簡單的方式 - 將您的整個 service key 貼為單一環境變數。 

> **注意：** service key 不再需要包在 "credentials" key 中。

```bash
export AICORE_SERVICE_KEY='{
    "clientid": "your-client-id",
    "clientsecret": "your-client-secret",
    "url": "https://<your-instance>.authentication.sap.hana.ondemand.com",
    "serviceurls": {
      "AI_API_URL": "https://api.ai.<your-region>.aws.ml.hana.ondemand.com"
    }
}'
export AICORE_RESOURCE_GROUP="default"
```

</TabItem>
<TabItem value="individual" label="Individual Variables">

或者，不使用上方的 service key，您可以分別設定每個憑證：

```bash
export AICORE_AUTH_URL="https://<your-instance>.authentication.sap.hana.ondemand.com/oauth/token"
export AICORE_CLIENT_ID="your-client-id"
export AICORE_CLIENT_SECRET="your-client-secret"
export AICORE_RESOURCE_GROUP="default"
export AICORE_BASE_URL="https://api.ai.<your-region>.aws.ml.hana.ondemand.com/v2"
```

</TabItem>
</Tabs>

### 步驟 3：發出您的第一個請求 {#step-3-make-your-first-request}

```python title="test_sap.py"
from litellm import completion

response = completion(
    model="sap/gpt-4o",
    messages=[{"role": "user", "content": "Hello from LiteLLM!"}]
)
print(response.choices[0].message.content)
```

執行它：

```bash
python test_sap.py
```

**預期輸出：**

```text
Hello! How can I assist you today?
```

### 步驟 4：驗證您的設定（選用） {#step-4-verify-your-setup-optional}

使用此診斷腳本測試一切是否正常運作：

```python title="verify_sap_setup.py"
import os
import litellm

# Enable debug logging to see what's happening
import os
os.environ["LITELLM_LOG"] = "DEBUG"

# Either use AICORE_SERVICE_KEY (contains all credentials including resourcegroup)
# OR use individual variables (all required together)
individual_vars = ["AICORE_AUTH_URL", "AICORE_CLIENT_ID", "AICORE_CLIENT_SECRET", "AICORE_BASE_URL", "AICORE_RESOURCE_GROUP"]

print("=== SAP Gen AI Hub Setup Verification ===\n")

# Check for service key method
if os.environ.get("AICORE_SERVICE_KEY"):
    print("✓ Using AICORE_SERVICE_KEY authentication (includes resource group)")
else:
    # Check individual variables
    missing = [v for v in individual_vars if not os.environ.get(v)]
    if missing:
        print(f"✗ Missing environment variables: {missing}")
    else:
        print("✓ Using individual variable authentication")
        print(f"✓ Resource group: {os.environ.get('AICORE_RESOURCE_GROUP')}")

# Test API connection
print("\n=== Testing API Connection ===\n")
try:
    response = litellm.completion(
        model="sap/gpt-4o",
        messages=[{"role": "user", "content": "Say 'Connection successful!' and nothing else."}],
        max_tokens=20
    )
    print(f"✓ API Response: {response.choices[0].message.content}")
    print("\n🎉 Setup complete! You're ready to use SAP Gen AI Hub with LiteLLM.")
except Exception as e:
    print(f"✗ API Error: {e}")
    print("\nTroubleshooting tips:")
    print("  1. Verify your service key credentials are correct")
    print("  2. Check that 'gpt-4o' is deployed in your resource group")
    print("  3. Ensure your SAP AI Core instance is running")
```

執行驗證：

```bash
python verify_sap_setup.py
```

**成功時的預期輸出：**

```text
=== SAP Gen AI Hub Setup Verification ===

✓ Using AICORE_SERVICE_KEY authentication
✓ Resource group: default

=== Testing API Connection ===

✓ API Response: Connection successful!

🎉 Setup complete! You're ready to use SAP Gen AI Hub with LiteLLM.
```

## 驗證 {#authentication}

SAP Generative AI Hub 使用 OAuth2 service key 進行驗證。請參閱 [快速開始](#quick-start) 取得設定說明。

### 環境變數參考 {#environment-variables-reference}

| 變數 | 必要 | 說明 |
|----------|----------|-------------|
| `AICORE_SERVICE_KEY` | 是* | 完整的 service key JSON（建議方法） |
| `AICORE_RESOURCE_GROUP` | 是 | 您的 AI Core resource group 名稱 |
| `AICORE_AUTH_URL` | 是* | OAuth token URL（service key 的替代方式） |
| `AICORE_CLIENT_ID` | 是* | OAuth client ID（service key 的替代方式） |
| `AICORE_CLIENT_SECRET` | 是* | OAuth client secret（service key 的替代方式） |
| `AICORE_BASE_URL` | 是* | AI Core API base URL（service key 的替代方式） |

*請選擇 `AICORE_SERVICE_KEY` 或個別變數（`AICORE_AUTH_URL`、`AICORE_CLIENT_ID`、`AICORE_CLIENT_SECRET`、`AICORE_BASE_URL`）。

## 模型命名慣例 {#model-naming-conventions}

了解模型命名對於正確使用 SAP Gen AI Hub 至關重要。命名模式會依您是直接使用 SDK 還是透過 proxy 而有所不同。

### 直接使用 SDK {#direct-sdk-usage}

直接呼叫 LiteLLM 的 SDK 時，您**必須**在模型名稱中包含 `sap/` 前綴：

```python
# Correct - includes sap/ prefix
model="sap/gpt-4o"
model="sap/anthropic--claude-4.5-sonnet"
model="sap/gemini-2.5-pro"

# Incorrect - missing prefix
model="gpt-4o"  # ❌ Won't work
```
3. **環境變數** - 在 .env 檔案中設定以下憑證清單
<pre>
AICORE_AUTH_URL = "https://* * * .authentication.sap.hana.ondemand.com/oauth/token",
AICORE_CLIENT_ID  = " *** ",
AICORE_CLIENT_SECRET = " *** ",
AICORE_RESOURCE_GROUP = " *** ",
AICORE_BASE_URL = "https://api.ai.***.cfapps.sap.hana.ondemand.com/v2"
</pre>

也提供其他憑證設定選項。如需更多資訊，請參閱 [SAP AI Core 文件](https://help.sap.com/doc/generative-ai-hub-sdk/CLOUD/en-US/_reference/README_sphynx.html#configuration)。
## 使用 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### Proxy 使用 {#proxy-usage}

使用 LiteLLM Proxy 時，您會使用在設定中定義的 **friendly `model_name`**。proxy 會自動處理 `sap/` 前綴路由。

```yaml
# In config.yaml, define the mapping
model_list:
  - model_name: gpt-4o          # ← Use this name in client requests
    litellm_params:
      model: sap/gpt-4o         # ← Proxy handles the sap/ prefix
```

```python
# Client request - no sap/ prefix needed
client.chat.completions.create(
    model="gpt-4o",  # ✓ Correct for proxy usage
    messages=[...]
)
```

### Anthropic 模型特殊語法 {#anthropic-models-special-syntax}

Anthropic 模型使用雙連字號（`--`）前綴慣例：

| 提供者 | 模型範例 | LiteLLM 格式 |
|----------|---------------|----------------|
| OpenAI | GPT-4o | `sap/gpt-4o` |
| Anthropic | Claude 4.5 Sonnet | `sap/anthropic--claude-4.5-sonnet` |
| Google | Gemini 2.5 Pro | `sap/gemini-2.5-pro` |
| Mistral | Mistral Large | `sap/mistral-large` |

### 快速參考表 {#quick-reference-table}

| 使用類型 | 模型格式 | 範例 |
|------------|--------------|---------|
| Direct SDK | `sap/<model-name>` | `sap/gpt-4o` |
| Direct SDK (Anthropic) | `sap/anthropic--<model>` | `sap/anthropic--claude-4.5-sonnet` |
| Proxy Client | `<friendly-name>` | `gpt-4o` or `claude-sonnet` |

## 使用 Python SDK {#using-the-python-sdk}

LiteLLM Python SDK 會自動偵測您的驗證方法。只要設定您的環境變數並發出請求即可。

```python showLineNumbers title="Basic Completion"
from litellm import completion

# Assumes AICORE_AUTH_URL, AICORE_CLIENT_ID, etc. are set
response = completion(
    model="sap/anthropic--claude-4.5-sonnet",
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
print(response.choices[0].message.content)
```

兩種驗證方法（個別變數或 service key JSON）都能自動運作 - 不需要變更程式碼。

## 使用 Proxy Server {#using-the-proxy-server}

LiteLLM Proxy 為您的 SAP models 提供統一且相容 OpenAI 的 API。

### 設定 {#configuration}

在您的專案目錄中建立一個 `config.yaml` 檔案，內含您的 model mappings 和憑證：

```yaml showLineNumbers title="config.yaml"
model_list:
  # OpenAI models
  - model_name: gpt-5
    litellm_params:
      model: sap/gpt-5

  # Anthropic models (note the double-dash)
  - model_name: claude-sonnet
    litellm_params:
      model: sap/anthropic--claude-4.5-sonnet

  - model_name: claude-opus
    litellm_params:
      model: sap/anthropic--claude-4.5-opus

  # Embeddings
  - model_name: text-embedding-3-small
    litellm_params:
      model: sap/text-embedding-3-small

litellm_settings:
  drop_params: true
  set_verbose: false
  request_timeout: 600
  num_retries: 2
  forward_client_headers_to_llm_api: ["anthropic-version"]

general_settings:
  master_key: "sk-1234" # Enter here your desired master key starting with 'sk-'.
  
  # UI Admin is not required but helpful including the management of keys for your team(s). If you are using a database, these parameters are required:
  database_url: "Enter you database URL."
  UI_USERNAME: "Your desired UI admin account name"
  UI_PASSWORD: "Your desired and strong pwd"

# Authentication
environment_variables:
  AICORE_SERVICE_KEY: '{"credentials": {"clientid": "...", "clientsecret": "...", "url": "...", "serviceurls": {"AI_API_URL": "..."}}}'
  AICORE_RESOURCE_GROUP: "default"
```

### 啟動 Proxy {#starting-the-proxy}

```bash showLineNumbers title="Start Proxy"
litellm --config config.yaml
```

proxy 預設會在 `http://localhost:4000` 上啟動。

### 發出請求 {#making-requests}

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Test Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="LiteLLM SDK"
import os
import litellm

os.environ["LITELLM_PROXY_API_KEY"] = "sk-1234"
litellm.use_litellm_proxy = True

response = litellm.completion(
    model="claude-sonnet",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
    api_base="http://localhost:4000"
)

print(response)
```

</TabItem>
</Tabs>

## 功能 {#features}

### 串流回應 {#streaming-responses}

即時串流回應，以提供更好的使用者體驗：

```python showLineNumbers title="Streaming Chat Completion"
from litellm import completion

response = completion(
    model="sap/gpt-4o",
    messages=[{"role": "user", "content": "Count from 1 to 10"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### 結構化輸出 {#structured-output}

#### JSON Schema（建議） {#json-schema-recommended}

使用 JSON Schema 進行具備嚴格驗證的結構化輸出：

```python showLineNumbers title="JSON Schema Response"
from litellm import completion

response = completion(
    model="sap/gpt-4o",
    messages=[{
        "role": "user",
        "content": "Generate info about Tokyo"
    }],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "city_info",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "population": {"type": "number"},
                    "country": {"type": "string"}
                },
                "required": ["name", "population", "country"],
                "additionalProperties": False
            },
            "strict": True
        }
    }
)

print(response.choices[0].message.content)
# Output: {"name":"Tokyo","population":37000000,"country":"Japan"}
```

#### JSON Object 格式 {#json-object-format}

適用於不需要 schema 驗證的彈性 JSON 輸出：

```python showLineNumbers title="JSON Object Response"
from litellm import completion

response = completion(
    model="sap/gpt-4o",
    messages=[{
        "role": "user",
        "content": "Generate a person object in JSON format with name and age"
    }],
    response_format={"type": "json_object"}
)

print(response.choices[0].message.content)
```

:::note SAP 平台需求
當使用 `json_object` 類型時，SAP 的協調服務要求您的提示中必須出現「json」一詞。這可確保對 JSON 格式化有明確意圖。若要在沒有此要求的情況下輸出經 Schema 驗證的內容，請改用 `json_schema`（建議）。
:::

### 多輪對話 {#multi-turn-conversations}

在多個輪次之間維持對話上下文：

```python showLineNumbers title="Multi-turn Conversation"
from litellm import completion

response = completion(
    model="sap/gpt-4o",
    messages=[
        {"role": "user", "content": "My name is Alice"},
        {"role": "assistant", "content": "Hello Alice! Nice to meet you."},
        {"role": "user", "content": "What is my name?"}
    ]
)

print(response.choices[0].message.content)
# Output: Your name is Alice.
```

### 嵌入 {#embeddings}

為語意搜尋與擷取產生向量嵌入：

```python showLineNumbers title="Create Embeddings"
from litellm import embedding

response = embedding(
    model="sap/text-embedding-3-small",
    input=["Hello world", "Machine learning is fascinating"]
)

print(response.data[0]["embedding"])  # Vector representation
```

### 其他模組 {#additional-modules}
SAP Gen AI Hub 包含適用於進階使用情境的其他模組：
- [Grounding](https://help.sap.com/docs/sap-ai-core/generative-ai/grounding-035c455a5a424697b60f4a24b6d791fe?locale=en-US)
- [Translation](https://help.sap.com/docs/sap-ai-core/generative-ai/translation?locale=en-US)
- [Data Masking](https://help.sap.com/docs/sap-ai-core/generative-ai/data-masking-d9a54d9ca54b40beacbd24e1663ec3b4?locale=en-US)
- [Content Filtering](https://help.sap.com/docs/sap-ai-core/generative-ai/content-filtering?locale=en-US)

#### 基礎依據 {#grounding}
Grounding 是一項專為處理資料相關任務而設計的服務，例如使用向量資料庫進行 grounding 與擷取。它透過這些資料庫提供專門的資料擷取，並以您自己的外部且與情境相關的資料來為擷取建立 grounding。Grounding 結合生成式 AI 功能與使用即時、精確資料的能力，以改善特定 AI 驅動商業解決方案的決策與業務營運。
##### 必要條件 {#prerequisites-1}
若要在協調流程中使用 Grounding 模組，您需要事先準備知識庫。

Generative AI hub 為使用者提供多種提供資料（準備知識庫）的選項：
- 選項 1：將文件上傳至支援的資料儲存庫，並執行資料管線以將文件向量化。
- 選項 2：直接透過 Vector API 提供文件區塊。 

若要使用 grounding，請從下列選項中擇一。

使用範例：
```python showLineNumbers title="Grounding Example"
from litellm import completion

grounding_config = {
    'type': 'document_grounding_service',
    'config': {
        'filters': [
            {'id': 's3-docs',
             'data_repository_type': 'vector',
             'search_config': {'max_chunk_count': 2},
             'data_repositories': ['012345-6789-0123-4567-890123456789']
             }
        ],
        'placeholders': {'input': ['user_query'], 'output': 'grounding_response'},
        'metadata_params': ['source', 'webUrl', 'title', 'mimeType', 'fileSuffix']
    }
}

response = completion(model="sap/gpt-4o",
                      messages=[
                          {"content":"""Facility Solutions Company provides services to luxury residential complexes, 
                          apartments, individual homes, and commercial properties such as office buildings, retail 
                          spaces, industrial facilities, and educational institutions. Customers are encouraged to 
                          reach out with maintenance requests, service deficiencies, follow-ups, or any issues they 
                          need by email.""", "role": "system"},
                          {"content":"""You are a helpful assistant for any queries for answering questions. 
                          Answer the request by providing relevant answers that fit to the request.
                          Request: {{ ?user_query }}
                          Context:{{ ?grounding_response }}""", "role": "user"}
                      ],
                      placeholder_values={"user_query": "Is there a complaint?"},
                      grounding=grounding_config
                      )
print(response.choices[0].message.content)
```
如需所有可用 grounding 設定的詳細資訊，請參閱[文件](https://help.sap.com/docs/sap-ai-core/generative-ai/using-grounding-module-e1c4dd100dfb42ab890e1d95f3516187?locale=en-US)。

#### 翻譯 {#translation}
Translation 模組可讓您將 LLM 文字提示翻譯成所選的目標語言。

```python showLineNumbers title="Translation Example"
from litellm import completion

translation_config = {
    'input':
        {'type': 'sap_document_translation',
         'config':
             {'source_language': 'en-US',
              'target_language': 'de-DE'}
         },
    'output':
        {'type': 'sap_document_translation',
         'config':
             {'source_language': 'de-DE',
              'target_language': 'fr-FR'}
         }
}

response = completion(model="sap/gpt-4o",
                      messages=[{"role": "user", "content": "Hello world!"}],
                      translation=translation_config)

print(response.choices[0].message.content)
```
如需所有可用 translation 設定的詳細資訊，請參閱[文件](https://help.sap.com/docs/sap-ai-core/generative-ai/translation?locale=en-US)

#### 資料遮罩 {#data-masking}
Data masking 模組可將輸入中針對選定實體的個人識別資訊去識別化或假名化。

```python showLineNumbers title="Data Masking Example"
from litellm import completion, embedding
masking_config = {
            'providers':
                [
                    {
                        'type': 'sap_data_privacy_integration',
                        'method': 'anonymization',
                        'entities': [
                            {'type': 'profile-address'},
                            {'type': 'profile-email'},
                            {'type': 'profile-phone'},
                            {'type': 'profile-person'},
                            {'type': 'profile-location'}
                        ]
                    }
                ]
        }

mock_cv = "some text with personal information"

response = completion(model="sap/gpt-4o",
                      messages=[{"role": "user", "content": "Give a one sentence summary of the CV. CV: {{?cv}}?"}],
                      placeholder_values={"cv": mock_cv},
                      masking=masking_config)
print(response.choices[0].message.content)

# Data masking module also available for embedding 
response = embedding(model="sap/text-embedding-3-small",
                      input=mock_cv,
                      masking=masking_config)
print(response.data[0])
```
如需所有可用 data masking 設定的詳細資訊，請參閱[文件](https://help.sap.com/docs/sap-ai-core/generative-ai/enhancing-model-consumption-with-data-masking-66ad6f469afc4c2cbaa91a27a33f7b21?locale=en-US)

#### 內容篩選 {#content-filtering}
Content filtering 模組可讓您根據內容安全標準過濾輸入與輸出。 

此模組支援兩項服務：
* Azure Content Safety
* Llama Guard 3

```python showLineNumbers title="Content Filtering Example"
from litellm import completion

filtering_config_azure = {
    'input':
        {
            'filters':
                [
                    {'type': 'azure_content_safety',
                     'config':
                         {'hate': 0,
                          'sexual': 0,
                          'violence': 0,
                          'self_harm': 0
                          }
                     }
                ]
        },
    'output':
        {
            'filters':
                [
                    {'type': 'azure_content_safety',
                     'config': {'hate': 0,
                          'sexual': 0,
                          'violence': 0,
                          'self_harm': 0
                          }
                     }
                ]
        }
}

response = completion(model="sap/gpt-4o",
                      messages=[{"role": "user", "content": "Hello world!"}],
                      filtering=filtering_config_azure)
print(response.choices[0].message.content) 
# The model responds normally because the content does not violate any safety rules.

try:
    response = completion(model="sap/gpt-4o",
                          messages=[{"role": "user", "content": "I hate you"}],
                          filtering=filtering_config_azure)
except Exception as e:
    print(e) 
    # The service raises an error:
    # "Input Filter: Content filtered due to safety violations. Please modify the prompt and try again."
```
如需所有可用 content filtering 設定的詳細資訊，請參閱[文件](https://help.sap.com/docs/sap-ai-core/generative-ai/content-filtering?locale=en-US)

#### 模組備援設定清單 {#list-of-modules-configuration-for-fallback}
SAP GEN AI Hub 支援用於處理錯誤的備援機制。此機制可讓您指定在發生錯誤時要使用的備援模組清單。備援模組應包含設定請求所需的所有參數。

必要參數：
- `model` 
- `messages`

選用參數： 
- `filtering`
- `grounding`
- `translation`
- `masking`
- `tools`

- 以及模型的任何特定參數。

```python showLineNumbers title="Fallback Example"
from litellm import completion

translation_config = {
    'input':
        {'type': 'sap_document_translation',
         'config':
             {'source_language': 'en-US',
              'target_language': 'de-DE'}
         },
    'output':
        {'type': 'sap_document_translation',
         'config':
             {'source_language': 'de-DE',
              'target_language': 'fr-FR'}
         }
}

response = completion(model="sap/gpt-4o",
                      messages=[{"role": "user", "content": "Hello world!"}],
                      translation=translation_config,
                      fallback_sap_modules=[{
                          "model":"sap/gemini-2.5-flash",
                          "messages":[{"role": "user", "content": "Hello world!"}],
                          "translation":translation_config
                      }])

# In case of error with the first configuration (model gpt-4o), the fallback module is used.

print(response.choices[0].message.content)

```


## 參考資料 {#reference}

### 支援的參數 {#supported-parameters}

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `model` | string | 模型識別碼（SDK 使用時帶有 `sap/` 前綴） |
| `messages` | array | 對話訊息 |
| `temperature` | float | 控制隨機性（0-2） |
| `max_tokens` | integer | 回應中的最大 token 數 |
| `top_p` | float | 核取樣閾值 |
| `stream` | boolean | 啟用串流回應 |
| `response_format` | object | 輸出格式（`json_object`、`json_schema`） |
| `tools` | array | 函式呼叫工具定義 |
| `tool_choice` | string/object | 工具選擇行為 |

### 支援的模型 {#supported-models}

如需 SAP Gen AI Hub 提供之可用模型的完整且最新清單，請參閱[SAP AI Core Generative AI Hub 文件](https://help.sap.com/docs/sap-ai-core/sap-ai-core-service-guide/models-and-scenarios-in-generative-ai-hub)。

:::info 模型可用性
模型可用性會因 SAP 部署區域與您的訂閱而異。請聯絡您的 SAP 管理員以確認您環境中可用的模型。
:::

### 疑難排解 {#troubleshooting}

**驗證錯誤**

如果您收到驗證錯誤：

1. 確認所有必要的環境變數都已正確設定
2. 檢查您的服務金鑰是否已過期
3. 確認您的資源群組有權存取所需的模型
4. 確保 `AICORE_AUTH_URL` 與 `AICORE_BASE_URL` 與您的 SAP 區域相符

**找不到模型**

如果模型回傳「not found」：

1. 確認該模型在您的 SAP 部署中可用
2. 檢查您是否使用正確的模型名稱格式（SDK 使用 `sap/` 前綴）
3. 確認您的資源群組有權存取該特定模型
4. 若為 Anthropic 模型，請確保您使用 `anthropic--` 雙連字號前綴

**速率限制**

SAP Gen AI Hub 會依您的訂閱強制執行速率限制。如果您遇到限制：

1. 實作指數退避重試邏輯
2. 考慮使用 proxy 內建的速率限制功能
3. 聯絡您的 SAP 管理員以檢視配額分配
