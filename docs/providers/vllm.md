import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# VLLM {#vllm}

LiteLLM 支援 VLLM 上的所有模型。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | vLLM 是一個快速且易於使用的 LLM 推論與服務程式庫。[文件](https://docs.vllm.ai/en/latest/index.html) |
| LiteLLM 提供者路由 | `hosted_vllm/`（用於 OpenAI 相容伺服器），`vllm/`（[已棄用]，用於 vLLM sdk 使用） |
| 提供者文件 | [vLLM ↗](https://docs.vllm.ai/en/latest/index.html) |
| 支援的端點 | `/chat/completions`、`/embeddings`、`/completions`、`/rerank`、`/audio/transcriptions` |

# 快速開始 {#quick-start}

## 使用 - litellm.completion（呼叫 OpenAI 相容端點） {#usage---litellmcompletion-calling-openai-compatible-endpoint}
vLLM 提供 OpenAI 相容端點 - 以下是如何透過 LiteLLM 呼叫它

若要使用 litellm 呼叫託管的 vllm 伺服器，請在您的 completion 呼叫中加入以下內容

* `model="hosted_vllm/<your-vllm-model-name>"` 
* `api_base = "your-hosted-vllm-server"`

```python
import litellm 

response = litellm.completion(
            model="hosted_vllm/facebook/opt-125m", # pass the vllm model name
            messages=messages,
            api_base="https://hosted-vllm-api.co",
            temperature=0.2,
            max_tokens=80)

print(response)
```


## 使用 -  LiteLLM Proxy Server（呼叫 OpenAI 相容端點） {#usage----litellm-proxy-server-calling-openai-compatible-endpoint}

以下是如何使用 LiteLLM Proxy Server 呼叫 OpenAI 相容端點

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: hosted_vllm/facebook/opt-125m  # add hosted_vllm/ prefix to route as OpenAI provider
        api_base: https://hosted-vllm-api.co      # add api base for OpenAI compatible provider
  ```

2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "what llm are you"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "what llm are you"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>

  ## Reasoning Effort

  <Tabs>
  <TabItem value="sdk" label="SDK">

  ```python
  from litellm import completion

  response = completion(
      model="hosted_vllm/gpt-oss-120b",
      messages=[{"role": "user", "content": "whats 2 + 2"}],
      reasoning_effort="high",
      api_base="https://hosted-vllm-api.co",
  )
  print(response)
  ```
  </TabItem>
  <TabItem value="proxy" label="PROXY">

  1. 設定 config.yaml

  ```yaml
  model_list:
    - model_name: gpt-oss-120b
      litellm_params:
        model: hosted_vllm/gpt-oss-120b
        api_base: https://hosted-vllm-api.co
  ```

  2. 啟動 proxy

  ```bash
  litellm --config /path/to/config.yaml
  ```

  3. 測試它！

  ```bash
  curl http://0.0.0.0:4000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{"model": "gpt-oss-120b", "messages": [{"role": "user", "content": "whats 2 + 2"}], "reasoning_effort": "high"}'
  ```

  </TabItem>
  </Tabs>

## 嵌入 {#embeddings}

vLLM 提供 OpenAI 相容的 `/v1/embeddings`。當用戶端省略 `encoding_format` 時，LiteLLM 會為 OpenAI 相容的 embedding 路由預設設定它（request → model `litellm_params` → `LITELLM_DEFAULT_EMBEDDING_ENCODING_FORMAT` → `float`）。請參閱 [Embeddings](../proxy/embedding.md#embedding-encoding-format)。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding   
import os

os.environ["HOSTED_VLLM_API_BASE"] = "http://localhost:8000"


embedding = embedding(model="hosted_vllm/facebook/opt-125m", input=["Hello world"])

print(embedding)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: my-model
      litellm_params:
        model: hosted_vllm/facebook/opt-125m  # add hosted_vllm/ prefix to route as OpenAI provider
        api_base: https://hosted-vllm-api.co      # add api base for OpenAI compatible provider
```

2. 啟動 proxy 

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/embeddings' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"input": ["hello world"], "model": "my-model"}'
```

[查看 OpenAI SDK/Langchain/etc. 範例](../proxy/user_keys.md#embeddings)

</TabItem>
</Tabs>

## 重排 {#rerank}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["HOSTED_VLLM_API_BASE"] = "http://localhost:8000"
os.environ["HOSTED_VLLM_API_KEY"] = ""  # [optional], if your VLLM server requires an API key

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="hosted_vllm/your-rerank-model",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```

### 非同步使用 {#async-usage}

```python
from litellm import arerank
import os, asyncio

os.environ["HOSTED_VLLM_API_BASE"] = "http://localhost:8000"
os.environ["HOSTED_VLLM_API_KEY"] = ""  # [optional], if your VLLM server requires an API key

async def test_async_rerank(): 
    query = "What is the capital of the United States?"
    documents = [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country.",
    ]

    response = await arerank(
        model="hosted_vllm/your-rerank-model",
        query=query,
        documents=documents,
        top_n=3,
    )
    print(response)

asyncio.run(test_async_rerank())
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: my-rerank-model
      litellm_params:
        model: hosted_vllm/your-rerank-model  # add hosted_vllm/ prefix to route as VLLM provider
        api_base: http://localhost:8000      # add api base for your VLLM server
        # api_key: your-api-key             # [optional] if your VLLM server requires authentication
```

2. 啟動 proxy 

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/rerank' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "model": "my-rerank-model",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3
}'
```

[查看 OpenAI SDK/Langchain/etc. 範例](../rerank.md#litellm-proxy-usage)

</TabItem>
</Tabs>

## 將影片 URL 傳送至 VLLM {#send-video-url-to-vllm}

VLLM 的範例實作 [請見此處](https://github.com/vllm-project/vllm/pull/10020)

<Tabs>
<TabItem value="files_message" label="（統一）Files Message">

使用此方式可用 OpenAI 的 `files` 訊息類型，以相同格式將影片 URL 傳送至 VLLM + Gemini。

將影片 URL 傳送至 VLLM 有兩種方式：

1. 直接傳遞影片 URL

```
{"type": "file", "file": {"file_id": video_url}},
```

2. 將影片資料以 base64 傳遞

```
{"type": "file", "file": {"file_data": f"data:video/mp4;base64,{video_data_base64}"}}
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

messages=[
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Summarize the following video"
            },
            {
                "type": "file",
                "file": {
                    "file_id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                }
            }
        ]
    }
]

# call vllm 
os.environ["HOSTED_VLLM_API_BASE"] = "https://hosted-vllm-api.co"
os.environ["HOSTED_VLLM_API_KEY"] = "" # [optional], if your VLLM server requires an API key
response = completion(
    model="hosted_vllm/qwen", # pass the vllm model name
    messages=messages,
)

# call gemini 
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"
response = completion(
    model="gemini/gemini-1.5-flash", # pass the gemini model name
    messages=messages,
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: my-model
      litellm_params:
        model: hosted_vllm/qwen  # add hosted_vllm/ prefix to route as OpenAI provider
        api_base: https://hosted-vllm-api.co      # add api base for OpenAI compatible provider
    - model_name: my-gemini-model
      litellm_params:
        model: gemini/gemini-1.5-flash  # add gemini/ prefix to route as Google AI Studio provider
        api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 proxy 

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

```bash
curl -X POST http://0.0.0.0:4000/chat/completions \
-H "Authorization: Bearer sk-1234" \
-H "Content-Type: application/json" \
-d '{
    "model": "my-model",
    "messages": [
        {"role": "user", "content": 
            [
                {"type": "text", "text": "Summarize the following video"},
                {"type": "file", "file": {"file_id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}
            ]
        }
    ]
}'
```

</TabItem>
</Tabs>

</TabItem>
<TabItem value="video_url" label="（VLLM 專用）Video Message">

使用此方式可將影片 URL 以其原生訊息格式（`video_url`）傳送至 VLLM。

將影片 URL 傳送至 VLLM 有兩種方式：

1. 直接傳遞影片 URL

```
{"type": "video_url", "video_url": {"url": video_url}},
```

2. 將影片資料以 base64 傳遞

```
{"type": "video_url", "video_url": {"url": f"data:video/mp4;base64,{video_data_base64}"}}
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
            model="hosted_vllm/qwen", # pass the vllm model name
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Summarize the following video"
                        },
                        {
                            "type": "video_url",
                            "video_url": {
                                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            }
                        }
                    ]
                }
            ],
            api_base="https://hosted-vllm-api.co")

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: my-model
      litellm_params:
        model: hosted_vllm/qwen  # add hosted_vllm/ prefix to route as OpenAI provider
        api_base: https://hosted-vllm-api.co      # add api base for OpenAI compatible provider
```

2. 啟動 proxy 

```bash
$ litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

```bash
curl -X POST http://0.0.0.0:4000/chat/completions \
-H "Authorization: Bearer sk-1234" \
-H "Content-Type: application/json" \
-d '{
    "model": "my-model",
    "messages": [
        {"role": "user", "content": 
            [
                {"type": "text", "text": "Summarize the following video"},
                {"type": "video_url", "video_url": {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}
            ]
        }
    ]
}'
```

</TabItem>
</Tabs>

</TabItem>
</Tabs>

## （已棄用）用於套件化 `vllm` 安裝 {#deprecated-for-packaged-vllm-installs}
### 使用 - `litellm.completion` {#using---litellmcompletion}

```
uv add litellm vllm
```
```python
import litellm 

response = litellm.completion(
            model="vllm/facebook/opt-125m", # add a vllm prefix so litellm knows the custom_llm_provider==vllm
            messages=messages,
            temperature=0.2,
            max_tokens=80)

print(response)
```


### 批次完成 {#batch-completion}

```python
from litellm import batch_completion

model_name = "facebook/opt-125m"
provider = "vllm"
messages = [[{"role": "user", "content": "Hey, how's it going"}] for _ in range(5)]

response_list = batch_completion(
            model=model_name, 
            custom_llm_provider=provider, # can easily switch to huggingface, replicate, together ai, sagemaker, etc.
            messages=messages,
            temperature=0.2,
            max_tokens=80,
        )
print(response_list)
```
### 提示詞樣板 {#prompt-templates}

對於具有特殊提示詞樣板的模型（例如 Llama2），我們會將提示詞格式化以符合其樣板。

**如果我們不支援您需要的模型怎麼辦？**
您也可以指定自己的自訂提示詞格式化方式，以防我們尚未涵蓋您的模型。 

**這是否表示您必須為所有模型指定提示詞？**
不用。預設情況下，我們會將您的訊息內容串接成提示詞（適用於 Bloom、T-5、Llama-2 base models 等預期格式）

**預設提示詞樣板**
```python
def default_pt(messages):
    return " ".join(message["content"] for message in messages)
```

[LiteLLM 中提示詞樣板運作方式的程式碼](https://github.com/BerriAI/litellm/blob/main/litellm/llms/prompt_templates/factory.py)

#### 我們已經有提示詞樣板的模型 {#models-we-already-have-prompt-templates-for}

| 模型名稱                           | Works for Models                  | 函式呼叫                                                                                                    |
|--------------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------|
| meta-llama/Llama-2-7b-chat           | All meta-llama llama2 chat models | `completion(model='vllm/meta-llama/Llama-2-7b', messages=messages, api_base="your_api_endpoint")`                |
| tiiuae/falcon-7b-instruct            | All falcon instruct models        | `completion(model='vllm/tiiuae/falcon-7b-instruct', messages=messages, api_base="your_api_endpoint")`            |
| mosaicml/mpt-7b-chat                 | All mpt chat models               | `completion(model='vllm/mosaicml/mpt-7b-chat', messages=messages, api_base="your_api_endpoint")`                 |
| codellama/CodeLlama-34b-Instruct-hf  | All codellama instruct models     | `completion(model='vllm/codellama/CodeLlama-34b-Instruct-hf', messages=messages, api_base="your_api_endpoint")`  |
| WizardLM/WizardCoder-Python-34B-V1.0 | All wizardcoder models            | `completion(model='vllm/WizardLM/WizardCoder-Python-34B-V1.0', messages=messages, api_base="your_api_endpoint")` |
| Phind/Phind-CodeLlama-34B-v2         | All phind-codellama models        | `completion(model='vllm/Phind/Phind-CodeLlama-34B-v2', messages=messages, api_base="your_api_endpoint")`         |

#### 自訂提示詞樣板 {#custom-prompt-templates}

```python 
# Create your own custom prompt template works 
litellm.register_prompt_template(
	model="togethercomputer/LLaMA-2-7B-32K",
	roles={
            "system": {
                "pre_message": "[INST] <<SYS>>\n",
                "post_message": "\n<</SYS>>\n [/INST]\n"
            },
            "user": { 
                "pre_message": "[INST] ",
                "post_message": " [/INST]\n"
            }, 
            "assistant": {
                "pre_message": "\n",
                "post_message": "\n",
            }
        } # tell LiteLLM how you want to map the openai messages to this model
)

def test_vllm_custom_model():
    model = "vllm/togethercomputer/LLaMA-2-7B-32K"
    response = completion(model=model, messages=messages)
    print(response['choices'][0]['message']['content'])
    return response

test_vllm_custom_model()
```

[實作程式碼](https://github.com/BerriAI/litellm/blob/6b3cb1898382f2e4e80fd372308ea232868c78d1/litellm/utils.py#L1414)
