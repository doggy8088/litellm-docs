import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LLM Shield Proxy {#llm-shield-proxy}

LLM Shield Proxy guardrail 會在每個請求送達模型前，以真實的替代值取代其中的個人資料，然後在回應中把原始值放回來。這些替代值以及其背後的值都保存在您自己的 [LLM Shield Proxy](https://github.com/ninadphalak/LLM-Shield-Proxy) 部署中的 session vault 內，因此提供者永遠不會收到原始值，而呼叫端仍會看到它們。

由於這種替換是可逆的，因此兩個部分必須放在同一個 guardrail 項目上：`pre_call` 會將請求去識別化，而 `post_call` 會還原回應。僅使用 `pre_call` 時，請求會被去識別化，而替代值會直接回傳給呼叫端。LLM Shield Proxy 的 Admin UI 預設值會同時設定這兩種模式。

該 guardrail 會在失敗時封閉。若您的 Shield 部署無法連線、逾時，或回傳錯誤狀態，請求會被封鎖而不是轉送，因為若一個去識別化 guardrail 失敗時開放，原本為了保護資料而存在的 guardrail 反而會把那些資料送給提供者。

它支援 `/v1/chat/completions`、`/v1/completions`、`/v1/responses` 與 `/v1/messages`，包含串流與非串流。

## 快速開始 {#quick-start}

### 1. 執行 LLM Shield Proxy {#1-run-llm-shield-proxy}

```shell
docker run -d --name llm-shield -p 8000:8000 \
  -e VALID_VIRTUAL_KEYS=sk-shield-change-me \
  ghcr.io/ninadphalak/llm-shield-proxy:latest
```

`VALID_VIRTUAL_KEYS` 是 LiteLLM 提供給 Shield 的金鑰。還原值會回傳明文，因此 Shield 在沒有這個金鑰時會拒絕 guardrail 呼叫。Shield 也可在 PyPI 上以 `llm-shield-proxy` 取得。

### 2. 將 LLM Shield Proxy 加入您的 LiteLLM config.yaml {#2-add-llm-shield-proxy-to-your-litellm-configyaml}

```yaml title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: llm-shield
    litellm_params:
      guardrail: llm_shield_proxy
      mode: [pre_call, post_call]
      default_on: true
      api_base: http://localhost:8000
      api_key: os.environ/LLM_SHIELD_PROXY_API_KEY
```

相同欄位也可在 Admin UI 的 **Guardrails > Add Guardrail > LLM Shield Proxy** 下找到。

### 3. 啟動 LiteLLM Proxy {#3-start-litellm-proxy}

```shell
export OPENAI_API_KEY=sk-...
export LLM_SHIELD_PROXY_API_KEY=sk-shield-change-me
litellm --config config.yaml
```

### 4. 發出您的第一個請求 {#4-make-your-first-request}

<Tabs>
<TabItem label="已去識別化並還原" value="restored">

```shell
curl -sSLX POST 'http://0.0.0.0:4000/v1/chat/completions' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
  "model": "{{openai_small}}",
  "messages": [
    {"role": "user", "content": "Repeat exactly: email jane.doe@example.com about card 4111 1111 1111 1111"}
  ]
}'
```

提供者會收到如 `john10@example.net` 與 `6567211639751374` 之類的替代值，分別取代地址與卡號。您收到的回應則會再次帶回 `jane.doe@example.com` 與 `4111 1111 1111 1111`。

</TabItem>
<TabItem label="串流" value="streaming">

```shell
curl -sSLX POST 'http://0.0.0.0:4000/v1/chat/completions' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
  "model": "{{openai_small}}",
  "stream": true,
  "messages": [
    {"role": "user", "content": "Repeat exactly: email jane.doe@example.com"}
  ]
}'
```

Token 會在送達時立即轉送，而不是緩衝到回應結尾。Shield 只會暫留那些仍可能屬於替代值結尾的字元，因此跨越兩個區塊切開的值會完整還原，且不會以片段形式輸出。

</TabItem>
<TabItem label="Shield 無法連線" value="blocked">

```json
{
  "error": {
    "message": "Guardrail raised an exception, Guardrail: llm-shield, Message: LLM Shield Proxy is unreachable; blocking the request.",
    "type": "invalid_request_error",
    "param": null,
    "code": "400"
  }
}
```

</TabItem>
</Tabs>

## 什麼會被去識別化，什麼會被還原 {#what-is-redacted-and-what-is-restored}

在請求端，guardrail 會收集聊天中的訊息文字與工具呼叫引數、Responses `input`、Completions `prompt` 與 `suffix`，以及 Anthropic 訊息，包括巢狀工具結果。也會遍歷：Anthropic 文件部分（其 `title`、`context`，以及 `text` 來源的文字）、Responses function-call 輸出（一個字串或 `output_text` 部分）、自訂 tool-call `input`、code-interpreter `code`、型別化的 prompt 變數，以及 `extra_body` 底下的任何內容，LiteLLM 會在送出轉換後的請求前將其合併進來。若那裡存在未去識別化的 `messages` 或 `system`，就會在傳輸中取代已去識別化的那個。每個請求都會得到 LiteLLM 新建立且以程序命名空間隔離的 vault id；呼叫端送出的任何內容都不會被用來命名 vault，因此呼叫端無法透過讓替代值被回顯來取得其他請求的值。

應用程式寫入而非呼叫端輸入的文字，會被去識別化到第二個 vault，而這個 vault 不會被還原：`system` 與 `developer` turns、Responses `input` 中的 `system` 與 `developer` 項目、Anthropic 的頂層 `system`、Responses `instructions`、工具描述與參數 schema、結構化輸出 schema、web-search 使用者位置，以及 `user` 與 `safety_identifier` 欄位。例外是 schema 中的 `enum` 與 `const` 值，這些會送到呼叫端的 vault，因此使用它們的工具呼叫或結構化輸出會帶著真實值回來。若請求在遍歷上限之外還更深一層，系統會拒絕而非只部分未去識別化地轉送。

在回應端，guardrail 會還原訊息內容、工具呼叫引數、Completions `text`、Anthropic 文字與 `tool_use` 輸入，以及 Responses 輸出項目，包含完整回應與串流。每一個串流（每個 choice 的內容、每個 tool call、每個 Anthropic content block、每個 Responses delta family）都保有自己的視窗，因此為一個串流暫留的文字不會進入另一個串流。圖片與音訊部分不含文字，會原樣通過。

## 在 LiteLLM SDK 中使用 {#using-it-with-the-litellm-sdk}

在 proxy 之外，請將該 guardrail 作為 model-level callback 掛上，並在每次呼叫時指定名稱。請求會在 deployment pre-call hook 中被去識別化，而回應則在 deployment post-call hook 中被還原：

```python
import litellm
from litellm.proxy.guardrails.guardrail_hooks.llm_shield_proxy import LLMShieldProxyGuardrail

litellm.callbacks.append(
    LLMShieldProxyGuardrail(
        api_base="http://localhost:8000",
        api_key="sk-shield-change-me",
        event_hook=["pre_call", "post_call"],
    )
)

response = await litellm.acompletion(
    model="openai/gpt-4.1-mini",
    messages=[{"role": "user", "content": "Email jane.doe@example.com the invoice"}],
    guardrails=["llm_shield_proxy"],
)
```

傳給 `guardrails` 的名稱必須與 guardrail 的 `guardrail_name` 相符（除非您自訂，否則為 `llm_shield_proxy`）。此路徑有兩項限制：

- **不支援串流。** SDK 串流沒有任何東西會將其還原，因此此處的 `stream=True` 請求會以 `LLM Shield Proxy cannot restore a streamed reply for a model-level guardrail outside the LiteLLM proxy` 失敗封閉。請透過 proxy 傳送串流請求，proxy 會逐步還原它們。
- **回應快取會被略過。** 快取命中會在任何 post-call hook 執行之前返回，而在還原後儲存的回應會把一位呼叫端的值交給下一位其已去識別化請求相符的呼叫端，因此 model-level guardrail 請求不會從快取讀取，也不會寫入快取。

## 透過 proxy 的快取與遙測 {#caching-and-telemetry-through-the-proxy}

透過 proxy，LiteLLM 會快取已去識別化的回應。還原發生在快取寫入之後，因此回應快取永遠不會持有明文。guardrail 遙測同樣會記錄 guardrail 傳送的替代值，而不是已還原的值。

## 支援的參數 {#supported-parameters}

| 參數 | 預設值 | 說明 |
|---|---|---|
| `api_base` | `http://localhost:8000` | 您的 LLM Shield Proxy 部署的 Base URL。預設會回退至 `LLM_SHIELD_PROXY_API_BASE` |
| `api_key` | `None` | Shield 的 `VALID_VIRTUAL_KEYS` 之一，作為 bearer credential 傳送。預設會回退至 `LLM_SHIELD_PROXY_API_KEY` |

每次對 Shield 的呼叫都會在 10 秒後逾時，而逾時會像其他 Shield 失敗一樣封鎖請求。

## 支援的模式 {#supported-modes}

| 模式 | 功能 |
|---|---|
| `pre_call` | 以保存在您 Shield 部署內部 vault 的替代值，取代請求中的個人資料 |
| `post_call` | 還原回應中的原始值，包含串流與非串流。vault 會留在您的部署中；LiteLLM 絕不儲存明文 |

## 延伸閱讀 {#further-reading}

- [GitHub 上的 LLM Shield Proxy](https://github.com/ninadphalak/LLM-Shield-Proxy)
- [PyPI 上的 llm-shield-proxy](https://pypi.org/project/llm-shield-proxy/)
