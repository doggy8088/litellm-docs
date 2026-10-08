import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock 批次 {#bedrock-batches}

透過 LiteLLM 使用 Amazon Bedrock Batch Inference API。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Amazon Bedrock Batch Inference 可讓您非同步地對大型資料集執行推論 |
| 提供者文件 | [AWS Bedrock Batch Inference ↗](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html) |
| 成本追蹤 | ✅ 支援 |

## 概覽 {#overview}

可將其用於：

- 使用 Bedrock 模型對大型資料集執行批次推論
- 依金鑰／使用者／團隊控制批次模型存取權（與聊天補全模型相同）
- 管理批次輸入／輸出檔案的 S3 儲存空間

## （Proxy 管理員）用法 {#proxy-admin-usage}

以下說明如何讓開發者存取您的 Bedrock Batch 模型。

### 1. 設定 config.yaml {#1-setup-configyaml}

- 為每個模型指定 `mode: batch`：讓開發者知道這是批次模型
- 設定 S3 儲存貯體與 AWS 憑證以進行批次作業

```yaml showLineNumbers title="litellm_config.yaml"
model_list:
  - model_name: "bedrock-batch-claude"
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      #########################################################
      ########## batch specific params ########################
      s3_bucket_name: litellm-proxy
      s3_region_name: us-west-2
      s3_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      s3_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_batch_role_arn: arn:aws:iam::888602223428:role/service-role/AmazonBedrockExecutionRoleForAgents_BB9HNW6V4CV
      # Optional: Custom KMS encryption key for the S3 input upload and the batch output
      # s3_encryption_key_id: arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012
      # Optional: AWS account id that owns the S3 buckets, when they live in another account
      # s3_bucket_owner: "123456789012"
    model_info: 
      mode: batch # 👈 SPECIFY MODE AS BATCH, to tell user this is a batch model
```

**必要參數：**

| 參數 | 說明 |
|-----------|-------------|
| `s3_bucket_name` | 用於批次輸入／輸出檔案的 S3 儲存貯體 |
| `s3_region_name` | S3 儲存貯體的 AWS 區域 |
| `s3_access_key_id` | S3 儲存貯體的 AWS 存取金鑰 |
| `s3_secret_access_key` | S3 儲存貯體的 AWS 密鑰 |
| `aws_batch_role_arn` | Bedrock 批次作業的 IAM role ARN。Bedrock Batch API 需要設定 IAM role ARN。 |
| `mode: batch` | 表示這是批次模型，供 LiteLLM 辨識 |

**選用參數：**

| 參數 | 說明 |
|-----------|-------------|
| `s3_encryption_key_id` | 用於 LiteLLM 上傳至 S3 的批次輸入檔與批次輸出資料的自訂 KMS 加密金鑰 ID。對於 LiteLLM 用來簽署上傳的憑證，此金鑰需要 `kms:GenerateDataKey`。若未指定，Bedrock 會使用 AWS 管理的加密金鑰。 |
| `s3_bucket_owner` | 擁有批次輸入與輸出 S3 bucket 的 AWS 帳戶 id。會以 `s3BucketOwner` 傳送到 Bedrock 工作的輸入與輸出資料設定中。當 bucket 位於與執行批次工作的帳戶不同的帳戶時請設定此值，否則 Bedrock 會根據工作的帳戶驗證 bucket 擁有權，而導致工作失敗。也可透過 `AWS_S3_BUCKET_OWNER` 環境變數設定。 |

### 2. 建立虛擬金鑰 {#2-create-virtual-key}

```bash showLineNumbers title="create_virtual_key.sh"
curl -L -X POST 'https://{PROXY_BASE_URL}/key/generate' \
-H 'Authorization: Bearer ${PROXY_API_KEY}' \
-H 'Content-Type: application/json' \
-d '{"models": ["bedrock-batch-claude"]}'
```

您現在可以使用虛擬金鑰存取批次模型（請參閱開發者流程）。

## （開發者）用法 {#developer-usage}

以下說明如何建立 LiteLLM 管理的檔案，並使用該檔案執行 Bedrock Batch CRUD 作業。

### 1. 建立 request.jsonl {#1-create-requestjsonl}

- 透過 `/model_group/info` 檢查可用模型
- 使用 `mode: batch` 查看所有模型
- 在 .jsonl 中將 `model` 設為來自 `/model_group/info` 的模型

```json showLineNumbers title="bedrock_batch_completions.jsonl"
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "bedrock-batch-claude", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello world!"}], "max_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "bedrock-batch-claude", "messages": [{"role": "system", "content": "You are an unhelpful assistant."}, {"role": "user", "content": "Hello world!"}], "max_tokens": 1000}}
```

預期：

- LiteLLM 會將其轉換為 bedrock 部署專用值（例如 `bedrock/us.anthropic.{{anthropic}}`）

### 2. 上傳檔案 {#2-upload-file}

指定 `target_model_names: "<model-name>"` 以啟用 LiteLLM 管理的檔案與請求驗證。

model-name 應與 request.jsonl 中的 model-name 相同

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="bedrock_batch.py"
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-<your-litellm-api-key>",
)

# Upload file
batch_input_file = client.files.create(
    file=open("./bedrock_batch_completions.jsonl", "rb"), # {"model": "bedrock-batch-claude"} <-> {"model": "bedrock/us.anthropic.{{anthropic}}"}
    purpose="batch",
    extra_body={"target_model_names": "bedrock-batch-claude"}
)
print(batch_input_file)
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Upload File"
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -F purpose="batch" \
    -F file="@bedrock_batch_completions.jsonl" \
    -F extra_body='{"target_model_names": "bedrock-batch-claude"}'
```

</TabItem>
</Tabs>

**檔案會寫到哪裡？**：

檔案會寫入您在 config 中指定的 S3 儲存貯體，並為 Bedrock 批次推論做好準備。

### 3. 建立批次 {#3-create-the-batch}

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="bedrock_batch.py"
...
# Create batch
batch = client.batches.create( 
    input_file_id=batch_input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"description": "Test batch job"},
)
print(batch)
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Create Batch Request"
curl http://localhost:4000/v1/batches \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "input_file_id": "file-abc123",
        "endpoint": "/v1/chat/completions",
        "completion_window": "24h",
        "metadata": {"description": "Test batch job"}
    }'
```

</TabItem>
</Tabs>

### 4. 取得批次結果 {#4-retrieve-batch-results}

批次工作完成後，請從 S3 下載結果：

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="bedrock_batch.py"
...
# Wait for batch completion (check status periodically)
batch_status = client.batches.retrieve(batch_id=batch.id)

if batch_status.status == "completed":
    # Download the output file
    result = client.files.content(
        file_id=batch_status.output_file_id,
        extra_headers={"custom-llm-provider": "bedrock"}
    )
    
    # Save or process the results
    with open("batch_output.jsonl", "wb") as f:
        f.write(result.content)
    
    # Parse JSONL results
    for line in result.text.strip().split('\n'):
        record = json.loads(line)
        print(f"Record ID: {record['recordId']}")
        print(f"Output: {record.get('modelOutput', {})}")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Download Batch Results"
# First retrieve batch to get output_file_id
curl http://localhost:4000/v1/batches/batch_abc123 \
    -H "Authorization: Bearer $LITELLM_API_KEY"

# Then download the output file
curl http://localhost:4000/v1/files/{output_file_id}/content \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "custom-llm-provider: bedrock" \
    -o batch_output.jsonl
```

</TabItem>
<TabItem value="litellm-direct" label="LiteLLM Direct">

```python showLineNumbers title="bedrock_batch.py"
import litellm
from litellm import file_content

# Download using litellm directly (bypasses proxy managed files)
result = file_content(
    file_id=batch_status.output_file_id,  # Can be S3 URI or unified file ID
    custom_llm_provider="bedrock",
    aws_region_name="us-west-2",
)

# Process results
print(result.text)
```

</TabItem>
</Tabs>

**輸出格式：**

批次輸出檔案為 JSONL 格式，每一行包含：

```json
{
  "recordId": "request-1",
  "modelInput": {
    "messages": [...],
    "max_tokens": 1000
  },
  "modelOutput": {
    "content": [...],
    "id": "msg_abc123",
    "model": "us.anthropic.{{anthropic}}",
    "role": "assistant",
    "stop_reason": "end_turn",
    "usage": {
      "input_tokens": 15,
      "output_tokens": 10
    }
  }
}
```

## 常見問題 {#faq}

### 我的檔案會寫到哪裡？ {#where-are-my-files-written}

當指定 `target_model_names` 時，檔案會寫入您在 Bedrock 批次模型組態中設定的 S3 儲存貯體。

### 支援哪些模型？ {#what-models-are-supported}

AWS 列出的任何可用於 [批次推論](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference-supported.html) 的 Bedrock 模型都可以，只要 LiteLLM 能將您輸入檔中的 OpenAI 格式記錄轉換為該模型的 request body。目前這涵蓋 Anthropic Claude 模型、Amazon Nova 模型（每筆記錄都會以 Nova 預期的 Converse request 形狀寫入）、Amazon Titan Text Embeddings V2 的 `/v1/embeddings` 記錄，以及像 `openai.gpt-oss-120b-1:0`、Qwen 和 DeepSeek 這類與 OpenAI 相容的 Bedrock 模型，其記錄會原樣作為 OpenAI 風格的 chat body 傳遞。Chat 記錄可使用 `/v1/chat/completions`、`/v1/completions` 或 `/v1/responses` 作為其 `url`；completions 與 responses 記錄會在上傳前轉換為 chat 請求。Titan Text Embeddings V2 是目前唯一會翻譯的 embedding 模型。

請使用 AWS 在您區域接受的 batch jobs model id。大多數目前的模型只會透過 cross-region inference profile 執行 batch jobs，因此 id 通常會帶有 `us.`（或 `eu.`、`apac.`）前綴，例如 `us.amazon.nova-lite-v1:0`，而不是 `amazon.nova-lite-v1:0`。Bedrock 也會拒絕少於 100 筆記錄的工作，不論模型為何。

非 Anthropic 的 batch model 設定方式與上方 Claude 範例相同：

```yaml showLineNumbers title="litellm_config.yaml"
model_list:
  - model_name: "bedrock-batch-nova"
    litellm_params:
      model: bedrock/us.amazon.nova-lite-v1:0
      s3_bucket_name: litellm-proxy
      s3_region_name: us-east-1
      s3_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      s3_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_batch_role_arn: arn:aws:iam::123456789012:role/LiteLLMBedrockBatchRole
    model_info:
      mode: batch
  - model_name: "bedrock-batch-titan-embeddings"
    litellm_params:
      model: bedrock/amazon.titan-embed-text-v2:0
      s3_bucket_name: litellm-proxy
      s3_region_name: us-east-1
      s3_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      s3_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_batch_role_arn: arn:aws:iam::123456789012:role/LiteLLMBedrockBatchRole
    model_info:
      mode: batch
```

輸入檔中的記錄接著會參照 `model_name`（`{"model": "bedrock-batch-nova", ...}`），上傳時會將 `target_model_names` 設為相同名稱，而建立批次時會將 `endpoint` 設為聊天模型的 `/v1/chat/completions` 或 embedding model 的 `/v1/embeddings`。`aws_batch_role_arn` 中的 IAM role 需要對您執行 batch jobs 所使用的每個 model 都有 `bedrock:InvokeModel`。

如果您需要 LiteLLM 尚未翻譯的 Bedrock model，例如其他 embedding model，請在 [這裡](https://github.com/BerriAI/litellm/issues/new/choose) 提出 issue。

### 我要如何使用自訂 KMS 加密金鑰？ {#how-do-i-use-a-custom-kms-encryption-key}

如果您的 S3 儲存貯體需要自訂 KMS 加密金鑰，您可以在設定中使用 `s3_encryption_key_id` 指定。這對於有特定加密需求的企業客戶很有用。

此金鑰涵蓋 LiteLLM 會接觸的兩個物件：它上傳到您 bucket 的批次輸入檔，以及 Bedrock 寫回的批次輸出。輸入上傳會以 `x-amz-server-side-encryption: aws:kms` 與此金鑰 ARN 簽署，因此 LiteLLM 上傳所使用的 AWS 身分需要對該金鑰具備 `kms:GenerateDataKey`。請在設定金鑰之前先授予，否則 `POST /v1/files` 會因為 S3 `AccessDenied` 而失敗

您可以用 2 種方式設定加密金鑰：

1. **在 config.yaml 中**（建議）：
```yaml
model_list:
  - model_name: "bedrock-batch-claude"
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      s3_encryption_key_id: arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012
      # ... other params
```

2. **作為環境變數**：
```bash
export AWS_S3_ENCRYPTION_KEY_ID=arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012
```

### 如何使用由不同 AWS 帳戶擁有的 S3 bucket？ {#how-do-i-use-s3-buckets-owned-by-a-different-aws-account}

Bedrock 會檢查輸入與輸出 bucket 是否屬於 `s3BucketOwner` 中所命名的帳戶，而當該欄位缺失時，預設為執行 batch job 的帳戶。如果您的 bucket 位於另一個帳戶，即使 bucket policy 已授予存取權，工作仍會因 S3 權限錯誤而在驗證時失敗。將 `s3_bucket_owner` 設為擁有這些 bucket 的帳戶 id，LiteLLM 就會在輸入與輸出資料設定中都傳送它

透過 proxy，`s3_bucket_owner` 在 `/v1/batches` request body 中傳入時，會優先於部署的 `litellm_params` 值，而該值又會優先於 `AWS_S3_BUCKET_OWNER` 環境變數。這與 router 套用到其他所有部署參數（例如 `s3_bucket_name` 或 `s3_encryption_key_id`）的順序相同。當都未設定時，該欄位會被省略，而 Bedrock 會保留其預設值

```yaml
model_list:
  - model_name: "bedrock-batch-claude"
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      s3_bucket_name: shared-batch-bucket
      s3_bucket_owner: "123456789012"
      # ... other params
```

```bash
export AWS_S3_BUCKET_OWNER=123456789012
```

## 延伸閱讀 {#further-reading}

- [AWS Bedrock Batch Inference 文件](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html)
- [LiteLLM 管理的批次](../proxy/managed_batches)
- [LiteLLM 對 Bedrock 的驗證](https://docs.litellm.ai/docs/providers/bedrock#boto3---authentication)
