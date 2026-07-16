import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS Bedrock - 圖像生成 {#aws-bedrock---image-generation}

使用 Bedrock 搭配 Stable Diffusion、Amazon Titan Image Generator 和 Amazon Nova Canvas 模型進行圖像生成。

## 支援的模型 {#supported-models}

| 模型名稱 | 函式呼叫 | 成本追蹤 |
|-------------------------|---------------------------------------------|---------------|
| Stable Diffusion 3 - v0 | `image_generation(model="bedrock/stability.stability.sd3-large-v1:0", prompt=prompt)` | ✅ |
| Stable Diffusion - v0   | `image_generation(model="bedrock/stability.stable-diffusion-xl-v0", prompt=prompt)` | ✅ |
| Stable Diffusion - v1   | `image_generation(model="bedrock/stability.stable-diffusion-xl-v1", prompt=prompt)` | ✅ |
| Amazon Titan Image Generator - v1 | `image_generation(model="bedrock/amazon.titan-image-generator-v1", prompt=prompt)` | ✅ |
| Amazon Titan Image Generator - v2 | `image_generation(model="bedrock/amazon.titan-image-generator-v2:0", prompt=prompt)` | ✅ |
| Amazon Nova Canvas - v1 | `image_generation(model="bedrock/amazon.nova-canvas-v1:0", prompt=prompt)` | ✅ |

## 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### 基本用法 {#basic-usage}

```python
import os
from litellm import image_generation

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = image_generation(
    prompt="A cute baby sea otter",
    model="bedrock/stability.stable-diffusion-xl-v0",
)
print(f"response: {response}")
```

### 設定選用參數 {#set-optional-parameters}

```python
import os
from litellm import image_generation

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = image_generation(
    prompt="A cute baby sea otter",
    model="bedrock/stability.stable-diffusion-xl-v0",
    ### OPENAI-COMPATIBLE ###
    size="128x512", # width=128, height=512
    ### PROVIDER-SPECIFIC ### see `AmazonStabilityConfig` in bedrock.py for all params
    seed=30
)
print(f"response: {response}")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: amazon.nova-canvas-v1:0
    litellm_params:
      model: bedrock/amazon.nova-canvas-v1:0
      aws_region_name: "us-east-1"
      aws_secret_access_key: my-key # OPTIONAL - all boto3 auth params supported
      aws_secret_access_id: my-id # OPTIONAL - all boto3 auth params supported
```

### 2. 啟動 proxy  {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試它！  {#3-test-it}

**文字轉圖像：**

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_VIRTUAL_KEY' \
-d '{
    "model": "amazon.nova-canvas-v1:0",
    "prompt": "A cute baby sea otter"
}'
```

**色彩引導生成：**

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_VIRTUAL_KEY' \
-d '{
    "model": "amazon.nova-canvas-v1:0",
    "prompt": "A cute baby sea otter",
    "taskType": "COLOR_GUIDED_GENERATION",
    "colorGuidedGenerationParams":{"colors":["#FFFFFF"]}
}'
```

</TabItem>
</Tabs>

## Amazon Nova Canvas - 圖像編輯 {#amazon-nova-canvas---image-edit}

搭配 Bedrock Nova Canvas（`amazon.nova-canvas-v1:0`）使用與 OpenAI 相容的 `image_edit()`。請求使用與生成相同的 `InvokeModel` API；LiteLLM 會將輸入映射到 [Nova Canvas task types](https://docs.aws.amazon.com/nova/latest/userguide/image-gen-access.html)：

| 情境 | 傳送至 Bedrock 的 `taskType` |
|----------|----------------------------|
| 圖像 + 提示詞（無遮罩） | `IMAGE_VARIATION` |
| 圖像 + 提示詞 + 遮罩 | `INPAINTING`（`inPaintingParams.image`、`maskImage` 或 `maskPrompt`） |
| `taskType: OUTPAINTING` + `mask` 或 `maskPrompt` | `OUTPAINTING`（Bedrock 需要其中一個；如果兩者都缺少，LiteLLM 會清楚地報錯） |
| `taskType: BACKGROUND_REMOVAL` | `BACKGROUND_REMOVAL` |

```python
from litellm import image_edit

response = image_edit(
    image=open("photo.png", "rb"),
    prompt="Add soft sunset lighting",
    model="bedrock/amazon.nova-canvas-v1:0",
)
```

對於 **`BACKGROUND_REMOVAL`**，AWS 請求不得包含 `imageGenerationConfig`；即使您傳入 `size`、`n`、`seed` 等，LiteLLM 也會在該任務中省略它。用於圖像編輯的其他 Nova Canvas inference IDs 應在 `model_prices_and_context_window.json` 中設定 **`supports_nova_canvas_image_edit`: true**（請參閱 `amazon.nova-canvas-v1:0`）。

## 使用圖像生成的 Inference Profiles {#using-inference-profiles-with-image-generation}

對於帶有圖像生成功能的 AWS Bedrock Application Inference Profiles，請使用 `model_id` 參數來指定 inference profile ARN：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import image_generation

response = image_generation(
    model="bedrock/amazon.nova-canvas-v1:0",
    model_id="arn:aws:bedrock:eu-west-1:000000000000:application-inference-profile/a0a0a0a0a0a0",
    prompt="A cute baby sea otter"
)
print(f"response: {response}")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: nova-canvas-inference-profile
    litellm_params:
      model: bedrock/amazon.nova-canvas-v1:0
      model_id: arn:aws:bedrock:eu-west-1:000000000000:application-inference-profile/a0a0a0a0a0a0
      aws_region_name: "eu-west-1"
```

</TabItem>
</Tabs>

## 驗證 {#authentication}

圖像生成支援所有標準 Bedrock 驗證方法。詳情請參閱 [Bedrock Authentication](./bedrock#boto3---authentication)。
