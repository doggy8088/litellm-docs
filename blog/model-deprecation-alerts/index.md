---
slug: model-deprecation-alerts
title: "模型棄用管理"
date: 2026-11-05T09:00:00+08:00
authors:
  - ishaan
description: "在 LiteLLM AI Gateway 中管理模型棄用。找出受影響的金鑰、追蹤遷移流量，並在提供者的期限之前通知擁有者。"
tags: [engineering, ai-gateway, observability]
hide_table_of_contents: true
custom_hero: true
image: /img/model-deprecation-alerts/hero.png
---

import DeprecationPage, {ProductScreenshot} from './DeprecationPage';

<DeprecationPage>

這篇 blog 文章說明如何使用 LiteLLM AI Gateway 進行模型生命週期管理。我們提供以下基礎元件，讓您更妥善地管理模型棄用。

我們從許多生產環境 gateway 使用者那裡聽到，模型棄用是個問題：對於生產使用情境，很難想出如何防止服務中斷。

這透過以下方式幫助防止中斷：

1. 模型棄用相關的警示。
2. 模型棄用相關的電子郵件。
3. 針對不同即將被棄用的模型的使用追蹤，讓您在遷移後驗證流量是否下降，並提供建議使用的模型。

## 模型棄用相關的警示 {#alerts-around-model-deprecations}

查看通知鈴鐺，找出需要關注的模型棄用。開啟 **Observability** 下的 **Alerts**，然後選擇 **Model deprecations**。您可以看到提供者、模型、其棄用日期、過去 30 天的請求數，以及 LiteLLM 上次看到其流量的時間。

開啟警示，調查跨團隊的遷移情況。您可以一邊與擁有者協調，一邊保持警示開啟，然後回到同一頁面查看進度。

<ProductScreenshot src="/img/model-deprecation-alerts/alerts-inbox.png" alt="LiteLLM 的 Model deprecations 收件匣，包含提供者標誌、期限、近期請求與建議的替代模型">
LiteLLM UI 中的 Model deprecations 收件匣。範例使用量；提供者期限與建議來自模型中繼資料。
</ProductScreenshot>

## 模型棄用相關的電子郵件 {#emails-around-model-deprecations}

從警示中，點擊 **Set up email reminders**，然後點擊 **Open Email Settings**。這會開啟 **Logging & Alerts → Email Alerts**。

如果您的 gateway 已經在傳送電子郵件，請保留其傳遞設定。否則，在 **Email Server Settings** 中輸入您電子郵件提供者的 SMTP 連線詳細資訊。將 **Gateway URL** 設為擁有者用來連到您的 gateway 的公開地址並儲存。輸入 **TEST_EMAIL_ADDRESS**，選擇 **Test Email Alerts**，並確認測試郵件送達。

在 **Email Notifications** 中，開啟 **Model Deprecations** 並選擇 **Save Changes**。此事件預設為關閉。

LiteLLM 排程兩次提醒：在提供者棄用日期的 **30 天前** 與 **1 天前**，以 UTC 檢查。它會使用過去 30 天的請求，選出受影響的金鑰擁有者與目前的團隊管理員。每位收件者會看到其金鑰與其管理的團隊的使用量。

電子郵件會指出棄用該模型的提供者，顯示目前與建議的模型以及提供者標誌，並給予擁有者遷移步驟。它包含建議來源、提供者通知，以及在 gateway 中檢視使用量的連結。

<ProductScreenshot src="/img/model-deprecation-alerts/email-reminder.png" alt="模型棄用電子郵件，指出 Google 為提供者，比較舊模型與建議模型，並列出遷移步驟">
附有範例使用量的 30 天郵件範本。擁有者可以看到什麼會改變、他們需要在何時行動，以及在哪裡檢視受影響的流量。
</ProductScreenshot>

請在提醒日期保持 gateway 執行。如果 gateway 在整個 UTC 日期都離線，排程器不會稍後補送錯過的提醒。

## 在遷移時追蹤使用量 {#track-usage-as-you-migrate}

點擊 **Review impact** 開啟該模型。**Daily requests** 圖表顯示該模型隨時間的請求量，每把金鑰有一個獨立的堆疊。比較長條總高度，檢查使用量是否在下降，然後檢視彩色堆疊，找出仍在傳送流量的金鑰。

在圖表下方，檢視與該模型一起使用的受影響金鑰、團隊、擁有者與標籤。當您需要協調遷移的一部分時，依團隊篩選。使用金鑰與擁有者清單，向負責每個生產使用情境的人跟進。

<ProductScreenshot src="/img/model-deprecation-alerts/model-traffic-five-use-cases.png" alt="模型棄用詳情，每日請求依金鑰堆疊並降至零，跨兩個團隊的五把使用情境金鑰">
實際的 LiteLLM UI，附有一個植入的遷移範例：跨兩個團隊的五個使用情境。隨著範例金鑰遷離該模型，每日請求下降。最後幾個完整日期顯示零請求；目前日期是部分的。
</ProductScreenshot>

您不需要等到 30 天總計降至零。該總計包含歷史請求。請改為比較近期的每日長條，並檢查涵蓋您使用情境的期間。每週批次工作需要的驗證窗口比每分鐘傳送請求的服務更長。

在這個範例中，客戶支援、研究、文件搜尋、發票擷取與每週報告各有一把金鑰。當擁有者遷移一個使用情境時，它的顏色會從每日長條中消失。金鑰會保留在 30 天歷史中，讓您可以驗證改變了什麼。

## 建議模型 {#recommended-models}

警示會顯示要被取代的模型與 **Recommended new model**。LiteLLM 從其模型成本對照表，或從該部署設定的替代模型，讀取建議。UI 會指出是哪個來源提供的，並在有紀錄時連結到上游提供者的棄用通知。

使用提供者通知來檢查上游期限與遷移指南。成本對照表記錄了建議；它並不證明新模型符合您應用程式的品質、延遲或成本要求。在切換生產流量之前，請以每把受影響金鑰背後的工作負載測試替代模型。

您可以使用 **Model routing** 開啟相關的模型設定。如果是您的應用程式選擇模型，請更新該應用程式。在擁有者進行這些變更時，保持警示開啟。

## 將警示標記為已解決 {#mark-the-alert-resolved}

在擁有者切換其應用程式或路由後，回到 **Daily requests**。檢查舊模型的流量在受影響金鑰上是否降至零。在關閉之前，與不常執行工作的擁有者確認遷移。

當該工作完成時，點擊 **Mark resolved**。LiteLLM 會將警示移到 **Resolved**，讓您開啟的收件匣顯示仍需關注的遷移。對該模型的新請求會重新開啟警示。

<ProductScreenshot src="/img/model-deprecation-alerts/resolved-five-use-cases.png" alt="每日請求圖表降至零後，LiteLLM 模型遷移被標記為已解決">
同一個範例遷移在標記為已解決後的樣子。關閉警示記錄了團隊的決定；它不會變更模型路由。
</ProductScreenshot>

如需在跨生產團隊與使用情境中操作 LiteLLM 的協助，[與我們聯絡](https://www.litellm.ai/contact)。深入了解 [gateway 警示](/docs/proxy/alerting)、[電子郵件通知](/docs/proxy/email) 與[模型路由](/docs/routing)。

</DeprecationPage>

{/* truncate */}
