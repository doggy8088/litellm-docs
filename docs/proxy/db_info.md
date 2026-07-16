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
| LiteLLM_SpendLogs | 所有 API 請求的詳細記錄。記錄 token 使用量、支出與時間資訊。追蹤使用了哪些模型與金鑰。 | **中等 - 這是一個按固定間隔執行的批次程序。** |
| LiteLLM_AuditLog | 追蹤系統設定的變更。記錄是誰做了變更以及修改了什麼。保留團隊、使用者與模型更新的歷史。 | **預設停用**，**高 - 每次實體變更都會執行** |

## 停用 `LiteLLM_SpendLogs` {#disable-litellm_spendlogs}

您可以將 proxy_config.yaml 檔案中 `general_settings` 區段的 `disable_spend_logs` 和 `disable_error_logs` 設為 `True`，以停用 spend_logs 和 error_logs。

```yaml
general_settings:
  disable_spend_logs: True   # Disable writing spend logs to DB
  disable_error_logs: True   # Only disable writing error logs to DB, regular spend logs will still be written unless `disable_spend_logs: True`
```

### 停用這些記錄的影響是什麼？ {#what-is-the-impact-of-disabling-these-logs}

停用 spend logs（`disable_spend_logs: True`）時：
- 您將**無法**在 LiteLLM UI 中查看使用量
- 您將**仍會**在 s3、Prometheus、Langfuse（您正在使用的任何其他記錄整合）中看到成本指標

停用 error logs（`disable_error_logs: True`）時：
- 您將**無法**在 LiteLLM UI 中查看錯誤
- 您將**仍會**在應用程式記錄與您正在使用的任何其他記錄整合中看到錯誤記錄

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
