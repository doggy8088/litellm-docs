---
title: 為客戶請求加收附加費用
sidebar_label: 加收附加費用
description: 在每個為客戶發出的請求上加收一個百分比，並分別讀取計費支出、基本費用與附加費用。
---

# 為客戶請求加收附加費用 {#add-a-surcharge-to-customer-requests}

<SinceVersion v="1.112.0" />

附加費用是 LiteLLM 在每個為客戶組織發出的請求費用上加收的百分比。請用它向客戶收取平台營運成本，附加於模型提供者的收費之上。沒有客戶的請求不會加收附加費用，因此內部流量維持正常費用。

## 哪些請求會加收附加費用 {#which-requests-are-surcharged}

請求在為客戶組織發出時會加收附加費用，也就是攜帶 `x-litellm-customer-org-alias` 或 `x-litellm-customer-member-id`，且 LiteLLM 將其解析為某個組織時。如何傳送這些標頭，請見 [設定客戶預算與讀取用量](./track-customer-spend.md)。

## 設定附加費用 {#set-the-surcharge}

在 Admin UI 中開啟「成本追蹤」頁面，新增利潤，並將提供者選為「客戶請求」。您也可以在設定檔中以 `customer` 鍵設定。

```yaml
litellm_settings:
  cost_margin_config:
    customer: 0.02   # 2% on every request made for a customer
```

此值為 0 至 10 之間的小數，因此 `0.02` 即為 2%。此鍵不支援按請求收取固定金額。將它設為 `0` 或移除，即可停止加收附加費用。

附加費用會附加在任何 [提供者或全域利潤](../provider_margins.md) 之上。基本費用為 $1.00 的請求，加上 2% 客戶附加費用後，計費金額為 $1.02。

## 各應用程式的附加費用 {#surcharge-per-application}

應用程式可以有自己的附加費用，取代該應用程式客戶請求的全閘道附加費用。請見 [為應用程式設定專屬附加費用](./applications.md#give-an-application-its-own-surcharge)。

## 支出與預算如何計算附加費用 {#how-spend-and-budgets-count-it}

附加費用屬於支出的一部分。客戶組織、客戶團隊與客戶成員的支出都包含它，同一請求的金鑰、團隊與使用者支出也是如此。客戶預算按計費金額執行，因此 $50 預算會被 $50 的計費支出用完，而非 $50 的基本費用。

每個請求也會另外記錄附加費用。因此變更百分比後，過去請求的附加費用前成本仍保持精確。

## 讀取計費支出、基本費用與附加費用 {#read-billed-spend-base-cost-and-the-surcharge}

| 位置 | 計費金額 | 附加費用前成本 | 附加費用 |
|---|---|---|---|
| 回應標頭 | `x-litellm-response-cost` | `x-litellm-response-cost-original` | |
| 支出記錄，`metadata.cost_breakdown` | `total_cost` | | `customer_margin_amount`、`customer_margin_percent` |
| 客戶每日活動端點 | `total_spend` | | `total_customer_margin_spend` |
| 客戶用量頁面 | 支出 | 基本費用 | 附加費用 |

附加費用前成本即為計費金額減去附加費用。客戶用量頁面只在所選期間內有收取附加費用時，才會在「支出」下方顯示「基本費用」與「附加費用」。
