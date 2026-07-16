import Image from '@theme/IdealImage';

# New Relic {#new-relic}

## 必要條件 {#prerequisite}
若要將 LiteLLM 與 New Relic 搭配使用，您需要擁有 New Relic 帳戶以及 [license key](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/)。如果您尚未擁有 New Relic 帳戶，可以建立 [free tier account](https://newrelic.com/pricing/free-tier)。

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

若要在 LiteLLM 容器中內建 New Relic Python Agent，您可以使用以下 `Dockerfile`、`entrypoint.sh` 和 `supervisord.conf` 檔案。此流程會以官方 LiteLLM 容器作為基礎映像，安裝 New Relic Python Agent，並新增新的 entrypoint 與 supervisord 組態檔。產生的容器會執行 LiteLLM，並由 New Relic Python Agent 將 APM 遙測資料回報給 New Relic。啟用 callback 並設定上述環境變數後，您也會將 LLM 訊息回報給 New Relic。

若要建置容器映像，請將 `Dockerfile`、`entrypoint.sh` 和 `supervisord.conf` 檔案複製到某個目錄中。從這個目錄，您可以使用以下命令透過 CLI 建置映像。

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

Dockerfile 定義了新增到官方 LiteLLM 容器之上的各層。您應在實際建置映像時，透過設定 `BASE_TAG` 來選擇要使用的版本。此 Dockerfile 會安裝 New Relic Python Agent，然後新增新的 supervisor 與 entrypoint 檔案，以使用 New Relic Python Agent 執行 LiteLLM。

```dockerfile
ARG BASE_IMAGE=docker.litellm.ai/berriai/litellm
ARG BASE_TAG=latest
FROM ${BASE_IMAGE}:${BASE_TAG}

USER root

# Install New Relic agent (ensurepip bootstraps pip in case base image venv omits it)
RUN python -m ensurepip && python -m pip install --no-cache-dir 'newrelic>=12.1.0,<13'

# Copy New Relic-specific configuration files
COPY supervisord.conf /etc/supervisord_newrelic.conf
COPY entrypoint.sh /app/docker/newrelic/entrypoint.sh
RUN chmod +x /app/docker/newrelic/entrypoint.sh

# Override entrypoint to always use newrelic-admin
ENTRYPOINT ["/app/docker/newrelic/entrypoint.sh"]

LABEL org.opencontainers.image.description="LiteLLM with New Relic APM and AI monitoring"
```

#### `entrypoint.sh` {#entrypointsh}

這個 `entrypoint.sh` 是 LiteLLM 預設 `docker/prod_entrypoint.sh` 的複本，已修改為可執行 supervisord 或由 New Relic Python Agent 包裝的 `litellm` 程序。

```sh
#!/bin/sh
# This entry point is a copy of the litellm docker/prod_entrypoint.sh file
# with these changes:
#
#  - Use the New Relic-specific supervisor file
#  - Wrap the litellm command with New Relic Python Agent

if [ "$SEPARATE_HEALTH_APP" = "1" ]; then
    export LITELLM_ARGS="$@"
    export SUPERVISORD_STOPWAITSECS="${SUPERVISORD_STOPWAITSECS:-3600}"
    exec supervisord -c /etc/supervisord_newrelic.conf
fi

exec newrelic-admin run-program litellm "$@"
```

#### `supervisord.conf` {#supervisordconf}

如果您使用 supervisord 來執行 LiteLLM 並同時啟動獨立的 health app，這個版本可確保主要的 LiteLLM 程序是使用 New Relic Python Agent 啟動。

```ini
# This config is a copy of the litellm docker/supervisord.conf with a change to the `main` program
# to wrap the litellm command with the New Relic Python Agent.

[supervisord]
nodaemon=true
loglevel=info
logfile=/tmp/supervisord.log
pidfile=/tmp/supervisord.pid

[group:litellm]
programs=main,health

[program:main]
command=sh -c 'exec newrelic-admin run-program python -m litellm.proxy.proxy_cli --host 0.0.0.0 --port=4000 $LITELLM_ARGS'
autostart=true
autorestart=true
startretries=3
priority=1
exitcodes=0
stopasgroup=true
killasgroup=true
stopwaitsecs=%(ENV_SUPERVISORD_STOPWAITSECS)s
stdout_logfile=/dev/stdout
stderr_logfile=/dev/stderr
stdout_logfile_maxbytes = 0
stderr_logfile_maxbytes = 0
environment=PYTHONUNBUFFERED=true

[program:health]
command=sh -c '[ "$SEPARATE_HEALTH_APP" = "1" ] && exec uvicorn litellm.proxy.health_endpoints.health_app_factory:build_health_app --factory --host 0.0.0.0 --port=${SEPARATE_HEALTH_PORT:-4001} || exit 0'
autostart=true
autorestart=true
startretries=3
priority=2
exitcodes=0
stopasgroup=true
killasgroup=true
stopwaitsecs=%(ENV_SUPERVISORD_STOPWAITSECS)s
stdout_logfile=/dev/stdout
stderr_logfile=/dev/stderr
stdout_logfile_maxbytes = 0
stderr_logfile_maxbytes = 0
environment=PYTHONUNBUFFERED=true

[eventlistener:process_monitor]
command=python -c "from supervisor import childutils; import os, signal; [os.kill(os.getppid(), signal.SIGTERM) for h,p in iter(lambda: childutils.listener.wait(), None) if h['eventname'] in ['PROCESS_STATE_FATAL', 'PROCESS_STATE_EXITED'] and dict([x.split(':') for x in p.split(' ')])['processname'] in ['main', 'health'] or childutils.listener.ok()]"
events=PROCESS_STATE_EXITED,PROCESS_STATE_FATAL
autostart=true
autorestart=true
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

New Relic callback 也使用一個環境變數選項來停用內容記錄。此環境變數的預設值為 `true`。您可以將下列環境變數設為 `false`，以關閉內容訊息記錄。

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

## 支援 {#support}

如需此整合的支援，請聯絡 [New Relic 支援](https://docs.newrelic.com/docs/new-relic-solutions/solve-common-issues/find-help-get-support/)。
