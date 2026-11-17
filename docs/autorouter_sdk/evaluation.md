---
title: 檢查與評估
sidebar_label: 檢查與評估
description: 查看您的 Python 自動路由器所選的模型、讀取決策記錄，並與固定模型的回應比較。
---

從[快速入門](../autorouter_sdk.md) 的 `autorouter.py` 開始。同時檢查所選模型與它產生的回答。選擇較便宜的模型，只有在它的回答符合您的需求時才有幫助。

## 查看所選模型 {#see-the-selected-model}

快速入門在 `routing_config` 中設定了 `return_raw_model_name=True`。請求之後，印出：

```python
print("Selected model:", response.model)
print(response.choices[0].message.content)
```

模型名稱可能包含提供者的版本後綴。測試期間請保持此設定啟用；只靠別名 `auto` 無法得知是由哪個模型回答。

## 讀取路由決策 {#read-the-routing-decision}

在建立路由器之前加入此段：

```python
import logging

logging.getLogger("LiteLLM Router").setLevel(logging.INFO)
```

執行 `python autorouter.py`。在記錄中尋找 `ComplexityRouter: routing decision`。該行包含所選模型與原因，例如 `heuristic_scorer`、`literal_keyword_match`、`llm_classifier` 或 `session_affinity_pin`。分類決策也會回報等級；啟發式決策則包含分數與訊號。

搭配測試提示使用這些記錄。它們可能包含符合的詞彙與其他源自請求的細節。

## 與固定模型比較 {#compare-with-a-fixed-model}

將此儲存為 `evaluate_router.py`，放在 `autorouter.py` 旁邊。它會匯入已設定的路由器，而不執行快速入門的 `main()`。

每個提示會發出兩個回答請求：一個透過 `auto`，一個直接向 `capable`。LLM 分類器會加上它自己的分類請求。所有提供者呼叫都使用您的帳號。

```python
import asyncio
from time import perf_counter

from autorouter import router

prompts = [
    "What is 2+2?",
    "Explain when to use a database index and when it can slow writes down.",
    "Review this function: def add(a, b): return a - b",
]


async def main():
    for prompt in prompts:
        print("\nPrompt:", prompt)
        for target in ("auto", "capable"):
            start = perf_counter()
            response = await router.acompletion(
                model=target,
                messages=[{"role": "user", "content": prompt}],
            )
            elapsed = perf_counter() - start
            print(f"{target}: {response.model} ({elapsed:.2f}s)")
            print(response.choices[0].message.content)


if __name__ == "__main__":
    asyncio.run(main())
```

在該目錄中執行它：

```bash
python evaluate_router.py
```

對每個提示，您都會看到兩條路徑各自的所選模型、耗時與回答。請將這些範例換成您應用程式的請求。在比較延遲或價格之前，先檢查正確性與任務完成度。耗時包含路由與回答請求；單次執行只是抽查，不是基準測試。

如果 `auto` 選了無法完成任務的模型，請變更[分類器](./classifiers.md) 或[等級對應](./routing.md#assign-models-to-tiers)，然後以相同提示重跑。若要測試模型池選擇，請重複請求以抽樣其選擇。若要測試工作階段親和性，請使用[兩輪範例](./routing.md#keep-a-conversation-on-one-model)；本腳本傳送的是沒有工作階段 ID 的獨立請求。

跨提供者的成本請參閱 [SDK 成本追蹤](/docs/completion/token_usage)。比較總成本時請計入分類器呼叫；只看回答 token 無法涵蓋它們。
