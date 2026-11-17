---
title: "透過 LiteLLM AI Gateway 使用 Refuseless API"
sidebar_label: "Refuseless"
description: "透過 LiteLLM 使用 Refuseless 的 abliterated GLM 與 DeepSeek 模型，支援 reasoning effort、工具、結構化輸出、提示快取與 Responses API。"
---

# Refuseless {#refuseless}

透過 LiteLLM 以 `refuseless/` 模型前綴使用 [Refuseless](https://refuseless.com)。LiteLLM 會讀取 `REFUSELESS_API_KEY`，並將請求送往 `https://api.refuseless.com/v1`。

## 開始使用 {#get-started}

在您的 [Refuseless 帳戶](https://refuseless.com)中建立 API 金鑰，並在您的環境或 secret manager 中設定 `REFUSELESS_API_KEY`。Python SDK 請安裝 `litellm`，gateway 則安裝 `litellm[proxy]`。

```bash
export REFUSELESS_API_KEY="YOUR_REFUSELESS_API_KEY"
pip install litellm
```

```python
from litellm import completion

response = completion(
    model="refuseless/glm-5.3-abliterated",
    messages=[{"role": "user", "content": "Reply with hello."}],
    reasoning_effort="low",
)
print(response.choices[0].message.content)
```

成功的請求會回傳 assistant 回覆與 token 用量。您不需要設定 `api_base`。

## 模型與定價 {#models-and-pricing}

以下價格為每百萬 token 的美元價格，於 2026 年 10 月 26 日對照[已公布的定價](https://refuseless.com/pricing)與線上模型型錄查核。Context 為輸入與輸出的合計預算，因此只有當 prompt 能放入剩餘 context 時，才能使用完整的輸出上限。在 LiteLLM 中，每個模型 ID 都要加上 `refuseless/` 前綴。

| 模型 ID | Context | 最大輸出 | 輸入 | 快取輸入 | 輸出 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `glm-5.3-abliterated` | 1,048,576 | 131,072 | $1.25 | $0.25 | $2.25 |
| `glm-5.3-flash-abliterated` | 1,048,576 | 131,072 | $0.25 | $0.15 | $0.8 |
| `deepseek-v4.1-flash-abliterated` | 1,048,576 | 130,000 | $0.22 | $0.045 | $0.75 |
| `deepseek-v4.1-flash-fast` | 1,048,576 | 262,144 | $0.05 | $0.003 | $0.15 |
| `minimax-m3.1-flash` | 1,048,576 | 512,000 | $0.05 | $0.002 | $0.25 |

前三個模型使用 abliterated 權重。其餘兩個使用未修改的權重。

Refuseless 也列出了 `deepseek-v4.1-flash-free`，但在查核時，線上推論回傳 `404 model_not_found`。在推論可用之前，LiteLLM 將其排除於模型型錄與上方的支援模型表之外。請改選五個已驗證模型之一。

## Gateway 設定 {#gateway-setup}

以 `pip install 'litellm[proxy]'` 安裝 proxy。在 gateway 程序上設定 `REFUSELESS_API_KEY`，並為 gateway 用戶端將 `LITELLM_MASTER_KEY` 設為強金鑰。提供者金鑰用於驗證上游請求。gateway 金鑰用於向 LiteLLM 驗證您的用戶端。

將此部署加入您現有的設定，或將其存為新 gateway 的 `config.yaml`。

```yaml
model_list:
  - model_name: refuseless-chat
    litellm_params:
      model: refuseless/glm-5.3-abliterated
      api_key: os.environ/REFUSELESS_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

```bash
litellm --config config.yaml --port 4000
```

在已設定 `LITELLM_MASTER_KEY` 的第二個終端機中，送出請求。

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "refuseless-chat",
    "messages": [{"role": "user", "content": "Reply with hello."}],
    "reasoning_effort": "low"
  }'
```

預期會得到 HTTP 200，`choices[0].message.content` 中有 assistant 訊息，`usage` 中有計數。

## 串流與提示快取 {#streaming-and-prompt-caching}

設定 `stream=True`，並在最後一個 chunk 中請求用量。

```python
from litellm import completion

stream = completion(
    model="refuseless/glm-5.3-abliterated",
    messages=[{"role": "user", "content": "Reply with hello."}],
    reasoning_effort="low",
    stream=True,
    stream_options={"include_usage": True},
)
for chunk in stream:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="")
    if getattr(chunk, "usage", None):
        print(chunk.usage)
```

LiteLLM 使用 `usage.prompt_tokens_details.cached_tokens`，以快取輸入費率對重複使用的輸入計費。未快取的輸入則使用標準輸入費率。重複的 prompt 不保證一定命中快取。

## 工具、結構化輸出與推理 {#tools-structured-output-and-reasoning}

Chat Completions 支援 `tools`、`tool_choice` 與 `response_format`。工具結果的後續呼叫請參閱 [LiteLLM 函式呼叫](../completion/function_call.md)，JSON Schema 範例請參閱[結構化輸出](../completion/json_mode.md)。

使用 `reasoning_effort="low"`、`"high"` 或 `"max"`。線上型錄會公布每個模型支援的 effort 等級，預設為 `low`。Refuseless 也為其付費 DeepSeek 變體提供 `off`。請勿假設提供者會接受 OpenAI 的 effort 名稱，例如 `medium` 與 `xhigh`。LiteLLM 使用宣告的 effort 等級來處理受支援的請求。推理文字在回傳時可透過 `message.reasoning_content` 取得。請參閱 [Refuseless reasoning](https://docs.refuseless.com/guides/reasoning)。

## Responses API {#responses-api}

LiteLLM 將 `responses()` 路由至提供者原生的 `/v1/responses` 端點。對話歷史請放在 `input` 中傳送。這些 API 是無狀態的，因此請勿依賴 `previous_response_id` 來保存歷史。

```python
from litellm import responses

response = responses(
    model="refuseless/glm-5.3-abliterated",
    input="Reply with hello.",
    reasoning={"effort": "low"},
    store=False,
)
print(response.output)
```

Gateway 用戶端可使用設定好的部署名稱，將相同的請求送往 `/v1/responses`。

## 疑難排解 {#troubleshooting}

遇到 `401` 時，請檢查 gateway 程序環境中的金鑰。遇到 `402` 時，請檢查提供者的點數。遇到 `404` 時，請將未加前綴的模型 ID 與 `GET https://api.refuseless.com/v1/models` 比對。遇到 `429` 時，請遵循提供者的重試指引。模型型錄可正常運作，並不保證每個列出的模型目前都可用於推論。
