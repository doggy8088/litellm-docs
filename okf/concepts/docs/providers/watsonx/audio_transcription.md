---
type: "Documentation page"
title: "Audio Transcription"
description: "WatsonX Audio Transcription Overview | Property | Details | | | | | Description | WatsonX audio transcription using Whisper models for speech to text | | Provider Route on LiteL..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/watsonx/audio_transcription.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/watsonx/audio_transcription.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/watsonx/audio_transcription.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/watsonx/audio_transcription.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# WatsonX Audio Transcription

## Overview

| Property | Details |
|----------|---------|
| Description | WatsonX audio transcription using Whisper models for speech-to-text |
| Provider Route on LiteLLM | `watsonx/` |
| Supported Operations | `/v1/audio/transcriptions` |
| Link to Provider Doc | [IBM WatsonX.ai ↗](https://www.ibm.com/watsonx) |

## Quick Start

### **LiteLLM SDK**

```python showLineNumbers title="transcription.py"
import litellm

response = litellm.transcription(
    model="watsonx/whisper-large-v3-turbo",
    file=open("audio.mp3", "rb"),
    api_base="https://us-south.ml.cloud.ibm.com",
    api_key="your-api-key",
    project_id="your-project-id"
)
print(response.text)
```

### **LiteLLM Proxy**

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: whisper-large-v3-turbo
    litellm_params:
      model: watsonx/whisper-large-v3-turbo
      api_key: os.environ/WATSONX_APIKEY
      api_base: os.environ/WATSONX_URL
      project_id: os.environ/WATSONX_PROJECT_ID
```

```bash title="Request"
curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer sk-1234" \
  -F file="@audio.mp3" \
  -F model="whisper-large-v3-turbo"
```

## Supported Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model ID (e.g., `watsonx/whisper-large-v3-turbo`) |
| `file` | file | Audio file to transcribe |
| `language` | string | Language code (e.g., `en`) |
| `prompt` | string | Optional prompt to guide transcription |
| `temperature` | float | Sampling temperature (0-1) |
| `response_format` | string | `json`, `text`, `srt`, `verbose_json`, `vtt` |
````
