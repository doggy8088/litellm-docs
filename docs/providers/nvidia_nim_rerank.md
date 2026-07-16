import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nvidia NIM - 重新排序 {#nvidia-nim---rerank}

透過 LiteLLM 使用 Nvidia NIM Rerank 模型。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Nvidia NIM 為語意搜尋與檢索增強生成（RAG）提供高效能的重新排序模型 |
| 提供者文件 | [Nvidia NIM Rerank API ↗](https://docs.api.nvidia.com/nim/reference/nvidia-llama-3_2-nv-rerankqa-1b-v2-infer) |
| 支援的端點 | `/rerank` |

## 概覽 {#overview}

Nvidia NIM 重新排序模型可協助您：
- 依據與查詢的相關性重新排序搜尋結果
- 提升 RAG（檢索增強生成）準確度
- 有效率地篩選並排序大量文件集

**支援的模型：**
- 平台上所有 Nvidia NIM 重新排序模型

:::tip

請參閱 [Nvidia NIM](https://models.litellm.ai) 上 LiteLLM 支援的 Nvidia NIM 重新排序模型完整清單

:::

## 使用方式 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="llama-1b" label="LLaMa 1B 模型">

```python
import litellm
import os

os.environ['NVIDIA_NIM_API_KEY'] = "nvapi-..."

response = litellm.rerank(
    model="nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2",
    query="What is the GPU memory bandwidth of H100 SXM?",
    documents=[
        "The Hopper GPU is paired with the Grace CPU using NVIDIA's ultra-fast chip-to-chip interconnect, delivering 900GB/s of bandwidth.",
        "A100 provides up to 20X higher performance over the prior generation.",
        "Accelerated servers with H100 deliver 3 terabytes per second (TB/s) of memory bandwidth per GPU."
    ],
    top_n=3,
)

print(response)
```

</TabItem>
<TabItem value="mistral-4b" label="Mistral 4B 模型">

```python
import litellm
import os

os.environ['NVIDIA_NIM_API_KEY'] = "nvapi-..."

response = litellm.rerank(
    model="nvidia_nim/nvidia/nv-rerankqa-mistral-4b-v3",
    query="What is the GPU memory bandwidth of H100 SXM?",
    documents=[
        "The Hopper GPU is paired with the Grace CPU using NVIDIA's ultra-fast chip-to-chip interconnect, delivering 900GB/s of bandwidth.",
        "A100 provides up to 20X higher performance over the prior generation.",
        "Accelerated servers with H100 deliver 3 terabytes per second (TB/s) of memory bandwidth per GPU."
    ],
    top_n=3,
)

print(response)
```

</TabItem>
</Tabs>

**回應：**
```json
{
    "results": [
        {
            "index": 2,
            "relevance_score": 6.828125,
            "document": {
                "text": "Accelerated servers with H100 deliver 3 terabytes per second (TB/s) of memory bandwidth per GPU."
            }
        },
        {
            "index": 0,
            "relevance_score": -1.564453125,
            "document": {
                "text": "The Hopper GPU is paired with the Grace CPU using NVIDIA's ultra-fast chip-to-chip interconnect, delivering 900GB/s of bandwidth."
            }
        }
    ]
}
```


## 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy}

### 1. 設定組態 {#1-setup-config}

將 Nvidia NIM 重新排序模型新增至您的 proxy 組態：

```yaml
model_list:
  - model_name: nvidia-rerank
    litellm_params:
      model: nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2
      api_key: os.environ/NVIDIA_NIM_API_KEY
```

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 發出重新排序請求 {#3-make-rerank-requests}

```bash
curl -X POST http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia-rerank",
    "query": "What is the GPU memory bandwidth of H100?",
    "documents": [
      "H100 delivers 3TB/s memory bandwidth",
      "A100 has 2TB/s memory bandwidth",
      "V100 offers 900GB/s memory bandwidth"
    ],
    "top_n": 2
  }'
```

## `/v1/ranking` 模型（llama-3.2-nv-rerankqa-1b-v2） {#v1ranking-models-llama-32-nv-rerankqa-1b-v2}

部分 Nvidia NIM 重新排序模型使用 `/v1/ranking` 端點，而非預設的 `/v1/retrieval/{model}/reranking` 端點。

使用 `ranking/` 前綴，強制請求送往 `/v1/ranking` 端點：

### LiteLLM Python SDK {#litellm-python-sdk-1}

```python showLineNumbers title="Force /v1/ranking endpoint with ranking/ prefix"
import litellm
import os

os.environ['NVIDIA_NIM_API_KEY'] = "nvapi-..."

# Use "ranking/" prefix to force /v1/ranking endpoint
response = litellm.rerank(
    model="nvidia_nim/ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2",
    query="which way did the traveler go?",
    documents=[
        "two roads diverged in a yellow wood...",
        "then took the other, as just as fair...",
        "i shall be telling this with a sigh somewhere ages and ages hence..."
    ],
    top_n=3,
    truncate="END",  # Optional: truncate long text from the end
)

print(response)
```

### LiteLLM Proxy {#litellm-proxy}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: nvidia-ranking
    litellm_params:
      model: nvidia_nim/ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2
      api_key: os.environ/NVIDIA_NIM_API_KEY
```

```bash title="Request to LiteLLM Proxy"
curl -X POST http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia-ranking",
    "query": "which way did the traveler go?",
    "documents": [
      "two roads diverged in a yellow wood...",
      "then took the other, as just as fair..."
    ],
    "top_n": 2
  }'
```

### 理解模型解析 {#understanding-model-resolution}

**排名端點（`/v1/ranking`）：**

```
model: nvidia_nim/ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2
       └────┬────┘ └──┬──┘ └─────────────┬──────────────────┘
            │        │                   │
            │        │                   └────▶ Model name sent to provider
            │        │
            │        └────────────────────────▶ Tells LiteLLM the request/response and url should be sent to Nvidia NIM /v1/ranking endpoint
            │
            └─────────────────────────────────▶ Provider prefix

API URL: https://ai.api.nvidia.com/v1/ranking
```

**流程圖：**

```
Client Request                LiteLLM                              Provider API
──────────────              ────────────                         ─────────────

# Default reranking endpoint
model: "nvidia_nim/nvidia/model-name"
                            1. Extracts model: nvidia/model-name
                            2. Routes to default endpoint ──────▶ POST /v1/retrieval/nvidia/model-name/reranking


# Forced ranking endpoint  
model: "nvidia_nim/ranking/nvidia/model-name"
                            1. Detects "ranking/" prefix
                            2. Extracts model: nvidia/model-name
                            3. Routes to ranking endpoint ──────▶ POST /v1/ranking
                                                                  Body: {"model": "nvidia/model-name", ...}
```

**何時使用各端點：**

| 端點 | 模型前綴 | 使用情境 |
|----------|--------------|----------|
| `/v1/retrieval/{model}/reranking` | `nvidia_nim/<model>` | 大多數重新排序模型的預設值 |
| `/v1/ranking` | `nvidia_nim/ranking/<model>` | 供像 `nvidia/llama-3.2-nv-rerankqa-1b-v2` 這類需要此端點的模型使用 |

:::tip

查看 [Nvidia NIM 模型部署頁面](https://build.nvidia.com/nvidia/llama-3_2-nv-rerankqa-1b-v2/deploy)，以了解您的模型需要哪個端點。

:::

## API 參數 {#api-parameters}

### 必要參數 {#required-parameters}

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `model` | string | 帶有 `nvidia_nim/` 前綴的 Nvidia NIM 重新排序模型名稱 |
| `query` | string | 用於對文件進行排序的搜尋查詢 |
| `documents` | array | 要排序的文件清單（1-1000 份文件） |

### 選用參數 {#optional-parameters}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `top_n` | integer | 所有文件 | 要回傳的頂部排序文件數量 |

### Nvidia 特定參數 {#nvidia-specific-parameters}

**`truncate`**：控制文字超出模型的上下文視窗時要如何截斷
- `"NONE"`：不截斷（如果過長，請求可能會失敗）
- `"END"`：從文字末端截斷

```python
response = litellm.rerank(
    model="nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2",
    query="GPU performance",
    documents=["High performance computing", "Fast GPU processing"],
    top_n=2,
    truncate="END",  # Nvidia-specific parameter
)
```

## 驗證 {#authentication}

設定您的 Nvidia NIM API 金鑰：

<Tabs>
<TabItem value="env" label="環境變數">

```bash
export NVIDIA_NIM_API_KEY="nvapi-..."
```

</TabItem>
<TabItem value="python" label="Python">

```python
import os
os.environ['NVIDIA_NIM_API_KEY'] = "nvapi-..."

# Or pass directly
response = litellm.rerank(
    model="nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2",
    query="test",
    documents=["doc1"],
    api_key="nvapi-...",
)
```

</TabItem>
</Tabs>

## 自訂 API Base URL {#custom-api-base-url}

您可以透過多種方式覆寫預設 base URL：

**選項 1：環境變數**

```bash
export NVIDIA_NIM_API_BASE="https://your-custom-endpoint.com"
```

**選項 2：以參數傳入**

```python
response = litellm.rerank(
    model="nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2",
    query="test",
    documents=["doc1"],
    api_base="https://your-custom-endpoint.com",
)
```

**選項 3：完整 URL（包含模型路徑）**

如果您有完整的端點 URL，可以直接傳入：

```python
response = litellm.rerank(
    model="nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2",
    query="test",
    documents=["doc1"],
    api_base="https://your-custom-endpoint.com/v1/retrieval/nvidia/llama-3_2-nv-rerankqa-1b-v2/reranking",
)
```

LiteLLM 會偵測完整 URL（透過檢查路徑中的 `/retrieval/`）並直接使用原值。

### 如何取得 API 金鑰？ {#how-do-i-get-an-api-key}

請從 [Nvidia 的網站](https://developer.nvidia.com/nim/) 取得您的 Nvidia NIM API 金鑰。

## 相關文件 {#related-documentation}

- [Nvidia NIM - 主要文件](./nvidia_nim)
- [Nvidia NIM 聊天補全](./nvidia_nim#sample-usage)
- [LiteLLM 重新排序端點](../rerank)
- [Nvidia NIM 官方文件 ↗](https://docs.api.nvidia.com/nim/reference/)
