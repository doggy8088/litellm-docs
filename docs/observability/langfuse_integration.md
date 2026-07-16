import Image from '@theme/IdealImage';

# Langfuse {#langfuse}

## Langfuse 是什麼？ {#what-is-langfuse}

Langfuse（[GitHub](https://github.com/langfuse/langfuse)）是一個開源的 LLM 工程平台，用於模型 [tracing](https://langfuse.com/docs/tracing)、[prompt 管理](https://langfuse.com/docs/prompts/get-started) 與應用程式 [評估](https://langfuse.com/docs/scores/overview)。Langfuse 協助團隊協同除錯、分析與反覆迭代 LLM 應用程式。 

使用 LiteLLM 透過多個模型在 Langfuse 中的範例 trace：
<Image img={require('../../img/langfuse-example-trace-multiple-models-min.png')} />

:::info

對於 Langfuse v3，我們建議在 [OpenTelemetry v2 指南](./opentelemetry_v2#2-send-traces-to-a-specific-tool-presets) 中使用 `langfuse_otel` 預設值。

:::

## 與 LiteLLM Proxy（LLM 閘道）搭配使用 {#usage-with-litellm-proxy-llm-gateway}

👉 [**請透過此連結開始使用 LiteLLM Proxy server 將記錄傳送到 langfuse**](../proxy/logging)

## 與 LiteLLM Python SDK 搭配使用 {#usage-with-litellm-python-sdk}

### 先決條件 {#pre-requisites}
請先執行 `uv add langfuse` 以完成此整合
```shell
uv add langfuse==2.59.7 litellm
```

### 快速開始 {#quick-start}
只需 2 行程式碼，即可透過 Langfuse 立即記錄您的回應，**涵蓋所有提供者**：

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Langfuse.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

請從 https://cloud.langfuse.com/ 取得您的 Langfuse API 金鑰
```python
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"] # logs errors to langfuse
```
```python
# uv add langfuse 
import litellm
import os

# from https://cloud.langfuse.com/
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""
# Optional, defaults to https://cloud.langfuse.com
os.environ["LANGFUSE_HOST"] # optional

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set langfuse as a callback, litellm will send the data to langfuse
litellm.success_callback = ["langfuse"] 
 
# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

### 進階 {#advanced}
#### 設定自訂生成名稱、傳遞中繼資料 {#set-custom-generation-names-pass-metadata}

在 `metadata` 中傳遞 `generation_name`

```python
import litellm
from litellm import completion
import os

# from https://cloud.langfuse.com/
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-..."
os.environ["LANGFUSE_SECRET_KEY"] = "sk-..."


# OpenAI and Cohere keys 
# You can use any of the litellm supported providers: https://docs.litellm.ai/docs/providers
os.environ['OPENAI_API_KEY']="sk-..."

# set langfuse as a callback, litellm will send the data to langfuse
litellm.success_callback = ["langfuse"] 
 
# openai call
response = completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata = {
    "generation_name": "litellm-ishaan-gen", # set langfuse generation name
    # custom metadata fields
    "project": "litellm-proxy" 
  }
)
 
print(response)

```

#### 設定自訂 Trace ID、Trace User ID、Trace Metadata、Trace Version、Trace Release 與 Tags {#set-custom-trace-id-trace-user-id-trace-metadata-trace-version-trace-release-and-tags}

在 `metadata` 中傳遞 `trace_id`、`trace_user_id`、`trace_metadata`、`trace_version`、`trace_release`、`tags`

```python
import litellm
from litellm import completion
import os

# from https://cloud.langfuse.com/
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-..."
os.environ["LANGFUSE_SECRET_KEY"] = "sk-..."

os.environ['OPENAI_API_KEY']="sk-..."

# set langfuse as a callback, litellm will send the data to langfuse
litellm.success_callback = ["langfuse"] 

# set custom langfuse trace params and generation params
response = completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={
      "generation_name": "ishaan-test-generation",  # set langfuse Generation Name
      "generation_id": "gen-id22",                  # set langfuse Generation ID 
      "parent_observation_id": "obs-id9"            # set langfuse Parent Observation ID
      "version":  "test-generation-version"         # set langfuse Generation Version
      "trace_user_id": "user-id2",                  # set langfuse Trace User ID
      "session_id": "session-1",                    # set langfuse Session ID
      "tags": ["tag1", "tag2"],                     # set langfuse Tags
      "trace_name": "new-trace-name"                # set langfuse Trace Name
      "trace_id": "trace-id22",                     # set langfuse Trace ID
      "trace_metadata": {"key": "value"},           # set langfuse Trace Metadata
      "trace_version": "test-trace-version",        # set langfuse Trace Version (if not set, defaults to Generation Version)
      "trace_release": "test-trace-release",        # set langfuse Trace Release
      ### OR ### 
      "existing_trace_id": "trace-id22",            # if generation is continuation of past trace. This prevents default behaviour of setting a trace name
      ### OR enforce that certain fields are trace overwritten in the trace during the continuation ###
      "existing_trace_id": "trace-id22",
      "trace_metadata": {"key": "updated_trace_value"},            # The new value to use for the langfuse Trace Metadata
      "update_trace_keys": ["input", "output", "trace_metadata"],  # Updates the trace input & output to be this generations input & output also updates the Trace Metadata to match the passed in value
      "debug_langfuse": True,                                      # Will log the exact metadata sent to litellm for the trace/generation as `metadata_passed_to_litellm` 
  },
)

print(response)

```

您也可以將 `metadata` 作為請求標頭的一部分傳遞，並加上 `langfuse_*` 前綴：

```shell
curl --location --request POST 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'langfuse_trace_id: trace-id2' \
    --header 'langfuse_trace_user_id: user-id2' \
    --header 'langfuse_trace_metadata: {"key":"value"}' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```


#### Trace 與生成參數 {#trace--generation-parameters}

##### Trace 特定參數 {#trace-specific-parameters}

* `trace_id`       - trace 的識別碼；若這是既有 trace，則必須使用 `existing_trace_id` 取代 `trace_id`；預設為自動產生
* `trace_name`     - trace 的名稱；預設為自動產生
* `session_id`     - trace 的 session 識別碼；預設為 `None`
* `trace_version`  - trace 的版本；預設為 `version` 的值
* `trace_release`  - trace 的 release；預設為 `None`
* `trace_metadata` - trace 的中繼資料；預設為 `None`
* `trace_user_id`  - trace 的使用者識別碼；預設為 completion 引數 `user`
* `tags`           - trace 的標籤；預設為 `None`

##### 續接時可更新的參數 {#updatable-parameters-on-continuation}

以下參數可在 trace 的續接中更新，方法是將下列值傳入 completion 的中繼資料中的 `update_trace_keys`。

* `input`          - 會將 trace 的輸入設為此最新生成的輸入
* `output`         - 會將 trace 的輸出設為此生成的輸出
* `trace_version`  - 會將 trace 版本設為所提供的值（若要改用最新生成的版本，請使用 `version`）
* `trace_release`  - 會將 trace release 設為所提供的值
* `trace_metadata` - 會將 trace 中繼資料設為所提供的值
* `trace_user_id`  - 會將 trace 使用者 ID 設為所提供的值

#### 生成特定參數 {#generation-specific-parameters}

* `generation_id`         - 生成的識別碼；預設為自動產生
* `generation_name`       - 生成的識別碼；預設為自動產生
* `parent_observation_id` - 上層觀測的識別碼；預設為 `None`
* `prompt`                - 生成所使用的 Langfuse prompt 物件；預設為 `None`

傳入 @`litellm` completion 的中繼資料中未列於上述規格的任何其他鍵值對，都會作為生成的中繼資料鍵值對加入。

#### 多個 Langfuse 專案（每次請求的憑證） {#multiple-langfuse-projects-per-request-credentials}

您可以透過直接傳遞憑證給 `completion()` 或 `acompletion()`，將 trace 依每次請求傳送到不同的 Langfuse 專案。這可與全域環境變數一起使用（或取而代之），當不同團隊或業務流程使用不同的 Langfuse 專案時特別有用。

將 **`langfuse_public_key`**、**`langfuse_secret_key`**（或 **`langfuse_secret`**），以及可選的 **`langfuse_host`** 作為關鍵字引數傳遞：

```python
import litellm
from litellm import completion

# Optional: set a default via env for requests that don't pass credentials
# os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-default..."
# os.environ["LANGFUSE_SECRET_KEY"] = "sk-default..."

litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

# Request 1 → Langfuse Project A
response_a = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello from team A"}],
    langfuse_public_key="pk-lf-project-a...",
    langfuse_secret_key="sk-lf-project-a...",
    langfuse_host="https://us.cloud.langfuse.com",  # optional
)

# Request 2 → Langfuse Project B (different project)
response_b = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello from team B"}],
    langfuse_public_key="pk-lf-project-b...",
    langfuse_secret_key="sk-lf-project-b...",
    langfuse_host="https://eu.cloud.langfuse.com",  # optional, can differ per project
)
```

使用每次請求憑證的非同步用法：

```python
import litellm
from litellm import acompletion

litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

response = await acompletion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hi"}],
    langfuse_public_key="pk-lf-...",
    langfuse_secret_key="sk-lf-...",
    langfuse_host="https://us.cloud.langfuse.com",  # optional
)
```

- **`langfuse_public_key`** – Langfuse 專案公開金鑰（每次請求覆寫所需）。
- **`langfuse_secret_key`** 或 **`langfuse_secret`** – Langfuse 私密金鑰（兩種名稱皆可接受）。
- **`langfuse_host`** – Langfuse 主機 URL（例如 `https://us.cloud.langfuse.com`）；可選，預設為環境變數或 Langfuse cloud。

當傳入這些值時，該請求會使用此專案（以及主機）進行 Langfuse callback；若未提供，callback 會使用全域 Langfuse client（若已設定，則來自環境變數）。LiteLLM 會針對每組憑證快取一個 Langfuse client，以避免每次請求都建立新的 client。

#### 停用記錄 - 特定呼叫 {#disable-logging---specific-calls}

若要停用特定呼叫的記錄，請使用 `no-log` 標記。 

`completion(messages = ..., model = ...,  **{"no-log": True})`

### 搭配使用 LangChain ChatLiteLLM + Langfuse {#use-langchain-chatlitellm--langfuse}
在 model_kwargs 中傳遞 `trace_user_id`、`session_id`
```python
import os
from langchain.chat_models import ChatLiteLLM
from langchain.schema import HumanMessage
import litellm

# from https://cloud.langfuse.com/
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-..."
os.environ["LANGFUSE_SECRET_KEY"] = "sk-..."

os.environ['OPENAI_API_KEY']="sk-..."

# set langfuse as a callback, litellm will send the data to langfuse
litellm.success_callback = ["langfuse"] 

chat = ChatLiteLLM(
  model="gpt-3.5-turbo"
  model_kwargs={
      "metadata": {
        "trace_user_id": "user-id2", # set langfuse Trace User ID
        "session_id": "session-1" ,  # set langfuse Session ID
        "tags": ["tag1", "tag2"] 
      }
    }
  )
messages = [
    HumanMessage(
        content="what model are you"
    )
]
chat(messages)
```

### 從 Langfuse 記錄中遮罩訊息、回應內容  {#redacting-messages-response-content-from-langfuse-logging}

#### 從所有 Langfuse 記錄中遮罩訊息與回應 {#redact-messages-and-responses-from-all-langfuse-logging}

設定 `litellm.turn_off_message_logging=True` 這將防止訊息與回應被記錄到 langfuse，但請求中繼資料仍會被記錄。

#### 從特定 Langfuse 記錄中遮罩訊息與回應 {#redact-messages-and-responses-from-specific-langfuse-logging}

在通常為文字 completion 或 embedding 呼叫所傳遞的中繼資料中，您可以設定特定鍵值來遮罩此呼叫的訊息與回應。

將 `mask_input` 設為 `True`，會遮罩此呼叫的輸入不被記錄 

將 `mask_output` 設為 `True`，會使此呼叫的輸出不被記錄。

請注意，若您正在續接既有 trace，且將 `update_trace_keys` 設為包含 `input` 或 `output`，並且您設定對應的 `mask_input` 或 `mask_output`，那麼該 trace 既有的輸入和／或輸出將會被替換為已遮罩的訊息。

## 疑難排解與錯誤 {#troubleshooting--errors}
### 資料沒有被記錄到 Langfuse？  {#data-not-getting-logged-to-langfuse-}
- 請確認您使用的是最新版本的 langfuse `uv add langfuse -U`。最新版本可讓 litellm 將 JSON 輸入／輸出記錄到 langfuse
- 如果您在 langfuse 中看不到任何 trace，請遵循 [此檢查清單](https://langfuse.com/faq/all/missing-traces)。

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約 Demo 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
