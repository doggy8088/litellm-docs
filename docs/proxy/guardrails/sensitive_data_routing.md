import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 敏感資料路由（內建防護欄） {#sensitive-data-routing-built-in-guardrail}

**內建防護欄**，可偵測請求中的敏感資料，並將其重新路由到地端模型，而不是阻擋或去識別化。無需外部相依項目。

**何時使用？** 當敏感提示必須由地端模型而非雲端提供者提供，且使用者工作流程必須維持不中斷時。

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | 透過 regex／關鍵字比對偵測敏感資料，並將請求重新路由到地端模型。一旦在某個工作階段中出現敏感資料，該工作階段後續的每一輪也都會路由到地端。 |
| 防護欄名稱 | `sensitive_data_routing` |
| 偵測方式 | 預建 regex 模式、自訂 regex、關鍵字比對 |
| 動作 | 重新路由到地端模型（永不阻擋或去識別化） |
| 支援模式 | `pre_call` |
| 效能 | 快速；本機執行，無外部 API 呼叫 |

## 運作方式 {#how-it-works}

此防護欄會在模型選擇之前執行。每次請求時，它會使用您設定的模式與關鍵字掃描訊息中的敏感資料。當找到符合項目時，它會將目標模型改寫為您的 `on_premise_model`，使請求由地端提供。提示詞會原樣傳送，因此不會阻擋或去識別化，對話也能維持順暢。

啟用 `sticky_session`（預設值）後，當某個工作階段第一次偵測到敏感資料時，該工作階段就會固定在地端模型上。之後該工作階段中的每一輪也都會路由到地端，即使內容不含敏感資料也一樣，因此曾經接觸過敏感資料的對話永遠不會離開地端模型。固定機制仰賴用戶端送出的穩定 session id（請參閱 [工作階段黏著性](#session-stickiness)）。

`on_premise_model` 只是您 `model_list` 中的一個模型群組。請將它指向您執行的任何地端部署（vLLM、Ollama、自架的 OpenAI 相容端點等）。

## 快速入門 {#quick-start}

### 步驟 1：在 config.yaml 中定義防護欄和地端模型 {#step-1-define-the-guardrail-and-an-on-premise-model-in-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: cloud-model
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: on-prem-model
    litellm_params:
      model: hosted_vllm/meta-llama/Llama-3.1-8B-Instruct
      api_base: http://your-on-prem-host:8000/v1

guardrails:
  - guardrail_name: "sensitive-data-routing"
    litellm_params:
      guardrail: sensitive_data_routing
      mode: "pre_call"
      default_on: true

      # The model group (from model_list above) to route sensitive requests to
      on_premise_model: "on-prem-model"

      # Built-in detectors
      prebuilt_patterns:
        - us_ssn
        - credit_card
        - email
      regex_patterns:
        - "project\\s+titan"
      keywords:
        - confidential
        - internal only

      # Keep the whole session on-premise once sensitive data is seen
      sticky_session: true
      session_ttl_seconds: 14400
```

### 步驟 2：啟動 proxy {#step-2-start-the-proxy}

```bash
litellm --config config.yaml --detailed_debug
```

### 步驟 3：送出乾淨的請求（由雲端模型提供） {#step-3-send-a-clean-request-served-by-the-cloud-model}

```bash showLineNumbers
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cloud-model",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "metadata": {"session_id": "abc-123"}
  }'
```

回應中的 `model` 欄位會反映雲端模型。

### 步驟 4：送出含有敏感資料的請求（重新路由到地端） {#step-4-send-a-request-with-sensitive-data-rerouted-on-premise}

```bash showLineNumbers
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cloud-model",
    "messages": [{"role": "user", "content": "My SSN is 123-45-6789, summarize my record"}],
    "metadata": {"session_id": "abc-123"}
  }'
```

請求會由 `on-prem-model` 提供。由於 `sticky_session` 已開啟且使用相同的 `session_id`，`abc-123` 上之後的每一個請求也都會由地端提供，即使不含敏感資料也一樣。

## 設定 {#configuration}

| 參數 | 型別 | 預設值 | 說明 |
|-------|------|---------|-------------|
| `on_premise_model` | string | 必填 | 要將敏感請求路由到的模型群組（來自 `model_list`） |
| `prebuilt_patterns` | list[string] | none | 要比對的內建模式名稱（例如 `us_ssn`、`credit_card`、`email`）。與 [LiteLLM Content Filter](./litellm_content_filter) 使用相同的函式庫 |
| `regex_patterns` | list[string] | none | 自訂 regular expressions；任一訊息中符合即重新路由該請求 |
| `keywords` | list[string] | none | 不區分大小寫的關鍵字；任一訊息中符合即重新路由該請求 |
| `sticky_session` | bool | `true` | 在首次偵測到敏感資料後，讓整個工作階段維持在地端 |
| `session_ttl_seconds` | int | `14400` | 偵測後工作階段在地端固定的持續時間 |

至少需要 `prebuilt_patterns`、`regex_patterns` 或 `keywords` 其中之一。

## 工作階段黏著性 {#session-stickiness}

黏著性會在首次偵測後將工作階段固定到地端模型。工作階段是透過請求中的 `litellm_session_id`、`metadata.session_id` 或 `litellm_metadata.session_id` 識別，因此用戶端必須在各輪之間傳送穩定的 id，黏著性才會生效。

當 proxy 上設定了 Redis 快取時，這個固定狀態會在所有 proxy worker 與執行個體之間共享，因此黏著性會套用到整個部署，而不只是單一 worker。

如果沒有傳送 session id，則每一輪仍會獨立評估，因此任何本身包含敏感資料的輪次都會路由到地端；沒有 session id 的輪次不會在整個對話期間被固定。
