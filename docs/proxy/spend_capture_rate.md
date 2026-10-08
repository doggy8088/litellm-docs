---
title: Spend Capture Rate
description: 比較 LiteLLM 為 OpenAI 追蹤的支出與 OpenAI 針對相同日期開立帳單的金額，並可透過附有 Slack 警示與 Prometheus gauge 的排程執行，或透過管理端點按需執行。
---

# 支出擷取率 {#spend-capture-rate}

:::info
支出擷取率檢查會在即將推出的版本中提供，因此目前尚未包含在現行穩定版中
:::

擷取率檢查會比較 LiteLLM 為某個提供者追蹤的支出，與該提供者針對相同 UTC 日期所開立帳單的金額，並告訴您帳單中有多少比例是透過 LiteLLM：

```
capture_rate = captured_spend / provider_spend
```

1.0 的比率表示提供者開立帳單的每一美元都經由 LiteLLM，且已完成定價。低於 1.0 表示請求是透過 LiteLLM 之外的路徑到達提供者（直接 API 金鑰、其他閘道），或是 LiteLLM 的成本追蹤遺漏了支出。高於 1.0 表示 LiteLLM 的定價高於帳單金額

此版本僅內建 OpenAI。LiteLLM 端是 `LiteLLM_DailyUserSpend` 資料表，依 `custom_llm_provider` 值 `openai` 與 `text-completion-openai` 加總。OpenAI 端是
[Organization Costs API](https://platform.openai.com/docs/api-reference/usage/costs)
（`GET https://api.openai.com/v1/organization/costs` 搭配 `bucket_width=1d`），以 OpenAI Admin API 金鑰讀取。
對於其他所有提供者，手動比對方式仍請參考 [Debugging a cost discrepancy](../troubleshoot/cost_discrepancy)

## 設定 {#setup}

請在
[platform.openai.com/settings/organization/admin-keys](https://platform.openai.com/settings/organization/admin-keys)
建立一組 Admin API 金鑰。唯讀的 admin 金鑰即可。將其設定到 proxy 上作為 `OPENAI_ADMIN_KEY`：

```bash
export OPENAI_ADMIN_KEY="sk-admin-..."
```

這個金鑰與您的部署所使用的 `OPENAI_API_KEY` 是分開的。它只會讀取計費資料，絕不會提供請求。此檢查也需要 proxy 資料庫，因為擷取到的支出來自 `LiteLLM_DailyUserSpend`

## 排程檢查 {#scheduled-check}

在 `general_settings` 下啟用每日檢查：

```yaml
general_settings:
  spend_capture_rate_check:
    providers: ["openai"]        # default ["openai"], the only value today
    threshold: 0.9               # default 0.9, alert when the rate over the window is under it
    lookback_days: 7             # default 7, window is the closed UTC days before today (yesterday back), 1 to 180
    openai_project_ids: []       # optional, scope the OpenAI bill to these project ids; default is the whole organization
```

| Key | Default | 作用 |
| --- | --- | --- |
| `providers` | `["openai"]` | 要檢查的提供者。今天只有 `openai` 這個值 |
| `threshold` | `0.9` | 當窗口內的比率低於此值時發出警示。大於 0 且最多 1 |
| `lookback_days` | `7` | 要比較的已結束 UTC 日期，從昨天往回算。1 到 180 |
| `openai_project_ids` | `[]` | 用來限制帳單範圍的 OpenAI 專案 ids。留空表示整個組織。擷取到的支出不會套用範圍，因此請列出 LiteLLM 的 OpenAI 金鑰所屬的每個專案 |

未知的 key 或超出範圍的值會以驗證錯誤使 proxy 啟動失敗，因此拼字錯誤不會悄悄地以預設值執行。此區段會在每次執行前再次讀取，因此透過資料庫設定重新載入而到達的變更，會在下一次執行時生效且不需重新啟動；而以這種方式到達的無效值，則會以相同的驗證錯誤在 proxy 記錄中使該次執行失敗

此工作每天在 UTC 01:15 執行，且在 proxy 啟動約兩分鐘後也會執行一次，讓您在啟用後立刻取得第一次讀數。它會在每個複本的每個 worker process 中執行，因此每個 process 都會設定自己的 Prometheus gauge。當 Redis 已設定時，若某個複本已完成的檢查有需要警示的內容，該複本會取得一個跨複本鎖，持有 15 分鐘，只有取得鎖的複本會送出警示，因此低於門檻的窗口只會產生一則警示，而不是每個 worker 各一則。若某個複本的檢查在中途失敗，它就不會取得鎖，因此無法讓另一個已完成檢查的複本靜音。若沒有 Redis，或無法讀取鎖，每個複本都會發出警示，因為漏掉一則警示的代價高於重複警示

此檢查會將比率發布到 Prometheus，並透過 proxy 設定的 [alerting](./alerting) 發出警示（alert 類型 `failed_tracking_spend`，等級 High），條件包括：窗口內的比率低於門檻、proxy 未設定 `OPENAI_ADMIN_KEY`，或無法讀取 OpenAI costs API。警示會標示比率、門檻、已擷取與已開立帳單的美元金額，以及日期範圍，並連回此頁面

當 OpenAI 沒有開立任何金額的窗口，不會有比率：gauge 會設為 `NaN`，且不會發出警示。高於 1.0 的比率會被發布，但永遠不會發出警示

## Prometheus gauge {#prometheus-gauge}

啟用 `litellm_settings.callbacks: ["prometheus"]`（請參閱 [Prometheus metrics](./prometheus)）時，排程檢查會發布一個 gauge：

| Metric | Labels | Value |
| --- | --- | --- |
| `litellm_spend_capture_rate` | `api_provider` | 檢查窗口內的比率。當上一次檢查沒有產生比率時為 `NaN` |

只有排程檢查會設定這個 gauge。下面的按需端點不會碰它。產生過但沒有比率的檢查（OpenAI 沒有開立帳單、`OPENAI_ADMIN_KEY` 未設定，或無法讀取 costs API）會將其設為 `NaN`，而不是保留最後一個正常值，因此過期的比率不會被視為目前值。`NaN` 在 PromQL 中會比對為 false，因此下面的規則不會對它觸發；缺少金鑰與無法讀取帳單的情況則會透過 proxy 自身的警示送達您

只要有資料庫與 Prometheus callback，gauge 就會存在於每個 proxy 上，即使未設定 `spend_capture_rate_check` 也是如此：此時工作會針對每個支援的提供者將其設為 `NaN`，因此以該 metric name 為鍵的儀表板或規則，會在檢查啟用前就找到該序列。設定 `prometheus_metrics_config` 時，必須在群組下列出 `litellm_spend_capture_rate`，否則不會發出。透過 `api_provider` 排除 `prometheus_exclude_labels` 後，gauge 就沒有標籤，支援的那個提供者只會有一個序列

當比率持續低於 0.9 滿一小時時觸發的 Prometheus 警示規則：

```yaml
groups:
  - name: litellm-spend-capture-rate
    rules:
      - alert: LiteLLMSpendCaptureRateLow
        expr: litellm_spend_capture_rate < 0.9
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "LiteLLM is capturing under 90% of the OpenAI bill"
          description: "Spend is reaching OpenAI outside LiteLLM, or cost tracking is dropping it. See https://docs.litellm.ai/docs/proxy/spend_capture_rate"
```

## 按需檢查 {#check-on-demand}

`GET /spend/capture_rate` 會對任何日期範圍執行相同的比較，並回傳逐日明細。它需要 proxy admin 金鑰（`PROXY_ADMIN` 或 `PROXY_ADMIN_VIEW_ONLY`，請參閱 [Role-based access](./access_control)），且會即時讀取 OpenAI 帳單，因此 proxy 上必須設定 `OPENAI_ADMIN_KEY`

```bash
curl "http://localhost:4000/spend/capture_rate?provider=openai&start_date=2026-09-17&end_date=2026-09-23&threshold=0.9&project_ids=proj_a&project_ids=proj_b" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

| Query parameter | Required | Default | Meaning |
| --- | --- | --- | --- |
| `start_date` | yes | | 第一個 UTC 日期，`YYYY-MM-DD`，包含當日 |
| `end_date` | yes | | 最後一個 UTC 日期，`YYYY-MM-DD`，包含當日 |
| `provider` | no | `openai` | 要比較的提供者。今天只有 `openai` 這個值 |
| `threshold` | no | `0.9` | 低於此比率時，`below_threshold` 為 true。大於 0 且最多 1 |
| `project_ids` | no | | 用來限制帳單範圍的 OpenAI 專案 ids。可重複傳入多個。擷取到的支出不會套用範圍 |

回應：

```json
{
  "provider": "openai",
  "start_date": "2026-09-17",
  "end_date": "2026-09-23",
  "captured_spend": 812.4,
  "provider_spend": 903.1,
  "capture_rate": 0.8996,
  "threshold": 0.9,
  "below_threshold": true,
  "days": [
    {"date": "2026-09-17", "captured_spend": 120.1, "provider_spend": 130.0, "capture_rate": 0.9238},
    {"date": "2026-09-18", "captured_spend": 0.0, "provider_spend": 0.0, "capture_rate": null}
  ]
}
```

對於沒有帳單的日期，`capture_rate` 為 `null`；而當整個範圍內 OpenAI 都沒有開立帳單時，整個範圍的 `below_threshold` 為 `false`。回傳的值為計算結果，未經四捨五入

| Status | When |
| --- | --- |
| `400` | `end_date` 早於 `start_date`，或範圍超過 180 天 |
| `401` | 該金鑰不是 proxy admin |
| `422` | 某個查詢參數驗證失敗，例如格式錯誤的日期或落在 (0, 1] 之外的 `threshold` |
| `500` | proxy 沒有資料庫 |
| `502` | 無法讀取 OpenAI costs API。detail 會帶有 OpenAI 的狀態與訊息 |
| `503` | proxy 上未設定 `OPENAI_ADMIN_KEY` |

## 讀取數值 {#reading-the-number}

此比較是針對已結束的 UTC 日期。排程檢查永遠不包含今天，而包含今天的端點範圍在兩端都屬於部分資料，因此請將今天的列視為進行中，而不是缺口

OpenAI 帳單預設是整個組織範圍，除非 `openai_project_ids`（或端點上的 `project_ids`）將其限定範圍，而
已擷取的支出則始終是 LiteLLM 為 OpenAI 追蹤到的所有內容。只要組織中有任何流量不經由 LiteLLM，就會
單憑這個原因而低於 1.0。請將此檢查限定到 LiteLLM 金鑰所屬的每個專案（漏掉其中一個會讓比率看起來偏高，
因為其已擷取的支出仍會計入），或將差額視為直接流量的衡量，並向送出該流量的團隊提出

每個設定了 `custom_llm_provider: openai` 的部署都會被計入已擷取的支出，包括其
`api_base` 指向 OpenAI 相容伺服器（例如 vLLM 主機或另一個閘道） 的部署。這些支出永遠不會出現在
OpenAI 帳單上，因此會使比率膨脹。如果您希望這個比率只代表 OpenAI，請為那些部署指定自己的提供者，
例如 `hosted_vllm`

LiteLLM 會依據其自己的
[成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 來計價，因此任一方的價格變動都會改變比率，直到對照表趕上為止。若比率高於 1.0 且沒有直接流量，通常代表成本對照表中的某個項目高於 OpenAI 目前的收費

OpenAI 的成本 API 可能會比實際用量落後幾個小時，因此最近一天的數值在穩定前可能會偏低。這也是排程視窗停在昨天的另一個原因

其他提供者（Anthropic、Azure、Bedrock、Vertex AI）尚未串接。對於這些情況，請參閱
[除錯成本差異](../troubleshoot/cost_discrepancy)

## 另請參閱 {#see-also}

- [支出追蹤](./cost_tracking)
- [警示 / Webhooks](./alerting)
- [Prometheus 指標](./prometheus)
- [除錯成本差異](../troubleshoot/cost_discrepancy)
