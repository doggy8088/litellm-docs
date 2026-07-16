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
-d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "this is a test request, write a short poem"}]}'
```

## 除錯單一請求 {#debug-single-request}

在請求本文中傳入 `litellm_request_debug=True`

```bash showLineNumbers
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{ 
    "model":"fake-openai-endpoint",
    "messages": [{"role": "user","content": "How many r in the word strawberry?"}],
    "litellm_request_debug": true
}'
```

這會在記錄中輸出 LiteLLM 傳送給 API 提供者的原始請求，以及從 API 提供者收到的原始回應，且**只針對**這個請求。 

```bash showLineNumbers
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
No deployments available for selected model, Try again in 60 seconds. Passed model=claude-3-5-sonnet. pre-call-checks=False, allowed_model_region=n/a.
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
