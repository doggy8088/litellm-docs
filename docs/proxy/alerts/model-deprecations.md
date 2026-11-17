---
title: 模型淘汰警示
description: 在 Admin UI 中找出仍有流量的即將淘汰模型、檢查受影響的金鑰，並追蹤您的遷移進度。
---

<SinceVersion v="1.110.0" />

模型淘汰警示會顯示已淘汰或將在 30 天內淘汰、且在過去 30 天內仍有記錄流量的已設定模型。開啟 **Alerts**，並在類型篩選器中選取 **Model deprecations**。

LiteLLM 會從其模型型錄以及您的部署的 `model_info.deprecation_date` 覆寫值讀取淘汰日期。沒有已知淘汰日期的模型無法產生淘汰警示。

## 檢視遷移 {#review-a-migration}

選取一項淘汰警示，即可查看淘汰日期與近期的請求歷史。若型錄或部署設定有指名替代模型，您可以先檢視該建議，再變更您的路由。

開啟 **View migration details** 以檢查受影響的金鑰及其使用情況。使用團隊篩選器找出擁有者，然後依照資源的 Activity 連結進行調查。LiteLLM 不會為您切換模型。

遷移後選取 **Mark resolved**，或在該發現不需要採取行動時選取 **Dismiss**。此決定會在閘道管理員之間共享。若 LiteLLM 記錄到該模型有更新的流量，該警示會回到 Open。這包括在您做決定的同一天內的更多請求。

唯讀管理員可以檢查警示與遷移詳細資訊，但不能變更其狀態。淘汰警示不消耗五個效能警示的額度。關閉 **Performance monitoring** 不會停用它們。

## 電子郵件提醒 {#email-reminders}

在 **Alerts** 上，選取 **Set up email reminders**，然後選取 **Open Email Settings**。加入您的 SMTP 設定與公開閘道 URL，並傳送一封測試電子郵件。在 **Email events** 下，開啟 **Model Deprecations** 並儲存。此選項預設為關閉。

受影響的金鑰擁有者與團隊管理員會在淘汰前 30 天與 1 天收到提醒，依據是他們記錄的使用情況。儀表板的淘汰摘要不需要設定電子郵件。

SMTP、Resend 與 SendGrid 設定請參閱[電子郵件通知](../email.md)。此設定適用於淘汰提醒，不適用於效能方面的發現。

## API {#api}

淘汰摘要有其專屬的端點。它不是來自 `GET /alerts`。

將 `LITELLM_BASE_URL` 設定為您的閘道基礎 URL，不含 `/v1` 或結尾斜線。將 `LITELLM_API_KEY` 設定為現有的閘道管理員金鑰。

```bash
curl --get "$LITELLM_BASE_URL/model/deprecations" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  --data-urlencode 'warn_within_days=30'
```

回應會將已設定的模型分組為 `deprecated`、`imminent` 與 `upcoming`。每個條目都包含模型名稱、淘汰日期、剩餘天數，以及已知時的替代模型。它也會回傳 `warn_within_days` 與 `checked_at`。

此端點列出的是淘汰排程。儀表板會將其縮小到近期有使用情況的模型，並套用每個模型已儲存的狀態。

| 方法 | 路徑 | 用途 |
| --- | --- | --- |
| `GET` | `/model/deprecations` | 讀取淘汰排程。 |
| `GET` | `/alerting/model-deprecations/state` | 讀取某個模型與淘汰日期的共享狀態。 |
| `PUT` | `/alerting/model-deprecations/state` | 儲存狀態以及做該決定時所觀察到的流量。 |
| `GET` | `/alerting/model-deprecations/tags` | 讀取一頁受影響金鑰的使用標籤。 |

狀態與標籤端點需要資料庫，以及閘道管理員或唯讀管理員角色。只有閘道管理員可以寫入。讀取狀態時，請以查詢參數提供 `model` 與 `deprecation_date`。寫入時，請將範例值換成您檢視過的模型與最新使用情況。

```bash
curl -X PUT "$LITELLM_BASE_URL/alerting/model-deprecations/state" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "example-provider/retiring-model",
  "deprecation_date": "2026-12-01",
  "status": "resolved",
  "last_seen_date": "2026-11-09",
  "last_seen_requests": 24000
}'
```

狀態有 `open`、`resolved` 與 `dismissed`。最後出現的欄位讓儀表板在發現更新的流量時重新開啟警示。儲存狀態不會變更模型的淘汰排程。
