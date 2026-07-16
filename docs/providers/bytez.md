import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bytez {#bytez}

LiteLLM 支援 [Bytez](https://www.bytez.com) 上的所有聊天模型！

這也代表支援多模態模型 🔥

支援的任務：`chat`、`image-text-to-text`、`audio-text-to-text`、`video-text-to-text`

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### API 金鑰 {#api-keys}

```py
import os
os.environ["BYTEZ_API_KEY"] = "YOUR_BYTEZ_KEY_GOES_HERE"
```

### 範例呼叫 {#example-call}

```py
from litellm import completion
import os
## set ENV variables
os.environ["BYTEZ_API_KEY"] = "YOUR_BYTEZ_KEY_GOES_HERE"

response = completion(
    model="bytez/google/gemma-3-4b-it",
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至您的 config.yaml

```yaml
model_list:
  - model_name: gemma-3
    litellm_params:
      model: bytez/google/gemma-3-4b-it
      api_key: os.environ/BYTEZ_API_KEY
```

2. 啟動 proxy

```bash
$ BYTEZ_API_KEY=YOUR_BYTEZ_API_KEY_HERE litellm --config /path/to/config.yaml --debug
```

3. 將請求送至 LiteLLM Proxy Server

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

```py
import openai
client = openai.OpenAI(
    api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
    base_url="http://0.0.0.0:4000" # litellm-proxy-base url
)

response = client.chat.completions.create(
    model="gemma-3",
    messages = [
      {
          "role": "system",
          "content": "Be a good human!"
      },
      {
          "role": "user",
          "content": "What do you know about earth?"
      }
  ]
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
    "model": "gemma-3",
    "messages": [
      {
          "role": "system",
          "content": "Be a good human!"
      },
      {
          "role": "user",
          "content": "What do you know about earth?"
      }
      ],
}'
```

  </TabItem>

  </Tabs>

</TabItem>

</Tabs>

## 自動處理 Prompt 模板 {#automatic-prompt-template-handling}

當您將 messages 清單送出給我們的 API 時，所有提示格式都會自動處理！

如果您希望使用自訂格式，請透過 [help@bytez.com](mailto:help@bytez.com) 或我們的 [Discord](https://discord.com/invite/Z723PfCFWf) 告訴我們，我們會設法提供！

## 傳遞額外參數 - max_tokens, temperature {#passing-additional-params---max_tokens-temperature}

請參閱所有 litellm.completion 支援的參數 [這裡](https://docs.litellm.ai/docs/completion/input)

```py
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["BYTEZ_API_KEY"] = "YOUR_BYTEZ_KEY_HERE"

# bytez gemma-3 call
response = completion(
    model="bytez/google/gemma-3-4b-it",
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    max_tokens=20,
    temperature=0.5
)
```

**proxy**

```yaml
model_list:
  - model_name: gemma-3
    litellm_params:
      model: bytez/google/gemma-3-4b-it
      api_key: os.environ/BYTEZ_API_KEY
      max_tokens: 20
      temperature: 0.5
```

## 傳遞 Bytez 特定參數 {#passing-bytez-specific-params}

我們也支援任何 huggingface 支援的 kwarg！（前提是模型支援它。）

範例 `repetition_penalty`

```py
# !uv add litellm
from litellm import completion
import os
## set ENV variables
os.environ["BYTEZ_API_KEY"] = "YOUR_BYTEZ_KEY_HERE"

# bytez llama3 call with additional params
response = completion(
    model="bytez/google/gemma-3-4b-it",
    messages = [{ "content": "Hello, how are you?","role": "user"}],
    repetition_penalty=1.2,
)
```

**proxy**

```yaml
model_list:
  - model_name: gemma-3
    litellm_params:
      model: bytez/google/gemma-3-4b-it
      api_key: os.environ/BYTEZ_API_KEY
      repetition_penalty: 1.2
```
