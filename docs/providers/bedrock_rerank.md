import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS Bedrock - Rerank API {#aws-bedrock---rerank-api}

使用 Bedrock 的 Rerank API，採用 Cohere `/rerank` 格式。

:::info 成本追蹤

✅ **支援 Bedrock Rerank API 呼叫的成本追蹤**。

:::

## 支援的參數 {#supported-parameters}

- `model` - 基礎模型 ARN
- `query` - 要據以重新排序的查詢
- `documents` - 要重新排序的文件清單
- `top_n` - 要回傳的結果數量

## 用法 {#usage}

<Tabs>
<TabItem label="SDK" value="sdk">

```python
from litellm import rerank
import os 

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = rerank(
    model="bedrock/arn:aws:bedrock:us-west-2::foundation-model/amazon.rerank-v1:0", # provide the model ARN - get this here https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock/client/list_foundation_models.html
    query="hello",
    documents=["hello", "world"],
    top_n=2,
)

print(response)
```

</TabItem>
<TabItem label="PROXY" value="proxy">

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
    - model_name: bedrock-rerank
      litellm_params:
        model: bedrock/arn:aws:bedrock:us-west-2::foundation-model/amazon.rerank-v1:0
        aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
        aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
        aws_region_name: os.environ/AWS_REGION_NAME
```

### 2. 啟動 proxy 伺服器 {#2-start-proxy-server}

```bash
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試看看！  {#3-test-it}

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bedrock-rerank",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3


  }'
```

</TabItem>
</Tabs>

## 驗證 {#authentication}

支援所有標準 Bedrock 驗證方法進行 rerank。詳情請參閱 [Bedrock 驗證](./bedrock#boto3---authentication)。
