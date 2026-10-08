# 自訂 HTTP 處理器 {#custom-http-handler}

為 LiteLLM completions 設定自訂 aiohttp sessions，以提升效能與控制能力。

## 總覽 {#overview}

您可以將自訂的 `aiohttp.ClientSession` 實例注入 LiteLLM，用於：
- 自訂連線池與逾時
- 企業代理伺服器與 SSL 設定  
- 效能最佳化
- 請求監控

:::info 範圍
`BaseLLMAIOHTTPHandler` 僅由 `aiohttp_openai/` 提供者（chat completions）以及 Topaz 圖片變體使用。對其他提供者的請求，包括純 `openai/`，會透過基於 httpx 的用戶端處理，且不受此處理器影響。

`litellm.completion` 呼叫的實例位於 `litellm.main` 模組中，因此替換內容必須指定給 `litellm.main.base_llm_aiohttp_handler`。設定 `litellm.base_llm_aiohttp_handler` 會在 `litellm` 套件上建立一個沒有人會讀取的新屬性，而自訂 session 會被靜默忽略。`litellm.images.main` 在匯入時會將自己對處理器的參考綁定，因此此指定不會改變 Topaz 圖片變體路徑。
:::

## 基本用法 {#basic-usage}

### 預設（無需變更） {#default-no-changes-required}
```python
import litellm

# Works exactly as before
response = await litellm.acompletion(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 自訂 Session {#custom-session}
```python
import aiohttp
import litellm
import litellm.main
from litellm.llms.custom_httpx.aiohttp_handler import BaseLLMAIOHTTPHandler

# Create optimized session
session = aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=180),
    connector=aiohttp.TCPConnector(limit=300, limit_per_host=75)
)

# Replace the handler that litellm.completion uses
litellm.main.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)

# aiohttp_openai/ completions now use your session
response = await litellm.acompletion(model="aiohttp_openai/{{openai_small}}", messages=[...])
```

## 常見模式 {#common-patterns}

### FastAPI 整合 {#fastapi-integration}
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import aiohttp
import litellm
import litellm.main
from litellm.llms.custom_httpx.aiohttp_handler import BaseLLMAIOHTTPHandler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    session = aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=180),
        connector=aiohttp.TCPConnector(limit=300)
    )
    litellm.main.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(
        client_session=session
    )
    yield
    # Shutdown
    await session.close()

app = FastAPI(lifespan=lifespan)

@app.post("/chat")
async def chat(messages: list[dict]):
    return await litellm.acompletion(model="aiohttp_openai/{{openai_small}}", messages=messages)
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

litellm.main.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)
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

litellm.main.base_llm_aiohttp_handler = BaseLLMAIOHTTPHandler(client_session=session)
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
