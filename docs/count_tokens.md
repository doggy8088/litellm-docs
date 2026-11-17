import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Token 計數 {#token-counting}

## 概覽 {#overview}

LiteLLM 透過呼叫各提供者特定的 token 計數 API 提供精確的 token 計數。這可讓您在傳送請求前取得準確的 token 數量，協助進行成本估算與上下文視窗管理。

| 功能 | 詳細資訊 |
|---------|---------|
| SDK 方法 | `litellm.acount_tokens()` |
| Proxy 端點 | `/v1/messages/count_tokens`（Anthropic 格式）、`/v1/responses/input_tokens`（OpenAI 格式） |
| 本地計數 | SDK 以及沒有計數 API 的提供者會使用本地計數。在 proxy 上，提供者計數失敗會回傳錯誤。請參閱 [Proxy 錯誤](#proxy-errors-instead-of-local-estimates) |

## 支援的提供者 {#supported-providers}

| 提供者 | Token 計數 API | 格式 |
|----------|-------------------|--------|
| OpenAI | [Responses API `/input_tokens`](https://platform.openai.com/docs/api-reference/responses/input-tokens) | OpenAI Responses |
| Anthropic | [Messages `/count_tokens`](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) | Anthropic Messages |
| Mistral | [Responses API `/v1/responses/input_tokens`](https://docs.mistral.ai/api/endpoint/responses#operation-count_input_tokens_v1_responses_input_tokens_post) | OpenAI Responses |
| Vertex AI (Claude) | Vertex AI Partner Models Token Counter | Anthropic Messages |
| Bedrock (Claude) | AWS Bedrock CountTokens API，之後對它拒絕的 Claude 模型改用 bedrock-mantle（請參閱 [Bedrock Claude 模型](#bedrock-claude-models)） | Anthropic Messages |
| Gemini | Google AI Studio countTokens API | Anthropic Messages |
| Vertex AI (Gemini) | Vertex AI countTokens API | Anthropic Messages |
| Azure AI (Claude) | Azure AI Anthropic Messages `/count_tokens` | Anthropic Messages |
| 沒有計數 API 的提供者（Groq、Together AI、Fireworks AI、OpenRouter、自我託管的 vLLM，以及其他提供者） | 本地 tiktoken 計數，或您設定的模型 Hugging Face tokenizer | N/A |

## SDK 使用方式 {#sdk-usage}

### 基本用法 {#basic-usage}

```python
import asyncio
import litellm

async def main():
    # OpenAI
    result = await litellm.acount_tokens(
        model="openai/{{openai_large}}",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "openai_api"

    # Anthropic
    result = await litellm.acount_tokens(
        model="anthropic/{{anthropic}}",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "anthropic_api"

    # Mistral
    result = await litellm.acount_tokens(
        model="mistral/mistral-large-4",
        messages=[{"role": "user", "content": "Hello, how are you?"}],
    )
    print(f"Token count: {result.total_tokens}")
    print(f"Tokenizer: {result.tokenizer_type}")  # "mistral_api"

asyncio.run(main())
```

### 搭配工具與系統訊息 {#with-tools-and-system-message}

```python
import asyncio
import litellm

async def main():
    result = await litellm.acount_tokens(
        model="openai/{{openai_large}}",
        messages=[{"role": "user", "content": "What's the weather in Paris?"}],
        tools=[{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                },
            },
        }],
        system="You are a helpful weather assistant.",
    )
    print(f"Token count (with tools): {result.total_tokens}")

asyncio.run(main())
```

### 回應格式 {#response-format}

`litellm.acount_tokens()` 會回傳一個 `TokenCountResponse`：

```python
TokenCountResponse(
    total_tokens=15,           # Token count
    request_model="openai/{{openai_large}}",  # Model requested
    model_used="{{openai_large}}",      # Model used for counting
    tokenizer_type="openai_api",    # "openai_api", "anthropic_api", "mistral_api", "bedrock_api", "bedrock_mantle_api", "local_tokenizer"
    original_response={"input_tokens": 15},  # Raw API response
    error=False,               # True if counting failed
    error_message=None,        # Error details if failed
)
```

### SDK 備援行為 {#sdk-fallback-behavior}

在 SDK 中，如果提供者沒有計數 API，或 API 金鑰遺失，`acount_tokens()` 會使用本地 tiktoken 計數。Proxy 的計數路由不會這樣做，而是回傳錯誤。請參閱 [Proxy 錯誤而非本地估算](#proxy-errors-instead-of-local-estimates)。

```python
# Unsupported provider → automatic fallback
result = await litellm.acount_tokens(
    model="together_ai/meta-llama/Llama-3-8b-chat-hf",
    messages=[{"role": "user", "content": "Hello"}],
)
print(result.tokenizer_type)  # "local_tokenizer"
```

在 proxy 上，本地計數會在工作執行緒中執行，因此大型負載不會阻塞其他請求。每個 worker process 同時最多會計算 `TOKEN_COUNTER_MAX_CONCURRENT_COUNTS` 個負載（預設 4），其餘會排隊，這可限制大量大型計數突發時所需的記憶體。長度超過 `TOKEN_COUNTER_MAX_EXACT_CHARS` 個字元的字串（預設 4,000,000，約 100 萬個 token）會透過對 16 個平均分布的樣本進行 tokenization 來估算，這些樣本合計達到該字元數，再依字串長度縮放結果，如此可將最大負載的成本限制在可控範圍內。

### Bedrock Claude 模型 {#bedrock-claude-models}

bedrock-runtime 的 CountTokens API 會以 400 拒絕某些 Claude 模型（撰寫本文時為 Claude Opus 4.8、5 與 5.5）。對於它拒絕的 Claude 模型，LiteLLM 會將相同的請求內文傳送到 bedrock-mantle（`https://bedrock-mantle.<region>.api.aws/anthropic/v1/messages/count_tokens`），以該部署的 AWS 憑證簽署，並回報 `tokenizer_type: "bedrock_mantle_api"`。bedrock-runtime 能計數的模型永遠不會送到 Mantle，並維持 `tokenizer_type: "bedrock_api"`。

這些憑證除了 `bedrock:CountTokens` 之外，還需要 IAM 動作 `bedrock-mantle:CountTokens`。缺少它時，Mantle 會回傳 403。SDK 接著會使用本地 tokenizer。Proxy 的計數路由則會回傳該 403。Bedrock API 金鑰（`AWS_BEARER_TOKEN_BEDROCK`）會作為 bearer token 傳送到 Mantle，因此相同的政策也適用於它。

設定 `BEDROCK_MANTLE_API_BASE` 可將 Mantle 呼叫傳送到另一台主機，例如 VPC 端點。部署的 `api_base` 與 `aws_bedrock_runtime_endpoint` 僅適用於 bedrock-runtime。對於非 Claude 模型（例如 Amazon Nova），或 Mantle 在該區域未提供的 Claude 模型，SDK 會使用本地計數。Proxy 會回傳 AWS 的 400 或 404。如果部署設定了 [`token_count_framing` 或其他 framing 鍵](#local-estimates-for-models-without-a-count-api)，proxy 會回傳本地估算值。如果該區域沒有 Mantle 主機，proxy 會回傳 500。

## Proxy 使用方式 {#proxy-usage}

### OpenAI 格式：`/v1/responses/input_tokens` {#openai-format-v1responsesinput_tokens}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl -X POST "http://localhost:4000/v1/responses/input_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "input": "Hello, how are you?"
  }'
```

</TabItem>
<TabItem value="python" label="Python (httpx)">

```python
import httpx

response = httpx.post(
    "http://localhost:4000/v1/responses/input_tokens",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-<your-litellm-api-key>"
    },
    json={
        "model": "{{openai_large}}",
        "input": "Hello, how are you?"
    }
)

print(response.json())
# {"object": "response.input_tokens", "input_tokens": 13}
```

</TabItem>
</Tabs>

**回應：**
```json
{"object": "response.input_tokens", "input_tokens": 13}
```

### Anthropic 格式：`/v1/messages/count_tokens` {#anthropic-format-v1messagescount_tokens}

請參閱 [Anthropic Token Counting](./anthropic_count_tokens.md) 取得完整文件。

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### Proxy 錯誤而非本地估算 {#proxy-errors-instead-of-local-estimates}

從 v1.108.0 起，當 proxy 計數路由無法使用提供者的計數時，不會回傳本地 tiktoken 估算值。在 v1.108.0 之前，這些路由會以 200 回傳此估算值。對某些模型而言，此估算值與正確計數相差甚大。Proxy 計數路由包括：

- `/v1/messages/count_tokens`
- `/v1/responses/input_tokens`
- Google `:countTokens`
- `/utils/token_counter?call_endpoint=true`

每個錯誤都使用您所用 API 的錯誤格式：Anthropic、OpenAI 或 Google。

| 情況 | 回應 |
|-----------|----------|
| 提供者的計數 API 失敗，例如金鑰錯誤、服務中斷或 429 | 提供者回傳的狀態與訊息 |
| OpenAI、Anthropic 或 Azure AI 部署沒有 API 金鑰 | 指明缺少哪個金鑰的 401 |
| Bedrock 部署沒有 AWS 憑證 | 帶有憑證錯誤的 500 |
| Gemini 部署沒有 API 金鑰 | Google 回傳的錯誤 |
| Vertex AI 合作夥伴模型（例如 GLM）沒有計數 API | 指明該模型的 400 |
| 非 Claude 的 Bedrock 模型（例如 Amazon Nova）沒有計數 API | AWS 回傳的 400 或 404 |
| 已設定 `litellm.disable_token_counter`，且提供者沒有計數 API | 503 |

如果部署設定了 `token_count_framing` 或其他 framing 鍵，proxy 會以本地估算值取代提供者的 400 或 404。請參閱[沒有計數 API 之模型的本地估算](#local-estimates-for-models-without-a-count-api)。在 `model_info` 中設有 `custom_tokenizer` 的 Vertex AI 合作夥伴模型會繼續使用本地計數，不會回傳 400。

這項變更不適用於沒有計數 API 的提供者，例如 Groq。它們會繼續使用本地計數。SDK 函式 `litellm.acount_tokens()` 也會繼續使用本地計數。

### 沒有計數 API 之模型的本地估算 {#local-estimates-for-models-without-a-count-api}

若要為提供者無法計數的模型取得本地估算值，請在部署的 `model_info` 中設定 `token_count_framing`。其值是一個 token 數量。Proxy 會將此數字加到本地估算值中，補上本地 tokenizer 看不到的聊天範本 token。Proxy 也會將它加到沒有計數 API 之提供者的每個本地估算值中。對於有範圍較窄的 framing 鍵涵蓋的請求，proxy 會改加該鍵的值。

framing 鍵只會將提供者的 400 或 404 轉換成本地估算值。Framing 鍵包括 `token_count_framing` 以及[工具請求與 Responses API 的 framing](#framing-for-tool-requests-and-the-responses-api) 中的三個鍵。其中任何一個都會為該部署的每個請求開啟本地估算，即使是該鍵不適用的請求也一樣。在 v1.107.0 到 v1.109.x，只有 `token_count_framing` 會開啟它。例如，從 v1.110.0 起，如果只設定了 `token_count_tool_framing`，沒有函式工具的聊天請求會取得一個本地估算值，其中加上成本對照表項目中 `token_count_framing` 的值；如果該項目沒有此值，則不加任何 framing。因此請同時設定 `token_count_framing`。對於 401、403、429 或 5xx 錯誤，proxy 會回傳該錯誤。請在模型群組的每個部署上都設定 framing 鍵。沒有設定它們的部署會繼續回傳 400。

另一個做法是設定 `token_count_model`，改用提供者可以計數的另一個模型來計數。使用 `model` 與 `region` 這兩個鍵。`region` 鍵是選填的。如果您設定了 `token_count_model`，提供者的 400 或 404 會改以該模型計數，取代本地估算值。如果以 `token_count_model` 計數失敗，proxy 會回傳該錯誤。每個本地估算值仍會加上 framing 鍵，例如對於沒有計數 API 的提供者，或沒有 `call_endpoint=true` 的 `/utils/token_counter` 請求。

```yaml
model_list:
  - model_name: glm
    litellm_params:
      model: vertex_ai/zai-org/glm-5-maas
    model_info:
      token_count_framing: 8  # tokens added to the local estimate

  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.claude-sonnet-5-5
    model_info:
      token_count_model:
        model: us.anthropic.claude-opus-5-5
        region: us-west-2  # replaces the built-in us-east-1 value
```

內建的成本對照表為某些模型設定了這些值。例如 Bedrock 與 Databricks 上的 Kimi K3，以及 Bedrock 上的 Claude Sonnet 5.5 與 Haiku 5.5。這些模型不需要 `model_info` 就能提供計數。`model_info` 中的值會取代內建值。

`/v1/messages/count_tokens`、`/v1/responses/input_tokens` 與 `:countTokens` 的回應會在 `litellm_count_source` 中顯示計數的來源。在 `/utils/token_counter` 上，此欄位是 `count_source`。其值如下：

- `provider`：該部署之提供者的計數 API
- `token_count_model`：`token_count_model` 中模型的計數 API。`litellm_count_model` 欄位會給出此模型的名稱。
- `local_estimate`：本地計數

### 工具請求與 Responses API 的 framing {#framing-for-tool-requests-and-the-responses-api}

某些主機在請求帶有工具時，或請求送往它們自己的 Responses API 時，會加入不同的隱藏提示。另外三個 `model_info` 鍵為這些請求設定 framing。<SinceVersion v="1.110.0" />

| 鍵 | 適用對象 |
|-----|------------|
| `token_count_framing` | 每個沒有被範圍較窄的鍵涵蓋的請求 |
| `token_count_tool_framing` | 帶有函式工具的請求 |
| `token_count_responses_framing` | 原生 Responses 請求 |
| `token_count_responses_tool_framing` | 帶有函式工具的原生 Responses 請求 |

Proxy 會為每個本地估算值加上一個 framing 值。來自提供者計數 API 的計數不會加上 framing，只有 `prompt` 的 `/utils/token_counter` 請求也不會。範圍較窄的鍵會取代 `token_count_framing`，而不是與它相加。例如，當 `token_count_framing: 149` 且 `token_count_tool_framing: 302` 時，帶有一個函式工具的請求會加上 302 個 token，而不是 451 個。

函式工具是指具有名稱的工具，但 Anthropic 的 `web_search` 工具除外。這包括 OpenAI 函式工具、Anthropic 自訂工具，以及 Anthropic 內建工具，例如 `web_fetch` 與 `code_execution`。如果一個請求的工具只有 Anthropic 的 `web_search` 工具，或沒有名稱的工具（例如 Responses 的 `web_search` 與 `file_search` 工具），則使用無函式工具請求所用的鍵。

原生 Responses 請求是指送往某個部署的 `/v1/responses/input_tokens` 請求，且 proxy 對該部署呼叫的是提供者自己的 Responses API。當 proxy 將部署橋接到 chat completions 時，主機會加入它的聊天提示，因此計數會使用聊天鍵。例如，當 Azure AI 部署的 `api_base` 不在 `.services.ai.azure.com` 或 `.openai.azure.com` 上，或部署或請求設定了 `use_chat_completions_api: true` 時，該部署會使用橋接。如果 `router_settings` 中的 `default_litellm_params` 設定了 `api_base` 或 `use_chat_completions_api`，proxy 會使用該值取代部署的值。`/v1/messages/count_tokens` 與 `/utils/token_counter` 一律使用聊天鍵。

當某個鍵未設定時，proxy 會為該請求使用清單中的下一個鍵。聊天請求是指所有非原生 Responses 請求的計數請求：

| 請求 | 鍵（依序） |
|---------|----------------|
| 聊天，無函式工具 | `token_count_framing` |
| 聊天，函式工具 | `token_count_tool_framing`、`token_count_framing` |
| 原生 Responses，無函式工具 | `token_count_responses_framing`、`token_count_framing` |
| 原生 Responses，函式工具 | `token_count_responses_tool_framing`、`token_count_responses_framing`、`token_count_tool_framing`、`token_count_framing` |

如果 `model_info` 為某個請求設定了清單中的一個或多個鍵，proxy 對該請求只會使用 `model_info` 的鍵。否則，它會使用成本對照表中的內建值。因此，在 `model_info` 中單獨設定 `token_count_framing` 會適用於每個請求，並取代所有內建值。單獨設定 `token_count_tool_framing` 會適用於兩個 API 上的工具請求，而沒有函式工具的請求則保留內建值。每個值都是零或以上的整數 token 數量。Proxy 會忽略任何其他值。

本地估算會以模型的聊天範本呈現工具的方式來呈現工具，例如 Grok 4.1、Grok 4.3 與 DeepSeek V4.1。當部署在 `model_info` 或 `litellm_params` 中設定了 `base_model` 時，proxy 會從它找尋模型；否則從 `litellm_params.model` 找尋。內建的 framing 值來自同名的成本對照表項目，因此撰寫 `base_model` 時請帶上提供者前綴，例如 `azure_ai/grok-4-1-fast-reasoning`。若使用 `base_model: grok-4-1-fast-reasoning`，proxy 仍會以 Grok 4.1 的方式呈現工具，但它找不到成本對照表項目，也就不會加上任何 framing。因此，使用自訂名稱的部署需要帶前綴的 `base_model` 才能取得內建的 framing 值：

```yaml
model_list:
  - model_name: prod-grok
    litellm_params:
      model: azure_ai/prod-grok
      api_base: https://my-resource.services.ai.azure.com
      api_key: os.environ/AZURE_AI_API_KEY
    model_info:
      base_model: azure_ai/grok-4-1-fast-reasoning
```

```bash
curl -X POST "http://localhost:4000/v1/messages/count_tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "prod-grok",
    "messages": [{"role": "user", "content": "What is the weather in Paris?"}],
    "tools": [{
      "name": "get_weather",
      "description": "Get the current weather for a city",
      "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}
    }]
  }'
# {"input_tokens": 352, "litellm_count_source": "local_estimate"}
```

沒有 `base_model` 時，同一個請求會計數為 54 個 token，因為 proxy 使用通用的工具呈現方式且不加 framing。仍使用已棄用的 `grok-4-1` 名稱的 xAI 部署沒有成本對照表項目，因為 xAI 對這些名稱提供的是 Grok 4.3。若要像 Grok 4.3 一樣計數，請設定 `base_model: xai/grok-4.3`。`base_model` 也會改變 proxy 從成本對照表為該部署讀取的其他值，例如支出追蹤所使用的價格。請參閱[自訂定價](./proxy/custom_pricing.md)。

成本對照表為這些項目以及其他項目備有實測的 framing 值：

| 成本對照表項目 | 已設定的鍵 |
|----------------|----------|
| `azure_ai/grok-4-1-fast-reasoning` | 全部四個鍵 |
| `xai/grok-4.3` | `token_count_framing`、`token_count_tool_framing` |
| `deepseek/deepseek-v4-flash` | `token_count_framing`、`token_count_tool_framing` |
| `deepseek/deepseek-v4-pro` | `token_count_framing`、`token_count_tool_framing` |
| `fireworks_ai/deepseek-v4p1-flash` | `token_count_framing` |
| `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash` | `token_count_framing` |

Proxy 會在啟動時以及呼叫 `/reload/model_cost_map` 時從 GitHub 載入成本對照表，因此這些值也會送達較舊的 proxy。v1.107.0 到 v1.109.x，以及 v1.104.4、v1.105.2 與 v1.106.1 的修補版本，會將該項目的 `token_count_framing` 值加到每個本地估算值中（包括工具請求），且不會讀取三個較新的鍵。若要在那些版本使用不同的值，請在 `model_info` 中設定 `token_count_framing`，它會取代內建值。更舊的版本不會讀取任何 framing 鍵。[`LITELLM_LOCAL_MODEL_COST_MAP=True`](./proxy/config_settings.md) 會保留已安裝版本的成本對照表，但也會保留該版本的模型價格。

## Proxy 設定 {#proxy-configuration}

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: mistral-large-4
    litellm_params:
      model: mistral/mistral-large-4
      api_key: os.environ/MISTRAL_API_KEY
```
