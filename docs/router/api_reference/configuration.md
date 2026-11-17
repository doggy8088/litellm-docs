---
sidebar_label: "設定與預設值"
description: "每一個 litellm.Router 建構函式引數及其預設值，外加每個部署的覆寫與常數。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 設定與預設值 {#configuration-and-defaults}

{/* keep-version-note */}

`litellm.Router` 的建構函式引數，依其所控制的內容分組。SDK 使用者將它們傳給
`Router()`。在 proxy 的 `config.yaml` 中，它們位於 `router_settings` 之下，而
`model_list` 位於頂層。`litellm.router_api.router_init_args()` 會列出每一個可接受的名稱。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(
    model_list=model_list,
    routing_strategy="simple-shuffle",
    num_retries=2,
    fallbacks=[{"gpt-4o": ["claude-sonnet"]}],
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-eastus

router_settings:
  routing_strategy: simple-shuffle
  num_retries: 2
  fallbacks: [{"gpt-4o": ["claude-sonnet"]}]
```

</TabItem>
</Tabs>

`Router(**arguments)` 會將引數凍結為一個 `RouterConfig`，並在 router 的整個生命週期中
保持固定。用 `apply()` 變更它們，見[進入點](entry_points.md)。下方的預設值若寫著
`litellm.<name>`，表示該值來自處理程序設定，router 會在每次呼叫時以一個
`RouterDynamicConfig` 快照讀取它們。

![Router 建構函式引數分成五個領域：部署、選取、可靠性、狀態與健康狀態](../img/configuration-1.svg)

## 部署 {#deployments}

| 引數 | 預設值 | 意義 |
| --- | --- | --- |
| `model_list` | None | 各個部署，見 [Router 概念](../learn/concepts.md) |
| `model_group_alias` | `{}` | 名稱到群組的對應，或 `{"model": group, "hidden": true}` |
| `routing_groups` | None | 擁有各自策略的模型群組所組成的群組 |
| `default_litellm_params` | `{}` | 併入每一次呼叫。router 會將 `max_retries: 0` 加入其中 |
| `assistants_config`、`search_tools`、`guardrail_list` | None | router 所服務的非模型資源 |
| `ignore_invalid_deployments` | False | 略過有問題的部署，而不是讓建構失敗 |

## 選取 {#selection}

| 引數 | 預設值 | 意義 |
| --- | --- | --- |
| `routing_strategy` | `"simple-shuffle"` | 見[策略、路由群組與子路由器](../learn/strategies.md)中的策略表 |
| `routing_strategy_args` | `{}` | 策略選項，例如 latency routing 的 `ttl` 與 `lowest_latency_buffer` |
| `enable_pre_call_checks` | False | 對每個請求執行上下文視窗、區域與速率限制檢查 |
| `optional_pre_call_checks` | None | 額外的檢查，例如 prompt 快取或 Responses API 親和性 |
| `enable_tag_filtering`、`tag_filtering_match_any`、`tag_routing_prefix` | False、True、`""` | 依請求標籤對照部署標籤進行路由 |
| `plugins` | None | 縮小候選範圍或附加訊號的路由外掛 |
| `default_max_parallel_requests` | None | 當某個部署未設定時，每個部署的並行上限 |
| `provider_budget_config` | None | 由預算限制器篩選器強制執行的每個提供者預算 |
| `deployment_affinity_ttl_seconds`、`model_group_affinity_config`、`session_affinity_repin_on_failover` | 3600、None、False | 供工作階段與回應鏈使用的黏性路由 |
| `default_priority`、`polling_interval` | None、None | 優先順序排程器佇列，設定 Redis 時透過 router 的 Redis 共用 |

## 可靠性 {#reliability}

| 引數 | 預設值 | 意義 |
| --- | --- | --- |
| `num_retries` | `litellm.num_retries`，否則 2 | 同一個群組內的重試 |
| `retry_policy`、`model_group_retry_policy` | None、`{}` | 每種錯誤類型的重試次數，全 router 或每個群組 |
| `retry_after` | 0 | 退避重試前至少等待的秒數 |
| `timeout`、`stream_timeout` | None | 每次呼叫的逾時。部署自己的值優先 |
| `fallbacks` | `[]` | 針對任何錯誤的 `[{"group": ["other", ...]}]` |
| `context_window_fallbacks` | `[]` | 同上，針對 `ContextWindowExceededError` |
| `content_policy_fallbacks` | `[]` | 同上，針對 `ContentPolicyViolationError` |
| `default_fallbacks` | None | 成為 `fallbacks` 的 `"*"` 項目 |
| `max_fallbacks` | `litellm.max_fallbacks`，否則 5 | 備援的跳轉上限 |
| `fallback_on_unsupported_params` | True | 在不支援參數的 400 上進行備援 |
| `fallback_access_check`、`fallback_budget_check`、`fallback_rate_limit_check` | None | 可否決備援目標的 callable |
| `enable_weighted_failover` | False | 在備援之前先在群組內重新挑選，僅限 `simple-shuffle` |
| `enable_mid_stream_fallback_continuation` | False | 在備援群組上接續中斷的串流 |
| `cooldown_time` | 5 秒 | 一個部署保持冷卻狀態的時間 |
| `allowed_fails` | `litellm.allowed_fails`（3） | 每個冷卻視窗允許的失敗次數，僅在明確設定或變更自預設值時使用 |
| `allowed_fails_policy` | None | 每種錯誤類型允許的失敗次數 |
| `disable_cooldowns` | None | 關閉冷卻 |

## 狀態 {#state}

| 引數 | 預設值 | 意義 |
| --- | --- | --- |
| `redis_url`、`redis_host`、`redis_port`、`redis_password`、`redis_db` | None | 路由狀態背後的 Redis，見[共用狀態](../learn/shared_state.md) |
| `cache_kwargs` | `{}` | Redis 用戶端的額外引數 |
| `cache_responses`、`caching_groups` | False、None | 透過 `litellm.cache` 進行回應快取 |
| `client_ttl` | 3600 | 快取的提供者用戶端在重建前保留的秒數 |

## 健康狀態 {#health}

| 引數 | 預設值 | 意義 |
| --- | --- | --- |
| `enable_health_check_routing` | False | 移除未通過背景健康檢查的部署；且在設有 allowed fails 原則時，當冷卻會使候選歸零時忽略冷卻 |
| `health_check_staleness_threshold` | None | 健康檢查結果多舊仍可計入 |
| `health_check_ignore_transient_errors` | False | 不要因暫時性錯誤將部署標記為不健康 |
| `background_health_check_model_groups` | None | 將健康檢查限制在這些群組 |
| `alerting_config` | None | 路由事件的 Slack 警示 |

## 每個部署的覆寫 {#per-deployment-overrides}

這些放在部署的 `litellm_params` 中（有些也放在 `model_info` 中），並優先於全 router 的值。

| 鍵 | 效果 |
| --- | --- |
| `rpm`、`tpm` | 供用量感知策略與呼叫前檢查使用的限制，以及 simple-shuffle 權重 |
| `weight` | simple-shuffle 權重 |
| `order` | 群組內優先順序，最低者優先 |
| `cooldown_time` | 這個部署的冷卻時間，優先於 `Retry-After` 標頭與 router 的值 |
| `num_retries` | 落在此處的請求的重試次數 |
| `max_parallel_requests` | 並行上限 |
| `timeout`、`stream_timeout` | 每次呼叫的逾時 |
| `model_info.team_id` | 將部署限制給一個團隊 |
| `model_info.blocked` | 被管理員暫停 |

## 常數 {#constants}

來自 `litellm/constants.py`。每一個都可以用同名環境變數覆寫。

| 常數 | 預設值 | 用途 |
| --- | --- | --- |
| `DEFAULT_COOLDOWN_TIME_SECONDS` | 5 | router 的 `cooldown_time` 預設值 |
| `DEFAULT_COOLDOWN_REDIS_READ_INTERVAL_SECONDS` | 1.0 | 冷卻快取重新讀取 Redis 的頻率 |
| `DEFAULT_FAILURE_THRESHOLD_PERCENT` | 0.5 | 錯誤率冷卻門檻 |
| `DEFAULT_FAILURE_THRESHOLD_MINIMUM_REQUESTS` | 5 | 錯誤率計入前視窗內的最低請求數 |
| `SINGLE_DEPLOYMENT_TRAFFIC_FAILURE_THRESHOLD` | 1000 | 單一部署在 100% 失敗時可被冷卻所需的請求數 |
| `ROUTER_MAX_FALLBACKS` | 5 | `max_fallbacks` 預設值 |
| `DEFAULT_REDIS_SYNC_INTERVAL` | 1 | 用量計數器推送至 Redis 的間隔秒數 |
| `DEFAULT_MAX_RETRIES` | 2 | LiteLLM 其他地方的預設重試次數。router 使用 OpenAI SDK 的值，同樣是 2 |
| `INITIAL_RETRY_DELAY`、`MAX_RETRY_DELAY`、`JITTER` | 0.5、8.0、0.75 | 重試退避的秒數 |
