# Azure AI Speech（Cognitive Services） {#azure-ai-speech-cognitive-services}

Azure AI Speech 是 Azure 的 Cognitive Services 文字轉語音 API，獨立於 Azure OpenAI。它提供高品質神經語音，支援更多語言，並具備進階語音自訂功能。

**何時使用此服務而非 Azure OpenAI TTS：**
- **Azure AI Speech** - 更多語言、神經語音、SSML 支援、語音自訂
- **Azure OpenAI TTS** - OpenAI 模型，與 Azure OpenAI 服務整合

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure AI Speech 是 Azure 的 Cognitive Services 文字轉語音 API，獨立於 Azure OpenAI。它提供高品質神經語音，支援更多語言，並具備進階語音自訂功能。 |
| LiteLLM 上的提供者路由 | `azure/speech/` |

## 快速開始 {#quick-start}

**LiteLLM SDK**

```python showLineNumbers title="SDK Usage"
from litellm import speech
from pathlib import Path
import os

os.environ["AZURE_TTS_API_KEY"] = "your-cognitive-services-key"

speech_file_path = Path(__file__).parent / "speech.mp3"
response = speech(
    model="azure/speech/azure-tts",
    voice="alloy",
    input="Hello, this is Azure AI Speech",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
)
response.stream_to_file(speech_file_path)
```

**LiteLLM Proxy**

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: azure-speech
    litellm_params:
      model: azure/speech/azure-tts
      api_base: https://eastus.tts.speech.microsoft.com
      api_key: os.environ/AZURE_TTS_API_KEY
```

## 設定 {#setup}

1. 在 [Azure Portal](https://portal.azure.com) 中建立 Azure Cognitive Services 資源
2. 從該資源取得您的 API 金鑰
3. 記下您的區域（例如，`eastus`、`westus`、`westeurope`）
4. 使用區域端點：`https://{region}.tts.speech.microsoft.com`

## 成本追蹤（定價） {#cost-tracking-pricing}

LiteLLM 會根據處理的字元數，自動追蹤 Azure AI Speech 的成本。

### 可用模型 {#available-models}

| 模型 | 語音類型 | 每 1M 字元成本 |
|-------|-----------|----------------------|
| `azure/speech/azure-tts` | Neural | $15 |
| `azure/speech/azure-tts-hd` | Neural HD | $30 |

### 成本如何計算 {#how-costs-are-calculated}

Azure AI Speech 會根據您輸入文字中的字元數計費。LiteLLM 會自動：
- 計算您 `input` 參數中的字元數
- 根據模型定價計算成本
- 在回應物件中傳回成本

```python showLineNumbers title="View Request Cost"
from litellm import speech

response = speech(
    model="azure/speech/azure-tts",
    voice="alloy",
    input="Hello, this is a test message",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
)

# Access the calculated cost
cost = response._hidden_params.get("response_cost")
print(f"Request cost: ${cost}")
```

### 驗證 Azure 定價 {#verify-azure-pricing}

若要查看最新的 Azure AI Speech 定價：

1. 造訪 [Azure 定價計算機](https://azure.microsoft.com/en-us/pricing/calculator/)
2. 將 **Service** 設為 "AI Services"
3. 將 **API** 設為 "Azure AI Speech"
4. 選擇 **Text to Speech** 與您的區域
5. 查看每百萬字元的目前定價

**注意：** 定價可能因區域與 Azure 訂用帳戶類型而異。

## 語音對應 {#voice-mapping}

LiteLLM 會自動將 OpenAI 語音名稱對應至 Azure Neural 語音：

| OpenAI 語音 | Azure Neural 語音 | 說明 |
|-------------|-------------------|-------------|
| `alloy` | en-US-JennyNeural | 中性且平衡 |
| `echo` | en-US-GuyNeural | 溫暖且活潑 |
| `fable` | en-GB-RyanNeural | 富表現力且戲劇化 |
| `onyx` | en-US-DavisNeural | 聲音低沉且具權威感 |
| `nova` | en-US-AmberNeural | 親切且具對話感 |
| `shimmer` | en-US-AriaNeural | 明亮且愉快 |

## 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Parameters"
response = speech(
    model="azure/speech/azure-tts",
    voice="alloy",                    # Required: Voice selection
    input="text to convert",          # Required: Input text
    speed=1.0,                        # Optional: 0.25 to 4.0 (default: 1.0)
    response_format="mp3",            # Optional: mp3, opus, wav, pcm
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key="your-key",
)
```

### 回應格式 {#response-formats}

| 格式 | Azure 輸出格式 | 取樣率 |
|--------|-------------------|-------------|
| `mp3` | audio-24khz-48kbitrate-mono-mp3 | 24kHz |
| `opus` | ogg-48khz-16bit-mono-opus | 48kHz |
| `wav` | riff-24khz-16bit-mono-pcm | 24kHz |
| `pcm` | raw-24khz-16bit-mono-pcm | 24kHz |

## 傳遞原始 SSML {#passing-raw-ssml}

LiteLLM 會自動偵測您的 `input` 是否包含 SSML（透過檢查 `<speak>` 標籤），並在不做任何轉換的情況下將其傳遞給 Azure。這讓您能完整控制語音合成。

**何時使用原始 SSML：**
- 搭配多語言語音使用 `<lang>` 元素來翻譯文字（例如，英文文字 → 西班牙語語音）
- 具有多個語音或韻律變化的複雜 SSML 結構
- 對發音、停頓、強調及其他語音特徵進行精細控制

### LiteLLM SDK {#litellm-sdk}

```python showLineNumbers title="Raw SSML for Multilingual Translation"
from litellm import speech

# Use <lang> element to convert English text to Spanish speech
# The <lang> element forces the output language regardless of input text language
language_code = "es-ES"
text = "Hello, how are you today?"  # English text
voice = "en-US-AvaMultilingualNeural"

ssml = f"""<speak version="1.0"
    xmlns="http://www.w3.org/2001/10/synthesis"
    xmlns:mstts="http://www.w3.org/2001/mstts"
    xml:lang="{language_code}">
<voice name="{voice}">
    <lang xml:lang="{language_code}">{text}</lang>
</voice>
</speak>"""

response = speech(
    model="azure/speech/azure-tts",
    voice=voice,
    input=ssml,  # LiteLLM auto-detects SSML and sends as-is
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
)
response.stream_to_file("speech.mp3")
```

```python showLineNumbers title="Raw SSML with Complex Features"
from litellm import speech

# Complex SSML with multiple prosody adjustments
ssml = """<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' 
    xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'>
<voice name='en-US-JennyNeural'>
    <mstts:express-as style='cheerful' styledegree='2'>
        <prosody rate='+20%' pitch='high'>
            Welcome to our service!
        </prosody>
    </mstts:express-as>
    <break time='500ms'/>
    <prosody rate='-10%'>
        How can I help you today?
    </prosody>
</voice>
</speak>"""

response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-JennyNeural",
    input=ssml,  # LiteLLM detects <speak> and passes through unchanged
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
)
response.stream_to_file("speech.mp3")
```

### LiteLLM Proxy {#litellm-proxy}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-speech",
    "voice": "en-US-AvaMultilingualNeural",
    "input": "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:mstts=\"http://www.w3.org/2001/mstts\" xml:lang=\"es-ES\"><voice name=\"en-US-AvaMultilingualNeural\"><lang xml:lang=\"es-ES\">Hello, how are you today?</lang></voice></speak>"
  }' \
  --output speech.mp3
```


## 傳送 Azure 特定參數 {#sending-azure-specific-params}

Azure AI Speech 透過可選參數支援進階 SSML 功能：

- `style`：說話風格（例如，「cheerful」、「sad」、「angry」、「whispering」）
- `styledegree`：風格強度（0.01 到 2）
- `role`：語音角色（例如，「Girl」、「Boy」、「SeniorFemale」、「SeniorMale」）
- `lang`：多語言語音的語言代碼（例如，「es-ES」、「fr-FR」、「hi-IN」）

### **LiteLLM SDK** {#litellm-sdk-1}

#### 自訂 Azure 語音 {#custom-azure-voice}

```python showLineNumbers title="Custom Azure Voice"
from litellm import speech

response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-AndrewNeural",       # Use Azure voice directly
    input="Hello, this is a test",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
    response_format="mp3"
)
response.stream_to_file("speech.mp3")
```

#### 說話風格 {#speaking-style}

```python showLineNumbers title="Speaking Style"
from litellm import speech

response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-JennyNeural",        # Must be a voice that supports styles
    input="Who are you? What is chicken dinner?",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
    style="whispering",               # Azure-specific: cheerful, sad, angry, whispering, etc.
)
response.stream_to_file("speech.mp3")
```

#### 風格、程度與角色 {#style-with-degree-and-role}

```python showLineNumbers title="Style with Degree and Role"
from litellm import speech

response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-AriaNeural",
    input="Good morning! How are you today?",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
    style="cheerful",                 # Azure-specific: Speaking style
    styledegree="2",                  # Azure-specific: 0.01 to 2 (intensity)
    role="SeniorFemale",              # Azure-specific: Girl, Boy, SeniorFemale, etc.
)
response.stream_to_file("speech.mp3")
```

#### 多語言語音的語言覆寫 {#language-override-for-multilingual-voices}

```python showLineNumbers title="Language Override"
from litellm import speech

response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-AvaMultilingualNeural",  # Multilingual voice
    input="आप कौन हैं? चिकन डिनर क्या है?",  # Hindi text
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
    lang="hi-IN",                         # Azure-specific: Override language
)
response.stream_to_file("speech.mp3")
```

### **LiteLLM AI Gateway (CURL)** {#litellm-ai-gateway-curl}

首先，請確保您已依照上方的 [LiteLLM Proxy 設定](#quick-start) 完成 proxy 設定。

**使用您設定檔中的模型名稱：**

```yaml
model_list:
  - model_name: azure-speech  # This is what you'll use in your API calls
    litellm_params:
      model: azure/speech/azure-tts
      api_base: https://eastus.tts.speech.microsoft.com
      api_key: os.environ/AZURE_TTS_API_KEY
```

#### 自訂 Azure 語音 {#custom-azure-voice-1}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-speech",
    "voice": "en-US-AndrewNeural",
    "input": "Hello, this is a test"
  }' \
  --output speech.mp3
```

#### 說話風格 {#speaking-style-1}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-speech",
    "input": "Who are you? What is chicken dinner?",
    "voice": "en-US-JennyNeural",
    "style": "whispering"
  }' \
  --output speech.mp3
```

#### 風格、程度與角色 {#style-with-degree-and-role-1}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-speech",
    "voice": "en-US-AriaNeural",
    "input": "Good morning! How are you today?",
    "style": "cheerful",
    "styledegree": "2",
    "role": "SeniorFemale"
  }' \
  --output speech.mp3
```

#### 語言覆寫 {#language-override}

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-speech",
    "input": "आप कौन हैं? चिकन डिनर क्या है?",
    "voice": "en-US-AvaMultilingualNeural",
    "lang": "hi-IN"
  }' \
  --output speech.mp3
```

### Azure 特定參數參考 {#azure-specific-parameters-reference}

| 參數 | 說明 | 範例值 | 備註 |
|-----------|-------------|----------------|-------|
| `style` | 說話風格 | `cheerful`、`sad`、`angry`、`excited`、`friendly`、`hopeful`、`shouting`、`terrified`、`unfriendly`、`whispering` | 僅部分語音支援。請參閱 [Azure 語音風格文件](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#use-speaking-styles-and-roles) |
| `styledegree` | 風格強度 | `0.01` 到 `2` | 數值越高 = 越強烈。預設為 `1` |
| `role` | 語音角色 | `Girl`、`Boy`、`YoungAdultFemale`、`YoungAdultMale`、`OlderAdultFemale`、`OlderAdultMale`、`SeniorFemale`、`SeniorMale` | 僅部分語音支援 |
| `lang` | 語言代碼 | `es-ES`、`fr-FR`、`de-DE`、`hi-IN` 等 | 適用於多語言語音。覆寫預設語言 |

## 非同步支援 {#async-support}

```python showLineNumbers title="Async Usage"
import asyncio
from litellm import aspeech
from pathlib import Path

async def generate_speech():
    response = await aspeech(
        model="azure/speech/azure-tts",
        voice="alloy",
        input="Hello from async",
        api_base="https://eastus.tts.speech.microsoft.com",
        api_key=os.environ["AZURE_TTS_API_KEY"],
    )
    
    speech_file_path = Path(__file__).parent / "speech.mp3"
    response.stream_to_file(speech_file_path)

asyncio.run(generate_speech())
```

## 區域端點 {#regional-endpoints}

請將 `{region}` 替換為您的 Azure 資源區域：

- US East: `https://eastus.tts.speech.microsoft.com`
- US West: `https://westus.tts.speech.microsoft.com`
- Europe West: `https://westeurope.tts.speech.microsoft.com`
- Asia Southeast: `https://southeastasia.tts.speech.microsoft.com`

[完整區域清單](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions)

## 進階功能 {#advanced-features}

### 自訂 Neural 語音 {#custom-neural-voices}

您可以透過傳入完整語音名稱來使用任何 Azure Neural 語音：

```python showLineNumbers title="Custom Voice"
response = speech(
    model="azure/speech/azure-tts",
    voice="en-US-AriaNeural",  # Direct Azure voice name
    input="Using a specific neural voice",
    api_base="https://eastus.tts.speech.microsoft.com",
    api_key=os.environ["AZURE_TTS_API_KEY"],
)
```

在 [Azure Speech Gallery](https://speech.microsoft.com/portal/voicegallery) 瀏覽可用語音。

## 錯誤處理 {#error-handling}

```python showLineNumbers title="Error Handling"
from litellm import speech
from litellm.exceptions import APIError

try:
    response = speech(
        model="azure/speech/azure-tts",
        voice="alloy",
        input="Test message",
        api_base="https://eastus.tts.speech.microsoft.com",
        api_key=os.environ["AZURE_TTS_API_KEY"],
    )
except APIError as e:
    print(f"Azure Speech error: {e}")
```

## 參考資料 {#reference}

- [Azure Speech Service 文件](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [Text-to-Speech REST API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech)
