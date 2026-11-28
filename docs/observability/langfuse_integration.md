---
title: "LiteLLM 的 Langfuse 追蹤：設定"
sidebar_label: "Langfuse"
description: "從 Python SDK 或 AI 閘道將 LiteLLM 追蹤傳送到 Langfuse，可依請求設定追蹤 ID、使用者 ID、標籤與中繼資料，並遮蔽訊息。"
---
import Image from '@theme/IdealImage';

# Langfuse {#langfuse}

## Langfuse 是什麼？ {#what-is-langfuse}

Langfuse（[GitHub](https://github.com/langfuse/langfuse)）是一個開源的 LLM 工程平台，用於模型 [tracing](https://langfuse.com/docs/tracing)、[prompt 管理](https://langfuse.com/docs/prompts/get-started) 與應用程式 [評估](https://langfuse.com/docs/scores/overview)。Langfuse 協助團隊協同除錯、分析與反覆迭代 LLM 應用程式。

使用 LiteLLM 透過多個模型在 Langfuse 中的範例 trace：
<Image img={require('../../img/langfuse-example-trace-multiple-models-min.png')} />

:::tip[建議：使用 OpenTelemetry v2]

對於 Langfuse v3 和 v4，我們建議使用 [OpenTelemetry v2 指南](./opentelemetry_v2#2-send-traces-to-a-specific-tool-presets) 中的 `langfuse_otel` 預設設定。這能提供更好的 span 品質、更低的延遲，以及原生 OpenTelemetry 語意。

正在從以 SDK 為基礎的 `langfuse` 回呼移轉嗎？請先閱讀 [Langfuse SDK 至 OpenTelemetry v2 移轉指南](./langfuse_to_otel_v2_migration)，了解擷取成本、伺服器相容性、內容擷取與中繼資料的變更。除非您需要在 Langfuse 中查看完整的請求樹，否則請使用 `llm_only`。

以下 SDK 回呼（`langfuse`）需要 Langfuse Python SDK v4（`langfuse>=4.7,<5`）。它會透過 LiteLLM 自己的 OpenTelemetry 管線將追蹤傳送至 Langfuse 的 OTLP 端點，因此追蹤幾乎即時顯示，並且只使用該 SDK 的 REST 用戶端來進行提示管理與憑證檢查。批次大小與提示快取 TTL 會透過 `LANGFUSE_FLUSH_AT` 和 `LANGFUSE_PROMPT_CACHE_DEFAULT_TTL_SECONDS` 調整（請參閱 [config settings](../proxy/config_settings)）。

自架的 Langfuse 必須是 3.63.0 或更新的伺服器版本才能使用 SDK v4，依據 [Langfuse 相容性矩陣](https://langfuse.com/self-hosting/upgrade/versioning#sdk-server)；OSS v2 伺服器不會提供回呼匯出到的 `/api/public/otel/v1/traces` 路由，因此追蹤會被以 404 拒絕，而 proxy 會記錄該拒絕。請先升級伺服器，再升級 LiteLLM，或在此之前先維持先前的 LiteLLM 版本。Langfuse 前方的 ingress 或反向 proxy 若有 request body 大小限制，對於過大的批次會回應 413；此回呼會將該批次切成兩半後重新傳送，而只有單一 span 自身就超過限制時才會被捨棄，並記錄錯誤。

:::

## 與 LiteLLM Proxy（LLM 閘道）搭配使用 {#usage-with-litellm-proxy-llm-gateway}

[**請透過此連結開始使用 LiteLLM Proxy server 將記錄傳送到 langfuse**](../proxy/logging)

若要將不同團隊或虛擬金鑰路由到不同的 Langfuse 專案，請參閱 [依 Team/Key 的記錄](../proxy/team_logging)。Team 預設值位於受信任的 `config.yaml`（其中 `os.environ/...` 參照會由 gateway 解析），而每個 key 的回呼則透過 `/key/generate` 或 `/key/update` 以解析後的憑證值佈建；這些是 key 上儲存的設定，而非每次請求的憑證。

## 與 LiteLLM Python SDK 搭配使用 {#usage-with-litellm-python-sdk}

:::note

本節涵蓋 `langfuse` 回呼，它使用 Langfuse Python SDK v4。或者，您也可以直接使用 [OpenTelemetry v2 整合](./opentelemetry_v2#2-send-traces-to-a-specific-tool-presets)。

:::

### 先決條件 {#pre-requisites}
請先執行 `uv add langfuse` 以完成此整合
```shell
uv add "langfuse>=4.7,<5" litellm
```

### 快速開始 {#quick-start}
只需 2 行程式碼，即可透過 Langfuse 立即記錄您的回應，**涵蓋所有提供者**：

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/89a6b5fbb26b632ef0faf633b0d3cf317d73deaa/cookbook/logging_observability/LiteLLM_Langfuse.ipynb">
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
  model="{{openai_small}}",
  messages=[
    {"role": "user", "content": "Hi - i'm openai"}
  ]
)
```

### 進階 {#advanced}

#### 設定自訂生成名稱、傳遞中繼資料 {#set-custom-generation-names-pass-metadata}

在 `generation_name` 中傳遞 `metadata`

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
  model="{{openai_small}}",
  messages=[
    {"role": "user", "content": "Hi - i'm openai"}
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

在 `trace_id` 中傳遞 `trace_user_id`、`trace_metadata`、`trace_version`、`trace_release`、`tags`、`metadata`

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
  model="{{openai_small}}",
  messages=[
    {"role": "user", "content": "Hi - i'm openai"}
  ],
  metadata={
      "generation_name": "ishaan-test-generation",  # set langfuse Generation Name
      "generation_id": "gen-id22",                  # set langfuse Generation ID 
      "parent_observation_id": "obs-id9",           # set langfuse Parent Observation ID
      "version":  "test-generation-version",        # set langfuse Generation Version
      "trace_user_id": "user-id2",                  # set langfuse Trace User ID
      "session_id": "session-1",                    # set langfuse Session ID
      "tags": ["tag1", "tag2"],                     # set langfuse Tags
      "trace_name": "new-trace-name",               # set langfuse Trace Name
      "trace_id": "trace-id22",                     # set langfuse Trace ID (non-hex IDs are deterministically hashed, see note below)
      "trace_metadata": {"key": "value"},           # set langfuse Trace Metadata
      "trace_version": "test-trace-version",        # set langfuse Version. v4 has a single version attribute - on a new trace, trace_version takes precedence over version
      "trace_release": "test-trace-release",        # set langfuse Trace Release
      ### OR ### 
      "existing_trace_id": "trace-id22",            # if generation is continuation of past trace. This prevents default behaviour of setting a trace name
      ### OR enforce that certain fields are trace overwritten in the trace during the continuation ###
      "existing_trace_id": "trace-id22",
      "trace_metadata": {"key": "updated_trace_value"},            # The new value to use for the langfuse Trace Metadata
      "update_trace_keys": ["input", "output", "trace_metadata"],  # Updates the trace input & output to be this generations input & output (written via observation fields in v4) and updates the Trace Metadata to match the passed in value. Requires `langfuse_enable_update_trace_keys: true`
      "debug_langfuse": True,                                      # Will log the scalar metadata sent to litellm for the trace/generation as `metadata_passed_to_litellm` 
  },
)

print(response)

```

:::info[Langfuse v4 語意]

- **自訂 `trace_id`**：Langfuse v4 需要 W3C trace ID（32 個小寫十六進位字元）。LiteLLM 會先將您的 `trace_id` 轉為小寫並移除連字號，因此像 `01234567-89AB-CDEF-0123-456789ABCDEF` 這樣的 UUID 會變成 `0123456789abcdef0123456789abcdef`，並直接使用。任何仍然不是 32 個十六進位字元的值，都會以決定性方式雜湊成一個值（透過 `Langfuse.create_trace_id(seed=<your id>)`）。相同的 `trace_id` 永遠會對應到同一個 Langfuse trace，但在 Langfuse 中可見的 ID 是標準化或雜湊後的形式，而不是您原本的字串。
- **`version` / `trace_version`**：Langfuse v4 只有單一 `version` 屬性。對於新的 trace，`trace_version` 的優先順序高於 `version`；在 `existing_trace_id` 延續中，`version` 仍會套用到 generation。
- **延續的 traces**：v4 伺服器會從 trace 中最新的 root observation 推導出 trace 的名稱/input/output。使用 `update_trace_keys` 搭配 `input`/`output` 仍會被採用——這些值會透過 observation 欄位寫入。

:::

您也可以將 `metadata` 作為請求標頭的一部分傳入，並加上 `langfuse_*` 前綴：

```shell
curl --location --request POST 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'langfuse_trace_id: trace-id2' \
    --header 'langfuse_trace_user_id: user-id2' \
    --header 'langfuse_trace_metadata: {"key":"value"}' \
    --data '{
    "model": "{{openai_small}}",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

#### Trace ID 與 `langfuse_otel` {#trace-id-with-langfuse_otel}

<SinceVersion v="1.113.0" />

經由 `langfuse_otel` 傳送的呼叫，若被命名為同一個 trace，就會歸入同一個 Langfuse trace。請在屬於該 trace 的每一次呼叫中，於 `metadata` 或 `litellm_metadata` 傳送相同的 `trace_id`，或傳送相同的 `langfuse_trace_id` 請求標頭：

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --data '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "what llm are you"}],
    "metadata": {"trace_id": "0af76519-16cd-43dd-8448-eb211c80319c"}
}'
```

當請求以多種方式命名其 trace 時，以該清單中的第一種為準。

未設定 `LITELLM_OTEL_V2` 時：

1. 有效的 W3C `traceparent` 標頭。
2. `metadata` 中的 `existing_trace_id`，或 `langfuse_existing_trace_id` 標頭。此呼叫只是加入該 trace，不會重新命名它。
3. `langfuse_trace_id` 標頭。
4. `x-litellm-trace-id` 標頭。
5. `metadata` 或 `litellm_metadata` 中的 `trace_id`。

設定 `LITELLM_OTEL_V2=true` 時：

1. 正確的 W3C `traceparent` 標頭。
2. `langfuse_trace_id` 標頭。
3. `metadata` 或 `litellm_metadata` 中的 `trace_id`。若 `/v1/responses` 或 `/v1/messages` 請求同時傳送兩者，則以 `litellm_metadata` 為準，因為 `metadata` 是提供者自己的欄位。

在 V2 上，`x-litellm-trace-id` 不會命名 trace，因為它是整個用戶端工作階段共用的一個 ID，會把該工作階段的所有呼叫合併成單一 trace。V2 也不使用 `existing_trace_id`，因為該請求會成為 trace 的第二個根節點，Langfuse 會重新命名 trace。傳送它的請求會得到自己的 trace。Proxy 會在第一次發生時記錄一次警告。

- 此 ID 的正規化方式與 `langfuse` 回呼相同（轉小寫、移除連字號），若不是 UUID 或 32 個十六進位字元，會雜湊成 32 個十六進位字元。Langfuse 中顯示的 trace ID 是正規化後的形式。
- 請為每個希望成為獨立 trace 的工作單元傳送不同的 `trace_id`。重複使用相同值（例如常數）的呼叫會被合併成單一 trace。
- 設定 `LITELLM_OTEL_V2=true` 時，這適用於所有 proxy 端點（`/v1/chat/completions`、`/v1/responses`、`/v1/messages` 等），限於 proxy 的 `max_request_size_mb` 與 16MB 上限內的 JSON、表單或文字 body，以及經由 Python SDK 發出的呼叫。二進位 body（例如音訊）不會被讀取，因此請務必以 `langfuse_trace_id` 標頭命名您的 trace。
- 設定 `LITELLM_OTEL_V2=true` 時，整個請求（包括其驗證與路由 spans）都是 Langfuse 中該命名 trace 的一部分。其他 OpenTelemetry exporter 與 `traceresponse` 回應標頭仍使用請求最初的 trace ID，且那些 exporter 不會獲得新的 span 屬性。所有傳送到 Langfuse 的 spans 都連結到該 trace 內的同一個 span。
- 設定 `LITELLM_OTEL_V2=true` 時，proxy 會提早讀取請求 body 以擷取其 trace ID。提早讀取時，每個 worker 同一時間最多保留 64MB 的請求 body，且最多等待 body 10 秒。超過這些上限的請求會得到自己的 trace，且 Langfuse 中的根 span 會帶有 `litellm.otel.trace_id_skipped` 屬性，說明 proxy 未使用該 trace ID 的原因。Proxy 會在每種上限第一次被超過時各記錄一次警告。
- 未設定 `LITELLM_OTEL_V2` 且已設定 `otel` 回呼時，`otel` exporter 會保留請求自己的 trace，Langfuse 中的每次呼叫會連結到 exporter 中其請求的 span。
- 工作階段標頭（例如 `x-litellm-session-id`）不會命名 trace。這些呼叫屬於同一個工作階段，但各自有自己的 trace。若未設定 `LITELLM_OTEL_V2`，工作階段標頭也會取代 body 中傳送的 `trace_id`（與 `langfuse` 回呼的行為相同）。因此，若您傳送工作階段標頭，也必須傳送 `langfuse_trace_id` 標頭。
- 較早的版本只是將 `trace_id` 設為 span 屬性，或在設定 `LITELLM_OTEL_V2=true` 時完全省略它，因此每次呼叫都進入自己的 trace。

#### Trace 與生成參數 {#trace--generation-parameters}

##### Trace 特定參數 {#trace-specific-parameters}

* `trace_id`       - trace 的識別碼；若這是既有 trace，必須使用 `existing_trace_id` 而非 `trace_id`；預設為自動產生。ID 會轉為小寫並移除連字號；任何仍然不是 32 個十六進位字元的值，都會以決定性方式雜湊成 32 位十六進位的 W3C trace ID（請參閱上方註解）
* `trace_name`     - trace 的名稱，預設為自動產生
* `session_id`     - trace 的 session 識別碼，預設為 `None`
* `trace_version`  - trace 的版本，預設為 `version` 的值。Langfuse v4 只有單一 `version` 屬性：在新的 trace 中，`trace_version` 具有優先權
* `trace_release`  - trace 的 release，預設為 `None`
* `trace_metadata` - trace 的 metadata，預設為 `None`
* `trace_user_id`  - trace 的使用者識別碼，預設為 completion 參數 `user`
* `tags`           - trace 的標籤，預設為 `None`

#### 生成特定參數 {#generation-specific-parameters}

* `generation_id`         - 生成的識別碼；預設為自動產生
* `generation_name`       - 生成的識別碼；預設為自動產生
* `parent_observation_id` - 上層觀測的識別碼；預設為 `None`
* `prompt`                - 生成所使用的 Langfuse prompt 物件；預設為 `None`

傳入 metadata 的任何其他 key-value 配對都會以 `requester_metadata` 的形式記錄在 generation 上。在 proxy 上，您在 request body 中傳送的任何內容都會自動發生這種情況。從 SDK 端，請將它們巢狀包裹，以便被擷取：

```python
response = litellm.completion(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "Hi"}],
    metadata={"metadata": {"my_key": "my_value"}},   # arrives as requester_metadata
)
```

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
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Hello from team A"}],
    langfuse_public_key="pk-lf-project-a...",
    langfuse_secret_key="sk-lf-project-a...",
    langfuse_host="https://us.cloud.langfuse.com",  # optional
)

# Request 2 → Langfuse Project B (different project)
response_b = completion(
    model="{{openai_small}}",
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
    model="{{openai_small}}",
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
  model="{{openai_small}}",
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

將 `mask_output` 設為 `True`，會將此呼叫所記錄的輸出替換為 `redacted-by-litellm`。

請注意，如果您正在延續既有 trace，且將 `update_trace_keys` 設定為包含 `input` 或 `output`，同時您也設定了對應的 `mask_input` 或 `mask_output`，那麼該 trace 既有的 input 和/或 output 將會被替換成一則已遮蔽的訊息。這僅適用於 `langfuse_enable_update_trace_keys` 開啟時。

### 圖片與其他 Base64 媒體 {#images-and-other-base64-media}

<SinceVersion v="1.113.0" />

`langfuse` 回呼會將 trace 中的 base64 媒體上傳至 Langfuse 媒體儲存，並在原處存放一段簡短參照，做法與 Langfuse SDK 相同。涵蓋範圍包括 OpenAI `image_url` 等 data URI、Anthropic 與 Vertex 的 base64 區塊，以及 Gemini `inline_data` 部分，位置在 trace 的輸入、輸出與 metadata 中。您開啟 trace 時，Langfuse UI 會從媒體儲存載入該檔案。不需要任何設定。

自行架設的 Langfuse 需要一個媒體 bucket 才能使用此功能，請參閱 [Langfuse 自行架設指南](https://langfuse.com/self-hosting/deployment/infrastructure/blobstorage)。當 Langfuse 沒有媒體 bucket，或上傳失敗時，trace 仍會保留該參照、檔案則不存在，而 LiteLLM 會記錄一則警告，指出該媒體與該 trace。

上傳會在背景執行，因此絕不會延遲請求。等待上傳的媒體會保留在記憶體中，每組 Langfuse 憑證、每個 worker 最多可保留 `LANGFUSE_MEDIA_QUEUE_MAX_BYTES`（預設 100 MB）。佇列滿了之後，新的媒體會以相同的警告略過，直到先前的上傳完成。

`langfuse_otel` 回呼與 OpenTelemetry v2 Langfuse 路徑會以內嵌方式傳送媒體，不會上傳。

## 疑難排解與錯誤 {#troubleshooting--errors}

### 資料沒有被記錄到 Langfuse？  {#data-not-getting-logged-to-langfuse-}
- 請確認您使用的是最新版本的 langfuse `uv add langfuse -U`。最新版本可讓 litellm 將 JSON 輸入／輸出記錄到 langfuse
- 如果您在 langfuse 中看不到任何 trace，請遵循 [此檢查清單](https://langfuse.com/faq/all/missing-traces)。

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約 Demo](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ishaan@berri.ai / krrish@berri.ai
