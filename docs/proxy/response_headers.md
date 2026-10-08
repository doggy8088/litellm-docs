# 回應標頭 {#response-headers}

當您向 proxy 發出請求時，proxy 會回傳以下標頭：

## 速率限制標頭 {#rate-limit-headers}
[與 OpenAI 相容的標頭](https://platform.openai.com/docs/guides/rate-limits/rate-limits-in-headers)：

| 標頭 | 類型 | 說明 |
|--------|------|-------------|
| `x-ratelimit-remaining-requests` | Optional[int] | 在耗盡速率限制前，仍允許的剩餘請求數 |
| `x-ratelimit-remaining-tokens` | Optional[int] | 在耗盡速率限制前，仍允許的剩餘 token 數 |
| `x-ratelimit-limit-requests` | Optional[int] | 在耗盡速率限制前，允許的最大請求數 |
| `x-ratelimit-limit-tokens` | Optional[int] | 在耗盡速率限制前，允許的最大 token 數 |
| `x-ratelimit-reset-requests` | Optional[int] | 速率限制將重設的時間 |
| `x-ratelimit-reset-tokens` | Optional[int] | 速率限制將重設的時間 |

### 速率限制標頭的運作方式 {#how-rate-limit-headers-work}

**如果 key 已設定速率限制**

proxy 會回傳 [該 key 的剩餘速率限制](https://github.com/BerriAI/litellm/blob/bfa95538190575f7f317db2d9598fc9a82275492/litellm/proxy/hooks/parallel_request_limiter.py#L778)。

**如果 key 未設定速率限制**

proxy 會回傳後端提供者回傳的剩餘請求／token。（LiteLLM 會將後端提供者的回應標頭標準化，以符合 OpenAI 格式）

如果後端提供者未回傳這些標頭，值將為 `None`。

這些標頭可協助用戶端了解目前的速率限制狀態，並據此調整其請求速率。

## 延遲標頭 {#latency-headers}
| 標頭 | 類型 | 說明 |
|--------|------|-------------|
| `x-litellm-response-duration-ms` | float | 從請求到達 LiteLLM Proxy 的那一刻起，到回傳給用戶端的那一刻止的總耗時。 |
| `x-litellm-overhead-duration-ms` | float | LiteLLM 處理額外負擔（毫秒） |

## 重試、備援標頭 {#retry-fallback-headers}
| 標頭 | 類型 | 說明 |
|--------|------|-------------|
| `x-litellm-attempted-retries` | int | 已進行的重試次數 |
| `x-litellm-max-retries` | int | 已設定的 `num_retries`，僅在至少嘗試過一次重試時才會送出 |
| `x-litellm-attempted-fallbacks` | int | 已進行的備援次數 |

`max_fallbacks` 不會以回應標頭返回

## 成本追蹤標頭 {#cost-tracking-headers}
| 標頭 | 類型 | 說明 | Pass-Through 端點可用 |
|--------|------|-------------|-------------|
| `x-litellm-response-cost` | float | API 呼叫的成本 | |
| `x-litellm-response-cost-input` | float | 未快取的輸入成本組成 | |
| `x-litellm-response-cost-output` | float | 輸出成本組成，包含 reasoning | |
| `x-litellm-response-cost-cache-read` | float | 提示詞快取讀取成本組成 | |
| `x-litellm-response-cost-cache-creation` | float | 提示詞快取寫入成本組成 | |
| `x-litellm-response-cost-reasoning` | float | reasoning 成本，為輸出組成的一部分 | |
| `x-litellm-response-cost-tool-usage` | float | 內建工具成本組成 | |
| `x-litellm-key-spend` | float | 該 API 金鑰的總支出 | ✅ |

各組成標頭加總即為總計：input + cache read + cache creation + output + tool usage = `x-litellm-response-cost`。reasoning 已包含在 output 內，因此請從加總中排除。cache 與 reasoning 標頭僅在這些成本不為零時才會出現，而組成標頭僅會出現在非串流回應中

## LiteLLM 專用標頭 {#litellm-specific-headers}
| 標頭 | 類型 | 說明 | Pass-Through 端點可用 |
|--------|------|-------------|-------------|
| `x-litellm-call-id` | string | 此請求的 Id。搭配 `general_settings.include_call_id_in_error_body: true` 時，也會以 `litellm_call_id` 的形式出現在 JSON 錯誤主體中（[詳細資料](./error_reference.md#reporting-a-problem)） | ✅ |
| `x-litellm-model-id` | string | 部署 id（`model_info.id`） | |
| `x-litellm-model-api-base` | string | API base URL | ✅ |
| `x-litellm-version` | string | LiteLLM 版本 | |
| `x-litellm-model-group` | string | 已路由的 `model_list[].model_name`（client `model`） | |

### 範例 {#example}

```yaml
model_list:
  - model_name: my-chat-model          # clients call this
    litellm_params:
      model: {{openai_small}}               # LiteLLM calls this upstream
    model_info:
      id: "7c9f2a1b3d8e4f0a2c6b5d9e1f3a7b8c"   # optional; auto-generated if omitted
```

| 標頭 | 範例 | 備註 |
|--------|---------|-------|
| `x-litellm-model-group` | `my-chat-model` | `model_name` / request `model`；不是 `litellm_params.model`。 |
| `x-litellm-model-id` | `7c9f2a1b3d8e4f0a2c6b5d9e1f3a7b8c` | 哪一列部署；與 `/v1/model/info?litellm_model_id=...` 搭配使用。 |
| Response body `model` | often `my-chat-model` | 通常會重新標記以符合 client；上游 id 仍保留在設定中。 |

### 自動路由的請求 {#auto-routed-requests}

對於送往 [自動路由器](./auto_routing.md) 的請求，主體 `model` 是用戶端呼叫的路由別名，而上方標頭仍會標示實際回應的部署。無法讀取回應標頭的用戶端（包括串流消費者）可以在路由器上設定 `return_raw_model_name`，改為在主體 `model` 欄位中取得已選取的 tier；請參閱[從回應讀取已選取的模型](./auto_routing.md#reading-the-picked-model-from-the-response)。

複雜度自動路由器也會將記錄的路由決策作為回應標頭返回：

| 標頭 | 類型 | 說明 |
|--------|------|-------------|
| `x-litellm-complexity-router-tier` | string | 已選取的複雜度 tier |
| `x-litellm-complexity-router-cause` | string | 選取該 tier 的路由機制，例如 `heuristic_scorer`、`heuristic_v2`、`llm_classifier`，或關鍵字規則 |
| `x-litellm-complexity-router-score` | float | 已記錄的啟發式分數 |
| `x-litellm-complexity-router-reasoning-effort` | string | 套用於所選 tier 的 `reasoning_effort` |

只有當其值存在於成功嘗試的已記錄路由決策中時，每個標頭才會出現。對於未記錄分數的路由（包括關鍵字與 LLM 分類器決策），分數會省略。reasoning-effort 標頭會回報所選 tier 設定的覆寫值；它不會回報模型的預設 effort 或分類器模型的 reasoning effort。無效或非 ASCII 文字值會被省略。原始啟發式訊號、相符的關鍵字，以及完整的 tier 參數對映都不會公開

這些標頭可用於傳送至 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages` 的串流與非串流請求。若在備援到一般模型群組後，這些標頭會消失。HTTP 標頭在串流一旦提交後便無法變更

### 更多範例（示意） {#more-examples-illustrative}

| 標頭 | 範例 | 含義 |
|--------|---------|---------|
| `x-litellm-response-cost` | `0.000214` | 此次呼叫（USD）。 |
| `x-litellm-key-spend` | `12.847` | 此次呼叫後的 key 總計。 |
| `x-litellm-response-duration-ms` | `842.3` | Proxy 端到端（ms）。 |
| `x-litellm-overhead-duration-ms` | `15.1` | LiteLLM 額外負擔（ms）。 |
| `x-litellm-attempted-retries` | `0` | 重試。 |
| `x-litellm-attempted-fallbacks` | `1` | 備援到另一個部署。 |
| `x-litellm-call-id` | `019b2c4d-e5f6-7890-abcd-ef1234567890` | 記錄／追蹤。 |
| `x-litellm-version` | `1.55.3` | 版本。 |
| `x-litellm-model-api-base` | `https://api.openai.com/v1` | 提供者 base（不含 query string）。 |

## 來自 LLM 提供者的回應標頭 {#response-headers-from-llm-providers}

LiteLLM 也會回傳來自 LLM 提供者的原始回應標頭。這些標頭會以前綴 `llm_provider-` 標示，以便與 LiteLLM 的標頭區分。

回應標頭範例：
```
llm_provider-openai-processing-ms: 256
llm_provider-openai-version: 2020-10-01
llm_provider-x-ratelimit-limit-requests: 30000
llm_provider-x-ratelimit-limit-tokens: 150000000
```
