---
title: Redis 所需條件
description: 當 LiteLLM proxy 在沒有 Redis 的情況下執行時，哪些功能無法運作，或無法正確運作。
---

# 需要 Redis {#what-needs-redis}

強烈建議任何 LiteLLM proxy 部署都使用 Redis，只要執行超過一個 worker process 就是如此，而大多數部署都是這樣：單一容器中 `--num_workers` 大於 1 就已經算是，多於一個 replica 的任何 Kubernetes 部署也一樣。

proxy 強制執行的大多數功能（速率限制、預算、冷卻時間、快取命中、設定變更）都透過 state 進行協調。使用 Redis 時，該 state 會被共享，因此每個 worker 都會看到相同的計數器與相同的失效。若沒有 Redis，每個 worker 都會在記憶體中保留自己的副本，因此每分鐘 100 個請求的限制在 4 個 worker 上實際上會放行 400 個；已撤銷的 key 在未處理該撤銷的 worker 上仍然可用；而快取命中只會落在當時剛好儲存回應的那個 worker 上。

當未設定 Redis 時，Admin UI 會顯示橫幅。如果您刻意執行單一 worker，請設定 `LITELLM_DISABLE_NO_REDIS_WARNING=true` 以隱藏它。

:::warning

沒有 Redis 的多 pod 部署目前處於 beta，且下方清單並不完整。它涵蓋了我們所知在沒有 Redis 的情況下於各 pod 之間無法完整運作，或完全無法運作的最佳已知功能；在該設定下，其他功能也可能異常。多 pod 部署的 GA 作法是搭配 Redis 執行。

:::

## 設定 Redis {#configure-redis}

如需為 Redis 進行佈建，並將 proxy 端到端連接至 Redis，請參閱 [設定 Redis](/docs/proxy/caching_redis)。簡短版本如下：

```yaml
router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD

litellm_settings:
  cache: True
  cache_params:
    type: redis
    host: os.environ/REDIS_HOST
    port: os.environ/REDIS_PORT
    password: os.environ/REDIS_PASSWORD
```

在環境中設定 `REDIS_HOST` 和 `REDIS_PORT` 本身還不夠：proxy 只會在設定指向 Redis 時才會讀取它們，如上所述。`router_settings` 區塊涵蓋 router state（冷卻時間、基於用量與延遲的 routing），而快取區塊則涵蓋回應快取以及所有由 proxy 全域協調的事項（速率限制、預算、快取失效、pod lock）。兩者都要設定。若為叢集與 sentinel 部署，或要透過 `general_settings.coordination_redis` 將協調指向與回應快取不同的 Redis，請參閱 [Redis 與 Valkey](./caching_redis.md)。

## 沒有 Redis 會壞掉什麼 {#what-breaks-without-redis}

跨 pod 降級或無法使用的最知名功能：

| 功能 | 沒有 Redis 時 |
| --- | --- |
| key、team、user 與 end-user 速率限制（tpm、rpm、max parallel requests） | 依每個 worker 計算，因此實際限制會乘上 worker 數量。 |
| [動態速率限制](./dynamic_rate_limit.md) 與 [速率限制層級](./rate_limit_tiers.md) | 同樣是按 worker 分開；某一層級的容量分配會在每個 worker 上獨立重新計算。 |
| key、team 與 user 預算 | 花費會依每個 worker 預留與計算，因此不同 worker 上的並行請求可能在資料庫跟上之前就超過硬性預算。 |
| [提供者預算 routing](./provider_budget_routing.md) 與 [tag 預算](./tag_budgets.md) | 以每個 worker 的花費視窗計算，因此提供者或 tag 的花費可能大約超出 worker 數量倍的預算。 |
| `usage-based-routing-v2` 與 `latency-based-routing` | routing 決策只會使用該 worker 看到的流量，因此負載平衡會失衡，而考量 TPM/RPM 的放置效果會下降。 |
| 部署冷卻時間 | 某個 worker 上因失敗而進入冷卻的部署，仍會在其他 worker 上維持在輪替中。 |
| [回應快取](./caching.md) | 快取項目只會留在寫入它們的 worker 本機上，因此命中率會大約依 worker 數量下降。語意快取則完全需要 Redis。 |
| 虛擬 key 與 team 快取失效 | 只有在本機快取項目過期時，key 刪除、預算編輯與 team 成員變更才會傳播到其他 worker。 |
| 儲存在資料庫中的設定變更（在 UI 中新增、刪除或編輯模型，以及設定變更） | 其他 worker 會在下一次定期重新載入時才取得這些變更，而不是立即取得。 |
| 用於支出寫入的 [Redis 交易緩衝區](./prod.md#redis-transaction-buffer) | 不可用。每個 worker 都會直接將支出更新寫入資料庫，而這正是該緩衝區在高流量下要避免的失敗模式。 |
| 排程工作（預算重設、支出記錄清理、key 輪替、過期 session 清理、資料庫支出 flush） | 選出單一執行者的 pod lock 需要 Redis，因此每個 worker 都會執行工作，並在相同的資料列上互相競爭。 |
| [共享健康檢查](./shared_health_check.md) | 每個 worker 都會針對每個部署執行自己的背景健康檢查，導致提供者健康流量倍增。 |
| [請求優先順序](../scheduler.md) | priority queue 是每個 worker 各自擁有，因此排序只會在落到同一個 worker 的請求之間成立。 |
| SSO 與來自 CLI 的 `litellm login` | 當瀏覽器重新導向落到與啟動登入流程的 worker 不同的 worker 上時，登入流程可能失敗。 |
| [MCP](../mcp_oauth.md) 外送 OAuth 憑證 | token 會依每個 worker 快取，因此每個 worker 都會獨立重新整理；會在使用時輪替 refresh token 的提供者可能會使其他 worker 失效。 |
| 背景回應與輪詢 | 被輪詢的回應只可在產生它的 worker 上讀取。 |

## 單一 worker 部署 {#single-worker-deployments}

如果您確實只執行一個 worker process 與一個 replica，上述情況都不適用，因為在那種情況下本機記憶體就是共享 state。該設定會放棄水平擴充，而且任何重新啟動都會清除所有快取 state，因此應將其視為開發或低流量設定，而非 production 設定。
