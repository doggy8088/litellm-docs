import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Comet Opik {#comet-opik}
Opik 是一個開源的端到端 [LLM 評估平台](https://www.comet.com/site/products/opik/?utm_source=litelllm&utm_medium=docs&utm_content=intro_paragraph)，可協助開發人員在開發與生產環境中追蹤其 LLM 提示與回應。使用者可以定義並執行評估，在部署前測試其 LLM 應用程式，以檢查幻覺、準確性、上下文擷取等項目！

<Image img={require('../../img/opik.png')} />

:::info
我們希望了解如何讓回呼更好！歡迎認識 LiteLLM [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置條件 {#pre-requisites}

您可以在 [Opik 快速入門指南](https://www.comet.com/docs/opik/quickstart/) 中進一步了解如何設定 Opik。您也可以在我們的 [自架指南](https://www.comet.com/docs/opik/self-host/local_deployment) 中進一步了解如何自我代管 Opik。

## 快速開始 {#quick-start}
只要 4 行程式碼，即可立即透過 Opik 記錄您**跨所有提供者**的回應

請在 [這裡](https://www.comet.com/signup?utm_source=litelllm&utm_medium=docs&utm_content=api_key_cell) 註冊以取得您的 Opik API 金鑰！

```python
import litellm
litellm.callbacks = ["opik"]
```

完整範例：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
import os

# Configure the Opik API key or call opik.configure()
os.environ["OPIK_API_KEY"] = ""
os.environ["OPIK_WORKSPACE"] = ""

# LLM provider API Keys:
os.environ["OPENAI_API_KEY"] = ""

# set "opik" as a callback, litellm will send the data to an Opik server (such as comet.com)
litellm.callbacks = ["opik"]

# openai call
response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Why is tracking and evaluation of LLMs important?"}
    ]
)
```

如果您是在由 Opik 的 `@track` 裝飾器追蹤的函式內使用 liteLLM，
您需要在 metadata 屬性中提供 `current_span_data` 欄位，
以便將 LLM 請求指派到正確的 trace：

```python
from opik import track
from opik.opik_context import get_current_span_data
import litellm

litellm.callbacks = ["opik"]

@track()
def streaming_function(input):
    messages = [{"role": "user", "content": input}]
    response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=messages,
        metadata = {
            "opik": {
                "current_span_data": get_current_span_data(),
                "tags": ["streaming-test"],
            },
        }
    )
    return response

response = streaming_function("Why is tracking and evaluation of LLMs important?")
chunks = list(response)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo-testing
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["opik"]

environment_variables:
  OPIK_API_KEY: ""
  OPIK_WORKSPACE: ""
```

2. 執行 proxy

```bash
litellm --config config.yaml
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo-testing",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Boston today?"
    }
  ]
}'
```

</TabItem>
</Tabs>

## Opik 特定參數 {#opik-specific-parameters}

這些可以透過 metadata 與 `opik` 鍵一起傳入。

### 欄位  {#fields}

- `project_name` - 要傳送資料至的 Opik 專案名稱。
- `current_span_data` - 用於追蹤的目前 span 資料。
- `tags` - 用於追蹤的標籤。
- `thread_id` - 用來將多個相關 trace 群組在一起的 thread id。

### 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from opik import track
from opik.opik_context import get_current_span_data
import litellm

litellm.callbacks = ["opik"]

messages = [{"role": "user", "content": input}]
response = litellm.completion(
    model="gpt-3.5-turbo",
    messages=messages,
    metadata = {
        "opik": {
            "project_name": "your-opik-project-name",
            "current_span_data": get_current_span_data(),
            "tags": ["streaming-test"],
            "thread_id": "your-thread-id"
        },
    }
)
return response
```
</TabItem>
<TabItem value="proxy" label="Proxy">

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Boston today?"
    }
  ],
  "metadata": {
    "opik": {
      "project_name": "your-opik-project-name",
      "current_span_data": "...",
      "tags": ["streaming-test"],
      "thread_id": "your-thread-id"
    },
  }
}'
``` 

</TabItem>
</Tabs>

您也可以透過帶有 `opik_*` 前綴的請求標頭傳遞這些欄位：

```shell
curl --location --request POST 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'opik_project_name: your-opik-project-name' \
    --header 'opik_thread_id: your-thread-id' \
    --header 'opik_tags: ["streaming-test"]' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "What's the weather like in Boston today?"
        }
    ]
}'
```

## 來自 API 金鑰的自動 metadata {#automatic-metadata-from-api-keys}

在某些情況下，請求者可能無法或不知道如何將 Opik metadata 加入其請求中。為了確保所有與 Opik 相關的動作都能被正確追蹤，LiteLLM Proxy 可以在未提供任何 request 內 metadata 時，自動將使用者專屬 API 金鑰中的 metadata 關聯起來。

### 運作方式 {#how-it-works}

當您在 LiteLLM Proxy 中建立 API 金鑰時，可以將 Opik 特定 metadata 附加到該金鑰本身。除非請求明確提供自己的 Opik metadata（此時其優先），否則此 metadata 會自動套用至所有使用該金鑰發出的請求。

### 使用方式 {#usage-1}

**步驟 1：將 Opik Metadata 儲存到對應的 Api Key**
前往 'Virtual Keys'，點擊您選擇的 api key，並編輯 'Settings'。
現在將 opik metadata 儲存為使用者 api key metdata。

<Image img={require('../../img/opik_key_metadata.png')} />

**步驟 2：使用該金鑰 - Opik metadata 會自動套用**

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-key-from-step-1' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Boston today?"
    }
  ]
}'
```

使用此金鑰發出的所有請求都會自動追蹤到指定標籤的 "TestProject" Opik 專案中，而無需使用者在每個請求中傳遞 metadata。

## 支援與聯絡創辦人 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
