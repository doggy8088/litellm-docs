import Image from '@theme/IdealImage';

# TypeSafe AI (Jev) {#typesafe-ai-jev}

[TypeSafe AI](https://docs.typesafe.ai/api) System One API 的轉送端點。Jev 回傳的是有型別的決策（選項、分數，或是是否的機率），而不是文字，因此它會透過自己的 evaluate 端點呼叫，而不是 `/chat/completions`。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 根據回應 `usage` 和模型註冊表計費 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這個功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | TypeSafe API 不提供 |

只要將 `https://api.typesafe.ai` 替換為 `LITELLM_PROXY_BASE_URL/typesafe`

LiteLLM 會從代理環境中加入 TypeSafe API 金鑰，因此用戶端只需要一個 LiteLLM 虛擬金鑰。

以 `TypeSafe-Danger-Zone-` 開頭的用戶端標頭會被轉送至 TypeSafe，例如用於 Jev 1.14 圖片與 `box` 問題的 `TypeSafe-Danger-Zone-Images: true`。其他用戶端標頭不會被轉送。

若要透過您的 `model_list` 呼叫 Jev 並享有負載平衡、備援與每個部署各自的金鑰，或要將相同請求送往 OpenAI、Perplexity、Cloudflare 或 Strands Decider，請改用統一的 [`/v1/systemone` 端點](../decisions.md#v1systemone)。它接受相同的 System One body，而 [`/v1/decisions`](../decisions.md#v1decisions) 則接受 OpenAI Decisions 格式

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

## 限制哪些金鑰可以呼叫 Jev {#limit-which-keys-can-call-jev}

此透傳會執行與 `/chat/completions` 相同的模型存取檢查。當某個金鑰、其團隊或其專案設有 `models` 清單時，只有在每個清單都允許請求 body 中的 `model` 時，才允許 `/typesafe/` 呼叫；該 `model` 是純 Jev 名稱，例如 `jev-latest`。

| `models` 中的條目 | 允許 |
|-------|-------|
| `jev-latest` | 僅 `jev-latest` |
| `typesafe/*` | `jev-latest`、`jev-preview`，以及 LiteLLM 有定價的版本化名稱，例如 `jev-1.14.0` |
| `typesafe/jev-latest` | 不允許純 `jev-latest` 呼叫 |

若某個清單不允許呼叫所用的模型，該呼叫會收到 403，例如團隊清單的 `team_model_access_denied`。例如，以下團隊允許已發佈的 Jev 模型：

```bash showLineNumbers
curl -X POST "$LITELLM_PROXY_BASE_URL/team/new" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"team_alias": "jev-users", "models": ["typesafe/*"]}'
```

在管理介面中，當代理環境設定了 `TYPESAFE_API_KEY` 時，團隊與組織的 **Models** 下拉選單，以及未選擇團隊時的金鑰下拉選單，會提供 **All Typesafe models**（`typesafe/*`）與每個 Jev 模型。

代理提供這些下拉選項 <SinceVersion v="1.109.0" />。`typesafe/*` 的比對來自 LiteLLM 的模型註冊表，因此從 GitHub 載入註冊表的代理（這是預設行為）在升級前即可取得此功能。

## 在管理介面中試試看 {#try-it-in-the-admin-ui}

Playground 的 **Decisions** 分頁（Beta）可以不透過 curl 傳送 Jev 請求。它呼叫的是代理的 `/v1/systemone` 路由，而不是此透傳，因此請先將 `typesafe/` 模型加入您的 `model_list`，例如 Decisions 頁面[代理設定](../decisions.md#proxy-setup)中的 `jev`，並設定 `TYPESAFE_API_KEY`。開啟 `LITELLM_PROXY_BASE_URL/ui/?page=llm-playground&tab=system-one`，或前往 **Playground** 並選擇 **Decisions**。

在 **Endpoint** 下選擇 `/v1/systemone`，並在 **Model** 下選擇您的 Jev 模型。**Load example** 會填入一個請求，例如 **Triage a bug report**，它會針對每種類型各問一個問題：`area`（選項）、`has_repro_steps`（是 / 否）與 `severity`（分數）。橡皮擦按鈕會清除表單。

<Image img={require('../../img/decisions_playground_systemone.png')} alt="已選取 /v1/systemone 與 jev 模型的 Decisions playground，顯示表單與答案" />

編輯器會開啟在 **Form** 分頁，因此您可以不寫 JSON 就建立請求。將模型應讀取的文字輸入 **Input**，然後填寫每張問題卡片：其 **Name**、**Answer type**（**Choice**、**Yes / no** 或 **Score**）、**Instructions** 與其準則。選項問題需要帶有說明的 **Options**，是 / 否問題需要 **Yes means** 與 **No means**，分數問題則需要 **Levels, lowest first**，從 0 開始編號。**Add question**、**Add option** 與 **Add level** 可以新增列，垃圾桶按鈕則可將其移除。

**cURL** 分頁會將請求顯示為唯讀的 curl 命令，目標是代理的 `/v1/systemone`，並會隨著您的編輯更新。當表單沒有問題時，**Copy cURL** 會複製它，您再將 `$LITELLM_API_KEY` 換成虛擬金鑰。若要在 LiteLLM 的支出記錄中為這次呼叫加上標籤（表單沒有對應的輸入欄位），請複製該 curl，並在其 `-d` body 中加入 `"metadata": {"tags": ["triage"]}`。

表單會在您輸入時檢查請求。問題會列在 **Send** 上方，例如 **Input** 為空時的 `Add the text the model should decide about.`，以及問題未命名時的 `Give every question a name.`，而 **Send** 會保持停用，直到問題修正為止。其餘部分由 TypeSafe 在您送出時檢查，因此沒有 instructions、也沒有 **Yes means** 或 **No means** 的是 / 否問題會回傳 400。

**API key** 決定使用哪個金鑰。**Current UI Session** 使用您的儀表板登入，而 **Virtual Key** 讓您貼上一個金鑰，使這次呼叫可歸屬並依該金鑰計入預算。**Send** 會透過您的 `model_list` 將請求 POST 到 `/v1/systemone`，因此支出與記錄會像任何其他請求一樣落在代理模型名稱之下。上方 curl 使用的 `/typesafe/v1/systemone` 透傳無法在 Playground 中選取。

呼叫返回後，**Response** 卡片會為每個問題顯示一張卡片：選定的選項及其信心值與每個選項的長條圖、是 / 否機率，以及分數及其信心值與每個層級的長條圖。其標頭會顯示延遲時間、回應中的模型名稱，以及輸入與輸出 token，而 **Raw response** 會開啟 JSON body。驗證與上游錯誤，例如未知金鑰導致的 401，會將答案取代為 **Decisions request failed** 與該錯誤。

## 成本追蹤 {#cost-tracking}

支出會使用回應中的 `usage.input_tokens` 與 `usage.output_tokens`，以及 LiteLLM 模型註冊表中的 `typesafe/<model>` 項目（`jev-1.13.0`、`jev-1.14.0`、`jev-latest`、`jev-preview`）。請求會以 TypeSafe 回報的版本化模型記錄，例如 `typesafe/jev-1.13.0`，即使該請求使用的是別名。
