# Langfuse SDK {#langfuse-sdk}

適用於 Langfuse 的轉接端點 - 使用 LiteLLM Virtual Key 呼叫 langfuse 端點。

只要將 `https://us.cloud.langfuse.com` 替換為 `LITELLM_PROXY_BASE_URL/langfuse` 即可 🚀

#### **範例用法** {#example-usage}
```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="LITELLM_VIRTUAL_KEY",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```

支援 **所有** Langfuse 端點。

[**查看所有 Langfuse 端點**](https://api.reference.langfuse.com/)

## 快速開始 {#quick-start}

我們來將一個 trace 記錄到 Langfuse。

1. 將 Langfuse 公開/私有金鑰加入環境變數

```bash
export LANGFUSE_PUBLIC_KEY=""
export LANGFUSE_PRIVATE_KEY=""
```

2. 啟動 LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

我們來將一個 trace 記錄到 Langfuse！ 

```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="anything",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```


## 進階 - 搭配 Virtual Key 使用  {#advanced---use-with-virtual-keys}

前置需求
- [使用 DB 設定 proxy](../proxy/virtual_keys.md#setup)

使用這個方法，可避免將原始 Google AI Studio 金鑰提供給開發人員，同時仍讓他們能使用 Google AI Studio 端點。

### 用法 {#usage}

1. 設定環境

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export LANGFUSE_PUBLIC_KEY=""
export LANGFUSE_PRIVATE_KEY=""
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生 virtual key 

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應 

```bash
{
    ...
    "key": "sk-1234ewknldferwedojwojw"
}
```

3. 測試它！ 

```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="sk-1234ewknldferwedojwojw",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```

## [進階 - 將記錄寫入不同的 langfuse 專案（依金鑰/團隊）](../proxy/team_logging.md) {#advanced---log-to-separate-langfuse-projects-by-keyteamproxyteam_loggingmd}
