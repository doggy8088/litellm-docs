# Amazon Transcribe {#amazon-transcribe}

[Amazon Transcribe](https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html) 批次與管理 API 的轉送端點（開始、輪詢與刪除轉錄工作、管理自訂詞彙、詞彙篩選器、語言模型和 Call Analytics 類別），採用原生 AWS 格式（不轉換）。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | `StartTranscriptionJob` 會在工作完成時計費，依據其轉錄的媒體檔案長度，按 LiteLLM 模型成本對應表中的 `transcribe/StartTranscriptionJob` 費率計算，因此適用金鑰、團隊與使用者預算。管理呼叫會記錄為 `transcribe/{Operation}`，支出為 `0`。LiteLLM 尚無法計價的工作類型與媒體會被拒絕，請參閱成本追蹤與預算 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ❌ | [如果您需要此功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | 串流轉錄（`StartStreamTranscription`，`transcribestreaming` HTTP/2 與 WebSocket 端點）是獨立協定，不在此轉送範圍內 |

只要將 `https://transcribe.{aws_region_name}.amazonaws.com` 替換為 `LITELLM_PROXY_BASE_URL/transcribe` 即可 🚀

LiteLLM 會使用代理伺服器的 AWS 憑證透過 SigV4 簽署轉送的請求，因此用戶端只需要 LiteLLM 虛擬金鑰。

## 快速開始 {#quick-start}

1. 在代理伺服器環境中設定 AWS 憑證與區域。這些憑證需要具備 `transcribe:*` 權限，以執行您呼叫的操作，並且需要對存放音訊的 S3 儲存貯體有讀取存取權

```bash showLineNumbers
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_REGION_NAME="us-west-2"
```

2. 列出虛擬金鑰可從哪些 S3 儲存貯體進行轉錄，以及可將轉錄稿寫入哪些儲存貯體，然後啟動代理伺服器。若沒有這份清單，只有代理伺服器管理員金鑰可以啟動工作，請參閱存取控制

```yaml showLineNumbers
general_settings:
  transcribe_media_buckets:
    - my-bucket
```

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 透過代理伺服器啟動轉錄工作

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/transcribe/StartTranscriptionJob' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "TranscriptionJobName": "my-job",
  "LanguageCode": "en-US",
  "MediaFormat": "wav",
  "Media": {"MediaFileUri": "s3://my-bucket/audio.wav"}
}'
```

4. 輪詢工作直到完成，然後從 `TranscriptFileUri` 下載轉錄稿

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/transcribe/GetTranscriptionJob' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{"TranscriptionJobName": "my-job"}'
```

URL 中的操作名稱可以是 Amazon Transcribe JSON API 的任何操作，例如 `StartTranscriptionJob`、`GetTranscriptionJob`、`ListTranscriptionJobs`、`DeleteTranscriptionJob`、`CreateVocabulary`。允許清單是從隨 botocore 提供的 AWS 服務模型讀取，因此會隨已安裝的 SDK 版本而變動。其他任何內容都會回傳 400，列出支援的集合。[查看所有 Amazon Transcribe 操作](https://docs.aws.amazon.com/transcribe/latest/APIReference/API_Operations_Amazon_Transcribe_Service.html)。LiteLLM 尚未計價的可計費工作類型（`StartMedicalTranscriptionJob`、`StartMedicalScribeJob`、`StartCallAnalyticsJob`）會在任何內容送到 AWS 之前以 400 拒絕，請參閱成本追蹤與預算

## 與 AWS SDK（boto3）搭配使用 {#usage-with-the-aws-sdk-boto3}

將 SDK 的 `endpoint_url` 指向 `LITELLM_PROXY_BASE_URL/transcribe`，並將您的 LiteLLM 虛擬金鑰作為 AWS access key id 傳入。代理伺服器會依照 AWS JSON 1.1 協定，從 SDK 的 `X-Amz-Target` 標頭讀取操作。

```python showLineNumbers
import boto3

client = boto3.client(
    "transcribe",
    region_name="us-west-2",
    endpoint_url="http://0.0.0.0:4000/transcribe",
    aws_access_key_id="sk-<your-litellm-api-key>",
    aws_secret_access_key="placeholder",
)

client.start_transcription_job(
    TranscriptionJobName="my-job",
    LanguageCode="en-US",
    MediaFormat="wav",
    Media={"MediaFileUri": "s3://my-bucket/audio.wav"},
)
job = client.get_transcription_job(TranscriptionJobName="my-job")["TranscriptionJob"]
print(job["TranscriptionJobStatus"])
```

SDK 會使用替代憑證在本機簽署請求。LiteLLM 會從該簽章的 `Credential=` 欄位讀取虛擬金鑰，據此驗證呼叫、丟棄 SDK 簽章，並以代理伺服器的 AWS 憑證重新簽署請求。

## 成本追蹤與預算 {#cost-tracking-and-budgets}

Amazon Transcribe 會對媒體檔案的每一秒計費，包括靜音，且不會回報該持續時間。在成功 `StartTranscriptionJob` 後，LiteLLM 會在背景輪詢 `GetTranscriptionJob`，直到工作達到 `COMPLETED` 或 `FAILED`，接著使用代理伺服器的 AWS 憑證從 S3 下載該工作所轉錄的媒體檔案，讀取其長度，將其無條件進位到整秒，並乘上模型成本對應表中 `transcribe/StartTranscriptionJob` 項目的 `input_cost_per_second`。該支出會寫入 SpendLogs 以及金鑰、團隊與使用者，因此一旦超出 `max_budget`，就會阻擋後續請求。`FAILED` 工作會收取 `0`。如果無法輪詢該工作，或無法擷取或讀取媒體，LiteLLM 會以 Transcribe 接受的最長標準批次工作媒體長度（8 小時，28800 秒）計費，因此不可讀取的工作絕不會是免費的。其他所有操作（`GetTranscriptionJob`、`ListTranscriptionJobs`、詞彙管理等）都會記錄為 `transcribe/{Operation}`，支出為 `0`。

由於支出會在工作完成時才入帳，在首次寫入費用之前提交的工作不會被預算停止，而輪詢因代理伺服器重新啟動而中斷的工作也不會被計費。請使用金鑰或團隊 `rpm_limit` 來限制金鑰在該時間窗內可啟動的工作數量，並使用 `allowed_routes` 來限制哪些金鑰可以存取 `/transcribe`。

只有標準批次費率會被計價。會加上每秒附加費的 `StartTranscriptionJob` 請求（`ContentRedaction`、`ToxicityDetection`，或透過 `ModelSettings.LanguageModelName` 或 `LanguageIdSettings.<language>.LanguageModelName` 使用自訂語言模型）以及另外計價的工作類型 `StartMedicalTranscriptionJob`、`StartMedicalScribeJob` 和 `StartCallAnalyticsJob`，都會在任何內容送到 AWS 之前以 400 拒絕，並說明原因。如果模型成本對應表中缺少 `transcribe/StartTranscriptionJob`，`StartTranscriptionJob` 也會以相同方式遭拒絕，而不會在未計價的情況下轉送。

LiteLLM 使用 libsndfile 讀取媒體長度，因此媒體必須是 `flac`、`mp3`、`ogg` 或 `wav`。格式會在設定 `MediaFormat` 時以其為準，否則依據 `Media.MediaFileUri` 的副檔名判定。媒體屬於其他格式（`mp4`、`m4a`、`webm`、`amr`）或格式無法判定的請求，會在任何內容送到 AWS 之前以 400 拒絕；請轉換檔案或設定 `MediaFormat` 後再提交。

## 存取控制 {#access-control}

透過 `/transcribe` 的每個請求都在代理伺服器的 AWS 憑證下執行，因此 LiteLLM 會限制虛擬金鑰可透過這些憑證存取的內容。

非代理伺服器管理員的金鑰只能啟動其 `Media.MediaFileUri` 與 `OutputBucketName` 指定的是 `general_settings.transcribe_media_buckets` 中列出的儲存貯體的工作，且不得設定 `DataAccessRoleArn` 或 `JobExecutionSettings`；其他任何內容都會在請求簽署前以 403 拒絕。當清單未設定、為空或格式錯誤時，只有代理伺服器管理員金鑰可以啟動工作。該清單可如上所述在 `config.yaml` 中設定，或在儀表板的 Settings、Router Settings、General Settings（`transcribe_media_buckets`，以逗號分隔的儲存貯體名稱）中設定；儲存在那裡的值會在執行中的代理伺服器下一次重新載入設定時生效，而 `config.yaml` 中的值則優先於它。

每個 `StartTranscriptionJob` 都會加上呼叫金鑰的擁有者標記（若有團隊則為其團隊，否則為其使用者，再否則為該金鑰本身）。`GetTranscriptionJob` 與 `DeleteTranscriptionJob` 只會回應帶有呼叫者擁有者標記的工作，對任何其他工作名稱都回傳 404，而呼叫者提供的 `litellm-owner` 標記會被拒絕。諸如 `ListTranscriptionJobs` 與詞彙管理等帳戶層級操作僅限代理伺服器管理員金鑰使用。代理伺服器管理員同時繞過這兩項檢查，並可看到 AWS 帳戶中的每個工作。

## 限制 {#limitations}

只有 `transcribe.{region}.amazonaws.com` JSON API 會被轉送。串流轉錄使用透過 HTTP/2 事件串流或 WebSockets 的獨立 `transcribestreaming.{region}.amazonaws.com` 端點，且無法透過這些端點進行路由；目前需要串流的用戶端應繼續直接呼叫 AWS。

AWS 會將轉錄稿寫入 S3，並以預先簽署的 `TranscriptFileUri` 回傳；轉錄稿本文絕不會透過 LiteLLM 回傳。為了替工作計價，代理伺服器會使用自身的 AWS 憑證從 S3 下載一次媒體檔案，因此它們需要對 `Media.MediaFileUri` 中指定的儲存貯體具有 `s3:GetObject`，而代理伺服器需要足夠的暫存磁碟空間，一次容納一個媒體檔案。
