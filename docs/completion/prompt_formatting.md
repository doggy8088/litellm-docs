# 提示格式化 {#prompt-formatting}

LiteLLM 會自動將 OpenAI ChatCompletions 提示格式轉換為其他模型。您也可以透過為模型設定自訂提示範本來控制這一點。

## 已儲存的範本 {#stored-templates}

提示範本僅適用於接受單一原始文字提示的提供者，例如 `ollama/`、`petals/`、`replicate/`、`sagemaker/` 和 `predibase/`。`huggingface/` 和 `together_ai/` 會呼叫這些提供者相容於 OpenAI 的 chat completions API，因此 LiteLLM 會原樣傳送您的 `messages`，由提供者套用模型自己的 chat 範本。下方儲存的範本以及使用 `register_prompt_template` 註冊的範本都不會用在它們上面

對於原始提示提供者，LiteLLM 支援 [Huggingface Chat Templates](https://huggingface.co/docs/transformers/main/chat_templating)，並會回退到 Hugging Face Hub 上模型註冊的 chat 範本（例如 [Mistral-7b](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1/blob/main/tokenizer_config.json#L32)）。在 `sagemaker/` 上，請傳入 `hf_model_name`，以選擇您端點基礎模型的範本。對於常見模型，這些範本會隨套件一併儲存

| 模型名稱 | 適用模型 |
| -------- | -------- |
| mistralai/Mistral-7B-Instruct-v0.1 | mistralai/Mistral-7B-Instruct-v0.1 |
| meta-llama/Llama-2-7b-chat | 所有 meta-llama llama2 chat 模型 |
| tiiuae/falcon-7b-instruct | 所有 falcon instruct 模型 |
| mosaicml/mpt-7b-chat | 所有 mpt chat 模型 |
| codellama/CodeLlama-34b-Instruct-hf | 所有 codellama instruct 模型 |
| WizardLM/WizardCoder-Python-34B-V1.0 | 所有 wizardcoder 模型 |
| Phind/Phind-CodeLlama-34B-v2 | 所有 phind-codellama 模型 |

[**跳至程式碼**](https://github.com/BerriAI/litellm/blob/main/litellm/litellm_core_utils/prompt_templates/factory.py)

## 自行格式化提示 {#format-prompt-yourself}

您也可以自行格式化提示。請將範本註冊在不含提供者前綴的模型名稱下。方法如下：

```python 
import litellm
from litellm import completion

# Create your own custom prompt template 
litellm.register_prompt_template(
	    model="llama2",
        initial_prompt_value="You are a good assistant", # [OPTIONAL]
	    roles={
            "system": {
                "pre_message": "[INST] <<SYS>>\n", # [OPTIONAL]
                "post_message": "\n<</SYS>>\n [/INST]\n" # [OPTIONAL]
            },
            "user": { 
                "pre_message": "[INST] ", # [OPTIONAL]
                "post_message": " [/INST]" # [OPTIONAL]
            }, 
            "assistant": {
                "pre_message": "\n", # [OPTIONAL]
                "post_message": "\n" # [OPTIONAL]
            }
        },
        final_prompt_value="Now answer as best you can:" # [OPTIONAL]
)

messages = [{"role": "user", "content": "Hey, how's it going?"}]
response = completion(model="ollama/llama2", messages=messages, api_base="http://localhost:11434")
print(response['choices'][0]['message']['content'])
```

這適用於原始提示提供者，例如 Ollama（`ollama/`，而非 `ollama_chat/`）、Petals、Replicate、SageMaker 和 Predibase。這對 `huggingface/` 或 `together_ai/` chat 模型沒有影響

其他提供者要不是有固定的提示範本（例如 Anthropic），就是接受 chat 訊息並在伺服器端進行格式化（例如 Hugging Face、Together AI）。如果有我們尚未涵蓋的提供者，請告訴我們！

## 所有提供者 {#all-providers}

以下是我們如何格式化所有提供者的程式碼。也請讓我們知道如何進一步改進這一點

| 提供者 | 模型名稱 | 程式碼 |
| -------- | -------- | -------- |
| Anthropic | `claude-instant-1`, `claude-instant-1.2`, `claude-2` | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/anthropic.py#L84)
| OpenAI Text Completion | `text-davinci-003`, `text-curie-001`, `text-babbage-001`, `text-ada-001`, `babbage-002`, `davinci-002`, | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/main.py#L442)
| Replicate | 所有以 `replicate/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/replicate.py#L180)
| Cohere | `command-nightly`, `command`, `command-light`, `command-medium-beta`, `command-xlarge-beta`, `command-r-plus` | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/cohere.py#L115)
| Huggingface | 所有以 `huggingface/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/huggingface_restapi.py#L186)
| OpenRouter | 所有以 `openrouter/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/main.py#L611)
| AI21 | `j2-mid`, `j2-light`, `j2-ultra` | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/ai21.py#L107)
| VertexAI | `text-bison`, `text-bison@001`, `chat-bison`, `chat-bison@001`, `chat-bison-32k`, `code-bison`, `code-bison@001`, `code-gecko@001`, `code-gecko@latest`, `codechat-bison`, `codechat-bison@001`, `codechat-bison-32k` | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/vertex_ai.py#L89)
| Bedrock | 所有以 `bedrock/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/bedrock.py#L183)
| Sagemaker | `sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b` | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/sagemaker.py#L89)
| TogetherAI | 所有以 `together_ai/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/together_ai.py#L101)
| AlephAlpha | 所有以 `aleph_alpha/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/aleph_alpha.py#L184)
| Palm | 所有以 `palm/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/palm.py#L95)
| NLP Cloud | 所有以 `palm/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/nlp_cloud.py#L120)
| Petals | 所有以 `petals/` 開頭的模型名稱 | [程式碼](https://github.com/BerriAI/litellm/blob/721564c63999a43f96ee9167d0530759d51f8d45/litellm/llms/petals.py#L87)
