import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI - 自行部署模型 {#vertex-ai---self-deployed-models}

透過 Model Garden 或自訂端點，在 Vertex AI 上部署並使用您自己的模型。

## Model Garden {#model-garden}

:::tip

Vertex Model Garden 中所有與 OpenAI 相容的模型皆受支援。 

:::

### 使用 Model Garden {#using-model-garden}

**幾乎所有 Vertex Model Garden 模型都與 OpenAI 相容。**

<Tabs>

<TabItem value="openai" label="OpenAI 相容模型">

| 屬性 | 詳細資料 |
|----------|---------|
| 提供者路由 | `vertex_ai/openai/{MODEL_ID}` |
| Vertex 文件 | [Model Garden LiteLLM 推論](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/open-models/use-cases/model_garden_litellm_inference.ipynb), [Vertex Model Garden](https://cloud.google.com/model-garden?hl=en) |
| 支援的操作 | `/chat/completions`, `/embeddings` |

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

## set ENV variables
os.environ["VERTEXAI_PROJECT"] = "hardy-device-38811"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = completion(
  model="vertex_ai/openai/<your-endpoint-id>", 
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml
model_list:
    - model_name: llama3-1-8b-instruct
      litellm_params:
        model: vertex_ai/openai/5464397967697903616
        vertex_ai_project: "my-test-project"
        vertex_ai_location: "us-east-1"
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "llama3-1-8b-instruct", # 👈 the 'model_name' in config
            "messages": [
                {
                "role": "user",
                "content": "what llm are you"
                }
            ],
        }'
```


</TabItem>

</Tabs>

</TabItem>

<TabItem value="non-openai" label="非 OpenAI 相容模型">

```python
from litellm import completion
import os

## set ENV variables
os.environ["VERTEXAI_PROJECT"] = "hardy-device-38811"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = completion(
  model="vertex_ai/<your-endpoint-id>", 
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>

</Tabs>

## Gemma 模型（自訂端點） {#gemma-models-custom-endpoints}

在具備 OpenAI 相容格式的自訂 Vertex AI 預測端點上部署 Gemma 模型。

| 屬性 | 詳細資料 |
|----------|---------|
| 提供者路由 | `vertex_ai/gemma/{MODEL_NAME}` |
| Vertex 文件 | [Vertex AI Prediction](https://cloud.google.com/vertex-ai/docs/predictions/get-predictions) |
| 必要參數 | `api_base` - 完整的預測端點 URL |

**Proxy 使用方式：**

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: gemma-model
    litellm_params:
      model: vertex_ai/gemma/gemma-3-12b-it-1222199011122
      api_base: https://ENDPOINT.us-central1-PROJECT.prediction.vertexai.goog/v1/projects/PROJECT_ID/locations/us-central1/endpoints/ENDPOINT_ID:predict
      vertex_project: "my-project-id"
      vertex_location: "us-central1"
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試它**

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemma-model",
    "messages": [{"role": "user", "content": "What is machine learning?"}],
    "max_tokens": 100
  }'
```

**SDK 使用方式：**

```python
from litellm import completion

response = completion(
    model="vertex_ai/gemma/gemma-3-12b-it-1222199011122",
    messages=[{"role": "user", "content": "What is machine learning?"}],
    api_base="https://ENDPOINT.us-central1-PROJECT.prediction.vertexai.goog/v1/projects/PROJECT_ID/locations/us-central1/endpoints/ENDPOINT_ID:predict",
    vertex_project="my-project-id",
    vertex_location="us-central1",
)
```

## MedGemma 模型（自訂端點） {#medgemma-models-custom-endpoints}

在具備 OpenAI 相容格式的自訂 Vertex AI 預測端點上部署 MedGemma 模型。MedGemma 模型使用相同的 `vertex_ai/gemma/` 路由。

| 屬性 | 詳細資料 |
|----------|---------|
| 提供者路由 | `vertex_ai/gemma/{MODEL_NAME}` |
| Vertex 文件 | [Vertex AI Prediction](https://cloud.google.com/vertex-ai/docs/predictions/get-predictions) |
| 必要參數 | `api_base` - 完整的預測端點 URL |

**Proxy 使用方式：**

**1. 新增至 config.yaml**

```yaml
model_list:
  - model_name: medgemma-model
    litellm_params:
      model: vertex_ai/gemma/medgemma-2b-v1
      api_base: https://ENDPOINT.us-central1-PROJECT.prediction.vertexai.goog/v1/projects/PROJECT_ID/locations/us-central1/endpoints/ENDPOINT_ID:predict
      vertex_project: "my-project-id"
      vertex_location: "us-central1"
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試它**

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "medgemma-model",
    "messages": [{"role": "user", "content": "What are the symptoms of hypertension?"}],
    "max_tokens": 100
  }'
```

**SDK 使用方式：**

```python
from litellm import completion

response = completion(
    model="vertex_ai/gemma/medgemma-2b-v1",
    messages=[{"role": "user", "content": "What are the symptoms of hypertension?"}],
    api_base="https://ENDPOINT.us-central1-PROJECT.prediction.vertexai.goog/v1/projects/PROJECT_ID/locations/us-central1/endpoints/ENDPOINT_ID:predict",
    vertex_project="my-project-id",
    vertex_location="us-central1",
)
```
