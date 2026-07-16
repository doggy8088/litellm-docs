# 提示格式化 {#prompt-formatting}

LiteLLM 會自動將 OpenAI ChatCompletions 提示格式轉換為其他模型。您也可以透過為模型設定自訂提示範本來控制這一點。 

## Huggingface 模型 {#huggingface-models}

LiteLLM 支援 [Huggingface Chat Templates](https://huggingface.co/docs/transformers/main/chat_templating)，並會自動檢查您的 huggingface 模型是否有已註冊的聊天範本（例如 [Mistral-7b](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1/blob/main/tokenizer_config.json#L32)）。

對於熱門模型（例如 meta-llama/llama2），我們已將其範本作為套件的一部分儲存。 

**已儲存的範本**

| 模型名稱 | 適用模型 | Completion 呼叫
| -------- | -------- | -------- |
| mistralai/Mistral-7B-Instruct-v0.1 | mistralai/Mistral-7B-Instruct-v0.1| `completion(model='huggingface/mistralai/Mistral-7B-Instruct-v0.1', messages=messages, api_base="your_api_endpoint")` |
| meta-llama/Llama-2-7b-chat | 所有 meta-llama llama2 聊天模型| `completion(model='huggingface/meta-llama/Llama-2-7b', messages=messages, api_base="your_api_endpoint")` |
| tiiuae/falcon-7b-instruct | 所有 falcon instruct 模型 | `completion(model='huggingface/tiiuae/falcon-7b-instruct', messages=messages, api_base="your_api_endpoint")` |
| mosaicml/mpt-7b-chat | 所有 mpt 聊天模型 | `completion(model='huggingface/mosaicml/mpt-7b-chat', messages=messages, api_base="your_api_endpoint")` |
| codellama/CodeLlama-34b-Instruct-hf | 所有 codellama instruct 模型 | `completion(model='huggingface/codellama/CodeLlama-34b-Instruct-hf', messages=messages, api_base="your_api_endpoint")` |
| WizardLM/WizardCoder-Python-34B-V1.0 | 所有 wizardcoder 模型 | `completion(model='huggingface/WizardLM/WizardCoder-Python-34B-V1.0', messages=messages, api_base="your_api_endpoint")` |
| Phind/Phind-CodeLlama-34B-v2 | 所有 phind-codellama 模型 | `completion(model='huggingface/Phind/Phind-CodeLlama-34B-v2', messages=messages, api_base="your_api_endpoint")` |

[**跳至程式碼**](https://github.com/BerriAI/litellm/blob/main/litellm/llms/prompt_templates/factory.py)

## 自行格式化提示 {#format-prompt-yourself}

您也可以自行格式化提示。方法如下： 

```python 
import litellm
# Create your own custom prompt template 
litellm.register_prompt_template(
	    model="togethercomputer/LLaMA-2-7B-32K",
        initial_prompt_value="You are a good assistant" # [OPTIONAL]
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
                "pre_message": "\n" # [OPTIONAL]
                "post_message": "\n" # [OPTIONAL]
            }
        }
        final_prompt_value="Now answer as best you can:" # [OPTIONAL]
)

def test_huggingface_custom_model():
    model = "huggingface/togethercomputer/LLaMA-2-7B-32K"
    response = completion(model=model, messages=messages, api_base="https://my-huggingface-endpoint")
    print(response['choices'][0]['message']['content'])
    return response

test_huggingface_custom_model()
```

目前支援 Huggingface、TogetherAI、Ollama 和 Petals。 

其他提供者不是有固定的提示範本（例如 Anthropic），就是會自行格式化（例如 Replicate）。如果我們漏掉了某個提供者的涵蓋範圍，請告訴我們！ 

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
