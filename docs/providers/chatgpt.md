# ChatGPT 訂閱 {#chatgpt-subscription}

透過 LiteLLM 與 OAuth 裝置流程驗證使用 ChatGPT Pro/Max 訂閱模型。

| 屬性 | 詳細資料 |
|-------|-------|
| 描述 | 透過 ChatGPT 後端 API 存取 ChatGPT 訂閱（Codex + GPT-5.3/5.4 系列） |
| LiteLLM 上的提供者路由 | `chatgpt/` |
| 支援的端點 | `/responses`、`/chat/completions`（對支援的模型橋接至 Responses） |
| API 參考 | https://chatgpt.com |

ChatGPT 訂閱存取原生支援 Responses API。Chat Completions 請求會針對支援的模型橋接至 Responses（例如 `chatgpt/gpt-5.4`）。

備註：
- ChatGPT 訂閱後端會拒絕 token 限制欄位（`max_tokens`、`max_output_tokens`、`max_completion_tokens`）以及 `metadata`。LiteLLM 會為此提供者移除這些欄位。
- `/v1/chat/completions` 會遵循 `stream`。當 `stream` 為 false（預設）時，LiteLLM 會將 Responses 串流彙整為單一 JSON 回應。

## 驗證 {#authentication}

ChatGPT 訂閱存取使用 OAuth 裝置代碼流程：

1. LiteLLM 會列印裝置代碼與驗證 URL
2. 開啟 URL、登入，然後輸入代碼
3. 權杖會儲存在本機以供重複使用

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### Responses（Codex 模型建議使用） {#responses-recommended-for-codex-models}

```python showLineNumbers title="ChatGPT Responses"
import litellm

response = litellm.responses(
    model="chatgpt/gpt-5.3-codex",
    input="Write a Python hello world"
)

print(response)
```

### Chat Completions（橋接至 Responses） {#chat-completions-bridged-to-responses}

```python showLineNumbers title="ChatGPT Chat Completions"
import litellm

response = litellm.completion(
    model="chatgpt/gpt-5.4",
    messages=[{"role": "user", "content": "Write a Python hello world"}]
)

print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chatgpt/gpt-5.4
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.4
  - model_name: chatgpt/gpt-5.4-pro
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.4-pro
  - model_name: chatgpt/gpt-5.3-codex
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-codex
  - model_name: chatgpt/gpt-5.3-codex-spark
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-codex-spark
  - model_name: chatgpt/gpt-5.3-instant
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-instant
  - model_name: chatgpt/gpt-5.3-chat-latest
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-chat-latest
```

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

## 設定 {#configuration}

### 環境變數 {#environment-variables}

- `CHATGPT_TOKEN_DIR`：自訂權杖儲存目錄
- `CHATGPT_AUTH_FILE`：驗證檔案名稱（預設：`auth.json`）
- `CHATGPT_API_BASE`：覆寫 API base（預設：`https://chatgpt.com/backend-api/codex`）
- `OPENAI_CHATGPT_API_BASE`：`CHATGPT_API_BASE` 的別名
- `CHATGPT_ORIGINATOR`：覆寫 `originator` 標頭值
- `CHATGPT_USER_AGENT`：覆寫 `User-Agent` 標頭值
- `CHATGPT_USER_AGENT_SUFFIX`：附加到 `User-Agent` 標頭的選用尾碼
