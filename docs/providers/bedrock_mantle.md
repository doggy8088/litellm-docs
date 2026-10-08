import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Amazon Bedrock Mantle {#amazon-bedrock-mantle}

[Amazon Bedrock Mantle](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-mantle.html) 是 Amazon Bedrock 的分散式推論引擎（Project Mantle），可為 Bedrock 托管的模型提供 **OpenAI 相容 API**。

請使用此提供者，以正確的 **AWS Bedrock 定價** 而非 OpenAI 定價來呼叫 Bedrock Mantle 模型。

:::tip

**我們支援所有 Bedrock Mantle 模型，只要在傳送 litellm 請求時將 `model=bedrock_mantle/<model-id>` 設為前綴即可**

:::

## Claude Mythos {#claude-mythos}

[Claude Mythos](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-mythos-preview.html) (`anthropic.claude-mythos-preview`) 可在 Bedrock Mantle 上使用，具備 **1M token 輸入上下文**、128K 輸出，以及推理、視覺和工具使用支援。

請使用 `bedrock_mantle/` 路由前綴搭配標準 AWS 憑證。

### /messages {#messages}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import asyncio
import litellm
import os

os.environ['AWS_ACCESS_KEY_ID'] = "your-aws-access-key"
os.environ['AWS_SECRET_ACCESS_KEY'] = "your-aws-secret-key"
os.environ['AWS_REGION_NAME'] = "us-east-1"

async def main():
    response = await litellm.anthropic_messages(
        model="bedrock_mantle/anthropic.claude-mythos-preview",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Explain quantum entanglement simply."}],
    )
    print(response)

asyncio.run(main())
```

</TabItem>
<TabItem value="ai-gateway" label="AI Gateway">

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: claude-mythos
    litellm_params:
      model: bedrock_mantle/anthropic.claude-mythos-preview
      aws_region_name: us-east-1
```

**2. 啟動 LiteLLM AI Gateway**

```shell
litellm --config /path/to/config.yaml
```

**3. 透過 curl 呼叫 `/v1/messages`**

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-mythos",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain quantum entanglement simply."}
    ]
  }'
```

</TabItem>
</Tabs>

### /chat/completions {#chatcompletions}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['AWS_ACCESS_KEY_ID'] = "your-aws-access-key"
os.environ['AWS_SECRET_ACCESS_KEY'] = "your-aws-secret-key"
os.environ['AWS_REGION_NAME'] = "us-east-1"

response = completion(
    model="bedrock_mantle/anthropic.claude-mythos-preview",
    messages=[{"role": "user", "content": "Explain quantum entanglement simply."}],
)
print(response)
```

</TabItem>
<TabItem value="ai-gateway-chat" label="AI Gateway">

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: claude-mythos
    litellm_params:
      model: bedrock_mantle/anthropic.claude-mythos-preview
      aws_region_name: us-east-1
```

**2. 啟動 LiteLLM AI Gateway**

```shell
litellm --config /path/to/config.yaml
```

**3. 透過 curl 呼叫 `/v1/chat/completions`**

```bash
curl -X POST http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-mythos",
    "messages": [
      {"role": "user", "content": "Explain quantum entanglement simply."}
    ]
  }'
```

</TabItem>
</Tabs>

## /v1/messages 上的 Claude 模型 {#claude-models-on-v1messages}

每個 `bedrock_mantle/anthropic.claude-*` 模型（包括 Claude Mythos）都透過 Bedrock Mantle 的原生 Anthropic Messages 端點 `/v1/messages` 提供服務，`https://bedrock-mantle.{region}.api.aws/anthropic/v1/messages`，而不是經由 chat completions 橋接；Mantle 會拒絕 Claude 模型的這種方式。這是 Claude Code 和 Anthropic SDK 所連線的介面，而 LiteLLM 會以 Anthropic 自己的 wire format 轉送請求，因此串流、工具和 thinking 都會直接通過。其他 Mantle 模型，例如下面的 GPT 模型，則仍使用 `/v1/messages` 上的 Responses API 橋接

請使用原始的 Mantle model id，例如 `bedrock_mantle/anthropic.{{anthropic}}` 或 `bedrock_mantle/anthropic.claude-haiku-4-5`。帶有 `us.` inference-profile 前綴會從 Mantle 返回 404

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import asyncio
import litellm
import os

os.environ['AWS_ACCESS_KEY_ID'] = "your-aws-access-key"
os.environ['AWS_SECRET_ACCESS_KEY'] = "your-aws-secret-key"
os.environ['AWS_REGION_NAME'] = "us-east-2"

async def main():
    response = await litellm.anthropic_messages(
        model="bedrock_mantle/anthropic.{{anthropic}}",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Explain quantum entanglement simply."}],
    )
    print(response)

asyncio.run(main())
```

</TabItem>
<TabItem value="ai-gateway" label="AI Gateway">

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-mantle
    litellm_params:
      model: bedrock_mantle/anthropic.{{anthropic}}
      aws_region_name: us-east-2
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
```

**2. 啟動 LiteLLM AI Gateway**

```shell
litellm --config /path/to/config.yaml
```

**3. 透過 curl 呼叫 `/v1/messages`**

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-sonnet-mantle",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain quantum entanglement simply."}
    ]
  }'
```

</TabItem>
</Tabs>

region 來源依序為 `aws_region_name`，否則為模型名稱中的 region 前綴（`bedrock_mantle/us-east-2/anthropic.{{anthropic}}`），再否則為 `api_base` 或 `BEDROCK_MANTLE_API_BASE` 的主機（當其指向 Mantle 時），再否則為 `BEDROCK_MANTLE_REGION`、`AWS_REGION_NAME` 或 `AWS_REGION`，最後為 `us-east-1`。自訂 `api_base`（位於 Mantle 前方的 VPC endpoint 或 proxy）會保留為主機，並在其上附加 `/anthropic/v1/messages`，無論其設定時是否帶有 `/openai/v1` 或 `/v1` 後綴

驗證方式與此提供者的其他部分相同：當設定了 `api_key`、`BEDROCK_MANTLE_API_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK` 時，使用其 bearer token，否則使用來自 `aws_access_key_id` / `aws_secret_access_key` / `aws_session_token`、`aws_profile_name` 或角色參數的 SigV4。LiteLLM 會在每個請求上送出 `anthropic-version: 2023-06-01`，而呼叫端提供的 `anthropic-version` 標頭會優先採用

Beta 功能透過 `anthropic-beta` 標頭傳遞：包含呼叫端送出的值以及請求所需的值（`context_management` 編輯會新增 `context-management-2025-06-27`），並限制為 Mantle 接受的內容。Mantle 不認識的值會被略去，而不是讓請求以 400 失敗；且 body `anthropic_beta` 欄位不會送出任何內容，而當標頭存在時，Mantle 會忽略該欄位

健康檢查使用相同的介面。`/health` 和 Admin UI 的 Test Connection 按鈕會以小型 `bedrock_mantle/anthropic.claude-*` 請求探測 `/v1/messages` deployment，不需要 `model_info.mode`。請參閱 [模型模式](../proxy/health.md#model-modes)

## OpenAI 模型 (GPT-5.4 / GPT-5.5) {#openai-models-gpt-54--gpt-55}

### /responses {#responses}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
import os

os.environ['BEDROCK_MANTLE_API_KEY'] = "your-bedrock-api-key"
os.environ['BEDROCK_MANTLE_REGION'] = "us-east-2"

response = litellm.responses(
    model="bedrock_mantle/openai.{{openai_large}}",
    input="Hello! How can you help me today?",
)
print(response)
```

#### 串流 {#streaming}

```python
import litellm
import os

os.environ['BEDROCK_MANTLE_API_KEY'] = "your-bedrock-api-key"

response = litellm.responses(
    model="bedrock_mantle/openai.{{openai_large}}",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True,
)

for event in response:
    print(event)
```

</TabItem>
<TabItem value="ai-gateway" label="AI Gateway">

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: gpt-5.5-mantle
    litellm_params:
      model: bedrock_mantle/openai.{{openai_large}}
      api_key: os.environ/BEDROCK_MANTLE_API_KEY
      api_base: https://bedrock-mantle.us-east-2.api.aws/v1
```

**2. 啟動 LiteLLM AI Gateway**

```shell
litellm --config /path/to/config.yaml
```

**3. 透過 curl 呼叫 `/v1/responses`**

```bash
curl -X POST http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "gpt-5.5-mantle",
    "input": "Hello! How can you help me today?"
  }'
```

**4. 或使用 OpenAI SDK**

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000",
)

response = client.responses.create(
    model="gpt-5.5-mantle",
    input="Hello! How can you help me today?",
)
print(response)
```

</TabItem>
</Tabs>

## API 金鑰 {#api-key}

```python
# env variable
os.environ['BEDROCK_MANTLE_API_KEY'] = "your-aws-bedrock-api-key"

# optional: override region (defaults to us-east-1)
os.environ['BEDROCK_MANTLE_REGION'] = "us-east-1"  # or use AWS_REGION
```

## 支援的模型 {#supported-models}

| 模型 | 端點 | Context Window | 輸入（每 1M tokens） | 輸出（每 1M tokens） |
|-------|----------|---------------|----------------------|------------------------|
| `openai.gpt-5.5` | `/responses` | 1.05M | $5.50 | $33.00 |
| `openai.gpt-5.4` | `/responses` | 1.05M | $2.75 | $16.50 |
| `openai.gpt-oss-120b` | `/chat/completions` | 131K | $0.15 | $0.60 |
| `openai.gpt-oss-20b` | `/chat/completions` | 131K | $0.07 | $0.30 |
| `openai.gpt-oss-safeguard-120b` | `/chat/completions` | 131K | $0.15 | $0.60 |
| `openai.gpt-oss-safeguard-20b` | `/chat/completions` | 131K | $0.07 | $0.20 |

## 範例用法 {#sample-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['BEDROCK_MANTLE_API_KEY'] = "your-bedrock-api-key"

response = completion(
    model="bedrock_mantle/openai.gpt-oss-120b",
    messages=[{"role": "user", "content": "hello from litellm"}],
)
print(response)
```

</TabItem>
<TabItem value="streaming" label="Streaming">

```python
from litellm import completion
import os

os.environ['BEDROCK_MANTLE_API_KEY'] = "your-bedrock-api-key"

response = completion(
    model="bedrock_mantle/openai.gpt-oss-120b",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

</TabItem>
<TabItem value="async" label="Async">

```python
import asyncio
from litellm import acompletion
import os

os.environ['BEDROCK_MANTLE_API_KEY'] = "your-bedrock-api-key"

async def main():
    response = await acompletion(
        model="bedrock_mantle/openai.gpt-oss-120b",
        messages=[{"role": "user", "content": "hello from litellm"}],
    )
    print(response)

asyncio.run(main())
```

</TabItem>
</Tabs>

## 區域設定 {#region-configuration}

API 基礎 URL 為 `https://bedrock-mantle.{region}.api.aws/v1`。區域會依下列順序解析：

1. 部署上的 `aws_region_name`（或作為 kwarg 傳入）
2. 模型名稱中的 region 前綴，例如 `bedrock_mantle/us-gov-west-1/xai.grok-4.3`
3. `BEDROCK_MANTLE_REGION` 環境變數
4. `AWS_REGION_NAME` 環境變數，然後是 `AWS_REGION`
5. 預設：`us-east-1`

明確指定的 `api_base`（或 `BEDROCK_MANTLE_API_BASE`）會完全取代推導出的 URL。模型名稱前綴會在請求送出前被移除，因此 `bedrock_mantle/us-gov-west-1/xai.grok-4.3` 會在 `xai.grok-4.3` 於 `us-gov-west-1` 中發出呼叫；LiteLLM 已知其對應 Bedrock 的 region 時可辨識，且 `aws_region_name` 可適用於所有 region。`/v1/messages` 上的 Claude 模型會使用 `/anthropic/v1/messages` 路徑，而不是 `/v1`，並保留自訂 `api_base` 作為主機，請參閱 [Claude Models on /v1/messages](#claude-models-on-v1messages)

**支援的 region：** `us-east-1`、`us-east-2`、`us-west-2`、`eu-west-1`、`eu-west-2`、`eu-central-1`、`eu-south-1`、`eu-north-1`、`ap-northeast-1`、`ap-south-1`、`ap-southeast-3`、`sa-east-1`，以及 `us-gov-west-1`（AWS GovCloud）

```python
import os
os.environ['BEDROCK_MANTLE_REGION'] = "eu-west-1"

# or pass api_base directly
response = completion(
    model="bedrock_mantle/openai.gpt-oss-120b",
    messages=[{"role": "user", "content": "hello"}],
    api_base="https://bedrock-mantle.eu-west-1.api.aws/v1",
)
```

### GovCloud 定價 {#govcloud-pricing}

成本追蹤會使用實際提供服務的 region。當價格對照表中有 `bedrock_mantle/{region}/{model}` 的資料列時（目前為 `us-gov-west-1` 這些資料列），無論 region 是來自 `aws_region_name` 還是模型前綴，都會以該資料列而非商業版資料列為該請求定價。以下兩個 deployment 都會以 GovCloud 費率計費 `xai.grok-4.3`：

```yaml
model_list:
  - model_name: grok-4.3-gov
    litellm_params:
      model: bedrock_mantle/xai.grok-4.3
      aws_region_name: us-gov-west-1
      aws_access_key_id: os.environ/AWS_GOV_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_GOV_SECRET_ACCESS_KEY
  - model_name: grok-4.3-gov-prefixed
    litellm_params:
      model: bedrock_mantle/us-gov-west-1/xai.grok-4.3
      aws_access_key_id: os.environ/AWS_GOV_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_GOV_SECRET_ACCESS_KEY
```

設定了 `base_model` 或其自身 `input_cost_per_token` / `output_cost_per_token` 的 deployment，會僅依該資料列定價；不會再額外套用實際提供服務的 region

## 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy}

### 1. 在 config.yaml 上設定 Bedrock Mantle 模型 {#1-set-bedrock-mantle-models-on-configyaml}

```yaml
model_list:
  - model_name: gpt-5.5-mantle
    litellm_params:
      model: bedrock_mantle/openai.{{openai_large}}
      api_key: os.environ/BEDROCK_MANTLE_API_KEY
      api_base: "https://bedrock-mantle.us-east-2.api.aws/v1"

  - model_name: gpt-oss-120b
    litellm_params:
      model: bedrock_mantle/openai.gpt-oss-120b
      api_key: os.environ/BEDROCK_MANTLE_API_KEY
      # optional region override:
      api_base: "https://bedrock-mantle.us-east-1.api.aws/v1"

  - model_name: gpt-oss-20b
    litellm_params:
      model: bedrock_mantle/openai.gpt-oss-20b
      api_key: os.environ/BEDROCK_MANTLE_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```shell
litellm --config /path/to/config.yaml
```

### 3. 傳送請求 {#3-send-a-request}

```python
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000",
)

response = client.chat.completions.create(
    model="gpt-oss-120b",
    messages=[{"role": "user", "content": "hello from litellm"}],
)
print(response)
```
