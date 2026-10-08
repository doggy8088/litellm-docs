import Image from '@theme/IdealImage';

# New Relic {#new-relic}

## 必要條件 {#prerequisite}
若要將 LiteLLM 與 New Relic 搭配使用，您需要擁有 New Relic 帳號以及 [license key](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/)。如果您還沒有 New Relic 帳號，可以建立一個 [free tier account](https://newrelic.com/pricing/free-tier)。

本頁涵蓋在 proxy 模式下將 New Relic 與 LiteLLM 搭配使用。您也可以在應用程式中包含 New Relic Python Agent，透過 LiteLLM SDK 使用 New Relic。請參閱 New Relic AI Monitoring [文件](https://docs.newrelic.com/docs/ai-monitoring/intro-to-ai-monitoring/)。

## 設定 {#configuration}

### 啟用 New Relic LiteLLM callback {#enable-new-relic-litellm-callback}

New Relic LiteLLM 擴充功能是以 callback 實作。啟用 callback 的常見方式是透過 `config.yaml` 檔案。透過 `config.yaml` 設定時，`callbacks` 清單可以包含多個值。只要清單中包含 `newrelic`，就會呼叫 New Relic LiteLLM callback。以下範例會在 LiteLLM 中啟用 New Relic callback。

```yaml
litellm_settings:
  callbacks: ["newrelic"]
```

您也可以透過 LiteLLM 管理介面設定 callback。如果您使用此選項，請參閱
[LiteLLM admin UI 文件](https://docs.litellm.ai/docs/proxy/ui) 以存取管理介面，並在 `Settings` 區段中加入 New Relic callback。

### 必要的環境變數 {#required-environment-variables}

[New Relic Python Agent](https://docs.newrelic.com/docs/apm/agents/python-agent/getting-started/introduction-new-relic-python/) 需要設定才能將遙測資料回報給 New Relic。New Relic Python Agent 支援透過組態檔與環境變數定義 [設定](https://docs.newrelic.com/docs/apm/agents/python-agent/configuration/python-agent-configuration/)。搭配 LiteLLM 時，建議使用環境變數，但兩種方式都可運作。

`NEW_RELIC_APP_NAME` 環境變數應設定為您希望 LiteLLM 伺服器在 New Relic UI 中顯示的名稱。`NEW_RELIC_LICENSE_KEY` 環境變數值是您要將遙測資料回報到的 New Relic 帳戶之授權金鑰。

```shell
NEW_RELIC_APP_NAME=<app name>
NEW_RELIC_LICENSE_KEY=<license key>
```

## 使用 New Relic Python Agent 執行 LiteLLM {#running-litellm-with-new-relic-python-agent}

[New Relic Python Agent](https://docs.newrelic.com/docs/apm/agents/python-agent/getting-started/introduction-new-relic-python/) 用於應用程式中，將 [Application Performance Monitoring (APM)](https://docs.newrelic.com/docs/apm/new-relic-apm/getting-started/introduction-apm/) 遙測資料回報給 New Relic。依照以下步驟操作後，New Relic 客戶將可同時收到 LiteLLM 的 APM 遙測資料，以及來自其 LiteLLM 伺服器的 [AI Monitoring](https://docs.newrelic.com/docs/ai-monitoring/intro-to-ai-monitoring/) 中的 LLM 訊息。

### 建置支援 New Relic 的容器（建議） {#building-a-new-relic-enabled-container-recommended}

官方 LiteLLM 容器包含 New Relic callback，但不包含 New Relic Python Agent。將 New Relic Python Agent 加入的最簡單方式，是建立一個新的容器映像，將 agent 疊加在現有 LiteLLM 映像之上。如此一來，您就能定義要使用的官方 LiteLLM 映像版本作為基礎。

若要建立一個內含 New Relic Python Agent 的 LiteLLM container，您可以使用以下 `Dockerfile` 和 `entrypoint.sh` 檔案。此流程會使用官方 LiteLLM container 作為基底映像檔、安裝 New Relic Python Agent，並新增一個新的 entrypoint。產生的 container 會執行 LiteLLM，並由 New Relic Python Agent 將 APM 遙測資料回報給 New Relic。啟用 callback 並設定上方的環境變數後，您也會將 LLM 訊息回報給 New Relic。

若要建置 container 映像檔，請將 `Dockerfile` 和 `entrypoint.sh` 檔案複製到某個目錄中。從這個目錄，您可以使用以下命令透過 CLI 建置映像檔。

```shell
docker build -f Dockerfile -t litellm-newrelic:local .
```

如果您想指定作為基礎的 LiteLLM 映像版本，請傳入 `--build-arg BASE_IMAGE=…` 和/或 `--build-arg BASE_TAG=…`，以指定不同的基礎映像或標籤，類似下列命令。

```shell
BASE_TAG=v1.89.4
docker build \
  --build-arg BASE_IMAGE=docker.litellm.ai/berriai/litellm \
  --build-arg BASE_TAG=${BASE_TAG} \
  -f Dockerfile \
  -t litellm-newrelic:${BASE_TAG} \
  .
```

您可以為輸出映像使用任何符合您命名政策的 docker 名稱。您也可能希望將產生的 docker 映像推送到您選擇的容器儲存庫。

#### `Dockerfile` {#dockerfile}

Dockerfile 定義了在官方 LiteLLM container 之上新增的各層。您應該在實際建置映像檔時，透過設定 `BASE_TAG` 來選擇要使用的版本。這個 Dockerfile 會安裝 New Relic Python Agent，然後新增一個由 New Relic Python Agent 執行 LiteLLM 的 entrypoint。

```dockerfile
ARG BASE_IMAGE=docker.litellm.ai/berriai/litellm
ARG BASE_TAG=latest
FROM ${BASE_IMAGE}:${BASE_TAG}

USER root

# Install New Relic agent (ensurepip bootstraps pip in case base image venv omits it)
RUN python -m ensurepip && python -m pip install --no-cache-dir 'newrelic>=12.1.0,<13'

# Copy the New Relic entrypoint
COPY entrypoint.sh /app/docker/newrelic/entrypoint.sh
RUN chmod +x /app/docker/newrelic/entrypoint.sh

# Override entrypoint to always use newrelic-admin
ENTRYPOINT ["/app/docker/newrelic/entrypoint.sh"]

LABEL org.opencontainers.image.description="LiteLLM with New Relic APM and AI monitoring"
```

#### `entrypoint.sh` {#entrypointsh}

這個 `entrypoint.sh` 會取代 LiteLLM 預設的 `docker/prod_entrypoint.sh`，並執行由 New Relic Python Agent 包裝的 `litellm` process。

```sh
#!/bin/sh
exec newrelic-admin run-program litellm "$@"
```

### 從 LiteLLM 原始碼執行 {#running-from-litellm-source}

LiteLLM 原始碼使用 `uv` 管理相依性。若要執行 LiteLLM 的 New Relic 整合，請先在本機安裝 New Relic Python Agent。最簡單的方式是使用 `uv` 進行安裝。

```shell
make install-proxy-dev
uv pip install 'newrelic>=12.1.0,<13'
```

接著，您可以使用此命令，透過 New Relic Python Agent 在本機從原始碼執行 `litellm`。請在命令末尾加入您可能需要的任何其他選項，例如 `--config config.yaml` 或 `--debug`。

```shell
uv run newrelic-admin run-program litellm
```

### 驗證 {#verification}

#### LiteLLM 容器記錄 {#litellm-container-logs}

當 New Relic callback 初始化時，會寫入一則 INFO 記錄訊息，確認初始化完成以及是否已啟用 LLM 內容記錄。如果看不到 INFO 記錄訊息，請設定 `LITELLM_LOG=INFO` 環境變數以啟用它們。請尋找如下格式的訊息：

```log
New Relic AI Monitoring initialized for app: {app-name}, content recording: {True / False}
```

#### New Relic AI 監控 {#new-relic-ai-monitoring}

[New Relic AI Monitoring](https://docs.newrelic.com/docs/ai-monitoring/intro-to-ai-monitoring/) 可用來驗證是否已接收 LLM 中繼資料和/或內容。從 `AI Responses` 檢視中，您應會在 LiteLLM 傳回請求後不久，在 `Responses` 資料表中看到 LLM 請求。如果已啟用 LLM 內容記錄，LLM 請求/回應訊息將會出現在 `Responses` 資料表中。選取資料表中的某一列將顯示該 LLM 請求的更多詳細資訊。追蹤詳細資料可能需要 2-3 分鐘才會顯示。

## 進階設定選項 {#advanced-configuration-options}

### 停止將 LLM 訊息傳送到 New Relic {#disable-sending-llm-messages-to-new-relic}

您可以透過下列任一方式停用將 LLM 訊息傳送到 New Relic。

`config.yaml` 檔案可用來設定一個旗標，以停用將 LLM 訊息傳送到 New Relic。由於您可能希望將 LLM 訊息傳送到其他地方（記錄）而不是 New Relic，因此可設定一個僅供 New Relic 使用的組態值。將下列內容加入您的 `config.yaml`，即可防止 LLM 訊息傳送到 New Relic。

```yaml
litellm_settings:
  callbacks: ["newrelic"]
  newrelic_params:
    turn_off_message_logging: true
```

New Relic callback 也會讀取一個環境變數選項，以停用內容記錄。此環境變數的預設值為 `true`。您可以將下列環境變數設為 `false` 來關閉內容訊息記錄。

```shell
NEW_RELIC_AI_MONITORING_RECORD_CONTENT_ENABLED=false
```

如果您使用 LiteLLM 管理介面來新增 New Relic callback，表單中有一個可接受布林值的選項。此布林值遵循與環境變數相同的規則（`true` 或空白表示記錄 LLM 訊息，`false` 表示關閉內容訊息記錄）。

### New Relic Agent 設定 {#new-relic-agent-configuration}

New Relic Python Agent 有 [多種方式](https://docs.newrelic.com/docs/apm/agents/python-agent/configuration/python-agent-configuration/) 可接受設定。如上所示，可使用環境變數在 agent 中設定各種選用組態。

也可以使用 agent 組態檔，取代環境變數。如果您偏好使用組態檔，則需要確保該組態檔可存取。您也應將下列環境變數設定為指向您的組態檔。

```shell
NEW_RELIC_CONFIG_FILE=</path/to/newrelic/configuration_file>
```

### 建議的組態覆寫 {#recommended-configuration-overrides}

New Relic LiteLLM 擴充功能會將遙測傳送至 New Relic，讓訊息顯示為 New Relic AI Monitoring 功能的一部分。使用此功能時，建議採用下列組態。這些組態可透過環境變數或組態檔設定。

```shell
NEW_RELIC_CUSTOM_INSIGHTS_EVENTS_MAX_ATTRIBUTE_VALUE=4095
NEW_RELIC_CUSTOM_INSIGHTS_EVENTS_MAX_SAMPLES_STORED=100000
```

## 依團隊路由（OTel v2） {#per-team-routing-otel-v2}

每個 LiteLLM 團隊都可以使用該團隊自己的 ingest license key，將其追蹤資料與成本指標傳送到各自的 New Relic 帳號。沒有設定 key 的團隊請求不會向 New Relic 匯出任何內容。

需要 proxy 以以下方式執行：

```shell
LITELLM_OTEL_V2=true
```

設定團隊 callback（proxy admin 或 org admin）：

```shell
curl -X POST 'http://localhost:4000/team/{team_id}/callback' \
  -H 'Authorization: Bearer <master-or-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "newrelic",
    "callback_type": "success",
    "callback_vars": {
      "newrelic_api_key": "<team ingest license key, 40 chars ending NRAL>",
      "newrelic_region": "us"
    }
  }'
```

`newrelic_region` 接受 `us` 或 `eu`，並為追蹤資料（OTLP）與成本指標（Metric API）選擇資料中心。該 key 會以加密方式儲存，讀回時會被遮蔽。請求內容不能提供 `newrelic_api_key` 或 `newrelic_region`；只有管理員設定的團隊或 key callback 設定才會被採用。

追蹤資料會以 OTLP `gen_ai.*` spans 形式送達，並帶有 `litellm.team.id`、`litellm.team.alias` 和 `litellm.cost.*` attributes。成本指標會以 `litellm.requests`、`litellm.cost.usd`、`litellm.tokens.*` 計數與 `litellm.request.duration_ms` 摘要送達，並依 `team_id`、`team_alias`、`model_group`、`model`、`custom_llm_provider` 和 `status` 分面。

團隊預算會以兩個依 `team_id` 和 `team_alias` 分面的儀表送達：`litellm.team.max_budget` 是團隊設定的 `max_budget`，而 `litellm.team.remaining_budget` 是 `max_budget` 減去團隊支出（包含產生該支出的請求）的結果。沒有 `max_budget` 的團隊不會傳送這兩個儀表。可使用 `SELECT latest(litellm.team.remaining_budget) FROM Metric FACET team_alias` 在 NRQL 中查詢它們。

針對沒有團隊憑證的流量，可選擇提供 operator 層級的備援：

```shell
NEW_RELIC_LICENSE_KEY=<operator ingest key>
NEW_RELIC_REGION=us
```

使用 `LITELLM_OTEL_V2=true` 時，`newrelic` callback 會透過 OTLP 匯出，而不是載入 Python agent；`NEW_RELIC_AI_MONITORING_RECORD_CONTENT_ENABLED=false` 仍會在 OTLP 路徑上停用訊息內容擷取。請注意，OTLP 路徑可用於分散式追蹤、儀表板、NRQL 和警示；但不會填入 New Relic AI Monitoring 產品 UI。

## 支援 {#support}

如需此整合的支援，請聯絡 [New Relic 支援](https://docs.newrelic.com/docs/new-relic-solutions/solve-common-issues/find-help-get-support/)。
