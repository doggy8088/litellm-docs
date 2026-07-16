# Claude Code - 細粒度成本追蹤 {#claude-code---granular-cost-tracking}

使用 LiteLLM proxy 依照客戶或標籤追蹤 Claude Code 的使用量。這可用於精細的成本歸因，方便計費、預算控管與分析。

## 運作方式 {#how-it-works}

Claude Code 支援透過 `ANTHROPIC_CUSTOM_HEADERS` 使用自訂標頭。LiteLLM 會自動追蹤帶有特定標頭的請求，以進行成本歸因。

## 追蹤選項 {#tracking-options}

選擇您要如何歸因成本：

| 追蹤方式 | 標頭 | 使用情境 |
|----------|--------|----------|
| 客戶 | `x-litellm-customer-id` | 向客戶收費、每位使用者預算 |
| 標籤 | `x-litellm-tags` | 專案追蹤、成本中心、環境 |

## 環境變數 {#environment-variables}

| 變數 | 說明 | 範例 |
|----------|-------------|---------|
| `ANTHROPIC_BASE_URL` | LiteLLM proxy URL | `http://localhost:4000` |
| `ANTHROPIC_API_KEY` | LiteLLM API 金鑰 | `sk-1234` |
| `ANTHROPIC_CUSTOM_HEADERS` | 自訂標頭（`header-name: value` 格式） | 請參閱下方範例 |

## 選項 1：依客戶追蹤 {#option-1-track-by-customer}

請用這個方式將成本歸因到特定客戶或終端使用者。

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-1234
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-id: claude-ishaan-local"
```

## 選項 2：依標籤追蹤 {#option-2-track-by-tags}

請用這個方式將成本歸因到專案、成本中心或環境。傳入以逗號分隔的標籤。

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-1234
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-tags: project:acme,env:prod,team:backend"
```


## 快速開始 {#quick-start}

### 1. 設定環境變數 {#1-set-environment-variables}

```bash
export ANTHROPIC_BASE_URL=http://localhost:4000
export ANTHROPIC_API_KEY=sk-1234
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-id: claude-ishaan-local"
```

### 2. 使用 Claude Code {#2-use-claude-code}

```bash
claude
```

現在所有請求都會以客戶 ID `claude-ishaan-local` 進行追蹤。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/8f45872e-2d00-4d01-bf3d-4d6ae11d1396/ascreenshot_d2a745b8da4f4a56aaf2cac02871ef53_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/dd41eae3-2592-4bc9-a8d2-d6d02614cd2d/ascreenshot_43ec9ee48ad946cca49732f007e786fc_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/0c30309e-7117-4999-a3df-d22a2d5629c1/ascreenshot_d76a48c53b9a4fad8f6727baf4aa6a9c_text_export.jpeg)

### 3. 在 LiteLLM UI 中查看使用量 {#3-view-usage-in-litellm-ui}

前往 LiteLLM UI 的 **Logs** 分頁。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/ff774392-69f5-483e-83e2-fb749c94ee90/ascreenshot_d264fc04c9ee47edb047f61b6eb8c4d7_text_export.jpeg)

點選某個請求以查看詳細資訊。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/5f71589b-5fdd-4759-9b6e-e6874be0eb21/ascreenshot_92dd86dadccb4764b1169c29c10dfe65_text_export.jpeg)

依客戶 ID 篩選，即可查看該客戶的所有請求。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-16/dd1c8aba-e75b-4714-9eee-c785e9db99af/ascreenshot_36aaec0fe12f4189b64f704a551e6729_text_export.jpeg)

## 支援的標頭 {#supported-headers}

| 標頭 | 說明 |
|--------|-------------|
| `x-litellm-customer-id` | 依客戶／終端使用者 ID 追蹤 |
| `x-litellm-end-user-id` | 替代客戶 ID 標頭 |
| `x-litellm-tags` | 用於成本歸因的逗號分隔標籤 |

## 相關內容 {#related}

- [Claude Code 快速入門](./claude_responses_api.md)
- [客戶預算](../proxy/customers.md)
- [標籤預算](../proxy/tag_budgets.md)
- [追蹤程式碼工具的使用量](./cost_tracking_coding.md)
