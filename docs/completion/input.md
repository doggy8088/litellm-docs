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
            model="gpt-3.5-turbo",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            max_tokens=10
        )

print(response)
```

### 已轉譯的 OpenAI 參數 {#translated-openai-params}

使用此函式可取得任何 model + provider 的最新支援 openai 參數清單。 

```python
from litellm import get_supported_openai_params

response = get_supported_openai_params(model="anthropic.claude-3", custom_llm_provider="bedrock")

print(response) # ["max_tokens", "tools", "tool_choice", "stream"]
```

這是我們跨提供者轉譯的 openai 參數清單。

請使用 `litellm.get_supported_openai_params()` 以取得每個 model + provider 的最新參數清單 

| 提供者 | temperature | max_completion_tokens | max_tokens | top_p | stream | stream_options | stop | n | presence_penalty | frequency_penalty | functions | function_call | logit_bias | user | response_format | seed| tools | tool_choice | logprobs | top_logprobs | extra_headers |
|--------------|-------------|------------------------|------------|-------|--------|----------------|------|-----|------------------|-------------------|-----------|----------------|-------------|------|------------------|-------------------|--------|--------------|----------|---------------|----------------------|
| Anthropic| ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | || | || | ✅ | ✅ | | ✅ | ✅ || | ✅|
| OpenAI | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| ✅| ✅ | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅|
| Azure OpenAI | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| ✅| ✅ | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅|
| xAI| ✅|| ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| || ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅||
| Replicate| ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | || ||| |||| ||
| Anyscale | ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | || ||| |||| ||
| Cohere | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅|| | || ||| |||| ||
| Huggingface| ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | || | || ||| |||| ||
| Openrouter | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| ✅|| ||| ✅| ✅ ||| ||
| AI21 | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅|| | || ||| |||| ||
| VertexAI | ✅| ✅ | ✅ | | ✅ | ✅ || || | || || ✅ | ✅|||| ||
| Bedrock| ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | || || ✅（依模型而定） | |||| ||
| Sagemaker| ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | || | || ||| |||| ||
| TogetherAI | ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | ✅|| || ✅ | | ✅ | ✅ || ||
| Sambanova| ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | || | || || ✅ | | ✅ | ✅ || ||
| AlephAlpha | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | || | || ||| |||| ||
| NLP Cloud| ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | || ||| |||| ||
| Petals | ✅| ✅ || ✅| ✅ ||| || | || ||| |||| ||
| Ollama | ✅| ✅ | ✅ | ✅| ✅ | ✅ || ✅|| | || ✅||| | ✅ ||| ||
| Databricks | ✅| ✅ | ✅ | ✅| ✅ | ✅ || || | || ||| |||| ||
| ClarifAI | ✅| ✅ | ✅ | | ✅ | ✅ || || | || ||| |||| ||
| Github | ✅| ✅ | ✅ | ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| ✅|| || ✅ | ✅（依模型而定） | ✅（依模型而定） || ||
| Novita AI| ✅| ✅ || ✅| ✅ | ✅ | ✅ | ✅| ✅ | ✅| || ✅||| |||| ||
| Bytez | ✅| ✅ || ✅| ✅ | | | ✅|| || || || || || ||
| OVHCloud AI Endpoints | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ | | | | | | | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

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
    messages: List = [],
    # Optional OpenAI params
    timeout: Optional[Union[float, int]] = None,
    temperature: Optional[float] = None,
    top_p: Optional[float] = None,
    n: Optional[int] = None,
    stream: Optional[bool] = None,
    stream_options: Optional[dict] = None,
    stop=None,
    max_completion_tokens: Optional[int] = None,
    max_tokens: Optional[int] = None,
    presence_penalty: Optional[float] = None,
    frequency_penalty: Optional[float] = None,
    logit_bias: Optional[dict] = None,
    user: Optional[str] = None,
    # openai v1.0+ new params
    response_format: Optional[dict] = None,
    seed: Optional[int] = None,
    tools: Optional[List] = None,
    tool_choice: Optional[str] = None,
    parallel_tool_calls: Optional[bool] = None,
    logprobs: Optional[bool] = None,
    top_logprobs: Optional[int] = None,
    safety_identifier: Optional[str] = None,
    deployment_id=None,
    # soon to be deprecated params by OpenAI
    functions: Optional[List] = None,
    function_call: Optional[str] = None,
    # set api_base, api_version, api_key
    base_url: Optional[str] = None,
    api_version: Optional[str] = None,
    api_key: Optional[str] = None,
    model_list: Optional[list] = None,  # pass in a list of api_base,keys, etc.
    # Optional liteLLM function params
    **kwargs,

) -> ModelResponse:
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

- `response_format`: *object (optional)* - 指定模型必須輸出格式的物件。

    - 設為 `{ "type": "json_object" }` 可啟用 JSON mode，確保模型產生的訊息是有效的 JSON。
    
    - 重要：使用 JSON mode 時，您也必須透過 system 或 user 訊息自行指示模型產生 JSON。否則，模型可能會產生無止盡的空白字元串流，直到產生達到 token 上限，導致請求長時間執行且看似「卡住」。另請注意，若 finish_reason="length"，訊息內容可能會被部分截斷，這表示產生已超過 max_tokens 或對話已超過最大上下文長度。

- `seed`: *integer or null (optional)* - 此功能目前為 Beta 版。若有指定，我們的系統會盡最大努力以決定性方式取樣，使得以相同 seed 與參數重複請求時應會傳回相同結果。決定性不保證成立，您應參考 `system_fingerprint` 回應參數來監控後端中的變更。

- `tools`: *array (optional)* - 模型可呼叫的工具清單。請使用此項提供模型可產生 JSON 輸入的函式清單。

    - `type`: *string* - 工具的類型。您可以將此設定為 `"function"` 或 `"mcp"`（與 `/responses` 結構描述相符），以直接從 `/chat/completions` 呼叫 LiteLLM 註冊的 MCP 伺服器。

    - `function`: *object* - 函式工具必填。

- `tool_choice`: *string or object (optional)* - 控制模型會呼叫哪個函式（如果有的話）。none 表示模型不會呼叫函式，而是產生訊息。auto 表示模型可在產生訊息或呼叫函式之間選擇。透過 `{"type": "function", "function": {"name": "my_function"}}` 指定特定函式會強制模型呼叫該函式。

    - `none` 是在沒有 functions 時的預設值。若有 functions，`auto` 為預設值。

- `parallel_tool_calls`: *boolean (optional)* - 是否在工具使用期間啟用平行函式呼叫。OpenAI 預設為 true。

- `frequency_penalty`: *number or null (optional)* - 用於依據至今文本中的出現頻率，對新 token 施加懲罰。

- `logit_bias`: *map (optional)* - 用於修改特定 token 出現在 completion 中的機率。

- `user`: *string (optional)* - 代表您最終使用者的唯一識別碼。這有助於 OpenAI 監控並偵測濫用。

- `timeout`: *int (optional)* - completion 請求的逾時秒數（預設為 600 秒）

- `logprobs`: * bool (optional)* - 是否傳回輸出 token 的機率對數。若為 true，則會傳回訊息內容中每個輸出 token 的機率對數
        
- `top_logprobs`: *int (optional)* - 介於 0 到 5 之間的整數，指定在每個 token 位置要傳回最可能的 token 數量，每個 token 都會附帶相關聯的機率對數。若使用此參數，則必須將 `logprobs` 設為 true。

- `safety_identifier`: *string (optional)* - 用於追蹤與管理安全相關請求的唯一識別碼。此參數有助於安全監控與合規追蹤。

- `headers`: *dict (optional)* - 要隨請求送出的標頭字典。

- `extra_headers`: *dict (optional)* - `headers` 的替代方案，用於在 LLM API 請求中傳送額外標頭。 

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

**自訂 model 成本** 
- `input_cost_per_token`: *float (optional)* - completion 呼叫的每個 input token 成本 

- `output_cost_per_token`: *float (optional)* - completion 呼叫的每個 output token 成本 

**自訂 prompt template**（更多資訊請參閱 [prompt formatting](./prompt_formatting.md#format-prompt-yourself)）
- `initial_prompt_value`: *string (optional)* - 套用於 input messages 開頭的初始字串

- `roles`: *dict (optional)* - 指定如何根據透過 `messages` 傳入的 role + message 來格式化 prompt 的字典。 

- `final_prompt_value`: *string (optional)* - 套用於 input messages 結尾的最終字串

- `bos_token`: *string (optional)* - 套用於序列開頭的初始字串

- `eos_token`: *string (optional)* - 套用於序列結尾的初始字串

- `hf_model_name`: *string (optional)* - [僅限 Sagemaker] 模型對應的 huggingface 名稱，用於為該模型載入正確的 chat template。
