# 生成／Completion／Chat Completion 模型 {#generationcompletionchat-completion-models}

### OpenAI Chat Completion 模型 {#openai-chat-completion-models}

| 模型名稱       | 函式呼叫                          | 需要的 OS 變數                |
|------------------|----------------------------------------|--------------------------------------|
| gpt-3.5-turbo    | `completion('gpt-3.5-turbo', messages)` | `os.environ['OPENAI_API_KEY']`       |
| gpt-3.5-turbo-16k    | `completion('gpt-3.5-turbo-16k', messages)` | `os.environ['OPENAI_API_KEY']`       |
| gpt-3.5-turbo-16k-0613    | `completion('gpt-3.5-turbo-16k-0613', messages)` | `os.environ['OPENAI_API_KEY']`       |
| gpt-4            | `completion('gpt-4', messages)`         | `os.environ['OPENAI_API_KEY']`       |
| gpt-5-pro        | `completion('gpt-5-pro', messages)`    | `os.environ['OPENAI_API_KEY']`       |

## Azure OpenAI Chat Completion 模型 {#azure-openai-chat-completion-models}
對 Azure 請求，請將 `azure/` 前綴加到 `model`。如果您的 azure 部署名稱是 `gpt-v-2`，請將 `model` 設為 `azure/gpt-v-2`

| 模型名稱       | 函式呼叫                           | 需要的 OS 變數                     |
|------------------|-----------------------------------------|-------------------------------------------|
| gpt-3.5-turbo    | `completion('azure/gpt-3.5-turbo-deployment', messages)` | `os.environ['AZURE_API_KEY']`,`os.environ['AZURE_API_BASE']`,`os.environ['AZURE_API_VERSION']` |
| gpt-4            | `completion('azure/gpt-4-deployment', messages)`         | `os.environ['AZURE_API_KEY']`,`os.environ['AZURE_API_BASE']`,`os.environ['AZURE_API_VERSION']` |

### OpenAI 文字 Completion 模型 {#openai-text-completion-models}

| 模型名稱       | 函式呼叫                              | 需要的 OS 變數                |
|------------------|--------------------------------------------|--------------------------------------|
| text-davinci-003 | `completion('text-davinci-003', messages)` | `os.environ['OPENAI_API_KEY']`       |

### Cohere 模型 {#cohere-models}

| 模型名稱       | 函式呼叫                              | 需要的 OS 變數                |
|------------------|--------------------------------------------|--------------------------------------|
| command-nightly  | `completion('command-nightly', messages)` | `os.environ['COHERE_API_KEY']`       |

### Anthropic 模型 {#anthropic-models}

| 模型名稱       | 函式呼叫                              | 需要的 OS 變數                |
|------------------|--------------------------------------------|--------------------------------------|
| claude-instant-1  | `completion('claude-instant-1', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |
| claude-2  | `completion('claude-2', messages)` | `os.environ['ANTHROPIC_API_KEY']`       |

### Hugging Face Inference API {#hugging-face-inference-api}

所有 [`text2text-generation`](https://huggingface.co/models?library=transformers&pipeline_tag=text2text-generation&sort=downloads) 與 [`text-generation`](https://huggingface.co/models?library=transformers&pipeline_tag=text-generation&sort=downloads) 模型都受到 liteLLM 支援。您可以依照下列步驟使用 Hugging Face 上的任何文字模型：

* 從 Hugging Face 複製 `model repo` URL，並將其設為 completion 呼叫中的 `model` 參數。
* 將 `hugging_face` 參數設為 `True`。
* 請務必設定 hugging face API key

以下是一些受支援模型的範例：
**請注意，表格中提及的模型僅為範例，您可以依照上述步驟使用 Hugging Face 上可用的任何文字模型。**

| 模型名稱       | 函式呼叫                                                                       | 需要的 OS 變數                |
|------------------|-------------------------------------------------------------------------------------|--------------------------------------|
| [stabilityai/stablecode-completion-alpha-3b-4k](https://huggingface.co/stabilityai/stablecode-completion-alpha-3b-4k)  | `completion(model="stabilityai/stablecode-completion-alpha-3b-4k", messages=messages, hugging_face=True)` | `os.environ['HF_TOKEN']`       |
| [bigcode/starcoder](https://huggingface.co/bigcode/starcoder)                           | `completion(model="bigcode/starcoder", messages=messages, hugging_face=True)`          | `os.environ['HF_TOKEN']`       |
| [google/flan-t5-xxl](https://huggingface.co/google/flan-t5-xxl)                         | `completion(model="google/flan-t5-xxl", messages=messages, hugging_face=True)`         | `os.environ['HF_TOKEN']`       |
| [google/flan-t5-large](https://huggingface.co/google/flan-t5-large)                     | `completion(model="google/flan-t5-large", messages=messages, hugging_face=True)`       | `os.environ['HF_TOKEN']`       |

### OpenRouter Completion 模型 {#openrouter-completion-models}

來自 [OpenRouter](https://openrouter.ai/docs) 的所有文字模型都受到 liteLLM 支援。

| 模型名稱       | 函式呼叫                              | 需要的 OS 變數                |
|------------------|--------------------------------------------|--------------------------------------|
| openai/gpt-3.5-turbo | `completion('openai/gpt-3.5-turbo', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| openai/gpt-3.5-turbo-16k | `completion('openai/gpt-3.5-turbo-16k', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| openai/gpt-4 | `completion('openai/gpt-4', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| openai/gpt-4-32k | `completion('openai/gpt-4-32k', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| anthropic/claude-2 | `completion('anthropic/claude-2', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| anthropic/claude-instant-v1 | `completion('anthropic/claude-instant-v1', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| google/palm-2-chat-bison | `completion('google/palm-2-chat-bison', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| google/palm-2-codechat-bison | `completion('google/palm-2-codechat-bison', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| meta-llama/llama-2-13b-chat | `completion('meta-llama/llama-2-13b-chat', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |
| meta-llama/llama-2-70b-chat | `completion('meta-llama/llama-2-70b-chat', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OR_API_KEY']`       |

## Novita AI Completion 模型 {#novita-ai-completion-models}

🚨 LiteLLM 支援所有 Novita AI 模型，將 `model=novita/<your-novita-model>` 傳送以將其送往 Novita AI。查看所有 Novita AI 模型 [這裡](https://novita.ai/models/llm?utm_source=github_litellm&utm_medium=github_readme&utm_campaign=github_link)

| 模型名稱       | 函式呼叫                              | 需要的 OS 變數                |
|------------------|--------------------------------------------|--------------------------------------|
| novita/deepseek/deepseek-r1 | `completion('novita/deepseek/deepseek-r1', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/deepseek/deepseek_v3 | `completion('novita/deepseek/deepseek_v3', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.3-70b-instruct | `completion('novita/meta-llama/llama-3.3-70b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-8b-instruct | `completion('novita/meta-llama/llama-3.1-8b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-8b-instruct-max | `completion('novita/meta-llama/llama-3.1-8b-instruct-max', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-70b-instruct | `completion('novita/meta-llama/llama-3.1-70b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3-8b-instruct | `completion('novita/meta-llama/llama-3-8b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3-70b-instruct | `completion('novita/meta-llama/llama-3-70b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.2-1b-instruct | `completion('novita/meta-llama/llama-3.2-1b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.2-11b-vision-instruct | `completion('novita/meta-llama/llama-3.2-11b-vision-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.2-3b-instruct | `completion('novita/meta-llama/llama-3.2-3b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/gryphe/mythomax-l2-13b | `completion('novita/gryphe/mythomax-l2-13b', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/google/gemma-2-9b-it | `completion('novita/google/gemma-2-9b-it', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/mistralai/mistral-nemo | `completion('novita/mistralai/mistral-nemo', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/mistralai/mistral-7b-instruct | `completion('novita/mistralai/mistral-7b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen-2.5-72b-instruct | `completion('novita/qwen/qwen-2.5-72b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen-2-vl-72b-instruct | `completion('novita/qwen/qwen-2-vl-72b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
