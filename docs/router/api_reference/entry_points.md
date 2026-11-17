---
sidebar_label: "進入點"
description: "litellm.Router 上的每一個公開方法：registry、settings、health、select、apply、observe、register_plugin 與 retire。"
---

# 進入點 {#entry-points}

<SinceVersion v="1.110.0" />

`litellm.Router` 除了它的端點方法之外，還公開了下列進入點，沒有其他東西。這些檢視與型別位於
`litellm/router_api.py`。「舊名稱」欄位指出 v1.109 及以下版本中，每個查詢所取代的 Router 成員。
舊名稱仍可透過 `DeprecatedRouterMembers` 使用，並伴隨一個 `DeprecationWarning`。

![Router facade 以及它回傳的 RouterRegistry、RouterSettings 與 RouterHealth 檢視，外加 apply
所接受的 ChangeSet，連同每個型別的成員](../img/entry-points-1.svg)

## `registry()` 回傳 `RouterRegistry` {#registry-returns-routerregistry}

針對已設定部署的唯讀查詢。router 將登錄表保存為一個不可變、版本化的快照，每個查詢都讀取目前的那一個。

| 查詢 | 回傳 | 舊名稱 |
| --- | --- | --- |
| `version` | 一個 int，在每次部署變更時遞增 | |
| `deployment(id)` | `Deployment` 或 None | `get_deployment` |
| `has_deployment(id)` | bool | `has_model_id` |
| `deployment_dict(id)` | 以其 model_list dict 表示的部署 | `get_model_info` |
| `deployment_model_info(id, model_name)` | 與定價對照表合併後的模型資訊 | `get_deployment_model_info` |
| `router_model_info(...)`、`discovered_model_info(id)`、`zero_cost()` | 路由模型資訊、提供者探索到的限制、零成本查詢 | `get_router_model_info`、`get_discovered_model_info`、`_zero_cost_cache` |
| `deployments(name, source="group")` | 該群組、其別名、路由群組，然後是萬用字元 | `get_model_list` |
| `deployments(name, source="all")` | 該群組的每一個部署 | `get_all_deployments` |
| `deployments(source="config")` | 來自設定的部署，而非 DB | `config_deployments` |
| `deployments(name, source="routable", request=, call_type=)` | 通過某個請求的路由檢查的部署 | `get_routable_deployments` |
| `deployments(name, source="first_in_group")` | 該群組的第一個部署 | `get_deployment_by_model_group_name` |
| `deployments(name, source=...)` | 還有 `named`、`alias`、`routing_groups`、`routed_group`、`wildcard`、`for_request` | 見 docstring |
| `all()` | 即時的 model list | `model_list` |
| `names(kind="groups")` | 每一個可路由的模型名稱 | `get_model_names` |
| `names(kind="group_set")` | 已設定群組名稱的集合 | `model_names` |
| `names(name, kind="ids")` | 部署 id，屬於一個群組或全部 | `get_model_ids` |
| `names(kind="team_public", team_id=)` | 一個團隊的部署的公開模型名稱 | `team_public_model_names_of` |
| `names(kind=...)` | 還有 `deployment_names`、`litellm_models`、`litellm_base_models`、`wildcard`、`route_candidates` | 見 docstring |
| `resolve(name, kind="group")` | 一個名稱路由到的模型群組 | `routable_model_group` |
| `resolve(name, kind="alias")` | 別名目標，或 None | `get_model_from_alias` |
| `resolve(name, kind="team_model", team_id=)` | 一個團隊的公開名稱對應到其群組 | `map_team_model` |
| `resolve(name, kind="recognized")` | router 是否認識這個名稱 | `is_recognized_model` |
| `resolve(id, kind="group_of_id")` | 一個部署 id 所屬的群組 | `get_model_group` |
| `resolve(name, kind=...)` | 還有 `served`、`from_id`、`upstream`、`wildcard_access_group`、`team_model_alternatives`、`routing_group_alternatives`、`search_tool_support` | 見 docstring |
| `group(name, field="info")` | 合併後的 `ModelGroupInfo` | `get_model_group_info` |
| `group(name, field=...)` | 還有 `cached_info`、`display_name`、`mode`、`service_tiers`、`max_input_tokens`、`token_limits`、`listing_info` | 見 docstring |
| `access_groups(...)` | 存取群組名稱對應到模型名稱 | `get_model_access_groups` |
| `credentials(id, form="params")` | 一個部署的憑證 | `get_deployment_credentials` |
| `plugins(kind)` | `auto`、`complexity`、`quality`、`adaptive` 子路由器、`routing` 外掛、`budget_limiter`、`prompt_caching_pins` | `auto_routers` 等 |
| `routing_group(name)` | 可作為該名稱呼叫的路由群組，或 None | `get_routing_group` |
| `client(deployment, client_type=None)` | router 為某個部署快取的 SDK 用戶端，或 None | `_get_client` |
| `aliases()`、`patterns()`、`routing_groups()`、`index(name)` | 別名對照表、萬用字元模式、路由群組、名稱索引 | 舊屬性 |

同一個檔案中的模組層級輔助函式不需要 Router。

| 函式 | 回傳 |
| --- | --- |
| `deployment_id(model_group, litellm_params)` | 一個沒有 id 的部署的穩定 id，與 router 使用的雜湊相同（舊為 `Router.generate_model_id`） |
| `deployment_usable_by_team(deployment, team_id)` | 一個團隊是否可以使用某個部署 |
| `router_init_args()` | `Router()` 接受的引數（舊為 `Router.get_valid_args`） |
| `fallback_chain(fallbacks, model_group)`、`request_fallback_chain(fallbacks, request_kwargs, model_group)` | 為某個群組設定的備援，或為某個請求設定的備援，以及 `*` 項目的索引 |
| `fallbacks_disabled(request_kwargs)` | 請求是否關閉了備援 |
| `references_provider_scoped_resource(request_kwargs)` | 請求是否指定了只有其提供者知道的檔案、批次或微調工作 |
| `deployment_metadata(request_kwargs)` | router 將挑選到的部署標記進去的中繼資料桶 |
| `mark_advisor_orchestration_failure(exception)` | 標記 advisor 協調失敗，使 router 不會冷卻它挑選到的部署 |

## `settings()` 回傳 `RouterSettings` {#settings-returns-routersettings}

一個已凍結的 dataclass，每個可讀設定一個欄位，列在 `SETTING_FIELDS` 中。它由 router 的靜態
`RouterConfig` 與目前的動態快照建構而成，且只能透過 `apply()` 變更。router 從未設定過的設定讀起來
是 None。請將欄位值視為唯讀。

`routing_strategy`、`fallbacks`、`context_window_fallbacks`、
`content_policy_fallbacks`、`default_deployment`、`default_litellm_params`、
`default_max_parallel_requests`、`cooldown_time`、`allowed_fails`、
`allowed_fails_policy`、`disable_cooldowns`、`enable_pre_call_checks`、
`enable_health_check_routing`、`health_check_ignore_transient_errors`、
`background_health_check_model_groups`、`enable_tag_filtering`、
`tag_filtering_match_any`、`tag_routing_prefix`、`router_general_settings`、
`provider_budget_config`、`provider_default_deployment_ids`、
`fallback_access_check`、`fallback_budget_check`、`fallback_rate_limit_check`、
`kubernetes_pod_discovery`、
`search_tools`、`guardrail_list`、`cache_responses`。

| 方法 | 回傳 | 舊名稱 |
| --- | --- | --- |
| `is_set(name)` | router 是否有這個設定 | |
| `as_dict()` | 以一般值表示的設定 | `get_settings` |
| `allowed_fails_for(exception)` | 在 `allowed_fails_policy` 下，某個錯誤允許的失敗次數 | `get_allowed_fails_from_policy` |
| `guardrail(name)` | 一個已設定的防護欄 | `get_available_guardrail` |

## `health()` 回傳 `RouterHealth` {#health-returns-routerhealth}

| 成員 | 回傳 | 舊名稱 |
| --- | --- | --- |
| `store` | 路由快取，見[路由狀態與快取鍵](state_and_cache_keys.md) | `cache` |
| `cooldowns` | 作用中的冷卻，`await cooldowns.async_get_active_cooldowns(model_ids=, parent_otel_span=)` | `cooldown_cache` |
| `health_checks` | 背景健康檢查結果 | `health_state_cache` |
| `latency` | 依部署區分的延遲樣本 | `deployment_latency_map` |
| `is_blocked(deployment)`、`all_blocked(deployments)` | 管理員是否暫停了它們 | `is_deployment_blocked`、`are_all_deployments_blocked` |
| `fully_blocked_model_names()` | 每個部署都被暫停的群組 | `get_fully_blocked_model_names` |
| `await fully_unhealthy_model_names()` | 每個部署都未通過健康檢查的群組 | `async_get_fully_unhealthy_model_names` |
| `await usage(group, kind="current")` | 這一分鐘的 tpm 與 rpm | `get_model_group_usage` |
| `await usage(group, kind="remaining")` | 群組限制還剩多少 | `get_remaining_model_group_usage` |
| `team_ptu_ceiling(team_id, group)` | 一個團隊的 PTU 份額上限 | `team_ptu_ceiling` |
| `split_priority(model, kwargs)` | 請求優先順序，以及移除它之後的 kwargs | `split_request_priority` |
| `failures_this_minute(id)` | 這一分鐘內計入某個部署的失敗 | `get_deployment_failures_for_current_minute` |
| `record_failure(id, exception, status)` | 計入一個 router 自己沒看到的失敗，在超過其 allowed fails 時讓部署冷卻，並說明它是否這樣做了 | 先 `increment_deployment_failures_for_current_minute`，再 `set_cooldown_deployments` |
| `priority_header_fields(model, kwargs, header)` | 優先順序標頭所設定的請求欄位 | `priority_header_update` |

## `select(model, request_kwargs=None, *, kind="pick", ...)` {#selectmodel-request_kwargsnone--kindpick-}

在不呼叫提供者的情況下執行挑選。`kind="pick"` 會回傳一個部署 dict，正是真實請求會得到的結果（舊為
`async_get_available_deployment`）。`kind="healthy"` 會回傳策略之前經過篩選的候選（舊為
`async_get_healthy_deployments`）。`kind="pass_through"` 會在 `use_in_pass_through=True` 的部署中挑選。
可選的關鍵字引數有 `messages`、`input`、`specific_deployment`、`parent_otel_span` 與 `health_check_probe`。

## `apply(changes)` 與 `aapply(changes)` {#applychanges-and-aapplychanges}

在 Router 建構完成後變更它的唯一方法。router 會在變更任何東西之前，先拒絕它不認識的 `assign`
名稱，然後依下方的順序套用各欄位。一個變更集不是一次交換，因此在套用變更集期間執行的請求，可能看到
較早的欄位已變更而較晚的還沒有，而中途出錯會讓較早的變更保留下來。各欄位如下。

| 欄位 | 效果 | 舊名稱 |
| --- | --- | --- |
| `assign` | 依原樣取代設定。名稱來自 `SETTING_FIELDS`、`PLAIN_SETTING_ATTRIBUTES`（`num_retries`、`max_fallbacks`、`retry_after`、`timeout`）或 `ASSIGNABLE_ALIASES`（`model_group_alias`） | `router.<field> = value` |
| `settings` | 已驗證的執行階段設定 | `update_settings(**settings)` |
| `upsert` | 依 `model_info.id` 新增或取代部署 | `upsert_deployment` |
| `delete` | 依 id 移除部署 | `delete_deployment` |
| `redis_cache` | 將路由狀態指向一個新的 Redis 快取 | `update_redis_cache` |
| `refresh_model_info`、`refresh_client` | 重新讀取探索到的模型資訊，可選擇搭配您的 HTTP 用戶端，僅限 `aapply` | `arefresh_model_info` |

兩者都回傳 `ApplyResult(version, upserted, deleted)`，帶有變更後的登錄表版本，以及每次 upsert 或
delete 之前存在的那個部署。

## 生命週期 {#lifecycle}

`observe(logging_obj=None, *, request_scoped=False)` 會回傳 router 的 `RoutingObservers`，它們會
接收 router 的路由事件。設定 `request_scoped=True` 時，router 會停止在全域註冊它的回呼，而傳入某個
請求的 `logging_obj` 會將它們綁定到那個請求。`register_plugin(strategy)` 會將一個
`CustomRoutingStrategyBase` 放在整個挑選的位置，見[自訂策略](../learn/strategies.md#custom-strategies)。
`retire()` 會釋放 router 的全域回呼註冊與路由狀態，供即將被取代的 Router 使用（舊為 `discard`）。
對已退休的 router 進行的呼叫會失敗。

## `RoutingContext` {#routingcontext}

路由外掛會收到它，而不是 Router。它有 `registry()`、`settings()` 與 `health()`，外加 `select`、
`observers`、`belongs_to`、`explicit_allowed_fails`、`pre_call_checks`、
`count_pre_call_check_tokens`、`update_kwargs_before_fallbacks`、`pre_routing_hook` 與 `log_retry`。
