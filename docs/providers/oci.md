import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Oracle Cloud Infrastructure (OCI) {#oracle-cloud-infrastructure-oci}
LiteLLM 支援 OCI 隨需 GenAI API 的下列模型。

請查看 [OCI 模型清單](https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)，確認該模型是否可在您的區域中使用。

## 支援的模型 {#supported-models}

關於模型生命週期、退役日期與建議替代方案，請參閱 [OCI 的隨選模型退役頁面](https://docs.oracle.com/en-us/iaas/Content/generative-ai/deprecating-on-demand.htm)。Oracle 是權威來源。

### 聊天／文字生成 {#chat--text-generation}

#### Meta Llama 模型 {#meta-llama-models}
- `meta.llama-4-maverick-17b-128e-instruct-fp8`（多模態）
- `meta.llama-4-scout-17b-16e-instruct`（多模態）
- `meta.llama-3.3-70b-instruct`
- `meta.llama-3.3-70b-instruct-fp8-dynamic`
- `meta.llama-3.2-90b-vision-instruct`（多模態）
- `meta.llama-3.2-11b-vision-instruct`（多模態）

#### xAI Grok 模型 {#xai-grok-models}
- `xai.grok-4.3`
- `xai.grok-4.20`
- `xai.grok-4.20-multi-agent`
- `xai.grok-4`
- `xai.grok-4-fast`
- `xai.grok-4.1-fast`
- `xai.grok-3`
- `xai.grok-3-fast`
- `xai.grok-3-mini`
- `xai.grok-3-mini-fast`
- `xai.grok-code-fast-1`

#### Cohere 模型 {#cohere-models}
- `cohere.command-latest`
- `cohere.command-a-03-2025`
- `cohere.command-a-reasoning-08-2025`
- `cohere.command-a-vision-07-2025`（多模態）
- `cohere.command-a-translate-08-2025`
- `cohere.command-plus-latest`
- `cohere.command-r-plus-08-2024`
- `cohere.command-r-08-2024`

#### 透過 OCI 的 Google Gemini 模型 {#google-gemini-models-via-oci}
- `google.gemini-2.5-pro`（多模態）
- `google.gemini-2.5-flash`（多模態）
- `google.gemini-2.5-flash-lite`（多模態）

#### 透過 OCI 的 OpenAI 開源模型 {#openai-open-source-models-via-oci}
- `openai.gpt-oss-120b`
- `openai.gpt-oss-20b`

### 嵌入模型 {#embedding-models}
- `cohere.embed-v4.0`（1536 維度，多模態）
- `cohere.embed-english-v3.0`（1024 維度）
- `cohere.embed-english-light-v3.0`（384 維度）
- `cohere.embed-multilingual-v3.0`（1024 維度）
- `cohere.embed-multilingual-light-v3.0`（384 維度）
- `cohere.embed-english-image-v3.0`（1024 維度，多模態）
- `cohere.embed-english-light-image-v3.0`（384 維度，多模態）
- `cohere.embed-multilingual-image-v3.0`（1024 維度，多模態）
- `cohere.embed-multilingual-light-image-v3.0`（384 維度，多模態）

## 驗證 {#authentication}

LiteLLM 支援 OCI 的兩種驗證方法：

### 方法 1：手動憑證 {#method-1-manual-credentials}
將個別 OCI 憑證直接提供給 LiteLLM。請依照 [Oracle 官方教學](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm) 建立簽署金鑰並取得下列參數：

- `user`
- `fingerprint`
- `tenancy`
- `region`
- `key_file` 或 `key`
- `compartment_id`

這是 LiteLLM AI Gateway（LLM Proxy）存取 OCI GenAI 模型的預設方法。

**環境變數**

您可以不在程式碼中傳遞憑證，而改為設定下列環境變數，LiteLLM 會自動讀取：

```bash
export OCI_REGION="us-chicago-1"
export OCI_USER="ocid1.user.oc1.."
export OCI_FINGERPRINT="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx"
export OCI_TENANCY="ocid1.tenancy.oc1.."
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1.."
# Provide either the private key content OR the path to the key file:
export OCI_KEY_FILE="/path/to/oci_api_key.pem"
# export OCI_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 方法 2：OCI SDK 簽署工具 {#method-2-oci-sdk-signer}
使用 OCI SDK `Signer` 物件進行驗證。此方法：
- 使用官方的 [OCI SDK 簽署工具](https://docs.oracle.com/en-us/iaas/tools/python/latest/api/signing.html)
- 支援其他驗證方法（instance principals、workload identity 等）

若要使用此方法，請安裝 OCI SDK：
```bash
uv add oci
```

當使用 Oracle Cloud Infrastructure 上的 LiteLLM SDK（執行個體或 Oracle Kubernetes Engine）時，此方法可作為替代方案。

## 區域與政府叢集 {#regions-and-government-realms}

LiteLLM 會將推論端點建構為 `https://inference.generativeai.{region}.oci.{realm_domain}`。區域為 `oci_region`（或 `OCI_REGION` 環境變數，預設為 `us-ashburn-1`）。realm 網域取決於託管該區域的 OCI realm：商業 realm（OC1）使用 `oraclecloud.com`，美國政府 realms（OC2 和 OC3）使用 `oraclegovcloud.com`，英國政府 realm（OC4）使用 `oraclegovcloud.uk`，其他 OCI SDK 已知的每個 realm 則使用對應的網域。因而 `us-luke-1` 中的請求會直接送往 `https://inference.generativeai.us-luke-1.oci.oraclegovcloud.com`，無需任何端點設定。

LiteLLM 會從以下來源中第一個可提供答案的來源取得 realm 網域：

1. `oci_compartment_id` 內的 realm key。每個 OCID 都在第三段帶有它，因此 `ocid1.compartment.oc2..` 會選擇美國政府 realm，而 `ocid1.compartment.oc1..` 會選擇商業 realm。
2. OCI Python SDK（`oci.regions`）的區域登錄檔，當 `oci` 套件已安裝時。
3. OCI SDK 也會讀取的區域中繼資料：先讀 `~/.oci/regions-config.json`（一個 JSON 陣列），再讀 `OCI_REGION_METADATA` 環境變數（一個 JSON 物件）。其 `regionIdentifier` 與該區域相符的項目會提供 `realmDomainComponent`。
4. 商業 realm，`oraclecloud.com`。

設定 `api_base` 會完全跳過此解析流程，請參閱 [使用 api_base 覆寫端點](#overriding-the-endpoint-with-api_base)。

由於 compartment OCID 已經標示了 realm，政府部署所需的參數與商業部署相同：

<Tabs>
<TabItem value="gov-sdk" label="SDK" default>

```python
from litellm import completion

response = completion(
    model="oci/meta.llama-3.3-70b-instruct",
    messages=[{"role": "user", "content": "Hello"}],
    oci_region="us-luke-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="ocid1.compartment.oc2..",
)
```

</TabItem>
<TabItem value="gov-proxy" label="PROXY">

```yaml
model_list:
  - model_name: oci-gov-llama
    litellm_params:
      model: oci/meta.llama-3.3-70b-instruct
      oci_region: us-luke-1
      oci_user: os.environ/OCI_USER
      oci_fingerprint: os.environ/OCI_FINGERPRINT
      oci_tenancy: os.environ/OCI_TENANCY
      oci_key_file: os.environ/OCI_KEY_FILE
      oci_compartment_id: os.environ/OCI_COMPARTMENT_ID
```

</TabItem>
</Tabs>

只有在 `oci_compartment_id` 缺少，或其不是帶有 LiteLLM 可識別 realm key 的 OCID 時，來源 2 和 3 才會有影響。未通過驗證的中繼資料項目會被略過並發出警告，而不是使請求失敗；若某個區域未被任何來源描述，則會保留商業端點，因此政府模型絕不會改變同一個 proxy 上其他 OCI 模型的端點。

### 使用 api_base 覆寫端點 {#overriding-the-endpoint-with-api_base}

將 `api_base` 設為將請求送往指定主機，例如 LiteLLM 尚未知悉的 realm、私人端點，或位於 OCI 前方的閘道。LiteLLM 會直接使用所給的值，並自行附加動作路徑（chat 為 `/20231130/actions/chat`，embeddings 為 `/20231130/actions/embedText`）。如果 `api_base` 已經以其中一個路徑結尾，會先移除該尾碼，以免 URL 被重複。請求仍會使用您的 OCI 憑證，針對 `api_base` 中的主機進行簽署，而 `oci_region` 不再影響 URL。

<Tabs>
<TabItem value="api-base-sdk" label="SDK" default>

```python
from litellm import completion

response = completion(
    model="oci/meta.llama-3.3-70b-instruct",
    messages=[{"role": "user", "content": "Hello"}],
    api_base="https://inference.generativeai.us-gov-ashburn-1.oci.oraclegovcloud.com",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)
```

</TabItem>
<TabItem value="api-base-proxy" label="PROXY">

```yaml
model_list:
  - model_name: oci-gov-llama
    litellm_params:
      model: oci/meta.llama-3.3-70b-instruct
      api_base: https://inference.generativeai.us-gov-ashburn-1.oci.oraclegovcloud.com
      oci_user: os.environ/OCI_USER
      oci_fingerprint: os.environ/OCI_FINGERPRINT
      oci_tenancy: os.environ/OCI_TENANCY
      oci_key_file: os.environ/OCI_KEY_FILE
      oci_compartment_id: os.environ/OCI_COMPARTMENT_ID
```

</TabItem>
</Tabs>

## 使用方式 {#usage}

<Tabs>
<TabItem value="manual" label="手動憑證" default>

將從 OCI 簽署金鑰建立程序取得的參數輸入 `completion` 函式：

```python
from litellm import completion

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    oci_region="<your_oci_region>",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_serving_mode="ON_DEMAND",  # Optional, default is "ON_DEMAND". Other option is "DEDICATED"
    # Provide either the private key string OR the path to the key file:
    # Option 1: pass the private key as a string
    oci_key="<string_with_content_of_oci_key>",
    # Option 2: pass the private key file path
    # oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
<TabItem value="oci-sdk" label="OCI SDK 簽署器">

使用 OCI SDK `Signer` 進行驗證：

```python
from litellm import completion
from oci.signer import Signer

# Create an OCI Signer
signer = Signer(
    tenancy="ocid1.tenancy.oc1..",
    user="ocid1.user.oc1..",
    fingerprint="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    private_key_file_location="~/.oci/key.pem",
    # Or use private_key_content="<your_private_key_content>"
)

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    oci_signer=signer,
    oci_region="us-chicago-1",  # Optional, defaults to us-ashburn-1
    oci_serving_mode="ON_DEMAND",  # Optional, default is "ON_DEMAND". Other option is "DEDICATED"
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

**替代方案：使用 OCI 設定檔**

OCI SDK 可自動從 `~/.oci/config` 載入憑證：

```python
from litellm import completion
from oci.config import from_file
from oci.signer import Signer

# Load config from file
config = from_file("~/.oci/config", "DEFAULT")  # "DEFAULT" is the profile name
signer = Signer(
    tenancy=config["tenancy"],
    user=config["user"],
    fingerprint=config["fingerprint"],
    private_key_file_location=config["key_file"],
    pass_phrase=config.get("pass_phrase")  # Optional if key is encrypted
)

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    oci_signer=signer,
    oci_region=config["region"],
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

**執行個體主體驗證**

適用於在 OCI 運算執行個體上執行的應用程式：

```python
from litellm import completion
from oci.auth.signers import InstancePrincipalsSecurityTokenSigner

# Use instance principal authentication
signer = InstancePrincipalsSecurityTokenSigner()

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    oci_signer=signer,
    oci_region="us-chicago-1",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

**工作負載識別驗證**

適用於在 Oracle Kubernetes Engine（OKE）上執行的應用程式：

```python
from litellm import completion
from oci.auth.signers import get_oke_workload_identity_resource_principal_signer

# Use workload identity authentication
signer = get_oke_workload_identity_resource_principal_signer()

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    oci_signer=signer,
    oci_region="us-chicago-1",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```
</TabItem>
</Tabs>

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

以下說明如何透過 LiteLLM Proxy Server 呼叫 OCI GenAI。

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: oci-grok-4
    litellm_params:
      model: oci/xai.grok-4
      oci_region: os.environ/OCI_REGION
      oci_user: os.environ/OCI_USER
      oci_fingerprint: os.environ/OCI_FINGERPRINT
      oci_tenancy: os.environ/OCI_TENANCY
      oci_key_file: os.environ/OCI_KEY_FILE
      oci_compartment_id: os.environ/OCI_COMPARTMENT_ID

  - model_name: oci-cohere-command
    litellm_params:
      model: oci/cohere.command-latest
      oci_region: os.environ/OCI_REGION
      oci_user: os.environ/OCI_USER
      oci_fingerprint: os.environ/OCI_FINGERPRINT
      oci_tenancy: os.environ/OCI_TENANCY
      oci_key_file: os.environ/OCI_KEY_FILE
      oci_compartment_id: os.environ/OCI_COMPARTMENT_ID
```

所有可能的驗證參數：

```
oci_region: Optional[str],
oci_user: Optional[str],
oci_fingerprint: Optional[str],
oci_tenancy: Optional[str],
oci_key: Optional[str],          # private key content as string
oci_key_file: Optional[str],     # path to .pem file
oci_compartment_id: Optional[str],
oci_serving_mode: Optional[str], # "ON_DEMAND" (default) or "DEDICATED"
oci_endpoint_id: Optional[str],  # only used with DEDICATED
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
  "model": "oci-grok-4",
  "messages": [
    {"role": "user", "content": "what llm are you"}
  ]
}'
```

</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="oci-grok-4",
    messages=[{"role": "user", "content": "write a short poem"}],
)
print(response)
```

</TabItem>
</Tabs>

## 使用方式 - 串流 {#usage---streaming}
只要在呼叫 completion 時設定 `stream=True` 即可。

<Tabs>
<TabItem value="manual-stream" label="手動憑證" default>

```python
from litellm import completion

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    stream=True,
    oci_region="<your_oci_region>",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_serving_mode="ON_DEMAND",  # Optional, default is "ON_DEMAND". Other option is "DEDICATED"
    # Provide either the private key string OR the path to the key file:
    # Option 1: pass the private key as a string
    oci_key="<string_with_content_of_oci_key>",
    # Option 2: pass the private key file path
    # oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```

</TabItem>
<TabItem value="oci-sdk-stream" label="OCI SDK 簽署器">

```python
from litellm import completion
from oci.signer import Signer

signer = Signer(
    tenancy="ocid1.tenancy.oc1..",
    user="ocid1.user.oc1..",
    fingerprint="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    private_key_file_location="~/.oci/key.pem",
)

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",
    messages=messages,
    stream=True,
    oci_signer=signer,
    oci_region="us-chicago-1",
    oci_compartment_id="<oci_compartment_id>",
)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```

</TabItem>
</Tabs>

## 依模型類型的使用範例 {#usage-examples-by-model-type}

### 使用 Cohere 模型 {#using-cohere-models}

<Tabs>
<TabItem value="cohere-manual" label="手動憑證" default>

```python
from litellm import completion

messages = [{"role": "user", "content": "Explain quantum computing"}]
response = completion(
    model="oci/cohere.command-latest",
    messages=messages,
    oci_region="us-chicago-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key="<string_with_content_of_oci_key>",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
<TabItem value="cohere-sdk" label="OCI SDK 簽署器">

```python
from litellm import completion
from oci.signer import Signer

signer = Signer(
    tenancy="ocid1.tenancy.oc1..",
    user="ocid1.user.oc1..",
    fingerprint="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    private_key_file_location="~/.oci/key.pem",
)

messages = [{"role": "user", "content": "Explain quantum computing"}]
response = completion(
    model="oci/cohere.command-latest",
    messages=messages,
    oci_signer=signer,
    oci_region="us-chicago-1",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
</Tabs>

## 使用專屬端點 {#using-dedicated-endpoints}

OCI 支援用於代管模型的專屬端點。請搭配 `oci_serving_mode="DEDICATED"` 使用 `oci_endpoint_id` 參數來指定端點 ID。

<Tabs>
<TabItem value="dedicated-manual" label="手動憑證" default>

```python
from litellm import completion

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",  # Must match the model type hosted on the endpoint
    messages=messages,
    oci_region="<your_oci_region>",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_serving_mode="DEDICATED",
    oci_endpoint_id="ocid1.generativeaiendpoint.oc1...",  # Your dedicated endpoint OCID
    oci_key="<string_with_content_of_oci_key>",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
<TabItem value="dedicated-sdk" label="OCI SDK 簽署器">

```python
from litellm import completion
from oci.signer import Signer

signer = Signer(
    tenancy="ocid1.tenancy.oc1..",
    user="ocid1.user.oc1..",
    fingerprint="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    private_key_file_location="~/.oci/key.pem",
)

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(
    model="oci/xai.grok-4",  # Must match the model type hosted on the endpoint
    messages=messages,
    oci_signer=signer,
    oci_region="us-chicago-1",
    oci_serving_mode="DEDICATED",
    oci_endpoint_id="ocid1.generativeaiendpoint.oc1...",  # Your dedicated endpoint OCID
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
</Tabs>

**重要：** 當使用 `oci_serving_mode="DEDICATED"` 時：
- `model` 參數**必須與您專屬端點上代管的模型類型相符**（例如，Cohere 模型使用 `"oci/cohere.command-latest"`，Grok 模型使用 `"oci/xai.grok-4"`）
- 模型名稱決定 API 格式與提供者特定處理（Cohere 與 Generic）
- `oci_endpoint_id` 參數指定您的專屬端點 OCID
- 如果未提供 `oci_endpoint_id`，則會使用 `model` 參數作為端點 ID（為了向後相容）

**Cohere 專屬端點範例：**
```python
# For a dedicated endpoint hosting a Cohere model
response = completion(
    model="oci/cohere.command-latest",  # Use Cohere model name to get Cohere API format
    messages=messages,
    oci_region="us-chicago-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_serving_mode="DEDICATED",
    oci_endpoint_id="ocid1.generativeaiendpoint.oc1...",  # Your Cohere endpoint OCID
    oci_key="<string_with_content_of_oci_key>",
    oci_compartment_id="<oci_compartment_id>",
)
```

## 使用方式 - Function Calling / Tool Calling {#usage---function-calling--tool-calling}

OCI GenAI 支援與 OpenAI 相容的 function calling。LiteLLM 會將 request 與 response 的形狀標準化，因此，針對 OpenAI 所撰寫的相同程式碼也能與 OCI Cohere 和 Generic（xAI Grok、Meta Llama、Google Gemini）模型搭配使用。

<Tabs>
<TabItem value="tool-sdk" label="SDK">

```python
from litellm import completion

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]

response = completion(
    model="oci/xai.grok-4",
    messages=[{"role": "user", "content": "What's the weather in Boston today?"}],
    tools=tools,
    tool_choice="auto",
    oci_region="us-chicago-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)

# Inspect the tool call
print(response.choices[0].message.tool_calls)
```

</TabItem>
<TabItem value="tool-proxy" label="PROXY">

```python
import openai

client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
    model="oci-grok-4",
    messages=[{"role": "user", "content": "What's the weather in Boston today?"}],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"},
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                    },
                    "required": ["location"],
                },
            },
        }
    ],
    tool_choice="auto",
)
print(response.choices[0].message.tool_calls)
```

</TabItem>
</Tabs>

Tool calling 同時適用於 Cohere（`cohere.command-*`）與 Generic（`xai.grok-*`、`meta.llama-*`、`google.gemini-*`）模型家族。LiteLLM 會在內部將 OpenAI tool schema 調整為各供應商的原生格式。

## 使用方式 - 視覺／多模態 {#usage---vision--multimodal}

OCI GenAI 提供可接受影像與文字的視覺能力模型。請使用標準 OpenAI `image_url` content block 傳入影像。

```python
from litellm import completion

response = completion(
    model="oci/meta.llama-4-maverick-17b-128e-instruct-fp8",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                    },
                },
            ],
        }
    ],
    oci_region="us-chicago-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)
print(response.choices[0].message.content)
```

OCI 上具備視覺能力的模型包括：

- `meta.llama-4-maverick-17b-128e-instruct-fp8`
- `meta.llama-4-scout-17b-16e-instruct`
- `meta.llama-3.2-11b-vision-instruct`
- `meta.llama-3.2-90b-vision-instruct`
- `cohere.command-a-vision-07-2025`
- `google.gemini-2.5-pro`、`google.gemini-2.5-flash`、`google.gemini-2.5-flash-lite`

同時支援 URL 與 base64 編碼的 data URI。

## 使用方式 - 推理／思考 {#usage---reasoning--thinking}

OCI Generic-vendor models（xAI Grok reasoning variants、Google Gemini 等）支援 reasoning step。LiteLLM 透過相容 OpenAI 的 `reasoning_effort` 參數提供此功能；可接受的值為 `"low"`、`"medium"`、`"high"` 與 `"disable"`（對應到 OCI 的 `NONE`）。

回傳的推理 token 會顯示在 `usage.completion_tokens_details.reasoning_tokens` 上，與 OpenAI 的格式一致。

<Tabs>
<TabItem value="reasoning-sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="oci/xai.grok-3-mini",
    messages=[{"role": "user", "content": "If 3x + 7 = 22, what is x? Show your reasoning."}],
    reasoning_effort="high",  # "low" | "medium" | "high" | "disable"
    oci_region="us-chicago-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key_file="<path/to/oci_key.pem>",
    oci_compartment_id="<oci_compartment_id>",
)

print(response.choices[0].message.content)
print("Reasoning tokens:", response.usage.completion_tokens_details.reasoning_tokens)
```

</TabItem>
<TabItem value="reasoning-proxy" label="PROXY">

```python
import openai

client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
    model="oci-grok-mini",
    messages=[{"role": "user", "content": "If 3x + 7 = 22, what is x?"}],
    reasoning_effort="high",
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

:::note
僅會對通用提供者推理模型（例如 `reasoning_effort`、`xai.grok-3-mini`、`xai.grok-4`）套用 `google.gemini-2.5-pro`。對於 OCI Cohere 模型則會靜默忽略，因為它們不是推理模型。
:::

## 選用參數 {#optional-parameters}

| 參數 | 型別 | 預設值 | 環境變數 | 說明 |
|-----------|------|---------|----------------------|-------------|
| `oci_region` | string | `us-ashburn-1` | `OCI_REGION` | 部署 GenAI 服務的 OCI 區域 |
| `oci_serving_mode` | string | `ON_DEMAND` | – | 服務模式：受管模型使用 `ON_DEMAND`，專用端點使用 `DEDICATED` |
| `oci_endpoint_id` | string | 與 `model` 相同 | – | （DEDICATED 模式）您專用端點的 OCID |
| `oci_compartment_id` | string | **必填** | `OCI_COMPARTMENT_ID` | 包含您資源的 OCI compartment 的 OCID |
| `oci_user` | string | – | `OCI_USER` | （手動驗證）OCI 使用者的 OCID |
| `oci_fingerprint` | string | – | `OCI_FINGERPRINT` | （手動驗證）API 簽署金鑰的指紋 |
| `oci_tenancy` | string | – | `OCI_TENANCY` | （手動驗證）您的 OCI tenancy 的 OCID |
| `oci_key` | string | – | `OCI_KEY` | （手動驗證）以字串形式提供的私密金鑰內容 |
| `oci_key_file` | string | – | `OCI_KEY_FILE` | （手動驗證）私密金鑰檔案的路徑 |
| `oci_signer` | object | – | – | （SDK 驗證）用於驗證的 OCI SDK Signer 物件 |
| `reasoning_effort` | string | – | – | 通用提供者推理模型的推理等級：`low`、`medium`、`high`、`disable` |

## 嵌入 {#embeddings}

LiteLLM 支援 OCI Generative AI embedding 模型。這些模型使用上述相同的驗證方法。

<Tabs>
<TabItem value="embed-manual" label="手動憑證" default>

```python
from litellm import embedding

response = embedding(
    model="oci/cohere.embed-english-v3.0",
    input=["Hello world", "Goodbye world"],
    oci_region="us-ashburn-1",
    oci_user="<your_oci_user>",
    oci_fingerprint="<your_oci_fingerprint>",
    oci_tenancy="<your_oci_tenancy>",
    oci_key="<string_with_content_of_oci_key>",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
<TabItem value="embed-sdk" label="OCI SDK Signer">

```python
from litellm import embedding
from oci.signer import Signer

signer = Signer(
    tenancy="ocid1.tenancy.oc1..",
    user="ocid1.user.oc1..",
    fingerprint="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    private_key_file_location="~/.oci/key.pem",
)

response = embedding(
    model="oci/cohere.embed-english-v3.0",
    input=["Hello world", "Goodbye world"],
    oci_signer=signer,
    oci_region="us-ashburn-1",
    oci_compartment_id="<oci_compartment_id>",
)
print(response)
```

</TabItem>
</Tabs>

### Embedding 選用參數 {#embedding-optional-parameters}

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `input_type` | string | - | 輸入類型：`search_document`、`search_query`、`classification`、`clustering` |
| `truncate` | string | `END` | 當輸入超過最大 token 數時的截斷策略：`END` 或 `START` |

### 使用專用 Embedding 端點 {#using-dedicated-embedding-endpoints}

```python
response = embedding(
    model="oci/cohere.embed-english-v3.0",
    input=["Hello world"],
    oci_serving_mode="DEDICATED",
    oci_endpoint_id="ocid1.generativeaiendpoint.oc1...",
    oci_region="us-ashburn-1",
    oci_compartment_id="<oci_compartment_id>",
    # ... auth params
)
```
