# 共用 Session 支援 {#shared-session-support}

## 概觀 {#overview}

LiteLLM 現在支援在多個 API 請求之間共用 `aiohttp.ClientSession` 實例，以避免建立不必要的新 session。這可提升效能與資源使用效率。

## 用法 {#usage}

### 基本用法 {#basic-usage}

```python
import asyncio
from aiohttp import ClientSession
from litellm import acompletion

async def main():
    # Create a shared session
    async with ClientSession() as shared_session:
        # Use the same session for multiple calls
        response1 = await acompletion(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello"}],
            shared_session=shared_session
        )
        
        response2 = await acompletion(
            model="gpt-4o", 
            messages=[{"role": "user", "content": "How are you?"}],
            shared_session=shared_session
        )
        
        # Both calls reuse the same session!

asyncio.run(main())
```

### 不使用共用 Session（預設） {#without-shared-session-default}

```python
import asyncio
from litellm import acompletion

async def main():
    # Each call creates a new session
    response1 = await acompletion(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}]
    )
    
    response2 = await acompletion(
        model="gpt-4o",
        messages=[{"role": "user", "content": "How are you?"}]
    )
    # Two separate sessions created

asyncio.run(main())
```

## 優點 {#benefits}

- **效能**：在多次呼叫之間重用 HTTP 連線
- **資源效率**：降低記憶體與連線額外負擔
- **更好的控制**：明確管理 session 生命週期
- **除錯**：容易追蹤哪些呼叫使用了哪些 session

## 除錯記錄 {#debug-logging}

啟用除錯記錄以查看 session 重用的實際運作：

```python
import os
import litellm

# Enable debug logging
os.environ['LITELLM_LOG'] = 'DEBUG'

# You'll see logs like:
# 🔄 SHARED SESSION: acompletion called with shared_session (ID: 12345)
# ✅ SHARED SESSION: Reusing existing ClientSession (ID: 12345)
```

## 常見模式 {#common-patterns}

### FastAPI 整合 {#fastapi-integration}

```python
from fastapi import FastAPI
import aiohttp
import litellm

app = FastAPI()

@app.post("/chat")
async def chat(messages: list[dict]):
    # Create session per request
    async with aiohttp.ClientSession() as session:
        return await litellm.acompletion(
            model="gpt-4o",
            messages=messages,
            shared_session=session
        )
```

### 批次處理 {#batch-processing}

```python
import asyncio
from aiohttp import ClientSession
from litellm import acompletion

async def process_batch(messages_list):
    async with ClientSession() as shared_session:
        tasks = []
        for messages in messages_list:
            task = acompletion(
                model="gpt-4o",
                messages=messages,
                shared_session=shared_session
            )
            tasks.append(task)
        
        # All tasks use the same session
        results = await asyncio.gather(*tasks)
        return results
```

### 自訂 Session 設定 {#custom-session-configuration}

```python
import aiohttp
import litellm

# Create optimized session
async with aiohttp.ClientSession(
    timeout=aiohttp.ClientTimeout(total=180),
    connector=aiohttp.TCPConnector(limit=300, limit_per_host=75)
) as shared_session:
    
    response = await litellm.acompletion(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
        shared_session=shared_session
    )
```

## 實作細節 {#implementation-details}

`shared_session` 參數會貫穿整個 LiteLLM 呼叫鏈：

1. **`acompletion()`** - 接受 `shared_session` 參數
2. **`BaseLLMHTTPHandler`** - 將 session 傳遞給 HTTP 用戶端建立
3. **`AsyncHTTPHandler`** - 若有提供則使用既有 session
4. **`LiteLLMAiohttpTransport`** - 針對 HTTP 請求重用該 session

## 向後相容性 {#backward-compatibility}

- **100% 向後相容** - 既有程式碼可不修改直接運作
- **可選參數** - 預設為 `shared_session=None`
- **無破壞性變更** - 保留所有既有功能

## 測試 {#testing}

測試共用 session 功能：

```python
import asyncio
from aiohttp import ClientSession
from litellm import acompletion

async def test_shared_session():
    async with ClientSession() as session:
        print(f"✅ Created session: {id(session)}")
        
        try:
            response = await acompletion(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Hello"}],
                shared_session=session,
                api_key="your-api-key"
            )
            print(f"Response: {response.choices[0].message.content}")
        except Exception as e:
            print(f"✅ Expected error: {type(e).__name__}")
        
        print("✅ Session control working!")

asyncio.run(test_shared_session())
```

## 已修改檔案 {#files-modified}

共用 session 功能已新增至以下檔案：

- `litellm/main.py` - 已將 `shared_session` 參數新增至 `acompletion()` 與 `completion()`
- `litellm/llms/custom_httpx/http_handler.py` - 核心 session 重用邏輯
- `litellm/llms/custom_httpx/llm_http_handler.py` - HTTP 處理常式整合
- `litellm/llms/openai/openai.py` - OpenAI 提供者整合
- `litellm/llms/openai/common_utils.py` - OpenAI 用戶端建立
- `litellm/llms/azure/chat/o_series_handler.py` - Azure O Series 處理常式

## 疑難排解 {#troubleshooting}

### Session 未被重用 {#session-not-being-reused}

1. **檢查除錯記錄**：啟用 `LITELLM_LOG=DEBUG` 以查看 session 重用訊息
2. **確認 session 未關閉**：進行請求時，請確保 session 仍處於啟用狀態
3. **檢查參數傳遞**：請確認 `shared_session` 已傳遞給所有 `acompletion()` 呼叫

### 效能問題 {#performance-issues}

1. **Session 設定**：依您的使用情境調整 `aiohttp.ClientSession` 參數
2. **連線限制**：在 `TCPConnector` 中調整 `limit` 與 `limit_per_host`
3. **逾時設定**：為您的環境設定適當的逾時時間
