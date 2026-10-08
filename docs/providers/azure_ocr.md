# Azure AI OCR (Mistral, Cohere Parse) {#azure-ai-ocr-mistral-cohere-parse}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure AI OCR 透過 Mistral 和 Cohere Parse 提供文件智慧功能，可從 PDF 和影像中擷取文字 |
| LiteLLM 上的提供者路由 | `azure_ai/` |
| 支援的操作 | `/ocr` |
| 提供者文件連結 | [Azure AI ↗](https://ai.azure.com/)

使用 Azure AI 的 OCR 模型從文件和影像擷取文字，由 Mistral 提供支援。Cohere Parse 部署已在[下方](#cohere-parse)說明。

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
    print(page.markdown)
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
    print(f"Page {page.index}:")
    print(page.markdown)
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

:::info[URL 轉換]
Azure AI OCR 端點沒有網際網路存取權限。LiteLLM 會在將請求傳送至 Azure AI 之前，自動將公開 URL 轉換為 base64 data URI。
:::

## Cohere Parse {#cohere-parse}

Azure AI Foundry 也透過相同的 `/ocr` 端點提供 [Cohere Parse](https://ai.azure.com/catalog/models/Cohere-parse-v5)。請使用 `azure_ai/<deployment name>`：名稱同時包含 `cohere` 和 `parse` 的部署（目錄的預設名稱 `Cohere-parse-v5` 就符合）會被送往您 Foundry 資源上的 Cohere Parse API，位於 `{api_base}/providers/cohere/v2/parse`。其他名稱仍會路由至 Mistral OCR，因此如果您重新命名，請將 `cohere` 和 `parse` 保留在部署名稱中。

Parse 只接受 `image_url` 文件、影像 URL 或 base64 `data:image/...` URI。PDF 和 `document_url` 輸入會在任何內容送到 Azure 之前以 400 拒絕。Foundry 無法擷取外部 URL，因此 LiteLLM 會下載遠端影像並將其以 data URI 內嵌送出，這與它對上述 Mistral 模型套用的轉換相同。

### **LiteLLM SDK** {#litellm-sdk-1}

```python showLineNumbers title="Cohere Parse on Azure AI"
import litellm
import os

os.environ["AZURE_AI_API_KEY"] = ""
os.environ["AZURE_AI_API_BASE"] = "https://<resource>.services.ai.azure.com"

response = litellm.ocr(
    model="azure_ai/Cohere-parse-v5",
    document={
        "type": "image_url",
        "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png",
    },
    output_format="markdown",
)

for page in response.pages:
    print(page.markdown)
print(response.usage_info.pages_processed)
```

### **LiteLLM PROXY** {#litellm-proxy-1}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: azure-cohere-parse
    litellm_params:
      model: azure_ai/Cohere-parse-v5
      api_key: "os.environ/AZURE_AI_API_KEY"
      api_base: "os.environ/AZURE_AI_API_BASE"
```

```bash showLineNumbers title="Test request"
curl http://0.0.0.0:4000/v1/ocr \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-cohere-parse",
    "document": {
      "type": "image_url",
      "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
    }
  }'
```

`output_format` 接受 `markdown`（預設）或 `blocks`，而 `req_format: native` 會回傳 Cohere 自己的回應主體，而不是 LiteLLM OCR 的格式。成本追蹤會依模型成本對照表中的每頁價格向 `usage_info.pages_processed` 計費。

模型成本對照表將 `azure_ai/Cohere-parse-v5` 定價為 Cohere 公布的每 1,000 頁 1.50 美元，這也是 Foundry 目錄為此模型連結的價格。

健康檢查（`/health` 和 Admin UI 的 Test Connection 按鈕）會向 Parse 傳送一個小型 PNG，而不是 Mistral OCR 使用的 PDF。每次探測都是一次實際的單頁 Parse 請求，因此每次檢查會針對每個部署計費一頁。`ocr` 探測模式與每頁價格都會在模型成本對照表中以 `Cohere-parse-v5` 查找；任何其他名稱下的部署，其 `model_list` 項目都需要 `model_info: {mode: ocr, base_model: azure_ai/Cohere-parse-v5}`，這與每個其他 Azure 模型使用的 `mode` 和 `base_model` 慣例相同，因此健康檢查會將其視為 OCR 進行探測，而費用追蹤則會找到 Parse 價格，而不是記錄 $0。

## 支援的模型 {#supported-models}

- `mistral-document-ai-2505` - Azure AI 上最新的 Mistral OCR 模型
- `Cohere-parse-v5` - Cohere Parse，僅限影像文件

使用 Azure AI 提供者前綴：`azure_ai/<model-name>`
