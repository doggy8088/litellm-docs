---
title: "ScaleDown API 與 LiteLLM：分類、壓縮"
sidebar_label: "ScaleDown"
description: "透過 LiteLLM 使用 ScaleDown，依標籤評分標準分類文字、以 JSON schema 擷取欄位、摘要、回答 Decisions 問題並壓縮提示詞。"
---

# ScaleDown {#scaledown}

使用 [ScaleDown](https://scaledown.ai) 來分類文字、擷取欄位、摘要以文字提供的文件，或壓縮提示詞。LiteLLM 呼叫 ScaleDown 的原生 API，並透過 `/chat/completions` 回傳結果。

此整合支援文字輸入。圖片與檔案輸入會被拒絕，因為其計費不在下方的文字費率涵蓋範圍內。

## 設定您的 API 金鑰 {#set-your-api-key}

從 [ScaleDown 儀表板](https://scaledown.ai/dashboard) 取得金鑰，然後在您執行 LiteLLM 的 shell 中設定：

```bash
export SCALEDOWN_API_KEY="your-scaledown-api-key"
pip install litellm
```

LiteLLM 會將金鑰放在 `x-api-key` 標頭中傳送至 `https://api.scaledown.xyz`。您也可以將 `api_key` 傳入 `completion`。如需自訂主機，請設定 `SCALEDOWN_API_BASE`。每次呼叫的 `api_base` 需要明確的 `api_key`，讓配接器不會將環境金鑰傳送到無關的主機。Base URL 尾端加上 `/v1` 也可以接受。

## 支援的模型 {#supported-models}

| 模型 | 必要的輸入 | 原生端點 |
|-------|----------------|-----------------|
| `scaledown/classify` | 使用者文字與 `labels` | `/classify` |
| `scaledown/extract` | 使用者文字與非 strict 的 `response_format` schema | `/extract` |
| `scaledown/summarize` | 使用者文字 | `/summarization/abstractive` |
| `scaledown/decisions` | 使用者文字與 `questions` | `/v1/scaledown` |
| `scaledown/compress` | 使用者提示詞與先前的上下文訊息 | `/compress/raw/` |

每個模型都會在 `choices[0].message.content` 中回傳 JSON 字串。請使用 `json.loads` 解析。分類、摘要與壓縮會回傳其原生回應物件。擷取會回傳請求的欄位。Decisions 會回傳 `answers` 物件。Python SDK 也會將完整的上游 payload 保存在 `response._hidden_params["scaledown_response"]` 中。

## 分類 {#classification}

傳入一份標籤清單，每個標籤都有 `name` 與 `rubric`。配接器會將最後一則使用者訊息作為要分類的文字傳送。

```python
import json
from litellm import completion

response = completion(
    model="scaledown/classify",
    messages=[{"role": "user", "content": "My server has been down for three hours."}],
    labels=[
        {"name": "urgent", "rubric": "Service is unavailable."},
        {"name": "routine", "rubric": "A question or cosmetic issue."},
    ],
)

result = json.loads(response.choices[0].message.content)
print(result["top_label"])
print(result["scores"])
```

此範例的最高標籤預期為 `urgent`。如果您需要下方說明的獨立問題式 API，請使用 `scaledown/decisions`。

## 擷取 {#extraction}

使用 JSON schema 描述要擷取的欄位。屬性名稱會成為實體名稱，描述會成為擷取提示。支援巢狀物件、物件陣列與本機 `$ref` 定義。

可為 null 的欄位可以使用 `anyOf` 或 `oneOf`，搭配一個 schema 與一個 `null` 分支。請將每個欄位的 type、properties 與 items 放在非 null 分支或被參考的定義內。對於同層 schema 定義、`allOf`，以及具有多個非 null 分支的 union，LiteLLM 會回傳 HTTP 400。

```python
import json
from litellm import completion

response = completion(
    model="scaledown/extract",
    messages=[{"role": "user", "content": "Invoice from Northwind. Total: $500."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "invoice",
            "strict": False,
            "schema": {
                "type": "object",
                "properties": {
                    "vendor": {"type": "string", "description": "company name"},
                    "amount": {"type": "string", "description": "total invoice amount"},
                },
            },
        },
    },
)

fields = json.loads(response.choices[0].message.content)
print(fields)
```

內容包含 `vendor` 與 `amount` 等欄位。對於有多個符合項的純量欄位，LiteLLM 使用 ScaleDown 的第一個符合項，提供者依信心程度排序。沒有符合項的欄位可能不存在。配接器會移除提供者加入的 span 錨點與值包裝。完整的 payload 保留符合項、信心程度與 span。

**schema 描述要擷取的內容。它不保證 JSON Schema 驗證。** ScaleDown 可能為描述為字串的欄位回傳數字、省略必要欄位，或回傳 enum 之外的值。請在您的應用程式中驗證結果。LiteLLM 會在進行上游呼叫之前拒絕 `strict: true`，包括從 Pydantic 模型產生的 strict schema。

您可以將 `threshold` 與 `top_n` 作為額外參數傳入。將擷取指示放在屬性描述中。擷取不支援系統訊息。

## 摘要 {#summarization}

最後一則使用者訊息包含來源文字。系統訊息可提供摘要指示。使用 `max_tokens` 或 `max_completion_tokens` 限制摘要長度。

```python
import json
from litellm import completion

response = completion(
    model="scaledown/summarize",
    messages=[
        {"role": "system", "content": "Summarize in one sentence."},
        {
            "role": "user",
            "content": "The team shipped the billing fix on Monday. Error rates fell. A follow-up review is scheduled for Friday.",
        },
    ],
    max_tokens=64,
)

print(json.loads(response.choices[0].message.content)["summary"])
```

## 使用 LiteLLM Proxy {#use-the-litellm-proxy}

安裝 proxy 相依套件，並將以下內容儲存為 `config.yaml`：

```bash
pip install 'litellm[proxy]'
```

```yaml
model_list:
  - model_name: scaledown-classify
    litellm_params:
      model: scaledown/classify
      api_key: os.environ/SCALEDOWN_API_KEY
  - model_name: scaledown-extract
    litellm_params:
      model: scaledown/extract
      api_key: os.environ/SCALEDOWN_API_KEY
  - model_name: scaledown-summarize
    litellm_params:
      model: scaledown/summarize
      api_key: os.environ/SCALEDOWN_API_KEY
```

在您設定 `SCALEDOWN_API_KEY` 的 shell 中啟動 proxy：

```bash
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config config.yaml --host 127.0.0.1 --port 4000
```

在另一個終端機中，將 `LITELLM_API_KEY` 設定為上方產生的金鑰，並傳送分類請求：

```bash
curl http://127.0.0.1:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "scaledown-classify",
    "messages": [{"role": "user", "content": "My server has been down for three hours."}],
    "labels": [
      {"name": "urgent", "rubric": "Service is unavailable."},
      {"name": "routine", "rubric": "A question or cosmetic issue."}
    ]
  }'
```

預期回傳 HTTP 200，且 `choices[0].message.content` 中包含帶有 `top_label` 與 `scores` 的 JSON 字串。對於既有的 proxy，請使用有權使用此模型的 LiteLLM 金鑰。ScaleDown 金鑰應放在 proxy 上。

使用 OpenAI Python 用戶端時，請透過 `extra_body={"labels": [...]}` 傳入 `labels`。`questions`、`threshold`、`top_n` 與 `compression_rate` 亦同。文字應放在 `messages` 中；原生的 `text`、`state` 與文件覆寫會被拒絕。

## Decisions {#decisions}

`scaledown/decisions` 使用上游模型 `classify-1` 呼叫 ScaleDown 的 Decisions API。在最後一則使用者訊息中提供文字，並提供 `questions` 對應表。`choice` 問題從 criteria 對應表中選取一個 key。`noul` 問題回傳 yes/no 機率。`score` 問題使用由低到高排序的二到十個 criteria 清單。

```python
import json
from litellm import completion

response = completion(
    model="scaledown/decisions",
    messages=[{"role": "user", "content": "I was charged twice for my subscription this month."}],
    questions={
        "category": {
            "type": "choice",
            "criteria": {"billing": "A charge or refund.", "technical": "A bug."},
        }
    },
)

print(json.loads(response.choices[0].message.content)["category"]["choice"])
```

此範例預期為 `billing`。將問題指示放在 `questions` 內；分類與 Decisions 不支援系統訊息。Decisions 會回報請求中各問題的輸入用量。

## 壓縮 {#compression}

`scaledown/compress` 將先前的訊息作為 `context` 傳送，最後一則使用者訊息作為 `prompt`。將 `compression_rate` 傳入 `"auto"` 或零到一之間的數字。

```python
import json
from litellm import completion

response = completion(
    model="scaledown/compress",
    messages=[
        {"role": "system", "content": "The team shipped a billing fix. Error rates fell after the release."},
        {"role": "user", "content": "What changed after the release?"},
    ],
    compression_rate="auto",
)

print(json.loads(response.choices[0].message.content)["results"]["compressed_prompt"])
```

## 成本與支援的功能 {#cost-and-supported-features}

註冊的文字費率為**每百萬輸入 token $0.05**，輸出不收費。LiteLLM 依回報的輸入用量與其模型價格對應表計算成本。Decisions API 的 `usage.cost` 不會用作計費覆寫。以此費率計算，具有 232 個輸入 token 的請求成本為 $0.0000116。

分類、擷取、摘要與壓縮會回報輸入 token 數，但不回報輸出 token 數。LiteLLM 對這些操作回傳 `completion_tokens: 0`，因為輸出用量未被測量。Decisions 會回報輸出 token，LiteLLM 會保留這些數據。

| 功能 | 支援 |
|---------|---------|
| 同步與非同步呼叫 | 是 |
| 成本追蹤與記錄 | 是 |
| 文字內容陣列 | 是 |
| 串流 | 在上游回應完成後模擬 |
| 圖片與檔案 | 否 |
| Strict JSON schema | 否 |
| 函式呼叫 | 否 |

如需串流用量，請傳送 `stream_options={"include_usage": True}`。配接器會拒絕不支援的取樣參數，例如 `temperature`；如果您的呼叫端需要 LiteLLM 捨棄這些參數，請使用 `drop_params=True`。缺少標籤、問題或擷取欄位定義時，配接器在聯絡 ScaleDown 之前就會回傳請求錯誤。
