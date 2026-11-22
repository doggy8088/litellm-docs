---
title: "使用 LiteLLM 的 Gradium 文字轉語音 API"
sidebar_label: "Gradium"
description: "透過 Python SDK 或 AI 閘道，在 /v1/audio/speech 上使用 Gradium 生成語音，支援 OpenAI 語音對應、區域端點與按字元計費的成本追蹤。"
---

# Gradium {#gradium}

<SinceVersion v="1.112.0" />

Gradium 是一家語音 AI 提供者。LiteLLM 透過與 OpenAI 相容的 `/audio/speech` 端點呼叫 Gradium 的文字轉語音 API，因此現有的 OpenAI 用戶端無需修改程式碼即可使用。

| 屬性 | 詳細內容 |
|----------|---------|
| 說明 | 使用 Gradium 的語音 AI 模型，將文字轉換為聽起來自然的語音。 |
| LiteLLM 上的提供者路由 | `gradium/` |
| 提供者文件 | [Gradium TTS ↗](https://docs.gradium.ai/api-reference/endpoint/tts-post) |
| 支援的端點 | `/audio/speech` |

## 模型 {#models}

使用 `gradium/default` 採用 Gradium 的預設模型，或使用 `gradium/gradium-tts-beta` 採用 Beta 模型。`gradium/` 之後的任何其他名稱都會以 Gradium 的 `model_name` 轉發給 Gradium。成本對照表中有 `gradium/default` 與 `gradium/gradium-tts-beta` 的價格。

## 憑證與區域 {#credentials-and-regions}

LiteLLM 不讀取任何 Gradium 環境變數，也沒有預設區域。每個部署或每次呼叫都必須同時設定 `api_key` 與 `api_base`。金鑰會以 `x-api-key` 標頭傳送至上游。

| API 基礎網址 | 區域 |
|----------|--------|
| `https://api.gradium.ai` | 最近的區域 |
| `https://eu.api.gradium.ai` | 歐盟 |
| `https://us.api.gradium.ai` | 美國 |

Gradium 自家文件在這些主機上顯示的尾端 `/api` 在此為選用，因此 `https://eu.api.gradium.ai` 與 `https://eu.api.gradium.ai/api` 會連到同一個端點。當您在 LiteLLM UI 的 Add Model 表單中新增 Gradium 模型時，API Base 欄位是一個下拉式選單，提供上述三個基礎網址。

## 快速入門 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Generate speech with the SDK"
import os
from pathlib import Path

import litellm

response = litellm.speech(
    model="gradium/default",
    input="the quick brown fox jumped over the lazy dogs",
    voice="alloy",
    response_format="wav",
    api_key=os.environ["GRADIUM_API_KEY"],
    api_base="https://eu.api.gradium.ai",
)
response.write_to_file(Path("speech.wav"))
```

`litellm.aspeech` 接受相同的參數，適用於非同步程式碼。

### LiteLLM Proxy {#litellm-proxy}

#### 1. 設定您的 Proxy {#1-configure-your-proxy}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gradium-tts
    litellm_params:
      model: gradium/default
      api_key: os.environ/GRADIUM_API_KEY
      api_base: https://eu.api.gradium.ai

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

`os.environ/GRADIUM_API_KEY` 會指示 Proxy 在載入設定時從該變數讀取金鑰。您可以選用任何變數名稱。

#### 2. 啟動 Proxy {#2-start-the-proxy}

```bash showLineNumbers title="Start LiteLLM proxy server"
export GRADIUM_API_KEY="your-gradium-api-key"
export LITELLM_MASTER_KEY="sk-your-master-key"
litellm --config config.yaml
```

#### 3. 生成語音 {#3-generate-speech}

```bash showLineNumbers title="curl"
curl http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gradium-tts",
    "input": "the quick brown fox jumped over the lazy dogs",
    "voice": "alloy",
    "response_format": "wav"
  }' \
  --output speech.wav
```

## 串流 {#streaming}

在請求主體中設定 `stream: true`，或在 SDK 中設定 `stream=True`，即可在 Gradium 傳送音訊時即時轉發給用戶端。若未設定，LiteLLM 會先緩衝整段音訊，再以單一回應傳回。

## 語音 {#voices}

OpenAI 語音名稱 `alloy`、`ash`、`ballad`、`coral`、`echo`、`fable`、`nova`、`onyx`、`sage`、`shimmer`、`verse`、`marin` 與 `cedar` 會對應至 Gradium 目錄中的英語語音，並按 OpenAI 語音的性別挑選。任何其他值都會以原始語音 ID 傳送給 Gradium，因此您可以將任何 Gradium 語音的 ID（包括其他語言的語音，或自訂、複製的語音）作為 `voice` 傳入。法語文字請從 Gradium 的語音庫挑選法語語音並傳入其 ID。未指定語音的請求會回應 400。

## 回應格式 {#response-formats}

| `response_format` | Gradium `output_format` |
|-------------------|-------------------------|
| `wav`（預設） | `wav` |
| `pcm` | `pcm_24000`（24 kHz） |
| `opus` | `opus` |

Gradium 自家的格式名稱也會被接受並原樣傳送。這些名稱包括 `ulaw_8000`、`mulaw_8000`、`alaw_8000`、`pcm_8000`、`pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` 與 `pcm_48000`。

## 不支援的參數 {#unsupported-parameters}

Gradium 沒有 mp3、aac 或 flac 編碼器，因此這些格式會回應 400，而不會回傳格式不符的音訊。`instructions` 以及任何非 OpenAI 預設值 `1.0` 的 `speed`，在 Gradium 的端點上都沒有對應功能，因此同樣會回應 400。若要變更語速，請使用 Gradium 自家的 `padding_bonus` 設定，說明如下。

設定 [`drop_params`](../completion/drop_params.md) 即可改為捨棄這些參數。被捨棄的格式會退回 wav。您可以在呼叫時設定（SDK 中使用 `drop_params=True`，或在請求主體中使用 `"drop_params": true`）、在部署上設定（在 `litellm_params` 下使用 `drop_params: true`），或為所有模型設定（`litellm.drop_params = True`，或在 Proxy 設定中於 `litellm_settings` 下使用 `drop_params: true`）。

## Gradium 設定 {#gradium-settings}

在請求主體中傳送 Gradium 的 `json_config`，LiteLLM 會原樣轉發給 Gradium。舉例來說，`padding_bonus` 可設定語速。負值說得較快，正值說得較慢，詳見 [Gradium 的語音設定](https://docs.gradium.ai/guides/voice-settings)。

```bash showLineNumbers title="Speak faster"
curl http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gradium-tts",
    "input": "the quick brown fox jumped over the lazy dogs",
    "voice": "alloy",
    "response_format": "wav",
    "json_config": {"padding_bonus": -2.0}
  }' \
  --output speech.wav
```

在 SDK 中，將 `json_config={"padding_bonus": -2.0}` 傳給 `litellm.speech`。使用 OpenAI 用戶端時，請將其放在 `extra_body` 中傳入。

## 成本追蹤 {#cost-tracking}

Gradium 按每個輸入字元計費 1 點，包含空格，LiteLLM 也按相同的字元數計費。成本對照表將 `gradium/default` 與 `gradium/gradium-tts-beta` 定價為 XS 方案的附加點數費率，即每 10 萬點 7 美元，也就是每字元 0.00007 美元。

較大的方案每點費用較低，而 Pro Voice Clone 語音每字元計費 1.2 點。LiteLLM 目前兩者皆按 XS 費率計費，因為部署的 `input_cost_per_character` 尚未改變語音呼叫的成本。Gradium 的回應也未說明使用的是哪一種語音，因此 LiteLLM 無法區分複製語音與目錄語音。
