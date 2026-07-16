---
slug: gemini_embedding_2_ga
title: "Gemini Embedding 2 (GA)：LiteLLM 上的多模態嵌入"
date: 2026-04-24T10:00:00
authors:
  - sameer
description: "透過 Gemini API 和 Vertex AI 在 LiteLLM 上使用正式可用的 gemini-embedding-2 進行多模態嵌入——與預覽版相同的流程，且模型 ID 穩定。"
tags: [gemini, embeddings, multimodal, vertex ai]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini Embedding 2 (GA): 多模態嵌入 {#gemini-embedding-2-ga-multimodal-embeddings}

Litellm 現在已完全支援 Gemini Embedding 2 GA。

:::info
如需端到端行為、輸入形狀與 MIME 類型，請參閱 [Gemini Embedding 2 預覽版導覽](/blog/gemini_embedding_2_multimodal)。本篇文章著重於 **GA 命名**、**成本對照表** 的涵蓋範圍。
:::

{/* truncate */}

## 支援的輸入類型 {#supported-input-types}

| 模態 | 支援格式 |
|----------|-------------------|
| **文字** | 純文字 |
| **圖片** | PNG, JPEG |
| **音訊** | MP3, WAV |
| **影片** | MP4, MOV |
| **文件** | PDF |

## 輸入格式 {#input-formats}

LiteLLM 接受三種多模態內容輸入格式：

1. **Data URI** – Base64 編碼內嵌：`data:image/png;base64,<encoded_data>`
2. **GCS URLs** – 雲端儲存路徑（Vertex AI）：`gs://bucket/path/to/file.png`
3. **Gemini File References** – 預先上傳的檔案（Gemini API）：`files/abc123`

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="gemini" label="Gemini API">

```python
from litellm import embedding
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

# Text + Image (base64)
response = embedding(
    model="gemini/gemini-embedding-2",
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
    model="vertex_ai/gemini-embedding-2",
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
  - model_name: gemini-embedding-2
    litellm_params:
      model: gemini/gemini-embedding-2
      api_key: os.environ/GEMINI_API_KEY
  - model_name: vertex-gemini-embedding-2
    litellm_params:
      model: vertex_ai/gemini-embedding-2
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: global

general_settings:
  master_key: sk-1234
```

**2. 啟動 proxy**

```bash
litellm --config config.yaml
```

**3. 呼叫 embeddings**（proxy 上相容 OpenAI 的 **`POST /v1/embeddings`**）

```bash
curl -sS -X POST http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-embedding-2",
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
| **Data URI** | `data:image/png;base64,...` | Gemini, Vertex AI |
| **GCS URL** | `gs://bucket/path/image.png` | Vertex AI |
| **檔案參照** | `files/abc123` | 僅限 Gemini API |

### Data URI 支援的 MIME 類型 {#supported-mime-types-for-data-uris}

- **圖片：** `image/png`, `image/jpeg`
- **音訊：** `audio/mpeg`, `audio/wav`
- **影片：** `video/mp4`, `video/quicktime`
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

| 參數 | 說明 | 對應至 |
|-----------|-------------|---------|
| `dimensions` | 輸出嵌入大小 | `outputDimensionality` |

```python
response = embedding(
    model="gemini/gemini-embedding-2",
    input=["text to embed"],
    dimensions=768,  # Optional: control output vector size
)
```
