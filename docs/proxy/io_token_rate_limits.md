# [Beta] 分離 ITPM / OTPM 速率限制 {#beta-separate-itpm--otpm-rate-limits}

在路由器部署上分別強制執行 **每分鐘輸入 token 數（ITPM）** 與 **每分鐘輸出 token 數（OTPM）**。

當提供者公布分開的輸入／輸出吞吐量限制時（例如 Bedrock Mantle model cards），請使用此功能，而不是單一合併的 TPM。

:::info
這使用與 [合併 TPM/RPM 強制執行](./load_balancing#enforce-model-rate-limits) 相同的 `enforce_model_rate_limits` 請求前檢查。請在部署上設定 `itpm` / `otpm`，而不是 `tpm` / `rpm`。
:::

## 快速開始 {#quick-start}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-oss-120b
    litellm_params:
      model: bedrock_mantle/openai.gpt-oss-120b
      aws_region_name: us-east-1
      itpm: 500000   # 500K input tokens per minute
      otpm: 100000   # 100K output tokens per minute

router_settings:
  optional_pre_call_checks:
    - enforce_model_rate_limits
```

啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

將 `itpm` / `otpm` 設為您提供者配額或 model card 中的值（Bedrock Mantle 的 Service Quotas console，或您內部的容量規劃）。

## Mantle 風格保留 {#mantle-style-reservation}

LiteLLM 遵循與 [Bedrock Mantle endpoint](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas-mantle.html) 相同的保留模型：token 限制會在**上游請求前**強制執行，然後在回應後重新對帳。

### 請求前（准入） {#pre-call-admission}

在請求送出給提供者之前：

1. **估算輸入 token 數**，來源為請求本文（`messages`、`prompt`，或 Responses `input`）。
2. **決定有效的輸出上限**——在檢查配額時，作為 `max_tokens` 的替代值：

| 優先順序 | 來源 | 範例 (`openai.gpt-oss-120b`) |
| --- | --- | --- |
| 1 | 請求 `max_tokens` 或 `max_completion_tokens` | 用戶端送出 `max_tokens: 1024` → 使用 `1024` |
| 2 | Model map `max_output_tokens`（fallback `max_tokens`） | 用戶端未指定上限 → 使用 model card 中的 `32768` |
| 3 | 硬性預設值 | 未知模型 → `4096` |

3. **ITPM 檢查：** 針對部署 ITPM 限制保留 `estimated_input + effective_output_cap`。若准入會超出限制，則以 `429` 阻擋。
4. **OTPM 檢查：** 確保 `current_otpm + effective_output_cap` 符合 OTPM 限制。若會超出 OTPM，則回滾 ITPM 保留並回傳 `429`。

這與 Mantle 相同：當用戶端省略 `max_tokens` 時，LiteLLM 會假設 model 的**最大輸出容量**，而不是其輸入 context window。這就是為什麼在大型模型上缺少 `max_tokens`，可能會保留大量 ITPM/OTPM 餘裕。

:::tip
將 `max_tokens`（或 Responses 上的 `max_output_tokens`）設得接近您預期的 completion 大小。Mantle 和 LiteLLM 都會在回應後向下重新對帳，但過高的預設上限仍會在請求完成前阻擋並行請求。
:::

### 請求後（重新對帳） {#post-call-reconciliation}

在成功回應後：

| 計數器 | 記錄內容 |
| --- | --- |
| **ITPM** | 以 `billable_input + completion_tokens` 取代請求前的保留，其中 `billable_input = prompt_tokens - cached_tokens` |
| **OTPM** | 加上實際 `completion_tokens` |

如果請求在完成前**失敗**，ITPM 保留會退還；OTPM 不會計費。

### 具體範例 {#worked-example}

對 `bedrock_mantle/openai.gpt-oss-120b`（`max_output_tokens: 32768`）的請求，未提供 `max_tokens`，`itpm: 500000`：

| 步驟 | 計算 | ITPM 使用量 |
| --- | --- | --- |
| 請求前保留 | `12` 輸入估算 + `32768` 輸出上限 | 保留 `32780` |
| 回應 | `prompt_tokens=10`、`completion_tokens=150`、無快取 | — |
| 請求後重新對帳 | `10 + 150` | `160` 最終 |

如果沒有明確的 `max_tokens`，請求前的保留會比最終計費大得多——這與 Mantle 文件對配額保留的行為相同。

## 運作方式 {#how-it-works}

| 階段 | ITPM | OTPM |
| --- | --- | --- |
| **請求前** | 保留 `estimated_input + effective_output_cap` | 檢查 `current_otpm + effective_output_cap` |
| **請求後** | 重新對帳為 `billable_input + completion_tokens` | 加上實際 `completion_tokens` |
| **失敗** | 退還 ITPM 保留 | 不收取 OTPM |

**已快取的 prompt tokens**（`prompt_tokens_details.cached_tokens`）在回應後會自 ITPM 計費中排除。

## 回應標頭 {#response-headers}

當某個 model group 已設定 `itpm` 或 `otpm` 時，LiteLLM 會回傳：

| 標頭 | 說明 |
| --- | --- |
| `x-ratelimit-limit-input-tokens` | 該 model group 的 ITPM 限制 |
| `x-ratelimit-remaining-input-tokens` | 本分鐘剩餘的 ITPM 容量 |
| `x-ratelimit-reset-input-tokens` | 直到分鐘視窗重設還有幾秒 |
| `x-ratelimit-limit-output-tokens` | 該 model group 的 OTPM 限制 |
| `x-ratelimit-remaining-output-tokens` | 本分鐘剩餘的 OTPM 容量 |
| `x-ratelimit-reset-output-tokens` | 直到分鐘視窗重設還有幾秒 |

## 錯誤回應 {#error-response}

當上游請求前超出限制時：

```json
{
  "error": {
    "message": "Model rate limit exceeded. ITPM limit=500000, current usage=500120",
    "type": "rate_limit_error",
    "code": 429
  }
}
```

回應會包含 `retry-after` 標頭（距離目前分鐘視窗重設還有幾秒）。

## ITPM 與 TPM {#itpm-vs-tpm}

| 設定 | 限制內容 | 使用時機 |
| --- | --- | --- |
| `tpm` | 每分鐘總 token 數（單一計數器） | 舊版合併吞吐量限制 |
| `itpm` + `otpm` | 分別限制輸入與輸出 | 具有明確輸入／輸出 TPM 的提供者文件（Bedrock Mantle） |

請**不要**在同一個部署上同時設定兩種模式。如果存在 `itpm` 或 `otpm`，LiteLLM 會使用 ITPM/OTPM 路徑，並忽略該部署的合併 TPM 追蹤。

## 多實例部署 {#multi-instance-deployment}

使用 Redis 在 proxy 複本之間共享計數器：

```yaml showLineNumbers title="config.yaml"
router_settings:
  optional_pre_call_checks:
    - enforce_model_rate_limits
  redis_host: redis.example.com
  redis_port: 6379
  redis_password: your-password
```

## SDK 使用方式 {#sdk-usage}

```python showLineNumbers title="example.py"
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "gpt-oss-120b",
            "litellm_params": {
                "model": "bedrock_mantle/openai.gpt-oss-120b",
                "itpm": 500_000,
                "otpm": 100_000,
            },
        }
    ],
    optional_pre_call_checks=["enforce_model_rate_limits"],
)

response = await router.acompletion(
    model="gpt-oss-120b",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=1024,  # explicit cap avoids over-reserving model max_output_tokens
)
```

## 相關內容 {#related}

- [負載平衡 + 合併 TPM/RPM 強制執行](./load_balancing#enforce-model-rate-limits)
- [動態 TPM/RPM 配置](./dynamic_rate_limit)
- [Bedrock Mantle 配額（AWS）](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas-mantle.html)
