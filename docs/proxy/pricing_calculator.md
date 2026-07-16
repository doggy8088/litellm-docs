# 價格計算器（成本估算） {#pricing-calculator-cost-estimation}

根據預期的 token 使用量與請求量估算 LLM 成本。這個工具可協助開發人員與平台團隊在將模型部署到正式環境前預測支出。

## 何時使用此功能 {#when-to-use-this-feature}

使用價格計算器來：
- **預算規劃** - 在承諾採用某個模型前，估算每月成本
- **模型比較** - 比較不同模型在您的使用情境中的成本
- **容量規劃** - 了解擴大量請求時的成本影響
- **成本最佳化** - 找出最符合您 token 需求的最具成本效益模型

## 使用價格計算器 {#using-the-pricing-calculator}

本教學將示範如何在 LiteLLM UI 中使用價格計算器估算 LLM 成本。

### 步驟 1：前往設定 {#step-1-navigate-to-settings}

在 LiteLLM 儀表板中，點擊左側邊欄的 **Settings**。

![點擊 Settings](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/183c437e-bda9-48b4-ab8f-95f023ba1146/ascreenshot_a1013487f545484194a9a4929eef4c49_text_export.jpeg)

### 步驟 2：開啟成本追蹤 {#step-2-open-cost-tracking}

點擊 **Cost Tracking** 以存取成本設定選項。

![點擊成本追蹤](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/05c92350-cbae-42ed-935b-e96a26003de8/ascreenshot_cc85f175a6664fc5be8dfdcc1759b442_text_export.jpeg)

### 步驟 3：開啟價格計算器 {#step-3-open-pricing-calculator}

點擊 **Pricing Calculator** 以展開計算器面板。此區段可讓您根據預期的 token 使用量與請求量估算 LLM 成本。

![點擊 Pricing Calculator](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/31ab5547-fa7d-4abd-b41a-7b4bbc0401f7/ascreenshot_f7f8b098ceba4b5199e5cbc60dddfd0a_text_export.jpeg)

### 步驟 4：選取模型 {#step-4-select-a-model}

點擊 **Model** 下拉選單以選取您要估算成本的模型。

![點擊 Model 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/a6c236ce-3154-42a8-9701-120e3f7a017b/ascreenshot_635c61b832594e809f8ab79b5b3f32e1_text_export.jpeg)

從清單中選擇一個模型。顯示的模型是您在 LiteLLM proxy 上已設定的模型。

![選擇模型](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/96c4ebc4-1b88-4dea-b3b2-ea32fde36d9e/ascreenshot_7c2920f05a984ebbb530a8a85e669537_text_export.jpeg)

### 步驟 5：設定 token 數量 {#step-5-configure-token-counts}

輸入預期的 **Input Tokens (per request)** - 這是您提示中的平均 token 數。

![點擊 Input Tokens 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/d0b5ad8a-56e4-4f73-ac66-e1d728c81dc5/ascreenshot_42502082d6204a3891e0a2c3e89a1e38_text_export.jpeg)

輸入預期的 **Output Tokens (per request)** - 這是模型回應中的平均 token 數。

![點擊 Output Tokens 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/d7481177-c63c-47f5-9316-1e87695f67f9/ascreenshot_8718cac4c0d14a82ab9f2b71795250c2_text_export.jpeg)

### 步驟 6：設定請求量 {#step-6-set-request-volume}

輸入您預期的請求量。您可以指定 **Requests per Day** 和/或 **Requests per Month**。

![點擊 Requests per Month 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/42270e11-93f1-41dc-b9c7-3bb6971ced31/ascreenshot_79f2ea9937b34e48ab1ff832ce7f7cb7_text_export.jpeg)

例如，輸入 `10000000` 代表每月 1,000 萬個請求。

![輸入請求量](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/5e6c4338-ff87-44dd-9059-7577217fa3c8/ascreenshot_15c36610dc914536ac9446470eb39f05_text_export.jpeg)

### 步驟 7：查看成本估算 {#step-7-view-cost-estimates}

您一變更數值，計算器就會自動更新。查看成本明細，包括：

- **Per-Request Cost** - 每個請求的總成本、輸入成本、輸出成本，以及利潤/費用
- **Daily Costs** - 如果您指定了每日請求數，則顯示彙總後的成本
- **Monthly Costs** - 如果您指定了每月請求數，則顯示彙總後的成本

![查看成本預估](https://colony-recorder.s3.amazonaws.com/files/2026-01-05/4436cd11-df58-47cb-9742-c0d08865a61c/ascreenshot_f961298a4231464ea841bc4d184f731e_text_export.jpeg)

### 步驟 8：匯出報告 {#step-8-export-the-report}

點擊 **Export** 按鈕下載您的成本估算。您可以匯出為：

- **PDF** - 開啟列印對話框以另存為 PDF（非常適合與利害關係人分享）
- **CSV** - 下載可供試算表使用的檔案，以便進一步分析

## 成本明細詳情 {#cost-breakdown-details}

價格計算器會顯示：

| 欄位 | 說明 |
|-------|-------------|
| **Total Cost** | 包含任何已設定利潤的完整成本 |
| **Input Cost** | 輸入/prompt token 的成本 |
| **Output Cost** | 輸出/completion token 的成本 |
| **Margin/Fee** | 任何已設定的 [provider margins](/docs/proxy/provider_margins) |
| **Token Pricing** | 每個 token 的費率（以 $/1M tokens 顯示） |

## API 端點 {#api-endpoint}

您也可以使用 `/cost/estimate` 端點以程式化方式估算成本：

```bash
curl -X POST "http://localhost:4000/cost/estimate" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "input_tokens": 1000,
    "output_tokens": 500,
    "num_requests_per_day": 1000,
    "num_requests_per_month": 30000
  }'
```

**回應：**
```json
{
  "model": "gpt-4",
  "input_tokens": 1000,
  "output_tokens": 500,
  "num_requests_per_day": 1000,
  "num_requests_per_month": 30000,
  "cost_per_request": 0.045,
  "input_cost_per_request": 0.03,
  "output_cost_per_request": 0.015,
  "margin_cost_per_request": 0.0,
  "daily_cost": 45.0,
  "daily_input_cost": 30.0,
  "daily_output_cost": 15.0,
  "daily_margin_cost": 0.0,
  "monthly_cost": 1350.0,
  "monthly_input_cost": 900.0,
  "monthly_output_cost": 450.0,
  "monthly_margin_cost": 0.0,
  "input_cost_per_token": 3e-05,
  "output_cost_per_token": 6e-05,
  "provider": "openai"
}
```

## 相關功能 {#related-features}

- [Provider Margins](/docs/proxy/provider_margins) - 為 LLM 成本加上費用或利潤
- [Provider Discounts](/docs/proxy/provider_discounts) - 套用提供者成本折扣
- [Cost Tracking](/docs/proxy/cost_tracking) - 追蹤與監控 LLM 支出
