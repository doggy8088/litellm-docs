# Vertex AI OCR {#vertex-ai-ocr}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Vertex AI OCR 由 Mistral 驅動，提供文件智慧能力，可從 PDF 與圖片中擷取文字 |
| LiteLLM 上的提供者路由 | `vertex_ai/` |
| 支援的操作 | `/ocr` |
| 提供者文件連結 | [Vertex AI ↗](https://cloud.google.com/vertex-ai)

使用由 Mistral 提供支援的 Vertex AI OCR 模型，從文件與圖片中擷取文字。

## 快速開始 {#quick-start}

### **LiteLLM SDK** {#litellm-sdk}

```python showLineNumbers title="SDK Usage"
import litellm
import os

# Set environment variables
os.environ["VERTEXAI_PROJECT"] = "your-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

# OCR with PDF URL
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={
        "type": "document_url",
        "document_url": "https://example.com/document.pdf"
    }
)

# Access extracted text
for page in response.pages:
    print(page.text)
```

### **LiteLLM PROXY** {#litellm-proxy}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: vertex-ocr
    litellm_params:
      model: vertex_ai/mistral-ocr-2505
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: os.environ/VERTEXAI_LOCATION
      vertex_credentials: path/to/service-account.json  # Optional
    model_info:
      mode: ocr
```

**啟動 Proxy**
```bash
litellm --config proxy_config.yaml
```

**透過 Proxy 呼叫 OCR**
```bash showLineNumbers title="cURL Request"
curl -X POST http://localhost:4000/ocr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "vertex-ocr",
    "document": {
      "type": "document_url",
      "document_url": "https://arxiv.org/pdf/2201.04234"
    }
  }'
```

## 驗證 {#authentication}

Vertex AI OCR 支援多種驗證方式：

### 服務帳戶 JSON {#service-account-json}

```python showLineNumbers title="Service Account Auth"
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={"type": "document_url", "document_url": "https://..."},
    vertex_project="your-project-id",
    vertex_location="us-central1",
    vertex_credentials="path/to/service-account.json"
)
```

### 應用程式預設憑證 {#application-default-credentials}

```python showLineNumbers title="Default Credentials"
# Relies on GOOGLE_APPLICATION_CREDENTIALS environment variable
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={"type": "document_url", "document_url": "https://..."},
    vertex_project="your-project-id",
    vertex_location="us-central1"
)
```

## 文件類型 {#document-types}

Vertex AI OCR 同時支援 PDF 與圖片。

### PDF 文件 {#pdf-documents}

```python showLineNumbers title="PDF OCR"
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={
        "type": "document_url",
        "document_url": "https://example.com/document.pdf"
    },
    vertex_project="your-project-id",
    vertex_location="us-central1"
)
```

### 圖片文件 {#image-documents}

```python showLineNumbers title="Image OCR"
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={
        "type": "image_url",
        "image_url": "https://example.com/image.png"
    },
    vertex_project="your-project-id",
    vertex_location="us-central1"
)
```

### Base64 編碼文件 {#base64-encoded-documents}

```python showLineNumbers title="Base64 PDF"
import base64

# Read and encode PDF
with open("document.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode()

response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505", # This doesn't work for deepseek
    document={
        "type": "document_url",
        "document_url": f"data:application/pdf;base64,{pdf_base64}"
    },
    vertex_project="your-project-id",
    vertex_location="us-central1"
)
```

## 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Parameters"
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={                           # Required: Document to process
        "type": "document_url",
        "document_url": "https://..."
    },
    vertex_project="your-project-id",   # Required: GCP project ID
    vertex_location="us-central1",       # Optional: Defaults to us-central1
    vertex_credentials="path/to/key.json", # Optional: Service account key
    include_image_base64=True,           # Optional: Include base64 images
    pages=[0, 1, 2],                     # Optional: Specific pages to process
    image_limit=10                       # Optional: Limit number of images
)
```

## 回應格式 {#response-format}

```python showLineNumbers title="Response Structure"
# Response has the following structure
response.pages          # List of pages with extracted text
response.model          # Model used
response.object         # "ocr"
response.usage_info     # Token usage information

# Access page content
for page in response.pages:
    print(f"Page {page.page_number}:")
    print(page.text)
```

## 非同步支援 {#async-support}

```python showLineNumbers title="Async Usage"
import litellm

response = await litellm.aocr(
    model="vertex_ai/mistral-ocr-2505",
    document={
        "type": "document_url",
        "document_url": "https://example.com/document.pdf"
    },
    vertex_project="your-project-id",
    vertex_location="us-central1"
)
```

## 成本追蹤 {#cost-tracking}

LiteLLM 會自動追蹤 Vertex AI OCR 的成本：

- **每頁成本**：$0.0005（以每 1,000 頁 $1.50 計算）

```python showLineNumbers title="View Cost"
response = litellm.ocr(
    model="vertex_ai/mistral-ocr-2505",
    document={"type": "document_url", "document_url": "https://..."},
    vertex_project="your-project-id"
)

# Access cost information
print(f"Cost: ${response._hidden_params.get('response_cost', 0)}")
```

## 重要注意事項 {#important-notes}

:::info URL 轉換
Vertex AI Mistral OCR 端點沒有網際網路存取。LiteLLM 會在將請求傳送至 Vertex AI 之前，自動將公開 URL 轉換為 base64 data URI。
:::

:::tip 區域可用性
Mistral OCR 可在多個區域使用。指定 `vertex_location` 以使用更接近您資料的區域：
- `us-central1`（預設）
- `europe-west1`
- `asia-southeast1`

Deepseek OCR 僅可在 global 區域使用。
:::

## 支援的模型 {#supported-models}

- `mistral-ocr-2505` - Vertex AI 上最新的 Mistral OCR 模型
- `deepseek-ocr-maas` - Vertex AI 上最新的 Deepseek OCR 模型

使用 Vertex AI 提供者前綴：`vertex_ai/<model-name>`
