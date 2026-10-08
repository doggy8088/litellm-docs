import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 可計費請求計量 {#billable-request-metering}

LiteLLM Enterprise [定價採用按使用量計費](../enterprise#how-is-pricing-structured)。可計費請求計量會回報該使用量。proxy 會計算對 LLM、MCP 和 A2A 端點的成功請求，並將一個 OpenTelemetry 計數器推送到 LiteLLM 的收集器，該收集器使用為您的部署核發的 mTLS 用戶端憑證進行驗證。

只會傳送請求數量。提示詞、回應、虛擬金鑰與您的授權金鑰都不會離開部署。計量會與您設定的任何 [OTEL 記錄](../observability/opentelemetry_integration) 分開執行，且絕不會接觸您的自有指標管線。

:::info

您需要 `LITELLM_LICENSE` 以及來自 LiteLLM onboarding 的計量憑證（`client.crt` 和 `client.key`）。少了其中一項？[聯絡我們](https://enterprise.litellm.ai/demo)。

:::

## 快速開始 {#quick-start}

### 1. 設定環境變數 {#1-set-environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `LITELLM_BILLING_METRICS_ENDPOINT` | 是 | 收集器 URL。請使用 `https://telemetry.litellm.ai` |
| `LITELLM_BILLING_METRICS_CLIENT_CERT` | 是 | mTLS 用戶端憑證。檔案路徑或內嵌 PEM |
| `LITELLM_BILLING_METRICS_CLIENT_KEY` | 是 | 憑證的私密金鑰。檔案路徑或內嵌 PEM |
| `LITELLM_BILLING_METRICS_CA_CERT` | 否 | 收集器的 CA 套件。若使用 `telemetry.litellm.ai`，請留空 |
| `LITELLM_BILLING_METRICS_EXPORT_INTERVAL_MS` | 否 | 推送間隔（毫秒）。預設 `60000` |

```bash
export LITELLM_LICENSE="eyJ..."
export LITELLM_BILLING_METRICS_ENDPOINT="https://telemetry.litellm.ai"
export LITELLM_BILLING_METRICS_CLIENT_CERT="/etc/litellm/billing-mtls/client.crt"
export LITELLM_BILLING_METRICS_CLIENT_KEY="/etc/litellm/billing-mtls/client.key"
```

憑證變數可接受檔案路徑或 PEM 內容本身。當您的密鑰存放區將值以環境變數注入且無法掛載檔案時，請使用內嵌 PEM，例如 ECS 搭配 AWS Secrets Manager 或 Cloud Run 搭配 Secret Manager。

您也可以在設定檔中設定這些項目：

```yaml
environment_variables:
  LITELLM_BILLING_METRICS_ENDPOINT: "https://telemetry.litellm.ai"
  LITELLM_BILLING_METRICS_CLIENT_CERT: "-----BEGIN CERTIFICATE-----\n..."
  LITELLM_BILLING_METRICS_CLIENT_KEY: "-----BEGIN PRIVATE KEY-----\n..."
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config config.yaml
```

### 3. 驗證 {#3-verify}

透過 proxy 傳送請求，然後檢查記錄是否有：

```
Enterprise billing metrics enabled: exporting to https://telemetry.litellm.ai every 60000 ms
```

如果缺少這一行，請尋找指出設定錯誤變數名稱的警告。計量問題絕不會影響請求服務。發生任何錯誤時，匯出器都會停用，而 proxy 會正常執行。

## 部署 {#deploy}

<Tabs>
<TabItem value="helm" label="Helm">

[標準 chart](https://github.com/BerriAI/litellm/tree/main/helm/litellm-helm) 與 [微服務 chart](./deploy#deploy-with-helm) 都有 `billingMetrics` 區塊，且預設為停用。

1. 從您核發的憑證建立 TLS Secret：

```bash
kubectl create secret tls litellm-billing-metrics-mtls --cert=client.crt --key=client.key
```

2. 在您的 values 中啟用計量：

```yaml
billingMetrics:
  enabled: true
```

此 chart 預設會尋找名為 `litellm-billing-metrics-mtls` 的 Secret。

| 值 | 預設值 | 說明 |
|-------|---------|-------------|
| `billingMetrics.enabled` | `false` | 啟用計量 |
| `billingMetrics.endpoint` | `https://telemetry.litellm.ai` | 收集器 URL |
| `billingMetrics.secretName` | `litellm-billing-metrics-mtls` | 現有的 TLS Secret，包含 `tls.crt` 和 `tls.key` |
| `billingMetrics.caSecretName` | `""` | 現有的 Secret，包含 `ca.crt`。若要使用預設收集器，請留空 |
| `billingMetrics.exportIntervalMs` | `""` | 推送間隔。proxy 預設為 `60000` |

</TabItem>
<TabItem value="terraform" label="Terraform (AWS / GCP)">

[`terraform/litellm/aws`](https://github.com/BerriAI/litellm/tree/main/terraform/litellm/aws)（ECS Fargate）與 [`terraform/litellm/gcp`](https://github.com/BerriAI/litellm/tree/main/terraform/litellm/gcp)（Cloud Run）中的參考堆疊在設定 `billing_metrics_endpoint` 時會啟用計量：

```hcl
billing_metrics_endpoint = "https://telemetry.litellm.ai"
```

```bash
export TF_VAR_billing_metrics_client_cert_pem="$(cat client.crt)"
export TF_VAR_billing_metrics_client_key_pem="$(cat client.key)"
```

此堆疊會將憑證和金鑰儲存在 Secrets Manager（AWS）或 Secret Manager（GCP）中，並將它們作為環境變數注入。不需要磁碟區。

</TabItem>
<TabItem value="docker" label="Docker">

```bash
docker run \
  -e LITELLM_LICENSE="eyJ..." \
  -e LITELLM_BILLING_METRICS_ENDPOINT="https://telemetry.litellm.ai" \
  -e LITELLM_BILLING_METRICS_CLIENT_CERT="$(cat client.crt)" \
  -e LITELLM_BILLING_METRICS_CLIENT_KEY="$(cat client.key)" \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -p 4000:4000 \
  ghcr.io/berriai/litellm:main-stable \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

## 什麼算作可計費 {#what-counts-as-billable}

當一個請求在 LLM 推論端點（chat completions、embeddings、responses、images、audio 以及其他推論路由）、MCP 傳輸，或 A2A `message/send` 路由上回傳 2xx 狀態時，就會計入。GET 讀取、管理端點、健康檢查探針，以及失敗的請求都不會計入。

計數會與 Admin UI 使用量頁面上的 **successful requests** 數字一致。

## 常見問題 {#faq}

**這會影響 proxy 效能嗎？** 在預設設定下幾乎沒有可感知的影響。每個請求的成本約為 1.6 微秒。

**如果收集器無法連線怎麼辦？** 請求不受影響。計數器是累計式的，因此在中斷期間記錄的計數會包含在下一次成功匯出中。

**重新啟動時會怎樣？** proxy 在關機時會刷新計數器，因此不會遺失任何計數。

**離線隔離部署呢？** 計量需要對收集器進行 HTTPS 對外連線。如果您的部署無法連線，請在 onboarding 期間與我們討論。
