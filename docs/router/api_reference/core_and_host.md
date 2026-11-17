---
sidebar_label: "核心與 host 介面"
description: "LiteLLM Router 的步驟通訊協定、Rust Router 與 Host trait、RouterRequest、Attempt、Output、RouterEvent 與 FailureKind。"
---

# 核心、設定與 host 介面 {#core-config-and-host-interfaces}

<SinceVersion v="1.110.0" />

Python facade、Rust 核心與其執行所在的 host 之間的介面。[核心與 host](../learn/core_and_hosts.md)
說明了它們為何是這樣的形狀。

![Router facade 使用 RouterCore 通訊協定；RustCore 實作它，並持有一個指向 Rust RustRouter 的
handle，RustRouter 呼叫由 PythonHost 實作的 Host trait](../img/core-and-host-1.svg)

## Python 端 {#python-side}

| 名稱 | 檔案 | 它是什麼 |
| --- | --- | --- |
| `Router` | `litellm/router.py` | facade。`Router(**arguments)` 與 `Router.from_config(config, host=python_host)` |
| `RouterCore` | `litellm/router_core.py` | facade 委派的通訊協定 |
| `make_core(config, host)` | `litellm/router_core.py` | 在 Router 建構時建立一次核心 |
| `RustCore` | `litellm/router_rust/core.py` | 持有一個 `RouterCoreHandle` 並回答其步驟 |
| `RustBridgeDeclined` | `litellm.rust_bridge._native` | 當 handle 無法讀取某個設定時拋出 |
| `RouterConfig` | `litellm/router_config.py` | 建構函式引數，已凍結，一般容器會被複製（`build_router_config`） |
| `RouterDynamicConfig` | `litellm/router_config.py` | router 在每次呼叫時讀取的處理程序設定的版本化快照（`current_dynamic_config()`） |
| `PythonHost` | `litellm/router_python_host.py` | `invoke(op)` 會回傳 `litellm` 端點函式，外加 `sleep`、`dynamic()`、回呼清單、全域快取與 `routing_cache(config)` |
| `router_attempt` | `litellm/router_attempt.py` | 為核心挑選的部署建立一次嘗試的關鍵字引數 |
| `RouterHost` | `litellm/router_host.py` | 只有應用程式能回答的內容（vertex 直通憑證、成員 auto-router 授權） |
| `DeprecatedRouterMembers` | `litellm/router_deprecated.py` | 舊的 Router 成員名稱，伴隨 `DeprecationWarning` 提供 |

`RouterDynamicConfig` 的欄位有 `num_retries`、`max_fallbacks`、
`router_max_fallbacks`、`allowed_fails`、`request_timeout`、`fallbacks`、
`default_fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks`、
`drop_params`、`provider_list`、`expose_router_debug_in_errors`、
`redact_user_api_key_info`、`model_alias_map`、`model_cost`、
`known_custom_logger_compatible_callbacks`、`exception_types`、`callbacks`、
`success_callback`、`failure_callback`、`input_callback`、`callback_manager` 與
`cache`，外加它的 `version`。

## 步驟通訊協定 {#the-step-protocol}

`litellm.rust_bridge._native` 中的 `RouterCoreHandle(config, dynamic)` 包裝了一個 Rust
`Router`。`start(op, request)`、`select(model, request)` 與 `healthy(model, request)` 會回傳一個
`RouterCall`，回報與模型資訊查詢也是如此。驅動程式會呼叫 `RouterCall.next(answer)`，直到得到
`done` 或 `failed`。每個步驟都帶著自上一個步驟以來的路由事件。

| 步驟 | 核心需要什麼 | 驅動程式以什麼回答 |
| --- | --- | --- |
| `attempt` | 在指定部署上執行一次嘗試 | 回應及其總 token 數，或帶型別的失敗 |
| `sleep` | 退避 `seconds` 秒 | 無，透過 host 睡眠之後 |
| `allow_fallback` | 跨群組備援 `target` 是否被允許 | 來自備援存取與預算檢查的一個 bool |
| `pre_route` | 在挑選解析 `model` 之前，子路由器、工作階段綁定或自訂策略 | 一個模型群組、自訂策略挑選的部署，或 `None` |
| `select` | 在候選上執行一個 host 階段，以 `stage` 命名 | 見下方的階段表 |
| `cache` | 路由快取的讀取或寫入（`get`、`set`、`batch_get`、`increment` 等等） | 讀到的值，或一個確認 |
| `secrets`、`validate`、`provider`、`added` | 在套用設定或變更集時，建構一個部署 | 已解析的秘密、已驗證的項目、提供者、已加入的項目 |
| `model_info` | 在模型資訊查詢期間，查詢成本對照表或能力 | 查詢的文件 |
| `done` | 不再需要任何東西 | 結果回到呼叫者，並帶著路由標頭 |
| `failed` | 不再需要任何東西 | 錯誤依其 `error_kind` 回到呼叫者 |

| `select` 階段 | host 回傳什麼 |
| --- | --- |
| `routing_plugins` | 路由外掛留下的候選模型，在 `run` 有設定時先執行它們 |
| `callback_filters` | `CustomLogger` 篩選器留下的部署 id，或一個失敗 |
| `plugins` | `Router(plugins=[...])` 物件留下的部署 |
| `pre_call` | 呼叫前檢查所依據的事實，例如 token 計數 |
| `tags` | 標籤路由留下的部署 |
| `text_only` | 未宣告視覺支援的候選 |
| `route_incapable` | 其提供者無法服務 `handler` 所命名呼叫的候選 |
| `media_refusing` | 拒絕 Decisions 呼叫所帶音訊或影片的候選 |
| `embedding_batch` | 接受該 embedding 輸入的候選 |
| `override_check` | 每個請求策略的呼叫前檢查之後的候選，或其拒絕 |
| `provider_request` | 供萬用字元比對使用的裸名 `provider/model` 形式 |
| `strategy` | 挑選結果排在最前面的候選，供核心未實作的策略使用 |

`apply(changes)` 會回傳新的登錄表版本，`registry_version()` 讀取它，`retire()` 則讓 router 退休。

## Rust 端 {#rust-side}

這些全都位於 `litellm-rust/crates/router-core/src/`。

| 型別 | 模組 | 它是什麼 |
| --- | --- | --- |
| `Router`、`RouterBuilder` | `lib.rs` | `Router::new(config, dynamic, host)`，或供測試使用的、帶有 `randomness` 與 `clock` 的 builder |
| `RouterConfig`、`RouterDynamicConfig`、`Op`、`RoutingStrategy`、`RetryPolicy`、`AllowedFailsPolicy` | `config.rs` | 靜態與動態設定、操作名稱、策略（`simple-shuffle` 的 `is_native` 為 true） |
| `Registry`、`Deployment`、`ChangeSet`、`RegistryVersion`、`deployment_id` | `registry.rs` | 不可變、已建立索引的部署 |
| `Settings` | `settings.rs` | 已凍結的設定檢視 |
| `Health`、`Outcome`、`Clock`、`cooldown_key`、`usage_key` | `health.rs` | 冷卻、allowed fails、用量與結果計數器 |
| `RouterCache`、`InMemoryRouterCache` | `cache.rs` | host 提供的路由狀態儲存 |
| `Randomness`、`SeededRandomness`、`simple_shuffle` | `select.rs` | 篩選器鏈與 `simple-shuffle` |
| `resolve_request`、`all_deployments` | `resolve.rs` | 名稱解析 |
| `routing_context`、`request_override` | `strategy.rs` | 一次挑選使用哪個策略 |
| `RouterWeights`、`validate` | `weights.rs` | 每個請求的權重 |
| `RouterResponse` | `call.rs` | 呼叫迴圈的結果，連同所使用的部署、群組、重試與備援 |
| `StreamPolicy`、`StreamOrigin` | `call/stream.rs` | 什麼可以接手已中斷的串流 |
| `Fallbacks`、`FallbackTarget` | `fallback.rs` | 已解析的備援清單 |
| `Host`、`Attempt`、`RouterRequest`、`Output`、`RouterEvent`、`RoutingContext`、`SelectStage` | `host.rs` | host 接縫 |
| `Error`、`ConfigError`、`Unsupported`、`AttemptError`、`FailureKind` | `error.rs` | 建構時、呼叫時與每次嘗試的錯誤 |

其他模組各自負責一個階段或查詢：`access.rs`（存取群組與視窗）、`ptu.rs`（PTU 份額）、
`health_routing.rs`、`precall.rs`、`prerouting.rs`、`routing_groups.rs`、`routing_plugins.rs`、
`retry.rs`、`mock.rs`（`mock_testing_*` 失敗）、`build.rs`（部署建構）、`lookup.rs` 與
`host_index.rs`（Python 介面讀取的索引）、`model_info.rs` 與 `group_info.rs`（模型資訊合併）。

`Op` 是以字串表示的操作名稱，例如 `acompletion`、`aembedding`、`aresponses` 或
`aanthropic_messages`。核心將它傳給 host，從不解讀它。

### `Host` {#host}

| 方法 | 呼叫時機 |
| --- | --- |
| `invoke(attempt)` | 每一次嘗試。沒有原生嘗試路徑 |
| `select(stage, ctx, candidates)` | `Plugins`、`Strategy`、`Tags`、`TextOnly`、`RouteIncapable`、`MediaRefusing`、`EmbeddingBatch` 與 `OverrideCheck` 階段 |
| `pre_route(ask)` | 前置路由，以及自訂策略的整個挑選 |
| `routing_plugin_models`、`callback_filters`、`pre_call_facts`、`provider_request` | 需要即時 Python 物件的階段 |
| `allow_fallback(request, target)` | 跨群組備援之前的存取與預算檢查 |
| `refuses_fallbacks(level, targets)` | 一條鏈是否因其某個 dict 目標而被拒絕，例如伺服器擁有的聯邦欄位或 `oidc/` api key。預設為 false |
| `sleep(duration)`、`observe(event)`、`cache()` | 退避、路由事件、路由狀態儲存 |
| `secrets`、`validate`、`provider`、`added` | 部署建構 |
| `model_info(lookup)` | 成本對照表與能力查詢 |
| `supports(op, provider)`、`can_select()` | host 能服務什麼。兩者預設都為 true，且 `PythonHost` 什麼都能服務 |

### `RouterRequest` {#routerrequest}

| 欄位 | 意義 |
| --- | --- |
| `model` | 請求的名稱、一個模型群組、別名、路由群組、部署 id 或萬用字元比對 |
| `body` | 核心自己的檢查所讀取的請求參數 |
| `team_id`、`listing_team_id`、`proxy_admin`、`allowed_models`、`admin_model` | 團隊與存取篩選器讀取的呼叫者事實。`listing_team_id` 是某個失敗層級為其列出群組部署的團隊 |
| `specific_deployment` | 呼叫者指定了某個部署的 `litellm_params.model` |
| `pinned_deployment_id` | 工作階段或親和性綁定所釘選的部署 |
| `num_retries`、`uncounted_retries`、`model_group_retry_policy`、`retry_policy_raises` | 每個請求的重試設定，優先於 router 的設定。`uncounted_retries` 保存一個不作為計數的 `num_retries` |
| `disable_fallbacks`、`fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks`、`max_fallbacks` | 每個請求的備援設定 |
| `same_group_fallbacks_only` | 請求指定了只有一個提供者擁有的資源，例如上傳的檔案，因此它在自己的群組內備援 |
| `cooldown_time` | 每個請求的冷卻 |
| `router_weights` | 每個團隊的權重，模型群組對應到部署 id 再對應到權重 |
| `routing_strategy` | 每個請求的策略覆寫 |
| `filter_tags`、`has_image` | 標籤與純文字階段的輸入 |
| `endpoint`、`web_search`、`route_handler`、`decisions_media`、`batch_create`、`embedding_batch` | 呼叫所需要的東西，會移除宣告無法服務它的部署 |
| `wildcard_request` | 名稱的 `provider/model` 形式，供無法詢問 host 的查詢使用 |
| `pass_through` | 一條直通路由，僅服務直通部署 |
| `target_order`、`excluded_ids`、`retry_skipped_ids` | 順序備援所針對的順序，以及挑選必須略過的 id |
| `pre_routes`、`unrouted`、`skip_weighted_failover` | 前置路由與加權容錯移轉是否執行以及如何執行 |
| `passthrough_on_no_deployment` | 挑選失敗時，以請求的名稱將嘗試交給 host |
| `outcome_callbacks` | router 的哪些結果回呼會為這個請求執行 |
| `mock_failure`、`health_check_probe` | 測試失敗與健康檢查探測 |
| `payload` | host 執行呼叫本身所需要的內容，例如 Python kwargs |

### `Attempt` 與 `Output` {#attempt-and-output}

`Attempt` 帶有 `op`、`request`、`deployment`、`name`（請求的名稱或備援目標）、`model_group`
（備援之後實際服務的群組）、`routed`（前置路由 hook 選到的群組，當它不同時）、`target_order`、
`candidate_ids`、`retry`（在這個群組中的第一次嘗試為 0）、`fallback_depth`、`fallback_level`
（請求的名稱為 0）、`timeout`、`params`、`scope`、`max_retries` 與 `model_group_size`。

`Output` 帶有 host 原封不動交回的 `value`、`total_tokens`、`blocked`（`ContentFilter` 或
`Refusal`，由備援規則讀取）與 `deferred`，後者在串流或即時工作階段時設定，其結果由 host 在
結束時回報；還有 `tracks_usage`，表示當 host 比部署自己的限制更清楚時，這次嘗試是否計入部署的
每分鐘用量。

### `RouterEvent` {#routerevent}

| 事件 | 欄位 |
| --- | --- |
| `PickStarted` | `model` |
| `Selected` | `model_group`、`deployment_id`、`pick` |
| `Succeeded` | `deployment_id` |
| `AttemptFailed` | `deployment_id`、`kind`、`status` |
| `CooldownSet` | `deployment_id`、`cooldown` |
| `Retry` | `model_group`、`retry`、`delay` |
| `Fallback` | `from`、`to`、`order`、`depth`、`level`、`scope`、`parent`、`max_fallbacks`、`unroutable` |
| `FallbackDone` | `from`、`to`、`level`、`scope`、`parent`、`succeeded` |
| `Blocked` | `level`、`model`、`blocked` |
| `RetryLogged` | `scope`、`level`、`model`、`attempted_retries`、`cause` |
| `RetriesOpened` | `scope`、`max_retries`、`model_group_size` |
| `RetryBudget` | `scope`、`max_retries` |
| `PickFailed` | `level`、`model`、`error` |
| `LevelFailed` | `level`、`model`、`error`、`handling` |
| `MockFailed` | `mock`、`level`、`model`、`num_retries` |
| `RetryPolicyRaised` | `level`、`model`、`cause` |
| `RetryCountRaised` | `level`、`model`、`cause` |
| `FallingBack` | `level`、`model` |
| `OrderChainFailed` | `level`、`last_hop` |
| `FallbacksFailed` | `level`、`chain`、`last_hop` |
| `RetriesExhausted` | `model_group`、`attempted`、`max`、`level`、`picked` |

驅動程式使用較晚的事件，在那個時間點拋出呼叫者所預期的例外，並設定好重試與備援屬性。

### `FailureKind` {#failurekind}

種類有 `RateLimit`、`ContextWindowExceeded`、`ContentPolicyViolation`、
`Authentication`、`PermissionDenied`、`NotFound`、`BadRequest`、`Timeout`、
`ApiConnection`、`InternalServer`、`ServiceUnavailable`、`BadGateway`、
`GuardrailIntervention`（永遠不會被重試或備援）、`Declined`（litellm 在呼叫前拒絕了請求，
且它永遠不會讓部署冷卻）、`CallerCredentialAuthentication` 與 `CallerCredentialRateLimit`
（呼叫者自己的憑證失敗），以及 `Other`。
`AttemptError` 還加上 `status`、`retry_after`、`num_retries`、供冷卻記錄使用的提供者錯誤文字，
以及 `agentic_followup`，它標記在第一次呼叫已被服務之後失敗的代理程式後續呼叫，且永遠不會被重試。

### 建構時錯誤 {#build-time-errors}

當登錄表無法建構時，例如因為部署格式錯誤或 id 重複，或當 host 無法服務該設定時，`Router::new`
會回傳 `ConfigError`。`Unsupported` 會指出缺少什麼：host 無法選取時所用的策略或外掛，或 host
不支援的操作與提供者組合。在 `PythonHost` 之下這兩種情況都不會發生，因為它能服務每一個操作與策略。
