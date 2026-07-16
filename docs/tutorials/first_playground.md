# 建立您的第一個 LLM playground {#create-your-first-llm-playground}
import Image from '@theme/IdealImage';

建立一個 playground，以便在不到 10 分鐘內**評估多個 LLM 提供者**。如果您想在正式環境中查看這一點，請參閱我們的[網站](https://litellm.ai/)。

**它會長什麼樣子？**
<Image
  img={require('../../img/litellm_streamlit_playground.png')}
  alt="streamlit_playground"
  style={{ maxWidth: '75%', height: 'auto' }}
/>

**我們要怎麼做？**：我們會建立<u>伺服器</u>，並將它連接到我們的範本前端，最後在結束時得到一個可運作的 playground UI！

:::info

 在開始之前，請確認您已遵循 [environment-setup](./installation) 指南。請注意，本教學依賴您至少擁有 1 個模型提供者的 API 金鑰（例如 OpenAI）。
:::

## 1. 快速開始 {#1-quick-start}

讓我們先確認金鑰可正常運作。請在您選擇的任何環境中執行這段程式（例如 [Google Colab](https://colab.research.google.com/#create=true)）。

🚨 別忘了將預留位置的金鑰值替換成您的金鑰！

```python 
uv add litellm
```

```python
from litellm import completion

## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key" ## REPLACE THIS
os.environ["COHERE_API_KEY"] = "cohere key" ## REPLACE THIS
os.environ["AI21_API_KEY"] = "ai21 key" ## REPLACE THIS


messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages)

# cohere call
response = completion("command-nightly", messages)

# ai21 call
response = completion("j2-mid", messages)
```

## 2. 設定伺服器 {#2-set-up-server}

讓我們先建立一個基本的 Flask 應用程式作為後端伺服器。我們會為 completion 請求設定一個特定路由。  

**注意**：
* 🚨 別忘了將預留位置的金鑰值替換成您的金鑰！
* `completion_with_retries`：LLM API 請求在正式環境中可能會失敗。這個函式會用 [tenacity](https://tenacity.readthedocs.io/en/latest/) 封裝一般的 litellm completion() 呼叫，以便在失敗時重試。

LiteLLM 特定片段：

```python 
import os
from litellm import completion_with_retries 

## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key" ## REPLACE THIS
os.environ["COHERE_API_KEY"] = "cohere key" ## REPLACE THIS
os.environ["AI21_API_KEY"] = "ai21 key" ## REPLACE THIS


@app.route('/chat/completions', methods=["POST"])
def api_completion():
    data = request.json
    data["max_tokens"] = 256 # By default let's set max_tokens to 256
    try:
        # COMPLETION CALL
        response = completion_with_retries(**data)
    except Exception as e:
        # print the error
        print(e)
    return response
```

完整程式碼如下：

```python 
import os
from flask import Flask, jsonify, request
from litellm import completion_with_retries 


## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key" ## REPLACE THIS
os.environ["COHERE_API_KEY"] = "cohere key" ## REPLACE THIS
os.environ["AI21_API_KEY"] = "ai21 key" ## REPLACE THIS

app = Flask(__name__)

# Example route
@app.route('/', methods=['GET'])
def hello():
    return jsonify(message="Hello, Flask!")

@app.route('/chat/completions', methods=["POST"])
def api_completion():
    data = request.json
    data["max_tokens"] = 256 # By default let's set max_tokens to 256
    try:
        # COMPLETION CALL
        response = completion_with_retries(**data)
    except Exception as e:
        # print the error
        print(e)

    return response

if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=4000, threads=500)
```

### 讓我們測試一下 {#lets-test-it}
啟動伺服器：
```python 
python main.py
```

執行這個 curl 指令來測試：
```curl
curl -X POST localhost:4000/chat/completions \
-H 'Content-Type: application/json' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [{
    "content": "Hello, how are you?",
    "role": "user"
  }]
}'
```

您應該會看到這樣的結果

<Image img={require('../../img/test_python_server_2.png')} alt="python_code_sample_2" />

## 3. 連接到我們的前端範本 {#3-connect-to-our-frontend-template}

### 3.1 下載範本 {#31-download-template}

前端我們會使用 [Streamlit](https://streamlit.io/)——這讓我們能夠建立一個簡單的 Python 網頁應用程式。

讓我們下載 LiteLLM 為您建立的 playground 範本：

```zsh
git clone https://github.com/BerriAI/litellm_playground_fe_template.git
```

### 3.2 執行它 {#32-run-it}

請確認 [步驟 2](#2-set-up-server) 的伺服器仍在 4000 埠執行

:::info

 如果您使用其他埠，沒問題——只要確認您有在 playground 範本的 app.py 中更改[這一行](https://github.com/BerriAI/litellm_playground_fe_template/blob/411bea2b6a2e0b079eb0efd834886ad783b557ef/app.py#L7)
:::

現在讓我們執行應用程式：

```zsh
cd litellm_playground_fe_template && streamlit run app.py
```

如果您沒有安裝 Streamlit——只要使用 uv add 加上它即可（或查看他們的[安裝指南](https://docs.streamlit.io/library/get-started/installation#install-streamlit-on-macoslinux)）

```zsh
uv add streamlit
```

您應該會看到這樣的結果：
<Image img={require('../../img/litellm_streamlit_playground.png')} alt="streamlit_playground" />

# 恭喜 🚀 {#congratulations-}

您已建立您的第一個 LLM Playground——具備可呼叫 50+ 個 LLM API 的能力。

下一步：
* [查看您現在可以新增的完整 LLM 提供者清單](https://docs.litellm.ai/docs/providers)
