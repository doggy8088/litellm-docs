# 除錯 {#debugging}

支援 2 種除錯層級。 

- debug（印出資訊記錄）
- detailed debug（印出 debug 記錄）

proxy 也支援 json 記錄。[請見此處](#json-logs)

## `debug` {#debug}

**透過 cli**

```bash showLineNumbers
$ litellm --debug
```

**透過 env**

```python showLineNumbers
os.environ["LITELLM_LOG"] = "INFO"
```

## `detailed debug` {#detailed-debug}

**透過 cli**

```bash showLineNumbers
$ litellm --detailed_debug
```

**透過 env**

```python showLineNumbers
os.environ["LITELLM_LOG"] = "DEBUG"
```

### 除錯記錄  {#debug-logs}

以 `--detailed_debug` 執行 proxy 以檢視詳細除錯記錄
```shell showLineNumbers
litellm --config /path/to/config.yaml --detailed_debug
```

在發送請求時，您應該會在終端機輸出中看到 LiteLLM 傳送給 LLM 的 POST 請求
```shell showLineNumbers
POST Request Sent from LiteLLM:
curl -X POST \
https://api.openai.com/v1/chat/completions \
-H 'content-type: application/json' -H 'Authorization: Bearer sk-qnWGUIW9****************************************' \
-d '{"model": "{{openai_small}}", "messages": [{"role": "user", "content": "this is a test request, write a short poem"}]}'
```

## 除錯單一請求 {#debug-single-request}

在請求本文中傳入 `litellm_request_debug=True`

```bash showLineNumbers
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{ 
    "model":"fake-openai-endpoint",
    "messages": [{"role": "user","content": "How many r in the word strawberry?"}],
    "litellm_request_debug": true
}'
```

這會在記錄中輸出 LiteLLM 傳送給 API 提供者的原始請求，以及從 API 提供者收到的原始回應，且**只針對**這個請求。 

```bash showLineNumbers keep-model-ids
INFO:     Uvicorn running on http://0.0.0.0:4000 (Press CTRL+C to quit)
20:14:06 - LiteLLM:WARNING: litellm_logging.py:938 - 

POST Request Sent from LiteLLM:
curl -X POST \
https://exampleopenaiendpoint-production.up.railway.app/chat/completions \
-H 'Authorization: Be****ey' -H 'Content-Type: application/json' \
-d '{'model': 'fake', 'messages': [{'role': 'user', 'content': 'How many r in the word strawberry?'}], 'stream': False}'


20:14:06 - LiteLLM:WARNING: litellm_logging.py:1015 - RAW RESPONSE:
{"id":"chatcmpl-817fc08f0d6c451485d571dab39b26a1","object":"chat.completion","created":1677652288,"model":"gpt-3.5-turbo-0301","system_fingerprint":"fp_44709d6fcb","choices":[{"index":0,"message":{"role":"assistant","content":"\n\nHello there, how may I assist you today?"},"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":9,"completion_tokens":12,"total_tokens":21}}


INFO:     127.0.0.1:56155 - "POST /chat/completions HTTP/1.1" 200 OK

```

## JSON 記錄 {#json-logs}

在您的環境中設定 `JSON_LOGS="True"`：

```bash showLineNumbers
export JSON_LOGS="True"
```
**或**

在您的 yaml 中設定 `json_logs: true`： 

```yaml showLineNumbers
litellm_settings:
    json_logs: true
```

啟動 proxy 

```bash showLineNumbers
$ litellm
```

proxy 現在會以 json 格式記錄所有記錄。

## 請求關聯 ID {#request-correlation-ids}

設定 `request_correlation_in_logs: true` 以在每一條記錄行上加上該請求的 `trace_id` 與 `session_id`。這可讓您將記錄彙總器篩選到與單一請求相關的每一條記錄，或單一終端使用者工作階段中的每一個請求，而無需在每個呼叫點新增記錄呼叫。可同時適用於純文字與 JSON 記錄

```yaml showLineNumbers
litellm_settings:
    request_correlation_in_logs: true
```

`trace_id` 來自 `x-litellm-trace-id` 請求標頭（若未設定該標頭，則每個請求會重新產生）。`session_id` 來自請求本文中的 `litellm_session_id`，或來自 `x-litellm-session-id` 標頭；完整解析順序請參閱[請求標頭](./request_headers#litellm-headers)。只有在實際提供了工作階段 ID 後，才會將其新增到記錄行中

如果這兩個明確標頭都不存在，`trace_id`/`session_id` 會分別回退到標準的 [W3C Trace Context](https://www.w3.org/TR/trace-context/) `traceparent` 標頭與 [W3C Baggage](https://www.w3.org/TR/baggage/) `baggage` 標頭：`traceparent` 中的 trace-id 會成為 `trace_id`，而 `baggage` 中的 `session.id` 項目會成為 `session_id`。這可讓已攜帶真實 OpenTelemetry trace context 的請求，將 litellm 的記錄與您現有可觀測性後端中的相同 trace 建立關聯，而無需額外的 litellm 專屬標頭。若存在明確的 litellm 標頭，則一律以其為優先

含有 `json_logs: true` 的範例記錄行：

```json showLineNumbers
{"message": "...", "level": "INFO", "timestamp": "...", "trace_id": "2a5cbcfa-ccdf-493c-858b-eb8e9b07f32c", "session_id": "user-123-session-1"}
```

沒有 `json_logs` 的範例記錄行（純文字）：

```bash showLineNumbers
15:30:43 - LiteLLM Proxy:ERROR: common_request_processing.py:848 - some log message [trace_id=2a5cbcfa-ccdf-493c-858b-eb8e9b07f32c session_id=user-123-session-1]
```

`request_correlation_in_logs` 也會為 `StandardLoggingPayload`（傳送至 S3 和 Langfuse 等記錄整合）的 `session_id` 欄位新增一個獨立欄位，並以相同方式填入。請參閱 [StandardLoggingPayload 規格](./logging_spec#standardloggingpayload)

`trace_id` 和 `session_id` 在儲存前都會先經過清理：控制字元（包括 `\r`/`\n`）會被移除，且值會上限為 256 個字元，因此呼叫端提供的 `litellm_session_id` 無法用來偽造假的記錄行或讓記錄儲存量膨脹

此旗標預設為 `false`，因此在您啟用之前，既有的記錄輸出不會受到影響。

這目前適用於由 proxy 處理的請求，以及直接透過 SDK 發出的 `litellm.acompletion()` 呼叫。同步 SDK 呼叫（`litellm.completion()`）尚未會加上 `trace_id`/`session_id`；這一路徑的支援已規劃為後續補充。

## 控制記錄輸出  {#control-log-output}

關閉 fastapi 的預設 'INFO' 記錄 

1. 開啟 'json logs' 
```yaml showLineNumbers
litellm_settings:
    json_logs: true
```

2. 將 `LITELLM_LOG` 設為 'ERROR' 

只有在發生錯誤時才會取得記錄。 

```bash showLineNumbers
LITELLM_LOG="ERROR"
```

3. 啟動 proxy 

```bash showLineNumbers
$ litellm
```

預期輸出： 

```bash showLineNumbers
# no info statements
```

## 常見錯誤  {#common-errors}

1. "No available deployments..."

```
No deployments available for selected model, Try again in 60 seconds. Passed model={{anthropic}}. pre-call-checks=False, allowed_model_region=n/a.
```

這可能是因為您的所有模型都觸發了速率限制錯誤，導致冷卻機制啟動。 

要如何控制這個情況？ 
- 調整冷卻時間

```yaml showLineNumbers
router_settings:
    cooldown_time: 0 # 👈 KEY CHANGE
```

- 停用冷卻機制 [不建議]

```yaml showLineNumbers
router_settings:
    disable_cooldowns: True
```

不建議這麼做，因為這會導致請求被路由到超過其 tpm/rpm 限制的部署。
