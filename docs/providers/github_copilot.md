import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GitHub Copilot {#github-copilot}

https://docs.github.com/en/copilot

:::tip

**我們支援具自動驗證處理的 GitHub Copilot Chat API**

:::

| Property | Details |
|-------|-------|
| Description | GitHub Copilot Chat API 可讓您存取 GitHub 的 AI 驅動程式碼助理。 |
| Provider Route on LiteLLM | `github_copilot/` |
| Supported Endpoints | `/chat/completions`, `/responses`, `/embeddings`, `/v1/messages` |
| API Reference | [GitHub Copilot 文件](https://docs.github.com/en/copilot) |

## 驗證 {#authentication}

GitHub Copilot 使用 OAuth 裝置流程。LiteLLM Python SDK 會在第一次需要權杖時執行此流程，前提是它是從主執行緒上的同步腳本呼叫：它會印出驗證 URL 和裝置代碼，您前往該 URL 並輸入代碼，然後 GitHub 權杖會儲存在 `~/.config/litellm/github_copilot/access-token` 供日後使用。非同步程式碼、筆記本、工作執行緒，以及 LiteLLM 代理程式都無法回應該提示（舊版會卡在那裡，較新版則會以 `GitHub Copilot device-code login needs a human` 失敗），因此對於代理程式，您需要先登入並掛載權杖，如 [啟動代理程式前先登入](#sign-in-before-starting-the-proxy) 所述。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completion}

```python showLineNumbers title="GitHub Copilot Chat Completion"
from litellm import completion

response = completion(
    model="github_copilot/gpt-5.2",
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
    model="github_copilot/gpt-5.2",
    messages=[{"role": "user", "content": "Explain async/await in Python"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

### 回應 {#responses}

GPT Codex 模型（例如 `gpt-5.3-codex`）僅支援 Responses API。支援兩個端點的模型（例如 `gpt-5.2`）會傳送到 Copilot 的 `/chat/completions`，除非其 `model_info` 設定了 `mode: responses`。此範例是非同步的，因此無法自行完成首次登入：在尚未有權杖的機器上，請先使用 [啟動代理程式前先登入](#sign-in-before-starting-the-proxy) 中的一行指令完成登入

```python showLineNumbers title="GitHub Copilot Responses"
import litellm

response = await litellm.aresponses(
    model="github_copilot/gpt-5.3-codex",
    input="Write a Python hello world",
    max_output_tokens=500
)

print(response)
```

### Anthropic 訊息 {#anthropic-messages}

Claude 模型可以透過 Copilot 的原生 Anthropic `/v1/messages` 端點呼叫。

```python showLineNumbers title="GitHub Copilot Anthropic Messages"
import litellm

response = await litellm.anthropic.messages.acreate(
    model="github_copilot/claude-sonnet-4.5",
    messages=[{"role": "user", "content": "Write a Python hello world"}],
    max_tokens=500,
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

### 啟動代理程式前先登入 {#sign-in-before-starting-the-proxy}

代理程式無法完成裝置流程：它在工作程序中執行，沒有終端可用來接收代碼。若磁碟上沒有 `access-token`，舊版會從工作程序印出代碼，並在每個 `github_copilot/` 部署上暫停啟動，直到有人輸入為止（從前景終端可以，每個工作程序一次，期間會暫停啟動；從服務或容器記錄則沒有人可以），而較新版則會拒絕初始化該部署，並在每個工作程序中每個部署記錄一次 `GitHub Copilot device-code login needs a human and cannot run inside a running event loop or a worker thread`。無論哪種情況，對這些模型的每個請求之後都會回傳 HTTP 400 `There are no healthy deployments for this model`。請先從終端登入一次：

```bash showLineNumbers title="Sign in once, outside the proxy"
python -c "from litellm.llms.github_copilot.authenticator import Authenticator; Authenticator().get_access_token()"
```

前往列印出的 URL 並輸入代碼：每個代碼大約只有效一分鐘（SDK 會每隔五秒輪詢十二次），而且在輸入三個代碼後就會以 `Failed to get access token after 3 attempts` 放棄，因此請在執行前先讓 GitHub 開啟並登入。GitHub 權杖會存放在 `~/.config/litellm/github_copilot/access-token`（`GITHUB_COPILOT_TOKEN_DIR` 和 `GITHUB_COPILOT_ACCESS_TOKEN_FILE` 會變更位置）。請將該檔案放在代理程式主機上的相同路徑，或將 `GITHUB_COPILOT_TOKEN_DIR` 設定為包含它的目錄，然後才啟動代理程式：`model_list` 部署會在啟動時建立，因此若代理程式是在沒有該檔案的情況下啟動，在檔案出現後需要重新啟動。該目錄必須可由代理程式使用者寫入（在 `litellm-non_root` 映像檔中 uid 為 65534），因為 LiteLLM 會將 GitHub 權杖交換成短效 Copilot API 金鑰，並將其快取在權杖旁邊，檔名為 `api-key.json`；當無法寫入該檔案時，部署在啟動時會失敗，情況與缺少權杖相同，並在 `Error creating deployment` 記錄行中顯示 `Failed to save API key`。

在 Kubernetes 上，請將 `access-token` 保存在 Secret 中，並將其複製到可寫入的 `emptyDir`，再由 `GITHUB_COPILOT_TOKEN_DIR` 指向該位置，因為 Secret volume 是唯讀的。GitHub 權杖是長效的，且不包含任何每個程序的狀態，因此每個 pod 中的每個工作程序都共用同一個權杖，且各自衍生出自己的 `api-key.json`。

```bash showLineNumbers title="Create the Secret from your local login"
kubectl create secret generic litellm-copilot-auth --from-file=access-token=$HOME/.config/litellm/github_copilot/access-token
```

```yaml showLineNumbers title="Pod spec excerpt"
spec:
  initContainers:
    - name: copilot-token
      image: busybox:1.37
      command: ["cp", "/secrets/copilot/access-token", "/tokens/copilot/access-token"]
      volumeMounts:
        - name: copilot-secret
          mountPath: /secrets/copilot
          readOnly: true
        - name: copilot-tokens
          mountPath: /tokens/copilot
  containers:
    - name: litellm
      env:
        - name: GITHUB_COPILOT_TOKEN_DIR
          value: /tokens/copilot
      volumeMounts:
        - name: copilot-tokens
          mountPath: /tokens/copilot
  volumes:
    - name: copilot-secret
      secret:
        secretName: litellm-copilot-auth
    - name: copilot-tokens
      emptyDir: {}
```

### 設定並啟動代理程式 {#configure-and-start-the-proxy}

將以下內容新增到您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: github_copilot/gpt-5.2
    litellm_params:
      model: github_copilot/gpt-5.2
  - model_name: github_copilot/gpt-5.3-codex
    model_info:
      mode: responses
    litellm_params:
      model: github_copilot/gpt-5.3-codex
  - model_name: github_copilot/claude-sonnet-4.5
    litellm_params:
      model: github_copilot/claude-sonnet-4.5
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
    model="github_copilot/gpt-5.2",
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
    model="litellm_proxy/github_copilot/gpt-5.2",
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
    "model": "github_copilot/gpt-5.2",
    "messages": [{"role": "user", "content": "Explain this error message"}]
  }'
```

</TabItem>
</Tabs>

Responses 和 Anthropic Messages 請求會送往代理程式的 `/v1/responses` 與 `/v1/messages` 路由：

```bash showLineNumbers title="GitHub Copilot via Proxy - Responses and Messages"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "github_copilot/gpt-5.3-codex",
    "input": "Write a Python hello world"
  }'

curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "github_copilot/claude-sonnet-4.5",
    "max_tokens": 500,
    "messages": [{"role": "user", "content": "Write a Python hello world"}]
  }'
```

## 開始使用 {#getting-started}

1. 確保您已擁有 GitHub Copilot 存取權（需要付費 GitHub 訂閱）
2. 先登入一次：來自同步腳本的第一次請求會引導您完成裝置流程，而代理程式則需要先執行 [啟動代理程式前先登入](#sign-in-before-starting-the-proxy) 中的一行指令
3. 開始透過 LiteLLM 向 GitHub Copilot 發出請求

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

# Optional: Custom OAuth client ID for the device flow
export GITHUB_COPILOT_CLIENT_ID="Iv1.b507a08c87ecfe98"
```

### 標頭 {#headers}

LiteLLM 會自動注入所需的 GitHub Copilot 標頭（模擬 VS Code Copilot Chat）。您不需要手動指定它們。

如果您想覆寫預設值（例如，模擬不同的編輯器），可以使用 `extra_headers`。以下是 LiteLLM 在聊天、回應和嵌入請求時傳送的預設值：

```python showLineNumbers title="Custom Headers (Optional)"
extra_headers = {
    "editor-version": "vscode/1.95.0",                 # Editor version
    "editor-plugin-version": "copilot-chat/0.26.7",    # Plugin version
    "copilot-integration-id": "vscode-chat",           # Integration ID
    "user-agent": "GitHubCopilotChat/0.26.7"           # User agent
}
```
