import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# EnkryptAI 防護欄 {#enkryptai-guardrails}

LiteLLM 支援 EnkryptAI 防護欄，用於 LLM 輸入與輸出的內容審核和安全檢查。

## 快速入門 {#quick-start}

### 1. 在您的 LiteLLM config.yaml 中定義防護欄 {#1-define-guardrails-on-your-litellm-configyaml}

請在 `guardrails` 區段下定義您的防護欄：

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "enkryptai-guard"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      policy_name: "my-policy"  # EnkryptAI policy that defines which detectors run
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` - 在 LLM 請求**之前**執行，針對**輸入**
- `post_call` - 在 LLM 請求**之後**執行，針對**輸出**
- `during_call` - 在 LLM 請求**期間**執行，針對**輸入**。與 `pre_call` 相同，但會與 LLM 請求並行執行

#### 可用偵測器 {#available-detectors}

偵測器是透過 `policy_name` 所參照的 EnkryptAI 原則進行設定，而不是在 LiteLLM 設定中。LiteLLM 只會傳送文字以及 `x-enkrypt-policy` 標頭，因此 `litellm_params` 下方的 `detectors:` 區塊不會生效。EnkryptAI 原則支援以下偵測類型：

- **toxicity** - 偵測有害語言
- **nsfw** - 偵測 NSFW（不適合在工作場所觀看）內容
- **pii** - 偵測個人可識別資訊
  - 原則中可設定的實體：`["pii", "email", "phone", "secrets", "ip_address", "url"]`
- **injection_attack** - 偵測提示詞注入嘗試
- **keyword_detector** - 偵測自訂關鍵字／片語
- **policy_violation** - 偵測原則違規
- **bias** - 偵測偏頗內容
- **sponge_attack** - 偵測 sponge 攻擊

### 2. 設定環境變數 {#2-set-environment-variables}

```bash
export ENKRYPTAI_API_KEY="your-api-key"
```

### 3. 啟動 LiteLLM 閘道 {#3-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 4. 測試請求 {#4-test-request}

**[Langchain, OpenAI SDK 使用範例](/docs/proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫" value="allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "Hello, how can you help me today?"}
    ],
    "guardrails": ["enkryptai-guard"]
  }'
```

**回應：HTTP 200 成功**

內容通過所有偵測器檢查，並被允許通過。

</TabItem>

<TabItem label="失敗呼叫" value="not-allowed">

若內容違反偵測器政策，預期會失敗：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "My email is test@example.com and my SSN is 123-45-6789"}
    ],
    "guardrails": ["enkryptai-guard"]
  }'
```

**失敗時的預期回應：HTTP 500 錯誤**

`message` 是一個純字串，列出每一項違規，其詳細資訊來自 EnkryptAI 回應。

```json
{
  "error": {
    "message": "Guardrail failed: 1 violation(s) detected\n\n- PII:\n  PII Detected: {'email': ['test@example.com']}",
    "type": "internal_server_error",
    "param": null,
    "code": "500"
  }
}
```

</TabItem>
</Tabs>

## 影片導覽 {#video-walkthrough}

<iframe width="840" height="500" src="https://www.loom.com/embed/ff222211e0864937aee4aeef0f28c3b7" frameBorder="0" allowFullScreen></iframe>

## 進階設定 {#advanced-configuration}

### 使用自訂政策 {#using-custom-policies}

您可以指定自訂的 EnkryptAI 政策：

```yaml
guardrails:
  - guardrail_name: "enkryptai-custom"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      policy_name: "my-custom-policy"  # Sent via x-enkrypt-policy header
```

偵測完全由 `policy_name` 所參照的原則控制；LiteLLM 只會將文字與此標頭傳送至 EnkryptAI，因此每個偵測器的設定都必須在 EnkryptAI 原則本身中設定。任何偵測到的違規都會封鎖請求。

### 輸入與輸出防護欄 {#input-and-output-guardrails}

為輸入與輸出分別設定防護欄：

```yaml
guardrails:
  # Input guardrail
  - guardrail_name: "enkryptai-input"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      policy_name: "my-input-policy"

  # Output guardrail
  - guardrail_name: "enkryptai-output"
    litellm_params:
      guardrail: enkryptai
      mode: "post_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      policy_name: "my-output-policy"
```

## 設定選項 {#configuration-options}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `api_key` | string | EnkryptAI API 金鑰 | `ENKRYPTAI_API_KEY` 環境變數 |
| `api_base` | string | EnkryptAI API 基礎 URL | `https://api.enkryptai.com` |
| `policy_name` | string | 自訂原則名稱（透過 `x-enkrypt-policy` 標頭傳送） | 無 |
| `mode` | string | 執行時機：`pre_call`、`post_call` 或 `during_call` | 必填 |

## 可觀測性 {#observability}

EnkryptAI 防護欄記錄包含：

- **guardrail_status**：`success`、`guardrail_intervened` 或 `guardrail_failed_to_respond`
- **guardrail_provider**：`enkryptai`
- **guardrail_json_response**：包含偵測詳細資訊的完整 API 回應
- **duration**：防護欄檢查所花費的時間
- **start_time** 和 **end_time**：時間戳記

這些記錄可透過您設定的 LiteLLM 記錄回呼取得。

## 錯誤處理 {#error-handling}

此防護欄會妥善處理錯誤：

- **API 故障**：記錄錯誤並擲出例外
- **速率限制（429）**：記錄錯誤並擲出例外
- **無效設定**：初始化時擲出 `ValueError`
- **偵測到違規**：擲出例外並封鎖請求

## 支援 {#support}

如需更多關於 EnkryptAI 的資訊：
- 文件：[https://docs.enkryptai.com](https://docs.enkryptai.com)
- 網站：[https://enkryptai.com](https://enkryptai.com)
