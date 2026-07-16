# 通用 API {#generic-api}

將 LiteLLM 記錄傳送至任何 HTTP 端點。

## 快速開始 {#quick-start}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["custom_api_name"]

callback_settings:
  custom_api_name:
    callback_type: generic_api
    endpoint: https://your-endpoint.com/logs
    headers:
      Authorization: Bearer sk-1234
```

## 設定 {#configuration}

### 基本設定 {#basic-setup}

```yaml
callback_settings:
  <callback_name>:
    callback_type: generic_api
    endpoint: https://your-endpoint.com  # required
    headers:                              # optional
      Authorization: Bearer <token>
      Custom-Header: value
    event_types:                          # optional, defaults to all events
      - llm_api_success
      - llm_api_failure
```

### 參數 {#parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `callback_type` | string | 是 | 必須為 `generic_api` |
| `endpoint` | string | 是 | 要傳送記錄的 HTTP 端點 |
| `headers` | dict | 否 | 此請求的自訂標頭 |
| `event_types` | list | 否 | 篩選事件：`llm_api_success`、`llm_api_failure`。預設為所有事件。 |
| `log_format` | string | 否 | 輸出格式：`json_array`（預設）、`ndjson`，或 `single`。控制記錄如何分批並傳送。 |

## 預先設定的回呼 {#pre-configured-callbacks}

使用來自 `generic_api_compatible_callbacks.json` 的內建設定：

```yaml
litellm_settings:
  callbacks: ["rubrik"]  # loads pre-configured settings

callback_settings:
  rubrik:
    callback_type: generic_api
    endpoint: https://your-endpoint.com  # override defaults
    headers:
      Authorization: Bearer ${RUBRIK_API_KEY}
```

## 有效負載格式 {#payload-format}

記錄會以 JSON 格式傳送為 `StandardLoggingPayload` [物件](https://docs.litellm.ai/docs/proxy/logging_spec)：

```json
[
  {
    "id": "chatcmpl-123",
    "call_type": "litellm.completion",
    "model": "gpt-3.5-turbo",
    "messages": [...],
    "response": {...},
    "usage": {...},
    "cost": 0.0001,
    "startTime": "2024-01-01T00:00:00",
    "endTime": "2024-01-01T00:00:01",
    "metadata": {...}
  }
]
```

## 環境變數 {#environment-variables}

改為透過環境變數設定：

```bash
export GENERIC_LOGGER_ENDPOINT=https://your-endpoint.com
export GENERIC_LOGGER_HEADERS="Authorization=Bearer token,Custom-Header=value"
```

## 批次設定 {#batch-settings}

控制批次處理行為（繼承自 `CustomBatchLogger`）：

```yaml
callback_settings:
  my_api:
    callback_type: generic_api
    endpoint: https://your-endpoint.com
    batch_size: 100        # default: 100
    flush_interval: 60     # seconds, default: 60
```

## 記錄格式選項 {#log-format-options}

控制記錄的格式化方式以及傳送至您的端點的方式。

### JSON 陣列（預設） {#json-array-default}

```yaml
callback_settings:
  my_api:
    callback_type: generic_api
    endpoint: https://your-endpoint.com
    log_format: json_array  # default if not specified
```

將所有記錄以單一 JSON 陣列 `[{log1}, {log2}, ...]` 的形式在一個批次中傳送。這是預設行為，並維持向下相容性。

**使用時機**：大多數預期批次 JSON 資料的 HTTP 端點。

### NDJSON（換行分隔 JSON） {#ndjson-newline-delimited-json}

```yaml
callback_settings:
  my_api:
    callback_type: generic_api
    endpoint: https://your-endpoint.com
    log_format: ndjson
```

將記錄以換行分隔 JSON（每行一筆記錄）的形式傳送：
```
{log1}
{log2}
{log3}
```

**使用時機**：支援對個別記錄進行欄位擷取的記錄彙整服務，例如 Sumo Logic、Splunk 或 Datadog。

**優點**：
- 每筆記錄都會以獨立訊息擷取
- 欄位擷取規則會在擷取時生效
- 更好的剖析與查詢效能

### 單一 {#single}

```yaml
callback_settings:
  my_api:
    callback_type: generic_api
    endpoint: https://your-endpoint.com
    log_format: single
```

在批次被 flush 時，將每筆記錄以平行方式作為個別 HTTP 請求傳送。

**使用時機**：預期個別記錄的端點，或當您需要最高相容性時。

**注意**：此模式每個批次會傳送 N 個 HTTP 請求（額外負擔較高）。如果您的端點支援，建議改用 `ndjson`。
