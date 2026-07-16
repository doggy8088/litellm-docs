# Llama2 - Huggingface 教學  {#llama2---huggingface-tutorial}
[Huggingface](https://huggingface.co/) 是一個用來部署機器學習模型的開源平台。 

## 使用 Huggingface Inference Endpoints 呼叫 Llama2  {#call-llama2-with-huggingface-inference-endpoints}
LiteLLM 可讓您輕鬆呼叫公開、私有或預設的 huggingface 端點。 

在這個案例中，我們來試著呼叫 3 個模型：  

| 模型                                   | 端點類型 |
| --------------------------------------- | ---------------- |
| deepset/deberta-v3-large-squad2         | [預設 Huggingface 端點](#case-1-call-default-huggingface-endpoint) |
| meta-llama/Llama-2-7b-hf                | [公開端點](#case-2-call-llama2-public-huggingface-endpoint)              |
| meta-llama/Llama-2-7b-chat-hf           | [私有端點](#case-3-call-llama2-private-huggingface-endpoint)             |

### 情境 1：呼叫預設的 huggingface 端點 {#case-1-call-default-huggingface-endpoint}

完整範例如下：

```python
from litellm import completion 

model = "deepset/deberta-v3-large-squad2"
messages = [{"role": "user", "content": "Hey, how's it going?"}] # LiteLLM follows the OpenAI format 

### CALLING ENDPOINT
completion(model=model, messages=messages, custom_llm_provider="huggingface")
```

這裡發生了什麼？ 
- model：這是 Huggingface 上已部署模型的名稱 
- messages：這是輸入。我們接受 OpenAI chat 格式。對於 huggingface，預設會逐一迭代清單，並將 message["content"] 加入 prompt。[相關程式碼](https://github.com/BerriAI/litellm/blob/6aff47083be659b80e00cb81eb783cb24db2e183/litellm/llms/huggingface_restapi.py#L46)
- custom_llm_provider：選用參數。這是選用旗標，僅在 Azure、Replicate、Huggingface 和 Together-ai（您部署自己模型的平台）時需要。這可讓 litellm 將路由導向正確的提供者，以對應您的模型。 

### 情境 2：呼叫 Llama2 公開 Huggingface 端點 {#case-2-call-llama2-public-huggingface-endpoint}

我們已將 `meta-llama/Llama-2-7b-hf` 部署在一個公開端點後方 - `https://ag3dkq4zui5nu8g3.us-east-1.aws.endpoints.huggingface.cloud`。

讓我們來試試： 
```python
from litellm import completion 

model = "meta-llama/Llama-2-7b-hf"
messages = [{"role": "user", "content": "Hey, how's it going?"}] # LiteLLM follows the OpenAI format 
api_base = "https://ag3dkq4zui5nu8g3.us-east-1.aws.endpoints.huggingface.cloud"

### CALLING ENDPOINT
completion(model=model, messages=messages, custom_llm_provider="huggingface", api_base=api_base)
```

這裡發生了什麼？ 
- api_base：選用參數。由於這裡使用的是已部署端點（不是 [預設的 huggingface inference endpoint](https://github.com/BerriAI/litellm/blob/6aff47083be659b80e00cb81eb783cb24db2e183/litellm/llms/huggingface_restapi.py#L35)），因此我們將它傳給 LiteLLM。 

### 情境 3：呼叫 Llama2 私有 Huggingface 端點 {#case-3-call-llama2-private-huggingface-endpoint}

這與公開端點唯一的差別在於，您需要一個 `api_key`。 

在 LiteLLM 上，您可以透過 3 種方式傳入 api_key。 

可透過環境變數、將其設為套件變數，或在呼叫 `completion()` 時傳入。 

**透過環境變數設定**  
以下是您需要加入的 1 行程式碼 
```python
os.environ["HF_TOKEN"] = "..."
```

以下是完整程式碼： 
```python
from litellm import completion 

os.environ["HF_TOKEN"] = "..."

model = "meta-llama/Llama-2-7b-hf"
messages = [{"role": "user", "content": "Hey, how's it going?"}] # LiteLLM follows the OpenAI format 
api_base = "https://ag3dkq4zui5nu8g3.us-east-1.aws.endpoints.huggingface.cloud"

### CALLING ENDPOINT
completion(model=model, messages=messages, custom_llm_provider="huggingface", api_base=api_base)
```

**將其設為套件變數**  
以下是您需要加入的 1 行程式碼 
```python
litellm.huggingface_key = "..."
```

以下是完整程式碼： 
```python
import litellm
from litellm import completion 

litellm.huggingface_key = "..."

model = "meta-llama/Llama-2-7b-hf"
messages = [{"role": "user", "content": "Hey, how's it going?"}] # LiteLLM follows the OpenAI format 
api_base = "https://ag3dkq4zui5nu8g3.us-east-1.aws.endpoints.huggingface.cloud"

### CALLING ENDPOINT
completion(model=model, messages=messages, custom_llm_provider="huggingface", api_base=api_base)
```

**在 completion 呼叫時傳入**  
```python
completion(..., api_key="...")
```

以下是完整程式碼： 

```python
from litellm import completion 

model = "meta-llama/Llama-2-7b-hf"
messages = [{"role": "user", "content": "Hey, how's it going?"}] # LiteLLM follows the OpenAI format 
api_base = "https://ag3dkq4zui5nu8g3.us-east-1.aws.endpoints.huggingface.cloud"

### CALLING ENDPOINT
completion(model=model, messages=messages, custom_llm_provider="huggingface", api_base=api_base, api_key="...")
```
