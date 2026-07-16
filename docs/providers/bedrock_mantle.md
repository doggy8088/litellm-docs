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
    model="bedrock_mantle/openai.gpt-5.5",
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
    model="bedrock_mantle/openai.gpt-5.5",
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
      model: bedrock_mantle/openai.gpt-5.5
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
    api_key="sk-1234",
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

| 模型 | 端點 | 上下文視窗 | 輸入（每 1M tokens） | 輸出（每 1M tokens） |
|-------|----------|---------------|----------------------|------------------------|
| `openai.gpt-5.5` | `/responses` | 272K | $5.50 | $33.00 |
| `openai.gpt-5.4` | `/responses` | 272K | $2.75 | $16.50 |
| `openai.gpt-oss-120b` | `/chat/completions` | 131K | $0.15 | $0.60 |
| `openai.gpt-oss-20b` | `/chat/completions` | 131K | $0.075 | $0.30 |
| `openai.gpt-oss-safeguard-120b` | `/chat/completions` | 131K | $0.15 | $0.60 |
| `openai.gpt-oss-safeguard-20b` | `/chat/completions` | 131K | $0.075 | $0.30 |

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

1. `BEDROCK_MANTLE_REGION` 環境變數
2. `AWS_REGION` 環境變數
3. 預設：`us-east-1`

**支援的區域：** `us-east-1`, `us-east-2`, `us-west-2`, `eu-west-1`, `eu-west-2`, `eu-central-1`, `eu-south-1`, `eu-north-1`, `ap-northeast-1`, `ap-south-1`, `ap-southeast-3`, `sa-east-1`

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

## 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy}

### 1. 在 config.yaml 上設定 Bedrock Mantle 模型 {#1-set-bedrock-mantle-models-on-configyaml}

```yaml
model_list:
  - model_name: gpt-5.5-mantle
    litellm_params:
      model: bedrock_mantle/openai.gpt-5.5
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
