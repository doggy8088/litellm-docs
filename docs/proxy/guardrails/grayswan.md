import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gray Swan Cygnal 防護欄 {#gray-swan-cygnal-guardrail}

使用 [Gray Swan Cygnal](https://docs.grayswan.ai/cygnal/monitor-requests) 持續監控對話中的政策違規、間接提示注入（IPI）、越獄嘗試，以及其他安全風險。

Cygnal 會回傳介於 `0` 和 `1` 之間的 `violation` 分數（分數越高表示越可能違反政策），以及違反規則索引、變異偵測和 IPI 標記等中繼資料。LiteLLM 可根據此訊號自動封鎖或監控請求。

---

## 快速開始 {#quick-start}

### 1. 取得憑證 {#1-obtain-credentials}

1. 登入我們的 Gray Swan 平台並產生 Cygnal API 金鑰。 

    現有客戶應已可存取我們的 [平台](https://platform.grayswan.ai)。

    新使用者請先到這個 [頁面](https://hubs.ly/Q03-sX1J0) 註冊，我們很樂意為您進行導入！

2. 為 LiteLLM proxy 主機設定環境變數：

    ```bash
    export GRAYSWAN_API_KEY="your-grayswan-key"
    export GRAYSWAN_API_BASE="https://api.grayswan.ai"
    ```

### 2. 設定 `config.yaml` {#2-configure-configyaml}

新增一個參照 Gray Swan 整合的防護欄項目。以下是我們建議的設定。

```yaml
model_list:                                 # this part is a standard litellm configuration for reference
  - model_name: openai/gpt-4.1-mini
    litellm_params:
      model: openai/gpt-4.1-mini
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "cygnal-monitor"
    litellm_params:
      guardrail: grayswan
      mode: [pre_call, post_call]            # monitor both input and output
      api_key: os.environ/GRAYSWAN_API_KEY
      api_base: os.environ/GRAYSWAN_API_BASE  # optional
      optional_params:
        on_flagged_action: passthrough         # or "block" or "monitor"
        violation_threshold: 0.5               # score >= threshold is flagged
        reasoning_mode: hybrid                 # off | hybrid | thinking
        policy_id: "your-cygnal-policy-id"     # Optional: Your Cygnal policy ID. Defaults to a content safety policy if empty.
      streaming_end_of_stream_only: true       # For streaming API, only send the assembled message to Cygnal (post_call only). Defaults to false.
      default_on: true
      guardrail_timeout: 30                   # Defaults to 30 seconds. Change accordingly.
      fail_open: true                         # Defaults to true; set to false to propagate guardrail errors.

general_settings:
  master_key: "your-litellm-master-key"

litellm_settings:
  set_verbose: true
```

### 3. 啟動 Proxy {#3-launch-the-proxy}

```bash
litellm --config config.yaml --port 4000
```

---

## 選擇防護欄模式 {#choosing-guardrail-modes}

Gray Swan 可在 `pre_call`、`during_call` 與 `post_call` 階段執行。請根據您的延遲與涵蓋範圍需求組合模式。 

| 模式         | 執行時機      | 防護範圍              | 典型使用情境 |
|--------------|-------------------|-----------------------|------------------|
| `pre_call`   | 在 LLM 呼叫前   | 僅使用者輸入       | 在提示注入到達模型前加以封鎖 |
| `during_call`| 與呼叫平行執行  | 僅使用者輸入       | 低延遲監控而不封鎖 |
| `post_call`  | 在回應後    | 模型輸出         | 掃描輸出中的政策違規、洩漏的秘密或 IPI |

當使用 `during_call` 搭配 `on_flagged_action: block` 或 `on_flagged_action: passthrough` 時：

- **LLM 呼叫會與防護欄檢查平行執行**，並使用 `asyncio.gather`
- 即使防護欄偵測到違規，**LLM tokens 仍會被消耗**
- 防護欄例外會阻止回應送達使用者，但**不會取消正在執行的 LLM 任務**
- 這表示您會支付完整的 LLM 成本，同時向使用者回傳錯誤/直通訊息

**建議：** 對於 `passthrough`（或 `block`）`on_flagged_action`，請使用 `pre_call` 與 `post_call`，不要使用 `during_call`（請參見上方我們建議的設定）。僅在您想要低延遲記錄且不影響使用者體驗時，才將 `during_call` 保留給 `monitor` 模式。

---

## 搭配 Claude Code {#work-with-claude-code}

請依照官方 litellm [指南](https://docs.litellm.ai/docs/tutorials/claude_responses_api) 設定 Claude Code 與 litellm，並將上述提到的防護欄部分加入您的 litellm 設定。Cygnal 原生支援 coding agent policies defense。您可以自行定義政策，或使用平台上提供的 coding policies。我們上方展示的範例設定也是 Claude Code 的建議設定（將 `policy_id` 替換為適當的值）。

---

## 透過 `extra_body` 進行每次請求覆寫 {#per-request-overrides-via-extra_body}

您可以透過傳遞 `litellm_metadata.guardrails[*].grayswan.extra_body`，在每次請求層級覆寫 Gray Swan 防護欄設定的部分內容。

`extra_body` 會合併到 Cygnal 請求本文中，並優先於來自 `config.yaml` 的特定欄位；這些欄位為 `policy_id`、`violation_threshold` 與 `reasoning_mode`。

如果您在 `extra_body` 中加入 `metadata` 欄位，它會原樣以請求本文的 `metadata` 欄位轉送至 Cygnal API。

範例：

```bash
curl -X POST "http://0.0.0.0:4000/v1/messages?beta=true" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "hello"}],
    "litellm_metadata": {
      "guardrails": [
        {
          "cygnal-monitor": {
            "extra_body": {
              "policy_id": "specific policy id you want to use",
              "metadata": {
                "user": "health-check"
              }
            }
          }
        }
      ]
    }
  }'
```

OpenAI 用戶端：

```python
from openai import OpenAI

client = OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")

resp = client.responses.create(
    model="openrouter/anthropic/claude-sonnet-4.5",
    input="hello",
    extra_body={
        "litellm_metadata": {
            "guardrails": [
                {
                    "cygnal-monitor": {
                        "extra_body": {
                            "policy_id": "69038214e5cdb6befc5e991e",
                            "metadata": {"trace_id": "trace-123"},
                        }
                    }
                }
            ]
        }
    },
)
```

Anthropic 用戶端：

```python
from anthropic import Anthropic

client = Anthropic(api_key="anything", base_url="http://0.0.0.0:4000")

resp = client.messages.create(
    model="openrouter/anthropic/claude-sonnet-4.5",
    max_tokens=256,
    messages=[{"role": "user", "content": "hello"}],
    extra_body={
        "litellm_metadata": {
            "guardrails": [
                {
                    "cygnal-monitor": {
                        "extra_body": {
                            "policy_id": "69038214e5cdb6befc5e991e",
                            "metadata": {"trace_id": "trace-123"},
                        }
                    }
                }
            ]
        }
    },
)
```

注意：

- 防護欄名稱（例如 `cygnal-monitor`）必須與 `config.yaml` 中的 `guardrail_name` 相符。
- 依據您的 proxy 設定，每次請求的防護欄覆寫可能需要付費授權。

---

## 設定參考 {#configuration-reference}

| 參數                             | 類型            | 說明 |
|---------------------------------------|-----------------|-------------|
| `api_key`                             | string          | Gray Swan Cygnal API 金鑰。若省略，則從 `GRAYSWAN_API_KEY` 讀取。 |
| `api_base`                            | string          | Gray Swan API base URL 的覆寫。預設為 `https://api.grayswan.ai` 或 `GRAYSWAN_API_BASE`。 |
| `mode`                                | string or list  | 防護欄階段（`pre_call`、`during_call`、`post_call`）。 |
| `optional_params.on_flagged_action`   | string          | `monitor`（僅記錄）、`block`（擲出 `HTTPException`），或 `passthrough`（以違規訊息取代回應內容，不回傳 400 錯誤）。 |
| `optional_params.violation_threshold` | number (0-1)    | 分數大於或等於此值視為違規。 |
| `optional_params.reasoning_mode`      | string          | `off`、`hybrid`，或 `thinking`。可啟用 Cygnal 的推理能力。 |
| `optional_params.categories`          | object          | 自訂類別名稱對應至描述的對照表。 |
| `optional_params.policy_id`           | string          | Gray Swan 政策識別碼。 |
| `guardrail_timeout`                   | number          | Cygnal 請求的逾時秒數。預設為 30。 |
| `fail_open`                           | boolean         | 若為 true，與 Cygnal 通訊時的錯誤會被記錄且請求會繼續；若為 false，錯誤會向上拋出。預設為 treu。 |
| `streaming_end_of_stream_only`        | boolean         | 對於串流 `post_call`，只將最終組合完成的回應送至 Cygnal。預設為 false。 |
| `default_on`                          | boolean         | 預設在每次請求上執行防護欄。 |
