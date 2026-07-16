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
| `x-litellm-attempted-retries` | int | 已執行的重試次數 |
| `x-litellm-attempted-fallbacks` | int | 已執行的備援次數 |
| `x-litellm-max-fallbacks` | int | 允許的最大備援次數 |

## 成本追蹤標頭 {#cost-tracking-headers}
| 標頭 | 類型 | 說明 | 可用於直通端點 |
|--------|------|-------------|-------------|
| `x-litellm-response-cost` | float | API 呼叫成本 | |
| `x-litellm-key-spend` | float | 該 API 金鑰的總支出 | ✅ |

## LiteLLM 特定標頭 {#litellm-specific-headers}
| 標頭 | 類型 | 說明 | 可用於直通端點 |
|--------|------|-------------|-------------|
| `x-litellm-call-id` | string | 此請求的 ID | ✅ |
| `x-litellm-model-id` | string | 部署 ID (`model_info.id`) | |
| `x-litellm-model-api-base` | string | API base URL | ✅ |
| `x-litellm-version` | string | LiteLLM 版本 | |
| `x-litellm-model-group` | string | 已路由的 `model_list[].model_name`（client `model`）| |

### 範例 {#example}

```yaml
model_list:
  - model_name: my-chat-model          # clients call this
    litellm_params:
      model: gpt-4o-mini               # LiteLLM calls this upstream
    model_info:
      id: "7c9f2a1b3d8e4f0a2c6b5d9e1f3a7b8c"   # optional; auto-generated if omitted
```

| 標頭 | 範例 | 備註 |
|--------|---------|-------|
| `x-litellm-model-group` | `my-chat-model` | `model_name` / request `model`；不是 `litellm_params.model`。 |
| `x-litellm-model-id` | `7c9f2a1b3d8e4f0a2c6b5d9e1f3a7b8c` | 哪一列部署；與 `/v1/model/info?litellm_model_id=...` 搭配使用。 |
| Response body `model` | often `my-chat-model` | 通常會重新標記以符合 client；上游 id 仍保留在設定中。 |

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
