import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure AI 圖像編輯 {#azure-ai-image-editing}

Azure AI 提供強大的圖像編輯能力，使用來自 Black Forest Labs 的 FLUX 模型，根據文字描述修改現有圖像。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Azure AI 圖像編輯使用 FLUX 模型，根據文字提示修改現有圖像。 |
| LiteLLM 上的提供者路由 | `azure_ai/` |
| 提供者文件 | [Azure AI FLUX 模型 ↗](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/black-forest-labs-flux-1-kontext-pro-and-flux1-1-pro-now-available-in-azure-ai-f/4434659) |
| 支援的操作 | [`/images/edits`](#image-editing) |

## 設定 {#setup}

### API 金鑰 & Base URL & API 版本 {#api-key--base-url--api-version}

```python showLineNumbers
# Set your Azure AI API credentials
import os
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"  # e.g., https://your-endpoint.eastus2.inference.ai.azure.com/
os.environ["AZURE_AI_API_VERSION"] = "2025-04-01-preview"  # Example API version
```

請從 [Azure AI Studio](https://ai.azure.com/) 取得您的 API 金鑰與端點。

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 每張圖像成本 |
|------------|-------------|----------------|
| `azure_ai/FLUX.1-Kontext-pro` | 具備增強情境理解能力、用於編輯的 FLUX 1 Kontext Pro 模型 | $0.04 |

## 圖像編輯 {#image-editing}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic-edit" label="基本用法">

```python showLineNumbers title="Basic Image Editing"
import os
import base64
from pathlib import Path

import litellm

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"
os.environ["AZURE_AI_API_VERSION"] = "2025-04-01-preview"

# Edit an image with a prompt
response = litellm.image_edit(
    model="azure_ai/FLUX.1-Kontext-pro",
    image=open("path/to/your/image.png", "rb"),
    prompt="Add a winter theme with snow and cold colors",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"],
    api_version=os.environ["AZURE_AI_API_VERSION"]
)

img_base64 = response.data[0].get("b64_json")
img_bytes = base64.b64decode(img_base64)
path = Path("edited_image.png")
path.write_bytes(img_bytes)
```

</TabItem>

<TabItem value="async-edit" label="非同步用法">

```python showLineNumbers title="Async Image Editing"
import os
import base64
from pathlib import Path

import litellm
import asyncio

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"
os.environ["AZURE_AI_API_VERSION"] = "2025-04-01-preview"

async def edit_image():
    # Edit image asynchronously
    response = await litellm.aimage_edit(
        model="azure_ai/FLUX.1-Kontext-pro",
        image=open("path/to/your/image.png", "rb"),
        prompt="Make this image look like a watercolor painting",
        api_base=os.environ["AZURE_AI_API_BASE"],
        api_key=os.environ["AZURE_AI_API_KEY"],
        api_version=os.environ["AZURE_AI_API_VERSION"]
    )
    img_base64 = response.data[0].get("b64_json")
    img_bytes = base64.b64decode(img_base64)
    path = Path("async_edited_image.png")
    path.write_bytes(img_bytes)

# Run the async function
asyncio.run(edit_image())
```

</TabItem>

<TabItem value="advanced-edit" label="進階參數">

```python showLineNumbers title="Advanced Image Editing with Parameters"
import os
import base64
from pathlib import Path

import litellm

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"
os.environ["AZURE_AI_API_VERSION"] = "2025-04-01-preview"

# Edit image with additional parameters
response = litellm.image_edit(
    model="azure_ai/FLUX.1-Kontext-pro",
    image=open("path/to/your/image.png", "rb"),
    prompt="Add magical elements like floating crystals and mystical lighting",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"],
    api_version=os.environ["AZURE_AI_API_VERSION"],
    n=1
)
img_base64 = response.data[0].get("b64_json")
img_bytes = base64.b64decode(img_base64)
path = Path("advanced_edited_image.png")
path.write_bytes(img_bytes)
```

</TabItem>
</Tabs>

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Azure AI Image Editing Configuration"
model_list:
  - model_name: azure-flux-kontext-edit
    litellm_params:
      model: azure_ai/FLUX.1-Kontext-pro
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
      api_version: os.environ/AZURE_AI_API_VERSION
    model_info:
      mode: image_edit

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 LiteLLM Proxy Server {#2-start-litellm-proxy-server}

```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 使用 OpenAI Python SDK 發送圖像編輯請求 {#3-make-image-editing-requests-with-openai-python-sdk}

<Tabs>
<TabItem value="openai-edit-sdk" label="OpenAI SDK">

```python showLineNumbers title="Azure AI Image Editing via Proxy - OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="sk-1234"                  # Your proxy API key
)

# Edit image with FLUX Kontext Pro
response = client.images.edit(
    model="azure-flux-kontext-edit",
    image=open("path/to/your/image.png", "rb"),
    prompt="Transform this image into a beautiful oil painting style",
)

img_base64 = response.data[0].b64_json
img_bytes = base64.b64decode(img_base64)
path = Path("proxy_edited_image.png")
path.write_bytes(img_bytes)
```

</TabItem>

<TabItem value="litellm-edit-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Azure AI Image Editing via Proxy - LiteLLM SDK"
import litellm

# Edit image through proxy
response = litellm.image_edit(
    model="litellm_proxy/azure-flux-kontext-edit",
    image=open("path/to/your/image.png", "rb"),
    prompt="Add a mystical forest background with magical creatures",
    api_base="http://localhost:4000",
    api_key="sk-1234"
)

img_base64 = response.data[0].b64_json
img_bytes = base64.b64decode(img_base64)
path = Path("proxy_edited_image.png")
path.write_bytes(img_bytes)
```

</TabItem>

<TabItem value="curl-edit" label="cURL">

```bash showLineNumbers title="Azure AI Image Editing via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/edits' \
--header 'Authorization: Bearer sk-1234' \
--form 'model="azure-flux-kontext-edit"' \
--form 'prompt="Convert this image to a vintage sepia tone with old-fashioned effects"' \
--form 'image=@"path/to/your/image.png"'
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

Azure AI 圖像編輯支援以下相容於 OpenAI 的參數：

| 參數 | 類型 | 說明 | 預設值 | 範例 |
|-----------|------|-------------|---------|---------|
| `image` | 檔案 | 要編輯的圖像檔案 | 必填 | 檔案物件或二進位資料 |
| `prompt` | string | 所需變更的文字描述 | 必填 | `"Add snow and winter elements"` |
| `model` | string | 用於編輯的 FLUX 模型 | 必填 | `"azure_ai/FLUX.1-Kontext-pro"` |
| `n` | integer | 要產生的編輯後圖像數量（您只能指定 1） | `1` | `1` |
| `api_base` | string | 您的 Azure AI 端點 URL | 必填 | `"https://your-endpoint.eastus2.inference.ai.azure.com/"` |
| `api_key` | string | 您的 Azure AI API 金鑰 | 必填 | 環境變數或直接值 |
| `api_version` | string | Azure AI 的 API 版本 | 必填 | `"2025-04-01-preview"` |

## 開始使用 {#getting-started}

1. 在 [Azure AI Studio](https://ai.azure.com/) 建立帳號
2. 在您的 Azure AI Studio 工作區中部署 FLUX 模型
3. 從部署詳細資訊取得您的 API 金鑰與端點
4. 設定您的 `AZURE_AI_API_KEY`、`AZURE_AI_API_BASE` 和 `AZURE_AI_API_VERSION` 環境變數
5. 準備您的來源圖像
6. 使用 `litellm.image_edit()` 以文字指示修改您的圖像

## 其他資源 {#additional-resources}

- [Azure AI Studio 文件](https://docs.microsoft.com/en-us/azure/ai-services/)
- [FLUX 模型公告](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/black-forest-labs-flux-1-kontext-pro-and-flux1-1-pro-now-available-in-azure-ai-f/4434659)
