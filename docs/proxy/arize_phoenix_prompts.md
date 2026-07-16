# Arize Phoenix 提示管理 {#arize-phoenix-prompt-management}

使用來自 [Arize Phoenix](https://phoenix.arize.com/) 的提示版本搭配 LiteLLM SDK 和 Proxy。

## 快速開始 {#quick-start}

### SDK {#sdk}

```python
import litellm

response = litellm.completion(
    model="gpt-4o",
    prompt_id="UHJvbXB0VmVyc2lvbjox",
    prompt_integration="arize_phoenix",
    api_key="your-arize-phoenix-token",
    api_base="https://app.phoenix.arize.com/s/your-workspace",
    prompt_variables={"question": "What is AI?"},
)
```

### Proxy {#proxy}

**1. 將提示新增至設定**

```yaml
prompts:
  - prompt_id: "simple_prompt"
    litellm_params:
      prompt_id: "UHJvbXB0VmVyc2lvbjox"
      prompt_integration: "arize_phoenix"
      api_base: https://app.phoenix.arize.com/s/your-workspace
      api_key: os.environ/PHOENIX_API_KEY
      ignore_prompt_manager_model: true # optional: use model from config instead
      ignore_prompt_manager_optional_params: true # optional: ignore temp, max_tokens from prompt
```

**2. 發出請求**

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-3.5-turbo",
    "prompt_id": "simple_prompt",
    "prompt_variables": {
      "question": "Explain quantum computing"
    }
  }'
```

## 設定 {#configuration}

### 取得 Arize Phoenix 憑證 {#get-arize-phoenix-credentials}

1. **API Token**：從 [Arize Phoenix 設定](https://app.phoenix.arize.com/) 取得
2. **Workspace URL**：`https://app.phoenix.arize.com/s/{your-workspace}`
3. **Prompt ID**：可在提示版本 URL 中找到

**設定環境變數**：
```bash
export PHOENIX_API_KEY="your-token"
```

### SDK + PROXY 選項 {#sdk--proxy-options}

| 參數 | 必要 | 說明 |
|-----------|----------|-------------|
| `prompt_id` | 是 | Arize Phoenix 提示版本 ID |
| `prompt_integration` | 是 | 設為 `"arize_phoenix"` |
| `api_base` | 是 | Workspace URL |
| `api_key` | 是 | 存取權杖 |
| `prompt_variables` | 否 | 範本的變數 |

### 僅限 Proxy 的選項 {#proxy-only-options}

| 參數 | 說明 |
|-----------|-------------|
| `ignore_prompt_manager_model` | 使用設定中的 model，而非提示的 model |
| `ignore_prompt_manager_optional_params` | 忽略提示中的 temperature、max_tokens |

## 變數範本 {#variable-templates}

Arize Phoenix 使用 Mustache/Handlebars 語法：

```python
# Template: "Hello {{name}}, question: {{question}}"
prompt_variables = {
    "name": "Alice",
    "question": "What is ML?"
}
# Result: "Hello Alice, question: What is ML?"
```


## 與其他訊息合併 {#combine-with-additional-messages}

```python
response = litellm.completion(
    model="gpt-4o",
    prompt_id="UHJvbXB0VmVyc2lvbjox",
    prompt_integration="arize_phoenix",
    api_base="https://app.phoenix.arize.com/s/your-workspace",
    prompt_variables={"question": "Explain AI"},
    messages=[
        {"role": "user", "content": "Keep it under 50 words"}
    ]
)
```


## 錯誤處理 {#error-handling}

```python
try:
    response = litellm.completion(
        model="gpt-4o",
        prompt_id="invalid-id",
        prompt_integration="arize_phoenix",
        api_base="https://app.phoenix.arize.com/s/workspace"
    )
except Exception as e:
    print(f"Error: {e}")
    # 404: Prompt not found
    # 401: Invalid credentials
    # 403: Access denied
```

## 支援 {#support}

- [LiteLLM GitHub 問題](https://github.com/BerriAI/litellm/issues)
- [Arize Phoenix 文件](https://docs.arize.com/phoenix)
