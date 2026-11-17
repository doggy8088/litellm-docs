---
sidebar_label: "共用狀態"
description: "LiteLLM proxy worker 透過 Redis 為路由共用什麼、什麼留在每個處理程序中，以及每份狀態的新鮮程度。"
---

# proxy worker 之間的共用狀態 {#shared-state-across-proxy-workers}

{/* keep-version-note */}

正式環境的 proxy 會執行許多 worker，每個都有自己由相同設定建立的 Router。它們透過 Redis 在路由上
達成一致。本頁說明共用了什麼、沒共用什麼，以及每份狀態保證有多新鮮。

![三個 proxy worker，各有一個 Router 與自己的記憶體 DualCache 層級，全都與一個共用的 Redis 同步，
該 Redis 保存冷卻、失敗計數器、用量與策略狀態](../img/shared-state-1.svg)

## 路由快取 {#the-routing-cache}

router 將其路由狀態保存在一個 `DualCache`（`litellm/caching/dual_cache.py`）中，它由 `redis_*`
引數建立。這個快取有兩個層級，一個記憶體層級與一個 Redis 層級。寫入會進到兩者。讀取先檢查記憶體，
只有未命中時才去 Redis，然後將 Redis 的值複製進記憶體。沒有 Redis 設定時，router 只以記憶體層級
執行。這對單一處理程序來說沒問題，但它意味著每個處理程序都依自己的檢視來路由。

這個快取由 `router.health().store` 回傳。

先讀記憶體讓 Redis 不在熱路徑上，代價是新鮮度。另一個處理程序寫入的值，只有在本地副本到期之後才會被
看到，或在本地從未有過副本時才會被看到。router 對每一種狀態都以不同方式處理這一點。

| 狀態 | 鍵 | 層級 | 其他處理程序多快能看到它 |
| --- | --- | --- | --- |
| 冷卻 | `deployment:{id}:cooldown` | 記憶體 + Redis | 本地副本至少每 `DEFAULT_COOLDOWN_REDIS_READ_INTERVAL_SECONDS`（1 秒）對照 Redis 重新檢查一次 |
| Allowed fails 計數器 | `deployment:{id}:allowed_fails` | 記憶體 + Redis，在 Redis 中遞增 | 在遞增當下即為全機群，Redis 失敗時退回本地計數 |
| 錯誤率規則的成功 / 失敗計數 | `{id}:successes`、`{id}:fails` | 僅記憶體，60 秒 TTL | 永遠不會，每個處理程序依自己的流量判斷 |
| 每分鐘用量 | `global_router:{id}:{model}:tpm:{HH-MM}`、`...:rpm:...` | 在每個回應之後於 Redis 中遞增 | 在 Redis 中立即。worker 的副本在它下一次寫入時或下一分鐘跟上 |
| 策略狀態（usage-based v2、latency、least-busy） | 策略鍵 | 記憶體，每 `DEFAULT_REDIS_SYNC_INTERVAL`（1 秒）或寫入時推送至 Redis | 落後約一秒 |

見[路由狀態與快取鍵](../api_reference/state_and_cache_keys.md)，取得帶有 TTL 的完整清單。

## 這在實務上意味著什麼 {#what-this-means-in-practice}

冷卻是共用的。當一個 worker 讓某個部署冷卻時，其他 worker 會在大約一秒內停止挑選它。

透過 `rpm` 與 `tpm` 的速率限制是軟性的。處理程序不會在呼叫前保留容量。它們讀取在回應之後遞增的
計數器，因此一波突發流量可以超出部署的限制，超出量大約是機群在一個同步間隔內送出的量。proxy 自己針對
金鑰與團隊的速率限制器是一個獨立的系統，它使用原子的 Lua 指令碼，而 router 不使用它。

預設的錯誤率冷卻依每個處理程序決定。在各處都失敗一半流量的部署，會被每個處理程序獨立地冷卻，而產生的
冷卻鍵是共用的。在設定了 `allowed_fails` 或 `allowed_fails_policy` 時，計數器位於 Redis 中，
門檻為全機群。

![一個 worker 在 429 之後於 Redis 中設定部署冷卻、第二個 worker 讀取它並同樣篩選掉該部署，以及該鍵在
兩個層級上到期的順序](../img/shared-state-2.svg)

## Redis 中斷 {#redis-outages}

Redis 失敗時 router 會繼續路由。快取會記錄失敗並從記憶體提供服務，而 `allowed_fails` 遞增會退回
處理程序自己的計數。在 Redis 回來之前，路由品質會降為每個處理程序各自所知的程度。
