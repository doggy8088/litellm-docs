import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# [BETA] Google AI Studio (Gemini) 檔案 API {#beta-google-ai-studio-gemini-files-api}

使用此功能可將檔案上傳至 Google AI Studio (Gemini)。

適合將大型媒體檔案傳遞給 Gemini 的 `/generateContent` 端點。

| 動作 | 支援 | 
|----------|-----------|
| `create` | 是 |
| `delete` | 否 |
| `retrieve` | 否 |
| `list` | 否 |

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import base64
import requests
from litellm import completion, create_file
import os


### UPLOAD FILE ### 

# Fetch the audio file and convert it to a base64 encoded string
url = "https://cdn.openai.com/API/docs/audio/alloy.wav"
response = requests.get(url)
response.raise_for_status()
wav_data = response.content
encoded_string = base64.b64encode(wav_data).decode('utf-8')


file = create_file(
    file=wav_data,
    purpose="user_data",
    extra_headers={"custom-llm-provider": "gemini"},
    api_key=os.getenv("GEMINI_API_KEY"),
)

print(f"file: {file}")

assert file is not None


### GENERATE CONTENT ### 
completion = completion(
    model="gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": [
                { 
                    "type": "text",
                    "text": "What is in this recording?"
                },
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                        "filename": "my-test-name",
                        "format": "audio/wav"
                    }
                }
            ]
        },
    ]
)

print(completion.choices[0].message)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: "gemini-2.0-flash"
      litellm_params:
        model: gemini/gemini-2.0-flash
        api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試

```python
import base64
import requests
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234"
)

# Fetch the audio file and convert it to a base64 encoded string
url = "https://cdn.openai.com/API/docs/audio/alloy.wav"
response = requests.get(url)
response.raise_for_status()
wav_data = response.content
encoded_string = base64.b64encode(wav_data).decode('utf-8')


file = client.files.create(
    file=wav_data,
    purpose="user_data",
    extra_body={"target_model_names": "gemini-2.0-flash"}
)

print(f"file: {file}")

assert file is not None

completion = client.chat.completions.create(
    model="gemini-2.0-flash",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": [
                { 
                    "type": "text",
                    "text": "What is in this recording?"
                },
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                        "filename": "my-test-name",
                        "format": "audio/wav"
                    }
                }
            ]
        },
    ],
    extra_body={"drop_params": True}
)

print(completion.choices[0].message)
```


</TabItem>
</Tabs>

## Azure Blob Storage 整合 {#azure-blob-storage-integration}

LiteLLM 支援將 Azure Blob Storage 作為 Gemini 檔案上傳的目標儲存後端。這可讓您將檔案儲存在 Azure Data Lake Storage Gen2，而非 Google 的受管理儲存。

### 步驟 1：設定 Azure Blob Storage {#step-1-setup-azure-blob-storage}

請透過設定下列環境變數來設定您的 Azure Blob Storage 帳戶：

**必要環境變數：**
- `AZURE_STORAGE_ACCOUNT_NAME` - 您的 Azure 儲存體帳戶名稱
- `AZURE_STORAGE_FILE_SYSTEM` - 儲存檔案的容器／檔案系統名稱
- `AZURE_STORAGE_ACCOUNT_KEY` - 您的帳戶金鑰

### 步驟 2：將 Azure Blob Storage 作為目標儲存 {#step-2-pass-azure-blob-storage-as-target-storage}

上傳檔案時，請指定 `target_storage: "azure_storage"`，以使用 Azure Blob Storage 取代預設儲存。

**支援的檔案類型：**

Azure Blob Storage 支援所有與 Gemini 相容的檔案類型：

- **圖片**：PNG、JPEG、WEBP
- **音訊**：AAC、FLAC、MP3、MPA、MPEG、MPGA、OPUS、PCM、WAV、WEBM
- **影片**：FLV、MOV、MPEG、MPEGPS、MPG、MP4、WEBM、WMV、3GPP
- **文件**：PDF、TXT

> **注意：** 只有小型檔案可以作為內嵌資料傳送，因為總請求大小上限為 20 MB。

### 步驟 3：使用 Azure Blob Storage 上傳 Gemini 檔案 {#step-3-upload-files-with-azure-blob-storage-for-gemini}

<Tabs>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: "gemini-2.5-flash"
      litellm_params:
        model: gemini/gemini-2.5-flash
        api_key: os.environ/GEMINI_API_KEY
```

2. 設定環境變數

```bash
export AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
export AZURE_STORAGE_FILE_SYSTEM="your-container-name"
export AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
```
或將它們加入您的 `.env`

3. 啟動 proxy

```bash
litellm --config config.yaml
```

4. 使用 Azure Blob Storage 上傳檔案

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234"
)

# Upload file to Azure Blob Storage
file = client.files.create(
    file=open("document.pdf", "rb"),
    purpose="user_data",
    extra_body={
        "target_model_names": "gemini-2.0-flash",
        "target_storage": "azure_storage"  # 👈 Use Azure Blob Storage
    }
)

print(f"File uploaded to Azure Blob Storage: {file.id}")

# Use the file with Gemini
completion = client.chat.completions.create(
    model="gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Summarize this document"},
                {
                    "type": "file",
                    "file": {
                        "file_id": file.id,
                    }
                }
            ]
        }
    ]
)

print(completion.choices[0].message.content)
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash
# Upload file with Azure Blob Storage
curl -X POST "http://0.0.0.0:4000/v1/files" \
  -H "Authorization: Bearer sk-1234" \
  -F "file=@document.pdf" \
  -F "purpose=user_data" \
  -F "target_storage=azure_storage" \
  -F "target_model_names=gemini-2.0-flash" \
  -F "custom_llm_provider=gemini"

# Use the file with Gemini
curl -X POST "http://0.0.0.0:4000/v1/chat/completions" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Summarize this document"},
          {
            "type": "file",
            "file": {
              "file_id": "file-id-from-upload",
              "format": "application/pdf"
            }
          }
        ]
      }
    ]
  }'
```

</TabItem>
</Tabs>

:::info
上傳至 Azure Blob Storage 的檔案會儲存在您的 Azure 帳戶中，並可透過回傳的檔案 ID 存取。檔案 URL 格式為：`https://{account}.blob.core.windows.net/{container}/{path}`
:::
