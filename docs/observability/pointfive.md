# PointFive {#pointfive}

LiteLLM 可以將 proxy 請求記錄傳送至 [PointFive](https://www.pointfive.co)，用於 AI 成本與使用情況分析。記錄會先緩衝，並透過 PointFive API 針對每個批次發出的 presigned URL 上傳，因此 proxy 本身不需要持有任何雲端憑證，且可在任何代管環境中不經修改直接執行。

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 回呼名稱 | `pointfive` |
| 目的地 | PointFive，透過每個批次發出的 presigned 上傳 URL |
| 資料格式 | gzip 壓縮的 NDJSON，每個請求一行 |
| 上傳觸發條件 | 每 `flush_interval` 秒，或一旦佇列中有 `batch_size` 筆記錄 |
| 驗證 | PointFive API 金鑰 |

## 先決條件 {#prerequisites}

您需要一個 PointFive 帳號與 API 金鑰。在 PointFive app 中新增 LiteLLM 整合；它會發出此回呼用來請求上傳 URL 的金鑰。

## 設定 {#setup}

### 環境變數 {#environment-variables}

| 變數 | 必要 | 說明 |
|----------|----------|-------------|
| `POINTFIVE_API_KEY` | 是 | PointFive API 金鑰 |
| `POINTFIVE_API_URL` | 否 | PointFive API 端點；預設為 `https://api.pointfive.co/api/v1/ingestion` |

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["pointfive"]
```

```bash
export POINTFIVE_API_KEY="<your-api-key>"
litellm --config /path/to/config.yaml
```

### 在 UI 上設定 {#setup-on-the-ui}

您可以從管理員 UI 啟用此回呼，而不必透過 `config.yaml`。開啟 `Settings`，然後 `Logging & Alerts`，新增 `PointFive`，並貼上您的 API 金鑰。將 URL 欄位留白即可使用預設端點。`Test` 會詢問 PointFive 是否接受該金鑰，並在不接受時回報原因；此功能僅供 proxy 管理員使用。請參閱 [管理員 UI 文件](https://docs.litellm.ai/docs/proxy/ui)，了解如何進入這些畫面。

## 調整批次處理 {#tuning-the-batching}

所有設定皆為選用，可在 `pointfive_params` 下提供。秘密值可使用 `os.environ/` 參照。

```yaml
litellm_settings:
  callbacks: ["pointfive"]
  pointfive_params:
    api_key: os.environ/POINTFIVE_API_KEY
    api_url: https://api.pointfive.co/api/v1/ingestion
    batch_size: 1000
    flush_interval: 300
    max_batch_bytes: 8388608
    max_upload_retries: 3
```

| 設定 | 預設值 | 說明 |
|---------|---------|-------------|
| `api_key` | 未設定 | 會回退至 `POINTFIVE_API_KEY`。此回呼若沒有金鑰則拒絕啟動 |
| `api_url` | `https://api.pointfive.co/api/v1/ingestion` | 會回退至 `POINTFIVE_API_URL` |
| `batch_size` | `1000` | 在間隔結束前會觸發 flush 的佇列記錄數 |
| `flush_interval` | `300` | flush 之間的秒數 |
| `max_batch_bytes` | `8388608` | 每個已上傳物件的未壓縮大小上限。超過此大小的 flush 會分割成多個物件 |
| `max_upload_retries` | `3` | 每個物件的嘗試次數，嘗試之間採用指數退避 |

預設值以較少但較大的上傳次數換取新鮮度，因為每次 flush 至少會變成一個物件。

### 遮罩 prompts 與回應 {#redacting-prompts-and-responses}

將 `turn_off_message_logging` 設定為不要將 prompts 與回應納入上傳內容，包含失敗請求與成功請求。模型、token 數、延遲與費用等中繼資料仍會傳送。

```yaml
litellm_settings:
  callbacks: ["pointfive"]
  pointfive_params:
    turn_off_message_logging: true
```

## 運作方式 {#how-it-works}

每次 flush 都會將佇列中的記錄序列化為 NDJSON，拆分成不大於 `max_batch_bytes` 的物件，在事件迴圈外對每個物件進行 gzip 壓縮，並在 PUT 上傳前向 PointFive API 申請一個大小剛好對應這些位元組的上傳 URL。每次重試都會請求新的 URL，因此絕不會重用已過期或已被使用過的 URL，而物件 key 由 PointFive 指定，所以 proxy 永遠不會自行決定資料落點。

上傳 URL 來自 PointFive API，因此在 proxy 連線前，會像檢查其他外部提供的目的地一樣進行檢查：會拒絕解析到私有位址、loopback 位址或 link-local 位址的主機，且絕不跟隨重新導向。此檢查會遵守 `user_url_validation` 與 `user_url_allowed_hosts`，這兩者來自 `litellm_settings`（請參閱 [設定選項](../proxy/config_settings.md)）。

傳遞採用至少一次。值得重試的失敗會讓批次保留在佇列中，留待下一次 flush，因此可能會重新傳送已經成功落地的物件；伺服器會再次拒絕的拒絕則會丟棄該物件，而不是卡住其後排隊的每一筆記錄。當某次 flush 發現沒有任何佇列內容時，此回呼會回報它仍然存活，因此可區分閒置中的 proxy 與已停止傳送的 proxy。

## 驗證 {#verification}

使用 `LITELLM_LOG=DEBUG` 執行 proxy，然後送出一個請求。每次上傳都會記錄壓縮後大小以及落點 key：

```log
pointfive: uploaded 5182 gzipped bytes to <object-key>
```

失敗會以警告或錯誤記錄在相同的 `pointfive:` 前綴下，並包含批次是保留供稍後 flush 還是已丟棄。

proxy 管理員也可以要求 proxy 直接檢查連線：

```bash
curl -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  "http://localhost:4000/health/services?service=pointfive"
```

```json
{"status": "healthy", "message": "PointFive is healthy"}
```

## 相關連結 {#related-links}

- [PointFive](https://www.pointfive.co)
- [Proxy 記錄指南](https://docs.litellm.ai/docs/proxy/logging)
