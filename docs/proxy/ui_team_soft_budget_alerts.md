import Image from '@theme/IdealImage';

# 團隊軟性預算警示 {#team-soft-budget-alerts}

:::info

✨ 這是 Enterprise 功能。電子郵件預算警示需要企業授權。

[Enterprise 定價](https://www.litellm.ai/#pricing)

[取得免費 7 天試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

為團隊設定軟性預算，當支出超過門檻時接收電子郵件警示——不會阻擋任何請求。

## 總覽 {#overview}

**軟性預算**是一個支出門檻，當超出時會觸發電子郵件通知，但**不會阻擋請求**。這與硬性預算（`max_budget`）不同，硬性預算會在達到限制後拒絕請求。

<Image img={require('../../img/ui_team_soft_budget_alerts.png')} />

團隊軟性預算警示可讓您：

- **及早收到通知** — 當團隊支出超過軟性預算門檻時接收電子郵件警示
- **持續讓請求流動** — 與硬性預算不同，軟性預算永遠不會阻擋 API 呼叫
- **鎖定特定收件者** — 將警示傳送到特定電子郵件地址（例如團隊主管、財務），不只是團隊成員
- **不依賴全域警示** — 團隊軟性預算警示會透過電子郵件獨立傳送，不受 Slack 或其他全域警示設定影響

:::warning 需要電子郵件整合
團隊軟性預算警示會透過電子郵件傳送。您必須在您的 proxy 上設定已啟用的電子郵件整合（SendGrid、Resend 或 SMTP），才能傳遞警示。請參閱 [電子郵件通知](./email.md) 取得設定說明。
:::

:::info 自動啟用
一旦您設定了軟性預算，且團隊至少有一個警示用電子郵件，團隊軟性預算警示就會**自動啟用**。不需要額外的 proxy 設定或重新啟動——系統會在每次請求時檢查警示。
:::

## 運作方式 {#how-it-works}

對於每一個使用屬於某個團隊之金鑰所發出的 API 請求，proxy 會檢查：

1. 團隊是否已設定 `soft_budget`？
2. 團隊目前的 `spend` 是否 >= `soft_budget`？
3. `soft_budget_alerting_emails` 中是否有設定任何電子郵件？

若三個條件皆符合，系統就會將電子郵件警示傳送給已設定的收件者。警示會進行**去重**，因此同一則警示在 24 小時內只會傳送一次。

## 如何設定團隊軟性預算警示 {#how-to-set-up-team-soft-budget-alerts}

### 1. 前往 Admin UI {#1-navigate-to-the-admin-ui}

前往 Admin UI（例如 `http://localhost:4000/ui` 或您的 `PROXY_BASE_URL/ui`）。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/f06d75ad-25ef-4ee8-90c3-9604f8e46a1c/ascreenshot_1a6defaed1494d6da0001459511ecfd5_text_export.jpeg)

### 2. 前往 Teams {#2-go-to-teams}

在側邊欄點擊 **Teams**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/f06d75ad-25ef-4ee8-90c3-9604f8e46a1c/ascreenshot_2d258fa280f6463b966bf7a05bb102d5_text_export.jpeg)

### 3. 選擇一個團隊 {#3-select-a-team}

點擊您要設定軟性預算警示的團隊。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/490f09fb-6bf5-45a8-a384-676889f34c88/ascreenshot_15cceb22abe64df0bf7d7c742ecb5b2f_text_export.jpeg)

### 4. 開啟團隊 Settings {#4-open-team-settings}

點擊 **Settings** 分頁以查看團隊設定。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/28dd1bc5-7d07-462f-b277-33f885bdc07e/ascreenshot_12f2b762b5d24686801d93ad5b067e06_text_export.jpeg)

### 5. 編輯 Settings {#5-edit-settings}

點擊 **Edit Settings** 以修改團隊的預算設定。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/30a483ea-7e01-4fdc-ac5f-a5572388d138/ascreenshot_0915eadd9e754a798489853b82de3cb5_text_export.jpeg)

### 6. 設定 Soft Budget {#6-set-the-soft-budget}

點擊 **Soft Budget (USD)** 欄位並輸入您想要的門檻。例如，測試時可輸入 `0.01`，或在正式環境中輸入較高的值，例如 `500`。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/8b306d80-4943-4ad0-a51a-94b5ebdd6680/ascreenshot_5bb6e65c6428473fac2607f6a7f4b98a_text_export.jpeg)

### 7. 新增警示電子郵件 {#7-add-alerting-emails}

點擊 **Soft Budget Alerting Emails** 欄位，並輸入一個或多個以逗號分隔、應接收警示的電子郵件地址。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/a97c6efa-cc93-45d7-979e-d2a533f423b9/ascreenshot_2d8223ce8e934aa1bfadfb2f78aee5fc_text_export.jpeg)

### 8. 儲存變更 {#8-save-changes}

點擊 **Save Changes**。軟性預算警示現在已啟用——不需要重新啟動 proxy。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/865ba6f1-3fc6-4c19-8e08-433561d6c3f7/ascreenshot_b2f0503ada3a479a83dc8b7d01c1f8da_text_export.jpeg)

### 9. 驗證：已收到電子郵件警示 {#9-verify-email-alert-received}

一旦團隊支出超過軟性預算，就會將電子郵件警示傳送給已設定的收件者。以下是警示電子郵件的範例：

<Image img={require('../../img/ui_team_soft_budget_email_example.png')} />

## 設定參考 {#settings-reference}

| 設定                            | 說明                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Soft Budget (USD)**           | 觸發電子郵件警示的支出門檻。當超過此限制時，請求**不會**被阻擋。                                                                                |
| **Soft Budget Alerting Emails** | 在超過軟性預算時接收警示的、以逗號分隔之電子郵件地址。傳送警示至少需要一個電子郵件地址。 |

:::tip 軟性預算與最大預算

- **Soft Budget**：建議性門檻——會傳送電子郵件警示，但**不會**阻擋請求。
- **Max Budget**：硬性上限——當預算超過時會阻擋請求。

您可以在同一個團隊上同時設定兩者，以取得早期警示（soft）與硬性停止（max）。
:::

## API 設定 {#api-configuration}

您也可以在建立或更新團隊時，透過 API 設定團隊軟性預算：

```bash
curl -X POST 'http://localhost:4000/team/update' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{
    "team_id": "your-team-id",
    "soft_budget": 500.00,
    "metadata": {
      "soft_budget_alerting_emails": ["lead@example.com", "finance@example.com"]
    }
  }'
```

## 相關文件 {#related-documentation}

- [電子郵件通知](./email.md) – 為 LiteLLM Proxy 設定電子郵件整合（Resend、SMTP）
- [警示](./alerting.md) – 設定 Slack 與其他警示管道
- [成本追蹤](./cost_tracking.md) – 追蹤並管理跨團隊、金鑰與使用者的支出
