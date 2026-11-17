---
title: "透過 LiteLLM AI Gateway 使用 Abliteration API"
sidebar_label: "Abliteration"
description: "透過 Python SDK 或 AI Gateway 執行 Abliteration 的 abliterated 模型，支援串流、提示快取、tools、reasoning_effort 與 Responses API。"
---

# Abliteration {#abliteration}

透過 LiteLLM 使用 [Abliteration](https://abliteration.ai)，並使用 `abliteration/` 模型前綴。LiteLLM 會讀取 `ABLITERATION_API_KEY`，並將請求傳送至 `https://api.abliteration.ai/v1`。

## 開始使用 {#get-started}

在您的 [Abliteration 帳戶](https://abliteration.ai)中建立 API 金鑰，並在您的環境或 secret manager 中設定 `ABLITERATION_API_KEY`。Python SDK 請安裝 `litellm`，gateway 則安裝 `litellm[proxy]`。

```bash
export ABLITERATION_API_KEY="YOUR_ABLITERATION_API_KEY"
pip install litellm
```

```python
from litellm import completion

response = completion(
    model="abliteration/abliterated-model-large-v2",
    messages=[{"role": "user", "content": "Reply with hello."}],
    reasoning_effort="low",
)
print(response.choices[0].message.content)
```

成功的請求會回傳 assistant 回覆與 token 用量。您不需要設定 `api_base`。

## 模型與定價 {#models-and-pricing}

以下價格為每百萬 token 的美元價格，於 2026 年 10 月 26 日對照[已公布的定價](https://abliteration.ai/pricing)與即時模型目錄查核。Context 為輸入與輸出的合計預算，因此只有在提示能放入剩餘 context 時，才能使用完整的輸出上限。在 LiteLLM 中，請為每個模型 ID 加上 `abliteration/` 前綴。

| 模型 ID | Context | 最大輸出 | 輸入 | 快取輸入 | 輸出 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `abliterated-model` | 262,144 | 262,134 | $1 | $0.1 | $3 |
| `abliterated-model-large` | 1,000,000 | 999,990 | $3 | $0.3 | $5 |
| `abliterated-model-large-v2` | 1,000,000 | 999,990 | $3 | $0.3 | $5 |
| `abliterated-model-large-flash` | 1,048,576 | 262,144 | $1 | $0.1 | $2 |

`abliterated-model-large` 已棄用，但仍可供現有整合使用。新的文字工作負載請使用 `abliterated-model-large-v2`。`abliterated-model` 與 `abliterated-model-large-flash` 接受圖片，其餘兩個模型僅接受文字。

## Gateway 設定 {#gateway-setup}

使用 `pip install 'litellm[proxy]'` 安裝 proxy。在 gateway 程序上設定 `ABLITERATION_API_KEY`，並為 gateway 用戶端將 `LITELLM_MASTER_KEY` 設定為一組強金鑰。提供者金鑰用於驗證上游請求，gateway 金鑰則用於驗證您的用戶端對 LiteLLM 的存取。

將此部署加入您現有的設定，或將其儲存為 `config.yaml` 以建立新的 gateway。

```yaml
model_list:
  - model_name: abliteration-chat
    litellm_params:
      model: abliteration/abliterated-model-large-v2
      api_key: os.environ/ABLITERATION_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

```bash
litellm --config config.yaml --port 4000
```

在已設定 `LITELLM_MASTER_KEY` 的第二個終端機中傳送請求。

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "abliteration-chat",
    "messages": [{"role": "user", "content": "Reply with hello."}],
    "reasoning_effort": "low"
  }'
```

預期會收到 HTTP 200，`choices[0].message.content` 中有 assistant 訊息，`usage` 中有計數。

## 串流與提示快取 {#streaming-and-prompt-caching}

設定 `stream=True`，並要求在最後一個 chunk 中提供用量。

```python
from litellm import completion

stream = completion(
    model="abliteration/abliterated-model-large-v2",
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

LiteLLM 使用 `usage.prompt_tokens_details.cached_tokens`，以快取輸入費率計算重複使用的輸入。未快取的輸入則使用標準輸入費率。重複的提示不保證一定命中快取。

Abliteration 會自動快取提示前綴。快取建立使用標準輸入費率。請將穩定的指示與工具定義放在提示的開頭。為每個對話傳入穩定的 `prompt_cache_key` 以提升重複使用率。快取保留不保證，且不支援 `prompt_cache_retention`。請參閱 [Abliteration 提示快取](https://docs.abliteration.ai/capabilities/prompt-caching)。

## 工具、結構化輸出與推理 {#tools-structured-output-and-reasoning}

Chat Completions 支援 `tools`、`tool_choice` 與 `response_format`。工具結果的後續處理請使用 [LiteLLM 函式呼叫](../completion/function_call.md)，JSON Schema 範例請參閱[結構化輸出](../completion/json_mode.md)。

使用 `reasoning_effort="low"`、`"high"` 或 `"max"` 選擇推理深度。`none` 會在所有模型上停用推理，Large v2 除外，在 Large v2 上它會選擇低推理並隱藏追蹤內容。LiteLLM 將 `none` 從 Large v2 對外公布的推理選項中排除，因為此模型無法關閉推理。推理文字在回傳時可透過 `message.reasoning_content` 取得。在原生 Responses 上，`abliterated-model` 接受最高至 `xhigh` 的 effort，但會拒絕 `max`。請參閱 [Abliteration 推理](https://docs.abliteration.ai/capabilities/thinking)。

## Responses API {#responses-api}

LiteLLM 會為此提供者將 `responses()` 請求轉換為 Chat Completions。以下範例使用與 `completion()` 相同的模型與 token 費率。Abliteration 也有公布原生 Responses API，但此整合維持 LiteLLM 既有的轉換路徑。

```python
from litellm import responses

response = responses(
    model="abliteration/abliterated-model-large-v2",
    input="Reply with hello.",
    reasoning={"effort": "low"},
    store=False,
)
print(response.output)
```

Gateway 用戶端可使用設定好的部署名稱，將相同請求傳送至 `/v1/responses`。

## Anthropic Messages API {#anthropic-messages-api}

LiteLLM 會為此提供者將 Anthropic Messages 請求轉換為 Chat Completions。您可搭配 Anthropic 用戶端使用相同的 gateway 部署，或直接呼叫 LiteLLM。Anthropic Messages 需要 `max_tokens`。此範例使用提供者公布的 Large v2 輸出上限。

```python
import asyncio
import litellm

async def main():
    response = await litellm.anthropic.messages.acreate(
        model="abliteration/abliterated-model-large-v2",
        messages=[{"role": "user", "content": "Reply with hello."}],
        max_tokens=999990,
        output_config={"effort": "low"},
    )
    print(response["content"])

asyncio.run(main())
```

網頁搜尋是提供者的另一項收費，每 1,000 次搜尋 8 美元，另加 token 用量。上述模型 token 費率不包含該費用或帳戶專屬的訂閱折扣。請參閱 [Abliteration 定價](https://docs.abliteration.ai/pricing)。

## 疑難排解 {#troubleshooting}

遇到 `401` 時，請檢查 gateway 程序環境中的金鑰。遇到 `402` 時，請檢查提供者額度。遇到 `404` 時，請將未加前綴的模型 ID 與 `GET https://api.abliteration.ai/v1/models` 比對。遇到 `429` 時，請遵循提供者的重試指引。模型目錄可運作，不保證其中列出的每個模型目前都能用於推論。
