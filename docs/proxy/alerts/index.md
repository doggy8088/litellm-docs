---
title: 警示
sidebar_label: 總覽
description: 檢視模型淘汰與閘道使用方式的變化，或設定電子郵件與 webhook 通知。
slug: /proxy/alerts
---

{/* keep-version-note */}

在 Admin UI 中開啟 **Alerts**，即可檢視模型淘汰與效能方面的發現。選取一項發現，即可查看其使用圖表與受影響的資源。使用 **Mark resolved** 或 **Dismiss** 記錄您的決定。之後可以重新開啟。

閘道管理員可以管理警示。唯讀管理員可以檢視警示。

<figure style={{margin: '24px 0'}}>
  <a href="/img/alerts/inbox.webp">
    <img src="/img/alerts/inbox.webp" alt="LiteLLM 閘道的 Alerts 頁面，已啟用效能監控，包含 Open、Resolved 與 Dismissed 分頁，以及模型淘汰、支出、錯誤與回應時間的發現。" width="3456" height="1924" loading="lazy" style={{display: 'block', width: '100%', height: 'auto'}} />
  </a>
  <figcaption style={{fontSize: '0.85em', marginTop: '8px'}}>使用示範資料與 Enterprise 授權的 Alerts 收件匣。<a href="/img/alerts/inbox.webp">檢視完整尺寸</a></figcaption>
</figure>

## 儀表板中的警示 {#alerts-in-the-dashboard}

| 警示 | 您會看到的內容 | 可用性 |
| --- | --- | --- |
| [模型淘汰](./model-deprecations.md) | 正在使用且已淘汰或將在 30 天內淘汰的模型，附遷移詳細資訊。 | 不消耗效能警示額度。 |
| [效能警示](./performance.md) | 與近期使用情況相比，支出激增、流量激增、錯誤率上升或回應變慢。 | 預設開啟。五個已儲存的警示免費，之後需要 Enterprise。 |

通知鈴鐺會在兩個類別中最多顯示五個開啟中的警示。選取一個即可開啟其詳細資訊，或選取 **See all** 開啟 Alerts 頁面。

<figure style={{maxWidth: '384px', margin: '24px auto'}}>
  <a href="/img/alerts/notifications.webp">
    <img src="/img/alerts/notifications.webp" alt="通知鈴鐺選單，包含五個開啟中的警示與 See all 連結。" width="772" height="1122" loading="lazy" style={{display: 'block', width: '100%', height: 'auto'}} />
  </a>
  <figcaption style={{fontSize: '0.85em', marginTop: '8px'}}>從通知鈴鐺開啟警示。示範資料。</figcaption>
</figure>

## 儀表板外的通知 {#notifications-outside-the-dashboard}

請求失敗、緩慢請求、預算事件與其他支援的事件，請使用 [Slack 與 webhooks](../alerting.md)。您也可以設定[電子郵件通知](../email.md)或 [PagerDuty](../pagerduty.md)。電子郵件也涵蓋[金鑰到期警示](../email.md#4-configure-key-expiry-alerts-optional)，會在金鑰到期前提醒金鑰擁有者。

效能方面的發現會出現在儀表板與 [Alerts API](./api.md) 中。它們不會傳送電子郵件、Slack 或 webhook 通知。**Performance monitoring** 開關僅控制效能偵測。您現有的通知設定與模型淘汰警示會繼續運作。
