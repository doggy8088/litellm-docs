import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenMeter {#openmeter}

[OpenMeter](https://openmeter.io/) 是一個適用於 AI/Cloud 應用程式的開源、依使用量計費解決方案。它與 Stripe 整合，方便進行計費。

<Image img={require('../../img/openmeter.png')} />

:::info
我們想了解如何讓回呼更好！歡迎與 LiteLLM 的 [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 見面，或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
::: 

## 快速開始 {#quick-start}
只需 2 行程式碼，即可透過 OpenMeter 立即記錄您 **跨所有提供者** 的回應

從 https://openmeter.cloud/meters 取得您的 OpenMeter API 金鑰

```python
litellm.callbacks = ["openmeter"] # logs cost + usage of successful calls to openmeter
```


<Tabs>
<TabItem value="sdk" label="SDK">

```python
# uv add openmeter 
import litellm
import os

# from https://openmeter.cloud
os.environ["OPENMETER_API_ENDPOINT"] = ""
os.environ["OPENMETER_API_KEY"] = ""

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set openmeter as a callback, litellm will send the data to openmeter
litellm.callbacks = ["openmeter"] 
 
# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 加入到 Config.yaml
```yaml
model_list:
- litellm_params:
    api_base: https://openai-function-calling-workers.tasslexyz.workers.dev/
    api_key: my-fake-key
    model: openai/my-fake-model
  model_name: fake-openai-endpoint

litellm_settings:
  callbacks: ["openmeter"] # 👈 KEY CHANGE
```

2. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

3. 測試看看！ 

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "fake-openai-endpoint",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ],
    }
'
```

</TabItem>
</Tabs>

<Image img={require('../../img/openmeter_img_2.png')} />
