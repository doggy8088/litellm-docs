# Anthropic 程式化工具呼叫 {#anthropic-programmatic-tool-calling}

程式化工具呼叫可讓 Claude 撰寫程式碼，在程式執行容器內以程式化方式呼叫您的工具，而不是在每次工具呼叫時都必須透過模型往返。這可降低多工具工作流程的延遲，並透過讓 Claude 在資料進入模型的 context window 之前先進行篩選或處理，來減少 token 消耗。

:::info
程式化工具呼叫目前處於公開 beta。LiteLLM 會自動偵測具有 `allowed_callers` 欄位的工具，並依據您的提供者加入適當的 beta 標頭：

- **Anthropic API 與 Microsoft Foundry**：`advanced-tool-use-2025-11-20`
- **Amazon Bedrock**：`advanced-tool-use-2025-11-20`
- **Google Cloud Vertex AI**：不支援

此功能需要啟用程式執行工具。
:::

## 模型相容性 {#model-compatibility}

下列模型支援程式化工具呼叫：

| 模型 | 工具版本 |
|-------|--------------|
| Claude Opus 4.5 (`claude-opus-4-5-20251101`) | `code_execution_20250825` |
| Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) | `code_execution_20250825` |

## 快速開始 {#quick-start}

以下是一個簡單範例，Claude 會以程式化方式多次查詢資料庫並彙總結果：

```python
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[
        {
            "role": "user",
            "content": "Query sales data for the West, East, and Central regions, then tell me which region had the highest revenue"
        }
    ],
    tools=[
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        },
        {
            "type": "function",
            "function": {
                "name": "query_database",
                "description": "Execute a SQL query against the sales database. Returns a list of rows as JSON objects.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sql": {
                            "type": "string",
                            "description": "SQL query to execute"
                        }
                    },
                    "required": ["sql"]
                }
            },
            "allowed_callers": ["code_execution_20250825"]
        }
    ]
)

print(response)
```

## 運作方式 {#how-it-works}

當您將工具設定為可從程式執行中呼叫，而 Claude 決定使用該工具時：

1. Claude 會撰寫 Python 程式碼，將工具作為函式呼叫，可能包含多個工具呼叫以及前後處理邏輯
2. Claude 透過程式執行在沙箱容器中執行此程式碼
3. 當工具函式被呼叫時，程式執行會暫停，API 會回傳包含 `caller` 欄位的 `tool_use` 區塊
4. 您提供工具結果後，程式執行會繼續（中間結果不會載入 Claude 的 context window）
5. 當所有程式執行完成後，Claude 會接收最終輸出並繼續執行任務

這種方式特別適合：

- **大量資料處理**：在結果進入 Claude 的 context 之前先篩選或彙總工具結果
- **多步驟工作流程**：以串聯或迴圈方式呼叫工具，而不在工具呼叫之間重新取樣 Claude，以節省 token 與延遲
- **條件式邏輯**：根據中間工具結果做出決策

## `allowed_callers` 欄位 {#the-allowed_callers-field}

`allowed_callers` 欄位指定哪些 context 可以呼叫工具：

```python
{
    "type": "function",
    "function": {
        "name": "query_database",
        "description": "Execute a SQL query against the database",
        "parameters": {...}
    },
    "allowed_callers": ["code_execution_20250825"]
}
```

**可能的值：**

- `["direct"]` - 只有 Claude 可以直接呼叫此工具（若省略則為預設值）
- `["code_execution_20250825"]` - 僅能從程式執行內部呼叫
- `["direct", "code_execution_20250825"]` - 可直接呼叫，也可從程式執行中呼叫

:::tip
我們建議每個工具選擇 `["direct"]` 或 `["code_execution_20250825"]` 其一，而不是同時啟用兩者，因為這能更清楚地引導 Claude 如何最佳使用該工具。
:::

## 回應中的 `caller` 欄位 {#the-caller-field-in-responses}

每個工具使用區塊都包含一個 `caller` 欄位，用來指出其呼叫方式：

**直接呼叫（傳統工具使用）：**

```python
{
    "type": "tool_use",
    "id": "toolu_abc123",
    "name": "query_database",
    "input": {"sql": "<sql>"},
    "caller": {"type": "direct"}
}
```

**程式化呼叫：**

```python
{
    "type": "tool_use",
    "id": "toolu_xyz789",
    "name": "query_database",
    "input": {"sql": "<sql>"},
    "caller": {
        "type": "code_execution_20250825",
        "tool_id": "srvtoolu_abc123"
    }
}
```

`tool_id` 會參照執行該程式化呼叫的程式執行工具。

## 容器生命週期 {#container-lifecycle}

程式化工具呼叫使用程式執行容器：

- **容器建立**：除非您重複使用現有容器，否則每個工作階段都會建立新的容器
- **到期**：容器在約 4.5 分鐘沒有活動後會到期（可能變更）
- **容器 ID**：傳遞 `container` 參數以重複使用現有容器
- **重用**：傳遞容器 ID 以在多次請求之間維持狀態

```python
# First request - creates a new container
response1 = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "Query the database"}],
    tools=[...]
)

# Get container ID from response (if available in response metadata)
container_id = response1.get("container", {}).get("id")

# Second request - reuse the same container
response2 = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[...],
    tools=[...],
    container=container_id  # Reuse container
)
```

:::warning
當工具以程式化方式呼叫，且容器正在等待您的工具結果時，您必須在容器到期前回應。請監控 `expires_at` 欄位。如果容器到期，Claude 可能會將此工具呼叫視為逾時並重試。
:::

## 範例工作流程 {#example-workflow}

### 步驟 1：初始請求 {#step-1-initial-request}

```python
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{
        "role": "user",
        "content": "Query customer purchase history from the last quarter and identify our top 5 customers by revenue"
    }],
    tools=[
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        },
        {
            "type": "function",
            "function": {
                "name": "query_database",
                "description": "Execute a SQL query against the sales database. Returns a list of rows as JSON objects.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sql": {"type": "string", "description": "SQL query to execute"}
                    },
                    "required": ["sql"]
                }
            },
            "allowed_callers": ["code_execution_20250825"]
        }
    ]
)
```

### 步驟 2：含工具呼叫的 API 回應 {#step-2-api-response-with-tool-call}

Claude 會撰寫呼叫您工具的程式碼。回應包含：

```python
{
    "role": "assistant",
    "content": [
        {
            "type": "text",
            "text": "I'll query the purchase history and analyze the results."
        },
        {
            "type": "server_tool_use",
            "id": "srvtoolu_abc123",
            "name": "code_execution",
            "input": {
                "code": "results = await query_database('<sql>')\ntop_customers = sorted(results, key=lambda x: x['revenue'], reverse=True)[:5]"
            }
        },
        {
            "type": "tool_use",
            "id": "toolu_def456",
            "name": "query_database",
            "input": {"sql": "<sql>"},
            "caller": {
                "type": "code_execution_20250825",
                "tool_id": "srvtoolu_abc123"
            }
        }
    ],
    "stop_reason": "tool_use"
}
```

### 步驟 3：提供工具結果 {#step-3-provide-tool-result}

```python
# Add assistant's response and tool result to conversation
messages = [
    {"role": "user", "content": "Query customer purchase history..."},
    {
        "role": "assistant",
        "content": response.choices[0].message.content,
        "tool_calls": response.choices[0].message.tool_calls
    },
    {
        "role": "user",
        "content": [
            {
                "type": "tool_result",
                "tool_use_id": "toolu_def456",
                "content": '[{"customer_id": "C1", "revenue": 45000}, ...]'
            }
        ]
    }
]

# Continue the conversation
response2 = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=messages,
    tools=[...]
)
```

### 步驟 4：最終回應 {#step-4-final-response}

當程式執行完成後，Claude 會提供最終回應：

```python
{
    "content": [
        {
            "type": "code_execution_tool_result",
            "tool_use_id": "srvtoolu_abc123",
            "content": {
                "type": "code_execution_result",
                "stdout": "Top 5 customers by revenue:\n1. Customer C1: $45,000\n...",
                "stderr": "",
                "return_code": 0
            }
        },
        {
            "type": "text",
            "text": "I've analyzed the purchase history from last quarter. Your top 5 customers generated $167,500 in total revenue..."
        }
    ],
    "stop_reason": "end_turn"
}
```

## 進階模式 {#advanced-patterns}

### 透過迴圈進行批次處理 {#batch-processing-with-loops}

Claude 可以撰寫程式碼高效率處理多個項目：

```python
# Claude writes code like this:
regions = ["West", "East", "Central", "North", "South"]
results = {}
for region in regions:
    data = await query_database(f"SELECT SUM(revenue) FROM sales WHERE region='{region}'")
    results[region] = data[0]["total"]

top_region = max(results.items(), key=lambda x: x[1])
print(f"Top region: {top_region[0]} with ${top_region[1]:,}")
```

此模式：
- 將模型往返次數從 N 次（每個區域一次）降為 1 次
- 在將大型結果集回傳給 Claude 之前，以程式化方式處理
- 只回傳彙總結論以節省 token

### 提早終止 {#early-termination}

Claude 可以在達成成功條件後立即停止處理：

```python
endpoints = ["us-east", "eu-west", "apac"]
for endpoint in endpoints:
    status = await check_health(endpoint)
    if status == "healthy":
        print(f"Found healthy endpoint: {endpoint}")
        break  # Stop early
```

### 資料篩選 {#data-filtering}

```python
logs = await fetch_logs(server_id)
errors = [log for log in logs if "ERROR" in log]
print(f"Found {len(errors)} errors")
for error in errors[-10:]:  # Only return last 10 errors
    print(error)
```

## 最佳做法 {#best-practices}

### 工具設計 {#tool-design}

- **提供詳細的輸出說明**：由於 Claude 會在程式中反序列化工具結果，請清楚說明格式（JSON 結構、欄位型別等）
- **回傳結構化資料**：JSON 或其他易於解析的格式最適合用於程式化處理
- **保持回應簡潔**：只回傳必要資料，以將處理負擔降到最低

### 何時使用程式化呼叫 {#when-to-use-programmatic-calling}

**適合的使用案例：**

- 處理大型資料集且只需要彙總或摘要
- 具有 3 次以上相依工具呼叫的多步驟工作流程
- 需要對工具結果進行篩選、排序或轉換的操作
- 中間資料不應影響 Claude 推理的任務
- 跨多個項目的平行操作（例如檢查 50 個端點）

**較不理想的使用案例：**

- 只有單次工具呼叫且回應簡單
- 需要立即使用者回饋的工具
- 非常快速的操作，若加入程式執行額外負擔，效益將被抵銷

## Token 效率 {#token-efficiency}

程式化工具呼叫可大幅降低 token 消耗：

- **來自程式化呼叫的工具結果不會加入 Claude 的 context** - 只有最終程式輸出會加入
- **中間處理由程式完成** - 篩選、彙總等不會消耗模型 token
- **在一次程式執行中進行多次工具呼叫** - 與分開的模型回合相比可降低負擔

例如，直接呼叫 10 個工具所使用的 token，約為以程式化方式呼叫並回傳摘要的 10 倍。

## 提供者支援 {#provider-support}

LiteLLM 支援以下與 Anthropic 相容的提供者上的程式化工具呼叫：

- **標準 Anthropic API** (`anthropic/claude-sonnet-4-5-20250929`) ✅
- **Azure Anthropic / Microsoft Foundry** (`azure/claude-sonnet-4-5-20250929`) ✅
- **Amazon Bedrock** (`bedrock/invoke/anthropic.claude-sonnet-4-5-20250929-v1:0`) ✅
- **Google Cloud Vertex AI** (`vertex_ai/claude-sonnet-4-5-20250929`) ❌ 不支援

當 LiteLLM 偵測到具有 `allowed_callers` 欄位的工具時，會自動加入 beta 標頭（`advanced-tool-use-2025-11-20`）。

## 限制 {#limitations}

### 功能不相容 {#feature-incompatibilities}

- **結構化輸出**：具有 `strict: true` 的工具不支援程式化呼叫
- **工具選擇**：您無法透過 `tool_choice` 強制對特定工具進行程式化呼叫
- **平行工具使用**：`disable_parallel_tool_use: true` 不支援程式化呼叫

### 工具限制 {#tool-restrictions}

目前下列工具無法以程式化方式呼叫：

- 網頁搜尋
- 網頁擷取
- MCP 連接器提供的工具

## 疑難排解 {#troubleshooting}

### 常見問題 {#common-issues}

**「Tool not allowed」錯誤**

- 確認您的工具定義包含 `"allowed_callers": ["code_execution_20250825"]`
- 檢查您是否使用相容模型（Claude Sonnet 4.5 或 Opus 4.5）

**容器到期**

- 確保您在容器生命週期內（約 4.5 分鐘）回應工具呼叫
- 考慮實作更快的工具執行

**未新增 beta 標頭**

- LiteLLM 在偵測到 `allowed_callers` 時會自動加入 beta 標頭
- 如果您手動設定標頭，請確認已包含 `advanced-tool-use-2025-11-20`

## 相關功能 {#related-features}

- [Anthropic 工具搜尋](./anthropic_tool_search.md) - 依需求動態探索並載入工具
- [Anthropic 提供者](./anthropic.md) - Anthropic 提供者一般文件
