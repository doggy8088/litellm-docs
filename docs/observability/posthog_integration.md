# PostHog {#posthog}

## PostHog 是什麼？ {#what-is-posthog}

PostHog 是一個開源的產品分析平台，可協助您追蹤並分析使用者如何與您的產品互動。對於 LLM 應用程式，PostHog 提供專門的 AI 功能，可追蹤模型使用情況、效能以及使用者與您的 AI 功能的互動。

## 與 LiteLLM Proxy（LLM 閘道）搭配使用 {#usage-with-litellm-proxy-llm-gateway}

**步驟 1**：建立一個 `config.yaml` 檔案並設定 `litellm_settings`： `success_callback`

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo

litellm_settings:
  success_callback: ["posthog"]
  failure_callback: ["posthog"]
```

**步驟 2**：設定必要的環境變數

```shell
export POSTHOG_API_KEY="your-posthog-api-key"
# Optional, defaults to https://app.posthog.com
export POSTHOG_API_URL="https://app.posthog.com" # optional
```

**步驟 3**：啟動 proxy，發出測試請求

啟動 proxy

```shell
litellm --config config.yaml --debug
```

測試請求

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "metadata": {
        "user_id": "user-123",
        "custom_field": "custom_value"
    }
}'
```

### 基於團隊的記錄 {#team-based-logging}

使用團隊回呼設定，為每個團隊設定不同的 PostHog 憑證：

```bash
curl -X POST 'http://localhost:4000/team/{team_id}/callback' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "posthog",
    "callback_type": "success",
    "callback_vars": {
      "posthog_api_key": "ph_team_specific_key",
      "posthog_api_url": "https://custom.posthog.com"
    }
  }'
```

現在來自該團隊的所有請求都會記錄到其專屬的 PostHog 專案。

## 與 LiteLLM Python SDK 搭配使用 {#usage-with-litellm-python-sdk}

### 快速開始 {#quick-start}

只需 2 行程式碼，即可透過 PostHog 立即記錄您在**所有提供者**上的回應：

```python
litellm.success_callback = ["posthog"]
litellm.failure_callback = ["posthog"] # logs errors to posthog
```
```python
import litellm
import os

# from PostHog
os.environ["POSTHOG_API_KEY"] = ""
# Optional, defaults to https://app.posthog.com
os.environ["POSTHOG_API_URL"] = "" # optional

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set posthog as a callback, litellm will send the data to posthog
litellm.success_callback = ["posthog"]

# openai call
response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hi - i'm openai"}
    ],
    metadata = {
        "user_id": "user-123", # set posthog user ID
    }
)
```

### 進階 {#advanced}

#### 設定使用者 ID 與自訂中繼資料 {#set-user-id-and-custom-metadata}

在 `metadata` 中傳入 `user_id`，即可在 PostHog 中將事件與特定使用者關聯：

**使用 LiteLLM Python SDK：**

```python
import litellm

litellm.success_callback = ["posthog"]

response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hello world"}
    ],
    metadata={
        "user_id": "user-123",  # Add user ID for PostHog tracking
        "custom_field": "custom_value"  # Add custom metadata
    }
)
```

**使用 OpenAI Python SDK 搭配 LiteLLM Proxy：**

```python
import openai

client = openai.OpenAI(
    api_key="sk-1234",  # Your LiteLLM Proxy API key
    base_url="http://0.0.0.0:4000"  # Your LiteLLM Proxy URL
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hello world"}
    ],
    extra_body={
        "metadata": {
            "user_id": "user-123",  # Add user ID for PostHog tracking
            "project_name": "my-project",  # Add custom metadata
            "environment": "production"
        }
    }
)
```

#### 每次請求的憑證 {#per-request-credentials}

您可以針對每次請求覆寫 PostHog 憑證：

```python
import litellm

litellm.success_callback = ["posthog"]

# Use custom PostHog credentials for this specific request
response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hello world"}
    ],
    posthog_api_key="ph_custom_project_key",
    posthog_api_url="https://custom.posthog.com"
)
```

這在您需要以下情況時很有用：
- 將不同團隊/專案的記錄分送到不同的 PostHog 執行個體
- 為測試環境與正式環境使用不同的 PostHog 專案
- 根據客戶或租戶路由記錄

#### 停用特定呼叫的記錄 {#disable-logging-for-specific-calls}

使用 `no-log` 旗標可防止特定呼叫被記錄：

```python
import litellm

litellm.success_callback = ["posthog"]

response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "This won't be logged"}
    ],
    metadata={"no-log": True}
)
```

## PostHog 會記錄什麼？ {#whats-logged-to-posthog}

當 LiteLLM 記錄到 PostHog 時，會擷取有關您 LLM 使用情況的詳細資訊：

### 針對完成請求 {#for-completion-calls}
- **模型資訊**：提供者、模型名稱、模型參數
- **使用指標**：輸入 token、輸出 token、總成本
- **效能**：延遲、完成時間
- **內容**：輸入訊息、模型回應（遵循隱私設定）
- **中繼資料**：自訂欄位、使用者 ID、追蹤資訊

### 針對嵌入請求 {#for-embedding-calls}
- **模型資訊**：提供者、模型名稱
- **使用指標**：輸入 token、總成本
- **效能**：延遲
- **內容**：輸入文字（遵循隱私設定）
- **中繼資料**：自訂欄位、使用者 ID、追蹤資訊

### 針對錯誤 {#for-errors}
- **錯誤詳細資訊**：錯誤類型、錯誤訊息、堆疊追蹤
- **內容**：造成錯誤的模型、提供者、輸入
- **時間**：錯誤發生時間、請求持續時間

## 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `POSTHOG_API_KEY` | 是 | 您的 PostHog 專案 API 金鑰 |
| `POSTHOG_API_URL` | 否 | PostHog API URL（預設為 https://app.posthog.com） |

## 疑難排解 {#troubleshooting}

### 1. 缺少 API 金鑰 {#1-missing-api-key}
```
Error: POSTHOG_API_KEY is not set
```

設定您的 PostHog API 金鑰：
```python
import os
os.environ["POSTHOG_API_KEY"] = "your-api-key"
```

### 2. 自訂 PostHog 執行個體 {#2-custom-posthog-instance}
如果您使用的是自架的 PostHog 執行個體：
```python
import os
os.environ["POSTHOG_API_URL"] = "https://your-posthog-instance.com"
```

### 3. 事件未顯示 {#3-events-not-appearing}
- 檢查您的 API 金鑰是否正確
- 驗證與 PostHog 的網路連線是否正常
- 事件可能需要幾分鐘才會出現在 PostHog 儀表板中
