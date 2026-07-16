import Image from '@theme/IdealImage';

# 在 OpenAI 相容伺服器上自訂 Prompt 範本  {#customize-prompt-templates-on-openai-compatible-server}

**您將學到：** 如何在我們的 OpenAI 相容伺服器上設定自訂 prompt 範本。 
**如何做？** 我們會修改 CodeLlama 的 prompt 範本

## 步驟 1：啟動 OpenAI 相容伺服器 {#step-1-start-openai-compatible-server}
讓我們啟動一個本機 OpenAI 相容伺服器，來使用 Huggingface 的 [Text-Generation-Inference (TGI)](https://github.com/huggingface/text-generation-inference) 格式呼叫已部署的 `codellama/CodeLlama-34b-Instruct-hf` 模型。

```shell
$ litellm --model huggingface/codellama/CodeLlama-34b-Instruct-hf --api_base https://my-endpoint.com

# OpenAI compatible server running on http://0.0.0.0/8000
```

在新的 shell 中執行： 
```shell
$ litellm --test
``` 
這會將測試請求送到我們的端點。 

現在，讓我們看看送到 huggingface 的內容。執行： 
```shell
$ litellm --logs
```
這會回傳最新的記錄（預設情況下，記錄儲存在本機名為 'api_logs.json' 的檔案中）。

如您所見，這是送往 huggingface 的格式： 

<Image img={require('../../img/codellama_input.png')} />  

這遵循了我們針對 CodeLlama 的 [格式](https://github.com/BerriAI/litellm/blob/9932371f883c55fd0f3142f91d9c40279e8fe241/litellm/llms/prompt_templates/factory.py#L10)（基於 [Huggingface 的文件](https://huggingface.co/blog/codellama#conversational-instructions)）。 

但這缺少 BOS(`<s>`) 和 EOS(`</s>`) tokens。

因此，與其使用 LiteLLM 預設值，不如使用我們自己的 prompt 範本，讓這些 tokens 出現在訊息中。 

## 步驟 2：建立自訂 Prompt 範本 {#step-2-create-custom-prompt-template}

我們的 litellm 伺服器接受將 prompt 範本作為設定檔的一部分。您可以在此設定中儲存 API 金鑰、備援模型、prompt 範本等。[查看完整的設定檔](../proxy_server.md)

目前，我們先建立一個包含 prompt 範本的簡單設定檔，並讓伺服器知道它。 

建立一個名為 `litellm_config.toml` 的檔案：

```shell
$ touch litellm_config.toml
```
我們想要加入：
* 在每個 System 和 Human 訊息開頭加上 BOS (`<s>`) tokens
* 在每個 assistant 訊息結尾加上 EOS (`</s>`) tokens。 

讓我們在終端機中開啟檔案： 
```shell
$ vi litellm_config.toml
```

貼上我們的 prompt 範本：
```shell
[model."huggingface/codellama/CodeLlama-34b-Instruct-hf".prompt_template] 
MODEL_SYSTEM_MESSAGE_START_TOKEN = "<s>[INST]  <<SYS>>\n]" 
MODEL_SYSTEM_MESSAGE_END_TOKEN = "\n<</SYS>>\n [/INST]\n"

MODEL_USER_MESSAGE_START_TOKEN = "<s>[INST] " 
MODEL_USER_MESSAGE_END_TOKEN = " [/INST]\n"

MODEL_ASSISTANT_MESSAGE_START_TOKEN = ""
MODEL_ASSISTANT_MESSAGE_END_TOKEN = "</s>"
```

儲存檔案（在 vim 中）： 
```shell
:wq
```

## 步驟 3：執行新範本 {#step-3-run-new-template}

讓我們執行以下指令，將自訂範本儲存到我們的 litellm 伺服器：
```shell
$ litellm --config -f ./litellm_config.toml 
```
LiteLLM 會在它的套件中儲存這個檔案的副本，因此可以在重新啟動之間保留這些設定。

重新啟動伺服器： 
```shell
$ litellm --model huggingface/codellama/CodeLlama-34b-Instruct-hf --api_base https://my-endpoint.com
```

在新的 shell 中執行： 
```shell
$ litellm --test
``` 

看看我們送往 Huggingface 的新輸入 prompt！ 

<Image img={require('../../img/codellama_formatted_input.png')} /> 

恭喜 🎉
