import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 📈 Prometheus 指標 {#-prometheus-metrics}

LiteLLM 會提供一個供 Prometheus 輪詢的 `/metrics` 端點

## 快速開始 {#quick-start}

如果您使用的是搭配 `litellm --config proxy_config.yaml` 的 LiteLLM CLI，那麼您需要 `uv add prometheus_client==0.20.0`。**這已經預先安裝在 litellm Docker 映像中**

將以下內容加入您的 proxy config.yaml 
```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
litellm_settings:
  callbacks:
    - prometheus
```

啟動 proxy
```shell
litellm --config config.yaml --debug
```

測試請求
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-4o",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

在 `/metrics` 上檢視指標：
```shell
curl http://localhost:4000/metrics \
  -H "Authorization: Bearer sk-..."
```

### 多個工作程序 {#multiple-workers}

當使用 LiteLLM 搭配多個工作程序時，您需要設定 `PROMETHEUS_MULTIPROC_DIR` 環境變數，才能啟用跨工作程序的彙總指標收集。

```shell
export PROMETHEUS_MULTIPROC_DIR="/prometheus_multiproc"
```

此目錄供 Prometheus client library 使用，用來儲存可在多個工作程序之間共享的指標檔案。請確定該目錄存在，且 LiteLLM 程序可寫入。

## 虛擬金鑰、團隊、內部使用者 {#virtual-keys-teams-internal-users}

用於追蹤每個 [user, key, team, etc.](virtual_keys)

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_spend_metric`                | 總支出，依 `"end_user", "hashed_api_key", "api_key_alias", "model", "team", "team_alias", "user"`                  |
| `litellm_total_tokens_metric`         | 每個 `"end_user", "hashed_api_key", "api_key_alias", "requested_model", "team", "team_alias", "user", "model"` 的輸入 + 輸出 token     |
| `litellm_input_tokens_metric`         | 每個 `"end_user", "hashed_api_key", "api_key_alias", "requested_model", "team", "team_alias", "user", "model"` 的輸入 token     |
| `litellm_output_tokens_metric`        | 每個 `"end_user", "hashed_api_key", "api_key_alias", "requested_model", "team", "team_alias", "user", "model"` 的輸出 token             |

#### Token 類型詳細指標 {#token-type-detail-metrics}

按 token 類型拆分的計數器，針對提供者回報的 `usage.prompt_tokens_details` 與 `usage.completion_tokens_details` 欄位（例如 OpenAI prompt 快取、Anthropic prompt 快取、音訊 I/O、推理 token）。這些會**加總**到上方總計之外——既有的 `litellm_input_tokens_metric` / `litellm_output_tokens_metric` / `litellm_total_tokens_metric` 計數器維持不變。

每個詳細計數器都是**稀疏**的：只有當提供者回報對應欄位的非零值時才會遞增，因此未公開某項詳細資訊的提供者不會為其產生序列。標籤集合與父層的輸入 / 輸出 token 計數器相同，因此您可以在 PromQL 中順利進行 join。

| 指標名稱                                      | `usage` 上的來源欄位                                              | 典型提供者                                  |
|--------------------------------------------------|----------------------------------------------------------------------|----------------------------------------------------|
| `litellm_input_cached_tokens_metric`             | `prompt_tokens_details.cached_tokens`                                | OpenAI prompt cache、Anthropic `cache_read_input_tokens`、DeepSeek `prompt_cache_hit_tokens` |
| `litellm_input_cache_creation_tokens_metric`     | `prompt_tokens_details.cache_creation_tokens`                        | Anthropic `cache_creation_input_tokens`（prompt cache writes） |
| `litellm_input_audio_tokens_metric`              | `prompt_tokens_details.audio_tokens`                                 | OpenAI `gpt-4o-audio-*`、Gemini 音訊輸入       |
| `litellm_output_reasoning_tokens_metric`         | `completion_tokens_details.reasoning_tokens`                         | OpenAI `o1-*` / `o3-*`、Anthropic extended thinking |
| `litellm_output_audio_tokens_metric`             | `completion_tokens_details.audio_tokens`                             | OpenAI `gpt-4o-audio-*` 音訊輸出              |

範例 PromQL — 某個 model group 的快取命中率：

```promql
sum by (requested_model) (rate(litellm_input_cached_tokens_metric_total[5m]))
/
sum by (requested_model) (rate(litellm_input_tokens_metric_total[5m]))
```

範例 PromQL — 輸出中的推理 token 佔比：

```promql
sum by (requested_model) (rate(litellm_output_reasoning_tokens_metric_total[5m]))
/
sum by (requested_model) (rate(litellm_output_tokens_metric_total[5m]))
```

:::info
`litellm_input_cached_tokens_metric` 會追蹤**提供者端**的 prompt-cache 讀取（提供者回報輸入內容中被快取的部分）。這與 `litellm_cached_tokens_metric` 不同，後者追蹤的是 LiteLLM 自身的回應快取命中（整個回應直接由 LiteLLM 的快取提供，且未發送任何提供者請求）。
:::

### 團隊 - 預算 {#team---budget}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_team_max_budget_metric`                    | 團隊標籤的最大預算：`"team", "team_alias"`|
| `litellm_remaining_team_budget_metric`             | 團隊剩餘預算（在 LiteLLM 上建立的團隊）標籤：`"team", "team_alias"`|
| `litellm_team_budget_remaining_hours_metric`        | 團隊預算重設前的剩餘小時數 標籤：`"team", "team_alias"`|

### 虛擬金鑰 - 預算 {#virtual-key---budget}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_api_key_max_budget_metric`                 | API 金鑰的最大預算 標籤：`"hashed_api_key", "api_key_alias"`|
| `litellm_remaining_api_key_budget_metric`                | API 金鑰剩餘預算（在 LiteLLM 上建立的金鑰）標籤：`"hashed_api_key", "api_key_alias"`|
| `litellm_api_key_budget_remaining_hours_metric`          | API 金鑰預算重設前的剩餘小時數 標籤：`"hashed_api_key", "api_key_alias"`|

### 虛擬金鑰 - 速率限制 {#virtual-key---rate-limit}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_remaining_api_key_requests_for_model`                | LiteLLM 虛擬 API 金鑰的剩餘請求數，僅在該虛擬金鑰已設定模型特定速率限制（rpm）時才會顯示。標籤：`"hashed_api_key", "api_key_alias", "model"`|
| `litellm_remaining_api_key_tokens_for_model`                | LiteLLM 虛擬 API 金鑰的剩餘 token 數，僅在該虛擬金鑰已設定模型特定 token 限制（tpm）時才會顯示。標籤：`"hashed_api_key", "api_key_alias", "model"`|

### 啟動時初始化預算指標 {#initialize-budget-metrics-on-startup}

如果您希望 litellm 無論是否收到請求，都為所有金鑰與團隊發出預算指標，請在 `config.yaml` 中將 `prometheus_initialize_budget_metrics` 設為 `true`

**運作方式：**

- 如果 `prometheus_initialize_budget_metrics` 設為 `true`
  - 每 5 分鐘 litellm 會執行一個 cron job，從資料庫讀取所有金鑰與團隊
  - 接著為每個金鑰、團隊發出預算指標
  - 這用於填充 `/metrics` 端點上的預算指標

```yaml
litellm_settings:
  callbacks: ["prometheus"]
  prometheus_initialize_budget_metrics: true
```


## Pod 健康指標 {#pod-health-metrics}

用這些指標來衡量每個 pod 的佇列深度，並診斷在 **LiteLLM 開始處理請求之前** 發生的延遲。

| 指標名稱 | 類型 | 說明 |
|---|---|---|
| `litellm_in_flight_requests` | Gauge | 目前在此 uvicorn worker 上進行中的 HTTP 請求數量。即時追蹤 pod 的佇列深度。使用多個 worker 時，數值會在所有存活的 worker 之間加總（`livesum`）。 |

### 何時使用這個指標 {#when-to-use-this}

LiteLLM 會從處理程序開始時測量延遲。如果請求在 handler 執行前先在 uvicorn 的 event loop 中等待，這段等待對 LiteLLM 自身的記錄是不可見的。`litellm_in_flight_requests` 顯示某個 pod 在任一時間點的負載情況。

```
high in_flight_requests + high ALB TargetResponseTime → pod overloaded, scale out
low  in_flight_requests + high ALB TargetResponseTime → delay is pre-ASGI (event loop blocking)
```

您也可以直接查看目前的值，而不必使用 Prometheus：

```bash
curl http://localhost:4000/health/backlog \
  -H "Authorization: Bearer sk-..."
# {"in_flight_requests": 47}
```

## Proxy 層級追蹤指標 {#proxy-level-tracking-metrics}

用這些指標來追蹤整體 LiteLLM Proxy 的使用情況。
- 追蹤傳送到 proxy 的實際流量速率 
- 針對送往 proxy 的請求，統計**用戶端**請求與失敗數量 

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_proxy_failed_requests_metric`             | proxy 回應失敗的總數 - 用戶端未從 litellm proxy 取得成功回應。標籤：`"end_user", "hashed_api_key", "api_key_alias", "requested_model", "team", "team_alias", "user", "user_email", "exception_status", "exception_class", "route", "model_id"`          |
| `litellm_proxy_total_requests_metric`             | 傳送至 proxy server 的請求總數 - 追蹤用戶端請求數量。標籤：`"end_user", "hashed_api_key", "api_key_alias", "requested_model", "team", "team_alias", "user", "status_code", "user_email", "route", "model_id"`。可選地包含 `"stream"` — 請參閱 [發出 Stream 標籤](#emit-stream-label)。          |

### 回呼記錄指標 {#callback-logging-metrics}

監控將記錄傳送到下游回呼（例如 `s3_v3` 冷儲存）時的失敗

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_callback_logging_failures_metric` | 針對已設定的 callback 發出 log 失敗的總次數。標籤：`"callback_name"`。可用於針對 callback 傳遞問題發出警示，例如寫入 `s3_v3`、`langfuse` 或 `langfuse_otel` 以及其他 otel provider 時發生的重複失敗 |

**支援的 Callback：**
- `S3Logger` - S3 v2 冷儲存失敗
- `langfuse` - Langfuse 記錄失敗
- `otel` -  OpenTelemetry 記錄失敗

## LLM 提供者指標 {#llm-provider-metrics}

用於 LLM API 錯誤監控，以及追蹤剩餘的 rate limit 與 token limit

### 追蹤的標籤 {#labels-tracked}

| 標籤 | 說明 |
|-------|-------------|
| litellm_model_name | LiteLLM 使用的 LLM 模型名稱 |
| requested_model | 請求中送出的模型 |
| model_id | 部署的 model_id。由 LiteLLM 自動產生，每個部署都有唯一的 model_id |
| api_base | 部署的 API Base |
| api_provider | LLM API provider，用於提供者。範例（azure、openai、vertex_ai） |
| hashed_api_key | 請求的雜湊後 API 金鑰 |
| api_key_alias | 使用的 API 金鑰別名 |
| team | 請求的團隊 |
| team_alias | 使用的團隊別名 |
| exception_status | 例外狀態（如果有） |
| exception_class | 例外類別（如果有） |

### 成功與失敗 {#success-and-failure}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
 `litellm_deployment_success_responses`              | 部署成功的 LLM API 呼叫總次數。標籤：`"requested_model", "litellm_model_name", "model_id", "api_base", "api_provider", "hashed_api_key", "api_key_alias", "team", "team_alias"` |
| `litellm_deployment_failure_responses`              | 特定 LLM 部署失敗的 LLM API 呼叫總次數。標籤：`"requested_model", "litellm_model_name", "model_id", "api_base", "api_provider", "hashed_api_key", "api_key_alias", "team", "team_alias", "exception_status", "exception_class"` |
| `litellm_deployment_total_requests`                 | 部署的 LLM API 呼叫總次數－成功 + 失敗。標籤：`"requested_model", "litellm_model_name", "model_id", "api_base", "api_provider", "hashed_api_key", "api_key_alias", "team", "team_alias"` |

### 剩餘請求與 token {#remaining-requests-and-tokens}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_remaining_requests_metric`             | 追蹤 LLM API Deployment 回傳的 `x-ratelimit-remaining-requests`。標籤：`"model_group", "api_provider", "api_base", "litellm_model_name", "hashed_api_key", "api_key_alias"` |
| `litellm_remaining_tokens_metric`                | 追蹤 LLM API Deployment 回傳的 `x-ratelimit-remaining-tokens`。標籤：`"model_group", "api_provider", "api_base", "litellm_model_name", "hashed_api_key", "api_key_alias"` |

### 部署狀態  {#deployment-state}
| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_deployment_state`             | 部署狀態：0 = 健康，1 = 部分故障，2 = 完全故障。標籤：`"litellm_model_name", "model_id", "api_base", "api_provider"` |
| `litellm_deployment_latency_per_output_token`       | 部署每個輸出 token 的延遲。標籤：`"litellm_model_name", "model_id", "api_base", "api_provider", "hashed_api_key", "api_key_alias", "team", "team_alias"` |

#### 備援（故障轉移）指標 {#fallback-failover-metrics}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_deployment_cooled_down`             | LiteLLM 負載平衡邏輯將某個部署降溫的次數。標籤：`"litellm_model_name", "model_id", "api_base", "api_provider"` |
| `litellm_deployment_successful_fallbacks`           | 從主要模型 -> 備援模型的備援請求成功次數。標籤：`"requested_model", "fallback_model", "hashed_api_key", "api_key_alias", "team", "team_alias", "exception_status", "exception_class"` |
| `litellm_deployment_failed_fallbacks`               | 從主要模型 -> 備援模型的備援請求失敗次數。標籤：`"requested_model", "fallback_model", "hashed_api_key", "api_key_alias", "team", "team_alias", "exception_status", "exception_class"` |

## 請求計數指標 {#request-counting-metrics}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_requests_metric`             | 依端點追蹤的請求總數。標籤：`"end_user", "hashed_api_key", "api_key_alias", "model", "team", "team_alias", "user", "user_email"` |

## 請求延遲指標  {#request-latency-metrics}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_request_total_latency_metric`             | 傳送到 LiteLLM Proxy Server 的請求總延遲（秒）－針對標籤 "end_user"、"hashed_api_key"、"api_key_alias"、"requested_model"、"team"、"team_alias"、"user"、"model"、"model_id" 追蹤 |
| `litellm_overhead_latency_metric`             | LiteLLM 處理所增加的延遲負擔（秒）－針對標籤 "model_group"、"api_provider"、"api_base"、"litellm_model_name"、"hashed_api_key"、"api_key_alias" 追蹤 |
| `litellm_overhead_with_guardrails_latency_metric`             | LiteLLM 處理所增加的延遲負擔（秒），包含 pre_call 與 post_call 防護欄－針對標籤 "model_group"、"api_provider"、"api_base"、"litellm_model_name"、"hashed_api_key"、"api_key_alias" 追蹤。During_call（moderation）防護欄會與 LLM API 呼叫同時執行，因此不包含在此數值中 |
| `litellm_llm_api_latency_metric`  | 僅 LLM API 呼叫的延遲（秒）－針對標籤 "model"、"hashed_api_key"、"api_key_alias"、"team"、"team_alias"、"requested_model"、"end_user"、"user" 追蹤 |
| `litellm_llm_api_time_to_first_token_metric`             | LLM API 呼叫的首 token 時間－針對標籤 `model`、`hashed_api_key`、`api_key_alias`、`team`、`team_alias`、`requested_model`、`end_user`、`user`、`model_id` 追蹤 [註：僅針對串流請求發出] |

## 在 Prometheus 上追蹤 `end_user` {#tracking-end_user-on-prometheus}

預設情況下，LiteLLM 不會在 Prometheus 上追蹤 `end_user`。這樣做是為了降低 LiteLLM Proxy 指標的基數。

如果您想在 Prometheus 上追蹤 `end_user`，可以執行以下操作：

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  callbacks: ["prometheus"]
  enable_end_user_cost_tracking_prometheus_only: true
```


### 發出串流標籤 {#emit-stream-label}

將 `stream` 標籤加到 `litellm_proxy_total_requests_metric`，以依串流與非串流來區分請求。預設停用。

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["prometheus"]
  prometheus_emit_stream_label: true
```

啟用後，`litellm_proxy_total_requests_metric` 會新增一個 `stream` 標籤，值為 `"True"`、`"False"` 或 `"None"`。

```
litellm_proxy_total_requests_metric{..., stream="True"} 42
litellm_proxy_total_requests_metric{..., stream="False"} 100
```

:::note
此標籤採 opt-in，因為在既有指標上新增一個新標籤會改變其基數，並破壞以此指標為目標的現有 Prometheus 查詢 / Grafana 儀表板。僅在全新部署上啟用，或在您準備好更新儀表板時再啟用。
:::

## [BETA] 自訂指標 {#beta-custom-metrics}

在 prometheus 上追蹤上述所有事件的自訂指標。

### 自訂中繼資料標籤 {#custom-metadata-labels}

1. 在 `config.yaml` 中定義自訂中繼資料標籤

```yaml
model_list:
  - model_name: openai/gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["prometheus"]
  custom_prometheus_metadata_labels: ["metadata.foo", "metadata.bar"]
```

2. 使用自訂中繼資料標籤發出請求

<Tabs>
<TabItem value="Curl" label="Curl Request">
```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <LITELLM_API_KEY>' \
-d '{
    "model": "openai/gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What's in this image?"
          }
        ]
      }
    ],
    "max_tokens": 300,
    "metadata": {
        "foo": "hello world"
    }
}'
```
</TabItem>
<TabItem value="key" label="on Key">

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "foo": "hello world"
    }
}'
```
</TabItem>
<TabItem value="team" label="on Team">

```bash
curl -L -X POST 'http://0.0.0.0:4000/team/new' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "foo": "hello world"
    }
}'
```
</TabItem>
</Tabs>

3. 檢查您的 `/metrics` 端點以查看自訂指標  

```
... "metadata_foo": "hello world" ...
```

### 自訂標籤 {#custom-tags}

將特定標籤追蹤為 prometheus 標籤，以便更好地篩選與監控。

1. 在 `config.yaml` 中定義自訂標籤

```yaml
model_list:
  - model_name: openai/gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["prometheus"]
  custom_prometheus_metadata_labels: ["metadata.foo", "metadata.bar"]
  custom_prometheus_tags: 
    - "prod"
    - "staging"
    - "batch-job"
    - "User-Agent: RooCode/*"
    - "User-Agent: claude-cli/*"
```

2. 使用標籤發出請求

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <LITELLM_API_KEY>' \
-d '{
    "model": "openai/gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What's in this image?"
          }
        ]
      }
    ],
    "max_tokens": 300,
    "metadata": {
        "tags": ["prod", "user-facing"]
    }
}'
```

3. 檢查您的 `/metrics` 端點以查看自訂標籤指標

```
... "tag_prod": "true", "tag_staging": "false", "tag_batch_job": "false" ...
```

**自訂標籤的運作方式：**
- 每個已設定的標籤在 prometheus 指標中都會成為一個布林標籤  
- 如果標籤符合（完全相符或萬用字元），標籤值為 `"true"`，否則為 `"false"`
- 標籤名稱會經過清理以符合 prometheus 相容性（例如，`"batch-job"` 會變成 `"tag_batch_job"`）
- 支援使用 `*` 的**萬用字元模式**（例如，`"User-Agent: RooCode/*"` 可匹配 `"User-Agent: RooCode/1.0.0"`）

**含萬用字元的範例：**
```yaml
litellm_settings:
  callbacks: ["prometheus"]
  custom_prometheus_tags:
    - "User-Agent: RooCode/*"
    - "User-Agent: claude-cli/*"
``` 

**使用案例：**
- 環境追蹤 (`prod`, `staging`, `dev`)
- 請求類型分類 (`batch-job`, `user-facing`, `background`)
- 功能旗標 (`new-feature`, `beta-users`)
- 團隊或服務識別 (`team-a`, `service-xyz`)
- User-Agent 追蹤 - 使用此項來追蹤 Roo Code、Claude Code、Gemini CLI 的使用量 (`User-Agent: RooCode/*`, `User-Agent: claude-cli/*`, `User-Agent: gemini-cli/*`)

## 設定指標與標籤 {#configuring-metrics-and-labels}

您可以選擇性地啟用特定指標並控制要包含哪些標籤，以最佳化效能並降低基數。

### 啟用特定指標與標籤 {#enable-specific-metrics-and-labels}

透過在 `prometheus_metrics_config` 中指定它們來設定要發出的指標。每個設定群組都需要一個 `group` 名稱（用於組織）以及一個要啟用的 `metrics` 清單。您也可以選擇性地包含一個 `include_labels` 清單，以篩選這些指標的標籤。

```yaml
model_list:
 - model_name: gpt-4o
    litellm_params:
      model: gpt-4o

litellm_settings:
  callbacks: ["prometheus"]
  prometheus_metrics_config:
    # High-cardinality metrics with minimal labels
    - group: "proxy_metrics"
      metrics:
        - "litellm_proxy_total_requests_metric"
        - "litellm_proxy_failed_requests_metric"
      include_labels:
        - "hashed_api_key"
        - "requested_model"
        - "model_group"
```

啟動 LiteLLM 時，如果您的指標已正確設定，您應該會在容器記錄中看到以下內容

<Image 
  img={require('../../img/prom_config.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

### 依每個指標篩選標籤 {#filter-labels-per-metric}

控制每個指標要包含哪些標籤，以降低基數：

```yaml
litellm_settings:
  callbacks: ["prometheus"]
  prometheus_metrics_config:
    - group: "token_consumption"
      metrics:
        - "litellm_input_tokens_metric"
        - "litellm_output_tokens_metric"
        - "litellm_total_tokens_metric"
      include_labels:
        - "model"
        - "team"
        - "hashed_api_key"
    - group: "request_tracking"
      metrics:
        - "litellm_proxy_total_requests_metric"
      include_labels:
        - "status_code"
        - "requested_model"
```

### 進階設定 {#advanced-configuration}

您可以建立多個具有不同標籤集合的設定群組：

```yaml
litellm_settings:
  callbacks: ["prometheus"]
  prometheus_metrics_config:
    # High-cardinality metrics with minimal labels
    - group: "deployment_health"
      metrics:
        - "litellm_deployment_success_responses"
        - "litellm_deployment_failure_responses"
      include_labels:
        - "api_provider"
        - "requested_model"
    
    # Budget metrics with full label set
    - group: "budget_tracking"
      metrics:
        - "litellm_remaining_team_budget_metric"
      include_labels:
        - "team"
        - "team_alias"
        - "hashed_api_key"
        - "api_key_alias"
        - "model"
        - "end_user"
    
    # Latency metrics with performance-focused labels
    - group: "performance"
      metrics:
        - "litellm_request_total_latency_metric"
        - "litellm_llm_api_latency_metric"
      include_labels:
        - "model"
        - "api_provider"
        - "requested_model"
```

**設定結構：**
- `group`：用於組織相關指標的描述性名稱
- `metrics`：要包含在此群組中的指標名稱清單  
- `include_labels`： （選用）要為這些指標包含的標籤清單

**預設行為**：如果未指定 `prometheus_metrics_config`，則所有指標都會以其預設標籤啟用（向後相容）。

## 監控系統健康狀態 {#monitor-system-health}

若要監控 litellm 相鄰服務（redis / postgres）的健康狀態，請執行：

```yaml
model_list:
 - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
litellm_settings:
  service_callback: ["prometheus_system"]
```

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_redis_latency`         | redis 呼叫的直方圖延遲     |
| `litellm_redis_fails`         | 失敗的 redis 呼叫數量    |
| `litellm_self_latency`         | 成功的 litellm API 呼叫的直方圖延遲    |

#### DB Transaction Queue 健康指標 {#db-transaction-queue-health-metrics}

使用這些指標來監控 DB Transaction Queue 的健康狀態。例如：監控記憶體內與 redis 緩衝區的大小。 

| 指標名稱                                         | 說明                                                                 | 儲存類型 |
|-----------------------------------------------------|-----------------------------------------------------------------------------|--------------|
| `litellm_pod_lock_manager_size`                     | 表示哪個 pod 持有寫入更新至資料庫的鎖。         | Redis    |
| `litellm_in_memory_daily_spend_update_queue_size`   | 記憶體內每日支出更新佇列中的項目數量。這些是每個使用者的彙總支出記錄。                 | In-Memory    |
| `litellm_redis_daily_spend_update_queue_size`       | Redis 每日支出更新佇列中的項目數量。這些是每個使用者的彙總支出記錄。                    | Redis        |
| `litellm_in_memory_spend_update_queue_size`         | keys、users、teams、team members 等的記憶體內彙總支出值。| In-Memory    |
| `litellm_redis_spend_update_queue_size`             | keys、users、teams 等的 Redis 彙總支出值。                  | Redis        |

## 🔥 LiteLLM 維護的 Grafana 儀表板  {#-litellm-maintained-grafana-dashboards}

連結至由 LiteLLM 維護的 Grafana 儀表板

https://github.com/BerriAI/litellm/tree/main/cookbook/litellm_proxy_server/grafana_dashboard

以下是您可以使用 LiteLLM Grafana Dashboard 監控的指標螢幕截圖

<Image img={require('../../img/grafana_1.png')} />

<Image img={require('../../img/grafana_2.png')} />

<Image img={require('../../img/grafana_3.png')} />

## 已棄用的指標  {#deprecated-metrics}

| 指標名稱          | 說明                          |
|----------------------|--------------------------------------|
| `litellm_llm_api_failed_requests_metric`             | **已棄用** 請改用 `litellm_proxy_failed_requests_metric` |

## `/metrics` 端點上的驗證 {#authentication-on-metrics-endpoint}

**預設情況下，`/metrics` 需要 LiteLLM API 金鑰驗證**（自 v1.85.0 起）。

對於 Prometheus，請將 `authorization` 加入您的 scrape config：

```yaml
scrape_configs:
  - job_name: 'litellm'
    authorization:
      type: Bearer
      credentials: <LITELLM_API_KEY>
    static_configs:
      - targets: ['localhost:4000']
```

若要允許未經驗證的存取：

```yaml
litellm_settings:
  require_auth_for_metrics_endpoint: false
```

## 常見問題  {#faq}

### `_created` 與 `_total` 指標有何不同？ {#what-are-_created-vs-_total-metrics}

- `_created` 指標是在代理程式啟動時建立的指標
- `_total` 指標是每個請求都會遞增的指標

您應該在計數用途上使用 `_total` 指標
