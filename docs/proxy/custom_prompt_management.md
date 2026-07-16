import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自訂提示管理 {#custom-prompt-management}

使用自訂掛鉤將 LiteLLM 連接至您的提示管理系統。

## 總覽 {#overview}

<Image 
  img={require('../../img/custom_prompt_management.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

## 運作方式 {#how-it-works}

## 快速開始 {#quick-start}

### 1. 建立您的自訂提示管理器 {#1-create-your-custom-prompt-manager}

建立一個繼承自 `CustomPromptManagement` 的類別，以處理提示擷取與格式化：

**範例實作**

建立一個名為 `custom_prompt.py` 的新檔案並加入這段程式碼。這裡的關鍵方法是 `get_chat_completion_prompt`，您可以實作自訂邏輯，根據 `prompt_id` 和 `prompt_variables` 擷取並格式化提示。

```python
from typing import List, Tuple, Optional
from litellm.integrations.custom_prompt_management import CustomPromptManagement
from litellm.types.llms.openai import AllMessageValues
from litellm.types.utils import StandardCallbackDynamicParams

class MyCustomPromptManagement(CustomPromptManagement):
    def get_chat_completion_prompt(
        self,
        model: str,
        messages: List[AllMessageValues],
        non_default_params: dict,
        prompt_id: str,
        prompt_variables: Optional[dict],
        dynamic_callback_params: StandardCallbackDynamicParams,
    ) -> Tuple[str, List[AllMessageValues], dict]:
        """
        Retrieve and format prompts based on prompt_id.
        
        Returns:
            - model: The model to use
            - messages: The formatted messages
            - non_default_params: Optional parameters like temperature
        """
        # Example matching the diagram: Add system message for prompt_id "1234"
        if prompt_id == "1234":
            # Prepend system message while preserving existing messages
            new_messages = [
                {"role": "system", "content": "Be a good Bot!"},
            ] + messages
            return model, new_messages, non_default_params
        
        # Default: Return original messages if no prompt_id match
        return model, messages, non_default_params

prompt_management = MyCustomPromptManagement()
```

### 2. 在 LiteLLM 中設定您的提示管理器 `config.yaml` {#2-configure-your-prompt-manager-in-litellm-configyaml}

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: custom_prompt.prompt_management  # sets litellm.callbacks = [prompt_management]
```

### 3. 啟動 LiteLLM 閘道 {#3-start-litellm-gateway}

<Tabs>
<TabItem value="docker" label="Docker 執行">

將您的 `custom_logger.py` 掛載到 LiteLLM Docker 容器中。

```shell
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  --name my-app \
  -v $(pwd)/my_config.yaml:/app/config.yaml \
  -v $(pwd)/custom_logger.py:/app/custom_logger.py \
  my-app:latest \
  --config /app/config.yaml \
  --port 4000 \
  --detailed_debug \
```

</TabItem>

<TabItem value="py" label="litellm pip">

```shell
litellm --config config.yaml --detailed_debug
```

</TabItem>
</Tabs>

### 4. 測試您的自訂提示管理器 {#4-test-your-custom-prompt-manager}

當您傳入 `prompt_id="1234"` 時，自訂提示管理器會在您的對話中加入一則系統訊息 "Be a good Bot!"：

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gemini-1.5-pro",
    messages=[{"role": "user", "content": "hi"}],
    extra_body={
        "prompt_id": "1234"
    }
)

print(response.choices[0].message.content)
```
</TabItem>

<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage

chat = ChatOpenAI(
    model="gpt-4",
    openai_api_key="sk-1234",
    openai_api_base="http://0.0.0.0:4000",
    extra_body={
        "prompt_id": "1234"
    }
)

messages = []
response = chat(messages)

print(response.content)
```
</TabItem>

<TabItem value="curl" label="Curl">

```shell
curl -X POST http://0.0.0.0:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-1234" \
-d '{
    "model": "gemini-1.5-pro",
    "messages": [{"role": "user", "content": "hi"}],
    "prompt_id": "1234"
}'
```
</TabItem>
</Tabs>

### 直接使用 LiteLLM SDK {#using-the-litellm-sdk-directly}

如果您從 Python 腳本中呼叫 `litellm.completion()`（而不透過 proxy），請先註冊您的自訂提示管理器，再送出請求：

```python

import litellm
from custom_prompt import prompt_management

litellm.callbacks = [prompt_management]
litellm.use_litellm_proxy = True

response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "hi"}],
    prompt_id="1234",
    prompt_variables={"user_message": "hi"},
)
```

> **注意：** SDK 腳本中需要 `litellm.callbacks = [prompt_management]`（或等效的 `litellm.logging_callback_manager.add_litellm_callback(prompt_management)`）。proxy 會自動從 `config.yaml` 讀取 `callbacks`，但獨立腳本不會。

請求將從以下內容轉換為：
```json
{
    "model": "gemini-1.5-pro",
    "messages": [{"role": "user", "content": "hi"}],
    "prompt_id": "1234"
}
```

變為：
```json
{
    "model": "gemini-1.5-pro",
    "messages": [
        {"role": "system", "content": "Be a good Bot!"},
        {"role": "user", "content": "hi"}
    ]
}
```
