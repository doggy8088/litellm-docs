import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import Image from '@theme/IdealImage';

# [BETA] LiteLLM 受管理檔案 {#beta-litellm-managed-files}

- 在不同提供者之間重用同一個檔案。
- 防止使用者在 `list` 和 `retrieve` 請求中看到自己沒有存取權限的檔案。 

:::info

這是 LiteLLM Enterprise 的免費功能。

可透過 `litellm` docker 映像使用。如果您使用 pip 套件，必須安裝 [`litellm-enterprise`](https://pypi.org/project/litellm-enterprise/)。

:::

| 屬性 | 值 | 備註 |
| --- | --- | --- |
| Proxy | ✅ |  |
| SDK | ❌ | 需要 postgres DB 來儲存檔案 id。 |
| 適用於所有提供者 | ✅ |  |
| 支援的端點 | `/chat/completions`, `/batch`, `/fine_tuning`, `/responses` |  |

## 使用方式 {#usage}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
    - model_name: "gemini-2.0-flash"
      litellm_params:
        model: vertex_ai/gemini-2.0-flash
        vertex_project: my-project-id
        vertex_location: us-central1
    - model_name: "gpt-4o-mini-openai"
      litellm_params:
        model: gpt-4o-mini
        api_key: os.environ/OPENAI_API_KEY

general_settings: 
  master_key: sk-1234  # alternatively use the env var - LITELLM_MASTER_KEY
  database_url: "postgresql://<user>:<password>@<host>:<port>/<dbname>" # alternatively use the env var - DATABASE_URL

litellm_settings:
  require_managed_files: true # optional - reject POST /v1/files without target_model_names
```

#### （選用）在上傳時強制使用受管理檔案 {#optional-enforce-managed-files-on-upload}

預設情況下，當未指定 `target_model_names` 時，`POST /v1/files` 會回退到傳統的提供者檔案路徑。請在 `litellm_settings` 下設定 `require_managed_files: true`，以要求每次上傳都使用受管理檔案。

```yaml
litellm_settings:
  require_managed_files: true
```

啟用後，未提供 `target_model_names` 的上傳會回傳 `400`。當提供 `target_model_names` 時，既有的受管理檔案行為不會改變。

```python
# String (comma-separated for multiple models)
extra_body={"target_model_names": "gpt-4o-mini-openai, gemini-2.0-flash"}

# List (OpenAI Python SDK sends this as target_model_names[] in multipart form)
extra_body={"target_model_names": ["gpt-4o-mini-openai"]}
```

### 2. 啟動 proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試看看！ {#3-test-it}

指定 `target_model_names` 以在不同提供者之間使用相同的 file id。這是透過 config.yaml 設定的 model_names 清單（或 UI 上的 'public_model_names'）。 

```python
target_model_names="gpt-4o-mini-openai, gemini-2.0-flash" # 👈 Specify model_names
```

請查看 `/v1/models`，以查看某個 key 可用的模型名稱清單。

#### **儲存 PDF 檔案** {#store-a-pdf-file}

```python
from openai import OpenAI

client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)


# Download and save the PDF locally 
url = (
    "https://storage.googleapis.com/cloud-samples-data/generative-ai/pdf/2403.05530.pdf"
)
response = requests.get(url)
response.raise_for_status()

# Save the PDF locally
with open("2403.05530.pdf", "wb") as f:
    f.write(response.content)

file = client.files.create(
    file=open("2403.05530.pdf", "rb"),
    purpose="user_data", # can be any openai 'purpose' value
    extra_body={"target_model_names": "gpt-4o-mini-openai, gemini-2.0-flash"}, # 👈 Specify model_names
)

print(f"file id={file.id}")
```

#### **在不同提供者之間使用相同的 file id** {#use-the-same-file-id-across-different-providers}

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
completion = client.chat.completions.create(
    model="gpt-4o-mini-openai",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this recording?"},
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                    },
                },
            ],
        },
    ]
)

print(completion.choices[0].message)
```


</TabItem>
<TabItem value="vertex" label="Vertex AI">

```python
completion = client.chat.completions.create(
    model="gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this recording?"},
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                    },
                },
            ],
        },
    ]
)

print(completion.choices[0].message)

```

</TabItem>
</Tabs>

### 完整範例 {#complete-example}

```python   
import base64
import requests
from openai import OpenAI

client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)


# Download and save the PDF locally
url = (
    "https://storage.googleapis.com/cloud-samples-data/generative-ai/pdf/2403.05530.pdf"
)
response = requests.get(url)
response.raise_for_status()

# Save the PDF locally
with open("2403.05530.pdf", "wb") as f:
    f.write(response.content)

# Read the local PDF file
file = client.files.create(
    file=open("2403.05530.pdf", "rb"),
    purpose="user_data", # can be any openai 'purpose' value
    extra_body={"target_model_names": "gpt-4o-mini-openai, vertex_ai/gemini-2.0-flash"},
)

print(f"file.id: {file.id}") # 👈 Unified file id

## GEMINI CALL ### 
completion = client.chat.completions.create(
    model="gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this recording?"},
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                    },
                },
            ],
        },
    ]
)

print(completion.choices[0].message)


### OPENAI CALL ### 
completion = client.chat.completions.create(
    model="gpt-4o-mini-openai",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this recording?"},
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                    },
                },
            ],
        },
    ],
)

print(completion.choices[0].message)

```

## 檔案權限 {#file-permissions}

防止使用者在 `list` 和 `retrieve` 請求中看到自己沒有存取權限的檔案。 

### 1. 設定 config.yaml {#1-setup-configyaml-1}

```yaml
model_list:
    - model_name: "gpt-4o-mini-openai"
      litellm_params:
        model: gpt-4o-mini
        api_key: os.environ/OPENAI_API_KEY

general_settings: 
  master_key: sk-1234  # alternatively use the env var - LITELLM_MASTER_KEY
  database_url: "postgresql://<user>:<password>@<host>:<port>/<dbname>" # alternatively use the env var - DATABASE_URL
```

### 2. 啟動 proxy {#2-start-proxy-1}

```bash
litellm --config /path/to/config.yaml
```

### 3. 將 key 發給使用者 {#3-issue-a-key-to-the-user}

讓我們建立一個 id 為 `user_123` 的使用者。

```bash
curl -L -X POST 'http://0.0.0.0:4000/user/new' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"models": ["gpt-4o-mini-openai"], "user_id": "user_123"}'
```

從回應中取得 key。

```json
{
    "key": "sk-..."
}
```

### 4. 使用者建立檔案 {#4-user-creates-a-file}

#### 4a. 建立檔案 {#4a-create-a-file}

```jsonl
{"messages": [{"role": "system", "content": "Clippy is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "What's the capital of France?"}, {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}]}
{"messages": [{"role": "system", "content": "Clippy is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"}, {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}]}
```

#### 4b. 上傳檔案 {#4b-upload-the-file}

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-...", # 👈 Use the key you generated in step 3
    max_retries=0
)

# Upload file
finetuning_input_file = client.files.create(
    file=open("./fine_tuning.jsonl", "rb"), # {"model": "azure-gpt-4o"} <-> {"model": "gpt-4o-my-special-deployment"}
    purpose="fine-tune",
    extra_body={"target_model_names": "gpt-4.1-openai"} # 👈 Tells litellm which regions/projects to write the file in. 
)
print(finetuning_input_file) # file.id = "litellm_proxy/..." = {"model_name": {"deployment_id": "deployment_file_id"}}
```

### 5. 使用者擷取檔案  {#5-user-retrieves-a-file}

<Tabs>
<TabItem value="has_access" label="使用者建立的檔案">

```python
from openai import OpenAI

... # User created file (3b)

file = client.files.retrieve(
    file_id=finetuning_input_file.id
)

print(file) # File retrieved successfully
```

</TabItem>
<TabItem value="no_access" label="使用者未建立的檔案">

```python
```python
from openai import OpenAI

... # User created file (3b)

try: 
    file = client.files.retrieve(
        file_id="bGl0ZWxsbV9wcm94eTphcHBsaWNhdGlvbi9vY3RldC1zdHJlYW07dW5pZmllZF9pZCwyYTgzOWIyYS03YzI1LTRiNTUtYTUxYS1lZjdhODljNzZkMzU7dGFyZ2V0X21vZGVsX25hbWVzLGdwdC00by1iYXRjaA"
    )
except Exception as e:
    print(e) # User does not have access to this file

```

</TabItem>
</Tabs>

## 支援的端點 {#supported-endpoints}

#### 建立檔案 - `/files` {#create-a-file---files}

```python
from openai import OpenAI

client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)

# Download and save the PDF locally
url = (
    "https://storage.googleapis.com/cloud-samples-data/generative-ai/pdf/2403.05530.pdf"
)
response = requests.get(url)
response.raise_for_status()

# Save the PDF locally
with open("2403.05530.pdf", "wb") as f:
    f.write(response.content)

# Read the local PDF file
file = client.files.create(
    file=open("2403.05530.pdf", "rb"),
    purpose="user_data", # can be any openai 'purpose' value
    extra_body={"target_model_names": "gpt-4o-mini-openai, vertex_ai/gemini-2.0-flash"},
)
```

#### 擷取檔案 - `/files/{file_id}` {#retrieve-a-file---filesfile_id}

```python
client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)

file = client.files.retrieve(file_id=file.id)
```

#### 刪除檔案 - `/files/{file_id}/delete` {#delete-a-file---filesfile_iddelete}

```python
client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)

file = client.files.delete(file_id=file.id)
```

#### 列出檔案 - `/files` {#list-files---files}

```python
client = OpenAI(base_url="http://0.0.0.0:4000", api_key="sk-1234", max_retries=0)

files = client.files.list(extra_body={"target_model_names": "gpt-4o-mini-openai"})

print(files) # All files user has created
```

List Files 的 Pre-GA 限制：
 - 不支援多模型：目前只支援 1 個 model name。 
 - 不支援多部署：目前只支援該模型的 1 個 deployment（例如，如果您有 2 個使用 `gpt-4o-mini-openai` public model name 的部署，它會選擇其中一個，並回傳該部署上的所有檔案）。

Managed Files 功能的 Pre-GA 限制會在 GA 前修正。

## FAQ {#faq}

**1. LiteLLM 會儲存檔案嗎？**

不會，LiteLLM 不會儲存檔案。它只會在 postgres DB 中儲存檔案 id。

**2. LiteLLM 如何知道要為某個 file id 使用哪個檔案？**

LiteLLM 會在 postgres DB 中將 litellm file id 對應到特定於模型的 file id。當有請求進來時，LiteLLM 會查詢特定於模型的 file id，並在送往提供者的請求中使用它。

**3. 檔案刪除如何運作？**

當檔案被刪除時，LiteLLM 會從 postgres DB 中刪除對應關係，以及各個提供者上的檔案。

**4. 使用者可以呼叫由其他使用者建立的 file id 嗎？**

不行，截至 `v1.71.2`，使用者只能檢視／編輯／刪除自己建立的檔案。

## 架構 {#architecture}

<Image img={require('../../img/managed_files_arch.png')}  style={{ width: '800px', height: 'auto' }} />

## 另請參閱 {#see-also}

- [搭配微調 API 的受管理檔案](../../docs/proxy/managed_finetuning)
- [搭配 Batch API 的受管理檔案](../../docs/proxy/managed_batches)
