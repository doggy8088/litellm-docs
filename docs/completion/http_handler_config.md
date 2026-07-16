# 自訂 HTTP 處理器 {#custom-http-handler}

為 LiteLLM completions 設定自訂 aiohttp sessions，以提升效能與控制能力。

## 總覽 {#overview}

您現在可以將自訂 `aiohttp.ClientSession` 實例注入 LiteLLM，用於：
- 自訂連線池與逾時
- 企業代理與 SSL 設定  
- 效能最佳化
- 請求監控

## 基本用法 {#basic-usage}

### 預設（無需變更） {#default-no-changes-required}
```python
import litellm

# Works exactly as before
response = await litellm.acompletion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 自訂 Session {#custom-session}
```python
import aiohttp
import litellm
from litellm.llms.custom_httpx.aiohttp_handler import BaseLLMAIOHTTPHandler

# Create optimized session
session = aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=180),
    connector=aiohttp.TCPConnector(limit=300, limit_per_host=75)
)

# Replace global handler
litellm.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)

# All completions now use your session
response = await litellm.acompletion(model="gpt-3.5-turbo", messages=[...])
```

## 常見模式 {#common-patterns}

### FastAPI 整合 {#fastapi-integration}
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import aiohttp
import litellm

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    session = aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=180),
        connector=aiohttp.TCPConnector(limit=300)
    )
    litellm.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(
        client_session=session
    )
    yield
    # Shutdown
    await session.close()

app = FastAPI(lifespan=lifespan)

@app.post("/chat")
async def chat(messages: list[dict]):
    return await litellm.acompletion(model="gpt-3.5-turbo", messages=messages)
```

### 企業代理 {#corporate-proxy}
```python
import ssl

# Custom SSL context
ssl_context = ssl.create_default_context()
ssl_context.load_cert_chain('cert.pem', 'key.pem')

# Proxy session
session = aiohttp.ClientSession(
    connector=aiohttp.TCPConnector(ssl=ssl_context),
    trust_env=True  # Use environment proxy settings
)

litellm.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)
```

### 高效能 {#high-performance}
```python
# Optimized for high throughput
session = aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=300),
    connector=aiohttp.TCPConnector(
        limit=1000,             # High connection limit
        limit_per_host=200,     # Per host limit
        ttl_dns_cache=600,      # DNS cache
        keepalive_timeout=60,   # Keep connections alive
        enable_cleanup_closed=True
    )
)

litellm.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)
```

## 建構式選項 {#constructor-options}

```python
BaseLLMAIOHTTPHandler(
    client_session=None,    # Custom aiohttp.ClientSession
    transport=None,         # Advanced transport control
    connector=None,         # Custom aiohttp.BaseConnector
)
```

## 資源管理 {#resource-management}

- **使用者 sessions**：由您管理生命週期（呼叫 `await session.close()`）
- **自動建立的 sessions**：由處理器自動清理
- **100% 向後相容**：既有程式碼可原樣運作

## 設定提示 {#configuration-tips}

### 開發 {#development}
```python
session = aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=60),
    connector=aiohttp.TCPConnector(limit=50)
)
```

### 生產環境 {#production}
```python
session = aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=300),
    connector=aiohttp.TCPConnector(
        limit=1000,
        limit_per_host=200,
        keepalive_timeout=60
    )
)
```
