import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AgentOps {#agentops}

適用於 AI 代理程式的可觀測性與 DevTool 平台，請見 [agentops.ai](https://www.agentops.ai/)。

:::info
我們想了解如何讓回呼變得更好！與 LiteLLM 的 [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 見面，或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

```shell
uv add litellm
```

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="python" label="SDK">

```python
import litellm
import os

os.environ["LITELLM_OTEL_V2"] = "true"
os.environ["AGENTOPS_API_KEY"] = ""
# LLM API Keys
os.environ["OPENAI_API_KEY"] = ""

# set agentops as a callback, litellm will send the data to agentops
litellm.callbacks = ["agentops"]

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
  callbacks: ["agentops"]
```

2. 設定您的認證資訊

```shell
LITELLM_OTEL_V2=true
AGENTOPS_API_KEY="your-api-key"
```

3. 啟動 LiteLLM Proxy

```bash
litellm --config /path/to/config.yaml
```

4. 測試它！

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

## AgentOps 會呈現什麼 {#what-agentops-renders}

開啟 AgentOps 儀表板。AgentOps 不會加入供應商對應器，因此 spans 會以標準的 `gen_ai.*` schema 抵達；請參閱 [Span attributes](./opentelemetry_v2#span-attributes) 以取得完整鍵值清單。

此預設會在 traces 上設定三個資源層級標籤：來自 `AGENTOPS_SERVICE_NAME` 的 `service.name`、固定為 `agentops` 的 `telemetry.sdk.name`，以及當您設定時來自 `AGENTOPS_ENVIRONMENT` 的 `deployment.environment`。AgentOps 會依據認證 token 中編碼的專案來路由 trace，因此專案永遠不會以資源屬性的形式出現。

![LiteLLM 在 AgentOps 中的 trace](/img/observability/otel_v2_agentops.png)

## 設定 {#configuration}

| 變數 | 必要 | 備註 |
|---|---|---|
| `AGENTOPS_API_KEY` | 是 | 會交換成短效 JWT |
| `AGENTOPS_SERVICE_NAME` | 否 | 預設為 `agentops` |
| `AGENTOPS_ENVIRONMENT` | 否 | 無預設值；只有在您設定時才會標記 `deployment.environment` |

traces 會傳送至 `https://otlp.agentops.ai/v1/traces`。

## 了解事項 {#good-to-know}

AgentOps 會在第一次 span 匯出時才鑄造其認證 token，而不是在啟動時，因此第一次匯出看起來可能會短暫延遲。這種情況每個 process 只會發生一次，屬於預期行為；之後 token 會在該 process 的生命週期內被快取。

如果您想在 AgentOps UI 中區分不同環境，請設定 `AGENTOPS_SERVICE_NAME` 和 `AGENTOPS_ENVIRONMENT`。

## 完整 OpenTelemetry 參考 {#full-opentelemetry-reference}

此頁面涵蓋 AgentOps 專屬設定。關於 span 屬性、prompt 與回應擷取、指標、分散式 tracing，以及哪些路由會被追蹤，請參閱 [OpenTelemetry v2 指南](./opentelemetry_v2)。

## 支援與與創辦人交流 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
