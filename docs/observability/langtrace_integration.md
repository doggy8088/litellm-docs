import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Langtrace {#langtrace}

適用於 LLM 應用程式的開源可觀測性與評估，請見 [langtrace.ai](https://langtrace.ai/)。

:::info
我們想了解如何讓回呼變得更好！歡迎與 LiteLLM [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)聯繫，或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

```shell
uv add litellm
```

Langtrace 會在自訂路徑（`/api/trace`）透過 `x-api-key` 標頭接收 OTLP，而 OpenTelemetry v2 則會在沒有 Langtrace 憑證的情況下匯出到 `/v1/traces`。使用 `LITELLM_OTEL_V2=true` 時，請在兩者之間執行 OpenTelemetry Collector：litellm 匯出到 collector，再由 collector 使用您的金鑰將 spans 轉送到 Langtrace。`langtrace` 預設會套用 Langtrace 的屬性結構；collector 只負責傳遞，因此 `LANGTRACE_API_KEY` 會放在 collector 的環境中，而不是 proxy 的環境中

若沒有 `LITELLM_OTEL_V2`，`langtrace` 回呼會直接以設定在 proxy 上的 `LANGTRACE_API_KEY` 作為 `x-api-key` 標頭，將內容貼送到 `https://app.langtrace.ai/api/trace`，不需要 collector。將 `LANGTRACE_API_HOST` 設為自架 Langtrace 的基礎 URL（例如 `https://langtrace.example.com`），回呼就會貼送到 `<host>/api/trace`。請參閱該設定的[proxy 記錄指南](../proxy/logging#langtrace)

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="python" label="SDK">

```python
import litellm
import os

os.environ["LITELLM_OTEL_V2"] = "true"
os.environ["OTEL_ENDPOINT"] = "http://otel-collector:4318"
# LLM API Keys
os.environ["OPENAI_API_KEY"] = ""

# set langtrace as a callback, litellm will send the data to langtrace
litellm.callbacks = ["langtrace"]

# openai call
response = litellm.completion(
  model="{{openai_large}}",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["langtrace"]
```

2. 將 litellm 指向您的 collector

```shell
LITELLM_OTEL_V2=true
OTEL_ENDPOINT="http://otel-collector:4318"
```

3. 設定 collector

`otel-collector-config.yaml`，並在 collector 的環境中設定 `LANGTRACE_API_KEY`：

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
exporters:
  otlphttp/langtrace:
    encoding: json
    compression: none
    traces_endpoint: https://app.langtrace.ai/api/trace
    headers:
      x-api-key: ${env:LANGTRACE_API_KEY}
      Content-Type: application/json
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlphttp/langtrace]
```

4. 啟動 LiteLLM Proxy

```bash
litellm --config /path/to/config.yaml
```

5. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "{{openai_large}}",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how are you?"
    }
  ]
}'
```

</TabItem>
</Tabs>

## Langtrace 會呈現什麼 {#what-langtrace-renders}

開啟 Langtrace UI；spans 會透過您的 collector 流動，並帶有 `langtrace.*` 和 `llm.*` 鍵，以及標準的 `gen_ai.*` 鍵。

`langtrace` 對應器會為提供者、請求與回應識別碼（`llm.model`、`gen_ai.response.model`、`gen_ai.response_id`、`gen_ai.system_fingerprint`）、請求參數（`llm.temperature`、`top_p`、`top_k`、`max_tokens`、`frequency_penalty`、`presence_penalty`）、`llm.stream` 旗標、`llm.token.counts.*` 使用量拆分，以及在啟用內容擷取時的 `llm.prompts` / `llm.completions` 加上 `langtrace.service.name`。請參閱[完整屬性表](./opentelemetry_v2#seeing-your-traces)。

![LiteLLM 在 Langtrace 中的追蹤](/img/observability/otel_v2_langtrace.png)

## OpenTelemetry 完整參考文件 {#full-opentelemetry-reference}

本頁涵蓋 Langtrace 特定設定。關於 span 屬性、提示與回應擷取、指標、分散式追蹤，以及哪些路由會被追蹤，請參閱 [OpenTelemetry v2 指南](./opentelemetry_v2)。

## 支援與聯繫創辦人 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
