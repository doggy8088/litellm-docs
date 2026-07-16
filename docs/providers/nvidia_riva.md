import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nvidia Riva（語音轉文字） {#nvidia-riva-speech-to-text}

LiteLLM 透過 `/audio/transcriptions` 支援 NVIDIA Riva 的語音轉文字。可搭配 **NVCF 托管** 的 Riva 端點（例如 `build.nvidia.com` 上的 Parakeet）以及 **自我託管** 的 Riva 部署。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Riva 是 NVIDIA 的 GPU 加速語音 AI。LiteLLM 會透過 gRPC 將音訊串流傳送至 Riva，並回傳相容於 OpenAI 的轉錄結果。 |
| LiteLLM 上的提供者路由 | `nvidia_riva/` |
| 提供者文件 | [Riva ASR 文件 ↗](https://docs.nvidia.com/deeplearning/riva/user-guide/docs/asr/asr-overview.html) |
| 傳輸方式 | gRPC（非 HTTP） |
| 支援的 OpenAI 端點 | `/audio/transcriptions` |

:::info 選用安裝

`nvidia_riva` 需要 gRPC 用戶端與音訊解碼函式庫。請使用以下方式安裝：

```bash
pip install 'litellm[stt-nvidia-riva]'
```

這會安裝 `nvidia-riva-client`、`soundfile`、`audioread` 與 `numpy`。這些套件會以延遲載入方式匯入，因此 LiteLLM 的其餘部分即使沒有它們也能正常運作。

:::

## 快速開始 {#quick-start}

```python
from litellm import transcription
import os

os.environ["NVIDIA_RIVA_API_KEY"] = "nvapi-..."   # your nvapi key

audio_file = open("/path/to/audio.mp3", "rb")

response = transcription(
    model="nvidia_riva/nvidia/parakeet-ctc-1_1b-asr",
    file=audio_file,
    api_base="grpc.nvcf.nvidia.com:443",
    nvcf_function_id="1598d209-5e27-4d3c-8079-4751568b1081",  # NVCF function id
)

print(response.text)
```

LiteLLM 會先將音訊重新取樣為 16 kHz 單聲道 LINEAR_PCM（Riva 所需的線路格式），再進行串流，因此可直接傳送 mp3 / wav / flac / ogg。無需預先處理。

## 部署模式 {#deployment-modes}

Riva 以兩種截然不同的形式運作。是否存在 `nvcf_function_id` 是 LiteLLM 用來預設 `use_ssl` 的訊號，但您隨時都可以覆寫它。

### NVCF（NVIDIA 托管） {#nvcf-nvidia-hosted}

```yaml
model_list:
  - model_name: parakeet-asr
    litellm_params:
      model: nvidia_riva/nvidia/parakeet-ctc-1_1b-asr
      api_base: grpc.nvcf.nvidia.com:443
      api_key: os.environ/NVIDIA_RIVA_API_KEY     # nvapi-...
      nvcf_function_id: 1598d209-5e27-4d3c-8079-4751568b1081
```

當設定了 `nvcf_function_id` 時，LiteLLM 會：
- 啟用 TLS（`use_ssl=True`）
- 附加 `function-id` gRPC 中繼資料
- 附加 `authorization: Bearer <api_key>`

### 自我託管（無 TLS） {#self-hosted-no-tls}

```yaml
model_list:
  - model_name: parakeet-asr
    litellm_params:
      model: nvidia_riva/nvidia/parakeet-ctc-1_1b-asr
      api_base: localhost:50051
```

### 透過具備 TLS 的 ingress 進行自我託管 {#self-hosted-behind-an-ingress-with-tls}

```yaml
model_list:
  - model_name: parakeet-asr
    litellm_params:
      model: nvidia_riva/nvidia/parakeet-ctc-1_1b-asr
      api_base: riva.internal.company.com:443
      use_ssl: true
```

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

### 1. 將模型加入您的設定 {#1-add-the-model-to-your-config}

```yaml
model_list:
  - model_name: parakeet-asr
    litellm_params:
      model: nvidia_riva/nvidia/parakeet-ctc-1_1b-asr
      api_base: grpc.nvcf.nvidia.com:443
      api_key: os.environ/NVIDIA_RIVA_API_KEY
      nvcf_function_id: 1598d209-5e27-4d3c-8079-4751568b1081
    model_info:
      mode: audio_transcription

general_settings:
  master_key: sk-1234
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 傳送請求 {#3-send-a-request}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
  --header 'Authorization: Bearer sk-1234' \
  --form 'file=@"/path/to/speech.mp3"' \
  --form 'model="parakeet-asr"'
```

</TabItem>
<TabItem value="openai" label="OpenAI SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000",
)

audio_file = open("speech.mp3", "rb")
transcript = client.audio.transcriptions.create(
    model="parakeet-asr",
    file=audio_file,
)
print(transcript.text)
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

可直接對應到 Riva 的 OpenAI 參數：

| OpenAI 參數 | 行為 |
|---|---|
| `language` | 對應至 Riva `language_code`。像 `en` 這類裸代碼會正規化為 `en-US`。像 `de-DE` 這類 BCP-47 代碼會原樣傳遞。 |
| `response_format` | `json`（預設）會回傳 `{ "text": "..." }`。`verbose_json` 會加入 `duration` 和 `words`（以秒為單位的時間戳記）。 |
| `timestamp_granularities` | 傳入 `["word"]` 以啟用逐字時間戳記。 |

您可以在 `litellm_params` 中設定的 Riva 專屬參數（或直接傳給 `transcription(...)`）：

| 參數 | 預設值 | 用途 |
|---|---|---|
| `nvcf_function_id` | 未設定 | NVCF 函式 ID。設定後，預設會使用 `use_ssl=True` 並附加 NVCF 中繼資料。 |
| `use_ssl` | 若設定了 `nvcf_function_id` 則為 `True`，否則為 `False` | 強制開啟或關閉 TLS。對於位於 TLS ingress 後方的自我託管 Riva 很有用。 |
| `riva_model_name` | `""`（自動選取） | 覆寫內部 Riva 模型名稱。留空可讓 Riva 根據 `language_code` + `sample_rate_hertz` 自動選擇。除非您非常清楚自己要什麼，否則建議不要設定。 |
| `enable_automatic_punctuation` | `True` | 標準 Riva 旗標。 |
| `endpointing_config` | 未設定 | 傳入一個與 Riva `EndpointingConfig` 相符的 dict（`start_threshold`、`stop_threshold`、`stop_history`、`stop_history_eou`、...）。 |
| `chunking_strategy` | 未設定 | OpenAI 風格的 VAD 設定（`{"type": "server_vad", "threshold": 0.5, "silence_duration_ms": 700, "prefix_padding_ms": 250}`）。LiteLLM 會將其轉換為 Riva 的 `EndpointingConfig`。 |

### 為什麼 `riva_model_name` 預設是空的？ {#why-is-riva_model_name-empty-by-default}

像 `parakeet-1.1b-en-US-asr-streaming-silero-vad-sortformer` 這類內部 Riva 部署名稱是 NVIDIA 的部署識別碼。它們會因 NIM 版本、區域以及自我託管建置而改變。將 `model=""` 留在 `RecognitionConfig` 中，可讓 Riva 根據 `language_code` 與 `sample_rate_hertz` 自動選取正確的項目——這幾乎總是您真正想要的。只有在您有特定要鎖定的已部署模型時，才應設定 `riva_model_name`。

## 音訊格式 {#audio-formats}

LiteLLM 使用 `soundfile`（wav / flac / ogg）解碼傳入音訊，並針對 `mp3` / `m4a` / `mp4` / `webm` 回退使用 `audioread`。之後音訊會重新取樣為 16 kHz 單聲道 LINEAR_PCM，再串流傳送至 Riva。

如果解碼失敗（例如特殊編碼、DRM，或未安裝 `audioread`），LiteLLM 會拋出清楚的錯誤，要求您在上游進行轉換：

```bash
ffmpeg -i input.mp3 -ac 1 -ar 16000 -sample_fmt s16 output.wav
```

## 環境變數 {#environment-variables}

| 變數 | 用途 |
|---|---|
| `NVIDIA_RIVA_API_KEY` | 以 `authorization: Bearer ...` 傳送的 API 金鑰。NVCF 預期為 `nvapi-...`。 |
| `NVIDIA_RIVA_API_BASE` | gRPC 端點的預設 `host:port`。效果與在 `litellm_params` 中設定 `api_base` 相同。 |
| `NVIDIA_NIM_API_KEY` | 作為 `NVIDIA_RIVA_API_KEY` 的備援，因為大多數使用者會在 NVCF 服務之間重複使用相同的 `nvapi-...` 金鑰。 |

## 注意事項與限制 {#notes--limitations}

- 傳輸方式為 gRPC 串流。NVCF 目前只支援串流 ASR，因此即使是短檔案也會以串流方式傳送。
- 說話者分離（`diarization_config`）以及 `srt` / `vtt` 回應格式尚未接好——如果您需要，請開立 issue。
- 成本計算：Riva 不會回傳 token 使用量。LiteLLM 會將音訊長度儲存在 `_hidden_params["audio_transcription_duration"]` 上，因此可在外部推算成本。
