# /v1/extraction {#v1extraction}

擷取模型讀取一段文字（可選擇加上圖片），並填入您指定的型別欄位：一段文字、一個日期、一個帶單位的數字、一個清單，或帶百分位數的估計值。答案附有信心分數或百分位數，當輸入無法決定答案時，答案的 `value` 為 null。LiteLLM 在 `POST /v1/extraction` 上提供它們，並以 `/extraction` 作為別名。

<SinceVersion v="1.108.0" />

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | 是 | 在 `x-litellm-response-cost` 標頭中回傳，並寫入支出記錄 |
| 記錄 | 是 | 代理以呼叫類型 `aextraction` 記錄此呼叫 |
| 虛擬金鑰 | 是 | 一般的代理金鑰驗證、模型存取、金鑰支出，以及 RPM 與 TPM 限制。TPM 限制計算每次呼叫的輸入權杖 |
| 負載平衡、備援 | 是 | 像 `/v1/decisions` 一樣經過路由器 |
| 防護欄 | 是 | 統一的 `apply_guardrail` 防護欄，請參閱[防護欄](#guardrails) |
| 圖片輸入 | 是 | 最多 4 張圖片，請參閱[圖片](#images) |
| 串流 | 否 | `stream: true` 會回應 400，或在 `drop_params` 下被丟棄 |

## 支援的提供者 {#supported-providers}

| 提供者 | 模型 | 憑證 | 圖片 |
|----------|-------|-------------|--------|
| [Cloudflare Clairic](https://developers.cloudflare.com/workers-ai/models/clairic/) | `cloudflare/@cf/cloudflare/clairic` 或 `cloudflare/clairic` | `CLOUDFLARE_API_KEY` 與 `CLOUDFLARE_ACCOUNT_ID`，或 `api_base` | 是 |

兩個模型名稱都呼叫 Cloudflare 上的 `@cf/cloudflare/clairic` 執行 URL。金鑰來自 `api_key` 或 `CLOUDFLARE_API_KEY`。API 基礎位址依序來自 `api_base`、`CLOUDFLARE_API_BASE`，然後是 `https://api.cloudflare.com/client/v4/accounts/<CLOUDFLARE_ACCOUNT_ID>/ai/run`。`api_base` 可以是帳號 URL `https://api.cloudflare.com/client/v4/accounts/<account_id>`，結尾帶或不帶 `/ai/run` 或 `/ai/v1`。沒有金鑰，或沒有帳號 ID 也沒有 `api_base` 時，LiteLLM 會在呼叫 Cloudflare 之前回應 400。

## 代理設定 {#proxy-setup}

1. 將 Clairic 加入 `config.yaml`。

```yaml showLineNumbers
model_list:
  - model_name: clairic
    litellm_params:
      model: cloudflare/@cf/cloudflare/clairic
      api_key: os.environ/CLOUDFLARE_API_KEY
```

在代理環境中設定 `CLOUDFLARE_ACCOUNT_ID`，或將 `api_base` 加入 `litellm_params`。`model: cloudflare/clairic` 是簡短形式，呼叫同一個模型。

2. 啟動代理。

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

## 請求 {#request}

從一張發票中拉出五個型別欄位。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/extraction' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "clairic",
  "state": "Invoice #4471 from Example Hardware Co., dated March 3 2026. 12 hammers at $14.50 each, total $174.00. Payment due in 30 days.",
  "fields": {
    "vendor": {"type": "text", "instructions": "Who sent the invoice?"},
    "invoice_date": {"type": "date"},
    "total": {"type": "number", "decimals": 2, "unit": "USD"},
    "items": {"type": "list", "items": "text", "instructions": "What was bought?"},
    "days_to_pay": {"type": "estimate", "min": 0, "max": 90, "step": 1}
  }
}'
```

回應，帶有 `x-litellm-response-cost: 4.34e-05`

```json
{
  "model": "clairic",
  "answers": {
    "vendor": {
      "type": "text",
      "value": "Example Hardware Co.",
      "guess": "Example Hardware Co.",
      "p_null": 0.0023696497082710266,
      "confidence": 0.9999986886978149,
      "span": [19, 39]
    },
    "invoice_date": {
      "type": "date",
      "value": "2026-03-03",
      "guess": "2026-03-03",
      "p_null": 5.612911877506122e-7,
      "confidence": 0.999993443524893
    },
    "total": {
      "type": "number",
      "value": 174,
      "guess": 174,
      "p_null": 1.6802375739644049e-6,
      "confidence": 0.9999543443624127
    },
    "items": {
      "type": "list",
      "value": ["12", "hammers"],
      "confidence": 0.35724303594103385,
      "spans": [[61, 63], [64, 71]]
    },
    "days_to_pay": {
      "type": "estimate",
      "value": 31,
      "mean": 30.776606032245052,
      "median": 30,
      "p10": 30,
      "p90": 34,
      "p_below": 1.2175848951301305e-6,
      "p_above": 1.0790414535222226e-6
    }
  },
  "truncated": false,
  "usage": {
    "input_tokens": 434,
    "output_tokens": 0,
    "state_tokens": 52,
    "image_tokens": 0,
    "schema_tokens": 330,
    "passes": 2
  }
}
```

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `model` | string | 代理模型名稱，或在 SDK 中為 `<provider>/<model>` |
| `state` | string | 要讀取的文字。文字答案是它的一段範圍。只有在傳送圖片時才能為空 |
| `fields` | object | 至少一個具名欄位。每個鍵會成為 `answers` 中的一個鍵 |
| `images` | array, optional | 最多 4 張圖片，請參閱[圖片](#images) |
| `reference_date` | string, optional | 一個 ISO 日期，用來錨定未寫年份的日期 |
| `options` | object, optional | `include_quantiles: true` 為估計值加上 99 個百分位數。`return_state_text: true` 回傳 spans 索引所指的文字 |

欄位名稱為 1 至 64 個字母、數字、`_`、`.` 或 `-`，並以字母或 `_` 開頭。每個欄位都有一個 `type`，並可選擇加上 `instructions` 說明它應包含什麼，而 `null_threshold` 設定 null 的機率閾值，超過時 `value` 為 null。

| `type` | 設定 | 答案欄位 |
|--------|----------|---------------|
| `text` | `unit` | `value`、`guess`、`p_null`、`confidence`、`span` |
| `date` | 無 | `value` 與 `guess` 為 ISO 日期、`p_null`、`confidence` |
| `number` | `decimals` 從 0 到 6、`unit`、`integer` | `value`、`guess`、`p_null`、`confidence` |
| `list` | `items` 設為 `text`、`number` 或 `date`，必填 | `value` 為清單、`confidence`，以及文字項目的 `spans` 或日期項目的 `confidences` |
| `estimate` | `min` 與 `max`，必填，另可選擇 `step` 與 `scale`（`linear` 或 `log`） | `value`、`mean`、`median`、`p10`、`p90`、`p_below`、`p_above`，以及加上 `include_quantiles` 時的 `quantiles` |

日期的估計值以 ISO 日期作為 `min` 與 `max`，其 `step` 是天數、`"month"` 或 `"year"`。

`span` 是答案在 `state` 中的起始與結束字元偏移，`spans` 為每個文字清單項目保存一個。當 `p_null` 高於 `null_threshold`（預設為 0.5）時，`value` 為 null，而 `guess` 仍保存模型的答案。LiteLLM 也接受 `time`、`datetime`、`duration` 與 `forecast` 類型，並原封不動地傳送給 Cloudflare。它們的設定與答案欄位（例如 forecast 答案帶有的 `steps`）請參閱 [Clairic 參考文件](https://developers.cloudflare.com/workers-ai/models/clairic/)。

## 回應 {#response}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `model` | string | 您呼叫的模型名稱。備援之後，以及透過 SDK 的 `Router` 的每次呼叫，它是回應的部署的模型字串，例如 `cloudflare/@cf/cloudflare/clairic` |
| `answers` | object | 每個欄位一個答案，以欄位名稱為鍵，帶有上述答案欄位 |
| `truncated` | boolean | Clairic 的截斷旗標 |
| `state_text` | string, optional | spans 索引所指的文字，隨 `return_state_text` 回傳 |
| `usage` | object | `input_tokens` 與 `output_tokens`，加上 Clairic 的 `state_tokens`、`image_tokens`、`schema_tokens` 與 `passes` |

## 圖片 {#images}

`images` 接受最多 4 張圖片，每張是一個 data URL 或一個 `{"content_type": "image/png", "base64": "<BASE64_PNG>"}` 物件。Clairic 不接受遠端 URL，因此對於不是 data URL 的圖片 URL，LiteLLM 回應 400。Clairic 讀取 PNG、JPEG 與 WebP 圖片，每張最多 4 MiB，總共最多 8 MiB，且 Cloudflare 會自行檢查這些限制。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/extraction' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "clairic",
  "state": "See the attached receipt photo.",
  "images": ["data:image/png;base64,<BASE64_PNG>"],
  "fields": {
    "merchant": {"type": "text"},
    "total_due": {"type": "number", "unit": "USD"}
  }
}'
```

從圖片讀出的答案會將 `source` 設為 `"image"` 且沒有 `span`，從圖片讀出的文字答案還會有 `spell_confidence`。`usage.image_tokens` 計算圖片權杖。

## 錯誤 {#errors}

LiteLLM 在呼叫 Cloudflare 之前，會檢查它所知道的請求主體部分。

| 請求 | 狀態 | 來源 |
|---------|--------|------|
| 未知的欄位 `type` | 400 | LiteLLM |
| 違反命名規則的欄位名稱 | 400 | LiteLLM |
| 沒有 `items` 的 `list` 欄位 | 400 | LiteLLM |
| 沒有 `fields`，或 `fields` 為空 | 400 | LiteLLM |
| JSON 類型錯誤或值未知的欄位設定，例如 `"decimals": "2"` 或 `"scale": "cubic"` | 400 | LiteLLM |
| 遠端圖片 URL | 400 | LiteLLM |
| 超過 4 張圖片 | 400 | LiteLLM |
| Clairic 未定義的頂層鍵，例如 `stream`、`user` 或 `temperature`，除非被丟棄 | 400 | LiteLLM |
| 缺少金鑰或帳號 ID | 400 | LiteLLM |
| Clairic 未定義的欄位設定，例如 `"foo": 1` | Cloudflare 的狀態 | Cloudflare |
| 沒有 `min` 或 `max` 的估計值 | Cloudflare 的狀態 | Cloudflare |
| `min` 高於 `max` 的估計值 | Cloudflare 的狀態 | Cloudflare |
| `state` 為空且沒有圖片 | Cloudflare 的狀態 | Cloudflare |

一個名為 `line_items` 且沒有 `items` 設定的 `list` 欄位會得到

```json
{
  "error": {
    "message": "litellm.BadRequestError: Invalid Extraction request: 1 validation error for ExtractionRequestBody\nfields.line_items\n  Value error, list fields need items set to text, number or date [type=value_error, input_value={'type': 'list'}, input_type=dict]\n    For further information visit https://errors.pydantic.dev/2.13/v/value_error",
    "type": "invalid_request_error",
    "param": null,
    "code": "400"
  }
}
```

LiteLLM 只將上述請求欄位傳送給 Cloudflare，並將 `model` 設為 `clairic`。它會讀取自己的參數，例如 `metadata`、`guardrails` 與 `drop_params`，且不傳送它們。`fields` 與 `options` 內的設定會照您傳送的樣子送到 Cloudflare，因此只有 Cloudflare 知道的規則會帶著 Cloudflare 的狀態與訊息回來。一個 `min` 為 90、`max` 為 0 的估計值會得到

```json
{
  "error": {
    "message": "litellm.BadRequestError: CloudflareException - {\"errors\":[{\"message\":\"AiError: AiError: estimate days_to_pay needs finite min < max, got 90 and 0 (dda314d7-9961-487a-b138-0049bc36deae)\",\"code\":3030}],\"success\":false,\"result\":{},\"messages\":[]}\n\nLiteLLM: model group 'clairic' failed with the error above. No fallback was attempted.",
    "type": "invalid_request_error",
    "param": null,
    "code": "422"
  }
}
```

Clairic 不串流，也不接受 OpenAI 生成參數，因此 `stream: true`、`user`、例如 `temperature`、`seed` 或 `response_format` 的參數，或任何不在上述請求欄位中的其他頂層鍵，都會回應 400 並列出 LiteLLM 拒絕的名稱。若要改為丟棄它們，請在請求中、在部署上或在 `litellm_settings` 中設定 `drop_params: true`，或在請求中或部署上將名稱列入 `additional_drop_params`。該呼叫接著會像其他呼叫一樣被記錄與計費。代理的 `--temperature` 與 `--max_tokens` 旗標不適用於擷取呼叫。

## 防護欄 {#guardrails}

透過 LiteLLM 統一的 `apply_guardrail` 介面執行的[防護欄](./proxy/guardrails/quick_start.md)可在 `/v1/extraction` 上運作，設定方式與在 `/chat/completions` 上相同。這些包括 Presidio、`pre_call` 或 `post_call` 模式的 Bedrock Guardrails、`litellm_content_filter`、設定為 `guardrail: openai_moderation` 的 OpenAI Moderation、Generic Guardrail API，以及定義 `apply_guardrail` 的自訂程式碼防護欄。在進入時，它們會看到 `state`、每個欄位的 `instructions` 與 `unit`，以及任何 `images`（它們以 data URL 形式取得）。在離開時，它們會看到每個答案的 `value` 與 `guess`、估計值的 `mean`、`median`、`p10`、`p90` 與 `quantiles`，以及 forecast 的每個 `steps` 中的相同鍵（當它們保存文字、數字或其清單時），再加上 `state_text`。它們看到的 `mean`、`median`、`p10`、`p90` 與每個 `quantiles` 都四捨五入為整數，因此 `mean` 30.78 會被看作 `31`，而數字答案例如 14.5 則被看作 `14.5`。文字答案會帶著防護欄的文字回來，例如被遮蔽的電子郵件地址。防護欄變更的任何其他答案，例如日期、數字、估計值，或日期或數字的清單，會以 `value` 為 null 回來，且不帶其 `guess`、`mean`、`median`、`p10`、`p90`、`quantiles` 或 `steps`，因為被遮蔽的文字不再符合其類型。當防護欄在進入時變更 `state`，Clairic 讀取的是變更後的文字，因此每個答案都沒有 `span` 與 `spans` 回來，那些偏移與您傳送的 `state` 不符。設定 `return_state_text: true` 以保留它們，此時 `state_text` 保存它們索引所指的文字。當防護欄在離開時變更 `state_text`，每個答案都沒有 `span` 與 `spans` 回來，因為偏移不再與文字相符。

不是建立在 `apply_guardrail` 上，或執行自己掛鉤的防護欄，不會掃描擷取請求。這些包括 Lakera、Aporia、Aim、Lasso、Pangea、Pillar、Cato Networks、Cisco AI Defense、Microsoft Purview DLP、Guardrails AI、DynamoAI、IBM Guardrails、Javelin、RepelloAI Argus、`semantic_guard`、Model Armor、Azure Prompt Shield、Azure Text Moderation、LLM Shield Proxy 與機密偵測防護欄 `hide-secrets`，再加上較舊的 `openai_moderations`、`banned_keywords`、`google_text_moderation` 與 Azure Content Safety 回呼。LiteLLM 會在沒有它們的情況下將請求傳送給 Cloudflare，且不回傳錯誤，而對其中部分（例如 `hide-secrets`）來說，`x-litellm-applied-guardrails` 標頭仍會列出該防護欄。`during_call` 模式的 Bedrock Guardrails 以相同方式跳過擷取請求。`logging_only` 模式的 Presidio 不會在您的記錄中遮蔽擷取請求或答案。當它在擷取呼叫上執行時（因為請求指定了它，或它是 `default_on`），它會遮蔽呼叫者取得的答案中的 PII，而 Cloudflare 仍讀取原始文字。在依賴防護欄讓 PII 或機密遠離 Cloudflare 之前，請對此路由傳送一個它應該封鎖的請求，並檢查該呼叫是否失敗。

## 定價 {#pricing}

Clairic 的價格是每 1M 輸入權杖 $0.10，輸出不收費。LiteLLM 以 `usage.input_tokens` 計費，因此上述發票請求讀取了 434 個輸入權杖，花費 $0.0000434。支出記錄將 `prompt_tokens` 記錄為輸入權杖，將 `completion_tokens` 記錄為 `output_tokens`，Clairic 回報為 0。

## SDK 用法 {#sdk-usage}

```python showLineNumbers
import os
import litellm

os.environ["CLOUDFLARE_API_KEY"] = ""
os.environ["CLOUDFLARE_ACCOUNT_ID"] = ""

response = litellm.extraction(
    model="cloudflare/@cf/cloudflare/clairic",
    state="Invoice #4471 from Example Hardware Co., dated March 3 2026. Total $174.00. Payment due in 30 days.",
    fields={"vendor": {"type": "text"}, "total": {"type": "number", "unit": "USD"}},
)
print("vendor:", response.answers["vendor"].value)
print("total:", response.answers["total"].value)
print("input_tokens:", response.usage.input_tokens)
print("response_cost:", response._hidden_params["response_cost"])
```

輸出

```
vendor: Example Hardware Co.
total: 174
input_tokens: 300
response_cost: 2.9999999999999997e-05
```

非同步版本是 `litellm.aextraction`，接受相同的引數。

```python showLineNumbers
import asyncio
import os
import litellm

os.environ["CLOUDFLARE_API_KEY"] = ""
os.environ["CLOUDFLARE_ACCOUNT_ID"] = ""

async def main():
    response = await litellm.aextraction(
        model="cloudflare/clairic",
        state="Invoice #4471 from Example Hardware Co., dated March 3 2026. Total $174.00. Payment due in 30 days.",
        fields={"vendor": {"type": "text"}, "total": {"type": "number", "unit": "USD"}},
    )
    print(response.answers["vendor"].value)

asyncio.run(main())
```

兩個函式都接受 `model`、`fields`、`state`、`images`、`reference_date`、`options`、`api_key`、`api_base`、`timeout`、`custom_llm_provider` 與 `extra_headers`，再加上 LiteLLM 自己的參數，例如 `metadata`。任何其他關鍵字引數（包含 `user` 與例如 `temperature` 的 OpenAI 聊天參數）都會引發 `litellm.UnsupportedParamsError`，除非您傳入 `drop_params=True` 或將其列入 `additional_drop_params`。`base_url`、`default_headers` 與 `deployment_id` 不會改變呼叫，因此請以 `api_base` 設定端點。提供者不支援擷取的模型會引發 `BadRequestError`，其中列出受支援的提供者。透過 Router 時，請使用 `router.extraction` 與 `router.aextraction`。
