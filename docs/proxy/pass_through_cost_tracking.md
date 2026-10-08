# 透傳成本與用量追蹤 {#pass-through-cost--usage-tracking}

有些透傳目標會在內部將單一 HTTP 請求展開成多個模型請求。LiteLLM 無法從回應本文為這些請求定價，所以在這個合約存在之前，它們會以零成本、零 token 記入支出記錄

目標可以改為透過兩個回應標頭回報整個請求的總計。LiteLLM 會記錄它所回報的內容，不會重新計算

## 標頭 {#the-headers}

| 標頭 | 格式 | 意義 |
| --- | --- | --- |
| `x-litellm-response-cost` | 十進位字串，USD | 此請求跨所有內部模型呼叫的總成本，例如 `0.000415` |
| `x-litellm-total-tokens` | 整數字串 | 此請求跨所有內部模型呼叫的總 token 數，例如 `1874` |

每個 HTTP 請求送出一個總計。沒有逐模型明細，而回報的值具有權威性

## 快速開始 {#quick-start}

照常定義透傳端點。設定中沒有任何內容會啟用此合約；只要目標送出這些標頭，LiteLLM 就會讀取它們

```yaml
general_settings:
  pass_through_endpoints:
    - path: "/internal-api"
      target: "https://internal-api.example.com/v1/answer"
      include_subpath: true
      headers:
        Authorization: "Bearer os.environ/INTERNAL_API_TOKEN"
```

透過 proxy 並使用您的 LiteLLM 金鑰來呼叫它：

```shell
curl -i -X POST 'http://localhost:4000/internal-api/summarize' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"document_id": "doc-9931"}'
```

讓目標回覆它計算出的總計：

```
HTTP/1.1 200 OK
content-type: application/json
x-litellm-response-cost: 0.000415
x-litellm-total-tokens: 1874
```

LiteLLM 會將 `0.000415` 和 `1874` 記入呼叫的金鑰、團隊與使用者，這些值會顯示在支出記錄與用量儀表板上，並與該金鑰的其餘流量一同呈現

## LiteLLM 記錄哪些內容 {#what-litellm-records}

回報的值會照原樣寫入。LiteLLM 會解析它們、檢查其合理性，且不會在其上方再重新計算任何自己的成本

只有目標實際回報的值才會被寫入。若某目標送出成本但沒有 token 數，則會保留 LiteLLM 自行推導出的 token 數，不會將其歸零。若某目標兩個標頭都沒有送出，則會完全不受影響，這是 Anthropic 或 Vertex AI 等提供者透傳路由的正常情況，在這些情況下 LiteLLM 會從回應本文推導成本

## 驗證 {#validation}

任何未通過以下任一檢查的值都會被視為未回報，並且會在 proxy 記錄中寫入警告，指出標頭名稱與有問題的值

| 標頭 | 接受 | 拒絕 |
| --- | --- | --- |
| `x-litellm-response-cost` | 任何有限且非負的十進位數，包括 `0` | 無法解析的文字、負值、`inf`、`nan` |
| `x-litellm-total-tokens` | 任何非負整數，包括 `0` | 無法解析的文字、負值 |

明確的 `0` 是真實值，而不是缺失值，因此即使總計為零，也請同時送出兩個標頭

## 錯誤回應 {#error-responses}

無論狀態碼為何，系統都會在每個上游回應上讀取這些標頭。若某請求在失敗前已消耗 token，仍會將其支出記入失敗列，而不是因為具有 4xx 或 5xx 狀態就被捨棄。只要仍產生成本，錯誤回應也請一併送出這些標頭

在失敗列上，缺失或無法使用的值會被記錄為 `0`

## 優先於 `cost_per_request` {#precedence-over-cost_per_request}

會為其自身請求定價的目標，永遠優先於在端點上設定的固定 [`cost_per_request`](./pass_through.md) 估算值。每個由設定定義的端點上，`cost_per_request` 預設為 `0.0`，因此若遵從它，就會將目標剛回報的真實成本歸零

即使回報的值無法解析，情況仍然相同。系統會記錄 `0`，而不是採用與目標回報相矛盾的估算值來計費

## 速率限制與預算 {#rate-limits-and-budgets}

回報的 token 會與呼叫端流量的其他部分一樣，套用相同的 TPM 視窗，因此金鑰或團隊無法僅透過透傳流量來超過其共用 token 限額。在此合約出現之前，透傳用量從未進入 token 視窗，因為速率限制器只會從它能辨識的回應結構讀取用量

已記錄的成本會像任何其他請求的成本一樣計入預算

## 串流 {#streaming}

串流目標可以運作，因為回應標頭會在本文之前到達。若某目標必須等到串流結束後才知道最終成本，就無法透過此合約回報，因為屆時標頭早已在傳輸路徑上

## 讀回這些值 {#reading-the-values-back}

上游回應標頭會透傳給呼叫端客戶端，因此呼叫端會看到與一般 API 相同的 `x-litellm-response-cost` 形式。LiteLLM 會在送出時加上 `x-litellm-call-id`，這是用來在比對單一請求時與支出記錄核對的值
