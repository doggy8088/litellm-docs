# 延遲額外負擔疑難排解 {#latency-overhead-troubleshooting}

當您看到 LiteLLM proxy 與 LLM 提供者之間有非預期的延遲額外負擔時，請使用本指南。

## 看不見的延遲落差 {#the-invisible-latency-gap}

LiteLLM 會從其處理常式開始執行時開始計算延遲。如果請求在 uvicorn 的事件迴圈中於 **處理常式執行之前** 等待，這段等待對 LiteLLM 自己的記錄來說是看不見的。

```
T=0   Request arrives at load balancer
      [queue wait — LiteLLM never logs this]
T=10  LiteLLM handler starts → timer begins
T=20  Response sent

LiteLLM logs: 10s    User experiences: 20s
```

要量測處理常式前的等待時間，請在每個 pod 上輪詢 `/health/backlog`：

```bash
curl http://localhost:4000/health/backlog \
  -H "Authorization: Bearer sk-..."
# {"in_flight_requests": 47}
```

或者從 `litellm_in_flight_requests` Prometheus gauge 抓取 `/metrics`。

| `in_flight_requests` | ALB `TargetResponseTime` | 診斷 |
|---|---|---|
| 高 | 高 | pod 過載 → 擴充 |
| 低 | 高 | 延遲發生在 ASGI 之前 — 檢查同步阻塞程式碼或事件迴圈飽和 |
| 高 | 正常 | pod 忙碌但健康，沒有佇列累積 |

如果您使用的是 **AWS ALB**，請將 `litellm_in_flight_requests` 的尖峰與 ALB 的 `TargetResponseTime` CloudWatch 指標進行關聯。ALB 回報的數值與 LiteLLM 記錄的數值之間的落差，就是看不見的等待時間。

## 快速檢查清單 {#quick-checklist}

1. **透過 `/health/backlog` 或 `litellm_in_flight_requests` Prometheus gauge 檢查每個 pod 上的 `in_flight_requests`** — 這會告訴您請求是否在 LiteLLM 開始處理之前就已排隊。若有無法解釋的延遲，請先從這裡開始。
2. **收集 `x-litellm-overhead-duration-ms` 回應標頭** — 這會告訴您 LiteLLM 在每個請求上的總額外負擔。
2. **是否啟用 DEBUG 記錄？** 這是大型酬載造成延遲的首要原因。
3. **您是否傳送大型 base64 酬載？**（圖片、PDF）— 請參閱 [大型酬載額外負擔](#large-payload-overhead)。
4. **啟用詳細時間標頭**，以找出時間耗費在哪裡。

## 診斷標頭 {#diagnostic-headers}

### `x-litellm-overhead-duration-ms`（一律啟用） {#x-litellm-overhead-duration-ms-always-on}

LiteLLM 的每個回應都會包含此標頭。它會顯示 LiteLLM proxy 所增加的總延遲額外負擔（毫秒），也就是總回應時間減去 LLM API 呼叫時間。請在每個請求上收集此資訊，以了解您的基準額外負擔。

```bash
curl -s -D - http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]}' \
  2>&1 | grep x-litellm-overhead-duration-ms
```

### `x-litellm-callback-duration-ms`（一律啟用） {#x-litellm-callback-duration-ms-always-on}

顯示建立 callback/記錄酬載所花費的時間（ms）。如果這個值很高（>100ms），您的酬載可能過大，不利於有效率地記錄。

```bash
curl -s -D - http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]}' \
  2>&1 | grep x-litellm
```

### 詳細時間分解（可選啟用） {#detailed-timing-breakdown-opt-in}

設定 `LITELLM_DETAILED_TIMING=true` 以在回應標頭中取得各階段的時間：

| 標頭 | 衡量內容 |
|--------|-----------------|
| `x-litellm-timing-pre-processing-ms` | 驗證、路由、請求處理（LLM 呼叫前） |
| `x-litellm-timing-llm-api-ms` | 實際 LLM API 呼叫持續時間 |
| `x-litellm-timing-post-processing-ms` | 回應處理（LLM 返回後） |
| `x-litellm-timing-message-copy-ms` | 記錄層中的訊息複製時間 |

```bash
# Enable detailed timing
export LITELLM_DETAILED_TIMING=true
```

## 大型酬載額外負擔 {#large-payload-overhead}

當傳送大型酬載（>1MB，例如 base64 編碼的圖片/PDF）時，會有三件事可能增加額外負擔：

### 1. DEBUG 記錄（最常見） {#1-debug-logging-most-common}

當啟用 `LITELLM_LOG=DEBUG` 或 `set_verbose=True` 時，每個請求酬載都會以 `json.dumps(indent=4)` 同步序列化。對於 2MB 以上的酬載，單這一步就可能花費 **2-5 秒**。

**修正方式：** 請勿在正式環境使用 DEBUG 記錄。改用 `INFO` 等級：

```bash
export LITELLM_LOG=INFO
```

如果您需要 DEBUG 記錄但有大型酬載，可以提高完整酬載記錄的大小閾值：

```bash
# Only fully serialize payloads under 100KB for DEBUG logs (default)
export MAX_PAYLOAD_SIZE_FOR_DEBUG_LOG=102400
```

### 2. 記錄酬載中的 Base64 {#2-base64-in-logging-payloads}

callback 酬載（傳送到 Langfuse 等）包含訊息內容。大型 base64 字串會在記錄酬載中自動截斷為大小佔位符。

您可以控制截斷閾值：

```bash
# Max base64 characters before truncation (default: 64)
export MAX_BASE64_LENGTH_FOR_LOGGING=64
```

## 環境變數參考 {#environment-variables-reference}

| 變數 | 預設值 | 說明 |
|----------|---------|-------------|
| `LITELLM_DETAILED_TIMING` | `false` | 啟用各階段時間標頭 |
| `MAX_PAYLOAD_SIZE_FOR_DEBUG_LOG` | `102400` | 完整 DEBUG 序列化的最大酬載位元組數 |
| `MAX_BASE64_LENGTH_FOR_LOGGING` | `64` | 記錄中截斷前允許的最大 base64 字元數 |
