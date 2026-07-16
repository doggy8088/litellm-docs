# 完成函式 - completion() {#completion-function---completion}
輸入參數與
<a href="https://platform.openai.com/docs/api-reference/chat/create" target="_blank" rel="noopener noreferrer">OpenAI Create chat completion</a> **完全相同**，並可讓您以相同格式呼叫 **Azure OpenAI、Anthropic、Cohere、Replicate、OpenRouter、Novita AI** 模型。 

此外，liteLLM 允許您傳入以下 **可選** liteLLM 引數：
`force_timeout`, `azure`, `logger_fn`, `verbose`

## 輸入 - Request Body {#input---request-body}
# 請求內文 {#request-body}

**必要欄位**

- `model`: *string* - 要使用的模型 ID。請參閱模型端點相容性表以了解哪些模型可搭配 Chat API 使用。
  
- `messages`: *array* - 由目前為止的對話訊息所組成的清單。

*注意* - 陣列中的每則訊息包含以下屬性：

    - `role`: *string* - 訊息作者的角色。角色可以是：system、user、assistant 或 function。
    
    - `content`: *string or null* - 訊息內容。所有訊息都必填，但對於帶有 function 呼叫的 assistant 訊息可為 null。
    
    - `name`: *string (optional)* - 訊息作者的名稱。若角色為 "function" 則為必填。名稱應與內容中所代表的 function 名稱相符。可包含字元 (a-z, A-Z, 0-9) 與底線，最長 64 個字元。
    
    - `function_call`: *object (optional)* - 應呼叫的 function 名稱與引數，由模型產生。

**選用欄位**

- `functions`: *array* - 模型可用來產生 JSON 輸入的 function 清單。每個 function 應具有以下屬性：

    - `name`: *string* - 要呼叫的 function 名稱。應包含 a-z、A-Z、0-9、底線與破折號，最長 64 個字元。
    
    - `description`: *string (optional)* - 說明該 function 用途的描述。可協助模型決定何時以及如何呼叫此 function。
    
    - `parameters`: *object* - 該 function 接受的參數，以 JSON Schema 物件描述。
    
    - `function_call`: *string or object (optional)* - 控制模型如何回應 function 呼叫。

- `temperature`: *number or null (optional)* - 要使用的抽樣溫度，介於 0 到 2 之間。較高的值（如 0.8）會產生較隨機的輸出，而較低的值（如 0.2）會讓輸出更聚焦且更具決定性。 

- `top_p`: *number or null (optional)* - 取代 temperature 抽樣的另一種方式。它會指示模型考量 top_p 機率下的 tokens 結果。例如，0.1 表示只會考量累積機率前 10% 的 tokens。

- `n`: *integer or null (optional)* - 要為每個輸入訊息產生的 chat completion 選擇數量。

- `stream`: *boolean or null (optional)* - 若設為 true，會傳送部分訊息增量。tokens 會在可用時即時送出，串流會以 [DONE] 訊息結束。

- `stop`: *string/ array/ null (optional)* - 最多 4 個序列，API 會在這些序列處停止產生後續 tokens。

- `max_tokens`: *integer (optional)* - chat completion 中可產生的最大 tokens 數量。

- `presence_penalty`: *number or null (optional)* - 用於根據文本至今為止的存在情況，對新 tokens 施加懲罰。

- `frequency_penalty`: *number or null (optional)* - 用於根據文本至今為止的出現頻率，對新 tokens 施加懲罰。

- `logit_bias`: *map (optional)* - 用於修改特定 tokens 在 completion 中出現的機率。

- `user`: *string (optional)* - 代表您終端使用者的唯一識別碼。這有助於 OpenAI 監控並偵測濫用。
