import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自訂程式碼防護欄 {#custom-code-guardrail}

使用在沙盒化環境中執行的類 Python 程式碼撰寫自訂防護欄邏輯。

## 快速開始 {#quick-start}

### 1. 在設定中定義防護欄 {#1-define-the-guardrail-in-config}

```yaml
model_list:
    - model_name: {{openai_large}}
      litellm_params:
        model: {{openai_large}}
        api_key: os.environ/OPENAI_API_KEY

guardrails:
    - guardrail_name: block-ssn
      litellm_params:
        guardrail: custom_code
        mode: pre_call
        custom_code: |
            def apply_guardrail(inputs, request_data, input_type):
                for text in inputs["texts"]:
                    if regex_match(text, r"\d{3}-\d{2}-\d{4}"):
                        return block("SSN detected")
                return allow()
```

### 2. 啟動 proxy {#2-start-proxy}

```bash
litellm --config config.yaml
```

### 3. 測試 {#3-test}

```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "My SSN is 123-45-6789"}],
    "guardrails": ["block-ssn"]
  }'
```

## 設定 {#configuration}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `guardrail` | string | ✅ | 必須為 `custom_code` |
| `mode` | string | ✅ | 執行時機：`pre_call`、`post_call`、`during_call` |
| `custom_code` | string | ✅ | 具有 `apply_guardrail` 函式的類 Python 程式碼 |
| `default_on` | bool | ❌ | 在所有請求上執行（預設：`false`） |
| `timeout` | float | ❌ | 單次 `apply_guardrail` 執行的牆鐘時間上限（秒），包含模組層級程式碼（預設：`30`）。超過上限的執行會使請求失敗，而不是讓閘道停滯。請參閱 [執行逾時](#execution-timeout) |

## 撰寫自訂程式碼 {#writing-custom-code}

### 函式簽章 {#function-signature}

您的程式碼必須定義一個 `apply_guardrail` 函式。它可以是同步或非同步：

```python
# Sync version
def apply_guardrail(inputs, request_data, input_type):
    # inputs: see table below
    # request_data: {"model": "...", "user_id": "...", "team_id": "...", "metadata": {...}}
    # input_type: "request" or "response"
    
    return allow()  # or block(), flag() or modify()

# Async version (recommended when using HTTP primitives)
async def apply_guardrail(inputs, request_data, input_type):
    response = await http_post("https://api.example.com/check", body={"text": inputs["texts"][0]})
    if response["success"] and response["body"].get("flagged"):
        return block("Content flagged")
    return allow()
```

### `inputs` 參數 {#inputs-parameter}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `texts` | `List[str]` | 從請求/回應中擷取的文字 |
| `images` | `List[str]` | 擷取的圖片（用於圖片防護欄） |
| `tools` | `List[dict]` | 傳送給 LLM 的工具 |
| `tool_calls` | `List[dict]` | 從 LLM 傳回的工具呼叫 |
| `structured_messages` | `List[dict]` | 含有角色資訊（system/user/assistant）的完整訊息 |
| `model` | `str` | 正在使用的模型 |

### `request_data` 參數 {#request_data-parameter}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `model` | `str` | 模型名稱 |
| `user_id` | `str` | 來自 API 金鑰的使用者 ID |
| `team_id` | `str` | 來自 API 金鑰的團隊 ID |
| `end_user_id` | `str` | 終端使用者 ID |
| `metadata` | `dict` | 請求中繼資料 |

### 回傳值 {#return-values}

| 函式 | 說明 |
|----------|-------------|
| `allow()` | 放行請求/回應 |
| `block(reason)` | 以訊息拒絕 |
| `flag(reason, metadata={})` | 原樣放行請求/回應，但記錄非阻擋性違規 |
| `modify(texts=[], images=[], tool_calls=[])` | 轉換內容 |

### 不阻擋的標記 {#flagging-without-blocking}

`flag(reason, metadata={...})` 適用於僅稽核或監控模式的 guardrails。請求或回應會如同 `allow()` 一樣繼續執行，而 guardrail 會在該請求的 guardrail 資訊中記錄一筆 `guardrail_flagged` 項目，包含 guardrail 名稱、已設定的 `mode`、其評估的 `input_type`（`request` 或 `response`）、`reason`，以及您結構化的 `metadata`。對於串流與非串流請求，其運作方式相同。

在 Guardrails Monitor 中，標記的請求會計為 flagged，而不是 passed 或 blocked；在 Request Logs 中，guardrail 列會顯示 `flagged`（當 guardrail 同時在 `pre_call` 和 `post_call` 上執行時，該列會顯示兩種結果中較嚴重者）。請求層級的 `guardrail_status` 會變成 `guardrail_flagged`，除非同一請求上的另一個 guardrail 已阻擋或失敗，此時以該狀態為準。

```yaml
guardrails:
  - guardrail_name: audit-competitor-mentions
    litellm_params:
      guardrail: custom_code
      mode: [pre_call, post_call]
      default_on: true
      custom_code: |
        def apply_guardrail(inputs, request_data, input_type):
            for text in inputs["texts"]:
                if contains_any(lower(text), ["acme", "globex"]):
                    return flag(
                        "competitor mentioned",
                        metadata={"category": "competitor", "phase": input_type},
                    )
            return allow()
```

在 `standard_logging_guardrail_information` 中，記錄的項目如下所示：

```json
{
  "guardrail_name": "audit-competitor-mentions",
  "guardrail_mode": ["pre_call", "post_call"],
  "guardrail_status": "guardrail_flagged",
  "guardrail_response": {
    "action": "flag",
    "reason": "competitor mentioned",
    "input_type": "request",
    "metadata": {"category": "competitor", "phase": "request"}
  }
}
```

## 內建原語 {#built-in-primitives}

### Regex {#regex}

| 函式 | 說明 |
|----------|-------------|
| `regex_match(text, pattern)` | 如果找到模式則回傳 `True` |
| `regex_replace(text, pattern, replacement)` | 取代所有符合項 |
| `regex_find_all(text, pattern)` | 回傳符合項目清單 |

### JSON {#json}

| 函式 | 說明 |
|----------|-------------|
| `json_parse(text)` | 解析 JSON 字串，發生錯誤時回傳 `None` |
| `json_stringify(obj)` | 轉換為 JSON 字串 |
| `json_schema_valid(obj, schema)` | 驗證是否符合 JSON schema |

### URL {#url}

| 函式 | 說明 |
|----------|-------------|
| `extract_urls(text)` | 從文字中擷取所有 URL |
| `is_valid_url(url)` | 檢查 URL 是否有效 |
| `all_urls_valid(text)` | 檢查文字中的所有 URL 是否有效 |

### 程式碼偵測 {#code-detection}

| 函式 | 說明 |
|----------|-------------|
| `detect_code(text)` | 如果偵測到程式碼則回傳 `True` |
| `detect_code_languages(text)` | 回傳偵測到的語言清單 |
| `contains_code_language(text, ["sql", "python"])` | 檢查特定語言 |

### 文字工具 {#text-utilities}

| 函式 | 說明 |
|----------|-------------|
| `contains(text, substring)` | 檢查是否存在子字串 |
| `contains_any(text, [substr1, substr2])` | 檢查是否存在任一子字串 |
| `word_count(text)` | 計算字數 |
| `char_count(text)` | 計算字元數 |
| `lower(text)` / `upper(text)` / `trim(text)` | 字串轉換 |

### HTTP 請求（非同步） {#http-requests-async}

對外部 API 發出非同步 HTTP 請求，以進行額外驗證或內容審核。

| 函式 | 說明 |
|----------|-------------|
| `await http_request(url, method, headers, body, timeout)` | 一般非同步 HTTP 請求 |
| `await http_get(url, headers, timeout)` | 非同步 GET 請求 |
| `await http_post(url, body, headers, timeout)` | 非同步 POST 請求 |

**回應格式：**
```python
{
    "status_code": 200,        # HTTP status code
    "body": {...},             # Response body (parsed JSON or string)
    "headers": {...},          # Response headers
    "success": True,           # True if status code is 2xx
    "error": None              # Error message if request failed
}
```

**注意：** 使用 HTTP 原語時，請將您的函式定義為 `async def apply_guardrail(...)`，以進行非阻塞執行。

#### 被封鎖的目的地 {#blocked-destinations}

每個 URL（包括重新導向跳轉）在建立連線前都會先通過 proxy 的 SSRF 驗證。私有位址（RFC 1918）、迴圈位址、link-local 與雲端中繼資料位址都會被拒絕，且該原始項目會回傳錯誤回應，而不是丟出例外：

```python
{
    "status_code": 0,
    "body": None,
    "headers": {},
    "success": False,
    "error": "Blocked URL: URL targets a blocked address (169.254.169.254). If this is a legitimate internal service, add the host to `user_url_allowed_hosts` in litellm_settings."
}
```

若要讓 guardrail 呼叫內部服務，請在 `litellm_settings` 下方列出其主機（依 URL 中的寫法，若 URL 含有埠號則一併包含）：

```yaml
litellm_settings:
  user_url_allowed_hosts:
    - moderation.corp.internal
    - 10.0.0.12:8080
```

`user_url_validation: false` 會將此檢查對整個 proxy 關閉。這兩項設定都記載於 [設定項目](../config_settings#litellm_settings---reference)。GET 請求會跟隨重新導向，並驗證每一跳；POST、PUT、PATCH 與 DELETE 絕不跟隨重新導向，因此 3xx 會作為回應返回。

### 執行逾時 {#execution-timeout}

每次 `apply_guardrail` 的執行都受 `timeout`（預設 30 秒）限制，guardrail 載入時執行的模組層級程式碼也一樣。同步函式會在工作執行緒上執行，因此忙碌迴圈不會讓 proxy 的事件迴圈停滯，而且 guardrail 程式碼中的每個 `while` 測試、`for` 迭代與推導式都會檢查預算，因此即使永遠不 yield 或 await 的迴圈仍會在截止時間停止。非同步函式會以相同方式檢查，不需要 `await` 點。超出預算的執行會以 `Custom code guardrail '<name>' exceeded its 30s execution timeout` 錯誤使請求失敗，而超出時間的編譯期程式碼會使 guardrail 載入失敗。

```yaml
guardrails:
  - guardrail_name: "slow-moderation"
    litellm_params:
      guardrail: custom_code
      mode: "pre_call"
      timeout: 10
      custom_code: |
        async def apply_guardrail(inputs, request_data, input_type):
            result = await http_post("https://moderation.example.com/check", body={"texts": inputs["texts"]})
            if result["success"] and result["body"].get("flagged"):
                return block("Flagged by moderation service")
            return allow()
```

`timeout` 的 `http_request` 參數會限制單次 HTTP 呼叫（預設 30 秒，最多 60 秒），並計入該次執行的預算。

## 範例 {#examples}

### 封鎖 PII（SSN） {#block-pii-ssn}

```python
def apply_guardrail(inputs, request_data, input_type):
    for text in inputs["texts"]:
        if regex_match(text, r"\d{3}-\d{2}-\d{4}"):
            return block("SSN detected")
    return allow()
```

### 遮罩電子郵件地址 {#redact-email-addresses}

```python
def apply_guardrail(inputs, request_data, input_type):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    modified = []
    for text in inputs["texts"]:
        modified.append(regex_replace(text, pattern, "[EMAIL REDACTED]"))
    return modify(texts=modified)
```

### 封鎖 SQL Injection {#block-sql-injection}

```python
def apply_guardrail(inputs, request_data, input_type):
    if input_type != "request":
        return allow()
    for text in inputs["texts"]:
        if contains_code_language(text, ["sql"]):
            return block("SQL code not allowed")
    return allow()
```

### 驗證 JSON 回應 {#validate-json-response}

```python
def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    
    schema = {
        "type": "object",
        "required": ["name", "value"]
    }
    
    for text in inputs["texts"]:
        obj = json_parse(text)
        if obj is None:
            return block("Invalid JSON response")
        if not json_schema_valid(obj, schema):
            return block("Response missing required fields")
    return allow()
```

### 檢查回應中的 URL {#check-urls-in-response}

```python
def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    for text in inputs["texts"]:
        if not all_urls_valid(text):
            return block("Response contains invalid URLs")
    return allow()
```

### 呼叫外部審核 API（非同步） {#call-external-moderation-api-async}

```python
async def apply_guardrail(inputs, request_data, input_type):
    # Call an external moderation API
    for text in inputs["texts"]:
        response = await http_post(
            "https://api.example.com/moderate",
            body={"text": text, "user_id": request_data["user_id"]},
            headers={"Authorization": "Bearer YOUR_API_KEY"},
            timeout=10
        )
        
        if not response["success"]:
            # API call failed - decide whether to allow or block
            return allow()
        
        if response["body"].get("flagged"):
            return block(response["body"].get("reason", "Content flagged"))
    
    return allow()
```

### 結合多個檢查 {#combine-multiple-checks}

```python
def apply_guardrail(inputs, request_data, input_type):
    modified = []
    
    for text in inputs["texts"]:
        # Redact SSN
        text = regex_replace(text, r"\d{3}-\d{2}-\d{4}", "[SSN]")
        # Redact credit cards
        text = regex_replace(text, r"\d{16}", "[CARD]")
        modified.append(text)
    
    # Block SQL in requests
    if input_type == "request":
        for text in inputs["texts"]:
            if contains_code_language(text, ["sql"]):
                return block("SQL injection blocked")
    
    return modify(texts=modified)
```

## 沙盒限制 {#sandbox-restrictions}

自訂程式碼會在受限環境中執行：

- ❌ 不可使用 `import` 陳述式
- ❌ 不可進行檔案 I/O
- ❌ 不可使用 `exec()` 或 `eval()`
- ✅ 僅能透過內建的 `http_request`、`http_get`、`http_post` 原語進行 HTTP 請求，目標為公開位址或列於 `user_url_allowed_hosts` 中的主機（請參閱 [被封鎖的目的地](#blocked-destinations)）
- ✅ 僅可使用 LiteLLM 提供的原語
- ⏱ 每次執行都受 guardrail 的 `timeout` 限制（請參閱 [執行逾時](#execution-timeout)）

## 每次請求使用 {#per-request-usage}

為每次請求啟用防護欄：

```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello"}],
    "guardrails": ["block-ssn"]
  }'
```

## 預設啟用 {#default-on}

若要在所有請求上執行 guardrail，請在頂層 `guardrails` 項目上設定 `default_on: true`：

```yaml
guardrails:
  - guardrail_name: block-ssn
    litellm_params:
      guardrail: custom_code
      mode: pre_call
      default_on: true
      custom_code: |
        def apply_guardrail(inputs, request_data, input_type):
            ...
```
