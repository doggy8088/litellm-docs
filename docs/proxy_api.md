# 🔑 LiteLLM 金鑰（存取 Claude-2、Llama2-70b 等） {#-litellm-keys-access-claude-2-llama2-70b-etc}

如果您想新增對新 LLM 的支援並需要用於測試的存取權，請使用這個。LiteLLM 提供免費的 10 美元社群金鑰，可用於測試所有提供者： 

## 使用方式（社群金鑰） {#usage-community-key}

```python
import os
from litellm import completion

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["COHERE_API_KEY"] = "your-api-key"

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages)

# cohere call
response = completion("command-nightly", messages)
```

**需要專用金鑰嗎？**
請寄信給我們 @ krrish@berri.ai 

## LiteLLM 金鑰支援的模型 {#supported-models-for-litellm-key}
這些是目前可與 "sk-litellm-.." 金鑰搭配使用的模型。

如需可透過 LiteLLM 呼叫的模型／提供者完整清單，[請查看我們的提供者清單](./providers/) 或前往 [models.litellm.ai](https://models.litellm.ai/)

* OpenAI 模型 - [OpenAI 文件](./providers/openai.md)
    * gpt-4
    * gpt-3.5-turbo
    * gpt-3.5-turbo-16k
* Llama2 模型 - [TogetherAI 文件](./providers/togetherai.md)
    * togethercomputer/llama-2-70b-chat
    * togethercomputer/llama-2-70b
    * togethercomputer/LLaMA-2-7B-32K
    * togethercomputer/Llama-2-7B-32K-Instruct
    * togethercomputer/llama-2-7b
    * togethercomputer/CodeLlama-34b
    * WizardLM/WizardCoder-Python-34B-V1.0
    * NousResearch/Nous-Hermes-Llama2-13b
* Falcon 模型 - [TogetherAI 文件](./providers/togetherai.md)
    * togethercomputer/falcon-40b-instruct
    * togethercomputer/falcon-7b-instruct
* Jurassic/AI21 模型 - [AI21 文件](./providers/ai21.md)
    * j2-ultra
    * j2-mid
    * j2-light
* NLP Cloud 模型 - [NLPCloud 文件](./providers/nlp_cloud.md)
    * dolpin
    * chatdolphin 
* Anthropic 模型 - [Anthropic 文件](./providers/anthropic.md)
    * claude-2
    * claude-instant-v1

## 供 OpenInterpreter 使用 {#for-openinterpreter}
這最初是為 Open Interpreter 社群所建立的。如果您想在那裡使用這個功能，方法如下：  
**注意**：您需要複製並修改 Github repo，直到 [這個 PR 被合併。](https://github.com/KillianLucas/open-interpreter/pull/288)

```
git clone https://github.com/krrishdholakia/open-interpreter-litellm-fork
```
執行方式： 
```
uv build 

# call gpt-4 - always add 'litellm_proxy/' in front of the model name
uv run interpreter --model litellm_proxy/gpt-4

# call llama-70b - always add 'litellm_proxy/' in front of the model name
uv run interpreter --model litellm_proxy/togethercomputer/llama-2-70b-chat

# call claude-2 - always add 'litellm_proxy/' in front of the model name
uv run interpreter --model litellm_proxy/claude-2
```

就這樣！ 

現在您可以呼叫任何您想要的模型！

想要我們新增更多模型嗎？[請告訴我們！](https://github.com/BerriAI/litellm/issues/new/choose)
