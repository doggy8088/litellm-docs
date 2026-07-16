import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /moderations {#moderations}

### 使用方式 {#usage}
<Tabs>
<TabItem value="python" label="LiteLLM Python SDK">

```python
from litellm import moderation

response = moderation(
    input="hello from litellm",
    model="text-moderation-stable"
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy Server">

對於 `/moderations` 端點，**不需要**在請求中或 litellm config.yaml 中指定 `model`

1. 設定 config.yaml
```yaml
model_list:
  - model_name: text-moderation-stable
    litellm_params:
      model: openai/omni-moderation-latest
```

2. 啟動 litellm proxy server 

```
litellm --config /path/to/config.yaml
```


<Tabs>
<TabItem value="python" label="OpenAI Python SDK">

```python
from openai import OpenAI

# set base_url to your proxy server
# set api_key to send to proxy server
client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

response = client.moderations.create(
    input="hello from litellm",
    model="text-moderation-stable"
)

print(response)
```
</TabItem>

<TabItem value="curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/moderations' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data '{"input": "Sample text goes here", "model": "text-moderation-stable"}'
```
</TabItem>
</Tabs>

</TabItem>
</Tabs>

## 輸入參數 {#input-params}
LiteLLM 可接受並轉換所有支援提供者的 [OpenAI Moderation 參數](https://platform.openai.com/docs/api-reference/moderations)。

### 必填欄位 {#required-fields}

- `input`: *string 或 array* - 要分類的輸入（或多個輸入）。可以是單一字串、字串陣列，或類似其他模型的多模態輸入物件陣列。
  - 如果是字串：要進行 moderation 分類的文字字串
  - 如果是字串陣列：要進行 moderation 分類的字串陣列
  - 如果是物件陣列：送入 moderation model 的多模態輸入陣列，其中每個物件可以是：
    - 描述要分類的圖片之物件：
      - `type`: *string, required* - 一律為 `image_url`
      - `image_url`: *object, required* - 包含圖片 URL 或 base64 編碼圖片的 data URL
    - 描述要分類的文字之物件：
      - `type`: *string, required* - 一律為 `text`
      - `text`: *string, required* - 要分類的文字字串

### 選填欄位 {#optional-fields}

- `model`: *string (optional)* - 要使用的 moderation model。預設為 `omni-moderation-latest`。

## 輸出格式 {#output-format}
以下是您可以從所有 moderation 請求預期得到的完整 json 輸出與型別：

[**LiteLLM 遵循 OpenAI 的輸出格式**](https://platform.openai.com/docs/api-reference/moderations/object)

```python
{
  "id": "modr-AB8CjOTu2jiq12hp1AQPfeqFWaORR",
  "model": "text-moderation-007",
  "results": [
    {
      "flagged": true,
      "categories": {
        "sexual": false,
        "hate": false,
        "harassment": true,
        "self-harm": false,
        "sexual/minors": false,
        "hate/threatening": false,
        "violence/graphic": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "harassment/threatening": true,
        "violence": true
      },
      "category_scores": {
        "sexual": 0.000011726012417057063,
        "hate": 0.22706663608551025,
        "harassment": 0.5215635299682617,
        "self-harm": 2.227119921371923e-6,
        "sexual/minors": 7.107352217872176e-8,
        "hate/threatening": 0.023547329008579254,
        "violence/graphic": 0.00003391829886822961,
        "self-harm/intent": 1.646940972932498e-6,
        "self-harm/instructions": 1.1198755256458526e-9,
        "harassment/threatening": 0.5694745779037476,
        "violence": 0.9971134662628174
      }
    }
  ]
}

```


## **支援的提供者** {#supported-providers}

#### ⚡️請前往 [models.litellm.ai](https://models.litellm.ai/) 查看所有支援的模型與提供者 {#️see-all-supported-models-and-providers-at-modelslitellmaihttpsmodelslitellmai}

| 提供者    |
|-------------|
| OpenAI      |
