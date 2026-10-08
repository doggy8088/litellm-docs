# Grafana Cloud {#grafana-cloud}

透過 OTLP 將 LiteLLM 追蹤與 GenAI 指標傳送到 [Grafana Cloud](https://grafana.com/products/cloud/)

## 必要條件 {#prerequisites}

- 一個 Grafana Cloud 叢集
- 一個具有 `traces:write` 和 `metrics:write` 範圍的存取原則 token，來源為 **Connections > Add new connection > OpenTelemetry (OTLP)**
- 您的叢集 OTLP 端點與數字執行個體 ID，顯示在同一頁面上

## 設定 {#setup}

Grafana Cloud 使用 HTTP Basic auth 驗證 OTLP：使用者名稱是您的執行個體 ID，密碼是 token。一次建立憑證：

```shell
echo -n "<instance-id>:<access-policy-token>" | base64
```

將 LiteLLM 指向閘道：

```shell title=".env"
LITELLM_OTEL_V2=true
LITELLM_OTEL_INTEGRATION_ENABLE_METRICS=true

OTEL_EXPORTER="otlp_http"
OTEL_ENDPOINT="https://otlp-gateway-prod-us-west-0.grafana.net/otlp"
OTEL_HEADERS="Authorization=Basic%20<base64-from-above>"
```

```yaml title="config.yaml"
litellm_settings:
  callbacks: ["otel"]

callback_settings:
  otel:
    attributes:
      include_list:
        - gen_ai.operation.name
        - gen_ai.system
        - gen_ai.request.model
        - gen_ai.framework
        - metadata.user_api_key_team_id
```

`include_list` 會將指標屬性限制在有界集合中，這使得 `rate()` 和 `increase()` 能夠乾淨地彙總，並讓您的作用中序列數量維持在較低水準。請在傳送正式流量之前設定。它只適用於指標，因此追蹤會保留其完整屬性集；請參閱 [控制指標屬性基數](./opentelemetry_v2#control-metric-attribute-cardinality) 的 denylist 形式

啟動 proxy 並送出一個請求。追蹤會進入 Tempo，指標會進入代管的 Prometheus，兩者都可在 Explore 中查詢

:::info[為什麼是 `Basic%20` 而不是 `Basic `]

`OTEL_HEADERS` 遵循 OTLP 規格，該規格以 [W3C Baggage](https://www.w3.org/TR/baggage/#baggage-http-header-format) 格式編碼值，因此空格會寫成 `%20`。Grafana Cloud 的設定畫面會以完全相同的形式提供該值。直接使用文字空格也可以

:::

若只要傳送追蹤，請移除 `LITELLM_OTEL_INTEGRATION_ENABLE_METRICS`

## 追蹤 {#traces}

每個請求都是一條追蹤：路由的 server span、一個 `auth` span，以及一個 `chat <model>` span，內含模型、提供者、token 計數與延遲的標準化 [OpenTelemetry GenAI](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 屬性

![Grafana Cloud Tempo 中的 LiteLLM 追蹤](/img/observability/grafana_cloud_traces.png)

![LiteLLM LLM-call span 上的 gen_ai span 屬性](/img/observability/grafana_cloud_span_attributes.png)

## 指標 {#metrics}

指標會以 OTLP histogram 的形式到達，並可在 Explore 中依其 Prometheus 正規化名稱查詢：

| LiteLLM instrument | 可查詢為 |
|---|---|
| `gen_ai.client.operation.duration` | `gen_ai_client_operation_duration_seconds_bucket` |
| `gen_ai.client.token.usage` | `gen_ai_client_token_usage_bucket` |
| `gen_ai.usage.cost` | `gen_ai_usage_cost_USD_sum` |
| `gen_ai.server.time_to_first_token` | `gen_ai_server_time_to_first_token_seconds_bucket` |
| `gen_ai.server.time_per_output_token` | `gen_ai_server_time_per_output_token_seconds_bucket` |
| `gen_ai.client.response.duration` | `gen_ai_client_response_duration_seconds_bucket` |

![Grafana Cloud 中依模型區分的 LiteLLM GenAI 支出](/img/observability/grafana_cloud_metrics.png)

![Grafana Cloud 中依模型區分的 LiteLLM token 吞吐量](/img/observability/grafana_cloud_token_rate.png)

## 儀表板 {#dashboard}

LiteLLM 在 [cookbook/litellm_proxy_server/grafana_dashboard/dashboard_genai_otel](https://github.com/BerriAI/litellm/tree/main/cookbook/litellm_proxy_server/grafana_dashboard/dashboard_genai_otel) 提供了這些指標的儀表板。請從 **Dashboards > New > Import** 匯入 JSON，並選擇您的 Prometheus 資料來源

以統計方式呈現支出、token、請求次數與 p95 持續時間，接著按模型呈現請求速率、每小時支出、依輸入與輸出拆分的 token 吞吐量，以及 p95 持續時間、首個 token 的時間與提供者生成時間

![Grafana Cloud 中的 LiteLLM GenAI 儀表板](/img/observability/grafana_cloud_litellm_dashboard.png)

## Prometheus 指標 {#prometheus-metrics}

OTLP 路徑涵蓋每個請求的 GenAI 遙測。LiteLLM 的營運指標（配額、速率限制、部署健全狀態、支出）位於 proxy 的 `/metrics` 端點，並透過抓取到達 Grafana Cloud。將 [Grafana Alloy](https://grafana.com/docs/alloy/latest/) 指向 proxy：

```alloy title="config.alloy"
prometheus.scrape "litellm" {
  targets      = [{__address__ = "litellm-proxy:4000"}]
  bearer_token = "<litellm-api-key>"
  forward_to   = [prometheus.remote_write.grafana_cloud.receiver]
}

prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = "https://prometheus-prod-<region>.grafana.net/api/prom/push"
    basic_auth {
      username = "<instance-id>"
      password = "<access-policy-token>"
    }
  }
}
```

預設情況下，`/metrics` 需要 LiteLLM API 金鑰，而 `bearer_token` 會提供；請在 `litellm_settings` 下方設定 `require_auth_for_metrics_endpoint: false`，以不需驗證的方式公開它。多 worker 部署需要設定 `PROMETHEUS_MULTIPROC_DIR`，以便 workers 回報合併後的檢視

以與 OTLP 相同的方式限制標籤集合：

```yaml title="config.yaml"
litellm_settings:
  prometheus_metrics_config:
    - group: "core"
      metrics:
        - "litellm_proxy_total_requests_metric"
        - "litellm_spend_metric"
      include_labels:
        - "model"
        - "team"
```

請參閱 [Prometheus 指標](../proxy/prometheus) 以取得完整的指標參考，以及 LiteLLM 為其維護的儀表板
