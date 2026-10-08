# Claude Code 搭配自帶金鑰（BYOK） {#claude-code-with-bring-your-own-key-byok}

透過 LiteLLM proxy 使用您自己的 Anthropic 憑證搭配 Claude Code。Claude Code 會以兩種方式之一向 Anthropic 驗證：`/login` 會將 OAuth 權杖以 `Authorization: Bearer <token>` 傳送（與您的 Claude.ai Free、Pro、Max 或 Enterprise 席位綁定），而已設定的 Anthropic API key 則會以 `x-api-key` 傳送。LiteLLM 會將任一憑證轉送給 Anthropic，而不是使用 proxy 設定的金鑰，因此您仍可直接向 Anthropic 付費，同時享有 LiteLLM 的路由、記錄與防護欄。

## 運作方式 {#how-it-works}

1. **Claude Code 驗證**：使用 `/login` 時，Claude Code 會將您的 Anthropic OAuth 權杖以 `Authorization: Bearer <token>` 傳送；使用已設定的 API key 時，則改為傳送 `x-api-key`。
2. **LiteLLM 驗證**：您透過 `ANTHROPIC_CUSTOM_HEADERS` 提供 LiteLLM proxy 金鑰（例如 `x-litellm-api-key`），讓 proxy 能在不接觸上述 Anthropic 憑證標頭的情況下進行驗證並追蹤您的用量。
3. **金鑰轉送**：LiteLLM 會自動將 OAuth `Authorization` 標頭轉送至 Anthropic。`x-api-key` 路徑另外還需要 `forward_llm_provider_auth_headers: true`，因為 LiteLLM 預設會移除 `x-api-key`。

## 先決條件 {#prerequisites}

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
- Anthropic API 金鑰（來自 [console.anthropic.com](https://console.anthropic.com)）
- 具有用於驗證的虛擬金鑰之 LiteLLM proxy

## 步驟 1：設定 LiteLLM Proxy {#step-1-configure-litellm-proxy}

如果您是使用 Anthropic API key 進行驗證，而不是 `/login`，請啟用 LLM 提供者驗證標頭轉送，讓您的金鑰優先：

```yaml title="config.yaml"
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      # No api_key needed — client's key will be used

litellm_settings:
  forward_llm_provider_auth_headers: true  # Required for the x-api-key path; not needed for /login
```

:::info[為什麼 `forward_llm_provider_auth_headers`？]

預設情況下，LiteLLM 會基於安全性從用戶端請求中移除 `x-api-key`。將此設定為 `true` 可讓用戶端提供的 Anthropic API key 轉送至 Anthropic，覆寫任何 proxy 設定的金鑰。此設定僅管控 `x-api-key` 及類似的提供者金鑰標頭；它對 `/login` 沒有影響，因為 `Authorization: Bearer` 透過 OAuth 權杖進行驗證，而 LiteLLM 會不論此設定如何都將其轉送，前提是您使用不同的標頭（例如 `x-litellm-api-key`）向 proxy 驗證，而不是 `Authorization`。

:::

:::tip[改用 UI 設定，而非 config.yaml]

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
  -d '{"key_alias": "claude-code-byok", "models": ["{{anthropic}}"]}'
```

## 步驟 3：設定 Claude Code {#step-3-configure-claude-code}

設定環境變數，讓 Claude Code 使用 LiteLLM，並傳送您的 LiteLLM 金鑰以供 proxy 驗證：

```bash
# Point Claude Code to your LiteLLM proxy
export ANTHROPIC_BASE_URL="http://localhost:4000"

# Model name from your config
export ANTHROPIC_MODEL="{{anthropic}}"

# LiteLLM proxy auth: this is added to every request
# Use x-litellm-api-key so the proxy authenticates you; your Anthropic credential goes
# via Authorization (from /login) or x-api-key (if you configured a key directly)
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: $LITELLM_API_KEY"
```

將 `sk-<your-litellm-api-key>` 替換為您實際的 LiteLLM 虛擬金鑰。

:::tip[多個標頭]

若有多個標頭，請使用以換行分隔的值：

```bash
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: $LITELLM_API_KEY
x-litellm-user-id: my-user-id"
```

:::

## 步驟 4：使用 Claude Code 登入 {#step-4-sign-in-with-claude-code}

1. 啟動 Claude Code：

```bash
   claude
   ```

2. 使用 **`/login`**，並以您的 Anthropic 帳戶登入（或直接使用您的 API 金鑰）。

3. Claude Code 會傳送 `x-litellm-api-key`（您的 LiteLLM 金鑰，來自 `ANTHROPIC_CUSTOM_HEADERS`）以及下列其中一項，取決於您在步驟 2 中如何驗證：
   - `Authorization: Bearer <oauth-token>`，如果您使用了 `/login`
   - `x-api-key`，如果您直接設定了 Anthropic API key

4. LiteLLM 會透過 `x-litellm-api-key` 對您進行驗證。它會自動將 OAuth `Authorization` 標頭轉送給 Anthropic；若要轉送 `x-api-key`，另外還需要 `forward_llm_provider_auth_headers: true`。無論哪種方式，您的 Anthropic 憑證都會優先於任何 proxy 設定的金鑰。

## 摘要 {#summary}

| 標頭 | 來源 | 用途 | 需要 `forward_llm_provider_auth_headers` 嗎？ |
|--------|--------|---------|---------|
| `Authorization: Bearer <token>` | Claude Code `/login`（OAuth） | 傳送給 Anthropic 供 API 請求使用 | 不需要，預設會轉送 |
| `x-api-key` | 已設定的 Anthropic API key | 傳送給 Anthropic 供 API 請求使用 | 需要 |
| `x-litellm-api-key` | `ANTHROPIC_CUSTOM_HEADERS` | proxy 驗證、追蹤、速率限制 | N/A |

## 疑難排解 {#troubleshooting}

### 請求失敗並出現 "invalid x-api-key" {#requests-fail-with-invalid-x-api-key}

這適用於已設定 API key 的路徑，而不是 `/login`。

- 請確保 `forward_llm_provider_auth_headers: true` 已在 `litellm_settings`（或 `general_settings`）中設定。
- 變更設定後，請重新啟動 LiteLLM proxy。
- 請驗證您的 Anthropic API key 已在用戶端正確設定。

### Proxy 回傳 401 {#proxy-returns-401}

- 檢查 `ANTHROPIC_CUSTOM_HEADERS` 是否包含 `x-litellm-api-key: <your-key>`。
- 確認 LiteLLM 金鑰有效且有權存取該模型。

### 使用的是 proxy 金鑰，而不是我的 Anthropic 金鑰 {#proxy-key-is-used-instead-of-my-anthropic-key}

這適用於 `x-api-key` 路徑；來自 `/login` 的 OAuth `Authorization` 標頭會不論此設定如何都被轉送。

- 確認您的設定中有 `forward_llm_provider_auth_headers: true`。
- 視您的設定結構而定，該設定可能位於 `litellm_settings` 或 `general_settings`。
- 啟用除錯記錄：`LITELLM_LOG=DEBUG`，以查看正在轉送哪一把金鑰。

## 相關內容 {#related}

- [轉送用戶端標頭](./../proxy/forward_client_headers.md) — BYOK 與標頭轉送的完整文件
- [Claude Code Max 訂閱](./claude_code_max_subscription.md) — 透過 LiteLLM 搭配 OAuth/Max 訂閱使用 Claude Code
