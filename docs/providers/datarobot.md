import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DataRobot {#datarobot}
LiteLLM 支援來自 [DataRobot](https://datarobot.com) 的所有模型。請選擇 `datarobot` 作為提供者，透過上游 [官方 OpenAI Python API 函式庫](https://github.com/openai/openai-python/blob/main/README.md) 使用 `datarobot` 相容的 OpenAI 端點來路由您的請求。

## 使用方式  {#usage}

### 環境變數 {#environment-variables}
```python
import os
from litellm import completion
os.environ["DATAROBOT_API_KEY"] = ""
os.environ["DATAROBOT_API_BASE"] = "" # [OPTIONAL] defaults to https://app.datarobot.com

response = completion(
            model="datarobot/openai/gpt-4o-mini",
            messages=messages,
        )


### Completion
```python
import litellm
import os

response = litellm.completion(
    model="datarobot/openai/gpt-4o-mini",   # add `datarobot/` prefix to model so litellm knows to route through DataRobot
    messages=[
                {
                    "role": "user",
                    "content": "Hey, how's it going?",
                }
    ],
)
print(response)
```

## DataRobot 完成模型 {#datarobot-completion-models}

🚨 LiteLLM 支援 _所有_ DataRobot LLM gateway 模型。若要取得您安裝與使用者帳戶可用的清單，請送出以下 CURL 指令：
`curl -X GET -H "Authorization: Bearer $DATAROBOT_API_TOKEN" "$DATAROBOT_ENDPOINT/genai/llmgw/catalog/" | jq | grep 'model":'DATAROBOT_ENDPOINT/genai/llmgw/catalog/`
