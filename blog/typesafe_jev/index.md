---
slug: typesafe_jev
title: "LiteLLM 上的 TypeSafe Jev"
date: 2026-09-20T10:00:00
authors:
  - kerry
description: "TypeSafe AI 的 Jev 登場於 LiteLLM v1.103.0-rc：透過 proxy 搭配記錄與成本追蹤來呼叫它。"
tags: [typesafe, jev, product]
hide_table_of_contents: false
---

[TypeSafe AI 的 Jev](https://docs.typesafe.ai/api) 今天在 `v1.103.0-rc` 上線 LiteLLM。Jev 是一個決策模型：它回傳選擇、分數或是/否機率，而不是文字，因此它有自己的 evaluate endpoint，而不是 `/chat/completions`。LiteLLM 會以記錄與成本追蹤來代理該 endpoint。

{/* truncate */}

## 定價 {#pricing}

每 100 萬個輸入 token 為 $0.042，沒有輸出費用。即使您請求 `jev-latest`，費用也會以 TypeSafe 回報的版本化模型（今天為 `typesafe/jev-1.13.0`）記錄。

## 使用方式 {#usage}

先在 proxy 上設定一次您的 TypeSafe 金鑰，然後將 `https://api.typesafe.ai` 替換為 `LITELLM_PROXY_BASE_URL/typesafe`。用戶端只需要一個 LiteLLM 虛擬金鑰。

```bash
export TYPESAFE_API_KEY="your-typesafe-api-key"
```

```bash
curl -X POST "http://0.0.0.0:4000/typesafe/v1/systemone" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Help! My payouts have been failing for 3 days.",
    "model": "jev-latest",
    "questions": {
      "department": {
        "type": "choice",
        "instructions": "Which team should handle this?",
        "criteria": {
          "billing": "Payments, invoicing, refunds",
          "technical": "Bugs, outages, integrations"
        }
      }
    }
  }'
```

回應會維持 TypeSafe 原本的樣子，不會變更。`/typesafe/` 底下的任何路徑都會被轉發，因此 `GET /typesafe/v1/models` 會列出可用模型。完整細節請參閱 [TypeSafe 轉傳文件](/docs/pass_through/typesafe)。

## 回饋 {#feedback}

透過 LiteLLM 執行 Jev 時遇到意外情況？請開啟 [GitHub 討論](https://github.com/BerriAI/litellm/discussions)。
