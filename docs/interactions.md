import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /interactions {#interactions}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | |
| 負載平衡 | ✅ | 介於受支援的模型之間 |
| 支援的 LLM 提供者 | **所有 LiteLLM 支援的 CHAT COMPLETION 提供者** | `gemini` 與 `vertex_ai` 為原生支援，其他所有提供者則透過[橋接](#calling-non-interactions-api-endpoints-interactions-to-responses-bridge)。參見[支援的提供者](#supported-providers) |

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}

### 快速開始 {#quick-start}

```python showLineNumbers title="Create Interaction"
import litellm
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = litellm.interactions.create(
    model="gemini/{{gemini_flash}}",
    input="Tell me a short joke about programming."
)

print(response.outputs[-1].text)
```

### 非同步使用方式 {#async-usage}

```python showLineNumbers title="Async Create Interaction"
import litellm
import os
import asyncio

os.environ["GEMINI_API_KEY"] = "your-api-key"

async def main():
    response = await litellm.interactions.acreate(
        model="gemini/{{gemini_flash}}",
        input="Tell me a short joke about programming."
    )
    print(response.outputs[-1].text)

asyncio.run(main())
```

### 串流 {#streaming}

```python showLineNumbers title="Streaming Interaction"
import litellm
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = litellm.interactions.create(
    model="gemini/{{gemini_flash}}",
    input="Write a 3 paragraph story about a robot.",
    stream=True
)

for chunk in response:
    print(chunk)
```

## **LiteLLM AI Gateway（Proxy）使用方式** {#litellm-ai-gateway-proxy-usage}

### 設定 {#setup}

將以下內容加入您的 litellm proxy config.yaml：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-flash
    litellm_params:
      model: gemini/{{gemini_flash}}
      api_key: os.environ/GEMINI_API_KEY
```

啟動 litellm：

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 測試請求 {#test-request}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Create Interaction"
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini/{{gemini_flash}}",
    "input": "Tell me a short joke about programming."
  }'
```

**串流：**

```bash showLineNumbers title="Streaming Interaction"
curl -N -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini/{{gemini_flash}}",
    "input": "Write a 3 paragraph story about a robot.",
    "stream": true
  }'
```

**取得、取消或刪除互動：**

```bash showLineNumbers title="Get, cancel and delete by ID"
curl "http://localhost:4000/v1beta/interactions/{interaction_id}" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -X POST "http://localhost:4000/v1beta/interactions/{interaction_id}/cancel" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -X DELETE "http://localhost:4000/v1beta/interactions/{interaction_id}" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

除非您指名該互動建立時所用的模型群組，否則這些呼叫會送往 Google AI Studio，如 [Vertex AI 上的取得、取消與刪除](#get-cancel-and-delete-on-vertex-ai) 所示。

</TabItem>

<TabItem value="google-sdk" label="Google GenAI SDK">

將 Google GenAI SDK 指向 LiteLLM Proxy：

```python showLineNumbers title="Google GenAI SDK with LiteLLM Proxy"
from google import genai

# Point SDK to LiteLLM Proxy
client = genai.Client(
    api_key="sk-<your-litellm-api-key>",  # Your LiteLLM API key
    http_options={"base_url": "http://localhost:4000"},
)

# Create an interaction
interaction = client.interactions.create(
    model="gemini/{{gemini_flash}}",
    input="Tell me a short joke about programming."
)

print(interaction.outputs[-1].text)
```

**串流：**

```python showLineNumbers title="Google GenAI SDK Streaming"
from google import genai

client = genai.Client(
    api_key="sk-<your-litellm-api-key>",  # Your LiteLLM API key
    http_options={"base_url": "http://localhost:4000"},
)

for chunk in client.interactions.create_stream(
    model="gemini/{{gemini_flash}}",
    input="Write a story about space exploration.",
):
    print(chunk)
```

</TabItem>
</Tabs>

## **請求/回應格式** {#requestresponse-format}

### 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | `model` 或 `agent` 二擇一 | 要使用的模型（例如：`gemini/{{gemini_flash}}`） |
| `agent` | string | `model` 或 `agent` 二擇一 | 要執行的 Google 代理程式，例如 `deep-research-preview-04-2026`。僅限 `gemini` 與 `vertex_ai` |
| `input` | string | Yes | 互動的輸入文字 |
| `background` | boolean | No | 將互動作為長時間執行的工作來執行。回應會以 `in_progress` 狀態傳回，您再以 ID 透過 GET 讀取結果。僅限 `gemini` 與 `vertex_ai` |
| `stream` | boolean | No | 啟用串流回應 |
| `tools` | array | No | 模型可用的工具 |
| `system_instruction` | string | No | 模型的系統指示 |
| `generation_config` | object | No | 生成設定 |
| `previous_interaction_id` | string | No | 前一個互動的 ID，用於內容脈絡 |
| `continuation_token` | string | No | 來自以 `status: "requires_continuation"` 結束的互動的權杖，用來自行接續該次長時間解碼 |

### 回應格式 {#response-format}

```json
{
  "id": "interaction_abc123",
  "object": "interaction",
  "model": "{{gemini_flash}}",
  "status": "completed",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-01-15T10:30:05Z",
  "role": "model",
  "outputs": [
    {
      "type": "text",
      "text": "Why do programmers prefer dark mode? Because light attracts bugs!"
    }
  ],
  "usage": {
    "total_input_tokens": 10,
    "total_output_tokens": 15,
    "total_tokens": 25
  }
}
```

## **長時間解碼（超出 Google 單次請求輸出上限的答案）** {#long-decode-answers-past-googles-per-request-output-cap}

對支援長時間解碼的模型（例如 `gemini/gemini-4-argon`）發出的前景 Interactions 請求，會在到達 Google 的單次請求上限時停止；非串流時為 32,768 個輸出 token，串流時為 65,536 個，並帶有 `status: "requires_continuation"` 與 `continuation_token`。LiteLLM 會將兩者原封不動地透傳，完全按照 Google 傳回的內容，不會代您接續解碼。若要取得答案的其餘部分，請再次送出請求，將 `previous_interaction_id` 設為該互動的 `id`，並將 `continuation_token` 設為該權杖，重複此流程直到狀態不再是 `requires_continuation`。每一次接續都是一次獨立的請求，有各自的支出記錄、預算檢查與速率限制。

```python
import litellm

request = {
    "model": "gemini/gemini-4-argon",
    "generation_config": {"max_output_tokens": 262144, "thinking_level": "high"},
}
response = litellm.interactions.create(input="Write a complete, rigorous proof of the prime number theorem.", **request)
steps = list(response.steps or [])
while response.status == "requires_continuation":
    response = litellm.interactions.create(
        previous_interaction_id=response.id,
        continuation_token=response.continuation_token,
        **request,
    )
    steps.extend(response.steps or [])
print(response.status)  # "completed"
print("".join(c["text"] for step in steps for c in step.get("content", []) if c.get("type") == "text"))
```

每一次接續都會把目前為止的答案重新讀作輸入，因此每次接續的 `usage.total_input_tokens` 都會增加，而 `usage.initial_input_tokens` 則維持為您的提示大小。使用 `store: false` 時，Google 端不會儲存任何內容，因此請改為重新送出 `input`，而不是 `previous_interaction_id`。在串流模式下，`interaction.completed` 事件會帶有相同的 `status` 與 `continuation_token`。

背景請求（`background: true`）由 Google 在其端接續，不需要用戶端接續。

## **Vertex AI** {#vertex-ai}

`vertex_ai` 部署會以該部署的 `vertex_project`、`vertex_location` 與 `vertex_credentials` 呼叫 Vertex AI 自己的 Interactions API。位置預設為 `global`。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: vertex-gemini
    litellm_params:
      model: vertex_ai/{{gemini_flash}}
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: global
      vertex_credentials: os.environ/VERTEX_CREDENTIALS_PATH
```

```bash showLineNumbers title="Create an interaction on Vertex AI"
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-gemini",
    "input": "Tell me a short joke about programming."
  }'
```

從 Python SDK 直接傳入 Vertex 設定：

```python showLineNumbers title="Vertex AI from the SDK"
import litellm

response = litellm.interactions.create(
    model="vertex_ai/{{gemini_flash}}",
    input="Tell me a short joke about programming.",
    vertex_project="my-project",
    vertex_location="global",
)
```

### Vertex AI 上的 Deep Research {#deep-research-on-vertex-ai}

Google 的 Deep Research 代理程式 `deep-research-preview-04-2026` 會在 Vertex AI 上以背景互動的方式執行。送出 `agent` 並搭配 `background: true`，然後以 ID 讀取結果。Google 允許單次執行最長 120 分鐘（[使用 Deep Research](https://docs.cloud.google.com/gemini-enterprise-agent-platform/agents/use-deep-research#hard-failures)，於 2026-11-12 查證）。

透過 proxy 時，請為該代理程式建立專屬的 Vertex 部署，其 `model` 即為該代理程式，然後將該部署的模型群組作為 `model` 送出，並將代理程式名稱作為 `agent` 送出。部署提供專案與憑證，Google 只會收到代理程式。若請求同時送出 `model` 與 `agent`，除非該代理程式就是其所指名部署的模型，否則會在任何內容到達 Google 之前就以 400 拒絕，因此代理程式在自己的部署上執行，而金鑰需要有該部署模型群組的存取權。請為模型群組取一個與代理程式名稱不同的名稱，因為 `model` 與 `agent` 相同的請求會被視為僅有代理程式，並送往 Google AI Studio。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: vertex-deep-research
    litellm_params:
      model: vertex_ai/deep-research-preview-04-2026
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: global
      vertex_credentials: os.environ/VERTEX_CREDENTIALS_PATH
```

```bash showLineNumbers title="Start a Deep Research job on Vertex AI"
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-deep-research",
    "agent": "deep-research-preview-04-2026",
    "background": true,
    "input": "Compare the main approaches to grid-scale energy storage."
  }'
```

```python showLineNumbers title="Deep Research on Vertex AI from the SDK"
import litellm

job = litellm.interactions.create(
    agent="deep-research-preview-04-2026",
    custom_llm_provider="vertex_ai",
    vertex_project="my-project",
    vertex_location="global",
    background=True,
    input="Compare the main approaches to grid-scale energy storage.",
)
print(job.id, job.status)
```

LiteLLM 會依據該代理程式在[模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)中的資料列為代理程式互動計價。`vertex_ai/deep-research-preview-04-2026` 資料列採用 Google 的 Standard 費率：每 100 萬個 token 的輸入為 $2、快取輸入為 $0.20、輸出為 $12，思考 token 依輸出計費；grounding 搜尋查詢每 1,000 次為 $14，逐次計算（[Model Garden 定價](https://cloud.google.com/model-garden/pricing)，於 2026-11-12 查證）。Google 帳單中有兩個部分未納入模型。Google 提供每月免費的 grounding 查詢額度，而 LiteLLM 從第一次查詢起就逐次收費，因此在該額度內時，支出會顯示偏高。Google 另有 Deferred 層級，費率為每 100 萬個 token $1、$0.10 與 $6。LiteLLM 無法區分 Deferred 工作與 Standard 工作，兩者都以 Standard 費率計價，因此 Deferred 工作的支出會顯示偏高。

### Vertex AI 上的取得、取消與刪除 {#get-cancel-and-delete-on-vertex-ai}

Proxy 無法從互動 ID 判斷它是由哪個部署建立的，因此請以 `model` 查詢參數或 `x-litellm-model` 標頭指名。兩者都接受模型群組或部署 ID。建立回應會在其 `x-litellm-model-id` 標頭中帶有提供服務的部署 ID，送出該 ID 可將後續呼叫固定到同一個部署，從而到達持有該互動的專案與位置。您的金鑰需要該部署模型群組的存取權，就如同建立時一樣。受限於模型存取群組的金鑰或團隊，只能固定這些存取群組中的部署；固定群組的另一個部署會在任何內容到達 Google 之前就以 400 拒絕。若兩者都未提供，呼叫會如同以往送往 Google AI Studio。

```bash showLineNumbers title="Poll, cancel and delete a Vertex AI interaction"
curl "http://localhost:4000/v1beta/interactions/{interaction_id}?model={x-litellm-model-id}" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -X POST "http://localhost:4000/v1beta/interactions/{interaction_id}/cancel" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-model: {x-litellm-model-id}"

curl -X DELETE "http://localhost:4000/v1beta/interactions/{interaction_id}?model={x-litellm-model-id}" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

取消會以 `POST .../interactions/{id}/cancel` 送往 Vertex AI，即 Google 的 [Interactions API 參考文件](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api)中的路徑。從 SDK 呼叫時，請將 `custom_llm_provider="vertex_ai"` 與相同的 Vertex 設定傳給 `litellm.interactions.get`、`cancel` 與 `delete`。

模型群組名稱的路由方式與其他任何請求相同，因此在不同專案或位置的 Vertex 部署之間做負載平衡的群組，可能會將 GET、取消或刪除送到未持有該互動的部署，該呼叫便會失敗。後續呼叫請使用 `x-litellm-model-id` 中的部署 ID。若您自行指派部署 ID，請讓它們與模型群組名稱保持不同，因為群組名稱優先於相同的部署 ID。或者，讓您要輪詢、取消或刪除的互動使用只有單一 Vertex 部署的模型群組，例如上方的專屬代理程式部署。

## **背景工作與成本追蹤** {#background-jobs-and-cost-tracking}

`background: true` 請求會在 Google 完成之前就傳回，因此 proxy 會持續輪詢該互動，並在其到達最終狀態時記錄其支出。輪詢使用建立該互動的部署的憑證。`BACKGROUND_INTERACTION_COST_POLL_TIMEOUT_SECONDS` 設定它持續嘗試的時間；預設值為 7800 秒，讓 120 分鐘的 Deep Research 執行仍能結算。若工作在逾時結束時仍在執行，將不會計費，其預算保留也會釋放。[設定參考文件](/docs/proxy/config_settings#environment-variables---reference)列出了其他輪詢設定。

舊版本缺少其中部分功能。先前的變更加入了三個部分：自 [#45743](https://github.com/BerriAI/litellm/pull/45743) 起，Vertex AI 上的背景工作會以部署自己的憑證輪詢；自 [#48750](https://github.com/BerriAI/litellm/pull/48750) 起會轉送 `agent_config`；自 [#50151](https://github.com/BerriAI/litellm/pull/50151) 起，以 `requires_continuation` 結束的背景工作會結算。加入本節的變更帶來了其餘部分。在此之前，透過 proxy 的 GET、取消與刪除一律送往 Google AI Studio，取消在 Vertex AI 上送往 `:cancel`，同時帶有 `model` 與 `agent` 的請求送出的是模型，僅有代理程式的互動在記錄時沒有模型名稱且以 $0 計費，經路由的互動則以部署模型的價格計價，`deep-research-preview-04-2026` 沒有 Vertex 資料列，且輪詢逾時預設為 3600 秒。

## **呼叫非 Interactions API 端點（`/interactions` 到 `/responses` 橋接）** {#calling-non-interactions-api-endpoints-interactions-to-responses-bridge}

LiteLLM 讓您可以透過連到 LiteLLM 的 `/responses` 端點的橋接，呼叫非 Interactions API 模型。這對於呼叫 OpenAI、Anthropic，以及其他原生不支援 Interactions API 的提供者很有用。

#### Python SDK 使用方式 {#python-sdk-usage}

```python showLineNumbers title="SDK Usage"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# Non-streaming interaction
response = litellm.interactions.create(
    model="{{openai_large}}",
    input="Tell me a short joke about programming."
)

print(response.outputs[-1].text)
```

#### LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

**設定組態：**

```yaml showLineNumbers title="Example Configuration"
model_list:
- model_name: openai-model
  litellm_params:
    model: {{openai_large}}
    api_key: os.environ/OPENAI_API_KEY
```

**啟動 Proxy：**

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**發送請求：**

```bash showLineNumbers title="non-Interactions API Model Request"
curl http://localhost:4000/v1beta/interactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "openai-model",
    "input": "Tell me a short joke about programming."
  }'
```

## **支援的提供者** {#supported-providers}

`gemini` 與 `vertex_ai` 為原生支援：LiteLLM 會將請求原封不動地送往 Google 的 Interactions API。其他所有提供者則採橋接方式：LiteLLM 會將請求轉換為 `/responses` 呼叫，再將回覆轉換回互動。代理程式、背景工作，以及以 ID 取得、取消與刪除，都需要原生提供者。

| 提供者 | 類型 | 建立與串流 | `agent` | 背景、取得、取消、刪除 | 使用方式連結 |
|----------|------|-------------------|---------|---------------------------------|---------------|
| Google AI Studio（`gemini`） | 原生 | Yes | Yes | Yes | [使用方式](#quick-start) |
| Vertex AI（`vertex_ai`） | 原生 | Yes | Yes | Yes，取得、取消與刪除時需指名模型群組 | [使用方式](#vertex-ai) |
| 其他所有 LiteLLM 提供者 | 橋接 | Yes | No | No | [橋接使用方式](#calling-non-interactions-api-endpoints-interactions-to-responses-bridge) |
