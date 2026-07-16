import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# [舊版 Proxy 👉 [新版 proxy 在這裡](./simple_proxy)] 本機 LiteLLM Proxy Server {#old-proxy--new-proxy-heresimple_proxy-local-litellm-proxy-server}

一個快速且輕量、相容 OpenAI 的伺服器，可呼叫 100+ 個 LLM API。 

:::info

文件已過時。新文件 👉 [這裡](./simple_proxy)

:::

## 使用方式  {#usage}
```shell
uv tool install 'litellm[proxy]'
```
```shell 
$ litellm --model ollama/codellama 

#INFO: Ollama running on http://0.0.0.0:8000
```

### 測試 {#test}
在新的 shell 中執行： 
```shell
$ litellm --test
``` 

### 取代 openai base {#replace-openai-base}

```python
import openai 

openai.api_base = "http://0.0.0.0:8000"

print(openai.ChatCompletion.create(model="test", messages=[{"role":"user", "content":"Hey!"}]))
```

#### 其他支援的模型： {#other-supported-models}
<Tabs>
<TabItem value="vllm-local" label="VLLM">
假設您正在本機執行 vllm

```shell
$ litellm --model vllm/facebook/opt-125m
```
</TabItem>
<TabItem value="openai-proxy" label="OpenAI Compatible Server">

```shell
$ litellm --model openai/<model_name> --api_base <your-api-base>
```
</TabItem>
<TabItem value="huggingface" label="Huggingface">

```shell
$ export HUGGINGFACE_API_KEY=my-api-key #[OPTIONAL]
$ litellm --model claude-instant-1
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```shell
$ export ANTHROPIC_API_KEY=my-api-key
$ litellm --model claude-instant-1
```

</TabItem>

<TabItem value="together_ai" label="TogetherAI">

```shell
$ export TOGETHERAI_API_KEY=my-api-key
$ litellm --model together_ai/lmsys/vicuna-13b-v1.5-16k
```

</TabItem>

<TabItem value="replicate" label="Replicate">

```shell
$ export REPLICATE_API_KEY=my-api-key
$ litellm \
  --model replicate/meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3
```

</TabItem>

<TabItem value="petals" label="Petals">

```shell
$ litellm --model petals/meta-llama/Llama-2-70b-chat-hf
```

</TabItem>

<TabItem value="palm" label="Palm">

```shell
$ export PALM_API_KEY=my-palm-key
$ litellm --model palm/chat-bison
```

</TabItem>

<TabItem value="azure" label="Azure OpenAI">

```shell
$ export AZURE_API_KEY=my-api-key
$ export AZURE_API_BASE=my-api-base

$ litellm --model azure/my-deployment-name
```

</TabItem>

<TabItem value="ai21" label="AI21">

```shell
$ export AI21_API_KEY=my-api-key
$ litellm --model j2-light
```

</TabItem>

<TabItem value="cohere" label="Cohere">

```shell
$ export COHERE_API_KEY=my-api-key
$ litellm --model command-nightly
```

</TabItem>

</Tabs>

### 教學：搭配 Multiple LLMs + LibreChat/Chatbot-UI/Auto-Gen/ChatDev/Langroid 等使用 {#tutorial-use-with-multiple-llms--librechatchatbot-uiauto-genchatdevlangroidetc}
<Tabs>
<TabItem value="multiple-LLMs" label="Multiple LLMs">

取代 openai base： 
```python
import openai 

openai.api_key = "any-string-here"
openai.api_base = "http://0.0.0.0:8080" # your proxy url

# call openai
response = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hey"}])

print(response)

# call cohere
response = openai.ChatCompletion.create(model="command-nightly", messages=[{"role": "user", "content": "Hey"}])

print(response)
```
</TabItem>
<TabItem value="librechat" label="LibreChat">

#### 1. 複製儲存庫 {#1-clone-the-repo}

```shell
git clone https://github.com/danny-avila/LibreChat.git
```


#### 2. 修改 `docker-compose.yml` {#2-modify-docker-composeyml}
```yaml
OPENAI_REVERSE_PROXY=http://host.docker.internal:8000/v1/chat/completions
```

#### 3. 將假的 OpenAI key 存入 `.env` {#3-save-fake-openai-key-in-env}
```env
OPENAI_API_KEY=sk-1234
```

#### 4. 執行 LibreChat：  {#4-run-librechat}
```shell
docker compose up
```
</TabItem>
<TabItem value="smart-chatbot-ui" label="SmartChatbotUI">

#### 1. 複製儲存庫 {#1-clone-the-repo-1}
```shell
git clone https://github.com/dotneet/smart-chatbot-ui.git
```

#### 2. 安裝相依性 {#2-install-dependencies}
```shell
npm i
```

#### 3. 建立您的環境 {#3-create-your-env}
```shell
cp .env.local.example .env.local
```

#### 4. 設定 API 金鑰與 Base {#4-set-the-api-key-and-base}
```env
OPENAI_API_KEY="my-fake-key"
OPENAI_API_HOST="http://0.0.0.0:8000
```

#### 5. 使用 docker compose 執行 {#5-run-with-docker-compose}
```shell
docker compose up -d
```
</TabItem>
<TabItem value="autogen" label="AutoGen">

```python
uv add pyautogen
```

```python
from autogen import AssistantAgent, UserProxyAgent, oai
config_list=[
    {
        "model": "my-fake-model",
        "api_base": "http://0.0.0.0:8000",  #litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL", # just a placeholder
    }
]

response = oai.Completion.create(config_list=config_list, prompt="Hi")
print(response) # works fine

llm_config={
    "config_list": config_list,
}

assistant = AssistantAgent("assistant", llm_config=llm_config)
user_proxy = UserProxyAgent("user_proxy")
user_proxy.initiate_chat(assistant, message="Plot a chart of META and TESLA stock price change YTD.", config_list=config_list)
```

本教學感謝 [@victordibia](https://github.com/microsoft/autogen/issues/45#issuecomment-1749921972)。
</TabItem>
<TabItem value="multi-LLM AutoGen" label="AutoGen Multi-LLM">

```python
from autogen import AssistantAgent, GroupChatManager, UserProxyAgent
from autogen.agentchat import GroupChat
config_list = [
    {
        "model": "ollama/mistralorca",
        "api_base": "http://0.0.0.0:8000",  # litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL",  # just a placeholder
    }
]
llm_config = {"config_list": config_list, "seed": 42}

code_config_list = [
    {
        "model": "ollama/phind-code",
        "api_base": "http://0.0.0.0:8000",  # litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL",  # just a placeholder
    }
]

code_config = {"config_list": code_config_list, "seed": 42}

admin = UserProxyAgent(
    name="Admin",
    system_message="A human admin. Interact with the planner to discuss the plan. Plan execution needs to be approved by this admin.",
    llm_config=llm_config,
    code_execution_config=False,
)


engineer = AssistantAgent(
    name="Engineer",
    llm_config=code_config,
    system_message="""Engineer. You follow an approved plan. You write python/shell code to solve tasks. Wrap the code in a code block that specifies the script type. The user can't modify your code. So do not suggest incomplete code which requires others to modify. Don't use a code block if it's not intended to be executed by the executor.
Don't include multiple code blocks in one response. Do not ask others to copy and paste the result. Check the execution result returned by the executor.
If the result indicates there is an error, fix the error and output the code again. Suggest the full code instead of partial code or code changes. If the error can't be fixed or if the task is not solved even after the code is executed successfully, analyze the problem, revisit your assumption, collect additional info you need, and think of a different approach to try.
""",
)
planner = AssistantAgent(
    name="Planner",
    system_message="""Planner. Suggest a plan. Revise the plan based on feedback from admin and critic, until admin approval.
The plan may involve an engineer who can write code and a scientist who doesn't write code.
Explain the plan first. Be clear which step is performed by an engineer, and which step is performed by a scientist.
""",
    llm_config=llm_config,
)
executor = UserProxyAgent(
    name="Executor",
    system_message="Executor. Execute the code written by the engineer and report the result.",
    human_input_mode="NEVER",
    llm_config=llm_config,
    code_execution_config={"last_n_messages": 3, "work_dir": "paper"},
)
critic = AssistantAgent(
    name="Critic",
    system_message="Critic. Double check plan, claims, code from other agents and provide feedback. Check whether the plan includes adding verifiable info such as source URL.",
    llm_config=llm_config,
)
groupchat = GroupChat(
    agents=[admin, engineer, planner, executor, critic],
    messages=[],
    max_round=50,
)
manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)


admin.initiate_chat(
    manager,
    message="""
""",
)
```

本教學感謝 [@Nathan](https://gist.github.com/CUexter)。
</TabItem>
<TabItem value="chatDev" label="ChatDev">

### 設定 ChatDev ([文件](https://github.com/OpenBMB/ChatDev#%EF%B8%8F-quickstart)) {#setup-chatdev-docshttpsgithubcomopenbmbchatdevefb88f-quickstart}
```shell
git clone https://github.com/OpenBMB/ChatDev.git
cd ChatDev
conda create -n ChatDev_conda_env python=3.9 -y
conda activate ChatDev_conda_env
uv add -r requirements.txt
```
### 使用 Proxy 執行 ChatDev {#run-chatdev-w-proxy}
```shell 
export OPENAI_API_KEY="sk-1234"
```

```shell 
export OPENAI_BASE_URL="http://0.0.0.0:8000"
```
```shell
python3 run.py --task "a script that says hello world" --name "hello world"
```
</TabItem>
<TabItem value="langroid" label="Langroid">

```python
uv add langroid
```

```python
from langroid.language_models.openai_gpt import OpenAIGPTConfig, OpenAIGPT

# configure the LLM
my_llm_config = OpenAIGPTConfig(
    # where proxy server is listening 
    api_base="http://0.0.0.0:8000", 
)

# create llm, one-off interaction
llm = OpenAIGPT(my_llm_config)
response = mdl.chat("What is the capital of China?", max_tokens=50)

# Create an Agent with this LLM, wrap it in a Task, and 
# run it as an interactive chat app:
from langroid.agent.base import ChatAgent, ChatAgentConfig
from langroid.agent.task import Task

agent_config = ChatAgentConfig(llm=my_llm_config, name="my-llm-agent")
agent = ChatAgent(agent_config)

task = Task(agent, name="my-llm-task")
task.run() 
```

本教學感謝 [@pchalasani](https://github.com/pchalasani) 與 [Langroid](https://github.com/langroid/langroid)。
</TabItem>
</Tabs>

## 本機 Proxy {#local-proxy}

以下說明如何使用本機 proxy，來測試不同 github repo 的 codellama/mistral 等模型 

```shell
uv add litellm
```

```shell
$ ollama pull codellama # OUR Local CodeLlama  

$ litellm --model ollama/codellama --temperature 0.3 --max_tokens 2048
```

### 教學：搭配 Multiple LLMs + Aider/AutoGen/Langroid 等使用 {#tutorial-use-with-multiple-llms--aiderautogenlangroidetc}
<Tabs>
<TabItem value="multiple-LLMs" label="Multiple LLMs">

```shell 
$ litellm

#INFO: litellm proxy running on http://0.0.0.0:8000
```

#### 將請求送至您的 proxy {#send-a-request-to-your-proxy}
```python
import openai 

openai.api_key = "any-string-here"
openai.api_base = "http://0.0.0.0:8080" # your proxy url

# call gpt-3.5-turbo
response = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hey"}])

print(response)

# call ollama/llama2
response = openai.ChatCompletion.create(model="ollama/llama2", messages=[{"role": "user", "content": "Hey"}])

print(response)
```

</TabItem>
<TabItem value="continue-dev" label="ContinueDev">

Continue-Dev 將 ChatGPT 帶入 VSCode。請參閱[這裡](https://continue.dev/docs/quickstart)的安裝方式。

在 [config.py](https://continue.dev/docs/reference/Models/openai) 中，將其設為您的預設模型。
```python
  default=OpenAI(
      api_key="IGNORED",
      model="fake-model-name",
      context_length=2048, # customize if needed for your model
      api_base="http://localhost:8000" # your proxy server url
  ),
```

本教學感謝 [@vividfog](https://github.com/ollama/ollama/issues/305#issuecomment-1751848077)。 
</TabItem>
<TabItem value="aider" label="Aider">

```shell
$ uv add aider 

$ aider --openai-api-base http://0.0.0.0:8000 --openai-api-key fake-key
```
</TabItem>
<TabItem value="autogen" label="AutoGen">

```python
uv add pyautogen
```

```python
from autogen import AssistantAgent, UserProxyAgent, oai
config_list=[
    {
        "model": "my-fake-model",
        "api_base": "http://localhost:8000",  #litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL", # just a placeholder
    }
]

response = oai.Completion.create(config_list=config_list, prompt="Hi")
print(response) # works fine

llm_config={
    "config_list": config_list,
}

assistant = AssistantAgent("assistant", llm_config=llm_config)
user_proxy = UserProxyAgent("user_proxy")
user_proxy.initiate_chat(assistant, message="Plot a chart of META and TESLA stock price change YTD.", config_list=config_list)
```

本教學感謝 [@victordibia](https://github.com/microsoft/autogen/issues/45#issuecomment-1749921972)。
</TabItem>
<TabItem value="multi-LLM AutoGen" label="AutoGen Multi-LLM">

```python
from autogen import AssistantAgent, GroupChatManager, UserProxyAgent
from autogen.agentchat import GroupChat
config_list = [
    {
        "model": "ollama/mistralorca",
        "api_base": "http://localhost:8000",  # litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL",  # just a placeholder
    }
]
llm_config = {"config_list": config_list, "seed": 42}

code_config_list = [
    {
        "model": "ollama/phind-code",
        "api_base": "http://localhost:8000",  # litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL",  # just a placeholder
    }
]

code_config = {"config_list": code_config_list, "seed": 42}

admin = UserProxyAgent(
    name="Admin",
    system_message="A human admin. Interact with the planner to discuss the plan. Plan execution needs to be approved by this admin.",
    llm_config=llm_config,
    code_execution_config=False,
)


engineer = AssistantAgent(
    name="Engineer",
    llm_config=code_config,
    system_message="""Engineer. You follow an approved plan. You write python/shell code to solve tasks. Wrap the code in a code block that specifies the script type. The user can't modify your code. So do not suggest incomplete code which requires others to modify. Don't use a code block if it's not intended to be executed by the executor.
Don't include multiple code blocks in one response. Do not ask others to copy and paste the result. Check the execution result returned by the executor.
If the result indicates there is an error, fix the error and output the code again. Suggest the full code instead of partial code or code changes. If the error can't be fixed or if the task is not solved even after the code is executed successfully, analyze the problem, revisit your assumption, collect additional info you need, and think of a different approach to try.
""",
)
planner = AssistantAgent(
    name="Planner",
    system_message="""Planner. Suggest a plan. Revise the plan based on feedback from admin and critic, until admin approval.
The plan may involve an engineer who can write code and a scientist who doesn't write code.
Explain the plan first. Be clear which step is performed by an engineer, and which step is performed by a scientist.
""",
    llm_config=llm_config,
)
executor = UserProxyAgent(
    name="Executor",
    system_message="Executor. Execute the code written by the engineer and report the result.",
    human_input_mode="NEVER",
    llm_config=llm_config,
    code_execution_config={"last_n_messages": 3, "work_dir": "paper"},
)
critic = AssistantAgent(
    name="Critic",
    system_message="Critic. Double check plan, claims, code from other agents and provide feedback. Check whether the plan includes adding verifiable info such as source URL.",
    llm_config=llm_config,
)
groupchat = GroupChat(
    agents=[admin, engineer, planner, executor, critic],
    messages=[],
    max_round=50,
)
manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)


admin.initiate_chat(
    manager,
    message="""
""",
)
```

本教學感謝 [@Nathan](https://gist.github.com/CUexter)。
</TabItem>
<TabItem value="chatDev" label="ChatDev">

### 設定 ChatDev ([文件](https://github.com/OpenBMB/ChatDev#%EF%B8%8F-quickstart)) {#setup-chatdev-docshttpsgithubcomopenbmbchatdevefb88f-quickstart-1}
```shell
git clone https://github.com/OpenBMB/ChatDev.git
cd ChatDev
conda create -n ChatDev_conda_env python=3.9 -y
conda activate ChatDev_conda_env
uv add -r requirements.txt
```
### 使用 Proxy 執行 ChatDev {#run-chatdev-w-proxy-1}
```shell 
export OPENAI_API_KEY="sk-1234"
```

```shell 
export OPENAI_BASE_URL="http://0.0.0.0:8000"
```
```shell
python3 run.py --task "a script that says hello world" --name "hello world"
```
</TabItem>
<TabItem value="langroid" label="Langroid">

```python
uv add langroid
```

```python
from langroid.language_models.openai_gpt import OpenAIGPTConfig, OpenAIGPT

# configure the LLM
my_llm_config = OpenAIGPTConfig(
    #format: "local/[URL where LiteLLM proxy is listening]
    chat_model="local/localhost:8000", 
    chat_context_length=2048,  # adjust based on model
)

# create llm, one-off interaction
llm = OpenAIGPT(my_llm_config)
response = mdl.chat("What is the capital of China?", max_tokens=50)

# Create an Agent with this LLM, wrap it in a Task, and 
# run it as an interactive chat app:
from langroid.agent.base import ChatAgent, ChatAgentConfig
from langroid.agent.task import Task

agent_config = ChatAgentConfig(llm=my_llm_config, name="my-llm-agent")
agent = ChatAgent(agent_config)

task = Task(agent, name="my-llm-task")
task.run() 
```

本教學感謝 [@pchalasani](https://github.com/pchalasani) 與 [Langroid](https://github.com/langroid/langroid)。
</TabItem>
<TabItem value="gpt-pilot" label="GPT-Pilot">
GPT-Pilot 協助您使用 AI 代理程式建立應用程式。[更多資訊](https://github.com/Pythagora-io/gpt-pilot)

在您的 .env 中，將 openai endpoint 設為您的本機伺服器。 

```
OPENAI_ENDPOINT=http://0.0.0.0:8000
OPENAI_API_KEY=my-fake-key
```
</TabItem>
<TabItem value="guidance" label="guidance">
一種用於控制大型語言模型的 guidance language。
https://github.com/guidance-ai/guidance

**注意：** Guidance 會傳送額外參數，例如 `stop_sequences`，若模型不支援，可能會導致某些模型失敗。 

**修正方式**：使用 `--drop_params` 旗標啟動您的 proxy

```shell
litellm --model ollama/codellama --temperature 0.3 --max_tokens 2048 --drop_params
```

```python
import guidance

# set api_base to your proxy
# set api_key to anything
gpt4 = guidance.llms.OpenAI("gpt-4", api_base="http://0.0.0.0:8000", api_key="anything")

experts = guidance('''
{{#system~}}
You are a helpful and terse assistant.
{{~/system}}

{{#user~}}
I want a response to the following question:
{{query}}
Name 3 world-class experts (past or present) who would be great at answering this?
Don't answer the question yet.
{{~/user}}

{{#assistant~}}
{{gen 'expert_names' temperature=0 max_tokens=300}}
{{~/assistant}}
''', llm=gpt4)

result = experts(query='How can I be more productive?')
print(result)
```
</TabItem>
</Tabs>

:::note
**貢獻** 您有在專案中使用這個伺服器嗎？請在[這裡！](https://github.com/BerriAI/litellm)貢獻您的教學

::: 

## 進階 {#advanced}

### 記錄 {#logs}

```shell
$ litellm --logs
```

這會回傳最新一筆記錄（送往 LLM API 的請求 + 收到的回應）。

所有記錄都會儲存在目前目錄中一個名為 `api_logs.json` 的檔案裡。 

### 設定 Proxy {#configure-proxy}

如果您需要： 
* 儲存 API 金鑰 
* 設定 litellm 參數（例如：捨棄未對應的參數、設定 fallback models 等）
* 設定特定模型參數（max tokens、temperature、api base、prompt template）

您可以只為該 session 設定這些內容（透過 cli），或透過設定檔讓這些設定在重新啟動後仍然保留。

#### 儲存 API 金鑰  {#save-api-keys}
```shell 
$ litellm --api_key OPENAI_API_KEY=sk-...
```
LiteLLM 會將其儲存到本機儲存的設定檔中，並在各次 session 之間保留。 

LiteLLM Proxy 支援所有 litellm 支援的 api keys。若要為特定提供者新增金鑰，請查看此清單：

<Tabs>
<TabItem value="huggingface" label="Huggingface">

```shell
$ litellm --add_key HUGGINGFACE_API_KEY=my-api-key #[OPTIONAL]
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```shell
$ litellm --add_key ANTHROPIC_API_KEY=my-api-key
```

</TabItem>
<TabItem value="perplexity" label="PerplexityAI">

```shell
$ litellm --add_key PERPLEXITYAI_API_KEY=my-api-key
```

</TabItem>

<TabItem value="together_ai" label="TogetherAI">

```shell
$ litellm --add_key TOGETHERAI_API_KEY=my-api-key
```

</TabItem>

<TabItem value="replicate" label="Replicate">

```shell
$ litellm --add_key REPLICATE_API_KEY=my-api-key
```

</TabItem>

<TabItem value="bedrock" label="Bedrock">

```shell
$ litellm --add_key AWS_ACCESS_KEY_ID=my-key-id
$ litellm --add_key AWS_SECRET_ACCESS_KEY=my-secret-access-key
```

</TabItem>

<TabItem value="palm" label="Palm">

```shell
$ litellm --add_key PALM_API_KEY=my-palm-key
```

</TabItem>

<TabItem value="azure" label="Azure OpenAI">

```shell
$ litellm --add_key AZURE_API_KEY=my-api-key
$ litellm --add_key AZURE_API_BASE=my-api-base

```

</TabItem>

<TabItem value="ai21" label="AI21">

```shell
$ litellm --add_key AI21_API_KEY=my-api-key
```

</TabItem>

<TabItem value="cohere" label="Cohere">

```shell
$ litellm --add_key COHERE_API_KEY=my-api-key
```

</TabItem>

</Tabs>

例如：設定 api base、max tokens 和 temperature。 

**針對該 session**： 
```shell
litellm --model ollama/llama2 \
  --api_base http://localhost:11434 \
  --max_tokens 250 \
  --temperature 0.5

# OpenAI-compatible server running on http://0.0.0.0:8000
```

### 效能 {#performance}

我們使用 [wrk](https://github.com/wg/wrk) 對 FastAPI server 進行了 500,000 個 HTTP 連線、持續 1 分鐘的負載測試。

結果如下： 

```shell
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   156.38ms   25.52ms 361.91ms   84.73%
    Req/Sec    13.61      5.13    40.00     57.50%
  383625 requests in 1.00m, 391.10MB read
  Socket errors: connect 0, read 1632, write 1, timeout 0
```


## 支援／與創辦人聯絡 {#support-talk-with-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
