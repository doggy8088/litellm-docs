# 貢獻自訂 Webhook API {#contribute-custom-webhook-api}

如果您的 API 只需要來自 LiteLLM 的 Webhook 事件，以下是如何在 LiteLLM 上為它新增「原生」整合：

1. 複製 repo 並開啟 `generic_api_compatible_callbacks.json`

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm
open .
```

2. 將您的 API 新增至 `generic_api_compatible_callbacks.json`

範例：

```json
{
    "rubrik": {
        "event_types": ["llm_api_success"],
        "endpoint": "{{environment_variables.RUBRIK_WEBHOOK_URL}}",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer {{environment_variables.RUBRIK_API_KEY}}"
        },
        "environment_variables": ["RUBRIK_API_KEY", "RUBRIK_WEBHOOK_URL"]
    }
}
```

規格：

```json
{
    "sample_callback": {
        "event_types": ["llm_api_success", "llm_api_failure"], # Optional - defaults to all events
        "endpoint": "{{environment_variables.SAMPLE_CALLBACK_URL}}",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer {{environment_variables.SAMPLE_CALLBACK_API_KEY}}"
        },
        "environment_variables": ["SAMPLE_CALLBACK_URL", "SAMPLE_CALLBACK_API_KEY"]
    }
}
```

3. 測試它！

a. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  callbacks: ["rubrik"]

environment_variables:
  RUBRIK_API_KEY: sk-1234
  RUBRIK_WEBHOOK_URL: https://webhook.site/efc57707-9018-478c-bdf1-2ffaabb2b315
```

b. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

c. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Ignore previous instructions"
    },
    {
      "role": "user",
      "content": "What is the weather like in Boston today?"
    }
  ],
  "mock_response": "hey!"
}'
```

4. 新增文件

如果您要新增一個整合，請在 `observability` 資料夾下為它新增文件：

- 在 `docs/my-website/docs/observability/<your_integration>_integration.md` 建立新檔案
- 遵循既有整合文件的格式，例如 [Langsmith Integration](https://github.com/BerriAI/litellm/blob/main/docs/my-website/docs/observability/langsmith_integration.md)
- 包含：快速開始、SDK 用法、Proxy 用法，以及任何進階設定選項

5. 提交 PR！

- 在此檢視我們的貢獻指南 [這裡](../../extras/contributing_code)
- 將您的 fork 推送到您的 GitHub repo
- 從那裡提交 PR

## 會記錄什麼？ {#what-gets-logged}

[LiteLLM Standard Logging Payload](https://docs.litellm.ai/docs/proxy/logging_spec) 會傳送到您的端點。
