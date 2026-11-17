---
sidebar_label: "核心與 host"
description: "LiteLLM Router 如何拆分為 Python facade、Rust 路由核心，以及執行提供者呼叫的 host。"
---

# 核心與 host {#the-core-and-the-host}

<SinceVersion v="1.110.0" />

router 有三個層級。`litellm.Router` 是呼叫者使用的輕薄 Python facade。在它背後，Rust crate
`litellm-router-core`（核心）做出每一個路由決策，並擁有那些決策所需要的狀態。核心只能透過 host 接觸
外部，host 會執行提供者呼叫，以及其他任何需要來自核心執行所在處理程序即時物件的事情。本頁說明這種
拆分，以及界線為何畫在這裡。

![litellm.Router 與 Rust crate 之上的 RustCore 驅動程式，它將步驟交給 PythonHost，PythonHost 再呼叫提供者](../img/core-and-hosts-1.svg)

## 核心擁有什麼 {#what-the-core-owns}

核心擁有路由決策及其狀態。

- 部署登錄表、其索引與部署建構
- 名稱解析、篩選器鏈與 `simple-shuffle`
- 團隊、存取群組、存取時段與 PTU 份額
- 路由群組、呼叫前檢查決策、健康檢查路由與順序篩選器
- 呼叫迴圈：重試、重試原則、備援、順序備援、加權容錯移轉與串流復原
- 冷卻、allowed fails 計數器與用量，透過路由快取寫入
- 模型資訊與模型群組資訊，由 host 回報的內容合併而成

核心所決定的每一件事，都是其設定、請求、路由快取與 host 所給答案的函數。它從不讀取處理程序全域變數、
從不呼叫提供者、也從不等待 Python。這正是核心可以用指令化 host 測試、並能移植到非 Python host 的原因。

## host 回答什麼 {#what-the-host-answers}

核心以一個步驟的形式要求它需要的東西，host 回答它。每一次嘗試都是一個步驟：核心挑選部署，host 執行
呼叫，核心記錄結果。核心內部沒有第二條嘗試路徑。`Host` trait
（`litellm-rust/crates/router-core/src/host.rs`）將這些 host 呼叫分組。

| Host 呼叫 | 核心需要什麼 |
| --- | --- |
| `invoke` | 在一個部署上執行一次嘗試 |
| `select` | 在 Python 中實作的策略，或路由外掛、標籤或純文字階段 |
| `pre_route` | 在挑選解析其名稱之前，子路由器與工作階段綁定，或由自訂策略完成的整個挑選 |
| `pre_call_facts`、`callback_filters`、`routing_plugin_models`、`provider_request` | 需要即時物件的事實與篩選器，例如 token 計數、`CustomLogger` 篩選器與裸模型名稱的提供者 |
| `allow_fallback`、`refuses_fallbacks` | 跨群組備援之前的存取與預算檢查，以及一條備援鏈的 dict 目標是否被拒絕 |
| `secrets`、`validate`、`provider`、`added` | 部署建構，一次一個部署 |
| `model_info` | 在模型資訊查詢期間，查詢成本對照表與能力 |
| `sleep`、`observe`、`cache` | 退避、路由事件，以及所有路由狀態存放的共用儲存 |

某段邏輯該放在哪裡的規則很簡單。如果一個決策只需要設定、請求、路由狀態與一般事實，它屬於核心。如果
它需要即時物件，例如有狀態的策略、記錄回呼或提供者 SDK，則由 host 執行那個部分，並交給核心一個一般
答案。核心仍然做決策。呼叫前檢查展現了這個模式：host 計算 prompt 的 token 並查詢上下文視窗，核心則
決定要移除哪些部署。

## 今日的 host {#the-host-today}

今天，核心在 Python 處理程序內執行，位於 `PythonHost`（`litellm/router_python_host.py`）與
`litellm/router_rust/` 之下的模組之中。

- `invoke/` 執行一次嘗試。`litellm/router_attempt.py` 為核心挑選的部署建立關鍵字引數，
  `PythonHost.invoke(op)` 再以它們呼叫 `litellm.<op>`。端點包裝函式、串流包裝函式、
  `max_parallel_requests` 槽位與重試及備援中繼資料都住在這裡。這裡的任何東西都不做挑選、重試、
  備援或記錄冷卻
- `steps/` 回答需要即時 Python 物件的 host 呼叫：有狀態的策略、子路由器、呼叫前事實、
  `Router(plugins=[...])` 物件、`CustomLogger` 篩選器與呼叫者存取事實
- `surface/` 在核心的狀態之上保持 Python `Router` API。`registry()`、`model_list`、索引與
  `names()` 讀取核心，而對它們的每一次寫入都成為一個變更集

一個能在 Rust 閘道內原生回答這些步驟的 host，將完全不需要 `surface/`。透過 `Host::supports` 與
`Host::can_select`，它會在 router 建構時就拒絕需要 Python 物件的設定，而不是在請求中途失敗。

## 驅動核心 {#driving-the-core}

`RustCore` 持有一個 `RouterCoreHandle`。一次呼叫以 `RouterCoreHandle.start(op, request)`
開始，然後進入迴圈：每次 `RouterCall.next(answer)` 都會執行核心，直到它需要只有 host 能給的東西，
並將那個需求以一個步驟的形式回傳。`select()` 與模型資訊查詢也以相同方式驅動。

![一次呼叫的步驟迴圈：驅動程式讀取冷卻、嘗試部署 a 並得到 429、記錄一個冷卻、嘗試部署 b，並連同路由標頭回傳其回應](../img/core-and-hosts-2.svg)

每個步驟也帶著自上一個步驟以來的路由事件（`Selected`、`AttemptFailed`、`CooldownSet`、`Retry`、
`Fallback` 等等）。驅動程式將它們交給 host 的觀察者，觀察者會提供警示與指標；驅動程式也用它們來標記
請求的中繼資料，並拋出呼叫者所預期的例外。

## 結果由核心記錄 {#outcomes-are-recorded-by-the-core}

核心透過快取步驟，在每次嘗試之後立即自行記錄每次嘗試的結果，因此沒有任何事取決於記錄回呼是否觸發。
串流的嘗試是延遲的：核心在串流開啟時計入該請求，而當串流結束時，host 的串流包裝函式會回報成功連同
最終用量，或是失敗。

## 公開介面 {#the-public-surface}

router 之外的程式碼使用端點方法與八個進入點，沒有其他東西：`registry()`、`settings()`、
`health()`、`select()`、`apply()`、`observe()`、`register_plugin()` 與 `retire()`。路由外掛會
得到一個帶有相同檢視的 `RoutingContext`，而不是 Router。
`tests/code_coverage_tests/router_surface_check.py` 保存一份外部程式碼所觸及成員的允許清單，而該
清單只能縮小。見[進入點](../api_reference/entry_points.md)。

## 設定是靜態的 {#settings-are-static}

`Router(**arguments)` 將其引數凍結為一個 `RouterConfig`，核心由它建構而成。之後，
`apply(ChangeSet(...))` 是變更部署或設定的唯一方法。router 在服務期間讀取的處理程序設定，例如
`litellm.num_retries`、備援清單、模型成本對照表與回呼清單，會以版本化的 `RouterDynamicConfig`
快照的形式到達，因此核心從不讀取全域變數。

![router 的設定如何到達核心：建構函式引數凍結為 RouterConfig、處理程序設定快照為
RouterDynamicConfig，以及供後續變更使用的 apply(ChangeSet)](../img/core-and-hosts-3.svg)

## 應用程式 host {#the-application-host}

另外，router 需要幾個只有 proxy 才有的答案，例如 vertex 直通憑證，以及呼叫者是否可以使用某個團隊的
auto router。它會詢問一個 `RouterHost`（`litellm/router_host.py`）。當 proxy 可以被匯入時，那就是
proxy 的 `ProxyRouterHost`，否則是一個拒絕團隊 auto router 的預設值。
