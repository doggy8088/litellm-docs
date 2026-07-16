import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LangSmith {#langsmith}

一站式開發者平台，涵蓋應用程式生命週期的每個步驟
https://smith.langchain.com/

<Image img={require('../../img/langsmith_new.png')} />

:::info
我們想了解如何讓回呼變得更好！歡迎認識 LiteLLM 的 [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
::: 

## 前置需求 {#pre-requisites}
```shell
uv add litellm
```

## 快速開始 {#quick-start}
只要 2 行程式碼，就能立即透過 Langsmith 記錄您的回應，**適用於所有提供者**

<Tabs>
<TabItem value="python" label="SDK">

```python
litellm.callbacks = ["langsmith"]
```

```python
import litellm
import os

os.environ["LANGSMITH_API_KEY"] = ""
os.environ["LANGSMITH_PROJECT"] = "" # defaults to litellm-completion
os.environ["LANGSMITH_DEFAULT_RUN_NAME"] = "" # defaults to LLMRun
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set langsmith as a callback, litellm will send the data to langsmith
litellm.callbacks = ["langsmith"] 
 
# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["langsmith"]
```

2. 啟動 LiteLLM Proxy
```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！
```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-eWkpOhYaHiuIZV-29JDeTQ' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how are you?"
    }
  ],
  "max_completion_tokens": 250
}'
```
</TabItem>
</Tabs>

## 進階 {#advanced}

### 本機測試 - 控制批次大小 {#local-testing---control-batch-size}

設定 Langsmith 一次處理的批次大小，預設為 512。 

在本機測試時設定 `langsmith_batch_size=1`，以便更快看到記錄送達。

<Tabs>
<TabItem value="python" label="SDK">

```python
import litellm
import os

os.environ["LANGSMITH_API_KEY"] = ""
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set langsmith as a callback, litellm will send the data to langsmith
litellm.callbacks = ["langsmith"] 
litellm.langsmith_batch_size = 1 # 👈 KEY CHANGE
 
response = litellm.completion(
    model="gpt-3.5-turbo",
     messages=[
        {"role": "user", "content": "Hi 👋 - i'm openai"}
    ]
)
print(response)
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  langsmith_batch_size: 1
  callbacks: ["langsmith"]
```

2. 啟動 LiteLLM Proxy
```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！
```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-eWkpOhYaHiuIZV-29JDeTQ' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how are you?"
    }
  ],
  "max_completion_tokens": 250
}'
```


</TabItem>
</Tabs>

### 設定 Langsmith 欄位 {#set-langsmith-fields}

```python
import litellm
import os

os.environ["LANGSMITH_API_KEY"] = ""
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set langsmith as a callback, litellm will send the data to langsmith
litellm.success_callback = ["langsmith"] 
 
response = litellm.completion(
    model="gpt-3.5-turbo",
     messages=[
        {"role": "user", "content": "Hi 👋 - i'm openai"}
    ],
    metadata={
        "run_name": "litellmRUN",                                   # langsmith run name
        "project_name": "litellm-completion",                       # langsmith project name
        "run_id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",           # langsmith run id
        "parent_run_id": "f8faf8c1-9778-49a4-9004-628cdb0047e5",    # langsmith run parent run id
        "trace_id": "df570c03-5a03-4cea-8df0-c162d05127ac",         # langsmith run trace id
        "session_id": "1ffd059c-17ea-40a8-8aef-70fd0307db82",       # langsmith run session id
        "tags": ["model1", "prod-2"],                               # langsmith run tags
        "metadata": {                                               # langsmith run metadata
            "key1": "value1"
        },
        "dotted_order": "20240429T004912090000Z497f6eca-6276-4993-bfeb-53cbbbba6f08"
    }
)
print(response)
```

### 讓 LiteLLM Proxy 使用自訂 `LANGSMITH_BASE_URL` {#make-litellm-proxy-use-custom-langsmith_base_url}

如果您使用自訂的 LangSmith 執行個體，可以設定
`LANGSMITH_BASE_URL` 環境變數，指向您的執行個體。
例如，您可以透過這個設定，讓 LiteLLM Proxy 將記錄送到本機的 LangSmith 執行個體：

```yaml
litellm_settings:
  success_callback: ["langsmith"]

environment_variables:
  LANGSMITH_BASE_URL: "http://localhost:1984"
  LANGSMITH_PROJECT: "litellm-proxy"
```

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
