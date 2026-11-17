---
title: "透過 LiteLLM 使用 Wally API：Python SDK 與 Gateway"
sidebar_label: "Wally"
description: 透過 LiteLLM 以 Python SDK 或 Gateway 呼叫 RunAnywhere 的 Wally 模型。設定您的 API 金鑰、模型名稱與選用的 API base。
---

# Wally {#wally}

[Wally](https://runwally.com) 是 RunAnywhere 針對開放模型提供的託管推論服務，具備與 OpenAI 相容的 chat completions API。使用 `wally/` 前綴搭配您 Wally 主控台中的模型名稱。

<SinceVersion v="1.110.0" />

提供者支援是在 [PR #45662](https://github.com/BerriAI/litellm/pull/45662) 中加入的。請使用此版本或包含該提供者的較新版本。

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者前綴 | `wally/` |
| API 金鑰環境變數 | `WALLY_API_KEY` |
| 預設 API base | `https://inference.runanywhere.ai/v1` |
| 選用的 API base 覆寫 | `WALLY_API_BASE` 或 `api_base` 參數 |
| 上游端點 | `/chat/completions` |
| 提供者文件 | [Wally 與 OpenAI 相容的 API](https://docs.runanywhere.ai/wally-cloud/api) |

## 設定 {#setup}

在 RunAnywhere 主控台建立一個 cloud API 金鑰，並在啟動 SDK 或 proxy 前匯出：

```bash
export WALLY_API_KEY="your-wally-api-key"
```

使用 `wally/<model-name>` 指定主控台中列出的模型，例如 `wally/glm-5.3-flash`。LiteLLM 在將模型值傳送給 Wally 前會移除 `wally/` 前綴。

## LiteLLM Python SDK {#litellm-python-sdk}

```python
from litellm import completion

response = completion(
    model="wally/glm-5.3-flash",
    messages=[{"role": "user", "content": "Say hello in five words"}],
    max_tokens=2000,
)

print(response.choices[0].message.content)
```

若要使用串流，請傳入 `stream=True` 並逐一處理回應區塊：

```python
from litellm import completion

response = completion(
    model="wally/glm-5.3-flash",
    messages=[{"role": "user", "content": "Say hello in five words"}],
    max_tokens=2000,
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

Wally 的模型支援 reasoning，而 reasoning tokens 會計入 `max_tokens`。請為兩者預留足夠空間，否則回應可能在出現任何可見文字前就結束。每個模型接受的 `reasoning_effort` 等級各不相同，Wally 會對所選模型不接受的等級回傳 400 錯誤。

## LiteLLM Gateway {#litellm-gateway}

將此設定儲存為 `config.yaml`：

```yaml
model_list:
  - model_name: glm-5.3-flash
    litellm_params:
      model: wally/glm-5.3-flash
      api_key: os.environ/WALLY_API_KEY
```

在已於其環境中匯出 API 金鑰的狀態下啟動 proxy：

```bash
litellm --config config.yaml
```

使用設定的模型別名傳送請求：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.3-flash",
    "messages": [{"role": "user", "content": "Say hello in five words"}],
    "max_tokens": 2000
  }'
```

proxy 會回傳 OpenAI 格式的 chat completion。usage 區塊會分別報告 reasoning tokens：

```json
{
  "choices": [{"message": {"role": "assistant", "content": "Hi, nice to meet you!"}}],
  "usage": {
    "completion_tokens": 279,
    "prompt_tokens": 17,
    "total_tokens": 296,
    "completion_tokens_details": {"reasoning_tokens": 268}
  }
}
```

如果您的 proxy 需要驗證，也請傳送 `Authorization: Bearer <your-litellm-key>`。這是您的 LiteLLM 金鑰，而非您的 Wally API 金鑰。

LiteLLM 也透過其轉譯層接受 Wally 模型的 [Anthropic Messages](/docs/anthropic_unified) 與 [Responses API](/docs/response_api) 請求。這些請求使用 Wally 的 chat completions 端點，而非 Wally 原生的 Messages 或 Responses 端點。
