# LiteLLM v1.0.0+ 遷移指南  {#migration-guide---litellm-v100}

當我們有破壞性變更（也就是從 1.x.x 升級到 2.x.x）時，我們會在此記錄這些變更。

## `1.0.0`  {#100}

**上一個破壞性變更前的版本**：0.14.0

**有什麼變更？**

- 需要 `openai>=1.0.0`
- `openai.InvalidRequestError` → `openai.BadRequestError`
- `openai.ServiceUnavailableError` → `openai.APIStatusError`
- *新增* litellm 用戶端，允許使用者傳入 api_key
    - `litellm.Litellm(api_key="sk-123")`
- 回應物件現在繼承自 `BaseModel`（前為 `OpenAIObject`）
- *新增* 預設例外 - `APIConnectionError`（前為 `APIError`）
- litellm.get_max_tokens() 現在回傳 int，而不是 dict
    ```python
    max_tokens = litellm.get_max_tokens("gpt-3.5-turbo") # returns an int not a dict 
    assert max_tokens==4097
    ```
- 串流 - OpenAI Chunks 現在會針對空的串流區塊回傳 `None`。這是處理含有內容的串流區塊的方法
    ```python
    response = litellm.completion(model="gpt-3.5-turbo", messages=messages, stream=True)
    for part in response:
        print(part.choices[0].delta.content or "")
    ```

**我們該如何更好地溝通變更？**
請告訴我們
- [Discord](https://discord.com/invite/wuPM9dRgDw)
- Email (support@berri.ai)
