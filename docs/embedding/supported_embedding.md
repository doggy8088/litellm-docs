import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /embeddings {#embeddings}

## 快速開始 {#quick-start}
```python
from litellm import embedding
import os
os.environ['OPENAI_API_KEY'] = ""
response = embedding(model='text-embedding-ada-002', input=["good morning from litellm"])
```

## 非同步用法 - `aembedding()` {#async-usage---aembedding}

LiteLLM 提供 `embedding` 函式的非同步版本，稱為 `aembedding`：

```python
from litellm import aembedding
import asyncio

async def get_embedding():
    response = await aembedding(
        model='text-embedding-ada-002',
        input=["good morning from litellm"]
    )
    return response

response = asyncio.run(get_embedding())
print(response)
```

## Proxy 用法 {#proxy-usage}

**注意**
對於 `vertex_ai`，
```bash
export GOOGLE_APPLICATION_CREDENTIALS="absolute/path/to/service_account.json"
```

### 將模型加入設定 {#add-model-to-config}

```yaml
model_list:
- model_name: textembedding-gecko
  litellm_params:
    model: vertex_ai/textembedding-gecko

general_settings:
  master_key: sk-1234
```

### 啟動 proxy {#start-proxy}

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

### 測試 {#test}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl --location 'http://0.0.0.0:4000/embeddings' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"input": ["Academia.edu uses"], "model": "textembedding-gecko", "encoding_format": "base64"}'
```

</TabItem>
<TabItem value="openai" label="OpenAI (python)">

```python
from openai import OpenAI
client = OpenAI(
  api_key="sk-1234",
  base_url="http://0.0.0.0:4000"
)

client.embeddings.create(
  model="textembedding-gecko",
  input="The food was delicious and the waiter...",
  encoding_format="float"
)
```
</TabItem>
<TabItem value="langchain" label="Langchain Embeddings">

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="textembedding-gecko", openai_api_base="http://0.0.0.0:4000", openai_api_key="sk-1234")

text = "This is a test document."

query_result = embeddings.embed_query(text)

print(f"VERTEX AI EMBEDDINGS")
print(query_result[:5])
```
</TabItem>
</Tabs>

## 圖片嵌入 {#image-embeddings}

對於支援影像嵌入的模型，您可以將 base64 編碼的影像字串傳入 `input` 參數。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os

# set your api key
os.environ["COHERE_API_KEY"] = ""

response = embedding(model="cohere/embed-english-v3.0", input=["<base64 encoded image>"])
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml 

```yaml
model_list:
  - model_name: cohere-embed
    litellm_params:
      model: cohere/embed-english-v3.0
      api_key: os.environ/COHERE_API_KEY
```


2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/v1/embeddings' \
-H 'Authorization: Bearer sk-54d77cd67b9febbb' \
-H 'Content-Type: application/json' \
-d '{
  "model": "cohere/embed-english-v3.0",
  "input": ["<base64 encoded image>"]
}'
```
</TabItem>
</Tabs>

## `litellm.embedding()` 的輸入參數 {#input-params-for-litellmembedding}

:::info

任何非 openai 參數都會被視為特定提供者的參數，並以 kwargs 的形式在請求本文中傳送給提供者。

[**查看保留參數**](https://github.com/BerriAI/litellm/blob/2f5f85cb52f36448d1f8bbfbd3b8af8167d0c4c8/litellm/main.py#L3130)

[**查看範例**](#example)
:::

### 必要欄位 {#required-fields}

- `model`: *字串* - 要使用的模型 ID。 `model='text-embedding-ada-002'`

- `input`: *字串或陣列* - 要嵌入的輸入文字，編碼為字串或 token 陣列。若要在單一請求中嵌入多個輸入，請傳入字串陣列或 token 陣列的陣列。輸入不得超過該模型的最大輸入 token 數（text-embedding-ada-002 為 8192 tokens），不得為空字串，且任何陣列必須為 2048 維度或以下。 
```python
input=["good morning from litellm"]
```

### LiteLLM 選用欄位 {#optional-litellm-fields}

- `user`: *字串（可選）* 代表您終端使用者的唯一識別碼， 

- `dimensions`: *整數（可選）* 產生的輸出嵌入應具有的維度數。僅支援 OpenAI/Azure text-embedding-3 及更新的模型。

- `encoding_format`: *字串（可選）* 回傳嵌入的格式。可以是 `"float"` 或 `"base64"`。預設為 `encoding_format="float"`

- `timeout`: *整數（可選）* - 等待 API 回應的最長時間（以秒為單位）。預設為 600 秒（10 分鐘）。

- `api_base`: *字串（可選）* - 您想用來呼叫模型的 API 端點

- `api_version`: *string (optional)* -（Azure 特定）呼叫的 api version

- `api_key`: *string (optional)* - 用於驗證與授權請求的 API 金鑰。若未提供，則使用預設 API 金鑰。

- `api_type`: *string (optional)* - 要使用的 API 類型。

### `litellm.embedding()` 的輸出 {#output-from-litellmembedding}

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.0022326677571982145,
        0.010749882087111473,
        ...
        ...
        ...
   
      ]
    }
  ],
  "model": "text-embedding-ada-002-v2",
  "usage": {
    "prompt_tokens": 10,
    "total_tokens": 10
  }
}
```

## OpenAI 嵌入模型 {#openai-embedding-models}

### 用法 {#usage}
```python
from litellm import embedding
import os
os.environ['OPENAI_API_KEY'] = ""
response = embedding(
    model="text-embedding-3-small",
    input=["good morning from litellm", "this is another item"],
    metadata={"anything": "good day"},
    dimensions=5 # Only supported in text-embedding-3 and later models.
)
```

| 模型名稱           | 函式呼叫                               | 必要 OS 變數                |
|----------------------|---------------------------------------------|--------------------------------------|
| text-embedding-3-small | `embedding('text-embedding-3-small', input)` | `os.environ['OPENAI_API_KEY']`       |
| text-embedding-3-large | `embedding('text-embedding-3-large', input)` | `os.environ['OPENAI_API_KEY']`       |
| text-embedding-ada-002 | `embedding('text-embedding-ada-002', input)` | `os.environ['OPENAI_API_KEY']`       |

## OpenAI 相容的嵌入模型 {#openai-compatible-embedding-models}
用於呼叫 OpenAI Compatible Servers 上的 `/embedding` 端點，例如 https://github.com/xorbitsai/inference

**注意：將 `openai/` 前綴加到模型名稱，這樣 litellm 才知道要路由到 OpenAI**

### 用法 {#usage-1}
```python
from litellm import embedding
response = embedding(
  model = "openai/<your-llm-name>",     # add `openai/` prefix to model so litellm knows to route to OpenAI
  api_base="http://0.0.0.0:4000/"       # set API Base of your Custom OpenAI Endpoint
  input=["good morning from litellm"]
)
```

## Bedrock 嵌入 {#bedrock-embedding}

### API 金鑰 {#api-keys}
這可以設為環境變數，或作為 **litellm.embedding() 的參數** 傳入
```python
import os
os.environ["AWS_ACCESS_KEY_ID"] = ""  # Access key
os.environ["AWS_SECRET_ACCESS_KEY"] = "" # Secret access key
os.environ["AWS_REGION_NAME"] = "" # us-east-1, us-east-2, us-west-1, us-west-2
```

### 用法 {#usage-2}
```python
from litellm import embedding
response = embedding(
    model="amazon.titan-embed-text-v1",
    input=["good morning from litellm"],
)
print(response)
```

| 模型名稱           | 函式呼叫                               |
|----------------------|---------------------------------------------|
| Amazon Nova 多模態嵌入 | `embedding(model="bedrock/amazon.nova-2-multimodal-embeddings-v1:0", input=input)` | [Nova 文件](../providers/bedrock_embedding#amazon-nova-multimodal-embeddings) |
| Amazon Nova（非同步） | `embedding(model="bedrock/async_invoke/amazon.nova-2-multimodal-embeddings-v1:0", input=input, input_type="text", output_s3_uri="s3://bucket/")` | [Nova 非同步文件](../providers/bedrock_embedding#asynchronous-embeddings-with-segmentation) |
| Titan Embeddings - G1 | `embedding(model="amazon.titan-embed-text-v1", input=input)` |
| Cohere Embeddings - English | `embedding(model="cohere.embed-english-v3", input=input)` |
| Cohere Embeddings - Multilingual | `embedding(model="cohere.embed-multilingual-v3", input=input)` |
| TwelveLabs Marengo（非同步） | `embedding(model="bedrock/async_invoke/us.twelvelabs.marengo-embed-2-7-v1:0", input=input, input_type="text")` | [非同步 Invoke 文件](../providers/bedrock_embedding#async-invoke-embedding) |

## TwelveLabs Bedrock 嵌入模型 {#twelvelabs-bedrock-embedding-models}

TwelveLabs Marengo 模型支援多模態嵌入（文字、圖片、影片、音訊），並需要 `input_type` 參數來指定輸入格式。

### 用法 {#usage-3}

```python
from litellm import embedding
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = "us-east-1"

# Text embedding
response = embedding(
    model="bedrock/us.twelvelabs.marengo-embed-2-7-v1:0",
    input=["Hello world from LiteLLM!"],
    input_type="text"  # Required parameter
)

# Image embedding (base64)
response = embedding(
    model="bedrock/async_invoke/us.twelvelabs.marengo-embed-2-7-v1:0",
    input=["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."],
    input_type="image",  # Required parameter
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)

# Video embedding (S3 URL)
response = embedding(
    model="bedrock/async_invoke/us.twelvelabs.marengo-embed-2-7-v1:0",
    input=["s3://your-bucket/video.mp4"],
    input_type="video",  # Required parameter
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)
```

### 必要參數 {#required-parameters}

| 參數 | 說明 | 值 |
|-----------|-------------|--------|
| `input_type` | 輸入內容類型 | `"text"`, `"image"`, `"video"`, `"audio"` |

### 支援的模型 {#supported-models}

| 模型名稱 | 函式呼叫 | 備註 |
|------------|---------------|-------|
| TwelveLabs Marengo 2.7 (Sync) | `embedding(model="bedrock/us.twelvelabs.marengo-embed-2-7-v1:0", input=input, input_type="text")` | 僅支援文字嵌入 |
| TwelveLabs Marengo 2.7 (Async) | `embedding(model="bedrock/async_invoke/us.twelvelabs.marengo-embed-2-7-v1:0", input=input, input_type="text/image/video/audio")` | 支援所有輸入類型，需要 `output_s3_uri` |

## Cohere 嵌入模型 {#cohere-embedding-models}
https://docs.cohere.com/reference/embed

### 用法 {#usage-4}
```python
from litellm import embedding
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere call
response = embedding(
    model="embed-english-v3.0", 
    input=["good morning from litellm", "this is another item"], 
    input_type="search_document" # optional param for v3 llms
)
```
| 模型名稱               | 函式呼叫                                                |
|--------------------------|--------------------------------------------------------------|
| embed-english-v3.0       | `embedding(model="embed-english-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-light-v3.0 | `embedding(model="embed-english-light-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-v3.0  | `embedding(model="embed-multilingual-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-light-v3.0 | `embedding(model="embed-multilingual-light-v3.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-v2.0       | `embedding(model="embed-english-v2.0", input=["good morning from litellm", "this is another item"])` |
| embed-english-light-v2.0 | `embedding(model="embed-english-light-v2.0", input=["good morning from litellm", "this is another item"])` |
| embed-multilingual-v2.0  | `embedding(model="embed-multilingual-v2.0", input=["good morning from litellm", "this is another item"])` |

## NVIDIA NIM 嵌入模型 {#nvidia-nim-embedding-models}

### API 金鑰 {#api-keys-1}
這可以設定為環境變數，或作為 **參數傳遞給 litellm.embedding()**
```python
import os
os.environ["NVIDIA_NIM_API_KEY"] = ""  # api key
os.environ["NVIDIA_NIM_API_BASE"] = "" # nim endpoint url
```

### 用法 {#usage-5}
```python
from litellm import embedding
import os
os.environ['NVIDIA_NIM_API_KEY'] = ""
response = embedding(
    model='nvidia_nim/<model_name>', 
    input=["good morning from litellm"],
    input_type="query"
)
```
## `input_type` 用於嵌入模型的參數 {#input_type-parameter-for-embedding-models}

某些嵌入模型，例如 `nvidia/embed-qa-4` 和 E5 系列，具有**雙模式**運作——一種用於**索引文件（passages）**，另一種用於**查詢**。為了維持高檢索準確度，必須透過正確設定 `input_type` 參數，來指定輸入文字的用途。

### 用法 {#usage-6}

將 `input_type` 參數設定為以下其中一個值：

- `"passage"` – 用於在**索引**期間嵌入內容（例如，文件）。
- `"query"` – 用於在**檢索**期間嵌入內容（例如，使用者查詢）。

> **警告：** `input_type` 使用不正確，可能會導致檢索效能大幅下降。

[這裡](https://build.nvidia.com/explore/retrieval)列出的所有模型都受支援：

| 模型名稱         | 函式呼叫                                         |
| :---               | :---                                                  |
| NV-Embed-QA | `embedding(model="nvidia_nim/NV-Embed-QA", input)` |
| nvidia/nv-embed-v1 | `embedding(model="nvidia_nim/nvidia/nv-embed-v1", input)` |
| nvidia/nv-embedqa-mistral-7b-v2 | `embedding(model="nvidia_nim/nvidia/nv-embedqa-mistral-7b-v2", input)` |
| nvidia/nv-embedqa-e5-v5 | `embedding(model="nvidia_nim/nvidia/nv-embedqa-e5-v5", input)` |
| nvidia/embed-qa-4 | `embedding(model="nvidia_nim/nvidia/embed-qa-4", input)` |
| nvidia/llama-3.2-nv-embedqa-1b-v1 | `embedding(model="nvidia_nim/nvidia/llama-3.2-nv-embedqa-1b-v1", input)` |
| nvidia/llama-3.2-nv-embedqa-1b-v2 | `embedding(model="nvidia_nim/nvidia/llama-3.2-nv-embedqa-1b-v2", input)` |
| snowflake/arctic-embed-l | `embedding(model="nvidia_nim/snowflake/arctic-embed-l", input)` |
| baai/bge-m3 | `embedding(model="nvidia_nim/baai/bge-m3", input)` |

## HuggingFace 嵌入模型 {#huggingface-embedding-models}
LiteLLM 支援所有 Feature-Extraction + Sentence Similarity 嵌入模型：https://huggingface.co/models?pipeline_tag=feature-extraction

### 用法 {#usage-7}
```python
from litellm import embedding
import os
os.environ['HUGGINGFACE_API_KEY'] = ""
response = embedding(
    model='huggingface/microsoft/codebert-base', 
    input=["good morning from litellm"]
)
```

### 用法 - 設定 input_type {#usage---set-input_type}

LiteLLM 會透過向 api base 發出 GET 請求來推斷輸入類型（feature-extraction 或 sentence-similarity）。

您可以自行設定 `input_type` 來覆寫此行為。

```python
from litellm import embedding
import os
os.environ['HUGGINGFACE_API_KEY'] = ""
response = embedding(
    model='huggingface/microsoft/codebert-base', 
    input=["good morning from litellm", "you are a good bot"],
    api_base = "https://p69xlsj6rpno5drq.us-east-1.aws.endpoints.huggingface.cloud", 
    input_type="sentence-similarity"
)
```

### 用法 - 自訂 API Base {#usage---custom-api-base}
```python
from litellm import embedding
import os
os.environ['HUGGINGFACE_API_KEY'] = ""
response = embedding(
    model='huggingface/microsoft/codebert-base', 
    input=["good morning from litellm"],
    api_base = "https://p69xlsj6rpno5drq.us-east-1.aws.endpoints.huggingface.cloud"
)
```

| 模型名稱            | 函式呼叫 | 需要的 OS 變數                        |
|-----------------------|--------------------------------------------------------------|-------------------------------------------------|
| microsoft/codebert-base    | `embedding('huggingface/microsoft/codebert-base', input=input)`               | `os.environ['HUGGINGFACE_API_KEY']`                                             |
| BAAI/bge-large-zh | `embedding('huggingface/BAAI/bge-large-zh', input=input)`         | `os.environ['HUGGINGFACE_API_KEY']`                                             |
| any-hf-embedding-model | `embedding('huggingface/hf-embedding-model', input=input)`         | `os.environ['HUGGINGFACE_API_KEY']`                                             |

## Mistral AI 嵌入模型 {#mistral-ai-embedding-models}
此處列出的所有模型 https://docs.mistral.ai/platform/endpoints 都支援

### 用法 {#usage-8}
```python
from litellm import embedding
import os

os.environ['MISTRAL_API_KEY'] = ""
response = embedding(
    model="mistral/mistral-embed",
    input=["good morning from litellm"],
)
print(response)
```

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| mistral-embed | `embedding(model="mistral/mistral-embed", input)` | 

## Gemini AI 嵌入模型 {#gemini-ai-embedding-models}

### API 金鑰 {#api-keys-2}

這可以設定為環境變數，或作為 **傳遞給 litellm.embedding() 的參數**
```python
import os
os.environ["GEMINI_API_KEY"] = ""
```

### 用法 - 嵌入 {#usage---embedding}
```python
from litellm import embedding
response = embedding(
  model="gemini/text-embedding-004",
  input=["good morning from litellm"],
)
print(response)
```

[此處](https://ai.google.dev/gemini-api/docs/models/gemini) 列出的所有模型都支援：

| 模型名稱         | 函式呼叫                                         |
| :---               | :---                                                  |
| text-embedding-004 | `embedding(model="gemini/text-embedding-004", input)` |
| gemini-embedding-2-preview | `embedding(model="gemini/gemini-embedding-2-preview", input)` | [多模態文件](#gemini-embedding-2-preview-multimodal) |
| gemini-embedding-2 *(GA)* | `embedding(model="gemini/gemini-embedding-2", input)` | [多模態文件](#gemini-embedding-2-preview-multimodal) · [GA 備註](/blog/gemini_embedding_2_ga) |

### Gemini Embedding 2 Preview（多模態） {#gemini-embedding-2-preview-multimodal}

`gemini-embedding-2-preview` 支援**多模態嵌入**——在單一請求中處理文字、圖片、音訊、影片和 PDF。詳情請參閱[部落格文章](/blog/gemini_embedding_2_multimodal)。GA 模型 ID `gemini-embedding-2` 提供相同的行為——在下方任何範例中將模型名稱替換即可。關於 cost-map 涵蓋範圍與定價說明，請參閱[GA 部落格](/blog/gemini_embedding_2_ga)。

:::info 回應格式

針對 Gemini API 路徑（`gemini/gemini-embedding-2-preview`），每個輸入元素都會回傳**各自的** embedding（以 `0..N-1` 編號）——語意與 OpenAI 的 `/embeddings` 相同。LiteLLM 會將請求路由到 Gemini 的 `batchEmbedContents` 端點，且每個輸入對應一個 `EmbedContentRequest`。這與 Vertex AI 路徑不同，後者會將所有部分合併成單一的統一向量——請參閱 [Vertex AI embeddings 文件](../providers/vertex_embedding#gemini-embedding-2-preview-multimodal)。

:::

**輸入格式：**
- **Data URI：** `data:image/png;base64,<encoded_data>`
- **Gemini 檔案參照：** `files/abc123`（透過 Gemini Files API 預先上傳）

**支援的 MIME 類型：** `image/png`、`image/jpeg`、`audio/mpeg`、`audio/wav`、`video/mp4`、`video/quicktime`、`application/pdf`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os
os.environ["GEMINI_API_KEY"] = ""

# Text + Image (base64)
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[
        "The food was delicious and the waiter...",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    ],
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl -X POST http://localhost:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-embedding-2-preview",
    "input": [
      "The food was delicious and the waiter...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    ]
  }'
```

</TabItem>
</Tabs>

**選用：** `dimensions` 會對應到 Gemini 的 `outputDimensionality`。

#### 合併的多模態嵌入 {#combined-multimodal-embeddings}

預設情況下，`input` 清單中的每個元素都會產生**獨立的** embedding（與 OpenAI 相容）。若要將多個輸入合併成**單一** embedding（例如：代表同一實體的文字 + 圖片），請將它們包在巢狀清單中：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding

# Separate: 2 inputs → 2 embeddings
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=["a red shoe", "data:image/png;base64,..."],
)
# response.data has 2 embeddings

# Combined: text + image → 1 embedding
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[["a red shoe", "data:image/png;base64,..."]],
)
# response.data has 1 embedding representing both together

# Mixed: 1 combined + 1 separate → 2 embeddings
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[["a red shoe", "data:image/png;base64,..."], "just text"],
)
# response.data has 2 embeddings
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl -X POST http://localhost:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-embedding-2-preview",
    "input": [["a red shoe", "data:image/png;base64,..."], "just text"]
  }'
```

</TabItem>
</Tabs>

這對於將多模態實體（例如：具有名稱 + 照片的產品）表示為單一向量，以便進行搜尋與檢索非常有用。僅限 Gemini API —— Vertex AI 一律會傳回單一的合併向量，無論輸入形狀為何（請參閱 [Vertex AI embeddings 文件](../providers/vertex_embedding#gemini-embedding-2-preview-multimodal)）。

## Vertex AI 嵌入模型 {#vertex-ai-embedding-models}

### 用法 - 嵌入 {#usage---embedding-1}
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

### 支援的模型 {#supported-models-1}
所有在[此處](https://github.com/BerriAI/litellm/blob/57f37f743886a0249f630a6792d49dffc2c5d9b7/model_prices_and_context_window.json#L835)列出的模型皆支援

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| textembedding-gecko | `embedding(model="vertex_ai/textembedding-gecko", input)` | 
| textembedding-gecko-multilingual | `embedding(model="vertex_ai/textembedding-gecko-multilingual", input)` | 
| textembedding-gecko-multilingual@001 | `embedding(model="vertex_ai/textembedding-gecko-multilingual@001", input)` | 
| textembedding-gecko@001 | `embedding(model="vertex_ai/textembedding-gecko@001", input)` | 
| textembedding-gecko@003 | `embedding(model="vertex_ai/textembedding-gecko@003", input)` | 
| text-embedding-preview-0409 | `embedding(model="vertex_ai/text-embedding-preview-0409", input)` |
| text-multilingual-embedding-preview-0409 | `embedding(model="vertex_ai/text-multilingual-embedding-preview-0409", input)` | 

## Voyage AI 嵌入模型 {#voyage-ai-embedding-models}

### 用法 - 嵌入 {#usage---embedding-2}
```python
from litellm import embedding
import os

os.environ['VOYAGE_API_KEY'] = ""
response = embedding(
    model="voyage/voyage-01",
    input=["good morning from litellm"],
)
print(response)
```

### 支援的模型 {#supported-models-2}
此處列出的所有模型 https://docs.voyageai.com/embeddings/#models-and-specifics 均受支援

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| voyage-01 | `embedding(model="voyage/voyage-01", input)` | 
| voyage-lite-01 | `embedding(model="voyage/voyage-lite-01", input)` | 
| voyage-lite-01-instruct | `embedding(model="voyage/voyage-lite-01-instruct", input)` | 

### 提供者專屬參數 {#provider-specific-params}

:::info

任何非 openai 的參數都會被視為提供者專屬參數，並以 kwargs 形式作為請求本文傳送給提供者。

[**請參閱保留參數**](https://github.com/BerriAI/litellm/blob/2f5f85cb52f36448d1f8bbfbd3b8af8167d0c4c8/litellm/main.py#L3130)
:::

### **範例** {#example}

Cohere v3 模型有一個必要參數：`input_type`，它可以是以下四個值之一：

- `input_type="search_document"`： （預設）當您要將文字（文件）儲存在向量資料庫中時使用
- `input_type="search_query"`：用於搜尋查詢，以在您的向量資料庫中找出最相關的文件
- `input_type="classification"`：當您將嵌入向量作為分類系統的輸入時使用
- `input_type="clustering"`：當您將嵌入向量用於文字叢集時使用

https://txt.cohere.com/introducing-embed-v3/

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
os.environ["COHERE_API_KEY"] = "cohere key"

# cohere call
response = embedding(
    model="embed-english-v3.0", 
    input=["good morning from litellm", "this is another item"], 
    input_type="search_document" # 👈 PROVIDER-SPECIFIC PARAM
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**透過設定**

```yaml
model_list:
  - model_name: "cohere-embed"
    litellm_params:
      model: embed-english-v3.0
      input_type: search_document # 👈 PROVIDER-SPECIFIC PARAM
```

**透過請求**

```bash
curl -X POST 'http://0.0.0.0:4000/v1/embeddings' \
-H 'Authorization: Bearer sk-54d77cd67b9febbb' \
-H 'Content-Type: application/json' \
-d '{
  "model": "cohere-embed",
  "input": ["Are you authorized to work in United States of America?"],
  "input_type": "search_document" # 👈 PROVIDER-SPECIFIC PARAM
}'
```
</TabItem>
</Tabs>

## Nebius AI Studio 嵌入模型 {#nebius-ai-studio-embedding-models}

### 用法 - 嵌入 {#usage---embedding-3}
```python
from litellm import embedding
import os

os.environ['NEBIUS_API_KEY'] = ""
response = embedding(
    model="nebius/BAAI/bge-en-icl",
    input=["Good morning from litellm!"],
)
print(response)
```

### 支援的模型 {#supported-models-3}
所有受支援的模型可在此處找到：https://studio.nebius.ai/models/embedding

| 模型名稱               | 函式呼叫                                                   |
|--------------------------|-----------------------------------------------------------------|
| BAAI/bge-en-icl | `embedding(model="nebius/BAAI/bge-en-icl", input)`              | 
| BAAI/bge-multilingual-gemma2 | `embedding(model="nebius/BAAI/bge-multilingual-gemma2", input)` | 
| intfloat/e5-mistral-7b-instruct | `embedding(model="nebius/intfloat/e5-mistral-7b-instruct", input)`      |
