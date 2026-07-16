# 新增與 OpenAI 相容的提供者 {#adding-openai-compatible-providers}

對於簡單的 OpenAI 相容提供者（例如 Hyperbolic、Nscale 等），您可以透過編輯單一 JSON 檔案來新增支援。

## 快速開始 {#quick-start}

1. 編輯 `litellm/llms/openai_like/providers.json`
2. 新增您的提供者設定
3. 使用以下指令測試： `litellm.completion(model="your_provider/model-name", ...)`

## 基本設定 {#basic-configuration}

對於完全相容 OpenAI 的提供者：

```json
{
  "your_provider": {
    "base_url": "https://api.yourprovider.com/v1",
    "api_key_env": "YOUR_PROVIDER_API_KEY"
  }
}
```

就是這樣！此提供者現在已可使用。

## 設定選項 {#configuration-options}

### 必要欄位 {#required-fields}

- `base_url` - API 端點（例如：`https://api.provider.com/v1`）
- `api_key_env` - API 金鑰的環境變數名稱（例如：`PROVIDER_API_KEY`）

### 選用欄位 {#optional-fields}

- `api_base_env` - 用來覆寫 `base_url` 的環境變數
- `base_class` - 使用 `"openai_gpt"`（預設）或 `"openai_like"`
- `param_mappings` - 將 OpenAI 參數名稱對應至提供者特定名稱
- `constraints` - 參數值限制（最小/最大）
- `special_handling` - 特殊行為，例如內容格式轉換

## 範例 {#examples}

### 簡單提供者（完全相容） {#simple-provider-fully-compatible}

```json
{
  "hyperbolic": {
    "base_url": "https://api.hyperbolic.xyz/v1",
    "api_key_env": "HYPERBOLIC_API_KEY"
  }
}
```

### 具有參數對應的提供者 {#provider-with-parameter-mapping}

```json
{
  "publicai": {
    "base_url": "https://api.publicai.co/v1",
    "api_key_env": "PUBLICAI_API_KEY",
    "param_mappings": {
      "max_completion_tokens": "max_tokens"
    }
  }
}
```

### 具有限制的提供者 {#provider-with-constraints}

```json
{
  "custom_provider": {
    "base_url": "https://api.custom.com/v1",
    "api_key_env": "CUSTOM_API_KEY",
    "constraints": {
      "temperature_max": 1.0,
      "temperature_min": 0.0
    }
  }
}
```

## Responses API 支援 {#responses-api-support}

如果您的提供者也支援 OpenAI Responses API（`/v1/responses`），請新增 `supported_endpoints`：

```json
{
  "your_provider": {
    "base_url": "https://api.yourprovider.com/v1",
    "api_key_env": "YOUR_PROVIDER_API_KEY",
    "supported_endpoints": ["/v1/chat/completions", "/v1/responses"]
  }
}
```

這可在完全不需要額外程式碼的情況下啟用 `litellm.responses()`：

```python
import litellm

response = litellm.responses(
    model="your_provider/model-name",
    input="Hello, what can you do?",
)
print(response.output)
```

如果省略 `supported_endpoints`，預設為 `[]`。無論此欄位為何，JSON 提供者一律會啟用 chat completions。

此提供者會沿用 OpenAI Responses API 的所有請求/回應處理——串流、工具，以及所有標準參數都可直接運作。

## 使用方式 {#usage}

```python
import litellm
import os

# Set your API key
os.environ["YOUR_PROVIDER_API_KEY"] = "your-key-here"

# Chat completions
response = litellm.completion(
    model="your_provider/model-name",
    messages=[{"role": "user", "content": "Hello"}],
)

# Responses API (if supported_endpoints includes "/v1/responses")
response = litellm.responses(
    model="your_provider/model-name",
    input="Hello",
)
```

## 何時改用 Python {#when-to-use-python-instead}

如果您需要以下項目，請使用 Python 設定類別：

- 自訂驗證流程（OAuth、JWT 等）
- 複雜的請求/回應轉換
- 提供者特定的串流邏輯
- 進階工具呼叫修改

對於 chat completions，請在 `litellm/llms/your_provider/chat/transformation.py` 中建立繼承自 `OpenAIGPTConfig` 或 `OpenAILikeChatConfig` 的設定類別。

對於只需少量覆寫的 responses API，請繼承 `OpenAIResponsesAPIConfig`，並僅覆寫需要的部分。請參閱 `litellm/llms/perplexity/responses/transformation.py` 取得最小範例（約 40 行，相較於 400+ 行）。

## 測試 {#testing}

測試您的提供者：

```bash
# Quick test
python -c "
import litellm
import os
os.environ['PROVIDER_API_KEY'] = 'your-key'
response = litellm.completion(
    model='provider/model-name',
    messages=[{'role': 'user', 'content': 'test'}]
)
print(response.choices[0].message.content)
"
```

## 參考資料 {#reference}

請參閱 `litellm/llms/openai_like/providers.json` 中的現有提供者作為範例。
