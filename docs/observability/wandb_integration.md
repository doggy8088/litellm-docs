import Image from '@theme/IdealImage';

# Weights & Biases {#weights--biases}

:::tip

這是由社群維護的文件，如果您遇到 bug，請提出 issue
https://github.com/BerriAI/litellm

:::

Weights & Biases 協助 AI 開發者更快打造更好的模型 https://wandb.ai

<Image img={require('../../img/wandb.png')} />

:::info
我們想了解如何讓 callbacks 變得更好！歡迎認識 LiteLLM 的 [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
::: 

## 先決條件 {#pre-requisites}
請確認您已為此整合執行 `uv add wandb`
```shell
uv add wandb litellm
```

## 快速開始 {#quick-start}
只需 2 行程式碼，即可使用 Weights & Biases 立即記錄您 **跨所有提供者** 的回應

```python
litellm.success_callback = ["wandb"]
```
```python
# uv add wandb 
import litellm
import os

os.environ["WANDB_API_KEY"] = ""
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set wandb as a callback, litellm will send the data to Weights & Biases
litellm.success_callback = ["wandb"] 
 
# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

## 支援與聯絡 founders {#support--talk-to-founders}

- [預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
