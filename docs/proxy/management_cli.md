# LiteLLM Proxy CLI {#litellm-proxy-cli}

`lite` CLI 是一個命令列工具，用於管理您的 LiteLLM proxy
伺服器，並透過它執行程式碼代理程式。它可管理模型、憑證、
API 金鑰、團隊與使用者，執行對 proxy 的 chat 和 HTTP 請求，
將靜態儲存的憑證加密進行遷移，並啟動程式碼代理程式（Claude Code、
Codex、OpenCode），讓其 LLM 流量經由 proxy 路由。

| 功能                   | 您可以做什麼                                          |
|------------------------|-----------------------------------------------------------|
| 程式碼代理程式         | 透過 proxy 執行 Claude Code、Codex 或 OpenCode        |
| 模型管理               | 列出、新增、更新與刪除模型                              |
| 憑證管理               | 管理提供者憑證                                          |
| 金鑰管理               | 產生、列出、刪除與匯入 API 金鑰                           |
| 團隊管理               | 列出團隊、列出可加入的團隊、將您的金鑰指派給團隊        |
| 使用者管理             | 建立、列出與刪除使用者                                  |
| 聊天補全       | 執行 chat completions                                   |
| HTTP Requests          | 對 proxy 伺服器發出自訂 HTTP 請求                        |
| Encryption Migration   | 將靜態儲存的憑證重新加密為 AES-256-GCM                  |

## 快速開始 {#quick-start}

1. **安裝 CLI**

   `lite` 用戶端是一個輕量的筆電安裝：它會連到 LiteLLM proxy，並透過它執行您的程式碼代理程式，不會帶入 proxy 伺服器執行時環境。單行安裝程式只需要 `curl`；若找不到 [uv](https://github.com/astral-sh/uv) 會先建立，並讓 uv 為您提供相容的 Python：

   ```shell
   curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm/main/scripts/install-cli.sh | sh
   ```

   在 macOS 上，您也可以改用 Homebrew 安裝：

   ```shell
   brew install BerriAI/litellm/lite
   ```

   已經有 uv，而且想自行操作嗎？直接安裝套件：

   ```shell
   uv tool install 'litellm[cli]'
   ```

   以上任一方式都會提供 `lite` 指令；如果您已經從 `litellm[proxy]` 執行 proxy 伺服器，這個指令也會一併提供。請先在終端機輸入它：

   ```shell
   lite
   ```

2. **設定環境變數**

   ```bash
   export LITELLM_PROXY_URL=http://localhost:4000
   export LITELLM_PROXY_API_KEY=sk-your-key
   ```

   *(請替換為您的實際 proxy URL 和 API 金鑰)*

3. **發出第一個請求（列出模型）**

   ```bash
   lite models list
   ```

   如果 CLI 設定正確，您應該會看到可用模型清單或表格輸出。

4. **疑難排解**

   - 如果看到錯誤，請檢查您的環境變數與 proxy 伺服器狀態。

## 使用 CLI 進行驗證 {#authentication-using-cli}

您可以使用 CLI 來驗證到 LiteLLM Gateway。若您想為大量開發人員提供自助式存取 LiteLLM Gateway，這很有幫助。

:::info

如需深入指南，請參閱 [CLI 驗證](./cli_sso)。

:::

### 先決條件 {#prerequisites}

:::warning[Beta 功能 - 必要環境變數]

CLI SSO 驗證目前仍在 beta 階段。您必須在**啟動 LiteLLM Proxy 時**設定此環境變數：

```bash
export EXPERIMENTAL_UI_LOGIN="True"
litellm --config config.yaml
```

或者將它加入您的 proxy 啟動指令：

```bash
EXPERIMENTAL_UI_LOGIN="True" litellm --config config.yaml
```

:::

### 步驟 {#steps}

1. **設定 proxy URL**

   ```bash
   export LITELLM_PROXY_URL=http://localhost:4000
   ```

   *(請替換為您的實際 proxy URL)*

2. **登入**

   ```bash
   lite login
   ```

   這會開啟瀏覽器視窗進行驗證。如果您已將 LiteLLM Proxy 連接到您的 SSO 提供者，您可以使用 SSO 憑證登入。登入後，您可以使用 CLI 向 LiteLLM Gateway 發出請求。

3. **測試您的驗證**

   ```bash
   lite models list
   ```

   這會列出您可用的所有模型。

## 透過 proxy 執行程式碼代理程式 {#run-coding-agents-through-the-proxy}

啟動程式碼代理程式，讓其所有 LLM 流量都經由您的 LiteLLM proxy 路由。每個支援的代理程式都有自己的指令，因此除了代理程式名稱之外不需要記住其他內容：

```bash
lite claude
lite codex
lite opencode
```

代理程式名稱之後的任何內容都會原封不動地傳遞給代理程式，因此它自己的旗標仍可正常運作：

```bash
lite claude --resume
lite codex exec "summarize the repo"
```

每個指令都會解析您的 LiteLLM 金鑰（若未儲存且您在終端機中，則透過 SSO 登入；否則會讀取 `LITELLM_PROXY_API_KEY` 或 `--api-key`），先向 proxy 檢查金鑰，讓錯誤憑證立即失敗，而不是等到代理程式內部才出錯，接著匯出代理程式會讀取的環境變數，最後以代理程式程序取代自身。

這些變數會依代理程式而定。Claude Code 會取得 `ANTHROPIC_BASE_URL`（proxy 根位址，因此會附加 `/v1/messages`）與 `ANTHROPIC_AUTH_TOKEN`，並清除任何殘留的 `ANTHROPIC_API_KEY`，讓 proxy 權杖優先。Codex 和 OpenCode 會取得 `OPENAI_BASE_URL`（proxy 加上 `/v1`）與 `OPENAI_API_KEY`。Codex 不會理會 `OPENAI_BASE_URL`，因此還會透過傳入 `-c` 設定覆寫的自訂提供者，另外指向 proxy（HTTP/SSE Responses 傳輸，因為 proxy 不支援 Responses WebSocket 協定）。

`--skip-verify` 會略過啟動前的金鑰檢查，這在離線或使用非標準驗證時很有幫助。它屬於 wrapper，因此請把它放在代理程式自己的旗標之前：

```bash
lite claude --skip-verify --resume
```

若要固定模型，請傳入代理程式自己的模型旗標（`lite claude --model my-proxy-model` 或 `lite codex -m my-proxy-model`），或匯出代理程式會讀取的變數（Claude Code 為 `ANTHROPIC_MODEL` / `ANTHROPIC_SMALL_FAST_MODEL`）；wrapper 會保留您已設定的任何內容。代理程式所要求的模型必須存在於 proxy 上，因為請求會送到 proxy 的 `/v1/messages`（Anthropic）或 `/v1/chat/completions` 與 `/v1/responses`（OpenAI）端點。

### `lite login` 憑證 {#the-lite-login-credential}

由 `lite login` 發行的權杖是一個短效、每個工作階段各自獨立的代理程式憑證，而不是受管理的虛擬金鑰。它的範圍限定於您驗證時使用的使用者與團隊，會繼承該使用者與團隊的模型和預算，並且在 proxy 上的強制方式與同一團隊上的虛擬金鑰完全相同（防護欄、路由、記錄、支出）。支出會計入共用的團隊與使用者預算，因此執行多個代理程式（或多次登入）不會讓每個工作階段都有自己的預算；它們都會從同一份團隊與使用者額度中扣除，而且沒有獨立的每工作階段上限。

此憑證刻意設計為短效（預設 24 小時，可透過 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 設定）；再次執行 `lite login` 即可重新整理，且也會重新讀取您最新的團隊與使用者設定。它不會出現在 Keys UI 中，也無法在工作階段中途輪替或撤銷，而 `lite claude`、`lite codex` 與 `lite opencode` 可在預設部署上與它搭配使用。若您需要一個會顯示在 Keys UI 中、可輪替且長效的金鑰，請在儀表板中建立專用的虛擬金鑰，並改用 `--api-key` 或 `LITELLM_PROXY_API_KEY` 傳入。

當您在登入時向某個團隊進行驗證，或之後想把已儲存的金鑰移到其他團隊時，請使用 `lite teams assign-key`（請參閱 [團隊管理](#teams-management)）。使用下列方式檢視或清除已儲存的憑證：

```bash
lite whoami   # show the authenticated user and the token age
lite logout   # clear the stored token
```

## 主要指令 {#main-commands}

### 模型管理 {#models-management}

- 列出、新增、更新、取得與刪除 proxy 上的模型。
- 範例：

  ```bash
  lite models list
  lite models add gpt-4 \
    --param api_key=sk-123 \
    --param max_tokens=2048
  lite models update <model-id> -p temperature=0.7
  lite models delete <model-id>
  ```

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/model%20management)

### 憑證管理 {#credentials-management}

- 列出、建立、取得與刪除 LLM 提供者的憑證。
- 範例：

  ```bash
  lite credentials list
  lite credentials create azure-prod \
    --info='{"custom_llm_provider": "azure"}' \
    --values='{"api_key": "sk-123", "api_base": "https://prod.azure.openai.com"}'
  lite credentials get azure-cred
  lite credentials delete azure-cred
  ```

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/credential%20management)

### 金鑰管理 {#keys-management}

- 列出、產生、取得資訊、刪除與匯入 API 金鑰。
- 範例：

  ```bash
  lite keys list
  lite keys generate \
    --models=gpt-4 \
    --spend=100 \
    --duration=24h \
    --key-alias=my-key
  lite keys info --key sk-key1
  lite keys delete --keys sk-key1,sk-key2 --key-aliases alias1,alias2
  ```

  `lite keys import` 會將其他 LiteLLM 執行個體中的金鑰複製到此執行個體。加入 `--dry-run` 可在不寫入的情況下預覽，加入 `--created-since`（`YYYY-MM-DD` 或 `YYYY-MM-DD_HH:MM`）可依建立日期限制匯入範圍：

  ```bash
  lite keys import \
    --source-base-url https://old-proxy.example.com \
    --source-api-key sk-source-admin \
    --created-since 2026-01-01
  ```

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/key%20management)

### 使用者管理 {#user-management}

- 列出、建立、取得資訊與刪除使用者。
- 範例：

  ```bash
  lite users list
  lite users create \
    --email=user@example.com \
    --role=internal_user \
    --alias="Alice" \
    --team=team1 \
    --max-budget=100.0
  lite users get --id <user-id>
  lite users delete <user-id>
  ```

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/Internal%20User%20management)

### 團隊管理 {#teams-management}

- 列出您所屬的團隊、列出可加入的團隊，並將您目前的 CLI 金鑰指派給團隊。
- 範例：

  ```bash
  lite teams list
  lite teams available
  lite teams assign-key --team-id team123
  ```

  不使用 `--team-id` 執行 `lite teams assign-key` 時，系統會提示您以互動方式選取團隊。

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/team%20management)

### 聊天完成 {#chat-completions}

- 從 proxy 伺服器請求聊天完成。
- 範例：

  ```bash
  lite chat completions gpt-4 -m "user:Hello, how are you?"
  ```

  [使用的 API（OpenAPI）](https://litellm-api.up.railway.app/#/chat%2Fcompletions)

### 一般 HTTP 請求 {#general-http-requests}

- 直接向 proxy 伺服器發出 HTTP 請求。
- 範例：

  ```bash
  lite http request \
    POST /chat/completions \
    --json '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
  ```

  [所有 API（OpenAPI）](https://litellm-api.up.railway.app/#/)

### 加密遷移 {#encryption-migration}

- 將靜態儲存的憑證重新加密為 AES-256-GCM (`v2:gcm:`) 格式。這是一項管理作業；請先以 `general_settings.encryption_algorithm: aes-256-gcm` 啟動 proxy。此遷移具有冪等性且可續跑，因此即使中途中斷，重新執行也很安全。
- 範例：

  ```bash
  lite encryption migrate --check    # read-only residual scan, no writes
  lite encryption migrate --dry-run  # run the walkers without writing changes
  lite encryption migrate            # perform the migration
  ```

  `--check` 會回報仍有多少舊版值；殘留值為 `0` 代表所有內容都已轉換為新格式。

## 環境變數 {#environment-variables}

- `LITELLM_PROXY_URL`: proxy 伺服器的基礎 URL
- `LITELLM_PROXY_API_KEY`: 用於驗證的 API 金鑰

## 範例 {#examples}

1. **列出所有模型：**

   ```bash
   lite models list
   ```

2. **新增模型：**

   ```bash
   lite models add gpt-4 \
     --param api_key=sk-123 \
     --param max_tokens=2048
   ```

3. **建立憑證：**

   ```bash
   lite credentials create azure-prod \
     --info='{"custom_llm_provider": "azure"}' \
     --values='{"api_key": "sk-123", "api_base": "https://prod.azure.openai.com"}'
   ```

4. **產生 API 金鑰：**

   ```bash
   lite keys generate \
     --models=gpt-4 \
     --spend=100 \
     --duration=24h \
     --key-alias=my-key
   ```

5. **聊天完成：**

   ```bash
   lite chat completions gpt-4 \
     -m "user:Write a story"
   ```

6. **自訂 HTTP 請求：**

   ```bash
   lite http request \
     POST /chat/completions \
     --json '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

## 錯誤處理 {#error-handling}

CLI 會顯示以下情況的錯誤訊息：

- 伺服器無法存取
- 驗證失敗
- 參數或 JSON 無效
- 模型／憑證不存在
- 任何其他作業失敗

請使用 `--debug` 旗標取得詳細除錯輸出。

如需完整的命令參考與進階用法，請參閱 [CLI README](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/client/cli/README.md)。
