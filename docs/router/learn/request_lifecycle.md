---
sidebar_label: "一個請求的生命週期"
description: "追蹤一次 acompletion 呼叫，從 litellm.Router 經過 Rust 核心到提供者再回來。"
---

# 一個請求的生命週期 {#the-life-of-a-request}

<SinceVersion v="1.110.0" />

本頁追蹤一次 `await router.acompletion(model="gpt-4o", messages=...)`，從 facade 經過核心，
到提供者再回來。其他端點方法（`aembedding`、`aresponses`、`aanthropic_messages`、檔案與批次
包裝函式等等）走相同的路徑，只是操作不同。

## 形狀 {#the-shape}

備援包住重試，重試包住單一次嘗試。每一次嘗試都挑選一個部署，並以該部署的參數呼叫 `litellm.<op>`，
因此重試可能落在不同的部署上。

![Router.acompletion 經過備援、重試與一次嘗試，到達 litellm.acompletion 與提供者 HTTP 呼叫](../img/request-lifecycle-1.svg)

router 在提供者呼叫上將 `max_retries` 設為 0，因此提供者 SDK 與 HTTP 用戶端都不會自行重試。
router 的迴圈是唯一的重試迴圈，這正是每次重試都能挑選不同部署的原因。

`litellm.acompletion` 是 SDK 使用者呼叫的同一個函式。router 不會自己與提供者交談。它選擇引數，
而提供者轉換層處理其餘部分。

回應會在 `response._hidden_params["model_id"]` 中帶有所挑選部署的 id。proxy 會在
`x-litellm-model-id` 標頭中回報它，連同該次呼叫使用的模型群組、重試與備援。

## 逐步說明 {#step-by-step}

`RustCore.acompletion` 將呼叫轉換為一次 `RouterCoreHandle.start("acompletion", request)`，
並驅動它回傳的步驟。迴圈本身在 `litellm-rust/crates/router-core/src/call.rs` 中，而它為每次嘗試
執行的挑選在 `select.rs` 中。

![一次 acompletion 呼叫的編號序列：Router、RustCore 驅動程式、核心的步驟、快取讀寫、透過 PythonHost
到提供者的嘗試，以及帶有路由標頭的回應](../img/request-lifecycle-2.svg)

一些值得知道的細節。

核心會將一次嘗試的錯誤轉換為帶型別的 `AttemptError`，帶有失敗種類（速率限制、上下文視窗、內容原則、
驗證、逾時……）、狀態碼與任何 `Retry-After`。重試、備援與冷卻規則會讀取這些事實。

核心透過快取步驟，在每次嘗試之後立即自行記錄每個結果，因此沒有任何事取決於記錄回呼是否觸發。路由事件
（`Selected`、`AttemptFailed`、`CooldownSet`、`Retry`、`Fallback`、`RetriesExhausted` 等等）
會伴隨每個步驟。驅動程式將它們交給 host 的觀察者，並用它們來標記請求中繼資料，以及拋出呼叫者所預期的
例外。

串流的嘗試是延遲的。核心在串流開啟時計入該請求。當串流結束時，host 的串流包裝函式會回報成功連同最終
用量，或在串流中斷時回報失敗。在呼叫者取得任何內容之前就中斷的串流，會詢問核心還有什麼可以接手
（`call/stream.rs`）。

有狀態的策略，例如延遲與用量型路由，會從 litellm 的記錄回呼中學習，並將它們的計數器保存在 Python 中。
當核心要求一次挑選時，它們在 `litellm/router_rust/steps/selection.py` 中執行。

## 同步路徑 {#the-sync-path}

`router.completion()` 與其他同步方法執行相同的迴圈。`RustCore._call_sync` 在呼叫執行緒上驅動
相同的步驟，而睡眠步驟會封鎖該執行緒。proxy 對每個請求都使用非同步方法。
