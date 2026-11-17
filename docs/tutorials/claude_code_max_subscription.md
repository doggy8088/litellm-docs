---
title: 使用您的 Claude 訂閱搭配 Claude Code
sidebar_label: Claude 訂閱
description: 使用您的 Claude 訂閱將 Claude Code 連接到 LiteLLM。設定 proxy、建立虛擬金鑰、登入並驗證使用情況。
---

# 使用您的 Claude 訂閱搭配 Claude Code {#use-your-claude-subscription-with-claude-code}

使用您自己的 Claude Pro、Max、Team 或 Enterprise 訂閱，透過 LiteLLM 傳送 Claude Code 請求。LiteLLM 會套用存取控制、預算與防護欄，並記錄使用情況。Claude Code 會保留您的登入狀態並自動刷新。

## 前置條件 {#prerequisites}

- 已安裝 [Claude Code](https://code.claude.com/docs/en/overview) 並擁有 Claude 訂閱。Team 與 Enterprise 成員使用管理員邀請的帳戶。
- 一個正在執行的 [LiteLLM proxy](../proxy/docker_quick_start.md) <SinceVersion v="1.81.14" />，並搭配 PostgreSQL 存放虛擬金鑰與記錄。

## 步驟 1：設定 proxy {#step-1-configure-litellm-proxy}

將此項目加入 proxy 的 `model_list` 並重新啟動 proxy。若您的管理員已完成設定，可略過此步驟。請保留您現有的 master key、資料庫與其他設定。

```yaml title="config.yaml"
model_list:
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
```

萬用字元會路由您的方案允許的任何 Claude 模型。請依所示方式保持此部署的設定，以使用每位開發者的訂閱登入。LiteLLM 會自動轉送該登入。

## 步驟 2：建立虛擬金鑰 {#step-2-create-a-virtual-key}

在 `http://localhost:4000/ui` 開啟您的 proxy 儀表板（請將 URL 換成您 proxy 的 URL）。若是本機 proxy，請以 `admin` 身分使用您的 master key 登入。前往 **Virtual Keys**，按一下 **+ Create New Key**，輸入 **Key Name**，並在 **Models** 下選取 **All anthropic models**。按一下 **Create Key** 並複製金鑰；金鑰只會顯示一次。

若是既有的金鑰，請允許 `anthropic/*`。將 **Models** 留空可允許 proxy 上的所有模型。

## 步驟 3：連接 Claude Code {#step-3-connect-claude-code}

若您先前使用 API 金鑰驗證，請從您目前使用的 [Claude Code 設定](https://code.claude.com/docs/en/settings) 中移除 `apiKeyHelper` 以及 `env` 中的 `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY` 項目：`~/.claude/settings.json` 以及您專案的 `.claude/settings.json` 或 `.claude/settings.local.json`。

在您的專案資料夾中，清除 shell 覆寫設定，設定 proxy 的根 URL 與虛擬金鑰，然後啟動 Claude Code：

```bash
unset ANTHROPIC_AUTH_TOKEN ANTHROPIC_API_KEY ANTHROPIC_MODEL
export ANTHROPIC_BASE_URL="http://localhost:4000"
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: Bearer sk-<your-litellm-virtual-key>"

claude
```

將 URL 換成您 proxy 的根位址，例如 `https://litellm.example.com`，並換掉金鑰。既有的自訂標頭請保留在各自獨立的行。

選擇 **Claude account with subscription**，並在需要時完成瀏覽器登入。若瀏覽器沒有開啟，請按 `c` 複製 URL；若出現提示，請將驗證碼貼回終端機。完成您專案的工作區信任提示。既有的訂閱登入可以保持登入狀態。

使用 `/model` 選取您的訂閱支援的 Claude 模型。若要明確設定預設值，請將 `ANTHROPIC_MODEL` 設為 Claude 模型 ID，例如 `{{anthropic_large}}`。若要在日後的終端機中沿用，請將 `unset` 與 `export` 行加入 shell 設定檔（`~/.zshrc` 或 `~/.bashrc`）的末尾。

## 步驟 4：驗證請求 {#step-4-verify-a-request}

傳送：**Reply with exactly Hello.**

您應該會收到一句問候。在儀表板中開啟 **Logs**，在您的虛擬金鑰下找到成功的工作階段。開啟它以檢視模型、token 與成本。

### 確認訂閱使用情況 {#seeing-which-requests-were-billed-to-a-seat}

使用 **Credential: Client OAuth token** 篩選 **Logs** <SinceVersion v="1.105.0" />；Request Details 會顯示相同的值。支出記錄的中繼資料會為訂閱請求記錄 `used_client_oauth_token=true`，為使用已設定憑證的請求記錄 `false`。若要透過 API 存取，請以該篩選條件查詢 `/spend/logs/ui`，並以 `YYYY-MM-DD HH:MM:SS` 格式提供 UTC 的 `start_date` / `end_date` 值。

## 限制與計費 {#attribution-and-cost}

您的 Claude 方案決定模型存取權與配額。閘道的歸因請使用 LiteLLM 虛擬金鑰的使用者與團隊，訂閱成員資格則請使用 Claude 的管理主控台。

**LiteLLM 以 Anthropic API 的定價回報成本，訂閱請求也是如此。** 請將這些金額用於以 API 等值美元計算的[預算](../proxy/virtual_keys.md)。Anthropic 透過您的方案對訂閱請求收費；API 計費的支出請從使用已設定 API 憑證的資料列計算。

請讓每位開發者遵循 [Anthropic 的使用條款](https://code.claude.com/docs/en/legal-and-compliance)，以自己的訂閱登入。Team 與 Enterprise 的管理仍在 Claude 的管理主控台中進行；使用 [`forceLoginOrgUUID`](https://code.claude.com/docs/en/authentication#restrict-login-to-your-organization) 可將 Claude Code 限制為僅能登入您的組織。

<details>
<summary>憑證與支援的路由</summary>

### 運作方式 {#how-it-works}

`x-litellm-api-key` 用於向 LiteLLM 驗證身分。Claude Code 在 `Authorization` 中提供其訂閱 OAuth 權杖；LiteLLM 會將它轉送到直接的 `anthropic/` 部署，優先於任何已設定的 API 金鑰，並加入必要的 OAuth beta 標頭。其他用戶端標頭需要另外的[標頭轉送設定](../proxy/forward_client_headers.md)。

### 哪些請求使用訂閱權杖 {#which-requests-use-the-subscription-token}

訂閱轉送與憑證歸因請使用 `/v1/messages` 或 `/v1/chat/completions` 上的直接 Anthropic 部署。Bedrock 與 Vertex AI 使用各自的憑證（提供者隔離可運作 <SinceVersion v="1.99.0" />）。`/v1/messages/count_tokens` 使用已設定的憑證。`/anthropic` 直通路由在有設定時會使用 proxy 的 Anthropic 金鑰；本指南的訂閱設定請使用 proxy 根位址。

### 憑證的儲存、刷新與撤銷 {#credential-storage-refresh-and-revocation}

Claude Code 在本機儲存並刷新其登入。LiteLLM 會為每個請求轉送呼叫者的權杖，並在支出記錄中記錄憑證類型。使用 `/logout` 登出，或使用 `/login` 更新已過期或遭撤銷的登入。

若要終止閘道存取權，請封鎖或刪除 [LiteLLM 金鑰](../proxy/virtual_keys.md)。若也要終止訂閱存取權，請登出 Claude Code，或請 Claude 管理員撤銷它。

</details>

## 疑難排解 {#troubleshooting}

| 問題 | 修正方式 |
|---|---|
| LiteLLM 拒絕該金鑰 | 檢查 URL 以及 `ANTHROPIC_CUSTOM_HEADERS` 中的 `x-litellm-api-key`。已刪除或不正確的金鑰會回傳 401。 |
| Anthropic 拒絕登入，或請求使用了 API 金鑰 | 檢查 `/status`，移除 API 憑證覆寫與 `apiKeyHelper`，然後執行 `/login`。確認使用直接的 `anthropic/` 部署與 proxy 根 URL。 |
| 找不到模型或存取遭拒 | 設定 `anthropic/*`，在金鑰上允許 **All anthropic models**，並選擇您的方案支援的模型。 |
| LiteLLM 中沒有出現請求 | 檢查 `ANTHROPIC_BASE_URL`，然後從您匯出它的終端機重新啟動 Claude Code。 |
| 狀態正常的帳戶收到 `429 No deployments available for selected model` | 請營運人員檢查是否有既存的部署冷卻；並依照[復原步驟](./claude_code_byok.md#model-is-unavailable-for-everyone-after-one-user-hits-their-limit)處理。 |

使用您的 URL 與金鑰檢查閘道驗證與模型存取權：

```bash
curl "http://localhost:4000/v1/models" \
  -H "x-litellm-api-key: Bearer sk-<your-litellm-virtual-key>"
```

`200` 表示閘道驗證通過，並會列出可存取的模型。若是 `401`，請將金鑰換成有效的虛擬金鑰。使用步驟 4 的提示與 Credential 篩選來確認訂閱存取。

請參閱[設定影片](https://www.loom.com/share/2d069b9e3bcc4cecaa5eb27a72ba7b3c)、[訂閱選項](../subscriptions.md)或 [Claude Code 搭配 Lite CLI SSO](./claude_code_gateway.md#claude-subscription)。
