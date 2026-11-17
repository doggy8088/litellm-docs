---
title: "LiteLLM AI Gateway 的 Ternary 成本匯出"
sidebar_label: "Ternary"
description: "將 LiteLLM AI Gateway 的支出以 FOCUS 1.2 成本報告匯出至 Ternary，依團隊、專案與 API 金鑰拆分 AI 成本，並附 token 明細。"
---
# Ternary {#ternary}

LiteLLM 可將 Proxy 支出資料以 [FOCUS 1.2](https://focus.finops.org/) 格式的成本報告匯出至 [Ternary](https://ternary.app)。如此一來，您就能在 Ternary 的 FinOps 平台中，將 LLM 支出與您的雲端成本一併分配與分析，例如將共用的 AI 發票依團隊、專案與 API 金鑰拆分。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 目的地 | 將 LiteLLM 使用資料匯出至 Ternary AI Gateway 成本連線 |
| 資料格式 | FOCUS CSV（由 LiteLLM 支出資料自動轉換） |
| 支援的操作 | 自動排程匯出（每日；設定驗證時可用 interval） |
| 驗證 | Ternary API 金鑰 + 連線 ID（每連線專屬的 bearer token） |
| 隱私 | 僅限成本與使用 metadata。提示或 completion 內容不會離開閘道 |

## 前置條件 {#prerequisites}

您需要 Ternary 提供的三個值：

1. **連線 ID**（`TERNARY_CONNECTION_ID`）：識別資料匯入的成本連線，會出現在匯出 URL 路徑中。
2. **API 金鑰**（`TERNARY_API_KEY`）：每連線專屬的 bearer token，用於驗證推送。
3. **API 主機**（`TERNARY_BASE_URL`）：您的 Ternary API 主機，依地區而異（美國與歐盟不同）。

連線 ID 與 API 金鑰會在您於 Ternary 新增 **AI Gateway** 整合時產生（**Settings → Integrations → Add integration → AI Gateway**）。API 主機是您登入的 Ternary 執行個體的基礎 URL。美國與歐盟地區使用不同的主機。

## 設定 {#setup}

### 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `TERNARY_API_KEY` | 是 | 來自 Ternary AI Gateway 整合的每連線專屬 bearer token |
| `TERNARY_CONNECTION_ID` | 是 | 成本連線識別碼（用於匯出 URL 路徑） |
| `TERNARY_BASE_URL` | 是 | 您的 Ternary API 主機（依地區而定，美國與歐盟不同）。不預設任何預設值。 |
| `TERNARY_EXPORT_FREQUENCY` | 否 | `daily`（預設），或用於短時間設定驗證迴圈的 `interval`。LiteLLM 支出為每日彙總，因此沒有比每日更短的節奏。 |
| `TERNARY_EXPORT_INTERVAL_SECONDS` | 否 | 頻率為 `interval` 時每次匯出的間隔秒數（用於短時間的設定驗證/測試迴圈） |

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: sk-your-key

litellm_settings:
  callbacks: ["ternary"]
```

```bash
export TERNARY_API_KEY="<your-connection-api-key>"
export TERNARY_CONNECTION_ID="<your-connection-id>"
export TERNARY_BASE_URL="<your-ternary-api-host>"   # region-specific (US vs EU)
litellm --config /path/to/config.yaml
```

Proxy 會註冊一個背景工作，依設定的排程匯出 FOCUS 格式的支出資料。

## 運作方式 {#how-it-works}

在每次排程執行時，LiteLLM 會將近期的支出轉換為 FOCUS 1.2 CSV，並在匯出時間窗內以**每個 UTC 日一個檔案**的方式上傳：

1. **請求上傳 URL。** 對於有資料的每一天，LiteLLM 以 `Authorization: Bearer {TERNARY_API_KEY}` 呼叫 `POST {TERNARY_BASE_URL}/external-cost-sources/v1/{TERNARY_CONNECTION_ID}/upload-url`，內文為 `{"day": "YYYY-MM-DD"}`。Ternary 會回傳該日檔案專用的短期簽章 Google Cloud Storage URL，以及上傳時必須攜帶的標頭。
2. **上傳當日檔案。** LiteLLM 以回傳的標頭，將當日的 CSV 直接 `PUT` 至該簽章 URL。CSV 不會經過 Ternary 的 API。

每一天對應一個檔案，因此重新傳送某一天會取代該檔案，而不會重複計算。若某一天的上傳失敗，其餘天數仍會上傳；下一次排程執行會重新傳送該時間窗，因此漏傳的天數會自行補上。

## 隱私 {#privacy}

匯出的僅有成本與使用 **metadata**：支出、token 數量、模型、提供者，以及團隊/金鑰識別碼。提示與 completion **內容絕不會離開閘道**。

## 成本來源（估計與實際帳單） {#cost-provenance-estimate-vs-billed}

閘道回報的支出是費率卡 **估計值**，而非實際帳單發票。Ternary 會為透過此連線匯入的每一列標記其來源（成本來源為 `"LiteLLM estimate"`），此標記由伺服器端依連線推導，因此估計的閘道支出絕不會被誤認為實際雲端帳單成本，也不會被重新分配為帳單成本。請將閘道支出保持在估計值的範疇內，以避免與另一份提供者發票重複計算。

## FOCUS 欄位對應 {#focus-field-mapping}

LiteLLM 支出資料會轉換為 FOCUS 1.2 結構描述（與其他 FOCUS 目的地共用同一個轉換器）：

| LiteLLM 欄位 | FOCUS 欄位 | 說明 |
|---------------|--------------|-------------|
| `spend` | BilledCost, EffectiveCost, ListCost, ContractedCost | 使用成本（閘道估計值） |
| `model` | ChargeDescription, ResourceId | 模型識別碼 |
| `model_group` | ServiceName | 模型群組 / 部署 |
| `custom_llm_provider` | ProviderName, PublisherName | 提供者 (openai, anthropic, …) |
| `api_key` | BillingAccountId | 經雜湊的 API 金鑰 |
| `api_key_alias` | BillingAccountName | 易讀的金鑰別名 |
| `team_id` | SubAccountId | 團隊識別碼 |
| `team_alias` | SubAccountName | 團隊名稱 |
| `organization_id` / `organization_alias` | Tags | 組織識別碼 / 顯示名稱 |

### Token 明細 {#token-breakdown}

每請求的 token 數量（`prompt_tokens`、`completion_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens`）不會由共用的 FOCUS 轉換器呈現為頂層欄位，而是以 JSON 形式放在標準的 FOCUS **`Tags`** 欄位中。Ternary 在匯入時會從 `Tags` 讀取這些值，以支援依 token 加權的成本分配。其他 metadata（`user_id`、`user_email`、`model`、…）也一併放在 `Tags` 中。

## 相關連結 {#related-links}

- [Ternary](https://ternary.app)
- [FOCUS 規範](https://focus.finops.org/)
- [Focus 匯出 (S3 / GCS / Parquet)](./focus.md)
