# Anthropic 工具輸入範例 {#anthropic-tool-input-examples}

提供具體的有效工具輸入範例，幫助 Claude 更有效地理解如何使用您的工具。這對於具有巢狀物件、可選參數或對格式敏感的輸入之複雜工具特別有用。

:::info
工具輸入範例是 beta 功能。LiteLLM 會自動偵測具有 `input_examples` 欄位的工具，並依據您的提供者加入適當的 beta 標頭：

- **Anthropic API 與 Microsoft Foundry**：`advanced-tool-use-2025-11-20`
- **Amazon Bedrock**：`advanced-tool-use-2025-11-20`（僅 Claude Opus 4.5）
- **Google Cloud Vertex AI**：不支援

您不需要手動指定 beta 標頭——LiteLLM 會自動處理。
:::

## 何時使用輸入範例 {#when-to-use-input-examples}

輸入範例在以下情況最有幫助：

- **複雜的巢狀物件**：具有深度巢狀參數結構的工具
- **可選參數**：展示何時應包含可選參數
- **對格式敏感的輸入**：示範預期格式（日期、地址等）
- **列舉值**：在情境中說明有效的列舉選項
- **邊緣情況**：展示如何處理特殊情況

:::tip
**優先描述！** 清楚且詳細的工具描述比範例更重要。對於僅靠描述可能不足以說明的複雜工具，請將 `input_examples` 作為補充。
:::

## 快速開始 {#quick-start}

在您的工具定義中新增一個 `input_examples` 欄位，並使用示範輸入物件陣列：

```python
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[
        {"role": "user", "content": "What's the weather like in San Francisco?"}
    ],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "The unit of temperature"
                        }
                    },
                    "required": ["location"]
                }
            },
            "input_examples": [
                {
                    "location": "San Francisco, CA",
                    "unit": "fahrenheit"
                },
                {
                    "location": "Tokyo, Japan",
                    "unit": "celsius"
                },
                {
                    "location": "New York, NY"  # 'unit' is optional
                }
            ]
        }
    ]
)

print(response)
```

## 運作方式 {#how-it-works}

當您提供 `input_examples` 時：

1. **LiteLLM 偵測** 您工具定義中的 `input_examples` 欄位
2. **自動加入 beta 標頭**：注入 `advanced-tool-use-2025-11-20` 標頭
3. **範例納入提示詞**：Anthropic 會將範例與您的工具 schema 一併納入
4. **Claude 學習模式**：模型使用範例來理解正確的工具用法
5. **更好的工具呼叫**：Claude 以正確的參數格式進行更精準的工具呼叫

## 範例格式 {#example-formats}

### 含範例的簡單工具 {#simple-tool-with-examples}

```python
{
    "type": "function",
    "function": {
        "name": "send_email",
        "description": "Send an email to a recipient",
        "parameters": {
            "type": "object",
            "properties": {
                "to": {"type": "string", "description": "Email address"},
                "subject": {"type": "string"},
                "body": {"type": "string"}
            },
            "required": ["to", "subject", "body"]
        }
    },
    "input_examples": [
        {
            "to": "user@example.com",
            "subject": "Meeting Reminder",
            "body": "Don't forget our meeting tomorrow at 2 PM."
        },
        {
            "to": "team@company.com",
            "subject": "Weekly Update",
            "body": "Here's this week's progress report..."
        }
    ]
}
```

### 複雜的巢狀物件 {#complex-nested-objects}

```python
{
    "type": "function",
    "function": {
        "name": "create_calendar_event",
        "description": "Create a new calendar event",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "start": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "time": {"type": "string"}
                    }
                },
                "attendees": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "email": {"type": "string"},
                            "optional": {"type": "boolean"}
                        }
                    }
                }
            },
            "required": ["title", "start"]
        }
    },
    "input_examples": [
        {
            "title": "Team Standup",
            "start": {
                "date": "2025-01-15",
                "time": "09:00"
            },
            "attendees": [
                {"email": "alice@example.com", "optional": False},
                {"email": "bob@example.com", "optional": True}
            ]
        },
        {
            "title": "Lunch Break",
            "start": {
                "date": "2025-01-15",
                "time": "12:00"
            }
            # No attendees - showing optional field
        }
    ]
}
```

### 對格式敏感的參數 {#format-sensitive-parameters}

```python
{
    "type": "function",
    "function": {
        "name": "search_flights",
        "description": "Search for available flights",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Airport code"},
                "destination": {"type": "string", "description": "Airport code"},
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "passengers": {"type": "integer"}
            },
            "required": ["origin", "destination", "date"]
        }
    },
    "input_examples": [
        {
            "origin": "SFO",
            "destination": "JFK",
            "date": "2025-03-15",
            "passengers": 2
        },
        {
            "origin": "LAX",
            "destination": "ORD",
            "date": "2025-04-20",
            "passengers": 1
        }
    ]
}
```

## 要求與限制 {#requirements-and-limitations}

### Schema 驗證 {#schema-validation}

- 每個範例**都必須有效**，且符合工具的 `input_schema`
- 無效範例會從 Anthropic 傳回 **400 錯誤**
- 驗證在伺服器端進行（LiteLLM 會將範例傳遞過去）

### 不支援伺服器端工具 {#server-side-tools-not-supported}

輸入範例**僅支援使用者定義的工具**。以下伺服器端工具**不**支援 `input_examples`：

- `web_search`（網頁搜尋工具）
- `code_execution`（程式碼執行工具）
- `computer_use`（電腦使用工具）
- `bash_tool`（bash 執行工具）
- `text_editor`（文字編輯器工具）

### Token 成本 {#token-costs}

範例會增加您的提示詞 token：

- **簡單範例**：每個範例約 20-50 個 token
- **複雜的巢狀物件**：每個範例約 100-200 個 token
- **取捨**：較高的 token 成本換取更好的工具呼叫準確度

### 模型相容性 {#model-compatibility}

輸入範例可與所有支援 `advanced-tool-use-2025-11-20` beta 標頭的 Claude 模型搭配使用：

- Claude Opus 4.5（`claude-opus-4-5-20251101`）
- Claude Sonnet 4.5（`claude-sonnet-4-5-20250929`）
- Claude Opus 4.1（`claude-opus-4-1-20250805`）

:::note
在 Google Cloud 的 Vertex AI 與 Amazon Bedrock 上，只有 Claude Opus 4.5 支援工具輸入範例。
:::

## 最佳實務 {#best-practices}

### 1. 顯示多樣化範例 {#1-show-diverse-examples}

包含能示範不同使用情境的範例：

```python
"input_examples": [
    {"location": "San Francisco, CA", "unit": "fahrenheit"},  # US city
    {"location": "Tokyo, Japan", "unit": "celsius"},          # International
    {"location": "New York, NY"}                              # Optional param omitted
]
```

### 2. 示範可選參數 {#2-demonstrate-optional-parameters}

展示何時應該與不應該包含可選參數：

```python
"input_examples": [
    {
        "query": "machine learning",
        "filters": {"year": 2024, "category": "research"}  # With optional filters
    },
    {
        "query": "artificial intelligence"  # Without optional filters
    }
]
```

### 3. 說明格式要求 {#3-illustrate-format-requirements}

透過範例讓格式期望更清楚：

```python
"input_examples": [
    {
        "phone": "+1-555-123-4567",  # Shows expected phone format
        "date": "2025-01-15",         # Shows date format (YYYY-MM-DD)
        "time": "14:30"               # Shows time format (HH:MM)
    }
]
```

### 4. 保持範例貼近實際 {#4-keep-examples-realistic}

使用真實、接近生產環境的範例，而非替代資料：

```python
# ✅ Good - realistic examples
"input_examples": [
    {"email": "alice@company.com", "role": "admin"},
    {"email": "bob@company.com", "role": "user"}
]

# ❌ Bad - placeholder examples
"input_examples": [
    {"email": "test@test.com", "role": "role1"},
    {"email": "example@example.com", "role": "role2"}
]
```

### 5. 限制範例數量 {#5-limit-example-count}

每個工具提供 2-5 個範例：

- **太少**（1 個）：可能無法呈現足夠的變化
- **剛剛好**（2-5 個）：在不膨脹 token 的情況下展示模式
- **太多**（10+ 個）：浪費 token，邊際效益遞減

## 與其他功能整合 {#integration-with-other-features}

輸入範例可與其他 Anthropic 工具功能無縫搭配：

### 搭配工具搜尋 {#with-tool-search}

```python
{
    "type": "function",
    "function": {
        "name": "query_database",
        "description": "Execute a SQL query",
        "parameters": {...}
    },
    "defer_loading": True,  # Tool search
    "input_examples": [     # Input examples
        {"sql": "SELECT * FROM users WHERE id = 1"}
    ]
}
```

### 搭配程式化工具呼叫 {#with-programmatic-tool-calling}

```python
{
    "type": "function",
    "function": {
        "name": "fetch_data",
        "description": "Fetch data from API",
        "parameters": {...}
    },
    "allowed_callers": ["code_execution_20250825"],  # Programmatic calling
    "input_examples": [                               # Input examples
        {"endpoint": "/api/users", "method": "GET"}
    ]
}
```

### 全部功能合併 {#all-features-combined}

```python
{
    "type": "function",
    "function": {
        "name": "advanced_tool",
        "description": "A complex tool",
        "parameters": {...}
    },
    "defer_loading": True,                            # Tool search
    "allowed_callers": ["code_execution_20250825"],  # Programmatic calling
    "input_examples": [                               # Input examples
        {"param1": "value1", "param2": "value2"}
    ]
}
```

## 提供者支援 {#provider-support}

LiteLLM 支援以下相容 Anthropic 的提供者之輸入範例：

- **標準 Anthropic API**（`anthropic/claude-sonnet-4-5-20250929`）✅
- **Azure Anthropic / Microsoft Foundry**（`azure/claude-sonnet-4-5-20250929`）✅
- **Amazon Bedrock**（`bedrock/invoke/anthropic.claude-opus-4-5-20251101-v1:0`）✅（僅 Opus 4.5）
- **Google Cloud Vertex AI**（`vertex_ai/claude-sonnet-4-5-20250929`）❌ 不支援

當 LiteLLM 偵測到具有 `input_examples` 欄位的工具時，會自動加入 beta 標頭（`advanced-tool-use-2025-11-20`）。

## 疑難排解 {#troubleshooting}

### 使用範例時出現「無效請求」錯誤 {#invalid-request-error-with-examples}

**問題**：使用輸入範例時收到 400 錯誤

**解決方案**：請確保每個範例都依據您的 `input_schema` 為有效：

```python
# Check that:
# 1. All required fields are present in examples
# 2. Field types match the schema
# 3. Enum values are valid
# 4. Nested objects follow the schema structure
```

### 範例未改善工具呼叫 {#examples-not-improving-tool-calls}

**問題**：新增範例似乎沒有幫助

**解決方案**：
1. **先檢查描述**：確保工具描述詳細且清楚
2. **檢視範例品質**：確認範例真實且多樣
3. **驗證 schema**：確認範例 वास्तव上符合您的 schema
4. **增加變化**：加入展示不同使用情境的範例

### Token 使用量過高 {#token-usage-too-high}

**問題**：輸入範例消耗太多 token

**解決方案**：
1. **減少範例數量**：使用 2-3 個範例，而非 5 個以上
2. **簡化範例**：移除範例中不必要的欄位
3. **考慮描述**：如果描述已清楚，可能不需要範例

## 何時不要使用輸入範例 {#when-not-to-use-input-examples}

在以下情況下請略過輸入範例：

- **工具很簡單**：單一參數且描述清楚的工具
- **Schema 已自我說明**：結構良好且說明完善的 schema
- **Token 預算緊縮**：每個範例會增加 20-200 個 token
- **伺服器端工具**：web_search、code_execution 等不支援範例

## 相關功能 {#related-features}

- [Anthropic 工具搜尋](./anthropic_tool_search.md) - 動態探索並按需載入工具
- [Anthropic 程式化工具呼叫](./anthropic_programmatic_tool_calling.md) - 從程式碼執行中呼叫工具
- [Anthropic 提供者](./anthropic.md) - Anthropic 提供者的一般文件
