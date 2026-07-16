import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Perplexity 嵌入 {#perplexity-embeddings}

https://docs.perplexity.ai/docs/embeddings/quickstart

LiteLLM 支援 Perplexity 的 pplx-embed 嵌入模型，用於網路規模的文字擷取。

## API 金鑰 {#api-key}

```python
# env variable
os.environ['PERPLEXITYAI_API_KEY']
```

## 範例用法 - 嵌入 {#sample-usage---embedding}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os

os.environ['PERPLEXITYAI_API_KEY'] = ""

response = embedding(
    model="perplexity/pplx-embed-v1-0.6b",
    input=["good morning from litellm"],
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: pplx-embed-v1-0.6b
    litellm_params:
      model: perplexity/pplx-embed-v1-0.6b
      api_key: os.environ/PERPLEXITYAI_API_KEY
  - model_name: pplx-embed-v1-4b
    litellm_params:
      model: perplexity/pplx-embed-v1-4b
      api_key: os.environ/PERPLEXITYAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "pplx-embed-v1-0.6b",
    "input": ["good morning from litellm"]
  }'
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

Perplexity embeddings 支援以下選用參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `dimensions` | int | 輸出嵌入維度。0.6b 模型為 128–1024，4b 模型為 128–2560。預設為最大值。 |
| `encoding_format` | string | `"base64_int8"`（預設）或 `"base64_binary"`，用於壓縮輸出。 |

### 含參數的範例 {#example-with-parameters}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os

os.environ['PERPLEXITYAI_API_KEY'] = ""

response = embedding(
    model="perplexity/pplx-embed-v1-4b",
    input=["Your text here"],
    dimensions=512,
)
print(f"Embedding dimensions: {len(response.data[0]['embedding'])}")
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```bash
curl http://0.0.0.0:4000/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "pplx-embed-v1-4b",
    "input": ["Your text here"],
    "dimensions": 512
  }'
```

</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

[Perplexity Embeddings 文件](https://docs.perplexity.ai/docs/embeddings/quickstart)中列出的所有模型都支援。使用 `model=perplexity/<model-name>`。

| 模型名稱 | 維度 | 最大 Tokens | 價格（每 100 萬 tokens） | 函式呼叫 |
|---|---|---|---|---|
| pplx-embed-v1-0.6b | 1024 | 32K | $0.004 | `embedding(model="perplexity/pplx-embed-v1-0.6b", input)` |
| pplx-embed-v1-4b | 2560 | 32K | $0.03 | `embedding(model="perplexity/pplx-embed-v1-4b", input)` |

### 主要規格 {#key-specifications}

- **每次請求最多文字數：** 512
- **每個輸入最多 tokens：** 32,768
- **合併請求上限：** 120,000 tokens
- **Matryoshka 維度縮減** — 將維度降至 128+，以加快搜尋並減少儲存空間
- **不需要指令前綴** — 直接嵌入文字
- **未正規化嵌入** — 比較時使用 cosine similarity
