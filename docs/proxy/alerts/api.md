---
title: 效能警示 API
sidebar_label: API
description: 列出並檢視已儲存的效能警示、檢查其證據，並啟用或停用監控。
---

<SinceVersion v="1.110.0" />

使用閘道的基礎 URL，不含 `/v1`。將 `LITELLM_BASE_URL` 設定為該 URL，不含結尾斜線，並將 `LITELLM_API_KEY` 設定為現有的閘道管理員金鑰。讀取時可以使用唯讀管理員金鑰。閘道需要資料庫連線。

| 方法 | 路徑 | 用途 |
| --- | --- | --- |
| `GET` | `/alerts` | 列出已儲存的警示。 |
| `GET` | `/alerts/{id}` | 讀取一項警示及其使用歷史。 |
| `PATCH` | `/alerts/{id}` | 解決、忽略或重新開啟一項警示。 |
| `GET` | `/alerts/monitoring` | 讀取監控與額度設定。 |
| `PATCH` | `/alerts/monitoring` | 啟用或停用監控。 |

閘道管理員可以讀取與寫入。唯讀管理員可以讀取。其他角色會收到 `403`。這些端點公開的是整個閘道的發現，不是使用者自己的警示。

儀表板會合併效能警示與模型淘汰警示。它的淘汰摘要使用[模型淘汰 API](./model-deprecations.md#api)，因此單靠 `GET /alerts` 無法重現整個儀表板收件匣。

## 列出警示 {#list-alerts}

```bash
curl --get "$LITELLM_BASE_URL/alerts" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  --data-urlencode 'status=open' \
  --data-urlencode 'type=performance' \
  --data-urlencode 'limit=25'
```

| 查詢 | 預設值 | 值 |
| --- | --- | --- |
| `status` | `open` | `open`、`resolved`、`dismissed` |
| `type` | 無類型篩選 | `performance`、`spend`、`traffic`、`latency`、`reliability`、`model_deprecation` |
| `limit` | `25` | 1 到 100 的整數 |
| `cursor` | 第一頁 | 前一個回應的 `next_cursor` |

`performance` 包括支出激增（`spend`）、流量激增（`traffic`）、回應變慢（`latency`）與錯誤率上升（`reliability`）。`model_deprecation` 只符合該類型的已保存記錄；它不會載入儀表板的即時淘汰摘要。

使用合成資料的回應範例。支出以 USD 計，此團隊從每日基線 $200 上升到 $1,200。

```json
{
  "data": [
    {
      "id": "42",
      "type": "spend",
      "resource_type": "team",
      "resource_id": "example-team",
      "window_start": "2026-11-09T00:00:00Z",
      "window_end": "2026-11-10T00:00:00Z",
      "evidence": {
        "value": 1200,
        "baseline": 200,
        "unit": "usd",
        "sample_size": 24000
      },
      "status": "open",
      "created_at": "2026-11-10T01:05:00Z",
      "updated_at": "2026-11-10T01:05:00Z",
      "updated_by": null,
      "resource_name": "Research team",
      "history": [
        {"date": "2026-11-02", "value": 160},
        {"date": "2026-11-03", "value": 180},
        {"date": "2026-11-04", "value": 220},
        {"date": "2026-11-05", "value": 200},
        {"date": "2026-11-06", "value": 240},
        {"date": "2026-11-07", "value": 180},
        {"date": "2026-11-08", "value": 220},
        {"date": "2026-11-09", "value": 1200}
      ]
    }
  ],
  "next_cursor": null
}
```

結果以最新者優先送達。若 `next_cursor` 不為 null，請以 `--data-urlencode "cursor=$NEXT_CURSOR"` 重複相同的請求，並將 `NEXT_CURSOR` 設定為該回傳值。保持狀態與類型篩選不變。當 `next_cursor` 為 `null` 時停止。

## 讀取警示 {#read-an-alert}

將 `ALERT_ID` 設定為清單回傳的 `id`。請將 ID 視為字串。

```bash
curl "$LITELLM_BASE_URL/alerts/$ALERT_ID" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

回應包含一個警示物件，欄位與 `data` 中的項目相同。

| 欄位 | 意義 |
| --- | --- |
| `type` | 效能發現的 `spend`、`traffic`、`latency` 或 `reliability`。 |
| `resource_type` | `gateway`、`model`、`team`、`user` 或 `key`。 |
| `resource_id` | 資源識別碼。閘道警示使用 `gateway`。模型警示使用模型群組名稱。金鑰警示使用金鑰雜湊，絕不是密鑰。 |
| `window_start`、`window_end` | 觀察到的 UTC 日，起始包含、結束不包含。 |
| `evidence` | 已儲存的觀察值、基線、單位與請求樣本數。 |
| `created_at` | 首次偵測時間。 |
| `updated_at`、`updated_by` | 最後狀態更新時間與執行者。在狀態變更前，`updated_by` 為 `null`。 |
| `resource_name` | 目前的顯示名稱，若無法取得則為 `null`。 |
| `history` | 最多八個相同單位的每日數值，若無法取得則為 `null`。遺漏的日期是間隙。 |

單位有 `usd`、`requests`、`milliseconds` 與 `ratio`。錯誤率 `0.05` 表示 5%。對於回應時間警示，`sample_size` 計算的是計時請求。其他效能警示計算的是記錄的請求。

已儲存的 `evidence` 維持固定。`history` 反映目前的使用情況，包括延遲的帳務。遺漏的圖表不會移除已儲存的發現。

## 變更狀態 {#change-status}

```bash
curl -X PATCH "$LITELLM_BASE_URL/alerts/$ALERT_ID" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"status":"resolved"}'
```

使用 `dismissed` 忽略，或使用 `open` 重新開啟。回應會回傳已儲存的警示及其新的 `status`、`updated_at` 與 `updated_by`。它會省略 `resource_name` 與 `history`；若需要它們，請再次取得詳細資訊。

狀態變更不會重設免費額度，也不會抑制之後日子的發現。沒有公開的建立或刪除端點。

## 監控 {#monitoring}

```bash
curl "$LITELLM_BASE_URL/alerts/monitoring" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

免費額度耗盡後的範例。

```json
{
  "enabled": true,
  "alerts_used": 5,
  "alert_limit": 5,
  "disabled_by_config": false
}
```

`enabled` 是監控設定。只有當它為 `true` 且額度仍可用時，偵測才會執行。Enterprise 的 `alert_limit` 為 `null`。`alerts_used` 是終身免費額度計數器，上限為五，不是所有 Enterprise 警示的計數。

使用管理員金鑰關閉監控。

```bash
curl -X PATCH "$LITELLM_BASE_URL/alerts/monitoring" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"enabled":false}'
```

回應具有相同的監控欄位。傳送 `{"enabled":true}` 可重新開啟。此設定適用於共享資料庫的所有 workers，並保留已儲存的警示與額度使用量。

若 `disabled_by_config` 為 `true`，請先從 proxy 設定中移除 `general_settings.performance_alerts_enabled: false` 並重新啟動，再透過此 API 啟用監控。

## 錯誤 {#errors}

| 狀態 | 意義 |
| --- | --- |
| `401` | 缺少或無效的身分驗證。 |
| `403` | 呼叫者缺少所需的閘道管理員角色。 |
| `404` | 沒有已儲存的警示具有此 ID。 |
| `409` | 設定阻止啟用監控。 |
| `422` | 無效的 ID、篩選器、狀態、limit 或請求主體。 |
| `503` | 閘道沒有用於警示的資料庫連線。 |
