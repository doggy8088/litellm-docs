# Claude Code 搭配自帶金鑰（BYOK） {#claude-code-with-bring-your-own-key-byok}

透過 LiteLLM proxy 使用您自己的 Anthropic API 金鑰搭配 Claude Code。當您使用 Claude 的 `/login` 搭配您的 Anthropic 帳戶時，您的 API 金鑰會以 `x-api-key` 傳送。啟用 BYOK 後，LiteLLM 會將您的金鑰轉送給 Anthropic，而不是使用 proxy 設定的金鑰 — 因此您直接向 Anthropic 付費，同時仍可享有 LiteLLM 的路由、記錄和防護欄。

## 運作方式 {#how-it-works}

1. **Claude Code `/login`** — 您使用您的 Anthropic 帳戶登入；Claude Code 會將您的 Anthropic API 金鑰以 `x-api-key` 傳送。
2. **LiteLLM 驗證** — 您透過 `ANTHROPIC_CUSTOM_HEADERS` 傳入您的 LiteLLM proxy 金鑰，以便 proxy 可以驗證並追蹤您的用量。
3. **金鑰轉送** — 在 `forward_llm_provider_auth_headers: true` 下，LiteLLM 會將您的 `x-api-key` 轉送給 Anthropic，並讓它優先於任何 proxy 設定的金鑰。

## 先決條件 {#prerequisites}

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
- Anthropic API 金鑰（來自 [console.anthropic.com](https://console.anthropic.com)）
- 具有用於驗證的虛擬金鑰之 LiteLLM proxy

## 步驟 1：設定 LiteLLM Proxy {#step-1-configure-litellm-proxy}

啟用 LLM 提供者驗證標頭的轉送，讓您的 Anthropic 金鑰優先：

```yaml title="config.yaml"
model_list:
  - model_name: claude-sonnet-4-5
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      # No api_key needed — client's key will be used

litellm_settings:
  forward_llm_provider_auth_headers: true  # Required for BYOK
```

:::info 為什麼 `forward_llm_provider_auth_headers`？

預設情況下，LiteLLM 會基於安全性從用戶端請求中移除 `x-api-key`。將此設定為 `true` 可讓用戶端提供的提供者金鑰（例如您來自 `/login` 的 Anthropic 金鑰）轉送給 Anthropic，並覆寫任何 proxy 設定的金鑰。

:::

:::tip 改用 UI 設定，而非 config.yaml

您也可以從 LiteLLM 管理 UI 完成這項設定：

- 透過 **Models → Add Model** 新增模型，將 **API Key** 欄位留空。
- 在 **Settings → UI Settings → "Forward LLM provider auth headers"** 啟用切換開關。

這兩個 UI 動作都會寫入資料庫，並在執行時覆寫 `config.yaml`。

:::

## 步驟 2：建立 LiteLLM 虛擬金鑰 {#step-2-create-a-litellm-virtual-key}

在 LiteLLM UI 或透過 API 建立虛擬金鑰。 
```bash
# Example: Create key via API
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer sk-your-master-key" \
  -H "Content-Type: application/json" \
  -d '{"key_alias": "claude-code-byok", "models": ["claude-sonnet-4-5"]}'
```

## 步驟 3：設定 Claude Code {#step-3-configure-claude-code}

設定環境變數，讓 Claude Code 使用 LiteLLM，並傳送您的 LiteLLM 金鑰以供 proxy 驗證：

```bash
# Point Claude Code to your LiteLLM proxy
export ANTHROPIC_BASE_URL="http://localhost:4000"

# Model name from your config
export ANTHROPIC_MODEL="claude-sonnet-4-5"

# LiteLLM proxy auth — this is added to every request
# Use x-litellm-api-key so the proxy authenticates you; your Anthropic key goes via x-api-key from /login
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: sk-12345"
```

將 `sk-12345` 替換為您實際的 LiteLLM 虛擬金鑰。

:::tip 多個標頭

若有多個標頭，請使用以換行分隔的值：

```bash
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: sk-12345
x-litellm-user-id: my-user-id"
```

:::

## 步驟 4：使用 Claude Code 登入 {#step-4-sign-in-with-claude-code}

1. 啟動 Claude Code：

   ```bash
   claude
   ```

2. 使用 **`/login`**，並以您的 Anthropic 帳戶登入（或直接使用您的 API 金鑰）。

3. Claude Code 會傳送：
   - `x-api-key`：您的 Anthropic API 金鑰（來自 `/login`）
   - `x-litellm-api-key`：您的 LiteLLM 金鑰（來自 `ANTHROPIC_CUSTOM_HEADERS`）

4. LiteLLM 會透過 `x-litellm-api-key` 驗證您，然後將 `x-api-key` 轉送給 Anthropic。您的 Anthropic 金鑰會優先於任何 proxy 設定的金鑰。

## 摘要 {#summary}

| 標頭 | 來源 | 用途 |
|--------|--------|---------|
| `x-api-key` | Claude Code `/login`（Anthropic 金鑰） | 傳送給 Anthropic 以供 API 呼叫 |
| `x-litellm-api-key` | `ANTHROPIC_CUSTOM_HEADERS` | proxy 驗證、追蹤、速率限制 |

## 疑難排解 {#troubleshooting}

### 請求失敗並出現 "invalid x-api-key" {#requests-fail-with-invalid-x-api-key}

- 確認 `forward_llm_provider_auth_headers: true` 已在 `litellm_settings`（或 `general_settings`）中設定。
- 在變更設定後重新啟動 LiteLLM proxy。
- 驗證您已在 Claude Code 中完成 `/login`，以便您的 Anthropic 金鑰正在被傳送。

### Proxy 回傳 401 {#proxy-returns-401}

- 檢查 `ANTHROPIC_CUSTOM_HEADERS` 是否包含 `x-litellm-api-key: <your-key>`。
- 確認 LiteLLM 金鑰有效且有權存取該模型。

### 使用的是 proxy 金鑰，而不是我的 Anthropic 金鑰 {#proxy-key-is-used-instead-of-my-anthropic-key}

- 確認您的設定中有 `forward_llm_provider_auth_headers: true`。
- 視您的設定結構而定，該設定可能位於 `litellm_settings` 或 `general_settings`。
- 啟用除錯記錄：`LITELLM_LOG=DEBUG`，以查看正在轉送哪一把金鑰。

## 相關內容 {#related}

- [轉送用戶端標頭](./../proxy/forward_client_headers.md) — BYOK 與標頭轉送的完整文件
- [Claude Code Max 訂閱](./claude_code_max_subscription.md) — 透過 LiteLLM 搭配 OAuth/Max 訂閱使用 Claude Code
