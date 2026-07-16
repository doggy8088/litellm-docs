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
<Tabs>
<TabItem value="python" label="LiteLLM Python SDK">

```python
from litellm import text_completion

response = text_completion(
    model="gpt-3.5-turbo-instruct",
    prompt="Say this is a test",
    max_tokens=7
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy Server">

1. 在 config.yaml 中定義模型

```yaml
model_list:
  - model_name: gpt-3.5-turbo-instruct
    litellm_params:
      model: text-completion-openai/gpt-3.5-turbo-instruct # The `text-completion-openai/` prefix will call openai.completions.create
      api_key: os.environ/OPENAI_API_KEY
  - model_name: text-davinci-003
    litellm_params:
      model: text-completion-openai/text-davinci-003
      api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 litellm proxy server 

```
litellm --config config.yaml
```

<Tabs>
<TabItem value="python" label="OpenAI Python SDK">

```python
from openai import OpenAI

# set base_url to your proxy server
# set api_key to send to proxy server
client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

response = client.completions.create(
    model="gpt-3.5-turbo-instruct",
    prompt="Say this is a test",
    max_tokens=7
)

print(response)
```
</TabItem>

<TabItem value="curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data '{
        "model": "gpt-3.5-turbo-instruct",
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

## 輸出格式 {#output-format}
以下是您可從 completion 呼叫預期得到的確切 JSON 輸出格式：

[**符合 OpenAI 的輸出格式**](https://platform.openai.com/docs/api-reference/completions/object)

<Tabs>

<TabItem value="non-streaming" label="非串流回應">

```python
{
  "id": "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
  "object": "text_completion",
  "created": 1589478378,
  "model": "gpt-3.5-turbo-instruct",
  "system_fingerprint": "fp_44709d6fcb",
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

```python
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
  "model": "gpt-3.5-turbo-instruct"
  "system_fingerprint": "fp_44709d6fcb",
}

```

</TabItem>
</Tabs>

## **支援的提供者** {#supported-providers}

| 提供者    | 使用方式連結      |
|-------------|--------------------|
| OpenAI      |   [使用方式](../docs/providers/text_completion_openai)                 | 
| Azure OpenAI|   [使用方式](../docs/providers/azure)                 |
