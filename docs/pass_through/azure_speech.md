# Azure AI Speech {#azure-ai-speech}

Azure AI Speech [Azure AI Speech](https://learn.microsoft.com/azure/ai-services/speech-service/) 語音轉文字的通過端點：原生 Azure 格式（不翻譯）的短音訊 REST 辨識端點與批次轉錄 REST API。這是 Cognitive Services 語音服務，與 Azure OpenAI Whisper 及 `gpt-4o-transcribe` 不同；LiteLLM 透過 `/v1/audio/transcriptions` 提供後者。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 短音訊辨識與快速轉錄依據 `azure/speech/azure-stt` 中 `model_prices_and_context_window.json` 項目的音訊秒數計費。批次轉錄工作無法根據其回應計費，且會在代理上的每把金鑰之間共用，因此批次 API 僅限代理管理員金鑰，並以支出 `0` 記錄 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 端使用者追蹤 | ❌ | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | 即時辨識使用 Speech SDK WebSocket 協定，此通過不涵蓋 |

只要將 `https://{region}.stt.speech.microsoft.com` 或 `https://{region}.api.cognitive.microsoft.com` 替換為 `LITELLM_PROXY_BASE_URL/azure_speech` 即可 🚀

LiteLLM 會從代理的 Azure Speech 認證注入 `Ocp-Apim-Subscription-Key` 標頭，因此用戶端只需要一把 LiteLLM 虛擬金鑰。由用戶端送出的訂閱金鑰會被捨棄，且永遠不會送達 Azure。

## 快速開始 {#quick-start}

1. 在代理環境中設定 Azure Speech 金鑰與區域。該金鑰是您的 Azure AI Speech 資源的訂閱金鑰

```bash showLineNumbers
export AZURE_SPEECH_API_KEY=""
export AZURE_SPEECH_REGION="swedencentral"
```

該金鑰也可以在 Admin UI 的 Models + Endpoints > Credentials 下，透過選取 `Azure AI Speech` 提供者來儲存；在這種情況下就不需要環境變數。當資源透過自訂網域或私人端點存取時，請將 `AZURE_SPEECH_API_BASE` 設為 `AZURE_SPEECH_REGION`，兩種端點家族會共用相同的 base

2. 啟動代理

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 透過代理將一個短 WAV 檔轉寫。音訊位元組會原封不動地轉送，因此請如同直接傳送給 Azure 一樣送出檔案

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/azure_speech/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: audio/wav; codecs=audio/pcm; samplerate=16000' \
--data-binary @audio.wav
```

```json
{"RecognitionStatus":"Success","Offset":9700000,"Duration":89500000,"DisplayText":"Britain Tranquility Base. Here the eagle has landed."}
```

4. 或者使用快速轉錄 API 轉寫檔案，此 API 會在一次請求中回傳逐字稿，並回報 LiteLLM 會計價的音訊長度

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/azure_speech/speechtotext/transcriptions:transcribe?api-version=2024-11-15' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-F 'audio=@audio.wav' \
-F 'definition={"locales":["en-US"]};type=application/json'
```

```json
{"durationMilliseconds":5061,"combinedPhrases":[{"text":"Listen, Tranquility Base here. The Eagle has landed."}],"phrases":[...]}
```

5. 或者，使用代理管理員金鑰建立批次轉錄工作並輪詢其狀態（整個批次 API 僅供管理員使用，請參閱限制）

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/azure_speech/speechtotext/v3.2/transcriptions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "displayName": "my-job",
  "locale": "en-US",
  "contentUrls": ["https://example.blob.core.windows.net/audio/recording.wav?<sas>"]
}'

curl 'http://0.0.0.0:4000/azure_speech/speechtotext/v3.2/transcriptions?top=10' \
-H "Authorization: Bearer $LITELLM_API_KEY"
```

## 端點家族與主機 {#endpoint-families-and-hosts}

Azure 會從不同主機提供這兩個 API，而 LiteLLM 會依據您呼叫的路徑選擇主機。位於 `/azure_speech/speech/` 下的路徑（短音訊 REST API，例如 `/speech/recognition/conversation/cognitiveservices/v1`）會導向 `https://{AZURE_SPEECH_REGION}.stt.speech.microsoft.com`。位於 `/azure_speech/speechtotext/` 下的路徑（批次轉錄 API，例如 `/speechtotext/v3.2/transcriptions` 及其 `/files` 子資源）會導向 `https://{AZURE_SPEECH_REGION}.api.cognitive.microsoft.com`。查詢參數、JSON 主體、multipart 主體與原始音訊主體都會原樣轉送；只有 `Content-Type` 與 `Accept` 會從用戶端請求複製。任何 `/azure_speech/` 下的其他路徑都會在送出到 Azure 之前回傳 400。[請參閱短音訊 REST 參考資料](https://learn.microsoft.com/azure/ai-services/speech-service/rest-speech-to-text-short) 與 [批次轉錄參考資料](https://learn.microsoft.com/azure/ai-services/speech-service/batch-transcription)

使用原生 Azure 協定且將其認證放在 `Ocp-Apim-Subscription-Key` 的用戶端，可以在該標頭中傳送 LiteLLM 虛擬金鑰來取代 `Authorization: Bearer`；LiteLLM 會用它來驗證呼叫，並在轉送前以代理的 Azure 金鑰取代該標頭

## 限制 {#limitations}

僅代理 REST API。即時與連續辨識使用 `wss://{region}.stt.speech.microsoft.com` 上的 Speech SDK WebSocket 協定，無法透過此通過路由；目前需要串流的用戶端應繼續直接呼叫 Azure

僅支援訂閱金鑰驗證。Microsoft Entra ID 權杖（針對 Azure 的 `Authorization: Bearer <token>`）不會由此路由簽發或轉送，因此代理的認證必須是 Speech 資源的訂閱金鑰

短音訊辨識回應會以 100 奈秒刻度帶有 `Offset` 與 `Duration`，快速轉錄回應則帶有 `durationMilliseconds`。LiteLLM 會將兩者轉換為秒數，並以 `azure/speech/azure-stt` 在 `model_prices_and_context_window.json` 中的項目計費（與透過 `/v1/audio/transcriptions` 使用 Azure Speech 時所用的相同項目），因此成功的轉錄會計入金鑰、團隊與使用者預算。快速轉錄請求會以模型 `azure_speech/fast-transcription` 記錄。對於短音訊辨識，LiteLLM 也會解碼上傳的音訊，並以較長者計費：上傳長度或辨識出的 `Duration`；因此，對可解碼的上傳（靜音，或使用者未要求的語言之語音）回傳的 `RecognitionStatus: NoMatch`，仍會以 Azure 處理的音訊長度計費。只有當請求的上傳內容 LiteLLM 無法解碼，且回應未帶有任何長度時，才會以支出 `0` 記錄

批次 API 的其餘部分（`/speechtotext/v3.2/...`）僅限代理管理員金鑰；任何其他金鑰在其中的每個方法都會收到 403。原因有兩個：它在 Azure 端是按音訊時數計費，但其回應未回報 LiteLLM 可計價的長度，因此 `POST` 或 `PUT`（建立轉錄工作、自訂模型、端點）會在不觸及任何 LiteLLM 預算的情況下消耗代理的 Azure 資源；而且該 API 下的每個工作、檔案與模型都屬於代理的單一 Azure 訂用帳戶，因此來自某一把金鑰的 `GET`、`PATCH` 或 `DELETE` 可能會讀取或移除另一把金鑰建立的工作。管理員呼叫會以模型 `azure_speech/batch-transcription` 和支出 `0` 記錄。需要一次性轉錄的普通金鑰應使用上方的快速轉錄端點，該端點按請求計費
