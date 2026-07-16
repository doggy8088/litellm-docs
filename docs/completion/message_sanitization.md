import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Anthropic 模型的工具呼叫訊息清理 {#message-sanitization-for-tool-calling-for-anthropic-models}

**在使用 `modify_params=True` 的工具呼叫時，自動修正常見的訊息格式問題**

LiteLLM 可自動清理訊息，以處理工具呼叫工作流程中常見的問題，尤其是在使用 OpenAI 相容用戶端搭配對訊息格式要求嚴格的提供者（例如 Anthropic Claude）時。

## 總覽 {#overview}

當 `litellm.modify_params = True` 啟用時，LiteLLM 會自動清理訊息以修正三個常見問題：

1. **孤兒工具呼叫** - 含有 tool_calls 但缺少工具結果的助手訊息
2. **孤兒工具結果** - 參照不存在 tool_call_ids 的工具訊息
3. **空白訊息內容** - 內容為空白或僅含空白字元的訊息

這可確保您的工具呼叫工作流程能在不同 LLM 提供者之間順暢運作，無須手動驗證訊息。

## 為什麼需要訊息清理？ {#why-message-sanitization}

不同的 LLM 提供者對訊息格式有不同要求，尤其是在工具呼叫期間：

- **Anthropic Claude** 要求每個 tool_call 都必須有對應的工具結果
- 某些提供者會拒絕內容為空白的訊息
- OpenAI 相容用戶端未必總能維持完全一致的訊息

若未進行清理，這些問題會造成 API 錯誤並中斷您的工作流程。啟用 `modify_params=True` 後，LiteLLM 會自動處理這些邊界情況。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

# Enable automatic message sanitization
litellm.modify_params = True

# This will work even if messages have formatting issues
response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=[
        {"role": "user", "content": "What's the weather in Boston?"},
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {"name": "get_weather", "arguments": '{"city": "Boston"}'}
                }
            ]
            # Missing tool result - LiteLLM will add a dummy result automatically
        },
        {"role": "user", "content": "Thanks!"}
    ],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather for a city",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"]
            }
        }
    }]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  modify_params: true  # Enable automatic message sanitization

model_list:
  - model_name: claude-3-5-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
```

</TabItem>
</Tabs>

## 清理情境 {#sanitization-cases}

### 情境 A：孤兒工具呼叫（缺少工具結果） {#case-a-orphaned-tool-calls-missing-tool-results}

**問題：** 助手訊息包含 `tool_calls`，但後續沒有對應的工具結果訊息。

**解決方案：** LiteLLM 會自動為任何缺少的工具結果新增假的工具結果訊息。

**範例：**

```python
import litellm
litellm.modify_params = True

# Messages with orphaned tool calls
messages = [
    {"role": "user", "content": "Search for Python tutorials"},
    {
        "role": "assistant",
        "tool_calls": [
            {
                "id": "call_abc123",
                "type": "function",
                "function": {"name": "web_search", "arguments": '{"query": "Python tutorials"}'}
            }
        ]
    },
    # Missing tool result here!
    {"role": "user", "content": "What about JavaScript?"}
]

# LiteLLM automatically adds:
# {
#     "role": "tool",
#     "tool_call_id": "call_abc123",
#     "content": "[System: Tool execution skipped/interrupted by user. No result provided for tool 'web_search'.]"
# }

response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages,
    tools=[...]
)
```

**這種情況會發生在：**
- 使用者中斷工具執行
- 用戶端因網路問題遺失工具結果
- 在工具完成前，對話流程發生變化
- 工具為選用的多輪對話

### 情境 B：孤兒工具結果（無效的 tool_call_id） {#case-b-orphaned-tool-results-invalid-tool_call_id}

**問題：** 工具訊息參照了 `tool_call_id`，但該 ID 並不存在於任何先前的助手訊息中。

**解決方案：** LiteLLM 會自動移除這些孤兒工具結果訊息。

**範例：**

```python
import litellm
litellm.modify_params = True

# Messages with orphaned tool result
messages = [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"},
    {
        "role": "tool",
        "tool_call_id": "call_nonexistent",  # This tool_call_id doesn't exist!
        "content": "Some result"
    }
]

# LiteLLM automatically removes the orphaned tool message

response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages
)
```

**這種情況會發生在：**
- 訊息歷史被手動編輯
- 工具結果重複或不一致
- 對話狀態還原錯誤
- 訊息來自不同對話並被合併

### 情境 C：空白訊息內容 {#case-c-empty-message-content}

**問題：** 使用者或助手訊息的內容為空白或僅含空白字元。

**解決方案：** LiteLLM 會以系統預留訊息取代空白內容。

**範例：**

```python
import litellm
litellm.modify_params = True

# Messages with empty content
messages = [
    {"role": "user", "content": ""},  # Empty content
    {"role": "assistant", "content": "   "},  # Whitespace only
]

# LiteLLM automatically replaces with:
# {"role": "user", "content": "[System: Empty message content sanitised to satisfy protocol]"}
# {"role": "assistant", "content": "[System: Empty message content sanitised to satisfy protocol]"}

response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages
)
```

**這種情況會發生在：**
- UI 傳送空白訊息
- 內容在前處理期間被移除
- 對話歷史中的預留訊息
- 訊息建構中的邊界情況

## 設定 {#configuration}

### 全域啟用 {#enable-globally}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

# Enable for all completion calls
litellm.modify_params = True
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  modify_params: true
```

</TabItem>
<TabItem value="env" label="Environment Variable">

```bash
export LITELLM_MODIFY_PARAMS=True
```

</TabItem>
</Tabs>

### 依請求啟用 {#enable-per-request}

```python
import litellm

# Enable only for specific requests
response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages,
    modify_params=True  # Override global setting
)
```

## 支援的提供者 {#supported-providers}

目前訊息清理可用於：

- ✅ Anthropic（Claude）

**注意：** 雖然清理邏輯與提供者無關，但目前只套用於 Anthropic 的訊息轉換流程。未來版本可能會新增對其他提供者的支援。

## 實作細節 {#implementation-details}

### 運作方式 {#how-it-works}

訊息清理流程會在訊息轉換為特定提供者格式之前執行：

1. **輸入：** 可能有問題的 OpenAI 格式訊息
2. **清理：** 三個輔助函式處理這些訊息：
   - `_sanitize_empty_text_content()` - 修正空白內容
   - `_add_missing_tool_results()` - 新增假的工具結果
   - `_is_orphaned_tool_result()` - 識別孤兒結果
3. **輸出：** 乾淨、相容於提供者的訊息

### 程式碼參考 {#code-reference}

清理邏輯實作於：
- `litellm/litellm_core_utils/prompt_templates/factory.py`
- 函式：`sanitize_messages_for_tool_calling()`

### 記錄 {#logging}

當進行清理時，LiteLLM 會記錄除錯訊息：

```python
import litellm
litellm.set_verbose = True  # Enable debug logging

# You'll see logs like:
# "_add_missing_tool_results: Found 1 orphaned tool calls. Adding dummy tool results."
# "_is_orphaned_tool_result: Found orphaned tool result with tool_call_id=call_123"
# "_sanitize_empty_text_content: Replaced empty text content in user message"
```

## 最佳實務 {#best-practices}

### 1. 於正式工作流程中啟用 {#1-enable-for-production-workflows}

```python
# Recommended for production
litellm.modify_params = True

# Ensures robust handling of edge cases
response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages,
    tools=tools
)
```

### 2. 盡可能保留工具結果 {#2-preserve-tool-results-when-possible}

雖然清理可處理缺少的工具結果，但仍建議提供實際結果：

```python
# Good: Provide actual tool results
messages = [
    {"role": "user", "content": "Search for Python"},
    {"role": "assistant", "tool_calls": [...]},
    {"role": "tool", "tool_call_id": "call_123", "content": "Actual search results"}
]

# Fallback: Sanitization adds dummy result if missing
messages = [
    {"role": "user", "content": "Search for Python"},
    {"role": "assistant", "tool_calls": [...]},
    # Missing tool result - sanitization adds dummy
]
```

### 3. 監控清理事件 {#3-monitor-sanitization-events}

使用記錄來追蹤何時發生清理：

```python
import litellm
import logging

# Enable debug logging
litellm.set_verbose = True
logging.basicConfig(level=logging.DEBUG)

# Track sanitization events in your application
response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=messages
)
```

### 4. 測試邊界情況 {#4-test-edge-cases}

確保您的應用程式能正確處理已清理的訊息：

```python
import litellm
litellm.modify_params = True

# Test orphaned tool calls
test_messages = [
    {"role": "user", "content": "Test"},
    {"role": "assistant", "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": "test", "arguments": "{}"}}]},
    {"role": "user", "content": "Continue"}  # No tool result
]

response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20241022",
    messages=test_messages,
    tools=[...]
)

# Verify the response handles the dummy tool result appropriately
```

## 相關功能 {#related-features}

- **[移除參數](./drop_params.md)** - 移除特定提供者不支援的參數
- **[訊息截斷](./message_trimming.md)** - 截斷訊息以符合 token 限制
- **[函式呼叫](./function_call.md)** - 工具/函式呼叫完整指南
- **[推理內容](../reasoning_content.md)** - 搭配工具呼叫的延伸思考

## 疑難排解 {#troubleshooting}

### 清理未生效 {#sanitization-not-working}

**問題：** 儘管 `modify_params=True`，訊息仍然導致錯誤

**解決方案：**
1. 驗證 `modify_params` 已啟用：
   ```python
   import litellm
   print(litellm.modify_params)  # Should be True
   ```

2. 檢查問題是否與特定提供者有關：
   ```python
   litellm.set_verbose = True  # Enable debug logging
   ```

3. 確保您使用的是較新的 LiteLLM 版本：
   ```bash
   uv add --upgrade-package litellm litellm
   ```

### 意外出現假的工具結果 {#unexpected-dummy-tool-results}

**問題：** 當您預期會有實際結果時，卻出現假的工具結果

**原因：** 工具結果訊息缺失或具有錯誤的 `tool_call_id`

**解決方案：**
1. 驗證工具結果訊息具有正確的 `tool_call_id`：
   ```python
   # Correct
   {"role": "tool", "tool_call_id": "call_123", "content": "result"}
   
   # Incorrect - will be treated as orphaned
   {"role": "tool", "tool_call_id": "wrong_id", "content": "result"}
   ```

2. 確保工具結果立即接在含有 tool_calls 的助手訊息之後

### 效能影響 {#performance-impact}

**問題：** 擔心效能負擔

**詳細說明：** 訊息清理對效能的影響極小：
- 以 O(n) 時間執行，其中 n = 訊息數量
- 僅在 `modify_params=True` 時處理訊息
- 通常會為請求處理時間增加 < 1ms

## 常見問題 {#faq}

**Q: 清理會修改我的原始訊息嗎？**

A: 不會，清理會建立新的訊息清單。您的原始訊息保持不變。

**Q: 我可以停用特定的清理情境嗎？**

A: 目前在 `modify_params=True` 時，三種情境會一起處理。若要完全停用清理，請設定 `modify_params=False`。

**Q: 那些假的工具結果會怎樣？**

A: 假的工具結果會與其他訊息一起送往 LLM 提供者。模型會將其視為帶有資訊性錯誤訊息的正常工具結果。

**Q: 這支援串流嗎？**

A: 是的，訊息清理同時支援串流與非串流請求。

**Q: 這和 `drop_params` 有關嗎？**

A: 沒有，這是不同的功能：
- `modify_params` - 修改/修正訊息內容與結構
- `drop_params` - 移除不支援的 API 參數

兩者可同時啟用。

## 另請參閱 {#see-also}

- [搭配工具呼叫的推理內容](../reasoning_content.md)
- [函式呼叫指南](./function_call.md)
- [Bedrock 提供者文件](../providers/bedrock.md)
- [Anthropic 提供者文件](../providers/anthropic.md)
