import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI 嵌入 {#vertex-ai-embedding}

## 用法 - Embedding {#usage---embedding}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
from litellm import embedding
litellm.vertex_project = "hardy-device-38811" # Your Project ID
litellm.vertex_location = "us-central1"  # proj location

response = embedding(
    model="vertex_ai/textembedding-gecko",
    input=["good morning from litellm"],
)
print(response)
```
</TabItem>

<TabItem value="proxy" label="LiteLLM PROXY">

1. 將模型加入 config.yaml
```yaml
model_list:
  - model_name: snowflake-arctic-embed-m-long-1731622468876
    litellm_params:
      model: vertex_ai/<your-model-id>
      vertex_project: "adroit-crow-413218"
      vertex_location: "us-central1"
      vertex_credentials: adroit-crow-413218-a956eef1a2a8.json 

litellm_settings:
  drop_params: True
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 使用 OpenAI Python SDK、Langchain Python SDK 發出請求

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.embeddings.create(
    model="snowflake-arctic-embed-m-long-1731622468876", 
    input = ["good morning from litellm", "this is another item"],
)

print(response)
```


</TabItem>
</Tabs>

#### 支援的 Embedding 模型 {#supported-embedding-models}
[這裡](https://github.com/BerriAI/litellm/blob/57f37f743886a0249f630a6792d49dffc2c5d9b7/model_prices_and_context_window.json#L835) 列出的所有模型都受支援

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| text-embedding-004 | `embedding(model="vertex_ai/text-embedding-004", input)` | 
| text-multilingual-embedding-002 | `embedding(model="vertex_ai/text-multilingual-embedding-002", input)` | 
| textembedding-gecko | `embedding(model="vertex_ai/textembedding-gecko", input)` | 
| textembedding-gecko-multilingual | `embedding(model="vertex_ai/textembedding-gecko-multilingual", input)` | 
| textembedding-gecko-multilingual@001 | `embedding(model="vertex_ai/textembedding-gecko-multilingual@001", input)` | 
| textembedding-gecko@001 | `embedding(model="vertex_ai/textembedding-gecko@001", input)` | 
| textembedding-gecko@003 | `embedding(model="vertex_ai/textembedding-gecko@003", input)` | 
| text-embedding-preview-0409 | `embedding(model="vertex_ai/text-embedding-preview-0409", input)` |
| text-multilingual-embedding-preview-0409 | `embedding(model="vertex_ai/text-multilingual-embedding-preview-0409", input)` | 
| gemini-embedding-2-preview | `embedding(model="vertex_ai/gemini-embedding-2-preview", input)` | [多模態文件](#gemini-embedding-2-preview-multimodal) |
| gemini-embedding-2 *(GA)* | `embedding(model="vertex_ai/gemini-embedding-2", input)` | [多模態文件](#gemini-embedding-2-preview-multimodal) · [GA 附註](/blog/gemini_embedding_2_ga) |
| Fine-tuned OR Custom Embedding models | `embedding(model="vertex_ai/<your-model-id>", input)` | 

### 支援的 OpenAI（Unified）參數 {#supported-openai-unified-params}

| [參數](../embedding/supported_embedding.md#input-params-for-litellmembedding) | 型別 | [vertex 對應項目](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api) |
|-------|-------------|--------------------|
| `input` | **string or List[string]** | `instances` |
| `dimensions` | **int** | `output_dimensionality` |
| `input_type` | **Literal["RETRIEVAL_QUERY","RETRIEVAL_DOCUMENT", "SEMANTIC_SIMILARITY", "CLASSIFICATION", "CLUSTERING", "QUESTION_ANSWERING", "FACT_VERIFICATION"]** | `task_type` |

#### 使用 OpenAI（Unified）參數 {#usage-with-openai-unified-params}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.embedding(
    model="vertex_ai/text-embedding-004",
    input=["good morning from litellm", "gm"]
    input_type = "RETRIEVAL_DOCUMENT",
    dimensions=1,
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM PROXY">

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.embeddings.create(
    model="text-embedding-004", 
    input = ["good morning from litellm", "gm"],
    dimensions=1,
    extra_body = {
        "input_type": "RETRIEVAL_QUERY",
    }
)

print(response)
```
</TabItem>
</Tabs>

### 支援的 Vertex 特定參數 {#supported-vertex-specific-params}

| 參數 | 型別 |
|-------|-------------|
| `auto_truncate` | **bool** |
| `task_type` | **Literal["RETRIEVAL_QUERY","RETRIEVAL_DOCUMENT", "SEMANTIC_SIMILARITY", "CLASSIFICATION", "CLUSTERING", "QUESTION_ANSWERING", "FACT_VERIFICATION"]** |
| `title` | **str** |

#### 使用 Vertex 特定參數（使用 `task_type` 和 `title`） {#usage-with-vertex-specific-params--use-task_type-and-title}

您可以將任何 Vertex 特定參數傳遞給 embedding 模型。只要像這樣將它們傳遞給 embedding 函式：

[相關的 Vertex AI 文件，內含所有 embedding 參數](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api#request_body)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.embedding(
    model="vertex_ai/text-embedding-004",
    input=["good morning from litellm", "gm"]
    task_type = "RETRIEVAL_DOCUMENT",
    title = "test",
    dimensions=1,
    auto_truncate=True,
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM PROXY">

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.embeddings.create(
    model="text-embedding-004", 
    input = ["good morning from litellm", "gm"],
    dimensions=1,
    extra_body = {
        "task_type": "RETRIEVAL_QUERY",
        "auto_truncate": True,
        "title": "test",
    }
)

print(response)
```
</TabItem>
</Tabs>

## **BGE 嵌入** {#bge-embeddings}

使用部署在 Vertex AI 上的 BGE（Baidu General Embedding）模型。

### 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Using BGE on Vertex AI"
import litellm

response = litellm.embedding(
    model="vertex_ai/bge/<your-endpoint-id>",
    input=["Hello", "World"],
    vertex_project="your-project-id",
    vertex_location="your-location"
)

print(response)
```

</TabItem>

<TabItem value="proxy" label="LiteLLM PROXY">

1. 將模型加入 config.yaml
```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: bge-embedding
    litellm_params:
      model: vertex_ai/bge/<your-endpoint-id>
      vertex_project: "your-project-id"
      vertex_location: "us-central1"
      vertex_credentials: your-credentials.json

litellm_settings:
  drop_params: True
```

2. 啟動 Proxy 

```bash
$ litellm --config /path/to/config.yaml
```

3. 使用 OpenAI Python SDK 發出請求

```python showLineNumbers title="Making requests to BGE"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.embeddings.create(
    model="bge-embedding",
    input=["good morning from litellm", "this is another item"]
)

print(response)
```

使用 Private Service Connect（PSC）端點

```yaml showLineNumbers title="config.yaml (PSC)"
model_list:
  - model_name: bge-small-en-v1.5
    litellm_params:
      model: vertex_ai/bge/1234567890 
      api_base: http://10.96.32.8  # Your PSC IP
      vertex_project: my-project-id  #optional
      vertex_location: us-central1 #optional
```

</TabItem>
</Tabs>

## **多模態 Embeddings** {#multi-modal-embeddings}

### Gemini Embedding 2 預覽（多模態） {#gemini-embedding-2-preview-multimodal}

`gemini-embedding-2-preview` 支援 **統一多模態 embeddings**——可在單一請求中處理文字、圖片、音訊、影片和 PDF。詳情請參閱 [部落格文章](/blog/gemini_embedding_2_multimodal)。GA 模型 ID `gemini-embedding-2` 提供相同行為——可在下方任何範例中直接替換模型名稱。請參閱 [GA 部落格](/blog/gemini_embedding_2_ga) 以了解 cost-map 涵蓋範圍與價格說明。

:::warning 回應格式 — Vertex 只會回傳一個合併向量

Vertex AI 的 Gemini embedding 端點只提供單一內容 `embedContent`（沒有 `batchEmbedContents`），因此在 `input=[...]` 中傳入 `N` 個項目時，會回傳 **1 個統一 embedding**，將所有部分融合在一起，而不是 N 個獨立向量。若要每個項目各取得一個向量，請對每個輸入各呼叫一次 `embedding(...)`。

這與 Gemini API 路徑（`gemini/gemini-embedding-2-preview`）不同，後者會針對每個輸入元素回傳一個 embedding（OpenAI 相容）。請參閱 [Gemini embedding 文件](../embedding/supported_embedding#gemini-embedding-2-preview-multimodal)。

:::

**輸入格式：**
- **Data URI：** `data:image/png;base64,<encoded_data>`
- **GCS URL：** `gs://bucket/path/to/file.png`（MIME 類型會根據副檔名推斷）

**支援的 MIME 類型：** `image/png`、`image/jpeg`、`audio/mpeg`、`audio/wav`、`video/mp4`、`video/quicktime`、`application/pdf`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
from litellm import embedding

litellm.vertex_project = "your-project-id"
litellm.vertex_location = "us-central1"

# Text + Image (GCS URL)
response = embedding(
    model="vertex_ai/gemini-embedding-2-preview",
    input=[
        "Describe this image",
        "gs://my-bucket/images/photo.png"
    ],
)

# Text + Image (base64)
response = embedding(
    model="vertex_ai/gemini-embedding-2-preview",
    input=[
        "The food was delicious",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    ],
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM PROXY">

```yaml
model_list:
  - model_name: vertex-gemini-embedding-2-preview
    litellm_params:
      model: vertex_ai/gemini-embedding-2-preview
      vertex_project: "your-project-id"
      vertex_location: "us-central1"
```

```bash
curl -X POST http://localhost:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-gemini-embedding-2-preview",
    "input": ["Describe this", "gs://bucket/image.png"]
  }'
```

</TabItem>
</Tabs>

### multimodalembedding@001（舊版） {#multimodalembedding001-legacy}

已知限制：
- 每個請求只支援 1 張圖片 / 影片 / 圖片
- 僅支援 GCS 或 base64 編碼的圖片 / 影片

### 用法 {#usage-1}

<Tabs>
<TabItem value="sdk" label="SDK">

使用 GCS 圖片

```python
response = await litellm.aembedding(
    model="vertex_ai/multimodalembedding@001",
    input="gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png" # will be sent as a gcs image
)
```

使用 base 64 編碼的圖片

```python
response = await litellm.aembedding(
    model="vertex_ai/multimodalembedding@001",
    input="data:image/jpeg;base64,..." # will be sent as a base64 encoded image
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM PROXY (Unified Endpoint)">

1. 將模型加入 config.yaml
```yaml
model_list:
  - model_name: multimodalembedding@001
    litellm_params:
      model: vertex_ai/multimodalembedding@001
      vertex_project: "adroit-crow-413218"
      vertex_location: "us-central1"
      vertex_credentials: adroit-crow-413218-a956eef1a2a8.json 

litellm_settings:
  drop_params: True
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 使用 OpenAI Python SDK、Langchain Python SDK 發出請求

<Tabs>

<TabItem value="OpenAI SDK" label="OpenAI SDK">

使用 GCS 圖片 / 影片 URI 的請求

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# # request sent to model set on litellm proxy, `litellm --model`
response = client.embeddings.create(
    model="multimodalembedding@001", 
    input = "gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png",
)

print(response)
```

使用 base64 編碼圖片的請求

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# # request sent to model set on litellm proxy, `litellm --model`
response = client.embeddings.create(
    model="multimodalembedding@001", 
    input = "data:image/jpeg;base64,...",
)

print(response)
```

</TabItem>

<TabItem value="langchain" label="Langchain">

使用 GCS 圖片 / 影片 URI 的請求
```python
from langchain_openai import OpenAIEmbeddings

embeddings_models = "multimodalembedding@001"

embeddings = OpenAIEmbeddings(
    model="multimodalembedding@001",
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",  # type: ignore
)


query_result = embeddings.embed_query(
    "gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png"
)
print(query_result)

```

使用 base64 編碼圖片的請求

```python
from langchain_openai import OpenAIEmbeddings

embeddings_models = "multimodalembedding@001"

embeddings = OpenAIEmbeddings(
    model="multimodalembedding@001",
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",  # type: ignore
)


query_result = embeddings.embed_query(
    "data:image/jpeg;base64,..."
)
print(query_result)

```

</TabItem>

</Tabs>
</TabItem>

<TabItem value="proxy-vtx" label="LiteLLM PROXY (Vertex SDK)">

1. 將模型加入 config.yaml
```yaml
default_vertex_config:
  vertex_project: "adroit-crow-413218"
  vertex_location: "us-central1"
  vertex_credentials: adroit-crow-413218-a956eef1a2a8.json 
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 使用 OpenAI Python SDK 發出請求

```python
import vertexai

from vertexai.vision_models import Image, MultiModalEmbeddingModel, Video
from vertexai.vision_models import VideoSegmentConfig
from google.auth.credentials import Credentials


LITELLM_PROXY_API_KEY = "sk-1234"
LITELLM_PROXY_BASE = "http://0.0.0.0:4000/vertex-ai"

import datetime

class CredentialsWrapper(Credentials):
    def __init__(self, token=None):
        super().__init__()
        self.token = token
        self.expiry = None  # or set to a future date if needed
        
    def refresh(self, request):
        pass
    
    def apply(self, headers, token=None):
        headers['Authorization'] = f'Bearer {self.token}'

    @property
    def expired(self):
        return False  # Always consider the token as non-expired

    @property
    def valid(self):
        return True  # Always consider the credentials as valid

credentials = CredentialsWrapper(token=LITELLM_PROXY_API_KEY)

vertexai.init(
    project="adroit-crow-413218",
    location="us-central1",
    api_endpoint=LITELLM_PROXY_BASE,
    credentials = credentials,
    api_transport="rest",
   
)

model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding")
image = Image.load_from_file(
    "gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png"
)

embeddings = model.get_embeddings(
    image=image,
    contextual_text="Colosseum",
    dimension=1408,
)
print(f"Image Embedding: {embeddings.image_embedding}")
print(f"Text Embedding: {embeddings.text_embedding}")
```

</TabItem>
</Tabs>

### 文字 + 圖片 + 影片 Embeddings {#text--image--video-embeddings}

<Tabs>
<TabItem value="sdk" label="SDK">

文字 + 圖片 

```python
response = await litellm.aembedding(
    model="vertex_ai/multimodalembedding@001",
    input=["hey", "gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png"] # will be sent as a gcs image
)
```

文字 + 影片 

```python
response = await litellm.aembedding(
    model="vertex_ai/multimodalembedding@001",
    input=["hey", "gs://my-bucket/embeddings/supermarket-video.mp4"] # will be sent as a gcs image
)
```

圖片 + 影片 

```python
response = await litellm.aembedding(
    model="vertex_ai/multimodalembedding@001",
    input=["gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png", "gs://my-bucket/embeddings/supermarket-video.mp4"] # will be sent as a gcs image
)
```


</TabItem>
<TabItem value="proxy" label="LiteLLM PROXY (Unified Endpoint)">

1. 將模型加入 config.yaml
```yaml
model_list:
  - model_name: multimodalembedding@001
    litellm_params:
      model: vertex_ai/multimodalembedding@001
      vertex_project: "adroit-crow-413218"
      vertex_location: "us-central1"
      vertex_credentials: adroit-crow-413218-a956eef1a2a8.json 

litellm_settings:
  drop_params: True
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 使用 OpenAI Python SDK、Langchain Python SDK 發出請求

文字 + 圖片 

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# # request sent to model set on litellm proxy, `litellm --model`
response = client.embeddings.create(
    model="multimodalembedding@001", 
    input = ["hey", "gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png"],
)

print(response)
```

文字 + 影片 
```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# # request sent to model set on litellm proxy, `litellm --model`
response = client.embeddings.create(
    model="multimodalembedding@001", 
    input = ["hey", "gs://my-bucket/embeddings/supermarket-video.mp4"],
)

print(response)
```

圖片 + 影片 
```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# # request sent to model set on litellm proxy, `litellm --model`
response = client.embeddings.create(
    model="multimodalembedding@001", 
    input = ["gs://cloud-samples-data/vertex-ai/llm/prompts/landmark1.png", "gs://my-bucket/embeddings/supermarket-video.mp4"],
)

print(response)
```

</TabItem>
</Tabs>
