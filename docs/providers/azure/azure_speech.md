---
title: "透過 LiteLLM 使用 Azure OpenAI 文字轉語音"
sidebar_label: "Azure 文字轉語音 (tts)"
description: "從 Python SDK 或 AI 閘道，透過 LiteLLM 執行 Azure OpenAI 文字轉語音。使用您的 azure/ 部署名稱，選擇 alloy 等語音並設定格式。"
---

# Azure 文字轉語音 (tts) {#azure-text-to-speech-tts}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 使用 Azure OpenAI 的 Text to Speech 模型將文字轉換為自然聽感的語音 |
| LiteLLM 提供者路由 | `azure/` |
| 支援的操作 | `/audio/speech` |
| 提供者文件連結 | [Azure OpenAI TTS ↗](https://learn.microsoft.com/en-us/azure/ai-services/openai/text-to-speech-quickstart)

## 快速開始 {#quick-start}

### **LiteLLM SDK** {#litellm-sdk}

```python showLineNumbers title="SDK Usage"
from litellm import speech
from pathlib import Path
import os

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

# azure call
speech_file_path = Path(__file__).parent / "speech.mp3"
response = speech(
        model="azure/<your-deployment-name>",
        voice="alloy",
        input="the quick brown fox jumped over the lazy dogs",
    )
response.stream_to_file(speech_file_path)
```

### **LiteLLM PROXY** {#litellm-proxy}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: azure/gpt-4o-mini-tts
    litellm_params:
      model: azure/gpt-4o-mini-tts
      api_base: "os.environ/AZURE_API_BASE_TTS"
      api_key: "os.environ/AZURE_API_KEY_TTS"
      api_version: "os.environ/AZURE_API_VERSION" 
```

## 可用語音 {#available-voices}

Azure OpenAI 支援以下語音：
- `alloy` - 中性且平衡
- `echo` - 溫暖且活潑
- `fable` - 富有表現力且戲劇化
- `onyx` - 深沉且具權威感
- `nova` - 友善且對話感強
- `shimmer` - 明亮且愉悅

## 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Parameters"
response = speech(
    model="azure/<your-deployment-name>",
    voice="alloy",                    # Required: Voice selection
    input="text to convert",          # Required: Input text
    speed=1.0,                        # Optional: 0.25 to 4.0 (default: 1.0)
    response_format="mp3"             # Optional: mp3, opus, aac, flac, wav, pcm
)
```

## 支援的模型 {#supported-models}

- `gpt-4o-mini-tts` - 通用文字轉語音

使用您的 Azure 部署名稱：`azure/<your-deployment-name>`
