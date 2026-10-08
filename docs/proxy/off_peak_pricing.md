# 離峰計價 {#off-peak-pricing}

有些提供者在固定時鐘時段內收費較低；例如 DeepSeek 在其尖峰時段之外會將費率減半。`off_peak_pricing` 放在模型的計價項目上，會讓 LiteLLM 的成本追蹤理解該排程：只要設定的時段開啟，支出就會以離峰費率計算，而非標準費率，因此追蹤到的支出會全天候與提供者的帳單一致。

## 每日時段 {#daily-windows}

`off_peak_pricing` 是一個模型計價鍵，與 [模型成本映射](./custom_model_cost_map) 中的 `input_cost_per_token` 屬於同類型的項目。請將它附加在部署上的 `model_info` 之下：

```yaml
model_list:
  - model_name: deepseek-chat
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY
    model_info:
      off_peak_pricing:
        hours_utc: "16:30-00:30"
        input_cost_per_token: 1.35e-7
        output_cost_per_token: 5.5e-7
        cache_read_input_token_cost: 3.5e-8
```

`hours_utc` 是 UTC 中的一個 `"HH:MM-HH:MM"` 時段，或是對於每天有多個時段的提供者來說，是這類時段的列表。這些時段會套用於每週的每一天。時段可以跨越午夜，如上所示；開始時間包含在內，結束時間不包含在內；開始時間等於結束時間的時段會涵蓋整天。此處的數值與時段僅供說明；請依您的提供者價目表中的實際排程與費率為準。

此排程的作用範圍僅限於設定它的部署。相同後端模型的其他部署會保有各自的計價，因此兩個部署可以有不同的排程，而未設定此區塊的部署一律會以其標準費率計費。

當 `model_info` 只包含 `off_peak_pricing` 區塊時，如上所示，時段外的標準費率會來自後端模型的內建成本映射項目。請在區塊旁設定 `input_cost_per_token` 與 `output_cost_per_token` 以覆寫它們。

## 平日限定時段 {#weekday-qualified-windows}

當提供者的排程會依星期幾而不同時，請使用 `windows`，這是一個規則列表，每個規則都會將 `hours_utc` 與其適用的平日配對。平日可以是 ISO 編號（1 = 星期一到 7 = 星期日）、英文名稱或縮寫。沒有 `weekdays` 的規則會套用於每天，而頂層任何平面的 `hours_utc` 也會與這些規則一起保持啟用；只要其中任何一個符合，該請求就會被視為離峰。

```yaml
model_info:
  off_peak_pricing:
    weekday_timezone: Asia/Shanghai
    windows:
      - hours_utc: ["10:00-01:00", "04:00-06:00"]
        weekdays: [mon, tue, wed, thu, fri]
      - hours_utc: "00:00-00:00"   # whole day
        weekdays: [sat, sun]
    input_cost_per_token: 1.35e-7
    output_cost_per_token: 5.5e-7
```

`weekday_timezone` 是此區塊可選的 IANA 時區名稱。時數一律使用 UTC；時區只會在檢查平日時，決定某個時刻屬於哪個日曆日期。當提供者是依其本地平日定義排程時，這一點很重要：UTC 的星期五 23:00 在 Asia/Shanghai 已經是星期六，因此使用上面的設定時，會符合週末規則。預設值為 UTC，而無法辨識的名稱會回退至 UTC。

## 費率如何套用 {#how-the-rates-apply}

離峰費率會取代原本會套用的費率，而不是折扣它。這也包括分級 `above_{N}k` 計價：只要時段開啟，平面的離峰費率就會對整個請求計費。此區塊支援 `input_cost_per_token`、`output_cost_per_token`、`output_cost_per_reasoning_token`、`cache_read_input_token_cost` 與 `cache_creation_input_token_cost`；其中任何未設定者都會回退至標準費率。當 `output_cost_per_reasoning_token` 未設定時，推理 token 的計費方式會與時段外相同：若模型有專屬的推理費率，則按該費率計費，否則按輸出費率計費，離峰期間亦同。1 小時的快取建立費率（`cache_creation_input_token_cost_above_1hr`）永遠不受影響。

請求會依其完成時間計價。一個以標準費率開始、並在某個時段內完成的請求，整體都會以離峰費率計費；而一個跨出時段的請求，整體都會以標準費率計費。

格式錯誤的時段與平日值永遠不會匹配，因此排程中的拼字錯誤只會以標準費率計費，而不會在錯誤的時間套用折扣。請透過 `/spend/logs` 或使用量儀表板，比較同一請求在時段內外的追蹤支出，以驗證新的排程。

`off_peak_pricing` 可在模型計價項目存在的任何位置使用：如上所示的部署 `model_info`、[自訂託管成本映射](./custom_model_cost_map#option-2-serve-your-own-cost-map) 中的項目，或 SDK 中的 `litellm.register_model`。它不是 [自訂計價覆寫](./custom_pricing)，因此將它設定在 `litellm_params` 中不會有任何效果。
