import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Arize Phoenix {#arize-phoenix}

[Arize Phoenix](https://arize.com/phoenix/) 是來自 [Arize AI](https://arize.com/?utm_source=litellm-docs&utm_medium=partner&utm_campaign=partner-docs&utm_content=phoenix-integration) 的開源 LLM 追蹤與評估專案。可用於本機開發、實驗，以及自架工作流程。

Phoenix 與 [Arize AX](https://arize.com/products/ax/) 分開，後者是供生產團隊、AI 原生公司與企業使用的完整平台，可作為受管理雲端或企業自架部署使用。LiteLLM 支援兩種後端，但它們使用不同的回呼、憑證與端點。Phoenix 使用 `arize_phoenix`，AX 使用 `arize`，或在您需要將相同追蹤送往兩者時，同時啟用兩者。

對於圍繞 LiteLLM 追蹤建立評估迴圈的團隊，Arize 的 [agent evaluation guide](https://arize.com/guides/ai-agent-handbook/agent-evaluation/) 與 [LLM evaluation guide](https://arize.com/resources/llm-evaluation/) 涵蓋了用於追蹤失敗、評估模型行為，以及改善代理程式可靠性的生產工作流程。

:::info
我們希望了解如何讓這些回呼變得更好！認識 LiteLLM 的 [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
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
os.environ["PHOENIX_API_KEY"] = ""
os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "https://app.phoenix.arize.com/v1/traces"
os.environ["PHOENIX_PROJECT_NAME"] = ""   # optional, defaults to "default"
# LLM API Keys
os.environ["OPENAI_API_KEY"] = ""

# set arize_phoenix as a callback, litellm will send the data to phoenix
litellm.callbacks = ["arize_phoenix"]

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
  callbacks: ["arize_phoenix"]
```

2. 設定您的憑證

```shell
LITELLM_OTEL_V2=true
PHOENIX_API_KEY="your-api-key"
PHOENIX_COLLECTOR_ENDPOINT="https://app.phoenix.arize.com/v1/traces"
PHOENIX_PROJECT_NAME="my-project"   # optional
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

## Phoenix 會呈現什麼 {#what-phoenix-renders}

開啟 Phoenix；專案來自 `PHOENIX_PROJECT_NAME`（預設 `default`），並以 `openinference.project.name` 資源屬性標記。每個請求都會以 `chat <model>` span 的形式顯示在請求根節點下。在 proxy 上，您可以將團隊或金鑰的 LLM spans 傳送到不同的 Phoenix 專案；請參閱[將追蹤依團隊或金鑰路由到 Phoenix 專案](#route-traces-to-a-phoenix-project-per-team-or-key)。

Phoenix 使用與 Arize AX 相同的 OpenInference 詞彙，因此 LLM 呼叫 span 會帶有 `llm.model_name`、`llm.provider`、`llm.token_count.*` 用量分割、`llm.invocation_parameters`、在啟用內容擷取時的訊息陣列，以及 `llm.tools.*`，以及標準的 `gen_ai.*` keys。請參閱[完整屬性表](./opentelemetry_v2#seeing-your-traces)。

![Phoenix 中的 LiteLLM 追蹤](/img/observability/otel_v2_phoenix.png)

## 設定 {#configuration}

| 變數 | 必要 | 備註 |
|---|---|---|
| `PHOENIX_API_KEY` | 僅 Phoenix Cloud | 當端點位於 `app.phoenix.arize.com` 上時必填；litellm 在沒有它時會拋出錯誤。自架 Phoenix 不需要 |
| `PHOENIX_COLLECTOR_HTTP_ENDPOINT` | 否 | 收集器端點；當兩者都設定時，優先於 `PHOENIX_COLLECTOR_ENDPOINT` |
| `PHOENIX_COLLECTOR_ENDPOINT` | 否 | 收集器端點，當 HTTP 變數未設定時使用 |
| `PHOENIX_PROJECT_NAME` | 否 | 預設為 `default`；也可讀作 `PHOENIX_COLLECTOR_PROJECT_NAME`。當金鑰或團隊未設定 `phoenix_project_name` 時，這是備援專案 |

如果兩個端點變數都未設定，litellm 會回退到 `http://localhost:6006/v1/traces`。

### 協定是從端點推斷，而不是從變數名稱 {#protocol-is-inferred-from-the-endpoint-not-the-variable-name}

這兩個變數都不綁定任何協定。litellm 會根據您提供的值選擇協定：以 `grpc://` 開頭的端點，或包含 `:4317` 且沒有 `/v1/traces` 路徑的端點，會以 gRPC 匯出，其他任何情況則會以 HTTP 匯出。因此，Phoenix Cloud URL 可在任一變數中使用，而將 `PHOENIX_COLLECTOR_ENDPOINT` 指向 `https://app.phoenix.arize.com/v1/traces` 則會如預期般透過 HTTP 傳送。

### 選擇正確的收集器端點 {#picking-the-right-collector-endpoint}

Phoenix 有不只一種收集器端點形式，而選錯是最常見的 Phoenix 設定錯誤。請將端點指向與您的部署相符的形式：

| 部署 | 端點 |
|---|---|
| Phoenix Cloud（Spaces） | `https://app.phoenix.arize.com/s/<space-name>/v1/traces` |
| Phoenix Cloud（舊版） | `https://app.phoenix.arize.com/legacy/v1/traces` |
| Phoenix Cloud（更早期） | `https://app.phoenix.arize.com/v1/traces` |
| 自架 | `http://localhost:6006/v1/traces` |

## 依團隊或金鑰將追蹤路由到 Phoenix 專案 {#route-traces-to-a-phoenix-project-per-team-or-key}

一個 Phoenix 收集器可以容納多個專案。在 LiteLLM proxy 上，將 `phoenix_project_name` 設定在團隊或虛擬金鑰上，讓該團隊（或該金鑰）的 LLM spans 進入他們自己的 Phoenix 專案。沒有專案名稱的金鑰會繼續使用 `PHOENIX_PROJECT_NAME`。

這就是您如何依團隊分割追蹤，而不必為每個租戶各自架設一個 Phoenix 執行個體。專案只會來自 proxy 在驗證時解析出的團隊或金鑰。若呼叫者在請求本文中放入 `phoenix_project_name`，會被忽略；呼叫仍會回傳 200，而且不會建立攻擊者所選的專案。

需要 OTel v2（`LITELLM_OTEL_V2=true`）與 `callbacks: ["arize_phoenix"]`。Phoenix 15.5.0+ 會尊重此處使用的 `x-project-name` 標頭；較舊的收集器會忽略它並維持使用環境變數中的專案。

<Tabs>
<TabItem value="team" label="依團隊">

團隊中的每個金鑰都會將其 LLM spans 傳送到命名的專案。

```bash
curl -X POST 'http://localhost:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_alias": "payments", "metadata": {"phoenix_project_name": "payments-prod"}}'
```

以相同方式更新現有團隊：

```bash
curl -X POST 'http://localhost:4000/team/update' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "<team-id>", "metadata": {"phoenix_project_name": "payments-prod"}}'
```

接著為該團隊產生金鑰，並照常呼叫 proxy：

```bash
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "<team-id>"}'
```

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H 'Authorization: Bearer $TEAM_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"model": "{{openai_large}}", "messages": [{"role": "user", "content": "hello"}]}'
```

</TabItem>
<TabItem value="key" label="依金鑰">

單一金鑰可以指定自己的專案名稱，包括不屬於任何團隊的金鑰。

```bash
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"metadata": {"phoenix_project_name": "payments-canary"}}'
```

現有金鑰使用 `/key/update` 上相同的欄位。

</TabItem>
</Tabs>

您也可以在 Admin UI 中為團隊或金鑰設定相同的 `metadata.phoenix_project_name` 欄位。

在 chat（或 `/v1/messages`、`/v1/responses`）呼叫之後，Phoenix 會顯示一個名為 `payments-prod` 的專案，其中包含該請求的 `chat <model>` span。第二個設定了 `phoenix_project_name: "search-prod"` 的團隊會落到同一個收集器上的不同專案。

### 哪個專案會勝出 {#which-project-wins}

優先順序由高到低：

1. 金鑰或團隊上的 `phoenix_project_name_override`
2. 金鑰或團隊上的 `phoenix_project_name`
3. `PHOENIX_PROJECT_NAME`（或 `PHOENIX_COLLECTOR_PROJECT_NAME`），否則為 `default`

如果相同欄位同時設定在金鑰與團隊上，會使用團隊的值。當金鑰應該離開其團隊專案時，`phoenix_project_name_override` 是逃脫閥。

### 會被路由與不會被路由的內容 {#what-is-and-is-not-routed}

LLM 呼叫 span（`chat <model>`）是 Phoenix 用來建立並填入命名專案的 span。請求的 HTTP root、驗證與資料庫 spans 會留在環境變數設定的預設專案中。

Phoenix 會依其各個 spans 最先到達的是哪一個，將整個追蹤指派給單一專案。因此，被路由的 LLM span 會開始自己的追蹤，並帶有回到請求追蹤的連結，讓您仍然可以在兩者之間跳轉。

僅 gRPC 的 Phoenix exporter 無法路由：`x-project-name` 只在 OTLP/HTTP 上生效。請將 `PHOENIX_COLLECTOR_HTTP_ENDPOINT` 指向 HTTP `/v1/traces` URL（請參閱[選擇正確的收集器端點](#picking-the-right-collector-endpoint)）。防護欄 spans 不會進行專案路由。

這與[依團隊的憑證](./opentelemetry_v2#per-key--per-team-credentials-multi-tenant)不同，後者會將租戶的追蹤傳送到其自己的後端帳號。專案路由仍然只在同一個 Phoenix 收集器上進行，且只會變更專案名稱。

## 進階 {#advanced}

### 同時傳送到 Phoenix 與 Arize AX {#send-to-phoenix-and-arize-ax-at-once}

預設可以組合，因此您可以從一個 proxy 執行兩個後端：

```yaml
litellm_settings:
  callbacks: ["arize_phoenix", "arize"]
```

## 完整的 OpenTelemetry 參考文件 {#full-opentelemetry-reference}

此頁涵蓋 Phoenix 專屬設定。關於 span 屬性、prompt 與回應擷取、指標、分散式追蹤，以及哪些路由會被追蹤，請參閱[OpenTelemetry v2 指南](./opentelemetry_v2)。

您是在尋找 prompt 管理而不是追蹤嗎？請參閱[Arize Phoenix Prompt Management](../proxy/arize_phoenix_prompts)。

## 支援與聯絡創辦人 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
