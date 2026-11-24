---
title: "透過 LiteLLM 使用 Gemini 多模態檔案檢查"
sidebar_label: "多模態檔案檢查"
description: "透過 LiteLLM 使用 Gemini 多模態檔案檢查：在 generateContent、Interactions 與 /gemini passthrough 路由上，按頁面、工作表、儲存格範圍或時間片段切取 PDF、Office 檔案、試算表、音訊與影片。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 多模態檔案檢查 {#gemini-multimodal-file-inspection}

<SinceVersion v="1.80.11" />

Gemini 多模態檔案檢查讓您只把檔案的一部分傳給模型：PDF 或 Office 文件的頁面範圍、簡報的投影片範圍、活頁簿的工作表或儲存格範圍，或音訊、影片檔案的時間片段。Gemini 也能原生讀取 Microsoft Office 與 OpenDocument 檔案，而且只對您傳送的切片中的 token 計費。

[Gemini 文件處理官方文件](https://aistudio.google.com/docs/document-processing)

## 支援的路由 {#supported-routes}

LiteLLM proxy 會在採用 Gemini 自有請求格式的路由上，原封不動地轉送切片欄位。請完全按照 Google 的規範撰寫請求，並將請求指向 proxy。

| 路由 | Proxy 路徑 | 切片欄位 |
|-------|-----------|----------------|
| [generateContent](../../generateContent.md) | `/v1beta/models/{model}:generateContent` 與 `:streamGenerateContent` | `documentMetadata`、`spreadsheetMetadata`、`videoMetadata`、`audioMetadata`、`mediaResolution`，在 `fileData` part 上 |
| [Interactions](../../interactions.md) | `/v1beta/interactions` | `processing`，在 `document`、`video` 或 `audio` 輸入區塊上 |
| [Google AI Studio 穿透式端點](../../pass_through/google_ai_studio.md) | `/gemini/v1beta/...` | 以上兩者皆可，視您呼叫的 Google 端點而定 |

每個路由回傳的輸入 token 數都與直接呼叫 Google 相同，LiteLLM 會根據該用量計算支出。本頁的範例全部是在 LiteLLM `v1.110.2` 上執行的。

本頁不涵蓋透過 OpenAI 相容的 `/v1/chat/completions` 路由進行切片。請使用上面列出的其中一個路由。

## 設定 {#setup}

在您的 proxy 設定中加入一個 Gemini 模型並啟動 proxy。

```yaml title="config.yaml"
model_list:
  - model_name: gemini-4-hydrogen
    litellm_params:
      model: gemini/gemini-4-hydrogen
      api_key: os.environ/GEMINI_API_KEY
```

```bash
litellm --config config.yaml
```

透過 [Gemini Files API](https://aistudio.google.com/docs/files) 上傳檔案，並在以下範例中使用回傳的檔案 URI。Google 表示切片功能適用於 Gemini 3 與 Gemini 4 模型。

## 切取頁面或投影片 {#slice-pages-or-slides}

PDF（`.pdf`）、文件（`.docx`、`.doc`、`.dotx`、`.odt`）與簡報（`.pptx`、`.ppt`、`.odp`）請使用這些欄位。頁面與投影片皆從 1 開始編號，範圍的兩端都包含在內。

<Tabs>
<TabItem value="generate-content" label="generateContent">

```bash
curl -X POST "http://localhost:4000/v1beta/models/gemini-4-hydrogen:generateContent" \
  -H "x-goog-api-key: $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {
          "fileData": {
            "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/FILE_ID",
            "mimeType": "application/pdf"
          },
          "documentMetadata": {
            "startPage": 3,
            "endPage": 4,
            "contentLayers": ["PAGE_IMAGE"]
          },
          "mediaResolution": {"level": "MEDIA_RESOLUTION_HIGH"}
        },
        {"text": "Summarize the chart and footnotes on pages 3 and 4."}
      ]
    }]
  }'
```

</TabItem>
<TabItem value="interactions" label="Interactions">

```bash
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-4-hydrogen",
    "input": [
      {
        "type": "document",
        "uri": "https://generativelanguage.googleapis.com/v1beta/files/FILE_ID",
        "mime_type": "application/pdf",
        "resolution": "high",
        "processing": {
          "type": "static",
          "page_options": {
            "start_page": 3,
            "end_page": 4,
            "content_layers": ["page_image"]
          }
        }
      },
      {"type": "text", "text": "Summarize the chart and footnotes on pages 3 and 4."}
    ]
  }'
```

</TabItem>
<TabItem value="passthrough" label="/gemini passthrough">

```bash
curl -X POST "http://localhost:4000/gemini/v1beta/models/gemini-4-hydrogen:generateContent" \
  -H "x-goog-api-key: $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {
          "fileData": {
            "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/FILE_ID",
            "mimeType": "application/pdf"
          },
          "documentMetadata": {"startPage": 3, "endPage": 4}
        },
        {"text": "Summarize the chart and footnotes on pages 3 and 4."}
      ]
    }]
  }'
```

passthrough 在 `/gemini/v1beta/interactions` 也接受 Interactions 的請求主體。

</TabItem>
</Tabs>

| generateContent | Interactions | 含義 |
|-----------------|--------------|---------|
| `documentMetadata.startPage` | `processing.page_options.start_page` | 要傳送的第一頁或第一張投影片 |
| `documentMetadata.endPage` | `processing.page_options.end_page` | 要傳送的最後一頁或最後一張投影片 |
| `documentMetadata.contentLayers` | `processing.page_options.content_layers` | `PAGE_IMAGE`／`page_image`（渲染後的頁面）、`PAGE_TEXT`／`page_text`（抽取的文字），或兩者皆是 |
| `mediaResolution.level` | `document` 區塊上的 `resolution` | 渲染後頁面圖片的細節程度 |

Office 檔案請更換 MIME 類型，欄位保持不變。`.pptx` 簡報使用 `application/vnd.openxmlformats-officedocument.presentationml.presentation`，並以 `startPage`／`endPage` 選取投影片。

## 切取工作表或儲存格範圍 {#slice-a-worksheet-or-cell-range}

試算表（`.xlsx`、`.xls`、`.ods`）請使用這些欄位。`sheetIndex` 是工作表在分頁順序中的位置（從 1 開始編號），`visibleCells` 則是 A1 儲存格或範圍。

<Tabs>
<TabItem value="generate-content" label="generateContent">

```bash
curl -X POST "http://localhost:4000/v1beta/models/gemini-4-hydrogen:generateContent" \
  -H "x-goog-api-key: $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {
          "fileData": {
            "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/WORKBOOK_FILE_ID",
            "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          },
          "spreadsheetMetadata": {
            "sheetIndex": 2,
            "visibleCells": "A1:H50",
            "contentLayers": ["DATA", "FORMULAS"]
          }
        },
        {"text": "List the formulas in this range and what each one computes."}
      ]
    }]
  }'
```

</TabItem>
<TabItem value="interactions" label="Interactions">

```bash
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-4-hydrogen",
    "input": [
      {
        "type": "document",
        "uri": "https://generativelanguage.googleapis.com/v1beta/files/WORKBOOK_FILE_ID",
        "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "processing": {
          "type": "static",
          "spreadsheet_options": {
            "sheet_index": 2,
            "visible_cells": "A1:H50",
            "content_layers": ["data", "formulas"]
          }
        }
      },
      {"type": "text", "text": "List the formulas in this range and what each one computes."}
    ]
  }'
```

</TabItem>
</Tabs>

| generateContent | Interactions | 含義 |
|-----------------|--------------|---------|
| `spreadsheetMetadata.sheetIndex` | `processing.spreadsheet_options.sheet_index` | 要傳送的工作表。省略則傳送全部工作表 |
| `spreadsheetMetadata.visibleCells` | `processing.spreadsheet_options.visible_cells` | 要裁切到的儲存格或範圍，例如 `A1:H50` |
| `spreadsheetMetadata.contentLayers` | `processing.spreadsheet_options.content_layers` | `DATA`／`data`（儲存格值）、`FORMULAS`／`formulas`（原始公式）、`VISUAL`／`visual`（渲染快照） |

## 切取影片或音訊片段 {#slice-a-video-or-audio-segment}

偏移量是以 `s` 結尾的秒數字串（例如 `"10s"`、`"10.5s"`）。

<Tabs>
<TabItem value="generate-content" label="generateContent">

```bash
curl -X POST "http://localhost:4000/v1beta/models/gemini-4-hydrogen:generateContent" \
  -H "x-goog-api-key: $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {
          "fileData": {
            "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/VIDEO_FILE_ID",
            "mimeType": "video/mp4"
          },
          "videoMetadata": {"startOffset": "10s", "endOffset": "20s", "fps": 1}
        },
        {"text": "Describe what happens in this segment."}
      ]
    }]
  }'
```

音訊：請將 `mimeType` 設為音訊類型（例如 `audio/mpeg`），並將 `videoMetadata` 換成 `"audioMetadata": {"startOffset": "60s", "endOffset": "90s"}`。

</TabItem>
<TabItem value="interactions" label="Interactions">

```bash
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-4-hydrogen",
    "input": [
      {
        "type": "video",
        "uri": "https://generativelanguage.googleapis.com/v1beta/files/VIDEO_FILE_ID",
        "mime_type": "video/mp4",
        "processing": {
          "type": "static",
          "start_offset": "10s",
          "end_offset": "20s"
        }
      },
      {"type": "text", "text": "Describe what happens in this segment."}
    ]
  }'
```

音訊請使用 `"type": "audio"`，搭配音訊 MIME 類型（例如 `audio/mpeg`）與相同的 `processing` 偏移量。

</TabItem>
</Tabs>

## Token 用量與成本 {#token-usage-and-cost}

Gemini 只對傳送給模型的切片計費，proxy 回報的輸入 token 數與直接呼叫相同。下表列出相同請求直接向 Google 發出，以及經由 LiteLLM `v1.110.2` 在 `gemini-4-hydrogen` 上發出時的 `promptTokenCount`。三個 proxy 路由回傳的數量都與直接呼叫相同。

| 檔案 | 請求 | 輸入 token | 變化 |
|------|---------|--------------|--------|
| 6 頁 PDF | 整個檔案 | 5840 | |
| 6 頁 PDF | 第 3 至 4 頁 | 1147 | 減少 80% |
| 3 個工作表活頁簿 | 整個檔案 | 1008 | |
| 3 個工作表活頁簿 | 工作表 2 | 391 | 減少 61% |
| 3 個工作表活頁簿 | 工作表 1，儲存格 `A1:B3` | 173 | 減少 83% |
| 3 張投影片簡報（`.pptx`） | 整個檔案 | 1704 | |
| 3 張投影片簡報（`.pptx`） | 投影片 2，文字層 | 73 | 減少 96% |
| 60 秒影片 | 整個檔案 | 6159 | |
| 60 秒影片 | 第 10 至 20 秒 | 1059 | 減少 83% |
| 120 秒音訊 | 整個檔案 | 3879 | |
| 120 秒音訊 | 第 60 至 90 秒 | 999 | 減少 74% |

節省幅度因檔案而異。LiteLLM 會根據 Gemini 回傳的用量追蹤這些呼叫的支出，proxy 再把成本放在 `x-litellm-response-cost` 回應標頭中回傳。

## 限制 {#limits}

Google 會將檔案限制套用至整個上傳檔案（即使您已將其切片）：每個檔案 50 MB、每個 PDF 1,000 頁、每個 Office/OpenDocument 檔案 2,000 頁或投影片、每個工作表 50,000 個儲存格。完整的格式與選項清單請見 [Google 文件](https://aistudio.google.com/docs/document-processing)。
