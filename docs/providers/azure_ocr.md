# Azure AI OCR（Mistral） {#azure-ai-ocr-mistral}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure AI OCR 提供由 Mistral 支援的文件智慧功能，可從 PDF 和圖片中擷取文字 |
| LiteLLM 上的提供者路由 | `azure_ai/` |
| 支援的操作 | `/ocr` |
| 提供者文件連結 | [Azure AI ↗](https://ai.azure.com/)

使用 Azure AI 的 OCR 模型，透過 Mistral 從文件和圖片中擷取文字。

## 快速開始 {#quick-start}

### **LiteLLM SDK** {#litellm-sdk}

```python showLineNumbers title="SDK Usage"
import litellm
import os

# Set environment variables
os.environ["AZURE_AI_API_KEY"] = ""
os.environ["AZURE_AI_API_BASE"] = ""

# OCR with PDF URL
response = litellm.ocr(
    model="azure_ai/mistral-document-ai-2505",
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
  - model_name: azure-ocr
    litellm_params:
      model: azure_ai/mistral-document-ai-2505
      api_key: "os.environ/AZURE_AI_API_KEY"
      api_base: "os.environ/AZURE_AI_API_BASE"
    model_info:
      mode: ocr
```

## 文件類型 {#document-types}

Azure AI OCR 支援 PDF 和圖片。

### PDF 文件 {#pdf-documents}

```python showLineNumbers title="PDF OCR"
response = litellm.ocr(
    model="azure_ai/mistral-document-ai-2505",
    document={
        "type": "document_url",
        "document_url": "https://example.com/document.pdf"
    }
)
```

### 圖片文件 {#image-documents}

```python showLineNumbers title="Image OCR"
response = litellm.ocr(
    model="azure_ai/mistral-document-ai-2505",
    document={
        "type": "image_url",
        "image_url": "https://example.com/image.png"
    }
)
```

### Base64 編碼文件 {#base64-encoded-documents}

```python showLineNumbers title="Base64 PDF"
import base64

# Read and encode PDF
with open("document.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode()

response = litellm.ocr(
    model="azure_ai/mistral-document-ai-2505",
    document={
        "type": "document_url",
        "document_url": f"data:application/pdf;base64,{pdf_base64}"
    }
)
```

## 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Parameters"
response = litellm.ocr(
    model="azure_ai/mistral-document-ai-2505",
    document={                           # Required: Document to process
        "type": "document_url",
        "document_url": "https://..."
    },
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
    model="azure_ai/mistral-document-ai-2505",
    document={
        "type": "document_url",
        "document_url": "https://example.com/document.pdf"
    }
)
```

## 重要注意事項 {#important-notes}

:::info URL 轉換
Azure AI OCR 端點沒有網際網路存取權限。LiteLLM 會在將請求傳送至 Azure AI 之前，自動將公開 URL 轉換為 base64 data URI。
:::

## 支援的模型 {#supported-models}

- `mistral-document-ai-2505` - Azure AI 上最新的 Mistral OCR 模型

使用 Azure AI 提供者前綴：`azure_ai/<model-name>`
