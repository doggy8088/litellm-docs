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

企業級 AI 閘道部署幾乎每個請求都會經過 Redis：速率限制、快取查詢、支出追蹤。當 Redis 健康時，其延遲貢獻只有個位數毫秒 — 使用者幾乎感受不到。當它劣化時，正式環境 AI 閘道無論如何都需要保持運作。

在 100+ 個 pod 上大規模執行 LiteLLM，意味著必須在故障模式出現之前先為它們設計。簡單的情況是 Redis 完全中斷：快速失敗、轉而使用資料庫、持續提供請求。困難的情況 — 也是會讓閘道停擺的情況 — 是 *緩慢的* Redis：仍可接受連線、仍有回應，但每次操作都要 20-30 秒才逾時。

{/* truncate */}

## 為什麼慢速 Redis 比完全中斷更難處理 {#why-slow-redis-is-harder-than-a-full-outage}

<CascadeFailure />

當 100 個 pod 每次驗證檢查都卡住 30 秒時，執行緒池會被填滿，請求開始排隊。等到 Redis 逾時並轉而使用 Postgres 時，資料庫會因為同時發生的備援而收到 100× 的正常負載。慢速 Redis 會變成資料庫故障，再變成整個閘道故障。正式等級的 AI 閘道不能讓一個劣化的依賴項連鎖造成整體失敗。

## 解法：斷路器模式 {#the-fix-circuit-breaker-pattern}

斷路器模式會追蹤連續失敗次數，並在不健康的依賴項進一步連鎖之前切斷它。不是在每次 Redis 呼叫上卡 30 秒，而是在連續 5 次失敗後打開斷路器，並以 0ms 快速失敗 — 不發出網路請求、不等待。

<CircuitBreakerStates />

三種狀態：

- **CLOSED** — 正常。所有 Redis 呼叫都會通過。
- **OPEN** — Redis 不健康。每次呼叫都會立即快速失敗。請求會以降級但可運作的方式繼續：驗證與速率限制會備援到資料庫。
- **HALF-OPEN** — 60 秒後，一個探測請求會測試是否已恢復。成功則關閉斷路器；失敗則重設計時器。

這就是可靠的 AI 閘道處理基礎設施劣化的方式：保持運作、優雅降級、自動復原。

## 請求如何在 AI 閘道中流動 {#how-requests-flow-through-the-ai-gateway}

<CircuitBreakerFlow />

當斷路器打開時，閘道不會停滯。驗證檢查會備援到 Postgres — 較慢，但有界限。資料庫能吸收負載，因為它收到的是 *部分* 透過資料庫備援而來的請求，而不是在 30 秒逾時後所有 100 個 pod 同時把排隊中的請求全部傾倒過來。

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

該裝飾器處理所有記帳工作 — 成功不會重設任何狀態，失敗會遞增計數器，例外會觸發 `record_failure()`。呼叫端會看到乾淨的例外，並回到其正常的非 Redis 路徑。不需要在呼叫程式碼中做任何變更。

## AI 閘道在正式環境中的韌性 {#ai-gateway-resilience-in-production}

<IncidentTimeline />

Redis 劣化事件在正式環境中不再連鎖。Redis 變慢時可觀察到的症狀，是快取命中率暫時上升的反向變化 — 這是有韌性的 AI 閘道正確的失敗模式。驗證仍可運作。速率限制仍可運作。支出追蹤仍可運作，只是資料庫成本稍高。當 Redis 恢復時，會完全自動復原。

```bash
# configure via environment variables
REDIS_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5   # failures before opening
REDIS_CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60  # seconds before probe
```

自 `v1.82.0` 起，所有 LiteLLM 版本都預設啟用斷路器。不需要為大多數部署做任何設定。

## 重點摘要 {#key-takeaways}

- 慢速 Redis 比當機的 Redis 更危險：100+ 個 pod 的 30 秒逾時會以 100× 的正常負載壓垮 Postgres
- LiteLLM 的 AI 閘道使用斷路器，在連續 5 次失敗後以 0ms 快速失敗 Redis 呼叫
- 三種狀態：CLOSED（正常）、OPEN（快速失敗 + 資料庫備援）、HALF-OPEN（探測復原）
- Redis 異常期間，驗證、速率限制與支出追蹤仍可持續運作
- 韌性、正式等級行為 — 自 `v1.82.0` 起預設啟用，無需設定

---

### 常見問題 {#frequently-asked-questions}

### 斷路器會影響正常的 Redis 效能嗎？ {#does-the-circuit-breaker-affect-normal-redis-performance}

不會。當 Redis 健康時（斷路器 CLOSED），每次呼叫都會零額外負擔地通過。斷路器只會在連續 5 次失敗後啟動 — 在正常情況下完全透明。

### 當斷路器打開時，速率限制會怎麼樣？ {#what-happens-to-rate-limiting-when-the-circuit-is-open}

速率限制會以有界限的負載備援到 Postgres。限制仍會持續執行，只是資料庫成本稍高，直到 Redis 恢復並且斷路器自動關閉。

### 這和基本的 Redis 重試邏輯有什麼不同？ {#how-is-this-different-from-basic-redis-retry-logic}

重試邏輯仍會等待每次逾時（30 秒 × 重試次數）。斷路器會在達到失敗門檻後立即以 0ms 切斷連線，防止所有 pod 同時耗盡執行緒池。重試會讓慢速 Redis 更糟；斷路器會將它限制住。

### 這在 LiteLLM OSS 中可用嗎？ {#is-this-available-in-litellm-oss}

可以。自 `v1.82.0` 起，斷路器就已預設隨 LiteLLM OSS（Apache 2.0）提供。[LiteLLM Enterprise](https://litellm.ai/enterprise) 在 OSS 基礎上新增 SSO/SCIM、隔離網路部署、24/7 SLA 支援，以及進階防護欄。

---

## 結論 {#conclusion}

Redis 韌性是讓 LiteLLM 在大規模下成為正式等級、可靠 AI 閘道的其中一層。斷路器模式可確保基礎設施劣化維持在可控範圍內 — 正確的失敗模式是快取命中率暫時上升，而不是全面故障。這就是 AI 閘道基礎設施在壓力下應有的表現：優雅降級、自動復原、持續提供流量。對於有嚴格停機時間與合規需求的團隊，[LiteLLM Enterprise](https://litellm.ai/enterprise) 提供受管制正式環境所需的額外控制項。

## 推薦閱讀 {#recommended-reading}

- [LiteLLM AI 閘道 — 完整功能總覽](https://docs.litellm.ai/docs/simple_proxy)
- [跨 100+ LLM 提供者的負載平衡與路由](https://docs.litellm.ai/docs/routing)
- [支出追蹤與預算控制](https://docs.litellm.ai/docs/proxy/cost_tracking)
