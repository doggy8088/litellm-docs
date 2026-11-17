---
title: 選擇分類器
sidebar_label: 選擇分類器
description: 使用啟發式、LLM、關鍵字規則或您自己的 Python 分類器，透過 LiteLLM SDK 選擇模型。
---

分類器會為請求挑選一個等級。您的 `tiers` 對應決定由哪個模型服務該等級。

從[快速入門](../autorouter_sdk.md) 的 `autorouter.py` 開始。將下列每個範例加在 **`routing_config` 之後、`router = Router(...)` 之前**，然後執行 `python autorouter.py`。一次試一個分類器。

## 使用本機啟發式分類 {#use-the-local-heuristic}

快速入門使用此設定：

```python
routing_config["classifier_type"] = "heuristic"
```

啟發式方法會對提示長度、程式碼與推理用語等訊號評分。它在本機執行，不需要呼叫分類器 API。從這裡開始可以避免額外的模型請求，然後以您自己的提示檢查它的選擇。

## 使用 LLM 分類器 {#use-an-llm-classifier}

使用模型判斷提示的複雜度：

```python
routing_config.update({
    "classifier_type": "llm",
    "classifier_llm_config": {
        "model": "fast",
        "timeout_ms": 2000,
    },
    "classifier_fallback": "heuristic",
})
```

`fast` 指的是您在 `model_list` 中定義的模型。路由器會呼叫它來選擇等級，然後呼叫指派給該等級的模型來回答。兩次呼叫的費用都由您支付。如果分類逾時或回傳無效結果，此設定會改用啟發式方法。

若要在分類器失敗時改用您的預設模型，請設定：

```python
routing_config["classifier_fallback"] = "default_model"
```

快速入門的 `complexity_router_default_model` 是 `capable`。

## 將符合關鍵字的請求路由到指定等級 {#route-matching-keywords-to-a-tier}

當您知道某個主題應該由哪個等級處理時，加入關鍵字規則：

```python
routing_config["keyword_tier_rules"] = [
    {"keywords": ["kubernetes", "k8s"], "tier": "REASONING"},
    {"keywords": ["hello", "thanks"], "tier": "SIMPLE"},
]
```

規則會在分類器之前執行。如果多條規則都符合，以符合的最高等級為準。沒有符合時，執行設定的分類器。本範例使用字面比對，不呼叫 embedding。

將快速入門的訊息改為 `"Explain Kubernetes deployments"` 並執行。關鍵字規則會選出 `REASONING`，它對應到 `capable`。

## 以 Python 撰寫分類器 {#write-a-classifier-in-python}

依據訊息或 metadata 回傳等級名稱。將此加在[快速入門](../autorouter_sdk.md) 的 `routing_config` 之後、`router = Router(...)` 之前：

```python
class TaskClassifier:
    async def classify(self, context):
        message = context.structured_messages[-1]["content"]
        if context.metadata.get("agent_name") == "summarizer":
            return "quick"
        if len(message) > 1000:
            return "careful"
        if "kubernetes" in message.lower():
            return "careful"
        return "quick"


routing_config.update({
    "classifier_type": "custom",
    "classifier_plugin": TaskClassifier(),
    "tiers": {"quick": "fast", "careful": "capable"},
    "classifier_fallback": "default_model",
})
```

本範例將最後一則訊息讀為文字。第一條符合的規則優先。請變更規則與等級名稱，使其符合您的應用程式。

需要時，隨請求傳入 metadata：

```python
response = await router.acompletion(
    model="auto",
    messages=[{"role": "user", "content": "Summarize this document: ..."}],
    metadata={"agent_name": "summarizer"},
)
```

執行 `python autorouter.py`。摘要器使用 `fast`。沒有該 metadata 時，長訊息與 Kubernetes 問題使用 `capable`；其他訊息使用 `fast`。

如果您的分類器拋出錯誤、逾時，或回傳未知等級，此設定會使用快速入門的預設模型 `capable`。

接著，[設定路由](./routing.md) 或[檢查您的分類器決策](./evaluation.md)。託管的決策分類器與語意關鍵字比對，請參閱[分類參考](/docs/proxy/auto_routing#classification)。
