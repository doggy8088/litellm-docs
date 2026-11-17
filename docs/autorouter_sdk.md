---
title: Autorouter SDK
sidebar_label: Autorouter SDK
description: 在 Python 中建置自動路由器，為每個請求選擇模型。安裝 LiteLLM、設定兩個模型，並查看由哪個模型回答。
---

使用 `litellm.Router` 為每個提示選擇模型。您在 Python 中定義模型與路由規則。不需要 proxy 伺服器或 Enterprise 授權。

本範例使用本機啟發式分類器，在兩個 OpenAI 模型之間路由。您需要 Python 與一把 OpenAI API 金鑰；模型回應的費用由您支付。

## 1. 安裝並設定您的 API 金鑰 {#1-install-and-set-your-api-key}

在您的專案目錄中執行：

```bash
python -m pip install --upgrade litellm
```

在 [OpenAI 儀表板](https://platform.openai.com/api-keys) 建立 API 金鑰。在您將執行腳本的同一個終端機中設定它（macOS 或 Linux）：

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

將 `YOUR_OPENAI_API_KEY` 換成您的金鑰。您的帳號需要能存取範例中的兩個模型。

## 2. 建立您的路由器 {#2-create-your-router}

將此儲存為 `autorouter.py`：

```python
import asyncio

from litellm import Router

routing_config = {
    "classifier_type": "heuristic",
    "tiers": {
        "SIMPLE": "fast",
        "MEDIUM": "fast",
        "COMPLEX": "capable",
        "REASONING": "capable",
    },
    "return_raw_model_name": True,
}

router = Router(
    model_list=[
        {
            "model_name": "fast",
            "litellm_params": {"model": "openai/{{openai_small}}"},
        },
        {
            "model_name": "capable",
            "litellm_params": {"model": "openai/{{openai_large}}"},
        },
        {
            "model_name": "auto",
            "litellm_params": {
                "model": "auto_router/complexity_router",
                "complexity_router_config": routing_config,
                "complexity_router_default_model": "capable",
            },
        },
    ]
)


async def main():
    response = await router.acompletion(
        model="auto",
        messages=[{"role": "user", "content": "What is 2+2?"}],
    )
    print("Selected model:", response.model)
    print(response.choices[0].message.content)


if __name__ == "__main__":
    asyncio.run(main())
```

從您的應用程式呼叫 `auto`。分類器會為提示指派複雜度等級：`SIMPLE` 與 `MEDIUM` 使用 `fast`；`COMPLEX` 與 `REASONING` 使用 `capable`。如果無法分類該請求，路由器會以 `capable` 作為預設。

## 3. 傳送請求 {#3-send-a-request}

```bash
python autorouter.py
```

腳本會印出所選模型與其回答。輸出範例：

```text
Selected model: {{openai_small}}
4
```

`return_raw_model_name=True` 會將所選模型公開在 `response.model` 中。變更訊息內容來試試您自己的提示。啟發式分類是依據提示訊號估計複雜度，因此在依賴它之前，請先以您自己的請求檢查它的選擇。

如果驗證失敗，請檢查此終端機中是否已設定 `OPENAI_API_KEY`。如果您的帳號無法使用某個模型，請將其 `litellm_params.model` 值換成您可以存取的 OpenAI 模型。

## 後續步驟 {#next-steps}

變更兩個提供者模型名稱與等級指派，使其符合您的應用程式。若要使用其他提供者，請設定該提供者的憑證並使用其 `provider/model` 名稱；請參閱[支援的提供者](/docs/providers)。

[選擇分類器](./autorouter_sdk/classifiers.md)，依提示複雜度、關鍵字或您自己的 Python 邏輯路由。[設定路由](./autorouter_sdk/routing.md)，使用模型池、讓對話固定在同一個模型，或處理長提示。[檢查與評估](./autorouter_sdk/evaluation.md)，查看路由決策，並與固定模型的回答比較。

完整設定清單請參閱[設定參考](/docs/proxy/auto_routing#full-config)。若要透過 HTTP 服務多個應用程式，請參閱[閘道設定](/docs/auto_router/setup)。
