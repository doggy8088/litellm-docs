# Grafana Pyroscope CPU 記錄 {#grafana-pyroscope-cpu-profiling}

LiteLLM proxy 可在透過環境變數啟用時，將持續的 CPU 設定檔傳送至 [Grafana Pyroscope](https://grafana.com/docs/pyroscope/latest/)。這是選用功能，預設為關閉。

## 快速開始 {#quick-start}

1. **安裝選用相依套件**（僅在啟用 Pyroscope 時需要）：

   ```bash
   uv add pyroscope-io
   ```

   或安裝 proxy 額外套件：

   ```bash
   uv add "litellm[proxy]"
   ```

2. **在啟動 proxy 前設定環境變數**：

   | 變數 | 必填 | 說明 |
   |----------|----------|-------------|
   | `LITELLM_ENABLE_PYROSCOPE` | 是（若要啟用） | 設為 `true` 以啟用 Pyroscope 設定檔記錄。 |
   | `PYROSCOPE_APP_NAME` | 是（啟用時） | 顯示在 Pyroscope UI 中的應用程式名稱。 |
   | `PYROSCOPE_SERVER_ADDRESS` | 是（啟用時） | Pyroscope 伺服器 URL（例如 `http://localhost:4040`）。 |
   | `PYROSCOPE_SAMPLE_RATE` | 否 | 採樣率（整數）。若未設定，會使用 pyroscope-io 函式庫的預設值。 |
   | `PYROSCOPE_GRAFANA_USER` | 否 | Grafana Cloud Pyroscope 使用者／tenant ID。當設定 `PYROSCOPE_GRAFANA_API_TOKEN` 時為必填。 |
   | `PYROSCOPE_GRAFANA_API_TOKEN` | 否 | Grafana Cloud API／存取政策權杖。用作 Pyroscope 基本驗證密碼。 |

3. **啟動 proxy**；當 proxy 啟動時，記錄將會自動開始。

   ```bash
   export LITELLM_ENABLE_PYROSCOPE=true
   export PYROSCOPE_APP_NAME=litellm-proxy
   export PYROSCOPE_SERVER_ADDRESS=http://localhost:4040
   litellm --config config.yaml
   ```

   對於 Grafana Cloud Pyroscope，請使用 Profiles endpoint 作為 `PYROSCOPE_SERVER_ADDRESS`
   並設定 Grafana Cloud 憑證：

   ```bash
   export LITELLM_ENABLE_PYROSCOPE=true
   export PYROSCOPE_APP_NAME=litellm-proxy
   export PYROSCOPE_SERVER_ADDRESS=https://profiles-prod-<region>.grafana.net
   export PYROSCOPE_GRAFANA_USER=<grafana-cloud-pyroscope-user>
   export PYROSCOPE_GRAFANA_API_TOKEN=<grafana-cloud-api-or-access-policy-token>
   litellm --config config.yaml
   ```

4. **在 Pyroscope（或 Grafana）UI 中檢視設定檔**，並選取您的 `PYROSCOPE_APP_NAME`。

## 注意事項 {#notes}

- **選用相依套件**：`pyroscope-io` 是選用相依套件。若未安裝且 `LITELLM_ENABLE_PYROSCOPE=true`，proxy 會記錄警告並在不進行記錄的情況下繼續執行。
- **平台支援**：`pyroscope-io` 套件使用原生擴充功能，並非所有平台都可用（例如，該套件排除 Windows）。
- **其他設定**：請參閱[設定選項](/proxy/config_settings)以取得所有 proxy 環境變數。
