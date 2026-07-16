# [BETA] Generic Guardrail API - 無需 PR 即可整合 {#beta-generic-guardrail-api---integrate-without-a-pr}

## 問題 {#the-problem}

身為防護欄提供者，傳統上與 LiteLLM 整合需要：
- 向 LiteLLM 儲存庫提交 PR
- 等待審查與合併
- 在 LiteLLM 的程式碼庫中維護特定提供者的程式碼
- 針對您的 API 變更更新整合

## 解決方案 {#the-solution}

**Generic Guardrail API** 讓您只要實作一個簡單的 API 端點，就能**立即**與 LiteLLM 整合。不需要 PR。

### 主要優點 {#key-benefits}

1. **不需要 PR** - 立即部署並整合
2. **通用支援** - 可跨越所有 LiteLLM 端點運作（chat、embeddings、image generation 等）
3. **簡單合約** - 一個端點，三種回應類型
4. **多模態支援** - 在請求/回應中同時處理文字與圖片
5. **自訂參數** - 透過 config 傳遞特定提供者的參數
6. **完全控制** - 您自行擁有並維護您的防護欄 API

## 支援的端點 {#supported-endpoints}

Generic Guardrail API 可與下列 LiteLLM 端點搭配使用：

- `/v1/chat/completions` - OpenAI Chat Completions
- `/v1/completions` - OpenAI Text Completions
- `/v1/responses` - OpenAI Responses API
- `/v1/images/generations` - OpenAI Image Generation
- `/v1/audio/transcriptions` - OpenAI Audio Transcriptions
- `/v1/audio/speech` - OpenAI Text-to-Speech
- `/v1/messages` - Anthropic Messages
- `/v1/rerank` - Cohere Rerank
- 轉發端點

## 運作方式 {#how-it-works}

1. LiteLLM 從任何請求中擷取文字與圖片（chat messages、embeddings、image prompts 等）
2. 將擷取的內容 + 中繼資料傳送到您的 API 端點
3. 您的 API 回應：`BLOCKED`、`NONE`，或 `GUARDRAIL_INTERVENED`
4. LiteLLM 執行該決策並套用任何修改

## API 合約 {#api-contract}

### 端點 {#endpoint}

實作 `POST /beta/litellm_basic_guardrail_api`

### 請求格式 {#request-format}

```json
{
  "texts": ["extracted text from the request"],  // array of text strings
  "images": ["base64_encoded_image_data"],  // optional array of images
  "tools": [  // tool calls sent to the LLM (in the OpenAI Chat Completions spec)
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          }
        }
      }
    }
  ],
  "tool_calls": [  // tool calls received from the LLM (in the OpenAI Chat Completions spec)
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\": \"San Francisco\"}"
      }
    }
  ],
  "structured_messages": [  // optional, full messages in OpenAI format (for chat endpoints)
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello"}
  ],
  "request_data": {
    "user_api_key_hash": "hash of the litellm virtual key used",
    "user_api_key_alias": "alias of the litellm virtual key used",
    "user_api_key_user_id": "user id associated with the litellm virtual key used",
    "user_api_key_user_email": "user email associated with the litellm virtual key used",
    "user_api_key_team_id": "team id associated with the litellm virtual key used",
    "user_api_key_team_alias": "team alias associated with the litellm virtual key used",
    "user_api_key_end_user_id": "end user id associated with the litellm virtual key used",
    "user_api_key_org_id": "org id associated with the litellm virtual key used"
  },
  "request_headers": {  // optional: inbound request headers (allowlist). Allowed headers show their value; all others show "[present]" to indicate the header existed.
    "User-Agent": "OpenAI/Python 2.17.0",
    "Content-Type": "application/json",
    "X-Request-Id": "[present]"
  },
  "litellm_version": "1.x.y",  // optional: LiteLLM library version running this proxy
  "input_type": "request",  // "request" or "response"
  "litellm_call_id": "unique_call_id",  // the call id of the individual LLM call
  "litellm_trace_id": "trace_id",  // the trace id of the LLM call - useful if there are multiple LLM calls for the same conversation
  "additional_provider_specific_params": {
    // your custom params from config
  }
}
```

### 回應格式 {#response-format}

```json
{
  "action": "BLOCKED" | "NONE" | "GUARDRAIL_INTERVENED",
  "blocked_reason": "why content was blocked",  // required if action=BLOCKED
  "texts": ["modified text"],  // optional array of modified text strings
  "images": ["modified_base64_image"]  // optional array of modified images
}
```

**動作：**
- `BLOCKED` - LiteLLM 拋出錯誤並封鎖請求
- `NONE` - 請求照原樣繼續  
- `GUARDRAIL_INTERVENED` - 請求以修改後的文字/圖片繼續（提供 `texts` 和/或 `images` 欄位）

## 參數 {#parameters}

### `tools` 參數 {#tools-parameter}

`tools` 參數提供請求中可用函式/工具定義的資訊。

**格式：** OpenAI `ChatCompletionToolParam` 格式（請參閱 [OpenAI API 參考](https://platform.openai.com/docs/api-reference/chat/create#chat-create-tools)）

僅包含 `type` 且沒有 `function` 區塊的內建工具，例如 `{"type": "code_interpreter"}` 或 `{"type": "file_search", "vector_store_ids": [...]}`，也會被接受並原樣轉送到您的端點（包括其工具特定設定）。您的端點應將 `function` 視為選用，並根據 `type` 分支處理。

**範例：**
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get the current weather in a location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "City and state, e.g. San Francisco, CA"
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"]
        }
      },
      "required": ["location"]
    }
  }
}
```

**可用性：**
- **僅輸入：** 工具只會在 `input_type="request"`（呼叫前防護欄）時傳入。輸出/回應防護欄目前不會接收工具定義。
- **支援的端點：** `tools` 參數支援於：`/v1/chat/completions`、`/v1/responses` 和 `/v1/messages`。其他端點不支援工具。

**使用情境：**
- 強制執行工具權限政策（例如，只允許特定使用者/團隊存取特定工具）
- 在傳送至 LLM 前驗證工具 schema
- 記錄工具使用情況以供稽核
- 根據使用者情境封鎖敏感工具

### `tool_calls` 參數 {#tool_calls-parameter}

`tool_calls` 參數包含在請求或回應中實際進行的函式/工具呼叫。

**格式：** OpenAI `ChatCompletionMessageToolCall` 格式（請參閱 [OpenAI API 參考](https://platform.openai.com/docs/api-reference/chat/object#chat/object-tool_calls)）

**範例：**
```json
{
  "id": "call_abc123",
  "type": "function",
  "function": {
    "name": "get_weather",
    "arguments": "{\"location\": \"San Francisco\", \"unit\": \"celsius\"}"
  }
}
```

**與 `tools` 的主要差異：**
- **`tools`** = 工具定義/schema（有哪些工具*可用*）
- **`tool_calls`** = 工具呼叫/執行（*正在*呼叫哪些工具，以及使用哪些參數）

**可用性：**
- **輸入與輸出皆可：** 工具呼叫可出現在 `input_type="request"`（要求工具呼叫的 assistant 訊息）與 `input_type="response"`（帶有工具呼叫的 LLM 回應）中。
- **支援的端點：** `tool_calls` 參數支援於：`/v1/chat/completions`、`/v1/responses` 和 `/v1/messages`。

**使用情境：**
- 在執行前驗證工具呼叫參數
- 從工具呼叫參數中移除敏感資料（例如 PII）
- 記錄工具呼叫以供稽核/除錯
- 封鎖帶有危險參數的工具呼叫
- 修改工具呼叫參數（例如，強制限制、清理輸入）
- 監控跨使用者/團隊的工具使用模式

### `structured_messages` 參數 {#structured_messages-parameter}

`structured_messages` 參數以 OpenAI chat completion 規格格式提供完整輸入，適合用來區分系統訊息與使用者訊息。

**格式：** OpenAI chat completion 訊息陣列（請參閱 [OpenAI API 參考](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages)）

**範例：**
```json
[
  {"role": "system", "content": "You are a helpful assistant"},
  {"role": "user", "content": "Hello"}
]
```

**可用性：**
- **支援的端點：** `/v1/chat/completions`、`/v1/messages`、`/v1/responses`
- **僅輸入：** 僅在 `input_type="request"`（呼叫前防護欄）時傳入

**使用情境：**
- 對系統訊息與使用者訊息套用不同政策
- 強制執行基於角色的內容限制
- 記錄結構化對話脈絡

## LiteLLM 設定 {#litellm-configuration}

新增至 `config.yaml`：

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "my-guardrail"
      litellm_params:
        guardrail: generic_guardrail_api
        mode: pre_call  # or post_call, during_call
        api_base: https://your-guardrail-api.com
        api_key: os.environ/YOUR_GUARDRAIL_API_KEY  # optional
        unreachable_fallback: fail_closed  # default: fail_closed. Set to fail_open to proceed if the guardrail endpoint is unreachable (network errors, or HTTP 502/503/504 from an upstream proxy/LB).
        fail_on_error: true  # default: true (fail closed). Set to false to proceed on ANY guardrail error. See "Error handling" below before changing this.
        additional_provider_specific_params:
          # your custom parameters
          threshold: 0.8
          language: "en"
```

### 錯誤處理：`unreachable_fallback` 與 `fail_on_error` {#error-handling-unreachable_fallback-and-fail_on_error}

有兩個設定控制當防護欄本身失敗時 LiteLLM 的行為，而不是回傳判定結果。它們位於從嚴格到寬鬆的光譜上，且可相互組合：

- `unreachable_fallback`（預設 `fail_closed`）只處理防護欄端點**無法連線**的情況：網路錯誤、逾時，或上游 proxy/load balancer 傳回 HTTP 502/503/504。將其設為 `fail_open`，即可在這些情況下讓請求繼續。
- `fail_on_error`（預設 `true`）則是更廣泛的控制項。它管理**任何**防護欄錯誤，而不僅限於無法連線。

| `fail_on_error` | 發生防護欄錯誤時的行為 |
| --- | --- |
| `true`（預設） | **失敗封閉。** 任何錯誤都會封鎖請求：非 2xx 回應、格式錯誤或無法解析的主體、網路失敗，或內部序列化/驗證錯誤。這可保留 LiteLLM 現有行為 |
| `false` | **失敗開放（complete）。** 任何防護欄錯誤都會降級為 critical 等級的記錄行，並且請求照彷彿未設定防護欄一樣繼續執行 |

只有有效的防護欄回應才能生效。使用 `fail_on_error: false` 時，已解析的 `BLOCKED` 判定仍會封鎖；所有非有效回應的情況（錯誤、格式錯誤的主體、無法連線的端點）都會被略過。這同時適用於請求 hook（`pre_call`）與回應 hook（`post_call`）；在回應路徑上，fail-open 會回傳已產生的模型輸出，而 fail-closed 則會把成功生成轉成錯誤。

:::danger

`fail_on_error: false` 是在失敗時的完整繞過。這表示防護欄或其端點發生**任何**失敗、任何原因，都會讓該次請求略過防護欄而不是被封鎖。只有在您已理解並接受此取捨時才啟用：當可用性與營運限制比安全限制更重要時才選擇它。如果防護欄是硬性安全邊界，請維持預設 `true`（失敗封閉）。

:::

預設之所以是失敗封閉，正是因為防護欄通常是一種安全控制。每一次 fail-open 繞過都會以 critical 等級（`Generic Guardrail API error (fail-open) ...`）記錄，並附上 call id 與 trace id，因此您可以對其發出警示並稽核其發生頻率。

### 靜態與動態標頭 {#static-and-dynamic-headers}

您可以將兩種類型的標頭傳送至您的防護欄端點：

- **靜態標頭** (`headers`)：隨 **每個** 請求一併送至您的 guardrail 的鍵/值對應。請用於固定值（例如 API 金鑰、`X-Service-Name`）。在 `litellm_params` 中設定：

  ```yaml
  litellm_params:
    guardrail: generic_guardrail_api
    api_base: https://your-guardrail-api.com
    headers:
      X-Service-Name: "my-app"
      X-API-Key: "secret"
  ```

- **動態標頭** (`extra_headers`)：一份從 **用戶端請求** 轉送至您的 guardrail 的 **標頭名稱** 清單。只有這份清單中的標頭（外加少量預設允許清單，例如 `x-litellm-*`）會傳送其值；其他標頭會以 `[present]` 形式傳送。請用來傳遞用戶端提供的標頭（例如 `x-request-id`、`x-correlation-id`）。在 `litellm_params` 中設定：

  ```yaml
  litellm_params:
    guardrail: generic_guardrail_api
    api_base: https://your-guardrail-api.com
    extra_headers:
      - x-request-id
      - x-correlation-id
      - x-custom-auth
  ```

這與 [MCP static and extra headers](/docs/mcp#forwarding-custom-headers-to-mcp-servers) 的行為相同。

### 範例：Pillar Security {#example-pillar-security}

[Pillar Security](https://pillar.security) 使用 Generic Guardrail API 提供完整的 AI 安全性掃描，包括 prompt injection 防護、PII/PCI 偵測、秘密資訊偵測，以及內容審核。

```yaml
guardrails:
  - guardrail_name: "pillar-security"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call, post_call]
      api_base: https://api.pillar.security/api/v1/integrations/litellm
      api_key: os.environ/PILLAR_API_KEY
      default_on: true
      additional_provider_specific_params:
        plr_mask: true      # Enable automatic masking of sensitive data
        plr_evidence: true  # Include detection evidence in response
        plr_scanners: true  # Include scanner details in response
```

請參閱 [Pillar Security 文件](../proxy/guardrails/pillar_security.md) 以取得完整設定選項。

## 使用方式 {#usage}

使用者可依名稱套用您的 guardrail：

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "hello"}],
    guardrails=["my-guardrail"]
)
```

或使用動態參數：

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "hello"}],
    guardrails=[{
        "my-guardrail": {
            "extra_body": {
                "custom_threshold": 0.9
            }
        }
    }]
)
```

## 實作範例 {#implementation-example}

請參閱 [mock_bedrock_guardrail_server.py](https://github.com/BerriAI/litellm/blob/main/cookbook/mock_guardrail_server/mock_bedrock_guardrail_server.py) 取得完整的參考實作。

**最小化 FastAPI 範例：**

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

app = FastAPI()

class GuardrailRequest(BaseModel):
    texts: List[str]
    images: Optional[List[str]] = None
    tools: Optional[List[Dict[str, Any]]] = None  # OpenAI ChatCompletionToolParam format (tool definitions)
    tool_calls: Optional[List[Dict[str, Any]]] = None  # OpenAI ChatCompletionMessageToolCall format (tool invocations)
    structured_messages: Optional[List[Dict[str, Any]]] = None  # OpenAI messages format (for chat endpoints)
    request_data: Dict[str, Any]
    input_type: str  # "request" or "response"
    litellm_call_id: Optional[str] = None
    litellm_trace_id: Optional[str] = None
    additional_provider_specific_params: Dict[str, Any]

class GuardrailResponse(BaseModel):
    action: str  # BLOCKED, NONE, or GUARDRAIL_INTERVENED
    blocked_reason: Optional[str] = None
    texts: Optional[List[str]] = None
    images: Optional[List[str]] = None

@app.post("/beta/litellm_basic_guardrail_api")
async def apply_guardrail(request: GuardrailRequest):
    # Your guardrail logic here
    
    # Example: Check text content
    for text in request.texts:
        if "badword" in text.lower():
            return GuardrailResponse(
                action="BLOCKED",
                blocked_reason="Content contains prohibited terms"
            )
    
    # Example: Check tool definitions (if present in request)
    if request.tools:
        for tool in request.tools:
            if tool.get("type") == "function":
                function_name = tool.get("function", {}).get("name", "")
                # Block sensitive tool definitions
                if function_name in ["delete_data", "access_admin_panel"]:
                    return GuardrailResponse(
                        action="BLOCKED",
                        blocked_reason=f"Tool '{function_name}' is not allowed"
                    )
    
    # Example: Check tool calls (if present in request or response)
    if request.tool_calls:
        for tool_call in request.tool_calls:
            if tool_call.get("type") == "function":
                function_name = tool_call.get("function", {}).get("name", "")
                arguments_str = tool_call.get("function", {}).get("arguments", "{}")
                
                # Parse arguments and validate
                import json
                try:
                    arguments = json.loads(arguments_str)
                    # Block dangerous arguments
                    if "file_path" in arguments and ".." in str(arguments["file_path"]):
                        return GuardrailResponse(
                            action="BLOCKED",
                            blocked_reason="Tool call contains path traversal attempt"
                        )
                except json.JSONDecodeError:
                    pass
    
    # Example: Check structured messages (if present in request)
    if request.structured_messages:
        for message in request.structured_messages:
            if message.get("role") == "system":
                # Apply stricter policies to system messages
                if "admin" in message.get("content", "").lower():
                    return GuardrailResponse(
                        action="BLOCKED",
                        blocked_reason="System message contains restricted terms"
                    )
    
    return GuardrailResponse(action="NONE")
```

## 何時使用此功能 {#when-to-use-this}

✅ **在以下情況使用 Generic Guardrail API：**
- 您想要立即整合，不必等待 PR
- 您維護自己的 guardrail 服務
- 您需要對更新與功能擁有完整控制權
- 您希望自動支援所有 LiteLLM 端點

❌ **在以下情況提出 PR：**
- 您想要與 LiteLLM 內部實作有更深入的整合
- 您的 guardrail 需要複雜的 LiteLLM 專屬邏輯
- 您希望被列為內建提供者

## 有問題嗎？ {#questions}

這是一個 **beta API**。我們正根據回饋積極改進中。如需其他功能，請開啟 issue 或 PR。
