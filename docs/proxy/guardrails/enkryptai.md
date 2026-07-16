import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# EnkryptAI 防護欄 {#enkryptai-guardrails}

LiteLLM 支援 EnkryptAI 防護欄，用於 LLM 輸入與輸出的內容審核和安全檢查。

## 快速入門 {#quick-start}

### 1. 在您的 LiteLLM config.yaml 中定義防護欄 {#1-define-guardrails-on-your-litellm-configyaml}

請在 `guardrails` 區段下定義您的防護欄：

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "enkryptai-guard"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      detectors:
        toxicity:
          enabled: true
        nsfw:
          enabled: true
        pii:
          enabled: true
          entities: ["email", "phone", "secrets"]
        injection_attack:
          enabled: true
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` - 在 LLM 請求**之前**執行，針對**輸入**
- `post_call` - 在 LLM 請求**之後**執行，針對**輸出**
- `during_call` - 在 LLM 請求**期間**執行，針對**輸入**。與 `pre_call` 相同，但會與 LLM 請求並行執行

#### 可用偵測器 {#available-detectors}

EnkryptAI 支援多種內容偵測類型：

- **toxicity** - 偵測有害語言
- **nsfw** - 偵測 NSFW（非工作場合適合）內容
- **pii** - 偵測可識別個人身分資訊
  - 設定實體：`["pii", "email", "phone", "secrets", "ip_address", "url"]`
- **injection_attack** - 偵測提示注入嘗試
- **keyword_detector** - 偵測自訂關鍵字／片語
- **policy_violation** - 偵測政策違規
- **bias** - 偵測帶有偏見的內容
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

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫" value="allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
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
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "My email is test@example.com and my SSN is 123-45-6789"}
    ],
    "guardrails": ["enkryptai-guard"]
  }'
```

**失敗時的預期回應：HTTP 400 錯誤**

```json
{
  "error": {
    "message": {
      "error": "Content blocked by EnkryptAI guardrail",
      "detected": true,
      "violations": ["pii"],
      "response": {
        "summary": {
          "pii": 1
        },
        "details": {
          "pii": {
            "detected": ["email", "ssn"]
          }
        }
      }
    },
    "type": "None",
    "param": "None",
    "code": "400"
  }
}
```

</TabItem>
</Tabs>

## 影片導覽 {#video-walkthrough}

<iframe width="840" height="500" src="https://www.loom.com/embed/ff222211e0864937aee4aeef0f28c3b7" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

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
      detectors:
        toxicity:
          enabled: true
```

### 使用部署 {#using-deployments}

指定 EnkryptAI 部署：

```yaml
guardrails:
  - guardrail_name: "enkryptai-deployment"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      deployment_name: "production"  # Sent via X-Enkrypt-Deployment header
      detectors:
        toxicity:
          enabled: true
```

### 監控模式（記錄但不阻擋） {#monitor-mode-logging-without-blocking}

將 `block_on_violation: false` 設為在不阻擋請求的情況下記錄違規：

```yaml
guardrails:
  - guardrail_name: "enkryptai-monitor"
    litellm_params:
      guardrail: enkryptai
      mode: "pre_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      block_on_violation: false  # Log violations but don't block
      detectors:
        toxicity:
          enabled: true
        nsfw:
          enabled: true
```

在監控模式中，所有違規都會被記錄，但請求永遠不會被阻擋。

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
      detectors:
        pii:
          enabled: true
          entities: ["email", "phone", "ssn"]
        injection_attack:
          enabled: true

  # Output guardrail
  - guardrail_name: "enkryptai-output"
    litellm_params:
      guardrail: enkryptai
      mode: "post_call"
      api_key: os.environ/ENKRYPTAI_API_KEY
      detectors:
        toxicity:
          enabled: true
        nsfw:
          enabled: true
```

## 設定選項 {#configuration-options}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `api_key` | string | EnkryptAI API 金鑰 | `ENKRYPTAI_API_KEY` 環境變數 |
| `api_base` | string | EnkryptAI API base URL | `https://api.enkryptai.com` |
| `policy_name` | string | 自訂政策名稱（透過 `x-enkrypt-policy` 標頭傳送） | None |
| `deployment_name` | string | 部署名稱（透過 `X-Enkrypt-Deployment` 標頭傳送） | None |
| `detectors` | object | 偵測器設定 | `{}` |
| `block_on_violation` | boolean | 在違規時阻擋請求 | `true` |
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

- **API 失敗**：記錄錯誤並引發例外
- **速率限制（429）**：記錄錯誤並引發例外
- **無效設定**：初始化時引發 `ValueError`

將 `block_on_violation: false` 設為即使偵測到違規也繼續處理（監控模式）。

## 支援 {#support}

如需更多關於 EnkryptAI 的資訊：
- 文件：[https://docs.enkryptai.com](https://docs.enkryptai.com)
- 網站：[https://enkryptai.com](https://enkryptai.com)
