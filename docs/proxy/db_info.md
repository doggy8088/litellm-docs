# DB 中儲存了什麼 {#what-is-stored-in-the-db}

LiteLLM Proxy 使用 PostgreSQL 資料庫來儲存各種資訊。以下是此 DB 的主要用途：
- 虛擬金鑰、組織、團隊、使用者、預算等。
- 每次請求的使用量追蹤

## DB 結構的連結 {#link-to-db-schema}

您可以在[這裡](https://github.com/BerriAI/litellm/blob/main/schema.prisma)查看完整的 DB 結構

## DB 資料表 {#db-tables}

### 組織、團隊、使用者、終端使用者 {#organizations-teams-users-end-users}

| 資料表名稱 | 說明 | 列插入頻率 |
|------------|-------------|---------------------|
| LiteLLM_OrganizationTable | 管理組織層級設定。追蹤組織支出、模型存取與中繼資料。連結至預算設定與團隊。 | 低 |
| LiteLLM_TeamTable | 處理組織內的團隊層級設定。管理團隊成員、管理員及其角色。控制團隊專屬預算、速率限制與模型存取。 | 低 |
| LiteLLM_UserTable | 儲存使用者資訊及其設定。追蹤個別使用者支出、模型存取與速率限制。管理使用者角色與團隊成員資格。 | 低 |
| LiteLLM_EndUserTable | 管理終端使用者設定。控制模型存取與區域需求。追蹤終端使用者支出。 | 低 |
| LiteLLM_TeamMembership | 追蹤使用者在團隊中的參與。管理團隊專屬的使用者預算與支出。 | 低 |
| LiteLLM_OrganizationMembership | 管理使用者在組織內的角色。追蹤組織專屬的使用者權限與支出。 | 低 |
| LiteLLM_InvitationLink | 處理使用者邀請。管理邀請狀態與到期時間。追蹤誰建立並接受了邀請。 | 低 |
| LiteLLM_UserNotifications | 處理模型存取請求。追蹤使用者對模型存取的請求。管理核准狀態。 | 低 |

### 驗證 {#authentication}

| 資料表名稱 | 說明 | 列插入頻率 |
|------------|-------------|---------------------|
| LiteLLM_VerificationToken | 管理虛擬金鑰及其權限。控制金鑰專屬預算、速率限制與模型存取。追蹤金鑰專屬支出與中繼資料。 | **中等** - 儲存所有虛擬金鑰 |

### 模型（LLM）管理 {#model-llm-management}

| 資料表名稱 | 說明 | 列插入頻率 |
|------------|-------------|---------------------|
| LiteLLM_ProxyModelTable | 儲存模型設定。定義可用模型及其參數。包含模型專屬資訊與設定。 | 低 - 僅設定 |

### 預算管理 {#budget-management}

| 資料表名稱 | 說明 | 列插入頻率 |
|------------|-------------|---------------------|
| LiteLLM_BudgetTable | 儲存組織、金鑰與終端使用者的預算和速率限制設定。追蹤最高預算、軟性預算、TPM/RPM 限制及模型專屬預算。處理預算期間與重設時間。 | 低 - 僅設定 |

### 追蹤與記錄 {#tracking--logging}

| 資料表名稱 | 說明 | 列插入頻率 |
|------------|-------------|---------------------|
| LiteLLM_SpendLogs | 所有 API 請求的詳細記錄。記錄 token 使用量、花費與時間資訊。追蹤使用了哪些模型與金鑰。 | **中等 - 這是一個以固定間隔執行的批次程序。** |
| LiteLLM_DailyUserSpend 和其同系列表（DailyTeamSpend、DailyOrgSpend、DailyTagSpend、DailyEndUserSpend、DailyAgentSpend） | 依使用者、團隊、組織、標籤、最終使用者與代理程式彙總的每日花費預先聚合資料；管理介面中的用量檢視會讀取這些彙總，而不是掃描 SpendLogs。 | 低 - 每個實體每天一列，以批次方式更新 |
| LiteLLM_DailyGatewayRequests | 由 request-metrics middleware 在 ASGI 邊緣記錄的成功與失敗請求計數，以日期、類別與路由為鍵。支援用量頁面上的 Successful Requests 與 Failed Requests 磚塊，以及 Gateway Requests by Endpoint 圖表；請參閱 [gateway request counts](./endpoint_activity.md#gateway-request-counts)。 | 低 - 每個路由每天一列，以批次方式更新 |
| LiteLLM_AuditLog | 追蹤系統設定的變更。記錄是誰進行了變更，以及修改了什麼。維護團隊、使用者與模型更新的歷史。 | **預設關閉**，**高 - 在每次對實體的變更時執行** |

## 停用 `LiteLLM_SpendLogs` {#disable-litellm_spendlogs}

在 `general_settings` 下設定 `disable_spend_logs: True` 或 `disable_error_logs: True` 以停止寫入這些資料表。停用 spend logs 後，您會失去 UI 中的每請求記錄細節，但仍可在記錄整合（s3、Prometheus、Langfuse）中保留成本指標；停用 error logs 後，您會失去 UI 中的 Errors 檢視，但仍可在應用程式記錄與其他記錄整合中保留錯誤。請參閱生產檢查清單中的 [將錯誤記錄排除在資料庫之外](./prod.md#keep-error-logs-out-of-the-database)。

## 資料庫遷移  {#migrating-databases}

如果您需要遷移資料庫，應複製下列資料表，以確保服務持續並且沒有停機時間

| 資料表名稱 | 說明 | 
|------------|-------------|
| LiteLLM_VerificationToken | **必需**，以確保現有虛擬金鑰持續可用 |
| LiteLLM_UserTable | **必需**，以確保現有虛擬金鑰持續可用 |
| LiteLLM_TeamTable | **必需**，以確保團隊已遷移 |
| LiteLLM_TeamMembership | **必需**，以確保團隊成員預算已遷移 |
| LiteLLM_BudgetTable | **必需**，以遷移現有預算設定 |
| LiteLLM_OrganizationTable | **選用** 僅在您於 DB 中使用組織時才遷移 |
| LiteLLM_OrganizationMembership | **選用** 僅在您於 DB 中使用組織時才遷移 | 
| LiteLLM_ProxyModelTable | **選用** 僅在您將 LLM 儲存在 DB 中時才遷移（也就是您設定了 `STORE_MODEL_IN_DB=True`） |
| LiteLLM_SpendLogs | **選用** 僅在您想要在 LiteLLM UI 上保留歷史資料時才遷移 |
| LiteLLM_ErrorLogs | **選用** 僅在您想要在 LiteLLM UI 上保留歷史資料時才遷移 |

## 使用邏輯複寫複製資料庫 {#replicating-the-database-with-logical-replication}

Postgres 邏輯複寫只會在資料列被更新或刪除時帶出 replica identity 的欄位。Prisma 會以 Postgres 預設值，也就是主鍵，建立每一個 LiteLLM 資料表，因此下游消費者會看到新資料列，但看不到先前的資料列。像 Neon 的 lakehouse sync 這類接收端需要 `REPLICA IDENTITY FULL`，並會拒絕沒有它的資料表。

設定 `LITELLM_SET_REPLICA_IDENTITY_FULL=True`，讓 LiteLLM 在每次 migration 執行結束時，對每一個 LiteLLM 資料表執行

```sql
ALTER TABLE "LiteLLM_..." REPLICA IDENTITY FULL;
```

，包括未來升級新增的資料表，這樣該設定就能在升級後持續生效，而不必手動重新套用。已經 `FULL` 的資料表會被略過，而 LiteLLM 不擁有的同一 schema 中資料表則不受影響。

```bash
export LITELLM_SET_REPLICA_IDENTITY_FULL=True
litellm --config /path/to/config.yaml
```

執行 migration 的資料庫使用者必須擁有這些資料表。如果沒有，`ALTER` 會被拒絕，LiteLLM 會記錄 Postgres 錯誤並繼續啟動，因為提供請求不需要複寫中繼資料。

`REPLICA IDENTITY FULL` 會讓 Postgres 在每一次 `UPDATE` 和 `DELETE` 時，將完整的舊資料列寫入 WAL，因此除非複寫消費者需要，否則請保持關閉。
