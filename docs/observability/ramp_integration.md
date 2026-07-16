import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Ramp {#ramp}

將 AI 使用量與成本資料傳送至 Ramp，以便自動追蹤支出。

[Ramp](https://ramp.com/) 是一個財務自動化平台，協助企業管理支出、公司卡與供應商付款。透過 Ramp 回呼整合，您的 LiteLLM AI 使用量——包括 token 數量、模型成本與請求中繼資料——會自動傳送至 Ramp，以即時掌握支出狀況。

:::info
我們希望了解如何讓回呼做得更好！歡迎認識 LiteLLM [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
:::

## 前置需求 {#pre-requisites}

1. 登入 [Ramp](https://app.ramp.com/)，並使用搜尋列搜尋 **"LiteLLM"**。點擊 **LiteLLM** 整合結果。

> **注意：** 只有業主與管理員可以存取並設定整合。

2. 在 LiteLLM 整合頁面右上角點擊 **Connect** 按鈕。

3. 在 Connect LiteLLM 抽屜中，點擊 **Generate API Key** 以建立 API 金鑰。

> **重要：** 請立即複製 API 金鑰——之後將不會再次顯示。若遺失，您可以從整合設定中撤銷現有金鑰並產生新的金鑰。

```shell
pip install litellm
```

## 快速開始 {#quick-start}

設定您的 `RAMP_API_KEY`，並將 `"ramp"` 加入回呼，以開始將 LLM 使用量記錄至 Ramp。

<Tabs>
<TabItem value="python" label="SDK">

```python
litellm.callbacks = ["ramp"]
```

```python
import litellm
import os

# Ramp API Key
os.environ["RAMP_API_KEY"] = "your-ramp-api-key"

# LLM API Keys
os.environ['OPENAI_API_KEY'] = ""

# Set ramp as a callback
litellm.callbacks = ["ramp"]

# OpenAI call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi - I'm testing Ramp integration"}
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
  callbacks: ["ramp"]

environment_variables:
  RAMP_API_KEY: os.environ/RAMP_API_KEY
```

2. 啟動 LiteLLM Proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how are you?"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 記錄了哪些資料？ {#what-data-is-logged}

LiteLLM 會在成功的 LLM API 請求時，將 [Standard Logging Payload](https://docs.litellm.ai/docs/proxy/logging_spec) 傳送至 Ramp，其中包括：

- **請求詳細資料**：模型、訊息、參數
- **回應詳細資料**：完成文字、token 使用量、延遲
- **中繼資料**：使用者 ID、自訂中繼資料、時間戳記
- **成本追蹤**：根據 token 使用量計算的回應成本

## 驗證 {#authentication}

將 `RAMP_API_KEY` 環境變數設定為您的 Ramp API 金鑰。

| 環境變數 | 說明 |
|---|---|
| `RAMP_API_KEY` | 您的 Ramp API 金鑰（必填） |

## 支援與創辦人交流 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電話 📞 +1 (770) 8783-106 / ‭+1 (412) 618-6238‬
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
