# Bedrock 嵌入 {#bedrock-embedding}

## 支援的嵌入模型 {#supported-embedding-models}

| 提供者 | LiteLLM 路由 | AWS 文件 | 成本追蹤 |
|----------|---------------|-------------------|---------------|
| Amazon Titan | `bedrock/amazon.titan-*` | [Amazon Titan Embeddings](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html) | ✅ |
| Amazon Nova | `bedrock/amazon.nova-*` | [Amazon Nova Embeddings](https://docs.aws.amazon.com/bedrock/latest/userguide/nova-embed.html) | ✅ |
| Cohere | `bedrock/cohere.*` | [Cohere Embeddings](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-embed.html) | ✅ |
| TwelveLabs | `bedrock/twelvelabs.*`, `bedrock/us.twelvelabs.*`, `bedrock/eu.twelvelabs.*` | [TwelveLabs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-twelvelabs.html), [Marengo Embed 3.0](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-marengo-3.html) | ✅ |

## 非同步 Invoke 支援 {#async-invoke-support}

LiteLLM 支援 AWS Bedrock 的 async-invoke 功能，適用於需要非同步處理的嵌入模型，特別適合大型媒體檔案（影片、音訊），或當您需要在背景處理嵌入時使用。

### 支援的模型 {#supported-models}

| 提供者 | 非同步呼叫路由 | 使用情境 |
|----------|-------------------|----------|
| Amazon Nova | `bedrock/async_invoke/amazon.nova-2-multimodal-embeddings-v1:0` | 具分段功能的多模態嵌入，適用於長文本、影片和音訊 |
| TwelveLabs Marengo Embed 2.7 | `bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0` | 影片、音訊、圖片和文本嵌入 |
| TwelveLabs Marengo Embed 3.0 | `bedrock/async_invoke/twelvelabs.marengo-embed-3-0-v1:0` | 影片和音訊嵌入（文本和圖片同步執行，請參閱 [Marengo Embed 3.0](#twelvelabs-marengo-embed-30)） |

### 必要參數 {#required-parameters}

Bedrock 的 async invoke 只接受 base model ids，因此請在此使用 `twelvelabs.marengo-embed-2-7-v1:0` 或 `twelvelabs.marengo-embed-3-0-v1:0`，而不是 `us.` 或 `eu.` inference profile，否則 Bedrock 會以 `The provided model doesn't support async inference` 拒絕

使用 async-invoke 時，您必須提供：

| 參數 | 說明 | 必填 |
|-----------|-------------|----------|
| `output_s3_uri` | 儲存嵌入結果的 S3 URI | ✅ 是 |
| `input_type` | 輸入類型：`"text"`、`"image"`、`"video"` 或 `"audio"`（Marengo Embed 3.0 也支援 `"text_image"` 和 `"multi_input"`） | ✅ 是 |
| `aws_region_name` | 此請求的 AWS 區域 | ✅ 是 |

### 使用方式 {#usage}

#### 基本非同步 Invoke {#basic-async-invoke}

```python
from litellm import embedding

# Text embedding with async-invoke
response = embedding(
    model="bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0",
    input=["Hello world from LiteLLM async invoke!"],
    aws_region_name="us-east-1",
    input_type="text",
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)

print(f"Job submitted! Invocation ARN: {response._hidden_params._invocation_arn}")
```

#### 影片/音訊嵌入 {#videoaudio-embedding}

```python
# Video embedding (requires async-invoke)
response = embedding(
    model="bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0",
    input=["s3://your-bucket/video.mp4"],  # S3 URL for video
    aws_region_name="us-east-1",
    input_type="video",
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)

print(f"Video embedding job submitted! ARN: {response._hidden_params._invocation_arn}")
```

#### 以 Base64 進行圖片嵌入 {#image-embedding-with-base64}

```python
import base64

# Load and encode image
with open("image.jpg", "rb") as img_file:
    img_data = base64.b64encode(img_file.read()).decode('utf-8')
    img_base64 = f"data:image/jpeg;base64,{img_data}"

response = embedding(
    model="bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0",
    input=[img_base64],
    aws_region_name="us-east-1",
    input_type="image",
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)
```

### 取得工作資訊 {#retrieving-job-information}

#### 取得 Job ID 與 Invocation ARN {#getting-job-id-and-invocation-arn}

async-invoke 回應會在隱藏參數中包含 invocation ARN：

```python
response = embedding(
    model="bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0",
    input=["Hello world"],
    aws_region_name="us-east-1",
    input_type="text",
    output_s3_uri="s3://your-bucket/async-invoke-output/"
)

# Access invocation ARN
invocation_arn = response._hidden_params._invocation_arn
print(f"Invocation ARN: {invocation_arn}")

# Extract job ID from ARN (last part after the last slash)
job_id = invocation_arn.split("/")[-1]
print(f"Job ID: {job_id}")
```

#### 檢查工作狀態 {#checking-job-status}

使用 LiteLLM 的 `retrieve_batch` 函式來檢查您的工作是否仍在處理中：

```python
from litellm import retrieve_batch

def check_async_job_status(invocation_arn, aws_region_name="us-east-1"):
    """Check the status of an async invoke job using LiteLLM batch API"""
    try:
        response = retrieve_batch(
            batch_id=invocation_arn,  # Pass the invocation ARN here
            custom_llm_provider="bedrock",
            aws_region_name=aws_region_name
        )
        return response
    except Exception as e:
        print(f"Error checking job status: {e}")
        return None

# Check status
status = check_async_job_status(invocation_arn, "us-east-1")
if status:
    print(f"Job Status: {status.status}")  # "in_progress", "completed", or "failed"
    print(f"Output Location: {status.metadata['output_file_id']}")  # S3 URI where results are stored
```

#### 透過輪詢直到完成 {#polling-until-complete}

以下是一個完整的工作完成輪詢範例：

```python
def wait_for_async_job(invocation_arn, aws_region_name="us-east-1", max_wait=3600):
    """Poll job status until completion"""
    start_time = time.time()
    
    while True:
        status = retrieve_batch(
            batch_id=invocation_arn,
            custom_llm_provider="bedrock",
            aws_region_name=aws_region_name,
        )
        
        if status.status == "completed":
            print("✅ Job completed!")
            return status
        elif status.status == "failed":
            error_msg = status.metadata.get('failure_message', 'Unknown error')
            raise Exception(f"❌ Job failed: {error_msg}")
        else:
            elapsed = time.time() - start_time
            if elapsed > max_wait:
                raise TimeoutError(f"Job timed out after {max_wait} seconds")
            
            print(f"⏳ Job still processing... (elapsed: {elapsed:.0f}s)")
            time.sleep(10)  # Wait 10 seconds before checking again

# Wait for completion
completed_status = wait_for_async_job(invocation_arn)
output_s3_uri = completed_status.metadata['output_file_id']
print(f"Results available at: {output_s3_uri}")
```

**注意：** 實際的嵌入結果會儲存在 S3 中。工作完成後，請從 `status.metadata['output_file_id']` 中指定的 S3 位置下載結果。結果將採用 JSON/JSONL 格式，並包含嵌入向量。

## TwelveLabs Marengo Embed 3.0 {#twelvelabs-marengo-embed-30}

Marengo Embed 3.0（`twelvelabs.marengo-embed-3-0-v1:0`，並為 us-east-1 和 eu-west-1 提供 `us.` 與 `eu.` inference profiles）會回傳 512 維向量，且可處理最多 500 個 tokens 的文本。文本、圖片、文本加圖片，以及多圖片輸入會透過 `bedrock/<model id>` 同步執行；影片和音訊則透過 `bedrock/async_invoke/twelvelabs.marengo-embed-3-0-v1:0` 搭配 `output_s3_uri`，並使用 base model id，因為 Bedrock 的 async invoke 會拒絕 inference profiles。3.0 傳送給 Bedrock 的 request body 與 2.7 不同，而 LiteLLM 會從相同的 `input_type` 參數建立它，因此從 2.7（預定於 2026-11-30 淘汰）切換時，變更的是 model id

### 輸入類型 {#input-types}

| `input_type` | `input` | 額外參數 |
|--------------|---------|------------------|
| `text`（預設） | 要嵌入的文本 | |
| `image` | base64 圖片或 `s3://` uri | |
| `text_image` | 文本 | `media_source`：base64 圖片或 `s3://` uri |
| `multi_input` | 文本，並將每張圖片參照為 `<@name>` | `media_sources`：名稱到 base64 圖片或 `s3://` uri 的對應 |
| `video`、`audio` | `s3://` uri 或 base64 媒體，僅限非同步呼叫 | `startSec`、`endSec`、`segmentation`、`embeddingOption`、`embeddingType`、`embeddingScope`，如 [AWS](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-marengo-3.html) 所記載 |

`inferenceId` 和 `bucketOwner`（適用於由其他帳戶擁有的 `s3://` uri）會在每種輸入類型上傳遞。未提供 `text_image` 的 `media_source` 請求，或未提供 `multi_input` 的 `media_sources` 請求，會因缺少的參數名稱而遭到 400 拒絕。Marengo 2.7 的 `textTruncate`、`lengthSec`、`useFixedLengthSec` 和 `minClipSec`，以及任何其他輸入類型上的影片與音訊選項，在 3.0 上若未設定 `drop_params`，都會以 400 拒絕，否則會直接略過

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: marengo-3
    litellm_params:
      model: bedrock/us.twelvelabs.marengo-embed-3-0-v1:0
      aws_region_name: us-east-1
  - model_name: marengo-3-async
    litellm_params:
      model: bedrock/async_invoke/twelvelabs.marengo-embed-3-0-v1:0
      aws_region_name: us-east-1
```

### 文本 {#text}

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "marengo-3", "input": "a dog running on the beach", "input_type": "text"}'
```

### 圖片 {#image}

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "marengo-3", "input": "<base64 image>", "input_type": "image"}'
```

### 文本加圖片 {#text-plus-image}

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "marengo-3", "input": "a duck", "input_type": "text_image", "media_source": "s3://your-bucket/duck.png"}'
```

### 多張圖片 {#multiple-images}

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "marengo-3", "input": "a photo of <@bird> on water", "input_type": "multi_input", "media_sources": {"bird": "<base64 image>"}}'
```

### 透過 async invoke 的影片 {#video-through-async-invoke}

```python
from litellm import embedding

response = embedding(
    model="bedrock/async_invoke/twelvelabs.marengo-embed-3-0-v1:0",
    input=["s3://your-bucket/video.mp4"],
    aws_region_name="us-east-1",
    input_type="video",
    embeddingOption=["visual", "audio"],
    segmentation={"method": "fixed", "fixed": {"durationSec": 10}},
    output_s3_uri="s3://your-bucket/async-invoke-output/",
)
print(response._hidden_params._invocation_arn)
```

## Amazon Nova 多模態嵌入 {#amazon-nova-multimodal-embeddings}

Amazon Nova 支援文字、圖片、影片與音訊的多模態嵌入。它提供彈性的嵌入維度與用途，針對不同使用情境最佳化。

### 支援的功能 {#supported-features}

- **模態**：文字、圖片、影片、音訊
- **維度**：256、384、1024、3072（預設：3072）
- **嵌入用途**： 
  - `GENERIC_INDEX`（預設）
  - `GENERIC_RETRIEVAL`
  - `TEXT_RETRIEVAL`
  - `IMAGE_RETRIEVAL`
  - `VIDEO_RETRIEVAL`
  - `AUDIO_RETRIEVAL`
  - `CLASSIFICATION`
  - `CLUSTERING`

### 文字嵌入 {#text-embedding}

```python
from litellm import embedding

response = embedding(
    model="bedrock/amazon.nova-2-multimodal-embeddings-v1:0",
    input=["Hello, world!"],
    aws_region_name="us-east-1",
    dimensions=1024,  # Optional: 256, 384, 1024, or 3072
)

print(response.data[0].embedding)
```

### 以 Base64 進行圖片嵌入 {#image-embedding-with-base64-1}

Amazon Nova 可使用標準 data URL 格式接受 base64 格式的圖片：

```python
import base64
from litellm import embedding

# Method 1: Load image from file
with open("image.jpg", "rb") as image_file:
    image_data = base64.b64encode(image_file.read()).decode('utf-8')
    # Create data URL with proper format
    image_base64 = f"data:image/jpeg;base64,{image_data}"

response = embedding(
    model="bedrock/amazon.nova-2-multimodal-embeddings-v1:0",
    input=[image_base64],
    aws_region_name="us-east-1",
    dimensions=1024,
)

print(f"Image embedding: {response.data[0].embedding[:10]}...")  # First 10 dimensions
```

#### 支援的圖片格式 {#supported-image-formats}

Nova 支援以下圖片格式：
- JPEG: `data:image/jpeg;base64,...`
- PNG: `data:image/png;base64,...`
- GIF: `data:image/gif;base64,...`
- WebP: `data:image/webp;base64,...`

#### 含錯誤處理的完整範例 {#complete-example-with-error-handling}

```python
import base64
from litellm import embedding

def get_image_embedding(image_path, dimensions=1024):
    """
    Get embedding for an image file.
    
    Args:
        image_path: Path to the image file
        dimensions: Embedding dimension (256, 384, 1024, or 3072)
    
    Returns:
        List of embedding values
    """
    try:
        # Determine image format from file extension
        if image_path.lower().endswith('.png'):
            mime_type = "image/png"
        elif image_path.lower().endswith(('.jpg', '.jpeg')):
            mime_type = "image/jpeg"
        elif image_path.lower().endswith('.gif'):
            mime_type = "image/gif"
        elif image_path.lower().endswith('.webp'):
            mime_type = "image/webp"
        else:
            raise ValueError(f"Unsupported image format: {image_path}")
        
        # Read and encode image
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
            image_base64 = f"data:{mime_type};base64,{image_data}"
        
        # Get embedding
        response = embedding(
            model="bedrock/amazon.nova-2-multimodal-embeddings-v1:0",
            input=[image_base64],
            aws_region_name="us-east-1",
            dimensions=dimensions,
        )
        
        return response.data[0].embedding
        
    except Exception as e:
        print(f"Error getting image embedding: {e}")
        raise

# Example usage
image_embedding = get_image_embedding("photo.jpg", dimensions=1024)
print(f"Got embedding with {len(image_embedding)} dimensions")
```

### 錯誤處理 {#error-handling}

#### 常見錯誤 {#common-errors}

| 錯誤 | 原因 | 解決方案 |
|-------|-------|----------|
| `ValueError: output_s3_uri cannot be empty` | 缺少 S3 輸出 URI | 提供有效的 S3 URI |
| `ValueError: Input type 'video' requires async_invoke route` | 在未使用 async-invoke 的情況下使用影片/音訊 | 使用 `bedrock/async_invoke/` 模型前綴 |
| `ValueError: input_type is required` | 缺少輸入類型參數 | 指定 `input_type` 參數 |

#### 錯誤處理範例 {#example-error-handling}

```python
try:
    response = embedding(
        model="bedrock/async_invoke/twelvelabs.marengo-embed-2-7-v1:0",
        input=["Hello world"],
        aws_region_name="us-east-1",
        input_type="text",
        output_s3_uri="s3://your-bucket/output/"  # Required for async-invoke
    )
    print("Job submitted successfully!")
    
except ValueError as e:
    if "output_s3_uri cannot be empty" in str(e):
        print("Error: Please provide a valid S3 output URI")
    elif "requires async_invoke route" in str(e):
        print("Error: Use async_invoke model for video/audio inputs")
    else:
        print(f"Error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

### 最佳做法 {#best-practices}

1. **大型檔案使用 async-invoke**：影片與音訊檔案更適合以非同步方式處理
2. **使用 LiteLLM batch API**：狀態檢查請使用 `retrieve_batch()`，而非直接呼叫 Bedrock API
3. **監控工作狀態**：定期使用 batch API 檢查工作狀態，以知道結果何時就緒
4. **妥善處理錯誤**：針對網路問題與工作失敗實作正確的錯誤處理
5. **設定適當的逾時時間**：考量大型檔案的處理時間
6. **大型輸入使用 S3**：對於影片/音訊，請使用 S3 URL，而非 base64 編碼

### 限制 {#limitations}

- TwelveLabs Marengo 與 Amazon Nova 模型支援 async-invoke
- 結果會儲存在 S3，且必須使用輸出檔案 ID 另外擷取
- 工作狀態檢查需要使用 LiteLLM 的 `retrieve_batch()` 函式
- LiteLLM 沒有內建輪詢機制（必須自行實作狀態檢查迴圈）

### API 金鑰 {#api-keys}
這可以設定為環境變數，或作為 **params to litellm.embedding()** 傳入
```python
import os
os.environ["AWS_ACCESS_KEY_ID"] = ""        # Access key
os.environ["AWS_SECRET_ACCESS_KEY"] = ""    # Secret access key
os.environ["AWS_REGION_NAME"] = ""           # us-east-1, us-east-2, us-west-1, us-west-2
```

## 使用方式 {#usage-1}

### LiteLLM Python SDK {#litellm-python-sdk}
```python
from litellm import embedding
response = embedding(
    model="bedrock/amazon.titan-embed-text-v1",
    input=["good morning from litellm"],
)
print(response)
```

### LiteLLM Proxy Server {#litellm-proxy-server}

#### 1. 設定 config.yaml {#1-setup-configyaml}
```yaml
model_list:
  - model_name: titan-embed-v1
    litellm_params:
      model: bedrock/amazon.titan-embed-text-v1
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
  - model_name: titan-embed-v2
    litellm_params:
      model: bedrock/amazon.titan-embed-text-v2:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

#### 2. 啟動 Proxy  {#2-start-proxy}
```bash
litellm --config /path/to/config.yaml
```

#### 3. 與 OpenAI Python SDK 搭配使用 {#3-use-with-openai-python-sdk}
```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.embeddings.create(
    input=["good morning from litellm"],
    model="titan-embed-v1"
)
print(response)
```

#### 4. 與 LiteLLM Python SDK 搭配使用 {#4-use-with-litellm-python-sdk}
```python
import litellm
response = litellm.embedding(
    model="titan-embed-v1", # model alias from config.yaml
    input=["good morning from litellm"],
    api_base="http://0.0.0.0:4000",
    api_key="anything"
)
print(response)
```

## 支援的 AWS Bedrock 嵌入模型 {#supported-aws-bedrock-embedding-models}

| 模型名稱           | 用途                               | 支援的額外 OpenAI 參數 |
|----------------------|---------------------------------------------|-----|
| **Amazon Nova Multimodal Embeddings** | `embedding(model="bedrock/amazon.nova-2-multimodal-embeddings-v1:0", input=input)` | 支援多模態輸入（文本、圖片、影片、音訊）、多種用途、維度（256、384、1024、3072） |
| Titan Embeddings V2 | `embedding(model="bedrock/amazon.titan-embed-text-v2:0", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_v2_transformation.py#L59) |
| Titan Embeddings - V1 | `embedding(model="bedrock/amazon.titan-embed-text-v1", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_g1_transformation.py#L53)
| Titan Multimodal Embeddings | `embedding(model="bedrock/amazon.titan-embed-image-v1", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/amazon_titan_multimodal_transformation.py#L28) |
| TwelveLabs Marengo Embed 2.7 | `embedding(model="bedrock/us.twelvelabs.marengo-embed-2-7-v1:0", input=input)` | 支援多模態輸入（文本、影片、音訊、圖片） |
| TwelveLabs Marengo Embed 3.0 | `embedding(model="bedrock/us.twelvelabs.marengo-embed-3-0-v1:0", input=input)` | 文本、圖片、`text_image` 和 `multi_input` 同步執行，影片和音訊透過 async invoke，512 維度 |
| Cohere Embeddings - English | `embedding(model="bedrock/cohere.embed-english-v3", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)
| Cohere Embeddings - Multilingual | `embedding(model="bedrock/cohere.embed-multilingual-v3", input=input)` | [這裡](https://github.com/BerriAI/litellm/blob/f5905e100068e7a4d61441d7453d7cf5609c2121/litellm/llms/bedrock/embed/cohere_transformation.py#L18)
| Cohere Embed v4 | `embedding(model="bedrock/cohere.embed-v4:0", input=input)` | 支援文本和圖片輸入，可設定維度（256、512、1024、1536），128k context 長度 |

### 進階 - [捨棄不支援的參數](https://docs.litellm.ai/docs/completion/drop_params#openai-proxy-usage) {#advanced---drop-unsupported-params}

### 進階 - [傳遞模型/提供者專屬參數](https://docs.litellm.ai/docs/completion/provider_specific_params#proxy-usage) {#advanced---pass-modelprovider-specific-params}
