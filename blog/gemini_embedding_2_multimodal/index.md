---
slug: gemini_embedding_2_multimodal
title: "Gemini Embedding 2 預覽版：LiteLLM 上的多模態嵌入"
date: 2025-03-11T10:00:00
authors:
  - sameer
description: "透過 LiteLLM 上的 gemini-embedding-2-preview，經由 Gemini API（每個輸入一個向量，與 OpenAI 相容）與 Vertex AI（每個請求一個單一整合向量），從文字、圖片、音訊、影片和 PDF 產生嵌入。"
tags: [gemini, embeddings, multimodal, vertex ai]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini Embedding 2 預覽版：多模態嵌入 {#gemini-embedding-2-preview-multimodal-embeddings}

LiteLLM 現在支援 `gemini-embedding-2-preview` 的**多模態嵌入**—在單一請求中混合文字、圖片、音訊、影片與 PDF 內容。可透過 **Gemini API**（API 金鑰）與 **Vertex AI**（GCP 憑證）使用。

:::info 回應格式因提供者而異

- **Gemini API**（`gemini/...`）：每個輸入元素都會回傳其自己的嵌入，依 `0..N-1` 索引 — 與 OpenAI 的 `/embeddings` 格式相同。LiteLLM 會路由到 [`batchEmbedContents`](https://ai.google.dev/api/embeddings#method:-models.batchembedcontents) 端點，且每個輸入使用一個 `EmbedContentRequest`。
- **Vertex AI**（`vertex_ai/...`）：所有輸入元素會透過 [`embedContent`](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-embeddings-api) 合併為單一整合嵌入。Vertex AI 不會為 Gemini 嵌入模型公開 `batchEmbedContents`，因此 `N` 部分 → `1` 向量。若要每個項目各得一個向量，請對每個輸入各呼叫一次 `embedding(...)`。

:::

{/* truncate */}

## 支援的輸入類型 {#supported-input-types}

| 模態 | 支援格式 | 
|----------|-------------------|
| **文字** | 純文字 |
| **圖片** | PNG、JPEG | 
| **音訊** | MP3、WAV | 
| **影片** | MP4、MOV | 
| **文件** | PDF | 

## 輸入格式 {#input-formats}

LiteLLM 接受多模態內容的三種輸入格式：

1. **Data URI** – Base64 編碼內嵌：`data:image/png;base64,<encoded_data>`
2. **GCS URL** – 雲端儲存空間路徑（Vertex AI）：`gs://bucket/path/to/file.png`
3. **Gemini File References** – 已預先上傳的檔案（Gemini API）：`files/abc123`

## 快速入門 {#quick-start}

<Tabs>
<TabItem value="gemini" label="Gemini API">

```python
from litellm import embedding
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

# Text + Image (base64)
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[
        "The food was delicious and the waiter...",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    ],
)
print(response)
```

</TabItem>

<TabItem value="vertex" label="Vertex AI">

```python
import litellm
from litellm import embedding

litellm.vertex_project = "your-project-id"
litellm.vertex_location = "us-central1"

# Text + Image (GCS URL)
response = embedding(
    model="vertex_ai/gemini-embedding-2-preview",
    input=[
        "Describe this image",
        "gs://my-bucket/images/photo.png"
    ],
)
print(response)
```

</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定（config.yaml）**

```yaml
model_list:
  - model_name: gemini-embedding-2-preview
    litellm_params:
      model: gemini/gemini-embedding-2-preview
      api_key: os.environ/GEMINI_API_KEY
  - model_name: vertex-gemini-embedding-2-preview
    litellm_params:
      model: vertex_ai/gemini-embedding-2-preview
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: os.environ/VERTEXAI_LOCATION

general_settings:
  master_key: sk-1234
```

**2. 啟動 proxy**

```bash
litellm --config config.yaml
```

**3. 呼叫 embeddings**

```bash
curl -X POST http://localhost:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-embedding-2-preview",
    "input": [
      "The food was delicious and the waiter...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    ]
  }'
```

</TabItem>
</Tabs>

## 輸入格式範例 {#input-format-examples}

| 格式 | 範例 | 提供者 |
|--------|---------|----------|
| **Data URI** | `data:image/png;base64,...` | Gemini、Vertex AI |
| **GCS URL** | `gs://bucket/path/image.png` | Vertex AI |
| **檔案參照** | `files/abc123` | 僅 Gemini API |

### Data URI 支援的 MIME 類型 {#supported-mime-types-for-data-uris}

- **圖片：** `image/png`、`image/jpeg`
- **音訊：** `audio/mpeg`、`audio/wav`
- **影片：** `video/mp4`、`video/quicktime`
- **文件：** `application/pdf`

### GCS URL MIME 推斷 {#gcs-url-mime-inference}

對於 Vertex AI，MIME 類型會根據檔案副檔名推斷：

- `.png` → `image/png`
- `.jpg` / `.jpeg` → `image/jpeg`
- `.mp3` → `audio/mpeg`
- `.wav` → `audio/wav`
- `.mp4` → `video/mp4`
- `.mov` → `video/quicktime`
- `.pdf` → `application/pdf`

## 選用參數 {#optional-parameters}

| 參數 | 說明 | 對應 |
|-----------|-------------|---------|
| `dimensions` | 輸出嵌入大小 | `outputDimensionality` |

```python
response = embedding(
    model="gemini/gemini-embedding-2-preview",
    input=["text to embed"],
    dimensions=768,  # Optional: control output vector size
)
```

## 合併嵌入（Gemini API，選用） {#combined-embeddings-gemini-api-opt-in}

預設情況下，Gemini API 路徑會針對每個輸入元素回傳一個嵌入（與 OpenAI 相容）。若要將多種模態融合為**單一**向量——例如，以名稱 + 相片表示的產品——請將它們包在巢狀清單中：

```python
from litellm import embedding

# Default: 2 inputs → 2 separate embeddings
embedding(
    model="gemini/gemini-embedding-2-preview",
    input=["a red shoe", "data:image/png;base64,..."],
)

# Combined: text + image fused into 1 embedding
embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[["a red shoe", "data:image/png;base64,..."]],
)

# Mixed: 1 combined entity + 1 plain text → 2 embeddings total
embedding(
    model="gemini/gemini-embedding-2-preview",
    input=[["a red shoe", "data:image/png;base64,..."], "just text"],
)
```

這對於單一實體具有多種模態的多模態檢索很有用。詳情請參閱 [embedding 文件](../../docs/embedding/supported_embedding#combined-multimodal-embeddings)。在 Vertex AI 上不需要這個選用設定——每個請求都已經回傳一個合併後的向量。
