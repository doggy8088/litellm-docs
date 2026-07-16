# AWS Polly 文字轉語音 (tts) {#aws-polly-text-to-speech-tts}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 使用 AWS Polly 的 neural 和 standard TTS 引擎將文字轉換為自然發聲的語音 |
| LiteLLM 上的提供者路由 | `aws_polly/` |
| 支援的操作 | `/audio/speech` |
| 提供者文件連結 | [AWS Polly SynthesizeSpeech ↗](https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html) |

## 快速開始 {#quick-start}

### **LiteLLM SDK** {#litellm-sdk}

```python showLineNumbers title="SDK Usage"
import litellm
from pathlib import Path
import os

# Set environment variables
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = "us-east-1"

# AWS Polly call
speech_file_path = Path(__file__).parent / "speech.mp3"
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="the quick brown fox jumped over the lazy dogs",
)
response.stream_to_file(speech_file_path)
```

### **LiteLLM 代理伺服器** {#litellm-proxy}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: polly-neural
    litellm_params:
      model: aws_polly/neural
      aws_access_key_id: "os.environ/AWS_ACCESS_KEY_ID"
      aws_secret_access_key: "os.environ/AWS_SECRET_ACCESS_KEY"
      aws_region_name: "us-east-1"
```

## Polly 引擎 {#polly-engines}

AWS Polly 支援不同的語音合成引擎。請在模型名稱中指定引擎：

| 模型 | 引擎 | 成本（每 100 萬字元） | 說明 |
|-------|--------|---------------------|-------------|
| `aws_polly/standard` | Standard | $4.00 | 原始 Polly 聲音，更快且成本最低 |
| `aws_polly/neural` | Neural | $16.00 | 更自然、更像人聲的語音（推薦） |
| `aws_polly/generative` | Generative | $30.00 | 表現力最強、品質最高（可用聲音有限） |
| `aws_polly/long-form` | Long-form | $100.00 | 針對文章等長篇內容最佳化 |

### **LiteLLM SDK** {#litellm-sdk-1}

```python showLineNumbers title="Using Different Engines"
import litellm

# Neural engine (recommended)
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello world",
)

# Standard engine (lower cost)
response = litellm.speech(
    model="aws_polly/standard",
    voice="Joanna",
    input="Hello world",
)

# Generative engine (highest quality)
response = litellm.speech(
    model="aws_polly/generative",
    voice="Matthew",
    input="Hello world",
)
```

### **LiteLLM 代理伺服器** {#litellm-proxy-1}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: polly-neural
    litellm_params:
      model: aws_polly/neural
      aws_region_name: "us-east-1"
  - model_name: polly-standard
    litellm_params:
      model: aws_polly/standard
      aws_region_name: "us-east-1"
  - model_name: polly-generative
    litellm_params:
      model: aws_polly/generative
      aws_region_name: "us-east-1"
```

## 可用語音 {#available-voices}

### 原生 Polly 語音 {#native-polly-voices}

AWS Polly 在不同語言中提供許多語音。以下是常見的美式英語語音：

| 語音 | 性別 | 引擎支援 |
|-------|--------|----------------|
| `Joanna` | 女性 | Neural, Standard |
| `Matthew` | 男性 | Neural, Standard, Generative |
| `Ivy` | 女性（兒童） | Neural, Standard |
| `Kendra` | 女性 | Neural, Standard |
| `Amy` | 女性（英國） | Neural, Standard |
| `Brian` | 男性（英國） | Neural, Standard |

### **LiteLLM SDK** {#litellm-sdk-2}

```python showLineNumbers title="Using Native Polly Voices"
import litellm

# US English female
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello from Joanna",
)

# US English male
response = litellm.speech(
    model="aws_polly/neural",
    voice="Matthew",
    input="Hello from Matthew",
)

# British English female
response = litellm.speech(
    model="aws_polly/neural",
    voice="Amy",
    input="Hello from Amy",
)
```

### **LiteLLM 代理伺服器** {#litellm-proxy-2}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: polly-joanna
    litellm_params:
      model: aws_polly/neural
      voice: "Joanna"
      aws_region_name: "us-east-1"
  - model_name: polly-matthew
    litellm_params:
      model: aws_polly/neural
      voice: "Matthew"
      aws_region_name: "us-east-1"
```

### OpenAI 語音對應 {#openai-voice-mappings}

LiteLLM 也支援 OpenAI 語音名稱，這些名稱會自動對應到 Polly 語音：

| OpenAI 語音 | 對應的 Polly 語音 |
|--------------|---------------------|
| `alloy` | Joanna |
| `echo` | Matthew |
| `fable` | Amy |
| `onyx` | Brian |
| `nova` | Ivy |
| `shimmer` | Kendra |

### **LiteLLM SDK** {#litellm-sdk-3}

```python showLineNumbers title="Using OpenAI Voice Names"
import litellm

# These are equivalent
response = litellm.speech(
    model="aws_polly/neural",
    voice="alloy",  # Maps to Joanna
    input="Hello world",
)

response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",  # Native Polly voice
    input="Hello world",
)
```

## SSML 支援 {#ssml-support}

AWS Polly 支援 SSML（Speech Synthesis Markup Language），可進一步控制語音輸出。LiteLLM 會自動偵測 SSML 輸入。

### **LiteLLM SDK** {#litellm-sdk-4}

```python showLineNumbers title="SSML Example"
import litellm

ssml_input = """
<speak>
    Hello, <break time="500ms"/> 
    this is a test with <emphasis level="strong">emphasis</emphasis> 
    and <prosody rate="slow">slower speech</prosody>.
</speak>
"""

response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input=ssml_input,
)
```

### **LiteLLM 代理伺服器** {#litellm-proxy-3}

```bash showLineNumbers title="cURL Request with SSML"
curl -X POST http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "polly-neural",
    "voice": "Joanna",
    "input": "<speak>Hello <break time=\"500ms\"/> world</speak>"
  }' \
  --output speech.mp3
```

## 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Parameters"
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",                    # Required: Voice selection
    input="text to convert",           # Required: Input text (or SSML)
    response_format="mp3",             # Optional: mp3, ogg_vorbis, pcm
    
    # AWS-specific parameters
    language_code="en-US",             # Optional: Language code
    sample_rate="22050",               # Optional: Sample rate in Hz
)
```

## 回應格式 {#response-formats}

| 格式 | 說明 |
|--------|-------------|
| `mp3` | MP3 音訊（預設） |
| `ogg_vorbis` | Ogg Vorbis 音訊 |
| `pcm` | 原始 PCM 音訊 |

### **LiteLLM SDK** {#litellm-sdk-5}

```python showLineNumbers title="Different Response Formats"
import litellm

# MP3 (default)
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello",
    response_format="mp3",
)

# Ogg Vorbis
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello",
    response_format="ogg_vorbis",
)
```

## AWS 驗證 {#aws-authentication}

LiteLLM 支援多種 AWS 驗證方法。

### **LiteLLM SDK** {#litellm-sdk-6}

```python showLineNumbers title="Authentication Options"
import litellm
import os

# Option 1: Environment variables (recommended)
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-key"
os.environ["AWS_REGION_NAME"] = "us-east-1"

response = litellm.speech(model="aws_polly/neural", voice="Joanna", input="Hello")

# Option 2: Pass credentials directly
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello",
    aws_access_key_id="your-access-key",
    aws_secret_access_key="your-secret-key",
    aws_region_name="us-east-1",
)

# Option 3: IAM Role (when running on AWS)
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello",
    aws_region_name="us-east-1",
)

# Option 4: AWS Profile
response = litellm.speech(
    model="aws_polly/neural",
    voice="Joanna",
    input="Hello",
    aws_profile_name="my-profile",
)
```

### **LiteLLM 代理伺服器** {#litellm-proxy-4}

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  # Using environment variables
  - model_name: polly-neural
    litellm_params:
      model: aws_polly/neural
      aws_access_key_id: "os.environ/AWS_ACCESS_KEY_ID"
      aws_secret_access_key: "os.environ/AWS_SECRET_ACCESS_KEY"
      aws_region_name: "us-east-1"
  
  # Using IAM Role (when proxy runs on AWS)
  - model_name: polly-neural-iam
    litellm_params:
      model: aws_polly/neural
      aws_region_name: "us-east-1"
  
  # Using AWS Profile
  - model_name: polly-neural-profile
    litellm_params:
      model: aws_polly/neural
      aws_profile_name: "my-profile"
```

## 非同步支援 {#async-support}

```python showLineNumbers title="Async Usage"
import litellm
import asyncio

async def main():
    response = await litellm.aspeech(
        model="aws_polly/neural",
        voice="Joanna",
        input="Hello from async AWS Polly",
        aws_region_name="us-east-1",
    )
    
    with open("output.mp3", "wb") as f:
        f.write(response.content)

asyncio.run(main())
```
