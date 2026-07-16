import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# IBM 防護欄 {#ibm-guardrails}

LiteLLM 可搭配 [IBM 的 FMS Guardrails](https://github.com/foundation-model-stack/fms-guardrails-orchestrator) 進行內容安全防護。您可以用它來偵測 jailbreak、PII、仇恨言論等。 

## 其功能 {#what-it-does}

IBM 的 FMS Guardrails 是一個用於在 LLM 輸入與輸出上呼叫偵測器的框架。若要設定這些偵測器，您可以例如使用 [TrustyAI detectors](https://github.com/trustyai-explainability/guardrails-detectors)，這是一個由 Red Hat 的 [TrustyAI team](https://github.com/trustyai-explainability) 維護的開源專案，可讓使用者設定以下類型的偵測器： 

- regex patterns
- file type validators
- custom Python functions
- Hugging Face [AutoModelForSequenceClassification](https://huggingface.co/docs/transformers/en/model_doc/auto#transformers.AutoModelForSequenceClassification)，也就是 sequence classification models

每個偵測器都會根據以下 [openapi schema](https://foundation-model-stack.github.io/fms-guardrails-orchestrator/docs/api/openapi_detector_api.yaml) 輸出一個 API 回應。 

您可以執行這些檢查：
- 在送出到 LLM 之前（針對使用者輸入）
- 在取得 LLM 回應之後（針對輸出）  
- 在呼叫期間（與 LLM 平行）

## 快速入門 {#quick-start}

### 1. 將其加入您的 config.yaml {#1-add-to-your-configyaml}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: ibm-jailbreak-detector
    litellm_params:
      guardrail: ibm_guardrails
      mode: pre_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "jailbreak-detector"
      is_detector_server: true
      default_on: true
      optional_params:
        score_threshold: 0.8
        block_on_detection: true
```

### 2. 設定您的驗證權杖 {#2-set-your-auth-token}

```bash
export IBM_GUARDRAILS_AUTH_TOKEN="your-token"
```

### 3. 啟動 proxy {#3-start-the-proxy}

```shell
litellm --config config.yaml --detailed_debug
```

### 4. 發出請求 {#4-make-a-request}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "guardrails": ["ibm-jailbreak-detector"]
  }'
```

## 組態 {#configuration}

### 必要參數 {#required-params}

- `guardrail` - str - 設為 `ibm_guardrails`
- `auth_token` - str - 您的 IBM Guardrails auth token。可使用 `os.environ/IBM_GUARDRAILS_AUTH_TOKEN`
- `base_url` - str - 您的 IBM Detector 或 Guardrails 伺服器的 URL 
- `detector_id` - str - 要使用哪個 detector（例如「jailbreak-detector」、「pii-detector」）

### 可選參數 {#optional-params}

- `mode` - str or list[str] - 何時執行。選項：`pre_call`、`post_call`、`during_call`。預設值：`pre_call`
- `default_on` - bool - 自動執行，無須在請求中指定。預設值：`false`
- `is_detector_server` - bool - `true` 代表 detector server，`false` 代表 orchestrator。預設值：`true`
- `verify_ssl` - bool - 是否驗證 SSL 憑證。預設值：`true`

### optional_params {#optional_params}

這些項目應放在 `optional_params` 下：

- `detector_params` - dict - 要傳遞給您的 detector 的參數
- `extra_headers` - dict - 要注入到送往 IBM Guardrails 請求中的額外標頭，以鍵值 dict 形式提供。
- `score_threshold` - float - 僅計入高於此分數的偵測結果（0.0 到 1.0）
- `block_on_detection` - bool - 當發現違規時封鎖請求。預設值：`true`

## 伺服器類型 {#server-types}

IBM Guardrails 有兩個 API 可供您使用：

### Detector Server（建議） {#detector-server-recommended}

[這個 Detectors API](https://foundation-model-stack.github.io/fms-guardrails-orchestrator/?urls.primaryName=Detector+API#/Text) 使用 `api/v1/text/contents` 端點來執行單一 detector；它可以在單一請求中接受多個文字輸入。 

```yaml
guardrails:
  - guardrail_name: ibm-detector
    litellm_params:
      guardrail: ibm_guardrails
      mode: pre_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "jailbreak-detector"
      is_detector_server: true  # Use detector server
```

### Orchestrator {#orchestrator}

如果您使用的是 IBM FMS Guardrails Orchestrator，您可以使用 [FMS Orchestrator API](https://foundation-model-stack.github.io/fms-guardrails-orchestrator/?urls.primaryName=Orchestrator+API)，特別是透過運用 `api/v2/text/detection/content`，在單一請求中可能執行多個 detector；不過，這個端點每個請求只能接受一個文字輸入。

```yaml
guardrails:
  - guardrail_name: ibm-orchestrator
    litellm_params:
      guardrail: ibm_guardrails
      mode: pre_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-orchestrator-server.com"
      detector_id: "jailbreak-detector"
      is_detector_server: false  # Use orchestrator
```

## 範例 {#examples}

### 檢查輸入中的越獄攻擊 {#check-for-jailbreaks-on-input}

```yaml
guardrails:
  - guardrail_name: jailbreak-check
    litellm_params:
      guardrail: ibm_guardrails
      mode: pre_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "jailbreak-detector"
      is_detector_server: true
      default_on: true
      optional_params:
        score_threshold: 0.8
```

### 檢查回應中的 PII {#check-for-pii-in-responses}

```yaml
guardrails:
  - guardrail_name: pii-check
    litellm_params:
      guardrail: ibm_guardrails
      mode: post_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "pii-detector"
      is_detector_server: true
      optional_params:
        score_threshold: 0.5  # Lower threshold for PII
        block_on_detection: true
```

### 執行多個偵測器 {#run-multiple-detectors}

```yaml
guardrails:
  - guardrail_name: jailbreak-check
    litellm_params:
      guardrail: ibm_guardrails
      mode: pre_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "jailbreak-detector"
      is_detector_server: true
      
  - guardrail_name: pii-check
    litellm_params:
      guardrail: ibm_guardrails
      mode: post_call
      auth_token: os.environ/IBM_GUARDRAILS_AUTH_TOKEN
      base_url: "https://your-detector-server.com"
      detector_id: "pii-detector"
      is_detector_server: true
```

然後在您的請求中：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "guardrails": ["jailbreak-check", "pii-check"]
  }'
```

## 偵測如何運作 {#how-detection-works}

當 IBM Guardrails 找到內容時，它會回傳關於所找到項目的詳細資訊：

```json
{
  "start": 0,
  "end": 31,
  "text": "You are now in Do Anything Mode",
  "detection_type": "jailbreak",
  "score": 0.858
}
```

- `score` - 它有多有信心（0.0 到 1.0）
- `text` - 觸發它的特定文字
- `detection_type` - 違規類型

如果分數高於您的 `score_threshold`，請求就會被封鎖（如果 `block_on_detection` 為 true）。

## 延伸閱讀 {#further-reading}

- [依 API 金鑰控制 Guardrails](./quick_start#-control-guardrails-per-api-key)
- [GitHub 上的 IBM FMS Guardrails](https://github.com/foundation-model-stack/fms-guardrails-orchestr8)
