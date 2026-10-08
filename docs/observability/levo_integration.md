import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Levo {#levo}

API 與 LLM 安全性測試和可觀測性，位於 [levo.ai](https://levo.ai/)。

:::info
我們希望了解如何讓回呼更好！歡迎認識 LiteLLM 的 [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

```shell
uv add litellm
```

除了您的 API 金鑰之外，您還需要一個 Levo collector URL。若您沒有，請聯絡 Levo 支援。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="python" label="SDK">

```python
import litellm
import os

os.environ["LITELLM_OTEL_V2"] = "true"
os.environ["LEVOAI_API_KEY"] = ""
os.environ["LEVOAI_ORG_ID"] = ""
os.environ["LEVOAI_WORKSPACE_ID"] = ""
os.environ["LEVOAI_COLLECTOR_URL"] = ""
# LLM API Keys
os.environ["OPENAI_API_KEY"] = ""

# set levo as a callback, litellm will send the data to levo
litellm.callbacks = ["levo"]

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
  callbacks: ["levo"]
```

2. 設定您的憑證

```shell
LITELLM_OTEL_V2=true
LEVOAI_API_KEY="your-api-key"
LEVOAI_ORG_ID="your-org-id"
LEVOAI_WORKSPACE_ID="your-workspace-id"
LEVOAI_COLLECTOR_URL="your-levo-collector-url"   # contact Levo support for this
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

## Levo 會呈現什麼 {#what-levo-renders}

打開 Levo 儀表板。Levo 不會新增供應商對應器，因此 span 會以 canonical `gen_ai.*` schema 抵達；完整鍵值清單請參閱 [Span attributes](./opentelemetry_v2#span-attributes)。

預設會將 span 路由到 `LEVOAI_COLLECTOR_URL`，並使用 `Authorization: Bearer $LEVOAI_API_KEY`，以及從 `LEVOAI_ORG_ID` 和 `LEVOAI_WORKSPACE_ID` 建立的 `x-levo-organization-id` 和 `x-levo-workspace-id` 標頭。

## 組態 {#configuration}

| 變數 | 必填 | 備註 |
|---|---|---|
| `LEVOAI_API_KEY` | 是 | |
| `LEVOAI_ORG_ID` | 是 | |
| `LEVOAI_WORKSPACE_ID` | 是 | |
| `LEVOAI_COLLECTOR_URL` | 是 | 原樣使用，不做路徑處理，因此請提供 Levo 給您的 دقیق確 URL |

這四項都會在啟動時驗證；若有任何一項缺少，整合會擲出例外。若要用環境標記 span，請設定 `OTEL_ENVIRONMENT_NAME`，這會在每個 span 上標記 `deployment.environment`。

## OpenTelemetry 完整參考 {#full-opentelemetry-reference}

此頁涵蓋 Levo 專屬設定。關於 span attributes、prompt 與 response 擷取、metrics、distributed tracing，以及哪些 routes 會被追蹤，請參閱 [OpenTelemetry v2 guide](./opentelemetry_v2)。

## 支援與聯絡創辦人 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
