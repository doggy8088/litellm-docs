import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 提示快取  {#prompt-caching}

支援的提供者：
- OpenAI (`openai/`)
- Anthropic API (`anthropic/`)
- Google AI Studio (`gemini/`)
- Vertex AI (`vertex_ai/`, `vertex_ai_beta/`)
- Bedrock (`bedrock/`, `bedrock/invoke/`, `bedrock/converse`) ([Bedrock 支援提示快取的所有模型](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html))
- Deepseek API (`deepseek/`)
- xAI (`xai/`)

:::warning[最低權杖需求]
當輸入低於提供者的最低值時，提示快取會被靜默略過，且**不會回傳錯誤**。請務必透過檢查回應中的 `cache_creation_input_tokens` 來確認快取已發生。

| 提供者 | 最低輸入權杖數 |
|---|---|
| OpenAI | 1,024 |
| Anthropic (Claude Opus 5, Fable 5, Mythos 5) | 512 |
| Anthropic (Claude Sonnet 5, Opus 4.8, Sonnet 4.x, Opus 4, 4.1, Claude 3.x) | 1,024 |
| Anthropic (Claude Haiku 4.5, Opus 4.5, 4.6) | 4,096 |
| Bedrock (Claude Opus 5) | 512 |
| Bedrock (Claude Sonnet 5, Opus 4.8, Sonnet 4.x, Claude 3.5, 3.7) | 1,024 |
| Bedrock (Claude Haiku 4.5, Opus 4.5, 4.6, 4.7) | 4,096 |
| Google Gemini | 1,024 |
:::

對於支援的提供者，LiteLLM 會遵循 OpenAI 提示快取的 usage 物件格式：

```bash
"usage": {
  "prompt_tokens": 2006,
  "completion_tokens": 300,
  "total_tokens": 2306,
  "prompt_tokens_details": {
    "cached_tokens": 1920
  },
  "completion_tokens_details": {
    "reasoning_tokens": 0
  }
  # ANTHROPIC_ONLY #
  "cache_creation_input_tokens": 0
}
```

- `prompt_tokens`：這些是所有提示 token，包含 cache-miss 與 cache-hit 的輸入 token。
- `completion_tokens`：這些是模型產生的輸出 token。
- `total_tokens`：prompt_tokens + completion_tokens 的總和。
- `prompt_tokens_details`：包含 cached_tokens 的物件。
    - `cached_tokens`：這次呼叫中屬於 cache-hit 的 token。
- `completion_tokens_details`：包含 reasoning_tokens 的物件。
- **ANTHROPIC_ONLY**：`cache_creation_input_tokens` 是寫入快取的 token 數量。（Anthropic 會針對此收費）

## 快速開始 {#quick-start}

注意：OpenAI 快取僅適用於包含 1024 個 token 或以上的提示

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion 
import os

os.environ["OPENAI_API_KEY"] = ""

for _ in range(2):
    response = completion(
        model="{{openai_large}}",
        messages=[
            # System Message
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "Here is the full text of a complex legal agreement"
                        * 400,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What are the key terms and conditions in this agreement?",
                    }
                ],
            },
            {
                "role": "assistant",
                "content": "Certainly! the key terms and conditions are the following: the contract is 1 year long for $10/mo",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What are the key terms and conditions in this agreement?",
                    }
                ],
            },
        ],
        temperature=0.2,
        max_tokens=10,
    )

print("response=", response)
print("response.usage=", response.usage)

assert "prompt_tokens_details" in response.usage
assert response.usage.prompt_tokens_details.cached_tokens > 0
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: {{openai_large}}
      litellm_params:
        model: openai/{{openai_large}}
        api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-<your-litellm-api-key>
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)

for _ in range(2):
    response = client.chat.completions.create(
        model="{{openai_large}}",
        messages=[
            # System Message
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "Here is the full text of a complex legal agreement"
                        * 400,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What are the key terms and conditions in this agreement?",
                    }
                ],
            },
            {
                "role": "assistant",
                "content": "Certainly! the key terms and conditions are the following: the contract is 1 year long for $10/mo",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What are the key terms and conditions in this agreement?",
                    }
                ],
            },
        ],
        temperature=0.2,
        max_tokens=10,
    )

print("response=", response)
print("response.usage=", response.usage)

assert "prompt_tokens_details" in response.usage
assert response.usage.prompt_tokens_details.cached_tokens > 0
```

</TabItem>
</Tabs>

### OpenAI `prompt_cache_key` 與 `prompt_cache_retention` {#openai-prompt_cache_key-and-prompt_cache_retention}

OpenAI 提示快取是 [**自動**](https://platform.openai.com/docs/guides/prompt-caching) 的；不需要 `cache_control` 訊息註解。任何具有 1024+ 提示權杖的請求都符合快取資格。

OpenAI 也支援兩個可選參數，可更精細控制快取行為：

- **`prompt_cache_key`**（字串）：可提升共享長公共前綴之請求的快取命中率的路由提示。具有相同快取金鑰的請求會被路由到相同的後端，進而提高快取命中的可能性。
- **`prompt_cache_retention`**（`"in_memory"` 或 `"24h"`）：控制快取 TTL。預設為 `"in_memory"`（5–10 分鐘）。設定為 `"24h"` 可進行延長快取，將 KV 張量卸載到 GPU 本機儲存空間。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = ""

response = completion(
    model="{{openai_large}}",
    messages=[
        {
            "role": "system",
            "content": "You are an AI assistant tasked with analyzing legal documents. "
            + "Here is the full text of a complex legal agreement " * 400,
        },
        {
            "role": "user",
            "content": "What are the key terms and conditions?",
        },
    ],
    prompt_cache_key="legal-doc-analysis",
    prompt_cache_retention="24h",
)
print(response.usage)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY",
    base_url="LITELLM_PROXY_BASE",
)

response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[
        {
            "role": "system",
            "content": "You are an AI assistant tasked with analyzing legal documents. "
            + "Here is the full text of a complex legal agreement " * 400,
        },
        {
            "role": "user",
            "content": "What are the key terms and conditions?",
        },
    ],
    extra_body={
        "prompt_cache_key": "legal-doc-analysis",
        "prompt_cache_retention": "24h",
    },
)
print(response.usage)
```

</TabItem>
</Tabs>

### OpenAI 明確斷點（GPT-5.6 及更新版本） {#openai-explicit-breakpoints-gpt-56-and-newer}

GPT-5.6 及更新版本也支援 [明確快取斷點](https://developers.openai.com/api/docs/guides/prompt-caching#prompt-cache-breakpoints)：在內容區塊上加入 `prompt_cache_breakpoint` 標記，再搭配請求層級的 `prompt_cache_options` 來選擇模式（`implicit` 會保留 OpenAI 在最新訊息上的自動斷點並與您的標記並存，`explicit` 則只使用您的標記）以及快取 `ttl`（`30m`）。LiteLLM 會在 `/chat/completions`、`/responses`，以及對 Anthropic 形狀的用戶端在 `/v1/messages` 上原樣傳遞這兩者。接受此標記的模型會在成本對應表中帶有 `supports_prompt_cache_breakpoint: true`，而尚未在對應表中被標記的 GPT-5.6 或更新版本 OpenAI 模型名稱也會以相同方式處理。若要讓 LiteLLM 從部署設定替您放置標記，請參閱 [自動注入教學](../tutorials/prompt_caching.md#openai-gpt-56-and-newer)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = ""

response = completion(
    model="openai/gpt-5.6",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents. "
                    + "Here is the full text of a complex legal agreement " * 400,
                    "prompt_cache_breakpoint": {"mode": "explicit"},
                }
            ],
        },
        {
            "role": "user",
            "content": "What are the key terms and conditions?",
        },
    ],
    prompt_cache_options={"mode": "explicit", "ttl": "30m"},
)
print(response.usage.prompt_tokens_details)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY",
    base_url="LITELLM_PROXY_BASE",
)

response = client.responses.create(
    model="gpt-5.6",
    input=[
        {
            "type": "message",
            "role": "developer",
            "content": [
                {
                    "type": "input_text",
                    "text": "You are an AI assistant tasked with analyzing legal documents. "
                    + "Here is the full text of a complex legal agreement " * 400,
                    "prompt_cache_breakpoint": {"mode": "explicit"},
                }
            ],
        },
        {
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": "What are the key terms and conditions?"}],
        },
    ],
    extra_body={"prompt_cache_options": {"mode": "explicit", "ttl": "30m"}},
)
print(response.usage.input_tokens_details)
```

</TabItem>
</Tabs>

### Anthropic 範例  {#anthropic-example}

Anthropic 會針對寫入快取收費。

使用 `"cache_control": {"type": "ephemeral"}` 指定要快取的內容。

這個相同格式也適用於 [Gemini / Vertex AI](#google-ai-studio--vertex-ai-gemini-example)。對於其他提供者，會被忽略。

<Tabs>
<TabItem value="sdk" label="SDK">

```python 
from litellm import completion 
import litellm 
import os 

litellm.set_verbose = True # 👈 SEE RAW REQUEST
os.environ["ANTHROPIC_API_KEY"] = "" 

response = completion(
    model="anthropic/{{anthropic}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ]
)

print(response.usage)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: {{anthropic}}
      litellm_params:
        model: anthropic/{{anthropic}}
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python 
from openai import OpenAI 
import os

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-<your-litellm-api-key>
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)

response = client.chat.completions.create(
    model="{{anthropic}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ]
)

print(response.usage)
```

</TabItem>
</Tabs>

:::tip[最低權杖數（Anthropic）]
低於最低值的提示會在不使用快取的情況下處理，且不會回傳錯誤。請檢查回應中的 `cache_creation_input_tokens`。

| 模型 | 最低權杖數 |
|---|---|
| Claude Opus 5, Fable 5, Mythos 5 | 512 |
| Claude Sonnet 5, Opus 4.8 | 1,024 |
| Claude Opus 4.7 | 2,048 |
| Claude Haiku 4.5, Opus 4.5, Opus 4.6 | 4,096 |
| Claude Sonnet 4, Sonnet 4.5, Sonnet 4.6, Opus 4, Opus 4.1 | 1,024 |
| Claude 3.5 Haiku | 2,048 |
| Claude 3.x Haiku, Sonnet, Opus, 3.5 Sonnet, 3.7 Sonnet | 1,024 |

請參閱 [Anthropic 的提示快取文件](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 以取得完整清單；這些最低值適用於各模型可用的每個平台。
:::

### Bedrock 範例 {#bedrock-example}

LiteLLM 會自動將 OpenAI 格式的 `cache_control` 標記轉換為 Bedrock 原生的 `cachePoint` 格式，因此如果您已經在使用 `cache_control`，現有程式碼不需要修改。

:::tip[最低權杖數（Bedrock）]
低於最低值的提示會在不使用快取的情況下處理，且不會回傳錯誤。請檢查回應中的 `cache_creation_input_tokens`。

| 模型系列 | 每個請求的最低權杖數 |
|---|---|
| Claude Opus 5 | 512 |
| Claude Sonnet 5, Opus 4.8 | 1,024 |
| Claude Haiku 4.5, Opus 4.5, Opus 4.6, Opus 4.7 | 4,096 |
| Claude Sonnet 4.5, Sonnet 4.6 | 1,024 |
| Claude 3.5 Sonnet v2, Claude 3.7 Sonnet | 1,024 |

請參閱 [Bedrock 提示快取文件](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html) 以取得完整的逐模型表格。
:::

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

response = litellm.completion(
    model="bedrock/us.anthropic.{{anthropic}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "<your large system prompt here, at least 1,024 tokens on Claude Sonnet 4.x, 4,096 on Haiku 4.5 and Opus 4.5+>",
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        },
        {"role": "user", "content": "What is prompt caching?"}
    ]
)

print(response.usage)
# cache_creation_input_tokens > 0 on first call (cache written)
# cache_read_input_tokens > 0 on subsequent calls (cache hit)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: bedrock-claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "bedrock-claude-sonnet",
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "<your large system prompt here, at least 1,024 tokens on Claude Sonnet 4.x, 4,096 on Haiku 4.5 and Opus 4.5+>",
            "cache_control": {"type": "ephemeral"}
          }
        ]
      },
      {"role": "user", "content": "What is prompt caching?"}
    ]
  }'
```

</TabItem>
</Tabs>

**支援的 Bedrock 模型：**

| 模型 | Bedrock 模型 ID | 最低權杖數 | TTL 選項 |
|---|---|---|---|
| Claude Opus 5 | `anthropic.claude-opus-5` | 512 | 5 分鐘、1 小時 |
| Claude Sonnet 5 | `anthropic.claude-sonnet-5` | 1,024 | 5 分鐘、1 小時 |
| Claude Opus 4.8 | `anthropic.claude-opus-4-8` | 1,024 | 5 分鐘、1 小時 |
| Claude 3.5 Sonnet v2 | `anthropic.claude-3-5-sonnet-20241022-v2:0` | 1,024 | 5 分鐘、1 小時 |
| Claude 3.7 Sonnet | `anthropic.claude-3-7-sonnet-20250219-v1:0` | 1,024 | 5 分鐘、1 小時 |
| Claude Opus 4 | `anthropic.claude-opus-4-20250514-v1:0` | 1,024 | 5 分鐘、1 小時 |
| Claude Sonnet 4.5, 4.6 | `us.anthropic.claude-sonnet-4-5-*`, `us.anthropic.claude-sonnet-4-6-*` | 1,024 | 5 分鐘、1 小時 |
| Claude Haiku 4.5 | `us.anthropic.claude-haiku-4-5-*` | 4,096 | 5 分鐘、1 小時 |
| Claude Opus 4.5, 4.6, 4.7 | `us.anthropic.claude-opus-4-5-*`, `us.anthropic.claude-opus-4-6-*`, `us.anthropic.claude-opus-4-7-*` | 4,096 | 5 分鐘、1 小時 |

也支援上述模型的跨區域推論設定檔。

請參閱 [AWS Bedrock prompt caching 文件](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html) 以取得完整支援模型與區域清單。

### Google AI Studio / Vertex AI (Gemini) 範例 {#google-ai-studio--vertex-ai-gemini-example}

請使用相同的 Anthropic 樣式 `cache_control` 格式；LiteLLM 會自動將其轉換為 Google 的 [內容快取 API](https://ai.google.dev/api/caching)。

**其底層運作方式：**
1. 含有 `cache_control` 的訊息會被分離並傳送到 Google 的 `cachedContents` API
2. 接著，快取內容 ID 會以 `cachedContent` 的形式傳入 Gemini 請求主體
3. 可跨越所有三個提供者運作：`gemini/`（Google AI Studio）、`vertex_ai/` 和 `vertex_ai_beta/`
4. 快取內容需要至少 **1024 個權杖**。低於此數值時，快取會被靜默略過

:::warning

Gemini 2.5 及更新版本已經會免費隱式快取重複前綴。手動或透過 `cache_control_injection_points` 傳送 `cache_control` 會將該請求改為明確快取：被標記的前綴會移入 `cachedContents` 物件，因此隱式快取不再適用於它，且 Google 會針對每個快取物件收取儲存費用。只有在您刻意要在 Gemini 上使用明確快取時，才新增 `cache_control`。請參閱 [自動注入教學](../tutorials/prompt_caching.md)

:::

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["GEMINI_API_KEY"] = ""

response = completion(
    model="gemini/{{gemini_flash}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ],
)

print(response.usage)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: {{gemini_flash}}
      litellm_params:
        model: gemini/{{gemini_flash}}
        api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY",  # sk-<your-litellm-api-key>
    base_url="LITELLM_PROXY_BASE",  # http://0.0.0.0:4000
)

response = client.chat.completions.create(
    model="{{gemini_flash}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ],
)

print(response.usage)
```

</TabItem>
</Tabs>

#### Vertex AI {#vertex-ai}

對於 Vertex AI，請使用 `vertex_ai/` 前綴：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="vertex_ai/{{gemini_flash}}",
    vertex_project="my-gcp-project",
    vertex_location="us-central1",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ],
)

print(response.usage)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: {{gemini_flash}}
      litellm_params:
        model: vertex_ai/{{gemini_flash}}
        vertex_project: my-gcp-project
        vertex_location: us-central1
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY",  # sk-<your-litellm-api-key>
    base_url="LITELLM_PROXY_BASE",  # http://0.0.0.0:4000
)

response = client.chat.completions.create(
    model="{{gemini_flash}}",
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ],
)

print(response.usage)
```

</TabItem>
</Tabs>

### Deepeek 範例  {#deepeek-example}

與 OpenAI 的運作方式相同。 

```python 
from litellm import completion 
import litellm
import os 

os.environ["DEEPSEEK_API_KEY"] = "" 

litellm.set_verbose = True # 👈 SEE RAW REQUEST

model_name = "deepseek/deepseek-chat"
messages_1 = [
    {
        "role": "system",
        "content": "You are a history expert. The user will provide a series of questions, and your answers should be concise and start with `Answer:`",
    },
    {
        "role": "user",
        "content": "In what year did Qin Shi Huang unify the six states?",
    },
    {"role": "assistant", "content": "Answer: 221 BC"},
    {"role": "user", "content": "Who was the founder of the Han Dynasty?"},
    {"role": "assistant", "content": "Answer: Liu Bang"},
    {"role": "user", "content": "Who was the last emperor of the Tang Dynasty?"},
    {"role": "assistant", "content": "Answer: Li Zhu"},
    {
        "role": "user",
        "content": "Who was the founding emperor of the Ming Dynasty?",
    },
    {"role": "assistant", "content": "Answer: Zhu Yuanzhang"},
    {
        "role": "user",
        "content": "Who was the founding emperor of the Qing Dynasty?",
    },
]

message_2 = [
    {
        "role": "system",
        "content": "You are a history expert. The user will provide a series of questions, and your answers should be concise and start with `Answer:`",
    },
    {
        "role": "user",
        "content": "In what year did Qin Shi Huang unify the six states?",
    },
    {"role": "assistant", "content": "Answer: 221 BC"},
    {"role": "user", "content": "Who was the founder of the Han Dynasty?"},
    {"role": "assistant", "content": "Answer: Liu Bang"},
    {"role": "user", "content": "Who was the last emperor of the Tang Dynasty?"},
    {"role": "assistant", "content": "Answer: Li Zhu"},
    {
        "role": "user",
        "content": "Who was the founding emperor of the Ming Dynasty?",
    },
    {"role": "assistant", "content": "Answer: Zhu Yuanzhang"},
    {"role": "user", "content": "When did the Shang Dynasty fall?"},
]

response_1 = litellm.completion(model=model_name, messages=messages_1)
response_2 = litellm.completion(model=model_name, messages=message_2)

# Add any assertions here to check the response
print(response_2.usage)
```

## 計算成本  {#calculate-cost}

快取命中時的提示 token 成本可能與快取未命中時不同。

使用 `completion_cost()` 函式來計算成本（[也會處理提示快取成本計算](https://github.com/BerriAI/litellm/blob/f7ce1173f3315cc6cae06cf9bcf12e54a2a19705/litellm/llms/anthropic/cost_calculation.py#L12)）。[**查看更多輔助函式**](./token_usage.md)

```python
cost = completion_cost(completion_response=response, model=model)
```

### 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion, completion_cost
import litellm 
import os 

litellm.set_verbose = True # 👈 SEE RAW REQUEST
os.environ["ANTHROPIC_API_KEY"] = "" 
model = "anthropic/{{anthropic}}"
response = completion(
    model=model,
    messages=[
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing legal documents.",
                },
                {
                    "type": "text",
                    "text": "Here is the full text of a complex legal agreement" * 400,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
        },
        {
            "role": "user",
            "content": "what are the key terms and conditions in this agreement?",
        },
    ]
)

print(response.usage)

cost = completion_cost(completion_response=response, model=model) 

formatted_string = f"${float(cost):.10f}"
print(formatted_string)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

LiteLLM 會在回應標頭中回傳計算出的成本 - `x-litellm-response-cost` 

```python
from openai import OpenAI

client = OpenAI(
    api_key="LITELLM_PROXY_KEY", # sk-<your-litellm-api-key>..
    base_url="LITELLM_PROXY_BASE" # http://0.0.0.0:4000
)
response = client.chat.completions.with_raw_response.create(
    messages=[{
        "role": "user",
        "content": "Say this is a test",
    }],
    model="{{openai_small}}",
)
print(response.headers.get('x-litellm-response-cost'))

completion = response.parse()  # get the object that `chat.completions.create()` would have returned
print(completion)
```

</TabItem>
</Tabs>

## 檢查模型支援 {#check-model-support}

使用 `supports_prompt_caching()` 檢查模型是否支援提示快取 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm.utils import supports_prompt_caching

supports_pc: bool = supports_prompt_caching(model="anthropic/{{anthropic}}")

assert supports_pc
```

</TabItem>
<TabItem value="proxy" label="PROXY">

使用 `/model/info` 端點檢查 proxy 上的模型是否支援提示快取 

1. 設定 config.yaml 

```yaml
model_list:
    - model_name: {{anthropic}}
      litellm_params:
        model: anthropic/{{anthropic}}
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -L -X GET 'http://0.0.0.0:4000/v1/model/info' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
```

**預期回應**

```bash
{
    "data": [
        {
            "model_name": "{{anthropic}}",
            "litellm_params": {
                "model": "anthropic/{{anthropic}}"
            },
            "model_info": {
                "key": "{{anthropic}}",
                ...
                "supports_prompt_caching": true # 👈 LOOK FOR THIS!
            }
        }
    ]
}
```

</TabItem>
</Tabs>

這會檢查我們維護的 [模型資訊/成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)

## 進一步閱讀 {#read-more}

:::tip[自動注入提示快取]
想讓 LiteLLM 自動加入 `cache_control` 指令，而不修改您的程式碼嗎？

請參閱 [**自動注入提示快取教學**](../tutorials/prompt_caching.md)，了解如何使用 `cache_control_injection_points` 來自動快取系統訊息、依索引指定的特定訊息，或自訂注入模式。
:::
