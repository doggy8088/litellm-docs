import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 輸入參數 {#input-params}

## 常見參數  {#common-params}
LiteLLM 接受並轉譯跨所有提供者的 [OpenAI Chat Completion 參數](https://platform.openai.com/docs/api-reference/chat/create)。

### 用法 {#usage}
```python
import litellm

# set env variables
os.environ["OPENAI_API_KEY"] = "your-openai-key"

## SET MAX TOKENS - via completion() 
response = litellm.completion(
            model="{{openai_small}}",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            max_tokens=10
        )

print(response)
```

### 已轉譯的 OpenAI 參數 {#translated-openai-params}

使用此函式可取得任何 model + provider 的最新支援 openai 參數清單。

```python
from litellm import get_supported_openai_params

response = get_supported_openai_params(model="anthropic.{{anthropic}}", custom_llm_provider="bedrock")

print(response) # ["max_tokens", "tools", "tool_choice", "stream"]
```

此表格是 `litellm.get_supported_openai_params()` 針對每一列所示模型的輸出。支援情況依提供者而定（例如 Bedrock Llama 模型不列出 `tools` 或 `tool_choice`），因此請針對您使用的確切模型呼叫此函式

`stream_options`、`extra_headers` 和 `max_retries` 不會針對此清單進行檢查，且適用於每個提供者，而 `stream_options={"include_usage": True}` 會在每個提供者的最後一個區塊回傳使用量

| 提供者 | 檢查的模型 | temperature | max_completion_tokens | max_tokens | top_p | stream | stop | n | presence_penalty | frequency_penalty | functions | function_call | logit_bias | user | response_format | seed | tools | tool_choice | logprobs | top_logprobs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Anthropic | `claude-sonnet-4-5-20250929` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  | ✅ | ✅ |  | ✅ | ✅ |  |  |
| OpenAI | `gpt-4o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Azure OpenAI | `gpt-4o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| xAI | `grok-3` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Replicate | `meta/llama-2-70b-chat` | ✅ |  | ✅ | ✅ | ✅ | ✅ |  |  |  | ✅ | ✅ |  |  |  | ✅ | ✅ | ✅ |  |  |
| Anyscale | `meta-llama/Llama-2-70b-chat-hf` | ✅ |  | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |  |  |  |
| Cohere | `command-r` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ | ✅ | ✅ |  |  |
| Huggingface | `meta-llama/Llama-3.1-8B-Instruct` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Openrouter | `openai/gpt-4o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI21 | `jamba-1.5-large` | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ |  |  |  |  |  |  | ✅ | ✅ | ✅ | ✅ |  |  |
| VertexAI | `gemini-2.5-flash` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bedrock | `anthropic.claude-3-5-sonnet-20240620-v1:0` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |  | ✅ |  | ✅ | ✅ |  |  |
| Sagemaker | `jumpstart-dft-meta-textgeneration-llama-2-7b` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |  |  |  |  |  |
| TogetherAI | `meta-llama/Llama-3-70b-chat-hf` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sambanova | `Meta-Llama-3.1-8B-Instruct` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |  | ✅ |  |  |  |  |  |
| AlephAlpha | `luminous-base` | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |  |  |  |
| NLP Cloud | `dolphin` | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |  |  |  |
| Petals | `petals-team/StableBeluga2` | ✅ |  | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Ollama | `llama3` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  | ✅ |  |  |  |  | ✅ | ✅ |  |  |  |  |
| Databricks | `databricks-dbrx-instruct` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  | ✅ |  | ✅ | ✅ |  |  |
| ClarifAI | `openai.chat-completion.gpt-4o` | ✅ | ✅ | ✅ | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  | ✅ |  | ✅ | ✅ |  |  |
| Github | `gpt-4o` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Novita AI | `meta-llama/llama-3-8b-instruct` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bytez | `google/gemma-3-1b-it` | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ |  |  |  |  |  |  |  |  |  |  |  |  |
| OVHCloud AI Endpoints | `Meta-Llama-3_3-70B-Instruct` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

:::note

預設情況下，若傳入的 openai 參數不受支援，LiteLLM 會擲出例外。

若要改為丟棄該參數，請設定 `litellm.drop_params = True` 或 `completion(..drop_params=True)`。

這**只會丟棄不受支援的 OPENAI 參數**。

LiteLLM 假設任何非 openai 參數都是特定於提供者，並在請求主體中以 kwarg 形式傳入

:::

## 輸入參數 {#input-params-1}

```python
def completion(
    model: str,
    messages: list = [],
    timeout: float | str | httpx.Timeout | None = None,
    temperature: float | None = None,
    top_p: float | None = None,
    n: int | None = None,
    stream: bool | None = None,
    stream_options: dict | None = None,
    stop=None,
    max_completion_tokens: int | None = None,
    max_tokens: int | None = None,
    modalities: list[ChatCompletionModality] | None = None,
    prediction: ChatCompletionPredictionContentParam | None = None,
    audio: ChatCompletionAudioParam | None = None,
    presence_penalty: float | None = None,
    frequency_penalty: float | None = None,
    logit_bias: dict | None = None,
    user: str | None = None,
    # openai v1.0+ new params
    reasoning_effort: Literal["none", "minimal", "low", "medium", "high", "xhigh", "max", "default"] | None = None,
    verbosity: Literal["low", "medium", "high"] | None = None,
    response_format: dict | type[BaseModel] | None = None,
    seed: int | None = None,
    tools: list | None = None,
    tool_choice: str | dict | None = None,
    logprobs: bool | None = None,
    top_logprobs: int | None = None,
    parallel_tool_calls: bool | None = None,
    web_search_options: OpenAIWebSearchOptions | None = None,
    include_server_side_tool_invocations: bool | None = None,
    deployment_id=None,
    extra_headers: dict | None = None,
    safety_identifier: str | None = None,
    service_tier: str | None = None,
    store: bool | None = None,
    prompt_cache_key: str | None = None,
    # soon to be deprecated params by OpenAI
    functions: list | None = None,
    function_call: str | None = None,
    # set api_base, api_version, api_key
    base_url: str | None = None,
    api_version: str | None = None,
    api_key: str | None = None,
    model_list: list | None = None,  # pass in a list of api_base,keys, etc.
    # Optional liteLLM function params
    thinking: AnthropicThinkingParam | None = None,
    # Session management
    shared_session: Optional["ClientSession"] = None,
    # Per-request JSON schema validation (overrides litellm.enable_json_schema_validation)
    enable_json_schema_validation: bool | None = None,
    **kwargs,
) -> ModelResponse | CustomStreamWrapper:
    ...
```

### 必填欄位 {#required-fields}

- `model`: *string* - 要使用的模型 ID。請參閱 model endpoint 相容性表，了解哪些模型可與 Chat API 搭配使用。
  
- `messages`: *array* - 由截至目前為止對話所構成的訊息清單。

#### `messages` 的屬性 {#properties-of-messages}
*注意* - 陣列中的每則訊息都包含以下屬性：

- `role`: *string* - 訊息作者的角色。角色可以是：system、user、assistant、function 或 tool。

- `content`: *string or list[dict] or null* - 訊息內容。所有訊息都必填，但若 assistant 訊息帶有 function 呼叫，則可為 null。

- `name`: *string (optional)* - 訊息作者的名稱。若 role 為 "function"，則為必填。名稱應與 content 中所表示的 function 名稱相符。可包含字元（a-z、A-Z、0-9）與底線，最大長度為 64 個字元。

- `function_call`: *object (optional)* - 由模型產生、應該被呼叫的 function 名稱與引數。

- `tool_call_id`: *str (optional)* - 此訊息所回應的 tool 呼叫。

[**查看所有訊息值**](https://github.com/BerriAI/litellm/blob/main/litellm/types/llms/openai.py#L664)

#### 內容類型 {#content-types}

`content` 可以是字串（僅文字）或內容區塊清單（多模態）：

| 類型 | 說明 | 文件 |
|------|-------------|------|
| `text` | 文字內容 | [型別定義](https://github.com/BerriAI/litellm/blob/main/litellm/types/llms/openai.py#L598) |
| `image_url` | 圖片 | [Vision](./vision.md) |
| `input_audio` | 音訊輸入 | [Audio](./audio.md) |
| `video_url` | 影片輸入 | [型別定義](https://github.com/BerriAI/litellm/blob/main/litellm/types/llms/openai.py#L625) |
| `file` | 檔案 | [文件理解](./document_understanding.md) |
| `document` | 文件/PDF | [文件理解](./document_understanding.md) |

**範例：**
```python
# Text
messages=[{"role": "user", "content": [{"type": "text", "text": "Hello!"}]}]

# Image
messages=[{"role": "user", "content": [{"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}]}]

# Audio
messages=[{"role": "user", "content": [{"type": "input_audio", "input_audio": {"data": "<base64>", "format": "wav"}}]}]

# Video
messages=[{"role": "user", "content": [{"type": "video_url", "video_url": {"url": "https://example.com/video.mp4"}}]}]

# File
messages=[{"role": "user", "content": [{"type": "file", "file": {"file_id": "https://example.com/doc.pdf"}}]}]

# Document
messages=[{"role": "user", "content": [{"type": "document", "source": {"type": "text", "media_type": "application/pdf", "data": "<base64>"}}]}]

# Combining multiple types (multimodal)
messages=[{"role": "user", "content": [
    {"type": "text", "text": "Generate a product description based on this image"},
    {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
]}]
```

## 選填欄位 {#optional-fields}

- `temperature`: *number or null (optional)* - 要使用的取樣 temperature，範圍介於 0 到 2。較高的值（如 0.8）會產生較隨機的輸出，而較低的值（如 0.2）會讓輸出更聚焦且更具決定性。 

- `top_p`: *number or null (optional)* - temperature 取樣的替代方案。它會指示模型考量 top_p 機率的 tokens 結果。例如，0.1 表示只會考量構成前 10% 機率品質的 tokens。

- `n`: *integer or null (optional)* - 要為每個輸入訊息產生的 chat completion 選項數量。

- `stream`: *boolean or null (optional)* - 若設為 true，會傳送部分訊息 deltas。tokens 會在可用時送出，並以 [DONE] 訊息結束 stream。

- `stream_options` *dict or null (optional)* - 進行回應串流的選項。只有在設定 `stream: true` 時才設定此項

    - `include_usage` *boolean (optional)* - 若設定，會在 data: [DONE] 訊息之前另外串流一個區塊。此區塊上的 usage 欄位會顯示整個請求的 token 使用統計，而 choices 欄位一律會是空陣列。所有其他區塊也會包含 usage 欄位，但其值為 null。 

- `stop`: *string/ array/ null (optional)* - 最多 4 個序列，API 會在此處停止產生後續 tokens。
  
  **注意**：OpenAI 支援最多 4 個 stop 序列。若您提供超過 4 個，LiteLLM 會自動將清單截斷為前 4 個元素。若要停用此自動截斷，請設定 `litellm.disable_stop_sequence_limit = True`。

- `max_completion_tokens`: *integer (optional)* - 可為一次 completion 產生的 token 數上限，包括可見輸出 tokens 與推理 tokens。

- `max_tokens`: *integer (optional)* - chat completion 中要產生的最大 token 數量。

- `presence_penalty`: *number or null (optional)* - 用來根據 tokens 在至今文字中的存在情況，對新 tokens 施加懲罰。

- `response_format`: *dict or Pydantic model class (optional)* - 指定回應格式。傳入 Pydantic 模型類別可要求以結構描述為基礎的輸出；請參閱 [JSON 模式與結構化輸出](./json_mode.md)。

    - 設為 `{ "type": "json_object" }` 可啟用 JSON mode，確保模型產生的訊息是有效的 JSON。
    
    - 重要：使用 JSON mode 時，您也必須透過 system 或 user 訊息自行指示模型產生 JSON。否則，模型可能會產生無止盡的空白字元串流，直到產生達到 token 上限，導致請求長時間執行且看似「卡住」。另請注意，若 finish_reason="length"，訊息內容可能會被部分截斷，這表示產生已超過 max_tokens 或對話已超過最大上下文長度。

- `seed`: *integer or null (optional)* - 此功能目前為 Beta 版。若有指定，我們的系統會盡最大努力以決定性方式取樣，使得以相同 seed 與參數重複請求時應會傳回相同結果。決定性不保證成立，您應參考 `system_fingerprint` 回應參數來監控後端中的變更。

- `tools`: *array (optional)* - 模型可呼叫的工具清單。請使用此項提供模型可產生 JSON 輸入的函式清單。

    - `type`: *string* - 工具的類型。您可以將此設定為 `"function"` 或 `"mcp"`（與 `/responses` 結構描述相符），以直接從 `/chat/completions` 呼叫 LiteLLM 註冊的 MCP 伺服器。

    - `function`: *object* - 函式工具必填。

- `tool_choice`: *string or dict (optional)* - 控制模型會呼叫哪個工具（如果有的話）。使用 `none` 或 `auto`，或提供 dict 指定特定工具。

    - `none` 是在沒有 functions 時的預設值。若有 functions，`auto` 為預設值。

- `parallel_tool_calls`: *boolean (optional)* - 是否在工具使用期間啟用平行函式呼叫。OpenAI 預設為 true。

- `frequency_penalty`: *number or null (optional)* - 用於依據至今文本中的出現頻率，對新 token 施加懲罰。

- `logit_bias`: *map (optional)* - 用於修改特定 token 出現在 completion 中的機率。

- `user`: *string (optional)* - 代表您最終使用者的唯一識別碼。這有助於 OpenAI 監控並偵測濫用。

- `timeout`: *float, string, `httpx.Timeout` or null (optional)* - 請求的逾時秒數。字串可包含逾時數值；使用 `httpx.Timeout` 可分別設定各階段的逾時。

- `logprobs`: * bool (optional)* - 是否傳回輸出 token 的機率對數。若為 true，則會傳回訊息內容中每個輸出 token 的機率對數
        
- `top_logprobs`: *int (optional)* - 介於 0 到 5 之間的整數，指定在每個 token 位置要傳回最可能的 token 數量，每個 token 都會附帶相關聯的機率對數。若使用此參數，則必須將 `logprobs` 設為 true。

- `safety_identifier`: *string (optional)* - 用於追蹤與管理安全相關請求的唯一識別碼。此參數有助於安全監控與合規追蹤。

- `headers`: *dict (optional)* - 要隨請求送出的標頭字典。

- `extra_headers`: *dict (optional)* - `headers` 的替代方案，用於在 LLM API 請求中傳送額外標頭。

- `reasoning_effort`: *string or null (optional)* - 為支援的模型設定推理強度。值可為 `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` 與 `default`。請參閱[推理內容](../reasoning_content.md)。

- `verbosity`: *string or null (optional)* - 為支援的 OpenAI GPT-5 系列模型，將輸出詳細程度設為 `low`、`medium` 或 `high`。

- `thinking`: *object or null (optional)* - Anthropic 風格的 thinking 設定。請參閱[推理內容](../reasoning_content.md)。

- `modalities`: *array or null (optional)* - 要求的輸出模態，例如文字與音訊。請參閱[音訊](./audio.md)。

- `audio`: *object or null (optional)* - 音訊輸出設定，例如語音與格式。請參閱[音訊](./audio.md)。

- `prediction`: *object or null (optional)* - 預期的輸出內容；當大部分回應可事先得知時，可降低延遲。請參閱[預測輸出](./predict_outputs.md)。

- `web_search_options`: *object or null (optional)* - 支援的內建網路搜尋模型與端點的選項，例如搜尋上下文大小。請參閱[網路搜尋](./web_search.md)。

- `include_server_side_tool_invocations`: *boolean or null (optional)* - 對於支援的 Gemini/Vertex 請求，設定 `toolConfig.includeServerSideToolInvocations`。

- `service_tier`: *string or null (optional)* - 在模型支援時，要求特定的處理服務層級。

- `store`: *boolean or null (optional)* - 控制提供者是否儲存回應（在支援時）。

- `prompt_cache_key`: *string or null (optional)* - OpenAI 提示快取的路由提示，適用於具有共享前綴的請求。請參閱[提示快取](./prompt_caching.md)。

- `shared_session`: *aiohttp `ClientSession` or null (optional)* - 在非同步 API 呼叫之間重複使用同一個 session。請參閱[共享 session](./shared_session.md)。

- `enable_json_schema_validation`: *boolean or null (optional)* - 啟用或停用針對所要求結構描述逐請求驗證產生的 JSON，覆寫全域設定。請參閱 [JSON 模式與結構化輸出](./json_mode.md)。

- `api_key`: *string or null (optional)* - 此請求要使用的提供者 API 金鑰。

- `base_url`: *string or null (optional)* - 提供者 API 的基礎 URL。為 `api_base` 的別名。

- `model_list`: *list or null (optional)* - 模型部署設定，用於選取並呼叫與 `model` 相符的部署。

#### 已棄用的參數 {#deprecated-params}
- `functions`: *array* - 模型可用來產生 JSON 輸入的函式清單。每個函式應具有以下屬性：

    - `name`: *string* - 要呼叫的函式名稱。名稱應包含 a-z、A-Z、0-9、底線與連字號，且長度上限為 64 個字元。
    
    - `description`: *string (optional)* - 說明此函式用途的描述。它有助於模型決定何時以及如何呼叫函式。
    
    - `parameters`: *object* - 函式接受的參數，以 JSON Schema 物件描述。
    
- `function_call`: *string or object (optional)* - 控制模型如何回應函式呼叫。

#### litellm 專屬參數  {#litellm-specific-params}

- `api_base`: *string (optional)* - 您要用來呼叫模型的 api endpoint

- `api_version`: *string (optional)* - （Azure 專屬）此次呼叫的 api version

- `num_retries`: *int (optional)* - 若發生 APIError、TimeoutError 或 ServiceUnavailableError，API 呼叫的重試次數 

- `context_window_fallback_dict`: *dict (optional)* - 若因 context window 錯誤導致呼叫失敗時，要使用的 model 對應

- `fallbacks`: *list (optional)* - 初次呼叫失敗時要使用的 model 名稱與參數清單

- `metadata`: *dict (optional)* - 呼叫時您希望額外記錄的任何資料（會傳送至 logging 整合，例如 promptlayer，並可透過自訂 callback function 存取）

- `custom_llm_provider`: *string (optional)* - 解析模型及其 API 設定時要使用的提供者識別碼

- `drop_params`: *boolean (optional)* - 丟棄不支援的 OpenAI 參數，而不是擲出錯誤。請參閱[丟棄不支援的參數](./drop_params.md)。

- `additional_drop_params`: *list of strings (optional)* - 要從請求中丟棄的 OpenAI 參數。請參閱[丟棄不支援的參數](./drop_params.md)。

- `allowed_openai_params`: *list of strings (optional)* - 此請求允許透傳的 OpenAI 參數。請參閱[丟棄不支援的參數](./drop_params.md)。

- `mock_response`: *string or response object (optional)* - 不呼叫模型，直接回傳模擬的 completion 回應。請參閱[模擬請求](./mock_requests.md)。

- `max_retries`: *integer (optional)* - API 呼叫的最大重試次數

- `ssl_verify`: *boolean or string (optional)* - 啟用或停用 SSL 驗證，或設定自訂 CA 憑證包路徑。請參閱 [SSL 安全性設定](../guides/security_settings.md)。

- `merge_reasoning_content_in_choices`: *boolean (optional)* - 對於串流回應，將 `reasoning_content` 以 `<think>` 標籤包覆加入 `content`，供預期在 content 中取得推理內容的用戶端使用

- `thought_signature_in_tool_call_id`: *boolean (optional)* <SinceVersion v="1.109.0" /> - 對於 Gemini API 與 Vertex AI 上的 Gemini 模型，`false` 可讓 thought signature 不進入 tool 呼叫 ID，使 ID 保持簡短。請參閱[讓 tool 呼叫 ID 保持簡短](../providers/gemini.md#keep-tool-call-ids-short)。

- `prompt_id`: *string (optional)* - 傳給 prompt 管理 hooks 的受管理 prompt ID。請參閱 [prompt 管理](../prompt_management.md)。

- `prompt_variables`: *dict (optional)* - 設定 prompt 管理 hooks 時，用來填入受管理 prompt 變數的值。請參閱 [prompt 管理](../prompt_management.md)。

- `litellm_system_prompt`: *string (optional)* - 將此 prompt 加到第一則 system 訊息之前；若沒有 system 訊息，則在開頭新增一則 system 訊息

- `base_model`: *string (optional)* - 用於提供者專屬模型與參數設定的基礎模型名稱。請參閱[微調模型](../guides/finetuned_models.md)。

- `supports_system_message`: *boolean (optional)* - 當模型不接受 system 角色訊息時設為 false；LiteLLM 會重新對應這些訊息

- `ensure_alternating_roles`: *boolean (optional)* - 在需要時加入 user 或 assistant 接續訊息，使對話角色交替出現。請參閱[訊息清理](./message_sanitization.md)。

- `user_continue_message`: *message object (optional)* - 當角色交替需要 user 回合時插入的自訂 user 訊息。請參閱[訊息清理](./message_sanitization.md)。

- `assistant_continue_message`: *message object (optional)* - 當角色交替需要 assistant 回合時插入的自訂 assistant 訊息。請參閱[訊息清理](./message_sanitization.md)。

- `cooldown_time`: *float (optional)* - 路由的部署失敗後，可再次重試前的冷卻秒數

**自訂 model 成本** 
- `input_cost_per_token`: *float (optional)* - completion 呼叫的每個 input token 成本 

- `output_cost_per_token`: *float (optional)* - completion 呼叫的每個 output token 成本 

- `cost_per_second`: *float (optional)* - 用於計算按時長計費之模型成本的每秒費率

- `input_cost_per_second`: *float (optional)* - 用於計算按時長計費之模型成本的每秒輸入費率

- `output_cost_per_second`: *float (optional)* - 用於計算按時長計費之模型成本的每秒輸出費率

**自訂 prompt template**（更多資訊請參閱 [prompt formatting](./prompt_formatting.md#format-prompt-yourself)）
- `initial_prompt_value`: *string (optional)* - 套用於 input messages 開頭的初始字串

- `roles`: *dict (optional)* - 指定如何根據透過 `messages` 傳入的 role + message 來格式化 prompt 的字典。 

- `final_prompt_value`: *string (optional)* - 套用於 input messages 結尾的最終字串

- `bos_token`: *string (optional)* - 套用於序列開頭的初始字串

- `eos_token`: *string (optional)* - 套用於序列結尾的初始字串

- `hf_model_name`: *string (optional)* - [僅限 Sagemaker] 模型對應的 huggingface 名稱，用於為該模型載入正確的 chat template。
