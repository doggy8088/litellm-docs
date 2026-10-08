import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gray Swan Cygnal 防護欄 {#gray-swan-cygnal-guardrail}

使用 [Gray Swan Cygnal](https://docs.grayswan.ai/cygnal/monitor-requests) 持續監控對話中的政策違規、間接提示注入（IPI）、越獄嘗試，以及其他安全風險。

Cygnal 會回傳介於 `0` 與 `1` 之間的 `violation` 分數（分數越高表示越可能違反政策），以及如違反規則索引、變異偵測和 IPI 標記等中繼資料。LiteLLM 可根據此訊號自動封鎖或監控請求。

---

## 快速入門 {#quick-start}

### 1. 取得憑證 {#1-obtain-credentials}

1. 登入我們的 Gray Swan 平台並產生 Cygnal API 金鑰。 

    現有客戶應該已經可以存取我們的 [平台](https://platform.grayswan.ai)。

    新使用者請在此 [頁面](https://hubs.ly/Q03-sX1J0) 註冊，我們很樂意為您提供導入協助！

2. 為 LiteLLM proxy 主機設定環境變數：

    ```bash
    export GRAYSWAN_API_KEY="your-grayswan-key"
    export GRAYSWAN_API_BASE="https://api.grayswan.ai"
    ```

### 2. 設定 `config.yaml` {#2-configure-configyaml}

新增一個參照 Gray Swan 整合的 guardrail 項目。以下為我們建議的設定。

```yaml
model_list:                                 # this part is a standard litellm configuration for reference
  - model_name: openai/{{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
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

| 模式         | 執行時機      | 保護對象              | 典型使用情境 |
|--------------|-------------------|-----------------------|------------------|
| `pre_call`   | 在 LLM 呼叫之前   | 僅使用者輸入       | 在提示注入到達模型前加以阻擋 |
| `during_call`| 與呼叫平行執行  | 僅使用者輸入       | 低延遲監控且不封鎖 |
| `post_call`  | 在回應之後    | 模型輸出，並結合請求上下文判斷 | 掃描答案與工具呼叫中的政策違規、外洩密鑰或 IPI |

當使用 `during_call` 搭配 `on_flagged_action: block` 或 `on_flagged_action: passthrough` 時：

- **LLM 呼叫會與 guardrail 檢查平行執行**，並使用 `asyncio.gather`
- 即使 guardrail 偵測到違規，**仍會消耗 LLM token**
- guardrail 例外可阻止回應送達使用者，但**不會取消正在執行的 LLM 任務**
- 這表示您會支付完整的 LLM 成本，同時向使用者回傳錯誤／直通訊息

**建議：**對於 `passthrough`（或 `block`）`on_flagged_action`（請參閱上方我們建議的設定），請使用 `pre_call` 與 `post_call`，而不要使用 `during_call`。僅在您要低延遲記錄且不影響使用者體驗時，才在 `monitor` 模式下保留 `during_call`。

### Cygnal 在 `post_call` 接收什麼 {#what-cygnal-receives-on-post_call}

在 `post_call` 中，LiteLLM 會將請求對話傳送給 Cygnal，接著再傳送模型的答案，因此 Cygnal 可以判斷答案以及其中任何工具呼叫，是否能由先前內容支持。答案會包含其工具呼叫，且請求的 `tools` 定義會與訊息一併送出。這表示僅 `post_call` 的設定，也會將該請求的使用者提示與工具結果傳送給 Gray Swan。

只包含工具呼叫的答案也會被掃描。使用 `on_flagged_action: block` 時，被標記的工具呼叫會回傳 400，而不會送達用戶端；使用 `fail_open: false` 時，Cygnal 錯誤會以與文字答案相同的方式使請求失敗。

[skip flags](./quick_start#skip-system-messages-in-guardrail-evaluation) 會限制傳送的內容。`skip_system_message_in_guardrail` 與 `skip_tool_message_in_guardrail` 會將那些訊息從對話中移除，而 `scan_only_tool_results` 只保留工具結果，並省略請求 `tools`。模型的答案一律會被傳送。如果 LiteLLM 無法讀取某個端點的對話，Cygnal 只會收到答案本身。

在串流且沒有 `streaming_end_of_stream_only` 的情況下，每個抽樣區塊檢查都會帶有相同的對話，因此請將 `streaming_end_of_stream_only: true` 設為每個回應只送出一次。

---

## 與 Claude Code 搭配使用 {#work-with-claude-code}

請依照官方 litellm [指南](https://docs.litellm.ai/docs/tutorials/claude_responses_api) 設定 Claude Code 與 litellm，並將上述 guardrail 部分加入您的 litellm 組態。Cygnal 原生支援編碼代理程式政策防護。請在平台上定義您自己的政策，或使用提供的編碼政策。我們上方展示的範例組態也是 Claude Code 的建議設定（將 `policy_id` 替換為適當值）。

---

## 透過 `extra_body` 進行每次請求覆寫 {#per-request-overrides-via-extra_body}

您可以透過傳入 `litellm_metadata.guardrails[*].grayswan.extra_body`，在每個請求層級覆寫 Gray Swan guardrail 組態的部分設定。

`extra_body` 會合併到 Cygnal 請求主體中，且會優先於來自 `config.yaml` 的特定欄位，而這些欄位為 `policy_id`、`violation_threshold` 和 `reasoning_mode`。

如果您在 `extra_body` 內包含一個 `metadata` 欄位，它會原樣轉送至 Cygnal API，並作為請求主體中的 `metadata` 欄位。

範例：

```bash
curl -X POST "http://0.0.0.0:4000/v1/messages?beta=true" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/anthropic/{{anthropic}}",
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
    model="openrouter/anthropic/{{anthropic}}",
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
    model="openrouter/anthropic/{{anthropic}}",
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

注意事項：

- guardrail 名稱（例如 `cygnal-monitor`）必須與 `config.yaml` 中的 `guardrail_name` 相符。
- 視您的 proxy 設定而定，每個請求的 guardrail 覆寫可能需要進階授權。

---

## 組態參考 {#configuration-reference}

| 參數                             | 類型            | 說明 |
|---------------------------------------|-----------------|-------------|
| `api_key`                             | string          | Gray Swan Cygnal API 金鑰。若省略，則從 `GRAYSWAN_API_KEY` 讀取。 |
| `api_base`                            | string          | Gray Swan API 基底 URL 的覆寫。預設為 `https://api.grayswan.ai` 或 `GRAYSWAN_API_BASE`。 |
| `mode`                                | string or list  | Guardrail 階段（`pre_call`、`during_call`、`post_call`）。 |
| `optional_params.on_flagged_action`   | string          | `monitor`（僅記錄）、`block`（拋出 `HTTPException`），或 `passthrough`（以違規訊息取代回應內容，不回傳 400 錯誤）。 |
| `optional_params.violation_threshold` | number (0-1)    | 大於或等於此值的分數會被視為違規。 |
| `optional_params.reasoning_mode`      | string          | `off`、`hybrid`，或 `thinking`。啟用 Cygnal 的推理能力。 |
| `optional_params.categories`          | object          | 自訂類別名稱與描述的對應表。 |
| `optional_params.policy_id`           | string          | Gray Swan 政策識別碼。 |
| `guardrail_timeout`                   | number          | Cygnal 請求的逾時秒數。預設為 30。 |
| `fail_open`                           | boolean         | 若為 true，與 Cygnal 通訊時發生的錯誤會被記錄且請求會繼續；若為 false，錯誤會向上傳遞。預設為 true。 |
| `streaming_end_of_stream_only`        | boolean         | 對於串流 `post_call`，僅將最終組合完成的回應傳送給 Cygnal。預設為 false。 |
| `default_on`                          | boolean         | 預設對每個請求執行 guardrail。 |
