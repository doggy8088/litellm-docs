# TypeSafe AI (Jev) {#typesafe-ai-jev}

[TypeSafe AI](https://docs.typesafe.ai/api) System One API 的轉送端點。Jev 回傳的是有型別的決策（選項、分數，或是是否的機率），而不是文字，因此它會透過自己的 evaluate 端點呼叫，而不是 `/chat/completions`。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 根據回應 `usage` 和模型註冊表計費 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這個功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | TypeSafe API 不提供 |

只要將 `https://api.typesafe.ai` 替換為 `LITELLM_PROXY_BASE_URL/typesafe` 🚀

LiteLLM 會從代理環境中加入 TypeSafe API 金鑰，因此用戶端只需要一個 LiteLLM 虛擬金鑰。

若要讓 JEV 為 completion 選擇模型，請使用 `classifier_type: jev` 和 `jev_classifier_config` 設定 [JEV Auto Router](/docs/auto_router/setup#jev-classifier-typesafe-ai)。它會針對已設定的層級使用一個 System One Choice 問題，然後將請求分派到所選的 completion 模型。請參閱 [路由脈絡、備援與計費](/docs/proxy/auto_routing#jev-classifier) 以及 [已量測的分類器比較](/blog/jev-auto-router-benchmark)

[OSS 分類器指南](/docs/auto_router/decision_classifiers) 文件說明了標準的 `classifier_type: oss_classifier` 和 `opensource_classifier_config.provider: jev` 名稱，這需要包含 [backend #43626](https://github.com/BerriAI/litellm/pull/43626) 的 gateway build。兩種設定都使用 TypeSafe 傳輸；新 backend 會繼續接受既有的 Jev 名稱。

## 快速開始 {#quick-start}

1. 在 proxy 環境中設定 TypeSafe API 金鑰

```bash showLineNumbers
export TYPESAFE_API_KEY=""
# optional, defaults to https://api.typesafe.ai
export TYPESAFE_API_BASE="https://api.typesafe.ai"
```

2. 啟動 proxy

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 透過 proxy 向 Jev 提出問題

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/typesafe/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoicing, refunds",
        "technical": "Bugs, outages, integrations",
        "sales": "Pricing, upgrades, new accounts"
      }
    }
  }
}'
```

回應是 TypeSafe 原生、未經變更的內容：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "technical",
      "probabilities": {"billing": 0.08, "technical": 0.85, "sales": 0.07},
      "confidence": 0.82
    }
  },
  "usage": {"input_tokens": 312, "output_tokens": 48}
}
```

`/typesafe/` 底下的任何路徑都會被轉送，因此 `GET /typesafe/v1/models` 會列出可用模型。[請參閱 TypeSafe API 參考文件](https://docs.typesafe.ai/api)

## 在管理介面中試試看 {#try-it-in-the-admin-ui}

Playground 有一個 **System One** 分頁（Beta），可用來不透過 curl 傳送 Jev 請求。開啟 `LITELLM_PROXY_BASE_URL/ui/?page=llm-playground&tab=system-one`，或前往 **Playground** 並選擇 **System One**。proxy 仍需要 `TYPESAFE_API_KEY`；若沒有它，上游錯誤會直接顯示在內嵌位置

左側是 JSON 編輯器，預先載入一個事件分流範例，會針對每種類型各問一個問題：`area`（選項）、`has_repro_steps`（noul）以及 `severity`（分數）。您可以編輯它或貼上自己的請求；**重設範例** 會還原內容，而 **Format JSON** 會重新縮排。`model` 是在 JSON 中設定的（例如 `jev-latest`），而不是從模型清單中挑選

請求會在您輸入時進行檢查。需要 `state` 與非空的 `questions` 物件，每個問題都需要 `instructions`，選項 `criteria` 必須對應 1 到 255 個標籤與說明，noul `criteria` 為選用，且需有 `true` 與 `false` 說明，而分數 `criteria` 則必須是至少 2 個層級的清單。錯誤會依 JSON 路徑列出，並停用 **送出**；超過 10 個分數層級只會顯示警告。這些之外的欄位都會原樣轉送至 TypeSafe

**虛擬金鑰來源** 會決定使用哪個金鑰：**目前 UI 工作階段** 會使用您的儀表板登入，而 **虛擬金鑰** 讓您貼上一個金鑰，使這次呼叫可歸屬並依該金鑰計入預算。**送出** 會將請求 POST 到 `/typesafe/v1/systemone`，也就是與上方 curl 相同的端點，因此支出與記錄也會以相同方式落地

右側會顯示狀態與每個問題準則的 **問題拆解**，而在呼叫返回後，則會顯示上方答案：選定的選項與信心值及每個選項的機率條，noul 機率，以及帶圖例與每層機率的分數。TypeSafe 回報的模型、輸入與輸出 token、延遲時間，以及原始 JSON 回應都會顯示在答案下方。驗證與上游錯誤，例如未知金鑰導致的 401，會直接顯示

## 成本追蹤 {#cost-tracking}

支出會使用回應中的 `usage.input_tokens` 與 `usage.output_tokens`，以及 LiteLLM 模型註冊表中的 `typesafe/<model>` 項目（`jev-1.13.0`、`jev-latest`、`jev-preview`）。請求會以 TypeSafe 回報的版本化模型記錄，例如 `typesafe/jev-1.13.0`，即使該請求使用的是別名。
