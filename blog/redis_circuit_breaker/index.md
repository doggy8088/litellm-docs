---
slug: redis-circuit-breaker
title: "讓 AI 閘道對 Redis 故障具備韌性"
date: 2026-04-11T09:00:00
authors:
  - ishaan
description: "LiteLLM 的正式環境 AI 閘道如何在大規模情況下處理 Redis 劣化而不發生連鎖故障 — 斷路器模式、0ms 快速失敗、自動復原。"
tags: [reliability, redis, infrastructure, engineering, ai-gateway]
hide_table_of_contents: true
---

import { CascadeFailure, CircuitBreakerStates, CircuitBreakerFlow, IncidentTimeline } from './diagrams';

*最後更新：2026 年 4 月*

企業級 AI 閘道部署將 Redis 放在幾乎每個請求的熱路徑上：速率限制、快取查詢、支出追蹤。當 Redis 正常時，延遲影響僅有個位數毫秒，終端使用者幾乎察覺不到。當它劣化時，正式環境中的 AI 閘道就必須不受影響地持續運作。

在 100+ 個 Pod 上大規模執行 LiteLLM，意味著必須在失敗模式出現之前先為其設計。簡單的情況是 Redis 完全當機：快速失敗，回退到資料庫，繼續提供請求服務。困難的情況，也是會拖垮閘道的情況，是 *緩慢* 的 Redis：仍然接受連線、仍然回應，但每次操作都會在 20 到 30 秒後逾時。

{/* truncate */}

## 為什麼慢速 Redis 比完全中斷更難處理 {#why-slow-redis-is-harder-than-a-full-outage}

<CascadeFailure />

當 100 個 pod 每次驗證檢查都卡住 30 秒時，執行緒池會被填滿，請求開始排隊。等到 Redis 逾時並轉而使用 Postgres 時，資料庫會因為同時發生的備援而收到 100× 的正常負載。慢速 Redis 會變成資料庫故障，再變成整個閘道故障。正式等級的 AI 閘道不能讓一個劣化的依賴項連鎖造成整體失敗。

## 解法：斷路器模式 {#the-fix-circuit-breaker-pattern}

熔斷器模式會追蹤連續失敗，並在不健康的相依元件造成連鎖反應之前將其切斷。與其在每次 Redis 呼叫上卡住 30 秒，不如在連續 5 次失敗後打開熔斷，並以 0ms 直接失敗，沒有網路請求也沒有等待。

<CircuitBreakerStates />

三種狀態：

- **CLOSED** — 正常。所有 Redis 呼叫都會通過。
- **OPEN** — Redis 不健康。每次呼叫都會立即快速失敗。請求會以降級但可運作的方式繼續：驗證與速率限制會備援到資料庫。
- **HALF-OPEN** — 60 秒後，一個探測請求會測試是否已恢復。成功則關閉斷路器；失敗則重設計時器。

這就是可靠的 AI 閘道處理基礎設施劣化的方式：保持運作、優雅降級、自動復原。

## 請求如何在 AI 閘道中流動 {#how-requests-flow-through-the-ai-gateway}

<CircuitBreakerFlow />

當熔斷器為開啟狀態時，閘道不會停滯。驗證檢查會回退到 Postgres，雖然較慢但有上限。資料庫能承受這些負載，因為它只會透過資料庫備援接收 *部分* 請求，而不是在 30 秒逾時後同時接收來自所有 100 個 Pod 釋放的排隊請求。

有韌性的 AI 閘道與脆弱的 AI 閘道之間的差異：受控降級 vs. 不受控連鎖。

## 實作方式 {#the-implementation}

```python
class RedisCircuitBreaker:
    def __init__(self, failure_threshold: int, recovery_timeout: int):
        self.failure_threshold = failure_threshold  # default: 5
        self.recovery_timeout = recovery_timeout    # default: 60s
        self._failure_count = 0
        self._state = self.CLOSED

    def is_open(self) -> bool:
        if self._state == self.OPEN:
            if time.time() - self._opened_at > self.recovery_timeout:
                self._state = self.HALF_OPEN
                return False  # this caller is the recovery probe
            return True       # fast-fail
        return False

    def record_failure(self):
        self._failure_count += 1
        self._opened_at = time.time()
        if self._failure_count >= self.failure_threshold:
            self._state = self.OPEN  # open the circuit

    def record_success(self):
        self._failure_count = 0
        self._state = self.CLOSED   # Redis recovered
```

每個非同步 Redis 操作都會透過一個裝飾器，在碰觸網路前先檢查斷路器。當斷路器打開時，會立即引發例外：

```python
@_redis_circuit_breaker_guard
async def async_get_cache(self, key: str):
    ...
```

此裝飾器會處理所有帳務：成功不會重設任何內容，失敗會遞增計數器，例外會觸發 `record_failure()`。呼叫端會看到乾淨的例外，並回落到其正常的非 Redis 路徑。不需要變更呼叫程式碼。

## AI 閘道在正式環境中的韌性 {#ai-gateway-resilience-in-production}

<IncidentTimeline />

Redis 劣化事件在正式環境中不再連鎖擴散。Redis 變慢時，可觀測到的症狀是快取未命中率暫時上升，這才是韌性良好的 AI 閘道應有的失敗模式。驗證仍可運作。速率限制仍可運作。支出追蹤仍可運作，只是資料庫成本稍高。當 Redis 恢復時，會完全自動復原。

```bash
# configure via environment variables
REDIS_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5   # failures before opening
REDIS_CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60  # seconds before probe
```

自 `v1.82.0` 起，所有 LiteLLM 版本都預設啟用斷路器。不需要為大多數部署做任何設定。

## 重點摘要 {#key-takeaways}

- 緩慢的 Redis 比當機的 Redis 更危險：跨 100+ 個 Pod 的 30 秒逾時會以 100 倍的正常負載壓垮 Postgres
- LiteLLM 的 AI 閘道使用熔斷器，在 5 次連續失敗後以 0ms 直接失敗 Redis 請求
- 三種狀態：CLOSED（正常）、OPEN（直接失敗 + 資料庫備援）、HALF-OPEN（探測復原）
- Redis 中斷期間，驗證、速率限制與支出追蹤仍可持續運作
- 自 `v1.82.0` 起預設啟用、無需設定即可使用的韌性、正式環境等級行為

---

### 常見問題 {#frequently-asked-questions}

### 斷路器會影響正常的 Redis 效能嗎？ {#does-the-circuit-breaker-affect-normal-redis-performance}

不會。當 Redis 正常時（熔斷器 CLOSED），每次呼叫都會零額外負擔通過。此防護機制只有在連續 5 次失敗後才會啟動，因此在正常情況下是透明的。

### 當斷路器打開時，速率限制會怎麼樣？ {#what-happens-to-rate-limiting-when-the-circuit-is-open}

速率限制會以有界限的負載備援到 Postgres。限制仍會持續執行，只是資料庫成本稍高，直到 Redis 恢復並且斷路器自動關閉。

### 這和基本的 Redis 重試邏輯有什麼不同？ {#how-is-this-different-from-basic-redis-retry-logic}

重試邏輯仍會等待每次逾時（30 秒 × 重試次數）。斷路器會在達到失敗門檻後立即以 0ms 切斷連線，防止所有 pod 同時耗盡執行緒池。重試會讓慢速 Redis 更糟；斷路器會將它限制住。

### 這在 LiteLLM OSS 中可用嗎？ {#is-this-available-in-litellm-oss}

可以。自 `v1.82.0` 起，斷路器就已預設隨 LiteLLM OSS（Apache 2.0）提供。[LiteLLM Enterprise](https://litellm.ai/enterprise) 在 OSS 基礎上新增 SSO/SCIM、隔離網路部署、24/7 SLA 支援，以及進階防護欄。

---

## 結論 {#conclusion}

Redis 韌性只是 LiteLLM 成為可大規模運作、正式環境等級且可靠的 AI 閘道的其中一層。熔斷器模式會將基礎架構劣化限制在範圍內，因此失敗模式只是快取未命中率暫時上升，而不是整體服務中斷。這才是 AI 閘道基礎架構在壓力下應有的行為：優雅劣化、自動復原、持續服務流量。對於有嚴格正常運作時間與合規需求的團隊，[LiteLLM Enterprise](https://litellm.ai/enterprise) 提供受監管正式環境所需的額外控制。

## 推薦閱讀 {#recommended-reading}

- [LiteLLM AI 閘道：完整功能總覽](https://docs.litellm.ai/docs/simple_proxy)
- [跨 100+ 個 LLM 提供者的負載平衡與路由](https://docs.litellm.ai/docs/routing)
- [支出追蹤與預算控制](https://docs.litellm.ai/docs/proxy/cost_tracking)
