---
title: Responses API 的提示詞管理
---

# 搭配 Responses API 的提示詞管理 {#prompt-management-with-responses-api}

透過傳入 `prompt_id` 與可選的 `prompt_variables`，使用 LiteLLM Prompt Management 搭配 `/v1/responses`。

## 基本用法 {#basic-usage}

```bash
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt_id": "my-responses-prompt",
    "prompt_variables": {"topic": "large language models"},
    "input": []
  }'
```

## 在 `input` 中的多輪後續追問 {#multi-turn-follow-up-in-input}

若要在一次請求中送出後續輪次，請將訊息歷史傳入 `input`。

```bash
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt_id": "my-responses-prompt",
    "prompt_variables": {"topic": "large language models"},
    "input": [
      {"role": "user", "content": "Topic is LLMs. Start short."},
      {"role": "assistant", "content": "Sure, go ahead."},
      {"role": "user", "content": "Now give me 3 bullets and include pricing caveat."}
    ]
  }'
```

## 注意事項 {#notes}

- 提示詞範本訊息會與您的 `input` 訊息合併。
- 提示詞變數替換會套用於提示詞訊息內容。
- 工具呼叫酬載欄位不會由提示詞變數替換。
- 若要對 `previous_response_id` 的後續追問套用提示詞管理，請再次包含 `prompt_id`。
