# Heroku {#heroku}

## 佈建模型 {#provision-a-model}

若要在 LiteLLM 中使用 Heroku，請[設定 Heroku 應用程式並附加支援的模型](https://devcenter.heroku.com/articles/heroku-inference#provision-access-to-an-ai-model-resource)。

## 支援的模型 {#supported-models}

LiteLLM 的 Heroku 支援各種[聊天](https://devcenter.heroku.com/articles/heroku-inference-api-v1-chat-completions)模型：

| 模型                             | 區域  |
|-----------------------------------|---------|
| [`heroku/claude-sonnet-4`](https://devcenter.heroku.com/articles/heroku-inference-api-model-claude-4-sonnet)          | US, EU  |
| [`heroku/claude-3-7-sonnet`](https://devcenter.heroku.com/articles/heroku-inference-api-model-claude-3-7-sonnet)        | US, EU  |
| [`heroku/claude-3-5-sonnet-latest`](https://devcenter.heroku.com/articles/heroku-inference-api-model-claude-3-5-sonnet-latest) | US      |
| [`heroku/claude-3-5-haiku`](https://devcenter.heroku.com/articles/heroku-inference-api-model-claude-3-5-haiku)         | US      |
| [`heroku/claude-3`](https://devcenter.heroku.com/articles/heroku-inference-api-model-claude-3-haiku)                 | EU      |

## 環境變數 {#environment-variables}

當您將模型附加到 Heroku 應用程式時，會設定三個設定變數：

- `INFERENCE_KEY`：用於驗證對模型之請求的 API 金鑰。
- `INFERENCE_MODEL_ID`：模型名稱，例如`claude-3-5-haiku`。
- `INFERENCE_URL`：呼叫模型的基礎 URL。

`INFERENCE_KEY` 與 `INFERENCE_URL` 兩者都是對您的模型發出呼叫所必需的。

如需這些變數的詳細資訊，請參閱 [Heroku 文件](https://devcenter.heroku.com/articles/heroku-inference#model-resource-config-vars)。

## 使用範例 {#usage-examples}
### 使用設定變數 {#using-config-variables}

Heroku 使用下列 LiteLLM API 設定變數：

- `HEROKU_API_KEY`：此值對應於 [LiteLLM 的 `api_key` 參數](https://docs.litellm.ai/docs/set_keys#litellmapi_key)。請將此變數設定為 Heroku 的 `INFERENCE_KEY` 設定變數的值。
- `HEROKU_API_BASE`：此值對應於 [LiteLLM 的 `api_base` 參數](https://docs.litellm.ai/docs/set_keys#litellmapi_base)。請將此變數設定為 Heroku 的 `INFERENCE_URL` 設定變數的值。

在此範例中，我們不會明確傳入 `api_key` 與 `api_base` 變數。相反地，我們設定 Heroku 將使用的設定變數：

```python
import os
from litellm import completion

os.environ["HEROKU_API_BASE"] = "https://us.inference.heroku.com"
os.environ["HEROKU_API_KEY"] = "fake-heroku-key"

response = completion(
    model="heroku/claude-3-5-haiku",
    messages=[
        {"role": "user", "content": "write code for saying hey from LiteLLM"}
    ]
)

print(response)
```

> 請在模型名稱中包含 `heroku/` 前綴，讓 LiteLLM 知道要使用的模型提供者。

### 明確設定 `api_key` 與 `api_base` {#explicitly-setting-api_key-and-api_base}

```python
from litellm import completion

response = completion(
    model="heroku/claude-sonnet-4",
    api_key="fake-heroku-key",
    api_base="https://us.inference.heroku.com",
    messages=[
        {"role": "user", "content": "write code for saying hey from LiteLLM"}
    ],
)
```

> 請在模型名稱中包含 `heroku/` 前綴，讓 LiteLLM 知道要使用的模型提供者。
