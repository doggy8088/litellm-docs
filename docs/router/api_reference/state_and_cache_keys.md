---
sidebar_label: "狀態與快取鍵"
description: "LiteLLM Router 儲存的路由狀態、其快取鍵，以及每個鍵的存活時間。"
---

# 路由狀態與快取鍵 {#routing-state-and-cache-keys}

{/* keep-version-note */}

router 在請求之間記住的一切、它們存放的位置，以及它們存活多久。這些狀態存放在 router 的
路由快取中，也就是一個 `DualCache`。每個 worker 都使用相同的鍵、編碼與 TTL，因此整個機群
共用一個 Redis。在下方的鍵中，`{id}` 是部署的 `model_info.id`，`{minute}` 是以 `HH-MM`
表示的 UTC 時間。

![設定 Redis 時透過 Redis 共用的路由快取鍵，以及僅保存在此處理程序中的狀態](../img/state-and-cache-keys-1.svg)

| 鍵 | 寫入者 | 讀取者 | 值 | TTL | 層級 |
| --- | --- | --- | --- | --- | --- |
| `deployment:{id}:cooldown` | `Health::add_cooldown` | 冷卻篩選器、`health().cooldowns` | `{exception_received, status_code, timestamp, cooldown_time}` | 冷卻時間 | 記憶體 + Redis，記憶體每 1 秒對照 Redis 重新檢查 |
| `deployment:{id}:allowed_fails` | `Health::record_failure` | 同上 | 失敗計數 | 冷卻時間 | 記憶體 + Redis |
| `deployment:{id}:allowed_fails:{suffix}` | 同上，搭配部署層級的原則 | 同上 | 每種錯誤類型的失敗計數 | 冷卻時間 | 記憶體 + Redis |
| `{id}:successes`、`{id}:fails` | `Health::record_success`、`Health::record_failure` | 預設的錯誤率冷卻規則、`health().failures_this_minute()` | 計數 | 60 秒 | 僅記憶體 |
| `global_router:{id}:{model}:tpm:{minute}`、`:rpm:` | `Health::record_success`，在每個回應之後 | 呼叫前速率限制檢查、`health().usage()` | 計數 | 60 秒 | Redis 遞增、記憶體 |
| `global_router:{id}:{model}:itpm:{minute}`、`:otpm:` | 輸入與輸出 token 速率限制檢查 | 同一項檢查 | 輸入與輸出 token 計數 | 60 秒 | 記憶體 + Redis |
| `{id}:{model}:tpm:{minute}`、`{id}:{model}:rpm:{minute}` | `usage-based-routing-v2` 策略 | 同上 | 計數 | 60 秒 | 記憶體，每 1 秒推送至 Redis |
| `{model_group}_map` | `latency-based-routing` 策略 | 同上 | 每個部署的延遲與 ttft 樣本 | `routing_strategy_args.ttl`，1 小時 | 記憶體 + Redis |
| `{model_group}_request_count:{id}` | `least-busy` 策略 | 同上 | 處理中的請求 | 1 小時 | 記憶體 + Redis |

策略與外掛各自保管自己的鍵（上方的策略計數器、預算限制器、prompt 快取 pin、部署與工作階段親和性）。

## 處理程序本地狀態 {#process-local-state}

有些狀態是每個 router 各自擁有的，永遠不會共用。

- 登錄表，連同其索引與 `registry().version`，以及設定檢視，各自以一個快照保存，由 `apply()` 交換
- 提供者用戶端，依每個部署快取 `client_ttl` 秒
- `health().health_checks` 中的背景健康檢查結果

這些狀態在每個處理程序中都由設定重建，這就是為什麼部署 id 必須在各處理程序之間保持穩定。
