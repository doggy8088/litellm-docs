---
sidebar_label: "程式碼地圖"
description: "LiteLLM 儲存庫中，路由器的每個部分分別位於哪個檔案。"
---

# 程式碼地圖 {#code-map}

<SinceVersion v="1.110.0" />

路由器的程式碼所在位置。路徑皆相對於儲存庫根目錄。

![路由器程式碼地圖：Python facade 及其模組通往 RustCore
步驟驅動程式、router_rust 步驟模組、python-bridge crate 與
router-core crate](../img/code-map-1.svg)

## Python {#python}

| 檔案 | 內容 |
| --- | --- |
| `litellm/router.py` | `Router`，即 facade。負責建立設定、選擇核心並委派每個成員 |
| `litellm/router_api.py` | 進入點的 views 與型別，請參閱 [進入點](entry_points.md)，外加 `ROUTER_INIT_ARGS` 與 `apply_changes` |
| `litellm/router_core.py` | `RouterCore` 協定與 `make_core` |
| `litellm/router_config.py` | `RouterConfig`、`RouterDynamicConfig`，以及路由器中唯一讀取 `litellm.*` 設定的地方 |
| `litellm/router_deprecated.py` | `DeprecatedRouterMembers`，帶有 `DeprecationWarning` 的舊成員名稱 |
| `litellm/router_python_host.py` | `PythonHost`，Python 程序內的 host：端點函式、sleep、動態設定、回呼、快取 |
| `litellm/router_host.py` | `RouterHost`，只有應用程式能回答的部分，以及 `litellm/proxy/_router_host.py` 中的 proxy 版本 |
| `litellm/router_strategy/` | 有狀態的策略、`lar1`、子路由器、預算限制器與標籤路由。核心透過 select 與 pre-route 步驟存取它們 |
| `litellm/router_utils/` | host 使用的輔助工具，例如冷卻快取、健康狀態快取、呼叫前檢查與回應標頭 |
| `litellm/litellm_core_utils/` | 路由器與其他模組共用的輔助工具，例如萬用字元比對、PTU 份額，以及重試與備援標頭 |
| `litellm/types/router.py` | `Deployment`、`RoutingGroup`、`RetryPolicy` 與其他設定型別 |
| `litellm/proxy/route_llm_request.py` | 將 proxy 請求對應到 Router 端點方法 |

### `litellm/router_rust/` {#litellmrouter_rust}

核心在 Python 側需要的一切。

| 路徑 | 內容 |
| --- | --- |
| `core.py` | `RustCore`，非同步與同步呼叫的步驟驅動程式 |
| `steps/` | 需要即時 Python 物件的步驟之解答：`selection.py`（策略）、`prerouting.py`（子路由器、工作階段綁定、自訂策略）、`precall.py`（呼叫前事實）、`plugins.py`（`Router(plugins=[...])`）、`callbacks.py`（`CustomLogger` 篩選器）、`access.py`（呼叫者存取事實） |
| `invoke/` | 一次嘗試：`endpoints.py`（端點包裝器）、`shaping.py`（請求與回應塑形）、`streaming.py`（在串流結束時回報結果的串流包裝器）、`slots.py`（`max_parallel_requests`）、`walk.py`（重試與備援中繼資料）、`prompt_management.py`、`websocket.py` |
| `surface/` | 建立在核心狀態之上的 Python `Router` API：`registry.py`、`model_list.py`、`indexes.py`、`members.py`、`model_info.py`、`settings.py`、`health.py`、`health_routing.py`、`retries.py`、`fallbacks.py`、`alerting.py`、`replay.py` |

`litellm/router_attempt.py` 為核心挑選的部署建立一次嘗試的
關鍵字引數。它不負責挑選、重試或記錄任何東西。

## Rust {#rust}

`litellm-rust/crates/router-core/src/`。

| 檔案 | 內容 |
| --- | --- |
| `lib.rs` | `Router`、`RouterBuilder` 與 crate 總覽 |
| `config.rs` | `RouterConfig`、`RouterDynamicConfig`、`Op`、`RoutingStrategy`、重試與允許失敗政策 |
| `registry.rs` | `Registry`、`Deployment`、`ChangeSet`、`deployment_id` |
| `build.rs` | 透過 host 的 `secrets`、`validate`、`provider` 與 `added` 步驟，從設定建立部署 |
| `resolve.rs` | 名稱解析，`_common_checks_available_deployment` 的移植版 |
| `select.rs` | 篩選鏈與 `simple-shuffle` |
| `access.rs`, `ptu.rs`, `health_routing.rs`, `precall.rs` | 存取群組與視窗、PTU 份額、健康檢查與呼叫前篩選器 |
| `prerouting.rs`, `routing_plugins.rs`, `routing_groups.rs` | 預先路由、路由外掛候選者與路由群組成員 |
| `strategy.rs`, `weights.rs` | 一次挑選使用哪種策略，以及每請求權重 |
| `call.rs`, `call/stream.rs` | 帶有重試、備援與加權故障轉移的呼叫迴圈，以及串流復原 |
| `retry.rs`, `fallback.rs`, `mock.rs` | 重試規則、備援清單與 `mock_testing_*` 失敗 |
| `health.rs` | 冷卻、允許失敗、使用量與快取鍵 |
| `cache.rs` | `RouterCache` 與供測試用的記憶體內實作 |
| `settings.rs` | 凍結的 `Settings` 檢視 |
| `host.rs` | `Host`、`Attempt`、`RouterRequest`、`RouterEvent`、`RoutingContext` |
| `lookup.rs`, `host_index.rs` | Python 介面讀取的索引與清單 |
| `model_info.rs`, `group_info.rs` | 模型資訊與模型群組資訊的合併 |
| `error.rs` | `ConfigError`、`Error`、`AttemptError`、`FailureKind` |

`litellm-rust/crates/python-bridge/src/router/` 將核心以
`RouterCoreHandle` 與 `RouterCall` 的形式暴露給 Python，把 Python 的設定與動態快照
轉換為核心的型別，並將每個 hostcall 轉換為一個步驟。

## 測試與檢查 {#tests-and-checks}

| 路徑 | 涵蓋範圍 |
| --- | --- |
| `tests/unit/test_router/core/` | 核心測試套件，以腳本化 host 對核心執行：挑選、重試與冷卻、備援、註冊表變更集、端點 |
| `litellm-rust/crates/router-core` unit tests | Rust 模組，使用固定種子的隨機性與測試時鐘 |
| `tests/unit/test_router/` | 透過 facade 執行的路由器單元測試，包括 `test_router_entry_points.py` |
| `tests/code_coverage_tests/router_surface_check.py` | 僅允許縮減的介面允許清單，在 CI 中執行 |
| `tests/code_coverage_tests/router_litellm_globals_check.py` | 檢查是否只有 `litellm/router_config.py` 讀取 `litellm.*` 設定 |
| `tests/code_coverage_tests/router_code_coverage.py` | 檢查每個路由器函式都有測試 |
| litefuzz `translation-diff` suite | 路由行為的差分模糊測試，在核心每次變更時執行 |
