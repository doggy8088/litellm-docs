---
title: "LiteLLM AI Gateway 的 Arize AX 追蹤"
sidebar_label: "Arize AX"
description: "從 Python SDK 或 AI Gateway 將 LiteLLM 追蹤傳送至 Arize AX，包含依團隊與依金鑰的憑證、追蹤取樣以及第二個後端。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Arize AX {#arize-ax}

當您希望使用功能完整的 [Arize AI](https://arize.com/?utm_source=litellm-docs&utm_medium=partner&utm_campaign=partner-docs&utm_content=arize-ax-integration) 平台來進行生產環境的 LLM 可觀測性與評估時，請使用 Arize AX；它可作為代管雲端或企業自架部署提供。

Arize AX 與 [Arize Phoenix](https://arize.com/phoenix/) 是分開的，後者是用於本機開發、實驗與自架工作流程的開源追蹤與評估專案。LiteLLM 同時支援這兩種後端，但它們使用不同的回呼、憑證與端點。如果您要將追蹤送往 Phoenix，請改用 [Arize Phoenix 設定指南](./phoenix_integration)。

如需生產環境評估工作流程，請參閱 Arize 的 [代理程式評估指南](https://arize.com/ai-agents/agent-evaluation/) 與 [LLM 評估指南](https://arize.com/resources/llm-evaluation/)，其中有使用追蹤來除錯失敗、比較模型行為，以及提升代理程式可靠性的範例。

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
    {"role": "user", "content": "Hi - i'm openai"}
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

對應器也會將每個 assistant 工具呼叫寫成結構化的 `llm.output_messages.{idx}.message.tool_calls.{idx}.tool_call.*` 屬性，並將列入允許清單的請求中繼資料寫成 `metadata` 屬性，因此 Arize 的 LLM 檢視會顯示工具名稱與引數，中繼資料面板也會從與 `litellm.metadata.*` 相同的允許清單填入。先前，工具呼叫的回覆會顯示為 `{"role": "assistant", "content": null}`，且中繼資料面板是空的。關於屬性、`mapper_names` 設定與屬性預算，請參閱 [OpenInference 工具呼叫與中繼資料](./opentelemetry_v2#openinference-tool-calls-and-metadata)。

`arize` 預設會為您指定 `openinference` 對應器，因此不需要額外設定。只有當您透過通用 OTLP 路徑，將要傳送至 Arize 的 span 經由自己的 collector 傳送時，才會用到 `MAPPER_NAMES`（或 `callback_settings.otel.mapper_names`）。

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

### 對團隊或金鑰的追蹤進行取樣 {#sample-a-teams-or-keys-traces}

若只想將租戶的一部分請求傳送至其 Arize 空間，請在同一個 `callback_vars` 中加入 `arize_success_sampling_rate` 與 `arize_error_sampling_rate`。每個值的範圍為 `0.0` 到 `1.0`：`0.1` 大約保留十分之一的請求，`0.0` 則不保留任何請求，未設定時則保留每個請求。含有失敗 span 的請求適用錯誤率，其他每個請求則適用成功率，因此錯誤率高於成功率時會保留更多失敗請求。儲存超出該範圍的值，或在 `arize` 以外的回呼上儲存，都會回傳錯誤。

```shell
curl -X POST 'http://localhost:4000/team/<team-id>/callback' \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "callback_name": "arize",
    "callback_type": "success_and_failure",
    "callback_vars": {
      "arize_space_id": "...",
      "arize_api_key": "...",
      "arize_success_sampling_rate": "0.1",
      "arize_error_sampling_rate": "1.0"
    }
  }'
```

在 `LITELLM_OTEL_V2=true` 時，proxy 會以整個請求為單位保留或捨棄，從 HTTP 請求 span 一直到模型呼叫與支出寫入，並由請求的追蹤 ID 做出決定。每個 pod 與 worker 對同一個追蹤 ID 與結果都會得出相同答案，因此當呼叫端以同一個 W3C `traceparent` 傳送多個請求時（如代理程式或內部服務通常的做法），無論如何進行負載平衡，租戶看到的都會是全部或全無。沒有 `traceparent` 的請求會自行開始一個追蹤，並獨立進行取樣。

當兩個比率不同時，同一個追蹤中以不同方式結束的請求仍可能分開落地。在成功率為 `0.1`、錯誤率為 `1.0` 時，第三個請求失敗的追蹤通常只會顯示那個失敗的請求。只要錯誤率不低於成功率，成功請求被保留的追蹤也一定會保留其失敗的請求。

由於決定取決於追蹤 ID，重複使用同一個追蹤 ID 的呼叫端每次都會得到相同答案，呼叫端也可以挑選一個永遠被保留或永遠被捨棄的追蹤 ID，如同 OpenTelemetry 的 `TraceIdRatioBased` 取樣器。這些比率只會稀釋租戶自己的 Arize 空間。您整個 proxy 範圍的匯出器，以及 [`additive` 模式](./opentelemetry_v2#keep-your-own-copy-as-well) 保留的副本，都會收到每個請求。

OpenTelemetry v1（未設定 `LITELLM_OTEL_V2`）則會為每個請求隨機抽樣，因此共用同一個追蹤的請求可能在某個 pod 上被保留、在另一個 pod 上被捨棄。

## OpenTelemetry 完整參考資料 {#full-opentelemetry-reference}

此頁面涵蓋 Arize 專屬設定。若要了解 span 屬性、提示與回應擷取、指標、分散式追蹤，以及哪些路由會被追蹤，請參閱 [OpenTelemetry v2 指南](./opentelemetry_v2)。

## 支援與與創辦人交流 {#support--talk-to-founders}

- [安排示範](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ishaan@berri.ai / krrish@berri.ai
