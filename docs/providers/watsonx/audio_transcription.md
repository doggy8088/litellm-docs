# WatsonX 音訊轉錄 {#watsonx-audio-transcription}

## 概觀 {#overview}

| 屬性 | 詳細資料 |
|----------|---------|
| 說明 | 使用 Whisper 模型進行語音轉文字的 WatsonX 音訊轉錄 |
| LiteLLM 上的提供者路由 | `watsonx/` |
| 支援的操作 | `/v1/audio/transcriptions` |
| 提供者文件連結 | [IBM WatsonX.ai ↗](https://www.ibm.com/watsonx) |

## 快速開始 {#quick-start}

### **LiteLLM SDK** {#litellm-sdk}

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

### **LiteLLM Proxy** {#litellm-proxy}

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

## 支援的參數 {#supported-parameters}

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `model` | string | 模型 ID（例如：`watsonx/whisper-large-v3-turbo`） |
| `file` | 檔案 | 要轉錄的音訊檔案 |
| `language` | string | 語言代碼（例如：`en`） |
| `prompt` | string | 用於引導轉錄的選用提示詞 |
| `temperature` | float | 採樣溫度（0-1） |
| `response_format` | string | `json`、`text`、`srt`、`verbose_json`、`vtt` |
