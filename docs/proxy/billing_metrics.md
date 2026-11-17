import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 可計費請求計量 {#billable-request-metering}

LiteLLM Enterprise [定價採用按使用量計費](../enterprise#how-is-pricing-structured)。可計費請求計量會回報該使用量。proxy 會計算對 LLM、MCP 和 A2A 端點的成功請求。它會將一個 OpenTelemetry 計數器傳送到 LiteLLM 的收集器，並使用您部署的 OAuth client ID 與 secret 進行驗證。

計量會連同端點類別、路由、狀態、模型 ID、LiteLLM 版本，以及可取得時的授權 ID，一併傳送請求數量。提示詞、回應與虛擬金鑰絕不會離開部署。只有在其離線簽章檢查失敗時，閘道才會將授權金鑰傳送到 LiteLLM 授權伺服器。請參閱[啟用您的授權](../enterprise/activate.md)。計量會與您的 [OTEL 記錄](../observability/opentelemetry_integration) 及指標管線分開執行。

:::info

在 LiteLLM onboarding 期間取得 `LITELLM_LICENSE`、OAuth client ID 與 OAuth client secret。若您需要這些憑證，請[聯絡我們](https://enterprise.litellm.ai/demo)。

:::

這些 OAuth 設定取代了早期版本的憑證設定。請使用包含 [OAuth 計量實作](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/litellm/proxy/enterprise_billing/billing_metrics.py) 的 image。

## 快速開始 {#quick-start}

### 1. 設定環境變數 {#1-set-environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `LITELLM_BILLING_METRICS_ENDPOINT` | 是 | 收集器 URL。請使用 `https://telemetry.litellm.ai` |
| `LITELLM_BILLING_METRICS_CLIENT_ID` | 是 | 來自 LiteLLM onboarding 的 OAuth client ID |
| `LITELLM_BILLING_METRICS_CLIENT_SECRET` | 是 | 來自您的 secret manager 的 OAuth client secret |
| `LITELLM_BILLING_METRICS_TOKEN_URL` | 是 | 來自 onboarding 的 HTTPS OAuth token 端點 |
| `LITELLM_BILLING_METRICS_EXPORT_INTERVAL_MS` | 否 | 推送間隔（毫秒）。預設 `60000` |

```bash
export LITELLM_BILLING_METRICS_ENDPOINT="https://telemetry.litellm.ai"
export LITELLM_BILLING_METRICS_TOKEN_URL="https://litellm-prod.auth.us-west-1.amazoncognito.com/oauth2/token"
```

請透過您的 secret manager 注入 `LITELLM_LICENSE`、`LITELLM_BILLING_METRICS_CLIENT_ID` 與 `LITELLM_BILLING_METRICS_CLIENT_SECRET`。匯出器會透過 OAuth client-credentials 流程取得 bearer token。兩個 URL 都必須使用 HTTPS。

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config config.yaml
```

### 3. 驗證 {#3-verify}

下面這一行是以 INFO 等級記錄，因此只有在 proxy 以 `LITELLM_LOG=INFO`（或 `--detailed_debug`）執行時才會顯示。透過 proxy 傳送請求，然後檢查記錄是否有：

```
Enterprise billing metrics enabled: exporting to https://telemetry.litellm.ai every 60000 ms
```

如果缺少這一行，請尋找指出設定錯誤變數名稱的警告。啟動設定無效會停用計量。若計量失敗，proxy 仍會繼續提供請求服務。

## 部署 {#deploy}

<Tabs>
<TabItem value="helm" label="Helm">

[LiteLLM chart](./deploy/helm.md) 針對兩種部署模式都只有一個 `billingMetrics` 區塊。請透過您的 secret manager 建立一個名為 `litellm-billing-metrics` 的 Secret，其中包含 `client-id` 與 `client-secret` 金鑰。然後啟用計量：

```yaml title="values.yaml"
billingMetrics:
  enabled: true
  secretName: litellm-billing-metrics
```

| 值 | 預設值 | 說明 |
|-------|---------|-------------|
| `billingMetrics.enabled` | `false` | 啟用計量 |
| `billingMetrics.endpoint` | `https://telemetry.litellm.ai` | 收集器 URL |
| `billingMetrics.tokenUrl` | `https://litellm-prod.auth.us-west-1.amazoncognito.com/oauth2/token` | OAuth token 端點 |
| `billingMetrics.secretName` | `litellm-billing-metrics` | 包含 `client-id` 與 `client-secret` 的 Secret |
| `billingMetrics.exportIntervalMs` | `""` | 推送間隔。proxy 預設為 `60000` |

</TabItem>
<TabItem value="terraform" label="Terraform (AWS / GCP)">

[`terraform/litellm/aws`](https://github.com/BerriAI/litellm/tree/main/litellm/deploy/terraform/litellm/aws)（ECS Fargate）與 [`terraform/litellm/gcp`](https://github.com/BerriAI/litellm/tree/main/litellm/deploy/terraform/litellm/gcp)（Cloud Run）中的參考堆疊在設定 `billing_metrics_endpoint` 時會啟用計量：

```hcl
billing_metrics_endpoint  = "https://telemetry.litellm.ai"
billing_metrics_client_id = "your-client-id"
```

請透過您的 secret manager 提供 `TF_VAR_billing_metrics_client_secret`。該模組會將它儲存在 AWS Secrets Manager 或 Google Secret Manager 中，並注入到執行環境。Terraform state 含有該 secret，請限制對 state backend 的存取。若 onboarding 提供不同的 token 端點，請設定 `billing_metrics_token_url`。

</TabItem>
<TabItem value="docker" label="Docker">

請使用包含 OAuth 計量實作的相容 image，如 [Docker 指南](./docker_quick_start.md) 所述。將這些變數加入您現有的閘道容器：

```bash
docker run \
  --env-file litellm.env \
  -e LITELLM_BILLING_METRICS_ENDPOINT="https://telemetry.litellm.ai" \
  -e LITELLM_BILLING_METRICS_TOKEN_URL="https://litellm-prod.auth.us-west-1.amazoncognito.com/oauth2/token" \
  -v "$(pwd)/config.yaml:/app/config.yaml:ro" \
  -p 127.0.0.1:4000:4000 \
  "$LITELLM_IMAGE" \
  --config /app/config.yaml
```

將 `LITELLM_IMAGE` 設定為您已測試的 image 參照。請保持 `litellm.env` 的私密性。請包含您現有部署中的授權、OAuth client ID 與 secret、master key，以及資料庫連線設定。

</TabItem>
</Tabs>

## 什麼算作可計費 {#what-counts-as-billable}

當一個請求在 LLM 推論端點（chat completions、embeddings、responses、images、audio 以及其他推論路由）、MCP 傳輸，或 A2A `message/send` 路由上回傳 2xx 狀態時，就會計入。GET 讀取、管理端點、健康檢查探針，以及失敗的請求都不會計入。

計數會與 Admin UI 使用量頁面上的 **successful requests** 數字一致。

## 常見問題 {#faq}

**這會影響 proxy 效能嗎？** 在預設設定下沒有顯著影響。每個請求的成本約為 1.6 微秒。

**如果收集器無法連線怎麼辦？** 請求不受影響。計數器是累計式的，因此在中斷期間記錄的計數會包含在下一次成功匯出中。

**重新啟動時會怎樣？** proxy 會在正常關機時嘗試最後一次刷新。若發生當機或刷新失敗，在 proxy 匯出之前可能會遺失計數。

**離線隔離部署呢？** 計量需要對收集器與 OAuth token 端點進行 HTTPS 對外連線。如果您的部署無法連線，請在 onboarding 期間與我們討論。
