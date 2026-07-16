import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 嵌入 - `/embeddings` {#embeddings---embeddings}

請參閱支援的 Embedding 提供者與模型 [這裡](https://docs.litellm.ai/docs/embedding/supported_embedding)

## 支援的輸入格式 {#supported-input-formats}

`/v1/embeddings` 端點遵循 [OpenAI embeddings API 規格](https://platform.openai.com/docs/api-reference/embeddings/create)。支援以下輸入格式：

| 格式 | 範例 |
|--------|---------|
| 字串 | `"input": "Hello"` |
| 字串陣列 | `"input": ["Hello", "World"]` |
| token 陣列（整數） | `"input": [1234, 5678, 9012]` |
| token 陣列的陣列 | `"input": [[1234, 5678], [9012, 3456]]` |

## 快速開始 {#quick-start}
以下示範如何在 proxy 伺服器上於 GPT-J embedding（sagemaker endpoint）、Amazon Titan embedding（Bedrock）與 Azure OpenAI embedding 之間進行路由： 

1. 在您的 config.yaml 中設定 models
```yaml
model_list:
  - model_name: sagemaker-embeddings
    litellm_params: 
      model: "sagemaker/berri-benchmarking-gpt-j-6b-fp16"
  - model_name: amazon-embeddings
    litellm_params:
      model: "bedrock/amazon.titan-embed-text-v1"
  - model_name: azure-embeddings
    litellm_params: 
      model: "azure/azure-embedding-model"
      api_base: "os.environ/AZURE_API_BASE" # os.getenv("AZURE_API_BASE")
      api_key: "os.environ/AZURE_API_KEY" # os.getenv("AZURE_API_KEY")
      api_version: "2023-07-01-preview"

general_settings:
  master_key: sk-1234 # [OPTIONAL] if set all calls to proxy will require either this key or a valid generated token
```

2. 啟動 proxy
```shell
$ litellm --config /path/to/config.yaml
```

3. 測試 embedding 請求

```shell
curl --location 'http://0.0.0.0:4000/v1/embeddings' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "input": "The food was delicious and the waiter..",
    "model": "sagemaker-embeddings",
}'
```
## 預設 `encoding_format` {#embedding-encoding-format}

對於透過 LiteLLM 的 **OpenAI 相容 embedding 路徑** 路由的 embeddings（例如 OpenAI models、`openai/...` 搭配自訂 `api_base`，或是將請求轉送至該路徑的 proxy `/v1/embeddings` 路由），當呼叫端省略時，LiteLLM 會傳送明確的 `encoding_format`。

**解析順序**（先符合者優先）：

1. embedding 請求本文中的值（JSON 中的 `encoding_format`）。
2. 來自 `litellm_params.encoding_format` 於 `config.yaml` 的每個模型預設值。
3. 程序環境變數 **`LITELLM_DEFAULT_EMBEDDING_ENCODING_FORMAT`**（例如 `float` 或 `base64`）。
4. 備援 **`float`**。

您仍然可以從任何 OpenAI 相容用戶端針對每個請求進行覆寫：

```bash
curl --location 'http://0.0.0.0:4000/v1/embeddings' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{"model": "my-embedding-model", "input": "hello", "encoding_format": "base64"}'
```

另請參閱：[設定選項](./config_settings.md)（`LITELLM_DEFAULT_EMBEDDING_ENCODING_FORMAT`）。
