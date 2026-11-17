---
title: "LiteLLM 支出資料的 Hex 成本儀表板"
sidebar_label: "Hex"
description: "將 Hex 連接到 LiteLLM 現有的 Postgres 報表資料表，匯入成本儀表板，並在 LiteLLM UI 中根據分析結果採取行動。"
---

# 使用 Hex 分析 LiteLLM 成本 {#analyze-litellm-costs-with-hex}

LiteLLM 將每日支出總計儲存在 Postgres 中。Hex 透過唯讀連線讀取這些總計。請參閱[三步驟指南](/blog/hex-litellm-roi)，或開啟[公開 Hex 示範](https://app.hex.tech/01a18e4b-6e94-7328-831c-e5ab0e2e00e7/app/LiteLLM-AI-cost-and-ROI-demo-034p688gOAllaldLw72Oat/latest)。此示範使用合成記錄，無需登入即可使用。

## 連接 Postgres {#connect-postgres}

在 **Hex Settings → Data sources → + Connection → Postgres** 中，新增您的 LiteLLM Postgres 資料庫。請與您的資料庫管理員設定網路存取與 TLS。您可以使用現有的 reader；副本是選擇性的。

| 現有資料表 | 報表欄位 |
| --- | --- |
| `LiteLLM_DailyTeamSpend` | `date`、`team_id`、`model`、`model_group`、`spend`、請求/狀態計數、prompt 與 completion token 計數。 |
| `LiteLLM_TeamTable` | `team_id`、`team_alias`。此 join 提供團隊顯示名稱。 |

查詢不會選取 `api_key`，也不會讀取憑證資料表。請將 Hex 角色的權限範圍限制在上述欄位。它會讀取 60 個完整的 UTC 日，並將看板預設為 30 日。請確認每日彙總已填入資料，且保留期間涵蓋您的報表期間。

管理員已建立的 reader 的授權範例：

```sql
GRANT SELECT (date, team_id, model, model_group, spend, api_requests,
  successful_requests, failed_requests, prompt_tokens, completion_tokens)
ON public."LiteLLM_DailyTeamSpend" TO hex_reader;
GRANT SELECT (team_id, team_alias)
ON public."LiteLLM_TeamTable" TO hex_reader;
```

## 匯入團隊成本範本 {#import-the-team-cost-template}

下載 [Postgres 範本](/hex/litellm_team_cost_postgres.hex.yaml)。在 **Hex Home** 中，點按 Project 與 Thread 旁的 **+**，然後選取 **Upload project**。在上傳對話框中，點按 **Upload** 並選取檔案。您需要具有建立專案權限的 Hex 角色。

![Hex 上傳專案對話框](/img/hex/import-project.png)

開啟 **Source**，選取您的 Postgres 連線，然後 **Run all**。兩個團隊篩選條件留空表示所有允許的團隊，或輸入一個團隊 ID。將 App 發布給您選定的對象，並新增排程執行以重新整理。

範本版本：**2.0.0**。{/* keep-version-note: Hex template version, not a LiteLLM release */} 匯入的副本不會自行更新。更換看板前，請先檢閱[來源與變更記錄](https://github.com/BerriAI/litellm-docs/tree/main/static/hex)。

每日來源包含成本、請求、token 以及已知的成功/失敗計數。延遲、TTFT 與回應快取命中率仍未知。此示範可以顯示這些指標，因為它產生的是合成的請求層級量測。

## 在 LiteLLM 中完成閉環 {#complete-the-loop-in-litellm}

使用 **Teams → 您的團隊 → Settings → Edit Settings** 變更團隊模型別名或設定其預算。使用 **Models + Endpoints → Auto Router** 設定依層級的路由。確認應用程式呼叫的是設定的別名或路由器，然後在 Hex 中比較下一個完整的報表期間。

請參閱 [UI 操作導覽](/blog/hex-litellm-roi#3-take-an-action-in-litellm)、[Auto Router 設定](/docs/auto_router/setup) 與[團隊預算指南](/docs/proxy/team_budgets)。

## 其他範本 {#other-templates}

[團隊示範 YAML](/hex/litellm_team_cost_demo.hex.yaml) 無需資料庫即可運作。線上的公開 App 仍是檢視儀表板最快的方式。

下方的選用專案 ROI 範本使用請求記錄中繼資料進行專案歸屬。它們需要下方所述的彙總檢視，並將業務價值與記錄的 LLM 成本分開。

## 受限檢視選項 {#restricted-view-option}

使用此選用的請求記錄來源，取得來自請求中繼資料的時間指標與專案歸屬。其受限 reader 不得讀取原始支出記錄資料表。以下步驟先安裝彙總檢視，再連接受限 reader。

### 準備支出檢視 {#prepare-the-spend-view}

請您的資料庫管理員在包含 `public."LiteLLM_SpendLogs"` 的資料庫中執行 [setup-postgres.sql](/hex/setup-postgres.sql)。請先請他們佈建名為 `hex_reader` 的專用 reader，或將兩個授權改為符合他們提供的 reader。請將憑證保存在 Hex 的連線設定中。

此 SQL 會建立 `litellm_analytics.spend_daily_v1`。Hex 可以讀取過去 60 個完整 UTC 日的每日彙總。此檢視公開專案與團隊識別碼、模型名稱、支出、使用量、時間與快取計數。它不包含請求內容、回應、IP 位址、金鑰雜湊與原始中繼資料。請讓 Hex 登入帳號有權存取此檢視；不要授予來源資料表的存取權。

如果分析查詢造成過大負載，請考慮使用唯讀副本。請確認您的部署會將請求記錄到 Postgres，且保留足夠的歷史供您比較。此檢視無法復原已過期或未記錄的請求。較早的 LiteLLM 結構描述可能缺少某個欄位；請您的管理員將該指標對應為未知，而非捏造數值。

此檢視先讀取 `metadata.user_api_key_project_id`，再讀取 `metadata.project_id`，進行專案歸屬。它將團隊所有權保留在獨立的 `team_id` 欄位中。請檢閱您的記錄，並依您的部署調整此對應。缺少專案歸屬時會顯示為 `(unassigned)`。

### 在 Hex 中新增連線 {#add-the-connection-in-hex}

在 Hex 中，開啟 **Settings → Data sources → + Connection → Postgres**。輸入您的 reader 的主機、連接埠、資料庫與驗證詳細資料。使用您的管理員要求的網路與 TLS 設定。防火牆或 SSH 設定請遵循 [Hex 的 Postgres 指南](https://learn.hex.tech/docs/connect-to-data/data-connections/setup-guides/connect-to-postgres)。

![Hex Postgres 連線表單，憑證欄位為空](/img/hex/postgres-connection.png)

重新整理連線結構描述。在結構描述瀏覽中包含 `litellm_analytics`，並確認您可以查詢 `spend_daily_v1`。

```sql
SELECT *
FROM litellm_analytics.spend_daily_v1
ORDER BY day DESC
LIMIT 20;
```

### 匯入並執行看板 {#import-and-run-the-board}

下載[受限檢視 Postgres 專案](/hex/litellm_roi_postgres.hex.yaml)。從 Hex Home 使用 **+ → Upload project → Upload** 並選取 `.hex.yaml` 檔案。開啟 **Source** SQL 儲存格並選取您的 Postgres 連線。執行所有儲存格。

在 **Settings** 中，選擇您的報表日期。預設涵蓋最近 30 個完整的 UTC 日；結束日期不含當日。使用 Project 與 Entity 輸入來檢視單一範圍。將輸入留空，可檢視您的連線能讀取的所有資料。

![Hex 專案成本看板，含合成示範記錄](/img/hex/roi-overview.png)

此看板包含專案與實體排名表、支出占比、每日支出、模型組合，以及成本變更審查佇列。它比較最近七個完整日與前七日，並在兩個期間七日都有記錄時，標記成本增加超過 25% 且超過 $10 的項目。請將每請求成本與總支出一併檢視，以區分流量增加與單位成本增加。

## 為 ROI 新增業務價值 {#add-business-value-for-roi}

開啟 **Settings**，並以財務核准的數值填入所選報表期間的 `value_data`：

```python
value_data = pd.DataFrame([{
    "project_id": "support-assistant",
    "value_usd": 5000,
    "other_cost_usd": 1000,
    "coverage_start": report_start,
    "coverage_end": report_end,
}])
```

這些數字說明輸入的形狀。請以經驗證的專案資料取代。其他成本請包含基礎設施、自動化、授權與人力。業務價值請選擇已實現的營收或核准的避免成本估計，並避免重複計算同一效益。

看板計算 `(business value - LLM spend - other costs) / (LLM spend + other costs)`。在您提供相符的專案與報表期間、每日都有記錄支出且沒有標記為未知的成本之前，ROI 會保持未知。ROI 需要完整的專案範圍，因此 Entity 篩選會讓它保持未知。在將結果用於財務報表之前，請驗證記錄完整性，並納入 LiteLLM 之外的成本。

![Hex 模型組合與成本變更審查，含合成記錄](/img/hex/roi-cost-changes.png)

## 發布並保持最新 {#publish-and-keep-it-current}

將 App 發布給您的目標對象。設定 [Hex 排程執行](https://learn.hex.tech/docs/share-insights/scheduled-runs) 以更新發布結果。指派看板負責人檢查失敗的執行、來源保留與歸屬變更。如果您需要警示，請在 Hex 中設定通知；範本的審查佇列不會傳送訊息。

透過資料庫權限與 Hex 共用來強制部門存取控制。能編輯輸入的檢視者可以變更其範圍；Project 與 Entity 篩選不提供存取控制。當部門必須查看不同資料時，請建立獨立的受限連線與看板。

## 閱讀指標 {#read-the-metrics}

| 指標 | 定義與限制 |
| --- | --- |
| 支出 | 記錄的 LiteLLM 支出總和。請確認幣別；範本將其標示為 USD。某些部署會將無法取得的成本記錄為零，因此請與提供者帳單核對。 |
| 失敗率 | 失敗次數除以已知成功/失敗狀態的請求數。品質表會計算狀態未知的請求。 |
| 快取命中率 | 在每日彙總來源上未知。在請求記錄來源上，為 LiteLLM 回應快取命中次數除以已知快取旗標的請求數。提供者 prompt 快取使用不同的欄位。 |
| 延遲與 TTFT | 在每日彙總來源上未知。在請求記錄來源上，為具有有效時間戳記之請求的加權平均。TTFT 涵蓋範圍取決於 completion 開始記錄。 |
| 缺失日 | 每日圖表中的間隙。缺少一列可能表示沒有流量，或記錄有間隙。 |
| 快取節省 | 需要提供者快取 token 使用量與價格基準。此範本不會估算它。 |

## 範本維護 {#template-maintenance}

我們在文件儲存庫中對範本檔案與 SQL 合約進行版本管理。Hex 範本檢查會驗證 Hex 的檔案結構描述、執行示範、測試缺失值與篩選條件，並以一次性的 Postgres 資料庫檢查 SQL 與 reader 授權。檢查與變更記錄請參閱[範本 README](https://github.com/BerriAI/litellm-docs/blob/main/static/hex/README.md)。

## 選用的 S3 與 Athena 匯出 {#optional-s3-and-athena-export}

<SinceVersion v="1.110.0" />

如果您需要 S3 支出匯出，請使用這條獨立路徑。它需要 AWS 儲存桶、Athena 與 IAM 設定。上方的 Postgres 範本不需要這些資源。

### 啟用回呼 {#enable-the-callback}

將 `hex` 新增到您的 proxy 設定：

```yaml
litellm_settings:
  callbacks: ["hex"]
```

在啟動 proxy 之前先設定目的地：

```bash
export HEX_S3_BUCKET_NAME="your-analytics-bucket"
export HEX_S3_REGION_NAME="us-east-1"
export HEX_S3_PATH="litellm-spend"
```

儲存桶必須已存在。請授予 proxy 的 AWS IAM 角色在設定前綴上的 `s3:PutObject` 權限。此回呼使用標準 AWS 憑證鏈，包括工作負載憑證。請將憑證保存在 proxy 設定與原始碼控制之外。

| 變數 | 是否必填 | 預設值 | 用途 |
| --- | --- | --- | --- |
| `HEX_S3_BUCKET_NAME` | 是 | 無 | 目的地儲存桶。 |
| `HEX_S3_PATH` | 否 | `litellm-spend` | 物件前綴。請為此匯出使用專用前綴。 |
| `HEX_S3_REGION_NAME` | 否 | `AWS_REGION`，其次為 `us-east-1` | 儲存桶區域。 |
| `HEX_S3_ENDPOINT_URL` | 否 | AWS S3 端點 | S3 相容儲存或本機測試的自訂端點。Athena 需要 AWS S3 資料來源。 |

目的地與現有的 `s3_v2` 回呼相互獨立。

### 透過 Athena 連接 Hex {#connect-hex-through-athena}

在您的 Athena 資料庫中執行 [Athena 資料表設定](https://github.com/BerriAI/litellm/blob/main/cookbook/logging_observability/hex_spend_table.sql)。將兩處 `YOUR_BUCKET` 與 `litellm-spend` 前綴取代為您設定的值。此資料表使用日期分區投影，因此新的每日資料夾無需 crawler 或 `MSCK REPAIR TABLE` 即可查詢。

在 Hex 中建立 Athena 資料連線。建議使用 IAM 角色驗證，搭配 Hex 提供的信任原則與外部 ID。授予該角色支出前綴的讀取權限、Hex 所需的 Athena 與 Glue 權限，以及獨立 Athena 查詢結果前綴的寫入權限。請將查詢結果保存在支出前綴之外。

結構描述探索需要在您的目錄上具有 `athena:ListDatabases`、`athena:ListTableMetadata`、`athena:GetDatabase` 與 `athena:GetTableMetadata`，以及目錄、資料庫與資料表的 Glue 讀取權限。僅有查詢權限不會讓資料表在 Hex AI 中可見。請納入 [Hex Athena 設定指南](https://learn.hex.tech/docs/connect-to-data/data-connections/setup-guides/connect-to-amazon-athena) 中的查詢與預備陳述式權限，以及當您的用戶端使用串流結果時的 `athena:GetQueryResultsStream`。

建立資料表後，重新整理連線結構描述，並確認 `litellm_hex_spend` 出現在 Hex 的 Data 瀏覽器中。使用連線的結構描述篩選，只包含您的支出資料庫。之後您可以請 Hex AI 從該資料表建立儀表板，或匯入下方範本。

將 [Hex 儀表板範本](https://github.com/BerriAI/litellm/blob/main/cookbook/logging_observability/hex_spend_dashboard.hex.yaml) 匯入為專案。為其四個 SQL 儲存格選取您的 Athena 連線，並使用包含 `litellm_hex_spend` 的資料庫。執行所有儲存格並發布 App。

此範本顯示最近 30 個 UTC 日曆日的支出、請求、token、失敗、未知成本請求、每日支出、模型支出與團隊支出。請設定 Hex 排程執行以符合您想要的重新整理間隔。每個查詢讀取上傳的記錄；儀表板重新整理間隔與回呼的上傳間隔是分開的。範本中已停用查詢結果快取，因此重新整理會再次查詢 S3。

Hex 的 S3 檔案選擇器會匯入選取的檔案。它不會為歷史儀表板自動探索每個新的記錄物件。此工作流程請使用 Athena。

### 匯出的記錄 {#exported-records}

每個請求產生一列。成功、失敗與完成的串流請求使用相同的結構描述。此回呼將列批次寫入 `<prefix>/YYYY-MM-DD/` 下的換行分隔 JSON 物件。如果 `s3_v2` 也設定為 proxy 的冷儲存記錄器，共用上傳器會使用個別 JSON 物件；Athena 資料表可讀取兩種格式。

| 欄位 | 意義 |
| --- | --- |
| `id`、`start_time`、`end_time` | 請求識別碼與 Unix 時間戳記（秒）。 |
| `model`、`model_group`、`custom_llm_provider`、`call_type` | 模型、路由群組、提供者與操作。 |
| `status`、`spend`、`response_time`、`cache_hit` | 結果、USD 成本、以秒計的延遲與快取狀態。成本無法取得時可為 null。 |
| `prompt_tokens`、`completion_tokens`、`total_tokens` | Token 使用量。 |
| `team_id`、`organization_id`、`user_id`、`key_alias` | 用於歸屬的所有權識別碼。 |

Prompt、回應、原始錯誤訊息、任意請求中繼資料與 API 金鑰都會被排除。團隊/使用者識別碼與金鑰別名會被包含；請將儲存桶與 Hex 存取權限限制在可查看該歸屬資料的人員。請避免在模型名稱或別名中放入敏感資訊。

### 傳遞與規模 {#delivery-and-scale}

此回呼使用 LiteLLM 的 S3 上傳佇列與重試行為。記錄會在記憶體中等待直到排清；程序當機可能遺失尚未送達 S3 的記錄。這是非同步分析匯出，其傳遞限制與 S3 記錄器相同。

共用預設值為每批次 512 筆記錄與 10 秒排清間隔。`DEFAULT_S3_BATCH_SIZE` 與 `DEFAULT_S3_FLUSH_INTERVAL_SECONDS` 可變更 S3 回呼的這些預設值。上傳失敗會保留供後續排清，但仍受 S3 記錄器的佇列與重試限制。請在您的部署中監控回呼失敗與儲存桶傳遞。

在高流量下，請將 JSON 壓縮為分區 Parquet 或載入您的資料倉儲，然後將 Hex 指向該資料集。請依您的保留需求設定 S3 生命週期規則。Athena 查詢會產生 AWS 查詢成本。
