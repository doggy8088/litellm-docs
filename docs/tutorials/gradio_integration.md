# Gradio 聊天機器人 + LiteLLM 教學 {#gradio-chatbot--litellm-tutorial}
將 LiteLLM completion 請求與串流 Gradio 聊天機器人示範整合的簡易教學

### 安裝與匯入依賴項 {#install--import-dependencies}
```python
!uv add gradio litellm
import gradio
import litellm
```

### 定義推論函式 {#define-inference-function}
請記得依照託管您 LLM 的伺服器預期，設定 `model` 與 `api_base`。
```python
def inference(message, history):
    try:
        flattened_history = [item for sublist in history for item in sublist]
        full_message = " ".join(flattened_history + [message])
        messages_litellm = [{"role": "user", "content": full_message}] # litellm message format
        partial_message = ""
        for chunk in litellm.completion(model="huggingface/meta-llama/Llama-2-7b-chat-hf",
                                        api_base="x.x.x.x:xxxx",
                                        messages=messages_litellm,
                                        max_new_tokens=512,
                                        temperature=.7,
                                        top_k=100,
                                        top_p=.9,
                                        repetition_penalty=1.18,
                                        stream=True):
            partial_message += chunk['choices'][0]['delta']['content'] # extract text from streamed litellm chunks
            yield partial_message
    except Exception as e:
        print("Exception encountered:", str(e))
        yield f"An Error occurred please 'Clear' the error and try your question again"
```

### 定義聊天介面 {#define-chat-interface}
```python
gr.ChatInterface(
    inference,
    chatbot=gr.Chatbot(height=400),
    textbox=gr.Textbox(placeholder="Enter text here...", container=False, scale=5),
    description=f"""
    CURRENT PROMPT TEMPLATE: {model_name}.
    An incorrect prompt template will cause performance to suffer.
    Check the API specifications to ensure this format matches the target LLM.""",
    title="Simple Chatbot Test Application",
    examples=["Define 'deep learning' in once sentence."],
    retry_btn="Retry",
    undo_btn="Undo",
    clear_btn="Clear",
    theme=theme,
).queue().launch()
```
### 啟動 Gradio 應用程式 {#launch-gradio-app}
1. 從命令列：`python app.py` 或 `gradio app.py`（後者可啟用即時部署更新）
2. 在瀏覽器中造訪提供的超連結。
3. 享受與遠端 LLM 伺服器進行不受 prompt 限制的互動。

### 建議的擴充功能： {#recommended-extensions}
* 新增命令列引數以定義目標模型與推論端點

本教學感謝 [ZQ](https://x.com/ZQ_Dev)。
