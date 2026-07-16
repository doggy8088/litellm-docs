import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Datadog {#datadog}

LiteLLM 支援記錄到以下 Datdog 整合：
- `datadog` [Datadog Logs](https://docs.datadoghq.com/logs/)
- `datadog_llm_observability` [Datadog LLM Observability](https://www.datadoghq.com/product/llm-observability/)
- `datadog_metrics` [Datadog Custom Metrics](#datadog-custom-metrics)
- `datadog_cost_management` [Datadog Cloud Cost Management](#datadog-cloud-cost-management)
- `ddtrace-run` [Datadog Tracing](#datadog-tracing)

## Datadog 記錄 {#datadog-logs}

| 功能 | 詳細資訊 |
|---------|---------|
| **記錄內容** | [StandardLoggingPayload](../proxy/logging_spec) |
| **事件** | 成功 + 失敗 |
| **產品連結** | [Datadog Logs](https://docs.datadoghq.com/logs/) |

我們將使用 `--config` 來設定 `litellm.callbacks = ["datadog"]`，這會將所有成功的 LLM 呼叫記錄到 DataDog

**步驟 1**：建立 `config.yaml` 檔案並設定 `litellm_settings`：`success_callback`

```yaml
model_list:
 - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  callbacks: ["datadog"] # logs llm success + failure logs on datadog
  service_callback: ["datadog"] # logs redis, postgres failures on datadog
```


## Datadog LLM 可觀測性 {#datadog-llm-observability}

**概覽**

| 功能 | 詳細資訊 |
|---------|---------|
| **記錄內容** | [StandardLoggingPayload](../proxy/logging_spec) |
| **事件** | 成功 + 失敗 |
| **產品連結** | [Datadog LLM Observability](https://www.datadoghq.com/product/llm-observability/) |

```yaml
model_list:
 - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  callbacks: ["datadog_llm_observability"] # logs llm success logs on datadog
```


**步驟 2**：為 datadog 設定必要的環境變數

#### 直接 API {#direct-api}

將記錄直接傳送至 Datadog API：

```shell
DD_API_KEY="5f2d0f310***********" # your datadog API Key
DD_SITE="us5.datadoghq.com"       # your datadog base url
DD_SOURCE="litellm_dev"       # [OPTIONAL] your datadog source. use to differentiate dev vs. prod deployments
```

#### 透過 DataDog Agent {#via-datadog-agent}

透過本機 DataDog agent 傳送記錄（適用於容器化環境）：

```shell
LITELLM_DD_AGENT_HOST="localhost"         # hostname or IP of DataDog agent
LITELLM_DD_AGENT_PORT="10518"             # [OPTIONAL] port of DataDog agent (default: 10518)
DD_API_KEY="5f2d0f310***********"         # [OPTIONAL] your datadog API Key (Agent handles auth for Logs. REQUIRED for LLM Observability)
DD_SOURCE="litellm_dev"                   # [OPTIONAL] your datadog source
```

當設定 `LITELLM_DD_AGENT_HOST` 時，記錄會傳送到 agent，而不是直接傳送到 DataDog API。這對以下情境很有幫助：
- 在容器化環境中集中傳送記錄
- 減少來自多個服務的直接 API 呼叫
- 利用 agent 端處理與篩選

**注意：** 我們使用 `LITELLM_DD_AGENT_HOST` 取代 `DD_AGENT_HOST`，以避免與 `ddtrace` 的衝突；後者會自動為 APM tracing 設定 `DD_AGENT_HOST`。

> [!IMPORTANT]
> **Datadog LLM Observability**：即使使用 Datadog Agent（`LITELLM_DD_AGENT_HOST`），`DD_API_KEY` 仍然是**必要**的。agent 會充當 proxy，但 LLM Observability endpoint 仍強制要求 API key 標頭。

**步驟 3**：啟動 proxy，發送測試請求

啟動 proxy

```shell
litellm --config config.yaml --debug
```

測試請求

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "metadata": {
        "your-custom-metadata": "custom-field",
    }
}'
```

Datadog 上的預期輸出

<Image img={require('../../img/dd_small1.png')} />

### 遮罩訊息與回應 {#redacting-messages-and-responses}

本節說明如何在 Datadog LLM Observability 的已記錄負載中，從訊息與回應中遮罩敏感資料。

啟用遮罩後，實際的訊息內容與回應文字會從 Datadog 記錄中排除，但仍會保留 token 數量、延遲與模型資訊等中繼資料。

**步驟 1**：在您的 `config.yaml` 中設定遮罩

```yaml showLineNumbers title="config.yaml"
model_list:
 - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  callbacks: ["datadog_llm_observability"] # logs llm success logs on datadog

  # Params to apply only for "datadog_llm_observability" callback
  datadog_llm_observability_params:
    turn_off_message_logging: true # redacts input messages and output responses
```

**步驟 2**：送出 chat completion 請求

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

**步驟 3**：在 Datadog LLM Observability 中確認遮罩結果

在 Datadog LLM Observability 頁面上，您應該會看到輸入訊息與輸出回應都已被遮罩，而中繼資料（token 數量、時間、模型資訊）仍可見。

<Image img={require('../../img/dd_llm_obs.png')} />

<Image img={require('../../img/dd_llm_obs.png')} />

## Datadog 自訂指標 {#datadog-custom-metrics}

| 功能 | 詳細資訊 |
|---------|---------|
| **記錄內容** | 延遲指標、依狀態碼統計的請求數 |
| **事件** | 成功 + 失敗 |
| **產品連結** | [Datadog Metrics](https://docs.datadoghq.com/metrics/) |

透過 `/api/v2/series` endpoint 將以下指標發佈到 Datadog：

| 指標 | 類型 | 說明 |
|--------|------|-------------|
| `litellm.request.total_latency` | Gauge | 端到端請求延遲（秒） |
| `litellm.llm_api.latency` | Gauge | 等待 LLM 提供者回應所花費的時間（秒） |
| `litellm.llm_api.request_count` | Count | 請求次數，帶有狀態碼標記 |

使用 `total_latency` 和 `llm_api.latency`，您可以推導出**內部延遲** = `total_latency - llm_api.latency`。

所有指標都包含以下標籤：`env`、`service`、`version`、`HOSTNAME`、`POD_NAME`、`provider`、`model_name`、`model_group`、`team`、`status_code`。

**步驟 1**：建立 `config.yaml` 檔案

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  success_callback: ["datadog_metrics"]
  failure_callback: ["datadog_metrics"]
```

**步驟 2**：設定必要的環境變數

```shell
DD_API_KEY="your-api-key"
DD_SITE="us5.datadoghq.com"  # your datadog site
```

**步驟 3**：啟動 proxy 並發送測試請求

```shell
litellm --config config.yaml
```

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "hello"}]
}'
```

**步驟 4**：在 Datadog Metrics Explorer 中檢視指標

在 Datadog 中導覽至 **Metrics > Explorer**，並搜尋 `litellm.request.total_latency`、`litellm.llm_api.latency` 或 `litellm.llm_api.request_count`。

## Datadog 雲端成本管理 {#datadog-cloud-cost-management}

| 功能 | 詳細資訊 |
|---------|---------|
| **記錄內容** | 彙總的 LLM 成本（FOCUS 格式） |
| **事件** | 週期性上傳彙總成本資料 |
| **產品連結** | [Datadog Cloud Cost Management](https://docs.datadoghq.com/cost_management/) |

我們將使用 `--config` 來設定 `litellm.callbacks = ["datadog_cost_management"]`。這會定期將彙總的 LLM 成本資料上傳到 Datadog。

**步驟 1**：建立 `config.yaml` 檔案並設定 `litellm_settings`：`success_callback`

```yaml
model_list:
 - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  callbacks: ["datadog_cost_management"]
```

**步驟 2**：設定必要的環境變數

```shell
DD_API_KEY="your-api-key"
DD_APP_KEY="your-app-key" # REQUIRED for Cost Management
DD_SITE="us5.datadoghq.com"
```

**步驟 3**：啟動 proxy

```shell
litellm --config config.yaml
```

**運作方式**
* LiteLLM 會依提供者、模型、日期和標籤，在記憶體中彙總成本。
* Custom Costs API 需要 `DD_APP_KEY`。
* 成本會定期上傳（flush）。

### Datadog 分散式追蹤 {#datadog-tracing}

使用 `ddtrace-run` 在 litellm proxy 上啟用 [Datadog Tracing](https://ddtrace.readthedocs.io/en/stable/installation_quickstart.html)

**DD Tracer**
將 `USE_DDTRACE=true` 傳遞給 docker run 指令。當 `USE_DDTRACE=true` 時，proxy 會將 `ddtrace-run litellm` 作為 `ENTRYPOINT` 執行，而不只是 `litellm`

**DD Profiler**

將 `USE_DDPROFILER=true` 傳遞給 docker run 指令。當 `USE_DDPROFILER=true` 時，proxy 會啟用 [Datadog Profiler](https://docs.datadoghq.com/profiler/enabling/python/)。這對於除錯 CPU% 和記憶體使用量很有幫助。

我們不建議在正式環境中使用 `USE_DDPROFILER`。它僅建議用於除錯 CPU% 和記憶體使用量。

```bash
docker run \
    -v $(pwd)/litellm_config.yaml:/app/config.yaml \
    -e USE_DDTRACE=true \
    -e USE_DDPROFILER=true \
    -p 4000:4000 \
    docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml --detailed_debug
```

## 設定 DD 變數（`DD_SERVICE` 等） {#set-dd-variables-dd_service-etc}

LiteLLM 支援自訂以下 Datadog 環境變數

| 環境變數 | 說明 | 預設值 | 必要 |
|---------------------|-------------|---------------|----------|
| `DD_API_KEY` | 您的 Datadog API key，用於驗證（直接 API 必要，agent 選用） | None | 條件式* |
| `DD_SITE` | 您的 Datadog site（例如 "us5.datadoghq.com"）（直接 API 必要） | None | 條件式* |
| `LITELLM_DD_AGENT_HOST` | DataDog agent 的主機名稱或 IP（例如 "localhost"）。設定後，記錄會傳送到 agent 而非直接 API | None | ❌ 否 |
| `LITELLM_DD_AGENT_PORT` | DataDog agent 的記錄收集埠 | "10518" | ❌ 否 |
| `DD_ENV` | 您記錄的環境標籤（例如 "production"、"staging"） | "unknown" | ❌ 否 |
| `DD_SERVICE` | 您記錄的服務名稱 | "litellm-server" | ❌ 否 |
| `DD_LLMOBS_ML_APP` | LLM Observability 的預設 ml_app 名稱（Application 欄位）。可透過 `metadata.ml_app` 依請求覆寫。 | 預設為 `DD_SERVICE` | ❌ 否 |
| `DD_SOURCE` | 您記錄的來源名稱 | "litellm" | ❌ 否 |
| `DD_VERSION` | 您記錄的版本標籤 | "unknown" | ❌ 否 |
| `HOSTNAME` | 您記錄的主機名稱標籤 | "" | ❌ 否 |
| `POD_NAME` | Pod 名稱標籤（適用於 Kubernetes 部署） | "unknown" | ❌ 否 |

\* **使用 Direct API 時為必填**（預設）：`DD_API_KEY` 和 `DD_SITE` 為必填  
\* **使用 DataDog Agent 時為選填**：設定 `LITELLM_DD_AGENT_HOST` 以使用代理模式；Datadog Logs 不需要 `DD_API_KEY` 和 `DD_SITE`。（**注意：Datadog LLM Observability 需要 `DD_API_KEY`**）

## 自動標籤 {#automatic-tags}

如果請求中有可用資訊，LiteLLM 會自動將以下標籤加入您的 Datadog 記錄和指標：

| 標籤 | 說明 | 來源 |
|-----|-------------|--------|
| `team` | 與 API 金鑰相關聯的團隊別名或 ID | 中繼資料中的 `user_api_key_team_alias`、`team_alias`、`user_api_key_team_id` 或 `team_id` |
| `request_tag` | 在請求中傳遞的自訂標籤 | 記錄負載中的 `request_tags` |
