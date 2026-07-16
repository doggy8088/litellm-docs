# /ocr {#ocr}

| 功能 | 支援 | 
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅（不支援基本記錄） |
| 負載平衡 | ✅ |
| 支援的提供者 | `mistral`, `azure_ai`, `vertex_ai` |

:::tip

LiteLLM 遵循 [Mistral OCR API 的請求/回應](https://docs.mistral.ai/capabilities/vision/#optical-character-recognition-ocr)

:::

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}
### 快速開始  {#quick-start}

```python
from litellm import ocr
import os

os.environ["MISTRAL_API_KEY"] = "sk-.."

response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": "https://arxiv.org/pdf/2201.04234"
    }
)

# Access extracted text
for page in response.pages:
    print(f"Page {page.index}:")
    print(page.markdown)
```

### 非同步使用方式  {#async-usage}

```python
from litellm import aocr
import os, asyncio

os.environ["MISTRAL_API_KEY"] = "sk-.."

async def test_async_ocr(): 
    response = await aocr(
        model="mistral/mistral-ocr-latest",
        document={
            "type": "document_url",
            "document_url": "https://arxiv.org/pdf/2201.04234"
        }
    )
    
    # Access extracted text
    for page in response.pages:
        print(f"Page {page.index}:")
        print(page.markdown)

asyncio.run(test_async_ocr())
```

### 使用本機檔案 {#using-local-files}

LiteLLM 可以直接讀取本機檔案 — 不需要手動進行 base64 編碼：

```python
from litellm import ocr

# OCR with a local PDF file path
response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "file",
        "file": "/path/to/document.pdf"
    }
)

# OCR with a file object
response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "file",
        "file": open("document.pdf", "rb")
    }
)

# OCR with raw bytes
with open("document.pdf", "rb") as f:
    pdf_bytes = f.read()

response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "file",
        "file": pdf_bytes,
        "mime_type": "application/pdf"  # recommended for raw bytes (auto-detected from extension for file paths)
    }
)
```

`file` 欄位接受：
- **檔案路徑**（`str` 或 `pathlib.Path`）— LiteLLM 會讀取檔案並依副檔名偵測 MIME 類型
- **檔案物件**（二進位檔案類檔物件）— 例如 `open("doc.pdf", "rb")`
- **原始位元組**（`bytes`）— 使用 `mime_type` 來指定內容類型

LiteLLM 會自動在內部將檔案輸入轉換為 base64 data URI，因此所有提供者都能無縫運作。

### 使用 Base64 編碼文件 {#using-base64-encoded-documents}

```python
import base64
from litellm import ocr

# Encode PDF to base64
with open("document.pdf", "rb") as f:
    base64_pdf = base64.b64encode(f.read()).decode('utf-8')

response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": f"data:application/pdf;base64,{base64_pdf}"
    }
)
```

### 可選參數 {#optional-parameters}

```python
response = ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": "https://example.com/doc.pdf"
    },
    # Optional Mistral parameters
    pages=[0, 1, 2],              # Only process specific pages
    include_image_base64=True,     # Include extracted images
    image_limit=10,                # Max images to return
    image_min_size=100             # Min image size to include
)
```

## **LiteLLM Proxy 使用方式** {#litellm-proxy-usage}

LiteLLM 提供與 Mistral API 相容的 `/ocr` 端點供 OCR 請求使用。

**設定**

將這段加入您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: mistral-ocr
    litellm_params:
      model: mistral/mistral-ocr-latest
      api_key: os.environ/MISTRAL_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**測試請求 — JSON 主體**

```bash
curl http://0.0.0.0:4000/v1/ocr \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral-ocr",
    "document": {
        "type": "document_url",
        "document_url": "https://arxiv.org/pdf/2201.04234"
    }
  }'
```

**測試請求 — multipart 檔案上傳**

直接使用 multipart form data 上傳檔案。您不需要自行將檔案編碼為 base64。

```bash
curl http://0.0.0.0:4000/v1/ocr \
  -H "Authorization: Bearer sk-1234" \
  -F "model=mistral-ocr" \
  -F "file=@/path/to/document.pdf"
```

您也可以將可選參數作為額外的表單欄位傳入：

```bash
curl http://0.0.0.0:4000/v1/ocr \
  -H "Authorization: Bearer sk-1234" \
  -F "model=mistral-ocr" \
  -F "file=@screenshot.png" \
  -F 'pages=[0,1,2]' \
  -F "include_image_base64=true"
```

## **請求/回應格式** {#requestresponse-format}

:::info

LiteLLM 遵循 **Mistral OCR API 規格**。 

請參閱 [官方 Mistral OCR 文件](https://docs.mistral.ai/capabilities/vision/#optical-character-recognition-ocr) 以取得完整 विवरण。

:::

### 範例請求 {#example-request}

```python
{
    "model": "mistral/mistral-ocr-latest",
    "document": {
        "type": "document_url",
        "document_url": "https://arxiv.org/pdf/2201.04234"
    },
    "pages": [0, 1, 2],              # Optional: specific pages to process
    "include_image_base64": True,     # Optional: include extracted images
    "image_limit": 10,                # Optional: max images to return
    "image_min_size": 100             # Optional: min image size in pixels
}
```

### 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | 是 | 要使用的 OCR 模型（例如：`"mistral/mistral-ocr-latest"`） |
| `document` | object | 是 | 要處理的文件。必須包含 `type` 及對應欄位 |
| `document.type` | string | 是 | `"document_url"` 適用於 PDF/文件，`"image_url"` 適用於圖片，或 `"file"` 適用於本機檔案 |
| `document.document_url` | string | 條件式 | 文件的 URL 或 data URI（若 `type` 為 `"document_url"`，則為必填） |
| `document.image_url` | string | 條件式 | 圖片的 URL 或 data URI（若 `type` 為 `"image_url"`，則為必填） |
| `document.file` | string/bytes/file | 條件式 | 檔案路徑、位元組，或類檔物件（若 `type` 為 `"file"`，則為必填） |
| `document.mime_type` | string | No | 檔案輸入的明確 MIME 類型（若未提供，則會從副檔名自動偵測） |
| `pages` | array | No | 要處理的特定頁面索引清單（從 0 開始） |
| `include_image_base64` | boolean | No | 是否將擷取出的圖片以 base64 字串包含在回應中 |
| `image_limit` | integer | No | 要回傳的圖片最大數量 |
| `image_min_size` | integer | No | 要包含的圖片最小尺寸（像素） |

#### 文件格式範例 {#document-format-examples}

**適用於 PDF 和文件（URL）：**
```json
{
  "type": "document_url",
  "document_url": "https://example.com/document.pdf"
}
```

**適用於圖片（URL）：**
```json
{
  "type": "image_url",
  "image_url": "https://example.com/image.png"
}
```

**適用於 base64 編碼內容：**
```json
{
  "type": "document_url",
  "document_url": "data:application/pdf;base64,JVBERi0xLjQKJ..."
}
```

**適用於本機檔案（SDK）：**
```python
{"type": "file", "file": "/path/to/document.pdf"}
{"type": "file", "file": open("image.png", "rb")}
{"type": "file", "file": pdf_bytes, "mime_type": "application/pdf"}
```

**適用於檔案上傳（Proxy — multipart form）：**
```bash
curl http://0.0.0.0:4000/v1/ocr \
  -H "Authorization: Bearer sk-1234" \
  -F "model=mistral-ocr" \
  -F "file=@document.pdf"
```

### 回應格式 {#response-format}

回應遵循 Mistral 的 OCR 格式，結構如下：

```json
{
  "pages": [
    {
      "index": 0,
      "markdown": "# Document Title\n\nExtracted text content...",
      "dimensions": {
        "dpi": 200,
        "height": 2200,
        "width": 1700
      },
      "images": [
        {
          "image_base64": "base64string...",
          "bbox": {
            "x": 100,
            "y": 200,
            "width": 300,
            "height": 400
          }
        }
      ]
    }
  ],
  "model": "mistral-ocr-2505-completion",
  "usage_info": {
    "pages_processed": 29,
    "doc_size_bytes": 3002783
  },
  "document_annotation": null,
  "object": "ocr"
}
```

#### 回應欄位 {#response-fields}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `pages` | array | 已處理頁面的清單，包含擷取內容 |
| `pages[].index` | integer | 頁碼（從 0 開始） |
| `pages[].markdown` | string | 以 Markdown 格式擷取的文字 |
| `pages[].dimensions` | object | 頁面尺寸（dpi、height、width，單位為像素） |
| `pages[].images` | array | 從頁面擷取的圖片（若 `include_image_base64=true`） |
| `model` | string | 用於 OCR 處理的模型 |
| `usage_info` | object | 處理統計資料（已處理頁數、文件大小） |
| `document_annotation` | object | 可選的文件層級註解 |
| `object` | string | OCR 回應一律為 `"ocr"` |

## **支援的提供者** {#supported-providers}

| 提供者    | 使用方式連結      |
|-------------|--------------------|
| Mistral AI  |   [使用方式](#quick-start)                 |
| Azure AI    |   [使用方式](../docs/providers/azure_ocr)                 |
| Vertex AI   |   [使用方式](../docs/providers/vertex_ocr)                 |
