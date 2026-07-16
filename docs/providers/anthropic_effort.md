import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Anthropic Effort 參數 {#anthropic-effort-parameter}

透過 `effort` 參數控制 Claude 在回應時使用多少 token，在回應完整性與 token 效率之間取得取捨。

## 概觀 {#overview}

`effort` 參數可讓您控制 Claude 在回應請求時願意花費多少 token。這使您能夠僅使用單一模型，在回應完整性與 token 效率之間做取捨。

**支援的模型：**
- **Claude 4.6**（Opus 4.6、Sonnet 4.6）— `output_config` 是穩定版 API 功能，不需要 beta 標頭。Opus 4.6 也支援 `effort="max"`。
- **Claude Opus 4.5** — 需要 `effort-2025-11-24` beta 標頭（LiteLLM 會自動加入）。

LiteLLM 會自動將所有支援模型的 `reasoning_effort` → `output_config={"effort": ...}`。

## Effort 的運作方式 {#how-effort-works}

預設情況下，Claude 會使用最大 effort——在最佳可能結果所需的範圍內盡可能花費最多 token。降低 effort 等級後，您可以指示 Claude 在 token 使用上更保守，進而以部分能力降低為代價，最佳化速度與成本。

**提示**：將 `effort` 設為 `"high"`，產生的行為與完全省略 `effort` 參數相同。

effort 參數會影響回應中的**所有 token**，包括：
- 文字回應與說明
- 工具呼叫與函式引數
- 延伸思考（啟用時）

這種做法有兩大優點：
1. 不需要啟用 thinking 也能使用。
2. 它可以影響所有 token 花費，包括工具呼叫。例如，較低的 effort 代表 Claude 會發出較少的工具呼叫。

這提供了更高程度的效率控制。

## Effort 等級 {#effort-levels}

| 等級 | 說明 | 典型使用情境 |
|-------|-------------|------------------|
| `max` | 超越 high 的最大能力 — Claude 會使用更多 token 以獲得最完整的結果。**僅支援 Claude Opus 4.6。** | 最困難的推理問題、複雜的多步驟研究 |
| `high` | 最大能力—Claude 會在最佳可能結果所需的範圍內盡可能使用最多 token。等同於未設定此參數。 | 複雜推理、困難的程式設計問題、代理式任務 |
| `medium` | 兼顧效能與適度 token 節省的平衡做法。 | 需要在速度、成本與效能之間取得平衡的代理式任務 |
| `low` | 最有效率—在部分能力降低下可大幅節省 token。 | 需要最佳速度與最低成本的較簡單任務，例如子代理 |

## 快速開始 {#quick-start}

### 使用 LiteLLM SDK {#using-litellm-sdk}

<Tabs>
<TabItem value="python" label="Python">

```python
import litellm

# Works with Claude 4.6 models (no beta header needed)
response = litellm.completion(
    model="anthropic/claude-sonnet-4-6",
    messages=[{
        "role": "user",
        "content": "Analyze the trade-offs between microservices and monolithic architectures"
    }],
    reasoning_effort="medium"  # Automatically mapped to output_config
)

print(response.choices[0].message.content)
```

```python
# Also works with Claude Opus 4.5 (beta header auto-injected)
response = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{
        "role": "user",
        "content": "Analyze the trade-offs between microservices and monolithic architectures"
    }],
    reasoning_effort="medium"
)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude 4.6 — output_config is a stable API feature (no beta header)
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: "Analyze the trade-offs between microservices and monolithic architectures"
  }],
  output_config: {
    effort: "medium"
  }
});

console.log(response.content[0].text);
```

</TabItem>
</Tabs>

### 使用 LiteLLM Proxy {#using-litellm-proxy}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "anthropic/claude-sonnet-4-6",
    "messages": [{
      "role": "user",
      "content": "Analyze the trade-offs between microservices and monolithic architectures"
    }],
    "reasoning_effort": "medium"
  }'
```

### 直接呼叫 Anthropic API {#direct-anthropic-api-call}

<Tabs>
<TabItem value="46" label="Claude 4.6（穩定版）">

```bash
# Claude 4.6 — no beta header needed
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 4096,
    "messages": [{
      "role": "user",
      "content": "Analyze the trade-offs between microservices and monolithic architectures"
    }],
    "output_config": {
      "effort": "medium"
    }
  }'
```

</TabItem>
<TabItem value="45" label="Claude Opus 4.5（beta）">

```bash
# Claude Opus 4.5 — requires beta header
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "anthropic-beta: effort-2025-11-24" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-opus-4-5-20251101",
    "max_tokens": 4096,
    "messages": [{
      "role": "user",
      "content": "Analyze the trade-offs between microservices and monolithic architectures"
    }],
    "output_config": {
      "effort": "medium"
    }
  }'
```

</TabItem>
</Tabs>

## 模型相容性 {#model-compatibility}

effort 參數支援：
- **Claude Opus 4.6**（`claude-opus-4-6`）— 支援 `high`、`medium`、`low`，以及 `max`
- **Claude Sonnet 4.6**（`claude-sonnet-4-6`）— 支援 `high`、`medium`、`low`
- **Claude Opus 4.5**（`claude-opus-4-5-20251101`）— 支援 `high`、`medium`、`low`

:::info
`effort="max"` 僅可在 Claude Opus 4.6 上使用。與其他模型一起使用時，會引發驗證錯誤。
:::

## 我應該何時調整 Effort 參數？ {#when-should-i-adjust-the-effort-parameter}

- 當您需要 Claude 的最佳表現時，使用**高 effort**（預設值）——例如複雜推理、細膩分析、困難的程式設計問題，或任何品質最重要的任務。

- 當您希望在不完全達到高 effort 的 token 花費下仍保有穩定效能時，使用**中等 effort**作為平衡選項。

- 當您優先考量速度（因為 Claude 會以較少的 token 回應）或成本時，使用**低 effort**——例如簡單分類任務、快速查詢，或大量使用情境，且額外延遲或花費無法合理化邊際品質提升時。

## 與工具使用搭配的 Effort {#effort-with-tool-use}

使用工具時，effort 參數會同時影響工具呼叫周圍的說明以及工具呼叫本身。較低的 effort 等級通常會：
- 將多個操作合併成較少的工具呼叫
- 發出較少的工具呼叫
- 直接採取行動

工具使用範例：

```python
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-6",
    messages=[{
        "role": "user",
        "content": "Check the weather in multiple cities"
    }],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }],
    reasoning_effort="low"  # Mapped to output_config — will make fewer tool calls
)
```

## 與延伸思考搭配的 Effort {#effort-with-extended-thinking}

effort 參數可與延伸思考無縫搭配運作。當兩者都啟用時，effort 會控制所有回應類型的 token 預算：

```python
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-6",
    messages=[{
        "role": "user",
        "content": "Solve this complex problem"
    }],
    reasoning_effort="medium"  # Mapped to adaptive thinking + output_config for 4.6 models
)
```

## 最佳實務 {#best-practices}

1. **新任務先從預設值（高）開始**，如果您想最佳化成本，再嘗試較低的 effort 等級。

2. **生產環境的代理式工作流程使用中等 effort**，以便在品質與效率之間取得平衡。

3. **低 effort 保留給大量、簡單的任務**，例如分類、路由或資料擷取，因為速度比細膩回應更重要。

4. **監控 token 使用量**，以了解不同 effort 等級在您的特定使用情境下所帶來的實際節省。

5. **使用您的特定 prompts 進行測試**，因為 effort 等級的影響會依任務複雜度而有所不同。

## 提供者支援 {#provider-support}

effort 參數可跨所有相容 Anthropic 的提供者使用：

- **Standard Anthropic API**：✅ 支援（Claude 4.6、Opus 4.5）
- **Azure Anthropic / Microsoft Foundry**：✅ 支援（Claude 4.6、Opus 4.5）
- **Amazon Bedrock**：✅ 支援（Claude 4.6、Opus 4.5）
- **Google Cloud Vertex AI**：✅ 支援（Claude 4.6、Opus 4.5）

LiteLLM 會自動處理：
- 參數對應：`reasoning_effort` → `output_config={"effort": ...}`，適用於所有支援模型
- beta 標頭注入（`effort-2025-11-24`）僅適用於 Claude Opus 4.5（4.6 模型不需要）

## 使用方式與計價 {#usage-and-pricing}

不同 effort 等級的 token 使用量會記錄在標準用量物件中。較低的 effort 等級會產生較少的輸出 token，進而直接降低成本：

```python
response = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{"role": "user", "content": "Analyze this"}],
    output_config={"effort": "low"}
)

print(f"Output tokens: {response.usage.completion_tokens}")
print(f"Total tokens: {response.usage.total_tokens}")
```

## 疑難排解 {#troubleshooting}

### 未加入 beta 標頭（Claude Opus 4.5） {#beta-header-not-being-added-claude-opus-45}

當提供 `reasoning_effort` 或 `output_config` 時，LiteLLM 會自動為 Claude Opus 4.5 加入 `effort-2025-11-24` beta 標頭。

**注意：** Claude 4.6 模型不需要 beta 標頭——`output_config` 是這些模型的穩定版 API 功能。

如果您在 Opus 4.5 看不到此標頭：

1. 確認您使用的是 `reasoning_effort` 參數
2. 驗證模型是否為 Claude Opus 4.5
3. 檢查 LiteLLM 版本是否支援此功能

### 無效的 effort 值錯誤 {#invalid-effort-value-error}

可接受的值：`"high"`、`"medium"`、`"low"`，以及 `"max"`（僅限 Opus 4.6）。任何其他值都會引發驗證錯誤：

```python
# ❌ This will raise an error
output_config={"effort": "very_low"}

# ✅ Use one of the valid values
output_config={"effort": "low"}

# ❌ This will raise an error (max only works on Opus 4.6)
litellm.completion(model="anthropic/claude-sonnet-4-6", reasoning_effort="max", ...)

# ✅ max is only for Opus 4.6
litellm.completion(model="anthropic/claude-opus-4-6", reasoning_effort="max", ...)
```

### 不支援的模型 {#model-not-supported}

Claude Opus 4.6、Sonnet 4.6，以及 Opus 4.5 都支援 effort 參數。與其他模型一起使用時，可能會導致該參數被忽略或產生錯誤。

## 相關功能 {#related-features}

- [延伸思考](/docs/providers/anthropic_extended_thinking) - 控制 Claude 的推理流程
- [工具使用](/docs/providers/anthropic_tools) - 讓 Claude 使用工具與函式
- [程式化工具呼叫](/docs/providers/anthropic_programmatic_tool_calling) - 讓 Claude 撰寫可呼叫工具的程式碼
- [Prompt 快取](/docs/providers/anthropic_prompt_caching) - 快取 prompts 以降低成本

## 其他資源 {#additional-resources}

- [Anthropic Effort 文件](https://docs.anthropic.com/en/docs/build-with-claude/effort)
- [LiteLLM Anthropic 提供者指南](/docs/providers/anthropic)
- [成本最佳化最佳實務](/docs/guides/cost_optimization)
