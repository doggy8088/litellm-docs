import Image from '@theme/IdealImage';

# 已刪除金鑰與團隊稽核記錄 {#deleted-keys--teams-audit-logs}

<Image img={require('../../img/ui_deleted_keys_table.png')} />

查看已刪除的 API 金鑰與團隊，以及其在刪除當下的支出與預算資訊，以供稽核與合規用途。

## 概覽 {#overview}

Deleted Keys & Teams 功能為您在 LiteLLM proxy 中已刪除的實體提供完整的稽核軌跡。此功能的設計目的是讓您能夠輕鬆稽核已刪除的是哪個 key 或 team，以及刪除當下的支出/預算。

當 key 或 team 被刪除時，LiteLLM 會自動擷取：

- **刪除時間戳記** - 實體被刪除的時間
- **刪除者** - 執行刪除動作的人
- **刪除時的支出** - 刪除當下累積的總支出
- **原始預算** - 該實體在刪除前設定的預算
- **實體詳細資料** - key 或 team 的識別資訊

即使在刪除之後，這些資訊仍會被保留，讓您能維持準確的財務記錄與稽核軌跡，以符合合規需求。

## 查看已刪除金鑰 {#viewing-deleted-keys}

### 步驟 1：前往 API Keys 頁面 {#step-1-navigate-to-api-keys-page}

前往 LiteLLM UI 中的 API Keys 頁面：

```
http://localhost:4000/ui/?login=success&page=api-keys
```

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/73b97ba9-0ab5-4140-aee2-05fa90463461/ascreenshot_5e6d9f05d452405c83d7a368349d087d_text_export.jpeg)

### 步驟 2：進入 Logs 區段 {#step-2-access-logs-section}

在導覽中點選「Logs」選單項目。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/73b97ba9-0ab5-4140-aee2-05fa90463461/ascreenshot_8ebab354b1e542e59e1082e519927edd_text_export.jpeg)

### 步驟 3：查看已刪除金鑰 {#step-3-view-deleted-keys}

點選「Deleted Keys」即可查看所有已刪除 API 金鑰的表格。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/00668558-9326-4a6f-8e87-159d54b17a72/ascreenshot_d0e50e49e9aa43d4a22ada6f12a78b12_text_export.jpeg)

### 步驟 4：檢視刪除資訊 {#step-4-review-deletion-information}

Deleted Keys 表格包含每個已刪除金鑰的完整資訊：

- **何時** 刪除該金鑰（時間戳記）
- **誰** 刪除該金鑰（使用者/管理員資訊）
- **金鑰識別** 詳細資料

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/8538f7c4-634e-44c8-8d7d-fafbd6da0b02/ascreenshot_6b73f9c6a52d4e40a2368ef441cf6c8f_text_export.jpeg)

### 步驟 5：查看財務資訊 {#step-5-view-financial-information}

表格也會顯示刪除當下擷取的財務資訊：

- **刪除時的支出** - 金鑰被刪除時累積的總支出
- **原始預算** - 為該金鑰設定的預算上限

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/f8b03850-b17c-490c-a507-c3b0b6c050ab/ascreenshot_070b139f111844bba38fbed8835b097b_text_export.jpeg)

## 查看已刪除團隊 {#viewing-deleted-teams}

### 步驟 1：進入已刪除團隊 {#step-1-access-deleted-teams}

從 Logs 區段中，點選「Deleted Teams」即可查看所有已刪除的團隊。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/716ce26f-09af-4a6d-99c5-921d6b6a8555/ascreenshot_d36c16f1cf894340aa8bc20ada5922ac_text_export.jpeg)

### 步驟 2：檢視團隊刪除資訊 {#step-2-review-team-deletion-information}

Deleted Teams 表格提供每個已刪除團隊的詳細資訊：

- **何時** 刪除該團隊（時間戳記）
- **誰** 刪除該團隊（使用者/管理員資訊）
- **團隊識別** 詳細資料

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/0a3f2d3f-179a-4ad7-916e-b77a13dca01d/ascreenshot_ded5970762d54528ae656421148116c4_text_export.jpeg)

### 步驟 3：查看團隊財務資訊 {#step-3-view-team-financial-information}

與已刪除金鑰類似，Deleted Teams 表格會顯示財務資訊：

- **刪除時的支出** - 團隊被刪除時累積的總支出
- **原始預算** - 為該團隊設定的預算上限

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-17/5b24871f-b57e-404d-8fbe-a4b27cb2a6a0/ascreenshot_3121fbafbd6b4abf90993ce6c03c608d_text_export.jpeg)

## 使用情境 {#use-cases}

此功能特別適用於：

- **財務稽核** - 追蹤已刪除實體的支出與預算
- **合規** - 保留由誰在何時刪除了什麼的記錄
- **成本分析** - 了解刪除前的支出模式
- **問責** - 識別執行刪除的管理員或使用者
- **歷史記錄** - 即使在實體刪除後仍保留財務資料

## 相關功能 {#related-features}

- [Audit Logs](./multiple_admins.md) - 查看所有實體變更的完整稽核記錄
- [UI Logs](./ui_logs.md) - 查看請求記錄與支出追蹤
