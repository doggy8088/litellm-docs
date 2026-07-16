import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GitHub Copilot {#github-copilot}

https://docs.github.com/en/copilot

:::tip

**我們支援具自動驗證處理的 GitHub Copilot Chat API**

:::

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | GitHub Copilot Chat API 可存取 GitHub 的 AI 驅動程式碼助理。 |
| LiteLLM 提供者路由 | `github_copilot/` |
| 支援的端點 | `/chat/completions`, `/embeddings` |
| API Reference | [GitHub Copilot 文件](https://docs.github.com/en/copilot) |

## 驗證 {#authentication}

GitHub Copilot 使用 OAuth device flow 進行驗證。第一次使用時，系統會提示您透過 GitHub 進行驗證：

1. LiteLLM 會顯示 device code 和驗證 URL
2. 前往該 URL 並輸入代碼以完成驗證
3. 您的憑證會儲存在本機供日後使用

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completion}

```python showLineNumbers title="GitHub Copilot Chat Completion"
from litellm import completion

response = completion(
    model="github_copilot/gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful coding assistant"},
        {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
    ]
)
print(response)
```

```python showLineNumbers title="GitHub Copilot Chat Completion - Streaming"
from litellm import completion

stream = completion(
    model="github_copilot/gpt-4",
    messages=[{"role": "user", "content": "Explain async/await in Python"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

### 回應 {#responses}

對於 GPT Codex models，僅支援 responses API。

```python showLineNumbers title="GitHub Copilot Responses"
import litellm

response = await litellm.aresponses(
    model="github_copilot/gpt-5.1-codex",
    input="Write a Python hello world",
    max_output_tokens=500
)

print(response)
```

### 嵌入 {#embedding}

```python showLineNumbers title="GitHub Copilot Embedding"
import litellm

response = litellm.embedding(
    model="github_copilot/text-embedding-3-small",
    input=["good morning from litellm"]
)
print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容新增到您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: github_copilot/gpt-4
    litellm_params:
      model: github_copilot/gpt-4
  - model_name: github_copilot/gpt-5.1-codex
    model_info:
      mode: responses
    litellm_params:
      model: github_copilot/gpt-5.1-codex
  - model_name: github_copilot/text-embedding-ada-002
    model_info:
      mode: embedding
    litellm_params:
      model: github_copilot/text-embedding-ada-002
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="GitHub Copilot via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="github_copilot/gpt-4",
    messages=[{"role": "user", "content": "How do I optimize this SQL query?"}]
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="GitHub Copilot via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/github_copilot/gpt-4",
    messages=[{"role": "user", "content": "Review this code for bugs"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="GitHub Copilot via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "github_copilot/gpt-4",
    "messages": [{"role": "user", "content": "Explain this error message"}]
  }'
```

</TabItem>
</Tabs>

## 開始使用 {#getting-started}

1. 確保您擁有 GitHub Copilot 存取權限（需要付費 GitHub 訂閱）
2. 執行您的第一個 LiteLLM 請求 - 系統會提示您進行驗證
3. 依照 device flow 驗證程序操作
4. 開始透過 LiteLLM 向 GitHub Copilot 發送請求

## 設定 {#configuration}

### 環境變數 {#environment-variables}

您可以自訂 token 儲存位置：

```bash showLineNumbers title="Environment Variables"
# Optional: Custom token directory
export GITHUB_COPILOT_TOKEN_DIR="~/.config/litellm/github_copilot"

# Optional: Custom access token file name
export GITHUB_COPILOT_ACCESS_TOKEN_FILE="access-token"

# Optional: Custom API key file name
export GITHUB_COPILOT_API_KEY_FILE="api-key.json"

# Optional: Custom Copilot endpoints for authentication and usage
# (needed when using GitHub Enterprise subscriptions with custom endpoints or self-hosted GitHub servers
export GITHUB_COPILOT_API_BASE="https://copilot-api.my-company.ghe.com"
export GITHUB_COPILOT_DEVICE_CODE_URL="https://my-company.ghe.com/login/device/code"
export GITHUB_COPILOT_ACCESS_TOKEN_URL="https://my-company.ghe.com/login/oauth/access_token"
export GITHUB_COPILOT_API_KEY_URL="https://my-company.ghe.com/api/v3/copilot_internal/v2/token"
```

### 標頭 {#headers}

LiteLLM 會自動注入所需的 GitHub Copilot 標頭（模擬 VSCode）。您不需要手動指定它們。

如果您想覆寫預設值（例如，模擬不同的編輯器），可以使用 `extra_headers`：

```python showLineNumbers title="Custom Headers (Optional)"
extra_headers = {
    "editor-version": "vscode/1.85.1",           # Editor version
    "editor-plugin-version": "copilot/1.155.0",  # Plugin version
    "Copilot-Integration-Id": "vscode-chat",     # Integration ID
    "user-agent": "GithubCopilot/1.155.0"        # User agent
}
```
