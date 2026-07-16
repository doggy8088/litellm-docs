# 預算重設時間與時區 {#budget-reset-times-and-timezones}

LiteLLM 支援可預測的預算重設時間，可與自然的日曆邊界對齊。

## 預算重設運作方式 {#how-budget-resets-work}

所有預算都會在設定的時區午夜（00:00:00）重設，針對常見期間有特殊處理：

| 期間 | 重設行為 |
| --- | --- |
| 每日（24h/1d） | 每天午夜重設 |
| 每週（7d） | 每週一午夜重設 |
| 每月（30d） | 每月 1 日午夜重設 |

## 設定時區 {#configuring-the-timezone}

請在設定檔中指定所有預算重設所使用的時區：

```yaml
litellm_settings:
  max_budget: 100 # (float) sets max budget as $100 USD
  budget_duration: 30d # (number)(s/m/h/d)
  timezone: "US/Eastern" # Any valid timezone string
```

這可確保所有預算重設都會在您指定的時區午夜發生，而不是在 UTC。若未指定時區，預設會使用 UTC。

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
