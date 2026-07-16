---
slug: httpx-cache-eviction-incident
title: "事故報告：快取驅逐關閉了使用中的 httpx 用戶端"
date: 2026-02-27T10:00:00
authors:
  - ryan
  - ishaan-alt
  - krrish
tags: [incident-report, caching, stability]
hide_table_of_contents: false
---

**日期：** 2026 年 2 月 27 日
**持續時間：** 約 6 天（2 月 21 日合併 -> 2 月 27 日修正）
**嚴重性：** 高
**狀態：** 已解決

> **注意：** 此修正自 LiteLLM `v1.81.14.rc.2` 或更高版本開始可用。

## 摘要 {#summary}

一項用於改善 Redis 連線池清理的變更引入了迴歸問題，會關閉仍被 proxy 積極使用的 **httpx 用戶端**。`LLMClientCache`（一個記憶體中的 TTL 快取）將 Redis 用戶端與 httpx 用戶端都存放在相同的驅逐政策下。當快取項目過期或被驅逐時，新的清理程式碼會對被驅逐的值呼叫 `aclose()`/`close()`；這對 Redis 用戶端運作正確，但會摧毀系統中其他部分仍持有參考且正在用於 LLM API 請求的 httpx 用戶端。

**影響：** 任何命中快取 TTL（預設 10 分鐘）或容量上限（200 筆項目）的 proxy 實例，都會在其下方被關閉 httpx 用戶端，導致對 LLM 提供者的請求因連線錯誤而失敗。

{/* truncate */}

---

## 背景 {#background}

`LLMClientCache` 延伸自 `InMemoryCache`，並用來快取 SDK 用戶端（OpenAI、Anthropic 等），以避免每次請求都重新建立。這些用戶端以設定 + event loop ID 作為鍵。快取具有：

- **最大大小：** 200 筆項目
- **預設 TTL：** 10 分鐘

當快取已滿或項目過期時，`InMemoryCache.evict_cache()` 會呼叫 `_remove_key()` 以移除項目。

快取的值混合了：
- **Redis/async Redis 用戶端** — 由快取專屬持有，驅逐時安全關閉
- **基於 httpx 的 SDK 用戶端**（OpenAI、Anthropic 等）— 共享參考，仍被 router/model 實例使用中

---

## 根本原因 {#root-cause}

[PR #21717](https://github.com/BerriAI/litellm/pull/21717) 在 `_remove_key()` 中覆寫了 `LLMClientCache`，以便在驅逐時關閉 async 用戶端：

<details>
<summary>PR #21717 中加入的有問題程式碼</summary>

```python
class LLMClientCache(InMemoryCache):
    def _remove_key(self, key: str) -> None:
        value = self.cache_dict.get(key)
        super()._remove_key(key)
        if value is not None:
            close_fn = getattr(value, "aclose", None) or getattr(value, "close", None)
            if close_fn and asyncio.iscoroutinefunction(close_fn):
                try:
                    asyncio.get_running_loop().create_task(close_fn())
                except RuntimeError:
                    pass
            elif close_fn and callable(close_fn):
                try:
                    close_fn()
                except Exception:
                    pass
```

</details>

其意圖對 Redis 用戶端來說是正確的——防止快取的 Redis 用戶端過期時發生連線池洩漏。但 `LLMClientCache` 也會儲存基於 httpx 的 SDK 用戶端（例如 `AsyncOpenAI`、`AsyncAnthropic`）。這些用戶端：

1. 具有 `aclose()` 方法（繼承自 httpx）
2. 在程式碼庫其他地方仍被參考持有（router、model 實例）
3. 在未檢查是否仍在使用中的情況下就被關閉

因此，當快取驅逐某個項目時，會對仍被用於進行中的 LLM 請求的 httpx 用戶端呼叫 `aclose()` → transport 被關閉 → 連線錯誤。

---

## 修正 {#the-fix}

[PR #22247](https://github.com/BerriAI/litellm/pull/22247) 已完全移除 `_remove_key` 覆寫：

<details>
<summary>修正內容（PR #22247）</summary>

```diff
 class LLMClientCache(InMemoryCache):
-    def _remove_key(self, key: str) -> None:
-        """Close async clients before evicting them to prevent connection pool leaks."""
-        value = self.cache_dict.get(key)
-        super()._remove_key(key)
-        if value is not None:
-            close_fn = getattr(value, "aclose", None) or getattr(
-                value, "close", None
-            )
-            ...
-
     def update_cache_key_with_event_loop(self, key):
```

</details>

現在驅逐只會單純移除參考，並讓 Python 的 GC 負責清理，這是安全的，因為：
- 仍在其他地方被參考的 httpx 用戶端會繼續存活
- 沒有參考的用戶端會由 GC 自然清理

PR #21717 的其他改善已保留：
- **URL 型 Redis 設定會尊重 `max_connections`**，先前會被默默丟棄
- **`disconnect()` 現在會關閉同步與非同步 Redis 用戶端**，先前同步用戶端會洩漏
- **連線池透傳**：當提供 URL 設定與連線池時，會直接使用該連線池，而不是建立重複項目

---

## 修復措施 {#remediation}

| 動作 | 狀態 | 程式碼 |
|--------|--------|------|
| 移除在驅逐時關閉共享用戶端的 `_remove_key` 覆寫 | ✅ 完成 | [PR #22247](https://github.com/BerriAI/litellm/pull/22247) |
| 新增 e2e 測試：被驅逐的用戶端仍可使用（容量） | ✅ 完成 | [PR #22313](https://github.com/BerriAI/litellm/pull/22313) |
| 新增 e2e 測試：過期的用戶端仍可使用（TTL） | ✅ 完成 | [PR #22313](https://github.com/BerriAI/litellm/pull/22313) |

這些 e2e 測試會透過 `get_async_httpx_client()` 走過 proxy 在正式環境中使用的相同程式路徑，並斷言在驅逐後用戶端仍可正常運作。這些測試會在 CI 中針對 `main` 的每個 PR 執行。如果有人修改 `LLMClientCache` 的驅逐行為、覆寫 `_remove_key`，或在驅逐時加入任何形式的用戶端清理，無論實作方式為何，這些測試都會失敗。
