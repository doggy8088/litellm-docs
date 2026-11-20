# 模型成本對照表 {#model-cost-map}

LiteLLM 以其模型成本對照表 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 為每個請求計價。每個項目將一個模型對應到其費率、內容限制與能力。原始 JSON 大到 GitHub 無法渲染，因此請在 [models.litellm.ai](https://models.litellm.ai/) 瀏覽相同資料，該站列出每個模型的價格、內容視窗與支援功能，並讓您依模型名稱或提供者搜尋。proxy 會在啟動時從 GitHub 取得最新的對照表，因此新模型與價格變更無需升級 LiteLLM 即可抵達。若要為您自己的部署變更價格，請參閱[自訂 LLM 計價](./custom_pricing)與[自訂模型成本對照表](./custom_model_cost_map)。若要在 Slack 或 RSS 閱讀器中取得新模型、價格變更與棄用通知，請參閱[訂閱模型與價格更新](./model_updates_feed)。

此對照表也包含用於新 ID 的[備援泛化規則](../fallback_generalizations.md)。這些規則在缺少確切項目時推斷提供者與能力預設值。隨附的規則不含價格，因此在為未對應的模型依賴成本追蹤之前，請先加入已驗證的費率。

## 每個價格都是每計費單位的美元 {#every-price-is-usd-per-billable-unit}

對照表中的每個價格都是以美元計、對提供者計費的一個單位。對於以 token 計價的模型，該單位是單一 token，因此 `"input_cost_per_token": 1e-05` 表示每個輸入 token $0.00001，也就是每 100 萬個輸入 token $10。`1e-05` 只是 Python 印出 `0.00001` 的方式。

| Key | 單位 | 範例 |
|---|---|---|
| `input_cost_per_token`, `output_cost_per_token` | 每 token 的美元 | `3e-06` 是每 100 萬個 token $3 |
| `cache_read_input_token_cost`, `cache_creation_input_token_cost` | 每讀取或寫入的快取 token 的美元 | `3e-07` 是每 100 萬個 token $0.30 |
| `output_cost_per_image` | 每張生成圖片的美元 | `0.04` 是每張圖片 $0.04 |
| `input_cost_per_second`, `output_cost_per_second` | 每秒音訊或影片的美元 | `0.1` 是每秒 $0.10 |
| `input_cost_per_query` | 每次搜尋或工具查詢的美元 | `0.005` 是每 1,000 次查詢 $5 |
| `input_cost_per_character` | 每個輸入字元的美元 | `1.5e-05` 是每 100 萬個字元 $15 |

費率的變體保持相同的單位並加上後綴。`_batches`、`_priority` 與 `_flex` 是批次與服務層級費率，`_above_200k_tokens` 與 `_above_272k_tokens` 是提示跨過該大小後適用的長內容費率，`cache_creation_input_token_cost_above_1hr` 是 1 小時提示快取寫入費率（Anthropic），而 `cache_creation_input_token_cost_above_12hr` 是 12 小時提示快取寫入費率（OpenAI GPT-5.6 及更新版本，於 `/responses`）。

若要將供應商「每 100 萬個 token $X」的價格轉換為成本對照表的值，請除以 1,000,000。例如，每 100 萬個 token $2.50 是 `2.5e-06`。

```yaml
model_list:
  - model_name: my-model
    litellm_params:
      model: openai/{{openai_large}}
    model_info:
      input_cost_per_token: 2.5e-06   # $2.50 per 1M input tokens
      output_cost_per_token: 1.5e-05  # $15 per 1M output tokens
```

## 請求如何計價 {#how-a-request-is-priced}

在回應回來之後，LiteLLM 會讀取提供者的用量區塊，將其拆成計費方式不同的 token 類型，並將每個數量乘以其費率。以一個具有 `input_cost_per_token: 1e-05`、`cache_read_input_token_cost: 2.5e-07` 與 `output_cost_per_token: 5e-05` 的項目為例。一個有 112,000 個提示 token（其中 100,000 個是快取讀取）與 800 個輸出 token 的請求，成本為：

```text
 12,000 uncached input tokens x 1e-05    = $0.12
100,000 cache read tokens     x 2.5e-07  = $0.025
    800 output tokens         x 5e-05    = $0.04
                                  total  = $0.185
```

相同的模式涵蓋其他一切。超過長內容門檻的提示使用 `_above_..._tokens` 費率，以 `service_tier: priority` 或 `flex` 送出的請求使用相符的後綴費率，而音訊、圖片、影片與推理 token 在項目有其專屬費率時使用該費率，沒有時使用文字費率。具有區域加價（例如資料駐留區域）的項目會將總額乘以儲存在該項目上的 `regional_processing_uplift_multiplier_<region>`。

有些提供者會自己回傳請求的成本，LiteLLM 會使用該數字。xAI 回報 `cost_in_usd_ticks`，其中一個 tick 是 1e-10 美元。由於 xAI 回報一個總額，LiteLLM 會依其自己的 token 計算給出的比例，將其拆分到輸入與輸出。

## 貨幣 {#currency}

支出一律以美元追蹤。LiteLLM 不會在請求時進行貨幣轉換。當供應商只以另一種貨幣發布價格時，成本對照表項目會以固定匯率一次性轉換為美元，且該匯率會記錄在該項目的 `metadata.comment` 中。

每個請求的結果會以美元浮點數寫入 `LiteLLM_SpendLogs.spend`，並彙總到金鑰、使用者與團隊的支出以供預算使用。由於它是浮點數，您可能會在記錄中看到像 `0.14500000000000002` 這樣的值。其尾數遠低於一分錢，即使累積數十億個請求也是如此。

## 當請求成本為 $0 時 {#when-a-request-costs-0}

當請求的模型，或請求使用的一項費率，在對照表中缺失時，該請求的計價為 $0。該請求仍會以 `spend = 0` 被記錄。當模型在其項目上有非零費率、但請求仍計價為 $0 時，proxy 也會將其計入 `litellm_zero_cost_requests_total` Prometheus 指標。如何讀取警告並修復缺失的費率，請參閱[計價為 $0 的請求](./cost_tracking#requests-that-price-to-0)。
