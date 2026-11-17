import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /completions {#completions}

## 總覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 適用於所有支援的模型 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 終端使用者追蹤 | ✅ | |
| 串流 | ✅ | |
| 備援 | ✅ | 適用於支援的模型之間 |
| 負載平衡 | ✅ | 適用於支援的模型之間 |
| 防護欄 | ✅ | 套用於輸入提示詞與輸出文字（僅限非串流） |
| 支援的提供者 | 所有 Chat Completion 提供者 | |

### 使用方式 {#usage}

LiteLLM 會將聊天模型的文字補全請求送到該模型的 chat completions 端點，並以文字補全格式回傳答案。若要直接呼叫 OpenAI 舊版的 `/v1/completions` 端點，請參閱 [OpenAI（文字補全）](./providers/text_completion_openai.md)。

<Tabs>
<TabItem value="python" label="LiteLLM Python SDK">

```python keep-model-ids
from litellm import text_completion

response = text_completion(
    model="gpt-5.4-mini",
    prompt="Say this is a test",
    max_tokens=7
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy Server">

1. 在 config.yaml 中定義模型

```yaml keep-model-ids
model_list:
  - model_name: gpt-5.4-mini
    litellm_params:
      model: openai/gpt-5.4-mini
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 litellm proxy server 

```
litellm --config config.yaml
```

<Tabs>
<TabItem value="python" label="OpenAI Python SDK">

```python keep-model-ids
from openai import OpenAI

# set base_url to your proxy server
# set api_key to send to proxy server
client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

response = client.completions.create(
    model="gpt-5.4-mini",
    prompt="Say this is a test",
    max_tokens=7
)

print(response)
```
</TabItem>

<TabItem value="curl" label="Curl Request">

```shell keep-model-ids
curl --location 'http://0.0.0.0:4000/completions' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --data '{
        "model": "gpt-5.4-mini",
        "prompt": "Say this is a test",
        "max_tokens": 7
    }'
```
</TabItem>
</Tabs>

</TabItem>
</Tabs>

## 輸入參數 {#input-params}

LiteLLM 接受並轉換跨所有支援提供者的 [OpenAI Text Completion 參數](https://platform.openai.com/docs/api-reference/completions)。

### 必填欄位 {#required-fields}

- `model`: *string* - 要使用的模型 ID
- `prompt`: *string or array* - 要為其產生 completions 的 prompt

### 選用欄位 {#optional-fields}

- `best_of`: *integer* - 在伺服器端產生 best_of completions，並回傳「最佳」的一個
- `echo`: *boolean* - 除了 completion 之外，也將 prompt 回顯。
- `frequency_penalty`: *number* - 介於 -2.0 與 2.0 之間的數值。正值會根據新 tokens 的既有出現頻率加以懲罰。
- `logit_bias`: *map* - 修改指定 tokens 出現在 completion 中的可能性
- `logprobs`: *integer* - 在 logprobs 中包含最可能 tokens 的對數機率。最大值為 5
- `max_tokens`: *integer* - 要產生的最大 tokens 數量。
- `n`: *integer* - 每個 prompt 要產生多少個 completions。
- `presence_penalty`: *number* - 介於 -2.0 與 2.0 之間的數值。正值會根據 tokens 是否已出現在目前文字中加以懲罰。
- `seed`: *integer* - 若指定，系統將嘗試產生具決定性的樣本
- `stop`: *string or array* - 最多 4 個序列，API 將在這些序列處停止產生 tokens
- `stream`: *boolean* - 是否回傳部分進度串流。預設為 false
- `suffix`: *string* - 插入文字完成後接續的後綴
- `temperature`: *number* - 要使用的取樣溫度，介於 0 與 2 之間。 
- `top_p`: *number* - 取樣溫度的替代方案，稱為 nucleus sampling。 
- `user`: *string* - 代表您的終端使用者的唯一識別碼

在 OpenAI 上，`best_of`、`echo`、`suffix` 以及整數型別的 `logprobs` 只能搭配 `text-completion-openai/` 前綴使用，該前綴會呼叫舊版的 `/v1/completions` 端點。使用 `openai/` 前綴的聊天模型對這些參數會回應 400。請參閱 [OpenAI（文字補全）](./providers/text_completion_openai.md)。

## 輸出格式 {#output-format}
以下是您可從 completion 呼叫預期得到的確切 JSON 輸出格式：

[**符合 OpenAI 的輸出格式**](https://platform.openai.com/docs/api-reference/completions/object)

<Tabs>

<TabItem value="non-streaming" label="非串流回應">

```python keep-model-ids
{
  "id": "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
  "object": "text_completion",
  "created": 1589478378,
  "model": "gpt-5.4-mini",
  "system_fingerprint": null,
  "choices": [
    {
      "text": "\n\nThis is indeed a test",
      "index": 0,
      "logprobs": null,
      "finish_reason": "length"
    }
  ],
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 7,
    "total_tokens": 12
  }
}

```
</TabItem>
<TabItem value="streaming" label="串流回應">

```python keep-model-ids
{
  "id": "cmpl-7iA7iJjj8V2zOkCGvWF2hAkDWBQZe",
  "object": "text_completion",
  "created": 1690759702,
  "choices": [
    {
      "text": "This",
      "index": 0,
      "logprobs": null,
      "finish_reason": null
    }
  ],
  "model": "gpt-5.4-mini",
  "system_fingerprint": null,
}

```

</TabItem>
</Tabs>

## **支援的提供者** {#supported-providers}

| 提供者    | 使用方式連結      |
|-------------|--------------------|
| OpenAI      |   [使用方式](../docs/providers/text_completion_openai)                 | 
| Azure OpenAI|   [使用方式](../docs/providers/azure)                 |
