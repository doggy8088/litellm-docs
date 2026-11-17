---
title: 設定路由
sidebar_label: 設定路由
description: 在 Python 中將模型指派給等級、使用模型池、讓工作階段固定在同一個模型，並啟用上下文視窗升級。
---

從[快速入門](../autorouter_sdk.md) 的 `autorouter.py` 開始。將下列設定片段加在 **`routing_config` 之後、`router = Router(...)` 之前**。然後執行 `python autorouter.py` 試試變更。

## 將模型指派給等級 {#assign-models-to-tiers}

將每個等級對應到您 `model_list` 中的一個 `model_name`：

```python
routing_config["tiers"] = {
    "SIMPLE": "fast",
    "MEDIUM": "capable",
    "COMPLEX": "capable",
    "REASONING": "capable",
}
```

這會將中等複雜度的提示送到 `capable` 而不是 `fast`。您可以將多個等級對應到同一個模型。若要使用其他提供者，請將其模型加入 `model_list`、設定其憑證，並在此使用該項目的 `model_name`。

請將等級對應與 `complexity_router_default_model` 分開：預設值處理路由器無法分類的請求；它不會取代等級。

## 從模型池中選擇 {#choose-from-a-pool}

當多個模型都能處理某個等級時，使用清單：

```python
routing_config["tiers"]["MEDIUM"] = ["fast", "capable"]
```

路由器選到 `MEDIUM` 時，會從該模型池隨機選擇一個模型。只列出您願意用於該等級的模型。模型池並不是「先試第一個模型，再備援到第二個」的意思。

若要試試模型池內的適應性選擇，請加入：

```python
routing_config["adaptive"] = True
```

適應性選擇使用 Thompson sampling 與後續對話輪次的回饋。它一開始會探索模型池；不保證第一次選擇就是最便宜或最好的模型。請使用[評估指南](./evaluation.md)，在您自己的流量上將它與隨機選擇比較。

## 讓對話固定在同一個模型 {#keep-a-conversation-on-one-model}

當您希望後續輪次重用第一輪的模型時，啟用工作階段親和性：

```python
routing_config.update({
    "session_affinity": True,
    "session_affinity_ttl_seconds": 3600,
})
```

將 `main()` 換成這段兩輪對話：

```python
async def main():
    messages = [{"role": "user", "content": "What is 2+2?"}]
    for turn in range(2):
        response = await router.acompletion(
            model="auto",
            messages=messages,
            metadata={"session_id": "arithmetic-demo"},
        )
        print("Selected model:", response.model)
        print(response.choices[0].message.content)
        if turn == 0:
            messages.append({
                "role": "assistant",
                "content": response.choices[0].message.content,
            })
            messages.append({"role": "user", "content": "And what is twice that?"})
```

兩輪使用相同的工作階段 ID，應該印出同一個模型。請為每個對話選擇不同的 ID，並重用 `Router` 執行個體。沒有 `session_id` 時，即使啟用了親和性，路由器仍會分類每個請求。

親和性可以保留提供者的提示快取，但如果第一輪選了昂貴的模型，便宜的後續問題也會留在該模型上。升級可以變更這個固定。路由 `plugins` 會停用這個捷徑，讓它們的政策仍能執行；`classifier_plugin` 則不會。

## 處理超出模型上下文視窗的提示 {#handle-prompts-that-exceed-a-models-context-window}

啟用上下文視窗升級，在所選等級放不下請求時，將請求移到更高的等級：

```python
routing_config.update({
    "enable_context_window_escalation": True,
    "context_window_escalation_buffer": 0.95,
})
```

路由器會估計輸入大小，並尋找有足夠空間的更高等級。它從 LiteLLM 的模型資料或該部署的 `model_info.max_input_tokens` 讀取每個目標模型的上下文視窗。緩衝會保留輸入視窗的 5%。更高的等級需要更大的上下文視窗，這才有幫助。

未知的視窗不會觸發升級。如果沒有已知放得下的等級，請求會留在所選等級，仍可能在提供者端失敗。這個選項不會截斷您的提示，也不保證一定放得下。完整行為請參閱[上下文視窗參考](/docs/proxy/auto_routing#context-window-escalation)。

接著，在將此設定用於您的應用程式之前，先[檢查與評估路由](./evaluation.md)。
