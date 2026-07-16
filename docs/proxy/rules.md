# 呼叫後規則  {#post-call-rules}

使用此功能可根據 llm api call 的輸出來使請求失敗。

## 快速開始 {#quick-start}

### 步驟 1：建立檔案（例如 post_call_rules.py） {#step-1-create-a-file-eg-post_call_rulespy}

```python
def my_custom_rule(input): # receives the model response 
    if len(input) < 5: 
      return {
            "decision": False,
            "message": "This violates LiteLLM Proxy Rules. Response too short"
      }
    return {"decision": True}   # message not required since, request will pass
```

### 步驟 2：將其指向您的 proxy {#step-2-point-it-to-your-proxy}

```python
litellm_settings:
  post_call_rules: post_call_rules.my_custom_rule
```

### 步驟 3：啟動並測試您的 proxy {#step-3-start--test-your-proxy}

```bash
$ litellm /path/to/config.yaml
```

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
  "model": "gpt-3.5-turbo",
  "messages": [{"role":"user","content":"What llm are you?"}],
  "temperature": 0.7,
  "max_tokens": 10,
}'
```
---

這樣現在會檢查回應是否 > len 5，若失敗，則會在失敗前重試呼叫 3 次。

### 觸發規則失敗的回應 {#response-that-fail-the-rule}

這是 LiteLLM Proxy 在規則失敗時傳回的回應

```json
{
  "error":
    {
      "message":"This violates LiteLLM Proxy Rules. Response too short",
      "type":null,
      "param":null,
      "code":500
    }
}   
```
