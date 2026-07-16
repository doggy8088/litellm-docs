import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Sumo Logic {#sumo-logic}

將 LiteLLM 記錄傳送至 Sumo Logic，以進行可觀測性、監控與分析。

Sumo Logic 是一個雲端原生的機器資料分析平台，能為您的應用程式與基礎架構提供即時洞察。
https://www.sumologic.com/

:::info
我們想了解如何讓回呼變得更好！歡迎與 LiteLLM 的 [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 見面，或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

1. 在 https://www.sumologic.com/ 建立一個 Sumo Logic 帳戶
2. 在 Sumo Logic 中設定 HTTP Logs and Metrics 來源：
   - 前往 **Manage Data** > **Collection** > **Collection**
   - 在 Hosted Collector 旁邊點擊 **Add Source**
   - 選取 **HTTP Logs & Metrics**
   - 複製產生的 URL（其中包含驗證權杖）

更多詳細資訊請參閱 [HTTP Logs & Metrics Source](https://www.sumologic.com/help/docs/send-data/hosted-collectors/http-source/logs-metrics/) 文件。

```shell
uv add litellm
```

## 快速開始 {#quick-start}

只需 2 行程式碼，即可立即將您的 LLM 回應記錄到 Sumo Logic。

Sumo Logic HTTP Source URL 已包含驗證權杖，因此不需要另外的 API key。

<Tabs>
<TabItem value="python" label="SDK">

```python
litellm.callbacks = ["sumologic"]
```

```python
import litellm
import os

# Sumo Logic HTTP Source URL (includes auth token)
os.environ["SUMOLOGIC_WEBHOOK_URL"] = "https://collectors.sumologic.com/receiver/v1/http/your-token-here"

# LLM API Keys
os.environ['OPENAI_API_KEY'] = ""

# Set sumologic as a callback
litellm.callbacks = ["sumologic"]

# OpenAI call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - I'm testing Sumo Logic integration"}
  ]
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["sumologic"]

environment_variables:
  SUMOLOGIC_WEBHOOK_URL: os.environ/SUMOLOGIC_WEBHOOK_URL
```

2. 啟動 LiteLLM Proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how are you?"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 記錄了哪些資料？ {#what-data-is-logged}

LiteLLM 會將 [標準記錄酬載](https://docs.litellm.ai/docs/proxy/logging_spec) 傳送到 Sumo Logic，其中包含：

- **請求詳細資訊**：模型、訊息、參數
- **回應詳細資訊**：完成文字、token 使用量、延遲
- **中繼資料**：使用者 ID、自訂中繼資料、時間戳記
- **成本追蹤**：依據 token 使用量計算的回應成本

範例酬載：

```json
{
  "id": "chatcmpl-123",
  "call_type": "litellm.completion",
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "response": {
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "Hi there!"
      }
    }]
  },
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  },
  "response_cost": 0.0001,
  "start_time": "2024-01-01T00:00:00",
  "end_time": "2024-01-01T00:00:01"
}
```

## 進階設定 {#advanced-configuration}

### 記錄格式 {#log-format}

Sumo Logic 整合預設使用 **NDJSON（newline-delimited JSON）** 格式。此格式最適合 Sumo Logic 的解析能力，並可讓欄位擷取規則在擷取時生效。

#### NDJSON 格式 {#ndjson-format}

每筆記錄項目會在 HTTP 請求中以獨立的一行傳送：
```
{"id":"chatcmpl-1","model":"gpt-3.5-turbo","response_cost":0.0001,...}
{"id":"chatcmpl-2","model":"gpt-4","response_cost":0.0003,...}
{"id":"chatcmpl-3","model":"gpt-3.5-turbo","response_cost":0.0001,...}
```

#### 欄位擷取規則（FERs）的好處 {#benefits-for-field-extraction-rules-fers}

使用 NDJSON 格式時，您可以直接建立欄位擷取規則：

```
_sourceCategory=litellm/logs
| json field=_raw "model", "response_cost", "user" as model, cost, user
```

**NDJSON 之前**（使用 JSON 陣列格式）：
- 需要 `parse regex ... multi` 因應方式
- FERs 無法在擷取時解析
- 查詢時解析會影響儀表板效能

**NDJSON 之後**：
- ✅ FERs 在擷取時解析欄位
- ✅ 不需要查詢時的因應方式
- ✅ 更好的儀表板效能
- ✅ 更簡單的查詢語法

#### 變更記錄格式（進階） {#changing-the-log-format-advanced}

如果您需要變更記錄格式（不建議用於 Sumo Logic）：

```yaml
callback_settings:
  sumologic:
    callback_type: generic_api
    callback_name: sumologic
    log_format: json_array  # Override to use JSON array instead
```

### 批次處理設定 {#batching-settings}

控制 LiteLLM 在傳送到 Sumo Logic 之前如何批次處理記錄：

<Tabs>
<TabItem value="python" label="SDK">

```python
import litellm

os.environ["SUMOLOGIC_WEBHOOK_URL"] = "https://collectors.sumologic.com/receiver/v1/http/your-token"

litellm.callbacks = ["sumologic"]

# Configure batch settings (optional)
# These are inherited from CustomBatchLogger
# Default batch_size: 100
# Default flush_interval: 60 seconds
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

```yaml
litellm_settings:
  callbacks: ["sumologic"]

environment_variables:
  SUMOLOGIC_WEBHOOK_URL: os.environ/SUMOLOGIC_WEBHOOK_URL
```

</TabItem>
</Tabs>

### 壓縮資料 {#compressed-data}

Sumo Logic 支援壓縮資料（gzip 或 deflate）。LiteLLM 會在有利時自動處理壓縮。

好處：
- 降低網路使用量
- 更快的訊息傳遞
- 更低的資料傳輸成本

### 在 Sumo Logic 中查詢記錄 {#query-logs-in-sumo-logic}

一旦記錄開始流向 Sumo Logic，您就可以使用 Sumo Logic Query Language 進行查詢：

```sql
_sourceCategory=litellm
| json "model", "response_cost", "usage.total_tokens" as model, cost, tokens
| sum(cost) by model
```

範例查詢：

**依模型統計總成本：**
```sql
_sourceCategory=litellm
| json "model", "response_cost" as model, cost
| sum(cost) as total_cost by model
| sort by total_cost desc
```

**平均回應時間：**
```sql
_sourceCategory=litellm
| json "start_time", "end_time" as start, end
| parse regex field=start "(?<start_ms>\d+)"
| parse regex field=end "(?<end_ms>\d+)"
| (end_ms - start_ms) as response_time_ms
| avg(response_time_ms) as avg_response_time
```

**每位使用者的請求數：**
```sql
_sourceCategory=litellm
| json "model_parameters.user" as user
| count by user
```

## 驗證 {#authentication}

Sumo Logic HTTP Source URL 已包含驗證權杖，因此您只需要設定 `SUMOLOGIC_WEBHOOK_URL` 環境變數。

**安全最佳做法：**
- 請保密您的 HTTP Source URL（其中包含驗證權杖）
- 將其儲存在環境變數或密鑰管理中
- 若遭到外洩，請重新產生 URL（在 Sumo Logic UI 中）
- 為不同環境（dev、staging、prod）使用不同的 HTTP Sources

## 取得您的 Sumo Logic URL {#getting-your-sumo-logic-url}

1. 登入 [Sumo Logic](https://www.sumologic.com/)
2. 前往 **Manage Data** > **Collection** > **Collection**
3. 在 Hosted Collector 旁邊點擊 **Add Source**
4. 選取 **HTTP Logs & Metrics**
5. 設定來源：
   - **Name**: LiteLLM Logs
   - **Source Category**: litellm（選用，但有助於查詢）
6. 點擊 **Save**
7. 複製顯示的 URL - 會像這樣：
   ```
   https://collectors.sumologic.com/receiver/v1/http/ZaVnC4dhaV39Tn37...
   ```

## 疑難排解 {#troubleshooting}

### 記錄未出現在 Sumo Logic 中 {#logs-not-appearing-in-sumo-logic}

1. **確認 URL**：確認 `SUMOLOGIC_WEBHOOK_URL` 已正確設定
2. **檢查 HTTP Source**：確認它在 Sumo Logic UI 中處於啟用狀態
3. **等待批次處理**：記錄會以批次傳送，請等待 60 秒
4. **檢查錯誤**：在 LiteLLM 中啟用除錯記錄：
   ```python
   litellm.set_verbose = True
   ```

### URL 格式 {#url-format}

URL 必須是來自 Sumo Logic 的完整 HTTP Source URL：
- ✅ 正確：`https://collectors.sumologic.com/receiver/v1/http/ZaVnC4dhaV39Tn37...`

### 沒有驗證錯誤 {#no-authentication-errors}

如果您遇到驗證錯誤，請在 Sumo Logic 中重新產生 HTTP Source URL：
1. 前往您在 Sumo Logic 中的 HTTP Source
2. 點擊設定圖示
3. 點擊 **Show URL**
4. 點擊 **Regenerate URL**
5. 更新您的 `SUMOLOGIC_WEBHOOK_URL` 環境變數

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
