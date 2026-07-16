# CLI 驗證 {#cli-authentication}

使用 litellm cli 驗證至 LiteLLM Gateway。如果您想讓大量開發者可自行存取 LiteLLM Gateway，這非常適合。

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.loom.com/embed/87c5d243cde642ff942783024ff037e3" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 使用方式  {#usage}

### 必要條件 - 以 Beta 標記啟動 LiteLLM Proxy {#prerequisites---start-litellm-proxy-with-beta-flag}

:::warning[Beta 功能 - 必要]

CLI SSO 驗證目前處於 beta 階段。啟動您的 LiteLLM Proxy 時，您必須設定這個環境變數：

```bash
export EXPERIMENTAL_UI_LOGIN="True"
litellm --config config.yaml
```

或者將其加入您的 proxy 啟動命令：

```bash
EXPERIMENTAL_UI_LOGIN="True" litellm --config config.yaml
```

:::

### 設定 {#configuration}

#### JWT 權杖到期時間 {#jwt-token-expiration}

預設情況下，CLI 驗證權杖會在 **24 小時**後過期。您可以在啟動 LiteLLM Proxy 時，透過設定 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 環境變數來自訂這個到期時間：

```bash
# Set CLI JWT tokens to expire after 48 hours
export LITELLM_CLI_JWT_EXPIRATION_HOURS=48
export EXPERIMENTAL_UI_LOGIN="True"
litellm --config config.yaml
```

或者使用單一命令：

```bash
LITELLM_CLI_JWT_EXPIRATION_HOURS=48 EXPERIMENTAL_UI_LOGIN="True" litellm --config config.yaml
```

**範例：**
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=12` - 權杖在 12 小時後過期
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=168` - 權杖在 7 天（168 小時）後過期
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=720` - 權杖在 30 天（720 小時）後過期

:::note[實驗性 UI 工作階段]
當啟用 `EXPERIMENTAL_UI_LOGIN` 時，**瀏覽器 UI 登入**工作階段會使用固定的 10 分鐘到期時間（不可設定）。`LITELLM_UI_SESSION_DURATION` 僅適用於非實驗性流程。
:::

:::tip
您可以使用以下方式檢查目前權杖的年齡與到期狀態：
```bash
lite whoami
```
:::

#### 歸因中繼資料（OIDC claim） {#attribution-metadata-oidc-claims}

將允許清單中的 OIDC claim 對應到 LiteLLM 使用者的 `metadata`，並在 `/sso/cli/poll` 中以 `attribution_metadata` 傳回給 CLI。這適用於穩定的歸因欄位（例如僱用類型或成本中心），而無需在用戶端解析大型群組清單。

在啟動前於 **proxy** 上設定：

```bash
export CLI_SSO_CLAIM_MAP="employment_type->acme_employment_type,org_info.department->department"
export GENERIC_USER_EXTRA_ATTRIBUTES="employment_type,org_info.department"
```

`CLI_SSO_CLAIM_MAP` 與 `LITELLM_CLI_SSO_CLAIM_MAP` 等效。格式：以逗號分隔的 `source_claim->metadata_key` 鍵值對。目的地上的可選 `metadata.` 前綴會被移除；值會儲存在使用者的 `metadata` JSON 欄位中。

| 部分 | 意義 |
|------|---------|
| `source_claim` | OIDC claim 路徑（點號表示法），包含來自 `GENERIC_USER_EXTRA_ATTRIBUTES` 的欄位 |
| `metadata_key` | LiteLLM 使用者 `metadata` 下的鍵（支援透過點號的巢狀鍵） |

僅會保留並傳回非機密純量值（`string`、`int`、`float`、`bool`）。清單、物件，以及包含如 `token` 或 `secret` 之類片段的目的地鍵會被丟棄。

範例輪詢回應（SSO 完成後）：

```json
{
  "status": "ready",
  "key": "eyJ...",
  "user_id": "user@company.com",
  "attribution_metadata": {
    "acme_employment_type": "full_time",
    "department": "Engineering"
  }
}
```

**沒有真實 IdP 的本機測試：** 從 LiteLLM repo 執行 `python scripts/mock_oidc_server_for_cli_sso.py`，將 Generic SSO 環境變數指向 `http://127.0.0.1:8765`，然後執行 `python scripts/test_cli_sso_claims_e2e.py`。

### 步驟 {#steps}

1. **安裝 CLI**

   `lite` 用戶端是一個輕量的筆電安裝：它會連到 LiteLLM proxy，並透過它執行您的 coding agents，且不會載入 proxy server runtime。這個單行安裝程式只需要 `curl`；當 [uv](https://github.com/astral-sh/uv) 不存在時，它會引導安裝，並讓 uv 為您佈建相容的 Python：

   ```shell
   curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm/main/scripts/install-cli.sh | sh
   ```

   在 macOS 上，您也可以改用 Homebrew 安裝：

   ```shell
   brew install BerriAI/litellm/lite
   ```

   已經有 uv，並且想自行操作嗎？直接安裝套件：

   ```shell
   uv tool install 'litellm[cli]'
   ```

   以上任一方式都會提供 `lite` 指令；如果您已經從 `litellm[proxy]` 執行 proxy server，它也會一併安裝在那裡。請先在您的終端機輸入它：

   ```shell
   lite
   ```

2. **設定環境變數**

   在您的本機上，設定 proxy URL：

   ```bash
   export LITELLM_PROXY_URL=http://localhost:4000
   ```

   （請替換為您的實際 proxy URL）

3. **登入**

   ```shell
   lite login
   ```

   這會開啟瀏覽器視窗進行驗證。如果您已將 LiteLLM Proxy 連接到您的 SSO 提供者，您應該可以使用您的 SSO 憑證登入。登入後，您可以使用 CLI 向 LiteLLM Gateway 發出請求。

4. **發出測試請求以檢視模型**

   ```shell
   lite models list
   ```

   這會列出所有可供您使用的模型。
