# 診斷錯誤 - 提供者 vs 閘道 {#diagnosing-errors---provider-vs-gateway}

正在判斷錯誤是來自 **LLM 提供者**（OpenAI、Anthropic 等）還是來自 **LiteLLM AI Gateway** 本身時遇到困難嗎？以下是判斷方式。

## 快速規則 {#quick-rule}

**如果錯誤包含 `<Provider>Exception`，那就是來自提供者。**

| 錯誤包含 | 錯誤來源 |
|----------------|--------------|
| `AnthropicException` | Anthropic |
| `OpenAIException` | OpenAI |
| `AzureException` | Azure |
| `BedrockException` | AWS Bedrock |
| `VertexAIException` | Google Vertex AI |
| 沒有提供者名稱 | LiteLLM AI Gateway |

## 範例 {#examples}

### 提供者錯誤（來自 AWS Bedrock） {#provider-error-from-aws-bedrock}

```
{
  "error": {
    "message": "litellm.BadRequestError: BedrockException - {\"message\":\"The model returned the following errors: messages.1.content.0.type: Expected `thinking` or `redacted_thinking`, but found `text`.\"}",
    "type": "invalid_request_error",
    "param": null,
    "code": "400"
  }
}
```

這個錯誤來自 **AWS Bedrock**（請注意 `BedrockException`）。Bedrock API 因為訊息格式無效而拒絕了請求——這不是 LiteLLM 的問題。

### 提供者錯誤（來自 OpenAI） {#provider-error-from-openai}

```
{
  "error": {
    "message": "litellm.AuthenticationError: OpenAIException - Incorrect API key provided: <my-key>. You can find your API key at https://platform.openai.com/account/api-keys.",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

這個錯誤來自 **OpenAI**（請注意 `OpenAIException`）。LiteLLM 中設定的 OpenAI API 金鑰無效。

### 提供者錯誤（來自 Anthropic） {#provider-error-from-anthropic}

```
{
  "error": {
    "message": "litellm.InternalServerError: AnthropicException - Overloaded. Handle with `litellm.InternalServerError`.",
    "type": "internal_server_error",
    "param": null,
    "code": "500"
  }
}
```

這個錯誤來自 **Anthropic**（請注意 `AnthropicException`）。Anthropic API 過載了——這不是 LiteLLM 的問題。

### 閘道錯誤（來自 LiteLLM） {#gateway-error-from-litellm}

```
{
  "error": {
    "message": "Invalid API Key. Please check your LiteLLM API key.",
    "type": "auth_error",
    "param": null,
    "code": "401"
  }
}
```

這個錯誤來自 **LiteLLM AI Gateway**（沒有提供者名稱）。您的 LiteLLM 虛擬金鑰無效。

## 該怎麼做？ {#what-to-do}

| 錯誤來源 | 動作 |
|--------------|--------|
| 提供者錯誤 | 查看提供者的狀態頁面、調整速率限制，或稍後再試 |
| 閘道錯誤 | 檢查您的 LiteLLM 組態、API 金鑰，或 [開啟 issue](https://github.com/BerriAI/litellm/issues) |

## 另請參閱 {#see-also}

- [除錯](/docs/proxy/debugging) - 啟用 debug 記錄以查看詳細的請求/回應資訊
- [例外對應](/docs/exception_mapping) - LiteLLM 例外類型完整清單
