---
title: 效能警示
description: 從閘道記錄的每日使用情況中，偵測支出激增、流量激增、錯誤率上升與回應變慢。
---

<SinceVersion v="1.110.0" />

效能警示會標示閘道記錄的使用情況中的支出激增、流量激增、錯誤率上升與回應變慢。在 Admin UI 中開啟 **Alerts**，即可比較每日數值並開啟受影響的資源。

對於連接了 PostgreSQL 資料庫的閘道，監控預設開啟。請保持每日使用情況記錄啟用，並保留至少八天的彙總資料。您不需要建立規則或設定通知目的地。

## 檢視警示 {#review-an-alert}

1. 在側邊欄開啟 **Alerts**。選取 **Open**、**Resolved** 或 **Dismissed**，並使用類型篩選器縮小清單。
2. 選取一項發現。詳細頁面會顯示觀察到的數值、其基線，以及每日圖表。
3. 依照 **View key activity**、**View team activity** 或 **View user activity**，在警示的日期範圍內檢查該資源。模型警示會連結到模型路由。
4. 處理該發現後選取 **Mark resolved**，或在不需要採取行動時選取 **Dismiss**。兩者都會保留警示。選取 **Reopen** 可將其回到 Open。

<figure style={{margin: '24px 0'}}>
  <a href="/img/alerts/spend-detail.webp">
    <img src="/img/alerts/spend-detail.webp" alt="一項支出警示顯示 $1,200 對比 $200 的每日基線、每日圖表、觀察與偵測日期，以及 Research 擁有者的 View user activity 連結。" width="2882" height="1335" loading="lazy" style={{display: 'block', width: '100%', height: 'auto'}} />
  </a>
  <figcaption style={{fontSize: '0.85em', marginTop: '8px'}}>支出增加到基線的六倍。示範資料。<a href="/img/alerts/spend-detail.webp">檢視完整尺寸</a></figcaption>
</figure>

通知鈴鐺最多顯示五個開啟中的警示，包括模型淘汰。選取 **See all** 查看完整收件匣。效能警示不會傳送電子郵件或 webhook 通知。

## LiteLLM 檢查的內容 {#what-litellm-checks}

LiteLLM 會將最後一個完整的 UTC 日與其之前的七天進行比較。評估日會在 UTC 01:00 前進，以便留一小時讓帳務資料送達。檢查涵蓋有記錄使用情況的閘道、模型群組、團隊、使用者與 Virtual Keys。

支出與流量基線是七天總和除以七。回應時間與錯誤率使用基線期間依請求加權的平均值。

| 發現 | 條件 |
| --- | --- |
| 支出激增 | 至少為每日基線的 3 倍，且至少多出 $50。 |
| 流量激增 | 至少為每日基線的 10 倍，且至少多出 1,000 個請求。 |
| 回應變慢 | 至少為基線平均回應時間的 3 倍，且至少慢 500 ms。 |
| 錯誤率上升 | 至少為基線錯誤率的 3 倍，且至少增加 2 個百分點。 |

回應時間指的是記錄的總回應時間，不是第一個 token 的時間。支出與回應時間檢查需要基線大於零。

支出激增、流量激增與錯誤率發現需要在至少四個基線日有流量。回應時間發現需要在至少四個基線日有計時請求，且在評估日至少有 100 個計時請求。錯誤率發現需要在評估日至少有 500 個請求。

未使用 Virtual Key 驗證的請求，當使用情況記錄了這些身分時，可以貢獻到閘道、模型、使用者或團隊檢查。

## 五個免費警示，之後需要 Enterprise {#five-free-alerts-then-enterprise}

每個閘道資料庫都有終身五個已儲存效能警示的額度。金鑰的警示與其團隊的警示分開計算。對相同類型、資源與日期重新檢查不會消耗另一個警示。

在第五個警示之後，LiteLLM 會停止讀取使用情況以進行效能偵測。您仍然可以讀取與管理已儲存的警示。解決或忽略它們不會重設額度。模型淘汰不計入此額度。

使用 [Enterprise 授權](/docs/enterprise) 時，效能監控會在沒有五個警示限制的情況下繼續。只要監控已啟用，加入授權後便會恢復。

## 關閉監控 {#turn-monitoring-off}

在 **Alerts** 頂部關閉 **Performance monitoring**。此設定適用於共享您資料庫的 workers 與 pods。已儲存的警示仍可使用。

若要透過設定停用，請將以下內容加入您現有的 `general_settings` 並重新啟動 proxy。

```yaml title="config.yaml"
general_settings:
  performance_alerts_enabled: false
```

使用此設定時，UI 與 API 無法重新開啟監控。移除覆寫值或將其設為 `true`，重新啟動，然後檢查 **Performance monitoring** 開關。您也可以[透過 API 讀取或變更監控](./api.md#monitoring)。

## 時機與涵蓋範圍 {#timing-and-coverage}

LiteLLM 大約每五分鐘啟動一次有界限的背景執行，並從其儲存的位置恢復。每頁最多涵蓋 25 個資源。一頁可以讀取許多彙總列，取決於每個資源的使用情況。LiteLLM 使用資料庫查詢逾時與頁面之間的暫停來限制工作量。

偵測是盡力而為。在大型或忙碌的資料庫上，一次掃描可能會留下未檢查的資源。新的一天會開始新的比較，未完成的範圍會在繞回之前從先前的位置恢復。這些是每日發現，不是即時的中斷警示。

警示描述的是記錄的使用情況。遺漏或延遲的帳務可能影響比較。

已儲存的比較維持固定。圖表讀取目前的使用情況，若帳務稍後送達可能會變化。遺漏的圖表資料會顯示為間隙。解決警示會記錄您的決定；它不會改變流量，也不會阻止之後某一天的新警示。

## 若沒有警示出現 {#if-no-alerts-appear}

確認 **Performance monitoring** 已開啟，且免費額度尚未耗盡。確認 **Usage** 包含所需的天數與請求數。新的閘道需要足夠的基線歷史，大多數檢查才能產生發現。

若偵測停止推進，請檢查 proxy 記錄中的 `Performance alerts` 訊息。它們會回報已完成的掃描、略過的資源、提早退出，或待處理的金鑰索引。空的收件匣本身並不能證明 LiteLLM 檢查了每個資源。

使用 [Alerts API](./api.md) 列出發現、變更其狀態，或讀取監控設定。
