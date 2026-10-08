import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Arize AX {#arize-ax}

當您希望使用功能完整的 [Arize AI](https://arize.com/?utm_source=litellm-docs&utm_medium=partner&utm_campaign=partner-docs&utm_content=arize-ax-integration) 平台來進行生產環境的 LLM 可觀測性與評估時，請使用 Arize AX；它可作為代管雲端或企業自架部署提供。

Arize AX 與 [Arize Phoenix](https://arize.com/phoenix/) 是分開的，後者是用於本機開發、實驗與自架工作流程的開源追蹤與評估專案。LiteLLM 同時支援這兩種後端，但它們使用不同的回呼、憑證與端點。如果您要將追蹤送往 Phoenix，請改用 [Arize Phoenix 設定指南](./phoenix_integration)。

如需生產環境評估工作流程，請參閱 Arize 的 [代理程式評估指南](https://arize.com/guides/ai-agent-handbook/agent-evaluation/) 與 [LLM 評估指南](https://arize.com/resources/llm-evaluation/)，其中有使用追蹤來除錯失敗、比較模型行為，以及提升代理程式可靠性的範例。

:::info
我們希望了解如何讓這些回呼變得更好！歡迎認識 LiteLLM [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
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
os.environ["ARIZE_SPACE_ID"] = ""
os.environ["ARIZE_API_KEY"] = ""
os.environ["ARIZE_PROJECT_NAME"] = ""   # recommended: names the project traces land in
# LLM API Keys
os.environ["OPENAI_API_KEY"] = ""

# set arize as a callback, litellm will send the data to arize
litellm.callbacks = ["arize"]

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
  callbacks: ["arize"]
```

2. 設定您的憑證

```shell
LITELLM_OTEL_V2=true
ARIZE_SPACE_ID="your-space-id"
ARIZE_API_KEY="your-api-key"
ARIZE_PROJECT_NAME="your-project-name"   # recommended: names the project traces land in
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

## Arize 會顯示的內容 {#what-arize-renders}

開啟您的 Arize 專案；追蹤會出現在 `ARIZE_PROJECT_NAME` 所命名的專案下。每個請求都會以 `chat <model>` span 的形式顯示在請求根節點之下。

`openinference` 對應器會將 OpenInference 詞彙標記到 LLM 呼叫 span 上，同時保留標準的 `gen_ai.*` 鍵，因此 Arize 會讀取其原生結構描述，而不會捨棄標準鍵。這涵蓋了 `llm.model_name` 與 `llm.provider`、`llm.token_count.*` 使用分割、`llm.invocation_parameters`，以及在啟用內容擷取時的 `llm.input_messages.*` 和 `llm.output_messages.*` 訊息陣列，還有用於工具定義的 `llm.tools.*`。請參閱 [完整屬性表](./opentelemetry_v2#seeing-your-traces) 或 [OpenInference 規格](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md) 以取得最終定義的詞彙。

![LiteLLM 在 Arize 中的追蹤](/img/observability/otel_v2_arize.png)

## 設定 {#configuration}

| 變數 | 必填 | 備註 |
|---|---|---|
| `ARIZE_SPACE_ID` | 是 | `ARIZE_SPACE_KEY` 是已棄用名稱，為了向後相容性仍會讀取；在新設定中請優先使用 `ARIZE_SPACE_ID` |
| `ARIZE_API_KEY` | 是 | |
| `ARIZE_PROJECT_NAME` | 否 | 命名追蹤將落入的專案。這不受任何機制強制，也不會因未設定而拒絕 span，但請設定它，讓您的追蹤會被分組到您預期的位置 |
| `ARIZE_ENDPOINT` | 否 | gRPC 端點，預設為 `https://otlp.arize.com/v1` |
| `ARIZE_HTTP_ENDPOINT` | 否 | 用於透過 HTTP 匯出，取代 `ARIZE_ENDPOINT` |

設定 `ARIZE_ENDPOINT` 會選擇 gRPC，而 `ARIZE_HTTP_ENDPOINT` 會選擇 HTTP；如果兩者都未設定，litellm 會使用 gRPC 預設值。

## 進階 {#advanced}

### 同時傳送到 Arize 和另一個後端 {#send-to-arize-and-another-backend-at-once}

預設值可以組合，因此列出多個時，會將相同的追蹤以該工具的原生格式傳送到每個目的地：

```yaml
litellm_settings:
  callbacks: ["arize", "langfuse_otel"]
```

### 依團隊與依金鑰的憑證 {#pass-arize-spacekey-per-request}

Arize 支援每個請求的憑證，因此不同團隊或金鑰可以將記錄寫入不同的 Arize 空間，而無需執行多個 proxy。請依照 [依金鑰 / 依團隊的憑證](./opentelemetry_v2#per-key--per-team-credentials-multi-tenant) 中的說明，在團隊或金鑰上設定 `arize_space_id` 與 `arize_api_key`。

## OpenTelemetry 完整參考資料 {#full-opentelemetry-reference}

此頁面涵蓋 Arize 專屬設定。若要了解 span 屬性、提示與回應擷取、指標、分散式追蹤，以及哪些路由會被追蹤，請參閱 [OpenTelemetry v2 指南](./opentelemetry_v2)。

## 支援與與創辦人交流 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
