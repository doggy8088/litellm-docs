---
title: "透過 LiteLLM AI 閘道使用 StreamLake API"
sidebar_label: "StreamLake"
description: "透過 LiteLLM 以 Python SDK 或閘道呼叫 StreamLake 模型。設定您的 API 金鑰、模型或端點 ID，以及選擇性的 API base。"
---

# StreamLake {#streamlake}

[StreamLake](https://streamlake.ai) 提供與 OpenAI 相容的聊天完成 API。使用 `streamlake/` 前綴，搭配您 StreamLake 帳戶中的模型名稱或端點 ID。

<SinceVersion v="1.109.0-dev.2" />

提供者支援於 [PR #41006](https://github.com/BerriAI/litellm/pull/41006) 加入。請使用此開發版本，或後續包含該提供者的版本。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者前綴 | `streamlake/` |
| API 金鑰環境變數 | `STREAMLAKE_API_KEY` |
| 預設 API base | `https://vanchin.streamlake.ai/api/gateway/v1/endpoints` |
| 選擇性的 API base 覆寫 | `STREAMLAKE_API_BASE` 或 `api_base` 參數 |
| 上游端點 | `/chat/completions` |
| 提供者文件 | [StreamLake API 文件](https://streamlake.ai/document/DOC/mg6k6nlp8j6qxicx4c9) |

## 設定 {#setup}

在您的 StreamLake 帳戶中建立 API 金鑰，並在啟動 SDK 或 proxy 之前將其匯出：

```bash
export STREAMLAKE_API_KEY="your-streamlake-api-key"
```

對於您帳戶可用的模型，使用 `streamlake/<model-name>`；對於已部署的端點，使用 `streamlake/<endpoint-id>`。請將下方範例的 `ep-your-endpoint-id` 換成您實際的端點 ID。LiteLLM 在將模型值傳送給 StreamLake 之前，會先移除 `streamlake/` 前綴。

## LiteLLM Python SDK {#litellm-python-sdk}

```python
from litellm import completion

response = completion(
    model="streamlake/ep-your-endpoint-id",
    messages=[{"role": "user", "content": "Hello from LiteLLM"}],
    max_tokens=128,
)

print(response.choices[0].message.content)
```

若要使用串流，傳入 `stream=True` 並逐一處理回應區塊：

```python
from litellm import completion

response = completion(
    model="streamlake/ep-your-endpoint-id",
    messages=[{"role": "user", "content": "Hello from LiteLLM"}],
    max_tokens=128,
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

LiteLLM 會將 `max_tokens` 對應至 StreamLake 的 `max_completion_tokens`。工具呼叫與推理的支援程度取決於所選的模型。

## LiteLLM Gateway {#litellm-gateway}

將此設定儲存為 `config.yaml`：

```yaml
model_list:
  - model_name: streamlake-model
    litellm_params:
      model: streamlake/ep-your-endpoint-id
      api_key: os.environ/STREAMLAKE_API_KEY
```

在 proxy 的環境中匯出 API 金鑰後啟動它：

```bash
litellm --config config.yaml
```

使用已設定的模型別名傳送請求：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "streamlake-model",
    "messages": [{"role": "user", "content": "Hello from LiteLLM"}],
    "max_tokens": 128
  }'
```

如果您的 proxy 需要驗證，也請傳送 `Authorization: Bearer <your-litellm-key>`。這是您的 LiteLLM 金鑰，不是 StreamLake API 金鑰。

LiteLLM 也透過其轉換層接受聊天模型的 [Anthropic Messages](/docs/anthropic_unified) 與 [Responses API](/docs/response_api) 請求。這些請求使用的是 StreamLake 的聊天完成端點，而不是 StreamLake 原生的 Messages 或 Responses 端點。
