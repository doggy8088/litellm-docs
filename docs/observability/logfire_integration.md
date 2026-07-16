import Image from '@theme/IdealImage';

# Logfire {#logfire}

Logfire 是適用於 LLM 應用程式的開源可觀測性與分析工具
提供詳細的正式環境追蹤與對品質、成本和延遲的細緻檢視

<Image img={require('../../img/logfire.png')} />

:::info
我們希望了解如何讓回呼更好！歡迎認識 LiteLLM 的 [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

請確保您已安裝下列套件以使用此整合

```shell
uv add litellm

uv add opentelemetry-api==1.25.0
uv add opentelemetry-sdk==1.25.0
uv add opentelemetry-exporter-otlp==1.25.0
```

## 快速開始 {#quick-start}

請從 [Logfire](https://logfire.pydantic.dev/) 取得您的 Logfire token

```python
litellm.callbacks = ["logfire"]
```

```python
# uv add logfire
import litellm
import os

# from https://logfire.pydantic.dev/
os.environ["LOGFIRE_TOKEN"] = ""

# Optionally customize the base url
# from https://logfire.pydantic.dev/
os.environ["LOGFIRE_BASE_URL"] = ""

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set logfire as a callback, litellm will send the data to logfire
litellm.success_callback = ["logfire"]

# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

## 支援與創辦人交流 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
