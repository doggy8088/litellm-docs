# 預算重設時間與時區 {#budget-reset-times-and-timezones}

LiteLLM 支援可預測的預算重設時間，可與自然的日曆邊界對齊。

## 預算重設運作方式 {#how-budget-resets-work}

預設情況下，所有預算都會在已設定時區的午夜（00:00:00）重設，並針對常見期間進行特殊處理。重設發生的時刻可透過 `budget_reset_time` 設定（請參閱下方的[設定重設時刻](#configuring-the-reset-time-of-day)）；表格顯示預設的午夜行為。

| 期間 | 重設行為 |
| --- | --- |
| 每日（24h/1d） | 每天午夜重設 |
| 每週（7d） | 每週一午夜重設 |
| 每月（30d） | 每月 1 日午夜重設 |

日以下期間（例如 `1h`、`30m`、`10s`）會依目前時間向前順延其間隔，因此不適用一天中的特定時刻。

## 設定時區 {#configuring-the-timezone}

請在設定檔中指定所有預算重設所使用的時區：

```yaml
litellm_settings:
  max_budget: 100 # (float) sets max budget as $100 USD
  budget_duration: 30d # (number)(s/m/h/d)
  timezone: "US/Eastern" # Any valid timezone string
```

這可確保所有預算重設都會在您指定的時區午夜發生，而不是在 UTC。若未指定時區，預設會使用 UTC。

## 設定重設時刻 {#configuring-the-reset-time-of-day}

:::info

`budget_reset_time` 自下一個版本起可用（在 `v1.94.0` 之後）。

:::

預設情況下，日、週與月預算都會在午夜重設。請將 `budget_reset_time` 設定為選擇實際時鐘時間（在已設定的 `timezone` 中），使重設改為落在該時間，例如讓預算重新計算與您的營業日開始時間或上游提供者的計費邊界一致：

```yaml
litellm_settings:
  max_budget: 100 # (float) sets max budget as $100 USD
  budget_duration: 1d # (number)(s/m/h/d)
  timezone: "US/Eastern" # Any valid timezone string
  budget_reset_time: "09:00" # (string) "HH:MM" or "HH:MM:SS", 24-hour clock
```

使用上方設定時，日預算會在每天 US/Eastern 的 09:00 重設，週預算會在星期一 09:00 重設，而月預算會在每月 1 日 09:00 重設。此值接受 24 小時制的 `"HH:MM"` 或 `"HH:MM:SS"` 字串，且必須加上引號。若省略，重設會維持在午夜。格式錯誤的值會在啟動時使設定載入失敗，而不是悄悄回退到午夜，因此拼字錯誤會立即顯示，而不會靜默地改變預算重設時間。日以下期間會忽略 `budget_reset_time`，因為對它們而言一天中的特定時刻沒有意義。

## 支援的時區 {#supported-timezones}

支援任何有效的 [IANA 時區字串](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)（由 Python 的 `zoneinfo` 模組提供支援）。DST 轉換會自動處理。

**常見的時區值：**

| 時區 | 說明 |
| --- | --- |
| `UTC` | 世界協調時間 |
| `US/Eastern` | 東部時間 |
| `US/Pacific` | 太平洋時間 |
| `Europe/London` | 英國時間 |
| `Asia/Kolkata` | 印度標準時間（IST） |
| `Asia/Bangkok` | 中南半島時間（ICT） |
| `Asia/Tokyo` | 日本標準時間 |
| `Australia/Sydney` | 澳洲東部時間 |
