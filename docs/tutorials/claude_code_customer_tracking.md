# Claude Code - 細粒度成本追蹤 {#claude-code---granular-cost-tracking}

透過[客戶管理](../proxy/customers.md)，依客戶組織與成員追蹤 Claude Code 的支出。加上標籤，即可依專案或環境分組成本。

<SinceVersion v="1.111.0" />

## 設定客戶追蹤 {#set-up-customer-tracking}

先準備 v1.111 或更新版本的閘道、已套用遷移的 PostgreSQL，以及可呼叫您所設定 Claude 模型的應用程式金鑰。使用您現有的 `LITELLM_BASE_URL` 與 `LITELLM_API_KEY` 環境變數值。閘道 URL 請保持在根路徑，不要加上 `/v1`。

將 `ANTHROPIC_CUSTOM_HEADERS` 設為每行一個標頭：

```bash
export ANTHROPIC_BASE_URL="$LITELLM_BASE_URL"
export ANTHROPIC_API_KEY="$LITELLM_API_KEY"
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-org-alias: Acme
x-litellm-customer-member-id: acme-alice"
claude
```

請將 `Acme` 與 `acme-alice` 換成您客戶的組織別名與穩定的成員 ID。成員 ID 在整個閘道中必須是唯一的。LiteLLM 會在預設團隊下註冊新的身分，並受[容量限制](../proxy/customers.md#before-you-start)約束。如果您從第一個請求起就需要客戶上限，請[先建立預算](../proxy/customer_management/track-customer-spend.md#2-import-a-customer)。

在 Claude Code 中送出提示詞。接著開啟 **Customer Management → Customers → Acme**，選取包含該請求的日期範圍，查看該成員的支出、請求數與 token 數。請預留背景記帳的時間。如需在 Logs 中檢查已解析的客戶與成本，請參閱[請求詳細資訊](../proxy/customer_management/track-customer-spend.md#7-debug-a-request-in-spend-logs)。

## 新增專案或環境標籤 {#add-project-or-environment-tags}

將 `x-litellm-tags` 附加到同一個變數。請同時保留兩個客戶標頭，以便將請求歸因到客戶：

```bash
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-org-alias: Acme
x-litellm-customer-member-id: acme-alice
x-litellm-tags: project:support,env:prod"
```

您也可以只單獨傳送標籤標頭。如需瞭解標籤的支出上限，請參閱[標籤預算](../proxy/tag_budgets.md)。

## 舊版終端使用者追蹤 {#legacy-end-user-tracking}

這些範例仍受支援，適用於扁平式 `/customer/*` API 與 **End User** 記錄欄位。如需使用客戶管理，請採用上方的設定。下方螢幕截圖顯示舊版追蹤流程。

### 運作方式 {#how-it-works}

Claude Code 支援透過 `ANTHROPIC_CUSTOM_HEADERS` 使用自訂標頭。LiteLLM 會自動追蹤帶有特定標頭的請求，以進行成本歸因。

### 為什麼要設定客戶端標頭 {#why-set-a-customer-header}

如果沒有設定，Claude Code 仍會自行進行客戶追蹤。它會在 `metadata.user_id` 中傳送每個工作階段的 JSON blob，而 LiteLLM 會將其視為客戶 ID，因此每個工作階段都會顯示為不同的客戶，並套用您已設定的任何預設客戶預算的各自副本。設定 `x-litellm-customer-id` 會覆寫這一行為，因為標頭會在任何請求本文欄位之前被檢查。如果您寧可讓該流量完全不帶任何客戶資訊，請參閱[限制哪些 ID 會成為客戶](../proxy/legacy_end_users.md#restricting-which-ids-become-customers)。

### 追蹤選項 {#tracking-options}

選擇您要如何歸因成本：

| 追蹤方式 | 標頭 | 使用情境 |
|----------|--------|----------|
| 客戶 | `x-litellm-customer-id` | 向客戶收費、每位使用者預算 |
| 標籤 | `x-litellm-tags` | 專案追蹤、成本中心、環境 |

### 環境變數 {#environment-variables}

| 變數 | 說明 | 範例 |
|----------|-------------|---------|
| `ANTHROPIC_BASE_URL` | LiteLLM proxy URL | `http://localhost:4000` |
| `ANTHROPIC_API_KEY` | LiteLLM API 金鑰 | `sk-<your-api-key>` |
| `ANTHROPIC_CUSTOM_HEADERS` | 自訂標頭（`header-name: value` 格式） | 請參閱下方範例 |

### 選項 1：依客戶追蹤 {#option-1-track-by-customer}

請用這個方式將成本歸因到特定客戶或終端使用者。

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-<your-api-key>
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-id: claude-ishaan-local"
```

### 選項 2：依標籤追蹤 {#option-2-track-by-tags}

請用這個方式將成本歸因到專案、成本中心或環境。傳入以逗號分隔的標籤。

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-<your-api-key>
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-tags: project:acme,env:prod,team:backend"
```

### 快速開始 {#quick-start}

#### 1. 設定環境變數 {#1-set-environment-variables}

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-<your-api-key>
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-id: claude-ishaan-local"
```

#### 2. 使用 Claude Code {#2-use-claude-code}

```bash
claude
```

現在所有請求都會以客戶 ID `claude-ishaan-local` 進行追蹤。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/8f45872e-2d00-4d01-bf3d-4d6ae11d1396/ascreenshot_d2a745b8da4f4a56aaf2cac02871ef53_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/dd41eae3-2592-4bc9-a8d2-d6d02614cd2d/ascreenshot_43ec9ee48ad946cca49732f007e786fc_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/0c30309e-7117-4999-a3df-d22a2d5629c1/ascreenshot_d76a48c53b9a4fad8f6727baf4aa6a9c_text_export.jpeg)

#### 3. 在 LiteLLM UI 中查看使用量 {#3-view-usage-in-litellm-ui}

前往 LiteLLM UI 的 **Logs** 分頁。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/ff774392-69f5-483e-83e2-fb749c94ee90/ascreenshot_d264fc04c9ee47edb047f61b6eb8c4d7_text_export.jpeg)

點選某個請求以查看詳細資訊。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/5f71589b-5fdd-4759-9b6e-e6874be0eb21/ascreenshot_92dd86dadccb4764b1169c29c10dfe65_text_export.jpeg)

依客戶 ID 篩選，即可查看該客戶的所有請求。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/dd1c8aba-e75b-4714-9eee-c785e9db99af/ascreenshot_36aaec0fe12f4189b64f704a551e6729_text_export.jpeg)

### 支援的標頭 {#supported-headers}

| 標頭 | 說明 |
|--------|-------------|
| `x-litellm-customer-id` | 依客戶／終端使用者 ID 追蹤 |
| `x-litellm-end-user-id` | 替代客戶 ID 標頭 |
| `x-litellm-tags` | 用於成本歸因的逗號分隔標籤 |

### 相關內容 {#related}

- [Claude Code 快速入門](./claude_responses_api.md)
- [Codex CLI - 細緻的成本追蹤](./codex_customer_tracking.md)
- [舊版客戶預算](../proxy/legacy_end_users.md)
- [標籤預算](../proxy/tag_budgets.md)
- [追蹤程式撰寫工具的用量](./cost_tracking_coding.md)
