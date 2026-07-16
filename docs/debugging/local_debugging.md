# 本機除錯 {#local-debugging}
有 2 種方式可以進行本機除錯 - `litellm._turn_on_debug()` 以及傳入自訂函式 `completion(...logger_fn=<your_local_function>)`。警告：請確保不要在正式環境中使用 `_turn_on_debug()`。它會記錄 API 金鑰，這些金鑰可能會出現在記錄檔中。

## 設定詳細  {#set-verbose}

這很適合用來取得 litellm 正在執行的所有內容的 print 陳述式。
```python
import litellm
from litellm import completion

litellm._turn_on_debug() # 👈 this is the 1-line change you need to make

## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key"
os.environ["COHERE_API_KEY"] = "cohere key"

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages)

# cohere call
response = completion("command-nightly", messages)
```

## JSON 記錄  {#json-logs}

如果您需要將記錄儲存為 JSON，只要設定 `litellm.json_logs = True`。

我們目前只是將來自 litellm 的原始 POST 請求以 JSON 形式記錄 - [**查看程式碼**]。 

[在這裡分享回饋](https://github.com/BerriAI/litellm/issues)

## 記錄器函式  {#logger-function}
但有時候，您真正關心的是 دقیق知道傳送到您的 API 請求中的是什麼，以及回傳了什麼——例如，如果 API 請求失敗了，為什麼會那樣？正在設定的確切參數是什麼？

在這種情況下，LiteLLM 允許您傳入自訂的記錄函式，以查看／修改 model 呼叫的輸入／輸出。 

**注意**：我們預期您接受一個 dict 物件。 

您的自訂函式 

```python
def my_custom_logging_fn(model_call_dict):
    print(f"model call details: {model_call_dict}")
```

### 完整範例 {#complete-example}
```python
from litellm import completion

def my_custom_logging_fn(model_call_dict):
    print(f"model call details: {model_call_dict}")

## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key"
os.environ["COHERE_API_KEY"] = "cohere key"

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages, logger_fn=my_custom_logging_fn)

# cohere call
response = completion("command-nightly", messages, logger_fn=my_custom_logging_fn)
```

## 仍然遇到問題？  {#still-seeing-issues}

加入 [Discord](https://discord.com/invite/wuPM9dRgDw)。 

我們保證會以閃電般的速度協助您 `lite` ❤️
